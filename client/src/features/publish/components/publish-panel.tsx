"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { Person, Site } from "@/types/api";
import { Icon } from "@/components/ui/icon";

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    void onPublish({ address, title, html, authorId })
      .then((site) => {
        setSuccess(`${site.title} is now part of the small web.`);
        setAddress("smallweb://");
        setTitle("");
        setHtml("");
        onPublished(site);
      })
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
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
            onChange={(event) => setAddress(event.target.value)}
            pattern="smallweb://[a-z0-9]+(-[a-z0-9]+)*"
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
            onChange={(event) => setTitle(event.target.value)}
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
            onChange={(event) => setAuthorId(event.target.value)}
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
            onChange={(event) => setHtml(event.target.value)}
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
          <p
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900"
            role="status"
          >
            {success}
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
