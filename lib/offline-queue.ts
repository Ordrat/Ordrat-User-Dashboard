/**
 * Offline mutation queue — thin adapter over lib/offline-db.ts.
 * Re-exports the typed QueuedRequest and wraps addToQueue with the simpler
 * signature that api-client.ts uses.
 *
 * All operations are async (IndexedDB).
 */

export type { QueuedRequest } from './offline-db';
export {
  getAllPending as getQueue,
  getAllFailed,
  getQueueCount,
  removeFromQueue,
  markFailed,
  markPending,
  clearQueue,
  subscribe,
} from './offline-db';

import { addToQueue } from './offline-db';

/** Enqueue a mutation for later sync. Returns the new item's UUID. */
export function enqueue(req: {
  path: string;
  method: string;
  body: string | null;
  /** Set to true when the body is JSON-serialized FormData text fields */
  isFormData?: boolean;
  entityType?: string | null;
  entityId?: string | null;
}): Promise<string> {
  return addToQueue({
    path: req.path,
    method: req.method,
    body: req.body,
    isFormData: req.isFormData ?? false,
    entityType: req.entityType ?? null,
    entityId: req.entityId ?? null,
  });
}
