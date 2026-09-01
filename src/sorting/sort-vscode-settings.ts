import {
  compareStrings,
  getJsonPropertyName,
  getJsonRootNode,
  isJsonArrayNode,
  isJsonObjectNode,
  isJsonStringNode,
  sortJsonObjectProperties,
  updateJsonStringValue,
} from './json-ast.js';
import type { JsonArrayNode, JsonAstNode } from './json-ast.js';

const CSPELL_WORD_LIST_KEYS = new Set(['cSpell.flagWords', 'cSpell.ignoreWords', 'cSpell.userWords', 'cSpell.words']);

export function sortVscodeSettingsAst(ast: unknown): void {
  const rootNode = getJsonRootNode(ast);

  if (rootNode !== undefined) {
    sortNode(rootNode);
  }
}

function sortNode(node: JsonAstNode): void {
  if (isJsonArrayNode(node)) {
    for (const element of node.elements) {
      if (element !== null) {
        sortNode(element);
      }
    }

    return;
  }

  if (!isJsonObjectNode(node)) {
    return;
  }

  for (const property of node.properties) {
    const propertyName = getJsonPropertyName(property);

    if (propertyName !== undefined && CSPELL_WORD_LIST_KEYS.has(propertyName) && isJsonArrayNode(property.value)) {
      normalizeCspellWordList(property.value);
    }

    sortNode(property.value);
  }

  sortJsonObjectProperties(node);
}

function normalizeCspellWordList(node: JsonArrayNode): void {
  if (!node.elements.every(isJsonStringNode)) {
    return;
  }

  for (const element of node.elements) {
    updateJsonStringValue(element, element.value.toLowerCase());
  }

  node.elements.sort((left, right) => {
    if (!isJsonStringNode(left) || !isJsonStringNode(right)) {
      return 0;
    }

    return compareStrings(left.value, right.value);
  });
}
