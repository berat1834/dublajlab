import { useRef, useState } from 'react'
import { AlertCircle, FileVideo2, UploadCloud } from 'lucide-react'

interface UploadZoneProps {
  onFile: (file: File) => void
  disabled?: boolean
  maxFileSizeMb?: number
  maxDurationSeconds?: number
}

const extensions = ['mp4', 'mov', 'webm']

function isSupported(file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()
  return extension ? extensions.includes(extension) : false
}

export function UploadZone({
  onFile,
  disabled = false,
  maxFileSizeMb = 50,
  maxDurationSeconds = 60,
}: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [localError, setLocalError] = useState('')

  const acceptFile = (file?: File) => {
    setLocalError('')
    if (!file) return
    if (!isSupported(file)) {
      setLocalError('Desteklenmeyen format. MP4, MOV veya WEBM seçin.')
      return
    }
    if (file.size === 0) {
      setLocalError('Boş video dosyası yüklenemez.')
      return
    }
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      setLocalError(`Video en fazla ${maxFileSizeMb} MB olabilir.`)
      return
    }
    onFile(file)
  }

  return (
    <div>
      <button
        type="button"
        aria-label="Yüklenecek video dosyasını seç"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          acceptFile(event.dataTransfer.files[0])
        }}
        className={`group flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-8 text-center transition disabled:cursor-not-allowed disabled:opacity-60 ${
          isDragging
            ? 'border-lime bg-lime/10'
            : 'border-zinc-700 bg-black/20 hover:border-zinc-500 hover:bg-white/[0.025]'
        }`}
      >
        <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/5 text-lime transition group-hover:scale-105">
          {isDragging ? <FileVideo2 /> : <UploadCloud />}
        </span>
        <span className="font-bold text-zinc-100">
          {isDragging ? 'Videoyu bırak, başlayalım' : 'Videonu buraya sürükle'}
        </span>
        <span className="mt-1 text-sm text-zinc-500">veya bilgisayarından seçmek için tıkla</span>
        <span className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          <span className="rounded-full bg-white/5 px-2.5 py-1">MP4 · MOV · WEBM</span>
          <span className="rounded-full bg-white/5 px-2.5 py-1">En fazla {maxFileSizeMb} MB</span>
          <span className="rounded-full bg-white/5 px-2.5 py-1">En fazla {maxDurationSeconds} sn</span>
        </span>
      </button>
      <input
        ref={inputRef}
        className="hidden"
        type="file"
        accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
        onChange={(event) => {
          acceptFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {localError && (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-xl border border-red-400/15 bg-red-400/[0.06] px-3 py-2.5 text-sm text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" /> {localError}
        </p>
      )}
    </div>
  )
}
