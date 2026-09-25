import sys

file_path = r'c:\src\Meme Dublaj Studio MVP\frontend\src\components\TemplateGallery.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add filter state
state_target = """  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)"""
state_replacement = """  const [templates, setTemplates] = useState<VideoTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('Tümü')"""
content = content.replace(state_target, state_replacement)

# Update return rendering
render_target = """  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-violet" />
        <p className="text-xs font-semibold text-zinc-400">
          {templates.length} hazır sahne · Video dosyası eklendiğinde doğrudan kullanılır
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {templates.map((template) => {"""

render_replacement = """  const categories = ['Tümü', ...Array.from(new Set(templates.map(t => t.category)))]
  const filteredTemplates = filter === 'Tümü' ? templates : templates.filter(t => t.category === filter)

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet" />
          <p className="text-xs font-semibold text-zinc-400">
            {templates.length} hazır sahne · Video dosyası eklendiğinde doğrudan kullanılır
          </p>
        </div>
        
        {categories.length > 1 && (
          <div className="flex shrink-0 gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-bold transition ${
                  filter === c
                    ? 'bg-lime text-ink'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-500">Bu kategoride sahne bulunamadı.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {"""

content = content.replace(render_target, render_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("TemplateGallery updated.")
