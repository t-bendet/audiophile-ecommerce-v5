import { $Enums } from "@/types/api";

const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (filters?: Record<string, string>) =>
    [...productKeys.lists(), { filters }] as const,
  relatedProductsList: (id: string) =>
    [...productKeys.lists(), "related-products", id] as const,
  productsByCategoryList: (category: $Enums.NAME) =>
    [...productKeys.lists(), category] as const,
  showCaseProductsList: () => [...productKeys.lists(), "show-case"] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
  featuredProductDetail: () => [...productKeys.details(), "featured"] as const,
};

export default productKeys;

// const listActions = {
//   invalidate: () => productKeys.lists(),
//   invalidateRelatedProducts: (id: string) => productKeys.relatedProducts(id),
//   invalidateProductsByCategory: (category: string) =>
//     productKeys.productsByCategory(category),
//   invalidateShowCaseProducts: () => productKeys.showCaseProducts(),
//   invalidateDetails: () => productKeys.details(),
//   invalidateDetail: (id: string) => productKeys.detail(id),
//   invalidateFeaturedProductDetail: () => productKeys.featuredProductDetail(),
//   all: () => productKeys.all,
//   allDetails: () => productKeys.details(),
//   allFeaturedProductDetail: () => productKeys.featuredProductDetail(),
//   allLists: () => productKeys.lists(),
//   allRelatedProducts: (id: string) => productKeys.relatedProducts(id),
//   allProductsByCategory: (category: string) =>
//     productKeys.productsByCategory(category),
//   allShowCaseProducts: () => productKeys.showCaseProducts(),
// };
