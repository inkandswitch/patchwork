import { DataTypeImplementation } from "@patchwork/plugins";
import { CounterDoc } from "./Counter";

export const CounterDataType: DataTypeImplementation<CounterDoc> = {
  init: (doc: CounterDoc) => {
    doc.title = "My Counter";
    doc.value = 0;
  },
  getTitle(doc: CounterDoc) {
    return doc.title || "Counter";
  },
};

