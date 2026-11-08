import type { RefObject } from "react";
import { Icon } from "@/components/ui/icon";
import { StatusState } from "@/components/ui/status-state";
import { createSandboxDocument } from "@/features/browser/iframe-document";
import type { Site } from "@/types/api";

type PageDisplayProps = {
  site: Site;
  frameScrollY: number;
  iframeRef: RefObject<HTMLIFrameElement | null>;
};

export function PageDisplay({ site, frameScrollY, iframeRef }: PageDisplayProps) {
  if (!site.html) {
    return (
      <StatusState
        icon={<Icon className="size-5" name="globe" />}
        message="This stored page doesn't include any displayable HTML."
        title="Page content is unavailable"
        tone="error"
      />
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <header className="border-b border-stone-100 px-5 py-5 sm:px-8">
        <p className="font-mono text-xs text-emerald-800">{site.address}</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
          {site.title}
        </h1>
      </header>
      <iframe
        className="block min-h-[420px] w-full bg-white sm:min-h-[560px]"
        ref={iframeRef}
        referrerPolicy="no-referrer"
        sandbox="allow-scripts"
        srcDoc={createSandboxDocument(site.html)}
        title={site.title}
        onLoad={() => {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "small-web:restore-scroll", y: frameScrollY },
            "*",
          );
        }}
      />
      <footer className="border-t border-stone-100 px-5 py-3 text-xs text-stone-400 sm:px-8">
        This page is isolated. Publisher scripts, forms, and external requests
        are disabled.
      </footer>
    </article>
  );
}
