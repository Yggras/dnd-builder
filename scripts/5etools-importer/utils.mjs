export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function canonicalId(parts) {
  return parts
    .filter(Boolean)
    .map((part) => slugify(part))
    .join('|');
}

export function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

export function stableSortBy(items, selectKey) {
  return [...items].sort((left, right) => {
    const leftKey = selectKey(left);
    const rightKey = selectKey(right);

    return leftKey.localeCompare(rightKey);
  });
}

export function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

export function ensureArray(value) {
  if (value == null) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function summarizeText(text, maxLength = 220) {
  const normalized = String(text ?? '').replace(/\s+/g, ' ').trim();

  if (!normalized) {
    return null;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

export function strip5eTags(text, options = {}) {
  const scaledTagMode = options.scaledTagMode ?? 'base';

  return String(text ?? '')
    .replace(/\{@(?:filter|book|quickref|variantrule|optfeature|action|condition|sense|skill|itemProperty|status|language|item|spell|feat)\s+([^}|]+)(?:\|[^}]*)?\}/gi, '$1')
    .replace(/\{@(?:scaledice|scaledamage)\s+([^}|]+)(?:\|[^}|]*)?(?:\|([^}]*))?\}/gi, (_match, baseValue, incrementValue) =>
      scaledTagMode === 'increment' && incrementValue ? incrementValue : baseValue,
    )
    .replace(/\{@(?:dice|damage|dc|chance)\s+([^}|]+)(?:\|[^}]*)?\}/gi, '$1')
    .replace(/\{@i\s+([^}]*)\}/gi, '$1')
    .replace(/\{@b\s+([^}]*)\}/gi, '$1')
    .replace(/\{@note\s+([^}]*)\}/gi, '$1')
    .replace(/\{@[^}]+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractText(value, options = {}) {
  if (value == null) {
    return '';
  }

  if (typeof value === 'string') {
    return strip5eTags(value, options);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => extractText(entry, options)).filter(Boolean).join(' ');
  }

  if (typeof value === 'object') {
    const parts = [];

    if (typeof value.name === 'string') {
      parts.push(strip5eTags(value.name, options));
    }

    if (typeof value.entry === 'string') {
      parts.push(strip5eTags(value.entry, options));
    }

    if (value.entries) {
      parts.push(extractText(value.entries, options));
    }

    if (value.items) {
      parts.push(extractText(value.items, options));
    }

    if (value.rows) {
      parts.push(extractText(value.rows, options));
    }

    if (value.tables) {
      parts.push(extractText(value.tables, options));
    }

    return parts.filter(Boolean).join(' ');
  }

  return String(value);
}

export function getSourceName(sourceCode) {
  return sourceCode ?? 'Unknown';
}

export function isExplicit2024Record(record) {
  return Boolean(record?.edition === 'one' || record?.basicRules2024 || record?.srd52);
}

export function isActual2024Record(record, primary2024Sources) {
  if (record?.edition === 'classic') {
    return false;
  }

  return Boolean(isExplicit2024Record(record) || primary2024Sources.has(record?.source));
}

export function isPrimary2024Record(record, primary2024Sources) {
  return isActual2024Record(record, primary2024Sources);
}

export function isBuilderSelectableRecord(record, primary2024Sources, compatible2024Sources) {
  return Boolean(isActual2024Record(record, primary2024Sources) || compatible2024Sources.has(record?.source));
}

export function progressionToLevelCounts(progression) {
  if (Array.isArray(progression)) {
    let previousCount = 0;

    return progression
      .map((count, index) => {
        const nextCount = Number(count) || 0;
        const delta = Math.max(nextCount - previousCount, 0);
        previousCount = nextCount;

        return { atLevel: index + 1, count: delta };
      })
      .filter((entry) => entry.count > 0);
  }

  return Object.entries(progression ?? {})
    .map(([level, count]) => ({ atLevel: Number(level), count: Number(count) || 0 }))
    .filter((entry) => entry.count > 0)
    .sort((left, right) => left.atLevel - right.atLevel);
}

export function uidToParts(uid) {
  return String(uid ?? '')
    .replace(/#c$/i, '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function spellIdFromUid(uid, fallbackSource = 'XPHB') {
  const [name, source = fallbackSource] = uidToParts(uid);
  if (!name) {
    return null;
  }

  return canonicalId([name, source, 'spell']);
}

export function featIdFromUid(uid, fallbackSource = 'XPHB') {
  const [name, source = fallbackSource] = uidToParts(uid);
  if (!name) {
    return null;
  }

  return canonicalId([name, source, 'feat']);
}

export function optionalFeatureIdFromUid(uid, fallbackSource = 'XPHB') {
  const [name, source = fallbackSource] = uidToParts(uid);
  if (!name) {
    return null;
  }

  return canonicalId([name, source, 'optionalfeature']);
}
