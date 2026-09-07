# Changelog

---

## v1.0.0

Initial release.

### Added Features

- Default `sort-keys` mode that recursively sorts object keys while preserving array order and values
- Explicit `vscode-settings` mode for recursive key sorting and lowercasing and sorting of supported `cSpell` word lists
- Explicit `package-json` mode for recursive key sorting with conditional `exports` and `imports` order preservation
- A `jsonUtilsMode` Prettier option to select the mode, with no automatic filename or parser-based mode selection
- Support for Prettier's `json`, `jsonc`, `json5`, and `json-stringify` parsers
