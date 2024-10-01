import { AsyncState } from "./core";

// For now: some code to test types.

const state: AsyncState<string> = undefined as any;
// @ts-expect-error - can't ask for value of state that might be pending
state.value();
// works!
state.ifPending("pending").value satisfies string;
// @ts-expect-error - can't ask for valueSafe of state that might be rejected
state.ifPending("pending").valueSafe;
// works!
state.ifPending("pending").ifRejected("rejected").valueSafe satisfies string;
