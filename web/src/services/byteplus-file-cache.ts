import localforage from "localforage";

/**
 * BytePlus Files API downloads default to a 7-day server-side retention (per docs); we refresh a day early so a
 * cached download_url is never handed out right at the edge of expiry. Persisted (not just in-memory) so a
 * reference image already uploaded in a previous session — important once this ships as a desktop app with
 * longer-lived local state — doesn't get re-uploaded on every reload.
 */
const SAFE_TTL_MS = 6 * 24 * 60 * 60 * 1000;

type CachedUpload = { downloadUrl: string; uploadedAt: number };

const store = localforage.createInstance({ name: "infinite-canvas", storeName: "byteplus_file_uploads" });

export async function getCachedByteplusUpload(key: string): Promise<string | null> {
    const cached = await store.getItem<CachedUpload>(key);
    if (!cached) return null;
    if (Date.now() - cached.uploadedAt > SAFE_TTL_MS) {
        await store.removeItem(key);
        return null;
    }
    return cached.downloadUrl;
}

export async function setCachedByteplusUpload(key: string, downloadUrl: string) {
    await store.setItem<CachedUpload>(key, { downloadUrl, uploadedAt: Date.now() });
}
