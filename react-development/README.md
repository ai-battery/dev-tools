# React Development Plugin

A comprehensive Claude plugin for enhancing React development with automated code quality tools and 57 best practice guidelines.

## Features

### 🎯 57 React & Next.js Best Practice Rules
Organized by impact level (Critical → Low):
- **Critical Priority** (10 rules): Eliminate waterfalls and optimize bundle size
- **High Priority** (7 rules): Server-side performance optimization
- **Medium Priority** (25 rules): Re-rendering, rendering, and client-side data fetching
- **Low Priority** (15 rules): JavaScript performance and advanced patterns

Each rule includes:
- Detailed explanations with performance impact metrics
- Before/after code examples
- Context and implementation guidance
- References and additional resources

### 🔧 Automated Code Quality
- **Linting**: ESLint with TypeScript support automatically runs on file changes
- **Formatting**: Prettier formats code to consistent style
- **Language Server**: TypeScript Language Server for IntelliSense and diagnostics
- **Auto-fix**: ESLint fixes auto-fixable issues automatically

### 📦 Integrated Tools
- **Prettier** - Code formatter with opinionated defaults
- **ESLint** - JavaScript linter with TypeScript support
- **TypeScript Language Server** - IDE-like features (autocomplete, diagnostics)
- **TypeScript** - Full TypeScript support and tooling

## Installation

### Prerequisites
- Node.js 16+ and npm
- macOS, Linux, or WSL (Windows Subsystem for Linux)

### Quick Install

1. **Install the plugin** in Claude Code
2. **Plugin initialization** (automatic):
   - The plugin will automatically run setup on first use
   - All dependencies (Prettier, ESLint, TypeScript, Language Server) are installed globally

3. **Manual setup** (if needed):
   ```bash
   npm run setup
   ```

   This command will:
   - Verify Node.js and npm are installed
   - Install Prettier globally
   - Install TypeScript globally
   - Install TypeScript Language Server globally
   - Install ESLint and related packages globally
   - Create `.eslintrc.json` and `.eslintignore` files

## Usage

### Automatic Features

#### 1. **Auto-Linting & Formatting**
Whenever you write or edit TypeScript/JavaScript files:
1. ESLint automatically lints the file (with auto-fix)
2. Prettier automatically formats the file
3. All changes are validated against your linting rules

Supported file types:
- `.ts`, `.tsx` (TypeScript & React)
- `.js`, `.jsx` (JavaScript & React)
- `.mts`, `.cts` (Module variants)
- `.mjs`, `.cjs` (CommonJS variants)
- `.json` (Prettier only)

#### 2. **Language Server Features**
The TypeScript Language Server provides:
- ✅ IntelliSense and autocompletion
- ✅ Type checking and diagnostics
- ✅ Go to definition
- ✅ Find references
- ✅ Hover documentation

#### 3. **Best Practices Guidance**
Access the 57 React best practice rules by asking Claude to:
- "Review this code against React best practices"
- "How can I optimize this component?"
- "What React patterns should I follow here?"
- "Show me rules for improving performance"

### Manual Setup

If you need to reinstall dependencies:
```bash
npm run setup
```

To uninstall all plugin dependencies and configuration:
```bash
npm run uninstall
```

## Configuration

### ESLint Configuration
The plugin automatically creates `.eslintrc.json` with:
- TypeScript parser and plugin
- ESLint recommended rules
- Prettier integration (no formatting conflicts)
- React/JSX support
- Modern ES2020 and browser/Node.js environments

**To customize**, edit `.eslintrc.json` in the plugin root:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier Configuration
Use the provided `.prettierrc.json` template in the `config/` directory or create your own:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### TypeScript Configuration
Configure TypeScript in your own projects with appropriate `tsconfig.json` settings for React development. Key recommendations:
- Set `"jsx": "react-jsx"` for modern React
- Enable `"strict": true` for type safety
- Use `"moduleResolution": "bundler"` for modern module resolution

## Directory Structure

```
react-development/
├── README.md                          # This file
├── QUICK_START.md                     # Quick start guide for new users
├── package.json                       # Plugin metadata and scripts
├── .claude-plugin/
│   └── plugin.json                    # Claude plugin manifest
├── .lsp.json                          # TypeScript Language Server config
├── hooks/
│   └── hooks.json                     # Auto-linting & formatting hooks
├── scripts/
│   ├── setup.sh                       # Install and verify dependencies
│   ├── uninstall.sh                   # Remove dependencies and configs
│   ├── lint-typescript.sh             # ESLint linting script
│   ├── format-typescript.sh           # Prettier formatting script
│   └── eslint-setup.sh                # Create ESLint configuration
├── config/                            # Configuration templates
│   └── .prettierrc.json               # Prettier configuration template
└── skills/
    └── react-best-practices/
        ├── SKILL.md                   # Skill metadata and quick reference
        ├── AGENTS.md                  # Comprehensive best practices guide
        └── rules/                     # 57 individual best practice rules
            ├── async-*.md             # Waterfall elimination (5 rules)
            ├── bundle-*.md            # Bundle optimization (5 rules)
            ├── server-*.md            # Server-side performance (7 rules)
            ├── client-*.md            # Client-side data fetching (4 rules)
            ├── rerender-*.md          # Re-render optimization (12 rules)
            ├── rendering-*.md         # Rendering performance (9 rules)
            ├── js-*.md                # JavaScript performance (12 rules)
            └── advanced-*.md          # Advanced patterns (3 rules)
```

## Best Practices Overview

### Critical Priority Rules
1. **Eliminate Waterfalls** - Avoid sequential async operations
2. **Bundle Size Optimization** - Reduce JavaScript payload

### High Priority Rules
3. **Server-Side Performance** - Optimize rendering on server

### Medium Priority Rules
4. **Re-render Optimization** - Prevent unnecessary component re-renders
5. **Rendering Performance** - Optimize React component rendering
6. **Client-Side Data Fetching** - Efficient data loading patterns

### Low Priority Rules
7. **JavaScript Performance** - Code optimization techniques
8. **Advanced Patterns** - Advanced React patterns and techniques

See `QUICK_START.md` for a guide to applying these rules or ask Claude directly!

## Troubleshooting

### ESLint or Prettier not found
```bash
npm run setup
```

### TypeScript errors in editor
Ensure TypeScript Language Server is installed:
```bash
npm install --global typescript-language-server
```

### Linting/formatting not running automatically
Check that hooks are enabled in your Claude Code configuration and that the file extension is supported (`.ts`, `.tsx`, `.js`, `.jsx`, etc.)

### Port conflicts or permission errors
- Run setup with appropriate permissions
- Check existing global npm installations: `npm list -g`

### macOS/Linux permission issues
If you encounter permission errors during setup:
```bash
# Try using npm without sudo - prefer npm config
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

## Development & Customization

### Adding Custom ESLint Rules
Edit `.eslintrc.json`:
```json
{
  "rules": {
    "my-custom-rule": "warn"
  }
}
```

### Customizing Prettier Formatting
Create/edit `.prettierrc.json`:
```json
{
  "printWidth": 120,
  "tabWidth": 4
}
```

### Ignoring Files from Linting
Edit `.eslintignore`:
```
node_modules/
dist/
build/
coverage/
```

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run setup` | Install and verify all dependencies |
| `npm run uninstall` | Remove dependencies and configuration files |
| Manual: `bash scripts/setup.sh` | Run setup script directly |
| Manual: `bash scripts/uninstall.sh` | Run uninstall script directly |

Setup logs are saved to `.setup.log` and uninstall logs to `.uninstall.log`

## What's Included

### Tools
- **Prettier 3.0+** - Code formatter
- **ESLint 8.0+** - Linter with TypeScript support
- **TypeScript 5.0+** - Type checking and compilation
- **TypeScript Language Server 4.0+** - IDE features
- **@typescript-eslint** - TypeScript ESLint support

### Documentation
- **57 Best Practice Rules** - 364KB of comprehensive guidance
- **AGENTS.md** - 2,934 lines optimized for AI consumption
- **SKILL.md** - Quick reference and rule index

### Automation
- **Auto-linting** on Write/Edit operations
- **Auto-formatting** with Prettier
- **ESLint auto-fix** for fixable issues
- **Language Server** for IDE support

## Next Steps

1. **Read** `QUICK_START.md` for an introduction to the plugin
2. **Ask Claude** about React/Next.js best practices to get guidance on the 57 rules
3. **Review** existing code against the best practices
4. **Customize** `.eslintrc.json` and `.prettierrc.json` as needed

## Support & Documentation

- **Best Practices**: See `skills/react-best-practices/SKILL.md` for complete rule index
- **Detailed Guidance**: See `skills/react-best-practices/AGENTS.md` for comprehensive guide
- **Individual Rules**: See `skills/react-best-practices/rules/` for detailed rule implementations

## License

This plugin uses best practices from Vercel Engineering. See individual rule files for attribution and references.

## Feedback

For issues, feature requests, or questions, please refer to the troubleshooting section above.

---

**Version**: 0.0.1
**Author**: Hans Eilers
**Maintained**: As part of Claude development tools
