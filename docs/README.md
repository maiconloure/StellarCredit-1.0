# Stellar Credit Documentation Site

This directory hosts the Docusaurus-powered documentation for the Stellar Credit project.

## Quick Start
```bash
cd docs
npm install
npm run start
```
Visit: http://localhost:3000

## Build & Deploy
```bash
npm run build
npm run serve      # Test production build locally
npm run deploy     # Requires GitHub Pages setup
```

## Structure
```
/docs
  docusaurus.config.js
  sidebars.js
  package.json
  /docs                # Markdown content
    intro.md
    /architecture
    /guides
    /reference
  /src
    /css
```

## TypeDoc Generation (future)
Run:
```bash
npm run typedoc
```
Outputs API references to `docs/reference/*` (add sidebar entries afterward).

## i18n
Configured for English (default) and Portuguese. Add translations via the Docusaurus i18n workflow when content stabilizes.

## Next Enhancements
- Add actual backend & AI endpoint auto-generation
- Inject build version into docs
- Add search (Algolia DocSearch config)
- Add dark mode toggle customization

---
Maintained with ❤️ by the Stellar Credit team.
