import { getRegistry } from "@inkandswitch/patchwork-plugins";
const t$1 = globalThis, e$2 = t$1.ShadowRoot && (void 0 === t$1.ShadyCSS || t$1.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, s$2 = Symbol(), o$3 = /* @__PURE__ */ new WeakMap();
let n$2 = class n {
  constructor(t2, e2, o2) {
    if (this._$cssResult$ = true, o2 !== s$2) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = t2, this.t = e2;
  }
  get styleSheet() {
    let t2 = this.o;
    const s2 = this.t;
    if (e$2 && void 0 === t2) {
      const e2 = void 0 !== s2 && 1 === s2.length;
      e2 && (t2 = o$3.get(s2)), void 0 === t2 && ((this.o = t2 = new CSSStyleSheet()).replaceSync(this.cssText), e2 && o$3.set(s2, t2));
    }
    return t2;
  }
  toString() {
    return this.cssText;
  }
};
const r$2 = (t2) => new n$2("string" == typeof t2 ? t2 : t2 + "", void 0, s$2), S$1 = (s2, o2) => {
  if (e$2) s2.adoptedStyleSheets = o2.map((t2) => t2 instanceof CSSStyleSheet ? t2 : t2.styleSheet);
  else for (const e2 of o2) {
    const o3 = document.createElement("style"), n3 = t$1.litNonce;
    void 0 !== n3 && o3.setAttribute("nonce", n3), o3.textContent = e2.cssText, s2.appendChild(o3);
  }
}, c$2 = e$2 ? (t2) => t2 : (t2) => t2 instanceof CSSStyleSheet ? ((t3) => {
  let e2 = "";
  for (const s2 of t3.cssRules) e2 += s2.cssText;
  return r$2(e2);
})(t2) : t2;
const { is: i$2, defineProperty: e$1, getOwnPropertyDescriptor: h$1, getOwnPropertyNames: r$1, getOwnPropertySymbols: o$2, getPrototypeOf: n$1 } = Object, a$1 = globalThis, c$1 = a$1.trustedTypes, l$1 = c$1 ? c$1.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t2, s2) => t2, u$1 = { toAttribute(t2, s2) {
  switch (s2) {
    case Boolean:
      t2 = t2 ? l$1 : null;
      break;
    case Object:
    case Array:
      t2 = null == t2 ? t2 : JSON.stringify(t2);
  }
  return t2;
}, fromAttribute(t2, s2) {
  let i2 = t2;
  switch (s2) {
    case Boolean:
      i2 = null !== t2;
      break;
    case Number:
      i2 = null === t2 ? null : Number(t2);
      break;
    case Object:
    case Array:
      try {
        i2 = JSON.parse(t2);
      } catch (t3) {
        i2 = null;
      }
  }
  return i2;
} }, f$1 = (t2, s2) => !i$2(t2, s2), b$1 = { attribute: true, type: String, converter: u$1, reflect: false, useDefault: false, hasChanged: f$1 };
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let y$1 = class y extends HTMLElement {
  static addInitializer(t2) {
    this._$Ei(), (this.l ??= []).push(t2);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(t2, s2 = b$1) {
    if (s2.state && (s2.attribute = false), this._$Ei(), this.prototype.hasOwnProperty(t2) && ((s2 = Object.create(s2)).wrapped = true), this.elementProperties.set(t2, s2), !s2.noAccessor) {
      const i2 = Symbol(), h2 = this.getPropertyDescriptor(t2, i2, s2);
      void 0 !== h2 && e$1(this.prototype, t2, h2);
    }
  }
  static getPropertyDescriptor(t2, s2, i2) {
    const { get: e2, set: r2 } = h$1(this.prototype, t2) ?? { get() {
      return this[s2];
    }, set(t3) {
      this[s2] = t3;
    } };
    return { get: e2, set(s3) {
      const h2 = e2?.call(this);
      r2?.call(this, s3), this.requestUpdate(t2, h2, i2);
    }, configurable: true, enumerable: true };
  }
  static getPropertyOptions(t2) {
    return this.elementProperties.get(t2) ?? b$1;
  }
  static _$Ei() {
    if (this.hasOwnProperty(d$1("elementProperties"))) return;
    const t2 = n$1(this);
    t2.finalize(), void 0 !== t2.l && (this.l = [...t2.l]), this.elementProperties = new Map(t2.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(d$1("finalized"))) return;
    if (this.finalized = true, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
      const t3 = this.properties, s2 = [...r$1(t3), ...o$2(t3)];
      for (const i2 of s2) this.createProperty(i2, t3[i2]);
    }
    const t2 = this[Symbol.metadata];
    if (null !== t2) {
      const s2 = litPropertyMetadata.get(t2);
      if (void 0 !== s2) for (const [t3, i2] of s2) this.elementProperties.set(t3, i2);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t3, s2] of this.elementProperties) {
      const i2 = this._$Eu(t3, s2);
      void 0 !== i2 && this._$Eh.set(i2, t3);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(s2) {
    const i2 = [];
    if (Array.isArray(s2)) {
      const e2 = new Set(s2.flat(1 / 0).reverse());
      for (const s3 of e2) i2.unshift(c$2(s3));
    } else void 0 !== s2 && i2.push(c$2(s2));
    return i2;
  }
  static _$Eu(t2, s2) {
    const i2 = s2.attribute;
    return false === i2 ? void 0 : "string" == typeof i2 ? i2 : "string" == typeof t2 ? t2.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = false, this.hasUpdated = false, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((t2) => this.enableUpdating = t2), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t2) => t2(this));
  }
  addController(t2) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(t2), void 0 !== this.renderRoot && this.isConnected && t2.hostConnected?.();
  }
  removeController(t2) {
    this._$EO?.delete(t2);
  }
  _$E_() {
    const t2 = /* @__PURE__ */ new Map(), s2 = this.constructor.elementProperties;
    for (const i2 of s2.keys()) this.hasOwnProperty(i2) && (t2.set(i2, this[i2]), delete this[i2]);
    t2.size > 0 && (this._$Ep = t2);
  }
  createRenderRoot() {
    const t2 = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return S$1(t2, this.constructor.elementStyles), t2;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(true), this._$EO?.forEach((t2) => t2.hostConnected?.());
  }
  enableUpdating(t2) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((t2) => t2.hostDisconnected?.());
  }
  attributeChangedCallback(t2, s2, i2) {
    this._$AK(t2, i2);
  }
  _$ET(t2, s2) {
    const i2 = this.constructor.elementProperties.get(t2), e2 = this.constructor._$Eu(t2, i2);
    if (void 0 !== e2 && true === i2.reflect) {
      const h2 = (void 0 !== i2.converter?.toAttribute ? i2.converter : u$1).toAttribute(s2, i2.type);
      this._$Em = t2, null == h2 ? this.removeAttribute(e2) : this.setAttribute(e2, h2), this._$Em = null;
    }
  }
  _$AK(t2, s2) {
    const i2 = this.constructor, e2 = i2._$Eh.get(t2);
    if (void 0 !== e2 && this._$Em !== e2) {
      const t3 = i2.getPropertyOptions(e2), h2 = "function" == typeof t3.converter ? { fromAttribute: t3.converter } : void 0 !== t3.converter?.fromAttribute ? t3.converter : u$1;
      this._$Em = e2;
      const r2 = h2.fromAttribute(s2, t3.type);
      this[e2] = r2 ?? this._$Ej?.get(e2) ?? r2, this._$Em = null;
    }
  }
  requestUpdate(t2, s2, i2, e2 = false, h2) {
    if (void 0 !== t2) {
      const r2 = this.constructor;
      if (false === e2 && (h2 = this[t2]), i2 ??= r2.getPropertyOptions(t2), !((i2.hasChanged ?? f$1)(h2, s2) || i2.useDefault && i2.reflect && h2 === this._$Ej?.get(t2) && !this.hasAttribute(r2._$Eu(t2, i2)))) return;
      this.C(t2, s2, i2);
    }
    false === this.isUpdatePending && (this._$ES = this._$EP());
  }
  C(t2, s2, { useDefault: i2, reflect: e2, wrapped: h2 }, r2) {
    i2 && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t2) && (this._$Ej.set(t2, r2 ?? s2 ?? this[t2]), true !== h2 || void 0 !== r2) || (this._$AL.has(t2) || (this.hasUpdated || i2 || (s2 = void 0), this._$AL.set(t2, s2)), true === e2 && this._$Em !== t2 && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t2));
  }
  async _$EP() {
    this.isUpdatePending = true;
    try {
      await this._$ES;
    } catch (t3) {
      Promise.reject(t3);
    }
    const t2 = this.scheduleUpdate();
    return null != t2 && await t2, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [t4, s3] of this._$Ep) this[t4] = s3;
        this._$Ep = void 0;
      }
      const t3 = this.constructor.elementProperties;
      if (t3.size > 0) for (const [s3, i2] of t3) {
        const { wrapped: t4 } = i2, e2 = this[s3];
        true !== t4 || this._$AL.has(s3) || void 0 === e2 || this.C(s3, void 0, i2, e2);
      }
    }
    let t2 = false;
    const s2 = this._$AL;
    try {
      t2 = this.shouldUpdate(s2), t2 ? (this.willUpdate(s2), this._$EO?.forEach((t3) => t3.hostUpdate?.()), this.update(s2)) : this._$EM();
    } catch (s3) {
      throw t2 = false, this._$EM(), s3;
    }
    t2 && this._$AE(s2);
  }
  willUpdate(t2) {
  }
  _$AE(t2) {
    this._$EO?.forEach((t3) => t3.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = true, this.firstUpdated(t2)), this.updated(t2);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = false;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(t2) {
    return true;
  }
  update(t2) {
    this._$Eq &&= this._$Eq.forEach((t3) => this._$ET(t3, this[t3])), this._$EM();
  }
  updated(t2) {
  }
  firstUpdated(t2) {
  }
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
const t = globalThis, i$1 = (t2) => t2, s$1 = t.trustedTypes, e = s$1 ? s$1.createPolicy("lit-html", { createHTML: (t2) => t2 }) : void 0, h = "$lit$", o$1 = `lit$${Math.random().toFixed(9).slice(2)}$`, n2 = "?" + o$1, r = `<${n2}>`, l = document, c = () => l.createComment(""), a = (t2) => null === t2 || "object" != typeof t2 && "function" != typeof t2, u = Array.isArray, d = (t2) => u(t2) || "function" == typeof t2?.[Symbol.iterator], f = "[ 	\n\f\r]", v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, _ = /-->/g, m = />/g, p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), g = /'/g, $ = /"/g, y2 = /^(?:script|style|textarea|title)$/i, x = (t2) => (i2, ...s2) => ({ _$litType$: t2, strings: i2, values: s2 }), b = x(1), E = Symbol.for("lit-noChange"), A = Symbol.for("lit-nothing"), C = /* @__PURE__ */ new WeakMap(), P = l.createTreeWalker(l, 129);
function V(t2, i2) {
  if (!u(t2) || !t2.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return void 0 !== e ? e.createHTML(i2) : i2;
}
const N = (t2, i2) => {
  const s2 = t2.length - 1, e2 = [];
  let n3, l2 = 2 === i2 ? "<svg>" : 3 === i2 ? "<math>" : "", c2 = v;
  for (let i3 = 0; i3 < s2; i3++) {
    const s3 = t2[i3];
    let a2, u2, d2 = -1, f2 = 0;
    for (; f2 < s3.length && (c2.lastIndex = f2, u2 = c2.exec(s3), null !== u2); ) f2 = c2.lastIndex, c2 === v ? "!--" === u2[1] ? c2 = _ : void 0 !== u2[1] ? c2 = m : void 0 !== u2[2] ? (y2.test(u2[2]) && (n3 = RegExp("</" + u2[2], "g")), c2 = p) : void 0 !== u2[3] && (c2 = p) : c2 === p ? ">" === u2[0] ? (c2 = n3 ?? v, d2 = -1) : void 0 === u2[1] ? d2 = -2 : (d2 = c2.lastIndex - u2[2].length, a2 = u2[1], c2 = void 0 === u2[3] ? p : '"' === u2[3] ? $ : g) : c2 === $ || c2 === g ? c2 = p : c2 === _ || c2 === m ? c2 = v : (c2 = p, n3 = void 0);
    const x2 = c2 === p && t2[i3 + 1].startsWith("/>") ? " " : "";
    l2 += c2 === v ? s3 + r : d2 >= 0 ? (e2.push(a2), s3.slice(0, d2) + h + s3.slice(d2) + o$1 + x2) : s3 + o$1 + (-2 === d2 ? i3 : x2);
  }
  return [V(t2, l2 + (t2[s2] || "<?>") + (2 === i2 ? "</svg>" : 3 === i2 ? "</math>" : "")), e2];
};
class S {
  constructor({ strings: t2, _$litType$: i2 }, e2) {
    let r2;
    this.parts = [];
    let l2 = 0, a2 = 0;
    const u2 = t2.length - 1, d2 = this.parts, [f2, v2] = N(t2, i2);
    if (this.el = S.createElement(f2, e2), P.currentNode = this.el.content, 2 === i2 || 3 === i2) {
      const t3 = this.el.content.firstChild;
      t3.replaceWith(...t3.childNodes);
    }
    for (; null !== (r2 = P.nextNode()) && d2.length < u2; ) {
      if (1 === r2.nodeType) {
        if (r2.hasAttributes()) for (const t3 of r2.getAttributeNames()) if (t3.endsWith(h)) {
          const i3 = v2[a2++], s2 = r2.getAttribute(t3).split(o$1), e3 = /([.?@])?(.*)/.exec(i3);
          d2.push({ type: 1, index: l2, name: e3[2], strings: s2, ctor: "." === e3[1] ? I : "?" === e3[1] ? L : "@" === e3[1] ? z : H }), r2.removeAttribute(t3);
        } else t3.startsWith(o$1) && (d2.push({ type: 6, index: l2 }), r2.removeAttribute(t3));
        if (y2.test(r2.tagName)) {
          const t3 = r2.textContent.split(o$1), i3 = t3.length - 1;
          if (i3 > 0) {
            r2.textContent = s$1 ? s$1.emptyScript : "";
            for (let s2 = 0; s2 < i3; s2++) r2.append(t3[s2], c()), P.nextNode(), d2.push({ type: 2, index: ++l2 });
            r2.append(t3[i3], c());
          }
        }
      } else if (8 === r2.nodeType) if (r2.data === n2) d2.push({ type: 2, index: l2 });
      else {
        let t3 = -1;
        for (; -1 !== (t3 = r2.data.indexOf(o$1, t3 + 1)); ) d2.push({ type: 7, index: l2 }), t3 += o$1.length - 1;
      }
      l2++;
    }
  }
  static createElement(t2, i2) {
    const s2 = l.createElement("template");
    return s2.innerHTML = t2, s2;
  }
}
function M(t2, i2, s2 = t2, e2) {
  if (i2 === E) return i2;
  let h2 = void 0 !== e2 ? s2._$Co?.[e2] : s2._$Cl;
  const o2 = a(i2) ? void 0 : i2._$litDirective$;
  return h2?.constructor !== o2 && (h2?._$AO?.(false), void 0 === o2 ? h2 = void 0 : (h2 = new o2(t2), h2._$AT(t2, s2, e2)), void 0 !== e2 ? (s2._$Co ??= [])[e2] = h2 : s2._$Cl = h2), void 0 !== h2 && (i2 = M(t2, h2._$AS(t2, i2.values), h2, e2)), i2;
}
class R {
  constructor(t2, i2) {
    this._$AV = [], this._$AN = void 0, this._$AD = t2, this._$AM = i2;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(t2) {
    const { el: { content: i2 }, parts: s2 } = this._$AD, e2 = (t2?.creationScope ?? l).importNode(i2, true);
    P.currentNode = e2;
    let h2 = P.nextNode(), o2 = 0, n3 = 0, r2 = s2[0];
    for (; void 0 !== r2; ) {
      if (o2 === r2.index) {
        let i3;
        2 === r2.type ? i3 = new k(h2, h2.nextSibling, this, t2) : 1 === r2.type ? i3 = new r2.ctor(h2, r2.name, r2.strings, this, t2) : 6 === r2.type && (i3 = new Z(h2, this, t2)), this._$AV.push(i3), r2 = s2[++n3];
      }
      o2 !== r2?.index && (h2 = P.nextNode(), o2++);
    }
    return P.currentNode = l, e2;
  }
  p(t2) {
    let i2 = 0;
    for (const s2 of this._$AV) void 0 !== s2 && (void 0 !== s2.strings ? (s2._$AI(t2, s2, i2), i2 += s2.strings.length - 2) : s2._$AI(t2[i2])), i2++;
  }
}
class k {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(t2, i2, s2, e2) {
    this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t2, this._$AB = i2, this._$AM = s2, this.options = e2, this._$Cv = e2?.isConnected ?? true;
  }
  get parentNode() {
    let t2 = this._$AA.parentNode;
    const i2 = this._$AM;
    return void 0 !== i2 && 11 === t2?.nodeType && (t2 = i2.parentNode), t2;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(t2, i2 = this) {
    t2 = M(this, t2, i2), a(t2) ? t2 === A || null == t2 || "" === t2 ? (this._$AH !== A && this._$AR(), this._$AH = A) : t2 !== this._$AH && t2 !== E && this._(t2) : void 0 !== t2._$litType$ ? this.$(t2) : void 0 !== t2.nodeType ? this.T(t2) : d(t2) ? this.k(t2) : this._(t2);
  }
  O(t2) {
    return this._$AA.parentNode.insertBefore(t2, this._$AB);
  }
  T(t2) {
    this._$AH !== t2 && (this._$AR(), this._$AH = this.O(t2));
  }
  _(t2) {
    this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t2 : this.T(l.createTextNode(t2)), this._$AH = t2;
  }
  $(t2) {
    const { values: i2, _$litType$: s2 } = t2, e2 = "number" == typeof s2 ? this._$AC(t2) : (void 0 === s2.el && (s2.el = S.createElement(V(s2.h, s2.h[0]), this.options)), s2);
    if (this._$AH?._$AD === e2) this._$AH.p(i2);
    else {
      const t3 = new R(e2, this), s3 = t3.u(this.options);
      t3.p(i2), this.T(s3), this._$AH = t3;
    }
  }
  _$AC(t2) {
    let i2 = C.get(t2.strings);
    return void 0 === i2 && C.set(t2.strings, i2 = new S(t2)), i2;
  }
  k(t2) {
    u(this._$AH) || (this._$AH = [], this._$AR());
    const i2 = this._$AH;
    let s2, e2 = 0;
    for (const h2 of t2) e2 === i2.length ? i2.push(s2 = new k(this.O(c()), this.O(c()), this, this.options)) : s2 = i2[e2], s2._$AI(h2), e2++;
    e2 < i2.length && (this._$AR(s2 && s2._$AB.nextSibling, e2), i2.length = e2);
  }
  _$AR(t2 = this._$AA.nextSibling, s2) {
    for (this._$AP?.(false, true, s2); t2 !== this._$AB; ) {
      const s3 = i$1(t2).nextSibling;
      i$1(t2).remove(), t2 = s3;
    }
  }
  setConnected(t2) {
    void 0 === this._$AM && (this._$Cv = t2, this._$AP?.(t2));
  }
}
class H {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(t2, i2, s2, e2, h2) {
    this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t2, this.name = i2, this._$AM = e2, this.options = h2, s2.length > 2 || "" !== s2[0] || "" !== s2[1] ? (this._$AH = Array(s2.length - 1).fill(new String()), this.strings = s2) : this._$AH = A;
  }
  _$AI(t2, i2 = this, s2, e2) {
    const h2 = this.strings;
    let o2 = false;
    if (void 0 === h2) t2 = M(this, t2, i2, 0), o2 = !a(t2) || t2 !== this._$AH && t2 !== E, o2 && (this._$AH = t2);
    else {
      const e3 = t2;
      let n3, r2;
      for (t2 = h2[0], n3 = 0; n3 < h2.length - 1; n3++) r2 = M(this, e3[s2 + n3], i2, n3), r2 === E && (r2 = this._$AH[n3]), o2 ||= !a(r2) || r2 !== this._$AH[n3], r2 === A ? t2 = A : t2 !== A && (t2 += (r2 ?? "") + h2[n3 + 1]), this._$AH[n3] = r2;
    }
    o2 && !e2 && this.j(t2);
  }
  j(t2) {
    t2 === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t2 ?? "");
  }
}
class I extends H {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(t2) {
    this.element[this.name] = t2 === A ? void 0 : t2;
  }
}
class L extends H {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(t2) {
    this.element.toggleAttribute(this.name, !!t2 && t2 !== A);
  }
}
class z extends H {
  constructor(t2, i2, s2, e2, h2) {
    super(t2, i2, s2, e2, h2), this.type = 5;
  }
  _$AI(t2, i2 = this) {
    if ((t2 = M(this, t2, i2, 0) ?? A) === E) return;
    const s2 = this._$AH, e2 = t2 === A && s2 !== A || t2.capture !== s2.capture || t2.once !== s2.once || t2.passive !== s2.passive, h2 = t2 !== A && (s2 === A || e2);
    e2 && this.element.removeEventListener(this.name, this, s2), h2 && this.element.addEventListener(this.name, this, t2), this._$AH = t2;
  }
  handleEvent(t2) {
    "function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t2) : this._$AH.handleEvent(t2);
  }
}
class Z {
  constructor(t2, i2, s2) {
    this.element = t2, this.type = 6, this._$AN = void 0, this._$AM = i2, this.options = s2;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(t2) {
    M(this, t2);
  }
}
const B = t.litHtmlPolyfillSupport;
B?.(S, k), (t.litHtmlVersions ??= []).push("3.3.2");
const D = (t2, i2, s2) => {
  const e2 = s2?.renderBefore ?? i2;
  let h2 = e2._$litPart$;
  if (void 0 === h2) {
    const t3 = s2?.renderBefore ?? null;
    e2._$litPart$ = h2 = new k(i2.insertBefore(c(), t3), t3, void 0, s2 ?? {});
  }
  return h2._$AI(t2), h2;
};
const s = globalThis;
class i extends y$1 {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const t2 = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= t2.firstChild, t2;
  }
  update(t2) {
    const r2 = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t2), this._$Do = D(r2, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(true);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(false);
  }
  render() {
    return E;
  }
}
i._$litElement$ = true, i["finalized"] = true, s.litElementHydrateSupport?.({ LitElement: i });
const o = s.litElementPolyfillSupport;
o?.({ LitElement: i });
(s.litElementVersions ??= []).push("4.2.2");
const defaultAttributes = {
  xmlns: "http://www.w3.org/2000/svg",
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  "stroke-width": 2,
  "stroke-linecap": "round",
  "stroke-linejoin": "round"
};
const createSVGElement = ([tag, attrs, children]) => {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.keys(attrs).forEach((name) => {
    element.setAttribute(name, String(attrs[name]));
  });
  if (children?.length) {
    children.forEach((child) => {
      const childElement = createSVGElement(child);
      element.appendChild(childElement);
    });
  }
  return element;
};
const createElement = (iconNode, customAttrs = {}) => {
  const tag = "svg";
  const attrs = {
    ...defaultAttributes,
    ...customAttrs
  };
  return createSVGElement([tag, attrs, iconNode]);
};
const GripHorizontal = [
  ["circle", { cx: "12", cy: "9", r: "1" }],
  ["circle", { cx: "19", cy: "9", r: "1" }],
  ["circle", { cx: "5", cy: "9", r: "1" }],
  ["circle", { cx: "12", cy: "15", r: "1" }],
  ["circle", { cx: "19", cy: "15", r: "1" }],
  ["circle", { cx: "5", cy: "15", r: "1" }]
];
const Maximize2 = [
  ["path", { d: "M15 3h6v6" }],
  ["path", { d: "m21 3-7 7" }],
  ["path", { d: "m3 21 7-7" }],
  ["path", { d: "M9 21H3v-6" }]
];
const Minimize2 = [
  ["path", { d: "m14 10 7-7" }],
  ["path", { d: "M20 10h-6V4" }],
  ["path", { d: "m3 21 7-7" }],
  ["path", { d: "M4 14h6v6" }]
];
const Trash2 = [
  ["path", { d: "M10 11v6" }],
  ["path", { d: "M14 11v6" }],
  ["path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" }],
  ["path", { d: "M3 6h18" }],
  ["path", { d: "M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" }]
];
const X = [
  ["path", { d: "M18 6 6 18" }],
  ["path", { d: "m6 6 12 12" }]
];
const TAG$1 = "patchwork-space";
if (typeof Element.prototype.moveBefore !== "function") {
  alert("This browser does not support moveBefore(). Please use Chrome or Firefox.");
}
function createIcon(iconData, size = 14) {
  return createElement(iconData, { width: size, height: size });
}
function findDropTarget(elementBelow, draggedEl, clientX, clientY) {
  let candidate = elementBelow;
  while (candidate) {
    if (candidate === draggedEl) {
      candidate = candidate.parentElement;
      continue;
    }
    if (candidate.tagName.toLowerCase() === TAG$1) {
      const isLeaf = !candidate.querySelector(`:scope > ${TAG$1}`);
      if (isLeaf) {
        candidate = candidate.parentElement;
        if (candidate === draggedEl) candidate = candidate?.parentElement ?? null;
      }
      break;
    }
    candidate = candidate.parentElement;
  }
  if (!candidate || candidate.tagName.toLowerCase() !== TAG$1) {
    return { container: null, refChild: null };
  }
  const container = candidate;
  const children = Array.from(container.querySelectorAll(`:scope > ${TAG$1}`)).filter((c2) => c2 !== draggedEl);
  if (children.length === 0) {
    return { container, refChild: null };
  }
  const isHoriz = container.direction !== "vertical";
  let bestRef = null;
  for (const child of children) {
    const r2 = child.getBoundingClientRect();
    const mid = isHoriz ? r2.left + r2.width / 2 : r2.top + r2.height / 2;
    const pos = isHoriz ? clientX : clientY;
    if (pos < mid) {
      bestRef = child;
      break;
    }
  }
  return { container, refChild: bestRef };
}
class PatchworkSpaceElement extends i {
  static properties = {
    direction: { reflect: true },
    editing: { type: Boolean, reflect: true }
  };
  #isDragging = false;
  #dragMoveHandler = null;
  #dragUpHandler = null;
  #dragHandleEl = null;
  constructor() {
    super();
    this.direction = "horizontal";
    this.editing = false;
  }
  createRenderRoot() {
    return this;
  }
  get isLeaf() {
    return !this.querySelector(`:scope > ${TAG$1}`);
  }
  get depth() {
    let d2 = 0;
    let el = this.parentElement;
    while (el) {
      if (el.tagName.toLowerCase() === TAG$1) d2++;
      el = el.parentElement;
    }
    return d2;
  }
  getSpaceChildren() {
    return Array.from(this.querySelectorAll(`:scope > ${TAG$1}`));
  }
  // ---- Lifecycle ----
  connectedCallback() {
    super.connectedCallback();
    this.#applyLayoutStyles();
    if (this.editing) {
      this.#syncEditUI();
      this.#cascadeEditing();
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  connectedMoveCallback() {
    this.#applyLayoutStyles();
    this.#syncEditUI();
  }
  updated(_changed) {
    this.#applyLayoutStyles();
    this.#syncEditUI();
    this.#cascadeEditing();
  }
  render() {
    return A;
  }
  // ---- Layout styles ----
  #applyLayoutStyles() {
    this.style.display = "flex";
    this.style.flexDirection = this.direction === "vertical" ? "column" : "row";
    this.style.position = "relative";
    this.style.minWidth = "0";
    this.style.minHeight = "0";
    this.style.setProperty("--depth", String(this.depth));
    if (this.editing && !this.isLeaf) {
      this.style.overflow = "visible";
    } else {
      this.style.overflow = "hidden";
    }
  }
  #cascadeEditing() {
    for (const child of Array.from(this.children)) {
      const tag = child.tagName.toLowerCase();
      if (tag === TAG$1 || tag === "patchwork-pipe") {
        if (this.editing) {
          child.setAttribute("editing", "");
        } else {
          child.removeAttribute("editing");
        }
      }
    }
  }
  // ---- Edit UI ----
  #syncEditUI() {
    if (this.editing) {
      if (this.isLeaf) {
        this.#ensureDragHandle();
      } else {
        this.#removeDragHandle();
        this.#syncPipes();
      }
    } else {
      this.#removeDragHandle();
    }
  }
  refreshEditUI() {
    this.#applyLayoutStyles();
    this.#syncEditUI();
    this.#cascadeEditing();
  }
  // ---- Drag handle ----
  #ensureDragHandle() {
    if (!this.#dragHandleEl) {
      const handle = document.createElement("div");
      handle.className = "space-drag-handle";
      const grip = createIcon(GripHorizontal, 14);
      grip.style.flexShrink = "0";
      handle.appendChild(grip);
      const closeBtn = document.createElement("button");
      closeBtn.className = "space-handle-close";
      closeBtn.appendChild(createIcon(X, 12));
      closeBtn.addEventListener("pointerdown", (e2) => e2.stopPropagation());
      closeBtn.addEventListener("click", (e2) => {
        e2.stopPropagation();
        this.dispatchEvent(
          new CustomEvent("space:remove", { detail: { id: this.id }, bubbles: true })
        );
      });
      handle.appendChild(closeBtn);
      handle.addEventListener("pointerdown", this.#onDragStart);
      handle.addEventListener("dragstart", (e2) => e2.preventDefault());
      this.#dragHandleEl = handle;
    }
    if (!this.contains(this.#dragHandleEl)) {
      this.appendChild(this.#dragHandleEl);
    }
  }
  #removeDragHandle() {
    this.#dragHandleEl?.remove();
  }
  // ---- Pipes (act as dividers between siblings) ----
  #isContentElement(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === TAG$1) return true;
    if (tag === "patchwork-pipe" && el.hasAttribute("expanded")) return true;
    return false;
  }
  #isDividerPipe(el) {
    return el.tagName.toLowerCase() === "patchwork-pipe" && !el.hasAttribute("expanded");
  }
  #findDividerBetween(beforeEl, afterEl) {
    let sibling = beforeEl.nextElementSibling;
    while (sibling && sibling !== afterEl) {
      if (this.#isDividerPipe(sibling)) return sibling;
      sibling = sibling.nextElementSibling;
    }
    return null;
  }
  #syncPipes() {
    const contentChildren = [];
    for (const child of Array.from(this.children)) {
      if (this.#isContentElement(child)) {
        contentChildren.push(child);
      }
    }
    if (contentChildren.length < 2) return;
    const usedDividers = /* @__PURE__ */ new Set();
    for (let i2 = 0; i2 < contentChildren.length - 1; i2++) {
      const beforeEl = contentChildren[i2];
      const afterEl = contentChildren[i2 + 1];
      let pipe = this.#findDividerBetween(beforeEl, afterEl);
      if (!pipe) {
        pipe = document.createElement("patchwork-pipe");
        pipe.id = `pipe-${Date.now()}-${i2}`;
        beforeEl.after(pipe);
      }
      usedDividers.add(pipe);
      if (this.editing) {
        pipe.setAttribute("editing", "");
      } else {
        pipe.removeAttribute("editing");
      }
    }
    for (const child of Array.from(this.children)) {
      if (this.#isDividerPipe(child) && !usedDividers.has(child) && !child.getAttribute("transform")) {
        child.remove();
      }
    }
  }
  // ---- Drag reorder (with cross-container reparenting) ----
  #cleanupDrag() {
    if (this.#dragMoveHandler) {
      document.removeEventListener("pointermove", this.#dragMoveHandler);
      this.#dragMoveHandler = null;
    }
    if (this.#dragUpHandler) {
      document.removeEventListener("pointerup", this.#dragUpHandler);
      this.#dragUpHandler = null;
    }
    this.#isDragging = false;
  }
  #onDragStart = (event) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const originalParent = this.parentElement;
    if (!originalParent) return;
    this.#isDragging = true;
    this.setAttribute("aria-grabbed", "true");
    const rect = this.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const onMove = (ev) => {
      this.style.setProperty("--drag-x", "0px");
      this.style.setProperty("--drag-y", "0px");
      const r2 = this.getBoundingClientRect();
      this.style.setProperty("--drag-x", `${ev.clientX - (r2.left + offsetX)}px`);
      this.style.setProperty("--drag-y", `${ev.clientY - (r2.top + offsetY)}px`);
      this.style.pointerEvents = "none";
      const elementBelow = document.elementFromPoint(ev.clientX, ev.clientY);
      this.style.pointerEvents = "";
      for (const el of Array.from(document.querySelectorAll(".drop-target"))) {
        el.classList.remove("drop-target");
      }
      if (!elementBelow) return;
      const { container, refChild } = findDropTarget(elementBelow, this, ev.clientX, ev.clientY);
      if (!container) return;
      container.classList.add("drop-target");
      const currentParent = this.parentElement;
      const siblings = Array.from(container.children);
      const myIdx = currentParent === container ? siblings.indexOf(this) : -1;
      const refIdx = refChild ? siblings.indexOf(refChild) : siblings.length;
      if (myIdx >= 0 && (refIdx === myIdx || refIdx === myIdx + 1)) return;
      container.moveBefore(this, refChild);
      this.style.setProperty("--drag-x", "0px");
      this.style.setProperty("--drag-y", "0px");
      const nr = this.getBoundingClientRect();
      this.style.setProperty("--drag-x", `${ev.clientX - (nr.left + offsetX)}px`);
      this.style.setProperty("--drag-y", `${ev.clientY - (nr.top + offsetY)}px`);
    };
    const onUp = () => {
      this.removeAttribute("aria-grabbed");
      this.style.removeProperty("--drag-x");
      this.style.removeProperty("--drag-y");
      this.#cleanupDrag();
      for (const el of Array.from(document.querySelectorAll(".drop-target"))) {
        el.classList.remove("drop-target");
      }
      const newParent = this.parentElement;
      if (originalParent !== newParent) {
        originalParent.refreshEditUI();
      }
      if (newParent) {
        newParent.refreshEditUI();
      }
      this.dispatchEvent(new CustomEvent("space:reorder", { bubbles: true }));
    };
    this.#dragMoveHandler = onMove;
    this.#dragUpHandler = onUp;
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  };
}
function registerPatchworkSpace() {
  if (customElements.get(TAG$1)) return;
  customElements.define(TAG$1, PatchworkSpaceElement);
}
const ELEMENT_NAME = "patchwork-preview";
class PatchworkPreviewElement extends i {
  #iframe = null;
  #currentBlobUrl = null;
  createRenderRoot() {
    return this;
  }
  get value() {
    return null;
  }
  set value(v2) {
    if (!this.#iframe) return;
    if (this.#currentBlobUrl) {
      URL.revokeObjectURL(this.#currentBlobUrl);
      this.#currentBlobUrl = null;
    }
    if (v2 === null) {
      this.#iframe.removeAttribute("src");
      this.#iframe.removeAttribute("srcdoc");
      return;
    }
    if (typeof v2 === "string") {
      this.#iframe.removeAttribute("src");
      this.#iframe.srcdoc = v2;
    } else if (v2 instanceof Blob) {
      this.#iframe.removeAttribute("srcdoc");
      this.#currentBlobUrl = URL.createObjectURL(v2);
      this.#iframe.src = this.#currentBlobUrl;
    }
  }
  connectedCallback() {
    super.connectedCallback();
    this.style.display = "block";
    this.style.width = "100%";
    this.style.height = "100%";
    this.style.overflow = "hidden";
    this.#iframe = document.createElement("iframe");
    this.#iframe.style.cssText = "width:100%;height:100%;border:none;background:transparent;";
    this.#iframe.setAttribute("sandbox", "allow-scripts allow-same-origin");
    this.appendChild(this.#iframe);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
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
const TRANSFORM_TYPE = "patchwork:transform";
function getTransformRegistry() {
  return getRegistry(TRANSFORM_TYPE);
}
async function loadTransform(id) {
  return getTransformRegistry().load(id);
}
const TAG = "patchwork-pipe";
const SPACE_TAG = "patchwork-space";
function icon(data, size = 12) {
  return createElement(data, { width: size, height: size });
}
function isLayoutChrome(el) {
  const tag = el.tagName.toLowerCase();
  return tag !== SPACE_TAG && tag !== TAG && tag !== "patchwork-view" && tag !== "patchwork-preview";
}
class PatchworkPipeElement extends i {
  static properties = {
    editing: { type: Boolean, reflect: true },
    transform: { type: String, reflect: true },
    expanded: { type: Boolean, reflect: true },
    _editorOpen: { state: true }
  };
  #input = void 0;
  #output = void 0;
  #loadedTransform = null;
  #cleanup = null;
  #debounceTimer = null;
  #config = {};
  #previewIframe = null;
  #retryTimer = null;
  constructor() {
    super();
    this.editing = false;
    this.transform = "";
    this.expanded = false;
    this._editorOpen = false;
  }
  get input() {
    return this.#input;
  }
  set input(value) {
    this.#input = value;
    this.#runTransform();
  }
  get output() {
    return this.#output;
  }
  get config() {
    return { ...this.#config };
  }
  set config(value) {
    this.#config = { ...value };
    if (this.#input !== void 0) this.#runTransform();
  }
  createRenderRoot() {
    return this;
  }
  connectedCallback() {
    super.connectedCallback();
    this.#applyStyles();
    this.addEventListener("pointerdown", this.#onPointerDown);
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener("pointerdown", this.#onPointerDown);
    this.#teardownPipe();
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
  }
  #onPointerDown = (e2) => {
    if (!this.editing || this.expanded) return;
    if (e2.target.closest(".pipe-center-btn, .pipe-editor")) return;
    this.handleResize(e2);
  };
  connectedMoveCallback() {
  }
  updated(changed) {
    this.#applyStyles();
    if (changed.has("transform")) {
      this.#teardownPipe();
      if (this.transform) this.#loadAndSetup();
    }
    if (changed.has("editing") && !this.editing && this.transform) {
      this.#teardownPipe();
      this.#loadAndSetup();
    }
    if (changed.has("expanded")) {
      this.#syncExpandedPreview();
    }
    if (changed.has("transform") || changed.has("expanded")) {
      this.dispatchEvent(new CustomEvent("pipe:update", { bubbles: true }));
      requestAnimationFrame(() => {
        const parent = this.parentElement;
        if (parent) parent.refreshEditUI?.();
      });
    }
  }
  // ---- Styles ----
  #applyStyles() {
    const parent = this.parentElement;
    const parentDir = parent?.getAttribute("direction");
    const isVertical = parentDir === "vertical";
    const parentDepth = parent?.tagName.toLowerCase() === SPACE_TAG ? parseInt(getComputedStyle(parent).getPropertyValue("--depth") || "0", 10) : 0;
    const childDepth = parentDepth + 1;
    const chroma = Math.min(0.15, Math.max(0, (childDepth - 1) * 0.15));
    const hue = 250 - Math.max(0, childDepth - 2) * 40;
    this.style.setProperty("--depth-color", `oklch(0.55 ${chroma} ${hue})`);
    if (this.expanded && this.transform) {
      this.style.display = "flex";
      this.style.flexDirection = "column";
      this.style.alignItems = "stretch";
      this.style.justifyContent = "stretch";
      this.style.flexShrink = "0";
      this.style.flex = "1 0 0px";
      this.style.minWidth = "0";
      this.style.minHeight = "0";
      this.style.cursor = "";
      this.style.width = "";
      this.style.height = "";
    } else if (this.editing) {
      this.style.display = "flex";
      this.style.flexDirection = "";
      this.style.alignItems = "center";
      this.style.justifyContent = "center";
      this.style.flexShrink = "0";
      this.style.flex = "";
      this.style.minWidth = "";
      this.style.minHeight = "";
      this.style.position = "relative";
      if (isVertical) {
        this.style.height = "6px";
        this.style.width = "100%";
        this.style.cursor = "row-resize";
      } else {
        this.style.width = "6px";
        this.style.height = "100%";
        this.style.cursor = "col-resize";
      }
    } else {
      this.style.display = "none";
      this._editorOpen = false;
    }
  }
  // ---- Render ----
  render() {
    if (!this.editing && !this.expanded) return A;
    if (this.expanded && this.transform) {
      return b`
        <div class="pipe-expanded-header">
          <span>${this.transform}</span>
          <button
            class="pipe-expanded-collapse"
            title="Collapse preview"
            @click=${() => {
        this.expanded = false;
      }}
          >${icon(Minimize2, 14)}</button>
        </div>
      `;
    }
    if (!this.editing) return A;
    return b`
      <button
        class="pipe-center-btn"
        title=${this.transform || "Configure pipe"}
        @pointerdown=${(e2) => e2.stopPropagation()}
        @click=${() => {
      this._editorOpen = !this._editorOpen;
    }}
      >${this.transform ? "⟡" : "⊕"}</button>
      ${this._editorOpen ? this.#renderEditor() : A}
    `;
  }
  #renderEditor() {
    const available = getTransformRegistry().all();
    return b`
      <div class="pipe-editor" @pointerdown=${(e2) => e2.stopPropagation()}>
        <div class="pipe-editor-header">
          <span>Pipe</span>
          <div class="pipe-editor-header-actions">
            ${this.transform ? b`
              <button
                class="pipe-editor-expand-btn"
                title=${this.expanded ? "Collapse" : "Expand preview"}
                @click=${() => {
      this.expanded = !this.expanded;
    }}
              >${this.expanded ? icon(Minimize2, 14) : icon(Maximize2, 14)}</button>
              <button
                class="pipe-editor-clear-btn"
                title="Clear transform"
                @click=${this.#removeTransform}
              >${icon(Trash2, 12)}</button>
            ` : A}
            <button class="pipe-editor-close" @click=${() => {
      this._editorOpen = false;
    }}>${icon(X, 14)}</button>
          </div>
        </div>
        <div class="pipe-editor-body">
          ${available.length === 0 ? b`<div class="pipe-editor-empty">No transforms available</div>` : available.map((desc) => b`
                <button
                  class="pipe-editor-picker-item ${desc.id === this.transform ? "active" : ""}"
                  @click=${() => this.#setTransform(desc.id)}
                >${desc.name}</button>
              `)}
        </div>
      </div>
    `;
  }
  // ---- Transform management ----
  #removeTransform = () => {
    this.transform = "";
    this.expanded = false;
    this.#loadedTransform = null;
  };
  #setTransform(id) {
    this.transform = id;
    this.expanded = true;
  }
  // ---- Resize (this element IS the divider) ----
  handleResize(e2) {
    if (e2.button !== 0) return;
    e2.preventDefault();
    e2.stopPropagation();
    const parent = this.parentElement;
    if (!parent) return;
    this.setPointerCapture(e2.pointerId);
    const isVert = parent.getAttribute("direction") === "vertical";
    const startPos = isVert ? e2.clientY : e2.clientX;
    const beforeEl = this.#findAdjacentResizable("before");
    const afterEl = this.#findAdjacentResizable("after");
    if (!beforeEl || !afterEl) return;
    const allResizable = Array.from(parent.children).filter((child) => {
      const tag = child.tagName.toLowerCase();
      return tag === SPACE_TAG || tag === TAG && child.hasAttribute("expanded");
    });
    const snapshots = /* @__PURE__ */ new Map();
    for (const child of allResizable) {
      const r2 = child.getBoundingClientRect();
      snapshots.set(child, isVert ? r2.height : r2.width);
    }
    const startBefore = snapshots.get(beforeEl);
    const startAfter = snapshots.get(afterEl);
    for (const [child, size] of snapshots) {
      child.style.flex = `0 0 ${size}px`;
    }
    const onMove = (ev) => {
      const delta = (isVert ? ev.clientY : ev.clientX) - startPos;
      beforeEl.style.flex = `0 0 ${Math.max(30, startBefore + delta)}px`;
      afterEl.style.flex = `0 0 ${Math.max(30, startAfter - delta)}px`;
    };
    const onUp = () => {
      this.removeEventListener("pointermove", onMove);
      this.removeEventListener("pointerup", onUp);
      this.removeEventListener("lostpointercapture", onUp);
      let total = 0;
      const sizes = [];
      for (const child of allResizable) {
        const r2 = child.getBoundingClientRect();
        const s2 = isVert ? r2.height : r2.width;
        sizes.push(s2);
        total += s2;
      }
      if (total > 0) {
        for (let i2 = 0; i2 < allResizable.length; i2++) {
          allResizable[i2].style.flex = `${sizes[i2] / total} 0 0px`;
        }
      }
      this.dispatchEvent(new CustomEvent("space:resize", { bubbles: true }));
    };
    this.addEventListener("pointermove", onMove);
    this.addEventListener("pointerup", onUp);
    this.addEventListener("lostpointercapture", onUp);
  }
  #findAdjacentResizable(direction) {
    let el = direction === "before" ? this.previousElementSibling : this.nextElementSibling;
    while (el) {
      const tag = el.tagName.toLowerCase();
      if (tag === SPACE_TAG) return el;
      if (tag === TAG && el.hasAttribute("expanded")) return el;
      el = direction === "before" ? el.previousElementSibling : el.nextElementSibling;
    }
    return null;
  }
  // ---- Data pipe (strict chaining) ----
  async #loadAndSetup() {
    if (!this.transform) return;
    try {
      const loaded = await loadTransform(this.transform);
      if (!loaded) {
        console.warn(`Transform "${this.transform}" not found in registry`);
        return;
      }
      this.#loadedTransform = loaded;
    } catch (e2) {
      console.error(`Failed to load transform "${this.transform}":`, e2);
      return;
    }
    this.#setupPipe();
  }
  async #runTransform() {
    if (!this.#loadedTransform || this.#input === void 0) return;
    try {
      const result = await this.#loadedTransform.module.run(this.#input, this.#config);
      this.#output = result;
      if (this.expanded && this.#previewIframe && typeof result === "string") {
        this.#previewIframe.removeAttribute("src");
        this.#previewIframe.srcdoc = result;
      }
      this.dispatchEvent(new CustomEvent("pipe:output", { bubbles: false }));
    } catch (e2) {
      console.error("Pipe transform error:", e2);
    }
  }
  async #findSource() {
    let el = this.previousElementSibling;
    while (el) {
      const tag = el.tagName.toLowerCase();
      if (isLayoutChrome(el)) {
        el = el.previousElementSibling;
        continue;
      }
      if (tag === TAG && !el.getAttribute("transform")) {
        el = el.previousElementSibling;
        continue;
      }
      break;
    }
    if (!el) return null;
    if (el.tagName.toLowerCase() === TAG) {
      return { type: "pipe", pipe: el };
    }
    const space = el.tagName.toLowerCase() === SPACE_TAG ? el : null;
    if (!space) return null;
    const view = space.querySelector("patchwork-view");
    if (!view?.docUrl || !view?.repo) return null;
    const handle = await view.repo.find(view.docUrl);
    return handle ? { type: "view", handle, view } : null;
  }
  #setupPipe(retryCount = 0) {
    this.#teardownPipe();
    if (!this.transform || !this.#loadedTransform) return;
    const delay = retryCount === 0 ? 100 : Math.min(500 * retryCount, 3e3);
    const timer = setTimeout(async () => {
      const source = await this.#findSource();
      if (!source) {
        if (retryCount < 8) {
          this.#retryTimer = setTimeout(() => this.#setupPipe(retryCount + 1), delay);
        }
        return;
      }
      if (source.type === "pipe") {
        const upstream = source.pipe;
        const runPipe = () => {
          const val = upstream.output;
          if (val !== void 0) {
            this.input = val;
          }
        };
        const onChange = () => {
          if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
          this.#debounceTimer = setTimeout(runPipe, 50);
        };
        upstream.addEventListener("pipe:output", onChange);
        runPipe();
        this.#cleanup = () => {
          upstream.removeEventListener("pipe:output", onChange);
          if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
        };
      } else {
        const runPipe = () => {
          try {
            const doc = source.handle.doc();
            if (!doc) return;
            this.input = doc;
          } catch (e2) {
            console.error("Pipe error:", e2);
          }
        };
        const onChange = () => {
          if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
          this.#debounceTimer = setTimeout(runPipe, 300);
        };
        source.handle.on("change", onChange);
        runPipe();
        this.#cleanup = () => {
          source.handle.off("change", onChange);
          if (this.#debounceTimer) clearTimeout(this.#debounceTimer);
        };
      }
    }, retryCount === 0 ? 100 : 0);
    if (retryCount === 0) {
      this.#cleanup = () => clearTimeout(timer);
    }
  }
  #teardownPipe() {
    this.#cleanup?.();
    this.#cleanup = null;
    if (this.#retryTimer) {
      clearTimeout(this.#retryTimer);
      this.#retryTimer = null;
    }
  }
  #syncExpandedPreview() {
    if (this.expanded && this.transform) {
      if (!this.#previewIframe) {
        this.#previewIframe = document.createElement("iframe");
        this.#previewIframe.style.cssText = "width:100%;flex:1;border:none;background:Canvas;min-height:0;";
        this.#previewIframe.setAttribute("sandbox", "allow-scripts");
      }
      if (!this.contains(this.#previewIframe)) {
        this.appendChild(this.#previewIframe);
      }
      if (this.#output && typeof this.#output === "string") {
        this.#previewIframe.removeAttribute("src");
        this.#previewIframe.srcdoc = this.#output;
      }
    } else {
      this.#removeExpandedPreview();
    }
  }
  #removeExpandedPreview() {
    if (this.#previewIframe) {
      this.#previewIframe.remove();
      this.#previewIframe = null;
    }
  }
}
function registerPatchworkPipe() {
  if (customElements.get(TAG)) return;
  customElements.define(TAG, PatchworkPipeElement);
}
const STORAGE_PREFIX = "patchwork-space-layout:";
function loadLayout(accountUrl) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${accountUrl}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.root?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}
function saveLayout(accountUrl, layout) {
  localStorage.setItem(`${STORAGE_PREFIX}${accountUrl}`, JSON.stringify(layout));
}
function clearLayout(accountUrl) {
  localStorage.removeItem(`${STORAGE_PREFIX}${accountUrl}`);
}
function createDefaultLayout(accountDocUrl, config) {
  const sidebar = {
    id: "sidebar",
    size: 0.2,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.accountSidebarToolId,
      docUrl: accountDocUrl
    }
  };
  const toolbar = {
    id: "toolbar",
    fixedSize: 40,
    content: {
      type: "view",
      toolId: "document-toolbar-group"
    }
  };
  const main = {
    id: "main",
    content: { type: "view" }
  };
  const center = {
    id: "center",
    direction: "vertical",
    size: 0.6,
    children: [toolbar, main]
  };
  const context = {
    id: "context",
    size: 0.2,
    collapsible: true,
    content: {
      type: "view",
      toolId: config.contextSidebarToolId,
      docUrl: accountDocUrl
    }
  };
  const root = {
    id: "root",
    direction: "horizontal",
    children: [sidebar, center, context]
  };
  return { root };
}
function isPipeNode(child) {
  return "type" in child && child.type === "pipe";
}
function mountSpaceFrame(handle, element, repo) {
  registerPatchworkSpace();
  registerPatchworkPreviewElement();
  registerPatchworkPipe();
  const accountDocUrl = handle.url;
  let layout = null;
  let rootEl = null;
  let editing = false;
  let selectedDoc = null;
  let overlay = null;
  function init() {
    const doc = handle.doc();
    if (!doc) {
      handle.once("change", init);
      return;
    }
    const existing = loadLayout(accountDocUrl);
    if (existing) {
      layout = existing;
    } else {
      layout = createDefaultLayout(accountDocUrl, doc);
      saveLayout(accountDocUrl, layout);
    }
    buildTree();
    setupListeners();
  }
  function buildTree() {
    if (!layout) return;
    element.innerHTML = "";
    rootEl = buildNode(layout.root);
    rootEl.id = "space-root";
    element.appendChild(rootEl);
    createOverlay();
  }
  function buildNode(node) {
    const el = document.createElement("patchwork-space");
    el.id = `space-${node.id}`;
    el.dataset.spaceId = node.id;
    if (node.direction) {
      el.setAttribute("direction", node.direction);
    }
    if (node.fixedSize != null) {
      el.style.flex = `0 0 ${node.fixedSize}px`;
    } else if (node.size != null) {
      el.style.flex = `${node.size} 0 0px`;
    } else {
      el.style.flex = "1 0 0px";
    }
    if (node.children) {
      for (const child of node.children) {
        if (isPipeNode(child)) {
          const pipeEl = buildPipeNode(child);
          el.appendChild(pipeEl);
        } else {
          el.appendChild(buildNode(child));
        }
      }
    } else if (node.content) {
      buildContent(el, node);
    }
    return el;
  }
  function buildPipeNode(pipe) {
    const el = document.createElement("patchwork-pipe");
    el.id = `pipe-${pipe.id}`;
    if (pipe.transform) {
      el.setAttribute("transform", pipe.transform);
    }
    if (pipe.expanded) {
      el.setAttribute("expanded", "");
    }
    return el;
  }
  function buildContent(container, node) {
    if (!node.content) return;
    if (node.content.type === "picker") {
      buildPicker(container, node);
      return;
    }
    if (node.content.type === "preview") {
      const preview = document.createElement("patchwork-preview");
      preview.style.width = "100%";
      preview.style.height = "100%";
      container.appendChild(preview);
      return;
    }
    if (node.content.type === "view") {
      const isMainView = !node.content.toolId && !node.content.docUrl;
      if (isMainView) {
        container.dataset.mainView = "true";
        if (selectedDoc) {
          appendView(container, selectedDoc.url, selectedDoc.toolId);
        } else {
          const placeholder = document.createElement("div");
          placeholder.className = "space-empty-state";
          placeholder.textContent = "Select a document in the sidebar";
          container.appendChild(placeholder);
        }
        return;
      }
      if (node.content.toolId === "document-toolbar-group") {
        container.dataset.toolbar = "true";
        if (selectedDoc) {
          buildToolbar(container, selectedDoc.url);
        }
        return;
      }
      const docUrl = node.content.docUrl ? node.content.docUrl : accountDocUrl;
      appendView(container, docUrl, node.content.toolId);
    }
  }
  function appendView(container, docUrl, toolId) {
    const view = document.createElement("patchwork-view");
    view.setAttribute("doc-url", docUrl);
    if (toolId) view.setAttribute("tool-id", toolId);
    view.style.width = "100%";
    view.style.height = "100%";
    view.style.display = "block";
    container.appendChild(view);
  }
  function buildPicker(container, node) {
    const nodeId = node.id;
    const picker = document.createElement("div");
    picker.className = "space-picker";
    const title = document.createElement("div");
    title.className = "space-picker-title";
    title.textContent = "Choose content";
    picker.appendChild(title);
    function updateNode(updater) {
      const liveNode = layout ? findNodeById(layout.root, nodeId) : null;
      if (liveNode) updater(liveNode);
      updater(node);
    }
    const options = [
      {
        label: "Document view",
        icon: "📄",
        action: () => {
          updateNode((n3) => {
            n3.content = { type: "view" };
          });
          picker.remove();
          container.dataset.mainView = "true";
          if (selectedDoc) {
            appendView(container, selectedDoc.url, selectedDoc.toolId);
          } else {
            const ph = document.createElement("div");
            ph.className = "space-empty-state";
            ph.textContent = "Select a document";
            container.appendChild(ph);
          }
          persistLayout();
        }
      },
      {
        label: "Preview",
        icon: "👁",
        action: () => {
          updateNode((n3) => {
            n3.content = { type: "preview" };
          });
          picker.remove();
          const preview = document.createElement("patchwork-preview");
          preview.style.width = "100%";
          preview.style.height = "100%";
          container.appendChild(preview);
          persistLayout();
        }
      },
      {
        label: "Container",
        icon: "◫",
        action: () => {
          updateNode((n3) => {
            n3.content = void 0;
            n3.direction = "horizontal";
            n3.children = [];
          });
          picker.remove();
          container.setAttribute("direction", "horizontal");
          container.refreshEditUI?.();
          persistLayout();
        }
      }
    ];
    for (const opt of options) {
      const btn = document.createElement("button");
      btn.className = "space-picker-option";
      btn.innerHTML = `<span class="space-picker-icon">${opt.icon}</span><span>${opt.label}</span>`;
      btn.addEventListener("click", opt.action);
      picker.appendChild(btn);
    }
    container.appendChild(picker);
  }
  function buildToolbar(container, docUrl) {
    const doc = handle.doc();
    if (!doc) return;
    const bar = document.createElement("div");
    bar.className = "space-toolbar";
    for (const tid of doc.documentToolbarToolIds ?? []) {
      const view = document.createElement("patchwork-view");
      view.setAttribute("doc-url", docUrl);
      view.setAttribute("tool-id", tid);
      view.className = "space-toolbar-item";
      bar.appendChild(view);
    }
    container.appendChild(bar);
  }
  function updateSelectedDoc(url, toolId) {
    if (selectedDoc?.url === url && selectedDoc?.toolId === toolId) return;
    selectedDoc = { url, toolId };
    if (!rootEl) return;
    const mainView = rootEl.querySelector("[data-main-view]");
    if (mainView) {
      mainView.innerHTML = "";
      appendView(mainView, url, toolId);
    }
    const toolbar = rootEl.querySelector("[data-toolbar]");
    if (toolbar) {
      toolbar.innerHTML = "";
      buildToolbar(toolbar, url);
    }
  }
  function toggleEditing() {
    editing = !editing;
    if (!rootEl) return;
    if (editing) {
      rootEl.setAttribute("editing", "");
    } else {
      rootEl.removeAttribute("editing");
    }
    updateOverlay();
  }
  function serializeTree() {
    if (!rootEl) return null;
    const root = serializeNode(rootEl);
    return root ? { root } : null;
  }
  function serializeNode(el) {
    const id = el.dataset.spaceId;
    if (!id) return null;
    const direction = el.getAttribute("direction");
    const node = { id };
    if (direction) node.direction = direction;
    const flexGrow = parseFloat(el.style.flexGrow);
    const flexBasis = el.style.flexBasis;
    if (flexGrow === 0 && flexBasis.endsWith("px") && parseFloat(flexBasis) > 0) {
      node.fixedSize = parseInt(flexBasis);
    } else if (flexGrow > 0 && flexGrow !== 1) {
      node.size = flexGrow;
    }
    const childSpaces = el.querySelectorAll(`:scope > patchwork-space`);
    el.querySelectorAll(`:scope > patchwork-pipe`);
    if (childSpaces.length > 0) {
      node.children = [];
      for (const child of el.children) {
        const tag = child.tagName.toLowerCase();
        if (tag === "patchwork-space") {
          const childNode = serializeNode(child);
          if (childNode) node.children.push(childNode);
        } else if (tag === "patchwork-pipe") {
          const transform = child.getAttribute("transform") || "";
          const expanded = child.hasAttribute("expanded");
          if (transform || expanded) {
            const pipeId = child.id?.replace("pipe-", "") || `pipe-${Date.now()}`;
            node.children.push({ id: pipeId, type: "pipe", transform, expanded });
          }
        }
      }
    } else {
      node.content = getContentForNode(id);
    }
    return node;
  }
  function getContentForNode(id) {
    if (!layout) return void 0;
    const found = findNodeById(layout.root, id);
    return found?.content;
  }
  function findNodeById(node, id) {
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        if (isPipeNode(child)) continue;
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }
  function persistLayout() {
    const serialized = serializeTree();
    if (serialized) {
      layout = serialized;
      saveLayout(accountDocUrl, serialized);
    }
  }
  function resetLayout() {
    const doc = handle.doc();
    if (!doc) return;
    clearLayout(accountDocUrl);
    layout = createDefaultLayout(accountDocUrl, doc);
    saveLayout(accountDocUrl, layout);
    selectedDoc = null;
    buildTree();
    if (editing) {
      rootEl?.setAttribute("editing", "");
      updateOverlay();
    }
  }
  function createOverlay() {
    overlay?.remove();
    overlay = document.createElement("div");
    overlay.className = "edit-overlay";
    overlay.style.display = "none";
    element.appendChild(overlay);
  }
  function updateOverlay() {
    if (!overlay) return;
    if (editing) {
      overlay.style.display = "";
      overlay.innerHTML = "";
      const bar = document.createElement("div");
      bar.className = "edit-controls-bar";
      const addBtn = document.createElement("button");
      addBtn.className = "edit-ctrl-btn edit-ctrl-btn--add";
      addBtn.textContent = "+ Add";
      addBtn.addEventListener("click", () => addSpace());
      addBtn.addEventListener("pointerdown", (e2) => {
        if (e2.button !== 0) return;
        e2.preventDefault();
        startAddDrag(e2);
      });
      bar.appendChild(addBtn);
      const sep1 = document.createElement("div");
      sep1.className = "edit-ctrl-sep";
      bar.appendChild(sep1);
      const resetBtn = document.createElement("button");
      resetBtn.className = "edit-ctrl-btn";
      resetBtn.textContent = "Reset";
      resetBtn.addEventListener("click", resetLayout);
      bar.appendChild(resetBtn);
      const doneBtn = document.createElement("button");
      doneBtn.className = "edit-ctrl-btn edit-ctrl-btn--primary";
      doneBtn.textContent = "Done";
      doneBtn.addEventListener("click", () => toggleEditing());
      bar.appendChild(doneBtn);
      overlay.appendChild(bar);
    } else {
      overlay.style.display = "none";
    }
  }
  function startAddDrag(e2, btn) {
    if (!rootEl) return;
    const startX = e2.clientX;
    const startY = e2.clientY;
    let dragging = false;
    let ghost = null;
    const indicator = document.createElement("div");
    indicator.className = "space-drop-indicator";
    let lastContainer = null;
    let lastRefChild = null;
    const cleanup = () => {
      ghost?.remove();
      indicator.remove();
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
    };
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (!dragging && Math.abs(dx) + Math.abs(dy) < 6) return;
      if (!dragging) {
        dragging = true;
        ghost = document.createElement("div");
        ghost.className = "space-add-ghost";
        ghost.textContent = "+ Add";
        document.body.appendChild(ghost);
      }
      ghost.style.left = `${ev.clientX}px`;
      ghost.style.top = `${ev.clientY}px`;
      ghost.style.display = "none";
      const elBelow = document.elementFromPoint(ev.clientX, ev.clientY);
      ghost.style.display = "";
      if (!elBelow) return;
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      const target = findNearestContainer(elBelow, rootEl);
      if (!target) {
        indicator.remove();
        lastContainer = null;
        return;
      }
      const { container, refChild } = computeInsertionPoint(
        target,
        ev.clientX,
        ev.clientY
      );
      container.classList.add("drop-target");
      lastContainer = container;
      lastRefChild = refChild;
      positionIndicator(indicator, container, refChild);
      if (!indicator.parentElement) document.body.appendChild(indicator);
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      cleanup();
      if (dragging && lastContainer) {
        insertSpaceAt(lastContainer, lastRefChild);
      }
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }
  function setupFileDrop() {
    let dropIndicator = null;
    element.addEventListener("dragover", (e2) => {
      if (!rootEl) return;
      const data = e2.dataTransfer;
      if (!data) return;
      if (!data.types.includes("text/x-patchwork-urls") && !data.types.includes("text/x-patchwork-dnd"))
        return;
      e2.preventDefault();
      e2.stopPropagation();
      data.dropEffect = "copy";
      const elBelow = document.elementFromPoint(e2.clientX, e2.clientY);
      if (!elBelow) return;
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      const target = findNearestContainer(elBelow, rootEl);
      if (!target) return;
      const { container } = computeInsertionPoint(target, e2.clientX, e2.clientY);
      container.classList.add("drop-target");
      if (!dropIndicator) {
        dropIndicator = document.createElement("div");
        dropIndicator.className = "space-drop-indicator";
      }
      const { refChild } = computeInsertionPoint(target, e2.clientX, e2.clientY);
      positionIndicator(dropIndicator, container, refChild);
      if (!dropIndicator.parentElement)
        document.body.appendChild(dropIndicator);
    });
    element.addEventListener("dragleave", (e2) => {
      if (e2.relatedTarget && element.contains(e2.relatedTarget)) return;
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      dropIndicator?.remove();
      dropIndicator = null;
    });
    element.addEventListener("drop", (e2) => {
      e2.preventDefault();
      e2.stopPropagation();
      for (const el of document.querySelectorAll(".drop-target")) {
        el.classList.remove("drop-target");
      }
      dropIndicator?.remove();
      dropIndicator = null;
      if (!rootEl) return;
      const data = e2.dataTransfer;
      if (!data) return;
      let urls = [];
      const urlData = data.getData("text/x-patchwork-urls");
      if (urlData) {
        try {
          urls = JSON.parse(urlData);
        } catch {
        }
      }
      if (urls.length === 0) {
        const dndData = data.getData("text/x-patchwork-dnd");
        if (dndData) {
          try {
            const parsed = JSON.parse(dndData);
            urls = (parsed.items || []).map((i2) => i2.url).filter(Boolean);
          } catch {
          }
        }
      }
      if (urls.length === 0) return;
      const elBelow = document.elementFromPoint(e2.clientX, e2.clientY);
      if (!elBelow) return;
      const target = findNearestContainer(elBelow, rootEl);
      if (!target) return;
      const { container, refChild } = computeInsertionPoint(
        target,
        e2.clientX,
        e2.clientY
      );
      const spaceBelow = findLeafSpace(elBelow);
      if (spaceBelow) {
        const spaceId = spaceBelow.dataset.spaceId;
        if (spaceId && layout) {
          const node = findNodeById(layout.root, spaceId);
          if (node && node.content?.type === "picker") {
            const pickerEl = spaceBelow.querySelector(".space-picker");
            pickerEl?.remove();
            node.content = { type: "view", docUrl: urls[0] };
            spaceBelow.dataset.mainView = "true";
            appendView(spaceBelow, urls[0]);
            persistLayout();
            return;
          }
        }
      }
      if (editing) {
        for (const url of urls) {
          insertDocViewAt(container, refChild, url);
        }
      } else {
        updateSelectedDoc(urls[0]);
      }
    });
  }
  function findNearestContainer(el, root) {
    let candidate = el;
    while (candidate && candidate !== root.parentElement) {
      if (candidate.tagName.toLowerCase() === "patchwork-space") {
        return candidate;
      }
      candidate = candidate.parentElement;
    }
    return root;
  }
  function findLeafSpace(el) {
    let candidate = el;
    while (candidate) {
      if (candidate.tagName.toLowerCase() === "patchwork-space" && !candidate.querySelector(":scope > patchwork-space")) {
        return candidate;
      }
      candidate = candidate.parentElement;
    }
    return null;
  }
  function computeInsertionPoint(target, clientX, clientY) {
    const isLeaf = !target.querySelector(":scope > patchwork-space");
    const container = isLeaf ? target.parentElement ?? target : target;
    if (container.tagName.toLowerCase() !== "patchwork-space") {
      return { container: target, refChild: null };
    }
    const children = Array.from(
      container.querySelectorAll(":scope > patchwork-space")
    );
    if (children.length === 0) return { container, refChild: null };
    const isHoriz = container.getAttribute("direction") !== "vertical";
    for (const child of children) {
      const r2 = child.getBoundingClientRect();
      const mid = isHoriz ? r2.left + r2.width / 2 : r2.top + r2.height / 2;
      const pos = isHoriz ? clientX : clientY;
      if (pos < mid) return { container, refChild: child };
    }
    return { container, refChild: null };
  }
  function positionIndicator(indicator, container, refChild) {
    const isHoriz = container.getAttribute("direction") !== "vertical";
    if (refChild) {
      const r2 = refChild.getBoundingClientRect();
      if (isHoriz) {
        indicator.style.left = `${r2.left - 2}px`;
        indicator.style.top = `${r2.top}px`;
        indicator.style.width = "4px";
        indicator.style.height = `${r2.height}px`;
      } else {
        indicator.style.left = `${r2.left}px`;
        indicator.style.top = `${r2.top - 2}px`;
        indicator.style.width = `${r2.width}px`;
        indicator.style.height = "4px";
      }
    } else {
      const children = container.querySelectorAll(":scope > patchwork-space");
      const lastChild = children[children.length - 1];
      if (lastChild) {
        const r2 = lastChild.getBoundingClientRect();
        if (isHoriz) {
          indicator.style.left = `${r2.right - 2}px`;
          indicator.style.top = `${r2.top}px`;
          indicator.style.width = "4px";
          indicator.style.height = `${r2.height}px`;
        } else {
          indicator.style.left = `${r2.left}px`;
          indicator.style.top = `${r2.bottom - 2}px`;
          indicator.style.width = `${r2.width}px`;
          indicator.style.height = "4px";
        }
      } else {
        const cr = container.getBoundingClientRect();
        indicator.style.left = `${cr.left + 4}px`;
        indicator.style.top = `${cr.top + 4}px`;
        indicator.style.width = `${cr.width - 8}px`;
        indicator.style.height = `${cr.height - 8}px`;
      }
    }
  }
  function addSpace() {
    if (!rootEl || !layout) return;
    const newId = `space-${Date.now()}`;
    const newNode = {
      id: newId,
      content: { type: "picker" }
    };
    const el = buildNode(newNode);
    rootEl.appendChild(el);
    if (editing) {
      el.setAttribute("editing", "");
      rootEl.refreshEditUI?.();
    }
    persistLayout();
  }
  function insertSpaceAt(container, refChild, content) {
    if (!rootEl || !layout) return;
    const newId = `space-${Date.now()}`;
    const newNode = {
      id: newId,
      content: { type: "picker" }
    };
    const el = buildNode(newNode);
    container.insertBefore(el, refChild);
    if (editing) {
      el.setAttribute("editing", "");
      container.refreshEditUI?.();
    }
    persistLayout();
  }
  function insertDocViewAt(container, refChild, docUrl) {
    const newId = `space-${Date.now()}`;
    const newNode = {
      id: newId,
      content: { type: "view", docUrl }
    };
    const el = buildNode(newNode);
    container.insertBefore(el, refChild);
    if (editing) {
      el.setAttribute("editing", "");
      container.refreshEditUI?.();
    }
    persistLayout();
  }
  function setupListeners(doc) {
    element.addEventListener("patchwork:open-document", (event) => {
      const e2 = event;
      e2.stopPropagation();
      updateSelectedDoc(e2.detail.url, e2.detail.toolId);
    });
    element.addEventListener("space:reorder", (e2) => {
      const target = e2.target;
      const parent = target.parentElement;
      if (parent) parent.refreshEditUI?.();
      persistLayout();
    });
    element.addEventListener("space:resize", () => persistLayout());
    element.addEventListener("space:remove", ((e2) => {
      const target = e2.target;
      const parent = target.parentElement;
      target.remove();
      if (parent) parent.refreshEditUI?.();
      persistLayout();
    }));
    element.addEventListener("pipe:update", (e2) => {
      const target = e2.target;
      const parent = target.parentElement;
      if (parent) parent.refreshEditUI?.();
      persistLayout();
    });
    element.addEventListener("pipe:delete", () => persistLayout());
    window.addEventListener("keydown", onKeyDown);
    setupFileDrop();
  }
  function onKeyDown(e2) {
    if ((e2.metaKey || e2.ctrlKey) && e2.key === "e") {
      e2.preventDefault();
      toggleEditing();
    }
    if (e2.key === "Escape" && editing) {
      toggleEditing();
    }
  }
  init();
  return () => {
    window.removeEventListener("keydown", onKeyDown);
    overlay?.remove();
    rootEl?.remove();
  };
}
export {
  mountSpaceFrame
};
//# sourceMappingURL=space-frame-3YIqmUJ2.js.map
