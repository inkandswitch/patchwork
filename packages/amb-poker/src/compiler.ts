import * as ohm from "ohm-js";
import { Scenario, Value } from "./model";

const g = ohm.grammar(String.raw`
  PL {
    Cell
      = "=" RelExp  -- formula
      | any*        -- rawValue

    Exp = RelExp

    RelExp
      = AddExp "="  AddExp  -- eq
      | AddExp "<>" AddExp  -- neq
      | AddExp ">=" AddExp  -- ge
      | AddExp ">"  AddExp  -- gt
      | AddExp "<=" AddExp  -- le
      | AddExp "<"  AddExp  -- lt
      | AddExp

    AddExp
      = AddExp "+" MulExp  -- plus
      | AddExp "-" MulExp  -- minus
      | MulExp

    MulExp
      = MulExp "*" CallExp  -- times
      | MulExp "/" CallExp  -- div
      | CallExp

    CallExp
      = if "(" Exp "," Exp "," Exp ")"  -- if
      | ident "(" ListOf<Exp, ","> ")"  -- call
      | UnExp

    UnExp
      = "-" PriExp  -- neg
      | PriExp

    PriExp
      = "(" Exp ")"  -- paren
      | Literal      -- const
      | ident        -- cellRef

    Literal
      = number
      | boolean
      | string

    number  (a number)
      = "-" unsignedNumber   -- negative
      | "+"? unsignedNumber  -- positive

    unsignedNumber
      = digit* "." digit+  -- fract
      | digit+             -- whole

    boolean
      = true   -- true
      | false  -- false

    string  (a string literal)
      = "\"" (~"\"" ~"\n" any)* "\""

    ident  (an identifier)
      = ~keyword letter alnum*

    // keywords
    keyword = false | if | true
    false = caseInsensitive<"false"> ~alnum
    if = caseInsensitive<"if"> ~alnum
    true = caseInsensitive<"true"> ~alnum
  }
`);

const s = g.createSemantics().addOperation("comp", {
  Cell_rawValue(_cs) {
    if (
      this.sourceString === "true" ||
      this.sourceString === "false" ||
      !isNaN(this.sourceString as any)
    ) {
      return this.sourceString;
    } else {
      return JSON.stringify(this.sourceString);
    }
  },
  Cell_formula(_eq, e) {
    return `(s => ${e.comp()})`;
  },
  RelExp_eq: binOp(),
  RelExp_neq: binOp(),
  RelExp_ge: binOp(),
  RelExp_gt: binOp(),
  RelExp_le: binOp(),
  RelExp_lt: binOp(),
  AddExp_plus: binOp(),
  AddExp_minus: binOp(),
  MulExp_times: binOp(),
  MulExp_div: binOp(),
  CallExp_if(_if, _op, cond, _c1, tb, _c2, fb, _cp) {
    return `((${cond.comp()}) ? (${tb.comp()}) : (${fb.comp()}))`;
  },
  CallExp_call(name, _op, xs, _cp) {
    return `fns.${name.sourceString}(${xs.comp().join(",")})`;
  },
  UnExp_neg(_op, e) {
    return `fns["-"](0, ${e.comp()})`;
  },
  PriExp_paren(_op, e, _cp) {
    return e.comp();
  },
  Literal(_) {
    return this.sourceString;
  },
  ident(_first, _rest) {
    return `s.${this.sourceString}`;
  },
  NonemptyListOf(x, _sep, xs) {
    return [x.comp()].concat(xs.comp());
  },
  EmptyListOf() {
    return [];
  },
  _iter(...children) {
    return children.map((c) => c.comp());
  },
  _terminal() {
    return this.sourceString;
  },
});

function binOp() {
  return (x: ohm.Node, op: ohm.Node, y: ohm.Node) =>
    `fns["${op.sourceString}"](${x.comp()}, ${y.comp()})`;
}

export const fns: Record<string, (...xs: Value[]) => Value> = {};

export function compileCell(
  f: string
): Value | ((scenario: Scenario) => Value) {
  const mr = g.match(f);
  if (mr.failed()) {
    throw new Error(mr.message!);
  }

  const code = s(mr).comp();
  console.log("code", code);
  const ans = eval(code);
  console.log("ans", ans);
  return ans;
}

(window as any).compileFormula = compileCell;
