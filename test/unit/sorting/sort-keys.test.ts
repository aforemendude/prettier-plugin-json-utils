import { describe, expect, it } from 'vitest';

import { sortKeysAst } from '../../../src/sorting/sort-keys.js';
import { array, number, object, root, string } from '../support/json-ast.js';

describe('sortKeysAst', () => {
  it('sorts nested objects and keeps array positions, duplicate keys, and values', () => {
    const ast = root(
      object([
        [
          'z',
          array([
            object([
              ['z', number(1)],
              ['a', number(2)],
            ]),
            string('Zoo'),
            string('apple'),
          ]),
        ],
        ['a', number(3)],
        ['a', number(4)],
        ['Z', number(5)],
      ]),
    );
    const expected = root(
      object([
        ['Z', number(5)],
        ['a', number(3)],
        ['a', number(4)],
        [
          'z',
          array([
            object([
              ['a', number(2)],
              ['z', number(1)],
            ]),
            string('Zoo'),
            string('apple'),
          ]),
        ],
      ]),
    );

    sortKeysAst(ast);

    expect(ast).toStrictEqual(expected);
    sortKeysAst(ast);
    expect(ast).toStrictEqual(expected);
  });

  it('traverses root arrays and nested arrays while preserving holes', () => {
    const ast = {
      type: 'ArrayExpression',
      elements: [
        null,
        array([
          object([
            ['b', number(2)],
            ['a', number(1)],
          ]),
        ]),
      ],
    };

    sortKeysAst(ast);

    expect(ast).toStrictEqual({
      type: 'ArrayExpression',
      elements: [
        null,
        array([
          object([
            ['a', number(1)],
            ['b', number(2)],
          ]),
        ]),
      ],
    });
  });

  it.each([undefined, null, 1, {}, { type: 'JsonRoot', node: null }, string('unchanged'), object([])])(
    'leaves unsupported or empty input unchanged: %j',
    (ast) => {
      const expected = structuredClone(ast);

      sortKeysAst(ast);

      expect(ast).toStrictEqual(expected);
    },
  );
});
