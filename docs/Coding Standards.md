# Coding Standards

## 1. Language Standards
- **TypeScript**: Use strict-type checking across both frontend and backend.
- Avoid using `any` unless absolutely necessary; if used, document the reason.
- Prefer explicit return types for functions and API controller methods.

## 2. Formatting & Style
- Formatting is enforced via **Prettier** with the following options:
  - Single quotes: `true`
  - Semicolons: `true`
  - Trailing commas: `all`
- Code styling is enforced via **ESLint** rules:
  - No unused variables (`no-unused-vars` / `@typescript-eslint/no-unused-vars`).
  - No logs in production (`no-console` warnings).
  - Use strict equality (`eqeqeq`).

## 3. Naming Conventions
- **Classes / Types / Interfaces**: PascalCase (e.g., `IndentService`, `UserRole`).
- **Variables / Functions**: camelCase (e.g., `createIndent`, `isApproved`).
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`).
- **Files**: camelCase or kebab-case for assets/components; `.ts` for TypeScript, `.tsx` for React components.
