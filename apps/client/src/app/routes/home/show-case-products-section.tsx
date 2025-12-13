import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ResponsivePicture } from "@/components/ui/responsivePicture";
import { paths } from "@/config/paths";
import { getProductBySlugQueryOptions } from "@/features/products/api/get-product";
import { getShowCaseProductsQueryOptions } from "@/features/products/api/get-products";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Fragment } from "react/jsx-runtime";
// import CircleSvg from "@/assets/pattern-circles.svg?react";

// TODO add svg to zx9 and finish spacings - add children to responsive picture?
// TODO svg workshop
// mobile size should be 558 - 558

// <Container classes="h-[20%] w-[20%] bg-neutral-600">
//   <img src={CircleSvg} className="w-full" />
// </Container>
// <CircleSvg className="absolute top-1/2 overflow-visible" />

// grid size should be 558 - 558
// <Container classes="h-[20%] w-[20%] bg-neutral-600

const ShowCaseProductsSection = () => {
  const { data: product } = useSuspenseQuery(getShowCaseProductsQueryOptions());
  const queryClient = useQueryClient();

  return (
    <>
      <article>
        <Container classes="bg-primary-500 flex flex-col items-center gap-8 overflow-hidden rounded-sm pt-24 lg:flex-row lg:items-start lg:justify-center lg:gap-30">
          <section className="mx-auto w-[60%] max-w-[240px] lg:mx-0 lg:mb-[-10px] lg:max-w-[410px]">
            <ResponsivePicture
              altText={product.cover.images.showCaseImage?.altText || ""}
              ariaLabel={product.cover.images.showCaseImage?.ariaLabel || ""}
              mobileSrc={product.cover.images.showCaseImage?.mobileSrc || ""}
              tabletSrc={product.cover.images.showCaseImage?.tabletSrc || ""}
              desktopSrc={product.cover.images.showCaseImage?.desktopSrc || ""}
              classes="mx-auto"
            />
          </section>
          <section className="max-w-[30ch] text-center md:max-w-[35ch] lg:max-w-[40ch] lg:p-6 lg:text-left">
            <header>
              <h2 className="tracking-300 mb-6 text-3xl font-bold uppercase md:text-5xl">
                {product.cover.shortLabel.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    <span>{word}</span>
                    <br />
                  </Fragment>
                ))}
              </h2>
            </header>
            <p className="mb-6 opacity-75 md:mb-10">
              {product.cover.showCaseImageText}
            </p>
            <div>
              <Button variant={"outlineReversed"} asChild>
                <Link
                  to={paths.product.getHref(product.cover.slug)}
                  onMouseEnter={() =>
                    queryClient.ensureQueryData(
                      getProductBySlugQueryOptions(product.cover.slug),
                    )
                  }
                >
                  see product
                </Link>
              </Button>
            </div>
          </section>
        </Container>
      </article>
      <article>
        <Container classes="grid h-full grid-cols-1 overflow-hidden rounded-sm">
          <ResponsivePicture
            altText={product.wide.images.showCaseImage?.altText || ""}
            ariaLabel={product.wide.images.showCaseImage?.ariaLabel || ""}
            mobileSrc={product.wide.images.showCaseImage?.mobileSrc || ""}
            tabletSrc={product.wide.images.showCaseImage?.tabletSrc || ""}
            desktopSrc={product.wide.images.showCaseImage?.desktopSrc || ""}
            classes="w-full"
            pictureClasses="col-span-full row-span-full"
          />
          <div className="z-10 col-span-full row-span-full ml-6 self-center md:ml-16 lg:ml-24">
            <header>
              <h2 className="text-2xl font-bold tracking-[0.07em] text-neutral-900 uppercase">
                {product.wide.shortLabel}
              </h2>
            </header>
            <div className="mt-8">
              <Button variant={"outline"} asChild>
                <Link
                  to={paths.product.getHref(product.wide.slug)}
                  onMouseEnter={() =>
                    queryClient.ensureQueryData(
                      getProductBySlugQueryOptions(product.wide.slug),
                    )
                  }
                >
                  see product
                </Link>
              </Button>
            </div>
          </div>
        </Container>
      </article>

      <article>
        <Container classes="lg: grid grid-cols-1 grid-rows-2 gap-6 md:grid-cols-2 md:grid-rows-1 md:gap-3 lg:gap-7">
          <section className="overflow-hidden rounded-sm">
            <ResponsivePicture
              altText={product.grid.images.showCaseImage?.altText || ""}
              ariaLabel={product.grid.images.showCaseImage?.ariaLabel || ""}
              mobileSrc={product.grid.images.showCaseImage?.mobileSrc || ""}
              tabletSrc={product.grid.images.showCaseImage?.tabletSrc || ""}
              desktopSrc={product.grid.images.showCaseImage?.desktopSrc || ""}
            />
          </section>
          <section className="flex items-center overflow-hidden rounded-sm bg-neutral-200">
            <div className="ml-6 md:ml-10 lg:ml-24">
              <header>
                <h2 className="text-2xl font-bold tracking-[0.07em] text-neutral-900 uppercase">
                  {product.grid.shortLabel}
                </h2>
              </header>
              <div className="mt-8">
                <Button variant={"outline"} asChild>
                  <Link
                    to={paths.product.getHref(product.grid.slug)}
                    onMouseEnter={() =>
                      queryClient.ensureQueryData(
                        getProductBySlugQueryOptions(product.grid.slug),
                      )
                    }
                  >
                    see product
                  </Link>
                </Button>
              </div>
            </div>
          </section>
        </Container>
      </article>
    </>
  );
};
export default ShowCaseProductsSection;

// flex flex-col gap-6
