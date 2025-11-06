import { AutomergeUrl } from "@automerge/automerge-repo";
import { Reactive, Ref, Context } from "@patchwork/context";
export declare function useReactive<T>(reactive: Reactive<T>): T;
export declare function useReactive<T>(reactive: undefined): undefined;
export declare function useReactive<T>(reactive: undefined | Reactive<T>): T | undefined;
type UseDocRefHandleSuspendingParams = {
    suspense: true;
};
type UseDocRefHandleSynchronousParams = {
    suspense: false;
};
export declare function useDocRef<T>(docUrl: AutomergeUrl, params: UseDocRefHandleSuspendingParams): Ref<T, T>;
export declare function useDocRef<T>(docUrl: AutomergeUrl | undefined, params?: UseDocRefHandleSynchronousParams | undefined): Ref<T, T> | undefined;
export declare const useSubcontext: (id: string) => Context;
export declare const useRefValue: <T>(ref?: Ref<T>) => T | undefined;
export {};
