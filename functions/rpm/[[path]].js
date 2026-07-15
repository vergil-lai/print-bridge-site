export async function onRequest(context) {
  const method = context.request.method;
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const path = normalizePath(context.params.path);
  if (!path) return new Response("Not found", { status: 404 });

  const object = await context.env.PACKAGES.get(`rpm/${path}`);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set(
    "cache-control",
    isImmutable(path) ? "public, max-age=31536000, immutable" : "public, max-age=300",
  );

  if (!headers.has("content-type")) {
    headers.set("content-type", contentTypeFor(path));
  }

  return new Response(method === "HEAD" ? null : object.body, { headers });
}

function normalizePath(path) {
  const value = Array.isArray(path) ? path.join("/") : String(path ?? "");
  return value.replace(/^\/+/, "");
}

function isImmutable(path) {
  if (path.startsWith("packages/")) return true;
  return (
    path.startsWith("repodata/") &&
    !path.endsWith("repomd.xml") &&
    !path.endsWith("repomd.xml.asc")
  );
}

function contentTypeFor(path) {
  if (path.endsWith(".rpm")) return "application/x-rpm";
  if (path.endsWith(".xml")) return "application/xml; charset=utf-8";
  if (path.endsWith(".gz")) return "application/gzip";
  if (path.endsWith(".bz2")) return "application/x-bzip2";
  if (path.endsWith(".zst")) return "application/zstd";
  if (path.endsWith(".asc")) return "application/pgp-signature";
  if (path.endsWith(".repo")) return "text/plain; charset=utf-8";
  if (path === "RPM-GPG-KEY-printbridge") return "application/pgp-keys";
  return "application/octet-stream";
}
