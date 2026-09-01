import { describe, expect, it } from 'vitest';

import { sortPackageJsonAst } from '../../../src/sorting/sort-package-json.js';
import {
  array,
  boolean,
  getArrayProperty,
  getObjectProperty,
  getPropertyNames,
  number,
  object,
  root,
  string,
} from '../support/json-ast.js';

describe('sortPackageJsonAst', () => {
  it('sorts ordinary objects recursively without reordering arrays', () => {
    const firstEntry = object([
      ['d', number(4)],
      ['c', number(3)],
    ]);
    const secondEntry = object([
      ['b', number(2)],
      ['a', number(1)],
    ]);
    const packageJson = object([
      ['z', number(0)],
      ['list', array([firstEntry, secondEntry])],
      [
        'a',
        object([
          ['y', number(2)],
          ['b', number(1)],
        ]),
      ],
    ]);

    sortPackageJsonAst(root(packageJson));

    expect(getPropertyNames(packageJson)).toEqual(['a', 'list', 'z']);
    expect(getPropertyNames(getObjectProperty(packageJson, 'a'))).toEqual(['b', 'y']);
    expect(getArrayProperty(packageJson, 'list').elements).toEqual([firstEntry, secondEntry]);
    expect(getPropertyNames(firstEntry)).toEqual(['c', 'd']);
    expect(getPropertyNames(secondEntry)).toEqual(['a', 'b']);
  });

  it('sorts export subpaths and import specifiers while preserving conditional order', () => {
    const rootExportConditions = object([
      ['import', string('./index.js')],
      ['require', string('./index.cjs')],
      ['default', string('./index-fallback.js')],
    ]);
    const nestedNodeConditions = object([
      ['require', string('./feature-node.cjs')],
      ['import', string('./feature-node.js')],
      ['default', string('./feature-node-fallback.js')],
    ]);
    const featureExportConditions = object([
      ['node', nestedNodeConditions],
      ['default', string('./feature.js')],
    ]);
    const constantsImportConditions = object([
      ['development', string('#constants-development')],
      ['default', string('#constants-production')],
    ]);
    const utilitiesImportConditions = object([
      ['node', string('#utilities-node')],
      ['default', string('#utilities-fallback')],
    ]);
    const packageJson = object([
      [
        'metadata',
        object([
          ['node', boolean(true)],
          ['import', boolean(true)],
          ['default', boolean(true)],
        ]),
      ],
      [
        'imports',
        object([
          ['#utilities', utilitiesImportConditions],
          ['#constants', constantsImportConditions],
        ]),
      ],
      [
        'exports',
        object([
          ['./feature', featureExportConditions],
          ['.', rootExportConditions],
        ]),
      ],
    ]);

    sortPackageJsonAst(packageJson);

    expect(getPropertyNames(packageJson)).toEqual(['exports', 'imports', 'metadata']);
    expect(getPropertyNames(getObjectProperty(packageJson, 'exports'))).toEqual(['.', './feature']);
    expect(getPropertyNames(rootExportConditions)).toEqual(['import', 'require', 'default']);
    expect(getPropertyNames(featureExportConditions)).toEqual(['node', 'default']);
    expect(getPropertyNames(nestedNodeConditions)).toEqual(['require', 'import', 'default']);
    expect(getPropertyNames(getObjectProperty(packageJson, 'imports'))).toEqual(['#constants', '#utilities']);
    expect(getPropertyNames(constantsImportConditions)).toEqual(['development', 'default']);
    expect(getPropertyNames(utilitiesImportConditions)).toEqual(['node', 'default']);
    expect(getPropertyNames(getObjectProperty(packageJson, 'metadata'))).toEqual(['default', 'import', 'node']);
  });

  it('preserves a top-level conditional exports object and conditions nested through arrays', () => {
    const arrayConditions = object([
      ['node', string('./node.js')],
      ['default', string('./default.js')],
    ]);
    const conditionalExports = object([
      ['node', array([arrayConditions])],
      ['import', string('./index.js')],
      ['default', string('./fallback.js')],
    ]);
    const packageJson = object([['exports', conditionalExports]]);

    sortPackageJsonAst(packageJson);

    expect(getPropertyNames(conditionalExports)).toEqual(['node', 'import', 'default']);
    expect(getPropertyNames(arrayConditions)).toEqual(['node', 'default']);
  });

  it('uses the same lexicographic ordering as upgrade-npm-packages', () => {
    const values = object([
      ['2', string('two')],
      ['-flag', string('flag')],
      ['10', string('ten')],
      ['#alias', string('alias')],
    ]);

    sortPackageJsonAst(object([['values', values]]));

    expect(getPropertyNames(values)).toEqual(['#alias', '-flag', '10', '2']);
  });
});
