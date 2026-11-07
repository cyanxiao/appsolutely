type IconLoader = (path: string) => Promise<string | undefined>;
export type ApplicationIconSnapshot = ReadonlyMap<string, string | undefined>;

/** Shares large-view icon requests across navigation views without starting idle work. */
export class ApplicationIconStore {
  private snapshot: ApplicationIconSnapshot = new Map();
  private listeners = new Set<() => void>();
  private requests = new Map<string, number>();
  private queued = new Set<string>();
  private running = new Set<string>();
  private loadIcon: IconLoader;

  constructor(loadIcon: IconLoader) {
    this.loadIcon = loadIcon;
  }

  getSnapshot = (): ApplicationIconSnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  acquire = (paths: string[]): (() => void) => {
    const requested = new Set(paths);
    for (const path of requested) {
      const count = this.requests.get(path) ?? 0;
      this.requests.set(path, count + 1);
      if (!count && !this.running.has(path)) this.queued.add(path);
    }
    this.pump();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      for (const path of requested) {
        const count = this.requests.get(path)! - 1;
        if (count) this.requests.set(path, count);
        else {
          this.requests.delete(path);
          this.queued.delete(path);
        }
      }
    };
  };

  private publish(path: string, image: string | undefined) {
    if (!this.requests.has(path)) return;
    this.snapshot = new Map(this.snapshot).set(path, image);
    for (const listener of this.listeners) listener();
  }

  private pump() {
    while (this.running.size < 4 && this.queued.size) {
      const path = this.queued.values().next().value!;
      this.queued.delete(path);
      this.running.add(path);
      void this.load(path);
    }
  }

  private async load(path: string) {
    try {
      // A mode change can release a request before its worker has started.
      await Promise.resolve();
      if (this.requests.has(path)) this.publish(path, await this.loadIcon(path));
    } catch {
      this.publish(path, undefined);
    } finally {
      this.running.delete(path);
      this.pump();
    }
  }
}
