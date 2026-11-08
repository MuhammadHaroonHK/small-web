"use client";

import type { FormEvent } from "react";
import { Icon } from "@/components/ui/icon";

type AddressBarProps = {
  address: string;
  isLoading: boolean;
  onAddressChange: (address: string) => void;
  onSubmit: (address: string) => void;
};

export function AddressBar({
  address,
  isLoading,
  onAddressChange,
  onSubmit,
}: AddressBarProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const target = address.trim();
    if (target) onSubmit(target);
  }

  return (
    <form
      className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 shadow-sm focus-within:border-emerald-700"
      onSubmit={handleSubmit}
    >
      <Icon className="size-4 shrink-0 text-stone-400" name="globe" />
      <label className="sr-only" htmlFor="address-bar">
        Site address
      </label>
      <input
        autoCapitalize="none"
        autoComplete="url"
        className="min-w-0 flex-1 bg-transparent font-mono text-xs text-stone-700 outline-none placeholder:text-stone-400 sm:text-sm"
        id="address-bar"
        maxLength={2048}
        onChange={(event) => onAddressChange(event.target.value)}
        placeholder="Enter a smallweb:// address"
        spellCheck={false}
        value={address}
      />
      <button
        aria-label="Open address"
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-stone-400 hover:bg-stone-100 hover:text-stone-800 disabled:cursor-wait disabled:opacity-50"
        disabled={isLoading || !address.trim()}
        type="submit"
      >
        {isLoading ? (
          <span className="size-4 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-700" />
        ) : (
          <Icon className="size-4" name="arrow-right" />
        )}
      </button>
    </form>
  );
}
