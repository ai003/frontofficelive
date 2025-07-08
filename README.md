# Basketball Forum

A modern basketball discussion forum built with React, TypeScript, Vite, and Tailwind CSS v4.

## Getting Started

```bash
npm install
npm run dev
```

## 🎨 Tailwind CSS v4 Setup

This project uses **Tailwind CSS v4** (latest version), which has some key differences from the more common v3:

### Key Differences from v3:

**CSS Import Syntax:**
- ✅ v4: `@import "tailwindcss";`
- ❌ v3: `@tailwind base;` + `@tailwind components;` + `@tailwind utilities;`

**Configuration:**
- Config file format remains the same (`tailwind.config.js`)
- PostCSS setup uses `@tailwindcss/postcss` plugin

### Common Issues & Troubleshooting:

**🚨 Problem: Styles not loading (site appears unstyled)**
- **Cause:** Using v3 syntax in CSS file
- **Fix:** Ensure `src/index.css` uses `@import "tailwindcss";`

**🚨 Problem: Build errors or class conflicts**
- **Cause:** Mixing v3 and v4 syntax
- **Fix:** Use only v4 import syntax, check PostCSS config

**🚨 Problem: IDE warnings about unknown @import**
- **Cause:** Editor doesn't recognize v4 syntax
- **Fix:** Install latest Tailwind CSS IntelliSense extension

### Migration from v3:
If converting from v3, replace:
```css
/* Remove these v3 directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Replace with v4 import */
@import "tailwindcss";
```

### Why v4?
- 🚀 Faster build times
- 📦 Smaller bundle sizes
- 🎯 Better performance
- 🔧 Unified import syntax

---

## React + Vite Setup

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
