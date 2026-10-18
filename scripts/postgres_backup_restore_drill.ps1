[CmdletBinding()]
param(
    [switch]$KeepDump,
    [string]$TunnelHost,
    [int]$TunnelPort
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$sourceDatabaseUrl = if ($env:DATABASE_PUBLIC_URL) {
    $env:DATABASE_PUBLIC_URL
}
elseif ($env:DATABASE_URL) {
    $env:DATABASE_URL
}
else {
    throw 'DATABASE_PUBLIC_URL or DATABASE_URL is required. Run this script with Railway variables.'
}

$databaseUri = [Uri]$sourceDatabaseUrl
if ($databaseUri.Scheme -notin @('postgres', 'postgresql')) {
    throw 'The database URL must use the postgres or postgresql scheme.'
}

if (($TunnelHost -and -not $TunnelPort) -or ($TunnelPort -and -not $TunnelHost)) {
    throw 'TunnelHost and TunnelPort must be supplied together.'
}
if ($TunnelHost) {
    $databaseUriBuilder = [UriBuilder]$databaseUri
    $databaseUriBuilder.Host = $TunnelHost
    $databaseUriBuilder.Port = $TunnelPort
    $sourceDatabaseUrl = $databaseUriBuilder.Uri.AbsoluteUri
}
$env:PGSOURCE_URL = $sourceDatabaseUrl

$repoRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$tempRoot = Join-Path $repoRoot '.tmp'
$runId = [Guid]::NewGuid().ToString('N')
$workDir = Join-Path $tempRoot "postgres-restore-drill-$runId"
$dumpPath = Join-Path $workDir 'production.dump'
$containerName = "dublajlab-restore-drill-$runId"
$image = 'postgres:18-alpine'
$databaseName = 'restore_drill'
$databasePassword = [Guid]::NewGuid().ToString('N')
$containerStarted = $false

New-Item -ItemType Directory -Path $workDir -Force | Out-Null

try {
    docker info --format '{{.ServerVersion}}' | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Docker engine is not available.'
    }

    docker pull $image | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Could not pull $image."
    }

    docker run --rm `
        --env PGSOURCE_URL `
        --volume "${workDir}:/backup" `
        $image `
        sh -ec 'pg_dump --dbname="$PGSOURCE_URL" --format=custom --no-owner --no-acl --file=/backup/production.dump'
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $dumpPath)) {
        throw 'Production backup could not be created.'
    }

    $dumpFile = Get-Item -LiteralPath $dumpPath
    if ($dumpFile.Length -le 0) {
        throw 'Production backup is empty.'
    }
    $dumpHash = (Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256).Hash

    docker run --detach `
        --name $containerName `
        --env "POSTGRES_PASSWORD=$databasePassword" `
        --env "POSTGRES_DB=$databaseName" `
        --volume "${workDir}:/backup:ro" `
        $image | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw 'Temporary PostgreSQL container could not be started.'
    }
    $containerStarted = $true

    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        docker exec $containerName pg_isready -U postgres -d $databaseName 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) {
            $ready = $true
            break
        }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) {
        throw 'Temporary PostgreSQL instance did not become ready.'
    }

    docker exec $containerName pg_restore `
        --username=postgres `
        --dbname=$databaseName `
        --no-owner `
        --no-acl `
        --exit-on-error `
        /backup/production.dump
    if ($LASTEXITCODE -ne 0) {
        throw 'Backup restore failed.'
    }

    $publicTableCount = docker exec $containerName psql `
        -X -U postgres -d $databaseName -tA `
        -c "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"
    if ($LASTEXITCODE -ne 0) {
        throw 'Restored database verification query failed.'
    }
    $publicTableCount = [int]$publicTableCount.Trim()
    if ($publicTableCount -le 0) {
        throw 'Restored database has no public tables.'
    }

    $alembicVersion = docker exec $containerName psql `
        -X -U postgres -d $databaseName -tA `
        -c "SELECT CASE WHEN to_regclass('public.alembic_version') IS NULL THEN 'missing' ELSE (SELECT version_num FROM alembic_version LIMIT 1) END;"
    if ($LASTEXITCODE -ne 0) {
        throw 'Alembic verification query failed.'
    }

    $userCount = docker exec $containerName psql `
        -X -U postgres -d $databaseName -tA `
        -c "SELECT CASE WHEN to_regclass('public.users') IS NULL THEN -1 ELSE (SELECT count(*) FROM users) END;"
    if ($LASTEXITCODE -ne 0) {
        throw 'User table verification query failed.'
    }

    [pscustomobject]@{
        Status           = 'PASS'
        PostgreSQLImage  = $image
        DumpBytes        = $dumpFile.Length
        DumpSha256       = $dumpHash
        PublicTableCount = $publicTableCount
        AlembicVersion   = $alembicVersion.Trim()
        UserCount        = [int]$userCount.Trim()
        DumpRetained     = [bool]$KeepDump
    } | Format-List
}
finally {
    Remove-Item Env:PGSOURCE_URL -ErrorAction SilentlyContinue

    if ($containerStarted) {
        docker rm --force $containerName 2>$null | Out-Null
    }

    if (-not $KeepDump -and (Test-Path -LiteralPath $workDir)) {
        $resolvedWorkDir = (Resolve-Path -LiteralPath $workDir).Path
        $resolvedTempRoot = (Resolve-Path -LiteralPath $tempRoot).Path
        if (-not $resolvedWorkDir.StartsWith($resolvedTempRoot + [IO.Path]::DirectorySeparatorChar)) {
            throw "Refusing to remove unexpected path: $resolvedWorkDir"
        }
        Remove-Item -LiteralPath $resolvedWorkDir -Recurse -Force
    }
}
