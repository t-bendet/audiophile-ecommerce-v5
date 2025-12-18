import { Link } from "react-router";
import { paths } from "@/config/paths";
import { Container } from "@/components/ui/container";

const NotFoundRoute = () => {
  return (
    <Container>
      <div className="mt-22 flex flex-col items-center gap-3 bg-neutral-900 py-6 font-semibold">
        <h1 className="text-primary-700 text-3xl">404 - Not Found</h1>
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

export default NotFoundRoute;
