import type { Site } from "@/types/api";

export type PageEntry = {
  id: string;
  kind: "page";
  address: string | null;
  scrollY: number;
  frameScrollY: number;
};

export type SearchEntry = {
  id: string;
  kind: "search";
  query: string;
  results: Site[];
  searchStatus: "idle" | "pending" | "complete" | "error";
  searchError: string | null;
  scrollY: number;
  frameScrollY: number;
};

export type BrowserEntry = PageEntry | SearchEntry;

export type BrowserSession = {
  version: 1;
  selectedPersonId: string;
  entries: BrowserEntry[];
  index: number;
};

const INTERNAL_ADDRESS =
  /^smallweb:\/\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;
const MAX_ENTRIES = 50;
const MAX_RESULTS = 50;
const MAX_SCROLL = 10_000_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: string[]) {
  return (
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}

function isScrollPosition(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_SCROLL
  );
}

function isSite(value: unknown): value is Site {
  return (
    isRecord(value) &&
    (hasExactKeys(value, ["_id", "address", "title"]) ||
      hasExactKeys(value, ["_id", "address", "title", "textContent"])) &&
    typeof value._id === "string" &&
    value._id.length > 0 &&
    value._id.length <= 128 &&
    typeof value.address === "string" &&
    INTERNAL_ADDRESS.test(value.address) &&
    typeof value.title === "string" &&
    value.title.length <= 2048 &&
    (value.textContent === undefined ||
      (typeof value.textContent === "string" &&
        value.textContent.length <= 2000))
  );
}

function isEntry(value: unknown): value is BrowserEntry {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== "string" ||
    value.id.length === 0 ||
    value.id.length > 128 ||
    !isScrollPosition(value.scrollY) ||
    !isScrollPosition(value.frameScrollY)
  ) {
    return false;
  }

  if (value.kind === "page") {
    if (
      !hasExactKeys(value, [
        "id",
        "kind",
        "address",
        "scrollY",
        "frameScrollY",
      ])
    ) {
      return false;
    }

    return (
      value.address === null ||
      (typeof value.address === "string" &&
        value.address.length > 0 &&
        value.address.length <= 2048 &&
        !/[\u0000-\u001f\u007f]/.test(value.address))
    );
  }

  return (
    value.kind === "search" &&
    hasExactKeys(value, [
      "id",
      "kind",
      "query",
      "results",
      "searchStatus",
      "searchError",
      "scrollY",
      "frameScrollY",
    ]) &&
    typeof value.query === "string" &&
    value.query.length <= 100 &&
    Array.isArray(value.results) &&
    value.results.length <= MAX_RESULTS &&
    value.results.every(isSite) &&
    ["idle", "pending", "complete", "error"].includes(
      value.searchStatus as string,
    ) &&
    (value.searchError === null ||
      (typeof value.searchError === "string" &&
        value.searchError.length <= 2048))
  );
}

export function validateBrowserSession(value: unknown): BrowserSession | null {
  if (
    !isRecord(value) ||
    !hasExactKeys(value, [
      "version",
      "selectedPersonId",
      "entries",
      "index",
    ]) ||
    value.version !== 1 ||
    typeof value.selectedPersonId !== "string" ||
    value.selectedPersonId.length > 128 ||
    !Array.isArray(value.entries) ||
    value.entries.length === 0 ||
    value.entries.length > MAX_ENTRIES ||
    !Number.isInteger(value.index) ||
    (value.index as number) < 0 ||
    (value.index as number) >= value.entries.length ||
    !value.entries.every(isEntry)
  ) {
    return null;
  }

  const entries = value.entries as BrowserEntry[];
  const ids = new Set(entries.map((entry) => entry.id));
  if (ids.size !== entries.length) return null;

  return {
    version: 1,
    selectedPersonId: value.selectedPersonId,
    entries,
    index: value.index as number,
  };
}

export function serializeBrowserSession(session: BrowserSession): string {
  return JSON.stringify({
    ...session,
    entries: session.entries.map((entry) =>
      entry.kind === "search"
        ? {
            ...entry,
            results: entry.results.slice(0, MAX_RESULTS).map((site) => ({
              _id: site._id,
              address: site.address,
              title: site.title,
              ...(site.textContent === undefined
                ? {}
                : { textContent: site.textContent.slice(0, 500) }),
            })),
          }
        : entry,
    ),
  });
}
