import type { CompendiumEntry } from '@/shared/types/domain';

import { cleanInlineText, parseInlineText, type InlineTextToken } from '@/features/compendium/utils/inlineText';

export type DetailRenderBlock =
  | { kind: 'paragraph'; tokens: InlineTextToken[] }
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: InlineTextToken[][] }
  | { kind: 'table'; headers: InlineTextToken[][]; rows: InlineTextToken[][][] }
  | { kind: 'fallbackText'; text: string };

type SourceRecord = Record<string, unknown>;

function isRecord(value: unknown): value is SourceRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function getEntriesFromPayload(entry: CompendiumEntry) {
  const renderPayload = entry.renderPayload;
  if (renderPayload && Array.isArray(renderPayload.entries)) {
    return renderPayload.entries;
  }

  return null;
}

function primitiveToText(value: unknown) {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return cleanInlineText(value);
  }

  return '';
}

function uidToDisplayName(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return cleanInlineText(value.split('|')[0] ?? '').trim();
}

export function extractReadableText(value: unknown): string {
  if (value == null) {
    return '';
  }

  const primitive = primitiveToText(value);
  if (primitive) {
    return primitive;
  }

  if (Array.isArray(value)) {
    return value.map(extractReadableText).filter(Boolean).join(' ');
  }

  if (!isRecord(value)) {
    return '';
  }

  const parts: string[] = [];

  if (typeof value.name === 'string') {
    parts.push(cleanInlineText(value.name));
  }

  if (typeof value.entry === 'string') {
    parts.push(cleanInlineText(value.entry));
  }

  for (const key of ['classFeature', 'subclassFeature', 'optionalfeature', 'feat', 'spell']) {
    const label = uidToDisplayName(value[key]);
    if (label) {
      parts.push(label);
    }
  }

  for (const key of ['entries', 'items', 'rows', 'tables']) {
    if (value[key]) {
      parts.push(extractReadableText(value[key]));
    }
  }

  return parts.filter(Boolean).join(' ');
}

function createParagraphBlock(value: unknown): DetailRenderBlock | null {
  const tokens = parseInlineText(value);
  return tokens.length > 0 ? { kind: 'paragraph', tokens } : null;
}

function createFallbackBlock(value: unknown): DetailRenderBlock | null {
  const text = extractReadableText(value);
  return text ? { kind: 'fallbackText', text } : null;
}

function parseList(record: SourceRecord): DetailRenderBlock | null {
  const rawItems = Array.isArray(record.items) ? record.items : [];
  const items = rawItems
    .map((item) => parseInlineText(typeof item === 'string' ? item : extractReadableText(item)))
    .filter((tokens) => tokens.length > 0);

  return items.length > 0 ? { kind: 'list', items } : null;
}

function toTableCell(value: unknown) {
  const text = typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    ? String(value)
    : extractReadableText(value);
  return parseInlineText(text);
}

function parseTable(record: SourceRecord): DetailRenderBlock | null {
  const rawHeaders = Array.isArray(record.colLabels) ? record.colLabels : [];
  const rawRows = Array.isArray(record.rows) ? record.rows : [];

  if (rawHeaders.length === 0 || rawRows.length === 0) {
    return createFallbackBlock(record);
  }

  if (!rawRows.every(Array.isArray)) {
    return createFallbackBlock(record);
  }

  const headers = rawHeaders.map(toTableCell);
  const rows = rawRows.map((row) => (row as unknown[]).map(toTableCell));
  const expectedCellCount = headers.length;
  const hasInconsistentRows = rows.some((row) => row.length !== expectedCellCount);

  if (headers.some((header) => header.length === 0) || hasInconsistentRows) {
    return createFallbackBlock(record);
  }

  return { kind: 'table', headers, rows };
}

function parseRecord(record: SourceRecord): DetailRenderBlock[] {
  const blocks: DetailRenderBlock[] = [];
  const type = typeof record.type === 'string' ? record.type : null;

  if (type === 'list') {
    const listBlock = parseList(record);
    return listBlock ? [listBlock] : [];
  }

  if (type === 'options' && Array.isArray(record.entries)) {
    const items = record.entries
      .map((entry) => parseInlineText(extractReadableText(entry)))
      .filter((tokens) => tokens.length > 0);

    return items.length > 0 ? [{ kind: 'list', items }] : [];
  }

  if (type === 'table') {
    const tableBlock = parseTable(record);
    return tableBlock ? [tableBlock] : [];
  }

  if (typeof record.name === 'string' && record.name.trim().length > 0) {
    blocks.push({ kind: 'heading', text: cleanInlineText(record.name) });
  }

  if (typeof record.entry === 'string') {
    const paragraph = createParagraphBlock(record.entry);
    if (paragraph) {
      blocks.push(paragraph);
    }
  }

  if (Array.isArray(record.entries)) {
    blocks.push(...parseEntries(record.entries));
  }

  if (Array.isArray(record.items) && type !== 'list') {
    const listBlock = parseList(record);
    if (listBlock) {
      blocks.push(listBlock);
    }
  }

  if (blocks.length > 0) {
    return blocks;
  }

  const fallback = createFallbackBlock(record);
  return fallback ? [fallback] : [];
}

function parseEntry(value: unknown): DetailRenderBlock[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const paragraph = createParagraphBlock(value);
    return paragraph ? [paragraph] : [];
  }

  if (Array.isArray(value)) {
    return parseEntries(value);
  }

  if (isRecord(value)) {
    return parseRecord(value);
  }

  return [];
}

function parseEntries(entries: unknown[]) {
  return entries.flatMap(parseEntry);
}

export function buildRenderBlocksFromEntries(entries: unknown[]): DetailRenderBlock[] {
  return parseEntries(entries);
}

export function buildRenderBlocks(entry: CompendiumEntry): DetailRenderBlock[] {
  const entries = getEntriesFromPayload(entry);
  const blocks = entries ? buildRenderBlocksFromEntries(entries) : [];

  if (blocks.length > 0) {
    return blocks;
  }

  const fallbackText = entry.text || extractReadableText(entry.renderPayload);
  return fallbackText ? [{ kind: 'fallbackText', text: cleanInlineText(fallbackText) }] : [];
}
