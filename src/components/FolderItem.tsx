import { Action, ActionPanel, Alert, Color, confirmAlert, Grid, Icon, Keyboard } from "@raycast/api";
import type { Folder } from "../models/folder";
import { useLauncherState } from "../hooks/useLauncherState";
import { useFolderPreview } from "../hooks/useFolderPreview";
import { deleteFolder } from "../utils/hierarchy";
import { AppGrid } from "./AppGrid";
import { FolderForm } from "./FolderForm";
import { FolderPicker } from "./FolderPicker";
import { GlobalActions } from "./GlobalActions";
import { perform } from "./feedback";

export function FolderItem({ folder, parentId }: { folder: Folder; parentId: string | null }) {
  const { update } = useLauncherState();
  const preview = useFolderPreview(folder.id);

  async function remove() {
    if (
      await confirmAlert({
        title: `Delete “${folder.name}”?`,
        message:
          "This folder and its subfolders will be removed. All their apps return to Home. No apps are uninstalled.",
        primaryAction: { title: "Delete Folder", style: Alert.ActionStyle.Destructive },
      })
    ) {
      await perform("Could Not Delete Folder", () => update((s) => deleteFolder(s, folder.id)));
    }
  }

  return (
    <Grid.Item
      id={`folder:${folder.id}`}
      title={folder.name}
      content={preview ? { source: preview } : { source: Icon.Folder, tintColor: Color.Blue }}
      actions={
        <ActionPanel>
          <Action.Push title="Open Folder" icon={Icon.Folder} target={<AppGrid folderId={folder.id} />} />
          <ActionPanel.Section title="Organize">
            <Action.Push title="Create Subfolder" icon={Icon.NewFolder} target={<FolderForm parentId={folder.id} />} />
            <Action.Push
              title="Rename Folder"
              icon={Icon.Pencil}
              shortcut={Keyboard.Shortcut.Common.Edit}
              target={<FolderForm parentId={folder.parentId} folder={folder} />}
            />
            <Action.Push
              title="Move Folder"
              icon={Icon.Folder}
              shortcut={{ modifiers: ["cmd", "shift"], key: "m" }}
              target={<FolderPicker folderId={folder.id} />}
            />
            <Action
              title="Delete Folder"
              icon={Icon.Trash}
              style={Action.Style.Destructive}
              shortcut={{ modifiers: ["ctrl"], key: "x" }}
              onAction={remove}
            />
          </ActionPanel.Section>
          <GlobalActions folderId={parentId} />
        </ActionPanel>
      }
    />
  );
}
