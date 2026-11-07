import { closeMainWindow, environment, getApplications, open } from "@raycast/api";
import { join } from "node:path";
import type { LauncherApplication } from "../models/application";
import { prepareApplications } from "./application-model";
import { toError } from "./state-repository";
import { loadApplicationIcons } from "./application-icons";

interface ApplicationSnapshot {
  applications: LauncherApplication[];
  isLoading: boolean;
  error?: Error;
}

let snapshot: ApplicationSnapshot = { applications: [], isLoading: true };
let pending: Promise<void> | undefined;
const listeners = new Set<() => void>();

function publish(next: ApplicationSnapshot) {
  snapshot = next;
  for (const listener of listeners) listener();
}

export const applicationStore = {
  getSnapshot: () => snapshot,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  refresh: (): Promise<void> => {
    if (pending) return pending;
    publish({ ...snapshot, isLoading: true, error: undefined });
    pending = (async () => {
      try {
        const applications = prepareApplications(await getApplications());
        publish({ applications, isLoading: false });
        // Render immediately, then replace native thumbnails as sharp icons arrive.
        const icons = new Map<string, string>();
        let lastPublish = Date.now();
        function publishIcons() {
          publish({
            applications: applications.map((app) => ({ ...app, iconPath: icons.get(app.path) })),
            isLoading: false,
          });
          lastPublish = Date.now();
        }
        await loadApplicationIcons(
          applications.map((app) => app.path),
          join(environment.supportPath, "icons-v1"),
          (path, image) => {
            icons.set(path, image);
            if (Date.now() - lastPublish >= 100) publishIcons();
          },
        );
        publishIcons();
      } catch (error) {
        publish({ ...snapshot, isLoading: false, error: toError(error) });
      } finally {
        pending = undefined;
      }
    })();
    return pending;
  },
};

export async function launchApplication(app: LauncherApplication): Promise<void> {
  // Open this installation explicitly; a shared bundle ID could select a different copy.
  await open(app.path);
  await closeMainWindow();
}
