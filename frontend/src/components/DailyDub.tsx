import { useCallback, useEffect, useState } from 'react'
import { Check, Crown, Flame, LoaderCircle, LockKeyhole, Play, RotateCcw, Sparkles, Target, Trophy } from 'lucide-react'
import type { EngagementProgress, Tab, User } from '../types'
import { useLanguage } from '../LanguageContext'
import { getEngagementProgress } from '../lib/api'

interface DailyDubProps {
  setActiveTab: (tab: Tab) => void
  currentUser: User | null
}

export function DailyDub({ setActiveTab, currentUser }: DailyDubProps) {
  const { t } = useLanguage()
  const [progress, setProgress] = useState<EngagementProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const loadProgress = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)
    setLoadError(false)
    try {
      setProgress(await getEngagementProgress())
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void loadProgress()
  }, [loadProgress])

  return (
    <div className="py-4 lg:py-10">
      <div className="mb-8 text-center">
        <h1 className="flex items-center justify-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          <Crown className="h-8 w-8 text-lime" /> {t('daily.title')}
        </h1>
        <p className="mt-3 text-zinc-400">{t('daily.description')}</p>
      </div>

      <section className="mx-auto mb-8 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-panel/95 shadow-card">
        {!currentUser ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-lime/10 text-lime"><Target className="h-7 w-7" /></span>
            <h2 className="mt-4 text-xl font-black text-white">{t('engagement.login_title')}</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">{t('engagement.login_desc')}</p>
            <button onClick={() => setActiveTab('login')} className="mt-5 rounded-xl bg-lime px-5 py-3 text-sm font-black text-ink transition hover:bg-[#d5ff78]">{t('nav.login')}</button>
          </div>
        ) : loading && !progress ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-zinc-400"><LoaderCircle className="h-5 w-5 animate-spin text-lime" /> {t('engagement.loading')}</div>
        ) : loadError || !progress ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <p className="text-sm font-bold text-zinc-300">{t('engagement.load_error')}</p>
            <button onClick={() => void loadProgress()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white"><RotateCcw className="h-4 w-4" /> {t('templates.retry')}</button>
          </div>
        ) : (
          <>
            <div className="grid gap-px bg-white/10 sm:grid-cols-3">
              <div className="bg-panel p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500"><Flame className="h-4 w-4 text-orange-400" /> {t('engagement.current_streak')}</div>
                <p className="mt-3 text-3xl font-black text-white">{progress.current_streak} <span className="text-base text-zinc-500">{t('engagement.day')}</span></p>
                <p className={`mt-2 text-xs ${progress.active_today ? 'text-emerald-300' : 'text-zinc-500'}`}>{progress.active_today ? t('engagement.active_today') : t('engagement.keep_streak')}</p>
              </div>
              <div className="bg-panel p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500"><Trophy className="h-4 w-4 text-amber-300" /> {t('engagement.longest_streak')}</div>
                <p className="mt-3 text-3xl font-black text-white">{progress.longest_streak} <span className="text-base text-zinc-500">{t('engagement.day')}</span></p>
              </div>
              <div className="bg-panel p-5 sm:p-6">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-zinc-500"><Sparkles className="h-4 w-4 text-violet-300" /> {t('engagement.today_xp')}</div>
                <p className="mt-3 text-3xl font-black text-white">{progress.today_xp} <span className="text-base text-zinc-500">XP</span></p>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div><h2 className="text-lg font-black text-white">{t('engagement.daily_tasks')}</h2><p className="mt-1 text-xs text-zinc-500">{t('engagement.no_spam_note')}</p></div>
                <span className="shrink-0 rounded-lg bg-violet-400/10 px-2.5 py-1.5 text-xs font-black text-violet-200">+{progress.daily_bonus_xp} XP {t('engagement.bonus')}</span>
              </div>
              <div className="space-y-3">
                {progress.tasks.map((task) => {
                  const displayedProgress = Math.min(task.progress, task.target)
                  const percentage = Math.round((displayedProgress / task.target) * 100)
                  return (
                    <article key={task.key} className={`rounded-2xl border p-4 ${task.completed ? 'border-emerald-400/20 bg-emerald-400/[0.05]' : 'border-white/10 bg-white/[0.025]'}`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl ${task.completed ? 'bg-emerald-400 text-ink' : 'bg-white/5 text-zinc-500'}`}>{task.completed ? <Check className="h-4 w-4" /> : <Target className="h-4 w-4" />}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-white">{t(`engagement.task.${task.key}`)}</h3><span className="shrink-0 text-xs font-black text-lime">+{task.xp} XP</span></div>
                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-lime transition-all" style={{ width: `${percentage}%` }} /></div>
                          <p className="mt-2 text-right text-[11px] font-bold text-zinc-500">{displayedProgress} / {task.target}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
              <div className={`mt-4 rounded-2xl border border-dashed p-4 ${progress.all_tasks_completed ? 'border-lime/35 bg-lime/10' : 'border-white/10'}`}>
                <div className="flex items-center justify-between gap-4"><div><p className="text-sm font-black text-white">{t('engagement.full_day')}</p><p className="mt-1 text-xs text-zinc-500">{t('engagement.full_day_desc')}</p></div><span className="shrink-0 font-black text-lime">+{progress.daily_bonus_xp} XP</span></div>
              </div>
              <h2 className="mt-8 text-lg font-black text-white">{t('engagement.achievements')}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {progress.achievements.map((achievement) => (
                  <article key={achievement.key} className={`rounded-2xl border p-4 ${achievement.unlocked ? 'border-amber-300/25 bg-amber-300/[0.06]' : 'border-white/10 bg-white/[0.02]'}`}>
                    <div className="flex items-center gap-3"><span className={`grid h-9 w-9 place-items-center rounded-xl ${achievement.unlocked ? 'bg-amber-300 text-black' : 'bg-white/5 text-zinc-600'}`}>{achievement.unlocked ? <Trophy className="h-4 w-4" /> : <LockKeyhole className="h-4 w-4" />}</span><div className="min-w-0"><h3 className="text-sm font-bold text-white">{t(`engagement.achievement.${achievement.key}`)}</h3><p className="mt-1 text-[11px] text-zinc-500">{Math.min(achievement.progress, achievement.target)} / {achievement.target}</p></div></div>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      <div className="mx-auto max-w-3xl overflow-hidden rounded-3xl border border-lime/20 bg-gradient-to-b from-lime/[0.05] to-transparent shadow-glow-lg">
        <div className="relative flex aspect-video items-center justify-center bg-black">
          <Play className="h-16 w-16 text-lime/50" /><div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
          <span className="absolute right-4 top-4 rounded-full bg-violet-500/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-glow-sm">{t('daily.demo')}</span>
          <div className="absolute bottom-4 left-4 right-4"><span className="mb-2 inline-block rounded-md bg-lime px-2 py-1 text-xs font-black uppercase text-ink">{t('daily.winner')}</span><h2 className="text-2xl font-bold text-white">{t('daily.demo_title')}</h2><p className="mt-1 text-sm text-zinc-400">{t('daily.voice_by')}: EfsaneKral</p></div>
        </div>
        <div className="p-6 sm:p-8">
          <p className="text-sm leading-6 text-zinc-300">{t('daily.quote')}</p>
          <div className="mt-6 flex flex-wrap gap-4"><button onClick={() => setActiveTab('scenes')} className="rounded-xl bg-lime px-6 py-3 text-sm font-bold text-ink shadow-glow transition hover:bg-[#d5ff78]">{t('daily.watch')}</button><button onClick={() => setActiveTab('play')} className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10">{t('daily.create')}</button><button onClick={() => setActiveTab('dubs')} className="ml-auto rounded-xl border border-white/10 px-6 py-3 text-sm font-bold text-zinc-400 transition hover:text-white">{t('daily.all')}</button></div>
          <p className="mt-6 border-t border-white/10 pt-4 text-xs text-zinc-500">{t('daily.notice')}</p>
        </div>
      </div>
    </div>
  )
}
