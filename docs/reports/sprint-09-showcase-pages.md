# Sprint 09: Showcase Pages & Brand Updates

**Goal**: Enhance the platform shell by adding rich showcase pages (Dubs, Daily Dub, Categories) with placeholder content, replacing the existing `dublaj.io` reference brand with `DublajLab`, and updating legal/how-to sections to improve the professional presentation of the live demo.

**Changes**:
- Updated the primary branding from `dublaj.io` to `DublajLab` across the Navbar and Footer to avoid conflicts with existing internet entities.
- Implemented a category filter (`Tümü`, `Komedi`, vb.) for the `TemplateGallery.tsx`.
- Designed a placeholder grid for the "Dublajlar" tab displaying fake community content with views and categories. Added clear "Demo İçerik" warnings to prevent user deception.
- Designed a large featured hero card for the "Günün Dublajı" tab to showcase how selected premium content will look.
- Added a full-screen "Nasıl Oynanır" modal explaining the 3 simple steps of the game.
- Hooked the footer legal links (Privacy, Terms, Copyright) to display a toast message indicating that they require professional legal texts before going fully live.
- Added `.hide-scrollbar` CSS utility to maintain clean horizontal scrolling for category tags on mobile.

**Validation**:
- Vite build passes.
- ESLint passes.
- Backend Python tests remain untouched and functional.

**Next Steps**:
- Draft real Privacy Policy and Terms of Service.
- Prepare the actual demo asset package.
