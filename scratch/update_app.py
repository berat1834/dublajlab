import sys

file_path = r'c:\src\Meme Dublaj Studio MVP\frontend\src\App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
imports_target = """  WandSparkles,
} from 'lucide-react'"""

imports_replacement = """  WandSparkles,
  Menu,
  X,
  Globe,
  MessageSquare,
  Crown,
  Info
} from 'lucide-react'"""

content = content.replace(imports_target, imports_replacement)

# 2. Add Tab and Toast state
state_target = """type DubbingMode = 'my-voice' | 'ai-voice'
type SourceMode = 'upload' | 'templates'"""

state_replacement = """type DubbingMode = 'my-voice' | 'ai-voice'
type SourceMode = 'upload' | 'templates'
type Tab = 'play' | 'scenes' | 'dubs' | 'daily'"""

content = content.replace(state_target, state_replacement)

# 3. Add states to App function
app_state_target = """  const [demoPolicy, setDemoPolicy] = useState<DemoPolicy | null>(null)"""

app_state_replacement = """  const [demoPolicy, setDemoPolicy] = useState<DemoPolicy | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('play')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const handleFeatureSoon = () => {
    setToastMessage('Bu özellik canlı demo sonrasında eklenecek.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleTabTemplateSelect = (templateId: string) => {
    setActiveTab('play');
    void handleTemplateSelect(templateId);
  }"""

content = content.replace(app_state_target, app_state_replacement)

# 4. Replace TemplateGallery onSelect to use handleTabTemplateSelect
template_select_target = """              <TemplateGallery
                selectingId={selectingTemplateId}
                onSelect={(templateId) => void handleTemplateSelect(templateId)}
              />"""
template_select_replacement = """              <TemplateGallery
                selectingId={selectingTemplateId}
                onSelect={handleTabTemplateSelect}
              />"""
content = content.replace(template_select_target, template_select_replacement)

# 5. Wrap the main return and add footer/navbar
return_target = """  return (
    <main className="min-h-screen px-3 py-5 sm:px-6 sm:py-6 lg:py-10">
      <div className="mx-auto max-w-[1440px]">"""

return_replacement = """  return (
    <div className="flex min-h-screen flex-col">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 lg:gap-10">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-xl font-black tracking-tight">
              dublaj<span className="text-[#e1251b]">.io</span>
            </a>
            <div className="hidden items-center gap-6 md:flex text-sm font-medium text-zinc-400">
              <button onClick={() => setActiveTab('play')} className={activeTab === 'play' ? 'text-white' : 'hover:text-white'}>Oyna</button>
              <button onClick={() => setActiveTab('scenes')} className={activeTab === 'scenes' ? 'text-white' : 'hover:text-white'}>Sahneler</button>
              <button onClick={() => setActiveTab('dubs')} className={activeTab === 'dubs' ? 'text-white' : 'hover:text-white'}>Dublajlar</button>
              <button onClick={() => setActiveTab('daily')} className={activeTab === 'daily' ? 'text-white' : 'hover:text-white'}>Günün Dublajı</button>
            </div>
          </div>
          <div className="hidden items-center gap-4 md:flex text-sm font-medium">
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 text-zinc-400 hover:text-white">
              <Globe className="h-4 w-4" /> TR
            </button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 text-zinc-400 hover:text-white">
              <MessageSquare className="h-4 w-4" /> Discord
            </button>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <button onClick={handleFeatureSoon} className="text-zinc-300 hover:text-white">Giriş yap</button>
            <button onClick={handleFeatureSoon} className="rounded-md border border-white/20 px-4 py-1.5 text-white hover:bg-white/10">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 rounded-md bg-[#e3cd93] px-3 py-1.5 font-bold text-black hover:bg-[#ebd59a]">
              <Crown className="h-4 w-4" /> VIP ol
            </button>
          </div>
          <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="border-b border-white/10 bg-black/95 px-4 py-4 md:hidden text-sm font-medium">
          <div className="flex flex-col gap-4 text-zinc-300">
            <button onClick={() => { setActiveTab('play'); setMobileMenuOpen(false); }} className="text-left">Oyna</button>
            <button onClick={() => { setActiveTab('scenes'); setMobileMenuOpen(false); }} className="text-left">Sahneler</button>
            <button onClick={() => { setActiveTab('dubs'); setMobileMenuOpen(false); }} className="text-left">Dublajlar</button>
            <button onClick={() => { setActiveTab('daily'); setMobileMenuOpen(false); }} className="text-left">Günün Dublajı</button>
            <hr className="border-white/10" />
            <button onClick={handleFeatureSoon} className="text-left flex items-center gap-2"><Globe className="h-4 w-4" /> TR</button>
            <button onClick={handleFeatureSoon} className="text-left flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Discord</button>
            <button onClick={handleFeatureSoon} className="text-left">Giriş yap</button>
            <button onClick={handleFeatureSoon} className="text-left">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="text-left text-[#e3cd93] flex items-center gap-2"><Crown className="h-4 w-4" /> VIP ol</button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-indigo-500 text-white px-4 py-2 text-sm shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <Info className="h-4 w-4" />
          {toastMessage}
        </div>
      )}

      <main className="flex-1 px-3 py-5 sm:px-6 sm:py-6 lg:py-10">
        <div className="mx-auto max-w-[1440px]">
          {activeTab === 'play' ? (
            <>"""

content = content.replace(return_target, return_replacement)

# 6. Add room buttons to Hero
hero_buttons_target = """                <button
                  type="button"
                  onClick={() => changeSourceMode('upload')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10 sm:w-auto"
                >
                  Kendi videonu yükle <ArrowRight className="h-4 w-4" />
                </button>
              </div>"""

hero_buttons_replacement = """                <button
                  type="button"
                  onClick={() => changeSourceMode('upload')}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10 sm:w-auto"
                >
                  Kendi videonu yükle <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-8 pt-6 border-t border-white/10">
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Çok Oyunculu Dublaj</p>
                <div className="flex flex-wrap gap-3">
                  <button onClick={handleFeatureSoon} className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Oda kur</button>
                  <button onClick={handleFeatureSoon} className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-white/5">Oda koduyla katıl</button>
                </div>
              </div>"""

content = content.replace(hero_buttons_target, hero_buttons_replacement)

# 7. Close activeTab conditional and add other tabs, and replace old footer with new footer
old_footer_target = """        {/* ═══════════════════════════ FOOTER ═══════════════════════════ */}
        <footer className="mt-6 border-t border-white/[0.06] pt-6 pb-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs font-bold text-zinc-500">
              Dublaj<span className="text-lime/50">Lab</span>{' '}
              <span className="font-normal text-zinc-500">— Kendi sesinle dublaj stüdyosu</span>
            </p>
            <p className="text-[10px] text-zinc-500">
              Kendi videonu kullan · Kimseyi taklit etme · Kendi sesinle üret
            </p>
          </div>
        </footer>
      </div>
    </main>
  )"""

new_footer = """            </>
          ) : activeTab === 'scenes' ? (
            <div className="py-4">
              <div className="mb-8 max-w-2xl">
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Sahne Kataloğu</h1>
                <p className="mt-3 text-zinc-400">Dublaj yapmak için popüler bir sahne seç veya doğrudan projeye başla.</p>
              </div>
              <TemplateGallery onSelect={handleTabTemplateSelect} />
            </div>
          ) : activeTab === 'dubs' ? (
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
                <Crown className="mx-auto h-12 w-12 text-[#e3cd93]" />
                <h2 className="mt-4 text-2xl font-bold">Günün Dublajı</h2>
                <p className="mt-2 text-zinc-400">Her gün seçilen en iyi topluluk dublajı burada sergilenecek.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-white/10 bg-black/40">
        <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:py-16">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            <div className="col-span-2 lg:col-span-2">
              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-2xl font-black tracking-tight">
                dublaj<span className="text-[#e1251b]">.io</span>
              </a>
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                Arkadaşlarınla sahneyi yeniden seslendir. 
                <br />
                Kendi videonu kullan, kimseyi taklit etme.
              </p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Oyna</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Oda kur</button></li>
                <li><button onClick={() => setActiveTab('scenes')} className="hover:text-white">Sahneler</button></li>
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Nasıl oynanır</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Keşfet</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li><button onClick={() => setActiveTab('dubs')} className="hover:text-white">Dublajlar</button></li>
                <li><button onClick={() => setActiveTab('daily')} className="hover:text-white">Günün Dublajı</button></li>
                <li><button onClick={() => setActiveTab('scenes')} className="hover:text-white">Katalog</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Kurumsal</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Hakkımızda</button></li>
                <li><button onClick={handleFeatureSoon} className="hover:text-white">İletişim</button></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Yasal</h3>
              <ul className="mt-4 space-y-3 text-sm text-zinc-500">
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Gizlilik</button></li>
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Kullanım koşulları</button></li>
                <li><button onClick={handleFeatureSoon} className="hover:text-white">Telif bildirimi</button></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-xs text-zinc-500">
              © 2026 Dublaj.io
            </p>
            <p className="text-[10px] text-zinc-500 text-center sm:text-right max-w-xl">
              Dublaj.io kullanıcıların gönderdiği içeriklerde gerekli kullanım haklarına sahip olduklarını beyan etmelerini zorunlu tutar. Hak sahibinden geçerli bir ihlal bildirimi alınırsa içerik incelenir ve gerekirse erişimden kaldırılır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )"""

content = content.replace(old_footer_target, new_footer)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("App.tsx updated successfully.")
