import { randomUUID } from "node:crypto";
import { AI, Action, ActionPanel, Detail, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { useApplications } from "../hooks/useApplications";
import { useLauncherState } from "../hooks/useLauncherState";
import { applicationStore } from "../services/applications";
import {
  applyOrganization,
  organizationCandidates,
  organizationPrompt,
  parseOrganization,
} from "../services/ai-organization";
import type { SuggestedGroup } from "../services/ai-organization";
import { perform } from "./feedback";

export function AIOrganize() {
  const { applications, isLoading, error } = useApplications();
  const { state, status, update } = useLauncherState();
  const { pop } = useNavigation();
  const [groups, setGroups] = useState<SuggestedGroup[]>();
  const [working, setWorking] = useState(false);
  const [controller] = useState(() => new AbortController());
  useEffect(() => () => controller.abort(), [controller]);
  const candidates = organizationCandidates(applications, state);

  async function generate() {
    if (working || isLoading || error || status !== "ready" || !candidates.length) return;
    setWorking(true);
    try {
      const response = await AI.ask(organizationPrompt(candidates), { creativity: "low", signal: controller.signal });
      setGroups(parseOrganization(response, candidates));
    } catch (cause) {
      if (!controller.signal.aborted) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Could Not Organize with AI",
          message: cause instanceof Error ? cause.message : String(cause),
        });
      }
    } finally {
      if (!controller.signal.aborted) setWorking(false);
    }
  }

  async function apply() {
    if (!groups || working) return;
    setWorking(true);
    const saved = await perform("Could Not Apply AI Organization", () =>
      update((current) => {
        const currentApps = applicationStore.getSnapshot();
        const proposed = groups.flatMap((group) => group.apps);
        const byPath = new Map(currentApps.applications.map((app) => [app.path, app]));
        if (
          currentApps.isLoading ||
          currentApps.error ||
          proposed.some((app) => {
            const latest = byPath.get(app.path);
            return (
              !latest ||
              latest.name !== app.name ||
              latest.stableId !== app.stableId ||
              latest.hasMultipleInstallations !== app.hasMultipleInstallations
            );
          })
        )
          throw new Error("The application catalog changed. Generate a new proposal.");
        return applyOrganization(current, groups, randomUUID);
      }),
    );
    setWorking(false);
    if (saved) pop();
  }

  if (groups) {
    return (
      <List
        navigationTitle="Review AI Organization"
        isLoading={working}
        searchBarPlaceholder="Filter proposed applications…"
        actions={
          <ActionPanel>
            <Action title="Apply Organization" icon={Icon.Check} onAction={apply} />
            <Action title="Discard Proposal" icon={Icon.Xmark} onAction={() => setGroups(undefined)} />
          </ActionPanel>
        }
      >
        {groups.map((group) => (
          <List.Section key={group.name} title={group.name} subtitle={`${group.apps.length} apps`}>
            {group.apps.map((app) => (
              <List.Item
                key={app.id}
                title={app.name}
                subtitle={app.hasMultipleInstallations ? app.path : undefined}
                icon={{ fileIcon: app.path }}
              />
            ))}
          </List.Section>
        ))}
      </List>
    );
  }
  return (
    <Detail
      navigationTitle="Organize with AI"
      isLoading={working || isLoading || status === "loading"}
      markdown={`# Organize with Raycast AI\n\n${candidates.length} apps have no saved folder choice. Raycast AI will suggest categories for them.\n\nApp names will be sent to Raycast AI; app paths and your existing folder layout will not be included. Raycast AI access is required.\n\nReview the proposal before applying it. Applying creates an **AI Organized** folder with category subfolders. Existing folders and apps you've already moved, including apps moved to Home, stay as they are.`}
      actions={
        <ActionPanel>
          {!isLoading && !error && status === "ready" && candidates.length > 0 && (
            <Action title="Generate Proposal" icon={Icon.Stars} onAction={generate} />
          )}
          <Action title="Go Back" icon={Icon.ArrowLeft} onAction={pop} />
        </ActionPanel>
      }
    />
  );
}
