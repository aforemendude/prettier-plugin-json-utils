import type { Parser, ParserOptions, Plugin } from 'prettier';
import * as babelPlugin from 'prettier/plugins/babel';
import { describe, expect, it, vi } from 'vitest';

import { createParsers } from '../../../src/plugin/create-parsers.js';
import { PLUGIN_NAME } from '../../../src/plugin/plugin-name.js';
import { getJsonPropertyName, getJsonRootNode } from '../../../src/sorting/json-ast.js';
import type { JsonObjectNode } from '../../../src/sorting/json-ast.js';
import { number, object, root } from '../support/json-ast.js';

const text = '{"z":1,"a":2}';

function parserOptions(overrides: Partial<ParserOptions<unknown>> = {}): ParserOptions<unknown> {
  return { parser: 'json', plugins: [], rangeStart: 0, rangeEnd: Infinity, ...overrides } as ParserOptions<unknown>;
}

function delegateFixture() {
  const ast = root(
    object([
      ['z', number(1)],
      ['a', number(2)],
    ]),
  );
  const seenPlugins: ParserOptions<unknown>['plugins'][] = [];
  const parse = vi.fn(async (_text: string, options: ParserOptions<unknown>) => {
    seenPlugins.push(options.plugins);
    return ast;
  });
  const preprocess = vi.fn(async (input: string, options: ParserOptions<unknown>) => {
    seenPlugins.push(options.plugins);
    return input.trim();
  });
  const parser: Parser<unknown> = {
    astFormat: 'estree',
    locStart: () => 0,
    locEnd: () => text.length,
    parse,
    preprocess,
  };
  const plugin: Plugin<unknown> = { parsers: { json: parser } };
  return { ast, seenPlugins, parse, preprocess, parser, plugin };
}

describe('createParsers', () => {
  it('wraps exactly the supported native parsers and preserves their formatting metadata', () => {
    const parsers = createParsers();

    expect(Object.keys(parsers)).toEqual(['json', 'json-stringify', 'json5', 'jsonc']);
    for (const name of ['json', 'json-stringify', 'json5', 'jsonc'] as const) {
      const { parse, preprocess, ...metadata } = parsers[name]!;
      const { parse: nativeParse, preprocess: nativePreprocess, ...nativeMetadata } = babelPlugin.parsers[name];
      expect(metadata).toStrictEqual(nativeMetadata);
      expect(parse).not.toBe(nativeParse);
      expect(preprocess).not.toBe(nativePreprocess);
    }
  });

  it.each(['json', 'json-stringify', 'json5', 'jsonc'])(
    'uses the native %s parser when no delegate is registered',
    async (name) => {
      const parser = createParsers()[name]!;
      const options = parserOptions({ parser: name });

      const ast = await parser.parse(text, options);

      expect((getJsonRootNode(ast) as JsonObjectNode).properties.map(getJsonPropertyName)).toEqual(['a', 'z']);
      await expect(parser.preprocess!(text, options)).resolves.toBe(text);
    },
  );

  it('delegates to the nearest preceding parser with truncated plugins and restores options', async () => {
    const earlier = delegateFixture();
    const selected = delegateFixture();
    const later = delegateFixture();
    const wrappers = { parsers: createParsers() };
    const plugins = [earlier.plugin, selected.plugin, wrappers, later.plugin];
    const options = parserOptions({ plugins });
    const parser = wrappers.parsers['json']!;

    await expect(parser.preprocess!(` ${text} `, options)).resolves.toBe(text);
    const ast = await parser.parse(text, options);

    expect(ast).toBe(selected.ast);
    expect(ast).toStrictEqual(
      root(
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
      ),
    );
    expect(selected.preprocess).toHaveBeenCalledExactlyOnceWith(` ${text} `, options);
    expect(selected.parse).toHaveBeenCalledExactlyOnceWith(text, options);
    expect(selected.seenPlugins).toEqual([
      [earlier.plugin, selected.plugin],
      [earlier.plugin, selected.plugin],
    ]);
    expect(options.plugins).toBe(plugins);
    expect(earlier.parse).not.toHaveBeenCalled();
    expect(earlier.preprocess).not.toHaveBeenCalled();
    expect(later.parse).not.toHaveBeenCalled();
    expect(later.preprocess).not.toHaveBeenCalled();
  });

  it.each([false, true])('supports lazy parser delegates (async: %s)', async (asynchronous) => {
    const delegate = delegateFixture();
    const factory = vi.fn(() => (asynchronous ? Promise.resolve(delegate.parser) : delegate.parser));
    // Prettier loads parser factories at runtime, although Plugin types only describe resolved parsers.
    const lazyPlugin = { parsers: { json: factory } } as unknown as Plugin;
    const wrappers = { parsers: createParsers() };
    const plugins = [lazyPlugin, wrappers];
    const options = parserOptions({ plugins });

    await expect(wrappers.parsers['json']!.parse(text, options)).resolves.toStrictEqual(
      root(
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
      ),
    );

    expect(factory).toHaveBeenCalledExactlyOnceWith();
    expect(delegate.parse).toHaveBeenCalledExactlyOnceWith(text, options);
    expect(delegate.seenPlugins).toEqual([[lazyPlugin]]);
    expect(options.plugins).toBe(plugins);
  });

  it.each(['direct', 'lazy', 'async lazy'])(
    'uses the native parser and skips preprocessing for an incompatible %s parser',
    async (entryType) => {
      const incompatible = delegateFixture();
      incompatible.parser.astFormat = 'custom-json';
      const parserEntry =
        entryType === 'direct'
          ? incompatible.parser
          : () => (entryType === 'lazy' ? incompatible.parser : Promise.resolve(incompatible.parser));
      const preceding = { parsers: { json: parserEntry } } as unknown as Plugin;
      const wrappers = { parsers: createParsers() };
      const plugins = [preceding, wrappers];
      const options = parserOptions({ plugins });
      const parser = wrappers.parsers['json']!;

      await expect(parser.preprocess!(` ${text} `, options)).resolves.toBe(` ${text} `);
      const ast = await parser.parse(text, options);

      expect((getJsonRootNode(ast) as JsonObjectNode).properties.map(getJsonPropertyName)).toEqual(['a', 'z']);
      expect(incompatible.parse).not.toHaveBeenCalled();
      expect(incompatible.preprocess).not.toHaveBeenCalled();
      expect(options.plugins).toBe(plugins);
    },
  );

  it('delegates to an earlier compatible parser when the nearest parser has a different AST format', async () => {
    const compatible = delegateFixture();
    const incompatible = delegateFixture();
    incompatible.parser.astFormat = 'custom-json';
    const wrappers = { parsers: createParsers() };
    const plugins = [compatible.plugin, incompatible.plugin, wrappers];
    const options = parserOptions({ plugins });
    const parser = wrappers.parsers['json']!;

    await expect(parser.preprocess!(` ${text} `, options)).resolves.toBe(text);
    await expect(parser.parse(text, options)).resolves.toBe(compatible.ast);

    expect(compatible.preprocess).toHaveBeenCalledExactlyOnceWith(` ${text} `, options);
    expect(compatible.parse).toHaveBeenCalledExactlyOnceWith(text, options);
    expect(incompatible.preprocess).not.toHaveBeenCalled();
    expect(incompatible.parse).not.toHaveBeenCalled();
    expect(options.plugins).toBe(plugins);
  });

  it('skips plugin paths, URLs, missing parsers, inherited entries, and invalid lazy results', async () => {
    const delegate = delegateFixture();
    const wrappers = { parsers: createParsers() };
    const invalidFactory = vi.fn(async () => null);
    const invalidParse = vi.fn(() => null);
    const skipped = [
      'plugin-name',
      new URL('file:///fixture/plugin.js'),
      null,
      {},
      { parsers: { json5: delegate.parser } },
      { parsers: Object.create({ json: delegate.parser }) },
      { parsers: { json: { parse: invalidParse } } },
      { parsers: { json: invalidFactory } },
    ] as unknown as ParserOptions<unknown>['plugins'];
    const options = parserOptions({ plugins: [delegate.plugin, ...skipped, wrappers] });

    await expect(wrappers.parsers['json']!.parse(text, options)).resolves.toStrictEqual(
      root(
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
      ),
    );

    expect(invalidFactory).toHaveBeenCalledExactlyOnceWith();
    expect(invalidParse).not.toHaveBeenCalled();
    expect(delegate.parse).toHaveBeenCalledExactlyOnceWith(text, options);
    expect(delegate.seenPlugins).toEqual([[delegate.plugin, ...skipped]]);
  });

  it('recognizes a separately loaded wrapper by plugin name', async () => {
    const delegate = delegateFixture();
    const registered = { name: PLUGIN_NAME, parsers: createParsers() };
    const options = parserOptions({ plugins: [delegate.plugin, registered] });

    await expect(createParsers()['json']!.parse(text, options)).resolves.toStrictEqual(
      root(
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
      ),
    );

    expect(delegate.parse).toHaveBeenCalledExactlyOnceWith(text, options);
    expect(delegate.seenPlugins).toEqual([[delegate.plugin]]);
  });

  it('composes multiple wrapper instances without recursive delegation', async () => {
    const delegate = delegateFixture();
    const first = { parsers: createParsers() };
    const second = { parsers: createParsers() };
    const plugins = [delegate.plugin, first, second];
    const options = parserOptions({ plugins });

    await expect(second.parsers['json']!.preprocess!(` ${text} `, options)).resolves.toBe(text);
    await expect(second.parsers['json']!.parse(text, options)).resolves.toStrictEqual(
      root(
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
      ),
    );

    expect(delegate.parse).toHaveBeenCalledExactlyOnceWith(text, options);
    expect(delegate.preprocess).toHaveBeenCalledExactlyOnceWith(` ${text} `, options);
    expect(delegate.seenPlugins).toEqual([[delegate.plugin], [delegate.plugin]]);
    expect(options.plugins).toBe(plugins);
  });

  it('passes preprocessing input through when the delegate has no preprocessor', async () => {
    const delegate = delegateFixture();
    delete delegate.parser.preprocess;
    const wrappers = { parsers: createParsers() };
    const plugins = [delegate.plugin, wrappers];
    const options = parserOptions({ plugins });

    await expect(wrappers.parsers['json']!.preprocess!(` ${text} `, options)).resolves.toBe(` ${text} `);

    expect(delegate.parse).not.toHaveBeenCalled();
    expect(options.plugins).toBe(plugins);
  });

  it.each(['parse', 'preprocess'] as const)(
    'propagates asynchronous %s errors and restores plugin options',
    async (method) => {
      const delegate = delegateFixture();
      const failure = new SyntaxError('delegate rejected input');
      delegate[method].mockRejectedValue(failure);
      const wrappers = { parsers: createParsers() };
      const plugins = [delegate.plugin, wrappers];
      const options = parserOptions({ plugins });

      await expect(wrappers.parsers['json']![method]!(text, options)).rejects.toBe(failure);

      expect(delegate[method]).toHaveBeenCalledExactlyOnceWith(text, options);
      expect(options.plugins).toBe(plugins);
      expect(delegate.ast).toStrictEqual(
        root(
          object([
            ['z', number(1)],
            ['a', number(2)],
          ]),
        ),
      );
    },
  );

  it('propagates native syntax errors', async () => {
    await expect(createParsers()['json']!.parse('{', parserOptions())).rejects.toThrow(SyntaxError);
  });

  it('rejects an invalid sorting mode without changing the parsed AST or plugin options', async () => {
    const delegate = delegateFixture();
    const wrappers = { parsers: createParsers() };
    const plugins = [delegate.plugin, wrappers];
    const options = parserOptions({ plugins, jsonUtilsMode: 'invalid' });

    await expect(wrappers.parsers['json']!.parse(text, options)).rejects.toThrow(
      'Expected jsonUtilsMode to be one of: sort-keys, package-json, vscode-settings',
    );

    expect(options.plugins).toBe(plugins);
    expect(delegate.ast).toStrictEqual(
      root(
        object([
          ['z', number(1)],
          ['a', number(2)],
        ]),
      ),
    );
  });

  it.each([{ cursorOffset: 0 }, { cursorOffset: 3 }, { rangeStart: 1 }, { rangeEnd: text.length - 1 }])(
    'preserves property order for offset-sensitive formatting: %j',
    async (overrides) => {
      const delegate = delegateFixture();
      const wrappers = { parsers: createParsers() };
      const options = parserOptions({ plugins: [delegate.plugin, wrappers], ...overrides });

      await expect(wrappers.parsers['json']!.parse(text, options)).resolves.toStrictEqual(
        root(
          object([
            ['z', number(1)],
            ['a', number(2)],
          ]),
        ),
      );
    },
  );

  it('sorts when the cursor is disabled and the range covers the full text', async () => {
    const delegate = delegateFixture();
    const wrappers = { parsers: createParsers() };
    const options = parserOptions({ plugins: [delegate.plugin, wrappers], cursorOffset: -1, rangeEnd: text.length });

    await expect(wrappers.parsers['json']!.parse(text, options)).resolves.toStrictEqual(
      root(
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
      ),
    );
  });

  it('applies the configured sorting mode to the delegated AST', async () => {
    const delegate = delegateFixture();
    delegate.ast['node'] = object([
      [
        'exports',
        object([
          ['node', number(1)],
          ['default', number(2)],
        ]),
      ],
      ['a', number(3)],
    ]);
    const wrappers = { parsers: createParsers() };
    const options = parserOptions({ plugins: [delegate.plugin, wrappers], jsonUtilsMode: 'package-json' });

    await expect(wrappers.parsers['json']!.parse(text, options)).resolves.toStrictEqual(
      root(
        object([
          ['a', number(3)],
          [
            'exports',
            object([
              ['node', number(1)],
              ['default', number(2)],
            ]),
          ],
        ]),
      ),
    );
  });
});
