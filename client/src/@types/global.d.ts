interface Action {
  readonly type: string;
  readonly payload?: any;
}

type JsObj = Record<string, unknown>;

type iterobject<T = string> = {[key: string]: T};

type RequiredProperty<T> = {[P in keyof T]: Required<NonNullable<T[P]>>};

type RawType<P extends Promise<unknown>> = P extends Promise<infer U> ? U : never;

type ValueOf<T> = T[keyof T];

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

type InferProps<T> = T extends React.ComponentType<infer Props> ? Props : never;

type PickWithOptional<T, K extends keyof T, O extends keyof T> = {
  [P in K]: T[P];
} &
  {[P in O]?: T[P]};

// eslint-disable-next-line @typescript-eslint/ban-types
type KeysByType<O extends object, T> = {
  [k in keyof O]-?: O[k] extends T ? k : never;
}[keyof O];
// eslint-disable-next-line @typescript-eslint/ban-types
type FunctionsOnly<O extends object> = Pick<O, KeysByType<O, Function>>;
// eslint-disable-next-line @typescript-eslint/ban-types
type ClassMethods<C extends object> = FunctionsOnly<InstanceType<C>>;

type InputChange = React.ChangeEvent<HTMLInputElement>;
type ButtonChange = React.ChangeEvent<HTMLButtonElement>;
type MouseChange = React.MouseEvent<HTMLButtonElement>;
