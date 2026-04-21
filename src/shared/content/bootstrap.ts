import type { BundledContentBootstrapResult } from '@/shared/content/bootstrap.types';

export async function ensureBundledContentReady(): Promise<BundledContentBootstrapResult> {
  return {
    seeded: false,
    contentVersion: null,
  };
}
