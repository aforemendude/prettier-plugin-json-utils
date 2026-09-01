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
    expect(getArrayProperty(settings, 'list.setting').elements).toEqual([firstEntry, secondEntry]);
    expect(getPropertyNames(firstEntry)).toEqual(['a', 'z']);
    expect(getPropertyNames(secondEntry)).toEqual(['b', 'd']);
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

    expect(mixedList.elements.map((element) => element['value'])).toEqual(['Zoo', 1, 'apple']);
  });
});
