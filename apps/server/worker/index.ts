import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  ASSETS: Fetcher;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_COOKIE_EXPIRES_IN: string;
}

const API_PATH = /^\/api(\/|$)/;

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
    };
  }
}

export default {
  fetch(request, env) {
    const url = new URL(request.url);

    // `run_worker_first` sends only API paths here; this keeps anything else
    // that reaches the Worker on the assets path rather than the API's 404.
    if (!API_PATH.test(url.pathname)) {
      return env.ASSETS.fetch(request);
    }

    // The container is reached over plain HTTP, so the Express app learns the
    // browser's scheme from this header, which is what puts `Secure` on the
    // auth cookie.
    const forwarded = new Request(request, {
      headers: new Headers(request.headers),
    });
    forwarded.headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

    return getContainer(env.API_CONTAINER).fetch(forwarded);
  },
} satisfies ExportedHandler<Env>;
