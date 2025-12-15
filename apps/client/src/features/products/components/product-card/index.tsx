import { cn } from "@/lib/cn";
import React, { createContext, useContext } from "react";
import ProductNewIndicator from "./product-new-indicator";
import ProductTitle from "./product-title";
import ProductDescription from "./product-description";
import ProductPrice from "./product-price";
import ProductActions from "./product-actions";

type TProductDetails = {
  isNewProduct: boolean;
  title: string[];
  description: string;
  price?: number; // Optional, if price is not always available
  slug: string;
  id: string;
};

type TProductCardProps = {
  children: React.ReactNode;
  classes?: string;
  product: TProductDetails;
};

const ProductCardContext = createContext<TProductDetails | null>(null);

export function UseProductCardContext() {
  const ctx = useContext(ProductCardContext);
  if (!ctx) {
    throw new Error(
      "ProductCard-related components must be wrapped by <ProductCard/>.",
    );
  }
  return ctx;
}

export default function Product({
  children,
  classes,
  product,
}: TProductCardProps) {
  const ContextValue = {
    ...product,
  };
  return (
    <ProductCardContext.Provider value={ContextValue}>
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

Product.NewIndicator = ProductNewIndicator;
Product.Title = ProductTitle;
Product.Description = ProductDescription;
Product.Price = ProductPrice;
Product.Actions = ProductActions;

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
