// function getListQueryOptions(payload: payloadType) {
//   switch (payload.type) {
//     case "getProducts":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), "getProducts"],
//         queryFn: () => getProducts(payload.filters),
//       });
//     case "relatedProducts":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), "relatedProducts", payload.id],
//         queryFn: () => getRelatedProducts(payload.id),
//       });
//     case "category":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), payload.category],
//         queryFn: () => getProductsByCategory(payload.category),
//       });
//     case "showCase":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), "showCase"],
//         queryFn: () => getShowCaseProducts(),
//       });
//   }
// }

// type payloadType =
//   | {
//       type: "getProducts";
//       filters?: Record<string, string>;
//     }
//   | {
//       type: "relatedProducts";
//       id: string;
//     }
//   | {
//       type: "category";
//       category: $Enums.NAME;
//     }
//   | {
//       type: "showCase";
//     };

// function getListQueryOptions(payload: payloadType) {
//   switch (payload.type) {
//     case "getProducts":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), "getProducts"],
//         queryFn: () => getProducts(payload.filters),
//       });
//     case "relatedProducts":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), "relatedProducts", payload.id],
//         queryFn: () => getRelatedProducts(payload.id),
//       });
//     case "category":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), payload.category],
//         queryFn: () => getProductsByCategory(payload.category),
//       });
//     case "showCase":
//       return queryOptions({
//         queryKey: [...productsQueries.lists(), "showCase"],
//         queryFn: () => getShowCaseProducts(),
//       });
//   }
// }

// const productsQueries = {
//   all: () => ["products"],
//   // ** lists
//   lists: () => [...productsQueries.all(), "list"] as const,
//   list: (payload: payloadType) => getListQueryOptions(payload),
//   // ** details
//   details: () => [...productsQueries.all(), "detail"] as const,
//   detail: (id: string) =>
//     queryOptions({
//       queryKey: [...productsQueries.details(), id] as const,
//       queryFn: () => getProductById(id),
//       staleTime: 5000,
//     }),
//   featuredProductDetail: () =>
//     queryOptions({
//       queryKey: [...productsQueries.details(), "featured"] as const,
//       // queryFn: () => getFeaturedProduct(),
//       queryFn: ({ signal }: { signal: AbortSignal }) =>
//         getFeaturedProduct({ signal }),
//       select(data) {
//         return data.data; // Adjust based on the actual structure of the response
//       },
//     }),
// };
// export default productsQueries;
