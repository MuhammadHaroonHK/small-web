"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { LoadingState, StatusState } from "@/components/ui/status-state";
import { HistoryPanel } from "@/features/history/components/history-panel";
import { AddressBar } from "@/features/browser/components/address-bar";
import { PageDisplay } from "@/features/browser/components/page-display";
import { resolveInternalLink } from "@/features/browser/link-navigation";
import { PersonSelect } from "@/features/people/components/person-select";
import { PublishPanel } from "@/features/publish/components/publish-panel";
import { SearchPanel } from "@/features/search/components/search-panel";
import { useBrowser } from "@/features/browser/use-browser";
import { ApiError, api } from "@/lib/api-client";
import type { Person, Site, Visit, VisitSource } from "@/types/api";

type View = "browse" | "search" | "publish";
type IframeLinkMessage = {
  type: "small-web:link";
  href: string;
  scrollY: number;
};

type IframeScrollMessage = {
  type: "small-web:scroll";
  y: number;
};

function isIframeLinkMessage(value: unknown): value is IframeLinkMessage {
  if (typeof value !== "object" || value === null) return false;

  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 3 &&
    message.type === "small-web:link" &&
    typeof message.href === "string" &&
    message.href.length <= 2048 &&
    typeof message.scrollY === "number" &&
    Number.isFinite(message.scrollY) &&
    message.scrollY >= 0 &&
    message.scrollY <= 10_000_000
  );
}

function isIframeScrollMessage(value: unknown): value is IframeScrollMessage {
  if (typeof value !== "object" || value === null) return false;

  const message = value as Record<string, unknown>;
  return (
    Object.keys(message).length === 2 &&
    message.type === "small-web:scroll" &&
    typeof message.y === "number" &&
    Number.isFinite(message.y) &&
    message.y >= 0 &&
    message.y <= 10_000_000
  );
}

const navigation: { id: View; label: string; icon: "compass" | "search" | "plus" }[] =
  [
    { id: "browse", label: "Explore", icon: "compass" },
    { id: "search", label: "Search", icon: "search" },
    { id: "publish", label: "Publish", icon: "plus" },
  ];

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

export function SmallWebApp() {
  const browser = useBrowser();
  const {
    back,
    arrival,
    browserState,
    completeSearch,
    currentEntry,
    failSearch,
    forward,
    isRestored,
    markPageReady,
    navigateToPage,
    openSearch,
    reloadKey,
    retryPage,
    sessionError,
    setSelectedPersonId,
    submitSearch,
    updateCurrentPosition,
  } = browser;
  const [isPublishing, setIsPublishing] = useState(false);
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [isLoadingPeople, setIsLoadingPeople] = useState(true);
  const [sites, setSites] = useState<Site[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [pageLoad, setPageLoad] = useState<{
    requestKey: string;
    site: Site | null;
    error: string | null;
  } | null>(null);
  const [addressDraft, setAddressDraft] = useState<{
    entryId: string;
    value: string;
  }>({ entryId: "", value: "" });
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [unsupportedDestination, setUnsupportedDestination] = useState<
    string | null
  >(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [visitError, setVisitError] = useState<string | null>(null);
  const [historyRefresh, setHistoryRefresh] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const recordedArrivalIds = useRef(new Set<string>());
  const historyRequestId = useRef(0);
  const entryId = currentEntry.id;
  const isPageEntry = currentEntry.kind === "page";
  const pageAddress = isPageEntry ? currentEntry.address : null;
  const pageRequestKey = `${entryId}:${reloadKey}`;
  const pageLoadIsCurrent = pageLoad?.requestKey === pageRequestKey;
  const currentSite = pageLoadIsCurrent ? pageLoad.site : null;
  const siteError = pageLoadIsCurrent ? pageLoad.error : null;
  const isLoadingSite =
    isPageEntry &&
    Boolean(pageAddress) &&
    (!pageLoadIsCurrent || (!currentSite && !siteError));
  const address =
    addressDraft.entryId === entryId
      ? addressDraft.value
      : pageAddress ?? "";
  const frameScrollY =
    currentEntry.kind === "page" ? currentEntry.frameScrollY : 0;
  const searchEntryId =
    currentEntry.kind === "search" ? currentEntry.id : null;
  const searchQuery =
    currentEntry.kind === "search" ? currentEntry.query : "";
  const searchStatus =
    currentEntry.kind === "search" ? currentEntry.searchStatus : null;
  const selectedPersonId = browserState.selectedPersonId;
  const activePersonId = people.some((person) => person._id === selectedPersonId)
    ? selectedPersonId
    : people[0]?._id || "";
  const view: View = isPublishing
    ? "publish"
    : currentEntry.kind === "search"
      ? "search"
      : "browse";

  const navigate = useCallback(
    (
      targetAddress: string | null,
      source: VisitSource = "typed",
      frameScrollY?: number,
    ) => {
      setAddressDraft({ entryId: "", value: "" });
      setUnsupportedDestination(null);
      setIsPublishing(false);
      if (activePersonId) setSelectedPersonId(activePersonId);
      navigateToPage(targetAddress, source, frameScrollY);
    },
    [activePersonId, navigateToPage, setSelectedPersonId],
  );

  const loadSites = useCallback(async () => {
    setIsLoadingSites(true);
    setSitesError(null);
    try {
      setSites(await api.getSites());
    } catch (error) {
      setSitesError(getErrorMessage(error));
    } finally {
      setIsLoadingSites(false);
    }
  }, []);

  const loadPeople = useCallback(async () => {
    setIsLoadingPeople(true);
    setPeopleError(null);
    try {
      const availablePeople = await api.getPeople();
      setPeople(availablePeople);
    } catch (error) {
      setPeopleError(getErrorMessage(error));
    } finally {
      setIsLoadingPeople(false);
    }
  }, []);

  const loadHistory = useCallback(async (personId: string) => {
    const requestId = ++historyRequestId.current;
    if (!personId) {
      setVisits([]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      const history = await api.getVisits(personId);
      if (requestId === historyRequestId.current) setVisits(history);
    } catch (error) {
      if (requestId === historyRequestId.current) {
        setHistoryError(getErrorMessage(error));
      }
    } finally {
      if (requestId === historyRequestId.current) {
        setIsLoadingHistory(false);
      }
    }
  }, []);

  useEffect(() => {
    let active = true;
    void api
      .getPeople()
      .then((availablePeople) => {
        if (!active) return;
        setPeople(availablePeople);
      })
      .catch((error: unknown) => {
        if (active) setPeopleError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoadingPeople(false);
      });
    void api
      .getSites()
      .then((availableSites) => {
        if (active) setSites(availableSites);
      })
      .catch((error: unknown) => {
        if (active) setSitesError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoadingSites(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (
      isLoadingPeople ||
      !people.length ||
      people.some((person) => person._id === selectedPersonId)
    ) {
      return;
    }
    setSelectedPersonId(people[0]._id);
  }, [
    isLoadingPeople,
    people,
    setSelectedPersonId,
    selectedPersonId,
  ]);

  useEffect(() => {
    if (!activePersonId) return;

    const requestId = ++historyRequestId.current;
    void api
      .getVisits(activePersonId)
      .then((history) => {
        if (requestId !== historyRequestId.current) return;
        setVisits(history);
        setHistoryError(null);
      })
      .catch((error: unknown) => {
        if (requestId === historyRequestId.current) {
          setHistoryError(getErrorMessage(error));
        }
      })
      .finally(() => {
        if (requestId === historyRequestId.current) {
          setIsLoadingHistory(false);
        }
      });

    return () => {
      if (requestId === historyRequestId.current) {
        historyRequestId.current += 1;
      }
    };
  }, [activePersonId, historyRefresh]);

  function handlePersonChange(personId: string) {
    setSelectedPersonId(personId);
    setVisits([]);
    setHistoryError(null);
    setIsLoadingHistory(true);
  }

  function handleBack() {
    if (activePersonId) setSelectedPersonId(activePersonId);
    setIsPublishing(false);
    setUnsupportedDestination(null);
    setAddressDraft({ entryId: "", value: "" });
    back();
  }

  function handleForward() {
    if (activePersonId) setSelectedPersonId(activePersonId);
    setIsPublishing(false);
    setUnsupportedDestination(null);
    setAddressDraft({ entryId: "", value: "" });
    forward();
  }

  useEffect(() => {
    if (!isRestored) return;
    let active = true;

    if (!isPageEntry || !pageAddress) {
      void Promise.resolve().then(() => {
        if (!active) return;
        setPageLoad({
          requestKey: pageRequestKey,
          site: null,
          error: null,
        });
        markPageReady(entryId);
      });
      return () => {
        active = false;
      };
    }

    void api
      .getSite(pageAddress)
      .then((site) => {
        if (!active) return;
        setPageLoad({ requestKey: pageRequestKey, site, error: null });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setPageLoad({
          requestKey: pageRequestKey,
          site: null,
          error:
            error instanceof ApiError && error.status === 404
              ? `There isn't a stored page at ${pageAddress}.`
              : getErrorMessage(error),
        });
      })
      .finally(() => {
        if (!active) return;
        markPageReady(entryId);
      });

    return () => {
      active = false;
    };
  }, [
    isRestored,
    markPageReady,
    entryId,
    isPageEntry,
    pageAddress,
    pageRequestKey,
  ]);

  useEffect(() => {
    if (
      !arrival ||
      arrival.entryId !== entryId ||
      arrival.address !== pageAddress ||
      !pageLoadIsCurrent ||
      recordedArrivalIds.current.has(arrival.id)
    ) {
      return;
    }

    recordedArrivalIds.current.add(arrival.id);
    setVisitError(null);
    void api
      .createVisit({
        personId: arrival.personId,
        address: arrival.address,
        title: currentSite?.title ?? "Unavailable page",
        source: arrival.source,
      })
      .then(() => setHistoryRefresh((version) => version + 1))
      .catch((error: unknown) => setVisitError(getErrorMessage(error)));
  }, [
    arrival,
    currentSite,
    entryId,
    pageAddress,
    pageLoadIsCurrent,
  ]);

  useEffect(() => {
    if (!isRestored || !searchEntryId || !searchStatus) return;
    if (searchStatus === "idle") {
      markPageReady(searchEntryId);
      return;
    }
    if (searchStatus !== "pending") {
      markPageReady(searchEntryId);
      return;
    }
    if (!searchQuery.trim()) {
      completeSearch(searchEntryId, searchQuery, []);
      return;
    }

    const controller = new AbortController();
    let active = true;
    void api
      .searchSites(searchQuery.trim(), controller.signal)
      .then((results) => {
        if (!active) return;
        completeSearch(searchEntryId, searchQuery, results);
        markPageReady(searchEntryId);
      })
      .catch((error: unknown) => {
        if (!active) return;
        failSearch(searchEntryId, searchQuery, getErrorMessage(error));
        markPageReady(searchEntryId);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    completeSearch,
    failSearch,
    isRestored,
    markPageReady,
    searchEntryId,
    searchQuery,
    searchStatus,
  ]);

  useEffect(() => {
    function handleFrameMessage(event: MessageEvent<unknown>) {
      if (
        event.source !== iframeRef.current?.contentWindow ||
        !currentSite
      ) {
        return;
      }

      if (isIframeScrollMessage(event.data)) {
        updateCurrentPosition(event.data.y);
        return;
      }

      if (!isIframeLinkMessage(event.data)) return;

      const resolution = resolveInternalLink(
        event.data.href,
        currentSite.address,
      );

      if (resolution.kind === "internal") {
        navigate(resolution.address, "link", event.data.scrollY);
        return;
      }

      setUnsupportedDestination(resolution.destination);
    }

    window.addEventListener("message", handleFrameMessage);
    return () => window.removeEventListener("message", handleFrameMessage);
  }, [currentSite, navigate, updateCurrentPosition]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitSearch(searchQuery.trim());
  }

  function selectView(nextView: View) {
    setAddressDraft({ entryId: "", value: "" });
    setUnsupportedDestination(null);
    if (nextView === "publish") {
      setIsPublishing(true);
      return;
    }

    setIsPublishing(false);
    if (nextView === "search") openSearch();
    else navigateToPage(null);
  }

  async function handlePublish(site: {
    address: string;
    title: string;
    html: string;
    authorId: string;
  }) {
    return api.publishSite(site);
  }

  function handlePublished(site: Site) {
    setSites((current) => [site, ...current.filter((item) => item._id !== site._id)]);
    navigate(site.address);
  }

  function handleHistorySelect(visit: Visit) {
    navigate(visit.address, "history");
  }

  function renderBrowse() {
    if (!isRestored) {
      return (
        <div className="rounded-2xl border border-stone-200 bg-white">
          <LoadingState label="Restoring browser session" />
        </div>
      );
    }

    if (isLoadingSite) {
      return (
        <div className="rounded-2xl border border-stone-200 bg-white">
          <LoadingState label="Opening page" />
        </div>
      );
    }

    if (siteError) {
      return (
        <StatusState
          action={
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
              onClick={retryPage}
              type="button"
            >
              <Icon className="size-4" name="refresh" />
              Try again
            </button>
          }
          icon={<Icon className="size-5" name="globe" />}
          message={siteError}
          title={
            siteError.startsWith("There isn't")
              ? "This page isn't here"
              : "Page couldn't be loaded"
          }
          tone={siteError.startsWith("There isn't") ? "default" : "error"}
        />
      );
    }

    if (unsupportedDestination !== null) {
      return (
        <StatusState
          icon={<Icon className="size-5" name="external" />}
          message={
            unsupportedDestination
              ? `“${unsupportedDestination}” isn't a stored Small Web address. External and unsafe destinations stay closed.`
              : "This link doesn't point to a supported stored address. External and unsafe destinations stay closed."
          }
          title="Destination not supported"
        />
      );
    }

    if (currentSite) {
      return (
        <PageDisplay
          frameScrollY={frameScrollY}
          iframeRef={iframeRef}
          site={currentSite}
        />
      );
    }

    if (isLoadingSites) {
      return (
        <div className="rounded-2xl border border-stone-200 bg-white">
          <LoadingState label="Gathering pages" />
        </div>
      );
    }

    if (sitesError) {
      return (
        <StatusState
          action={
            <button
              className="text-sm font-semibold text-emerald-800"
              onClick={() => void loadSites()}
              type="button"
            >
              Try again
            </button>
          }
          message={sitesError}
          title="The small web couldn't load"
          tone="error"
        />
      );
    }

    return (
      <section>
        <div className="mb-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
            A quieter corner of the internet
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            A little web, full of life.
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
            Small, thoughtful pages made by people nearby. Pick a place to begin.
          </p>
        </div>
        {sites.length === 0 ? (
          <StatusState
            action={
              <button
                className="text-sm font-semibold text-emerald-800"
                onClick={() => setIsPublishing(true)}
                type="button"
              >
                Publish the first page
              </button>
            }
            icon={<Icon className="size-5" name="globe" />}
            message="There are no pages yet. You can be the first to add one."
            title="A blank page awaits"
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sites.map((site, index) => (
              <button
                className="group min-h-40 rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                key={site._id}
                onClick={() => navigate(site.address, "typed")}
                type="button"
              >
                <span className="flex items-center justify-between">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    <Icon className="size-[18px]" name={index % 2 ? "leaf" : "globe"} />
                  </span>
                  <Icon
                    className="size-4 text-stone-300 group-hover:text-emerald-800"
                    name="external"
                  />
                </span>
                <span className="mt-5 block text-base font-semibold text-stone-900">
                  {site.title}
                </span>
                <span className="mt-1 block font-mono text-[11px] text-stone-400">
                  {site.address}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    );
  }

  const historyPanelError =
    historyError && historyError.includes("404")
      ? "No browsing history is available for this person yet."
      : historyError;
  const activePersonName =
    people.find((person) => person._id === selectedPersonId)?.name ?? "your";

  return (
    <div className="flex min-h-screen bg-[#f7f7f4] text-stone-900">
      <aside className="hidden w-[228px] shrink-0 flex-col border-r border-stone-200/80 bg-[#fbfbf9] px-4 py-5 lg:flex">
        <button
          className="flex items-center gap-3 px-2 text-left"
          disabled={!isRestored}
          onClick={() => selectView("browse")}
          type="button"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-900 text-white">
            <Icon className="size-5" name="leaf" />
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-stone-900">
              small web
            </span>
            <span className="block text-[10px] text-stone-400">
              a place to wander
            </span>
          </span>
        </button>

        <nav aria-label="Main navigation" className="mt-10 space-y-1">
          {navigation.map((item) => (
            <button
              aria-current={view === item.id ? "page" : undefined}
              className={`flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium ${
                view === item.id
                  ? "bg-emerald-50 text-emerald-950"
                  : "text-stone-500 hover:bg-stone-100 hover:text-stone-900"
              }`}
              disabled={!isRestored}
              key={item.id}
              onClick={() => selectView(item.id)}
              type="button"
            >
              <Icon className="size-[17px]" name={item.icon} />
              {item.label}
              {view === item.id && (
                <span className="ml-auto size-1.5 rounded-full bg-emerald-700" />
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-xl border border-stone-200 bg-white p-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold text-stone-700">A small promise</p>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-stone-500">
            No ads, tracking, or outside pages. Just what people have made here.
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-[#fbfbf9]/95 px-3 py-3 backdrop-blur sm:px-5 lg:px-8">
          <div className="mx-auto flex max-w-[1500px] items-center gap-2 sm:gap-4">
            <div className="flex shrink-0 items-center gap-1 lg:hidden">
              <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-900 text-white">
                <Icon className="size-4" name="leaf" />
              </span>
              <span className="hidden text-sm font-bold sm:block">small web</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                aria-label="Go back"
                className="flex size-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                disabled={!isRestored || browserState.index === 0}
                onClick={() => {
                  setIsPublishing(false);
                  setUnsupportedDestination(null);
                  setAddressDraft({ entryId: "", value: "" });
                  handleBack();
                }}
                title="Go back"
                type="button"
              >
                <Icon className="size-[18px]" name="arrow-left" />
              </button>
              <button
                aria-label="Go forward"
                className="flex size-9 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                disabled={
                  !isRestored ||
                  browserState.index >= browserState.entries.length - 1
                }
                onClick={() => {
                  setIsPublishing(false);
                  setUnsupportedDestination(null);
                  setAddressDraft({ entryId: "", value: "" });
                  handleForward();
                }}
                title="Go forward"
                type="button"
              >
                <Icon className="size-[18px]" name="arrow-right" />
              </button>
            </div>
            <AddressBar
              address={address}
              isLoading={isLoadingSite || !isRestored}
              onAddressChange={(value) =>
                setAddressDraft({ entryId, value })
              }
              onSubmit={(targetAddress) => {
                navigate(targetAddress, "typed");
              }}
            />
            <div className="hidden items-center gap-2 xl:flex">
              <span className="text-xs text-stone-400">Browsing as</span>
              <PersonSelect
                isLoading={isLoadingPeople || !isRestored}
                onChange={handlePersonChange}
                people={people}
                selectedId={selectedPersonId}
              />
            </div>
          </div>
          <nav
            aria-label="Main navigation"
            className="mx-auto mt-3 flex max-w-[1500px] gap-1 lg:hidden"
          >
            {navigation.map((item) => (
              <button
                aria-current={view === item.id ? "page" : undefined}
                className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium ${
                  view === item.id
                    ? "bg-emerald-50 text-emerald-950"
                    : "text-stone-500"
                }`}
                disabled={!isRestored}
                key={item.id}
                onClick={() => selectView(item.id)}
                type="button"
              >
                <Icon className="size-3.5" name={item.icon} />
                {item.label}
              </button>
            ))}
            <div className="ml-auto xl:hidden">
              <PersonSelect
                isLoading={isLoadingPeople || !isRestored}
                onChange={handlePersonChange}
                people={people}
                selectedId={selectedPersonId}
              />
            </div>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_290px] 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0">
              {view === "browse" && renderBrowse()}
              {view === "search" && (
                <SearchPanel
                  error={
                    searchStatus === "error" && currentEntry.kind === "search"
                      ? currentEntry.searchError
                      : null
                  }
                  hasSearched={
                    searchStatus === "complete" || searchStatus === "error"
                  }
                  isLoading={searchStatus === "pending"}
                  onQueryChange={browser.updateSearchQuery}
                  onRetry={browser.retrySearch}
                  onSearch={handleSearch}
                  onSelect={(site) => {
                    navigate(site.address, "search");
                  }}
                  query={searchQuery}
                  results={
                    currentEntry.kind === "search" ? currentEntry.results : []
                  }
                />
              )}
              {view === "publish" && (
                <PublishPanel
                  onPublish={handlePublish}
                  onPublished={handlePublished}
                  people={people}
                />
              )}
            </div>

            <aside className="space-y-8 border-t border-stone-200 pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0 2xl:pl-8">
              <HistoryPanel
                error={historyPanelError}
                isLoading={isLoadingHistory}
                onRetry={() => void loadHistory(activePersonId)}
                onSelect={handleHistorySelect}
                visits={visits}
              />
              {visitError && (
                <p className="text-xs text-rose-700" role="alert">
                  This visit couldn&apos;t be saved: {visitError}
                </p>
              )}
              <div className="rounded-xl bg-[#eeefe9] p-4">
                <p className="text-xs font-semibold text-stone-700">
                  A note for {activePersonName.split(" ")[0]}
                </p>
                <p className="mt-1.5 text-xs leading-5 text-stone-500">
                  Your recent visits stay with the person you choose.
                </p>
              </div>
            </aside>
          </div>
          {peopleError && (
            <div
              className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-800"
              role="alert"
            >
              <span>Person list unavailable: {peopleError}</span>
              <button
                className="font-semibold underline underline-offset-2"
                onClick={() => void loadPeople()}
                type="button"
              >
                Retry
              </button>
            </div>
          )}
          {sessionError && (
            <p className="mt-4 text-xs text-rose-700" role="alert">
              This browser session couldn&apos;t be saved: {sessionError}
            </p>
          )}
          <footer className="mt-12 flex flex-wrap items-center justify-between gap-2 border-t border-stone-200 pt-4 text-[11px] text-stone-400">
            <span>Small Web · made for wandering</span>
            <span>Only pages stored here are available to explore.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
