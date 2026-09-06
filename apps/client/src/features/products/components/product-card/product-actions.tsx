import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { paths } from "@/config/paths";
import { useAddToCart } from "@/features/cart/api/get-cart";
import { getProductBySlugQueryOptions } from "@/features/products/api/get-product";
import { useProductCardContext } from "@/features/products/components/product-card/index";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/cn";
import { AppError, ErrorCode } from "@repo/domain";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router";

export default function ProductActions(props: {
  classes?: string;
  children?: React.ReactNode;
  hasNavigateAction?: boolean;
  hasCartAction?: boolean;
}) {
  const { slug, id } = useProductCardContext();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();
  const { toast } = useToast();

  if (
    !props.children &&
    !props.hasNavigateAction &&
    !props.hasCartAction &&
    !id
  ) {
    throw new AppError(
      "ProductActions components must have at least one action in context, or a child component.",
      ErrorCode.COMPONENT_COMPOSITION_ERROR,
    );
  }

  const handleAddToCart = async () => {
    if (!id) return;

    // Fetch product details from cache or server
    const productData = await queryClient.ensureQueryData(
      getProductBySlugQueryOptions(slug),
    );

    if (!productData?.data) {
      toast({
        title: "Error",
        description: "Failed to get product details",
        variant: "destructive",
      });
      return;
    }

    const product = productData.data;

    addToCart.mutate(
      {
        productId: id,
        quantity,
        cartLabel: product.cartLabel,
        productSlug: product.slug,
        productPrice: product.price,
        productImage: product.images.thumbnail.src,
      },
      {
        onSuccess: () => {
          toast({
            title: "Added to cart",
            description: `${quantity} item(s) added to your cart`,
          });
          setQuantity(1); // Reset quantity after adding
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message || "Failed to add item to cart",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <div className={cn("flex gap-4", props.classes)}>
      {props.hasNavigateAction ? (
        <Link
          to={paths.product.getHref(slug)}
          onMouseEnter={() =>
            queryClient.prefetchQuery(getProductBySlugQueryOptions(slug))
          }
          onFocus={() =>
            queryClient.prefetchQuery(getProductBySlugQueryOptions(slug))
          }
        >
          <Button variant="accent">see product</Button>
        </Link>
      ) : null}
      {props.hasCartAction ? (
        <>
          <QuantitySelector
            value={quantity}
            onChange={setQuantity}
            disabled={addToCart.isPending}
          />
          <Button
            variant="accent"
            onClick={handleAddToCart}
            disabled={addToCart.isPending}
          >
            {addToCart.isPending ? "Adding..." : "add to cart"}
          </Button>
        </>
      ) : null}
      {props.children}
      {/* Additional actions can be added here */}
    </div>
  );
}

ProductActions.displayName = "ProductCard.Actions";
