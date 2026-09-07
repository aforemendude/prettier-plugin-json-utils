# Changelog

---

## Unreleased

### Added Features

- A named `sort-keys` mode that recursively sorts object keys while preserving array order and values

### Changed

- `sort-keys` is now the default for all supported JSON parsers and filenames
- Removed automatic mode selection based on filenames and parsers; configure `package-json` and `vscode-settings`
  explicitly to retain their specialized behavior

## v0.1.0

### Added Features

- Recursive VS Code settings key sorting
- Lowercasing and sorting for supported `cSpell` word lists
- Recursive `package.json` sorting with conditional `exports` and `imports` order preservation
- Automatic target filename detection and an explicit two-mode Prettier option
