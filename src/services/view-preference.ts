import type { StorageAdapter } from "./state-repository.ts";
import { toError } from "./state-repository.ts";

export type ViewMode = "grid" | "list";
export const VIEW_MODE_KEY = "appsolutely.viewMode";

interface ViewSnapshot {
  mode: ViewMode;
  isLoading: boolean;
  error?: Error;
}

export class ViewPreference {
  private snapshot: ViewSnapshot = { mode: "grid", isLoading: true };
  private listeners = new Set<() => void>();
  private loading?: Promise<void>;
  private queue: Promise<unknown> = Promise.resolve();
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  getSnapshot = (): ViewSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  private publish(snapshot: ViewSnapshot) {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener();
  }

  load = (): Promise<void> => {
    if (this.loading) return this.loading;
    this.loading = (async () => {
      try {
        const saved = await this.storage.getItem(VIEW_MODE_KEY);
        this.publish({ mode: saved === "list" ? "list" : "grid", isLoading: false });
      } catch (error) {
        this.publish({ ...this.snapshot, isLoading: false, error: toError(error) });
      }
    })();
    return this.loading;
  };

  setMode = (mode: ViewMode): Promise<void> => {
    const pending = this.queue.then(async () => {
      await this.load();
      await this.storage.setItem(VIEW_MODE_KEY, mode);
      this.publish({ mode, isLoading: false });
    });
    this.queue = pending.catch(() => undefined);
    return pending;
  };
}
