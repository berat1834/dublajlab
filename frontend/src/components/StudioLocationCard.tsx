import { ExternalLink, MapPin, Navigation } from 'lucide-react'
import { useLanguage } from '../LanguageContext'

const STUDIO = {
  latitude: 41.10974,
  longitude: 29.02043,
  address: 'Maslak, Sarıyer / İstanbul',
}

const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=29.002%2C41.100%2C29.039%2C41.119&layer=mapnik&marker=${STUDIO.latitude}%2C${STUDIO.longitude}`
const openMapUrl = `https://www.openstreetmap.org/?mlat=${STUDIO.latitude}&mlon=${STUDIO.longitude}#map=15/${STUDIO.latitude}/${STUDIO.longitude}`
const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${STUDIO.latitude}%2C${STUDIO.longitude}`

export function StudioLocationCard() {
  const { t } = useLanguage()

  return (
    <section className="overflow-hidden rounded-2xl border border-lime-400/20 bg-[#0f0f0f]" aria-labelledby="studio-location-title">
      <div className="grid md:grid-cols-[1.15fr_0.85fr]">
        <div className="relative min-h-72 border-b border-white/10 bg-black md:border-b-0 md:border-r">
          <iframe
            className="absolute inset-0 h-full w-full border-0 grayscale-[15%]"
            src={mapUrl}
            title={t('account.location_map_title')}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="flex flex-col justify-center p-6 md:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-lime-400/20 bg-lime-400/10">
            <MapPin className="h-6 w-6 text-lime-400" />
          </div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-lime-400">{t('account.location_eyebrow')}</p>
          <h3 id="studio-location-title" className="text-2xl font-black text-white">{t('account.location_title')}</h3>
          <p className="mt-2 text-sm font-medium text-zinc-300">{STUDIO.address}</p>
          <p className="mt-4 rounded-xl border border-violet-400/20 bg-violet-400/10 p-3 text-xs leading-5 text-violet-200">
            {t('account.location_notice')}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-4 py-3 text-sm font-black text-black transition hover:bg-lime-300"
            >
              <Navigation className="h-4 w-4" /> {t('account.location_directions')}
            </a>
            <a
              href={openMapUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4" /> {t('account.location_open_map')}
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
