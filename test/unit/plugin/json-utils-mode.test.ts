import { describe, expect, it } from 'vitest';

import { JSON_UTILS_MODE_OPTION, JSON_UTILS_MODES, resolveJsonUtilsMode } from '../../../src/plugin/json-utils-mode.js';

describe('resolveJsonUtilsMode', () => {
  it.each(JSON_UTILS_MODES)('honors an explicit %s mode', (mode) => {
    expect(resolveJsonUtilsMode({ [JSON_UTILS_MODE_OPTION]: mode })).toBe(mode);
  });

  it('defaults to sort-keys when no mode is configured', () => {
    expect(resolveJsonUtilsMode({})).toBe('sort-keys');
    expect(resolveJsonUtilsMode({ [JSON_UTILS_MODE_OPTION]: undefined })).toBe('sort-keys');
  });

  it.each(['invalid', '', null, false, 1])('rejects an invalid configured mode: %s', (mode) => {
    expect(() => resolveJsonUtilsMode({ [JSON_UTILS_MODE_OPTION]: mode })).toThrow(
      'Expected jsonUtilsMode to be one of: sort-keys, package-json, vscode-settings',
    );
  });
});
