export type InlineTextToken = {
  kind: 'text' | 'reference' | 'dice' | 'emphasis' | 'strong';
  text: string;
};

const REFERENCE_TAGS = new Set([
  'action',
  'book',
  'condition',
  'feat',
  'filter',
  'item',
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

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function getTaggedDisplayText(payload: string) {
  return normalizeWhitespace(payload.split('|')[0] ?? '');
}

function createTaggedToken(tagName: string, payload: string): InlineTextToken | null {
  const normalizedTag = tagName.toLowerCase();
  const displayText = getTaggedDisplayText(payload);

  if (!displayText) {
    return null;
  }

  if (REFERENCE_TAGS.has(normalizedTag)) {
    return { kind: 'reference', text: displayText };
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
  const tagPattern = /\{@([a-zA-Z]+)\s+([^}]*)\}/g;
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
