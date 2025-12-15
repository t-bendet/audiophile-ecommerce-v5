import { Button } from "@/components/ui/button";
import { ResponsivePicture } from "@/components/ui/responsivePicture";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getProductBySlugQueryOptions } from "../../api/get-product";
import { getRelatedProductsQueryOptions } from "../../api/get-products";

const RelatedProducts = ({ id }: { id: string }) => {
  const { data: productsResponse } = useSuspenseQuery(
    getRelatedProductsQueryOptions(id),
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <div className="flex flex-col gap-14 md:flex-row md:gap-3 lg:gap-8">
      {productsResponse.data.map((product) => (
        <article key={product.id} className="space-y-8">
          <ResponsivePicture
            mobileSrc={product.images.relatedProductImage.mobileSrc}
            tabletSrc={product.images.relatedProductImage.tabletSrc}
            desktopSrc={product.images.relatedProductImage.desktopSrc}
            altText={product.images.relatedProductImage.altText}
            classes="h-auto w-full md:mb-10"
            ariaLabel={product.images.relatedProductImage.ariaLabel}
          />
          <h3 className="tracking-300 text-center text-xl font-bold uppercase">
            {product.shortLabel}
          </h3>
          <Button
            variant="accent"
            className="mx-auto block"
            onClick={() => navigate(`/product/${product.slug}`)}
            onMouseEnter={() => {
              queryClient.ensureQueryData(
                getProductBySlugQueryOptions(product.slug),
              );
            }}
          >
            See Product
          </Button>
        </article>
      ))}
    </div>
  );
};

export default RelatedProducts;
