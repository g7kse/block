#!/usr/bin/env node
/* =========================================================================
   server.js — zero-dependency static file server for the Snap package.
   Serves the app on http://127.0.0.1:<port> and opens the default browser.
   All data still lives in the browser's IndexedDB on this machine; this
   server only serves static files, nothing is sent over the network.
   ========================================================================= */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const PORT = process.env.PORT ? Number(process.env.PORT) : 8743;
const HOST = "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const resolved = path.normalize(path.join(root, decoded));
  if (!resolved.startsWith(root)) return null; // block path traversal
  return resolved;
}

const server = http.createServer((req, res) => {
  let filePath = safeJoin(ROOT, req.url === "/" ? "/index.html" : req.url);
  if (!filePath) { res.writeHead(400); return res.end("Bad request"); }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // fall back to index.html for bare paths, otherwise 404
      filePath = path.join(ROOT, "index.html");
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/`;
  console.log(`Blade & Block running at ${url}`);

  const openCmd = process.platform === "darwin" ? "open"
    : process.platform === "win32" ? "start"
    : "xdg-open";
  exec(`${openCmd} ${url}`, () => {});
});
