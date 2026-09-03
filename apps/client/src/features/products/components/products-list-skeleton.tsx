import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import ProductSkeleton from "@/features/products/components/product-skeleton";

const ProductsListSkeleton = () => {
  return (
    <>
      <Section>
        <Container
          classes={`lg:gap-31 flex flex-col gap-8 md:gap-14 lg:flex-row`}
        >
          <Skeleton className="h-64 w-full rounded-sm" />
          <ProductSkeleton />
        </Container>
      </Section>
      <Section>
        <Container
          classes={`lg:gap-31 flex flex-col gap-8 md:gap-14 lg:flex-row-reverse`}
        >
          <Skeleton className="h-64 w-full rounded-sm" />
          <ProductSkeleton />
        </Container>
      </Section>
      <Section>
        <Container
          classes={`lg:gap-31 flex flex-col gap-8 md:gap-14 lg:flex-row`}
        >
          <Skeleton className="h-64 w-full rounded-sm" />
          <ProductSkeleton />
        </Container>
      </Section>
    </>
  );
};

export default ProductsListSkeleton;
