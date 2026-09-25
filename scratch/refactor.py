import os
import re

app_file = r'c:\src\Meme Dublaj Studio MVP\frontend\src\App.tsx'

with open(app_file, 'r', encoding='utf-8') as f:
    content = f.read()

components_dir = r'c:\src\Meme Dublaj Studio MVP\frontend\src\components'

def create_component(filename, code):
    with open(os.path.join(components_dir, filename), 'w', encoding='utf-8') as f:
        f.write(code)

# 1. EthicsNotice.tsx
ethics_code = """import { ShieldAlert } from 'lucide-react'

export function EthicsNotice() {
  return (
    <aside className="mt-8 rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent p-5">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet/10 text-violet">
          <ShieldAlert className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className="text-xs font-bold text-zinc-300">Etik ve telif bilinci</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Bu uygulama eğlence, parodi ve portföy amaçlıdır. Gerçek kişileri taklit
            etmek, yanıltıcı içerik üretmek veya telifli içerikleri izinsiz dağıtmak
            kullanıcının sorumluluğundadır. Mikrofon kayıtları yalnızca video işlenirken
            kullanılır ve işlem sonrası geçici sunucu kopyaları silinir.
          </p>
        </div>
      </div>
    </aside>
  )
}
"""
create_component('EthicsNotice.tsx', ethics_code)

# 2. ShowcaseDubs.tsx
dubs_code = """import { Play, CheckCircle2, MessageSquare } from 'lucide-react'

export function ShowcaseDubs() {
  return (
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
  )
}
"""
create_component('ShowcaseDubs.tsx', dubs_code)

# 3. DailyDub.tsx
daily_code = """import { Crown, Play } from 'lucide-react'
import type { Tab } from '../types'

interface DailyDubProps {
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
}

export function DailyDub({ setActiveTab, handleFeatureSoon }: DailyDubProps) {
  return (
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
  )
}
"""
create_component('DailyDub.tsx', daily_code)

# 4. HowToModal.tsx
howto_code = """import { X } from 'lucide-react'
import type { Tab } from '../types'

interface HowToModalProps {
  setShowHowTo: (show: boolean) => void
  setActiveTab: (tab: Tab) => void
}

export function HowToModal({ setShowHowTo, setActiveTab }: HowToModalProps) {
  return (
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
  )
}
"""
create_component('HowToModal.tsx', howto_code)

# 5. PlatformNavbar.tsx
navbar_code = """import { Globe, MessageSquare, Crown, Menu, X } from 'lucide-react'
import type { Tab } from '../types'

interface PlatformNavbarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}

export function PlatformNavbar({ activeTab, setActiveTab, handleFeatureSoon, mobileMenuOpen, setMobileMenuOpen }: PlatformNavbarProps) {
  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/10 glass-panel">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 lg:gap-10">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-xl font-black tracking-tight">
              Dublaj<span className="text-lime">Lab</span>
            </a>
            <div className="hidden items-center gap-2 md:flex text-sm font-semibold text-zinc-400">
              <button onClick={() => setActiveTab('play')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'play' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Oyna</button>
              <button onClick={() => setActiveTab('scenes')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'scenes' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Sahneler</button>
              <button onClick={() => setActiveTab('dubs')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'dubs' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Dublajlar</button>
              <button onClick={() => setActiveTab('daily')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'daily' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Günün Dublajı</button>
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
            <button onClick={handleFeatureSoon} className="rounded-lg bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 rounded-lg border border-lime/30 bg-lime/10 px-3 py-1.5 font-bold text-lime transition hover:bg-lime/20">
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
            <button onClick={handleFeatureSoon} className="text-left text-lime flex items-center gap-2"><Crown className="h-4 w-4" /> VIP ol</button>
          </div>
        </div>
      )}
    </>
  )
}
"""
create_component('PlatformNavbar.tsx', navbar_code)

# 6. PlatformFooter.tsx
footer_code = """import type { Tab } from '../types'

interface PlatformFooterProps {
  setActiveTab: (tab: Tab) => void
  handleFeatureSoon: () => void
  handleLegalLink: () => void
  setShowHowTo: (show: boolean) => void
}

export function PlatformFooter({ setActiveTab, handleFeatureSoon, handleLegalLink, setShowHowTo }: PlatformFooterProps) {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/40">
      <div className="mx-auto max-w-[1440px] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2 lg:col-span-2">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-2xl font-black tracking-tight">
              Dublaj<span className="text-lime">Lab</span>
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
              <li><button onClick={() => setShowHowTo(true)} className="hover:text-white">Nasıl oynanır</button></li>
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
              <li><button onClick={handleLegalLink} className="hover:text-white">Gizlilik</button></li>
              <li><button onClick={handleLegalLink} className="hover:text-white">Kullanım koşulları</button></li>
              <li><button onClick={handleLegalLink} className="hover:text-white">Telif bildirimi</button></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-zinc-500">
            © 2026 DublajLab
          </p>
          <p className="text-[10px] text-zinc-500 text-center sm:text-right max-w-xl">
            DublajLab kullanıcıların gönderdiği içeriklerde gerekli kullanım haklarına sahip olduklarını beyan etmelerini zorunlu tutar. Hak sahibinden geçerli bir ihlal bildirimi alınırsa içerik incelenir ve gerekirse erişimden kaldırılır.
          </p>
        </div>
      </div>
    </footer>
  )
}
"""
create_component('PlatformFooter.tsx', footer_code)

# 7. Modify App.tsx imports and returns
import_replacements = """import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  Film,
  Layers,
  LoaderCircle,
  Mic2,
  RefreshCw,
  RotateCcw,
  ServerCrash,
  ShieldCheck,
  Sparkles,
  Subtitles,
  Video,
  WandSparkles,
  Info
} from 'lucide-react'
import { TimelineRecorder } from './components/TimelineRecorder'
import { TemplateGallery } from './components/TemplateGallery'
import { Toggle } from './components/Toggle'
import { UploadZone } from './components/UploadZone'
import { VoiceCards } from './components/VoiceCards'
import { PlatformNavbar } from './components/PlatformNavbar'
import { PlatformFooter } from './components/PlatformFooter'
import { HowToModal } from './components/HowToModal'
import { ShowcaseDubs } from './components/ShowcaseDubs'
import { DailyDub } from './components/DailyDub'
import { EthicsNotice } from './components/EthicsNotice'"""

content = re.sub(r'import\s*\{.*?\}\s*from\s*\'lucide-react\'\nimport\s*\{\s*TimelineRecorder.*?\'', import_replacements + "\nimport {", content, flags=re.DOTALL)

# Replace Navbar
navbar_regex = r'<nav className="sticky top-0.*?{mobileMenuOpen && \(.*?\n\s*\)}'
content = re.sub(navbar_regex, """<PlatformNavbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        handleFeatureSoon={handleFeatureSoon} 
        mobileMenuOpen={mobileMenuOpen} 
        setMobileMenuOpen={setMobileMenuOpen} 
      />""", content, flags=re.DOTALL)

# Replace EthicsNotice
ethics_regex = r'\{\/\*\s*═+ ETHICS NOTICE ═+\s*\*\/.*?<\/aside>'
content = re.sub(ethics_regex, '<EthicsNotice />', content, flags=re.DOTALL)

# Replace ShowcaseDubs
dubs_regex = r"\) : activeTab === 'dubs' \? \(\n\s*<div className=\"py-4\">.*?Demo Dublaj #\{i\}.*?<\/div>\n\s*\)\s*:\s*\("
content = re.sub(dubs_regex, ") : activeTab === 'dubs' ? (\n            <ShowcaseDubs />\n          ) : (", content, flags=re.DOTALL)

# Replace DailyDub
daily_regex = r"\) : \(\n\s*<div className=\"py-4 lg:py-10\">.*?\* Yakında gerçek topluluk içerikleri.*?</p>\n\s*</div>\n\s*</div>\n\s*</div>\n\s*\)\}"
content = re.sub(daily_regex, ") : (\n            <DailyDub setActiveTab={setActiveTab} handleFeatureSoon={handleFeatureSoon} />\n          )}", content, flags=re.DOTALL)

# Replace HowToModal
howto_regex = r'\{\/\*\s*HOW TO PLAY MODAL\s*\*\/.*?Hemen Başla\n\s*</button>\n\s*</div>\n\s*</div>\n\s*\)\}'
content = re.sub(howto_regex, '{showHowTo && (\n        <HowToModal setShowHowTo={setShowHowTo} setActiveTab={setActiveTab} />\n      )}', content, flags=re.DOTALL)

# Replace Footer
footer_regex = r'\{\/\*\s*FOOTER\s*\*\/.*?<\/footer>'
content = re.sub(footer_regex, '<PlatformFooter setActiveTab={setActiveTab} handleFeatureSoon={handleFeatureSoon} handleLegalLink={handleLegalLink} setShowHowTo={setShowHowTo} />', content, flags=re.DOTALL)

# Wait! The "Tab" type needs to be exported in types.ts so components can import it.
types_file = r'c:\src\Meme Dublaj Studio MVP\frontend\src\types.ts'
with open(types_file, 'r', encoding='utf-8') as tf:
    types_content = tf.read()
if "export type Tab =" not in types_content:
    types_content += "\nexport type Tab = 'play' | 'scenes' | 'dubs' | 'daily'\n"
with open(types_file, 'w', encoding='utf-8') as tf:
    tf.write(types_content)

# Remove Tab from App.tsx since it's now in types.ts
content = content.replace("type Tab = 'play' | 'scenes' | 'dubs' | 'daily'\n", "")
content = content.replace("import type {\n  DemoPolicy", "import type {\n  DemoPolicy,\n  Tab")

with open(app_file, 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactor completed.")
