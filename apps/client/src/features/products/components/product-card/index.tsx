import ProductActions from "@/features/products/components/product-card/product-actions";
import ProductDescription from "@/features/products/components/product-card/product-description";
import ProductNewIndicator from "@/features/products/components/product-card/product-new-indicator";
import ProductPrice from "@/features/products/components/product-card/product-price";
import ProductTitle from "@/features/products/components/product-card/product-title";
import { cn } from "@/lib/cn";
import React, { createContext, useContext } from "react";

type ProductDetails = {
  isNewProduct: boolean;
  fullLabel: string[];
  description: string;
  price?: number; // Optional, if price is not always available
  slug: string;
  id: string;
};

interface ProductCardProps {
  children: React.ReactNode;
  classes?: string;
  product: ProductDetails;
}

const ProductCardContext = createContext<ProductDetails | null>(null);

export function useProductCardContext() {
  const ctx = useContext(ProductCardContext);
  if (!ctx) {
    throw new Error(
      "ProductCard Error : ProductCard-related components must be wrapped by <ProductCard/>.",
    );
  }
  return ctx;
}

export default function ProductCard({
  children,
  classes,
  product,
}: ProductCardProps) {
  return (
    <ProductCardContext.Provider value={product}>
      <article
        className={cn(
          "flex flex-col items-center justify-center space-y-4 text-center lg:items-start lg:text-left",
          classes,
        )}
      >
        {children}
      </article>
    </ProductCardContext.Provider>
  );
}

ProductCard.displayName = "ProductCard";

ProductCard.NewIndicator = ProductNewIndicator;
ProductCard.Title = ProductTitle;
ProductCard.Description = ProductDescription;
ProductCard.Price = ProductPrice;
ProductCard.Actions = ProductActions;

// ** featured product card
// ** is new product - font size 14,  grey label - mb -24px
// ** product fullLabel - font size 56px(desk,tablet) ,36px(mobile) ,color white - mb -24px
// ** product featuredImageText - font size 15px - mb -40px
// ** product actions - see product(slug/id)
// **  alignment left,center,center - breakpoints

// ** category product card
// ** is new product - font size 14,orange label mb -16px
// ** product fullLabel -font size 40px(desk,tablet) -28px(mobile) ,color black - mb -32px(desktop) 24px(tablet,mobile)
// ** product description - font size 15px mb -40px(desktop) 24px(tablet,mobile)
// ** product actions - see product(slug/id)
// ** alignment left,center,center - breakpoints

// ** product page product card
// ** is new product - font size 14px,12px,14px,orange ,label mb -16px 24px(mobile)
// ** product fullLabel - font size 40px(desk,tablet) -28px(mobile)  color black ,mb -32px(desktop,tablet) 24px(mobile)
// ** product description - font size 15px,mb -32px(desktop,tablet) 24px(mobile)
// ** product price - font size 18px,color black mb -48px(desktop) 32px(tablet,mobile)
// **  product actions - increase+ decrease  ,add to cart(slug/id)
// ** alignment left

// ** showCaseProductCard - no need for this component

// showCaseImageText
// - product shortLabel - font size 56px(desk,tablet) ,36px(mobile)   color white
// - product showCaseImageText - font size 15px
// - product actions - see product(slug/id)
