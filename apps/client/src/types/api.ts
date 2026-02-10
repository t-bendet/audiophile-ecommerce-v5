export interface TBaseRequestParams {
  signal: AbortSignal;
}

export type TExtendsRequestParams<T extends object = object> = T &
  TBaseRequestParams;

export type TBaseHandler<
  TData,
  TParams extends TExtendsRequestParams = TExtendsRequestParams,
> = (TParams: TParams) => Promise<TData>;

export type TMutationHandler<
  TData,
  TBody extends object,
  TParams extends object = object,
> = (body: TBody, params: TParams) => Promise<TData>;

export default {};
