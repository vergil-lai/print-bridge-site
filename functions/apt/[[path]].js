export async function onRequest(context) {
  const method = context.request.method;
  if (method !== "GET" && method !== "HEAD") {
    return new Response(null, {
      status: 405,
      headers: { allow: "GET, HEAD" },
    });
  }

  const key = normalizePath(context.params.path);
  if (!key) return new Response("Not found", { status: 404 });

  const object = await context.env.PACKAGES.get(key);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set(
    "cache-control",
    isImmutable(key) ? "public, max-age=31536000, immutable" : "public, max-age=300",
  );

  if (!headers.has("content-type")) {
    headers.set("content-type", contentTypeFor(key));
  }

  return new Response(method === "HEAD" ? null : object.body, { headers });
}

function normalizePath(path) {
  const value = Array.isArray(path) ? path.join("/") : String(path ?? "");
  return value.replace(/^\/+/, "");
}

function isImmutable(key) {
  return key.startsWith("pool/") || key.includes("/by-hash/");
}

function contentTypeFor(key) {
  if (key.endsWith(".deb")) return "application/vnd.debian.binary-package";
  if (key.endsWith(".gz")) return "application/gzip";
  if (key.endsWith(".gpg") || key.endsWith(".asc")) return "application/pgp-keys";
  return "text/plain; charset=utf-8";
}
