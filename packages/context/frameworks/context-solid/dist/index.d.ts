import { Reactive } from "@patchwork/context";
export declare const createReactive: <T>(reactiveOrFn: Reactive<T> | (() => Reactive<T>), owned?: boolean) => import("solid-js").Accessor<T>;
export declare const createSubcontext: () => import("@patchwork/context").Context;
