export interface DiscoveredApplication {
  name: string;
  path: string;
  bundleId?: string;
}

export interface LauncherApplication extends DiscoveredApplication {
  /** Cached full-resolution bundle icon, when available. */
  iconPath?: string;
  /** Path identity keeps separate installations individually selectable. */
  id: string;
  stableId: string;
  hasMultipleInstallations: boolean;
  isPreferredInstallation: boolean;
}
