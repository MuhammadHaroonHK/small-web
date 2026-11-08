"use client";

import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Icon } from "@/components/ui/icon";
import { LoadingState, StatusState } from "@/components/ui/status-state";
import { HistoryPanel } from "@/features/history/components/history-panel";
import { PersonSelect } from "@/features/people/components/person-select";
import { PublishPanel } from "@/features/publish/components/publish-panel";
import { SearchPanel } from "@/features/search/components/search-panel";
import { ApiError, api } from "@/lib/api-client";
import type { Person, Site, Visit } from "@/types/api";

type View = "browse" | "search" | "publish";

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
  const [view, setView] = useState<View>("browse");
  const [people, setPeople] = useState<Person[]>([]);
  const [peopleError, setPeopleError] = useState<string | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [currentSite, setCurrentSite] = useState<Site | null>(null);
  const [address, setAddress] = useState("");
  const [isLoadingSites, setIsLoadingSites] = useState(true);
  const [isLoadingSite, setIsLoadingSite] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [sitesError, setSitesError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Site[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const activePersonId = selectedPersonId || people[0]?._id || "";

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

  const loadHistory = useCallback(async (personId: string) => {
    if (!personId) {
      setVisits([]);
      return;
    }

    setIsLoadingHistory(true);
    setHistoryError(null);
    try {
      setVisits(await api.getVisits(personId));
    } catch (error) {
      setHistoryError(getErrorMessage(error));
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.allSettled([api.getPeople(), api.getSites()]).then(
      ([peopleResult, sitesResult]) => {
        if (!active) return;
        if (peopleResult.status === "fulfilled") {
          setPeople(peopleResult.value);
        } else {
          setPeopleError(getErrorMessage(peopleResult.reason));
        }
        if (sitesResult.status === "fulfilled") {
          setSites(sitesResult.value);
        } else {
          setSitesError(getErrorMessage(sitesResult.reason));
        }
        if (
          peopleResult.status === "rejected" ||
          (peopleResult.status === "fulfilled" &&
            peopleResult.value.length === 0)
        ) {
          setIsLoadingHistory(false);
        }
        setIsLoadingSites(false);
      },
    );

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!activePersonId) return;
    let active = true;
    void api
      .getVisits(activePersonId)
      .then((history) => {
        if (active) setVisits(history);
      })
      .catch((error: unknown) => {
        if (active) setHistoryError(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setIsLoadingHistory(false);
      });

    return () => {
      active = false;
    };
  }, [activePersonId]);

  function handlePersonChange(personId: string) {
    setSelectedPersonId(personId);
    setHistoryError(null);
    setIsLoadingHistory(true);
  }

  const openSite = useCallback(async (siteOrAddress: Site | string) => {
    const targetAddress =
      typeof siteOrAddress === "string" ? siteOrAddress : siteOrAddress.address;
    setAddress(targetAddress);
    setIsLoadingSite(true);
    setSiteError(null);
    setView("browse");

    try {
      const site =
        typeof siteOrAddress === "string"
          ? await api.getSite(targetAddress)
          : siteOrAddress.textContent
            ? siteOrAddress
            : await api.getSite(targetAddress);
      setCurrentSite(site);
    } catch (error) {
      setCurrentSite(null);
      setSiteError(
        error instanceof ApiError && error.status === 404
          ? `There isn't a stored page at ${targetAddress}.`
          : getErrorMessage(error),
      );
    } finally {
      setIsLoadingSite(false);
    }
  }, []);

  async function handleAddressSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (address.trim()) await openSite(address);
  }

  async function runSearch() {
    if (!query.trim()) {
      setResults([]);
      setHasSearched(true);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      setResults(await api.searchSites(query.trim()));
    } catch (error) {
      setSearchError(getErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void runSearch();
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
    setCurrentSite(site);
    setAddress(site.address);
    setView("browse");
  }

  function handleHistorySelect(visit: Visit) {
    void openSite(visit.address);
  }

  function renderBrowse() {
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
              onClick={() => void openSite(address)}
              type="button"
            >
              <Icon className="size-4" name="refresh" />
              Try again
            </button>
          }
          icon={<Icon className="size-5" name="globe" />}
          message={siteError}
          title="This page isn't here"
          tone={siteError.startsWith("There isn't") ? "default" : "error"}
        />
      );
    }

    if (currentSite) {
      return (
        <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-100 px-6 py-7 sm:px-9 sm:py-9">
            <p className="font-mono text-xs text-emerald-800">
              {currentSite.address}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              {currentSite.title}
            </h1>
          </div>
          <div className="max-w-3xl px-6 py-7 sm:px-9 sm:py-9">
            <p className="whitespace-pre-line text-base leading-8 text-stone-600">
              {currentSite.textContent ||
                "Page content is ready. Rich page rendering will be added with browser navigation."}
            </p>
            <p className="mt-8 border-t border-stone-100 pt-4 text-xs text-stone-400">
              Small Web keeps every page inside this collection. The wider
              internet is not fetched here.
            </p>
          </div>
        </article>
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
                onClick={() => setView("publish")}
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
                onClick={() => void openSite(site)}
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
          onClick={() => {
            setView("browse");
            setCurrentSite(null);
            setSiteError(null);
          }}
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
              key={item.id}
              onClick={() => setView(item.id)}
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
            <div className="hidden items-center gap-1 sm:flex">
              <button
                aria-label="Go back"
                className="flex size-9 items-center justify-center rounded-lg text-stone-300"
                disabled
                title="Browser navigation will be available soon"
                type="button"
              >
                <Icon className="size-[18px]" name="arrow-left" />
              </button>
              <button
                aria-label="Go forward"
                className="flex size-9 items-center justify-center rounded-lg text-stone-300"
                disabled
                title="Browser navigation will be available soon"
                type="button"
              >
                <Icon className="size-[18px]" name="arrow-right" />
              </button>
            </div>
            <form
              className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 shadow-sm focus-within:border-emerald-700"
              onSubmit={handleAddressSubmit}
            >
              <Icon className="size-4 shrink-0 text-stone-400" name="globe" />
              <label className="sr-only" htmlFor="address-bar">
                Site address
              </label>
              <input
                className="min-w-0 flex-1 bg-transparent font-mono text-xs text-stone-700 outline-none placeholder:text-stone-400 sm:text-sm"
                id="address-bar"
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Enter a smallweb:// address"
                value={address}
              />
              <button
                aria-label="Open address"
                className="flex size-7 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-800"
                type="submit"
              >
                <Icon className="size-4" name="arrow-right" />
              </button>
            </form>
            <div className="hidden items-center gap-2 xl:flex">
              <span className="text-xs text-stone-400">Browsing as</span>
              <PersonSelect
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
                key={item.id}
                onClick={() => setView(item.id)}
                type="button"
              >
                <Icon className="size-3.5" name={item.icon} />
                {item.label}
              </button>
            ))}
            <div className="ml-auto xl:hidden">
              <PersonSelect
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
                  error={searchError}
                  hasSearched={hasSearched}
                  isLoading={isSearching}
                  onQueryChange={setQuery}
                  onRetry={() => void runSearch()}
                  onSearch={handleSearch}
                  onSelect={(site) => void openSite(site)}
                  query={query}
                  results={results}
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
            <p className="mt-4 text-xs text-rose-700" role="status">
              Person list unavailable: {peopleError}
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
