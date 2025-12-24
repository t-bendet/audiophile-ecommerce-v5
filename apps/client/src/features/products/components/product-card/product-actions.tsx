import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { getProductBySlugQueryOptions } from "@/features/products/api/get-product";
import { useProductCardContext } from "@/features/products/components/product-card/index";
import { cn } from "@/lib/cn";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";

export default function ProductActions(props: {
  classes?: string;
  children?: React.ReactNode;
  cartActions?: {
    increaseCartItemQuantity: () => void;
    decreaseCartItemQuantity: () => void;
  };
  hasNavigateAction?: boolean;
}) {
  const { slug } = useProductCardContext();
  const queryClient = useQueryClient();
  if (!props.children && !props.hasNavigateAction && !props.cartActions) {
    throw new Error(
      "ProductActions components must have at least one action in context , or a child component.",
    );
  }
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
      {props.cartActions ? (
        <>
          <div className="flex h-12 w-30 items-center justify-around bg-neutral-200 text-xs font-bold">
            <button className="cursor-pointer opacity-25">-</button>
            <p>1</p>
            <button className="cursor-pointer opacity-25">+</button>
          </div>
          <Button
            variant="accent"
            onClick={props.cartActions.increaseCartItemQuantity}
          >
            add to cart
          </Button>
        </>
      ) : null}
      {props.children}
      {/* Additional actions can be added here */}
    </div>
  );
}

ProductActions.displayName = "ProductCard.Actions";
