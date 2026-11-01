import type { Request, RequestHandler } from "express";
import { sitemapService } from "../services/sitemap.service.js";
import catchAsync from "../utils/catchAsync.js";

const XML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&apos;",
};

const escapeXml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char] ?? char);

// Under `trust proxy`, both read the Worker's forwarded headers, so the URLs
// carry the origin the crawler requested rather than the container's address.
const requestOrigin = (req: Request) => `${req.protocol}://${req.host}`;

const renderSitemap = (origin: string, paths: string[]) =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...paths.map(
      (path) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`,
    ),
    "</urlset>",
  ].join("\n");

export const getSitemap: RequestHandler = catchAsync(async (req, res) => {
  const paths = await sitemapService.getPublicPaths();

  res
    .status(200)
    .set("Cache-Control", "public, max-age=300")
    .type("application/xml")
    .send(renderSitemap(requestOrigin(req), paths));
});
