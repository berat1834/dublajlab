# Sprint 08: Platform Shell & Navigation

**Goal**: Transform the single-page application into a product-like shell with dummy navigation, footer, and room-creation buttons.

**Changes**:
- Replaced the outer layout in `App.tsx` with a multi-tab internal router shell.
- Added top navigation bar with placeholder links for Auth, VIP, and Discord.
- Added a full footer with structured columns (Keşfet, Kurumsal, Yasal vs).
- Integrated `TemplateGallery` into its own "Sahneler" tab.
- Added dummy "Oda Kur" and "Oda Koduyla Katıl" buttons to hint at future multiplayer scope.

**Validation**:
- Vite build completes successfully.
- Tailwind CSS handles responsive layout without horizontal scroll (hidden mobile menu via hamburger).

**Pending for Production (To-Do)**:
- Real Discord invitation link needs to be added.
- Real terms of service, privacy policy, and copyright pages need to be drafted and routed.
- Auth / Payment backend needs implementation.
