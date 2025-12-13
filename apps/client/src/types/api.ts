import { prisma } from "@repo/database";

export { $Enums } from "@repo/database";
export interface SuccessResponse<T> {
  status: "success";
  data: T;
}
export interface TBaseRequestParams {
  signal: AbortSignal;
}

export type TExtendsRequestParams<T extends object = object> = T &
  TBaseRequestParams;

export type SuccessResponsePromise<T> = Promise<SuccessResponse<T>>;

//TODO go over type transformation workshop - 04-conditional-types-and-infer,and redo,add default TParams type

export type TBaseHandler<
  TData,
  TParams extends TExtendsRequestParams = TExtendsRequestParams,
> = (TParams: TParams) => Promise<TData>;

export type TRelatedProducts = Awaited<
  ReturnType<(typeof prisma.product)["getRelatedProducts"]>
>;

export type TFeaturedProduct = Awaited<
  ReturnType<(typeof prisma.product)["getFeaturedProduct"]>
>;

export type TShowCaseProducts = Awaited<
  ReturnType<(typeof prisma.product)["getShowCaseProducts"]>
>;

export type TProductsByCategory = Awaited<
  ReturnType<(typeof prisma.product)["getProductsByCategory"]>
>;

export type TProduct = Awaited<
  ReturnType<(typeof prisma.product)["findFirstOrThrow"]>
>;

export type TCategory = Awaited<
  ReturnType<(typeof prisma.category)["findFirstOrThrow"]>
>;

export default {};
