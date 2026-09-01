import {
  getJsonPropertyName,
  getJsonRootNode,
  isJsonArrayNode,
  isJsonObjectNode,
  sortJsonObjectProperties,
} from './json-ast.js';
import type { JsonAstNode, JsonObjectNode } from './json-ast.js';

type SortContext = 'conditions' | 'exports' | 'imports' | 'regular' | 'root';

export function sortPackageJsonAst(ast: unknown): void {
  const rootNode = getJsonRootNode(ast);

  if (rootNode !== undefined) {
    sortNode(rootNode, 'root');
  }
}

function sortNode(node: JsonAstNode, context: SortContext): void {
  if (isJsonArrayNode(node)) {
    const nestedContext = context === 'root' ? 'regular' : context;

    for (const element of node.elements) {
      if (element !== null) {
        sortNode(element, nestedContext);
      }
    }

    return;
  }

  if (!isJsonObjectNode(node)) {
    return;
  }

  for (const property of node.properties) {
    const propertyName = getJsonPropertyName(property);
    const nestedContext = propertyName === undefined ? 'regular' : getNestedContext(context, propertyName);
    sortNode(property.value, nestedContext);
  }

  if (!shouldPreservePropertyOrder(node, context)) {
    sortJsonObjectProperties(node);
  }
}

function getNestedContext(context: SortContext, key: string): SortContext {
  if (context === 'root' && key === 'exports') {
    return 'exports';
  }

  if (context === 'root' && key === 'imports') {
    return 'imports';
  }

  if (context === 'exports' || context === 'imports' || context === 'conditions') {
    return 'conditions';
  }

  return 'regular';
}

function shouldPreservePropertyOrder(node: JsonObjectNode, context: SortContext): boolean {
  if (context === 'conditions') {
    return true;
  }

  return (
    context === 'exports' &&
    node.properties.every((property) => {
      const propertyName = getJsonPropertyName(property);

      return propertyName !== undefined && !propertyName.startsWith('.');
    })
  );
}
