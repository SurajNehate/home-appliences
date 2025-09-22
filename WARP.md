# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: Angular 19 application with optional SSR via @angular/ssr and an Express server. Deployed statically via Netlify by default.

Commands you will commonly use

- Install dependencies

```bash path=null start=null
npm ci
```

- Start dev server (CSR)

```bash path=null start=null
npm start
```

- Build (production by default)

```bash path=null start=null
npm run build
```

- Continuous development build (watch, development config)

```bash path=null start=null
npm run watch
```

- Run unit tests (Karma + Jasmine)

```bash path=null start=null
npm test
```

- Run a single spec file

```bash path=null start=null
npx ng test --include=src/path/to/your.spec.ts
```

- Headless CI-style test run

```bash path=null start=null
npx ng test --watch=false --browsers=ChromeHeadless
```

- Build for SSR and serve with Node (Express)

```bash path=null start=null
npx ng build --ssr
npm run serve:ssr:home-decor-v19
```

- Serve SSR on a custom port (PowerShell)

```bash path=null start=null
$env:PORT=5000
npm run serve:ssr:home-decor-v19
```

Notes on linting/formatting

- No lint script or ESLint configuration is present in this repository.

High-level architecture and structure

- App type and build system
  - Single-project Angular application configured via angular.json using the @angular-devkit/build-angular:application builder.
  - Default outputPath is dist/home-decor-v19. outputMode is set to "static", which produces static output by default (suitable for Netlify).
  - Global styles are authored in SCSS (src/styles.scss). Static assets are served from public/.

- Entrypoints and bootstrapping
  - Client bootstrap: src/main.ts bootstraps AppComponent with appConfig.
  - Server bootstrap: src/main.server.ts bootstraps AppComponent with server-side config for SSR.

- Server-side rendering (SSR)
  - An Express server (src/server.ts) integrates @angular/ssr/node:
    - Serves prebuilt static assets from dist/.../browser with long-term caching.
    - Falls through to AngularNodeAppEngine to render routes on the server when enabled.
    - Listens on process.env.PORT or defaults to 4000 when launched directly.
    - Exported reqHandler supports integration with Angular CLI or serverless functions if desired.
  - To produce the server bundle, build with the --ssr flag (see commands above), then run the provided npm script to start the Node server.

- Testing
  - Unit tests use Karma with Jasmine. The test target is defined in angular.json and includes src/**/*.spec.ts via tsconfig.spec.json.
  - For test selection, prefer --include to run specific spec files. (Jasmine name filtering is not exposed via a CLI flag here.)

- TypeScript configuration
  - tsconfig.json enables strict mode with additional safety checks (noImplicitReturns, noFallthroughCasesInSwitch, etc.).
  - Module/target are ES2022 with bundler-style resolution and isolatedModules enabled.

- UI and runtime dependencies
  - UI libraries include @angular/material and Bootstrap.
  - Runtime server-side libraries are present (express, pg, bcryptjs, jsonwebtoken). They are not imported in client code; keep any usage within Node-only contexts (e.g., src/server.ts) to avoid bundling them into the browser build.

- Deployment
  - Netlify is configured via netlify.toml to run npm run build and publish dist/home-decor-v19. This aligns with the static (CSR/SSG) output. Dynamic Node SSR via Express is separate and not part of this Netlify config.
