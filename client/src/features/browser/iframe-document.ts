const LINK_BRIDGE_SCRIPT =
  'function sendScroll(){window.parent.postMessage({type:"small-web:scroll",y:window.scrollY},"*")}window.addEventListener("scroll",sendScroll,{passive:true});window.addEventListener("message",function(event){var data=event.data;if(event.source!==window.parent||!data||typeof data!=="object"||Object.keys(data).length!==2||data.type!=="small-web:restore-scroll"||typeof data.y!=="number"||!Number.isFinite(data.y)||data.y<0||data.y>10000000)return;window.scrollTo(0,data.y)});document.addEventListener("click",function(event){var anchor=event.target instanceof Element?event.target.closest("a"):null;if(!anchor)return;event.preventDefault();event.stopImmediatePropagation();window.parent.postMessage({type:"small-web:link",href:anchor.getAttribute("href")||"",scrollY:window.scrollY},"*")},true);';

const LINK_BRIDGE_HASH =
  "sha256-8vX/YKrucOAy57AG2pEcMC9QRDt3cMKSS6eiJpZjbIA=";

export function createSandboxDocument(html: string): string {
  const policy = [
    "default-src 'none'",
    `script-src '${LINK_BRIDGE_HASH}'`,
    "style-src 'unsafe-inline'",
    "img-src 'none'",
    "font-src 'none'",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "frame-src 'none'",
    "media-src 'none'",
    "worker-src 'none'",
    "manifest-src 'none'",
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
  <body>
    <main>${html}</main>
    <script>${LINK_BRIDGE_SCRIPT}</script>
  </body>
</html>`;
}
