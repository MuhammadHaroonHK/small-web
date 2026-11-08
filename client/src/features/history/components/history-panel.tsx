"use client";

import { Icon } from "@/components/ui/icon";
import { LoadingState, StatusState } from "@/components/ui/status-state";
import type { Visit } from "@/types/api";

type HistoryPanelProps = {
  visits: Visit[];
  isLoading: boolean;
  error: string | null;
  onSelect: (visit: Visit) => void;
  onRetry: () => void;
};

function formatRelativeTime(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function HistoryPanel({
  visits,
  isLoading,
  error,
  onSelect,
  onRetry,
}: HistoryPanelProps) {
  return (
    <section aria-labelledby="history-heading" className="min-w-0">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
            Your trail
          </p>
          <h2
            className="mt-1 text-base font-semibold text-stone-900"
            id="history-heading"
          >
            Recent history
          </h2>
        </div>
        <span className="flex size-8 items-center justify-center rounded-lg bg-stone-100 text-stone-500">
          <Icon className="size-4" name="clock" />
        </span>
      </div>
      {isLoading ? (
        <LoadingState label="Loading history" />
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
          title="History is unavailable"
          tone="error"
        />
      ) : visits.length === 0 ? (
        <StatusState
          icon={<Icon className="size-5" name="clock" />}
          message="Pages you visit will find their way here."
          title="A fresh start"
        />
      ) : (
        <ol className="space-y-1">
          {visits.map((visit, index) => (
            <li className="relative" key={visit._id}>
              {index < visits.length - 1 && (
                <span className="absolute bottom-0 left-[15px] top-9 w-px bg-stone-200" />
              )}
              <button
                className="group relative flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left hover:bg-white"
                onClick={() => onSelect(visit)}
                type="button"
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500">
                  <Icon className="size-4" name="globe" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-stone-800 group-hover:text-emerald-900">
                    {visit.title}
                  </span>
                  <span className="mt-0.5 block truncate font-mono text-[11px] text-stone-400">
                    {visit.address}
                  </span>
                </span>
                <time className="shrink-0 pt-1 text-[10px] text-stone-400">
                  {formatRelativeTime(visit.visitedAt)}
                </time>
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
