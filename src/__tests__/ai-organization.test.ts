import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareApplications, moveApplication, assignmentFor } from "../services/application-model.ts";
import {
  applyOrganization,
  organizationCandidates,
  organizationPrompt,
  parseOrganization,
} from "../services/ai-organization.ts";
import { emptyState } from "../models/folder.ts";

const apps = prepareApplications([
  { name: "Editor", path: "/Applications/Editor.app", bundleId: "editor" },
  { name: "Mail", path: "/Applications/Mail.app", bundleId: "mail" },
]);

test("sends names and numeric IDs, not paths or bundle IDs", () => {
  const prompt = organizationPrompt(apps);
  assert.match(prompt, /Editor/);
  assert.doesNotMatch(prompt, /\/Applications|bundleId/);
});

test("validates complete, unique proposals and accepts fenced JSON", () => {
  const groups = parseOrganization('```json\n{"groups":[{"name":"Work","ids":[0,1]}]}\n```', apps);
  assert.deepEqual(groups[0].apps, apps);
  for (const response of [
    "not json",
    '{"groups":[{"name":"Work","ids":[0]}]}',
    '{"groups":[{"name":"Work","ids":[0,0,1]}]}',
    '{"groups":[{"name":"Work","ids":[0,2]}]}',
    '{"groups":[{"name":"Work","ids":[0]},{"name":"work","ids":[1]}]}',
    '{"groups":[{"name":"","ids":[0,1]}]}',
  ])
    assert.throws(() => parseOrganization(response, apps));
});

test("preserves saved choices and applies a proposal in a separate folder", () => {
  const original = moveApplication(emptyState(), apps[0], null);
  assert.deepEqual(organizationCandidates(apps, original), [apps[1]]);
  const ids = ["root", "group"];
  const next = applyOrganization(original, [{ name: "Communication", apps: [apps[1]] }], () => ids.shift()!);
  assert.equal(assignmentFor(apps[0], next)?.folderId, null);
  assert.equal(assignmentFor(apps[1], next)?.folderId, "group");
  assert.deepEqual(
    next.folders.map(({ name, parentId }) => [name, parentId]),
    [
      ["AI Organized", null],
      ["Communication", "root"],
    ],
  );
  assert.throws(
    () => applyOrganization(next, [{ name: "Communication", apps: [apps[1]] }], () => "x"),
    /layout changed/,
  );
});

test("chooses a distinct root name when one already exists", () => {
  const state = { ...emptyState(), folders: [{ id: "existing", name: "AI Organized", parentId: null, order: 0 }] };
  let id = 0;
  const result = applyOrganization(state, [{ name: "Work", apps }], () => String(++id));
  assert.equal(result.folders[1].name, "AI Organized 2");
});
