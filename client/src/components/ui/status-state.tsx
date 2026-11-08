import type { ReactNode } from "react";

type StatusStateProps = {
  title: string;
  message: string;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "error";
};

export function StatusState({
  title,
  message,
  icon,
  action,
  tone = "default",
}: StatusStateProps) {
  return (
    <div
      className={`flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center ${
        tone === "error"
          ? "border-rose-200 bg-rose-50/70"
          : "border-stone-200 bg-white/70"
      }`}
      role={tone === "error" ? "alert" : undefined}
    >
      {icon && (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-white text-stone-500 shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="font-semibold text-stone-900">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-stone-500">
        {message}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div
      className="flex min-h-40 items-center justify-center gap-3 text-sm text-stone-500"
      role="status"
    >
      <span className="size-4 animate-spin rounded-full border-2 border-stone-200 border-t-emerald-700" />
      {label}…
    </div>
  );
}
