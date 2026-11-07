import { closeMainWindow, environment, getApplications, open } from "@raycast/api";
import { join } from "node:path";
import type { LauncherApplication } from "../models/application";
import { createApplicationStore } from "./application-store";
import { ApplicationIconStore } from "./application-icon-store";
import { applicationIcon } from "./application-icons";

export const applicationStore = createApplicationStore({
  discover: getApplications,
});

export const applicationIconStore = new ApplicationIconStore((path) =>
  applicationIcon(path, join(environment.supportPath, "icons-v1")),
);

export async function launchApplication(app: LauncherApplication): Promise<void> {
  // Open this installation explicitly; a shared bundle ID could select a different copy.
  await open(app.path);
  await closeMainWindow();
}
