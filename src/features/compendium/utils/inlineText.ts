export type InlineReferenceEntityType =
  | 'spell'
  | 'item'
  | 'feat'
  | 'optionalfeature'
  | 'condition'
  | 'action'
  | 'variantrule';

export type InlineReference = {
  key: string;
  tag: string;
  name: string;
  sourceCode: string | null;
  entityType: InlineReferenceEntityType;
};

export type InlineTextToken = {
  kind: 'text' | 'reference' | 'dice' | 'emphasis' | 'strong';
  text: string;
  reference?: InlineReference;
};

const REFERENCE_TAGS = new Set([
  '5etools',
  'action',
  'book',
  'condition',
  'creature',
  'feat',
  'filter',
  'item',
  'itemmastery',
  'itemproperty',
  'language',
  'optfeature',
  'quickref',
  'sense',
  'skill',
  'spell',
  'status',
  'variantrule',
]);

const DICE_TAGS = new Set(['chance', 'damage', 'dc', 'dice']);

const NAVIGABLE_REFERENCE_TAGS: Record<string, InlineReferenceEntityType> = {
  action: 'action',
  condition: 'condition',
  feat: 'feat',
  item: 'item',
  optfeature: 'optionalfeature',
  spell: 'spell',
  variantrule: 'variantrule',
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function getTaggedDisplayText(tagName: string, payload: string) {
  if (tagName.toLowerCase() === 'note' || payload.includes('{@')) {
    return inlineTokensToText(parseInlineText(payload));
  }

  return normalizeWhitespace(payload.split('|')[0] ?? '');
}

function createReferenceKey(entityType: InlineReferenceEntityType, name: string, sourceCode: string | null) {
  return `${entityType}:${name.trim().toLowerCase()}:${sourceCode?.trim().toLowerCase() ?? ''}`;
}

function createInlineReference(tagName: string, payload: string): InlineReference | undefined {
  const normalizedTag = tagName.toLowerCase();
  const entityType = NAVIGABLE_REFERENCE_TAGS[normalizedTag];
  if (!entityType) {
    return undefined;
  }

  const [rawName, rawSource] = payload.split('|').map((part) => normalizeWhitespace(part));
  const name = rawName ?? '';
  const sourceCode = rawSource || null;
  if (!name) {
    return undefined;
  }

  return {
    key: createReferenceKey(entityType, name, sourceCode),
    tag: normalizedTag,
    name,
    sourceCode,
    entityType,
  };
}

function createTaggedToken(tagName: string, payload: string): InlineTextToken | null {
  const normalizedTag = tagName.toLowerCase();
  const displayText = getTaggedDisplayText(tagName, payload);

  if (!displayText) {
    return null;
  }

  if (REFERENCE_TAGS.has(normalizedTag)) {
    return { kind: 'reference', text: displayText, reference: createInlineReference(tagName, payload) };
  }

  if (DICE_TAGS.has(normalizedTag)) {
    return { kind: 'dice', text: displayText };
  }

  if (normalizedTag === 'i' || normalizedTag === 'italic') {
    return { kind: 'emphasis', text: displayText };
  }

  if (normalizedTag === 'b' || normalizedTag === 'bold') {
    return { kind: 'strong', text: displayText };
  }

  if (normalizedTag === 'note') {
    return { kind: 'emphasis', text: displayText };
  }

  return { kind: 'text', text: displayText };
}

export function parseInlineText(value: unknown): InlineTextToken[] {
  const source = normalizeWhitespace(String(value ?? ''));
  if (!source) {
    return [];
  }

  const tokens: InlineTextToken[] = [];
  const tagPattern = /\{@([a-zA-Z0-9]+)\s+((?:[^{}]|\{@[a-zA-Z0-9]+\s+[^{}]*\})*)\}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(source)) != null) {
    const [rawMatch, tagName, payload] = match;
    const textBefore = source.slice(lastIndex, match.index);
    if (textBefore) {
      tokens.push({ kind: 'text', text: textBefore });
    }

    const taggedToken = createTaggedToken(tagName, payload);
    if (taggedToken) {
      tokens.push(taggedToken);
    }

    lastIndex = match.index + rawMatch.length;
  }

  const textAfter = source.slice(lastIndex);
  if (textAfter) {
    tokens.push({ kind: 'text', text: textAfter });
  }

  return mergeAdjacentTextTokens(tokens);
}

export function inlineTokensToText(tokens: InlineTextToken[]) {
  return normalizeWhitespace(tokens.map((token) => token.text).join(''));
}

export function cleanInlineText(value: unknown) {
  return inlineTokensToText(parseInlineText(value));
}

function mergeAdjacentTextTokens(tokens: InlineTextToken[]) {
  const merged: InlineTextToken[] = [];

  for (const token of tokens) {
    const previous = merged[merged.length - 1];
    if (previous?.kind === 'text' && token.kind === 'text') {
      previous.text += token.text;
      continue;
    }

    merged.push({ ...token });
  }

  return merged.filter((token) => token.text.length > 0);
}
