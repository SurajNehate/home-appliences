# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Prerequisites
- Node.js (install from https://nodejs.org/en/)
- Angular CLI: `npm install -g @angular/cli`
- JSON Server (for mock API): `npm install -g json-server`

### Setup
```bash
npm install
```

### Development Server
This application requires two servers running simultaneously:

**Terminal 1 (Angular dev server):**
```bash
npm start
# or: cross-env NODE_OPTIONS=--openssl-legacy-provider ng serve
```

**Terminal 2 (Mock API server):**
```bash
json-server --watch mock-api-data.json
```

The application will be available at http://localhost:4200 and mock API at http://localhost:3000

### Build and Testing
```bash
# Production build
npm run build
# or: cross-env NODE_OPTIONS=--openssl-legacy-provider ng build

# Run unit tests
npm test
# or: ng test

# Run end-to-end tests
npm run e2e
# or: ng e2e

# Lint the code
npm run lint
# or: ng lint
```

### Running Single Tests
```bash
# Run specific test file
ng test --include="**/component-name.spec.ts"

# Run tests in watch mode for specific component
ng test --watch --include="**/cart.service.spec.ts"
```

## Architecture Overview

### Dual-Mode Application
This codebase supports two deployment modes:

1. **Full Ecommerce Mode**: Uses `mock-api-data.json` with JSON Server for complete user management with admin/member roles and order processing
2. **Static Catalog Mode**: Uses `src/assets/products.json` for Netlify-compatible static deployment with guest cart and form submissions

### Module Structure
- **AppModule**: Main application module with all components declared (simplified from modular architecture)
- **SharedModule**: Contains reusable components, services, and directives
- **Core Services**: 
  - `CatalogService`: Manages product data (static JSON or API)
  - `CartService`: Browser localStorage-based cart for guest users
  - `AuthGuardService`: Admin authentication for catalog management

### Key Components
- **Public Pages**: Home, Catalog (product list/detail), Cart, Checkout, Contact
- **Admin Pages**: Login, Catalog Editor, User Management
- **Shared Layouts**: Header, Footer, Page Not Found

### Data Models
- **Static Mode**: Products stored in `src/assets/products.json` with Google Drive image URLs
- **Full Mode**: Users (admin/member roles), products, and orders in `mock-api-data.json`

## Static Deployment (Netlify)

### Product Management
- Admin can edit catalog at `/admin/catalog` (login: admin@gmail.com / 123456)
- Changes are in-memory only - use "Download JSON" to get updated `products.json`
- Replace `src/assets/products.json` and redeploy to update live catalog

### Image Handling
Products use Google Drive public URLs in format:
```
https://drive.google.com/uc?export=view&id=<FILE_ID>
```

### Form Submissions
- Checkout and Contact forms submit to Netlify Forms
- Hidden form registrations in `src/index.html`
- Configure email notifications in Netlify dashboard

## Development Notes

### Legacy OpenSSL Support
This Angular 8 project requires legacy OpenSSL provider due to Node.js compatibility:
```bash
cross-env NODE_OPTIONS=--openssl-legacy-provider
```

### Environment Configuration
- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`
- Admin credentials and contact info configured in environment files

### Cart Implementation
Guest cart uses browser localStorage with key `guest_cart_v1`. No server persistence required.

### Translation Support
Configured with `@ngx-translate` for internationalization, language files in `src/assets/i18n/`

### Styling
- Bootstrap 4.3.1 for UI framework
- Font Awesome for icons
- SCSS for component styles
- Global styles in `src/styles.scss`

### Testing Framework
- Jasmine + Karma for unit tests
- Protractor for e2e tests
- TSLint for code quality (max line length: 140 chars)

## Route Structure
```
/ - Home page
/catalog - Product listing
/catalog/:id - Product details
/cart - Shopping cart
/checkout-guest - Guest checkout with Netlify form
/contact-us - Contact form
/admin-login - Admin authentication
/admin/catalog - Product catalog editor (requires admin login)
/admin/users - User management (requires admin login)
```

## Admin Static Login
Default credentials configured in `src/environments/environment.ts`:
- Username: admin@gmail.com  
- Password: 123456

Change these before deployment to production.