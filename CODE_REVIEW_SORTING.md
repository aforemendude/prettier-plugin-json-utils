# Code review: Sorting behavior

## Scope and basis

Reviewed all five files in `src/sorting/` and the behavior described in `README.md:72-108`: AST recognition,
property-name comparison, string mutation, recursive sorting, package manifest contexts, and VS Code word-list
normalization. Basis: commit `8b702459186aa0f59835fc6dc6b0de90c3340d11`, initially clean worktree. `CHANGELOG.md`,
generated output, third-party source, individual test cases, and fixture data are excluded from review.

## Findings

No findings were verified in this segment. This does not establish that the sorting implementation is defect-free.

## Checks and results

- Traced each sorting mode from `sortJsonAst` through object and array traversal, including root primitives, nested
  objects, duplicate names, recognized and unrecognized property nodes, and stable lexicographic comparison.
- Exercised the built plugin in an isolated copy with installed Prettier 3.9.6 and all four supported parsers. Checked
  repeat-format stability for ordinary JSON, nested arrays, duplicate keys including escaped equivalent names,
  `__proto__`, numeric-looking string keys, negative zero, and strings whose case should remain unchanged. For strict
  JSON output, parsed input and output and confirmed value equality.
- Checked package mode with root condition maps, exports subpaths, imports specifiers, nested conditions, and fallback
  arrays. Observed sorted regular keys and root subpath/specifier keys while preserving condition and array order.
- Checked VS Code mode with nested language settings, supported and unsupported word-list names, duplicate words,
  mixed-type arrays, escaped strings, Unicode lowercasing, and supplementary characters. String lists normalize as
  documented. Mixed-type lists retain element order and string case, while ordinary recursive object-key sorting still
  applies inside their elements.
- Checked leading and trailing comments, nested `prettier-ignore` properties, ignored roots, and comments attached to
  sorted word-list elements. Comments and ignored source text survived these probes, and the output was stable on a
  second formatting pass. `json-stringify` rejects comments through its native parser.
- `npm run verify` passed in the isolated copy: formatting check, type checking, build, and 161 tests across 9 files.
  `CHANGELOG.md` was omitted from the copy, and existing dependencies were copied without installation or updates.

## Unresolved questions

None identified that warrant a separate finding in this segment.

## Limitations

Runtime checks used Node.js 24.20.0 and Prettier 3.9.6. They were focused behavior probes, not an exhaustive input or
performance study. Arbitrary third-party ASTs and every supported runtime/version combination were not exercised. Parser
compatibility findings are recorded in [the parser integration report](CODE_REVIEW_PARSER_INTEGRATION.md). Individual
test logic, fixtures, assertions, and coverage adequacy were not reviewed. No sorting code or tests were modified.
