import EventEmitter from "eventemitter3";

export class Reactive<Value> extends EventEmitter<{
  change: (value: Value) => void;
  destroy: () => void;
}> {
  #value: Value;

  get value(): Value {
    return this.#value;
  }

  constructor(props: Value) {
    super();
    this.#value = props;
  }

  change(mutate: (props: Value) => void) {
    mutate(this.#value);
    this.emit("change", this.#value);
  }

  set(props: Value) {
    this.#value = props;
    this.emit("change", props);
  }
}
