export interface BundledContentManifestChunk {
  entityType: string;
  chunkId: string;
  filePath: string;
  recordCount: number;
}

export interface BundledContentManifest {
  schemaVersion: number;
  contentVersion: string;
  generatedAt: string;
  sourceRepository: string;
  sourceRef: string;
  chunkCount: number;
  entityCounts: Record<string, number>;
  chunks: BundledContentManifestChunk[];
}

export interface BundledContentChunk<TRecords = unknown> {
  schemaVersion: number;
  contentVersion: string;
  entityType: string;
  chunkId: string;
  generatedAt: string;
  records: TRecords;
}
