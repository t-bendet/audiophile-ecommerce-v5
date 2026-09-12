import { Container, getContainer } from "@cloudflare/containers";

interface Env {
  API_CONTAINER: DurableObjectNamespace<ApiContainer>;
  NODE_ENV: string;
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_COOKIE_EXPIRES_IN: string;
}

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
    return getContainer(env.API_CONTAINER).fetch(request);
  },
} satisfies ExportedHandler<Env>;
