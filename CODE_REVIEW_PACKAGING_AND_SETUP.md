# Code review: Packaging and development setup

## Scope and basis

Reviewed `package.json`, `package-lock.json`, `tsconfig.json`, `tsconfig.build.json`, `vitest.config.ts`,
`scripts/clean.mjs`, `.gitignore`, `.prettierrc.json`, `.vscode/settings.json`, `AGENTS.md`, `LICENSE`, and the README's
requirements, installation, configuration, and development instructions. Inspected test imports and setup-related
references only to assess runner and dependency configuration. Basis: commit `8b702459186aa0f59835fc6dc6b0de90c3340d11`,
initially clean worktree. `CHANGELOG.md`, dependency source, generated output, individual test cases, fixtures,
assertions, and coverage adequacy are excluded from review. Dependencies' manifests and npm's engine checker were
consulted only to verify setup contracts.

## Findings

### 1. Development instructions omit the stricter Node.js requirement

- **Severity:** Low
- **References:** `README.md:110-118`; `README.md:12-15`; `package.json:14-18`.
- **Problem:** The README states Node.js 20 or newer as its only Node requirement and directs contributors to begin with
  `npm install`. The package's separate `devEngines.runtime.version` requires `>=22.12.0`, with no `onFail` override.
  npm versions that support this field enforce it before installation and script execution; failure defaults to an
  error. See [npm's devEngines documentation](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#devengines).
- **Evidence:** Passed this repository's unmodified `devEngines` object to the installed npm 11.19.0 engine checker.
  Simulated runtime versions `v20.19.0` and `v22.11.0` both produced `Invalid devEngines.runtime` with `isError: true`;
  `v22.12.0` and `v24.20.0` passed. These are engine-checker inputs, not executions under additional Node binaries.
- **Impact:** Contributors following the documented setup on Node 20 or early Node 22 encounter an immediate failure
  despite meeting the README's stated requirement. The consumer runtime requirement can remain Node 20; the omission
  concerns working on the repository.
- **Recommendation:** State the Node.js 22.12.0-or-newer development requirement immediately before the development
  commands, distinguishing it from the published plugin's runtime requirement.

The Prettier peer-range incompatibility is documented once in
[the parser integration report](CODE_REVIEW_PARSER_INTEGRATION.md), finding 1.

## Checks and results

- Compared direct dependencies, peer requirements, lockfile root metadata, and relevant transitive toolchain engine
  requirements. `npm ls --all --offline --ignore-scripts` exited successfully with no missing required dependencies.
  Uninstalled optional platforms and optional integrations were not treated as defects.
- Traced build and clean paths, ESM imports, declaration emission, exported package entry points, package file
  selection, formatter commands, and Vitest's Node environment and file discovery. The source build uses no observed
  runtime language feature requiring a newer Node release than the declared consumer minimum.
- `npm run verify` passed using existing dependencies in an isolated source copy: formatting check, TypeScript checks,
  clean build, and all 161 tests across 9 files. The copy omitted `CHANGELOG.md`; the reviewed worktree's build output
  was not changed. Node.js 24.20.0 and npm 11.19.0 were used.
- `npm pack --dry-run --ignore-scripts --json` succeeded after that build and listed 25 publishable files, including the
  runtime modules, declarations, package manifest, README, and license. Source tests and local configuration were absent
  from the publishable file list.
- Loaded the built package through its public package-name export and successfully formatted JSON. Verified the exported
  option name and mode values at that entry point.
- Checked README configuration examples against the registered parser and option names, and compared documented sorting
  behavior with the implementations. Reviewed the tracked file inventory for additional setup or CI configuration.

## Unresolved questions

None required to establish the finding. Whether source archives without Git metadata must support packaging is
unspecified: `prepack` runs `git diff`, so its supported environment currently includes a Git checkout.

## Limitations and checks not run

- Did not execute the full `prepack` hook or install/update dependencies: `prepack` starts with `npm install`, which
  conflicts with the review skill's restriction on dependency changes. Its subsequent lockfile check was inspected
  statically. The dry run deliberately disabled lifecycle scripts and does not establish that the full release hook
  succeeds.
- Did not publish a package, install the package into another project, execute other Node versions, or audit third-party
  implementation code or vulnerability databases. Package resolution was tested from the built isolated checkout.
- Individual test logic, fixtures, assertions, and coverage adequacy were not reviewed. Existing test execution was used
  as evidence that the configured tools run successfully, not as an assertion of complete behavioral correctness.
- Only review reports were added to the original worktree; no reviewed source, configuration, tests, or lockfile were
  modified.
