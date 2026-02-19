export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
export type DeepPartial<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};
export type DeepRequired<T> = {
  [K in keyof T]-?: DeepRequired<T[K]>;
};
export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};
export type DeepMutable<T> = {
  -readonly [K in keyof T]: DeepMutable<T[K]>;
};
export type DeepNullable<T> = {
  [K in keyof T]: T[K] | null;
};
