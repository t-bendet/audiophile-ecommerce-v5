import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { Skeleton } from "@/components/ui/skeleton";
import ProductSkeleton from "./product-skeleton";

const ProductsListSkeleton = () => {
  return (
    <>
      <Section>
        <Container
          classes={`flex flex-col gap-8 md:gap-14 lg:flex-row lg:gap-31`}
        >
          <Skeleton className="h-64 w-full rounded-sm" />
          <ProductSkeleton />
        </Container>
      </Section>
      <Section>
        <Container
          classes={`flex flex-col gap-8 md:gap-14 lg:flex-row-reverse lg:gap-31`}
        >
          <Skeleton className="h-64 w-full rounded-sm" />
          <ProductSkeleton />
        </Container>
      </Section>
      <Section>
        <Container
          classes={`flex flex-col gap-8 md:gap-14 lg:flex-row lg:gap-31`}
        >
          <Skeleton className="h-64 w-full rounded-sm" />
          <ProductSkeleton />
        </Container>
      </Section>
    </>
  );
};

export default ProductsListSkeleton;
