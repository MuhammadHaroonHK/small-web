"use client";

import type { Person } from "@/types/api";

type PersonSelectProps = {
  people: Person[];
  selectedId: string;
  onChange: (personId: string) => void;
};

export function PersonSelect({
  people,
  selectedId,
  onChange,
}: PersonSelectProps) {
  return (
    <label className="flex min-w-0 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 shadow-sm">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-800">
        {people.find((person) => person._id === selectedId)?.name
          .split(" ")
          .map((part) => part[0])
          .join("") ?? "—"}
      </span>
      <span className="sr-only">Browsing as</span>
      <select
        aria-label="Browsing as"
        className="min-w-0 bg-transparent text-sm font-medium text-stone-800 outline-none"
        disabled={people.length === 0}
        onChange={(event) => onChange(event.target.value)}
        value={selectedId}
      >
        {people.length === 0 && <option value="">No people available</option>}
        {people.map((person) => (
          <option key={person._id} value={person._id}>
            {person.name}
          </option>
        ))}
      </select>
    </label>
  );
}
