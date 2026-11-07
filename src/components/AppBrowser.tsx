import { ActionPanel, Grid, Icon, List, showToast, Toast } from "@raycast/api";
import { useEffect, useMemo, useState } from "react";
import { useApplications } from "../hooks/useApplications";
import { useLauncherState } from "../hooks/useLauncherState";
import { useViewMode } from "../hooks/useViewMode";
import { useApplicationIcons } from "../hooks/useApplicationIcons";
import { assignmentFor, searchApplications } from "../services/application-model";
import { folderPath } from "../utils/hierarchy";
import { byOrderThenName } from "../utils/sorting";
import { AppItem } from "./AppItem";
import { FolderItem } from "./FolderItem";
import { GlobalActions } from "./GlobalActions";
import { perform } from "./feedback";
import { isViewMode, VIEW_MODES, VIEW_MODE_LABELS } from "../services/view-preference";

const viewIcons = { grid: Icon.AppWindowGrid3x3, "grid-large": Icon.AppWindowGrid2x2, list: Icon.List };

export function AppBrowser({
  folderId = null,
  searchMode = false,
}: {
  folderId?: string | null;
  searchMode?: boolean;
}) {
  const { applications, isLoading, error: applicationError } = useApplications();
  const { state, status, warning, error: storageError } = useLauncherState();
  const { mode, isLoading: viewLoading, error: viewError, setMode } = useViewMode();
  const [searchText, setSearchText] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const searching = searchText.trim().length > 0;
  // A reset/deletion in another pushed view cannot leave apps stranded in a stale view.
  const currentFolder = state.folders.some((f) => f.id === folderId) ? folderId : null;
  const actions = (
    <ActionPanel>
      <GlobalActions folderId={currentFolder} />
    </ActionPanel>
  );

  useEffect(() => {
    if (viewError) {
      void showToast({ style: Toast.Style.Failure, title: "Could Not Load View", message: viewError.message });
    }
  }, [viewError]);

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
  const largeGrid = mode === "grid-large";
  const icons = useApplicationIcons(visibleApps, largeGrid && !viewLoading);
  const iconsLoading = largeGrid && visibleApps.some((app) => !icons.has(app.path));
  const folders = searching ? [] : state.folders.filter((f) => f.parentId === currentFolder).sort(byOrderThenName);
  const error = applicationError ?? storageError;

  const EmptyView = mode === "list" ? List.EmptyView : Grid.EmptyView;
  const Dropdown = mode === "list" ? List.Dropdown : Grid.Dropdown;
  const children = (
    <>
      <EmptyView
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
      {!viewLoading &&
        folders.map((folder) => (
          <FolderItem key={folder.id} folder={folder} parentId={currentFolder} viewMode={mode} />
        ))}
      {!viewLoading &&
        visibleApps.map((app) => (
          <AppItem
            key={app.id}
            app={app}
            folderId={currentFolder}
            viewMode={mode}
            iconPath={largeGrid ? icons.get(app.path) : undefined}
            iconPending={largeGrid && !icons.has(app.path)}
          />
        ))}
    </>
  );
  const props = {
    isLoading: isLoading || status === "loading" || viewLoading || iconsLoading,
    navigationTitle: searchMode ? "Search All Applications" : folderPath(state.folders, currentFolder),
    searchBarPlaceholder: "Search all applications…",
    searchText,
    onSearchTextChange: setSearchText,
    selectedItemId: selectedItemId ?? undefined,
    onSelectionChange: setSelectedItemId,
    filtering: false,
    searchBarAccessory: (
      <Dropdown
        id="appsolutely-view-mode"
        tooltip="View"
        value={mode}
        storeValue={false}
        onChange={(value) => {
          if (isViewMode(value) && value !== mode) {
            void perform("Could Not Save View", () => setMode(value));
          }
        }}
      >
        {VIEW_MODES.map((value) => (
          <Dropdown.Item key={value} title={VIEW_MODE_LABELS[value]} value={value} icon={viewIcons[value]} />
        ))}
      </Dropdown>
    ),
    actions,
  };
  // Mount the saved native view directly, and recreate it when the presentation changes.
  if (viewLoading) return null;
  return mode === "list" ? (
    <List key="list" {...props}>
      {children}
    </List>
  ) : (
    <Grid
      key={mode}
      {...props}
      columns={largeGrid ? 6 : 8}
      inset={largeGrid ? Grid.Inset.Medium : Grid.Inset.Large}
      fit={Grid.Fit.Contain}
    >
      {children}
    </Grid>
  );
}
