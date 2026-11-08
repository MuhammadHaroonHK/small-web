"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Person, Site } from "@/types/api";
import { Icon } from "@/components/ui/icon";
import { ApiError } from "@/lib/api-client";

const INTERNAL_ADDRESS_PATTERN =
  /^smallweb:\/\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

type PublishPanelProps = {
  people: Person[];
  onPublish: (site: {
    address: string;
    title: string;
    html: string;
    authorId: string;
  }) => Promise<Site>;
  onPublished: (site: Site) => void;
};

export function PublishPanel({
  people,
  onPublish,
  onPublished,
}: PublishPanelProps) {
  const [address, setAddress] = useState("smallweb://");
  const [title, setTitle] = useState("");
  const [html, setHtml] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [publishedSite, setPublishedSite] = useState<Site | null>(null);

  function clearFeedback() {
    setError(null);
    setSuccess(null);
    setPublishedSite(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    const normalizedAddress = address.trim().toLowerCase();
    const normalizedTitle = title.trim();
    const normalizedHtml = html.trim();
    if (!INTERNAL_ADDRESS_PATTERN.test(normalizedAddress)) {
      setError(
        "Use an address like smallweb://my-little-page with lowercase letters, numbers, and hyphens.",
      );
      return;
    }
    if (!normalizedTitle || !normalizedHtml || !authorId) {
      setError("Choose an author and complete every field before publishing.");
      return;
    }

    setIsSubmitting(true);

    void onPublish({
      address: normalizedAddress,
      title: normalizedTitle,
      html: normalizedHtml,
      authorId,
    })
      .then((site) => {
        setSuccess(`${site.title} is now part of the small web.`);
        setPublishedSite(site);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof ApiError && cause.status === 409
            ? "That address has already been published. Choose a different address."
            : cause instanceof Error
            ? cause.message
            : "Your page couldn't be published. Please try again.",
        );
      })
      .finally(() => setIsSubmitting(false));
  }

  return (
    <section className="max-w-3xl">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-800">
        Make something small
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
        Publish a little corner.
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-stone-500">
        A page, an idea, a useful note. Add it to the small web for others to
        find.
      </p>

      <form
        className="mt-7 space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-7"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Page address
          </span>
          <input
            className="h-11 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 font-mono text-sm text-stone-800 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-900/5"
            maxLength={200}
            onChange={(event) => {
              clearFeedback();
              setAddress(event.target.value);
            }}
            pattern="smallweb://[a-z0-9]+(-[a-z0-9]+)*(\/[a-z0-9]+(-[a-z0-9]+)*)*"
            placeholder="smallweb://my-little-page"
            required
            title="Use smallweb:// followed by lowercase letters, numbers, and hyphens."
            value={address}
          />
          <span className="mt-1.5 block text-xs text-stone-400">
            Use lowercase letters, numbers and hyphens.
          </span>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Page title
          </span>
          <input
            className="h-11 w-full rounded-lg border border-stone-200 px-3 text-sm text-stone-800 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-900/5"
            maxLength={200}
            onChange={(event) => {
              clearFeedback();
              setTitle(event.target.value);
            }}
            placeholder="A short, clear title"
            required
            value={title}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Your name
          </span>
          <select
            className="h-11 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-900/5"
            onChange={(event) => {
              clearFeedback();
              setAuthorId(event.target.value);
            }}
            required
            value={authorId}
          >
            <option value="">Choose a person</option>
            {people.map((person) => (
              <option key={person._id} value={person._id}>
                {person.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">
            Page content
          </span>
          <textarea
            className="min-h-52 w-full resize-y rounded-lg border border-stone-200 px-3 py-3 font-mono text-xs leading-6 text-stone-700 outline-none focus:border-emerald-700 focus:ring-4 focus:ring-emerald-900/5"
            maxLength={100000}
            onChange={(event) => {
              clearFeedback();
              setHtml(event.target.value);
            }}
            placeholder={"<h1>A small idea</h1>\n<p>Tell us about it...</p>"}
            required
            value={html}
          />
          <span className="mt-1.5 block text-xs text-stone-400">
            Unsafe HTML is removed before your page is stored.
          </span>
        </label>
        {error && (
          <p
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </p>
        )}
        {success && (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5"
            role="status"
          >
            <p className="text-sm text-emerald-900">{success}</p>
            {publishedSite && (
              <button
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 hover:text-emerald-700"
                onClick={() => onPublished(publishedSite)}
                type="button"
              >
                Open published page
                <Icon className="size-4" name="arrow-right" />
              </button>
            )}
          </div>
        )}
        {people.length === 0 && (
          <p className="text-sm text-stone-500">
            No people are available to select as an author yet.
          </p>
        )}
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || people.length === 0}
          type="submit"
        >
          <Icon className="size-4" name="send" />
          {isSubmitting ? "Publishing…" : "Publish page"}
        </button>
      </form>
    </section>
  );
}
