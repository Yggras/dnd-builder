import { deepClone } from './utils.mjs';

function mergePreserving(baseRecord, record, preserve) {
  const merged = { ...baseRecord, ...record };

  for (const [field, shouldPreserve] of Object.entries(preserve ?? {})) {
    if (shouldPreserve && baseRecord[field] !== undefined && record[field] === undefined) {
      merged[field] = baseRecord[field];
    }
  }

  return merged;
}

function applySingleMod(target, key, mod) {
  if (!mod || typeof mod !== 'object') {
    return target;
  }

  const current = target[key];

  if (mod.mode === 'appendArr' && Array.isArray(current)) {
    target[key] = [...current, ...(Array.isArray(mod.items) ? mod.items : [mod.items])];
    return target;
  }

  if (mod.mode === 'replaceArr' && Array.isArray(current)) {
    target[key] = current.map((entry) => {
      if (entry?.name === mod.replace) {
        return mod.items;
      }

      return entry;
    });
    return target;
  }

  if (mod.mode === 'removeArr' && Array.isArray(current)) {
    target[key] = current.filter((entry) => entry?.name !== mod.replace);
    return target;
  }

  return target;
}

function applyMods(record, mods) {
  const nextRecord = deepClone(record);

  for (const [key, modValue] of Object.entries(mods ?? {})) {
    const modEntries = Array.isArray(modValue) ? modValue : [modValue];

    for (const mod of modEntries) {
      applySingleMod(nextRecord, key, mod);
    }
  }

  return nextRecord;
}

export function createRecordIndex(records, selectKey) {
  return new Map(records.map((record) => [selectKey(record), record]));
}

export function resolveRecord(record, recordIndex) {
  if (!record || !record._copy) {
    return deepClone(record);
  }

  const copyKey = [
    record._copy.name,
    record._copy.source,
    record._copy.className,
    record._copy.classSource,
  ]
    .filter(Boolean)
    .join('::');

  const baseRecord = recordIndex.get(copyKey);
  if (!baseRecord) {
    return deepClone(record);
  }

  const resolvedBase = resolveRecord(baseRecord, recordIndex);
  const merged = mergePreserving(resolvedBase, record, record._copy._preserve);

  delete merged._copy;

  if (record._copy._mod) {
    return applyMods(merged, record._copy._mod);
  }

  return merged;
}

export function resolveCollection(records, selectKey) {
  const recordIndex = createRecordIndex(records, selectKey);
  return records.map((record) => resolveRecord(record, recordIndex));
}
