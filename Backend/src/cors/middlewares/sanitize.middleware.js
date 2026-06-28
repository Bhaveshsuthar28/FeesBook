const EXCLUDED_KEYS = new Set(["password", "token", "signature"]);

function isExcluded(key) {
  if (!key) return false;
  const lowerKey = key.toLowerCase();
  return (
    EXCLUDED_KEYS.has(lowerKey) ||
    lowerKey.includes("webhook") ||
    lowerKey.includes("clerk")
  );
}

function sanitizeValue(val, key) {
  if (typeof val === "string") {
    if (isExcluded(key)) return val;
    return val.replace(/<[^>]*>/g, "").trim();
  }
  if (val && typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map((item) => sanitizeValue(item, key));
    }
    const newObj = {};
    for (const [k, v] of Object.entries(val)) {
      newObj[k] = sanitizeValue(v, k);
    }
    return newObj;
  }
  return val;
}

export default async function sanitizeBody(request, reply) {
  if (reply.sent) return;
  const contentType = request.headers["content-type"] || "";
  if (!contentType.includes("application/json")) return;
  if (!request.body) return;

  request.body = sanitizeValue(request.body);
}

function sanitizeStrictValue(val, key) {
  if (typeof val === "string") {
    if (isExcluded(key)) return val;
    let sanitized = val.replace(/<[^>]*>/g, "").trim();
    sanitized = sanitized.replace(/\s+/g, " ");
    if (key && key.toLowerCase().includes("name")) {
      sanitized = sanitized.slice(0, 1000);
    }
    return sanitized;
  }
  if (val && typeof val === "object") {
    if (Array.isArray(val)) {
      return val.map((item) => sanitizeStrictValue(item, key));
    }
    const newObj = {};
    for (const [k, v] of Object.entries(val)) {
      newObj[k] = sanitizeStrictValue(v, k);
    }
    return newObj;
  }
  return val;
}

export async function sanitizeStrict(request, reply) {
  if (reply.sent) return;
  const contentType = request.headers["content-type"] || "";
  if (!contentType.includes("application/json")) return;
  if (!request.body) return;

  request.body = sanitizeStrictValue(request.body);
}
