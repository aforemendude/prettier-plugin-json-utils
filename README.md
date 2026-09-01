# Prettier Plugin JSON Utils

A highly opinionated Prettier plugin for sorting VS Code settings and `package.json` files.

The plugin has two modes:

- `vscode-settings` recursively sorts object keys and normalizes selected Code Spell Checker word lists.
- `package-json` recursively sorts object keys while preserving the order-sensitive conditional keys below `exports` and
  `imports`.

## Requirements

- Node.js 20 or newer
- Prettier 3

## Installation

```sh
npm install --save-dev @aforemendude/prettier-plugin-json-utils
```

## Configuration

Load the plugin in your Prettier configuration:

```json
{
  "plugins": ["@aforemendude/prettier-plugin-json-utils"]
}
```

With no additional configuration, the plugin automatically uses `package-json` for files named `package.json` and
`vscode-settings` for files named `settings.json`. Other JSON files use Prettier's normal behavior unchanged.

For a file with a nonstandard name, select either mode with `jsonUtilsMode` in an override:

```json
{
  "overrides": [
    {
      "files": "config/editor-preferences.jsonc",
      "options": {
        "jsonUtilsMode": "vscode-settings"
      }
    },
    {
      "files": "fixtures/manifest.json",
      "options": {
        "jsonUtilsMode": "package-json"
      }
    }
  ],
  "plugins": ["@aforemendude/prettier-plugin-json-utils"]
}
```

The plugin wraps Prettier's `json`, `jsonc`, `json5`, and `json-stringify` parsers. When calling `prettier.format()`
without a `filepath`, `json-stringify` selects `package-json`; the other wrapped parsers select `vscode-settings`.

## VS Code Settings Mode

All object keys are sorted recursively with JavaScript's case-sensitive lexicographic ordering. Normal array order is
preserved, and object keys inside arrays are still sorted.

Arrays assigned to these exact property names are additionally lowercased and sorted:

- `cSpell.flagWords`
- `cSpell.ignoreWords`
- `cSpell.userWords`
- `cSpell.words`

The normalization applies at any nesting level and retains duplicate entries. If one of these settings is not an array
of strings, its array contents are left unchanged. Because sorting occurs on Prettier's JSON AST, comments in JSON and
JSONC settings files are preserved and move with the values they describe.

## Package JSON Mode

Object keys are sorted recursively and array elements retain their original order, matching the JSON serialization
policy in `upgrade-npm-packages` with these order-sensitive exceptions:

- Subpath keys in the root `exports` object are sorted.
- A root `exports` object containing only condition keys retains its order.
- Specifier keys in the root `imports` object are sorted.
- Conditional keys and all nested objects below `exports` and `imports` retain their order.

Conditional order is semantically significant in Node.js, so a sequence such as `types`, `import`, `require`, `default`
is never alphabetized by this mode.

## Development

```sh
npm install
npm run format:check
npm run typecheck
npm run test
npm run build
```

`npm run test` runs the TypeScript unit and integration suites with Vitest. `npm run build` removes and recreates
`dist`, and `npm run verify` runs formatting, type checking, the build, and all tests.
