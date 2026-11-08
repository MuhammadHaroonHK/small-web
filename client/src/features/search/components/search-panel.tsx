"use client";

import { Icon } from "@/components/ui/icon";
import { LoadingState, StatusState } from "@/components/ui/status-state";
import type { Site } from "@/types/api";

type SearchPanelProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  results: Site[];
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onSelect: (site: Site) => void;
  onRetry: () => void;
};

export function SearchPanel({
  query,
  onQueryChange,
  onSearch,
  results,
  isLoading,
  error,
  hasSearched,
  onSelect,
  onRetry,
}: SearchPanelProps) {
  return (
    <section>
      <div className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
          Find your next read
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Search the small web.
        </h1>
        <p className="mt-3 text-sm leading-6 text-stone-500">
          Look through the words and ideas shared across every stored page.
        </p>
        <form className="mt-7 flex gap-2" onSubmit={onSearch}>
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 shadow-sm focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-900/5">
            <Icon className="size-5 shrink-0 text-stone-400" name="search" />
            <span className="sr-only">Search pages</span>
            <input
              className="h-12 min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
              maxLength={100}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Try “community garden”"
              value={query}
            />
          </label>
          <button
            className="rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isLoading || !query.trim()}
            type="submit"
          >
            Search
          </button>
        </form>
      </div>
      <div className="mt-9">
        {isLoading ? (
          <LoadingState label="Searching pages" />
        ) : error ? (
          <StatusState
            action={
              <button
                className="text-sm font-semibold text-emerald-800 hover:text-emerald-950"
                onClick={onRetry}
                type="button"
              >
                Try again
              </button>
            }
            message={error}
            title="Search couldn't load"
            tone="error"
          />
        ) : !query.trim() ? (
          <StatusState
            icon={<Icon className="size-5" name="search" />}
            message="Enter a word or phrase to search page titles and body text."
            title="What are you looking for?"
          />
        ) : hasSearched && results.length === 0 ? (
          <StatusState
            icon={<Icon className="size-5" name="search" />}
            message={`No pages matched “${query.trim()}”. Try another word or phrase.`}
            title="No pages found"
          />
        ) : hasSearched ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-stone-400">
              {results.length} {results.length === 1 ? "page" : "pages"} found
            </p>
            {results.map((site) => (
              <button
                className="block w-full rounded-2xl border border-stone-200 bg-white p-5 text-left shadow-sm hover:border-emerald-200 hover:shadow-md"
                key={site._id}
                onClick={() => onSelect(site)}
                type="button"
              >
                <span className="font-mono text-xs text-emerald-800">
                  {site.address}
                </span>
                <span className="mt-1 block text-lg font-semibold text-stone-900">
                  {site.title}
                </span>
                {site.textContent?.trim() && (
                  <span className="mt-2 block text-sm leading-6 text-stone-500">
                    {site.textContent.trim().slice(0, 220)}
                    {site.textContent.trim().length > 220 ? "…" : ""}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-stone-200 bg-white/70 px-5 py-4 text-sm text-stone-500">
            Search across page titles and body text.
          </div>
        )}
      </div>
    </section>
  );
}
