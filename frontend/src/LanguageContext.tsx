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
  // Legal Modal
  'legal.title': { TR: 'Yasal ve Kurumsal', EN: 'Legal & Corporate' },
  'legal.subtitle': { TR: 'Public Beta Bilgilendirmesi', EN: 'Public Beta Information' },
  'legal.close': { TR: 'Kapat', EN: 'Close' },
  
  'legal.about.title': { TR: 'Hakkımızda (Taslak)', EN: 'About Us (Draft)' },
  'legal.about.p1': { TR: 'DublajLab, kısa videolarınızı tarayıcı üzerinden kendi sesinizle dublajlamanızı sağlayan yaratıcı bir medya aracıdır.', EN: 'DublajLab is a creative media tool that allows you to dub your short videos with your own voice directly via the browser.' },
  'legal.about.p2': { TR: 'Bu platform şu an "Public Beta" aşamasındadır. Kullanıcıların yaratıcılıklarını sergilemeleri ve portföy içerikleri üretmeleri için tasarlanmıştır.', EN: 'This platform is currently in "Public Beta". It is designed for users to showcase their creativity and produce portfolio content.' },
  'legal.about.p3': { TR: 'Ekibimiz, video düzenleme süreçlerini olabildiğince basitleştirerek herkesin kendi sesinden hikayeler anlatabilmesini hedefliyor.', EN: 'Our team aims to simplify video editing processes as much as possible so that everyone can tell stories with their own voice.' },

  'legal.contact.title': { TR: 'İletişim (Taslak)', EN: 'Contact (Draft)' },
  'legal.contact.p1': { TR: 'DublajLab Public Beta süresince resmi destek kanallarımız sınırlıdır. Geri bildirimleriniz ve hata bildirimleriniz bizim için çok değerlidir.', EN: 'During the DublajLab Public Beta, our official support channels are limited. Your feedback and bug reports are very valuable to us.' },
  'legal.contact.p2': { TR: 'Bize aşağıdaki e-posta adresinden ulaşabilirsiniz:', EN: 'You can reach us at the following e-mail address:' },
  'legal.contact.p3': { TR: '* Sosyal medya hesaplarımız yakında aktif edilecektir.', EN: '* Our social media accounts will be activated soon.' },

  'legal.privacy.title': { TR: 'Gizlilik Politikası (Taslak)', EN: 'Privacy Policy (Draft)' },
  'legal.privacy.p1': { TR: 'DublajLab, kişisel verilerinizin güvenliğine önem verir. Bu metin Public Beta süreci için bir bilgilendirmedir.', EN: 'DublajLab cares about the security of your personal data. This text is an information for the Public Beta process.' },
  'legal.privacy.li1': { TR: 'Medya Verileri: Tarayıcı üzerinden kaydettiğiniz sesler sadece export işlemi için sunucuya iletilir ve işlem bittikten sonra geçici sunuculardan silinir.', EN: 'Media Data: The sounds you record via the browser are only transmitted to the server for export and are deleted from temporary servers after the process is finished.' },
  'legal.privacy.li2': { TR: 'Kalıcı Saklama: Üye olan kullanıcıların projeleri ve indirmeye hazır MP4 çıktıları sunucularımızda saklanır. Depolama temizlik politikalarımız (cleanup) eski dosyaları silebilir.', EN: 'Persistent Storage: The projects and ready-to-download MP4 outputs of registered users are stored on our servers. Our storage cleanup policies can delete old files.' },
  'legal.privacy.li3': { TR: 'Üçüncü Taraflar: Verileriniz izniniz olmadan üçüncü taraf reklam şirketlerine satılmaz. Sadece hizmeti sunmak için gereken bulut sağlayıcıları (örn. Cloudflare, Railway) kullanılır.', EN: 'Third Parties: Your data is not sold to third-party advertising companies without your permission. Only cloud providers (e.g. Cloudflare, Railway) required to provide the service are used.' },

  'legal.terms.title': { TR: 'Kullanım Koşulları (Taslak)', EN: 'Terms of Use (Draft)' },
  'legal.terms.p1': { TR: 'DublajLab hizmetlerini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız:', EN: 'By using DublajLab services, you are deemed to have accepted the following conditions:' },
  'legal.terms.li1': { TR: 'Kullanıcılar sisteme yükledikleri tüm video ve ses içeriklerinden bizzat sorumludur.', EN: 'Users are personally responsible for all video and audio content they upload to the system.' },
  'legal.terms.li2': { TR: 'Hizmet şu an "Public Beta" aşamasında olup, kesintiler veya veri kayıpları yaşanabilir.', EN: 'The service is currently in "Public Beta" and interruptions or data loss may occur.' },
  'legal.terms.li3': { TR: 'Kötüye kullanım (DDoS, API limitlerini aşma çabası) durumunda hesabınız veya IP adresiniz engellenebilir.', EN: 'In case of abuse (DDoS, effort to exceed API limits), your account or IP address may be blocked.' },

  'legal.copyright.title': { TR: 'Telif Bildirimi (Taslak)', EN: 'Copyright Notice (Draft)' },
  'legal.copyright.p1': { TR: 'DublajLab platformunda paylaşılan veya yüklenen içeriklerin fikri mülkiyet haklarına saygı duyuyoruz.', EN: 'We respect the intellectual property rights of the content shared or uploaded on the DublajLab platform.' },
  'legal.copyright.li1': { TR: 'Sadece kullanım hakkına sahip olduğunuz veya kamuya açık (CC0 vb.) videoları yükleyin.', EN: 'Only upload videos that you have the right to use or are public (CC0 etc.).' },
  'legal.copyright.li2': { TR: 'Gerçek kişilerin seslerini taklit etmek (deepfake) veya onları yanıltıcı durumlara sokmak yasaktır.', EN: 'Imitating the voices of real people (deepfake) or putting them in misleading situations is prohibited.' },
  'legal.copyright.li3': { TR: 'Eğer telif hakkına sahip olduğunuz bir materyalin izinsiz kullanıldığını düşünüyorsanız, iletişim kanallarımızdan bize bildirebilirsiniz. İçerik incelenip yayından kaldırılacaktır.', EN: 'If you think that a material you own the copyright is used without permission, you can report it to us via our communication channels. The content will be reviewed and removed.' },

  'legal.refund.title': { TR: 'İade ve İptal Koşulları (Taslak)', EN: 'Refund and Cancellation Policy (Draft)' },
  'legal.refund.p1': { TR: 'Not: Şu an sistemimizde Shopier ödeme entegrasyonu (VIP) aktif değildir. Aşağıdaki kurallar ödeme alındığında geçerli olacaktır.', EN: 'Note: Currently, Shopier payment integration (VIP) is not active in our system. The following rules will be valid when payment is received.' },
  'legal.refund.li1': { TR: 'Satın alınan VIP üyelikler dijital hizmet niteliğinde olduğundan, hizmet kullanılmaya başlandıktan sonra cayma hakkı kural olarak geçerli değildir.', EN: 'Since purchased VIP memberships are in the nature of digital services, the right of withdrawal is generally not valid after the service has started to be used.' },
  'legal.refund.li2': { TR: 'Teknik bir nedenden ötürü (sistemin sürekli çökmesi vb.) vaat edilen hizmet hiç verilememişse, destek talebi üzerinden iade incelenebilir.', EN: 'If the promised service cannot be provided at all due to a technical reason (constant system crash, etc.), a refund can be reviewed via a support request.' },

  'legal.distance.title': { TR: 'Mesafeli Satış Sözleşmesi (Taslak)', EN: 'Distance Selling Contract (Draft)' },
  'legal.distance.p1': { TR: 'Madde 1 - Taraflar: Bu sözleşme DublajLab (Satıcı) ile VIP/Premium hizmet alan kullanıcı (Alıcı) arasındadır. (Şu an test aşamasındadır, yasal satıcı ünvanı atanmamıştır).', EN: 'Article 1 - Parties: This contract is between DublajLab (Seller) and the user receiving VIP/Premium service (Buyer). (Currently in testing phase, legal seller title not assigned).' },
  'legal.distance.p2': { TR: 'Madde 2 - Konu: Sözleşmenin konusu, alıcının dijital VIP hizmeti satın alması ve bu hizmetin elektronik ortamda anında teslimidir.', EN: 'Article 2 - Subject: The subject of the contract is the buyer purchasing digital VIP service and immediate delivery of this service electronically.' },
  'legal.distance.p3': { TR: 'Madde 3 - Teslimat: Satın alım tamamlandıktan hemen sonra üyelik statüsü güncellenir ve yüksek çözünürlük gibi özellikler aktifleşir.', EN: 'Article 3 - Delivery: Immediately after the purchase is completed, the membership status is updated and features such as high resolution are activated.' },
  'legal.distance.p4': { TR: 'Not: Gerçek ticari faaliyet başladığında bu sayfa hukuk metni ile güncellenecektir.', EN: 'Note: When real commercial activity starts, this page will be updated with a legal text.' },

  'footer.links.refund': { TR: 'İade ve İptal', EN: 'Refund Policy' },
  'footer.links.distance': { TR: 'Mesafeli Satış', EN: 'Distance Selling' },
  'footer.links.oda_kur': { TR: 'Oda kur', EN: 'Create Room' },
  'footer.disclaimer': { TR: 'DublajLab kullanıcıların gönderdiği içeriklerde gerekli kullanım haklarına sahip olduklarını beyan etmelerini zorunlu tutar. Hak sahibinden geçerli bir ihlal bildirimi alınırsa içerik incelenir ve gerekirse erişimden kaldırılır.', EN: 'DublajLab requires users to declare that they have the necessary usage rights in the content they submit. If a valid infringement notice is received from the right holder, the content is reviewed and removed if necessary.' },

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
