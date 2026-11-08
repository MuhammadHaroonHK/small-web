import { Icon } from "@/components/ui/icon";
import { StatusState } from "@/components/ui/status-state";
import type { Site } from "@/types/api";

type PageDisplayProps = {
  site: Site;
};

function createSandboxDocument(html: string) {
  const policy = [
    "default-src 'none'",
    "img-src data:",
    "style-src 'unsafe-inline'",
    "font-src 'none'",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "media-src 'none'",
  ].join("; ");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Security-Policy" content="${policy}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; color: #292a25; }
      * { box-sizing: border-box; }
      body { max-width: 760px; margin: 0 auto; padding: 2rem 1.25rem 3rem; line-height: 1.75; overflow-wrap: anywhere; }
      h1, h2, h3, h4, h5, h6 { line-height: 1.25; color: #1c2821; }
      a { color: #17613d; }
      pre { max-width: 100%; overflow: auto; padding: 1rem; background: #f3f4f1; }
      blockquote { margin-left: 0; border-left: 3px solid #d5dfd6; padding-left: 1rem; color: #62675f; }
    </style>
  </head>
  <body>${html}</body>
</html>`;
}

export function PageDisplay({ site }: PageDisplayProps) {
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
        referrerPolicy="no-referrer"
        sandbox=""
        srcDoc={createSandboxDocument(site.html)}
        title={site.title}
      />
      <footer className="border-t border-stone-100 px-5 py-3 text-xs text-stone-400 sm:px-8">
        This page is isolated. Scripts, forms, and external requests are disabled.
      </footer>
    </article>
  );
}
