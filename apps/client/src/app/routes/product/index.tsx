import { SafeRenderWithErrorBlock } from "@/components/errors/safe-render-with-error-block";
import { BestGearSection } from "@/components/page-sections";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ResponsivePicture } from "@/components/ui/responsivePicture";
import { Section } from "@/components/ui/section";
import CategoryNavList from "@/features/categories/components/category-nav-list";
import { getProductBySlugQueryOptions } from "@/features/products/api/get-product";
import ProductCard from "@/features/products/components/product-card";
import RelatedProducts from "@/features/products/components/related-products";
import { QueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { LoaderFunctionArgs, useNavigate, useParams } from "react-router";

const Product = () => {
  const { productSlug } = useParams();
  const { data: productResponse } = useSuspenseQuery(
    getProductBySlugQueryOptions(productSlug!),
  );
  const navigate = useNavigate();

  return (
    <>
      <Container classes="mt-4 mb-6 md:mt-8 md:mb-8 lg:mt-19 lg:mb-14">
        <Button
          onClick={() => navigate(-1)}
          aria-label="Go back to previous page"
          aria-describedby="go-back-button"
          variant={"link"}
          className="p-0"
        >
          Go back
        </Button>
      </Container>

      <main className="text-neutral-900">
        <Section classes="max-sm:mb-22">
          <Container classes="flex flex-col gap-y-8 md:flex-row md:gap-x-17 lg:gap-x-31">
            <ResponsivePicture
              mobileSrc={productResponse.data.images.primaryImage.mobileSrc}
              tabletSrc={productResponse.data.images.primaryImage.tabletSrc}
              desktopSrc={productResponse.data.images.primaryImage.desktopSrc}
              altText={productResponse.data.images.primaryImage.altText}
              ariaLabel={productResponse.data.images.primaryImage.ariaLabel}
              pictureClasses="rounded-sm"
            />
            <ProductCard
              product={{
                id: productResponse.data.id,
                title: productResponse.data.fullLabel,
                isNewProduct: productResponse.data.isNewProduct,
                slug: productResponse.data.slug,
                description: productResponse.data.description,
                price: productResponse.data.price,
              }}
              classes="items-start text-left"
            >
              <ProductCard.NewIndicator classes="mb-6 md:mb-4 md:text-[12px] lg:text-sm" />
              <ProductCard.Title classes="md:mb-8" />
              <ProductCard.Description classes="opacity-50 md:mb-8 md:max-w-[50ch] lg:max-w-[90ch]" />
              <ProductCard.Price classes="lg:mb-12" />
              <ProductCard.Actions
                cartActions={{
                  increaseCartItemQuantity: () => {},
                  decreaseCartItemQuantity: () => {},
                }}
              />
            </ProductCard>
          </Container>
        </Section>

        <Section classes="mb-22 md:mb-38 lg:mb-40">
          <Container classes="flex flex-col gap-22 md:gap-30 lg:flex-row lg:gap-31">
            <div>
              <h2 className="tracking-300 mb-6 text-xl font-bold uppercase md:mb-8 md:text-[32px]">
                features
              </h2>
              <div className="space-y-6 opacity-50 md:space-y-10">
                {productResponse.data.featuresText.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-y-6 md:flex-row lg:flex-col lg:gap-y-8">
              <h2 className="tracking-300 w-full text-xl font-bold uppercase md:text-[32px]">
                in the box
              </h2>
              <ul className="w-full min-w-max">
                {productResponse.data.includedItems.map((inc, index) => (
                  <li key={index}>
                    <span className="text-primary-500 mr-5 font-bold md:mr-6">
                      {inc.quantity}x
                    </span>
                    <span className="capitalize opacity-50">{inc.item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>

        <Section>
          <Container classes="grid grid-cols-1 grid-rows-2 gap-5 md:grid-cols-[40%__60%] lg:gap-8">
            <ResponsivePicture
              mobileSrc={productResponse.data.images.galleryImages[0].mobileSrc}
              tabletSrc={productResponse.data.images.galleryImages[0].tabletSrc}
              desktopSrc={
                productResponse.data.images.galleryImages[0].desktopSrc
              }
              altText={productResponse.data.images.galleryImages[0].altText}
              ariaLabel={productResponse.data.images.galleryImages[0].ariaLabel}
              pictureClasses="rounded-sm md:col-span-1 md:row-span-1"
              classes="h-full rounded-sm"
            />
            <ResponsivePicture
              mobileSrc={productResponse.data.images.galleryImages[1].mobileSrc}
              tabletSrc={productResponse.data.images.galleryImages[1].tabletSrc}
              desktopSrc={
                productResponse.data.images.galleryImages[1].desktopSrc
              }
              altText={productResponse.data.images.galleryImages[1].altText}
              ariaLabel={productResponse.data.images.galleryImages[1].ariaLabel}
              pictureClasses="rounded-sm md:col-start-1 md:row-start-2"
              classes="h-full rounded-sm"
            />
            <ResponsivePicture
              mobileSrc={productResponse.data.images.galleryImages[2].mobileSrc}
              tabletSrc={productResponse.data.images.galleryImages[2].tabletSrc}
              desktopSrc={
                productResponse.data.images.galleryImages[2].desktopSrc
              }
              altText={productResponse.data.images.galleryImages[2].altText}
              ariaLabel={productResponse.data.images.galleryImages[2].ariaLabel}
              pictureClasses="rounded-sm md:col-start-2 md:row-span-2 "
              classes="h-full rounded-sm"
            />
          </Container>
        </Section>
        <aside className="mb-30 lg:mb-40">
          <Container>
            <h2 className="tracking-300 mb-10 text-center text-xl font-bold uppercase md:mb-14 md:text-[32px] lg:mb-16">
              you may also like
            </h2>
            <SafeRenderWithErrorBlock
              title="Error loading related products"
              containerClasses="mb-30"
            >
              <RelatedProducts id={productResponse.data.id} />
            </SafeRenderWithErrorBlock>
          </Container>
        </aside>
      </main>

      <Section>
        <SafeRenderWithErrorBlock
          title="Error loading categories"
          containerClasses="mb-30"
        >
          <Container>
            <CategoryNavList />
          </Container>
        </SafeRenderWithErrorBlock>
      </Section>
      <Section>
        <BestGearSection />
      </Section>
    </>
  );
};

export default Product;

export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    await queryClient.ensureQueryData(
      getProductBySlugQueryOptions(params.productSlug as string),
    );
    // TODO how to get id for related products prefetching?
    // getRelatedProductsQueryOptions(id)
    return null;
  };
