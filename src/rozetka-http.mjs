const DEFAULT_BASE_URL = "https://api-seller.rozetka.com.ua";
const DEFAULT_REQUEST_TIMEOUT_MS = 20000;

main().catch((error) => {
  const payload = {
    message: error.message || "Rozetka request failed.",
    status: error.status || null,
    endpoint: error.endpoint || null,
    details: error.details || null
  };
  writeBase64Json(process.stderr, payload);
  process.exit(1);
});

async function main() {
  const encoded = process.argv[2];
  if (!encoded) {
    throw new Error("Missing request payload.");
  }

  const payload = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  if (payload.kind === "image") {
    const result = await fetchImage(payload.url);
    writeBase64Json(process.stdout, result);
    return;
  }

  const result = await rozetkaRequest(payload.method || "GET", payload.path, {
    queryString: payload.queryString || "",
    body: payload.body,
    auth: payload.auth !== false
  });
  writeBase64Json(process.stdout, result);
}

async function rozetkaRequest(method, endpoint, { queryString = "", body, auth = true } = {}) {
  if (!endpoint || !endpoint.startsWith("/")) {
    throw new Error("Rozetka endpoint must start with /.");
  }

  const baseUrl = (env("ROZETKA_API_BASE_URL") || DEFAULT_BASE_URL).replace(/\/+$/, "");
  const language = env("ROZETKA_CONTENT_LANGUAGE") || "uk";
  const url = new URL(`${baseUrl}${endpoint}`);
  for (const [key, value] of new URLSearchParams(queryString)) {
    if (value !== "") {
      url.searchParams.append(key, value);
    }
  }

  const headers = {
    Accept: "application/json",
    "Content-Language": language
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    headers.Authorization = await authorizationHeader();
  }

  const response = await fetchWithTimeout(url, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  }, endpoint);

  const responsePayload = await parseJson(response);
  if (!response.ok || responsePayload?.success === false) {
    const error = new Error("Rozetka API request failed.");
    error.status = response.status;
    error.endpoint = endpoint;
    error.details = responsePayload;
    throw error;
  }

  return responsePayload;
}

async function authorizationHeader() {
  const token = env("ROZETKA_API_TOKEN") || await authenticate();
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
}

async function authenticate() {
  const username = env("ROZETKA_USERNAME");
  const password = env("ROZETKA_PASSWORD");
  if (!username || !password) {
    throw new Error("Rozetka credentials are missing. Set ROZETKA_API_TOKEN or ROZETKA_USERNAME and ROZETKA_PASSWORD.");
  }

  const response = await rozetkaRequest("POST", "/sites", {
    auth: false,
    body: {
      username,
      password: Buffer.from(password, "utf8").toString("base64")
    }
  });

  const accessToken = response?.content?.access_token;
  if (!accessToken) {
    const error = new Error("Rozetka login response did not include access_token.");
    error.endpoint = "/sites";
    error.details = response;
    throw error;
  }

  return accessToken;
}

async function parseJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fetchImage(imageUrl) {
  if (!imageUrl) {
    throw new Error("Missing image URL.");
  }

  const url = new URL(imageUrl);
  const hostname = url.hostname.toLowerCase();
  if (!["http:", "https:"].includes(url.protocol) || !hostname.includes("rozetka")) {
    throw new Error("Only Rozetka image URLs are allowed.");
  }

  const response = await fetchWithTimeout(url, {
    headers: {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      "User-Agent": "Mozilla/5.0 CRM Rozetka Image Proxy"
    }
  }, imageUrl);
  if (!response.ok) {
    const error = new Error(`Image request failed with HTTP ${response.status}.`);
    error.status = response.status;
    error.endpoint = imageUrl;
    throw error;
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  return {
    contentType: response.headers.get("content-type") || "image/jpeg",
    data: bytes.toString("base64")
  };
}

function env(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : "";
}

async function fetchWithTimeout(url, options = {}, endpoint = "") {
  const timeoutMs = Number(env("ROZETKA_REQUEST_TIMEOUT_MS")) || DEFAULT_REQUEST_TIMEOUT_MS;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error(`Rozetka API request timed out after ${timeoutMs} ms.`);
      timeoutError.endpoint = endpoint || String(url);
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function writeBase64Json(stream, payload) {
  stream.write(Buffer.from(JSON.stringify(payload), "utf8").toString("base64"));
}
