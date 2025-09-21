# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project type: Angular 19 (standalone) with SSR via @angular/ssr + Express

Common commands

- Dev server (client-side, default at http://localhost:4200):
```bash path=null start=null
ng serve
```
  - Alternatively:
```bash path=null start=null
npm start
```

- Build (production by default per angular.json):
```bash path=null start=null
ng build
```

- Build (development config + watch):
```bash path=null start=null
ng build --configuration development --watch
```
  - Alternatively (script):
```bash path=null start=null
npm run watch
```

- Run unit tests (Karma + Jasmine):
```bash path=null start=null
ng test
```

- Run a single spec file (recommended approach):
```bash path=null start=null
ng test --include src/app/app.component.spec.ts
```
  - You can also temporarily focus tests using Jasmine’s fit/fdescribe in a spec when iterating locally.

- Serve the built SSR bundle (after ng build):
```bash path=null start=null
npm run serve:ssr:home-decor-v19
```
  - The SSR server listens on PORT or defaults to http://localhost:4000 as defined in src/server.ts.

Notes on linting

- No lint configuration/script is present (e.g., ESLint) in package.json at the time of writing.

High-level architecture

- Framework/runtime
  - Angular 19 standalone application (no NgModules). Bootstrap via bootstrapApplication in src/main.ts and src/main.server.ts.
  - Router and HttpClient are provided in src/app/app.config.ts.

- Routing
  - Routes are declared in src/app/app.routes.ts with the following paths:
    - '' → redirects to '/products'
    - '/products' → ProductListComponent
    - '/products/add' → ProductFormComponent
    - '/products/edit/:id' → ProductFormComponent

- Components
  - ProductListComponent (src/app/components/product-list/product-list.component.ts): list view shell.
  - ProductFormComponent (src/app/components/product-form/product-form.component.ts): reactive form; supports selecting a main image and additional images with base64 previews; emits productSaved/cancelled events; uses ProductService to create/update.

- Services / data access
  - ProductService (src/app/services/product.service.ts)
    - API base: '/.netlify/functions'
    - Exposes CRUD methods for products and image upload; attaches Authorization header from localStorage when present.
  - AuthService (src/app/services/auth.service.ts)
    - API base: '/.netlify/functions'
    - Handles login/signup (stores a JWT in localStorage), logout, current-user retrieval, basic role check, and token access.
  - Note: These services assume Netlify Functions endpoints (products-direct, image-upload, auth-direct) are available at runtime. They are not implemented in this repo.

- SSR setup
  - Angular SSR configuration:
    - src/main.server.ts bootstraps the app with server-specific providers from src/app/app.config.server.ts.
    - src/app/app.routes.server.ts uses RenderMode.Prerender with a wildcard to prerender routes.
  - Node/Express server:
    - src/server.ts uses @angular/ssr/node and Express to serve static files from the browser build and render remaining routes server-side. Default port is 4000 unless PORT env var is set.
  - Build output
    - After ng build, the dist/home-decor-v19 directory contains browser and server outputs; the SSR entry script referenced by the provided npm script is dist/home-decor-v19/server/server.mjs.

Testing

- Unit tests are configured with Karma + Jasmine (see tsconfig.spec.json and the sample spec at src/app/app.component.spec.ts).
- Quick iteration patterns:
  - Filter to a single spec file with --include.
  - Use fit/fdescribe to focus specific tests/specs during local development.

Relevant files and where to look

- Project configuration: angular.json, tsconfig*.json
- App bootstrap: src/main.ts, src/main.server.ts
- App config/providers: src/app/app.config.ts, src/app/app.config.server.ts
- Routing: src/app/app.routes.ts, src/app/app.routes.server.ts
- SSR server: src/server.ts
- Services: src/app/services/product.service.ts, src/app/services/auth.service.ts

Important excerpts from README.md

- Development server: ng serve → http://localhost:4200
- Build: ng build → outputs to dist/
- Unit tests: ng test
- E2E tests: not configured by default (Angular CLI no longer includes one by default; choose and integrate as needed)

Tooling/rules files

- No CLAUDE rules (CLAUDE.md), Cursor rules (.cursor/rules/ or .cursorrules), or Copilot instructions (.github/copilot-instructions.md) were found at the time of writing.
