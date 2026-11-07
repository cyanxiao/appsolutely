import { environment } from "@raycast/api";
import { join } from "node:path";
import { useEffect, useMemo, useState } from "react";
import { folderPreview, folderPreviewEntries, type FolderPreviewEntry } from "../services/folder-previews";
import { useApplications } from "./useApplications";
import { useLauncherState } from "./useLauncherState";

export function useFolderPreview(folderId: string): string | undefined {
  const { applications } = useApplications();
  const { state } = useLauncherState();
  const entries = useMemo(() => folderPreviewEntries(folderId, applications, state), [folderId, applications, state]);
  // Ignore unrelated application-icon updates elsewhere in the catalog.
  const key = JSON.stringify(entries);
  const [preview, setPreview] = useState<{ key: string; path: string }>();

  useEffect(() => {
    let cancelled = false;
    const requestedEntries: FolderPreviewEntry[] = JSON.parse(key);
    if (requestedEntries.length) {
      void folderPreview(requestedEntries, join(environment.supportPath, "folder-previews-v1")).then((path) => {
        if (!cancelled && path) setPreview({ key, path });
      });
    }
    return () => {
      cancelled = true;
    };
  }, [key]);

  return entries.length && preview?.key === key ? preview.path : undefined;
}
