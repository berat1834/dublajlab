import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'TR' | 'EN';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navbar
  'nav.play': { TR: 'Oyna', EN: 'Play' },
  'nav.scenes': { TR: 'Sahneler', EN: 'Scenes' },
  'nav.dubs': { TR: 'Dublajlar', EN: 'Dubs' },
  'nav.daily': { TR: 'Günün Dublajı', EN: 'Daily Dub' },
  'nav.language': { TR: 'Dil', EN: 'Language' },
  'drop.profile': { TR: 'Profilim', EN: 'My Profile' },
  'drop.membership': { TR: 'Üyeliğim', EN: 'Membership' },
  'drop.library': { TR: 'Kataloğum', EN: 'My Library' },
  'drop.scenes': { TR: 'Sahnelerim', EN: 'My Scenes' },
  'drop.favorites': { TR: 'Favorilerim', EN: 'Favorites' },
  'drop.credits': { TR: 'Kredilerim', EN: 'My Credits' },
  'drop.account': { TR: 'Hesabım', EN: 'Settings' },
  'drop.logout': { TR: 'Çıkış Yap', EN: 'Logout' },
  
  // Account Settings
  'account.title': { TR: 'Hesap Ayarları', EN: 'Account Settings' },
  'account.save': { TR: 'Tümünü kaydet', EN: 'Save all' },
  'account.discord_link': { TR: 'Discord Hesabını Bağla', EN: 'Link Discord Account' },
  'account.discord_linked': { TR: 'Discord Bağlandı', EN: 'Discord Linked' },
  'account.delete': { TR: 'Hesabımı silmek istiyorum', EN: 'I want to delete my account' },

  // Membership & Credits
  'vip.button': { TR: 'Şimdi VIP Ol', EN: 'Become VIP Now' },
  'credits.buy': { TR: 'Kredi Al', EN: 'Buy Credits' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('TR');

  const t = (key: string): string => {
    return translations[key]?.[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
