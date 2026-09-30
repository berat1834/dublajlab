# Sprint 46: Public Beta UX Polish + Navigation Fixes

## Kapsam
Public beta lansmanı için uygulamanın genel UX deneyiminin (Auth, dil, footer, menü etkileşimleri) parlatılması. Yeni özellik eklenmeden mevcut mimari korundu.

## Yapılan İşlemler
1. **Welcome / Auth Landing (AuthPage.tsx):** 
   - Ana ekran sloganları (`Kendi sesinle sahnede yerini al.`) eklendi.
   - Hareketli arka plan metinleri (floating quotes) ile estetik güçlendirildi.
   - Kullanıcı zaten login olmuşsa (token varsa) login sayfasına gelindiğinde otomatik olarak stüdyoya yönlendirilmesi için `useEffect` eklendi.
2. **Dil Sistemi (LanguageContext.tsx):** 
   - `auth`, `footer` ve `nav` prefixleriyle yeni public translation stateleri (TR/EN) tanımlandı.
   - Türkçe default olarak korundu; `t()` hook'u auth ve footer ekranlarına entegre edildi. 
3. **Smooth Scroll & Footer Linkleri (PlatformFooter.tsx):** 
   - Sayfanın en altındaki yönlendirmelerde tab değişimi ile birlikte `window.scrollTo({ top: 0, behavior: 'smooth' })` tetiklenmesi sağlandı.
   - Kırık/çalışmayan aksiyonlar ilgili modal veya sekme değişimine bağlandı.
4. **User Dropdown Outside Click (PlatformNavbar.tsx):** 
   - Kullanıcı dropdown menüsü dışına veya `Escape` tuşuna basıldığında menünün otomatik kapanması için `useRef` ve `useEffect` ile event listener'lar eklendi. (Memory leak engellendi).

## Domain ve URL Durumu
- Canonical URL: `https://dublajlab-sigma.vercel.app` olarak doğrulanmıştır. 
- Eğer `dublajlab.vercel.app` ayrı bir landing page render ediyorsa bu Vercel'deki proje/domain yönlendirmelerinden kaynaklanmaktadır ve oradan alias (redirect) olarak çözülmelidir.

## Test Durumu
- `npm run lint`: Sıfır hata.
- `npm run build`: Sorunsuz inşa edildi.
- `npm audit`: 0 vulnerability.
- Manuel QA: Navbar, Dropdown, Footer, Auth ve Dil sistemi test edildi.
