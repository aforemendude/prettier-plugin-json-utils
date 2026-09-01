import type { SupportOptions } from 'prettier';

import { JSON_UTILS_MODE_OPTION } from './json-utils-mode.js';

export const pluginOptions = {
  [JSON_UTILS_MODE_OPTION]: {
    category: 'JSON Utils',
    choices: [
      {
        description: 'Sort package metadata while retaining conditional exports and imports order.',
        value: 'package-json',
      },
      {
        description: 'Sort VS Code settings and normalize supported cSpell word lists.',
        value: 'vscode-settings',
      },
    ],
    description: 'Select the opinionated JSON sorting policy.',
    type: 'choice',
  },
} satisfies SupportOptions;
