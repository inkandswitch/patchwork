import { template, insert, addEventListener, setStyleProperty, createComponent, effect, delegateEvents, memo, use, getOwner, spread, mergeProps } from "solid-js/web";
import { useContext, createContext, createResource, createEffect, createSignal, Show, For, onMount, onCleanup, createMemo } from "solid-js";
import "solid-js/store";
import { _ as __vitePreload } from "./index-BQfELDrz.js";
const STATE = Symbol.for("_am_meta");
const TRACE = Symbol.for("_am_trace");
const OBJECT_ID = Symbol.for("_am_objectId");
const IS_PROXY = Symbol.for("_am_isProxy");
const CLEAR_CACHE = Symbol.for("_am_clearCache");
const UINT = Symbol.for("_am_uint");
const INT = Symbol.for("_am_int");
const F64 = Symbol.for("_am_f64");
const COUNTER = Symbol.for("_am_counter");
const IMMUTABLE_STRING = Symbol.for("_am_immutableString");
class Counter {
  constructor(value) {
    this.value = value || 0;
    Reflect.defineProperty(this, COUNTER, { value: true });
  }
  /**
   * A peculiar JavaScript language feature from its early days: if the object
   * `x` has a `valueOf()` method that returns a number, you can use numerical
   * operators on the object `x` directly, such as `x + 1` or `x < 4`.
   * This method is also called when coercing a value to a string by
   * concatenating it with another string, as in `x + ''`.
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf
   */
  valueOf() {
    return this.value;
  }
  /**
   * Returns the counter value as a decimal string. If `x` is a counter object,
   * this method is called e.g. when you do `['value: ', x].join('')` or when
   * you use string interpolation: `value: ${x}`.
   */
  toString() {
    return this.valueOf().toString();
  }
  /**
   * Returns the counter value, so that a JSON serialization of an Automerge
   * document represents the counter simply as an integer.
   */
  toJSON() {
    return this.value;
  }
  /**
   * Increases the value of the counter by `delta`. If `delta` is not given,
   * increases the value of the counter by 1.
   *
   * Will throw an error if used outside of a change callback.
   */
  increment(_delta) {
    throw new Error("Counters should not be incremented outside of a change callback");
  }
  /**
   * Decreases the value of the counter by `delta`. If `delta` is not given,
   * decreases the value of the counter by 1.
   *
   * Will throw an error if used outside of a change callback.
   */
  decrement(_delta) {
    throw new Error("Counters should not be decremented outside of a change callback");
  }
}
class WriteableCounter extends Counter {
  constructor(value, context, path, objectId, key) {
    super(value);
    this.context = context;
    this.path = path;
    this.objectId = objectId;
    this.key = key;
  }
  /**
   * Increases the value of the counter by `delta`. If `delta` is not given,
   * increases the value of the counter by 1.
   */
  increment(delta) {
    delta = typeof delta === "number" ? delta : 1;
    this.context.increment(this.objectId, this.key, delta);
    this.value += delta;
    return this.value;
  }
  /**
   * Decreases the value of the counter by `delta`. If `delta` is not given,
   * decreases the value of the counter by 1.
   */
  decrement(delta) {
    return this.increment(typeof delta === "number" ? -delta : -1);
  }
}
function getWriteableCounter(value, context, path, objectId, key) {
  return new WriteableCounter(value, context, path, objectId, key);
}
var _a;
class ImmutableString {
  constructor(val) {
    this[_a] = true;
    this.val = val;
  }
  /**
   * Returns the content of the ImmutableString object as a simple string
   */
  toString() {
    return this.val;
  }
  toJSON() {
    return this.val;
  }
}
_a = IMMUTABLE_STRING;
function parseListIndex(key) {
  if (typeof key === "string" && /^[0-9]+$/.test(key))
    key = parseInt(key, 10);
  if (typeof key !== "number") {
    return key;
  }
  if (key < 0 || isNaN(key) || key === Infinity || key === -Infinity) {
    throw new RangeError("A list index must be positive, but you passed " + key);
  }
  return key;
}
function valueAt(target, prop) {
  const { context, objectId, path } = target;
  const value = context.getWithType(objectId, prop);
  if (value === null) {
    return;
  }
  const datatype = value[0];
  const val = value[1];
  switch (datatype) {
    case void 0:
      return;
    case "map":
      return mapProxy(context, val, [...path, prop]);
    case "list":
      return listProxy(context, val, [...path, prop]);
    case "text":
      return context.text(val);
    case "str":
      return new ImmutableString(val);
    case "uint":
      return val;
    case "int":
      return val;
    case "f64":
      return val;
    case "boolean":
      return val;
    case "null":
      return null;
    case "bytes":
      return val;
    case "timestamp":
      return val;
    case "counter": {
      const counter = getWriteableCounter(val, context, path, objectId, prop);
      return counter;
    }
    default:
      throw RangeError(`datatype ${datatype} unimplemented`);
  }
}
function import_value(value, path, context) {
  const type = typeof value;
  switch (type) {
    case "object":
      if (value == null) {
        return [null, "null"];
      } else if (value[UINT]) {
        return [value.value, "uint"];
      } else if (value[INT]) {
        return [value.value, "int"];
      } else if (value[F64]) {
        return [value.value, "f64"];
      } else if (value[COUNTER]) {
        return [value.value, "counter"];
      } else if (value instanceof Date) {
        return [value.getTime(), "timestamp"];
      } else if (isImmutableString(value)) {
        return [value.toString(), "str"];
      } else if (value instanceof Uint8Array) {
        return [value, "bytes"];
      } else if (value instanceof Array) {
        return [value, "list"];
      } else if (Object.prototype.toString.call(value) === "[object Object]") {
        return [value, "map"];
      } else if (isSameDocument(value, context)) {
        throw new RangeError("Cannot create a reference to an existing document object");
      } else {
        throw new RangeError(`Cannot assign unknown object: ${value}`);
      }
    case "boolean":
      return [value, "boolean"];
    case "number":
      if (Number.isInteger(value)) {
        return [value, "int"];
      } else {
        return [value, "f64"];
      }
    case "string":
      return [value, "text"];
    case "undefined":
      throw new RangeError([
        `Cannot assign undefined value at ${printPath(path)}, `,
        "because `undefined` is not a valid JSON data type. ",
        "You might consider setting the property's value to `null`, ",
        "or using `delete` to remove it altogether."
      ].join(""));
    default:
      throw new RangeError([
        `Cannot assign ${type} value at ${printPath(path)}. `,
        `All JSON primitive datatypes (object, array, string, number, boolean, null) `,
        `are supported in an Automerge document; ${type} values are not. `
      ].join(""));
  }
}
function isSameDocument(val, context) {
  var _b, _c;
  if (val instanceof Date) {
    return false;
  }
  if (val && ((_c = (_b = val[STATE]) === null || _b === void 0 ? void 0 : _b.handle) === null || _c === void 0 ? void 0 : _c.__wbg_ptr) === context.__wbg_ptr) {
    return true;
  }
  return false;
}
const MapHandler = {
  get(target, key) {
    const { context, objectId, cache } = target;
    if (key === Symbol.toStringTag) {
      return target[Symbol.toStringTag];
    }
    if (key === OBJECT_ID)
      return objectId;
    if (key === IS_PROXY)
      return true;
    if (key === TRACE)
      return target.trace;
    if (key === STATE)
      return { handle: context };
    if (!cache[key]) {
      cache[key] = valueAt(target, key);
    }
    return cache[key];
  },
  set(target, key, val) {
    const { context, objectId, path } = target;
    target.cache = {};
    if (isSameDocument(val, context)) {
      throw new RangeError("Cannot create a reference to an existing document object");
    }
    if (key === TRACE) {
      target.trace = val;
      return true;
    }
    if (key === CLEAR_CACHE) {
      return true;
    }
    const [value, datatype] = import_value(val, [...path, key], context);
    switch (datatype) {
      case "list": {
        const list = context.putObject(objectId, key, []);
        const proxyList = listProxy(context, list, [...path, key]);
        for (let i = 0; i < value.length; i++) {
          proxyList[i] = value[i];
        }
        break;
      }
      case "text": {
        context.putObject(objectId, key, value);
        break;
      }
      case "map": {
        const map = context.putObject(objectId, key, {});
        const proxyMap = mapProxy(context, map, [...path, key]);
        for (const key2 in value) {
          proxyMap[key2] = value[key2];
        }
        break;
      }
      default:
        context.put(objectId, key, value, datatype);
    }
    return true;
  },
  deleteProperty(target, key) {
    const { context, objectId } = target;
    target.cache = {};
    context.delete(objectId, key);
    return true;
  },
  has(target, key) {
    const value = this.get(target, key);
    return value !== void 0;
  },
  getOwnPropertyDescriptor(target, key) {
    const value = this.get(target, key);
    if (typeof value !== "undefined") {
      return {
        configurable: true,
        enumerable: true,
        value
      };
    }
  },
  ownKeys(target) {
    const { context, objectId } = target;
    const keys = context.keys(objectId);
    return [...new Set(keys)];
  }
};
const ListHandler = {
  get(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    if (index === Symbol.hasInstance) {
      return (instance) => {
        return Array.isArray(instance);
      };
    }
    if (index === Symbol.toStringTag) {
      return target[Symbol.toStringTag];
    }
    if (index === OBJECT_ID)
      return objectId;
    if (index === IS_PROXY)
      return true;
    if (index === TRACE)
      return target.trace;
    if (index === STATE)
      return { handle: context };
    if (index === "length")
      return context.length(objectId);
    if (typeof index === "number") {
      return valueAt(target, index);
    } else {
      return listMethods(target)[index];
    }
  },
  set(target, index, val) {
    const { context, objectId, path } = target;
    index = parseListIndex(index);
    if (isSameDocument(val, context)) {
      throw new RangeError("Cannot create a reference to an existing document object");
    }
    if (index === CLEAR_CACHE) {
      return true;
    }
    if (index === TRACE) {
      target.trace = val;
      return true;
    }
    if (typeof index == "string") {
      throw new RangeError("list index must be a number");
    }
    const [value, datatype] = import_value(val, [...path, index], context);
    switch (datatype) {
      case "list": {
        let list;
        if (index >= context.length(objectId)) {
          list = context.insertObject(objectId, index, []);
        } else {
          list = context.putObject(objectId, index, []);
        }
        const proxyList = listProxy(context, list, [...path, index]);
        proxyList.splice(0, 0, ...value);
        break;
      }
      case "text": {
        if (index >= context.length(objectId)) {
          context.insertObject(objectId, index, value);
        } else {
          context.putObject(objectId, index, value);
        }
        break;
      }
      case "map": {
        let map;
        if (index >= context.length(objectId)) {
          map = context.insertObject(objectId, index, {});
        } else {
          map = context.putObject(objectId, index, {});
        }
        const proxyMap = mapProxy(context, map, [...path, index]);
        for (const key in value) {
          proxyMap[key] = value[key];
        }
        break;
      }
      default:
        if (index >= context.length(objectId)) {
          context.insert(objectId, index, value, datatype);
        } else {
          context.put(objectId, index, value, datatype);
        }
    }
    return true;
  },
  deleteProperty(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    const elem = context.get(objectId, index);
    if (elem != null && elem[0] == "counter") {
      throw new TypeError("Unsupported operation: deleting a counter from a list");
    }
    context.delete(objectId, index);
    return true;
  },
  has(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    if (typeof index === "number") {
      return index < context.length(objectId);
    }
    return index === "length";
  },
  getOwnPropertyDescriptor(target, index) {
    const { context, objectId } = target;
    if (index === "length")
      return { writable: true, value: context.length(objectId) };
    if (index === OBJECT_ID)
      return { configurable: false, enumerable: false, value: objectId };
    index = parseListIndex(index);
    const value = valueAt(target, index);
    return { configurable: true, enumerable: true, value };
  },
  getPrototypeOf(target) {
    return Object.getPrototypeOf(target);
  },
  ownKeys() {
    const keys = [];
    keys.push("length");
    return keys;
  }
};
Object.assign({}, ListHandler, {
  get(target, index) {
    const { context, objectId } = target;
    index = parseListIndex(index);
    if (index === Symbol.hasInstance) {
      return (instance) => {
        return Array.isArray(instance);
      };
    }
    if (index === Symbol.toStringTag) {
      return target[Symbol.toStringTag];
    }
    if (index === OBJECT_ID)
      return objectId;
    if (index === IS_PROXY)
      return true;
    if (index === TRACE)
      return target.trace;
    if (index === STATE)
      return { handle: context };
    if (index === "length")
      return context.length(objectId);
    if (typeof index === "number") {
      return valueAt(target, index);
    } else {
      return textMethods(target)[index] || listMethods(target)[index];
    }
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(new Text());
  }
});
function mapProxy(context, objectId, path) {
  const target = {
    context,
    objectId,
    path: path || [],
    cache: {}
  };
  const proxied = {};
  Object.assign(proxied, target);
  const result = new Proxy(proxied, MapHandler);
  return result;
}
function listProxy(context, objectId, path) {
  const target = {
    context,
    objectId,
    path: path || [],
    cache: {}
  };
  const proxied = [];
  Object.assign(proxied, target);
  return new Proxy(proxied, ListHandler);
}
function listMethods(target) {
  const { context, objectId, path } = target;
  const methods = {
    at(index) {
      return valueAt(target, index);
    },
    deleteAt(index, numDelete) {
      if (typeof numDelete === "number") {
        context.splice(objectId, index, numDelete);
      } else {
        context.delete(objectId, index);
      }
      return this;
    },
    fill(val, start, end) {
      const [value, datatype] = import_value(val, [...path, start], context);
      const length = context.length(objectId);
      start = parseListIndex(start || 0);
      end = parseListIndex(end || length);
      for (let i = start; i < Math.min(end, length); i++) {
        if (datatype === "list" || datatype === "map") {
          context.putObject(objectId, i, value);
        } else if (datatype === "text") {
          context.putObject(objectId, i, value);
        } else {
          context.put(objectId, i, value, datatype);
        }
      }
      return this;
    },
    indexOf(searchElement, start = 0) {
      const length = context.length(objectId);
      for (let i = start; i < length; i++) {
        const valueWithType = context.getWithType(objectId, i);
        if (!valueWithType) {
          continue;
        }
        const [valType, value] = valueWithType;
        const isObject = ["map", "list", "text"].includes(valType);
        if (!isObject) {
          if (value === searchElement) {
            return i;
          } else {
            continue;
          }
        }
        if (valType === "text" && typeof searchElement === "string") {
          if (searchElement === valueAt(target, i)) {
            return i;
          }
        }
        if (searchElement[OBJECT_ID] === value) {
          return i;
        }
      }
      return -1;
    },
    insertAt(index, ...values) {
      this.splice(index, 0, ...values);
      return this;
    },
    pop() {
      const length = context.length(objectId);
      if (length == 0) {
        return void 0;
      }
      const last = valueAt(target, length - 1);
      context.delete(objectId, length - 1);
      return last;
    },
    push(...values) {
      const len = context.length(objectId);
      this.splice(len, 0, ...values);
      return context.length(objectId);
    },
    shift() {
      if (context.length(objectId) == 0)
        return;
      const first = valueAt(target, 0);
      context.delete(objectId, 0);
      return first;
    },
    splice(index, del, ...vals) {
      index = parseListIndex(index);
      if (typeof del !== "number") {
        del = context.length(objectId) - index;
      }
      del = parseListIndex(del);
      for (const val of vals) {
        if (isSameDocument(val, context)) {
          throw new RangeError("Cannot create a reference to an existing document object");
        }
      }
      const result = [];
      for (let i = 0; i < del; i++) {
        const value = valueAt(target, index);
        if (value !== void 0) {
          result.push(value);
        }
        context.delete(objectId, index);
      }
      const values = vals.map((val, index2) => {
        try {
          return import_value(val, [...path], context);
        } catch (e) {
          if (e instanceof RangeError) {
            throw new RangeError(`${e.message} (at index ${index2} in the input)`);
          } else {
            throw e;
          }
        }
      });
      for (const [value, datatype] of values) {
        switch (datatype) {
          case "list": {
            const list = context.insertObject(objectId, index, []);
            const proxyList = listProxy(context, list, [...path, index]);
            proxyList.splice(0, 0, ...value);
            break;
          }
          case "text": {
            context.insertObject(objectId, index, value);
            break;
          }
          case "map": {
            const map = context.insertObject(objectId, index, {});
            const proxyMap = mapProxy(context, map, [...path, index]);
            for (const key in value) {
              proxyMap[key] = value[key];
            }
            break;
          }
          default:
            context.insert(objectId, index, value, datatype);
        }
        index += 1;
      }
      return result;
    },
    unshift(...values) {
      this.splice(0, 0, ...values);
      return context.length(objectId);
    },
    entries() {
      let i = 0;
      const iterator = {
        next: () => {
          const value = valueAt(target, i);
          if (value === void 0) {
            return { value: void 0, done: true };
          } else {
            return { value: [i++, value], done: false };
          }
        },
        [Symbol.iterator]() {
          return this;
        }
      };
      return iterator;
    },
    keys() {
      let i = 0;
      const len = context.length(objectId);
      const iterator = {
        next: () => {
          if (i < len) {
            return { value: i++, done: false };
          }
          return { value: void 0, done: true };
        },
        [Symbol.iterator]() {
          return this;
        }
      };
      return iterator;
    },
    values() {
      let i = 0;
      const iterator = {
        next: () => {
          const value = valueAt(target, i++);
          if (value === void 0) {
            return { value: void 0, done: true };
          } else {
            return { value, done: false };
          }
        },
        [Symbol.iterator]() {
          return this;
        }
      };
      return iterator;
    },
    toArray() {
      const list = [];
      let value;
      do {
        value = valueAt(target, list.length);
        if (value !== void 0) {
          list.push(value);
        }
      } while (value !== void 0);
      return list;
    },
    map(f) {
      return this.toArray().map(f);
    },
    toString() {
      return this.toArray().toString();
    },
    toLocaleString() {
      return this.toArray().toLocaleString();
    },
    forEach(f) {
      return this.toArray().forEach(f);
    },
    // todo: real concat function is different
    concat(other) {
      return this.toArray().concat(other);
    },
    every(f) {
      return this.toArray().every(f);
    },
    filter(f) {
      return this.toArray().filter(f);
    },
    find(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return v;
        }
        index += 1;
      }
    },
    findIndex(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return index;
        }
        index += 1;
      }
      return -1;
    },
    includes(elem) {
      return this.find((e) => e === elem) !== void 0;
    },
    join(sep) {
      return this.toArray().join(sep);
    },
    reduce(f, initialValue) {
      return this.toArray().reduce(f, initialValue);
    },
    reduceRight(f, initialValue) {
      return this.toArray().reduceRight(f, initialValue);
    },
    lastIndexOf(search, fromIndex = Infinity) {
      return this.toArray().lastIndexOf(search, fromIndex);
    },
    slice(index, num) {
      return this.toArray().slice(index, num);
    },
    some(f) {
      let index = 0;
      for (const v of this) {
        if (f(v, index)) {
          return true;
        }
        index += 1;
      }
      return false;
    },
    [Symbol.iterator]: function* () {
      let i = 0;
      let value = valueAt(target, i);
      while (value !== void 0) {
        yield value;
        i += 1;
        value = valueAt(target, i);
      }
    }
  };
  return methods;
}
function textMethods(target) {
  const { context, objectId } = target;
  const methods = {
    set(index, value) {
      return this[index] = value;
    },
    get(index) {
      return this[index];
    },
    toString() {
      return context.text(objectId).replace(/￼/g, "");
    },
    toSpans() {
      const spans = [];
      let chars = "";
      const length = context.length(objectId);
      for (let i = 0; i < length; i++) {
        const value = this[i];
        if (typeof value === "string") {
          chars += value;
        } else {
          if (chars.length > 0) {
            spans.push(chars);
            chars = "";
          }
          spans.push(value);
        }
      }
      if (chars.length > 0) {
        spans.push(chars);
      }
      return spans;
    },
    toJSON() {
      return this.toString();
    },
    indexOf(o, start = 0) {
      const text = context.text(objectId);
      return text.indexOf(o, start);
    },
    insertAt(index, ...values) {
      if (values.every((v) => typeof v === "string")) {
        context.splice(objectId, index, 0, values.join(""));
      } else {
        listMethods(target).insertAt(index, ...values);
      }
    }
  };
  return methods;
}
function printPath(path) {
  const jsonPointerComponents = path.map((component) => {
    if (typeof component === "number") {
      return component.toString();
    } else if (typeof component === "string") {
      return component.replace(/~/g, "~0").replace(/\//g, "~1");
    }
  });
  if (path.length === 0) {
    return "";
  } else {
    return "/" + jsonPointerComponents.join("/");
  }
}
function isImmutableString(obj) {
  return typeof obj === "object" && obj !== null && Object.prototype.hasOwnProperty.call(obj, IMMUTABLE_STRING);
}
let wasm;
const cachedTextEncoder = typeof TextEncoder !== "undefined" ? new TextEncoder("utf-8") : { encode: () => {
  throw Error("TextEncoder not available");
} };
typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
  return cachedTextEncoder.encodeInto(arg, view);
} : function(arg, view) {
  const buf = cachedTextEncoder.encode(arg);
  view.set(buf);
  return {
    read: arg.length,
    written: buf.length
  };
};
const cachedTextDecoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-8", { ignoreBOM: true, fatal: true }) : { decode: () => {
  throw Error("TextDecoder not available");
} };
if (typeof TextDecoder !== "undefined") {
  cachedTextDecoder.decode();
}
typeof FinalizationRegistry === "undefined" ? {} : new FinalizationRegistry((ptr) => wasm.__wbg_automerge_free(ptr >>> 0, 1));
typeof FinalizationRegistry === "undefined" ? {} : new FinalizationRegistry((ptr) => wasm.__wbg_syncstate_free(ptr >>> 0, 1));
const RepoContext = createContext(
  null
);
const readyStates = ["ready", "deleted", "unavailable"];
const badStates = ["deleted", "unavailable"];
function useDocHandle(url, options) {
  const contextRepo = useContext(RepoContext);
  if (!options?.repo && !contextRepo) {
    throw new Error("use outside <RepoContext> requires options.repo");
  }
  const repo = options?.repo || contextRepo;
  function getExistingHandle() {
    if (options?.["~skipInitialValue"]) return void 0;
    const unwrappedURL = typeof url == "function" ? url() : url;
    if (!unwrappedURL) return void 0;
    try {
      const documentId = new URL(unwrappedURL).pathname;
      const existingHandle = repo.handles[documentId];
      if (existingHandle?.isReady()) {
        return existingHandle;
      }
    } catch (error) {
      console.error("Error parsing URL:", error);
    }
  }
  const [handle, { mutate }] = createResource(
    url,
    async (url2) => {
      const handle2 = await repo.find(url2, {
        allowableStates: readyStates
      });
      const reject = (state) => Promise.reject(new Error(`document not available: [${state}]`));
      if (handle2.isReady()) {
        return handle2;
      } else if (handle2.inState(badStates)) {
        return reject(handle2.state);
      }
      return handle2.whenReady(readyStates).then(() => {
        if (handle2.isReady()) {
          return handle2;
        }
        return reject(handle2.state);
      });
    },
    {
      initialValue: getExistingHandle()
    }
  );
  createEffect(() => {
    const unwrappedURL = typeof url == "function" ? url() : url;
    if (!unwrappedURL) {
      mutate();
    }
  });
  return handle;
}
const STORAGE_PREFIX = "patchwork-space-layout:";
const CELL_SIZE_KEY = "patchwork-space-cell-size";
function getLayoutKey(accountUrl) {
  return `${STORAGE_PREFIX}${accountUrl}`;
}
function loadLayout(accountUrl) {
  try {
    const raw = localStorage.getItem(getLayoutKey(accountUrl));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function saveLayout(accountUrl, layout) {
  localStorage.setItem(getLayoutKey(accountUrl), JSON.stringify(layout));
}
function getTargetCellSize() {
  const stored = localStorage.getItem(CELL_SIZE_KEY);
  return stored ? Number(stored) : 80;
}
function computeGrid(width, height, targetSize) {
  const size = targetSize ?? getTargetCellSize();
  return {
    cols: Math.max(4, Math.round(width / size)),
    rows: Math.max(4, Math.round(height / size))
  };
}
const ELEMENT_NAME$1 = "patchwork-space";
const observedAttrs = [
  "col",
  "row",
  "cols",
  "rows",
  "collapsible",
  "collapsed",
  "data-editing"
];
class PatchworkSpaceElement extends HTMLElement {
  static observedAttributes = [...observedAttrs];
  #resizeObserver = null;
  #mutationObserver = null;
  #gridCols = 0;
  #gridRows = 0;
  get isRoot() {
    return !(this.parentElement instanceof PatchworkSpaceElement);
  }
  get isGroup() {
    return this.querySelector(`:scope > ${ELEMENT_NAME$1}`) !== null;
  }
  get isEditing() {
    return this.hasAttribute("data-editing");
  }
  get col() {
    return Number(this.getAttribute("col") ?? 0);
  }
  set col(v) {
    this.setAttribute("col", String(v));
  }
  get row() {
    return Number(this.getAttribute("row") ?? 0);
  }
  set row(v) {
    this.setAttribute("row", String(v));
  }
  get cols() {
    return Number(this.getAttribute("cols") ?? 1);
  }
  set cols(v) {
    this.setAttribute("cols", String(v));
  }
  get rows() {
    return Number(this.getAttribute("rows") ?? 1);
  }
  set rows(v) {
    this.setAttribute("rows", String(v));
  }
  get collapsible() {
    return this.hasAttribute("collapsible");
  }
  set collapsible(v) {
    if (v === false) {
      this.removeAttribute("collapsible");
    } else {
      this.setAttribute("collapsible", "");
    }
  }
  get collapsed() {
    return this.hasAttribute("collapsed");
  }
  set collapsed(v) {
    if (v === false) {
      this.removeAttribute("collapsed");
    } else {
      this.setAttribute("collapsed", "");
    }
  }
  get gridCols() {
    return this.#gridCols;
  }
  get gridRows() {
    return this.#gridRows;
  }
  connectedCallback() {
    this.#applyStyles();
    this.#mutationObserver = new MutationObserver(() => this.#applyStyles());
    this.#mutationObserver.observe(this, { childList: true });
    if (this.isRoot) {
      this.#resizeObserver = new ResizeObserver(() => this.#onResize());
      this.#resizeObserver.observe(this);
      this.#onResize();
    }
  }
  disconnectedCallback() {
    this.#resizeObserver?.disconnect();
    this.#resizeObserver = null;
    this.#mutationObserver?.disconnect();
    this.#mutationObserver = null;
  }
  attributeChangedCallback(_name) {
    this.#applyStyles();
  }
  #onResize() {
    const rect = this.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const { cols, rows } = computeGrid(rect.width, rect.height, getTargetCellSize());
    this.#gridCols = cols;
    this.#gridRows = rows;
    this.style.setProperty("--grid-cols", String(cols));
    this.style.setProperty("--grid-rows", String(rows));
    this.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    this.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    this.dispatchEvent(
      new CustomEvent("space:grid-resize", {
        detail: { cols, rows },
        bubbles: true
      })
    );
  }
  #applyStyles() {
    this.style.display = "grid";
    this.style.position = "relative";
    if (this.isRoot) {
      this.style.width = "100%";
      this.style.height = "100%";
      this.style.overflow = "hidden";
      this.style.gap = this.isEditing ? "8px" : "0px";
      this.style.padding = this.isEditing ? "8px" : "0px";
    } else {
      this.style.gridColumn = `${this.col + 1} / span ${this.cols}`;
      this.style.gridRow = `${this.row + 1} / span ${this.rows}`;
      this.style.overflow = this.isEditing ? "visible" : "hidden";
      if (this.isGroup) {
        this.style.gridTemplateColumns = "subgrid";
        this.style.gridTemplateRows = "subgrid";
      } else {
        this.style.gridTemplateColumns = "1fr";
        this.style.gridTemplateRows = "1fr";
      }
    }
    if (this.collapsed) {
      this.style.minWidth = "0";
      this.style.minHeight = "0";
    }
  }
}
function registerPatchworkSpaceElement() {
  if (customElements.get(ELEMENT_NAME$1)) return;
  customElements.define(ELEMENT_NAME$1, PatchworkSpaceElement);
}
const ELEMENT_NAME = "patchwork-preview";
class PatchworkPreviewElement extends HTMLElement {
  #iframe = null;
  #currentBlobUrl = null;
  get value() {
    return null;
  }
  set value(v) {
    if (!this.#iframe) return;
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }
    if (v === null) {
      this.#iframe.removeAttribute("src");
      this.#iframe.removeAttribute("srcdoc");
      return;
    }
    if (typeof v === "string") {
      this.#iframe.removeAttribute("src");
      this.#iframe.srcdoc = v;
    } else if (v instanceof Blob) {
      this.#iframe.removeAttribute("srcdoc");
      this.#currentBlobUrl = URL.createObjectURL(v);
      this.#iframe.src = this.#currentBlobUrl;
    }
  }
  connectedCallback() {
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";
    this.#iframe = document.createElement("iframe");
    this.#iframe.style.cssText = "width:100%;height:100%;border:none;background:#fff;";
    this.#iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.appendChild(this.#iframe);
  }
  disconnectedCallback() {
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }
    this.#iframe = null;
  }
}
function registerPatchworkPreviewElement() {
  if (customElements.get(ELEMENT_NAME)) return;
  customElements.define(ELEMENT_NAME, PatchworkPreviewElement);
}
function createDefaultLayout(accountDocUrl, config, gridCols, gridRows) {
  const sidebarCols = Math.max(2, Math.round(gridCols * 0.17));
  const contextCols = Math.max(2, Math.round(gridCols * 0.17));
  const centerCols = gridCols - sidebarCols - contextCols;
  const toolbarRows = 1;
  const mainRows = gridRows - toolbarRows;
  const sidebar = {
    id: "sidebar",
    col: 0,
    row: 0,
    cols: sidebarCols,
    rows: gridRows,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.accountSidebarToolId,
      docUrl: accountDocUrl
    }
  };
  const toolbar = {
    id: "toolbar",
    col: 0,
    row: 0,
    cols: centerCols,
    rows: toolbarRows,
    content: {
      type: "view",
      toolId: "document-toolbar-group"
    }
  };
  const main = {
    id: "main",
    col: 0,
    row: toolbarRows,
    cols: centerCols,
    rows: mainRows,
    content: { type: "view" }
  };
  const center = {
    id: "center",
    col: sidebarCols,
    row: 0,
    cols: centerCols,
    rows: gridRows,
    content: {
      type: "group",
      children: [toolbar, main],
      pipes: []
    }
  };
  const context = {
    id: "context",
    col: sidebarCols + centerCols,
    row: 0,
    cols: contextCols,
    rows: gridRows,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.contextSidebarToolId,
      docUrl: accountDocUrl
    }
  };
  return {
    items: [sidebar, center, context],
    pipes: []
  };
}
const transforms = /* @__PURE__ */ new Map();
function registerTransform(descriptor) {
  transforms.set(descriptor.type, descriptor);
}
function getAvailableTransforms() {
  return Array.from(transforms.values());
}
async function runTransformChain(types, doc) {
  let value = doc;
  for (const type of types) {
    const transform = transforms.get(type);
    if (!transform) {
      console.warn(`Transform "${type}" not found, skipping`);
      continue;
    }
    value = await transform.run(value);
  }
  return value;
}
var _tmpl$$2 = /* @__PURE__ */ template(`<div style=margin-top:4px><button class=add-space-picker-item>Cancel`), _tmpl$2$2 = /* @__PURE__ */ template(`<div class=pipe-editor><div class=pipe-editor-header><span> → </span><button style=font-size:16px>x</button></div><div class=pipe-editor-body></div><div class=pipe-editor-actions><button class=pipe-editor-action-btn>Flip direction</button><button class="pipe-editor-action-btn pipe-editor-action-btn--danger">Delete`), _tmpl$3$2 = /* @__PURE__ */ template(`<div style=text-align:center;font-size:13px>No transforms — data passes through unchanged`), _tmpl$4$2 = /* @__PURE__ */ template(`<div class=pipe-editor-transform><span></span><button class=pipe-editor-transform-remove>x`), _tmpl$5$2 = /* @__PURE__ */ template(`<button class=pipe-editor-add-btn>+ Add transform`), _tmpl$6$1 = /* @__PURE__ */ template(`<button class=add-space-picker-item>`);
function PipeEditorPopover(props) {
  const [showTransformPicker, setShowTransformPicker] = createSignal(false);
  const available = getAvailableTransforms();
  function addTransform(type) {
    const step = {
      id: `step-${Date.now()}`,
      type
    };
    props.onUpdate({
      ...props.pipe,
      transforms: [...props.pipe.transforms, step]
    });
    setShowTransformPicker(false);
  }
  function removeTransform(stepId) {
    props.onUpdate({
      ...props.pipe,
      transforms: props.pipe.transforms.filter((t) => t.id !== stepId)
    });
  }
  function flipDirection() {
    props.onUpdate({
      ...props.pipe,
      from: props.pipe.to,
      to: props.pipe.from
    });
  }
  const left = () => Math.min(props.screenX, window.innerWidth - 280);
  const top = () => Math.min(props.screenY, window.innerHeight - 300);
  return (() => {
    var _el$ = _tmpl$2$2(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.firstChild, _el$5 = _el$3.nextSibling, _el$6 = _el$2.nextSibling, _el$9 = _el$6.nextSibling, _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling;
    insert(_el$3, () => props.pipe.from, _el$4);
    insert(_el$3, () => props.pipe.to, null);
    addEventListener(_el$5, "click", props.onClose, true);
    setStyleProperty(_el$5, "background", "none");
    setStyleProperty(_el$5, "border", "none");
    setStyleProperty(_el$5, "cursor", "pointer");
    setStyleProperty(_el$5, "color", "#999");
    insert(_el$6, createComponent(Show, {
      get when() {
        return props.pipe.transforms.length > 0;
      },
      get fallback() {
        return (() => {
          var _el$10 = _tmpl$3$2();
          setStyleProperty(_el$10, "padding", "12px");
          setStyleProperty(_el$10, "color", "#999");
          return _el$10;
        })();
      },
      get children() {
        return createComponent(For, {
          get each() {
            return props.pipe.transforms;
          },
          children: (step) => (() => {
            var _el$11 = _tmpl$4$2(), _el$12 = _el$11.firstChild, _el$13 = _el$12.nextSibling;
            insert(_el$12, () => step.type);
            _el$13.$$click = () => removeTransform(step.id);
            return _el$11;
          })()
        });
      }
    }), null);
    insert(_el$6, createComponent(Show, {
      get when() {
        return showTransformPicker();
      },
      get fallback() {
        return (() => {
          var _el$14 = _tmpl$5$2();
          _el$14.$$click = () => setShowTransformPicker(true);
          return _el$14;
        })();
      },
      get children() {
        var _el$7 = _tmpl$$2(), _el$8 = _el$7.firstChild;
        insert(_el$7, createComponent(For, {
          each: available,
          children: (t) => (() => {
            var _el$15 = _tmpl$6$1();
            _el$15.$$click = () => addTransform(t.type);
            insert(_el$15, () => t.name);
            return _el$15;
          })()
        }), _el$8);
        _el$8.$$click = () => setShowTransformPicker(false);
        setStyleProperty(_el$8, "color", "#999");
        return _el$7;
      }
    }), null);
    _el$0.$$click = flipDirection;
    _el$1.$$click = () => props.onDelete(props.pipe.id);
    effect((_p$) => {
      var _v$ = `${left()}px`, _v$2 = `${top()}px`;
      _v$ !== _p$.e && setStyleProperty(_el$, "left", _p$.e = _v$);
      _v$2 !== _p$.t && setStyleProperty(_el$, "top", _p$.t = _v$2);
      return _p$;
    }, {
      e: void 0,
      t: void 0
    });
    return _el$;
  })();
}
delegateEvents(["click"]);
var _tmpl$$1 = /* @__PURE__ */ template(`<div class=edit-overlay><div class=edit-top-bar><button class=edit-reset-btn>Reset Layout</button><button class=edit-done-btn>Done</button></div><button class=add-space-btn title="Add a new space">+`), _tmpl$2$1 = /* @__PURE__ */ template(`<button class=pipe-connection-point title="Add pipe">+`), _tmpl$3$1 = /* @__PURE__ */ template(`<button class=pipe-indicator>`), _tmpl$4$1 = /* @__PURE__ */ template(`<div class=edit-backdrop>`), _tmpl$5$1 = /* @__PURE__ */ template(`<div class=add-space-picker><button class=add-space-picker-item>View (tool + document)</button><button class=add-space-picker-item>Preview (pipe target)`);
function EditModeOverlay(props) {
  const [addPicker, setAddPicker] = createSignal(null);
  const [pipeEditor, setPipeEditor] = createSignal(null);
  const [connectionPositions, setConnectionPositions] = createSignal([]);
  function findAllLeafItems(items) {
    const result = [];
    for (const item of items) {
      if (item.content.type === "group") {
        result.push(...findAllLeafItems(item.content.children));
      } else {
        result.push(item);
      }
    }
    return result;
  }
  function findAdjacentPairs(items) {
    const leaves = findAllLeafItems(items);
    const pairs = [];
    for (let i = 0; i < leaves.length; i++) {
      for (let j = i + 1; j < leaves.length; j++) {
        const a = leaves[i];
        const b = leaves[j];
        if (a.col + a.cols === b.col && a.row < b.row + b.rows && b.row < a.row + a.rows) {
          pairs.push({
            left: a,
            right: b,
            orientation: "horizontal"
          });
        } else if (b.col + b.cols === a.col && a.row < b.row + b.rows && b.row < a.row + a.rows) {
          pairs.push({
            left: b,
            right: a,
            orientation: "horizontal"
          });
        }
        if (a.row + a.rows === b.row && a.col < b.col + b.cols && b.col < a.col + a.cols) {
          pairs.push({
            left: a,
            right: b,
            orientation: "vertical"
          });
        } else if (b.row + b.rows === a.row && a.col < b.col + b.cols && b.col < a.col + a.cols) {
          pairs.push({
            left: b,
            right: a,
            orientation: "vertical"
          });
        }
      }
    }
    return pairs;
  }
  function computeConnectionPositions() {
    const root = document.getElementById("space-root");
    if (!root) return;
    const pairs = findAdjacentPairs(props.layout.items);
    const positions = [];
    for (const pair of pairs) {
      const leftEl = root.querySelector(`[data-space-id="${pair.left.id}"]`);
      const rightEl = root.querySelector(`[data-space-id="${pair.right.id}"]`);
      if (!leftEl || !rightEl) continue;
      const lr = leftEl.getBoundingClientRect();
      const rr = rightEl.getBoundingClientRect();
      let x, y;
      if (pair.orientation === "horizontal") {
        x = (lr.right + rr.left) / 2;
        y = Math.max(lr.top, rr.top) + (Math.min(lr.bottom, rr.bottom) - Math.max(lr.top, rr.top)) / 2;
      } else {
        x = Math.max(lr.left, rr.left) + (Math.min(lr.right, rr.right) - Math.max(lr.left, rr.left)) / 2;
        y = (lr.bottom + rr.top) / 2;
      }
      positions.push({
        pair,
        x,
        y
      });
    }
    setConnectionPositions(positions);
  }
  onMount(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => computeConnectionPositions()));
  });
  createEffect(() => {
    props.layout;
    requestAnimationFrame(() => computeConnectionPositions());
  });
  function getAllPipes(layout) {
    const pipes = [...layout.pipes];
    function collect(items) {
      for (const item of items) {
        if (item.content.type === "group") {
          pipes.push(...item.content.pipes);
          collect(item.content.children);
        }
      }
    }
    collect(layout.items);
    return pipes;
  }
  function findPipeForPair(from, to) {
    return getAllPipes(props.layout).find((p) => p.from === from && p.to === to || p.from === to && p.to === from);
  }
  function handleAddPipe(from, to) {
    props.onUpdateLayout((prev) => ({
      ...prev,
      pipes: [...prev.pipes, {
        id: `pipe-${Date.now()}`,
        from: from.id,
        to: to.id,
        transforms: []
      }]
    }));
  }
  function handleAddSpaceClick(e) {
    const root = document.getElementById("space-root");
    if (!root) return;
    const rect = root.getBoundingClientRect();
    const cellW = rect.width / props.gridDims.cols;
    const cellH = rect.height / props.gridDims.rows;
    const col = Math.floor((e.clientX - rect.left) / cellW);
    const row = Math.floor((e.clientY - rect.top) / cellH);
    const screenX = Math.min(e.clientX, window.innerWidth - 220);
    const screenY = Math.min(e.clientY, window.innerHeight - 120);
    setAddPicker({
      col,
      row,
      screenX,
      screenY
    });
  }
  function handleAddSpace(col, row, type) {
    props.onUpdateLayout((prev) => ({
      ...prev,
      items: [...prev.items, {
        id: `space-${Date.now()}`,
        col: Math.min(col, props.gridDims.cols - 4),
        row: Math.min(row, props.gridDims.rows - 4),
        cols: 4,
        rows: 4,
        content: type === "preview" ? {
          type: "preview"
        } : {
          type: "view"
        }
      }]
    }));
    setAddPicker(null);
  }
  return (() => {
    var _el$ = _tmpl$$1(), _el$2 = _el$.firstChild, _el$3 = _el$2.firstChild, _el$4 = _el$3.nextSibling, _el$5 = _el$2.nextSibling;
    addEventListener(_el$3, "click", props.onReset, true);
    addEventListener(_el$4, "click", props.onDone, true);
    insert(_el$, createComponent(For, {
      get each() {
        return connectionPositions();
      },
      children: (conn) => {
        const existingPipe = () => findPipeForPair(conn.pair.left.id, conn.pair.right.id);
        return createComponent(Show, {
          get when() {
            return existingPipe();
          },
          get fallback() {
            return (() => {
              var _el$6 = _tmpl$2$1();
              _el$6.$$click = () => handleAddPipe(conn.pair.left, conn.pair.right);
              effect((_p$) => {
                var _v$ = `${conn.x - 12}px`, _v$2 = `${conn.y - 12}px`;
                _v$ !== _p$.e && setStyleProperty(_el$6, "left", _p$.e = _v$);
                _v$2 !== _p$.t && setStyleProperty(_el$6, "top", _p$.t = _v$2);
                return _p$;
              }, {
                e: void 0,
                t: void 0
              });
              return _el$6;
            })();
          },
          children: (pipe) => (() => {
            var _el$7 = _tmpl$3$1();
            _el$7.$$click = (e) => setPipeEditor({
              pipe: pipe(),
              screenX: e.clientX,
              screenY: e.clientY
            });
            insert(_el$7, (() => {
              var _c$ = memo(() => pipe().transforms.length > 0);
              return () => _c$() ? pipe().transforms.map((t) => t.type).join(" → ") : "→";
            })());
            effect((_p$) => {
              var _v$3 = `${conn.x - 20}px`, _v$4 = `${conn.y - 12}px`;
              _v$3 !== _p$.e && setStyleProperty(_el$7, "left", _p$.e = _v$3);
              _v$4 !== _p$.t && setStyleProperty(_el$7, "top", _p$.t = _v$4);
              return _p$;
            }, {
              e: void 0,
              t: void 0
            });
            return _el$7;
          })()
        });
      }
    }), _el$5);
    _el$5.$$click = handleAddSpaceClick;
    setStyleProperty(_el$5, "bottom", "20px");
    setStyleProperty(_el$5, "right", "20px");
    insert(_el$, createComponent(Show, {
      get when() {
        return addPicker();
      },
      children: (picker) => [(() => {
        var _el$8 = _tmpl$4$1();
        _el$8.$$click = () => setAddPicker(null);
        return _el$8;
      })(), (() => {
        var _el$9 = _tmpl$5$1(), _el$0 = _el$9.firstChild, _el$1 = _el$0.nextSibling;
        _el$0.$$click = () => handleAddSpace(picker().col, picker().row, "view");
        _el$1.$$click = () => handleAddSpace(picker().col, picker().row, "preview");
        effect((_p$) => {
          var _v$5 = `${picker().screenX}px`, _v$6 = `${picker().screenY}px`;
          _v$5 !== _p$.e && setStyleProperty(_el$9, "left", _p$.e = _v$5);
          _v$6 !== _p$.t && setStyleProperty(_el$9, "top", _p$.t = _v$6);
          return _p$;
        }, {
          e: void 0,
          t: void 0
        });
        return _el$9;
      })()]
    }), null);
    insert(_el$, createComponent(Show, {
      get when() {
        return pipeEditor();
      },
      children: (editor) => [(() => {
        var _el$10 = _tmpl$4$1();
        _el$10.$$click = () => setPipeEditor(null);
        return _el$10;
      })(), createComponent(PipeEditorPopover, {
        get pipe() {
          return editor().pipe;
        },
        get screenX() {
          return Math.min(editor().screenX, window.innerWidth - 280);
        },
        get screenY() {
          return Math.min(editor().screenY, window.innerHeight - 300);
        },
        onUpdate: (updatedPipe) => {
          props.onUpdateLayout((prev) => ({
            ...prev,
            pipes: prev.pipes.map((p) => p.id === updatedPipe.id ? updatedPipe : p)
          }));
          setPipeEditor((prev) => prev ? {
            ...prev,
            pipe: updatedPipe
          } : null);
        },
        onDelete: (pipeId) => {
          props.onUpdateLayout((prev) => ({
            ...prev,
            pipes: prev.pipes.filter((p) => p.id !== pipeId)
          }));
          setPipeEditor(null);
        },
        onClose: () => setPipeEditor(null)
      })]
    }), null);
    return _el$;
  })();
}
delegateEvents(["click"]);
const LATEXJS_BASE_URL = "https://cdn.jsdelivr.net/npm/latex.js/dist/";
let cachedModule = null;
async function loadLatexJs() {
  if (cachedModule) return cachedModule;
  cachedModule = await __vitePreload(() => import(
    /* @vite-ignore */
    "https://cdn.jsdelivr.net/npm/latex.js/dist/latex.mjs"
  ), true ? [] : void 0, import.meta.url);
  return cachedModule;
}
registerTransform({
  type: "latex-to-html",
  name: "LaTeX → HTML",
  description: "Renders LaTeX source to HTML using latex.js",
  async run(doc) {
    const content = typeof doc === "string" ? doc : doc?.content;
    if (!content || typeof content !== "string") {
      return "<html><body><p>No LaTeX content</p></body></html>";
    }
    try {
      const mod = await loadLatexJs();
      const generator = new mod.HtmlGenerator({ hyphenate: false });
      const parsed = mod.parse(content, { generator });
      const htmlDoc = parsed.htmlDocument(LATEXJS_BASE_URL);
      return "<!DOCTYPE html>\n" + htmlDoc.documentElement.outerHTML;
    } catch (e) {
      const msg = e.location ? `Line ${e.location.start.line}, Col ${e.location.start.column}: ${e.message}` : e.message || "Failed to render LaTeX";
      return `<!DOCTYPE html><html><body style="font-family:system-ui;padding:20px;color:#ef4444;"><h3>LaTeX Error</h3><pre>${msg}</pre></body></html>`;
    }
  }
});
registerTransform({
  type: "passthrough",
  name: "Passthrough",
  description: "Passes data through unchanged",
  run(doc) {
    if (typeof doc === "string") return doc;
    if (doc?.content && typeof doc.content === "string") return doc.content;
    return JSON.stringify(doc, null, 2);
  }
});
function PipeRunner(props) {
  let activePipes = [];
  function getAllPipes(layout) {
    const pipes = [...layout.pipes];
    function collectFromItems(items) {
      for (const item of items) {
        if (item.content.type === "group") {
          pipes.push(...item.content.pipes);
          collectFromItems(item.content.children);
        }
      }
    }
    collectFromItems(layout.items);
    return pipes;
  }
  function findSpaceElement(spaceId) {
    return props.rootElement.querySelector(`[data-space-id="${spaceId}"]`) ?? document.querySelector(`[data-space-id="${spaceId}"]`);
  }
  function getSourceDocHandle(spaceEl) {
    const view = spaceEl.querySelector("patchwork-view");
    if (!view?.docUrl || !view?.repo) return null;
    const handle = view.repo.find(view.docUrl);
    if (!handle) return null;
    return {
      handle,
      view
    };
  }
  function getTargetPreview(spaceEl) {
    return spaceEl.querySelector("patchwork-preview");
  }
  async function executePipe(pipe) {
    if (pipe.transforms.length === 0) return null;
    const sourceEl = findSpaceElement(pipe.from);
    const targetEl = findSpaceElement(pipe.to);
    if (!sourceEl || !targetEl) return null;
    const source = getSourceDocHandle(sourceEl);
    const target = getTargetPreview(targetEl);
    if (!source || !target) return null;
    let debounceTimer = null;
    async function runPipe() {
      try {
        const doc = source.handle.doc();
        if (!doc) return;
        const types = pipe.transforms.map((t) => t.type);
        const result = await runTransformChain(types, doc);
        if (result !== null && target) {
          target.value = result;
        }
      } catch (e) {
        console.error(`Pipe ${pipe.id} execution error:`, e);
      }
    }
    const onChange = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(runPipe, 300);
    };
    source.handle.on("change", onChange);
    await runPipe();
    return () => {
      source.handle.off("change", onChange);
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }
  createEffect(() => {
    for (const ap of activePipes) {
      ap.cleanup();
    }
    activePipes = [];
    const pipes = getAllPipes(props.layout);
    if (pipes.length === 0) return;
    const timer = setTimeout(async () => {
      for (const pipe of pipes) {
        const cleanup = await executePipe(pipe);
        if (cleanup) {
          activePipes.push({
            pipeId: pipe.id,
            cleanup
          });
        }
      }
    }, 100);
    onCleanup(() => {
      clearTimeout(timer);
      for (const ap of activePipes) {
        ap.cleanup();
      }
      activePipes = [];
    });
  });
  return null;
}
var _tmpl$ = /* @__PURE__ */ template(`<div class=space-edit-controls><button class=space-remove-btn title=Remove>×</button><div class=space-drag-handle><svg width=16 height=6 viewBox="0 0 16 6"fill=currentColor><circle cx=3 cy=1 r=1></circle><circle cx=8 cy=1 r=1></circle><circle cx=13 cy=1 r=1></circle><circle cx=3 cy=5 r=1></circle><circle cx=8 cy=5 r=1></circle><circle cx=13 cy=5 r=1></circle></svg></div><div class="space-resize-handle space-resize-right"></div><div class="space-resize-handle space-resize-bottom"></div><div class="space-resize-handle space-resize-corner">`), _tmpl$2 = /* @__PURE__ */ template(`<patchwork-space>`, true, false, false), _tmpl$3 = /* @__PURE__ */ template(`<patchwork-space><patchwork-preview style=width:100%;height:100%>`, true, false, false), _tmpl$4 = /* @__PURE__ */ template(`<div class=space-empty-state>Select a document in the sidebar`), _tmpl$5 = /* @__PURE__ */ template(`<patchwork-view>`, true, false, false), _tmpl$6 = /* @__PURE__ */ template(`<div class=space-toolbar>`), _tmpl$7 = /* @__PURE__ */ template(`<patchwork-view class=space-toolbar-item>`, true, false, false), _tmpl$8 = /* @__PURE__ */ template(`<patchwork-space id=space-root>`, true, false, false);
const SpaceFrame = (props) => {
  registerPatchworkSpaceElement();
  registerPatchworkPreviewElement();
  const accountDocHandle = useDocHandle(() => props.handle.url, {
    repo: props.repo
  });
  const accountDoc = createMemo(() => accountDocHandle()?.doc());
  const accountDocUrl = props.handle.url;
  const [gridDims, setGridDims] = createSignal({
    cols: 24,
    rows: 14
  });
  const [layout, setLayout] = createSignal({
    items: [],
    pipes: []
  });
  const [editing, setEditing] = createSignal(false);
  const [selectedDoc, setSelectedDoc] = createSignal(null);
  const selectedDocUrl = createMemo(() => selectedDoc()?.url);
  const selectedToolId = createMemo(() => selectedDoc()?.toolId);
  const viewKey = createMemo(() => {
    const doc = selectedDoc();
    return doc ? `${doc.url}-${doc.toolId ?? "default"}` : void 0;
  });
  let rootRef;
  onMount(() => {
    setGridDims(computeGrid(window.innerWidth, window.innerHeight, getTargetCellSize()));
    window.addEventListener("resize", onWindowResize);
    onCleanup(() => window.removeEventListener("resize", onWindowResize));
  });
  function onWindowResize() {
    setGridDims(computeGrid(window.innerWidth, window.innerHeight, getTargetCellSize()));
  }
  createEffect(() => {
    if (!rootRef) return;
    const isEdit = editing();
    if (isEdit) {
      rootRef.setAttribute("data-editing", "");
    } else {
      rootRef.removeAttribute("data-editing");
    }
    rootRef.querySelectorAll("patchwork-space[data-space-id]").forEach((el) => {
      if (isEdit) {
        el.setAttribute("data-editing", "");
      } else {
        el.removeAttribute("data-editing");
      }
    });
  });
  createEffect(() => {
    const doc = accountDoc();
    if (!doc) return;
    const existing = loadLayout(accountDocUrl);
    if (existing) {
      setLayout(existing);
      return;
    }
    const dims = gridDims();
    const def = createDefaultLayout(accountDocUrl, doc, dims.cols, dims.rows);
    setLayout(def);
    saveLayout(accountDocUrl, def);
  });
  function updateLayout(updater) {
    setLayout((prev) => {
      const next = updater(prev);
      saveLayout(accountDocUrl, next);
      return next;
    });
  }
  function resetLayout() {
    const doc = accountDoc();
    if (!doc) return;
    localStorage.removeItem(`patchwork-space-layout:${accountDocUrl}`);
    const dims = gridDims();
    const def = createDefaultLayout(accountDocUrl, doc, dims.cols, dims.rows);
    setLayout(def);
    saveLayout(accountDocUrl, def);
  }
  function handleRemoveSpace(itemId) {
    updateLayout((prev) => ({
      ...prev,
      items: removeItemById(prev.items, itemId),
      pipes: prev.pipes.filter((p) => p.from !== itemId && p.to !== itemId)
    }));
  }
  function removeItemById(items, id) {
    return items.filter((item) => item.id !== id).map((item) => {
      if (item.content.type === "group") {
        return {
          ...item,
          content: {
            ...item.content,
            children: removeItemById(item.content.children, id),
            pipes: item.content.pipes.filter((p) => p.from !== id && p.to !== id)
          }
        };
      }
      return item;
    });
  }
  onMount(() => {
    const onOpenDocument = (event) => {
      const e = event;
      e.stopPropagation();
      setSelectedDoc({
        url: e.detail.url,
        toolId: e.detail.toolId
      });
    };
    props.element.addEventListener("patchwork:open-document", onOpenDocument);
    onCleanup(() => props.element.removeEventListener("patchwork:open-document", onOpenDocument));
  });
  onMount(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setEditing((v) => !v);
      }
      if (e.key === "Escape" && editing()) {
        setEditing(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    onCleanup(() => window.removeEventListener("keydown", onKeyDown));
  });
  function resolveDocUrl(content) {
    if (content.type !== "view") return void 0;
    if (content.docUrl) return content.docUrl;
    if (!content.toolId) return selectedDocUrl();
    return accountDocUrl;
  }
  function resolveToolId(content) {
    if (content.type !== "view") return void 0;
    if (content.toolId) return content.toolId;
    return selectedToolId();
  }
  function getCellDimensions() {
    const root = rootRef;
    if (!root) return null;
    const rootRect = root.getBoundingClientRect();
    const dims = gridDims();
    return {
      cellW: rootRect.width / dims.cols,
      cellH: rootRect.height / dims.rows,
      dims
    };
  }
  function handleDragStart(itemId, e) {
    const root = rootRef;
    if (!root) return;
    const handleEl = e.currentTarget;
    const spaceEl = root.querySelector(`[data-space-id="${itemId}"]`);
    if (!spaceEl) return;
    const cell = getCellDimensions();
    if (!cell) return;
    const item = findItemById(layout().items, itemId);
    if (!item) return;
    handleEl.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    spaceEl.style.zIndex = "100";
    spaceEl.style.opacity = "0.9";
    spaceEl.classList.add("space-dragging");
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      spaceEl.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const cleanup = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      const dCols = Math.round(dx / cell.cellW);
      const dRows = Math.round(dy / cell.cellH);
      const newCol = Math.max(0, Math.min(cell.dims.cols - item.cols, item.col + dCols));
      const newRow = Math.max(0, Math.min(cell.dims.rows - item.rows, item.row + dRows));
      spaceEl.style.zIndex = "";
      spaceEl.style.opacity = "";
      spaceEl.style.transform = "";
      spaceEl.classList.remove("space-dragging");
      updateLayout((prev) => ({
        ...prev,
        items: updateItemPosition(prev.items, itemId, newCol, newRow)
      }));
      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", cleanup);
      handleEl.removeEventListener("lostpointercapture", cleanup);
    };
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", cleanup);
    handleEl.addEventListener("lostpointercapture", cleanup);
  }
  function handleResizeStart(itemId, edge, e) {
    const root = rootRef;
    if (!root) return;
    const handleEl = e.currentTarget;
    const spaceEl = root.querySelector(`[data-space-id="${itemId}"]`);
    if (!spaceEl) return;
    const cell = getCellDimensions();
    if (!cell) return;
    const item = findItemById(layout().items, itemId);
    if (!item) return;
    handleEl.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startY = e.clientY;
    let lastCols = item.cols;
    let lastRows = item.rows;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (edge === "right" || edge === "corner") {
        const newCols = Math.max(1, Math.min(cell.dims.cols - item.col, item.cols + Math.round(dx / cell.cellW)));
        if (newCols !== lastCols) {
          lastCols = newCols;
          spaceEl.setAttribute("cols", String(newCols));
        }
      }
      if (edge === "bottom" || edge === "corner") {
        const newRows = Math.max(1, Math.min(cell.dims.rows - item.row, item.rows + Math.round(dy / cell.cellH)));
        if (newRows !== lastRows) {
          lastRows = newRows;
          spaceEl.setAttribute("rows", String(newRows));
        }
      }
    };
    const cleanup = () => {
      updateLayout((prev) => ({
        ...prev,
        items: updateItemSize(prev.items, itemId, lastCols, lastRows)
      }));
      handleEl.removeEventListener("pointermove", onMove);
      handleEl.removeEventListener("pointerup", cleanup);
      handleEl.removeEventListener("lostpointercapture", cleanup);
    };
    handleEl.addEventListener("pointermove", onMove);
    handleEl.addEventListener("pointerup", cleanup);
    handleEl.addEventListener("lostpointercapture", cleanup);
  }
  function findItemById(items, id) {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.content.type === "group") {
        const found = findItemById(item.content.children, id);
        if (found) return found;
      }
    }
    return void 0;
  }
  function updateItemPosition(items, id, col, row) {
    return items.map((item) => {
      if (item.id === id) return {
        ...item,
        col,
        row
      };
      if (item.content.type === "group") {
        return {
          ...item,
          content: {
            ...item.content,
            children: updateItemPosition(item.content.children, id, col, row)
          }
        };
      }
      return item;
    });
  }
  function updateItemSize(items, id, cols, rows) {
    return items.map((item) => {
      if (item.id === id) return {
        ...item,
        cols,
        rows
      };
      if (item.content.type === "group") {
        return {
          ...item,
          content: {
            ...item.content,
            children: updateItemSize(item.content.children, id, cols, rows)
          }
        };
      }
      return item;
    });
  }
  function renderEditControls(item) {
    return createComponent(Show, {
      get when() {
        return editing();
      },
      get children() {
        var _el$ = _tmpl$(), _el$2 = _el$.firstChild, _el$3 = _el$2.nextSibling, _el$4 = _el$3.nextSibling, _el$5 = _el$4.nextSibling, _el$6 = _el$5.nextSibling;
        _el$2.$$click = (e) => {
          e.stopPropagation();
          handleRemoveSpace(item.id);
        };
        addEventListener(_el$3, "pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleDragStart(item.id, e);
        });
        addEventListener(_el$4, "pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleResizeStart(item.id, "right", e);
        });
        addEventListener(_el$5, "pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleResizeStart(item.id, "bottom", e);
        });
        addEventListener(_el$6, "pointerdown", (e) => {
          e.preventDefault();
          e.stopPropagation();
          handleResizeStart(item.id, "corner", e);
        });
        return _el$;
      }
    });
  }
  function renderSpaceItem(item) {
    if (item.content.type === "group") {
      return (() => {
        var _el$7 = _tmpl$2();
        spread(_el$7, mergeProps({
          get id() {
            return `space-${item.id}`;
          },
          get ["data-space-id"]() {
            return item.id;
          },
          get col() {
            return item.col;
          },
          get row() {
            return item.row;
          },
          get cols() {
            return item.cols;
          },
          get rows() {
            return item.rows;
          }
        }, () => item.collapsible ? {
          collapsible: ""
        } : {}, () => item.collapsed ? {
          collapsed: ""
        } : {}), false, true);
        _el$7._$owner = getOwner();
        insert(_el$7, createComponent(For, {
          get each() {
            return item.content.children;
          },
          children: (child) => renderSpaceItem(child)
        }));
        return _el$7;
      })();
    }
    if (item.content.type === "preview") {
      return (() => {
        var _el$8 = _tmpl$3(), _el$9 = _el$8.firstChild;
        _el$8._$owner = getOwner();
        _el$9._$owner = getOwner();
        insert(_el$8, () => renderEditControls(item), null);
        effect((_p$) => {
          var _v$ = `space-${item.id}`, _v$2 = item.id, _v$3 = item.col, _v$4 = item.row, _v$5 = item.cols, _v$6 = item.rows, _v$7 = item.id;
          _v$ !== _p$.e && (_el$8.id = _p$.e = _v$);
          _v$2 !== _p$.t && (_el$8.dataSpaceId = _p$.t = _v$2);
          _v$3 !== _p$.a && (_el$8.col = _p$.a = _v$3);
          _v$4 !== _p$.o && (_el$8.row = _p$.o = _v$4);
          _v$5 !== _p$.i && (_el$8.cols = _p$.i = _v$5);
          _v$6 !== _p$.n && (_el$8.rows = _p$.n = _v$6);
          _v$7 !== _p$.s && (_el$9.dataSpaceId = _p$.s = _v$7);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0,
          n: void 0,
          s: void 0
        });
        return _el$8;
      })();
    }
    const isMainView = !item.content.toolId && !item.content.docUrl;
    if (isMainView) {
      return (() => {
        var _el$0 = _tmpl$2();
        _el$0._$owner = getOwner();
        insert(_el$0, createComponent(Show, {
          get when() {
            return viewKey();
          },
          keyed: true,
          get fallback() {
            return _tmpl$4();
          },
          children: () => (() => {
            var _el$10 = _tmpl$5();
            _el$10._$owner = getOwner();
            effect((_p$) => {
              var _v$12 = selectedDocUrl(), _v$13 = selectedToolId();
              _v$12 !== _p$.e && (_el$10.docUrl = _p$.e = _v$12);
              _v$13 !== _p$.t && (_el$10.toolId = _p$.t = _v$13);
              return _p$;
            }, {
              e: void 0,
              t: void 0
            });
            return _el$10;
          })()
        }), null);
        insert(_el$0, () => renderEditControls(item), null);
        effect((_p$) => {
          var _v$8 = `space-${item.id}`, _v$9 = item.id, _v$0 = item.col, _v$1 = item.row, _v$10 = item.cols, _v$11 = item.rows;
          _v$8 !== _p$.e && (_el$0.id = _p$.e = _v$8);
          _v$9 !== _p$.t && (_el$0.dataSpaceId = _p$.t = _v$9);
          _v$0 !== _p$.a && (_el$0.col = _p$.a = _v$0);
          _v$1 !== _p$.o && (_el$0.row = _p$.o = _v$1);
          _v$10 !== _p$.i && (_el$0.cols = _p$.i = _v$10);
          _v$11 !== _p$.n && (_el$0.rows = _p$.n = _v$11);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0,
          n: void 0
        });
        return _el$0;
      })();
    }
    if (item.content.toolId === "document-toolbar-group") {
      const toolIds = createMemo(() => accountDoc()?.documentToolbarToolIds ?? []);
      return (() => {
        var _el$11 = _tmpl$2();
        _el$11._$owner = getOwner();
        insert(_el$11, createComponent(Show, {
          get when() {
            return selectedDocUrl();
          },
          get children() {
            var _el$12 = _tmpl$6();
            insert(_el$12, createComponent(For, {
              get each() {
                return toolIds();
              },
              children: (tid) => (() => {
                var _el$13 = _tmpl$7();
                _el$13.toolId = tid;
                _el$13._$owner = getOwner();
                effect(() => _el$13.docUrl = selectedDocUrl());
                return _el$13;
              })()
            }));
            return _el$12;
          }
        }), null);
        insert(_el$11, () => renderEditControls(item), null);
        effect((_p$) => {
          var _v$14 = `space-${item.id}`, _v$15 = item.id, _v$16 = item.col, _v$17 = item.row, _v$18 = item.cols, _v$19 = item.rows;
          _v$14 !== _p$.e && (_el$11.id = _p$.e = _v$14);
          _v$15 !== _p$.t && (_el$11.dataSpaceId = _p$.t = _v$15);
          _v$16 !== _p$.a && (_el$11.col = _p$.a = _v$16);
          _v$17 !== _p$.o && (_el$11.row = _p$.o = _v$17);
          _v$18 !== _p$.i && (_el$11.cols = _p$.i = _v$18);
          _v$19 !== _p$.n && (_el$11.rows = _p$.n = _v$19);
          return _p$;
        }, {
          e: void 0,
          t: void 0,
          a: void 0,
          o: void 0,
          i: void 0,
          n: void 0
        });
        return _el$11;
      })();
    }
    const docUrl = resolveDocUrl(item.content);
    const toolId = resolveToolId(item.content);
    return (() => {
      var _el$14 = _tmpl$2();
      spread(_el$14, mergeProps({
        get id() {
          return `space-${item.id}`;
        },
        get ["data-space-id"]() {
          return item.id;
        },
        get col() {
          return item.col;
        },
        get row() {
          return item.row;
        },
        get cols() {
          return item.cols;
        },
        get rows() {
          return item.rows;
        }
      }, () => item.collapsible ? {
        collapsible: ""
      } : {}, () => item.collapsed ? {
        collapsed: ""
      } : {}), false, true);
      _el$14._$owner = getOwner();
      insert(_el$14, createComponent(Show, {
        when: docUrl,
        get children() {
          var _el$15 = _tmpl$5();
          _el$15.docUrl = docUrl;
          _el$15.toolId = toolId;
          _el$15._$owner = getOwner();
          return _el$15;
        }
      }), null);
      insert(_el$14, () => renderEditControls(item), null);
      return _el$14;
    })();
  }
  return [(() => {
    var _el$16 = _tmpl$8();
    use((el) => {
      rootRef = el;
    }, _el$16);
    _el$16._$owner = getOwner();
    insert(_el$16, createComponent(For, {
      get each() {
        return layout().items;
      },
      children: (item) => renderSpaceItem(item)
    }));
    return _el$16;
  })(), createComponent(Show, {
    get when() {
      return editing();
    },
    get children() {
      return createComponent(EditModeOverlay, {
        get layout() {
          return layout();
        },
        get gridDims() {
          return gridDims();
        },
        onUpdateLayout: updateLayout,
        onDone: () => setEditing(false),
        onReset: resetLayout
      });
    }
  }), createComponent(PipeRunner, {
    get layout() {
      return layout();
    },
    get rootElement() {
      return props.element;
    },
    get repo() {
      return props.repo;
    }
  })];
};
delegateEvents(["click"]);
export {
  SpaceFrame
};
//# sourceMappingURL=SpaceFrame-C0hu-tim.js.map
