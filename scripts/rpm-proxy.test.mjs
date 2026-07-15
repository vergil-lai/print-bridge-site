import assert from "node:assert/strict";
import test from "node:test";

import { onRequest } from "../functions/rpm/[[path]].js";

test("serves RPM repository objects from the rpm R2 prefix", async () => {
  let requestedKey;
  const response = await onRequest({
    request: new Request("https://printbridge.pages.dev/rpm/packages/PrintBridge.rpm"),
    params: { path: ["packages", "PrintBridge.rpm"] },
    env: {
      PACKAGES: {
        async get(key) {
          requestedKey = key;
          return createObject("rpm-content", '"rpm-etag"');
        },
      },
    },
  });

  assert.equal(requestedKey, "rpm/packages/PrintBridge.rpm");
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "rpm-content");
  assert.equal(response.headers.get("content-type"), "application/x-rpm");
  assert.equal(response.headers.get("etag"), '"rpm-etag"');
  assert.equal(response.headers.get("cache-control"), "public, max-age=31536000, immutable");
});

test("serves mutable repomd metadata with a short cache lifetime", async () => {
  const response = await onRequest({
    request: new Request("https://printbridge.pages.dev/rpm/repodata/repomd.xml"),
    params: { path: ["repodata", "repomd.xml"] },
    env: { PACKAGES: { get: async () => createObject("repository-metadata") } },
  });

  assert.equal(response.headers.get("content-type"), "application/xml; charset=utf-8");
  assert.equal(response.headers.get("cache-control"), "public, max-age=300");
});

test("supports repository signatures, HEAD, and missing objects", async () => {
  const signatureResponse = await onRequest({
    request: new Request("https://printbridge.pages.dev/rpm/repodata/repomd.xml.asc"),
    params: { path: ["repodata", "repomd.xml.asc"] },
    env: { PACKAGES: { get: async () => createObject("signature") } },
  });
  const headResponse = await onRequest({
    request: new Request("https://printbridge.pages.dev/rpm/RPM-GPG-KEY-printbridge", {
      method: "HEAD",
    }),
    params: { path: "RPM-GPG-KEY-printbridge" },
    env: { PACKAGES: { get: async () => createObject("public-key") } },
  });
  const missingResponse = await onRequest({
    request: new Request("https://printbridge.pages.dev/rpm/missing"),
    params: { path: "missing" },
    env: { PACKAGES: { get: async () => null } },
  });

  assert.equal(signatureResponse.headers.get("content-type"), "application/pgp-signature");
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
