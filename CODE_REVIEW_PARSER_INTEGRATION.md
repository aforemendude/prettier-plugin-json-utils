# Code review: Parser integration

## Scope and basis

Reviewed `src/index.ts`, `src/plugin/*.ts`, and their contracts with the sorting entry point, package peer requirements,
and README. Basis: commit `8b702459186aa0f59835fc6dc6b0de90c3340d11`, initially clean worktree. `CHANGELOG.md`,
generated output, dependency implementations, and individual test cases are excluded from review. Dependency behavior
was inspected only where needed to validate integration findings.

## Findings

### 1. Async preprocessing breaks supported Prettier versions before 3.7

- **Severity:** High
- **References:** `src/plugin/create-parsers.ts:38-42`; `package.json:43-45`; `README.md:14-15`.
- **Problem:** Every wrapped parser exposes an `async preprocess`, including when there is no preceding plugin. The
  declared peer range accepts Prettier 3.0 through 3.6, whose core passes the preprocessing result directly to `parse`
  without awaiting it. Consequently, those versions pass a Promise to the Babel parser instead of source text.
  [Prettier 3.6.2's parsing implementation](https://github.com/prettier/prettier/blob/3.6.2/src/main/parse.js) confirms
  this call sequence; [Prettier's plugin API](https://prettier.io/docs/plugins#parsers) identifies 3.7.0 as the first
  version supporting asynchronous preprocessing.
- **Evidence:** Executed that synchronous handoff using the current exported parser: `preprocess` returned a Promise,
  and passing it to `parse` failed with `TypeError: this.input.charCodeAt is not a function`. This is a reproduction of
  the older core's call sequence using installed Prettier 3.9.6, not an execution of an installed older release.
- **Impact:** Ordinary JSON formatting fails for consumers using versions explicitly accepted by the package, even with
  this plugin alone and the default mode.
- **Recommendation:** Raise the minimum Prettier peer requirement to 3.7.0 and update the documented requirement, or
  redesign preprocessing to satisfy the synchronous contract on older supported versions.

### 2. Parser delegation can pair an incompatible AST with Babel's printer

- **Severity:** Medium
- **References:** `src/plugin/create-parsers.ts:25-29`, `src/plugin/create-parsers.ts:69-75`,
  `src/plugin/create-parsers.ts:164-165`.
- **Problem:** The wrapper copies Babel's `astFormat` and location functions, then delegates to any preceding parser
  with a callable `parse`. It never checks whether that parser produces the same AST format. Prettier therefore selects
  Babel's printer while receiving the preceding plugin's different AST. The
  [Prettier plugin contract](https://prettier.io/docs/plugins#printers) requires the printer to match the parser's
  `astFormat`.
- **Evidence:** A valid preceding `json` parser using `parse: JSON.parse`, `astFormat: 'custom-json'`, zero-valued
  location functions, and a matching printer that returns `JSON.stringify(path.node)` successfully formats
  `{"z":1,"a":2}` alone. With `plugins: [customPlugin, jsonUtilsPlugin]`, the same call fails with
  `Missing visitor keys for 'undefined'.` A preceding Babel-compatible parser with preprocessing succeeds.
- **Impact:** Loading this plugin after a JSON plugin that uses another AST format breaks otherwise working formatting.
  This affects configurations with such a preceding plugin; the normal standalone configuration is unaffected.
- **Recommendation:** Restrict delegation to compatible parser contracts and explicitly handle incompatible delegates,
  or arrange for the delegated parser's complete AST/printer contract to be selected before parsing. Do not treat the
  presence of `parse` alone as proof of compatibility.

## Checks and results

- Reviewed parser registration, mode validation and options, delegate lookup, duplicate registration, plugin
  restoration, preprocessing, and range/cursor guards.
- Exercised all four parser names with normal formatting, full and partial ranges, and cursor offsets using installed
  Prettier 3.9.6. Cursor formatting intentionally skips sorting; partial range formatting can sort during Prettier's
  subsequent formatting of the selected enclosing node.
- Confirmed successful preprocessing through a compatible preceding parser and successful duplicate plugin registration.
- `npm run verify` passed in an isolated copy using the existing dependencies: formatting check, type checking, build,
  and all 161 tests across 9 files. The copy excluded `CHANGELOG.md`. No dependencies were installed or updated, and
  generated files were written only in the temporary copy.

## Unresolved questions

None required to establish the findings. The intended extent of support for other JSON plugins is undocumented; finding
2 describes the demonstrated failure and limits its impact to incompatible preceding parsers.

## Limitations

Runtime checks used Node.js 24.20.0 and Prettier 3.9.6. Older Prettier behavior was validated from the pinned upstream
source and the reproduced handoff, not by installing other versions. Individual test logic, fixtures, assertions, and
coverage adequacy were not reviewed. No source, configuration, or tests were modified.
