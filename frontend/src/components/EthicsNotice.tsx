import { ShieldAlert } from 'lucide-react'

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
