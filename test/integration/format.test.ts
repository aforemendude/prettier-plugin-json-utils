import { format, type Options } from 'prettier';
import { describe, expect, it } from 'vitest';

import plugin from '../../src/index.js';

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
      parser: 'json-stringify',
      plugins: [plugin],
    };

    const output = await format(original, options);

    expect(output).toBe(expected);
    await expect(format(output, options)).resolves.toBe(output);
  });
});

describe('mode selection', () => {
  it('leaves non-target JSON files in their original key order', async () => {
    const original = '{ "z": 1, "a": 2 }';
    const options: Options = {
      filepath: '/repo/config.json',
      parser: 'json',
      plugins: [plugin],
    };

    await expect(format(original, options)).resolves.toBe('{ "z": 1, "a": 2 }\n');
  });

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
