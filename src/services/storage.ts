import { LocalStorage } from "@raycast/api";
import { LayoutRepository } from "./state-repository.ts";

export const layoutRepository = new LayoutRepository({
  getItem: (key) => LocalStorage.getItem<string>(key),
  setItem: (key, value) => LocalStorage.setItem(key, value),
});
