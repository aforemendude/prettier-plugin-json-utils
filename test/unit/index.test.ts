import { describe, expect, it } from 'vitest';

import plugin, { JSON_UTILS_MODE_OPTION, JSON_UTILS_MODES, name, options, parsers } from '../../src/index.js';

describe('plugin entry point', () => {
  it('exports the named plugin, parser wrappers, and its two-mode option', () => {
    expect(name).toBe('@aforemendude/prettier-plugin-json-utils');
    expect(Object.keys(parsers)).toEqual(['json', 'json-stringify', 'json5', 'jsonc']);
    expect(JSON_UTILS_MODE_OPTION).toBe('jsonUtilsMode');
    expect(JSON_UTILS_MODES).toEqual(['package-json', 'vscode-settings']);
    expect(options[JSON_UTILS_MODE_OPTION]?.choices.map((choice) => choice.value)).toEqual(JSON_UTILS_MODES);
    expect(plugin).toStrictEqual({ name, options, parsers });
  });
});
