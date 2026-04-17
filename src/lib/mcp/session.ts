/**
 * Request-scoped session state using AsyncLocalStorage.
 *
 * Each incoming request runs inside runWithSession(), which creates an
 * isolated store. Reads/writes to sessionState.lastPostResults are
 * scoped to that request only — no cross-request contamination and no
 * shared mutable globals across concurrent serverless invocations.
 */

import { AsyncLocalStorage } from "async_hooks";

export interface PostResultSubset {
    title: string;
    slug: string;
    date: string;
}

interface SessionStore {
    lastPostResults: PostResultSubset[];
}

const storage = new AsyncLocalStorage<SessionStore>();

export const sessionState = {
    get lastPostResults(): PostResultSubset[] {
        return storage.getStore()?.lastPostResults ?? [];
    },
    set lastPostResults(value: PostResultSubset[]) {
        const store = storage.getStore();
        if (store) {
            store.lastPostResults = value;
        }
        // Outside a runWithSession context (e.g. tests): silently no-op.
    },
};

/**
 * Run `fn` with a fresh, isolated session store pre-seeded with `initial`.
 * All sessionState reads/writes inside `fn` (and its entire async chain)
 * are isolated to this invocation.
 */
export function runWithSession<T>(
    initial: PostResultSubset[],
    fn: () => Promise<T>
): Promise<T> {
    return storage.run({ lastPostResults: [...initial] }, fn);
}
