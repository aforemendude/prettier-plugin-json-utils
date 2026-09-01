export interface TestArrayNode extends TestNode {
  elements: TestNode[];
  type: 'ArrayExpression';
}

export interface TestNode {
  [key: string]: unknown;
  type: string;
}

export interface TestObjectNode extends TestNode {
  properties: TestPropertyNode[];
  type: 'ObjectExpression';
}

export interface TestPropertyNode extends TestNode {
  key: TestStringNode;
  type: 'ObjectProperty';
  value: TestNode;
}

export interface TestStringNode extends TestNode {
  extra: {
    raw: string;
    rawValue: string;
  };
  type: 'StringLiteral';
  value: string;
}

export function array(elements: TestNode[]): TestArrayNode {
  return { elements, type: 'ArrayExpression' };
}

export function boolean(value: boolean): TestNode {
  return { type: 'BooleanLiteral', value };
}

export function getArrayProperty(node: TestObjectNode, name: string): TestArrayNode {
  const value = getPropertyValue(node, name);

  if (value.type !== 'ArrayExpression') {
    throw new TypeError(`Expected ${name} to be an array`);
  }

  return value as TestArrayNode;
}

export function getObjectProperty(node: TestObjectNode, name: string): TestObjectNode {
  const value = getPropertyValue(node, name);

  if (value.type !== 'ObjectExpression') {
    throw new TypeError(`Expected ${name} to be an object`);
  }

  return value as TestObjectNode;
}

export function getPropertyNames(node: TestObjectNode): string[] {
  return node.properties.map((property) => property.key.value);
}

export function getPropertyValue(node: TestObjectNode, name: string): TestNode {
  const property = node.properties.find((candidate) => candidate.key.value === name);

  if (property === undefined) {
    throw new Error(`Missing property: ${name}`);
  }

  return property.value;
}

export function getStringValues(node: TestArrayNode): string[] {
  return node.elements.map((element) => {
    if (element.type !== 'StringLiteral' || typeof element['value'] !== 'string') {
      throw new TypeError('Expected every array element to be a string');
    }

    return element['value'];
  });
}

export function number(value: number): TestNode {
  return { type: 'NumericLiteral', value };
}

export function object(entries: Array<readonly [string, TestNode]>): TestObjectNode {
  return {
    properties: entries.map(([name, value]) => property(name, value)),
    type: 'ObjectExpression',
  };
}

export function root(node: TestNode): TestNode {
  return { node, type: 'JsonRoot' };
}

export function string(value: string): TestStringNode {
  return {
    extra: {
      raw: JSON.stringify(value),
      rawValue: value,
    },
    type: 'StringLiteral',
    value,
  };
}

function property(name: string, value: TestNode): TestPropertyNode {
  return {
    key: string(name),
    type: 'ObjectProperty',
    value,
  };
}
