"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  serializeBrowserSession,
  validateBrowserSession,
} from "@/features/browser/browser-session";
import type {
  BrowserEntry,
  BrowserSession,
  SearchEntry,
} from "@/features/browser/browser-session";
import type { Site } from "@/types/api";

const SESSION_KEY = "small-web:browser-session:v1";

function createEntryId() {
  return globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createHomeEntry(): BrowserEntry {
  return {
    id: "initial-home",
    kind: "page",
    address: null,
    scrollY: 0,
    frameScrollY: 0,
  };
}

function createInitialSession(): BrowserSession {
  return {
    version: 1,
    selectedPersonId: "",
    entries: [createHomeEntry()],
    index: 0,
  };
}

function appendEntry(
  current: BrowserSession,
  entry: BrowserEntry,
  scrollY: number,
  frameScrollY: number,
): BrowserSession {
  const entries = current.entries.slice(0, current.index + 1);
  entries[current.index] = {
    ...entries[current.index],
    scrollY,
    frameScrollY,
  };
  entries.push(entry);
  if (entries.length > 50) entries.shift();
  return { ...current, entries, index: entries.length - 1 };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Browser navigation could not be saved for this session.";
}

export function useBrowser() {
  const [browserState, setBrowserState] = useState(createInitialSession);
  const sessionRef = useRef(browserState);
  const [isRestored, setIsRestored] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const pendingRestoreId = useRef<string | null>(null);
  const currentFrameScroll = useRef(0);
  const scrollSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback(
    (update: (current: BrowserSession) => BrowserSession) => {
      const next = update(sessionRef.current);
      if (next === sessionRef.current) return;
      sessionRef.current = next;
      setBrowserState(next);
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const stored = sessionStorage.getItem(SESSION_KEY);
        if (stored) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(stored);
          } catch {
            parsed = null;
          }

          const restored = validateBrowserSession(parsed);
          if (restored) {
            sessionRef.current = restored;
            setBrowserState(restored);
            pendingRestoreId.current =
              restored.entries[restored.index].id;
            currentFrameScroll.current =
              restored.entries[restored.index].frameScrollY;
          }
        }
      } catch (error) {
        setSessionError(getErrorMessage(error));
      } finally {
        setIsRestored(true);
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isRestored) return;

    try {
      sessionStorage.setItem(
        SESSION_KEY,
        serializeBrowserSession(browserState),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setTimeout(() => setSessionError(message), 0);
    }
  }, [browserState, isRestored]);

  const scheduleScrollSave = useCallback(() => {
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    scrollSaveTimer.current = setTimeout(() => {
      const scrollY = window.scrollY;
      const frameScrollY = currentFrameScroll.current;
      commit((current) => {
        const entry = current.entries[current.index];
        if (
          entry.scrollY === scrollY &&
          entry.frameScrollY === frameScrollY
        ) {
          return current;
        }

        const entries = [...current.entries];
        entries[current.index] = { ...entry, scrollY, frameScrollY };
        return { ...current, entries };
      });
    }, 120);
  }, [commit]);

  const flushScrollSave = useCallback(() => {
    if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);

    const scrollY = window.scrollY;
    const frameScrollY = currentFrameScroll.current;
    commit((current) => {
      const entry = current.entries[current.index];
      if (entry.scrollY === scrollY && entry.frameScrollY === frameScrollY) {
        return current;
      }

      const entries = [...current.entries];
      entries[current.index] = { ...entry, scrollY, frameScrollY };
      return { ...current, entries };
    });

    try {
      sessionStorage.setItem(
        SESSION_KEY,
        serializeBrowserSession(sessionRef.current),
      );
    } catch (error) {
      const message = getErrorMessage(error);
      setTimeout(() => setSessionError(message), 0);
    }
  }, [commit]);

  useEffect(() => {
    if (!isRestored) return;

    function handleWindowScroll() {
      scheduleScrollSave();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") flushScrollSave();
    }

    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener("pagehide", flushScrollSave);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener("pagehide", flushScrollSave);
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
      if (scrollSaveTimer.current) clearTimeout(scrollSaveTimer.current);
    };
  }, [flushScrollSave, isRestored, scheduleScrollSave]);

  const setSelectedPersonId = useCallback(
    (personId: string) => {
      commit((current) =>
        current.selectedPersonId === personId
          ? current
          : { ...current, selectedPersonId: personId },
      );
    },
    [commit],
  );

  const updateCurrentPosition = useCallback(
    (frameScrollY = currentFrameScroll.current) => {
      currentFrameScroll.current = frameScrollY;
      scheduleScrollSave();
    },
    [scheduleScrollSave],
  );

  const captureCurrentPosition = useCallback(() => {
    const scrollY = window.scrollY;
    const frameScrollY = currentFrameScroll.current;
    commit((current) => {
      const entry = current.entries[current.index];
      if (entry.scrollY === scrollY && entry.frameScrollY === frameScrollY) {
        return current;
      }

      const entries = [...current.entries];
      entries[current.index] = { ...entry, scrollY, frameScrollY };
      return { ...current, entries };
    });
  }, [commit]);

  const navigateToPage = useCallback(
    (address: string | null, frameScrollY?: number) => {
      const current = sessionRef.current;
      const active = current.entries[current.index];
      if (active.kind === "page" && active.address === address) return;

      const id = createEntryId();
      const scrollY = window.scrollY;
      const savedFrameScroll =
        frameScrollY ?? currentFrameScroll.current;
      currentFrameScroll.current = 0;
      pendingRestoreId.current = null;

      commit((state) =>
        appendEntry(
          state,
          {
            id,
            kind: "page",
            address,
            scrollY: 0,
            frameScrollY: 0,
          },
          scrollY,
          savedFrameScroll,
        ),
      );
      window.scrollTo(0, 0);
    },
    [commit],
  );

  const openSearch = useCallback(() => {
    const active = sessionRef.current.entries[sessionRef.current.index];
    if (active.kind === "search") return;

    const id = createEntryId();
    const scrollY = window.scrollY;
    const frameScrollY = currentFrameScroll.current;
    pendingRestoreId.current = null;
    currentFrameScroll.current = 0;
    commit((current) =>
      appendEntry(
        current,
        {
          id,
          kind: "search",
          query: "",
          results: [],
          searchStatus: "idle",
          searchError: null,
          scrollY: 0,
          frameScrollY: 0,
        },
        scrollY,
        frameScrollY,
      ),
    );
    window.scrollTo(0, 0);
  }, [commit]);

  const updateSearchQuery = useCallback(
    (query: string) => {
      commit((current) => {
        const entry = current.entries[current.index];
        if (entry.kind !== "search" || entry.query === query) return current;
        const entries = [...current.entries];
        entries[current.index] = {
          ...entry,
          query,
          results: [],
          searchStatus: "idle",
          searchError: null,
        };
        return { ...current, entries };
      });
    },
    [commit],
  );

  const submitSearch = useCallback(
    (query: string) => {
      const current = sessionRef.current;
      const active = current.entries[current.index];
      if (active.kind === "search") {
        commit((state) => {
          const entry = state.entries[state.index];
          if (entry.kind !== "search") return state;
          const entries = [...state.entries];
          entries[state.index] = {
            ...entry,
            query,
            results: [],
            searchStatus: query.trim() ? "pending" : "complete",
            searchError: null,
          };
          return { ...state, entries };
        });
        return;
      }

      const id = createEntryId();
      const scrollY = window.scrollY;
      const frameScrollY = currentFrameScroll.current;
      currentFrameScroll.current = 0;
      pendingRestoreId.current = null;
      commit((state) =>
        appendEntry(
          state,
          {
            id,
            kind: "search",
            query,
            results: [],
            searchStatus: query.trim() ? "pending" : "complete",
            searchError: null,
            scrollY: 0,
            frameScrollY: 0,
          },
          scrollY,
          frameScrollY,
        ),
      );
      window.scrollTo(0, 0);
    },
    [commit],
  );

  const retrySearch = useCallback(() => {
    commit((current) => {
      const entry = current.entries[current.index];
      if (entry.kind !== "search") return current;
      const entries = [...current.entries];
      entries[current.index] = {
        ...entry,
        results: [],
        searchStatus: entry.query.trim() ? "pending" : "complete",
        searchError: null,
      };
      return { ...current, entries };
    });
  }, [commit]);

  const completeSearch = useCallback(
    (entryId: string, query: string, results: Site[]) => {
      commit((current) => {
        const index = current.entries.findIndex(
          (entry) => entry.id === entryId,
        );
        if (index < 0 || current.entries[index].kind !== "search") {
          return current;
        }

        const entries = [...current.entries];
        const entry = entries[index] as SearchEntry;
        if (entry.query !== query || entry.searchStatus !== "pending") {
          return current;
        }
        entries[index] = {
          ...entry,
          results,
          searchStatus: "complete",
          searchError: null,
        };
        return { ...current, entries };
      });
    },
    [commit],
  );

  const failSearch = useCallback(
    (entryId: string, query: string, searchError: string) => {
      commit((current) => {
        const index = current.entries.findIndex(
          (entry) => entry.id === entryId,
        );
        if (index < 0 || current.entries[index].kind !== "search") {
          return current;
        }

        const entries = [...current.entries];
        const entry = entries[index] as SearchEntry;
        if (entry.query !== query || entry.searchStatus !== "pending") {
          return current;
        }
        entries[index] = { ...entry, searchStatus: "error", searchError };
        return { ...current, entries };
      });
    },
    [commit],
  );

  const back = useCallback(() => {
    const current = sessionRef.current;
    if (current.index <= 0) return;
    const target = current.entries[current.index - 1];
    captureCurrentPosition();
    pendingRestoreId.current = target.id;
    currentFrameScroll.current = target.frameScrollY;
    commit((state) => ({ ...state, index: state.index - 1 }));
  }, [captureCurrentPosition, commit]);

  const forward = useCallback(() => {
    const current = sessionRef.current;
    if (current.index >= current.entries.length - 1) return;
    const target = current.entries[current.index + 1];
    captureCurrentPosition();
    pendingRestoreId.current = target.id;
    currentFrameScroll.current = target.frameScrollY;
    commit((state) => ({ ...state, index: state.index + 1 }));
  }, [captureCurrentPosition, commit]);

  const restoreScroll = useCallback((entryId: string) => {
    if (pendingRestoreId.current !== entryId) return;
    pendingRestoreId.current = null;
    const target = sessionRef.current.entries[sessionRef.current.index];
    requestAnimationFrame(() => {
      if (sessionRef.current.entries[sessionRef.current.index]?.id !== entryId) {
        return;
      }
      window.scrollTo(0, target.scrollY);
      currentFrameScroll.current = target.frameScrollY;
    });
  }, []);

  const markPageReady = useCallback((entryId: string) => {
    restoreScroll(entryId);
  }, [restoreScroll]);

  const retryPage = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  return {
    back,
    browserState,
    completeSearch,
    currentEntry: browserState.entries[browserState.index],
    failSearch,
    forward,
    isRestored,
    markPageReady,
    navigateToPage,
    openSearch,
    reloadKey,
    restoreScroll,
    retryPage,
    retrySearch,
    sessionError,
    setSelectedPersonId,
    submitSearch,
    updateCurrentPosition,
    updateSearchQuery,
  };
}
