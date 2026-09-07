import { getJsonRootNode, isJsonArrayNode, isJsonObjectNode, sortJsonObjectProperties } from './json-ast.js';
import type { JsonAstNode } from './json-ast.js';

export function sortKeysAst(ast: unknown): void {
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
    sortNode(property.value);
  }

  sortJsonObjectProperties(node);
}
