import rawChangelog from "@/data/changelog.json";

export type ReleaseType = "patch" | "minor" | "major";

export type ChangelogRelease = {
  version: string;
  releaseDate: string;
  title: string;
  summary?: string;
  type: ReleaseType;
  added: string[];
  improved: string[];
  fixed: string[];
};

export const VERSION_TYPE_GUIDE: Array<{
  type: ReleaseType;
  label: string;
  description: string;
}> = [
  {
    type: "patch",
    label: "Patch",
    description: "Bug fixes and small improvements",
  },
  {
    type: "minor",
    label: "Minor",
    description: "New features",
  },
  {
    type: "major",
    label: "Major",
    description: "Large releases or redesigns",
  },
];

function parseSemver(version: string): [number, number, number] {
  const parts = version.replace(/^v/i, "").split(".").map((n) => Number(n) || 0);
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

export function compareSemverDesc(a: string, b: string): number {
  const [aMaj, aMin, aPatch] = parseSemver(a);
  const [bMaj, bMin, bPatch] = parseSemver(b);
  if (aMaj !== bMaj) return bMaj - aMaj;
  if (aMin !== bMin) return bMin - aMin;
  return bPatch - aPatch;
}

export const CHANGELOG_RELEASES: ChangelogRelease[] = (rawChangelog as ChangelogRelease[])
  .slice()
  .sort((a, b) => compareSemverDesc(a.version, b.version));

export const LATEST_RELEASE: ChangelogRelease | undefined = CHANGELOG_RELEASES[0];
export const APP_VERSION: string = LATEST_RELEASE?.version ?? "0.1.1";

const LAST_SEEN_VERSION_KEY = "mybudget-last-seen-version";
const LAST_SEEN_VERSION_EVENT = "mybudget-last-seen-version-change";

export function hasUnseenRelease(lastSeenVersion: string | null | undefined): boolean {
  const baseline = lastSeenVersion?.trim() || "0.1.0";
  return compareSemverDesc(APP_VERSION, baseline) < 0;
}

export function getLastSeenVersion(): string {
  if (typeof window === "undefined") return APP_VERSION;
  return window.localStorage.getItem(LAST_SEEN_VERSION_KEY) || "0.1.0";
}

export function subscribeLastSeenVersion(callback: () => void) {
  window.addEventListener(LAST_SEEN_VERSION_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(LAST_SEEN_VERSION_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function getLastSeenVersionSnapshot(): string {
  return getLastSeenVersion();
}

export function getServerLastSeenVersionSnapshot(): string {
  // Return APP_VERSION on SSR so the banner does not flash before hydration
  return APP_VERSION;
}

export function updateLastSeenVersion(version: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  window.dispatchEvent(new Event(LAST_SEEN_VERSION_EVENT));
}
