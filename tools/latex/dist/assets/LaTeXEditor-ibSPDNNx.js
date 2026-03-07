import { EditorView, Direction, ViewPlugin, getTooltip, showTooltip, logException, keymap, Decoration, hoverTooltip, showPanel, WidgetType, lineNumbers, highlightActiveLine, highlightSpecialChars, drawSelection, dropCursor } from "@codemirror/view";
import { StateField, Facet, EditorSelection, countColumn, Text as Text$1, Annotation, Transaction, combineConfig, findClusterBreak, StateEffect, ChangeSet, ChangeDesc, Prec, codePointAt, codePointSize, RangeSet, fromCodePoint, MapMode, RangeValue, CharCategory, RangeSetBuilder, EditorState } from "@codemirror/state";
import { IndentContext, getIndentation, indentString, syntaxTree, matchBrackets, getIndentUnit, indentUnit, bracketMatching, LRLanguage, indentNodeProp, foldNodeProp, foldInside, foldService, LanguageSupport, indentOnInput, foldGutter, syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import * as A from "@automerge/automerge";
var jsxRuntime = { exports: {} };
var reactJsxRuntime_production_min = {};
var react = { exports: {} };
var react_production_min = {};
var hasRequiredReact_production_min;
function requireReact_production_min() {
  if (hasRequiredReact_production_min) return react_production_min;
  hasRequiredReact_production_min = 1;
  var l = Symbol.for("react.element"), n = Symbol.for("react.portal"), p = Symbol.for("react.fragment"), q = Symbol.for("react.strict_mode"), r = Symbol.for("react.profiler"), t2 = Symbol.for("react.provider"), u = Symbol.for("react.context"), v = Symbol.for("react.forward_ref"), w = Symbol.for("react.suspense"), x = Symbol.for("react.memo"), y = Symbol.for("react.lazy"), z = Symbol.iterator;
  function A2(a) {
    if (null === a || "object" !== typeof a) return null;
    a = z && a[z] || a["@@iterator"];
    return "function" === typeof a ? a : null;
  }
  var B = { isMounted: function() {
    return false;
  }, enqueueForceUpdate: function() {
  }, enqueueReplaceState: function() {
  }, enqueueSetState: function() {
  } }, C = Object.assign, D = {};
  function E(a, b, e) {
    this.props = a;
    this.context = b;
    this.refs = D;
    this.updater = e || B;
  }
  E.prototype.isReactComponent = {};
  E.prototype.setState = function(a, b) {
    if ("object" !== typeof a && "function" !== typeof a && null != a) throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");
    this.updater.enqueueSetState(this, a, b, "setState");
  };
  E.prototype.forceUpdate = function(a) {
    this.updater.enqueueForceUpdate(this, a, "forceUpdate");
  };
  function F() {
  }
  F.prototype = E.prototype;
  function G(a, b, e) {
    this.props = a;
    this.context = b;
    this.refs = D;
    this.updater = e || B;
  }
  var H = G.prototype = new F();
  H.constructor = G;
  C(H, E.prototype);
  H.isPureReactComponent = true;
  var I = Array.isArray, J = Object.prototype.hasOwnProperty, K = { current: null }, L = { key: true, ref: true, __self: true, __source: true };
  function M(a, b, e) {
    var d, c = {}, k = null, h = null;
    if (null != b) for (d in void 0 !== b.ref && (h = b.ref), void 0 !== b.key && (k = "" + b.key), b) J.call(b, d) && !L.hasOwnProperty(d) && (c[d] = b[d]);
    var g = arguments.length - 2;
    if (1 === g) c.children = e;
    else if (1 < g) {
      for (var f = Array(g), m = 0; m < g; m++) f[m] = arguments[m + 2];
      c.children = f;
    }
    if (a && a.defaultProps) for (d in g = a.defaultProps, g) void 0 === c[d] && (c[d] = g[d]);
    return { $$typeof: l, type: a, key: k, ref: h, props: c, _owner: K.current };
  }
  function N(a, b) {
    return { $$typeof: l, type: a.type, key: b, ref: a.ref, props: a.props, _owner: a._owner };
  }
  function O(a) {
    return "object" === typeof a && null !== a && a.$$typeof === l;
  }
  function escape(a) {
    var b = { "=": "=0", ":": "=2" };
    return "$" + a.replace(/[=:]/g, function(a2) {
      return b[a2];
    });
  }
  var P = /\/+/g;
  function Q(a, b) {
    return "object" === typeof a && null !== a && null != a.key ? escape("" + a.key) : b.toString(36);
  }
  function R(a, b, e, d, c) {
    var k = typeof a;
    if ("undefined" === k || "boolean" === k) a = null;
    var h = false;
    if (null === a) h = true;
    else switch (k) {
      case "string":
      case "number":
        h = true;
        break;
      case "object":
        switch (a.$$typeof) {
          case l:
          case n:
            h = true;
        }
    }
    if (h) return h = a, c = c(h), a = "" === d ? "." + Q(h, 0) : d, I(c) ? (e = "", null != a && (e = a.replace(P, "$&/") + "/"), R(c, b, e, "", function(a2) {
      return a2;
    })) : null != c && (O(c) && (c = N(c, e + (!c.key || h && h.key === c.key ? "" : ("" + c.key).replace(P, "$&/") + "/") + a)), b.push(c)), 1;
    h = 0;
    d = "" === d ? "." : d + ":";
    if (I(a)) for (var g = 0; g < a.length; g++) {
      k = a[g];
      var f = d + Q(k, g);
      h += R(k, b, e, f, c);
    }
    else if (f = A2(a), "function" === typeof f) for (a = f.call(a), g = 0; !(k = a.next()).done; ) k = k.value, f = d + Q(k, g++), h += R(k, b, e, f, c);
    else if ("object" === k) throw b = String(a), Error("Objects are not valid as a React child (found: " + ("[object Object]" === b ? "object with keys {" + Object.keys(a).join(", ") + "}" : b) + "). If you meant to render a collection of children, use an array instead.");
    return h;
  }
  function S(a, b, e) {
    if (null == a) return a;
    var d = [], c = 0;
    R(a, d, "", "", function(a2) {
      return b.call(e, a2, c++);
    });
    return d;
  }
  function T(a) {
    if (-1 === a._status) {
      var b = a._result;
      b = b();
      b.then(function(b2) {
        if (0 === a._status || -1 === a._status) a._status = 1, a._result = b2;
      }, function(b2) {
        if (0 === a._status || -1 === a._status) a._status = 2, a._result = b2;
      });
      -1 === a._status && (a._status = 0, a._result = b);
    }
    if (1 === a._status) return a._result.default;
    throw a._result;
  }
  var U = { current: null }, V = { transition: null }, W = { ReactCurrentDispatcher: U, ReactCurrentBatchConfig: V, ReactCurrentOwner: K };
  function X() {
    throw Error("act(...) is not supported in production builds of React.");
  }
  react_production_min.Children = { map: S, forEach: function(a, b, e) {
    S(a, function() {
      b.apply(this, arguments);
    }, e);
  }, count: function(a) {
    var b = 0;
    S(a, function() {
      b++;
    });
    return b;
  }, toArray: function(a) {
    return S(a, function(a2) {
      return a2;
    }) || [];
  }, only: function(a) {
    if (!O(a)) throw Error("React.Children.only expected to receive a single React element child.");
    return a;
  } };
  react_production_min.Component = E;
  react_production_min.Fragment = p;
  react_production_min.Profiler = r;
  react_production_min.PureComponent = G;
  react_production_min.StrictMode = q;
  react_production_min.Suspense = w;
  react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = W;
  react_production_min.act = X;
  react_production_min.cloneElement = function(a, b, e) {
    if (null === a || void 0 === a) throw Error("React.cloneElement(...): The argument must be a React element, but you passed " + a + ".");
    var d = C({}, a.props), c = a.key, k = a.ref, h = a._owner;
    if (null != b) {
      void 0 !== b.ref && (k = b.ref, h = K.current);
      void 0 !== b.key && (c = "" + b.key);
      if (a.type && a.type.defaultProps) var g = a.type.defaultProps;
      for (f in b) J.call(b, f) && !L.hasOwnProperty(f) && (d[f] = void 0 === b[f] && void 0 !== g ? g[f] : b[f]);
    }
    var f = arguments.length - 2;
    if (1 === f) d.children = e;
    else if (1 < f) {
      g = Array(f);
      for (var m = 0; m < f; m++) g[m] = arguments[m + 2];
      d.children = g;
    }
    return { $$typeof: l, type: a.type, key: c, ref: k, props: d, _owner: h };
  };
  react_production_min.createContext = function(a) {
    a = { $$typeof: u, _currentValue: a, _currentValue2: a, _threadCount: 0, Provider: null, Consumer: null, _defaultValue: null, _globalName: null };
    a.Provider = { $$typeof: t2, _context: a };
    return a.Consumer = a;
  };
  react_production_min.createElement = M;
  react_production_min.createFactory = function(a) {
    var b = M.bind(null, a);
    b.type = a;
    return b;
  };
  react_production_min.createRef = function() {
    return { current: null };
  };
  react_production_min.forwardRef = function(a) {
    return { $$typeof: v, render: a };
  };
  react_production_min.isValidElement = O;
  react_production_min.lazy = function(a) {
    return { $$typeof: y, _payload: { _status: -1, _result: a }, _init: T };
  };
  react_production_min.memo = function(a, b) {
    return { $$typeof: x, type: a, compare: void 0 === b ? null : b };
  };
  react_production_min.startTransition = function(a) {
    var b = V.transition;
    V.transition = {};
    try {
      a();
    } finally {
      V.transition = b;
    }
  };
  react_production_min.unstable_act = X;
  react_production_min.useCallback = function(a, b) {
    return U.current.useCallback(a, b);
  };
  react_production_min.useContext = function(a) {
    return U.current.useContext(a);
  };
  react_production_min.useDebugValue = function() {
  };
  react_production_min.useDeferredValue = function(a) {
    return U.current.useDeferredValue(a);
  };
  react_production_min.useEffect = function(a, b) {
    return U.current.useEffect(a, b);
  };
  react_production_min.useId = function() {
    return U.current.useId();
  };
  react_production_min.useImperativeHandle = function(a, b, e) {
    return U.current.useImperativeHandle(a, b, e);
  };
  react_production_min.useInsertionEffect = function(a, b) {
    return U.current.useInsertionEffect(a, b);
  };
  react_production_min.useLayoutEffect = function(a, b) {
    return U.current.useLayoutEffect(a, b);
  };
  react_production_min.useMemo = function(a, b) {
    return U.current.useMemo(a, b);
  };
  react_production_min.useReducer = function(a, b, e) {
    return U.current.useReducer(a, b, e);
  };
  react_production_min.useRef = function(a) {
    return U.current.useRef(a);
  };
  react_production_min.useState = function(a) {
    return U.current.useState(a);
  };
  react_production_min.useSyncExternalStore = function(a, b, e) {
    return U.current.useSyncExternalStore(a, b, e);
  };
  react_production_min.useTransition = function() {
    return U.current.useTransition();
  };
  react_production_min.version = "18.3.1";
  return react_production_min;
}
var hasRequiredReact;
function requireReact() {
  if (hasRequiredReact) return react.exports;
  hasRequiredReact = 1;
  {
    react.exports = requireReact_production_min();
  }
  return react.exports;
}
var hasRequiredReactJsxRuntime_production_min;
function requireReactJsxRuntime_production_min() {
  if (hasRequiredReactJsxRuntime_production_min) return reactJsxRuntime_production_min;
  hasRequiredReactJsxRuntime_production_min = 1;
  var f = requireReact(), k = Symbol.for("react.element"), l = Symbol.for("react.fragment"), m = Object.prototype.hasOwnProperty, n = f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, p = { key: true, ref: true, __self: true, __source: true };
  function q(c, a, g) {
    var b, d = {}, e = null, h = null;
    void 0 !== g && (e = "" + g);
    void 0 !== a.key && (e = "" + a.key);
    void 0 !== a.ref && (h = a.ref);
    for (b in a) m.call(a, b) && !p.hasOwnProperty(b) && (d[b] = a[b]);
    if (c && c.defaultProps) for (b in a = c.defaultProps, a) void 0 === d[b] && (d[b] = a[b]);
    return { $$typeof: k, type: c, key: e, ref: h, props: d, _owner: n.current };
  }
  reactJsxRuntime_production_min.Fragment = l;
  reactJsxRuntime_production_min.jsx = q;
  reactJsxRuntime_production_min.jsxs = q;
  return reactJsxRuntime_production_min;
}
var hasRequiredJsxRuntime;
function requireJsxRuntime() {
  if (hasRequiredJsxRuntime) return jsxRuntime.exports;
  hasRequiredJsxRuntime = 1;
  {
    jsxRuntime.exports = requireReactJsxRuntime_production_min();
  }
  return jsxRuntime.exports;
}
var jsxRuntimeExports = requireJsxRuntime();
var reactExports = requireReact();
var define_process_env_default$1 = {};
function wrapPromise(promise) {
  let status = "pending";
  let result;
  let error;
  const suspender = promise.then(
    (data) => {
      status = "success";
      result = data;
    },
    (err) => {
      status = "error";
      error = err;
    }
  );
  return {
    promise,
    read() {
      switch (status) {
        case "pending":
          throw suspender;
        case "error":
          throw error;
        case "success":
          return result;
      }
    }
  };
}
const RepoContext = reactExports.createContext(null);
function useRepo() {
  const repo = reactExports.useContext(RepoContext);
  if (!repo) throw new Error("Repo was not found on RepoContext.");
  return repo;
}
const REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;
function validate(uuid) {
  return typeof uuid === "string" && REGEX.test(uuid);
}
function parse(uuid) {
  if (!validate(uuid)) {
    throw TypeError("Invalid UUID");
  }
  let v;
  const arr = new Uint8Array(16);
  arr[0] = (v = parseInt(uuid.slice(0, 8), 16)) >>> 24;
  arr[1] = v >>> 16 & 255;
  arr[2] = v >>> 8 & 255;
  arr[3] = v & 255;
  arr[4] = (v = parseInt(uuid.slice(9, 13), 16)) >>> 8;
  arr[5] = v & 255;
  arr[6] = (v = parseInt(uuid.slice(14, 18), 16)) >>> 8;
  arr[7] = v & 255;
  arr[8] = (v = parseInt(uuid.slice(19, 23), 16)) >>> 8;
  arr[9] = v & 255;
  arr[10] = (v = parseInt(uuid.slice(24, 36), 16)) / 1099511627776 & 255;
  arr[11] = v / 4294967296 & 255;
  arr[12] = v >>> 24 & 255;
  arr[13] = v >>> 16 & 255;
  arr[14] = v >>> 8 & 255;
  arr[15] = v & 255;
  return arr;
}
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var sha256$2 = {};
var sha2 = {};
var _md = {};
var utils = {};
var crypto = {};
var hasRequiredCrypto;
function requireCrypto() {
  if (hasRequiredCrypto) return crypto;
  hasRequiredCrypto = 1;
  Object.defineProperty(crypto, "__esModule", { value: true });
  crypto.crypto = void 0;
  crypto.crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
  return crypto;
}
var hasRequiredUtils;
function requireUtils() {
  if (hasRequiredUtils) return utils;
  hasRequiredUtils = 1;
  (function(exports$1) {
    Object.defineProperty(exports$1, "__esModule", { value: true });
    exports$1.wrapXOFConstructorWithOpts = exports$1.wrapConstructorWithOpts = exports$1.wrapConstructor = exports$1.Hash = exports$1.nextTick = exports$1.swap32IfBE = exports$1.byteSwapIfBE = exports$1.swap8IfBE = exports$1.isLE = void 0;
    exports$1.isBytes = isBytes;
    exports$1.anumber = anumber;
    exports$1.abytes = abytes;
    exports$1.ahash = ahash;
    exports$1.aexists = aexists;
    exports$1.aoutput = aoutput;
    exports$1.u8 = u8;
    exports$1.u32 = u32;
    exports$1.clean = clean;
    exports$1.createView = createView;
    exports$1.rotr = rotr;
    exports$1.rotl = rotl;
    exports$1.byteSwap = byteSwap;
    exports$1.byteSwap32 = byteSwap32;
    exports$1.bytesToHex = bytesToHex;
    exports$1.hexToBytes = hexToBytes;
    exports$1.asyncLoop = asyncLoop;
    exports$1.utf8ToBytes = utf8ToBytes;
    exports$1.bytesToUtf8 = bytesToUtf8;
    exports$1.toBytes = toBytes;
    exports$1.kdfInputToBytes = kdfInputToBytes;
    exports$1.concatBytes = concatBytes;
    exports$1.checkOpts = checkOpts;
    exports$1.createHasher = createHasher;
    exports$1.createOptHasher = createOptHasher;
    exports$1.createXOFer = createXOFer;
    exports$1.randomBytes = randomBytes;
    const crypto_1 = /* @__PURE__ */ requireCrypto();
    function isBytes(a) {
      return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
    }
    function anumber(n) {
      if (!Number.isSafeInteger(n) || n < 0)
        throw new Error("positive integer expected, got " + n);
    }
    function abytes(b, ...lengths) {
      if (!isBytes(b))
        throw new Error("Uint8Array expected");
      if (lengths.length > 0 && !lengths.includes(b.length))
        throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
    }
    function ahash(h) {
      if (typeof h !== "function" || typeof h.create !== "function")
        throw new Error("Hash should be wrapped by utils.createHasher");
      anumber(h.outputLen);
      anumber(h.blockLen);
    }
    function aexists(instance, checkFinished = true) {
      if (instance.destroyed)
        throw new Error("Hash instance has been destroyed");
      if (checkFinished && instance.finished)
        throw new Error("Hash#digest() has already been called");
    }
    function aoutput(out, instance) {
      abytes(out);
      const min = instance.outputLen;
      if (out.length < min) {
        throw new Error("digestInto() expects output buffer of length at least " + min);
      }
    }
    function u8(arr) {
      return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    function u32(arr) {
      return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
    }
    function clean(...arrays) {
      for (let i = 0; i < arrays.length; i++) {
        arrays[i].fill(0);
      }
    }
    function createView(arr) {
      return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    }
    function rotr(word, shift) {
      return word << 32 - shift | word >>> shift;
    }
    function rotl(word, shift) {
      return word << shift | word >>> 32 - shift >>> 0;
    }
    exports$1.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
    function byteSwap(word) {
      return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
    }
    exports$1.swap8IfBE = exports$1.isLE ? (n) => n : (n) => byteSwap(n);
    exports$1.byteSwapIfBE = exports$1.swap8IfBE;
    function byteSwap32(arr) {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = byteSwap(arr[i]);
      }
      return arr;
    }
    exports$1.swap32IfBE = exports$1.isLE ? (u) => u : byteSwap32;
    const hasHexBuiltin = /* @__PURE__ */ (() => (
      // @ts-ignore
      typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
    ))();
    const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
    function bytesToHex(bytes) {
      abytes(bytes);
      if (hasHexBuiltin)
        return bytes.toHex();
      let hex = "";
      for (let i = 0; i < bytes.length; i++) {
        hex += hexes[bytes[i]];
      }
      return hex;
    }
    const asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
    function asciiToBase16(ch) {
      if (ch >= asciis._0 && ch <= asciis._9)
        return ch - asciis._0;
      if (ch >= asciis.A && ch <= asciis.F)
        return ch - (asciis.A - 10);
      if (ch >= asciis.a && ch <= asciis.f)
        return ch - (asciis.a - 10);
      return;
    }
    function hexToBytes(hex) {
      if (typeof hex !== "string")
        throw new Error("hex string expected, got " + typeof hex);
      if (hasHexBuiltin)
        return Uint8Array.fromHex(hex);
      const hl = hex.length;
      const al = hl / 2;
      if (hl % 2)
        throw new Error("hex string expected, got unpadded hex of length " + hl);
      const array = new Uint8Array(al);
      for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
        const n1 = asciiToBase16(hex.charCodeAt(hi));
        const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
        if (n1 === void 0 || n2 === void 0) {
          const char = hex[hi] + hex[hi + 1];
          throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
        }
        array[ai] = n1 * 16 + n2;
      }
      return array;
    }
    const nextTick = async () => {
    };
    exports$1.nextTick = nextTick;
    async function asyncLoop(iters, tick, cb) {
      let ts = Date.now();
      for (let i = 0; i < iters; i++) {
        cb(i);
        const diff = Date.now() - ts;
        if (diff >= 0 && diff < tick)
          continue;
        await (0, exports$1.nextTick)();
        ts += diff;
      }
    }
    function utf8ToBytes(str) {
      if (typeof str !== "string")
        throw new Error("string expected");
      return new Uint8Array(new TextEncoder().encode(str));
    }
    function bytesToUtf8(bytes) {
      return new TextDecoder().decode(bytes);
    }
    function toBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      abytes(data);
      return data;
    }
    function kdfInputToBytes(data) {
      if (typeof data === "string")
        data = utf8ToBytes(data);
      abytes(data);
      return data;
    }
    function concatBytes(...arrays) {
      let sum = 0;
      for (let i = 0; i < arrays.length; i++) {
        const a = arrays[i];
        abytes(a);
        sum += a.length;
      }
      const res = new Uint8Array(sum);
      for (let i = 0, pad = 0; i < arrays.length; i++) {
        const a = arrays[i];
        res.set(a, pad);
        pad += a.length;
      }
      return res;
    }
    function checkOpts(defaults2, opts) {
      if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
        throw new Error("options should be object or undefined");
      const merged = Object.assign(defaults2, opts);
      return merged;
    }
    class Hash {
    }
    exports$1.Hash = Hash;
    function createHasher(hashCons) {
      const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
      const tmp = hashCons();
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = () => hashCons();
      return hashC;
    }
    function createOptHasher(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    function createXOFer(hashCons) {
      const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
      const tmp = hashCons({});
      hashC.outputLen = tmp.outputLen;
      hashC.blockLen = tmp.blockLen;
      hashC.create = (opts) => hashCons(opts);
      return hashC;
    }
    exports$1.wrapConstructor = createHasher;
    exports$1.wrapConstructorWithOpts = createOptHasher;
    exports$1.wrapXOFConstructorWithOpts = createXOFer;
    function randomBytes(bytesLength = 32) {
      if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") {
        return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
      }
      if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") {
        return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
      }
      throw new Error("crypto.getRandomValues must be defined");
    }
  })(utils);
  return utils;
}
var hasRequired_md;
function require_md() {
  if (hasRequired_md) return _md;
  hasRequired_md = 1;
  Object.defineProperty(_md, "__esModule", { value: true });
  _md.SHA512_IV = _md.SHA384_IV = _md.SHA224_IV = _md.SHA256_IV = _md.HashMD = void 0;
  _md.setBigUint64 = setBigUint64;
  _md.Chi = Chi;
  _md.Maj = Maj;
  const utils_ts_1 = /* @__PURE__ */ requireUtils();
  function setBigUint64(view, byteOffset, value, isLE) {
    if (typeof view.setBigUint64 === "function")
      return view.setBigUint64(byteOffset, value, isLE);
    const _32n = BigInt(32);
    const _u32_max = BigInt(4294967295);
    const wh = Number(value >> _32n & _u32_max);
    const wl = Number(value & _u32_max);
    const h = isLE ? 4 : 0;
    const l = isLE ? 0 : 4;
    view.setUint32(byteOffset + h, wh, isLE);
    view.setUint32(byteOffset + l, wl, isLE);
  }
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  class HashMD extends utils_ts_1.Hash {
    constructor(blockLen, outputLen, padOffset, isLE) {
      super();
      this.finished = false;
      this.length = 0;
      this.pos = 0;
      this.destroyed = false;
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE;
      this.buffer = new Uint8Array(blockLen);
      this.view = (0, utils_ts_1.createView)(this.buffer);
    }
    update(data) {
      (0, utils_ts_1.aexists)(this);
      data = (0, utils_ts_1.toBytes)(data);
      (0, utils_ts_1.abytes)(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView2 = (0, utils_ts_1.createView)(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView2, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      (0, utils_ts_1.aexists)(this);
      (0, utils_ts_1.aoutput)(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      (0, utils_ts_1.clean)(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
      this.process(view, 0);
      const oview = (0, utils_ts_1.createView)(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen should be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length;
      to.pos = pos;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  }
  _md.HashMD = HashMD;
  _md.SHA256_IV = Uint32Array.from([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  _md.SHA224_IV = Uint32Array.from([
    3238371032,
    914150663,
    812702999,
    4144912697,
    4290775857,
    1750603025,
    1694076839,
    3204075428
  ]);
  _md.SHA384_IV = Uint32Array.from([
    3418070365,
    3238371032,
    1654270250,
    914150663,
    2438529370,
    812702999,
    355462360,
    4144912697,
    1731405415,
    4290775857,
    2394180231,
    1750603025,
    3675008525,
    1694076839,
    1203062813,
    3204075428
  ]);
  _md.SHA512_IV = Uint32Array.from([
    1779033703,
    4089235720,
    3144134277,
    2227873595,
    1013904242,
    4271175723,
    2773480762,
    1595750129,
    1359893119,
    2917565137,
    2600822924,
    725511199,
    528734635,
    4215389547,
    1541459225,
    327033209
  ]);
  return _md;
}
var _u64 = {};
var hasRequired_u64;
function require_u64() {
  if (hasRequired_u64) return _u64;
  hasRequired_u64 = 1;
  Object.defineProperty(_u64, "__esModule", { value: true });
  _u64.toBig = _u64.shrSL = _u64.shrSH = _u64.rotrSL = _u64.rotrSH = _u64.rotrBL = _u64.rotrBH = _u64.rotr32L = _u64.rotr32H = _u64.rotlSL = _u64.rotlSH = _u64.rotlBL = _u64.rotlBH = _u64.add5L = _u64.add5H = _u64.add4L = _u64.add4H = _u64.add3L = _u64.add3H = void 0;
  _u64.add = add2;
  _u64.fromBig = fromBig;
  _u64.split = split;
  const U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
  const _32n = /* @__PURE__ */ BigInt(32);
  function fromBig(n, le = false) {
    if (le)
      return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
    return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
  }
  function split(lst, le = false) {
    const len = lst.length;
    let Ah = new Uint32Array(len);
    let Al = new Uint32Array(len);
    for (let i = 0; i < len; i++) {
      const { h, l } = fromBig(lst[i], le);
      [Ah[i], Al[i]] = [h, l];
    }
    return [Ah, Al];
  }
  const toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
  _u64.toBig = toBig;
  const shrSH = (h, _l, s) => h >>> s;
  _u64.shrSH = shrSH;
  const shrSL = (h, l, s) => h << 32 - s | l >>> s;
  _u64.shrSL = shrSL;
  const rotrSH = (h, l, s) => h >>> s | l << 32 - s;
  _u64.rotrSH = rotrSH;
  const rotrSL = (h, l, s) => h << 32 - s | l >>> s;
  _u64.rotrSL = rotrSL;
  const rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
  _u64.rotrBH = rotrBH;
  const rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
  _u64.rotrBL = rotrBL;
  const rotr32H = (_h, l) => l;
  _u64.rotr32H = rotr32H;
  const rotr32L = (h, _l) => h;
  _u64.rotr32L = rotr32L;
  const rotlSH = (h, l, s) => h << s | l >>> 32 - s;
  _u64.rotlSH = rotlSH;
  const rotlSL = (h, l, s) => l << s | h >>> 32 - s;
  _u64.rotlSL = rotlSL;
  const rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
  _u64.rotlBH = rotlBH;
  const rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
  _u64.rotlBL = rotlBL;
  function add2(Ah, Al, Bh, Bl) {
    const l = (Al >>> 0) + (Bl >>> 0);
    return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
  }
  const add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
  _u64.add3L = add3L;
  const add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
  _u64.add3H = add3H;
  const add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
  _u64.add4L = add4L;
  const add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
  _u64.add4H = add4H;
  const add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
  _u64.add5L = add5L;
  const add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
  _u64.add5H = add5H;
  const u64 = {
    fromBig,
    split,
    toBig,
    shrSH,
    shrSL,
    rotrSH,
    rotrSL,
    rotrBH,
    rotrBL,
    rotr32H,
    rotr32L,
    rotlSH,
    rotlSL,
    rotlBH,
    rotlBL,
    add: add2,
    add3L,
    add3H,
    add4L,
    add4H,
    add5H,
    add5L
  };
  _u64.default = u64;
  return _u64;
}
var hasRequiredSha2;
function requireSha2() {
  if (hasRequiredSha2) return sha2;
  hasRequiredSha2 = 1;
  Object.defineProperty(sha2, "__esModule", { value: true });
  sha2.sha512_224 = sha2.sha512_256 = sha2.sha384 = sha2.sha512 = sha2.sha224 = sha2.sha256 = sha2.SHA512_256 = sha2.SHA512_224 = sha2.SHA384 = sha2.SHA512 = sha2.SHA224 = sha2.SHA256 = void 0;
  const _md_ts_1 = /* @__PURE__ */ require_md();
  const u64 = /* @__PURE__ */ require_u64();
  const utils_ts_1 = /* @__PURE__ */ requireUtils();
  const SHA256_K = /* @__PURE__ */ Uint32Array.from([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  class SHA256 extends _md_ts_1.HashMD {
    constructor(outputLen = 32) {
      super(64, outputLen, 8, false);
      this.A = _md_ts_1.SHA256_IV[0] | 0;
      this.B = _md_ts_1.SHA256_IV[1] | 0;
      this.C = _md_ts_1.SHA256_IV[2] | 0;
      this.D = _md_ts_1.SHA256_IV[3] | 0;
      this.E = _md_ts_1.SHA256_IV[4] | 0;
      this.F = _md_ts_1.SHA256_IV[5] | 0;
      this.G = _md_ts_1.SHA256_IV[6] | 0;
      this.H = _md_ts_1.SHA256_IV[7] | 0;
    }
    get() {
      const { A: A2, B, C, D, E, F, G, H } = this;
      return [A2, B, C, D, E, F, G, H];
    }
    // prettier-ignore
    set(A2, B, C, D, E, F, G, H) {
      this.A = A2 | 0;
      this.B = B | 0;
      this.C = C | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = (0, utils_ts_1.rotr)(W15, 7) ^ (0, utils_ts_1.rotr)(W15, 18) ^ W15 >>> 3;
        const s1 = (0, utils_ts_1.rotr)(W2, 17) ^ (0, utils_ts_1.rotr)(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A: A2, B, C, D, E, F, G, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = (0, utils_ts_1.rotr)(E, 6) ^ (0, utils_ts_1.rotr)(E, 11) ^ (0, utils_ts_1.rotr)(E, 25);
        const T1 = H + sigma1 + (0, _md_ts_1.Chi)(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = (0, utils_ts_1.rotr)(A2, 2) ^ (0, utils_ts_1.rotr)(A2, 13) ^ (0, utils_ts_1.rotr)(A2, 22);
        const T2 = sigma0 + (0, _md_ts_1.Maj)(A2, B, C) | 0;
        H = G;
        G = F;
        F = E;
        E = D + T1 | 0;
        D = C;
        C = B;
        B = A2;
        A2 = T1 + T2 | 0;
      }
      A2 = A2 + this.A | 0;
      B = B + this.B | 0;
      C = C + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G = G + this.G | 0;
      H = H + this.H | 0;
      this.set(A2, B, C, D, E, F, G, H);
    }
    roundClean() {
      (0, utils_ts_1.clean)(SHA256_W);
    }
    destroy() {
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      (0, utils_ts_1.clean)(this.buffer);
    }
  }
  sha2.SHA256 = SHA256;
  class SHA224 extends SHA256 {
    constructor() {
      super(28);
      this.A = _md_ts_1.SHA224_IV[0] | 0;
      this.B = _md_ts_1.SHA224_IV[1] | 0;
      this.C = _md_ts_1.SHA224_IV[2] | 0;
      this.D = _md_ts_1.SHA224_IV[3] | 0;
      this.E = _md_ts_1.SHA224_IV[4] | 0;
      this.F = _md_ts_1.SHA224_IV[5] | 0;
      this.G = _md_ts_1.SHA224_IV[6] | 0;
      this.H = _md_ts_1.SHA224_IV[7] | 0;
    }
  }
  sha2.SHA224 = SHA224;
  const K512 = /* @__PURE__ */ (() => u64.split([
    "0x428a2f98d728ae22",
    "0x7137449123ef65cd",
    "0xb5c0fbcfec4d3b2f",
    "0xe9b5dba58189dbbc",
    "0x3956c25bf348b538",
    "0x59f111f1b605d019",
    "0x923f82a4af194f9b",
    "0xab1c5ed5da6d8118",
    "0xd807aa98a3030242",
    "0x12835b0145706fbe",
    "0x243185be4ee4b28c",
    "0x550c7dc3d5ffb4e2",
    "0x72be5d74f27b896f",
    "0x80deb1fe3b1696b1",
    "0x9bdc06a725c71235",
    "0xc19bf174cf692694",
    "0xe49b69c19ef14ad2",
    "0xefbe4786384f25e3",
    "0x0fc19dc68b8cd5b5",
    "0x240ca1cc77ac9c65",
    "0x2de92c6f592b0275",
    "0x4a7484aa6ea6e483",
    "0x5cb0a9dcbd41fbd4",
    "0x76f988da831153b5",
    "0x983e5152ee66dfab",
    "0xa831c66d2db43210",
    "0xb00327c898fb213f",
    "0xbf597fc7beef0ee4",
    "0xc6e00bf33da88fc2",
    "0xd5a79147930aa725",
    "0x06ca6351e003826f",
    "0x142929670a0e6e70",
    "0x27b70a8546d22ffc",
    "0x2e1b21385c26c926",
    "0x4d2c6dfc5ac42aed",
    "0x53380d139d95b3df",
    "0x650a73548baf63de",
    "0x766a0abb3c77b2a8",
    "0x81c2c92e47edaee6",
    "0x92722c851482353b",
    "0xa2bfe8a14cf10364",
    "0xa81a664bbc423001",
    "0xc24b8b70d0f89791",
    "0xc76c51a30654be30",
    "0xd192e819d6ef5218",
    "0xd69906245565a910",
    "0xf40e35855771202a",
    "0x106aa07032bbd1b8",
    "0x19a4c116b8d2d0c8",
    "0x1e376c085141ab53",
    "0x2748774cdf8eeb99",
    "0x34b0bcb5e19b48a8",
    "0x391c0cb3c5c95a63",
    "0x4ed8aa4ae3418acb",
    "0x5b9cca4f7763e373",
    "0x682e6ff3d6b2b8a3",
    "0x748f82ee5defb2fc",
    "0x78a5636f43172f60",
    "0x84c87814a1f0ab72",
    "0x8cc702081a6439ec",
    "0x90befffa23631e28",
    "0xa4506cebde82bde9",
    "0xbef9a3f7b2c67915",
    "0xc67178f2e372532b",
    "0xca273eceea26619c",
    "0xd186b8c721c0c207",
    "0xeada7dd6cde0eb1e",
    "0xf57d4f7fee6ed178",
    "0x06f067aa72176fba",
    "0x0a637dc5a2c898a6",
    "0x113f9804bef90dae",
    "0x1b710b35131c471b",
    "0x28db77f523047d84",
    "0x32caab7b40c72493",
    "0x3c9ebe0a15c9bebc",
    "0x431d67c49c100d4c",
    "0x4cc5d4becb3e42b6",
    "0x597f299cfc657e2a",
    "0x5fcb6fab3ad6faec",
    "0x6c44198c4a475817"
  ].map((n) => BigInt(n))))();
  const SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
  const SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
  const SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
  const SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
  class SHA512 extends _md_ts_1.HashMD {
    constructor(outputLen = 64) {
      super(128, outputLen, 16, false);
      this.Ah = _md_ts_1.SHA512_IV[0] | 0;
      this.Al = _md_ts_1.SHA512_IV[1] | 0;
      this.Bh = _md_ts_1.SHA512_IV[2] | 0;
      this.Bl = _md_ts_1.SHA512_IV[3] | 0;
      this.Ch = _md_ts_1.SHA512_IV[4] | 0;
      this.Cl = _md_ts_1.SHA512_IV[5] | 0;
      this.Dh = _md_ts_1.SHA512_IV[6] | 0;
      this.Dl = _md_ts_1.SHA512_IV[7] | 0;
      this.Eh = _md_ts_1.SHA512_IV[8] | 0;
      this.El = _md_ts_1.SHA512_IV[9] | 0;
      this.Fh = _md_ts_1.SHA512_IV[10] | 0;
      this.Fl = _md_ts_1.SHA512_IV[11] | 0;
      this.Gh = _md_ts_1.SHA512_IV[12] | 0;
      this.Gl = _md_ts_1.SHA512_IV[13] | 0;
      this.Hh = _md_ts_1.SHA512_IV[14] | 0;
      this.Hl = _md_ts_1.SHA512_IV[15] | 0;
    }
    // prettier-ignore
    get() {
      const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
    }
    // prettier-ignore
    set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
      this.Ah = Ah | 0;
      this.Al = Al | 0;
      this.Bh = Bh | 0;
      this.Bl = Bl | 0;
      this.Ch = Ch | 0;
      this.Cl = Cl | 0;
      this.Dh = Dh | 0;
      this.Dl = Dl | 0;
      this.Eh = Eh | 0;
      this.El = El | 0;
      this.Fh = Fh | 0;
      this.Fl = Fl | 0;
      this.Gh = Gh | 0;
      this.Gl = Gl | 0;
      this.Hh = Hh | 0;
      this.Hl = Hl | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4) {
        SHA512_W_H[i] = view.getUint32(offset);
        SHA512_W_L[i] = view.getUint32(offset += 4);
      }
      for (let i = 16; i < 80; i++) {
        const W15h = SHA512_W_H[i - 15] | 0;
        const W15l = SHA512_W_L[i - 15] | 0;
        const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
        const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
        const W2h = SHA512_W_H[i - 2] | 0;
        const W2l = SHA512_W_L[i - 2] | 0;
        const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
        const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
        const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
        const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
        SHA512_W_H[i] = SUMh | 0;
        SHA512_W_L[i] = SUMl | 0;
      }
      let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
      for (let i = 0; i < 80; i++) {
        const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
        const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
        const CHIh = Eh & Fh ^ ~Eh & Gh;
        const CHIl = El & Fl ^ ~El & Gl;
        const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
        const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
        const T1l = T1ll | 0;
        const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
        const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
        const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
        const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
        Hh = Gh | 0;
        Hl = Gl | 0;
        Gh = Fh | 0;
        Gl = Fl | 0;
        Fh = Eh | 0;
        Fl = El | 0;
        ({ h: Eh, l: El } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
        Dh = Ch | 0;
        Dl = Cl | 0;
        Ch = Bh | 0;
        Cl = Bl | 0;
        Bh = Ah | 0;
        Bl = Al | 0;
        const All = u64.add3L(T1l, sigma0l, MAJl);
        Ah = u64.add3H(All, T1h, sigma0h, MAJh);
        Al = All | 0;
      }
      ({ h: Ah, l: Al } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
      ({ h: Bh, l: Bl } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
      ({ h: Ch, l: Cl } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
      ({ h: Dh, l: Dl } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
      ({ h: Eh, l: El } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
      ({ h: Fh, l: Fl } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
      ({ h: Gh, l: Gl } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
      ({ h: Hh, l: Hl } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
      this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
    }
    roundClean() {
      (0, utils_ts_1.clean)(SHA512_W_H, SHA512_W_L);
    }
    destroy() {
      (0, utils_ts_1.clean)(this.buffer);
      this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
    }
  }
  sha2.SHA512 = SHA512;
  class SHA384 extends SHA512 {
    constructor() {
      super(48);
      this.Ah = _md_ts_1.SHA384_IV[0] | 0;
      this.Al = _md_ts_1.SHA384_IV[1] | 0;
      this.Bh = _md_ts_1.SHA384_IV[2] | 0;
      this.Bl = _md_ts_1.SHA384_IV[3] | 0;
      this.Ch = _md_ts_1.SHA384_IV[4] | 0;
      this.Cl = _md_ts_1.SHA384_IV[5] | 0;
      this.Dh = _md_ts_1.SHA384_IV[6] | 0;
      this.Dl = _md_ts_1.SHA384_IV[7] | 0;
      this.Eh = _md_ts_1.SHA384_IV[8] | 0;
      this.El = _md_ts_1.SHA384_IV[9] | 0;
      this.Fh = _md_ts_1.SHA384_IV[10] | 0;
      this.Fl = _md_ts_1.SHA384_IV[11] | 0;
      this.Gh = _md_ts_1.SHA384_IV[12] | 0;
      this.Gl = _md_ts_1.SHA384_IV[13] | 0;
      this.Hh = _md_ts_1.SHA384_IV[14] | 0;
      this.Hl = _md_ts_1.SHA384_IV[15] | 0;
    }
  }
  sha2.SHA384 = SHA384;
  const T224_IV = /* @__PURE__ */ Uint32Array.from([
    2352822216,
    424955298,
    1944164710,
    2312950998,
    502970286,
    855612546,
    1738396948,
    1479516111,
    258812777,
    2077511080,
    2011393907,
    79989058,
    1067287976,
    1780299464,
    286451373,
    2446758561
  ]);
  const T256_IV = /* @__PURE__ */ Uint32Array.from([
    573645204,
    4230739756,
    2673172387,
    3360449730,
    596883563,
    1867755857,
    2520282905,
    1497426621,
    2519219938,
    2827943907,
    3193839141,
    1401305490,
    721525244,
    746961066,
    246885852,
    2177182882
  ]);
  class SHA512_224 extends SHA512 {
    constructor() {
      super(28);
      this.Ah = T224_IV[0] | 0;
      this.Al = T224_IV[1] | 0;
      this.Bh = T224_IV[2] | 0;
      this.Bl = T224_IV[3] | 0;
      this.Ch = T224_IV[4] | 0;
      this.Cl = T224_IV[5] | 0;
      this.Dh = T224_IV[6] | 0;
      this.Dl = T224_IV[7] | 0;
      this.Eh = T224_IV[8] | 0;
      this.El = T224_IV[9] | 0;
      this.Fh = T224_IV[10] | 0;
      this.Fl = T224_IV[11] | 0;
      this.Gh = T224_IV[12] | 0;
      this.Gl = T224_IV[13] | 0;
      this.Hh = T224_IV[14] | 0;
      this.Hl = T224_IV[15] | 0;
    }
  }
  sha2.SHA512_224 = SHA512_224;
  class SHA512_256 extends SHA512 {
    constructor() {
      super(32);
      this.Ah = T256_IV[0] | 0;
      this.Al = T256_IV[1] | 0;
      this.Bh = T256_IV[2] | 0;
      this.Bl = T256_IV[3] | 0;
      this.Ch = T256_IV[4] | 0;
      this.Cl = T256_IV[5] | 0;
      this.Dh = T256_IV[6] | 0;
      this.Dl = T256_IV[7] | 0;
      this.Eh = T256_IV[8] | 0;
      this.El = T256_IV[9] | 0;
      this.Fh = T256_IV[10] | 0;
      this.Fl = T256_IV[11] | 0;
      this.Gh = T256_IV[12] | 0;
      this.Gl = T256_IV[13] | 0;
      this.Hh = T256_IV[14] | 0;
      this.Hl = T256_IV[15] | 0;
    }
  }
  sha2.SHA512_256 = SHA512_256;
  sha2.sha256 = (0, utils_ts_1.createHasher)(() => new SHA256());
  sha2.sha224 = (0, utils_ts_1.createHasher)(() => new SHA224());
  sha2.sha512 = (0, utils_ts_1.createHasher)(() => new SHA512());
  sha2.sha384 = (0, utils_ts_1.createHasher)(() => new SHA384());
  sha2.sha512_256 = (0, utils_ts_1.createHasher)(() => new SHA512_256());
  sha2.sha512_224 = (0, utils_ts_1.createHasher)(() => new SHA512_224());
  return sha2;
}
var hasRequiredSha256$1;
function requireSha256$1() {
  if (hasRequiredSha256$1) return sha256$2;
  hasRequiredSha256$1 = 1;
  Object.defineProperty(sha256$2, "__esModule", { value: true });
  sha256$2.sha224 = sha256$2.SHA224 = sha256$2.sha256 = sha256$2.SHA256 = void 0;
  const sha2_ts_1 = /* @__PURE__ */ requireSha2();
  sha256$2.SHA256 = sha2_ts_1.SHA256;
  sha256$2.sha256 = sha2_ts_1.sha256;
  sha256$2.SHA224 = sha2_ts_1.SHA224;
  sha256$2.sha224 = sha2_ts_1.sha224;
  return sha256$2;
}
var src$1;
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src$1;
  hasRequiredSrc = 1;
  function base2(ALPHABET) {
    if (ALPHABET.length >= 255) {
      throw new TypeError("Alphabet too long");
    }
    var BASE_MAP = new Uint8Array(256);
    for (var j = 0; j < BASE_MAP.length; j++) {
      BASE_MAP[j] = 255;
    }
    for (var i = 0; i < ALPHABET.length; i++) {
      var x = ALPHABET.charAt(i);
      var xc = x.charCodeAt(0);
      if (BASE_MAP[xc] !== 255) {
        throw new TypeError(x + " is ambiguous");
      }
      BASE_MAP[xc] = i;
    }
    var BASE = ALPHABET.length;
    var LEADER = ALPHABET.charAt(0);
    var FACTOR = Math.log(BASE) / Math.log(256);
    var iFACTOR = Math.log(256) / Math.log(BASE);
    function encode(source) {
      if (source instanceof Uint8Array) ;
      else if (ArrayBuffer.isView(source)) {
        source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
      } else if (Array.isArray(source)) {
        source = Uint8Array.from(source);
      }
      if (!(source instanceof Uint8Array)) {
        throw new TypeError("Expected Uint8Array");
      }
      if (source.length === 0) {
        return "";
      }
      var zeroes = 0;
      var length = 0;
      var pbegin = 0;
      var pend = source.length;
      while (pbegin !== pend && source[pbegin] === 0) {
        pbegin++;
        zeroes++;
      }
      var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
      var b58 = new Uint8Array(size);
      while (pbegin !== pend) {
        var carry = source[pbegin];
        var i2 = 0;
        for (var it1 = size - 1; (carry !== 0 || i2 < length) && it1 !== -1; it1--, i2++) {
          carry += 256 * b58[it1] >>> 0;
          b58[it1] = carry % BASE >>> 0;
          carry = carry / BASE >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i2;
        pbegin++;
      }
      var it2 = size - length;
      while (it2 !== size && b58[it2] === 0) {
        it2++;
      }
      var str = LEADER.repeat(zeroes);
      for (; it2 < size; ++it2) {
        str += ALPHABET.charAt(b58[it2]);
      }
      return str;
    }
    function decodeUnsafe(source) {
      if (typeof source !== "string") {
        throw new TypeError("Expected String");
      }
      if (source.length === 0) {
        return new Uint8Array();
      }
      var psz = 0;
      var zeroes = 0;
      var length = 0;
      while (source[psz] === LEADER) {
        zeroes++;
        psz++;
      }
      var size = (source.length - psz) * FACTOR + 1 >>> 0;
      var b256 = new Uint8Array(size);
      while (source[psz]) {
        var charCode = source.charCodeAt(psz);
        if (charCode > 255) {
          return;
        }
        var carry = BASE_MAP[charCode];
        if (carry === 255) {
          return;
        }
        var i2 = 0;
        for (var it3 = size - 1; (carry !== 0 || i2 < length) && it3 !== -1; it3--, i2++) {
          carry += BASE * b256[it3] >>> 0;
          b256[it3] = carry % 256 >>> 0;
          carry = carry / 256 >>> 0;
        }
        if (carry !== 0) {
          throw new Error("Non-zero carry");
        }
        length = i2;
        psz++;
      }
      var it4 = size - length;
      while (it4 !== size && b256[it4] === 0) {
        it4++;
      }
      var vch = new Uint8Array(zeroes + (size - it4));
      var j2 = zeroes;
      while (it4 !== size) {
        vch[j2++] = b256[it4++];
      }
      return vch;
    }
    function decode(string2) {
      var buffer = decodeUnsafe(string2);
      if (buffer) {
        return buffer;
      }
      throw new Error("Non-base" + BASE + " character");
    }
    return {
      encode,
      decodeUnsafe,
      decode
    };
  }
  src$1 = base2;
  return src$1;
}
var bs58;
var hasRequiredBs58;
function requireBs58() {
  if (hasRequiredBs58) return bs58;
  hasRequiredBs58 = 1;
  const basex = requireSrc();
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  bs58 = basex(ALPHABET);
  return bs58;
}
var base;
var hasRequiredBase;
function requireBase() {
  if (hasRequiredBase) return base;
  hasRequiredBase = 1;
  var base58 = requireBs58();
  base = function(checksumFn) {
    function encode(payload) {
      var payloadU8 = Uint8Array.from(payload);
      var checksum = checksumFn(payloadU8);
      var length = payloadU8.length + 4;
      var both = new Uint8Array(length);
      both.set(payloadU8, 0);
      both.set(checksum.subarray(0, 4), payloadU8.length);
      return base58.encode(both, length);
    }
    function decodeRaw(buffer) {
      var payload = buffer.slice(0, -4);
      var checksum = buffer.slice(-4);
      var newChecksum = checksumFn(payload);
      if (checksum[0] ^ newChecksum[0] | checksum[1] ^ newChecksum[1] | checksum[2] ^ newChecksum[2] | checksum[3] ^ newChecksum[3]) return;
      return payload;
    }
    function decodeUnsafe(string2) {
      var buffer = base58.decodeUnsafe(string2);
      if (!buffer) return;
      return decodeRaw(buffer);
    }
    function decode(string2) {
      var buffer = base58.decode(string2);
      var payload = decodeRaw(buffer);
      if (!payload) throw new Error("Invalid checksum");
      return payload;
    }
    return {
      encode,
      decode,
      decodeUnsafe
    };
  };
  return base;
}
var bs58check$1;
var hasRequiredBs58check;
function requireBs58check() {
  if (hasRequiredBs58check) return bs58check$1;
  hasRequiredBs58check = 1;
  var { sha256: sha2562 } = /* @__PURE__ */ requireSha256$1();
  var bs58checkBase = requireBase();
  function sha256x2(buffer) {
    return sha2562(sha2562(buffer));
  }
  bs58check$1 = bs58checkBase(sha256x2);
  return bs58check$1;
}
var bs58checkExports = requireBs58check();
const bs58check = /* @__PURE__ */ getDefaultExportFromCjs(bs58checkExports);
const uint8ArrayToHexString = (data) => {
  return Array.from(data, (byte) => byte.toString(16).padStart(2, "0")).join("");
};
const urlPrefix = "automerge:";
const parseAutomergeUrl = (url) => {
  const [baseUrl, headsSection, ...rest] = url.split("#");
  if (rest.length > 0) {
    throw new Error("Invalid URL: contains multiple heads sections");
  }
  const regex = new RegExp(`^${urlPrefix}(\\w+)$`);
  const [, docMatch] = baseUrl.match(regex) || [];
  const documentId = docMatch;
  const binaryDocumentId = documentIdToBinary(documentId);
  if (!binaryDocumentId)
    throw new Error("Invalid document URL: " + url);
  if (headsSection === void 0)
    return { binaryDocumentId, documentId };
  const heads = headsSection === "" ? [] : headsSection.split("|");
  const hexHeads = heads.map((head) => {
    try {
      return uint8ArrayToHexString(bs58check.decode(head));
    } catch (e) {
      throw new Error(`Invalid head in URL: ${head}`);
    }
  });
  return { binaryDocumentId, hexHeads, documentId, heads };
};
const stringifyAutomergeUrl = (arg) => {
  if (arg instanceof Uint8Array || typeof arg === "string") {
    return urlPrefix + (arg instanceof Uint8Array ? binaryToDocumentId(arg) : arg);
  }
  const { documentId, heads = void 0 } = arg;
  if (documentId === void 0)
    throw new Error("Invalid documentId: " + documentId);
  const encodedDocumentId = documentId instanceof Uint8Array ? binaryToDocumentId(documentId) : documentId;
  let url = `${urlPrefix}${encodedDocumentId}`;
  if (heads !== void 0) {
    heads.forEach((head) => {
      try {
        bs58check.decode(head);
      } catch (e) {
        throw new Error(`Invalid head: ${head}`);
      }
    });
    url += "#" + heads.join("|");
  }
  return url;
};
const anyDocumentIdToAutomergeUrl = (id2) => isValidAutomergeUrl(id2) ? id2 : isValidDocumentId(id2) ? stringifyAutomergeUrl({ documentId: id2 }) : isValidUuid(id2) ? parseLegacyUUID(id2) : void 0;
const isValidAutomergeUrl = (str) => {
  if (typeof str !== "string" || !str || !str.startsWith(urlPrefix))
    return false;
  try {
    const { documentId, heads } = parseAutomergeUrl(str);
    if (!isValidDocumentId(documentId))
      return false;
    if (heads && !heads.every((head) => {
      try {
        bs58check.decode(head);
        return true;
      } catch {
        return false;
      }
    }))
      return false;
    return true;
  } catch {
    return false;
  }
};
const isValidDocumentId = (str) => {
  if (typeof str !== "string")
    return false;
  const binaryDocumentID = documentIdToBinary(str);
  return binaryDocumentID !== void 0;
};
const isValidUuid = (str) => typeof str === "string" && validate(str);
const documentIdToBinary = (docId) => bs58check.decodeUnsafe(docId);
const binaryToDocumentId = (docId) => bs58check.encode(docId);
const parseLegacyUUID = (str) => {
  if (!validate(str))
    return void 0;
  const documentId = parse(str);
  return stringifyAutomergeUrl({ documentId });
};
const wrapperCache = /* @__PURE__ */ new Map();
function useDocHandle(id2, { suspense } = { suspense: false }) {
  const repo = useRepo();
  const controllerRef = reactExports.useRef();
  const [handle, setHandle] = reactExports.useState();
  let currentHandle = (
    // make sure the handle matches the id
    id2 && handle && handle.url === anyDocumentIdToAutomergeUrl(id2) ? handle : void 0
  );
  if (id2 && !currentHandle) {
    const progress = repo.findWithProgress(id2);
    if (progress.state === "ready") {
      currentHandle = progress.handle;
    }
  }
  let wrapper = id2 ? wrapperCache.get(id2) : void 0;
  if (!wrapper && id2) {
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const promise = repo.find(id2, { signal: controllerRef.current.signal });
    wrapper = wrapPromise(promise);
    wrapperCache.set(id2, wrapper);
  }
  reactExports.useEffect(() => {
    if (currentHandle || suspense || !wrapper) {
      return;
    }
    wrapper.promise.then((handle2) => {
      setHandle(handle2);
    }).catch(() => {
      setHandle(void 0);
    });
  }, [currentHandle, suspense, wrapper]);
  if (currentHandle || !suspense || !wrapper) {
    return currentHandle;
  }
  return wrapper.read();
}
function useDocument(id2, params = { suspense: false }) {
  const handle = useDocHandle(id2, params);
  const [doc, setDoc] = reactExports.useState(() => handle?.doc());
  const [deleteError, setDeleteError] = reactExports.useState();
  reactExports.useEffect(() => {
    setDoc(handle?.doc());
  }, [handle]);
  reactExports.useEffect(() => {
    if (!handle) {
      return;
    }
    const onChange = () => setDoc(handle.doc());
    const onDelete = () => {
      setDeleteError(new Error(`Document ${id2} was deleted`));
    };
    handle.on("change", onChange);
    handle.on("delete", onDelete);
    return () => {
      handle.removeListener("change", onChange);
      handle.removeListener("delete", onDelete);
    };
  }, [handle, id2]);
  const changeDoc = reactExports.useCallback(
    (changeFn, options) => {
      handle.change(changeFn, options);
    },
    [handle]
  );
  if (deleteError) {
    throw deleteError;
  }
  if (!doc) {
    return [void 0, () => {
    }];
  }
  return [doc, changeDoc];
}
var eventemitter3 = { exports: {} };
var hasRequiredEventemitter3;
function requireEventemitter3() {
  if (hasRequiredEventemitter3) return eventemitter3.exports;
  hasRequiredEventemitter3 = 1;
  (function(module) {
    var has = Object.prototype.hasOwnProperty, prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name2;
      if (this._eventsCount === 0) return names;
      for (name2 in events = this._events) {
        if (has.call(events, name2)) names.push(prefix ? name2.slice(1) : name2);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    {
      module.exports = EventEmitter2;
    }
  })(eventemitter3);
  return eventemitter3.exports;
}
var eventemitter3Exports = requireEventemitter3();
const EventEmitter = /* @__PURE__ */ getDefaultExportFromCjs(eventemitter3Exports);
new EventEmitter();
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
function valueAt(target2, prop) {
  const { context, objectId, path } = target2;
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
  get(target2, key) {
    const { context, objectId, cache } = target2;
    if (key === Symbol.toStringTag) {
      return target2[Symbol.toStringTag];
    }
    if (key === OBJECT_ID)
      return objectId;
    if (key === IS_PROXY)
      return true;
    if (key === TRACE)
      return target2.trace;
    if (key === STATE)
      return { handle: context };
    if (!cache[key]) {
      cache[key] = valueAt(target2, key);
    }
    return cache[key];
  },
  set(target2, key, val) {
    const { context, objectId, path } = target2;
    target2.cache = {};
    if (isSameDocument(val, context)) {
      throw new RangeError("Cannot create a reference to an existing document object");
    }
    if (key === TRACE) {
      target2.trace = val;
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
  deleteProperty(target2, key) {
    const { context, objectId } = target2;
    target2.cache = {};
    context.delete(objectId, key);
    return true;
  },
  has(target2, key) {
    const value = this.get(target2, key);
    return value !== void 0;
  },
  getOwnPropertyDescriptor(target2, key) {
    const value = this.get(target2, key);
    if (typeof value !== "undefined") {
      return {
        configurable: true,
        enumerable: true,
        value
      };
    }
  },
  ownKeys(target2) {
    const { context, objectId } = target2;
    const keys = context.keys(objectId);
    return [...new Set(keys)];
  }
};
const ListHandler = {
  get(target2, index) {
    const { context, objectId } = target2;
    index = parseListIndex(index);
    if (index === Symbol.hasInstance) {
      return (instance) => {
        return Array.isArray(instance);
      };
    }
    if (index === Symbol.toStringTag) {
      return target2[Symbol.toStringTag];
    }
    if (index === OBJECT_ID)
      return objectId;
    if (index === IS_PROXY)
      return true;
    if (index === TRACE)
      return target2.trace;
    if (index === STATE)
      return { handle: context };
    if (index === "length")
      return context.length(objectId);
    if (typeof index === "number") {
      return valueAt(target2, index);
    } else {
      return listMethods(target2)[index];
    }
  },
  set(target2, index, val) {
    const { context, objectId, path } = target2;
    index = parseListIndex(index);
    if (isSameDocument(val, context)) {
      throw new RangeError("Cannot create a reference to an existing document object");
    }
    if (index === CLEAR_CACHE) {
      return true;
    }
    if (index === TRACE) {
      target2.trace = val;
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
  deleteProperty(target2, index) {
    const { context, objectId } = target2;
    index = parseListIndex(index);
    const elem = context.get(objectId, index);
    if (elem != null && elem[0] == "counter") {
      throw new TypeError("Unsupported operation: deleting a counter from a list");
    }
    context.delete(objectId, index);
    return true;
  },
  has(target2, index) {
    const { context, objectId } = target2;
    index = parseListIndex(index);
    if (typeof index === "number") {
      return index < context.length(objectId);
    }
    return index === "length";
  },
  getOwnPropertyDescriptor(target2, index) {
    const { context, objectId } = target2;
    if (index === "length")
      return { writable: true, value: context.length(objectId) };
    if (index === OBJECT_ID)
      return { configurable: false, enumerable: false, value: objectId };
    index = parseListIndex(index);
    const value = valueAt(target2, index);
    return { configurable: true, enumerable: true, value };
  },
  getPrototypeOf(target2) {
    return Object.getPrototypeOf(target2);
  },
  ownKeys() {
    const keys = [];
    keys.push("length");
    return keys;
  }
};
Object.assign({}, ListHandler, {
  get(target2, index) {
    const { context, objectId } = target2;
    index = parseListIndex(index);
    if (index === Symbol.hasInstance) {
      return (instance) => {
        return Array.isArray(instance);
      };
    }
    if (index === Symbol.toStringTag) {
      return target2[Symbol.toStringTag];
    }
    if (index === OBJECT_ID)
      return objectId;
    if (index === IS_PROXY)
      return true;
    if (index === TRACE)
      return target2.trace;
    if (index === STATE)
      return { handle: context };
    if (index === "length")
      return context.length(objectId);
    if (typeof index === "number") {
      return valueAt(target2, index);
    } else {
      return textMethods(target2)[index] || listMethods(target2)[index];
    }
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(new Text());
  }
});
function mapProxy(context, objectId, path) {
  const target2 = {
    context,
    objectId,
    path: path || [],
    cache: {}
  };
  const proxied = {};
  Object.assign(proxied, target2);
  const result = new Proxy(proxied, MapHandler);
  return result;
}
function listProxy(context, objectId, path) {
  const target2 = {
    context,
    objectId,
    path: path || [],
    cache: {}
  };
  const proxied = [];
  Object.assign(proxied, target2);
  return new Proxy(proxied, ListHandler);
}
function listMethods(target2) {
  const { context, objectId, path } = target2;
  const methods = {
    at(index) {
      return valueAt(target2, index);
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
          if (searchElement === valueAt(target2, i)) {
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
      const last = valueAt(target2, length - 1);
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
      const first = valueAt(target2, 0);
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
        const value = valueAt(target2, index);
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
          const value = valueAt(target2, i);
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
          const value = valueAt(target2, i++);
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
        value = valueAt(target2, list.length);
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
      let value = valueAt(target2, i);
      while (value !== void 0) {
        yield value;
        i += 1;
        value = valueAt(target2, i);
      }
    }
  };
  return methods;
}
function textMethods(target2) {
  const { context, objectId } = target2;
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
        listMethods(target2).insertAt(index, ...values);
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
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse2(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse2(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name2) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name2 + (isPlural ? "s" : "");
  }
  return ms;
}
var common;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = requireMs();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug2(...args) {
        if (!debug2.enabled) {
          return;
        }
        const self = debug2;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self.diff = ms2;
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self, args);
        const logFn = self.log || createDebug.log;
        logFn.apply(self, args);
      }
      debug2.namespace = namespace;
      debug2.useColors = createDebug.useColors();
      debug2.color = createDebug.selectColor(namespace);
      debug2.extend = extend;
      debug2.destroy = createDebug.destroy;
      Object.defineProperty(debug2, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function") {
        createDebug.init(debug2);
      }
      return debug2;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug.skips.push(ns.slice(1));
        } else {
          createDebug.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug.names,
        ...createDebug.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name2) {
      for (const skip of createDebug.skips) {
        if (matchesTemplate(name2, skip)) {
          return false;
        }
      }
      for (const ns of createDebug.names) {
        if (matchesTemplate(name2, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  common = setup;
  return common;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module, exports$1) {
    exports$1.formatArgs = formatArgs;
    exports$1.save = save;
    exports$1.load = load;
    exports$1.useColors = useColors;
    exports$1.storage = localstorage();
    exports$1.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports$1.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports$1.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports$1.storage.setItem("debug", namespaces);
        } else {
          exports$1.storage.removeItem("debug");
        }
      } catch (error) {
      }
    }
    function load() {
      let r;
      try {
        r = exports$1.storage.getItem("debug") || exports$1.storage.getItem("DEBUG");
      } catch (error) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = define_process_env_default$1.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error) {
      }
    }
    module.exports = requireCommon()(exports$1);
    const { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error) {
        return "[UnexpectedJSONParseError]: " + error.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var browserExports = requireBrowser();
const debug = /* @__PURE__ */ getDefaultExportFromCjs(browserExports);
let decoder;
try {
  decoder = new TextDecoder();
} catch (error) {
}
let src;
let srcEnd;
let position$1 = 0;
const LEGACY_RECORD_INLINE_ID = 105;
const RECORD_DEFINITIONS_ID = 57342;
const RECORD_INLINE_ID = 57343;
const BUNDLED_STRINGS_ID = 57337;
const PACKED_REFERENCE_TAG_ID = 6;
const STOP_CODE = {};
let maxArraySize = 11281e4;
let maxMapSize = 1681e4;
let currentDecoder = {};
let currentStructures;
let srcString;
let srcStringStart = 0;
let srcStringEnd = 0;
let bundledStrings$1;
let referenceMap;
let currentExtensions = [];
let currentExtensionRanges = [];
let packedValues;
let dataView;
let restoreMapsAsObject;
let defaultOptions = {
  useRecords: false,
  mapsAsObjects: true
};
let sequentialMode = false;
let inlineObjectReadThreshold = 2;
try {
  new Function("");
} catch (error) {
  inlineObjectReadThreshold = Infinity;
}
class Decoder {
  constructor(options) {
    if (options) {
      if ((options.keyMap || options._keyMap) && !options.useRecords) {
        options.useRecords = false;
        options.mapsAsObjects = true;
      }
      if (options.useRecords === false && options.mapsAsObjects === void 0)
        options.mapsAsObjects = true;
      if (options.getStructures)
        options.getShared = options.getStructures;
      if (options.getShared && !options.structures)
        (options.structures = []).uninitialized = true;
      if (options.keyMap) {
        this.mapKey = /* @__PURE__ */ new Map();
        for (let [k, v] of Object.entries(options.keyMap)) this.mapKey.set(v, k);
      }
    }
    Object.assign(this, options);
  }
  /*
  decodeKey(key) {
  	return this.keyMap
  		? Object.keys(this.keyMap)[Object.values(this.keyMap).indexOf(key)] || key
  		: key
  }
  */
  decodeKey(key) {
    return this.keyMap ? this.mapKey.get(key) || key : key;
  }
  encodeKey(key) {
    return this.keyMap && this.keyMap.hasOwnProperty(key) ? this.keyMap[key] : key;
  }
  encodeKeys(rec) {
    if (!this._keyMap) return rec;
    let map = /* @__PURE__ */ new Map();
    for (let [k, v] of Object.entries(rec)) map.set(this._keyMap.hasOwnProperty(k) ? this._keyMap[k] : k, v);
    return map;
  }
  decodeKeys(map) {
    if (!this._keyMap || map.constructor.name != "Map") return map;
    if (!this._mapKey) {
      this._mapKey = /* @__PURE__ */ new Map();
      for (let [k, v] of Object.entries(this._keyMap)) this._mapKey.set(v, k);
    }
    let res = {};
    map.forEach((v, k) => res[safeKey(this._mapKey.has(k) ? this._mapKey.get(k) : k)] = v);
    return res;
  }
  mapDecode(source, end) {
    let res = this.decode(source);
    if (this._keyMap) {
      switch (res.constructor.name) {
        case "Array":
          return res.map((r) => this.decodeKeys(r));
      }
    }
    return res;
  }
  decode(source, end) {
    if (src) {
      return saveState(() => {
        clearSource();
        return this ? this.decode(source, end) : Decoder.prototype.decode.call(defaultOptions, source, end);
      });
    }
    srcEnd = end > -1 ? end : source.length;
    position$1 = 0;
    srcStringEnd = 0;
    srcString = null;
    bundledStrings$1 = null;
    src = source;
    try {
      dataView = source.dataView || (source.dataView = new DataView(source.buffer, source.byteOffset, source.byteLength));
    } catch (error) {
      src = null;
      if (source instanceof Uint8Array)
        throw error;
      throw new Error("Source must be a Uint8Array or Buffer but was a " + (source && typeof source == "object" ? source.constructor.name : typeof source));
    }
    if (this instanceof Decoder) {
      currentDecoder = this;
      packedValues = this.sharedValues && (this.pack ? new Array(this.maxPrivatePackedValues || 16).concat(this.sharedValues) : this.sharedValues);
      if (this.structures) {
        currentStructures = this.structures;
        return checkedRead();
      } else if (!currentStructures || currentStructures.length > 0) {
        currentStructures = [];
      }
    } else {
      currentDecoder = defaultOptions;
      if (!currentStructures || currentStructures.length > 0)
        currentStructures = [];
      packedValues = null;
    }
    return checkedRead();
  }
  decodeMultiple(source, forEach) {
    let values, lastPosition = 0;
    try {
      let size = source.length;
      sequentialMode = true;
      let value = this ? this.decode(source, size) : defaultDecoder.decode(source, size);
      if (forEach) {
        if (forEach(value) === false) {
          return;
        }
        while (position$1 < size) {
          lastPosition = position$1;
          if (forEach(checkedRead()) === false) {
            return;
          }
        }
      } else {
        values = [value];
        while (position$1 < size) {
          lastPosition = position$1;
          values.push(checkedRead());
        }
        return values;
      }
    } catch (error) {
      error.lastPosition = lastPosition;
      error.values = values;
      throw error;
    } finally {
      sequentialMode = false;
      clearSource();
    }
  }
}
function checkedRead() {
  try {
    let result = read();
    if (bundledStrings$1) {
      if (position$1 >= bundledStrings$1.postBundlePosition) {
        let error = new Error("Unexpected bundle position");
        error.incomplete = true;
        throw error;
      }
      position$1 = bundledStrings$1.postBundlePosition;
      bundledStrings$1 = null;
    }
    if (position$1 == srcEnd) {
      currentStructures = null;
      src = null;
      if (referenceMap)
        referenceMap = null;
    } else if (position$1 > srcEnd) {
      let error = new Error("Unexpected end of CBOR data");
      error.incomplete = true;
      throw error;
    } else if (!sequentialMode) {
      throw new Error("Data read, but end of buffer not reached");
    }
    return result;
  } catch (error) {
    clearSource();
    if (error instanceof RangeError || error.message.startsWith("Unexpected end of buffer")) {
      error.incomplete = true;
    }
    throw error;
  }
}
function read() {
  let token = src[position$1++];
  let majorType = token >> 5;
  token = token & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        token = src[position$1++];
        break;
      case 25:
        if (majorType == 7) {
          return getFloat16();
        }
        token = dataView.getUint16(position$1);
        position$1 += 2;
        break;
      case 26:
        if (majorType == 7) {
          let value = dataView.getFloat32(position$1);
          if (currentDecoder.useFloat32 > 2) {
            let multiplier = mult10[(src[position$1] & 127) << 1 | src[position$1 + 1] >> 7];
            position$1 += 4;
            return (multiplier * value + (value > 0 ? 0.5 : -0.5) >> 0) / multiplier;
          }
          position$1 += 4;
          return value;
        }
        token = dataView.getUint32(position$1);
        position$1 += 4;
        break;
      case 27:
        if (majorType == 7) {
          let value = dataView.getFloat64(position$1);
          position$1 += 8;
          return value;
        }
        if (majorType > 1) {
          if (dataView.getUint32(position$1) > 0)
            throw new Error("JavaScript does not support arrays, maps, or strings with length over 4294967295");
          token = dataView.getUint32(position$1 + 4);
        } else if (currentDecoder.int64AsNumber) {
          token = dataView.getUint32(position$1) * 4294967296;
          token += dataView.getUint32(position$1 + 4);
        } else
          token = dataView.getBigUint64(position$1);
        position$1 += 8;
        break;
      case 31:
        switch (majorType) {
          case 2:
          // byte string
          case 3:
            throw new Error("Indefinite length not supported for byte or text strings");
          case 4:
            let array = [];
            let value, i = 0;
            while ((value = read()) != STOP_CODE) {
              if (i >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
              array[i++] = value;
            }
            return majorType == 4 ? array : majorType == 3 ? array.join("") : Buffer.concat(array);
          case 5:
            let key;
            if (currentDecoder.mapsAsObjects) {
              let object = {};
              let i2 = 0;
              if (currentDecoder.keyMap) {
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                  object[safeKey(currentDecoder.decodeKey(key))] = read();
                }
              } else {
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) throw new Error(`Property count exceeds ${maxMapSize}`);
                  object[safeKey(key)] = read();
                }
              }
              return object;
            } else {
              if (restoreMapsAsObject) {
                currentDecoder.mapsAsObjects = true;
                restoreMapsAsObject = false;
              }
              let map = /* @__PURE__ */ new Map();
              if (currentDecoder.keyMap) {
                let i2 = 0;
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) {
                    throw new Error(`Map size exceeds ${maxMapSize}`);
                  }
                  map.set(currentDecoder.decodeKey(key), read());
                }
              } else {
                let i2 = 0;
                while ((key = read()) != STOP_CODE) {
                  if (i2++ >= maxMapSize) {
                    throw new Error(`Map size exceeds ${maxMapSize}`);
                  }
                  map.set(key, read());
                }
              }
              return map;
            }
          case 7:
            return STOP_CODE;
          default:
            throw new Error("Invalid major type for indefinite length " + majorType);
        }
      default:
        throw new Error("Unknown token " + token);
    }
  }
  switch (majorType) {
    case 0:
      return token;
    case 1:
      return ~token;
    case 2:
      return readBin(token);
    case 3:
      if (srcStringEnd >= position$1) {
        return srcString.slice(position$1 - srcStringStart, (position$1 += token) - srcStringStart);
      }
      if (srcStringEnd == 0 && srcEnd < 140 && token < 32) {
        let string2 = token < 16 ? shortStringInJS(token) : longStringInJS(token);
        if (string2 != null)
          return string2;
      }
      return readFixedString(token);
    case 4:
      if (token >= maxArraySize) throw new Error(`Array length exceeds ${maxArraySize}`);
      let array = new Array(token);
      for (let i = 0; i < token; i++) array[i] = read();
      return array;
    case 5:
      if (token >= maxMapSize) throw new Error(`Map size exceeds ${maxArraySize}`);
      if (currentDecoder.mapsAsObjects) {
        let object = {};
        if (currentDecoder.keyMap) for (let i = 0; i < token; i++) object[safeKey(currentDecoder.decodeKey(read()))] = read();
        else for (let i = 0; i < token; i++) object[safeKey(read())] = read();
        return object;
      } else {
        if (restoreMapsAsObject) {
          currentDecoder.mapsAsObjects = true;
          restoreMapsAsObject = false;
        }
        let map = /* @__PURE__ */ new Map();
        if (currentDecoder.keyMap) for (let i = 0; i < token; i++) map.set(currentDecoder.decodeKey(read()), read());
        else for (let i = 0; i < token; i++) map.set(read(), read());
        return map;
      }
    case 6:
      if (token >= BUNDLED_STRINGS_ID) {
        let structure = currentStructures[token & 8191];
        if (structure) {
          if (!structure.read) structure.read = createStructureReader(structure);
          return structure.read();
        }
        if (token < 65536) {
          if (token == RECORD_INLINE_ID) {
            let length = readJustLength();
            let id2 = read();
            let structure2 = read();
            recordDefinition(id2, structure2);
            let object = {};
            if (currentDecoder.keyMap) for (let i = 2; i < length; i++) {
              let key = currentDecoder.decodeKey(structure2[i - 2]);
              object[safeKey(key)] = read();
            }
            else for (let i = 2; i < length; i++) {
              let key = structure2[i - 2];
              object[safeKey(key)] = read();
            }
            return object;
          } else if (token == RECORD_DEFINITIONS_ID) {
            let length = readJustLength();
            let id2 = read();
            for (let i = 2; i < length; i++) {
              recordDefinition(id2++, read());
            }
            return read();
          } else if (token == BUNDLED_STRINGS_ID) {
            return readBundleExt();
          }
          if (currentDecoder.getShared) {
            loadShared();
            structure = currentStructures[token & 8191];
            if (structure) {
              if (!structure.read)
                structure.read = createStructureReader(structure);
              return structure.read();
            }
          }
        }
      }
      let extension = currentExtensions[token];
      if (extension) {
        if (extension.handlesRead)
          return extension(read);
        else
          return extension(read());
      } else {
        let input = read();
        for (let i = 0; i < currentExtensionRanges.length; i++) {
          let value = currentExtensionRanges[i](token, input);
          if (value !== void 0)
            return value;
        }
        return new Tag$1(input, token);
      }
    case 7:
      switch (token) {
        case 20:
          return false;
        case 21:
          return true;
        case 22:
          return null;
        case 23:
          return;
        // undefined
        case 31:
        default:
          let packedValue = (packedValues || getPackedValues())[token];
          if (packedValue !== void 0)
            return packedValue;
          throw new Error("Unknown token " + token);
      }
    default:
      if (isNaN(token)) {
        let error = new Error("Unexpected end of CBOR data");
        error.incomplete = true;
        throw error;
      }
      throw new Error("Unknown CBOR token " + token);
  }
}
const validName = /^[a-zA-Z_$][a-zA-Z\d_$]*$/;
function createStructureReader(structure) {
  if (!structure) throw new Error("Structure is required in record definition");
  function readObject() {
    let length = src[position$1++];
    length = length & 31;
    if (length > 23) {
      switch (length) {
        case 24:
          length = src[position$1++];
          break;
        case 25:
          length = dataView.getUint16(position$1);
          position$1 += 2;
          break;
        case 26:
          length = dataView.getUint32(position$1);
          position$1 += 4;
          break;
        default:
          throw new Error("Expected array header, but got " + src[position$1 - 1]);
      }
    }
    let compiledReader = this.compiledReader;
    while (compiledReader) {
      if (compiledReader.propertyCount === length)
        return compiledReader(read);
      compiledReader = compiledReader.next;
    }
    if (this.slowReads++ >= inlineObjectReadThreshold) {
      let array = this.length == length ? this : this.slice(0, length);
      compiledReader = currentDecoder.keyMap ? new Function("r", "return {" + array.map((k) => currentDecoder.decodeKey(k)).map((k) => validName.test(k) ? safeKey(k) + ":r()" : "[" + JSON.stringify(k) + "]:r()").join(",") + "}") : new Function("r", "return {" + array.map((key) => validName.test(key) ? safeKey(key) + ":r()" : "[" + JSON.stringify(key) + "]:r()").join(",") + "}");
      if (this.compiledReader)
        compiledReader.next = this.compiledReader;
      compiledReader.propertyCount = length;
      this.compiledReader = compiledReader;
      return compiledReader(read);
    }
    let object = {};
    if (currentDecoder.keyMap) for (let i = 0; i < length; i++) object[safeKey(currentDecoder.decodeKey(this[i]))] = read();
    else for (let i = 0; i < length; i++) {
      object[safeKey(this[i])] = read();
    }
    return object;
  }
  structure.slowReads = 0;
  return readObject;
}
function safeKey(key) {
  if (typeof key === "string") return key === "__proto__" ? "__proto_" : key;
  if (typeof key === "number" || typeof key === "boolean" || typeof key === "bigint") return key.toString();
  if (key == null) return key + "";
  throw new Error("Invalid property name type " + typeof key);
}
let readFixedString = readStringJS;
function readStringJS(length) {
  let result;
  if (length < 16) {
    if (result = shortStringInJS(length))
      return result;
  }
  if (length > 64 && decoder)
    return decoder.decode(src.subarray(position$1, position$1 += length));
  const end = position$1 + length;
  const units = [];
  result = "";
  while (position$1 < end) {
    const byte1 = src[position$1++];
    if ((byte1 & 128) === 0) {
      units.push(byte1);
    } else if ((byte1 & 224) === 192) {
      const byte2 = src[position$1++] & 63;
      units.push((byte1 & 31) << 6 | byte2);
    } else if ((byte1 & 240) === 224) {
      const byte2 = src[position$1++] & 63;
      const byte3 = src[position$1++] & 63;
      units.push((byte1 & 31) << 12 | byte2 << 6 | byte3);
    } else if ((byte1 & 248) === 240) {
      const byte2 = src[position$1++] & 63;
      const byte3 = src[position$1++] & 63;
      const byte4 = src[position$1++] & 63;
      let unit = (byte1 & 7) << 18 | byte2 << 12 | byte3 << 6 | byte4;
      if (unit > 65535) {
        unit -= 65536;
        units.push(unit >>> 10 & 1023 | 55296);
        unit = 56320 | unit & 1023;
      }
      units.push(unit);
    } else {
      units.push(byte1);
    }
    if (units.length >= 4096) {
      result += fromCharCode.apply(String, units);
      units.length = 0;
    }
  }
  if (units.length > 0) {
    result += fromCharCode.apply(String, units);
  }
  return result;
}
let fromCharCode = String.fromCharCode;
function longStringInJS(length) {
  let start = position$1;
  let bytes = new Array(length);
  for (let i = 0; i < length; i++) {
    const byte = src[position$1++];
    if ((byte & 128) > 0) {
      position$1 = start;
      return;
    }
    bytes[i] = byte;
  }
  return fromCharCode.apply(String, bytes);
}
function shortStringInJS(length) {
  if (length < 4) {
    if (length < 2) {
      if (length === 0)
        return "";
      else {
        let a = src[position$1++];
        if ((a & 128) > 1) {
          position$1 -= 1;
          return;
        }
        return fromCharCode(a);
      }
    } else {
      let a = src[position$1++];
      let b = src[position$1++];
      if ((a & 128) > 0 || (b & 128) > 0) {
        position$1 -= 2;
        return;
      }
      if (length < 3)
        return fromCharCode(a, b);
      let c = src[position$1++];
      if ((c & 128) > 0) {
        position$1 -= 3;
        return;
      }
      return fromCharCode(a, b, c);
    }
  } else {
    let a = src[position$1++];
    let b = src[position$1++];
    let c = src[position$1++];
    let d = src[position$1++];
    if ((a & 128) > 0 || (b & 128) > 0 || (c & 128) > 0 || (d & 128) > 0) {
      position$1 -= 4;
      return;
    }
    if (length < 6) {
      if (length === 4)
        return fromCharCode(a, b, c, d);
      else {
        let e = src[position$1++];
        if ((e & 128) > 0) {
          position$1 -= 5;
          return;
        }
        return fromCharCode(a, b, c, d, e);
      }
    } else if (length < 8) {
      let e = src[position$1++];
      let f = src[position$1++];
      if ((e & 128) > 0 || (f & 128) > 0) {
        position$1 -= 6;
        return;
      }
      if (length < 7)
        return fromCharCode(a, b, c, d, e, f);
      let g = src[position$1++];
      if ((g & 128) > 0) {
        position$1 -= 7;
        return;
      }
      return fromCharCode(a, b, c, d, e, f, g);
    } else {
      let e = src[position$1++];
      let f = src[position$1++];
      let g = src[position$1++];
      let h = src[position$1++];
      if ((e & 128) > 0 || (f & 128) > 0 || (g & 128) > 0 || (h & 128) > 0) {
        position$1 -= 8;
        return;
      }
      if (length < 10) {
        if (length === 8)
          return fromCharCode(a, b, c, d, e, f, g, h);
        else {
          let i = src[position$1++];
          if ((i & 128) > 0) {
            position$1 -= 9;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i);
        }
      } else if (length < 12) {
        let i = src[position$1++];
        let j = src[position$1++];
        if ((i & 128) > 0 || (j & 128) > 0) {
          position$1 -= 10;
          return;
        }
        if (length < 11)
          return fromCharCode(a, b, c, d, e, f, g, h, i, j);
        let k = src[position$1++];
        if ((k & 128) > 0) {
          position$1 -= 11;
          return;
        }
        return fromCharCode(a, b, c, d, e, f, g, h, i, j, k);
      } else {
        let i = src[position$1++];
        let j = src[position$1++];
        let k = src[position$1++];
        let l = src[position$1++];
        if ((i & 128) > 0 || (j & 128) > 0 || (k & 128) > 0 || (l & 128) > 0) {
          position$1 -= 12;
          return;
        }
        if (length < 14) {
          if (length === 12)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l);
          else {
            let m = src[position$1++];
            if ((m & 128) > 0) {
              position$1 -= 13;
              return;
            }
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m);
          }
        } else {
          let m = src[position$1++];
          let n = src[position$1++];
          if ((m & 128) > 0 || (n & 128) > 0) {
            position$1 -= 14;
            return;
          }
          if (length < 15)
            return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n);
          let o = src[position$1++];
          if ((o & 128) > 0) {
            position$1 -= 15;
            return;
          }
          return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
        }
      }
    }
  }
}
function readBin(length) {
  return currentDecoder.copyBuffers ? (
    // specifically use the copying slice (not the node one)
    Uint8Array.prototype.slice.call(src, position$1, position$1 += length)
  ) : src.subarray(position$1, position$1 += length);
}
let f32Array = new Float32Array(1);
let u8Array = new Uint8Array(f32Array.buffer, 0, 4);
function getFloat16() {
  let byte0 = src[position$1++];
  let byte1 = src[position$1++];
  let exponent = (byte0 & 127) >> 2;
  if (exponent === 31) {
    if (byte1 || byte0 & 3)
      return NaN;
    return byte0 & 128 ? -Infinity : Infinity;
  }
  if (exponent === 0) {
    let abs = ((byte0 & 3) << 8 | byte1) / (1 << 24);
    return byte0 & 128 ? -abs : abs;
  }
  u8Array[3] = byte0 & 128 | // sign bit
  (exponent >> 1) + 56;
  u8Array[2] = (byte0 & 7) << 5 | // last exponent bit and first two mantissa bits
  byte1 >> 3;
  u8Array[1] = byte1 << 5;
  u8Array[0] = 0;
  return f32Array[0];
}
new Array(4096);
let Tag$1 = class Tag {
  constructor(value, tag) {
    this.value = value;
    this.tag = tag;
  }
};
currentExtensions[0] = (dateString) => {
  return new Date(dateString);
};
currentExtensions[1] = (epochSec) => {
  return new Date(Math.round(epochSec * 1e3));
};
currentExtensions[2] = (buffer) => {
  let value = BigInt(0);
  for (let i = 0, l = buffer.byteLength; i < l; i++) {
    value = BigInt(buffer[i]) + (value << BigInt(8));
  }
  return value;
};
currentExtensions[3] = (buffer) => {
  return BigInt(-1) - currentExtensions[2](buffer);
};
currentExtensions[4] = (fraction) => {
  return +(fraction[1] + "e" + fraction[0]);
};
currentExtensions[5] = (fraction) => {
  return fraction[1] * Math.exp(fraction[0] * Math.log(2));
};
const recordDefinition = (id2, structure) => {
  id2 = id2 - 57344;
  let existingStructure = currentStructures[id2];
  if (existingStructure && existingStructure.isShared) {
    (currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id2] = existingStructure;
  }
  currentStructures[id2] = structure;
  structure.read = createStructureReader(structure);
};
currentExtensions[LEGACY_RECORD_INLINE_ID] = (data) => {
  let length = data.length;
  let structure = data[1];
  recordDefinition(data[0], structure);
  let object = {};
  for (let i = 2; i < length; i++) {
    let key = structure[i - 2];
    object[safeKey(key)] = data[i];
  }
  return object;
};
currentExtensions[14] = (value) => {
  if (bundledStrings$1)
    return bundledStrings$1[0].slice(bundledStrings$1.position0, bundledStrings$1.position0 += value);
  return new Tag$1(value, 14);
};
currentExtensions[15] = (value) => {
  if (bundledStrings$1)
    return bundledStrings$1[1].slice(bundledStrings$1.position1, bundledStrings$1.position1 += value);
  return new Tag$1(value, 15);
};
let glbl = { Error, RegExp };
currentExtensions[27] = (data) => {
  return (glbl[data[0]] || Error)(data[1], data[2]);
};
const packedTable = (read2) => {
  if (src[position$1++] != 132) {
    let error = new Error("Packed values structure must be followed by a 4 element array");
    if (src.length < position$1)
      error.incomplete = true;
    throw error;
  }
  let newPackedValues = read2();
  if (!newPackedValues || !newPackedValues.length) {
    let error = new Error("Packed values structure must be followed by a 4 element array");
    error.incomplete = true;
    throw error;
  }
  packedValues = packedValues ? newPackedValues.concat(packedValues.slice(newPackedValues.length)) : newPackedValues;
  packedValues.prefixes = read2();
  packedValues.suffixes = read2();
  return read2();
};
packedTable.handlesRead = true;
currentExtensions[51] = packedTable;
currentExtensions[PACKED_REFERENCE_TAG_ID] = (data) => {
  if (!packedValues) {
    if (currentDecoder.getShared)
      loadShared();
    else
      return new Tag$1(data, PACKED_REFERENCE_TAG_ID);
  }
  if (typeof data == "number")
    return packedValues[16 + (data >= 0 ? 2 * data : -2 * data - 1)];
  let error = new Error("No support for non-integer packed references yet");
  if (data === void 0)
    error.incomplete = true;
  throw error;
};
currentExtensions[28] = (read2) => {
  if (!referenceMap) {
    referenceMap = /* @__PURE__ */ new Map();
    referenceMap.id = 0;
  }
  let id2 = referenceMap.id++;
  let startingPosition = position$1;
  let token = src[position$1];
  let target2;
  if (token >> 5 == 4)
    target2 = [];
  else
    target2 = {};
  let refEntry = { target: target2 };
  referenceMap.set(id2, refEntry);
  let targetProperties = read2();
  if (refEntry.used) {
    if (Object.getPrototypeOf(target2) !== Object.getPrototypeOf(targetProperties)) {
      position$1 = startingPosition;
      target2 = targetProperties;
      referenceMap.set(id2, { target: target2 });
      targetProperties = read2();
    }
    return Object.assign(target2, targetProperties);
  }
  refEntry.target = targetProperties;
  return targetProperties;
};
currentExtensions[28].handlesRead = true;
currentExtensions[29] = (id2) => {
  let refEntry = referenceMap.get(id2);
  refEntry.used = true;
  return refEntry.target;
};
currentExtensions[258] = (array) => new Set(array);
(currentExtensions[259] = (read2) => {
  if (currentDecoder.mapsAsObjects) {
    currentDecoder.mapsAsObjects = false;
    restoreMapsAsObject = true;
  }
  return read2();
}).handlesRead = true;
function combine(a, b) {
  if (typeof a === "string")
    return a + b;
  if (a instanceof Array)
    return a.concat(b);
  return Object.assign({}, a, b);
}
function getPackedValues() {
  if (!packedValues) {
    if (currentDecoder.getShared)
      loadShared();
    else
      throw new Error("No packed values available");
  }
  return packedValues;
}
const SHARED_DATA_TAG_ID = 1399353956;
currentExtensionRanges.push((tag, input) => {
  if (tag >= 225 && tag <= 255)
    return combine(getPackedValues().prefixes[tag - 224], input);
  if (tag >= 28704 && tag <= 32767)
    return combine(getPackedValues().prefixes[tag - 28672], input);
  if (tag >= 1879052288 && tag <= 2147483647)
    return combine(getPackedValues().prefixes[tag - 1879048192], input);
  if (tag >= 216 && tag <= 223)
    return combine(input, getPackedValues().suffixes[tag - 216]);
  if (tag >= 27647 && tag <= 28671)
    return combine(input, getPackedValues().suffixes[tag - 27639]);
  if (tag >= 1811940352 && tag <= 1879048191)
    return combine(input, getPackedValues().suffixes[tag - 1811939328]);
  if (tag == SHARED_DATA_TAG_ID) {
    return {
      packedValues,
      structures: currentStructures.slice(0),
      version: input
    };
  }
  if (tag == 55799)
    return input;
});
const isLittleEndianMachine$1 = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
const typedArrays = [
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? { name: "BigUint64Array" } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? { name: "BigInt64Array" } : BigInt64Array,
  Float32Array,
  Float64Array
];
const typedArrayTags = [64, 68, 69, 70, 71, 72, 77, 78, 79, 85, 86];
for (let i = 0; i < typedArrays.length; i++) {
  registerTypedArray(typedArrays[i], typedArrayTags[i]);
}
function registerTypedArray(TypedArray, tag) {
  let dvMethod = "get" + TypedArray.name.slice(0, -5);
  let bytesPerElement;
  if (typeof TypedArray === "function")
    bytesPerElement = TypedArray.BYTES_PER_ELEMENT;
  else
    TypedArray = null;
  for (let littleEndian = 0; littleEndian < 2; littleEndian++) {
    if (!littleEndian && bytesPerElement == 1)
      continue;
    let sizeShift = bytesPerElement == 2 ? 1 : bytesPerElement == 4 ? 2 : bytesPerElement == 8 ? 3 : 0;
    currentExtensions[littleEndian ? tag : tag - 4] = bytesPerElement == 1 || littleEndian == isLittleEndianMachine$1 ? (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      if (!currentDecoder.copyBuffers) {
        if (bytesPerElement === 1 || bytesPerElement === 2 && !(buffer.byteOffset & 1) || bytesPerElement === 4 && !(buffer.byteOffset & 3) || bytesPerElement === 8 && !(buffer.byteOffset & 7))
          return new TypedArray(buffer.buffer, buffer.byteOffset, buffer.byteLength >> sizeShift);
      }
      return new TypedArray(Uint8Array.prototype.slice.call(buffer, 0).buffer);
    } : (buffer) => {
      if (!TypedArray)
        throw new Error("Could not find typed array for code " + tag);
      let dv = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
      let elements = buffer.length >> sizeShift;
      let ta = new TypedArray(elements);
      let method = dv[dvMethod];
      for (let i = 0; i < elements; i++) {
        ta[i] = method.call(dv, i << sizeShift, littleEndian);
      }
      return ta;
    };
  }
}
function readBundleExt() {
  let length = readJustLength();
  let bundlePosition = position$1 + read();
  for (let i = 2; i < length; i++) {
    let bundleLength = readJustLength();
    position$1 += bundleLength;
  }
  let dataPosition = position$1;
  position$1 = bundlePosition;
  bundledStrings$1 = [readStringJS(readJustLength()), readStringJS(readJustLength())];
  bundledStrings$1.position0 = 0;
  bundledStrings$1.position1 = 0;
  bundledStrings$1.postBundlePosition = position$1;
  position$1 = dataPosition;
  return read();
}
function readJustLength() {
  let token = src[position$1++] & 31;
  if (token > 23) {
    switch (token) {
      case 24:
        token = src[position$1++];
        break;
      case 25:
        token = dataView.getUint16(position$1);
        position$1 += 2;
        break;
      case 26:
        token = dataView.getUint32(position$1);
        position$1 += 4;
        break;
    }
  }
  return token;
}
function loadShared() {
  if (currentDecoder.getShared) {
    let sharedData = saveState(() => {
      src = null;
      return currentDecoder.getShared();
    }) || {};
    let updatedStructures = sharedData.structures || [];
    currentDecoder.sharedVersion = sharedData.version;
    packedValues = currentDecoder.sharedValues = sharedData.packedValues;
    if (currentStructures === true)
      currentDecoder.structures = currentStructures = updatedStructures;
    else
      currentStructures.splice.apply(currentStructures, [0, updatedStructures.length].concat(updatedStructures));
  }
}
function saveState(callback) {
  let savedSrcEnd = srcEnd;
  let savedPosition = position$1;
  let savedSrcStringStart = srcStringStart;
  let savedSrcStringEnd = srcStringEnd;
  let savedSrcString = srcString;
  let savedReferenceMap = referenceMap;
  let savedBundledStrings = bundledStrings$1;
  let savedSrc = new Uint8Array(src.slice(0, srcEnd));
  let savedStructures = currentStructures;
  let savedDecoder = currentDecoder;
  let savedSequentialMode = sequentialMode;
  let value = callback();
  srcEnd = savedSrcEnd;
  position$1 = savedPosition;
  srcStringStart = savedSrcStringStart;
  srcStringEnd = savedSrcStringEnd;
  srcString = savedSrcString;
  referenceMap = savedReferenceMap;
  bundledStrings$1 = savedBundledStrings;
  src = savedSrc;
  sequentialMode = savedSequentialMode;
  currentStructures = savedStructures;
  currentDecoder = savedDecoder;
  dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
  return value;
}
function clearSource() {
  src = null;
  referenceMap = null;
  currentStructures = null;
}
const mult10 = new Array(147);
for (let i = 0; i < 256; i++) {
  mult10[i] = +("1e" + Math.floor(45.15 - i * 0.30103));
}
let defaultDecoder = new Decoder({ useRecords: false });
defaultDecoder.decode;
defaultDecoder.decodeMultiple;
let textEncoder;
try {
  textEncoder = new TextEncoder();
} catch (error) {
}
let extensions, extensionClasses;
const Buffer$1 = typeof globalThis === "object" && globalThis.Buffer;
const hasNodeBuffer = typeof Buffer$1 !== "undefined";
const ByteArrayAllocate = hasNodeBuffer ? Buffer$1.allocUnsafeSlow : Uint8Array;
const ByteArray = hasNodeBuffer ? Buffer$1 : Uint8Array;
const MAX_STRUCTURES = 256;
const MAX_BUFFER_SIZE = hasNodeBuffer ? 4294967296 : 2144337920;
let throwOnIterable;
let target;
let targetView;
let position = 0;
let safeEnd;
let bundledStrings = null;
const MAX_BUNDLE_SIZE = 61440;
const hasNonLatin = /[\u0080-\uFFFF]/;
const RECORD_SYMBOL = Symbol("record-id");
class Encoder extends Decoder {
  constructor(options) {
    super(options);
    this.offset = 0;
    let start;
    let sharedStructures;
    let hasSharedUpdate;
    let structures;
    let referenceMap2;
    options = options || {};
    let encodeUtf8 = ByteArray.prototype.utf8Write ? function(string2, position2, maxBytes) {
      return target.utf8Write(string2, position2, maxBytes);
    } : textEncoder && textEncoder.encodeInto ? function(string2, position2) {
      return textEncoder.encodeInto(string2, target.subarray(position2)).written;
    } : false;
    let encoder = this;
    let hasSharedStructures = options.structures || options.saveStructures;
    let maxSharedStructures = options.maxSharedStructures;
    if (maxSharedStructures == null)
      maxSharedStructures = hasSharedStructures ? 128 : 0;
    if (maxSharedStructures > 8190)
      throw new Error("Maximum maxSharedStructure is 8190");
    let isSequential = options.sequential;
    if (isSequential) {
      maxSharedStructures = 0;
    }
    if (!this.structures)
      this.structures = [];
    if (this.saveStructures)
      this.saveShared = this.saveStructures;
    let samplingPackedValues, packedObjectMap2, sharedValues = options.sharedValues;
    let sharedPackedObjectMap2;
    if (sharedValues) {
      sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      for (let i = 0, l = sharedValues.length; i < l; i++) {
        sharedPackedObjectMap2[sharedValues[i]] = i;
      }
    }
    let recordIdsToRemove = [];
    let transitionsCount = 0;
    let serializationsSinceTransitionRebuild = 0;
    this.mapEncode = function(value, encodeOptions) {
      if (this._keyMap && !this._mapped) {
        switch (value.constructor.name) {
          case "Array":
            value = value.map((r) => this.encodeKeys(r));
            break;
        }
      }
      return this.encode(value, encodeOptions);
    };
    this.encode = function(value, encodeOptions) {
      if (!target) {
        target = new ByteArrayAllocate(8192);
        targetView = new DataView(target.buffer, 0, 8192);
        position = 0;
      }
      safeEnd = target.length - 10;
      if (safeEnd - position < 2048) {
        target = new ByteArrayAllocate(target.length);
        targetView = new DataView(target.buffer, 0, target.length);
        safeEnd = target.length - 10;
        position = 0;
      } else if (encodeOptions === REUSE_BUFFER_MODE)
        position = position + 7 & 2147483640;
      start = position;
      if (encoder.useSelfDescribedHeader) {
        targetView.setUint32(position, 3654940416);
        position += 3;
      }
      referenceMap2 = encoder.structuredClone ? /* @__PURE__ */ new Map() : null;
      if (encoder.bundleStrings && typeof value !== "string") {
        bundledStrings = [];
        bundledStrings.size = Infinity;
      } else
        bundledStrings = null;
      sharedStructures = encoder.structures;
      if (sharedStructures) {
        if (sharedStructures.uninitialized) {
          let sharedData = encoder.getShared() || {};
          encoder.structures = sharedStructures = sharedData.structures || [];
          encoder.sharedVersion = sharedData.version;
          let sharedValues2 = encoder.sharedValues = sharedData.packedValues;
          if (sharedValues2) {
            sharedPackedObjectMap2 = {};
            for (let i = 0, l = sharedValues2.length; i < l; i++)
              sharedPackedObjectMap2[sharedValues2[i]] = i;
          }
        }
        let sharedStructuresLength = sharedStructures.length;
        if (sharedStructuresLength > maxSharedStructures && !isSequential)
          sharedStructuresLength = maxSharedStructures;
        if (!sharedStructures.transitions) {
          sharedStructures.transitions = /* @__PURE__ */ Object.create(null);
          for (let i = 0; i < sharedStructuresLength; i++) {
            let keys = sharedStructures[i];
            if (!keys)
              continue;
            let nextTransition, transition = sharedStructures.transitions;
            for (let j = 0, l = keys.length; j < l; j++) {
              if (transition[RECORD_SYMBOL] === void 0)
                transition[RECORD_SYMBOL] = i;
              let key = keys[j];
              nextTransition = transition[key];
              if (!nextTransition) {
                nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
              }
              transition = nextTransition;
            }
            transition[RECORD_SYMBOL] = i | 1048576;
          }
        }
        if (!isSequential)
          sharedStructures.nextId = sharedStructuresLength;
      }
      if (hasSharedUpdate)
        hasSharedUpdate = false;
      structures = sharedStructures || [];
      packedObjectMap2 = sharedPackedObjectMap2;
      if (options.pack) {
        let packedValues2 = /* @__PURE__ */ new Map();
        packedValues2.values = [];
        packedValues2.encoder = encoder;
        packedValues2.maxValues = options.maxPrivatePackedValues || (sharedPackedObjectMap2 ? 16 : Infinity);
        packedValues2.objectMap = sharedPackedObjectMap2 || false;
        packedValues2.samplingPackedValues = samplingPackedValues;
        findRepetitiveStrings(value, packedValues2);
        if (packedValues2.values.length > 0) {
          target[position++] = 216;
          target[position++] = 51;
          writeArrayHeader(4);
          let valuesArray = packedValues2.values;
          encode(valuesArray);
          writeArrayHeader(0);
          writeArrayHeader(0);
          packedObjectMap2 = Object.create(sharedPackedObjectMap2 || null);
          for (let i = 0, l = valuesArray.length; i < l; i++) {
            packedObjectMap2[valuesArray[i]] = i;
          }
        }
      }
      throwOnIterable = encodeOptions & THROW_ON_ITERABLE;
      try {
        if (throwOnIterable)
          return;
        encode(value);
        if (bundledStrings) {
          writeBundles(start, encode);
        }
        encoder.offset = position;
        if (referenceMap2 && referenceMap2.idsToInsert) {
          position += referenceMap2.idsToInsert.length * 2;
          if (position > safeEnd)
            makeRoom(position);
          encoder.offset = position;
          let serialized = insertIds(target.subarray(start, position), referenceMap2.idsToInsert);
          referenceMap2 = null;
          return serialized;
        }
        if (encodeOptions & REUSE_BUFFER_MODE) {
          target.start = start;
          target.end = position;
          return target;
        }
        return target.subarray(start, position);
      } finally {
        if (sharedStructures) {
          if (serializationsSinceTransitionRebuild < 10)
            serializationsSinceTransitionRebuild++;
          if (sharedStructures.length > maxSharedStructures)
            sharedStructures.length = maxSharedStructures;
          if (transitionsCount > 1e4) {
            sharedStructures.transitions = null;
            serializationsSinceTransitionRebuild = 0;
            transitionsCount = 0;
            if (recordIdsToRemove.length > 0)
              recordIdsToRemove = [];
          } else if (recordIdsToRemove.length > 0 && !isSequential) {
            for (let i = 0, l = recordIdsToRemove.length; i < l; i++) {
              recordIdsToRemove[i][RECORD_SYMBOL] = void 0;
            }
            recordIdsToRemove = [];
          }
        }
        if (hasSharedUpdate && encoder.saveShared) {
          if (encoder.structures.length > maxSharedStructures) {
            encoder.structures = encoder.structures.slice(0, maxSharedStructures);
          }
          let returnBuffer = target.subarray(start, position);
          if (encoder.updateSharedData() === false)
            return encoder.encode(value);
          return returnBuffer;
        }
        if (encodeOptions & RESET_BUFFER_MODE)
          position = start;
      }
    };
    this.findCommonStringsToPack = () => {
      samplingPackedValues = /* @__PURE__ */ new Map();
      if (!sharedPackedObjectMap2)
        sharedPackedObjectMap2 = /* @__PURE__ */ Object.create(null);
      return (options2) => {
        let threshold = options2 && options2.threshold || 4;
        let position2 = this.pack ? options2.maxPrivatePackedValues || 16 : 0;
        if (!sharedValues)
          sharedValues = this.sharedValues = [];
        for (let [key, status] of samplingPackedValues) {
          if (status.count > threshold) {
            sharedPackedObjectMap2[key] = position2++;
            sharedValues.push(key);
            hasSharedUpdate = true;
          }
        }
        while (this.saveShared && this.updateSharedData() === false) {
        }
        samplingPackedValues = null;
      };
    };
    const encode = (value) => {
      if (position > safeEnd)
        target = makeRoom(position);
      var type = typeof value;
      var length;
      if (type === "string") {
        if (packedObjectMap2) {
          let packedPosition = packedObjectMap2[value];
          if (packedPosition >= 0) {
            if (packedPosition < 16)
              target[position++] = packedPosition + 224;
            else {
              target[position++] = 198;
              if (packedPosition & 1)
                encode(15 - packedPosition >> 1);
              else
                encode(packedPosition - 16 >> 1);
            }
            return;
          } else if (samplingPackedValues && !options.pack) {
            let status = samplingPackedValues.get(value);
            if (status)
              status.count++;
            else
              samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
        let strLength = value.length;
        if (bundledStrings && strLength >= 4 && strLength < 1024) {
          if ((bundledStrings.size += strLength) > MAX_BUNDLE_SIZE) {
            let extStart;
            let maxBytes2 = (bundledStrings[0] ? bundledStrings[0].length * 3 + bundledStrings[1].length : 0) + 10;
            if (position + maxBytes2 > safeEnd)
              target = makeRoom(position + maxBytes2);
            target[position++] = 217;
            target[position++] = 223;
            target[position++] = 249;
            target[position++] = bundledStrings.position ? 132 : 130;
            target[position++] = 26;
            extStart = position - start;
            position += 4;
            if (bundledStrings.position) {
              writeBundles(start, encode);
            }
            bundledStrings = ["", ""];
            bundledStrings.size = 0;
            bundledStrings.position = extStart;
          }
          let twoByte = hasNonLatin.test(value);
          bundledStrings[twoByte ? 0 : 1] += value;
          target[position++] = twoByte ? 206 : 207;
          encode(strLength);
          return;
        }
        let headerSize;
        if (strLength < 32) {
          headerSize = 1;
        } else if (strLength < 256) {
          headerSize = 2;
        } else if (strLength < 65536) {
          headerSize = 3;
        } else {
          headerSize = 5;
        }
        let maxBytes = strLength * 3;
        if (position + maxBytes > safeEnd)
          target = makeRoom(position + maxBytes);
        if (strLength < 64 || !encodeUtf8) {
          let i, c1, c2, strPosition = position + headerSize;
          for (i = 0; i < strLength; i++) {
            c1 = value.charCodeAt(i);
            if (c1 < 128) {
              target[strPosition++] = c1;
            } else if (c1 < 2048) {
              target[strPosition++] = c1 >> 6 | 192;
              target[strPosition++] = c1 & 63 | 128;
            } else if ((c1 & 64512) === 55296 && ((c2 = value.charCodeAt(i + 1)) & 64512) === 56320) {
              c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
              i++;
              target[strPosition++] = c1 >> 18 | 240;
              target[strPosition++] = c1 >> 12 & 63 | 128;
              target[strPosition++] = c1 >> 6 & 63 | 128;
              target[strPosition++] = c1 & 63 | 128;
            } else {
              target[strPosition++] = c1 >> 12 | 224;
              target[strPosition++] = c1 >> 6 & 63 | 128;
              target[strPosition++] = c1 & 63 | 128;
            }
          }
          length = strPosition - position - headerSize;
        } else {
          length = encodeUtf8(value, position + headerSize, maxBytes);
        }
        if (length < 24) {
          target[position++] = 96 | length;
        } else if (length < 256) {
          if (headerSize < 2) {
            target.copyWithin(position + 2, position + 1, position + 1 + length);
          }
          target[position++] = 120;
          target[position++] = length;
        } else if (length < 65536) {
          if (headerSize < 3) {
            target.copyWithin(position + 3, position + 2, position + 2 + length);
          }
          target[position++] = 121;
          target[position++] = length >> 8;
          target[position++] = length & 255;
        } else {
          if (headerSize < 5) {
            target.copyWithin(position + 5, position + 3, position + 3 + length);
          }
          target[position++] = 122;
          targetView.setUint32(position, length);
          position += 4;
        }
        position += length;
      } else if (type === "number") {
        if (!this.alwaysUseFloat && value >>> 0 === value) {
          if (value < 24) {
            target[position++] = value;
          } else if (value < 256) {
            target[position++] = 24;
            target[position++] = value;
          } else if (value < 65536) {
            target[position++] = 25;
            target[position++] = value >> 8;
            target[position++] = value & 255;
          } else {
            target[position++] = 26;
            targetView.setUint32(position, value);
            position += 4;
          }
        } else if (!this.alwaysUseFloat && value >> 0 === value) {
          if (value >= -24) {
            target[position++] = 31 - value;
          } else if (value >= -256) {
            target[position++] = 56;
            target[position++] = ~value;
          } else if (value >= -65536) {
            target[position++] = 57;
            targetView.setUint16(position, ~value);
            position += 2;
          } else {
            target[position++] = 58;
            targetView.setUint32(position, ~value);
            position += 4;
          }
        } else {
          let useFloat32;
          if ((useFloat32 = this.useFloat32) > 0 && value < 4294967296 && value >= -2147483648) {
            target[position++] = 250;
            targetView.setFloat32(position, value);
            let xShifted;
            if (useFloat32 < 4 || // this checks for rounding of numbers that were encoded in 32-bit float to nearest significant decimal digit that could be preserved
            (xShifted = value * mult10[(target[position] & 127) << 1 | target[position + 1] >> 7]) >> 0 === xShifted) {
              position += 4;
              return;
            } else
              position--;
          }
          target[position++] = 251;
          targetView.setFloat64(position, value);
          position += 8;
        }
      } else if (type === "object") {
        if (!value)
          target[position++] = 246;
        else {
          if (referenceMap2) {
            let referee = referenceMap2.get(value);
            if (referee) {
              target[position++] = 216;
              target[position++] = 29;
              target[position++] = 25;
              if (!referee.references) {
                let idsToInsert = referenceMap2.idsToInsert || (referenceMap2.idsToInsert = []);
                referee.references = [];
                idsToInsert.push(referee);
              }
              referee.references.push(position - start);
              position += 2;
              return;
            } else
              referenceMap2.set(value, { offset: position - start });
          }
          let constructor = value.constructor;
          if (constructor === Object) {
            writeObject(value);
          } else if (constructor === Array) {
            length = value.length;
            if (length < 24) {
              target[position++] = 128 | length;
            } else {
              writeArrayHeader(length);
            }
            for (let i = 0; i < length; i++) {
              encode(value[i]);
            }
          } else if (constructor === Map) {
            if (this.mapsAsObjects ? this.useTag259ForMaps !== false : this.useTag259ForMaps) {
              target[position++] = 217;
              target[position++] = 1;
              target[position++] = 3;
            }
            length = value.size;
            if (length < 24) {
              target[position++] = 160 | length;
            } else if (length < 256) {
              target[position++] = 184;
              target[position++] = length;
            } else if (length < 65536) {
              target[position++] = 185;
              target[position++] = length >> 8;
              target[position++] = length & 255;
            } else {
              target[position++] = 186;
              targetView.setUint32(position, length);
              position += 4;
            }
            if (encoder.keyMap) {
              for (let [key, entryValue] of value) {
                encode(encoder.encodeKey(key));
                encode(entryValue);
              }
            } else {
              for (let [key, entryValue] of value) {
                encode(key);
                encode(entryValue);
              }
            }
          } else {
            for (let i = 0, l = extensions.length; i < l; i++) {
              let extensionClass = extensionClasses[i];
              if (value instanceof extensionClass) {
                let extension = extensions[i];
                let tag = extension.tag;
                if (tag == void 0)
                  tag = extension.getTag && extension.getTag.call(this, value);
                if (tag < 24) {
                  target[position++] = 192 | tag;
                } else if (tag < 256) {
                  target[position++] = 216;
                  target[position++] = tag;
                } else if (tag < 65536) {
                  target[position++] = 217;
                  target[position++] = tag >> 8;
                  target[position++] = tag & 255;
                } else if (tag > -1) {
                  target[position++] = 218;
                  targetView.setUint32(position, tag);
                  position += 4;
                }
                extension.encode.call(this, value, encode, makeRoom);
                return;
              }
            }
            if (value[Symbol.iterator]) {
              if (throwOnIterable) {
                let error = new Error("Iterable should be serialized as iterator");
                error.iteratorNotHandled = true;
                throw error;
              }
              target[position++] = 159;
              for (let entry of value) {
                encode(entry);
              }
              target[position++] = 255;
              return;
            }
            if (value[Symbol.asyncIterator] || isBlob(value)) {
              let error = new Error("Iterable/blob should be serialized as iterator");
              error.iteratorNotHandled = true;
              throw error;
            }
            if (this.useToJSON && value.toJSON) {
              const json = value.toJSON();
              if (json !== value)
                return encode(json);
            }
            writeObject(value);
          }
        }
      } else if (type === "boolean") {
        target[position++] = value ? 245 : 244;
      } else if (type === "bigint") {
        if (value < BigInt(1) << BigInt(64) && value >= 0) {
          target[position++] = 27;
          targetView.setBigUint64(position, value);
        } else if (value > -(BigInt(1) << BigInt(64)) && value < 0) {
          target[position++] = 59;
          targetView.setBigUint64(position, -value - BigInt(1));
        } else {
          if (this.largeBigIntToFloat) {
            target[position++] = 251;
            targetView.setFloat64(position, Number(value));
          } else {
            if (value >= BigInt(0))
              target[position++] = 194;
            else {
              target[position++] = 195;
              value = BigInt(-1) - value;
            }
            let bytes = [];
            while (value) {
              bytes.push(Number(value & BigInt(255)));
              value >>= BigInt(8);
            }
            writeBuffer(new Uint8Array(bytes.reverse()), makeRoom);
            return;
          }
        }
        position += 8;
      } else if (type === "undefined") {
        target[position++] = 247;
      } else {
        throw new Error("Unknown type: " + type);
      }
    };
    const writeObject = this.useRecords === false ? this.variableMapSize ? (object) => {
      let keys = Object.keys(object);
      let vals = Object.values(object);
      let length = keys.length;
      if (length < 24) {
        target[position++] = 160 | length;
      } else if (length < 256) {
        target[position++] = 184;
        target[position++] = length;
      } else if (length < 65536) {
        target[position++] = 185;
        target[position++] = length >> 8;
        target[position++] = length & 255;
      } else {
        target[position++] = 186;
        targetView.setUint32(position, length);
        position += 4;
      }
      if (encoder.keyMap) {
        for (let i = 0; i < length; i++) {
          encode(encoder.encodeKey(keys[i]));
          encode(vals[i]);
        }
      } else {
        for (let i = 0; i < length; i++) {
          encode(keys[i]);
          encode(vals[i]);
        }
      }
    } : (object) => {
      target[position++] = 185;
      let objectOffset = position - start;
      position += 2;
      let size = 0;
      if (encoder.keyMap) {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          encode(encoder.encodeKey(key));
          encode(object[key]);
          size++;
        }
      } else {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          encode(key);
          encode(object[key]);
          size++;
        }
      }
      target[objectOffset++ + start] = size >> 8;
      target[objectOffset + start] = size & 255;
    } : (object, skipValues) => {
      let nextTransition, transition = structures.transitions || (structures.transitions = /* @__PURE__ */ Object.create(null));
      let newTransitions = 0;
      let length = 0;
      let parentRecordId;
      let keys;
      if (this.keyMap) {
        keys = Object.keys(object).map((k) => this.encodeKey(k));
        length = keys.length;
        for (let i = 0; i < length; i++) {
          let key = keys[i];
          nextTransition = transition[key];
          if (!nextTransition) {
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
        }
      } else {
        for (let key in object) if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key)) {
          nextTransition = transition[key];
          if (!nextTransition) {
            if (transition[RECORD_SYMBOL] & 1048576) {
              parentRecordId = transition[RECORD_SYMBOL] & 65535;
            }
            nextTransition = transition[key] = /* @__PURE__ */ Object.create(null);
            newTransitions++;
          }
          transition = nextTransition;
          length++;
        }
      }
      let recordId = transition[RECORD_SYMBOL];
      if (recordId !== void 0) {
        recordId &= 65535;
        target[position++] = 217;
        target[position++] = recordId >> 8 | 224;
        target[position++] = recordId & 255;
      } else {
        if (!keys)
          keys = transition.__keys__ || (transition.__keys__ = Object.keys(object));
        if (parentRecordId === void 0) {
          recordId = structures.nextId++;
          if (!recordId) {
            recordId = 0;
            structures.nextId = 1;
          }
          if (recordId >= MAX_STRUCTURES) {
            structures.nextId = (recordId = maxSharedStructures) + 1;
          }
        } else {
          recordId = parentRecordId;
        }
        structures[recordId] = keys;
        if (recordId < maxSharedStructures) {
          target[position++] = 217;
          target[position++] = recordId >> 8 | 224;
          target[position++] = recordId & 255;
          transition = structures.transitions;
          for (let i = 0; i < length; i++) {
            if (transition[RECORD_SYMBOL] === void 0 || transition[RECORD_SYMBOL] & 1048576)
              transition[RECORD_SYMBOL] = recordId;
            transition = transition[keys[i]];
          }
          transition[RECORD_SYMBOL] = recordId | 1048576;
          hasSharedUpdate = true;
        } else {
          transition[RECORD_SYMBOL] = recordId;
          targetView.setUint32(position, 3655335680);
          position += 3;
          if (newTransitions)
            transitionsCount += serializationsSinceTransitionRebuild * newTransitions;
          if (recordIdsToRemove.length >= MAX_STRUCTURES - maxSharedStructures)
            recordIdsToRemove.shift()[RECORD_SYMBOL] = void 0;
          recordIdsToRemove.push(transition);
          writeArrayHeader(length + 2);
          encode(57344 + recordId);
          encode(keys);
          if (skipValues) return;
          for (let key in object)
            if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
              encode(object[key]);
          return;
        }
      }
      if (length < 24) {
        target[position++] = 128 | length;
      } else {
        writeArrayHeader(length);
      }
      if (skipValues) return;
      for (let key in object)
        if (typeof object.hasOwnProperty !== "function" || object.hasOwnProperty(key))
          encode(object[key]);
    };
    const makeRoom = (end) => {
      let newSize;
      if (end > 16777216) {
        if (end - start > MAX_BUFFER_SIZE)
          throw new Error("Encoded buffer would be larger than maximum buffer size");
        newSize = Math.min(
          MAX_BUFFER_SIZE,
          Math.round(Math.max((end - start) * (end > 67108864 ? 1.25 : 2), 4194304) / 4096) * 4096
        );
      } else
        newSize = (Math.max(end - start << 2, target.length - 1) >> 12) + 1 << 12;
      let newBuffer = new ByteArrayAllocate(newSize);
      targetView = new DataView(newBuffer.buffer, 0, newSize);
      if (target.copy)
        target.copy(newBuffer, 0, start, end);
      else
        newBuffer.set(target.slice(start, end));
      position -= start;
      start = 0;
      safeEnd = newBuffer.length - 10;
      return target = newBuffer;
    };
    let chunkThreshold = 100;
    let continuedChunkThreshold = 1e3;
    this.encodeAsIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsIterable);
    };
    this.encodeAsAsyncIterable = function(value, options2) {
      return startEncoding(value, options2, encodeObjectAsAsyncIterable);
    };
    function* encodeObjectAsIterable(object, iterateProperties, finalIterable) {
      let constructor = object.constructor;
      if (constructor === Object) {
        let useRecords = encoder.useRecords !== false;
        if (useRecords)
          writeObject(object, true);
        else
          writeEntityLength(Object.keys(object).length, 160);
        for (let key in object) {
          let value = object[key];
          if (!useRecords) encode(key);
          if (value && typeof value === "object") {
            if (iterateProperties[key])
              yield* encodeObjectAsIterable(value, iterateProperties[key]);
            else
              yield* tryEncode(value, iterateProperties, key);
          } else encode(value);
        }
      } else if (constructor === Array) {
        let length = object.length;
        writeArrayHeader(length);
        for (let i = 0; i < length; i++) {
          let value = object[i];
          if (value && (typeof value === "object" || position - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else encode(value);
        }
      } else if (object[Symbol.iterator] && !object.buffer) {
        target[position++] = 159;
        for (let value of object) {
          if (value && (typeof value === "object" || position - start > chunkThreshold)) {
            if (iterateProperties.element)
              yield* encodeObjectAsIterable(value, iterateProperties.element);
            else
              yield* tryEncode(value, iterateProperties, "element");
          } else encode(value);
        }
        target[position++] = 255;
      } else if (isBlob(object)) {
        writeEntityLength(object.size, 64);
        yield target.subarray(start, position);
        yield object;
        restartEncoding();
      } else if (object[Symbol.asyncIterator]) {
        target[position++] = 159;
        yield target.subarray(start, position);
        yield object;
        restartEncoding();
        target[position++] = 255;
      } else {
        encode(object);
      }
      if (finalIterable && position > start) yield target.subarray(start, position);
      else if (position - start > chunkThreshold) {
        yield target.subarray(start, position);
        restartEncoding();
      }
    }
    function* tryEncode(value, iterateProperties, key) {
      let restart = position - start;
      try {
        encode(value);
        if (position - start > chunkThreshold) {
          yield target.subarray(start, position);
          restartEncoding();
        }
      } catch (error) {
        if (error.iteratorNotHandled) {
          iterateProperties[key] = {};
          position = start + restart;
          yield* encodeObjectAsIterable.call(this, value, iterateProperties[key]);
        } else throw error;
      }
    }
    function restartEncoding() {
      chunkThreshold = continuedChunkThreshold;
      encoder.encode(null, THROW_ON_ITERABLE);
    }
    function startEncoding(value, options2, encodeIterable) {
      if (options2 && options2.chunkThreshold)
        chunkThreshold = continuedChunkThreshold = options2.chunkThreshold;
      else
        chunkThreshold = 100;
      if (value && typeof value === "object") {
        encoder.encode(null, THROW_ON_ITERABLE);
        return encodeIterable(value, encoder.iterateProperties || (encoder.iterateProperties = {}), true);
      }
      return [encoder.encode(value)];
    }
    async function* encodeObjectAsAsyncIterable(value, iterateProperties) {
      for (let encodedValue of encodeObjectAsIterable(value, iterateProperties, true)) {
        let constructor = encodedValue.constructor;
        if (constructor === ByteArray || constructor === Uint8Array)
          yield encodedValue;
        else if (isBlob(encodedValue)) {
          let reader = encodedValue.stream().getReader();
          let next;
          while (!(next = await reader.read()).done) {
            yield next.value;
          }
        } else if (encodedValue[Symbol.asyncIterator]) {
          for await (let asyncValue of encodedValue) {
            restartEncoding();
            if (asyncValue)
              yield* encodeObjectAsAsyncIterable(asyncValue, iterateProperties.async || (iterateProperties.async = {}));
            else yield encoder.encode(asyncValue);
          }
        } else {
          yield encodedValue;
        }
      }
    }
  }
  useBuffer(buffer) {
    target = buffer;
    targetView = new DataView(target.buffer, target.byteOffset, target.byteLength);
    position = 0;
  }
  clearSharedData() {
    if (this.structures)
      this.structures = [];
    if (this.sharedValues)
      this.sharedValues = void 0;
  }
  updateSharedData() {
    let lastVersion = this.sharedVersion || 0;
    this.sharedVersion = lastVersion + 1;
    let structuresCopy = this.structures.slice(0);
    let sharedData = new SharedData(structuresCopy, this.sharedValues, this.sharedVersion);
    let saveResults = this.saveShared(
      sharedData,
      (existingShared) => (existingShared && existingShared.version || 0) == lastVersion
    );
    if (saveResults === false) {
      sharedData = this.getShared() || {};
      this.structures = sharedData.structures || [];
      this.sharedValues = sharedData.packedValues;
      this.sharedVersion = sharedData.version;
      this.structures.nextId = this.structures.length;
    } else {
      structuresCopy.forEach((structure, i) => this.structures[i] = structure);
    }
    return saveResults;
  }
}
function writeEntityLength(length, majorValue) {
  if (length < 24)
    target[position++] = majorValue | length;
  else if (length < 256) {
    target[position++] = majorValue | 24;
    target[position++] = length;
  } else if (length < 65536) {
    target[position++] = majorValue | 25;
    target[position++] = length >> 8;
    target[position++] = length & 255;
  } else {
    target[position++] = majorValue | 26;
    targetView.setUint32(position, length);
    position += 4;
  }
}
class SharedData {
  constructor(structures, values, version) {
    this.structures = structures;
    this.packedValues = values;
    this.version = version;
  }
}
function writeArrayHeader(length) {
  if (length < 24)
    target[position++] = 128 | length;
  else if (length < 256) {
    target[position++] = 152;
    target[position++] = length;
  } else if (length < 65536) {
    target[position++] = 153;
    target[position++] = length >> 8;
    target[position++] = length & 255;
  } else {
    target[position++] = 154;
    targetView.setUint32(position, length);
    position += 4;
  }
}
const BlobConstructor = typeof Blob === "undefined" ? function() {
} : Blob;
function isBlob(object) {
  if (object instanceof BlobConstructor)
    return true;
  let tag = object[Symbol.toStringTag];
  return tag === "Blob" || tag === "File";
}
function findRepetitiveStrings(value, packedValues2) {
  switch (typeof value) {
    case "string":
      if (value.length > 3) {
        if (packedValues2.objectMap[value] > -1 || packedValues2.values.length >= packedValues2.maxValues)
          return;
        let packedStatus = packedValues2.get(value);
        if (packedStatus) {
          if (++packedStatus.count == 2) {
            packedValues2.values.push(value);
          }
        } else {
          packedValues2.set(value, {
            count: 1
          });
          if (packedValues2.samplingPackedValues) {
            let status = packedValues2.samplingPackedValues.get(value);
            if (status)
              status.count++;
            else
              packedValues2.samplingPackedValues.set(value, {
                count: 1
              });
          }
        }
      }
      break;
    case "object":
      if (value) {
        if (value instanceof Array) {
          for (let i = 0, l = value.length; i < l; i++) {
            findRepetitiveStrings(value[i], packedValues2);
          }
        } else {
          let includeKeys = !packedValues2.encoder.useRecords;
          for (var key in value) {
            if (value.hasOwnProperty(key)) {
              if (includeKeys)
                findRepetitiveStrings(key, packedValues2);
              findRepetitiveStrings(value[key], packedValues2);
            }
          }
        }
      }
      break;
    case "function":
      console.log(value);
  }
}
const isLittleEndianMachine = new Uint8Array(new Uint16Array([1]).buffer)[0] == 1;
extensionClasses = [
  Date,
  Set,
  Error,
  RegExp,
  Tag$1,
  ArrayBuffer,
  Uint8Array,
  Uint8ClampedArray,
  Uint16Array,
  Uint32Array,
  typeof BigUint64Array == "undefined" ? function() {
  } : BigUint64Array,
  Int8Array,
  Int16Array,
  Int32Array,
  typeof BigInt64Array == "undefined" ? function() {
  } : BigInt64Array,
  Float32Array,
  Float64Array,
  SharedData
];
extensions = [
  {
    // Date
    tag: 1,
    encode(date, encode) {
      let seconds = date.getTime() / 1e3;
      if ((this.useTimestamp32 || date.getMilliseconds() === 0) && seconds >= 0 && seconds < 4294967296) {
        target[position++] = 26;
        targetView.setUint32(position, seconds);
        position += 4;
      } else {
        target[position++] = 251;
        targetView.setFloat64(position, seconds);
        position += 8;
      }
    }
  },
  {
    // Set
    tag: 258,
    // https://github.com/input-output-hk/cbor-sets-spec/blob/master/CBOR_SETS.md
    encode(set, encode) {
      let array = Array.from(set);
      encode(array);
    }
  },
  {
    // Error
    tag: 27,
    // http://cbor.schmorp.de/generic-object
    encode(error, encode) {
      encode([error.name, error.message]);
    }
  },
  {
    // RegExp
    tag: 27,
    // http://cbor.schmorp.de/generic-object
    encode(regex, encode) {
      encode(["RegExp", regex.source, regex.flags]);
    }
  },
  {
    // Tag
    getTag(tag) {
      return tag.tag;
    },
    encode(tag, encode) {
      encode(tag.value);
    }
  },
  {
    // ArrayBuffer
    encode(arrayBuffer, encode, makeRoom) {
      writeBuffer(arrayBuffer, makeRoom);
    }
  },
  {
    // Uint8Array
    getTag(typedArray) {
      if (typedArray.constructor === Uint8Array) {
        if (this.tagUint8Array || hasNodeBuffer && this.tagUint8Array !== false)
          return 64;
      }
    },
    encode(typedArray, encode, makeRoom) {
      writeBuffer(typedArray, makeRoom);
    }
  },
  typedArrayEncoder(68, 1),
  typedArrayEncoder(69, 2),
  typedArrayEncoder(70, 4),
  typedArrayEncoder(71, 8),
  typedArrayEncoder(72, 1),
  typedArrayEncoder(77, 2),
  typedArrayEncoder(78, 4),
  typedArrayEncoder(79, 8),
  typedArrayEncoder(85, 4),
  typedArrayEncoder(86, 8),
  {
    encode(sharedData, encode) {
      let packedValues2 = sharedData.packedValues || [];
      let sharedStructures = sharedData.structures || [];
      if (packedValues2.values.length > 0) {
        target[position++] = 216;
        target[position++] = 51;
        writeArrayHeader(4);
        let valuesArray = packedValues2.values;
        encode(valuesArray);
        writeArrayHeader(0);
        writeArrayHeader(0);
        packedObjectMap = Object.create(sharedPackedObjectMap || null);
        for (let i = 0, l = valuesArray.length; i < l; i++) {
          packedObjectMap[valuesArray[i]] = i;
        }
      }
      if (sharedStructures) {
        targetView.setUint32(position, 3655335424);
        position += 3;
        let definitions = sharedStructures.slice(0);
        definitions.unshift(57344);
        definitions.push(new Tag$1(sharedData.version, 1399353956));
        encode(definitions);
      } else
        encode(new Tag$1(sharedData.version, 1399353956));
    }
  }
];
function typedArrayEncoder(tag, size) {
  if (!isLittleEndianMachine && size > 1)
    tag -= 4;
  return {
    tag,
    encode: function writeExtBuffer(typedArray, encode) {
      let length = typedArray.byteLength;
      let offset = typedArray.byteOffset || 0;
      let buffer = typedArray.buffer || typedArray;
      encode(hasNodeBuffer ? Buffer$1.from(buffer, offset, length) : new Uint8Array(buffer, offset, length));
    }
  };
}
function writeBuffer(buffer, makeRoom) {
  let length = buffer.byteLength;
  if (length < 24) {
    target[position++] = 64 + length;
  } else if (length < 256) {
    target[position++] = 88;
    target[position++] = length;
  } else if (length < 65536) {
    target[position++] = 89;
    target[position++] = length >> 8;
    target[position++] = length & 255;
  } else {
    target[position++] = 90;
    targetView.setUint32(position, length);
    position += 4;
  }
  if (position + length >= target.length) {
    makeRoom(position + length);
  }
  target.set(buffer.buffer ? buffer : new Uint8Array(buffer), position);
  position += length;
}
function insertIds(serialized, idsToInsert) {
  let nextId;
  let distanceToMove = idsToInsert.length * 2;
  let lastEnd = serialized.length - distanceToMove;
  idsToInsert.sort((a, b) => a.offset > b.offset ? 1 : -1);
  for (let id2 = 0; id2 < idsToInsert.length; id2++) {
    let referee = idsToInsert[id2];
    referee.id = id2;
    for (let position2 of referee.references) {
      serialized[position2++] = id2 >> 8;
      serialized[position2] = id2 & 255;
    }
  }
  while (nextId = idsToInsert.pop()) {
    let offset = nextId.offset;
    serialized.copyWithin(offset + distanceToMove, offset, lastEnd);
    distanceToMove -= 2;
    let position2 = offset + distanceToMove;
    serialized[position2++] = 216;
    serialized[position2++] = 28;
    lastEnd = offset;
  }
  return serialized;
}
function writeBundles(start, encode) {
  targetView.setUint32(bundledStrings.position + start, position - bundledStrings.position - start + 1);
  let writeStrings = bundledStrings;
  bundledStrings = null;
  encode(writeStrings[0]);
  encode(writeStrings[1]);
}
let defaultEncoder = new Encoder({ useRecords: false });
defaultEncoder.encode;
defaultEncoder.encodeAsIterable;
defaultEncoder.encodeAsAsyncIterable;
const REUSE_BUFFER_MODE = 512;
const RESET_BUFFER_MODE = 1024;
const THROW_ON_ITERABLE = 2048;
new FinalizationRegistry((cleanup) => cleanup());
var sha256$1 = { exports: {} };
var sha256 = sha256$1.exports;
var hasRequiredSha256;
function requireSha256() {
  if (hasRequiredSha256) return sha256$1.exports;
  hasRequiredSha256 = 1;
  (function(module) {
    (function(root, factory) {
      var exports$1 = {};
      factory(exports$1);
      var sha2562 = exports$1["default"];
      for (var k in exports$1) {
        sha2562[k] = exports$1[k];
      }
      {
        module.exports = sha2562;
      }
    })(sha256, function(exports$1) {
      exports$1.__esModule = true;
      exports$1.digestLength = 32;
      exports$1.blockSize = 64;
      var K = new Uint32Array([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      function hashBlocks(w, v, p, pos, len) {
        var a, b, c, d, e, f, g, h, u, i, j, t1, t2;
        while (len >= 64) {
          a = v[0];
          b = v[1];
          c = v[2];
          d = v[3];
          e = v[4];
          f = v[5];
          g = v[6];
          h = v[7];
          for (i = 0; i < 16; i++) {
            j = pos + i * 4;
            w[i] = (p[j] & 255) << 24 | (p[j + 1] & 255) << 16 | (p[j + 2] & 255) << 8 | p[j + 3] & 255;
          }
          for (i = 16; i < 64; i++) {
            u = w[i - 2];
            t1 = (u >>> 17 | u << 32 - 17) ^ (u >>> 19 | u << 32 - 19) ^ u >>> 10;
            u = w[i - 15];
            t2 = (u >>> 7 | u << 32 - 7) ^ (u >>> 18 | u << 32 - 18) ^ u >>> 3;
            w[i] = (t1 + w[i - 7] | 0) + (t2 + w[i - 16] | 0);
          }
          for (i = 0; i < 64; i++) {
            t1 = (((e >>> 6 | e << 32 - 6) ^ (e >>> 11 | e << 32 - 11) ^ (e >>> 25 | e << 32 - 25)) + (e & f ^ ~e & g) | 0) + (h + (K[i] + w[i] | 0) | 0) | 0;
            t2 = ((a >>> 2 | a << 32 - 2) ^ (a >>> 13 | a << 32 - 13) ^ (a >>> 22 | a << 32 - 22)) + (a & b ^ a & c ^ b & c) | 0;
            h = g;
            g = f;
            f = e;
            e = d + t1 | 0;
            d = c;
            c = b;
            b = a;
            a = t1 + t2 | 0;
          }
          v[0] += a;
          v[1] += b;
          v[2] += c;
          v[3] += d;
          v[4] += e;
          v[5] += f;
          v[6] += g;
          v[7] += h;
          pos += 64;
          len -= 64;
        }
        return pos;
      }
      var Hash = (
        /** @class */
        (function() {
          function Hash2() {
            this.digestLength = exports$1.digestLength;
            this.blockSize = exports$1.blockSize;
            this.state = new Int32Array(8);
            this.temp = new Int32Array(64);
            this.buffer = new Uint8Array(128);
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            this.reset();
          }
          Hash2.prototype.reset = function() {
            this.state[0] = 1779033703;
            this.state[1] = 3144134277;
            this.state[2] = 1013904242;
            this.state[3] = 2773480762;
            this.state[4] = 1359893119;
            this.state[5] = 2600822924;
            this.state[6] = 528734635;
            this.state[7] = 1541459225;
            this.bufferLength = 0;
            this.bytesHashed = 0;
            this.finished = false;
            return this;
          };
          Hash2.prototype.clean = function() {
            for (var i = 0; i < this.buffer.length; i++) {
              this.buffer[i] = 0;
            }
            for (var i = 0; i < this.temp.length; i++) {
              this.temp[i] = 0;
            }
            this.reset();
          };
          Hash2.prototype.update = function(data, dataLength) {
            if (dataLength === void 0) {
              dataLength = data.length;
            }
            if (this.finished) {
              throw new Error("SHA256: can't update because hash was finished.");
            }
            var dataPos = 0;
            this.bytesHashed += dataLength;
            if (this.bufferLength > 0) {
              while (this.bufferLength < 64 && dataLength > 0) {
                this.buffer[this.bufferLength++] = data[dataPos++];
                dataLength--;
              }
              if (this.bufferLength === 64) {
                hashBlocks(this.temp, this.state, this.buffer, 0, 64);
                this.bufferLength = 0;
              }
            }
            if (dataLength >= 64) {
              dataPos = hashBlocks(this.temp, this.state, data, dataPos, dataLength);
              dataLength %= 64;
            }
            while (dataLength > 0) {
              this.buffer[this.bufferLength++] = data[dataPos++];
              dataLength--;
            }
            return this;
          };
          Hash2.prototype.finish = function(out) {
            if (!this.finished) {
              var bytesHashed = this.bytesHashed;
              var left = this.bufferLength;
              var bitLenHi = bytesHashed / 536870912 | 0;
              var bitLenLo = bytesHashed << 3;
              var padLength = bytesHashed % 64 < 56 ? 64 : 128;
              this.buffer[left] = 128;
              for (var i = left + 1; i < padLength - 8; i++) {
                this.buffer[i] = 0;
              }
              this.buffer[padLength - 8] = bitLenHi >>> 24 & 255;
              this.buffer[padLength - 7] = bitLenHi >>> 16 & 255;
              this.buffer[padLength - 6] = bitLenHi >>> 8 & 255;
              this.buffer[padLength - 5] = bitLenHi >>> 0 & 255;
              this.buffer[padLength - 4] = bitLenLo >>> 24 & 255;
              this.buffer[padLength - 3] = bitLenLo >>> 16 & 255;
              this.buffer[padLength - 2] = bitLenLo >>> 8 & 255;
              this.buffer[padLength - 1] = bitLenLo >>> 0 & 255;
              hashBlocks(this.temp, this.state, this.buffer, 0, padLength);
              this.finished = true;
            }
            for (var i = 0; i < 8; i++) {
              out[i * 4 + 0] = this.state[i] >>> 24 & 255;
              out[i * 4 + 1] = this.state[i] >>> 16 & 255;
              out[i * 4 + 2] = this.state[i] >>> 8 & 255;
              out[i * 4 + 3] = this.state[i] >>> 0 & 255;
            }
            return this;
          };
          Hash2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          Hash2.prototype._saveState = function(out) {
            for (var i = 0; i < this.state.length; i++) {
              out[i] = this.state[i];
            }
          };
          Hash2.prototype._restoreState = function(from, bytesHashed) {
            for (var i = 0; i < this.state.length; i++) {
              this.state[i] = from[i];
            }
            this.bytesHashed = bytesHashed;
            this.finished = false;
            this.bufferLength = 0;
          };
          return Hash2;
        })()
      );
      exports$1.Hash = Hash;
      var HMAC = (
        /** @class */
        (function() {
          function HMAC2(key) {
            this.inner = new Hash();
            this.outer = new Hash();
            this.blockSize = this.inner.blockSize;
            this.digestLength = this.inner.digestLength;
            var pad = new Uint8Array(this.blockSize);
            if (key.length > this.blockSize) {
              new Hash().update(key).finish(pad).clean();
            } else {
              for (var i = 0; i < key.length; i++) {
                pad[i] = key[i];
              }
            }
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54;
            }
            this.inner.update(pad);
            for (var i = 0; i < pad.length; i++) {
              pad[i] ^= 54 ^ 92;
            }
            this.outer.update(pad);
            this.istate = new Uint32Array(8);
            this.ostate = new Uint32Array(8);
            this.inner._saveState(this.istate);
            this.outer._saveState(this.ostate);
            for (var i = 0; i < pad.length; i++) {
              pad[i] = 0;
            }
          }
          HMAC2.prototype.reset = function() {
            this.inner._restoreState(this.istate, this.inner.blockSize);
            this.outer._restoreState(this.ostate, this.outer.blockSize);
            return this;
          };
          HMAC2.prototype.clean = function() {
            for (var i = 0; i < this.istate.length; i++) {
              this.ostate[i] = this.istate[i] = 0;
            }
            this.inner.clean();
            this.outer.clean();
          };
          HMAC2.prototype.update = function(data) {
            this.inner.update(data);
            return this;
          };
          HMAC2.prototype.finish = function(out) {
            if (this.outer.finished) {
              this.outer.finish(out);
            } else {
              this.inner.finish(out);
              this.outer.update(out, this.digestLength).finish(out);
            }
            return this;
          };
          HMAC2.prototype.digest = function() {
            var out = new Uint8Array(this.digestLength);
            this.finish(out);
            return out;
          };
          return HMAC2;
        })()
      );
      exports$1.HMAC = HMAC;
      function hash(data) {
        var h = new Hash().update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      exports$1.hash = hash;
      exports$1["default"] = hash;
      function hmac(key, data) {
        var h = new HMAC(key).update(data);
        var digest = h.digest();
        h.clean();
        return digest;
      }
      exports$1.hmac = hmac;
      function fillBuffer(buffer, hmac2, info, counter) {
        var num = counter[0];
        if (num === 0) {
          throw new Error("hkdf: cannot expand more");
        }
        hmac2.reset();
        if (num > 1) {
          hmac2.update(buffer);
        }
        if (info) {
          hmac2.update(info);
        }
        hmac2.update(counter);
        hmac2.finish(buffer);
        counter[0]++;
      }
      var hkdfSalt = new Uint8Array(exports$1.digestLength);
      function hkdf(key, salt, info, length) {
        if (salt === void 0) {
          salt = hkdfSalt;
        }
        if (length === void 0) {
          length = 32;
        }
        var counter = new Uint8Array([1]);
        var okm = hmac(salt, key);
        var hmac_ = new HMAC(okm);
        var buffer = new Uint8Array(hmac_.digestLength);
        var bufpos = buffer.length;
        var out = new Uint8Array(length);
        for (var i = 0; i < length; i++) {
          if (bufpos === buffer.length) {
            fillBuffer(buffer, hmac_, info, counter);
            bufpos = 0;
          }
          out[i] = buffer[bufpos++];
        }
        hmac_.clean();
        buffer.fill(0);
        counter.fill(0);
        return out;
      }
      exports$1.hkdf = hkdf;
      function pbkdf2(password, salt, iterations, dkLen) {
        var prf = new HMAC(password);
        var len = prf.digestLength;
        var ctr = new Uint8Array(4);
        var t2 = new Uint8Array(len);
        var u = new Uint8Array(len);
        var dk = new Uint8Array(dkLen);
        for (var i = 0; i * len < dkLen; i++) {
          var c = i + 1;
          ctr[0] = c >>> 24 & 255;
          ctr[1] = c >>> 16 & 255;
          ctr[2] = c >>> 8 & 255;
          ctr[3] = c >>> 0 & 255;
          prf.reset();
          prf.update(salt);
          prf.update(ctr);
          prf.finish(u);
          for (var j = 0; j < len; j++) {
            t2[j] = u[j];
          }
          for (var j = 2; j <= iterations; j++) {
            prf.reset();
            prf.update(u).finish(u);
            for (var k = 0; k < len; k++) {
              t2[k] ^= u[k];
            }
          }
          for (var j = 0; j < len && i * len + j < dkLen; j++) {
            dk[i * len + j] = t2[j];
          }
        }
        for (var i = 0; i < len; i++) {
          t2[i] = u[i] = 0;
        }
        for (var i = 0; i < 4; i++) {
          ctr[i] = 0;
        }
        prf.clean();
        return dk;
      }
      exports$1.pbkdf2 = pbkdf2;
    });
  })(sha256$1);
  return sha256$1.exports;
}
requireSha256();
debug("automerge-repo:collectionsync");
const DefaultBufferLength = 1024;
let nextPropID = 0;
class Range {
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }
}
class NodeProp {
  /**
  Create a new node prop type.
  */
  constructor(config2 = {}) {
    this.id = nextPropID++;
    this.perNode = !!config2.perNode;
    this.deserialize = config2.deserialize || (() => {
      throw new Error("This node type doesn't define a deserialize function");
    });
    this.combine = config2.combine || null;
  }
  /**
  This is meant to be used with
  [`NodeSet.extend`](#common.NodeSet.extend) or
  [`LRParser.configure`](#lr.ParserConfig.props) to compute
  prop values for each node type in the set. Takes a [match
  object](#common.NodeType^match) or function that returns undefined
  if the node type doesn't get this prop, and the prop's value if
  it does.
  */
  add(match) {
    if (this.perNode)
      throw new RangeError("Can't add per-node props to node types");
    if (typeof match != "function")
      match = NodeType.match(match);
    return (type) => {
      let result = match(type);
      return result === void 0 ? null : [this, result];
    };
  }
}
NodeProp.closedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.openedBy = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.group = new NodeProp({ deserialize: (str) => str.split(" ") });
NodeProp.isolate = new NodeProp({ deserialize: (value) => {
  if (value && value != "rtl" && value != "ltr" && value != "auto")
    throw new RangeError("Invalid value for isolate: " + value);
  return value || "auto";
} });
NodeProp.contextHash = new NodeProp({ perNode: true });
NodeProp.lookAhead = new NodeProp({ perNode: true });
NodeProp.mounted = new NodeProp({ perNode: true });
class MountedTree {
  constructor(tree, overlay, parser2) {
    this.tree = tree;
    this.overlay = overlay;
    this.parser = parser2;
  }
  /**
  @internal
  */
  static get(tree) {
    return tree && tree.props && tree.props[NodeProp.mounted.id];
  }
}
const noProps = /* @__PURE__ */ Object.create(null);
class NodeType {
  /**
  @internal
  */
  constructor(name2, props, id2, flags = 0) {
    this.name = name2;
    this.props = props;
    this.id = id2;
    this.flags = flags;
  }
  /**
  Define a node type.
  */
  static define(spec) {
    let props = spec.props && spec.props.length ? /* @__PURE__ */ Object.create(null) : noProps;
    let flags = (spec.top ? 1 : 0) | (spec.skipped ? 2 : 0) | (spec.error ? 4 : 0) | (spec.name == null ? 8 : 0);
    let type = new NodeType(spec.name || "", props, spec.id, flags);
    if (spec.props)
      for (let src2 of spec.props) {
        if (!Array.isArray(src2))
          src2 = src2(type);
        if (src2) {
          if (src2[0].perNode)
            throw new RangeError("Can't store a per-node prop on a node type");
          props[src2[0].id] = src2[1];
        }
      }
    return type;
  }
  /**
  Retrieves a node prop for this type. Will return `undefined` if
  the prop isn't present on this node.
  */
  prop(prop) {
    return this.props[prop.id];
  }
  /**
  True when this is the top node of a grammar.
  */
  get isTop() {
    return (this.flags & 1) > 0;
  }
  /**
  True when this node is produced by a skip rule.
  */
  get isSkipped() {
    return (this.flags & 2) > 0;
  }
  /**
  Indicates whether this is an error node.
  */
  get isError() {
    return (this.flags & 4) > 0;
  }
  /**
  When true, this node type doesn't correspond to a user-declared
  named node, for example because it is used to cache repetition.
  */
  get isAnonymous() {
    return (this.flags & 8) > 0;
  }
  /**
  Returns true when this node's name or one of its
  [groups](#common.NodeProp^group) matches the given string.
  */
  is(name2) {
    if (typeof name2 == "string") {
      if (this.name == name2)
        return true;
      let group = this.prop(NodeProp.group);
      return group ? group.indexOf(name2) > -1 : false;
    }
    return this.id == name2;
  }
  /**
  Create a function from node types to arbitrary values by
  specifying an object whose property names are node or
  [group](#common.NodeProp^group) names. Often useful with
  [`NodeProp.add`](#common.NodeProp.add). You can put multiple
  names, separated by spaces, in a single property name to map
  multiple node names to a single value.
  */
  static match(map) {
    let direct = /* @__PURE__ */ Object.create(null);
    for (let prop in map)
      for (let name2 of prop.split(" "))
        direct[name2] = map[prop];
    return (node) => {
      for (let groups = node.prop(NodeProp.group), i = -1; i < (groups ? groups.length : 0); i++) {
        let found = direct[i < 0 ? node.name : groups[i]];
        if (found)
          return found;
      }
    };
  }
}
NodeType.none = new NodeType(
  "",
  /* @__PURE__ */ Object.create(null),
  0,
  8
  /* NodeFlag.Anonymous */
);
class NodeSet {
  /**
  Create a set with the given types. The `id` property of each
  type should correspond to its position within the array.
  */
  constructor(types) {
    this.types = types;
    for (let i = 0; i < types.length; i++)
      if (types[i].id != i)
        throw new RangeError("Node type ids should correspond to array positions when creating a node set");
  }
  /**
  Create a copy of this set with some node properties added. The
  arguments to this method can be created with
  [`NodeProp.add`](#common.NodeProp.add).
  */
  extend(...props) {
    let newTypes = [];
    for (let type of this.types) {
      let newProps = null;
      for (let source of props) {
        let add2 = source(type);
        if (add2) {
          if (!newProps)
            newProps = Object.assign({}, type.props);
          let value = add2[1], prop = add2[0];
          if (prop.combine && prop.id in newProps)
            value = prop.combine(newProps[prop.id], value);
          newProps[prop.id] = value;
        }
      }
      newTypes.push(newProps ? new NodeType(type.name, newProps, type.id, type.flags) : type);
    }
    return new NodeSet(newTypes);
  }
}
const CachedNode = /* @__PURE__ */ new WeakMap(), CachedInnerNode = /* @__PURE__ */ new WeakMap();
var IterMode;
(function(IterMode2) {
  IterMode2[IterMode2["ExcludeBuffers"] = 1] = "ExcludeBuffers";
  IterMode2[IterMode2["IncludeAnonymous"] = 2] = "IncludeAnonymous";
  IterMode2[IterMode2["IgnoreMounts"] = 4] = "IgnoreMounts";
  IterMode2[IterMode2["IgnoreOverlays"] = 8] = "IgnoreOverlays";
})(IterMode || (IterMode = {}));
class Tree {
  /**
  Construct a new tree. See also [`Tree.build`](#common.Tree^build).
  */
  constructor(type, children, positions, length, props) {
    this.type = type;
    this.children = children;
    this.positions = positions;
    this.length = length;
    this.props = null;
    if (props && props.length) {
      this.props = /* @__PURE__ */ Object.create(null);
      for (let [prop, value] of props)
        this.props[typeof prop == "number" ? prop : prop.id] = value;
    }
  }
  /**
  @internal
  */
  toString() {
    let mounted = MountedTree.get(this);
    if (mounted && !mounted.overlay)
      return mounted.tree.toString();
    let children = "";
    for (let ch of this.children) {
      let str = ch.toString();
      if (str) {
        if (children)
          children += ",";
        children += str;
      }
    }
    return !this.type.name ? children : (/\W/.test(this.type.name) && !this.type.isError ? JSON.stringify(this.type.name) : this.type.name) + (children.length ? "(" + children + ")" : "");
  }
  /**
  Get a [tree cursor](#common.TreeCursor) positioned at the top of
  the tree. Mode can be used to [control](#common.IterMode) which
  nodes the cursor visits.
  */
  cursor(mode = 0) {
    return new TreeCursor(this.topNode, mode);
  }
  /**
  Get a [tree cursor](#common.TreeCursor) pointing into this tree
  at the given position and side (see
  [`moveTo`](#common.TreeCursor.moveTo).
  */
  cursorAt(pos, side = 0, mode = 0) {
    let scope = CachedNode.get(this) || this.topNode;
    let cursor = new TreeCursor(scope);
    cursor.moveTo(pos, side);
    CachedNode.set(this, cursor._tree);
    return cursor;
  }
  /**
  Get a [syntax node](#common.SyntaxNode) object for the top of the
  tree.
  */
  get topNode() {
    return new TreeNode(this, 0, 0, null);
  }
  /**
  Get the [syntax node](#common.SyntaxNode) at the given position.
  If `side` is -1, this will move into nodes that end at the
  position. If 1, it'll move into nodes that start at the
  position. With 0, it'll only enter nodes that cover the position
  from both sides.
  
  Note that this will not enter
  [overlays](#common.MountedTree.overlay), and you often want
  [`resolveInner`](#common.Tree.resolveInner) instead.
  */
  resolve(pos, side = 0) {
    let node = resolveNode(CachedNode.get(this) || this.topNode, pos, side, false);
    CachedNode.set(this, node);
    return node;
  }
  /**
  Like [`resolve`](#common.Tree.resolve), but will enter
  [overlaid](#common.MountedTree.overlay) nodes, producing a syntax node
  pointing into the innermost overlaid tree at the given position
  (with parent links going through all parent structure, including
  the host trees).
  */
  resolveInner(pos, side = 0) {
    let node = resolveNode(CachedInnerNode.get(this) || this.topNode, pos, side, true);
    CachedInnerNode.set(this, node);
    return node;
  }
  /**
  In some situations, it can be useful to iterate through all
  nodes around a position, including those in overlays that don't
  directly cover the position. This method gives you an iterator
  that will produce all nodes, from small to big, around the given
  position.
  */
  resolveStack(pos, side = 0) {
    return stackIterator(this, pos, side);
  }
  /**
  Iterate over the tree and its children, calling `enter` for any
  node that touches the `from`/`to` region (if given) before
  running over such a node's children, and `leave` (if given) when
  leaving the node. When `enter` returns `false`, that node will
  not have its children iterated over (or `leave` called).
  */
  iterate(spec) {
    let { enter, leave, from = 0, to = this.length } = spec;
    let mode = spec.mode || 0, anon = (mode & IterMode.IncludeAnonymous) > 0;
    for (let c = this.cursor(mode | IterMode.IncludeAnonymous); ; ) {
      let entered = false;
      if (c.from <= to && c.to >= from && (!anon && c.type.isAnonymous || enter(c) !== false)) {
        if (c.firstChild())
          continue;
        entered = true;
      }
      for (; ; ) {
        if (entered && leave && (anon || !c.type.isAnonymous))
          leave(c);
        if (c.nextSibling())
          break;
        if (!c.parent())
          return;
        entered = true;
      }
    }
  }
  /**
  Get the value of the given [node prop](#common.NodeProp) for this
  node. Works with both per-node and per-type props.
  */
  prop(prop) {
    return !prop.perNode ? this.type.prop(prop) : this.props ? this.props[prop.id] : void 0;
  }
  /**
  Returns the node's [per-node props](#common.NodeProp.perNode) in a
  format that can be passed to the [`Tree`](#common.Tree)
  constructor.
  */
  get propValues() {
    let result = [];
    if (this.props)
      for (let id2 in this.props)
        result.push([+id2, this.props[id2]]);
    return result;
  }
  /**
  Balance the direct children of this tree, producing a copy of
  which may have children grouped into subtrees with type
  [`NodeType.none`](#common.NodeType^none).
  */
  balance(config2 = {}) {
    return this.children.length <= 8 ? this : balanceRange(NodeType.none, this.children, this.positions, 0, this.children.length, 0, this.length, (children, positions, length) => new Tree(this.type, children, positions, length, this.propValues), config2.makeTree || ((children, positions, length) => new Tree(NodeType.none, children, positions, length)));
  }
  /**
  Build a tree from a postfix-ordered buffer of node information,
  or a cursor over such a buffer.
  */
  static build(data) {
    return buildTree(data);
  }
}
Tree.empty = new Tree(NodeType.none, [], [], 0);
class FlatBufferCursor {
  constructor(buffer, index) {
    this.buffer = buffer;
    this.index = index;
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  get pos() {
    return this.index;
  }
  next() {
    this.index -= 4;
  }
  fork() {
    return new FlatBufferCursor(this.buffer, this.index);
  }
}
class TreeBuffer {
  /**
  Create a tree buffer.
  */
  constructor(buffer, length, set) {
    this.buffer = buffer;
    this.length = length;
    this.set = set;
  }
  /**
  @internal
  */
  get type() {
    return NodeType.none;
  }
  /**
  @internal
  */
  toString() {
    let result = [];
    for (let index = 0; index < this.buffer.length; ) {
      result.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result.join(",");
  }
  /**
  @internal
  */
  childString(index) {
    let id2 = this.buffer[index], endIndex = this.buffer[index + 3];
    let type = this.set.types[id2], result = type.name;
    if (/\W/.test(result) && !type.isError)
      result = JSON.stringify(result);
    index += 4;
    if (endIndex == index)
      return result;
    let children = [];
    while (index < endIndex) {
      children.push(this.childString(index));
      index = this.buffer[index + 3];
    }
    return result + "(" + children.join(",") + ")";
  }
  /**
  @internal
  */
  findChild(startIndex, endIndex, dir, pos, side) {
    let { buffer } = this, pick = -1;
    for (let i = startIndex; i != endIndex; i = buffer[i + 3]) {
      if (checkSide(side, pos, buffer[i + 1], buffer[i + 2])) {
        pick = i;
        if (dir > 0)
          break;
      }
    }
    return pick;
  }
  /**
  @internal
  */
  slice(startI, endI, from) {
    let b = this.buffer;
    let copy = new Uint16Array(endI - startI), len = 0;
    for (let i = startI, j = 0; i < endI; ) {
      copy[j++] = b[i++];
      copy[j++] = b[i++] - from;
      let to = copy[j++] = b[i++] - from;
      copy[j++] = b[i++] - startI;
      len = Math.max(len, to);
    }
    return new TreeBuffer(copy, len, this.set);
  }
}
function checkSide(side, pos, from, to) {
  switch (side) {
    case -2:
      return from < pos;
    case -1:
      return to >= pos && from < pos;
    case 0:
      return from < pos && to > pos;
    case 1:
      return from <= pos && to > pos;
    case 2:
      return to > pos;
    case 4:
      return true;
  }
}
function resolveNode(node, pos, side, overlays) {
  var _a2;
  while (node.from == node.to || (side < 1 ? node.from >= pos : node.from > pos) || (side > -1 ? node.to <= pos : node.to < pos)) {
    let parent = !overlays && node instanceof TreeNode && node.index < 0 ? null : node.parent;
    if (!parent)
      return node;
    node = parent;
  }
  let mode = overlays ? 0 : IterMode.IgnoreOverlays;
  if (overlays)
    for (let scan = node, parent = scan.parent; parent; scan = parent, parent = scan.parent) {
      if (scan instanceof TreeNode && scan.index < 0 && ((_a2 = parent.enter(pos, side, mode)) === null || _a2 === void 0 ? void 0 : _a2.from) != scan.from)
        node = parent;
    }
  for (; ; ) {
    let inner = node.enter(pos, side, mode);
    if (!inner)
      return node;
    node = inner;
  }
}
class BaseNode {
  cursor(mode = 0) {
    return new TreeCursor(this, mode);
  }
  getChild(type, before = null, after = null) {
    let r = getChildren(this, type, before, after);
    return r.length ? r[0] : null;
  }
  getChildren(type, before = null, after = null) {
    return getChildren(this, type, before, after);
  }
  resolve(pos, side = 0) {
    return resolveNode(this, pos, side, false);
  }
  resolveInner(pos, side = 0) {
    return resolveNode(this, pos, side, true);
  }
  matchContext(context) {
    return matchNodeContext(this.parent, context);
  }
  enterUnfinishedNodesBefore(pos) {
    let scan = this.childBefore(pos), node = this;
    while (scan) {
      let last = scan.lastChild;
      if (!last || last.to != scan.to)
        break;
      if (last.type.isError && last.from == last.to) {
        node = scan;
        scan = last.prevSibling;
      } else {
        scan = last;
      }
    }
    return node;
  }
  get node() {
    return this;
  }
  get next() {
    return this.parent;
  }
}
class TreeNode extends BaseNode {
  constructor(_tree, from, index, _parent) {
    super();
    this._tree = _tree;
    this.from = from;
    this.index = index;
    this._parent = _parent;
  }
  get type() {
    return this._tree.type;
  }
  get name() {
    return this._tree.type.name;
  }
  get to() {
    return this.from + this._tree.length;
  }
  nextChild(i, dir, pos, side, mode = 0) {
    for (let parent = this; ; ) {
      for (let { children, positions } = parent._tree, e = dir > 0 ? children.length : -1; i != e; i += dir) {
        let next = children[i], start = positions[i] + parent.from;
        if (!checkSide(side, pos, start, start + next.length))
          continue;
        if (next instanceof TreeBuffer) {
          if (mode & IterMode.ExcludeBuffers)
            continue;
          let index = next.findChild(0, next.buffer.length, dir, pos - start, side);
          if (index > -1)
            return new BufferNode(new BufferContext(parent, next, i, start), null, index);
        } else if (mode & IterMode.IncludeAnonymous || (!next.type.isAnonymous || hasChild(next))) {
          let mounted;
          if (!(mode & IterMode.IgnoreMounts) && (mounted = MountedTree.get(next)) && !mounted.overlay)
            return new TreeNode(mounted.tree, start, i, parent);
          let inner = new TreeNode(next, start, i, parent);
          return mode & IterMode.IncludeAnonymous || !inner.type.isAnonymous ? inner : inner.nextChild(dir < 0 ? next.children.length - 1 : 0, dir, pos, side);
        }
      }
      if (mode & IterMode.IncludeAnonymous || !parent.type.isAnonymous)
        return null;
      if (parent.index >= 0)
        i = parent.index + dir;
      else
        i = dir < 0 ? -1 : parent._parent._tree.children.length;
      parent = parent._parent;
      if (!parent)
        return null;
    }
  }
  get firstChild() {
    return this.nextChild(
      0,
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  get lastChild() {
    return this.nextChild(
      this._tree.children.length - 1,
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  childAfter(pos) {
    return this.nextChild(
      0,
      1,
      pos,
      2
      /* Side.After */
    );
  }
  childBefore(pos) {
    return this.nextChild(
      this._tree.children.length - 1,
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  enter(pos, side, mode = 0) {
    let mounted;
    if (!(mode & IterMode.IgnoreOverlays) && (mounted = MountedTree.get(this._tree)) && mounted.overlay) {
      let rPos = pos - this.from;
      for (let { from, to } of mounted.overlay) {
        if ((side > 0 ? from <= rPos : from < rPos) && (side < 0 ? to >= rPos : to > rPos))
          return new TreeNode(mounted.tree, mounted.overlay[0].from + this.from, -1, this);
      }
    }
    return this.nextChild(0, 1, pos, side, mode);
  }
  nextSignificantParent() {
    let val = this;
    while (val.type.isAnonymous && val._parent)
      val = val._parent;
    return val;
  }
  get parent() {
    return this._parent ? this._parent.nextSignificantParent() : null;
  }
  get nextSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(
      this.index + 1,
      1,
      0,
      4
      /* Side.DontCare */
    ) : null;
  }
  get prevSibling() {
    return this._parent && this.index >= 0 ? this._parent.nextChild(
      this.index - 1,
      -1,
      0,
      4
      /* Side.DontCare */
    ) : null;
  }
  get tree() {
    return this._tree;
  }
  toTree() {
    return this._tree;
  }
  /**
  @internal
  */
  toString() {
    return this._tree.toString();
  }
}
function getChildren(node, type, before, after) {
  let cur2 = node.cursor(), result = [];
  if (!cur2.firstChild())
    return result;
  if (before != null)
    for (let found = false; !found; ) {
      found = cur2.type.is(before);
      if (!cur2.nextSibling())
        return result;
    }
  for (; ; ) {
    if (after != null && cur2.type.is(after))
      return result;
    if (cur2.type.is(type))
      result.push(cur2.node);
    if (!cur2.nextSibling())
      return after == null ? result : [];
  }
}
function matchNodeContext(node, context, i = context.length - 1) {
  for (let p = node; i >= 0; p = p.parent) {
    if (!p)
      return false;
    if (!p.type.isAnonymous) {
      if (context[i] && context[i] != p.name)
        return false;
      i--;
    }
  }
  return true;
}
class BufferContext {
  constructor(parent, buffer, index, start) {
    this.parent = parent;
    this.buffer = buffer;
    this.index = index;
    this.start = start;
  }
}
class BufferNode extends BaseNode {
  get name() {
    return this.type.name;
  }
  get from() {
    return this.context.start + this.context.buffer.buffer[this.index + 1];
  }
  get to() {
    return this.context.start + this.context.buffer.buffer[this.index + 2];
  }
  constructor(context, _parent, index) {
    super();
    this.context = context;
    this._parent = _parent;
    this.index = index;
    this.type = context.buffer.set.types[context.buffer.buffer[index]];
  }
  child(dir, pos, side) {
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.context.start, side);
    return index < 0 ? null : new BufferNode(this.context, this, index);
  }
  get firstChild() {
    return this.child(
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  get lastChild() {
    return this.child(
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  childAfter(pos) {
    return this.child(
      1,
      pos,
      2
      /* Side.After */
    );
  }
  childBefore(pos) {
    return this.child(
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  enter(pos, side, mode = 0) {
    if (mode & IterMode.ExcludeBuffers)
      return null;
    let { buffer } = this.context;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], side > 0 ? 1 : -1, pos - this.context.start, side);
    return index < 0 ? null : new BufferNode(this.context, this, index);
  }
  get parent() {
    return this._parent || this.context.parent.nextSignificantParent();
  }
  externalSibling(dir) {
    return this._parent ? null : this.context.parent.nextChild(
      this.context.index + dir,
      dir,
      0,
      4
      /* Side.DontCare */
    );
  }
  get nextSibling() {
    let { buffer } = this.context;
    let after = buffer.buffer[this.index + 3];
    if (after < (this._parent ? buffer.buffer[this._parent.index + 3] : buffer.buffer.length))
      return new BufferNode(this.context, this._parent, after);
    return this.externalSibling(1);
  }
  get prevSibling() {
    let { buffer } = this.context;
    let parentStart = this._parent ? this._parent.index + 4 : 0;
    if (this.index == parentStart)
      return this.externalSibling(-1);
    return new BufferNode(this.context, this._parent, buffer.findChild(
      parentStart,
      this.index,
      -1,
      0,
      4
      /* Side.DontCare */
    ));
  }
  get tree() {
    return null;
  }
  toTree() {
    let children = [], positions = [];
    let { buffer } = this.context;
    let startI = this.index + 4, endI = buffer.buffer[this.index + 3];
    if (endI > startI) {
      let from = buffer.buffer[this.index + 1];
      children.push(buffer.slice(startI, endI, from));
      positions.push(0);
    }
    return new Tree(this.type, children, positions, this.to - this.from);
  }
  /**
  @internal
  */
  toString() {
    return this.context.buffer.childString(this.index);
  }
}
function iterStack(heads) {
  if (!heads.length)
    return null;
  let pick = 0, picked = heads[0];
  for (let i = 1; i < heads.length; i++) {
    let node = heads[i];
    if (node.from > picked.from || node.to < picked.to) {
      picked = node;
      pick = i;
    }
  }
  let next = picked instanceof TreeNode && picked.index < 0 ? null : picked.parent;
  let newHeads = heads.slice();
  if (next)
    newHeads[pick] = next;
  else
    newHeads.splice(pick, 1);
  return new StackIterator(newHeads, picked);
}
class StackIterator {
  constructor(heads, node) {
    this.heads = heads;
    this.node = node;
  }
  get next() {
    return iterStack(this.heads);
  }
}
function stackIterator(tree, pos, side) {
  let inner = tree.resolveInner(pos, side), layers = null;
  for (let scan = inner instanceof TreeNode ? inner : inner.context.parent; scan; scan = scan.parent) {
    if (scan.index < 0) {
      let parent = scan.parent;
      (layers || (layers = [inner])).push(parent.resolve(pos, side));
      scan = parent;
    } else {
      let mount = MountedTree.get(scan.tree);
      if (mount && mount.overlay && mount.overlay[0].from <= pos && mount.overlay[mount.overlay.length - 1].to >= pos) {
        let root = new TreeNode(mount.tree, mount.overlay[0].from + scan.from, -1, scan);
        (layers || (layers = [inner])).push(resolveNode(root, pos, side, false));
      }
    }
  }
  return layers ? iterStack(layers) : inner;
}
class TreeCursor {
  /**
  Shorthand for `.type.name`.
  */
  get name() {
    return this.type.name;
  }
  /**
  @internal
  */
  constructor(node, mode = 0) {
    this.mode = mode;
    this.buffer = null;
    this.stack = [];
    this.index = 0;
    this.bufferNode = null;
    if (node instanceof TreeNode) {
      this.yieldNode(node);
    } else {
      this._tree = node.context.parent;
      this.buffer = node.context;
      for (let n = node._parent; n; n = n._parent)
        this.stack.unshift(n.index);
      this.bufferNode = node;
      this.yieldBuf(node.index);
    }
  }
  yieldNode(node) {
    if (!node)
      return false;
    this._tree = node;
    this.type = node.type;
    this.from = node.from;
    this.to = node.to;
    return true;
  }
  yieldBuf(index, type) {
    this.index = index;
    let { start, buffer } = this.buffer;
    this.type = type || buffer.set.types[buffer.buffer[index]];
    this.from = start + buffer.buffer[index + 1];
    this.to = start + buffer.buffer[index + 2];
    return true;
  }
  /**
  @internal
  */
  yield(node) {
    if (!node)
      return false;
    if (node instanceof TreeNode) {
      this.buffer = null;
      return this.yieldNode(node);
    }
    this.buffer = node.context;
    return this.yieldBuf(node.index, node.type);
  }
  /**
  @internal
  */
  toString() {
    return this.buffer ? this.buffer.buffer.childString(this.index) : this._tree.toString();
  }
  /**
  @internal
  */
  enterChild(dir, pos, side) {
    if (!this.buffer)
      return this.yield(this._tree.nextChild(dir < 0 ? this._tree._tree.children.length - 1 : 0, dir, pos, side, this.mode));
    let { buffer } = this.buffer;
    let index = buffer.findChild(this.index + 4, buffer.buffer[this.index + 3], dir, pos - this.buffer.start, side);
    if (index < 0)
      return false;
    this.stack.push(this.index);
    return this.yieldBuf(index);
  }
  /**
  Move the cursor to this node's first child. When this returns
  false, the node has no child, and the cursor has not been moved.
  */
  firstChild() {
    return this.enterChild(
      1,
      0,
      4
      /* Side.DontCare */
    );
  }
  /**
  Move the cursor to this node's last child.
  */
  lastChild() {
    return this.enterChild(
      -1,
      0,
      4
      /* Side.DontCare */
    );
  }
  /**
  Move the cursor to the first child that ends after `pos`.
  */
  childAfter(pos) {
    return this.enterChild(
      1,
      pos,
      2
      /* Side.After */
    );
  }
  /**
  Move to the last child that starts before `pos`.
  */
  childBefore(pos) {
    return this.enterChild(
      -1,
      pos,
      -2
      /* Side.Before */
    );
  }
  /**
  Move the cursor to the child around `pos`. If side is -1 the
  child may end at that position, when 1 it may start there. This
  will also enter [overlaid](#common.MountedTree.overlay)
  [mounted](#common.NodeProp^mounted) trees unless `overlays` is
  set to false.
  */
  enter(pos, side, mode = this.mode) {
    if (!this.buffer)
      return this.yield(this._tree.enter(pos, side, mode));
    return mode & IterMode.ExcludeBuffers ? false : this.enterChild(1, pos, side);
  }
  /**
  Move to the node's parent node, if this isn't the top node.
  */
  parent() {
    if (!this.buffer)
      return this.yieldNode(this.mode & IterMode.IncludeAnonymous ? this._tree._parent : this._tree.parent);
    if (this.stack.length)
      return this.yieldBuf(this.stack.pop());
    let parent = this.mode & IterMode.IncludeAnonymous ? this.buffer.parent : this.buffer.parent.nextSignificantParent();
    this.buffer = null;
    return this.yieldNode(parent);
  }
  /**
  @internal
  */
  sibling(dir) {
    if (!this.buffer)
      return !this._tree._parent ? false : this.yield(this._tree.index < 0 ? null : this._tree._parent.nextChild(this._tree.index + dir, dir, 0, 4, this.mode));
    let { buffer } = this.buffer, d = this.stack.length - 1;
    if (dir < 0) {
      let parentStart = d < 0 ? 0 : this.stack[d] + 4;
      if (this.index != parentStart)
        return this.yieldBuf(buffer.findChild(
          parentStart,
          this.index,
          -1,
          0,
          4
          /* Side.DontCare */
        ));
    } else {
      let after = buffer.buffer[this.index + 3];
      if (after < (d < 0 ? buffer.buffer.length : buffer.buffer[this.stack[d] + 3]))
        return this.yieldBuf(after);
    }
    return d < 0 ? this.yield(this.buffer.parent.nextChild(this.buffer.index + dir, dir, 0, 4, this.mode)) : false;
  }
  /**
  Move to this node's next sibling, if any.
  */
  nextSibling() {
    return this.sibling(1);
  }
  /**
  Move to this node's previous sibling, if any.
  */
  prevSibling() {
    return this.sibling(-1);
  }
  atLastNode(dir) {
    let index, parent, { buffer } = this;
    if (buffer) {
      if (dir > 0) {
        if (this.index < buffer.buffer.buffer.length)
          return false;
      } else {
        for (let i = 0; i < this.index; i++)
          if (buffer.buffer.buffer[i + 3] < this.index)
            return false;
      }
      ({ index, parent } = buffer);
    } else {
      ({ index, _parent: parent } = this._tree);
    }
    for (; parent; { index, _parent: parent } = parent) {
      if (index > -1)
        for (let i = index + dir, e = dir < 0 ? -1 : parent._tree.children.length; i != e; i += dir) {
          let child = parent._tree.children[i];
          if (this.mode & IterMode.IncludeAnonymous || child instanceof TreeBuffer || !child.type.isAnonymous || hasChild(child))
            return false;
        }
    }
    return true;
  }
  move(dir, enter) {
    if (enter && this.enterChild(
      dir,
      0,
      4
      /* Side.DontCare */
    ))
      return true;
    for (; ; ) {
      if (this.sibling(dir))
        return true;
      if (this.atLastNode(dir) || !this.parent())
        return false;
    }
  }
  /**
  Move to the next node in a
  [pre-order](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order,_NLR)
  traversal, going from a node to its first child or, if the
  current node is empty or `enter` is false, its next sibling or
  the next sibling of the first parent node that has one.
  */
  next(enter = true) {
    return this.move(1, enter);
  }
  /**
  Move to the next node in a last-to-first pre-order traversal. A
  node is followed by its last child or, if it has none, its
  previous sibling or the previous sibling of the first parent
  node that has one.
  */
  prev(enter = true) {
    return this.move(-1, enter);
  }
  /**
  Move the cursor to the innermost node that covers `pos`. If
  `side` is -1, it will enter nodes that end at `pos`. If it is 1,
  it will enter nodes that start at `pos`.
  */
  moveTo(pos, side = 0) {
    while (this.from == this.to || (side < 1 ? this.from >= pos : this.from > pos) || (side > -1 ? this.to <= pos : this.to < pos))
      if (!this.parent())
        break;
    while (this.enterChild(1, pos, side)) {
    }
    return this;
  }
  /**
  Get a [syntax node](#common.SyntaxNode) at the cursor's current
  position.
  */
  get node() {
    if (!this.buffer)
      return this._tree;
    let cache = this.bufferNode, result = null, depth = 0;
    if (cache && cache.context == this.buffer) {
      scan: for (let index = this.index, d = this.stack.length; d >= 0; ) {
        for (let c = cache; c; c = c._parent)
          if (c.index == index) {
            if (index == this.index)
              return c;
            result = c;
            depth = d + 1;
            break scan;
          }
        index = this.stack[--d];
      }
    }
    for (let i = depth; i < this.stack.length; i++)
      result = new BufferNode(this.buffer, result, this.stack[i]);
    return this.bufferNode = new BufferNode(this.buffer, result, this.index);
  }
  /**
  Get the [tree](#common.Tree) that represents the current node, if
  any. Will return null when the node is in a [tree
  buffer](#common.TreeBuffer).
  */
  get tree() {
    return this.buffer ? null : this._tree._tree;
  }
  /**
  Iterate over the current node and all its descendants, calling
  `enter` when entering a node and `leave`, if given, when leaving
  one. When `enter` returns `false`, any children of that node are
  skipped, and `leave` isn't called for it.
  */
  iterate(enter, leave) {
    for (let depth = 0; ; ) {
      let mustLeave = false;
      if (this.type.isAnonymous || enter(this) !== false) {
        if (this.firstChild()) {
          depth++;
          continue;
        }
        if (!this.type.isAnonymous)
          mustLeave = true;
      }
      for (; ; ) {
        if (mustLeave && leave)
          leave(this);
        mustLeave = this.type.isAnonymous;
        if (!depth)
          return;
        if (this.nextSibling())
          break;
        this.parent();
        depth--;
        mustLeave = true;
      }
    }
  }
  /**
  Test whether the current node matches a given context—a sequence
  of direct parent node names. Empty strings in the context array
  are treated as wildcards.
  */
  matchContext(context) {
    if (!this.buffer)
      return matchNodeContext(this.node.parent, context);
    let { buffer } = this.buffer, { types } = buffer.set;
    for (let i = context.length - 1, d = this.stack.length - 1; i >= 0; d--) {
      if (d < 0)
        return matchNodeContext(this._tree, context, i);
      let type = types[buffer.buffer[this.stack[d]]];
      if (!type.isAnonymous) {
        if (context[i] && context[i] != type.name)
          return false;
        i--;
      }
    }
    return true;
  }
}
function hasChild(tree) {
  return tree.children.some((ch) => ch instanceof TreeBuffer || !ch.type.isAnonymous || hasChild(ch));
}
function buildTree(data) {
  var _a2;
  let { buffer, nodeSet, maxBufferLength = DefaultBufferLength, reused = [], minRepeatType = nodeSet.types.length } = data;
  let cursor = Array.isArray(buffer) ? new FlatBufferCursor(buffer, buffer.length) : buffer;
  let types = nodeSet.types;
  let contextHash = 0, lookAhead = 0;
  function takeNode(parentStart, minPos, children2, positions2, inRepeat, depth) {
    let { id: id2, start, end, size } = cursor;
    let lookAheadAtStart = lookAhead, contextAtStart = contextHash;
    if (size < 0) {
      cursor.next();
      if (size == -1) {
        let node2 = reused[id2];
        children2.push(node2);
        positions2.push(start - parentStart);
        return;
      } else if (size == -3) {
        contextHash = id2;
        return;
      } else if (size == -4) {
        lookAhead = id2;
        return;
      } else {
        throw new RangeError(`Unrecognized record size: ${size}`);
      }
    }
    let type = types[id2], node, buffer2;
    let startPos = start - parentStart;
    if (end - start <= maxBufferLength && (buffer2 = findBufferSize(cursor.pos - minPos, inRepeat))) {
      let data2 = new Uint16Array(buffer2.size - buffer2.skip);
      let endPos = cursor.pos - buffer2.size, index = data2.length;
      while (cursor.pos > endPos)
        index = copyToBuffer(buffer2.start, data2, index);
      node = new TreeBuffer(data2, end - buffer2.start, nodeSet);
      startPos = buffer2.start - parentStart;
    } else {
      let endPos = cursor.pos - size;
      cursor.next();
      let localChildren = [], localPositions = [];
      let localInRepeat = id2 >= minRepeatType ? id2 : -1;
      let lastGroup = 0, lastEnd = end;
      while (cursor.pos > endPos) {
        if (localInRepeat >= 0 && cursor.id == localInRepeat && cursor.size >= 0) {
          if (cursor.end <= lastEnd - maxBufferLength) {
            makeRepeatLeaf(localChildren, localPositions, start, lastGroup, cursor.end, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
            lastGroup = localChildren.length;
            lastEnd = cursor.end;
          }
          cursor.next();
        } else if (depth > 2500) {
          takeFlatNode(start, endPos, localChildren, localPositions);
        } else {
          takeNode(start, endPos, localChildren, localPositions, localInRepeat, depth + 1);
        }
      }
      if (localInRepeat >= 0 && lastGroup > 0 && lastGroup < localChildren.length)
        makeRepeatLeaf(localChildren, localPositions, start, lastGroup, start, lastEnd, localInRepeat, lookAheadAtStart, contextAtStart);
      localChildren.reverse();
      localPositions.reverse();
      if (localInRepeat > -1 && lastGroup > 0) {
        let make = makeBalanced(type, contextAtStart);
        node = balanceRange(type, localChildren, localPositions, 0, localChildren.length, 0, end - start, make, make);
      } else {
        node = makeTree(type, localChildren, localPositions, end - start, lookAheadAtStart - end, contextAtStart);
      }
    }
    children2.push(node);
    positions2.push(startPos);
  }
  function takeFlatNode(parentStart, minPos, children2, positions2) {
    let nodes = [];
    let nodeCount = 0, stopAt = -1;
    while (cursor.pos > minPos) {
      let { id: id2, start, end, size } = cursor;
      if (size > 4) {
        cursor.next();
      } else if (stopAt > -1 && start < stopAt) {
        break;
      } else {
        if (stopAt < 0)
          stopAt = end - maxBufferLength;
        nodes.push(id2, start, end);
        nodeCount++;
        cursor.next();
      }
    }
    if (nodeCount) {
      let buffer2 = new Uint16Array(nodeCount * 4);
      let start = nodes[nodes.length - 2];
      for (let i = nodes.length - 3, j = 0; i >= 0; i -= 3) {
        buffer2[j++] = nodes[i];
        buffer2[j++] = nodes[i + 1] - start;
        buffer2[j++] = nodes[i + 2] - start;
        buffer2[j++] = j;
      }
      children2.push(new TreeBuffer(buffer2, nodes[2] - start, nodeSet));
      positions2.push(start - parentStart);
    }
  }
  function makeBalanced(type, contextHash2) {
    return (children2, positions2, length2) => {
      let lookAhead2 = 0, lastI = children2.length - 1, last, lookAheadProp;
      if (lastI >= 0 && (last = children2[lastI]) instanceof Tree) {
        if (!lastI && last.type == type && last.length == length2)
          return last;
        if (lookAheadProp = last.prop(NodeProp.lookAhead))
          lookAhead2 = positions2[lastI] + last.length + lookAheadProp;
      }
      return makeTree(type, children2, positions2, length2, lookAhead2, contextHash2);
    };
  }
  function makeRepeatLeaf(children2, positions2, base2, i, from, to, type, lookAhead2, contextHash2) {
    let localChildren = [], localPositions = [];
    while (children2.length > i) {
      localChildren.push(children2.pop());
      localPositions.push(positions2.pop() + base2 - from);
    }
    children2.push(makeTree(nodeSet.types[type], localChildren, localPositions, to - from, lookAhead2 - to, contextHash2));
    positions2.push(from - base2);
  }
  function makeTree(type, children2, positions2, length2, lookAhead2, contextHash2, props) {
    if (contextHash2) {
      let pair2 = [NodeProp.contextHash, contextHash2];
      props = props ? [pair2].concat(props) : [pair2];
    }
    if (lookAhead2 > 25) {
      let pair2 = [NodeProp.lookAhead, lookAhead2];
      props = props ? [pair2].concat(props) : [pair2];
    }
    return new Tree(type, children2, positions2, length2, props);
  }
  function findBufferSize(maxSize, inRepeat) {
    let fork = cursor.fork();
    let size = 0, start = 0, skip = 0, minStart = fork.end - maxBufferLength;
    let result = { size: 0, start: 0, skip: 0 };
    scan: for (let minPos = fork.pos - maxSize; fork.pos > minPos; ) {
      let nodeSize2 = fork.size;
      if (fork.id == inRepeat && nodeSize2 >= 0) {
        result.size = size;
        result.start = start;
        result.skip = skip;
        skip += 4;
        size += 4;
        fork.next();
        continue;
      }
      let startPos = fork.pos - nodeSize2;
      if (nodeSize2 < 0 || startPos < minPos || fork.start < minStart)
        break;
      let localSkipped = fork.id >= minRepeatType ? 4 : 0;
      let nodeStart2 = fork.start;
      fork.next();
      while (fork.pos > startPos) {
        if (fork.size < 0) {
          if (fork.size == -3)
            localSkipped += 4;
          else
            break scan;
        } else if (fork.id >= minRepeatType) {
          localSkipped += 4;
        }
        fork.next();
      }
      start = nodeStart2;
      size += nodeSize2;
      skip += localSkipped;
    }
    if (inRepeat < 0 || size == maxSize) {
      result.size = size;
      result.start = start;
      result.skip = skip;
    }
    return result.size > 4 ? result : void 0;
  }
  function copyToBuffer(bufferStart, buffer2, index) {
    let { id: id2, start, end, size } = cursor;
    cursor.next();
    if (size >= 0 && id2 < minRepeatType) {
      let startIndex = index;
      if (size > 4) {
        let endPos = cursor.pos - (size - 4);
        while (cursor.pos > endPos)
          index = copyToBuffer(bufferStart, buffer2, index);
      }
      buffer2[--index] = startIndex;
      buffer2[--index] = end - bufferStart;
      buffer2[--index] = start - bufferStart;
      buffer2[--index] = id2;
    } else if (size == -3) {
      contextHash = id2;
    } else if (size == -4) {
      lookAhead = id2;
    }
    return index;
  }
  let children = [], positions = [];
  while (cursor.pos > 0)
    takeNode(data.start || 0, data.bufferStart || 0, children, positions, -1, 0);
  let length = (_a2 = data.length) !== null && _a2 !== void 0 ? _a2 : children.length ? positions[0] + children[0].length : 0;
  return new Tree(types[data.topID], children.reverse(), positions.reverse(), length);
}
const nodeSizeCache = /* @__PURE__ */ new WeakMap();
function nodeSize(balanceType, node) {
  if (!balanceType.isAnonymous || node instanceof TreeBuffer || node.type != balanceType)
    return 1;
  let size = nodeSizeCache.get(node);
  if (size == null) {
    size = 1;
    for (let child of node.children) {
      if (child.type != balanceType || !(child instanceof Tree)) {
        size = 1;
        break;
      }
      size += nodeSize(balanceType, child);
    }
    nodeSizeCache.set(node, size);
  }
  return size;
}
function balanceRange(balanceType, children, positions, from, to, start, length, mkTop, mkTree) {
  let total = 0;
  for (let i = from; i < to; i++)
    total += nodeSize(balanceType, children[i]);
  let maxChild = Math.ceil(
    total * 1.5 / 8
    /* Balance.BranchFactor */
  );
  let localChildren = [], localPositions = [];
  function divide(children2, positions2, from2, to2, offset) {
    for (let i = from2; i < to2; ) {
      let groupFrom = i, groupStart = positions2[i], groupSize = nodeSize(balanceType, children2[i]);
      i++;
      for (; i < to2; i++) {
        let nextSize = nodeSize(balanceType, children2[i]);
        if (groupSize + nextSize >= maxChild)
          break;
        groupSize += nextSize;
      }
      if (i == groupFrom + 1) {
        if (groupSize > maxChild) {
          let only = children2[groupFrom];
          divide(only.children, only.positions, 0, only.children.length, positions2[groupFrom] + offset);
          continue;
        }
        localChildren.push(children2[groupFrom]);
      } else {
        let length2 = positions2[i - 1] + children2[i - 1].length - groupStart;
        localChildren.push(balanceRange(balanceType, children2, positions2, groupFrom, i, groupStart, length2, null, mkTree));
      }
      localPositions.push(groupStart + offset - start);
    }
  }
  divide(children, positions, from, to, 0);
  return (mkTop || mkTree)(localChildren, localPositions, length);
}
class Parser {
  /**
  Start a parse, returning a [partial parse](#common.PartialParse)
  object. [`fragments`](#common.TreeFragment) can be passed in to
  make the parse incremental.
  
  By default, the entire input is parsed. You can pass `ranges`,
  which should be a sorted array of non-empty, non-overlapping
  ranges, to parse only those ranges. The tree returned in that
  case will start at `ranges[0].from`.
  */
  startParse(input, fragments, ranges) {
    if (typeof input == "string")
      input = new StringInput(input);
    ranges = !ranges ? [new Range(0, input.length)] : ranges.length ? ranges.map((r) => new Range(r.from, r.to)) : [new Range(0, 0)];
    return this.createParse(input, fragments || [], ranges);
  }
  /**
  Run a full parse, returning the resulting tree.
  */
  parse(input, fragments, ranges) {
    let parse2 = this.startParse(input, fragments, ranges);
    for (; ; ) {
      let done = parse2.advance();
      if (done)
        return done;
    }
  }
}
class StringInput {
  constructor(string2) {
    this.string = string2;
  }
  get length() {
    return this.string.length;
  }
  chunk(from) {
    return this.string.slice(from);
  }
  get lineChunks() {
    return false;
  }
  read(from, to) {
    return this.string.slice(from, to);
  }
}
new NodeProp({ perNode: true });
const toggleComment = (target2) => {
  let { state } = target2, line = state.doc.lineAt(state.selection.main.from), config2 = getConfig(target2.state, line.from);
  return config2.line ? toggleLineComment(target2) : config2.block ? toggleBlockCommentByLine(target2) : false;
};
function command(f, option) {
  return ({ state, dispatch }) => {
    if (state.readOnly)
      return false;
    let tr = f(option, state);
    if (!tr)
      return false;
    dispatch(state.update(tr));
    return true;
  };
}
const toggleLineComment = /* @__PURE__ */ command(
  changeLineComment,
  0
  /* CommentOption.Toggle */
);
const toggleBlockComment = /* @__PURE__ */ command(
  changeBlockComment,
  0
  /* CommentOption.Toggle */
);
const toggleBlockCommentByLine = /* @__PURE__ */ command(
  (o, s) => changeBlockComment(o, s, selectedLineRanges(s)),
  0
  /* CommentOption.Toggle */
);
function getConfig(state, pos) {
  let data = state.languageDataAt("commentTokens", pos, 1);
  return data.length ? data[0] : {};
}
const SearchMargin = 50;
function findBlockComment(state, { open, close }, from, to) {
  let textBefore = state.sliceDoc(from - SearchMargin, from);
  let textAfter = state.sliceDoc(to, to + SearchMargin);
  let spaceBefore = /\s*$/.exec(textBefore)[0].length, spaceAfter = /^\s*/.exec(textAfter)[0].length;
  let beforeOff = textBefore.length - spaceBefore;
  if (textBefore.slice(beforeOff - open.length, beforeOff) == open && textAfter.slice(spaceAfter, spaceAfter + close.length) == close) {
    return {
      open: { pos: from - spaceBefore, margin: spaceBefore && 1 },
      close: { pos: to + spaceAfter, margin: spaceAfter && 1 }
    };
  }
  let startText, endText;
  if (to - from <= 2 * SearchMargin) {
    startText = endText = state.sliceDoc(from, to);
  } else {
    startText = state.sliceDoc(from, from + SearchMargin);
    endText = state.sliceDoc(to - SearchMargin, to);
  }
  let startSpace = /^\s*/.exec(startText)[0].length, endSpace = /\s*$/.exec(endText)[0].length;
  let endOff = endText.length - endSpace - close.length;
  if (startText.slice(startSpace, startSpace + open.length) == open && endText.slice(endOff, endOff + close.length) == close) {
    return {
      open: {
        pos: from + startSpace + open.length,
        margin: /\s/.test(startText.charAt(startSpace + open.length)) ? 1 : 0
      },
      close: {
        pos: to - endSpace - close.length,
        margin: /\s/.test(endText.charAt(endOff - 1)) ? 1 : 0
      }
    };
  }
  return null;
}
function selectedLineRanges(state) {
  let ranges = [];
  for (let r of state.selection.ranges) {
    let fromLine = state.doc.lineAt(r.from);
    let toLine = r.to <= fromLine.to ? fromLine : state.doc.lineAt(r.to);
    if (toLine.from > fromLine.from && toLine.from == r.to)
      toLine = r.to == fromLine.to + 1 ? fromLine : state.doc.lineAt(r.to - 1);
    let last = ranges.length - 1;
    if (last >= 0 && ranges[last].to > fromLine.from)
      ranges[last].to = toLine.to;
    else
      ranges.push({ from: fromLine.from + /^\s*/.exec(fromLine.text)[0].length, to: toLine.to });
  }
  return ranges;
}
function changeBlockComment(option, state, ranges = state.selection.ranges) {
  let tokens = ranges.map((r) => getConfig(state, r.from).block);
  if (!tokens.every((c) => c))
    return null;
  let comments = ranges.map((r, i) => findBlockComment(state, tokens[i], r.from, r.to));
  if (option != 2 && !comments.every((c) => c)) {
    return { changes: state.changes(ranges.map((range, i) => {
      if (comments[i])
        return [];
      return [{ from: range.from, insert: tokens[i].open + " " }, { from: range.to, insert: " " + tokens[i].close }];
    })) };
  } else if (option != 1 && comments.some((c) => c)) {
    let changes = [];
    for (let i = 0, comment2; i < comments.length; i++)
      if (comment2 = comments[i]) {
        let token = tokens[i], { open, close } = comment2;
        changes.push({ from: open.pos - token.open.length, to: open.pos + open.margin }, { from: close.pos - close.margin, to: close.pos + token.close.length });
      }
    return { changes };
  }
  return null;
}
function changeLineComment(option, state, ranges = state.selection.ranges) {
  let lines = [];
  let prevLine = -1;
  for (let { from, to } of ranges) {
    let startI = lines.length, minIndent = 1e9;
    let token = getConfig(state, from).line;
    if (!token)
      continue;
    for (let pos = from; pos <= to; ) {
      let line = state.doc.lineAt(pos);
      if (line.from > prevLine && (from == to || to > line.from)) {
        prevLine = line.from;
        let indent = /^\s*/.exec(line.text)[0].length;
        let empty = indent == line.length;
        let comment2 = line.text.slice(indent, indent + token.length) == token ? indent : -1;
        if (indent < line.text.length && indent < minIndent)
          minIndent = indent;
        lines.push({ line, comment: comment2, token, indent, empty, single: false });
      }
      pos = line.to + 1;
    }
    if (minIndent < 1e9) {
      for (let i = startI; i < lines.length; i++)
        if (lines[i].indent < lines[i].line.text.length)
          lines[i].indent = minIndent;
    }
    if (lines.length == startI + 1)
      lines[startI].single = true;
  }
  if (option != 2 && lines.some((l) => l.comment < 0 && (!l.empty || l.single))) {
    let changes = [];
    for (let { line, token, indent, empty, single } of lines)
      if (single || !empty)
        changes.push({ from: line.from + indent, insert: token + " " });
    let changeSet = state.changes(changes);
    return { changes: changeSet, selection: state.selection.map(changeSet, 1) };
  } else if (option != 1 && lines.some((l) => l.comment >= 0)) {
    let changes = [];
    for (let { line, comment: comment2, token } of lines)
      if (comment2 >= 0) {
        let from = line.from + comment2, to = from + token.length;
        if (line.text[to - line.from] == " ")
          to++;
        changes.push({ from, to });
      }
    return { changes };
  }
  return null;
}
const fromHistory = /* @__PURE__ */ Annotation.define();
const isolateHistory = /* @__PURE__ */ Annotation.define();
const invertedEffects = /* @__PURE__ */ Facet.define();
const historyConfig = /* @__PURE__ */ Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      minDepth: 100,
      newGroupDelay: 500,
      joinToEvent: (_t, isAdjacent2) => isAdjacent2
    }, {
      minDepth: Math.max,
      newGroupDelay: Math.min,
      joinToEvent: (a, b) => (tr, adj) => a(tr, adj) || b(tr, adj)
    });
  }
});
const historyField_ = /* @__PURE__ */ StateField.define({
  create() {
    return HistoryState.empty;
  },
  update(state, tr) {
    let config2 = tr.state.facet(historyConfig);
    let fromHist = tr.annotation(fromHistory);
    if (fromHist) {
      let item = HistEvent.fromTransaction(tr, fromHist.selection), from = fromHist.side;
      let other = from == 0 ? state.undone : state.done;
      if (item)
        other = updateBranch(other, other.length, config2.minDepth, item);
      else
        other = addSelection(other, tr.startState.selection);
      return new HistoryState(from == 0 ? fromHist.rest : other, from == 0 ? other : fromHist.rest);
    }
    let isolate = tr.annotation(isolateHistory);
    if (isolate == "full" || isolate == "before")
      state = state.isolate();
    if (tr.annotation(Transaction.addToHistory) === false)
      return !tr.changes.empty ? state.addMapping(tr.changes.desc) : state;
    let event = HistEvent.fromTransaction(tr);
    let time = tr.annotation(Transaction.time), userEvent = tr.annotation(Transaction.userEvent);
    if (event)
      state = state.addChanges(event, time, userEvent, config2, tr);
    else if (tr.selection)
      state = state.addSelection(tr.startState.selection, time, userEvent, config2.newGroupDelay);
    if (isolate == "full" || isolate == "after")
      state = state.isolate();
    return state;
  },
  toJSON(value) {
    return { done: value.done.map((e) => e.toJSON()), undone: value.undone.map((e) => e.toJSON()) };
  },
  fromJSON(json) {
    return new HistoryState(json.done.map(HistEvent.fromJSON), json.undone.map(HistEvent.fromJSON));
  }
});
function history(config2 = {}) {
  return [
    historyField_,
    historyConfig.of(config2),
    EditorView.domEventHandlers({
      beforeinput(e, view) {
        let command2 = e.inputType == "historyUndo" ? undo : e.inputType == "historyRedo" ? redo : null;
        if (!command2)
          return false;
        e.preventDefault();
        return command2(view);
      }
    })
  ];
}
function cmd(side, selection) {
  return function({ state, dispatch }) {
    if (!selection && state.readOnly)
      return false;
    let historyState = state.field(historyField_, false);
    if (!historyState)
      return false;
    let tr = historyState.pop(side, state, selection);
    if (!tr)
      return false;
    dispatch(tr);
    return true;
  };
}
const undo = /* @__PURE__ */ cmd(0, false);
const redo = /* @__PURE__ */ cmd(1, false);
const undoSelection = /* @__PURE__ */ cmd(0, true);
const redoSelection = /* @__PURE__ */ cmd(1, true);
class HistEvent {
  constructor(changes, effects, mapped, startSelection, selectionsAfter) {
    this.changes = changes;
    this.effects = effects;
    this.mapped = mapped;
    this.startSelection = startSelection;
    this.selectionsAfter = selectionsAfter;
  }
  setSelAfter(after) {
    return new HistEvent(this.changes, this.effects, this.mapped, this.startSelection, after);
  }
  toJSON() {
    var _a2, _b, _c;
    return {
      changes: (_a2 = this.changes) === null || _a2 === void 0 ? void 0 : _a2.toJSON(),
      mapped: (_b = this.mapped) === null || _b === void 0 ? void 0 : _b.toJSON(),
      startSelection: (_c = this.startSelection) === null || _c === void 0 ? void 0 : _c.toJSON(),
      selectionsAfter: this.selectionsAfter.map((s) => s.toJSON())
    };
  }
  static fromJSON(json) {
    return new HistEvent(json.changes && ChangeSet.fromJSON(json.changes), [], json.mapped && ChangeDesc.fromJSON(json.mapped), json.startSelection && EditorSelection.fromJSON(json.startSelection), json.selectionsAfter.map(EditorSelection.fromJSON));
  }
  // This does not check `addToHistory` and such, it assumes the
  // transaction needs to be converted to an item. Returns null when
  // there are no changes or effects in the transaction.
  static fromTransaction(tr, selection) {
    let effects = none$1;
    for (let invert of tr.startState.facet(invertedEffects)) {
      let result = invert(tr);
      if (result.length)
        effects = effects.concat(result);
    }
    if (!effects.length && tr.changes.empty)
      return null;
    return new HistEvent(tr.changes.invert(tr.startState.doc), effects, void 0, selection || tr.startState.selection, none$1);
  }
  static selection(selections) {
    return new HistEvent(void 0, none$1, void 0, void 0, selections);
  }
}
function updateBranch(branch, to, maxLen, newEvent) {
  let start = to + 1 > maxLen + 20 ? to - maxLen - 1 : 0;
  let newBranch = branch.slice(start, to);
  newBranch.push(newEvent);
  return newBranch;
}
function isAdjacent(a, b) {
  let ranges = [], isAdjacent2 = false;
  a.iterChangedRanges((f, t2) => ranges.push(f, t2));
  b.iterChangedRanges((_f, _t, f, t2) => {
    for (let i = 0; i < ranges.length; ) {
      let from = ranges[i++], to = ranges[i++];
      if (t2 >= from && f <= to)
        isAdjacent2 = true;
    }
  });
  return isAdjacent2;
}
function eqSelectionShape(a, b) {
  return a.ranges.length == b.ranges.length && a.ranges.filter((r, i) => r.empty != b.ranges[i].empty).length === 0;
}
function conc(a, b) {
  return !a.length ? b : !b.length ? a : a.concat(b);
}
const none$1 = [];
const MaxSelectionsPerEvent = 200;
function addSelection(branch, selection) {
  if (!branch.length) {
    return [HistEvent.selection([selection])];
  } else {
    let lastEvent = branch[branch.length - 1];
    let sels = lastEvent.selectionsAfter.slice(Math.max(0, lastEvent.selectionsAfter.length - MaxSelectionsPerEvent));
    if (sels.length && sels[sels.length - 1].eq(selection))
      return branch;
    sels.push(selection);
    return updateBranch(branch, branch.length - 1, 1e9, lastEvent.setSelAfter(sels));
  }
}
function popSelection(branch) {
  let last = branch[branch.length - 1];
  let newBranch = branch.slice();
  newBranch[branch.length - 1] = last.setSelAfter(last.selectionsAfter.slice(0, last.selectionsAfter.length - 1));
  return newBranch;
}
function addMappingToBranch(branch, mapping) {
  if (!branch.length)
    return branch;
  let length = branch.length, selections = none$1;
  while (length) {
    let event = mapEvent(branch[length - 1], mapping, selections);
    if (event.changes && !event.changes.empty || event.effects.length) {
      let result = branch.slice(0, length);
      result[length - 1] = event;
      return result;
    } else {
      mapping = event.mapped;
      length--;
      selections = event.selectionsAfter;
    }
  }
  return selections.length ? [HistEvent.selection(selections)] : none$1;
}
function mapEvent(event, mapping, extraSelections) {
  let selections = conc(event.selectionsAfter.length ? event.selectionsAfter.map((s) => s.map(mapping)) : none$1, extraSelections);
  if (!event.changes)
    return HistEvent.selection(selections);
  let mappedChanges = event.changes.map(mapping), before = mapping.mapDesc(event.changes, true);
  let fullMapping = event.mapped ? event.mapped.composeDesc(before) : before;
  return new HistEvent(mappedChanges, StateEffect.mapEffects(event.effects, mapping), fullMapping, event.startSelection.map(before), selections);
}
const joinableUserEvent = /^(input\.type|delete)($|\.)/;
class HistoryState {
  constructor(done, undone, prevTime = 0, prevUserEvent = void 0) {
    this.done = done;
    this.undone = undone;
    this.prevTime = prevTime;
    this.prevUserEvent = prevUserEvent;
  }
  isolate() {
    return this.prevTime ? new HistoryState(this.done, this.undone) : this;
  }
  addChanges(event, time, userEvent, config2, tr) {
    let done = this.done, lastEvent = done[done.length - 1];
    if (lastEvent && lastEvent.changes && !lastEvent.changes.empty && event.changes && (!userEvent || joinableUserEvent.test(userEvent)) && (!lastEvent.selectionsAfter.length && time - this.prevTime < config2.newGroupDelay && config2.joinToEvent(tr, isAdjacent(lastEvent.changes, event.changes)) || // For compose (but not compose.start) events, always join with previous event
    userEvent == "input.type.compose")) {
      done = updateBranch(done, done.length - 1, config2.minDepth, new HistEvent(event.changes.compose(lastEvent.changes), conc(StateEffect.mapEffects(event.effects, lastEvent.changes), lastEvent.effects), lastEvent.mapped, lastEvent.startSelection, none$1));
    } else {
      done = updateBranch(done, done.length, config2.minDepth, event);
    }
    return new HistoryState(done, none$1, time, userEvent);
  }
  addSelection(selection, time, userEvent, newGroupDelay) {
    let last = this.done.length ? this.done[this.done.length - 1].selectionsAfter : none$1;
    if (last.length > 0 && time - this.prevTime < newGroupDelay && userEvent == this.prevUserEvent && userEvent && /^select($|\.)/.test(userEvent) && eqSelectionShape(last[last.length - 1], selection))
      return this;
    return new HistoryState(addSelection(this.done, selection), this.undone, time, userEvent);
  }
  addMapping(mapping) {
    return new HistoryState(addMappingToBranch(this.done, mapping), addMappingToBranch(this.undone, mapping), this.prevTime, this.prevUserEvent);
  }
  pop(side, state, onlySelection) {
    let branch = side == 0 ? this.done : this.undone;
    if (branch.length == 0)
      return null;
    let event = branch[branch.length - 1], selection = event.selectionsAfter[0] || state.selection;
    if (onlySelection && event.selectionsAfter.length) {
      return state.update({
        selection: event.selectionsAfter[event.selectionsAfter.length - 1],
        annotations: fromHistory.of({ side, rest: popSelection(branch), selection }),
        userEvent: side == 0 ? "select.undo" : "select.redo",
        scrollIntoView: true
      });
    } else if (!event.changes) {
      return null;
    } else {
      let rest = branch.length == 1 ? none$1 : branch.slice(0, branch.length - 1);
      if (event.mapped)
        rest = addMappingToBranch(rest, event.mapped);
      return state.update({
        changes: event.changes,
        selection: event.startSelection,
        effects: event.effects,
        annotations: fromHistory.of({ side, rest, selection }),
        filter: false,
        userEvent: side == 0 ? "undo" : "redo",
        scrollIntoView: true
      });
    }
  }
}
HistoryState.empty = /* @__PURE__ */ new HistoryState(none$1, none$1);
const historyKeymap = [
  { key: "Mod-z", run: undo, preventDefault: true },
  { key: "Mod-y", mac: "Mod-Shift-z", run: redo, preventDefault: true },
  { linux: "Ctrl-Shift-z", run: redo, preventDefault: true },
  { key: "Mod-u", run: undoSelection, preventDefault: true },
  { key: "Alt-u", mac: "Mod-Shift-u", run: redoSelection, preventDefault: true }
];
function updateSel(sel, by) {
  return EditorSelection.create(sel.ranges.map(by), sel.mainIndex);
}
function setSel(state, selection) {
  return state.update({ selection, scrollIntoView: true, userEvent: "select" });
}
function moveSel({ state, dispatch }, how) {
  let selection = updateSel(state.selection, how);
  if (selection.eq(state.selection, true))
    return false;
  dispatch(setSel(state, selection));
  return true;
}
function rangeEnd(range, forward) {
  return EditorSelection.cursor(forward ? range.to : range.from);
}
function cursorByChar(view, forward) {
  return moveSel(view, (range) => range.empty ? view.moveByChar(range, forward) : rangeEnd(range, forward));
}
function ltrAtCursor(view) {
  return view.textDirectionAt(view.state.selection.main.head) == Direction.LTR;
}
const cursorCharLeft = (view) => cursorByChar(view, !ltrAtCursor(view));
const cursorCharRight = (view) => cursorByChar(view, ltrAtCursor(view));
function cursorByGroup(view, forward) {
  return moveSel(view, (range) => range.empty ? view.moveByGroup(range, forward) : rangeEnd(range, forward));
}
const cursorGroupLeft = (view) => cursorByGroup(view, !ltrAtCursor(view));
const cursorGroupRight = (view) => cursorByGroup(view, ltrAtCursor(view));
function interestingNode(state, node, bracketProp) {
  if (node.type.prop(bracketProp))
    return true;
  let len = node.to - node.from;
  return len && (len > 2 || /[^\s,.;:]/.test(state.sliceDoc(node.from, node.to))) || node.firstChild;
}
function moveBySyntax(state, start, forward) {
  let pos = syntaxTree(state).resolveInner(start.head);
  let bracketProp = forward ? NodeProp.closedBy : NodeProp.openedBy;
  for (let at = start.head; ; ) {
    let next = forward ? pos.childAfter(at) : pos.childBefore(at);
    if (!next)
      break;
    if (interestingNode(state, next, bracketProp))
      pos = next;
    else
      at = forward ? next.to : next.from;
  }
  let bracket2 = pos.type.prop(bracketProp), match, newPos;
  if (bracket2 && (match = forward ? matchBrackets(state, pos.from, 1) : matchBrackets(state, pos.to, -1)) && match.matched)
    newPos = forward ? match.end.to : match.end.from;
  else
    newPos = forward ? pos.to : pos.from;
  return EditorSelection.cursor(newPos, forward ? -1 : 1);
}
const cursorSyntaxLeft = (view) => moveSel(view, (range) => moveBySyntax(view.state, range, !ltrAtCursor(view)));
const cursorSyntaxRight = (view) => moveSel(view, (range) => moveBySyntax(view.state, range, ltrAtCursor(view)));
function cursorByLine(view, forward) {
  return moveSel(view, (range) => {
    if (!range.empty)
      return rangeEnd(range, forward);
    let moved = view.moveVertically(range, forward);
    return moved.head != range.head ? moved : view.moveToLineBoundary(range, forward);
  });
}
const cursorLineUp = (view) => cursorByLine(view, false);
const cursorLineDown = (view) => cursorByLine(view, true);
function pageInfo(view) {
  let selfScroll = view.scrollDOM.clientHeight < view.scrollDOM.scrollHeight - 2;
  let marginTop = 0, marginBottom = 0, height;
  if (selfScroll) {
    for (let source of view.state.facet(EditorView.scrollMargins)) {
      let margins = source(view);
      if (margins === null || margins === void 0 ? void 0 : margins.top)
        marginTop = Math.max(margins === null || margins === void 0 ? void 0 : margins.top, marginTop);
      if (margins === null || margins === void 0 ? void 0 : margins.bottom)
        marginBottom = Math.max(margins === null || margins === void 0 ? void 0 : margins.bottom, marginBottom);
    }
    height = view.scrollDOM.clientHeight - marginTop - marginBottom;
  } else {
    height = (view.dom.ownerDocument.defaultView || window).innerHeight;
  }
  return {
    marginTop,
    marginBottom,
    selfScroll,
    height: Math.max(view.defaultLineHeight, height - 5)
  };
}
function cursorByPage(view, forward) {
  let page = pageInfo(view);
  let { state } = view, selection = updateSel(state.selection, (range) => {
    return range.empty ? view.moveVertically(range, forward, page.height) : rangeEnd(range, forward);
  });
  if (selection.eq(state.selection))
    return false;
  let effect;
  if (page.selfScroll) {
    let startPos = view.coordsAtPos(state.selection.main.head);
    let scrollRect = view.scrollDOM.getBoundingClientRect();
    let scrollTop = scrollRect.top + page.marginTop, scrollBottom = scrollRect.bottom - page.marginBottom;
    if (startPos && startPos.top > scrollTop && startPos.bottom < scrollBottom)
      effect = EditorView.scrollIntoView(selection.main.head, { y: "start", yMargin: startPos.top - scrollTop });
  }
  view.dispatch(setSel(state, selection), { effects: effect });
  return true;
}
const cursorPageUp = (view) => cursorByPage(view, false);
const cursorPageDown = (view) => cursorByPage(view, true);
function moveByLineBoundary(view, start, forward) {
  let line = view.lineBlockAt(start.head), moved = view.moveToLineBoundary(start, forward);
  if (moved.head == start.head && moved.head != (forward ? line.to : line.from))
    moved = view.moveToLineBoundary(start, forward, false);
  if (!forward && moved.head == line.from && line.length) {
    let space = /^\s*/.exec(view.state.sliceDoc(line.from, Math.min(line.from + 100, line.to)))[0].length;
    if (space && start.head != line.from + space)
      moved = EditorSelection.cursor(line.from + space);
  }
  return moved;
}
const cursorLineBoundaryForward = (view) => moveSel(view, (range) => moveByLineBoundary(view, range, true));
const cursorLineBoundaryBackward = (view) => moveSel(view, (range) => moveByLineBoundary(view, range, false));
const cursorLineBoundaryLeft = (view) => moveSel(view, (range) => moveByLineBoundary(view, range, !ltrAtCursor(view)));
const cursorLineBoundaryRight = (view) => moveSel(view, (range) => moveByLineBoundary(view, range, ltrAtCursor(view)));
const cursorLineStart = (view) => moveSel(view, (range) => EditorSelection.cursor(view.lineBlockAt(range.head).from, 1));
const cursorLineEnd = (view) => moveSel(view, (range) => EditorSelection.cursor(view.lineBlockAt(range.head).to, -1));
function toMatchingBracket(state, dispatch, extend) {
  let found = false, selection = updateSel(state.selection, (range) => {
    let matching = matchBrackets(state, range.head, -1) || matchBrackets(state, range.head, 1) || range.head > 0 && matchBrackets(state, range.head - 1, 1) || range.head < state.doc.length && matchBrackets(state, range.head + 1, -1);
    if (!matching || !matching.end)
      return range;
    found = true;
    let head = matching.start.from == range.head ? matching.end.to : matching.end.from;
    return EditorSelection.cursor(head);
  });
  if (!found)
    return false;
  dispatch(setSel(state, selection));
  return true;
}
const cursorMatchingBracket = ({ state, dispatch }) => toMatchingBracket(state, dispatch);
function extendSel(target2, how) {
  let selection = updateSel(target2.state.selection, (range) => {
    let head = how(range);
    return EditorSelection.range(range.anchor, head.head, head.goalColumn, head.bidiLevel || void 0);
  });
  if (selection.eq(target2.state.selection))
    return false;
  target2.dispatch(setSel(target2.state, selection));
  return true;
}
function selectByChar(view, forward) {
  return extendSel(view, (range) => view.moveByChar(range, forward));
}
const selectCharLeft = (view) => selectByChar(view, !ltrAtCursor(view));
const selectCharRight = (view) => selectByChar(view, ltrAtCursor(view));
function selectByGroup(view, forward) {
  return extendSel(view, (range) => view.moveByGroup(range, forward));
}
const selectGroupLeft = (view) => selectByGroup(view, !ltrAtCursor(view));
const selectGroupRight = (view) => selectByGroup(view, ltrAtCursor(view));
const selectSyntaxLeft = (view) => extendSel(view, (range) => moveBySyntax(view.state, range, !ltrAtCursor(view)));
const selectSyntaxRight = (view) => extendSel(view, (range) => moveBySyntax(view.state, range, ltrAtCursor(view)));
function selectByLine(view, forward) {
  return extendSel(view, (range) => view.moveVertically(range, forward));
}
const selectLineUp = (view) => selectByLine(view, false);
const selectLineDown = (view) => selectByLine(view, true);
function selectByPage(view, forward) {
  return extendSel(view, (range) => view.moveVertically(range, forward, pageInfo(view).height));
}
const selectPageUp = (view) => selectByPage(view, false);
const selectPageDown = (view) => selectByPage(view, true);
const selectLineBoundaryForward = (view) => extendSel(view, (range) => moveByLineBoundary(view, range, true));
const selectLineBoundaryBackward = (view) => extendSel(view, (range) => moveByLineBoundary(view, range, false));
const selectLineBoundaryLeft = (view) => extendSel(view, (range) => moveByLineBoundary(view, range, !ltrAtCursor(view)));
const selectLineBoundaryRight = (view) => extendSel(view, (range) => moveByLineBoundary(view, range, ltrAtCursor(view)));
const selectLineStart = (view) => extendSel(view, (range) => EditorSelection.cursor(view.lineBlockAt(range.head).from));
const selectLineEnd = (view) => extendSel(view, (range) => EditorSelection.cursor(view.lineBlockAt(range.head).to));
const cursorDocStart = ({ state, dispatch }) => {
  dispatch(setSel(state, { anchor: 0 }));
  return true;
};
const cursorDocEnd = ({ state, dispatch }) => {
  dispatch(setSel(state, { anchor: state.doc.length }));
  return true;
};
const selectDocStart = ({ state, dispatch }) => {
  dispatch(setSel(state, { anchor: state.selection.main.anchor, head: 0 }));
  return true;
};
const selectDocEnd = ({ state, dispatch }) => {
  dispatch(setSel(state, { anchor: state.selection.main.anchor, head: state.doc.length }));
  return true;
};
const selectAll = ({ state, dispatch }) => {
  dispatch(state.update({ selection: { anchor: 0, head: state.doc.length }, userEvent: "select" }));
  return true;
};
const selectLine = ({ state, dispatch }) => {
  let ranges = selectedLineBlocks(state).map(({ from, to }) => EditorSelection.range(from, Math.min(to + 1, state.doc.length)));
  dispatch(state.update({ selection: EditorSelection.create(ranges), userEvent: "select" }));
  return true;
};
const selectParentSyntax = ({ state, dispatch }) => {
  let selection = updateSel(state.selection, (range) => {
    let tree = syntaxTree(state), stack = tree.resolveStack(range.from, 1);
    if (range.empty) {
      let stackBefore = tree.resolveStack(range.from, -1);
      if (stackBefore.node.from >= stack.node.from && stackBefore.node.to <= stack.node.to)
        stack = stackBefore;
    }
    for (let cur2 = stack; cur2; cur2 = cur2.next) {
      let { node } = cur2;
      if ((node.from < range.from && node.to >= range.to || node.to > range.to && node.from <= range.from) && cur2.next)
        return EditorSelection.range(node.to, node.from);
    }
    return range;
  });
  if (selection.eq(state.selection))
    return false;
  dispatch(setSel(state, selection));
  return true;
};
function addCursorVertically(view, forward) {
  let { state } = view, sel = state.selection, ranges = state.selection.ranges.slice();
  for (let range of state.selection.ranges) {
    let line = state.doc.lineAt(range.head);
    if (forward ? line.to < view.state.doc.length : line.from > 0)
      for (let cur2 = range; ; ) {
        let next = view.moveVertically(cur2, forward);
        if (next.head < line.from || next.head > line.to) {
          if (!ranges.some((r) => r.head == next.head))
            ranges.push(next);
          break;
        } else if (next.head == cur2.head) {
          break;
        } else {
          cur2 = next;
        }
      }
  }
  if (ranges.length == sel.ranges.length)
    return false;
  view.dispatch(setSel(state, EditorSelection.create(ranges, ranges.length - 1)));
  return true;
}
const addCursorAbove = (view) => addCursorVertically(view, false);
const addCursorBelow = (view) => addCursorVertically(view, true);
const simplifySelection = ({ state, dispatch }) => {
  let cur2 = state.selection, selection = null;
  if (cur2.ranges.length > 1)
    selection = EditorSelection.create([cur2.main]);
  else if (!cur2.main.empty)
    selection = EditorSelection.create([EditorSelection.cursor(cur2.main.head)]);
  if (!selection)
    return false;
  dispatch(setSel(state, selection));
  return true;
};
function deleteBy(target2, by) {
  if (target2.state.readOnly)
    return false;
  let event = "delete.selection", { state } = target2;
  let changes = state.changeByRange((range) => {
    let { from, to } = range;
    if (from == to) {
      let towards = by(range);
      if (towards < from) {
        event = "delete.backward";
        towards = skipAtomic(target2, towards, false);
      } else if (towards > from) {
        event = "delete.forward";
        towards = skipAtomic(target2, towards, true);
      }
      from = Math.min(from, towards);
      to = Math.max(to, towards);
    } else {
      from = skipAtomic(target2, from, false);
      to = skipAtomic(target2, to, true);
    }
    return from == to ? { range } : { changes: { from, to }, range: EditorSelection.cursor(from, from < range.head ? -1 : 1) };
  });
  if (changes.changes.empty)
    return false;
  target2.dispatch(state.update(changes, {
    scrollIntoView: true,
    userEvent: event,
    effects: event == "delete.selection" ? EditorView.announce.of(state.phrase("Selection deleted")) : void 0
  }));
  return true;
}
function skipAtomic(target2, pos, forward) {
  if (target2 instanceof EditorView)
    for (let ranges of target2.state.facet(EditorView.atomicRanges).map((f) => f(target2)))
      ranges.between(pos, pos, (from, to) => {
        if (from < pos && to > pos)
          pos = forward ? to : from;
      });
  return pos;
}
const deleteByChar = (target2, forward, byIndentUnit) => deleteBy(target2, (range) => {
  let pos = range.from, { state } = target2, line = state.doc.lineAt(pos), before, targetPos;
  if (byIndentUnit && !forward && pos > line.from && pos < line.from + 200 && !/[^ \t]/.test(before = line.text.slice(0, pos - line.from))) {
    if (before[before.length - 1] == "	")
      return pos - 1;
    let col = countColumn(before, state.tabSize), drop = col % getIndentUnit(state) || getIndentUnit(state);
    for (let i = 0; i < drop && before[before.length - 1 - i] == " "; i++)
      pos--;
    targetPos = pos;
  } else {
    targetPos = findClusterBreak(line.text, pos - line.from, forward, forward) + line.from;
    if (targetPos == pos && line.number != (forward ? state.doc.lines : 1))
      targetPos += forward ? 1 : -1;
    else if (!forward && /[\ufe00-\ufe0f]/.test(line.text.slice(targetPos - line.from, pos - line.from)))
      targetPos = findClusterBreak(line.text, targetPos - line.from, false, false) + line.from;
  }
  return targetPos;
});
const deleteCharBackward = (view) => deleteByChar(view, false, true);
const deleteCharForward = (view) => deleteByChar(view, true, false);
const deleteByGroup = (target2, forward) => deleteBy(target2, (range) => {
  let pos = range.head, { state } = target2, line = state.doc.lineAt(pos);
  let categorize = state.charCategorizer(pos);
  for (let cat = null; ; ) {
    if (pos == (forward ? line.to : line.from)) {
      if (pos == range.head && line.number != (forward ? state.doc.lines : 1))
        pos += forward ? 1 : -1;
      break;
    }
    let next = findClusterBreak(line.text, pos - line.from, forward) + line.from;
    let nextChar2 = line.text.slice(Math.min(pos, next) - line.from, Math.max(pos, next) - line.from);
    let nextCat = categorize(nextChar2);
    if (cat != null && nextCat != cat)
      break;
    if (nextChar2 != " " || pos != range.head)
      cat = nextCat;
    pos = next;
  }
  return pos;
});
const deleteGroupBackward = (target2) => deleteByGroup(target2, false);
const deleteGroupForward = (target2) => deleteByGroup(target2, true);
const deleteToLineEnd = (view) => deleteBy(view, (range) => {
  let lineEnd = view.lineBlockAt(range.head).to;
  return range.head < lineEnd ? lineEnd : Math.min(view.state.doc.length, range.head + 1);
});
const deleteLineBoundaryBackward = (view) => deleteBy(view, (range) => {
  let lineStart = view.moveToLineBoundary(range, false).head;
  return range.head > lineStart ? lineStart : Math.max(0, range.head - 1);
});
const deleteLineBoundaryForward = (view) => deleteBy(view, (range) => {
  let lineStart = view.moveToLineBoundary(range, true).head;
  return range.head < lineStart ? lineStart : Math.min(view.state.doc.length, range.head + 1);
});
const splitLine = ({ state, dispatch }) => {
  if (state.readOnly)
    return false;
  let changes = state.changeByRange((range) => {
    return {
      changes: { from: range.from, to: range.to, insert: Text$1.of(["", ""]) },
      range: EditorSelection.cursor(range.from)
    };
  });
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
  return true;
};
const transposeChars = ({ state, dispatch }) => {
  if (state.readOnly)
    return false;
  let changes = state.changeByRange((range) => {
    if (!range.empty || range.from == 0 || range.from == state.doc.length)
      return { range };
    let pos = range.from, line = state.doc.lineAt(pos);
    let from = pos == line.from ? pos - 1 : findClusterBreak(line.text, pos - line.from, false) + line.from;
    let to = pos == line.to ? pos + 1 : findClusterBreak(line.text, pos - line.from, true) + line.from;
    return {
      changes: { from, to, insert: state.doc.slice(pos, to).append(state.doc.slice(from, pos)) },
      range: EditorSelection.cursor(to)
    };
  });
  if (changes.changes.empty)
    return false;
  dispatch(state.update(changes, { scrollIntoView: true, userEvent: "move.character" }));
  return true;
};
function selectedLineBlocks(state) {
  let blocks = [], upto = -1;
  for (let range of state.selection.ranges) {
    let startLine = state.doc.lineAt(range.from), endLine = state.doc.lineAt(range.to);
    if (!range.empty && range.to == endLine.from)
      endLine = state.doc.lineAt(range.to - 1);
    if (upto >= startLine.number) {
      let prev = blocks[blocks.length - 1];
      prev.to = endLine.to;
      prev.ranges.push(range);
    } else {
      blocks.push({ from: startLine.from, to: endLine.to, ranges: [range] });
    }
    upto = endLine.number + 1;
  }
  return blocks;
}
function moveLine(state, dispatch, forward) {
  if (state.readOnly)
    return false;
  let changes = [], ranges = [];
  for (let block of selectedLineBlocks(state)) {
    if (forward ? block.to == state.doc.length : block.from == 0)
      continue;
    let nextLine = state.doc.lineAt(forward ? block.to + 1 : block.from - 1);
    let size = nextLine.length + 1;
    if (forward) {
      changes.push({ from: block.to, to: nextLine.to }, { from: block.from, insert: nextLine.text + state.lineBreak });
      for (let r of block.ranges)
        ranges.push(EditorSelection.range(Math.min(state.doc.length, r.anchor + size), Math.min(state.doc.length, r.head + size)));
    } else {
      changes.push({ from: nextLine.from, to: block.from }, { from: block.to, insert: state.lineBreak + nextLine.text });
      for (let r of block.ranges)
        ranges.push(EditorSelection.range(r.anchor - size, r.head - size));
    }
  }
  if (!changes.length)
    return false;
  dispatch(state.update({
    changes,
    scrollIntoView: true,
    selection: EditorSelection.create(ranges, state.selection.mainIndex),
    userEvent: "move.line"
  }));
  return true;
}
const moveLineUp = ({ state, dispatch }) => moveLine(state, dispatch, false);
const moveLineDown = ({ state, dispatch }) => moveLine(state, dispatch, true);
function copyLine(state, dispatch, forward) {
  if (state.readOnly)
    return false;
  let changes = [];
  for (let block of selectedLineBlocks(state)) {
    if (forward)
      changes.push({ from: block.from, insert: state.doc.slice(block.from, block.to) + state.lineBreak });
    else
      changes.push({ from: block.to, insert: state.lineBreak + state.doc.slice(block.from, block.to) });
  }
  dispatch(state.update({ changes, scrollIntoView: true, userEvent: "input.copyline" }));
  return true;
}
const copyLineUp = ({ state, dispatch }) => copyLine(state, dispatch, false);
const copyLineDown = ({ state, dispatch }) => copyLine(state, dispatch, true);
const deleteLine = (view) => {
  if (view.state.readOnly)
    return false;
  let { state } = view, changes = state.changes(selectedLineBlocks(state).map(({ from, to }) => {
    if (from > 0)
      from--;
    else if (to < state.doc.length)
      to++;
    return { from, to };
  }));
  let selection = updateSel(state.selection, (range) => {
    let dist = void 0;
    if (view.lineWrapping) {
      let block = view.lineBlockAt(range.head), pos = view.coordsAtPos(range.head, range.assoc || 1);
      if (pos)
        dist = block.bottom + view.documentTop - pos.bottom + view.defaultLineHeight / 2;
    }
    return view.moveVertically(range, true, dist);
  }).map(changes);
  view.dispatch({ changes, selection, scrollIntoView: true, userEvent: "delete.line" });
  return true;
};
function isBetweenBrackets(state, pos) {
  if (/\(\)|\[\]|\{\}/.test(state.sliceDoc(pos - 1, pos + 1)))
    return { from: pos, to: pos };
  let context = syntaxTree(state).resolveInner(pos);
  let before = context.childBefore(pos), after = context.childAfter(pos), closedBy;
  if (before && after && before.to <= pos && after.from >= pos && (closedBy = before.type.prop(NodeProp.closedBy)) && closedBy.indexOf(after.name) > -1 && state.doc.lineAt(before.to).from == state.doc.lineAt(after.from).from && !/\S/.test(state.sliceDoc(before.to, after.from)))
    return { from: before.to, to: after.from };
  return null;
}
const insertNewlineAndIndent = /* @__PURE__ */ newlineAndIndent(false);
const insertBlankLine = /* @__PURE__ */ newlineAndIndent(true);
function newlineAndIndent(atEof) {
  return ({ state, dispatch }) => {
    if (state.readOnly)
      return false;
    let changes = state.changeByRange((range) => {
      let { from, to } = range, line = state.doc.lineAt(from);
      let explode = !atEof && from == to && isBetweenBrackets(state, from);
      if (atEof)
        from = to = (to <= line.to ? line : state.doc.lineAt(to)).to;
      let cx = new IndentContext(state, { simulateBreak: from, simulateDoubleBreak: !!explode });
      let indent = getIndentation(cx, from);
      if (indent == null)
        indent = countColumn(/^\s*/.exec(state.doc.lineAt(from).text)[0], state.tabSize);
      while (to < line.to && /\s/.test(line.text[to - line.from]))
        to++;
      if (explode)
        ({ from, to } = explode);
      else if (from > line.from && from < line.from + 100 && !/\S/.test(line.text.slice(0, from)))
        from = line.from;
      let insert = ["", indentString(state, indent)];
      if (explode)
        insert.push(indentString(state, cx.lineIndent(line.from, -1)));
      return {
        changes: { from, to, insert: Text$1.of(insert) },
        range: EditorSelection.cursor(from + 1 + insert[1].length)
      };
    });
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "input" }));
    return true;
  };
}
function changeBySelectedLine(state, f) {
  let atLine = -1;
  return state.changeByRange((range) => {
    let changes = [];
    for (let pos = range.from; pos <= range.to; ) {
      let line = state.doc.lineAt(pos);
      if (line.number > atLine && (range.empty || range.to > line.from)) {
        f(line, changes, range);
        atLine = line.number;
      }
      pos = line.to + 1;
    }
    let changeSet = state.changes(changes);
    return {
      changes,
      range: EditorSelection.range(changeSet.mapPos(range.anchor, 1), changeSet.mapPos(range.head, 1))
    };
  });
}
const indentSelection = ({ state, dispatch }) => {
  if (state.readOnly)
    return false;
  let updated = /* @__PURE__ */ Object.create(null);
  let context = new IndentContext(state, { overrideIndentation: (start) => {
    let found = updated[start];
    return found == null ? -1 : found;
  } });
  let changes = changeBySelectedLine(state, (line, changes2, range) => {
    let indent = getIndentation(context, line.from);
    if (indent == null)
      return;
    if (!/\S/.test(line.text))
      indent = 0;
    let cur2 = /^\s*/.exec(line.text)[0];
    let norm = indentString(state, indent);
    if (cur2 != norm || range.from < line.from + cur2.length) {
      updated[line.from] = indent;
      changes2.push({ from: line.from, to: line.from + cur2.length, insert: norm });
    }
  });
  if (!changes.changes.empty)
    dispatch(state.update(changes, { userEvent: "indent" }));
  return true;
};
const indentMore = ({ state, dispatch }) => {
  if (state.readOnly)
    return false;
  dispatch(state.update(changeBySelectedLine(state, (line, changes) => {
    changes.push({ from: line.from, insert: state.facet(indentUnit) });
  }), { userEvent: "input.indent" }));
  return true;
};
const indentLess = ({ state, dispatch }) => {
  if (state.readOnly)
    return false;
  dispatch(state.update(changeBySelectedLine(state, (line, changes) => {
    let space = /^\s*/.exec(line.text)[0];
    if (!space)
      return;
    let col = countColumn(space, state.tabSize), keep = 0;
    let insert = indentString(state, Math.max(0, col - getIndentUnit(state)));
    while (keep < space.length && keep < insert.length && space.charCodeAt(keep) == insert.charCodeAt(keep))
      keep++;
    changes.push({ from: line.from + keep, to: line.from + space.length, insert: insert.slice(keep) });
  }), { userEvent: "delete.dedent" }));
  return true;
};
const toggleTabFocusMode = (view) => {
  view.setTabFocusMode();
  return true;
};
const emacsStyleKeymap = [
  { key: "Ctrl-b", run: cursorCharLeft, shift: selectCharLeft, preventDefault: true },
  { key: "Ctrl-f", run: cursorCharRight, shift: selectCharRight },
  { key: "Ctrl-p", run: cursorLineUp, shift: selectLineUp },
  { key: "Ctrl-n", run: cursorLineDown, shift: selectLineDown },
  { key: "Ctrl-a", run: cursorLineStart, shift: selectLineStart },
  { key: "Ctrl-e", run: cursorLineEnd, shift: selectLineEnd },
  { key: "Ctrl-d", run: deleteCharForward },
  { key: "Ctrl-h", run: deleteCharBackward },
  { key: "Ctrl-k", run: deleteToLineEnd },
  { key: "Ctrl-Alt-h", run: deleteGroupBackward },
  { key: "Ctrl-o", run: splitLine },
  { key: "Ctrl-t", run: transposeChars },
  { key: "Ctrl-v", run: cursorPageDown }
];
const standardKeymap = /* @__PURE__ */ [
  { key: "ArrowLeft", run: cursorCharLeft, shift: selectCharLeft, preventDefault: true },
  { key: "Mod-ArrowLeft", mac: "Alt-ArrowLeft", run: cursorGroupLeft, shift: selectGroupLeft, preventDefault: true },
  { mac: "Cmd-ArrowLeft", run: cursorLineBoundaryLeft, shift: selectLineBoundaryLeft, preventDefault: true },
  { key: "ArrowRight", run: cursorCharRight, shift: selectCharRight, preventDefault: true },
  { key: "Mod-ArrowRight", mac: "Alt-ArrowRight", run: cursorGroupRight, shift: selectGroupRight, preventDefault: true },
  { mac: "Cmd-ArrowRight", run: cursorLineBoundaryRight, shift: selectLineBoundaryRight, preventDefault: true },
  { key: "ArrowUp", run: cursorLineUp, shift: selectLineUp, preventDefault: true },
  { mac: "Cmd-ArrowUp", run: cursorDocStart, shift: selectDocStart },
  { mac: "Ctrl-ArrowUp", run: cursorPageUp, shift: selectPageUp },
  { key: "ArrowDown", run: cursorLineDown, shift: selectLineDown, preventDefault: true },
  { mac: "Cmd-ArrowDown", run: cursorDocEnd, shift: selectDocEnd },
  { mac: "Ctrl-ArrowDown", run: cursorPageDown, shift: selectPageDown },
  { key: "PageUp", run: cursorPageUp, shift: selectPageUp },
  { key: "PageDown", run: cursorPageDown, shift: selectPageDown },
  { key: "Home", run: cursorLineBoundaryBackward, shift: selectLineBoundaryBackward, preventDefault: true },
  { key: "Mod-Home", run: cursorDocStart, shift: selectDocStart },
  { key: "End", run: cursorLineBoundaryForward, shift: selectLineBoundaryForward, preventDefault: true },
  { key: "Mod-End", run: cursorDocEnd, shift: selectDocEnd },
  { key: "Enter", run: insertNewlineAndIndent, shift: insertNewlineAndIndent },
  { key: "Mod-a", run: selectAll },
  { key: "Backspace", run: deleteCharBackward, shift: deleteCharBackward, preventDefault: true },
  { key: "Delete", run: deleteCharForward, preventDefault: true },
  { key: "Mod-Backspace", mac: "Alt-Backspace", run: deleteGroupBackward, preventDefault: true },
  { key: "Mod-Delete", mac: "Alt-Delete", run: deleteGroupForward, preventDefault: true },
  { mac: "Mod-Backspace", run: deleteLineBoundaryBackward, preventDefault: true },
  { mac: "Mod-Delete", run: deleteLineBoundaryForward, preventDefault: true }
].concat(/* @__PURE__ */ emacsStyleKeymap.map((b) => ({ mac: b.key, run: b.run, shift: b.shift })));
const defaultKeymap = /* @__PURE__ */ [
  { key: "Alt-ArrowLeft", mac: "Ctrl-ArrowLeft", run: cursorSyntaxLeft, shift: selectSyntaxLeft },
  { key: "Alt-ArrowRight", mac: "Ctrl-ArrowRight", run: cursorSyntaxRight, shift: selectSyntaxRight },
  { key: "Alt-ArrowUp", run: moveLineUp },
  { key: "Shift-Alt-ArrowUp", run: copyLineUp },
  { key: "Alt-ArrowDown", run: moveLineDown },
  { key: "Shift-Alt-ArrowDown", run: copyLineDown },
  { key: "Mod-Alt-ArrowUp", run: addCursorAbove },
  { key: "Mod-Alt-ArrowDown", run: addCursorBelow },
  { key: "Escape", run: simplifySelection },
  { key: "Mod-Enter", run: insertBlankLine },
  { key: "Alt-l", mac: "Ctrl-l", run: selectLine },
  { key: "Mod-i", run: selectParentSyntax, preventDefault: true },
  { key: "Mod-[", run: indentLess },
  { key: "Mod-]", run: indentMore },
  { key: "Mod-Alt-\\", run: indentSelection },
  { key: "Shift-Mod-k", run: deleteLine },
  { key: "Shift-Mod-\\", run: cursorMatchingBracket },
  { key: "Mod-/", run: toggleComment },
  { key: "Alt-A", run: toggleBlockComment },
  { key: "Ctrl-m", mac: "Shift-Alt-m", run: toggleTabFocusMode }
].concat(standardKeymap);
const indentWithTab = { key: "Tab", run: indentMore, shift: indentLess };
class CompletionContext {
  /**
  Create a new completion context. (Mostly useful for testing
  completion sources—in the editor, the extension will create
  these for you.)
  */
  constructor(state, pos, explicit, view) {
    this.state = state;
    this.pos = pos;
    this.explicit = explicit;
    this.view = view;
    this.abortListeners = [];
    this.abortOnDocChange = false;
  }
  /**
  Get the extent, content, and (if there is a token) type of the
  token before `this.pos`.
  */
  tokenBefore(types) {
    let token = syntaxTree(this.state).resolveInner(this.pos, -1);
    while (token && types.indexOf(token.name) < 0)
      token = token.parent;
    return token ? {
      from: token.from,
      to: this.pos,
      text: this.state.sliceDoc(token.from, this.pos),
      type: token.type
    } : null;
  }
  /**
  Get the match of the given expression directly before the
  cursor.
  */
  matchBefore(expr) {
    let line = this.state.doc.lineAt(this.pos);
    let start = Math.max(line.from, this.pos - 250);
    let str = line.text.slice(start - line.from, this.pos - line.from);
    let found = str.search(ensureAnchor(expr, false));
    return found < 0 ? null : { from: start + found, to: this.pos, text: str.slice(found) };
  }
  /**
  Yields true when the query has been aborted. Can be useful in
  asynchronous queries to avoid doing work that will be ignored.
  */
  get aborted() {
    return this.abortListeners == null;
  }
  /**
  Allows you to register abort handlers, which will be called when
  the query is
  [aborted](https://codemirror.net/6/docs/ref/#autocomplete.CompletionContext.aborted).
  
  By default, running queries will not be aborted for regular
  typing or backspacing, on the assumption that they are likely to
  return a result with a
  [`validFor`](https://codemirror.net/6/docs/ref/#autocomplete.CompletionResult.validFor) field that
  allows the result to be used after all. Passing `onDocChange:
  true` will cause this query to be aborted for any document
  change.
  */
  addEventListener(type, listener, options) {
    if (type == "abort" && this.abortListeners) {
      this.abortListeners.push(listener);
      if (options && options.onDocChange)
        this.abortOnDocChange = true;
    }
  }
}
function toSet(chars) {
  let flat = Object.keys(chars).join("");
  let words = /\w/.test(flat);
  if (words)
    flat = flat.replace(/\w/g, "");
  return `[${words ? "\\w" : ""}${flat.replace(/[^\w\s]/g, "\\$&")}]`;
}
function prefixMatch(options) {
  let first = /* @__PURE__ */ Object.create(null), rest = /* @__PURE__ */ Object.create(null);
  for (let { label } of options) {
    first[label[0]] = true;
    for (let i = 1; i < label.length; i++)
      rest[label[i]] = true;
  }
  let source = toSet(first) + toSet(rest) + "*$";
  return [new RegExp("^" + source), new RegExp(source)];
}
function completeFromList(list) {
  let options = list.map((o) => typeof o == "string" ? { label: o } : o);
  let [validFor, match] = options.every((o) => /^\w+$/.test(o.label)) ? [/\w*$/, /\w+$/] : prefixMatch(options);
  return (context) => {
    let token = context.matchBefore(match);
    return token || context.explicit ? { from: token ? token.from : context.pos, options, validFor } : null;
  };
}
class Option {
  constructor(completion, source, match, score2) {
    this.completion = completion;
    this.source = source;
    this.match = match;
    this.score = score2;
  }
}
function cur(state) {
  return state.selection.main.from;
}
function ensureAnchor(expr, start) {
  var _a2;
  let { source } = expr;
  let addStart = start && source[0] != "^", addEnd = source[source.length - 1] != "$";
  if (!addStart && !addEnd)
    return expr;
  return new RegExp(`${addStart ? "^" : ""}(?:${source})${addEnd ? "$" : ""}`, (_a2 = expr.flags) !== null && _a2 !== void 0 ? _a2 : expr.ignoreCase ? "i" : "");
}
const pickedCompletion = /* @__PURE__ */ Annotation.define();
function insertCompletionText(state, text, from, to) {
  let { main } = state.selection, fromOff = from - main.from, toOff = to - main.from;
  return {
    ...state.changeByRange((range) => {
      if (range != main && from != to && state.sliceDoc(range.from + fromOff, range.from + toOff) != state.sliceDoc(from, to))
        return { range };
      let lines = state.toText(text);
      return {
        changes: { from: range.from + fromOff, to: to == main.from ? range.to : range.from + toOff, insert: lines },
        range: EditorSelection.cursor(range.from + fromOff + lines.length)
      };
    }),
    scrollIntoView: true,
    userEvent: "input.complete"
  };
}
const SourceCache = /* @__PURE__ */ new WeakMap();
function asSource(source) {
  if (!Array.isArray(source))
    return source;
  let known = SourceCache.get(source);
  if (!known)
    SourceCache.set(source, known = completeFromList(source));
  return known;
}
const startCompletionEffect = /* @__PURE__ */ StateEffect.define();
const closeCompletionEffect = /* @__PURE__ */ StateEffect.define();
class FuzzyMatcher {
  constructor(pattern) {
    this.pattern = pattern;
    this.chars = [];
    this.folded = [];
    this.any = [];
    this.precise = [];
    this.byWord = [];
    this.score = 0;
    this.matched = [];
    for (let p = 0; p < pattern.length; ) {
      let char = codePointAt(pattern, p), size = codePointSize(char);
      this.chars.push(char);
      let part = pattern.slice(p, p + size), upper = part.toUpperCase();
      this.folded.push(codePointAt(upper == part ? part.toLowerCase() : upper, 0));
      p += size;
    }
    this.astral = pattern.length != this.chars.length;
  }
  ret(score2, matched) {
    this.score = score2;
    this.matched = matched;
    return this;
  }
  // Matches a given word (completion) against the pattern (input).
  // Will return a boolean indicating whether there was a match and,
  // on success, set `this.score` to the score, `this.matched` to an
  // array of `from, to` pairs indicating the matched parts of `word`.
  //
  // The score is a number that is more negative the worse the match
  // is. See `Penalty` above.
  match(word) {
    if (this.pattern.length == 0)
      return this.ret(-100, []);
    if (word.length < this.pattern.length)
      return null;
    let { chars, folded, any, precise, byWord } = this;
    if (chars.length == 1) {
      let first = codePointAt(word, 0), firstSize = codePointSize(first);
      let score2 = firstSize == word.length ? 0 : -100;
      if (first == chars[0]) ;
      else if (first == folded[0])
        score2 += -200;
      else
        return null;
      return this.ret(score2, [0, firstSize]);
    }
    let direct = word.indexOf(this.pattern);
    if (direct == 0)
      return this.ret(word.length == this.pattern.length ? 0 : -100, [0, this.pattern.length]);
    let len = chars.length, anyTo = 0;
    if (direct < 0) {
      for (let i = 0, e = Math.min(word.length, 200); i < e && anyTo < len; ) {
        let next = codePointAt(word, i);
        if (next == chars[anyTo] || next == folded[anyTo])
          any[anyTo++] = i;
        i += codePointSize(next);
      }
      if (anyTo < len)
        return null;
    }
    let preciseTo = 0;
    let byWordTo = 0, byWordFolded = false;
    let adjacentTo = 0, adjacentStart = -1, adjacentEnd = -1;
    let hasLower = /[a-z]/.test(word), wordAdjacent = true;
    for (let i = 0, e = Math.min(word.length, 200), prevType = 0; i < e && byWordTo < len; ) {
      let next = codePointAt(word, i);
      if (direct < 0) {
        if (preciseTo < len && next == chars[preciseTo])
          precise[preciseTo++] = i;
        if (adjacentTo < len) {
          if (next == chars[adjacentTo] || next == folded[adjacentTo]) {
            if (adjacentTo == 0)
              adjacentStart = i;
            adjacentEnd = i + 1;
            adjacentTo++;
          } else {
            adjacentTo = 0;
          }
        }
      }
      let ch, type = next < 255 ? next >= 48 && next <= 57 || next >= 97 && next <= 122 ? 2 : next >= 65 && next <= 90 ? 1 : 0 : (ch = fromCodePoint(next)) != ch.toLowerCase() ? 1 : ch != ch.toUpperCase() ? 2 : 0;
      if (!i || type == 1 && hasLower || prevType == 0 && type != 0) {
        if (chars[byWordTo] == next || folded[byWordTo] == next && (byWordFolded = true))
          byWord[byWordTo++] = i;
        else if (byWord.length)
          wordAdjacent = false;
      }
      prevType = type;
      i += codePointSize(next);
    }
    if (byWordTo == len && byWord[0] == 0 && wordAdjacent)
      return this.result(-100 + (byWordFolded ? -200 : 0), byWord, word);
    if (adjacentTo == len && adjacentStart == 0)
      return this.ret(-200 - word.length + (adjacentEnd == word.length ? 0 : -100), [0, adjacentEnd]);
    if (direct > -1)
      return this.ret(-700 - word.length, [direct, direct + this.pattern.length]);
    if (adjacentTo == len)
      return this.ret(-200 + -700 - word.length, [adjacentStart, adjacentEnd]);
    if (byWordTo == len)
      return this.result(-100 + (byWordFolded ? -200 : 0) + -700 + (wordAdjacent ? 0 : -1100), byWord, word);
    return chars.length == 2 ? null : this.result((any[0] ? -700 : 0) + -200 + -1100, any, word);
  }
  result(score2, positions, word) {
    let result = [], i = 0;
    for (let pos of positions) {
      let to = pos + (this.astral ? codePointSize(codePointAt(word, pos)) : 1);
      if (i && result[i - 1] == pos)
        result[i - 1] = to;
      else {
        result[i++] = pos;
        result[i++] = to;
      }
    }
    return this.ret(score2 - word.length, result);
  }
}
class StrictMatcher {
  constructor(pattern) {
    this.pattern = pattern;
    this.matched = [];
    this.score = 0;
    this.folded = pattern.toLowerCase();
  }
  match(word) {
    if (word.length < this.pattern.length)
      return null;
    let start = word.slice(0, this.pattern.length);
    let match = start == this.pattern ? 0 : start.toLowerCase() == this.folded ? -200 : null;
    if (match == null)
      return null;
    this.matched = [0, start.length];
    this.score = match + (word.length == this.pattern.length ? 0 : -100);
    return this;
  }
}
const completionConfig = /* @__PURE__ */ Facet.define({
  combine(configs) {
    return combineConfig(configs, {
      activateOnTyping: true,
      activateOnCompletion: () => false,
      activateOnTypingDelay: 100,
      selectOnOpen: true,
      override: null,
      closeOnBlur: true,
      maxRenderedOptions: 100,
      defaultKeymap: true,
      tooltipClass: () => "",
      optionClass: () => "",
      aboveCursor: false,
      icons: true,
      addToOptions: [],
      positionInfo: defaultPositionInfo,
      filterStrict: false,
      compareCompletions: (a, b) => a.label.localeCompare(b.label),
      interactionDelay: 75,
      updateSyncTime: 100
    }, {
      defaultKeymap: (a, b) => a && b,
      closeOnBlur: (a, b) => a && b,
      icons: (a, b) => a && b,
      tooltipClass: (a, b) => (c) => joinClass(a(c), b(c)),
      optionClass: (a, b) => (c) => joinClass(a(c), b(c)),
      addToOptions: (a, b) => a.concat(b),
      filterStrict: (a, b) => a || b
    });
  }
});
function joinClass(a, b) {
  return a ? b ? a + " " + b : a : b;
}
function defaultPositionInfo(view, list, option, info, space, tooltip) {
  let rtl = view.textDirection == Direction.RTL, left = rtl, narrow = false;
  let side = "top", offset, maxWidth;
  let spaceLeft = list.left - space.left, spaceRight = space.right - list.right;
  let infoWidth = info.right - info.left, infoHeight = info.bottom - info.top;
  if (left && spaceLeft < Math.min(infoWidth, spaceRight))
    left = false;
  else if (!left && spaceRight < Math.min(infoWidth, spaceLeft))
    left = true;
  if (infoWidth <= (left ? spaceLeft : spaceRight)) {
    offset = Math.max(space.top, Math.min(option.top, space.bottom - infoHeight)) - list.top;
    maxWidth = Math.min(400, left ? spaceLeft : spaceRight);
  } else {
    narrow = true;
    maxWidth = Math.min(
      400,
      (rtl ? list.right : space.right - list.left) - 30
      /* Info.Margin */
    );
    let spaceBelow = space.bottom - list.bottom;
    if (spaceBelow >= infoHeight || spaceBelow > list.top) {
      offset = option.bottom - list.top;
    } else {
      side = "bottom";
      offset = list.bottom - option.top;
    }
  }
  let scaleY = (list.bottom - list.top) / tooltip.offsetHeight;
  let scaleX = (list.right - list.left) / tooltip.offsetWidth;
  return {
    style: `${side}: ${offset / scaleY}px; max-width: ${maxWidth / scaleX}px`,
    class: "cm-completionInfo-" + (narrow ? rtl ? "left-narrow" : "right-narrow" : left ? "left" : "right")
  };
}
function optionContent(config2) {
  let content2 = config2.addToOptions.slice();
  if (config2.icons)
    content2.push({
      render(completion) {
        let icon = document.createElement("div");
        icon.classList.add("cm-completionIcon");
        if (completion.type)
          icon.classList.add(...completion.type.split(/\s+/g).map((cls) => "cm-completionIcon-" + cls));
        icon.setAttribute("aria-hidden", "true");
        return icon;
      },
      position: 20
    });
  content2.push({
    render(completion, _s, _v, match) {
      let labelElt = document.createElement("span");
      labelElt.className = "cm-completionLabel";
      let label = completion.displayLabel || completion.label, off = 0;
      for (let j = 0; j < match.length; ) {
        let from = match[j++], to = match[j++];
        if (from > off)
          labelElt.appendChild(document.createTextNode(label.slice(off, from)));
        let span = labelElt.appendChild(document.createElement("span"));
        span.appendChild(document.createTextNode(label.slice(from, to)));
        span.className = "cm-completionMatchedText";
        off = to;
      }
      if (off < label.length)
        labelElt.appendChild(document.createTextNode(label.slice(off)));
      return labelElt;
    },
    position: 50
  }, {
    render(completion) {
      if (!completion.detail)
        return null;
      let detailElt = document.createElement("span");
      detailElt.className = "cm-completionDetail";
      detailElt.textContent = completion.detail;
      return detailElt;
    },
    position: 80
  });
  return content2.sort((a, b) => a.position - b.position).map((a) => a.render);
}
function rangeAroundSelected(total, selected, max) {
  if (total <= max)
    return { from: 0, to: total };
  if (selected < 0)
    selected = 0;
  if (selected <= total >> 1) {
    let off2 = Math.floor(selected / max);
    return { from: off2 * max, to: (off2 + 1) * max };
  }
  let off = Math.floor((total - selected) / max);
  return { from: total - (off + 1) * max, to: total - off * max };
}
class CompletionTooltip {
  constructor(view, stateField, applyCompletion2) {
    this.view = view;
    this.stateField = stateField;
    this.applyCompletion = applyCompletion2;
    this.info = null;
    this.infoDestroy = null;
    this.placeInfoReq = {
      read: () => this.measureInfo(),
      write: (pos) => this.placeInfo(pos),
      key: this
    };
    this.space = null;
    this.currentClass = "";
    let cState = view.state.field(stateField);
    let { options, selected } = cState.open;
    let config2 = view.state.facet(completionConfig);
    this.optionContent = optionContent(config2);
    this.optionClass = config2.optionClass;
    this.tooltipClass = config2.tooltipClass;
    this.range = rangeAroundSelected(options.length, selected, config2.maxRenderedOptions);
    this.dom = document.createElement("div");
    this.dom.className = "cm-tooltip-autocomplete";
    this.updateTooltipClass(view.state);
    this.dom.addEventListener("mousedown", (e) => {
      let { options: options2 } = view.state.field(stateField).open;
      for (let dom = e.target, match; dom && dom != this.dom; dom = dom.parentNode) {
        if (dom.nodeName == "LI" && (match = /-(\d+)$/.exec(dom.id)) && +match[1] < options2.length) {
          this.applyCompletion(view, options2[+match[1]]);
          e.preventDefault();
          return;
        }
      }
    });
    this.dom.addEventListener("focusout", (e) => {
      let state = view.state.field(this.stateField, false);
      if (state && state.tooltip && view.state.facet(completionConfig).closeOnBlur && e.relatedTarget != view.contentDOM)
        view.dispatch({ effects: closeCompletionEffect.of(null) });
    });
    this.showOptions(options, cState.id);
  }
  mount() {
    this.updateSel();
  }
  showOptions(options, id2) {
    if (this.list)
      this.list.remove();
    this.list = this.dom.appendChild(this.createListBox(options, id2, this.range));
    this.list.addEventListener("scroll", () => {
      if (this.info)
        this.view.requestMeasure(this.placeInfoReq);
    });
  }
  update(update) {
    var _a2;
    let cState = update.state.field(this.stateField);
    let prevState = update.startState.field(this.stateField);
    this.updateTooltipClass(update.state);
    if (cState != prevState) {
      let { options, selected, disabled } = cState.open;
      if (!prevState.open || prevState.open.options != options) {
        this.range = rangeAroundSelected(options.length, selected, update.state.facet(completionConfig).maxRenderedOptions);
        this.showOptions(options, cState.id);
      }
      this.updateSel();
      if (disabled != ((_a2 = prevState.open) === null || _a2 === void 0 ? void 0 : _a2.disabled))
        this.dom.classList.toggle("cm-tooltip-autocomplete-disabled", !!disabled);
    }
  }
  updateTooltipClass(state) {
    let cls = this.tooltipClass(state);
    if (cls != this.currentClass) {
      for (let c of this.currentClass.split(" "))
        if (c)
          this.dom.classList.remove(c);
      for (let c of cls.split(" "))
        if (c)
          this.dom.classList.add(c);
      this.currentClass = cls;
    }
  }
  positioned(space) {
    this.space = space;
    if (this.info)
      this.view.requestMeasure(this.placeInfoReq);
  }
  updateSel() {
    let cState = this.view.state.field(this.stateField), open = cState.open;
    if (open.selected > -1 && open.selected < this.range.from || open.selected >= this.range.to) {
      this.range = rangeAroundSelected(open.options.length, open.selected, this.view.state.facet(completionConfig).maxRenderedOptions);
      this.showOptions(open.options, cState.id);
    }
    if (this.updateSelectedOption(open.selected)) {
      this.destroyInfo();
      let { completion } = open.options[open.selected];
      let { info } = completion;
      if (!info)
        return;
      let infoResult = typeof info === "string" ? document.createTextNode(info) : info(completion);
      if (!infoResult)
        return;
      if ("then" in infoResult) {
        infoResult.then((obj) => {
          if (obj && this.view.state.field(this.stateField, false) == cState)
            this.addInfoPane(obj, completion);
        }).catch((e) => logException(this.view.state, e, "completion info"));
      } else {
        this.addInfoPane(infoResult, completion);
      }
    }
  }
  addInfoPane(content2, completion) {
    this.destroyInfo();
    let wrap = this.info = document.createElement("div");
    wrap.className = "cm-tooltip cm-completionInfo";
    if (content2.nodeType != null) {
      wrap.appendChild(content2);
      this.infoDestroy = null;
    } else {
      let { dom, destroy } = content2;
      wrap.appendChild(dom);
      this.infoDestroy = destroy || null;
    }
    this.dom.appendChild(wrap);
    this.view.requestMeasure(this.placeInfoReq);
  }
  updateSelectedOption(selected) {
    let set = null;
    for (let opt = this.list.firstChild, i = this.range.from; opt; opt = opt.nextSibling, i++) {
      if (opt.nodeName != "LI" || !opt.id) {
        i--;
      } else if (i == selected) {
        if (!opt.hasAttribute("aria-selected")) {
          opt.setAttribute("aria-selected", "true");
          set = opt;
        }
      } else {
        if (opt.hasAttribute("aria-selected"))
          opt.removeAttribute("aria-selected");
      }
    }
    if (set)
      scrollIntoView(this.list, set);
    return set;
  }
  measureInfo() {
    let sel = this.dom.querySelector("[aria-selected]");
    if (!sel || !this.info)
      return null;
    let listRect = this.dom.getBoundingClientRect();
    let infoRect = this.info.getBoundingClientRect();
    let selRect = sel.getBoundingClientRect();
    let space = this.space;
    if (!space) {
      let docElt = this.dom.ownerDocument.documentElement;
      space = { left: 0, top: 0, right: docElt.clientWidth, bottom: docElt.clientHeight };
    }
    if (selRect.top > Math.min(space.bottom, listRect.bottom) - 10 || selRect.bottom < Math.max(space.top, listRect.top) + 10)
      return null;
    return this.view.state.facet(completionConfig).positionInfo(this.view, listRect, selRect, infoRect, space, this.dom);
  }
  placeInfo(pos) {
    if (this.info) {
      if (pos) {
        if (pos.style)
          this.info.style.cssText = pos.style;
        this.info.className = "cm-tooltip cm-completionInfo " + (pos.class || "");
      } else {
        this.info.style.cssText = "top: -1e6px";
      }
    }
  }
  createListBox(options, id2, range) {
    const ul = document.createElement("ul");
    ul.id = id2;
    ul.setAttribute("role", "listbox");
    ul.setAttribute("aria-expanded", "true");
    ul.setAttribute("aria-label", this.view.state.phrase("Completions"));
    ul.addEventListener("mousedown", (e) => {
      if (e.target == ul)
        e.preventDefault();
    });
    let curSection = null;
    for (let i = range.from; i < range.to; i++) {
      let { completion, match } = options[i], { section } = completion;
      if (section) {
        let name2 = typeof section == "string" ? section : section.name;
        if (name2 != curSection && (i > range.from || range.from == 0)) {
          curSection = name2;
          if (typeof section != "string" && section.header) {
            ul.appendChild(section.header(section));
          } else {
            let header = ul.appendChild(document.createElement("completion-section"));
            header.textContent = name2;
          }
        }
      }
      const li = ul.appendChild(document.createElement("li"));
      li.id = id2 + "-" + i;
      li.setAttribute("role", "option");
      let cls = this.optionClass(completion);
      if (cls)
        li.className = cls;
      for (let source of this.optionContent) {
        let node = source(completion, this.view.state, this.view, match);
        if (node)
          li.appendChild(node);
      }
    }
    if (range.from)
      ul.classList.add("cm-completionListIncompleteTop");
    if (range.to < options.length)
      ul.classList.add("cm-completionListIncompleteBottom");
    return ul;
  }
  destroyInfo() {
    if (this.info) {
      if (this.infoDestroy)
        this.infoDestroy();
      this.info.remove();
      this.info = null;
    }
  }
  destroy() {
    this.destroyInfo();
  }
}
function completionTooltip(stateField, applyCompletion2) {
  return (view) => new CompletionTooltip(view, stateField, applyCompletion2);
}
function scrollIntoView(container, element) {
  let parent = container.getBoundingClientRect();
  let self = element.getBoundingClientRect();
  let scaleY = parent.height / container.offsetHeight;
  if (self.top < parent.top)
    container.scrollTop -= (parent.top - self.top) / scaleY;
  else if (self.bottom > parent.bottom)
    container.scrollTop += (self.bottom - parent.bottom) / scaleY;
}
function score(option) {
  return (option.boost || 0) * 100 + (option.apply ? 10 : 0) + (option.info ? 5 : 0) + (option.type ? 1 : 0);
}
function sortOptions(active, state) {
  let options = [];
  let sections = null, dynamicSectionScore = null;
  let addOption = (option) => {
    options.push(option);
    let { section } = option.completion;
    if (section) {
      if (!sections)
        sections = [];
      let name2 = typeof section == "string" ? section : section.name;
      if (!sections.some((s) => s.name == name2))
        sections.push(typeof section == "string" ? { name: name2 } : section);
    }
  };
  let conf = state.facet(completionConfig);
  for (let a of active)
    if (a.hasResult()) {
      let getMatch = a.result.getMatch;
      if (a.result.filter === false) {
        for (let option of a.result.options) {
          addOption(new Option(option, a.source, getMatch ? getMatch(option) : [], 1e9 - options.length));
        }
      } else {
        let pattern = state.sliceDoc(a.from, a.to), match;
        let matcher = conf.filterStrict ? new StrictMatcher(pattern) : new FuzzyMatcher(pattern);
        for (let option of a.result.options)
          if (match = matcher.match(option.label)) {
            let matched = !option.displayLabel ? match.matched : getMatch ? getMatch(option, match.matched) : [];
            let score2 = match.score + (option.boost || 0);
            addOption(new Option(option, a.source, matched, score2));
            if (typeof option.section == "object" && option.section.rank === "dynamic") {
              let { name: name2 } = option.section;
              if (!dynamicSectionScore)
                dynamicSectionScore = /* @__PURE__ */ Object.create(null);
              dynamicSectionScore[name2] = Math.max(score2, dynamicSectionScore[name2] || -1e9);
            }
          }
      }
    }
  if (sections) {
    let sectionOrder = /* @__PURE__ */ Object.create(null), pos = 0;
    let cmp = (a, b) => {
      return (a.rank === "dynamic" && b.rank === "dynamic" ? dynamicSectionScore[b.name] - dynamicSectionScore[a.name] : 0) || (typeof a.rank == "number" ? a.rank : 1e9) - (typeof b.rank == "number" ? b.rank : 1e9) || (a.name < b.name ? -1 : 1);
    };
    for (let s of sections.sort(cmp)) {
      pos -= 1e5;
      sectionOrder[s.name] = pos;
    }
    for (let option of options) {
      let { section } = option.completion;
      if (section)
        option.score += sectionOrder[typeof section == "string" ? section : section.name];
    }
  }
  let result = [], prev = null;
  let compare = conf.compareCompletions;
  for (let opt of options.sort((a, b) => b.score - a.score || compare(a.completion, b.completion))) {
    let cur2 = opt.completion;
    if (!prev || prev.label != cur2.label || prev.detail != cur2.detail || prev.type != null && cur2.type != null && prev.type != cur2.type || prev.apply != cur2.apply || prev.boost != cur2.boost)
      result.push(opt);
    else if (score(opt.completion) > score(prev))
      result[result.length - 1] = opt;
    prev = opt.completion;
  }
  return result;
}
class CompletionDialog {
  constructor(options, attrs, tooltip, timestamp, selected, disabled) {
    this.options = options;
    this.attrs = attrs;
    this.tooltip = tooltip;
    this.timestamp = timestamp;
    this.selected = selected;
    this.disabled = disabled;
  }
  setSelected(selected, id2) {
    return selected == this.selected || selected >= this.options.length ? this : new CompletionDialog(this.options, makeAttrs(id2, selected), this.tooltip, this.timestamp, selected, this.disabled);
  }
  static build(active, state, id2, prev, conf, didSetActive) {
    if (prev && !didSetActive && active.some((s) => s.isPending))
      return prev.setDisabled();
    let options = sortOptions(active, state);
    if (!options.length)
      return prev && active.some((a) => a.isPending) ? prev.setDisabled() : null;
    let selected = state.facet(completionConfig).selectOnOpen ? 0 : -1;
    if (prev && prev.selected != selected && prev.selected != -1) {
      let selectedValue = prev.options[prev.selected].completion;
      for (let i = 0; i < options.length; i++)
        if (options[i].completion == selectedValue) {
          selected = i;
          break;
        }
    }
    return new CompletionDialog(options, makeAttrs(id2, selected), {
      pos: active.reduce((a, b) => b.hasResult() ? Math.min(a, b.from) : a, 1e8),
      create: createTooltip,
      above: conf.aboveCursor
    }, prev ? prev.timestamp : Date.now(), selected, false);
  }
  map(changes) {
    return new CompletionDialog(this.options, this.attrs, { ...this.tooltip, pos: changes.mapPos(this.tooltip.pos) }, this.timestamp, this.selected, this.disabled);
  }
  setDisabled() {
    return new CompletionDialog(this.options, this.attrs, this.tooltip, this.timestamp, this.selected, true);
  }
}
class CompletionState {
  constructor(active, id2, open) {
    this.active = active;
    this.id = id2;
    this.open = open;
  }
  static start() {
    return new CompletionState(none, "cm-ac-" + Math.floor(Math.random() * 2e6).toString(36), null);
  }
  update(tr) {
    let { state } = tr, conf = state.facet(completionConfig);
    let sources = conf.override || state.languageDataAt("autocomplete", cur(state)).map(asSource);
    let active = sources.map((source) => {
      let value = this.active.find((s) => s.source == source) || new ActiveSource(
        source,
        this.active.some(
          (a) => a.state != 0
          /* State.Inactive */
        ) ? 1 : 0
        /* State.Inactive */
      );
      return value.update(tr, conf);
    });
    if (active.length == this.active.length && active.every((a, i) => a == this.active[i]))
      active = this.active;
    let open = this.open, didSet = tr.effects.some((e) => e.is(setActiveEffect));
    if (open && tr.docChanged)
      open = open.map(tr.changes);
    if (tr.selection || active.some((a) => a.hasResult() && tr.changes.touchesRange(a.from, a.to)) || !sameResults(active, this.active) || didSet)
      open = CompletionDialog.build(active, state, this.id, open, conf, didSet);
    else if (open && open.disabled && !active.some((a) => a.isPending))
      open = null;
    if (!open && active.every((a) => !a.isPending) && active.some((a) => a.hasResult()))
      active = active.map((a) => a.hasResult() ? new ActiveSource(
        a.source,
        0
        /* State.Inactive */
      ) : a);
    for (let effect of tr.effects)
      if (effect.is(setSelectedEffect))
        open = open && open.setSelected(effect.value, this.id);
    return active == this.active && open == this.open ? this : new CompletionState(active, this.id, open);
  }
  get tooltip() {
    return this.open ? this.open.tooltip : null;
  }
  get attrs() {
    return this.open ? this.open.attrs : this.active.length ? baseAttrs : noAttrs;
  }
}
function sameResults(a, b) {
  if (a == b)
    return true;
  for (let iA = 0, iB = 0; ; ) {
    while (iA < a.length && !a[iA].hasResult())
      iA++;
    while (iB < b.length && !b[iB].hasResult())
      iB++;
    let endA = iA == a.length, endB = iB == b.length;
    if (endA || endB)
      return endA == endB;
    if (a[iA++].result != b[iB++].result)
      return false;
  }
}
const baseAttrs = {
  "aria-autocomplete": "list"
};
const noAttrs = {};
function makeAttrs(id2, selected) {
  let result = {
    "aria-autocomplete": "list",
    "aria-haspopup": "listbox",
    "aria-controls": id2
  };
  if (selected > -1)
    result["aria-activedescendant"] = id2 + "-" + selected;
  return result;
}
const none = [];
function getUpdateType(tr, conf) {
  if (tr.isUserEvent("input.complete")) {
    let completion = tr.annotation(pickedCompletion);
    if (completion && conf.activateOnCompletion(completion))
      return 4 | 8;
  }
  let typing = tr.isUserEvent("input.type");
  return typing && conf.activateOnTyping ? 4 | 1 : typing ? 1 : tr.isUserEvent("delete.backward") ? 2 : tr.selection ? 8 : tr.docChanged ? 16 : 0;
}
class ActiveSource {
  constructor(source, state, explicit = false) {
    this.source = source;
    this.state = state;
    this.explicit = explicit;
  }
  hasResult() {
    return false;
  }
  get isPending() {
    return this.state == 1;
  }
  update(tr, conf) {
    let type = getUpdateType(tr, conf), value = this;
    if (type & 8 || type & 16 && this.touches(tr))
      value = new ActiveSource(
        value.source,
        0
        /* State.Inactive */
      );
    if (type & 4 && value.state == 0)
      value = new ActiveSource(
        this.source,
        1
        /* State.Pending */
      );
    value = value.updateFor(tr, type);
    for (let effect of tr.effects) {
      if (effect.is(startCompletionEffect))
        value = new ActiveSource(value.source, 1, effect.value);
      else if (effect.is(closeCompletionEffect))
        value = new ActiveSource(
          value.source,
          0
          /* State.Inactive */
        );
      else if (effect.is(setActiveEffect)) {
        for (let active of effect.value)
          if (active.source == value.source)
            value = active;
      }
    }
    return value;
  }
  updateFor(tr, type) {
    return this.map(tr.changes);
  }
  map(changes) {
    return this;
  }
  touches(tr) {
    return tr.changes.touchesRange(cur(tr.state));
  }
}
class ActiveResult extends ActiveSource {
  constructor(source, explicit, limit, result, from, to) {
    super(source, 3, explicit);
    this.limit = limit;
    this.result = result;
    this.from = from;
    this.to = to;
  }
  hasResult() {
    return true;
  }
  updateFor(tr, type) {
    var _a2;
    if (!(type & 3))
      return this.map(tr.changes);
    let result = this.result;
    if (result.map && !tr.changes.empty)
      result = result.map(result, tr.changes);
    let from = tr.changes.mapPos(this.from), to = tr.changes.mapPos(this.to, 1);
    let pos = cur(tr.state);
    if (pos > to || !result || type & 2 && (cur(tr.startState) == this.from || pos < this.limit))
      return new ActiveSource(
        this.source,
        type & 4 ? 1 : 0
        /* State.Inactive */
      );
    let limit = tr.changes.mapPos(this.limit);
    if (checkValid(result.validFor, tr.state, from, to))
      return new ActiveResult(this.source, this.explicit, limit, result, from, to);
    if (result.update && (result = result.update(result, from, to, new CompletionContext(tr.state, pos, false))))
      return new ActiveResult(this.source, this.explicit, limit, result, result.from, (_a2 = result.to) !== null && _a2 !== void 0 ? _a2 : cur(tr.state));
    return new ActiveSource(this.source, 1, this.explicit);
  }
  map(mapping) {
    if (mapping.empty)
      return this;
    let result = this.result.map ? this.result.map(this.result, mapping) : this.result;
    if (!result)
      return new ActiveSource(
        this.source,
        0
        /* State.Inactive */
      );
    return new ActiveResult(this.source, this.explicit, mapping.mapPos(this.limit), this.result, mapping.mapPos(this.from), mapping.mapPos(this.to, 1));
  }
  touches(tr) {
    return tr.changes.touchesRange(this.from, this.to);
  }
}
function checkValid(validFor, state, from, to) {
  if (!validFor)
    return false;
  let text = state.sliceDoc(from, to);
  return typeof validFor == "function" ? validFor(text, from, to, state) : ensureAnchor(validFor, true).test(text);
}
const setActiveEffect = /* @__PURE__ */ StateEffect.define({
  map(sources, mapping) {
    return sources.map((s) => s.map(mapping));
  }
});
const setSelectedEffect = /* @__PURE__ */ StateEffect.define();
const completionState = /* @__PURE__ */ StateField.define({
  create() {
    return CompletionState.start();
  },
  update(value, tr) {
    return value.update(tr);
  },
  provide: (f) => [
    showTooltip.from(f, (val) => val.tooltip),
    EditorView.contentAttributes.from(f, (state) => state.attrs)
  ]
});
function applyCompletion(view, option) {
  const apply = option.completion.apply || option.completion.label;
  let result = view.state.field(completionState).active.find((a) => a.source == option.source);
  if (!(result instanceof ActiveResult))
    return false;
  if (typeof apply == "string")
    view.dispatch({
      ...insertCompletionText(view.state, apply, result.from, result.to),
      annotations: pickedCompletion.of(option.completion)
    });
  else
    apply(view, option.completion, result.from, result.to);
  return true;
}
const createTooltip = /* @__PURE__ */ completionTooltip(completionState, applyCompletion);
function moveCompletionSelection(forward, by = "option") {
  return (view) => {
    let cState = view.state.field(completionState, false);
    if (!cState || !cState.open || cState.open.disabled || Date.now() - cState.open.timestamp < view.state.facet(completionConfig).interactionDelay)
      return false;
    let step = 1, tooltip;
    if (by == "page" && (tooltip = getTooltip(view, cState.open.tooltip)))
      step = Math.max(2, Math.floor(tooltip.dom.offsetHeight / tooltip.dom.querySelector("li").offsetHeight) - 1);
    let { length } = cState.open.options;
    let selected = cState.open.selected > -1 ? cState.open.selected + step * (forward ? 1 : -1) : forward ? 0 : length - 1;
    if (selected < 0)
      selected = by == "page" ? 0 : length - 1;
    else if (selected >= length)
      selected = by == "page" ? length - 1 : 0;
    view.dispatch({ effects: setSelectedEffect.of(selected) });
    return true;
  };
}
const acceptCompletion = (view) => {
  let cState = view.state.field(completionState, false);
  if (view.state.readOnly || !cState || !cState.open || cState.open.selected < 0 || cState.open.disabled || Date.now() - cState.open.timestamp < view.state.facet(completionConfig).interactionDelay)
    return false;
  return applyCompletion(view, cState.open.options[cState.open.selected]);
};
const startCompletion = (view) => {
  let cState = view.state.field(completionState, false);
  if (!cState)
    return false;
  view.dispatch({ effects: startCompletionEffect.of(true) });
  return true;
};
const closeCompletion = (view) => {
  let cState = view.state.field(completionState, false);
  if (!cState || !cState.active.some(
    (a) => a.state != 0
    /* State.Inactive */
  ))
    return false;
  view.dispatch({ effects: closeCompletionEffect.of(null) });
  return true;
};
class RunningQuery {
  constructor(active, context) {
    this.active = active;
    this.context = context;
    this.time = Date.now();
    this.updates = [];
    this.done = void 0;
  }
}
const MaxUpdateCount = 50, MinAbortTime = 1e3;
const completionPlugin = /* @__PURE__ */ ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.debounceUpdate = -1;
    this.running = [];
    this.debounceAccept = -1;
    this.pendingStart = false;
    this.composing = 0;
    for (let active of view.state.field(completionState).active)
      if (active.isPending)
        this.startQuery(active);
  }
  update(update) {
    let cState = update.state.field(completionState);
    let conf = update.state.facet(completionConfig);
    if (!update.selectionSet && !update.docChanged && update.startState.field(completionState) == cState)
      return;
    let doesReset = update.transactions.some((tr) => {
      let type = getUpdateType(tr, conf);
      return type & 8 || (tr.selection || tr.docChanged) && !(type & 3);
    });
    for (let i = 0; i < this.running.length; i++) {
      let query = this.running[i];
      if (doesReset || query.context.abortOnDocChange && update.docChanged || query.updates.length + update.transactions.length > MaxUpdateCount && Date.now() - query.time > MinAbortTime) {
        for (let handler of query.context.abortListeners) {
          try {
            handler();
          } catch (e) {
            logException(this.view.state, e);
          }
        }
        query.context.abortListeners = null;
        this.running.splice(i--, 1);
      } else {
        query.updates.push(...update.transactions);
      }
    }
    if (this.debounceUpdate > -1)
      clearTimeout(this.debounceUpdate);
    if (update.transactions.some((tr) => tr.effects.some((e) => e.is(startCompletionEffect))))
      this.pendingStart = true;
    let delay = this.pendingStart ? 50 : conf.activateOnTypingDelay;
    this.debounceUpdate = cState.active.some((a) => a.isPending && !this.running.some((q) => q.active.source == a.source)) ? setTimeout(() => this.startUpdate(), delay) : -1;
    if (this.composing != 0)
      for (let tr of update.transactions) {
        if (tr.isUserEvent("input.type"))
          this.composing = 2;
        else if (this.composing == 2 && tr.selection)
          this.composing = 3;
      }
  }
  startUpdate() {
    this.debounceUpdate = -1;
    this.pendingStart = false;
    let { state } = this.view, cState = state.field(completionState);
    for (let active of cState.active) {
      if (active.isPending && !this.running.some((r) => r.active.source == active.source))
        this.startQuery(active);
    }
    if (this.running.length && cState.open && cState.open.disabled)
      this.debounceAccept = setTimeout(() => this.accept(), this.view.state.facet(completionConfig).updateSyncTime);
  }
  startQuery(active) {
    let { state } = this.view, pos = cur(state);
    let context = new CompletionContext(state, pos, active.explicit, this.view);
    let pending = new RunningQuery(active, context);
    this.running.push(pending);
    Promise.resolve(active.source(context)).then((result) => {
      if (!pending.context.aborted) {
        pending.done = result || null;
        this.scheduleAccept();
      }
    }, (err) => {
      this.view.dispatch({ effects: closeCompletionEffect.of(null) });
      logException(this.view.state, err);
    });
  }
  scheduleAccept() {
    if (this.running.every((q) => q.done !== void 0))
      this.accept();
    else if (this.debounceAccept < 0)
      this.debounceAccept = setTimeout(() => this.accept(), this.view.state.facet(completionConfig).updateSyncTime);
  }
  // For each finished query in this.running, try to create a result
  // or, if appropriate, restart the query.
  accept() {
    var _a2;
    if (this.debounceAccept > -1)
      clearTimeout(this.debounceAccept);
    this.debounceAccept = -1;
    let updated = [];
    let conf = this.view.state.facet(completionConfig), cState = this.view.state.field(completionState);
    for (let i = 0; i < this.running.length; i++) {
      let query = this.running[i];
      if (query.done === void 0)
        continue;
      this.running.splice(i--, 1);
      if (query.done) {
        let pos = cur(query.updates.length ? query.updates[0].startState : this.view.state);
        let limit = Math.min(pos, query.done.from + (query.active.explicit ? 0 : 1));
        let active = new ActiveResult(query.active.source, query.active.explicit, limit, query.done, query.done.from, (_a2 = query.done.to) !== null && _a2 !== void 0 ? _a2 : pos);
        for (let tr of query.updates)
          active = active.update(tr, conf);
        if (active.hasResult()) {
          updated.push(active);
          continue;
        }
      }
      let current = cState.active.find((a) => a.source == query.active.source);
      if (current && current.isPending) {
        if (query.done == null) {
          let active = new ActiveSource(
            query.active.source,
            0
            /* State.Inactive */
          );
          for (let tr of query.updates)
            active = active.update(tr, conf);
          if (!active.isPending)
            updated.push(active);
        } else {
          this.startQuery(current);
        }
      }
    }
    if (updated.length || cState.open && cState.open.disabled)
      this.view.dispatch({ effects: setActiveEffect.of(updated) });
  }
}, {
  eventHandlers: {
    blur(event) {
      let state = this.view.state.field(completionState, false);
      if (state && state.tooltip && this.view.state.facet(completionConfig).closeOnBlur) {
        let dialog = state.open && getTooltip(this.view, state.open.tooltip);
        if (!dialog || !dialog.dom.contains(event.relatedTarget))
          setTimeout(() => this.view.dispatch({ effects: closeCompletionEffect.of(null) }), 10);
      }
    },
    compositionstart() {
      this.composing = 1;
    },
    compositionend() {
      if (this.composing == 3) {
        setTimeout(() => this.view.dispatch({ effects: startCompletionEffect.of(false) }), 20);
      }
      this.composing = 0;
    }
  }
});
const windows = typeof navigator == "object" && /* @__PURE__ */ /Win/.test(navigator.platform);
const commitCharacters = /* @__PURE__ */ Prec.highest(/* @__PURE__ */ EditorView.domEventHandlers({
  keydown(event, view) {
    let field = view.state.field(completionState, false);
    if (!field || !field.open || field.open.disabled || field.open.selected < 0 || event.key.length > 1 || event.ctrlKey && !(windows && event.altKey) || event.metaKey)
      return false;
    let option = field.open.options[field.open.selected];
    let result = field.active.find((a) => a.source == option.source);
    let commitChars = option.completion.commitCharacters || result.result.commitCharacters;
    if (commitChars && commitChars.indexOf(event.key) > -1)
      applyCompletion(view, option);
    return false;
  }
}));
const baseTheme$1 = /* @__PURE__ */ EditorView.baseTheme({
  ".cm-tooltip.cm-tooltip-autocomplete": {
    "& > ul": {
      fontFamily: "monospace",
      whiteSpace: "nowrap",
      overflow: "hidden auto",
      maxWidth_fallback: "700px",
      maxWidth: "min(700px, 95vw)",
      minWidth: "250px",
      maxHeight: "10em",
      height: "100%",
      listStyle: "none",
      margin: 0,
      padding: 0,
      "& > li, & > completion-section": {
        padding: "1px 3px",
        lineHeight: 1.2
      },
      "& > li": {
        overflowX: "hidden",
        textOverflow: "ellipsis",
        cursor: "pointer"
      },
      "& > completion-section": {
        display: "list-item",
        borderBottom: "1px solid silver",
        paddingLeft: "0.5em",
        opacity: 0.7
      }
    }
  },
  "&light .cm-tooltip-autocomplete ul li[aria-selected]": {
    background: "#17c",
    color: "white"
  },
  "&light .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    background: "#777"
  },
  "&dark .cm-tooltip-autocomplete ul li[aria-selected]": {
    background: "#347",
    color: "white"
  },
  "&dark .cm-tooltip-autocomplete-disabled ul li[aria-selected]": {
    background: "#444"
  },
  ".cm-completionListIncompleteTop:before, .cm-completionListIncompleteBottom:after": {
    content: '"···"',
    opacity: 0.5,
    display: "block",
    textAlign: "center"
  },
  ".cm-tooltip.cm-completionInfo": {
    position: "absolute",
    padding: "3px 9px",
    width: "max-content",
    maxWidth: `${400}px`,
    boxSizing: "border-box",
    whiteSpace: "pre-line"
  },
  ".cm-completionInfo.cm-completionInfo-left": { right: "100%" },
  ".cm-completionInfo.cm-completionInfo-right": { left: "100%" },
  ".cm-completionInfo.cm-completionInfo-left-narrow": { right: `${30}px` },
  ".cm-completionInfo.cm-completionInfo-right-narrow": { left: `${30}px` },
  "&light .cm-snippetField": { backgroundColor: "#00000022" },
  "&dark .cm-snippetField": { backgroundColor: "#ffffff22" },
  ".cm-snippetFieldPosition": {
    verticalAlign: "text-top",
    width: 0,
    height: "1.15em",
    display: "inline-block",
    margin: "0 -0.7px -.7em",
    borderLeft: "1.4px dotted #888"
  },
  ".cm-completionMatchedText": {
    textDecoration: "underline"
  },
  ".cm-completionDetail": {
    marginLeft: "0.5em",
    fontStyle: "italic"
  },
  ".cm-completionIcon": {
    fontSize: "90%",
    width: ".8em",
    display: "inline-block",
    textAlign: "center",
    paddingRight: ".6em",
    opacity: "0.6",
    boxSizing: "content-box"
  },
  ".cm-completionIcon-function, .cm-completionIcon-method": {
    "&:after": { content: "'ƒ'" }
  },
  ".cm-completionIcon-class": {
    "&:after": { content: "'○'" }
  },
  ".cm-completionIcon-interface": {
    "&:after": { content: "'◌'" }
  },
  ".cm-completionIcon-variable": {
    "&:after": { content: "'𝑥'" }
  },
  ".cm-completionIcon-constant": {
    "&:after": { content: "'𝐶'" }
  },
  ".cm-completionIcon-type": {
    "&:after": { content: "'𝑡'" }
  },
  ".cm-completionIcon-enum": {
    "&:after": { content: "'∪'" }
  },
  ".cm-completionIcon-property": {
    "&:after": { content: "'□'" }
  },
  ".cm-completionIcon-keyword": {
    "&:after": { content: "'🔑︎'" }
    // Disable emoji rendering
  },
  ".cm-completionIcon-namespace": {
    "&:after": { content: "'▢'" }
  },
  ".cm-completionIcon-text": {
    "&:after": { content: "'abc'", fontSize: "50%", verticalAlign: "middle" }
  }
});
const defaults = {
  brackets: ["(", "[", "{", "'", '"'],
  before: ")]}:;>",
  stringPrefixes: []
};
const closeBracketEffect = /* @__PURE__ */ StateEffect.define({
  map(value, mapping) {
    let mapped = mapping.mapPos(value, -1, MapMode.TrackAfter);
    return mapped == null ? void 0 : mapped;
  }
});
const closedBracket = /* @__PURE__ */ new class extends RangeValue {
}();
closedBracket.startSide = 1;
closedBracket.endSide = -1;
const bracketState = /* @__PURE__ */ StateField.define({
  create() {
    return RangeSet.empty;
  },
  update(value, tr) {
    value = value.map(tr.changes);
    if (tr.selection) {
      let line = tr.state.doc.lineAt(tr.selection.main.head);
      value = value.update({ filter: (from) => from >= line.from && from <= line.to });
    }
    for (let effect of tr.effects)
      if (effect.is(closeBracketEffect))
        value = value.update({ add: [closedBracket.range(effect.value, effect.value + 1)] });
    return value;
  }
});
function closeBrackets() {
  return [inputHandler, bracketState];
}
const definedClosing = "()[]{}<>«»»«［］｛｝";
function closing(ch) {
  for (let i = 0; i < definedClosing.length; i += 2)
    if (definedClosing.charCodeAt(i) == ch)
      return definedClosing.charAt(i + 1);
  return fromCodePoint(ch < 128 ? ch : ch + 1);
}
function config(state, pos) {
  return state.languageDataAt("closeBrackets", pos)[0] || defaults;
}
const android = typeof navigator == "object" && /* @__PURE__ */ /Android\b/.test(navigator.userAgent);
const inputHandler = /* @__PURE__ */ EditorView.inputHandler.of((view, from, to, insert) => {
  if ((android ? view.composing : view.compositionStarted) || view.state.readOnly)
    return false;
  let sel = view.state.selection.main;
  if (insert.length > 2 || insert.length == 2 && codePointSize(codePointAt(insert, 0)) == 1 || from != sel.from || to != sel.to)
    return false;
  let tr = insertBracket(view.state, insert);
  if (!tr)
    return false;
  view.dispatch(tr);
  return true;
});
const deleteBracketPair = ({ state, dispatch }) => {
  if (state.readOnly)
    return false;
  let conf = config(state, state.selection.main.head);
  let tokens = conf.brackets || defaults.brackets;
  let dont = null, changes = state.changeByRange((range) => {
    if (range.empty) {
      let before = prevChar(state.doc, range.head);
      for (let token of tokens) {
        if (token == before && nextChar(state.doc, range.head) == closing(codePointAt(token, 0)))
          return {
            changes: { from: range.head - token.length, to: range.head + token.length },
            range: EditorSelection.cursor(range.head - token.length)
          };
      }
    }
    return { range: dont = range };
  });
  if (!dont)
    dispatch(state.update(changes, { scrollIntoView: true, userEvent: "delete.backward" }));
  return !dont;
};
const closeBracketsKeymap = [
  { key: "Backspace", run: deleteBracketPair }
];
function insertBracket(state, bracket2) {
  let conf = config(state, state.selection.main.head);
  let tokens = conf.brackets || defaults.brackets;
  for (let tok of tokens) {
    let closed = closing(codePointAt(tok, 0));
    if (bracket2 == tok)
      return closed == tok ? handleSame(state, tok, tokens.indexOf(tok + tok + tok) > -1, conf) : handleOpen(state, tok, closed, conf.before || defaults.before);
    if (bracket2 == closed && closedBracketAt(state, state.selection.main.from))
      return handleClose(state, tok, closed);
  }
  return null;
}
function closedBracketAt(state, pos) {
  let found = false;
  state.field(bracketState).between(0, state.doc.length, (from) => {
    if (from == pos)
      found = true;
  });
  return found;
}
function nextChar(doc, pos) {
  let next = doc.sliceString(pos, pos + 2);
  return next.slice(0, codePointSize(codePointAt(next, 0)));
}
function prevChar(doc, pos) {
  let prev = doc.sliceString(pos - 2, pos);
  return codePointSize(codePointAt(prev, 0)) == prev.length ? prev : prev.slice(1);
}
function handleOpen(state, open, close, closeBefore) {
  let dont = null, changes = state.changeByRange((range) => {
    if (!range.empty)
      return {
        changes: [{ insert: open, from: range.from }, { insert: close, from: range.to }],
        effects: closeBracketEffect.of(range.to + open.length),
        range: EditorSelection.range(range.anchor + open.length, range.head + open.length)
      };
    let next = nextChar(state.doc, range.head);
    if (!next || /\s/.test(next) || closeBefore.indexOf(next) > -1)
      return {
        changes: { insert: open + close, from: range.head },
        effects: closeBracketEffect.of(range.head + open.length),
        range: EditorSelection.cursor(range.head + open.length)
      };
    return { range: dont = range };
  });
  return dont ? null : state.update(changes, {
    scrollIntoView: true,
    userEvent: "input.type"
  });
}
function handleClose(state, _open, close) {
  let dont = null, changes = state.changeByRange((range) => {
    if (range.empty && nextChar(state.doc, range.head) == close)
      return {
        changes: { from: range.head, to: range.head + close.length, insert: close },
        range: EditorSelection.cursor(range.head + close.length)
      };
    return dont = { range };
  });
  return dont ? null : state.update(changes, {
    scrollIntoView: true,
    userEvent: "input.type"
  });
}
function handleSame(state, token, allowTriple, config2) {
  let stringPrefixes = config2.stringPrefixes || defaults.stringPrefixes;
  let dont = null, changes = state.changeByRange((range) => {
    if (!range.empty)
      return {
        changes: [{ insert: token, from: range.from }, { insert: token, from: range.to }],
        effects: closeBracketEffect.of(range.to + token.length),
        range: EditorSelection.range(range.anchor + token.length, range.head + token.length)
      };
    let pos = range.head, next = nextChar(state.doc, pos), start;
    if (next == token) {
      if (nodeStart(state, pos)) {
        return {
          changes: { insert: token + token, from: pos },
          effects: closeBracketEffect.of(pos + token.length),
          range: EditorSelection.cursor(pos + token.length)
        };
      } else if (closedBracketAt(state, pos)) {
        let isTriple = allowTriple && state.sliceDoc(pos, pos + token.length * 3) == token + token + token;
        let content2 = isTriple ? token + token + token : token;
        return {
          changes: { from: pos, to: pos + content2.length, insert: content2 },
          range: EditorSelection.cursor(pos + content2.length)
        };
      }
    } else if (allowTriple && state.sliceDoc(pos - 2 * token.length, pos) == token + token && (start = canStartStringAt(state, pos - 2 * token.length, stringPrefixes)) > -1 && nodeStart(state, start)) {
      return {
        changes: { insert: token + token + token + token, from: pos },
        effects: closeBracketEffect.of(pos + token.length),
        range: EditorSelection.cursor(pos + token.length)
      };
    } else if (state.charCategorizer(pos)(next) != CharCategory.Word) {
      if (canStartStringAt(state, pos, stringPrefixes) > -1 && !probablyInString(state, pos, token, stringPrefixes))
        return {
          changes: { insert: token + token, from: pos },
          effects: closeBracketEffect.of(pos + token.length),
          range: EditorSelection.cursor(pos + token.length)
        };
    }
    return { range: dont = range };
  });
  return dont ? null : state.update(changes, {
    scrollIntoView: true,
    userEvent: "input.type"
  });
}
function nodeStart(state, pos) {
  let tree = syntaxTree(state).resolveInner(pos + 1);
  return tree.parent && tree.from == pos;
}
function probablyInString(state, pos, quoteToken, prefixes) {
  let node = syntaxTree(state).resolveInner(pos, -1);
  let maxPrefix = prefixes.reduce((m, p) => Math.max(m, p.length), 0);
  for (let i = 0; i < 5; i++) {
    let start = state.sliceDoc(node.from, Math.min(node.to, node.from + quoteToken.length + maxPrefix));
    let quotePos = start.indexOf(quoteToken);
    if (!quotePos || quotePos > -1 && prefixes.indexOf(start.slice(0, quotePos)) > -1) {
      let first = node.firstChild;
      while (first && first.from == node.from && first.to - first.from > quoteToken.length + quotePos) {
        if (state.sliceDoc(first.to - quoteToken.length, first.to) == quoteToken)
          return false;
        first = first.firstChild;
      }
      return true;
    }
    let parent = node.to == pos && node.parent;
    if (!parent)
      break;
    node = parent;
  }
  return false;
}
function canStartStringAt(state, pos, prefixes) {
  let charCat = state.charCategorizer(pos);
  if (charCat(state.sliceDoc(pos - 1, pos)) != CharCategory.Word)
    return pos;
  for (let prefix of prefixes) {
    let start = pos - prefix.length;
    if (state.sliceDoc(start, pos) == prefix && charCat(state.sliceDoc(start - 1, start)) != CharCategory.Word)
      return start;
  }
  return -1;
}
function autocompletion(config2 = {}) {
  return [
    commitCharacters,
    completionState,
    completionConfig.of(config2),
    completionPlugin,
    completionKeymapExt,
    baseTheme$1
  ];
}
const completionKeymap = [
  { key: "Ctrl-Space", run: startCompletion },
  { mac: "Alt-`", run: startCompletion },
  { mac: "Alt-i", run: startCompletion },
  { key: "Escape", run: closeCompletion },
  { key: "ArrowDown", run: /* @__PURE__ */ moveCompletionSelection(true) },
  { key: "ArrowUp", run: /* @__PURE__ */ moveCompletionSelection(false) },
  { key: "PageDown", run: /* @__PURE__ */ moveCompletionSelection(true, "page") },
  { key: "PageUp", run: /* @__PURE__ */ moveCompletionSelection(false, "page") },
  { key: "Enter", run: acceptCompletion }
];
const completionKeymapExt = /* @__PURE__ */ Prec.highest(/* @__PURE__ */ keymap.computeN([completionConfig], (state) => state.facet(completionConfig).defaultKeymap ? [completionKeymap] : []));
function crelt() {
  var elt = arguments[0];
  if (typeof elt == "string") elt = document.createElement(elt);
  var i = 1, next = arguments[1];
  if (next && typeof next == "object" && next.nodeType == null && !Array.isArray(next)) {
    for (var name2 in next) if (Object.prototype.hasOwnProperty.call(next, name2)) {
      var value = next[name2];
      if (typeof value == "string") elt.setAttribute(name2, value);
      else if (value != null) elt[name2] = value;
    }
    i++;
  }
  for (; i < arguments.length; i++) add(elt, arguments[i]);
  return elt;
}
function add(elt, child) {
  if (typeof child == "string") {
    elt.appendChild(document.createTextNode(child));
  } else if (child == null) ;
  else if (child.nodeType != null) {
    elt.appendChild(child);
  } else if (Array.isArray(child)) {
    for (var i = 0; i < child.length; i++) add(elt, child[i]);
  } else {
    throw new RangeError("Unsupported child node: " + child);
  }
}
const basicNormalize = typeof String.prototype.normalize == "function" ? (x) => x.normalize("NFKD") : (x) => x;
class SearchCursor {
  /**
  Create a text cursor. The query is the search string, `from` to
  `to` provides the region to search.
  
  When `normalize` is given, it will be called, on both the query
  string and the content it is matched against, before comparing.
  You can, for example, create a case-insensitive search by
  passing `s => s.toLowerCase()`.
  
  Text is always normalized with
  [`.normalize("NFKD")`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize)
  (when supported).
  */
  constructor(text, query, from = 0, to = text.length, normalize, test) {
    this.test = test;
    this.value = { from: 0, to: 0 };
    this.done = false;
    this.matches = [];
    this.buffer = "";
    this.bufferPos = 0;
    this.iter = text.iterRange(from, to);
    this.bufferStart = from;
    this.normalize = normalize ? (x) => normalize(basicNormalize(x)) : basicNormalize;
    this.query = this.normalize(query);
  }
  peek() {
    if (this.bufferPos == this.buffer.length) {
      this.bufferStart += this.buffer.length;
      this.iter.next();
      if (this.iter.done)
        return -1;
      this.bufferPos = 0;
      this.buffer = this.iter.value;
    }
    return codePointAt(this.buffer, this.bufferPos);
  }
  /**
  Look for the next match. Updates the iterator's
  [`value`](https://codemirror.net/6/docs/ref/#search.SearchCursor.value) and
  [`done`](https://codemirror.net/6/docs/ref/#search.SearchCursor.done) properties. Should be called
  at least once before using the cursor.
  */
  next() {
    while (this.matches.length)
      this.matches.pop();
    return this.nextOverlapping();
  }
  /**
  The `next` method will ignore matches that partially overlap a
  previous match. This method behaves like `next`, but includes
  such matches.
  */
  nextOverlapping() {
    for (; ; ) {
      let next = this.peek();
      if (next < 0) {
        this.done = true;
        return this;
      }
      let str = fromCodePoint(next), start = this.bufferStart + this.bufferPos;
      this.bufferPos += codePointSize(next);
      let norm = this.normalize(str);
      if (norm.length)
        for (let i = 0, pos = start; ; i++) {
          let code = norm.charCodeAt(i);
          let match = this.match(code, pos, this.bufferPos + this.bufferStart);
          if (i == norm.length - 1) {
            if (match) {
              this.value = match;
              return this;
            }
            break;
          }
          if (pos == start && i < str.length && str.charCodeAt(i) == code)
            pos++;
        }
    }
  }
  match(code, pos, end) {
    let match = null;
    for (let i = 0; i < this.matches.length; i += 2) {
      let index = this.matches[i], keep = false;
      if (this.query.charCodeAt(index) == code) {
        if (index == this.query.length - 1) {
          match = { from: this.matches[i + 1], to: end };
        } else {
          this.matches[i]++;
          keep = true;
        }
      }
      if (!keep) {
        this.matches.splice(i, 2);
        i -= 2;
      }
    }
    if (this.query.charCodeAt(0) == code) {
      if (this.query.length == 1)
        match = { from: pos, to: end };
      else
        this.matches.push(1, pos);
    }
    if (match && this.test && !this.test(match.from, match.to, this.buffer, this.bufferStart))
      match = null;
    return match;
  }
}
if (typeof Symbol != "undefined")
  SearchCursor.prototype[Symbol.iterator] = function() {
    return this;
  };
const defaultHighlightOptions = {
  highlightWordAroundCursor: false,
  minSelectionLength: 1,
  maxMatches: 100,
  wholeWords: false
};
const highlightConfig = /* @__PURE__ */ Facet.define({
  combine(options) {
    return combineConfig(options, defaultHighlightOptions, {
      highlightWordAroundCursor: (a, b) => a || b,
      minSelectionLength: Math.min,
      maxMatches: Math.min
    });
  }
});
function highlightSelectionMatches(options) {
  let ext = [defaultTheme, matchHighlighter];
  return ext;
}
const matchDeco = /* @__PURE__ */ Decoration.mark({ class: "cm-selectionMatch" });
const mainMatchDeco = /* @__PURE__ */ Decoration.mark({ class: "cm-selectionMatch cm-selectionMatch-main" });
function insideWordBoundaries(check, state, from, to) {
  return (from == 0 || check(state.sliceDoc(from - 1, from)) != CharCategory.Word) && (to == state.doc.length || check(state.sliceDoc(to, to + 1)) != CharCategory.Word);
}
function insideWord(check, state, from, to) {
  return check(state.sliceDoc(from, from + 1)) == CharCategory.Word && check(state.sliceDoc(to - 1, to)) == CharCategory.Word;
}
const matchHighlighter = /* @__PURE__ */ ViewPlugin.fromClass(class {
  constructor(view) {
    this.decorations = this.getDeco(view);
  }
  update(update) {
    if (update.selectionSet || update.docChanged || update.viewportChanged)
      this.decorations = this.getDeco(update.view);
  }
  getDeco(view) {
    let conf = view.state.facet(highlightConfig);
    let { state } = view, sel = state.selection;
    if (sel.ranges.length > 1)
      return Decoration.none;
    let range = sel.main, query, check = null;
    if (range.empty) {
      if (!conf.highlightWordAroundCursor)
        return Decoration.none;
      let word = state.wordAt(range.head);
      if (!word)
        return Decoration.none;
      check = state.charCategorizer(range.head);
      query = state.sliceDoc(word.from, word.to);
    } else {
      let len = range.to - range.from;
      if (len < conf.minSelectionLength || len > 200)
        return Decoration.none;
      if (conf.wholeWords) {
        query = state.sliceDoc(range.from, range.to);
        check = state.charCategorizer(range.head);
        if (!(insideWordBoundaries(check, state, range.from, range.to) && insideWord(check, state, range.from, range.to)))
          return Decoration.none;
      } else {
        query = state.sliceDoc(range.from, range.to);
        if (!query)
          return Decoration.none;
      }
    }
    let deco = [];
    for (let part of view.visibleRanges) {
      let cursor = new SearchCursor(state.doc, query, part.from, part.to);
      while (!cursor.next().done) {
        let { from, to } = cursor.value;
        if (!check || insideWordBoundaries(check, state, from, to)) {
          if (range.empty && from <= range.from && to >= range.to)
            deco.push(mainMatchDeco.range(from, to));
          else if (from >= range.to || to <= range.from)
            deco.push(matchDeco.range(from, to));
          if (deco.length > conf.maxMatches)
            return Decoration.none;
        }
      }
    }
    return Decoration.set(deco);
  }
}, {
  decorations: (v) => v.decorations
});
const defaultTheme = /* @__PURE__ */ EditorView.baseTheme({
  ".cm-selectionMatch": { backgroundColor: "#99ff7780" },
  ".cm-searchMatch .cm-selectionMatch": { backgroundColor: "transparent" }
});
var define_process_env_default = {};
class Stack {
  /**
  @internal
  */
  constructor(p, stack, state, reducePos, pos, score2, buffer, bufferBase, curContext, lookAhead = 0, parent) {
    this.p = p;
    this.stack = stack;
    this.state = state;
    this.reducePos = reducePos;
    this.pos = pos;
    this.score = score2;
    this.buffer = buffer;
    this.bufferBase = bufferBase;
    this.curContext = curContext;
    this.lookAhead = lookAhead;
    this.parent = parent;
  }
  /**
  @internal
  */
  toString() {
    return `[${this.stack.filter((_, i) => i % 3 == 0).concat(this.state)}]@${this.pos}${this.score ? "!" + this.score : ""}`;
  }
  // Start an empty stack
  /**
  @internal
  */
  static start(p, state, pos = 0) {
    let cx = p.parser.context;
    return new Stack(p, [], state, pos, pos, 0, [], 0, cx ? new StackContext(cx, cx.start) : null, 0, null);
  }
  /**
  The stack's current [context](#lr.ContextTracker) value, if
  any. Its type will depend on the context tracker's type
  parameter, or it will be `null` if there is no context
  tracker.
  */
  get context() {
    return this.curContext ? this.curContext.context : null;
  }
  // Push a state onto the stack, tracking its start position as well
  // as the buffer base at that point.
  /**
  @internal
  */
  pushState(state, start) {
    this.stack.push(this.state, start, this.bufferBase + this.buffer.length);
    this.state = state;
  }
  // Apply a reduce action
  /**
  @internal
  */
  reduce(action) {
    var _a2;
    let depth = action >> 19, type = action & 65535;
    let { parser: parser2 } = this.p;
    let lookaheadRecord = this.reducePos < this.pos - 25;
    if (lookaheadRecord)
      this.setLookAhead(this.pos);
    let dPrec = parser2.dynamicPrecedence(type);
    if (dPrec)
      this.score += dPrec;
    if (depth == 0) {
      this.pushState(parser2.getGoto(this.state, type, true), this.reducePos);
      if (type < parser2.minRepeatTerm)
        this.storeNode(type, this.reducePos, this.reducePos, lookaheadRecord ? 8 : 4, true);
      this.reduceContext(type, this.reducePos);
      return;
    }
    let base2 = this.stack.length - (depth - 1) * 3 - (action & 262144 ? 6 : 0);
    let start = base2 ? this.stack[base2 - 2] : this.p.ranges[0].from, size = this.reducePos - start;
    if (size >= 2e3 && !((_a2 = this.p.parser.nodeSet.types[type]) === null || _a2 === void 0 ? void 0 : _a2.isAnonymous)) {
      if (start == this.p.lastBigReductionStart) {
        this.p.bigReductionCount++;
        this.p.lastBigReductionSize = size;
      } else if (this.p.lastBigReductionSize < size) {
        this.p.bigReductionCount = 1;
        this.p.lastBigReductionStart = start;
        this.p.lastBigReductionSize = size;
      }
    }
    let bufferBase = base2 ? this.stack[base2 - 1] : 0, count = this.bufferBase + this.buffer.length - bufferBase;
    if (type < parser2.minRepeatTerm || action & 131072) {
      let pos = parser2.stateFlag(
        this.state,
        1
        /* StateFlag.Skipped */
      ) ? this.pos : this.reducePos;
      this.storeNode(type, start, pos, count + 4, true);
    }
    if (action & 262144) {
      this.state = this.stack[base2];
    } else {
      let baseStateID = this.stack[base2 - 3];
      this.state = parser2.getGoto(baseStateID, type, true);
    }
    while (this.stack.length > base2)
      this.stack.pop();
    this.reduceContext(type, start);
  }
  // Shift a value into the buffer
  /**
  @internal
  */
  storeNode(term, start, end, size = 4, mustSink = false) {
    if (term == 0 && (!this.stack.length || this.stack[this.stack.length - 1] < this.buffer.length + this.bufferBase)) {
      let cur2 = this, top = this.buffer.length;
      if (top == 0 && cur2.parent) {
        top = cur2.bufferBase - cur2.parent.bufferBase;
        cur2 = cur2.parent;
      }
      if (top > 0 && cur2.buffer[top - 4] == 0 && cur2.buffer[top - 1] > -1) {
        if (start == end)
          return;
        if (cur2.buffer[top - 2] >= start) {
          cur2.buffer[top - 2] = end;
          return;
        }
      }
    }
    if (!mustSink || this.pos == end) {
      this.buffer.push(term, start, end, size);
    } else {
      let index = this.buffer.length;
      if (index > 0 && this.buffer[index - 4] != 0) {
        let mustMove = false;
        for (let scan = index; scan > 0 && this.buffer[scan - 2] > end; scan -= 4) {
          if (this.buffer[scan - 1] >= 0) {
            mustMove = true;
            break;
          }
        }
        if (mustMove)
          while (index > 0 && this.buffer[index - 2] > end) {
            this.buffer[index] = this.buffer[index - 4];
            this.buffer[index + 1] = this.buffer[index - 3];
            this.buffer[index + 2] = this.buffer[index - 2];
            this.buffer[index + 3] = this.buffer[index - 1];
            index -= 4;
            if (size > 4)
              size -= 4;
          }
      }
      this.buffer[index] = term;
      this.buffer[index + 1] = start;
      this.buffer[index + 2] = end;
      this.buffer[index + 3] = size;
    }
  }
  // Apply a shift action
  /**
  @internal
  */
  shift(action, type, start, end) {
    if (action & 131072) {
      this.pushState(action & 65535, this.pos);
    } else if ((action & 262144) == 0) {
      let nextState = action, { parser: parser2 } = this.p;
      if (end > this.pos || type <= parser2.maxNode) {
        this.pos = end;
        if (!parser2.stateFlag(
          nextState,
          1
          /* StateFlag.Skipped */
        ))
          this.reducePos = end;
      }
      this.pushState(nextState, start);
      this.shiftContext(type, start);
      if (type <= parser2.maxNode)
        this.buffer.push(type, start, end, 4);
    } else {
      this.pos = end;
      this.shiftContext(type, start);
      if (type <= this.p.parser.maxNode)
        this.buffer.push(type, start, end, 4);
    }
  }
  // Apply an action
  /**
  @internal
  */
  apply(action, next, nextStart, nextEnd) {
    if (action & 65536)
      this.reduce(action);
    else
      this.shift(action, next, nextStart, nextEnd);
  }
  // Add a prebuilt (reused) node into the buffer.
  /**
  @internal
  */
  useNode(value, next) {
    let index = this.p.reused.length - 1;
    if (index < 0 || this.p.reused[index] != value) {
      this.p.reused.push(value);
      index++;
    }
    let start = this.pos;
    this.reducePos = this.pos = start + value.length;
    this.pushState(next, start);
    this.buffer.push(
      index,
      start,
      this.reducePos,
      -1
      /* size == -1 means this is a reused value */
    );
    if (this.curContext)
      this.updateContext(this.curContext.tracker.reuse(this.curContext.context, value, this, this.p.stream.reset(this.pos - value.length)));
  }
  // Split the stack. Due to the buffer sharing and the fact
  // that `this.stack` tends to stay quite shallow, this isn't very
  // expensive.
  /**
  @internal
  */
  split() {
    let parent = this;
    let off = parent.buffer.length;
    while (off > 0 && parent.buffer[off - 2] > parent.reducePos)
      off -= 4;
    let buffer = parent.buffer.slice(off), base2 = parent.bufferBase + off;
    while (parent && base2 == parent.bufferBase)
      parent = parent.parent;
    return new Stack(this.p, this.stack.slice(), this.state, this.reducePos, this.pos, this.score, buffer, base2, this.curContext, this.lookAhead, parent);
  }
  // Try to recover from an error by 'deleting' (ignoring) one token.
  /**
  @internal
  */
  recoverByDelete(next, nextEnd) {
    let isNode = next <= this.p.parser.maxNode;
    if (isNode)
      this.storeNode(next, this.pos, nextEnd, 4);
    this.storeNode(0, this.pos, nextEnd, isNode ? 8 : 4);
    this.pos = this.reducePos = nextEnd;
    this.score -= 190;
  }
  /**
  Check if the given term would be able to be shifted (optionally
  after some reductions) on this stack. This can be useful for
  external tokenizers that want to make sure they only provide a
  given token when it applies.
  */
  canShift(term) {
    for (let sim = new SimulatedStack(this); ; ) {
      let action = this.p.parser.stateSlot(
        sim.state,
        4
        /* ParseState.DefaultReduce */
      ) || this.p.parser.hasAction(sim.state, term);
      if (action == 0)
        return false;
      if ((action & 65536) == 0)
        return true;
      sim.reduce(action);
    }
  }
  // Apply up to Recover.MaxNext recovery actions that conceptually
  // inserts some missing token or rule.
  /**
  @internal
  */
  recoverByInsert(next) {
    if (this.stack.length >= 300)
      return [];
    let nextStates = this.p.parser.nextStates(this.state);
    if (nextStates.length > 4 << 1 || this.stack.length >= 120) {
      let best = [];
      for (let i = 0, s; i < nextStates.length; i += 2) {
        if ((s = nextStates[i + 1]) != this.state && this.p.parser.hasAction(s, next))
          best.push(nextStates[i], s);
      }
      if (this.stack.length < 120)
        for (let i = 0; best.length < 4 << 1 && i < nextStates.length; i += 2) {
          let s = nextStates[i + 1];
          if (!best.some((v, i2) => i2 & 1 && v == s))
            best.push(nextStates[i], s);
        }
      nextStates = best;
    }
    let result = [];
    for (let i = 0; i < nextStates.length && result.length < 4; i += 2) {
      let s = nextStates[i + 1];
      if (s == this.state)
        continue;
      let stack = this.split();
      stack.pushState(s, this.pos);
      stack.storeNode(0, stack.pos, stack.pos, 4, true);
      stack.shiftContext(nextStates[i], this.pos);
      stack.reducePos = this.pos;
      stack.score -= 200;
      result.push(stack);
    }
    return result;
  }
  // Force a reduce, if possible. Return false if that can't
  // be done.
  /**
  @internal
  */
  forceReduce() {
    let { parser: parser2 } = this.p;
    let reduce = parser2.stateSlot(
      this.state,
      5
      /* ParseState.ForcedReduce */
    );
    if ((reduce & 65536) == 0)
      return false;
    if (!parser2.validAction(this.state, reduce)) {
      let depth = reduce >> 19, term = reduce & 65535;
      let target2 = this.stack.length - depth * 3;
      if (target2 < 0 || parser2.getGoto(this.stack[target2], term, false) < 0) {
        let backup = this.findForcedReduction();
        if (backup == null)
          return false;
        reduce = backup;
      }
      this.storeNode(0, this.pos, this.pos, 4, true);
      this.score -= 100;
    }
    this.reducePos = this.pos;
    this.reduce(reduce);
    return true;
  }
  /**
  Try to scan through the automaton to find some kind of reduction
  that can be applied. Used when the regular ForcedReduce field
  isn't a valid action. @internal
  */
  findForcedReduction() {
    let { parser: parser2 } = this.p, seen = [];
    let explore = (state, depth) => {
      if (seen.includes(state))
        return;
      seen.push(state);
      return parser2.allActions(state, (action) => {
        if (action & (262144 | 131072)) ;
        else if (action & 65536) {
          let rDepth = (action >> 19) - depth;
          if (rDepth > 1) {
            let term = action & 65535, target2 = this.stack.length - rDepth * 3;
            if (target2 >= 0 && parser2.getGoto(this.stack[target2], term, false) >= 0)
              return rDepth << 19 | 65536 | term;
          }
        } else {
          let found = explore(action, depth + 1);
          if (found != null)
            return found;
        }
      });
    };
    return explore(this.state, 0);
  }
  /**
  @internal
  */
  forceAll() {
    while (!this.p.parser.stateFlag(
      this.state,
      2
      /* StateFlag.Accepting */
    )) {
      if (!this.forceReduce()) {
        this.storeNode(0, this.pos, this.pos, 4, true);
        break;
      }
    }
    return this;
  }
  /**
  Check whether this state has no further actions (assumed to be a direct descendant of the
  top state, since any other states must be able to continue
  somehow). @internal
  */
  get deadEnd() {
    if (this.stack.length != 3)
      return false;
    let { parser: parser2 } = this.p;
    return parser2.data[parser2.stateSlot(
      this.state,
      1
      /* ParseState.Actions */
    )] == 65535 && !parser2.stateSlot(
      this.state,
      4
      /* ParseState.DefaultReduce */
    );
  }
  /**
  Restart the stack (put it back in its start state). Only safe
  when this.stack.length == 3 (state is directly below the top
  state). @internal
  */
  restart() {
    this.storeNode(0, this.pos, this.pos, 4, true);
    this.state = this.stack[0];
    this.stack.length = 0;
  }
  /**
  @internal
  */
  sameState(other) {
    if (this.state != other.state || this.stack.length != other.stack.length)
      return false;
    for (let i = 0; i < this.stack.length; i += 3)
      if (this.stack[i] != other.stack[i])
        return false;
    return true;
  }
  /**
  Get the parser used by this stack.
  */
  get parser() {
    return this.p.parser;
  }
  /**
  Test whether a given dialect (by numeric ID, as exported from
  the terms file) is enabled.
  */
  dialectEnabled(dialectID) {
    return this.p.parser.dialect.flags[dialectID];
  }
  shiftContext(term, start) {
    if (this.curContext)
      this.updateContext(this.curContext.tracker.shift(this.curContext.context, term, this, this.p.stream.reset(start)));
  }
  reduceContext(term, start) {
    if (this.curContext)
      this.updateContext(this.curContext.tracker.reduce(this.curContext.context, term, this, this.p.stream.reset(start)));
  }
  /**
  @internal
  */
  emitContext() {
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -3)
      this.buffer.push(this.curContext.hash, this.pos, this.pos, -3);
  }
  /**
  @internal
  */
  emitLookAhead() {
    let last = this.buffer.length - 1;
    if (last < 0 || this.buffer[last] != -4)
      this.buffer.push(this.lookAhead, this.pos, this.pos, -4);
  }
  updateContext(context) {
    if (context != this.curContext.context) {
      let newCx = new StackContext(this.curContext.tracker, context);
      if (newCx.hash != this.curContext.hash)
        this.emitContext();
      this.curContext = newCx;
    }
  }
  /**
  @internal
  */
  setLookAhead(lookAhead) {
    if (lookAhead > this.lookAhead) {
      this.emitLookAhead();
      this.lookAhead = lookAhead;
    }
  }
  /**
  @internal
  */
  close() {
    if (this.curContext && this.curContext.tracker.strict)
      this.emitContext();
    if (this.lookAhead > 0)
      this.emitLookAhead();
  }
}
class StackContext {
  constructor(tracker, context) {
    this.tracker = tracker;
    this.context = context;
    this.hash = tracker.strict ? tracker.hash(context) : 0;
  }
}
class SimulatedStack {
  constructor(start) {
    this.start = start;
    this.state = start.state;
    this.stack = start.stack;
    this.base = this.stack.length;
  }
  reduce(action) {
    let term = action & 65535, depth = action >> 19;
    if (depth == 0) {
      if (this.stack == this.start.stack)
        this.stack = this.stack.slice();
      this.stack.push(this.state, 0, 0);
      this.base += 3;
    } else {
      this.base -= (depth - 1) * 3;
    }
    let goto = this.start.p.parser.getGoto(this.stack[this.base - 3], term, true);
    this.state = goto;
  }
}
class StackBufferCursor {
  constructor(stack, pos, index) {
    this.stack = stack;
    this.pos = pos;
    this.index = index;
    this.buffer = stack.buffer;
    if (this.index == 0)
      this.maybeNext();
  }
  static create(stack, pos = stack.bufferBase + stack.buffer.length) {
    return new StackBufferCursor(stack, pos, pos - stack.bufferBase);
  }
  maybeNext() {
    let next = this.stack.parent;
    if (next != null) {
      this.index = this.stack.bufferBase - next.bufferBase;
      this.stack = next;
      this.buffer = next.buffer;
    }
  }
  get id() {
    return this.buffer[this.index - 4];
  }
  get start() {
    return this.buffer[this.index - 3];
  }
  get end() {
    return this.buffer[this.index - 2];
  }
  get size() {
    return this.buffer[this.index - 1];
  }
  next() {
    this.index -= 4;
    this.pos -= 4;
    if (this.index == 0)
      this.maybeNext();
  }
  fork() {
    return new StackBufferCursor(this.stack, this.pos, this.index);
  }
}
function decodeArray(input, Type = Uint16Array) {
  if (typeof input != "string")
    return input;
  let array = null;
  for (let pos = 0, out = 0; pos < input.length; ) {
    let value = 0;
    for (; ; ) {
      let next = input.charCodeAt(pos++), stop = false;
      if (next == 126) {
        value = 65535;
        break;
      }
      if (next >= 92)
        next--;
      if (next >= 34)
        next--;
      let digit = next - 32;
      if (digit >= 46) {
        digit -= 46;
        stop = true;
      }
      value += digit;
      if (stop)
        break;
      value *= 46;
    }
    if (array)
      array[out++] = value;
    else
      array = new Type(value);
  }
  return array;
}
class CachedToken {
  constructor() {
    this.start = -1;
    this.value = -1;
    this.end = -1;
    this.extended = -1;
    this.lookAhead = 0;
    this.mask = 0;
    this.context = 0;
  }
}
const nullToken = new CachedToken();
class InputStream {
  /**
  @internal
  */
  constructor(input, ranges) {
    this.input = input;
    this.ranges = ranges;
    this.chunk = "";
    this.chunkOff = 0;
    this.chunk2 = "";
    this.chunk2Pos = 0;
    this.next = -1;
    this.token = nullToken;
    this.rangeIndex = 0;
    this.pos = this.chunkPos = ranges[0].from;
    this.range = ranges[0];
    this.end = ranges[ranges.length - 1].to;
    this.readNext();
  }
  /**
  @internal
  */
  resolveOffset(offset, assoc) {
    let range = this.range, index = this.rangeIndex;
    let pos = this.pos + offset;
    while (pos < range.from) {
      if (!index)
        return null;
      let next = this.ranges[--index];
      pos -= range.from - next.to;
      range = next;
    }
    while (assoc < 0 ? pos > range.to : pos >= range.to) {
      if (index == this.ranges.length - 1)
        return null;
      let next = this.ranges[++index];
      pos += next.from - range.to;
      range = next;
    }
    return pos;
  }
  /**
  @internal
  */
  clipPos(pos) {
    if (pos >= this.range.from && pos < this.range.to)
      return pos;
    for (let range of this.ranges)
      if (range.to > pos)
        return Math.max(pos, range.from);
    return this.end;
  }
  /**
  Look at a code unit near the stream position. `.peek(0)` equals
  `.next`, `.peek(-1)` gives you the previous character, and so
  on.
  
  Note that looking around during tokenizing creates dependencies
  on potentially far-away content, which may reduce the
  effectiveness incremental parsing—when looking forward—or even
  cause invalid reparses when looking backward more than 25 code
  units, since the library does not track lookbehind.
  */
  peek(offset) {
    let idx = this.chunkOff + offset, pos, result;
    if (idx >= 0 && idx < this.chunk.length) {
      pos = this.pos + offset;
      result = this.chunk.charCodeAt(idx);
    } else {
      let resolved = this.resolveOffset(offset, 1);
      if (resolved == null)
        return -1;
      pos = resolved;
      if (pos >= this.chunk2Pos && pos < this.chunk2Pos + this.chunk2.length) {
        result = this.chunk2.charCodeAt(pos - this.chunk2Pos);
      } else {
        let i = this.rangeIndex, range = this.range;
        while (range.to <= pos)
          range = this.ranges[++i];
        this.chunk2 = this.input.chunk(this.chunk2Pos = pos);
        if (pos + this.chunk2.length > range.to)
          this.chunk2 = this.chunk2.slice(0, range.to - pos);
        result = this.chunk2.charCodeAt(0);
      }
    }
    if (pos >= this.token.lookAhead)
      this.token.lookAhead = pos + 1;
    return result;
  }
  /**
  Accept a token. By default, the end of the token is set to the
  current stream position, but you can pass an offset (relative to
  the stream position) to change that.
  */
  acceptToken(token, endOffset = 0) {
    let end = endOffset ? this.resolveOffset(endOffset, -1) : this.pos;
    if (end == null || end < this.token.start)
      throw new RangeError("Token end out of bounds");
    this.token.value = token;
    this.token.end = end;
  }
  /**
  Accept a token ending at a specific given position.
  */
  acceptTokenTo(token, endPos) {
    this.token.value = token;
    this.token.end = endPos;
  }
  getChunk() {
    if (this.pos >= this.chunk2Pos && this.pos < this.chunk2Pos + this.chunk2.length) {
      let { chunk, chunkPos } = this;
      this.chunk = this.chunk2;
      this.chunkPos = this.chunk2Pos;
      this.chunk2 = chunk;
      this.chunk2Pos = chunkPos;
      this.chunkOff = this.pos - this.chunkPos;
    } else {
      this.chunk2 = this.chunk;
      this.chunk2Pos = this.chunkPos;
      let nextChunk = this.input.chunk(this.pos);
      let end = this.pos + nextChunk.length;
      this.chunk = end > this.range.to ? nextChunk.slice(0, this.range.to - this.pos) : nextChunk;
      this.chunkPos = this.pos;
      this.chunkOff = 0;
    }
  }
  readNext() {
    if (this.chunkOff >= this.chunk.length) {
      this.getChunk();
      if (this.chunkOff == this.chunk.length)
        return this.next = -1;
    }
    return this.next = this.chunk.charCodeAt(this.chunkOff);
  }
  /**
  Move the stream forward N (defaults to 1) code units. Returns
  the new value of [`next`](#lr.InputStream.next).
  */
  advance(n = 1) {
    this.chunkOff += n;
    while (this.pos + n >= this.range.to) {
      if (this.rangeIndex == this.ranges.length - 1)
        return this.setDone();
      n -= this.range.to - this.pos;
      this.range = this.ranges[++this.rangeIndex];
      this.pos = this.range.from;
    }
    this.pos += n;
    if (this.pos >= this.token.lookAhead)
      this.token.lookAhead = this.pos + 1;
    return this.readNext();
  }
  setDone() {
    this.pos = this.chunkPos = this.end;
    this.range = this.ranges[this.rangeIndex = this.ranges.length - 1];
    this.chunk = "";
    return this.next = -1;
  }
  /**
  @internal
  */
  reset(pos, token) {
    if (token) {
      this.token = token;
      token.start = pos;
      token.lookAhead = pos + 1;
      token.value = token.extended = -1;
    } else {
      this.token = nullToken;
    }
    if (this.pos != pos) {
      this.pos = pos;
      if (pos == this.end) {
        this.setDone();
        return this;
      }
      while (pos < this.range.from)
        this.range = this.ranges[--this.rangeIndex];
      while (pos >= this.range.to)
        this.range = this.ranges[++this.rangeIndex];
      if (pos >= this.chunkPos && pos < this.chunkPos + this.chunk.length) {
        this.chunkOff = pos - this.chunkPos;
      } else {
        this.chunk = "";
        this.chunkOff = 0;
      }
      this.readNext();
    }
    return this;
  }
  /**
  @internal
  */
  read(from, to) {
    if (from >= this.chunkPos && to <= this.chunkPos + this.chunk.length)
      return this.chunk.slice(from - this.chunkPos, to - this.chunkPos);
    if (from >= this.chunk2Pos && to <= this.chunk2Pos + this.chunk2.length)
      return this.chunk2.slice(from - this.chunk2Pos, to - this.chunk2Pos);
    if (from >= this.range.from && to <= this.range.to)
      return this.input.read(from, to);
    let result = "";
    for (let r of this.ranges) {
      if (r.from >= to)
        break;
      if (r.to > from)
        result += this.input.read(Math.max(r.from, from), Math.min(r.to, to));
    }
    return result;
  }
}
class TokenGroup {
  constructor(data, id2) {
    this.data = data;
    this.id = id2;
  }
  token(input, stack) {
    let { parser: parser2 } = stack.p;
    readToken(this.data, input, stack, this.id, parser2.data, parser2.tokenPrecTable);
  }
}
TokenGroup.prototype.contextual = TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
TokenGroup.prototype.fallback = TokenGroup.prototype.extend = false;
class ExternalTokenizer {
  /**
  Create a tokenizer. The first argument is the function that,
  given an input stream, scans for the types of tokens it
  recognizes at the stream's position, and calls
  [`acceptToken`](#lr.InputStream.acceptToken) when it finds
  one.
  */
  constructor(token, options = {}) {
    this.token = token;
    this.contextual = !!options.contextual;
    this.fallback = !!options.fallback;
    this.extend = !!options.extend;
  }
}
function readToken(data, input, stack, group, precTable, precOffset) {
  let state = 0, groupMask = 1 << group, { dialect } = stack.p.parser;
  scan: for (; ; ) {
    if ((groupMask & data[state]) == 0)
      break;
    let accEnd = data[state + 1];
    for (let i = state + 3; i < accEnd; i += 2)
      if ((data[i + 1] & groupMask) > 0) {
        let term = data[i];
        if (dialect.allows(term) && (input.token.value == -1 || input.token.value == term || overrides(term, input.token.value, precTable, precOffset))) {
          input.acceptToken(term);
          break;
        }
      }
    let next = input.next, low = 0, high = data[state + 2];
    if (input.next < 0 && high > low && data[accEnd + high * 3 - 3] == 65535) {
      state = data[accEnd + high * 3 - 1];
      continue scan;
    }
    for (; low < high; ) {
      let mid = low + high >> 1;
      let index = accEnd + mid + (mid << 1);
      let from = data[index], to = data[index + 1] || 65536;
      if (next < from)
        high = mid;
      else if (next >= to)
        low = mid + 1;
      else {
        state = data[index + 2];
        input.advance();
        continue scan;
      }
    }
    break;
  }
}
function findOffset(data, start, term) {
  for (let i = start, next; (next = data[i]) != 65535; i++)
    if (next == term)
      return i - start;
  return -1;
}
function overrides(token, prev, tableData, tableOffset) {
  let iPrev = findOffset(tableData, tableOffset, prev);
  return iPrev < 0 || findOffset(tableData, tableOffset, token) < iPrev;
}
const verbose = typeof process != "undefined" && define_process_env_default && /\bparse\b/.test(define_process_env_default.LOG);
let stackIDs = null;
function cutAt(tree, pos, side) {
  let cursor = tree.cursor(IterMode.IncludeAnonymous);
  cursor.moveTo(pos);
  for (; ; ) {
    if (!(side < 0 ? cursor.childBefore(pos) : cursor.childAfter(pos)))
      for (; ; ) {
        if ((side < 0 ? cursor.to < pos : cursor.from > pos) && !cursor.type.isError)
          return side < 0 ? Math.max(0, Math.min(
            cursor.to - 1,
            pos - 25
            /* Lookahead.Margin */
          )) : Math.min(tree.length, Math.max(
            cursor.from + 1,
            pos + 25
            /* Lookahead.Margin */
          ));
        if (side < 0 ? cursor.prevSibling() : cursor.nextSibling())
          break;
        if (!cursor.parent())
          return side < 0 ? 0 : tree.length;
      }
  }
}
class FragmentCursor {
  constructor(fragments, nodeSet) {
    this.fragments = fragments;
    this.nodeSet = nodeSet;
    this.i = 0;
    this.fragment = null;
    this.safeFrom = -1;
    this.safeTo = -1;
    this.trees = [];
    this.start = [];
    this.index = [];
    this.nextFragment();
  }
  nextFragment() {
    let fr = this.fragment = this.i == this.fragments.length ? null : this.fragments[this.i++];
    if (fr) {
      this.safeFrom = fr.openStart ? cutAt(fr.tree, fr.from + fr.offset, 1) - fr.offset : fr.from;
      this.safeTo = fr.openEnd ? cutAt(fr.tree, fr.to + fr.offset, -1) - fr.offset : fr.to;
      while (this.trees.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
      }
      this.trees.push(fr.tree);
      this.start.push(-fr.offset);
      this.index.push(0);
      this.nextStart = this.safeFrom;
    } else {
      this.nextStart = 1e9;
    }
  }
  // `pos` must be >= any previously given `pos` for this cursor
  nodeAt(pos) {
    if (pos < this.nextStart)
      return null;
    while (this.fragment && this.safeTo <= pos)
      this.nextFragment();
    if (!this.fragment)
      return null;
    for (; ; ) {
      let last = this.trees.length - 1;
      if (last < 0) {
        this.nextFragment();
        return null;
      }
      let top = this.trees[last], index = this.index[last];
      if (index == top.children.length) {
        this.trees.pop();
        this.start.pop();
        this.index.pop();
        continue;
      }
      let next = top.children[index];
      let start = this.start[last] + top.positions[index];
      if (start > pos) {
        this.nextStart = start;
        return null;
      }
      if (next instanceof Tree) {
        if (start == pos) {
          if (start < this.safeFrom)
            return null;
          let end = start + next.length;
          if (end <= this.safeTo) {
            let lookAhead = next.prop(NodeProp.lookAhead);
            if (!lookAhead || end + lookAhead < this.fragment.to)
              return next;
          }
        }
        this.index[last]++;
        if (start + next.length >= Math.max(this.safeFrom, pos)) {
          this.trees.push(next);
          this.start.push(start);
          this.index.push(0);
        }
      } else {
        this.index[last]++;
        this.nextStart = start + next.length;
      }
    }
  }
}
class TokenCache {
  constructor(parser2, stream) {
    this.stream = stream;
    this.tokens = [];
    this.mainToken = null;
    this.actions = [];
    this.tokens = parser2.tokenizers.map((_) => new CachedToken());
  }
  getActions(stack) {
    let actionIndex = 0;
    let main = null;
    let { parser: parser2 } = stack.p, { tokenizers } = parser2;
    let mask = parser2.stateSlot(
      stack.state,
      3
      /* ParseState.TokenizerMask */
    );
    let context = stack.curContext ? stack.curContext.hash : 0;
    let lookAhead = 0;
    for (let i = 0; i < tokenizers.length; i++) {
      if ((1 << i & mask) == 0)
        continue;
      let tokenizer = tokenizers[i], token = this.tokens[i];
      if (main && !tokenizer.fallback)
        continue;
      if (tokenizer.contextual || token.start != stack.pos || token.mask != mask || token.context != context) {
        this.updateCachedToken(token, tokenizer, stack);
        token.mask = mask;
        token.context = context;
      }
      if (token.lookAhead > token.end + 25)
        lookAhead = Math.max(token.lookAhead, lookAhead);
      if (token.value != 0) {
        let startIndex = actionIndex;
        if (token.extended > -1)
          actionIndex = this.addActions(stack, token.extended, token.end, actionIndex);
        actionIndex = this.addActions(stack, token.value, token.end, actionIndex);
        if (!tokenizer.extend) {
          main = token;
          if (actionIndex > startIndex)
            break;
        }
      }
    }
    while (this.actions.length > actionIndex)
      this.actions.pop();
    if (lookAhead)
      stack.setLookAhead(lookAhead);
    if (!main && stack.pos == this.stream.end) {
      main = new CachedToken();
      main.value = stack.p.parser.eofTerm;
      main.start = main.end = stack.pos;
      actionIndex = this.addActions(stack, main.value, main.end, actionIndex);
    }
    this.mainToken = main;
    return this.actions;
  }
  getMainToken(stack) {
    if (this.mainToken)
      return this.mainToken;
    let main = new CachedToken(), { pos, p } = stack;
    main.start = pos;
    main.end = Math.min(pos + 1, p.stream.end);
    main.value = pos == p.stream.end ? p.parser.eofTerm : 0;
    return main;
  }
  updateCachedToken(token, tokenizer, stack) {
    let start = this.stream.clipPos(stack.pos);
    tokenizer.token(this.stream.reset(start, token), stack);
    if (token.value > -1) {
      let { parser: parser2 } = stack.p;
      for (let i = 0; i < parser2.specialized.length; i++)
        if (parser2.specialized[i] == token.value) {
          let result = parser2.specializers[i](this.stream.read(token.start, token.end), stack);
          if (result >= 0 && stack.p.parser.dialect.allows(result >> 1)) {
            if ((result & 1) == 0)
              token.value = result >> 1;
            else
              token.extended = result >> 1;
            break;
          }
        }
    } else {
      token.value = 0;
      token.end = this.stream.clipPos(start + 1);
    }
  }
  putAction(action, token, end, index) {
    for (let i = 0; i < index; i += 3)
      if (this.actions[i] == action)
        return index;
    this.actions[index++] = action;
    this.actions[index++] = token;
    this.actions[index++] = end;
    return index;
  }
  addActions(stack, token, end, index) {
    let { state } = stack, { parser: parser2 } = stack.p, { data } = parser2;
    for (let set = 0; set < 2; set++) {
      for (let i = parser2.stateSlot(
        state,
        set ? 2 : 1
        /* ParseState.Actions */
      ); ; i += 3) {
        if (data[i] == 65535) {
          if (data[i + 1] == 1) {
            i = pair(data, i + 2);
          } else {
            if (index == 0 && data[i + 1] == 2)
              index = this.putAction(pair(data, i + 2), token, end, index);
            break;
          }
        }
        if (data[i] == token)
          index = this.putAction(pair(data, i + 1), token, end, index);
      }
    }
    return index;
  }
}
class Parse {
  constructor(parser2, input, fragments, ranges) {
    this.parser = parser2;
    this.input = input;
    this.ranges = ranges;
    this.recovering = 0;
    this.nextStackID = 9812;
    this.minStackPos = 0;
    this.reused = [];
    this.stoppedAt = null;
    this.lastBigReductionStart = -1;
    this.lastBigReductionSize = 0;
    this.bigReductionCount = 0;
    this.stream = new InputStream(input, ranges);
    this.tokens = new TokenCache(parser2, this.stream);
    this.topTerm = parser2.top[1];
    let { from } = ranges[0];
    this.stacks = [Stack.start(this, parser2.top[0], from)];
    this.fragments = fragments.length && this.stream.end - from > parser2.bufferLength * 4 ? new FragmentCursor(fragments, parser2.nodeSet) : null;
  }
  get parsedPos() {
    return this.minStackPos;
  }
  // Move the parser forward. This will process all parse stacks at
  // `this.pos` and try to advance them to a further position. If no
  // stack for such a position is found, it'll start error-recovery.
  //
  // When the parse is finished, this will return a syntax tree. When
  // not, it returns `null`.
  advance() {
    let stacks = this.stacks, pos = this.minStackPos;
    let newStacks = this.stacks = [];
    let stopped, stoppedTokens;
    if (this.bigReductionCount > 300 && stacks.length == 1) {
      let [s] = stacks;
      while (s.forceReduce() && s.stack.length && s.stack[s.stack.length - 2] >= this.lastBigReductionStart) {
      }
      this.bigReductionCount = this.lastBigReductionSize = 0;
    }
    for (let i = 0; i < stacks.length; i++) {
      let stack = stacks[i];
      for (; ; ) {
        this.tokens.mainToken = null;
        if (stack.pos > pos) {
          newStacks.push(stack);
        } else if (this.advanceStack(stack, newStacks, stacks)) {
          continue;
        } else {
          if (!stopped) {
            stopped = [];
            stoppedTokens = [];
          }
          stopped.push(stack);
          let tok = this.tokens.getMainToken(stack);
          stoppedTokens.push(tok.value, tok.end);
        }
        break;
      }
    }
    if (!newStacks.length) {
      let finished = stopped && findFinished(stopped);
      if (finished) {
        if (verbose)
          console.log("Finish with " + this.stackID(finished));
        return this.stackToTree(finished);
      }
      if (this.parser.strict) {
        if (verbose && stopped)
          console.log("Stuck with token " + (this.tokens.mainToken ? this.parser.getName(this.tokens.mainToken.value) : "none"));
        throw new SyntaxError("No parse at " + pos);
      }
      if (!this.recovering)
        this.recovering = 5;
    }
    if (this.recovering && stopped) {
      let finished = this.stoppedAt != null && stopped[0].pos > this.stoppedAt ? stopped[0] : this.runRecovery(stopped, stoppedTokens, newStacks);
      if (finished) {
        if (verbose)
          console.log("Force-finish " + this.stackID(finished));
        return this.stackToTree(finished.forceAll());
      }
    }
    if (this.recovering) {
      let maxRemaining = this.recovering == 1 ? 1 : this.recovering * 3;
      if (newStacks.length > maxRemaining) {
        newStacks.sort((a, b) => b.score - a.score);
        while (newStacks.length > maxRemaining)
          newStacks.pop();
      }
      if (newStacks.some((s) => s.reducePos > pos))
        this.recovering--;
    } else if (newStacks.length > 1) {
      outer: for (let i = 0; i < newStacks.length - 1; i++) {
        let stack = newStacks[i];
        for (let j = i + 1; j < newStacks.length; j++) {
          let other = newStacks[j];
          if (stack.sameState(other) || stack.buffer.length > 500 && other.buffer.length > 500) {
            if ((stack.score - other.score || stack.buffer.length - other.buffer.length) > 0) {
              newStacks.splice(j--, 1);
            } else {
              newStacks.splice(i--, 1);
              continue outer;
            }
          }
        }
      }
      if (newStacks.length > 12)
        newStacks.splice(
          12,
          newStacks.length - 12
          /* Rec.MaxStackCount */
        );
    }
    this.minStackPos = newStacks[0].pos;
    for (let i = 1; i < newStacks.length; i++)
      if (newStacks[i].pos < this.minStackPos)
        this.minStackPos = newStacks[i].pos;
    return null;
  }
  stopAt(pos) {
    if (this.stoppedAt != null && this.stoppedAt < pos)
      throw new RangeError("Can't move stoppedAt forward");
    this.stoppedAt = pos;
  }
  // Returns an updated version of the given stack, or null if the
  // stack can't advance normally. When `split` and `stacks` are
  // given, stacks split off by ambiguous operations will be pushed to
  // `split`, or added to `stacks` if they move `pos` forward.
  advanceStack(stack, stacks, split) {
    let start = stack.pos, { parser: parser2 } = this;
    let base2 = verbose ? this.stackID(stack) + " -> " : "";
    if (this.stoppedAt != null && start > this.stoppedAt)
      return stack.forceReduce() ? stack : null;
    if (this.fragments) {
      let strictCx = stack.curContext && stack.curContext.tracker.strict, cxHash = strictCx ? stack.curContext.hash : 0;
      for (let cached = this.fragments.nodeAt(start); cached; ) {
        let match = this.parser.nodeSet.types[cached.type.id] == cached.type ? parser2.getGoto(stack.state, cached.type.id) : -1;
        if (match > -1 && cached.length && (!strictCx || (cached.prop(NodeProp.contextHash) || 0) == cxHash)) {
          stack.useNode(cached, match);
          if (verbose)
            console.log(base2 + this.stackID(stack) + ` (via reuse of ${parser2.getName(cached.type.id)})`);
          return true;
        }
        if (!(cached instanceof Tree) || cached.children.length == 0 || cached.positions[0] > 0)
          break;
        let inner = cached.children[0];
        if (inner instanceof Tree && cached.positions[0] == 0)
          cached = inner;
        else
          break;
      }
    }
    let defaultReduce = parser2.stateSlot(
      stack.state,
      4
      /* ParseState.DefaultReduce */
    );
    if (defaultReduce > 0) {
      stack.reduce(defaultReduce);
      if (verbose)
        console.log(base2 + this.stackID(stack) + ` (via always-reduce ${parser2.getName(
          defaultReduce & 65535
          /* Action.ValueMask */
        )})`);
      return true;
    }
    if (stack.stack.length >= 8400) {
      while (stack.stack.length > 6e3 && stack.forceReduce()) {
      }
    }
    let actions = this.tokens.getActions(stack);
    for (let i = 0; i < actions.length; ) {
      let action = actions[i++], term = actions[i++], end = actions[i++];
      let last = i == actions.length || !split;
      let localStack = last ? stack : stack.split();
      let main = this.tokens.mainToken;
      localStack.apply(action, term, main ? main.start : localStack.pos, end);
      if (verbose)
        console.log(base2 + this.stackID(localStack) + ` (via ${(action & 65536) == 0 ? "shift" : `reduce of ${parser2.getName(
          action & 65535
          /* Action.ValueMask */
        )}`} for ${parser2.getName(term)} @ ${start}${localStack == stack ? "" : ", split"})`);
      if (last)
        return true;
      else if (localStack.pos > start)
        stacks.push(localStack);
      else
        split.push(localStack);
    }
    return false;
  }
  // Advance a given stack forward as far as it will go. Returns the
  // (possibly updated) stack if it got stuck, or null if it moved
  // forward and was given to `pushStackDedup`.
  advanceFully(stack, newStacks) {
    let pos = stack.pos;
    for (; ; ) {
      if (!this.advanceStack(stack, null, null))
        return false;
      if (stack.pos > pos) {
        pushStackDedup(stack, newStacks);
        return true;
      }
    }
  }
  runRecovery(stacks, tokens, newStacks) {
    let finished = null, restarted = false;
    for (let i = 0; i < stacks.length; i++) {
      let stack = stacks[i], token = tokens[i << 1], tokenEnd = tokens[(i << 1) + 1];
      let base2 = verbose ? this.stackID(stack) + " -> " : "";
      if (stack.deadEnd) {
        if (restarted)
          continue;
        restarted = true;
        stack.restart();
        if (verbose)
          console.log(base2 + this.stackID(stack) + " (restarted)");
        let done = this.advanceFully(stack, newStacks);
        if (done)
          continue;
      }
      let force = stack.split(), forceBase = base2;
      for (let j = 0; force.forceReduce() && j < 10; j++) {
        if (verbose)
          console.log(forceBase + this.stackID(force) + " (via force-reduce)");
        let done = this.advanceFully(force, newStacks);
        if (done)
          break;
        if (verbose)
          forceBase = this.stackID(force) + " -> ";
      }
      for (let insert of stack.recoverByInsert(token)) {
        if (verbose)
          console.log(base2 + this.stackID(insert) + " (via recover-insert)");
        this.advanceFully(insert, newStacks);
      }
      if (this.stream.end > stack.pos) {
        if (tokenEnd == stack.pos) {
          tokenEnd++;
          token = 0;
        }
        stack.recoverByDelete(token, tokenEnd);
        if (verbose)
          console.log(base2 + this.stackID(stack) + ` (via recover-delete ${this.parser.getName(token)})`);
        pushStackDedup(stack, newStacks);
      } else if (!finished || finished.score < stack.score) {
        finished = stack;
      }
    }
    return finished;
  }
  // Convert the stack's buffer to a syntax tree.
  stackToTree(stack) {
    stack.close();
    return Tree.build({
      buffer: StackBufferCursor.create(stack),
      nodeSet: this.parser.nodeSet,
      topID: this.topTerm,
      maxBufferLength: this.parser.bufferLength,
      reused: this.reused,
      start: this.ranges[0].from,
      length: stack.pos - this.ranges[0].from,
      minRepeatType: this.parser.minRepeatTerm
    });
  }
  stackID(stack) {
    let id2 = (stackIDs || (stackIDs = /* @__PURE__ */ new WeakMap())).get(stack);
    if (!id2)
      stackIDs.set(stack, id2 = String.fromCodePoint(this.nextStackID++));
    return id2 + stack;
  }
}
function pushStackDedup(stack, newStacks) {
  for (let i = 0; i < newStacks.length; i++) {
    let other = newStacks[i];
    if (other.pos == stack.pos && other.sameState(stack)) {
      if (newStacks[i].score < stack.score)
        newStacks[i] = stack;
      return;
    }
  }
  newStacks.push(stack);
}
class Dialect {
  constructor(source, flags, disabled) {
    this.source = source;
    this.flags = flags;
    this.disabled = disabled;
  }
  allows(term) {
    return !this.disabled || this.disabled[term] == 0;
  }
}
const id = (x) => x;
class ContextTracker {
  /**
  Define a context tracker.
  */
  constructor(spec) {
    this.start = spec.start;
    this.shift = spec.shift || id;
    this.reduce = spec.reduce || id;
    this.reuse = spec.reuse || id;
    this.hash = spec.hash || (() => 0);
    this.strict = spec.strict !== false;
  }
}
class LRParser extends Parser {
  /**
  @internal
  */
  constructor(spec) {
    super();
    this.wrappers = [];
    if (spec.version != 14)
      throw new RangeError(`Parser version (${spec.version}) doesn't match runtime version (${14})`);
    let nodeNames = spec.nodeNames.split(" ");
    this.minRepeatTerm = nodeNames.length;
    for (let i = 0; i < spec.repeatNodeCount; i++)
      nodeNames.push("");
    let topTerms = Object.keys(spec.topRules).map((r) => spec.topRules[r][1]);
    let nodeProps = [];
    for (let i = 0; i < nodeNames.length; i++)
      nodeProps.push([]);
    function setProp(nodeID, prop, value) {
      nodeProps[nodeID].push([prop, prop.deserialize(String(value))]);
    }
    if (spec.nodeProps)
      for (let propSpec of spec.nodeProps) {
        let prop = propSpec[0];
        if (typeof prop == "string")
          prop = NodeProp[prop];
        for (let i = 1; i < propSpec.length; ) {
          let next = propSpec[i++];
          if (next >= 0) {
            setProp(next, prop, propSpec[i++]);
          } else {
            let value = propSpec[i + -next];
            for (let j = -next; j > 0; j--)
              setProp(propSpec[i++], prop, value);
            i++;
          }
        }
      }
    this.nodeSet = new NodeSet(nodeNames.map((name2, i) => NodeType.define({
      name: i >= this.minRepeatTerm ? void 0 : name2,
      id: i,
      props: nodeProps[i],
      top: topTerms.indexOf(i) > -1,
      error: i == 0,
      skipped: spec.skippedNodes && spec.skippedNodes.indexOf(i) > -1
    })));
    if (spec.propSources)
      this.nodeSet = this.nodeSet.extend(...spec.propSources);
    this.strict = false;
    this.bufferLength = DefaultBufferLength;
    let tokenArray = decodeArray(spec.tokenData);
    this.context = spec.context;
    this.specializerSpecs = spec.specialized || [];
    this.specialized = new Uint16Array(this.specializerSpecs.length);
    for (let i = 0; i < this.specializerSpecs.length; i++)
      this.specialized[i] = this.specializerSpecs[i].term;
    this.specializers = this.specializerSpecs.map(getSpecializer);
    this.states = decodeArray(spec.states, Uint32Array);
    this.data = decodeArray(spec.stateData);
    this.goto = decodeArray(spec.goto);
    this.maxTerm = spec.maxTerm;
    this.tokenizers = spec.tokenizers.map((value) => typeof value == "number" ? new TokenGroup(tokenArray, value) : value);
    this.topRules = spec.topRules;
    this.dialects = spec.dialects || {};
    this.dynamicPrecedences = spec.dynamicPrecedences || null;
    this.tokenPrecTable = spec.tokenPrec;
    this.termNames = spec.termNames || null;
    this.maxNode = this.nodeSet.types.length - 1;
    this.dialect = this.parseDialect();
    this.top = this.topRules[Object.keys(this.topRules)[0]];
  }
  createParse(input, fragments, ranges) {
    let parse2 = new Parse(this, input, fragments, ranges);
    for (let w of this.wrappers)
      parse2 = w(parse2, input, fragments, ranges);
    return parse2;
  }
  /**
  Get a goto table entry @internal
  */
  getGoto(state, term, loose = false) {
    let table = this.goto;
    if (term >= table[0])
      return -1;
    for (let pos = table[term + 1]; ; ) {
      let groupTag = table[pos++], last = groupTag & 1;
      let target2 = table[pos++];
      if (last && loose)
        return target2;
      for (let end = pos + (groupTag >> 1); pos < end; pos++)
        if (table[pos] == state)
          return target2;
      if (last)
        return -1;
    }
  }
  /**
  Check if this state has an action for a given terminal @internal
  */
  hasAction(state, terminal) {
    let data = this.data;
    for (let set = 0; set < 2; set++) {
      for (let i = this.stateSlot(
        state,
        set ? 2 : 1
        /* ParseState.Actions */
      ), next; ; i += 3) {
        if ((next = data[i]) == 65535) {
          if (data[i + 1] == 1)
            next = data[i = pair(data, i + 2)];
          else if (data[i + 1] == 2)
            return pair(data, i + 2);
          else
            break;
        }
        if (next == terminal || next == 0)
          return pair(data, i + 1);
      }
    }
    return 0;
  }
  /**
  @internal
  */
  stateSlot(state, slot) {
    return this.states[state * 6 + slot];
  }
  /**
  @internal
  */
  stateFlag(state, flag) {
    return (this.stateSlot(
      state,
      0
      /* ParseState.Flags */
    ) & flag) > 0;
  }
  /**
  @internal
  */
  validAction(state, action) {
    return !!this.allActions(state, (a) => a == action ? true : null);
  }
  /**
  @internal
  */
  allActions(state, action) {
    let deflt = this.stateSlot(
      state,
      4
      /* ParseState.DefaultReduce */
    );
    let result = deflt ? action(deflt) : void 0;
    for (let i = this.stateSlot(
      state,
      1
      /* ParseState.Actions */
    ); result == null; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1)
          i = pair(this.data, i + 2);
        else
          break;
      }
      result = action(pair(this.data, i + 1));
    }
    return result;
  }
  /**
  Get the states that can follow this one through shift actions or
  goto jumps. @internal
  */
  nextStates(state) {
    let result = [];
    for (let i = this.stateSlot(
      state,
      1
      /* ParseState.Actions */
    ); ; i += 3) {
      if (this.data[i] == 65535) {
        if (this.data[i + 1] == 1)
          i = pair(this.data, i + 2);
        else
          break;
      }
      if ((this.data[i + 2] & 65536 >> 16) == 0) {
        let value = this.data[i + 1];
        if (!result.some((v, i2) => i2 & 1 && v == value))
          result.push(this.data[i], value);
      }
    }
    return result;
  }
  /**
  Configure the parser. Returns a new parser instance that has the
  given settings modified. Settings not provided in `config` are
  kept from the original parser.
  */
  configure(config2) {
    let copy = Object.assign(Object.create(LRParser.prototype), this);
    if (config2.props)
      copy.nodeSet = this.nodeSet.extend(...config2.props);
    if (config2.top) {
      let info = this.topRules[config2.top];
      if (!info)
        throw new RangeError(`Invalid top rule name ${config2.top}`);
      copy.top = info;
    }
    if (config2.tokenizers)
      copy.tokenizers = this.tokenizers.map((t2) => {
        let found = config2.tokenizers.find((r) => r.from == t2);
        return found ? found.to : t2;
      });
    if (config2.specializers) {
      copy.specializers = this.specializers.slice();
      copy.specializerSpecs = this.specializerSpecs.map((s, i) => {
        let found = config2.specializers.find((r) => r.from == s.external);
        if (!found)
          return s;
        let spec = Object.assign(Object.assign({}, s), { external: found.to });
        copy.specializers[i] = getSpecializer(spec);
        return spec;
      });
    }
    if (config2.contextTracker)
      copy.context = config2.contextTracker;
    if (config2.dialect)
      copy.dialect = this.parseDialect(config2.dialect);
    if (config2.strict != null)
      copy.strict = config2.strict;
    if (config2.wrap)
      copy.wrappers = copy.wrappers.concat(config2.wrap);
    if (config2.bufferLength != null)
      copy.bufferLength = config2.bufferLength;
    return copy;
  }
  /**
  Tells you whether any [parse wrappers](#lr.ParserConfig.wrap)
  are registered for this parser.
  */
  hasWrappers() {
    return this.wrappers.length > 0;
  }
  /**
  Returns the name associated with a given term. This will only
  work for all terms when the parser was generated with the
  `--names` option. By default, only the names of tagged terms are
  stored.
  */
  getName(term) {
    return this.termNames ? this.termNames[term] : String(term <= this.maxNode && this.nodeSet.types[term].name || term);
  }
  /**
  The eof term id is always allocated directly after the node
  types. @internal
  */
  get eofTerm() {
    return this.maxNode + 1;
  }
  /**
  The type of top node produced by the parser.
  */
  get topNode() {
    return this.nodeSet.types[this.top[1]];
  }
  /**
  @internal
  */
  dynamicPrecedence(term) {
    let prec = this.dynamicPrecedences;
    return prec == null ? 0 : prec[term] || 0;
  }
  /**
  @internal
  */
  parseDialect(dialect) {
    let values = Object.keys(this.dialects), flags = values.map(() => false);
    if (dialect)
      for (let part of dialect.split(" ")) {
        let id2 = values.indexOf(part);
        if (id2 >= 0)
          flags[id2] = true;
      }
    let disabled = null;
    for (let i = 0; i < values.length; i++)
      if (!flags[i]) {
        for (let j = this.dialects[values[i]], id2; (id2 = this.data[j++]) != 65535; )
          (disabled || (disabled = new Uint8Array(this.maxTerm + 1)))[id2] = 1;
      }
    return new Dialect(dialect, flags, disabled);
  }
  /**
  Used by the output of the parser generator. Not available to
  user code. @hide
  */
  static deserialize(spec) {
    return new LRParser(spec);
  }
}
function pair(data, off) {
  return data[off] | data[off + 1] << 16;
}
function findFinished(stacks) {
  let best = null;
  for (let stack of stacks) {
    let stopped = stack.p.stoppedAt;
    if ((stack.pos == stack.p.stream.end || stopped != null && stack.pos > stopped) && stack.p.parser.stateFlag(
      stack.state,
      2
      /* StateFlag.Accepting */
    ) && (!best || best.score < stack.score))
      best = stack;
  }
  return best;
}
function getSpecializer(spec) {
  if (spec.external) {
    let mask = spec.extend ? 1 : 0;
    return (value, stack) => spec.external(value, stack) << 1 | mask;
  }
  return spec.get;
}
let nextTagID = 0;
class Tag2 {
  /**
  @internal
  */
  constructor(name2, set, base2, modified) {
    this.name = name2;
    this.set = set;
    this.base = base2;
    this.modified = modified;
    this.id = nextTagID++;
  }
  toString() {
    let { name: name2 } = this;
    for (let mod of this.modified)
      if (mod.name)
        name2 = `${mod.name}(${name2})`;
    return name2;
  }
  static define(nameOrParent, parent) {
    let name2 = typeof nameOrParent == "string" ? nameOrParent : "?";
    if (nameOrParent instanceof Tag2)
      parent = nameOrParent;
    if (parent === null || parent === void 0 ? void 0 : parent.base)
      throw new Error("Can not derive from a modified tag");
    let tag = new Tag2(name2, [], null, []);
    tag.set.push(tag);
    if (parent)
      for (let t2 of parent.set)
        tag.set.push(t2);
    return tag;
  }
  /**
  Define a tag _modifier_, which is a function that, given a tag,
  will return a tag that is a subtag of the original. Applying the
  same modifier to a twice tag will return the same value (`m1(t1)
  == m1(t1)`) and applying multiple modifiers will, regardless or
  order, produce the same tag (`m1(m2(t1)) == m2(m1(t1))`).
  
  When multiple modifiers are applied to a given base tag, each
  smaller set of modifiers is registered as a parent, so that for
  example `m1(m2(m3(t1)))` is a subtype of `m1(m2(t1))`,
  `m1(m3(t1)`, and so on.
  */
  static defineModifier(name2) {
    let mod = new Modifier(name2);
    return (tag) => {
      if (tag.modified.indexOf(mod) > -1)
        return tag;
      return Modifier.get(tag.base || tag, tag.modified.concat(mod).sort((a, b) => a.id - b.id));
    };
  }
}
let nextModifierID = 0;
class Modifier {
  constructor(name2) {
    this.name = name2;
    this.instances = [];
    this.id = nextModifierID++;
  }
  static get(base2, mods) {
    if (!mods.length)
      return base2;
    let exists = mods[0].instances.find((t2) => t2.base == base2 && sameArray(mods, t2.modified));
    if (exists)
      return exists;
    let set = [], tag = new Tag2(base2.name, set, base2, mods);
    for (let m of mods)
      m.instances.push(tag);
    let configs = powerSet(mods);
    for (let parent of base2.set)
      if (!parent.modified.length)
        for (let config2 of configs)
          set.push(Modifier.get(parent, config2));
    return tag;
  }
}
function sameArray(a, b) {
  return a.length == b.length && a.every((x, i) => x == b[i]);
}
function powerSet(array) {
  let sets = [[]];
  for (let i = 0; i < array.length; i++) {
    for (let j = 0, e = sets.length; j < e; j++) {
      sets.push(sets[j].concat(array[i]));
    }
  }
  return sets.sort((a, b) => b.length - a.length);
}
function styleTags(spec) {
  let byName = /* @__PURE__ */ Object.create(null);
  for (let prop in spec) {
    let tags2 = spec[prop];
    if (!Array.isArray(tags2))
      tags2 = [tags2];
    for (let part of prop.split(" "))
      if (part) {
        let pieces = [], mode = 2, rest = part;
        for (let pos = 0; ; ) {
          if (rest == "..." && pos > 0 && pos + 3 == part.length) {
            mode = 1;
            break;
          }
          let m = /^"(?:[^"\\]|\\.)*?"|[^\/!]+/.exec(rest);
          if (!m)
            throw new RangeError("Invalid path: " + part);
          pieces.push(m[0] == "*" ? "" : m[0][0] == '"' ? JSON.parse(m[0]) : m[0]);
          pos += m[0].length;
          if (pos == part.length)
            break;
          let next = part[pos++];
          if (pos == part.length && next == "!") {
            mode = 0;
            break;
          }
          if (next != "/")
            throw new RangeError("Invalid path: " + part);
          rest = part.slice(pos);
        }
        let last = pieces.length - 1, inner = pieces[last];
        if (!inner)
          throw new RangeError("Invalid path: " + part);
        let rule = new Rule(tags2, mode, last > 0 ? pieces.slice(0, last) : null);
        byName[inner] = rule.sort(byName[inner]);
      }
  }
  return ruleNodeProp.add(byName);
}
const ruleNodeProp = new NodeProp({
  combine(a, b) {
    let cur2, root, take;
    while (a || b) {
      if (!a || a.depth > b.depth) {
        take = b;
        b = b.next;
      } else {
        take = a;
        a = a.next;
      }
      let copy = new Rule(take.tags, take.mode, take.context);
      if (cur2)
        cur2.next = copy;
      else
        root = copy;
      cur2 = copy;
    }
    return root;
  }
});
class Rule {
  constructor(tags2, mode, context, next) {
    this.tags = tags2;
    this.mode = mode;
    this.context = context;
    this.next = next;
  }
  get opaque() {
    return this.mode == 0;
  }
  get inherit() {
    return this.mode == 1;
  }
  sort(other) {
    if (!other || other.depth < this.depth) {
      this.next = other;
      return this;
    }
    other.next = this.sort(other.next);
    return other;
  }
  get depth() {
    return this.context ? this.context.length : 0;
  }
}
Rule.empty = new Rule([], 2, null);
function tagHighlighter(tags2, options) {
  let map = /* @__PURE__ */ Object.create(null);
  for (let style of tags2) {
    if (!Array.isArray(style.tag))
      map[style.tag.id] = style.class;
    else
      for (let tag of style.tag)
        map[tag.id] = style.class;
  }
  let { scope, all = null } = {};
  return {
    style: (tags3) => {
      let cls = all;
      for (let tag of tags3) {
        for (let sub of tag.set) {
          let tagClass = map[sub.id];
          if (tagClass) {
            cls = cls ? cls + " " + tagClass : tagClass;
            break;
          }
        }
      }
      return cls;
    },
    scope
  };
}
const t = Tag2.define;
const comment = t(), name = t(), typeName = t(name), propertyName = t(name), literal = t(), string = t(literal), number = t(literal), content = t(), heading = t(content), keyword = t(), operator = t(), punctuation = t(), bracket = t(punctuation), meta = t();
const tags = {
  /**
  A comment.
  */
  comment,
  /**
  A line [comment](#highlight.tags.comment).
  */
  lineComment: t(comment),
  /**
  A block [comment](#highlight.tags.comment).
  */
  blockComment: t(comment),
  /**
  A documentation [comment](#highlight.tags.comment).
  */
  docComment: t(comment),
  /**
  Any kind of identifier.
  */
  name,
  /**
  The [name](#highlight.tags.name) of a variable.
  */
  variableName: t(name),
  /**
  A type [name](#highlight.tags.name).
  */
  typeName,
  /**
  A tag name (subtag of [`typeName`](#highlight.tags.typeName)).
  */
  tagName: t(typeName),
  /**
  A property or field [name](#highlight.tags.name).
  */
  propertyName,
  /**
  An attribute name (subtag of [`propertyName`](#highlight.tags.propertyName)).
  */
  attributeName: t(propertyName),
  /**
  The [name](#highlight.tags.name) of a class.
  */
  className: t(name),
  /**
  A label [name](#highlight.tags.name).
  */
  labelName: t(name),
  /**
  A namespace [name](#highlight.tags.name).
  */
  namespace: t(name),
  /**
  The [name](#highlight.tags.name) of a macro.
  */
  macroName: t(name),
  /**
  A literal value.
  */
  literal,
  /**
  A string [literal](#highlight.tags.literal).
  */
  string,
  /**
  A documentation [string](#highlight.tags.string).
  */
  docString: t(string),
  /**
  A character literal (subtag of [string](#highlight.tags.string)).
  */
  character: t(string),
  /**
  An attribute value (subtag of [string](#highlight.tags.string)).
  */
  attributeValue: t(string),
  /**
  A number [literal](#highlight.tags.literal).
  */
  number,
  /**
  An integer [number](#highlight.tags.number) literal.
  */
  integer: t(number),
  /**
  A floating-point [number](#highlight.tags.number) literal.
  */
  float: t(number),
  /**
  A boolean [literal](#highlight.tags.literal).
  */
  bool: t(literal),
  /**
  Regular expression [literal](#highlight.tags.literal).
  */
  regexp: t(literal),
  /**
  An escape [literal](#highlight.tags.literal), for example a
  backslash escape in a string.
  */
  escape: t(literal),
  /**
  A color [literal](#highlight.tags.literal).
  */
  color: t(literal),
  /**
  A URL [literal](#highlight.tags.literal).
  */
  url: t(literal),
  /**
  A language keyword.
  */
  keyword,
  /**
  The [keyword](#highlight.tags.keyword) for the self or this
  object.
  */
  self: t(keyword),
  /**
  The [keyword](#highlight.tags.keyword) for null.
  */
  null: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) denoting some atomic value.
  */
  atom: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) that represents a unit.
  */
  unit: t(keyword),
  /**
  A modifier [keyword](#highlight.tags.keyword).
  */
  modifier: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) that acts as an operator.
  */
  operatorKeyword: t(keyword),
  /**
  A control-flow related [keyword](#highlight.tags.keyword).
  */
  controlKeyword: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) that defines something.
  */
  definitionKeyword: t(keyword),
  /**
  A [keyword](#highlight.tags.keyword) related to defining or
  interfacing with modules.
  */
  moduleKeyword: t(keyword),
  /**
  An operator.
  */
  operator,
  /**
  An [operator](#highlight.tags.operator) that dereferences something.
  */
  derefOperator: t(operator),
  /**
  Arithmetic-related [operator](#highlight.tags.operator).
  */
  arithmeticOperator: t(operator),
  /**
  Logical [operator](#highlight.tags.operator).
  */
  logicOperator: t(operator),
  /**
  Bit [operator](#highlight.tags.operator).
  */
  bitwiseOperator: t(operator),
  /**
  Comparison [operator](#highlight.tags.operator).
  */
  compareOperator: t(operator),
  /**
  [Operator](#highlight.tags.operator) that updates its operand.
  */
  updateOperator: t(operator),
  /**
  [Operator](#highlight.tags.operator) that defines something.
  */
  definitionOperator: t(operator),
  /**
  Type-related [operator](#highlight.tags.operator).
  */
  typeOperator: t(operator),
  /**
  Control-flow [operator](#highlight.tags.operator).
  */
  controlOperator: t(operator),
  /**
  Program or markup punctuation.
  */
  punctuation,
  /**
  [Punctuation](#highlight.tags.punctuation) that separates
  things.
  */
  separator: t(punctuation),
  /**
  Bracket-style [punctuation](#highlight.tags.punctuation).
  */
  bracket,
  /**
  Angle [brackets](#highlight.tags.bracket) (usually `<` and `>`
  tokens).
  */
  angleBracket: t(bracket),
  /**
  Square [brackets](#highlight.tags.bracket) (usually `[` and `]`
  tokens).
  */
  squareBracket: t(bracket),
  /**
  Parentheses (usually `(` and `)` tokens). Subtag of
  [bracket](#highlight.tags.bracket).
  */
  paren: t(bracket),
  /**
  Braces (usually `{` and `}` tokens). Subtag of
  [bracket](#highlight.tags.bracket).
  */
  brace: t(bracket),
  /**
  Content, for example plain text in XML or markup documents.
  */
  content,
  /**
  [Content](#highlight.tags.content) that represents a heading.
  */
  heading,
  /**
  A level 1 [heading](#highlight.tags.heading).
  */
  heading1: t(heading),
  /**
  A level 2 [heading](#highlight.tags.heading).
  */
  heading2: t(heading),
  /**
  A level 3 [heading](#highlight.tags.heading).
  */
  heading3: t(heading),
  /**
  A level 4 [heading](#highlight.tags.heading).
  */
  heading4: t(heading),
  /**
  A level 5 [heading](#highlight.tags.heading).
  */
  heading5: t(heading),
  /**
  A level 6 [heading](#highlight.tags.heading).
  */
  heading6: t(heading),
  /**
  A prose [content](#highlight.tags.content) separator (such as a horizontal rule).
  */
  contentSeparator: t(content),
  /**
  [Content](#highlight.tags.content) that represents a list.
  */
  list: t(content),
  /**
  [Content](#highlight.tags.content) that represents a quote.
  */
  quote: t(content),
  /**
  [Content](#highlight.tags.content) that is emphasized.
  */
  emphasis: t(content),
  /**
  [Content](#highlight.tags.content) that is styled strong.
  */
  strong: t(content),
  /**
  [Content](#highlight.tags.content) that is part of a link.
  */
  link: t(content),
  /**
  [Content](#highlight.tags.content) that is styled as code or
  monospace.
  */
  monospace: t(content),
  /**
  [Content](#highlight.tags.content) that has a strike-through
  style.
  */
  strikethrough: t(content),
  /**
  Inserted text in a change-tracking format.
  */
  inserted: t(),
  /**
  Deleted text.
  */
  deleted: t(),
  /**
  Changed text.
  */
  changed: t(),
  /**
  An invalid or unsyntactic element.
  */
  invalid: t(),
  /**
  Metadata or meta-instruction.
  */
  meta,
  /**
  [Metadata](#highlight.tags.meta) that applies to the entire
  document.
  */
  documentMeta: t(meta),
  /**
  [Metadata](#highlight.tags.meta) that annotates or adds
  attributes to a given syntactic element.
  */
  annotation: t(meta),
  /**
  Processing instruction or preprocessor directive. Subtag of
  [meta](#highlight.tags.meta).
  */
  processingInstruction: t(meta),
  /**
  [Modifier](#highlight.Tag^defineModifier) that indicates that a
  given element is being defined. Expected to be used with the
  various [name](#highlight.tags.name) tags.
  */
  definition: Tag2.defineModifier("definition"),
  /**
  [Modifier](#highlight.Tag^defineModifier) that indicates that
  something is constant. Mostly expected to be used with
  [variable names](#highlight.tags.variableName).
  */
  constant: Tag2.defineModifier("constant"),
  /**
  [Modifier](#highlight.Tag^defineModifier) used to indicate that
  a [variable](#highlight.tags.variableName) or [property
  name](#highlight.tags.propertyName) is being called or defined
  as a function.
  */
  function: Tag2.defineModifier("function"),
  /**
  [Modifier](#highlight.Tag^defineModifier) that can be applied to
  [names](#highlight.tags.name) to indicate that they belong to
  the language's standard environment.
  */
  standard: Tag2.defineModifier("standard"),
  /**
  [Modifier](#highlight.Tag^defineModifier) that indicates a given
  [names](#highlight.tags.name) is local to some scope.
  */
  local: Tag2.defineModifier("local"),
  /**
  A generic variant [modifier](#highlight.Tag^defineModifier) that
  can be used to tag language-specific alternative variants of
  some common tag. It is recommended for themes to define special
  forms of at least the [string](#highlight.tags.string) and
  [variable name](#highlight.tags.variableName) tags, since those
  come up a lot.
  */
  special: Tag2.defineModifier("special")
};
for (let name2 in tags) {
  let val = tags[name2];
  if (val instanceof Tag2)
    val.name = name2;
}
tagHighlighter([
  { tag: tags.link, class: "tok-link" },
  { tag: tags.heading, class: "tok-heading" },
  { tag: tags.emphasis, class: "tok-emphasis" },
  { tag: tags.strong, class: "tok-strong" },
  { tag: tags.keyword, class: "tok-keyword" },
  { tag: tags.atom, class: "tok-atom" },
  { tag: tags.bool, class: "tok-bool" },
  { tag: tags.url, class: "tok-url" },
  { tag: tags.labelName, class: "tok-labelName" },
  { tag: tags.inserted, class: "tok-inserted" },
  { tag: tags.deleted, class: "tok-deleted" },
  { tag: tags.literal, class: "tok-literal" },
  { tag: tags.string, class: "tok-string" },
  { tag: tags.number, class: "tok-number" },
  { tag: [tags.regexp, tags.escape, tags.special(tags.string)], class: "tok-string2" },
  { tag: tags.variableName, class: "tok-variableName" },
  { tag: tags.local(tags.variableName), class: "tok-variableName tok-local" },
  { tag: tags.definition(tags.variableName), class: "tok-variableName tok-definition" },
  { tag: tags.special(tags.variableName), class: "tok-variableName2" },
  { tag: tags.definition(tags.propertyName), class: "tok-propertyName tok-definition" },
  { tag: tags.typeName, class: "tok-typeName" },
  { tag: tags.namespace, class: "tok-namespace" },
  { tag: tags.className, class: "tok-className" },
  { tag: tags.macroName, class: "tok-macroName" },
  { tag: tags.propertyName, class: "tok-propertyName" },
  { tag: tags.operator, class: "tok-operator" },
  { tag: tags.comment, class: "tok-comment" },
  { tag: tags.meta, class: "tok-meta" },
  { tag: tags.invalid, class: "tok-invalid" },
  { tag: tags.punctuation, class: "tok-punctuation" }
]);
class SelectedDiagnostic {
  constructor(from, to, diagnostic) {
    this.from = from;
    this.to = to;
    this.diagnostic = diagnostic;
  }
}
class LintState {
  constructor(diagnostics, panel, selected) {
    this.diagnostics = diagnostics;
    this.panel = panel;
    this.selected = selected;
  }
  static init(diagnostics, panel, state) {
    let diagnosticFilter = state.facet(lintConfig).markerFilter;
    if (diagnosticFilter)
      diagnostics = diagnosticFilter(diagnostics, state);
    let sorted = diagnostics.slice().sort((a, b) => a.from - b.from || a.to - b.to);
    let deco = new RangeSetBuilder(), active = [], pos = 0;
    for (let i = 0; ; ) {
      let next = i == sorted.length ? null : sorted[i];
      if (!next && !active.length)
        break;
      let from, to;
      if (active.length) {
        from = pos;
        to = active.reduce((p, d) => Math.min(p, d.to), next && next.from > from ? next.from : 1e8);
      } else {
        from = next.from;
        to = next.to;
        active.push(next);
        i++;
      }
      while (i < sorted.length) {
        let next2 = sorted[i];
        if (next2.from == from && (next2.to > next2.from || next2.to == from)) {
          active.push(next2);
          i++;
          to = Math.min(next2.to, to);
        } else {
          to = Math.min(next2.from, to);
          break;
        }
      }
      let sev = maxSeverity(active);
      if (active.some((d) => d.from == d.to || d.from == d.to - 1 && state.doc.lineAt(d.from).to == d.from)) {
        deco.add(from, from, Decoration.widget({
          widget: new DiagnosticWidget(sev),
          diagnostics: active.slice()
        }));
      } else {
        let markClass = active.reduce((c, d) => d.markClass ? c + " " + d.markClass : c, "");
        deco.add(from, to, Decoration.mark({
          class: "cm-lintRange cm-lintRange-" + sev + markClass,
          diagnostics: active.slice(),
          inclusiveEnd: active.some((a) => a.to > to)
        }));
      }
      pos = to;
      for (let i2 = 0; i2 < active.length; i2++)
        if (active[i2].to <= pos)
          active.splice(i2--, 1);
    }
    let set = deco.finish();
    return new LintState(set, panel, findDiagnostic(set));
  }
}
function findDiagnostic(diagnostics, diagnostic = null, after = 0) {
  let found = null;
  diagnostics.between(after, 1e9, (from, to, { spec }) => {
    if (diagnostic && spec.diagnostics.indexOf(diagnostic) < 0)
      return;
    if (!found)
      found = new SelectedDiagnostic(from, to, diagnostic || spec.diagnostics[0]);
    else if (spec.diagnostics.indexOf(found.diagnostic) < 0)
      return false;
    else
      found = new SelectedDiagnostic(found.from, to, found.diagnostic);
  });
  return found;
}
function hideTooltip(tr, tooltip) {
  let from = tooltip.pos, to = tooltip.end || from;
  let result = tr.state.facet(lintConfig).hideOn(tr, from, to);
  if (result != null)
    return result;
  let line = tr.startState.doc.lineAt(tooltip.pos);
  return !!(tr.effects.some((e) => e.is(setDiagnosticsEffect)) || tr.changes.touchesRange(line.from, Math.max(line.to, to)));
}
function maybeEnableLint(state, effects) {
  return state.field(lintState, false) ? effects : effects.concat(StateEffect.appendConfig.of(lintExtensions));
}
function setDiagnostics(state, diagnostics) {
  return {
    effects: maybeEnableLint(state, [setDiagnosticsEffect.of(diagnostics)])
  };
}
const setDiagnosticsEffect = /* @__PURE__ */ StateEffect.define();
const togglePanel = /* @__PURE__ */ StateEffect.define();
const movePanelSelection = /* @__PURE__ */ StateEffect.define();
const lintState = /* @__PURE__ */ StateField.define({
  create() {
    return new LintState(Decoration.none, null, null);
  },
  update(value, tr) {
    if (tr.docChanged && value.diagnostics.size) {
      let mapped = value.diagnostics.map(tr.changes), selected = null, panel = value.panel;
      if (value.selected) {
        let selPos = tr.changes.mapPos(value.selected.from, 1);
        selected = findDiagnostic(mapped, value.selected.diagnostic, selPos) || findDiagnostic(mapped, null, selPos);
      }
      if (!mapped.size && panel && tr.state.facet(lintConfig).autoPanel)
        panel = null;
      value = new LintState(mapped, panel, selected);
    }
    for (let effect of tr.effects) {
      if (effect.is(setDiagnosticsEffect)) {
        let panel = !tr.state.facet(lintConfig).autoPanel ? value.panel : effect.value.length ? LintPanel.open : null;
        value = LintState.init(effect.value, panel, tr.state);
      } else if (effect.is(togglePanel)) {
        value = new LintState(value.diagnostics, effect.value ? LintPanel.open : null, value.selected);
      } else if (effect.is(movePanelSelection)) {
        value = new LintState(value.diagnostics, value.panel, effect.value);
      }
    }
    return value;
  },
  provide: (f) => [
    showPanel.from(f, (val) => val.panel),
    EditorView.decorations.from(f, (s) => s.diagnostics)
  ]
});
const activeMark = /* @__PURE__ */ Decoration.mark({ class: "cm-lintRange cm-lintRange-active" });
function lintTooltip(view, pos, side) {
  let { diagnostics } = view.state.field(lintState);
  let found, start = -1, end = -1;
  diagnostics.between(pos - (side < 0 ? 1 : 0), pos + (side > 0 ? 1 : 0), (from, to, { spec }) => {
    if (pos >= from && pos <= to && (from == to || (pos > from || side > 0) && (pos < to || side < 0))) {
      found = spec.diagnostics;
      start = from;
      end = to;
      return false;
    }
  });
  let diagnosticFilter = view.state.facet(lintConfig).tooltipFilter;
  if (found && diagnosticFilter)
    found = diagnosticFilter(found, view.state);
  if (!found)
    return null;
  return {
    pos: start,
    end,
    above: view.state.doc.lineAt(start).to < end,
    create() {
      return { dom: diagnosticsTooltip(view, found) };
    }
  };
}
function diagnosticsTooltip(view, diagnostics) {
  return crelt("ul", { class: "cm-tooltip-lint" }, diagnostics.map((d) => renderDiagnostic(view, d, false)));
}
const closeLintPanel = (view) => {
  let field = view.state.field(lintState, false);
  if (!field || !field.panel)
    return false;
  view.dispatch({ effects: togglePanel.of(false) });
  return true;
};
const lintPlugin = /* @__PURE__ */ ViewPlugin.fromClass(class {
  constructor(view) {
    this.view = view;
    this.timeout = -1;
    this.set = true;
    let { delay } = view.state.facet(lintConfig);
    this.lintTime = Date.now() + delay;
    this.run = this.run.bind(this);
    this.timeout = setTimeout(this.run, delay);
  }
  run() {
    clearTimeout(this.timeout);
    let now = Date.now();
    if (now < this.lintTime - 10) {
      this.timeout = setTimeout(this.run, this.lintTime - now);
    } else {
      this.set = false;
      let { state } = this.view, { sources } = state.facet(lintConfig);
      if (sources.length)
        batchResults(sources.map((s) => Promise.resolve(s(this.view))), (annotations) => {
          if (this.view.state.doc == state.doc)
            this.view.dispatch(setDiagnostics(this.view.state, annotations.reduce((a, b) => a.concat(b))));
        }, (error) => {
          logException(this.view.state, error);
        });
    }
  }
  update(update) {
    let config2 = update.state.facet(lintConfig);
    if (update.docChanged || config2 != update.startState.facet(lintConfig) || config2.needsRefresh && config2.needsRefresh(update)) {
      this.lintTime = Date.now() + config2.delay;
      if (!this.set) {
        this.set = true;
        this.timeout = setTimeout(this.run, config2.delay);
      }
    }
  }
  force() {
    if (this.set) {
      this.lintTime = Date.now();
      this.run();
    }
  }
  destroy() {
    clearTimeout(this.timeout);
  }
});
function batchResults(promises, sink, error) {
  let collected = [], timeout = -1;
  for (let p of promises)
    p.then((value) => {
      collected.push(value);
      clearTimeout(timeout);
      if (collected.length == promises.length)
        sink(collected);
      else
        timeout = setTimeout(() => sink(collected), 200);
    }, error);
}
const lintConfig = /* @__PURE__ */ Facet.define({
  combine(input) {
    return {
      sources: input.map((i) => i.source).filter((x) => x != null),
      ...combineConfig(input.map((i) => i.config), {
        delay: 750,
        markerFilter: null,
        tooltipFilter: null,
        needsRefresh: null,
        hideOn: () => null
      }, {
        delay: Math.max,
        markerFilter: combineFilter,
        tooltipFilter: combineFilter,
        needsRefresh: (a, b) => !a ? b : !b ? a : (u) => a(u) || b(u),
        hideOn: (a, b) => !a ? b : !b ? a : (t2, x, y) => a(t2, x, y) || b(t2, x, y),
        autoPanel: (a, b) => a || b
      })
    };
  }
});
function combineFilter(a, b) {
  return !a ? b : !b ? a : (d, s) => b(a(d, s), s);
}
function linter(source, config2 = {}) {
  return [
    lintConfig.of({ source, config: config2 }),
    lintPlugin,
    lintExtensions
  ];
}
function assignKeys(actions) {
  let assigned = [];
  if (actions)
    actions: for (let { name: name2 } of actions) {
      for (let i = 0; i < name2.length; i++) {
        let ch = name2[i];
        if (/[a-zA-Z]/.test(ch) && !assigned.some((c) => c.toLowerCase() == ch.toLowerCase())) {
          assigned.push(ch);
          continue actions;
        }
      }
      assigned.push("");
    }
  return assigned;
}
function renderDiagnostic(view, diagnostic, inPanel) {
  var _a2;
  let keys = inPanel ? assignKeys(diagnostic.actions) : [];
  return crelt("li", { class: "cm-diagnostic cm-diagnostic-" + diagnostic.severity }, crelt("span", { class: "cm-diagnosticText" }, diagnostic.renderMessage ? diagnostic.renderMessage(view) : diagnostic.message), (_a2 = diagnostic.actions) === null || _a2 === void 0 ? void 0 : _a2.map((action, i) => {
    let fired = false, click = (e) => {
      e.preventDefault();
      if (fired)
        return;
      fired = true;
      let found = findDiagnostic(view.state.field(lintState).diagnostics, diagnostic);
      if (found)
        action.apply(view, found.from, found.to);
    };
    let { name: name2 } = action, keyIndex = keys[i] ? name2.indexOf(keys[i]) : -1;
    let nameElt = keyIndex < 0 ? name2 : [
      name2.slice(0, keyIndex),
      crelt("u", name2.slice(keyIndex, keyIndex + 1)),
      name2.slice(keyIndex + 1)
    ];
    let markClass = action.markClass ? " " + action.markClass : "";
    return crelt("button", {
      type: "button",
      class: "cm-diagnosticAction" + markClass,
      onclick: click,
      onmousedown: click,
      "aria-label": ` Action: ${name2}${keyIndex < 0 ? "" : ` (access key "${keys[i]})"`}.`
    }, nameElt);
  }), diagnostic.source && crelt("div", { class: "cm-diagnosticSource" }, diagnostic.source));
}
class DiagnosticWidget extends WidgetType {
  constructor(sev) {
    super();
    this.sev = sev;
  }
  eq(other) {
    return other.sev == this.sev;
  }
  toDOM() {
    return crelt("span", { class: "cm-lintPoint cm-lintPoint-" + this.sev });
  }
}
class PanelItem {
  constructor(view, diagnostic) {
    this.diagnostic = diagnostic;
    this.id = "item_" + Math.floor(Math.random() * 4294967295).toString(16);
    this.dom = renderDiagnostic(view, diagnostic, true);
    this.dom.id = this.id;
    this.dom.setAttribute("role", "option");
  }
}
class LintPanel {
  constructor(view) {
    this.view = view;
    this.items = [];
    let onkeydown = (event) => {
      if (event.keyCode == 27) {
        closeLintPanel(this.view);
        this.view.focus();
      } else if (event.keyCode == 38 || event.keyCode == 33) {
        this.moveSelection((this.selectedIndex - 1 + this.items.length) % this.items.length);
      } else if (event.keyCode == 40 || event.keyCode == 34) {
        this.moveSelection((this.selectedIndex + 1) % this.items.length);
      } else if (event.keyCode == 36) {
        this.moveSelection(0);
      } else if (event.keyCode == 35) {
        this.moveSelection(this.items.length - 1);
      } else if (event.keyCode == 13) {
        this.view.focus();
      } else if (event.keyCode >= 65 && event.keyCode <= 90 && this.selectedIndex >= 0) {
        let { diagnostic } = this.items[this.selectedIndex], keys = assignKeys(diagnostic.actions);
        for (let i = 0; i < keys.length; i++)
          if (keys[i].toUpperCase().charCodeAt(0) == event.keyCode) {
            let found = findDiagnostic(this.view.state.field(lintState).diagnostics, diagnostic);
            if (found)
              diagnostic.actions[i].apply(view, found.from, found.to);
          }
      } else {
        return;
      }
      event.preventDefault();
    };
    let onclick = (event) => {
      for (let i = 0; i < this.items.length; i++) {
        if (this.items[i].dom.contains(event.target))
          this.moveSelection(i);
      }
    };
    this.list = crelt("ul", {
      tabIndex: 0,
      role: "listbox",
      "aria-label": this.view.state.phrase("Diagnostics"),
      onkeydown,
      onclick
    });
    this.dom = crelt("div", { class: "cm-panel-lint" }, this.list, crelt("button", {
      type: "button",
      name: "close",
      "aria-label": this.view.state.phrase("close"),
      onclick: () => closeLintPanel(this.view)
    }, "×"));
    this.update();
  }
  get selectedIndex() {
    let selected = this.view.state.field(lintState).selected;
    if (!selected)
      return -1;
    for (let i = 0; i < this.items.length; i++)
      if (this.items[i].diagnostic == selected.diagnostic)
        return i;
    return -1;
  }
  update() {
    let { diagnostics, selected } = this.view.state.field(lintState);
    let i = 0, needsSync = false, newSelectedItem = null;
    let seen = /* @__PURE__ */ new Set();
    diagnostics.between(0, this.view.state.doc.length, (_start, _end, { spec }) => {
      for (let diagnostic of spec.diagnostics) {
        if (seen.has(diagnostic))
          continue;
        seen.add(diagnostic);
        let found = -1, item;
        for (let j = i; j < this.items.length; j++)
          if (this.items[j].diagnostic == diagnostic) {
            found = j;
            break;
          }
        if (found < 0) {
          item = new PanelItem(this.view, diagnostic);
          this.items.splice(i, 0, item);
          needsSync = true;
        } else {
          item = this.items[found];
          if (found > i) {
            this.items.splice(i, found - i);
            needsSync = true;
          }
        }
        if (selected && item.diagnostic == selected.diagnostic) {
          if (!item.dom.hasAttribute("aria-selected")) {
            item.dom.setAttribute("aria-selected", "true");
            newSelectedItem = item;
          }
        } else if (item.dom.hasAttribute("aria-selected")) {
          item.dom.removeAttribute("aria-selected");
        }
        i++;
      }
    });
    while (i < this.items.length && !(this.items.length == 1 && this.items[0].diagnostic.from < 0)) {
      needsSync = true;
      this.items.pop();
    }
    if (this.items.length == 0) {
      this.items.push(new PanelItem(this.view, {
        from: -1,
        to: -1,
        severity: "info",
        message: this.view.state.phrase("No diagnostics")
      }));
      needsSync = true;
    }
    if (newSelectedItem) {
      this.list.setAttribute("aria-activedescendant", newSelectedItem.id);
      this.view.requestMeasure({
        key: this,
        read: () => ({ sel: newSelectedItem.dom.getBoundingClientRect(), panel: this.list.getBoundingClientRect() }),
        write: ({ sel, panel }) => {
          let scaleY = panel.height / this.list.offsetHeight;
          if (sel.top < panel.top)
            this.list.scrollTop -= (panel.top - sel.top) / scaleY;
          else if (sel.bottom > panel.bottom)
            this.list.scrollTop += (sel.bottom - panel.bottom) / scaleY;
        }
      });
    } else if (this.selectedIndex < 0) {
      this.list.removeAttribute("aria-activedescendant");
    }
    if (needsSync)
      this.sync();
  }
  sync() {
    let domPos = this.list.firstChild;
    function rm() {
      let prev = domPos;
      domPos = prev.nextSibling;
      prev.remove();
    }
    for (let item of this.items) {
      if (item.dom.parentNode == this.list) {
        while (domPos != item.dom)
          rm();
        domPos = item.dom.nextSibling;
      } else {
        this.list.insertBefore(item.dom, domPos);
      }
    }
    while (domPos)
      rm();
  }
  moveSelection(selectedIndex) {
    if (this.selectedIndex < 0)
      return;
    let field = this.view.state.field(lintState);
    let selection = findDiagnostic(field.diagnostics, this.items[selectedIndex].diagnostic);
    if (!selection)
      return;
    this.view.dispatch({
      selection: { anchor: selection.from, head: selection.to },
      scrollIntoView: true,
      effects: movePanelSelection.of(selection)
    });
  }
  static open(view) {
    return new LintPanel(view);
  }
}
function svg(content2, attrs = `viewBox="0 0 40 40"`) {
  return `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${encodeURIComponent(content2)}</svg>')`;
}
function underline(color) {
  return svg(`<path d="m0 2.5 l2 -1.5 l1 0 l2 1.5 l1 0" stroke="${color}" fill="none" stroke-width=".7"/>`, `width="6" height="3"`);
}
const baseTheme = /* @__PURE__ */ EditorView.baseTheme({
  ".cm-diagnostic": {
    padding: "3px 6px 3px 8px",
    marginLeft: "-1px",
    display: "block",
    whiteSpace: "pre-wrap"
  },
  ".cm-diagnostic-error": { borderLeft: "5px solid #d11" },
  ".cm-diagnostic-warning": { borderLeft: "5px solid orange" },
  ".cm-diagnostic-info": { borderLeft: "5px solid #999" },
  ".cm-diagnostic-hint": { borderLeft: "5px solid #66d" },
  ".cm-diagnosticAction": {
    font: "inherit",
    border: "none",
    padding: "2px 4px",
    backgroundColor: "#444",
    color: "white",
    borderRadius: "3px",
    marginLeft: "8px",
    cursor: "pointer"
  },
  ".cm-diagnosticSource": {
    fontSize: "70%",
    opacity: 0.7
  },
  ".cm-lintRange": {
    backgroundPosition: "left bottom",
    backgroundRepeat: "repeat-x",
    paddingBottom: "0.7px"
  },
  ".cm-lintRange-error": { backgroundImage: /* @__PURE__ */ underline("#d11") },
  ".cm-lintRange-warning": { backgroundImage: /* @__PURE__ */ underline("orange") },
  ".cm-lintRange-info": { backgroundImage: /* @__PURE__ */ underline("#999") },
  ".cm-lintRange-hint": { backgroundImage: /* @__PURE__ */ underline("#66d") },
  ".cm-lintRange-active": { backgroundColor: "#ffdd9980" },
  ".cm-tooltip-lint": {
    padding: 0,
    margin: 0
  },
  ".cm-lintPoint": {
    position: "relative",
    "&:after": {
      content: '""',
      position: "absolute",
      bottom: 0,
      left: "-2px",
      borderLeft: "3px solid transparent",
      borderRight: "3px solid transparent",
      borderBottom: "4px solid #d11"
    }
  },
  ".cm-lintPoint-warning": {
    "&:after": { borderBottomColor: "orange" }
  },
  ".cm-lintPoint-info": {
    "&:after": { borderBottomColor: "#999" }
  },
  ".cm-lintPoint-hint": {
    "&:after": { borderBottomColor: "#66d" }
  },
  ".cm-panel.cm-panel-lint": {
    position: "relative",
    "& ul": {
      maxHeight: "100px",
      overflowY: "auto",
      "& [aria-selected]": {
        backgroundColor: "#ddd",
        "& u": { textDecoration: "underline" }
      },
      "&:focus [aria-selected]": {
        background_fallback: "#bdf",
        backgroundColor: "Highlight",
        color_fallback: "white",
        color: "HighlightText"
      },
      "& u": { textDecoration: "none" },
      padding: 0,
      margin: 0
    },
    "& [name=close]": {
      position: "absolute",
      top: "0",
      right: "2px",
      background: "inherit",
      border: "none",
      font: "inherit",
      padding: 0,
      margin: 0
    }
  }
});
function severityWeight(sev) {
  return sev == "error" ? 4 : sev == "warning" ? 3 : sev == "info" ? 2 : 1;
}
function maxSeverity(diagnostics) {
  let sev = "hint", weight = 1;
  for (let d of diagnostics) {
    let w = severityWeight(d.severity);
    if (w > weight) {
      weight = w;
      sev = d.severity;
    }
  }
  return sev;
}
const lintExtensions = [
  lintState,
  /* @__PURE__ */ EditorView.decorations.compute([lintState], (state) => {
    let { selected, panel } = state.field(lintState);
    return !selected || !panel || selected.from == selected.to ? Decoration.none : Decoration.set([
      activeMark.range(selected.from, selected.to)
    ]);
  }),
  /* @__PURE__ */ hoverTooltip(lintTooltip, { hideOn: hideTooltip }),
  baseTheme
];
const VerbContent = 1, LstInlineContent = 2, LiteralArgContent = 3, SpaceDelimitedLiteralArgContent = 4, VerbatimContent = 5, Csname = 6, TrailingWhitespaceOnly = 7, TrailingContent = 8, hasMoreArguments = 376, endOfArguments = 377, hasMoreArgumentsOrOptionals = 378, endOfArgumentsAndOptionals = 379, Begin = 9, End = 10, RefCtrlSeq = 11, RefStarrableCtrlSeq = 12, CiteCtrlSeq = 13, CiteStarrableCtrlSeq = 14, LabelCtrlSeq = 15, MathTextCtrlSeq = 16, HboxCtrlSeq = 17, TitleCtrlSeq = 18, DocumentClassCtrlSeq = 19, UsePackageCtrlSeq = 20, HrefCtrlSeq = 21, UrlCtrlSeq = 22, VerbCtrlSeq = 23, LstInlineCtrlSeq = 24, IncludeGraphicsCtrlSeq = 25, CaptionCtrlSeq = 26, DefCtrlSeq = 27, LetCtrlSeq = 28, LeftCtrlSeq = 29, RightCtrlSeq = 30, NewCommandCtrlSeq = 31, RenewCommandCtrlSeq = 32, NewEnvironmentCtrlSeq = 33, RenewEnvironmentCtrlSeq = 34, BookCtrlSeq = 35, PartCtrlSeq = 36, ChapterCtrlSeq = 37, SectionCtrlSeq = 38, SubSectionCtrlSeq = 39, SubSubSectionCtrlSeq = 40, ParagraphCtrlSeq = 41, SubParagraphCtrlSeq = 42, InputCtrlSeq = 43, IncludeCtrlSeq = 44, ItemCtrlSeq = 45, NewTheoremCtrlSeq = 46, TheoremStyleCtrlSeq = 47, CenteringCtrlSeq = 48, BibliographyCtrlSeq = 49, BibliographyStyleCtrlSeq = 50, AuthorCtrlSeq = 51, AffilCtrlSeq = 52, AffiliationCtrlSeq = 53, DateCtrlSeq = 54, MaketitleCtrlSeq = 55, TextColorCtrlSeq = 56, ColorBoxCtrlSeq = 57, HLineCtrlSeq = 58, TopRuleCtrlSeq = 59, MidRuleCtrlSeq = 60, BottomRuleCtrlSeq = 61, MultiColumnCtrlSeq = 62, ParBoxCtrlSeq = 63, TextBoldCtrlSeq = 64, TextItalicCtrlSeq = 65, TextSmallCapsCtrlSeq = 66, TextTeletypeCtrlSeq = 67, TextMediumCtrlSeq = 68, TextSansSerifCtrlSeq = 69, TextSuperscriptCtrlSeq = 70, TextSubscriptCtrlSeq = 71, TextStrikeOutCtrlSeq = 72, EmphasisCtrlSeq = 73, UnderlineCtrlSeq = 74, SetLengthCtrlSeq = 75, DocumentEnvName = 76, TabularEnvName = 77, EquationEnvName = 78, EquationArrayEnvName = 79, VerbatimEnvName = 80, TikzPictureEnvName = 81, FigureEnvName = 82, ListEnvName = 83, TableEnvName = 84, OpenParenCtrlSym = 85, CloseParenCtrlSym = 86, OpenBracketCtrlSym = 87, CloseBracketCtrlSym = 88, LineBreakCtrlSym = 89, KnownEnvironment = 94;
const MAX_ARGUMENT_LOOKAHEAD = 100;
function nameChar(ch) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122 || ch >= 48 && ch <= 57 || ch === 42 || ch === 43 || ch === 64;
}
function alphaChar(ch) {
  return ch >= 65 && ch <= 90 || ch >= 97 && ch <= 122;
}
let cachedName = null;
let cachedInput = null;
let cachedPos = 0;
function envNameAfter(input, offset) {
  const pos = input.pos + offset;
  if (cachedInput === input && cachedPos === pos) {
    return cachedName;
  }
  if (input.peek(offset) !== "{".charCodeAt(0)) return;
  offset++;
  let name2 = "";
  for (; ; ) {
    const next = input.peek(offset);
    if (!nameChar(next)) break;
    name2 += String.fromCharCode(next);
    offset++;
  }
  cachedInput = input;
  cachedPos = pos;
  return cachedName = name2 || null;
}
function ElementContext(name2, parent) {
  this.name = name2;
  this.parent = parent;
  this.hash = parent ? parent.hash : 0;
  for (let i = 0; i < name2.length; i++)
    this.hash += (this.hash << 4) + name2.charCodeAt(i) + (name2.charCodeAt(i) << 8);
}
const elementContext = new ContextTracker({
  start: null,
  shift(context, term, stack, input) {
    return term === Begin ? new ElementContext(envNameAfter(input, "\\begin".length) || "", context) : context;
  },
  reduce(context, term) {
    return term === KnownEnvironment && context ? context.parent : context;
  },
  reuse(context, node, _stack, input) {
    const type = node.type.id;
    return type === Begin ? new ElementContext(envNameAfter(input, 0) || "", context) : context;
  },
  hash(context) {
    return context ? context.hash : 0;
  },
  strict: false
});
const verbTokenizer = new ExternalTokenizer(
  (input, stack) => {
    if (input.next === "*".charCodeAt(0)) input.advance();
    const delimiter = input.next;
    if (delimiter === -1) return;
    if (/\s|\*/.test(String.fromCharCode(delimiter))) return;
    input.advance();
    for (; ; ) {
      const next = input.next;
      if (next === -1 || next === CHAR_NEWLINE) return;
      input.advance();
      if (next === delimiter) break;
    }
    return input.acceptToken(VerbContent);
  },
  { contextual: false }
);
const lstinlineTokenizer = new ExternalTokenizer(
  (input, stack) => {
    let delimiter = input.next;
    if (delimiter === -1) return;
    if (/\s/.test(String.fromCharCode(delimiter))) {
      return;
    }
    if (delimiter === CHAR_OPEN_BRACE) {
      delimiter = CHAR_CLOSE_BRACE;
    }
    input.advance();
    for (; ; ) {
      const next = input.next;
      if (next === -1 || next === CHAR_NEWLINE) return;
      input.advance();
      if (next === delimiter) break;
    }
    return input.acceptToken(LstInlineContent);
  },
  { contextual: false }
);
const matchForward = (input, expected, offset = 0) => {
  for (let i = 0; i < expected.length; i++) {
    if (String.fromCharCode(input.peek(offset + i)) !== expected[i]) {
      return false;
    }
  }
  return true;
};
const verbatimTokenizer = new ExternalTokenizer(
  (input, stack) => {
    const delimiter = "\\end{" + stack.context.name + "}";
    for (let offset = 0; ; offset++) {
      const next = input.peek(offset);
      if (next === -1 || matchForward(input, delimiter, offset)) {
        return input.acceptToken(VerbatimContent, offset);
      }
    }
  },
  { contextual: false }
);
const literalArgTokenizer = new ExternalTokenizer(
  (input) => {
    for (let offset = 0; ; offset++) {
      const next = input.peek(offset);
      if (next === -1 || next === CHAR_CLOSE_BRACE) {
        return input.acceptToken(LiteralArgContent, offset);
      }
    }
  },
  { contextual: false }
);
const spaceDelimitedLiteralArgTokenizer = new ExternalTokenizer(
  (input) => {
    for (let offset = 0; ; offset++) {
      const next = input.peek(offset);
      if (next === -1 || next === CHAR_SPACE || next === CHAR_NEWLINE) {
        return input.acceptToken(SpaceDelimitedLiteralArgContent, offset);
      }
    }
  },
  { contextual: false }
);
function _char(s) {
  return s.charCodeAt(0);
}
const CHAR_BACKSLASH = _char("\\");
const CHAR_OPEN_BRACE = _char("{");
const CHAR_OPEN_BRACKET = _char("[");
const CHAR_CLOSE_BRACE = _char("}");
const CHAR_TAB = _char("	");
const CHAR_SPACE = _char(" ");
const CHAR_NEWLINE = _char("\n");
const lookaheadTokenizer = (getToken) => new ExternalTokenizer(
  (input) => {
    for (let i = 0; i < MAX_ARGUMENT_LOOKAHEAD; ++i) {
      const next = input.peek(i);
      if (next === CHAR_SPACE || next === CHAR_TAB) {
        continue;
      }
      const token = getToken(next);
      if (token) {
        input.acceptToken(token);
        return;
      }
    }
  },
  { contextual: false, fallback: true }
);
const argumentListTokenizer = lookaheadTokenizer((next) => {
  if (next === CHAR_OPEN_BRACE) {
    return hasMoreArguments;
  } else {
    return endOfArguments;
  }
});
const argumentListWithOptionalTokenizer = lookaheadTokenizer((next) => {
  if (next === CHAR_OPEN_BRACE || next === CHAR_OPEN_BRACKET) {
    return hasMoreArgumentsOrOptionals;
  } else {
    return endOfArgumentsAndOptionals;
  }
});
const CHAR_AT_SYMBOL = _char("@");
const csnameTokenizer = new ExternalTokenizer((input, stack) => {
  let offset = 0;
  let end = -1;
  const next = input.peek(offset);
  if (next === -1) {
    return;
  }
  if (next !== CHAR_BACKSLASH) {
    return;
  }
  offset++;
  for (; ; ) {
    const next2 = input.peek(offset);
    if (next2 === -1 || !(alphaChar(next2) || next2 === CHAR_AT_SYMBOL)) {
      end = offset - 1;
      break;
    }
    end = offset;
    offset++;
  }
  if (end === -1) return;
  return input.acceptToken(Csname, end + 1);
});
const END_DOCUMENT_MARK = "\\end{document}".split("").reverse();
const trailingContentTokenizer = new ExternalTokenizer(
  (input, stack) => {
    if (input.next === -1) return;
    for (let i = 1; i < END_DOCUMENT_MARK.length + 1; i++) {
      if (String.fromCharCode(input.peek(-i)) !== END_DOCUMENT_MARK[i - 1]) {
        return;
      }
    }
    while (input.next === CHAR_SPACE || input.next === CHAR_NEWLINE) {
      const next = input.advance();
      if (next === -1) return input.acceptToken(TrailingWhitespaceOnly);
    }
    while (input.advance() !== -1) {
    }
    return input.acceptToken(TrailingContent);
  }
);
const refCommands = /* @__PURE__ */ new Set([
  "\\fullref",
  "\\Vref",
  "\\autopageref",
  "\\autoref",
  "\\eqref",
  "\\labelcpageref",
  "\\labelcref",
  "\\lcnamecref",
  "\\lcnamecrefs",
  "\\namecref",
  "\\nameCref",
  "\\namecrefs",
  "\\nameCrefs",
  "\\thnameref",
  "\\thref",
  "\\titleref",
  "\\vrefrange",
  "\\Crefrange",
  "\\Crefrang",
  "\\fref",
  "\\pref",
  "\\tref",
  "\\Aref",
  "\\Bref",
  "\\Pref",
  "\\Sref",
  "\\vref",
  "\\nameref"
]);
const refStarrableCommands = /* @__PURE__ */ new Set([
  "\\vpageref",
  "\\vref",
  "\\zcpageref",
  "\\zcref",
  "\\zfullref",
  "\\zref",
  "\\zvpageref",
  "\\zvref",
  "\\cref",
  "\\Cref",
  "\\pageref",
  "\\ref",
  "\\Ref",
  "\\subref",
  "\\zpageref",
  "\\ztitleref",
  "\\vpagerefrange",
  "\\zvpagerefrange",
  "\\zvrefrange",
  "\\crefrange"
]);
const citeCommands = /* @__PURE__ */ new Set([
  "\\autocites",
  "\\Autocites",
  "\\Cite",
  "\\citeA",
  "\\citealp",
  "\\Citealp",
  "\\citealt",
  "\\Citealt",
  "\\citeauthorNP",
  "\\citeauthorp",
  "\\Citeauthorp",
  "\\citeauthort",
  "\\Citeauthort",
  "\\citeNP",
  "\\citenum",
  "\\citen",
  "\\citeonline",
  "\\cites",
  "\\Cites",
  "\\citeurl",
  "\\citeyearpar",
  "\\defcitealias",
  "\\fnotecite",
  "\\footcite",
  "\\footcitetext",
  "\\footfullcite",
  "\\footnotecites",
  "\\Footnotecites",
  "\\fullcite",
  "\\fullciteA",
  "\\fullciteauthor",
  "\\fullciteauthorNP",
  "\\maskcite",
  "\\maskciteA",
  "\\maskcitealp",
  "\\maskCitealp",
  "\\maskcitealt",
  "\\maskCitealt",
  "\\maskciteauthor",
  "\\maskciteauthorNP",
  "\\maskciteauthorp",
  "\\maskCiteauthorp",
  "\\maskciteauthort",
  "\\maskCiteauthort",
  "\\maskciteNP",
  "\\maskcitenum",
  "\\maskcitep",
  "\\maskCitep",
  "\\maskcitepalias",
  "\\maskcitet",
  "\\maskCitet",
  "\\maskcitetalias",
  "\\maskciteyear",
  "\\maskciteyearNP",
  "\\maskciteyearpar",
  "\\maskfullcite",
  "\\maskfullciteA",
  "\\maskfullciteauthor",
  "\\maskfullciteauthorNP",
  "\\masknocite",
  "\\maskshortcite",
  "\\maskshortciteA",
  "\\maskshortciteauthor",
  "\\maskshortciteauthorNP",
  "\\maskshortciteNP",
  "\\mautocite",
  "\\Mautocite",
  "\\mcite",
  "\\Mcite",
  "\\mfootcite",
  "\\mfootcitetext",
  "\\mparencite",
  "\\Mparencite",
  "\\msupercite",
  "\\mtextcite",
  "\\Mtextcite",
  "\\nocite",
  "\\nocitemeta",
  "\\notecite",
  "\\Parencite",
  "\\parencites",
  "\\Parencites",
  "\\pnotecite",
  "\\shortcite",
  "\\shortciteA",
  "\\shortciteauthor",
  "\\shortciteauthorNP",
  "\\shortciteNP",
  "\\smartcite",
  "\\Smartcite",
  "\\smartcites",
  "\\Smartcites",
  "\\supercite",
  "\\supercites",
  "\\textcite",
  "\\Textcite",
  "\\textcites",
  "\\Textcites"
]);
const citeStarredCommands = /* @__PURE__ */ new Set([
  "\\cite",
  "\\citeauthor",
  "\\Citeauthor",
  "\\citedate",
  "\\citep",
  "\\citepalias",
  "\\Citep",
  "\\citetitle",
  "\\citeyear",
  "\\parencite",
  "\\citet",
  "\\citetalias",
  "\\autocite",
  "\\Autocite"
]);
const labelCommands = /* @__PURE__ */ new Set(["\\label", "\\thlabel", "\\zlabel"]);
const mathTextCommands = /* @__PURE__ */ new Set(["\\text", "\\tag", "\\textrm", "\\intertext"]);
const otherKnowncommands = {
  "\\hbox": HboxCtrlSeq,
  "\\title": TitleCtrlSeq,
  "\\author": AuthorCtrlSeq,
  "\\affil": AffilCtrlSeq,
  "\\affiliation": AffiliationCtrlSeq,
  "\\date": DateCtrlSeq,
  "\\documentclass": DocumentClassCtrlSeq,
  "\\usepackage": UsePackageCtrlSeq,
  "\\href": HrefCtrlSeq,
  "\\url": UrlCtrlSeq,
  "\\verb": VerbCtrlSeq,
  "\\lstinline": LstInlineCtrlSeq,
  "\\includegraphics": IncludeGraphicsCtrlSeq,
  "\\caption": CaptionCtrlSeq,
  "\\def": DefCtrlSeq,
  "\\let": LetCtrlSeq,
  "\\left": LeftCtrlSeq,
  "\\right": RightCtrlSeq,
  "\\newcommand": NewCommandCtrlSeq,
  "\\renewcommand": RenewCommandCtrlSeq,
  "\\newenvironment": NewEnvironmentCtrlSeq,
  "\\renewenvironment": RenewEnvironmentCtrlSeq,
  "\\book": BookCtrlSeq,
  "\\part": PartCtrlSeq,
  "\\addpart": PartCtrlSeq,
  "\\chapter": ChapterCtrlSeq,
  "\\addchap": ChapterCtrlSeq,
  "\\section": SectionCtrlSeq,
  "\\addseq": SectionCtrlSeq,
  "\\subsection": SubSectionCtrlSeq,
  "\\subsubsection": SubSubSectionCtrlSeq,
  "\\paragraph": ParagraphCtrlSeq,
  "\\subparagraph": SubParagraphCtrlSeq,
  "\\input": InputCtrlSeq,
  "\\include": IncludeCtrlSeq,
  "\\item": ItemCtrlSeq,
  "\\centering": CenteringCtrlSeq,
  "\\newtheorem": NewTheoremCtrlSeq,
  "\\theoremstyle": TheoremStyleCtrlSeq,
  "\\bibliography": BibliographyCtrlSeq,
  "\\bibliographystyle": BibliographyStyleCtrlSeq,
  "\\maketitle": MaketitleCtrlSeq,
  "\\textcolor": TextColorCtrlSeq,
  "\\colorbox": ColorBoxCtrlSeq,
  "\\hline": HLineCtrlSeq,
  "\\toprule": TopRuleCtrlSeq,
  "\\midrule": MidRuleCtrlSeq,
  "\\bottomrule": BottomRuleCtrlSeq,
  "\\multicolumn": MultiColumnCtrlSeq,
  "\\parbox": ParBoxCtrlSeq,
  "\\textbf": TextBoldCtrlSeq,
  "\\textit": TextItalicCtrlSeq,
  "\\textsc": TextSmallCapsCtrlSeq,
  "\\texttt": TextTeletypeCtrlSeq,
  "\\textmd": TextMediumCtrlSeq,
  "\\textsf": TextSansSerifCtrlSeq,
  "\\textsuperscript": TextSuperscriptCtrlSeq,
  "\\textsubscript": TextSubscriptCtrlSeq,
  "\\sout": TextStrikeOutCtrlSeq,
  "\\emph": EmphasisCtrlSeq,
  "\\underline": UnderlineCtrlSeq,
  "\\setlength": SetLengthCtrlSeq
};
const specializeCtrlSeq = (name2, terms) => {
  if (name2 === "\\begin") return Begin;
  if (name2 === "\\end") return End;
  if (refCommands.has(name2)) {
    return RefCtrlSeq;
  }
  if (refStarrableCommands.has(name2)) {
    return RefStarrableCtrlSeq;
  }
  if (citeCommands.has(name2)) {
    return CiteCtrlSeq;
  }
  if (citeStarredCommands.has(name2)) {
    return CiteStarrableCtrlSeq;
  }
  if (labelCommands.has(name2)) {
    return LabelCtrlSeq;
  }
  if (mathTextCommands.has(name2)) {
    return MathTextCtrlSeq;
  }
  return otherKnowncommands[name2] || -1;
};
const tabularEnvNames = /* @__PURE__ */ new Set([
  "tabular",
  "xltabular",
  "tabularx",
  "longtable"
]);
const equationEnvNames = /* @__PURE__ */ new Set([
  "equation",
  "equation*",
  "displaymath",
  "displaymath*",
  "math",
  "math*",
  "multline",
  "multline*",
  "matrix",
  "tikzcd"
]);
const equationArrayEnvNames = /* @__PURE__ */ new Set([
  "array",
  "eqnarray",
  "eqnarray*",
  "align",
  "align*",
  "alignat",
  "alignat*",
  "flalign",
  "flalign*",
  "gather",
  "gather*",
  "pmatrix",
  "pmatrix*",
  "bmatrix",
  "bmatrix*",
  "Bmatrix",
  "Bmatrix*",
  "vmatrix",
  "vmatrix*",
  "Vmatrix",
  "Vmatrix*",
  "smallmatrix",
  "smallmatrix*",
  "split",
  "split*",
  "gathered",
  "gathered*",
  "aligned",
  "aligned*",
  "alignedat",
  "alignedat*",
  "cases",
  "cases*",
  "dcases",
  "dcases*",
  "rcases",
  "rcases*",
  "IEEEeqnarray",
  "IEEEeqnarray*"
]);
const verbatimEnvNames = /* @__PURE__ */ new Set([
  "verbatim",
  "boxedverbatim",
  "lstlisting",
  "minted",
  "Verbatim",
  "lstlisting",
  "tcblisting",
  "codeexample",
  "comment"
]);
const otherKnownEnvNames = {
  document: DocumentEnvName,
  tikzpicture: TikzPictureEnvName,
  figure: FigureEnvName,
  "figure*": FigureEnvName,
  subfigure: FigureEnvName,
  enumerate: ListEnvName,
  itemize: ListEnvName,
  table: TableEnvName,
  description: ListEnvName
};
const specializeEnvName = (name2, terms) => {
  if (tabularEnvNames.has(name2)) {
    return TabularEnvName;
  }
  if (equationEnvNames.has(name2)) {
    return EquationEnvName;
  }
  if (equationArrayEnvNames.has(name2)) {
    return EquationArrayEnvName;
  }
  if (verbatimEnvNames.has(name2)) {
    return VerbatimEnvName;
  }
  return otherKnownEnvNames[name2] || -1;
};
const otherKnownCtrlSyms = {
  "\\(": OpenParenCtrlSym,
  "\\)": CloseParenCtrlSym,
  "\\[": OpenBracketCtrlSym,
  "\\]": CloseBracketCtrlSym,
  "\\\\": LineBreakCtrlSym
};
const specializeCtrlSym = (name2, terms) => {
  return otherKnownCtrlSyms[name2] || -1;
};
const parser = LRParser.deserialize({
  version: 14,
  states: "$EUOVQ#tOOOOQO'#Kl'#KlO&fQ#tO'#EpOVQ#tO'#EoO&kQ#tO'#EiO&vQ#tO'#EuO'RQ#tO'#EvO'^Q#tO'#EwO'iQ#tO'#ExO'tQ#tO'#E|O(PQ#tO'#FOO(XQ#tO'#FQO(aQ#tO'#FSO(lQ#tO'#FUO(tQ#tO'#FVO(|Q#tO'#FWO)UQ&jO'#FYO)aQ#tO'#FZO)iQ#tO'#F[O)qQ#uO'#F]O)vQ#vO'#F^O*RQ#tO'#F_O*^Q&jO'#FbO*lQ#tO'#FcO*tQ#tO'#FeO+PQ&jO'#FeO+_Q#tO'#FgO+jQ&jO'#FgO0oQ#tO'#FuOOQO'#Ft'#FtO1uQ$fO'#FiO2QQ$fO'#F}O2VQ#tO'#GOO2_Q$fO'#GPO2jQ$fO'#GQO2uQ#tO'#GRO2}Q$fO'#GSO3YQ#tO'#GTO3bQ#tO'#GWOOQO'#GY'#GYO3gQ#tO'#GZO9`Q#tO'#G[O?XQ#tO'#G]OEQQ#tO'#G^OEYQ&jO'#GcOEeQ#tO'#GdOEpQ#tO'#GeOEpQ#tO'#GfOEpQ#tO'#GgOEpQ#tO'#GhOEpQ#tO'#GiOEpQ#tO'#GjOEpQ#tO'#GkOEpQ#tO'#GlOEpQ#tO'#GmOEpQ#tO'#GnOEpQ#tO'#GoOEuQ#tO'#GpOOQO'#Eh'#EhOJtQ#tO'#GqOOQO'#Gq'#GqOOQO'#Eg'#EgO!!bQ,UO'#GrOOQO'#Ia'#IaO!!iQ,UO'#I`OOQO'#Id'#IdO!!pQ,UO'#IcOOQO'#Kk'#KkOVQ#tO'#E_O!'nQ#tO'#IhO!'uQ,UO'#ImO!'uQ,UO'#IrO!'|Q$UO'#IvO!(RQ#tO'#I{OVQ#tO'#JSOVQ#tO'#JWOVQ#tO'#J[OOQO'#E^'#E^OOQO'#Kj'#KjO!-RQ#tO'#J`OOQO'#Ki'#KiOOQO'#Jz'#JzOOQO'#Jy'#JyO!-YQ&jO'#JbO!-hQ&jO'#JeO!-vQ&jO'#JhO!.UQ&jO'#JkO!.dQ&jO'#JnO!.rQ&jO'#JqO!/QQ&jO'#JtO!/`Q&jO'#JwO!/nQ#tO'#JvOOQO'#Lp'#LpO!0eQ#tO'#E[QOQ#tOOO!0rQ#tO'#JsO!1iQ#tO'#JpO!2`Q#tO'#JmO!3VQ#tO'#JjO!3|Q#tO'#JgO!4sQ#tO'#JdO!5jQ#tO'#JaO!6aQ&jO'#EqO!7UQ#tO,5;[O!<eQ#tO,5:zO!AtQ#tO,5?TO!FnQ,UO,5?YO!K_Q,UO,5?_O#!OQ$UO,5?cO#!ZQ#tO,5?hO#'ZQ#tO,5?oO#,jQ#tO,5?sO#1yQ#tO,5?wOOQO'#Es'#EsO#7YQ#tO,5;ZO#7_Q#tO'#EkOOQO,5;T,5;TOEpQ#tO,5;TO#ARQ#tO'#EdO#AYQ#tO,5;TOOQO,5;a,5;aO#AbQ#tO,5;aO#AjQ#tO,5;aOOQO,5;b,5;bO#AuQ#tO,5;bO#A}Q#tO,5;bOOQO,5;c,5;cO#BYQ#tO,5;cO#BbQ#tO,5;cO#BmQ#tO'#EyOOQO,5;d,5;dO#GjQ#tO,5;dO#GrQ#tO,5;dOOQO'#E}'#E}OOQO,5;h,5;hO#G}Q#tO,5;hO#HSQ#tO,5;hOOQO'#FP'#FPOOQO,5;j,5;jO#G}Q#tO,5;jOOQO'#FR'#FROOQO,5;l,5;lO#G}Q#tO,5;lOOQO'#FT'#FTOOQO,5;n,5;nO#G}Q#tO,5;nO#HSQ#tO,5;nO#H[Q#tO,5;pO#G}Q#tO,5;pO#HdQ#tO,5;qO#G}Q#tO,5;qO#HlQ#xO'#FXO#G}Q#tO,5;rO#HqQ#tO,5;rO#AYQ#tO,5;tO#HvQ#tO,5;tO#G}Q#tO,5;tOOQO,5;u,5;uO#G}Q#tO,5;uOOQO,5;v,5;vO#HqQ#tO,5;vOOQO,5;w,5;wOOQO,5;x,5;xO#IOQ#vO,5;xO#ITQ#vO,5;xO#I]Q#xO'#FaOOQO'#F`'#F`OOQO,5;y,5;yO3bQ#tO,5;yO#IbQ#tO,5;yOOQO,5;|,5;|OEpQ#tO,5;|O#IjQ#tO,5;|O#AYQ#tO,5;|OOQO'#Fd'#FdOOQO,5;},5;}O#G}Q#tO,5;}OOQO'#Ff'#FfOOQO,5<P,5<PO#IuQ#tO,5<PO#IuQ#tO,5<PO#JQQ#tO,5<POOQO'#Fh'#FhOOQO,5<R,5<RO#J]Q#tO,5<RO#J]Q#tO,5<RO#JhQ#tO,5<ROOQO,5<a,5<aO#JsQ#tO,5<TO#KUQ$fO,5<TO#K^Q'[O,5<iOOQO,5<j,5<jOEpQ#tO,5<jO#KiQ#tO,5<kO#KwQ#xO,5<kO#K|Q$fO,5<kO#KiQ#tO,5<lO#LUQ#xO,5<lO#LZQ$fO,5<lO#LcQ#xO,5<mO#LhQ#tO,5<mO#KiQ#tO,5<nO#LmQ#xO,5<nO#LrQ$fO,5<nO#LzQ#|O'#GVOOQO'#GU'#GUOOQO,5<o,5<oOOQO'#GX'#GXOOQO,5<r,5<rO#MPQ#tO,5<uOOQO,5<u,5<uOOQO,5<v,5<vOOQO,5<w,5<wOOQO'#G_'#G_O$$xQ#tO,5<xO#G}Q#tO,5<xOOQO,5<},5<}OEpQ#tO,5<}O$%QQ&jO,5<}OOQO'#KU'#KUOEeQ#tO,5=OO$%YQ#tO,5=OO#A]Q#tO'#KUOOQO,5=P,5=POOQO,5=Q,5=QOOQO,5=R,5=ROOQO,5=S,5=SOOQO,5=T,5=TOOQO,5=U,5=UOOQO,5=V,5=VOOQO,5=W,5=WOOQO,5=X,5=XOOQO,5=Y,5=YOOQO,5=Z,5=ZO$%bQ#tO,5=[O#G}Q#tO,5=[OOQO'#KV'#KVO$%jQ#tO,5=]O$%jQ#tO,5=]O$+]Q,UO'#FuO$+jQ#tO'#GwO$+uQ#tO'#GxO$,QQ#tO'#GyO$,]Q#tO'#GzO$,hQ#tO'#G{O$,sQ#tO'#G|O$-OQ#tO'#HOO$-WQ#tO'#HQO$-`Q#tO'#HSO$-kQ#tO'#HTO$-sQ#tO'#HVO$-{Q#tO'#HWO$.TQ&jO'#HXO$.`Q#tO'#HYO$.hQ#tO'#HZO$.pQ#uO'#H[O$.uQ#vO'#H]O$/QQ#tO'#H^O$/]Q&jO'#H`O$/kQ#tO'#HaO$/sQ#tO'#HbO$0OQ&jO'#HbO$0^Q#tO'#HcO$0iQ&jO'#HcO$0wQ$fO'#HdO$1SQ$fO'#HeO$1XQ#tO'#HfO$1aQ$fO'#HgO$1lQ$fO'#HhO$1wQ#tO'#HiO$2PQ$fO'#HjO3YQ#tO'#HkO3bQ#tO'#HmOOQO'#Ho'#HoO$2[Q,UO'#HpO$7[Q,UO'#HqO$<[Q,UO'#HrO$A[Q#tO'#HsO$AdQ&jO'#HvOEeQ#tO'#HwOEpQ#tO'#HxOEpQ#tO'#HyOEpQ#tO'#HzOEpQ#tO'#H{OEpQ#tO'#H|OEpQ#tO'#H}OEpQ#tO'#IOOEpQ#tO'#IPO$AoQ#tO'#IQO$AoQ#tO'#IRO$AoQ#tO'#ISO$AtQ#tO'#ITOOQO'#Gv'#GvO$A|Q!!^O'#K|OOQO'#K|'#K|OOQO'#IU'#IUOOQO'#Gu'#GuO$BUQ,UO'#IVO$DfQ7[O'#IXO$DmQ,UO'#IWOOQO'#KW'#KWO$DtQ,UO'#GtOOQO'#Gs'#GsO$E[Q,UO'#I_O$EcQ#tO,5=^OOQO'#Ib'#IbOOQO,5>z,5>zO$EhQ#tO,5>zOOQO'#Ie'#IeOOQO,5>},5>}O$EmQ#tO,5>}O$ErQ#tO,5:yO$EwQ#tO'#GbOOQO'#Ik'#IkO$FRQ#tO,5?SOOQO'#Ip'#IpO$FWQ#tO,5?XO$F]Q#tO,5?^OOQO'#Iy'#IyO$FbQ#tO,5?bO!(RQ#tO'#JQOOQO'#KY'#KYO$FgQ#tO'#JPOOQO'#JO'#JOO$FqQ#tO,5?gO$FvQ#tO,5?nO$F{Q#tO,5?rO$GQQ#tO,5?vOOQO,5?z,5?zO$GVQ#tO,5?zOOQO-E=x-E=xO#7_Q#tO'#F|OOQO,5?|,5?|O$G[Q#tO,5?|O$GdQ#tO,5?|O$GoQ&jO,5?|OOQO,5@P,5@PO$G}Q#tO,5@PO$HVQ#tO,5@PO$HbQ&jO,5@POOQO,5@S,5@SO$HpQ#tO,5@SO$HxQ#tO,5@SO$ITQ&jO,5@SOOQO,5@V,5@VO$IcQ#tO,5@VO$IkQ#tO,5@VO$IvQ&jO,5@VOOQO,5@Y,5@YO$JUQ#tO,5@YO$J^Q#tO,5@YO$JiQ&jO,5@YOOQO,5@],5@]O$JwQ#tO,5@]O$KPQ#tO,5@]O$K[Q&jO,5@]OOQO,5@`,5@`O$KjQ#tO,5@`O$KrQ#tO,5@`O$K}Q&jO,5@`OOQO,5@c,5@cO$L]Q#tO,5@cO$LeQ#tO,5@cO$LpQ&jO,5@cOOQO'#Kb'#KbO$MOQ#tO'#JxOOQO,5@b,5@bOOQO-E=w-E=wOOQO'#Ka'#KaO$MuQ#tO'#JuOOQO,5@_,5@_OOQO'#K`'#K`O$NlQ#tO'#JrOOQO,5@[,5@[OOQO'#K_'#K_O% cQ#tO'#JoOOQO,5@X,5@XOOQO'#K^'#K^O%!YQ#tO'#JlOOQO,5@U,5@UOOQO'#K]'#K]O%#PQ#tO'#JiOOQO,5@R,5@ROOQO'#K['#K[O%#vQ#tO'#JfOOQO,5@O,5@OOOQO'#KZ'#KZO%$mQ#tO'#JcOOQO,5?{,5?{O%%dQ#tO,5:{OOQO,5;],5;]O%%iQ#tO,5;]O%%nQ#tO,5?UO%%sQ#tO,5?ZO%%xQ#tO,5?`O%%}Q#tO,5?dO%&SQ#tO,5?iO%&XQ#tO,5?pO%&^Q#tO,5?tO%&cQ#tO,5?xOOQ`'#J}'#J}O%&hQ#tO1G0vO%&hQ#tO1G0vO%+wQ#tO1G0fO%+wQ#tO1G0fO%1WQ#tO1G4oO%1WQ#tO1G4oO%6QQ,UO1G4tO%6QQ,UO1G4tO%:qQ,UO1G4yO%:qQ,UO1G4yO%?bQ$UO1G4}O%?bQ$UO1G4}O%?jQ#tO1G5SO%?jQ#tO1G5SO%DjQ#tO1G5ZO%DjQ#tO1G5ZO%IyQ#tO1G5_O%IyQ#tO1G5_O& YQ#tO1G5cO& YQ#tO1G5cO&&iQ#tO'#EtOOQO1G0u1G0uO#7_Q#tO'#EnOOQO'#J|'#J|O&+_Q#tO'#ElO&+uQ#tO,5;VOOQO1G0o1G0oO&+zQ#tO'#IfOOQO'#J{'#J{O&,RQ#tO'#EfO&,]Q#tO,5;OOEpQ#tO1G0oOOQO1G0{1G0{OEpQ#tO1G0{O&,bQ#tO1G0{OOQO1G0|1G0|OEpQ#tO1G0|O&,jQ#tO1G0|OOQO1G0}1G0}OEpQ#tO1G0}O&,rQ#tO1G0}O#BmQ#tO'#E{OOQO'#KO'#KOO&,zQ#tO'#EzO&-_Q#tO,5;eOOQO1G1O1G1OO#G}Q#tO1G1OO&-dQ#tO1G1OOOQO1G1S1G1SO#G}Q#tO1G1SOOQO1G1U1G1UOOQO1G1W1G1WOOQO1G1Y1G1YO#G}Q#tO1G1YOOQO1G1[1G1[OEpQ#tO1G1[O&-lQ#tO1G1[OOQO1G1]1G1]OEpQ#tO1G1]O&-tQ#tO1G1]O&-|Q#tO,5;sOOQO1G1^1G1^O#G}Q#tO1G1^O&.RQ#tO1G1`OEpQ#tO1G1`O#AYQ#tO1G1`O#G}Q#tO1G1`OOQO1G1a1G1aOOQO1G1b1G1bOOQO1G1d1G1dO&3zQ#vO1G1dO&4PQ#tO,5;{OOQO1G1e1G1eO3bQ#tO1G1eOOQO1G1h1G1hOEpQ#tO1G1hO#AYQ#tO1G1hOOQO1G1i1G1iOOQO1G1k1G1kO&4UQ#tO1G1kO&4^Q#tO1G1kO&4iQ#tO1G1kO&4iQ#tO1G1kOOQO1G1m1G1mO&4tQ#tO1G1mO&4|Q#tO1G1mO&5XQ#tO1G1mO&5XQ#tO1G1mO&5dQ&jO'#FkO#KPQ#tO'#FlOOQO'#KP'#KPO&6RQ#tO1G1oO&6RQ#tO1G1oO&6dQ#tO'#FmO&<_Q#tO'#FmO&6dQ#tO'#FmOOQO1G1o1G1oO&<fQ#tO1G1oOOQO1G2T1G2TO&<wQ$fO1G2TO&=PQ'[O1G2TOOQO1G2U1G2UOOQO'#KQ'#KQOOQO'#KT'#KTO#KiQ#tO1G2VOOQO1G2V1G2VO&=[Q#tO1G2VO#KiQ#tO1G2VO&=aQ#xO1G2VO#KiQ#tO1G2WOOQO1G2W1G2WO&=fQ#tO1G2WO#KiQ#tO1G2WO&=kQ#xO1G2WO&=pQ#tO1G2XO&=uQ#xO1G2XO#KiQ#tO1G2YO&=zQ#tO1G2YO&>VQ#tO1G2YO#KiQ#tO1G2YO&>[Q#xO1G2YOOQO,5<q,5<qOOQO1G2a1G2aOOQO'#G`'#G`O&>aQ#tO1G2dO#G}Q#tO1G2dO&>iQ#tO1G2dOOQO1G2i1G2iOEpQ#tO1G2iOOQO-E>S-E>SO&>qQ#tO1G2jOOQO1G2j1G2jOEpQ#tO1G2jOOQO,5@p,5@pOOQO1G2v1G2vO#G}Q#tO1G2vO&>yQ#tO1G2vOOQO-E>T-E>TOOQO1G2w1G2wOOQO,5=c,5=cOEpQ#tO,5=cO#AYQ#tO,5=cOOQO,5=d,5=dO&?RQ#tO,5=dO&?ZQ#tO,5=dOOQO,5=e,5=eO&?fQ#tO,5=eO&?nQ#tO,5=eOOQO,5=f,5=fO&?yQ#tO,5=fO&@RQ#tO,5=fOOQO,5=g,5=gO&@^Q#tO,5=gO&@fQ#tO,5=gOOQO'#G}'#G}OOQO,5=h,5=hO#G}Q#tO,5=hO#HSQ#tO,5=hOOQO'#HP'#HPOOQO,5=j,5=jO#G}Q#tO,5=jOOQO'#HR'#HROOQO,5=l,5=lO#G}Q#tO,5=lOOQO,5=n,5=nO#G}Q#tO,5=nO#HSQ#tO,5=nO&@qQ#tO,5=oO#G}Q#tO,5=oO&@yQ#tO,5=qO#G}Q#tO,5=qO#G}Q#tO,5=rO#HqQ#tO,5=rO#AYQ#tO,5=sO&ARQ#tO,5=sO#G}Q#tO,5=sOOQO,5=t,5=tO#G}Q#tO,5=tOOQO,5=u,5=uO#HqQ#tO,5=uOOQO,5=v,5=vOOQO,5=w,5=wO&AZQ#vO,5=wO&A`Q#vO,5=wOOQO'#H_'#H_OOQO,5=x,5=xO3bQ#tO,5=xO#IbQ#tO,5=xOOQO,5=z,5=zOEpQ#tO,5=zO&AhQ#tO,5=zO#AYQ#tO,5=zOOQO,5={,5={O#G}Q#tO,5={OOQO,5=|,5=|O&AsQ#tO,5=|O&AsQ#tO,5=|O&BOQ#tO,5=|OOQO,5=},5=}O&BZQ#tO,5=}O&BZQ#tO,5=}O&BfQ#tO,5=}O&BqQ#tO,5>OO&CSQ$fO,5>OO&C[Q'[O,5>POOQO,5>Q,5>QOEpQ#tO,5>QO#KiQ#tO,5>RO&CgQ#xO,5>RO&ClQ$fO,5>RO#KiQ#tO,5>SO&CtQ#xO,5>SO&CyQ$fO,5>SO&DRQ#xO,5>TO&DWQ#tO,5>TO#KiQ#tO,5>UO&D]Q#xO,5>UO&DbQ$fO,5>UOOQO'#Hl'#HlOOQO,5>V,5>VOOQO'#Hn'#HnOOQO,5>X,5>XO&DjQ,UO,5>[OOQO,5>[,5>[OOQO,5>],5>]OOQO,5>^,5>^OOQO'#Ht'#HtO&IjQ#tO,5>_O#G}Q#tO,5>_OOQO,5>b,5>bOEpQ#tO,5>bO&IrQ&jO,5>bOEeQ#tO,5>cO&IzQ#tO,5>cOOQO,5>d,5>dOOQO,5>e,5>eOOQO,5>f,5>fOOQO,5>g,5>gOOQO,5>h,5>hOOQO,5>i,5>iOOQO,5>j,5>jOOQO,5>k,5>kO&JSQ,UO'#HUOOQO,5>l,5>lOOQO,5>m,5>mOOQO,5>n,5>nO&JZQ#tO,5>oO#G}Q#tO,5>oO&JcQ#tO'#KXO&JkQ!!^O,5AhOOQO,5Ah,5AhOOQO,5>q,5>qO&JsQ#tO,5>qOOQO'#IY'#IYOOQO,5>s,5>sO$B]Q7[O,5>sO&JxQ7[O'#IZOOQO,5>r,5>rO&KPQ#tO,5>rOOQO-E>U-E>UOOQO,5>y,5>yO&KUQ#tO,5>yOOQO1G2x1G2xOOQO1G4f1G4fOOQO1G4i1G4iO&KZQ#tO'#IgO'!VQ%WO1G0eO'#]Q#tO'#IlOOQO1G4n1G4nO'#bQ#tO'#IqOOQO1G4s1G4sO'#gQ#tO'#IuOOQO1G4x1G4xO'#lQ#tO'#IzOOQO1G4|1G4|O'#qQ#tO,5?lOOQO-E>W-E>WO'#vQ#tO'#JROOQO1G5R1G5RO'#{Q#tO'#JVOOQO1G5Y1G5YO'$QQ#tO'#JZOOQO1G5^1G5^O'$VQ#tO'#J_OOQO1G5b1G5bOOQO1G5f1G5fO'$[Q#tO,5<hOOQO1G5h1G5hO'$aQ#tO1G5hO'$fQ#tO1G5hO'$nQ#tO1G5hO'$yQ#tO1G5hOOQO1G5k1G5kO'$aQ#tO1G5kO'%UQ#tO1G5kO'%^Q#tO1G5kO'%iQ#tO1G5kOOQO1G5n1G5nO'$aQ#tO1G5nO'%tQ#tO1G5nO'%|Q#tO1G5nO'&XQ#tO1G5nOOQO1G5q1G5qO'$aQ#tO1G5qO'&dQ#tO1G5qO'&lQ#tO1G5qO'&wQ#tO1G5qOOQO1G5t1G5tO'$aQ#tO1G5tO''SQ#tO1G5tO''[Q#tO1G5tO''gQ#tO1G5tOOQO1G5w1G5wO'$aQ#tO1G5wO''rQ#tO1G5wO''zQ#tO1G5wO'(VQ#tO1G5wOOQO1G5z1G5zO'$aQ#tO1G5zO'(bQ#tO1G5zO'(jQ#tO1G5zO'(uQ#tO1G5zOOQO1G5}1G5}O'$aQ#tO1G5}O')QQ#tO1G5}O')YQ#tO1G5}O')eQ#tO1G5}OOQO-E>`-E>`OOQO-E>_-E>_OOQO-E>^-E>^OOQO-E>]-E>]OOQO-E>[-E>[OOQO-E>Z-E>ZOOQO-E>Y-E>YOOQO-E>X-E>XOOQ!b1G0g1G0gOOQO1G0w1G0wOOQO1G4p1G4pOOQO1G4u1G4uOOQO1G4z1G4zOOQ`1G5O1G5OOOQO1G5T1G5TOOQO1G5[1G5[OOQO1G5`1G5`OOQO1G5d1G5dOOQ`-E={-E={O')pQ#tO7+&bO'/PQ#tO7+&QO'4`Q#tO7+*ZO'9YQ,UO7+*`O'=yQ,UO7+*eO'BjQ$UO7+*iO'BrQ#tO7+*nO'GrQ#tO7+*uO'MRQ#tO7+*yO($bQ#tO7+*}O!6|Q&jO'#EqOOQO,5;`,5;`O()qQ#tO,5;YOOQO-E=z-E=zOOQ`1G0q1G0qO()vQ#tO,5?QOOQO-E=y-E=yOOQ!Ld1G0j1G0jOOQO7+&Z7+&ZOOQO7+&g7+&gOEpQ#tO7+&gOOQO7+&h7+&hOEpQ#tO7+&hOOQO7+&i7+&iOEpQ#tO7+&iO(){Q#tO,5;gOOQO-E=|-E=|OOQO1G1P1G1POOQO7+&j7+&jO#G}Q#tO7+&jOOQO7+&n7+&nOOQO7+&t7+&tOOQO7+&v7+&vOEpQ#tO7+&vOOQO7+&w7+&wOEpQ#tO7+&wOOQO1G1_1G1_OOQO7+&x7+&xOOQO7+&z7+&zO(*QQ#tO7+&zOEpQ#tO7+&zO#AYQ#tO7+&zOOQO7+'O7+'OOOQO1G1g1G1gOOQO7+'P7+'POOQO7+'S7+'SOEpQ#tO7+'SOOQO7+'V7+'VO#G}Q#tO7+'VO(/yQ#tO7+'VO(0RQ#tO7+'VO(0^Q#tO7+'VOOQO7+'X7+'XO#G}Q#tO7+'XO(0iQ#tO7+'XO(0qQ#tO7+'XO(0|Q#tO7+'XOOQO,5<V,5<VO(1XQ#tO,5<WOOQO-E=}-E=}O&=zQ#tO7+'ZOOQO7+'Z7+'ZO(1^Q#tO7+'ZOOQO-E>O-E>OO(1oQ#tO,5<XO(1vQ!NvO'#KzOOQO'#Kz'#KzOOQO'#Fq'#FqOOQO'#Fp'#FpO(2OQ#tO'#FvO(2VQ&jO'#F{OOQO'#KR'#KRO(2eQ#tO'#FoOOQO,5<X,5<XO(2lQ#tO,5<XO(2qQ#tO,5<XO(1^Q#tO7+'ZOOQO7+'o7+'oO(2yQ$fO7+'oO(3OQ$fO7+'oOOQO-E>R-E>ROOQO7+'q7+'qO#KiQ#tO7+'qO#KiQ#tO7+'qO(3WQ#tO7+'qOOQO7+'r7+'rO#KiQ#tO7+'rO#KiQ#tO7+'rO(3]Q#tO7+'rO#KiQ#tO7+'sO(3bQ#tO7+'sO&=zQ#tO7+'tOOQO7+'t7+'tO#KiQ#tO7+'tO#KiQ#tO7+'tO(3gQ#tO7+'tO(3lQ#tO'#GaOOQO7+(O7+(OO(3sQ#tO7+(OO(3xQ#tO7+(OO#G}Q#tO7+(OOOQO7+(T7+(TOOQO7+(U7+(UOEpQ#tO7+(UOOQO7+(b7+(bO#G}Q#tO7+(bOOQO1G2}1G2}OEpQ#tO1G2}OOQO1G3O1G3OOEpQ#tO1G3OO(4QQ#tO1G3OOOQO1G3P1G3POEpQ#tO1G3PO(4YQ#tO1G3POOQO1G3Q1G3QOEpQ#tO1G3QO(4bQ#tO1G3QOOQO1G3R1G3RO#G}Q#tO1G3RO(4jQ#tO1G3ROOQO1G3S1G3SO#G}Q#tO1G3SOOQO1G3U1G3UOOQO1G3W1G3WOOQO1G3Y1G3YO#G}Q#tO1G3YOOQO1G3Z1G3ZO$AoQ#tO1G3ZO(4rQ#tO1G3ZOOQO1G3]1G3]O$AoQ#tO1G3]O(4zQ#tO1G3]OOQO1G3^1G3^O#G}Q#tO1G3^O(5SQ,UO1G3_OEpQ#tO1G3_O#AYQ#tO1G3_O#G}Q#tO1G3_OOQO1G3`1G3`OOQO1G3a1G3aOOQO1G3c1G3cO(:SQ#vO1G3cOOQO1G3d1G3dO3bQ#tO1G3dOOQO1G3f1G3fOEpQ#tO1G3fO#AYQ#tO1G3fOOQO1G3g1G3gOOQO1G3h1G3hO(:XQ#tO1G3hO(:aQ#tO1G3hO(:lQ#tO1G3hO(:lQ#tO1G3hOOQO1G3i1G3iO(:wQ#tO1G3iO(;PQ#tO1G3iO(;[Q#tO1G3iO(;[Q#tO1G3iO(;gQ#tO1G3jO(;gQ#tO1G3jOOQO1G3j1G3jO(;xQ#tO1G3jOOQO1G3k1G3kO(<ZQ$fO1G3kO(<cQ'[O1G3kOOQO1G3l1G3lO#KiQ#tO1G3mOOQO1G3m1G3mO(<nQ#tO1G3mO#KiQ#tO1G3mO(<sQ#xO1G3mO#KiQ#tO1G3nOOQO1G3n1G3nO(<xQ#tO1G3nO#KiQ#tO1G3nO(<}Q#xO1G3nO(=SQ#tO1G3oO(=XQ#xO1G3oO#KiQ#tO1G3pO&=zQ#tO1G3pO(=^Q#tO1G3pO#KiQ#tO1G3pO(=cQ#xO1G3pOOQO1G3v1G3vOOQO'#Hu'#HuO(=hQ#tO1G3yO#G}Q#tO1G3yO(=pQ#tO1G3yOOQO1G3|1G3|OEpQ#tO1G3|O(=xQ#tO1G3}OOQO1G3}1G3}OEpQ#tO1G3}OOQMh,5=p,5=pO(>QQ#tO,5=pOOQO1G4Z1G4ZO#G}Q#tO1G4ZO(>VQ#tO1G4ZOOQMh,5@s,5@sO$AoQ#tO,5@sOOQMh-E>V-E>VOOQO1G7S1G7SOOQO1G4]1G4]OOQO1G4_1G4_OOQO,5>u,5>uO$B]Q7[O,5>uOOQO1G4^1G4^OOQO1G4e1G4eO(>_Q-hO1G0eO(>rQ&jO'#EaOOQ!b,5?R,5?ROOQO7+&P7+&PO(>wQ&jO'#IjOOQO,5?W,5?WO(>|Q&jO'#IoOOQO,5?],5?]O(?RQ&jO'#ItOOQO,5?a,5?aO(?WQ&jO'#IxOOQO,5?f,5?fOOQO1G5W1G5WO(?]Q&jO'#I}OOQO,5?m,5?mO(?bQ&jO'#JUOOQO,5?q,5?qO(?gQ&jO'#JYOOQO,5?u,5?uO(?lQ&jO'#J^OOQO,5?y,5?yOOQO1G2S1G2SOOQO7++S7++SO'$aQ#tO7++SO(?qQ#tO7++SO(?yQ#tO7++SOOQO7++V7++VO'$aQ#tO7++VO(@UQ#tO7++VO(@^Q#tO7++VOOQO7++Y7++YO'$aQ#tO7++YO(@iQ#tO7++YO(@qQ#tO7++YOOQO7++]7++]O'$aQ#tO7++]O(@|Q#tO7++]O(AUQ#tO7++]OOQO7++`7++`O'$aQ#tO7++`O(AaQ#tO7++`O(AiQ#tO7++`OOQO7++c7++cO'$aQ#tO7++cO(AtQ#tO7++cO(A|Q#tO7++cOOQO7++f7++fO'$aQ#tO7++fO(BXQ#tO7++fO(BaQ#tO7++fOOQO7++i7++iO'$aQ#tO7++iO(BlQ#tO7++iO(BtQ#tO7++iOOQO1G0t1G0tO(CPQ#tO1G2wOOQO1G4l1G4lOOQO<<JR<<JROOQO<<JS<<JSOOQO<<JT<<JTOOQO1G1R1G1ROOQO<<JU<<JUOOQO<<Jb<<JbOOQO<<Jc<<JcOOQO<<Jf<<JfO(GyQ#tO<<JfOEpQ#tO<<JfOOQO<<Jn<<JnOOQO<<Jq<<JqO#G}Q#tO<<JqO(MrQ#tO<<JqO(MzQ#tO<<JqOOQO<<Js<<JsO#G}Q#tO<<JsO(NVQ#tO<<JsO(N_Q#tO<<JsOOQO1G1r1G1rOOQO<<Ju<<JuO&=zQ#tO<<JuOOQO1G1s1G1sO(NjQ#tO1G1sO(NoQ#tO'#KSO(NzQ!NvO,5AfOOQO,5Af,5AfOOQO,5<b,5<bO) SQ#tO,5<bOOQO,5<g,5<gO) XQ#tO,5<gO) aQ#tO,5<gO) lQ&jO,5<gOOQO-E>P-E>PO) zQ#tO1G1sO)!RQ#tO<<JuOOQO<<KZ<<KZO)!dQ$fO<<KZO#KiQ#tO<<K]OOQO<<K]<<K]O#KiQ#tO<<K]O#KiQ#tO<<K^OOQO<<K^<<K^O#KiQ#tO<<K^O#KiQ#tO<<K_O&=zQ#tO<<K_O#KiQ#tO<<K_OOQO<<K`<<K`O#KiQ#tO<<K`O&=zQ#tO<<K`O#KiQ#tO<<K`O)!iQ#tO,5<{OOQO<<Kj<<KjO(3sQ#tO<<KjO)!nQ#tO<<KjOOQO<<Kp<<KpOOQO<<K|<<K|OOQO7+(i7+(iOOQO7+(j7+(jOEpQ#tO7+(jOOQO7+(k7+(kOEpQ#tO7+(kOOQO7+(l7+(lOEpQ#tO7+(lOOQO7+(m7+(mO#G}Q#tO7+(mOOQO7+(n7+(nOOQO7+(t7+(tOOQO7+(u7+(uO$AoQ#tO7+(uOOQO7+(w7+(wO$AoQ#tO7+(wOOQO7+(x7+(xOOQO7+(y7+(yO)!vQ,UO7+(yOEpQ#tO7+(yO#AYQ#tO7+(yOOQO7+(}7+(}OOQO7+)O7+)OOOQO7+)Q7+)QOEpQ#tO7+)QOOQO7+)S7+)SO#G}Q#tO7+)SO)'vQ#tO7+)SO)(OQ#tO7+)SO)(ZQ#tO7+)SOOQO7+)T7+)TO#G}Q#tO7+)TO)(fQ#tO7+)TO)(nQ#tO7+)TO)(yQ#tO7+)TO&=zQ#tO7+)UOOQO7+)U7+)UO))UQ#tO7+)UO))UQ#tO7+)UOOQO7+)V7+)VO))gQ$fO7+)VO))lQ$fO7+)VOOQO7+)X7+)XO#KiQ#tO7+)XO#KiQ#tO7+)XO))tQ#tO7+)XOOQO7+)Y7+)YO#KiQ#tO7+)YO#KiQ#tO7+)YO))yQ#tO7+)YO#KiQ#tO7+)ZO)*OQ#tO7+)ZO&=zQ#tO7+)[OOQO7+)[7+)[O#KiQ#tO7+)[O#KiQ#tO7+)[O)*TQ#tO7+)[OOQO7+)e7+)eO(3sQ#tO7+)eO)*YQ#tO7+)eO#G}Q#tO7+)eOOQO7+)h7+)hOOQO7+)i7+)iOEpQ#tO7+)iOOQMh1G3[1G3[OOQO7+)u7+)uO#G}Q#tO7+)uOOQMh1G6_1G6_OOQO1G4a1G4aOOQO<<Nn<<NnO'$aQ#tO<<NnO)*bQ#tO<<NnOOQO<<Nq<<NqO'$aQ#tO<<NqO)*jQ#tO<<NqOOQO<<Nt<<NtO'$aQ#tO<<NtO)*rQ#tO<<NtOOQO<<Nw<<NwO'$aQ#tO<<NwO)*zQ#tO<<NwOOQO<<Nz<<NzO'$aQ#tO<<NzO)+SQ#tO<<NzOOQO<<N}<<N}O'$aQ#tO<<N}O)+[Q#tO<<N}OOQO<= Q<= QO'$aQ#tO<= QO)+dQ#tO<= QOOQO<= T<= TO'$aQ#tO<= TO)+lQ#tO<= TOOQOAN@QAN@QOOQOAN@]AN@]O#G}Q#tOAN@]O)+tQ#tOAN@]OOQOAN@_AN@_O#G}Q#tOAN@_O)+|Q#tOAN@_OOQOAN@aAN@aOOQO7+'_7+'_O),UQ#tO'#FsOOQ!LQ,5@n,5@nO),]Q#tO,5@nOOQ!LQ-E>Q-E>QOOQO1G7Q1G7QOOQO1G1|1G1|OOQO1G2R1G2RO'$aQ#tO1G2RO),eQ#tO1G2RO),mQ#tO1G2RO),xQ#tO1G2RO)-TQ#tO7+'_O&=zQ#tOAN@aOOQOAN@uAN@uOOQOAN@wAN@wO#KiQ#tOAN@wOOQOAN@xAN@xO#KiQ#tOAN@xO&=zQ#tOAN@yOOQOAN@yAN@yO#KiQ#tOAN@yO&=zQ#tOAN@zOOQOAN@zAN@zO#KiQ#tOAN@zOOQO1G2g1G2gOOQOANAUANAUO(3sQ#tOANAUOOQO<<LU<<LUOOQO<<LV<<LVOOQO<<LW<<LWOOQO<<LX<<LXOOQO<<La<<LaOOQO<<Lc<<LcOOQO<<Le<<LeO)-YQ,UO<<LeOEpQ#tO<<LeOOQO<<Ll<<LlOOQO<<Ln<<LnO#G}Q#tO<<LnO)2YQ#tO<<LnO)2bQ#tO<<LnOOQO<<Lo<<LoO#G}Q#tO<<LoO)2mQ#tO<<LoO)2uQ#tO<<LoOOQO<<Lp<<LpO&=zQ#tO<<LpO)3QQ#tO<<LpOOQO<<Lq<<LqO)3cQ$fO<<LqO#KiQ#tO<<LsOOQO<<Ls<<LsO#KiQ#tO<<LsO#KiQ#tO<<LtOOQO<<Lt<<LtO#KiQ#tO<<LtO#KiQ#tO<<LuO&=zQ#tO<<LuO#KiQ#tO<<LuOOQO<<Lv<<LvO#KiQ#tO<<LvO&=zQ#tO<<LvO#KiQ#tO<<LvOOQO<<MP<<MPO(3sQ#tO<<MPO)3hQ#tO<<MPOOQO<<MT<<MTOOQO<<Ma<<MaOOQOANDYANDYO'$aQ#tOANDYOOQOAND]AND]O'$aQ#tOAND]OOQOAND`AND`O'$aQ#tOAND`OOQOANDcANDcO'$aQ#tOANDcOOQOANDfANDfO'$aQ#tOANDfOOQOANDiANDiO'$aQ#tOANDiOOQOANDlANDlO'$aQ#tOANDlOOQOANDoANDoO'$aQ#tOANDoOOQOG25wG25wO#G}Q#tOG25wOOQOG25yG25yO#G}Q#tOG25yOOQ!LQ,5<_,5<_O)3pQ#tO,5<_OOQ!LQ1G6Y1G6YOOQO7+'m7+'mO'$aQ#tO7+'mO)3uQ#tO7+'mO)3}Q#tO7+'mOOQO<<Jy<<JyOOQOG25{G25{OOQOG26cG26cOOQOG26dG26dOOQOG26eG26eO&=zQ#tOG26eOOQOG26fG26fO&=zQ#tOG26fOOQOG26pG26pOOQOANBPANBPOOQOANBYANBYO#G}Q#tOANBYO)4YQ#tOANBYOOQOANBZANBZO#G}Q#tOANBZO)4bQ#tOANBZOOQOANB[ANB[O&=zQ#tOANB[OOQOANB]ANB]OOQOANB_ANB_O#KiQ#tOANB_OOQOANB`ANB`O#KiQ#tOANB`O&=zQ#tOANBaOOQOANBaANBaO#KiQ#tOANBaO&=zQ#tOANBbOOQOANBbANBbO#KiQ#tOANBbOOQOANBkANBkO(3sQ#tOANBkOOQOG29tG29tOOQOG29wG29wOOQOG29zG29zOOQOG29}G29}OOQOG2:QG2:QOOQOG2:TG2:TOOQOG2:WG2:WOOQOG2:ZG2:ZOOQOLD+cLD+cOOQOLD+eLD+eOOQ!LQ1G1y1G1yOOQO<<KX<<KXO'$aQ#tO<<KXO)4jQ#tO<<KXOOQOLD,PLD,POOQOLD,QLD,QOOQOG27tG27tO#G}Q#tOG27tOOQOG27uG27uO#G}Q#tOG27uOOQOG27vG27vOOQOG27yG27yOOQOG27zG27zOOQOG27{G27{O&=zQ#tOG27{OOQOG27|G27|O&=zQ#tOG27|OOQOG28VG28VOOQOAN@sAN@sO'$aQ#tOAN@sOOQOLD-`LD-`OOQOLD-aLD-aOOQOLD-gLD-gOOQOLD-hLD-hOOQOG26_G26_O)4rQ#tO,5=]O$ErQ#tO,5:yO)9lQ#tO'#GqOVQ#tO'#E_",
  stateData: "):O~O!|OS~OXQOZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtOs!uOt!vOu!wOv!xOw!yOx!zOy!{Oz!|O{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#P!pO#U!qO#XPO#^!eO#aPO$^!^O$b!eO$f!]O$k!`O$l!eO$m!eO$n!eO~O#U#YO~O#U#gO#X#jO#^#kO~O#U#gO#X#jO#^#nO~O#U#gO#X#jO#^#qO~O#U#gO#X#jO#^#tO~O#U#uO#X#jO#^#xO~O#U#uO#X#jO#^#|O~O#U#uO#^$PO~O#U#uO#^$SO~O#U#uO#X#jO#^$WO~O#U#uO#^$YO~O#U#uO#^$[O~O#U$]O#^$_O~O#U#uO#^$bO)d$aO~O#U#uO#^$dO~O#U$]O#^$fO~OP$gO~OQ$hO#X#jO#^$jO~O#U$kO#X#jO#^$oO~O#U#gO#X#jO#^$sO)d$rO~O#U#uO#^$vO~O#U#uO#X#jO#^$zO~O#U#uO#X#jO#^$zO)d${O~O#U#uO#X#jO#^%PO~O#U#uO#X#jO#^%PO)d%QO~O#X#jOX$iXZ$iX[$iX]$iX^$iX_$iX`$iXa$iXb$iXc$iXd$iXe$iXf$iXg$iXh$iXi$iXj$iXk$iXl$iXm$iXn$iXo$iXp$iXq$iXr$iX{$iX|$iX}$iX!O$iX!P$iX!Q$iX!R$iX!S$iX!T$iX!U$iX!V$iX!W$iX!X$iX!Y$iX!Z$iX![$iX!]$iX!^$iX!_$iX!`$iX!a$iX!b$iX!c$iX!d$iX!e$iX!f$iX!g$iX!h$iX!i$iX!j$iX!k$iX!l$iX!m$iX!{$iX#U$iX#^$iX#a$iX$^$iX$b$iX$f$iX$k$iX$m$iX$n$iXY$iX#V$iX!x$iX!z$iX~Os$iXt$iXu$iXv$iXw$iXx$iXy$iXz$iX!w$iX!y$iX#P$iX$l$iX)V$iX)a$iX)b$iX)c$iX~P+xOU%SO#^%TO$^%SO~OU%UO~O#U#gO#^%WO~OU%XO#U%YO#^%ZO~OU%[O#U%]O#^%^O~O#U%_O#^%`O~OU%aO#U%bO#^%cO~O#U$kO#^%dO~O#U$kO~O#X#jO#^%jOX$}XZ$}X[$}X]$}X^$}X_$}X`$}Xa$}Xb$}Xc$}Xd$}Xe$}Xf$}Xg$}Xh$}Xi$}Xj$}Xk$}Xl$}Xm$}Xn$}Xo$}Xp$}Xq$}Xr$}Xs$}Xt$}Xu$}Xv$}Xw$}Xx$}Xy$}Xz$}X{$}X|$}X}$}X!O$}X!P$}X!Q$}X!R$}X!S$}X!T$}X!U$}X!V$}X!W$}X!X$}X!Y$}X!Z$}X![$}X!]$}X!^$}X!_$}X!`$}X!a$}X!b$}X!c$}X!d$}X!e$}X!f$}X!g$}X!h$}X!i$}X!j$}X!k$}X!l$}X!m$}X!w$}X!y$}X!{$}X#P$}X#U$}X#a$}X$^$}X$b$}X$f$}X$k$}X$l$}X$m$}X$n$}X)V$}XY$}X)a$}X)b$}X)c$}X#V$}X!x$}X!z$}X~O#^%kOX%OXZ%OX[%OX]%OX^%OX_%OX`%OXa%OXb%OXc%OXd%OXe%OXf%OXg%OXh%OXi%OXj%OXk%OXl%OXm%OXn%OXo%OXp%OXq%OXr%OXs%OXt%OXu%OXv%OXw%OXx%OXy%OXz%OX{%OX|%OX}%OX!O%OX!P%OX!Q%OX!R%OX!S%OX!T%OX!U%OX!V%OX!W%OX!X%OX!Y%OX!Z%OX![%OX!]%OX!^%OX!_%OX!`%OX!a%OX!b%OX!c%OX!d%OX!e%OX!f%OX!g%OX!h%OX!i%OX!j%OX!k%OX!l%OX!m%OX!w%OX!y%OX!{%OX#P%OX#U%OX#X%OX#a%OX$^%OX$b%OX$f%OX$k%OX$l%OX$m%OX$n%OX)V%OXY%OX)a%OX)b%OX)c%OX#V%OX!x%OX!z%OX~O#^%lOX%PXZ%PX[%PX]%PX^%PX_%PX`%PXa%PXb%PXc%PXd%PXe%PXf%PXg%PXh%PXi%PXj%PXk%PXl%PXm%PXn%PXo%PXp%PXq%PXr%PXs%PXt%PXu%PXv%PXw%PXx%PXy%PXz%PX{%PX|%PX}%PX!O%PX!P%PX!Q%PX!R%PX!S%PX!T%PX!U%PX!V%PX!W%PX!X%PX!Y%PX!Z%PX![%PX!]%PX!^%PX!_%PX!`%PX!a%PX!b%PX!c%PX!d%PX!e%PX!f%PX!g%PX!h%PX!i%PX!j%PX!k%PX!l%PX!m%PX!w%PX!y%PX!{%PX#P%PX#U%PX#X%PX#a%PX$^%PX$b%PX$f%PX$k%PX$l%PX$m%PX$n%PX)V%PXY%PX)a%PX)b%PX)c%PX#V%PX!x%PX!z%PX~O#U#uO#^%oO~O#U#gO#^%rO)d%qO~O#U#uO#X#jO#^%vO~O#U#gO~O#U#uO#^&TO~O#U#gO#X#jOZ%eX[%eX]%eX^%eX_%eX`%eXa%eXb%eXc%eXd%eXe%eXf%eXg%eXh%eXi%eXj%eXk%eXl%eXm%eXn%eXo%eXp%eXq%eXr%eX{%eX|%eX}%eX!O%eX!P%eX!Q%eX!R%eX!S%eX!T%eX!U%eX!V%eX!W%eX!X%eX!Y%eX!Z%eX![%eX!]%eX!^%eX!_%eX!`%eX!a%eX!b%eX!c%eX!d%eX!e%eX!f%eX!g%eX!h%eX!i%eX!j%eX!k%eX!l%eX!m%eX!w%eX!y%eX!{%eX#a%eX$^%eX$b%eX$f%eX$k%eX$l%eX$m%eX$n%eX)a%eX)b%eX#V%eX~O#^&WOX%eXs%eXt%eXu%eXv%eXw%eXx%eXy%eXz%eX#P%eX)V%eXY%eX)c%eX~PE}OXQOZ&nO[&oO]&pO^&qO_&mO`'QOa&tOb&YOc&_Od&bOe&eOf&hOg&iOh&jOi&kOj&lOk&rOl&sOm'fOo&uOp&vOq&wOr&xO{&yO|&zO}&|O!O&fO!P&gO!Q&{O!R&`O!S&aO!T&ZO!U&[O!V&]O!W&^O!X&}O!Y&cO!Z&dO!['OO!]'OO!^'OO!_'OO!`'PO!a'RO!b'SO!c'TO!d'UO!e'VO!f'WO!g'XO!h'YO!i'ZO!j'[O!k']O!l'^O!m'_O!{&XO#U'eO#X'hO#^'hO#a'hO$^'bO$b'hO$f'aO$m'hO$n'hO'O'hO'P'hO'Q'hO~O$k'kO~PKtO!z'mO~PKtO!x'pO~PKtOXQOZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#P!pO#U!qO#XPO#^!eO#aPO$^!^O$b!eO$f!]O$k!`O$l!eO$m!eO$n!eO~OY%UP~P!!wOY'dP~PKtOT'zO~OXQOZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#P!pO#U'|O#XPO#^!eO#aPO$^!^O$b!eO$f!]O$k!`O$l!eO$m!eO$n!eO)a'}O)b'}O)c'}O~O#V(UO~PVO#U(XO#X#jO#^(]O)d([O~O#U(XO#X#jO#^(aO)d(`O~O#U(XO#X#jO#^(eO)d(dO~O#U(XO#X#jO#^(iO)d(hO~O#U(XO#X#jO#^(mO)d(lO~O#U(XO#X#jO#^(qO)d(pO~O#U(XO#X#jO#^(uO)d(tO~O#U(XO#X#jO#^(yO)d(xO~Os(lPt(lPu(lPv(lPw(lPx(lPy(lPz(lP)V(lPY(lP#V(lP~P!!wO)V#OXY#OX#V#OX~PVOz!|Os(iPt(iPu(iPv(iPw(iPx(iPy(iP)V(iPY(iP#V(iP~P!!wOy!{Oz!|Os(fPt(fPu(fPv(fPw(fPx(fP)V(fPY(fP#V(fP~P!!wOx!zOy!{Oz!|Os(cPt(cPu(cPv(cPw(cP)V(cPY(cP#V(cP~P!!wOw!yOx!zOy!{Oz!|Os(`Pt(`Pu(`Pv(`P)V(`PY(`P#V(`P~P!!wOv!xOw!yOx!zOy!{Oz!|Os(]Pt(]Pu(]P)V(]PY(]P#V(]P~P!!wOu!wOv!xOw!yOx!zOy!{Oz!|Os(YPt(YP)V(YPY(YP#V(YP~P!!wOt!vOu!wOv!xOw!yOx!zOy!{Oz!|Os(VP)V(VPY(VP#V(VP~P!!wO!n)eO!o)hO!p)iO!q)jO!r)kO!s)lO!t)mO!u)nO!v)oO#V)fO#f)gO~O#U#gO#X#jOX#daZ#da[#da]#da^#da_#da`#daa#dab#dac#dad#dae#daf#dag#dah#dai#daj#dak#dal#dam#dan#dao#dap#daq#dar#das#dat#dau#dav#daw#dax#day#daz#da{#da|#da}#da!O#da!P#da!Q#da!R#da!S#da!T#da!U#da!V#da!W#da!X#da!Y#da!Z#da![#da!]#da!^#da!_#da!`#da!a#da!b#da!c#da!d#da!e#da!f#da!g#da!h#da!i#da!j#da!k#da!l#da!m#da!w#da!y#da!{#da#P#da#^#da#a#da$^#da$b#da$f#da$k#da$l#da$m#da$n#da~O#U#gO#X#jOX#SaZ#Sa[#Sa]#Sa^#Sa_#Sa`#Saa#Sab#Sac#Sad#Sae#Saf#Sag#Sah#Sai#Saj#Sak#Sal#Sam#San#Sao#Sap#Saq#Sar#Sas#Sat#Sau#Sav#Saw#Sax#Say#Saz#Sa{#Sa|#Sa}#Sa!O#Sa!P#Sa!Q#Sa!R#Sa!S#Sa!T#Sa!U#Sa!V#Sa!W#Sa!X#Sa!Y#Sa!Z#Sa![#Sa!]#Sa!^#Sa!_#Sa!`#Sa!a#Sa!b#Sa!c#Sa!d#Sa!e#Sa!f#Sa!g#Sa!h#Sa!i#Sa!j#Sa!k#Sa!l#Sa!m#Sa!w#Sa!y#Sa!{#Sa#P#Sa#^#Sa#a#Sa$^#Sa$b#Sa$f#Sa$k#Sa$l#Sa$m#Sa$n#Sa~O#U#gO#X#jOX']aY']aZ']a[']a]']a^']a_']a`']aa']ab']ac']ad']ae']af']ag']ah']ai']aj']ak']al']am']an']ao']ap']aq']ar']a{']a|']a}']a!O']a!P']a!Q']a!R']a!S']a!T']a!U']a!V']a!W']a!X']a!Y']a!Z']a![']a!]']a!^']a!_']a!`']a!a']a!b']a!c']a!d']a!e']a!f']a!g']a!h']a!i']a!j']a!k']a!l']a!m']a!w']a!y']a!{']a#P']a#^']a#a']a$^']a$b']a$f']a$k']a$l']a$m']a$n']a~O#U#gO#X#jOX'baY'baZ'ba['ba]'ba^'ba_'ba`'baa'bab'bac'bad'bae'baf'bag'bah'bai'baj'bak'bal'bam'bao'bap'baq'bar'ba{'ba|'ba}'ba!O'ba!P'ba!Q'ba!R'ba!S'ba!T'ba!U'ba!V'ba!W'ba!X'ba!Y'ba!Z'ba!['ba!]'ba!^'ba!_'ba!`'ba!a'ba!b'ba!c'ba!d'ba!e'ba!f'ba!g'ba!h'ba!i'ba!j'ba!k'ba!l'ba!m'ba!{'ba#^'ba#a'ba$^'ba$b'ba$f'ba$m'ba$n'ba'O'ba'P'ba'Q'ba~O#U#gO#X#jOX'gaY'gaZ'ga['ga]'ga^'ga_'ga`'gaa'gab'gac'gad'gae'gaf'gag'gah'gai'gaj'gak'gal'gam'gao'gap'gaq'gar'ga{'ga|'ga}'ga!O'ga!P'ga!Q'ga!R'ga!S'ga!T'ga!U'ga!V'ga!W'ga!X'ga!Y'ga!Z'ga!['ga!]'ga!^'ga!_'ga!`'ga!a'ga!b'ga!c'ga!d'ga!e'ga!f'ga!g'ga!h'ga!i'ga!j'ga!k'ga!l'ga!m'ga!{'ga#^'ga#a'ga$^'ga$b'ga$f'ga$m'ga$n'ga'O'ga'P'ga'Q'ga~O#U#gO#X#jOT'ka~O#U#gO#X#jOX'paZ'pa['pa]'pa^'pa_'pa`'paa'pab'pac'pad'pae'paf'pag'pah'pai'paj'pak'pal'pam'pan'pao'pap'paq'par'pa{'pa|'pa}'pa!O'pa!P'pa!Q'pa!R'pa!S'pa!T'pa!U'pa!V'pa!W'pa!X'pa!Y'pa!Z'pa!['pa!]'pa!^'pa!_'pa!`'pa!a'pa!b'pa!c'pa!d'pa!e'pa!f'pa!g'pa!h'pa!i'pa!j'pa!k'pa!l'pa!m'pa!w'pa!y'pa!{'pa#P'pa#^'pa#a'pa$^'pa$b'pa$f'pa$k'pa$l'pa$m'pa$n'pa)a'pa)b'pa)c'pa~O#U#gO#X#jOX'waZ'wa['wa]'wa^'wa_'wa`'waa'wab'wac'wad'wae'waf'wag'wah'wai'waj'wak'wal'wam'wan'wao'wap'waq'war'was'wat'wau'wav'waw'wax'way'waz'wa{'wa|'wa}'wa!O'wa!P'wa!Q'wa!R'wa!S'wa!T'wa!U'wa!V'wa!W'wa!X'wa!Y'wa!Z'wa!['wa!]'wa!^'wa!_'wa!`'wa!a'wa!b'wa!c'wa!d'wa!e'wa!f'wa!g'wa!h'wa!i'wa!j'wa!k'wa!l'wa!m'wa!w'wa!y'wa!{'wa#P'wa#^'wa#a'wa$^'wa$b'wa$f'wa$k'wa$l'wa$m'wa$n'wa~O#U#gO#X#jOX'{aZ'{a['{a]'{a^'{a_'{a`'{aa'{ab'{ac'{ad'{ae'{af'{ag'{ah'{ai'{aj'{ak'{al'{am'{an'{ao'{ap'{aq'{ar'{as'{at'{au'{av'{aw'{ax'{ay'{az'{a{'{a|'{a}'{a!O'{a!P'{a!Q'{a!R'{a!S'{a!T'{a!U'{a!V'{a!W'{a!X'{a!Y'{a!Z'{a!['{a!]'{a!^'{a!_'{a!`'{a!a'{a!b'{a!c'{a!d'{a!e'{a!f'{a!g'{a!h'{a!i'{a!j'{a!k'{a!l'{a!m'{a!w'{a!y'{a!{'{a#P'{a#^'{a#a'{a$^'{a$b'{a$f'{a$k'{a$l'{a$m'{a$n'{a~O#U#gO#X#jOX(PaZ(Pa[(Pa](Pa^(Pa_(Pa`(Paa(Pab(Pac(Pad(Pae(Paf(Pag(Pah(Pai(Paj(Pak(Pal(Pam(Pan(Pao(Pap(Paq(Par(Pas(Pat(Pau(Pav(Paw(Pax(Pay(Paz(Pa{(Pa|(Pa}(Pa!O(Pa!P(Pa!Q(Pa!R(Pa!S(Pa!T(Pa!U(Pa!V(Pa!W(Pa!X(Pa!Y(Pa!Z(Pa![(Pa!](Pa!^(Pa!_(Pa!`(Pa!a(Pa!b(Pa!c(Pa!d(Pa!e(Pa!f(Pa!g(Pa!h(Pa!i(Pa!j(Pa!k(Pa!l(Pa!m(Pa!w(Pa!y(Pa!{(Pa#P(Pa#^(Pa#a(Pa$^(Pa$b(Pa$f(Pa$k(Pa$l(Pa$m(Pa$n(Pa~OY*VO~OXQOZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#P*YO#U*XO#XPO#^!eO#aPO$^!^O$b!eO$f!]O$k!`O$l!eO$m!eO$n!eO)a*YO)b*YO)c*YO#V#`P~OZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#U*^O#^!eO$^!^O$b!eO$f=}O$k!`O$l!eO$m!eO$n!eO)a*_O)b*_O~O#a#YP~P#<bO#U#gO#X#jO~O#U#gO#^*dO~O#U#gO#X#jO#^*dO~O#U#gO#^*gO~O#U#gO#X#jO#^*gO~O#U#gO#^*jO~O#U#gO#X#jO#^*jO~OZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#U*lO#XPO#^!eO#aPO$^!^O$b!eO$f!]O$k!`O$l!eO$m!eO$n!eO)a*mO)b*mO)c*mO#V#nP~O#U#uO#^*qO~O#U#uO#X#jO#^*qO~O#U#uO~O#U#uO#X#jO~O#U#gO#^*zO~O#U#gO#^*}O~OR+PO~O#U$]O~O#U#uO#^+VO~OQ+YO~OQ+YO#X#jO~OR+[O~O#U$kO#X#jO~O#U#gO#X#jO#^+aO~O#U#uO#X#jO#^+eO~O#U#uO#X#jO#^+gO~O#U#uO#X#jO#^+jO~O#U#uO#X#jO#^+lO~O#U+sO#X+nO#^+qO$b+tO)a+mO~OU+vO$^+vO~OU+wO#^+yO)o+xO~O#U+sO#X#jO#^+{O$b+tO~OR,PO~OU,QO#U,RO~OR,UO~OU,VO#U,WO~OR,XO~O#U,YO~OR,]O~OU,^O#U,_O~OS,`O~O#^,aOX$}aZ$}a[$}a]$}a^$}a_$}a`$}aa$}ab$}ac$}ad$}ae$}af$}ag$}ah$}ai$}aj$}ak$}al$}am$}an$}ao$}ap$}aq$}ar$}as$}at$}au$}av$}aw$}ax$}ay$}az$}a{$}a|$}a}$}a!O$}a!P$}a!Q$}a!R$}a!S$}a!T$}a!U$}a!V$}a!W$}a!X$}a!Y$}a!Z$}a![$}a!]$}a!^$}a!_$}a!`$}a!a$}a!b$}a!c$}a!d$}a!e$}a!f$}a!g$}a!h$}a!i$}a!j$}a!k$}a!l$}a!m$}a!w$}a!y$}a!{$}a#P$}a#U$}a#X$}a#a$}a$^$}a$b$}a$f$}a$k$}a$l$}a$m$}a$n$}a)V$}aY$}a)a$}a)b$}a)c$}a#V$}a!x$}a!z$}a~O#U#uO#^,dO~O#U#gO)d,gO~O#U#gO#^,kO~O#U#uO#^,nO~O#U#gO#X#jOX%eaZ%ea[%ea]%ea^%ea_%ea`%eaa%eab%eac%ead%eae%eaf%eag%eah%eai%eaj%eak%eal%eam%ean%eao%eap%eaq%ear%eas%eat%eau%eav%eaw%eax%eay%eaz%ea{%ea|%ea}%ea!O%ea!P%ea!Q%ea!R%ea!S%ea!T%ea!U%ea!V%ea!W%ea!X%ea!Y%ea!Z%ea![%ea!]%ea!^%ea!_%ea!`%ea!a%ea!b%ea!c%ea!d%ea!e%ea!f%ea!g%ea!h%ea!i%ea!j%ea!k%ea!l%ea!m%ea!w%ea!y%ea!{%ea#P%ea#^%ea#a%ea$^%ea$b%ea$f%ea$k%ea$l%ea$m%ea$n%ea)V%eaY%ea)a%ea)b%ea)c%ea#V%ea~O'O$iX'P$iX'Q$iX~P+xO#U#gO#X#jO#^,tO~O#U#gO#X#jO#^,wO~O#U#gO#X#jO#^,zO~O#U#gO#X#jO#^,}O~O#U#uO#X#jO#^-QO~O#U#uO#X#jO#^-UO~O#U#uO#^-XO~O#U#uO#^-[O~O#U#uO#X#jO#^-_O~O#U#uO#^-aO~O#U#uO#^-cO~O#U$]O#^-eO~O#U#uO#^-hO)d-gO~O#U#uO#^-jO~O#U$]O#^-lO~OP-mO~OQ-nO#X#jO#^-pO~O#U$kO#X#jO#^-tO~O#U#gO#X#jO#^-xO)d-wO~O#U#uO#^-zO~O#U#uO#X#jO#^-}O~O#U#uO#X#jO#^-}O)d.OO~O#U#uO#X#jO#^.RO~O#U#uO#X#jO#^.RO)d.SO~OU.TO#^.UO$^.TO~OU.VO~O#U#gO#^.XO~OU.YO#U.ZO#^.[O~OU.]O#U.^O#^._O~O#U.`O#^.aO~OU.bO#U.cO#^.dO~O#X#jO#^.jOX&dXZ&dX[&dX]&dX^&dX_&dX`&dXa&dXb&dXc&dXd&dXe&dXf&dXg&dXh&dXi&dXj&dXk&dXl&dXm&dXo&dXp&dXq&dXr&dX{&dX|&dX}&dX!O&dX!P&dX!Q&dX!R&dX!S&dX!T&dX!U&dX!V&dX!W&dX!X&dX!Y&dX!Z&dX![&dX!]&dX!^&dX!_&dX!`&dX!a&dX!b&dX!c&dX!d&dX!e&dX!f&dX!g&dX!h&dX!i&dX!j&dX!k&dX!l&dX!m&dX!{&dX#U&dX#a&dX$^&dX$b&dX$f&dX$k&dX$m&dX$n&dX'O&dX'P&dX'Q&dX!z&dX!x&dXY&dX#V&dXn&dX~O#^.kOX&eXZ&eX[&eX]&eX^&eX_&eX`&eXa&eXb&eXc&eXd&eXe&eXf&eXg&eXh&eXi&eXj&eXk&eXl&eXm&eXo&eXp&eXq&eXr&eX{&eX|&eX}&eX!O&eX!P&eX!Q&eX!R&eX!S&eX!T&eX!U&eX!V&eX!W&eX!X&eX!Y&eX!Z&eX![&eX!]&eX!^&eX!_&eX!`&eX!a&eX!b&eX!c&eX!d&eX!e&eX!f&eX!g&eX!h&eX!i&eX!j&eX!k&eX!l&eX!m&eX!{&eX#U&eX#X&eX#a&eX$^&eX$b&eX$f&eX$k&eX$m&eX$n&eX'O&eX'P&eX'Q&eX!z&eX!x&eXY&eX#V&eXn&eX~O#^.lOX&fXZ&fX[&fX]&fX^&fX_&fX`&fXa&fXb&fXc&fXd&fXe&fXf&fXg&fXh&fXi&fXj&fXk&fXl&fXm&fXo&fXp&fXq&fXr&fX{&fX|&fX}&fX!O&fX!P&fX!Q&fX!R&fX!S&fX!T&fX!U&fX!V&fX!W&fX!X&fX!Y&fX!Z&fX![&fX!]&fX!^&fX!_&fX!`&fX!a&fX!b&fX!c&fX!d&fX!e&fX!f&fX!g&fX!h&fX!i&fX!j&fX!k&fX!l&fX!m&fX!{&fX#U&fX#X&fX#a&fX$^&fX$b&fX$f&fX$k&fX$m&fX$n&fX'O&fX'P&fX'Q&fX!z&fX!x&fXY&fX#V&fXn&fX~O#U#uO#^.oO~O#U#gO#^.rO)d.qO~O#U.}O~O#U#uO#^/SO~O)W/TO)X/VO~O#V/WO~PKtO)q/YO)r/YO)s/YO)t/YO)u/YO)v/YO)w/YO)x/YO)y/YO)z/YO){/YO)|/YO)}/YO*O/YO*P/YO*Q/YO*R/YO*S/YO*T/YO*U/YO*V/YO*W/YO*X/YO*Y/YO*Z/YO*[/YO*]/YO*^/YO*_/YO*`/YO*a/YO*b/YO*c/YO~O#^/[O~P$B]On/]O~PKtO$k%hX!z%hX!x%hXY%hX#V%hXn%hX~PKtO$k/aO~PKtO$k/cO~O!z'mO~O!x'pO~OY/fO~OY%UX#V%UX~P!!wOY/hO~OY/jO~OY/lO~OY/nO~OY'sX#V'sX~P!(ROY/rO~OY/tO~OY/vO~OY/xO~O#V/zO~O#U(XO#^/}O~O#U(XO#X#jO#^0PO~O#U(XO#X#jO#^0PO)d0QO~O#U(XO#^0SO~O#U(XO#X#jO#^0UO~O#U(XO#X#jO#^0UO)d0VO~O#U(XO#^0XO~O#U(XO#X#jO#^0ZO~O#U(XO#X#jO#^0ZO)d0[O~O#U(XO#^0^O~O#U(XO#X#jO#^0`O~O#U(XO#X#jO#^0`O)d0aO~O#U(XO#^0cO~O#U(XO#X#jO#^0eO~O#U(XO#X#jO#^0eO)d0fO~O#U(XO#^0hO~O#U(XO#X#jO#^0jO~O#U(XO#X#jO#^0jO)d0kO~O#U(XO#^0mO~O#U(XO#X#jO#^0oO~O#U(XO#X#jO#^0oO)d0pO~O#U(XO#^0rO~O#U(XO#X#jO#^0tO~O#U(XO#X#jO#^0tO)d0uO~Os(lXt(lXu(lXv(lXw(lXx(lXy(lXz(lX)V(lXY(lX#V(lX~P!!wOz!|Os(iXt(iXu(iXv(iXw(iXx(iXy(iX)V(iXY(iX#V(iX~P!!wOy!{Oz!|Os(fXt(fXu(fXv(fXw(fXx(fX)V(fXY(fX#V(fX~P!!wOx!zOy!{Oz!|Os(cXt(cXu(cXv(cXw(cX)V(cXY(cX#V(cX~P!!wOw!yOx!zOy!{Oz!|Os(`Xt(`Xu(`Xv(`X)V(`XY(`X#V(`X~P!!wOv!xOw!yOx!zOy!{Oz!|Os(]Xt(]Xu(]X)V(]XY(]X#V(]X~P!!wOu!wOv!xOw!yOx!zOy!{Oz!|Os(YXt(YX)V(YXY(YX#V(YX~P!!wOt!vOu!wOv!xOw!yOx!zOy!{Oz!|Os(VX)V(VXY(VX#V(VX~P!!wO#V1OO~O#V1PO~O#V1QO~O#V1RO~O#V1SO~O#V1TO~O#V1UO~O#V1VO~O#V1WO~O#V1XO~O#U#gOX#diZ#di[#di]#di^#di_#di`#dia#dib#dic#did#die#dif#dig#dih#dii#dij#dik#dil#dim#din#dio#dip#diq#dir#dis#dit#diu#div#diw#dix#diy#diz#di{#di|#di}#di!O#di!P#di!Q#di!R#di!S#di!T#di!U#di!V#di!W#di!X#di!Y#di!Z#di![#di!]#di!^#di!_#di!`#di!a#di!b#di!c#di!d#di!e#di!f#di!g#di!h#di!i#di!j#di!k#di!l#di!m#di!w#di!y#di!{#di#P#di#X#di#^#di#a#di$^#di$b#di$f#di$k#di$l#di$m#di$n#di~O#U#gOX#SiZ#Si[#Si]#Si^#Si_#Si`#Sia#Sib#Sic#Sid#Sie#Sif#Sig#Sih#Sii#Sij#Sik#Sil#Sim#Sin#Sio#Sip#Siq#Sir#Sis#Sit#Siu#Siv#Siw#Six#Siy#Siz#Si{#Si|#Si}#Si!O#Si!P#Si!Q#Si!R#Si!S#Si!T#Si!U#Si!V#Si!W#Si!X#Si!Y#Si!Z#Si![#Si!]#Si!^#Si!_#Si!`#Si!a#Si!b#Si!c#Si!d#Si!e#Si!f#Si!g#Si!h#Si!i#Si!j#Si!k#Si!l#Si!m#Si!w#Si!y#Si!{#Si#P#Si#X#Si#^#Si#a#Si$^#Si$b#Si$f#Si$k#Si$l#Si$m#Si$n#Si~O#U#gOX']iY']iZ']i[']i]']i^']i_']i`']ia']ib']ic']id']ie']if']ig']ih']ii']ij']ik']il']im']in']io']ip']iq']ir']i{']i|']i}']i!O']i!P']i!Q']i!R']i!S']i!T']i!U']i!V']i!W']i!X']i!Y']i!Z']i![']i!]']i!^']i!_']i!`']i!a']i!b']i!c']i!d']i!e']i!f']i!g']i!h']i!i']i!j']i!k']i!l']i!m']i!w']i!y']i!{']i#P']i#X']i#^']i#a']i$^']i$b']i$f']i$k']i$l']i$m']i$n']i~O#U#gOX'biY'biZ'bi['bi]'bi^'bi_'bi`'bia'bib'bic'bid'bie'bif'big'bih'bii'bij'bik'bil'bim'bio'bip'biq'bir'bi{'bi|'bi}'bi!O'bi!P'bi!Q'bi!R'bi!S'bi!T'bi!U'bi!V'bi!W'bi!X'bi!Y'bi!Z'bi!['bi!]'bi!^'bi!_'bi!`'bi!a'bi!b'bi!c'bi!d'bi!e'bi!f'bi!g'bi!h'bi!i'bi!j'bi!k'bi!l'bi!m'bi!{'bi#X'bi#^'bi#a'bi$^'bi$b'bi$f'bi$m'bi$n'bi'O'bi'P'bi'Q'bi~O#U#gOX'giY'giZ'gi['gi]'gi^'gi_'gi`'gia'gib'gic'gid'gie'gif'gig'gih'gii'gij'gik'gil'gim'gio'gip'giq'gir'gi{'gi|'gi}'gi!O'gi!P'gi!Q'gi!R'gi!S'gi!T'gi!U'gi!V'gi!W'gi!X'gi!Y'gi!Z'gi!['gi!]'gi!^'gi!_'gi!`'gi!a'gi!b'gi!c'gi!d'gi!e'gi!f'gi!g'gi!h'gi!i'gi!j'gi!k'gi!l'gi!m'gi!{'gi#X'gi#^'gi#a'gi$^'gi$b'gi$f'gi$m'gi$n'gi'O'gi'P'gi'Q'gi~O#U#gOT'ki~O#U#gOX'piZ'pi['pi]'pi^'pi_'pi`'pia'pib'pic'pid'pie'pif'pig'pih'pii'pij'pik'pil'pim'pin'pio'pip'piq'pir'pi{'pi|'pi}'pi!O'pi!P'pi!Q'pi!R'pi!S'pi!T'pi!U'pi!V'pi!W'pi!X'pi!Y'pi!Z'pi!['pi!]'pi!^'pi!_'pi!`'pi!a'pi!b'pi!c'pi!d'pi!e'pi!f'pi!g'pi!h'pi!i'pi!j'pi!k'pi!l'pi!m'pi!w'pi!y'pi!{'pi#P'pi#X'pi#^'pi#a'pi$^'pi$b'pi$f'pi$k'pi$l'pi$m'pi$n'pi)a'pi)b'pi)c'pi~O#U#gOX'wiZ'wi['wi]'wi^'wi_'wi`'wia'wib'wic'wid'wie'wif'wig'wih'wii'wij'wik'wil'wim'win'wio'wip'wiq'wir'wis'wit'wiu'wiv'wiw'wix'wiy'wiz'wi{'wi|'wi}'wi!O'wi!P'wi!Q'wi!R'wi!S'wi!T'wi!U'wi!V'wi!W'wi!X'wi!Y'wi!Z'wi!['wi!]'wi!^'wi!_'wi!`'wi!a'wi!b'wi!c'wi!d'wi!e'wi!f'wi!g'wi!h'wi!i'wi!j'wi!k'wi!l'wi!m'wi!w'wi!y'wi!{'wi#P'wi#X'wi#^'wi#a'wi$^'wi$b'wi$f'wi$k'wi$l'wi$m'wi$n'wi~O#U#gOX'{iZ'{i['{i]'{i^'{i_'{i`'{ia'{ib'{ic'{id'{ie'{if'{ig'{ih'{ii'{ij'{ik'{il'{im'{in'{io'{ip'{iq'{ir'{is'{it'{iu'{iv'{iw'{ix'{iy'{iz'{i{'{i|'{i}'{i!O'{i!P'{i!Q'{i!R'{i!S'{i!T'{i!U'{i!V'{i!W'{i!X'{i!Y'{i!Z'{i!['{i!]'{i!^'{i!_'{i!`'{i!a'{i!b'{i!c'{i!d'{i!e'{i!f'{i!g'{i!h'{i!i'{i!j'{i!k'{i!l'{i!m'{i!w'{i!y'{i!{'{i#P'{i#X'{i#^'{i#a'{i$^'{i$b'{i$f'{i$k'{i$l'{i$m'{i$n'{i~O#U#gOX(PiZ(Pi[(Pi](Pi^(Pi_(Pi`(Pia(Pib(Pic(Pid(Pie(Pif(Pig(Pih(Pii(Pij(Pik(Pil(Pim(Pin(Pio(Pip(Piq(Pir(Pis(Pit(Piu(Piv(Piw(Pix(Piy(Piz(Pi{(Pi|(Pi}(Pi!O(Pi!P(Pi!Q(Pi!R(Pi!S(Pi!T(Pi!U(Pi!V(Pi!W(Pi!X(Pi!Y(Pi!Z(Pi![(Pi!](Pi!^(Pi!_(Pi!`(Pi!a(Pi!b(Pi!c(Pi!d(Pi!e(Pi!f(Pi!g(Pi!h(Pi!i(Pi!j(Pi!k(Pi!l(Pi!m(Pi!w(Pi!y(Pi!{(Pi#P(Pi#X(Pi#^(Pi#a(Pi$^(Pi$b(Pi$f(Pi$k(Pi$l(Pi$m(Pi$n(Pi~O#U1eO~OXQOZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm!_On!_OoqOprOqsOrtO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w!cO!y!aO!{lO#XPO#^!eO#aPO$^!^O$b!eO$f!]O$k!`O$l!eO$m!eO$n!eO~O#P*YO#U*XO)a*YO)b*YO)c*YO#V#`X~P&&nO#V1iO~O#V#YP~P#<bO#a#YX#V#YX~P#<bO#a1lO~O#U#gO#^1oO~O#U#gO#^1qO~O#U#gO#^1sO~O#U*lO)a*mO)b*mO)c*mO#V#nX~P&&qO#V1vO~O#U#uO#^1xO~O#U#gO#^1|O~O#U#gO#^2OO~O#V2PO~O#X#jOX#|iZ#|i[#|i]#|i^#|i_#|i`#|ia#|ib#|ic#|id#|ie#|if#|ig#|ih#|ii#|ij#|ik#|il#|im#|in#|io#|ip#|iq#|ir#|is#|it#|iu#|iv#|iw#|ix#|iy#|iz#|i{#|i|#|i}#|i!O#|i!P#|i!Q#|i!R#|i!S#|i!T#|i!U#|i!V#|i!W#|i!X#|i!Y#|i!Z#|i![#|i!]#|i!^#|i!_#|i!`#|i!a#|i!b#|i!c#|i!d#|i!e#|i!f#|i!g#|i!h#|i!i#|i!j#|i!k#|i!l#|i!m#|i!w#|i!y#|i!{#|i#P#|i#U#|i#^#|i#a#|i$^#|i$b#|i$f#|i$k#|i$l#|i$m#|i$n#|i)V#|iY#|i)a#|i)b#|i)c#|i#V#|i!x#|i!z#|i~OQ2VO~O#V2WO~O#U#uO#^2]O~O#U#uO#X#jO#^2]O~O#U#uO#X#jO#^2_O~O#U#uO#^2bO~O#U#uO#X#jO#^2bO~O#U#uO#X#jO#^2dO~O)e2fO)f2fO)g2fO)h2fO)i2fO)j2fO)k2fO)l2fO)m2fO~O#U+sO#X+nO#^2iO$b+tO)a+mO~O#U2mO#^+{O~OX2tOY2tOZhO[iO]jO^kO_gO`|OapObSOcXOd[Oe_OfbOgcOhdOieOjfOknOloOm2tOn2tOoqOprOqsOrtOs2sOt2sOu2sOv2sOw2sOx2sOy2sOz2sO{uO|vO}xO!O`O!PaO!QwO!RYO!SZO!TTO!UUO!VVO!WWO!XyO!Y]O!Z^O![zO!]zO!^zO!_zO!`{O!a}O!b!OO!c!PO!d!QO!e!RO!f!SO!g!TO!h!UO!i!VO!j!WO!k!XO!l!YO!m!ZO!w2tO!x2tO!y2tO!z2tO!{lO#P2tO#U2rO#X2tO#^2tO#a2tO$^2oO$b2tO$f2nO$k2tO$l2tO$m2tO$n2tO)a2tO)b2tO)c2tO~O#V2vO~P&6lO#U+sO#X+nO#^2yO$b+tO)a+mO~OU2zO#^2{O~OU2zO#^2{O)o2|O~O#V3PO~OR3RO~O#V3TO~OR3VO~O#V3WO~OR3XO~O#U+sO#^+{O$b+tO~O#V3[O~OR3^O~O#U3_O#^3aO~O#U#uO#^3cO~O#U#gO#^3fO~O#U#uO#^3hO~O#U#gO#^3lO~O#U#gO#X#jO#^3lO~O#U#gO#^3oO~O#U#gO#X#jO#^3oO~O#U#gO#^3rO~O#U#gO#X#jO#^3rO~O#U#uO#^3uO~O#U#uO#X#jO#^3uO~O#U.}O#^4OO~O#U.}O#^4RO~O#U#uO#^4YO~OQ4]O~OQ4]O#X#jO~O#U#gO#X#jO#^4cO~O#U#uO#X#jO#^4gO~O#U#uO#X#jO#^4iO~O#U#uO#X#jO#^4lO~O#U#uO#X#jO#^4nO~O#U+sO#X+nO#^4pO$b+tO)a+mO~OU4rO$^4rO~OU4sO#^4uO)o4tO~OR4yO~OU4zO#U4{O~OR5OO~OU5PO#U5QO~OR5RO~O#U5SO~OR5VO~OU5WO#U5XO~O#^5YOX&daZ&da[&da]&da^&da_&da`&daa&dab&dac&dad&dae&daf&dag&dah&dai&daj&dak&dal&dam&dao&dap&daq&dar&da{&da|&da}&da!O&da!P&da!Q&da!R&da!S&da!T&da!U&da!V&da!W&da!X&da!Y&da!Z&da![&da!]&da!^&da!_&da!`&da!a&da!b&da!c&da!d&da!e&da!f&da!g&da!h&da!i&da!j&da!k&da!l&da!m&da!{&da#U&da#X&da#a&da$^&da$b&da$f&da$k&da$m&da$n&da'O&da'P&da'Q&da!z&da!x&daY&da#V&dan&da~O#U#uO#^5]O~O#U#gO)d5`O~O#U#gO#^5cO~O#V5dO~PKtO#U#uO#^5gO~O#U.}O#^5jO~O)W/TO)X5lO~O#V5mO~O#^5pO~P$B]On/]O~O$k5rO~O#U5tO~OV5vOW5vOX#RiZ#Ri[#Ri]#Ri^#Ri_#Ri`#Ria#Rib#Ric#Rid#Rie#Rif#Rig#Rih#Rii#Rij#Rik#Ril#Rim#Rin#Rio#Rip#Riq#Rir#Ri{#Ri|#Ri}#Ri!O#Ri!P#Ri!Q#Ri!R#Ri!S#Ri!T#Ri!U#Ri!V#Ri!W#Ri!X#Ri!Y#Ri!Z#Ri![#Ri!]#Ri!^#Ri!_#Ri!`#Ri!a#Ri!b#Ri!c#Ri!d#Ri!e#Ri!f#Ri!g#Ri!h#Ri!i#Ri!j#Ri!k#Ri!l#Ri!m#Ri!{#Ri#U#Ri#X#Ri#^#Ri#a#Ri$^#Ri$b#Ri$f#Ri$k#Ri$m#Ri$n#RiY#Ri#V#Ri~Os#Rit#Riu#Riv#Riw#Rix#Riy#Riz#Ri!w#Ri!y#Ri#P#Ri$l#Ri)V#Ri)a#Ri)b#Ri)c#Ri~P&K`O#U5wO~O#U5yO~O#U5{O~O#U5}O~O#V6PO~O#U6QO~O#U6SO~O#U6UO~O#U6WO~O#V6YO~O#U(XO~O#U(XO#^6[O~O#U(XO#X#jO#^6[O~O#U(XO#X#jO#^6^O~O#U(XO#^6`O~O#U(XO#X#jO#^6`O~O#U(XO#X#jO#^6bO~O#U(XO#^6dO~O#U(XO#X#jO#^6dO~O#U(XO#X#jO#^6fO~O#U(XO#^6hO~O#U(XO#X#jO#^6hO~O#U(XO#X#jO#^6jO~O#U(XO#^6lO~O#U(XO#X#jO#^6lO~O#U(XO#X#jO#^6nO~O#U(XO#^6pO~O#U(XO#X#jO#^6pO~O#U(XO#X#jO#^6rO~O#U(XO#^6tO~O#U(XO#X#jO#^6tO~O#U(XO#X#jO#^6vO~O#U(XO#^6xO~O#U(XO#X#jO#^6xO~O#U(XO#X#jO#^6zO~O#U#gOX#dqZ#dq[#dq]#dq^#dq_#dq`#dqa#dqb#dqc#dqd#dqe#dqf#dqg#dqh#dqi#dqj#dqk#dql#dqm#dqn#dqo#dqp#dqq#dqr#dqs#dqt#dqu#dqv#dqw#dqx#dqy#dqz#dq{#dq|#dq}#dq!O#dq!P#dq!Q#dq!R#dq!S#dq!T#dq!U#dq!V#dq!W#dq!X#dq!Y#dq!Z#dq![#dq!]#dq!^#dq!_#dq!`#dq!a#dq!b#dq!c#dq!d#dq!e#dq!f#dq!g#dq!h#dq!i#dq!j#dq!k#dq!l#dq!m#dq!w#dq!y#dq!{#dq#P#dq#X#dq#^#dq#a#dq$^#dq$b#dq$f#dq$k#dq$l#dq$m#dq$n#dq~O#U#gOX#SqZ#Sq[#Sq]#Sq^#Sq_#Sq`#Sqa#Sqb#Sqc#Sqd#Sqe#Sqf#Sqg#Sqh#Sqi#Sqj#Sqk#Sql#Sqm#Sqn#Sqo#Sqp#Sqq#Sqr#Sqs#Sqt#Squ#Sqv#Sqw#Sqx#Sqy#Sqz#Sq{#Sq|#Sq}#Sq!O#Sq!P#Sq!Q#Sq!R#Sq!S#Sq!T#Sq!U#Sq!V#Sq!W#Sq!X#Sq!Y#Sq!Z#Sq![#Sq!]#Sq!^#Sq!_#Sq!`#Sq!a#Sq!b#Sq!c#Sq!d#Sq!e#Sq!f#Sq!g#Sq!h#Sq!i#Sq!j#Sq!k#Sq!l#Sq!m#Sq!w#Sq!y#Sq!{#Sq#P#Sq#X#Sq#^#Sq#a#Sq$^#Sq$b#Sq$f#Sq$k#Sq$l#Sq$m#Sq$n#Sq~O#U#gOX']qY']qZ']q[']q]']q^']q_']q`']qa']qb']qc']qd']qe']qf']qg']qh']qi']qj']qk']ql']qm']qn']qo']qp']qq']qr']q{']q|']q}']q!O']q!P']q!Q']q!R']q!S']q!T']q!U']q!V']q!W']q!X']q!Y']q!Z']q![']q!]']q!^']q!_']q!`']q!a']q!b']q!c']q!d']q!e']q!f']q!g']q!h']q!i']q!j']q!k']q!l']q!m']q!w']q!y']q!{']q#P']q#X']q#^']q#a']q$^']q$b']q$f']q$k']q$l']q$m']q$n']q~O#U#gOX'bqY'bqZ'bq['bq]'bq^'bq_'bq`'bqa'bqb'bqc'bqd'bqe'bqf'bqg'bqh'bqi'bqj'bqk'bql'bqm'bqo'bqp'bqq'bqr'bq{'bq|'bq}'bq!O'bq!P'bq!Q'bq!R'bq!S'bq!T'bq!U'bq!V'bq!W'bq!X'bq!Y'bq!Z'bq!['bq!]'bq!^'bq!_'bq!`'bq!a'bq!b'bq!c'bq!d'bq!e'bq!f'bq!g'bq!h'bq!i'bq!j'bq!k'bq!l'bq!m'bq!{'bq#X'bq#^'bq#a'bq$^'bq$b'bq$f'bq$m'bq$n'bq'O'bq'P'bq'Q'bq~O#U#gOX'gqY'gqZ'gq['gq]'gq^'gq_'gq`'gqa'gqb'gqc'gqd'gqe'gqf'gqg'gqh'gqi'gqj'gqk'gql'gqm'gqo'gqp'gqq'gqr'gq{'gq|'gq}'gq!O'gq!P'gq!Q'gq!R'gq!S'gq!T'gq!U'gq!V'gq!W'gq!X'gq!Y'gq!Z'gq!['gq!]'gq!^'gq!_'gq!`'gq!a'gq!b'gq!c'gq!d'gq!e'gq!f'gq!g'gq!h'gq!i'gq!j'gq!k'gq!l'gq!m'gq!{'gq#X'gq#^'gq#a'gq$^'gq$b'gq$f'gq$m'gq$n'gq'O'gq'P'gq'Q'gq~O#U#gOT'kq~O#U#gOX'pqZ'pq['pq]'pq^'pq_'pq`'pqa'pqb'pqc'pqd'pqe'pqf'pqg'pqh'pqi'pqj'pqk'pql'pqm'pqn'pqo'pqp'pqq'pqr'pq{'pq|'pq}'pq!O'pq!P'pq!Q'pq!R'pq!S'pq!T'pq!U'pq!V'pq!W'pq!X'pq!Y'pq!Z'pq!['pq!]'pq!^'pq!_'pq!`'pq!a'pq!b'pq!c'pq!d'pq!e'pq!f'pq!g'pq!h'pq!i'pq!j'pq!k'pq!l'pq!m'pq!w'pq!y'pq!{'pq#P'pq#X'pq#^'pq#a'pq$^'pq$b'pq$f'pq$k'pq$l'pq$m'pq$n'pq)a'pq)b'pq)c'pq~O#U#gOX'wqZ'wq['wq]'wq^'wq_'wq`'wqa'wqb'wqc'wqd'wqe'wqf'wqg'wqh'wqi'wqj'wqk'wql'wqm'wqn'wqo'wqp'wqq'wqr'wqs'wqt'wqu'wqv'wqw'wqx'wqy'wqz'wq{'wq|'wq}'wq!O'wq!P'wq!Q'wq!R'wq!S'wq!T'wq!U'wq!V'wq!W'wq!X'wq!Y'wq!Z'wq!['wq!]'wq!^'wq!_'wq!`'wq!a'wq!b'wq!c'wq!d'wq!e'wq!f'wq!g'wq!h'wq!i'wq!j'wq!k'wq!l'wq!m'wq!w'wq!y'wq!{'wq#P'wq#X'wq#^'wq#a'wq$^'wq$b'wq$f'wq$k'wq$l'wq$m'wq$n'wq~O#U#gOX'{qZ'{q['{q]'{q^'{q_'{q`'{qa'{qb'{qc'{qd'{qe'{qf'{qg'{qh'{qi'{qj'{qk'{ql'{qm'{qn'{qo'{qp'{qq'{qr'{qs'{qt'{qu'{qv'{qw'{qx'{qy'{qz'{q{'{q|'{q}'{q!O'{q!P'{q!Q'{q!R'{q!S'{q!T'{q!U'{q!V'{q!W'{q!X'{q!Y'{q!Z'{q!['{q!]'{q!^'{q!_'{q!`'{q!a'{q!b'{q!c'{q!d'{q!e'{q!f'{q!g'{q!h'{q!i'{q!j'{q!k'{q!l'{q!m'{q!w'{q!y'{q!{'{q#P'{q#X'{q#^'{q#a'{q$^'{q$b'{q$f'{q$k'{q$l'{q$m'{q$n'{q~O#U#gOX(PqZ(Pq[(Pq](Pq^(Pq_(Pq`(Pqa(Pqb(Pqc(Pqd(Pqe(Pqf(Pqg(Pqh(Pqi(Pqj(Pqk(Pql(Pqm(Pqn(Pqo(Pqp(Pqq(Pqr(Pqs(Pqt(Pqu(Pqv(Pqw(Pqx(Pqy(Pqz(Pq{(Pq|(Pq}(Pq!O(Pq!P(Pq!Q(Pq!R(Pq!S(Pq!T(Pq!U(Pq!V(Pq!W(Pq!X(Pq!Y(Pq!Z(Pq![(Pq!](Pq!^(Pq!_(Pq!`(Pq!a(Pq!b(Pq!c(Pq!d(Pq!e(Pq!f(Pq!g(Pq!h(Pq!i(Pq!j(Pq!k(Pq!l(Pq!m(Pq!w(Pq!y(Pq!{(Pq#P(Pq#X(Pq#^(Pq#a(Pq$^(Pq$b(Pq$f(Pq$k(Pq$l(Pq$m(Pq$n(Pq~O#V6{O~O#V6}O~O#V7RO~O#X#jOX#|qZ#|q[#|q]#|q^#|q_#|q`#|qa#|qb#|qc#|qd#|qe#|qf#|qg#|qh#|qi#|qj#|qk#|ql#|qm#|qn#|qo#|qp#|qq#|qr#|qs#|qt#|qu#|qv#|qw#|qx#|qy#|qz#|q{#|q|#|q}#|q!O#|q!P#|q!Q#|q!R#|q!S#|q!T#|q!U#|q!V#|q!W#|q!X#|q!Y#|q!Z#|q![#|q!]#|q!^#|q!_#|q!`#|q!a#|q!b#|q!c#|q!d#|q!e#|q!f#|q!g#|q!h#|q!i#|q!j#|q!k#|q!l#|q!m#|q!w#|q!y#|q!{#|q#P#|q#U#|q#^#|q#a#|q$^#|q$b#|q$f#|q$k#|q$l#|q$m#|q$n#|q)V#|qY#|q)a#|q)b#|q)c#|q#V#|q!x#|q!z#|q~O#U#uO#^7[O~O#U#uO#X#jO#^7[O~O#U#uO#X#jO#^7^O~O#U#uO#^7`O~O#U#uO#X#jO#^7`O~O#U#uO#X#jO#^7bO~O#a7cO~O#U+sO#X+nO#^7eO$b+tO)a+mO~O#V7fO~P&6lO)Y7hO)Z7jO~O#V7kO~P&6lO#U(XO#X#jO#^7pO)d7oO~O#V$cX~P&6lO#V7fO~O#U7rO#^+{O~OU7tO~OU7tO#^7uO~O#V7xO~O#V7{O~O#V8OO~O#V8SO~O#V%UP~P!!wO#U3_O~O#U3_O#^8VO~O#U#gO#^8]O~O#U#gO#^8_O~O#U#gO#^8aO~O#U#uO#^8cO~O#U.}O#^8gO~O#U.}O#^8iO~O#X#jOX%{iZ%{i[%{i]%{i^%{i_%{i`%{ia%{ib%{ic%{id%{ie%{if%{ig%{ih%{ii%{ij%{ik%{il%{im%{io%{ip%{iq%{ir%{i{%{i|%{i}%{i!O%{i!P%{i!Q%{i!R%{i!S%{i!T%{i!U%{i!V%{i!W%{i!X%{i!Y%{i!Z%{i![%{i!]%{i!^%{i!_%{i!`%{i!a%{i!b%{i!c%{i!d%{i!e%{i!f%{i!g%{i!h%{i!i%{i!j%{i!k%{i!l%{i!m%{i!{%{i#U%{i#^%{i#a%{i$^%{i$b%{i$f%{i$k%{i$m%{i$n%{i'O%{i'P%{i'Q%{i!z%{i!x%{iY%{i#V%{in%{i~OQ8oO~O#U#uO#^8tO~O#U#uO#X#jO#^8tO~O#U#uO#X#jO#^8vO~O#U#uO#^8yO~O#U#uO#X#jO#^8yO~O#U#uO#X#jO#^8{O~O#U+sO#X+nO#^8}O$b+tO)a+mO~O#U+sO#X+nO#^9QO$b+tO)a+mO~OU9RO#^9SO~OU9RO#^9SO)o9TO~O#V9VO~OR9XO~O#V9ZO~OR9]O~O#V9^O~OR9_O~O#V9bO~OR9dO~O#U3_O#^9fO~O#U#uO#^9hO~O#U#gO#^9kO~O#V9lO~O#U#uO#^9nO~O'O#Ri'P#Ri'Q#Ri!z#Ri!x#Ri~P&K`O!n)eO~O!o)hO~O!p)iO~O!q)jO~O!r)kO~O!s)lO~O!t)mO~O!u)nO~O!v)oO~O#U(XO#^9rO~O#U(XO#X#jO#^9rO~O#U(XO#^9uO~O#U(XO#X#jO#^9uO~O#U(XO#^9xO~O#U(XO#X#jO#^9xO~O#U(XO#^9{O~O#U(XO#X#jO#^9{O~O#U(XO#^:OO~O#U(XO#X#jO#^:OO~O#U(XO#^:RO~O#U(XO#X#jO#^:RO~O#U(XO#^:UO~O#U(XO#X#jO#^:UO~O#U(XO#^:XO~O#U(XO#X#jO#^:XO~O#X#jOZ%ei[%ei]%ei^%ei_%ei`%eia%eib%eic%eid%eie%eif%eig%eih%eii%eij%eik%eil%eim%ein%eio%eip%eiq%eir%ei{%ei|%ei}%ei!O%ei!P%ei!Q%ei!R%ei!S%ei!T%ei!U%ei!V%ei!W%ei!X%ei!Y%ei!Z%ei![%ei!]%ei!^%ei!_%ei!`%ei!a%ei!b%ei!c%ei!d%ei!e%ei!f%ei!g%ei!h%ei!i%ei!j%ei!k%ei!l%ei!m%ei!w%ei!y%ei!{%ei#U%ei#^%ei#a%ei$^%ei$b%ei$f%ei$k%ei$l%ei$m%ei$n%ei)a%ei)b%ei#V%ei~O#X#jOX#|yZ#|y[#|y]#|y^#|y_#|y`#|ya#|yb#|yc#|yd#|ye#|yf#|yg#|yh#|yi#|yj#|yk#|yl#|ym#|yn#|yo#|yp#|yq#|yr#|ys#|yt#|yu#|yv#|yw#|yx#|yy#|yz#|y{#|y|#|y}#|y!O#|y!P#|y!Q#|y!R#|y!S#|y!T#|y!U#|y!V#|y!W#|y!X#|y!Y#|y!Z#|y![#|y!]#|y!^#|y!_#|y!`#|y!a#|y!b#|y!c#|y!d#|y!e#|y!f#|y!g#|y!h#|y!i#|y!j#|y!k#|y!l#|y!m#|y!w#|y!y#|y!{#|y#P#|y#U#|y#^#|y#a#|y$^#|y$b#|y$f#|y$k#|y$l#|y$m#|y$n#|y)V#|yY#|y)a#|y)b#|y)c#|y#V#|y!x#|y!z#|y~O#U#uO#^:]O~O#U#uO#X#jO#^:]O~O#U#uO#^:`O~O#U#uO#X#jO#^:`O~O#V:cO~O#U:dO#X#jO#^:fO~O)Y7hO)Z:hO~O#V:iO~O#U(XO#^:kO~O#U(XO#X#jO#^:mO~O#U(XO#X#jO#^:mO)d:nO~O#V:cO~P&6lO#U+sO#X+nO#^:pO$b+tO)a+mO~OU:qO~O#V:|O~O#U3_O#^;OO~O#X#jOX%{qZ%{q[%{q]%{q^%{q_%{q`%{qa%{qb%{qc%{qd%{qe%{qf%{qg%{qh%{qi%{qj%{qk%{ql%{qm%{qo%{qp%{qq%{qr%{q{%{q|%{q}%{q!O%{q!P%{q!Q%{q!R%{q!S%{q!T%{q!U%{q!V%{q!W%{q!X%{q!Y%{q!Z%{q![%{q!]%{q!^%{q!_%{q!`%{q!a%{q!b%{q!c%{q!d%{q!e%{q!f%{q!g%{q!h%{q!i%{q!j%{q!k%{q!l%{q!m%{q!{%{q#U%{q#^%{q#a%{q$^%{q$b%{q$f%{q$k%{q$m%{q$n%{q'O%{q'P%{q'Q%{q!z%{q!x%{qY%{q#V%{qn%{q~O#U#uO#^;[O~O#U#uO#X#jO#^;[O~O#U#uO#X#jO#^;^O~O#U#uO#^;`O~O#U#uO#X#jO#^;`O~O#U#uO#X#jO#^;bO~O#U+sO#X+nO#^;dO$b+tO)a+mO~OU;fO~OU;fO#^;gO~O#V;jO~O#V;mO~O#V;pO~O#V;tO~O#U3_O#^;vO~O#U(XO#^;{O~O#U(XO#^;}O~O#U(XO#^<PO~O#U(XO#^<RO~O#U(XO#^<TO~O#U(XO#^<VO~O#U(XO#^<XO~O#U(XO#^<ZO~O#U#uO#^<]O~O#U#uO#^<_O~O#V<`O~P&6lO#U:dO#X#jO~O#U(XO#^<dO~O#U(XO#X#jO#^<dO~O#U(XO#X#jO#^<fO~O#V<gO~O#X#jOX%{yZ%{y[%{y]%{y^%{y_%{y`%{ya%{yb%{yc%{yd%{ye%{yf%{yg%{yh%{yi%{yj%{yk%{yl%{ym%{yo%{yp%{yq%{yr%{y{%{y|%{y}%{y!O%{y!P%{y!Q%{y!R%{y!S%{y!T%{y!U%{y!V%{y!W%{y!X%{y!Y%{y!Z%{y![%{y!]%{y!^%{y!_%{y!`%{y!a%{y!b%{y!c%{y!d%{y!e%{y!f%{y!g%{y!h%{y!i%{y!j%{y!k%{y!l%{y!m%{y!{%{y#U%{y#^%{y#a%{y$^%{y$b%{y$f%{y$k%{y$m%{y$n%{y'O%{y'P%{y'Q%{y!z%{y!x%{yY%{y#V%{yn%{y~O#U#uO#^<rO~O#U#uO#X#jO#^<rO~O#U#uO#^<uO~O#U#uO#X#jO#^<uO~O#U+sO#X+nO#^<xO$b+tO)a+mO~OU<yO~O#U3_O#^=VO~O#V=bO~O#U(XO#^=dO~O#U(XO#X#jO#^=dO~O#U#uO#^=iO~O#U#uO#^=kO~O#U(XO#^=uO~O#U#gO#X#jOZ%ea[%ea]%ea^%ea_%ea`%eaa%eab%eac%ead%eae%eaf%eag%eah%eai%eaj%eak%eal%eam%ean%eao%eap%eaq%ear%ea{%ea|%ea}%ea!O%ea!P%ea!Q%ea!R%ea!S%ea!T%ea!U%ea!V%ea!W%ea!X%ea!Y%ea!Z%ea![%ea!]%ea!^%ea!_%ea!`%ea!a%ea!b%ea!c%ea!d%ea!e%ea!f%ea!g%ea!h%ea!i%ea!j%ea!k%ea!l%ea!m%ea!w%ea!y%ea!{%ea#^%ea#a%ea$^%ea$b%ea$f%ea$k%ea$l%ea$m%ea$n%ea)a%ea)b%ea#V%ea~O#^={O~PE}O$f$^#P'P'O'Q$b#^$l#^~",
  goto: "#.b*ePPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP*fP*t+y,z-}PP.TP9Y9`:];bP<eDPP+s*tDYEZPEaEs;b;b;b;bEvLOLU;bLZ;bLe;bLk;bLq;b;b;bMV;b;b;b;b;b;bMoMy;b;bNc;bNo;b!!T;bP!#i!#|!$^P!)O!)_;YP!)g!)m!+O!)_PPPP!)_!,];b;b;b;b;b;b;b!1a!1d;b!1j;b;b;b;b;b!1m!1s!1}!2k;b;b;b;b;b;b;b;b;b;b;b;b;b;b!2q9`!3n!3q!4[!4h!4t!4t!4t!4t!4t!4t!5Q!4t!5[!4t!5b!4t!4t!5h!4t!4t!4t!4t!4t!4t!4t!4t!6]!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!6g!4t!6j!4t!4t!4t!4t!4t!6m!6s!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4t!4h!4[!4[!6}!7Z!7gPPP!3n9`!7m!8j9`!8p!9m!9s!9x+y!:O!;P!;V!;Y+y!;]!<^!<d!<j+y!<m!=n!=t+y!=w!>x!?O!?R+y!?U!@V!@]!@`!@f!@k+y!@n!Ao!Au+y!Ax!By!CP+y!CS!DT!DZ!D^!D|!EX!Ed!Eg!Ev!FT!FW!Fk!Fz!F}!Gf!Gw!Gz!Hg!Hz!H}!In!JT!JW!J{!Kd!Kg!L`!Ly!L|!MZ!N_!Nf!Nn#!d#!k##X#%b#%l#%r#(Y#(d#(r#)Q#)W#)_#)e#)k#)q#)w#)}#*T#*ZPPPPPP#*a#+P#+t#,sPPPPPPPPPPPPP#-qP#-yPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPPP#.VQ#QO[#eR!f!l!m!n>OR(V!q!`!pOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X't'|(O({)P)S)V)Y)])`)c3_>Od'h!`!b!d!h!i'e'g'i'k.}X*Y#g(X*X*Z!}!oOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>O!h!fOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g't'|(O(X({)P)S)V)Y)])`)c*X*Z3_>Oe>O!`!b!d!h!i'e'g'i'k.}Q#[QR5u/fQ#iSQ#mTQ#pUQ#sVQ#wWQ#{XQ$V[Q$idQ$neQ$qfS$yhiS%OjkS%Rl&XQ%ixW%s}%t'R.s[&U!]&V&W6|={=}Q(Z!uQ(_!vQ(c!wQ(g!xQ(k!yQ(o!zQ(s!{Q(w!|Q)r#ZQ)t#[Q)v#]Q)x#^Q)z#_Q)|#`Q*O#aQ*Q#bQ*S#cQ*U#dQ*b#kQ*e#nQ*h#qQ*k#tQ*r#xQ*t#|Q*x$WQ+T$`Q+Z$jQ+^$oS+`$r$sQ+d$yS+f$z${Q+i%OS+k%P%Q#d+|%X%[%a+},Q,S,V,Z,^.Y.].b3P3Q3T3U3W3[3]4w4z4|5P5T5W7v7x7y7{7|8O8Q8S9V9W9Z9[9^9b9c:s:u:x:{;h;j;k;m;n;p;r;t<{<}=Q=TQ,l%vQ,s&YQ,v&ZQ,y&[Q,|&]Q-P&^Q-T&_Q-^&bQ-o&jQ-s&kQ-v&lS-|&n&oS.Q&p&qQ.i&|S0O([(]S0T(`(aS0Y(d(eS0_(h(iS0d(l(mS0i(p(qS0n(t(uS0s(x(yQ2R+SQ2T+UQ2Z+aS2^+e+fQ2`+gS2c+j+kQ2e+lQ3j,tQ3m,wQ3p,zQ3s,}Q3v-QQ3x-UQ3|-_Q4W-fQ4^-pQ4`-tS4b-w-xQ4f-|S4h-}.OQ4k.QS4m.R.SS6]0P0QS6a0U0VS6e0Z0[S6i0`0aS6m0e0fS6q0j0kS6u0o0pS6y0t0uQ7V2SQ7X2US7]2_2`S7a2d2eQ7n2sQ8k4VQ8m4XQ8r4cS8u4g4hQ8w4iS8z4l4mQ8|4nQ9s6^Q9v6bQ9y6fQ9|6jQ:P6nQ:S6rQ:V6vQ:Y6zQ:Z7WQ:^7^Q:a7bQ:e7hS:l7o7pQ;V8lQ;X8nS;]8v8wS;a8{8|Q<b:fS<e:m:nQ<p;WQ<s;^Q<v;bR=e<fQ*a#jR1j*^!u!eOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n3_>O!t!_OR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n3_>O]2q+s2m2r2u7r:d#R![OR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n+s2m2r2u3_7r:d>OQ#hSQ#lTQ#oUQ#rVQ$pfQ%VpQ%p|Q%w!OQ%x!PQ%y!QQ%z!RQ%{!SQ%|!TQ%}!UQ&O!VQ&P!WQ&Q!XQ&R!YY&U!]&V&W={=}!r)p#Z#[#]#^#_#`#a#b#c#d)q)r)s)t)u)v)w)x)y)z){)|)}*O*P*Q*R*S*T*U1Z1[1]1^1_1`1a1b1c1dS*]#i#kS*c#m#nS*f#p#qS*i#s#tQ*y$XQ*|$ZQ+S$`U+_$q$r$sQ+z%WS,f%q%rQ,j%uQ,r&YQ,u&ZQ,x&[Q,{&]Q-u&lQ.W&tQ.p'QQ.u'SQ.v'TQ.w'UQ.x'VQ.y'WQ.z'XQ.{'YQ.|'ZQ1m*bS1n*d*eS1p*g*hS1r*j*kS1{*z*{S1}*}+OQ2R+TQ2S+US2Y+`+aQ3d,gS3e,i,kS3i,s,tS3k,v,wS3n,y,zS3q,|,}Q4V-fU4a-v-w-xQ4v.XS5_.q.rQ5b.tQ7O1oQ7P1qQ7Q1sQ7T1|Q7U2OQ7V2TQ7W2UQ7Y2ZQ8X3fQ8Z3jS8[3l3mS8^3o3pS8`3r3sQ8k4WQ8l4XS8q4b4cQ9i5`S9j5a5cQ:Z7XQ;P8]Q;Q8_Q;R8aQ;V8mQ;W8nQ;Y8rQ;x9kR<p;XQ*[#gQ/{(XR1g*X!}ROR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#ZQR1f*VQ#fRQ's!fQ(R!lQ(S!mQ(T!nR=|>OR*W#fQ#vWW#yX#{#|*tS#}Y$PS$QZ$S`$T[$V$W&b*x-^-_3|Q$X]Q$Z^Q$``Q$caW$tg$v&m-z!n$whi$y$z${&n&o+d+e+f+g-|-}.O2]2^2_2`4f4g4h4i7[7]7^8t8u8v8w:]:^;[;];^<]<r<s=i!n$|jk%O%P%Q&p&q+i+j+k+l.Q.R.S2b2c2d2e4k4l4m4n7`7a7b8y8z8{8|:`:a;`;a;b<_<u<v=kS%m{%oQ%u}Q&S!ZS*p#w#xQ*{$YQ+O$[Q+Q$^S+U$a$bQ+W$dW,b%n,d,e3cQ,i%tQ,m&SQ,o&TQ-O&^W-R&_-T-U3xS-V&`-XS-Y&a-[Q-`&cQ-b&dQ-f&fQ-i&gS.m'P.oQ.t'RQ/R'_S1w*q*rQ2Q+RQ2U+VS3g,n,oS3t-P-QQ4P-aQ4S-cQ4T-dS4X-g-hQ4Z-jW5Z.n5]5^9hQ5a.sQ5f/RQ5h/SQ7S1xQ8Y3hS8b3u3vQ8j4UQ8n4YS9m5g5hQ;S8cR;y9nQ*o#uR1t*lV*m#u*l*nQ#zXS*s#{#|R1y*tQ$OYR*u$PQ$RZR*v$SQ$U[S*w$V$WQ-]&bQ1z*xS3{-^-_R8e3|Q$^_Q$ebQ+R$_Q+X$fQ-d&eQ-k&hQ4U-eR4[-lQ$meS+]$n$oR2X+^W$le$n$o+^Q%euQ%gvW-q&k-s-t4`Q.e&yR.g&zQ$ugQ+b$vQ-y&mR4d-zS$xhiU+c$y$z${S-{&n&oW2[+d+e+f+gU4e-|-}.OW7Z2]2^2_2`W8s4f4g4h4iU:[7[7]7^W;Z8t8u8v8wS<[:]:^U<q;[;];^Q=`<]S=h<r<sR=v=iS$}jkU+h%O%P%QS.P&p&qW2a+i+j+k+lU4j.Q.R.SW7_2b2c2d2eW8x4k4l4m4nU:_7`7a7bW;_8y8z8{8|S<^:`:aU<t;`;a;bQ=a<_S=j<u<vR=w=kl+o%S+p+q+v.T2k2y4o4p4r7s9P9Q;eR2g+nm+o%S+p+q+v.T2k2y4o4p4r7s9P9Q;eQ+u%SQ,O%XQ,T%[Q,[%aU2j+p+q+vS3O+},QS3S,S,VS3Y,Z,^Q3Z,[Q4q.TQ4x.YQ4}.]Q5U.bU7d2i2k2yS7w3P3QS7z3T3UQ7}3WQ8P3YS8R3[3]U9O4o4p4rS9U4w4zS9Y4|5PS9`5T5WQ9a5US:b7e7sS:r7v7xS:t7y7{S:v7|8OQ:w7}S:y8Q8SQ:z8RU;c8}9P9QS;i9V9WS;l9Z9[Q;o9^Q;q9`S;s9b9cQ<h:pQ<i:sQ<j:uQ<k:vQ<l:xQ<m:yQ<n:{S<w;d;eS<z;h;jS<|;k;mS=O;n;pQ=P;oS=R;r;tQ=S;sQ=f<lQ=g<nQ=l<xQ=m<{Q=n<}Q=o=OQ=p=QQ=q=RQ=r=TQ=x=pR=y=rQ2w+sQ7g2mQ7l2rQ:o7rR<a:d]2t+s2m2r2u7r:dQ:e7hR<b:f!t!_OR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n3_>Od'd!`!b!d!h!i'e'g'i'k.}]2q+s2m2r2u7r:d#gmOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n+s.}2m2r2u3_7r:d>OQ(Y!uQ(^!vQ(b!wQ(f!xQ(j!yQ(n!zQ(r!{Q(v!|U/|(Z([(]U0R(_(`(aU0W(c(d(eU0](g(h(iU0b(k(l(mU0g(o(p(qU0l(s(t(uU0q(w(x(yW6Z/}0O0P0QW6_0S0T0U0VW6c0X0Y0Z0[W6g0^0_0`0aW6k0c0d0e0fW6o0h0i0j0kW6s0m0n0o0pW6w0r0s0t0uQ7m2sU9q6[6]6^U9t6`6a6bU9w6d6e6fU9z6h6i6jU9}6l6m6nU:Q6p6q6rU:T6t6u6vU:W6x6y6zU:j7n7o7pS;z9r9sS;|9u9vS<O9x9yS<Q9{9|S<S:O:PS<U:R:SS<W:U:VS<Y:X:YW<c:k:l:m:nQ=W;{Q=X;}Q=Y<PQ=Z<RQ=[<TQ=]<VQ=^<XQ=_<ZU=c<d<e<fS=t=d=eR=z=uR%fuQ%euR.e&yR%hvQ%n{R,e%oQ,c%nS3b,d,eR8W3cQ3`,cS8U3a3bQ9e5[S:}8V8WS;u9f9gQ<o;OS=U;v;wR=s=VQ'u!gR8T3_!u!_OR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n3_>OR'l!`Q'j!`Q'o!bQ'r!dS'w!h!iQ/X'eQ/_'gQ/b'kR5e.}e'h!`!b!d!h!i'e'g'i'k.}e'd!`!b!d!h!i'e'g'i'k.}e'`!`!b!d!h!i'e'g'i'k.}Q-S&_S3w-T-UR8d3xQ-W&`R3y-XQ-Z&aR3z-[Q/O'[Q/P']Q/Q'^Q3}-`Q4Q-bQ5i/TS8f4O4PS8h4R4SQ9o5jQ;T8gR;U8iQ-r&kS4_-s-tR8p4`R.f&yR.h&zQ.n'PR5^.oQ5[.nS9g5]5^R;w9he'g!`!b!d!h!i'e'g'i'k.}Q/Z'fQ5n/[Q5o/]R9p5pQ/^'gR5q/_!u!bOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n3_>OQ'n!bR/d'o!u!dOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#j#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*^*`*l*n3_>OQ'q!dR/e'rV*_#j*^*`Q/g'sR5s=|!}!gOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#]QR5x/hR'v!gR/i'v!}!hOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#^QR5z/jQ'x!hR'y!iR/k'x!}!iOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#_QR5|/lR/m'y!}!jOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#`QR6O/nR'{!jR/o'{!}!kOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#aQR6R/rR(Q!kQ(P!kR/p'|V'}!k'|(OR/s(Q!}!lOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#bQR6T/tR/u(R!}!mOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#cQR6V/vR/w(S!}!nOR!`!b!d!f!g!h!i!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g'e'g'i'k't'|(O(X({)P)S)V)Y)])`)c*X*Z.}3_>OQ#dQR6X/xR/y(T!Z!rOR!f!g!l!m!n!q!}#P#R#S#T#U#V#W#X't({)P)S)V)Y)])`)c3_>Oc#OOR!f!l!m!n!q#P>Oc#XOR!f!l!m!n!q#P>OR)d#Xb#OOR!f!l!m!n!q#P>OT)b#X)cg#WOR!f!l!m!n!q#P#X)c>OR)a#Wb#OOR!f!l!m!n!q#P>OS)_#W)`T)b#X)ck#VOR!f!l!m!n!q#P#W#X)`)c>OR)^#Vb#OOR!f!l!m!n!q#P>OS)[#V)]S)_#W)`T)b#X)co#UOR!f!l!m!n!q#P#V#W#X)])`)c>OR)Z#Ub#OOR!f!l!m!n!q#P>OS)X#U)YS)[#V)]S)_#W)`T)b#X)cs#TOR!f!l!m!n!q#P#U#V#W#X)Y)])`)c>OR)W#Tb#OOR!f!l!m!n!q#P>OS)U#T)VS)X#U)YS)[#V)]S)_#W)`T)b#X)cw#SOR!f!l!m!n!q#P#T#U#V#W#X)V)Y)])`)c>OR)T#Sb#OOR!f!l!m!n!q#P>OS)R#S)SS)U#T)VS)X#U)YS)[#V)]S)_#W)`T)b#X)c{#ROR!f!l!m!n!q#P#S#T#U#V#W#X)S)V)Y)])`)c>OR)Q#Rb#OOR!f!l!m!n!q#P>OS)O#R)PS)R#S)SS)U#T)VS)X#U)YS)[#V)]S)_#W)`T)b#X)c!P!}OR!f!l!m!n!q#P#R#S#T#U#V#W#X)P)S)V)Y)])`)c>OR(|!}`#POR!f!l!m!n!q>OR(}#Pb!tOR!f!l!m!n!q#P>OS't!g3_Q(W'tS(z!}({S)O#R)PS)R#S)SS)U#T)VS)X#U)YS)[#V)]S)_#W)`T)b#X)cS*`#j*^R1k*`U*Z#g(X*XR1h*ZQ)q#ZQ)s#[Q)u#]Q)w#^Q)y#_Q){#`Q)}#aQ*P#bQ*R#cQ*T#dx1Y)q)s)u)w)y){)}*P*R*T1Z1[1]1^1_1`1a1b1c1dQ1Z)rQ1[)tQ1])vQ1^)xQ1_)zQ1`)|Q1a*OQ1b*QQ1c*SR1d*US*n#u*lR1u*nQ+p%S[2h+p2k4o7s9P;eS2k+q+vQ4o.TQ7s2yS9P4p4rR;e9Q%O+r%S%X%[%a+p+q+v+},Q,S,V,Z,[,^.T.Y.].b2i2k2y3P3Q3T3U3W3Y3[3]4o4p4r4w4z4|5P5T5U5W7e7s7v7x7y7{7|7}8O8Q8R8S8}9P9Q9V9W9Z9[9^9`9b9c:p:s:u:v:x:y:{;d;e;h;j;k;m;n;o;p;r;s;t<l<n<x<{<}=O=Q=R=T=p=rS2l+r2xR2x+tY2u+s2m2r7r:dR7q2uQ7i2nR:g7iQ+}%XQ,S%[Q,Z%a!Y2}+},S,Z3Q3U3]4w4|5T7v7y7|8Q9W9[9c:s:u:x:{;h;k;n;r<{<}=Q=TQ3Q,QQ3U,VQ3],^Q4w.YQ4|.]Q5T.bQ7v3PQ7y3TQ7|3WQ8Q3[Q9W4zQ9[5PQ9c5WQ:s7xQ:u7{Q:x8OQ:{8SQ;h9VQ;k9ZQ;n9^Q;r9bQ<{;jQ<};mQ=Q;pR=T;tQ%t}S,h%t.sR.s'RS&V!]=}S,p&V6|Q,q&WR6|={b'i!`!b!d!h!i'e'g'k.}R/`'iQ/U'aR5k/US(O!k'|R/q(OQ)c#XR0})cQ)`#WR0|)`Q)]#VR0{)]Q)Y#UR0z)YQ)V#TR0y)VQ)S#SR0x)SQ)P#RR0w)PQ({!}R0v({!Z!sOR!f!g!l!m!n!q!}#P#R#S#T#U#V#W#X't({)P)S)V)Y)])`)c3_>O!Y!rOR!f!g!l!m!n!q!}#P#R#S#T#U#V#W#X't({)P)S)V)Y)])`)c3_>OV'}!k'|(O!nPOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X#g#u't'|(O(X({)P)S)V)Y)])`)c*X*Z*l*n3_>OV*_#j*^*`!`!pOR!f!g!k!l!m!n!q!}#P#R#S#T#U#V#W#X't'|(O({)P)S)V)Y)])`)c3_>OW*Y#g(X*X*ZV*m#u*l*n]2p+s2m2r2u7r:de'c!`!b!d!h!i'e'g'i'k.}c!tOR!f!l!m!n!q#P>O",
  nodeNames: "⚠ VerbContent LstInlineContent LiteralArgContent SpaceDelimitedLiteralArgContent VerbatimContent Csname TrailingWhitespaceOnly TrailingContent Begin End RefCtrlSeq RefStarrableCtrlSeq CiteCtrlSeq CiteStarrableCtrlSeq LabelCtrlSeq MathTextCtrlSeq HboxCtrlSeq TitleCtrlSeq DocumentClassCtrlSeq UsePackageCtrlSeq HrefCtrlSeq UrlCtrlSeq VerbCtrlSeq LstInlineCtrlSeq IncludeGraphicsCtrlSeq CaptionCtrlSeq DefCtrlSeq LetCtrlSeq LeftCtrlSeq RightCtrlSeq NewCommandCtrlSeq RenewCommandCtrlSeq NewEnvironmentCtrlSeq RenewEnvironmentCtrlSeq BookCtrlSeq PartCtrlSeq ChapterCtrlSeq SectionCtrlSeq SubSectionCtrlSeq SubSubSectionCtrlSeq ParagraphCtrlSeq SubParagraphCtrlSeq InputCtrlSeq IncludeCtrlSeq ItemCtrlSeq NewTheoremCtrlSeq TheoremStyleCtrlSeq CenteringCtrlSeq BibliographyCtrlSeq BibliographyStyleCtrlSeq AuthorCtrlSeq AffilCtrlSeq AffiliationCtrlSeq DateCtrlSeq MaketitleCtrlSeq TextColorCtrlSeq ColorBoxCtrlSeq HLineCtrlSeq TopRuleCtrlSeq MidRuleCtrlSeq BottomRuleCtrlSeq MultiColumnCtrlSeq ParBoxCtrlSeq TextBoldCtrlSeq TextItalicCtrlSeq TextSmallCapsCtrlSeq TextTeletypeCtrlSeq TextMediumCtrlSeq TextSansSerifCtrlSeq TextSuperscriptCtrlSeq TextSubscriptCtrlSeq TextStrikeOutCtrlSeq EmphasisCtrlSeq UnderlineCtrlSeq SetLengthCtrlSeq DocumentEnvName TabularEnvName EquationEnvName EquationArrayEnvName VerbatimEnvName TikzPictureEnvName FigureEnvName ListEnvName TableEnvName OpenParenCtrlSym CloseParenCtrlSym OpenBracketCtrlSym CloseBracketCtrlSym LineBreakCtrlSym Comment LaTeX Text BlankLine KnownEnvironment DocumentEnvironment BeginEnv EnvNameGroup OpenBrace CloseBrace OptionalArgument OpenBracket ShortOptionalArg Command KnownCommand Title Whitespace TextArgument LongArg CloseBracket NonEmptyGroup Environment BeginEnv EnvNameGroup EnvName Content EndEnv Author Affil Affiliation Date ShortTextArgument ShortArg NonEmptyGroup DocumentClass DocumentClassArgument BibliographyCommand BibliographyArgument BibliographyStyleCommand BibliographyStyleArgument UsePackage PackageArgument TextColorCommand ColorBoxCommand HrefCommand UrlArgument NewTheoremCommand TheoremStyleCommand UrlCommand VerbCommand LstInlineCommand IncludeGraphics IncludeGraphicsArgument FilePathArgument Caption Label LabelArgument Ref RefArgument Cite BibKeyArgument Def CtrlSym MacroParameter OptionalMacroParameter DefinitionArgument NewLine DefinitionFragment DefinitionFragmentCommand DefinitionFragmentUnknownCommand CtrlSeq DefinitionFragmentArgument KnownCtrlSym LineBreak Group Dollar Normal Ampersand Tilde SectioningCommand SectioningArgument Let Hbox NewCommand RenewCommand NewEnvironment RenewEnvironment Input InputArgument BareFilePathArgument Include IncludeArgument Centering Item Maketitle HorizontalLine MultiColumn SpanArgument ColumnArgument TabularArgument TabularContent MathTextCommand ParBoxCommand TextBoldCommand TextItalicCommand TextSmallCapsCommand TextTeletypeCommand TextMediumCommand TextSansSerifCommand TextSuperscriptCommand TextSubscriptCommand StrikeOutCommand EmphasisCommand UnderlineCommand SetLengthCommand UnknownCommand DollarMath InlineMath Math MathCommand KnownCommand Title Author Affil Affiliation Date DocumentClass DocumentClassArgument BibliographyCommand BibliographyArgument BibliographyStyleCommand BibliographyStyleArgument UsePackage TextColorCommand MathArgument ColorBoxCommand HrefCommand NewTheoremCommand TheoremStyleCommand UrlCommand VerbCommand LstInlineCommand IncludeGraphics IncludeGraphicsArgument Caption Label Ref Cite Def Let Hbox NewCommand RenewCommand NewEnvironment RenewEnvironment Input InputArgument Include IncludeArgument Centering Item Maketitle HorizontalLine MultiColumn SpanArgument ColumnArgument MathTextCommand ParBoxCommand TextBoldCommand TextItalicCommand TextSmallCapsCommand TextTeletypeCommand TextMediumCommand TextSansSerifCommand TextSuperscriptCommand TextSubscriptCommand StrikeOutCommand EmphasisCommand UnderlineCommand SetLengthCommand MathUnknownCommand Group MathDelimitedGroup MathOpening MathDelimiter MathClosing MathSpecialChar Number MathChar DisplayMath BracketMath OpenBracketMath CloseBracketMath ParenMath OpenParenMath CloseParenMath NonEmptyGroup EndEnv TabularEnvironment BeginEnv EnvNameGroup Content EndEnv EquationEnvironment BeginEnv EnvNameGroup Content EndEnv EquationArrayEnvironment BeginEnv EnvNameGroup EndEnv VerbatimEnvironment BeginEnv EnvNameGroup Content EndEnv TikzPictureEnvironment BeginEnv EnvNameGroup Content TikzPictureContent NonEmptyGroup EndEnv FigureEnvironment BeginEnv EnvNameGroup EndEnv ListEnvironment BeginEnv EnvNameGroup EndEnv TableEnvironment BeginEnv EnvNameGroup EndEnv Group Book SectioningCommand Content Part SectioningCommand Content Chapter SectioningCommand Content Section SectioningCommand Content SubSection SectioningCommand Content SubSubSection SectioningCommand Content Paragraph SectioningCommand Content SubParagraph SectioningCommand Content",
  maxTerm: 434,
  context: elementContext,
  nodeProps: [
    ["group", -10, 95, 111, 288, 293, 298, 302, 307, 314, 318, 322, "$Environment", -3, 206, 280, 283, "$MathContainer", -8, 327, 330, 333, 336, 339, 342, 345, 348, "$Section"],
    ["closedBy", 98, "CloseBrace", 101, "CloseBracket", 281, "CloseBracketMath", 284, "CloseParenMath"],
    ["openedBy", 99, "OpenBrace", 109, "OpenBracket", 282, "OpenBracketMath", 285, "OpenParenMath"]
  ],
  skippedNodes: [0, 90],
  repeatNodeCount: 24,
  tokenData: "!Hy~R!ROX$[XY'mYZ'xZp$[pq'mqs$[st(Ytu)Yuv)_vw*Owx$[xy*Tyz.]z{/}{|+u|}$[}!O+u!O!P1o!P!Q3T!Q!R4u!R!S6i!S!T7h!T!U8g!U!V9f!V!W:e!W!X;d!X!Y<c!Y!Z=b!Z![>a![!^$[!^!_+u!_!`?`!`!a+u!a!c$[!c!}AQ!}#OCc#O#PCj#P#Q!EZ#Q#R!Eb#R#S!F[#S#T$[#T#oAQ#o#p!GU#p#q!GZ#q#r!Ho#r#s!Ht#s;'S$[;'S;=`'g<%lO$[T$cc'QS$lPOX$[Zp$[pq%nqs$[st&cwx$[x|%n|}$[}!O%n!O!P$[!P![%n![!^$[!^!a%n!a!}$[#S#o$[#p#q$[#s;'S$[;'S;=`'g<%lO$[P%sW$lPOX%nZs%nw!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nP&`P;=`<%l%nS&h]'QSOX&cZp&cqt&cwx&c|}&c!O!P&c![!^&c!a!}&c#S#o&c#p#q&c#s;'S&c;'S;=`'a<%lO&cS'dP;=`<%l&cT'jP;=`<%l$[~'rQ#^~XY'mpq'm~'}P$b~YZ(Q~(VP#P~YZ(QT(a])aP'QSOX&cZp&cqt&cwx&c|}&c!O!P&c![!^&c!a!}&c#S#o&c#p#q&c#s;'S&c;'S;=`'a<%lO&c~)_O$k~~)dT!|~OY)_YZ)sZ;'S)_;'S;=`)x<%lO)_~)xO!|~~){P;=`<%l)_~*TO$m~]*^g)sW'OS$lPOX%nZs%nwx%nxy+uyz+uz{+u{|+u|}%n}!O+u!O!P%n!P!Q+u!Q!^%n!^!_+u!_!`+u!`!a+u!a!}%n#Q#R-e#R#S-e#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nT+|g'OS$lPOX%nZs%nwx%nxy+uyz+uz{+u{|+u|}%n}!O+u!O!P%n!P!Q+u!Q!^%n!^!_+u!_!`+u!`!a+u!a!}%n#Q#R-e#R#S-e#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nS-jZ'OSxy-eyz-ez{-e{|-e}!O-e!P!Q-e!^!_-e!_!`-e!`!a-e#Q#R-e#R#S-e].fg)tW'OS$lPOX%nZs%nwx%nxy+uyz+uz{+u{|+u|}%n}!O+u!O!P%n!P!Q+u!Q!^%n!^!_+u!_!`+u!`!a+u!a!}%n#Q#R-e#R#S-e#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV0Wg)dQ'OS$lPOX%nZs%nwx%nxy+uyz+uz{+u{|+u|}%n}!O+u!O!P%n!P!Q+u!Q!^%n!^!_+u!_!`+u!`!a+u!a!}%n#Q#R-e#R#S-e#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%n]1xc*cW'QS$lPOX$[Zp$[pq%nqs$[st&cwx$[x|%n|}$[}!O%n!O!P$[!P![%n![!^$[!^!a%n!a!}$[#S#o$[#p#q$[#s;'S$[;'S;=`'g<%lO$[]3^g)qW'OS$lPOX%nZs%nwx%nxy+uyz+uz{+u{|+u|}%n}!O+u!O!P%n!P!Q+u!Q!^%n!^!_+u!_!`+u!`!a+u!a!}%n#Q#R-e#R#S-e#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nT4|['PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nT5yY'PS$lPOX%nZs%nw!Q%n!Q![5r![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV6r[)eQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV7q[)fQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV8p[)gQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV9o[)hQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV:n[)iQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV;m[)jQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV<l[)kQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV=k[)lQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV>j[)mQ'PS$lPOX%nZs%nw!O%n!O!P5r!P!Q%n!Q![4u![!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nV?ig)oQ'OS$lPOX%nZs%nwx%nxy+uyz+uz{+u{|+u|}%n}!O+u!O!P%n!P!Q+u!Q!^%n!^!_+u!_!`+u!`!a+u!a!}%n#Q#R-e#R#S-e#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%nVAZg#fQ'QS$lPOX$[Zp$[pq%nqs$[st&cwx$[xz%nz{Br{|%n|}$[}!O%n!O!P$[!P![%n![!^$[!^!a%n!a!c$[!c!}AQ#S#T$[#T#oAQ#p#q$[#s;'S$[;'S;=`'g<%lO$[RByW#fQ$lPOX%nZs%nw!}%n#S#o%n#p#q%n#s;'S%n;'S;=`&]<%lO%n_CjO)uW#XV]CmjO!cE_!c!fEd!f!gEo!g!wEd!w!xHw!x!yNk!y!}Ed!}#TE_#T#UEd#U#V! }#V#WEd#W#X!%S#X#`Ed#`#a!([#a#fEd#f#g!2y#g#iEd#i#j!=h#j#k!C[#k#oEd#o#p!Dn#p#q!Du#q#r!D|#r;'SE_;'S;=`!ET<%lOE_TEdO$^TTEiQ$fT!c!}Ed#T#oEd]EtS$fT!c!}Ed#T#cEd#c#dFQ#d#oEd]FVS$fT!c!}Ed#T#kEd#k#lFc#l#oEd]FhS$fT!c!}Ed#T#bEd#b#cFt#c#oEd]FyR$fT!c!}Ed#T#UGS#U#oEd]GXS$fT!c!}Ed#T#fEd#f#gGe#g#oEd]GjS$fT!c!}Ed#T#fEd#f#gGv#g#oEd]G{S$fT!c!}Ed#T#cEd#c#dHX#d#oEd]H^S$fT!c!}Ed#T#kEd#k#lHj#l#oEd]HqQ*TW$fT!c!}Ed#T#oEd]H|S$fT!c!}Ed#T#dEd#d#eIY#e#oEd]I_T$fT!c!}Ed#T#UIn#U#WEd#W#XKc#X#oEd]IsS$fT!c!}Ed#T#fEd#f#gJP#g#oEd]JUS$fT!c!}Ed#T#fEd#f#gJb#g#oEd]JgS$fT!c!}Ed#T#cEd#c#dJs#d#oEd]JxS$fT!c!}Ed#T#kEd#k#lKU#l#oEd]K]Q*SW$fT!c!}Ed#T#oEd]KhS$fT!c!}Ed#T#cEd#c#dKt#d#oEd]KyS$fT!c!}Ed#T#kEd#k#lLV#l#oEd]L[S$fT!c!}Ed#T#bEd#b#cLh#c#oEd]LmR$fT!c!}Ed#T#ULv#U#oEd]L{S$fT!c!}Ed#T#fEd#f#gMX#g#oEd]M^S$fT!c!}Ed#T#fEd#f#gMj#g#oEd]MoS$fT!c!}Ed#T#cEd#c#dM{#d#oEd]NQS$fT!c!}Ed#T#kEd#k#lN^#l#oEd]NeQ*VW$fT!c!}Ed#T#oEd]NpS$fT!c!}Ed#T#XEd#X#YN|#Y#oEd]! RS$fT!c!}Ed#T#fEd#f#g! _#g#oEd]! dS$fT!c!}Ed#T#hEd#h#i! p#i#oEd]! wQ*^W$fT!c!}Ed#T#oEd]!!SR$fT!c!}Ed#T#U!!]#U#oEd]!!bS$fT!c!}Ed#T#VEd#V#W!!n#W#oEd]!!sS$fT!c!}Ed#T#_Ed#_#`!#P#`#oEd]!#US$fT!c!}Ed#T#gEd#g#h!#b#h#oEd]!#gS$fT!c!}Ed#T#`Ed#`#a!#s#a#oEd]!#xR$fT!c!}Ed#T#U!$R#U#oEd]!$WS$fT!c!}Ed#T#gEd#g#h!$d#h#oEd]!$iS$fT!c!}Ed#T#[Ed#[#]!$u#]#oEd]!$|Q*QW$fT!c!}Ed#T#oEd]!%XS$fT!c!}Ed#T#cEd#c#d!%e#d#oEd]!%jS$fT!c!}Ed#T#kEd#k#l!%v#l#oEd]!%{S$fT!c!}Ed#T#bEd#b#c!&X#c#oEd]!&^R$fT!c!}Ed#T#U!&g#U#oEd]!&lS$fT!c!}Ed#T#fEd#f#g!&x#g#oEd]!&}S$fT!c!}Ed#T#fEd#f#g!'Z#g#oEd]!'`S$fT!c!}Ed#T#cEd#c#d!'l#d#oEd]!'qS$fT!c!}Ed#T#kEd#k#l!'}#l#oEd]!(UQ*WW$fT!c!}Ed#T#oEd]!(aZ$fT!c!xEd!x!y!)S!y!}Ed#T#U!*f#U#V!,Z#V#W!.`#W#YEd#Y#Z!/r#Z#jEd#j#k!1g#k#oEd]!)XS$fT!c!}Ed#T#XEd#X#Y!)e#Y#oEd]!)jS$fT!c!}Ed#T#fEd#f#g!)v#g#oEd]!){S$fT!c!}Ed#T#hEd#h#i!*X#i#oEd]!*`Q*YW$fT!c!}Ed#T#oEd]!*kS$fT!c!}Ed#T#bEd#b#c!*w#c#oEd]!*|S$fT!c!}Ed#T#ZEd#Z#[!+Y#[#oEd]!+_S$fT!c!}Ed#T#`Ed#`#a!+k#a#oEd]!+pS$fT!c!}Ed#T#XEd#X#Y!+|#Y#oEd]!,TQ*OW$fT!c!}Ed#T#oEd]!,`S$fT!c!}Ed#T#fEd#f#g!,l#g#oEd]!,qR$fT!c!}Ed#T#U!,z#U#oEd]!-PS$fT!c!}Ed#T#VEd#V#W!-]#W#oEd]!-bU$fT!c!}Ed#T#XEd#X#Y!-t#Y#_Ed#_#`!.R#`#oEd]!-{Q*_W$fT!c!}Ed#T#oEd]!.YQ*aW$fT!c!}Ed#T#oEd]!.eS$fT!c!}Ed#T#XEd#X#Y!.q#Y#oEd]!.vS$fT!c!}Ed#T#]Ed#]#^!/S#^#oEd]!/XS$fT!c!}Ed#T#`Ed#`#a!/e#a#oEd]!/lQ)|W$fT!c!}Ed#T#oEd]!/wS$fT!c!}Ed#T#`Ed#`#a!0T#a#oEd]!0YS$fT!c!}Ed#T#cEd#c#d!0f#d#oEd]!0kS$fT!c!}Ed#T#cEd#c#d!0w#d#oEd]!0|S$fT!c!}Ed#T#fEd#f#g!1Y#g#oEd]!1aQ)zW$fT!c!}Ed#T#oEd]!1lS$fT!c!}Ed#T#XEd#X#Y!1x#Y#oEd]!1}S$fT!c!}Ed#T#fEd#f#g!2Z#g#oEd]!2`S$fT!c!}Ed#T#hEd#h#i!2l#i#oEd]!2sQ*XW$fT!c!}Ed#T#oEd]!3OZ$fT!c!xEd!x!y!3q!y!}Ed#T#U!5T#U#V!6x#V#W!8}#W#YEd#Y#Z!:a#Z#jEd#j#k!<U#k#oEd]!3vS$fT!c!}Ed#T#XEd#X#Y!4S#Y#oEd]!4XS$fT!c!}Ed#T#fEd#f#g!4e#g#oEd]!4jS$fT!c!}Ed#T#hEd#h#i!4v#i#oEd]!4}Q*ZW$fT!c!}Ed#T#oEd]!5YS$fT!c!}Ed#T#bEd#b#c!5f#c#oEd]!5kS$fT!c!}Ed#T#ZEd#Z#[!5w#[#oEd]!5|S$fT!c!}Ed#T#`Ed#`#a!6Y#a#oEd]!6_S$fT!c!}Ed#T#XEd#X#Y!6k#Y#oEd]!6rQ*PW$fT!c!}Ed#T#oEd]!6}S$fT!c!}Ed#T#fEd#f#g!7Z#g#oEd]!7`R$fT!c!}Ed#T#U!7i#U#oEd]!7nS$fT!c!}Ed#T#VEd#V#W!7z#W#oEd]!8PU$fT!c!}Ed#T#XEd#X#Y!8c#Y#_Ed#_#`!8p#`#oEd]!8jQ*`W$fT!c!}Ed#T#oEd]!8wQ*bW$fT!c!}Ed#T#oEd]!9SS$fT!c!}Ed#T#XEd#X#Y!9`#Y#oEd]!9eS$fT!c!}Ed#T#]Ed#]#^!9q#^#oEd]!9vS$fT!c!}Ed#T#`Ed#`#a!:S#a#oEd]!:ZQ)}W$fT!c!}Ed#T#oEd]!:fS$fT!c!}Ed#T#`Ed#`#a!:r#a#oEd]!:wS$fT!c!}Ed#T#cEd#c#d!;T#d#oEd]!;YS$fT!c!}Ed#T#cEd#c#d!;f#d#oEd]!;kS$fT!c!}Ed#T#fEd#f#g!;w#g#oEd]!<OQ){W$fT!c!}Ed#T#oEd]!<ZS$fT!c!}Ed#T#XEd#X#Y!<g#Y#oEd]!<lS$fT!c!}Ed#T#fEd#f#g!<x#g#oEd]!<}S$fT!c!}Ed#T#hEd#h#i!=Z#i#oEd]!=bQ*[W$fT!c!}Ed#T#oEd]!=mS$fT!c!}Ed#T#dEd#d#e!=y#e#oEd]!>OT$fT!c!}Ed#T#U!>_#U#WEd#W#X!@S#X#oEd]!>dS$fT!c!}Ed#T#fEd#f#g!>p#g#oEd]!>uS$fT!c!}Ed#T#fEd#f#g!?R#g#oEd]!?WS$fT!c!}Ed#T#cEd#c#d!?d#d#oEd]!?iS$fT!c!}Ed#T#kEd#k#l!?u#l#oEd]!?|Q*RW$fT!c!}Ed#T#oEd]!@XS$fT!c!}Ed#T#cEd#c#d!@e#d#oEd]!@jS$fT!c!}Ed#T#kEd#k#l!@v#l#oEd]!@{S$fT!c!}Ed#T#bEd#b#c!AX#c#oEd]!A^R$fT!c!}Ed#T#U!Ag#U#oEd]!AlS$fT!c!}Ed#T#fEd#f#g!Ax#g#oEd]!A}S$fT!c!}Ed#T#fEd#f#g!BZ#g#oEd]!B`S$fT!c!}Ed#T#cEd#c#d!Bl#d#oEd]!BqS$fT!c!}Ed#T#kEd#k#l!B}#l#oEd]!CUQ*UW$fT!c!}Ed#T#oEd]!CaS$fT!c!}Ed#T#XEd#X#Y!Cm#Y#oEd]!CrS$fT!c!}Ed#T#fEd#f#g!DO#g#oEd]!DTS$fT!c!}Ed#T#hEd#h#i!Da#i#oEd]!DhQ*]W$fT!c!}Ed#T#oEd]!DuO)wW$^T]!D|O)yW$^T]!ETO)xW$^TT!EWP;=`<%lE_]!EbO)vW#aTT!EiZ)cP'OSxy-eyz-ez{-e{|-e}!O-e!P!Q-e!^!_-e!_!`-e!`!a-e#Q#R-e#R#S-eT!FcZ)bP'OSxy-eyz-ez{-e{|-e}!O-e!P!Q-e!^!_-e!_!`-e!`!a-e#Q#R-e#R#S-e~!GZO#U~]!Gdc)rW'QS$lPOX$[Zp$[pq%nqs$[st&cwx$[x|%n|}$[}!O%n!O!P$[!P![%n![!^$[!^!a%n!a!}$[#S#o$[#p#q$[#s;'S$[;'S;=`'g<%lO$[~!HtO#V~~!HyO$n~",
  tokenizers: [verbTokenizer, lstinlineTokenizer, literalArgTokenizer, spaceDelimitedLiteralArgTokenizer, verbatimTokenizer, csnameTokenizer, trailingContentTokenizer, 0, 1, 2, 3, argumentListTokenizer, argumentListWithOptionalTokenizer],
  topRules: { "LaTeX": [0, 91] },
  specialized: [{ term: 160, get: (value, stack) => specializeCtrlSeq(value) << 1, external: specializeCtrlSeq }, { term: 114, get: (value, stack) => specializeEnvName(value) << 1, external: specializeEnvName }, { term: 152, get: (value, stack) => specializeCtrlSym(value) << 1, external: specializeCtrlSym }],
  tokenPrec: 18067
});
function isInEnvironmentName(context) {
  const textBefore = context.state.sliceDoc(Math.max(0, context.pos - 20), context.pos);
  return /\\(begin|end)\{[^}]*$/.test(textBefore);
}
function isInCommandName(context) {
  const textBefore = context.state.sliceDoc(Math.max(0, context.pos - 30), context.pos);
  return /\\[a-zA-Z]*$/.test(textBefore);
}
function isInMathMode(context) {
  const textBefore = context.state.sliceDoc(0, context.pos);
  const dollars = textBefore.match(/\$/g);
  return dollars ? dollars.length % 2 === 1 : false;
}
const environments = [
  // Document structure
  "document",
  "abstract",
  // Sectioning alternatives
  "appendix",
  "frontmatter",
  "mainmatter",
  "backmatter",
  // Floats
  "figure",
  "figure*",
  "table",
  "table*",
  "wrapfigure",
  "subfigure",
  // Text alignment
  "center",
  "flushleft",
  "flushright",
  "quote",
  "quotation",
  "verse",
  // Lists
  "itemize",
  "enumerate",
  "description",
  "list",
  // Verbatim
  "verbatim",
  "verbatim*",
  "lstlisting",
  "minted",
  "Verbatim",
  "comment",
  // Math
  "math",
  "displaymath",
  "equation",
  "equation*",
  "align",
  "align*",
  "gather",
  "gather*",
  "multline",
  "multline*",
  "flalign",
  "flalign*",
  "alignat",
  "alignat*",
  "array",
  "cases",
  "split",
  // Tables
  "tabular",
  "tabular*",
  "tabularx",
  "longtable",
  "xltabular",
  // Theorems
  "theorem",
  "lemma",
  "corollary",
  "proposition",
  "definition",
  "example",
  "proof",
  // TikZ
  "tikzpicture",
  "scope",
  // Boxes
  "minipage"
];
const commands = [
  // Document structure
  "\\documentclass",
  "\\usepackage",
  "\\title",
  "\\author",
  "\\date",
  "\\maketitle",
  "\\tableofcontents",
  "\\appendix",
  "\\bibliography",
  "\\bibliographystyle",
  // Sectioning commands
  "\\part",
  "\\chapter",
  "\\section",
  "\\subsection",
  "\\subsubsection",
  "\\paragraph",
  "\\subparagraph",
  // Environments
  "\\begin",
  "\\end",
  // References
  "\\label",
  "\\ref",
  "\\pageref",
  "\\cite",
  "\\nocite",
  "\\bibitem",
  // Text formatting
  "\\textbf",
  "\\textit",
  "\\texttt",
  "\\textsf",
  "\\textrm",
  "\\textsc",
  "\\emph",
  "\\underline",
  "\\textcolor",
  "\\colorbox",
  // Lists
  "\\item",
  "\\itemize",
  "\\enumerate",
  // Graphics
  "\\includegraphics",
  "\\caption",
  "\\figure",
  // Math commands
  "\\frac",
  "\\sqrt",
  "\\sum",
  "\\int",
  "\\prod",
  "\\lim",
  "\\infty",
  "\\partial",
  "\\alpha",
  "\\beta",
  "\\gamma",
  "\\delta",
  "\\epsilon",
  "\\varepsilon",
  "\\zeta",
  "\\eta",
  "\\theta",
  "\\iota",
  "\\kappa",
  "\\lambda",
  "\\mu",
  "\\nu",
  "\\xi",
  "\\pi",
  "\\rho",
  "\\sigma",
  "\\tau",
  "\\upsilon",
  "\\phi",
  "\\varphi",
  "\\chi",
  "\\psi",
  "\\omega",
  "\\Gamma",
  "\\Delta",
  "\\Theta",
  "\\Lambda",
  "\\Xi",
  "\\Pi",
  "\\Sigma",
  "\\Upsilon",
  "\\Phi",
  "\\Psi",
  "\\Omega",
  // Special characters and spacing
  "\\&",
  "\\%",
  "\\$",
  "\\#",
  "\\_",
  "\\{",
  "\\}",
  "\\\\",
  "\\quad",
  "\\qquad",
  "\\hspace",
  "\\vspace",
  // Tables
  "\\hline",
  "\\cline",
  "\\multicolumn",
  "\\multirow",
  "\\toprule",
  "\\midrule",
  "\\bottomrule",
  // Definitions
  "\\newcommand",
  "\\renewcommand",
  "\\newenvironment",
  "\\renewenvironment",
  "\\def",
  "\\let",
  // Input/Include
  "\\input",
  "\\include",
  "\\includeonly"
];
const mathCommands = [
  // Greek letters already included in main commands
  // Math operators
  "\\sin",
  "\\cos",
  "\\tan",
  "\\arcsin",
  "\\arccos",
  "\\arctan",
  "\\sinh",
  "\\cosh",
  "\\tanh",
  "\\log",
  "\\ln",
  "\\exp",
  "\\min",
  "\\max",
  "\\sup",
  "\\inf",
  "\\lim",
  "\\limsup",
  "\\liminf",
  "\\det",
  "\\dim",
  "\\mod",
  "\\gcd",
  "\\lcm",
  "\\mathop",
  // Math symbols
  "\\rightarrow",
  "\\leftarrow",
  "\\Rightarrow",
  "\\Leftarrow",
  "\\mapsto",
  "\\approx",
  "\\sim",
  "\\simeq",
  "\\cong",
  "\\equiv",
  "\\prec",
  "\\succ",
  "\\neq",
  "\\geq",
  "\\leq",
  "\\ll",
  "\\gg",
  "\\subset",
  "\\subseteq",
  "\\in",
  "\\notin",
  "\\cap",
  "\\cup",
  "\\setminus",
  "\\emptyset",
  "\\varnothing",
  "\\forall",
  "\\exists",
  "\\nexists",
  "\\mathbb{R}",
  "\\mathbb{Z}",
  "\\mathbb{N}",
  "\\mathbb{Q}",
  "\\mathbb{C}",
  // Math decorations
  "\\hat",
  "\\tilde",
  "\\bar",
  "\\vec",
  "\\dot",
  "\\ddot",
  "\\underline",
  "\\overline",
  // Math environments
  "\\begin{equation}",
  "\\begin{align}",
  "\\begin{align*}",
  "\\begin{gather}",
  "\\begin{array}",
  "\\begin{cases}",
  "\\begin{matrix}",
  "\\begin{pmatrix}",
  "\\begin{bmatrix}",
  "\\begin{vmatrix}"
];
const packages = [
  "amsmath",
  "amssymb",
  "amsfonts",
  "amsthm",
  "mathtools",
  "graphicx",
  "xcolor",
  "hyperref",
  "url",
  "geometry",
  "fancyhdr",
  "lastpage",
  "booktabs",
  "tabularx",
  "longtable",
  "multirow",
  "tikz",
  "pgfplots",
  "pgf",
  "babel",
  "inputenc",
  "fontenc",
  "natbib",
  "biblatex",
  "cite",
  "algorithm",
  "algorithmic",
  "listings",
  "minted",
  "enumitem",
  "cleveref",
  "microtype"
];
function createEnvironmentCompletion(envName, autoCloseEnabled) {
  return {
    label: envName,
    type: "class",
    apply: (view, completion, from, to) => {
      const line = view.state.doc.lineAt(from);
      const beforeCursor = view.state.sliceDoc(line.from, from);
      if (/\\begin\{[^}]*$/.test(beforeCursor)) {
        const lineText = line.text;
        const indentMatch = lineText.match(/^(\s*)/);
        const currentIndentation = indentMatch ? indentMatch[1] : "";
        const innerIndentation = currentIndentation + "  ";
        let insertContent = `${envName}}`;
        let selectionAnchorOffset = 1;
        if (autoCloseEnabled) {
          insertContent += `
${innerIndentation}
${currentIndentation}\\end{${envName}}`;
          selectionAnchorOffset += innerIndentation.length + 1;
        }
        view.dispatch({
          changes: { from, to, insert: insertContent },
          selection: { anchor: from + envName.length + selectionAnchorOffset }
          // Position inside environment or after closing brace
        });
      } else if (/\\end\{[^}]*$/.test(beforeCursor)) {
        view.dispatch({
          changes: { from, to, insert: `${envName}}` },
          selection: { anchor: from + envName.length + 1 }
        });
      } else {
        view.dispatch({
          changes: { from, to, insert: envName },
          selection: { anchor: from + envName.length }
        });
      }
    },
    boost: 1
  };
}
function createCommandCompletion(cmd2, autoCloseEnabled) {
  if (cmd2.startsWith("\\begin{")) {
    const envMatch = cmd2.match(/\\begin\{([^}]+)\}/);
    if (envMatch) {
      const envName = envMatch[1];
      return {
        label: cmd2,
        type: "function",
        apply: (view, completion, from, to) => {
          const line = view.state.doc.lineAt(from);
          const lineText = line.text;
          const indentMatch = lineText.match(/^(\s*)/);
          const currentIndentation = indentMatch ? indentMatch[1] : "";
          const innerIndentation = currentIndentation + "  ";
          let content2 = `\\begin{${envName}}`;
          let selectionAnchorOffset = cmd2.length;
          if (autoCloseEnabled) {
            content2 += `
${innerIndentation}
${currentIndentation}\\end{${envName}}`;
            selectionAnchorOffset += 1 + innerIndentation.length;
          }
          view.dispatch({
            changes: { from, to, insert: content2 },
            selection: { anchor: from + selectionAnchorOffset }
            // Position inside environment or after begin tag
          });
        },
        boost: 1
      };
    }
  }
  return {
    label: cmd2,
    type: "function",
    apply: cmd2,
    boost: 1
  };
}
const snippets = [
  {
    label: "\\begin{...}",
    type: "keyword",
    detail: "LaTeX environment",
    info: "Create a LaTeX environment",
    apply: (view, completion, from, to) => {
      view.dispatch({
        changes: { from, to, insert: "\\begin{}" },
        selection: { anchor: from + 7 }
      });
    }
  },
  {
    label: "\\section{...}",
    type: "keyword",
    detail: "LaTeX section",
    info: "Create a section",
    apply: "\\section{}"
  },
  {
    label: "\\subsection{...}",
    type: "keyword",
    detail: "LaTeX subsection",
    info: "Create a subsection",
    apply: "\\subsection{}"
  },
  {
    label: "\\begin{figure}",
    type: "keyword",
    detail: "LaTeX figure environment",
    info: "Create a figure environment",
    apply: (view, completion, from, to) => {
      const line = view.state.doc.lineAt(from);
      const lineText = line.text;
      const indentMatch = lineText.match(/^(\s*)/);
      const currentIndentation = indentMatch ? indentMatch[1] : "";
      const innerIndentation = currentIndentation + "  ";
      const content2 = `\\begin{figure}[htbp]
${innerIndentation}\\centering
${innerIndentation}\\includegraphics[width=0.8\\textwidth]{}
${innerIndentation}\\caption{}
${innerIndentation}\\label{fig:}
${currentIndentation}\\end{figure}`;
      view.dispatch({
        changes: { from, to, insert: content2 },
        selection: { anchor: from + content2.indexOf("{}") }
      });
    }
  },
  {
    label: "\\begin{table}",
    type: "keyword",
    detail: "LaTeX table environment",
    info: "Create a table environment",
    apply: (view, completion, from, to) => {
      const line = view.state.doc.lineAt(from);
      const lineText = line.text;
      const indentMatch = lineText.match(/^(\s*)/);
      const currentIndentation = indentMatch ? indentMatch[1] : "";
      const innerIndentation = currentIndentation + "  ";
      const tableIndentation = innerIndentation + "  ";
      const content2 = `\\begin{table}[htbp]
${innerIndentation}\\centering
${innerIndentation}\\begin{tabular}{ccc}
${tableIndentation}header1 & header2 & header3 \\\\
${tableIndentation}\\hline
${tableIndentation}data1 & data2 & data3 \\\\
${innerIndentation}\\end{tabular}
${innerIndentation}\\caption{}
${innerIndentation}\\label{tab:}
${currentIndentation}\\end{table}`;
      view.dispatch({
        changes: { from, to, insert: content2 },
        selection: { anchor: from + content2.indexOf("{}") }
      });
    }
  }
];
function latexCompletionSource(autoCloseTagsEnabled) {
  return function(context) {
    if (!context.explicit) {
      const before = context.matchBefore(/\\[a-zA-Z]*$|\\(begin|end)\{[a-zA-Z]*$/);
      if (!before || before.from === before.to) {
        return null;
      }
    }
    if (isInEnvironmentName(context)) {
      const envMatch = context.matchBefore(/\\(begin|end)\{([a-zA-Z]*)$/);
      if (envMatch) {
        const options = environments.map((env) => createEnvironmentCompletion(env, autoCloseTagsEnabled));
        return {
          from: envMatch.from + envMatch.text.lastIndexOf("{") + 1,
          options,
          validFor: /^[a-zA-Z*]*$/
        };
      }
    }
    if (isInCommandName(context)) {
      const cmdMatch = context.matchBefore(/\\([a-zA-Z]*)$/);
      if (cmdMatch) {
        let options = commands.map((cmd2) => createCommandCompletion(cmd2, autoCloseTagsEnabled));
        if (isInMathMode(context)) {
          options = [...options, ...mathCommands.map((cmd2) => createCommandCompletion(cmd2, autoCloseTagsEnabled))];
        }
        options = [...options, ...snippets];
        return {
          from: cmdMatch.from,
          options,
          validFor: /^\\?[a-zA-Z]*$/
        };
      }
    }
    const packageMatch = context.matchBefore(/\\usepackage(\[\S*\])?\{([a-zA-Z,]*)$/);
    if (packageMatch) {
      return {
        from: packageMatch.from + packageMatch.text.lastIndexOf("{") + 1,
        options: packages.map((pkg) => ({
          label: pkg,
          type: "constant",
          apply: pkg,
          boost: 1
        })),
        validFor: /^[a-zA-Z,]*$/
      };
    }
    return null;
  };
}
const autoCloseEffect = StateEffect.define();
const autoCloseField = StateField.define({
  create: () => ({ active: false, lastEnv: null }),
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(autoCloseEffect)) {
        return { active: true, lastEnv: e.value.envName };
      }
    }
    return value;
  }
});
function getCurrentLineIndentation(view, pos) {
  const line = view.state.doc.lineAt(pos);
  const lineText = line.text;
  const match = lineText.match(/^(\s*)/);
  return match ? match[1] : "";
}
function isAfterBeginEnvironment(view) {
  const { state } = view;
  const { main } = state.selection;
  if (main.from !== main.to)
    return null;
  const line = state.doc.lineAt(main.from);
  const lineText = line.text;
  const match = /\\begin\{([^}]+)\}[ \t]*$/.exec(lineText);
  if (match) {
    return { name: match[1], pos: main.from };
  }
  return null;
}
const handleEnterInEnvironment = (view) => {
  const envInfo = isAfterBeginEnvironment(view);
  if (!envInfo)
    return false;
  const currentIndentation = getCurrentLineIndentation(view, envInfo.pos);
  const innerIndentation = currentIndentation + "  ";
  const content2 = `
${innerIndentation}
${currentIndentation}\\end{${envInfo.name}}`;
  view.dispatch({
    changes: { from: envInfo.pos, insert: content2 },
    selection: { anchor: envInfo.pos + innerIndentation.length + 1 },
    effects: [autoCloseEffect.of({ envName: envInfo.name, pos: envInfo.pos })]
  });
  return true;
};
const handleCloseBrace = (view) => {
  const { state } = view;
  const { main } = state.selection;
  if (main.from !== main.to)
    return false;
  const lineStart = state.doc.lineAt(main.from).from;
  const beforeCursor = state.sliceDoc(lineStart, main.from);
  const match = /\\begin\{([^}]*)$/.exec(beforeCursor);
  if (match) {
    const envName = match[1];
    const currentIndentation = getCurrentLineIndentation(view, main.from);
    const innerIndentation = currentIndentation + "  ";
    view.dispatch({
      changes: [
        { from: main.from, insert: "}" },
        { from: main.from, insert: `
${innerIndentation}
${currentIndentation}\\end{${envName}}` }
      ],
      selection: { anchor: main.from + innerIndentation.length + 2 },
      effects: [autoCloseEffect.of({ envName, pos: main.from })]
    });
    return true;
  }
  return false;
};
const autoCloseTags = [
  autoCloseField,
  // Key handlers
  keymap.of([
    { key: "Enter", run: handleEnterInEnvironment },
    { key: "}", run: handleCloseBrace }
  ]),
  // Transaction filter for tracking completions that should trigger auto-closing
  EditorState.transactionFilter.of((tr) => {
    if (!tr.isUserEvent("input"))
      return tr;
    const state = tr.startState;
    const changes = tr.changes;
    let newChanges = [];
    let newSelection = tr.selection;
    let modified = false;
    changes.iterChanges((fromA, toA, fromB, toB, inserted) => {
      const insertedText = inserted.sliceString(0);
      const beginMatch = /\\begin\{([^}]+)\}$/.exec(insertedText);
      if (beginMatch && tr.isUserEvent("input.complete")) {
        const envName = beginMatch[1];
        const docText = state.sliceDoc();
        const hasEnd = new RegExp(`\\\\end\\{${envName}\\}`).test(docText);
        if (!hasEnd) {
          const line = state.doc.lineAt(fromA);
          const lineText = line.text;
          const indentMatch = lineText.match(/^(\s*)/);
          const currentIndentation = indentMatch ? indentMatch[1] : "";
          const innerIndentation = currentIndentation + "  ";
          newChanges.push({
            from: toB,
            insert: `
${innerIndentation}
${currentIndentation}\\end{${envName}}`
          });
          newSelection = EditorSelection.single(toB + innerIndentation.length + 1);
          modified = true;
        }
      }
    });
    if (modified) {
      return [tr, {
        changes: newChanges,
        selection: newSelection,
        userEvent: "input.auto-close"
      }];
    }
    return tr;
  })
];
function latexLinter(options = {}) {
  const defaultOptions2 = {
    checkMissingDocumentEnv: true,
    checkUnmatchedEnvironments: true,
    checkMissingReferences: true
  };
  const opts = { ...defaultOptions2, ...options };
  return (view) => {
    const diagnostics = [];
    const tree = syntaxTree(view.state);
    const doc = view.state.doc;
    if (opts.checkMissingDocumentEnv) {
      let hasDocumentEnv = false;
      tree.cursor().iterate((node) => {
        if (node.name === "DocumentEnvironment" || node.name === "DocumentEnvName") {
          hasDocumentEnv = true;
          return false;
        }
      });
      if (!hasDocumentEnv && doc.length > 100) {
        diagnostics.push({
          from: 0,
          to: Math.min(doc.length, 200),
          severity: "warning",
          message: "Missing document environment. LaTeX documents should be enclosed in \\begin{document}...\\end{document}",
          source: "LaTeX"
        });
      }
    }
    if (opts.checkUnmatchedEnvironments) {
      const beginEnvs = /* @__PURE__ */ new Map();
      const endEnvs = /* @__PURE__ */ new Map();
      tree.cursor().iterate((node) => {
        var _a2, _b;
        if (node.name === "BeginEnv") {
          const envNameNode = findEnvName(node);
          if (envNameNode) {
            const envName = doc.sliceString(envNameNode.from, envNameNode.to);
            if (!beginEnvs.has(envName)) {
              beginEnvs.set(envName, []);
            }
            (_a2 = beginEnvs.get(envName)) === null || _a2 === void 0 ? void 0 : _a2.push(node.from);
          }
        } else if (node.name === "EndEnv") {
          const envNameNode = findEnvName(node);
          if (envNameNode) {
            const envName = doc.sliceString(envNameNode.from, envNameNode.to);
            if (!endEnvs.has(envName)) {
              endEnvs.set(envName, []);
            }
            (_b = endEnvs.get(envName)) === null || _b === void 0 ? void 0 : _b.push(node.from);
          }
        }
      });
      for (const [envName, begins] of beginEnvs.entries()) {
        const ends = endEnvs.get(envName) || [];
        if (begins.length > ends.length) {
          for (let i = ends.length; i < begins.length; i++) {
            diagnostics.push({
              from: begins[i],
              to: begins[i] + 6 + envName.length + 1,
              severity: "error",
              message: `Missing \\end{${envName}}`,
              source: "LaTeX"
            });
          }
        }
      }
      for (const [envName, ends] of endEnvs.entries()) {
        const begins = beginEnvs.get(envName) || [];
        if (ends.length > begins.length) {
          for (let i = begins.length; i < ends.length; i++) {
            diagnostics.push({
              from: ends[i],
              to: ends[i] + 4 + envName.length + 1,
              severity: "error",
              message: `Missing \\begin{${envName}}`,
              source: "LaTeX"
            });
          }
        }
      }
    }
    if (opts.checkMissingReferences) {
      const labels = /* @__PURE__ */ new Set();
      const refs = /* @__PURE__ */ new Map();
      tree.cursor().iterate((node) => {
        var _a2;
        if (node.name === "LabelCtrlSeq") {
          const labelArg = node.node.nextSibling;
          if (labelArg && labelArg.name === "LabelArgument") {
            const content2 = doc.sliceString(labelArg.from + 1, labelArg.to - 1);
            labels.add(content2);
          }
        } else if (node.name === "RefCtrlSeq" || node.name === "RefStarrableCtrlSeq") {
          const refArg = (_a2 = node.node.nextSibling) === null || _a2 === void 0 ? void 0 : _a2.nextSibling;
          if (refArg && refArg.name === "RefArgument") {
            const content2 = doc.sliceString(refArg.from + 1, refArg.to - 1);
            refs.set(content2, node.from);
          }
        }
      });
      for (const [ref, pos] of refs.entries()) {
        if (!labels.has(ref)) {
          diagnostics.push({
            from: pos,
            to: pos + ref.length + 6,
            severity: "warning",
            message: `Reference to undefined label: ${ref}`,
            source: "LaTeX"
          });
        }
      }
    }
    return diagnostics;
  };
}
function findEnvName(node) {
  let envNameGroup = null;
  for (let child = node.node.firstChild; child; child = child.nextSibling) {
    if (child.name === "EnvNameGroup") {
      envNameGroup = child;
      break;
    }
  }
  if (envNameGroup) {
    for (let child = envNameGroup.firstChild; child; child = child.nextSibling) {
      if (child.name === "EnvName" || child.name === "DocumentEnvName" || child.name === "TabularEnvName" || child.name === "EquationEnvName" || child.name === "EquationArrayEnvName" || child.name === "VerbatimEnvName" || child.name === "TikzPictureEnvName" || child.name === "FigureEnvName" || child.name === "ListEnvName" || child.name === "TableEnvName") {
        return child;
      }
    }
  }
  return null;
}
const commandInfoMap = {
  "\\documentclass": {
    description: "Defines the type of document to be created.",
    syntax: "\\documentclass[options]{class}",
    example: "\\documentclass[12pt,a4paper]{article}"
  },
  "\\usepackage": {
    description: "Loads a LaTeX package.",
    syntax: "\\usepackage[options]{package}",
    example: "\\usepackage{graphicx}"
  },
  "\\begin": {
    description: "Begins an environment.",
    syntax: "\\begin{environment}",
    example: "\\begin{document}"
  },
  "\\end": {
    description: "Ends an environment.",
    syntax: "\\end{environment}",
    example: "\\end{document}"
  },
  "\\section": {
    description: "Creates a section heading.",
    syntax: "\\section[short title]{title}",
    example: "\\section{Introduction}"
  },
  "\\subsection": {
    description: "Creates a subsection heading.",
    syntax: "\\subsection[short title]{title}",
    example: "\\subsection{Method}"
  },
  "\\subsubsection": {
    description: "Creates a subsubsection heading.",
    syntax: "\\subsubsection[short title]{title}",
    example: "\\subsubsection{Implementation details}"
  },
  "\\textbf": {
    description: "Sets text in bold font.",
    syntax: "\\textbf{text}",
    example: "\\textbf{Important note}"
  },
  "\\textit": {
    description: "Sets text in italic font.",
    syntax: "\\textit{text}",
    example: "\\textit{Emphasized term}"
  },
  "\\emph": {
    description: "Emphasizes text. Typically renders as italic.",
    syntax: "\\emph{text}",
    example: "\\emph{Important}"
  },
  "\\cite": {
    description: "Creates a citation.",
    syntax: "\\cite[text]{key}",
    example: "\\cite{smith2020}"
  },
  "\\ref": {
    description: "Creates a reference to a labeled element.",
    syntax: "\\ref{label}",
    example: "\\ref{fig:sample}"
  },
  "\\label": {
    description: "Assigns a label to an element for referencing.",
    syntax: "\\label{name}",
    example: "\\label{sec:introduction}"
  },
  "\\includegraphics": {
    description: "Includes a graphics file.",
    syntax: "\\includegraphics[options]{filename}",
    example: "\\includegraphics[width=0.8\\textwidth]{figure.png}",
    package: "graphicx"
  },
  "\\frac": {
    description: "Creates a fraction.",
    syntax: "\\frac{numerator}{denominator}",
    example: "\\frac{a}{b}",
    package: "amsmath (optional)"
  },
  "\\item": {
    description: "Defines an item in a list environment.",
    syntax: "\\item[optional label] content",
    example: "\\item First item in list"
  },
  "\\maketitle": {
    description: "Generates a title based on \\title, \\author, and \\date commands.",
    syntax: "\\maketitle",
    example: "\\maketitle"
  },
  "\\title": {
    description: "Specifies the document title.",
    syntax: "\\title{title}",
    example: "\\title{My Document}"
  },
  "\\author": {
    description: "Specifies the document author(s).",
    syntax: "\\author{name}",
    example: "\\author{John Smith}"
  },
  "\\date": {
    description: "Specifies the document date.",
    syntax: "\\date{date}",
    example: "\\date{\\today}"
  },
  "\\caption": {
    description: "Adds a caption to a figure or table.",
    syntax: "\\caption{text}",
    example: "\\caption{A sample figure}"
  },
  "\\hline": {
    description: "Draws a horizontal line in a table.",
    syntax: "\\hline",
    example: "\\hline"
  },
  "\\newcommand": {
    description: "Defines a new command.",
    syntax: "\\newcommand{\\name}[args][default]{definition}",
    example: "\\newcommand{\\mycommand}[1]{Hello #1!}"
  }
};
const environmentInfoMap = {
  "document": {
    description: "The main document environment. All visible content must be inside this environment.",
    syntax: "\\begin{document}...\\end{document}",
    example: "\\begin{document}\nHello, world!\n\\end{document}"
  },
  "figure": {
    description: "Environment for floating figures.",
    syntax: "\\begin{figure}[placement]...\\end{figure}",
    example: "\\begin{figure}[ht]\n\\centering\n\\includegraphics{image.png}\n\\caption{A figure}\n\\label{fig:example}\n\\end{figure}"
  },
  "table": {
    description: "Environment for floating tables.",
    syntax: "\\begin{table}[placement]...\\end{table}",
    example: "\\begin{table}[ht]\n\\centering\n\\begin{tabular}{cc}\n...\n\\end{tabular}\n\\caption{A table}\n\\label{tab:example}\n\\end{table}"
  },
  "tabular": {
    description: "Environment for creating tables.",
    syntax: "\\begin{tabular}{columns}...\\end{tabular}",
    example: "\\begin{tabular}{|l|c|r|}\n\\hline\nLeft & Center & Right \\\\\n\\hline\n\\end{tabular}"
  },
  "itemize": {
    description: "Environment for bulleted lists.",
    syntax: "\\begin{itemize}...\\end{itemize}",
    example: "\\begin{itemize}\n\\item First item\n\\item Second item\n\\end{itemize}"
  },
  "enumerate": {
    description: "Environment for numbered lists.",
    syntax: "\\begin{enumerate}...\\end{enumerate}",
    example: "\\begin{enumerate}\n\\item First item\n\\item Second item\n\\end{enumerate}"
  },
  "equation": {
    description: "Environment for numbered equations.",
    syntax: "\\begin{equation}...\\end{equation}",
    example: "\\begin{equation}\nE = mc^2\n\\end{equation}"
  },
  "equation*": {
    description: "Environment for unnumbered equations.",
    syntax: "\\begin{equation*}...\\end{equation*}",
    example: "\\begin{equation*}\nE = mc^2\n\\end{equation*}"
  },
  "align": {
    description: "Environment for aligning multiple equations, with equation numbers.",
    syntax: "\\begin{align}...\\end{align}",
    example: "\\begin{align}\na &= b \\\\\nc &= d\n\\end{align}",
    package: "amsmath"
  },
  "align*": {
    description: "Environment for aligning multiple equations, without equation numbers.",
    syntax: "\\begin{align*}...\\end{align*}",
    example: "\\begin{align*}\na &= b \\\\\nc &= d\n\\end{align*}",
    package: "amsmath"
  },
  "verbatim": {
    description: "Environment for verbatim text, where LaTeX commands are not processed.",
    syntax: "\\begin{verbatim}...\\end{verbatim}",
    example: "\\begin{verbatim}\nThis is verbatim text.\n\\end{verbatim}"
  },
  "center": {
    description: "Environment for centering text.",
    syntax: "\\begin{center}...\\end{center}",
    example: "\\begin{center}\nCentered text\n\\end{center}"
  },
  "tikzpicture": {
    description: "Environment for creating TikZ pictures.",
    syntax: "\\begin{tikzpicture}...\\end{tikzpicture}",
    example: "\\begin{tikzpicture}\n\\draw (0,0) -- (1,1);\n\\end{tikzpicture}",
    package: "tikz"
  }
};
const latexHoverTooltip = hoverTooltip((view, pos, side) => {
  const tree = syntaxTree(view.state);
  const node = tree.resolve(pos);
  if (node.name === "CtrlSeq" || node.name.endsWith("CtrlSeq") || node.name === "Begin" || node.name === "End") {
    const cmdText = view.state.sliceDoc(node.from, node.to);
    const info = commandInfoMap[cmdText];
    if (info) {
      return makeTooltip(info, node.from, node.to);
    }
  }
  if (node.name === "EnvName" || node.name.endsWith("EnvName")) {
    const envName = view.state.sliceDoc(node.from, node.to);
    const info = environmentInfoMap[envName];
    if (info) {
      return makeTooltip(info, node.from, node.to);
    }
  }
  const parent = node.parent;
  if (parent && parent.name === "EnvNameGroup") {
    const envNameNode = findEnvNameNode(parent);
    if (envNameNode) {
      const envName = view.state.sliceDoc(envNameNode.from, envNameNode.to);
      const info = environmentInfoMap[envName];
      if (info) {
        return makeTooltip(info, envNameNode.from, envNameNode.to);
      }
    }
  }
  return null;
});
function findEnvNameNode(node) {
  if (!node)
    return null;
  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.name === "EnvName" || child.name === "DocumentEnvName" || child.name === "TabularEnvName" || child.name === "EquationEnvName" || child.name === "EquationArrayEnvName" || child.name === "VerbatimEnvName" || child.name === "TikzPictureEnvName" || child.name === "FigureEnvName" || child.name === "ListEnvName" || child.name === "TableEnvName") {
      return child;
    }
  }
  return null;
}
function makeTooltip(info, from, to) {
  let content2 = document.createElement("div");
  content2.className = "cm-latex-tooltip";
  let description = document.createElement("div");
  description.textContent = info.description;
  description.className = "cm-latex-tooltip-description";
  content2.appendChild(description);
  let syntax = document.createElement("div");
  syntax.textContent = "Syntax: " + info.syntax;
  syntax.className = "cm-latex-tooltip-syntax";
  content2.appendChild(syntax);
  if (info.example) {
    let example = document.createElement("div");
    example.textContent = "Example: " + info.example;
    example.className = "cm-latex-tooltip-example";
    content2.appendChild(example);
  }
  if (info.package) {
    let package_ = document.createElement("div");
    package_.textContent = "Package: " + info.package;
    package_.className = "cm-latex-tooltip-package";
    content2.appendChild(package_);
  }
  return {
    pos: from,
    end: to,
    above: true,
    create(view) {
      return { dom: content2 };
    }
  };
}
const latexBracketMatching = bracketMatching({
  brackets: "()[]{}"
});
function commentFoldRanges(state, lineStart, lineEnd) {
  const doc = state.doc;
  const startLine = doc.lineAt(lineStart);
  if (startLine.text.startsWith("% {")) {
    for (let lineNo = startLine.number + 1; lineNo <= doc.lines; lineNo++) {
      const line = doc.line(lineNo);
      if (line.text.trim() === "% }") {
        return {
          from: startLine.to,
          to: line.to - 1
        };
      }
    }
  }
  return null;
}
const latexLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      indentNodeProp.add({
        Environment: (context) => {
          let indent = context.baseIndent;
          return indent + context.unit;
        },
        KnownEnvironment: (context) => {
          let indent = context.baseIndent;
          return indent + context.unit;
        },
        Group: (context) => {
          return context.baseIndent + context.unit;
        },
        BeginEnv: (context) => {
          let indent = context.baseIndent;
          return indent + context.unit;
        },
        "Content TextArgument LongArg": (context) => {
          return context.baseIndent + context.unit;
        }
      }),
      foldNodeProp.add({
        Environment: foldInside,
        KnownEnvironment: foldInside,
        Group: foldInside,
        DocumentEnvironment: foldInside,
        TabularEnvironment: foldInside,
        EquationEnvironment: foldInside,
        EquationArrayEnvironment: foldInside,
        VerbatimEnvironment: foldInside,
        TikzPictureEnvironment: foldInside,
        FigureEnvironment: foldInside,
        ListEnvironment: foldInside,
        TableEnvironment: foldInside,
        Book: foldInside,
        Part: foldInside,
        Chapter: foldInside,
        Section: foldInside,
        SubSection: foldInside,
        SubSubSection: foldInside,
        Paragraph: foldInside,
        SubParagraph: foldInside
      }),
      styleTags({
        // Control sequences
        CtrlSeq: tags.keyword,
        CtrlSym: tags.operator,
        Csname: tags.keyword,
        // Mathematical constructs
        Dollar: tags.processingInstruction,
        MathSpecialChar: tags.operator,
        MathChar: tags.variableName,
        MathOpening: tags.bracket,
        MathClosing: tags.bracket,
        // Various structural elements
        EnvName: tags.className,
        DocumentEnvName: tags.className,
        TabularEnvName: tags.className,
        EquationEnvName: tags.className,
        EquationArrayEnvName: tags.className,
        VerbatimEnvName: tags.className,
        TikzPictureEnvName: tags.className,
        FigureEnvName: tags.className,
        ListEnvName: tags.className,
        TableEnvName: tags.className,
        // Sectioning commands
        BookCtrlSeq: tags.heading,
        PartCtrlSeq: tags.heading,
        ChapterCtrlSeq: tags.heading,
        SectionCtrlSeq: tags.heading,
        SubSectionCtrlSeq: tags.heading,
        SubSubSectionCtrlSeq: tags.heading,
        ParagraphCtrlSeq: tags.heading,
        SubParagraphCtrlSeq: tags.heading,
        // Special content
        Comment: tags.comment,
        VerbContent: tags.meta,
        VerbatimContent: tags.meta,
        LstInlineContent: tags.meta,
        LiteralArgContent: tags.string,
        SpaceDelimitedLiteralArgContent: tags.string,
        // Delimiters
        OpenBrace: tags.bracket,
        CloseBrace: tags.bracket,
        OpenBracket: tags.bracket,
        CloseBracket: tags.bracket,
        // Environment markers
        Begin: tags.keyword,
        End: tags.keyword,
        // Text formatting and styling
        TextBoldCtrlSeq: tags.strong,
        TextItalicCtrlSeq: tags.emphasis,
        TextSmallCapsCtrlSeq: tags.className,
        TextTeletypeCtrlSeq: tags.monospace,
        EmphasisCtrlSeq: tags.emphasis,
        UnderlineCtrlSeq: tags.emphasis,
        // Important content markers
        TitleCtrlSeq: tags.heading,
        AuthorCtrlSeq: tags.heading,
        DateCtrlSeq: tags.heading,
        // Numbers and standard text
        Number: tags.number,
        Normal: tags.content,
        // Special characters
        Ampersand: tags.operator,
        Tilde: tags.operator,
        // Trailing content
        TrailingContent: tags.invalid,
        // Other common commands
        DocumentClassCtrlSeq: tags.definitionKeyword,
        UsePackageCtrlSeq: tags.keyword,
        LabelCtrlSeq: tags.labelName,
        RefCtrlSeq: tags.labelName,
        RefStarrableCtrlSeq: tags.labelName,
        CiteCtrlSeq: tags.quote,
        CiteStarrableCtrlSeq: tags.quote,
        BibliographyCtrlSeq: tags.heading,
        BibliographyStyleCtrlSeq: tags.heading
      })
    ]
  }),
  languageData: {
    commentTokens: { line: "%" },
    closeBrackets: { brackets: ["(", "[", "{", "'", '"'] },
    wordChars: "$\\-_"
  }
});
function latex(config2 = {}) {
  var _a2, _b, _c, _d, _e;
  const options = {
    ...config2,
    autoCloseTags: (_a2 = config2.autoCloseTags) !== null && _a2 !== void 0 ? _a2 : true,
    enableLinting: (_b = config2.enableLinting) !== null && _b !== void 0 ? _b : true,
    enableTooltips: (_c = config2.enableTooltips) !== null && _c !== void 0 ? _c : true,
    enableAutocomplete: (_d = config2.enableAutocomplete) !== null && _d !== void 0 ? _d : true,
    autoCloseBrackets: (_e = config2.autoCloseBrackets) !== null && _e !== void 0 ? _e : true
  };
  const extensions2 = [];
  extensions2.push(latexLanguage.data.of({
    autocomplete: latexCompletionSource(options.autoCloseTags)
  }));
  extensions2.push(foldService.of(commentFoldRanges));
  if (options.enableAutocomplete) {
    extensions2.push(autocompletion({
      override: [latexCompletionSource(options.autoCloseTags)],
      defaultKeymap: true,
      activateOnTyping: true,
      icons: true
    }));
    extensions2.push(keymap.of(completionKeymap));
  }
  extensions2.push(latexBracketMatching);
  if (options.autoCloseBrackets) {
    extensions2.push(closeBrackets());
  }
  if (options.autoCloseTags) {
    extensions2.push(...autoCloseTags);
  }
  if (options.enableLinting) {
    extensions2.push(linter(latexLinter()));
  }
  if (options.enableTooltips) {
    extensions2.push(latexHoverTooltip);
  }
  return new LanguageSupport(latexLanguage, extensions2);
}
const applyCmTransactionsToAmHandle = (handle, path, transactions) => {
  const transactionsWithChanges = transactions.filter((tr) => !isReconcileTx(tr) && !tr.changes.empty);
  if (transactionsWithChanges.length === 0) {
    return;
  }
  handle.change((doc) => {
    transactionsWithChanges.forEach((tr) => {
      tr.changes.iterChanges((fromA, toA, fromB, _toB, inserted) => {
        A.splice(doc, path.slice(), fromB, toA - fromA, inserted.toString());
      });
    });
  });
  return A.getHeads(handle.doc());
};
const applyAmPatchesToCm = (view, target2, patches) => {
  let selection = view.state.selection;
  for (const patch of patches) {
    const changeSpec = handlePatch(patch, target2, view.state);
    if (changeSpec != null) {
      const changeSet = ChangeSet.of(changeSpec, view.state.doc.length, "\n");
      selection = selection.map(changeSet, 1);
      view.dispatch({
        changes: changeSet,
        annotations: reconcileAnnotationType.of({})
      });
    }
  }
  view.dispatch({
    selection,
    annotations: reconcileAnnotationType.of({})
  });
};
function handlePatch(patch, target2, state) {
  if (patch.action === "insert") {
    return handleInsert(target2, patch);
  } else if (patch.action === "splice") {
    return handleSplice(target2, patch);
  } else if (patch.action === "del") {
    return handleDel(target2, patch);
  } else if (patch.action === "put") {
    return handlePut(target2, patch, state);
  } else {
    return null;
  }
}
function handleInsert(target2, patch) {
  const index = charPath(target2, patch.path);
  if (index == null) {
    return [];
  }
  const text = patch.values.map((v) => v ? v.toString() : "").join("");
  return [{ from: index, to: index, insert: text }];
}
function handleSplice(target2, patch) {
  const index = charPath(target2, patch.path);
  if (index == null) {
    return [];
  }
  return [{ from: index, insert: patch.value }];
}
function handleDel(target2, patch) {
  const index = charPath(target2, patch.path);
  if (index == null) {
    return [];
  }
  const length = patch.length || 1;
  return [{ from: index, to: index + length }];
}
function handlePut(target2, patch, state) {
  const index = charPath(target2, [...patch.path, 0]);
  if (index == null) {
    return [];
  }
  const length = state.doc.length;
  if (typeof patch.value !== "string") {
    return [];
  }
  return [{ from: 0, to: length, insert: patch.value }];
}
function charPath(textPath, candidatePath) {
  if (candidatePath.length !== textPath.length + 1)
    return null;
  for (let i = 0; i < textPath.length; i++) {
    if (textPath[i] !== candidatePath[i])
      return null;
  }
  const index = candidatePath[candidatePath.length - 1];
  if (typeof index === "number")
    return index;
  return null;
}
const reconcileAnnotationType = Annotation.define();
const isReconcileTx = (tr) => !!tr.annotation(reconcileAnnotationType);
const automergeSyncPlugin = ({ handle, path }) => {
  if (!handle.isReady()) {
    throw new Error("ensure the handle is ready before initializing the automergeSyncPlugin");
  }
  return ViewPlugin.fromClass(class {
    view;
    reconciledHeads = A.getHeads(handle.doc());
    isProcessingCmTransaction = false;
    constructor(view) {
      this.view = view;
      this.onChange = this.onChange.bind(this);
      handle.on("change", this.onChange);
    }
    update(update) {
      this.isProcessingCmTransaction = true;
      const newHeads = applyCmTransactionsToAmHandle(handle, path, update.transactions);
      if (newHeads) {
        this.reconciledHeads = newHeads;
      }
      this.isProcessingCmTransaction = false;
    }
    onChange = () => {
      if (this.isProcessingCmTransaction) {
        return;
      }
      const currentHeads = A.getHeads(handle.doc());
      if (A.equals(currentHeads, this.reconciledHeads)) {
        return;
      }
      const patches = A.diff(handle.doc(), this.reconciledHeads, currentHeads);
      applyAmPatchesToCm(this.view, path, patches);
      this.reconciledHeads = currentHeads;
    };
    destroy() {
      handle.off("change", this.onChange);
    }
  });
};
var client = {};
var reactDom = { exports: {} };
var reactDom_production_min = {};
var scheduler = { exports: {} };
var scheduler_production_min = {};
var hasRequiredScheduler_production_min;
function requireScheduler_production_min() {
  if (hasRequiredScheduler_production_min) return scheduler_production_min;
  hasRequiredScheduler_production_min = 1;
  (function(exports$1) {
    function f(a, b) {
      var c = a.length;
      a.push(b);
      a: for (; 0 < c; ) {
        var d = c - 1 >>> 1, e = a[d];
        if (0 < g(e, b)) a[d] = b, a[c] = e, c = d;
        else break a;
      }
    }
    function h(a) {
      return 0 === a.length ? null : a[0];
    }
    function k(a) {
      if (0 === a.length) return null;
      var b = a[0], c = a.pop();
      if (c !== b) {
        a[0] = c;
        a: for (var d = 0, e = a.length, w = e >>> 1; d < w; ) {
          var m = 2 * (d + 1) - 1, C = a[m], n = m + 1, x = a[n];
          if (0 > g(C, c)) n < e && 0 > g(x, C) ? (a[d] = x, a[n] = c, d = n) : (a[d] = C, a[m] = c, d = m);
          else if (n < e && 0 > g(x, c)) a[d] = x, a[n] = c, d = n;
          else break a;
        }
      }
      return b;
    }
    function g(a, b) {
      var c = a.sortIndex - b.sortIndex;
      return 0 !== c ? c : a.id - b.id;
    }
    if ("object" === typeof performance && "function" === typeof performance.now) {
      var l = performance;
      exports$1.unstable_now = function() {
        return l.now();
      };
    } else {
      var p = Date, q = p.now();
      exports$1.unstable_now = function() {
        return p.now() - q;
      };
    }
    var r = [], t2 = [], u = 1, v = null, y = 3, z = false, A2 = false, B = false, D = "function" === typeof setTimeout ? setTimeout : null, E = "function" === typeof clearTimeout ? clearTimeout : null, F = "undefined" !== typeof setImmediate ? setImmediate : null;
    "undefined" !== typeof navigator && void 0 !== navigator.scheduling && void 0 !== navigator.scheduling.isInputPending && navigator.scheduling.isInputPending.bind(navigator.scheduling);
    function G(a) {
      for (var b = h(t2); null !== b; ) {
        if (null === b.callback) k(t2);
        else if (b.startTime <= a) k(t2), b.sortIndex = b.expirationTime, f(r, b);
        else break;
        b = h(t2);
      }
    }
    function H(a) {
      B = false;
      G(a);
      if (!A2) if (null !== h(r)) A2 = true, I(J);
      else {
        var b = h(t2);
        null !== b && K(H, b.startTime - a);
      }
    }
    function J(a, b) {
      A2 = false;
      B && (B = false, E(L), L = -1);
      z = true;
      var c = y;
      try {
        G(b);
        for (v = h(r); null !== v && (!(v.expirationTime > b) || a && !M()); ) {
          var d = v.callback;
          if ("function" === typeof d) {
            v.callback = null;
            y = v.priorityLevel;
            var e = d(v.expirationTime <= b);
            b = exports$1.unstable_now();
            "function" === typeof e ? v.callback = e : v === h(r) && k(r);
            G(b);
          } else k(r);
          v = h(r);
        }
        if (null !== v) var w = true;
        else {
          var m = h(t2);
          null !== m && K(H, m.startTime - b);
          w = false;
        }
        return w;
      } finally {
        v = null, y = c, z = false;
      }
    }
    var N = false, O = null, L = -1, P = 5, Q = -1;
    function M() {
      return exports$1.unstable_now() - Q < P ? false : true;
    }
    function R() {
      if (null !== O) {
        var a = exports$1.unstable_now();
        Q = a;
        var b = true;
        try {
          b = O(true, a);
        } finally {
          b ? S() : (N = false, O = null);
        }
      } else N = false;
    }
    var S;
    if ("function" === typeof F) S = function() {
      F(R);
    };
    else if ("undefined" !== typeof MessageChannel) {
      var T = new MessageChannel(), U = T.port2;
      T.port1.onmessage = R;
      S = function() {
        U.postMessage(null);
      };
    } else S = function() {
      D(R, 0);
    };
    function I(a) {
      O = a;
      N || (N = true, S());
    }
    function K(a, b) {
      L = D(function() {
        a(exports$1.unstable_now());
      }, b);
    }
    exports$1.unstable_IdlePriority = 5;
    exports$1.unstable_ImmediatePriority = 1;
    exports$1.unstable_LowPriority = 4;
    exports$1.unstable_NormalPriority = 3;
    exports$1.unstable_Profiling = null;
    exports$1.unstable_UserBlockingPriority = 2;
    exports$1.unstable_cancelCallback = function(a) {
      a.callback = null;
    };
    exports$1.unstable_continueExecution = function() {
      A2 || z || (A2 = true, I(J));
    };
    exports$1.unstable_forceFrameRate = function(a) {
      0 > a || 125 < a ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : P = 0 < a ? Math.floor(1e3 / a) : 5;
    };
    exports$1.unstable_getCurrentPriorityLevel = function() {
      return y;
    };
    exports$1.unstable_getFirstCallbackNode = function() {
      return h(r);
    };
    exports$1.unstable_next = function(a) {
      switch (y) {
        case 1:
        case 2:
        case 3:
          var b = 3;
          break;
        default:
          b = y;
      }
      var c = y;
      y = b;
      try {
        return a();
      } finally {
        y = c;
      }
    };
    exports$1.unstable_pauseExecution = function() {
    };
    exports$1.unstable_requestPaint = function() {
    };
    exports$1.unstable_runWithPriority = function(a, b) {
      switch (a) {
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          break;
        default:
          a = 3;
      }
      var c = y;
      y = a;
      try {
        return b();
      } finally {
        y = c;
      }
    };
    exports$1.unstable_scheduleCallback = function(a, b, c) {
      var d = exports$1.unstable_now();
      "object" === typeof c && null !== c ? (c = c.delay, c = "number" === typeof c && 0 < c ? d + c : d) : c = d;
      switch (a) {
        case 1:
          var e = -1;
          break;
        case 2:
          e = 250;
          break;
        case 5:
          e = 1073741823;
          break;
        case 4:
          e = 1e4;
          break;
        default:
          e = 5e3;
      }
      e = c + e;
      a = { id: u++, callback: b, priorityLevel: a, startTime: c, expirationTime: e, sortIndex: -1 };
      c > d ? (a.sortIndex = c, f(t2, a), null === h(r) && a === h(t2) && (B ? (E(L), L = -1) : B = true, K(H, c - d))) : (a.sortIndex = e, f(r, a), A2 || z || (A2 = true, I(J)));
      return a;
    };
    exports$1.unstable_shouldYield = M;
    exports$1.unstable_wrapCallback = function(a) {
      var b = y;
      return function() {
        var c = y;
        y = b;
        try {
          return a.apply(this, arguments);
        } finally {
          y = c;
        }
      };
    };
  })(scheduler_production_min);
  return scheduler_production_min;
}
var hasRequiredScheduler;
function requireScheduler() {
  if (hasRequiredScheduler) return scheduler.exports;
  hasRequiredScheduler = 1;
  {
    scheduler.exports = requireScheduler_production_min();
  }
  return scheduler.exports;
}
var hasRequiredReactDom_production_min;
function requireReactDom_production_min() {
  if (hasRequiredReactDom_production_min) return reactDom_production_min;
  hasRequiredReactDom_production_min = 1;
  var aa = requireReact(), ca = requireScheduler();
  function p(a) {
    for (var b = "https://reactjs.org/docs/error-decoder.html?invariant=" + a, c = 1; c < arguments.length; c++) b += "&args[]=" + encodeURIComponent(arguments[c]);
    return "Minified React error #" + a + "; visit " + b + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
  }
  var da = /* @__PURE__ */ new Set(), ea = {};
  function fa(a, b) {
    ha(a, b);
    ha(a + "Capture", b);
  }
  function ha(a, b) {
    ea[a] = b;
    for (a = 0; a < b.length; a++) da.add(b[a]);
  }
  var ia = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), ja = Object.prototype.hasOwnProperty, ka = /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/, la = {}, ma = {};
  function oa(a) {
    if (ja.call(ma, a)) return true;
    if (ja.call(la, a)) return false;
    if (ka.test(a)) return ma[a] = true;
    la[a] = true;
    return false;
  }
  function pa(a, b, c, d) {
    if (null !== c && 0 === c.type) return false;
    switch (typeof b) {
      case "function":
      case "symbol":
        return true;
      case "boolean":
        if (d) return false;
        if (null !== c) return !c.acceptsBooleans;
        a = a.toLowerCase().slice(0, 5);
        return "data-" !== a && "aria-" !== a;
      default:
        return false;
    }
  }
  function qa(a, b, c, d) {
    if (null === b || "undefined" === typeof b || pa(a, b, c, d)) return true;
    if (d) return false;
    if (null !== c) switch (c.type) {
      case 3:
        return !b;
      case 4:
        return false === b;
      case 5:
        return isNaN(b);
      case 6:
        return isNaN(b) || 1 > b;
    }
    return false;
  }
  function v(a, b, c, d, e, f, g) {
    this.acceptsBooleans = 2 === b || 3 === b || 4 === b;
    this.attributeName = d;
    this.attributeNamespace = e;
    this.mustUseProperty = c;
    this.propertyName = a;
    this.type = b;
    this.sanitizeURL = f;
    this.removeEmptyString = g;
  }
  var z = {};
  "children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a) {
    z[a] = new v(a, 0, false, a, null, false, false);
  });
  [["acceptCharset", "accept-charset"], ["className", "class"], ["htmlFor", "for"], ["httpEquiv", "http-equiv"]].forEach(function(a) {
    var b = a[0];
    z[b] = new v(b, 1, false, a[1], null, false, false);
  });
  ["contentEditable", "draggable", "spellCheck", "value"].forEach(function(a) {
    z[a] = new v(a, 2, false, a.toLowerCase(), null, false, false);
  });
  ["autoReverse", "externalResourcesRequired", "focusable", "preserveAlpha"].forEach(function(a) {
    z[a] = new v(a, 2, false, a, null, false, false);
  });
  "allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a) {
    z[a] = new v(a, 3, false, a.toLowerCase(), null, false, false);
  });
  ["checked", "multiple", "muted", "selected"].forEach(function(a) {
    z[a] = new v(a, 3, true, a, null, false, false);
  });
  ["capture", "download"].forEach(function(a) {
    z[a] = new v(a, 4, false, a, null, false, false);
  });
  ["cols", "rows", "size", "span"].forEach(function(a) {
    z[a] = new v(a, 6, false, a, null, false, false);
  });
  ["rowSpan", "start"].forEach(function(a) {
    z[a] = new v(a, 5, false, a.toLowerCase(), null, false, false);
  });
  var ra = /[\-:]([a-z])/g;
  function sa(a) {
    return a[1].toUpperCase();
  }
  "accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a) {
    var b = a.replace(
      ra,
      sa
    );
    z[b] = new v(b, 1, false, a, null, false, false);
  });
  "xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a) {
    var b = a.replace(ra, sa);
    z[b] = new v(b, 1, false, a, "http://www.w3.org/1999/xlink", false, false);
  });
  ["xml:base", "xml:lang", "xml:space"].forEach(function(a) {
    var b = a.replace(ra, sa);
    z[b] = new v(b, 1, false, a, "http://www.w3.org/XML/1998/namespace", false, false);
  });
  ["tabIndex", "crossOrigin"].forEach(function(a) {
    z[a] = new v(a, 1, false, a.toLowerCase(), null, false, false);
  });
  z.xlinkHref = new v("xlinkHref", 1, false, "xlink:href", "http://www.w3.org/1999/xlink", true, false);
  ["src", "href", "action", "formAction"].forEach(function(a) {
    z[a] = new v(a, 1, false, a.toLowerCase(), null, true, true);
  });
  function ta(a, b, c, d) {
    var e = z.hasOwnProperty(b) ? z[b] : null;
    if (null !== e ? 0 !== e.type : d || !(2 < b.length) || "o" !== b[0] && "O" !== b[0] || "n" !== b[1] && "N" !== b[1]) qa(b, c, e, d) && (c = null), d || null === e ? oa(b) && (null === c ? a.removeAttribute(b) : a.setAttribute(b, "" + c)) : e.mustUseProperty ? a[e.propertyName] = null === c ? 3 === e.type ? false : "" : c : (b = e.attributeName, d = e.attributeNamespace, null === c ? a.removeAttribute(b) : (e = e.type, c = 3 === e || 4 === e && true === c ? "" : "" + c, d ? a.setAttributeNS(d, b, c) : a.setAttribute(b, c)));
  }
  var ua = aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED, va = Symbol.for("react.element"), wa = Symbol.for("react.portal"), ya = Symbol.for("react.fragment"), za = Symbol.for("react.strict_mode"), Aa = Symbol.for("react.profiler"), Ba = Symbol.for("react.provider"), Ca = Symbol.for("react.context"), Da = Symbol.for("react.forward_ref"), Ea = Symbol.for("react.suspense"), Fa = Symbol.for("react.suspense_list"), Ga = Symbol.for("react.memo"), Ha = Symbol.for("react.lazy");
  var Ia = Symbol.for("react.offscreen");
  var Ja = Symbol.iterator;
  function Ka(a) {
    if (null === a || "object" !== typeof a) return null;
    a = Ja && a[Ja] || a["@@iterator"];
    return "function" === typeof a ? a : null;
  }
  var A2 = Object.assign, La;
  function Ma(a) {
    if (void 0 === La) try {
      throw Error();
    } catch (c) {
      var b = c.stack.trim().match(/\n( *(at )?)/);
      La = b && b[1] || "";
    }
    return "\n" + La + a;
  }
  var Na = false;
  function Oa(a, b) {
    if (!a || Na) return "";
    Na = true;
    var c = Error.prepareStackTrace;
    Error.prepareStackTrace = void 0;
    try {
      if (b) if (b = function() {
        throw Error();
      }, Object.defineProperty(b.prototype, "props", { set: function() {
        throw Error();
      } }), "object" === typeof Reflect && Reflect.construct) {
        try {
          Reflect.construct(b, []);
        } catch (l) {
          var d = l;
        }
        Reflect.construct(a, [], b);
      } else {
        try {
          b.call();
        } catch (l) {
          d = l;
        }
        a.call(b.prototype);
      }
      else {
        try {
          throw Error();
        } catch (l) {
          d = l;
        }
        a();
      }
    } catch (l) {
      if (l && d && "string" === typeof l.stack) {
        for (var e = l.stack.split("\n"), f = d.stack.split("\n"), g = e.length - 1, h = f.length - 1; 1 <= g && 0 <= h && e[g] !== f[h]; ) h--;
        for (; 1 <= g && 0 <= h; g--, h--) if (e[g] !== f[h]) {
          if (1 !== g || 1 !== h) {
            do
              if (g--, h--, 0 > h || e[g] !== f[h]) {
                var k = "\n" + e[g].replace(" at new ", " at ");
                a.displayName && k.includes("<anonymous>") && (k = k.replace("<anonymous>", a.displayName));
                return k;
              }
            while (1 <= g && 0 <= h);
          }
          break;
        }
      }
    } finally {
      Na = false, Error.prepareStackTrace = c;
    }
    return (a = a ? a.displayName || a.name : "") ? Ma(a) : "";
  }
  function Pa(a) {
    switch (a.tag) {
      case 5:
        return Ma(a.type);
      case 16:
        return Ma("Lazy");
      case 13:
        return Ma("Suspense");
      case 19:
        return Ma("SuspenseList");
      case 0:
      case 2:
      case 15:
        return a = Oa(a.type, false), a;
      case 11:
        return a = Oa(a.type.render, false), a;
      case 1:
        return a = Oa(a.type, true), a;
      default:
        return "";
    }
  }
  function Qa(a) {
    if (null == a) return null;
    if ("function" === typeof a) return a.displayName || a.name || null;
    if ("string" === typeof a) return a;
    switch (a) {
      case ya:
        return "Fragment";
      case wa:
        return "Portal";
      case Aa:
        return "Profiler";
      case za:
        return "StrictMode";
      case Ea:
        return "Suspense";
      case Fa:
        return "SuspenseList";
    }
    if ("object" === typeof a) switch (a.$$typeof) {
      case Ca:
        return (a.displayName || "Context") + ".Consumer";
      case Ba:
        return (a._context.displayName || "Context") + ".Provider";
      case Da:
        var b = a.render;
        a = a.displayName;
        a || (a = b.displayName || b.name || "", a = "" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
        return a;
      case Ga:
        return b = a.displayName || null, null !== b ? b : Qa(a.type) || "Memo";
      case Ha:
        b = a._payload;
        a = a._init;
        try {
          return Qa(a(b));
        } catch (c) {
        }
    }
    return null;
  }
  function Ra(a) {
    var b = a.type;
    switch (a.tag) {
      case 24:
        return "Cache";
      case 9:
        return (b.displayName || "Context") + ".Consumer";
      case 10:
        return (b._context.displayName || "Context") + ".Provider";
      case 18:
        return "DehydratedFragment";
      case 11:
        return a = b.render, a = a.displayName || a.name || "", b.displayName || ("" !== a ? "ForwardRef(" + a + ")" : "ForwardRef");
      case 7:
        return "Fragment";
      case 5:
        return b;
      case 4:
        return "Portal";
      case 3:
        return "Root";
      case 6:
        return "Text";
      case 16:
        return Qa(b);
      case 8:
        return b === za ? "StrictMode" : "Mode";
      case 22:
        return "Offscreen";
      case 12:
        return "Profiler";
      case 21:
        return "Scope";
      case 13:
        return "Suspense";
      case 19:
        return "SuspenseList";
      case 25:
        return "TracingMarker";
      case 1:
      case 0:
      case 17:
      case 2:
      case 14:
      case 15:
        if ("function" === typeof b) return b.displayName || b.name || null;
        if ("string" === typeof b) return b;
    }
    return null;
  }
  function Sa(a) {
    switch (typeof a) {
      case "boolean":
      case "number":
      case "string":
      case "undefined":
        return a;
      case "object":
        return a;
      default:
        return "";
    }
  }
  function Ta(a) {
    var b = a.type;
    return (a = a.nodeName) && "input" === a.toLowerCase() && ("checkbox" === b || "radio" === b);
  }
  function Ua(a) {
    var b = Ta(a) ? "checked" : "value", c = Object.getOwnPropertyDescriptor(a.constructor.prototype, b), d = "" + a[b];
    if (!a.hasOwnProperty(b) && "undefined" !== typeof c && "function" === typeof c.get && "function" === typeof c.set) {
      var e = c.get, f = c.set;
      Object.defineProperty(a, b, { configurable: true, get: function() {
        return e.call(this);
      }, set: function(a2) {
        d = "" + a2;
        f.call(this, a2);
      } });
      Object.defineProperty(a, b, { enumerable: c.enumerable });
      return { getValue: function() {
        return d;
      }, setValue: function(a2) {
        d = "" + a2;
      }, stopTracking: function() {
        a._valueTracker = null;
        delete a[b];
      } };
    }
  }
  function Va(a) {
    a._valueTracker || (a._valueTracker = Ua(a));
  }
  function Wa(a) {
    if (!a) return false;
    var b = a._valueTracker;
    if (!b) return true;
    var c = b.getValue();
    var d = "";
    a && (d = Ta(a) ? a.checked ? "true" : "false" : a.value);
    a = d;
    return a !== c ? (b.setValue(a), true) : false;
  }
  function Xa(a) {
    a = a || ("undefined" !== typeof document ? document : void 0);
    if ("undefined" === typeof a) return null;
    try {
      return a.activeElement || a.body;
    } catch (b) {
      return a.body;
    }
  }
  function Ya(a, b) {
    var c = b.checked;
    return A2({}, b, { defaultChecked: void 0, defaultValue: void 0, value: void 0, checked: null != c ? c : a._wrapperState.initialChecked });
  }
  function Za(a, b) {
    var c = null == b.defaultValue ? "" : b.defaultValue, d = null != b.checked ? b.checked : b.defaultChecked;
    c = Sa(null != b.value ? b.value : c);
    a._wrapperState = { initialChecked: d, initialValue: c, controlled: "checkbox" === b.type || "radio" === b.type ? null != b.checked : null != b.value };
  }
  function ab(a, b) {
    b = b.checked;
    null != b && ta(a, "checked", b, false);
  }
  function bb(a, b) {
    ab(a, b);
    var c = Sa(b.value), d = b.type;
    if (null != c) if ("number" === d) {
      if (0 === c && "" === a.value || a.value != c) a.value = "" + c;
    } else a.value !== "" + c && (a.value = "" + c);
    else if ("submit" === d || "reset" === d) {
      a.removeAttribute("value");
      return;
    }
    b.hasOwnProperty("value") ? cb(a, b.type, c) : b.hasOwnProperty("defaultValue") && cb(a, b.type, Sa(b.defaultValue));
    null == b.checked && null != b.defaultChecked && (a.defaultChecked = !!b.defaultChecked);
  }
  function db(a, b, c) {
    if (b.hasOwnProperty("value") || b.hasOwnProperty("defaultValue")) {
      var d = b.type;
      if (!("submit" !== d && "reset" !== d || void 0 !== b.value && null !== b.value)) return;
      b = "" + a._wrapperState.initialValue;
      c || b === a.value || (a.value = b);
      a.defaultValue = b;
    }
    c = a.name;
    "" !== c && (a.name = "");
    a.defaultChecked = !!a._wrapperState.initialChecked;
    "" !== c && (a.name = c);
  }
  function cb(a, b, c) {
    if ("number" !== b || Xa(a.ownerDocument) !== a) null == c ? a.defaultValue = "" + a._wrapperState.initialValue : a.defaultValue !== "" + c && (a.defaultValue = "" + c);
  }
  var eb = Array.isArray;
  function fb(a, b, c, d) {
    a = a.options;
    if (b) {
      b = {};
      for (var e = 0; e < c.length; e++) b["$" + c[e]] = true;
      for (c = 0; c < a.length; c++) e = b.hasOwnProperty("$" + a[c].value), a[c].selected !== e && (a[c].selected = e), e && d && (a[c].defaultSelected = true);
    } else {
      c = "" + Sa(c);
      b = null;
      for (e = 0; e < a.length; e++) {
        if (a[e].value === c) {
          a[e].selected = true;
          d && (a[e].defaultSelected = true);
          return;
        }
        null !== b || a[e].disabled || (b = a[e]);
      }
      null !== b && (b.selected = true);
    }
  }
  function gb(a, b) {
    if (null != b.dangerouslySetInnerHTML) throw Error(p(91));
    return A2({}, b, { value: void 0, defaultValue: void 0, children: "" + a._wrapperState.initialValue });
  }
  function hb(a, b) {
    var c = b.value;
    if (null == c) {
      c = b.children;
      b = b.defaultValue;
      if (null != c) {
        if (null != b) throw Error(p(92));
        if (eb(c)) {
          if (1 < c.length) throw Error(p(93));
          c = c[0];
        }
        b = c;
      }
      null == b && (b = "");
      c = b;
    }
    a._wrapperState = { initialValue: Sa(c) };
  }
  function ib(a, b) {
    var c = Sa(b.value), d = Sa(b.defaultValue);
    null != c && (c = "" + c, c !== a.value && (a.value = c), null == b.defaultValue && a.defaultValue !== c && (a.defaultValue = c));
    null != d && (a.defaultValue = "" + d);
  }
  function jb(a) {
    var b = a.textContent;
    b === a._wrapperState.initialValue && "" !== b && null !== b && (a.value = b);
  }
  function kb(a) {
    switch (a) {
      case "svg":
        return "http://www.w3.org/2000/svg";
      case "math":
        return "http://www.w3.org/1998/Math/MathML";
      default:
        return "http://www.w3.org/1999/xhtml";
    }
  }
  function lb(a, b) {
    return null == a || "http://www.w3.org/1999/xhtml" === a ? kb(b) : "http://www.w3.org/2000/svg" === a && "foreignObject" === b ? "http://www.w3.org/1999/xhtml" : a;
  }
  var mb, nb = (function(a) {
    return "undefined" !== typeof MSApp && MSApp.execUnsafeLocalFunction ? function(b, c, d, e) {
      MSApp.execUnsafeLocalFunction(function() {
        return a(b, c, d, e);
      });
    } : a;
  })(function(a, b) {
    if ("http://www.w3.org/2000/svg" !== a.namespaceURI || "innerHTML" in a) a.innerHTML = b;
    else {
      mb = mb || document.createElement("div");
      mb.innerHTML = "<svg>" + b.valueOf().toString() + "</svg>";
      for (b = mb.firstChild; a.firstChild; ) a.removeChild(a.firstChild);
      for (; b.firstChild; ) a.appendChild(b.firstChild);
    }
  });
  function ob(a, b) {
    if (b) {
      var c = a.firstChild;
      if (c && c === a.lastChild && 3 === c.nodeType) {
        c.nodeValue = b;
        return;
      }
    }
    a.textContent = b;
  }
  var pb = {
    animationIterationCount: true,
    aspectRatio: true,
    borderImageOutset: true,
    borderImageSlice: true,
    borderImageWidth: true,
    boxFlex: true,
    boxFlexGroup: true,
    boxOrdinalGroup: true,
    columnCount: true,
    columns: true,
    flex: true,
    flexGrow: true,
    flexPositive: true,
    flexShrink: true,
    flexNegative: true,
    flexOrder: true,
    gridArea: true,
    gridRow: true,
    gridRowEnd: true,
    gridRowSpan: true,
    gridRowStart: true,
    gridColumn: true,
    gridColumnEnd: true,
    gridColumnSpan: true,
    gridColumnStart: true,
    fontWeight: true,
    lineClamp: true,
    lineHeight: true,
    opacity: true,
    order: true,
    orphans: true,
    tabSize: true,
    widows: true,
    zIndex: true,
    zoom: true,
    fillOpacity: true,
    floodOpacity: true,
    stopOpacity: true,
    strokeDasharray: true,
    strokeDashoffset: true,
    strokeMiterlimit: true,
    strokeOpacity: true,
    strokeWidth: true
  }, qb = ["Webkit", "ms", "Moz", "O"];
  Object.keys(pb).forEach(function(a) {
    qb.forEach(function(b) {
      b = b + a.charAt(0).toUpperCase() + a.substring(1);
      pb[b] = pb[a];
    });
  });
  function rb(a, b, c) {
    return null == b || "boolean" === typeof b || "" === b ? "" : c || "number" !== typeof b || 0 === b || pb.hasOwnProperty(a) && pb[a] ? ("" + b).trim() : b + "px";
  }
  function sb(a, b) {
    a = a.style;
    for (var c in b) if (b.hasOwnProperty(c)) {
      var d = 0 === c.indexOf("--"), e = rb(c, b[c], d);
      "float" === c && (c = "cssFloat");
      d ? a.setProperty(c, e) : a[c] = e;
    }
  }
  var tb = A2({ menuitem: true }, { area: true, base: true, br: true, col: true, embed: true, hr: true, img: true, input: true, keygen: true, link: true, meta: true, param: true, source: true, track: true, wbr: true });
  function ub(a, b) {
    if (b) {
      if (tb[a] && (null != b.children || null != b.dangerouslySetInnerHTML)) throw Error(p(137, a));
      if (null != b.dangerouslySetInnerHTML) {
        if (null != b.children) throw Error(p(60));
        if ("object" !== typeof b.dangerouslySetInnerHTML || !("__html" in b.dangerouslySetInnerHTML)) throw Error(p(61));
      }
      if (null != b.style && "object" !== typeof b.style) throw Error(p(62));
    }
  }
  function vb(a, b) {
    if (-1 === a.indexOf("-")) return "string" === typeof b.is;
    switch (a) {
      case "annotation-xml":
      case "color-profile":
      case "font-face":
      case "font-face-src":
      case "font-face-uri":
      case "font-face-format":
      case "font-face-name":
      case "missing-glyph":
        return false;
      default:
        return true;
    }
  }
  var wb = null;
  function xb(a) {
    a = a.target || a.srcElement || window;
    a.correspondingUseElement && (a = a.correspondingUseElement);
    return 3 === a.nodeType ? a.parentNode : a;
  }
  var yb = null, zb = null, Ab = null;
  function Bb(a) {
    if (a = Cb(a)) {
      if ("function" !== typeof yb) throw Error(p(280));
      var b = a.stateNode;
      b && (b = Db(b), yb(a.stateNode, a.type, b));
    }
  }
  function Eb(a) {
    zb ? Ab ? Ab.push(a) : Ab = [a] : zb = a;
  }
  function Fb() {
    if (zb) {
      var a = zb, b = Ab;
      Ab = zb = null;
      Bb(a);
      if (b) for (a = 0; a < b.length; a++) Bb(b[a]);
    }
  }
  function Gb(a, b) {
    return a(b);
  }
  function Hb() {
  }
  var Ib = false;
  function Jb(a, b, c) {
    if (Ib) return a(b, c);
    Ib = true;
    try {
      return Gb(a, b, c);
    } finally {
      if (Ib = false, null !== zb || null !== Ab) Hb(), Fb();
    }
  }
  function Kb(a, b) {
    var c = a.stateNode;
    if (null === c) return null;
    var d = Db(c);
    if (null === d) return null;
    c = d[b];
    a: switch (b) {
      case "onClick":
      case "onClickCapture":
      case "onDoubleClick":
      case "onDoubleClickCapture":
      case "onMouseDown":
      case "onMouseDownCapture":
      case "onMouseMove":
      case "onMouseMoveCapture":
      case "onMouseUp":
      case "onMouseUpCapture":
      case "onMouseEnter":
        (d = !d.disabled) || (a = a.type, d = !("button" === a || "input" === a || "select" === a || "textarea" === a));
        a = !d;
        break a;
      default:
        a = false;
    }
    if (a) return null;
    if (c && "function" !== typeof c) throw Error(p(231, b, typeof c));
    return c;
  }
  var Lb = false;
  if (ia) try {
    var Mb = {};
    Object.defineProperty(Mb, "passive", { get: function() {
      Lb = true;
    } });
    window.addEventListener("test", Mb, Mb);
    window.removeEventListener("test", Mb, Mb);
  } catch (a) {
    Lb = false;
  }
  function Nb(a, b, c, d, e, f, g, h, k) {
    var l = Array.prototype.slice.call(arguments, 3);
    try {
      b.apply(c, l);
    } catch (m) {
      this.onError(m);
    }
  }
  var Ob = false, Pb = null, Qb = false, Rb = null, Sb = { onError: function(a) {
    Ob = true;
    Pb = a;
  } };
  function Tb(a, b, c, d, e, f, g, h, k) {
    Ob = false;
    Pb = null;
    Nb.apply(Sb, arguments);
  }
  function Ub(a, b, c, d, e, f, g, h, k) {
    Tb.apply(this, arguments);
    if (Ob) {
      if (Ob) {
        var l = Pb;
        Ob = false;
        Pb = null;
      } else throw Error(p(198));
      Qb || (Qb = true, Rb = l);
    }
  }
  function Vb(a) {
    var b = a, c = a;
    if (a.alternate) for (; b.return; ) b = b.return;
    else {
      a = b;
      do
        b = a, 0 !== (b.flags & 4098) && (c = b.return), a = b.return;
      while (a);
    }
    return 3 === b.tag ? c : null;
  }
  function Wb(a) {
    if (13 === a.tag) {
      var b = a.memoizedState;
      null === b && (a = a.alternate, null !== a && (b = a.memoizedState));
      if (null !== b) return b.dehydrated;
    }
    return null;
  }
  function Xb(a) {
    if (Vb(a) !== a) throw Error(p(188));
  }
  function Yb(a) {
    var b = a.alternate;
    if (!b) {
      b = Vb(a);
      if (null === b) throw Error(p(188));
      return b !== a ? null : a;
    }
    for (var c = a, d = b; ; ) {
      var e = c.return;
      if (null === e) break;
      var f = e.alternate;
      if (null === f) {
        d = e.return;
        if (null !== d) {
          c = d;
          continue;
        }
        break;
      }
      if (e.child === f.child) {
        for (f = e.child; f; ) {
          if (f === c) return Xb(e), a;
          if (f === d) return Xb(e), b;
          f = f.sibling;
        }
        throw Error(p(188));
      }
      if (c.return !== d.return) c = e, d = f;
      else {
        for (var g = false, h = e.child; h; ) {
          if (h === c) {
            g = true;
            c = e;
            d = f;
            break;
          }
          if (h === d) {
            g = true;
            d = e;
            c = f;
            break;
          }
          h = h.sibling;
        }
        if (!g) {
          for (h = f.child; h; ) {
            if (h === c) {
              g = true;
              c = f;
              d = e;
              break;
            }
            if (h === d) {
              g = true;
              d = f;
              c = e;
              break;
            }
            h = h.sibling;
          }
          if (!g) throw Error(p(189));
        }
      }
      if (c.alternate !== d) throw Error(p(190));
    }
    if (3 !== c.tag) throw Error(p(188));
    return c.stateNode.current === c ? a : b;
  }
  function Zb(a) {
    a = Yb(a);
    return null !== a ? $b(a) : null;
  }
  function $b(a) {
    if (5 === a.tag || 6 === a.tag) return a;
    for (a = a.child; null !== a; ) {
      var b = $b(a);
      if (null !== b) return b;
      a = a.sibling;
    }
    return null;
  }
  var ac = ca.unstable_scheduleCallback, bc = ca.unstable_cancelCallback, cc = ca.unstable_shouldYield, dc = ca.unstable_requestPaint, B = ca.unstable_now, ec = ca.unstable_getCurrentPriorityLevel, fc = ca.unstable_ImmediatePriority, gc = ca.unstable_UserBlockingPriority, hc = ca.unstable_NormalPriority, ic = ca.unstable_LowPriority, jc = ca.unstable_IdlePriority, kc = null, lc = null;
  function mc(a) {
    if (lc && "function" === typeof lc.onCommitFiberRoot) try {
      lc.onCommitFiberRoot(kc, a, void 0, 128 === (a.current.flags & 128));
    } catch (b) {
    }
  }
  var oc = Math.clz32 ? Math.clz32 : nc, pc = Math.log, qc = Math.LN2;
  function nc(a) {
    a >>>= 0;
    return 0 === a ? 32 : 31 - (pc(a) / qc | 0) | 0;
  }
  var rc = 64, sc = 4194304;
  function tc(a) {
    switch (a & -a) {
      case 1:
        return 1;
      case 2:
        return 2;
      case 4:
        return 4;
      case 8:
        return 8;
      case 16:
        return 16;
      case 32:
        return 32;
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return a & 4194240;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return a & 130023424;
      case 134217728:
        return 134217728;
      case 268435456:
        return 268435456;
      case 536870912:
        return 536870912;
      case 1073741824:
        return 1073741824;
      default:
        return a;
    }
  }
  function uc(a, b) {
    var c = a.pendingLanes;
    if (0 === c) return 0;
    var d = 0, e = a.suspendedLanes, f = a.pingedLanes, g = c & 268435455;
    if (0 !== g) {
      var h = g & ~e;
      0 !== h ? d = tc(h) : (f &= g, 0 !== f && (d = tc(f)));
    } else g = c & ~e, 0 !== g ? d = tc(g) : 0 !== f && (d = tc(f));
    if (0 === d) return 0;
    if (0 !== b && b !== d && 0 === (b & e) && (e = d & -d, f = b & -b, e >= f || 16 === e && 0 !== (f & 4194240))) return b;
    0 !== (d & 4) && (d |= c & 16);
    b = a.entangledLanes;
    if (0 !== b) for (a = a.entanglements, b &= d; 0 < b; ) c = 31 - oc(b), e = 1 << c, d |= a[c], b &= ~e;
    return d;
  }
  function vc(a, b) {
    switch (a) {
      case 1:
      case 2:
      case 4:
        return b + 250;
      case 8:
      case 16:
      case 32:
      case 64:
      case 128:
      case 256:
      case 512:
      case 1024:
      case 2048:
      case 4096:
      case 8192:
      case 16384:
      case 32768:
      case 65536:
      case 131072:
      case 262144:
      case 524288:
      case 1048576:
      case 2097152:
        return b + 5e3;
      case 4194304:
      case 8388608:
      case 16777216:
      case 33554432:
      case 67108864:
        return -1;
      case 134217728:
      case 268435456:
      case 536870912:
      case 1073741824:
        return -1;
      default:
        return -1;
    }
  }
  function wc(a, b) {
    for (var c = a.suspendedLanes, d = a.pingedLanes, e = a.expirationTimes, f = a.pendingLanes; 0 < f; ) {
      var g = 31 - oc(f), h = 1 << g, k = e[g];
      if (-1 === k) {
        if (0 === (h & c) || 0 !== (h & d)) e[g] = vc(h, b);
      } else k <= b && (a.expiredLanes |= h);
      f &= ~h;
    }
  }
  function xc(a) {
    a = a.pendingLanes & -1073741825;
    return 0 !== a ? a : a & 1073741824 ? 1073741824 : 0;
  }
  function yc() {
    var a = rc;
    rc <<= 1;
    0 === (rc & 4194240) && (rc = 64);
    return a;
  }
  function zc(a) {
    for (var b = [], c = 0; 31 > c; c++) b.push(a);
    return b;
  }
  function Ac(a, b, c) {
    a.pendingLanes |= b;
    536870912 !== b && (a.suspendedLanes = 0, a.pingedLanes = 0);
    a = a.eventTimes;
    b = 31 - oc(b);
    a[b] = c;
  }
  function Bc(a, b) {
    var c = a.pendingLanes & ~b;
    a.pendingLanes = b;
    a.suspendedLanes = 0;
    a.pingedLanes = 0;
    a.expiredLanes &= b;
    a.mutableReadLanes &= b;
    a.entangledLanes &= b;
    b = a.entanglements;
    var d = a.eventTimes;
    for (a = a.expirationTimes; 0 < c; ) {
      var e = 31 - oc(c), f = 1 << e;
      b[e] = 0;
      d[e] = -1;
      a[e] = -1;
      c &= ~f;
    }
  }
  function Cc(a, b) {
    var c = a.entangledLanes |= b;
    for (a = a.entanglements; c; ) {
      var d = 31 - oc(c), e = 1 << d;
      e & b | a[d] & b && (a[d] |= b);
      c &= ~e;
    }
  }
  var C = 0;
  function Dc(a) {
    a &= -a;
    return 1 < a ? 4 < a ? 0 !== (a & 268435455) ? 16 : 536870912 : 4 : 1;
  }
  var Ec, Fc, Gc, Hc, Ic, Jc = false, Kc = [], Lc = null, Mc = null, Nc = null, Oc = /* @__PURE__ */ new Map(), Pc = /* @__PURE__ */ new Map(), Qc = [], Rc = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
  function Sc(a, b) {
    switch (a) {
      case "focusin":
      case "focusout":
        Lc = null;
        break;
      case "dragenter":
      case "dragleave":
        Mc = null;
        break;
      case "mouseover":
      case "mouseout":
        Nc = null;
        break;
      case "pointerover":
      case "pointerout":
        Oc.delete(b.pointerId);
        break;
      case "gotpointercapture":
      case "lostpointercapture":
        Pc.delete(b.pointerId);
    }
  }
  function Tc(a, b, c, d, e, f) {
    if (null === a || a.nativeEvent !== f) return a = { blockedOn: b, domEventName: c, eventSystemFlags: d, nativeEvent: f, targetContainers: [e] }, null !== b && (b = Cb(b), null !== b && Fc(b)), a;
    a.eventSystemFlags |= d;
    b = a.targetContainers;
    null !== e && -1 === b.indexOf(e) && b.push(e);
    return a;
  }
  function Uc(a, b, c, d, e) {
    switch (b) {
      case "focusin":
        return Lc = Tc(Lc, a, b, c, d, e), true;
      case "dragenter":
        return Mc = Tc(Mc, a, b, c, d, e), true;
      case "mouseover":
        return Nc = Tc(Nc, a, b, c, d, e), true;
      case "pointerover":
        var f = e.pointerId;
        Oc.set(f, Tc(Oc.get(f) || null, a, b, c, d, e));
        return true;
      case "gotpointercapture":
        return f = e.pointerId, Pc.set(f, Tc(Pc.get(f) || null, a, b, c, d, e)), true;
    }
    return false;
  }
  function Vc(a) {
    var b = Wc(a.target);
    if (null !== b) {
      var c = Vb(b);
      if (null !== c) {
        if (b = c.tag, 13 === b) {
          if (b = Wb(c), null !== b) {
            a.blockedOn = b;
            Ic(a.priority, function() {
              Gc(c);
            });
            return;
          }
        } else if (3 === b && c.stateNode.current.memoizedState.isDehydrated) {
          a.blockedOn = 3 === c.tag ? c.stateNode.containerInfo : null;
          return;
        }
      }
    }
    a.blockedOn = null;
  }
  function Xc(a) {
    if (null !== a.blockedOn) return false;
    for (var b = a.targetContainers; 0 < b.length; ) {
      var c = Yc(a.domEventName, a.eventSystemFlags, b[0], a.nativeEvent);
      if (null === c) {
        c = a.nativeEvent;
        var d = new c.constructor(c.type, c);
        wb = d;
        c.target.dispatchEvent(d);
        wb = null;
      } else return b = Cb(c), null !== b && Fc(b), a.blockedOn = c, false;
      b.shift();
    }
    return true;
  }
  function Zc(a, b, c) {
    Xc(a) && c.delete(b);
  }
  function $c() {
    Jc = false;
    null !== Lc && Xc(Lc) && (Lc = null);
    null !== Mc && Xc(Mc) && (Mc = null);
    null !== Nc && Xc(Nc) && (Nc = null);
    Oc.forEach(Zc);
    Pc.forEach(Zc);
  }
  function ad(a, b) {
    a.blockedOn === b && (a.blockedOn = null, Jc || (Jc = true, ca.unstable_scheduleCallback(ca.unstable_NormalPriority, $c)));
  }
  function bd(a) {
    function b(b2) {
      return ad(b2, a);
    }
    if (0 < Kc.length) {
      ad(Kc[0], a);
      for (var c = 1; c < Kc.length; c++) {
        var d = Kc[c];
        d.blockedOn === a && (d.blockedOn = null);
      }
    }
    null !== Lc && ad(Lc, a);
    null !== Mc && ad(Mc, a);
    null !== Nc && ad(Nc, a);
    Oc.forEach(b);
    Pc.forEach(b);
    for (c = 0; c < Qc.length; c++) d = Qc[c], d.blockedOn === a && (d.blockedOn = null);
    for (; 0 < Qc.length && (c = Qc[0], null === c.blockedOn); ) Vc(c), null === c.blockedOn && Qc.shift();
  }
  var cd = ua.ReactCurrentBatchConfig, dd = true;
  function ed(a, b, c, d) {
    var e = C, f = cd.transition;
    cd.transition = null;
    try {
      C = 1, fd(a, b, c, d);
    } finally {
      C = e, cd.transition = f;
    }
  }
  function gd(a, b, c, d) {
    var e = C, f = cd.transition;
    cd.transition = null;
    try {
      C = 4, fd(a, b, c, d);
    } finally {
      C = e, cd.transition = f;
    }
  }
  function fd(a, b, c, d) {
    if (dd) {
      var e = Yc(a, b, c, d);
      if (null === e) hd(a, b, d, id2, c), Sc(a, d);
      else if (Uc(e, a, b, c, d)) d.stopPropagation();
      else if (Sc(a, d), b & 4 && -1 < Rc.indexOf(a)) {
        for (; null !== e; ) {
          var f = Cb(e);
          null !== f && Ec(f);
          f = Yc(a, b, c, d);
          null === f && hd(a, b, d, id2, c);
          if (f === e) break;
          e = f;
        }
        null !== e && d.stopPropagation();
      } else hd(a, b, d, null, c);
    }
  }
  var id2 = null;
  function Yc(a, b, c, d) {
    id2 = null;
    a = xb(d);
    a = Wc(a);
    if (null !== a) if (b = Vb(a), null === b) a = null;
    else if (c = b.tag, 13 === c) {
      a = Wb(b);
      if (null !== a) return a;
      a = null;
    } else if (3 === c) {
      if (b.stateNode.current.memoizedState.isDehydrated) return 3 === b.tag ? b.stateNode.containerInfo : null;
      a = null;
    } else b !== a && (a = null);
    id2 = a;
    return null;
  }
  function jd(a) {
    switch (a) {
      case "cancel":
      case "click":
      case "close":
      case "contextmenu":
      case "copy":
      case "cut":
      case "auxclick":
      case "dblclick":
      case "dragend":
      case "dragstart":
      case "drop":
      case "focusin":
      case "focusout":
      case "input":
      case "invalid":
      case "keydown":
      case "keypress":
      case "keyup":
      case "mousedown":
      case "mouseup":
      case "paste":
      case "pause":
      case "play":
      case "pointercancel":
      case "pointerdown":
      case "pointerup":
      case "ratechange":
      case "reset":
      case "resize":
      case "seeked":
      case "submit":
      case "touchcancel":
      case "touchend":
      case "touchstart":
      case "volumechange":
      case "change":
      case "selectionchange":
      case "textInput":
      case "compositionstart":
      case "compositionend":
      case "compositionupdate":
      case "beforeblur":
      case "afterblur":
      case "beforeinput":
      case "blur":
      case "fullscreenchange":
      case "focus":
      case "hashchange":
      case "popstate":
      case "select":
      case "selectstart":
        return 1;
      case "drag":
      case "dragenter":
      case "dragexit":
      case "dragleave":
      case "dragover":
      case "mousemove":
      case "mouseout":
      case "mouseover":
      case "pointermove":
      case "pointerout":
      case "pointerover":
      case "scroll":
      case "toggle":
      case "touchmove":
      case "wheel":
      case "mouseenter":
      case "mouseleave":
      case "pointerenter":
      case "pointerleave":
        return 4;
      case "message":
        switch (ec()) {
          case fc:
            return 1;
          case gc:
            return 4;
          case hc:
          case ic:
            return 16;
          case jc:
            return 536870912;
          default:
            return 16;
        }
      default:
        return 16;
    }
  }
  var kd = null, ld = null, md = null;
  function nd() {
    if (md) return md;
    var a, b = ld, c = b.length, d, e = "value" in kd ? kd.value : kd.textContent, f = e.length;
    for (a = 0; a < c && b[a] === e[a]; a++) ;
    var g = c - a;
    for (d = 1; d <= g && b[c - d] === e[f - d]; d++) ;
    return md = e.slice(a, 1 < d ? 1 - d : void 0);
  }
  function od(a) {
    var b = a.keyCode;
    "charCode" in a ? (a = a.charCode, 0 === a && 13 === b && (a = 13)) : a = b;
    10 === a && (a = 13);
    return 32 <= a || 13 === a ? a : 0;
  }
  function pd() {
    return true;
  }
  function qd() {
    return false;
  }
  function rd(a) {
    function b(b2, d, e, f, g) {
      this._reactName = b2;
      this._targetInst = e;
      this.type = d;
      this.nativeEvent = f;
      this.target = g;
      this.currentTarget = null;
      for (var c in a) a.hasOwnProperty(c) && (b2 = a[c], this[c] = b2 ? b2(f) : f[c]);
      this.isDefaultPrevented = (null != f.defaultPrevented ? f.defaultPrevented : false === f.returnValue) ? pd : qd;
      this.isPropagationStopped = qd;
      return this;
    }
    A2(b.prototype, { preventDefault: function() {
      this.defaultPrevented = true;
      var a2 = this.nativeEvent;
      a2 && (a2.preventDefault ? a2.preventDefault() : "unknown" !== typeof a2.returnValue && (a2.returnValue = false), this.isDefaultPrevented = pd);
    }, stopPropagation: function() {
      var a2 = this.nativeEvent;
      a2 && (a2.stopPropagation ? a2.stopPropagation() : "unknown" !== typeof a2.cancelBubble && (a2.cancelBubble = true), this.isPropagationStopped = pd);
    }, persist: function() {
    }, isPersistent: pd });
    return b;
  }
  var sd = { eventPhase: 0, bubbles: 0, cancelable: 0, timeStamp: function(a) {
    return a.timeStamp || Date.now();
  }, defaultPrevented: 0, isTrusted: 0 }, td = rd(sd), ud = A2({}, sd, { view: 0, detail: 0 }), vd = rd(ud), wd, xd, yd, Ad = A2({}, ud, { screenX: 0, screenY: 0, clientX: 0, clientY: 0, pageX: 0, pageY: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, getModifierState: zd, button: 0, buttons: 0, relatedTarget: function(a) {
    return void 0 === a.relatedTarget ? a.fromElement === a.srcElement ? a.toElement : a.fromElement : a.relatedTarget;
  }, movementX: function(a) {
    if ("movementX" in a) return a.movementX;
    a !== yd && (yd && "mousemove" === a.type ? (wd = a.screenX - yd.screenX, xd = a.screenY - yd.screenY) : xd = wd = 0, yd = a);
    return wd;
  }, movementY: function(a) {
    return "movementY" in a ? a.movementY : xd;
  } }), Bd = rd(Ad), Cd = A2({}, Ad, { dataTransfer: 0 }), Dd = rd(Cd), Ed = A2({}, ud, { relatedTarget: 0 }), Fd = rd(Ed), Gd = A2({}, sd, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }), Hd = rd(Gd), Id = A2({}, sd, { clipboardData: function(a) {
    return "clipboardData" in a ? a.clipboardData : window.clipboardData;
  } }), Jd = rd(Id), Kd = A2({}, sd, { data: 0 }), Ld = rd(Kd), Md = {
    Esc: "Escape",
    Spacebar: " ",
    Left: "ArrowLeft",
    Up: "ArrowUp",
    Right: "ArrowRight",
    Down: "ArrowDown",
    Del: "Delete",
    Win: "OS",
    Menu: "ContextMenu",
    Apps: "ContextMenu",
    Scroll: "ScrollLock",
    MozPrintableKey: "Unidentified"
  }, Nd = {
    8: "Backspace",
    9: "Tab",
    12: "Clear",
    13: "Enter",
    16: "Shift",
    17: "Control",
    18: "Alt",
    19: "Pause",
    20: "CapsLock",
    27: "Escape",
    32: " ",
    33: "PageUp",
    34: "PageDown",
    35: "End",
    36: "Home",
    37: "ArrowLeft",
    38: "ArrowUp",
    39: "ArrowRight",
    40: "ArrowDown",
    45: "Insert",
    46: "Delete",
    112: "F1",
    113: "F2",
    114: "F3",
    115: "F4",
    116: "F5",
    117: "F6",
    118: "F7",
    119: "F8",
    120: "F9",
    121: "F10",
    122: "F11",
    123: "F12",
    144: "NumLock",
    145: "ScrollLock",
    224: "Meta"
  }, Od = { Alt: "altKey", Control: "ctrlKey", Meta: "metaKey", Shift: "shiftKey" };
  function Pd(a) {
    var b = this.nativeEvent;
    return b.getModifierState ? b.getModifierState(a) : (a = Od[a]) ? !!b[a] : false;
  }
  function zd() {
    return Pd;
  }
  var Qd = A2({}, ud, { key: function(a) {
    if (a.key) {
      var b = Md[a.key] || a.key;
      if ("Unidentified" !== b) return b;
    }
    return "keypress" === a.type ? (a = od(a), 13 === a ? "Enter" : String.fromCharCode(a)) : "keydown" === a.type || "keyup" === a.type ? Nd[a.keyCode] || "Unidentified" : "";
  }, code: 0, location: 0, ctrlKey: 0, shiftKey: 0, altKey: 0, metaKey: 0, repeat: 0, locale: 0, getModifierState: zd, charCode: function(a) {
    return "keypress" === a.type ? od(a) : 0;
  }, keyCode: function(a) {
    return "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
  }, which: function(a) {
    return "keypress" === a.type ? od(a) : "keydown" === a.type || "keyup" === a.type ? a.keyCode : 0;
  } }), Rd = rd(Qd), Sd = A2({}, Ad, { pointerId: 0, width: 0, height: 0, pressure: 0, tangentialPressure: 0, tiltX: 0, tiltY: 0, twist: 0, pointerType: 0, isPrimary: 0 }), Td = rd(Sd), Ud = A2({}, ud, { touches: 0, targetTouches: 0, changedTouches: 0, altKey: 0, metaKey: 0, ctrlKey: 0, shiftKey: 0, getModifierState: zd }), Vd = rd(Ud), Wd = A2({}, sd, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }), Xd = rd(Wd), Yd = A2({}, Ad, {
    deltaX: function(a) {
      return "deltaX" in a ? a.deltaX : "wheelDeltaX" in a ? -a.wheelDeltaX : 0;
    },
    deltaY: function(a) {
      return "deltaY" in a ? a.deltaY : "wheelDeltaY" in a ? -a.wheelDeltaY : "wheelDelta" in a ? -a.wheelDelta : 0;
    },
    deltaZ: 0,
    deltaMode: 0
  }), Zd = rd(Yd), $d = [9, 13, 27, 32], ae = ia && "CompositionEvent" in window, be = null;
  ia && "documentMode" in document && (be = document.documentMode);
  var ce = ia && "TextEvent" in window && !be, de = ia && (!ae || be && 8 < be && 11 >= be), ee = String.fromCharCode(32), fe = false;
  function ge(a, b) {
    switch (a) {
      case "keyup":
        return -1 !== $d.indexOf(b.keyCode);
      case "keydown":
        return 229 !== b.keyCode;
      case "keypress":
      case "mousedown":
      case "focusout":
        return true;
      default:
        return false;
    }
  }
  function he(a) {
    a = a.detail;
    return "object" === typeof a && "data" in a ? a.data : null;
  }
  var ie = false;
  function je(a, b) {
    switch (a) {
      case "compositionend":
        return he(b);
      case "keypress":
        if (32 !== b.which) return null;
        fe = true;
        return ee;
      case "textInput":
        return a = b.data, a === ee && fe ? null : a;
      default:
        return null;
    }
  }
  function ke(a, b) {
    if (ie) return "compositionend" === a || !ae && ge(a, b) ? (a = nd(), md = ld = kd = null, ie = false, a) : null;
    switch (a) {
      case "paste":
        return null;
      case "keypress":
        if (!(b.ctrlKey || b.altKey || b.metaKey) || b.ctrlKey && b.altKey) {
          if (b.char && 1 < b.char.length) return b.char;
          if (b.which) return String.fromCharCode(b.which);
        }
        return null;
      case "compositionend":
        return de && "ko" !== b.locale ? null : b.data;
      default:
        return null;
    }
  }
  var le = { color: true, date: true, datetime: true, "datetime-local": true, email: true, month: true, number: true, password: true, range: true, search: true, tel: true, text: true, time: true, url: true, week: true };
  function me(a) {
    var b = a && a.nodeName && a.nodeName.toLowerCase();
    return "input" === b ? !!le[a.type] : "textarea" === b ? true : false;
  }
  function ne(a, b, c, d) {
    Eb(d);
    b = oe(b, "onChange");
    0 < b.length && (c = new td("onChange", "change", null, c, d), a.push({ event: c, listeners: b }));
  }
  var pe = null, qe = null;
  function re(a) {
    se(a, 0);
  }
  function te(a) {
    var b = ue(a);
    if (Wa(b)) return a;
  }
  function ve(a, b) {
    if ("change" === a) return b;
  }
  var we = false;
  if (ia) {
    var xe;
    if (ia) {
      var ye = "oninput" in document;
      if (!ye) {
        var ze = document.createElement("div");
        ze.setAttribute("oninput", "return;");
        ye = "function" === typeof ze.oninput;
      }
      xe = ye;
    } else xe = false;
    we = xe && (!document.documentMode || 9 < document.documentMode);
  }
  function Ae() {
    pe && (pe.detachEvent("onpropertychange", Be), qe = pe = null);
  }
  function Be(a) {
    if ("value" === a.propertyName && te(qe)) {
      var b = [];
      ne(b, qe, a, xb(a));
      Jb(re, b);
    }
  }
  function Ce(a, b, c) {
    "focusin" === a ? (Ae(), pe = b, qe = c, pe.attachEvent("onpropertychange", Be)) : "focusout" === a && Ae();
  }
  function De(a) {
    if ("selectionchange" === a || "keyup" === a || "keydown" === a) return te(qe);
  }
  function Ee(a, b) {
    if ("click" === a) return te(b);
  }
  function Fe(a, b) {
    if ("input" === a || "change" === a) return te(b);
  }
  function Ge(a, b) {
    return a === b && (0 !== a || 1 / a === 1 / b) || a !== a && b !== b;
  }
  var He = "function" === typeof Object.is ? Object.is : Ge;
  function Ie(a, b) {
    if (He(a, b)) return true;
    if ("object" !== typeof a || null === a || "object" !== typeof b || null === b) return false;
    var c = Object.keys(a), d = Object.keys(b);
    if (c.length !== d.length) return false;
    for (d = 0; d < c.length; d++) {
      var e = c[d];
      if (!ja.call(b, e) || !He(a[e], b[e])) return false;
    }
    return true;
  }
  function Je(a) {
    for (; a && a.firstChild; ) a = a.firstChild;
    return a;
  }
  function Ke(a, b) {
    var c = Je(a);
    a = 0;
    for (var d; c; ) {
      if (3 === c.nodeType) {
        d = a + c.textContent.length;
        if (a <= b && d >= b) return { node: c, offset: b - a };
        a = d;
      }
      a: {
        for (; c; ) {
          if (c.nextSibling) {
            c = c.nextSibling;
            break a;
          }
          c = c.parentNode;
        }
        c = void 0;
      }
      c = Je(c);
    }
  }
  function Le(a, b) {
    return a && b ? a === b ? true : a && 3 === a.nodeType ? false : b && 3 === b.nodeType ? Le(a, b.parentNode) : "contains" in a ? a.contains(b) : a.compareDocumentPosition ? !!(a.compareDocumentPosition(b) & 16) : false : false;
  }
  function Me() {
    for (var a = window, b = Xa(); b instanceof a.HTMLIFrameElement; ) {
      try {
        var c = "string" === typeof b.contentWindow.location.href;
      } catch (d) {
        c = false;
      }
      if (c) a = b.contentWindow;
      else break;
      b = Xa(a.document);
    }
    return b;
  }
  function Ne(a) {
    var b = a && a.nodeName && a.nodeName.toLowerCase();
    return b && ("input" === b && ("text" === a.type || "search" === a.type || "tel" === a.type || "url" === a.type || "password" === a.type) || "textarea" === b || "true" === a.contentEditable);
  }
  function Oe(a) {
    var b = Me(), c = a.focusedElem, d = a.selectionRange;
    if (b !== c && c && c.ownerDocument && Le(c.ownerDocument.documentElement, c)) {
      if (null !== d && Ne(c)) {
        if (b = d.start, a = d.end, void 0 === a && (a = b), "selectionStart" in c) c.selectionStart = b, c.selectionEnd = Math.min(a, c.value.length);
        else if (a = (b = c.ownerDocument || document) && b.defaultView || window, a.getSelection) {
          a = a.getSelection();
          var e = c.textContent.length, f = Math.min(d.start, e);
          d = void 0 === d.end ? f : Math.min(d.end, e);
          !a.extend && f > d && (e = d, d = f, f = e);
          e = Ke(c, f);
          var g = Ke(
            c,
            d
          );
          e && g && (1 !== a.rangeCount || a.anchorNode !== e.node || a.anchorOffset !== e.offset || a.focusNode !== g.node || a.focusOffset !== g.offset) && (b = b.createRange(), b.setStart(e.node, e.offset), a.removeAllRanges(), f > d ? (a.addRange(b), a.extend(g.node, g.offset)) : (b.setEnd(g.node, g.offset), a.addRange(b)));
        }
      }
      b = [];
      for (a = c; a = a.parentNode; ) 1 === a.nodeType && b.push({ element: a, left: a.scrollLeft, top: a.scrollTop });
      "function" === typeof c.focus && c.focus();
      for (c = 0; c < b.length; c++) a = b[c], a.element.scrollLeft = a.left, a.element.scrollTop = a.top;
    }
  }
  var Pe = ia && "documentMode" in document && 11 >= document.documentMode, Qe = null, Re = null, Se = null, Te = false;
  function Ue(a, b, c) {
    var d = c.window === c ? c.document : 9 === c.nodeType ? c : c.ownerDocument;
    Te || null == Qe || Qe !== Xa(d) || (d = Qe, "selectionStart" in d && Ne(d) ? d = { start: d.selectionStart, end: d.selectionEnd } : (d = (d.ownerDocument && d.ownerDocument.defaultView || window).getSelection(), d = { anchorNode: d.anchorNode, anchorOffset: d.anchorOffset, focusNode: d.focusNode, focusOffset: d.focusOffset }), Se && Ie(Se, d) || (Se = d, d = oe(Re, "onSelect"), 0 < d.length && (b = new td("onSelect", "select", null, b, c), a.push({ event: b, listeners: d }), b.target = Qe)));
  }
  function Ve(a, b) {
    var c = {};
    c[a.toLowerCase()] = b.toLowerCase();
    c["Webkit" + a] = "webkit" + b;
    c["Moz" + a] = "moz" + b;
    return c;
  }
  var We = { animationend: Ve("Animation", "AnimationEnd"), animationiteration: Ve("Animation", "AnimationIteration"), animationstart: Ve("Animation", "AnimationStart"), transitionend: Ve("Transition", "TransitionEnd") }, Xe = {}, Ye = {};
  ia && (Ye = document.createElement("div").style, "AnimationEvent" in window || (delete We.animationend.animation, delete We.animationiteration.animation, delete We.animationstart.animation), "TransitionEvent" in window || delete We.transitionend.transition);
  function Ze(a) {
    if (Xe[a]) return Xe[a];
    if (!We[a]) return a;
    var b = We[a], c;
    for (c in b) if (b.hasOwnProperty(c) && c in Ye) return Xe[a] = b[c];
    return a;
  }
  var $e = Ze("animationend"), af = Ze("animationiteration"), bf = Ze("animationstart"), cf = Ze("transitionend"), df = /* @__PURE__ */ new Map(), ef = "abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
  function ff(a, b) {
    df.set(a, b);
    fa(b, [a]);
  }
  for (var gf = 0; gf < ef.length; gf++) {
    var hf = ef[gf], jf = hf.toLowerCase(), kf = hf[0].toUpperCase() + hf.slice(1);
    ff(jf, "on" + kf);
  }
  ff($e, "onAnimationEnd");
  ff(af, "onAnimationIteration");
  ff(bf, "onAnimationStart");
  ff("dblclick", "onDoubleClick");
  ff("focusin", "onFocus");
  ff("focusout", "onBlur");
  ff(cf, "onTransitionEnd");
  ha("onMouseEnter", ["mouseout", "mouseover"]);
  ha("onMouseLeave", ["mouseout", "mouseover"]);
  ha("onPointerEnter", ["pointerout", "pointerover"]);
  ha("onPointerLeave", ["pointerout", "pointerover"]);
  fa("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
  fa("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
  fa("onBeforeInput", ["compositionend", "keypress", "textInput", "paste"]);
  fa("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
  fa("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
  fa("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
  var lf = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), mf = new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
  function nf(a, b, c) {
    var d = a.type || "unknown-event";
    a.currentTarget = c;
    Ub(d, b, void 0, a);
    a.currentTarget = null;
  }
  function se(a, b) {
    b = 0 !== (b & 4);
    for (var c = 0; c < a.length; c++) {
      var d = a[c], e = d.event;
      d = d.listeners;
      a: {
        var f = void 0;
        if (b) for (var g = d.length - 1; 0 <= g; g--) {
          var h = d[g], k = h.instance, l = h.currentTarget;
          h = h.listener;
          if (k !== f && e.isPropagationStopped()) break a;
          nf(e, h, l);
          f = k;
        }
        else for (g = 0; g < d.length; g++) {
          h = d[g];
          k = h.instance;
          l = h.currentTarget;
          h = h.listener;
          if (k !== f && e.isPropagationStopped()) break a;
          nf(e, h, l);
          f = k;
        }
      }
    }
    if (Qb) throw a = Rb, Qb = false, Rb = null, a;
  }
  function D(a, b) {
    var c = b[of];
    void 0 === c && (c = b[of] = /* @__PURE__ */ new Set());
    var d = a + "__bubble";
    c.has(d) || (pf(b, a, 2, false), c.add(d));
  }
  function qf(a, b, c) {
    var d = 0;
    b && (d |= 4);
    pf(c, a, d, b);
  }
  var rf = "_reactListening" + Math.random().toString(36).slice(2);
  function sf(a) {
    if (!a[rf]) {
      a[rf] = true;
      da.forEach(function(b2) {
        "selectionchange" !== b2 && (mf.has(b2) || qf(b2, false, a), qf(b2, true, a));
      });
      var b = 9 === a.nodeType ? a : a.ownerDocument;
      null === b || b[rf] || (b[rf] = true, qf("selectionchange", false, b));
    }
  }
  function pf(a, b, c, d) {
    switch (jd(b)) {
      case 1:
        var e = ed;
        break;
      case 4:
        e = gd;
        break;
      default:
        e = fd;
    }
    c = e.bind(null, b, c, a);
    e = void 0;
    !Lb || "touchstart" !== b && "touchmove" !== b && "wheel" !== b || (e = true);
    d ? void 0 !== e ? a.addEventListener(b, c, { capture: true, passive: e }) : a.addEventListener(b, c, true) : void 0 !== e ? a.addEventListener(b, c, { passive: e }) : a.addEventListener(b, c, false);
  }
  function hd(a, b, c, d, e) {
    var f = d;
    if (0 === (b & 1) && 0 === (b & 2) && null !== d) a: for (; ; ) {
      if (null === d) return;
      var g = d.tag;
      if (3 === g || 4 === g) {
        var h = d.stateNode.containerInfo;
        if (h === e || 8 === h.nodeType && h.parentNode === e) break;
        if (4 === g) for (g = d.return; null !== g; ) {
          var k = g.tag;
          if (3 === k || 4 === k) {
            if (k = g.stateNode.containerInfo, k === e || 8 === k.nodeType && k.parentNode === e) return;
          }
          g = g.return;
        }
        for (; null !== h; ) {
          g = Wc(h);
          if (null === g) return;
          k = g.tag;
          if (5 === k || 6 === k) {
            d = f = g;
            continue a;
          }
          h = h.parentNode;
        }
      }
      d = d.return;
    }
    Jb(function() {
      var d2 = f, e2 = xb(c), g2 = [];
      a: {
        var h2 = df.get(a);
        if (void 0 !== h2) {
          var k2 = td, n = a;
          switch (a) {
            case "keypress":
              if (0 === od(c)) break a;
            case "keydown":
            case "keyup":
              k2 = Rd;
              break;
            case "focusin":
              n = "focus";
              k2 = Fd;
              break;
            case "focusout":
              n = "blur";
              k2 = Fd;
              break;
            case "beforeblur":
            case "afterblur":
              k2 = Fd;
              break;
            case "click":
              if (2 === c.button) break a;
            case "auxclick":
            case "dblclick":
            case "mousedown":
            case "mousemove":
            case "mouseup":
            case "mouseout":
            case "mouseover":
            case "contextmenu":
              k2 = Bd;
              break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
              k2 = Dd;
              break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
              k2 = Vd;
              break;
            case $e:
            case af:
            case bf:
              k2 = Hd;
              break;
            case cf:
              k2 = Xd;
              break;
            case "scroll":
              k2 = vd;
              break;
            case "wheel":
              k2 = Zd;
              break;
            case "copy":
            case "cut":
            case "paste":
              k2 = Jd;
              break;
            case "gotpointercapture":
            case "lostpointercapture":
            case "pointercancel":
            case "pointerdown":
            case "pointermove":
            case "pointerout":
            case "pointerover":
            case "pointerup":
              k2 = Td;
          }
          var t2 = 0 !== (b & 4), J = !t2 && "scroll" === a, x = t2 ? null !== h2 ? h2 + "Capture" : null : h2;
          t2 = [];
          for (var w = d2, u; null !== w; ) {
            u = w;
            var F = u.stateNode;
            5 === u.tag && null !== F && (u = F, null !== x && (F = Kb(w, x), null != F && t2.push(tf(w, F, u))));
            if (J) break;
            w = w.return;
          }
          0 < t2.length && (h2 = new k2(h2, n, null, c, e2), g2.push({ event: h2, listeners: t2 }));
        }
      }
      if (0 === (b & 7)) {
        a: {
          h2 = "mouseover" === a || "pointerover" === a;
          k2 = "mouseout" === a || "pointerout" === a;
          if (h2 && c !== wb && (n = c.relatedTarget || c.fromElement) && (Wc(n) || n[uf])) break a;
          if (k2 || h2) {
            h2 = e2.window === e2 ? e2 : (h2 = e2.ownerDocument) ? h2.defaultView || h2.parentWindow : window;
            if (k2) {
              if (n = c.relatedTarget || c.toElement, k2 = d2, n = n ? Wc(n) : null, null !== n && (J = Vb(n), n !== J || 5 !== n.tag && 6 !== n.tag)) n = null;
            } else k2 = null, n = d2;
            if (k2 !== n) {
              t2 = Bd;
              F = "onMouseLeave";
              x = "onMouseEnter";
              w = "mouse";
              if ("pointerout" === a || "pointerover" === a) t2 = Td, F = "onPointerLeave", x = "onPointerEnter", w = "pointer";
              J = null == k2 ? h2 : ue(k2);
              u = null == n ? h2 : ue(n);
              h2 = new t2(F, w + "leave", k2, c, e2);
              h2.target = J;
              h2.relatedTarget = u;
              F = null;
              Wc(e2) === d2 && (t2 = new t2(x, w + "enter", n, c, e2), t2.target = u, t2.relatedTarget = J, F = t2);
              J = F;
              if (k2 && n) b: {
                t2 = k2;
                x = n;
                w = 0;
                for (u = t2; u; u = vf(u)) w++;
                u = 0;
                for (F = x; F; F = vf(F)) u++;
                for (; 0 < w - u; ) t2 = vf(t2), w--;
                for (; 0 < u - w; ) x = vf(x), u--;
                for (; w--; ) {
                  if (t2 === x || null !== x && t2 === x.alternate) break b;
                  t2 = vf(t2);
                  x = vf(x);
                }
                t2 = null;
              }
              else t2 = null;
              null !== k2 && wf(g2, h2, k2, t2, false);
              null !== n && null !== J && wf(g2, J, n, t2, true);
            }
          }
        }
        a: {
          h2 = d2 ? ue(d2) : window;
          k2 = h2.nodeName && h2.nodeName.toLowerCase();
          if ("select" === k2 || "input" === k2 && "file" === h2.type) var na = ve;
          else if (me(h2)) if (we) na = Fe;
          else {
            na = De;
            var xa = Ce;
          }
          else (k2 = h2.nodeName) && "input" === k2.toLowerCase() && ("checkbox" === h2.type || "radio" === h2.type) && (na = Ee);
          if (na && (na = na(a, d2))) {
            ne(g2, na, c, e2);
            break a;
          }
          xa && xa(a, h2, d2);
          "focusout" === a && (xa = h2._wrapperState) && xa.controlled && "number" === h2.type && cb(h2, "number", h2.value);
        }
        xa = d2 ? ue(d2) : window;
        switch (a) {
          case "focusin":
            if (me(xa) || "true" === xa.contentEditable) Qe = xa, Re = d2, Se = null;
            break;
          case "focusout":
            Se = Re = Qe = null;
            break;
          case "mousedown":
            Te = true;
            break;
          case "contextmenu":
          case "mouseup":
          case "dragend":
            Te = false;
            Ue(g2, c, e2);
            break;
          case "selectionchange":
            if (Pe) break;
          case "keydown":
          case "keyup":
            Ue(g2, c, e2);
        }
        var $a;
        if (ae) b: {
          switch (a) {
            case "compositionstart":
              var ba = "onCompositionStart";
              break b;
            case "compositionend":
              ba = "onCompositionEnd";
              break b;
            case "compositionupdate":
              ba = "onCompositionUpdate";
              break b;
          }
          ba = void 0;
        }
        else ie ? ge(a, c) && (ba = "onCompositionEnd") : "keydown" === a && 229 === c.keyCode && (ba = "onCompositionStart");
        ba && (de && "ko" !== c.locale && (ie || "onCompositionStart" !== ba ? "onCompositionEnd" === ba && ie && ($a = nd()) : (kd = e2, ld = "value" in kd ? kd.value : kd.textContent, ie = true)), xa = oe(d2, ba), 0 < xa.length && (ba = new Ld(ba, a, null, c, e2), g2.push({ event: ba, listeners: xa }), $a ? ba.data = $a : ($a = he(c), null !== $a && (ba.data = $a))));
        if ($a = ce ? je(a, c) : ke(a, c)) d2 = oe(d2, "onBeforeInput"), 0 < d2.length && (e2 = new Ld("onBeforeInput", "beforeinput", null, c, e2), g2.push({ event: e2, listeners: d2 }), e2.data = $a);
      }
      se(g2, b);
    });
  }
  function tf(a, b, c) {
    return { instance: a, listener: b, currentTarget: c };
  }
  function oe(a, b) {
    for (var c = b + "Capture", d = []; null !== a; ) {
      var e = a, f = e.stateNode;
      5 === e.tag && null !== f && (e = f, f = Kb(a, c), null != f && d.unshift(tf(a, f, e)), f = Kb(a, b), null != f && d.push(tf(a, f, e)));
      a = a.return;
    }
    return d;
  }
  function vf(a) {
    if (null === a) return null;
    do
      a = a.return;
    while (a && 5 !== a.tag);
    return a ? a : null;
  }
  function wf(a, b, c, d, e) {
    for (var f = b._reactName, g = []; null !== c && c !== d; ) {
      var h = c, k = h.alternate, l = h.stateNode;
      if (null !== k && k === d) break;
      5 === h.tag && null !== l && (h = l, e ? (k = Kb(c, f), null != k && g.unshift(tf(c, k, h))) : e || (k = Kb(c, f), null != k && g.push(tf(c, k, h))));
      c = c.return;
    }
    0 !== g.length && a.push({ event: b, listeners: g });
  }
  var xf = /\r\n?/g, yf = /\u0000|\uFFFD/g;
  function zf(a) {
    return ("string" === typeof a ? a : "" + a).replace(xf, "\n").replace(yf, "");
  }
  function Af(a, b, c) {
    b = zf(b);
    if (zf(a) !== b && c) throw Error(p(425));
  }
  function Bf() {
  }
  var Cf = null, Df = null;
  function Ef(a, b) {
    return "textarea" === a || "noscript" === a || "string" === typeof b.children || "number" === typeof b.children || "object" === typeof b.dangerouslySetInnerHTML && null !== b.dangerouslySetInnerHTML && null != b.dangerouslySetInnerHTML.__html;
  }
  var Ff = "function" === typeof setTimeout ? setTimeout : void 0, Gf = "function" === typeof clearTimeout ? clearTimeout : void 0, Hf = "function" === typeof Promise ? Promise : void 0, Jf = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof Hf ? function(a) {
    return Hf.resolve(null).then(a).catch(If);
  } : Ff;
  function If(a) {
    setTimeout(function() {
      throw a;
    });
  }
  function Kf(a, b) {
    var c = b, d = 0;
    do {
      var e = c.nextSibling;
      a.removeChild(c);
      if (e && 8 === e.nodeType) if (c = e.data, "/$" === c) {
        if (0 === d) {
          a.removeChild(e);
          bd(b);
          return;
        }
        d--;
      } else "$" !== c && "$?" !== c && "$!" !== c || d++;
      c = e;
    } while (c);
    bd(b);
  }
  function Lf(a) {
    for (; null != a; a = a.nextSibling) {
      var b = a.nodeType;
      if (1 === b || 3 === b) break;
      if (8 === b) {
        b = a.data;
        if ("$" === b || "$!" === b || "$?" === b) break;
        if ("/$" === b) return null;
      }
    }
    return a;
  }
  function Mf(a) {
    a = a.previousSibling;
    for (var b = 0; a; ) {
      if (8 === a.nodeType) {
        var c = a.data;
        if ("$" === c || "$!" === c || "$?" === c) {
          if (0 === b) return a;
          b--;
        } else "/$" === c && b++;
      }
      a = a.previousSibling;
    }
    return null;
  }
  var Nf = Math.random().toString(36).slice(2), Of = "__reactFiber$" + Nf, Pf = "__reactProps$" + Nf, uf = "__reactContainer$" + Nf, of = "__reactEvents$" + Nf, Qf = "__reactListeners$" + Nf, Rf = "__reactHandles$" + Nf;
  function Wc(a) {
    var b = a[Of];
    if (b) return b;
    for (var c = a.parentNode; c; ) {
      if (b = c[uf] || c[Of]) {
        c = b.alternate;
        if (null !== b.child || null !== c && null !== c.child) for (a = Mf(a); null !== a; ) {
          if (c = a[Of]) return c;
          a = Mf(a);
        }
        return b;
      }
      a = c;
      c = a.parentNode;
    }
    return null;
  }
  function Cb(a) {
    a = a[Of] || a[uf];
    return !a || 5 !== a.tag && 6 !== a.tag && 13 !== a.tag && 3 !== a.tag ? null : a;
  }
  function ue(a) {
    if (5 === a.tag || 6 === a.tag) return a.stateNode;
    throw Error(p(33));
  }
  function Db(a) {
    return a[Pf] || null;
  }
  var Sf = [], Tf = -1;
  function Uf(a) {
    return { current: a };
  }
  function E(a) {
    0 > Tf || (a.current = Sf[Tf], Sf[Tf] = null, Tf--);
  }
  function G(a, b) {
    Tf++;
    Sf[Tf] = a.current;
    a.current = b;
  }
  var Vf = {}, H = Uf(Vf), Wf = Uf(false), Xf = Vf;
  function Yf(a, b) {
    var c = a.type.contextTypes;
    if (!c) return Vf;
    var d = a.stateNode;
    if (d && d.__reactInternalMemoizedUnmaskedChildContext === b) return d.__reactInternalMemoizedMaskedChildContext;
    var e = {}, f;
    for (f in c) e[f] = b[f];
    d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = b, a.__reactInternalMemoizedMaskedChildContext = e);
    return e;
  }
  function Zf(a) {
    a = a.childContextTypes;
    return null !== a && void 0 !== a;
  }
  function $f() {
    E(Wf);
    E(H);
  }
  function ag(a, b, c) {
    if (H.current !== Vf) throw Error(p(168));
    G(H, b);
    G(Wf, c);
  }
  function bg(a, b, c) {
    var d = a.stateNode;
    b = b.childContextTypes;
    if ("function" !== typeof d.getChildContext) return c;
    d = d.getChildContext();
    for (var e in d) if (!(e in b)) throw Error(p(108, Ra(a) || "Unknown", e));
    return A2({}, c, d);
  }
  function cg(a) {
    a = (a = a.stateNode) && a.__reactInternalMemoizedMergedChildContext || Vf;
    Xf = H.current;
    G(H, a);
    G(Wf, Wf.current);
    return true;
  }
  function dg(a, b, c) {
    var d = a.stateNode;
    if (!d) throw Error(p(169));
    c ? (a = bg(a, b, Xf), d.__reactInternalMemoizedMergedChildContext = a, E(Wf), E(H), G(H, a)) : E(Wf);
    G(Wf, c);
  }
  var eg = null, fg = false, gg = false;
  function hg(a) {
    null === eg ? eg = [a] : eg.push(a);
  }
  function ig(a) {
    fg = true;
    hg(a);
  }
  function jg() {
    if (!gg && null !== eg) {
      gg = true;
      var a = 0, b = C;
      try {
        var c = eg;
        for (C = 1; a < c.length; a++) {
          var d = c[a];
          do
            d = d(true);
          while (null !== d);
        }
        eg = null;
        fg = false;
      } catch (e) {
        throw null !== eg && (eg = eg.slice(a + 1)), ac(fc, jg), e;
      } finally {
        C = b, gg = false;
      }
    }
    return null;
  }
  var kg = [], lg = 0, mg = null, ng = 0, og = [], pg = 0, qg = null, rg = 1, sg = "";
  function tg(a, b) {
    kg[lg++] = ng;
    kg[lg++] = mg;
    mg = a;
    ng = b;
  }
  function ug(a, b, c) {
    og[pg++] = rg;
    og[pg++] = sg;
    og[pg++] = qg;
    qg = a;
    var d = rg;
    a = sg;
    var e = 32 - oc(d) - 1;
    d &= ~(1 << e);
    c += 1;
    var f = 32 - oc(b) + e;
    if (30 < f) {
      var g = e - e % 5;
      f = (d & (1 << g) - 1).toString(32);
      d >>= g;
      e -= g;
      rg = 1 << 32 - oc(b) + e | c << e | d;
      sg = f + a;
    } else rg = 1 << f | c << e | d, sg = a;
  }
  function vg(a) {
    null !== a.return && (tg(a, 1), ug(a, 1, 0));
  }
  function wg(a) {
    for (; a === mg; ) mg = kg[--lg], kg[lg] = null, ng = kg[--lg], kg[lg] = null;
    for (; a === qg; ) qg = og[--pg], og[pg] = null, sg = og[--pg], og[pg] = null, rg = og[--pg], og[pg] = null;
  }
  var xg = null, yg = null, I = false, zg = null;
  function Ag(a, b) {
    var c = Bg(5, null, null, 0);
    c.elementType = "DELETED";
    c.stateNode = b;
    c.return = a;
    b = a.deletions;
    null === b ? (a.deletions = [c], a.flags |= 16) : b.push(c);
  }
  function Cg(a, b) {
    switch (a.tag) {
      case 5:
        var c = a.type;
        b = 1 !== b.nodeType || c.toLowerCase() !== b.nodeName.toLowerCase() ? null : b;
        return null !== b ? (a.stateNode = b, xg = a, yg = Lf(b.firstChild), true) : false;
      case 6:
        return b = "" === a.pendingProps || 3 !== b.nodeType ? null : b, null !== b ? (a.stateNode = b, xg = a, yg = null, true) : false;
      case 13:
        return b = 8 !== b.nodeType ? null : b, null !== b ? (c = null !== qg ? { id: rg, overflow: sg } : null, a.memoizedState = { dehydrated: b, treeContext: c, retryLane: 1073741824 }, c = Bg(18, null, null, 0), c.stateNode = b, c.return = a, a.child = c, xg = a, yg = null, true) : false;
      default:
        return false;
    }
  }
  function Dg(a) {
    return 0 !== (a.mode & 1) && 0 === (a.flags & 128);
  }
  function Eg(a) {
    if (I) {
      var b = yg;
      if (b) {
        var c = b;
        if (!Cg(a, b)) {
          if (Dg(a)) throw Error(p(418));
          b = Lf(c.nextSibling);
          var d = xg;
          b && Cg(a, b) ? Ag(d, c) : (a.flags = a.flags & -4097 | 2, I = false, xg = a);
        }
      } else {
        if (Dg(a)) throw Error(p(418));
        a.flags = a.flags & -4097 | 2;
        I = false;
        xg = a;
      }
    }
  }
  function Fg(a) {
    for (a = a.return; null !== a && 5 !== a.tag && 3 !== a.tag && 13 !== a.tag; ) a = a.return;
    xg = a;
  }
  function Gg(a) {
    if (a !== xg) return false;
    if (!I) return Fg(a), I = true, false;
    var b;
    (b = 3 !== a.tag) && !(b = 5 !== a.tag) && (b = a.type, b = "head" !== b && "body" !== b && !Ef(a.type, a.memoizedProps));
    if (b && (b = yg)) {
      if (Dg(a)) throw Hg(), Error(p(418));
      for (; b; ) Ag(a, b), b = Lf(b.nextSibling);
    }
    Fg(a);
    if (13 === a.tag) {
      a = a.memoizedState;
      a = null !== a ? a.dehydrated : null;
      if (!a) throw Error(p(317));
      a: {
        a = a.nextSibling;
        for (b = 0; a; ) {
          if (8 === a.nodeType) {
            var c = a.data;
            if ("/$" === c) {
              if (0 === b) {
                yg = Lf(a.nextSibling);
                break a;
              }
              b--;
            } else "$" !== c && "$!" !== c && "$?" !== c || b++;
          }
          a = a.nextSibling;
        }
        yg = null;
      }
    } else yg = xg ? Lf(a.stateNode.nextSibling) : null;
    return true;
  }
  function Hg() {
    for (var a = yg; a; ) a = Lf(a.nextSibling);
  }
  function Ig() {
    yg = xg = null;
    I = false;
  }
  function Jg(a) {
    null === zg ? zg = [a] : zg.push(a);
  }
  var Kg = ua.ReactCurrentBatchConfig;
  function Lg(a, b, c) {
    a = c.ref;
    if (null !== a && "function" !== typeof a && "object" !== typeof a) {
      if (c._owner) {
        c = c._owner;
        if (c) {
          if (1 !== c.tag) throw Error(p(309));
          var d = c.stateNode;
        }
        if (!d) throw Error(p(147, a));
        var e = d, f = "" + a;
        if (null !== b && null !== b.ref && "function" === typeof b.ref && b.ref._stringRef === f) return b.ref;
        b = function(a2) {
          var b2 = e.refs;
          null === a2 ? delete b2[f] : b2[f] = a2;
        };
        b._stringRef = f;
        return b;
      }
      if ("string" !== typeof a) throw Error(p(284));
      if (!c._owner) throw Error(p(290, a));
    }
    return a;
  }
  function Mg(a, b) {
    a = Object.prototype.toString.call(b);
    throw Error(p(31, "[object Object]" === a ? "object with keys {" + Object.keys(b).join(", ") + "}" : a));
  }
  function Ng(a) {
    var b = a._init;
    return b(a._payload);
  }
  function Og(a) {
    function b(b2, c2) {
      if (a) {
        var d2 = b2.deletions;
        null === d2 ? (b2.deletions = [c2], b2.flags |= 16) : d2.push(c2);
      }
    }
    function c(c2, d2) {
      if (!a) return null;
      for (; null !== d2; ) b(c2, d2), d2 = d2.sibling;
      return null;
    }
    function d(a2, b2) {
      for (a2 = /* @__PURE__ */ new Map(); null !== b2; ) null !== b2.key ? a2.set(b2.key, b2) : a2.set(b2.index, b2), b2 = b2.sibling;
      return a2;
    }
    function e(a2, b2) {
      a2 = Pg(a2, b2);
      a2.index = 0;
      a2.sibling = null;
      return a2;
    }
    function f(b2, c2, d2) {
      b2.index = d2;
      if (!a) return b2.flags |= 1048576, c2;
      d2 = b2.alternate;
      if (null !== d2) return d2 = d2.index, d2 < c2 ? (b2.flags |= 2, c2) : d2;
      b2.flags |= 2;
      return c2;
    }
    function g(b2) {
      a && null === b2.alternate && (b2.flags |= 2);
      return b2;
    }
    function h(a2, b2, c2, d2) {
      if (null === b2 || 6 !== b2.tag) return b2 = Qg(c2, a2.mode, d2), b2.return = a2, b2;
      b2 = e(b2, c2);
      b2.return = a2;
      return b2;
    }
    function k(a2, b2, c2, d2) {
      var f2 = c2.type;
      if (f2 === ya) return m(a2, b2, c2.props.children, d2, c2.key);
      if (null !== b2 && (b2.elementType === f2 || "object" === typeof f2 && null !== f2 && f2.$$typeof === Ha && Ng(f2) === b2.type)) return d2 = e(b2, c2.props), d2.ref = Lg(a2, b2, c2), d2.return = a2, d2;
      d2 = Rg(c2.type, c2.key, c2.props, null, a2.mode, d2);
      d2.ref = Lg(a2, b2, c2);
      d2.return = a2;
      return d2;
    }
    function l(a2, b2, c2, d2) {
      if (null === b2 || 4 !== b2.tag || b2.stateNode.containerInfo !== c2.containerInfo || b2.stateNode.implementation !== c2.implementation) return b2 = Sg(c2, a2.mode, d2), b2.return = a2, b2;
      b2 = e(b2, c2.children || []);
      b2.return = a2;
      return b2;
    }
    function m(a2, b2, c2, d2, f2) {
      if (null === b2 || 7 !== b2.tag) return b2 = Tg(c2, a2.mode, d2, f2), b2.return = a2, b2;
      b2 = e(b2, c2);
      b2.return = a2;
      return b2;
    }
    function q(a2, b2, c2) {
      if ("string" === typeof b2 && "" !== b2 || "number" === typeof b2) return b2 = Qg("" + b2, a2.mode, c2), b2.return = a2, b2;
      if ("object" === typeof b2 && null !== b2) {
        switch (b2.$$typeof) {
          case va:
            return c2 = Rg(b2.type, b2.key, b2.props, null, a2.mode, c2), c2.ref = Lg(a2, null, b2), c2.return = a2, c2;
          case wa:
            return b2 = Sg(b2, a2.mode, c2), b2.return = a2, b2;
          case Ha:
            var d2 = b2._init;
            return q(a2, d2(b2._payload), c2);
        }
        if (eb(b2) || Ka(b2)) return b2 = Tg(b2, a2.mode, c2, null), b2.return = a2, b2;
        Mg(a2, b2);
      }
      return null;
    }
    function r(a2, b2, c2, d2) {
      var e2 = null !== b2 ? b2.key : null;
      if ("string" === typeof c2 && "" !== c2 || "number" === typeof c2) return null !== e2 ? null : h(a2, b2, "" + c2, d2);
      if ("object" === typeof c2 && null !== c2) {
        switch (c2.$$typeof) {
          case va:
            return c2.key === e2 ? k(a2, b2, c2, d2) : null;
          case wa:
            return c2.key === e2 ? l(a2, b2, c2, d2) : null;
          case Ha:
            return e2 = c2._init, r(
              a2,
              b2,
              e2(c2._payload),
              d2
            );
        }
        if (eb(c2) || Ka(c2)) return null !== e2 ? null : m(a2, b2, c2, d2, null);
        Mg(a2, c2);
      }
      return null;
    }
    function y(a2, b2, c2, d2, e2) {
      if ("string" === typeof d2 && "" !== d2 || "number" === typeof d2) return a2 = a2.get(c2) || null, h(b2, a2, "" + d2, e2);
      if ("object" === typeof d2 && null !== d2) {
        switch (d2.$$typeof) {
          case va:
            return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, k(b2, a2, d2, e2);
          case wa:
            return a2 = a2.get(null === d2.key ? c2 : d2.key) || null, l(b2, a2, d2, e2);
          case Ha:
            var f2 = d2._init;
            return y(a2, b2, c2, f2(d2._payload), e2);
        }
        if (eb(d2) || Ka(d2)) return a2 = a2.get(c2) || null, m(b2, a2, d2, e2, null);
        Mg(b2, d2);
      }
      return null;
    }
    function n(e2, g2, h2, k2) {
      for (var l2 = null, m2 = null, u = g2, w = g2 = 0, x = null; null !== u && w < h2.length; w++) {
        u.index > w ? (x = u, u = null) : x = u.sibling;
        var n2 = r(e2, u, h2[w], k2);
        if (null === n2) {
          null === u && (u = x);
          break;
        }
        a && u && null === n2.alternate && b(e2, u);
        g2 = f(n2, g2, w);
        null === m2 ? l2 = n2 : m2.sibling = n2;
        m2 = n2;
        u = x;
      }
      if (w === h2.length) return c(e2, u), I && tg(e2, w), l2;
      if (null === u) {
        for (; w < h2.length; w++) u = q(e2, h2[w], k2), null !== u && (g2 = f(u, g2, w), null === m2 ? l2 = u : m2.sibling = u, m2 = u);
        I && tg(e2, w);
        return l2;
      }
      for (u = d(e2, u); w < h2.length; w++) x = y(u, e2, w, h2[w], k2), null !== x && (a && null !== x.alternate && u.delete(null === x.key ? w : x.key), g2 = f(x, g2, w), null === m2 ? l2 = x : m2.sibling = x, m2 = x);
      a && u.forEach(function(a2) {
        return b(e2, a2);
      });
      I && tg(e2, w);
      return l2;
    }
    function t2(e2, g2, h2, k2) {
      var l2 = Ka(h2);
      if ("function" !== typeof l2) throw Error(p(150));
      h2 = l2.call(h2);
      if (null == h2) throw Error(p(151));
      for (var u = l2 = null, m2 = g2, w = g2 = 0, x = null, n2 = h2.next(); null !== m2 && !n2.done; w++, n2 = h2.next()) {
        m2.index > w ? (x = m2, m2 = null) : x = m2.sibling;
        var t3 = r(e2, m2, n2.value, k2);
        if (null === t3) {
          null === m2 && (m2 = x);
          break;
        }
        a && m2 && null === t3.alternate && b(e2, m2);
        g2 = f(t3, g2, w);
        null === u ? l2 = t3 : u.sibling = t3;
        u = t3;
        m2 = x;
      }
      if (n2.done) return c(
        e2,
        m2
      ), I && tg(e2, w), l2;
      if (null === m2) {
        for (; !n2.done; w++, n2 = h2.next()) n2 = q(e2, n2.value, k2), null !== n2 && (g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
        I && tg(e2, w);
        return l2;
      }
      for (m2 = d(e2, m2); !n2.done; w++, n2 = h2.next()) n2 = y(m2, e2, w, n2.value, k2), null !== n2 && (a && null !== n2.alternate && m2.delete(null === n2.key ? w : n2.key), g2 = f(n2, g2, w), null === u ? l2 = n2 : u.sibling = n2, u = n2);
      a && m2.forEach(function(a2) {
        return b(e2, a2);
      });
      I && tg(e2, w);
      return l2;
    }
    function J(a2, d2, f2, h2) {
      "object" === typeof f2 && null !== f2 && f2.type === ya && null === f2.key && (f2 = f2.props.children);
      if ("object" === typeof f2 && null !== f2) {
        switch (f2.$$typeof) {
          case va:
            a: {
              for (var k2 = f2.key, l2 = d2; null !== l2; ) {
                if (l2.key === k2) {
                  k2 = f2.type;
                  if (k2 === ya) {
                    if (7 === l2.tag) {
                      c(a2, l2.sibling);
                      d2 = e(l2, f2.props.children);
                      d2.return = a2;
                      a2 = d2;
                      break a;
                    }
                  } else if (l2.elementType === k2 || "object" === typeof k2 && null !== k2 && k2.$$typeof === Ha && Ng(k2) === l2.type) {
                    c(a2, l2.sibling);
                    d2 = e(l2, f2.props);
                    d2.ref = Lg(a2, l2, f2);
                    d2.return = a2;
                    a2 = d2;
                    break a;
                  }
                  c(a2, l2);
                  break;
                } else b(a2, l2);
                l2 = l2.sibling;
              }
              f2.type === ya ? (d2 = Tg(f2.props.children, a2.mode, h2, f2.key), d2.return = a2, a2 = d2) : (h2 = Rg(f2.type, f2.key, f2.props, null, a2.mode, h2), h2.ref = Lg(a2, d2, f2), h2.return = a2, a2 = h2);
            }
            return g(a2);
          case wa:
            a: {
              for (l2 = f2.key; null !== d2; ) {
                if (d2.key === l2) if (4 === d2.tag && d2.stateNode.containerInfo === f2.containerInfo && d2.stateNode.implementation === f2.implementation) {
                  c(a2, d2.sibling);
                  d2 = e(d2, f2.children || []);
                  d2.return = a2;
                  a2 = d2;
                  break a;
                } else {
                  c(a2, d2);
                  break;
                }
                else b(a2, d2);
                d2 = d2.sibling;
              }
              d2 = Sg(f2, a2.mode, h2);
              d2.return = a2;
              a2 = d2;
            }
            return g(a2);
          case Ha:
            return l2 = f2._init, J(a2, d2, l2(f2._payload), h2);
        }
        if (eb(f2)) return n(a2, d2, f2, h2);
        if (Ka(f2)) return t2(a2, d2, f2, h2);
        Mg(a2, f2);
      }
      return "string" === typeof f2 && "" !== f2 || "number" === typeof f2 ? (f2 = "" + f2, null !== d2 && 6 === d2.tag ? (c(a2, d2.sibling), d2 = e(d2, f2), d2.return = a2, a2 = d2) : (c(a2, d2), d2 = Qg(f2, a2.mode, h2), d2.return = a2, a2 = d2), g(a2)) : c(a2, d2);
    }
    return J;
  }
  var Ug = Og(true), Vg = Og(false), Wg = Uf(null), Xg = null, Yg = null, Zg = null;
  function $g() {
    Zg = Yg = Xg = null;
  }
  function ah(a) {
    var b = Wg.current;
    E(Wg);
    a._currentValue = b;
  }
  function bh(a, b, c) {
    for (; null !== a; ) {
      var d = a.alternate;
      (a.childLanes & b) !== b ? (a.childLanes |= b, null !== d && (d.childLanes |= b)) : null !== d && (d.childLanes & b) !== b && (d.childLanes |= b);
      if (a === c) break;
      a = a.return;
    }
  }
  function ch(a, b) {
    Xg = a;
    Zg = Yg = null;
    a = a.dependencies;
    null !== a && null !== a.firstContext && (0 !== (a.lanes & b) && (dh = true), a.firstContext = null);
  }
  function eh(a) {
    var b = a._currentValue;
    if (Zg !== a) if (a = { context: a, memoizedValue: b, next: null }, null === Yg) {
      if (null === Xg) throw Error(p(308));
      Yg = a;
      Xg.dependencies = { lanes: 0, firstContext: a };
    } else Yg = Yg.next = a;
    return b;
  }
  var fh = null;
  function gh(a) {
    null === fh ? fh = [a] : fh.push(a);
  }
  function hh(a, b, c, d) {
    var e = b.interleaved;
    null === e ? (c.next = c, gh(b)) : (c.next = e.next, e.next = c);
    b.interleaved = c;
    return ih(a, d);
  }
  function ih(a, b) {
    a.lanes |= b;
    var c = a.alternate;
    null !== c && (c.lanes |= b);
    c = a;
    for (a = a.return; null !== a; ) a.childLanes |= b, c = a.alternate, null !== c && (c.childLanes |= b), c = a, a = a.return;
    return 3 === c.tag ? c.stateNode : null;
  }
  var jh = false;
  function kh(a) {
    a.updateQueue = { baseState: a.memoizedState, firstBaseUpdate: null, lastBaseUpdate: null, shared: { pending: null, interleaved: null, lanes: 0 }, effects: null };
  }
  function lh(a, b) {
    a = a.updateQueue;
    b.updateQueue === a && (b.updateQueue = { baseState: a.baseState, firstBaseUpdate: a.firstBaseUpdate, lastBaseUpdate: a.lastBaseUpdate, shared: a.shared, effects: a.effects });
  }
  function mh(a, b) {
    return { eventTime: a, lane: b, tag: 0, payload: null, callback: null, next: null };
  }
  function nh(a, b, c) {
    var d = a.updateQueue;
    if (null === d) return null;
    d = d.shared;
    if (0 !== (K & 2)) {
      var e = d.pending;
      null === e ? b.next = b : (b.next = e.next, e.next = b);
      d.pending = b;
      return ih(a, c);
    }
    e = d.interleaved;
    null === e ? (b.next = b, gh(d)) : (b.next = e.next, e.next = b);
    d.interleaved = b;
    return ih(a, c);
  }
  function oh(a, b, c) {
    b = b.updateQueue;
    if (null !== b && (b = b.shared, 0 !== (c & 4194240))) {
      var d = b.lanes;
      d &= a.pendingLanes;
      c |= d;
      b.lanes = c;
      Cc(a, c);
    }
  }
  function ph(a, b) {
    var c = a.updateQueue, d = a.alternate;
    if (null !== d && (d = d.updateQueue, c === d)) {
      var e = null, f = null;
      c = c.firstBaseUpdate;
      if (null !== c) {
        do {
          var g = { eventTime: c.eventTime, lane: c.lane, tag: c.tag, payload: c.payload, callback: c.callback, next: null };
          null === f ? e = f = g : f = f.next = g;
          c = c.next;
        } while (null !== c);
        null === f ? e = f = b : f = f.next = b;
      } else e = f = b;
      c = { baseState: d.baseState, firstBaseUpdate: e, lastBaseUpdate: f, shared: d.shared, effects: d.effects };
      a.updateQueue = c;
      return;
    }
    a = c.lastBaseUpdate;
    null === a ? c.firstBaseUpdate = b : a.next = b;
    c.lastBaseUpdate = b;
  }
  function qh(a, b, c, d) {
    var e = a.updateQueue;
    jh = false;
    var f = e.firstBaseUpdate, g = e.lastBaseUpdate, h = e.shared.pending;
    if (null !== h) {
      e.shared.pending = null;
      var k = h, l = k.next;
      k.next = null;
      null === g ? f = l : g.next = l;
      g = k;
      var m = a.alternate;
      null !== m && (m = m.updateQueue, h = m.lastBaseUpdate, h !== g && (null === h ? m.firstBaseUpdate = l : h.next = l, m.lastBaseUpdate = k));
    }
    if (null !== f) {
      var q = e.baseState;
      g = 0;
      m = l = k = null;
      h = f;
      do {
        var r = h.lane, y = h.eventTime;
        if ((d & r) === r) {
          null !== m && (m = m.next = {
            eventTime: y,
            lane: 0,
            tag: h.tag,
            payload: h.payload,
            callback: h.callback,
            next: null
          });
          a: {
            var n = a, t2 = h;
            r = b;
            y = c;
            switch (t2.tag) {
              case 1:
                n = t2.payload;
                if ("function" === typeof n) {
                  q = n.call(y, q, r);
                  break a;
                }
                q = n;
                break a;
              case 3:
                n.flags = n.flags & -65537 | 128;
              case 0:
                n = t2.payload;
                r = "function" === typeof n ? n.call(y, q, r) : n;
                if (null === r || void 0 === r) break a;
                q = A2({}, q, r);
                break a;
              case 2:
                jh = true;
            }
          }
          null !== h.callback && 0 !== h.lane && (a.flags |= 64, r = e.effects, null === r ? e.effects = [h] : r.push(h));
        } else y = { eventTime: y, lane: r, tag: h.tag, payload: h.payload, callback: h.callback, next: null }, null === m ? (l = m = y, k = q) : m = m.next = y, g |= r;
        h = h.next;
        if (null === h) if (h = e.shared.pending, null === h) break;
        else r = h, h = r.next, r.next = null, e.lastBaseUpdate = r, e.shared.pending = null;
      } while (1);
      null === m && (k = q);
      e.baseState = k;
      e.firstBaseUpdate = l;
      e.lastBaseUpdate = m;
      b = e.shared.interleaved;
      if (null !== b) {
        e = b;
        do
          g |= e.lane, e = e.next;
        while (e !== b);
      } else null === f && (e.shared.lanes = 0);
      rh |= g;
      a.lanes = g;
      a.memoizedState = q;
    }
  }
  function sh(a, b, c) {
    a = b.effects;
    b.effects = null;
    if (null !== a) for (b = 0; b < a.length; b++) {
      var d = a[b], e = d.callback;
      if (null !== e) {
        d.callback = null;
        d = c;
        if ("function" !== typeof e) throw Error(p(191, e));
        e.call(d);
      }
    }
  }
  var th = {}, uh = Uf(th), vh = Uf(th), wh = Uf(th);
  function xh(a) {
    if (a === th) throw Error(p(174));
    return a;
  }
  function yh(a, b) {
    G(wh, b);
    G(vh, a);
    G(uh, th);
    a = b.nodeType;
    switch (a) {
      case 9:
      case 11:
        b = (b = b.documentElement) ? b.namespaceURI : lb(null, "");
        break;
      default:
        a = 8 === a ? b.parentNode : b, b = a.namespaceURI || null, a = a.tagName, b = lb(b, a);
    }
    E(uh);
    G(uh, b);
  }
  function zh() {
    E(uh);
    E(vh);
    E(wh);
  }
  function Ah(a) {
    xh(wh.current);
    var b = xh(uh.current);
    var c = lb(b, a.type);
    b !== c && (G(vh, a), G(uh, c));
  }
  function Bh(a) {
    vh.current === a && (E(uh), E(vh));
  }
  var L = Uf(0);
  function Ch(a) {
    for (var b = a; null !== b; ) {
      if (13 === b.tag) {
        var c = b.memoizedState;
        if (null !== c && (c = c.dehydrated, null === c || "$?" === c.data || "$!" === c.data)) return b;
      } else if (19 === b.tag && void 0 !== b.memoizedProps.revealOrder) {
        if (0 !== (b.flags & 128)) return b;
      } else if (null !== b.child) {
        b.child.return = b;
        b = b.child;
        continue;
      }
      if (b === a) break;
      for (; null === b.sibling; ) {
        if (null === b.return || b.return === a) return null;
        b = b.return;
      }
      b.sibling.return = b.return;
      b = b.sibling;
    }
    return null;
  }
  var Dh = [];
  function Eh() {
    for (var a = 0; a < Dh.length; a++) Dh[a]._workInProgressVersionPrimary = null;
    Dh.length = 0;
  }
  var Fh = ua.ReactCurrentDispatcher, Gh = ua.ReactCurrentBatchConfig, Hh = 0, M = null, N = null, O = null, Ih = false, Jh = false, Kh = 0, Lh = 0;
  function P() {
    throw Error(p(321));
  }
  function Mh(a, b) {
    if (null === b) return false;
    for (var c = 0; c < b.length && c < a.length; c++) if (!He(a[c], b[c])) return false;
    return true;
  }
  function Nh(a, b, c, d, e, f) {
    Hh = f;
    M = b;
    b.memoizedState = null;
    b.updateQueue = null;
    b.lanes = 0;
    Fh.current = null === a || null === a.memoizedState ? Oh : Ph;
    a = c(d, e);
    if (Jh) {
      f = 0;
      do {
        Jh = false;
        Kh = 0;
        if (25 <= f) throw Error(p(301));
        f += 1;
        O = N = null;
        b.updateQueue = null;
        Fh.current = Qh;
        a = c(d, e);
      } while (Jh);
    }
    Fh.current = Rh;
    b = null !== N && null !== N.next;
    Hh = 0;
    O = N = M = null;
    Ih = false;
    if (b) throw Error(p(300));
    return a;
  }
  function Sh() {
    var a = 0 !== Kh;
    Kh = 0;
    return a;
  }
  function Th() {
    var a = { memoizedState: null, baseState: null, baseQueue: null, queue: null, next: null };
    null === O ? M.memoizedState = O = a : O = O.next = a;
    return O;
  }
  function Uh() {
    if (null === N) {
      var a = M.alternate;
      a = null !== a ? a.memoizedState : null;
    } else a = N.next;
    var b = null === O ? M.memoizedState : O.next;
    if (null !== b) O = b, N = a;
    else {
      if (null === a) throw Error(p(310));
      N = a;
      a = { memoizedState: N.memoizedState, baseState: N.baseState, baseQueue: N.baseQueue, queue: N.queue, next: null };
      null === O ? M.memoizedState = O = a : O = O.next = a;
    }
    return O;
  }
  function Vh(a, b) {
    return "function" === typeof b ? b(a) : b;
  }
  function Wh(a) {
    var b = Uh(), c = b.queue;
    if (null === c) throw Error(p(311));
    c.lastRenderedReducer = a;
    var d = N, e = d.baseQueue, f = c.pending;
    if (null !== f) {
      if (null !== e) {
        var g = e.next;
        e.next = f.next;
        f.next = g;
      }
      d.baseQueue = e = f;
      c.pending = null;
    }
    if (null !== e) {
      f = e.next;
      d = d.baseState;
      var h = g = null, k = null, l = f;
      do {
        var m = l.lane;
        if ((Hh & m) === m) null !== k && (k = k.next = { lane: 0, action: l.action, hasEagerState: l.hasEagerState, eagerState: l.eagerState, next: null }), d = l.hasEagerState ? l.eagerState : a(d, l.action);
        else {
          var q = {
            lane: m,
            action: l.action,
            hasEagerState: l.hasEagerState,
            eagerState: l.eagerState,
            next: null
          };
          null === k ? (h = k = q, g = d) : k = k.next = q;
          M.lanes |= m;
          rh |= m;
        }
        l = l.next;
      } while (null !== l && l !== f);
      null === k ? g = d : k.next = h;
      He(d, b.memoizedState) || (dh = true);
      b.memoizedState = d;
      b.baseState = g;
      b.baseQueue = k;
      c.lastRenderedState = d;
    }
    a = c.interleaved;
    if (null !== a) {
      e = a;
      do
        f = e.lane, M.lanes |= f, rh |= f, e = e.next;
      while (e !== a);
    } else null === e && (c.lanes = 0);
    return [b.memoizedState, c.dispatch];
  }
  function Xh(a) {
    var b = Uh(), c = b.queue;
    if (null === c) throw Error(p(311));
    c.lastRenderedReducer = a;
    var d = c.dispatch, e = c.pending, f = b.memoizedState;
    if (null !== e) {
      c.pending = null;
      var g = e = e.next;
      do
        f = a(f, g.action), g = g.next;
      while (g !== e);
      He(f, b.memoizedState) || (dh = true);
      b.memoizedState = f;
      null === b.baseQueue && (b.baseState = f);
      c.lastRenderedState = f;
    }
    return [f, d];
  }
  function Yh() {
  }
  function Zh(a, b) {
    var c = M, d = Uh(), e = b(), f = !He(d.memoizedState, e);
    f && (d.memoizedState = e, dh = true);
    d = d.queue;
    $h(ai.bind(null, c, d, a), [a]);
    if (d.getSnapshot !== b || f || null !== O && O.memoizedState.tag & 1) {
      c.flags |= 2048;
      bi(9, ci.bind(null, c, d, e, b), void 0, null);
      if (null === Q) throw Error(p(349));
      0 !== (Hh & 30) || di(c, b, e);
    }
    return e;
  }
  function di(a, b, c) {
    a.flags |= 16384;
    a = { getSnapshot: b, value: c };
    b = M.updateQueue;
    null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.stores = [a]) : (c = b.stores, null === c ? b.stores = [a] : c.push(a));
  }
  function ci(a, b, c, d) {
    b.value = c;
    b.getSnapshot = d;
    ei(b) && fi(a);
  }
  function ai(a, b, c) {
    return c(function() {
      ei(b) && fi(a);
    });
  }
  function ei(a) {
    var b = a.getSnapshot;
    a = a.value;
    try {
      var c = b();
      return !He(a, c);
    } catch (d) {
      return true;
    }
  }
  function fi(a) {
    var b = ih(a, 1);
    null !== b && gi(b, a, 1, -1);
  }
  function hi(a) {
    var b = Th();
    "function" === typeof a && (a = a());
    b.memoizedState = b.baseState = a;
    a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: Vh, lastRenderedState: a };
    b.queue = a;
    a = a.dispatch = ii.bind(null, M, a);
    return [b.memoizedState, a];
  }
  function bi(a, b, c, d) {
    a = { tag: a, create: b, destroy: c, deps: d, next: null };
    b = M.updateQueue;
    null === b ? (b = { lastEffect: null, stores: null }, M.updateQueue = b, b.lastEffect = a.next = a) : (c = b.lastEffect, null === c ? b.lastEffect = a.next = a : (d = c.next, c.next = a, a.next = d, b.lastEffect = a));
    return a;
  }
  function ji() {
    return Uh().memoizedState;
  }
  function ki(a, b, c, d) {
    var e = Th();
    M.flags |= a;
    e.memoizedState = bi(1 | b, c, void 0, void 0 === d ? null : d);
  }
  function li(a, b, c, d) {
    var e = Uh();
    d = void 0 === d ? null : d;
    var f = void 0;
    if (null !== N) {
      var g = N.memoizedState;
      f = g.destroy;
      if (null !== d && Mh(d, g.deps)) {
        e.memoizedState = bi(b, c, f, d);
        return;
      }
    }
    M.flags |= a;
    e.memoizedState = bi(1 | b, c, f, d);
  }
  function mi(a, b) {
    return ki(8390656, 8, a, b);
  }
  function $h(a, b) {
    return li(2048, 8, a, b);
  }
  function ni(a, b) {
    return li(4, 2, a, b);
  }
  function oi(a, b) {
    return li(4, 4, a, b);
  }
  function pi(a, b) {
    if ("function" === typeof b) return a = a(), b(a), function() {
      b(null);
    };
    if (null !== b && void 0 !== b) return a = a(), b.current = a, function() {
      b.current = null;
    };
  }
  function qi(a, b, c) {
    c = null !== c && void 0 !== c ? c.concat([a]) : null;
    return li(4, 4, pi.bind(null, b, a), c);
  }
  function ri() {
  }
  function si(a, b) {
    var c = Uh();
    b = void 0 === b ? null : b;
    var d = c.memoizedState;
    if (null !== d && null !== b && Mh(b, d[1])) return d[0];
    c.memoizedState = [a, b];
    return a;
  }
  function ti(a, b) {
    var c = Uh();
    b = void 0 === b ? null : b;
    var d = c.memoizedState;
    if (null !== d && null !== b && Mh(b, d[1])) return d[0];
    a = a();
    c.memoizedState = [a, b];
    return a;
  }
  function ui(a, b, c) {
    if (0 === (Hh & 21)) return a.baseState && (a.baseState = false, dh = true), a.memoizedState = c;
    He(c, b) || (c = yc(), M.lanes |= c, rh |= c, a.baseState = true);
    return b;
  }
  function vi(a, b) {
    var c = C;
    C = 0 !== c && 4 > c ? c : 4;
    a(true);
    var d = Gh.transition;
    Gh.transition = {};
    try {
      a(false), b();
    } finally {
      C = c, Gh.transition = d;
    }
  }
  function wi() {
    return Uh().memoizedState;
  }
  function xi(a, b, c) {
    var d = yi(a);
    c = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
    if (zi(a)) Ai(b, c);
    else if (c = hh(a, b, c, d), null !== c) {
      var e = R();
      gi(c, a, d, e);
      Bi(c, b, d);
    }
  }
  function ii(a, b, c) {
    var d = yi(a), e = { lane: d, action: c, hasEagerState: false, eagerState: null, next: null };
    if (zi(a)) Ai(b, e);
    else {
      var f = a.alternate;
      if (0 === a.lanes && (null === f || 0 === f.lanes) && (f = b.lastRenderedReducer, null !== f)) try {
        var g = b.lastRenderedState, h = f(g, c);
        e.hasEagerState = true;
        e.eagerState = h;
        if (He(h, g)) {
          var k = b.interleaved;
          null === k ? (e.next = e, gh(b)) : (e.next = k.next, k.next = e);
          b.interleaved = e;
          return;
        }
      } catch (l) {
      } finally {
      }
      c = hh(a, b, e, d);
      null !== c && (e = R(), gi(c, a, d, e), Bi(c, b, d));
    }
  }
  function zi(a) {
    var b = a.alternate;
    return a === M || null !== b && b === M;
  }
  function Ai(a, b) {
    Jh = Ih = true;
    var c = a.pending;
    null === c ? b.next = b : (b.next = c.next, c.next = b);
    a.pending = b;
  }
  function Bi(a, b, c) {
    if (0 !== (c & 4194240)) {
      var d = b.lanes;
      d &= a.pendingLanes;
      c |= d;
      b.lanes = c;
      Cc(a, c);
    }
  }
  var Rh = { readContext: eh, useCallback: P, useContext: P, useEffect: P, useImperativeHandle: P, useInsertionEffect: P, useLayoutEffect: P, useMemo: P, useReducer: P, useRef: P, useState: P, useDebugValue: P, useDeferredValue: P, useTransition: P, useMutableSource: P, useSyncExternalStore: P, useId: P, unstable_isNewReconciler: false }, Oh = { readContext: eh, useCallback: function(a, b) {
    Th().memoizedState = [a, void 0 === b ? null : b];
    return a;
  }, useContext: eh, useEffect: mi, useImperativeHandle: function(a, b, c) {
    c = null !== c && void 0 !== c ? c.concat([a]) : null;
    return ki(
      4194308,
      4,
      pi.bind(null, b, a),
      c
    );
  }, useLayoutEffect: function(a, b) {
    return ki(4194308, 4, a, b);
  }, useInsertionEffect: function(a, b) {
    return ki(4, 2, a, b);
  }, useMemo: function(a, b) {
    var c = Th();
    b = void 0 === b ? null : b;
    a = a();
    c.memoizedState = [a, b];
    return a;
  }, useReducer: function(a, b, c) {
    var d = Th();
    b = void 0 !== c ? c(b) : b;
    d.memoizedState = d.baseState = b;
    a = { pending: null, interleaved: null, lanes: 0, dispatch: null, lastRenderedReducer: a, lastRenderedState: b };
    d.queue = a;
    a = a.dispatch = xi.bind(null, M, a);
    return [d.memoizedState, a];
  }, useRef: function(a) {
    var b = Th();
    a = { current: a };
    return b.memoizedState = a;
  }, useState: hi, useDebugValue: ri, useDeferredValue: function(a) {
    return Th().memoizedState = a;
  }, useTransition: function() {
    var a = hi(false), b = a[0];
    a = vi.bind(null, a[1]);
    Th().memoizedState = a;
    return [b, a];
  }, useMutableSource: function() {
  }, useSyncExternalStore: function(a, b, c) {
    var d = M, e = Th();
    if (I) {
      if (void 0 === c) throw Error(p(407));
      c = c();
    } else {
      c = b();
      if (null === Q) throw Error(p(349));
      0 !== (Hh & 30) || di(d, b, c);
    }
    e.memoizedState = c;
    var f = { value: c, getSnapshot: b };
    e.queue = f;
    mi(ai.bind(
      null,
      d,
      f,
      a
    ), [a]);
    d.flags |= 2048;
    bi(9, ci.bind(null, d, f, c, b), void 0, null);
    return c;
  }, useId: function() {
    var a = Th(), b = Q.identifierPrefix;
    if (I) {
      var c = sg;
      var d = rg;
      c = (d & ~(1 << 32 - oc(d) - 1)).toString(32) + c;
      b = ":" + b + "R" + c;
      c = Kh++;
      0 < c && (b += "H" + c.toString(32));
      b += ":";
    } else c = Lh++, b = ":" + b + "r" + c.toString(32) + ":";
    return a.memoizedState = b;
  }, unstable_isNewReconciler: false }, Ph = {
    readContext: eh,
    useCallback: si,
    useContext: eh,
    useEffect: $h,
    useImperativeHandle: qi,
    useInsertionEffect: ni,
    useLayoutEffect: oi,
    useMemo: ti,
    useReducer: Wh,
    useRef: ji,
    useState: function() {
      return Wh(Vh);
    },
    useDebugValue: ri,
    useDeferredValue: function(a) {
      var b = Uh();
      return ui(b, N.memoizedState, a);
    },
    useTransition: function() {
      var a = Wh(Vh)[0], b = Uh().memoizedState;
      return [a, b];
    },
    useMutableSource: Yh,
    useSyncExternalStore: Zh,
    useId: wi,
    unstable_isNewReconciler: false
  }, Qh = { readContext: eh, useCallback: si, useContext: eh, useEffect: $h, useImperativeHandle: qi, useInsertionEffect: ni, useLayoutEffect: oi, useMemo: ti, useReducer: Xh, useRef: ji, useState: function() {
    return Xh(Vh);
  }, useDebugValue: ri, useDeferredValue: function(a) {
    var b = Uh();
    return null === N ? b.memoizedState = a : ui(b, N.memoizedState, a);
  }, useTransition: function() {
    var a = Xh(Vh)[0], b = Uh().memoizedState;
    return [a, b];
  }, useMutableSource: Yh, useSyncExternalStore: Zh, useId: wi, unstable_isNewReconciler: false };
  function Ci(a, b) {
    if (a && a.defaultProps) {
      b = A2({}, b);
      a = a.defaultProps;
      for (var c in a) void 0 === b[c] && (b[c] = a[c]);
      return b;
    }
    return b;
  }
  function Di(a, b, c, d) {
    b = a.memoizedState;
    c = c(d, b);
    c = null === c || void 0 === c ? b : A2({}, b, c);
    a.memoizedState = c;
    0 === a.lanes && (a.updateQueue.baseState = c);
  }
  var Ei = { isMounted: function(a) {
    return (a = a._reactInternals) ? Vb(a) === a : false;
  }, enqueueSetState: function(a, b, c) {
    a = a._reactInternals;
    var d = R(), e = yi(a), f = mh(d, e);
    f.payload = b;
    void 0 !== c && null !== c && (f.callback = c);
    b = nh(a, f, e);
    null !== b && (gi(b, a, e, d), oh(b, a, e));
  }, enqueueReplaceState: function(a, b, c) {
    a = a._reactInternals;
    var d = R(), e = yi(a), f = mh(d, e);
    f.tag = 1;
    f.payload = b;
    void 0 !== c && null !== c && (f.callback = c);
    b = nh(a, f, e);
    null !== b && (gi(b, a, e, d), oh(b, a, e));
  }, enqueueForceUpdate: function(a, b) {
    a = a._reactInternals;
    var c = R(), d = yi(a), e = mh(c, d);
    e.tag = 2;
    void 0 !== b && null !== b && (e.callback = b);
    b = nh(a, e, d);
    null !== b && (gi(b, a, d, c), oh(b, a, d));
  } };
  function Fi(a, b, c, d, e, f, g) {
    a = a.stateNode;
    return "function" === typeof a.shouldComponentUpdate ? a.shouldComponentUpdate(d, f, g) : b.prototype && b.prototype.isPureReactComponent ? !Ie(c, d) || !Ie(e, f) : true;
  }
  function Gi(a, b, c) {
    var d = false, e = Vf;
    var f = b.contextType;
    "object" === typeof f && null !== f ? f = eh(f) : (e = Zf(b) ? Xf : H.current, d = b.contextTypes, f = (d = null !== d && void 0 !== d) ? Yf(a, e) : Vf);
    b = new b(c, f);
    a.memoizedState = null !== b.state && void 0 !== b.state ? b.state : null;
    b.updater = Ei;
    a.stateNode = b;
    b._reactInternals = a;
    d && (a = a.stateNode, a.__reactInternalMemoizedUnmaskedChildContext = e, a.__reactInternalMemoizedMaskedChildContext = f);
    return b;
  }
  function Hi(a, b, c, d) {
    a = b.state;
    "function" === typeof b.componentWillReceiveProps && b.componentWillReceiveProps(c, d);
    "function" === typeof b.UNSAFE_componentWillReceiveProps && b.UNSAFE_componentWillReceiveProps(c, d);
    b.state !== a && Ei.enqueueReplaceState(b, b.state, null);
  }
  function Ii(a, b, c, d) {
    var e = a.stateNode;
    e.props = c;
    e.state = a.memoizedState;
    e.refs = {};
    kh(a);
    var f = b.contextType;
    "object" === typeof f && null !== f ? e.context = eh(f) : (f = Zf(b) ? Xf : H.current, e.context = Yf(a, f));
    e.state = a.memoizedState;
    f = b.getDerivedStateFromProps;
    "function" === typeof f && (Di(a, b, f, c), e.state = a.memoizedState);
    "function" === typeof b.getDerivedStateFromProps || "function" === typeof e.getSnapshotBeforeUpdate || "function" !== typeof e.UNSAFE_componentWillMount && "function" !== typeof e.componentWillMount || (b = e.state, "function" === typeof e.componentWillMount && e.componentWillMount(), "function" === typeof e.UNSAFE_componentWillMount && e.UNSAFE_componentWillMount(), b !== e.state && Ei.enqueueReplaceState(e, e.state, null), qh(a, c, e, d), e.state = a.memoizedState);
    "function" === typeof e.componentDidMount && (a.flags |= 4194308);
  }
  function Ji(a, b) {
    try {
      var c = "", d = b;
      do
        c += Pa(d), d = d.return;
      while (d);
      var e = c;
    } catch (f) {
      e = "\nError generating stack: " + f.message + "\n" + f.stack;
    }
    return { value: a, source: b, stack: e, digest: null };
  }
  function Ki(a, b, c) {
    return { value: a, source: null, stack: null != c ? c : null, digest: null != b ? b : null };
  }
  function Li(a, b) {
    try {
      console.error(b.value);
    } catch (c) {
      setTimeout(function() {
        throw c;
      });
    }
  }
  var Mi = "function" === typeof WeakMap ? WeakMap : Map;
  function Ni(a, b, c) {
    c = mh(-1, c);
    c.tag = 3;
    c.payload = { element: null };
    var d = b.value;
    c.callback = function() {
      Oi || (Oi = true, Pi = d);
      Li(a, b);
    };
    return c;
  }
  function Qi(a, b, c) {
    c = mh(-1, c);
    c.tag = 3;
    var d = a.type.getDerivedStateFromError;
    if ("function" === typeof d) {
      var e = b.value;
      c.payload = function() {
        return d(e);
      };
      c.callback = function() {
        Li(a, b);
      };
    }
    var f = a.stateNode;
    null !== f && "function" === typeof f.componentDidCatch && (c.callback = function() {
      Li(a, b);
      "function" !== typeof d && (null === Ri ? Ri = /* @__PURE__ */ new Set([this]) : Ri.add(this));
      var c2 = b.stack;
      this.componentDidCatch(b.value, { componentStack: null !== c2 ? c2 : "" });
    });
    return c;
  }
  function Si(a, b, c) {
    var d = a.pingCache;
    if (null === d) {
      d = a.pingCache = new Mi();
      var e = /* @__PURE__ */ new Set();
      d.set(b, e);
    } else e = d.get(b), void 0 === e && (e = /* @__PURE__ */ new Set(), d.set(b, e));
    e.has(c) || (e.add(c), a = Ti.bind(null, a, b, c), b.then(a, a));
  }
  function Ui(a) {
    do {
      var b;
      if (b = 13 === a.tag) b = a.memoizedState, b = null !== b ? null !== b.dehydrated ? true : false : true;
      if (b) return a;
      a = a.return;
    } while (null !== a);
    return null;
  }
  function Vi(a, b, c, d, e) {
    if (0 === (a.mode & 1)) return a === b ? a.flags |= 65536 : (a.flags |= 128, c.flags |= 131072, c.flags &= -52805, 1 === c.tag && (null === c.alternate ? c.tag = 17 : (b = mh(-1, 1), b.tag = 2, nh(c, b, 1))), c.lanes |= 1), a;
    a.flags |= 65536;
    a.lanes = e;
    return a;
  }
  var Wi = ua.ReactCurrentOwner, dh = false;
  function Xi(a, b, c, d) {
    b.child = null === a ? Vg(b, null, c, d) : Ug(b, a.child, c, d);
  }
  function Yi(a, b, c, d, e) {
    c = c.render;
    var f = b.ref;
    ch(b, e);
    d = Nh(a, b, c, d, f, e);
    c = Sh();
    if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
    I && c && vg(b);
    b.flags |= 1;
    Xi(a, b, d, e);
    return b.child;
  }
  function $i(a, b, c, d, e) {
    if (null === a) {
      var f = c.type;
      if ("function" === typeof f && !aj(f) && void 0 === f.defaultProps && null === c.compare && void 0 === c.defaultProps) return b.tag = 15, b.type = f, bj(a, b, f, d, e);
      a = Rg(c.type, null, d, b, b.mode, e);
      a.ref = b.ref;
      a.return = b;
      return b.child = a;
    }
    f = a.child;
    if (0 === (a.lanes & e)) {
      var g = f.memoizedProps;
      c = c.compare;
      c = null !== c ? c : Ie;
      if (c(g, d) && a.ref === b.ref) return Zi(a, b, e);
    }
    b.flags |= 1;
    a = Pg(f, d);
    a.ref = b.ref;
    a.return = b;
    return b.child = a;
  }
  function bj(a, b, c, d, e) {
    if (null !== a) {
      var f = a.memoizedProps;
      if (Ie(f, d) && a.ref === b.ref) if (dh = false, b.pendingProps = d = f, 0 !== (a.lanes & e)) 0 !== (a.flags & 131072) && (dh = true);
      else return b.lanes = a.lanes, Zi(a, b, e);
    }
    return cj(a, b, c, d, e);
  }
  function dj(a, b, c) {
    var d = b.pendingProps, e = d.children, f = null !== a ? a.memoizedState : null;
    if ("hidden" === d.mode) if (0 === (b.mode & 1)) b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null }, G(ej, fj), fj |= c;
    else {
      if (0 === (c & 1073741824)) return a = null !== f ? f.baseLanes | c : c, b.lanes = b.childLanes = 1073741824, b.memoizedState = { baseLanes: a, cachePool: null, transitions: null }, b.updateQueue = null, G(ej, fj), fj |= a, null;
      b.memoizedState = { baseLanes: 0, cachePool: null, transitions: null };
      d = null !== f ? f.baseLanes : c;
      G(ej, fj);
      fj |= d;
    }
    else null !== f ? (d = f.baseLanes | c, b.memoizedState = null) : d = c, G(ej, fj), fj |= d;
    Xi(a, b, e, c);
    return b.child;
  }
  function gj(a, b) {
    var c = b.ref;
    if (null === a && null !== c || null !== a && a.ref !== c) b.flags |= 512, b.flags |= 2097152;
  }
  function cj(a, b, c, d, e) {
    var f = Zf(c) ? Xf : H.current;
    f = Yf(b, f);
    ch(b, e);
    c = Nh(a, b, c, d, f, e);
    d = Sh();
    if (null !== a && !dh) return b.updateQueue = a.updateQueue, b.flags &= -2053, a.lanes &= ~e, Zi(a, b, e);
    I && d && vg(b);
    b.flags |= 1;
    Xi(a, b, c, e);
    return b.child;
  }
  function hj(a, b, c, d, e) {
    if (Zf(c)) {
      var f = true;
      cg(b);
    } else f = false;
    ch(b, e);
    if (null === b.stateNode) ij(a, b), Gi(b, c, d), Ii(b, c, d, e), d = true;
    else if (null === a) {
      var g = b.stateNode, h = b.memoizedProps;
      g.props = h;
      var k = g.context, l = c.contextType;
      "object" === typeof l && null !== l ? l = eh(l) : (l = Zf(c) ? Xf : H.current, l = Yf(b, l));
      var m = c.getDerivedStateFromProps, q = "function" === typeof m || "function" === typeof g.getSnapshotBeforeUpdate;
      q || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== d || k !== l) && Hi(b, g, d, l);
      jh = false;
      var r = b.memoizedState;
      g.state = r;
      qh(b, d, g, e);
      k = b.memoizedState;
      h !== d || r !== k || Wf.current || jh ? ("function" === typeof m && (Di(b, c, m, d), k = b.memoizedState), (h = jh || Fi(b, c, h, d, r, k, l)) ? (q || "function" !== typeof g.UNSAFE_componentWillMount && "function" !== typeof g.componentWillMount || ("function" === typeof g.componentWillMount && g.componentWillMount(), "function" === typeof g.UNSAFE_componentWillMount && g.UNSAFE_componentWillMount()), "function" === typeof g.componentDidMount && (b.flags |= 4194308)) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), b.memoizedProps = d, b.memoizedState = k), g.props = d, g.state = k, g.context = l, d = h) : ("function" === typeof g.componentDidMount && (b.flags |= 4194308), d = false);
    } else {
      g = b.stateNode;
      lh(a, b);
      h = b.memoizedProps;
      l = b.type === b.elementType ? h : Ci(b.type, h);
      g.props = l;
      q = b.pendingProps;
      r = g.context;
      k = c.contextType;
      "object" === typeof k && null !== k ? k = eh(k) : (k = Zf(c) ? Xf : H.current, k = Yf(b, k));
      var y = c.getDerivedStateFromProps;
      (m = "function" === typeof y || "function" === typeof g.getSnapshotBeforeUpdate) || "function" !== typeof g.UNSAFE_componentWillReceiveProps && "function" !== typeof g.componentWillReceiveProps || (h !== q || r !== k) && Hi(b, g, d, k);
      jh = false;
      r = b.memoizedState;
      g.state = r;
      qh(b, d, g, e);
      var n = b.memoizedState;
      h !== q || r !== n || Wf.current || jh ? ("function" === typeof y && (Di(b, c, y, d), n = b.memoizedState), (l = jh || Fi(b, c, l, d, r, n, k) || false) ? (m || "function" !== typeof g.UNSAFE_componentWillUpdate && "function" !== typeof g.componentWillUpdate || ("function" === typeof g.componentWillUpdate && g.componentWillUpdate(d, n, k), "function" === typeof g.UNSAFE_componentWillUpdate && g.UNSAFE_componentWillUpdate(d, n, k)), "function" === typeof g.componentDidUpdate && (b.flags |= 4), "function" === typeof g.getSnapshotBeforeUpdate && (b.flags |= 1024)) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), b.memoizedProps = d, b.memoizedState = n), g.props = d, g.state = n, g.context = k, d = l) : ("function" !== typeof g.componentDidUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 4), "function" !== typeof g.getSnapshotBeforeUpdate || h === a.memoizedProps && r === a.memoizedState || (b.flags |= 1024), d = false);
    }
    return jj(a, b, c, d, f, e);
  }
  function jj(a, b, c, d, e, f) {
    gj(a, b);
    var g = 0 !== (b.flags & 128);
    if (!d && !g) return e && dg(b, c, false), Zi(a, b, f);
    d = b.stateNode;
    Wi.current = b;
    var h = g && "function" !== typeof c.getDerivedStateFromError ? null : d.render();
    b.flags |= 1;
    null !== a && g ? (b.child = Ug(b, a.child, null, f), b.child = Ug(b, null, h, f)) : Xi(a, b, h, f);
    b.memoizedState = d.state;
    e && dg(b, c, true);
    return b.child;
  }
  function kj(a) {
    var b = a.stateNode;
    b.pendingContext ? ag(a, b.pendingContext, b.pendingContext !== b.context) : b.context && ag(a, b.context, false);
    yh(a, b.containerInfo);
  }
  function lj(a, b, c, d, e) {
    Ig();
    Jg(e);
    b.flags |= 256;
    Xi(a, b, c, d);
    return b.child;
  }
  var mj = { dehydrated: null, treeContext: null, retryLane: 0 };
  function nj(a) {
    return { baseLanes: a, cachePool: null, transitions: null };
  }
  function oj(a, b, c) {
    var d = b.pendingProps, e = L.current, f = false, g = 0 !== (b.flags & 128), h;
    (h = g) || (h = null !== a && null === a.memoizedState ? false : 0 !== (e & 2));
    if (h) f = true, b.flags &= -129;
    else if (null === a || null !== a.memoizedState) e |= 1;
    G(L, e & 1);
    if (null === a) {
      Eg(b);
      a = b.memoizedState;
      if (null !== a && (a = a.dehydrated, null !== a)) return 0 === (b.mode & 1) ? b.lanes = 1 : "$!" === a.data ? b.lanes = 8 : b.lanes = 1073741824, null;
      g = d.children;
      a = d.fallback;
      return f ? (d = b.mode, f = b.child, g = { mode: "hidden", children: g }, 0 === (d & 1) && null !== f ? (f.childLanes = 0, f.pendingProps = g) : f = pj(g, d, 0, null), a = Tg(a, d, c, null), f.return = b, a.return = b, f.sibling = a, b.child = f, b.child.memoizedState = nj(c), b.memoizedState = mj, a) : qj(b, g);
    }
    e = a.memoizedState;
    if (null !== e && (h = e.dehydrated, null !== h)) return rj(a, b, g, d, h, e, c);
    if (f) {
      f = d.fallback;
      g = b.mode;
      e = a.child;
      h = e.sibling;
      var k = { mode: "hidden", children: d.children };
      0 === (g & 1) && b.child !== e ? (d = b.child, d.childLanes = 0, d.pendingProps = k, b.deletions = null) : (d = Pg(e, k), d.subtreeFlags = e.subtreeFlags & 14680064);
      null !== h ? f = Pg(h, f) : (f = Tg(f, g, c, null), f.flags |= 2);
      f.return = b;
      d.return = b;
      d.sibling = f;
      b.child = d;
      d = f;
      f = b.child;
      g = a.child.memoizedState;
      g = null === g ? nj(c) : { baseLanes: g.baseLanes | c, cachePool: null, transitions: g.transitions };
      f.memoizedState = g;
      f.childLanes = a.childLanes & ~c;
      b.memoizedState = mj;
      return d;
    }
    f = a.child;
    a = f.sibling;
    d = Pg(f, { mode: "visible", children: d.children });
    0 === (b.mode & 1) && (d.lanes = c);
    d.return = b;
    d.sibling = null;
    null !== a && (c = b.deletions, null === c ? (b.deletions = [a], b.flags |= 16) : c.push(a));
    b.child = d;
    b.memoizedState = null;
    return d;
  }
  function qj(a, b) {
    b = pj({ mode: "visible", children: b }, a.mode, 0, null);
    b.return = a;
    return a.child = b;
  }
  function sj(a, b, c, d) {
    null !== d && Jg(d);
    Ug(b, a.child, null, c);
    a = qj(b, b.pendingProps.children);
    a.flags |= 2;
    b.memoizedState = null;
    return a;
  }
  function rj(a, b, c, d, e, f, g) {
    if (c) {
      if (b.flags & 256) return b.flags &= -257, d = Ki(Error(p(422))), sj(a, b, g, d);
      if (null !== b.memoizedState) return b.child = a.child, b.flags |= 128, null;
      f = d.fallback;
      e = b.mode;
      d = pj({ mode: "visible", children: d.children }, e, 0, null);
      f = Tg(f, e, g, null);
      f.flags |= 2;
      d.return = b;
      f.return = b;
      d.sibling = f;
      b.child = d;
      0 !== (b.mode & 1) && Ug(b, a.child, null, g);
      b.child.memoizedState = nj(g);
      b.memoizedState = mj;
      return f;
    }
    if (0 === (b.mode & 1)) return sj(a, b, g, null);
    if ("$!" === e.data) {
      d = e.nextSibling && e.nextSibling.dataset;
      if (d) var h = d.dgst;
      d = h;
      f = Error(p(419));
      d = Ki(f, d, void 0);
      return sj(a, b, g, d);
    }
    h = 0 !== (g & a.childLanes);
    if (dh || h) {
      d = Q;
      if (null !== d) {
        switch (g & -g) {
          case 4:
            e = 2;
            break;
          case 16:
            e = 8;
            break;
          case 64:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
          case 67108864:
            e = 32;
            break;
          case 536870912:
            e = 268435456;
            break;
          default:
            e = 0;
        }
        e = 0 !== (e & (d.suspendedLanes | g)) ? 0 : e;
        0 !== e && e !== f.retryLane && (f.retryLane = e, ih(a, e), gi(d, a, e, -1));
      }
      tj();
      d = Ki(Error(p(421)));
      return sj(a, b, g, d);
    }
    if ("$?" === e.data) return b.flags |= 128, b.child = a.child, b = uj.bind(null, a), e._reactRetry = b, null;
    a = f.treeContext;
    yg = Lf(e.nextSibling);
    xg = b;
    I = true;
    zg = null;
    null !== a && (og[pg++] = rg, og[pg++] = sg, og[pg++] = qg, rg = a.id, sg = a.overflow, qg = b);
    b = qj(b, d.children);
    b.flags |= 4096;
    return b;
  }
  function vj(a, b, c) {
    a.lanes |= b;
    var d = a.alternate;
    null !== d && (d.lanes |= b);
    bh(a.return, b, c);
  }
  function wj(a, b, c, d, e) {
    var f = a.memoizedState;
    null === f ? a.memoizedState = { isBackwards: b, rendering: null, renderingStartTime: 0, last: d, tail: c, tailMode: e } : (f.isBackwards = b, f.rendering = null, f.renderingStartTime = 0, f.last = d, f.tail = c, f.tailMode = e);
  }
  function xj(a, b, c) {
    var d = b.pendingProps, e = d.revealOrder, f = d.tail;
    Xi(a, b, d.children, c);
    d = L.current;
    if (0 !== (d & 2)) d = d & 1 | 2, b.flags |= 128;
    else {
      if (null !== a && 0 !== (a.flags & 128)) a: for (a = b.child; null !== a; ) {
        if (13 === a.tag) null !== a.memoizedState && vj(a, c, b);
        else if (19 === a.tag) vj(a, c, b);
        else if (null !== a.child) {
          a.child.return = a;
          a = a.child;
          continue;
        }
        if (a === b) break a;
        for (; null === a.sibling; ) {
          if (null === a.return || a.return === b) break a;
          a = a.return;
        }
        a.sibling.return = a.return;
        a = a.sibling;
      }
      d &= 1;
    }
    G(L, d);
    if (0 === (b.mode & 1)) b.memoizedState = null;
    else switch (e) {
      case "forwards":
        c = b.child;
        for (e = null; null !== c; ) a = c.alternate, null !== a && null === Ch(a) && (e = c), c = c.sibling;
        c = e;
        null === c ? (e = b.child, b.child = null) : (e = c.sibling, c.sibling = null);
        wj(b, false, e, c, f);
        break;
      case "backwards":
        c = null;
        e = b.child;
        for (b.child = null; null !== e; ) {
          a = e.alternate;
          if (null !== a && null === Ch(a)) {
            b.child = e;
            break;
          }
          a = e.sibling;
          e.sibling = c;
          c = e;
          e = a;
        }
        wj(b, true, c, null, f);
        break;
      case "together":
        wj(b, false, null, null, void 0);
        break;
      default:
        b.memoizedState = null;
    }
    return b.child;
  }
  function ij(a, b) {
    0 === (b.mode & 1) && null !== a && (a.alternate = null, b.alternate = null, b.flags |= 2);
  }
  function Zi(a, b, c) {
    null !== a && (b.dependencies = a.dependencies);
    rh |= b.lanes;
    if (0 === (c & b.childLanes)) return null;
    if (null !== a && b.child !== a.child) throw Error(p(153));
    if (null !== b.child) {
      a = b.child;
      c = Pg(a, a.pendingProps);
      b.child = c;
      for (c.return = b; null !== a.sibling; ) a = a.sibling, c = c.sibling = Pg(a, a.pendingProps), c.return = b;
      c.sibling = null;
    }
    return b.child;
  }
  function yj(a, b, c) {
    switch (b.tag) {
      case 3:
        kj(b);
        Ig();
        break;
      case 5:
        Ah(b);
        break;
      case 1:
        Zf(b.type) && cg(b);
        break;
      case 4:
        yh(b, b.stateNode.containerInfo);
        break;
      case 10:
        var d = b.type._context, e = b.memoizedProps.value;
        G(Wg, d._currentValue);
        d._currentValue = e;
        break;
      case 13:
        d = b.memoizedState;
        if (null !== d) {
          if (null !== d.dehydrated) return G(L, L.current & 1), b.flags |= 128, null;
          if (0 !== (c & b.child.childLanes)) return oj(a, b, c);
          G(L, L.current & 1);
          a = Zi(a, b, c);
          return null !== a ? a.sibling : null;
        }
        G(L, L.current & 1);
        break;
      case 19:
        d = 0 !== (c & b.childLanes);
        if (0 !== (a.flags & 128)) {
          if (d) return xj(a, b, c);
          b.flags |= 128;
        }
        e = b.memoizedState;
        null !== e && (e.rendering = null, e.tail = null, e.lastEffect = null);
        G(L, L.current);
        if (d) break;
        else return null;
      case 22:
      case 23:
        return b.lanes = 0, dj(a, b, c);
    }
    return Zi(a, b, c);
  }
  var zj, Aj, Bj, Cj;
  zj = function(a, b) {
    for (var c = b.child; null !== c; ) {
      if (5 === c.tag || 6 === c.tag) a.appendChild(c.stateNode);
      else if (4 !== c.tag && null !== c.child) {
        c.child.return = c;
        c = c.child;
        continue;
      }
      if (c === b) break;
      for (; null === c.sibling; ) {
        if (null === c.return || c.return === b) return;
        c = c.return;
      }
      c.sibling.return = c.return;
      c = c.sibling;
    }
  };
  Aj = function() {
  };
  Bj = function(a, b, c, d) {
    var e = a.memoizedProps;
    if (e !== d) {
      a = b.stateNode;
      xh(uh.current);
      var f = null;
      switch (c) {
        case "input":
          e = Ya(a, e);
          d = Ya(a, d);
          f = [];
          break;
        case "select":
          e = A2({}, e, { value: void 0 });
          d = A2({}, d, { value: void 0 });
          f = [];
          break;
        case "textarea":
          e = gb(a, e);
          d = gb(a, d);
          f = [];
          break;
        default:
          "function" !== typeof e.onClick && "function" === typeof d.onClick && (a.onclick = Bf);
      }
      ub(c, d);
      var g;
      c = null;
      for (l in e) if (!d.hasOwnProperty(l) && e.hasOwnProperty(l) && null != e[l]) if ("style" === l) {
        var h = e[l];
        for (g in h) h.hasOwnProperty(g) && (c || (c = {}), c[g] = "");
      } else "dangerouslySetInnerHTML" !== l && "children" !== l && "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && "autoFocus" !== l && (ea.hasOwnProperty(l) ? f || (f = []) : (f = f || []).push(l, null));
      for (l in d) {
        var k = d[l];
        h = null != e ? e[l] : void 0;
        if (d.hasOwnProperty(l) && k !== h && (null != k || null != h)) if ("style" === l) if (h) {
          for (g in h) !h.hasOwnProperty(g) || k && k.hasOwnProperty(g) || (c || (c = {}), c[g] = "");
          for (g in k) k.hasOwnProperty(g) && h[g] !== k[g] && (c || (c = {}), c[g] = k[g]);
        } else c || (f || (f = []), f.push(
          l,
          c
        )), c = k;
        else "dangerouslySetInnerHTML" === l ? (k = k ? k.__html : void 0, h = h ? h.__html : void 0, null != k && h !== k && (f = f || []).push(l, k)) : "children" === l ? "string" !== typeof k && "number" !== typeof k || (f = f || []).push(l, "" + k) : "suppressContentEditableWarning" !== l && "suppressHydrationWarning" !== l && (ea.hasOwnProperty(l) ? (null != k && "onScroll" === l && D("scroll", a), f || h === k || (f = [])) : (f = f || []).push(l, k));
      }
      c && (f = f || []).push("style", c);
      var l = f;
      if (b.updateQueue = l) b.flags |= 4;
    }
  };
  Cj = function(a, b, c, d) {
    c !== d && (b.flags |= 4);
  };
  function Dj(a, b) {
    if (!I) switch (a.tailMode) {
      case "hidden":
        b = a.tail;
        for (var c = null; null !== b; ) null !== b.alternate && (c = b), b = b.sibling;
        null === c ? a.tail = null : c.sibling = null;
        break;
      case "collapsed":
        c = a.tail;
        for (var d = null; null !== c; ) null !== c.alternate && (d = c), c = c.sibling;
        null === d ? b || null === a.tail ? a.tail = null : a.tail.sibling = null : d.sibling = null;
    }
  }
  function S(a) {
    var b = null !== a.alternate && a.alternate.child === a.child, c = 0, d = 0;
    if (b) for (var e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags & 14680064, d |= e.flags & 14680064, e.return = a, e = e.sibling;
    else for (e = a.child; null !== e; ) c |= e.lanes | e.childLanes, d |= e.subtreeFlags, d |= e.flags, e.return = a, e = e.sibling;
    a.subtreeFlags |= d;
    a.childLanes = c;
    return b;
  }
  function Ej(a, b, c) {
    var d = b.pendingProps;
    wg(b);
    switch (b.tag) {
      case 2:
      case 16:
      case 15:
      case 0:
      case 11:
      case 7:
      case 8:
      case 12:
      case 9:
      case 14:
        return S(b), null;
      case 1:
        return Zf(b.type) && $f(), S(b), null;
      case 3:
        d = b.stateNode;
        zh();
        E(Wf);
        E(H);
        Eh();
        d.pendingContext && (d.context = d.pendingContext, d.pendingContext = null);
        if (null === a || null === a.child) Gg(b) ? b.flags |= 4 : null === a || a.memoizedState.isDehydrated && 0 === (b.flags & 256) || (b.flags |= 1024, null !== zg && (Fj(zg), zg = null));
        Aj(a, b);
        S(b);
        return null;
      case 5:
        Bh(b);
        var e = xh(wh.current);
        c = b.type;
        if (null !== a && null != b.stateNode) Bj(a, b, c, d, e), a.ref !== b.ref && (b.flags |= 512, b.flags |= 2097152);
        else {
          if (!d) {
            if (null === b.stateNode) throw Error(p(166));
            S(b);
            return null;
          }
          a = xh(uh.current);
          if (Gg(b)) {
            d = b.stateNode;
            c = b.type;
            var f = b.memoizedProps;
            d[Of] = b;
            d[Pf] = f;
            a = 0 !== (b.mode & 1);
            switch (c) {
              case "dialog":
                D("cancel", d);
                D("close", d);
                break;
              case "iframe":
              case "object":
              case "embed":
                D("load", d);
                break;
              case "video":
              case "audio":
                for (e = 0; e < lf.length; e++) D(lf[e], d);
                break;
              case "source":
                D("error", d);
                break;
              case "img":
              case "image":
              case "link":
                D(
                  "error",
                  d
                );
                D("load", d);
                break;
              case "details":
                D("toggle", d);
                break;
              case "input":
                Za(d, f);
                D("invalid", d);
                break;
              case "select":
                d._wrapperState = { wasMultiple: !!f.multiple };
                D("invalid", d);
                break;
              case "textarea":
                hb(d, f), D("invalid", d);
            }
            ub(c, f);
            e = null;
            for (var g in f) if (f.hasOwnProperty(g)) {
              var h = f[g];
              "children" === g ? "string" === typeof h ? d.textContent !== h && (true !== f.suppressHydrationWarning && Af(d.textContent, h, a), e = ["children", h]) : "number" === typeof h && d.textContent !== "" + h && (true !== f.suppressHydrationWarning && Af(
                d.textContent,
                h,
                a
              ), e = ["children", "" + h]) : ea.hasOwnProperty(g) && null != h && "onScroll" === g && D("scroll", d);
            }
            switch (c) {
              case "input":
                Va(d);
                db(d, f, true);
                break;
              case "textarea":
                Va(d);
                jb(d);
                break;
              case "select":
              case "option":
                break;
              default:
                "function" === typeof f.onClick && (d.onclick = Bf);
            }
            d = e;
            b.updateQueue = d;
            null !== d && (b.flags |= 4);
          } else {
            g = 9 === e.nodeType ? e : e.ownerDocument;
            "http://www.w3.org/1999/xhtml" === a && (a = kb(c));
            "http://www.w3.org/1999/xhtml" === a ? "script" === c ? (a = g.createElement("div"), a.innerHTML = "<script><\/script>", a = a.removeChild(a.firstChild)) : "string" === typeof d.is ? a = g.createElement(c, { is: d.is }) : (a = g.createElement(c), "select" === c && (g = a, d.multiple ? g.multiple = true : d.size && (g.size = d.size))) : a = g.createElementNS(a, c);
            a[Of] = b;
            a[Pf] = d;
            zj(a, b, false, false);
            b.stateNode = a;
            a: {
              g = vb(c, d);
              switch (c) {
                case "dialog":
                  D("cancel", a);
                  D("close", a);
                  e = d;
                  break;
                case "iframe":
                case "object":
                case "embed":
                  D("load", a);
                  e = d;
                  break;
                case "video":
                case "audio":
                  for (e = 0; e < lf.length; e++) D(lf[e], a);
                  e = d;
                  break;
                case "source":
                  D("error", a);
                  e = d;
                  break;
                case "img":
                case "image":
                case "link":
                  D(
                    "error",
                    a
                  );
                  D("load", a);
                  e = d;
                  break;
                case "details":
                  D("toggle", a);
                  e = d;
                  break;
                case "input":
                  Za(a, d);
                  e = Ya(a, d);
                  D("invalid", a);
                  break;
                case "option":
                  e = d;
                  break;
                case "select":
                  a._wrapperState = { wasMultiple: !!d.multiple };
                  e = A2({}, d, { value: void 0 });
                  D("invalid", a);
                  break;
                case "textarea":
                  hb(a, d);
                  e = gb(a, d);
                  D("invalid", a);
                  break;
                default:
                  e = d;
              }
              ub(c, e);
              h = e;
              for (f in h) if (h.hasOwnProperty(f)) {
                var k = h[f];
                "style" === f ? sb(a, k) : "dangerouslySetInnerHTML" === f ? (k = k ? k.__html : void 0, null != k && nb(a, k)) : "children" === f ? "string" === typeof k ? ("textarea" !== c || "" !== k) && ob(a, k) : "number" === typeof k && ob(a, "" + k) : "suppressContentEditableWarning" !== f && "suppressHydrationWarning" !== f && "autoFocus" !== f && (ea.hasOwnProperty(f) ? null != k && "onScroll" === f && D("scroll", a) : null != k && ta(a, f, k, g));
              }
              switch (c) {
                case "input":
                  Va(a);
                  db(a, d, false);
                  break;
                case "textarea":
                  Va(a);
                  jb(a);
                  break;
                case "option":
                  null != d.value && a.setAttribute("value", "" + Sa(d.value));
                  break;
                case "select":
                  a.multiple = !!d.multiple;
                  f = d.value;
                  null != f ? fb(a, !!d.multiple, f, false) : null != d.defaultValue && fb(
                    a,
                    !!d.multiple,
                    d.defaultValue,
                    true
                  );
                  break;
                default:
                  "function" === typeof e.onClick && (a.onclick = Bf);
              }
              switch (c) {
                case "button":
                case "input":
                case "select":
                case "textarea":
                  d = !!d.autoFocus;
                  break a;
                case "img":
                  d = true;
                  break a;
                default:
                  d = false;
              }
            }
            d && (b.flags |= 4);
          }
          null !== b.ref && (b.flags |= 512, b.flags |= 2097152);
        }
        S(b);
        return null;
      case 6:
        if (a && null != b.stateNode) Cj(a, b, a.memoizedProps, d);
        else {
          if ("string" !== typeof d && null === b.stateNode) throw Error(p(166));
          c = xh(wh.current);
          xh(uh.current);
          if (Gg(b)) {
            d = b.stateNode;
            c = b.memoizedProps;
            d[Of] = b;
            if (f = d.nodeValue !== c) {
              if (a = xg, null !== a) switch (a.tag) {
                case 3:
                  Af(d.nodeValue, c, 0 !== (a.mode & 1));
                  break;
                case 5:
                  true !== a.memoizedProps.suppressHydrationWarning && Af(d.nodeValue, c, 0 !== (a.mode & 1));
              }
            }
            f && (b.flags |= 4);
          } else d = (9 === c.nodeType ? c : c.ownerDocument).createTextNode(d), d[Of] = b, b.stateNode = d;
        }
        S(b);
        return null;
      case 13:
        E(L);
        d = b.memoizedState;
        if (null === a || null !== a.memoizedState && null !== a.memoizedState.dehydrated) {
          if (I && null !== yg && 0 !== (b.mode & 1) && 0 === (b.flags & 128)) Hg(), Ig(), b.flags |= 98560, f = false;
          else if (f = Gg(b), null !== d && null !== d.dehydrated) {
            if (null === a) {
              if (!f) throw Error(p(318));
              f = b.memoizedState;
              f = null !== f ? f.dehydrated : null;
              if (!f) throw Error(p(317));
              f[Of] = b;
            } else Ig(), 0 === (b.flags & 128) && (b.memoizedState = null), b.flags |= 4;
            S(b);
            f = false;
          } else null !== zg && (Fj(zg), zg = null), f = true;
          if (!f) return b.flags & 65536 ? b : null;
        }
        if (0 !== (b.flags & 128)) return b.lanes = c, b;
        d = null !== d;
        d !== (null !== a && null !== a.memoizedState) && d && (b.child.flags |= 8192, 0 !== (b.mode & 1) && (null === a || 0 !== (L.current & 1) ? 0 === T && (T = 3) : tj()));
        null !== b.updateQueue && (b.flags |= 4);
        S(b);
        return null;
      case 4:
        return zh(), Aj(a, b), null === a && sf(b.stateNode.containerInfo), S(b), null;
      case 10:
        return ah(b.type._context), S(b), null;
      case 17:
        return Zf(b.type) && $f(), S(b), null;
      case 19:
        E(L);
        f = b.memoizedState;
        if (null === f) return S(b), null;
        d = 0 !== (b.flags & 128);
        g = f.rendering;
        if (null === g) if (d) Dj(f, false);
        else {
          if (0 !== T || null !== a && 0 !== (a.flags & 128)) for (a = b.child; null !== a; ) {
            g = Ch(a);
            if (null !== g) {
              b.flags |= 128;
              Dj(f, false);
              d = g.updateQueue;
              null !== d && (b.updateQueue = d, b.flags |= 4);
              b.subtreeFlags = 0;
              d = c;
              for (c = b.child; null !== c; ) f = c, a = d, f.flags &= 14680066, g = f.alternate, null === g ? (f.childLanes = 0, f.lanes = a, f.child = null, f.subtreeFlags = 0, f.memoizedProps = null, f.memoizedState = null, f.updateQueue = null, f.dependencies = null, f.stateNode = null) : (f.childLanes = g.childLanes, f.lanes = g.lanes, f.child = g.child, f.subtreeFlags = 0, f.deletions = null, f.memoizedProps = g.memoizedProps, f.memoizedState = g.memoizedState, f.updateQueue = g.updateQueue, f.type = g.type, a = g.dependencies, f.dependencies = null === a ? null : { lanes: a.lanes, firstContext: a.firstContext }), c = c.sibling;
              G(L, L.current & 1 | 2);
              return b.child;
            }
            a = a.sibling;
          }
          null !== f.tail && B() > Gj && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
        }
        else {
          if (!d) if (a = Ch(g), null !== a) {
            if (b.flags |= 128, d = true, c = a.updateQueue, null !== c && (b.updateQueue = c, b.flags |= 4), Dj(f, true), null === f.tail && "hidden" === f.tailMode && !g.alternate && !I) return S(b), null;
          } else 2 * B() - f.renderingStartTime > Gj && 1073741824 !== c && (b.flags |= 128, d = true, Dj(f, false), b.lanes = 4194304);
          f.isBackwards ? (g.sibling = b.child, b.child = g) : (c = f.last, null !== c ? c.sibling = g : b.child = g, f.last = g);
        }
        if (null !== f.tail) return b = f.tail, f.rendering = b, f.tail = b.sibling, f.renderingStartTime = B(), b.sibling = null, c = L.current, G(L, d ? c & 1 | 2 : c & 1), b;
        S(b);
        return null;
      case 22:
      case 23:
        return Hj(), d = null !== b.memoizedState, null !== a && null !== a.memoizedState !== d && (b.flags |= 8192), d && 0 !== (b.mode & 1) ? 0 !== (fj & 1073741824) && (S(b), b.subtreeFlags & 6 && (b.flags |= 8192)) : S(b), null;
      case 24:
        return null;
      case 25:
        return null;
    }
    throw Error(p(156, b.tag));
  }
  function Ij(a, b) {
    wg(b);
    switch (b.tag) {
      case 1:
        return Zf(b.type) && $f(), a = b.flags, a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
      case 3:
        return zh(), E(Wf), E(H), Eh(), a = b.flags, 0 !== (a & 65536) && 0 === (a & 128) ? (b.flags = a & -65537 | 128, b) : null;
      case 5:
        return Bh(b), null;
      case 13:
        E(L);
        a = b.memoizedState;
        if (null !== a && null !== a.dehydrated) {
          if (null === b.alternate) throw Error(p(340));
          Ig();
        }
        a = b.flags;
        return a & 65536 ? (b.flags = a & -65537 | 128, b) : null;
      case 19:
        return E(L), null;
      case 4:
        return zh(), null;
      case 10:
        return ah(b.type._context), null;
      case 22:
      case 23:
        return Hj(), null;
      case 24:
        return null;
      default:
        return null;
    }
  }
  var Jj = false, U = false, Kj = "function" === typeof WeakSet ? WeakSet : Set, V = null;
  function Lj(a, b) {
    var c = a.ref;
    if (null !== c) if ("function" === typeof c) try {
      c(null);
    } catch (d) {
      W(a, b, d);
    }
    else c.current = null;
  }
  function Mj(a, b, c) {
    try {
      c();
    } catch (d) {
      W(a, b, d);
    }
  }
  var Nj = false;
  function Oj(a, b) {
    Cf = dd;
    a = Me();
    if (Ne(a)) {
      if ("selectionStart" in a) var c = { start: a.selectionStart, end: a.selectionEnd };
      else a: {
        c = (c = a.ownerDocument) && c.defaultView || window;
        var d = c.getSelection && c.getSelection();
        if (d && 0 !== d.rangeCount) {
          c = d.anchorNode;
          var e = d.anchorOffset, f = d.focusNode;
          d = d.focusOffset;
          try {
            c.nodeType, f.nodeType;
          } catch (F) {
            c = null;
            break a;
          }
          var g = 0, h = -1, k = -1, l = 0, m = 0, q = a, r = null;
          b: for (; ; ) {
            for (var y; ; ) {
              q !== c || 0 !== e && 3 !== q.nodeType || (h = g + e);
              q !== f || 0 !== d && 3 !== q.nodeType || (k = g + d);
              3 === q.nodeType && (g += q.nodeValue.length);
              if (null === (y = q.firstChild)) break;
              r = q;
              q = y;
            }
            for (; ; ) {
              if (q === a) break b;
              r === c && ++l === e && (h = g);
              r === f && ++m === d && (k = g);
              if (null !== (y = q.nextSibling)) break;
              q = r;
              r = q.parentNode;
            }
            q = y;
          }
          c = -1 === h || -1 === k ? null : { start: h, end: k };
        } else c = null;
      }
      c = c || { start: 0, end: 0 };
    } else c = null;
    Df = { focusedElem: a, selectionRange: c };
    dd = false;
    for (V = b; null !== V; ) if (b = V, a = b.child, 0 !== (b.subtreeFlags & 1028) && null !== a) a.return = b, V = a;
    else for (; null !== V; ) {
      b = V;
      try {
        var n = b.alternate;
        if (0 !== (b.flags & 1024)) switch (b.tag) {
          case 0:
          case 11:
          case 15:
            break;
          case 1:
            if (null !== n) {
              var t2 = n.memoizedProps, J = n.memoizedState, x = b.stateNode, w = x.getSnapshotBeforeUpdate(b.elementType === b.type ? t2 : Ci(b.type, t2), J);
              x.__reactInternalSnapshotBeforeUpdate = w;
            }
            break;
          case 3:
            var u = b.stateNode.containerInfo;
            1 === u.nodeType ? u.textContent = "" : 9 === u.nodeType && u.documentElement && u.removeChild(u.documentElement);
            break;
          case 5:
          case 6:
          case 4:
          case 17:
            break;
          default:
            throw Error(p(163));
        }
      } catch (F) {
        W(b, b.return, F);
      }
      a = b.sibling;
      if (null !== a) {
        a.return = b.return;
        V = a;
        break;
      }
      V = b.return;
    }
    n = Nj;
    Nj = false;
    return n;
  }
  function Pj(a, b, c) {
    var d = b.updateQueue;
    d = null !== d ? d.lastEffect : null;
    if (null !== d) {
      var e = d = d.next;
      do {
        if ((e.tag & a) === a) {
          var f = e.destroy;
          e.destroy = void 0;
          void 0 !== f && Mj(b, c, f);
        }
        e = e.next;
      } while (e !== d);
    }
  }
  function Qj(a, b) {
    b = b.updateQueue;
    b = null !== b ? b.lastEffect : null;
    if (null !== b) {
      var c = b = b.next;
      do {
        if ((c.tag & a) === a) {
          var d = c.create;
          c.destroy = d();
        }
        c = c.next;
      } while (c !== b);
    }
  }
  function Rj(a) {
    var b = a.ref;
    if (null !== b) {
      var c = a.stateNode;
      switch (a.tag) {
        case 5:
          a = c;
          break;
        default:
          a = c;
      }
      "function" === typeof b ? b(a) : b.current = a;
    }
  }
  function Sj(a) {
    var b = a.alternate;
    null !== b && (a.alternate = null, Sj(b));
    a.child = null;
    a.deletions = null;
    a.sibling = null;
    5 === a.tag && (b = a.stateNode, null !== b && (delete b[Of], delete b[Pf], delete b[of], delete b[Qf], delete b[Rf]));
    a.stateNode = null;
    a.return = null;
    a.dependencies = null;
    a.memoizedProps = null;
    a.memoizedState = null;
    a.pendingProps = null;
    a.stateNode = null;
    a.updateQueue = null;
  }
  function Tj(a) {
    return 5 === a.tag || 3 === a.tag || 4 === a.tag;
  }
  function Uj(a) {
    a: for (; ; ) {
      for (; null === a.sibling; ) {
        if (null === a.return || Tj(a.return)) return null;
        a = a.return;
      }
      a.sibling.return = a.return;
      for (a = a.sibling; 5 !== a.tag && 6 !== a.tag && 18 !== a.tag; ) {
        if (a.flags & 2) continue a;
        if (null === a.child || 4 === a.tag) continue a;
        else a.child.return = a, a = a.child;
      }
      if (!(a.flags & 2)) return a.stateNode;
    }
  }
  function Vj(a, b, c) {
    var d = a.tag;
    if (5 === d || 6 === d) a = a.stateNode, b ? 8 === c.nodeType ? c.parentNode.insertBefore(a, b) : c.insertBefore(a, b) : (8 === c.nodeType ? (b = c.parentNode, b.insertBefore(a, c)) : (b = c, b.appendChild(a)), c = c._reactRootContainer, null !== c && void 0 !== c || null !== b.onclick || (b.onclick = Bf));
    else if (4 !== d && (a = a.child, null !== a)) for (Vj(a, b, c), a = a.sibling; null !== a; ) Vj(a, b, c), a = a.sibling;
  }
  function Wj(a, b, c) {
    var d = a.tag;
    if (5 === d || 6 === d) a = a.stateNode, b ? c.insertBefore(a, b) : c.appendChild(a);
    else if (4 !== d && (a = a.child, null !== a)) for (Wj(a, b, c), a = a.sibling; null !== a; ) Wj(a, b, c), a = a.sibling;
  }
  var X = null, Xj = false;
  function Yj(a, b, c) {
    for (c = c.child; null !== c; ) Zj(a, b, c), c = c.sibling;
  }
  function Zj(a, b, c) {
    if (lc && "function" === typeof lc.onCommitFiberUnmount) try {
      lc.onCommitFiberUnmount(kc, c);
    } catch (h) {
    }
    switch (c.tag) {
      case 5:
        U || Lj(c, b);
      case 6:
        var d = X, e = Xj;
        X = null;
        Yj(a, b, c);
        X = d;
        Xj = e;
        null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? a.parentNode.removeChild(c) : a.removeChild(c)) : X.removeChild(c.stateNode));
        break;
      case 18:
        null !== X && (Xj ? (a = X, c = c.stateNode, 8 === a.nodeType ? Kf(a.parentNode, c) : 1 === a.nodeType && Kf(a, c), bd(a)) : Kf(X, c.stateNode));
        break;
      case 4:
        d = X;
        e = Xj;
        X = c.stateNode.containerInfo;
        Xj = true;
        Yj(a, b, c);
        X = d;
        Xj = e;
        break;
      case 0:
      case 11:
      case 14:
      case 15:
        if (!U && (d = c.updateQueue, null !== d && (d = d.lastEffect, null !== d))) {
          e = d = d.next;
          do {
            var f = e, g = f.destroy;
            f = f.tag;
            void 0 !== g && (0 !== (f & 2) ? Mj(c, b, g) : 0 !== (f & 4) && Mj(c, b, g));
            e = e.next;
          } while (e !== d);
        }
        Yj(a, b, c);
        break;
      case 1:
        if (!U && (Lj(c, b), d = c.stateNode, "function" === typeof d.componentWillUnmount)) try {
          d.props = c.memoizedProps, d.state = c.memoizedState, d.componentWillUnmount();
        } catch (h) {
          W(c, b, h);
        }
        Yj(a, b, c);
        break;
      case 21:
        Yj(a, b, c);
        break;
      case 22:
        c.mode & 1 ? (U = (d = U) || null !== c.memoizedState, Yj(a, b, c), U = d) : Yj(a, b, c);
        break;
      default:
        Yj(a, b, c);
    }
  }
  function ak(a) {
    var b = a.updateQueue;
    if (null !== b) {
      a.updateQueue = null;
      var c = a.stateNode;
      null === c && (c = a.stateNode = new Kj());
      b.forEach(function(b2) {
        var d = bk.bind(null, a, b2);
        c.has(b2) || (c.add(b2), b2.then(d, d));
      });
    }
  }
  function ck(a, b) {
    var c = b.deletions;
    if (null !== c) for (var d = 0; d < c.length; d++) {
      var e = c[d];
      try {
        var f = a, g = b, h = g;
        a: for (; null !== h; ) {
          switch (h.tag) {
            case 5:
              X = h.stateNode;
              Xj = false;
              break a;
            case 3:
              X = h.stateNode.containerInfo;
              Xj = true;
              break a;
            case 4:
              X = h.stateNode.containerInfo;
              Xj = true;
              break a;
          }
          h = h.return;
        }
        if (null === X) throw Error(p(160));
        Zj(f, g, e);
        X = null;
        Xj = false;
        var k = e.alternate;
        null !== k && (k.return = null);
        e.return = null;
      } catch (l) {
        W(e, b, l);
      }
    }
    if (b.subtreeFlags & 12854) for (b = b.child; null !== b; ) dk(b, a), b = b.sibling;
  }
  function dk(a, b) {
    var c = a.alternate, d = a.flags;
    switch (a.tag) {
      case 0:
      case 11:
      case 14:
      case 15:
        ck(b, a);
        ek(a);
        if (d & 4) {
          try {
            Pj(3, a, a.return), Qj(3, a);
          } catch (t2) {
            W(a, a.return, t2);
          }
          try {
            Pj(5, a, a.return);
          } catch (t2) {
            W(a, a.return, t2);
          }
        }
        break;
      case 1:
        ck(b, a);
        ek(a);
        d & 512 && null !== c && Lj(c, c.return);
        break;
      case 5:
        ck(b, a);
        ek(a);
        d & 512 && null !== c && Lj(c, c.return);
        if (a.flags & 32) {
          var e = a.stateNode;
          try {
            ob(e, "");
          } catch (t2) {
            W(a, a.return, t2);
          }
        }
        if (d & 4 && (e = a.stateNode, null != e)) {
          var f = a.memoizedProps, g = null !== c ? c.memoizedProps : f, h = a.type, k = a.updateQueue;
          a.updateQueue = null;
          if (null !== k) try {
            "input" === h && "radio" === f.type && null != f.name && ab(e, f);
            vb(h, g);
            var l = vb(h, f);
            for (g = 0; g < k.length; g += 2) {
              var m = k[g], q = k[g + 1];
              "style" === m ? sb(e, q) : "dangerouslySetInnerHTML" === m ? nb(e, q) : "children" === m ? ob(e, q) : ta(e, m, q, l);
            }
            switch (h) {
              case "input":
                bb(e, f);
                break;
              case "textarea":
                ib(e, f);
                break;
              case "select":
                var r = e._wrapperState.wasMultiple;
                e._wrapperState.wasMultiple = !!f.multiple;
                var y = f.value;
                null != y ? fb(e, !!f.multiple, y, false) : r !== !!f.multiple && (null != f.defaultValue ? fb(
                  e,
                  !!f.multiple,
                  f.defaultValue,
                  true
                ) : fb(e, !!f.multiple, f.multiple ? [] : "", false));
            }
            e[Pf] = f;
          } catch (t2) {
            W(a, a.return, t2);
          }
        }
        break;
      case 6:
        ck(b, a);
        ek(a);
        if (d & 4) {
          if (null === a.stateNode) throw Error(p(162));
          e = a.stateNode;
          f = a.memoizedProps;
          try {
            e.nodeValue = f;
          } catch (t2) {
            W(a, a.return, t2);
          }
        }
        break;
      case 3:
        ck(b, a);
        ek(a);
        if (d & 4 && null !== c && c.memoizedState.isDehydrated) try {
          bd(b.containerInfo);
        } catch (t2) {
          W(a, a.return, t2);
        }
        break;
      case 4:
        ck(b, a);
        ek(a);
        break;
      case 13:
        ck(b, a);
        ek(a);
        e = a.child;
        e.flags & 8192 && (f = null !== e.memoizedState, e.stateNode.isHidden = f, !f || null !== e.alternate && null !== e.alternate.memoizedState || (fk = B()));
        d & 4 && ak(a);
        break;
      case 22:
        m = null !== c && null !== c.memoizedState;
        a.mode & 1 ? (U = (l = U) || m, ck(b, a), U = l) : ck(b, a);
        ek(a);
        if (d & 8192) {
          l = null !== a.memoizedState;
          if ((a.stateNode.isHidden = l) && !m && 0 !== (a.mode & 1)) for (V = a, m = a.child; null !== m; ) {
            for (q = V = m; null !== V; ) {
              r = V;
              y = r.child;
              switch (r.tag) {
                case 0:
                case 11:
                case 14:
                case 15:
                  Pj(4, r, r.return);
                  break;
                case 1:
                  Lj(r, r.return);
                  var n = r.stateNode;
                  if ("function" === typeof n.componentWillUnmount) {
                    d = r;
                    c = r.return;
                    try {
                      b = d, n.props = b.memoizedProps, n.state = b.memoizedState, n.componentWillUnmount();
                    } catch (t2) {
                      W(d, c, t2);
                    }
                  }
                  break;
                case 5:
                  Lj(r, r.return);
                  break;
                case 22:
                  if (null !== r.memoizedState) {
                    gk(q);
                    continue;
                  }
              }
              null !== y ? (y.return = r, V = y) : gk(q);
            }
            m = m.sibling;
          }
          a: for (m = null, q = a; ; ) {
            if (5 === q.tag) {
              if (null === m) {
                m = q;
                try {
                  e = q.stateNode, l ? (f = e.style, "function" === typeof f.setProperty ? f.setProperty("display", "none", "important") : f.display = "none") : (h = q.stateNode, k = q.memoizedProps.style, g = void 0 !== k && null !== k && k.hasOwnProperty("display") ? k.display : null, h.style.display = rb("display", g));
                } catch (t2) {
                  W(a, a.return, t2);
                }
              }
            } else if (6 === q.tag) {
              if (null === m) try {
                q.stateNode.nodeValue = l ? "" : q.memoizedProps;
              } catch (t2) {
                W(a, a.return, t2);
              }
            } else if ((22 !== q.tag && 23 !== q.tag || null === q.memoizedState || q === a) && null !== q.child) {
              q.child.return = q;
              q = q.child;
              continue;
            }
            if (q === a) break a;
            for (; null === q.sibling; ) {
              if (null === q.return || q.return === a) break a;
              m === q && (m = null);
              q = q.return;
            }
            m === q && (m = null);
            q.sibling.return = q.return;
            q = q.sibling;
          }
        }
        break;
      case 19:
        ck(b, a);
        ek(a);
        d & 4 && ak(a);
        break;
      case 21:
        break;
      default:
        ck(
          b,
          a
        ), ek(a);
    }
  }
  function ek(a) {
    var b = a.flags;
    if (b & 2) {
      try {
        a: {
          for (var c = a.return; null !== c; ) {
            if (Tj(c)) {
              var d = c;
              break a;
            }
            c = c.return;
          }
          throw Error(p(160));
        }
        switch (d.tag) {
          case 5:
            var e = d.stateNode;
            d.flags & 32 && (ob(e, ""), d.flags &= -33);
            var f = Uj(a);
            Wj(a, f, e);
            break;
          case 3:
          case 4:
            var g = d.stateNode.containerInfo, h = Uj(a);
            Vj(a, h, g);
            break;
          default:
            throw Error(p(161));
        }
      } catch (k) {
        W(a, a.return, k);
      }
      a.flags &= -3;
    }
    b & 4096 && (a.flags &= -4097);
  }
  function hk(a, b, c) {
    V = a;
    ik(a);
  }
  function ik(a, b, c) {
    for (var d = 0 !== (a.mode & 1); null !== V; ) {
      var e = V, f = e.child;
      if (22 === e.tag && d) {
        var g = null !== e.memoizedState || Jj;
        if (!g) {
          var h = e.alternate, k = null !== h && null !== h.memoizedState || U;
          h = Jj;
          var l = U;
          Jj = g;
          if ((U = k) && !l) for (V = e; null !== V; ) g = V, k = g.child, 22 === g.tag && null !== g.memoizedState ? jk(e) : null !== k ? (k.return = g, V = k) : jk(e);
          for (; null !== f; ) V = f, ik(f), f = f.sibling;
          V = e;
          Jj = h;
          U = l;
        }
        kk(a);
      } else 0 !== (e.subtreeFlags & 8772) && null !== f ? (f.return = e, V = f) : kk(a);
    }
  }
  function kk(a) {
    for (; null !== V; ) {
      var b = V;
      if (0 !== (b.flags & 8772)) {
        var c = b.alternate;
        try {
          if (0 !== (b.flags & 8772)) switch (b.tag) {
            case 0:
            case 11:
            case 15:
              U || Qj(5, b);
              break;
            case 1:
              var d = b.stateNode;
              if (b.flags & 4 && !U) if (null === c) d.componentDidMount();
              else {
                var e = b.elementType === b.type ? c.memoizedProps : Ci(b.type, c.memoizedProps);
                d.componentDidUpdate(e, c.memoizedState, d.__reactInternalSnapshotBeforeUpdate);
              }
              var f = b.updateQueue;
              null !== f && sh(b, f, d);
              break;
            case 3:
              var g = b.updateQueue;
              if (null !== g) {
                c = null;
                if (null !== b.child) switch (b.child.tag) {
                  case 5:
                    c = b.child.stateNode;
                    break;
                  case 1:
                    c = b.child.stateNode;
                }
                sh(b, g, c);
              }
              break;
            case 5:
              var h = b.stateNode;
              if (null === c && b.flags & 4) {
                c = h;
                var k = b.memoizedProps;
                switch (b.type) {
                  case "button":
                  case "input":
                  case "select":
                  case "textarea":
                    k.autoFocus && c.focus();
                    break;
                  case "img":
                    k.src && (c.src = k.src);
                }
              }
              break;
            case 6:
              break;
            case 4:
              break;
            case 12:
              break;
            case 13:
              if (null === b.memoizedState) {
                var l = b.alternate;
                if (null !== l) {
                  var m = l.memoizedState;
                  if (null !== m) {
                    var q = m.dehydrated;
                    null !== q && bd(q);
                  }
                }
              }
              break;
            case 19:
            case 17:
            case 21:
            case 22:
            case 23:
            case 25:
              break;
            default:
              throw Error(p(163));
          }
          U || b.flags & 512 && Rj(b);
        } catch (r) {
          W(b, b.return, r);
        }
      }
      if (b === a) {
        V = null;
        break;
      }
      c = b.sibling;
      if (null !== c) {
        c.return = b.return;
        V = c;
        break;
      }
      V = b.return;
    }
  }
  function gk(a) {
    for (; null !== V; ) {
      var b = V;
      if (b === a) {
        V = null;
        break;
      }
      var c = b.sibling;
      if (null !== c) {
        c.return = b.return;
        V = c;
        break;
      }
      V = b.return;
    }
  }
  function jk(a) {
    for (; null !== V; ) {
      var b = V;
      try {
        switch (b.tag) {
          case 0:
          case 11:
          case 15:
            var c = b.return;
            try {
              Qj(4, b);
            } catch (k) {
              W(b, c, k);
            }
            break;
          case 1:
            var d = b.stateNode;
            if ("function" === typeof d.componentDidMount) {
              var e = b.return;
              try {
                d.componentDidMount();
              } catch (k) {
                W(b, e, k);
              }
            }
            var f = b.return;
            try {
              Rj(b);
            } catch (k) {
              W(b, f, k);
            }
            break;
          case 5:
            var g = b.return;
            try {
              Rj(b);
            } catch (k) {
              W(b, g, k);
            }
        }
      } catch (k) {
        W(b, b.return, k);
      }
      if (b === a) {
        V = null;
        break;
      }
      var h = b.sibling;
      if (null !== h) {
        h.return = b.return;
        V = h;
        break;
      }
      V = b.return;
    }
  }
  var lk = Math.ceil, mk = ua.ReactCurrentDispatcher, nk = ua.ReactCurrentOwner, ok = ua.ReactCurrentBatchConfig, K = 0, Q = null, Y = null, Z = 0, fj = 0, ej = Uf(0), T = 0, pk = null, rh = 0, qk = 0, rk = 0, sk = null, tk = null, fk = 0, Gj = Infinity, uk = null, Oi = false, Pi = null, Ri = null, vk = false, wk = null, xk = 0, yk = 0, zk = null, Ak = -1, Bk = 0;
  function R() {
    return 0 !== (K & 6) ? B() : -1 !== Ak ? Ak : Ak = B();
  }
  function yi(a) {
    if (0 === (a.mode & 1)) return 1;
    if (0 !== (K & 2) && 0 !== Z) return Z & -Z;
    if (null !== Kg.transition) return 0 === Bk && (Bk = yc()), Bk;
    a = C;
    if (0 !== a) return a;
    a = window.event;
    a = void 0 === a ? 16 : jd(a.type);
    return a;
  }
  function gi(a, b, c, d) {
    if (50 < yk) throw yk = 0, zk = null, Error(p(185));
    Ac(a, c, d);
    if (0 === (K & 2) || a !== Q) a === Q && (0 === (K & 2) && (qk |= c), 4 === T && Ck(a, Z)), Dk(a, d), 1 === c && 0 === K && 0 === (b.mode & 1) && (Gj = B() + 500, fg && jg());
  }
  function Dk(a, b) {
    var c = a.callbackNode;
    wc(a, b);
    var d = uc(a, a === Q ? Z : 0);
    if (0 === d) null !== c && bc(c), a.callbackNode = null, a.callbackPriority = 0;
    else if (b = d & -d, a.callbackPriority !== b) {
      null != c && bc(c);
      if (1 === b) 0 === a.tag ? ig(Ek.bind(null, a)) : hg(Ek.bind(null, a)), Jf(function() {
        0 === (K & 6) && jg();
      }), c = null;
      else {
        switch (Dc(d)) {
          case 1:
            c = fc;
            break;
          case 4:
            c = gc;
            break;
          case 16:
            c = hc;
            break;
          case 536870912:
            c = jc;
            break;
          default:
            c = hc;
        }
        c = Fk(c, Gk.bind(null, a));
      }
      a.callbackPriority = b;
      a.callbackNode = c;
    }
  }
  function Gk(a, b) {
    Ak = -1;
    Bk = 0;
    if (0 !== (K & 6)) throw Error(p(327));
    var c = a.callbackNode;
    if (Hk() && a.callbackNode !== c) return null;
    var d = uc(a, a === Q ? Z : 0);
    if (0 === d) return null;
    if (0 !== (d & 30) || 0 !== (d & a.expiredLanes) || b) b = Ik(a, d);
    else {
      b = d;
      var e = K;
      K |= 2;
      var f = Jk();
      if (Q !== a || Z !== b) uk = null, Gj = B() + 500, Kk(a, b);
      do
        try {
          Lk();
          break;
        } catch (h) {
          Mk(a, h);
        }
      while (1);
      $g();
      mk.current = f;
      K = e;
      null !== Y ? b = 0 : (Q = null, Z = 0, b = T);
    }
    if (0 !== b) {
      2 === b && (e = xc(a), 0 !== e && (d = e, b = Nk(a, e)));
      if (1 === b) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
      if (6 === b) Ck(a, d);
      else {
        e = a.current.alternate;
        if (0 === (d & 30) && !Ok(e) && (b = Ik(a, d), 2 === b && (f = xc(a), 0 !== f && (d = f, b = Nk(a, f))), 1 === b)) throw c = pk, Kk(a, 0), Ck(a, d), Dk(a, B()), c;
        a.finishedWork = e;
        a.finishedLanes = d;
        switch (b) {
          case 0:
          case 1:
            throw Error(p(345));
          case 2:
            Pk(a, tk, uk);
            break;
          case 3:
            Ck(a, d);
            if ((d & 130023424) === d && (b = fk + 500 - B(), 10 < b)) {
              if (0 !== uc(a, 0)) break;
              e = a.suspendedLanes;
              if ((e & d) !== d) {
                R();
                a.pingedLanes |= a.suspendedLanes & e;
                break;
              }
              a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), b);
              break;
            }
            Pk(a, tk, uk);
            break;
          case 4:
            Ck(a, d);
            if ((d & 4194240) === d) break;
            b = a.eventTimes;
            for (e = -1; 0 < d; ) {
              var g = 31 - oc(d);
              f = 1 << g;
              g = b[g];
              g > e && (e = g);
              d &= ~f;
            }
            d = e;
            d = B() - d;
            d = (120 > d ? 120 : 480 > d ? 480 : 1080 > d ? 1080 : 1920 > d ? 1920 : 3e3 > d ? 3e3 : 4320 > d ? 4320 : 1960 * lk(d / 1960)) - d;
            if (10 < d) {
              a.timeoutHandle = Ff(Pk.bind(null, a, tk, uk), d);
              break;
            }
            Pk(a, tk, uk);
            break;
          case 5:
            Pk(a, tk, uk);
            break;
          default:
            throw Error(p(329));
        }
      }
    }
    Dk(a, B());
    return a.callbackNode === c ? Gk.bind(null, a) : null;
  }
  function Nk(a, b) {
    var c = sk;
    a.current.memoizedState.isDehydrated && (Kk(a, b).flags |= 256);
    a = Ik(a, b);
    2 !== a && (b = tk, tk = c, null !== b && Fj(b));
    return a;
  }
  function Fj(a) {
    null === tk ? tk = a : tk.push.apply(tk, a);
  }
  function Ok(a) {
    for (var b = a; ; ) {
      if (b.flags & 16384) {
        var c = b.updateQueue;
        if (null !== c && (c = c.stores, null !== c)) for (var d = 0; d < c.length; d++) {
          var e = c[d], f = e.getSnapshot;
          e = e.value;
          try {
            if (!He(f(), e)) return false;
          } catch (g) {
            return false;
          }
        }
      }
      c = b.child;
      if (b.subtreeFlags & 16384 && null !== c) c.return = b, b = c;
      else {
        if (b === a) break;
        for (; null === b.sibling; ) {
          if (null === b.return || b.return === a) return true;
          b = b.return;
        }
        b.sibling.return = b.return;
        b = b.sibling;
      }
    }
    return true;
  }
  function Ck(a, b) {
    b &= ~rk;
    b &= ~qk;
    a.suspendedLanes |= b;
    a.pingedLanes &= ~b;
    for (a = a.expirationTimes; 0 < b; ) {
      var c = 31 - oc(b), d = 1 << c;
      a[c] = -1;
      b &= ~d;
    }
  }
  function Ek(a) {
    if (0 !== (K & 6)) throw Error(p(327));
    Hk();
    var b = uc(a, 0);
    if (0 === (b & 1)) return Dk(a, B()), null;
    var c = Ik(a, b);
    if (0 !== a.tag && 2 === c) {
      var d = xc(a);
      0 !== d && (b = d, c = Nk(a, d));
    }
    if (1 === c) throw c = pk, Kk(a, 0), Ck(a, b), Dk(a, B()), c;
    if (6 === c) throw Error(p(345));
    a.finishedWork = a.current.alternate;
    a.finishedLanes = b;
    Pk(a, tk, uk);
    Dk(a, B());
    return null;
  }
  function Qk(a, b) {
    var c = K;
    K |= 1;
    try {
      return a(b);
    } finally {
      K = c, 0 === K && (Gj = B() + 500, fg && jg());
    }
  }
  function Rk(a) {
    null !== wk && 0 === wk.tag && 0 === (K & 6) && Hk();
    var b = K;
    K |= 1;
    var c = ok.transition, d = C;
    try {
      if (ok.transition = null, C = 1, a) return a();
    } finally {
      C = d, ok.transition = c, K = b, 0 === (K & 6) && jg();
    }
  }
  function Hj() {
    fj = ej.current;
    E(ej);
  }
  function Kk(a, b) {
    a.finishedWork = null;
    a.finishedLanes = 0;
    var c = a.timeoutHandle;
    -1 !== c && (a.timeoutHandle = -1, Gf(c));
    if (null !== Y) for (c = Y.return; null !== c; ) {
      var d = c;
      wg(d);
      switch (d.tag) {
        case 1:
          d = d.type.childContextTypes;
          null !== d && void 0 !== d && $f();
          break;
        case 3:
          zh();
          E(Wf);
          E(H);
          Eh();
          break;
        case 5:
          Bh(d);
          break;
        case 4:
          zh();
          break;
        case 13:
          E(L);
          break;
        case 19:
          E(L);
          break;
        case 10:
          ah(d.type._context);
          break;
        case 22:
        case 23:
          Hj();
      }
      c = c.return;
    }
    Q = a;
    Y = a = Pg(a.current, null);
    Z = fj = b;
    T = 0;
    pk = null;
    rk = qk = rh = 0;
    tk = sk = null;
    if (null !== fh) {
      for (b = 0; b < fh.length; b++) if (c = fh[b], d = c.interleaved, null !== d) {
        c.interleaved = null;
        var e = d.next, f = c.pending;
        if (null !== f) {
          var g = f.next;
          f.next = e;
          d.next = g;
        }
        c.pending = d;
      }
      fh = null;
    }
    return a;
  }
  function Mk(a, b) {
    do {
      var c = Y;
      try {
        $g();
        Fh.current = Rh;
        if (Ih) {
          for (var d = M.memoizedState; null !== d; ) {
            var e = d.queue;
            null !== e && (e.pending = null);
            d = d.next;
          }
          Ih = false;
        }
        Hh = 0;
        O = N = M = null;
        Jh = false;
        Kh = 0;
        nk.current = null;
        if (null === c || null === c.return) {
          T = 1;
          pk = b;
          Y = null;
          break;
        }
        a: {
          var f = a, g = c.return, h = c, k = b;
          b = Z;
          h.flags |= 32768;
          if (null !== k && "object" === typeof k && "function" === typeof k.then) {
            var l = k, m = h, q = m.tag;
            if (0 === (m.mode & 1) && (0 === q || 11 === q || 15 === q)) {
              var r = m.alternate;
              r ? (m.updateQueue = r.updateQueue, m.memoizedState = r.memoizedState, m.lanes = r.lanes) : (m.updateQueue = null, m.memoizedState = null);
            }
            var y = Ui(g);
            if (null !== y) {
              y.flags &= -257;
              Vi(y, g, h, f, b);
              y.mode & 1 && Si(f, l, b);
              b = y;
              k = l;
              var n = b.updateQueue;
              if (null === n) {
                var t2 = /* @__PURE__ */ new Set();
                t2.add(k);
                b.updateQueue = t2;
              } else n.add(k);
              break a;
            } else {
              if (0 === (b & 1)) {
                Si(f, l, b);
                tj();
                break a;
              }
              k = Error(p(426));
            }
          } else if (I && h.mode & 1) {
            var J = Ui(g);
            if (null !== J) {
              0 === (J.flags & 65536) && (J.flags |= 256);
              Vi(J, g, h, f, b);
              Jg(Ji(k, h));
              break a;
            }
          }
          f = k = Ji(k, h);
          4 !== T && (T = 2);
          null === sk ? sk = [f] : sk.push(f);
          f = g;
          do {
            switch (f.tag) {
              case 3:
                f.flags |= 65536;
                b &= -b;
                f.lanes |= b;
                var x = Ni(f, k, b);
                ph(f, x);
                break a;
              case 1:
                h = k;
                var w = f.type, u = f.stateNode;
                if (0 === (f.flags & 128) && ("function" === typeof w.getDerivedStateFromError || null !== u && "function" === typeof u.componentDidCatch && (null === Ri || !Ri.has(u)))) {
                  f.flags |= 65536;
                  b &= -b;
                  f.lanes |= b;
                  var F = Qi(f, h, b);
                  ph(f, F);
                  break a;
                }
            }
            f = f.return;
          } while (null !== f);
        }
        Sk(c);
      } catch (na) {
        b = na;
        Y === c && null !== c && (Y = c = c.return);
        continue;
      }
      break;
    } while (1);
  }
  function Jk() {
    var a = mk.current;
    mk.current = Rh;
    return null === a ? Rh : a;
  }
  function tj() {
    if (0 === T || 3 === T || 2 === T) T = 4;
    null === Q || 0 === (rh & 268435455) && 0 === (qk & 268435455) || Ck(Q, Z);
  }
  function Ik(a, b) {
    var c = K;
    K |= 2;
    var d = Jk();
    if (Q !== a || Z !== b) uk = null, Kk(a, b);
    do
      try {
        Tk();
        break;
      } catch (e) {
        Mk(a, e);
      }
    while (1);
    $g();
    K = c;
    mk.current = d;
    if (null !== Y) throw Error(p(261));
    Q = null;
    Z = 0;
    return T;
  }
  function Tk() {
    for (; null !== Y; ) Uk(Y);
  }
  function Lk() {
    for (; null !== Y && !cc(); ) Uk(Y);
  }
  function Uk(a) {
    var b = Vk(a.alternate, a, fj);
    a.memoizedProps = a.pendingProps;
    null === b ? Sk(a) : Y = b;
    nk.current = null;
  }
  function Sk(a) {
    var b = a;
    do {
      var c = b.alternate;
      a = b.return;
      if (0 === (b.flags & 32768)) {
        if (c = Ej(c, b, fj), null !== c) {
          Y = c;
          return;
        }
      } else {
        c = Ij(c, b);
        if (null !== c) {
          c.flags &= 32767;
          Y = c;
          return;
        }
        if (null !== a) a.flags |= 32768, a.subtreeFlags = 0, a.deletions = null;
        else {
          T = 6;
          Y = null;
          return;
        }
      }
      b = b.sibling;
      if (null !== b) {
        Y = b;
        return;
      }
      Y = b = a;
    } while (null !== b);
    0 === T && (T = 5);
  }
  function Pk(a, b, c) {
    var d = C, e = ok.transition;
    try {
      ok.transition = null, C = 1, Wk(a, b, c, d);
    } finally {
      ok.transition = e, C = d;
    }
    return null;
  }
  function Wk(a, b, c, d) {
    do
      Hk();
    while (null !== wk);
    if (0 !== (K & 6)) throw Error(p(327));
    c = a.finishedWork;
    var e = a.finishedLanes;
    if (null === c) return null;
    a.finishedWork = null;
    a.finishedLanes = 0;
    if (c === a.current) throw Error(p(177));
    a.callbackNode = null;
    a.callbackPriority = 0;
    var f = c.lanes | c.childLanes;
    Bc(a, f);
    a === Q && (Y = Q = null, Z = 0);
    0 === (c.subtreeFlags & 2064) && 0 === (c.flags & 2064) || vk || (vk = true, Fk(hc, function() {
      Hk();
      return null;
    }));
    f = 0 !== (c.flags & 15990);
    if (0 !== (c.subtreeFlags & 15990) || f) {
      f = ok.transition;
      ok.transition = null;
      var g = C;
      C = 1;
      var h = K;
      K |= 4;
      nk.current = null;
      Oj(a, c);
      dk(c, a);
      Oe(Df);
      dd = !!Cf;
      Df = Cf = null;
      a.current = c;
      hk(c);
      dc();
      K = h;
      C = g;
      ok.transition = f;
    } else a.current = c;
    vk && (vk = false, wk = a, xk = e);
    f = a.pendingLanes;
    0 === f && (Ri = null);
    mc(c.stateNode);
    Dk(a, B());
    if (null !== b) for (d = a.onRecoverableError, c = 0; c < b.length; c++) e = b[c], d(e.value, { componentStack: e.stack, digest: e.digest });
    if (Oi) throw Oi = false, a = Pi, Pi = null, a;
    0 !== (xk & 1) && 0 !== a.tag && Hk();
    f = a.pendingLanes;
    0 !== (f & 1) ? a === zk ? yk++ : (yk = 0, zk = a) : yk = 0;
    jg();
    return null;
  }
  function Hk() {
    if (null !== wk) {
      var a = Dc(xk), b = ok.transition, c = C;
      try {
        ok.transition = null;
        C = 16 > a ? 16 : a;
        if (null === wk) var d = false;
        else {
          a = wk;
          wk = null;
          xk = 0;
          if (0 !== (K & 6)) throw Error(p(331));
          var e = K;
          K |= 4;
          for (V = a.current; null !== V; ) {
            var f = V, g = f.child;
            if (0 !== (V.flags & 16)) {
              var h = f.deletions;
              if (null !== h) {
                for (var k = 0; k < h.length; k++) {
                  var l = h[k];
                  for (V = l; null !== V; ) {
                    var m = V;
                    switch (m.tag) {
                      case 0:
                      case 11:
                      case 15:
                        Pj(8, m, f);
                    }
                    var q = m.child;
                    if (null !== q) q.return = m, V = q;
                    else for (; null !== V; ) {
                      m = V;
                      var r = m.sibling, y = m.return;
                      Sj(m);
                      if (m === l) {
                        V = null;
                        break;
                      }
                      if (null !== r) {
                        r.return = y;
                        V = r;
                        break;
                      }
                      V = y;
                    }
                  }
                }
                var n = f.alternate;
                if (null !== n) {
                  var t2 = n.child;
                  if (null !== t2) {
                    n.child = null;
                    do {
                      var J = t2.sibling;
                      t2.sibling = null;
                      t2 = J;
                    } while (null !== t2);
                  }
                }
                V = f;
              }
            }
            if (0 !== (f.subtreeFlags & 2064) && null !== g) g.return = f, V = g;
            else b: for (; null !== V; ) {
              f = V;
              if (0 !== (f.flags & 2048)) switch (f.tag) {
                case 0:
                case 11:
                case 15:
                  Pj(9, f, f.return);
              }
              var x = f.sibling;
              if (null !== x) {
                x.return = f.return;
                V = x;
                break b;
              }
              V = f.return;
            }
          }
          var w = a.current;
          for (V = w; null !== V; ) {
            g = V;
            var u = g.child;
            if (0 !== (g.subtreeFlags & 2064) && null !== u) u.return = g, V = u;
            else b: for (g = w; null !== V; ) {
              h = V;
              if (0 !== (h.flags & 2048)) try {
                switch (h.tag) {
                  case 0:
                  case 11:
                  case 15:
                    Qj(9, h);
                }
              } catch (na) {
                W(h, h.return, na);
              }
              if (h === g) {
                V = null;
                break b;
              }
              var F = h.sibling;
              if (null !== F) {
                F.return = h.return;
                V = F;
                break b;
              }
              V = h.return;
            }
          }
          K = e;
          jg();
          if (lc && "function" === typeof lc.onPostCommitFiberRoot) try {
            lc.onPostCommitFiberRoot(kc, a);
          } catch (na) {
          }
          d = true;
        }
        return d;
      } finally {
        C = c, ok.transition = b;
      }
    }
    return false;
  }
  function Xk(a, b, c) {
    b = Ji(c, b);
    b = Ni(a, b, 1);
    a = nh(a, b, 1);
    b = R();
    null !== a && (Ac(a, 1, b), Dk(a, b));
  }
  function W(a, b, c) {
    if (3 === a.tag) Xk(a, a, c);
    else for (; null !== b; ) {
      if (3 === b.tag) {
        Xk(b, a, c);
        break;
      } else if (1 === b.tag) {
        var d = b.stateNode;
        if ("function" === typeof b.type.getDerivedStateFromError || "function" === typeof d.componentDidCatch && (null === Ri || !Ri.has(d))) {
          a = Ji(c, a);
          a = Qi(b, a, 1);
          b = nh(b, a, 1);
          a = R();
          null !== b && (Ac(b, 1, a), Dk(b, a));
          break;
        }
      }
      b = b.return;
    }
  }
  function Ti(a, b, c) {
    var d = a.pingCache;
    null !== d && d.delete(b);
    b = R();
    a.pingedLanes |= a.suspendedLanes & c;
    Q === a && (Z & c) === c && (4 === T || 3 === T && (Z & 130023424) === Z && 500 > B() - fk ? Kk(a, 0) : rk |= c);
    Dk(a, b);
  }
  function Yk(a, b) {
    0 === b && (0 === (a.mode & 1) ? b = 1 : (b = sc, sc <<= 1, 0 === (sc & 130023424) && (sc = 4194304)));
    var c = R();
    a = ih(a, b);
    null !== a && (Ac(a, b, c), Dk(a, c));
  }
  function uj(a) {
    var b = a.memoizedState, c = 0;
    null !== b && (c = b.retryLane);
    Yk(a, c);
  }
  function bk(a, b) {
    var c = 0;
    switch (a.tag) {
      case 13:
        var d = a.stateNode;
        var e = a.memoizedState;
        null !== e && (c = e.retryLane);
        break;
      case 19:
        d = a.stateNode;
        break;
      default:
        throw Error(p(314));
    }
    null !== d && d.delete(b);
    Yk(a, c);
  }
  var Vk;
  Vk = function(a, b, c) {
    if (null !== a) if (a.memoizedProps !== b.pendingProps || Wf.current) dh = true;
    else {
      if (0 === (a.lanes & c) && 0 === (b.flags & 128)) return dh = false, yj(a, b, c);
      dh = 0 !== (a.flags & 131072) ? true : false;
    }
    else dh = false, I && 0 !== (b.flags & 1048576) && ug(b, ng, b.index);
    b.lanes = 0;
    switch (b.tag) {
      case 2:
        var d = b.type;
        ij(a, b);
        a = b.pendingProps;
        var e = Yf(b, H.current);
        ch(b, c);
        e = Nh(null, b, d, a, e, c);
        var f = Sh();
        b.flags |= 1;
        "object" === typeof e && null !== e && "function" === typeof e.render && void 0 === e.$$typeof ? (b.tag = 1, b.memoizedState = null, b.updateQueue = null, Zf(d) ? (f = true, cg(b)) : f = false, b.memoizedState = null !== e.state && void 0 !== e.state ? e.state : null, kh(b), e.updater = Ei, b.stateNode = e, e._reactInternals = b, Ii(b, d, a, c), b = jj(null, b, d, true, f, c)) : (b.tag = 0, I && f && vg(b), Xi(null, b, e, c), b = b.child);
        return b;
      case 16:
        d = b.elementType;
        a: {
          ij(a, b);
          a = b.pendingProps;
          e = d._init;
          d = e(d._payload);
          b.type = d;
          e = b.tag = Zk(d);
          a = Ci(d, a);
          switch (e) {
            case 0:
              b = cj(null, b, d, a, c);
              break a;
            case 1:
              b = hj(null, b, d, a, c);
              break a;
            case 11:
              b = Yi(null, b, d, a, c);
              break a;
            case 14:
              b = $i(null, b, d, Ci(d.type, a), c);
              break a;
          }
          throw Error(p(
            306,
            d,
            ""
          ));
        }
        return b;
      case 0:
        return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), cj(a, b, d, e, c);
      case 1:
        return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), hj(a, b, d, e, c);
      case 3:
        a: {
          kj(b);
          if (null === a) throw Error(p(387));
          d = b.pendingProps;
          f = b.memoizedState;
          e = f.element;
          lh(a, b);
          qh(b, d, null, c);
          var g = b.memoizedState;
          d = g.element;
          if (f.isDehydrated) if (f = { element: d, isDehydrated: false, cache: g.cache, pendingSuspenseBoundaries: g.pendingSuspenseBoundaries, transitions: g.transitions }, b.updateQueue.baseState = f, b.memoizedState = f, b.flags & 256) {
            e = Ji(Error(p(423)), b);
            b = lj(a, b, d, c, e);
            break a;
          } else if (d !== e) {
            e = Ji(Error(p(424)), b);
            b = lj(a, b, d, c, e);
            break a;
          } else for (yg = Lf(b.stateNode.containerInfo.firstChild), xg = b, I = true, zg = null, c = Vg(b, null, d, c), b.child = c; c; ) c.flags = c.flags & -3 | 4096, c = c.sibling;
          else {
            Ig();
            if (d === e) {
              b = Zi(a, b, c);
              break a;
            }
            Xi(a, b, d, c);
          }
          b = b.child;
        }
        return b;
      case 5:
        return Ah(b), null === a && Eg(b), d = b.type, e = b.pendingProps, f = null !== a ? a.memoizedProps : null, g = e.children, Ef(d, e) ? g = null : null !== f && Ef(d, f) && (b.flags |= 32), gj(a, b), Xi(a, b, g, c), b.child;
      case 6:
        return null === a && Eg(b), null;
      case 13:
        return oj(a, b, c);
      case 4:
        return yh(b, b.stateNode.containerInfo), d = b.pendingProps, null === a ? b.child = Ug(b, null, d, c) : Xi(a, b, d, c), b.child;
      case 11:
        return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), Yi(a, b, d, e, c);
      case 7:
        return Xi(a, b, b.pendingProps, c), b.child;
      case 8:
        return Xi(a, b, b.pendingProps.children, c), b.child;
      case 12:
        return Xi(a, b, b.pendingProps.children, c), b.child;
      case 10:
        a: {
          d = b.type._context;
          e = b.pendingProps;
          f = b.memoizedProps;
          g = e.value;
          G(Wg, d._currentValue);
          d._currentValue = g;
          if (null !== f) if (He(f.value, g)) {
            if (f.children === e.children && !Wf.current) {
              b = Zi(a, b, c);
              break a;
            }
          } else for (f = b.child, null !== f && (f.return = b); null !== f; ) {
            var h = f.dependencies;
            if (null !== h) {
              g = f.child;
              for (var k = h.firstContext; null !== k; ) {
                if (k.context === d) {
                  if (1 === f.tag) {
                    k = mh(-1, c & -c);
                    k.tag = 2;
                    var l = f.updateQueue;
                    if (null !== l) {
                      l = l.shared;
                      var m = l.pending;
                      null === m ? k.next = k : (k.next = m.next, m.next = k);
                      l.pending = k;
                    }
                  }
                  f.lanes |= c;
                  k = f.alternate;
                  null !== k && (k.lanes |= c);
                  bh(
                    f.return,
                    c,
                    b
                  );
                  h.lanes |= c;
                  break;
                }
                k = k.next;
              }
            } else if (10 === f.tag) g = f.type === b.type ? null : f.child;
            else if (18 === f.tag) {
              g = f.return;
              if (null === g) throw Error(p(341));
              g.lanes |= c;
              h = g.alternate;
              null !== h && (h.lanes |= c);
              bh(g, c, b);
              g = f.sibling;
            } else g = f.child;
            if (null !== g) g.return = f;
            else for (g = f; null !== g; ) {
              if (g === b) {
                g = null;
                break;
              }
              f = g.sibling;
              if (null !== f) {
                f.return = g.return;
                g = f;
                break;
              }
              g = g.return;
            }
            f = g;
          }
          Xi(a, b, e.children, c);
          b = b.child;
        }
        return b;
      case 9:
        return e = b.type, d = b.pendingProps.children, ch(b, c), e = eh(e), d = d(e), b.flags |= 1, Xi(a, b, d, c), b.child;
      case 14:
        return d = b.type, e = Ci(d, b.pendingProps), e = Ci(d.type, e), $i(a, b, d, e, c);
      case 15:
        return bj(a, b, b.type, b.pendingProps, c);
      case 17:
        return d = b.type, e = b.pendingProps, e = b.elementType === d ? e : Ci(d, e), ij(a, b), b.tag = 1, Zf(d) ? (a = true, cg(b)) : a = false, ch(b, c), Gi(b, d, e), Ii(b, d, e, c), jj(null, b, d, true, a, c);
      case 19:
        return xj(a, b, c);
      case 22:
        return dj(a, b, c);
    }
    throw Error(p(156, b.tag));
  };
  function Fk(a, b) {
    return ac(a, b);
  }
  function $k(a, b, c, d) {
    this.tag = a;
    this.key = c;
    this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
    this.index = 0;
    this.ref = null;
    this.pendingProps = b;
    this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
    this.mode = d;
    this.subtreeFlags = this.flags = 0;
    this.deletions = null;
    this.childLanes = this.lanes = 0;
    this.alternate = null;
  }
  function Bg(a, b, c, d) {
    return new $k(a, b, c, d);
  }
  function aj(a) {
    a = a.prototype;
    return !(!a || !a.isReactComponent);
  }
  function Zk(a) {
    if ("function" === typeof a) return aj(a) ? 1 : 0;
    if (void 0 !== a && null !== a) {
      a = a.$$typeof;
      if (a === Da) return 11;
      if (a === Ga) return 14;
    }
    return 2;
  }
  function Pg(a, b) {
    var c = a.alternate;
    null === c ? (c = Bg(a.tag, b, a.key, a.mode), c.elementType = a.elementType, c.type = a.type, c.stateNode = a.stateNode, c.alternate = a, a.alternate = c) : (c.pendingProps = b, c.type = a.type, c.flags = 0, c.subtreeFlags = 0, c.deletions = null);
    c.flags = a.flags & 14680064;
    c.childLanes = a.childLanes;
    c.lanes = a.lanes;
    c.child = a.child;
    c.memoizedProps = a.memoizedProps;
    c.memoizedState = a.memoizedState;
    c.updateQueue = a.updateQueue;
    b = a.dependencies;
    c.dependencies = null === b ? null : { lanes: b.lanes, firstContext: b.firstContext };
    c.sibling = a.sibling;
    c.index = a.index;
    c.ref = a.ref;
    return c;
  }
  function Rg(a, b, c, d, e, f) {
    var g = 2;
    d = a;
    if ("function" === typeof a) aj(a) && (g = 1);
    else if ("string" === typeof a) g = 5;
    else a: switch (a) {
      case ya:
        return Tg(c.children, e, f, b);
      case za:
        g = 8;
        e |= 8;
        break;
      case Aa:
        return a = Bg(12, c, b, e | 2), a.elementType = Aa, a.lanes = f, a;
      case Ea:
        return a = Bg(13, c, b, e), a.elementType = Ea, a.lanes = f, a;
      case Fa:
        return a = Bg(19, c, b, e), a.elementType = Fa, a.lanes = f, a;
      case Ia:
        return pj(c, e, f, b);
      default:
        if ("object" === typeof a && null !== a) switch (a.$$typeof) {
          case Ba:
            g = 10;
            break a;
          case Ca:
            g = 9;
            break a;
          case Da:
            g = 11;
            break a;
          case Ga:
            g = 14;
            break a;
          case Ha:
            g = 16;
            d = null;
            break a;
        }
        throw Error(p(130, null == a ? a : typeof a, ""));
    }
    b = Bg(g, c, b, e);
    b.elementType = a;
    b.type = d;
    b.lanes = f;
    return b;
  }
  function Tg(a, b, c, d) {
    a = Bg(7, a, d, b);
    a.lanes = c;
    return a;
  }
  function pj(a, b, c, d) {
    a = Bg(22, a, d, b);
    a.elementType = Ia;
    a.lanes = c;
    a.stateNode = { isHidden: false };
    return a;
  }
  function Qg(a, b, c) {
    a = Bg(6, a, null, b);
    a.lanes = c;
    return a;
  }
  function Sg(a, b, c) {
    b = Bg(4, null !== a.children ? a.children : [], a.key, b);
    b.lanes = c;
    b.stateNode = { containerInfo: a.containerInfo, pendingChildren: null, implementation: a.implementation };
    return b;
  }
  function al(a, b, c, d, e) {
    this.tag = b;
    this.containerInfo = a;
    this.finishedWork = this.pingCache = this.current = this.pendingChildren = null;
    this.timeoutHandle = -1;
    this.callbackNode = this.pendingContext = this.context = null;
    this.callbackPriority = 0;
    this.eventTimes = zc(0);
    this.expirationTimes = zc(-1);
    this.entangledLanes = this.finishedLanes = this.mutableReadLanes = this.expiredLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
    this.entanglements = zc(0);
    this.identifierPrefix = d;
    this.onRecoverableError = e;
    this.mutableSourceEagerHydrationData = null;
  }
  function bl(a, b, c, d, e, f, g, h, k) {
    a = new al(a, b, c, h, k);
    1 === b ? (b = 1, true === f && (b |= 8)) : b = 0;
    f = Bg(3, null, null, b);
    a.current = f;
    f.stateNode = a;
    f.memoizedState = { element: d, isDehydrated: c, cache: null, transitions: null, pendingSuspenseBoundaries: null };
    kh(f);
    return a;
  }
  function cl(a, b, c) {
    var d = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
    return { $$typeof: wa, key: null == d ? null : "" + d, children: a, containerInfo: b, implementation: c };
  }
  function dl(a) {
    if (!a) return Vf;
    a = a._reactInternals;
    a: {
      if (Vb(a) !== a || 1 !== a.tag) throw Error(p(170));
      var b = a;
      do {
        switch (b.tag) {
          case 3:
            b = b.stateNode.context;
            break a;
          case 1:
            if (Zf(b.type)) {
              b = b.stateNode.__reactInternalMemoizedMergedChildContext;
              break a;
            }
        }
        b = b.return;
      } while (null !== b);
      throw Error(p(171));
    }
    if (1 === a.tag) {
      var c = a.type;
      if (Zf(c)) return bg(a, c, b);
    }
    return b;
  }
  function el(a, b, c, d, e, f, g, h, k) {
    a = bl(c, d, true, a, e, f, g, h, k);
    a.context = dl(null);
    c = a.current;
    d = R();
    e = yi(c);
    f = mh(d, e);
    f.callback = void 0 !== b && null !== b ? b : null;
    nh(c, f, e);
    a.current.lanes = e;
    Ac(a, e, d);
    Dk(a, d);
    return a;
  }
  function fl(a, b, c, d) {
    var e = b.current, f = R(), g = yi(e);
    c = dl(c);
    null === b.context ? b.context = c : b.pendingContext = c;
    b = mh(f, g);
    b.payload = { element: a };
    d = void 0 === d ? null : d;
    null !== d && (b.callback = d);
    a = nh(e, b, g);
    null !== a && (gi(a, e, g, f), oh(a, e, g));
    return g;
  }
  function gl(a) {
    a = a.current;
    if (!a.child) return null;
    switch (a.child.tag) {
      case 5:
        return a.child.stateNode;
      default:
        return a.child.stateNode;
    }
  }
  function hl(a, b) {
    a = a.memoizedState;
    if (null !== a && null !== a.dehydrated) {
      var c = a.retryLane;
      a.retryLane = 0 !== c && c < b ? c : b;
    }
  }
  function il(a, b) {
    hl(a, b);
    (a = a.alternate) && hl(a, b);
  }
  function jl() {
    return null;
  }
  var kl = "function" === typeof reportError ? reportError : function(a) {
    console.error(a);
  };
  function ll(a) {
    this._internalRoot = a;
  }
  ml.prototype.render = ll.prototype.render = function(a) {
    var b = this._internalRoot;
    if (null === b) throw Error(p(409));
    fl(a, b, null, null);
  };
  ml.prototype.unmount = ll.prototype.unmount = function() {
    var a = this._internalRoot;
    if (null !== a) {
      this._internalRoot = null;
      var b = a.containerInfo;
      Rk(function() {
        fl(null, a, null, null);
      });
      b[uf] = null;
    }
  };
  function ml(a) {
    this._internalRoot = a;
  }
  ml.prototype.unstable_scheduleHydration = function(a) {
    if (a) {
      var b = Hc();
      a = { blockedOn: null, target: a, priority: b };
      for (var c = 0; c < Qc.length && 0 !== b && b < Qc[c].priority; c++) ;
      Qc.splice(c, 0, a);
      0 === c && Vc(a);
    }
  };
  function nl(a) {
    return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType);
  }
  function ol(a) {
    return !(!a || 1 !== a.nodeType && 9 !== a.nodeType && 11 !== a.nodeType && (8 !== a.nodeType || " react-mount-point-unstable " !== a.nodeValue));
  }
  function pl() {
  }
  function ql(a, b, c, d, e) {
    if (e) {
      if ("function" === typeof d) {
        var f = d;
        d = function() {
          var a2 = gl(g);
          f.call(a2);
        };
      }
      var g = el(b, d, a, 0, null, false, false, "", pl);
      a._reactRootContainer = g;
      a[uf] = g.current;
      sf(8 === a.nodeType ? a.parentNode : a);
      Rk();
      return g;
    }
    for (; e = a.lastChild; ) a.removeChild(e);
    if ("function" === typeof d) {
      var h = d;
      d = function() {
        var a2 = gl(k);
        h.call(a2);
      };
    }
    var k = bl(a, 0, false, null, null, false, false, "", pl);
    a._reactRootContainer = k;
    a[uf] = k.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    Rk(function() {
      fl(b, k, c, d);
    });
    return k;
  }
  function rl(a, b, c, d, e) {
    var f = c._reactRootContainer;
    if (f) {
      var g = f;
      if ("function" === typeof e) {
        var h = e;
        e = function() {
          var a2 = gl(g);
          h.call(a2);
        };
      }
      fl(b, g, a, e);
    } else g = ql(c, b, a, e, d);
    return gl(g);
  }
  Ec = function(a) {
    switch (a.tag) {
      case 3:
        var b = a.stateNode;
        if (b.current.memoizedState.isDehydrated) {
          var c = tc(b.pendingLanes);
          0 !== c && (Cc(b, c | 1), Dk(b, B()), 0 === (K & 6) && (Gj = B() + 500, jg()));
        }
        break;
      case 13:
        Rk(function() {
          var b2 = ih(a, 1);
          if (null !== b2) {
            var c2 = R();
            gi(b2, a, 1, c2);
          }
        }), il(a, 1);
    }
  };
  Fc = function(a) {
    if (13 === a.tag) {
      var b = ih(a, 134217728);
      if (null !== b) {
        var c = R();
        gi(b, a, 134217728, c);
      }
      il(a, 134217728);
    }
  };
  Gc = function(a) {
    if (13 === a.tag) {
      var b = yi(a), c = ih(a, b);
      if (null !== c) {
        var d = R();
        gi(c, a, b, d);
      }
      il(a, b);
    }
  };
  Hc = function() {
    return C;
  };
  Ic = function(a, b) {
    var c = C;
    try {
      return C = a, b();
    } finally {
      C = c;
    }
  };
  yb = function(a, b, c) {
    switch (b) {
      case "input":
        bb(a, c);
        b = c.name;
        if ("radio" === c.type && null != b) {
          for (c = a; c.parentNode; ) c = c.parentNode;
          c = c.querySelectorAll("input[name=" + JSON.stringify("" + b) + '][type="radio"]');
          for (b = 0; b < c.length; b++) {
            var d = c[b];
            if (d !== a && d.form === a.form) {
              var e = Db(d);
              if (!e) throw Error(p(90));
              Wa(d);
              bb(d, e);
            }
          }
        }
        break;
      case "textarea":
        ib(a, c);
        break;
      case "select":
        b = c.value, null != b && fb(a, !!c.multiple, b, false);
    }
  };
  Gb = Qk;
  Hb = Rk;
  var sl = { usingClientEntryPoint: false, Events: [Cb, ue, Db, Eb, Fb, Qk] }, tl = { findFiberByHostInstance: Wc, bundleType: 0, version: "18.3.1", rendererPackageName: "react-dom" };
  var ul = { bundleType: tl.bundleType, version: tl.version, rendererPackageName: tl.rendererPackageName, rendererConfig: tl.rendererConfig, overrideHookState: null, overrideHookStateDeletePath: null, overrideHookStateRenamePath: null, overrideProps: null, overridePropsDeletePath: null, overridePropsRenamePath: null, setErrorHandler: null, setSuspenseHandler: null, scheduleUpdate: null, currentDispatcherRef: ua.ReactCurrentDispatcher, findHostInstanceByFiber: function(a) {
    a = Zb(a);
    return null === a ? null : a.stateNode;
  }, findFiberByHostInstance: tl.findFiberByHostInstance || jl, findHostInstancesForRefresh: null, scheduleRefresh: null, scheduleRoot: null, setRefreshHandler: null, getCurrentFiber: null, reconcilerVersion: "18.3.1-next-f1338f8080-20240426" };
  if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
    var vl = __REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!vl.isDisabled && vl.supportsFiber) try {
      kc = vl.inject(ul), lc = vl;
    } catch (a) {
    }
  }
  reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = sl;
  reactDom_production_min.createPortal = function(a, b) {
    var c = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
    if (!nl(b)) throw Error(p(200));
    return cl(a, b, null, c);
  };
  reactDom_production_min.createRoot = function(a, b) {
    if (!nl(a)) throw Error(p(299));
    var c = false, d = "", e = kl;
    null !== b && void 0 !== b && (true === b.unstable_strictMode && (c = true), void 0 !== b.identifierPrefix && (d = b.identifierPrefix), void 0 !== b.onRecoverableError && (e = b.onRecoverableError));
    b = bl(a, 1, false, null, null, c, false, d, e);
    a[uf] = b.current;
    sf(8 === a.nodeType ? a.parentNode : a);
    return new ll(b);
  };
  reactDom_production_min.findDOMNode = function(a) {
    if (null == a) return null;
    if (1 === a.nodeType) return a;
    var b = a._reactInternals;
    if (void 0 === b) {
      if ("function" === typeof a.render) throw Error(p(188));
      a = Object.keys(a).join(",");
      throw Error(p(268, a));
    }
    a = Zb(b);
    a = null === a ? null : a.stateNode;
    return a;
  };
  reactDom_production_min.flushSync = function(a) {
    return Rk(a);
  };
  reactDom_production_min.hydrate = function(a, b, c) {
    if (!ol(b)) throw Error(p(200));
    return rl(null, a, b, true, c);
  };
  reactDom_production_min.hydrateRoot = function(a, b, c) {
    if (!nl(a)) throw Error(p(405));
    var d = null != c && c.hydratedSources || null, e = false, f = "", g = kl;
    null !== c && void 0 !== c && (true === c.unstable_strictMode && (e = true), void 0 !== c.identifierPrefix && (f = c.identifierPrefix), void 0 !== c.onRecoverableError && (g = c.onRecoverableError));
    b = el(b, null, a, 1, null != c ? c : null, e, false, f, g);
    a[uf] = b.current;
    sf(a);
    if (d) for (a = 0; a < d.length; a++) c = d[a], e = c._getVersion, e = e(c._source), null == b.mutableSourceEagerHydrationData ? b.mutableSourceEagerHydrationData = [c, e] : b.mutableSourceEagerHydrationData.push(
      c,
      e
    );
    return new ml(b);
  };
  reactDom_production_min.render = function(a, b, c) {
    if (!ol(b)) throw Error(p(200));
    return rl(null, a, b, false, c);
  };
  reactDom_production_min.unmountComponentAtNode = function(a) {
    if (!ol(a)) throw Error(p(40));
    return a._reactRootContainer ? (Rk(function() {
      rl(null, null, a, false, function() {
        a._reactRootContainer = null;
        a[uf] = null;
      });
    }), true) : false;
  };
  reactDom_production_min.unstable_batchedUpdates = Qk;
  reactDom_production_min.unstable_renderSubtreeIntoContainer = function(a, b, c, d) {
    if (!ol(c)) throw Error(p(200));
    if (null == a || void 0 === a._reactInternals) throw Error(p(38));
    return rl(a, b, c, false, d);
  };
  reactDom_production_min.version = "18.3.1-next-f1338f8080-20240426";
  return reactDom_production_min;
}
var hasRequiredReactDom;
function requireReactDom() {
  if (hasRequiredReactDom) return reactDom.exports;
  hasRequiredReactDom = 1;
  function checkDCE() {
    if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
      return;
    }
    try {
      __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
    } catch (err) {
      console.error(err);
    }
  }
  {
    checkDCE();
    reactDom.exports = requireReactDom_production_min();
  }
  return reactDom.exports;
}
var hasRequiredClient;
function requireClient() {
  if (hasRequiredClient) return client;
  hasRequiredClient = 1;
  var m = requireReactDom();
  {
    client.createRoot = m.createRoot;
    client.hydrateRoot = m.hydrateRoot;
  }
  return client;
}
var clientExports = requireClient();
function toolify(editorComponent) {
  return (handle, element) => {
    const root = clientExports.createRoot(element);
    root.render(
      reactExports.createElement(
        RepoContext.Provider,
        { value: element.repo },
        reactExports.createElement(editorComponent, {
          docUrl: handle.url,
          element
        })
      )
    );
    return () => {
      root.unmount();
    };
  };
}
const cmTheme = EditorView.theme({
  "&": { height: "100%", fontSize: "13px" },
  ".cm-scroller": {
    overflow: "auto",
    fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace"
  },
  ".cm-content": { padding: "12px 0" },
  ".cm-gutters": { border: "none", background: "transparent" },
  ".cm-lineNumbers .cm-gutterElement": {
    padding: "0 8px 0 12px",
    minWidth: "32px"
  },
  "&.cm-focused": { outline: "none" }
});
const cmDarkTheme = EditorView.theme(
  {
    "&": { backgroundColor: "#1a1a1a", color: "#e5e5e5" },
    ".cm-cursor": { borderLeftColor: "#e5e5e5" },
    ".cm-activeLine": { backgroundColor: "#ffffff08" },
    ".cm-activeLineGutter": { backgroundColor: "#ffffff08" },
    ".cm-selectionBackground": {
      backgroundColor: "#ffffff20 !important"
    },
    ".cm-gutters": { color: "#555" }
  },
  { dark: true }
);
const LaTeXEditor = ({ docUrl }) => {
  const [doc] = useDocument(docUrl, { suspense: true });
  const handle = useDocHandle(docUrl, { suspense: true });
  const editorContainerRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!editorContainerRef.current || !handle) return;
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const state = EditorState.create({
      doc: handle.doc()?.content ?? "",
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        highlightSpecialChars(),
        drawSelection(),
        dropCursor(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        foldGutter(),
        autocompletion(),
        highlightSelectionMatches(),
        history(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab
        ]),
        latex(),
        automergeSyncPlugin({ handle, path: ["content"] }),
        cmTheme,
        ...isDark ? [cmDarkTheme] : [],
        EditorView.lineWrapping
      ]
    });
    const view = new EditorView({
      state,
      parent: editorContainerRef.current
    });
    return () => view.destroy();
  }, [handle]);
  if (!doc) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "latex-loading", children: "Loading..." });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "latex-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: editorContainerRef, className: "latex-cm-container" }) });
};
const renderLaTeXEditor = toolify(LaTeXEditor);
export {
  LaTeXEditor,
  renderLaTeXEditor
};
//# sourceMappingURL=LaTeXEditor-ibSPDNNx.js.map
