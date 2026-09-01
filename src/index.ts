import type { Plugin } from 'prettier';

import { createParsers } from './plugin/create-parsers.js';
import { pluginOptions } from './plugin/options.js';
import { PLUGIN_NAME } from './plugin/plugin-name.js';

const name = PLUGIN_NAME;
const options = pluginOptions;
const parsers = createParsers();
const plugin: NamedPlugin = {
  name,
  options,
  parsers,
};

export { JSON_UTILS_MODE_OPTION, JSON_UTILS_MODES } from './plugin/json-utils-mode.js';
export type { JsonUtilsMode } from './plugin/json-utils-mode.js';
export { name, options, parsers };
export default plugin;

interface NamedPlugin extends Plugin {
  name: string;
}
