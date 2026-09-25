import sys

file_path = r'c:\src\Meme Dublaj Studio MVP\frontend\src\App.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Navbar style and Logo
nav_target = """      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-md">
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
            </div>"""

nav_replacement = """      <nav className="sticky top-0 z-50 border-b border-white/10 glass-panel">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6 lg:gap-10">
            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-xl font-black tracking-tight">
              dublaj<span className="text-lime">.io</span>
            </a>
            <div className="hidden items-center gap-2 md:flex text-sm font-semibold text-zinc-400">
              <button onClick={() => setActiveTab('play')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'play' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Oyna</button>
              <button onClick={() => setActiveTab('scenes')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'scenes' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Sahneler</button>
              <button onClick={() => setActiveTab('dubs')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'dubs' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Dublajlar</button>
              <button onClick={() => setActiveTab('daily')} className={`rounded-lg px-3 py-1.5 transition ${activeTab === 'daily' ? 'bg-white/10 text-white' : 'hover:bg-white/5 hover:text-white'}`}>Günün Dublajı</button>
            </div>"""

content = content.replace(nav_target, nav_replacement)

# 2. Navbar buttons (Right side)
nav_right_target = """            <button onClick={handleFeatureSoon} className="text-zinc-300 hover:text-white">Giriş yap</button>
            <button onClick={handleFeatureSoon} className="rounded-md border border-white/20 px-4 py-1.5 text-white hover:bg-white/10">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 rounded-md bg-[#e3cd93] px-3 py-1.5 font-bold text-black hover:bg-[#ebd59a]">
              <Crown className="h-4 w-4" /> VIP ol
            </button>"""

nav_right_replacement = """            <button onClick={handleFeatureSoon} className="text-zinc-300 hover:text-white">Giriş yap</button>
            <button onClick={handleFeatureSoon} className="rounded-lg bg-white/5 px-4 py-1.5 text-sm font-bold text-white transition hover:bg-white/10">Kayıt ol</button>
            <button onClick={handleFeatureSoon} className="flex items-center gap-1.5 rounded-lg border border-lime/30 bg-lime/10 px-3 py-1.5 font-bold text-lime transition hover:bg-lime/20">
              <Crown className="h-4 w-4" /> VIP ol
            </button>"""

content = content.replace(nav_right_target, nav_right_replacement)

# 3. Mobile VIP button
mobile_vip_target = """<button onClick={handleFeatureSoon} className="text-left text-[#e3cd93] flex items-center gap-2"><Crown className="h-4 w-4" /> VIP ol</button>"""
mobile_vip_replacement = """<button onClick={handleFeatureSoon} className="text-left text-lime flex items-center gap-2"><Crown className="h-4 w-4" /> VIP ol</button>"""
content = content.replace(mobile_vip_target, mobile_vip_replacement)

# 4. Hero Oda buttons
hero_buttons_target = """                <div className="flex flex-wrap gap-3">
                  <button onClick={handleFeatureSoon} className="rounded-lg bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/20">Oda kur</button>
                  <button onClick={handleFeatureSoon} className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-white/5">Oda koduyla katıl</button>
                </div>"""
                
hero_buttons_replacement = """                <div className="flex flex-wrap gap-3">
                  <button onClick={handleFeatureSoon} className="inline-flex items-center gap-2 rounded-xl bg-violet/15 px-4 py-2.5 text-sm font-bold text-violet transition hover:bg-violet/25">Oda kur</button>
                  <button onClick={handleFeatureSoon} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-zinc-300 transition hover:bg-white/10">Oda koduyla katıl</button>
                </div>"""

content = content.replace(hero_buttons_target, hero_buttons_replacement)

# 5. Günün Dublajı icon
crown_target = """<Crown className="mx-auto h-12 w-12 text-[#e3cd93]" />"""
crown_replacement = """<Crown className="mx-auto h-12 w-12 text-lime" />"""
content = content.replace(crown_target, crown_replacement)

# 6. Footer logo
footer_logo_target = """              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-2xl font-black tracking-tight">
                dublaj<span className="text-[#e1251b]">.io</span>
              </a>"""
footer_logo_replacement = """              <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('play'); }} className="text-2xl font-black tracking-tight">
                dublaj<span className="text-lime">.io</span>
              </a>"""
content = content.replace(footer_logo_target, footer_logo_replacement)

# 7. Toast message styling
toast_target = """        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-indigo-500 text-white px-4 py-2 text-sm shadow-xl animate-in fade-in slide-in-from-bottom-4">"""
toast_replacement = """        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full border border-violet/30 bg-violet text-white px-4 py-2 text-sm font-medium shadow-glow animate-in fade-in slide-in-from-bottom-4">"""
content = content.replace(toast_target, toast_replacement)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Theme matched successfully!")
