# AGENTS.md

This is a Prettier plugin package named `@aforemendude/prettier-plugin-json-utils`. It applies opinionated sorting to VS
Code settings and `package.json` files while leaving Prettier's built-in JSON printers in charge of layout.

- The plugin entry point is `src/index.ts`.
- Parser wrapping and mode selection live under `src/plugin/`.
- JSON AST helpers and the two sorting policies live under `src/sorting/`.
- `dist/` is generated output. Do not edit it by hand; run `npm run build`.

## Development Commands

- Use Node.js 22.12 or newer.
- Run `npm run format:check` for formatting validation.
- Run `npm run typecheck` to type-check source, tests, and Vitest configuration.
- Run `npm run test` for behavior changes. Use `npm run test:unit` or `npm run test:integration` for one suite.
- Run `npm run verify` before publish-oriented changes. It runs formatting, type checking, the build, and tests.
- If npm tries to write to the read-only home cache in this environment, use a writable cache such as
  `npm_config_cache=/tmp/npm-cache`.

## TypeScript Rules

- Keep the strict compiler settings in `tsconfig.json`, including `strict` and `noUncheckedIndexedAccess`.
- This repo uses `module` and `moduleResolution` set to `nodenext`; internal TypeScript imports should use `.js`
  specifiers even when importing `.ts` source files.
- Fix type errors with explicit guards or narrower types. Do not loosen compiler options to make a change pass.
- Avoid comma-separated variable declarators; introduce each variable with its own `const` or `let` statement.
  Destructuring declarations are allowed.
- For multiline strings, prefer an array of lines followed by `.join(newline)` instead of embedding line breaks in a
  string or template literal.

## Tests And Behavior

- TypeScript unit tests live under `test/unit/`, import source modules directly, and mirror source concerns and file
  names wherever practical.
- End-to-end Prettier behavior belongs in `test/integration/` and should include a repeated-format idempotence check.
- VS Code settings sorting is recursive. The four supported `cSpell` word-list settings are lowercased and sorted only
  when their values are arrays containing exclusively strings.
- Package sorting must continue to match the policy in `../upgrade-npm-packages`: sort recursively, keep array order,
  sort export subpaths and import specifiers, and preserve conditional key order below top-level `exports` and
  `imports`.
- Do not broaden automatic filename matching beyond `package.json` and `settings.json` without documenting and testing
  the behavior.
