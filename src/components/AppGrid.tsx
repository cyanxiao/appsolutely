import { ActionPanel, Grid, Icon, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { useApplications } from "../hooks/useApplications";
import { useLauncherState } from "../hooks/useLauncherState";
import { assignmentFor, searchApplications } from "../services/application-model";
import { folderPath } from "../utils/hierarchy";
import { byOrderThenName } from "../utils/sorting";
import { AppItem } from "./AppItem";
import { FolderItem } from "./FolderItem";
import { GlobalActions } from "./GlobalActions";

export function AppGrid({ folderId = null, searchMode = false }: { folderId?: string | null; searchMode?: boolean }) {
  const { applications, isLoading, error: applicationError } = useApplications();
  const { state, status, warning, error: storageError } = useLauncherState();
  const [searchText, setSearchText] = useState("");
  const searching = searchText.trim().length > 0;
  // A reset/deletion in another pushed view cannot leave apps stranded in a stale view.
  const currentFolder = state.folders.some((f) => f.id === folderId) ? folderId : null;
  const actions = (
    <ActionPanel>
      <GlobalActions folderId={currentFolder} />
    </ActionPanel>
  );

  useEffect(() => {
    if (applicationError) {
      void showToast({
        style: Toast.Style.Failure,
        title: "Could Not Refresh Applications",
        message: applicationError.message,
      });
    }
  }, [applicationError]);

  useEffect(() => {
    if (storageError || warning) {
      void showToast({
        style: Toast.Style.Failure,
        title: storageError ? "Could Not Load Layout" : "Layout Recovered",
        message: storageError?.message ?? warning,
      });
    }
  }, [storageError, warning]);

  const visibleApps = useMemo(() => {
    if (searching) return searchApplications(applications, searchText);
    return applications
      .filter((app) => (assignmentFor(app, state)?.folderId ?? null) === currentFolder)
      .map((app) => ({ ...app, order: assignmentFor(app, state)?.order ?? 0 }))
      .sort(byOrderThenName);
  }, [applications, state, currentFolder, searching, searchText]);
  const folders = searching ? [] : state.folders.filter((f) => f.parentId === currentFolder).sort(byOrderThenName);
  const error = applicationError ?? storageError;

  return (
    <Grid
      columns={6}
      inset={Grid.Inset.Medium}
      fit={Grid.Fit.Contain}
      isLoading={isLoading || status === "loading"}
      navigationTitle={searchMode ? "Search All Applications" : folderPath(state.folders, currentFolder)}
      searchBarPlaceholder="Search all applications…"
      searchText={searchText}
      onSearchTextChange={setSearchText}
      filtering={false}
      actions={actions}
    >
      <Grid.EmptyView
        icon={error ? Icon.ExclamationMark : searching ? Icon.MagnifyingGlass : Icon.Folder}
        title={
          error
            ? "Could Not Load Appsolutely"
            : searching
              ? "No Applications Found"
              : currentFolder
                ? "This Folder Is Empty"
                : "No Applications Found"
        }
        description={
          error?.message ??
          (searching
            ? "Try another application name."
            : currentFolder
              ? "Move apps here using the Action Panel, or create a subfolder."
              : "Refresh applications to check again.")
        }
        actions={actions}
      />
      {folders.map((folder) => (
        <FolderItem key={folder.id} folder={folder} parentId={currentFolder} />
      ))}
      {visibleApps.map((app) => (
        <AppItem key={app.id} app={app} folderId={currentFolder} />
      ))}
    </Grid>
  );
}
