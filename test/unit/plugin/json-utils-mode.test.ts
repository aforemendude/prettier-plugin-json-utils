import { describe, expect, it } from 'vitest';

import { JSON_UTILS_MODE_OPTION, JSON_UTILS_MODES, resolveJsonUtilsMode } from '../../../src/plugin/json-utils-mode.js';

describe('resolveJsonUtilsMode', () => {
  it.each(JSON_UTILS_MODES)('honors an explicit %s mode', (mode) => {
    expect(resolveJsonUtilsMode('json', { [JSON_UTILS_MODE_OPTION]: mode, filepath: '/repo/other.json' })).toBe(mode);
  });

  it.each([
    { expected: 'package-json', filepath: '/repo/package.json', parser: 'json' },
    { expected: 'package-json', filepath: String.raw`C:\repo\package.json`, parser: 'jsonc' },
    { expected: 'vscode-settings', filepath: '/repo/.vscode/settings.json', parser: 'json-stringify' },
    { expected: 'vscode-settings', filepath: String.raw`C:\Users\name\settings.json`, parser: 'json5' },
  ] as const)('detects $expected from $filepath', ({ expected, filepath, parser }) => {
    expect(resolveJsonUtilsMode(parser, { filepath })).toBe(expected);
  });

  it.each(['package-lock.json', 'composer.json', 'settings.json.backup', 'config.json'])(
    'leaves the non-target filename %s alone',
    (filename) => {
      expect(resolveJsonUtilsMode('json-stringify', { filepath: `/repo/${filename}` })).toBeUndefined();
    },
  );

  it('uses the parser to select a programmatic fallback when filepath is omitted', () => {
    expect(resolveJsonUtilsMode('json-stringify', {})).toBe('package-json');
    expect(resolveJsonUtilsMode('json', {})).toBe('vscode-settings');
    expect(resolveJsonUtilsMode('json5', {})).toBe('vscode-settings');
    expect(resolveJsonUtilsMode('jsonc', {})).toBe('vscode-settings');
  });

  it('rejects an invalid configured mode', () => {
    expect(() => resolveJsonUtilsMode('json', { [JSON_UTILS_MODE_OPTION]: 'invalid' })).toThrow(
      'Expected jsonUtilsMode to be one of: package-json, vscode-settings',
    );
  });
});
