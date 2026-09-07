# Prettier Plugin JSON Utils

A Prettier plugin for sorting JSON keys, with specialized modes for VS Code settings and `package.json` files.

The plugin has three modes:

- `sort-keys` (default) recursively sorts object keys while preserving array order and values.
- `vscode-settings` recursively sorts object keys and normalizes selected Code Spell Checker word lists.
- `package-json` recursively sorts object keys while preserving the order-sensitive conditional keys below `exports` and
  `imports`.

## Requirements

- Node.js 20 or newer
- Prettier 3.9.0 or newer within version 3

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

With no additional configuration, the plugin uses `sort-keys` for all supported JSON files. You can also select it
explicitly:

```json
{
  "jsonUtilsMode": "sort-keys",
  "plugins": ["@aforemendude/prettier-plugin-json-utils"]
}
```

Modes are never inferred from filenames or parsers. To use the specialized modes, set `jsonUtilsMode` globally or in an
override. For example:

```json
{
  "overrides": [
    {
      "files": "**/settings.json",
      "options": {
        "jsonUtilsMode": "vscode-settings"
      }
    },
    {
      "files": "**/package.json",
      "options": {
        "jsonUtilsMode": "package-json"
      }
    }
  ],
  "plugins": ["@aforemendude/prettier-plugin-json-utils"]
}
```

The plugin wraps Prettier's `json`, `jsonc`, `json5`, and `json-stringify` parsers. The default is `sort-keys` for all
four parsers, including when calling `prettier.format()` without a `filepath`.

If you previously relied on automatic mode selection, add explicit overrides like those above to retain the specialized
behavior. Files with nonstandard names can use the same options.

## Sort Keys Mode (Default)

All object keys are sorted recursively with JavaScript's case-sensitive lexicographic ordering, including objects inside
arrays. Array elements retain their order and string values retain their case. Comments are preserved and move with the
properties they describe.

This mode also sorts keys inside `exports` and `imports`. Select `package-json` for package manifests that need
conditional key order preserved, and `vscode-settings` to normalize supported `cSpell` word lists.

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

Working on this repository requires Node.js 22.12.0 or newer. The published plugin requires Node.js 20 or newer.

```sh
npm install
npm run format:check
npm run typecheck
npm run test
npm run build
```

`npm run test` runs the TypeScript unit and integration suites with Vitest. `npm run build` removes and recreates
`dist`, and `npm run verify` runs formatting, type checking, the build, and all tests.
