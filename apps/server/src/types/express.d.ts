// `verified` is `unknown` so that intersecting it in `ValidatedRequest` collapses
// to the request schema's inferred type instead of widening it.
declare namespace Express {
  interface Request {
    user?: import("@repo/domain").UserPublicInfo;
    verified?: unknown;
  }
}
