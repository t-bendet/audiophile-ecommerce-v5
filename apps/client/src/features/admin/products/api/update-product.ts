import productKeys from "@/features/products/api/product-keys";
import { getApi } from "@/lib/api-client";
import {
  ProductUpdateResponse,
  ProductUpdateResponseSchema,
} from "@repo/domain";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProductUpdateBody } from "../product-form";

const updateProduct = async (
  productId: string,
  body: ProductUpdateBody,
): Promise<ProductUpdateResponse> => {
  const api = getApi();
  const response = await api.patch(`/products/${productId}`, body);
  const result = ProductUpdateResponseSchema.safeParse(response.data);
  if (result.success) return result.data;
  throw result.error;
};

/**
 * Save the edit form. The admin pages read the storefront's product queries,
 * so invalidating that one key family refreshes the admin list and detail,
 * the storefront's lists, the product's page, the showcase and the hero.
 */
export const useUpdateProduct = (productId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ProductUpdateBody) => updateProduct(productId, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
  });
};
