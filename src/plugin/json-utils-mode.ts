export const JSON_UTILS_MODE_OPTION = 'jsonUtilsMode';
export const JSON_UTILS_MODES = ['sort-keys', 'package-json', 'vscode-settings'] as const;

export type JsonUtilsMode = (typeof JSON_UTILS_MODES)[number];

export function resolveJsonUtilsMode(options: Record<string, unknown>): JsonUtilsMode {
  const configuredMode = options[JSON_UTILS_MODE_OPTION];

  if (configuredMode !== undefined) {
    if (isJsonUtilsMode(configuredMode)) {
      return configuredMode;
    }

    throw new TypeError(`Expected ${JSON_UTILS_MODE_OPTION} to be one of: ${JSON_UTILS_MODES.join(', ')}`);
  }

  return 'sort-keys';
}

function isJsonUtilsMode(value: unknown): value is JsonUtilsMode {
  return value === 'sort-keys' || value === 'package-json' || value === 'vscode-settings';
}
