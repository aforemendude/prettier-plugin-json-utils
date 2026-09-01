import type { JsonUtilsMode } from '../plugin/json-utils-mode.js';
import { sortPackageJsonAst } from './sort-package-json.js';
import { sortVscodeSettingsAst } from './sort-vscode-settings.js';

export function sortJsonAst(ast: unknown, mode: JsonUtilsMode): void {
  if (mode === 'package-json') {
    sortPackageJsonAst(ast);
    return;
  }

  sortVscodeSettingsAst(ast);
}
