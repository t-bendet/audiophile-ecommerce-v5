import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  ASSETS: Fetcher;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_COOKIE_EXPIRES_IN: string;
  MEDIA_BASE_URL: string;
}

const isApiPath = (pathname: string) => /^\/api(\/|$)/.test(pathname);

export class ApiContainer extends Container<Env> {
  // The server listens only after its database ping, so an open port equals a passing /api/v1/health.
  defaultPort = 8000;

  constructor(ctx: ConstructorParameters<typeof Container<Env>>[0], env: Env) {
    super(ctx, env);
    this.envVars = {
      NODE_ENV: env.NODE_ENV,
      DATABASE_URL: env.DATABASE_URL,
      JWT_SECRET: env.JWT_SECRET,
      JWT_EXPIRES_IN: env.JWT_EXPIRES_IN,
      JWT_COOKIE_EXPIRES_IN: env.JWT_COOKIE_EXPIRES_IN,
      MEDIA_BASE_URL: env.MEDIA_BASE_URL,
    };
  }
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    // Second lock on the rule: an asset request never gets the API's 404.
    if (!isApiPath(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // Reached over plain HTTP, so only this header can set `Secure` cookies.
    const forwarded = new Request(request, {
      headers: new Headers(request.headers),
    });
    forwarded.headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

    return getContainer(env.API_CONTAINER).fetch(forwarded);
  },
} satisfies ExportedHandler<Env>;
