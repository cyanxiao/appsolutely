import { Action, ActionPanel, Grid, Icon } from "@raycast/api";
import type { LauncherApplication } from "../models/application";
import { useLauncherState } from "../hooks/useLauncherState";
import { launchApplication } from "../services/applications";
import { assignmentFor, moveApplication } from "../services/application-model";
import { GlobalActions } from "./GlobalActions";
import { FolderPicker } from "./FolderPicker";
import { perform } from "./feedback";

export function AppItem({ app, folderId }: { app: LauncherApplication; folderId: string | null }) {
  const { state, update, status } = useLauncherState();
  const assignedFolder = assignmentFor(app, state)?.folderId ?? null;
  return (
    <Grid.Item
      id={app.id}
      title={app.name}
      subtitle={app.hasMultipleInstallations ? app.path.replace(/\/[^/]+$/, "") : undefined}
      content={{ value: app.iconPath ? { source: app.iconPath } : { fileIcon: app.path }, tooltip: app.path }}
      actions={
        <ActionPanel>
          <Action
            title="Open Application"
            icon={Icon.AppWindow}
            onAction={() => perform("Could Not Open Application", () => launchApplication(app))}
          />
          {status === "ready" && (
            <ActionPanel.Section title="Organize">
              <Action.Push
                title="Move to Folder"
                icon={Icon.Folder}
                shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
                target={<FolderPicker app={app} />}
              />
              {assignedFolder !== null && (
                <Action
                  title="Move to Root"
                  icon={Icon.House}
                  shortcut={{ modifiers: ["cmd", "shift"], key: "u" }}
                  onAction={() =>
                    perform("Could Not Move Application", () => update((s) => moveApplication(s, app, null)))
                  }
                />
              )}
            </ActionPanel.Section>
          )}
          <Action.ShowInFinder path={app.path} shortcut={{ modifiers: ["cmd"], key: "return" }} />
          <GlobalActions folderId={folderId} />
        </ActionPanel>
      }
    />
  );
}
