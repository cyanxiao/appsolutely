import { Action, ActionPanel, Alert, confirmAlert, Icon, Keyboard } from "@raycast/api";
import { useLauncherState } from "../hooks/useLauncherState";
import { applicationStore } from "../services/applications";
import { emptyState } from "../models/folder";
import { FolderForm } from "./FolderForm";
import { AppGrid } from "./AppGrid";
import { perform } from "./feedback";

export function GlobalActions({ folderId }: { folderId: string | null }) {
  const { update, status, retry } = useLauncherState();

  async function reset() {
    if (
      await confirmAlert({
        title: "Reset Appsolutely Layout?",
        message: "All folders will be removed and every app will return to Home. Your installed applications are kept.",
        primaryAction: { title: "Reset Layout", style: Alert.ActionStyle.Destructive },
      })
    ) {
      await perform("Could Not Reset Layout", () => update(emptyState));
    }
  }

  return (
    <>
      <ActionPanel.Section title="Appsolutely">
        {status === "ready" ? (
          <Action.Push
            title={folderId ? "Create Subfolder" : "Create Folder"}
            icon={Icon.NewFolder}
            shortcut={Keyboard.Shortcut.Common.New}
            target={<FolderForm parentId={folderId} />}
          />
        ) : (
          <Action title="Retry Loading Layout" icon={Icon.ArrowClockwise} onAction={retry} />
        )}
        <Action.Push
          title="Search All Applications"
          icon={Icon.MagnifyingGlass}
          shortcut={{ modifiers: ["cmd", "shift"], key: "f" }}
          target={<AppGrid folderId={folderId} searchMode />}
        />
        <Action
          title="Refresh Applications"
          icon={Icon.ArrowClockwise}
          shortcut={Keyboard.Shortcut.Common.Refresh}
          onAction={applicationStore.refresh}
        />
      </ActionPanel.Section>
      {status === "ready" && (
        <ActionPanel.Section>
          <Action title="Reset Layout" icon={Icon.Trash} style={Action.Style.Destructive} onAction={reset} />
        </ActionPanel.Section>
      )}
    </>
  );
}
