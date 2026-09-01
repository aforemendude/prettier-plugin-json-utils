export interface JsonAstNode {
  [key: string]: unknown;
  type: string;
}

export interface JsonArrayNode extends JsonAstNode {
  elements: Array<JsonAstNode | null>;
  type: 'ArrayExpression';
}

export interface JsonObjectNode extends JsonAstNode {
  properties: JsonPropertyNode[];
  type: 'ObjectExpression';
}

export interface JsonPropertyNode extends JsonAstNode {
  key: JsonAstNode;
  type: 'ObjectProperty' | 'Property';
  value: JsonAstNode;
}

export interface JsonStringNode extends JsonAstNode {
  type: 'Literal' | 'StringLiteral';
  value: string;
}

export function getJsonRootNode(ast: unknown): JsonAstNode | undefined {
  if (!isJsonAstNode(ast)) {
    return undefined;
  }

  if (ast.type !== 'JsonRoot') {
    return ast;
  }

  const node = ast['node'];

  return isJsonAstNode(node) ? node : undefined;
}

export function getJsonPropertyName(property: JsonPropertyNode): string | undefined {
  const keyValue = property.key['value'];

  if (typeof keyValue === 'string') {
    return keyValue;
  }

  const keyName = property.key['name'];

  return typeof keyName === 'string' ? keyName : undefined;
}

export function isJsonArrayNode(node: JsonAstNode): node is JsonArrayNode {
  return node.type === 'ArrayExpression' && Array.isArray(node['elements']);
}

export function isJsonAstNode(value: unknown): value is JsonAstNode {
  return typeof value === 'object' && value !== null && typeof (value as Record<string, unknown>)['type'] === 'string';
}

export function isJsonObjectNode(node: JsonAstNode): node is JsonObjectNode {
  return (
    node.type === 'ObjectExpression' &&
    Array.isArray(node['properties']) &&
    node['properties'].every(isJsonPropertyNode)
  );
}

export function isJsonStringNode(node: JsonAstNode | null): node is JsonStringNode {
  return (
    node !== null && (node.type === 'StringLiteral' || node.type === 'Literal') && typeof node['value'] === 'string'
  );
}

export function sortJsonObjectProperties(node: JsonObjectNode): void {
  const names = node.properties.map(getJsonPropertyName);

  if (names.some((name) => name === undefined)) {
    return;
  }

  node.properties.sort((left, right) => {
    const leftName = getJsonPropertyName(left);
    const rightName = getJsonPropertyName(right);

    if (leftName === undefined || rightName === undefined) {
      return 0;
    }

    return compareStrings(leftName, rightName);
  });
}

export function updateJsonStringValue(node: JsonStringNode, value: string): void {
  if (node.value === value) {
    return;
  }

  const raw = JSON.stringify(value);
  node.value = value;

  if (node.type === 'Literal') {
    node['raw'] = raw;
    return;
  }

  const extra = node['extra'];

  if (typeof extra === 'object' && extra !== null) {
    const extraRecord = extra as Record<string, unknown>;
    extraRecord['raw'] = raw;
    extraRecord['rawValue'] = value;
  } else {
    node['extra'] = { raw, rawValue: value };
  }
}

export function compareStrings(left: string, right: string): number {
  if (left < right) {
    return -1;
  }

  if (left > right) {
    return 1;
  }

  return 0;
}

function isJsonPropertyNode(value: unknown): value is JsonPropertyNode {
  if (!isJsonAstNode(value) || (value.type !== 'ObjectProperty' && value.type !== 'Property')) {
    return false;
  }

  return isJsonAstNode(value['key']) && isJsonAstNode(value['value']);
}
