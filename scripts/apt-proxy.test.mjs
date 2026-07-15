import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/apt/[[path]].js";

test("serves an APT object from the bound R2 bucket", async () => {
  let requestedKey;
  const response = await onRequest({
    request: new Request("https://printbridge.pages.dev/apt/pool/main/package.deb"),
    params: { path: ["pool", "main", "package.deb"] },
    env: {
      PACKAGES: {
        async get(key) {
          requestedKey = key;
          return createObject("deb-content", '"deb-etag"');
        },
      },
    },
  });

  assert.equal(requestedKey, "pool/main/package.deb");
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "deb-content");
  assert.equal(response.headers.get("content-type"), "application/vnd.debian.binary-package");
  assert.equal(response.headers.get("etag"), '"deb-etag"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
});

test("serves mutable repository metadata with a short cache lifetime", async () => {
  const response = await onRequest({
    request: new Request("https://printbridge.pages.dev/apt/dists/stable/InRelease"),
    params: { path: ["dists", "stable", "InRelease"] },
    env: { PACKAGES: { get: async () => createObject("signed-release") } },
  });

  assert.equal(response.headers.get("content-type"), "text/plain; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300");
});

test("supports HEAD and missing objects", async () => {
  const headResponse = await onRequest({
    request: new Request("https://printbridge.pages.dev/apt/printbridge-archive-keyring.gpg", {
      method: "HEAD",
    }),
    params: { path: "printbridge-archive-keyring.gpg" },
    env: { PACKAGES: { get: async () => createObject("public-key") } },
  });
  const missingResponse = await onRequest({
    request: new Request("https://printbridge.pages.dev/apt/missing"),
    params: { path: "missing" },
    env: { PACKAGES: { get: async () => null } },
  });

  assert.equal(headResponse.status, 200);
  assert.equal(await headResponse.text(), "");
  assert.equal(missingResponse.status, 404);
});

function createObject(body, httpEtag = '"etag"') {
  return {
    body,
    httpEtag,
    writeHttpMetadata(headers) {
      headers.set("content-language", "en");
    },
  };
}
