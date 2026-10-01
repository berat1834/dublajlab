/* eslint-disable react-refresh/only-export-components */
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

  // Auth Page
  'auth.hero.title1': { TR: 'Kendi sesinle', EN: 'Take the stage' },
  'auth.hero.title2': { TR: 'sahnede yerini al.', EN: 'with your own voice.' },
  'auth.hero.desc': { TR: 'Favori filmlerine, popüler dizilere ve viral videolara kendi sesinle dublaj yap. Arkadaşlarınla paylaş veya toplulukta öne çık.', EN: 'Dub your favorite movies, popular series, and viral videos with your own voice. Share with friends or stand out in the community.' },
  'auth.login.title': { TR: 'Tekrar Hoş Geldin', EN: 'Welcome Back' },
  'auth.login.desc': { TR: 'Kaldığın yerden devam etmek için giriş yap.', EN: 'Log in to continue where you left off.' },
  'auth.register.title': { TR: 'Maceraya Katıl', EN: 'Join the Adventure' },
  'auth.register.desc': { TR: 'Ücretsiz hesabını oluştur ve ilk dublajını yap.', EN: 'Create your free account and make your first dub.' },

  // Footer
  'footer.desc': { TR: 'Portföy ve teknoloji demosu.', EN: 'Portfolio and technology demo.' },
  'footer.links.product': { TR: 'Ürün', EN: 'Product' },
  'footer.links.play': { TR: 'Stüdyo', EN: 'Studio' },
  'footer.links.scenes': { TR: 'Hazır Sahneler', EN: 'Templates' },
  'footer.links.dubs': { TR: 'Topluluk', EN: 'Community' },
  'footer.links.daily': { TR: 'Günün Dublajı', EN: 'Daily Dub' },
  'footer.links.resources': { TR: 'Kaynaklar', EN: 'Resources' },
  'footer.links.howto': { TR: 'Nasıl Kullanılır?', EN: 'How to Use?' },
  'footer.links.legal': { TR: 'Yasal', EN: 'Legal' },
  'footer.links.privacy': { TR: 'Gizlilik', EN: 'Privacy' },
  'footer.links.terms': { TR: 'Kullanım Koşulları', EN: 'Terms of Use' },
  'footer.links.copyright': { TR: 'Telif Hakkı', EN: 'Copyright' },
  'footer.links.suggest': { TR: 'Sahne Öner', EN: 'Suggest Scene' },
  'footer.links.contact': { TR: 'İletişim', EN: 'Contact' },
  'footer.links.about': { TR: 'Hakkımızda', EN: 'About Us' },
  'footer.links.corporate': { TR: 'Kurumsal', EN: 'Corporate' },
  'toast.social_soon': { TR: 'DublajLab resmi sosyal medya hesabı yakında açılacak.', EN: 'DublajLab official social media account will be opened soon.' },
  'toast.suggest_soon': { TR: 'Sahne önerme özelliği yakında.', EN: 'Scene suggestion feature coming soon.' },
  'toast.contact_soon': { TR: 'İletişim paneli yakında.', EN: 'Contact panel coming soon.' },
  'social.soon': { TR: 'Resmi hesap yakında', EN: 'Official account soon' },
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
