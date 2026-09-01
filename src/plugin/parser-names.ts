export const SUPPORTED_PARSER_NAMES = ['json', 'json-stringify', 'json5', 'jsonc'] as const;

export type SupportedParserName = (typeof SUPPORTED_PARSER_NAMES)[number];
