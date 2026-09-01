import type { SupportedParserName } from './parser-names.js';

export const JSON_UTILS_MODE_OPTION = 'jsonUtilsMode';
export const JSON_UTILS_MODES = ['package-json', 'vscode-settings'] as const;

export type JsonUtilsMode = (typeof JSON_UTILS_MODES)[number];

export function resolveJsonUtilsMode(
  parserName: SupportedParserName,
  options: Record<string, unknown>,
): JsonUtilsMode | undefined {
  const configuredMode = options[JSON_UTILS_MODE_OPTION];

  if (configuredMode !== undefined) {
    if (isJsonUtilsMode(configuredMode)) {
      return configuredMode;
    }

    throw new TypeError(`Expected ${JSON_UTILS_MODE_OPTION} to be one of: ${JSON_UTILS_MODES.join(', ')}`);
  }

  const filepath = options['filepath'];

  if (typeof filepath === 'string' && filepath.length > 0) {
    const filename = filepath.split(/[\\/]/u).at(-1);

    if (filename === 'package.json') {
      return 'package-json';
    }

    if (filename === 'settings.json') {
      return 'vscode-settings';
    }

    return undefined;
  }

  return parserName === 'json-stringify' ? 'package-json' : 'vscode-settings';
}

function isJsonUtilsMode(value: unknown): value is JsonUtilsMode {
  return value === 'package-json' || value === 'vscode-settings';
}
