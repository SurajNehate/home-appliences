# Home Decor — Functional Spec for Figma

Last updated: 2025-09-23

Overview
- Goal: Provide a concise, designer-friendly description of all UI screens, components, interactions, and responsive rules for the Home Decor storefront and admin tooling.
- Tech: Angular 19 + Angular Material. Icons: Material Symbols Outlined.
- Layout: App shell with responsive sidenav (collapsed on phones and small tablets).

Information Architecture
- Public
  - Products (default landing)
  - Product Detail
  - Cart
  - Checkout (entry via Cart only; not in main nav)
  - Contact Us
  - Signup
  - Profile
  - Admin Login
- Admin
  - Admin Catalog (CRUD Products)
  - Admin Orders
  - Admin Users

Global UI
- App shell
  - Top toolbar: left menu button (phones/small tablets), theme toggle, cart icon + count, auth shortcuts (Login/Signup or Profile/Logout)
  - Sidenav (left)
    - Items: Products, Cart, Contact (+ Admin, Orders, Users for admin role)
    - Responsive behavior: collapses to overlay on Handset & TabletPortrait; fixed on larger screens
- Theming
  - Light/Dark toggle; ensure color tokens support both themes
- Breakpoints (key ones)
  - Handset & TabletPortrait: collapsible sidenav, mobile-first layouts
  - TabletLandscape & above: wider grids, fixed sidenav

Products List (Grid)
- Filters bar (top)
  - Category dropdown: values populated from product.category (plus “All”)
  - Search input: filters by name/description/category (case-insensitive substring)
- Cards (grid)
  - Image: 180px tall, full image visible (object-fit: contain), centered, black background (letterbox)
  - Title (name), Subtitle (category), Price
  - Actions: Add (primary). If admin: Edit (stroked)
- Interactions
  - Clicking a card opens Product Detail
  - Add button increases cart count and shows subtle feedback
- Responsive
  - Grid uses repeat(auto-fill, minmax(280px, 1fr)) with 16px gap
  - Filters wrap on small widths; search grows to fill available space

Product Detail
- Image viewer
  - Main area: fixed-height 360px, black background, image fully contained (no crop), centered
  - Thumbnails (left column): 80×80, object-fit contain on black background; selected thumb has a primary outline
  - Lightbox: full screen overlay with zoom/pan (pinch on touch), close button top-right
- Details
  - Name, category, description, price, Add to cart, Back
- Responsive
  - On narrow screens, stack main image above content; thumbnails can scroll horizontally if needed (or collapse)

Cart
- Desktop/tablet
  - Table with columns: Image, Product, Price, Qty (with +/-), Total, Actions (Remove)
  - Table horizontally scrollable if viewport is too narrow (no layout breakage)
- Mobile (phones/small tablets)
  - Card list per item: image, name, price, qty stepper, total, remove button
- Footer
  - Left: Continue Shopping
  - Right: Subtotal + Checkout (disabled when empty) + Clear
- Interactions
  - +/- adjusts quantity; Remove deletes item; Clear empties cart

Checkout
- Access control
  - Not in main nav; only accessible from cart (guarded if cart is empty)
- Content
  - Guest checkout: name, email, phone, address
  - Summary of cart items and totals
- Responsive
  - Single column on mobile; two columns on wider screens (form left, summary right)

Contact Us
- Simple form: name, email, message; submit button
- Responsive single column; confirmation state on submit

Admin: Catalog
- Listing
  - Table or cards with: name, price, category, status, created_at
  - Actions: Add, Edit, Delete
- Product Form
  - Fields: name, price, category (free text for now), description, status toggle
  - Images: set primary image and additional images (uploads)
  - After upload, UI shows thumbnails (use the same contain+black rule)

Admin: Orders
- Listing
  - id, customer name/email/phone, total, status, created_at
  - Row click opens order detail
- Details
  - Customer info; list of items with qty, price, image; status update control

Admin: Users
- Listing
  - id, name, email, phone, role, created_at
  - Filters (email/role) for admin-only
- Actions
  - Create (admin only), Update (role/name/email/phone), Delete (admin only)

States & Messaging
- Loading
  - Skeleton or progress spinners for grids, detail, forms
- Empty states
  - Products: “No products found” under current filters; suggest clearing filters
  - Cart: “Your cart is empty” with CTA to browse products
  - Admin lists: “No records found”
- Errors
  - Inline error banners for failed API calls; retry CTA where possible

Design Tokens (suggested)
- Colors
  - Primary: Material Indigo 500 (adjust for dark theme); Accent: Material Pink/Ambient; Warn: Material Red 500
  - Background surfaces should work in both themes
- Typography
  - Use Angular Material defaults; emphasize titles and price
- Spacing
  - 8px base unit; 16px for grid gaps; 24px for major paddings
- Elevation
  - Cards: z1; Lightbox overlay above all content

Icons (Material Symbols Outlined)
- storefront (brand), view_list (Products), shopping_cart (Cart), shopping_bag (Checkout), contact_support (Contact), admin_panel_settings (Admin), list_alt (Orders), group (Users), add (Add), edit (Edit), delete (Remove), arrow_back (Back), add_shopping_cart (Add to cart), dark_mode (Theme), menu (Open nav), close (Lightbox)

Image Rules
- All product images should be displayed using “contain” behavior, centered, with black background to letterbox/pillarbox as needed
- Thumbnails follow the same rule; rounded corners where appropriate

Navigation & Routing
- Default route: /products
- Deep links: /products/:id, /cart, /checkout-guest, /contact-us
- SPA fallback handled in production (_redirects), not needed in design

Accessibility
- Minimum 4.5:1 contrast on text/icons vs background (both themes)
- Focus states visible on all interactive elements (buttons, inputs, links)
- Meaningful aria-labels for icon-only buttons (e.g., cart, theme, menu)

Responsive Summary
- Handset & TabletPortrait (<~960px)
  - Collapsible sidenav; products grid 1–2 columns depending on width; cart uses card list; forms single column
- TabletLandscape & Desktop
  - Fixed sidenav; products grid 2–4 columns; cart uses table; forms two columns where sensible

Figma Handoff Checklist
- Pages
  - Home/Products, Product Detail, Cart, Checkout, Contact, Admin (Catalog/Orders/Users), Auth (Login/Signup), Profile
- Components
  - App Shell (Toolbar + Sidenav)
  - Product Card, Filter Bar (Category + Search)
  - Image Viewer (Main + Thumbs), Lightbox
  - Cart Table, Cart Item Card, Footer summary
  - Forms (Text fields, Selects, Buttons), Toast/Banner
  - Admin Tables + Modals
- Variants/States
  - Buttons (default/hover/active/disabled), Inputs (focus/error), Cards (hover), Empty/Loading/Error states
- Constraints
  - Components should resize across mobile/tablet/desktop as described above

Notes for Designers
- Keep button and touch targets at least 44×44px on mobile
- Prefer single primary CTA per section; secondary actions as stroked/tonal
- Keep consistent spacing rhythm; align with Material spacing and breakpoints
- Use the specified icons; avoid mixing icon sets

End of spec
