import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ResponsivePicture } from "@/components/ui/responsivePicture";
import { paths } from "@/config/paths";
import { AppError, ErrorCode } from "@repo/domain";
import { getProductBySlugQueryOptions } from "@/features/products/api/get-product";
import { getShowCaseProductsQueryOptions } from "@/features/products/api/get-products";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { Fragment } from "react/jsx-runtime";
import PatternCircles from "@/assets/pattern-circles.svg?react";

const ShowCaseProductsSection = () => {
  const { data: productResponse } = useSuspenseQuery(
    getShowCaseProductsQueryOptions(),
  );
  const queryClient = useQueryClient();
  const { showCaseCover, showCaseGrid, showCaseWide } = productResponse.data;

  if (
    !showCaseCover?.images.showCaseImage ||
    !showCaseWide?.images.showCaseImage ||
    !showCaseGrid?.images.showCaseImage
  ) {
    throw new AppError(
      "A showcase product does not have a showcase image.",
      ErrorCode.COMPONENT_COMPOSITION_ERROR,
    );
  }

  return (
    <>
      <article>
        <Container classes="relative flex flex-col items-center gap-8 overflow-hidden rounded-sm bg-primary-500 pt-24 lg:flex-row lg:items-start lg:justify-center lg:gap-30">
          <section className="relative z-10 mx-auto w-[60%] max-w-60 lg:mx-0 lg:-mb-2.5 lg:max-w-102.5">
            {/* The asset has no viewBox and the global svg rule caps size at 100%, so both are overridden to let CSS width scale the rings. */}
            <PatternCircles
              aria-hidden
              viewBox="0 0 944 944"
              className="pointer-events-none absolute top-1/2 left-1/2 h-auto max-h-none w-[285%] max-w-none -translate-1/2 sm:w-[400%] lg:left-[39%] lg:w-[178%]"
            />
            <ResponsivePicture
              {...showCaseCover.images.showCaseImage}
              classes="mx-auto"
              pictureClasses="relative"
              loading="lazy"
            />
          </section>
          <section className="relative z-10 max-w-[30ch] text-center md:max-w-[35ch] lg:max-w-[40ch] lg:p-6 lg:text-left">
            <header>
              <h2 className="mb-6 text-3xl font-bold tracking-300 uppercase md:text-5xl">
                {showCaseCover?.shortLabel.split(" ").map((word, index) => (
                  <Fragment key={index}>
                    <span>{word}</span>
                    <br />
                  </Fragment>
                ))}
              </h2>
            </header>
            <p className="mb-6 opacity-75 md:mb-10">
              {showCaseCover?.showCaseImageText}
            </p>
            <div>
              <Button variant={"outlineReversed"} asChild>
                <Link
                  to={paths.product.getHref(showCaseCover?.slug as string)}
                  onMouseEnter={() =>
                    queryClient.prefetchQuery(
                      getProductBySlugQueryOptions(
                        showCaseCover?.slug as string,
                      ),
                    )
                  }
                  onFocus={() =>
                    queryClient.prefetchQuery(
                      getProductBySlugQueryOptions(
                        showCaseCover?.slug as string,
                      ),
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
            {...showCaseWide.images.showCaseImage}
            classes="w-full"
            pictureClasses="col-span-full row-span-full"
            loading="lazy"
          />
          <div className="z-10 col-span-full row-span-full ml-6 self-center md:ml-16 lg:ml-24">
            <header>
              <h2 className="text-2xl font-bold tracking-[0.07em] text-neutral-900 uppercase">
                {showCaseWide?.shortLabel}
              </h2>
            </header>
            <div className="mt-8">
              <Button variant={"outline"} asChild>
                <Link
                  to={paths.product.getHref(showCaseWide?.slug as string)}
                  onMouseEnter={() =>
                    queryClient.prefetchQuery(
                      getProductBySlugQueryOptions(
                        showCaseWide?.slug as string,
                      ),
                    )
                  }
                  onFocus={() =>
                    queryClient.prefetchQuery(
                      getProductBySlugQueryOptions(
                        showCaseWide?.slug as string,
                      ),
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
              {...showCaseGrid.images.showCaseImage}
              loading="lazy"
            />
          </section>
          <section className="flex items-center overflow-hidden rounded-sm bg-neutral-200">
            <div className="ml-6 md:ml-10 lg:ml-24">
              <header>
                <h2 className="text-2xl font-bold tracking-[0.07em] text-neutral-900 uppercase">
                  {showCaseGrid?.shortLabel}
                </h2>
              </header>
              <div className="mt-8">
                <Button variant={"outline"} asChild>
                  <Link
                    to={paths.product.getHref(showCaseGrid?.slug as string)}
                    onMouseEnter={() =>
                      queryClient.prefetchQuery(
                        getProductBySlugQueryOptions(
                          showCaseGrid?.slug as string,
                        ),
                      )
                    }
                    onFocus={() =>
                      queryClient.prefetchQuery(
                        getProductBySlugQueryOptions(
                          showCaseGrid?.slug as string,
                        ),
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
