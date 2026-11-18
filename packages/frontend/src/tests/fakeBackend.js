import { vi } from "vitest";

const REPLY = Symbol("reply");

// A response with a status other than 200, e.g. reply(403, {...})
export function reply(status, body) {
  return { [REPLY]: true, status, body };
}

// What the navigation bar asks for on every page
const NAVBAR_ROUTES = {
  "GET /api/notifications/": [],
  "GET /api/messages/unread-count": { unread_count: 0 }
};

// Stands in for the FastAPI backend by replacing fetch. Each test lists
// the responses it needs, keyed by "METHOD /api/path". A value is sent
// back as-is with status 200. A function gets the request and returns a
// value or a reply(). Anything not listed gets a 404, which the page
// shows as an error.
//
// Returns the requests the page made, so a test can check what was sent.
export function fakeBackend(routes) {
  const requests = [];
  const allRoutes = { ...NAVBAR_ROUTES, ...routes };

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      const request = {
        method: (options.method ?? "GET").toUpperCase(),
        path: new URL(url, window.location.origin).pathname,
        body: options.body
          ? JSON.parse(options.body)
          : undefined,
        token: new Headers(options.headers).get("Authorization")
      };
      requests.push(request);

      const route =
        allRoutes[`${request.method} ${request.path}`];
      let result =
        typeof route === "function" ? route(request) : route;

      if (result === undefined) {
        result = reply(404, { detail: "Not found" });
      }

      const { status, body } = result[REPLY]
        ? result
        : { status: 200, body: result };

      return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body
      };
    })
  );

  return { requests };
}
