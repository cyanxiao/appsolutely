import { closeMainWindow, getApplications, open } from "@raycast/api";
import type { LauncherApplication } from "../models/application";
import { createApplicationStore } from "./application-store";

export const applicationStore = createApplicationStore({
  discover: getApplications,
});

export async function launchApplication(app: LauncherApplication): Promise<void> {
  // Open this installation explicitly; a shared bundle ID could select a different copy.
  await open(app.path);
  await closeMainWindow();
}
