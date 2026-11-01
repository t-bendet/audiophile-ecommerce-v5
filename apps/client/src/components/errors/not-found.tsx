import { Metadata } from "@/components/seo/metadata";
import { Container } from "@/components/ui/container";
import { paths } from "@/config/paths";
import { Link } from "react-router";

/** The not-found page: the `*` route, and what both boundaries render for a 404 response. */
export const NotFound = () => {
  return (
    <Container>
      <Metadata title="Page Not Found" noIndex />
      <div className="mt-22 flex flex-col items-center gap-3 bg-neutral-900 py-6 font-semibold">
        <h1 className="text-3xl text-primary-700">404 - Not Found</h1>
        <p className="text-2xl">
          Sorry, the page you are looking for does not exist.
        </p>
        <Link to={paths.home.getHref()} replace className="text-primary-500">
          Go to Home
        </Link>
      </div>
    </Container>
  );
};
