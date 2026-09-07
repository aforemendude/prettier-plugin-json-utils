import { describe, expect, it } from 'vitest';

import { sortJsonAst } from '../../../src/sorting/sort-json-ast.js';
import { array, object, root, string } from '../support/json-ast.js';

describe('sortJsonAst', () => {
  it.each([
    { mode: 'sort-keys', conditions: ['default', 'node'], words: ['Zoo', 'apple'] },
    { mode: 'package-json', conditions: ['node', 'default'], words: ['Zoo', 'apple'] },
    { mode: 'vscode-settings', conditions: ['default', 'node'], words: ['apple', 'zoo'] },
  ] as const)('applies the $mode policy', ({ mode, conditions, words }) => {
    const targets = { node: './node.js', default: './default.js' };
    const ast = root(
      object([
        [
          'exports',
          object([
            ['node', string(targets.node)],
            ['default', string(targets.default)],
          ]),
        ],
        ['cSpell.words', array([string('Zoo'), string('apple')])],
      ]),
    );

    sortJsonAst(ast, mode);

    expect(ast).toStrictEqual(
      root(
        object([
          ['cSpell.words', array(words.map(string))],
          ['exports', object(conditions.map((name) => [name, string(targets[name])]))],
        ]),
      ),
    );
  });
});
