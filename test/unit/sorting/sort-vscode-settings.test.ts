import { describe, expect, it } from 'vitest';

import { sortVscodeSettingsAst } from '../../../src/sorting/sort-vscode-settings.js';
import {
  array,
  getArrayProperty,
  getObjectProperty,
  getPropertyNames,
  getStringValues,
  number,
  object,
  root,
  string,
} from '../support/json-ast.js';

describe('sortVscodeSettingsAst', () => {
  it('sorts every object while preserving ordinary array order', () => {
    const firstEntry = object([
      ['z', number(1)],
      ['a', number(2)],
    ]);
    const secondEntry = object([
      ['d', number(3)],
      ['b', number(4)],
    ]);
    const settings = object([
      ['z.setting', number(1)],
      ['list.setting', array([firstEntry, secondEntry])],
      [
        'a.setting',
        object([
          ['z', number(1)],
          ['a', number(2)],
        ]),
      ],
    ]);

    sortVscodeSettingsAst(root(settings));

    expect(getPropertyNames(settings)).toEqual(['a.setting', 'list.setting', 'z.setting']);
    expect(getPropertyNames(getObjectProperty(settings, 'a.setting'))).toEqual(['a', 'z']);
    expect(getArrayProperty(settings, 'list.setting')).toStrictEqual(
      array([
        object([
          ['a', number(2)],
          ['z', number(1)],
        ]),
        object([
          ['b', number(4)],
          ['d', number(3)],
        ]),
      ]),
    );
  });

  it.each(['cSpell.flagWords', 'cSpell.ignoreWords', 'cSpell.userWords', 'cSpell.words'])(
    'lowercases and sorts %s',
    (settingName) => {
      const changedString = string('Zoo');
      const wordList = array([changedString, string('apple'), string('BETA'), string('Apple')]);
      const settings = object([[settingName, wordList]]);

      sortVscodeSettingsAst(settings);

      expect(getStringValues(wordList)).toEqual(['apple', 'apple', 'beta', 'zoo']);
      expect(changedString.extra).toEqual({ raw: '"zoo"', rawValue: 'zoo' });
    },
  );

  it('normalizes supported word-list settings at nested levels', () => {
    const settings = object([
      [
        '[javascript]',
        object([
          ['z', number(1)],
          ['cSpell.words', array([string('Zulu'), string('Alpha')])],
        ]),
      ],
    ]);

    sortVscodeSettingsAst(settings);

    const languageSettings = getObjectProperty(settings, '[javascript]');
    expect(getPropertyNames(languageSettings)).toEqual(['cSpell.words', 'z']);
    expect(getStringValues(getArrayProperty(languageSettings, 'cSpell.words'))).toEqual(['alpha', 'zulu']);
  });

  it('leaves a supported setting unchanged when its array contains a non-string value', () => {
    const mixedList = array([string('Zoo'), number(1), string('apple')]);
    const settings = object([['cSpell.words', mixedList]]);

    sortVscodeSettingsAst(settings);

    expect(mixedList).toStrictEqual(array([string('Zoo'), number(1), string('apple')]));
  });

  it('preserves unsupported word lists and non-array settings', () => {
    const settings = object([
      ['cSpell.customWords', array([string('Zoo'), string('apple')])],
      ['cSpell.words', string('Zoo')],
      ['cspell.words', array([string('Zoo'), string('apple')])],
    ]);
    const expected = structuredClone(settings);

    sortVscodeSettingsAst(settings);

    expect(settings).toStrictEqual(expected);
  });

  it('sorts objects in mixed word lists without normalizing their strings or changing array positions', () => {
    const settings = object([
      [
        'cSpell.words',
        {
          type: 'ArrayExpression',
          elements: [
            string('Zoo'),
            null,
            object([
              ['z', number(1)],
              ['a', number(2)],
            ]),
            string('apple'),
          ],
        },
      ],
    ]);

    sortVscodeSettingsAst(settings);

    expect(settings).toStrictEqual(
      object([
        [
          'cSpell.words',
          {
            type: 'ArrayExpression',
            elements: [
              string('Zoo'),
              null,
              object([
                ['a', number(2)],
                ['z', number(1)],
              ]),
              string('apple'),
            ],
          },
        ],
      ]),
    );
  });

  it('normalizes ESTree strings and keeps their comments attached after sorting', () => {
    const settings = object([
      [
        'cSpell.words',
        array([
          { type: 'Literal', value: 'Zoo', raw: '"Zoo"', comments: ['zoo comment'] },
          { type: 'Literal', value: 'Apple', raw: '"Apple"', comments: ['apple comment'] },
        ]),
      ],
    ]);

    sortVscodeSettingsAst(settings);

    expect(settings).toStrictEqual(
      object([
        [
          'cSpell.words',
          array([
            { type: 'Literal', value: 'apple', raw: '"apple"', comments: ['apple comment'] },
            { type: 'Literal', value: 'zoo', raw: '"zoo"', comments: ['zoo comment'] },
          ]),
        ],
      ]),
    );
  });

  it.each([undefined, null, {}, { type: 'JsonRoot', node: null }, object([]), object([['cSpell.words', array([])]])])(
    'leaves invalid roots and empty collections unchanged: %j',
    (ast) => {
      const expected = structuredClone(ast);

      sortVscodeSettingsAst(ast);

      expect(ast).toStrictEqual(expected);
    },
  );
});
