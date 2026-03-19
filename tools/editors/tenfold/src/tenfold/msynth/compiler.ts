// import * as ohm from "./ohm.ts"

// TODO: Importing from node_modules might not work, might need the below (or above) instead
import * as ohm from "ohm-js"
// import * as ohm from "../ohm-js/index.mjs"


import { Signal } from "./signal.ts"
import { inlinedFunctions } from "./inlined-functions.ts"
import { builtInSignals } from "./built-in-signals.ts"
import { msynthLib as lib } from "./msynth-lib.ts"

// TODO: check for mutually-recursive macros!
// TODO: allow default values for macros' args

export class CompilerError extends Error {
  constructor(message: string, readonly interval: ohm.Interval) {
    super(message)
  }
}

export const grammar = ohm.grammar(String.raw`
  MSynth {
    Prog = Decl+

    Decl
      = ident "=" Expr                   -- signal
      | def ident MArgs "=" Expr         -- macroCall
      | def ident ident MArgs? "=" Expr  -- macroSend

    Expr = ArrowExpr

    ArrowExpr
      = ArrowExpr ">>" ident Args?  -- send
      | AddExpr

    AddExpr
      = AddExpr "+" MulExpr  -- plus
      | AddExpr "-" MulExpr  -- minus
      | MulExpr

    MulExpr
      = MulExpr "*" NegExpr  -- times
      | MulExpr "/" NegExpr  -- div
      | MulExpr "%" NegExpr  -- mod
      | NegExpr

    NegExpr
      = "-" NegExpr  -- neg
      | SendExpr

    SendExpr
      = SendExpr ~(ident "=") ident Args?  -- send
      | PriExpr

    PriExpr
      = ident Args    -- call
      | ident         -- ref
      | number        -- num
      | "(" Expr ")"  -- par

    Args = "(" ListOf<Expr, ","> ")"

    MArgs = "(" ListOf<ident, ","> ")"

    ident  (an identifier)
      = ~keyword letter alnum*

    number  (a number)
      = digit* "." digit+  -- fract
      | digit+             -- whole

    keyword = def | this
    def = "def" ~alnum
    this = "this" ~alnum

    space += "//" (~"\n" any)*  -- comment
  }
`)

interface RefInfo {
  params: number[]
  builtins: string[]
}

abstract class ANode {
  constructor(readonly interval: ohm.Interval) {}
  abstract addRefs(refs: Set<string>): void
}

class Prog extends ANode {
  constructor(readonly decls: (SDecl | MDecl)[], interval: ohm.Interval) {
    super(interval)
  }

  checkDuplicateDeclarations() {
    const declared = new Set<string>()
    for (const d of this.mdecls) {
      if (declared.has(d.name)) {
        throw new CompilerError(`duplicate declaration of macro ${d.name}`, d.interval)
      }
      declared.add(d.name)
    }

    declared.clear()
    for (const d of this.sdecls) {
      if (declared.has(d.name)) {
        throw new CompilerError(`duplicate declaration of signal ${d.name}`, d.interval)
      }
      declared.add(d.name)
    }
  }

  checkCalls(inlinedFunctions: Record<string, Function>, lib: Record<string, Function>) {
    for (const decl of this.decls) {
      decl.checkCalls(this.mdecls, inlinedFunctions, lib)
    }
  }

  checkRefs(builtInSignals: Record<string, () => Signal>): RefInfo {
    const refs = new Set<string>()
    this.addRefs(refs)

    const params = new Set<number>()
    const builtins = new Set<string>()
    for (const name of refs) {
      const n = getParamNum(name)
      if (n !== null) {
        params.add(n)
      } else if (builtInSignals.hasOwnProperty(name)) {
        builtins.add(name)
      } else if (!this.decls.some((d) => d.name === name)) {
        throw new CompilerError(`undeclared reference: ${name}`, this.interval)
      }
    }

    return {
      params: [...params],
      builtins: [...builtins],
    }
  }

  override addRefs(refs: Set<string>) {
    for (const decl of this.decls) {
      decl.addRefs(refs)
    }
  }

  get sdecls() {
    return this.decls.filter((d) => d instanceof SDecl)
  }

  get mdecls() {
    return this.decls.filter((d) => d instanceof MDecl)
  }

  trans(refs: RefInfo, inlinedFunctions: Record<string, Function>): string {
    const haveSignal = (name: string) => this.sdecls.some((d) => d.name === name)
    let outputs: string[]
    if (haveSignal("left") && haveSignal("right")) {
      outputs = ["__left", "__right"]
    } else if (haveSignal("out")) {
      outputs = ["__out"]
    } else {
      outputs = ["Signal.scalar(0)"]
    }
    return `(() => {
      ${refs.params.map((n) => `const __param${n} = Signal.new((synth) => synth.params[${n}]);`).join("\n")}
      ${refs.builtins.map((name) => `const __${name} = __.${name}();`).join("\n")}
      ${this.sdecls.map((d) => `let __${d.name};`).join("\n")}
      ${this.sdecls.map((d) => d.trans(this.mdecls, inlinedFunctions)).join("\n")}
      ${this.sdecls.map((d) => `__${d.name} = __${d.name}.force();`).join("\n")}
      return [${outputs.join(", ")}];
    })()`
  }
}

abstract class ADecl extends ANode {
  constructor(readonly name: string, readonly rhs: AExpr, interval: ohm.Interval) {
    super(interval)
  }

  checkCalls(mdecls: MDecl[], inlinedFunctions: Record<string, Function>, lib: Record<string, Function>) {
    this.rhs.checkCalls(mdecls, inlinedFunctions, lib)
  }
}

class SDecl extends ADecl {
  constructor(name: string, rhs: AExpr, interval: ohm.Interval) {
    super(name, rhs, interval)
  }

  override addRefs(refs: Set<string>) {
    this.rhs.addRefs(refs)
  }

  trans(mdecls: MDecl[], inlinedFunctions: Record<string, Function>) {
    const signals: string[] = []
    const expr = this.rhs.trans("signal", signals, mdecls, inlinedFunctions)
    const signal =
      signals.length === 0
        ? expr
        : `{
      ${signals.map((code, idx) => `const tmp${idx} = ${code};`).join("\n")}
      return ${expr};
    }`
    return `__${this.name} = lazy(() => ${signal});`
  }
}

class MDecl extends ADecl {
  constructor(name: string, readonly argNames: string[], rhs: AExpr, interval: ohm.Interval) {
    super(name, rhs, interval)
  }

  override addRefs(refs: Set<string>) {
    const localRefs = new Set<string>()
    this.rhs.addRefs(localRefs)
    for (const argName of this.argNames) {
      localRefs.delete(argName)
    }
    for (const r of localRefs) {
      refs.add(r)
    }
  }

  expand(call: Call): AExpr {
    if (call.args.length !== this.argNames.length) {
      throw new CompilerError(
        `wrong number of arguments passed to macro ${this.name}: expected ${this.argNames.length}, got ${call.args.length}`,
        call.interval
      )
    }
    const subst = new Map<string, AExpr>()
    for (let idx = 0; idx < this.argNames.length; idx++) {
      subst.set(this.argNames[idx], call.args[idx])
    }
    return this.rhs.apply(subst)
  }
}

abstract class AExpr extends ANode {
  constructor(interval: ohm.Interval, readonly children: AExpr[] = []) {
    super(interval)
  }

  checkCalls(mdecls: MDecl[], inlinedFunctions: Record<string, Function>, lib: Record<string, Function>) {
    for (const child of this.children) {
      child.checkCalls(mdecls, inlinedFunctions, lib)
    }
  }

  override addRefs(refs: Set<string>) {
    for (const child of this.children) {
      child.addRefs(refs)
    }
  }

  abstract apply(subst: Map<string, AExpr>): AExpr

  abstract trans(want: "number" | "signal", signals: string[], mdecls: MDecl[], inlinedFunctions: Record<string, Function>): string
}

class Call extends AExpr {
  constructor(readonly name: string, readonly args: AExpr[], interval: ohm.Interval) {
    super(interval, args)
  }

  override checkCalls(mdecls: MDecl[], inlinedFunctions: Record<string, Function>, lib: Record<string, Function>) {
    super.checkCalls(mdecls, inlinedFunctions, lib)

    const isDeclared = mdecls.some((d) => d.name === this.name) || inlinedFunctions.hasOwnProperty(this.name) || lib.hasOwnProperty(this.name)
    if (!isDeclared) {
      throw new CompilerError(`undeclared function: ${this.name}`, this.interval)
    }
  }

  override apply(subst: Map<string, AExpr>) {
    return new Call(
      this.name,
      this.args.map((arg) => arg.apply(subst)),
      this.interval
    )
  }

  override trans(want: "number" | "signal", signals: string[], mdecls: MDecl[], inlinedFunctions: Record<string, Function>) {
    const macro = mdecls.find((d) => d.name === this.name)
    if (macro) {
      // if it's a macro, expand and translate what comes out
      return macro.expand(this).trans(want, signals, mdecls, inlinedFunctions)
    }

    let call: string
    if (inlinedFunctions.hasOwnProperty(this.name)) {
      const args = this.args.map((arg) => arg.trans("number", signals, mdecls, inlinedFunctions))
      call = inlinedFunctions[this.name](...args)
      if (want === "signal") {
        const idx = signals.length
        signals.push(`Signal.new(() => ${call})`)
        call = `tmp${idx}`
      }
    } else {
      const args = this.args.map((arg) => arg.trans("signal", signals, mdecls, inlinedFunctions))
      call = `_.${this.name}(${args.join(", ")})`
      const idx = signals.length
      signals.push(call)
      call = `tmp${idx}`
      if (want === "number") {
        call = `${call}.value`
      }
    }
    return call
  }
}

class Ref extends AExpr {
  constructor(readonly name: string, interval: ohm.Interval) {
    super(interval)
  }

  override addRefs(refs: Set<string>) {
    refs.add(this.name)
  }

  override apply(subst: Map<string, AExpr>): AExpr {
    return subst.get(this.name) ?? this
  }

  override trans(want: "number" | "signal", signals: string[]) {
    const n = getParamNum(this.name)
    const ref = n !== null ? `__param${n}` : `__${this.name}`
    return want === "signal" ? ref : `${ref}.value`
  }
}

class ANumber extends AExpr {
  constructor(readonly value: number, interval: ohm.Interval) {
    super(interval)
  }

  override apply(subst: Map<string, AExpr>) {
    return this
  }

  override trans(want: "number" | "signal") {
    const number = "" + this.value
    return want === "number" ? number : `Signal.scalar(${number})`
  }
}

function getParamNum(name: string) {
  if (!(name.startsWith("param") && [...name.slice(5)].every((c) => "0" <= c && c <= "9"))) {
    return null
  }
  const n = parseInt(name.slice(5))
  return 0 <= n && n <= 127 ? n : null
}

const s = grammar.createSemantics().addOperation<any>("toAst", {
  Prog(decls) {
    return new Prog(decls.toAst(), this.source)
  },
  Decl_signal(n, _eq, e) {
    return new SDecl(n.sourceString, e.toAst(), this.source)
  },
  Decl_macroCall(_def, n, margs, _eq, e) {
    return new MDecl(n.sourceString, margs.toAst(), e.toAst(), this.source)
  },
  Decl_macroSend(_def, r, n, margs, _eq, e) {
    return new MDecl(n.sourceString, [r.toAst(), ...(margs.child(0)?.toAst() ?? [])], e.toAst(), this.source)
  },
  ArrowExpr_send(r, _arrow, m, es) {
    return new Call(m.sourceString, [r.toAst(), ...(es.child(0)?.toAst() ?? [])], this.source)
  },
  AddExpr_plus(x, _plus, y) {
    return new Call("+", [x.toAst(), y.toAst()], this.source)
  },
  AddExpr_minus(x, _minus, y) {
    return new Call("-", [x.toAst(), y.toAst()], this.source)
  },
  MulExpr_times(x, _times, y) {
    return new Call("*", [x.toAst(), y.toAst()], this.source)
  },
  MulExpr_div(x, _div, y) {
    return new Call("/", [x.toAst(), y.toAst()], this.source)
  },
  MulExpr_mod(x, _mod, y) {
    return new Call("%", [x.toAst(), y.toAst()], this.source)
  },
  NegExpr_neg(_minus, e) {
    return new Call("unary-", [e.toAst()], this.source)
  },
  SendExpr_send(r, m, es) {
    return new Call(m.sourceString, [r.toAst(), ...(es.child(0)?.toAst() ?? [])], this.source)
  },
  PriExpr_call(n, es) {
    return new Call(n.sourceString, es.toAst(), this.source)
  },
  PriExpr_ref(n) {
    return new Ref(this.sourceString, this.source)
  },
  PriExpr_num(n) {
    return new ANumber(parseFloat(this.sourceString), this.source)
  },
  PriExpr_par(_oparen, e, _cparen) {
    return e.toAst()
  },
  Args(_oparen, es, _cparen) {
    return es.toAst()
  },
  MArgs(_oparen, xs, _cparen) {
    return xs.toAst()
  },
  ident(_first, _rest) {
    return this.sourceString
  },
  NonemptyListOf(x, _sep, xs) {
    return [x.toAst()].concat(xs.toAst())
  },
  EmptyListOf() {
    return []
  },
  _iter(...children) {
    return children.map((c) => c.toAst())
  },
})

export function compile(input: string): () => Signal[] {
  const mr = grammar.match(input)
  if (mr.failed()) {
    const expected = (mr as any).getRightmostFailures().map((f: any) => (f.type === "string" ? `"${f.text}"` : f.text))
    if (expected.length > 1) {
      expected[expected.length - 1] = "or " + expected[expected.length - 1]
    }
    throw new CompilerError(`expected ${expected.join(", ")}`, mr.getInterval())
  }

  const prog = s(mr).toAst() as Prog
  prog.checkDuplicateDeclarations()
  prog.checkCalls(inlinedFunctions, lib)
  const refs = prog.checkRefs(builtInSignals)
  const code = prog.trans(refs, inlinedFunctions)
  // console.log("compiled code:\n", code)

  return () => evalCompiledCode(code)
}

function evalCompiledCode(code: string): Signal[] {
  // do not remove any of these local variables -- they're used by the generated code!
  const _ = Object.create(lib)
  const __ = builtInSignals
  const lazy = (makeSignal: () => Signal) => {
    let s: Signal | null = null
    const force = () => {
      if (!s) {
        s = makeSignal()
      }
      return s
    }
    const proxy = Signal.new({
      nextSample: (synth) => force().nextSample(synth),
      initialValue: 0, // can't call force() here because it may be recursive!
      noteOn: (voice, retriggered) => force().noteOn?.(voice, retriggered),
      noteOff: () => force().noteOff?.(),
    })
    ;(proxy as any).force = force
    return proxy
  }
  const ifZero = (x: number, y: number) => (x === 0 ? y : x)
  return eval(code)
}
