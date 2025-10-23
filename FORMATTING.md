# Code Formatting Setup

This project uses Prettier and ESLint for consistent code formatting and linting.

## Configuration Files

- `.prettierrc` - Prettier configuration (2 spaces, single quotes, trailing commas)
- `.editorconfig` - Editor-agnostic formatting rules
- `.vscode/settings.json` - VS Code specific settings
- `.vscode/extensions.json` - Recommended VS Code extensions

## Available Scripts

```bash
# Format all files
npm run format

# Check formatting without changing files
npm run format:check

# Lint and fix issues
npm run lint:fix

# Lint only
npm run lint
```

## IDE Setup

### VS Code
1. Install recommended extensions (Prettier, ESLint)
2. Enable format on save
3. Use Prettier as default formatter

### Other IDEs
- Install Prettier and ESLint plugins
- Configure to use project settings
- Enable format on save

## Formatting Rules

- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Semicolons**: Always
- **Trailing commas**: Always
- **Line width**: 100 characters
- **Arrow functions**: Always use parentheses around parameters

## Pre-commit Hooks (Optional)

Consider adding husky and lint-staged for automatic formatting on commit:

```bash
npm install --save-dev husky lint-staged
```

Then add to package.json:
```json
{
  "lint-staged": {
    "*.{ts,js,json}": ["prettier --write", "eslint --fix"]
  }
}
```
