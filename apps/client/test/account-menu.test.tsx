import type { UserDTO } from "@repo/domain";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The HTTP boundary is the only mock; the menu reads the real query options.
const { api } = vi.hoisted(() => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("@/lib/api-client", () => ({ getApi: () => api }));

import { UserDropdown } from "../src/components/layouts/content-layout/nav-bar/user-dropdown";
import { AUTH_STATUS_QUERY_KEY, USER_QUERY_KEY } from "../src/lib/auth";

const shopper: UserDTO = {
  id: "64b7f0c2e4b0a1a2b3c4d5e6",
  name: "Sam Shopper",
  email: "shopper@example.com",
  role: "USER",
  emailVerified: true,
  active: true,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  v: 0,
};

const envelope = <T,>(data: T) => ({
  success: true as const,
  timestamp: "2026-11-01T12:00:00.000Z",
  data,
});

const clientWithStatus = (isAuthenticated: boolean) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  client.setQueryData([AUTH_STATUS_QUERY_KEY], envelope({ isAuthenticated }));
  return client;
};

const render = (client: QueryClient) =>
  renderToString(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <UserDropdown />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe("the account menu", () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it("greets a signed-in shopper without a name while the user loads", () => {
    api.get.mockReturnValue(new Promise(() => {}));

    const html = render(clientWithStatus(true));

    expect(html).toContain("Open user menu");
    expect(html).toContain('aria-busy="true"');
    expect(html).toMatch(/<button[^>]*disabled/);
    expect(html).toContain("hello!");
    expect(html).not.toContain(shopper.name);
    expect(html).not.toContain("Loading");
  });

  it("greets the shopper by name once the user is known", () => {
    const client = clientWithStatus(true);
    client.setQueryData([USER_QUERY_KEY], envelope(shopper));

    const html = render(client);

    expect(html).toContain("Open user menu");
    expect(html).toContain(`hello <!-- -->${shopper.name}<!-- -->!`);
    expect(html).not.toContain("aria-busy");
    expect(api.get).not.toHaveBeenCalled();
  });

  it("offers a guest the anonymous menu", () => {
    const html = render(clientWithStatus(false));

    expect(html).toContain("Open anonymous menu");
    expect(html).not.toContain("Open user menu");
  });
});
