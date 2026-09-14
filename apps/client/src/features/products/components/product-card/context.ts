import { AppError, ErrorCode } from "@repo/domain";
import { createContext, useContext } from "react";

export type ProductDetails = {
  isNewProduct: boolean;
  fullLabel: string[];
  description: string;
  price?: number; // Optional, if price is not always available
  slug: string;
  id: string;
};

export const ProductCardContext = createContext<ProductDetails | null>(null);

export function useProductCardContext() {
  const ctx = useContext(ProductCardContext);
  if (!ctx) {
    throw new AppError(
      "ProductCard-related components must be wrapped by <ProductCard/>.",
      ErrorCode.COMPONENT_COMPOSITION_ERROR,
    );
  }
  return ctx;
}
