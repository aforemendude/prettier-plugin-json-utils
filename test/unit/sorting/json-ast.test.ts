import { describe, expect, it } from 'vitest';

import {
  compareStrings,
  getJsonPropertyName,
  getJsonRootNode,
  isJsonArrayNode,
  isJsonAstNode,
  isJsonObjectNode,
  isJsonStringNode,
  sortJsonObjectProperties,
  updateJsonStringValue,
} from '../../../src/sorting/json-ast.js';
import type { JsonAstNode, JsonObjectNode, JsonStringNode } from '../../../src/sorting/json-ast.js';
import { number, object, root, string } from '../support/json-ast.js';

describe('getJsonRootNode', () => {
  it('returns the original node from either a wrapped or bare AST', () => {
    const node = object([]);

    expect(getJsonRootNode(node)).toBe(node);
    expect(getJsonRootNode(root(node))).toBe(node);
  });

  it.each([undefined, null, false, 1, 'text', {}, { type: 1 }, { type: 'JsonRoot' }, { type: 'JsonRoot', node: {} }])(
    'rejects an invalid root: %j',
    (ast) => {
      expect(getJsonRootNode(ast)).toBeUndefined();
    },
  );
});

describe('getJsonPropertyName', () => {
  it.each([
    [{ type: 'StringLiteral', value: '' }, ''],
    [{ type: 'Literal', value: 'key', name: 'ignored' }, 'key'],
    [{ type: 'Identifier', name: 'key' }, 'key'],
    [{ type: 'Literal', value: 1, name: 'fallback' }, 'fallback'],
    [{ type: 'Literal', value: 1 }, undefined],
  ] as const)('reads string values or identifier names from %j', (key, expected) => {
    expect(getJsonPropertyName({ type: 'Property', key, value: number(1) })).toBe(expected);
  });
});

describe('AST guards', () => {
  it.each([
    [null, false],
    [undefined, false],
    [1, false],
    ['node', false],
    [{}, false],
    [{ type: 1 }, false],
    [{ type: 'Unknown' }, true],
  ])('identifies AST nodes: %j', (value, expected) => {
    expect(isJsonAstNode(value)).toBe(expected);
  });

  it.each([
    [{ type: 'ArrayExpression', elements: [] }, true],
    [{ type: 'ArrayExpression', elements: [null] }, true],
    [{ type: 'ArrayExpression' }, false],
    [{ type: 'ArrayExpression', elements: {} }, false],
    [{ type: 'ObjectExpression', elements: [] }, false],
  ] satisfies Array<[JsonAstNode, boolean]>)('identifies array nodes: %j', (node, expected) => {
    expect(isJsonArrayNode(node)).toBe(expected);
  });

  it.each([
    [object([]), true],
    [object([['a', number(1)]]), true],
    [
      {
        type: 'ObjectExpression',
        properties: [{ type: 'Property', key: { type: 'Identifier', name: 'a' }, value: number(1) }],
      },
      true,
    ],
    [{ type: 'ObjectExpression' }, false],
    [{ type: 'ObjectExpression', properties: {} }, false],
    [{ type: 'ArrayExpression', properties: [] }, false],
    ...[
      null,
      {},
      { type: 'SpreadElement' },
      { type: 'Property', key: null, value: number(1) },
      { type: 'ObjectProperty', key: string('a'), value: {} },
    ].map((property): [JsonAstNode, boolean] => [{ type: 'ObjectExpression', properties: [property] }, false]),
  ] satisfies Array<[JsonAstNode, boolean]>)('identifies objects with valid properties: %j', (node, expected) => {
    expect(isJsonObjectNode(node)).toBe(expected);
  });

  it.each([
    [null, false],
    [string(''), true],
    [{ type: 'Literal', value: 'text' }, true],
    [{ type: 'Literal', value: 1 }, false],
    [{ type: 'StringLiteral' }, false],
    [{ type: 'Identifier', value: 'text' }, false],
  ] satisfies Array<[JsonAstNode | null, boolean]>)('identifies string nodes: %j', (node, expected) => {
    expect(isJsonStringNode(node)).toBe(expected);
  });
});

describe('sortJsonObjectProperties', () => {
  it('sorts lexicographically and preserves duplicate-key order and property metadata', () => {
    const node = object([
      ['2', number(2)],
      ['a', number(1)],
      ['10', number(10)],
      ['a', number(3)],
      ['Z', number(0)],
      ['', number(4)],
    ]);
    node.properties[0]!['comments'] = ['keep'];
    const expected = object([
      ['', number(4)],
      ['10', number(10)],
      ['2', number(2)],
      ['Z', number(0)],
      ['a', number(1)],
      ['a', number(3)],
    ]);
    expected.properties[2]!['comments'] = ['keep'];

    sortJsonObjectProperties(node);

    expect(node).toStrictEqual(expected);
  });

  it('preserves the entire object when any property name is unknown', () => {
    const node: JsonObjectNode = object([
      ['z', number(1)],
      ['a', number(2)],
    ]);
    node.properties.push({ type: 'Property', key: number(3), value: string('three') });
    const expected = structuredClone(node);

    sortJsonObjectProperties(node);

    expect(node).toStrictEqual(expected);
  });
});

describe('updateJsonStringValue', () => {
  it('updates ESTree raw text with JSON escaping and preserves metadata', () => {
    const node: JsonStringNode = { type: 'Literal', value: 'old', raw: "'old'", comments: ['keep'] };

    updateJsonStringValue(node, 'a"\n');

    expect(node).toStrictEqual({ type: 'Literal', value: 'a"\n', raw: '"a\\"\\n"', comments: ['keep'] });
  });

  it.each([undefined, null, 'invalid', { raw: '"old"', rawValue: 'old', parenthesized: true }])(
    'updates Babel raw metadata while preserving other fields: %j',
    (extra) => {
      const node: JsonStringNode = { type: 'StringLiteral', value: 'old', extra };

      updateJsonStringValue(node, 'new');

      expect(node).toStrictEqual({
        type: 'StringLiteral',
        value: 'new',
        extra: {
          ...(typeof extra === 'object' && extra !== null ? extra : {}),
          raw: '"new"',
          rawValue: 'new',
        },
      });
    },
  );

  it.each([
    { type: 'Literal', value: 'same', raw: "'same'" },
    { type: 'StringLiteral', value: 'same', extra: { raw: "'same'", rawValue: 'same' } },
  ] satisfies JsonStringNode[])('preserves original quoting for unchanged $type values', (node) => {
    const expected = structuredClone(node);

    updateJsonStringValue(node, 'same');

    expect(node).toStrictEqual(expected);
  });
});

describe('compareStrings', () => {
  it.each([
    ['a', 'b', -1],
    ['b', 'a', 1],
    ['same', 'same', 0],
    ['', 'a', -1],
    ['10', '2', -1],
    ['Z', 'a', -1],
  ] as const)('compares %j and %j lexicographically', (left, right, expected) => {
    expect(compareStrings(left, right)).toBe(expected);
  });
});
