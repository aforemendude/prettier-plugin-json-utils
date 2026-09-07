import type { JsonUtilsMode } from '../plugin/json-utils-mode.js';
import { sortPackageJsonAst } from './sort-package-json.js';
import { sortKeysAst } from './sort-keys.js';
import { sortVscodeSettingsAst } from './sort-vscode-settings.js';

export function sortJsonAst(ast: unknown, mode: JsonUtilsMode): void {
  if (mode === 'package-json') {
    sortPackageJsonAst(ast);
    return;
  }

  if (mode === 'vscode-settings') {
    sortVscodeSettingsAst(ast);
    return;
  }

  sortKeysAst(ast);
}
