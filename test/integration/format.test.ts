import { format, type Options } from 'prettier';
import { describe, expect, it } from 'vitest';

import plugin from '../../src/index.js';
import { SUPPORTED_PARSER_NAMES } from '../../src/plugin/parser-names.js';

describe.each(SUPPORTED_PARSER_NAMES)('sort-keys formatting with %s', (parser) => {
  it.each([
    undefined,
    '/repo/config.json',
    '/repo/package.json',
    '/repo/.vscode/settings.json',
    String.raw`C:\repo\package.json`,
  ])('uses sort-keys by default regardless of filepath: %s', async (filepath) => {
    const original = {
      z: [{ z: 1, a: 2 }, null, 'Zoo', 'apple', { d: 3, b: 4 }],
      imports: { '#x': { node: './node.js', default: './index.js' } },
      exports: { node: './node.js', default: './index.js' },
      'cSpell.words': ['Zoo', 'apple', 'BETA', 'apple'],
      a: { z: true, a: false },
      Z: 0,
    };
    const expected = {
      Z: 0,
      a: { a: false, z: true },
      'cSpell.words': ['Zoo', 'apple', 'BETA', 'apple'],
      exports: { default: './index.js', node: './node.js' },
      imports: { '#x': { default: './index.js', node: './node.js' } },
      z: [{ a: 2, z: 1 }, null, 'Zoo', 'apple', { b: 4, d: 3 }],
    };
    const options: Options = { filepath, parser, plugins: [plugin] };
    const expectedOutput = await format(JSON.stringify(expected), { parser });
    const output = await format(JSON.stringify(original), options);

    expect(output).toBe(expectedOutput);
    await expect(format(JSON.stringify(original), { ...options, jsonUtilsMode: 'sort-keys' })).resolves.toBe(output);
    await expect(format(output, options)).resolves.toBe(output);
  });

  it('sorts objects inside a root array without reordering elements', async () => {
    const original = '[{"z":1,"a":2},null,[{"d":3,"b":4}],"Zoo","apple"]';
    const expected = '[{"a":2,"z":1},null,[{"b":4,"d":3}],"Zoo","apple"]';

    await expect(format(original, { parser, plugins: [plugin] })).resolves.toBe(await format(expected, { parser }));
  });
});

describe('sort-keys comments', () => {
  it.each(['json', 'jsonc', 'json5'])('preserves comments attached to sorted properties with %s', async (parser) => {
    const original = '{\n// Last setting\n"z": true,\n"a": false\n}';
    const expected = '{\n"a": false,\n// Last setting\n"z": true\n}';

    await expect(format(original, { parser, plugins: [plugin] })).resolves.toBe(await format(expected, { parser }));
  });
});

describe('VS Code settings formatting', () => {
  it('sorts keys, preserves comments, and normalizes every supported cSpell list', async () => {
    const original = [
      '{',
      '  // The comment should move with this setting.',
      '  "z.setting": true,',
      '  "cSpell.words": ["Zoo", "apple", "BETA"],',
      '  "a.setting": { "z": 1, "a": 2 },',
      '  "cSpell.flagWords": ["Denied", "BLOCKED"],',
      '  "cSpell.ignoreWords": ["IgnoreMe", "alpha"],',
      '  "cSpell.userWords": ["UserWord", "beta"]',
      '}',
    ].join('\n');
    const expected = [
      '{',
      '  "a.setting": { "a": 2, "z": 1 },',
      '  "cSpell.flagWords": ["blocked", "denied"],',
      '  "cSpell.ignoreWords": ["alpha", "ignoreme"],',
      '  "cSpell.userWords": ["beta", "userword"],',
      '  "cSpell.words": ["apple", "beta", "zoo"],',
      '  // The comment should move with this setting.',
      '  "z.setting": true',
      '}',
      '',
    ].join('\n');
    const options: Options = {
      filepath: '/repo/.vscode/settings.json',
      jsonUtilsMode: 'vscode-settings',
      parser: 'json',
      plugins: [plugin],
    };

    const output = await format(original, options);

    expect(output).toBe(expected);
    await expect(format(output, options)).resolves.toBe(output);
  });
});

describe('package.json formatting', () => {
  it('matches the exports and imports exceptions used by upgrade-npm-packages', async () => {
    const original = [
      '{',
      '  "scripts": { "test": "vitest", "build": "tsc" },',
      '  "name": "example",',
      '  "metadata": { "node": true, "import": true, "default": true },',
      '  "imports": {',
      '    "#utilities": { "node": "#utilities-node", "default": "#utilities-fallback" },',
      '    "#constants": { "development": "#constants-development", "default": "#constants-production" }',
      '  },',
      '  "exports": {',
      '    "./feature": {',
      '      "node": { "require": "./feature.cjs", "import": "./feature.js", "default": "./fallback.js" },',
      '      "default": "./feature.js"',
      '    },',
      '    ".": { "import": "./index.js", "require": "./index.cjs", "default": "./fallback.js" }',
      '  }',
      '}',
    ].join('\n');
    const expected = [
      '{',
      '  "exports": {',
      '    ".": {',
      '      "import": "./index.js",',
      '      "require": "./index.cjs",',
      '      "default": "./fallback.js"',
      '    },',
      '    "./feature": {',
      '      "node": {',
      '        "require": "./feature.cjs",',
      '        "import": "./feature.js",',
      '        "default": "./fallback.js"',
      '      },',
      '      "default": "./feature.js"',
      '    }',
      '  },',
      '  "imports": {',
      '    "#constants": {',
      '      "development": "#constants-development",',
      '      "default": "#constants-production"',
      '    },',
      '    "#utilities": {',
      '      "node": "#utilities-node",',
      '      "default": "#utilities-fallback"',
      '    }',
      '  },',
      '  "metadata": {',
      '    "default": true,',
      '    "import": true,',
      '    "node": true',
      '  },',
      '  "name": "example",',
      '  "scripts": {',
      '    "build": "tsc",',
      '    "test": "vitest"',
      '  }',
      '}',
      '',
    ].join('\n');
    const options: Options = {
      filepath: '/repo/package.json',
      jsonUtilsMode: 'package-json',
      parser: 'json-stringify',
      plugins: [plugin],
    };

    const output = await format(original, options);

    expect(output).toBe(expected);
    await expect(format(output, options)).resolves.toBe(output);
  });
});

describe('mode selection', () => {
  it('applies an explicit mode to a nonstandard filename', async () => {
    const original = '{ "exports": { ".": { "node": "./node.js", "default": "./index.js" } }, "a": 1 }';
    const options: Options = {
      filepath: '/repo/manifest.json',
      jsonUtilsMode: 'package-json',
      parser: 'json',
      plugins: [plugin],
    };
    const expected = '{ "a": 1, "exports": { ".": { "node": "./node.js", "default": "./index.js" } } }\n';

    await expect(format(original, options)).resolves.toBe(expected);
  });
});
