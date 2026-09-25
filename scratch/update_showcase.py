import sys

file_path = r'c:\src\Meme Dublaj Studio MVP\frontend\src\App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Dublaj.io to DublajLab
logo_target = """dublaj<span className="text-lime">.io</span>"""
logo_replacement = """Dublaj<span className="text-lime">Lab</span>"""
content = content.replace(logo_target, logo_replacement)

# Update Footer copyright
copyright_target = """© 2026 Dublaj.io"""
copyright_replacement = """© 2026 DublajLab"""
content = content.replace(copyright_target, copyright_replacement)

legal_note_target = """Dublaj.io kullanıcıların gönderdiği içeriklerde"""
legal_note_replacement = """DublajLab kullanıcıların gönderdiği içeriklerde"""
content = content.replace(legal_note_target, legal_note_replacement)

# 2. Add HowToPlay state
state_target = """  const [toastMessage, setToastMessage] = useState('')"""
state_replacement = """  const [toastMessage, setToastMessage] = useState('')
  const [showHowTo, setShowHowTo] = useState(false)

  const handleLegalLink = () => {
    setToastMessage('Bu sayfa (Gizlilik/Şartlar) canlı yayın öncesi profesyonel metinlerle güncellenecektir.')
    setTimeout(() => setToastMessage(''), 4000)
  }"""
content = content.replace(state_target, state_replacement)

# Update Footer links to use handleLegalLink where appropriate
footer_links_target = """            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Yasal</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Gizlilik</button></li>
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Kullanım koşulları</button></li>
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Telif bildirimi</button></li>
              </ul>
            </div>"""
footer_links_replacement = """            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Yasal</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li><button onClick={handleLegalLink} className="hover:text-white">Gizlilik</button></li>
                <li><button onClick={handleLegalLink} className="hover:text-white">Kullanım koşulları</button></li>
                <li><button onClick={handleLegalLink} className="hover:text-white">Telif bildirimi</button></li>
              </ul>
            </div>"""
content = content.replace(footer_links_target, footer_links_replacement)

# Update "Nasıl oynanır" button in Footer
how_to_footer_target = """<li><button onClick={handleFeatureSoon} className="hover:text-white">Nasıl oynanır</button></li>"""
how_to_footer_replacement = """<li><button onClick={() => setShowHowTo(true)} className="hover:text-white">Nasıl oynanır</button></li>"""
content = content.replace(how_to_footer_target, how_to_footer_replacement)

# 3. Add HowToPlay Modal and Dubs / Daily placeholders
tabs_target = """          ) : activeTab === 'dubs' ? (
            <div className="grid min-h-[50vh] place-items-center text-center">
              <div>
                <Film className="mx-auto h-12 w-12 text-zinc-600" />
                <h2 className="mt-4 text-2xl font-bold">Topluluk Dublajları</h2>
                <p className="mt-2 text-zinc-400">Diğer oyuncuların kaydettiği efsane dublajlar canlı sürümde burada olacak.</p>
              </div>
            </div>
          ) : (
            <div className="grid min-h-[50vh] place-items-center text-center">
              <div>
                <Crown className="mx-auto h-12 w-12 text-lime" />
                <h2 className="mt-4 text-2xl font-bold">Günün Dublajı</h2>
                <p className="mt-2 text-zinc-400">Her gün seçilen en iyi topluluk dublajı burada sergilenecek.</p>
              </div>
            </div>
          )}
        </div>
      </main>"""

tabs_replacement = """          ) : activeTab === 'dubs' ? (
            <div className="py-4">
              <div className="mb-8">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Dublajlar</h1>
                <p className="mt-3 text-zinc-400">Topluluğun kaydettiği efsane dublajları keşfet.</p>
                <div className="mt-3 inline-block rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 text-xs text-amber-200/80">
                  ⚠️ Bu alan canlı demo için örnek (placeholder) içeriklerle gösterilmektedir.
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="group overflow-hidden rounded-2xl border border-white/10 bg-surface/80 shadow-card transition hover:border-white/20">
                    <div className="relative aspect-video bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center">
                      <Play className="h-10 w-10 text-white/40 group-hover:text-lime transition" />
                      <span className="absolute top-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white uppercase">Komedi</span>
                      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] tabular-nums text-white">0:15</span>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-white line-clamp-1">Demo Dublaj #{i}</h3>
                      <p className="mt-1 text-xs text-zinc-500">Oyuncu{i}99</p>
                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-zinc-400">
                        <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> {i * 120}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {i * 12}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-4 lg:py-10">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl flex items-center justify-center gap-3">
                  <Crown className="h-8 w-8 text-lime" /> Günün Dublajı
                </h1>
                <p className="mt-3 text-zinc-400">Bugün en çok güldüren performans.</p>
              </div>
              <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-b from-lime/[0.05] to-transparent shadow-glow-lg">
                <div className="relative aspect-video bg-black flex items-center justify-center">
                  <Play className="h-16 w-16 text-lime/50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="inline-block rounded-md bg-lime px-2 py-1 text-xs font-black uppercase text-ink mb-2">Günün Kazananı</span>
                    <h2 className="text-2xl font-bold text-white">Toplantı faciası (Demo)</h2>
                    <p className="mt-1 text-sm text-zinc-400">Seslendiren: EfsaneKral</p>
                  </div>
                </div>
                <div className="p-6 sm:p-8">
                  <p className="text-sm leading-6 text-zinc-300">
                    "Tüm gün süren o toplantı beş dakika sürecek dediler... Sonra herkes kahve molasına çıktı ama mikrofonum açık kalmış!"
                  </p>
                  <div className="mt-6 flex flex-wrap gap-4">
                    <button onClick={handleFeatureSoon} className="rounded-xl bg-lime px-6 py-3 text-sm font-bold text-ink hover:bg-[#d5ff78]">
                      Dublajı İzle
                    </button>
                    <button onClick={() => setActiveTab('play')} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
                      Sen de Seslendir
                    </button>
                  </div>
                  <p className="mt-6 text-xs text-zinc-500 border-t border-white/10 pt-4">
                    * Yakında gerçek topluluk içerikleri eklenecektir. Bu sayfa tasarım demosudur.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* HOW TO PLAY MODAL */}
      {showHowTo && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-panel shadow-2xl p-6 sm:p-8">
            <button onClick={() => setShowHowTo(false)} className="absolute right-4 top-4 text-zinc-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
            <h2 className="text-2xl font-black text-white">Nasıl Oynanır?</h2>
            <p className="mt-2 text-zinc-400">DublajLab'de kendi sesinle eğlenceli videolar üretmek çok kolay.</p>
            
            <div className="mt-8 space-y-6">
              <div className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet/20 text-lg font-black text-violet">1</div>
                <div>
                  <h3 className="font-bold text-zinc-200">Sahne Seç</h3>
                  <p className="mt-1 text-sm text-zinc-500">Sahneler galerisinden bir video seç veya kendi cihazından video yükle.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lime/20 text-lg font-black text-lime">2</div>
                <div>
                  <h3 className="font-bold text-zinc-200">Repliği Oku</h3>
                  <p className="mt-1 text-sm text-zinc-500">Zaman çizelgesindeki replikleri takip et, sıran geldiğinde mikrofonla sesini kaydet.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-400/20 text-lg font-black text-emerald-400">3</div>
                <div>
                  <h3 className="font-bold text-zinc-200">Videoyu İndir</h3>
                  <p className="mt-1 text-sm text-zinc-500">Tüm replikleri kaydettikten sonra sistem otomatik olarak sesi miksler ve MP4 olarak sana sunar.</p>
                </div>
              </div>
            </div>
            
            <button onClick={() => { setShowHowTo(false); setActiveTab('play'); }} className="mt-8 w-full rounded-xl bg-white px-4 py-3 text-sm font-bold text-ink hover:bg-zinc-200">
              Hemen Başla
            </button>
          </div>
        </div>
      )}"""
content = content.replace(tabs_target, tabs_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx showcase pages updated successfully.")
