# Quick Start Guide

Get started with the React Development Plugin in 5 minutes.

## Installation (Automatic)

When you first use this plugin in Claude Code:
1. Plugin initialization runs automatically
2. All tools are installed globally (Prettier, ESLint, TypeScript)
3. Configuration files are created

**That's it!** No manual setup needed.

## What You Get

### ✅ Automatic Code Quality
Every time you write or edit a TypeScript/JavaScript file:
1. **Linting** - ESLint checks for code quality issues
2. **Auto-fix** - Automatically fixes fixable issues
3. **Formatting** - Prettier makes code consistent

### ✅ IntelliSense & Type Checking
- Get autocomplete suggestions while typing
- See type errors immediately
- Navigate code with "Go to Definition"

### ✅ 57 Best Practice Rules
Access proven React optimization patterns:
- Performance improvements (20-800ms faster)
- Bundle size reduction
- Re-render optimization
- Rendering optimization patterns

## Basic Usage

### 1. Get Guidance on Best Practices

Ask Claude questions like:
```
"Review this React component and suggest improvements based on best practices"
"How can I optimize the bundle size of my React app?"
"What are the most important React performance patterns?"
"Show me how to avoid waterfalls in data fetching"
```

Claude will reference the 57 rules and provide specific recommendations.

### 2. Write Code & Get Auto-Fixed

Just write your TypeScript/JavaScript code:
```typescript
// Your code
const MyComponent = () => {
  const [ state,setState ] = useState(null)
  return <div>{state}</div>
}
```

The plugin automatically:
- ✅ Lints and fixes issues
- ✅ Formats consistently with Prettier
- ✅ Shows type errors if any

### 3. Review Existing Code

Ask Claude to audit your project:
```
"Check this component against React best practices"
"Which of the 57 best practice rules could improve this code?"
"What performance improvements would have the biggest impact?"
```

## Configuration Basics

### ESLint Configuration
The plugin creates `.eslintrc.json` automatically with:
- ✅ TypeScript support
- ✅ React/JSX support
- ✅ Best practice rules

**To customize**: Edit `.eslintrc.json` in the plugin root

Common customizations:
```json
{
  "rules": {
    "no-console": "off",  // Allow console.log
    "react/prop-types": "off"  // Disable prop-types if using TypeScript
  }
}
```

### Prettier Configuration
Use the template in `config/.prettierrc.json` or create your own:
```json
{
  "semi": true,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### TypeScript Configuration
Use the template in `config/tsconfig.json` as a starting point.

## Supported File Types

The plugin automatically lints and formats:
- ✅ `.ts` - TypeScript files
- ✅ `.tsx` - React TypeScript components
- ✅ `.js` - JavaScript files
- ✅ `.jsx` - React components
- ✅ `.mts`, `.cts` - Module variants
- ✅ `.mjs`, `.cjs` - CommonJS variants
- ✅ `.json` - JSON files (Prettier only)

## Common Workflows

### Workflow 1: Build a React Component
```
You: "Create a React component that fetches user data"
Claude: Creates component + applies linting/formatting
Plugin: Auto-formats and lints the component
You: Component is ready to use!
```

### Workflow 2: Optimize Existing Code
```
You: "Review this component for performance issues"
Claude: Analyzes against 57 best practices
Claude: Suggests specific optimizations
You: Claude explains which rules apply and how
```

### Workflow 3: Learn Best Practices
```
You: "What's the best way to handle data fetching in React?"
Claude: References client-data-fetching rules
Claude: Shows code examples with pros/cons
You: You understand the pattern and can apply it
```

## Troubleshooting

### Issue: Linting/formatting not running

**Solution**: Verify the file type is supported:
- Must be `.ts`, `.tsx`, `.js`, `.jsx`, `.json` (or variants)
- Check that hooks are enabled in Claude Code

### Issue: ESLint or Prettier not found

**Solution**: Run setup manually:
```bash
npm run setup
```

### Issue: TypeScript errors in editor

**Solution**: Install TypeScript Language Server:
```bash
npm install --global typescript-language-server
```

### Issue: I want to disable linting on certain files

**Edit `.eslintignore`**:
```
node_modules/
dist/
build/
legacy/**  # Ignore legacy folder
```

## Best Practice Rules Overview

The plugin includes 57 curated best practices. Here are the categories:

### 🔴 Critical (Biggest Impact)
- **async-*** rules: Eliminate sequential async operations (waterfalls)
- **bundle-*** rules: Reduce JavaScript payload size

### 🟠 High Priority
- **server-*** rules: Optimize server-side rendering in Next.js

### 🟡 Medium Priority
- **rerender-*** rules: Prevent unnecessary re-renders
- **rendering-*** rules: Optimize component rendering
- **client-*** rules: Efficient data fetching patterns

### 🟢 Low Priority
- **js-*** rules: General JavaScript optimization
- **advanced-*** rules: Advanced React/Next.js patterns

**To learn more**: Ask Claude about specific rules or read `skills/react-best-practices/SKILL.md`

## Next Steps

1. **Start coding** - Write a React component
   - Plugin automatically lints and formats

2. **Ask for guidance** - Get best practice recommendations
   - Claude references the 57 rules

3. **Customize configs** - Adjust ESLint/Prettier to your preferences
   - Edit `.eslintrc.json` and `.prettierrc.json`

4. **Read detailed docs** - Check `README.md` for full documentation

## Tips & Tricks

### 💡 Disable a rule for a file
Add at the top of your file:
```typescript
/* eslint-disable @typescript-eslint/no-explicit-any */

// Your code here
```

### 💡 Disable a specific line
```typescript
// eslint-disable-next-line no-console
console.log("Debug info")
```

### 💡 Ask Claude for rule explanations
```
"Explain the async-waterfall rule"
"When should I use async/await vs Promise.all?"
"How do I fix bundle-size warnings?"
```

### 💡 Get multiple perspectives
```
"Show me the best practice way to implement this pattern"
"Compare different approaches to this problem"
"What are the tradeoffs of this optimization?"
```

## Manual Commands

If you need to reinstall or remove tools:

```bash
# Install all dependencies
npm run setup

# Remove all dependencies and config files
npm run uninstall
```

## Need Help?

- **Usage questions**: See `README.md`
- **Troubleshooting**: See troubleshooting section above
- **Configuration**: See `README.md` configuration section
- **Best practices**: Ask Claude directly about specific rules
- **Rule details**: Check `skills/react-best-practices/SKILL.md`

---

**Ready?** Start by creating a React component and watch it get auto-formatted and linted!
