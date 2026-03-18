(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ohm = {}));
})(this, (function (exports) { 'use strict';

  // --------------------------------------------------------------------

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  function abstract(optMethodName) {
    const methodName = optMethodName || '';
    return function() {
      throw new Error(
          'this method ' +
          methodName +
          ' is abstract! ' +
          '(it has no implementation in class ' +
          this.constructor.name +
          ')',
      );
    };
  }

  function assert(cond, message) {
    if (!cond) {
      throw new Error(message || 'Assertion failed');
    }
  }

  // Define a lazily-computed, non-enumerable property named `propName`
  // on the object `obj`. `getterFn` will be called to compute the value the
  // first time the property is accessed.
  function defineLazyProperty(obj, propName, getterFn) {
    let memo;
    Object.defineProperty(obj, propName, {
      get() {
        if (!memo) {
          memo = getterFn.call(this);
        }
        return memo;
      },
    });
  }

  function clone(obj) {
    if (obj) {
      return Object.assign({}, obj);
    }
    return obj;
  }

  function repeatFn(fn, n) {
    const arr = [];
    while (n-- > 0) {
      arr.push(fn());
    }
    return arr;
  }

  function repeatStr(str, n) {
    return new Array(n + 1).join(str);
  }

  function repeat(x, n) {
    return repeatFn(() => x, n);
  }

  function getDuplicates(array) {
    const duplicates = [];
    for (let idx = 0; idx < array.length; idx++) {
      const x = array[idx];
      if (array.lastIndexOf(x) !== idx && duplicates.indexOf(x) < 0) {
        duplicates.push(x);
      }
    }
    return duplicates;
  }

  function copyWithoutDuplicates(array) {
    const noDuplicates = [];
    array.forEach(entry => {
      if (noDuplicates.indexOf(entry) < 0) {
        noDuplicates.push(entry);
      }
    });
    return noDuplicates;
  }

  function isSyntactic(ruleName) {
    const firstChar = ruleName[0];
    return firstChar === firstChar.toUpperCase();
  }

  function isLexical(ruleName) {
    return !isSyntactic(ruleName);
  }

  function padLeft(str, len, optChar) {
    const ch = optChar || ' ';
    if (str.length < len) {
      return repeatStr(ch, len - str.length) + str;
    }
    return str;
  }

  // StringBuffer

  function StringBuffer() {
    this.strings = [];
  }

  StringBuffer.prototype.append = function(str) {
    this.strings.push(str);
  };

  StringBuffer.prototype.contents = function() {
    return this.strings.join('');
  };

  const escapeUnicode = str => String.fromCodePoint(parseInt(str, 16));

  function unescapeCodePoint(s) {
    if (s.charAt(0) === '\\') {
      switch (s.charAt(1)) {
        case 'b':
          return '\b';
        case 'f':
          return '\f';
        case 'n':
          return '\n';
        case 'r':
          return '\r';
        case 't':
          return '\t';
        case 'v':
          return '\v';
        case 'x':
          return escapeUnicode(s.slice(2, 4));
        case 'u':
          return s.charAt(2) === '{' ?
            escapeUnicode(s.slice(3, -1)) :
            escapeUnicode(s.slice(2, 6));
        default:
          return s.charAt(1);
      }
    } else {
      return s;
    }
  }

  // Helper for producing a description of an unknown object in a safe way.
  // Especially useful for error messages where an unexpected type of object was encountered.
  function unexpectedObjToString(obj) {
    if (obj == null) {
      return String(obj);
    }
    const baseToString = Object.prototype.toString.call(obj);
    try {
      let typeName;
      if (obj.constructor && obj.constructor.name) {
        typeName = obj.constructor.name;
      } else if (baseToString.indexOf('[object ') === 0) {
        typeName = baseToString.slice(8, -1); // Extract e.g. "Array" from "[object Array]".
      } else {
        typeName = typeof obj;
      }
      return typeName + ': ' + JSON.stringify(String(obj));
    } catch (e) {
      return baseToString;
    }
  }

  function checkNotNull(obj, message = 'unexpected null value') {
    if (obj == null) {
      throw new Error(message);
    }
    return obj;
  }

  var common = /*#__PURE__*/Object.freeze({
    __proto__: null,
    abstract: abstract,
    assert: assert,
    defineLazyProperty: defineLazyProperty,
    clone: clone,
    repeatFn: repeatFn,
    repeatStr: repeatStr,
    repeat: repeat,
    getDuplicates: getDuplicates,
    copyWithoutDuplicates: copyWithoutDuplicates,
    isSyntactic: isSyntactic,
    isLexical: isLexical,
    padLeft: padLeft,
    StringBuffer: StringBuffer,
    unescapeCodePoint: unescapeCodePoint,
    unexpectedObjToString: unexpectedObjToString,
    checkNotNull: checkNotNull
  });

  // These are just categories that are used in ES5/ES2015.
  // The full list of Unicode categories is here: http://www.fileformat.info/info/unicode/category/index.htm.
  const UnicodeCategories = {
    // Letters
    Lu: /\p{Lu}/u,
    Ll: /\p{Ll}/u,
    Lt: /\p{Lt}/u,
    Lm: /\p{Lm}/u,
    Lo: /\p{Lo}/u,

    // Numbers
    Nl: /\p{Nl}/u,
    Nd: /\p{Nd}/u,

    // Marks
    Mn: /\p{Mn}/u,
    Mc: /\p{Mc}/u,

    // Punctuation, Connector
    Pc: /\p{Pc}/u,

    // Separator, Space
    Zs: /\p{Zs}/u,

    // These two are not real Unicode categories, but our useful for Ohm.
    // L is a combination of all the letter categories.
    // Ltmo is a combination of Lt, Lm, and Lo.
    L: /\p{Letter}/u,
    Ltmo: /\p{Lt}|\p{Lm}|\p{Lo}/u,
  };

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // General stuff

  class PExpr {
    constructor() {
      if (this.constructor === PExpr) {
        throw new Error("PExpr cannot be instantiated -- it's abstract");
      }
    }

    // Set the `source` property to the interval containing the source for this expression.
    withSource(interval) {
      if (interval) {
        this.source = interval.trimmed();
      }
      return this;
    }
  }

  // Any

  const any = Object.create(PExpr.prototype);

  // End

  const end = Object.create(PExpr.prototype);

  // Terminals

  class Terminal extends PExpr {
    constructor(obj) {
      super();
      this.obj = obj;
    }
  }

  // Ranges

  class Range extends PExpr {
    constructor(from, to) {
      super();
      this.from = from;
      this.to = to;
      // If either `from` or `to` is made up of multiple code units, then
      // the range should consume a full code point, not a single code unit.
      this.matchCodePoint = from.length > 1 || to.length > 1;
    }
  }

  // Parameters

  class Param extends PExpr {
    constructor(index) {
      super();
      this.index = index;
    }
  }

  // Alternation

  class Alt extends PExpr {
    constructor(terms) {
      super();
      this.terms = terms;
    }
  }

  // Extend is an implementation detail of rule extension

  class Extend extends Alt {
    constructor(superGrammar, name, body) {
      const origBody = superGrammar.rules[name].body;
      super([body, origBody]);

      this.superGrammar = superGrammar;
      this.name = name;
      this.body = body;
    }
  }

  // Splice is an implementation detail of rule overriding with the `...` operator.
  class Splice extends Alt {
    constructor(superGrammar, ruleName, beforeTerms, afterTerms) {
      const origBody = superGrammar.rules[ruleName].body;
      super([...beforeTerms, origBody, ...afterTerms]);

      this.superGrammar = superGrammar;
      this.ruleName = ruleName;
      this.expansionPos = beforeTerms.length;
    }
  }

  // Sequences

  class Seq extends PExpr {
    constructor(factors) {
      super();
      this.factors = factors;
    }
  }

  // Iterators and optionals

  class Iter extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  class Star extends Iter {}
  class Plus extends Iter {}
  class Opt extends Iter {}

  Star.prototype.operator = '*';
  Plus.prototype.operator = '+';
  Opt.prototype.operator = '?';

  Star.prototype.minNumMatches = 0;
  Plus.prototype.minNumMatches = 1;
  Opt.prototype.minNumMatches = 0;

  Star.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
  Plus.prototype.maxNumMatches = Number.POSITIVE_INFINITY;
  Opt.prototype.maxNumMatches = 1;

  // Predicates

  class Not extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  class Lookahead extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  // "Lexification"

  class Lex extends PExpr {
    constructor(expr) {
      super();
      this.expr = expr;
    }
  }

  // Rule application

  class Apply extends PExpr {
    constructor(ruleName, args = []) {
      super();
      this.ruleName = ruleName;
      this.args = args;
    }

    isSyntactic() {
      return isSyntactic(this.ruleName);
    }

    // This method just caches the result of `this.toString()` in a non-enumerable property.
    toMemoKey() {
      if (!this._memoKey) {
        Object.defineProperty(this, '_memoKey', {value: this.toString()});
      }
      return this._memoKey;
    }
  }

  // Unicode character

  class UnicodeChar extends PExpr {
    constructor(category) {
      super();
      this.category = category;
      this.pattern = UnicodeCategories[category];
    }
  }

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function createError(message, optInterval) {
    let e;
    if (optInterval) {
      e = new Error(optInterval.getLineAndColumnMessage() + message);
      e.shortMessage = message;
      e.interval = optInterval;
    } else {
      e = new Error(message);
    }
    return e;
  }

  // ----------------- errors about intervals -----------------

  function intervalSourcesDontMatch() {
    return createError("Interval sources don't match");
  }

  // ----------------- errors about grammars -----------------

  // Grammar syntax error

  function grammarSyntaxError(matchFailure) {
    const e = new Error();
    Object.defineProperty(e, 'message', {
      enumerable: true,
      get() {
        return matchFailure.message;
      },
    });
    Object.defineProperty(e, 'shortMessage', {
      enumerable: true,
      get() {
        return 'Expected ' + matchFailure.getExpectedText();
      },
    });
    e.interval = matchFailure.getInterval();
    return e;
  }

  // Undeclared grammar

  function undeclaredGrammar(grammarName, namespace, interval) {
    const message = namespace ?
      `Grammar ${grammarName} is not declared in namespace '${namespace}'` :
      'Undeclared grammar ' + grammarName;
    return createError(message, interval);
  }

  // Duplicate grammar declaration

  function duplicateGrammarDeclaration(grammar, namespace) {
    return createError('Grammar ' + grammar.name + ' is already declared in this namespace');
  }

  function grammarDoesNotSupportIncrementalParsing(grammar) {
    return createError(`Grammar '${grammar.name}' does not support incremental parsing`);
  }

  // ----------------- rules -----------------

  // Undeclared rule

  function undeclaredRule(ruleName, grammarName, optInterval) {
    return createError(
        'Rule ' + ruleName + ' is not declared in grammar ' + grammarName,
        optInterval,
    );
  }

  // Cannot override undeclared rule

  function cannotOverrideUndeclaredRule(ruleName, grammarName, optSource) {
    return createError(
        'Cannot override rule ' + ruleName + ' because it is not declared in ' + grammarName,
        optSource,
    );
  }

  // Cannot extend undeclared rule

  function cannotExtendUndeclaredRule(ruleName, grammarName, optSource) {
    return createError(
        'Cannot extend rule ' + ruleName + ' because it is not declared in ' + grammarName,
        optSource,
    );
  }

  // Duplicate rule declaration

  function duplicateRuleDeclaration(ruleName, grammarName, declGrammarName, optSource) {
    let message =
      "Duplicate declaration for rule '" + ruleName + "' in grammar '" + grammarName + "'";
    if (grammarName !== declGrammarName) {
      message += " (originally declared in '" + declGrammarName + "')";
    }
    return createError(message, optSource);
  }

  // Wrong number of parameters

  function wrongNumberOfParameters(ruleName, expected, actual, source) {
    return createError(
        'Wrong number of parameters for rule ' +
        ruleName +
        ' (expected ' +
        expected +
        ', got ' +
        actual +
        ')',
        source,
    );
  }

  // Wrong number of arguments

  function wrongNumberOfArguments(ruleName, expected, actual, expr) {
    return createError(
        'Wrong number of arguments for rule ' +
        ruleName +
        ' (expected ' +
        expected +
        ', got ' +
        actual +
        ')',
        expr,
    );
  }

  // Duplicate parameter names

  function duplicateParameterNames(ruleName, duplicates, source) {
    return createError(
        'Duplicate parameter names in rule ' + ruleName + ': ' + duplicates.join(', '),
        source,
    );
  }

  // Invalid parameter expression

  function invalidParameter(ruleName, expr) {
    return createError(
        'Invalid parameter to rule ' +
        ruleName +
        ': ' +
        expr +
        ' has arity ' +
        expr.getArity() +
        ', but parameter expressions must have arity 1',
        expr.source,
    );
  }

  // Application of syntactic rule from lexical rule

  const syntacticVsLexicalNote =
    'NOTE: A _syntactic rule_ is a rule whose name begins with a capital letter. ' +
    'See https://ohmjs.org/d/svl for more details.';

  function applicationOfSyntacticRuleFromLexicalContext(ruleName, applyExpr) {
    return createError(
        'Cannot apply syntactic rule ' + ruleName + ' from here (inside a lexical context)',
        applyExpr.source,
    );
  }

  // Lexical rule application used with applySyntactic

  function applySyntacticWithLexicalRuleApplication(applyExpr) {
    const {ruleName} = applyExpr;
    return createError(
        `applySyntactic is for syntactic rules, but '${ruleName}' is a lexical rule. ` +
        syntacticVsLexicalNote,
        applyExpr.source,
    );
  }

  // Application of applySyntactic in a syntactic context

  function unnecessaryExperimentalApplySyntactic(applyExpr) {
    return createError(
        'applySyntactic is not required here (in a syntactic context)',
        applyExpr.source,
    );
  }

  // Incorrect argument type

  function incorrectArgumentType(expectedType, expr) {
    return createError('Incorrect argument type: expected ' + expectedType, expr.source);
  }

  // Multiple instances of the super-splice operator (`...`) in the rule body.

  function multipleSuperSplices(expr) {
    return createError("'...' can appear at most once in a rule body", expr.source);
  }

  // Unicode code point escapes

  function invalidCodePoint(applyWrapper) {
    const node = applyWrapper._node;
    assert(node && node.isNonterminal() && node.ctorName === 'escapeChar_unicodeCodePoint');

    // Get an interval that covers all of the hex digits.
    const digitIntervals = applyWrapper.children.slice(1, -1).map(d => d.source);
    const fullInterval = digitIntervals[0].coverageWith(...digitIntervals.slice(1));
    return createError(
        `U+${fullInterval.contents} is not a valid Unicode code point`,
        fullInterval,
    );
  }

  // ----------------- Kleene operators -----------------

  function kleeneExprHasNullableOperand(kleeneExpr, applicationStack) {
    const actuals =
      applicationStack.length > 0 ? applicationStack[applicationStack.length - 1].args : [];
    const expr = kleeneExpr.expr.substituteParams(actuals);
    let message =
      'Nullable expression ' +
      expr +
      " is not allowed inside '" +
      kleeneExpr.operator +
      "' (possible infinite loop)";
    if (applicationStack.length > 0) {
      const stackTrace = applicationStack
          .map(app => new Apply(app.ruleName, app.args))
          .join('\n');
      message += '\nApplication stack (most recent application last):\n' + stackTrace;
    }
    return createError(message, kleeneExpr.expr.source);
  }

  // ----------------- arity -----------------

  function inconsistentArity(ruleName, expected, actual, expr) {
    return createError(
        'Rule ' +
        ruleName +
        ' involves an alternation which has inconsistent arity ' +
        '(expected ' +
        expected +
        ', got ' +
        actual +
        ')',
        expr.source,
    );
  }

  // ----------------- convenience -----------------

  function multipleErrors(errors) {
    const messages = errors.map(e => e.message);
    return createError(['Errors:'].concat(messages).join('\n- '), errors[0].interval);
  }

  // ----------------- semantic -----------------

  function missingSemanticAction(ctorName, name, type, stack) {
    let stackTrace = stack
        .slice(0, -1)
        .map(info => {
          const ans = '  ' + info[0].name + ' > ' + info[1];
          return info.length === 3 ? ans + " for '" + info[2] + "'" : ans;
        })
        .join('\n');
    stackTrace += '\n  ' + name + ' > ' + ctorName;

    let moreInfo = '';
    if (ctorName === '_iter') {
      moreInfo = [
        '\nNOTE: as of Ohm v16, there is no default action for iteration nodes — see ',
        '  https://ohmjs.org/d/dsa for details.',
      ].join('\n');
    }

    const message = [
      `Missing semantic action for '${ctorName}' in ${type} '${name}'.${moreInfo}`,
      'Action stack (most recent call last):',
      stackTrace,
    ].join('\n');

    const e = createError(message);
    e.name = 'missingSemanticAction';
    return e;
  }

  function throwErrors(errors) {
    if (errors.length === 1) {
      throw errors[0];
    }
    if (errors.length > 1) {
      throw multipleErrors(errors);
    }
  }

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // Given an array of numbers `arr`, return an array of the numbers as strings,
  // right-justified and padded to the same length.
  function padNumbersToEqualLength(arr) {
    let maxLen = 0;
    const strings = arr.map(n => {
      const str = n.toString();
      maxLen = Math.max(maxLen, str.length);
      return str;
    });
    return strings.map(s => padLeft(s, maxLen));
  }

  // Produce a new string that would be the result of copying the contents
  // of the string `src` onto `dest` at offset `offest`.
  function strcpy(dest, src, offset) {
    const origDestLen = dest.length;
    const start = dest.slice(0, offset);
    const end = dest.slice(offset + src.length);
    return (start + src + end).substr(0, origDestLen);
  }

  // Casts the underlying lineAndCol object to a formatted message string,
  // highlighting `ranges`.
  function lineAndColumnToMessage(...ranges) {
    const lineAndCol = this;
    const {offset} = lineAndCol;
    const {repeatStr} = common;

    const sb = new StringBuffer();
    sb.append('Line ' + lineAndCol.lineNum + ', col ' + lineAndCol.colNum + ':\n');

    // An array of the previous, current, and next line numbers as strings of equal length.
    const lineNumbers = padNumbersToEqualLength([
      lineAndCol.prevLine == null ? 0 : lineAndCol.lineNum - 1,
      lineAndCol.lineNum,
      lineAndCol.nextLine == null ? 0 : lineAndCol.lineNum + 1,
    ]);

    // Helper for appending formatting input lines to the buffer.
    const appendLine = (num, content, prefix) => {
      sb.append(prefix + lineNumbers[num] + ' | ' + content + '\n');
    };

    // Include the previous line for context if possible.
    if (lineAndCol.prevLine != null) {
      appendLine(0, lineAndCol.prevLine, '  ');
    }
    // Line that the error occurred on.
    appendLine(1, lineAndCol.line, '> ');

    // Build up the line that points to the offset and possible indicates one or more ranges.
    // Start with a blank line, and indicate each range by overlaying a string of `~` chars.
    const lineLen = lineAndCol.line.length;
    let indicationLine = repeatStr(' ', lineLen + 1);
    for (let i = 0; i < ranges.length; ++i) {
      let startIdx = ranges[i][0];
      let endIdx = ranges[i][1];
      assert(startIdx >= 0 && startIdx <= endIdx, 'range start must be >= 0 and <= end');

      const lineStartOffset = offset - lineAndCol.colNum + 1;
      startIdx = Math.max(0, startIdx - lineStartOffset);
      endIdx = Math.min(endIdx - lineStartOffset, lineLen);

      indicationLine = strcpy(indicationLine, repeatStr('~', endIdx - startIdx), startIdx);
    }
    const gutterWidth = 2 + lineNumbers[1].length + 3;
    sb.append(repeatStr(' ', gutterWidth));
    indicationLine = strcpy(indicationLine, '^', lineAndCol.colNum - 1);
    sb.append(indicationLine.replace(/ +$/, '') + '\n');

    // Include the next line for context if possible.
    if (lineAndCol.nextLine != null) {
      appendLine(2, lineAndCol.nextLine, '  ');
    }
    return sb.contents();
  }

  // --------------------------------------------------------------------
  // Exports
  // --------------------------------------------------------------------

  let builtInRulesCallbacks = [];

  // Since Grammar.BuiltInRules is bootstrapped, most of Ohm can't directly depend it.
  // This function allows modules that do depend on the built-in rules to register a callback
  // that will be called later in the initialization process.
  function awaitBuiltInRules(cb) {
    builtInRulesCallbacks.push(cb);
  }

  function announceBuiltInRules(grammar) {
    builtInRulesCallbacks.forEach(cb => {
      cb(grammar);
    });
    builtInRulesCallbacks = null;
  }

  // Return an object with the line and column information for the given
  // offset in `str`.
  function getLineAndColumn(str, offset) {
    let lineNum = 1;
    let colNum = 1;

    let currOffset = 0;
    let lineStartOffset = 0;

    let nextLine = null;
    let prevLine = null;
    let prevLineStartOffset = -1;

    while (currOffset < offset) {
      const c = str.charAt(currOffset++);
      if (c === '\n') {
        lineNum++;
        colNum = 1;
        prevLineStartOffset = lineStartOffset;
        lineStartOffset = currOffset;
      } else if (c !== '\r') {
        colNum++;
      }
    }

    // Find the end of the target line.
    let lineEndOffset = str.indexOf('\n', lineStartOffset);
    if (lineEndOffset === -1) {
      lineEndOffset = str.length;
    } else {
      // Get the next line.
      const nextLineEndOffset = str.indexOf('\n', lineEndOffset + 1);
      nextLine =
        nextLineEndOffset === -1 ?
          str.slice(lineEndOffset) :
          str.slice(lineEndOffset, nextLineEndOffset);
      // Strip leading and trailing EOL char(s).
      nextLine = nextLine.replace(/^\r?\n/, '').replace(/\r$/, '');
    }

    // Get the previous line.
    if (prevLineStartOffset >= 0) {
      // Strip trailing EOL char(s).
      prevLine = str.slice(prevLineStartOffset, lineStartOffset).replace(/\r?\n$/, '');
    }

    // Get the target line, stripping a trailing carriage return if necessary.
    const line = str.slice(lineStartOffset, lineEndOffset).replace(/\r$/, '');

    return {
      offset,
      lineNum,
      colNum,
      line,
      prevLine,
      nextLine,
      toString: lineAndColumnToMessage,
    };
  }

  // Return a nicely-formatted string describing the line and column for the
  // given offset in `str` highlighting `ranges`.
  function getLineAndColumnMessage(str, offset, ...ranges) {
    return getLineAndColumn(str, offset).toString(...ranges);
  }

  const uniqueId = (() => {
    let idCounter = 0;
    return prefix => '' + prefix + idCounter++;
  })();

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  class Interval {
    constructor(sourceString, startIdx, endIdx) {
      this.sourceString = sourceString;
      this.startIdx = startIdx;
      this.endIdx = endIdx;
    }

    get contents() {
      if (this._contents === undefined) {
        this._contents = this.sourceString.slice(this.startIdx, this.endIdx);
      }
      return this._contents;
    }

    get length() {
      return this.endIdx - this.startIdx;
    }

    coverageWith(...intervals) {
      return Interval.coverage(...intervals, this);
    }

    collapsedLeft() {
      return new Interval(this.sourceString, this.startIdx, this.startIdx);
    }

    collapsedRight() {
      return new Interval(this.sourceString, this.endIdx, this.endIdx);
    }

    getLineAndColumn() {
      return getLineAndColumn(this.sourceString, this.startIdx);
    }

    getLineAndColumnMessage() {
      const range = [this.startIdx, this.endIdx];
      return getLineAndColumnMessage(this.sourceString, this.startIdx, range);
    }

    // Returns an array of 0, 1, or 2 intervals that represents the result of the
    // interval difference operation.
    minus(that) {
      if (this.sourceString !== that.sourceString) {
        throw intervalSourcesDontMatch();
      } else if (this.startIdx === that.startIdx && this.endIdx === that.endIdx) {
        // `this` and `that` are the same interval!
        return [];
      } else if (this.startIdx < that.startIdx && that.endIdx < this.endIdx) {
        // `that` splits `this` into two intervals
        return [
          new Interval(this.sourceString, this.startIdx, that.startIdx),
          new Interval(this.sourceString, that.endIdx, this.endIdx),
        ];
      } else if (this.startIdx < that.endIdx && that.endIdx < this.endIdx) {
        // `that` contains a prefix of `this`
        return [new Interval(this.sourceString, that.endIdx, this.endIdx)];
      } else if (this.startIdx < that.startIdx && that.startIdx < this.endIdx) {
        // `that` contains a suffix of `this`
        return [new Interval(this.sourceString, this.startIdx, that.startIdx)];
      } else {
        // `that` and `this` do not overlap
        return [this];
      }
    }

    // Returns a new Interval that has the same extent as this one, but which is relative
    // to `that`, an Interval that fully covers this one.
    relativeTo(that) {
      if (this.sourceString !== that.sourceString) {
        throw intervalSourcesDontMatch();
      }
      assert(
          this.startIdx >= that.startIdx && this.endIdx <= that.endIdx,
          'other interval does not cover this one',
      );
      return new Interval(
          this.sourceString,
          this.startIdx - that.startIdx,
          this.endIdx - that.startIdx,
      );
    }

    // Returns a new Interval which contains the same contents as this one,
    // but with whitespace trimmed from both ends.
    trimmed() {
      const {contents} = this;
      const startIdx = this.startIdx + contents.match(/^\s*/)[0].length;
      const endIdx = this.endIdx - contents.match(/\s*$/)[0].length;
      return new Interval(this.sourceString, startIdx, endIdx);
    }

    subInterval(offset, len) {
      const newStartIdx = this.startIdx + offset;
      return new Interval(this.sourceString, newStartIdx, newStartIdx + len);
    }
  }

  Interval.coverage = function(firstInterval, ...intervals) {
    let {startIdx, endIdx} = firstInterval;
    for (const interval of intervals) {
      if (interval.sourceString !== firstInterval.sourceString) {
        throw intervalSourcesDontMatch();
      } else {
        startIdx = Math.min(startIdx, interval.startIdx);
        endIdx = Math.max(endIdx, interval.endIdx);
      }
    }
    return new Interval(firstInterval.sourceString, startIdx, endIdx);
  };

  const MAX_CHAR_CODE = 0xffff;

  class InputStream {
    constructor(source) {
      this.source = source;
      this.pos = 0;
      this.examinedLength = 0;
    }

    atEnd() {
      const ans = this.pos >= this.source.length;
      this.examinedLength = Math.max(this.examinedLength, this.pos + 1);
      return ans;
    }

    next() {
      const ans = this.source[this.pos++];
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return ans;
    }

    nextCharCode() {
      const nextChar = this.next();
      return nextChar && nextChar.charCodeAt(0);
    }

    nextCodePoint() {
      const cp = this.source.slice(this.pos++).codePointAt(0);
      // If the code point is beyond plane 0, it takes up two characters.
      if (cp > MAX_CHAR_CODE) {
        this.pos += 1;
      }
      this.examinedLength = Math.max(this.examinedLength, this.pos);
      return cp;
    }

    matchString(s, optIgnoreCase) {
      let idx;
      if (optIgnoreCase) {
        /*
          Case-insensitive comparison is a tricky business. Some notable gotchas include the
          "Turkish I" problem (http://www.i18nguy.com/unicode/turkish-i18n.html) and the fact
          that the German Esszet (ß) turns into "SS" in upper case.

          This is intended to be a locale-invariant comparison, which means it may not obey
          locale-specific expectations (e.g. "i" => "İ").
         */
        for (idx = 0; idx < s.length; idx++) {
          const actual = this.next();
          const expected = s[idx];
          if (actual == null || actual.toUpperCase() !== expected.toUpperCase()) {
            return false;
          }
        }
        return true;
      }
      // Default is case-sensitive comparison.
      for (idx = 0; idx < s.length; idx++) {
        if (this.next() !== s[idx]) {
          return false;
        }
      }
      return true;
    }

    sourceSlice(startIdx, endIdx) {
      return this.source.slice(startIdx, endIdx);
    }

    interval(startIdx, optEndIdx) {
      return new Interval(this.source, startIdx, optEndIdx ? optEndIdx : this.pos);
    }
  }

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  class MatchResult {
    constructor(
        matcher,
        input,
        startExpr,
        cst,
        cstOffset,
        rightmostFailurePosition,
        optRecordedFailures,
    ) {
      this.matcher = matcher;
      this.input = input;
      this.startExpr = startExpr;
      this._cst = cst;
      this._cstOffset = cstOffset;
      this._rightmostFailurePosition = rightmostFailurePosition;
      this._rightmostFailures = optRecordedFailures;

      if (this.failed()) {
        /* eslint-disable no-invalid-this */
        defineLazyProperty(this, 'message', function() {
          const detail = 'Expected ' + this.getExpectedText();
          return (
            getLineAndColumnMessage(this.input, this.getRightmostFailurePosition()) + detail
          );
        });
        defineLazyProperty(this, 'shortMessage', function() {
          const detail = 'expected ' + this.getExpectedText();
          const errorInfo = getLineAndColumn(
              this.input,
              this.getRightmostFailurePosition(),
          );
          return 'Line ' + errorInfo.lineNum + ', col ' + errorInfo.colNum + ': ' + detail;
        });
        /* eslint-enable no-invalid-this */
      }
    }

    succeeded() {
      return !!this._cst;
    }

    failed() {
      return !this.succeeded();
    }

    getRightmostFailurePosition() {
      return this._rightmostFailurePosition;
    }

    getRightmostFailures() {
      if (!this._rightmostFailures) {
        this.matcher.setInput(this.input);
        const matchResultWithFailures = this.matcher._match(this.startExpr, {
          tracing: false,
          positionToRecordFailures: this.getRightmostFailurePosition(),
        });
        this._rightmostFailures = matchResultWithFailures.getRightmostFailures();
      }
      return this._rightmostFailures;
    }

    toString() {
      return this.succeeded() ?
        '[match succeeded]' :
        '[match failed at position ' + this.getRightmostFailurePosition() + ']';
    }

    // Return a string summarizing the expected contents of the input stream when
    // the match failure occurred.
    getExpectedText() {
      if (this.succeeded()) {
        throw new Error('cannot get expected text of a successful MatchResult');
      }

      const sb = new StringBuffer();
      let failures = this.getRightmostFailures();

      // Filter out the fluffy failures to make the default error messages more useful
      failures = failures.filter(failure => !failure.isFluffy());

      for (let idx = 0; idx < failures.length; idx++) {
        if (idx > 0) {
          if (idx === failures.length - 1) {
            sb.append(failures.length > 2 ? ', or ' : ' or ');
          } else {
            sb.append(', ');
          }
        }
        sb.append(failures[idx].toString());
      }
      return sb.contents();
    }

    getInterval() {
      const pos = this.getRightmostFailurePosition();
      return new Interval(this.input, pos, pos);
    }
  }

  class PosInfo {
    constructor() {
      this.applicationMemoKeyStack = []; // active applications at this position
      this.memo = {};
      this.maxExaminedLength = 0;
      this.maxRightmostFailureOffset = -1;
      this.currentLeftRecursion = undefined;
    }

    isActive(application) {
      return this.applicationMemoKeyStack.indexOf(application.toMemoKey()) >= 0;
    }

    enter(application) {
      this.applicationMemoKeyStack.push(application.toMemoKey());
    }

    exit() {
      this.applicationMemoKeyStack.pop();
    }

    startLeftRecursion(headApplication, memoRec) {
      memoRec.isLeftRecursion = true;
      memoRec.headApplication = headApplication;
      memoRec.nextLeftRecursion = this.currentLeftRecursion;
      this.currentLeftRecursion = memoRec;

      const {applicationMemoKeyStack} = this;
      const indexOfFirstInvolvedRule =
        applicationMemoKeyStack.indexOf(headApplication.toMemoKey()) + 1;
      const involvedApplicationMemoKeys = applicationMemoKeyStack.slice(
          indexOfFirstInvolvedRule,
      );

      memoRec.isInvolved = function(applicationMemoKey) {
        return involvedApplicationMemoKeys.indexOf(applicationMemoKey) >= 0;
      };

      memoRec.updateInvolvedApplicationMemoKeys = function() {
        for (let idx = indexOfFirstInvolvedRule; idx < applicationMemoKeyStack.length; idx++) {
          const applicationMemoKey = applicationMemoKeyStack[idx];
          if (!this.isInvolved(applicationMemoKey)) {
            involvedApplicationMemoKeys.push(applicationMemoKey);
          }
        }
      };
    }

    endLeftRecursion() {
      this.currentLeftRecursion = this.currentLeftRecursion.nextLeftRecursion;
    }

    // Note: this method doesn't get called for the "head" of a left recursion -- for LR heads,
    // the memoized result (which starts out being a failure) is always used.
    shouldUseMemoizedResult(memoRec) {
      if (!memoRec.isLeftRecursion) {
        return true;
      }
      const {applicationMemoKeyStack} = this;
      for (let idx = 0; idx < applicationMemoKeyStack.length; idx++) {
        const applicationMemoKey = applicationMemoKeyStack[idx];
        if (memoRec.isInvolved(applicationMemoKey)) {
          return false;
        }
      }
      return true;
    }

    memoize(memoKey, memoRec) {
      this.memo[memoKey] = memoRec;
      this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
      this.maxRightmostFailureOffset = Math.max(
          this.maxRightmostFailureOffset,
          memoRec.rightmostFailureOffset,
      );
      return memoRec;
    }

    clearObsoleteEntries(pos, invalidatedIdx) {
      if (pos + this.maxExaminedLength <= invalidatedIdx) {
        // Optimization: none of the rule applications that were memoized here examined the
        // interval of the input that changed, so nothing has to be invalidated.
        return;
      }

      const {memo} = this;
      this.maxExaminedLength = 0;
      this.maxRightmostFailureOffset = -1;
      Object.keys(memo).forEach(k => {
        const memoRec = memo[k];
        if (pos + memoRec.examinedLength > invalidatedIdx) {
          delete memo[k];
        } else {
          this.maxExaminedLength = Math.max(this.maxExaminedLength, memoRec.examinedLength);
          this.maxRightmostFailureOffset = Math.max(
              this.maxRightmostFailureOffset,
              memoRec.rightmostFailureOffset,
          );
        }
      });
    }
  }

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  // Unicode characters that are used in the `toString` output.
  const BALLOT_X = '\u2717';
  const CHECK_MARK = '\u2713';
  const DOT_OPERATOR = '\u22C5';
  const RIGHTWARDS_DOUBLE_ARROW = '\u21D2';
  const SYMBOL_FOR_HORIZONTAL_TABULATION = '\u2409';
  const SYMBOL_FOR_LINE_FEED = '\u240A';
  const SYMBOL_FOR_CARRIAGE_RETURN = '\u240D';

  const Flags = {
    succeeded: 1 << 0,
    isRootNode: 1 << 1,
    isImplicitSpaces: 1 << 2,
    isMemoized: 1 << 3,
    isHeadOfLeftRecursion: 1 << 4,
    terminatesLR: 1 << 5,
  };

  function spaces(n) {
    return repeat(' ', n).join('');
  }

  // Return a string representation of a portion of `input` at offset `pos`.
  // The result will contain exactly `len` characters.
  function getInputExcerpt(input, pos, len) {
    const excerpt = asEscapedString(input.slice(pos, pos + len));

    // Pad the output if necessary.
    if (excerpt.length < len) {
      return excerpt + repeat(' ', len - excerpt.length).join('');
    }
    return excerpt;
  }

  function asEscapedString(obj) {
    if (typeof obj === 'string') {
      // Replace non-printable characters with visible symbols.
      return obj
          .replace(/ /g, DOT_OPERATOR)
          .replace(/\t/g, SYMBOL_FOR_HORIZONTAL_TABULATION)
          .replace(/\n/g, SYMBOL_FOR_LINE_FEED)
          .replace(/\r/g, SYMBOL_FOR_CARRIAGE_RETURN);
    }
    return String(obj);
  }

  // ----------------- Trace -----------------

  class Trace {
    constructor(input, pos1, pos2, expr, succeeded, bindings, optChildren) {
      this.input = input;
      this.pos = this.pos1 = pos1;
      this.pos2 = pos2;
      this.source = new Interval(input, pos1, pos2);
      this.expr = expr;
      this.bindings = bindings;
      this.children = optChildren || [];
      this.terminatingLREntry = null;

      this._flags = succeeded ? Flags.succeeded : 0;
    }

    get displayString() {
      return this.expr.toDisplayString();
    }

    clone() {
      return this.cloneWithExpr(this.expr);
    }

    cloneWithExpr(expr) {
      const ans = new Trace(
          this.input,
          this.pos,
          this.pos2,
          expr,
          this.succeeded,
          this.bindings,
          this.children,
      );

      ans.isHeadOfLeftRecursion = this.isHeadOfLeftRecursion;
      ans.isImplicitSpaces = this.isImplicitSpaces;
      ans.isMemoized = this.isMemoized;
      ans.isRootNode = this.isRootNode;
      ans.terminatesLR = this.terminatesLR;
      ans.terminatingLREntry = this.terminatingLREntry;
      return ans;
    }

    // Record the trace information for the terminating condition of the LR loop.
    recordLRTermination(ruleBodyTrace, value) {
      this.terminatingLREntry = new Trace(
          this.input,
          this.pos,
          this.pos2,
          this.expr,
          false,
          [value],
          [ruleBodyTrace],
      );
      this.terminatingLREntry.terminatesLR = true;
    }

    // Recursively traverse this trace node and all its descendents, calling a visitor function
    // for each node that is visited. If `vistorObjOrFn` is an object, then its 'enter' property
    // is a function to call before visiting the children of a node, and its 'exit' property is
    // a function to call afterwards. If `visitorObjOrFn` is a function, it represents the 'enter'
    // function.
    //
    // The functions are called with three arguments: the Trace node, its parent Trace, and a number
    // representing the depth of the node in the tree. (The root node has depth 0.) `optThisArg`, if
    // specified, is the value to use for `this` when executing the visitor functions.
    walk(visitorObjOrFn, optThisArg) {
      let visitor = visitorObjOrFn;
      if (typeof visitor === 'function') {
        visitor = {enter: visitor};
      }

      function _walk(node, parent, depth) {
        let recurse = true;
        if (visitor.enter) {
          if (visitor.enter.call(optThisArg, node, parent, depth) === Trace.prototype.SKIP) {
            recurse = false;
          }
        }
        if (recurse) {
          node.children.forEach(child => {
            _walk(child, node, depth + 1);
          });
          if (visitor.exit) {
            visitor.exit.call(optThisArg, node, parent, depth);
          }
        }
      }
      if (this.isRootNode) {
        // Don't visit the root node itself, only its children.
        this.children.forEach(c => {
          _walk(c, null, 0);
        });
      } else {
        _walk(this, null, 0);
      }
    }

    // Return a string representation of the trace.
    // Sample:
    //     12⋅+⋅2⋅*⋅3 ✓ exp ⇒  "12"
    //     12⋅+⋅2⋅*⋅3   ✓ addExp (LR) ⇒  "12"
    //     12⋅+⋅2⋅*⋅3       ✗ addExp_plus
    toString() {
      const sb = new StringBuffer();
      this.walk((node, parent, depth) => {
        if (!node) {
          return this.SKIP;
        }
        const ctorName = node.expr.constructor.name;
        // Don't print anything for Alt nodes.
        if (ctorName === 'Alt') {
          return; // eslint-disable-line consistent-return
        }
        sb.append(getInputExcerpt(node.input, node.pos, 10) + spaces(depth * 2 + 1));
        sb.append((node.succeeded ? CHECK_MARK : BALLOT_X) + ' ' + node.displayString);
        if (node.isHeadOfLeftRecursion) {
          sb.append(' (LR)');
        }
        if (node.succeeded) {
          const contents = asEscapedString(node.source.contents);
          sb.append(' ' + RIGHTWARDS_DOUBLE_ARROW + '  ');
          sb.append(typeof contents === 'string' ? '"' + contents + '"' : contents);
        }
        sb.append('\n');
      });
      return sb.contents();
    }
  }

  // A value that can be returned from visitor functions to indicate that a
  // node should not be recursed into.
  Trace.prototype.SKIP = {};

  // For convenience, create a getter and setter for the boolean flags in `Flags`.
  Object.keys(Flags).forEach(name => {
    const mask = Flags[name];
    Object.defineProperty(Trace.prototype, name, {
      get() {
        return (this._flags & mask) !== 0;
      },
      set(val) {
        if (val) {
          this._flags |= mask;
        } else {
          this._flags &= ~mask;
        }
      },
    });
  });

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Return true if we should skip spaces preceding this expression in a syntactic context.
  */
  PExpr.prototype.allowsSkippingPrecedingSpace = abstract('allowsSkippingPrecedingSpace');

  /*
    Generally, these are all first-order expressions and (with the exception of Apply)
    directly read from the input stream.
  */
  any.allowsSkippingPrecedingSpace =
    end.allowsSkippingPrecedingSpace =
    Apply.prototype.allowsSkippingPrecedingSpace =
    Terminal.prototype.allowsSkippingPrecedingSpace =
    Range.prototype.allowsSkippingPrecedingSpace =
    UnicodeChar.prototype.allowsSkippingPrecedingSpace =
      function() {
        return true;
      };

  /*
    Higher-order expressions that don't directly consume input.
  */
  Alt.prototype.allowsSkippingPrecedingSpace =
    Iter.prototype.allowsSkippingPrecedingSpace =
    Lex.prototype.allowsSkippingPrecedingSpace =
    Lookahead.prototype.allowsSkippingPrecedingSpace =
    Not.prototype.allowsSkippingPrecedingSpace =
    Param.prototype.allowsSkippingPrecedingSpace =
    Seq.prototype.allowsSkippingPrecedingSpace =
      function() {
        return false;
      };

  let BuiltInRules$1;

  awaitBuiltInRules(g => {
    BuiltInRules$1 = g;
  });

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  let lexifyCount;

  PExpr.prototype.assertAllApplicationsAreValid = function(ruleName, grammar) {
    lexifyCount = 0;
    this._assertAllApplicationsAreValid(ruleName, grammar);
  };

  PExpr.prototype._assertAllApplicationsAreValid = abstract(
      '_assertAllApplicationsAreValid',
  );

  any._assertAllApplicationsAreValid =
    end._assertAllApplicationsAreValid =
    Terminal.prototype._assertAllApplicationsAreValid =
    Range.prototype._assertAllApplicationsAreValid =
    Param.prototype._assertAllApplicationsAreValid =
    UnicodeChar.prototype._assertAllApplicationsAreValid =
      function(ruleName, grammar) {
        // no-op
      };

  Lex.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
    lexifyCount++;
    this.expr._assertAllApplicationsAreValid(ruleName, grammar);
    lexifyCount--;
  };

  Alt.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      this.terms[idx]._assertAllApplicationsAreValid(ruleName, grammar);
    }
  };

  Seq.prototype._assertAllApplicationsAreValid = function(ruleName, grammar) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx]._assertAllApplicationsAreValid(ruleName, grammar);
    }
  };

  Iter.prototype._assertAllApplicationsAreValid =
    Not.prototype._assertAllApplicationsAreValid =
    Lookahead.prototype._assertAllApplicationsAreValid =
      function(ruleName, grammar) {
        this.expr._assertAllApplicationsAreValid(ruleName, grammar);
      };

  Apply.prototype._assertAllApplicationsAreValid = function(
      ruleName,
      grammar,
      skipSyntacticCheck = false,
  ) {
    const ruleInfo = grammar.rules[this.ruleName];
    const isContextSyntactic = isSyntactic(ruleName) && lexifyCount === 0;

    // Make sure that the rule exists...
    if (!ruleInfo) {
      throw undeclaredRule(this.ruleName, grammar.name, this.source);
    }

    // ...and that this application is allowed
    if (!skipSyntacticCheck && isSyntactic(this.ruleName) && !isContextSyntactic) {
      throw applicationOfSyntacticRuleFromLexicalContext(this.ruleName, this);
    }

    // ...and that this application has the correct number of arguments.
    const actual = this.args.length;
    const expected = ruleInfo.formals.length;
    if (actual !== expected) {
      throw wrongNumberOfArguments(this.ruleName, expected, actual, this.source);
    }

    const isBuiltInApplySyntactic =
      BuiltInRules$1 && ruleInfo === BuiltInRules$1.rules.applySyntactic;
    const isBuiltInCaseInsensitive =
      BuiltInRules$1 && ruleInfo === BuiltInRules$1.rules.caseInsensitive;

    // If it's an application of 'caseInsensitive', ensure that the argument is a Terminal.
    if (isBuiltInCaseInsensitive) {
      if (!(this.args[0] instanceof Terminal)) {
        throw incorrectArgumentType('a Terminal (e.g. "abc")', this.args[0]);
      }
    }

    if (isBuiltInApplySyntactic) {
      const arg = this.args[0];
      if (!(arg instanceof Apply)) {
        throw incorrectArgumentType('a syntactic rule application', arg);
      }
      if (!isSyntactic(arg.ruleName)) {
        throw applySyntacticWithLexicalRuleApplication(arg);
      }
      if (isContextSyntactic) {
        throw unnecessaryExperimentalApplySyntactic(this);
      }
    }

    // ...and that all of the argument expressions only have valid applications and have arity 1.
    // If `this` is an application of the built-in applySyntactic rule, then its arg is
    // allowed (and expected) to be a syntactic rule, even if we're in a lexical context.
    this.args.forEach(arg => {
      arg._assertAllApplicationsAreValid(ruleName, grammar, isBuiltInApplySyntactic);
      if (arg.getArity() !== 1) {
        throw invalidParameter(this.ruleName, arg);
      }
    });
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  PExpr.prototype.assertChoicesHaveUniformArity = abstract(
      'assertChoicesHaveUniformArity',
  );

  any.assertChoicesHaveUniformArity =
    end.assertChoicesHaveUniformArity =
    Terminal.prototype.assertChoicesHaveUniformArity =
    Range.prototype.assertChoicesHaveUniformArity =
    Param.prototype.assertChoicesHaveUniformArity =
    Lex.prototype.assertChoicesHaveUniformArity =
    UnicodeChar.prototype.assertChoicesHaveUniformArity =
      function(ruleName) {
        // no-op
      };

  Alt.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    if (this.terms.length === 0) {
      return;
    }
    const arity = this.terms[0].getArity();
    for (let idx = 0; idx < this.terms.length; idx++) {
      const term = this.terms[idx];
      term.assertChoicesHaveUniformArity();
      const otherArity = term.getArity();
      if (arity !== otherArity) {
        throw inconsistentArity(ruleName, arity, otherArity, term);
      }
    }
  };

  Extend.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    // Extend is a special case of Alt that's guaranteed to have exactly two
    // cases: [extensions, origBody].
    const actualArity = this.terms[0].getArity();
    const expectedArity = this.terms[1].getArity();
    if (actualArity !== expectedArity) {
      throw inconsistentArity(ruleName, expectedArity, actualArity, this.terms[0]);
    }
  };

  Seq.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx].assertChoicesHaveUniformArity(ruleName);
    }
  };

  Iter.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    this.expr.assertChoicesHaveUniformArity(ruleName);
  };

  Not.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    // no-op (not required b/c the nested expr doesn't show up in the CST)
  };

  Lookahead.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    this.expr.assertChoicesHaveUniformArity(ruleName);
  };

  Apply.prototype.assertChoicesHaveUniformArity = function(ruleName) {
    // The arities of the parameter expressions is required to be 1 by
    // `assertAllApplicationsAreValid()`.
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  PExpr.prototype.assertIteratedExprsAreNotNullable = abstract(
      'assertIteratedExprsAreNotNullable',
  );

  any.assertIteratedExprsAreNotNullable =
    end.assertIteratedExprsAreNotNullable =
    Terminal.prototype.assertIteratedExprsAreNotNullable =
    Range.prototype.assertIteratedExprsAreNotNullable =
    Param.prototype.assertIteratedExprsAreNotNullable =
    UnicodeChar.prototype.assertIteratedExprsAreNotNullable =
      function(grammar) {
        // no-op
      };

  Alt.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      this.terms[idx].assertIteratedExprsAreNotNullable(grammar);
    }
  };

  Seq.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      this.factors[idx].assertIteratedExprsAreNotNullable(grammar);
    }
  };

  Iter.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    // Note: this is the implementation of this method for `Star` and `Plus` expressions.
    // It is overridden for `Opt` below.
    this.expr.assertIteratedExprsAreNotNullable(grammar);
    if (this.expr.isNullable(grammar)) {
      throw kleeneExprHasNullableOperand(this, []);
    }
  };

  Opt.prototype.assertIteratedExprsAreNotNullable =
    Not.prototype.assertIteratedExprsAreNotNullable =
    Lookahead.prototype.assertIteratedExprsAreNotNullable =
    Lex.prototype.assertIteratedExprsAreNotNullable =
      function(grammar) {
        this.expr.assertIteratedExprsAreNotNullable(grammar);
      };

  Apply.prototype.assertIteratedExprsAreNotNullable = function(grammar) {
    this.args.forEach(arg => {
      arg.assertIteratedExprsAreNotNullable(grammar);
    });
  };

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  class Node {
    constructor(matchLength) {
      this.matchLength = matchLength;
    }

    get ctorName() {
      throw new Error('subclass responsibility');
    }

    numChildren() {
      return this.children ? this.children.length : 0;
    }

    childAt(idx) {
      if (this.children) {
        return this.children[idx];
      }
    }

    indexOfChild(arg) {
      return this.children.indexOf(arg);
    }

    hasChildren() {
      return this.numChildren() > 0;
    }

    hasNoChildren() {
      return !this.hasChildren();
    }

    onlyChild() {
      if (this.numChildren() !== 1) {
        throw new Error(
            'cannot get only child of a node of type ' +
            this.ctorName +
            ' (it has ' +
            this.numChildren() +
            ' children)',
        );
      } else {
        return this.firstChild();
      }
    }

    firstChild() {
      if (this.hasNoChildren()) {
        throw new Error(
            'cannot get first child of a ' + this.ctorName + ' node, which has no children',
        );
      } else {
        return this.childAt(0);
      }
    }

    lastChild() {
      if (this.hasNoChildren()) {
        throw new Error(
            'cannot get last child of a ' + this.ctorName + ' node, which has no children',
        );
      } else {
        return this.childAt(this.numChildren() - 1);
      }
    }

    childBefore(child) {
      const childIdx = this.indexOfChild(child);
      if (childIdx < 0) {
        throw new Error('Node.childBefore() called w/ an argument that is not a child');
      } else if (childIdx === 0) {
        throw new Error('cannot get child before first child');
      } else {
        return this.childAt(childIdx - 1);
      }
    }

    childAfter(child) {
      const childIdx = this.indexOfChild(child);
      if (childIdx < 0) {
        throw new Error('Node.childAfter() called w/ an argument that is not a child');
      } else if (childIdx === this.numChildren() - 1) {
        throw new Error('cannot get child after last child');
      } else {
        return this.childAt(childIdx + 1);
      }
    }

    isTerminal() {
      return false;
    }

    isNonterminal() {
      return false;
    }

    isIteration() {
      return false;
    }

    isOptional() {
      return false;
    }
  }

  // Terminals

  class TerminalNode extends Node {
    get ctorName() {
      return '_terminal';
    }

    isTerminal() {
      return true;
    }

    get primitiveValue() {
      throw new Error('The `primitiveValue` property was removed in Ohm v17.');
    }
  }

  // Nonterminals

  class NonterminalNode extends Node {
    constructor(ruleName, children, childOffsets, matchLength) {
      super(matchLength);
      this.ruleName = ruleName;
      this.children = children;
      this.childOffsets = childOffsets;
    }

    get ctorName() {
      return this.ruleName;
    }

    isNonterminal() {
      return true;
    }

    isLexical() {
      return isLexical(this.ctorName);
    }

    isSyntactic() {
      return isSyntactic(this.ctorName);
    }
  }

  // Iterations

  class IterationNode extends Node {
    constructor(children, childOffsets, matchLength, isOptional) {
      super(matchLength);
      this.children = children;
      this.childOffsets = childOffsets;
      this.optional = isOptional;
    }

    get ctorName() {
      return '_iter';
    }

    isIteration() {
      return true;
    }

    isOptional() {
      return this.optional;
    }
  }

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Evaluate the expression and return `true` if it succeeds, `false` otherwise. This method should
    only be called directly by `State.prototype.eval(expr)`, which also updates the data structures
    that are used for tracing. (Making those updates in a method of `State` enables the trace-specific
    data structures to be "secrets" of that class, which is good for modularity.)

    The contract of this method is as follows:
    * When the return value is `true`,
      - the state object will have `expr.getArity()` more bindings than it did before the call.
    * When the return value is `false`,
      - the state object may have more bindings than it did before the call, and
      - its input stream's position may be anywhere.

    Note that `State.prototype.eval(expr)`, unlike this method, guarantees that neither the state
    object's bindings nor its input stream's position will change if the expression fails to match.
  */
  PExpr.prototype.eval = abstract('eval'); // function(state) { ... }

  any.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const cp = inputStream.nextCodePoint();
    if (cp !== undefined) {
      state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  end.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    if (inputStream.atEnd()) {
      state.pushBinding(new TerminalNode(0), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  Terminal.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    if (!inputStream.matchString(this.obj)) {
      state.processFailure(origPos, this);
      return false;
    } else {
      state.pushBinding(new TerminalNode(this.obj.length), origPos);
      return true;
    }
  };

  Range.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;

    // A range can operate in one of two modes: matching a single, 16-bit _code unit_,
    // or matching a _code point_. (Code points over 0xFFFF take up two 16-bit code units.)
    const cp = this.matchCodePoint ? inputStream.nextCodePoint() : inputStream.nextCharCode();

    // Always compare by code point value to get the correct result in all scenarios.
    // Note that for strings of length 1, codePointAt(0) and charPointAt(0) are equivalent.
    if (cp !== undefined && this.from.codePointAt(0) <= cp && cp <= this.to.codePointAt(0)) {
      state.pushBinding(new TerminalNode(String.fromCodePoint(cp).length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  Param.prototype.eval = function(state) {
    return state.eval(state.currentApplication().args[this.index]);
  };

  Lex.prototype.eval = function(state) {
    state.enterLexifiedContext();
    const ans = state.eval(this.expr);
    state.exitLexifiedContext();
    return ans;
  };

  Alt.prototype.eval = function(state) {
    for (let idx = 0; idx < this.terms.length; idx++) {
      if (state.eval(this.terms[idx])) {
        return true;
      }
    }
    return false;
  };

  Seq.prototype.eval = function(state) {
    for (let idx = 0; idx < this.factors.length; idx++) {
      const factor = this.factors[idx];
      if (!state.eval(factor)) {
        return false;
      }
    }
    return true;
  };

  Iter.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const arity = this.getArity();
    const cols = [];
    const colOffsets = [];
    while (cols.length < arity) {
      cols.push([]);
      colOffsets.push([]);
    }

    let numMatches = 0;
    let prevPos = origPos;
    let idx;
    while (numMatches < this.maxNumMatches && state.eval(this.expr)) {
      if (inputStream.pos === prevPos) {
        throw kleeneExprHasNullableOperand(this, state._applicationStack);
      }
      prevPos = inputStream.pos;
      numMatches++;
      const row = state._bindings.splice(state._bindings.length - arity, arity);
      const rowOffsets = state._bindingOffsets.splice(
          state._bindingOffsets.length - arity,
          arity,
      );
      for (idx = 0; idx < row.length; idx++) {
        cols[idx].push(row[idx]);
        colOffsets[idx].push(rowOffsets[idx]);
      }
    }
    if (numMatches < this.minNumMatches) {
      return false;
    }
    let offset = state.posToOffset(origPos);
    let matchLength = 0;
    if (numMatches > 0) {
      const lastCol = cols[arity - 1];
      const lastColOffsets = colOffsets[arity - 1];

      const endOffset =
        lastColOffsets[lastColOffsets.length - 1] + lastCol[lastCol.length - 1].matchLength;
      offset = colOffsets[0][0];
      matchLength = endOffset - offset;
    }
    const isOptional = this instanceof Opt;
    for (idx = 0; idx < cols.length; idx++) {
      state._bindings.push(
          new IterationNode(cols[idx], colOffsets[idx], matchLength, isOptional),
      );
      state._bindingOffsets.push(offset);
    }
    return true;
  };

  Not.prototype.eval = function(state) {
    /*
      TODO:
      - Right now we're just throwing away all of the failures that happen inside a `not`, and
        recording `this` as a failed expression.
      - Double negation should be equivalent to lookahead, but that's not the case right now wrt
        failures. E.g., ~~'foo' produces a failure for ~~'foo', but maybe it should produce
        a failure for 'foo' instead.
    */

    const {inputStream} = state;
    const origPos = inputStream.pos;
    state.pushFailuresInfo();

    const ans = state.eval(this.expr);

    state.popFailuresInfo();
    if (ans) {
      state.processFailure(origPos, this);
      return false;
    }

    inputStream.pos = origPos;
    return true;
  };

  Lookahead.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    if (state.eval(this.expr)) {
      inputStream.pos = origPos;
      return true;
    } else {
      return false;
    }
  };

  Apply.prototype.eval = function(state) {
    const caller = state.currentApplication();
    const actuals = caller ? caller.args : [];
    const app = this.substituteParams(actuals);

    const posInfo = state.getCurrentPosInfo();
    if (posInfo.isActive(app)) {
      // This rule is already active at this position, i.e., it is left-recursive.
      return app.handleCycle(state);
    }

    const memoKey = app.toMemoKey();
    const memoRec = posInfo.memo[memoKey];

    if (memoRec && posInfo.shouldUseMemoizedResult(memoRec)) {
      if (state.hasNecessaryInfo(memoRec)) {
        return state.useMemoizedResult(state.inputStream.pos, memoRec);
      }
      delete posInfo.memo[memoKey];
    }
    return app.reallyEval(state);
  };

  Apply.prototype.handleCycle = function(state) {
    const posInfo = state.getCurrentPosInfo();
    const {currentLeftRecursion} = posInfo;
    const memoKey = this.toMemoKey();
    let memoRec = posInfo.memo[memoKey];

    if (currentLeftRecursion && currentLeftRecursion.headApplication.toMemoKey() === memoKey) {
      // We already know about this left recursion, but it's possible there are "involved
      // applications" that we don't already know about, so...
      memoRec.updateInvolvedApplicationMemoKeys();
    } else if (!memoRec) {
      // New left recursion detected! Memoize a failure to try to get a seed parse.
      memoRec = posInfo.memoize(memoKey, {
        matchLength: 0,
        examinedLength: 0,
        value: false,
        rightmostFailureOffset: -1,
      });
      posInfo.startLeftRecursion(this, memoRec);
    }
    return state.useMemoizedResult(state.inputStream.pos, memoRec);
  };

  Apply.prototype.reallyEval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const origPosInfo = state.getCurrentPosInfo();
    const ruleInfo = state.grammar.rules[this.ruleName];
    const {body} = ruleInfo;
    const {description} = ruleInfo;

    state.enterApplication(origPosInfo, this);

    if (description) {
      state.pushFailuresInfo();
    }

    // Reset the input stream's examinedLength property so that we can track
    // the examined length of this particular application.
    const origInputStreamExaminedLength = inputStream.examinedLength;
    inputStream.examinedLength = 0;

    let value = this.evalOnce(body, state);
    const currentLR = origPosInfo.currentLeftRecursion;
    const memoKey = this.toMemoKey();
    const isHeadOfLeftRecursion = currentLR && currentLR.headApplication.toMemoKey() === memoKey;
    let memoRec;

    if (state.doNotMemoize) {
      state.doNotMemoize = false;
    } else if (isHeadOfLeftRecursion) {
      value = this.growSeedResult(body, state, origPos, currentLR, value);
      origPosInfo.endLeftRecursion();
      memoRec = currentLR;
      memoRec.examinedLength = inputStream.examinedLength - origPos;
      memoRec.rightmostFailureOffset = state._getRightmostFailureOffset();
      origPosInfo.memoize(memoKey, memoRec); // updates origPosInfo's maxExaminedLength
    } else if (!currentLR || !currentLR.isInvolved(memoKey)) {
      // This application is not involved in left recursion, so it's ok to memoize it.
      memoRec = origPosInfo.memoize(memoKey, {
        matchLength: inputStream.pos - origPos,
        examinedLength: inputStream.examinedLength - origPos,
        value,
        failuresAtRightmostPosition: state.cloneRecordedFailures(),
        rightmostFailureOffset: state._getRightmostFailureOffset(),
      });
    }
    const succeeded = !!value;

    if (description) {
      state.popFailuresInfo();
      if (!succeeded) {
        state.processFailure(origPos, this);
      }
      if (memoRec) {
        memoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();
      }
    }

    // Record trace information in the memo table, so that it is available if the memoized result
    // is used later.
    if (state.isTracing() && memoRec) {
      const entry = state.getTraceEntry(origPos, this, succeeded, succeeded ? [value] : []);
      if (isHeadOfLeftRecursion) {
        assert(entry.terminatingLREntry != null || !succeeded);
        entry.isHeadOfLeftRecursion = true;
      }
      memoRec.traceEntry = entry;
    }

    // Fix the input stream's examinedLength -- it should be the maximum examined length
    // across all applications, not just this one.
    inputStream.examinedLength = Math.max(
        inputStream.examinedLength,
        origInputStreamExaminedLength,
    );

    state.exitApplication(origPosInfo, value);

    return succeeded;
  };

  Apply.prototype.evalOnce = function(expr, state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;

    if (state.eval(expr)) {
      const arity = expr.getArity();
      const bindings = state._bindings.splice(state._bindings.length - arity, arity);
      const offsets = state._bindingOffsets.splice(state._bindingOffsets.length - arity, arity);
      const matchLength = inputStream.pos - origPos;
      return new NonterminalNode(this.ruleName, bindings, offsets, matchLength);
    } else {
      return false;
    }
  };

  Apply.prototype.growSeedResult = function(body, state, origPos, lrMemoRec, newValue) {
    if (!newValue) {
      return false;
    }

    const {inputStream} = state;

    while (true) {
      lrMemoRec.matchLength = inputStream.pos - origPos;
      lrMemoRec.value = newValue;
      lrMemoRec.failuresAtRightmostPosition = state.cloneRecordedFailures();

      if (state.isTracing()) {
        // Before evaluating the body again, add a trace node for this application to the memo entry.
        // Its only child is a copy of the trace node from `newValue`, which will always be the last
        // element in `state.trace`.
        const seedTrace = state.trace[state.trace.length - 1];
        lrMemoRec.traceEntry = new Trace(
            state.input,
            origPos,
            inputStream.pos,
            this,
            true,
            [newValue],
            [seedTrace.clone()],
        );
      }
      inputStream.pos = origPos;
      newValue = this.evalOnce(body, state);
      if (inputStream.pos - origPos <= lrMemoRec.matchLength) {
        break;
      }
      if (state.isTracing()) {
        state.trace.splice(-2, 1); // Drop the trace for the old seed.
      }
    }
    if (state.isTracing()) {
      // The last entry is for an unused result -- pop it and save it in the "real" entry.
      lrMemoRec.traceEntry.recordLRTermination(state.trace.pop(), newValue);
    }
    inputStream.pos = origPos + lrMemoRec.matchLength;
    return lrMemoRec.value;
  };

  UnicodeChar.prototype.eval = function(state) {
    const {inputStream} = state;
    const origPos = inputStream.pos;
    const ch = inputStream.next();
    if (ch && this.pattern.test(ch)) {
      state.pushBinding(new TerminalNode(ch.length), origPos);
      return true;
    } else {
      state.processFailure(origPos, this);
      return false;
    }
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  PExpr.prototype.getArity = abstract('getArity');

  any.getArity =
    end.getArity =
    Terminal.prototype.getArity =
    Range.prototype.getArity =
    Param.prototype.getArity =
    Apply.prototype.getArity =
    UnicodeChar.prototype.getArity =
      function() {
        return 1;
      };

  Alt.prototype.getArity = function() {
    // This is ok b/c all terms must have the same arity -- this property is
    // checked by the Grammar constructor.
    return this.terms.length === 0 ? 0 : this.terms[0].getArity();
  };

  Seq.prototype.getArity = function() {
    let arity = 0;
    for (let idx = 0; idx < this.factors.length; idx++) {
      arity += this.factors[idx].getArity();
    }
    return arity;
  };

  Iter.prototype.getArity = function() {
    return this.expr.getArity();
  };

  Not.prototype.getArity = function() {
    return 0;
  };

  Lookahead.prototype.getArity = Lex.prototype.getArity = function() {
    return this.expr.getArity();
  };

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function getMetaInfo(expr, grammarInterval) {
    const metaInfo = {};
    if (expr.source && grammarInterval) {
      const adjusted = expr.source.relativeTo(grammarInterval);
      metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
    }
    return metaInfo;
  }

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  PExpr.prototype.outputRecipe = abstract('outputRecipe');

  any.outputRecipe = function(formals, grammarInterval) {
    return ['any', getMetaInfo(this, grammarInterval)];
  };

  end.outputRecipe = function(formals, grammarInterval) {
    return ['end', getMetaInfo(this, grammarInterval)];
  };

  Terminal.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['terminal', getMetaInfo(this, grammarInterval), this.obj];
  };

  Range.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['range', getMetaInfo(this, grammarInterval), this.from, this.to];
  };

  Param.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['param', getMetaInfo(this, grammarInterval), this.index];
  };

  Alt.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['alt', getMetaInfo(this, grammarInterval)].concat(
        this.terms.map(term => term.outputRecipe(formals, grammarInterval)),
    );
  };

  Extend.prototype.outputRecipe = function(formals, grammarInterval) {
    const extension = this.terms[0]; // [extension, original]
    return extension.outputRecipe(formals, grammarInterval);
  };

  Splice.prototype.outputRecipe = function(formals, grammarInterval) {
    const beforeTerms = this.terms.slice(0, this.expansionPos);
    const afterTerms = this.terms.slice(this.expansionPos + 1);
    return [
      'splice',
      getMetaInfo(this, grammarInterval),
      beforeTerms.map(term => term.outputRecipe(formals, grammarInterval)),
      afterTerms.map(term => term.outputRecipe(formals, grammarInterval)),
    ];
  };

  Seq.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['seq', getMetaInfo(this, grammarInterval)].concat(
        this.factors.map(factor => factor.outputRecipe(formals, grammarInterval)),
    );
  };

  Star.prototype.outputRecipe =
    Plus.prototype.outputRecipe =
    Opt.prototype.outputRecipe =
    Not.prototype.outputRecipe =
    Lookahead.prototype.outputRecipe =
    Lex.prototype.outputRecipe =
      function(formals, grammarInterval) {
        return [
          this.constructor.name.toLowerCase(),
          getMetaInfo(this, grammarInterval),
          this.expr.outputRecipe(formals, grammarInterval),
        ];
      };

  Apply.prototype.outputRecipe = function(formals, grammarInterval) {
    return [
      'app',
      getMetaInfo(this, grammarInterval),
      this.ruleName,
      this.args.map(arg => arg.outputRecipe(formals, grammarInterval)),
    ];
  };

  UnicodeChar.prototype.outputRecipe = function(formals, grammarInterval) {
    return ['unicodeChar', getMetaInfo(this, grammarInterval), this.category];
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Called at grammar creation time to rewrite a rule body, replacing each reference to a formal
    parameter with a `Param` node. Returns a PExpr -- either a new one, or the original one if
    it was modified in place.
  */
  PExpr.prototype.introduceParams = abstract('introduceParams');

  any.introduceParams =
    end.introduceParams =
    Terminal.prototype.introduceParams =
    Range.prototype.introduceParams =
    Param.prototype.introduceParams =
    UnicodeChar.prototype.introduceParams =
      function(formals) {
        return this;
      };

  Alt.prototype.introduceParams = function(formals) {
    this.terms.forEach((term, idx, terms) => {
      terms[idx] = term.introduceParams(formals);
    });
    return this;
  };

  Seq.prototype.introduceParams = function(formals) {
    this.factors.forEach((factor, idx, factors) => {
      factors[idx] = factor.introduceParams(formals);
    });
    return this;
  };

  Iter.prototype.introduceParams =
    Not.prototype.introduceParams =
    Lookahead.prototype.introduceParams =
    Lex.prototype.introduceParams =
      function(formals) {
        this.expr = this.expr.introduceParams(formals);
        return this;
      };

  Apply.prototype.introduceParams = function(formals) {
    const index = formals.indexOf(this.ruleName);
    if (index >= 0) {
      if (this.args.length > 0) {
        // TODO: Should this be supported? See issue #64.
        throw new Error('Parameterized rules cannot be passed as arguments to another rule.');
      }
      return new Param(index).withSource(this.source);
    } else {
      this.args.forEach((arg, idx, args) => {
        args[idx] = arg.introduceParams(formals);
      });
      return this;
    }
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  // Returns `true` if this parsing expression may accept without consuming any input.
  PExpr.prototype.isNullable = function(grammar) {
    return this._isNullable(grammar, Object.create(null));
  };

  PExpr.prototype._isNullable = abstract('_isNullable');

  any._isNullable =
    Range.prototype._isNullable =
    Param.prototype._isNullable =
    Plus.prototype._isNullable =
    UnicodeChar.prototype._isNullable =
      function(grammar, memo) {
        return false;
      };

  end._isNullable = function(grammar, memo) {
    return true;
  };

  Terminal.prototype._isNullable = function(grammar, memo) {
    if (typeof this.obj === 'string') {
      // This is an over-simplification: it's only correct if the input is a string. If it's an array
      // or an object, then the empty string parsing expression is not nullable.
      return this.obj === '';
    } else {
      return false;
    }
  };

  Alt.prototype._isNullable = function(grammar, memo) {
    return this.terms.length === 0 || this.terms.some(term => term._isNullable(grammar, memo));
  };

  Seq.prototype._isNullable = function(grammar, memo) {
    return this.factors.every(factor => factor._isNullable(grammar, memo));
  };

  Star.prototype._isNullable =
    Opt.prototype._isNullable =
    Not.prototype._isNullable =
    Lookahead.prototype._isNullable =
      function(grammar, memo) {
        return true;
      };

  Lex.prototype._isNullable = function(grammar, memo) {
    return this.expr._isNullable(grammar, memo);
  };

  Apply.prototype._isNullable = function(grammar, memo) {
    const key = this.toMemoKey();
    if (!Object.prototype.hasOwnProperty.call(memo, key)) {
      const {body} = grammar.rules[this.ruleName];
      const inlined = body.substituteParams(this.args);
      memo[key] = false; // Prevent infinite recursion for recursive rules.
      memo[key] = inlined._isNullable(grammar, memo);
    }
    return memo[key];
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Returns a PExpr that results from recursively replacing every formal parameter (i.e., instance
    of `Param`) inside this PExpr with its actual value from `actuals` (an Array).

    The receiver must not be modified; a new PExpr must be returned if any replacement is necessary.
  */
  // function(actuals) { ... }
  PExpr.prototype.substituteParams = abstract('substituteParams');

  any.substituteParams =
    end.substituteParams =
    Terminal.prototype.substituteParams =
    Range.prototype.substituteParams =
    UnicodeChar.prototype.substituteParams =
      function(actuals) {
        return this;
      };

  Param.prototype.substituteParams = function(actuals) {
    return checkNotNull(actuals[this.index]);
  };

  Alt.prototype.substituteParams = function(actuals) {
    return new Alt(this.terms.map(term => term.substituteParams(actuals)));
  };

  Seq.prototype.substituteParams = function(actuals) {
    return new Seq(this.factors.map(factor => factor.substituteParams(actuals)));
  };

  Iter.prototype.substituteParams =
    Not.prototype.substituteParams =
    Lookahead.prototype.substituteParams =
    Lex.prototype.substituteParams =
      function(actuals) {
        return new this.constructor(this.expr.substituteParams(actuals));
      };

  Apply.prototype.substituteParams = function(actuals) {
    if (this.args.length === 0) {
      // Avoid making a copy of this application, as an optimization
      return this;
    } else {
      const args = this.args.map(arg => arg.substituteParams(actuals));
      return new Apply(this.ruleName, args);
    }
  };

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  function isRestrictedJSIdentifier(str) {
    return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(str);
  }

  function resolveDuplicatedNames(argumentNameList) {
    // `count` is used to record the number of times each argument name occurs in the list,
    // this is useful for checking duplicated argument name. It maps argument names to ints.
    const count = Object.create(null);
    argumentNameList.forEach(argName => {
      count[argName] = (count[argName] || 0) + 1;
    });

    // Append subscripts ('_1', '_2', ...) to duplicate argument names.
    Object.keys(count).forEach(dupArgName => {
      if (count[dupArgName] <= 1) {
        return;
      }

      // This name shows up more than once, so add subscripts.
      let subscript = 1;
      argumentNameList.forEach((argName, idx) => {
        if (argName === dupArgName) {
          argumentNameList[idx] = argName + '_' + subscript++;
        }
      });
    });
  }

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    Returns a list of strings that will be used as the default argument names for its receiver
    (a pexpr) in a semantic action. This is used exclusively by the Semantics Editor.

    `firstArgIndex` is the 1-based index of the first argument name that will be generated for this
    pexpr. It enables us to name arguments positionally, e.g., if the second argument is a
    non-alphanumeric terminal like "+", it will be named '$2'.

    `noDupCheck` is true if the caller of `toArgumentNameList` is not a top level caller. It enables
    us to avoid nested duplication subscripts appending, e.g., '_1_1', '_1_2', by only checking
    duplicates at the top level.

    Here is a more elaborate example that illustrates how this method works:
    `(a "+" b).toArgumentNameList(1)` evaluates to `['a', '$2', 'b']` with the following recursive
    calls:

      (a).toArgumentNameList(1) -> ['a'],
      ("+").toArgumentNameList(2) -> ['$2'],
      (b).toArgumentNameList(3) -> ['b']

    Notes:
    * This method must only be called on well-formed expressions, e.g., the receiver must
      not have any Alt sub-expressions with inconsistent arities.
    * e.getArity() === e.toArgumentNameList(1).length
  */
  // function(firstArgIndex, noDupCheck) { ... }
  PExpr.prototype.toArgumentNameList = abstract('toArgumentNameList');

  any.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['any'];
  };

  end.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['end'];
  };

  Terminal.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    if (typeof this.obj === 'string' && /^[_a-zA-Z0-9]+$/.test(this.obj)) {
      // If this terminal is a valid suffix for a JS identifier, just prepend it with '_'
      return ['_' + this.obj];
    } else {
      // Otherwise, name it positionally.
      return ['$' + firstArgIndex];
    }
  };

  Range.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    let argName = this.from + '_to_' + this.to;
    // If the `argName` is not valid then try to prepend a `_`.
    if (!isRestrictedJSIdentifier(argName)) {
      argName = '_' + argName;
    }
    // If the `argName` still not valid after prepending a `_`, then name it positionally.
    if (!isRestrictedJSIdentifier(argName)) {
      argName = '$' + firstArgIndex;
    }
    return [argName];
  };

  Alt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    // `termArgNameLists` is an array of arrays where each row is the
    // argument name list that corresponds to a term in this alternation.
    const termArgNameLists = this.terms.map(term =>
      term.toArgumentNameList(firstArgIndex, true),
    );

    const argumentNameList = [];
    const numArgs = termArgNameLists[0].length;
    for (let colIdx = 0; colIdx < numArgs; colIdx++) {
      const col = [];
      for (let rowIdx = 0; rowIdx < this.terms.length; rowIdx++) {
        col.push(termArgNameLists[rowIdx][colIdx]);
      }
      const uniqueNames = copyWithoutDuplicates(col);
      argumentNameList.push(uniqueNames.join('_or_'));
    }

    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };

  Seq.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    // Generate the argument name list, without worrying about duplicates.
    let argumentNameList = [];
    this.factors.forEach(factor => {
      const factorArgumentNameList = factor.toArgumentNameList(firstArgIndex, true);
      argumentNameList = argumentNameList.concat(factorArgumentNameList);

      // Shift the firstArgIndex to take this factor's argument names into account.
      firstArgIndex += factorArgumentNameList.length;
    });
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };

  Iter.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    const argumentNameList = this.expr
        .toArgumentNameList(firstArgIndex, noDupCheck)
        .map(exprArgumentString =>
        exprArgumentString[exprArgumentString.length - 1] === 's' ?
          exprArgumentString + 'es' :
          exprArgumentString + 's',
        );
    if (!noDupCheck) {
      resolveDuplicatedNames(argumentNameList);
    }
    return argumentNameList;
  };

  Opt.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return this.expr.toArgumentNameList(firstArgIndex, noDupCheck).map(argName => {
      return 'opt' + argName[0].toUpperCase() + argName.slice(1);
    });
  };

  Not.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return [];
  };

  Lookahead.prototype.toArgumentNameList = Lex.prototype.toArgumentNameList =
    function(firstArgIndex, noDupCheck) {
      return this.expr.toArgumentNameList(firstArgIndex, noDupCheck);
    };

  Apply.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return [this.ruleName];
  };

  UnicodeChar.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['$' + firstArgIndex];
  };

  Param.prototype.toArgumentNameList = function(firstArgIndex, noDupCheck) {
    return ['param' + this.index];
  };

  // "Value pexprs" (Value, Str, Arr, Obj) are going away soon, so we don't worry about them here.

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  // Returns a string representing the PExpr, for use as a UI label, etc.
  PExpr.prototype.toDisplayString = abstract('toDisplayString');

  Alt.prototype.toDisplayString = Seq.prototype.toDisplayString = function() {
    if (this.source) {
      return this.source.trimmed().contents;
    }
    return '[' + this.constructor.name + ']';
  };

  any.toDisplayString =
    end.toDisplayString =
    Iter.prototype.toDisplayString =
    Not.prototype.toDisplayString =
    Lookahead.prototype.toDisplayString =
    Lex.prototype.toDisplayString =
    Terminal.prototype.toDisplayString =
    Range.prototype.toDisplayString =
    Param.prototype.toDisplayString =
      function() {
        return this.toString();
      };

  Apply.prototype.toDisplayString = function() {
    if (this.args.length > 0) {
      const ps = this.args.map(arg => arg.toDisplayString());
      return this.ruleName + '<' + ps.join(',') + '>';
    } else {
      return this.ruleName;
    }
  };

  UnicodeChar.prototype.toDisplayString = function() {
    return 'Unicode [' + this.category + '] character';
  };

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  /*
    `Failure`s represent expressions that weren't matched while parsing. They are used to generate
    error messages automatically. The interface of `Failure`s includes the collowing methods:

    - getText() : String
    - getType() : String  (one of {"description", "string", "code"})
    - isDescription() : bool
    - isStringTerminal() : bool
    - isCode() : bool
    - isFluffy() : bool
    - makeFluffy() : void
    - subsumes(Failure) : bool
  */

  function isValidType(type) {
    return type === 'description' || type === 'string' || type === 'code';
  }

  class Failure {
    constructor(pexpr, text, type) {
      if (!isValidType(type)) {
        throw new Error('invalid Failure type: ' + type);
      }
      this.pexpr = pexpr;
      this.text = text;
      this.type = type;
      this.fluffy = false;
    }

    getPExpr() {
      return this.pexpr;
    }

    getText() {
      return this.text;
    }

    getType() {
      return this.type;
    }

    isDescription() {
      return this.type === 'description';
    }

    isStringTerminal() {
      return this.type === 'string';
    }

    isCode() {
      return this.type === 'code';
    }

    isFluffy() {
      return this.fluffy;
    }

    makeFluffy() {
      this.fluffy = true;
    }

    clearFluffy() {
      this.fluffy = false;
    }

    subsumes(that) {
      return (
        this.getText() === that.getText() &&
        this.type === that.type &&
        (!this.isFluffy() || (this.isFluffy() && that.isFluffy()))
      );
    }

    toString() {
      return this.type === 'string' ? JSON.stringify(this.getText()) : this.getText();
    }

    clone() {
      const failure = new Failure(this.pexpr, this.text, this.type);
      if (this.isFluffy()) {
        failure.makeFluffy();
      }
      return failure;
    }

    toKey() {
      return this.toString() + '#' + this.type;
    }
  }

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  PExpr.prototype.toFailure = abstract('toFailure');

  any.toFailure = function(grammar) {
    return new Failure(this, 'any object', 'description');
  };

  end.toFailure = function(grammar) {
    return new Failure(this, 'end of input', 'description');
  };

  Terminal.prototype.toFailure = function(grammar) {
    return new Failure(this, this.obj, 'string');
  };

  Range.prototype.toFailure = function(grammar) {
    // TODO: come up with something better
    return new Failure(this, JSON.stringify(this.from) + '..' + JSON.stringify(this.to), 'code');
  };

  Not.prototype.toFailure = function(grammar) {
    const description =
      this.expr === any ? 'nothing' : 'not ' + this.expr.toFailure(grammar);
    return new Failure(this, description, 'description');
  };

  Lookahead.prototype.toFailure = function(grammar) {
    return this.expr.toFailure(grammar);
  };

  Apply.prototype.toFailure = function(grammar) {
    let {description} = grammar.rules[this.ruleName];
    if (!description) {
      const article = /^[aeiouAEIOU]/.test(this.ruleName) ? 'an' : 'a';
      description = article + ' ' + this.ruleName;
    }
    return new Failure(this, description, 'description');
  };

  UnicodeChar.prototype.toFailure = function(grammar) {
    return new Failure(this, 'a Unicode [' + this.category + '] character', 'description');
  };

  Alt.prototype.toFailure = function(grammar) {
    const fs = this.terms.map(t => t.toFailure(grammar));
    const description = '(' + fs.join(' or ') + ')';
    return new Failure(this, description, 'description');
  };

  Seq.prototype.toFailure = function(grammar) {
    const fs = this.factors.map(f => f.toFailure(grammar));
    const description = '(' + fs.join(' ') + ')';
    return new Failure(this, description, 'description');
  };

  Iter.prototype.toFailure = function(grammar) {
    const description = '(' + this.expr.toFailure(grammar) + this.operator + ')';
    return new Failure(this, description, 'description');
  };

  // --------------------------------------------------------------------
  // Operations
  // --------------------------------------------------------------------

  /*
    e1.toString() === e2.toString() ==> e1 and e2 are semantically equivalent.
    Note that this is not an iff (<==>): e.g.,
    (~"b" "a").toString() !== ("a").toString(), even though
    ~"b" "a" and "a" are interchangeable in any grammar,
    both in terms of the languages they accept and their arities.
  */
  PExpr.prototype.toString = abstract('toString');

  any.toString = function() {
    return 'any';
  };

  end.toString = function() {
    return 'end';
  };

  Terminal.prototype.toString = function() {
    return JSON.stringify(this.obj);
  };

  Range.prototype.toString = function() {
    return JSON.stringify(this.from) + '..' + JSON.stringify(this.to);
  };

  Param.prototype.toString = function() {
    return '$' + this.index;
  };

  Lex.prototype.toString = function() {
    return '#(' + this.expr.toString() + ')';
  };

  Alt.prototype.toString = function() {
    return this.terms.length === 1 ?
      this.terms[0].toString() :
      '(' + this.terms.map(term => term.toString()).join(' | ') + ')';
  };

  Seq.prototype.toString = function() {
    return this.factors.length === 1 ?
      this.factors[0].toString() :
      '(' + this.factors.map(factor => factor.toString()).join(' ') + ')';
  };

  Iter.prototype.toString = function() {
    return this.expr + this.operator;
  };

  Not.prototype.toString = function() {
    return '~' + this.expr;
  };

  Lookahead.prototype.toString = function() {
    return '&' + this.expr;
  };

  Apply.prototype.toString = function() {
    if (this.args.length > 0) {
      const ps = this.args.map(arg => arg.toString());
      return this.ruleName + '<' + ps.join(',') + '>';
    } else {
      return this.ruleName;
    }
  };

  UnicodeChar.prototype.toString = function() {
    return '\\p{' + this.category + '}';
  };

  class CaseInsensitiveTerminal extends PExpr {
    constructor(param) {
      super();
      this.obj = param;
    }

    _getString(state) {
      const terminal = state.currentApplication().args[this.obj.index];
      assert(terminal instanceof Terminal, 'expected a Terminal expression');
      return terminal.obj;
    }

    // Implementation of the PExpr API

    allowsSkippingPrecedingSpace() {
      return true;
    }

    eval(state) {
      const {inputStream} = state;
      const origPos = inputStream.pos;
      const matchStr = this._getString(state);
      if (!inputStream.matchString(matchStr, true)) {
        state.processFailure(origPos, this);
        return false;
      } else {
        state.pushBinding(new TerminalNode(matchStr.length), origPos);
        return true;
      }
    }

    getArity() {
      return 1;
    }

    substituteParams(actuals) {
      return new CaseInsensitiveTerminal(this.obj.substituteParams(actuals));
    }

    toDisplayString() {
      return this.obj.toDisplayString() + ' (case-insensitive)';
    }

    toFailure(grammar) {
      return new Failure(
          this,
          this.obj.toFailure(grammar) + ' (case-insensitive)',
          'description',
      );
    }

    _isNullable(grammar, memo) {
      return this.obj._isNullable(grammar, memo);
    }
  }

  // --------------------------------------------------------------------

  var pexprs = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CaseInsensitiveTerminal: CaseInsensitiveTerminal,
    PExpr: PExpr,
    any: any,
    end: end,
    Terminal: Terminal,
    Range: Range,
    Param: Param,
    Alt: Alt,
    Extend: Extend,
    Splice: Splice,
    Seq: Seq,
    Iter: Iter,
    Star: Star,
    Plus: Plus,
    Opt: Opt,
    Not: Not,
    Lookahead: Lookahead,
    Lex: Lex,
    Apply: Apply,
    UnicodeChar: UnicodeChar
  });

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  let builtInApplySyntacticBody;

  awaitBuiltInRules(builtInRules => {
    builtInApplySyntacticBody = builtInRules.rules.applySyntactic.body;
  });

  const applySpaces = new Apply('spaces');

  class MatchState {
    constructor(matcher, startExpr, optPositionToRecordFailures) {
      this.matcher = matcher;
      this.startExpr = startExpr;

      this.grammar = matcher.grammar;
      this.input = matcher.getInput();
      this.inputStream = new InputStream(this.input);
      this.memoTable = matcher._memoTable;

      this.userData = undefined;
      this.doNotMemoize = false;

      this._bindings = [];
      this._bindingOffsets = [];
      this._applicationStack = [];
      this._posStack = [0];
      this.inLexifiedContextStack = [false];

      this.rightmostFailurePosition = -1;
      this._rightmostFailurePositionStack = [];
      this._recordedFailuresStack = [];

      if (optPositionToRecordFailures !== undefined) {
        this.positionToRecordFailures = optPositionToRecordFailures;
        this.recordedFailures = Object.create(null);
      }
    }

    posToOffset(pos) {
      return pos - this._posStack[this._posStack.length - 1];
    }

    enterApplication(posInfo, app) {
      this._posStack.push(this.inputStream.pos);
      this._applicationStack.push(app);
      this.inLexifiedContextStack.push(false);
      posInfo.enter(app);
      this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
      this.rightmostFailurePosition = -1;
    }

    exitApplication(posInfo, optNode) {
      const origPos = this._posStack.pop();
      this._applicationStack.pop();
      this.inLexifiedContextStack.pop();
      posInfo.exit();

      this.rightmostFailurePosition = Math.max(
          this.rightmostFailurePosition,
          this._rightmostFailurePositionStack.pop(),
      );

      if (optNode) {
        this.pushBinding(optNode, origPos);
      }
    }

    enterLexifiedContext() {
      this.inLexifiedContextStack.push(true);
    }

    exitLexifiedContext() {
      this.inLexifiedContextStack.pop();
    }

    currentApplication() {
      return this._applicationStack[this._applicationStack.length - 1];
    }

    inSyntacticContext() {
      const currentApplication = this.currentApplication();
      if (currentApplication) {
        return currentApplication.isSyntactic() && !this.inLexifiedContext();
      } else {
        // The top-level context is syntactic if the start application is.
        return this.startExpr.factors[0].isSyntactic();
      }
    }

    inLexifiedContext() {
      return this.inLexifiedContextStack[this.inLexifiedContextStack.length - 1];
    }

    skipSpaces() {
      this.pushFailuresInfo();
      this.eval(applySpaces);
      this.popBinding();
      this.popFailuresInfo();
      return this.inputStream.pos;
    }

    skipSpacesIfInSyntacticContext() {
      return this.inSyntacticContext() ? this.skipSpaces() : this.inputStream.pos;
    }

    maybeSkipSpacesBefore(expr) {
      if (expr.allowsSkippingPrecedingSpace() && expr !== applySpaces) {
        return this.skipSpacesIfInSyntacticContext();
      } else {
        return this.inputStream.pos;
      }
    }

    pushBinding(node, origPos) {
      this._bindings.push(node);
      this._bindingOffsets.push(this.posToOffset(origPos));
    }

    popBinding() {
      this._bindings.pop();
      this._bindingOffsets.pop();
    }

    numBindings() {
      return this._bindings.length;
    }

    truncateBindings(newLength) {
      // Yes, this is this really faster than setting the `length` property (tested with
      // bin/es5bench on Node v6.1.0).
      // Update 2021-10-25: still true on v14.15.5 — it's ~20% speedup on es5bench.
      while (this._bindings.length > newLength) {
        this.popBinding();
      }
    }

    getCurrentPosInfo() {
      return this.getPosInfo(this.inputStream.pos);
    }

    getPosInfo(pos) {
      let posInfo = this.memoTable[pos];
      if (!posInfo) {
        posInfo = this.memoTable[pos] = new PosInfo();
      }
      return posInfo;
    }

    processFailure(pos, expr) {
      this.rightmostFailurePosition = Math.max(this.rightmostFailurePosition, pos);

      if (this.recordedFailures && pos === this.positionToRecordFailures) {
        const app = this.currentApplication();
        if (app) {
          // Substitute parameters with the actual pexprs that were passed to
          // the current rule.
          expr = expr.substituteParams(app.args);
        }

        this.recordFailure(expr.toFailure(this.grammar), false);
      }
    }

    recordFailure(failure, shouldCloneIfNew) {
      const key = failure.toKey();
      if (!this.recordedFailures[key]) {
        this.recordedFailures[key] = shouldCloneIfNew ? failure.clone() : failure;
      } else if (this.recordedFailures[key].isFluffy() && !failure.isFluffy()) {
        this.recordedFailures[key].clearFluffy();
      }
    }

    recordFailures(failures, shouldCloneIfNew) {
      Object.keys(failures).forEach(key => {
        this.recordFailure(failures[key], shouldCloneIfNew);
      });
    }

    cloneRecordedFailures() {
      if (!this.recordedFailures) {
        return undefined;
      }

      const ans = Object.create(null);
      Object.keys(this.recordedFailures).forEach(key => {
        ans[key] = this.recordedFailures[key].clone();
      });
      return ans;
    }

    getRightmostFailurePosition() {
      return this.rightmostFailurePosition;
    }

    _getRightmostFailureOffset() {
      return this.rightmostFailurePosition >= 0 ?
        this.posToOffset(this.rightmostFailurePosition) :
        -1;
    }

    // Returns the memoized trace entry for `expr` at `pos`, if one exists, `null` otherwise.
    getMemoizedTraceEntry(pos, expr) {
      const posInfo = this.memoTable[pos];
      if (posInfo && expr instanceof Apply) {
        const memoRec = posInfo.memo[expr.toMemoKey()];
        if (memoRec && memoRec.traceEntry) {
          const entry = memoRec.traceEntry.cloneWithExpr(expr);
          entry.isMemoized = true;
          return entry;
        }
      }
      return null;
    }

    // Returns a new trace entry, with the currently active trace array as its children.
    getTraceEntry(pos, expr, succeeded, bindings) {
      if (expr instanceof Apply) {
        const app = this.currentApplication();
        const actuals = app ? app.args : [];
        expr = expr.substituteParams(actuals);
      }
      return (
        this.getMemoizedTraceEntry(pos, expr) ||
        new Trace(this.input, pos, this.inputStream.pos, expr, succeeded, bindings, this.trace)
      );
    }

    isTracing() {
      return !!this.trace;
    }

    hasNecessaryInfo(memoRec) {
      if (this.trace && !memoRec.traceEntry) {
        return false;
      }

      if (
        this.recordedFailures &&
        this.inputStream.pos + memoRec.rightmostFailureOffset === this.positionToRecordFailures
      ) {
        return !!memoRec.failuresAtRightmostPosition;
      }

      return true;
    }

    useMemoizedResult(origPos, memoRec) {
      if (this.trace) {
        this.trace.push(memoRec.traceEntry);
      }

      const memoRecRightmostFailurePosition =
        this.inputStream.pos + memoRec.rightmostFailureOffset;
      this.rightmostFailurePosition = Math.max(
          this.rightmostFailurePosition,
          memoRecRightmostFailurePosition,
      );
      if (
        this.recordedFailures &&
        this.positionToRecordFailures === memoRecRightmostFailurePosition &&
        memoRec.failuresAtRightmostPosition
      ) {
        this.recordFailures(memoRec.failuresAtRightmostPosition, true);
      }

      this.inputStream.examinedLength = Math.max(
          this.inputStream.examinedLength,
          memoRec.examinedLength + origPos,
      );

      if (memoRec.value) {
        this.inputStream.pos += memoRec.matchLength;
        this.pushBinding(memoRec.value, origPos);
        return true;
      }
      return false;
    }

    // Evaluate `expr` and return `true` if it succeeded, `false` otherwise. On success, `bindings`
    // will have `expr.getArity()` more elements than before, and the input stream's position may
    // have increased. On failure, `bindings` and position will be unchanged.
    eval(expr) {
      const {inputStream} = this;
      const origNumBindings = this._bindings.length;
      const origUserData = this.userData;

      let origRecordedFailures;
      if (this.recordedFailures) {
        origRecordedFailures = this.recordedFailures;
        this.recordedFailures = Object.create(null);
      }

      const origPos = inputStream.pos;
      const memoPos = this.maybeSkipSpacesBefore(expr);

      let origTrace;
      if (this.trace) {
        origTrace = this.trace;
        this.trace = [];
      }

      // Do the actual evaluation.
      const ans = expr.eval(this);

      if (this.trace) {
        const bindings = this._bindings.slice(origNumBindings);
        const traceEntry = this.getTraceEntry(memoPos, expr, ans, bindings);
        traceEntry.isImplicitSpaces = expr === applySpaces;
        traceEntry.isRootNode = expr === this.startExpr;
        origTrace.push(traceEntry);
        this.trace = origTrace;
      }

      if (ans) {
        if (this.recordedFailures && inputStream.pos === this.positionToRecordFailures) {
          Object.keys(this.recordedFailures).forEach(key => {
            this.recordedFailures[key].makeFluffy();
          });
        }
      } else {
        // Reset the position, bindings, and userData.
        inputStream.pos = origPos;
        this.truncateBindings(origNumBindings);
        this.userData = origUserData;
      }

      if (this.recordedFailures) {
        this.recordFailures(origRecordedFailures, false);
      }

      // The built-in applySyntactic rule needs special handling: we want to skip
      // trailing spaces, just as with the top-level application of a syntactic rule.
      if (expr === builtInApplySyntacticBody) {
        this.skipSpaces();
      }

      return ans;
    }

    getMatchResult() {
      this.grammar._setUpMatchState(this);
      this.eval(this.startExpr);
      let rightmostFailures;
      if (this.recordedFailures) {
        rightmostFailures = Object.keys(this.recordedFailures).map(
            key => this.recordedFailures[key],
        );
      }
      const cst = this._bindings[0];
      if (cst) {
        cst.grammar = this.grammar;
      }
      return new MatchResult(
          this.matcher,
          this.input,
          this.startExpr,
          cst,
          this._bindingOffsets[0],
          this.rightmostFailurePosition,
          rightmostFailures,
      );
    }

    getTrace() {
      this.trace = [];
      const matchResult = this.getMatchResult();

      // The trace node for the start rule is always the last entry. If it is a syntactic rule,
      // the first entry is for an application of 'spaces'.
      // TODO(pdubroy): Clean this up by introducing a special `Match<startAppl>` rule, which will
      // ensure that there is always a single root trace node.
      const rootTrace = this.trace[this.trace.length - 1];
      rootTrace.result = matchResult;
      return rootTrace;
    }

    pushFailuresInfo() {
      this._rightmostFailurePositionStack.push(this.rightmostFailurePosition);
      this._recordedFailuresStack.push(this.recordedFailures);
    }

    popFailuresInfo() {
      this.rightmostFailurePosition = this._rightmostFailurePositionStack.pop();
      this.recordedFailures = this._recordedFailuresStack.pop();
    }
  }

  class Matcher {
    constructor(grammar) {
      this.grammar = grammar;
      this._memoTable = [];
      this._input = '';
      this._isMemoTableStale = false;
    }

    _resetMemoTable() {
      this._memoTable = [];
      this._isMemoTableStale = false;
    }

    getInput() {
      return this._input;
    }

    setInput(str) {
      if (this._input !== str) {
        this.replaceInputRange(0, this._input.length, str);
      }
      return this;
    }

    replaceInputRange(startIdx, endIdx, str) {
      const prevInput = this._input;
      const memoTable = this._memoTable;
      if (
        startIdx < 0 ||
        startIdx > prevInput.length ||
        endIdx < 0 ||
        endIdx > prevInput.length ||
        startIdx > endIdx
      ) {
        throw new Error('Invalid indices: ' + startIdx + ' and ' + endIdx);
      }

      // update input
      this._input = prevInput.slice(0, startIdx) + str + prevInput.slice(endIdx);
      if (this._input !== prevInput && memoTable.length > 0) {
        this._isMemoTableStale = true;
      }

      // update memo table (similar to the above)
      const restOfMemoTable = memoTable.slice(endIdx);
      memoTable.length = startIdx;
      for (let idx = 0; idx < str.length; idx++) {
        memoTable.push(undefined);
      }
      for (const posInfo of restOfMemoTable) {
        memoTable.push(posInfo);
      }

      // Invalidate memoRecs
      for (let pos = 0; pos < startIdx; pos++) {
        const posInfo = memoTable[pos];
        if (posInfo) {
          posInfo.clearObsoleteEntries(pos, startIdx);
        }
      }

      return this;
    }

    match(optStartApplicationStr, options = {incremental: true}) {
      return this._match(this._getStartExpr(optStartApplicationStr), {
        incremental: options.incremental,
        tracing: false,
      });
    }

    trace(optStartApplicationStr, options = {incremental: true}) {
      return this._match(this._getStartExpr(optStartApplicationStr), {
        incremental: options.incremental,
        tracing: true,
      });
    }

    _match(startExpr, options = {}) {
      const opts = {
        tracing: false,
        incremental: true,
        positionToRecordFailures: undefined,
        ...options,
      };
      if (!opts.incremental) {
        this._resetMemoTable();
      } else if (this._isMemoTableStale && !this.grammar.supportsIncrementalParsing) {
        throw grammarDoesNotSupportIncrementalParsing(this.grammar);
      }

      const state = new MatchState(this, startExpr, opts.positionToRecordFailures);
      return opts.tracing ? state.getTrace() : state.getMatchResult();
    }

    /*
      Returns the starting expression for this Matcher's associated grammar. If
      `optStartApplicationStr` is specified, it is a string expressing a rule application in the
      grammar. If not specified, the grammar's default start rule will be used.
    */
    _getStartExpr(optStartApplicationStr) {
      const applicationStr = optStartApplicationStr || this.grammar.defaultStartRule;
      if (!applicationStr) {
        throw new Error('Missing start rule argument -- the grammar has no default start rule.');
      }

      const startApp = this.grammar.parseApplication(applicationStr);
      return new Seq([startApp, end]);
    }
  }

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  const globalActionStack = [];

  const hasOwnProperty = (x, prop) => Object.prototype.hasOwnProperty.call(x, prop);

  // ----------------- Wrappers -----------------

  // Wrappers decorate CST nodes with all of the functionality (i.e., operations and attributes)
  // provided by a Semantics (see below). `Wrapper` is the abstract superclass of all wrappers. A
  // `Wrapper` must have `_node` and `_semantics` instance variables, which refer to the CST node and
  // Semantics (resp.) for which it was created, and a `_childWrappers` instance variable which is
  // used to cache the wrapper instances that are created for its child nodes. Setting these instance
  // variables is the responsibility of the constructor of each Semantics-specific subclass of
  // `Wrapper`.
  class Wrapper {
    constructor(node, sourceInterval, baseInterval) {
      this._node = node;
      this.source = sourceInterval;

      // The interval that the childOffsets of `node` are relative to. It should be the source
      // of the closest Nonterminal node.
      this._baseInterval = baseInterval;

      if (node.isNonterminal()) {
        assert(sourceInterval === baseInterval);
      }
      this._childWrappers = [];
    }

    _forgetMemoizedResultFor(attributeName) {
      // Remove the memoized attribute from the cstNode and all its children.
      delete this._node[this._semantics.attributeKeys[attributeName]];
      this.children.forEach(child => {
        child._forgetMemoizedResultFor(attributeName);
      });
    }

    // Returns the wrapper of the specified child node. Child wrappers are created lazily and
    // cached in the parent wrapper's `_childWrappers` instance variable.
    child(idx) {
      if (!(0 <= idx && idx < this._node.numChildren())) {
        // TODO: Consider throwing an exception here.
        return undefined;
      }
      let childWrapper = this._childWrappers[idx];
      if (!childWrapper) {
        const childNode = this._node.childAt(idx);
        const offset = this._node.childOffsets[idx];

        const source = this._baseInterval.subInterval(offset, childNode.matchLength);
        const base = childNode.isNonterminal() ? source : this._baseInterval;
        childWrapper = this._childWrappers[idx] = this._semantics.wrap(childNode, source, base);
      }
      return childWrapper;
    }

    // Returns an array containing the wrappers of all of the children of the node associated
    // with this wrapper.
    _children() {
      // Force the creation of all child wrappers
      for (let idx = 0; idx < this._node.numChildren(); idx++) {
        this.child(idx);
      }
      return this._childWrappers;
    }

    // Returns `true` if the CST node associated with this wrapper corresponds to an iteration
    // expression, i.e., a Kleene-*, Kleene-+, or an optional. Returns `false` otherwise.
    isIteration() {
      return this._node.isIteration();
    }

    // Returns `true` if the CST node associated with this wrapper is a terminal node, `false`
    // otherwise.
    isTerminal() {
      return this._node.isTerminal();
    }

    // Returns `true` if the CST node associated with this wrapper is a nonterminal node, `false`
    // otherwise.
    isNonterminal() {
      return this._node.isNonterminal();
    }

    // Returns `true` if the CST node associated with this wrapper is a nonterminal node
    // corresponding to a syntactic rule, `false` otherwise.
    isSyntactic() {
      return this.isNonterminal() && this._node.isSyntactic();
    }

    // Returns `true` if the CST node associated with this wrapper is a nonterminal node
    // corresponding to a lexical rule, `false` otherwise.
    isLexical() {
      return this.isNonterminal() && this._node.isLexical();
    }

    // Returns `true` if the CST node associated with this wrapper is an iterator node
    // having either one or no child (? operator), `false` otherwise.
    // Otherwise, throws an exception.
    isOptional() {
      return this._node.isOptional();
    }

    // Create a new _iter wrapper in the same semantics as this wrapper.
    iteration(optChildWrappers) {
      const childWrappers = optChildWrappers || [];

      const childNodes = childWrappers.map(c => c._node);
      const iter = new IterationNode(childNodes, [], -1, false);

      const wrapper = this._semantics.wrap(iter, null, null);
      wrapper._childWrappers = childWrappers;
      return wrapper;
    }

    // Returns an array containing the children of this CST node.
    get children() {
      return this._children();
    }

    // Returns the name of grammar rule that created this CST node.
    get ctorName() {
      return this._node.ctorName;
    }

    // Returns the number of children of this CST node.
    get numChildren() {
      return this._node.numChildren();
    }

    // Returns the contents of the input stream consumed by this CST node.
    get sourceString() {
      return this.source.contents;
    }
  }

  // ----------------- Semantics -----------------

  // A Semantics is a container for a family of Operations and Attributes for a given grammar.
  // Semantics enable modularity (different clients of a grammar can create their set of operations
  // and attributes in isolation) and extensibility even when operations and attributes are mutually-
  // recursive. This constructor should not be called directly except from
  // `Semantics.createSemantics`. The normal ways to create a Semantics, given a grammar 'g', are
  // `g.createSemantics()` and `g.extendSemantics(parentSemantics)`.
  class Semantics {
    constructor(grammar, superSemantics) {
      const self = this;
      this.grammar = grammar;
      this.checkedActionDicts = false;

      // Constructor for wrapper instances, which are passed as the arguments to the semantic actions
      // of an operation or attribute. Operations and attributes require double dispatch: the semantic
      // action is chosen based on both the node's type and the semantics. Wrappers ensure that
      // the `execute` method is called with the correct (most specific) semantics object as an
      // argument.
      this.Wrapper = class extends (superSemantics ? superSemantics.Wrapper : Wrapper) {
        constructor(node, sourceInterval, baseInterval) {
          super(node, sourceInterval, baseInterval);
          self.checkActionDictsIfHaventAlready();
          this._semantics = self;
        }

        toString() {
          return '[semantics wrapper for ' + self.grammar.name + ']';
        }
      };

      this.super = superSemantics;
      if (superSemantics) {
        if (!(grammar.equals(this.super.grammar) || grammar._inheritsFrom(this.super.grammar))) {
          throw new Error(
              "Cannot extend a semantics for grammar '" +
              this.super.grammar.name +
              "' for use with grammar '" +
              grammar.name +
              "' (not a sub-grammar)",
          );
        }
        this.operations = Object.create(this.super.operations);
        this.attributes = Object.create(this.super.attributes);
        this.attributeKeys = Object.create(null);

        // Assign unique symbols for each of the attributes inherited from the super-semantics so that
        // they are memoized independently.
        // eslint-disable-next-line guard-for-in
        for (const attributeName in this.attributes) {
          Object.defineProperty(this.attributeKeys, attributeName, {
            value: uniqueId(attributeName),
          });
        }
      } else {
        this.operations = Object.create(null);
        this.attributes = Object.create(null);
        this.attributeKeys = Object.create(null);
      }
    }

    toString() {
      return '[semantics for ' + this.grammar.name + ']';
    }

    checkActionDictsIfHaventAlready() {
      if (!this.checkedActionDicts) {
        this.checkActionDicts();
        this.checkedActionDicts = true;
      }
    }

    // Checks that the action dictionaries for all operations and attributes in this semantics,
    // including the ones that were inherited from the super-semantics, agree with the grammar.
    // Throws an exception if one or more of them doesn't.
    checkActionDicts() {
      let name;
      // eslint-disable-next-line guard-for-in
      for (name in this.operations) {
        this.operations[name].checkActionDict(this.grammar);
      }
      // eslint-disable-next-line guard-for-in
      for (name in this.attributes) {
        this.attributes[name].checkActionDict(this.grammar);
      }
    }

    toRecipe(semanticsOnly) {
      function hasSuperSemantics(s) {
        return s.super !== Semantics.BuiltInSemantics._getSemantics();
      }

      let str = '(function(g) {\n';
      if (hasSuperSemantics(this)) {
        str += '  var semantics = ' + this.super.toRecipe(true) + '(g';

        const superSemanticsGrammar = this.super.grammar;
        let relatedGrammar = this.grammar;
        while (relatedGrammar !== superSemanticsGrammar) {
          str += '.superGrammar';
          relatedGrammar = relatedGrammar.superGrammar;
        }

        str += ');\n';
        str += '  return g.extendSemantics(semantics)';
      } else {
        str += '  return g.createSemantics()';
      }
      ['Operation', 'Attribute'].forEach(type => {
        const semanticOperations = this[type.toLowerCase() + 's'];
        Object.keys(semanticOperations).forEach(name => {
          const {actionDict, formals, builtInDefault} = semanticOperations[name];

          let signature = name;
          if (formals.length > 0) {
            signature += '(' + formals.join(', ') + ')';
          }

          let method;
          if (hasSuperSemantics(this) && this.super[type.toLowerCase() + 's'][name]) {
            method = 'extend' + type;
          } else {
            method = 'add' + type;
          }
          str += '\n    .' + method + '(' + JSON.stringify(signature) + ', {';

          const srcArray = [];
          Object.keys(actionDict).forEach(actionName => {
            if (actionDict[actionName] !== builtInDefault) {
              let source = actionDict[actionName].toString().trim();

              // Convert method shorthand to plain old function syntax.
              // https://github.com/ohmjs/ohm/issues/263
              source = source.replace(/^.*\(/, 'function(');

              srcArray.push('\n      ' + JSON.stringify(actionName) + ': ' + source);
            }
          });
          str += srcArray.join(',') + '\n    })';
        });
      });
      str += ';\n  })';

      if (!semanticsOnly) {
        str =
          '(function() {\n' +
          '  var grammar = this.fromRecipe(' +
          this.grammar.toRecipe() +
          ');\n' +
          '  var semantics = ' +
          str +
          '(grammar);\n' +
          '  return semantics;\n' +
          '});\n';
      }

      return str;
    }

    addOperationOrAttribute(type, signature, actionDict) {
      const typePlural = type + 's';

      const parsedNameAndFormalArgs = parseSignature(signature, type);
      const {name} = parsedNameAndFormalArgs;
      const {formals} = parsedNameAndFormalArgs;

      // TODO: check that there are no duplicate formal arguments

      this.assertNewName(name, type);

      // Create the action dictionary for this operation / attribute that contains a `_default` action
      // which defines the default behavior of iteration, terminal, and non-terminal nodes...
      const builtInDefault = newDefaultAction(type, name, doIt);
      const realActionDict = {_default: builtInDefault};
      // ... and add in the actions supplied by the programmer, which may override some or all of the
      // default ones.
      Object.keys(actionDict).forEach(name => {
        realActionDict[name] = actionDict[name];
      });

      const entry =
        type === 'operation' ?
          new Operation(name, formals, realActionDict, builtInDefault) :
          new Attribute(name, realActionDict, builtInDefault);

      // The following check is not strictly necessary (it will happen later anyway) but it's better
      // to catch errors early.
      entry.checkActionDict(this.grammar);

      this[typePlural][name] = entry;

      function doIt(...args) {
        // Dispatch to most specific version of this operation / attribute -- it may have been
        // overridden by a sub-semantics.
        const thisThing = this._semantics[typePlural][name];

        // Check that the caller passed the correct number of arguments.
        if (arguments.length !== thisThing.formals.length) {
          throw new Error(
              'Invalid number of arguments passed to ' +
              name +
              ' ' +
              type +
              ' (expected ' +
              thisThing.formals.length +
              ', got ' +
              arguments.length +
              ')',
          );
        }

        // Create an "arguments object" from the arguments that were passed to this
        // operation / attribute.
        const argsObj = Object.create(null);
        for (const [idx, val] of Object.entries(args)) {
          const formal = thisThing.formals[idx];
          argsObj[formal] = val;
        }

        const oldArgs = this.args;
        this.args = argsObj;
        const ans = thisThing.execute(this._semantics, this);
        this.args = oldArgs;
        return ans;
      }

      if (type === 'operation') {
        this.Wrapper.prototype[name] = doIt;
        this.Wrapper.prototype[name].toString = function() {
          return '[' + name + ' operation]';
        };
      } else {
        Object.defineProperty(this.Wrapper.prototype, name, {
          get: doIt,
          configurable: true, // So the property can be deleted.
        });
        Object.defineProperty(this.attributeKeys, name, {
          value: uniqueId(name),
        });
      }
    }

    extendOperationOrAttribute(type, name, actionDict) {
      const typePlural = type + 's';

      // Make sure that `name` really is just a name, i.e., that it doesn't also contain formals.
      parseSignature(name, 'attribute');

      if (!(this.super && name in this.super[typePlural])) {
        throw new Error(
            'Cannot extend ' +
            type +
            " '" +
            name +
            "': did not inherit an " +
            type +
            ' with that name',
        );
      }
      if (hasOwnProperty(this[typePlural], name)) {
        throw new Error('Cannot extend ' + type + " '" + name + "' again");
      }

      // Create a new operation / attribute whose actionDict delegates to the super operation /
      // attribute's actionDict, and which has all the keys from `inheritedActionDict`.
      const inheritedFormals = this[typePlural][name].formals;
      const inheritedActionDict = this[typePlural][name].actionDict;
      const newActionDict = Object.create(inheritedActionDict);
      Object.keys(actionDict).forEach(name => {
        newActionDict[name] = actionDict[name];
      });

      this[typePlural][name] =
        type === 'operation' ?
          new Operation(name, inheritedFormals, newActionDict) :
          new Attribute(name, newActionDict);

      // The following check is not strictly necessary (it will happen later anyway) but it's better
      // to catch errors early.
      this[typePlural][name].checkActionDict(this.grammar);
    }

    assertNewName(name, type) {
      if (hasOwnProperty(Wrapper.prototype, name)) {
        throw new Error('Cannot add ' + type + " '" + name + "': that's a reserved name");
      }
      if (name in this.operations) {
        throw new Error(
            'Cannot add ' + type + " '" + name + "': an operation with that name already exists",
        );
      }
      if (name in this.attributes) {
        throw new Error(
            'Cannot add ' + type + " '" + name + "': an attribute with that name already exists",
        );
      }
    }

    // Returns a wrapper for the given CST `node` in this semantics.
    // If `node` is already a wrapper, returns `node` itself.  // TODO: why is this needed?
    wrap(node, source, optBaseInterval) {
      const baseInterval = optBaseInterval || source;
      return node instanceof this.Wrapper ? node : new this.Wrapper(node, source, baseInterval);
    }
  }

  function parseSignature(signature, type) {
    if (!Semantics.prototypeGrammar) {
      // The Operations and Attributes grammar won't be available while Ohm is loading,
      // but we can get away the following simplification b/c none of the operations
      // that are used while loading take arguments.
      assert(signature.indexOf('(') === -1);
      return {
        name: signature,
        formals: [],
      };
    }

    const r = Semantics.prototypeGrammar.match(
        signature,
      type === 'operation' ? 'OperationSignature' : 'AttributeSignature',
    );
    if (r.failed()) {
      throw new Error(r.message);
    }

    return Semantics.prototypeGrammarSemantics(r).parse();
  }

  function newDefaultAction(type, name, doIt) {
    return function(...children) {
      const thisThing = this._semantics.operations[name] || this._semantics.attributes[name];
      const args = thisThing.formals.map(formal => this.args[formal]);

      if (!this.isIteration() && children.length === 1) {
        // This CST node corresponds to a non-terminal in the grammar (e.g., AddExpr). The fact that
        // we got here means that this action dictionary doesn't have an action for this particular
        // non-terminal or a generic `_nonterminal` action.
        // As a convenience, if this node only has one child, we just return the result of applying
        // this operation / attribute to the child node.
        return doIt.apply(children[0], args);
      } else {
        // Otherwise, we throw an exception to let the programmer know that we don't know what
        // to do with this node.
        throw missingSemanticAction(this.ctorName, name, type, globalActionStack);
      }
    };
  }

  // Creates a new Semantics instance for `grammar`, inheriting operations and attributes from
  // `optSuperSemantics`, if it is specified. Returns a function that acts as a proxy for the new
  // Semantics instance. When that function is invoked with a CST node as an argument, it returns
  // a wrapper for that node which gives access to the operations and attributes provided by this
  // semantics.
  Semantics.createSemantics = function(grammar, optSuperSemantics) {
    const s = new Semantics(
        grammar,
      optSuperSemantics !== undefined ?
        optSuperSemantics :
        Semantics.BuiltInSemantics._getSemantics(),
    );

    // To enable clients to invoke a semantics like a function, return a function that acts as a proxy
    // for `s`, which is the real `Semantics` instance.
    const proxy = function ASemantics(matchResult) {
      if (!(matchResult instanceof MatchResult)) {
        throw new TypeError(
            'Semantics expected a MatchResult, but got ' +
            unexpectedObjToString(matchResult),
        );
      }
      if (matchResult.failed()) {
        throw new TypeError('cannot apply Semantics to ' + matchResult.toString());
      }

      const cst = matchResult._cst;
      if (cst.grammar !== grammar) {
        throw new Error(
            "Cannot use a MatchResult from grammar '" +
            cst.grammar.name +
            "' with a semantics for '" +
            grammar.name +
            "'",
        );
      }
      const inputStream = new InputStream(matchResult.input);
      return s.wrap(cst, inputStream.interval(matchResult._cstOffset, matchResult.input.length));
    };

    // Forward public methods from the proxy to the semantics instance.
    proxy.addOperation = function(signature, actionDict) {
      s.addOperationOrAttribute('operation', signature, actionDict);
      return proxy;
    };
    proxy.extendOperation = function(name, actionDict) {
      s.extendOperationOrAttribute('operation', name, actionDict);
      return proxy;
    };
    proxy.addAttribute = function(name, actionDict) {
      s.addOperationOrAttribute('attribute', name, actionDict);
      return proxy;
    };
    proxy.extendAttribute = function(name, actionDict) {
      s.extendOperationOrAttribute('attribute', name, actionDict);
      return proxy;
    };
    proxy._getActionDict = function(operationOrAttributeName) {
      const action =
        s.operations[operationOrAttributeName] || s.attributes[operationOrAttributeName];
      if (!action) {
        throw new Error(
            '"' +
            operationOrAttributeName +
            '" is not a valid operation or attribute ' +
            'name in this semantics for "' +
            grammar.name +
            '"',
        );
      }
      return action.actionDict;
    };
    proxy._remove = function(operationOrAttributeName) {
      let semantic;
      if (operationOrAttributeName in s.operations) {
        semantic = s.operations[operationOrAttributeName];
        delete s.operations[operationOrAttributeName];
      } else if (operationOrAttributeName in s.attributes) {
        semantic = s.attributes[operationOrAttributeName];
        delete s.attributes[operationOrAttributeName];
      }
      delete s.Wrapper.prototype[operationOrAttributeName];
      return semantic;
    };
    proxy.getOperationNames = function() {
      return Object.keys(s.operations);
    };
    proxy.getAttributeNames = function() {
      return Object.keys(s.attributes);
    };
    proxy.getGrammar = function() {
      return s.grammar;
    };
    proxy.toRecipe = function(semanticsOnly) {
      return s.toRecipe(semanticsOnly);
    };

    // Make the proxy's toString() work.
    proxy.toString = s.toString.bind(s);

    // Returns the semantics for the proxy.
    proxy._getSemantics = function() {
      return s;
    };

    return proxy;
  };

  // ----------------- Operation -----------------

  // An Operation represents a function to be applied to a concrete syntax tree (CST) -- it's very
  // similar to a Visitor (http://en.wikipedia.org/wiki/Visitor_pattern). An operation is executed by
  // recursively walking the CST, and at each node, invoking the matching semantic action from
  // `actionDict`. See `Operation.prototype.execute` for details of how a CST node's matching semantic
  // action is found.
  class Operation {
    constructor(name, formals, actionDict, builtInDefault) {
      this.name = name;
      this.formals = formals;
      this.actionDict = actionDict;
      this.builtInDefault = builtInDefault;
    }

    checkActionDict(grammar) {
      grammar._checkTopDownActionDict(this.typeName, this.name, this.actionDict);
    }

    // Execute this operation on the CST node associated with `nodeWrapper` in the context of the
    // given Semantics instance.
    execute(semantics, nodeWrapper) {
      try {
        // Look for a semantic action whose name matches the node's constructor name, which is either
        // the name of a rule in the grammar, or '_terminal' (for a terminal node), or '_iter' (for an
        // iteration node).
        const {ctorName} = nodeWrapper._node;
        let actionFn = this.actionDict[ctorName];
        if (actionFn) {
          globalActionStack.push([this, ctorName]);
          return actionFn.apply(nodeWrapper, nodeWrapper._children());
        }

        // The action dictionary does not contain a semantic action for this specific type of node.
        // If this is a nonterminal node and the programmer has provided a `_nonterminal` semantic
        // action, we invoke it:
        if (nodeWrapper.isNonterminal()) {
          actionFn = this.actionDict._nonterminal;
          if (actionFn) {
            globalActionStack.push([this, '_nonterminal', ctorName]);
            return actionFn.apply(nodeWrapper, nodeWrapper._children());
          }
        }

        // Otherwise, we invoke the '_default' semantic action.
        globalActionStack.push([this, 'default action', ctorName]);
        return this.actionDict._default.apply(nodeWrapper, nodeWrapper._children());
      } finally {
        globalActionStack.pop();
      }
    }
  }

  Operation.prototype.typeName = 'operation';

  // ----------------- Attribute -----------------

  // Attributes are Operations whose results are memoized. This means that, for any given semantics,
  // the semantic action for a CST node will be invoked no more than once.
  class Attribute extends Operation {
    constructor(name, actionDict, builtInDefault) {
      super(name, [], actionDict, builtInDefault);
    }

    execute(semantics, nodeWrapper) {
      const node = nodeWrapper._node;
      const key = semantics.attributeKeys[this.name];
      if (!hasOwnProperty(node, key)) {
        // The following is a super-send -- isn't JS beautiful? :/
        node[key] = Operation.prototype.execute.call(this, semantics, nodeWrapper);
      }
      return node[key];
    }
  }

  Attribute.prototype.typeName = 'attribute';

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  const SPECIAL_ACTION_NAMES = ['_iter', '_terminal', '_nonterminal', '_default'];

  function getSortedRuleValues(grammar) {
    return Object.keys(grammar.rules)
        .sort()
        .map(name => grammar.rules[name]);
  }

  // Until ES2019, JSON was not a valid subset of JavaScript because U+2028 (line separator)
  // and U+2029 (paragraph separator) are allowed in JSON string literals, but not in JS.
  // This function properly encodes those two characters so that the resulting string is
  // represents both valid JSON, and valid JavaScript (for ES2018 and below).
  // See https://v8.dev/features/subsume-json for more details.
  const jsonToJS = str => str.replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');

  let ohmGrammar$1;
  let buildGrammar$1;

  class Grammar {
    constructor(name, superGrammar, rules, optDefaultStartRule) {
      this.name = name;
      this.superGrammar = superGrammar;
      this.rules = rules;
      if (optDefaultStartRule) {
        if (!(optDefaultStartRule in rules)) {
          throw new Error(
              "Invalid start rule: '" +
              optDefaultStartRule +
              "' is not a rule in grammar '" +
              name +
              "'",
          );
        }
        this.defaultStartRule = optDefaultStartRule;
      }
      this._matchStateInitializer = undefined;
      this.supportsIncrementalParsing = true;
    }

    matcher() {
      return new Matcher(this);
    }

    // Return true if the grammar is a built-in grammar, otherwise false.
    // NOTE: This might give an unexpected result if called before BuiltInRules is defined!
    isBuiltIn() {
      return this === Grammar.ProtoBuiltInRules || this === Grammar.BuiltInRules;
    }

    equals(g) {
      if (this === g) {
        return true;
      }
      // Do the cheapest comparisons first.
      if (
        g == null ||
        this.name !== g.name ||
        this.defaultStartRule !== g.defaultStartRule ||
        !(this.superGrammar === g.superGrammar || this.superGrammar.equals(g.superGrammar))
      ) {
        return false;
      }
      const myRules = getSortedRuleValues(this);
      const otherRules = getSortedRuleValues(g);
      return (
        myRules.length === otherRules.length &&
        myRules.every((rule, i) => {
          return (
            rule.description === otherRules[i].description &&
            rule.formals.join(',') === otherRules[i].formals.join(',') &&
            rule.body.toString() === otherRules[i].body.toString()
          );
        })
      );
    }

    match(input, optStartApplication) {
      const m = this.matcher();
      m.replaceInputRange(0, 0, input);
      return m.match(optStartApplication);
    }

    trace(input, optStartApplication) {
      const m = this.matcher();
      m.replaceInputRange(0, 0, input);
      return m.trace(optStartApplication);
    }

    createSemantics() {
      return Semantics.createSemantics(this);
    }

    extendSemantics(superSemantics) {
      return Semantics.createSemantics(this, superSemantics._getSemantics());
    }

    // Check that every key in `actionDict` corresponds to a semantic action, and that it maps to
    // a function of the correct arity. If not, throw an exception.
    _checkTopDownActionDict(what, name, actionDict) {
      const problems = [];

      // eslint-disable-next-line guard-for-in
      for (const k in actionDict) {
        const v = actionDict[k];
        const isSpecialAction = SPECIAL_ACTION_NAMES.includes(k);

        if (!isSpecialAction && !(k in this.rules)) {
          problems.push(`'${k}' is not a valid semantic action for '${this.name}'`);
          continue;
        }
        if (typeof v !== 'function') {
          problems.push(`'${k}' must be a function in an action dictionary for '${this.name}'`);
          continue;
        }
        const actual = v.length;
        const expected = this._topDownActionArity(k);
        if (actual !== expected) {
          let details;
          if (k === '_iter' || k === '_nonterminal') {
            details =
              `it should use a rest parameter, e.g. \`${k}(...children) {}\`. ` +
              'NOTE: this is new in Ohm v16 — see https://ohmjs.org/d/ati for details.';
          } else {
            details = `expected ${expected}, got ${actual}`;
          }
          problems.push(`Semantic action '${k}' has the wrong arity: ${details}`);
        }
      }
      if (problems.length > 0) {
        const prettyProblems = problems.map(problem => '- ' + problem);
        const error = new Error(
            [
              `Found errors in the action dictionary of the '${name}' ${what}:`,
              ...prettyProblems,
            ].join('\n'),
        );
        error.problems = problems;
        throw error;
      }
    }

    // Return the expected arity for a semantic action named `actionName`, which
    // is either a rule name or a special action name like '_nonterminal'.
    _topDownActionArity(actionName) {
      // All special actions have an expected arity of 0, though all but _terminal
      // are expected to use the rest parameter syntax (e.g. `_iter(...children)`).
      // This is considered to have arity 0, i.e. `((...args) => {}).length` is 0.
      return SPECIAL_ACTION_NAMES.includes(actionName) ?
        0 :
        this.rules[actionName].body.getArity();
    }

    _inheritsFrom(grammar) {
      let g = this.superGrammar;
      while (g) {
        if (g.equals(grammar, true)) {
          return true;
        }
        g = g.superGrammar;
      }
      return false;
    }

    toRecipe(superGrammarExpr = undefined) {
      const metaInfo = {};
      // Include the grammar source if it is available.
      if (this.source) {
        metaInfo.source = this.source.contents;
      }

      let startRule = null;
      if (this.defaultStartRule) {
        startRule = this.defaultStartRule;
      }

      const rules = {};
      Object.keys(this.rules).forEach(ruleName => {
        const ruleInfo = this.rules[ruleName];
        const {body} = ruleInfo;
        const isDefinition = !this.superGrammar || !this.superGrammar.rules[ruleName];

        let operation;
        if (isDefinition) {
          operation = 'define';
        } else {
          operation = body instanceof Extend ? 'extend' : 'override';
        }

        const metaInfo = {};
        if (ruleInfo.source && this.source) {
          const adjusted = ruleInfo.source.relativeTo(this.source);
          metaInfo.sourceInterval = [adjusted.startIdx, adjusted.endIdx];
        }

        const description = isDefinition ? ruleInfo.description : null;
        const bodyRecipe = body.outputRecipe(ruleInfo.formals, this.source);

        rules[ruleName] = [
          operation, // "define"/"extend"/"override"
          metaInfo,
          description,
          ruleInfo.formals,
          bodyRecipe,
        ];
      });

      // If the caller provided an expression to use for the supergrammar, use that.
      // Otherwise, if the supergrammar is a user grammar, use its recipe inline.
      let superGrammarOutput = 'null';
      if (superGrammarExpr) {
        superGrammarOutput = superGrammarExpr;
      } else if (this.superGrammar && !this.superGrammar.isBuiltIn()) {
        superGrammarOutput = this.superGrammar.toRecipe();
      }

      const recipeElements = [
        ...['grammar', metaInfo, this.name].map(JSON.stringify),
        superGrammarOutput,
        ...[startRule, rules].map(JSON.stringify),
      ];
      return jsonToJS(`[${recipeElements.join(',')}]`);
    }

    // TODO: Come up with better names for these methods.
    // TODO: Write the analog of these methods for inherited attributes.
    toOperationActionDictionaryTemplate() {
      return this._toOperationOrAttributeActionDictionaryTemplate();
    }
    toAttributeActionDictionaryTemplate() {
      return this._toOperationOrAttributeActionDictionaryTemplate();
    }

    _toOperationOrAttributeActionDictionaryTemplate() {
      // TODO: add the super-grammar's templates at the right place, e.g., a case for AddExpr_plus
      // should appear next to other cases of AddExpr.

      const sb = new StringBuffer();
      sb.append('{');

      let first = true;
      // eslint-disable-next-line guard-for-in
      for (const ruleName in this.rules) {
        const {body} = this.rules[ruleName];
        if (first) {
          first = false;
        } else {
          sb.append(',');
        }
        sb.append('\n');
        sb.append('  ');
        this.addSemanticActionTemplate(ruleName, body, sb);
      }

      sb.append('\n}');
      return sb.contents();
    }

    addSemanticActionTemplate(ruleName, body, sb) {
      sb.append(ruleName);
      sb.append(': function(');
      const arity = this._topDownActionArity(ruleName);
      sb.append(repeat('_', arity).join(', '));
      sb.append(') {\n');
      sb.append('  }');
    }

    // Parse a string which expresses a rule application in this grammar, and return the
    // resulting Apply node.
    parseApplication(str) {
      let app;
      if (str.indexOf('<') === -1) {
        // simple application
        app = new Apply(str);
      } else {
        // parameterized application
        const cst = ohmGrammar$1.match(str, 'Base_application');
        app = buildGrammar$1(cst, {});
      }

      // Ensure that the application is valid.
      if (!(app.ruleName in this.rules)) {
        throw undeclaredRule(app.ruleName, this.name);
      }
      const {formals} = this.rules[app.ruleName];
      if (formals.length !== app.args.length) {
        const {source} = this.rules[app.ruleName];
        throw wrongNumberOfParameters(
            app.ruleName,
            formals.length,
            app.args.length,
            source,
        );
      }
      return app;
    }

    _setUpMatchState(state) {
      if (this._matchStateInitializer) {
        this._matchStateInitializer(state);
      }
    }
  }

  // The following grammar contains a few rules that couldn't be written  in "userland".
  // At the bottom of src/main.js, we create a sub-grammar of this grammar that's called
  // `BuiltInRules`. That grammar contains several convenience rules, e.g., `letter` and
  // `digit`, and is implicitly the super-grammar of any grammar whose super-grammar
  // isn't specified.
  Grammar.ProtoBuiltInRules = new Grammar(
      'ProtoBuiltInRules', // name
      undefined, // supergrammar
      {
        any: {
          body: any,
          formals: [],
          description: 'any character',
          primitive: true,
        },
        end: {
          body: end,
          formals: [],
          description: 'end of input',
          primitive: true,
        },

        caseInsensitive: {
          body: new CaseInsensitiveTerminal(new Param(0)),
          formals: ['str'],
          primitive: true,
        },
        lower: {
          body: new UnicodeChar('Ll'),
          formals: [],
          description: 'a lowercase letter',
          primitive: true,
        },
        upper: {
          body: new UnicodeChar('Lu'),
          formals: [],
          description: 'an uppercase letter',
          primitive: true,
        },
        // Union of Lt (titlecase), Lm (modifier), and Lo (other), i.e. any letter not in Ll or Lu.
        unicodeLtmo: {
          body: new UnicodeChar('Ltmo'),
          formals: [],
          description: 'a Unicode character in Lt, Lm, or Lo',
          primitive: true,
        },

        // These rules are not truly primitive (they could be written in userland) but are defined
        // here for bootstrapping purposes.
        spaces: {
          body: new Star(new Apply('space')),
          formals: [],
        },
        space: {
          body: new Range('\x00', ' '),
          formals: [],
          description: 'a space',
        },
      },
  );

  // This method is called from main.js once Ohm has loaded.
  Grammar.initApplicationParser = function(grammar, builderFn) {
    ohmGrammar$1 = grammar;
    buildGrammar$1 = builderFn;
  };

  // --------------------------------------------------------------------
  // Private Stuff
  // --------------------------------------------------------------------

  // Constructors

  class GrammarDecl {
    constructor(name) {
      this.name = name;
    }

    // Helpers

    sourceInterval(startIdx, endIdx) {
      return this.source.subInterval(startIdx, endIdx - startIdx);
    }

    ensureSuperGrammar() {
      if (!this.superGrammar) {
        this.withSuperGrammar(
          // TODO: The conditional expression below is an ugly hack. It's kind of ok because
          // I doubt anyone will ever try to declare a grammar called `BuiltInRules`. Still,
          // we should try to find a better way to do this.
          this.name === 'BuiltInRules' ? Grammar.ProtoBuiltInRules : Grammar.BuiltInRules,
        );
      }
      return this.superGrammar;
    }

    ensureSuperGrammarRuleForOverriding(name, source) {
      const ruleInfo = this.ensureSuperGrammar().rules[name];
      if (!ruleInfo) {
        throw cannotOverrideUndeclaredRule(name, this.superGrammar.name, source);
      }
      return ruleInfo;
    }

    installOverriddenOrExtendedRule(name, formals, body, source) {
      const duplicateParameterNames$1 = getDuplicates(formals);
      if (duplicateParameterNames$1.length > 0) {
        throw duplicateParameterNames(name, duplicateParameterNames$1, source);
      }
      const ruleInfo = this.ensureSuperGrammar().rules[name];
      const expectedFormals = ruleInfo.formals;
      const expectedNumFormals = expectedFormals ? expectedFormals.length : 0;
      if (formals.length !== expectedNumFormals) {
        throw wrongNumberOfParameters(name, expectedNumFormals, formals.length, source);
      }
      return this.install(name, formals, body, ruleInfo.description, source);
    }

    install(name, formals, body, description, source, primitive = false) {
      this.rules[name] = {
        body: body.introduceParams(formals),
        formals,
        description,
        source,
        primitive,
      };
      return this;
    }

    // Stuff that you should only do once

    withSuperGrammar(superGrammar) {
      if (this.superGrammar) {
        throw new Error('the super grammar of a GrammarDecl cannot be set more than once');
      }
      this.superGrammar = superGrammar;
      this.rules = Object.create(superGrammar.rules);

      // Grammars with an explicit supergrammar inherit a default start rule.
      if (!superGrammar.isBuiltIn()) {
        this.defaultStartRule = superGrammar.defaultStartRule;
      }
      return this;
    }

    withDefaultStartRule(ruleName) {
      this.defaultStartRule = ruleName;
      return this;
    }

    withSource(source) {
      this.source = new InputStream(source).interval(0, source.length);
      return this;
    }

    // Creates a Grammar instance, and if it passes the sanity checks, returns it.
    build() {
      const grammar = new Grammar(
          this.name,
          this.ensureSuperGrammar(),
          this.rules,
          this.defaultStartRule,
      );
      // Initialize internal props that are inherited from the super grammar.
      grammar._matchStateInitializer = grammar.superGrammar._matchStateInitializer;
      grammar.supportsIncrementalParsing = grammar.superGrammar.supportsIncrementalParsing;

      // TODO: change the pexpr.prototype.assert... methods to make them add
      // exceptions to an array that's provided as an arg. Then we'll be able to
      // show more than one error of the same type at a time.
      // TODO: include the offending pexpr in the errors, that way we can show
      // the part of the source that caused it.
      const grammarErrors = [];
      let grammarHasInvalidApplications = false;
      Object.keys(grammar.rules).forEach(ruleName => {
        const {body} = grammar.rules[ruleName];
        try {
          body.assertChoicesHaveUniformArity(ruleName);
        } catch (e) {
          grammarErrors.push(e);
        }
        try {
          body.assertAllApplicationsAreValid(ruleName, grammar);
        } catch (e) {
          grammarErrors.push(e);
          grammarHasInvalidApplications = true;
        }
      });
      if (!grammarHasInvalidApplications) {
        // The following check can only be done if the grammar has no invalid applications.
        Object.keys(grammar.rules).forEach(ruleName => {
          const {body} = grammar.rules[ruleName];
          try {
            body.assertIteratedExprsAreNotNullable(grammar, []);
          } catch (e) {
            grammarErrors.push(e);
          }
        });
      }
      if (grammarErrors.length > 0) {
        throwErrors(grammarErrors);
      }
      if (this.source) {
        grammar.source = this.source;
      }

      return grammar;
    }

    // Rule declarations

    define(name, formals, body, description, source, primitive) {
      this.ensureSuperGrammar();
      if (this.superGrammar.rules[name]) {
        throw duplicateRuleDeclaration(name, this.name, this.superGrammar.name, source);
      } else if (this.rules[name]) {
        throw duplicateRuleDeclaration(name, this.name, this.name, source);
      }
      const duplicateParameterNames$1 = getDuplicates(formals);
      if (duplicateParameterNames$1.length > 0) {
        throw duplicateParameterNames(name, duplicateParameterNames$1, source);
      }
      return this.install(name, formals, body, description, source, primitive);
    }

    override(name, formals, body, descIgnored, source) {
      this.ensureSuperGrammarRuleForOverriding(name, source);
      this.installOverriddenOrExtendedRule(name, formals, body, source);
      return this;
    }

    extend(name, formals, fragment, descIgnored, source) {
      const ruleInfo = this.ensureSuperGrammar().rules[name];
      if (!ruleInfo) {
        throw cannotExtendUndeclaredRule(name, this.superGrammar.name, source);
      }
      const body = new Extend(this.superGrammar, name, fragment);
      body.source = fragment.source;
      this.installOverriddenOrExtendedRule(name, formals, body, source);
      return this;
    }
  }

  // --------------------------------------------------------------------
  // Private stuff
  // --------------------------------------------------------------------

  class Builder {
    constructor() {
      this.currentDecl = null;
      this.currentRuleName = null;
    }

    newGrammar(name) {
      return new GrammarDecl(name);
    }

    grammar(metaInfo, name, superGrammar, defaultStartRule, rules) {
      const gDecl = new GrammarDecl(name);
      if (superGrammar) {
        // `superGrammar` may be a recipe (i.e. an Array), or an actual grammar instance.
        gDecl.withSuperGrammar(
          superGrammar instanceof Grammar ? superGrammar : this.fromRecipe(superGrammar),
        );
      }
      if (defaultStartRule) {
        gDecl.withDefaultStartRule(defaultStartRule);
      }
      if (metaInfo && metaInfo.source) {
        gDecl.withSource(metaInfo.source);
      }

      this.currentDecl = gDecl;
      Object.keys(rules).forEach(ruleName => {
        this.currentRuleName = ruleName;
        const ruleRecipe = rules[ruleName];

        const action = ruleRecipe[0]; // define/extend/override
        const metaInfo = ruleRecipe[1];
        const description = ruleRecipe[2];
        const formals = ruleRecipe[3];
        const body = this.fromRecipe(ruleRecipe[4]);

        let source;
        if (gDecl.source && metaInfo && metaInfo.sourceInterval) {
          source = gDecl.source.subInterval(
              metaInfo.sourceInterval[0],
              metaInfo.sourceInterval[1] - metaInfo.sourceInterval[0],
          );
        }
        gDecl[action](ruleName, formals, body, description, source);
      });
      this.currentRuleName = this.currentDecl = null;
      return gDecl.build();
    }

    terminal(x) {
      return new Terminal(x);
    }

    range(from, to) {
      return new Range(from, to);
    }

    param(index) {
      return new Param(index);
    }

    alt(...termArgs) {
      let terms = [];
      for (let arg of termArgs) {
        if (!(arg instanceof PExpr)) {
          arg = this.fromRecipe(arg);
        }
        if (arg instanceof Alt) {
          terms = terms.concat(arg.terms);
        } else {
          terms.push(arg);
        }
      }
      return terms.length === 1 ? terms[0] : new Alt(terms);
    }

    seq(...factorArgs) {
      let factors = [];
      for (let arg of factorArgs) {
        if (!(arg instanceof PExpr)) {
          arg = this.fromRecipe(arg);
        }
        if (arg instanceof Seq) {
          factors = factors.concat(arg.factors);
        } else {
          factors.push(arg);
        }
      }
      return factors.length === 1 ? factors[0] : new Seq(factors);
    }

    star(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Star(expr);
    }

    plus(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Plus(expr);
    }

    opt(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Opt(expr);
    }

    not(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Not(expr);
    }

    lookahead(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Lookahead(expr);
    }

    lex(expr) {
      if (!(expr instanceof PExpr)) {
        expr = this.fromRecipe(expr);
      }
      return new Lex(expr);
    }

    app(ruleName, optParams) {
      if (optParams && optParams.length > 0) {
        optParams = optParams.map(function(param) {
          return param instanceof PExpr ? param : this.fromRecipe(param);
        }, this);
      }
      return new Apply(ruleName, optParams);
    }

    // Note that unlike other methods in this class, this method cannot be used as a
    // convenience constructor. It only works with recipes, because it relies on
    // `this.currentDecl` and `this.currentRuleName` being set.
    splice(beforeTerms, afterTerms) {
      return new Splice(
          this.currentDecl.superGrammar,
          this.currentRuleName,
          beforeTerms.map(term => this.fromRecipe(term)),
          afterTerms.map(term => this.fromRecipe(term)),
      );
    }

    fromRecipe(recipe) {
      // the meta-info of 'grammar' is processed in Builder.grammar
      const args = recipe[0] === 'grammar' ? recipe.slice(1) : recipe.slice(2);
      const result = this[recipe[0]](...args);

      const metaInfo = recipe[1];
      if (metaInfo) {
        if (metaInfo.sourceInterval && this.currentDecl) {
          result.withSource(this.currentDecl.sourceInterval(...metaInfo.sourceInterval));
        }
      }
      return result;
    }
  }

  function makeRecipe(recipe) {
    if (typeof recipe === 'function') {
      return recipe.call(new Builder());
    } else {
      if (typeof recipe === 'string') {
        // stringified JSON recipe
        recipe = JSON.parse(recipe);
      }
      return new Builder().fromRecipe(recipe);
    }
  }

  var BuiltInRules = makeRecipe(["grammar",{"source":"BuiltInRules {\n\n  alnum  (an alpha-numeric character)\n    = letter\n    | digit\n\n  letter  (a letter)\n    = lower\n    | upper\n    | unicodeLtmo\n\n  digit  (a digit)\n    = \"0\"..\"9\"\n\n  hexDigit  (a hexadecimal digit)\n    = digit\n    | \"a\"..\"f\"\n    | \"A\"..\"F\"\n\n  ListOf<elem, sep>\n    = NonemptyListOf<elem, sep>\n    | EmptyListOf<elem, sep>\n\n  NonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  EmptyListOf<elem, sep>\n    = /* nothing */\n\n  listOf<elem, sep>\n    = nonemptyListOf<elem, sep>\n    | emptyListOf<elem, sep>\n\n  nonemptyListOf<elem, sep>\n    = elem (sep elem)*\n\n  emptyListOf<elem, sep>\n    = /* nothing */\n\n  // Allows a syntactic rule application within a lexical context.\n  applySyntactic<app> = app\n}"},"BuiltInRules",null,null,{"alnum":["define",{"sourceInterval":[18,78]},"an alpha-numeric character",[],["alt",{"sourceInterval":[60,78]},["app",{"sourceInterval":[60,66]},"letter",[]],["app",{"sourceInterval":[73,78]},"digit",[]]]],"letter":["define",{"sourceInterval":[82,142]},"a letter",[],["alt",{"sourceInterval":[107,142]},["app",{"sourceInterval":[107,112]},"lower",[]],["app",{"sourceInterval":[119,124]},"upper",[]],["app",{"sourceInterval":[131,142]},"unicodeLtmo",[]]]],"digit":["define",{"sourceInterval":[146,177]},"a digit",[],["range",{"sourceInterval":[169,177]},"0","9"]],"hexDigit":["define",{"sourceInterval":[181,254]},"a hexadecimal digit",[],["alt",{"sourceInterval":[219,254]},["app",{"sourceInterval":[219,224]},"digit",[]],["range",{"sourceInterval":[231,239]},"a","f"],["range",{"sourceInterval":[246,254]},"A","F"]]],"ListOf":["define",{"sourceInterval":[258,336]},null,["elem","sep"],["alt",{"sourceInterval":[282,336]},["app",{"sourceInterval":[282,307]},"NonemptyListOf",[["param",{"sourceInterval":[297,301]},0],["param",{"sourceInterval":[303,306]},1]]],["app",{"sourceInterval":[314,336]},"EmptyListOf",[["param",{"sourceInterval":[326,330]},0],["param",{"sourceInterval":[332,335]},1]]]]],"NonemptyListOf":["define",{"sourceInterval":[340,388]},null,["elem","sep"],["seq",{"sourceInterval":[372,388]},["param",{"sourceInterval":[372,376]},0],["star",{"sourceInterval":[377,388]},["seq",{"sourceInterval":[378,386]},["param",{"sourceInterval":[378,381]},1],["param",{"sourceInterval":[382,386]},0]]]]],"EmptyListOf":["define",{"sourceInterval":[392,434]},null,["elem","sep"],["seq",{"sourceInterval":[438,438]}]],"listOf":["define",{"sourceInterval":[438,516]},null,["elem","sep"],["alt",{"sourceInterval":[462,516]},["app",{"sourceInterval":[462,487]},"nonemptyListOf",[["param",{"sourceInterval":[477,481]},0],["param",{"sourceInterval":[483,486]},1]]],["app",{"sourceInterval":[494,516]},"emptyListOf",[["param",{"sourceInterval":[506,510]},0],["param",{"sourceInterval":[512,515]},1]]]]],"nonemptyListOf":["define",{"sourceInterval":[520,568]},null,["elem","sep"],["seq",{"sourceInterval":[552,568]},["param",{"sourceInterval":[552,556]},0],["star",{"sourceInterval":[557,568]},["seq",{"sourceInterval":[558,566]},["param",{"sourceInterval":[558,561]},1],["param",{"sourceInterval":[562,566]},0]]]]],"emptyListOf":["define",{"sourceInterval":[572,682]},null,["elem","sep"],["seq",{"sourceInterval":[685,685]}]],"applySyntactic":["define",{"sourceInterval":[685,710]},null,["app"],["param",{"sourceInterval":[707,710]},0]]}]);

  Grammar.BuiltInRules = BuiltInRules;
  announceBuiltInRules(Grammar.BuiltInRules);

  var ohmGrammar = makeRecipe(["grammar",{"source":"Ohm {\n\n  Grammars\n    = Grammar*\n\n  Grammar\n    = ident SuperGrammar? \"{\" Rule* \"}\"\n\n  SuperGrammar\n    = \"<:\" ident\n\n  Rule\n    = ident Formals? ruleDescr? \"=\"  RuleBody  -- define\n    | ident Formals?            \":=\" OverrideRuleBody  -- override\n    | ident Formals?            \"+=\" RuleBody  -- extend\n\n  RuleBody\n    = \"|\"? NonemptyListOf<TopLevelTerm, \"|\">\n\n  TopLevelTerm\n    = Seq caseName  -- inline\n    | Seq\n\n  OverrideRuleBody\n    = \"|\"? NonemptyListOf<OverrideTopLevelTerm, \"|\">\n\n  OverrideTopLevelTerm\n    = \"...\"  -- superSplice\n    | TopLevelTerm\n\n  Formals\n    = \"<\" ListOf<ident, \",\"> \">\"\n\n  Params\n    = \"<\" ListOf<Seq, \",\"> \">\"\n\n  Alt\n    = NonemptyListOf<Seq, \"|\">\n\n  Seq\n    = Iter*\n\n  Iter\n    = Pred \"*\"  -- star\n    | Pred \"+\"  -- plus\n    | Pred \"?\"  -- opt\n    | Pred\n\n  Pred\n    = \"~\" Lex  -- not\n    | \"&\" Lex  -- lookahead\n    | Lex\n\n  Lex\n    = \"#\" Base  -- lex\n    | Base\n\n  Base\n    = ident Params? ~(ruleDescr? \"=\" | \":=\" | \"+=\")  -- application\n    | oneCharTerminal \"..\" oneCharTerminal           -- range\n    | terminal                                       -- terminal\n    | \"(\" Alt \")\"                                    -- paren\n\n  ruleDescr  (a rule description)\n    = \"(\" ruleDescrText \")\"\n\n  ruleDescrText\n    = (~\")\" any)*\n\n  caseName\n    = \"--\" (~\"\\n\" space)* name (~\"\\n\" space)* (\"\\n\" | &\"}\")\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = \"_\"\n    | letter\n\n  nameRest\n    = \"_\"\n    | alnum\n\n  ident  (an identifier)\n    = name\n\n  terminal\n    = \"\\\"\" terminalChar* \"\\\"\"\n\n  oneCharTerminal\n    = \"\\\"\" terminalChar \"\\\"\"\n\n  terminalChar\n    = escapeChar\n      | ~\"\\\\\" ~\"\\\"\" ~\"\\n\" \"\\u{0}\"..\"\\u{10FFFF}\"\n\n  escapeChar  (an escape sequence)\n    = \"\\\\\\\\\"                                     -- backslash\n    | \"\\\\\\\"\"                                     -- doubleQuote\n    | \"\\\\\\'\"                                     -- singleQuote\n    | \"\\\\b\"                                      -- backspace\n    | \"\\\\n\"                                      -- lineFeed\n    | \"\\\\r\"                                      -- carriageReturn\n    | \"\\\\t\"                                      -- tab\n    | \"\\\\u{\" hexDigit hexDigit? hexDigit?\n             hexDigit? hexDigit? hexDigit? \"}\"   -- unicodeCodePoint\n    | \"\\\\u\" hexDigit hexDigit hexDigit hexDigit  -- unicodeEscape\n    | \"\\\\x\" hexDigit hexDigit                    -- hexEscape\n\n  space\n   += comment\n\n  comment\n    = \"//\" (~\"\\n\" any)* &(\"\\n\" | end)  -- singleLine\n    | \"/*\" (~\"*/\" any)* \"*/\"  -- multiLine\n\n  tokens = token*\n\n  token = caseName | comment | ident | operator | punctuation | terminal | any\n\n  operator = \"<:\" | \"=\" | \":=\" | \"+=\" | \"*\" | \"+\" | \"?\" | \"~\" | \"&\"\n\n  punctuation = \"<\" | \">\" | \",\" | \"--\"\n}"},"Ohm",null,"Grammars",{"Grammars":["define",{"sourceInterval":[9,32]},null,[],["star",{"sourceInterval":[24,32]},["app",{"sourceInterval":[24,31]},"Grammar",[]]]],"Grammar":["define",{"sourceInterval":[36,83]},null,[],["seq",{"sourceInterval":[50,83]},["app",{"sourceInterval":[50,55]},"ident",[]],["opt",{"sourceInterval":[56,69]},["app",{"sourceInterval":[56,68]},"SuperGrammar",[]]],["terminal",{"sourceInterval":[70,73]},"{"],["star",{"sourceInterval":[74,79]},["app",{"sourceInterval":[74,78]},"Rule",[]]],["terminal",{"sourceInterval":[80,83]},"}"]]],"SuperGrammar":["define",{"sourceInterval":[87,116]},null,[],["seq",{"sourceInterval":[106,116]},["terminal",{"sourceInterval":[106,110]},"<:"],["app",{"sourceInterval":[111,116]},"ident",[]]]],"Rule_define":["define",{"sourceInterval":[131,181]},null,[],["seq",{"sourceInterval":[131,170]},["app",{"sourceInterval":[131,136]},"ident",[]],["opt",{"sourceInterval":[137,145]},["app",{"sourceInterval":[137,144]},"Formals",[]]],["opt",{"sourceInterval":[146,156]},["app",{"sourceInterval":[146,155]},"ruleDescr",[]]],["terminal",{"sourceInterval":[157,160]},"="],["app",{"sourceInterval":[162,170]},"RuleBody",[]]]],"Rule_override":["define",{"sourceInterval":[188,248]},null,[],["seq",{"sourceInterval":[188,235]},["app",{"sourceInterval":[188,193]},"ident",[]],["opt",{"sourceInterval":[194,202]},["app",{"sourceInterval":[194,201]},"Formals",[]]],["terminal",{"sourceInterval":[214,218]},":="],["app",{"sourceInterval":[219,235]},"OverrideRuleBody",[]]]],"Rule_extend":["define",{"sourceInterval":[255,305]},null,[],["seq",{"sourceInterval":[255,294]},["app",{"sourceInterval":[255,260]},"ident",[]],["opt",{"sourceInterval":[261,269]},["app",{"sourceInterval":[261,268]},"Formals",[]]],["terminal",{"sourceInterval":[281,285]},"+="],["app",{"sourceInterval":[286,294]},"RuleBody",[]]]],"Rule":["define",{"sourceInterval":[120,305]},null,[],["alt",{"sourceInterval":[131,305]},["app",{"sourceInterval":[131,170]},"Rule_define",[]],["app",{"sourceInterval":[188,235]},"Rule_override",[]],["app",{"sourceInterval":[255,294]},"Rule_extend",[]]]],"RuleBody":["define",{"sourceInterval":[309,362]},null,[],["seq",{"sourceInterval":[324,362]},["opt",{"sourceInterval":[324,328]},["terminal",{"sourceInterval":[324,327]},"|"]],["app",{"sourceInterval":[329,362]},"NonemptyListOf",[["app",{"sourceInterval":[344,356]},"TopLevelTerm",[]],["terminal",{"sourceInterval":[358,361]},"|"]]]]],"TopLevelTerm_inline":["define",{"sourceInterval":[385,408]},null,[],["seq",{"sourceInterval":[385,397]},["app",{"sourceInterval":[385,388]},"Seq",[]],["app",{"sourceInterval":[389,397]},"caseName",[]]]],"TopLevelTerm":["define",{"sourceInterval":[366,418]},null,[],["alt",{"sourceInterval":[385,418]},["app",{"sourceInterval":[385,397]},"TopLevelTerm_inline",[]],["app",{"sourceInterval":[415,418]},"Seq",[]]]],"OverrideRuleBody":["define",{"sourceInterval":[422,491]},null,[],["seq",{"sourceInterval":[445,491]},["opt",{"sourceInterval":[445,449]},["terminal",{"sourceInterval":[445,448]},"|"]],["app",{"sourceInterval":[450,491]},"NonemptyListOf",[["app",{"sourceInterval":[465,485]},"OverrideTopLevelTerm",[]],["terminal",{"sourceInterval":[487,490]},"|"]]]]],"OverrideTopLevelTerm_superSplice":["define",{"sourceInterval":[522,543]},null,[],["terminal",{"sourceInterval":[522,527]},"..."]],"OverrideTopLevelTerm":["define",{"sourceInterval":[495,562]},null,[],["alt",{"sourceInterval":[522,562]},["app",{"sourceInterval":[522,527]},"OverrideTopLevelTerm_superSplice",[]],["app",{"sourceInterval":[550,562]},"TopLevelTerm",[]]]],"Formals":["define",{"sourceInterval":[566,606]},null,[],["seq",{"sourceInterval":[580,606]},["terminal",{"sourceInterval":[580,583]},"<"],["app",{"sourceInterval":[584,602]},"ListOf",[["app",{"sourceInterval":[591,596]},"ident",[]],["terminal",{"sourceInterval":[598,601]},","]]],["terminal",{"sourceInterval":[603,606]},">"]]],"Params":["define",{"sourceInterval":[610,647]},null,[],["seq",{"sourceInterval":[623,647]},["terminal",{"sourceInterval":[623,626]},"<"],["app",{"sourceInterval":[627,643]},"ListOf",[["app",{"sourceInterval":[634,637]},"Seq",[]],["terminal",{"sourceInterval":[639,642]},","]]],["terminal",{"sourceInterval":[644,647]},">"]]],"Alt":["define",{"sourceInterval":[651,685]},null,[],["app",{"sourceInterval":[661,685]},"NonemptyListOf",[["app",{"sourceInterval":[676,679]},"Seq",[]],["terminal",{"sourceInterval":[681,684]},"|"]]]],"Seq":["define",{"sourceInterval":[689,704]},null,[],["star",{"sourceInterval":[699,704]},["app",{"sourceInterval":[699,703]},"Iter",[]]]],"Iter_star":["define",{"sourceInterval":[719,736]},null,[],["seq",{"sourceInterval":[719,727]},["app",{"sourceInterval":[719,723]},"Pred",[]],["terminal",{"sourceInterval":[724,727]},"*"]]],"Iter_plus":["define",{"sourceInterval":[743,760]},null,[],["seq",{"sourceInterval":[743,751]},["app",{"sourceInterval":[743,747]},"Pred",[]],["terminal",{"sourceInterval":[748,751]},"+"]]],"Iter_opt":["define",{"sourceInterval":[767,783]},null,[],["seq",{"sourceInterval":[767,775]},["app",{"sourceInterval":[767,771]},"Pred",[]],["terminal",{"sourceInterval":[772,775]},"?"]]],"Iter":["define",{"sourceInterval":[708,794]},null,[],["alt",{"sourceInterval":[719,794]},["app",{"sourceInterval":[719,727]},"Iter_star",[]],["app",{"sourceInterval":[743,751]},"Iter_plus",[]],["app",{"sourceInterval":[767,775]},"Iter_opt",[]],["app",{"sourceInterval":[790,794]},"Pred",[]]]],"Pred_not":["define",{"sourceInterval":[809,824]},null,[],["seq",{"sourceInterval":[809,816]},["terminal",{"sourceInterval":[809,812]},"~"],["app",{"sourceInterval":[813,816]},"Lex",[]]]],"Pred_lookahead":["define",{"sourceInterval":[831,852]},null,[],["seq",{"sourceInterval":[831,838]},["terminal",{"sourceInterval":[831,834]},"&"],["app",{"sourceInterval":[835,838]},"Lex",[]]]],"Pred":["define",{"sourceInterval":[798,862]},null,[],["alt",{"sourceInterval":[809,862]},["app",{"sourceInterval":[809,816]},"Pred_not",[]],["app",{"sourceInterval":[831,838]},"Pred_lookahead",[]],["app",{"sourceInterval":[859,862]},"Lex",[]]]],"Lex_lex":["define",{"sourceInterval":[876,892]},null,[],["seq",{"sourceInterval":[876,884]},["terminal",{"sourceInterval":[876,879]},"#"],["app",{"sourceInterval":[880,884]},"Base",[]]]],"Lex":["define",{"sourceInterval":[866,903]},null,[],["alt",{"sourceInterval":[876,903]},["app",{"sourceInterval":[876,884]},"Lex_lex",[]],["app",{"sourceInterval":[899,903]},"Base",[]]]],"Base_application":["define",{"sourceInterval":[918,979]},null,[],["seq",{"sourceInterval":[918,963]},["app",{"sourceInterval":[918,923]},"ident",[]],["opt",{"sourceInterval":[924,931]},["app",{"sourceInterval":[924,930]},"Params",[]]],["not",{"sourceInterval":[932,963]},["alt",{"sourceInterval":[934,962]},["seq",{"sourceInterval":[934,948]},["opt",{"sourceInterval":[934,944]},["app",{"sourceInterval":[934,943]},"ruleDescr",[]]],["terminal",{"sourceInterval":[945,948]},"="]],["terminal",{"sourceInterval":[951,955]},":="],["terminal",{"sourceInterval":[958,962]},"+="]]]]],"Base_range":["define",{"sourceInterval":[986,1041]},null,[],["seq",{"sourceInterval":[986,1022]},["app",{"sourceInterval":[986,1001]},"oneCharTerminal",[]],["terminal",{"sourceInterval":[1002,1006]},".."],["app",{"sourceInterval":[1007,1022]},"oneCharTerminal",[]]]],"Base_terminal":["define",{"sourceInterval":[1048,1106]},null,[],["app",{"sourceInterval":[1048,1056]},"terminal",[]]],"Base_paren":["define",{"sourceInterval":[1113,1168]},null,[],["seq",{"sourceInterval":[1113,1124]},["terminal",{"sourceInterval":[1113,1116]},"("],["app",{"sourceInterval":[1117,1120]},"Alt",[]],["terminal",{"sourceInterval":[1121,1124]},")"]]],"Base":["define",{"sourceInterval":[907,1168]},null,[],["alt",{"sourceInterval":[918,1168]},["app",{"sourceInterval":[918,963]},"Base_application",[]],["app",{"sourceInterval":[986,1022]},"Base_range",[]],["app",{"sourceInterval":[1048,1056]},"Base_terminal",[]],["app",{"sourceInterval":[1113,1124]},"Base_paren",[]]]],"ruleDescr":["define",{"sourceInterval":[1172,1231]},"a rule description",[],["seq",{"sourceInterval":[1210,1231]},["terminal",{"sourceInterval":[1210,1213]},"("],["app",{"sourceInterval":[1214,1227]},"ruleDescrText",[]],["terminal",{"sourceInterval":[1228,1231]},")"]]],"ruleDescrText":["define",{"sourceInterval":[1235,1266]},null,[],["star",{"sourceInterval":[1255,1266]},["seq",{"sourceInterval":[1256,1264]},["not",{"sourceInterval":[1256,1260]},["terminal",{"sourceInterval":[1257,1260]},")"]],["app",{"sourceInterval":[1261,1264]},"any",[]]]]],"caseName":["define",{"sourceInterval":[1270,1338]},null,[],["seq",{"sourceInterval":[1285,1338]},["terminal",{"sourceInterval":[1285,1289]},"--"],["star",{"sourceInterval":[1290,1304]},["seq",{"sourceInterval":[1291,1302]},["not",{"sourceInterval":[1291,1296]},["terminal",{"sourceInterval":[1292,1296]},"\n"]],["app",{"sourceInterval":[1297,1302]},"space",[]]]],["app",{"sourceInterval":[1305,1309]},"name",[]],["star",{"sourceInterval":[1310,1324]},["seq",{"sourceInterval":[1311,1322]},["not",{"sourceInterval":[1311,1316]},["terminal",{"sourceInterval":[1312,1316]},"\n"]],["app",{"sourceInterval":[1317,1322]},"space",[]]]],["alt",{"sourceInterval":[1326,1337]},["terminal",{"sourceInterval":[1326,1330]},"\n"],["lookahead",{"sourceInterval":[1333,1337]},["terminal",{"sourceInterval":[1334,1337]},"}"]]]]],"name":["define",{"sourceInterval":[1342,1382]},"a name",[],["seq",{"sourceInterval":[1363,1382]},["app",{"sourceInterval":[1363,1372]},"nameFirst",[]],["star",{"sourceInterval":[1373,1382]},["app",{"sourceInterval":[1373,1381]},"nameRest",[]]]]],"nameFirst":["define",{"sourceInterval":[1386,1418]},null,[],["alt",{"sourceInterval":[1402,1418]},["terminal",{"sourceInterval":[1402,1405]},"_"],["app",{"sourceInterval":[1412,1418]},"letter",[]]]],"nameRest":["define",{"sourceInterval":[1422,1452]},null,[],["alt",{"sourceInterval":[1437,1452]},["terminal",{"sourceInterval":[1437,1440]},"_"],["app",{"sourceInterval":[1447,1452]},"alnum",[]]]],"ident":["define",{"sourceInterval":[1456,1489]},"an identifier",[],["app",{"sourceInterval":[1485,1489]},"name",[]]],"terminal":["define",{"sourceInterval":[1493,1531]},null,[],["seq",{"sourceInterval":[1508,1531]},["terminal",{"sourceInterval":[1508,1512]},"\""],["star",{"sourceInterval":[1513,1526]},["app",{"sourceInterval":[1513,1525]},"terminalChar",[]]],["terminal",{"sourceInterval":[1527,1531]},"\""]]],"oneCharTerminal":["define",{"sourceInterval":[1535,1579]},null,[],["seq",{"sourceInterval":[1557,1579]},["terminal",{"sourceInterval":[1557,1561]},"\""],["app",{"sourceInterval":[1562,1574]},"terminalChar",[]],["terminal",{"sourceInterval":[1575,1579]},"\""]]],"terminalChar":["define",{"sourceInterval":[1583,1660]},null,[],["alt",{"sourceInterval":[1602,1660]},["app",{"sourceInterval":[1602,1612]},"escapeChar",[]],["seq",{"sourceInterval":[1621,1660]},["not",{"sourceInterval":[1621,1626]},["terminal",{"sourceInterval":[1622,1626]},"\\"]],["not",{"sourceInterval":[1627,1632]},["terminal",{"sourceInterval":[1628,1632]},"\""]],["not",{"sourceInterval":[1633,1638]},["terminal",{"sourceInterval":[1634,1638]},"\n"]],["range",{"sourceInterval":[1639,1660]},"\u0000","􏿿"]]]],"escapeChar_backslash":["define",{"sourceInterval":[1703,1758]},null,[],["terminal",{"sourceInterval":[1703,1709]},"\\\\"]],"escapeChar_doubleQuote":["define",{"sourceInterval":[1765,1822]},null,[],["terminal",{"sourceInterval":[1765,1771]},"\\\""]],"escapeChar_singleQuote":["define",{"sourceInterval":[1829,1886]},null,[],["terminal",{"sourceInterval":[1829,1835]},"\\'"]],"escapeChar_backspace":["define",{"sourceInterval":[1893,1948]},null,[],["terminal",{"sourceInterval":[1893,1898]},"\\b"]],"escapeChar_lineFeed":["define",{"sourceInterval":[1955,2009]},null,[],["terminal",{"sourceInterval":[1955,1960]},"\\n"]],"escapeChar_carriageReturn":["define",{"sourceInterval":[2016,2076]},null,[],["terminal",{"sourceInterval":[2016,2021]},"\\r"]],"escapeChar_tab":["define",{"sourceInterval":[2083,2132]},null,[],["terminal",{"sourceInterval":[2083,2088]},"\\t"]],"escapeChar_unicodeCodePoint":["define",{"sourceInterval":[2139,2243]},null,[],["seq",{"sourceInterval":[2139,2221]},["terminal",{"sourceInterval":[2139,2145]},"\\u{"],["app",{"sourceInterval":[2146,2154]},"hexDigit",[]],["opt",{"sourceInterval":[2155,2164]},["app",{"sourceInterval":[2155,2163]},"hexDigit",[]]],["opt",{"sourceInterval":[2165,2174]},["app",{"sourceInterval":[2165,2173]},"hexDigit",[]]],["opt",{"sourceInterval":[2188,2197]},["app",{"sourceInterval":[2188,2196]},"hexDigit",[]]],["opt",{"sourceInterval":[2198,2207]},["app",{"sourceInterval":[2198,2206]},"hexDigit",[]]],["opt",{"sourceInterval":[2208,2217]},["app",{"sourceInterval":[2208,2216]},"hexDigit",[]]],["terminal",{"sourceInterval":[2218,2221]},"}"]]],"escapeChar_unicodeEscape":["define",{"sourceInterval":[2250,2309]},null,[],["seq",{"sourceInterval":[2250,2291]},["terminal",{"sourceInterval":[2250,2255]},"\\u"],["app",{"sourceInterval":[2256,2264]},"hexDigit",[]],["app",{"sourceInterval":[2265,2273]},"hexDigit",[]],["app",{"sourceInterval":[2274,2282]},"hexDigit",[]],["app",{"sourceInterval":[2283,2291]},"hexDigit",[]]]],"escapeChar_hexEscape":["define",{"sourceInterval":[2316,2371]},null,[],["seq",{"sourceInterval":[2316,2339]},["terminal",{"sourceInterval":[2316,2321]},"\\x"],["app",{"sourceInterval":[2322,2330]},"hexDigit",[]],["app",{"sourceInterval":[2331,2339]},"hexDigit",[]]]],"escapeChar":["define",{"sourceInterval":[1664,2371]},"an escape sequence",[],["alt",{"sourceInterval":[1703,2371]},["app",{"sourceInterval":[1703,1709]},"escapeChar_backslash",[]],["app",{"sourceInterval":[1765,1771]},"escapeChar_doubleQuote",[]],["app",{"sourceInterval":[1829,1835]},"escapeChar_singleQuote",[]],["app",{"sourceInterval":[1893,1898]},"escapeChar_backspace",[]],["app",{"sourceInterval":[1955,1960]},"escapeChar_lineFeed",[]],["app",{"sourceInterval":[2016,2021]},"escapeChar_carriageReturn",[]],["app",{"sourceInterval":[2083,2088]},"escapeChar_tab",[]],["app",{"sourceInterval":[2139,2221]},"escapeChar_unicodeCodePoint",[]],["app",{"sourceInterval":[2250,2291]},"escapeChar_unicodeEscape",[]],["app",{"sourceInterval":[2316,2339]},"escapeChar_hexEscape",[]]]],"space":["extend",{"sourceInterval":[2375,2394]},null,[],["app",{"sourceInterval":[2387,2394]},"comment",[]]],"comment_singleLine":["define",{"sourceInterval":[2412,2458]},null,[],["seq",{"sourceInterval":[2412,2443]},["terminal",{"sourceInterval":[2412,2416]},"//"],["star",{"sourceInterval":[2417,2429]},["seq",{"sourceInterval":[2418,2427]},["not",{"sourceInterval":[2418,2423]},["terminal",{"sourceInterval":[2419,2423]},"\n"]],["app",{"sourceInterval":[2424,2427]},"any",[]]]],["lookahead",{"sourceInterval":[2430,2443]},["alt",{"sourceInterval":[2432,2442]},["terminal",{"sourceInterval":[2432,2436]},"\n"],["app",{"sourceInterval":[2439,2442]},"end",[]]]]]],"comment_multiLine":["define",{"sourceInterval":[2465,2501]},null,[],["seq",{"sourceInterval":[2465,2487]},["terminal",{"sourceInterval":[2465,2469]},"/*"],["star",{"sourceInterval":[2470,2482]},["seq",{"sourceInterval":[2471,2480]},["not",{"sourceInterval":[2471,2476]},["terminal",{"sourceInterval":[2472,2476]},"*/"]],["app",{"sourceInterval":[2477,2480]},"any",[]]]],["terminal",{"sourceInterval":[2483,2487]},"*/"]]],"comment":["define",{"sourceInterval":[2398,2501]},null,[],["alt",{"sourceInterval":[2412,2501]},["app",{"sourceInterval":[2412,2443]},"comment_singleLine",[]],["app",{"sourceInterval":[2465,2487]},"comment_multiLine",[]]]],"tokens":["define",{"sourceInterval":[2505,2520]},null,[],["star",{"sourceInterval":[2514,2520]},["app",{"sourceInterval":[2514,2519]},"token",[]]]],"token":["define",{"sourceInterval":[2524,2600]},null,[],["alt",{"sourceInterval":[2532,2600]},["app",{"sourceInterval":[2532,2540]},"caseName",[]],["app",{"sourceInterval":[2543,2550]},"comment",[]],["app",{"sourceInterval":[2553,2558]},"ident",[]],["app",{"sourceInterval":[2561,2569]},"operator",[]],["app",{"sourceInterval":[2572,2583]},"punctuation",[]],["app",{"sourceInterval":[2586,2594]},"terminal",[]],["app",{"sourceInterval":[2597,2600]},"any",[]]]],"operator":["define",{"sourceInterval":[2604,2669]},null,[],["alt",{"sourceInterval":[2615,2669]},["terminal",{"sourceInterval":[2615,2619]},"<:"],["terminal",{"sourceInterval":[2622,2625]},"="],["terminal",{"sourceInterval":[2628,2632]},":="],["terminal",{"sourceInterval":[2635,2639]},"+="],["terminal",{"sourceInterval":[2642,2645]},"*"],["terminal",{"sourceInterval":[2648,2651]},"+"],["terminal",{"sourceInterval":[2654,2657]},"?"],["terminal",{"sourceInterval":[2660,2663]},"~"],["terminal",{"sourceInterval":[2666,2669]},"&"]]],"punctuation":["define",{"sourceInterval":[2673,2709]},null,[],["alt",{"sourceInterval":[2687,2709]},["terminal",{"sourceInterval":[2687,2690]},"<"],["terminal",{"sourceInterval":[2693,2696]},">"],["terminal",{"sourceInterval":[2699,2702]},","],["terminal",{"sourceInterval":[2705,2709]},"--"]]]}]);

  const superSplicePlaceholder = Object.create(PExpr.prototype);

  function namespaceHas(ns, name) {
    // Look for an enumerable property, anywhere in the prototype chain.
    for (const prop in ns) {
      if (prop === name) return true;
    }
    return false;
  }

  // Returns a Grammar instance (i.e., an object with a `match` method) for
  // `tree`, which is the concrete syntax tree of a user-written grammar.
  // The grammar will be assigned into `namespace` under the name of the grammar
  // as specified in the source.
  function buildGrammar(match, namespace, optOhmGrammarForTesting) {
    const builder = new Builder();
    let decl;
    let currentRuleName;
    let currentRuleFormals;
    let overriding = false;
    const metaGrammar = optOhmGrammarForTesting || ohmGrammar;

    // A visitor that produces a Grammar instance from the CST.
    const helpers = metaGrammar.createSemantics().addOperation('visit', {
      Grammars(grammarIter) {
        return grammarIter.children.map(c => c.visit());
      },
      Grammar(id, s, _open, rules, _close) {
        const grammarName = id.visit();
        decl = builder.newGrammar(grammarName);
        s.child(0) && s.child(0).visit();
        rules.children.map(c => c.visit());
        const g = decl.build();
        g.source = this.source.trimmed();
        if (namespaceHas(namespace, grammarName)) {
          throw duplicateGrammarDeclaration(g);
        }
        namespace[grammarName] = g;
        return g;
      },

      SuperGrammar(_, n) {
        const superGrammarName = n.visit();
        if (superGrammarName === 'null') {
          decl.withSuperGrammar(null);
        } else {
          if (!namespace || !namespaceHas(namespace, superGrammarName)) {
            throw undeclaredGrammar(superGrammarName, namespace, n.source);
          }
          decl.withSuperGrammar(namespace[superGrammarName]);
        }
      },

      Rule_define(n, fs, d, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map(c => c.visit())[0] || [];
        // If there is no default start rule yet, set it now. This must be done before visiting
        // the body, because it might contain an inline rule definition.
        if (!decl.defaultStartRule && decl.ensureSuperGrammar() !== Grammar.ProtoBuiltInRules) {
          decl.withDefaultStartRule(currentRuleName);
        }
        const body = b.visit();
        const description = d.children.map(c => c.visit())[0];
        const source = this.source.trimmed();
        return decl.define(currentRuleName, currentRuleFormals, body, description, source);
      },
      Rule_override(n, fs, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map(c => c.visit())[0] || [];

        const source = this.source.trimmed();
        decl.ensureSuperGrammarRuleForOverriding(currentRuleName, source);

        overriding = true;
        const body = b.visit();
        overriding = false;
        return decl.override(currentRuleName, currentRuleFormals, body, null, source);
      },
      Rule_extend(n, fs, _, b) {
        currentRuleName = n.visit();
        currentRuleFormals = fs.children.map(c => c.visit())[0] || [];
        const body = b.visit();
        const source = this.source.trimmed();
        return decl.extend(currentRuleName, currentRuleFormals, body, null, source);
      },
      RuleBody(_, terms) {
        return builder.alt(...terms.visit()).withSource(this.source);
      },
      OverrideRuleBody(_, terms) {
        const args = terms.visit();

        // Check if the super-splice operator (`...`) appears in the terms.
        const expansionPos = args.indexOf(superSplicePlaceholder);
        if (expansionPos >= 0) {
          const beforeTerms = args.slice(0, expansionPos);
          const afterTerms = args.slice(expansionPos + 1);

          // Ensure it appears no more than once.
          afterTerms.forEach(t => {
            if (t === superSplicePlaceholder) throw multipleSuperSplices(t);
          });

          return new Splice(
              decl.superGrammar,
              currentRuleName,
              beforeTerms,
              afterTerms,
          ).withSource(this.source);
        } else {
          return builder.alt(...args).withSource(this.source);
        }
      },
      Formals(opointy, fs, cpointy) {
        return fs.visit();
      },

      Params(opointy, ps, cpointy) {
        return ps.visit();
      },

      Alt(seqs) {
        return builder.alt(...seqs.visit()).withSource(this.source);
      },

      TopLevelTerm_inline(b, n) {
        const inlineRuleName = currentRuleName + '_' + n.visit();
        const body = b.visit();
        const source = this.source.trimmed();
        const isNewRuleDeclaration = !(
          decl.superGrammar && decl.superGrammar.rules[inlineRuleName]
        );
        if (overriding && !isNewRuleDeclaration) {
          decl.override(inlineRuleName, currentRuleFormals, body, null, source);
        } else {
          decl.define(inlineRuleName, currentRuleFormals, body, null, source);
        }
        const params = currentRuleFormals.map(formal => builder.app(formal));
        return builder.app(inlineRuleName, params).withSource(body.source);
      },
      OverrideTopLevelTerm_superSplice(_) {
        return superSplicePlaceholder;
      },

      Seq(expr) {
        return builder.seq(...expr.children.map(c => c.visit())).withSource(this.source);
      },

      Iter_star(x, _) {
        return builder.star(x.visit()).withSource(this.source);
      },
      Iter_plus(x, _) {
        return builder.plus(x.visit()).withSource(this.source);
      },
      Iter_opt(x, _) {
        return builder.opt(x.visit()).withSource(this.source);
      },

      Pred_not(_, x) {
        return builder.not(x.visit()).withSource(this.source);
      },
      Pred_lookahead(_, x) {
        return builder.lookahead(x.visit()).withSource(this.source);
      },

      Lex_lex(_, x) {
        return builder.lex(x.visit()).withSource(this.source);
      },

      Base_application(rule, ps) {
        const params = ps.children.map(c => c.visit())[0] || [];
        return builder.app(rule.visit(), params).withSource(this.source);
      },
      Base_range(from, _, to) {
        return builder.range(from.visit(), to.visit()).withSource(this.source);
      },
      Base_terminal(expr) {
        return builder.terminal(expr.visit()).withSource(this.source);
      },
      Base_paren(open, x, close) {
        return x.visit();
      },

      ruleDescr(open, t, close) {
        return t.visit();
      },
      ruleDescrText(_) {
        return this.sourceString.trim();
      },

      caseName(_, space1, n, space2, end) {
        return n.visit();
      },

      name(first, rest) {
        return this.sourceString;
      },
      nameFirst(expr) {},
      nameRest(expr) {},

      terminal(open, cs, close) {
        return cs.children.map(c => c.visit()).join('');
      },

      oneCharTerminal(open, c, close) {
        return c.visit();
      },

      escapeChar(c) {
        try {
          return unescapeCodePoint(this.sourceString);
        } catch (err) {
          if (err instanceof RangeError && err.message.startsWith('Invalid code point ')) {
            throw invalidCodePoint(c);
          }
          throw err; // Rethrow
        }
      },

      NonemptyListOf(x, _, xs) {
        return [x.visit()].concat(xs.children.map(c => c.visit()));
      },
      EmptyListOf() {
        return [];
      },

      _terminal() {
        return this.sourceString;
      },
    });
    return helpers(match).visit();
  }

  var operationsAndAttributesGrammar = makeRecipe(["grammar",{"source":"OperationsAndAttributes {\n\n  AttributeSignature =\n    name\n\n  OperationSignature =\n    name Formals?\n\n  Formals\n    = \"(\" ListOf<name, \",\"> \")\"\n\n  name  (a name)\n    = nameFirst nameRest*\n\n  nameFirst\n    = \"_\"\n    | letter\n\n  nameRest\n    = \"_\"\n    | alnum\n\n}"},"OperationsAndAttributes",null,"AttributeSignature",{"AttributeSignature":["define",{"sourceInterval":[29,58]},null,[],["app",{"sourceInterval":[54,58]},"name",[]]],"OperationSignature":["define",{"sourceInterval":[62,100]},null,[],["seq",{"sourceInterval":[87,100]},["app",{"sourceInterval":[87,91]},"name",[]],["opt",{"sourceInterval":[92,100]},["app",{"sourceInterval":[92,99]},"Formals",[]]]]],"Formals":["define",{"sourceInterval":[104,143]},null,[],["seq",{"sourceInterval":[118,143]},["terminal",{"sourceInterval":[118,121]},"("],["app",{"sourceInterval":[122,139]},"ListOf",[["app",{"sourceInterval":[129,133]},"name",[]],["terminal",{"sourceInterval":[135,138]},","]]],["terminal",{"sourceInterval":[140,143]},")"]]],"name":["define",{"sourceInterval":[147,187]},"a name",[],["seq",{"sourceInterval":[168,187]},["app",{"sourceInterval":[168,177]},"nameFirst",[]],["star",{"sourceInterval":[178,187]},["app",{"sourceInterval":[178,186]},"nameRest",[]]]]],"nameFirst":["define",{"sourceInterval":[191,223]},null,[],["alt",{"sourceInterval":[207,223]},["terminal",{"sourceInterval":[207,210]},"_"],["app",{"sourceInterval":[217,223]},"letter",[]]]],"nameRest":["define",{"sourceInterval":[227,257]},null,[],["alt",{"sourceInterval":[242,257]},["terminal",{"sourceInterval":[242,245]},"_"],["app",{"sourceInterval":[252,257]},"alnum",[]]]]}]);

  initBuiltInSemantics(Grammar.BuiltInRules);
  initPrototypeParser(operationsAndAttributesGrammar); // requires BuiltInSemantics

  function initBuiltInSemantics(builtInRules) {
    const actions = {
      empty() {
        return this.iteration();
      },
      nonEmpty(first, _, rest) {
        return this.iteration([first].concat(rest.children));
      },
      self(..._children) {
        return this;
      },
    };

    Semantics.BuiltInSemantics = Semantics.createSemantics(builtInRules, null).addOperation(
        'asIteration',
        {
          emptyListOf: actions.empty,
          nonemptyListOf: actions.nonEmpty,
          EmptyListOf: actions.empty,
          NonemptyListOf: actions.nonEmpty,
          _iter: actions.self,
        },
    );
  }

  function initPrototypeParser(grammar) {
    Semantics.prototypeGrammarSemantics = grammar.createSemantics().addOperation('parse', {
      AttributeSignature(name) {
        return {
          name: name.parse(),
          formals: [],
        };
      },
      OperationSignature(name, optFormals) {
        return {
          name: name.parse(),
          formals: optFormals.children.map(c => c.parse())[0] || [],
        };
      },
      Formals(oparen, fs, cparen) {
        return fs.asIteration().children.map(c => c.parse());
      },
      name(first, rest) {
        return this.sourceString;
      },
    });
    Semantics.prototypeGrammar = grammar;
  }

  function findIndentation(input) {
    let pos = 0;
    const stack = [0];
    const topOfStack = () => stack[stack.length - 1];

    const result = {};

    const regex = /( *).*(?:$|\r?\n|\r)/g;
    let match;
    while ((match = regex.exec(input)) != null) {
      const [line, indent] = match;

      // The last match will always have length 0. In every other case, some
      // characters will be matched (possibly only the end of line chars).
      if (line.length === 0) break;

      const indentSize = indent.length;
      const prevSize = topOfStack();

      const indentPos = pos + indentSize;

      if (indentSize > prevSize) {
        // Indent -- always only 1.
        stack.push(indentSize);
        result[indentPos] = 1;
      } else if (indentSize < prevSize) {
        // Dedent -- can be multiple levels.
        const prevLength = stack.length;
        while (topOfStack() !== indentSize) {
          stack.pop();
        }
        result[indentPos] = -1 * (prevLength - stack.length);
      }
      pos += line.length;
    }
    // Ensure that there is a matching DEDENT for every remaining INDENT.
    if (stack.length > 1) {
      result[pos] = 1 - stack.length;
    }
    return result;
  }

  const INDENT_DESCRIPTION = 'an indented block';
  const DEDENT_DESCRIPTION = 'a dedent';

  // A sentinel value that is out of range for both charCodeAt() and codePointAt().
  const INVALID_CODE_POINT = 0x10ffff + 1;

  class InputStreamWithIndentation extends InputStream {
    constructor(state) {
      super(state.input);
      this.state = state;
    }

    _indentationAt(pos) {
      return this.state.userData[pos] || 0;
    }

    atEnd() {
      return super.atEnd() && this._indentationAt(this.pos) === 0;
    }

    next() {
      if (this._indentationAt(this.pos) !== 0) {
        this.examinedLength = Math.max(this.examinedLength, this.pos);
        return undefined;
      }
      return super.next();
    }

    nextCharCode() {
      if (this._indentationAt(this.pos) !== 0) {
        this.examinedLength = Math.max(this.examinedLength, this.pos);
        return INVALID_CODE_POINT;
      }
      return super.nextCharCode();
    }

    nextCodePoint() {
      if (this._indentationAt(this.pos) !== 0) {
        this.examinedLength = Math.max(this.examinedLength, this.pos);
        return INVALID_CODE_POINT;
      }
      return super.nextCodePoint();
    }
  }

  class Indentation extends PExpr {
    constructor(isIndent = true) {
      super();
      this.isIndent = isIndent;
    }

    allowsSkippingPrecedingSpace() {
      return true;
    }

    eval(state) {
      const {inputStream} = state;
      const pseudoTokens = state.userData;
      state.doNotMemoize = true;

      const origPos = inputStream.pos;

      const sign = this.isIndent ? 1 : -1;
      const count = (pseudoTokens[origPos] || 0) * sign;
      if (count > 0) {
        // Update the count to consume the pseudotoken.
        state.userData = Object.create(pseudoTokens);
        state.userData[origPos] -= sign;

        state.pushBinding(new TerminalNode(0), origPos);
        return true;
      } else {
        state.processFailure(origPos, this);
        return false;
      }
    }

    getArity() {
      return 1;
    }

    _assertAllApplicationsAreValid(ruleName, grammar) {}

    _isNullable(grammar, memo) {
      return false;
    }

    assertChoicesHaveUniformArity(ruleName) {}

    assertIteratedExprsAreNotNullable(grammar) {}

    introduceParams(formals) {
      return this;
    }

    substituteParams(actuals) {
      return this;
    }

    toString() {
      return this.isIndent ? 'indent' : 'dedent';
    }

    toDisplayString() {
      return this.toString();
    }

    toFailure(grammar) {
      const description = this.isIndent ? INDENT_DESCRIPTION : DEDENT_DESCRIPTION;
      return new Failure(this, description, 'description');
    }
  }

  // Create a new definition for `any` that can consume indent & dedent.
  const applyIndent = new Apply('indent');
  const applyDedent = new Apply('dedent');
  const newAnyBody = new Splice(BuiltInRules, 'any', [applyIndent, applyDedent], []);

  const IndentationSensitive = new Builder()
      .newGrammar('IndentationSensitive')
      .withSuperGrammar(BuiltInRules)
      .define('indent', [], new Indentation(true), INDENT_DESCRIPTION, undefined, true)
      .define('dedent', [], new Indentation(false), DEDENT_DESCRIPTION, undefined, true)
      .extend('any', [], newAnyBody, 'any character', undefined)
      .build();

  Object.assign(IndentationSensitive, {
    _matchStateInitializer(state) {
      state.userData = findIndentation(state.input);
      state.inputStream = new InputStreamWithIndentation(state);
    },
    supportsIncrementalParsing: false,
  });

  // Generated by scripts/prebuild.js
  const version = '17.2.1';

  Grammar.initApplicationParser(ohmGrammar, buildGrammar);

  const isBuffer = obj =>
    !!obj.constructor &&
    typeof obj.constructor.isBuffer === 'function' &&
    obj.constructor.isBuffer(obj);

  function compileAndLoad(source, namespace) {
    const m = ohmGrammar.match(source, 'Grammars');
    if (m.failed()) {
      throw grammarSyntaxError(m);
    }
    return buildGrammar(m, namespace);
  }

  function grammar(source, optNamespace) {
    const ns = grammars(source, optNamespace);

    // Ensure that the source contained no more than one grammar definition.
    const grammarNames = Object.keys(ns);
    if (grammarNames.length === 0) {
      throw new Error('Missing grammar definition');
    } else if (grammarNames.length > 1) {
      const secondGrammar = ns[grammarNames[1]];
      const interval = secondGrammar.source;
      throw new Error(
          getLineAndColumnMessage(interval.sourceString, interval.startIdx) +
          'Found more than one grammar definition -- use ohm.grammars() instead.',
      );
    }
    return ns[grammarNames[0]]; // Return the one and only grammar.
  }

  function grammars(source, optNamespace) {
    const ns = Object.create(optNamespace || {});
    if (typeof source !== 'string') {
      // For convenience, detect Node.js Buffer objects and automatically call toString().
      if (isBuffer(source)) {
        source = source.toString();
      } else {
        throw new TypeError(
            'Expected string as first argument, got ' + unexpectedObjToString(source),
        );
      }
    }
    compileAndLoad(source, ns);
    return ns;
  }

  exports.ExperimentalIndentationSensitive = IndentationSensitive;
  exports._buildGrammar = buildGrammar;
  exports.grammar = grammar;
  exports.grammars = grammars;
  exports.makeRecipe = makeRecipe;
  exports.ohmGrammar = ohmGrammar;
  exports.pexprs = pexprs;
  exports.version = version;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2htLmpzIiwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uLmpzIiwiLi4vc3JjL1VuaWNvZGVDYXRlZ29yaWVzLmpzIiwiLi4vc3JjL3BleHBycy1tYWluLmpzIiwiLi4vc3JjL2Vycm9ycy5qcyIsIi4uL3NyYy91dGlsLmpzIiwiLi4vc3JjL0ludGVydmFsLmpzIiwiLi4vc3JjL0lucHV0U3RyZWFtLmpzIiwiLi4vc3JjL01hdGNoUmVzdWx0LmpzIiwiLi4vc3JjL1Bvc0luZm8uanMiLCIuLi9zcmMvVHJhY2UuanMiLCIuLi9zcmMvcGV4cHJzLWFsbG93c1NraXBwaW5nUHJlY2VkaW5nU3BhY2UuanMiLCIuLi9zcmMvcGV4cHJzLWFzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkLmpzIiwiLi4vc3JjL3BleHBycy1hc3NlcnRDaG9pY2VzSGF2ZVVuaWZvcm1Bcml0eS5qcyIsIi4uL3NyYy9wZXhwcnMtYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlLmpzIiwiLi4vc3JjL25vZGVzLmpzIiwiLi4vc3JjL3BleHBycy1ldmFsLmpzIiwiLi4vc3JjL3BleHBycy1nZXRBcml0eS5qcyIsIi4uL3NyYy9wZXhwcnMtb3V0cHV0UmVjaXBlLmpzIiwiLi4vc3JjL3BleHBycy1pbnRyb2R1Y2VQYXJhbXMuanMiLCIuLi9zcmMvcGV4cHJzLWlzTnVsbGFibGUuanMiLCIuLi9zcmMvcGV4cHJzLXN1YnN0aXR1dGVQYXJhbXMuanMiLCIuLi9zcmMvcGV4cHJzLXRvQXJndW1lbnROYW1lTGlzdC5qcyIsIi4uL3NyYy9wZXhwcnMtdG9EaXNwbGF5U3RyaW5nLmpzIiwiLi4vc3JjL0ZhaWx1cmUuanMiLCIuLi9zcmMvcGV4cHJzLXRvRmFpbHVyZS5qcyIsIi4uL3NyYy9wZXhwcnMtdG9TdHJpbmcuanMiLCIuLi9zcmMvQ2FzZUluc2Vuc2l0aXZlVGVybWluYWwuanMiLCIuLi9zcmMvcGV4cHJzLmpzIiwiLi4vc3JjL01hdGNoU3RhdGUuanMiLCIuLi9zcmMvTWF0Y2hlci5qcyIsIi4uL3NyYy9TZW1hbnRpY3MuanMiLCIuLi9zcmMvR3JhbW1hci5qcyIsIi4uL3NyYy9HcmFtbWFyRGVjbC5qcyIsIi4uL3NyYy9CdWlsZGVyLmpzIiwiLi4vc3JjL21ha2VSZWNpcGUuanMiLCJidWlsdC1pbi1ydWxlcy5qcyIsIi4uL3NyYy9tYWluLWtlcm5lbC5qcyIsIm9obS1ncmFtbWFyLmpzIiwiLi4vc3JjL2J1aWxkR3JhbW1hci5qcyIsIm9wZXJhdGlvbnMtYW5kLWF0dHJpYnV0ZXMuanMiLCIuLi9zcmMvc2VtYW50aWNzRGVmZXJyZWRJbml0LmpzIiwiLi4vc3JjL2ZpbmRJbmRlbnRhdGlvbi5qcyIsIi4uL3NyYy9JbmRlbnRhdGlvblNlbnNpdGl2ZS5qcyIsIi4uL3NyYy92ZXJzaW9uLmpzIiwiLi4vc3JjL21haW4uanMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgU3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEhlbHBlcnNcblxuY29uc3QgZXNjYXBlU3RyaW5nRm9yID0ge307XG5mb3IgKGxldCBjID0gMDsgYyA8IDEyODsgYysrKSB7XG4gIGVzY2FwZVN0cmluZ0ZvcltjXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUoYyk7XG59XG5lc2NhcGVTdHJpbmdGb3JbXCInXCIuY2hhckNvZGVBdCgwKV0gPSBcIlxcXFwnXCI7XG5lc2NhcGVTdHJpbmdGb3JbJ1wiJy5jaGFyQ29kZUF0KDApXSA9ICdcXFxcXCInO1xuZXNjYXBlU3RyaW5nRm9yWydcXFxcJy5jaGFyQ29kZUF0KDApXSA9ICdcXFxcXFxcXCc7XG5lc2NhcGVTdHJpbmdGb3JbJ1xcYicuY2hhckNvZGVBdCgwKV0gPSAnXFxcXGInO1xuZXNjYXBlU3RyaW5nRm9yWydcXGYnLmNoYXJDb2RlQXQoMCldID0gJ1xcXFxmJztcbmVzY2FwZVN0cmluZ0ZvclsnXFxuJy5jaGFyQ29kZUF0KDApXSA9ICdcXFxcbic7XG5lc2NhcGVTdHJpbmdGb3JbJ1xccicuY2hhckNvZGVBdCgwKV0gPSAnXFxcXHInO1xuZXNjYXBlU3RyaW5nRm9yWydcXHQnLmNoYXJDb2RlQXQoMCldID0gJ1xcXFx0JztcbmVzY2FwZVN0cmluZ0ZvclsnXFx1MDAwYicuY2hhckNvZGVBdCgwKV0gPSAnXFxcXHYnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXhwb3J0c1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIGFic3RyYWN0KG9wdE1ldGhvZE5hbWUpIHtcbiAgY29uc3QgbWV0aG9kTmFtZSA9IG9wdE1ldGhvZE5hbWUgfHwgJyc7XG4gIHJldHVybiBmdW5jdGlvbigpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICd0aGlzIG1ldGhvZCAnICtcbiAgICAgICAgbWV0aG9kTmFtZSArXG4gICAgICAgICcgaXMgYWJzdHJhY3QhICcgK1xuICAgICAgICAnKGl0IGhhcyBubyBpbXBsZW1lbnRhdGlvbiBpbiBjbGFzcyAnICtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICtcbiAgICAgICAgJyknLFxuICAgICk7XG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnQoY29uZCwgbWVzc2FnZSkge1xuICBpZiAoIWNvbmQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSB8fCAnQXNzZXJ0aW9uIGZhaWxlZCcpO1xuICB9XG59XG5cbi8vIERlZmluZSBhIGxhemlseS1jb21wdXRlZCwgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgbmFtZWQgYHByb3BOYW1lYFxuLy8gb24gdGhlIG9iamVjdCBgb2JqYC4gYGdldHRlckZuYCB3aWxsIGJlIGNhbGxlZCB0byBjb21wdXRlIHRoZSB2YWx1ZSB0aGVcbi8vIGZpcnN0IHRpbWUgdGhlIHByb3BlcnR5IGlzIGFjY2Vzc2VkLlxuZXhwb3J0IGZ1bmN0aW9uIGRlZmluZUxhenlQcm9wZXJ0eShvYmosIHByb3BOYW1lLCBnZXR0ZXJGbikge1xuICBsZXQgbWVtbztcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KG9iaiwgcHJvcE5hbWUsIHtcbiAgICBnZXQoKSB7XG4gICAgICBpZiAoIW1lbW8pIHtcbiAgICAgICAgbWVtbyA9IGdldHRlckZuLmNhbGwodGhpcyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWVtbztcbiAgICB9LFxuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNsb25lKG9iaikge1xuICBpZiAob2JqKSB7XG4gICAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe30sIG9iaik7XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdEZuKGZuLCBuKSB7XG4gIGNvbnN0IGFyciA9IFtdO1xuICB3aGlsZSAobi0tID4gMCkge1xuICAgIGFyci5wdXNoKGZuKCkpO1xuICB9XG4gIHJldHVybiBhcnI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXBlYXRTdHIoc3RyLCBuKSB7XG4gIHJldHVybiBuZXcgQXJyYXkobiArIDEpLmpvaW4oc3RyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlcGVhdCh4LCBuKSB7XG4gIHJldHVybiByZXBlYXRGbigoKSA9PiB4LCBuKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldER1cGxpY2F0ZXMoYXJyYXkpIHtcbiAgY29uc3QgZHVwbGljYXRlcyA9IFtdO1xuICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCBhcnJheS5sZW5ndGg7IGlkeCsrKSB7XG4gICAgY29uc3QgeCA9IGFycmF5W2lkeF07XG4gICAgaWYgKGFycmF5Lmxhc3RJbmRleE9mKHgpICE9PSBpZHggJiYgZHVwbGljYXRlcy5pbmRleE9mKHgpIDwgMCkge1xuICAgICAgZHVwbGljYXRlcy5wdXNoKHgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZHVwbGljYXRlcztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvcHlXaXRob3V0RHVwbGljYXRlcyhhcnJheSkge1xuICBjb25zdCBub0R1cGxpY2F0ZXMgPSBbXTtcbiAgYXJyYXkuZm9yRWFjaChlbnRyeSA9PiB7XG4gICAgaWYgKG5vRHVwbGljYXRlcy5pbmRleE9mKGVudHJ5KSA8IDApIHtcbiAgICAgIG5vRHVwbGljYXRlcy5wdXNoKGVudHJ5KTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gbm9EdXBsaWNhdGVzO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTeW50YWN0aWMocnVsZU5hbWUpIHtcbiAgY29uc3QgZmlyc3RDaGFyID0gcnVsZU5hbWVbMF07XG4gIHJldHVybiBmaXJzdENoYXIgPT09IGZpcnN0Q2hhci50b1VwcGVyQ2FzZSgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNMZXhpY2FsKHJ1bGVOYW1lKSB7XG4gIHJldHVybiAhaXNTeW50YWN0aWMocnVsZU5hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkTGVmdChzdHIsIGxlbiwgb3B0Q2hhcikge1xuICBjb25zdCBjaCA9IG9wdENoYXIgfHwgJyAnO1xuICBpZiAoc3RyLmxlbmd0aCA8IGxlbikge1xuICAgIHJldHVybiByZXBlYXRTdHIoY2gsIGxlbiAtIHN0ci5sZW5ndGgpICsgc3RyO1xuICB9XG4gIHJldHVybiBzdHI7XG59XG5cbi8vIFN0cmluZ0J1ZmZlclxuXG5leHBvcnQgZnVuY3Rpb24gU3RyaW5nQnVmZmVyKCkge1xuICB0aGlzLnN0cmluZ3MgPSBbXTtcbn1cblxuU3RyaW5nQnVmZmVyLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihzdHIpIHtcbiAgdGhpcy5zdHJpbmdzLnB1c2goc3RyKTtcbn07XG5cblN0cmluZ0J1ZmZlci5wcm90b3R5cGUuY29udGVudHMgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuc3RyaW5ncy5qb2luKCcnKTtcbn07XG5cbmNvbnN0IGVzY2FwZVVuaWNvZGUgPSBzdHIgPT4gU3RyaW5nLmZyb21Db2RlUG9pbnQocGFyc2VJbnQoc3RyLCAxNikpO1xuXG5leHBvcnQgZnVuY3Rpb24gdW5lc2NhcGVDb2RlUG9pbnQocykge1xuICBpZiAocy5jaGFyQXQoMCkgPT09ICdcXFxcJykge1xuICAgIHN3aXRjaCAocy5jaGFyQXQoMSkpIHtcbiAgICAgIGNhc2UgJ2InOlxuICAgICAgICByZXR1cm4gJ1xcYic7XG4gICAgICBjYXNlICdmJzpcbiAgICAgICAgcmV0dXJuICdcXGYnO1xuICAgICAgY2FzZSAnbic6XG4gICAgICAgIHJldHVybiAnXFxuJztcbiAgICAgIGNhc2UgJ3InOlxuICAgICAgICByZXR1cm4gJ1xccic7XG4gICAgICBjYXNlICd0JzpcbiAgICAgICAgcmV0dXJuICdcXHQnO1xuICAgICAgY2FzZSAndic6XG4gICAgICAgIHJldHVybiAnXFx2JztcbiAgICAgIGNhc2UgJ3gnOlxuICAgICAgICByZXR1cm4gZXNjYXBlVW5pY29kZShzLnNsaWNlKDIsIDQpKTtcbiAgICAgIGNhc2UgJ3UnOlxuICAgICAgICByZXR1cm4gcy5jaGFyQXQoMikgPT09ICd7JyA/XG4gICAgICAgICAgZXNjYXBlVW5pY29kZShzLnNsaWNlKDMsIC0xKSkgOlxuICAgICAgICAgIGVzY2FwZVVuaWNvZGUocy5zbGljZSgyLCA2KSk7XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gcy5jaGFyQXQoMSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiBzO1xuICB9XG59XG5cbi8vIEhlbHBlciBmb3IgcHJvZHVjaW5nIGEgZGVzY3JpcHRpb24gb2YgYW4gdW5rbm93biBvYmplY3QgaW4gYSBzYWZlIHdheS5cbi8vIEVzcGVjaWFsbHkgdXNlZnVsIGZvciBlcnJvciBtZXNzYWdlcyB3aGVyZSBhbiB1bmV4cGVjdGVkIHR5cGUgb2Ygb2JqZWN0IHdhcyBlbmNvdW50ZXJlZC5cbmV4cG9ydCBmdW5jdGlvbiB1bmV4cGVjdGVkT2JqVG9TdHJpbmcob2JqKSB7XG4gIGlmIChvYmogPT0gbnVsbCkge1xuICAgIHJldHVybiBTdHJpbmcob2JqKTtcbiAgfVxuICBjb25zdCBiYXNlVG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKTtcbiAgdHJ5IHtcbiAgICBsZXQgdHlwZU5hbWU7XG4gICAgaWYgKG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IubmFtZSkge1xuICAgICAgdHlwZU5hbWUgPSBvYmouY29uc3RydWN0b3IubmFtZTtcbiAgICB9IGVsc2UgaWYgKGJhc2VUb1N0cmluZy5pbmRleE9mKCdbb2JqZWN0ICcpID09PSAwKSB7XG4gICAgICB0eXBlTmFtZSA9IGJhc2VUb1N0cmluZy5zbGljZSg4LCAtMSk7IC8vIEV4dHJhY3QgZS5nLiBcIkFycmF5XCIgZnJvbSBcIltvYmplY3QgQXJyYXldXCIuXG4gICAgfSBlbHNlIHtcbiAgICAgIHR5cGVOYW1lID0gdHlwZW9mIG9iajtcbiAgICB9XG4gICAgcmV0dXJuIHR5cGVOYW1lICsgJzogJyArIEpTT04uc3RyaW5naWZ5KFN0cmluZyhvYmopKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiBiYXNlVG9TdHJpbmc7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm90TnVsbChvYmosIG1lc3NhZ2UgPSAndW5leHBlY3RlZCBudWxsIHZhbHVlJykge1xuICBpZiAob2JqID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gIH1cbiAgcmV0dXJuIG9iajtcbn1cbiIsIi8vIFRoZXNlIGFyZSBqdXN0IGNhdGVnb3JpZXMgdGhhdCBhcmUgdXNlZCBpbiBFUzUvRVMyMDE1LlxuLy8gVGhlIGZ1bGwgbGlzdCBvZiBVbmljb2RlIGNhdGVnb3JpZXMgaXMgaGVyZTogaHR0cDovL3d3dy5maWxlZm9ybWF0LmluZm8vaW5mby91bmljb2RlL2NhdGVnb3J5L2luZGV4Lmh0bS5cbmV4cG9ydCBjb25zdCBVbmljb2RlQ2F0ZWdvcmllcyA9IHtcbiAgLy8gTGV0dGVyc1xuICBMdTogL1xccHtMdX0vdSxcbiAgTGw6IC9cXHB7TGx9L3UsXG4gIEx0OiAvXFxwe0x0fS91LFxuICBMbTogL1xccHtMbX0vdSxcbiAgTG86IC9cXHB7TG99L3UsXG5cbiAgLy8gTnVtYmVyc1xuICBObDogL1xccHtObH0vdSxcbiAgTmQ6IC9cXHB7TmR9L3UsXG5cbiAgLy8gTWFya3NcbiAgTW46IC9cXHB7TW59L3UsXG4gIE1jOiAvXFxwe01jfS91LFxuXG4gIC8vIFB1bmN0dWF0aW9uLCBDb25uZWN0b3JcbiAgUGM6IC9cXHB7UGN9L3UsXG5cbiAgLy8gU2VwYXJhdG9yLCBTcGFjZVxuICBaczogL1xccHtac30vdSxcblxuICAvLyBUaGVzZSB0d28gYXJlIG5vdCByZWFsIFVuaWNvZGUgY2F0ZWdvcmllcywgYnV0IG91ciB1c2VmdWwgZm9yIE9obS5cbiAgLy8gTCBpcyBhIGNvbWJpbmF0aW9uIG9mIGFsbCB0aGUgbGV0dGVyIGNhdGVnb3JpZXMuXG4gIC8vIEx0bW8gaXMgYSBjb21iaW5hdGlvbiBvZiBMdCwgTG0sIGFuZCBMby5cbiAgTDogL1xccHtMZXR0ZXJ9L3UsXG4gIEx0bW86IC9cXHB7THR9fFxccHtMbX18XFxwe0xvfS91LFxufTtcbiIsImltcG9ydCB7VW5pY29kZUNhdGVnb3JpZXN9IGZyb20gJy4vVW5pY29kZUNhdGVnb3JpZXMuanMnO1xuaW1wb3J0ICogYXMgY29tbW9uIGZyb20gJy4vY29tbW9uLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEdlbmVyYWwgc3R1ZmZcblxuZXhwb3J0IGNsYXNzIFBFeHByIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKHRoaXMuY29uc3RydWN0b3IgPT09IFBFeHByKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQRXhwciBjYW5ub3QgYmUgaW5zdGFudGlhdGVkIC0tIGl0J3MgYWJzdHJhY3RcIik7XG4gICAgfVxuICB9XG5cbiAgLy8gU2V0IHRoZSBgc291cmNlYCBwcm9wZXJ0eSB0byB0aGUgaW50ZXJ2YWwgY29udGFpbmluZyB0aGUgc291cmNlIGZvciB0aGlzIGV4cHJlc3Npb24uXG4gIHdpdGhTb3VyY2UoaW50ZXJ2YWwpIHtcbiAgICBpZiAoaW50ZXJ2YWwpIHtcbiAgICAgIHRoaXMuc291cmNlID0gaW50ZXJ2YWwudHJpbW1lZCgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG4vLyBBbnlcblxuZXhwb3J0IGNvbnN0IGFueSA9IE9iamVjdC5jcmVhdGUoUEV4cHIucHJvdG90eXBlKTtcblxuLy8gRW5kXG5cbmV4cG9ydCBjb25zdCBlbmQgPSBPYmplY3QuY3JlYXRlKFBFeHByLnByb3RvdHlwZSk7XG5cbi8vIFRlcm1pbmFsc1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWwgZXh0ZW5kcyBQRXhwciB7XG4gIGNvbnN0cnVjdG9yKG9iaikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5vYmogPSBvYmo7XG4gIH1cbn1cblxuLy8gUmFuZ2VzXG5cbmV4cG9ydCBjbGFzcyBSYW5nZSBleHRlbmRzIFBFeHByIHtcbiAgY29uc3RydWN0b3IoZnJvbSwgdG8pIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuZnJvbSA9IGZyb207XG4gICAgdGhpcy50byA9IHRvO1xuICAgIC8vIElmIGVpdGhlciBgZnJvbWAgb3IgYHRvYCBpcyBtYWRlIHVwIG9mIG11bHRpcGxlIGNvZGUgdW5pdHMsIHRoZW5cbiAgICAvLyB0aGUgcmFuZ2Ugc2hvdWxkIGNvbnN1bWUgYSBmdWxsIGNvZGUgcG9pbnQsIG5vdCBhIHNpbmdsZSBjb2RlIHVuaXQuXG4gICAgdGhpcy5tYXRjaENvZGVQb2ludCA9IGZyb20ubGVuZ3RoID4gMSB8fCB0by5sZW5ndGggPiAxO1xuICB9XG59XG5cbi8vIFBhcmFtZXRlcnNcblxuZXhwb3J0IGNsYXNzIFBhcmFtIGV4dGVuZHMgUEV4cHIge1xuICBjb25zdHJ1Y3RvcihpbmRleCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5pbmRleCA9IGluZGV4O1xuICB9XG59XG5cbi8vIEFsdGVybmF0aW9uXG5cbmV4cG9ydCBjbGFzcyBBbHQgZXh0ZW5kcyBQRXhwciB7XG4gIGNvbnN0cnVjdG9yKHRlcm1zKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnRlcm1zID0gdGVybXM7XG4gIH1cbn1cblxuLy8gRXh0ZW5kIGlzIGFuIGltcGxlbWVudGF0aW9uIGRldGFpbCBvZiBydWxlIGV4dGVuc2lvblxuXG5leHBvcnQgY2xhc3MgRXh0ZW5kIGV4dGVuZHMgQWx0IHtcbiAgY29uc3RydWN0b3Ioc3VwZXJHcmFtbWFyLCBuYW1lLCBib2R5KSB7XG4gICAgY29uc3Qgb3JpZ0JvZHkgPSBzdXBlckdyYW1tYXIucnVsZXNbbmFtZV0uYm9keTtcbiAgICBzdXBlcihbYm9keSwgb3JpZ0JvZHldKTtcblxuICAgIHRoaXMuc3VwZXJHcmFtbWFyID0gc3VwZXJHcmFtbWFyO1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgfVxufVxuXG4vLyBTcGxpY2UgaXMgYW4gaW1wbGVtZW50YXRpb24gZGV0YWlsIG9mIHJ1bGUgb3ZlcnJpZGluZyB3aXRoIHRoZSBgLi4uYCBvcGVyYXRvci5cbmV4cG9ydCBjbGFzcyBTcGxpY2UgZXh0ZW5kcyBBbHQge1xuICBjb25zdHJ1Y3RvcihzdXBlckdyYW1tYXIsIHJ1bGVOYW1lLCBiZWZvcmVUZXJtcywgYWZ0ZXJUZXJtcykge1xuICAgIGNvbnN0IG9yaWdCb2R5ID0gc3VwZXJHcmFtbWFyLnJ1bGVzW3J1bGVOYW1lXS5ib2R5O1xuICAgIHN1cGVyKFsuLi5iZWZvcmVUZXJtcywgb3JpZ0JvZHksIC4uLmFmdGVyVGVybXNdKTtcblxuICAgIHRoaXMuc3VwZXJHcmFtbWFyID0gc3VwZXJHcmFtbWFyO1xuICAgIHRoaXMucnVsZU5hbWUgPSBydWxlTmFtZTtcbiAgICB0aGlzLmV4cGFuc2lvblBvcyA9IGJlZm9yZVRlcm1zLmxlbmd0aDtcbiAgfVxufVxuXG4vLyBTZXF1ZW5jZXNcblxuZXhwb3J0IGNsYXNzIFNlcSBleHRlbmRzIFBFeHByIHtcbiAgY29uc3RydWN0b3IoZmFjdG9ycykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5mYWN0b3JzID0gZmFjdG9ycztcbiAgfVxufVxuXG4vLyBJdGVyYXRvcnMgYW5kIG9wdGlvbmFsc1xuXG5leHBvcnQgY2xhc3MgSXRlciBleHRlbmRzIFBFeHByIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3RhciBleHRlbmRzIEl0ZXIge31cbmV4cG9ydCBjbGFzcyBQbHVzIGV4dGVuZHMgSXRlciB7fVxuZXhwb3J0IGNsYXNzIE9wdCBleHRlbmRzIEl0ZXIge31cblxuU3Rhci5wcm90b3R5cGUub3BlcmF0b3IgPSAnKic7XG5QbHVzLnByb3RvdHlwZS5vcGVyYXRvciA9ICcrJztcbk9wdC5wcm90b3R5cGUub3BlcmF0b3IgPSAnPyc7XG5cblN0YXIucHJvdG90eXBlLm1pbk51bU1hdGNoZXMgPSAwO1xuUGx1cy5wcm90b3R5cGUubWluTnVtTWF0Y2hlcyA9IDE7XG5PcHQucHJvdG90eXBlLm1pbk51bU1hdGNoZXMgPSAwO1xuXG5TdGFyLnByb3RvdHlwZS5tYXhOdW1NYXRjaGVzID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuUGx1cy5wcm90b3R5cGUubWF4TnVtTWF0Y2hlcyA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbk9wdC5wcm90b3R5cGUubWF4TnVtTWF0Y2hlcyA9IDE7XG5cbi8vIFByZWRpY2F0ZXNcblxuZXhwb3J0IGNsYXNzIE5vdCBleHRlbmRzIFBFeHByIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgTG9va2FoZWFkIGV4dGVuZHMgUEV4cHIge1xuICBjb25zdHJ1Y3RvcihleHByKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmV4cHIgPSBleHByO1xuICB9XG59XG5cbi8vIFwiTGV4aWZpY2F0aW9uXCJcblxuZXhwb3J0IGNsYXNzIExleCBleHRlbmRzIFBFeHByIHtcbiAgY29uc3RydWN0b3IoZXhwcikge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgfVxufVxuXG4vLyBSdWxlIGFwcGxpY2F0aW9uXG5cbmV4cG9ydCBjbGFzcyBBcHBseSBleHRlbmRzIFBFeHByIHtcbiAgY29uc3RydWN0b3IocnVsZU5hbWUsIGFyZ3MgPSBbXSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5ydWxlTmFtZSA9IHJ1bGVOYW1lO1xuICAgIHRoaXMuYXJncyA9IGFyZ3M7XG4gIH1cblxuICBpc1N5bnRhY3RpYygpIHtcbiAgICByZXR1cm4gY29tbW9uLmlzU3ludGFjdGljKHRoaXMucnVsZU5hbWUpO1xuICB9XG5cbiAgLy8gVGhpcyBtZXRob2QganVzdCBjYWNoZXMgdGhlIHJlc3VsdCBvZiBgdGhpcy50b1N0cmluZygpYCBpbiBhIG5vbi1lbnVtZXJhYmxlIHByb3BlcnR5LlxuICB0b01lbW9LZXkoKSB7XG4gICAgaWYgKCF0aGlzLl9tZW1vS2V5KSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ19tZW1vS2V5Jywge3ZhbHVlOiB0aGlzLnRvU3RyaW5nKCl9KTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX21lbW9LZXk7XG4gIH1cbn1cblxuLy8gVW5pY29kZSBjaGFyYWN0ZXJcblxuZXhwb3J0IGNsYXNzIFVuaWNvZGVDaGFyIGV4dGVuZHMgUEV4cHIge1xuICBjb25zdHJ1Y3RvcihjYXRlZ29yeSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5jYXRlZ29yeSA9IGNhdGVnb3J5O1xuICAgIHRoaXMucGF0dGVybiA9IFVuaWNvZGVDYXRlZ29yaWVzW2NhdGVnb3J5XTtcbiAgfVxufVxuIiwiaW1wb3J0IHthc3NlcnR9IGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy1tYWluLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcihtZXNzYWdlLCBvcHRJbnRlcnZhbCkge1xuICBsZXQgZTtcbiAgaWYgKG9wdEludGVydmFsKSB7XG4gICAgZSA9IG5ldyBFcnJvcihvcHRJbnRlcnZhbC5nZXRMaW5lQW5kQ29sdW1uTWVzc2FnZSgpICsgbWVzc2FnZSk7XG4gICAgZS5zaG9ydE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgIGUuaW50ZXJ2YWwgPSBvcHRJbnRlcnZhbDtcbiAgfSBlbHNlIHtcbiAgICBlID0gbmV3IEVycm9yKG1lc3NhZ2UpO1xuICB9XG4gIHJldHVybiBlO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLSBlcnJvcnMgYWJvdXQgaW50ZXJ2YWxzIC0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnZhbFNvdXJjZXNEb250TWF0Y2goKSB7XG4gIHJldHVybiBjcmVhdGVFcnJvcihcIkludGVydmFsIHNvdXJjZXMgZG9uJ3QgbWF0Y2hcIik7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tIGVycm9ycyBhYm91dCBncmFtbWFycyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBHcmFtbWFyIHN5bnRheCBlcnJvclxuXG5leHBvcnQgZnVuY3Rpb24gZ3JhbW1hclN5bnRheEVycm9yKG1hdGNoRmFpbHVyZSkge1xuICBjb25zdCBlID0gbmV3IEVycm9yKCk7XG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShlLCAnbWVzc2FnZScsIHtcbiAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiBtYXRjaEZhaWx1cmUubWVzc2FnZTtcbiAgICB9LFxuICB9KTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGUsICdzaG9ydE1lc3NhZ2UnLCB7XG4gICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gJ0V4cGVjdGVkICcgKyBtYXRjaEZhaWx1cmUuZ2V0RXhwZWN0ZWRUZXh0KCk7XG4gICAgfSxcbiAgfSk7XG4gIGUuaW50ZXJ2YWwgPSBtYXRjaEZhaWx1cmUuZ2V0SW50ZXJ2YWwoKTtcbiAgcmV0dXJuIGU7XG59XG5cbi8vIFVuZGVjbGFyZWQgZ3JhbW1hclxuXG5leHBvcnQgZnVuY3Rpb24gdW5kZWNsYXJlZEdyYW1tYXIoZ3JhbW1hck5hbWUsIG5hbWVzcGFjZSwgaW50ZXJ2YWwpIHtcbiAgY29uc3QgbWVzc2FnZSA9IG5hbWVzcGFjZSA/XG4gICAgYEdyYW1tYXIgJHtncmFtbWFyTmFtZX0gaXMgbm90IGRlY2xhcmVkIGluIG5hbWVzcGFjZSAnJHtuYW1lc3BhY2V9J2AgOlxuICAgICdVbmRlY2xhcmVkIGdyYW1tYXIgJyArIGdyYW1tYXJOYW1lO1xuICByZXR1cm4gY3JlYXRlRXJyb3IobWVzc2FnZSwgaW50ZXJ2YWwpO1xufVxuXG4vLyBEdXBsaWNhdGUgZ3JhbW1hciBkZWNsYXJhdGlvblxuXG5leHBvcnQgZnVuY3Rpb24gZHVwbGljYXRlR3JhbW1hckRlY2xhcmF0aW9uKGdyYW1tYXIsIG5hbWVzcGFjZSkge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoJ0dyYW1tYXIgJyArIGdyYW1tYXIubmFtZSArICcgaXMgYWxyZWFkeSBkZWNsYXJlZCBpbiB0aGlzIG5hbWVzcGFjZScpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ3JhbW1hckRvZXNOb3RTdXBwb3J0SW5jcmVtZW50YWxQYXJzaW5nKGdyYW1tYXIpIHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKGBHcmFtbWFyICcke2dyYW1tYXIubmFtZX0nIGRvZXMgbm90IHN1cHBvcnQgaW5jcmVtZW50YWwgcGFyc2luZ2ApO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLSBydWxlcyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBVbmRlY2xhcmVkIHJ1bGVcblxuZXhwb3J0IGZ1bmN0aW9uIHVuZGVjbGFyZWRSdWxlKHJ1bGVOYW1lLCBncmFtbWFyTmFtZSwgb3B0SW50ZXJ2YWwpIHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKFxuICAgICAgJ1J1bGUgJyArIHJ1bGVOYW1lICsgJyBpcyBub3QgZGVjbGFyZWQgaW4gZ3JhbW1hciAnICsgZ3JhbW1hck5hbWUsXG4gICAgICBvcHRJbnRlcnZhbCxcbiAgKTtcbn1cblxuLy8gQ2Fubm90IG92ZXJyaWRlIHVuZGVjbGFyZWQgcnVsZVxuXG5leHBvcnQgZnVuY3Rpb24gY2Fubm90T3ZlcnJpZGVVbmRlY2xhcmVkUnVsZShydWxlTmFtZSwgZ3JhbW1hck5hbWUsIG9wdFNvdXJjZSkge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoXG4gICAgICAnQ2Fubm90IG92ZXJyaWRlIHJ1bGUgJyArIHJ1bGVOYW1lICsgJyBiZWNhdXNlIGl0IGlzIG5vdCBkZWNsYXJlZCBpbiAnICsgZ3JhbW1hck5hbWUsXG4gICAgICBvcHRTb3VyY2UsXG4gICk7XG59XG5cbi8vIENhbm5vdCBleHRlbmQgdW5kZWNsYXJlZCBydWxlXG5cbmV4cG9ydCBmdW5jdGlvbiBjYW5ub3RFeHRlbmRVbmRlY2xhcmVkUnVsZShydWxlTmFtZSwgZ3JhbW1hck5hbWUsIG9wdFNvdXJjZSkge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoXG4gICAgICAnQ2Fubm90IGV4dGVuZCBydWxlICcgKyBydWxlTmFtZSArICcgYmVjYXVzZSBpdCBpcyBub3QgZGVjbGFyZWQgaW4gJyArIGdyYW1tYXJOYW1lLFxuICAgICAgb3B0U291cmNlLFxuICApO1xufVxuXG4vLyBEdXBsaWNhdGUgcnVsZSBkZWNsYXJhdGlvblxuXG5leHBvcnQgZnVuY3Rpb24gZHVwbGljYXRlUnVsZURlY2xhcmF0aW9uKHJ1bGVOYW1lLCBncmFtbWFyTmFtZSwgZGVjbEdyYW1tYXJOYW1lLCBvcHRTb3VyY2UpIHtcbiAgbGV0IG1lc3NhZ2UgPVxuICAgIFwiRHVwbGljYXRlIGRlY2xhcmF0aW9uIGZvciBydWxlICdcIiArIHJ1bGVOYW1lICsgXCInIGluIGdyYW1tYXIgJ1wiICsgZ3JhbW1hck5hbWUgKyBcIidcIjtcbiAgaWYgKGdyYW1tYXJOYW1lICE9PSBkZWNsR3JhbW1hck5hbWUpIHtcbiAgICBtZXNzYWdlICs9IFwiIChvcmlnaW5hbGx5IGRlY2xhcmVkIGluICdcIiArIGRlY2xHcmFtbWFyTmFtZSArIFwiJylcIjtcbiAgfVxuICByZXR1cm4gY3JlYXRlRXJyb3IobWVzc2FnZSwgb3B0U291cmNlKTtcbn1cblxuLy8gV3JvbmcgbnVtYmVyIG9mIHBhcmFtZXRlcnNcblxuZXhwb3J0IGZ1bmN0aW9uIHdyb25nTnVtYmVyT2ZQYXJhbWV0ZXJzKHJ1bGVOYW1lLCBleHBlY3RlZCwgYWN0dWFsLCBzb3VyY2UpIHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKFxuICAgICAgJ1dyb25nIG51bWJlciBvZiBwYXJhbWV0ZXJzIGZvciBydWxlICcgK1xuICAgICAgcnVsZU5hbWUgK1xuICAgICAgJyAoZXhwZWN0ZWQgJyArXG4gICAgICBleHBlY3RlZCArXG4gICAgICAnLCBnb3QgJyArXG4gICAgICBhY3R1YWwgK1xuICAgICAgJyknLFxuICAgICAgc291cmNlLFxuICApO1xufVxuXG4vLyBXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzXG5cbmV4cG9ydCBmdW5jdGlvbiB3cm9uZ051bWJlck9mQXJndW1lbnRzKHJ1bGVOYW1lLCBleHBlY3RlZCwgYWN0dWFsLCBleHByKSB7XG4gIHJldHVybiBjcmVhdGVFcnJvcihcbiAgICAgICdXcm9uZyBudW1iZXIgb2YgYXJndW1lbnRzIGZvciBydWxlICcgK1xuICAgICAgcnVsZU5hbWUgK1xuICAgICAgJyAoZXhwZWN0ZWQgJyArXG4gICAgICBleHBlY3RlZCArXG4gICAgICAnLCBnb3QgJyArXG4gICAgICBhY3R1YWwgK1xuICAgICAgJyknLFxuICAgICAgZXhwcixcbiAgKTtcbn1cblxuLy8gRHVwbGljYXRlIHBhcmFtZXRlciBuYW1lc1xuXG5leHBvcnQgZnVuY3Rpb24gZHVwbGljYXRlUGFyYW1ldGVyTmFtZXMocnVsZU5hbWUsIGR1cGxpY2F0ZXMsIHNvdXJjZSkge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoXG4gICAgICAnRHVwbGljYXRlIHBhcmFtZXRlciBuYW1lcyBpbiBydWxlICcgKyBydWxlTmFtZSArICc6ICcgKyBkdXBsaWNhdGVzLmpvaW4oJywgJyksXG4gICAgICBzb3VyY2UsXG4gICk7XG59XG5cbi8vIEludmFsaWQgcGFyYW1ldGVyIGV4cHJlc3Npb25cblxuZXhwb3J0IGZ1bmN0aW9uIGludmFsaWRQYXJhbWV0ZXIocnVsZU5hbWUsIGV4cHIpIHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKFxuICAgICAgJ0ludmFsaWQgcGFyYW1ldGVyIHRvIHJ1bGUgJyArXG4gICAgICBydWxlTmFtZSArXG4gICAgICAnOiAnICtcbiAgICAgIGV4cHIgK1xuICAgICAgJyBoYXMgYXJpdHkgJyArXG4gICAgICBleHByLmdldEFyaXR5KCkgK1xuICAgICAgJywgYnV0IHBhcmFtZXRlciBleHByZXNzaW9ucyBtdXN0IGhhdmUgYXJpdHkgMScsXG4gICAgICBleHByLnNvdXJjZSxcbiAgKTtcbn1cblxuLy8gQXBwbGljYXRpb24gb2Ygc3ludGFjdGljIHJ1bGUgZnJvbSBsZXhpY2FsIHJ1bGVcblxuY29uc3Qgc3ludGFjdGljVnNMZXhpY2FsTm90ZSA9XG4gICdOT1RFOiBBIF9zeW50YWN0aWMgcnVsZV8gaXMgYSBydWxlIHdob3NlIG5hbWUgYmVnaW5zIHdpdGggYSBjYXBpdGFsIGxldHRlci4gJyArXG4gICdTZWUgaHR0cHM6Ly9vaG1qcy5vcmcvZC9zdmwgZm9yIG1vcmUgZGV0YWlscy4nO1xuXG5leHBvcnQgZnVuY3Rpb24gYXBwbGljYXRpb25PZlN5bnRhY3RpY1J1bGVGcm9tTGV4aWNhbENvbnRleHQocnVsZU5hbWUsIGFwcGx5RXhwcikge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoXG4gICAgICAnQ2Fubm90IGFwcGx5IHN5bnRhY3RpYyBydWxlICcgKyBydWxlTmFtZSArICcgZnJvbSBoZXJlIChpbnNpZGUgYSBsZXhpY2FsIGNvbnRleHQpJyxcbiAgICAgIGFwcGx5RXhwci5zb3VyY2UsXG4gICk7XG59XG5cbi8vIExleGljYWwgcnVsZSBhcHBsaWNhdGlvbiB1c2VkIHdpdGggYXBwbHlTeW50YWN0aWNcblxuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5U3ludGFjdGljV2l0aExleGljYWxSdWxlQXBwbGljYXRpb24oYXBwbHlFeHByKSB7XG4gIGNvbnN0IHtydWxlTmFtZX0gPSBhcHBseUV4cHI7XG4gIHJldHVybiBjcmVhdGVFcnJvcihcbiAgICAgIGBhcHBseVN5bnRhY3RpYyBpcyBmb3Igc3ludGFjdGljIHJ1bGVzLCBidXQgJyR7cnVsZU5hbWV9JyBpcyBhIGxleGljYWwgcnVsZS4gYCArXG4gICAgICBzeW50YWN0aWNWc0xleGljYWxOb3RlLFxuICAgICAgYXBwbHlFeHByLnNvdXJjZSxcbiAgKTtcbn1cblxuLy8gQXBwbGljYXRpb24gb2YgYXBwbHlTeW50YWN0aWMgaW4gYSBzeW50YWN0aWMgY29udGV4dFxuXG5leHBvcnQgZnVuY3Rpb24gdW5uZWNlc3NhcnlFeHBlcmltZW50YWxBcHBseVN5bnRhY3RpYyhhcHBseUV4cHIpIHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKFxuICAgICAgJ2FwcGx5U3ludGFjdGljIGlzIG5vdCByZXF1aXJlZCBoZXJlIChpbiBhIHN5bnRhY3RpYyBjb250ZXh0KScsXG4gICAgICBhcHBseUV4cHIuc291cmNlLFxuICApO1xufVxuXG4vLyBJbmNvcnJlY3QgYXJndW1lbnQgdHlwZVxuXG5leHBvcnQgZnVuY3Rpb24gaW5jb3JyZWN0QXJndW1lbnRUeXBlKGV4cGVjdGVkVHlwZSwgZXhwcikge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoJ0luY29ycmVjdCBhcmd1bWVudCB0eXBlOiBleHBlY3RlZCAnICsgZXhwZWN0ZWRUeXBlLCBleHByLnNvdXJjZSk7XG59XG5cbi8vIE11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgc3VwZXItc3BsaWNlIG9wZXJhdG9yIChgLi4uYCkgaW4gdGhlIHJ1bGUgYm9keS5cblxuZXhwb3J0IGZ1bmN0aW9uIG11bHRpcGxlU3VwZXJTcGxpY2VzKGV4cHIpIHtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKFwiJy4uLicgY2FuIGFwcGVhciBhdCBtb3N0IG9uY2UgaW4gYSBydWxlIGJvZHlcIiwgZXhwci5zb3VyY2UpO1xufVxuXG4vLyBVbmljb2RlIGNvZGUgcG9pbnQgZXNjYXBlc1xuXG5leHBvcnQgZnVuY3Rpb24gaW52YWxpZENvZGVQb2ludChhcHBseVdyYXBwZXIpIHtcbiAgY29uc3Qgbm9kZSA9IGFwcGx5V3JhcHBlci5fbm9kZTtcbiAgYXNzZXJ0KG5vZGUgJiYgbm9kZS5pc05vbnRlcm1pbmFsKCkgJiYgbm9kZS5jdG9yTmFtZSA9PT0gJ2VzY2FwZUNoYXJfdW5pY29kZUNvZGVQb2ludCcpO1xuXG4gIC8vIEdldCBhbiBpbnRlcnZhbCB0aGF0IGNvdmVycyBhbGwgb2YgdGhlIGhleCBkaWdpdHMuXG4gIGNvbnN0IGRpZ2l0SW50ZXJ2YWxzID0gYXBwbHlXcmFwcGVyLmNoaWxkcmVuLnNsaWNlKDEsIC0xKS5tYXAoZCA9PiBkLnNvdXJjZSk7XG4gIGNvbnN0IGZ1bGxJbnRlcnZhbCA9IGRpZ2l0SW50ZXJ2YWxzWzBdLmNvdmVyYWdlV2l0aCguLi5kaWdpdEludGVydmFscy5zbGljZSgxKSk7XG4gIHJldHVybiBjcmVhdGVFcnJvcihcbiAgICAgIGBVKyR7ZnVsbEludGVydmFsLmNvbnRlbnRzfSBpcyBub3QgYSB2YWxpZCBVbmljb2RlIGNvZGUgcG9pbnRgLFxuICAgICAgZnVsbEludGVydmFsLFxuICApO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLSBLbGVlbmUgb3BlcmF0b3JzIC0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiBrbGVlbmVFeHBySGFzTnVsbGFibGVPcGVyYW5kKGtsZWVuZUV4cHIsIGFwcGxpY2F0aW9uU3RhY2spIHtcbiAgY29uc3QgYWN0dWFscyA9XG4gICAgYXBwbGljYXRpb25TdGFjay5sZW5ndGggPiAwID8gYXBwbGljYXRpb25TdGFja1thcHBsaWNhdGlvblN0YWNrLmxlbmd0aCAtIDFdLmFyZ3MgOiBbXTtcbiAgY29uc3QgZXhwciA9IGtsZWVuZUV4cHIuZXhwci5zdWJzdGl0dXRlUGFyYW1zKGFjdHVhbHMpO1xuICBsZXQgbWVzc2FnZSA9XG4gICAgJ051bGxhYmxlIGV4cHJlc3Npb24gJyArXG4gICAgZXhwciArXG4gICAgXCIgaXMgbm90IGFsbG93ZWQgaW5zaWRlICdcIiArXG4gICAga2xlZW5lRXhwci5vcGVyYXRvciArXG4gICAgXCInIChwb3NzaWJsZSBpbmZpbml0ZSBsb29wKVwiO1xuICBpZiAoYXBwbGljYXRpb25TdGFjay5sZW5ndGggPiAwKSB7XG4gICAgY29uc3Qgc3RhY2tUcmFjZSA9IGFwcGxpY2F0aW9uU3RhY2tcbiAgICAgICAgLm1hcChhcHAgPT4gbmV3IHBleHBycy5BcHBseShhcHAucnVsZU5hbWUsIGFwcC5hcmdzKSlcbiAgICAgICAgLmpvaW4oJ1xcbicpO1xuICAgIG1lc3NhZ2UgKz0gJ1xcbkFwcGxpY2F0aW9uIHN0YWNrIChtb3N0IHJlY2VudCBhcHBsaWNhdGlvbiBsYXN0KTpcXG4nICsgc3RhY2tUcmFjZTtcbiAgfVxuICByZXR1cm4gY3JlYXRlRXJyb3IobWVzc2FnZSwga2xlZW5lRXhwci5leHByLnNvdXJjZSk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tIGFyaXR5IC0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiBpbmNvbnNpc3RlbnRBcml0eShydWxlTmFtZSwgZXhwZWN0ZWQsIGFjdHVhbCwgZXhwcikge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoXG4gICAgICAnUnVsZSAnICtcbiAgICAgIHJ1bGVOYW1lICtcbiAgICAgICcgaW52b2x2ZXMgYW4gYWx0ZXJuYXRpb24gd2hpY2ggaGFzIGluY29uc2lzdGVudCBhcml0eSAnICtcbiAgICAgICcoZXhwZWN0ZWQgJyArXG4gICAgICBleHBlY3RlZCArXG4gICAgICAnLCBnb3QgJyArXG4gICAgICBhY3R1YWwgK1xuICAgICAgJyknLFxuICAgICAgZXhwci5zb3VyY2UsXG4gICk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tIHByb3BlcnRpZXMgLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIGR1cGxpY2F0ZVByb3BlcnR5TmFtZXMoZHVwbGljYXRlcykge1xuICByZXR1cm4gY3JlYXRlRXJyb3IoJ09iamVjdCBwYXR0ZXJuIGhhcyBkdXBsaWNhdGUgcHJvcGVydHkgbmFtZXM6ICcgKyBkdXBsaWNhdGVzLmpvaW4oJywgJykpO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLSBjb25zdHJ1Y3RvcnMgLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIGludmFsaWRDb25zdHJ1Y3RvckNhbGwoZ3JhbW1hciwgY3Rvck5hbWUsIGNoaWxkcmVuKSB7XG4gIHJldHVybiBjcmVhdGVFcnJvcihcbiAgICAgICdBdHRlbXB0IHRvIGludm9rZSBjb25zdHJ1Y3RvciAnICsgY3Rvck5hbWUgKyAnIHdpdGggaW52YWxpZCBvciB1bmV4cGVjdGVkIGFyZ3VtZW50cycsXG4gICk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tIGNvbnZlbmllbmNlIC0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBmdW5jdGlvbiBtdWx0aXBsZUVycm9ycyhlcnJvcnMpIHtcbiAgY29uc3QgbWVzc2FnZXMgPSBlcnJvcnMubWFwKGUgPT4gZS5tZXNzYWdlKTtcbiAgcmV0dXJuIGNyZWF0ZUVycm9yKFsnRXJyb3JzOiddLmNvbmNhdChtZXNzYWdlcykuam9pbignXFxuLSAnKSwgZXJyb3JzWzBdLmludGVydmFsKTtcbn1cblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0gc2VtYW50aWMgLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGZ1bmN0aW9uIG1pc3NpbmdTZW1hbnRpY0FjdGlvbihjdG9yTmFtZSwgbmFtZSwgdHlwZSwgc3RhY2spIHtcbiAgbGV0IHN0YWNrVHJhY2UgPSBzdGFja1xuICAgICAgLnNsaWNlKDAsIC0xKVxuICAgICAgLm1hcChpbmZvID0+IHtcbiAgICAgICAgY29uc3QgYW5zID0gJyAgJyArIGluZm9bMF0ubmFtZSArICcgPiAnICsgaW5mb1sxXTtcbiAgICAgICAgcmV0dXJuIGluZm8ubGVuZ3RoID09PSAzID8gYW5zICsgXCIgZm9yICdcIiArIGluZm9bMl0gKyBcIidcIiA6IGFucztcbiAgICAgIH0pXG4gICAgICAuam9pbignXFxuJyk7XG4gIHN0YWNrVHJhY2UgKz0gJ1xcbiAgJyArIG5hbWUgKyAnID4gJyArIGN0b3JOYW1lO1xuXG4gIGxldCBtb3JlSW5mbyA9ICcnO1xuICBpZiAoY3Rvck5hbWUgPT09ICdfaXRlcicpIHtcbiAgICBtb3JlSW5mbyA9IFtcbiAgICAgICdcXG5OT1RFOiBhcyBvZiBPaG0gdjE2LCB0aGVyZSBpcyBubyBkZWZhdWx0IGFjdGlvbiBmb3IgaXRlcmF0aW9uIG5vZGVzIOKAlCBzZWUgJyxcbiAgICAgICcgIGh0dHBzOi8vb2htanMub3JnL2QvZHNhIGZvciBkZXRhaWxzLicsXG4gICAgXS5qb2luKCdcXG4nKTtcbiAgfVxuXG4gIGNvbnN0IG1lc3NhZ2UgPSBbXG4gICAgYE1pc3Npbmcgc2VtYW50aWMgYWN0aW9uIGZvciAnJHtjdG9yTmFtZX0nIGluICR7dHlwZX0gJyR7bmFtZX0nLiR7bW9yZUluZm99YCxcbiAgICAnQWN0aW9uIHN0YWNrIChtb3N0IHJlY2VudCBjYWxsIGxhc3QpOicsXG4gICAgc3RhY2tUcmFjZSxcbiAgXS5qb2luKCdcXG4nKTtcblxuICBjb25zdCBlID0gY3JlYXRlRXJyb3IobWVzc2FnZSk7XG4gIGUubmFtZSA9ICdtaXNzaW5nU2VtYW50aWNBY3Rpb24nO1xuICByZXR1cm4gZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRocm93RXJyb3JzKGVycm9ycykge1xuICBpZiAoZXJyb3JzLmxlbmd0aCA9PT0gMSkge1xuICAgIHRocm93IGVycm9yc1swXTtcbiAgfVxuICBpZiAoZXJyb3JzLmxlbmd0aCA+IDEpIHtcbiAgICB0aHJvdyBtdWx0aXBsZUVycm9ycyhlcnJvcnMpO1xuICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9jb21tb24uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJpdmF0ZSBzdHVmZlxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gR2l2ZW4gYW4gYXJyYXkgb2YgbnVtYmVycyBgYXJyYCwgcmV0dXJuIGFuIGFycmF5IG9mIHRoZSBudW1iZXJzIGFzIHN0cmluZ3MsXG4vLyByaWdodC1qdXN0aWZpZWQgYW5kIHBhZGRlZCB0byB0aGUgc2FtZSBsZW5ndGguXG5mdW5jdGlvbiBwYWROdW1iZXJzVG9FcXVhbExlbmd0aChhcnIpIHtcbiAgbGV0IG1heExlbiA9IDA7XG4gIGNvbnN0IHN0cmluZ3MgPSBhcnIubWFwKG4gPT4ge1xuICAgIGNvbnN0IHN0ciA9IG4udG9TdHJpbmcoKTtcbiAgICBtYXhMZW4gPSBNYXRoLm1heChtYXhMZW4sIHN0ci5sZW5ndGgpO1xuICAgIHJldHVybiBzdHI7XG4gIH0pO1xuICByZXR1cm4gc3RyaW5ncy5tYXAocyA9PiBjb21tb24ucGFkTGVmdChzLCBtYXhMZW4pKTtcbn1cblxuLy8gUHJvZHVjZSBhIG5ldyBzdHJpbmcgdGhhdCB3b3VsZCBiZSB0aGUgcmVzdWx0IG9mIGNvcHlpbmcgdGhlIGNvbnRlbnRzXG4vLyBvZiB0aGUgc3RyaW5nIGBzcmNgIG9udG8gYGRlc3RgIGF0IG9mZnNldCBgb2ZmZXN0YC5cbmZ1bmN0aW9uIHN0cmNweShkZXN0LCBzcmMsIG9mZnNldCkge1xuICBjb25zdCBvcmlnRGVzdExlbiA9IGRlc3QubGVuZ3RoO1xuICBjb25zdCBzdGFydCA9IGRlc3Quc2xpY2UoMCwgb2Zmc2V0KTtcbiAgY29uc3QgZW5kID0gZGVzdC5zbGljZShvZmZzZXQgKyBzcmMubGVuZ3RoKTtcbiAgcmV0dXJuIChzdGFydCArIHNyYyArIGVuZCkuc3Vic3RyKDAsIG9yaWdEZXN0TGVuKTtcbn1cblxuLy8gQ2FzdHMgdGhlIHVuZGVybHlpbmcgbGluZUFuZENvbCBvYmplY3QgdG8gYSBmb3JtYXR0ZWQgbWVzc2FnZSBzdHJpbmcsXG4vLyBoaWdobGlnaHRpbmcgYHJhbmdlc2AuXG5mdW5jdGlvbiBsaW5lQW5kQ29sdW1uVG9NZXNzYWdlKC4uLnJhbmdlcykge1xuICBjb25zdCBsaW5lQW5kQ29sID0gdGhpcztcbiAgY29uc3Qge29mZnNldH0gPSBsaW5lQW5kQ29sO1xuICBjb25zdCB7cmVwZWF0U3RyfSA9IGNvbW1vbjtcblxuICBjb25zdCBzYiA9IG5ldyBjb21tb24uU3RyaW5nQnVmZmVyKCk7XG4gIHNiLmFwcGVuZCgnTGluZSAnICsgbGluZUFuZENvbC5saW5lTnVtICsgJywgY29sICcgKyBsaW5lQW5kQ29sLmNvbE51bSArICc6XFxuJyk7XG5cbiAgLy8gQW4gYXJyYXkgb2YgdGhlIHByZXZpb3VzLCBjdXJyZW50LCBhbmQgbmV4dCBsaW5lIG51bWJlcnMgYXMgc3RyaW5ncyBvZiBlcXVhbCBsZW5ndGguXG4gIGNvbnN0IGxpbmVOdW1iZXJzID0gcGFkTnVtYmVyc1RvRXF1YWxMZW5ndGgoW1xuICAgIGxpbmVBbmRDb2wucHJldkxpbmUgPT0gbnVsbCA/IDAgOiBsaW5lQW5kQ29sLmxpbmVOdW0gLSAxLFxuICAgIGxpbmVBbmRDb2wubGluZU51bSxcbiAgICBsaW5lQW5kQ29sLm5leHRMaW5lID09IG51bGwgPyAwIDogbGluZUFuZENvbC5saW5lTnVtICsgMSxcbiAgXSk7XG5cbiAgLy8gSGVscGVyIGZvciBhcHBlbmRpbmcgZm9ybWF0dGluZyBpbnB1dCBsaW5lcyB0byB0aGUgYnVmZmVyLlxuICBjb25zdCBhcHBlbmRMaW5lID0gKG51bSwgY29udGVudCwgcHJlZml4KSA9PiB7XG4gICAgc2IuYXBwZW5kKHByZWZpeCArIGxpbmVOdW1iZXJzW251bV0gKyAnIHwgJyArIGNvbnRlbnQgKyAnXFxuJyk7XG4gIH07XG5cbiAgLy8gSW5jbHVkZSB0aGUgcHJldmlvdXMgbGluZSBmb3IgY29udGV4dCBpZiBwb3NzaWJsZS5cbiAgaWYgKGxpbmVBbmRDb2wucHJldkxpbmUgIT0gbnVsbCkge1xuICAgIGFwcGVuZExpbmUoMCwgbGluZUFuZENvbC5wcmV2TGluZSwgJyAgJyk7XG4gIH1cbiAgLy8gTGluZSB0aGF0IHRoZSBlcnJvciBvY2N1cnJlZCBvbi5cbiAgYXBwZW5kTGluZSgxLCBsaW5lQW5kQ29sLmxpbmUsICc+ICcpO1xuXG4gIC8vIEJ1aWxkIHVwIHRoZSBsaW5lIHRoYXQgcG9pbnRzIHRvIHRoZSBvZmZzZXQgYW5kIHBvc3NpYmxlIGluZGljYXRlcyBvbmUgb3IgbW9yZSByYW5nZXMuXG4gIC8vIFN0YXJ0IHdpdGggYSBibGFuayBsaW5lLCBhbmQgaW5kaWNhdGUgZWFjaCByYW5nZSBieSBvdmVybGF5aW5nIGEgc3RyaW5nIG9mIGB+YCBjaGFycy5cbiAgY29uc3QgbGluZUxlbiA9IGxpbmVBbmRDb2wubGluZS5sZW5ndGg7XG4gIGxldCBpbmRpY2F0aW9uTGluZSA9IHJlcGVhdFN0cignICcsIGxpbmVMZW4gKyAxKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByYW5nZXMubGVuZ3RoOyArK2kpIHtcbiAgICBsZXQgc3RhcnRJZHggPSByYW5nZXNbaV1bMF07XG4gICAgbGV0IGVuZElkeCA9IHJhbmdlc1tpXVsxXTtcbiAgICBjb21tb24uYXNzZXJ0KHN0YXJ0SWR4ID49IDAgJiYgc3RhcnRJZHggPD0gZW5kSWR4LCAncmFuZ2Ugc3RhcnQgbXVzdCBiZSA+PSAwIGFuZCA8PSBlbmQnKTtcblxuICAgIGNvbnN0IGxpbmVTdGFydE9mZnNldCA9IG9mZnNldCAtIGxpbmVBbmRDb2wuY29sTnVtICsgMTtcbiAgICBzdGFydElkeCA9IE1hdGgubWF4KDAsIHN0YXJ0SWR4IC0gbGluZVN0YXJ0T2Zmc2V0KTtcbiAgICBlbmRJZHggPSBNYXRoLm1pbihlbmRJZHggLSBsaW5lU3RhcnRPZmZzZXQsIGxpbmVMZW4pO1xuXG4gICAgaW5kaWNhdGlvbkxpbmUgPSBzdHJjcHkoaW5kaWNhdGlvbkxpbmUsIHJlcGVhdFN0cignficsIGVuZElkeCAtIHN0YXJ0SWR4KSwgc3RhcnRJZHgpO1xuICB9XG4gIGNvbnN0IGd1dHRlcldpZHRoID0gMiArIGxpbmVOdW1iZXJzWzFdLmxlbmd0aCArIDM7XG4gIHNiLmFwcGVuZChyZXBlYXRTdHIoJyAnLCBndXR0ZXJXaWR0aCkpO1xuICBpbmRpY2F0aW9uTGluZSA9IHN0cmNweShpbmRpY2F0aW9uTGluZSwgJ14nLCBsaW5lQW5kQ29sLmNvbE51bSAtIDEpO1xuICBzYi5hcHBlbmQoaW5kaWNhdGlvbkxpbmUucmVwbGFjZSgvICskLywgJycpICsgJ1xcbicpO1xuXG4gIC8vIEluY2x1ZGUgdGhlIG5leHQgbGluZSBmb3IgY29udGV4dCBpZiBwb3NzaWJsZS5cbiAgaWYgKGxpbmVBbmRDb2wubmV4dExpbmUgIT0gbnVsbCkge1xuICAgIGFwcGVuZExpbmUoMiwgbGluZUFuZENvbC5uZXh0TGluZSwgJyAgJyk7XG4gIH1cbiAgcmV0dXJuIHNiLmNvbnRlbnRzKCk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFeHBvcnRzXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5sZXQgYnVpbHRJblJ1bGVzQ2FsbGJhY2tzID0gW107XG5cbi8vIFNpbmNlIEdyYW1tYXIuQnVpbHRJblJ1bGVzIGlzIGJvb3RzdHJhcHBlZCwgbW9zdCBvZiBPaG0gY2FuJ3QgZGlyZWN0bHkgZGVwZW5kIGl0LlxuLy8gVGhpcyBmdW5jdGlvbiBhbGxvd3MgbW9kdWxlcyB0aGF0IGRvIGRlcGVuZCBvbiB0aGUgYnVpbHQtaW4gcnVsZXMgdG8gcmVnaXN0ZXIgYSBjYWxsYmFja1xuLy8gdGhhdCB3aWxsIGJlIGNhbGxlZCBsYXRlciBpbiB0aGUgaW5pdGlhbGl6YXRpb24gcHJvY2Vzcy5cbmV4cG9ydCBmdW5jdGlvbiBhd2FpdEJ1aWx0SW5SdWxlcyhjYikge1xuICBidWlsdEluUnVsZXNDYWxsYmFja3MucHVzaChjYik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbm5vdW5jZUJ1aWx0SW5SdWxlcyhncmFtbWFyKSB7XG4gIGJ1aWx0SW5SdWxlc0NhbGxiYWNrcy5mb3JFYWNoKGNiID0+IHtcbiAgICBjYihncmFtbWFyKTtcbiAgfSk7XG4gIGJ1aWx0SW5SdWxlc0NhbGxiYWNrcyA9IG51bGw7XG59XG5cbi8vIFJldHVybiBhbiBvYmplY3Qgd2l0aCB0aGUgbGluZSBhbmQgY29sdW1uIGluZm9ybWF0aW9uIGZvciB0aGUgZ2l2ZW5cbi8vIG9mZnNldCBpbiBgc3RyYC5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMaW5lQW5kQ29sdW1uKHN0ciwgb2Zmc2V0KSB7XG4gIGxldCBsaW5lTnVtID0gMTtcbiAgbGV0IGNvbE51bSA9IDE7XG5cbiAgbGV0IGN1cnJPZmZzZXQgPSAwO1xuICBsZXQgbGluZVN0YXJ0T2Zmc2V0ID0gMDtcblxuICBsZXQgbmV4dExpbmUgPSBudWxsO1xuICBsZXQgcHJldkxpbmUgPSBudWxsO1xuICBsZXQgcHJldkxpbmVTdGFydE9mZnNldCA9IC0xO1xuXG4gIHdoaWxlIChjdXJyT2Zmc2V0IDwgb2Zmc2V0KSB7XG4gICAgY29uc3QgYyA9IHN0ci5jaGFyQXQoY3Vyck9mZnNldCsrKTtcbiAgICBpZiAoYyA9PT0gJ1xcbicpIHtcbiAgICAgIGxpbmVOdW0rKztcbiAgICAgIGNvbE51bSA9IDE7XG4gICAgICBwcmV2TGluZVN0YXJ0T2Zmc2V0ID0gbGluZVN0YXJ0T2Zmc2V0O1xuICAgICAgbGluZVN0YXJ0T2Zmc2V0ID0gY3Vyck9mZnNldDtcbiAgICB9IGVsc2UgaWYgKGMgIT09ICdcXHInKSB7XG4gICAgICBjb2xOdW0rKztcbiAgICB9XG4gIH1cblxuICAvLyBGaW5kIHRoZSBlbmQgb2YgdGhlIHRhcmdldCBsaW5lLlxuICBsZXQgbGluZUVuZE9mZnNldCA9IHN0ci5pbmRleE9mKCdcXG4nLCBsaW5lU3RhcnRPZmZzZXQpO1xuICBpZiAobGluZUVuZE9mZnNldCA9PT0gLTEpIHtcbiAgICBsaW5lRW5kT2Zmc2V0ID0gc3RyLmxlbmd0aDtcbiAgfSBlbHNlIHtcbiAgICAvLyBHZXQgdGhlIG5leHQgbGluZS5cbiAgICBjb25zdCBuZXh0TGluZUVuZE9mZnNldCA9IHN0ci5pbmRleE9mKCdcXG4nLCBsaW5lRW5kT2Zmc2V0ICsgMSk7XG4gICAgbmV4dExpbmUgPVxuICAgICAgbmV4dExpbmVFbmRPZmZzZXQgPT09IC0xID9cbiAgICAgICAgc3RyLnNsaWNlKGxpbmVFbmRPZmZzZXQpIDpcbiAgICAgICAgc3RyLnNsaWNlKGxpbmVFbmRPZmZzZXQsIG5leHRMaW5lRW5kT2Zmc2V0KTtcbiAgICAvLyBTdHJpcCBsZWFkaW5nIGFuZCB0cmFpbGluZyBFT0wgY2hhcihzKS5cbiAgICBuZXh0TGluZSA9IG5leHRMaW5lLnJlcGxhY2UoL15cXHI/XFxuLywgJycpLnJlcGxhY2UoL1xcciQvLCAnJyk7XG4gIH1cblxuICAvLyBHZXQgdGhlIHByZXZpb3VzIGxpbmUuXG4gIGlmIChwcmV2TGluZVN0YXJ0T2Zmc2V0ID49IDApIHtcbiAgICAvLyBTdHJpcCB0cmFpbGluZyBFT0wgY2hhcihzKS5cbiAgICBwcmV2TGluZSA9IHN0ci5zbGljZShwcmV2TGluZVN0YXJ0T2Zmc2V0LCBsaW5lU3RhcnRPZmZzZXQpLnJlcGxhY2UoL1xccj9cXG4kLywgJycpO1xuICB9XG5cbiAgLy8gR2V0IHRoZSB0YXJnZXQgbGluZSwgc3RyaXBwaW5nIGEgdHJhaWxpbmcgY2FycmlhZ2UgcmV0dXJuIGlmIG5lY2Vzc2FyeS5cbiAgY29uc3QgbGluZSA9IHN0ci5zbGljZShsaW5lU3RhcnRPZmZzZXQsIGxpbmVFbmRPZmZzZXQpLnJlcGxhY2UoL1xcciQvLCAnJyk7XG5cbiAgcmV0dXJuIHtcbiAgICBvZmZzZXQsXG4gICAgbGluZU51bSxcbiAgICBjb2xOdW0sXG4gICAgbGluZSxcbiAgICBwcmV2TGluZSxcbiAgICBuZXh0TGluZSxcbiAgICB0b1N0cmluZzogbGluZUFuZENvbHVtblRvTWVzc2FnZSxcbiAgfTtcbn1cblxuLy8gUmV0dXJuIGEgbmljZWx5LWZvcm1hdHRlZCBzdHJpbmcgZGVzY3JpYmluZyB0aGUgbGluZSBhbmQgY29sdW1uIGZvciB0aGVcbi8vIGdpdmVuIG9mZnNldCBpbiBgc3RyYCBoaWdobGlnaHRpbmcgYHJhbmdlc2AuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGluZUFuZENvbHVtbk1lc3NhZ2Uoc3RyLCBvZmZzZXQsIC4uLnJhbmdlcykge1xuICByZXR1cm4gZ2V0TGluZUFuZENvbHVtbihzdHIsIG9mZnNldCkudG9TdHJpbmcoLi4ucmFuZ2VzKTtcbn1cblxuZXhwb3J0IGNvbnN0IHVuaXF1ZUlkID0gKCgpID0+IHtcbiAgbGV0IGlkQ291bnRlciA9IDA7XG4gIHJldHVybiBwcmVmaXggPT4gJycgKyBwcmVmaXggKyBpZENvdW50ZXIrKztcbn0pKCk7XG4iLCJpbXBvcnQge2Fzc2VydH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzLmpzJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjbGFzcyBJbnRlcnZhbCB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZVN0cmluZywgc3RhcnRJZHgsIGVuZElkeCkge1xuICAgIHRoaXMuc291cmNlU3RyaW5nID0gc291cmNlU3RyaW5nO1xuICAgIHRoaXMuc3RhcnRJZHggPSBzdGFydElkeDtcbiAgICB0aGlzLmVuZElkeCA9IGVuZElkeDtcbiAgfVxuXG4gIGdldCBjb250ZW50cygpIHtcbiAgICBpZiAodGhpcy5fY29udGVudHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5fY29udGVudHMgPSB0aGlzLnNvdXJjZVN0cmluZy5zbGljZSh0aGlzLnN0YXJ0SWR4LCB0aGlzLmVuZElkeCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLl9jb250ZW50cztcbiAgfVxuXG4gIGdldCBsZW5ndGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW5kSWR4IC0gdGhpcy5zdGFydElkeDtcbiAgfVxuXG4gIGNvdmVyYWdlV2l0aCguLi5pbnRlcnZhbHMpIHtcbiAgICByZXR1cm4gSW50ZXJ2YWwuY292ZXJhZ2UoLi4uaW50ZXJ2YWxzLCB0aGlzKTtcbiAgfVxuXG4gIGNvbGxhcHNlZExlZnQoKSB7XG4gICAgcmV0dXJuIG5ldyBJbnRlcnZhbCh0aGlzLnNvdXJjZVN0cmluZywgdGhpcy5zdGFydElkeCwgdGhpcy5zdGFydElkeCk7XG4gIH1cblxuICBjb2xsYXBzZWRSaWdodCgpIHtcbiAgICByZXR1cm4gbmV3IEludGVydmFsKHRoaXMuc291cmNlU3RyaW5nLCB0aGlzLmVuZElkeCwgdGhpcy5lbmRJZHgpO1xuICB9XG5cbiAgZ2V0TGluZUFuZENvbHVtbigpIHtcbiAgICByZXR1cm4gdXRpbC5nZXRMaW5lQW5kQ29sdW1uKHRoaXMuc291cmNlU3RyaW5nLCB0aGlzLnN0YXJ0SWR4KTtcbiAgfVxuXG4gIGdldExpbmVBbmRDb2x1bW5NZXNzYWdlKCkge1xuICAgIGNvbnN0IHJhbmdlID0gW3RoaXMuc3RhcnRJZHgsIHRoaXMuZW5kSWR4XTtcbiAgICByZXR1cm4gdXRpbC5nZXRMaW5lQW5kQ29sdW1uTWVzc2FnZSh0aGlzLnNvdXJjZVN0cmluZywgdGhpcy5zdGFydElkeCwgcmFuZ2UpO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhbiBhcnJheSBvZiAwLCAxLCBvciAyIGludGVydmFscyB0aGF0IHJlcHJlc2VudHMgdGhlIHJlc3VsdCBvZiB0aGVcbiAgLy8gaW50ZXJ2YWwgZGlmZmVyZW5jZSBvcGVyYXRpb24uXG4gIG1pbnVzKHRoYXQpIHtcbiAgICBpZiAodGhpcy5zb3VyY2VTdHJpbmcgIT09IHRoYXQuc291cmNlU3RyaW5nKSB7XG4gICAgICB0aHJvdyBlcnJvcnMuaW50ZXJ2YWxTb3VyY2VzRG9udE1hdGNoKCk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnN0YXJ0SWR4ID09PSB0aGF0LnN0YXJ0SWR4ICYmIHRoaXMuZW5kSWR4ID09PSB0aGF0LmVuZElkeCkge1xuICAgICAgLy8gYHRoaXNgIGFuZCBgdGhhdGAgYXJlIHRoZSBzYW1lIGludGVydmFsIVxuICAgICAgcmV0dXJuIFtdO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGFydElkeCA8IHRoYXQuc3RhcnRJZHggJiYgdGhhdC5lbmRJZHggPCB0aGlzLmVuZElkeCkge1xuICAgICAgLy8gYHRoYXRgIHNwbGl0cyBgdGhpc2AgaW50byB0d28gaW50ZXJ2YWxzXG4gICAgICByZXR1cm4gW1xuICAgICAgICBuZXcgSW50ZXJ2YWwodGhpcy5zb3VyY2VTdHJpbmcsIHRoaXMuc3RhcnRJZHgsIHRoYXQuc3RhcnRJZHgpLFxuICAgICAgICBuZXcgSW50ZXJ2YWwodGhpcy5zb3VyY2VTdHJpbmcsIHRoYXQuZW5kSWR4LCB0aGlzLmVuZElkeCksXG4gICAgICBdO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGFydElkeCA8IHRoYXQuZW5kSWR4ICYmIHRoYXQuZW5kSWR4IDwgdGhpcy5lbmRJZHgpIHtcbiAgICAgIC8vIGB0aGF0YCBjb250YWlucyBhIHByZWZpeCBvZiBgdGhpc2BcbiAgICAgIHJldHVybiBbbmV3IEludGVydmFsKHRoaXMuc291cmNlU3RyaW5nLCB0aGF0LmVuZElkeCwgdGhpcy5lbmRJZHgpXTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhcnRJZHggPCB0aGF0LnN0YXJ0SWR4ICYmIHRoYXQuc3RhcnRJZHggPCB0aGlzLmVuZElkeCkge1xuICAgICAgLy8gYHRoYXRgIGNvbnRhaW5zIGEgc3VmZml4IG9mIGB0aGlzYFxuICAgICAgcmV0dXJuIFtuZXcgSW50ZXJ2YWwodGhpcy5zb3VyY2VTdHJpbmcsIHRoaXMuc3RhcnRJZHgsIHRoYXQuc3RhcnRJZHgpXTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gYHRoYXRgIGFuZCBgdGhpc2AgZG8gbm90IG92ZXJsYXBcbiAgICAgIHJldHVybiBbdGhpc107XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBhIG5ldyBJbnRlcnZhbCB0aGF0IGhhcyB0aGUgc2FtZSBleHRlbnQgYXMgdGhpcyBvbmUsIGJ1dCB3aGljaCBpcyByZWxhdGl2ZVxuICAvLyB0byBgdGhhdGAsIGFuIEludGVydmFsIHRoYXQgZnVsbHkgY292ZXJzIHRoaXMgb25lLlxuICByZWxhdGl2ZVRvKHRoYXQpIHtcbiAgICBpZiAodGhpcy5zb3VyY2VTdHJpbmcgIT09IHRoYXQuc291cmNlU3RyaW5nKSB7XG4gICAgICB0aHJvdyBlcnJvcnMuaW50ZXJ2YWxTb3VyY2VzRG9udE1hdGNoKCk7XG4gICAgfVxuICAgIGFzc2VydChcbiAgICAgICAgdGhpcy5zdGFydElkeCA+PSB0aGF0LnN0YXJ0SWR4ICYmIHRoaXMuZW5kSWR4IDw9IHRoYXQuZW5kSWR4LFxuICAgICAgICAnb3RoZXIgaW50ZXJ2YWwgZG9lcyBub3QgY292ZXIgdGhpcyBvbmUnLFxuICAgICk7XG4gICAgcmV0dXJuIG5ldyBJbnRlcnZhbChcbiAgICAgICAgdGhpcy5zb3VyY2VTdHJpbmcsXG4gICAgICAgIHRoaXMuc3RhcnRJZHggLSB0aGF0LnN0YXJ0SWR4LFxuICAgICAgICB0aGlzLmVuZElkeCAtIHRoYXQuc3RhcnRJZHgsXG4gICAgKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBuZXcgSW50ZXJ2YWwgd2hpY2ggY29udGFpbnMgdGhlIHNhbWUgY29udGVudHMgYXMgdGhpcyBvbmUsXG4gIC8vIGJ1dCB3aXRoIHdoaXRlc3BhY2UgdHJpbW1lZCBmcm9tIGJvdGggZW5kcy5cbiAgdHJpbW1lZCgpIHtcbiAgICBjb25zdCB7Y29udGVudHN9ID0gdGhpcztcbiAgICBjb25zdCBzdGFydElkeCA9IHRoaXMuc3RhcnRJZHggKyBjb250ZW50cy5tYXRjaCgvXlxccyovKVswXS5sZW5ndGg7XG4gICAgY29uc3QgZW5kSWR4ID0gdGhpcy5lbmRJZHggLSBjb250ZW50cy5tYXRjaCgvXFxzKiQvKVswXS5sZW5ndGg7XG4gICAgcmV0dXJuIG5ldyBJbnRlcnZhbCh0aGlzLnNvdXJjZVN0cmluZywgc3RhcnRJZHgsIGVuZElkeCk7XG4gIH1cblxuICBzdWJJbnRlcnZhbChvZmZzZXQsIGxlbikge1xuICAgIGNvbnN0IG5ld1N0YXJ0SWR4ID0gdGhpcy5zdGFydElkeCArIG9mZnNldDtcbiAgICByZXR1cm4gbmV3IEludGVydmFsKHRoaXMuc291cmNlU3RyaW5nLCBuZXdTdGFydElkeCwgbmV3U3RhcnRJZHggKyBsZW4pO1xuICB9XG59XG5cbkludGVydmFsLmNvdmVyYWdlID0gZnVuY3Rpb24oZmlyc3RJbnRlcnZhbCwgLi4uaW50ZXJ2YWxzKSB7XG4gIGxldCB7c3RhcnRJZHgsIGVuZElkeH0gPSBmaXJzdEludGVydmFsO1xuICBmb3IgKGNvbnN0IGludGVydmFsIG9mIGludGVydmFscykge1xuICAgIGlmIChpbnRlcnZhbC5zb3VyY2VTdHJpbmcgIT09IGZpcnN0SW50ZXJ2YWwuc291cmNlU3RyaW5nKSB7XG4gICAgICB0aHJvdyBlcnJvcnMuaW50ZXJ2YWxTb3VyY2VzRG9udE1hdGNoKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHN0YXJ0SWR4ID0gTWF0aC5taW4oc3RhcnRJZHgsIGludGVydmFsLnN0YXJ0SWR4KTtcbiAgICAgIGVuZElkeCA9IE1hdGgubWF4KGVuZElkeCwgaW50ZXJ2YWwuZW5kSWR4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5ldyBJbnRlcnZhbChmaXJzdEludGVydmFsLnNvdXJjZVN0cmluZywgc3RhcnRJZHgsIGVuZElkeCk7XG59O1xuIiwiaW1wb3J0IHtJbnRlcnZhbH0gZnJvbSAnLi9JbnRlcnZhbC5qcyc7XG5cbmNvbnN0IE1BWF9DSEFSX0NPREUgPSAweGZmZmY7XG5cbmV4cG9ydCBjbGFzcyBJbnB1dFN0cmVhbSB7XG4gIGNvbnN0cnVjdG9yKHNvdXJjZSkge1xuICAgIHRoaXMuc291cmNlID0gc291cmNlO1xuICAgIHRoaXMucG9zID0gMDtcbiAgICB0aGlzLmV4YW1pbmVkTGVuZ3RoID0gMDtcbiAgfVxuXG4gIGF0RW5kKCkge1xuICAgIGNvbnN0IGFucyA9IHRoaXMucG9zID49IHRoaXMuc291cmNlLmxlbmd0aDtcbiAgICB0aGlzLmV4YW1pbmVkTGVuZ3RoID0gTWF0aC5tYXgodGhpcy5leGFtaW5lZExlbmd0aCwgdGhpcy5wb3MgKyAxKTtcbiAgICByZXR1cm4gYW5zO1xuICB9XG5cbiAgbmV4dCgpIHtcbiAgICBjb25zdCBhbnMgPSB0aGlzLnNvdXJjZVt0aGlzLnBvcysrXTtcbiAgICB0aGlzLmV4YW1pbmVkTGVuZ3RoID0gTWF0aC5tYXgodGhpcy5leGFtaW5lZExlbmd0aCwgdGhpcy5wb3MpO1xuICAgIHJldHVybiBhbnM7XG4gIH1cblxuICBuZXh0Q2hhckNvZGUoKSB7XG4gICAgY29uc3QgbmV4dENoYXIgPSB0aGlzLm5leHQoKTtcbiAgICByZXR1cm4gbmV4dENoYXIgJiYgbmV4dENoYXIuY2hhckNvZGVBdCgwKTtcbiAgfVxuXG4gIG5leHRDb2RlUG9pbnQoKSB7XG4gICAgY29uc3QgY3AgPSB0aGlzLnNvdXJjZS5zbGljZSh0aGlzLnBvcysrKS5jb2RlUG9pbnRBdCgwKTtcbiAgICAvLyBJZiB0aGUgY29kZSBwb2ludCBpcyBiZXlvbmQgcGxhbmUgMCwgaXQgdGFrZXMgdXAgdHdvIGNoYXJhY3RlcnMuXG4gICAgaWYgKGNwID4gTUFYX0NIQVJfQ09ERSkge1xuICAgICAgdGhpcy5wb3MgKz0gMTtcbiAgICB9XG4gICAgdGhpcy5leGFtaW5lZExlbmd0aCA9IE1hdGgubWF4KHRoaXMuZXhhbWluZWRMZW5ndGgsIHRoaXMucG9zKTtcbiAgICByZXR1cm4gY3A7XG4gIH1cblxuICBtYXRjaFN0cmluZyhzLCBvcHRJZ25vcmVDYXNlKSB7XG4gICAgbGV0IGlkeDtcbiAgICBpZiAob3B0SWdub3JlQ2FzZSkge1xuICAgICAgLypcbiAgICAgICAgQ2FzZS1pbnNlbnNpdGl2ZSBjb21wYXJpc29uIGlzIGEgdHJpY2t5IGJ1c2luZXNzLiBTb21lIG5vdGFibGUgZ290Y2hhcyBpbmNsdWRlIHRoZVxuICAgICAgICBcIlR1cmtpc2ggSVwiIHByb2JsZW0gKGh0dHA6Ly93d3cuaTE4bmd1eS5jb20vdW5pY29kZS90dXJraXNoLWkxOG4uaHRtbCkgYW5kIHRoZSBmYWN0XG4gICAgICAgIHRoYXQgdGhlIEdlcm1hbiBFc3N6ZXQgKMOfKSB0dXJucyBpbnRvIFwiU1NcIiBpbiB1cHBlciBjYXNlLlxuXG4gICAgICAgIFRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgYSBsb2NhbGUtaW52YXJpYW50IGNvbXBhcmlzb24sIHdoaWNoIG1lYW5zIGl0IG1heSBub3Qgb2JleVxuICAgICAgICBsb2NhbGUtc3BlY2lmaWMgZXhwZWN0YXRpb25zIChlLmcuIFwiaVwiID0+IFwixLBcIikuXG4gICAgICAgKi9cbiAgICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGNvbnN0IGFjdHVhbCA9IHRoaXMubmV4dCgpO1xuICAgICAgICBjb25zdCBleHBlY3RlZCA9IHNbaWR4XTtcbiAgICAgICAgaWYgKGFjdHVhbCA9PSBudWxsIHx8IGFjdHVhbC50b1VwcGVyQ2FzZSgpICE9PSBleHBlY3RlZC50b1VwcGVyQ2FzZSgpKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gRGVmYXVsdCBpcyBjYXNlLXNlbnNpdGl2ZSBjb21wYXJpc29uLlxuICAgIGZvciAoaWR4ID0gMDsgaWR4IDwgcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICBpZiAodGhpcy5uZXh0KCkgIT09IHNbaWR4XSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgc291cmNlU2xpY2Uoc3RhcnRJZHgsIGVuZElkeCkge1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydElkeCwgZW5kSWR4KTtcbiAgfVxuXG4gIGludGVydmFsKHN0YXJ0SWR4LCBvcHRFbmRJZHgpIHtcbiAgICByZXR1cm4gbmV3IEludGVydmFsKHRoaXMuc291cmNlLCBzdGFydElkeCwgb3B0RW5kSWR4ID8gb3B0RW5kSWR4IDogdGhpcy5wb3MpO1xuICB9XG59XG4iLCJpbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuL3V0aWwuanMnO1xuaW1wb3J0IHtJbnRlcnZhbH0gZnJvbSAnLi9JbnRlcnZhbC5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlIHN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5leHBvcnQgY2xhc3MgTWF0Y2hSZXN1bHQge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIG1hdGNoZXIsXG4gICAgICBpbnB1dCxcbiAgICAgIHN0YXJ0RXhwcixcbiAgICAgIGNzdCxcbiAgICAgIGNzdE9mZnNldCxcbiAgICAgIHJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbixcbiAgICAgIG9wdFJlY29yZGVkRmFpbHVyZXMsXG4gICkge1xuICAgIHRoaXMubWF0Y2hlciA9IG1hdGNoZXI7XG4gICAgdGhpcy5pbnB1dCA9IGlucHV0O1xuICAgIHRoaXMuc3RhcnRFeHByID0gc3RhcnRFeHByO1xuICAgIHRoaXMuX2NzdCA9IGNzdDtcbiAgICB0aGlzLl9jc3RPZmZzZXQgPSBjc3RPZmZzZXQ7XG4gICAgdGhpcy5fcmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uID0gcmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uO1xuICAgIHRoaXMuX3JpZ2h0bW9zdEZhaWx1cmVzID0gb3B0UmVjb3JkZWRGYWlsdXJlcztcblxuICAgIGlmICh0aGlzLmZhaWxlZCgpKSB7XG4gICAgICAvKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cbiAgICAgIGNvbW1vbi5kZWZpbmVMYXp5UHJvcGVydHkodGhpcywgJ21lc3NhZ2UnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgZGV0YWlsID0gJ0V4cGVjdGVkICcgKyB0aGlzLmdldEV4cGVjdGVkVGV4dCgpO1xuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIHV0aWwuZ2V0TGluZUFuZENvbHVtbk1lc3NhZ2UodGhpcy5pbnB1dCwgdGhpcy5nZXRSaWdodG1vc3RGYWlsdXJlUG9zaXRpb24oKSkgKyBkZXRhaWxcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgICAgY29tbW9uLmRlZmluZUxhenlQcm9wZXJ0eSh0aGlzLCAnc2hvcnRNZXNzYWdlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnN0IGRldGFpbCA9ICdleHBlY3RlZCAnICsgdGhpcy5nZXRFeHBlY3RlZFRleHQoKTtcbiAgICAgICAgY29uc3QgZXJyb3JJbmZvID0gdXRpbC5nZXRMaW5lQW5kQ29sdW1uKFxuICAgICAgICAgICAgdGhpcy5pbnB1dCxcbiAgICAgICAgICAgIHRoaXMuZ2V0UmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uKCksXG4gICAgICAgICk7XG4gICAgICAgIHJldHVybiAnTGluZSAnICsgZXJyb3JJbmZvLmxpbmVOdW0gKyAnLCBjb2wgJyArIGVycm9ySW5mby5jb2xOdW0gKyAnOiAnICsgZGV0YWlsO1xuICAgICAgfSk7XG4gICAgICAvKiBlc2xpbnQtZW5hYmxlIG5vLWludmFsaWQtdGhpcyAqL1xuICAgIH1cbiAgfVxuXG4gIHN1Y2NlZWRlZCgpIHtcbiAgICByZXR1cm4gISF0aGlzLl9jc3Q7XG4gIH1cblxuICBmYWlsZWQoKSB7XG4gICAgcmV0dXJuICF0aGlzLnN1Y2NlZWRlZCgpO1xuICB9XG5cbiAgZ2V0UmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9yaWdodG1vc3RGYWlsdXJlUG9zaXRpb247XG4gIH1cblxuICBnZXRSaWdodG1vc3RGYWlsdXJlcygpIHtcbiAgICBpZiAoIXRoaXMuX3JpZ2h0bW9zdEZhaWx1cmVzKSB7XG4gICAgICB0aGlzLm1hdGNoZXIuc2V0SW5wdXQodGhpcy5pbnB1dCk7XG4gICAgICBjb25zdCBtYXRjaFJlc3VsdFdpdGhGYWlsdXJlcyA9IHRoaXMubWF0Y2hlci5fbWF0Y2godGhpcy5zdGFydEV4cHIsIHtcbiAgICAgICAgdHJhY2luZzogZmFsc2UsXG4gICAgICAgIHBvc2l0aW9uVG9SZWNvcmRGYWlsdXJlczogdGhpcy5nZXRSaWdodG1vc3RGYWlsdXJlUG9zaXRpb24oKSxcbiAgICAgIH0pO1xuICAgICAgdGhpcy5fcmlnaHRtb3N0RmFpbHVyZXMgPSBtYXRjaFJlc3VsdFdpdGhGYWlsdXJlcy5nZXRSaWdodG1vc3RGYWlsdXJlcygpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fcmlnaHRtb3N0RmFpbHVyZXM7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5zdWNjZWVkZWQoKSA/XG4gICAgICAnW21hdGNoIHN1Y2NlZWRlZF0nIDpcbiAgICAgICdbbWF0Y2ggZmFpbGVkIGF0IHBvc2l0aW9uICcgKyB0aGlzLmdldFJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbigpICsgJ10nO1xuICB9XG5cbiAgLy8gUmV0dXJuIGEgc3RyaW5nIHN1bW1hcml6aW5nIHRoZSBleHBlY3RlZCBjb250ZW50cyBvZiB0aGUgaW5wdXQgc3RyZWFtIHdoZW5cbiAgLy8gdGhlIG1hdGNoIGZhaWx1cmUgb2NjdXJyZWQuXG4gIGdldEV4cGVjdGVkVGV4dCgpIHtcbiAgICBpZiAodGhpcy5zdWNjZWVkZWQoKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZ2V0IGV4cGVjdGVkIHRleHQgb2YgYSBzdWNjZXNzZnVsIE1hdGNoUmVzdWx0Jyk7XG4gICAgfVxuXG4gICAgY29uc3Qgc2IgPSBuZXcgY29tbW9uLlN0cmluZ0J1ZmZlcigpO1xuICAgIGxldCBmYWlsdXJlcyA9IHRoaXMuZ2V0UmlnaHRtb3N0RmFpbHVyZXMoKTtcblxuICAgIC8vIEZpbHRlciBvdXQgdGhlIGZsdWZmeSBmYWlsdXJlcyB0byBtYWtlIHRoZSBkZWZhdWx0IGVycm9yIG1lc3NhZ2VzIG1vcmUgdXNlZnVsXG4gICAgZmFpbHVyZXMgPSBmYWlsdXJlcy5maWx0ZXIoZmFpbHVyZSA9PiAhZmFpbHVyZS5pc0ZsdWZmeSgpKTtcblxuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGZhaWx1cmVzLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGlmIChpZHggPiAwKSB7XG4gICAgICAgIGlmIChpZHggPT09IGZhaWx1cmVzLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgICBzYi5hcHBlbmQoZmFpbHVyZXMubGVuZ3RoID4gMiA/ICcsIG9yICcgOiAnIG9yICcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNiLmFwcGVuZCgnLCAnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2IuYXBwZW5kKGZhaWx1cmVzW2lkeF0udG9TdHJpbmcoKSk7XG4gICAgfVxuICAgIHJldHVybiBzYi5jb250ZW50cygpO1xuICB9XG5cbiAgZ2V0SW50ZXJ2YWwoKSB7XG4gICAgY29uc3QgcG9zID0gdGhpcy5nZXRSaWdodG1vc3RGYWlsdXJlUG9zaXRpb24oKTtcbiAgICByZXR1cm4gbmV3IEludGVydmFsKHRoaXMuaW5wdXQsIHBvcywgcG9zKTtcbiAgfVxufVxuIiwiZXhwb3J0IGNsYXNzIFBvc0luZm8ge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmFwcGxpY2F0aW9uTWVtb0tleVN0YWNrID0gW107IC8vIGFjdGl2ZSBhcHBsaWNhdGlvbnMgYXQgdGhpcyBwb3NpdGlvblxuICAgIHRoaXMubWVtbyA9IHt9O1xuICAgIHRoaXMubWF4RXhhbWluZWRMZW5ndGggPSAwO1xuICAgIHRoaXMubWF4UmlnaHRtb3N0RmFpbHVyZU9mZnNldCA9IC0xO1xuICAgIHRoaXMuY3VycmVudExlZnRSZWN1cnNpb24gPSB1bmRlZmluZWQ7XG4gIH1cblxuICBpc0FjdGl2ZShhcHBsaWNhdGlvbikge1xuICAgIHJldHVybiB0aGlzLmFwcGxpY2F0aW9uTWVtb0tleVN0YWNrLmluZGV4T2YoYXBwbGljYXRpb24udG9NZW1vS2V5KCkpID49IDA7XG4gIH1cblxuICBlbnRlcihhcHBsaWNhdGlvbikge1xuICAgIHRoaXMuYXBwbGljYXRpb25NZW1vS2V5U3RhY2sucHVzaChhcHBsaWNhdGlvbi50b01lbW9LZXkoKSk7XG4gIH1cblxuICBleGl0KCkge1xuICAgIHRoaXMuYXBwbGljYXRpb25NZW1vS2V5U3RhY2sucG9wKCk7XG4gIH1cblxuICBzdGFydExlZnRSZWN1cnNpb24oaGVhZEFwcGxpY2F0aW9uLCBtZW1vUmVjKSB7XG4gICAgbWVtb1JlYy5pc0xlZnRSZWN1cnNpb24gPSB0cnVlO1xuICAgIG1lbW9SZWMuaGVhZEFwcGxpY2F0aW9uID0gaGVhZEFwcGxpY2F0aW9uO1xuICAgIG1lbW9SZWMubmV4dExlZnRSZWN1cnNpb24gPSB0aGlzLmN1cnJlbnRMZWZ0UmVjdXJzaW9uO1xuICAgIHRoaXMuY3VycmVudExlZnRSZWN1cnNpb24gPSBtZW1vUmVjO1xuXG4gICAgY29uc3Qge2FwcGxpY2F0aW9uTWVtb0tleVN0YWNrfSA9IHRoaXM7XG4gICAgY29uc3QgaW5kZXhPZkZpcnN0SW52b2x2ZWRSdWxlID1cbiAgICAgIGFwcGxpY2F0aW9uTWVtb0tleVN0YWNrLmluZGV4T2YoaGVhZEFwcGxpY2F0aW9uLnRvTWVtb0tleSgpKSArIDE7XG4gICAgY29uc3QgaW52b2x2ZWRBcHBsaWNhdGlvbk1lbW9LZXlzID0gYXBwbGljYXRpb25NZW1vS2V5U3RhY2suc2xpY2UoXG4gICAgICAgIGluZGV4T2ZGaXJzdEludm9sdmVkUnVsZSxcbiAgICApO1xuXG4gICAgbWVtb1JlYy5pc0ludm9sdmVkID0gZnVuY3Rpb24oYXBwbGljYXRpb25NZW1vS2V5KSB7XG4gICAgICByZXR1cm4gaW52b2x2ZWRBcHBsaWNhdGlvbk1lbW9LZXlzLmluZGV4T2YoYXBwbGljYXRpb25NZW1vS2V5KSA+PSAwO1xuICAgIH07XG5cbiAgICBtZW1vUmVjLnVwZGF0ZUludm9sdmVkQXBwbGljYXRpb25NZW1vS2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgZm9yIChsZXQgaWR4ID0gaW5kZXhPZkZpcnN0SW52b2x2ZWRSdWxlOyBpZHggPCBhcHBsaWNhdGlvbk1lbW9LZXlTdGFjay5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICAgIGNvbnN0IGFwcGxpY2F0aW9uTWVtb0tleSA9IGFwcGxpY2F0aW9uTWVtb0tleVN0YWNrW2lkeF07XG4gICAgICAgIGlmICghdGhpcy5pc0ludm9sdmVkKGFwcGxpY2F0aW9uTWVtb0tleSkpIHtcbiAgICAgICAgICBpbnZvbHZlZEFwcGxpY2F0aW9uTWVtb0tleXMucHVzaChhcHBsaWNhdGlvbk1lbW9LZXkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIGVuZExlZnRSZWN1cnNpb24oKSB7XG4gICAgdGhpcy5jdXJyZW50TGVmdFJlY3Vyc2lvbiA9IHRoaXMuY3VycmVudExlZnRSZWN1cnNpb24ubmV4dExlZnRSZWN1cnNpb247XG4gIH1cblxuICAvLyBOb3RlOiB0aGlzIG1ldGhvZCBkb2Vzbid0IGdldCBjYWxsZWQgZm9yIHRoZSBcImhlYWRcIiBvZiBhIGxlZnQgcmVjdXJzaW9uIC0tIGZvciBMUiBoZWFkcyxcbiAgLy8gdGhlIG1lbW9pemVkIHJlc3VsdCAod2hpY2ggc3RhcnRzIG91dCBiZWluZyBhIGZhaWx1cmUpIGlzIGFsd2F5cyB1c2VkLlxuICBzaG91bGRVc2VNZW1vaXplZFJlc3VsdChtZW1vUmVjKSB7XG4gICAgaWYgKCFtZW1vUmVjLmlzTGVmdFJlY3Vyc2lvbikge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNvbnN0IHthcHBsaWNhdGlvbk1lbW9LZXlTdGFja30gPSB0aGlzO1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IGFwcGxpY2F0aW9uTWVtb0tleVN0YWNrLmxlbmd0aDsgaWR4KyspIHtcbiAgICAgIGNvbnN0IGFwcGxpY2F0aW9uTWVtb0tleSA9IGFwcGxpY2F0aW9uTWVtb0tleVN0YWNrW2lkeF07XG4gICAgICBpZiAobWVtb1JlYy5pc0ludm9sdmVkKGFwcGxpY2F0aW9uTWVtb0tleSkpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIG1lbW9pemUobWVtb0tleSwgbWVtb1JlYykge1xuICAgIHRoaXMubWVtb1ttZW1vS2V5XSA9IG1lbW9SZWM7XG4gICAgdGhpcy5tYXhFeGFtaW5lZExlbmd0aCA9IE1hdGgubWF4KHRoaXMubWF4RXhhbWluZWRMZW5ndGgsIG1lbW9SZWMuZXhhbWluZWRMZW5ndGgpO1xuICAgIHRoaXMubWF4UmlnaHRtb3N0RmFpbHVyZU9mZnNldCA9IE1hdGgubWF4KFxuICAgICAgICB0aGlzLm1heFJpZ2h0bW9zdEZhaWx1cmVPZmZzZXQsXG4gICAgICAgIG1lbW9SZWMucmlnaHRtb3N0RmFpbHVyZU9mZnNldCxcbiAgICApO1xuICAgIHJldHVybiBtZW1vUmVjO1xuICB9XG5cbiAgY2xlYXJPYnNvbGV0ZUVudHJpZXMocG9zLCBpbnZhbGlkYXRlZElkeCkge1xuICAgIGlmIChwb3MgKyB0aGlzLm1heEV4YW1pbmVkTGVuZ3RoIDw9IGludmFsaWRhdGVkSWR4KSB7XG4gICAgICAvLyBPcHRpbWl6YXRpb246IG5vbmUgb2YgdGhlIHJ1bGUgYXBwbGljYXRpb25zIHRoYXQgd2VyZSBtZW1vaXplZCBoZXJlIGV4YW1pbmVkIHRoZVxuICAgICAgLy8gaW50ZXJ2YWwgb2YgdGhlIGlucHV0IHRoYXQgY2hhbmdlZCwgc28gbm90aGluZyBoYXMgdG8gYmUgaW52YWxpZGF0ZWQuXG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3Qge21lbW99ID0gdGhpcztcbiAgICB0aGlzLm1heEV4YW1pbmVkTGVuZ3RoID0gMDtcbiAgICB0aGlzLm1heFJpZ2h0bW9zdEZhaWx1cmVPZmZzZXQgPSAtMTtcbiAgICBPYmplY3Qua2V5cyhtZW1vKS5mb3JFYWNoKGsgPT4ge1xuICAgICAgY29uc3QgbWVtb1JlYyA9IG1lbW9ba107XG4gICAgICBpZiAocG9zICsgbWVtb1JlYy5leGFtaW5lZExlbmd0aCA+IGludmFsaWRhdGVkSWR4KSB7XG4gICAgICAgIGRlbGV0ZSBtZW1vW2tdO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5tYXhFeGFtaW5lZExlbmd0aCA9IE1hdGgubWF4KHRoaXMubWF4RXhhbWluZWRMZW5ndGgsIG1lbW9SZWMuZXhhbWluZWRMZW5ndGgpO1xuICAgICAgICB0aGlzLm1heFJpZ2h0bW9zdEZhaWx1cmVPZmZzZXQgPSBNYXRoLm1heChcbiAgICAgICAgICAgIHRoaXMubWF4UmlnaHRtb3N0RmFpbHVyZU9mZnNldCxcbiAgICAgICAgICAgIG1lbW9SZWMucmlnaHRtb3N0RmFpbHVyZU9mZnNldCxcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtJbnRlcnZhbH0gZnJvbSAnLi9JbnRlcnZhbC5qcyc7XG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9jb21tb24uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJpdmF0ZSBzdHVmZlxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gVW5pY29kZSBjaGFyYWN0ZXJzIHRoYXQgYXJlIHVzZWQgaW4gdGhlIGB0b1N0cmluZ2Agb3V0cHV0LlxuY29uc3QgQkFMTE9UX1ggPSAnXFx1MjcxNyc7XG5jb25zdCBDSEVDS19NQVJLID0gJ1xcdTI3MTMnO1xuY29uc3QgRE9UX09QRVJBVE9SID0gJ1xcdTIyQzUnO1xuY29uc3QgUklHSFRXQVJEU19ET1VCTEVfQVJST1cgPSAnXFx1MjFEMic7XG5jb25zdCBTWU1CT0xfRk9SX0hPUklaT05UQUxfVEFCVUxBVElPTiA9ICdcXHUyNDA5JztcbmNvbnN0IFNZTUJPTF9GT1JfTElORV9GRUVEID0gJ1xcdTI0MEEnO1xuY29uc3QgU1lNQk9MX0ZPUl9DQVJSSUFHRV9SRVRVUk4gPSAnXFx1MjQwRCc7XG5cbmNvbnN0IEZsYWdzID0ge1xuICBzdWNjZWVkZWQ6IDEgPDwgMCxcbiAgaXNSb290Tm9kZTogMSA8PCAxLFxuICBpc0ltcGxpY2l0U3BhY2VzOiAxIDw8IDIsXG4gIGlzTWVtb2l6ZWQ6IDEgPDwgMyxcbiAgaXNIZWFkT2ZMZWZ0UmVjdXJzaW9uOiAxIDw8IDQsXG4gIHRlcm1pbmF0ZXNMUjogMSA8PCA1LFxufTtcblxuZnVuY3Rpb24gc3BhY2VzKG4pIHtcbiAgcmV0dXJuIGNvbW1vbi5yZXBlYXQoJyAnLCBuKS5qb2luKCcnKTtcbn1cblxuLy8gUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGEgcG9ydGlvbiBvZiBgaW5wdXRgIGF0IG9mZnNldCBgcG9zYC5cbi8vIFRoZSByZXN1bHQgd2lsbCBjb250YWluIGV4YWN0bHkgYGxlbmAgY2hhcmFjdGVycy5cbmZ1bmN0aW9uIGdldElucHV0RXhjZXJwdChpbnB1dCwgcG9zLCBsZW4pIHtcbiAgY29uc3QgZXhjZXJwdCA9IGFzRXNjYXBlZFN0cmluZyhpbnB1dC5zbGljZShwb3MsIHBvcyArIGxlbikpO1xuXG4gIC8vIFBhZCB0aGUgb3V0cHV0IGlmIG5lY2Vzc2FyeS5cbiAgaWYgKGV4Y2VycHQubGVuZ3RoIDwgbGVuKSB7XG4gICAgcmV0dXJuIGV4Y2VycHQgKyBjb21tb24ucmVwZWF0KCcgJywgbGVuIC0gZXhjZXJwdC5sZW5ndGgpLmpvaW4oJycpO1xuICB9XG4gIHJldHVybiBleGNlcnB0O1xufVxuXG5mdW5jdGlvbiBhc0VzY2FwZWRTdHJpbmcob2JqKSB7XG4gIGlmICh0eXBlb2Ygb2JqID09PSAnc3RyaW5nJykge1xuICAgIC8vIFJlcGxhY2Ugbm9uLXByaW50YWJsZSBjaGFyYWN0ZXJzIHdpdGggdmlzaWJsZSBzeW1ib2xzLlxuICAgIHJldHVybiBvYmpcbiAgICAgICAgLnJlcGxhY2UoLyAvZywgRE9UX09QRVJBVE9SKVxuICAgICAgICAucmVwbGFjZSgvXFx0L2csIFNZTUJPTF9GT1JfSE9SSVpPTlRBTF9UQUJVTEFUSU9OKVxuICAgICAgICAucmVwbGFjZSgvXFxuL2csIFNZTUJPTF9GT1JfTElORV9GRUVEKVxuICAgICAgICAucmVwbGFjZSgvXFxyL2csIFNZTUJPTF9GT1JfQ0FSUklBR0VfUkVUVVJOKTtcbiAgfVxuICByZXR1cm4gU3RyaW5nKG9iaik7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tIFRyYWNlIC0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjbGFzcyBUcmFjZSB7XG4gIGNvbnN0cnVjdG9yKGlucHV0LCBwb3MxLCBwb3MyLCBleHByLCBzdWNjZWVkZWQsIGJpbmRpbmdzLCBvcHRDaGlsZHJlbikge1xuICAgIHRoaXMuaW5wdXQgPSBpbnB1dDtcbiAgICB0aGlzLnBvcyA9IHRoaXMucG9zMSA9IHBvczE7XG4gICAgdGhpcy5wb3MyID0gcG9zMjtcbiAgICB0aGlzLnNvdXJjZSA9IG5ldyBJbnRlcnZhbChpbnB1dCwgcG9zMSwgcG9zMik7XG4gICAgdGhpcy5leHByID0gZXhwcjtcbiAgICB0aGlzLmJpbmRpbmdzID0gYmluZGluZ3M7XG4gICAgdGhpcy5jaGlsZHJlbiA9IG9wdENoaWxkcmVuIHx8IFtdO1xuICAgIHRoaXMudGVybWluYXRpbmdMUkVudHJ5ID0gbnVsbDtcblxuICAgIHRoaXMuX2ZsYWdzID0gc3VjY2VlZGVkID8gRmxhZ3Muc3VjY2VlZGVkIDogMDtcbiAgfVxuXG4gIGdldCBkaXNwbGF5U3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmV4cHIudG9EaXNwbGF5U3RyaW5nKCk7XG4gIH1cblxuICBjbG9uZSgpIHtcbiAgICByZXR1cm4gdGhpcy5jbG9uZVdpdGhFeHByKHRoaXMuZXhwcik7XG4gIH1cblxuICBjbG9uZVdpdGhFeHByKGV4cHIpIHtcbiAgICBjb25zdCBhbnMgPSBuZXcgVHJhY2UoXG4gICAgICAgIHRoaXMuaW5wdXQsXG4gICAgICAgIHRoaXMucG9zLFxuICAgICAgICB0aGlzLnBvczIsXG4gICAgICAgIGV4cHIsXG4gICAgICAgIHRoaXMuc3VjY2VlZGVkLFxuICAgICAgICB0aGlzLmJpbmRpbmdzLFxuICAgICAgICB0aGlzLmNoaWxkcmVuLFxuICAgICk7XG5cbiAgICBhbnMuaXNIZWFkT2ZMZWZ0UmVjdXJzaW9uID0gdGhpcy5pc0hlYWRPZkxlZnRSZWN1cnNpb247XG4gICAgYW5zLmlzSW1wbGljaXRTcGFjZXMgPSB0aGlzLmlzSW1wbGljaXRTcGFjZXM7XG4gICAgYW5zLmlzTWVtb2l6ZWQgPSB0aGlzLmlzTWVtb2l6ZWQ7XG4gICAgYW5zLmlzUm9vdE5vZGUgPSB0aGlzLmlzUm9vdE5vZGU7XG4gICAgYW5zLnRlcm1pbmF0ZXNMUiA9IHRoaXMudGVybWluYXRlc0xSO1xuICAgIGFucy50ZXJtaW5hdGluZ0xSRW50cnkgPSB0aGlzLnRlcm1pbmF0aW5nTFJFbnRyeTtcbiAgICByZXR1cm4gYW5zO1xuICB9XG5cbiAgLy8gUmVjb3JkIHRoZSB0cmFjZSBpbmZvcm1hdGlvbiBmb3IgdGhlIHRlcm1pbmF0aW5nIGNvbmRpdGlvbiBvZiB0aGUgTFIgbG9vcC5cbiAgcmVjb3JkTFJUZXJtaW5hdGlvbihydWxlQm9keVRyYWNlLCB2YWx1ZSkge1xuICAgIHRoaXMudGVybWluYXRpbmdMUkVudHJ5ID0gbmV3IFRyYWNlKFxuICAgICAgICB0aGlzLmlucHV0LFxuICAgICAgICB0aGlzLnBvcyxcbiAgICAgICAgdGhpcy5wb3MyLFxuICAgICAgICB0aGlzLmV4cHIsXG4gICAgICAgIGZhbHNlLFxuICAgICAgICBbdmFsdWVdLFxuICAgICAgICBbcnVsZUJvZHlUcmFjZV0sXG4gICAgKTtcbiAgICB0aGlzLnRlcm1pbmF0aW5nTFJFbnRyeS50ZXJtaW5hdGVzTFIgPSB0cnVlO1xuICB9XG5cbiAgLy8gUmVjdXJzaXZlbHkgdHJhdmVyc2UgdGhpcyB0cmFjZSBub2RlIGFuZCBhbGwgaXRzIGRlc2NlbmRlbnRzLCBjYWxsaW5nIGEgdmlzaXRvciBmdW5jdGlvblxuICAvLyBmb3IgZWFjaCBub2RlIHRoYXQgaXMgdmlzaXRlZC4gSWYgYHZpc3Rvck9iak9yRm5gIGlzIGFuIG9iamVjdCwgdGhlbiBpdHMgJ2VudGVyJyBwcm9wZXJ0eVxuICAvLyBpcyBhIGZ1bmN0aW9uIHRvIGNhbGwgYmVmb3JlIHZpc2l0aW5nIHRoZSBjaGlsZHJlbiBvZiBhIG5vZGUsIGFuZCBpdHMgJ2V4aXQnIHByb3BlcnR5IGlzXG4gIC8vIGEgZnVuY3Rpb24gdG8gY2FsbCBhZnRlcndhcmRzLiBJZiBgdmlzaXRvck9iak9yRm5gIGlzIGEgZnVuY3Rpb24sIGl0IHJlcHJlc2VudHMgdGhlICdlbnRlcidcbiAgLy8gZnVuY3Rpb24uXG4gIC8vXG4gIC8vIFRoZSBmdW5jdGlvbnMgYXJlIGNhbGxlZCB3aXRoIHRocmVlIGFyZ3VtZW50czogdGhlIFRyYWNlIG5vZGUsIGl0cyBwYXJlbnQgVHJhY2UsIGFuZCBhIG51bWJlclxuICAvLyByZXByZXNlbnRpbmcgdGhlIGRlcHRoIG9mIHRoZSBub2RlIGluIHRoZSB0cmVlLiAoVGhlIHJvb3Qgbm9kZSBoYXMgZGVwdGggMC4pIGBvcHRUaGlzQXJnYCwgaWZcbiAgLy8gc3BlY2lmaWVkLCBpcyB0aGUgdmFsdWUgdG8gdXNlIGZvciBgdGhpc2Agd2hlbiBleGVjdXRpbmcgdGhlIHZpc2l0b3IgZnVuY3Rpb25zLlxuICB3YWxrKHZpc2l0b3JPYmpPckZuLCBvcHRUaGlzQXJnKSB7XG4gICAgbGV0IHZpc2l0b3IgPSB2aXNpdG9yT2JqT3JGbjtcbiAgICBpZiAodHlwZW9mIHZpc2l0b3IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHZpc2l0b3IgPSB7ZW50ZXI6IHZpc2l0b3J9O1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIF93YWxrKG5vZGUsIHBhcmVudCwgZGVwdGgpIHtcbiAgICAgIGxldCByZWN1cnNlID0gdHJ1ZTtcbiAgICAgIGlmICh2aXNpdG9yLmVudGVyKSB7XG4gICAgICAgIGlmICh2aXNpdG9yLmVudGVyLmNhbGwob3B0VGhpc0FyZywgbm9kZSwgcGFyZW50LCBkZXB0aCkgPT09IFRyYWNlLnByb3RvdHlwZS5TS0lQKSB7XG4gICAgICAgICAgcmVjdXJzZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAocmVjdXJzZSkge1xuICAgICAgICBub2RlLmNoaWxkcmVuLmZvckVhY2goY2hpbGQgPT4ge1xuICAgICAgICAgIF93YWxrKGNoaWxkLCBub2RlLCBkZXB0aCArIDEpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKHZpc2l0b3IuZXhpdCkge1xuICAgICAgICAgIHZpc2l0b3IuZXhpdC5jYWxsKG9wdFRoaXNBcmcsIG5vZGUsIHBhcmVudCwgZGVwdGgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLmlzUm9vdE5vZGUpIHtcbiAgICAgIC8vIERvbid0IHZpc2l0IHRoZSByb290IG5vZGUgaXRzZWxmLCBvbmx5IGl0cyBjaGlsZHJlbi5cbiAgICAgIHRoaXMuY2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgICAgX3dhbGsoYywgbnVsbCwgMCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgX3dhbGsodGhpcywgbnVsbCwgMCk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJuIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFjZS5cbiAgLy8gU2FtcGxlOlxuICAvLyAgICAgMTLii4Ur4ouFMuKLhSrii4UzIOKckyBleHAg4oeSICBcIjEyXCJcbiAgLy8gICAgIDEy4ouFK+KLhTLii4Uq4ouFMyAgIOKckyBhZGRFeHAgKExSKSDih5IgIFwiMTJcIlxuICAvLyAgICAgMTLii4Ur4ouFMuKLhSrii4UzICAgICAgIOKclyBhZGRFeHBfcGx1c1xuICB0b1N0cmluZygpIHtcbiAgICBjb25zdCBzYiA9IG5ldyBjb21tb24uU3RyaW5nQnVmZmVyKCk7XG4gICAgdGhpcy53YWxrKChub2RlLCBwYXJlbnQsIGRlcHRoKSA9PiB7XG4gICAgICBpZiAoIW5vZGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuU0tJUDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN0b3JOYW1lID0gbm9kZS5leHByLmNvbnN0cnVjdG9yLm5hbWU7XG4gICAgICAvLyBEb24ndCBwcmludCBhbnl0aGluZyBmb3IgQWx0IG5vZGVzLlxuICAgICAgaWYgKGN0b3JOYW1lID09PSAnQWx0Jykge1xuICAgICAgICByZXR1cm47IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29uc2lzdGVudC1yZXR1cm5cbiAgICAgIH1cbiAgICAgIHNiLmFwcGVuZChnZXRJbnB1dEV4Y2VycHQobm9kZS5pbnB1dCwgbm9kZS5wb3MsIDEwKSArIHNwYWNlcyhkZXB0aCAqIDIgKyAxKSk7XG4gICAgICBzYi5hcHBlbmQoKG5vZGUuc3VjY2VlZGVkID8gQ0hFQ0tfTUFSSyA6IEJBTExPVF9YKSArICcgJyArIG5vZGUuZGlzcGxheVN0cmluZyk7XG4gICAgICBpZiAobm9kZS5pc0hlYWRPZkxlZnRSZWN1cnNpb24pIHtcbiAgICAgICAgc2IuYXBwZW5kKCcgKExSKScpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUuc3VjY2VlZGVkKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRzID0gYXNFc2NhcGVkU3RyaW5nKG5vZGUuc291cmNlLmNvbnRlbnRzKTtcbiAgICAgICAgc2IuYXBwZW5kKCcgJyArIFJJR0hUV0FSRFNfRE9VQkxFX0FSUk9XICsgJyAgJyk7XG4gICAgICAgIHNiLmFwcGVuZCh0eXBlb2YgY29udGVudHMgPT09ICdzdHJpbmcnID8gJ1wiJyArIGNvbnRlbnRzICsgJ1wiJyA6IGNvbnRlbnRzKTtcbiAgICAgIH1cbiAgICAgIHNiLmFwcGVuZCgnXFxuJyk7XG4gICAgfSk7XG4gICAgcmV0dXJuIHNiLmNvbnRlbnRzKCk7XG4gIH1cbn1cblxuLy8gQSB2YWx1ZSB0aGF0IGNhbiBiZSByZXR1cm5lZCBmcm9tIHZpc2l0b3IgZnVuY3Rpb25zIHRvIGluZGljYXRlIHRoYXQgYVxuLy8gbm9kZSBzaG91bGQgbm90IGJlIHJlY3Vyc2VkIGludG8uXG5UcmFjZS5wcm90b3R5cGUuU0tJUCA9IHt9O1xuXG4vLyBGb3IgY29udmVuaWVuY2UsIGNyZWF0ZSBhIGdldHRlciBhbmQgc2V0dGVyIGZvciB0aGUgYm9vbGVhbiBmbGFncyBpbiBgRmxhZ3NgLlxuT2JqZWN0LmtleXMoRmxhZ3MpLmZvckVhY2gobmFtZSA9PiB7XG4gIGNvbnN0IG1hc2sgPSBGbGFnc1tuYW1lXTtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFRyYWNlLnByb3RvdHlwZSwgbmFtZSwge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiAodGhpcy5fZmxhZ3MgJiBtYXNrKSAhPT0gMDtcbiAgICB9LFxuICAgIHNldCh2YWwpIHtcbiAgICAgIGlmICh2YWwpIHtcbiAgICAgICAgdGhpcy5fZmxhZ3MgfD0gbWFzaztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuX2ZsYWdzICY9IH5tYXNrO1xuICAgICAgfVxuICAgIH0sXG4gIH0pO1xufSk7XG4iLCJpbXBvcnQge2Fic3RyYWN0fSBmcm9tICcuL2NvbW1vbi5qcyc7XG5pbXBvcnQgKiBhcyBwZXhwcnMgZnJvbSAnLi9wZXhwcnMtbWFpbi5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPcGVyYXRpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKlxuICBSZXR1cm4gdHJ1ZSBpZiB3ZSBzaG91bGQgc2tpcCBzcGFjZXMgcHJlY2VkaW5nIHRoaXMgZXhwcmVzc2lvbiBpbiBhIHN5bnRhY3RpYyBjb250ZXh0LlxuKi9cbnBleHBycy5QRXhwci5wcm90b3R5cGUuYWxsb3dzU2tpcHBpbmdQcmVjZWRpbmdTcGFjZSA9IGFic3RyYWN0KCdhbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlJyk7XG5cbi8qXG4gIEdlbmVyYWxseSwgdGhlc2UgYXJlIGFsbCBmaXJzdC1vcmRlciBleHByZXNzaW9ucyBhbmQgKHdpdGggdGhlIGV4Y2VwdGlvbiBvZiBBcHBseSlcbiAgZGlyZWN0bHkgcmVhZCBmcm9tIHRoZSBpbnB1dCBzdHJlYW0uXG4qL1xucGV4cHJzLmFueS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLmVuZC5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLkFwcGx5LnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLlRlcm1pbmFsLnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLlJhbmdlLnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLlVuaWNvZGVDaGFyLnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgICBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG5cbi8qXG4gIEhpZ2hlci1vcmRlciBleHByZXNzaW9ucyB0aGF0IGRvbid0IGRpcmVjdGx5IGNvbnN1bWUgaW5wdXQuXG4qL1xucGV4cHJzLkFsdC5wcm90b3R5cGUuYWxsb3dzU2tpcHBpbmdQcmVjZWRpbmdTcGFjZSA9XG4gIHBleHBycy5JdGVyLnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLkxleC5wcm90b3R5cGUuYWxsb3dzU2tpcHBpbmdQcmVjZWRpbmdTcGFjZSA9XG4gIHBleHBycy5Mb29rYWhlYWQucHJvdG90eXBlLmFsbG93c1NraXBwaW5nUHJlY2VkaW5nU3BhY2UgPVxuICBwZXhwcnMuTm90LnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLlBhcmFtLnByb3RvdHlwZS5hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlID1cbiAgcGV4cHJzLlNlcS5wcm90b3R5cGUuYWxsb3dzU2tpcHBpbmdQcmVjZWRpbmdTcGFjZSA9XG4gICAgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfTtcbiIsImltcG9ydCB7YWJzdHJhY3QsIGlzU3ludGFjdGljfSBmcm9tICcuL2NvbW1vbi5qcyc7XG5pbXBvcnQgKiBhcyBlcnJvcnMgZnJvbSAnLi9lcnJvcnMuanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLW1haW4uanMnO1xuaW1wb3J0ICogYXMgdXRpbCBmcm9tICcuL3V0aWwuanMnO1xuXG5sZXQgQnVpbHRJblJ1bGVzO1xuXG51dGlsLmF3YWl0QnVpbHRJblJ1bGVzKGcgPT4ge1xuICBCdWlsdEluUnVsZXMgPSBnO1xufSk7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPcGVyYXRpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5sZXQgbGV4aWZ5Q291bnQ7XG5cbnBleHBycy5QRXhwci5wcm90b3R5cGUuYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQgPSBmdW5jdGlvbihydWxlTmFtZSwgZ3JhbW1hcikge1xuICBsZXhpZnlDb3VudCA9IDA7XG4gIHRoaXMuX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkKHJ1bGVOYW1lLCBncmFtbWFyKTtcbn07XG5cbnBleHBycy5QRXhwci5wcm90b3R5cGUuX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkID0gYWJzdHJhY3QoXG4gICAgJ19hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCcsXG4pO1xuXG5wZXhwcnMuYW55Ll9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9XG4gIHBleHBycy5lbmQuX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkID1cbiAgcGV4cHJzLlRlcm1pbmFsLnByb3RvdHlwZS5fYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQgPVxuICBwZXhwcnMuUmFuZ2UucHJvdG90eXBlLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9XG4gIHBleHBycy5QYXJhbS5wcm90b3R5cGUuX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkID1cbiAgcGV4cHJzLlVuaWNvZGVDaGFyLnByb3RvdHlwZS5fYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQgPVxuICAgIGZ1bmN0aW9uKHJ1bGVOYW1lLCBncmFtbWFyKSB7XG4gICAgICAvLyBuby1vcFxuICAgIH07XG5cbnBleHBycy5MZXgucHJvdG90eXBlLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9IGZ1bmN0aW9uKHJ1bGVOYW1lLCBncmFtbWFyKSB7XG4gIGxleGlmeUNvdW50Kys7XG4gIHRoaXMuZXhwci5fYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQocnVsZU5hbWUsIGdyYW1tYXIpO1xuICBsZXhpZnlDb3VudC0tO1xufTtcblxucGV4cHJzLkFsdC5wcm90b3R5cGUuX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkID0gZnVuY3Rpb24ocnVsZU5hbWUsIGdyYW1tYXIpIHtcbiAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy50ZXJtcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpcy50ZXJtc1tpZHhdLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZChydWxlTmFtZSwgZ3JhbW1hcik7XG4gIH1cbn07XG5cbnBleHBycy5TZXEucHJvdG90eXBlLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9IGZ1bmN0aW9uKHJ1bGVOYW1lLCBncmFtbWFyKSB7XG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHRoaXMuZmFjdG9ycy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpcy5mYWN0b3JzW2lkeF0uX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkKHJ1bGVOYW1lLCBncmFtbWFyKTtcbiAgfVxufTtcblxucGV4cHJzLkl0ZXIucHJvdG90eXBlLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9XG4gIHBleHBycy5Ob3QucHJvdG90eXBlLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9XG4gIHBleHBycy5Mb29rYWhlYWQucHJvdG90eXBlLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZCA9XG4gICAgZnVuY3Rpb24ocnVsZU5hbWUsIGdyYW1tYXIpIHtcbiAgICAgIHRoaXMuZXhwci5fYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQocnVsZU5hbWUsIGdyYW1tYXIpO1xuICAgIH07XG5cbnBleHBycy5BcHBseS5wcm90b3R5cGUuX2Fzc2VydEFsbEFwcGxpY2F0aW9uc0FyZVZhbGlkID0gZnVuY3Rpb24oXG4gICAgcnVsZU5hbWUsXG4gICAgZ3JhbW1hcixcbiAgICBza2lwU3ludGFjdGljQ2hlY2sgPSBmYWxzZSxcbikge1xuICBjb25zdCBydWxlSW5mbyA9IGdyYW1tYXIucnVsZXNbdGhpcy5ydWxlTmFtZV07XG4gIGNvbnN0IGlzQ29udGV4dFN5bnRhY3RpYyA9IGlzU3ludGFjdGljKHJ1bGVOYW1lKSAmJiBsZXhpZnlDb3VudCA9PT0gMDtcblxuICAvLyBNYWtlIHN1cmUgdGhhdCB0aGUgcnVsZSBleGlzdHMuLi5cbiAgaWYgKCFydWxlSW5mbykge1xuICAgIHRocm93IGVycm9ycy51bmRlY2xhcmVkUnVsZSh0aGlzLnJ1bGVOYW1lLCBncmFtbWFyLm5hbWUsIHRoaXMuc291cmNlKTtcbiAgfVxuXG4gIC8vIC4uLmFuZCB0aGF0IHRoaXMgYXBwbGljYXRpb24gaXMgYWxsb3dlZFxuICBpZiAoIXNraXBTeW50YWN0aWNDaGVjayAmJiBpc1N5bnRhY3RpYyh0aGlzLnJ1bGVOYW1lKSAmJiAhaXNDb250ZXh0U3ludGFjdGljKSB7XG4gICAgdGhyb3cgZXJyb3JzLmFwcGxpY2F0aW9uT2ZTeW50YWN0aWNSdWxlRnJvbUxleGljYWxDb250ZXh0KHRoaXMucnVsZU5hbWUsIHRoaXMpO1xuICB9XG5cbiAgLy8gLi4uYW5kIHRoYXQgdGhpcyBhcHBsaWNhdGlvbiBoYXMgdGhlIGNvcnJlY3QgbnVtYmVyIG9mIGFyZ3VtZW50cy5cbiAgY29uc3QgYWN0dWFsID0gdGhpcy5hcmdzLmxlbmd0aDtcbiAgY29uc3QgZXhwZWN0ZWQgPSBydWxlSW5mby5mb3JtYWxzLmxlbmd0aDtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICB0aHJvdyBlcnJvcnMud3JvbmdOdW1iZXJPZkFyZ3VtZW50cyh0aGlzLnJ1bGVOYW1lLCBleHBlY3RlZCwgYWN0dWFsLCB0aGlzLnNvdXJjZSk7XG4gIH1cblxuICBjb25zdCBpc0J1aWx0SW5BcHBseVN5bnRhY3RpYyA9XG4gICAgQnVpbHRJblJ1bGVzICYmIHJ1bGVJbmZvID09PSBCdWlsdEluUnVsZXMucnVsZXMuYXBwbHlTeW50YWN0aWM7XG4gIGNvbnN0IGlzQnVpbHRJbkNhc2VJbnNlbnNpdGl2ZSA9XG4gICAgQnVpbHRJblJ1bGVzICYmIHJ1bGVJbmZvID09PSBCdWlsdEluUnVsZXMucnVsZXMuY2FzZUluc2Vuc2l0aXZlO1xuXG4gIC8vIElmIGl0J3MgYW4gYXBwbGljYXRpb24gb2YgJ2Nhc2VJbnNlbnNpdGl2ZScsIGVuc3VyZSB0aGF0IHRoZSBhcmd1bWVudCBpcyBhIFRlcm1pbmFsLlxuICBpZiAoaXNCdWlsdEluQ2FzZUluc2Vuc2l0aXZlKSB7XG4gICAgaWYgKCEodGhpcy5hcmdzWzBdIGluc3RhbmNlb2YgcGV4cHJzLlRlcm1pbmFsKSkge1xuICAgICAgdGhyb3cgZXJyb3JzLmluY29ycmVjdEFyZ3VtZW50VHlwZSgnYSBUZXJtaW5hbCAoZS5nLiBcImFiY1wiKScsIHRoaXMuYXJnc1swXSk7XG4gICAgfVxuICB9XG5cbiAgaWYgKGlzQnVpbHRJbkFwcGx5U3ludGFjdGljKSB7XG4gICAgY29uc3QgYXJnID0gdGhpcy5hcmdzWzBdO1xuICAgIGlmICghKGFyZyBpbnN0YW5jZW9mIHBleHBycy5BcHBseSkpIHtcbiAgICAgIHRocm93IGVycm9ycy5pbmNvcnJlY3RBcmd1bWVudFR5cGUoJ2Egc3ludGFjdGljIHJ1bGUgYXBwbGljYXRpb24nLCBhcmcpO1xuICAgIH1cbiAgICBpZiAoIWlzU3ludGFjdGljKGFyZy5ydWxlTmFtZSkpIHtcbiAgICAgIHRocm93IGVycm9ycy5hcHBseVN5bnRhY3RpY1dpdGhMZXhpY2FsUnVsZUFwcGxpY2F0aW9uKGFyZyk7XG4gICAgfVxuICAgIGlmIChpc0NvbnRleHRTeW50YWN0aWMpIHtcbiAgICAgIHRocm93IGVycm9ycy51bm5lY2Vzc2FyeUV4cGVyaW1lbnRhbEFwcGx5U3ludGFjdGljKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIC8vIC4uLmFuZCB0aGF0IGFsbCBvZiB0aGUgYXJndW1lbnQgZXhwcmVzc2lvbnMgb25seSBoYXZlIHZhbGlkIGFwcGxpY2F0aW9ucyBhbmQgaGF2ZSBhcml0eSAxLlxuICAvLyBJZiBgdGhpc2AgaXMgYW4gYXBwbGljYXRpb24gb2YgdGhlIGJ1aWx0LWluIGFwcGx5U3ludGFjdGljIHJ1bGUsIHRoZW4gaXRzIGFyZyBpc1xuICAvLyBhbGxvd2VkIChhbmQgZXhwZWN0ZWQpIHRvIGJlIGEgc3ludGFjdGljIHJ1bGUsIGV2ZW4gaWYgd2UncmUgaW4gYSBsZXhpY2FsIGNvbnRleHQuXG4gIHRoaXMuYXJncy5mb3JFYWNoKGFyZyA9PiB7XG4gICAgYXJnLl9hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZChydWxlTmFtZSwgZ3JhbW1hciwgaXNCdWlsdEluQXBwbHlTeW50YWN0aWMpO1xuICAgIGlmIChhcmcuZ2V0QXJpdHkoKSAhPT0gMSkge1xuICAgICAgdGhyb3cgZXJyb3JzLmludmFsaWRQYXJhbWV0ZXIodGhpcy5ydWxlTmFtZSwgYXJnKTtcbiAgICB9XG4gIH0pO1xufTtcbiIsImltcG9ydCB7YWJzdHJhY3R9IGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCAqIGFzIGVycm9ycyBmcm9tICcuL2Vycm9ycy5qcyc7XG5pbXBvcnQgKiBhcyBwZXhwcnMgZnJvbSAnLi9wZXhwcnMtbWFpbi5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPcGVyYXRpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5wZXhwcnMuUEV4cHIucHJvdG90eXBlLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5ID0gYWJzdHJhY3QoXG4gICAgJ2Fzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5Jyxcbik7XG5cbnBleHBycy5hbnkuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkgPVxuICBwZXhwcnMuZW5kLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5ID1cbiAgcGV4cHJzLlRlcm1pbmFsLnByb3RvdHlwZS5hc3NlcnRDaG9pY2VzSGF2ZVVuaWZvcm1Bcml0eSA9XG4gIHBleHBycy5SYW5nZS5wcm90b3R5cGUuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkgPVxuICBwZXhwcnMuUGFyYW0ucHJvdG90eXBlLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5ID1cbiAgcGV4cHJzLkxleC5wcm90b3R5cGUuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkgPVxuICBwZXhwcnMuVW5pY29kZUNoYXIucHJvdG90eXBlLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5ID1cbiAgICBmdW5jdGlvbihydWxlTmFtZSkge1xuICAgICAgLy8gbm8tb3BcbiAgICB9O1xuXG5wZXhwcnMuQWx0LnByb3RvdHlwZS5hc3NlcnRDaG9pY2VzSGF2ZVVuaWZvcm1Bcml0eSA9IGZ1bmN0aW9uKHJ1bGVOYW1lKSB7XG4gIGlmICh0aGlzLnRlcm1zLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBhcml0eSA9IHRoaXMudGVybXNbMF0uZ2V0QXJpdHkoKTtcbiAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy50ZXJtcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgY29uc3QgdGVybSA9IHRoaXMudGVybXNbaWR4XTtcbiAgICB0ZXJtLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5KCk7XG4gICAgY29uc3Qgb3RoZXJBcml0eSA9IHRlcm0uZ2V0QXJpdHkoKTtcbiAgICBpZiAoYXJpdHkgIT09IG90aGVyQXJpdHkpIHtcbiAgICAgIHRocm93IGVycm9ycy5pbmNvbnNpc3RlbnRBcml0eShydWxlTmFtZSwgYXJpdHksIG90aGVyQXJpdHksIHRlcm0pO1xuICAgIH1cbiAgfVxufTtcblxucGV4cHJzLkV4dGVuZC5wcm90b3R5cGUuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkgPSBmdW5jdGlvbihydWxlTmFtZSkge1xuICAvLyBFeHRlbmQgaXMgYSBzcGVjaWFsIGNhc2Ugb2YgQWx0IHRoYXQncyBndWFyYW50ZWVkIHRvIGhhdmUgZXhhY3RseSB0d29cbiAgLy8gY2FzZXM6IFtleHRlbnNpb25zLCBvcmlnQm9keV0uXG4gIGNvbnN0IGFjdHVhbEFyaXR5ID0gdGhpcy50ZXJtc1swXS5nZXRBcml0eSgpO1xuICBjb25zdCBleHBlY3RlZEFyaXR5ID0gdGhpcy50ZXJtc1sxXS5nZXRBcml0eSgpO1xuICBpZiAoYWN0dWFsQXJpdHkgIT09IGV4cGVjdGVkQXJpdHkpIHtcbiAgICB0aHJvdyBlcnJvcnMuaW5jb25zaXN0ZW50QXJpdHkocnVsZU5hbWUsIGV4cGVjdGVkQXJpdHksIGFjdHVhbEFyaXR5LCB0aGlzLnRlcm1zWzBdKTtcbiAgfVxufTtcblxucGV4cHJzLlNlcS5wcm90b3R5cGUuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkgPSBmdW5jdGlvbihydWxlTmFtZSkge1xuICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB0aGlzLmZhY3RvcnMubGVuZ3RoOyBpZHgrKykge1xuICAgIHRoaXMuZmFjdG9yc1tpZHhdLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5KHJ1bGVOYW1lKTtcbiAgfVxufTtcblxucGV4cHJzLkl0ZXIucHJvdG90eXBlLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5ID0gZnVuY3Rpb24ocnVsZU5hbWUpIHtcbiAgdGhpcy5leHByLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5KHJ1bGVOYW1lKTtcbn07XG5cbnBleHBycy5Ob3QucHJvdG90eXBlLmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5ID0gZnVuY3Rpb24ocnVsZU5hbWUpIHtcbiAgLy8gbm8tb3AgKG5vdCByZXF1aXJlZCBiL2MgdGhlIG5lc3RlZCBleHByIGRvZXNuJ3Qgc2hvdyB1cCBpbiB0aGUgQ1NUKVxufTtcblxucGV4cHJzLkxvb2thaGVhZC5wcm90b3R5cGUuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkgPSBmdW5jdGlvbihydWxlTmFtZSkge1xuICB0aGlzLmV4cHIuYXNzZXJ0Q2hvaWNlc0hhdmVVbmlmb3JtQXJpdHkocnVsZU5hbWUpO1xufTtcblxucGV4cHJzLkFwcGx5LnByb3RvdHlwZS5hc3NlcnRDaG9pY2VzSGF2ZVVuaWZvcm1Bcml0eSA9IGZ1bmN0aW9uKHJ1bGVOYW1lKSB7XG4gIC8vIFRoZSBhcml0aWVzIG9mIHRoZSBwYXJhbWV0ZXIgZXhwcmVzc2lvbnMgaXMgcmVxdWlyZWQgdG8gYmUgMSBieVxuICAvLyBgYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQoKWAuXG59O1xuIiwiaW1wb3J0IHthYnN0cmFjdH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy1tYWluLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIE9wZXJhdGlvbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbnBleHBycy5QRXhwci5wcm90b3R5cGUuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlID0gYWJzdHJhY3QoXG4gICAgJ2Fzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZScsXG4pO1xuXG5wZXhwcnMuYW55LmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9XG4gIHBleHBycy5lbmQuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlID1cbiAgcGV4cHJzLlRlcm1pbmFsLnByb3RvdHlwZS5hc3NlcnRJdGVyYXRlZEV4cHJzQXJlTm90TnVsbGFibGUgPVxuICBwZXhwcnMuUmFuZ2UucHJvdG90eXBlLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9XG4gIHBleHBycy5QYXJhbS5wcm90b3R5cGUuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlID1cbiAgcGV4cHJzLlVuaWNvZGVDaGFyLnByb3RvdHlwZS5hc3NlcnRJdGVyYXRlZEV4cHJzQXJlTm90TnVsbGFibGUgPVxuICAgIGZ1bmN0aW9uKGdyYW1tYXIpIHtcbiAgICAgIC8vIG5vLW9wXG4gICAgfTtcblxucGV4cHJzLkFsdC5wcm90b3R5cGUuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB0aGlzLnRlcm1zLmxlbmd0aDsgaWR4KyspIHtcbiAgICB0aGlzLnRlcm1zW2lkeF0uYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlKGdyYW1tYXIpO1xuICB9XG59O1xuXG5wZXhwcnMuU2VxLnByb3RvdHlwZS5hc3NlcnRJdGVyYXRlZEV4cHJzQXJlTm90TnVsbGFibGUgPSBmdW5jdGlvbihncmFtbWFyKSB7XG4gIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHRoaXMuZmFjdG9ycy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgdGhpcy5mYWN0b3JzW2lkeF0uYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlKGdyYW1tYXIpO1xuICB9XG59O1xuXG5wZXhwcnMuSXRlci5wcm90b3R5cGUuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICAvLyBOb3RlOiB0aGlzIGlzIHRoZSBpbXBsZW1lbnRhdGlvbiBvZiB0aGlzIG1ldGhvZCBmb3IgYFN0YXJgIGFuZCBgUGx1c2AgZXhwcmVzc2lvbnMuXG4gIC8vIEl0IGlzIG92ZXJyaWRkZW4gZm9yIGBPcHRgIGJlbG93LlxuICB0aGlzLmV4cHIuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlKGdyYW1tYXIpO1xuICBpZiAodGhpcy5leHByLmlzTnVsbGFibGUoZ3JhbW1hcikpIHtcbiAgICB0aHJvdyBlcnJvcnMua2xlZW5lRXhwckhhc051bGxhYmxlT3BlcmFuZCh0aGlzLCBbXSk7XG4gIH1cbn07XG5cbnBleHBycy5PcHQucHJvdG90eXBlLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9XG4gIHBleHBycy5Ob3QucHJvdG90eXBlLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9XG4gIHBleHBycy5Mb29rYWhlYWQucHJvdG90eXBlLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9XG4gIHBleHBycy5MZXgucHJvdG90eXBlLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9XG4gICAgZnVuY3Rpb24oZ3JhbW1hcikge1xuICAgICAgdGhpcy5leHByLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZShncmFtbWFyKTtcbiAgICB9O1xuXG5wZXhwcnMuQXBwbHkucHJvdG90eXBlLmFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZSA9IGZ1bmN0aW9uKGdyYW1tYXIpIHtcbiAgdGhpcy5hcmdzLmZvckVhY2goYXJnID0+IHtcbiAgICBhcmcuYXNzZXJ0SXRlcmF0ZWRFeHByc0FyZU5vdE51bGxhYmxlKGdyYW1tYXIpO1xuICB9KTtcbn07XG4iLCJpbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9jb21tb24uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJpdmF0ZSBzdHVmZlxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0IGNsYXNzIE5vZGUge1xuICBjb25zdHJ1Y3RvcihtYXRjaExlbmd0aCkge1xuICAgIHRoaXMubWF0Y2hMZW5ndGggPSBtYXRjaExlbmd0aDtcbiAgfVxuXG4gIGdldCBjdG9yTmFtZSgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3N1YmNsYXNzIHJlc3BvbnNpYmlsaXR5Jyk7XG4gIH1cblxuICBudW1DaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5jaGlsZHJlbiA/IHRoaXMuY2hpbGRyZW4ubGVuZ3RoIDogMDtcbiAgfVxuXG4gIGNoaWxkQXQoaWR4KSB7XG4gICAgaWYgKHRoaXMuY2hpbGRyZW4pIHtcbiAgICAgIHJldHVybiB0aGlzLmNoaWxkcmVuW2lkeF07XG4gICAgfVxuICB9XG5cbiAgaW5kZXhPZkNoaWxkKGFyZykge1xuICAgIHJldHVybiB0aGlzLmNoaWxkcmVuLmluZGV4T2YoYXJnKTtcbiAgfVxuXG4gIGhhc0NoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLm51bUNoaWxkcmVuKCkgPiAwO1xuICB9XG5cbiAgaGFzTm9DaGlsZHJlbigpIHtcbiAgICByZXR1cm4gIXRoaXMuaGFzQ2hpbGRyZW4oKTtcbiAgfVxuXG4gIG9ubHlDaGlsZCgpIHtcbiAgICBpZiAodGhpcy5udW1DaGlsZHJlbigpICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ2Nhbm5vdCBnZXQgb25seSBjaGlsZCBvZiBhIG5vZGUgb2YgdHlwZSAnICtcbiAgICAgICAgICB0aGlzLmN0b3JOYW1lICtcbiAgICAgICAgICAnIChpdCBoYXMgJyArXG4gICAgICAgICAgdGhpcy5udW1DaGlsZHJlbigpICtcbiAgICAgICAgICAnIGNoaWxkcmVuKScsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5maXJzdENoaWxkKCk7XG4gICAgfVxuICB9XG5cbiAgZmlyc3RDaGlsZCgpIHtcbiAgICBpZiAodGhpcy5oYXNOb0NoaWxkcmVuKCkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnY2Fubm90IGdldCBmaXJzdCBjaGlsZCBvZiBhICcgKyB0aGlzLmN0b3JOYW1lICsgJyBub2RlLCB3aGljaCBoYXMgbm8gY2hpbGRyZW4nLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY2hpbGRBdCgwKTtcbiAgICB9XG4gIH1cblxuICBsYXN0Q2hpbGQoKSB7XG4gICAgaWYgKHRoaXMuaGFzTm9DaGlsZHJlbigpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ2Nhbm5vdCBnZXQgbGFzdCBjaGlsZCBvZiBhICcgKyB0aGlzLmN0b3JOYW1lICsgJyBub2RlLCB3aGljaCBoYXMgbm8gY2hpbGRyZW4nLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY2hpbGRBdCh0aGlzLm51bUNoaWxkcmVuKCkgLSAxKTtcbiAgICB9XG4gIH1cblxuICBjaGlsZEJlZm9yZShjaGlsZCkge1xuICAgIGNvbnN0IGNoaWxkSWR4ID0gdGhpcy5pbmRleE9mQ2hpbGQoY2hpbGQpO1xuICAgIGlmIChjaGlsZElkeCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZS5jaGlsZEJlZm9yZSgpIGNhbGxlZCB3LyBhbiBhcmd1bWVudCB0aGF0IGlzIG5vdCBhIGNoaWxkJyk7XG4gICAgfSBlbHNlIGlmIChjaGlsZElkeCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdjYW5ub3QgZ2V0IGNoaWxkIGJlZm9yZSBmaXJzdCBjaGlsZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZEF0KGNoaWxkSWR4IC0gMSk7XG4gICAgfVxuICB9XG5cbiAgY2hpbGRBZnRlcihjaGlsZCkge1xuICAgIGNvbnN0IGNoaWxkSWR4ID0gdGhpcy5pbmRleE9mQ2hpbGQoY2hpbGQpO1xuICAgIGlmIChjaGlsZElkeCA8IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9kZS5jaGlsZEFmdGVyKCkgY2FsbGVkIHcvIGFuIGFyZ3VtZW50IHRoYXQgaXMgbm90IGEgY2hpbGQnKTtcbiAgICB9IGVsc2UgaWYgKGNoaWxkSWR4ID09PSB0aGlzLm51bUNoaWxkcmVuKCkgLSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2Nhbm5vdCBnZXQgY2hpbGQgYWZ0ZXIgbGFzdCBjaGlsZCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jaGlsZEF0KGNoaWxkSWR4ICsgMSk7XG4gICAgfVxuICB9XG5cbiAgaXNUZXJtaW5hbCgpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpc05vbnRlcm1pbmFsKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlzSXRlcmF0aW9uKCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlzT3B0aW9uYWwoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59XG5cbi8vIFRlcm1pbmFsc1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWxOb2RlIGV4dGVuZHMgTm9kZSB7XG4gIGdldCBjdG9yTmFtZSgpIHtcbiAgICByZXR1cm4gJ190ZXJtaW5hbCc7XG4gIH1cblxuICBpc1Rlcm1pbmFsKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZ2V0IHByaW1pdGl2ZVZhbHVlKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignVGhlIGBwcmltaXRpdmVWYWx1ZWAgcHJvcGVydHkgd2FzIHJlbW92ZWQgaW4gT2htIHYxNy4nKTtcbiAgfVxufVxuXG4vLyBOb250ZXJtaW5hbHNcblxuZXhwb3J0IGNsYXNzIE5vbnRlcm1pbmFsTm9kZSBleHRlbmRzIE5vZGUge1xuICBjb25zdHJ1Y3RvcihydWxlTmFtZSwgY2hpbGRyZW4sIGNoaWxkT2Zmc2V0cywgbWF0Y2hMZW5ndGgpIHtcbiAgICBzdXBlcihtYXRjaExlbmd0aCk7XG4gICAgdGhpcy5ydWxlTmFtZSA9IHJ1bGVOYW1lO1xuICAgIHRoaXMuY2hpbGRyZW4gPSBjaGlsZHJlbjtcbiAgICB0aGlzLmNoaWxkT2Zmc2V0cyA9IGNoaWxkT2Zmc2V0cztcbiAgfVxuXG4gIGdldCBjdG9yTmFtZSgpIHtcbiAgICByZXR1cm4gdGhpcy5ydWxlTmFtZTtcbiAgfVxuXG4gIGlzTm9udGVybWluYWwoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpc0xleGljYWwoKSB7XG4gICAgcmV0dXJuIGNvbW1vbi5pc0xleGljYWwodGhpcy5jdG9yTmFtZSk7XG4gIH1cblxuICBpc1N5bnRhY3RpYygpIHtcbiAgICByZXR1cm4gY29tbW9uLmlzU3ludGFjdGljKHRoaXMuY3Rvck5hbWUpO1xuICB9XG59XG5cbi8vIEl0ZXJhdGlvbnNcblxuZXhwb3J0IGNsYXNzIEl0ZXJhdGlvbk5vZGUgZXh0ZW5kcyBOb2RlIHtcbiAgY29uc3RydWN0b3IoY2hpbGRyZW4sIGNoaWxkT2Zmc2V0cywgbWF0Y2hMZW5ndGgsIGlzT3B0aW9uYWwpIHtcbiAgICBzdXBlcihtYXRjaExlbmd0aCk7XG4gICAgdGhpcy5jaGlsZHJlbiA9IGNoaWxkcmVuO1xuICAgIHRoaXMuY2hpbGRPZmZzZXRzID0gY2hpbGRPZmZzZXRzO1xuICAgIHRoaXMub3B0aW9uYWwgPSBpc09wdGlvbmFsO1xuICB9XG5cbiAgZ2V0IGN0b3JOYW1lKCkge1xuICAgIHJldHVybiAnX2l0ZXInO1xuICB9XG5cbiAgaXNJdGVyYXRpb24oKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBpc09wdGlvbmFsKCkge1xuICAgIHJldHVybiB0aGlzLm9wdGlvbmFsO1xuICB9XG59XG4iLCJpbXBvcnQge1RyYWNlfSBmcm9tICcuL1RyYWNlLmpzJztcbmltcG9ydCAqIGFzIGNvbW1vbiBmcm9tICcuL2NvbW1vbi5qcyc7XG5pbXBvcnQgKiBhcyBlcnJvcnMgZnJvbSAnLi9lcnJvcnMuanMnO1xuaW1wb3J0IHtJdGVyYXRpb25Ob2RlLCBOb250ZXJtaW5hbE5vZGUsIFRlcm1pbmFsTm9kZX0gZnJvbSAnLi9ub2Rlcy5qcyc7XG5pbXBvcnQgKiBhcyBwZXhwcnMgZnJvbSAnLi9wZXhwcnMtbWFpbi5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPcGVyYXRpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKlxuICBFdmFsdWF0ZSB0aGUgZXhwcmVzc2lvbiBhbmQgcmV0dXJuIGB0cnVlYCBpZiBpdCBzdWNjZWVkcywgYGZhbHNlYCBvdGhlcndpc2UuIFRoaXMgbWV0aG9kIHNob3VsZFxuICBvbmx5IGJlIGNhbGxlZCBkaXJlY3RseSBieSBgU3RhdGUucHJvdG90eXBlLmV2YWwoZXhwcilgLCB3aGljaCBhbHNvIHVwZGF0ZXMgdGhlIGRhdGEgc3RydWN0dXJlc1xuICB0aGF0IGFyZSB1c2VkIGZvciB0cmFjaW5nLiAoTWFraW5nIHRob3NlIHVwZGF0ZXMgaW4gYSBtZXRob2Qgb2YgYFN0YXRlYCBlbmFibGVzIHRoZSB0cmFjZS1zcGVjaWZpY1xuICBkYXRhIHN0cnVjdHVyZXMgdG8gYmUgXCJzZWNyZXRzXCIgb2YgdGhhdCBjbGFzcywgd2hpY2ggaXMgZ29vZCBmb3IgbW9kdWxhcml0eS4pXG5cbiAgVGhlIGNvbnRyYWN0IG9mIHRoaXMgbWV0aG9kIGlzIGFzIGZvbGxvd3M6XG4gICogV2hlbiB0aGUgcmV0dXJuIHZhbHVlIGlzIGB0cnVlYCxcbiAgICAtIHRoZSBzdGF0ZSBvYmplY3Qgd2lsbCBoYXZlIGBleHByLmdldEFyaXR5KClgIG1vcmUgYmluZGluZ3MgdGhhbiBpdCBkaWQgYmVmb3JlIHRoZSBjYWxsLlxuICAqIFdoZW4gdGhlIHJldHVybiB2YWx1ZSBpcyBgZmFsc2VgLFxuICAgIC0gdGhlIHN0YXRlIG9iamVjdCBtYXkgaGF2ZSBtb3JlIGJpbmRpbmdzIHRoYW4gaXQgZGlkIGJlZm9yZSB0aGUgY2FsbCwgYW5kXG4gICAgLSBpdHMgaW5wdXQgc3RyZWFtJ3MgcG9zaXRpb24gbWF5IGJlIGFueXdoZXJlLlxuXG4gIE5vdGUgdGhhdCBgU3RhdGUucHJvdG90eXBlLmV2YWwoZXhwcilgLCB1bmxpa2UgdGhpcyBtZXRob2QsIGd1YXJhbnRlZXMgdGhhdCBuZWl0aGVyIHRoZSBzdGF0ZVxuICBvYmplY3QncyBiaW5kaW5ncyBub3IgaXRzIGlucHV0IHN0cmVhbSdzIHBvc2l0aW9uIHdpbGwgY2hhbmdlIGlmIHRoZSBleHByZXNzaW9uIGZhaWxzIHRvIG1hdGNoLlxuKi9cbnBleHBycy5QRXhwci5wcm90b3R5cGUuZXZhbCA9IGNvbW1vbi5hYnN0cmFjdCgnZXZhbCcpOyAvLyBmdW5jdGlvbihzdGF0ZSkgeyAuLi4gfVxuXG5wZXhwcnMuYW55LmV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gIGNvbnN0IGNwID0gaW5wdXRTdHJlYW0ubmV4dENvZGVQb2ludCgpO1xuICBpZiAoY3AgIT09IHVuZGVmaW5lZCkge1xuICAgIHN0YXRlLnB1c2hCaW5kaW5nKG5ldyBUZXJtaW5hbE5vZGUoU3RyaW5nLmZyb21Db2RlUG9pbnQoY3ApLmxlbmd0aCksIG9yaWdQb3MpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHN0YXRlLnByb2Nlc3NGYWlsdXJlKG9yaWdQb3MsIHRoaXMpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxucGV4cHJzLmVuZC5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgY29uc3Qge2lucHV0U3RyZWFtfSA9IHN0YXRlO1xuICBjb25zdCBvcmlnUG9zID0gaW5wdXRTdHJlYW0ucG9zO1xuICBpZiAoaW5wdXRTdHJlYW0uYXRFbmQoKSkge1xuICAgIHN0YXRlLnB1c2hCaW5kaW5nKG5ldyBUZXJtaW5hbE5vZGUoMCksIG9yaWdQb3MpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHN0YXRlLnByb2Nlc3NGYWlsdXJlKG9yaWdQb3MsIHRoaXMpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxucGV4cHJzLlRlcm1pbmFsLnByb3RvdHlwZS5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgY29uc3Qge2lucHV0U3RyZWFtfSA9IHN0YXRlO1xuICBjb25zdCBvcmlnUG9zID0gaW5wdXRTdHJlYW0ucG9zO1xuICBpZiAoIWlucHV0U3RyZWFtLm1hdGNoU3RyaW5nKHRoaXMub2JqKSkge1xuICAgIHN0YXRlLnByb2Nlc3NGYWlsdXJlKG9yaWdQb3MsIHRoaXMpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBzdGF0ZS5wdXNoQmluZGluZyhuZXcgVGVybWluYWxOb2RlKHRoaXMub2JqLmxlbmd0aCksIG9yaWdQb3MpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG59O1xuXG5wZXhwcnMuUmFuZ2UucHJvdG90eXBlLmV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG5cbiAgLy8gQSByYW5nZSBjYW4gb3BlcmF0ZSBpbiBvbmUgb2YgdHdvIG1vZGVzOiBtYXRjaGluZyBhIHNpbmdsZSwgMTYtYml0IF9jb2RlIHVuaXRfLFxuICAvLyBvciBtYXRjaGluZyBhIF9jb2RlIHBvaW50Xy4gKENvZGUgcG9pbnRzIG92ZXIgMHhGRkZGIHRha2UgdXAgdHdvIDE2LWJpdCBjb2RlIHVuaXRzLilcbiAgY29uc3QgY3AgPSB0aGlzLm1hdGNoQ29kZVBvaW50ID8gaW5wdXRTdHJlYW0ubmV4dENvZGVQb2ludCgpIDogaW5wdXRTdHJlYW0ubmV4dENoYXJDb2RlKCk7XG5cbiAgLy8gQWx3YXlzIGNvbXBhcmUgYnkgY29kZSBwb2ludCB2YWx1ZSB0byBnZXQgdGhlIGNvcnJlY3QgcmVzdWx0IGluIGFsbCBzY2VuYXJpb3MuXG4gIC8vIE5vdGUgdGhhdCBmb3Igc3RyaW5ncyBvZiBsZW5ndGggMSwgY29kZVBvaW50QXQoMCkgYW5kIGNoYXJQb2ludEF0KDApIGFyZSBlcXVpdmFsZW50LlxuICBpZiAoY3AgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmZyb20uY29kZVBvaW50QXQoMCkgPD0gY3AgJiYgY3AgPD0gdGhpcy50by5jb2RlUG9pbnRBdCgwKSkge1xuICAgIHN0YXRlLnB1c2hCaW5kaW5nKG5ldyBUZXJtaW5hbE5vZGUoU3RyaW5nLmZyb21Db2RlUG9pbnQoY3ApLmxlbmd0aCksIG9yaWdQb3MpO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHN0YXRlLnByb2Nlc3NGYWlsdXJlKG9yaWdQb3MsIHRoaXMpO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxucGV4cHJzLlBhcmFtLnByb3RvdHlwZS5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgcmV0dXJuIHN0YXRlLmV2YWwoc3RhdGUuY3VycmVudEFwcGxpY2F0aW9uKCkuYXJnc1t0aGlzLmluZGV4XSk7XG59O1xuXG5wZXhwcnMuTGV4LnByb3RvdHlwZS5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgc3RhdGUuZW50ZXJMZXhpZmllZENvbnRleHQoKTtcbiAgY29uc3QgYW5zID0gc3RhdGUuZXZhbCh0aGlzLmV4cHIpO1xuICBzdGF0ZS5leGl0TGV4aWZpZWRDb250ZXh0KCk7XG4gIHJldHVybiBhbnM7XG59O1xuXG5wZXhwcnMuQWx0LnByb3RvdHlwZS5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy50ZXJtcy5sZW5ndGg7IGlkeCsrKSB7XG4gICAgaWYgKHN0YXRlLmV2YWwodGhpcy50ZXJtc1tpZHhdKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn07XG5cbnBleHBycy5TZXEucHJvdG90eXBlLmV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBmb3IgKGxldCBpZHggPSAwOyBpZHggPCB0aGlzLmZhY3RvcnMubGVuZ3RoOyBpZHgrKykge1xuICAgIGNvbnN0IGZhY3RvciA9IHRoaXMuZmFjdG9yc1tpZHhdO1xuICAgIGlmICghc3RhdGUuZXZhbChmYWN0b3IpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG4gIHJldHVybiB0cnVlO1xufTtcblxucGV4cHJzLkl0ZXIucHJvdG90eXBlLmV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gIGNvbnN0IGFyaXR5ID0gdGhpcy5nZXRBcml0eSgpO1xuICBjb25zdCBjb2xzID0gW107XG4gIGNvbnN0IGNvbE9mZnNldHMgPSBbXTtcbiAgd2hpbGUgKGNvbHMubGVuZ3RoIDwgYXJpdHkpIHtcbiAgICBjb2xzLnB1c2goW10pO1xuICAgIGNvbE9mZnNldHMucHVzaChbXSk7XG4gIH1cblxuICBsZXQgbnVtTWF0Y2hlcyA9IDA7XG4gIGxldCBwcmV2UG9zID0gb3JpZ1BvcztcbiAgbGV0IGlkeDtcbiAgd2hpbGUgKG51bU1hdGNoZXMgPCB0aGlzLm1heE51bU1hdGNoZXMgJiYgc3RhdGUuZXZhbCh0aGlzLmV4cHIpKSB7XG4gICAgaWYgKGlucHV0U3RyZWFtLnBvcyA9PT0gcHJldlBvcykge1xuICAgICAgdGhyb3cgZXJyb3JzLmtsZWVuZUV4cHJIYXNOdWxsYWJsZU9wZXJhbmQodGhpcywgc3RhdGUuX2FwcGxpY2F0aW9uU3RhY2spO1xuICAgIH1cbiAgICBwcmV2UG9zID0gaW5wdXRTdHJlYW0ucG9zO1xuICAgIG51bU1hdGNoZXMrKztcbiAgICBjb25zdCByb3cgPSBzdGF0ZS5fYmluZGluZ3Muc3BsaWNlKHN0YXRlLl9iaW5kaW5ncy5sZW5ndGggLSBhcml0eSwgYXJpdHkpO1xuICAgIGNvbnN0IHJvd09mZnNldHMgPSBzdGF0ZS5fYmluZGluZ09mZnNldHMuc3BsaWNlKFxuICAgICAgICBzdGF0ZS5fYmluZGluZ09mZnNldHMubGVuZ3RoIC0gYXJpdHksXG4gICAgICAgIGFyaXR5LFxuICAgICk7XG4gICAgZm9yIChpZHggPSAwOyBpZHggPCByb3cubGVuZ3RoOyBpZHgrKykge1xuICAgICAgY29sc1tpZHhdLnB1c2gocm93W2lkeF0pO1xuICAgICAgY29sT2Zmc2V0c1tpZHhdLnB1c2gocm93T2Zmc2V0c1tpZHhdKTtcbiAgICB9XG4gIH1cbiAgaWYgKG51bU1hdGNoZXMgPCB0aGlzLm1pbk51bU1hdGNoZXMpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgbGV0IG9mZnNldCA9IHN0YXRlLnBvc1RvT2Zmc2V0KG9yaWdQb3MpO1xuICBsZXQgbWF0Y2hMZW5ndGggPSAwO1xuICBpZiAobnVtTWF0Y2hlcyA+IDApIHtcbiAgICBjb25zdCBsYXN0Q29sID0gY29sc1thcml0eSAtIDFdO1xuICAgIGNvbnN0IGxhc3RDb2xPZmZzZXRzID0gY29sT2Zmc2V0c1thcml0eSAtIDFdO1xuXG4gICAgY29uc3QgZW5kT2Zmc2V0ID1cbiAgICAgIGxhc3RDb2xPZmZzZXRzW2xhc3RDb2xPZmZzZXRzLmxlbmd0aCAtIDFdICsgbGFzdENvbFtsYXN0Q29sLmxlbmd0aCAtIDFdLm1hdGNoTGVuZ3RoO1xuICAgIG9mZnNldCA9IGNvbE9mZnNldHNbMF1bMF07XG4gICAgbWF0Y2hMZW5ndGggPSBlbmRPZmZzZXQgLSBvZmZzZXQ7XG4gIH1cbiAgY29uc3QgaXNPcHRpb25hbCA9IHRoaXMgaW5zdGFuY2VvZiBwZXhwcnMuT3B0O1xuICBmb3IgKGlkeCA9IDA7IGlkeCA8IGNvbHMubGVuZ3RoOyBpZHgrKykge1xuICAgIHN0YXRlLl9iaW5kaW5ncy5wdXNoKFxuICAgICAgICBuZXcgSXRlcmF0aW9uTm9kZShjb2xzW2lkeF0sIGNvbE9mZnNldHNbaWR4XSwgbWF0Y2hMZW5ndGgsIGlzT3B0aW9uYWwpLFxuICAgICk7XG4gICAgc3RhdGUuX2JpbmRpbmdPZmZzZXRzLnB1c2gob2Zmc2V0KTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbnBleHBycy5Ob3QucHJvdG90eXBlLmV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICAvKlxuICAgIFRPRE86XG4gICAgLSBSaWdodCBub3cgd2UncmUganVzdCB0aHJvd2luZyBhd2F5IGFsbCBvZiB0aGUgZmFpbHVyZXMgdGhhdCBoYXBwZW4gaW5zaWRlIGEgYG5vdGAsIGFuZFxuICAgICAgcmVjb3JkaW5nIGB0aGlzYCBhcyBhIGZhaWxlZCBleHByZXNzaW9uLlxuICAgIC0gRG91YmxlIG5lZ2F0aW9uIHNob3VsZCBiZSBlcXVpdmFsZW50IHRvIGxvb2thaGVhZCwgYnV0IHRoYXQncyBub3QgdGhlIGNhc2UgcmlnaHQgbm93IHdydFxuICAgICAgZmFpbHVyZXMuIEUuZy4sIH5+J2ZvbycgcHJvZHVjZXMgYSBmYWlsdXJlIGZvciB+fidmb28nLCBidXQgbWF5YmUgaXQgc2hvdWxkIHByb2R1Y2VcbiAgICAgIGEgZmFpbHVyZSBmb3IgJ2ZvbycgaW5zdGVhZC5cbiAgKi9cblxuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gIHN0YXRlLnB1c2hGYWlsdXJlc0luZm8oKTtcblxuICBjb25zdCBhbnMgPSBzdGF0ZS5ldmFsKHRoaXMuZXhwcik7XG5cbiAgc3RhdGUucG9wRmFpbHVyZXNJbmZvKCk7XG4gIGlmIChhbnMpIHtcbiAgICBzdGF0ZS5wcm9jZXNzRmFpbHVyZShvcmlnUG9zLCB0aGlzKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpbnB1dFN0cmVhbS5wb3MgPSBvcmlnUG9zO1xuICByZXR1cm4gdHJ1ZTtcbn07XG5cbnBleHBycy5Mb29rYWhlYWQucHJvdG90eXBlLmV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gIGlmIChzdGF0ZS5ldmFsKHRoaXMuZXhwcikpIHtcbiAgICBpbnB1dFN0cmVhbS5wb3MgPSBvcmlnUG9zO1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufTtcblxucGV4cHJzLkFwcGx5LnByb3RvdHlwZS5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgY29uc3QgY2FsbGVyID0gc3RhdGUuY3VycmVudEFwcGxpY2F0aW9uKCk7XG4gIGNvbnN0IGFjdHVhbHMgPSBjYWxsZXIgPyBjYWxsZXIuYXJncyA6IFtdO1xuICBjb25zdCBhcHAgPSB0aGlzLnN1YnN0aXR1dGVQYXJhbXMoYWN0dWFscyk7XG5cbiAgY29uc3QgcG9zSW5mbyA9IHN0YXRlLmdldEN1cnJlbnRQb3NJbmZvKCk7XG4gIGlmIChwb3NJbmZvLmlzQWN0aXZlKGFwcCkpIHtcbiAgICAvLyBUaGlzIHJ1bGUgaXMgYWxyZWFkeSBhY3RpdmUgYXQgdGhpcyBwb3NpdGlvbiwgaS5lLiwgaXQgaXMgbGVmdC1yZWN1cnNpdmUuXG4gICAgcmV0dXJuIGFwcC5oYW5kbGVDeWNsZShzdGF0ZSk7XG4gIH1cblxuICBjb25zdCBtZW1vS2V5ID0gYXBwLnRvTWVtb0tleSgpO1xuICBjb25zdCBtZW1vUmVjID0gcG9zSW5mby5tZW1vW21lbW9LZXldO1xuXG4gIGlmIChtZW1vUmVjICYmIHBvc0luZm8uc2hvdWxkVXNlTWVtb2l6ZWRSZXN1bHQobWVtb1JlYykpIHtcbiAgICBpZiAoc3RhdGUuaGFzTmVjZXNzYXJ5SW5mbyhtZW1vUmVjKSkge1xuICAgICAgcmV0dXJuIHN0YXRlLnVzZU1lbW9pemVkUmVzdWx0KHN0YXRlLmlucHV0U3RyZWFtLnBvcywgbWVtb1JlYyk7XG4gICAgfVxuICAgIGRlbGV0ZSBwb3NJbmZvLm1lbW9bbWVtb0tleV07XG4gIH1cbiAgcmV0dXJuIGFwcC5yZWFsbHlFdmFsKHN0YXRlKTtcbn07XG5cbnBleHBycy5BcHBseS5wcm90b3R5cGUuaGFuZGxlQ3ljbGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBjb25zdCBwb3NJbmZvID0gc3RhdGUuZ2V0Q3VycmVudFBvc0luZm8oKTtcbiAgY29uc3Qge2N1cnJlbnRMZWZ0UmVjdXJzaW9ufSA9IHBvc0luZm87XG4gIGNvbnN0IG1lbW9LZXkgPSB0aGlzLnRvTWVtb0tleSgpO1xuICBsZXQgbWVtb1JlYyA9IHBvc0luZm8ubWVtb1ttZW1vS2V5XTtcblxuICBpZiAoY3VycmVudExlZnRSZWN1cnNpb24gJiYgY3VycmVudExlZnRSZWN1cnNpb24uaGVhZEFwcGxpY2F0aW9uLnRvTWVtb0tleSgpID09PSBtZW1vS2V5KSB7XG4gICAgLy8gV2UgYWxyZWFkeSBrbm93IGFib3V0IHRoaXMgbGVmdCByZWN1cnNpb24sIGJ1dCBpdCdzIHBvc3NpYmxlIHRoZXJlIGFyZSBcImludm9sdmVkXG4gICAgLy8gYXBwbGljYXRpb25zXCIgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IGtub3cgYWJvdXQsIHNvLi4uXG4gICAgbWVtb1JlYy51cGRhdGVJbnZvbHZlZEFwcGxpY2F0aW9uTWVtb0tleXMoKTtcbiAgfSBlbHNlIGlmICghbWVtb1JlYykge1xuICAgIC8vIE5ldyBsZWZ0IHJlY3Vyc2lvbiBkZXRlY3RlZCEgTWVtb2l6ZSBhIGZhaWx1cmUgdG8gdHJ5IHRvIGdldCBhIHNlZWQgcGFyc2UuXG4gICAgbWVtb1JlYyA9IHBvc0luZm8ubWVtb2l6ZShtZW1vS2V5LCB7XG4gICAgICBtYXRjaExlbmd0aDogMCxcbiAgICAgIGV4YW1pbmVkTGVuZ3RoOiAwLFxuICAgICAgdmFsdWU6IGZhbHNlLFxuICAgICAgcmlnaHRtb3N0RmFpbHVyZU9mZnNldDogLTEsXG4gICAgfSk7XG4gICAgcG9zSW5mby5zdGFydExlZnRSZWN1cnNpb24odGhpcywgbWVtb1JlYyk7XG4gIH1cbiAgcmV0dXJuIHN0YXRlLnVzZU1lbW9pemVkUmVzdWx0KHN0YXRlLmlucHV0U3RyZWFtLnBvcywgbWVtb1JlYyk7XG59O1xuXG5wZXhwcnMuQXBwbHkucHJvdG90eXBlLnJlYWxseUV2YWwgPSBmdW5jdGlvbihzdGF0ZSkge1xuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gIGNvbnN0IG9yaWdQb3NJbmZvID0gc3RhdGUuZ2V0Q3VycmVudFBvc0luZm8oKTtcbiAgY29uc3QgcnVsZUluZm8gPSBzdGF0ZS5ncmFtbWFyLnJ1bGVzW3RoaXMucnVsZU5hbWVdO1xuICBjb25zdCB7Ym9keX0gPSBydWxlSW5mbztcbiAgY29uc3Qge2Rlc2NyaXB0aW9ufSA9IHJ1bGVJbmZvO1xuXG4gIHN0YXRlLmVudGVyQXBwbGljYXRpb24ob3JpZ1Bvc0luZm8sIHRoaXMpO1xuXG4gIGlmIChkZXNjcmlwdGlvbikge1xuICAgIHN0YXRlLnB1c2hGYWlsdXJlc0luZm8oKTtcbiAgfVxuXG4gIC8vIFJlc2V0IHRoZSBpbnB1dCBzdHJlYW0ncyBleGFtaW5lZExlbmd0aCBwcm9wZXJ0eSBzbyB0aGF0IHdlIGNhbiB0cmFja1xuICAvLyB0aGUgZXhhbWluZWQgbGVuZ3RoIG9mIHRoaXMgcGFydGljdWxhciBhcHBsaWNhdGlvbi5cbiAgY29uc3Qgb3JpZ0lucHV0U3RyZWFtRXhhbWluZWRMZW5ndGggPSBpbnB1dFN0cmVhbS5leGFtaW5lZExlbmd0aDtcbiAgaW5wdXRTdHJlYW0uZXhhbWluZWRMZW5ndGggPSAwO1xuXG4gIGxldCB2YWx1ZSA9IHRoaXMuZXZhbE9uY2UoYm9keSwgc3RhdGUpO1xuICBjb25zdCBjdXJyZW50TFIgPSBvcmlnUG9zSW5mby5jdXJyZW50TGVmdFJlY3Vyc2lvbjtcbiAgY29uc3QgbWVtb0tleSA9IHRoaXMudG9NZW1vS2V5KCk7XG4gIGNvbnN0IGlzSGVhZE9mTGVmdFJlY3Vyc2lvbiA9IGN1cnJlbnRMUiAmJiBjdXJyZW50TFIuaGVhZEFwcGxpY2F0aW9uLnRvTWVtb0tleSgpID09PSBtZW1vS2V5O1xuICBsZXQgbWVtb1JlYztcblxuICBpZiAoc3RhdGUuZG9Ob3RNZW1vaXplKSB7XG4gICAgc3RhdGUuZG9Ob3RNZW1vaXplID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoaXNIZWFkT2ZMZWZ0UmVjdXJzaW9uKSB7XG4gICAgdmFsdWUgPSB0aGlzLmdyb3dTZWVkUmVzdWx0KGJvZHksIHN0YXRlLCBvcmlnUG9zLCBjdXJyZW50TFIsIHZhbHVlKTtcbiAgICBvcmlnUG9zSW5mby5lbmRMZWZ0UmVjdXJzaW9uKCk7XG4gICAgbWVtb1JlYyA9IGN1cnJlbnRMUjtcbiAgICBtZW1vUmVjLmV4YW1pbmVkTGVuZ3RoID0gaW5wdXRTdHJlYW0uZXhhbWluZWRMZW5ndGggLSBvcmlnUG9zO1xuICAgIG1lbW9SZWMucmlnaHRtb3N0RmFpbHVyZU9mZnNldCA9IHN0YXRlLl9nZXRSaWdodG1vc3RGYWlsdXJlT2Zmc2V0KCk7XG4gICAgb3JpZ1Bvc0luZm8ubWVtb2l6ZShtZW1vS2V5LCBtZW1vUmVjKTsgLy8gdXBkYXRlcyBvcmlnUG9zSW5mbydzIG1heEV4YW1pbmVkTGVuZ3RoXG4gIH0gZWxzZSBpZiAoIWN1cnJlbnRMUiB8fCAhY3VycmVudExSLmlzSW52b2x2ZWQobWVtb0tleSkpIHtcbiAgICAvLyBUaGlzIGFwcGxpY2F0aW9uIGlzIG5vdCBpbnZvbHZlZCBpbiBsZWZ0IHJlY3Vyc2lvbiwgc28gaXQncyBvayB0byBtZW1vaXplIGl0LlxuICAgIG1lbW9SZWMgPSBvcmlnUG9zSW5mby5tZW1vaXplKG1lbW9LZXksIHtcbiAgICAgIG1hdGNoTGVuZ3RoOiBpbnB1dFN0cmVhbS5wb3MgLSBvcmlnUG9zLFxuICAgICAgZXhhbWluZWRMZW5ndGg6IGlucHV0U3RyZWFtLmV4YW1pbmVkTGVuZ3RoIC0gb3JpZ1BvcyxcbiAgICAgIHZhbHVlLFxuICAgICAgZmFpbHVyZXNBdFJpZ2h0bW9zdFBvc2l0aW9uOiBzdGF0ZS5jbG9uZVJlY29yZGVkRmFpbHVyZXMoKSxcbiAgICAgIHJpZ2h0bW9zdEZhaWx1cmVPZmZzZXQ6IHN0YXRlLl9nZXRSaWdodG1vc3RGYWlsdXJlT2Zmc2V0KCksXG4gICAgfSk7XG4gIH1cbiAgY29uc3Qgc3VjY2VlZGVkID0gISF2YWx1ZTtcblxuICBpZiAoZGVzY3JpcHRpb24pIHtcbiAgICBzdGF0ZS5wb3BGYWlsdXJlc0luZm8oKTtcbiAgICBpZiAoIXN1Y2NlZWRlZCkge1xuICAgICAgc3RhdGUucHJvY2Vzc0ZhaWx1cmUob3JpZ1BvcywgdGhpcyk7XG4gICAgfVxuICAgIGlmIChtZW1vUmVjKSB7XG4gICAgICBtZW1vUmVjLmZhaWx1cmVzQXRSaWdodG1vc3RQb3NpdGlvbiA9IHN0YXRlLmNsb25lUmVjb3JkZWRGYWlsdXJlcygpO1xuICAgIH1cbiAgfVxuXG4gIC8vIFJlY29yZCB0cmFjZSBpbmZvcm1hdGlvbiBpbiB0aGUgbWVtbyB0YWJsZSwgc28gdGhhdCBpdCBpcyBhdmFpbGFibGUgaWYgdGhlIG1lbW9pemVkIHJlc3VsdFxuICAvLyBpcyB1c2VkIGxhdGVyLlxuICBpZiAoc3RhdGUuaXNUcmFjaW5nKCkgJiYgbWVtb1JlYykge1xuICAgIGNvbnN0IGVudHJ5ID0gc3RhdGUuZ2V0VHJhY2VFbnRyeShvcmlnUG9zLCB0aGlzLCBzdWNjZWVkZWQsIHN1Y2NlZWRlZCA/IFt2YWx1ZV0gOiBbXSk7XG4gICAgaWYgKGlzSGVhZE9mTGVmdFJlY3Vyc2lvbikge1xuICAgICAgY29tbW9uLmFzc2VydChlbnRyeS50ZXJtaW5hdGluZ0xSRW50cnkgIT0gbnVsbCB8fCAhc3VjY2VlZGVkKTtcbiAgICAgIGVudHJ5LmlzSGVhZE9mTGVmdFJlY3Vyc2lvbiA9IHRydWU7XG4gICAgfVxuICAgIG1lbW9SZWMudHJhY2VFbnRyeSA9IGVudHJ5O1xuICB9XG5cbiAgLy8gRml4IHRoZSBpbnB1dCBzdHJlYW0ncyBleGFtaW5lZExlbmd0aCAtLSBpdCBzaG91bGQgYmUgdGhlIG1heGltdW0gZXhhbWluZWQgbGVuZ3RoXG4gIC8vIGFjcm9zcyBhbGwgYXBwbGljYXRpb25zLCBub3QganVzdCB0aGlzIG9uZS5cbiAgaW5wdXRTdHJlYW0uZXhhbWluZWRMZW5ndGggPSBNYXRoLm1heChcbiAgICAgIGlucHV0U3RyZWFtLmV4YW1pbmVkTGVuZ3RoLFxuICAgICAgb3JpZ0lucHV0U3RyZWFtRXhhbWluZWRMZW5ndGgsXG4gICk7XG5cbiAgc3RhdGUuZXhpdEFwcGxpY2F0aW9uKG9yaWdQb3NJbmZvLCB2YWx1ZSk7XG5cbiAgcmV0dXJuIHN1Y2NlZWRlZDtcbn07XG5cbnBleHBycy5BcHBseS5wcm90b3R5cGUuZXZhbE9uY2UgPSBmdW5jdGlvbihleHByLCBzdGF0ZSkge1xuICBjb25zdCB7aW5wdXRTdHJlYW19ID0gc3RhdGU7XG4gIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG5cbiAgaWYgKHN0YXRlLmV2YWwoZXhwcikpIHtcbiAgICBjb25zdCBhcml0eSA9IGV4cHIuZ2V0QXJpdHkoKTtcbiAgICBjb25zdCBiaW5kaW5ncyA9IHN0YXRlLl9iaW5kaW5ncy5zcGxpY2Uoc3RhdGUuX2JpbmRpbmdzLmxlbmd0aCAtIGFyaXR5LCBhcml0eSk7XG4gICAgY29uc3Qgb2Zmc2V0cyA9IHN0YXRlLl9iaW5kaW5nT2Zmc2V0cy5zcGxpY2Uoc3RhdGUuX2JpbmRpbmdPZmZzZXRzLmxlbmd0aCAtIGFyaXR5LCBhcml0eSk7XG4gICAgY29uc3QgbWF0Y2hMZW5ndGggPSBpbnB1dFN0cmVhbS5wb3MgLSBvcmlnUG9zO1xuICAgIHJldHVybiBuZXcgTm9udGVybWluYWxOb2RlKHRoaXMucnVsZU5hbWUsIGJpbmRpbmdzLCBvZmZzZXRzLCBtYXRjaExlbmd0aCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuXG5wZXhwcnMuQXBwbHkucHJvdG90eXBlLmdyb3dTZWVkUmVzdWx0ID0gZnVuY3Rpb24oYm9keSwgc3RhdGUsIG9yaWdQb3MsIGxyTWVtb1JlYywgbmV3VmFsdWUpIHtcbiAgaWYgKCFuZXdWYWx1ZSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGNvbnN0IHtpbnB1dFN0cmVhbX0gPSBzdGF0ZTtcblxuICB3aGlsZSAodHJ1ZSkge1xuICAgIGxyTWVtb1JlYy5tYXRjaExlbmd0aCA9IGlucHV0U3RyZWFtLnBvcyAtIG9yaWdQb3M7XG4gICAgbHJNZW1vUmVjLnZhbHVlID0gbmV3VmFsdWU7XG4gICAgbHJNZW1vUmVjLmZhaWx1cmVzQXRSaWdodG1vc3RQb3NpdGlvbiA9IHN0YXRlLmNsb25lUmVjb3JkZWRGYWlsdXJlcygpO1xuXG4gICAgaWYgKHN0YXRlLmlzVHJhY2luZygpKSB7XG4gICAgICAvLyBCZWZvcmUgZXZhbHVhdGluZyB0aGUgYm9keSBhZ2FpbiwgYWRkIGEgdHJhY2Ugbm9kZSBmb3IgdGhpcyBhcHBsaWNhdGlvbiB0byB0aGUgbWVtbyBlbnRyeS5cbiAgICAgIC8vIEl0cyBvbmx5IGNoaWxkIGlzIGEgY29weSBvZiB0aGUgdHJhY2Ugbm9kZSBmcm9tIGBuZXdWYWx1ZWAsIHdoaWNoIHdpbGwgYWx3YXlzIGJlIHRoZSBsYXN0XG4gICAgICAvLyBlbGVtZW50IGluIGBzdGF0ZS50cmFjZWAuXG4gICAgICBjb25zdCBzZWVkVHJhY2UgPSBzdGF0ZS50cmFjZVtzdGF0ZS50cmFjZS5sZW5ndGggLSAxXTtcbiAgICAgIGxyTWVtb1JlYy50cmFjZUVudHJ5ID0gbmV3IFRyYWNlKFxuICAgICAgICAgIHN0YXRlLmlucHV0LFxuICAgICAgICAgIG9yaWdQb3MsXG4gICAgICAgICAgaW5wdXRTdHJlYW0ucG9zLFxuICAgICAgICAgIHRoaXMsXG4gICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICBbbmV3VmFsdWVdLFxuICAgICAgICAgIFtzZWVkVHJhY2UuY2xvbmUoKV0sXG4gICAgICApO1xuICAgIH1cbiAgICBpbnB1dFN0cmVhbS5wb3MgPSBvcmlnUG9zO1xuICAgIG5ld1ZhbHVlID0gdGhpcy5ldmFsT25jZShib2R5LCBzdGF0ZSk7XG4gICAgaWYgKGlucHV0U3RyZWFtLnBvcyAtIG9yaWdQb3MgPD0gbHJNZW1vUmVjLm1hdGNoTGVuZ3RoKSB7XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgaWYgKHN0YXRlLmlzVHJhY2luZygpKSB7XG4gICAgICBzdGF0ZS50cmFjZS5zcGxpY2UoLTIsIDEpOyAvLyBEcm9wIHRoZSB0cmFjZSBmb3IgdGhlIG9sZCBzZWVkLlxuICAgIH1cbiAgfVxuICBpZiAoc3RhdGUuaXNUcmFjaW5nKCkpIHtcbiAgICAvLyBUaGUgbGFzdCBlbnRyeSBpcyBmb3IgYW4gdW51c2VkIHJlc3VsdCAtLSBwb3AgaXQgYW5kIHNhdmUgaXQgaW4gdGhlIFwicmVhbFwiIGVudHJ5LlxuICAgIGxyTWVtb1JlYy50cmFjZUVudHJ5LnJlY29yZExSVGVybWluYXRpb24oc3RhdGUudHJhY2UucG9wKCksIG5ld1ZhbHVlKTtcbiAgfVxuICBpbnB1dFN0cmVhbS5wb3MgPSBvcmlnUG9zICsgbHJNZW1vUmVjLm1hdGNoTGVuZ3RoO1xuICByZXR1cm4gbHJNZW1vUmVjLnZhbHVlO1xufTtcblxucGV4cHJzLlVuaWNvZGVDaGFyLnByb3RvdHlwZS5ldmFsID0gZnVuY3Rpb24oc3RhdGUpIHtcbiAgY29uc3Qge2lucHV0U3RyZWFtfSA9IHN0YXRlO1xuICBjb25zdCBvcmlnUG9zID0gaW5wdXRTdHJlYW0ucG9zO1xuICBjb25zdCBjaCA9IGlucHV0U3RyZWFtLm5leHQoKTtcbiAgaWYgKGNoICYmIHRoaXMucGF0dGVybi50ZXN0KGNoKSkge1xuICAgIHN0YXRlLnB1c2hCaW5kaW5nKG5ldyBUZXJtaW5hbE5vZGUoY2gubGVuZ3RoKSwgb3JpZ1Bvcyk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgc3RhdGUucHJvY2Vzc0ZhaWx1cmUob3JpZ1BvcywgdGhpcyk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG59O1xuIiwiaW1wb3J0IHthYnN0cmFjdH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLW1haW4uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3BlcmF0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucGV4cHJzLlBFeHByLnByb3RvdHlwZS5nZXRBcml0eSA9IGFic3RyYWN0KCdnZXRBcml0eScpO1xuXG5wZXhwcnMuYW55LmdldEFyaXR5ID1cbiAgcGV4cHJzLmVuZC5nZXRBcml0eSA9XG4gIHBleHBycy5UZXJtaW5hbC5wcm90b3R5cGUuZ2V0QXJpdHkgPVxuICBwZXhwcnMuUmFuZ2UucHJvdG90eXBlLmdldEFyaXR5ID1cbiAgcGV4cHJzLlBhcmFtLnByb3RvdHlwZS5nZXRBcml0eSA9XG4gIHBleHBycy5BcHBseS5wcm90b3R5cGUuZ2V0QXJpdHkgPVxuICBwZXhwcnMuVW5pY29kZUNoYXIucHJvdG90eXBlLmdldEFyaXR5ID1cbiAgICBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH07XG5cbnBleHBycy5BbHQucHJvdG90eXBlLmdldEFyaXR5ID0gZnVuY3Rpb24oKSB7XG4gIC8vIFRoaXMgaXMgb2sgYi9jIGFsbCB0ZXJtcyBtdXN0IGhhdmUgdGhlIHNhbWUgYXJpdHkgLS0gdGhpcyBwcm9wZXJ0eSBpc1xuICAvLyBjaGVja2VkIGJ5IHRoZSBHcmFtbWFyIGNvbnN0cnVjdG9yLlxuICByZXR1cm4gdGhpcy50ZXJtcy5sZW5ndGggPT09IDAgPyAwIDogdGhpcy50ZXJtc1swXS5nZXRBcml0eSgpO1xufTtcblxucGV4cHJzLlNlcS5wcm90b3R5cGUuZ2V0QXJpdHkgPSBmdW5jdGlvbigpIHtcbiAgbGV0IGFyaXR5ID0gMDtcbiAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy5mYWN0b3JzLmxlbmd0aDsgaWR4KyspIHtcbiAgICBhcml0eSArPSB0aGlzLmZhY3RvcnNbaWR4XS5nZXRBcml0eSgpO1xuICB9XG4gIHJldHVybiBhcml0eTtcbn07XG5cbnBleHBycy5JdGVyLnByb3RvdHlwZS5nZXRBcml0eSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5leHByLmdldEFyaXR5KCk7XG59O1xuXG5wZXhwcnMuTm90LnByb3RvdHlwZS5nZXRBcml0eSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gMDtcbn07XG5cbnBleHBycy5Mb29rYWhlYWQucHJvdG90eXBlLmdldEFyaXR5ID0gcGV4cHJzLkxleC5wcm90b3R5cGUuZ2V0QXJpdHkgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZXhwci5nZXRBcml0eSgpO1xufTtcbiIsImltcG9ydCB7YWJzdHJhY3R9IGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy1tYWluLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmZ1bmN0aW9uIGdldE1ldGFJbmZvKGV4cHIsIGdyYW1tYXJJbnRlcnZhbCkge1xuICBjb25zdCBtZXRhSW5mbyA9IHt9O1xuICBpZiAoZXhwci5zb3VyY2UgJiYgZ3JhbW1hckludGVydmFsKSB7XG4gICAgY29uc3QgYWRqdXN0ZWQgPSBleHByLnNvdXJjZS5yZWxhdGl2ZVRvKGdyYW1tYXJJbnRlcnZhbCk7XG4gICAgbWV0YUluZm8uc291cmNlSW50ZXJ2YWwgPSBbYWRqdXN0ZWQuc3RhcnRJZHgsIGFkanVzdGVkLmVuZElkeF07XG4gIH1cbiAgcmV0dXJuIG1ldGFJbmZvO1xufVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3BlcmF0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxucGV4cHJzLlBFeHByLnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPSBhYnN0cmFjdCgnb3V0cHV0UmVjaXBlJyk7XG5cbnBleHBycy5hbnkub3V0cHV0UmVjaXBlID0gZnVuY3Rpb24oZm9ybWFscywgZ3JhbW1hckludGVydmFsKSB7XG4gIHJldHVybiBbJ2FueScsIGdldE1ldGFJbmZvKHRoaXMsIGdyYW1tYXJJbnRlcnZhbCldO1xufTtcblxucGV4cHJzLmVuZC5vdXRwdXRSZWNpcGUgPSBmdW5jdGlvbihmb3JtYWxzLCBncmFtbWFySW50ZXJ2YWwpIHtcbiAgcmV0dXJuIFsnZW5kJywgZ2V0TWV0YUluZm8odGhpcywgZ3JhbW1hckludGVydmFsKV07XG59O1xuXG5wZXhwcnMuVGVybWluYWwucHJvdG90eXBlLm91dHB1dFJlY2lwZSA9IGZ1bmN0aW9uKGZvcm1hbHMsIGdyYW1tYXJJbnRlcnZhbCkge1xuICByZXR1cm4gWyd0ZXJtaW5hbCcsIGdldE1ldGFJbmZvKHRoaXMsIGdyYW1tYXJJbnRlcnZhbCksIHRoaXMub2JqXTtcbn07XG5cbnBleHBycy5SYW5nZS5wcm90b3R5cGUub3V0cHV0UmVjaXBlID0gZnVuY3Rpb24oZm9ybWFscywgZ3JhbW1hckludGVydmFsKSB7XG4gIHJldHVybiBbJ3JhbmdlJywgZ2V0TWV0YUluZm8odGhpcywgZ3JhbW1hckludGVydmFsKSwgdGhpcy5mcm9tLCB0aGlzLnRvXTtcbn07XG5cbnBleHBycy5QYXJhbS5wcm90b3R5cGUub3V0cHV0UmVjaXBlID0gZnVuY3Rpb24oZm9ybWFscywgZ3JhbW1hckludGVydmFsKSB7XG4gIHJldHVybiBbJ3BhcmFtJywgZ2V0TWV0YUluZm8odGhpcywgZ3JhbW1hckludGVydmFsKSwgdGhpcy5pbmRleF07XG59O1xuXG5wZXhwcnMuQWx0LnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPSBmdW5jdGlvbihmb3JtYWxzLCBncmFtbWFySW50ZXJ2YWwpIHtcbiAgcmV0dXJuIFsnYWx0JywgZ2V0TWV0YUluZm8odGhpcywgZ3JhbW1hckludGVydmFsKV0uY29uY2F0KFxuICAgICAgdGhpcy50ZXJtcy5tYXAodGVybSA9PiB0ZXJtLm91dHB1dFJlY2lwZShmb3JtYWxzLCBncmFtbWFySW50ZXJ2YWwpKSxcbiAgKTtcbn07XG5cbnBleHBycy5FeHRlbmQucHJvdG90eXBlLm91dHB1dFJlY2lwZSA9IGZ1bmN0aW9uKGZvcm1hbHMsIGdyYW1tYXJJbnRlcnZhbCkge1xuICBjb25zdCBleHRlbnNpb24gPSB0aGlzLnRlcm1zWzBdOyAvLyBbZXh0ZW5zaW9uLCBvcmlnaW5hbF1cbiAgcmV0dXJuIGV4dGVuc2lvbi5vdXRwdXRSZWNpcGUoZm9ybWFscywgZ3JhbW1hckludGVydmFsKTtcbn07XG5cbnBleHBycy5TcGxpY2UucHJvdG90eXBlLm91dHB1dFJlY2lwZSA9IGZ1bmN0aW9uKGZvcm1hbHMsIGdyYW1tYXJJbnRlcnZhbCkge1xuICBjb25zdCBiZWZvcmVUZXJtcyA9IHRoaXMudGVybXMuc2xpY2UoMCwgdGhpcy5leHBhbnNpb25Qb3MpO1xuICBjb25zdCBhZnRlclRlcm1zID0gdGhpcy50ZXJtcy5zbGljZSh0aGlzLmV4cGFuc2lvblBvcyArIDEpO1xuICByZXR1cm4gW1xuICAgICdzcGxpY2UnLFxuICAgIGdldE1ldGFJbmZvKHRoaXMsIGdyYW1tYXJJbnRlcnZhbCksXG4gICAgYmVmb3JlVGVybXMubWFwKHRlcm0gPT4gdGVybS5vdXRwdXRSZWNpcGUoZm9ybWFscywgZ3JhbW1hckludGVydmFsKSksXG4gICAgYWZ0ZXJUZXJtcy5tYXAodGVybSA9PiB0ZXJtLm91dHB1dFJlY2lwZShmb3JtYWxzLCBncmFtbWFySW50ZXJ2YWwpKSxcbiAgXTtcbn07XG5cbnBleHBycy5TZXEucHJvdG90eXBlLm91dHB1dFJlY2lwZSA9IGZ1bmN0aW9uKGZvcm1hbHMsIGdyYW1tYXJJbnRlcnZhbCkge1xuICByZXR1cm4gWydzZXEnLCBnZXRNZXRhSW5mbyh0aGlzLCBncmFtbWFySW50ZXJ2YWwpXS5jb25jYXQoXG4gICAgICB0aGlzLmZhY3RvcnMubWFwKGZhY3RvciA9PiBmYWN0b3Iub3V0cHV0UmVjaXBlKGZvcm1hbHMsIGdyYW1tYXJJbnRlcnZhbCkpLFxuICApO1xufTtcblxucGV4cHJzLlN0YXIucHJvdG90eXBlLm91dHB1dFJlY2lwZSA9XG4gIHBleHBycy5QbHVzLnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPVxuICBwZXhwcnMuT3B0LnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPVxuICBwZXhwcnMuTm90LnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPVxuICBwZXhwcnMuTG9va2FoZWFkLnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPVxuICBwZXhwcnMuTGV4LnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPVxuICAgIGZ1bmN0aW9uKGZvcm1hbHMsIGdyYW1tYXJJbnRlcnZhbCkge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICAgIGdldE1ldGFJbmZvKHRoaXMsIGdyYW1tYXJJbnRlcnZhbCksXG4gICAgICAgIHRoaXMuZXhwci5vdXRwdXRSZWNpcGUoZm9ybWFscywgZ3JhbW1hckludGVydmFsKSxcbiAgICAgIF07XG4gICAgfTtcblxucGV4cHJzLkFwcGx5LnByb3RvdHlwZS5vdXRwdXRSZWNpcGUgPSBmdW5jdGlvbihmb3JtYWxzLCBncmFtbWFySW50ZXJ2YWwpIHtcbiAgcmV0dXJuIFtcbiAgICAnYXBwJyxcbiAgICBnZXRNZXRhSW5mbyh0aGlzLCBncmFtbWFySW50ZXJ2YWwpLFxuICAgIHRoaXMucnVsZU5hbWUsXG4gICAgdGhpcy5hcmdzLm1hcChhcmcgPT4gYXJnLm91dHB1dFJlY2lwZShmb3JtYWxzLCBncmFtbWFySW50ZXJ2YWwpKSxcbiAgXTtcbn07XG5cbnBleHBycy5Vbmljb2RlQ2hhci5wcm90b3R5cGUub3V0cHV0UmVjaXBlID0gZnVuY3Rpb24oZm9ybWFscywgZ3JhbW1hckludGVydmFsKSB7XG4gIHJldHVybiBbJ3VuaWNvZGVDaGFyJywgZ2V0TWV0YUluZm8odGhpcywgZ3JhbW1hckludGVydmFsKSwgdGhpcy5jYXRlZ29yeV07XG59O1xuIiwiaW1wb3J0IHthYnN0cmFjdH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLW1haW4uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3BlcmF0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLypcbiAgQ2FsbGVkIGF0IGdyYW1tYXIgY3JlYXRpb24gdGltZSB0byByZXdyaXRlIGEgcnVsZSBib2R5LCByZXBsYWNpbmcgZWFjaCByZWZlcmVuY2UgdG8gYSBmb3JtYWxcbiAgcGFyYW1ldGVyIHdpdGggYSBgUGFyYW1gIG5vZGUuIFJldHVybnMgYSBQRXhwciAtLSBlaXRoZXIgYSBuZXcgb25lLCBvciB0aGUgb3JpZ2luYWwgb25lIGlmXG4gIGl0IHdhcyBtb2RpZmllZCBpbiBwbGFjZS5cbiovXG5wZXhwcnMuUEV4cHIucHJvdG90eXBlLmludHJvZHVjZVBhcmFtcyA9IGFic3RyYWN0KCdpbnRyb2R1Y2VQYXJhbXMnKTtcblxucGV4cHJzLmFueS5pbnRyb2R1Y2VQYXJhbXMgPVxuICBwZXhwcnMuZW5kLmludHJvZHVjZVBhcmFtcyA9XG4gIHBleHBycy5UZXJtaW5hbC5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID1cbiAgcGV4cHJzLlJhbmdlLnByb3RvdHlwZS5pbnRyb2R1Y2VQYXJhbXMgPVxuICBwZXhwcnMuUGFyYW0ucHJvdG90eXBlLmludHJvZHVjZVBhcmFtcyA9XG4gIHBleHBycy5Vbmljb2RlQ2hhci5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID1cbiAgICBmdW5jdGlvbihmb3JtYWxzKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5wZXhwcnMuQWx0LnByb3RvdHlwZS5pbnRyb2R1Y2VQYXJhbXMgPSBmdW5jdGlvbihmb3JtYWxzKSB7XG4gIHRoaXMudGVybXMuZm9yRWFjaCgodGVybSwgaWR4LCB0ZXJtcykgPT4ge1xuICAgIHRlcm1zW2lkeF0gPSB0ZXJtLmludHJvZHVjZVBhcmFtcyhmb3JtYWxzKTtcbiAgfSk7XG4gIHJldHVybiB0aGlzO1xufTtcblxucGV4cHJzLlNlcS5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID0gZnVuY3Rpb24oZm9ybWFscykge1xuICB0aGlzLmZhY3RvcnMuZm9yRWFjaCgoZmFjdG9yLCBpZHgsIGZhY3RvcnMpID0+IHtcbiAgICBmYWN0b3JzW2lkeF0gPSBmYWN0b3IuaW50cm9kdWNlUGFyYW1zKGZvcm1hbHMpO1xuICB9KTtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5wZXhwcnMuSXRlci5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID1cbiAgcGV4cHJzLk5vdC5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID1cbiAgcGV4cHJzLkxvb2thaGVhZC5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID1cbiAgcGV4cHJzLkxleC5wcm90b3R5cGUuaW50cm9kdWNlUGFyYW1zID1cbiAgICBmdW5jdGlvbihmb3JtYWxzKSB7XG4gICAgICB0aGlzLmV4cHIgPSB0aGlzLmV4cHIuaW50cm9kdWNlUGFyYW1zKGZvcm1hbHMpO1xuICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfTtcblxucGV4cHJzLkFwcGx5LnByb3RvdHlwZS5pbnRyb2R1Y2VQYXJhbXMgPSBmdW5jdGlvbihmb3JtYWxzKSB7XG4gIGNvbnN0IGluZGV4ID0gZm9ybWFscy5pbmRleE9mKHRoaXMucnVsZU5hbWUpO1xuICBpZiAoaW5kZXggPj0gMCkge1xuICAgIGlmICh0aGlzLmFyZ3MubGVuZ3RoID4gMCkge1xuICAgICAgLy8gVE9ETzogU2hvdWxkIHRoaXMgYmUgc3VwcG9ydGVkPyBTZWUgaXNzdWUgIzY0LlxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQYXJhbWV0ZXJpemVkIHJ1bGVzIGNhbm5vdCBiZSBwYXNzZWQgYXMgYXJndW1lbnRzIHRvIGFub3RoZXIgcnVsZS4nKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBwZXhwcnMuUGFyYW0oaW5kZXgpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuYXJncy5mb3JFYWNoKChhcmcsIGlkeCwgYXJncykgPT4ge1xuICAgICAgYXJnc1tpZHhdID0gYXJnLmludHJvZHVjZVBhcmFtcyhmb3JtYWxzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufTtcbiIsImltcG9ydCB7YWJzdHJhY3R9IGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy1tYWluLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIE9wZXJhdGlvbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFJldHVybnMgYHRydWVgIGlmIHRoaXMgcGFyc2luZyBleHByZXNzaW9uIG1heSBhY2NlcHQgd2l0aG91dCBjb25zdW1pbmcgYW55IGlucHV0LlxucGV4cHJzLlBFeHByLnByb3RvdHlwZS5pc051bGxhYmxlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICByZXR1cm4gdGhpcy5faXNOdWxsYWJsZShncmFtbWFyLCBPYmplY3QuY3JlYXRlKG51bGwpKTtcbn07XG5cbnBleHBycy5QRXhwci5wcm90b3R5cGUuX2lzTnVsbGFibGUgPSBhYnN0cmFjdCgnX2lzTnVsbGFibGUnKTtcblxucGV4cHJzLmFueS5faXNOdWxsYWJsZSA9XG4gIHBleHBycy5SYW5nZS5wcm90b3R5cGUuX2lzTnVsbGFibGUgPVxuICBwZXhwcnMuUGFyYW0ucHJvdG90eXBlLl9pc051bGxhYmxlID1cbiAgcGV4cHJzLlBsdXMucHJvdG90eXBlLl9pc051bGxhYmxlID1cbiAgcGV4cHJzLlVuaWNvZGVDaGFyLnByb3RvdHlwZS5faXNOdWxsYWJsZSA9XG4gICAgZnVuY3Rpb24oZ3JhbW1hciwgbWVtbykge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbnBleHBycy5lbmQuX2lzTnVsbGFibGUgPSBmdW5jdGlvbihncmFtbWFyLCBtZW1vKSB7XG4gIHJldHVybiB0cnVlO1xufTtcblxucGV4cHJzLlRlcm1pbmFsLnByb3RvdHlwZS5faXNOdWxsYWJsZSA9IGZ1bmN0aW9uKGdyYW1tYXIsIG1lbW8pIHtcbiAgaWYgKHR5cGVvZiB0aGlzLm9iaiA9PT0gJ3N0cmluZycpIHtcbiAgICAvLyBUaGlzIGlzIGFuIG92ZXItc2ltcGxpZmljYXRpb246IGl0J3Mgb25seSBjb3JyZWN0IGlmIHRoZSBpbnB1dCBpcyBhIHN0cmluZy4gSWYgaXQncyBhbiBhcnJheVxuICAgIC8vIG9yIGFuIG9iamVjdCwgdGhlbiB0aGUgZW1wdHkgc3RyaW5nIHBhcnNpbmcgZXhwcmVzc2lvbiBpcyBub3QgbnVsbGFibGUuXG4gICAgcmV0dXJuIHRoaXMub2JqID09PSAnJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn07XG5cbnBleHBycy5BbHQucHJvdG90eXBlLl9pc051bGxhYmxlID0gZnVuY3Rpb24oZ3JhbW1hciwgbWVtbykge1xuICByZXR1cm4gdGhpcy50ZXJtcy5sZW5ndGggPT09IDAgfHwgdGhpcy50ZXJtcy5zb21lKHRlcm0gPT4gdGVybS5faXNOdWxsYWJsZShncmFtbWFyLCBtZW1vKSk7XG59O1xuXG5wZXhwcnMuU2VxLnByb3RvdHlwZS5faXNOdWxsYWJsZSA9IGZ1bmN0aW9uKGdyYW1tYXIsIG1lbW8pIHtcbiAgcmV0dXJuIHRoaXMuZmFjdG9ycy5ldmVyeShmYWN0b3IgPT4gZmFjdG9yLl9pc051bGxhYmxlKGdyYW1tYXIsIG1lbW8pKTtcbn07XG5cbnBleHBycy5TdGFyLnByb3RvdHlwZS5faXNOdWxsYWJsZSA9XG4gIHBleHBycy5PcHQucHJvdG90eXBlLl9pc051bGxhYmxlID1cbiAgcGV4cHJzLk5vdC5wcm90b3R5cGUuX2lzTnVsbGFibGUgPVxuICBwZXhwcnMuTG9va2FoZWFkLnByb3RvdHlwZS5faXNOdWxsYWJsZSA9XG4gICAgZnVuY3Rpb24oZ3JhbW1hciwgbWVtbykge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcblxucGV4cHJzLkxleC5wcm90b3R5cGUuX2lzTnVsbGFibGUgPSBmdW5jdGlvbihncmFtbWFyLCBtZW1vKSB7XG4gIHJldHVybiB0aGlzLmV4cHIuX2lzTnVsbGFibGUoZ3JhbW1hciwgbWVtbyk7XG59O1xuXG5wZXhwcnMuQXBwbHkucHJvdG90eXBlLl9pc051bGxhYmxlID0gZnVuY3Rpb24oZ3JhbW1hciwgbWVtbykge1xuICBjb25zdCBrZXkgPSB0aGlzLnRvTWVtb0tleSgpO1xuICBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChtZW1vLCBrZXkpKSB7XG4gICAgY29uc3Qge2JvZHl9ID0gZ3JhbW1hci5ydWxlc1t0aGlzLnJ1bGVOYW1lXTtcbiAgICBjb25zdCBpbmxpbmVkID0gYm9keS5zdWJzdGl0dXRlUGFyYW1zKHRoaXMuYXJncyk7XG4gICAgbWVtb1trZXldID0gZmFsc2U7IC8vIFByZXZlbnQgaW5maW5pdGUgcmVjdXJzaW9uIGZvciByZWN1cnNpdmUgcnVsZXMuXG4gICAgbWVtb1trZXldID0gaW5saW5lZC5faXNOdWxsYWJsZShncmFtbWFyLCBtZW1vKTtcbiAgfVxuICByZXR1cm4gbWVtb1trZXldO1xufTtcbiIsImltcG9ydCB7YWJzdHJhY3QsIGNoZWNrTm90TnVsbH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLW1haW4uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3BlcmF0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLypcbiAgUmV0dXJucyBhIFBFeHByIHRoYXQgcmVzdWx0cyBmcm9tIHJlY3Vyc2l2ZWx5IHJlcGxhY2luZyBldmVyeSBmb3JtYWwgcGFyYW1ldGVyIChpLmUuLCBpbnN0YW5jZVxuICBvZiBgUGFyYW1gKSBpbnNpZGUgdGhpcyBQRXhwciB3aXRoIGl0cyBhY3R1YWwgdmFsdWUgZnJvbSBgYWN0dWFsc2AgKGFuIEFycmF5KS5cblxuICBUaGUgcmVjZWl2ZXIgbXVzdCBub3QgYmUgbW9kaWZpZWQ7IGEgbmV3IFBFeHByIG11c3QgYmUgcmV0dXJuZWQgaWYgYW55IHJlcGxhY2VtZW50IGlzIG5lY2Vzc2FyeS5cbiovXG4vLyBmdW5jdGlvbihhY3R1YWxzKSB7IC4uLiB9XG5wZXhwcnMuUEV4cHIucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPSBhYnN0cmFjdCgnc3Vic3RpdHV0ZVBhcmFtcycpO1xuXG5wZXhwcnMuYW55LnN1YnN0aXR1dGVQYXJhbXMgPVxuICBwZXhwcnMuZW5kLnN1YnN0aXR1dGVQYXJhbXMgPVxuICBwZXhwcnMuVGVybWluYWwucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPVxuICBwZXhwcnMuUmFuZ2UucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPVxuICBwZXhwcnMuVW5pY29kZUNoYXIucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPVxuICAgIGZ1bmN0aW9uKGFjdHVhbHMpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbnBleHBycy5QYXJhbS5wcm90b3R5cGUuc3Vic3RpdHV0ZVBhcmFtcyA9IGZ1bmN0aW9uKGFjdHVhbHMpIHtcbiAgcmV0dXJuIGNoZWNrTm90TnVsbChhY3R1YWxzW3RoaXMuaW5kZXhdKTtcbn07XG5cbnBleHBycy5BbHQucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPSBmdW5jdGlvbihhY3R1YWxzKSB7XG4gIHJldHVybiBuZXcgcGV4cHJzLkFsdCh0aGlzLnRlcm1zLm1hcCh0ZXJtID0+IHRlcm0uc3Vic3RpdHV0ZVBhcmFtcyhhY3R1YWxzKSkpO1xufTtcblxucGV4cHJzLlNlcS5wcm90b3R5cGUuc3Vic3RpdHV0ZVBhcmFtcyA9IGZ1bmN0aW9uKGFjdHVhbHMpIHtcbiAgcmV0dXJuIG5ldyBwZXhwcnMuU2VxKHRoaXMuZmFjdG9ycy5tYXAoZmFjdG9yID0+IGZhY3Rvci5zdWJzdGl0dXRlUGFyYW1zKGFjdHVhbHMpKSk7XG59O1xuXG5wZXhwcnMuSXRlci5wcm90b3R5cGUuc3Vic3RpdHV0ZVBhcmFtcyA9XG4gIHBleHBycy5Ob3QucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPVxuICBwZXhwcnMuTG9va2FoZWFkLnByb3RvdHlwZS5zdWJzdGl0dXRlUGFyYW1zID1cbiAgcGV4cHJzLkxleC5wcm90b3R5cGUuc3Vic3RpdHV0ZVBhcmFtcyA9XG4gICAgZnVuY3Rpb24oYWN0dWFscykge1xuICAgICAgcmV0dXJuIG5ldyB0aGlzLmNvbnN0cnVjdG9yKHRoaXMuZXhwci5zdWJzdGl0dXRlUGFyYW1zKGFjdHVhbHMpKTtcbiAgICB9O1xuXG5wZXhwcnMuQXBwbHkucHJvdG90eXBlLnN1YnN0aXR1dGVQYXJhbXMgPSBmdW5jdGlvbihhY3R1YWxzKSB7XG4gIGlmICh0aGlzLmFyZ3MubGVuZ3RoID09PSAwKSB7XG4gICAgLy8gQXZvaWQgbWFraW5nIGEgY29weSBvZiB0aGlzIGFwcGxpY2F0aW9uLCBhcyBhbiBvcHRpbWl6YXRpb25cbiAgICByZXR1cm4gdGhpcztcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBhcmdzID0gdGhpcy5hcmdzLm1hcChhcmcgPT4gYXJnLnN1YnN0aXR1dGVQYXJhbXMoYWN0dWFscykpO1xuICAgIHJldHVybiBuZXcgcGV4cHJzLkFwcGx5KHRoaXMucnVsZU5hbWUsIGFyZ3MpO1xuICB9XG59O1xuIiwiaW1wb3J0IHthYnN0cmFjdCwgY29weVdpdGhvdXREdXBsaWNhdGVzfSBmcm9tICcuL2NvbW1vbi5qcyc7XG5pbXBvcnQgKiBhcyBwZXhwcnMgZnJvbSAnLi9wZXhwcnMtbWFpbi5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlIHN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5mdW5jdGlvbiBpc1Jlc3RyaWN0ZWRKU0lkZW50aWZpZXIoc3RyKSB7XG4gIHJldHVybiAvXlthLXpBLVpfJF1bMC05YS16QS1aXyRdKiQvLnRlc3Qoc3RyKTtcbn1cblxuZnVuY3Rpb24gcmVzb2x2ZUR1cGxpY2F0ZWROYW1lcyhhcmd1bWVudE5hbWVMaXN0KSB7XG4gIC8vIGBjb3VudGAgaXMgdXNlZCB0byByZWNvcmQgdGhlIG51bWJlciBvZiB0aW1lcyBlYWNoIGFyZ3VtZW50IG5hbWUgb2NjdXJzIGluIHRoZSBsaXN0LFxuICAvLyB0aGlzIGlzIHVzZWZ1bCBmb3IgY2hlY2tpbmcgZHVwbGljYXRlZCBhcmd1bWVudCBuYW1lLiBJdCBtYXBzIGFyZ3VtZW50IG5hbWVzIHRvIGludHMuXG4gIGNvbnN0IGNvdW50ID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgYXJndW1lbnROYW1lTGlzdC5mb3JFYWNoKGFyZ05hbWUgPT4ge1xuICAgIGNvdW50W2FyZ05hbWVdID0gKGNvdW50W2FyZ05hbWVdIHx8IDApICsgMTtcbiAgfSk7XG5cbiAgLy8gQXBwZW5kIHN1YnNjcmlwdHMgKCdfMScsICdfMicsIC4uLikgdG8gZHVwbGljYXRlIGFyZ3VtZW50IG5hbWVzLlxuICBPYmplY3Qua2V5cyhjb3VudCkuZm9yRWFjaChkdXBBcmdOYW1lID0+IHtcbiAgICBpZiAoY291bnRbZHVwQXJnTmFtZV0gPD0gMSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbmFtZSBzaG93cyB1cCBtb3JlIHRoYW4gb25jZSwgc28gYWRkIHN1YnNjcmlwdHMuXG4gICAgbGV0IHN1YnNjcmlwdCA9IDE7XG4gICAgYXJndW1lbnROYW1lTGlzdC5mb3JFYWNoKChhcmdOYW1lLCBpZHgpID0+IHtcbiAgICAgIGlmIChhcmdOYW1lID09PSBkdXBBcmdOYW1lKSB7XG4gICAgICAgIGFyZ3VtZW50TmFtZUxpc3RbaWR4XSA9IGFyZ05hbWUgKyAnXycgKyBzdWJzY3JpcHQrKztcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPcGVyYXRpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKlxuICBSZXR1cm5zIGEgbGlzdCBvZiBzdHJpbmdzIHRoYXQgd2lsbCBiZSB1c2VkIGFzIHRoZSBkZWZhdWx0IGFyZ3VtZW50IG5hbWVzIGZvciBpdHMgcmVjZWl2ZXJcbiAgKGEgcGV4cHIpIGluIGEgc2VtYW50aWMgYWN0aW9uLiBUaGlzIGlzIHVzZWQgZXhjbHVzaXZlbHkgYnkgdGhlIFNlbWFudGljcyBFZGl0b3IuXG5cbiAgYGZpcnN0QXJnSW5kZXhgIGlzIHRoZSAxLWJhc2VkIGluZGV4IG9mIHRoZSBmaXJzdCBhcmd1bWVudCBuYW1lIHRoYXQgd2lsbCBiZSBnZW5lcmF0ZWQgZm9yIHRoaXNcbiAgcGV4cHIuIEl0IGVuYWJsZXMgdXMgdG8gbmFtZSBhcmd1bWVudHMgcG9zaXRpb25hbGx5LCBlLmcuLCBpZiB0aGUgc2Vjb25kIGFyZ3VtZW50IGlzIGFcbiAgbm9uLWFscGhhbnVtZXJpYyB0ZXJtaW5hbCBsaWtlIFwiK1wiLCBpdCB3aWxsIGJlIG5hbWVkICckMicuXG5cbiAgYG5vRHVwQ2hlY2tgIGlzIHRydWUgaWYgdGhlIGNhbGxlciBvZiBgdG9Bcmd1bWVudE5hbWVMaXN0YCBpcyBub3QgYSB0b3AgbGV2ZWwgY2FsbGVyLiBJdCBlbmFibGVzXG4gIHVzIHRvIGF2b2lkIG5lc3RlZCBkdXBsaWNhdGlvbiBzdWJzY3JpcHRzIGFwcGVuZGluZywgZS5nLiwgJ18xXzEnLCAnXzFfMicsIGJ5IG9ubHkgY2hlY2tpbmdcbiAgZHVwbGljYXRlcyBhdCB0aGUgdG9wIGxldmVsLlxuXG4gIEhlcmUgaXMgYSBtb3JlIGVsYWJvcmF0ZSBleGFtcGxlIHRoYXQgaWxsdXN0cmF0ZXMgaG93IHRoaXMgbWV0aG9kIHdvcmtzOlxuICBgKGEgXCIrXCIgYikudG9Bcmd1bWVudE5hbWVMaXN0KDEpYCBldmFsdWF0ZXMgdG8gYFsnYScsICckMicsICdiJ11gIHdpdGggdGhlIGZvbGxvd2luZyByZWN1cnNpdmVcbiAgY2FsbHM6XG5cbiAgICAoYSkudG9Bcmd1bWVudE5hbWVMaXN0KDEpIC0+IFsnYSddLFxuICAgIChcIitcIikudG9Bcmd1bWVudE5hbWVMaXN0KDIpIC0+IFsnJDInXSxcbiAgICAoYikudG9Bcmd1bWVudE5hbWVMaXN0KDMpIC0+IFsnYiddXG5cbiAgTm90ZXM6XG4gICogVGhpcyBtZXRob2QgbXVzdCBvbmx5IGJlIGNhbGxlZCBvbiB3ZWxsLWZvcm1lZCBleHByZXNzaW9ucywgZS5nLiwgdGhlIHJlY2VpdmVyIG11c3RcbiAgICBub3QgaGF2ZSBhbnkgQWx0IHN1Yi1leHByZXNzaW9ucyB3aXRoIGluY29uc2lzdGVudCBhcml0aWVzLlxuICAqIGUuZ2V0QXJpdHkoKSA9PT0gZS50b0FyZ3VtZW50TmFtZUxpc3QoMSkubGVuZ3RoXG4qL1xuLy8gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykgeyAuLi4gfVxucGV4cHJzLlBFeHByLnByb3RvdHlwZS50b0FyZ3VtZW50TmFtZUxpc3QgPSBhYnN0cmFjdCgndG9Bcmd1bWVudE5hbWVMaXN0Jyk7XG5cbnBleHBycy5hbnkudG9Bcmd1bWVudE5hbWVMaXN0ID0gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykge1xuICByZXR1cm4gWydhbnknXTtcbn07XG5cbnBleHBycy5lbmQudG9Bcmd1bWVudE5hbWVMaXN0ID0gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykge1xuICByZXR1cm4gWydlbmQnXTtcbn07XG5cbnBleHBycy5UZXJtaW5hbC5wcm90b3R5cGUudG9Bcmd1bWVudE5hbWVMaXN0ID0gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykge1xuICBpZiAodHlwZW9mIHRoaXMub2JqID09PSAnc3RyaW5nJyAmJiAvXltfYS16QS1aMC05XSskLy50ZXN0KHRoaXMub2JqKSkge1xuICAgIC8vIElmIHRoaXMgdGVybWluYWwgaXMgYSB2YWxpZCBzdWZmaXggZm9yIGEgSlMgaWRlbnRpZmllciwganVzdCBwcmVwZW5kIGl0IHdpdGggJ18nXG4gICAgcmV0dXJuIFsnXycgKyB0aGlzLm9ial07XG4gIH0gZWxzZSB7XG4gICAgLy8gT3RoZXJ3aXNlLCBuYW1lIGl0IHBvc2l0aW9uYWxseS5cbiAgICByZXR1cm4gWyckJyArIGZpcnN0QXJnSW5kZXhdO1xuICB9XG59O1xuXG5wZXhwcnMuUmFuZ2UucHJvdG90eXBlLnRvQXJndW1lbnROYW1lTGlzdCA9IGZ1bmN0aW9uKGZpcnN0QXJnSW5kZXgsIG5vRHVwQ2hlY2spIHtcbiAgbGV0IGFyZ05hbWUgPSB0aGlzLmZyb20gKyAnX3RvXycgKyB0aGlzLnRvO1xuICAvLyBJZiB0aGUgYGFyZ05hbWVgIGlzIG5vdCB2YWxpZCB0aGVuIHRyeSB0byBwcmVwZW5kIGEgYF9gLlxuICBpZiAoIWlzUmVzdHJpY3RlZEpTSWRlbnRpZmllcihhcmdOYW1lKSkge1xuICAgIGFyZ05hbWUgPSAnXycgKyBhcmdOYW1lO1xuICB9XG4gIC8vIElmIHRoZSBgYXJnTmFtZWAgc3RpbGwgbm90IHZhbGlkIGFmdGVyIHByZXBlbmRpbmcgYSBgX2AsIHRoZW4gbmFtZSBpdCBwb3NpdGlvbmFsbHkuXG4gIGlmICghaXNSZXN0cmljdGVkSlNJZGVudGlmaWVyKGFyZ05hbWUpKSB7XG4gICAgYXJnTmFtZSA9ICckJyArIGZpcnN0QXJnSW5kZXg7XG4gIH1cbiAgcmV0dXJuIFthcmdOYW1lXTtcbn07XG5cbnBleHBycy5BbHQucHJvdG90eXBlLnRvQXJndW1lbnROYW1lTGlzdCA9IGZ1bmN0aW9uKGZpcnN0QXJnSW5kZXgsIG5vRHVwQ2hlY2spIHtcbiAgLy8gYHRlcm1BcmdOYW1lTGlzdHNgIGlzIGFuIGFycmF5IG9mIGFycmF5cyB3aGVyZSBlYWNoIHJvdyBpcyB0aGVcbiAgLy8gYXJndW1lbnQgbmFtZSBsaXN0IHRoYXQgY29ycmVzcG9uZHMgdG8gYSB0ZXJtIGluIHRoaXMgYWx0ZXJuYXRpb24uXG4gIGNvbnN0IHRlcm1BcmdOYW1lTGlzdHMgPSB0aGlzLnRlcm1zLm1hcCh0ZXJtID0+XG4gICAgdGVybS50b0FyZ3VtZW50TmFtZUxpc3QoZmlyc3RBcmdJbmRleCwgdHJ1ZSksXG4gICk7XG5cbiAgY29uc3QgYXJndW1lbnROYW1lTGlzdCA9IFtdO1xuICBjb25zdCBudW1BcmdzID0gdGVybUFyZ05hbWVMaXN0c1swXS5sZW5ndGg7XG4gIGZvciAobGV0IGNvbElkeCA9IDA7IGNvbElkeCA8IG51bUFyZ3M7IGNvbElkeCsrKSB7XG4gICAgY29uc3QgY29sID0gW107XG4gICAgZm9yIChsZXQgcm93SWR4ID0gMDsgcm93SWR4IDwgdGhpcy50ZXJtcy5sZW5ndGg7IHJvd0lkeCsrKSB7XG4gICAgICBjb2wucHVzaCh0ZXJtQXJnTmFtZUxpc3RzW3Jvd0lkeF1bY29sSWR4XSk7XG4gICAgfVxuICAgIGNvbnN0IHVuaXF1ZU5hbWVzID0gY29weVdpdGhvdXREdXBsaWNhdGVzKGNvbCk7XG4gICAgYXJndW1lbnROYW1lTGlzdC5wdXNoKHVuaXF1ZU5hbWVzLmpvaW4oJ19vcl8nKSk7XG4gIH1cblxuICBpZiAoIW5vRHVwQ2hlY2spIHtcbiAgICByZXNvbHZlRHVwbGljYXRlZE5hbWVzKGFyZ3VtZW50TmFtZUxpc3QpO1xuICB9XG4gIHJldHVybiBhcmd1bWVudE5hbWVMaXN0O1xufTtcblxucGV4cHJzLlNlcS5wcm90b3R5cGUudG9Bcmd1bWVudE5hbWVMaXN0ID0gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykge1xuICAvLyBHZW5lcmF0ZSB0aGUgYXJndW1lbnQgbmFtZSBsaXN0LCB3aXRob3V0IHdvcnJ5aW5nIGFib3V0IGR1cGxpY2F0ZXMuXG4gIGxldCBhcmd1bWVudE5hbWVMaXN0ID0gW107XG4gIHRoaXMuZmFjdG9ycy5mb3JFYWNoKGZhY3RvciA9PiB7XG4gICAgY29uc3QgZmFjdG9yQXJndW1lbnROYW1lTGlzdCA9IGZhY3Rvci50b0FyZ3VtZW50TmFtZUxpc3QoZmlyc3RBcmdJbmRleCwgdHJ1ZSk7XG4gICAgYXJndW1lbnROYW1lTGlzdCA9IGFyZ3VtZW50TmFtZUxpc3QuY29uY2F0KGZhY3RvckFyZ3VtZW50TmFtZUxpc3QpO1xuXG4gICAgLy8gU2hpZnQgdGhlIGZpcnN0QXJnSW5kZXggdG8gdGFrZSB0aGlzIGZhY3RvcidzIGFyZ3VtZW50IG5hbWVzIGludG8gYWNjb3VudC5cbiAgICBmaXJzdEFyZ0luZGV4ICs9IGZhY3RvckFyZ3VtZW50TmFtZUxpc3QubGVuZ3RoO1xuICB9KTtcbiAgaWYgKCFub0R1cENoZWNrKSB7XG4gICAgcmVzb2x2ZUR1cGxpY2F0ZWROYW1lcyhhcmd1bWVudE5hbWVMaXN0KTtcbiAgfVxuICByZXR1cm4gYXJndW1lbnROYW1lTGlzdDtcbn07XG5cbnBleHBycy5JdGVyLnByb3RvdHlwZS50b0FyZ3VtZW50TmFtZUxpc3QgPSBmdW5jdGlvbihmaXJzdEFyZ0luZGV4LCBub0R1cENoZWNrKSB7XG4gIGNvbnN0IGFyZ3VtZW50TmFtZUxpc3QgPSB0aGlzLmV4cHJcbiAgICAgIC50b0FyZ3VtZW50TmFtZUxpc3QoZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaylcbiAgICAgIC5tYXAoZXhwckFyZ3VtZW50U3RyaW5nID0+XG4gICAgICBleHByQXJndW1lbnRTdHJpbmdbZXhwckFyZ3VtZW50U3RyaW5nLmxlbmd0aCAtIDFdID09PSAncycgP1xuICAgICAgICBleHByQXJndW1lbnRTdHJpbmcgKyAnZXMnIDpcbiAgICAgICAgZXhwckFyZ3VtZW50U3RyaW5nICsgJ3MnLFxuICAgICAgKTtcbiAgaWYgKCFub0R1cENoZWNrKSB7XG4gICAgcmVzb2x2ZUR1cGxpY2F0ZWROYW1lcyhhcmd1bWVudE5hbWVMaXN0KTtcbiAgfVxuICByZXR1cm4gYXJndW1lbnROYW1lTGlzdDtcbn07XG5cbnBleHBycy5PcHQucHJvdG90eXBlLnRvQXJndW1lbnROYW1lTGlzdCA9IGZ1bmN0aW9uKGZpcnN0QXJnSW5kZXgsIG5vRHVwQ2hlY2spIHtcbiAgcmV0dXJuIHRoaXMuZXhwci50b0FyZ3VtZW50TmFtZUxpc3QoZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykubWFwKGFyZ05hbWUgPT4ge1xuICAgIHJldHVybiAnb3B0JyArIGFyZ05hbWVbMF0udG9VcHBlckNhc2UoKSArIGFyZ05hbWUuc2xpY2UoMSk7XG4gIH0pO1xufTtcblxucGV4cHJzLk5vdC5wcm90b3R5cGUudG9Bcmd1bWVudE5hbWVMaXN0ID0gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykge1xuICByZXR1cm4gW107XG59O1xuXG5wZXhwcnMuTG9va2FoZWFkLnByb3RvdHlwZS50b0FyZ3VtZW50TmFtZUxpc3QgPSBwZXhwcnMuTGV4LnByb3RvdHlwZS50b0FyZ3VtZW50TmFtZUxpc3QgPVxuICBmdW5jdGlvbihmaXJzdEFyZ0luZGV4LCBub0R1cENoZWNrKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhwci50b0FyZ3VtZW50TmFtZUxpc3QoZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjayk7XG4gIH07XG5cbnBleHBycy5BcHBseS5wcm90b3R5cGUudG9Bcmd1bWVudE5hbWVMaXN0ID0gZnVuY3Rpb24oZmlyc3RBcmdJbmRleCwgbm9EdXBDaGVjaykge1xuICByZXR1cm4gW3RoaXMucnVsZU5hbWVdO1xufTtcblxucGV4cHJzLlVuaWNvZGVDaGFyLnByb3RvdHlwZS50b0FyZ3VtZW50TmFtZUxpc3QgPSBmdW5jdGlvbihmaXJzdEFyZ0luZGV4LCBub0R1cENoZWNrKSB7XG4gIHJldHVybiBbJyQnICsgZmlyc3RBcmdJbmRleF07XG59O1xuXG5wZXhwcnMuUGFyYW0ucHJvdG90eXBlLnRvQXJndW1lbnROYW1lTGlzdCA9IGZ1bmN0aW9uKGZpcnN0QXJnSW5kZXgsIG5vRHVwQ2hlY2spIHtcbiAgcmV0dXJuIFsncGFyYW0nICsgdGhpcy5pbmRleF07XG59O1xuXG4vLyBcIlZhbHVlIHBleHByc1wiIChWYWx1ZSwgU3RyLCBBcnIsIE9iaikgYXJlIGdvaW5nIGF3YXkgc29vbiwgc28gd2UgZG9uJ3Qgd29ycnkgYWJvdXQgdGhlbSBoZXJlLlxuIiwiaW1wb3J0IHthYnN0cmFjdH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLW1haW4uanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT3BlcmF0aW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gUmV0dXJucyBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIFBFeHByLCBmb3IgdXNlIGFzIGEgVUkgbGFiZWwsIGV0Yy5cbnBleHBycy5QRXhwci5wcm90b3R5cGUudG9EaXNwbGF5U3RyaW5nID0gYWJzdHJhY3QoJ3RvRGlzcGxheVN0cmluZycpO1xuXG5wZXhwcnMuQWx0LnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPSBwZXhwcnMuU2VxLnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuc291cmNlKSB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlLnRyaW1tZWQoKS5jb250ZW50cztcbiAgfVxuICByZXR1cm4gJ1snICsgdGhpcy5jb25zdHJ1Y3Rvci5uYW1lICsgJ10nO1xufTtcblxucGV4cHJzLmFueS50b0Rpc3BsYXlTdHJpbmcgPVxuICBwZXhwcnMuZW5kLnRvRGlzcGxheVN0cmluZyA9XG4gIHBleHBycy5JdGVyLnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPVxuICBwZXhwcnMuTm90LnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPVxuICBwZXhwcnMuTG9va2FoZWFkLnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPVxuICBwZXhwcnMuTGV4LnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPVxuICBwZXhwcnMuVGVybWluYWwucHJvdG90eXBlLnRvRGlzcGxheVN0cmluZyA9XG4gIHBleHBycy5SYW5nZS5wcm90b3R5cGUudG9EaXNwbGF5U3RyaW5nID1cbiAgcGV4cHJzLlBhcmFtLnByb3RvdHlwZS50b0Rpc3BsYXlTdHJpbmcgPVxuICAgIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTtcbiAgICB9O1xuXG5wZXhwcnMuQXBwbHkucHJvdG90eXBlLnRvRGlzcGxheVN0cmluZyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5hcmdzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBwcyA9IHRoaXMuYXJncy5tYXAoYXJnID0+IGFyZy50b0Rpc3BsYXlTdHJpbmcoKSk7XG4gICAgcmV0dXJuIHRoaXMucnVsZU5hbWUgKyAnPCcgKyBwcy5qb2luKCcsJykgKyAnPic7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMucnVsZU5hbWU7XG4gIH1cbn07XG5cbnBleHBycy5Vbmljb2RlQ2hhci5wcm90b3R5cGUudG9EaXNwbGF5U3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnVW5pY29kZSBbJyArIHRoaXMuY2F0ZWdvcnkgKyAnXSBjaGFyYWN0ZXInO1xufTtcbiIsIi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlIHN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vKlxuICBgRmFpbHVyZWBzIHJlcHJlc2VudCBleHByZXNzaW9ucyB0aGF0IHdlcmVuJ3QgbWF0Y2hlZCB3aGlsZSBwYXJzaW5nLiBUaGV5IGFyZSB1c2VkIHRvIGdlbmVyYXRlXG4gIGVycm9yIG1lc3NhZ2VzIGF1dG9tYXRpY2FsbHkuIFRoZSBpbnRlcmZhY2Ugb2YgYEZhaWx1cmVgcyBpbmNsdWRlcyB0aGUgY29sbG93aW5nIG1ldGhvZHM6XG5cbiAgLSBnZXRUZXh0KCkgOiBTdHJpbmdcbiAgLSBnZXRUeXBlKCkgOiBTdHJpbmcgIChvbmUgb2Yge1wiZGVzY3JpcHRpb25cIiwgXCJzdHJpbmdcIiwgXCJjb2RlXCJ9KVxuICAtIGlzRGVzY3JpcHRpb24oKSA6IGJvb2xcbiAgLSBpc1N0cmluZ1Rlcm1pbmFsKCkgOiBib29sXG4gIC0gaXNDb2RlKCkgOiBib29sXG4gIC0gaXNGbHVmZnkoKSA6IGJvb2xcbiAgLSBtYWtlRmx1ZmZ5KCkgOiB2b2lkXG4gIC0gc3Vic3VtZXMoRmFpbHVyZSkgOiBib29sXG4qL1xuXG5mdW5jdGlvbiBpc1ZhbGlkVHlwZSh0eXBlKSB7XG4gIHJldHVybiB0eXBlID09PSAnZGVzY3JpcHRpb24nIHx8IHR5cGUgPT09ICdzdHJpbmcnIHx8IHR5cGUgPT09ICdjb2RlJztcbn1cblxuZXhwb3J0IGNsYXNzIEZhaWx1cmUge1xuICBjb25zdHJ1Y3RvcihwZXhwciwgdGV4dCwgdHlwZSkge1xuICAgIGlmICghaXNWYWxpZFR5cGUodHlwZSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignaW52YWxpZCBGYWlsdXJlIHR5cGU6ICcgKyB0eXBlKTtcbiAgICB9XG4gICAgdGhpcy5wZXhwciA9IHBleHByO1xuICAgIHRoaXMudGV4dCA9IHRleHQ7XG4gICAgdGhpcy50eXBlID0gdHlwZTtcbiAgICB0aGlzLmZsdWZmeSA9IGZhbHNlO1xuICB9XG5cbiAgZ2V0UEV4cHIoKSB7XG4gICAgcmV0dXJuIHRoaXMucGV4cHI7XG4gIH1cblxuICBnZXRUZXh0KCkge1xuICAgIHJldHVybiB0aGlzLnRleHQ7XG4gIH1cblxuICBnZXRUeXBlKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGU7XG4gIH1cblxuICBpc0Rlc2NyaXB0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICdkZXNjcmlwdGlvbic7XG4gIH1cblxuICBpc1N0cmluZ1Rlcm1pbmFsKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICdzdHJpbmcnO1xuICB9XG5cbiAgaXNDb2RlKCkge1xuICAgIHJldHVybiB0aGlzLnR5cGUgPT09ICdjb2RlJztcbiAgfVxuXG4gIGlzRmx1ZmZ5KCkge1xuICAgIHJldHVybiB0aGlzLmZsdWZmeTtcbiAgfVxuXG4gIG1ha2VGbHVmZnkoKSB7XG4gICAgdGhpcy5mbHVmZnkgPSB0cnVlO1xuICB9XG5cbiAgY2xlYXJGbHVmZnkoKSB7XG4gICAgdGhpcy5mbHVmZnkgPSBmYWxzZTtcbiAgfVxuXG4gIHN1YnN1bWVzKHRoYXQpIHtcbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5nZXRUZXh0KCkgPT09IHRoYXQuZ2V0VGV4dCgpICYmXG4gICAgICB0aGlzLnR5cGUgPT09IHRoYXQudHlwZSAmJlxuICAgICAgKCF0aGlzLmlzRmx1ZmZ5KCkgfHwgKHRoaXMuaXNGbHVmZnkoKSAmJiB0aGF0LmlzRmx1ZmZ5KCkpKVxuICAgICk7XG4gIH1cblxuICB0b1N0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy50eXBlID09PSAnc3RyaW5nJyA/IEpTT04uc3RyaW5naWZ5KHRoaXMuZ2V0VGV4dCgpKSA6IHRoaXMuZ2V0VGV4dCgpO1xuICB9XG5cbiAgY2xvbmUoKSB7XG4gICAgY29uc3QgZmFpbHVyZSA9IG5ldyBGYWlsdXJlKHRoaXMucGV4cHIsIHRoaXMudGV4dCwgdGhpcy50eXBlKTtcbiAgICBpZiAodGhpcy5pc0ZsdWZmeSgpKSB7XG4gICAgICBmYWlsdXJlLm1ha2VGbHVmZnkoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhaWx1cmU7XG4gIH1cblxuICB0b0tleSgpIHtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpICsgJyMnICsgdGhpcy50eXBlO1xuICB9XG59XG4iLCJpbXBvcnQge2Fic3RyYWN0fSBmcm9tICcuL2NvbW1vbi5qcyc7XG5pbXBvcnQgKiBhcyBwZXhwcnMgZnJvbSAnLi9wZXhwcnMtbWFpbi5qcyc7XG5pbXBvcnQge0ZhaWx1cmV9IGZyb20gJy4vRmFpbHVyZS5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPcGVyYXRpb25zXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5wZXhwcnMuUEV4cHIucHJvdG90eXBlLnRvRmFpbHVyZSA9IGFic3RyYWN0KCd0b0ZhaWx1cmUnKTtcblxucGV4cHJzLmFueS50b0ZhaWx1cmUgPSBmdW5jdGlvbihncmFtbWFyKSB7XG4gIHJldHVybiBuZXcgRmFpbHVyZSh0aGlzLCAnYW55IG9iamVjdCcsICdkZXNjcmlwdGlvbicpO1xufTtcblxucGV4cHJzLmVuZC50b0ZhaWx1cmUgPSBmdW5jdGlvbihncmFtbWFyKSB7XG4gIHJldHVybiBuZXcgRmFpbHVyZSh0aGlzLCAnZW5kIG9mIGlucHV0JywgJ2Rlc2NyaXB0aW9uJyk7XG59O1xuXG5wZXhwcnMuVGVybWluYWwucHJvdG90eXBlLnRvRmFpbHVyZSA9IGZ1bmN0aW9uKGdyYW1tYXIpIHtcbiAgcmV0dXJuIG5ldyBGYWlsdXJlKHRoaXMsIHRoaXMub2JqLCAnc3RyaW5nJyk7XG59O1xuXG5wZXhwcnMuUmFuZ2UucHJvdG90eXBlLnRvRmFpbHVyZSA9IGZ1bmN0aW9uKGdyYW1tYXIpIHtcbiAgLy8gVE9ETzogY29tZSB1cCB3aXRoIHNvbWV0aGluZyBiZXR0ZXJcbiAgcmV0dXJuIG5ldyBGYWlsdXJlKHRoaXMsIEpTT04uc3RyaW5naWZ5KHRoaXMuZnJvbSkgKyAnLi4nICsgSlNPTi5zdHJpbmdpZnkodGhpcy50byksICdjb2RlJyk7XG59O1xuXG5wZXhwcnMuTm90LnByb3RvdHlwZS50b0ZhaWx1cmUgPSBmdW5jdGlvbihncmFtbWFyKSB7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID1cbiAgICB0aGlzLmV4cHIgPT09IHBleHBycy5hbnkgPyAnbm90aGluZycgOiAnbm90ICcgKyB0aGlzLmV4cHIudG9GYWlsdXJlKGdyYW1tYXIpO1xuICByZXR1cm4gbmV3IEZhaWx1cmUodGhpcywgZGVzY3JpcHRpb24sICdkZXNjcmlwdGlvbicpO1xufTtcblxucGV4cHJzLkxvb2thaGVhZC5wcm90b3R5cGUudG9GYWlsdXJlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICByZXR1cm4gdGhpcy5leHByLnRvRmFpbHVyZShncmFtbWFyKTtcbn07XG5cbnBleHBycy5BcHBseS5wcm90b3R5cGUudG9GYWlsdXJlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICBsZXQge2Rlc2NyaXB0aW9ufSA9IGdyYW1tYXIucnVsZXNbdGhpcy5ydWxlTmFtZV07XG4gIGlmICghZGVzY3JpcHRpb24pIHtcbiAgICBjb25zdCBhcnRpY2xlID0gL15bYWVpb3VBRUlPVV0vLnRlc3QodGhpcy5ydWxlTmFtZSkgPyAnYW4nIDogJ2EnO1xuICAgIGRlc2NyaXB0aW9uID0gYXJ0aWNsZSArICcgJyArIHRoaXMucnVsZU5hbWU7XG4gIH1cbiAgcmV0dXJuIG5ldyBGYWlsdXJlKHRoaXMsIGRlc2NyaXB0aW9uLCAnZGVzY3JpcHRpb24nKTtcbn07XG5cbnBleHBycy5Vbmljb2RlQ2hhci5wcm90b3R5cGUudG9GYWlsdXJlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICByZXR1cm4gbmV3IEZhaWx1cmUodGhpcywgJ2EgVW5pY29kZSBbJyArIHRoaXMuY2F0ZWdvcnkgKyAnXSBjaGFyYWN0ZXInLCAnZGVzY3JpcHRpb24nKTtcbn07XG5cbnBleHBycy5BbHQucHJvdG90eXBlLnRvRmFpbHVyZSA9IGZ1bmN0aW9uKGdyYW1tYXIpIHtcbiAgY29uc3QgZnMgPSB0aGlzLnRlcm1zLm1hcCh0ID0+IHQudG9GYWlsdXJlKGdyYW1tYXIpKTtcbiAgY29uc3QgZGVzY3JpcHRpb24gPSAnKCcgKyBmcy5qb2luKCcgb3IgJykgKyAnKSc7XG4gIHJldHVybiBuZXcgRmFpbHVyZSh0aGlzLCBkZXNjcmlwdGlvbiwgJ2Rlc2NyaXB0aW9uJyk7XG59O1xuXG5wZXhwcnMuU2VxLnByb3RvdHlwZS50b0ZhaWx1cmUgPSBmdW5jdGlvbihncmFtbWFyKSB7XG4gIGNvbnN0IGZzID0gdGhpcy5mYWN0b3JzLm1hcChmID0+IGYudG9GYWlsdXJlKGdyYW1tYXIpKTtcbiAgY29uc3QgZGVzY3JpcHRpb24gPSAnKCcgKyBmcy5qb2luKCcgJykgKyAnKSc7XG4gIHJldHVybiBuZXcgRmFpbHVyZSh0aGlzLCBkZXNjcmlwdGlvbiwgJ2Rlc2NyaXB0aW9uJyk7XG59O1xuXG5wZXhwcnMuSXRlci5wcm90b3R5cGUudG9GYWlsdXJlID0gZnVuY3Rpb24oZ3JhbW1hcikge1xuICBjb25zdCBkZXNjcmlwdGlvbiA9ICcoJyArIHRoaXMuZXhwci50b0ZhaWx1cmUoZ3JhbW1hcikgKyB0aGlzLm9wZXJhdG9yICsgJyknO1xuICByZXR1cm4gbmV3IEZhaWx1cmUodGhpcywgZGVzY3JpcHRpb24sICdkZXNjcmlwdGlvbicpO1xufTtcbiIsImltcG9ydCB7YWJzdHJhY3R9IGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy1tYWluLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIE9wZXJhdGlvbnNcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8qXG4gIGUxLnRvU3RyaW5nKCkgPT09IGUyLnRvU3RyaW5nKCkgPT0+IGUxIGFuZCBlMiBhcmUgc2VtYW50aWNhbGx5IGVxdWl2YWxlbnQuXG4gIE5vdGUgdGhhdCB0aGlzIGlzIG5vdCBhbiBpZmYgKDw9PT4pOiBlLmcuLFxuICAoflwiYlwiIFwiYVwiKS50b1N0cmluZygpICE9PSAoXCJhXCIpLnRvU3RyaW5nKCksIGV2ZW4gdGhvdWdoXG4gIH5cImJcIiBcImFcIiBhbmQgXCJhXCIgYXJlIGludGVyY2hhbmdlYWJsZSBpbiBhbnkgZ3JhbW1hcixcbiAgYm90aCBpbiB0ZXJtcyBvZiB0aGUgbGFuZ3VhZ2VzIHRoZXkgYWNjZXB0IGFuZCB0aGVpciBhcml0aWVzLlxuKi9cbnBleHBycy5QRXhwci5wcm90b3R5cGUudG9TdHJpbmcgPSBhYnN0cmFjdCgndG9TdHJpbmcnKTtcblxucGV4cHJzLmFueS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ2FueSc7XG59O1xuXG5wZXhwcnMuZW5kLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnZW5kJztcbn07XG5cbnBleHBycy5UZXJtaW5hbC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMub2JqKTtcbn07XG5cbnBleHBycy5SYW5nZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KHRoaXMuZnJvbSkgKyAnLi4nICsgSlNPTi5zdHJpbmdpZnkodGhpcy50byk7XG59O1xuXG5wZXhwcnMuUGFyYW0ucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAnJCcgKyB0aGlzLmluZGV4O1xufTtcblxucGV4cHJzLkxleC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICcjKCcgKyB0aGlzLmV4cHIudG9TdHJpbmcoKSArICcpJztcbn07XG5cbnBleHBycy5BbHQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLnRlcm1zLmxlbmd0aCA9PT0gMSA/XG4gICAgdGhpcy50ZXJtc1swXS50b1N0cmluZygpIDpcbiAgICAnKCcgKyB0aGlzLnRlcm1zLm1hcCh0ZXJtID0+IHRlcm0udG9TdHJpbmcoKSkuam9pbignIHwgJykgKyAnKSc7XG59O1xuXG5wZXhwcnMuU2VxLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5mYWN0b3JzLmxlbmd0aCA9PT0gMSA/XG4gICAgdGhpcy5mYWN0b3JzWzBdLnRvU3RyaW5nKCkgOlxuICAgICcoJyArIHRoaXMuZmFjdG9ycy5tYXAoZmFjdG9yID0+IGZhY3Rvci50b1N0cmluZygpKS5qb2luKCcgJykgKyAnKSc7XG59O1xuXG5wZXhwcnMuSXRlci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZXhwciArIHRoaXMub3BlcmF0b3I7XG59O1xuXG5wZXhwcnMuTm90LnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gJ34nICsgdGhpcy5leHByO1xufTtcblxucGV4cHJzLkxvb2thaGVhZC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICcmJyArIHRoaXMuZXhwcjtcbn07XG5cbnBleHBycy5BcHBseS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuYXJncy5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgcHMgPSB0aGlzLmFyZ3MubWFwKGFyZyA9PiBhcmcudG9TdHJpbmcoKSk7XG4gICAgcmV0dXJuIHRoaXMucnVsZU5hbWUgKyAnPCcgKyBwcy5qb2luKCcsJykgKyAnPic7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRoaXMucnVsZU5hbWU7XG4gIH1cbn07XG5cbnBleHBycy5Vbmljb2RlQ2hhci5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICdcXFxccHsnICsgdGhpcy5jYXRlZ29yeSArICd9Jztcbn07XG4iLCJpbXBvcnQge0ZhaWx1cmV9IGZyb20gJy4vRmFpbHVyZS5qcyc7XG5pbXBvcnQge1Rlcm1pbmFsTm9kZX0gZnJvbSAnLi9ub2Rlcy5qcyc7XG5pbXBvcnQge2Fzc2VydH0gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0IHtQRXhwciwgVGVybWluYWx9IGZyb20gJy4vcGV4cHJzLW1haW4uanMnO1xuXG5leHBvcnQgY2xhc3MgQ2FzZUluc2Vuc2l0aXZlVGVybWluYWwgZXh0ZW5kcyBQRXhwciB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLm9iaiA9IHBhcmFtO1xuICB9XG5cbiAgX2dldFN0cmluZyhzdGF0ZSkge1xuICAgIGNvbnN0IHRlcm1pbmFsID0gc3RhdGUuY3VycmVudEFwcGxpY2F0aW9uKCkuYXJnc1t0aGlzLm9iai5pbmRleF07XG4gICAgYXNzZXJ0KHRlcm1pbmFsIGluc3RhbmNlb2YgVGVybWluYWwsICdleHBlY3RlZCBhIFRlcm1pbmFsIGV4cHJlc3Npb24nKTtcbiAgICByZXR1cm4gdGVybWluYWwub2JqO1xuICB9XG5cbiAgLy8gSW1wbGVtZW50YXRpb24gb2YgdGhlIFBFeHByIEFQSVxuXG4gIGFsbG93c1NraXBwaW5nUHJlY2VkaW5nU3BhY2UoKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBldmFsKHN0YXRlKSB7XG4gICAgY29uc3Qge2lucHV0U3RyZWFtfSA9IHN0YXRlO1xuICAgIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gICAgY29uc3QgbWF0Y2hTdHIgPSB0aGlzLl9nZXRTdHJpbmcoc3RhdGUpO1xuICAgIGlmICghaW5wdXRTdHJlYW0ubWF0Y2hTdHJpbmcobWF0Y2hTdHIsIHRydWUpKSB7XG4gICAgICBzdGF0ZS5wcm9jZXNzRmFpbHVyZShvcmlnUG9zLCB0aGlzKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUucHVzaEJpbmRpbmcobmV3IFRlcm1pbmFsTm9kZShtYXRjaFN0ci5sZW5ndGgpLCBvcmlnUG9zKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIGdldEFyaXR5KCkge1xuICAgIHJldHVybiAxO1xuICB9XG5cbiAgc3Vic3RpdHV0ZVBhcmFtcyhhY3R1YWxzKSB7XG4gICAgcmV0dXJuIG5ldyBDYXNlSW5zZW5zaXRpdmVUZXJtaW5hbCh0aGlzLm9iai5zdWJzdGl0dXRlUGFyYW1zKGFjdHVhbHMpKTtcbiAgfVxuXG4gIHRvRGlzcGxheVN0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy5vYmoudG9EaXNwbGF5U3RyaW5nKCkgKyAnIChjYXNlLWluc2Vuc2l0aXZlKSc7XG4gIH1cblxuICB0b0ZhaWx1cmUoZ3JhbW1hcikge1xuICAgIHJldHVybiBuZXcgRmFpbHVyZShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgdGhpcy5vYmoudG9GYWlsdXJlKGdyYW1tYXIpICsgJyAoY2FzZS1pbnNlbnNpdGl2ZSknLFxuICAgICAgICAnZGVzY3JpcHRpb24nLFxuICAgICk7XG4gIH1cblxuICBfaXNOdWxsYWJsZShncmFtbWFyLCBtZW1vKSB7XG4gICAgcmV0dXJuIHRoaXMub2JqLl9pc051bGxhYmxlKGdyYW1tYXIsIG1lbW8pO1xuICB9XG59XG4iLCIvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXh0ZW5zaW9uc1xuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0ICcuL3BleHBycy1hbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlLmpzJztcbmltcG9ydCAnLi9wZXhwcnMtYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQuanMnO1xuaW1wb3J0ICcuL3BleHBycy1hc3NlcnRDaG9pY2VzSGF2ZVVuaWZvcm1Bcml0eS5qcyc7XG5pbXBvcnQgJy4vcGV4cHJzLWFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZS5qcyc7XG5pbXBvcnQgJy4vcGV4cHJzLWV2YWwuanMnO1xuaW1wb3J0ICcuL3BleHBycy1nZXRBcml0eS5qcyc7XG5pbXBvcnQgJy4vcGV4cHJzLW91dHB1dFJlY2lwZS5qcyc7XG5pbXBvcnQgJy4vcGV4cHJzLWludHJvZHVjZVBhcmFtcy5qcyc7XG5pbXBvcnQgJy4vcGV4cHJzLWlzTnVsbGFibGUuanMnO1xuaW1wb3J0ICcuL3BleHBycy1zdWJzdGl0dXRlUGFyYW1zLmpzJztcbmltcG9ydCAnLi9wZXhwcnMtdG9Bcmd1bWVudE5hbWVMaXN0LmpzJztcbmltcG9ydCAnLi9wZXhwcnMtdG9EaXNwbGF5U3RyaW5nLmpzJztcbmltcG9ydCAnLi9wZXhwcnMtdG9GYWlsdXJlLmpzJztcbmltcG9ydCAnLi9wZXhwcnMtdG9TdHJpbmcuanMnO1xuXG5leHBvcnQgKiBmcm9tICcuL3BleHBycy1tYWluLmpzJztcbmV4cG9ydCB7Q2FzZUluc2Vuc2l0aXZlVGVybWluYWx9IGZyb20gJy4vQ2FzZUluc2Vuc2l0aXZlVGVybWluYWwuanMnO1xuIiwiaW1wb3J0IHtJbnB1dFN0cmVhbX0gZnJvbSAnLi9JbnB1dFN0cmVhbS5qcyc7XG5pbXBvcnQge01hdGNoUmVzdWx0fSBmcm9tICcuL01hdGNoUmVzdWx0LmpzJztcbmltcG9ydCB7UG9zSW5mb30gZnJvbSAnLi9Qb3NJbmZvLmpzJztcbmltcG9ydCB7VHJhY2V9IGZyb20gJy4vVHJhY2UuanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLmpzJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmxldCBidWlsdEluQXBwbHlTeW50YWN0aWNCb2R5O1xuXG51dGlsLmF3YWl0QnVpbHRJblJ1bGVzKGJ1aWx0SW5SdWxlcyA9PiB7XG4gIGJ1aWx0SW5BcHBseVN5bnRhY3RpY0JvZHkgPSBidWlsdEluUnVsZXMucnVsZXMuYXBwbHlTeW50YWN0aWMuYm9keTtcbn0pO1xuXG5jb25zdCBhcHBseVNwYWNlcyA9IG5ldyBwZXhwcnMuQXBwbHkoJ3NwYWNlcycpO1xuXG5leHBvcnQgY2xhc3MgTWF0Y2hTdGF0ZSB7XG4gIGNvbnN0cnVjdG9yKG1hdGNoZXIsIHN0YXJ0RXhwciwgb3B0UG9zaXRpb25Ub1JlY29yZEZhaWx1cmVzKSB7XG4gICAgdGhpcy5tYXRjaGVyID0gbWF0Y2hlcjtcbiAgICB0aGlzLnN0YXJ0RXhwciA9IHN0YXJ0RXhwcjtcblxuICAgIHRoaXMuZ3JhbW1hciA9IG1hdGNoZXIuZ3JhbW1hcjtcbiAgICB0aGlzLmlucHV0ID0gbWF0Y2hlci5nZXRJbnB1dCgpO1xuICAgIHRoaXMuaW5wdXRTdHJlYW0gPSBuZXcgSW5wdXRTdHJlYW0odGhpcy5pbnB1dCk7XG4gICAgdGhpcy5tZW1vVGFibGUgPSBtYXRjaGVyLl9tZW1vVGFibGU7XG5cbiAgICB0aGlzLnVzZXJEYXRhID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuZG9Ob3RNZW1vaXplID0gZmFsc2U7XG5cbiAgICB0aGlzLl9iaW5kaW5ncyA9IFtdO1xuICAgIHRoaXMuX2JpbmRpbmdPZmZzZXRzID0gW107XG4gICAgdGhpcy5fYXBwbGljYXRpb25TdGFjayA9IFtdO1xuICAgIHRoaXMuX3Bvc1N0YWNrID0gWzBdO1xuICAgIHRoaXMuaW5MZXhpZmllZENvbnRleHRTdGFjayA9IFtmYWxzZV07XG5cbiAgICB0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbiA9IC0xO1xuICAgIHRoaXMuX3JpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvblN0YWNrID0gW107XG4gICAgdGhpcy5fcmVjb3JkZWRGYWlsdXJlc1N0YWNrID0gW107XG5cbiAgICBpZiAob3B0UG9zaXRpb25Ub1JlY29yZEZhaWx1cmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMucG9zaXRpb25Ub1JlY29yZEZhaWx1cmVzID0gb3B0UG9zaXRpb25Ub1JlY29yZEZhaWx1cmVzO1xuICAgICAgdGhpcy5yZWNvcmRlZEZhaWx1cmVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB9XG4gIH1cblxuICBwb3NUb09mZnNldChwb3MpIHtcbiAgICByZXR1cm4gcG9zIC0gdGhpcy5fcG9zU3RhY2tbdGhpcy5fcG9zU3RhY2subGVuZ3RoIC0gMV07XG4gIH1cblxuICBlbnRlckFwcGxpY2F0aW9uKHBvc0luZm8sIGFwcCkge1xuICAgIHRoaXMuX3Bvc1N0YWNrLnB1c2godGhpcy5pbnB1dFN0cmVhbS5wb3MpO1xuICAgIHRoaXMuX2FwcGxpY2F0aW9uU3RhY2sucHVzaChhcHApO1xuICAgIHRoaXMuaW5MZXhpZmllZENvbnRleHRTdGFjay5wdXNoKGZhbHNlKTtcbiAgICBwb3NJbmZvLmVudGVyKGFwcCk7XG4gICAgdGhpcy5fcmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uU3RhY2sucHVzaCh0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbik7XG4gICAgdGhpcy5yaWdodG1vc3RGYWlsdXJlUG9zaXRpb24gPSAtMTtcbiAgfVxuXG4gIGV4aXRBcHBsaWNhdGlvbihwb3NJbmZvLCBvcHROb2RlKSB7XG4gICAgY29uc3Qgb3JpZ1BvcyA9IHRoaXMuX3Bvc1N0YWNrLnBvcCgpO1xuICAgIHRoaXMuX2FwcGxpY2F0aW9uU3RhY2sucG9wKCk7XG4gICAgdGhpcy5pbkxleGlmaWVkQ29udGV4dFN0YWNrLnBvcCgpO1xuICAgIHBvc0luZm8uZXhpdCgpO1xuXG4gICAgdGhpcy5yaWdodG1vc3RGYWlsdXJlUG9zaXRpb24gPSBNYXRoLm1heChcbiAgICAgICAgdGhpcy5yaWdodG1vc3RGYWlsdXJlUG9zaXRpb24sXG4gICAgICAgIHRoaXMuX3JpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvblN0YWNrLnBvcCgpLFxuICAgICk7XG5cbiAgICBpZiAob3B0Tm9kZSkge1xuICAgICAgdGhpcy5wdXNoQmluZGluZyhvcHROb2RlLCBvcmlnUG9zKTtcbiAgICB9XG4gIH1cblxuICBlbnRlckxleGlmaWVkQ29udGV4dCgpIHtcbiAgICB0aGlzLmluTGV4aWZpZWRDb250ZXh0U3RhY2sucHVzaCh0cnVlKTtcbiAgfVxuXG4gIGV4aXRMZXhpZmllZENvbnRleHQoKSB7XG4gICAgdGhpcy5pbkxleGlmaWVkQ29udGV4dFN0YWNrLnBvcCgpO1xuICB9XG5cbiAgY3VycmVudEFwcGxpY2F0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9hcHBsaWNhdGlvblN0YWNrW3RoaXMuX2FwcGxpY2F0aW9uU3RhY2subGVuZ3RoIC0gMV07XG4gIH1cblxuICBpblN5bnRhY3RpY0NvbnRleHQoKSB7XG4gICAgY29uc3QgY3VycmVudEFwcGxpY2F0aW9uID0gdGhpcy5jdXJyZW50QXBwbGljYXRpb24oKTtcbiAgICBpZiAoY3VycmVudEFwcGxpY2F0aW9uKSB7XG4gICAgICByZXR1cm4gY3VycmVudEFwcGxpY2F0aW9uLmlzU3ludGFjdGljKCkgJiYgIXRoaXMuaW5MZXhpZmllZENvbnRleHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhlIHRvcC1sZXZlbCBjb250ZXh0IGlzIHN5bnRhY3RpYyBpZiB0aGUgc3RhcnQgYXBwbGljYXRpb24gaXMuXG4gICAgICByZXR1cm4gdGhpcy5zdGFydEV4cHIuZmFjdG9yc1swXS5pc1N5bnRhY3RpYygpO1xuICAgIH1cbiAgfVxuXG4gIGluTGV4aWZpZWRDb250ZXh0KCkge1xuICAgIHJldHVybiB0aGlzLmluTGV4aWZpZWRDb250ZXh0U3RhY2tbdGhpcy5pbkxleGlmaWVkQ29udGV4dFN0YWNrLmxlbmd0aCAtIDFdO1xuICB9XG5cbiAgc2tpcFNwYWNlcygpIHtcbiAgICB0aGlzLnB1c2hGYWlsdXJlc0luZm8oKTtcbiAgICB0aGlzLmV2YWwoYXBwbHlTcGFjZXMpO1xuICAgIHRoaXMucG9wQmluZGluZygpO1xuICAgIHRoaXMucG9wRmFpbHVyZXNJbmZvKCk7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXRTdHJlYW0ucG9zO1xuICB9XG5cbiAgc2tpcFNwYWNlc0lmSW5TeW50YWN0aWNDb250ZXh0KCkge1xuICAgIHJldHVybiB0aGlzLmluU3ludGFjdGljQ29udGV4dCgpID8gdGhpcy5za2lwU3BhY2VzKCkgOiB0aGlzLmlucHV0U3RyZWFtLnBvcztcbiAgfVxuXG4gIG1heWJlU2tpcFNwYWNlc0JlZm9yZShleHByKSB7XG4gICAgaWYgKGV4cHIuYWxsb3dzU2tpcHBpbmdQcmVjZWRpbmdTcGFjZSgpICYmIGV4cHIgIT09IGFwcGx5U3BhY2VzKSB7XG4gICAgICByZXR1cm4gdGhpcy5za2lwU3BhY2VzSWZJblN5bnRhY3RpY0NvbnRleHQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuaW5wdXRTdHJlYW0ucG9zO1xuICAgIH1cbiAgfVxuXG4gIHB1c2hCaW5kaW5nKG5vZGUsIG9yaWdQb3MpIHtcbiAgICB0aGlzLl9iaW5kaW5ncy5wdXNoKG5vZGUpO1xuICAgIHRoaXMuX2JpbmRpbmdPZmZzZXRzLnB1c2godGhpcy5wb3NUb09mZnNldChvcmlnUG9zKSk7XG4gIH1cblxuICBwb3BCaW5kaW5nKCkge1xuICAgIHRoaXMuX2JpbmRpbmdzLnBvcCgpO1xuICAgIHRoaXMuX2JpbmRpbmdPZmZzZXRzLnBvcCgpO1xuICB9XG5cbiAgbnVtQmluZGluZ3MoKSB7XG4gICAgcmV0dXJuIHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgfVxuXG4gIHRydW5jYXRlQmluZGluZ3MobmV3TGVuZ3RoKSB7XG4gICAgLy8gWWVzLCB0aGlzIGlzIHRoaXMgcmVhbGx5IGZhc3RlciB0aGFuIHNldHRpbmcgdGhlIGBsZW5ndGhgIHByb3BlcnR5ICh0ZXN0ZWQgd2l0aFxuICAgIC8vIGJpbi9lczViZW5jaCBvbiBOb2RlIHY2LjEuMCkuXG4gICAgLy8gVXBkYXRlIDIwMjEtMTAtMjU6IHN0aWxsIHRydWUgb24gdjE0LjE1LjUg4oCUIGl0J3MgfjIwJSBzcGVlZHVwIG9uIGVzNWJlbmNoLlxuICAgIHdoaWxlICh0aGlzLl9iaW5kaW5ncy5sZW5ndGggPiBuZXdMZW5ndGgpIHtcbiAgICAgIHRoaXMucG9wQmluZGluZygpO1xuICAgIH1cbiAgfVxuXG4gIGdldEN1cnJlbnRQb3NJbmZvKCkge1xuICAgIHJldHVybiB0aGlzLmdldFBvc0luZm8odGhpcy5pbnB1dFN0cmVhbS5wb3MpO1xuICB9XG5cbiAgZ2V0UG9zSW5mbyhwb3MpIHtcbiAgICBsZXQgcG9zSW5mbyA9IHRoaXMubWVtb1RhYmxlW3Bvc107XG4gICAgaWYgKCFwb3NJbmZvKSB7XG4gICAgICBwb3NJbmZvID0gdGhpcy5tZW1vVGFibGVbcG9zXSA9IG5ldyBQb3NJbmZvKCk7XG4gICAgfVxuICAgIHJldHVybiBwb3NJbmZvO1xuICB9XG5cbiAgcHJvY2Vzc0ZhaWx1cmUocG9zLCBleHByKSB7XG4gICAgdGhpcy5yaWdodG1vc3RGYWlsdXJlUG9zaXRpb24gPSBNYXRoLm1heCh0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbiwgcG9zKTtcblxuICAgIGlmICh0aGlzLnJlY29yZGVkRmFpbHVyZXMgJiYgcG9zID09PSB0aGlzLnBvc2l0aW9uVG9SZWNvcmRGYWlsdXJlcykge1xuICAgICAgY29uc3QgYXBwID0gdGhpcy5jdXJyZW50QXBwbGljYXRpb24oKTtcbiAgICAgIGlmIChhcHApIHtcbiAgICAgICAgLy8gU3Vic3RpdHV0ZSBwYXJhbWV0ZXJzIHdpdGggdGhlIGFjdHVhbCBwZXhwcnMgdGhhdCB3ZXJlIHBhc3NlZCB0b1xuICAgICAgICAvLyB0aGUgY3VycmVudCBydWxlLlxuICAgICAgICBleHByID0gZXhwci5zdWJzdGl0dXRlUGFyYW1zKGFwcC5hcmdzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgYnJhbmNoIGlzIG9ubHkgcmVhY2hlZCBmb3IgdGhlIFwiZW5kLWNoZWNrXCIgdGhhdCBpc1xuICAgICAgICAvLyBwZXJmb3JtZWQgYWZ0ZXIgdGhlIHRvcC1sZXZlbCBhcHBsaWNhdGlvbi4gSW4gdGhhdCBjYXNlLFxuICAgICAgICAvLyBleHByID09PSBwZXhwcnMuZW5kIHNvIHRoZXJlIGlzIG5vIG5lZWQgdG8gc3Vic3RpdHV0ZVxuICAgICAgICAvLyBwYXJhbWV0ZXJzLlxuICAgICAgfVxuXG4gICAgICB0aGlzLnJlY29yZEZhaWx1cmUoZXhwci50b0ZhaWx1cmUodGhpcy5ncmFtbWFyKSwgZmFsc2UpO1xuICAgIH1cbiAgfVxuXG4gIHJlY29yZEZhaWx1cmUoZmFpbHVyZSwgc2hvdWxkQ2xvbmVJZk5ldykge1xuICAgIGNvbnN0IGtleSA9IGZhaWx1cmUudG9LZXkoKTtcbiAgICBpZiAoIXRoaXMucmVjb3JkZWRGYWlsdXJlc1trZXldKSB7XG4gICAgICB0aGlzLnJlY29yZGVkRmFpbHVyZXNba2V5XSA9IHNob3VsZENsb25lSWZOZXcgPyBmYWlsdXJlLmNsb25lKCkgOiBmYWlsdXJlO1xuICAgIH0gZWxzZSBpZiAodGhpcy5yZWNvcmRlZEZhaWx1cmVzW2tleV0uaXNGbHVmZnkoKSAmJiAhZmFpbHVyZS5pc0ZsdWZmeSgpKSB7XG4gICAgICB0aGlzLnJlY29yZGVkRmFpbHVyZXNba2V5XS5jbGVhckZsdWZmeSgpO1xuICAgIH1cbiAgfVxuXG4gIHJlY29yZEZhaWx1cmVzKGZhaWx1cmVzLCBzaG91bGRDbG9uZUlmTmV3KSB7XG4gICAgT2JqZWN0LmtleXMoZmFpbHVyZXMpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgIHRoaXMucmVjb3JkRmFpbHVyZShmYWlsdXJlc1trZXldLCBzaG91bGRDbG9uZUlmTmV3KTtcbiAgICB9KTtcbiAgfVxuXG4gIGNsb25lUmVjb3JkZWRGYWlsdXJlcygpIHtcbiAgICBpZiAoIXRoaXMucmVjb3JkZWRGYWlsdXJlcykge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBjb25zdCBhbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIE9iamVjdC5rZXlzKHRoaXMucmVjb3JkZWRGYWlsdXJlcykuZm9yRWFjaChrZXkgPT4ge1xuICAgICAgYW5zW2tleV0gPSB0aGlzLnJlY29yZGVkRmFpbHVyZXNba2V5XS5jbG9uZSgpO1xuICAgIH0pO1xuICAgIHJldHVybiBhbnM7XG4gIH1cblxuICBnZXRSaWdodG1vc3RGYWlsdXJlUG9zaXRpb24oKSB7XG4gICAgcmV0dXJuIHRoaXMucmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uO1xuICB9XG5cbiAgX2dldFJpZ2h0bW9zdEZhaWx1cmVPZmZzZXQoKSB7XG4gICAgcmV0dXJuIHRoaXMucmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uID49IDAgP1xuICAgICAgdGhpcy5wb3NUb09mZnNldCh0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbikgOlxuICAgICAgLTE7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBtZW1vaXplZCB0cmFjZSBlbnRyeSBmb3IgYGV4cHJgIGF0IGBwb3NgLCBpZiBvbmUgZXhpc3RzLCBgbnVsbGAgb3RoZXJ3aXNlLlxuICBnZXRNZW1vaXplZFRyYWNlRW50cnkocG9zLCBleHByKSB7XG4gICAgY29uc3QgcG9zSW5mbyA9IHRoaXMubWVtb1RhYmxlW3Bvc107XG4gICAgaWYgKHBvc0luZm8gJiYgZXhwciBpbnN0YW5jZW9mIHBleHBycy5BcHBseSkge1xuICAgICAgY29uc3QgbWVtb1JlYyA9IHBvc0luZm8ubWVtb1tleHByLnRvTWVtb0tleSgpXTtcbiAgICAgIGlmIChtZW1vUmVjICYmIG1lbW9SZWMudHJhY2VFbnRyeSkge1xuICAgICAgICBjb25zdCBlbnRyeSA9IG1lbW9SZWMudHJhY2VFbnRyeS5jbG9uZVdpdGhFeHByKGV4cHIpO1xuICAgICAgICBlbnRyeS5pc01lbW9pemVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGVudHJ5O1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBuZXcgdHJhY2UgZW50cnksIHdpdGggdGhlIGN1cnJlbnRseSBhY3RpdmUgdHJhY2UgYXJyYXkgYXMgaXRzIGNoaWxkcmVuLlxuICBnZXRUcmFjZUVudHJ5KHBvcywgZXhwciwgc3VjY2VlZGVkLCBiaW5kaW5ncykge1xuICAgIGlmIChleHByIGluc3RhbmNlb2YgcGV4cHJzLkFwcGx5KSB7XG4gICAgICBjb25zdCBhcHAgPSB0aGlzLmN1cnJlbnRBcHBsaWNhdGlvbigpO1xuICAgICAgY29uc3QgYWN0dWFscyA9IGFwcCA/IGFwcC5hcmdzIDogW107XG4gICAgICBleHByID0gZXhwci5zdWJzdGl0dXRlUGFyYW1zKGFjdHVhbHMpO1xuICAgIH1cbiAgICByZXR1cm4gKFxuICAgICAgdGhpcy5nZXRNZW1vaXplZFRyYWNlRW50cnkocG9zLCBleHByKSB8fFxuICAgICAgbmV3IFRyYWNlKHRoaXMuaW5wdXQsIHBvcywgdGhpcy5pbnB1dFN0cmVhbS5wb3MsIGV4cHIsIHN1Y2NlZWRlZCwgYmluZGluZ3MsIHRoaXMudHJhY2UpXG4gICAgKTtcbiAgfVxuXG4gIGlzVHJhY2luZygpIHtcbiAgICByZXR1cm4gISF0aGlzLnRyYWNlO1xuICB9XG5cbiAgaGFzTmVjZXNzYXJ5SW5mbyhtZW1vUmVjKSB7XG4gICAgaWYgKHRoaXMudHJhY2UgJiYgIW1lbW9SZWMudHJhY2VFbnRyeSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChcbiAgICAgIHRoaXMucmVjb3JkZWRGYWlsdXJlcyAmJlxuICAgICAgdGhpcy5pbnB1dFN0cmVhbS5wb3MgKyBtZW1vUmVjLnJpZ2h0bW9zdEZhaWx1cmVPZmZzZXQgPT09IHRoaXMucG9zaXRpb25Ub1JlY29yZEZhaWx1cmVzXG4gICAgKSB7XG4gICAgICByZXR1cm4gISFtZW1vUmVjLmZhaWx1cmVzQXRSaWdodG1vc3RQb3NpdGlvbjtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHVzZU1lbW9pemVkUmVzdWx0KG9yaWdQb3MsIG1lbW9SZWMpIHtcbiAgICBpZiAodGhpcy50cmFjZSkge1xuICAgICAgdGhpcy50cmFjZS5wdXNoKG1lbW9SZWMudHJhY2VFbnRyeSk7XG4gICAgfVxuXG4gICAgY29uc3QgbWVtb1JlY1JpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbiA9XG4gICAgICB0aGlzLmlucHV0U3RyZWFtLnBvcyArIG1lbW9SZWMucmlnaHRtb3N0RmFpbHVyZU9mZnNldDtcbiAgICB0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbiA9IE1hdGgubWF4KFxuICAgICAgICB0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbixcbiAgICAgICAgbWVtb1JlY1JpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbixcbiAgICApO1xuICAgIGlmIChcbiAgICAgIHRoaXMucmVjb3JkZWRGYWlsdXJlcyAmJlxuICAgICAgdGhpcy5wb3NpdGlvblRvUmVjb3JkRmFpbHVyZXMgPT09IG1lbW9SZWNSaWdodG1vc3RGYWlsdXJlUG9zaXRpb24gJiZcbiAgICAgIG1lbW9SZWMuZmFpbHVyZXNBdFJpZ2h0bW9zdFBvc2l0aW9uXG4gICAgKSB7XG4gICAgICB0aGlzLnJlY29yZEZhaWx1cmVzKG1lbW9SZWMuZmFpbHVyZXNBdFJpZ2h0bW9zdFBvc2l0aW9uLCB0cnVlKTtcbiAgICB9XG5cbiAgICB0aGlzLmlucHV0U3RyZWFtLmV4YW1pbmVkTGVuZ3RoID0gTWF0aC5tYXgoXG4gICAgICAgIHRoaXMuaW5wdXRTdHJlYW0uZXhhbWluZWRMZW5ndGgsXG4gICAgICAgIG1lbW9SZWMuZXhhbWluZWRMZW5ndGggKyBvcmlnUG9zLFxuICAgICk7XG5cbiAgICBpZiAobWVtb1JlYy52YWx1ZSkge1xuICAgICAgdGhpcy5pbnB1dFN0cmVhbS5wb3MgKz0gbWVtb1JlYy5tYXRjaExlbmd0aDtcbiAgICAgIHRoaXMucHVzaEJpbmRpbmcobWVtb1JlYy52YWx1ZSwgb3JpZ1Bvcyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gRXZhbHVhdGUgYGV4cHJgIGFuZCByZXR1cm4gYHRydWVgIGlmIGl0IHN1Y2NlZWRlZCwgYGZhbHNlYCBvdGhlcndpc2UuIE9uIHN1Y2Nlc3MsIGBiaW5kaW5nc2BcbiAgLy8gd2lsbCBoYXZlIGBleHByLmdldEFyaXR5KClgIG1vcmUgZWxlbWVudHMgdGhhbiBiZWZvcmUsIGFuZCB0aGUgaW5wdXQgc3RyZWFtJ3MgcG9zaXRpb24gbWF5XG4gIC8vIGhhdmUgaW5jcmVhc2VkLiBPbiBmYWlsdXJlLCBgYmluZGluZ3NgIGFuZCBwb3NpdGlvbiB3aWxsIGJlIHVuY2hhbmdlZC5cbiAgZXZhbChleHByKSB7XG4gICAgY29uc3Qge2lucHV0U3RyZWFtfSA9IHRoaXM7XG4gICAgY29uc3Qgb3JpZ051bUJpbmRpbmdzID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgIGNvbnN0IG9yaWdVc2VyRGF0YSA9IHRoaXMudXNlckRhdGE7XG5cbiAgICBsZXQgb3JpZ1JlY29yZGVkRmFpbHVyZXM7XG4gICAgaWYgKHRoaXMucmVjb3JkZWRGYWlsdXJlcykge1xuICAgICAgb3JpZ1JlY29yZGVkRmFpbHVyZXMgPSB0aGlzLnJlY29yZGVkRmFpbHVyZXM7XG4gICAgICB0aGlzLnJlY29yZGVkRmFpbHVyZXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IG9yaWdQb3MgPSBpbnB1dFN0cmVhbS5wb3M7XG4gICAgY29uc3QgbWVtb1BvcyA9IHRoaXMubWF5YmVTa2lwU3BhY2VzQmVmb3JlKGV4cHIpO1xuXG4gICAgbGV0IG9yaWdUcmFjZTtcbiAgICBpZiAodGhpcy50cmFjZSkge1xuICAgICAgb3JpZ1RyYWNlID0gdGhpcy50cmFjZTtcbiAgICAgIHRoaXMudHJhY2UgPSBbXTtcbiAgICB9XG5cbiAgICAvLyBEbyB0aGUgYWN0dWFsIGV2YWx1YXRpb24uXG4gICAgY29uc3QgYW5zID0gZXhwci5ldmFsKHRoaXMpO1xuXG4gICAgaWYgKHRoaXMudHJhY2UpIHtcbiAgICAgIGNvbnN0IGJpbmRpbmdzID0gdGhpcy5fYmluZGluZ3Muc2xpY2Uob3JpZ051bUJpbmRpbmdzKTtcbiAgICAgIGNvbnN0IHRyYWNlRW50cnkgPSB0aGlzLmdldFRyYWNlRW50cnkobWVtb1BvcywgZXhwciwgYW5zLCBiaW5kaW5ncyk7XG4gICAgICB0cmFjZUVudHJ5LmlzSW1wbGljaXRTcGFjZXMgPSBleHByID09PSBhcHBseVNwYWNlcztcbiAgICAgIHRyYWNlRW50cnkuaXNSb290Tm9kZSA9IGV4cHIgPT09IHRoaXMuc3RhcnRFeHByO1xuICAgICAgb3JpZ1RyYWNlLnB1c2godHJhY2VFbnRyeSk7XG4gICAgICB0aGlzLnRyYWNlID0gb3JpZ1RyYWNlO1xuICAgIH1cblxuICAgIGlmIChhbnMpIHtcbiAgICAgIGlmICh0aGlzLnJlY29yZGVkRmFpbHVyZXMgJiYgaW5wdXRTdHJlYW0ucG9zID09PSB0aGlzLnBvc2l0aW9uVG9SZWNvcmRGYWlsdXJlcykge1xuICAgICAgICBPYmplY3Qua2V5cyh0aGlzLnJlY29yZGVkRmFpbHVyZXMpLmZvckVhY2goa2V5ID0+IHtcbiAgICAgICAgICB0aGlzLnJlY29yZGVkRmFpbHVyZXNba2V5XS5tYWtlRmx1ZmZ5KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBSZXNldCB0aGUgcG9zaXRpb24sIGJpbmRpbmdzLCBhbmQgdXNlckRhdGEuXG4gICAgICBpbnB1dFN0cmVhbS5wb3MgPSBvcmlnUG9zO1xuICAgICAgdGhpcy50cnVuY2F0ZUJpbmRpbmdzKG9yaWdOdW1CaW5kaW5ncyk7XG4gICAgICB0aGlzLnVzZXJEYXRhID0gb3JpZ1VzZXJEYXRhO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnJlY29yZGVkRmFpbHVyZXMpIHtcbiAgICAgIHRoaXMucmVjb3JkRmFpbHVyZXMob3JpZ1JlY29yZGVkRmFpbHVyZXMsIGZhbHNlKTtcbiAgICB9XG5cbiAgICAvLyBUaGUgYnVpbHQtaW4gYXBwbHlTeW50YWN0aWMgcnVsZSBuZWVkcyBzcGVjaWFsIGhhbmRsaW5nOiB3ZSB3YW50IHRvIHNraXBcbiAgICAvLyB0cmFpbGluZyBzcGFjZXMsIGp1c3QgYXMgd2l0aCB0aGUgdG9wLWxldmVsIGFwcGxpY2F0aW9uIG9mIGEgc3ludGFjdGljIHJ1bGUuXG4gICAgaWYgKGV4cHIgPT09IGJ1aWx0SW5BcHBseVN5bnRhY3RpY0JvZHkpIHtcbiAgICAgIHRoaXMuc2tpcFNwYWNlcygpO1xuICAgIH1cblxuICAgIHJldHVybiBhbnM7XG4gIH1cblxuICBnZXRNYXRjaFJlc3VsdCgpIHtcbiAgICB0aGlzLmdyYW1tYXIuX3NldFVwTWF0Y2hTdGF0ZSh0aGlzKTtcbiAgICB0aGlzLmV2YWwodGhpcy5zdGFydEV4cHIpO1xuICAgIGxldCByaWdodG1vc3RGYWlsdXJlcztcbiAgICBpZiAodGhpcy5yZWNvcmRlZEZhaWx1cmVzKSB7XG4gICAgICByaWdodG1vc3RGYWlsdXJlcyA9IE9iamVjdC5rZXlzKHRoaXMucmVjb3JkZWRGYWlsdXJlcykubWFwKFxuICAgICAgICAgIGtleSA9PiB0aGlzLnJlY29yZGVkRmFpbHVyZXNba2V5XSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGNzdCA9IHRoaXMuX2JpbmRpbmdzWzBdO1xuICAgIGlmIChjc3QpIHtcbiAgICAgIGNzdC5ncmFtbWFyID0gdGhpcy5ncmFtbWFyO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IE1hdGNoUmVzdWx0KFxuICAgICAgICB0aGlzLm1hdGNoZXIsXG4gICAgICAgIHRoaXMuaW5wdXQsXG4gICAgICAgIHRoaXMuc3RhcnRFeHByLFxuICAgICAgICBjc3QsXG4gICAgICAgIHRoaXMuX2JpbmRpbmdPZmZzZXRzWzBdLFxuICAgICAgICB0aGlzLnJpZ2h0bW9zdEZhaWx1cmVQb3NpdGlvbixcbiAgICAgICAgcmlnaHRtb3N0RmFpbHVyZXMsXG4gICAgKTtcbiAgfVxuXG4gIGdldFRyYWNlKCkge1xuICAgIHRoaXMudHJhY2UgPSBbXTtcbiAgICBjb25zdCBtYXRjaFJlc3VsdCA9IHRoaXMuZ2V0TWF0Y2hSZXN1bHQoKTtcblxuICAgIC8vIFRoZSB0cmFjZSBub2RlIGZvciB0aGUgc3RhcnQgcnVsZSBpcyBhbHdheXMgdGhlIGxhc3QgZW50cnkuIElmIGl0IGlzIGEgc3ludGFjdGljIHJ1bGUsXG4gICAgLy8gdGhlIGZpcnN0IGVudHJ5IGlzIGZvciBhbiBhcHBsaWNhdGlvbiBvZiAnc3BhY2VzJy5cbiAgICAvLyBUT0RPKHBkdWJyb3kpOiBDbGVhbiB0aGlzIHVwIGJ5IGludHJvZHVjaW5nIGEgc3BlY2lhbCBgTWF0Y2g8c3RhcnRBcHBsPmAgcnVsZSwgd2hpY2ggd2lsbFxuICAgIC8vIGVuc3VyZSB0aGF0IHRoZXJlIGlzIGFsd2F5cyBhIHNpbmdsZSByb290IHRyYWNlIG5vZGUuXG4gICAgY29uc3Qgcm9vdFRyYWNlID0gdGhpcy50cmFjZVt0aGlzLnRyYWNlLmxlbmd0aCAtIDFdO1xuICAgIHJvb3RUcmFjZS5yZXN1bHQgPSBtYXRjaFJlc3VsdDtcbiAgICByZXR1cm4gcm9vdFRyYWNlO1xuICB9XG5cbiAgcHVzaEZhaWx1cmVzSW5mbygpIHtcbiAgICB0aGlzLl9yaWdodG1vc3RGYWlsdXJlUG9zaXRpb25TdGFjay5wdXNoKHRoaXMucmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uKTtcbiAgICB0aGlzLl9yZWNvcmRlZEZhaWx1cmVzU3RhY2sucHVzaCh0aGlzLnJlY29yZGVkRmFpbHVyZXMpO1xuICB9XG5cbiAgcG9wRmFpbHVyZXNJbmZvKCkge1xuICAgIHRoaXMucmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uID0gdGhpcy5fcmlnaHRtb3N0RmFpbHVyZVBvc2l0aW9uU3RhY2sucG9wKCk7XG4gICAgdGhpcy5yZWNvcmRlZEZhaWx1cmVzID0gdGhpcy5fcmVjb3JkZWRGYWlsdXJlc1N0YWNrLnBvcCgpO1xuICB9XG59XG4iLCJpbXBvcnQge2dyYW1tYXJEb2VzTm90U3VwcG9ydEluY3JlbWVudGFsUGFyc2luZ30gZnJvbSAnLi9lcnJvcnMuanMnO1xuaW1wb3J0IHtNYXRjaFN0YXRlfSBmcm9tICcuL01hdGNoU3RhdGUuanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLmpzJztcblxuZXhwb3J0IGNsYXNzIE1hdGNoZXIge1xuICBjb25zdHJ1Y3RvcihncmFtbWFyKSB7XG4gICAgdGhpcy5ncmFtbWFyID0gZ3JhbW1hcjtcbiAgICB0aGlzLl9tZW1vVGFibGUgPSBbXTtcbiAgICB0aGlzLl9pbnB1dCA9ICcnO1xuICAgIHRoaXMuX2lzTWVtb1RhYmxlU3RhbGUgPSBmYWxzZTtcbiAgfVxuXG4gIF9yZXNldE1lbW9UYWJsZSgpIHtcbiAgICB0aGlzLl9tZW1vVGFibGUgPSBbXTtcbiAgICB0aGlzLl9pc01lbW9UYWJsZVN0YWxlID0gZmFsc2U7XG4gIH1cblxuICBnZXRJbnB1dCgpIHtcbiAgICByZXR1cm4gdGhpcy5faW5wdXQ7XG4gIH1cblxuICBzZXRJbnB1dChzdHIpIHtcbiAgICBpZiAodGhpcy5faW5wdXQgIT09IHN0cikge1xuICAgICAgdGhpcy5yZXBsYWNlSW5wdXRSYW5nZSgwLCB0aGlzLl9pbnB1dC5sZW5ndGgsIHN0cik7XG4gICAgfVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgcmVwbGFjZUlucHV0UmFuZ2Uoc3RhcnRJZHgsIGVuZElkeCwgc3RyKSB7XG4gICAgY29uc3QgcHJldklucHV0ID0gdGhpcy5faW5wdXQ7XG4gICAgY29uc3QgbWVtb1RhYmxlID0gdGhpcy5fbWVtb1RhYmxlO1xuICAgIGlmIChcbiAgICAgIHN0YXJ0SWR4IDwgMCB8fFxuICAgICAgc3RhcnRJZHggPiBwcmV2SW5wdXQubGVuZ3RoIHx8XG4gICAgICBlbmRJZHggPCAwIHx8XG4gICAgICBlbmRJZHggPiBwcmV2SW5wdXQubGVuZ3RoIHx8XG4gICAgICBzdGFydElkeCA+IGVuZElkeFxuICAgICkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGluZGljZXM6ICcgKyBzdGFydElkeCArICcgYW5kICcgKyBlbmRJZHgpO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBpbnB1dFxuICAgIHRoaXMuX2lucHV0ID0gcHJldklucHV0LnNsaWNlKDAsIHN0YXJ0SWR4KSArIHN0ciArIHByZXZJbnB1dC5zbGljZShlbmRJZHgpO1xuICAgIGlmICh0aGlzLl9pbnB1dCAhPT0gcHJldklucHV0ICYmIG1lbW9UYWJsZS5sZW5ndGggPiAwKSB7XG4gICAgICB0aGlzLl9pc01lbW9UYWJsZVN0YWxlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgbWVtbyB0YWJsZSAoc2ltaWxhciB0byB0aGUgYWJvdmUpXG4gICAgY29uc3QgcmVzdE9mTWVtb1RhYmxlID0gbWVtb1RhYmxlLnNsaWNlKGVuZElkeCk7XG4gICAgbWVtb1RhYmxlLmxlbmd0aCA9IHN0YXJ0SWR4O1xuICAgIGZvciAobGV0IGlkeCA9IDA7IGlkeCA8IHN0ci5sZW5ndGg7IGlkeCsrKSB7XG4gICAgICBtZW1vVGFibGUucHVzaCh1bmRlZmluZWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHBvc0luZm8gb2YgcmVzdE9mTWVtb1RhYmxlKSB7XG4gICAgICBtZW1vVGFibGUucHVzaChwb3NJbmZvKTtcbiAgICB9XG5cbiAgICAvLyBJbnZhbGlkYXRlIG1lbW9SZWNzXG4gICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgc3RhcnRJZHg7IHBvcysrKSB7XG4gICAgICBjb25zdCBwb3NJbmZvID0gbWVtb1RhYmxlW3Bvc107XG4gICAgICBpZiAocG9zSW5mbykge1xuICAgICAgICBwb3NJbmZvLmNsZWFyT2Jzb2xldGVFbnRyaWVzKHBvcywgc3RhcnRJZHgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbWF0Y2gob3B0U3RhcnRBcHBsaWNhdGlvblN0ciwgb3B0aW9ucyA9IHtpbmNyZW1lbnRhbDogdHJ1ZX0pIHtcbiAgICByZXR1cm4gdGhpcy5fbWF0Y2godGhpcy5fZ2V0U3RhcnRFeHByKG9wdFN0YXJ0QXBwbGljYXRpb25TdHIpLCB7XG4gICAgICBpbmNyZW1lbnRhbDogb3B0aW9ucy5pbmNyZW1lbnRhbCxcbiAgICAgIHRyYWNpbmc6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgdHJhY2Uob3B0U3RhcnRBcHBsaWNhdGlvblN0ciwgb3B0aW9ucyA9IHtpbmNyZW1lbnRhbDogdHJ1ZX0pIHtcbiAgICByZXR1cm4gdGhpcy5fbWF0Y2godGhpcy5fZ2V0U3RhcnRFeHByKG9wdFN0YXJ0QXBwbGljYXRpb25TdHIpLCB7XG4gICAgICBpbmNyZW1lbnRhbDogb3B0aW9ucy5pbmNyZW1lbnRhbCxcbiAgICAgIHRyYWNpbmc6IHRydWUsXG4gICAgfSk7XG4gIH1cblxuICBfbWF0Y2goc3RhcnRFeHByLCBvcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBvcHRzID0ge1xuICAgICAgdHJhY2luZzogZmFsc2UsXG4gICAgICBpbmNyZW1lbnRhbDogdHJ1ZSxcbiAgICAgIHBvc2l0aW9uVG9SZWNvcmRGYWlsdXJlczogdW5kZWZpbmVkLFxuICAgICAgLi4ub3B0aW9ucyxcbiAgICB9O1xuICAgIGlmICghb3B0cy5pbmNyZW1lbnRhbCkge1xuICAgICAgdGhpcy5fcmVzZXRNZW1vVGFibGUoKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuX2lzTWVtb1RhYmxlU3RhbGUgJiYgIXRoaXMuZ3JhbW1hci5zdXBwb3J0c0luY3JlbWVudGFsUGFyc2luZykge1xuICAgICAgdGhyb3cgZ3JhbW1hckRvZXNOb3RTdXBwb3J0SW5jcmVtZW50YWxQYXJzaW5nKHRoaXMuZ3JhbW1hcik7XG4gICAgfVxuXG4gICAgY29uc3Qgc3RhdGUgPSBuZXcgTWF0Y2hTdGF0ZSh0aGlzLCBzdGFydEV4cHIsIG9wdHMucG9zaXRpb25Ub1JlY29yZEZhaWx1cmVzKTtcbiAgICByZXR1cm4gb3B0cy50cmFjaW5nID8gc3RhdGUuZ2V0VHJhY2UoKSA6IHN0YXRlLmdldE1hdGNoUmVzdWx0KCk7XG4gIH1cblxuICAvKlxuICAgIFJldHVybnMgdGhlIHN0YXJ0aW5nIGV4cHJlc3Npb24gZm9yIHRoaXMgTWF0Y2hlcidzIGFzc29jaWF0ZWQgZ3JhbW1hci4gSWZcbiAgICBgb3B0U3RhcnRBcHBsaWNhdGlvblN0cmAgaXMgc3BlY2lmaWVkLCBpdCBpcyBhIHN0cmluZyBleHByZXNzaW5nIGEgcnVsZSBhcHBsaWNhdGlvbiBpbiB0aGVcbiAgICBncmFtbWFyLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgZ3JhbW1hcidzIGRlZmF1bHQgc3RhcnQgcnVsZSB3aWxsIGJlIHVzZWQuXG4gICovXG4gIF9nZXRTdGFydEV4cHIob3B0U3RhcnRBcHBsaWNhdGlvblN0cikge1xuICAgIGNvbnN0IGFwcGxpY2F0aW9uU3RyID0gb3B0U3RhcnRBcHBsaWNhdGlvblN0ciB8fCB0aGlzLmdyYW1tYXIuZGVmYXVsdFN0YXJ0UnVsZTtcbiAgICBpZiAoIWFwcGxpY2F0aW9uU3RyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3Npbmcgc3RhcnQgcnVsZSBhcmd1bWVudCAtLSB0aGUgZ3JhbW1hciBoYXMgbm8gZGVmYXVsdCBzdGFydCBydWxlLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXJ0QXBwID0gdGhpcy5ncmFtbWFyLnBhcnNlQXBwbGljYXRpb24oYXBwbGljYXRpb25TdHIpO1xuICAgIHJldHVybiBuZXcgcGV4cHJzLlNlcShbc3RhcnRBcHAsIHBleHBycy5lbmRdKTtcbiAgfVxufVxuIiwiaW1wb3J0IHtJbnB1dFN0cmVhbX0gZnJvbSAnLi9JbnB1dFN0cmVhbS5qcyc7XG5pbXBvcnQge0l0ZXJhdGlvbk5vZGV9IGZyb20gJy4vbm9kZXMuanMnO1xuaW1wb3J0IHtNYXRjaFJlc3VsdH0gZnJvbSAnLi9NYXRjaFJlc3VsdC5qcyc7XG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzLmpzJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmNvbnN0IGdsb2JhbEFjdGlvblN0YWNrID0gW107XG5cbmNvbnN0IGhhc093blByb3BlcnR5ID0gKHgsIHByb3ApID0+IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbCh4LCBwcm9wKTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0gV3JhcHBlcnMgLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gV3JhcHBlcnMgZGVjb3JhdGUgQ1NUIG5vZGVzIHdpdGggYWxsIG9mIHRoZSBmdW5jdGlvbmFsaXR5IChpLmUuLCBvcGVyYXRpb25zIGFuZCBhdHRyaWJ1dGVzKVxuLy8gcHJvdmlkZWQgYnkgYSBTZW1hbnRpY3MgKHNlZSBiZWxvdykuIGBXcmFwcGVyYCBpcyB0aGUgYWJzdHJhY3Qgc3VwZXJjbGFzcyBvZiBhbGwgd3JhcHBlcnMuIEFcbi8vIGBXcmFwcGVyYCBtdXN0IGhhdmUgYF9ub2RlYCBhbmQgYF9zZW1hbnRpY3NgIGluc3RhbmNlIHZhcmlhYmxlcywgd2hpY2ggcmVmZXIgdG8gdGhlIENTVCBub2RlIGFuZFxuLy8gU2VtYW50aWNzIChyZXNwLikgZm9yIHdoaWNoIGl0IHdhcyBjcmVhdGVkLCBhbmQgYSBgX2NoaWxkV3JhcHBlcnNgIGluc3RhbmNlIHZhcmlhYmxlIHdoaWNoIGlzXG4vLyB1c2VkIHRvIGNhY2hlIHRoZSB3cmFwcGVyIGluc3RhbmNlcyB0aGF0IGFyZSBjcmVhdGVkIGZvciBpdHMgY2hpbGQgbm9kZXMuIFNldHRpbmcgdGhlc2UgaW5zdGFuY2Vcbi8vIHZhcmlhYmxlcyBpcyB0aGUgcmVzcG9uc2liaWxpdHkgb2YgdGhlIGNvbnN0cnVjdG9yIG9mIGVhY2ggU2VtYW50aWNzLXNwZWNpZmljIHN1YmNsYXNzIG9mXG4vLyBgV3JhcHBlcmAuXG5jbGFzcyBXcmFwcGVyIHtcbiAgY29uc3RydWN0b3Iobm9kZSwgc291cmNlSW50ZXJ2YWwsIGJhc2VJbnRlcnZhbCkge1xuICAgIHRoaXMuX25vZGUgPSBub2RlO1xuICAgIHRoaXMuc291cmNlID0gc291cmNlSW50ZXJ2YWw7XG5cbiAgICAvLyBUaGUgaW50ZXJ2YWwgdGhhdCB0aGUgY2hpbGRPZmZzZXRzIG9mIGBub2RlYCBhcmUgcmVsYXRpdmUgdG8uIEl0IHNob3VsZCBiZSB0aGUgc291cmNlXG4gICAgLy8gb2YgdGhlIGNsb3Nlc3QgTm9udGVybWluYWwgbm9kZS5cbiAgICB0aGlzLl9iYXNlSW50ZXJ2YWwgPSBiYXNlSW50ZXJ2YWw7XG5cbiAgICBpZiAobm9kZS5pc05vbnRlcm1pbmFsKCkpIHtcbiAgICAgIGNvbW1vbi5hc3NlcnQoc291cmNlSW50ZXJ2YWwgPT09IGJhc2VJbnRlcnZhbCk7XG4gICAgfVxuICAgIHRoaXMuX2NoaWxkV3JhcHBlcnMgPSBbXTtcbiAgfVxuXG4gIF9mb3JnZXRNZW1vaXplZFJlc3VsdEZvcihhdHRyaWJ1dGVOYW1lKSB7XG4gICAgLy8gUmVtb3ZlIHRoZSBtZW1vaXplZCBhdHRyaWJ1dGUgZnJvbSB0aGUgY3N0Tm9kZSBhbmQgYWxsIGl0cyBjaGlsZHJlbi5cbiAgICBkZWxldGUgdGhpcy5fbm9kZVt0aGlzLl9zZW1hbnRpY3MuYXR0cmlidXRlS2V5c1thdHRyaWJ1dGVOYW1lXV07XG4gICAgdGhpcy5jaGlsZHJlbi5mb3JFYWNoKGNoaWxkID0+IHtcbiAgICAgIGNoaWxkLl9mb3JnZXRNZW1vaXplZFJlc3VsdEZvcihhdHRyaWJ1dGVOYW1lKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIHdyYXBwZXIgb2YgdGhlIHNwZWNpZmllZCBjaGlsZCBub2RlLiBDaGlsZCB3cmFwcGVycyBhcmUgY3JlYXRlZCBsYXppbHkgYW5kXG4gIC8vIGNhY2hlZCBpbiB0aGUgcGFyZW50IHdyYXBwZXIncyBgX2NoaWxkV3JhcHBlcnNgIGluc3RhbmNlIHZhcmlhYmxlLlxuICBjaGlsZChpZHgpIHtcbiAgICBpZiAoISgwIDw9IGlkeCAmJiBpZHggPCB0aGlzLl9ub2RlLm51bUNoaWxkcmVuKCkpKSB7XG4gICAgICAvLyBUT0RPOiBDb25zaWRlciB0aHJvd2luZyBhbiBleGNlcHRpb24gaGVyZS5cbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGxldCBjaGlsZFdyYXBwZXIgPSB0aGlzLl9jaGlsZFdyYXBwZXJzW2lkeF07XG4gICAgaWYgKCFjaGlsZFdyYXBwZXIpIHtcbiAgICAgIGNvbnN0IGNoaWxkTm9kZSA9IHRoaXMuX25vZGUuY2hpbGRBdChpZHgpO1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gdGhpcy5fbm9kZS5jaGlsZE9mZnNldHNbaWR4XTtcblxuICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5fYmFzZUludGVydmFsLnN1YkludGVydmFsKG9mZnNldCwgY2hpbGROb2RlLm1hdGNoTGVuZ3RoKTtcbiAgICAgIGNvbnN0IGJhc2UgPSBjaGlsZE5vZGUuaXNOb250ZXJtaW5hbCgpID8gc291cmNlIDogdGhpcy5fYmFzZUludGVydmFsO1xuICAgICAgY2hpbGRXcmFwcGVyID0gdGhpcy5fY2hpbGRXcmFwcGVyc1tpZHhdID0gdGhpcy5fc2VtYW50aWNzLndyYXAoY2hpbGROb2RlLCBzb3VyY2UsIGJhc2UpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRXcmFwcGVyO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhbiBhcnJheSBjb250YWluaW5nIHRoZSB3cmFwcGVycyBvZiBhbGwgb2YgdGhlIGNoaWxkcmVuIG9mIHRoZSBub2RlIGFzc29jaWF0ZWRcbiAgLy8gd2l0aCB0aGlzIHdyYXBwZXIuXG4gIF9jaGlsZHJlbigpIHtcbiAgICAvLyBGb3JjZSB0aGUgY3JlYXRpb24gb2YgYWxsIGNoaWxkIHdyYXBwZXJzXG4gICAgZm9yIChsZXQgaWR4ID0gMDsgaWR4IDwgdGhpcy5fbm9kZS5udW1DaGlsZHJlbigpOyBpZHgrKykge1xuICAgICAgdGhpcy5jaGlsZChpZHgpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fY2hpbGRXcmFwcGVycztcbiAgfVxuXG4gIC8vIFJldHVybnMgYHRydWVgIGlmIHRoZSBDU1Qgbm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyB3cmFwcGVyIGNvcnJlc3BvbmRzIHRvIGFuIGl0ZXJhdGlvblxuICAvLyBleHByZXNzaW9uLCBpLmUuLCBhIEtsZWVuZS0qLCBLbGVlbmUtKywgb3IgYW4gb3B0aW9uYWwuIFJldHVybnMgYGZhbHNlYCBvdGhlcndpc2UuXG4gIGlzSXRlcmF0aW9uKCkge1xuICAgIHJldHVybiB0aGlzLl9ub2RlLmlzSXRlcmF0aW9uKCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgQ1NUIG5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgd3JhcHBlciBpcyBhIHRlcm1pbmFsIG5vZGUsIGBmYWxzZWBcbiAgLy8gb3RoZXJ3aXNlLlxuICBpc1Rlcm1pbmFsKCkge1xuICAgIHJldHVybiB0aGlzLl9ub2RlLmlzVGVybWluYWwoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYHRydWVgIGlmIHRoZSBDU1Qgbm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyB3cmFwcGVyIGlzIGEgbm9udGVybWluYWwgbm9kZSwgYGZhbHNlYFxuICAvLyBvdGhlcndpc2UuXG4gIGlzTm9udGVybWluYWwoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vZGUuaXNOb250ZXJtaW5hbCgpO1xuICB9XG5cbiAgLy8gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIENTVCBub2RlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHdyYXBwZXIgaXMgYSBub250ZXJtaW5hbCBub2RlXG4gIC8vIGNvcnJlc3BvbmRpbmcgdG8gYSBzeW50YWN0aWMgcnVsZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gIGlzU3ludGFjdGljKCkge1xuICAgIHJldHVybiB0aGlzLmlzTm9udGVybWluYWwoKSAmJiB0aGlzLl9ub2RlLmlzU3ludGFjdGljKCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIGB0cnVlYCBpZiB0aGUgQ1NUIG5vZGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgd3JhcHBlciBpcyBhIG5vbnRlcm1pbmFsIG5vZGVcbiAgLy8gY29ycmVzcG9uZGluZyB0byBhIGxleGljYWwgcnVsZSwgYGZhbHNlYCBvdGhlcndpc2UuXG4gIGlzTGV4aWNhbCgpIHtcbiAgICByZXR1cm4gdGhpcy5pc05vbnRlcm1pbmFsKCkgJiYgdGhpcy5fbm9kZS5pc0xleGljYWwoKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgYHRydWVgIGlmIHRoZSBDU1Qgbm9kZSBhc3NvY2lhdGVkIHdpdGggdGhpcyB3cmFwcGVyIGlzIGFuIGl0ZXJhdG9yIG5vZGVcbiAgLy8gaGF2aW5nIGVpdGhlciBvbmUgb3Igbm8gY2hpbGQgKD8gb3BlcmF0b3IpLCBgZmFsc2VgIG90aGVyd2lzZS5cbiAgLy8gT3RoZXJ3aXNlLCB0aHJvd3MgYW4gZXhjZXB0aW9uLlxuICBpc09wdGlvbmFsKCkge1xuICAgIHJldHVybiB0aGlzLl9ub2RlLmlzT3B0aW9uYWwoKTtcbiAgfVxuXG4gIC8vIENyZWF0ZSBhIG5ldyBfaXRlciB3cmFwcGVyIGluIHRoZSBzYW1lIHNlbWFudGljcyBhcyB0aGlzIHdyYXBwZXIuXG4gIGl0ZXJhdGlvbihvcHRDaGlsZFdyYXBwZXJzKSB7XG4gICAgY29uc3QgY2hpbGRXcmFwcGVycyA9IG9wdENoaWxkV3JhcHBlcnMgfHwgW107XG5cbiAgICBjb25zdCBjaGlsZE5vZGVzID0gY2hpbGRXcmFwcGVycy5tYXAoYyA9PiBjLl9ub2RlKTtcbiAgICBjb25zdCBpdGVyID0gbmV3IEl0ZXJhdGlvbk5vZGUoY2hpbGROb2RlcywgW10sIC0xLCBmYWxzZSk7XG5cbiAgICBjb25zdCB3cmFwcGVyID0gdGhpcy5fc2VtYW50aWNzLndyYXAoaXRlciwgbnVsbCwgbnVsbCk7XG4gICAgd3JhcHBlci5fY2hpbGRXcmFwcGVycyA9IGNoaWxkV3JhcHBlcnM7XG4gICAgcmV0dXJuIHdyYXBwZXI7XG4gIH1cblxuICAvLyBSZXR1cm5zIGFuIGFycmF5IGNvbnRhaW5pbmcgdGhlIGNoaWxkcmVuIG9mIHRoaXMgQ1NUIG5vZGUuXG4gIGdldCBjaGlsZHJlbigpIHtcbiAgICByZXR1cm4gdGhpcy5fY2hpbGRyZW4oKTtcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIG5hbWUgb2YgZ3JhbW1hciBydWxlIHRoYXQgY3JlYXRlZCB0aGlzIENTVCBub2RlLlxuICBnZXQgY3Rvck5hbWUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX25vZGUuY3Rvck5hbWU7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBudW1iZXIgb2YgY2hpbGRyZW4gb2YgdGhpcyBDU1Qgbm9kZS5cbiAgZ2V0IG51bUNoaWxkcmVuKCkge1xuICAgIHJldHVybiB0aGlzLl9ub2RlLm51bUNoaWxkcmVuKCk7XG4gIH1cblxuICAvLyBSZXR1cm5zIHRoZSBjb250ZW50cyBvZiB0aGUgaW5wdXQgc3RyZWFtIGNvbnN1bWVkIGJ5IHRoaXMgQ1NUIG5vZGUuXG4gIGdldCBzb3VyY2VTdHJpbmcoKSB7XG4gICAgcmV0dXJuIHRoaXMuc291cmNlLmNvbnRlbnRzO1xuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tIFNlbWFudGljcyAtLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBBIFNlbWFudGljcyBpcyBhIGNvbnRhaW5lciBmb3IgYSBmYW1pbHkgb2YgT3BlcmF0aW9ucyBhbmQgQXR0cmlidXRlcyBmb3IgYSBnaXZlbiBncmFtbWFyLlxuLy8gU2VtYW50aWNzIGVuYWJsZSBtb2R1bGFyaXR5IChkaWZmZXJlbnQgY2xpZW50cyBvZiBhIGdyYW1tYXIgY2FuIGNyZWF0ZSB0aGVpciBzZXQgb2Ygb3BlcmF0aW9uc1xuLy8gYW5kIGF0dHJpYnV0ZXMgaW4gaXNvbGF0aW9uKSBhbmQgZXh0ZW5zaWJpbGl0eSBldmVuIHdoZW4gb3BlcmF0aW9ucyBhbmQgYXR0cmlidXRlcyBhcmUgbXV0dWFsbHktXG4vLyByZWN1cnNpdmUuIFRoaXMgY29uc3RydWN0b3Igc2hvdWxkIG5vdCBiZSBjYWxsZWQgZGlyZWN0bHkgZXhjZXB0IGZyb21cbi8vIGBTZW1hbnRpY3MuY3JlYXRlU2VtYW50aWNzYC4gVGhlIG5vcm1hbCB3YXlzIHRvIGNyZWF0ZSBhIFNlbWFudGljcywgZ2l2ZW4gYSBncmFtbWFyICdnJywgYXJlXG4vLyBgZy5jcmVhdGVTZW1hbnRpY3MoKWAgYW5kIGBnLmV4dGVuZFNlbWFudGljcyhwYXJlbnRTZW1hbnRpY3MpYC5cbmV4cG9ydCBjbGFzcyBTZW1hbnRpY3Mge1xuICBjb25zdHJ1Y3RvcihncmFtbWFyLCBzdXBlclNlbWFudGljcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuZ3JhbW1hciA9IGdyYW1tYXI7XG4gICAgdGhpcy5jaGVja2VkQWN0aW9uRGljdHMgPSBmYWxzZTtcblxuICAgIC8vIENvbnN0cnVjdG9yIGZvciB3cmFwcGVyIGluc3RhbmNlcywgd2hpY2ggYXJlIHBhc3NlZCBhcyB0aGUgYXJndW1lbnRzIHRvIHRoZSBzZW1hbnRpYyBhY3Rpb25zXG4gICAgLy8gb2YgYW4gb3BlcmF0aW9uIG9yIGF0dHJpYnV0ZS4gT3BlcmF0aW9ucyBhbmQgYXR0cmlidXRlcyByZXF1aXJlIGRvdWJsZSBkaXNwYXRjaDogdGhlIHNlbWFudGljXG4gICAgLy8gYWN0aW9uIGlzIGNob3NlbiBiYXNlZCBvbiBib3RoIHRoZSBub2RlJ3MgdHlwZSBhbmQgdGhlIHNlbWFudGljcy4gV3JhcHBlcnMgZW5zdXJlIHRoYXRcbiAgICAvLyB0aGUgYGV4ZWN1dGVgIG1ldGhvZCBpcyBjYWxsZWQgd2l0aCB0aGUgY29ycmVjdCAobW9zdCBzcGVjaWZpYykgc2VtYW50aWNzIG9iamVjdCBhcyBhblxuICAgIC8vIGFyZ3VtZW50LlxuICAgIHRoaXMuV3JhcHBlciA9IGNsYXNzIGV4dGVuZHMgKHN1cGVyU2VtYW50aWNzID8gc3VwZXJTZW1hbnRpY3MuV3JhcHBlciA6IFdyYXBwZXIpIHtcbiAgICAgIGNvbnN0cnVjdG9yKG5vZGUsIHNvdXJjZUludGVydmFsLCBiYXNlSW50ZXJ2YWwpIHtcbiAgICAgICAgc3VwZXIobm9kZSwgc291cmNlSW50ZXJ2YWwsIGJhc2VJbnRlcnZhbCk7XG4gICAgICAgIHNlbGYuY2hlY2tBY3Rpb25EaWN0c0lmSGF2ZW50QWxyZWFkeSgpO1xuICAgICAgICB0aGlzLl9zZW1hbnRpY3MgPSBzZWxmO1xuICAgICAgfVxuXG4gICAgICB0b1N0cmluZygpIHtcbiAgICAgICAgcmV0dXJuICdbc2VtYW50aWNzIHdyYXBwZXIgZm9yICcgKyBzZWxmLmdyYW1tYXIubmFtZSArICddJztcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgdGhpcy5zdXBlciA9IHN1cGVyU2VtYW50aWNzO1xuICAgIGlmIChzdXBlclNlbWFudGljcykge1xuICAgICAgaWYgKCEoZ3JhbW1hci5lcXVhbHModGhpcy5zdXBlci5ncmFtbWFyKSB8fCBncmFtbWFyLl9pbmhlcml0c0Zyb20odGhpcy5zdXBlci5ncmFtbWFyKSkpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgXCJDYW5ub3QgZXh0ZW5kIGEgc2VtYW50aWNzIGZvciBncmFtbWFyICdcIiArXG4gICAgICAgICAgICB0aGlzLnN1cGVyLmdyYW1tYXIubmFtZSArXG4gICAgICAgICAgICBcIicgZm9yIHVzZSB3aXRoIGdyYW1tYXIgJ1wiICtcbiAgICAgICAgICAgIGdyYW1tYXIubmFtZSArXG4gICAgICAgICAgICBcIicgKG5vdCBhIHN1Yi1ncmFtbWFyKVwiLFxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgdGhpcy5vcGVyYXRpb25zID0gT2JqZWN0LmNyZWF0ZSh0aGlzLnN1cGVyLm9wZXJhdGlvbnMpO1xuICAgICAgdGhpcy5hdHRyaWJ1dGVzID0gT2JqZWN0LmNyZWF0ZSh0aGlzLnN1cGVyLmF0dHJpYnV0ZXMpO1xuICAgICAgdGhpcy5hdHRyaWJ1dGVLZXlzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgLy8gQXNzaWduIHVuaXF1ZSBzeW1ib2xzIGZvciBlYWNoIG9mIHRoZSBhdHRyaWJ1dGVzIGluaGVyaXRlZCBmcm9tIHRoZSBzdXBlci1zZW1hbnRpY3Mgc28gdGhhdFxuICAgICAgLy8gdGhleSBhcmUgbWVtb2l6ZWQgaW5kZXBlbmRlbnRseS5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgIGZvciAoY29uc3QgYXR0cmlidXRlTmFtZSBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuYXR0cmlidXRlS2V5cywgYXR0cmlidXRlTmFtZSwge1xuICAgICAgICAgIHZhbHVlOiB1dGlsLnVuaXF1ZUlkKGF0dHJpYnV0ZU5hbWUpLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5vcGVyYXRpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgIHRoaXMuYXR0cmlidXRlcyA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICB0aGlzLmF0dHJpYnV0ZUtleXMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiAnW3NlbWFudGljcyBmb3IgJyArIHRoaXMuZ3JhbW1hci5uYW1lICsgJ10nO1xuICB9XG5cbiAgY2hlY2tBY3Rpb25EaWN0c0lmSGF2ZW50QWxyZWFkeSgpIHtcbiAgICBpZiAoIXRoaXMuY2hlY2tlZEFjdGlvbkRpY3RzKSB7XG4gICAgICB0aGlzLmNoZWNrQWN0aW9uRGljdHMoKTtcbiAgICAgIHRoaXMuY2hlY2tlZEFjdGlvbkRpY3RzID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBDaGVja3MgdGhhdCB0aGUgYWN0aW9uIGRpY3Rpb25hcmllcyBmb3IgYWxsIG9wZXJhdGlvbnMgYW5kIGF0dHJpYnV0ZXMgaW4gdGhpcyBzZW1hbnRpY3MsXG4gIC8vIGluY2x1ZGluZyB0aGUgb25lcyB0aGF0IHdlcmUgaW5oZXJpdGVkIGZyb20gdGhlIHN1cGVyLXNlbWFudGljcywgYWdyZWUgd2l0aCB0aGUgZ3JhbW1hci5cbiAgLy8gVGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiBvbmUgb3IgbW9yZSBvZiB0aGVtIGRvZXNuJ3QuXG4gIGNoZWNrQWN0aW9uRGljdHMoKSB7XG4gICAgbGV0IG5hbWU7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGd1YXJkLWZvci1pblxuICAgIGZvciAobmFtZSBpbiB0aGlzLm9wZXJhdGlvbnMpIHtcbiAgICAgIHRoaXMub3BlcmF0aW9uc1tuYW1lXS5jaGVja0FjdGlvbkRpY3QodGhpcy5ncmFtbWFyKTtcbiAgICB9XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGd1YXJkLWZvci1pblxuICAgIGZvciAobmFtZSBpbiB0aGlzLmF0dHJpYnV0ZXMpIHtcbiAgICAgIHRoaXMuYXR0cmlidXRlc1tuYW1lXS5jaGVja0FjdGlvbkRpY3QodGhpcy5ncmFtbWFyKTtcbiAgICB9XG4gIH1cblxuICB0b1JlY2lwZShzZW1hbnRpY3NPbmx5KSB7XG4gICAgZnVuY3Rpb24gaGFzU3VwZXJTZW1hbnRpY3Mocykge1xuICAgICAgcmV0dXJuIHMuc3VwZXIgIT09IFNlbWFudGljcy5CdWlsdEluU2VtYW50aWNzLl9nZXRTZW1hbnRpY3MoKTtcbiAgICB9XG5cbiAgICBsZXQgc3RyID0gJyhmdW5jdGlvbihnKSB7XFxuJztcbiAgICBpZiAoaGFzU3VwZXJTZW1hbnRpY3ModGhpcykpIHtcbiAgICAgIHN0ciArPSAnICB2YXIgc2VtYW50aWNzID0gJyArIHRoaXMuc3VwZXIudG9SZWNpcGUodHJ1ZSkgKyAnKGcnO1xuXG4gICAgICBjb25zdCBzdXBlclNlbWFudGljc0dyYW1tYXIgPSB0aGlzLnN1cGVyLmdyYW1tYXI7XG4gICAgICBsZXQgcmVsYXRlZEdyYW1tYXIgPSB0aGlzLmdyYW1tYXI7XG4gICAgICB3aGlsZSAocmVsYXRlZEdyYW1tYXIgIT09IHN1cGVyU2VtYW50aWNzR3JhbW1hcikge1xuICAgICAgICBzdHIgKz0gJy5zdXBlckdyYW1tYXInO1xuICAgICAgICByZWxhdGVkR3JhbW1hciA9IHJlbGF0ZWRHcmFtbWFyLnN1cGVyR3JhbW1hcjtcbiAgICAgIH1cblxuICAgICAgc3RyICs9ICcpO1xcbic7XG4gICAgICBzdHIgKz0gJyAgcmV0dXJuIGcuZXh0ZW5kU2VtYW50aWNzKHNlbWFudGljcyknO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAgcmV0dXJuIGcuY3JlYXRlU2VtYW50aWNzKCknO1xuICAgIH1cbiAgICBbJ09wZXJhdGlvbicsICdBdHRyaWJ1dGUnXS5mb3JFYWNoKHR5cGUgPT4ge1xuICAgICAgY29uc3Qgc2VtYW50aWNPcGVyYXRpb25zID0gdGhpc1t0eXBlLnRvTG93ZXJDYXNlKCkgKyAncyddO1xuICAgICAgT2JqZWN0LmtleXMoc2VtYW50aWNPcGVyYXRpb25zKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBjb25zdCB7YWN0aW9uRGljdCwgZm9ybWFscywgYnVpbHRJbkRlZmF1bHR9ID0gc2VtYW50aWNPcGVyYXRpb25zW25hbWVdO1xuXG4gICAgICAgIGxldCBzaWduYXR1cmUgPSBuYW1lO1xuICAgICAgICBpZiAoZm9ybWFscy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgc2lnbmF0dXJlICs9ICcoJyArIGZvcm1hbHMuam9pbignLCAnKSArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBtZXRob2Q7XG4gICAgICAgIGlmIChoYXNTdXBlclNlbWFudGljcyh0aGlzKSAmJiB0aGlzLnN1cGVyW3R5cGUudG9Mb3dlckNhc2UoKSArICdzJ11bbmFtZV0pIHtcbiAgICAgICAgICBtZXRob2QgPSAnZXh0ZW5kJyArIHR5cGU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWV0aG9kID0gJ2FkZCcgKyB0eXBlO1xuICAgICAgICB9XG4gICAgICAgIHN0ciArPSAnXFxuICAgIC4nICsgbWV0aG9kICsgJygnICsgSlNPTi5zdHJpbmdpZnkoc2lnbmF0dXJlKSArICcsIHsnO1xuXG4gICAgICAgIGNvbnN0IHNyY0FycmF5ID0gW107XG4gICAgICAgIE9iamVjdC5rZXlzKGFjdGlvbkRpY3QpLmZvckVhY2goYWN0aW9uTmFtZSA9PiB7XG4gICAgICAgICAgaWYgKGFjdGlvbkRpY3RbYWN0aW9uTmFtZV0gIT09IGJ1aWx0SW5EZWZhdWx0KSB7XG4gICAgICAgICAgICBsZXQgc291cmNlID0gYWN0aW9uRGljdFthY3Rpb25OYW1lXS50b1N0cmluZygpLnRyaW0oKTtcblxuICAgICAgICAgICAgLy8gQ29udmVydCBtZXRob2Qgc2hvcnRoYW5kIHRvIHBsYWluIG9sZCBmdW5jdGlvbiBzeW50YXguXG4gICAgICAgICAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vb2htanMvb2htL2lzc3Vlcy8yNjNcbiAgICAgICAgICAgIHNvdXJjZSA9IHNvdXJjZS5yZXBsYWNlKC9eLipcXCgvLCAnZnVuY3Rpb24oJyk7XG5cbiAgICAgICAgICAgIHNyY0FycmF5LnB1c2goJ1xcbiAgICAgICcgKyBKU09OLnN0cmluZ2lmeShhY3Rpb25OYW1lKSArICc6ICcgKyBzb3VyY2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHN0ciArPSBzcmNBcnJheS5qb2luKCcsJykgKyAnXFxuICAgIH0pJztcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHN0ciArPSAnO1xcbiAgfSknO1xuXG4gICAgaWYgKCFzZW1hbnRpY3NPbmx5KSB7XG4gICAgICBzdHIgPVxuICAgICAgICAnKGZ1bmN0aW9uKCkge1xcbicgK1xuICAgICAgICAnICB2YXIgZ3JhbW1hciA9IHRoaXMuZnJvbVJlY2lwZSgnICtcbiAgICAgICAgdGhpcy5ncmFtbWFyLnRvUmVjaXBlKCkgK1xuICAgICAgICAnKTtcXG4nICtcbiAgICAgICAgJyAgdmFyIHNlbWFudGljcyA9ICcgK1xuICAgICAgICBzdHIgK1xuICAgICAgICAnKGdyYW1tYXIpO1xcbicgK1xuICAgICAgICAnICByZXR1cm4gc2VtYW50aWNzO1xcbicgK1xuICAgICAgICAnfSk7XFxuJztcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyO1xuICB9XG5cbiAgYWRkT3BlcmF0aW9uT3JBdHRyaWJ1dGUodHlwZSwgc2lnbmF0dXJlLCBhY3Rpb25EaWN0KSB7XG4gICAgY29uc3QgdHlwZVBsdXJhbCA9IHR5cGUgKyAncyc7XG5cbiAgICBjb25zdCBwYXJzZWROYW1lQW5kRm9ybWFsQXJncyA9IHBhcnNlU2lnbmF0dXJlKHNpZ25hdHVyZSwgdHlwZSk7XG4gICAgY29uc3Qge25hbWV9ID0gcGFyc2VkTmFtZUFuZEZvcm1hbEFyZ3M7XG4gICAgY29uc3Qge2Zvcm1hbHN9ID0gcGFyc2VkTmFtZUFuZEZvcm1hbEFyZ3M7XG5cbiAgICAvLyBUT0RPOiBjaGVjayB0aGF0IHRoZXJlIGFyZSBubyBkdXBsaWNhdGUgZm9ybWFsIGFyZ3VtZW50c1xuXG4gICAgdGhpcy5hc3NlcnROZXdOYW1lKG5hbWUsIHR5cGUpO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBhY3Rpb24gZGljdGlvbmFyeSBmb3IgdGhpcyBvcGVyYXRpb24gLyBhdHRyaWJ1dGUgdGhhdCBjb250YWlucyBhIGBfZGVmYXVsdGAgYWN0aW9uXG4gICAgLy8gd2hpY2ggZGVmaW5lcyB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiBpdGVyYXRpb24sIHRlcm1pbmFsLCBhbmQgbm9uLXRlcm1pbmFsIG5vZGVzLi4uXG4gICAgY29uc3QgYnVpbHRJbkRlZmF1bHQgPSBuZXdEZWZhdWx0QWN0aW9uKHR5cGUsIG5hbWUsIGRvSXQpO1xuICAgIGNvbnN0IHJlYWxBY3Rpb25EaWN0ID0ge19kZWZhdWx0OiBidWlsdEluRGVmYXVsdH07XG4gICAgLy8gLi4uIGFuZCBhZGQgaW4gdGhlIGFjdGlvbnMgc3VwcGxpZWQgYnkgdGhlIHByb2dyYW1tZXIsIHdoaWNoIG1heSBvdmVycmlkZSBzb21lIG9yIGFsbCBvZiB0aGVcbiAgICAvLyBkZWZhdWx0IG9uZXMuXG4gICAgT2JqZWN0LmtleXMoYWN0aW9uRGljdCkuZm9yRWFjaChuYW1lID0+IHtcbiAgICAgIHJlYWxBY3Rpb25EaWN0W25hbWVdID0gYWN0aW9uRGljdFtuYW1lXTtcbiAgICB9KTtcblxuICAgIGNvbnN0IGVudHJ5ID1cbiAgICAgIHR5cGUgPT09ICdvcGVyYXRpb24nID9cbiAgICAgICAgbmV3IE9wZXJhdGlvbihuYW1lLCBmb3JtYWxzLCByZWFsQWN0aW9uRGljdCwgYnVpbHRJbkRlZmF1bHQpIDpcbiAgICAgICAgbmV3IEF0dHJpYnV0ZShuYW1lLCByZWFsQWN0aW9uRGljdCwgYnVpbHRJbkRlZmF1bHQpO1xuXG4gICAgLy8gVGhlIGZvbGxvd2luZyBjaGVjayBpcyBub3Qgc3RyaWN0bHkgbmVjZXNzYXJ5IChpdCB3aWxsIGhhcHBlbiBsYXRlciBhbnl3YXkpIGJ1dCBpdCdzIGJldHRlclxuICAgIC8vIHRvIGNhdGNoIGVycm9ycyBlYXJseS5cbiAgICBlbnRyeS5jaGVja0FjdGlvbkRpY3QodGhpcy5ncmFtbWFyKTtcblxuICAgIHRoaXNbdHlwZVBsdXJhbF1bbmFtZV0gPSBlbnRyeTtcblxuICAgIGZ1bmN0aW9uIGRvSXQoLi4uYXJncykge1xuICAgICAgLy8gRGlzcGF0Y2ggdG8gbW9zdCBzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoaXMgb3BlcmF0aW9uIC8gYXR0cmlidXRlIC0tIGl0IG1heSBoYXZlIGJlZW5cbiAgICAgIC8vIG92ZXJyaWRkZW4gYnkgYSBzdWItc2VtYW50aWNzLlxuICAgICAgY29uc3QgdGhpc1RoaW5nID0gdGhpcy5fc2VtYW50aWNzW3R5cGVQbHVyYWxdW25hbWVdO1xuXG4gICAgICAvLyBDaGVjayB0aGF0IHRoZSBjYWxsZXIgcGFzc2VkIHRoZSBjb3JyZWN0IG51bWJlciBvZiBhcmd1bWVudHMuXG4gICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCAhPT0gdGhpc1RoaW5nLmZvcm1hbHMubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICdJbnZhbGlkIG51bWJlciBvZiBhcmd1bWVudHMgcGFzc2VkIHRvICcgK1xuICAgICAgICAgICAgbmFtZSArXG4gICAgICAgICAgICAnICcgK1xuICAgICAgICAgICAgdHlwZSArXG4gICAgICAgICAgICAnIChleHBlY3RlZCAnICtcbiAgICAgICAgICAgIHRoaXNUaGluZy5mb3JtYWxzLmxlbmd0aCArXG4gICAgICAgICAgICAnLCBnb3QgJyArXG4gICAgICAgICAgICBhcmd1bWVudHMubGVuZ3RoICtcbiAgICAgICAgICAgICcpJyxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgLy8gQ3JlYXRlIGFuIFwiYXJndW1lbnRzIG9iamVjdFwiIGZyb20gdGhlIGFyZ3VtZW50cyB0aGF0IHdlcmUgcGFzc2VkIHRvIHRoaXNcbiAgICAgIC8vIG9wZXJhdGlvbiAvIGF0dHJpYnV0ZS5cbiAgICAgIGNvbnN0IGFyZ3NPYmogPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgZm9yIChjb25zdCBbaWR4LCB2YWxdIG9mIE9iamVjdC5lbnRyaWVzKGFyZ3MpKSB7XG4gICAgICAgIGNvbnN0IGZvcm1hbCA9IHRoaXNUaGluZy5mb3JtYWxzW2lkeF07XG4gICAgICAgIGFyZ3NPYmpbZm9ybWFsXSA9IHZhbDtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkQXJncyA9IHRoaXMuYXJncztcbiAgICAgIHRoaXMuYXJncyA9IGFyZ3NPYmo7XG4gICAgICBjb25zdCBhbnMgPSB0aGlzVGhpbmcuZXhlY3V0ZSh0aGlzLl9zZW1hbnRpY3MsIHRoaXMpO1xuICAgICAgdGhpcy5hcmdzID0gb2xkQXJncztcbiAgICAgIHJldHVybiBhbnM7XG4gICAgfVxuXG4gICAgaWYgKHR5cGUgPT09ICdvcGVyYXRpb24nKSB7XG4gICAgICB0aGlzLldyYXBwZXIucHJvdG90eXBlW25hbWVdID0gZG9JdDtcbiAgICAgIHRoaXMuV3JhcHBlci5wcm90b3R5cGVbbmFtZV0udG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICdbJyArIG5hbWUgKyAnIG9wZXJhdGlvbl0nO1xuICAgICAgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuV3JhcHBlci5wcm90b3R5cGUsIG5hbWUsIHtcbiAgICAgICAgZ2V0OiBkb0l0LFxuICAgICAgICBjb25maWd1cmFibGU6IHRydWUsIC8vIFNvIHRoZSBwcm9wZXJ0eSBjYW4gYmUgZGVsZXRlZC5cbiAgICAgIH0pO1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHRoaXMuYXR0cmlidXRlS2V5cywgbmFtZSwge1xuICAgICAgICB2YWx1ZTogdXRpbC51bmlxdWVJZChuYW1lKSxcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIGV4dGVuZE9wZXJhdGlvbk9yQXR0cmlidXRlKHR5cGUsIG5hbWUsIGFjdGlvbkRpY3QpIHtcbiAgICBjb25zdCB0eXBlUGx1cmFsID0gdHlwZSArICdzJztcblxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IGBuYW1lYCByZWFsbHkgaXMganVzdCBhIG5hbWUsIGkuZS4sIHRoYXQgaXQgZG9lc24ndCBhbHNvIGNvbnRhaW4gZm9ybWFscy5cbiAgICBwYXJzZVNpZ25hdHVyZShuYW1lLCAnYXR0cmlidXRlJyk7XG5cbiAgICBpZiAoISh0aGlzLnN1cGVyICYmIG5hbWUgaW4gdGhpcy5zdXBlclt0eXBlUGx1cmFsXSkpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ2Fubm90IGV4dGVuZCAnICtcbiAgICAgICAgICB0eXBlICtcbiAgICAgICAgICBcIiAnXCIgK1xuICAgICAgICAgIG5hbWUgK1xuICAgICAgICAgIFwiJzogZGlkIG5vdCBpbmhlcml0IGFuIFwiICtcbiAgICAgICAgICB0eXBlICtcbiAgICAgICAgICAnIHdpdGggdGhhdCBuYW1lJyxcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChoYXNPd25Qcm9wZXJ0eSh0aGlzW3R5cGVQbHVyYWxdLCBuYW1lKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgZXh0ZW5kICcgKyB0eXBlICsgXCIgJ1wiICsgbmFtZSArIFwiJyBhZ2FpblwiKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgYSBuZXcgb3BlcmF0aW9uIC8gYXR0cmlidXRlIHdob3NlIGFjdGlvbkRpY3QgZGVsZWdhdGVzIHRvIHRoZSBzdXBlciBvcGVyYXRpb24gL1xuICAgIC8vIGF0dHJpYnV0ZSdzIGFjdGlvbkRpY3QsIGFuZCB3aGljaCBoYXMgYWxsIHRoZSBrZXlzIGZyb20gYGluaGVyaXRlZEFjdGlvbkRpY3RgLlxuICAgIGNvbnN0IGluaGVyaXRlZEZvcm1hbHMgPSB0aGlzW3R5cGVQbHVyYWxdW25hbWVdLmZvcm1hbHM7XG4gICAgY29uc3QgaW5oZXJpdGVkQWN0aW9uRGljdCA9IHRoaXNbdHlwZVBsdXJhbF1bbmFtZV0uYWN0aW9uRGljdDtcbiAgICBjb25zdCBuZXdBY3Rpb25EaWN0ID0gT2JqZWN0LmNyZWF0ZShpbmhlcml0ZWRBY3Rpb25EaWN0KTtcbiAgICBPYmplY3Qua2V5cyhhY3Rpb25EaWN0KS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgbmV3QWN0aW9uRGljdFtuYW1lXSA9IGFjdGlvbkRpY3RbbmFtZV07XG4gICAgfSk7XG5cbiAgICB0aGlzW3R5cGVQbHVyYWxdW25hbWVdID1cbiAgICAgIHR5cGUgPT09ICdvcGVyYXRpb24nID9cbiAgICAgICAgbmV3IE9wZXJhdGlvbihuYW1lLCBpbmhlcml0ZWRGb3JtYWxzLCBuZXdBY3Rpb25EaWN0KSA6XG4gICAgICAgIG5ldyBBdHRyaWJ1dGUobmFtZSwgbmV3QWN0aW9uRGljdCk7XG5cbiAgICAvLyBUaGUgZm9sbG93aW5nIGNoZWNrIGlzIG5vdCBzdHJpY3RseSBuZWNlc3NhcnkgKGl0IHdpbGwgaGFwcGVuIGxhdGVyIGFueXdheSkgYnV0IGl0J3MgYmV0dGVyXG4gICAgLy8gdG8gY2F0Y2ggZXJyb3JzIGVhcmx5LlxuICAgIHRoaXNbdHlwZVBsdXJhbF1bbmFtZV0uY2hlY2tBY3Rpb25EaWN0KHRoaXMuZ3JhbW1hcik7XG4gIH1cblxuICBhc3NlcnROZXdOYW1lKG5hbWUsIHR5cGUpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkoV3JhcHBlci5wcm90b3R5cGUsIG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBhZGQgJyArIHR5cGUgKyBcIiAnXCIgKyBuYW1lICsgXCInOiB0aGF0J3MgYSByZXNlcnZlZCBuYW1lXCIpO1xuICAgIH1cbiAgICBpZiAobmFtZSBpbiB0aGlzLm9wZXJhdGlvbnMpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnQ2Fubm90IGFkZCAnICsgdHlwZSArIFwiICdcIiArIG5hbWUgKyBcIic6IGFuIG9wZXJhdGlvbiB3aXRoIHRoYXQgbmFtZSBhbHJlYWR5IGV4aXN0c1wiLFxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG5hbWUgaW4gdGhpcy5hdHRyaWJ1dGVzKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgJ0Nhbm5vdCBhZGQgJyArIHR5cGUgKyBcIiAnXCIgKyBuYW1lICsgXCInOiBhbiBhdHRyaWJ1dGUgd2l0aCB0aGF0IG5hbWUgYWxyZWFkeSBleGlzdHNcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJucyBhIHdyYXBwZXIgZm9yIHRoZSBnaXZlbiBDU1QgYG5vZGVgIGluIHRoaXMgc2VtYW50aWNzLlxuICAvLyBJZiBgbm9kZWAgaXMgYWxyZWFkeSBhIHdyYXBwZXIsIHJldHVybnMgYG5vZGVgIGl0c2VsZi4gIC8vIFRPRE86IHdoeSBpcyB0aGlzIG5lZWRlZD9cbiAgd3JhcChub2RlLCBzb3VyY2UsIG9wdEJhc2VJbnRlcnZhbCkge1xuICAgIGNvbnN0IGJhc2VJbnRlcnZhbCA9IG9wdEJhc2VJbnRlcnZhbCB8fCBzb3VyY2U7XG4gICAgcmV0dXJuIG5vZGUgaW5zdGFuY2VvZiB0aGlzLldyYXBwZXIgPyBub2RlIDogbmV3IHRoaXMuV3JhcHBlcihub2RlLCBzb3VyY2UsIGJhc2VJbnRlcnZhbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcGFyc2VTaWduYXR1cmUoc2lnbmF0dXJlLCB0eXBlKSB7XG4gIGlmICghU2VtYW50aWNzLnByb3RvdHlwZUdyYW1tYXIpIHtcbiAgICAvLyBUaGUgT3BlcmF0aW9ucyBhbmQgQXR0cmlidXRlcyBncmFtbWFyIHdvbid0IGJlIGF2YWlsYWJsZSB3aGlsZSBPaG0gaXMgbG9hZGluZyxcbiAgICAvLyBidXQgd2UgY2FuIGdldCBhd2F5IHRoZSBmb2xsb3dpbmcgc2ltcGxpZmljYXRpb24gYi9jIG5vbmUgb2YgdGhlIG9wZXJhdGlvbnNcbiAgICAvLyB0aGF0IGFyZSB1c2VkIHdoaWxlIGxvYWRpbmcgdGFrZSBhcmd1bWVudHMuXG4gICAgY29tbW9uLmFzc2VydChzaWduYXR1cmUuaW5kZXhPZignKCcpID09PSAtMSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIG5hbWU6IHNpZ25hdHVyZSxcbiAgICAgIGZvcm1hbHM6IFtdLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByID0gU2VtYW50aWNzLnByb3RvdHlwZUdyYW1tYXIubWF0Y2goXG4gICAgICBzaWduYXR1cmUsXG4gICAgdHlwZSA9PT0gJ29wZXJhdGlvbicgPyAnT3BlcmF0aW9uU2lnbmF0dXJlJyA6ICdBdHRyaWJ1dGVTaWduYXR1cmUnLFxuICApO1xuICBpZiAoci5mYWlsZWQoKSkge1xuICAgIHRocm93IG5ldyBFcnJvcihyLm1lc3NhZ2UpO1xuICB9XG5cbiAgcmV0dXJuIFNlbWFudGljcy5wcm90b3R5cGVHcmFtbWFyU2VtYW50aWNzKHIpLnBhcnNlKCk7XG59XG5cbmZ1bmN0aW9uIG5ld0RlZmF1bHRBY3Rpb24odHlwZSwgbmFtZSwgZG9JdCkge1xuICByZXR1cm4gZnVuY3Rpb24oLi4uY2hpbGRyZW4pIHtcbiAgICBjb25zdCB0aGlzVGhpbmcgPSB0aGlzLl9zZW1hbnRpY3Mub3BlcmF0aW9uc1tuYW1lXSB8fCB0aGlzLl9zZW1hbnRpY3MuYXR0cmlidXRlc1tuYW1lXTtcbiAgICBjb25zdCBhcmdzID0gdGhpc1RoaW5nLmZvcm1hbHMubWFwKGZvcm1hbCA9PiB0aGlzLmFyZ3NbZm9ybWFsXSk7XG5cbiAgICBpZiAoIXRoaXMuaXNJdGVyYXRpb24oKSAmJiBjaGlsZHJlbi5sZW5ndGggPT09IDEpIHtcbiAgICAgIC8vIFRoaXMgQ1NUIG5vZGUgY29ycmVzcG9uZHMgdG8gYSBub24tdGVybWluYWwgaW4gdGhlIGdyYW1tYXIgKGUuZy4sIEFkZEV4cHIpLiBUaGUgZmFjdCB0aGF0XG4gICAgICAvLyB3ZSBnb3QgaGVyZSBtZWFucyB0aGF0IHRoaXMgYWN0aW9uIGRpY3Rpb25hcnkgZG9lc24ndCBoYXZlIGFuIGFjdGlvbiBmb3IgdGhpcyBwYXJ0aWN1bGFyXG4gICAgICAvLyBub24tdGVybWluYWwgb3IgYSBnZW5lcmljIGBfbm9udGVybWluYWxgIGFjdGlvbi5cbiAgICAgIC8vIEFzIGEgY29udmVuaWVuY2UsIGlmIHRoaXMgbm9kZSBvbmx5IGhhcyBvbmUgY2hpbGQsIHdlIGp1c3QgcmV0dXJuIHRoZSByZXN1bHQgb2YgYXBwbHlpbmdcbiAgICAgIC8vIHRoaXMgb3BlcmF0aW9uIC8gYXR0cmlidXRlIHRvIHRoZSBjaGlsZCBub2RlLlxuICAgICAgcmV0dXJuIGRvSXQuYXBwbHkoY2hpbGRyZW5bMF0sIGFyZ3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPdGhlcndpc2UsIHdlIHRocm93IGFuIGV4Y2VwdGlvbiB0byBsZXQgdGhlIHByb2dyYW1tZXIga25vdyB0aGF0IHdlIGRvbid0IGtub3cgd2hhdFxuICAgICAgLy8gdG8gZG8gd2l0aCB0aGlzIG5vZGUuXG4gICAgICB0aHJvdyBlcnJvcnMubWlzc2luZ1NlbWFudGljQWN0aW9uKHRoaXMuY3Rvck5hbWUsIG5hbWUsIHR5cGUsIGdsb2JhbEFjdGlvblN0YWNrKTtcbiAgICB9XG4gIH07XG59XG5cbi8vIENyZWF0ZXMgYSBuZXcgU2VtYW50aWNzIGluc3RhbmNlIGZvciBgZ3JhbW1hcmAsIGluaGVyaXRpbmcgb3BlcmF0aW9ucyBhbmQgYXR0cmlidXRlcyBmcm9tXG4vLyBgb3B0U3VwZXJTZW1hbnRpY3NgLCBpZiBpdCBpcyBzcGVjaWZpZWQuIFJldHVybnMgYSBmdW5jdGlvbiB0aGF0IGFjdHMgYXMgYSBwcm94eSBmb3IgdGhlIG5ld1xuLy8gU2VtYW50aWNzIGluc3RhbmNlLiBXaGVuIHRoYXQgZnVuY3Rpb24gaXMgaW52b2tlZCB3aXRoIGEgQ1NUIG5vZGUgYXMgYW4gYXJndW1lbnQsIGl0IHJldHVybnNcbi8vIGEgd3JhcHBlciBmb3IgdGhhdCBub2RlIHdoaWNoIGdpdmVzIGFjY2VzcyB0byB0aGUgb3BlcmF0aW9ucyBhbmQgYXR0cmlidXRlcyBwcm92aWRlZCBieSB0aGlzXG4vLyBzZW1hbnRpY3MuXG5TZW1hbnRpY3MuY3JlYXRlU2VtYW50aWNzID0gZnVuY3Rpb24oZ3JhbW1hciwgb3B0U3VwZXJTZW1hbnRpY3MpIHtcbiAgY29uc3QgcyA9IG5ldyBTZW1hbnRpY3MoXG4gICAgICBncmFtbWFyLFxuICAgIG9wdFN1cGVyU2VtYW50aWNzICE9PSB1bmRlZmluZWQgP1xuICAgICAgb3B0U3VwZXJTZW1hbnRpY3MgOlxuICAgICAgU2VtYW50aWNzLkJ1aWx0SW5TZW1hbnRpY3MuX2dldFNlbWFudGljcygpLFxuICApO1xuXG4gIC8vIFRvIGVuYWJsZSBjbGllbnRzIHRvIGludm9rZSBhIHNlbWFudGljcyBsaWtlIGEgZnVuY3Rpb24sIHJldHVybiBhIGZ1bmN0aW9uIHRoYXQgYWN0cyBhcyBhIHByb3h5XG4gIC8vIGZvciBgc2AsIHdoaWNoIGlzIHRoZSByZWFsIGBTZW1hbnRpY3NgIGluc3RhbmNlLlxuICBjb25zdCBwcm94eSA9IGZ1bmN0aW9uIEFTZW1hbnRpY3MobWF0Y2hSZXN1bHQpIHtcbiAgICBpZiAoIShtYXRjaFJlc3VsdCBpbnN0YW5jZW9mIE1hdGNoUmVzdWx0KSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgICAnU2VtYW50aWNzIGV4cGVjdGVkIGEgTWF0Y2hSZXN1bHQsIGJ1dCBnb3QgJyArXG4gICAgICAgICAgY29tbW9uLnVuZXhwZWN0ZWRPYmpUb1N0cmluZyhtYXRjaFJlc3VsdCksXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAobWF0Y2hSZXN1bHQuZmFpbGVkKCkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2Nhbm5vdCBhcHBseSBTZW1hbnRpY3MgdG8gJyArIG1hdGNoUmVzdWx0LnRvU3RyaW5nKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IGNzdCA9IG1hdGNoUmVzdWx0Ll9jc3Q7XG4gICAgaWYgKGNzdC5ncmFtbWFyICE9PSBncmFtbWFyKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgXCJDYW5ub3QgdXNlIGEgTWF0Y2hSZXN1bHQgZnJvbSBncmFtbWFyICdcIiArXG4gICAgICAgICAgY3N0LmdyYW1tYXIubmFtZSArXG4gICAgICAgICAgXCInIHdpdGggYSBzZW1hbnRpY3MgZm9yICdcIiArXG4gICAgICAgICAgZ3JhbW1hci5uYW1lICtcbiAgICAgICAgICBcIidcIixcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IGlucHV0U3RyZWFtID0gbmV3IElucHV0U3RyZWFtKG1hdGNoUmVzdWx0LmlucHV0KTtcbiAgICByZXR1cm4gcy53cmFwKGNzdCwgaW5wdXRTdHJlYW0uaW50ZXJ2YWwobWF0Y2hSZXN1bHQuX2NzdE9mZnNldCwgbWF0Y2hSZXN1bHQuaW5wdXQubGVuZ3RoKSk7XG4gIH07XG5cbiAgLy8gRm9yd2FyZCBwdWJsaWMgbWV0aG9kcyBmcm9tIHRoZSBwcm94eSB0byB0aGUgc2VtYW50aWNzIGluc3RhbmNlLlxuICBwcm94eS5hZGRPcGVyYXRpb24gPSBmdW5jdGlvbihzaWduYXR1cmUsIGFjdGlvbkRpY3QpIHtcbiAgICBzLmFkZE9wZXJhdGlvbk9yQXR0cmlidXRlKCdvcGVyYXRpb24nLCBzaWduYXR1cmUsIGFjdGlvbkRpY3QpO1xuICAgIHJldHVybiBwcm94eTtcbiAgfTtcbiAgcHJveHkuZXh0ZW5kT3BlcmF0aW9uID0gZnVuY3Rpb24obmFtZSwgYWN0aW9uRGljdCkge1xuICAgIHMuZXh0ZW5kT3BlcmF0aW9uT3JBdHRyaWJ1dGUoJ29wZXJhdGlvbicsIG5hbWUsIGFjdGlvbkRpY3QpO1xuICAgIHJldHVybiBwcm94eTtcbiAgfTtcbiAgcHJveHkuYWRkQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgYWN0aW9uRGljdCkge1xuICAgIHMuYWRkT3BlcmF0aW9uT3JBdHRyaWJ1dGUoJ2F0dHJpYnV0ZScsIG5hbWUsIGFjdGlvbkRpY3QpO1xuICAgIHJldHVybiBwcm94eTtcbiAgfTtcbiAgcHJveHkuZXh0ZW5kQXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgYWN0aW9uRGljdCkge1xuICAgIHMuZXh0ZW5kT3BlcmF0aW9uT3JBdHRyaWJ1dGUoJ2F0dHJpYnV0ZScsIG5hbWUsIGFjdGlvbkRpY3QpO1xuICAgIHJldHVybiBwcm94eTtcbiAgfTtcbiAgcHJveHkuX2dldEFjdGlvbkRpY3QgPSBmdW5jdGlvbihvcGVyYXRpb25PckF0dHJpYnV0ZU5hbWUpIHtcbiAgICBjb25zdCBhY3Rpb24gPVxuICAgICAgcy5vcGVyYXRpb25zW29wZXJhdGlvbk9yQXR0cmlidXRlTmFtZV0gfHwgcy5hdHRyaWJ1dGVzW29wZXJhdGlvbk9yQXR0cmlidXRlTmFtZV07XG4gICAgaWYgKCFhY3Rpb24pIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAnXCInICtcbiAgICAgICAgICBvcGVyYXRpb25PckF0dHJpYnV0ZU5hbWUgK1xuICAgICAgICAgICdcIiBpcyBub3QgYSB2YWxpZCBvcGVyYXRpb24gb3IgYXR0cmlidXRlICcgK1xuICAgICAgICAgICduYW1lIGluIHRoaXMgc2VtYW50aWNzIGZvciBcIicgK1xuICAgICAgICAgIGdyYW1tYXIubmFtZSArXG4gICAgICAgICAgJ1wiJyxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBhY3Rpb24uYWN0aW9uRGljdDtcbiAgfTtcbiAgcHJveHkuX3JlbW92ZSA9IGZ1bmN0aW9uKG9wZXJhdGlvbk9yQXR0cmlidXRlTmFtZSkge1xuICAgIGxldCBzZW1hbnRpYztcbiAgICBpZiAob3BlcmF0aW9uT3JBdHRyaWJ1dGVOYW1lIGluIHMub3BlcmF0aW9ucykge1xuICAgICAgc2VtYW50aWMgPSBzLm9wZXJhdGlvbnNbb3BlcmF0aW9uT3JBdHRyaWJ1dGVOYW1lXTtcbiAgICAgIGRlbGV0ZSBzLm9wZXJhdGlvbnNbb3BlcmF0aW9uT3JBdHRyaWJ1dGVOYW1lXTtcbiAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbk9yQXR0cmlidXRlTmFtZSBpbiBzLmF0dHJpYnV0ZXMpIHtcbiAgICAgIHNlbWFudGljID0gcy5hdHRyaWJ1dGVzW29wZXJhdGlvbk9yQXR0cmlidXRlTmFtZV07XG4gICAgICBkZWxldGUgcy5hdHRyaWJ1dGVzW29wZXJhdGlvbk9yQXR0cmlidXRlTmFtZV07XG4gICAgfVxuICAgIGRlbGV0ZSBzLldyYXBwZXIucHJvdG90eXBlW29wZXJhdGlvbk9yQXR0cmlidXRlTmFtZV07XG4gICAgcmV0dXJuIHNlbWFudGljO1xuICB9O1xuICBwcm94eS5nZXRPcGVyYXRpb25OYW1lcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhzLm9wZXJhdGlvbnMpO1xuICB9O1xuICBwcm94eS5nZXRBdHRyaWJ1dGVOYW1lcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyhzLmF0dHJpYnV0ZXMpO1xuICB9O1xuICBwcm94eS5nZXRHcmFtbWFyID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHMuZ3JhbW1hcjtcbiAgfTtcbiAgcHJveHkudG9SZWNpcGUgPSBmdW5jdGlvbihzZW1hbnRpY3NPbmx5KSB7XG4gICAgcmV0dXJuIHMudG9SZWNpcGUoc2VtYW50aWNzT25seSk7XG4gIH07XG5cbiAgLy8gTWFrZSB0aGUgcHJveHkncyB0b1N0cmluZygpIHdvcmsuXG4gIHByb3h5LnRvU3RyaW5nID0gcy50b1N0cmluZy5iaW5kKHMpO1xuXG4gIC8vIFJldHVybnMgdGhlIHNlbWFudGljcyBmb3IgdGhlIHByb3h5LlxuICBwcm94eS5fZ2V0U2VtYW50aWNzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHM7XG4gIH07XG5cbiAgcmV0dXJuIHByb3h5O1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0gT3BlcmF0aW9uIC0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIEFuIE9wZXJhdGlvbiByZXByZXNlbnRzIGEgZnVuY3Rpb24gdG8gYmUgYXBwbGllZCB0byBhIGNvbmNyZXRlIHN5bnRheCB0cmVlIChDU1QpIC0tIGl0J3MgdmVyeVxuLy8gc2ltaWxhciB0byBhIFZpc2l0b3IgKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVmlzaXRvcl9wYXR0ZXJuKS4gQW4gb3BlcmF0aW9uIGlzIGV4ZWN1dGVkIGJ5XG4vLyByZWN1cnNpdmVseSB3YWxraW5nIHRoZSBDU1QsIGFuZCBhdCBlYWNoIG5vZGUsIGludm9raW5nIHRoZSBtYXRjaGluZyBzZW1hbnRpYyBhY3Rpb24gZnJvbVxuLy8gYGFjdGlvbkRpY3RgLiBTZWUgYE9wZXJhdGlvbi5wcm90b3R5cGUuZXhlY3V0ZWAgZm9yIGRldGFpbHMgb2YgaG93IGEgQ1NUIG5vZGUncyBtYXRjaGluZyBzZW1hbnRpY1xuLy8gYWN0aW9uIGlzIGZvdW5kLlxuY2xhc3MgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZSwgZm9ybWFscywgYWN0aW9uRGljdCwgYnVpbHRJbkRlZmF1bHQpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMuZm9ybWFscyA9IGZvcm1hbHM7XG4gICAgdGhpcy5hY3Rpb25EaWN0ID0gYWN0aW9uRGljdDtcbiAgICB0aGlzLmJ1aWx0SW5EZWZhdWx0ID0gYnVpbHRJbkRlZmF1bHQ7XG4gIH1cblxuICBjaGVja0FjdGlvbkRpY3QoZ3JhbW1hcikge1xuICAgIGdyYW1tYXIuX2NoZWNrVG9wRG93bkFjdGlvbkRpY3QodGhpcy50eXBlTmFtZSwgdGhpcy5uYW1lLCB0aGlzLmFjdGlvbkRpY3QpO1xuICB9XG5cbiAgLy8gRXhlY3V0ZSB0aGlzIG9wZXJhdGlvbiBvbiB0aGUgQ1NUIG5vZGUgYXNzb2NpYXRlZCB3aXRoIGBub2RlV3JhcHBlcmAgaW4gdGhlIGNvbnRleHQgb2YgdGhlXG4gIC8vIGdpdmVuIFNlbWFudGljcyBpbnN0YW5jZS5cbiAgZXhlY3V0ZShzZW1hbnRpY3MsIG5vZGVXcmFwcGVyKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vIExvb2sgZm9yIGEgc2VtYW50aWMgYWN0aW9uIHdob3NlIG5hbWUgbWF0Y2hlcyB0aGUgbm9kZSdzIGNvbnN0cnVjdG9yIG5hbWUsIHdoaWNoIGlzIGVpdGhlclxuICAgICAgLy8gdGhlIG5hbWUgb2YgYSBydWxlIGluIHRoZSBncmFtbWFyLCBvciAnX3Rlcm1pbmFsJyAoZm9yIGEgdGVybWluYWwgbm9kZSksIG9yICdfaXRlcicgKGZvciBhblxuICAgICAgLy8gaXRlcmF0aW9uIG5vZGUpLlxuICAgICAgY29uc3Qge2N0b3JOYW1lfSA9IG5vZGVXcmFwcGVyLl9ub2RlO1xuICAgICAgbGV0IGFjdGlvbkZuID0gdGhpcy5hY3Rpb25EaWN0W2N0b3JOYW1lXTtcbiAgICAgIGlmIChhY3Rpb25Gbikge1xuICAgICAgICBnbG9iYWxBY3Rpb25TdGFjay5wdXNoKFt0aGlzLCBjdG9yTmFtZV0pO1xuICAgICAgICByZXR1cm4gYWN0aW9uRm4uYXBwbHkobm9kZVdyYXBwZXIsIG5vZGVXcmFwcGVyLl9jaGlsZHJlbigpKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGFjdGlvbiBkaWN0aW9uYXJ5IGRvZXMgbm90IGNvbnRhaW4gYSBzZW1hbnRpYyBhY3Rpb24gZm9yIHRoaXMgc3BlY2lmaWMgdHlwZSBvZiBub2RlLlxuICAgICAgLy8gSWYgdGhpcyBpcyBhIG5vbnRlcm1pbmFsIG5vZGUgYW5kIHRoZSBwcm9ncmFtbWVyIGhhcyBwcm92aWRlZCBhIGBfbm9udGVybWluYWxgIHNlbWFudGljXG4gICAgICAvLyBhY3Rpb24sIHdlIGludm9rZSBpdDpcbiAgICAgIGlmIChub2RlV3JhcHBlci5pc05vbnRlcm1pbmFsKCkpIHtcbiAgICAgICAgYWN0aW9uRm4gPSB0aGlzLmFjdGlvbkRpY3QuX25vbnRlcm1pbmFsO1xuICAgICAgICBpZiAoYWN0aW9uRm4pIHtcbiAgICAgICAgICBnbG9iYWxBY3Rpb25TdGFjay5wdXNoKFt0aGlzLCAnX25vbnRlcm1pbmFsJywgY3Rvck5hbWVdKTtcbiAgICAgICAgICByZXR1cm4gYWN0aW9uRm4uYXBwbHkobm9kZVdyYXBwZXIsIG5vZGVXcmFwcGVyLl9jaGlsZHJlbigpKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBPdGhlcndpc2UsIHdlIGludm9rZSB0aGUgJ19kZWZhdWx0JyBzZW1hbnRpYyBhY3Rpb24uXG4gICAgICBnbG9iYWxBY3Rpb25TdGFjay5wdXNoKFt0aGlzLCAnZGVmYXVsdCBhY3Rpb24nLCBjdG9yTmFtZV0pO1xuICAgICAgcmV0dXJuIHRoaXMuYWN0aW9uRGljdC5fZGVmYXVsdC5hcHBseShub2RlV3JhcHBlciwgbm9kZVdyYXBwZXIuX2NoaWxkcmVuKCkpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBnbG9iYWxBY3Rpb25TdGFjay5wb3AoKTtcbiAgICB9XG4gIH1cbn1cblxuT3BlcmF0aW9uLnByb3RvdHlwZS50eXBlTmFtZSA9ICdvcGVyYXRpb24nO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLSBBdHRyaWJ1dGUgLS0tLS0tLS0tLS0tLS0tLS1cblxuLy8gQXR0cmlidXRlcyBhcmUgT3BlcmF0aW9ucyB3aG9zZSByZXN1bHRzIGFyZSBtZW1vaXplZC4gVGhpcyBtZWFucyB0aGF0LCBmb3IgYW55IGdpdmVuIHNlbWFudGljcyxcbi8vIHRoZSBzZW1hbnRpYyBhY3Rpb24gZm9yIGEgQ1NUIG5vZGUgd2lsbCBiZSBpbnZva2VkIG5vIG1vcmUgdGhhbiBvbmNlLlxuY2xhc3MgQXR0cmlidXRlIGV4dGVuZHMgT3BlcmF0aW9uIHtcbiAgY29uc3RydWN0b3IobmFtZSwgYWN0aW9uRGljdCwgYnVpbHRJbkRlZmF1bHQpIHtcbiAgICBzdXBlcihuYW1lLCBbXSwgYWN0aW9uRGljdCwgYnVpbHRJbkRlZmF1bHQpO1xuICB9XG5cbiAgZXhlY3V0ZShzZW1hbnRpY3MsIG5vZGVXcmFwcGVyKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5vZGVXcmFwcGVyLl9ub2RlO1xuICAgIGNvbnN0IGtleSA9IHNlbWFudGljcy5hdHRyaWJ1dGVLZXlzW3RoaXMubmFtZV07XG4gICAgaWYgKCFoYXNPd25Qcm9wZXJ0eShub2RlLCBrZXkpKSB7XG4gICAgICAvLyBUaGUgZm9sbG93aW5nIGlzIGEgc3VwZXItc2VuZCAtLSBpc24ndCBKUyBiZWF1dGlmdWw/IDovXG4gICAgICBub2RlW2tleV0gPSBPcGVyYXRpb24ucHJvdG90eXBlLmV4ZWN1dGUuY2FsbCh0aGlzLCBzZW1hbnRpY3MsIG5vZGVXcmFwcGVyKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGVba2V5XTtcbiAgfVxufVxuXG5BdHRyaWJ1dGUucHJvdG90eXBlLnR5cGVOYW1lID0gJ2F0dHJpYnV0ZSc7XG4iLCJpbXBvcnQge01hdGNoZXJ9IGZyb20gJy4vTWF0Y2hlci5qcyc7XG5pbXBvcnQge1NlbWFudGljc30gZnJvbSAnLi9TZW1hbnRpY3MuanMnO1xuaW1wb3J0ICogYXMgY29tbW9uIGZyb20gJy4vY29tbW9uLmpzJztcbmltcG9ydCAqIGFzIGVycm9ycyBmcm9tICcuL2Vycm9ycy5qcyc7XG5pbXBvcnQgKiBhcyBwZXhwcnMgZnJvbSAnLi9wZXhwcnMuanMnO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUHJpdmF0ZSBzdHVmZlxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgU1BFQ0lBTF9BQ1RJT05fTkFNRVMgPSBbJ19pdGVyJywgJ190ZXJtaW5hbCcsICdfbm9udGVybWluYWwnLCAnX2RlZmF1bHQnXTtcblxuZnVuY3Rpb24gZ2V0U29ydGVkUnVsZVZhbHVlcyhncmFtbWFyKSB7XG4gIHJldHVybiBPYmplY3Qua2V5cyhncmFtbWFyLnJ1bGVzKVxuICAgICAgLnNvcnQoKVxuICAgICAgLm1hcChuYW1lID0+IGdyYW1tYXIucnVsZXNbbmFtZV0pO1xufVxuXG4vLyBVbnRpbCBFUzIwMTksIEpTT04gd2FzIG5vdCBhIHZhbGlkIHN1YnNldCBvZiBKYXZhU2NyaXB0IGJlY2F1c2UgVSsyMDI4IChsaW5lIHNlcGFyYXRvcilcbi8vIGFuZCBVKzIwMjkgKHBhcmFncmFwaCBzZXBhcmF0b3IpIGFyZSBhbGxvd2VkIGluIEpTT04gc3RyaW5nIGxpdGVyYWxzLCBidXQgbm90IGluIEpTLlxuLy8gVGhpcyBmdW5jdGlvbiBwcm9wZXJseSBlbmNvZGVzIHRob3NlIHR3byBjaGFyYWN0ZXJzIHNvIHRoYXQgdGhlIHJlc3VsdGluZyBzdHJpbmcgaXNcbi8vIHJlcHJlc2VudHMgYm90aCB2YWxpZCBKU09OLCBhbmQgdmFsaWQgSmF2YVNjcmlwdCAoZm9yIEVTMjAxOCBhbmQgYmVsb3cpLlxuLy8gU2VlIGh0dHBzOi8vdjguZGV2L2ZlYXR1cmVzL3N1YnN1bWUtanNvbiBmb3IgbW9yZSBkZXRhaWxzLlxuY29uc3QganNvblRvSlMgPSBzdHIgPT4gc3RyLnJlcGxhY2UoL1xcdTIwMjgvZywgJ1xcXFx1MjAyOCcpLnJlcGxhY2UoL1xcdTIwMjkvZywgJ1xcXFx1MjAyOScpO1xuXG5sZXQgb2htR3JhbW1hcjtcbmxldCBidWlsZEdyYW1tYXI7XG5cbmV4cG9ydCBjbGFzcyBHcmFtbWFyIHtcbiAgY29uc3RydWN0b3IobmFtZSwgc3VwZXJHcmFtbWFyLCBydWxlcywgb3B0RGVmYXVsdFN0YXJ0UnVsZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgdGhpcy5zdXBlckdyYW1tYXIgPSBzdXBlckdyYW1tYXI7XG4gICAgdGhpcy5ydWxlcyA9IHJ1bGVzO1xuICAgIGlmIChvcHREZWZhdWx0U3RhcnRSdWxlKSB7XG4gICAgICBpZiAoIShvcHREZWZhdWx0U3RhcnRSdWxlIGluIHJ1bGVzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBcIkludmFsaWQgc3RhcnQgcnVsZTogJ1wiICtcbiAgICAgICAgICAgIG9wdERlZmF1bHRTdGFydFJ1bGUgK1xuICAgICAgICAgICAgXCInIGlzIG5vdCBhIHJ1bGUgaW4gZ3JhbW1hciAnXCIgK1xuICAgICAgICAgICAgbmFtZSArXG4gICAgICAgICAgICBcIidcIixcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuZGVmYXVsdFN0YXJ0UnVsZSA9IG9wdERlZmF1bHRTdGFydFJ1bGU7XG4gICAgfVxuICAgIHRoaXMuX21hdGNoU3RhdGVJbml0aWFsaXplciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLnN1cHBvcnRzSW5jcmVtZW50YWxQYXJzaW5nID0gdHJ1ZTtcbiAgfVxuXG4gIG1hdGNoZXIoKSB7XG4gICAgcmV0dXJuIG5ldyBNYXRjaGVyKHRoaXMpO1xuICB9XG5cbiAgLy8gUmV0dXJuIHRydWUgaWYgdGhlIGdyYW1tYXIgaXMgYSBidWlsdC1pbiBncmFtbWFyLCBvdGhlcndpc2UgZmFsc2UuXG4gIC8vIE5PVEU6IFRoaXMgbWlnaHQgZ2l2ZSBhbiB1bmV4cGVjdGVkIHJlc3VsdCBpZiBjYWxsZWQgYmVmb3JlIEJ1aWx0SW5SdWxlcyBpcyBkZWZpbmVkIVxuICBpc0J1aWx0SW4oKSB7XG4gICAgcmV0dXJuIHRoaXMgPT09IEdyYW1tYXIuUHJvdG9CdWlsdEluUnVsZXMgfHwgdGhpcyA9PT0gR3JhbW1hci5CdWlsdEluUnVsZXM7XG4gIH1cblxuICBlcXVhbHMoZykge1xuICAgIGlmICh0aGlzID09PSBnKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgLy8gRG8gdGhlIGNoZWFwZXN0IGNvbXBhcmlzb25zIGZpcnN0LlxuICAgIGlmIChcbiAgICAgIGcgPT0gbnVsbCB8fFxuICAgICAgdGhpcy5uYW1lICE9PSBnLm5hbWUgfHxcbiAgICAgIHRoaXMuZGVmYXVsdFN0YXJ0UnVsZSAhPT0gZy5kZWZhdWx0U3RhcnRSdWxlIHx8XG4gICAgICAhKHRoaXMuc3VwZXJHcmFtbWFyID09PSBnLnN1cGVyR3JhbW1hciB8fCB0aGlzLnN1cGVyR3JhbW1hci5lcXVhbHMoZy5zdXBlckdyYW1tYXIpKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBjb25zdCBteVJ1bGVzID0gZ2V0U29ydGVkUnVsZVZhbHVlcyh0aGlzKTtcbiAgICBjb25zdCBvdGhlclJ1bGVzID0gZ2V0U29ydGVkUnVsZVZhbHVlcyhnKTtcbiAgICByZXR1cm4gKFxuICAgICAgbXlSdWxlcy5sZW5ndGggPT09IG90aGVyUnVsZXMubGVuZ3RoICYmXG4gICAgICBteVJ1bGVzLmV2ZXJ5KChydWxlLCBpKSA9PiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgcnVsZS5kZXNjcmlwdGlvbiA9PT0gb3RoZXJSdWxlc1tpXS5kZXNjcmlwdGlvbiAmJlxuICAgICAgICAgIHJ1bGUuZm9ybWFscy5qb2luKCcsJykgPT09IG90aGVyUnVsZXNbaV0uZm9ybWFscy5qb2luKCcsJykgJiZcbiAgICAgICAgICBydWxlLmJvZHkudG9TdHJpbmcoKSA9PT0gb3RoZXJSdWxlc1tpXS5ib2R5LnRvU3RyaW5nKClcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgKTtcbiAgfVxuXG4gIG1hdGNoKGlucHV0LCBvcHRTdGFydEFwcGxpY2F0aW9uKSB7XG4gICAgY29uc3QgbSA9IHRoaXMubWF0Y2hlcigpO1xuICAgIG0ucmVwbGFjZUlucHV0UmFuZ2UoMCwgMCwgaW5wdXQpO1xuICAgIHJldHVybiBtLm1hdGNoKG9wdFN0YXJ0QXBwbGljYXRpb24pO1xuICB9XG5cbiAgdHJhY2UoaW5wdXQsIG9wdFN0YXJ0QXBwbGljYXRpb24pIHtcbiAgICBjb25zdCBtID0gdGhpcy5tYXRjaGVyKCk7XG4gICAgbS5yZXBsYWNlSW5wdXRSYW5nZSgwLCAwLCBpbnB1dCk7XG4gICAgcmV0dXJuIG0udHJhY2Uob3B0U3RhcnRBcHBsaWNhdGlvbik7XG4gIH1cblxuICBjcmVhdGVTZW1hbnRpY3MoKSB7XG4gICAgcmV0dXJuIFNlbWFudGljcy5jcmVhdGVTZW1hbnRpY3ModGhpcyk7XG4gIH1cblxuICBleHRlbmRTZW1hbnRpY3Moc3VwZXJTZW1hbnRpY3MpIHtcbiAgICByZXR1cm4gU2VtYW50aWNzLmNyZWF0ZVNlbWFudGljcyh0aGlzLCBzdXBlclNlbWFudGljcy5fZ2V0U2VtYW50aWNzKCkpO1xuICB9XG5cbiAgLy8gQ2hlY2sgdGhhdCBldmVyeSBrZXkgaW4gYGFjdGlvbkRpY3RgIGNvcnJlc3BvbmRzIHRvIGEgc2VtYW50aWMgYWN0aW9uLCBhbmQgdGhhdCBpdCBtYXBzIHRvXG4gIC8vIGEgZnVuY3Rpb24gb2YgdGhlIGNvcnJlY3QgYXJpdHkuIElmIG5vdCwgdGhyb3cgYW4gZXhjZXB0aW9uLlxuICBfY2hlY2tUb3BEb3duQWN0aW9uRGljdCh3aGF0LCBuYW1lLCBhY3Rpb25EaWN0KSB7XG4gICAgY29uc3QgcHJvYmxlbXMgPSBbXTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBndWFyZC1mb3ItaW5cbiAgICBmb3IgKGNvbnN0IGsgaW4gYWN0aW9uRGljdCkge1xuICAgICAgY29uc3QgdiA9IGFjdGlvbkRpY3Rba107XG4gICAgICBjb25zdCBpc1NwZWNpYWxBY3Rpb24gPSBTUEVDSUFMX0FDVElPTl9OQU1FUy5pbmNsdWRlcyhrKTtcblxuICAgICAgaWYgKCFpc1NwZWNpYWxBY3Rpb24gJiYgIShrIGluIHRoaXMucnVsZXMpKSB7XG4gICAgICAgIHByb2JsZW1zLnB1c2goYCcke2t9JyBpcyBub3QgYSB2YWxpZCBzZW1hbnRpYyBhY3Rpb24gZm9yICcke3RoaXMubmFtZX0nYCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiB2ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHByb2JsZW1zLnB1c2goYCcke2t9JyBtdXN0IGJlIGEgZnVuY3Rpb24gaW4gYW4gYWN0aW9uIGRpY3Rpb25hcnkgZm9yICcke3RoaXMubmFtZX0nYCk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgYWN0dWFsID0gdi5sZW5ndGg7XG4gICAgICBjb25zdCBleHBlY3RlZCA9IHRoaXMuX3RvcERvd25BY3Rpb25Bcml0eShrKTtcbiAgICAgIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgICAgIGxldCBkZXRhaWxzO1xuICAgICAgICBpZiAoayA9PT0gJ19pdGVyJyB8fCBrID09PSAnX25vbnRlcm1pbmFsJykge1xuICAgICAgICAgIGRldGFpbHMgPVxuICAgICAgICAgICAgYGl0IHNob3VsZCB1c2UgYSByZXN0IHBhcmFtZXRlciwgZS5nLiBcXGAke2t9KC4uLmNoaWxkcmVuKSB7fVxcYC4gYCArXG4gICAgICAgICAgICAnTk9URTogdGhpcyBpcyBuZXcgaW4gT2htIHYxNiDigJQgc2VlIGh0dHBzOi8vb2htanMub3JnL2QvYXRpIGZvciBkZXRhaWxzLic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZGV0YWlscyA9IGBleHBlY3RlZCAke2V4cGVjdGVkfSwgZ290ICR7YWN0dWFsfWA7XG4gICAgICAgIH1cbiAgICAgICAgcHJvYmxlbXMucHVzaChgU2VtYW50aWMgYWN0aW9uICcke2t9JyBoYXMgdGhlIHdyb25nIGFyaXR5OiAke2RldGFpbHN9YCk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChwcm9ibGVtcy5sZW5ndGggPiAwKSB7XG4gICAgICBjb25zdCBwcmV0dHlQcm9ibGVtcyA9IHByb2JsZW1zLm1hcChwcm9ibGVtID0+ICctICcgKyBwcm9ibGVtKTtcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKFxuICAgICAgICAgIFtcbiAgICAgICAgICAgIGBGb3VuZCBlcnJvcnMgaW4gdGhlIGFjdGlvbiBkaWN0aW9uYXJ5IG9mIHRoZSAnJHtuYW1lfScgJHt3aGF0fTpgLFxuICAgICAgICAgICAgLi4ucHJldHR5UHJvYmxlbXMsXG4gICAgICAgICAgXS5qb2luKCdcXG4nKSxcbiAgICAgICk7XG4gICAgICBlcnJvci5wcm9ibGVtcyA9IHByb2JsZW1zO1xuICAgICAgdGhyb3cgZXJyb3I7XG4gICAgfVxuICB9XG5cbiAgLy8gUmV0dXJuIHRoZSBleHBlY3RlZCBhcml0eSBmb3IgYSBzZW1hbnRpYyBhY3Rpb24gbmFtZWQgYGFjdGlvbk5hbWVgLCB3aGljaFxuICAvLyBpcyBlaXRoZXIgYSBydWxlIG5hbWUgb3IgYSBzcGVjaWFsIGFjdGlvbiBuYW1lIGxpa2UgJ19ub250ZXJtaW5hbCcuXG4gIF90b3BEb3duQWN0aW9uQXJpdHkoYWN0aW9uTmFtZSkge1xuICAgIC8vIEFsbCBzcGVjaWFsIGFjdGlvbnMgaGF2ZSBhbiBleHBlY3RlZCBhcml0eSBvZiAwLCB0aG91Z2ggYWxsIGJ1dCBfdGVybWluYWxcbiAgICAvLyBhcmUgZXhwZWN0ZWQgdG8gdXNlIHRoZSByZXN0IHBhcmFtZXRlciBzeW50YXggKGUuZy4gYF9pdGVyKC4uLmNoaWxkcmVuKWApLlxuICAgIC8vIFRoaXMgaXMgY29uc2lkZXJlZCB0byBoYXZlIGFyaXR5IDAsIGkuZS4gYCgoLi4uYXJncykgPT4ge30pLmxlbmd0aGAgaXMgMC5cbiAgICByZXR1cm4gU1BFQ0lBTF9BQ1RJT05fTkFNRVMuaW5jbHVkZXMoYWN0aW9uTmFtZSkgP1xuICAgICAgMCA6XG4gICAgICB0aGlzLnJ1bGVzW2FjdGlvbk5hbWVdLmJvZHkuZ2V0QXJpdHkoKTtcbiAgfVxuXG4gIF9pbmhlcml0c0Zyb20oZ3JhbW1hcikge1xuICAgIGxldCBnID0gdGhpcy5zdXBlckdyYW1tYXI7XG4gICAgd2hpbGUgKGcpIHtcbiAgICAgIGlmIChnLmVxdWFscyhncmFtbWFyLCB0cnVlKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGcgPSBnLnN1cGVyR3JhbW1hcjtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgdG9SZWNpcGUoc3VwZXJHcmFtbWFyRXhwciA9IHVuZGVmaW5lZCkge1xuICAgIGNvbnN0IG1ldGFJbmZvID0ge307XG4gICAgLy8gSW5jbHVkZSB0aGUgZ3JhbW1hciBzb3VyY2UgaWYgaXQgaXMgYXZhaWxhYmxlLlxuICAgIGlmICh0aGlzLnNvdXJjZSkge1xuICAgICAgbWV0YUluZm8uc291cmNlID0gdGhpcy5zb3VyY2UuY29udGVudHM7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0UnVsZSA9IG51bGw7XG4gICAgaWYgKHRoaXMuZGVmYXVsdFN0YXJ0UnVsZSkge1xuICAgICAgc3RhcnRSdWxlID0gdGhpcy5kZWZhdWx0U3RhcnRSdWxlO1xuICAgIH1cblxuICAgIGNvbnN0IHJ1bGVzID0ge307XG4gICAgT2JqZWN0LmtleXModGhpcy5ydWxlcykuZm9yRWFjaChydWxlTmFtZSA9PiB7XG4gICAgICBjb25zdCBydWxlSW5mbyA9IHRoaXMucnVsZXNbcnVsZU5hbWVdO1xuICAgICAgY29uc3Qge2JvZHl9ID0gcnVsZUluZm87XG4gICAgICBjb25zdCBpc0RlZmluaXRpb24gPSAhdGhpcy5zdXBlckdyYW1tYXIgfHwgIXRoaXMuc3VwZXJHcmFtbWFyLnJ1bGVzW3J1bGVOYW1lXTtcblxuICAgICAgbGV0IG9wZXJhdGlvbjtcbiAgICAgIGlmIChpc0RlZmluaXRpb24pIHtcbiAgICAgICAgb3BlcmF0aW9uID0gJ2RlZmluZSc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBvcGVyYXRpb24gPSBib2R5IGluc3RhbmNlb2YgcGV4cHJzLkV4dGVuZCA/ICdleHRlbmQnIDogJ292ZXJyaWRlJztcbiAgICAgIH1cblxuICAgICAgY29uc3QgbWV0YUluZm8gPSB7fTtcbiAgICAgIGlmIChydWxlSW5mby5zb3VyY2UgJiYgdGhpcy5zb3VyY2UpIHtcbiAgICAgICAgY29uc3QgYWRqdXN0ZWQgPSBydWxlSW5mby5zb3VyY2UucmVsYXRpdmVUbyh0aGlzLnNvdXJjZSk7XG4gICAgICAgIG1ldGFJbmZvLnNvdXJjZUludGVydmFsID0gW2FkanVzdGVkLnN0YXJ0SWR4LCBhZGp1c3RlZC5lbmRJZHhdO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkZXNjcmlwdGlvbiA9IGlzRGVmaW5pdGlvbiA/IHJ1bGVJbmZvLmRlc2NyaXB0aW9uIDogbnVsbDtcbiAgICAgIGNvbnN0IGJvZHlSZWNpcGUgPSBib2R5Lm91dHB1dFJlY2lwZShydWxlSW5mby5mb3JtYWxzLCB0aGlzLnNvdXJjZSk7XG5cbiAgICAgIHJ1bGVzW3J1bGVOYW1lXSA9IFtcbiAgICAgICAgb3BlcmF0aW9uLCAvLyBcImRlZmluZVwiL1wiZXh0ZW5kXCIvXCJvdmVycmlkZVwiXG4gICAgICAgIG1ldGFJbmZvLFxuICAgICAgICBkZXNjcmlwdGlvbixcbiAgICAgICAgcnVsZUluZm8uZm9ybWFscyxcbiAgICAgICAgYm9keVJlY2lwZSxcbiAgICAgIF07XG4gICAgfSk7XG5cbiAgICAvLyBJZiB0aGUgY2FsbGVyIHByb3ZpZGVkIGFuIGV4cHJlc3Npb24gdG8gdXNlIGZvciB0aGUgc3VwZXJncmFtbWFyLCB1c2UgdGhhdC5cbiAgICAvLyBPdGhlcndpc2UsIGlmIHRoZSBzdXBlcmdyYW1tYXIgaXMgYSB1c2VyIGdyYW1tYXIsIHVzZSBpdHMgcmVjaXBlIGlubGluZS5cbiAgICBsZXQgc3VwZXJHcmFtbWFyT3V0cHV0ID0gJ251bGwnO1xuICAgIGlmIChzdXBlckdyYW1tYXJFeHByKSB7XG4gICAgICBzdXBlckdyYW1tYXJPdXRwdXQgPSBzdXBlckdyYW1tYXJFeHByO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdXBlckdyYW1tYXIgJiYgIXRoaXMuc3VwZXJHcmFtbWFyLmlzQnVpbHRJbigpKSB7XG4gICAgICBzdXBlckdyYW1tYXJPdXRwdXQgPSB0aGlzLnN1cGVyR3JhbW1hci50b1JlY2lwZSgpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlY2lwZUVsZW1lbnRzID0gW1xuICAgICAgLi4uWydncmFtbWFyJywgbWV0YUluZm8sIHRoaXMubmFtZV0ubWFwKEpTT04uc3RyaW5naWZ5KSxcbiAgICAgIHN1cGVyR3JhbW1hck91dHB1dCxcbiAgICAgIC4uLltzdGFydFJ1bGUsIHJ1bGVzXS5tYXAoSlNPTi5zdHJpbmdpZnkpLFxuICAgIF07XG4gICAgcmV0dXJuIGpzb25Ub0pTKGBbJHtyZWNpcGVFbGVtZW50cy5qb2luKCcsJyl9XWApO1xuICB9XG5cbiAgLy8gVE9ETzogQ29tZSB1cCB3aXRoIGJldHRlciBuYW1lcyBmb3IgdGhlc2UgbWV0aG9kcy5cbiAgLy8gVE9ETzogV3JpdGUgdGhlIGFuYWxvZyBvZiB0aGVzZSBtZXRob2RzIGZvciBpbmhlcml0ZWQgYXR0cmlidXRlcy5cbiAgdG9PcGVyYXRpb25BY3Rpb25EaWN0aW9uYXJ5VGVtcGxhdGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuX3RvT3BlcmF0aW9uT3JBdHRyaWJ1dGVBY3Rpb25EaWN0aW9uYXJ5VGVtcGxhdGUoKTtcbiAgfVxuICB0b0F0dHJpYnV0ZUFjdGlvbkRpY3Rpb25hcnlUZW1wbGF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5fdG9PcGVyYXRpb25PckF0dHJpYnV0ZUFjdGlvbkRpY3Rpb25hcnlUZW1wbGF0ZSgpO1xuICB9XG5cbiAgX3RvT3BlcmF0aW9uT3JBdHRyaWJ1dGVBY3Rpb25EaWN0aW9uYXJ5VGVtcGxhdGUoKSB7XG4gICAgLy8gVE9ETzogYWRkIHRoZSBzdXBlci1ncmFtbWFyJ3MgdGVtcGxhdGVzIGF0IHRoZSByaWdodCBwbGFjZSwgZS5nLiwgYSBjYXNlIGZvciBBZGRFeHByX3BsdXNcbiAgICAvLyBzaG91bGQgYXBwZWFyIG5leHQgdG8gb3RoZXIgY2FzZXMgb2YgQWRkRXhwci5cblxuICAgIGNvbnN0IHNiID0gbmV3IGNvbW1vbi5TdHJpbmdCdWZmZXIoKTtcbiAgICBzYi5hcHBlbmQoJ3snKTtcblxuICAgIGxldCBmaXJzdCA9IHRydWU7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIGd1YXJkLWZvci1pblxuICAgIGZvciAoY29uc3QgcnVsZU5hbWUgaW4gdGhpcy5ydWxlcykge1xuICAgICAgY29uc3Qge2JvZHl9ID0gdGhpcy5ydWxlc1tydWxlTmFtZV07XG4gICAgICBpZiAoZmlyc3QpIHtcbiAgICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNiLmFwcGVuZCgnLCcpO1xuICAgICAgfVxuICAgICAgc2IuYXBwZW5kKCdcXG4nKTtcbiAgICAgIHNiLmFwcGVuZCgnICAnKTtcbiAgICAgIHRoaXMuYWRkU2VtYW50aWNBY3Rpb25UZW1wbGF0ZShydWxlTmFtZSwgYm9keSwgc2IpO1xuICAgIH1cblxuICAgIHNiLmFwcGVuZCgnXFxufScpO1xuICAgIHJldHVybiBzYi5jb250ZW50cygpO1xuICB9XG5cbiAgYWRkU2VtYW50aWNBY3Rpb25UZW1wbGF0ZShydWxlTmFtZSwgYm9keSwgc2IpIHtcbiAgICBzYi5hcHBlbmQocnVsZU5hbWUpO1xuICAgIHNiLmFwcGVuZCgnOiBmdW5jdGlvbignKTtcbiAgICBjb25zdCBhcml0eSA9IHRoaXMuX3RvcERvd25BY3Rpb25Bcml0eShydWxlTmFtZSk7XG4gICAgc2IuYXBwZW5kKGNvbW1vbi5yZXBlYXQoJ18nLCBhcml0eSkuam9pbignLCAnKSk7XG4gICAgc2IuYXBwZW5kKCcpIHtcXG4nKTtcbiAgICBzYi5hcHBlbmQoJyAgfScpO1xuICB9XG5cbiAgLy8gUGFyc2UgYSBzdHJpbmcgd2hpY2ggZXhwcmVzc2VzIGEgcnVsZSBhcHBsaWNhdGlvbiBpbiB0aGlzIGdyYW1tYXIsIGFuZCByZXR1cm4gdGhlXG4gIC8vIHJlc3VsdGluZyBBcHBseSBub2RlLlxuICBwYXJzZUFwcGxpY2F0aW9uKHN0cikge1xuICAgIGxldCBhcHA7XG4gICAgaWYgKHN0ci5pbmRleE9mKCc8JykgPT09IC0xKSB7XG4gICAgICAvLyBzaW1wbGUgYXBwbGljYXRpb25cbiAgICAgIGFwcCA9IG5ldyBwZXhwcnMuQXBwbHkoc3RyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gcGFyYW1ldGVyaXplZCBhcHBsaWNhdGlvblxuICAgICAgY29uc3QgY3N0ID0gb2htR3JhbW1hci5tYXRjaChzdHIsICdCYXNlX2FwcGxpY2F0aW9uJyk7XG4gICAgICBhcHAgPSBidWlsZEdyYW1tYXIoY3N0LCB7fSk7XG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGFwcGxpY2F0aW9uIGlzIHZhbGlkLlxuICAgIGlmICghKGFwcC5ydWxlTmFtZSBpbiB0aGlzLnJ1bGVzKSkge1xuICAgICAgdGhyb3cgZXJyb3JzLnVuZGVjbGFyZWRSdWxlKGFwcC5ydWxlTmFtZSwgdGhpcy5uYW1lKTtcbiAgICB9XG4gICAgY29uc3Qge2Zvcm1hbHN9ID0gdGhpcy5ydWxlc1thcHAucnVsZU5hbWVdO1xuICAgIGlmIChmb3JtYWxzLmxlbmd0aCAhPT0gYXBwLmFyZ3MubGVuZ3RoKSB7XG4gICAgICBjb25zdCB7c291cmNlfSA9IHRoaXMucnVsZXNbYXBwLnJ1bGVOYW1lXTtcbiAgICAgIHRocm93IGVycm9ycy53cm9uZ051bWJlck9mUGFyYW1ldGVycyhcbiAgICAgICAgICBhcHAucnVsZU5hbWUsXG4gICAgICAgICAgZm9ybWFscy5sZW5ndGgsXG4gICAgICAgICAgYXBwLmFyZ3MubGVuZ3RoLFxuICAgICAgICAgIHNvdXJjZSxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiBhcHA7XG4gIH1cblxuICBfc2V0VXBNYXRjaFN0YXRlKHN0YXRlKSB7XG4gICAgaWYgKHRoaXMuX21hdGNoU3RhdGVJbml0aWFsaXplcikge1xuICAgICAgdGhpcy5fbWF0Y2hTdGF0ZUluaXRpYWxpemVyKHN0YXRlKTtcbiAgICB9XG4gIH1cbn1cblxuLy8gVGhlIGZvbGxvd2luZyBncmFtbWFyIGNvbnRhaW5zIGEgZmV3IHJ1bGVzIHRoYXQgY291bGRuJ3QgYmUgd3JpdHRlbiAgaW4gXCJ1c2VybGFuZFwiLlxuLy8gQXQgdGhlIGJvdHRvbSBvZiBzcmMvbWFpbi5qcywgd2UgY3JlYXRlIGEgc3ViLWdyYW1tYXIgb2YgdGhpcyBncmFtbWFyIHRoYXQncyBjYWxsZWRcbi8vIGBCdWlsdEluUnVsZXNgLiBUaGF0IGdyYW1tYXIgY29udGFpbnMgc2V2ZXJhbCBjb252ZW5pZW5jZSBydWxlcywgZS5nLiwgYGxldHRlcmAgYW5kXG4vLyBgZGlnaXRgLCBhbmQgaXMgaW1wbGljaXRseSB0aGUgc3VwZXItZ3JhbW1hciBvZiBhbnkgZ3JhbW1hciB3aG9zZSBzdXBlci1ncmFtbWFyXG4vLyBpc24ndCBzcGVjaWZpZWQuXG5HcmFtbWFyLlByb3RvQnVpbHRJblJ1bGVzID0gbmV3IEdyYW1tYXIoXG4gICAgJ1Byb3RvQnVpbHRJblJ1bGVzJywgLy8gbmFtZVxuICAgIHVuZGVmaW5lZCwgLy8gc3VwZXJncmFtbWFyXG4gICAge1xuICAgICAgYW55OiB7XG4gICAgICAgIGJvZHk6IHBleHBycy5hbnksXG4gICAgICAgIGZvcm1hbHM6IFtdLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ2FueSBjaGFyYWN0ZXInLFxuICAgICAgICBwcmltaXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgICAgZW5kOiB7XG4gICAgICAgIGJvZHk6IHBleHBycy5lbmQsXG4gICAgICAgIGZvcm1hbHM6IFtdLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ2VuZCBvZiBpbnB1dCcsXG4gICAgICAgIHByaW1pdGl2ZTogdHJ1ZSxcbiAgICAgIH0sXG5cbiAgICAgIGNhc2VJbnNlbnNpdGl2ZToge1xuICAgICAgICBib2R5OiBuZXcgcGV4cHJzLkNhc2VJbnNlbnNpdGl2ZVRlcm1pbmFsKG5ldyBwZXhwcnMuUGFyYW0oMCkpLFxuICAgICAgICBmb3JtYWxzOiBbJ3N0ciddLFxuICAgICAgICBwcmltaXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgICAgbG93ZXI6IHtcbiAgICAgICAgYm9keTogbmV3IHBleHBycy5Vbmljb2RlQ2hhcignTGwnKSxcbiAgICAgICAgZm9ybWFsczogW10sXG4gICAgICAgIGRlc2NyaXB0aW9uOiAnYSBsb3dlcmNhc2UgbGV0dGVyJyxcbiAgICAgICAgcHJpbWl0aXZlOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHVwcGVyOiB7XG4gICAgICAgIGJvZHk6IG5ldyBwZXhwcnMuVW5pY29kZUNoYXIoJ0x1JyksXG4gICAgICAgIGZvcm1hbHM6IFtdLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ2FuIHVwcGVyY2FzZSBsZXR0ZXInLFxuICAgICAgICBwcmltaXRpdmU6IHRydWUsXG4gICAgICB9LFxuICAgICAgLy8gVW5pb24gb2YgTHQgKHRpdGxlY2FzZSksIExtIChtb2RpZmllciksIGFuZCBMbyAob3RoZXIpLCBpLmUuIGFueSBsZXR0ZXIgbm90IGluIExsIG9yIEx1LlxuICAgICAgdW5pY29kZUx0bW86IHtcbiAgICAgICAgYm9keTogbmV3IHBleHBycy5Vbmljb2RlQ2hhcignTHRtbycpLFxuICAgICAgICBmb3JtYWxzOiBbXSxcbiAgICAgICAgZGVzY3JpcHRpb246ICdhIFVuaWNvZGUgY2hhcmFjdGVyIGluIEx0LCBMbSwgb3IgTG8nLFxuICAgICAgICBwcmltaXRpdmU6IHRydWUsXG4gICAgICB9LFxuXG4gICAgICAvLyBUaGVzZSBydWxlcyBhcmUgbm90IHRydWx5IHByaW1pdGl2ZSAodGhleSBjb3VsZCBiZSB3cml0dGVuIGluIHVzZXJsYW5kKSBidXQgYXJlIGRlZmluZWRcbiAgICAgIC8vIGhlcmUgZm9yIGJvb3RzdHJhcHBpbmcgcHVycG9zZXMuXG4gICAgICBzcGFjZXM6IHtcbiAgICAgICAgYm9keTogbmV3IHBleHBycy5TdGFyKG5ldyBwZXhwcnMuQXBwbHkoJ3NwYWNlJykpLFxuICAgICAgICBmb3JtYWxzOiBbXSxcbiAgICAgIH0sXG4gICAgICBzcGFjZToge1xuICAgICAgICBib2R5OiBuZXcgcGV4cHJzLlJhbmdlKCdcXHgwMCcsICcgJyksXG4gICAgICAgIGZvcm1hbHM6IFtdLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ2Egc3BhY2UnLFxuICAgICAgfSxcbiAgICB9LFxuKTtcblxuLy8gVGhpcyBtZXRob2QgaXMgY2FsbGVkIGZyb20gbWFpbi5qcyBvbmNlIE9obSBoYXMgbG9hZGVkLlxuR3JhbW1hci5pbml0QXBwbGljYXRpb25QYXJzZXIgPSBmdW5jdGlvbihncmFtbWFyLCBidWlsZGVyRm4pIHtcbiAgb2htR3JhbW1hciA9IGdyYW1tYXI7XG4gIGJ1aWxkR3JhbW1hciA9IGJ1aWxkZXJGbjtcbn07XG4iLCJpbXBvcnQge0dyYW1tYXJ9IGZyb20gJy4vR3JhbW1hci5qcyc7XG5pbXBvcnQge0lucHV0U3RyZWFtfSBmcm9tICcuL0lucHV0U3RyZWFtLmpzJztcbmltcG9ydCB7Z2V0RHVwbGljYXRlc30gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy5qcyc7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBQcml2YXRlIFN0dWZmXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBDb25zdHJ1Y3RvcnNcblxuZXhwb3J0IGNsYXNzIEdyYW1tYXJEZWNsIHtcbiAgY29uc3RydWN0b3IobmFtZSkge1xuICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gIH1cblxuICAvLyBIZWxwZXJzXG5cbiAgc291cmNlSW50ZXJ2YWwoc3RhcnRJZHgsIGVuZElkeCkge1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zdWJJbnRlcnZhbChzdGFydElkeCwgZW5kSWR4IC0gc3RhcnRJZHgpO1xuICB9XG5cbiAgZW5zdXJlU3VwZXJHcmFtbWFyKCkge1xuICAgIGlmICghdGhpcy5zdXBlckdyYW1tYXIpIHtcbiAgICAgIHRoaXMud2l0aFN1cGVyR3JhbW1hcihcbiAgICAgICAgLy8gVE9ETzogVGhlIGNvbmRpdGlvbmFsIGV4cHJlc3Npb24gYmVsb3cgaXMgYW4gdWdseSBoYWNrLiBJdCdzIGtpbmQgb2Ygb2sgYmVjYXVzZVxuICAgICAgICAvLyBJIGRvdWJ0IGFueW9uZSB3aWxsIGV2ZXIgdHJ5IHRvIGRlY2xhcmUgYSBncmFtbWFyIGNhbGxlZCBgQnVpbHRJblJ1bGVzYC4gU3RpbGwsXG4gICAgICAgIC8vIHdlIHNob3VsZCB0cnkgdG8gZmluZCBhIGJldHRlciB3YXkgdG8gZG8gdGhpcy5cbiAgICAgICAgdGhpcy5uYW1lID09PSAnQnVpbHRJblJ1bGVzJyA/IEdyYW1tYXIuUHJvdG9CdWlsdEluUnVsZXMgOiBHcmFtbWFyLkJ1aWx0SW5SdWxlcyxcbiAgICAgICk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLnN1cGVyR3JhbW1hcjtcbiAgfVxuXG4gIGVuc3VyZVN1cGVyR3JhbW1hclJ1bGVGb3JPdmVycmlkaW5nKG5hbWUsIHNvdXJjZSkge1xuICAgIGNvbnN0IHJ1bGVJbmZvID0gdGhpcy5lbnN1cmVTdXBlckdyYW1tYXIoKS5ydWxlc1tuYW1lXTtcbiAgICBpZiAoIXJ1bGVJbmZvKSB7XG4gICAgICB0aHJvdyBlcnJvcnMuY2Fubm90T3ZlcnJpZGVVbmRlY2xhcmVkUnVsZShuYW1lLCB0aGlzLnN1cGVyR3JhbW1hci5uYW1lLCBzb3VyY2UpO1xuICAgIH1cbiAgICByZXR1cm4gcnVsZUluZm87XG4gIH1cblxuICBpbnN0YWxsT3ZlcnJpZGRlbk9yRXh0ZW5kZWRSdWxlKG5hbWUsIGZvcm1hbHMsIGJvZHksIHNvdXJjZSkge1xuICAgIGNvbnN0IGR1cGxpY2F0ZVBhcmFtZXRlck5hbWVzID0gZ2V0RHVwbGljYXRlcyhmb3JtYWxzKTtcbiAgICBpZiAoZHVwbGljYXRlUGFyYW1ldGVyTmFtZXMubGVuZ3RoID4gMCkge1xuICAgICAgdGhyb3cgZXJyb3JzLmR1cGxpY2F0ZVBhcmFtZXRlck5hbWVzKG5hbWUsIGR1cGxpY2F0ZVBhcmFtZXRlck5hbWVzLCBzb3VyY2UpO1xuICAgIH1cbiAgICBjb25zdCBydWxlSW5mbyA9IHRoaXMuZW5zdXJlU3VwZXJHcmFtbWFyKCkucnVsZXNbbmFtZV07XG4gICAgY29uc3QgZXhwZWN0ZWRGb3JtYWxzID0gcnVsZUluZm8uZm9ybWFscztcbiAgICBjb25zdCBleHBlY3RlZE51bUZvcm1hbHMgPSBleHBlY3RlZEZvcm1hbHMgPyBleHBlY3RlZEZvcm1hbHMubGVuZ3RoIDogMDtcbiAgICBpZiAoZm9ybWFscy5sZW5ndGggIT09IGV4cGVjdGVkTnVtRm9ybWFscykge1xuICAgICAgdGhyb3cgZXJyb3JzLndyb25nTnVtYmVyT2ZQYXJhbWV0ZXJzKG5hbWUsIGV4cGVjdGVkTnVtRm9ybWFscywgZm9ybWFscy5sZW5ndGgsIHNvdXJjZSk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmluc3RhbGwobmFtZSwgZm9ybWFscywgYm9keSwgcnVsZUluZm8uZGVzY3JpcHRpb24sIHNvdXJjZSk7XG4gIH1cblxuICBpbnN0YWxsKG5hbWUsIGZvcm1hbHMsIGJvZHksIGRlc2NyaXB0aW9uLCBzb3VyY2UsIHByaW1pdGl2ZSA9IGZhbHNlKSB7XG4gICAgdGhpcy5ydWxlc1tuYW1lXSA9IHtcbiAgICAgIGJvZHk6IGJvZHkuaW50cm9kdWNlUGFyYW1zKGZvcm1hbHMpLFxuICAgICAgZm9ybWFscyxcbiAgICAgIGRlc2NyaXB0aW9uLFxuICAgICAgc291cmNlLFxuICAgICAgcHJpbWl0aXZlLFxuICAgIH07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBTdHVmZiB0aGF0IHlvdSBzaG91bGQgb25seSBkbyBvbmNlXG5cbiAgd2l0aFN1cGVyR3JhbW1hcihzdXBlckdyYW1tYXIpIHtcbiAgICBpZiAodGhpcy5zdXBlckdyYW1tYXIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcigndGhlIHN1cGVyIGdyYW1tYXIgb2YgYSBHcmFtbWFyRGVjbCBjYW5ub3QgYmUgc2V0IG1vcmUgdGhhbiBvbmNlJyk7XG4gICAgfVxuICAgIHRoaXMuc3VwZXJHcmFtbWFyID0gc3VwZXJHcmFtbWFyO1xuICAgIHRoaXMucnVsZXMgPSBPYmplY3QuY3JlYXRlKHN1cGVyR3JhbW1hci5ydWxlcyk7XG5cbiAgICAvLyBHcmFtbWFycyB3aXRoIGFuIGV4cGxpY2l0IHN1cGVyZ3JhbW1hciBpbmhlcml0IGEgZGVmYXVsdCBzdGFydCBydWxlLlxuICAgIGlmICghc3VwZXJHcmFtbWFyLmlzQnVpbHRJbigpKSB7XG4gICAgICB0aGlzLmRlZmF1bHRTdGFydFJ1bGUgPSBzdXBlckdyYW1tYXIuZGVmYXVsdFN0YXJ0UnVsZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICB3aXRoRGVmYXVsdFN0YXJ0UnVsZShydWxlTmFtZSkge1xuICAgIHRoaXMuZGVmYXVsdFN0YXJ0UnVsZSA9IHJ1bGVOYW1lO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgd2l0aFNvdXJjZShzb3VyY2UpIHtcbiAgICB0aGlzLnNvdXJjZSA9IG5ldyBJbnB1dFN0cmVhbShzb3VyY2UpLmludGVydmFsKDAsIHNvdXJjZS5sZW5ndGgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gQ3JlYXRlcyBhIEdyYW1tYXIgaW5zdGFuY2UsIGFuZCBpZiBpdCBwYXNzZXMgdGhlIHNhbml0eSBjaGVja3MsIHJldHVybnMgaXQuXG4gIGJ1aWxkKCkge1xuICAgIGNvbnN0IGdyYW1tYXIgPSBuZXcgR3JhbW1hcihcbiAgICAgICAgdGhpcy5uYW1lLFxuICAgICAgICB0aGlzLmVuc3VyZVN1cGVyR3JhbW1hcigpLFxuICAgICAgICB0aGlzLnJ1bGVzLFxuICAgICAgICB0aGlzLmRlZmF1bHRTdGFydFJ1bGUsXG4gICAgKTtcbiAgICAvLyBJbml0aWFsaXplIGludGVybmFsIHByb3BzIHRoYXQgYXJlIGluaGVyaXRlZCBmcm9tIHRoZSBzdXBlciBncmFtbWFyLlxuICAgIGdyYW1tYXIuX21hdGNoU3RhdGVJbml0aWFsaXplciA9IGdyYW1tYXIuc3VwZXJHcmFtbWFyLl9tYXRjaFN0YXRlSW5pdGlhbGl6ZXI7XG4gICAgZ3JhbW1hci5zdXBwb3J0c0luY3JlbWVudGFsUGFyc2luZyA9IGdyYW1tYXIuc3VwZXJHcmFtbWFyLnN1cHBvcnRzSW5jcmVtZW50YWxQYXJzaW5nO1xuXG4gICAgLy8gVE9ETzogY2hhbmdlIHRoZSBwZXhwci5wcm90b3R5cGUuYXNzZXJ0Li4uIG1ldGhvZHMgdG8gbWFrZSB0aGVtIGFkZFxuICAgIC8vIGV4Y2VwdGlvbnMgdG8gYW4gYXJyYXkgdGhhdCdzIHByb3ZpZGVkIGFzIGFuIGFyZy4gVGhlbiB3ZSdsbCBiZSBhYmxlIHRvXG4gICAgLy8gc2hvdyBtb3JlIHRoYW4gb25lIGVycm9yIG9mIHRoZSBzYW1lIHR5cGUgYXQgYSB0aW1lLlxuICAgIC8vIFRPRE86IGluY2x1ZGUgdGhlIG9mZmVuZGluZyBwZXhwciBpbiB0aGUgZXJyb3JzLCB0aGF0IHdheSB3ZSBjYW4gc2hvd1xuICAgIC8vIHRoZSBwYXJ0IG9mIHRoZSBzb3VyY2UgdGhhdCBjYXVzZWQgaXQuXG4gICAgY29uc3QgZ3JhbW1hckVycm9ycyA9IFtdO1xuICAgIGxldCBncmFtbWFySGFzSW52YWxpZEFwcGxpY2F0aW9ucyA9IGZhbHNlO1xuICAgIE9iamVjdC5rZXlzKGdyYW1tYXIucnVsZXMpLmZvckVhY2gocnVsZU5hbWUgPT4ge1xuICAgICAgY29uc3Qge2JvZHl9ID0gZ3JhbW1hci5ydWxlc1tydWxlTmFtZV07XG4gICAgICB0cnkge1xuICAgICAgICBib2R5LmFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5KHJ1bGVOYW1lKTtcbiAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgZ3JhbW1hckVycm9ycy5wdXNoKGUpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgYm9keS5hc3NlcnRBbGxBcHBsaWNhdGlvbnNBcmVWYWxpZChydWxlTmFtZSwgZ3JhbW1hcik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGdyYW1tYXJFcnJvcnMucHVzaChlKTtcbiAgICAgICAgZ3JhbW1hckhhc0ludmFsaWRBcHBsaWNhdGlvbnMgPSB0cnVlO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGlmICghZ3JhbW1hckhhc0ludmFsaWRBcHBsaWNhdGlvbnMpIHtcbiAgICAgIC8vIFRoZSBmb2xsb3dpbmcgY2hlY2sgY2FuIG9ubHkgYmUgZG9uZSBpZiB0aGUgZ3JhbW1hciBoYXMgbm8gaW52YWxpZCBhcHBsaWNhdGlvbnMuXG4gICAgICBPYmplY3Qua2V5cyhncmFtbWFyLnJ1bGVzKS5mb3JFYWNoKHJ1bGVOYW1lID0+IHtcbiAgICAgICAgY29uc3Qge2JvZHl9ID0gZ3JhbW1hci5ydWxlc1tydWxlTmFtZV07XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgYm9keS5hc3NlcnRJdGVyYXRlZEV4cHJzQXJlTm90TnVsbGFibGUoZ3JhbW1hciwgW10pO1xuICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgZ3JhbW1hckVycm9ycy5wdXNoKGUpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgaWYgKGdyYW1tYXJFcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgZXJyb3JzLnRocm93RXJyb3JzKGdyYW1tYXJFcnJvcnMpO1xuICAgIH1cbiAgICBpZiAodGhpcy5zb3VyY2UpIHtcbiAgICAgIGdyYW1tYXIuc291cmNlID0gdGhpcy5zb3VyY2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGdyYW1tYXI7XG4gIH1cblxuICAvLyBSdWxlIGRlY2xhcmF0aW9uc1xuXG4gIGRlZmluZShuYW1lLCBmb3JtYWxzLCBib2R5LCBkZXNjcmlwdGlvbiwgc291cmNlLCBwcmltaXRpdmUpIHtcbiAgICB0aGlzLmVuc3VyZVN1cGVyR3JhbW1hcigpO1xuICAgIGlmICh0aGlzLnN1cGVyR3JhbW1hci5ydWxlc1tuYW1lXSkge1xuICAgICAgdGhyb3cgZXJyb3JzLmR1cGxpY2F0ZVJ1bGVEZWNsYXJhdGlvbihuYW1lLCB0aGlzLm5hbWUsIHRoaXMuc3VwZXJHcmFtbWFyLm5hbWUsIHNvdXJjZSk7XG4gICAgfSBlbHNlIGlmICh0aGlzLnJ1bGVzW25hbWVdKSB7XG4gICAgICB0aHJvdyBlcnJvcnMuZHVwbGljYXRlUnVsZURlY2xhcmF0aW9uKG5hbWUsIHRoaXMubmFtZSwgdGhpcy5uYW1lLCBzb3VyY2UpO1xuICAgIH1cbiAgICBjb25zdCBkdXBsaWNhdGVQYXJhbWV0ZXJOYW1lcyA9IGdldER1cGxpY2F0ZXMoZm9ybWFscyk7XG4gICAgaWYgKGR1cGxpY2F0ZVBhcmFtZXRlck5hbWVzLmxlbmd0aCA+IDApIHtcbiAgICAgIHRocm93IGVycm9ycy5kdXBsaWNhdGVQYXJhbWV0ZXJOYW1lcyhuYW1lLCBkdXBsaWNhdGVQYXJhbWV0ZXJOYW1lcywgc291cmNlKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuaW5zdGFsbChuYW1lLCBmb3JtYWxzLCBib2R5LCBkZXNjcmlwdGlvbiwgc291cmNlLCBwcmltaXRpdmUpO1xuICB9XG5cbiAgb3ZlcnJpZGUobmFtZSwgZm9ybWFscywgYm9keSwgZGVzY0lnbm9yZWQsIHNvdXJjZSkge1xuICAgIHRoaXMuZW5zdXJlU3VwZXJHcmFtbWFyUnVsZUZvck92ZXJyaWRpbmcobmFtZSwgc291cmNlKTtcbiAgICB0aGlzLmluc3RhbGxPdmVycmlkZGVuT3JFeHRlbmRlZFJ1bGUobmFtZSwgZm9ybWFscywgYm9keSwgc291cmNlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGV4dGVuZChuYW1lLCBmb3JtYWxzLCBmcmFnbWVudCwgZGVzY0lnbm9yZWQsIHNvdXJjZSkge1xuICAgIGNvbnN0IHJ1bGVJbmZvID0gdGhpcy5lbnN1cmVTdXBlckdyYW1tYXIoKS5ydWxlc1tuYW1lXTtcbiAgICBpZiAoIXJ1bGVJbmZvKSB7XG4gICAgICB0aHJvdyBlcnJvcnMuY2Fubm90RXh0ZW5kVW5kZWNsYXJlZFJ1bGUobmFtZSwgdGhpcy5zdXBlckdyYW1tYXIubmFtZSwgc291cmNlKTtcbiAgICB9XG4gICAgY29uc3QgYm9keSA9IG5ldyBwZXhwcnMuRXh0ZW5kKHRoaXMuc3VwZXJHcmFtbWFyLCBuYW1lLCBmcmFnbWVudCk7XG4gICAgYm9keS5zb3VyY2UgPSBmcmFnbWVudC5zb3VyY2U7XG4gICAgdGhpcy5pbnN0YWxsT3ZlcnJpZGRlbk9yRXh0ZW5kZWRSdWxlKG5hbWUsIGZvcm1hbHMsIGJvZHksIHNvdXJjZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiIsImltcG9ydCB7R3JhbW1hcn0gZnJvbSAnLi9HcmFtbWFyLmpzJztcbmltcG9ydCB7R3JhbW1hckRlY2x9IGZyb20gJy4vR3JhbW1hckRlY2wuanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLmpzJztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFByaXZhdGUgc3R1ZmZcbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydCBjbGFzcyBCdWlsZGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5jdXJyZW50RGVjbCA9IG51bGw7XG4gICAgdGhpcy5jdXJyZW50UnVsZU5hbWUgPSBudWxsO1xuICB9XG5cbiAgbmV3R3JhbW1hcihuYW1lKSB7XG4gICAgcmV0dXJuIG5ldyBHcmFtbWFyRGVjbChuYW1lKTtcbiAgfVxuXG4gIGdyYW1tYXIobWV0YUluZm8sIG5hbWUsIHN1cGVyR3JhbW1hciwgZGVmYXVsdFN0YXJ0UnVsZSwgcnVsZXMpIHtcbiAgICBjb25zdCBnRGVjbCA9IG5ldyBHcmFtbWFyRGVjbChuYW1lKTtcbiAgICBpZiAoc3VwZXJHcmFtbWFyKSB7XG4gICAgICAvLyBgc3VwZXJHcmFtbWFyYCBtYXkgYmUgYSByZWNpcGUgKGkuZS4gYW4gQXJyYXkpLCBvciBhbiBhY3R1YWwgZ3JhbW1hciBpbnN0YW5jZS5cbiAgICAgIGdEZWNsLndpdGhTdXBlckdyYW1tYXIoXG4gICAgICAgIHN1cGVyR3JhbW1hciBpbnN0YW5jZW9mIEdyYW1tYXIgPyBzdXBlckdyYW1tYXIgOiB0aGlzLmZyb21SZWNpcGUoc3VwZXJHcmFtbWFyKSxcbiAgICAgICk7XG4gICAgfVxuICAgIGlmIChkZWZhdWx0U3RhcnRSdWxlKSB7XG4gICAgICBnRGVjbC53aXRoRGVmYXVsdFN0YXJ0UnVsZShkZWZhdWx0U3RhcnRSdWxlKTtcbiAgICB9XG4gICAgaWYgKG1ldGFJbmZvICYmIG1ldGFJbmZvLnNvdXJjZSkge1xuICAgICAgZ0RlY2wud2l0aFNvdXJjZShtZXRhSW5mby5zb3VyY2UpO1xuICAgIH1cblxuICAgIHRoaXMuY3VycmVudERlY2wgPSBnRGVjbDtcbiAgICBPYmplY3Qua2V5cyhydWxlcykuZm9yRWFjaChydWxlTmFtZSA9PiB7XG4gICAgICB0aGlzLmN1cnJlbnRSdWxlTmFtZSA9IHJ1bGVOYW1lO1xuICAgICAgY29uc3QgcnVsZVJlY2lwZSA9IHJ1bGVzW3J1bGVOYW1lXTtcblxuICAgICAgY29uc3QgYWN0aW9uID0gcnVsZVJlY2lwZVswXTsgLy8gZGVmaW5lL2V4dGVuZC9vdmVycmlkZVxuICAgICAgY29uc3QgbWV0YUluZm8gPSBydWxlUmVjaXBlWzFdO1xuICAgICAgY29uc3QgZGVzY3JpcHRpb24gPSBydWxlUmVjaXBlWzJdO1xuICAgICAgY29uc3QgZm9ybWFscyA9IHJ1bGVSZWNpcGVbM107XG4gICAgICBjb25zdCBib2R5ID0gdGhpcy5mcm9tUmVjaXBlKHJ1bGVSZWNpcGVbNF0pO1xuXG4gICAgICBsZXQgc291cmNlO1xuICAgICAgaWYgKGdEZWNsLnNvdXJjZSAmJiBtZXRhSW5mbyAmJiBtZXRhSW5mby5zb3VyY2VJbnRlcnZhbCkge1xuICAgICAgICBzb3VyY2UgPSBnRGVjbC5zb3VyY2Uuc3ViSW50ZXJ2YWwoXG4gICAgICAgICAgICBtZXRhSW5mby5zb3VyY2VJbnRlcnZhbFswXSxcbiAgICAgICAgICAgIG1ldGFJbmZvLnNvdXJjZUludGVydmFsWzFdIC0gbWV0YUluZm8uc291cmNlSW50ZXJ2YWxbMF0sXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBnRGVjbFthY3Rpb25dKHJ1bGVOYW1lLCBmb3JtYWxzLCBib2R5LCBkZXNjcmlwdGlvbiwgc291cmNlKTtcbiAgICB9KTtcbiAgICB0aGlzLmN1cnJlbnRSdWxlTmFtZSA9IHRoaXMuY3VycmVudERlY2wgPSBudWxsO1xuICAgIHJldHVybiBnRGVjbC5idWlsZCgpO1xuICB9XG5cbiAgdGVybWluYWwoeCkge1xuICAgIHJldHVybiBuZXcgcGV4cHJzLlRlcm1pbmFsKHgpO1xuICB9XG5cbiAgcmFuZ2UoZnJvbSwgdG8pIHtcbiAgICByZXR1cm4gbmV3IHBleHBycy5SYW5nZShmcm9tLCB0byk7XG4gIH1cblxuICBwYXJhbShpbmRleCkge1xuICAgIHJldHVybiBuZXcgcGV4cHJzLlBhcmFtKGluZGV4KTtcbiAgfVxuXG4gIGFsdCguLi50ZXJtQXJncykge1xuICAgIGxldCB0ZXJtcyA9IFtdO1xuICAgIGZvciAobGV0IGFyZyBvZiB0ZXJtQXJncykge1xuICAgICAgaWYgKCEoYXJnIGluc3RhbmNlb2YgcGV4cHJzLlBFeHByKSkge1xuICAgICAgICBhcmcgPSB0aGlzLmZyb21SZWNpcGUoYXJnKTtcbiAgICAgIH1cbiAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBwZXhwcnMuQWx0KSB7XG4gICAgICAgIHRlcm1zID0gdGVybXMuY29uY2F0KGFyZy50ZXJtcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0ZXJtcy5wdXNoKGFyZyk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0ZXJtcy5sZW5ndGggPT09IDEgPyB0ZXJtc1swXSA6IG5ldyBwZXhwcnMuQWx0KHRlcm1zKTtcbiAgfVxuXG4gIHNlcSguLi5mYWN0b3JBcmdzKSB7XG4gICAgbGV0IGZhY3RvcnMgPSBbXTtcbiAgICBmb3IgKGxldCBhcmcgb2YgZmFjdG9yQXJncykge1xuICAgICAgaWYgKCEoYXJnIGluc3RhbmNlb2YgcGV4cHJzLlBFeHByKSkge1xuICAgICAgICBhcmcgPSB0aGlzLmZyb21SZWNpcGUoYXJnKTtcbiAgICAgIH1cbiAgICAgIGlmIChhcmcgaW5zdGFuY2VvZiBwZXhwcnMuU2VxKSB7XG4gICAgICAgIGZhY3RvcnMgPSBmYWN0b3JzLmNvbmNhdChhcmcuZmFjdG9ycyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBmYWN0b3JzLnB1c2goYXJnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGZhY3RvcnMubGVuZ3RoID09PSAxID8gZmFjdG9yc1swXSA6IG5ldyBwZXhwcnMuU2VxKGZhY3RvcnMpO1xuICB9XG5cbiAgc3RhcihleHByKSB7XG4gICAgaWYgKCEoZXhwciBpbnN0YW5jZW9mIHBleHBycy5QRXhwcikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLmZyb21SZWNpcGUoZXhwcik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgcGV4cHJzLlN0YXIoZXhwcik7XG4gIH1cblxuICBwbHVzKGV4cHIpIHtcbiAgICBpZiAoIShleHByIGluc3RhbmNlb2YgcGV4cHJzLlBFeHByKSkge1xuICAgICAgZXhwciA9IHRoaXMuZnJvbVJlY2lwZShleHByKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBwZXhwcnMuUGx1cyhleHByKTtcbiAgfVxuXG4gIG9wdChleHByKSB7XG4gICAgaWYgKCEoZXhwciBpbnN0YW5jZW9mIHBleHBycy5QRXhwcikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLmZyb21SZWNpcGUoZXhwcik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgcGV4cHJzLk9wdChleHByKTtcbiAgfVxuXG4gIG5vdChleHByKSB7XG4gICAgaWYgKCEoZXhwciBpbnN0YW5jZW9mIHBleHBycy5QRXhwcikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLmZyb21SZWNpcGUoZXhwcik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgcGV4cHJzLk5vdChleHByKTtcbiAgfVxuXG4gIGxvb2thaGVhZChleHByKSB7XG4gICAgaWYgKCEoZXhwciBpbnN0YW5jZW9mIHBleHBycy5QRXhwcikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLmZyb21SZWNpcGUoZXhwcik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgcGV4cHJzLkxvb2thaGVhZChleHByKTtcbiAgfVxuXG4gIGxleChleHByKSB7XG4gICAgaWYgKCEoZXhwciBpbnN0YW5jZW9mIHBleHBycy5QRXhwcikpIHtcbiAgICAgIGV4cHIgPSB0aGlzLmZyb21SZWNpcGUoZXhwcik7XG4gICAgfVxuICAgIHJldHVybiBuZXcgcGV4cHJzLkxleChleHByKTtcbiAgfVxuXG4gIGFwcChydWxlTmFtZSwgb3B0UGFyYW1zKSB7XG4gICAgaWYgKG9wdFBhcmFtcyAmJiBvcHRQYXJhbXMubGVuZ3RoID4gMCkge1xuICAgICAgb3B0UGFyYW1zID0gb3B0UGFyYW1zLm1hcChmdW5jdGlvbihwYXJhbSkge1xuICAgICAgICByZXR1cm4gcGFyYW0gaW5zdGFuY2VvZiBwZXhwcnMuUEV4cHIgPyBwYXJhbSA6IHRoaXMuZnJvbVJlY2lwZShwYXJhbSk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBwZXhwcnMuQXBwbHkocnVsZU5hbWUsIG9wdFBhcmFtcyk7XG4gIH1cblxuICAvLyBOb3RlIHRoYXQgdW5saWtlIG90aGVyIG1ldGhvZHMgaW4gdGhpcyBjbGFzcywgdGhpcyBtZXRob2QgY2Fubm90IGJlIHVzZWQgYXMgYVxuICAvLyBjb252ZW5pZW5jZSBjb25zdHJ1Y3Rvci4gSXQgb25seSB3b3JrcyB3aXRoIHJlY2lwZXMsIGJlY2F1c2UgaXQgcmVsaWVzIG9uXG4gIC8vIGB0aGlzLmN1cnJlbnREZWNsYCBhbmQgYHRoaXMuY3VycmVudFJ1bGVOYW1lYCBiZWluZyBzZXQuXG4gIHNwbGljZShiZWZvcmVUZXJtcywgYWZ0ZXJUZXJtcykge1xuICAgIHJldHVybiBuZXcgcGV4cHJzLlNwbGljZShcbiAgICAgICAgdGhpcy5jdXJyZW50RGVjbC5zdXBlckdyYW1tYXIsXG4gICAgICAgIHRoaXMuY3VycmVudFJ1bGVOYW1lLFxuICAgICAgICBiZWZvcmVUZXJtcy5tYXAodGVybSA9PiB0aGlzLmZyb21SZWNpcGUodGVybSkpLFxuICAgICAgICBhZnRlclRlcm1zLm1hcCh0ZXJtID0+IHRoaXMuZnJvbVJlY2lwZSh0ZXJtKSksXG4gICAgKTtcbiAgfVxuXG4gIGZyb21SZWNpcGUocmVjaXBlKSB7XG4gICAgLy8gdGhlIG1ldGEtaW5mbyBvZiAnZ3JhbW1hcicgaXMgcHJvY2Vzc2VkIGluIEJ1aWxkZXIuZ3JhbW1hclxuICAgIGNvbnN0IGFyZ3MgPSByZWNpcGVbMF0gPT09ICdncmFtbWFyJyA/IHJlY2lwZS5zbGljZSgxKSA6IHJlY2lwZS5zbGljZSgyKTtcbiAgICBjb25zdCByZXN1bHQgPSB0aGlzW3JlY2lwZVswXV0oLi4uYXJncyk7XG5cbiAgICBjb25zdCBtZXRhSW5mbyA9IHJlY2lwZVsxXTtcbiAgICBpZiAobWV0YUluZm8pIHtcbiAgICAgIGlmIChtZXRhSW5mby5zb3VyY2VJbnRlcnZhbCAmJiB0aGlzLmN1cnJlbnREZWNsKSB7XG4gICAgICAgIHJlc3VsdC53aXRoU291cmNlKHRoaXMuY3VycmVudERlY2wuc291cmNlSW50ZXJ2YWwoLi4ubWV0YUluZm8uc291cmNlSW50ZXJ2YWwpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWlsZGVyfSBmcm9tICcuL0J1aWxkZXIuanMnO1xuXG5leHBvcnQgZnVuY3Rpb24gbWFrZVJlY2lwZShyZWNpcGUpIHtcbiAgaWYgKHR5cGVvZiByZWNpcGUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gcmVjaXBlLmNhbGwobmV3IEJ1aWxkZXIoKSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHR5cGVvZiByZWNpcGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAvLyBzdHJpbmdpZmllZCBKU09OIHJlY2lwZVxuICAgICAgcmVjaXBlID0gSlNPTi5wYXJzZShyZWNpcGUpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEJ1aWxkZXIoKS5mcm9tUmVjaXBlKHJlY2lwZSk7XG4gIH1cbn1cbiIsImltcG9ydCB7bWFrZVJlY2lwZX0gZnJvbSAnLi4vc3JjL21ha2VSZWNpcGUuanMnO1xuZXhwb3J0IGRlZmF1bHQgbWFrZVJlY2lwZShbXCJncmFtbWFyXCIse1wic291cmNlXCI6XCJCdWlsdEluUnVsZXMge1xcblxcbiAgYWxudW0gIChhbiBhbHBoYS1udW1lcmljIGNoYXJhY3RlcilcXG4gICAgPSBsZXR0ZXJcXG4gICAgfCBkaWdpdFxcblxcbiAgbGV0dGVyICAoYSBsZXR0ZXIpXFxuICAgID0gbG93ZXJcXG4gICAgfCB1cHBlclxcbiAgICB8IHVuaWNvZGVMdG1vXFxuXFxuICBkaWdpdCAgKGEgZGlnaXQpXFxuICAgID0gXFxcIjBcXFwiLi5cXFwiOVxcXCJcXG5cXG4gIGhleERpZ2l0ICAoYSBoZXhhZGVjaW1hbCBkaWdpdClcXG4gICAgPSBkaWdpdFxcbiAgICB8IFxcXCJhXFxcIi4uXFxcImZcXFwiXFxuICAgIHwgXFxcIkFcXFwiLi5cXFwiRlxcXCJcXG5cXG4gIExpc3RPZjxlbGVtLCBzZXA+XFxuICAgID0gTm9uZW1wdHlMaXN0T2Y8ZWxlbSwgc2VwPlxcbiAgICB8IEVtcHR5TGlzdE9mPGVsZW0sIHNlcD5cXG5cXG4gIE5vbmVtcHR5TGlzdE9mPGVsZW0sIHNlcD5cXG4gICAgPSBlbGVtIChzZXAgZWxlbSkqXFxuXFxuICBFbXB0eUxpc3RPZjxlbGVtLCBzZXA+XFxuICAgID0gLyogbm90aGluZyAqL1xcblxcbiAgbGlzdE9mPGVsZW0sIHNlcD5cXG4gICAgPSBub25lbXB0eUxpc3RPZjxlbGVtLCBzZXA+XFxuICAgIHwgZW1wdHlMaXN0T2Y8ZWxlbSwgc2VwPlxcblxcbiAgbm9uZW1wdHlMaXN0T2Y8ZWxlbSwgc2VwPlxcbiAgICA9IGVsZW0gKHNlcCBlbGVtKSpcXG5cXG4gIGVtcHR5TGlzdE9mPGVsZW0sIHNlcD5cXG4gICAgPSAvKiBub3RoaW5nICovXFxuXFxuICAvLyBBbGxvd3MgYSBzeW50YWN0aWMgcnVsZSBhcHBsaWNhdGlvbiB3aXRoaW4gYSBsZXhpY2FsIGNvbnRleHQuXFxuICBhcHBseVN5bnRhY3RpYzxhcHA+ID0gYXBwXFxufVwifSxcIkJ1aWx0SW5SdWxlc1wiLG51bGwsbnVsbCx7XCJhbG51bVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE4LDc4XX0sXCJhbiBhbHBoYS1udW1lcmljIGNoYXJhY3RlclwiLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzYwLDc4XX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNjAsNjZdfSxcImxldHRlclwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3Myw3OF19LFwiZGlnaXRcIixbXV1dXSxcImxldHRlclwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzgyLDE0Ml19LFwiYSBsZXR0ZXJcIixbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMDcsMTQyXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTA3LDExMl19LFwibG93ZXJcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTE5LDEyNF19LFwidXBwZXJcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTMxLDE0Ml19LFwidW5pY29kZUx0bW9cIixbXV1dXSxcImRpZ2l0XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTQ2LDE3N119LFwiYSBkaWdpdFwiLFtdLFtcInJhbmdlXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTY5LDE3N119LFwiMFwiLFwiOVwiXV0sXCJoZXhEaWdpdFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE4MSwyNTRdfSxcImEgaGV4YWRlY2ltYWwgZGlnaXRcIixbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTksMjU0XX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjE5LDIyNF19LFwiZGlnaXRcIixbXV0sW1wicmFuZ2VcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMzEsMjM5XX0sXCJhXCIsXCJmXCJdLFtcInJhbmdlXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ2LDI1NF19LFwiQVwiLFwiRlwiXV1dLFwiTGlzdE9mXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU4LDMzNl19LG51bGwsW1wiZWxlbVwiLFwic2VwXCJdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI4MiwzMzZdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyODIsMzA3XX0sXCJOb25lbXB0eUxpc3RPZlwiLFtbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzI5NywzMDFdfSwwXSxbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzMwMywzMDZdfSwxXV1dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzMxNCwzMzZdfSxcIkVtcHR5TGlzdE9mXCIsW1tcInBhcmFtXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzI2LDMzMF19LDBdLFtcInBhcmFtXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzMyLDMzNV19LDFdXV1dXSxcIk5vbmVtcHR5TGlzdE9mXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzQwLDM4OF19LG51bGwsW1wiZWxlbVwiLFwic2VwXCJdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM3MiwzODhdfSxbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM3MiwzNzZdfSwwXSxbXCJzdGFyXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzc3LDM4OF19LFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM3OCwzODZdfSxbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM3OCwzODFdfSwxXSxbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM4MiwzODZdfSwwXV1dXV0sXCJFbXB0eUxpc3RPZlwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM5Miw0MzRdfSxudWxsLFtcImVsZW1cIixcInNlcFwiXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0MzgsNDM4XX1dXSxcImxpc3RPZlwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzQzOCw1MTZdfSxudWxsLFtcImVsZW1cIixcInNlcFwiXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0NjIsNTE2XX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNDYyLDQ4N119LFwibm9uZW1wdHlMaXN0T2ZcIixbW1wicGFyYW1cIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0NzcsNDgxXX0sMF0sW1wicGFyYW1cIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0ODMsNDg2XX0sMV1dXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0OTQsNTE2XX0sXCJlbXB0eUxpc3RPZlwiLFtbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzUwNiw1MTBdfSwwXSxbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzUxMiw1MTVdfSwxXV1dXV0sXCJub25lbXB0eUxpc3RPZlwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzUyMCw1NjhdfSxudWxsLFtcImVsZW1cIixcInNlcFwiXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NTIsNTY4XX0sW1wicGFyYW1cIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NTIsNTU2XX0sMF0sW1wic3RhclwiLHtcInNvdXJjZUludGVydmFsXCI6WzU1Nyw1NjhdfSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NTgsNTY2XX0sW1wicGFyYW1cIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NTgsNTYxXX0sMV0sW1wicGFyYW1cIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NjIsNTY2XX0sMF1dXV1dLFwiZW1wdHlMaXN0T2ZcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NzIsNjgyXX0sbnVsbCxbXCJlbGVtXCIsXCJzZXBcIl0sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNjg1LDY4NV19XV0sXCJhcHBseVN5bnRhY3RpY1wiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzY4NSw3MTBdfSxudWxsLFtcImFwcFwiXSxbXCJwYXJhbVwiLHtcInNvdXJjZUludGVydmFsXCI6WzcwNyw3MTBdfSwwXV19XSk7XG4iLCJpbXBvcnQgQnVpbHRJblJ1bGVzIGZyb20gJy4uL2Rpc3QvYnVpbHQtaW4tcnVsZXMuanMnO1xuaW1wb3J0IHtHcmFtbWFyfSBmcm9tICcuL0dyYW1tYXIuanMnO1xuaW1wb3J0IHthbm5vdW5jZUJ1aWx0SW5SdWxlc30gZnJvbSAnLi91dGlsLmpzJztcblxuR3JhbW1hci5CdWlsdEluUnVsZXMgPSBCdWlsdEluUnVsZXM7XG5hbm5vdW5jZUJ1aWx0SW5SdWxlcyhHcmFtbWFyLkJ1aWx0SW5SdWxlcyk7XG5cbi8vIER1cmluZyB0aGUgYm9vdHN0cmFwIHByb2Nlc3MsIHdlIGluc3RhbnRpYXRlIHNvbWUgZ3JhbW1hcnMgdGhhdCByZXF1aXJlXG4vLyB0aGUgYnVpbHQtaW4gcnVsZXMgdG8gYmUgbG9hZGVkIGZpcnN0IChlLmcuLCBvaG0tZ3JhbW1hci5vaG0pLiBCeVxuLy8gZXhwb3J0aW5nIGBtYWtlUmVjaXBlYCBoZXJlLCB0aGUgcmVjaXBlcyBmb3IgdGhvc2UgZ3JhbW1hcnMgY2FuIGVuY29kZVxuLy8gdGhhdCBkZXBlbmRlbmN5IGJ5IGltcG9ydGluZyBpdCBmcm9tIHRoaXMgbW9kdWxlLlxuZXhwb3J0IHttYWtlUmVjaXBlfSBmcm9tICcuL21ha2VSZWNpcGUuanMnO1xuIiwiaW1wb3J0IHttYWtlUmVjaXBlfSBmcm9tICcuLi9zcmMvbWFpbi1rZXJuZWwuanMnO1xuZXhwb3J0IGRlZmF1bHQgbWFrZVJlY2lwZShbXCJncmFtbWFyXCIse1wic291cmNlXCI6XCJPaG0ge1xcblxcbiAgR3JhbW1hcnNcXG4gICAgPSBHcmFtbWFyKlxcblxcbiAgR3JhbW1hclxcbiAgICA9IGlkZW50IFN1cGVyR3JhbW1hcj8gXFxcIntcXFwiIFJ1bGUqIFxcXCJ9XFxcIlxcblxcbiAgU3VwZXJHcmFtbWFyXFxuICAgID0gXFxcIjw6XFxcIiBpZGVudFxcblxcbiAgUnVsZVxcbiAgICA9IGlkZW50IEZvcm1hbHM/IHJ1bGVEZXNjcj8gXFxcIj1cXFwiICBSdWxlQm9keSAgLS0gZGVmaW5lXFxuICAgIHwgaWRlbnQgRm9ybWFscz8gICAgICAgICAgICBcXFwiOj1cXFwiIE92ZXJyaWRlUnVsZUJvZHkgIC0tIG92ZXJyaWRlXFxuICAgIHwgaWRlbnQgRm9ybWFscz8gICAgICAgICAgICBcXFwiKz1cXFwiIFJ1bGVCb2R5ICAtLSBleHRlbmRcXG5cXG4gIFJ1bGVCb2R5XFxuICAgID0gXFxcInxcXFwiPyBOb25lbXB0eUxpc3RPZjxUb3BMZXZlbFRlcm0sIFxcXCJ8XFxcIj5cXG5cXG4gIFRvcExldmVsVGVybVxcbiAgICA9IFNlcSBjYXNlTmFtZSAgLS0gaW5saW5lXFxuICAgIHwgU2VxXFxuXFxuICBPdmVycmlkZVJ1bGVCb2R5XFxuICAgID0gXFxcInxcXFwiPyBOb25lbXB0eUxpc3RPZjxPdmVycmlkZVRvcExldmVsVGVybSwgXFxcInxcXFwiPlxcblxcbiAgT3ZlcnJpZGVUb3BMZXZlbFRlcm1cXG4gICAgPSBcXFwiLi4uXFxcIiAgLS0gc3VwZXJTcGxpY2VcXG4gICAgfCBUb3BMZXZlbFRlcm1cXG5cXG4gIEZvcm1hbHNcXG4gICAgPSBcXFwiPFxcXCIgTGlzdE9mPGlkZW50LCBcXFwiLFxcXCI+IFxcXCI+XFxcIlxcblxcbiAgUGFyYW1zXFxuICAgID0gXFxcIjxcXFwiIExpc3RPZjxTZXEsIFxcXCIsXFxcIj4gXFxcIj5cXFwiXFxuXFxuICBBbHRcXG4gICAgPSBOb25lbXB0eUxpc3RPZjxTZXEsIFxcXCJ8XFxcIj5cXG5cXG4gIFNlcVxcbiAgICA9IEl0ZXIqXFxuXFxuICBJdGVyXFxuICAgID0gUHJlZCBcXFwiKlxcXCIgIC0tIHN0YXJcXG4gICAgfCBQcmVkIFxcXCIrXFxcIiAgLS0gcGx1c1xcbiAgICB8IFByZWQgXFxcIj9cXFwiICAtLSBvcHRcXG4gICAgfCBQcmVkXFxuXFxuICBQcmVkXFxuICAgID0gXFxcIn5cXFwiIExleCAgLS0gbm90XFxuICAgIHwgXFxcIiZcXFwiIExleCAgLS0gbG9va2FoZWFkXFxuICAgIHwgTGV4XFxuXFxuICBMZXhcXG4gICAgPSBcXFwiI1xcXCIgQmFzZSAgLS0gbGV4XFxuICAgIHwgQmFzZVxcblxcbiAgQmFzZVxcbiAgICA9IGlkZW50IFBhcmFtcz8gfihydWxlRGVzY3I/IFxcXCI9XFxcIiB8IFxcXCI6PVxcXCIgfCBcXFwiKz1cXFwiKSAgLS0gYXBwbGljYXRpb25cXG4gICAgfCBvbmVDaGFyVGVybWluYWwgXFxcIi4uXFxcIiBvbmVDaGFyVGVybWluYWwgICAgICAgICAgIC0tIHJhbmdlXFxuICAgIHwgdGVybWluYWwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSB0ZXJtaW5hbFxcbiAgICB8IFxcXCIoXFxcIiBBbHQgXFxcIilcXFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gcGFyZW5cXG5cXG4gIHJ1bGVEZXNjciAgKGEgcnVsZSBkZXNjcmlwdGlvbilcXG4gICAgPSBcXFwiKFxcXCIgcnVsZURlc2NyVGV4dCBcXFwiKVxcXCJcXG5cXG4gIHJ1bGVEZXNjclRleHRcXG4gICAgPSAoflxcXCIpXFxcIiBhbnkpKlxcblxcbiAgY2FzZU5hbWVcXG4gICAgPSBcXFwiLS1cXFwiICh+XFxcIlxcXFxuXFxcIiBzcGFjZSkqIG5hbWUgKH5cXFwiXFxcXG5cXFwiIHNwYWNlKSogKFxcXCJcXFxcblxcXCIgfCAmXFxcIn1cXFwiKVxcblxcbiAgbmFtZSAgKGEgbmFtZSlcXG4gICAgPSBuYW1lRmlyc3QgbmFtZVJlc3QqXFxuXFxuICBuYW1lRmlyc3RcXG4gICAgPSBcXFwiX1xcXCJcXG4gICAgfCBsZXR0ZXJcXG5cXG4gIG5hbWVSZXN0XFxuICAgID0gXFxcIl9cXFwiXFxuICAgIHwgYWxudW1cXG5cXG4gIGlkZW50ICAoYW4gaWRlbnRpZmllcilcXG4gICAgPSBuYW1lXFxuXFxuICB0ZXJtaW5hbFxcbiAgICA9IFxcXCJcXFxcXFxcIlxcXCIgdGVybWluYWxDaGFyKiBcXFwiXFxcXFxcXCJcXFwiXFxuXFxuICBvbmVDaGFyVGVybWluYWxcXG4gICAgPSBcXFwiXFxcXFxcXCJcXFwiIHRlcm1pbmFsQ2hhciBcXFwiXFxcXFxcXCJcXFwiXFxuXFxuICB0ZXJtaW5hbENoYXJcXG4gICAgPSBlc2NhcGVDaGFyXFxuICAgICAgfCB+XFxcIlxcXFxcXFxcXFxcIiB+XFxcIlxcXFxcXFwiXFxcIiB+XFxcIlxcXFxuXFxcIiBcXFwiXFxcXHV7MH1cXFwiLi5cXFwiXFxcXHV7MTBGRkZGfVxcXCJcXG5cXG4gIGVzY2FwZUNoYXIgIChhbiBlc2NhcGUgc2VxdWVuY2UpXFxuICAgID0gXFxcIlxcXFxcXFxcXFxcXFxcXFxcXFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tIGJhY2tzbGFzaFxcbiAgICB8IFxcXCJcXFxcXFxcXFxcXFxcXFwiXFxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBkb3VibGVRdW90ZVxcbiAgICB8IFxcXCJcXFxcXFxcXFxcXFwnXFxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBzaW5nbGVRdW90ZVxcbiAgICB8IFxcXCJcXFxcXFxcXGJcXFwiICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLSBiYWNrc3BhY2VcXG4gICAgfCBcXFwiXFxcXFxcXFxuXFxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gbGluZUZlZWRcXG4gICAgfCBcXFwiXFxcXFxcXFxyXFxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gY2FycmlhZ2VSZXR1cm5cXG4gICAgfCBcXFwiXFxcXFxcXFx0XFxcIiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLS0gdGFiXFxuICAgIHwgXFxcIlxcXFxcXFxcdXtcXFwiIGhleERpZ2l0IGhleERpZ2l0PyBoZXhEaWdpdD9cXG4gICAgICAgICAgICAgaGV4RGlnaXQ/IGhleERpZ2l0PyBoZXhEaWdpdD8gXFxcIn1cXFwiICAgLS0gdW5pY29kZUNvZGVQb2ludFxcbiAgICB8IFxcXCJcXFxcXFxcXHVcXFwiIGhleERpZ2l0IGhleERpZ2l0IGhleERpZ2l0IGhleERpZ2l0ICAtLSB1bmljb2RlRXNjYXBlXFxuICAgIHwgXFxcIlxcXFxcXFxceFxcXCIgaGV4RGlnaXQgaGV4RGlnaXQgICAgICAgICAgICAgICAgICAgIC0tIGhleEVzY2FwZVxcblxcbiAgc3BhY2VcXG4gICArPSBjb21tZW50XFxuXFxuICBjb21tZW50XFxuICAgID0gXFxcIi8vXFxcIiAoflxcXCJcXFxcblxcXCIgYW55KSogJihcXFwiXFxcXG5cXFwiIHwgZW5kKSAgLS0gc2luZ2xlTGluZVxcbiAgICB8IFxcXCIvKlxcXCIgKH5cXFwiKi9cXFwiIGFueSkqIFxcXCIqL1xcXCIgIC0tIG11bHRpTGluZVxcblxcbiAgdG9rZW5zID0gdG9rZW4qXFxuXFxuICB0b2tlbiA9IGNhc2VOYW1lIHwgY29tbWVudCB8IGlkZW50IHwgb3BlcmF0b3IgfCBwdW5jdHVhdGlvbiB8IHRlcm1pbmFsIHwgYW55XFxuXFxuICBvcGVyYXRvciA9IFxcXCI8OlxcXCIgfCBcXFwiPVxcXCIgfCBcXFwiOj1cXFwiIHwgXFxcIis9XFxcIiB8IFxcXCIqXFxcIiB8IFxcXCIrXFxcIiB8IFxcXCI/XFxcIiB8IFxcXCJ+XFxcIiB8IFxcXCImXFxcIlxcblxcbiAgcHVuY3R1YXRpb24gPSBcXFwiPFxcXCIgfCBcXFwiPlxcXCIgfCBcXFwiLFxcXCIgfCBcXFwiLS1cXFwiXFxufVwifSxcIk9obVwiLG51bGwsXCJHcmFtbWFyc1wiLHtcIkdyYW1tYXJzXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOSwzMl19LG51bGwsW10sW1wic3RhclwiLHtcInNvdXJjZUludGVydmFsXCI6WzI0LDMyXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQsMzFdfSxcIkdyYW1tYXJcIixbXV1dXSxcIkdyYW1tYXJcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlszNiw4M119LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNTAsODNdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1MCw1NV19LFwiaWRlbnRcIixbXV0sW1wib3B0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbNTYsNjldfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1Niw2OF19LFwiU3VwZXJHcmFtbWFyXCIsW11dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzcwLDczXX0sXCJ7XCJdLFtcInN0YXJcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3NCw3OV19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6Wzc0LDc4XX0sXCJSdWxlXCIsW11dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzgwLDgzXX0sXCJ9XCJdXV0sXCJTdXBlckdyYW1tYXJcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4NywxMTZdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEwNiwxMTZdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEwNiwxMTBdfSxcIjw6XCJdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzExMSwxMTZdfSxcImlkZW50XCIsW11dXV0sXCJSdWxlX2RlZmluZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEzMSwxODFdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEzMSwxNzBdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzEsMTM2XX0sXCJpZGVudFwiLFtdXSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzcsMTQ1XX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTM3LDE0NF19LFwiRm9ybWFsc1wiLFtdXV0sW1wib3B0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTQ2LDE1Nl19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE0NiwxNTVdfSxcInJ1bGVEZXNjclwiLFtdXV0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNTcsMTYwXX0sXCI9XCJdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE2MiwxNzBdfSxcIlJ1bGVCb2R5XCIsW11dXV0sXCJSdWxlX292ZXJyaWRlXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTg4LDI0OF19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTg4LDIzNV19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE4OCwxOTNdfSxcImlkZW50XCIsW11dLFtcIm9wdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE5NCwyMDJdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxOTQsMjAxXX0sXCJGb3JtYWxzXCIsW11dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIxNCwyMThdfSxcIjo9XCJdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIxOSwyMzVdfSxcIk92ZXJyaWRlUnVsZUJvZHlcIixbXV1dXSxcIlJ1bGVfZXh0ZW5kXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU1LDMwNV19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU1LDI5NF19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI1NSwyNjBdfSxcImlkZW50XCIsW11dLFtcIm9wdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2MSwyNjldfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNjEsMjY4XX0sXCJGb3JtYWxzXCIsW11dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI4MSwyODVdfSxcIis9XCJdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI4NiwyOTRdfSxcIlJ1bGVCb2R5XCIsW11dXV0sXCJSdWxlXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTIwLDMwNV19LG51bGwsW10sW1wiYWx0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTMxLDMwNV19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEzMSwxNzBdfSxcIlJ1bGVfZGVmaW5lXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE4OCwyMzVdfSxcIlJ1bGVfb3ZlcnJpZGVcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU1LDI5NF19LFwiUnVsZV9leHRlbmRcIixbXV1dXSxcIlJ1bGVCb2R5XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzA5LDM2Ml19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzI0LDM2Ml19LFtcIm9wdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzMyNCwzMjhdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzMyNCwzMjddfSxcInxcIl1dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzMyOSwzNjJdfSxcIk5vbmVtcHR5TGlzdE9mXCIsW1tcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzM0NCwzNTZdfSxcIlRvcExldmVsVGVybVwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzM1OCwzNjFdfSxcInxcIl1dXV1dLFwiVG9wTGV2ZWxUZXJtX2lubGluZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM4NSw0MDhdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM4NSwzOTddfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlszODUsMzg4XX0sXCJTZXFcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMzg5LDM5N119LFwiY2FzZU5hbWVcIixbXV1dXSxcIlRvcExldmVsVGVybVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzM2Niw0MThdfSxudWxsLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzM4NSw0MThdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlszODUsMzk3XX0sXCJUb3BMZXZlbFRlcm1faW5saW5lXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzQxNSw0MThdfSxcIlNlcVwiLFtdXV1dLFwiT3ZlcnJpZGVSdWxlQm9keVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzQyMiw0OTFdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzQ0NSw0OTFdfSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0NDUsNDQ5XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0NDUsNDQ4XX0sXCJ8XCJdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0NTAsNDkxXX0sXCJOb25lbXB0eUxpc3RPZlwiLFtbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls0NjUsNDg1XX0sXCJPdmVycmlkZVRvcExldmVsVGVybVwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzQ4Nyw0OTBdfSxcInxcIl1dXV1dLFwiT3ZlcnJpZGVUb3BMZXZlbFRlcm1fc3VwZXJTcGxpY2VcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1MjIsNTQzXX0sbnVsbCxbXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzUyMiw1MjddfSxcIi4uLlwiXV0sXCJPdmVycmlkZVRvcExldmVsVGVybVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzQ5NSw1NjJdfSxudWxsLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzUyMiw1NjJdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1MjIsNTI3XX0sXCJPdmVycmlkZVRvcExldmVsVGVybV9zdXBlclNwbGljZVwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NTAsNTYyXX0sXCJUb3BMZXZlbFRlcm1cIixbXV1dXSxcIkZvcm1hbHNcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NjYsNjA2XX0sbnVsbCxbXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1ODAsNjA2XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1ODAsNTgzXX0sXCI8XCJdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzU4NCw2MDJdfSxcIkxpc3RPZlwiLFtbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1OTEsNTk2XX0sXCJpZGVudFwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzU5OCw2MDFdfSxcIixcIl1dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzYwMyw2MDZdfSxcIj5cIl1dXSxcIlBhcmFtc1wiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzYxMCw2NDddfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzYyMyw2NDddfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzYyMyw2MjZdfSxcIjxcIl0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNjI3LDY0M119LFwiTGlzdE9mXCIsW1tcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzYzNCw2MzddfSxcIlNlcVwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzYzOSw2NDJdfSxcIixcIl1dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzY0NCw2NDddfSxcIj5cIl1dXSxcIkFsdFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzY1MSw2ODVdfSxudWxsLFtdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzY2MSw2ODVdfSxcIk5vbmVtcHR5TGlzdE9mXCIsW1tcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzY3Niw2NzldfSxcIlNlcVwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzY4MSw2ODRdfSxcInxcIl1dXV0sXCJTZXFcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls2ODksNzA0XX0sbnVsbCxbXSxbXCJzdGFyXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNjk5LDcwNF19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzY5OSw3MDNdfSxcIkl0ZXJcIixbXV1dXSxcIkl0ZXJfc3RhclwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzcxOSw3MzZdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzcxOSw3MjddfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3MTksNzIzXX0sXCJQcmVkXCIsW11dLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNzI0LDcyN119LFwiKlwiXV1dLFwiSXRlcl9wbHVzXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNzQzLDc2MF19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNzQzLDc1MV19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6Wzc0Myw3NDddfSxcIlByZWRcIixbXV0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3NDgsNzUxXX0sXCIrXCJdXV0sXCJJdGVyX29wdFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6Wzc2Nyw3ODNdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6Wzc2Nyw3NzVdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3NjcsNzcxXX0sXCJQcmVkXCIsW11dLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNzcyLDc3NV19LFwiP1wiXV1dLFwiSXRlclwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzcwOCw3OTRdfSxudWxsLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzcxOSw3OTRdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3MTksNzI3XX0sXCJJdGVyX3N0YXJcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbNzQzLDc1MV19LFwiSXRlcl9wbHVzXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6Wzc2Nyw3NzVdfSxcIkl0ZXJfb3B0XCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6Wzc5MCw3OTRdfSxcIlByZWRcIixbXV1dXSxcIlByZWRfbm90XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODA5LDgyNF19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODA5LDgxNl19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODA5LDgxMl19LFwiflwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4MTMsODE2XX0sXCJMZXhcIixbXV1dXSxcIlByZWRfbG9va2FoZWFkXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODMxLDg1Ml19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODMxLDgzOF19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODMxLDgzNF19LFwiJlwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4MzUsODM4XX0sXCJMZXhcIixbXV1dXSxcIlByZWRcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls3OTgsODYyXX0sbnVsbCxbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4MDksODYyXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODA5LDgxNl19LFwiUHJlZF9ub3RcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODMxLDgzOF19LFwiUHJlZF9sb29rYWhlYWRcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODU5LDg2Ml19LFwiTGV4XCIsW11dXV0sXCJMZXhfbGV4XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODc2LDg5Ml19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODc2LDg4NF19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODc2LDg3OV19LFwiI1wiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4ODAsODg0XX0sXCJCYXNlXCIsW11dXV0sXCJMZXhcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4NjYsOTAzXX0sbnVsbCxbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4NzYsOTAzXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbODc2LDg4NF19LFwiTGV4X2xleFwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls4OTksOTAzXX0sXCJCYXNlXCIsW11dXV0sXCJCYXNlX2FwcGxpY2F0aW9uXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOTE4LDk3OV19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOTE4LDk2M119LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkxOCw5MjNdfSxcImlkZW50XCIsW11dLFtcIm9wdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkyNCw5MzFdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5MjQsOTMwXX0sXCJQYXJhbXNcIixbXV1dLFtcIm5vdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkzMiw5NjNdfSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5MzQsOTYyXX0sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOTM0LDk0OF19LFtcIm9wdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkzNCw5NDRdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5MzQsOTQzXX0sXCJydWxlRGVzY3JcIixbXV1dLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOTQ1LDk0OF19LFwiPVwiXV0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5NTEsOTU1XX0sXCI6PVwiXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6Wzk1OCw5NjJdfSxcIis9XCJdXV1dXSxcIkJhc2VfcmFuZ2VcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5ODYsMTA0MV19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOTg2LDEwMjJdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5ODYsMTAwMV19LFwib25lQ2hhclRlcm1pbmFsXCIsW11dLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTAwMiwxMDA2XX0sXCIuLlwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMDA3LDEwMjJdfSxcIm9uZUNoYXJUZXJtaW5hbFwiLFtdXV1dLFwiQmFzZV90ZXJtaW5hbFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEwNDgsMTEwNl19LG51bGwsW10sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTA0OCwxMDU2XX0sXCJ0ZXJtaW5hbFwiLFtdXV0sXCJCYXNlX3BhcmVuXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTExMywxMTY4XX0sbnVsbCxbXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMTEzLDExMjRdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzExMTMsMTExNl19LFwiKFwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMTE3LDExMjBdfSxcIkFsdFwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzExMjEsMTEyNF19LFwiKVwiXV1dLFwiQmFzZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzkwNywxMTY4XX0sbnVsbCxbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls5MTgsMTE2OF19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkxOCw5NjNdfSxcIkJhc2VfYXBwbGljYXRpb25cIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbOTg2LDEwMjJdfSxcIkJhc2VfcmFuZ2VcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTA0OCwxMDU2XX0sXCJCYXNlX3Rlcm1pbmFsXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzExMTMsMTEyNF19LFwiQmFzZV9wYXJlblwiLFtdXV1dLFwicnVsZURlc2NyXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTE3MiwxMjMxXX0sXCJhIHJ1bGUgZGVzY3JpcHRpb25cIixbXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjEwLDEyMzFdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEyMTAsMTIxM119LFwiKFwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjE0LDEyMjddfSxcInJ1bGVEZXNjclRleHRcIixbXV0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjI4LDEyMzFdfSxcIilcIl1dXSxcInJ1bGVEZXNjclRleHRcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjM1LDEyNjZdfSxudWxsLFtdLFtcInN0YXJcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjU1LDEyNjZdfSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjU2LDEyNjRdfSxbXCJub3RcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjU2LDEyNjBdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEyNTcsMTI2MF19LFwiKVwiXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTI2MSwxMjY0XX0sXCJhbnlcIixbXV1dXV0sXCJjYXNlTmFtZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEyNzAsMTMzOF19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTI4NSwxMzM4XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjg1LDEyODldfSxcIi0tXCJdLFtcInN0YXJcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjkwLDEzMDRdfSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjkxLDEzMDJdfSxbXCJub3RcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjkxLDEyOTZdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEyOTIsMTI5Nl19LFwiXFxuXCJdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMjk3LDEzMDJdfSxcInNwYWNlXCIsW11dXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTMwNSwxMzA5XX0sXCJuYW1lXCIsW11dLFtcInN0YXJcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzEwLDEzMjRdfSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzExLDEzMjJdfSxbXCJub3RcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzExLDEzMTZdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEzMTIsMTMxNl19LFwiXFxuXCJdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzE3LDEzMjJdfSxcInNwYWNlXCIsW11dXV0sW1wiYWx0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTMyNiwxMzM3XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzI2LDEzMzBdfSxcIlxcblwiXSxbXCJsb29rYWhlYWRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzMzLDEzMzddfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEzMzQsMTMzN119LFwifVwiXV1dXV0sXCJuYW1lXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTM0MiwxMzgyXX0sXCJhIG5hbWVcIixbXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzYzLDEzODJdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzYzLDEzNzJdfSxcIm5hbWVGaXJzdFwiLFtdXSxbXCJzdGFyXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTM3MywxMzgyXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTM3MywxMzgxXX0sXCJuYW1lUmVzdFwiLFtdXV1dXSxcIm5hbWVGaXJzdFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEzODYsMTQxOF19LG51bGwsW10sW1wiYWx0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTQwMiwxNDE4XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNDAyLDE0MDVdfSxcIl9cIl0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTQxMiwxNDE4XX0sXCJsZXR0ZXJcIixbXV1dXSxcIm5hbWVSZXN0XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTQyMiwxNDUyXX0sbnVsbCxbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNDM3LDE0NTJdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE0MzcsMTQ0MF19LFwiX1wiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNDQ3LDE0NTJdfSxcImFsbnVtXCIsW11dXV0sXCJpZGVudFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE0NTYsMTQ4OV19LFwiYW4gaWRlbnRpZmllclwiLFtdLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE0ODUsMTQ4OV19LFwibmFtZVwiLFtdXV0sXCJ0ZXJtaW5hbFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE0OTMsMTUzMV19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTUwOCwxNTMxXX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNTA4LDE1MTJdfSxcIlxcXCJcIl0sW1wic3RhclwiLHtcInNvdXJjZUludGVydmFsXCI6WzE1MTMsMTUyNl19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE1MTMsMTUyNV19LFwidGVybWluYWxDaGFyXCIsW11dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE1MjcsMTUzMV19LFwiXFxcIlwiXV1dLFwib25lQ2hhclRlcm1pbmFsXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTUzNSwxNTc5XX0sbnVsbCxbXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNTU3LDE1NzldfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE1NTcsMTU2MV19LFwiXFxcIlwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNTYyLDE1NzRdfSxcInRlcm1pbmFsQ2hhclwiLFtdXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE1NzUsMTU3OV19LFwiXFxcIlwiXV1dLFwidGVybWluYWxDaGFyXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTU4MywxNjYwXX0sbnVsbCxbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNjAyLDE2NjBdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNjAyLDE2MTJdfSxcImVzY2FwZUNoYXJcIixbXV0sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTYyMSwxNjYwXX0sW1wibm90XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTYyMSwxNjI2XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNjIyLDE2MjZdfSxcIlxcXFxcIl1dLFtcIm5vdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE2MjcsMTYzMl19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTYyOCwxNjMyXX0sXCJcXFwiXCJdXSxbXCJub3RcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNjMzLDE2MzhdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE2MzQsMTYzOF19LFwiXFxuXCJdXSxbXCJyYW5nZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE2MzksMTY2MF19LFwiXFx1MDAwMFwiLFwi9I+/v1wiXV1dXSxcImVzY2FwZUNoYXJfYmFja3NsYXNoXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTcwMywxNzU4XX0sbnVsbCxbXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE3MDMsMTcwOV19LFwiXFxcXFxcXFxcIl1dLFwiZXNjYXBlQ2hhcl9kb3VibGVRdW90ZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE3NjUsMTgyMl19LG51bGwsW10sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNzY1LDE3NzFdfSxcIlxcXFxcXFwiXCJdXSxcImVzY2FwZUNoYXJfc2luZ2xlUXVvdGVcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxODI5LDE4ODZdfSxudWxsLFtdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTgyOSwxODM1XX0sXCJcXFxcJ1wiXV0sXCJlc2NhcGVDaGFyX2JhY2tzcGFjZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzE4OTMsMTk0OF19LG51bGwsW10sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxODkzLDE4OThdfSxcIlxcXFxiXCJdXSxcImVzY2FwZUNoYXJfbGluZUZlZWRcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxOTU1LDIwMDldfSxudWxsLFtdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTk1NSwxOTYwXX0sXCJcXFxcblwiXV0sXCJlc2NhcGVDaGFyX2NhcnJpYWdlUmV0dXJuXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjAxNiwyMDc2XX0sbnVsbCxbXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIwMTYsMjAyMV19LFwiXFxcXHJcIl1dLFwiZXNjYXBlQ2hhcl90YWJcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMDgzLDIxMzJdfSxudWxsLFtdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjA4MywyMDg4XX0sXCJcXFxcdFwiXV0sXCJlc2NhcGVDaGFyX3VuaWNvZGVDb2RlUG9pbnRcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTM5LDIyNDNdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzIxMzksMjIyMV19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjEzOSwyMTQ1XX0sXCJcXFxcdXtcIl0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjE0NiwyMTU0XX0sXCJoZXhEaWdpdFwiLFtdXSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTU1LDIxNjRdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTU1LDIxNjNdfSxcImhleERpZ2l0XCIsW11dXSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTY1LDIxNzRdfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTY1LDIxNzNdfSxcImhleERpZ2l0XCIsW11dXSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTg4LDIxOTddfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTg4LDIxOTZdfSxcImhleERpZ2l0XCIsW11dXSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTk4LDIyMDddfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTk4LDIyMDZdfSxcImhleERpZ2l0XCIsW11dXSxbXCJvcHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMjA4LDIyMTddfSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMjA4LDIyMTZdfSxcImhleERpZ2l0XCIsW11dXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIyMTgsMjIyMV19LFwifVwiXV1dLFwiZXNjYXBlQ2hhcl91bmljb2RlRXNjYXBlXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjI1MCwyMzA5XX0sbnVsbCxbXSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMjUwLDIyOTFdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIyNTAsMjI1NV19LFwiXFxcXHVcIl0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjI1NiwyMjY0XX0sXCJoZXhEaWdpdFwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMjY1LDIyNzNdfSxcImhleERpZ2l0XCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIyNzQsMjI4Ml19LFwiaGV4RGlnaXRcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjI4MywyMjkxXX0sXCJoZXhEaWdpdFwiLFtdXV1dLFwiZXNjYXBlQ2hhcl9oZXhFc2NhcGVcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMzE2LDIzNzFdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzIzMTYsMjMzOV19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjMxNiwyMzIxXX0sXCJcXFxceFwiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMzIyLDIzMzBdfSxcImhleERpZ2l0XCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIzMzEsMjMzOV19LFwiaGV4RGlnaXRcIixbXV1dXSxcImVzY2FwZUNoYXJcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNjY0LDIzNzFdfSxcImFuIGVzY2FwZSBzZXF1ZW5jZVwiLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE3MDMsMjM3MV19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE3MDMsMTcwOV19LFwiZXNjYXBlQ2hhcl9iYWNrc2xhc2hcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTc2NSwxNzcxXX0sXCJlc2NhcGVDaGFyX2RvdWJsZVF1b3RlXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE4MjksMTgzNV19LFwiZXNjYXBlQ2hhcl9zaW5nbGVRdW90ZVwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxODkzLDE4OThdfSxcImVzY2FwZUNoYXJfYmFja3NwYWNlXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE5NTUsMTk2MF19LFwiZXNjYXBlQ2hhcl9saW5lRmVlZFwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMDE2LDIwMjFdfSxcImVzY2FwZUNoYXJfY2FycmlhZ2VSZXR1cm5cIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjA4MywyMDg4XX0sXCJlc2NhcGVDaGFyX3RhYlwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTM5LDIyMjFdfSxcImVzY2FwZUNoYXJfdW5pY29kZUNvZGVQb2ludFwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMjUwLDIyOTFdfSxcImVzY2FwZUNoYXJfdW5pY29kZUVzY2FwZVwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMzE2LDIzMzldfSxcImVzY2FwZUNoYXJfaGV4RXNjYXBlXCIsW11dXV0sXCJzcGFjZVwiOltcImV4dGVuZFwiLHtcInNvdXJjZUludGVydmFsXCI6WzIzNzUsMjM5NF19LG51bGwsW10sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjM4NywyMzk0XX0sXCJjb21tZW50XCIsW11dXSxcImNvbW1lbnRfc2luZ2xlTGluZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzI0MTIsMjQ1OF19LG51bGwsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQxMiwyNDQzXX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDEyLDI0MTZdfSxcIi8vXCJdLFtcInN0YXJcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDE3LDI0MjldfSxbXCJzZXFcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDE4LDI0MjddfSxbXCJub3RcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDE4LDI0MjNdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI0MTksMjQyM119LFwiXFxuXCJdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDI0LDI0MjddfSxcImFueVwiLFtdXV1dLFtcImxvb2thaGVhZFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI0MzAsMjQ0M119LFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI0MzIsMjQ0Ml19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQzMiwyNDM2XX0sXCJcXG5cIl0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQzOSwyNDQyXX0sXCJlbmRcIixbXV1dXV1dLFwiY29tbWVudF9tdWx0aUxpbmVcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDY1LDI1MDFdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzI0NjUsMjQ4N119LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ2NSwyNDY5XX0sXCIvKlwiXSxbXCJzdGFyXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ3MCwyNDgyXX0sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ3MSwyNDgwXX0sW1wibm90XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ3MSwyNDc2XX0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDcyLDI0NzZdfSxcIiovXCJdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNDc3LDI0ODBdfSxcImFueVwiLFtdXV1dLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ4MywyNDg3XX0sXCIqL1wiXV1dLFwiY29tbWVudFwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzIzOTgsMjUwMV19LG51bGwsW10sW1wiYWx0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQxMiwyNTAxXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQxMiwyNDQzXX0sXCJjb21tZW50X3NpbmdsZUxpbmVcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQ2NSwyNDg3XX0sXCJjb21tZW50X211bHRpTGluZVwiLFtdXV1dLFwidG9rZW5zXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjUwNSwyNTIwXX0sbnVsbCxbXSxbXCJzdGFyXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjUxNCwyNTIwXX0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjUxNCwyNTE5XX0sXCJ0b2tlblwiLFtdXV1dLFwidG9rZW5cIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNTI0LDI2MDBdfSxudWxsLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI1MzIsMjYwMF19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI1MzIsMjU0MF19LFwiY2FzZU5hbWVcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU0MywyNTUwXX0sXCJjb21tZW50XCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI1NTMsMjU1OF19LFwiaWRlbnRcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU2MSwyNTY5XX0sXCJvcGVyYXRvclwiLFtdXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNTcyLDI1ODNdfSxcInB1bmN0dWF0aW9uXCIsW11dLFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI1ODYsMjU5NF19LFwidGVybWluYWxcIixbXV0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjU5NywyNjAwXX0sXCJhbnlcIixbXV1dXSxcIm9wZXJhdG9yXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjYwNCwyNjY5XX0sbnVsbCxbXSxbXCJhbHRcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNjE1LDI2NjldfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2MTUsMjYxOV19LFwiPDpcIl0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNjIyLDI2MjVdfSxcIj1cIl0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNjI4LDI2MzJdfSxcIjo9XCJdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjYzNSwyNjM5XX0sXCIrPVwiXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2NDIsMjY0NV19LFwiKlwiXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2NDgsMjY1MV19LFwiK1wiXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2NTQsMjY1N119LFwiP1wiXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2NjAsMjY2M119LFwiflwiXSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2NjYsMjY2OV19LFwiJlwiXV1dLFwicHVuY3R1YXRpb25cIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNjczLDI3MDldfSxudWxsLFtdLFtcImFsdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzI2ODcsMjcwOV19LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjY4NywyNjkwXX0sXCI8XCJdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjY5MywyNjk2XX0sXCI+XCJdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjY5OSwyNzAyXX0sXCIsXCJdLFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjcwNSwyNzA5XX0sXCItLVwiXV1dfV0pO1xuIiwiaW1wb3J0IG9obUdyYW1tYXIgZnJvbSAnLi4vZGlzdC9vaG0tZ3JhbW1hci5qcyc7XG5pbXBvcnQge0J1aWxkZXJ9IGZyb20gJy4vQnVpbGRlci5qcyc7XG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSAnLi9jb21tb24uanMnO1xuaW1wb3J0ICogYXMgZXJyb3JzIGZyb20gJy4vZXJyb3JzLmpzJztcbmltcG9ydCB7R3JhbW1hcn0gZnJvbSAnLi9HcmFtbWFyLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuL3BleHBycy5qcyc7XG5cbmNvbnN0IHN1cGVyU3BsaWNlUGxhY2Vob2xkZXIgPSBPYmplY3QuY3JlYXRlKHBleHBycy5QRXhwci5wcm90b3R5cGUpO1xuXG5mdW5jdGlvbiBuYW1lc3BhY2VIYXMobnMsIG5hbWUpIHtcbiAgLy8gTG9vayBmb3IgYW4gZW51bWVyYWJsZSBwcm9wZXJ0eSwgYW55d2hlcmUgaW4gdGhlIHByb3RvdHlwZSBjaGFpbi5cbiAgZm9yIChjb25zdCBwcm9wIGluIG5zKSB7XG4gICAgaWYgKHByb3AgPT09IG5hbWUpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gUmV0dXJucyBhIEdyYW1tYXIgaW5zdGFuY2UgKGkuZS4sIGFuIG9iamVjdCB3aXRoIGEgYG1hdGNoYCBtZXRob2QpIGZvclxuLy8gYHRyZWVgLCB3aGljaCBpcyB0aGUgY29uY3JldGUgc3ludGF4IHRyZWUgb2YgYSB1c2VyLXdyaXR0ZW4gZ3JhbW1hci5cbi8vIFRoZSBncmFtbWFyIHdpbGwgYmUgYXNzaWduZWQgaW50byBgbmFtZXNwYWNlYCB1bmRlciB0aGUgbmFtZSBvZiB0aGUgZ3JhbW1hclxuLy8gYXMgc3BlY2lmaWVkIGluIHRoZSBzb3VyY2UuXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRHcmFtbWFyKG1hdGNoLCBuYW1lc3BhY2UsIG9wdE9obUdyYW1tYXJGb3JUZXN0aW5nKSB7XG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xuICBsZXQgZGVjbDtcbiAgbGV0IGN1cnJlbnRSdWxlTmFtZTtcbiAgbGV0IGN1cnJlbnRSdWxlRm9ybWFscztcbiAgbGV0IG92ZXJyaWRpbmcgPSBmYWxzZTtcbiAgY29uc3QgbWV0YUdyYW1tYXIgPSBvcHRPaG1HcmFtbWFyRm9yVGVzdGluZyB8fCBvaG1HcmFtbWFyO1xuXG4gIC8vIEEgdmlzaXRvciB0aGF0IHByb2R1Y2VzIGEgR3JhbW1hciBpbnN0YW5jZSBmcm9tIHRoZSBDU1QuXG4gIGNvbnN0IGhlbHBlcnMgPSBtZXRhR3JhbW1hci5jcmVhdGVTZW1hbnRpY3MoKS5hZGRPcGVyYXRpb24oJ3Zpc2l0Jywge1xuICAgIEdyYW1tYXJzKGdyYW1tYXJJdGVyKSB7XG4gICAgICByZXR1cm4gZ3JhbW1hckl0ZXIuY2hpbGRyZW4ubWFwKGMgPT4gYy52aXNpdCgpKTtcbiAgICB9LFxuICAgIEdyYW1tYXIoaWQsIHMsIF9vcGVuLCBydWxlcywgX2Nsb3NlKSB7XG4gICAgICBjb25zdCBncmFtbWFyTmFtZSA9IGlkLnZpc2l0KCk7XG4gICAgICBkZWNsID0gYnVpbGRlci5uZXdHcmFtbWFyKGdyYW1tYXJOYW1lKTtcbiAgICAgIHMuY2hpbGQoMCkgJiYgcy5jaGlsZCgwKS52aXNpdCgpO1xuICAgICAgcnVsZXMuY2hpbGRyZW4ubWFwKGMgPT4gYy52aXNpdCgpKTtcbiAgICAgIGNvbnN0IGcgPSBkZWNsLmJ1aWxkKCk7XG4gICAgICBnLnNvdXJjZSA9IHRoaXMuc291cmNlLnRyaW1tZWQoKTtcbiAgICAgIGlmIChuYW1lc3BhY2VIYXMobmFtZXNwYWNlLCBncmFtbWFyTmFtZSkpIHtcbiAgICAgICAgdGhyb3cgZXJyb3JzLmR1cGxpY2F0ZUdyYW1tYXJEZWNsYXJhdGlvbihnLCBuYW1lc3BhY2UpO1xuICAgICAgfVxuICAgICAgbmFtZXNwYWNlW2dyYW1tYXJOYW1lXSA9IGc7XG4gICAgICByZXR1cm4gZztcbiAgICB9LFxuXG4gICAgU3VwZXJHcmFtbWFyKF8sIG4pIHtcbiAgICAgIGNvbnN0IHN1cGVyR3JhbW1hck5hbWUgPSBuLnZpc2l0KCk7XG4gICAgICBpZiAoc3VwZXJHcmFtbWFyTmFtZSA9PT0gJ251bGwnKSB7XG4gICAgICAgIGRlY2wud2l0aFN1cGVyR3JhbW1hcihudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICghbmFtZXNwYWNlIHx8ICFuYW1lc3BhY2VIYXMobmFtZXNwYWNlLCBzdXBlckdyYW1tYXJOYW1lKSkge1xuICAgICAgICAgIHRocm93IGVycm9ycy51bmRlY2xhcmVkR3JhbW1hcihzdXBlckdyYW1tYXJOYW1lLCBuYW1lc3BhY2UsIG4uc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICBkZWNsLndpdGhTdXBlckdyYW1tYXIobmFtZXNwYWNlW3N1cGVyR3JhbW1hck5hbWVdKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgUnVsZV9kZWZpbmUobiwgZnMsIGQsIF8sIGIpIHtcbiAgICAgIGN1cnJlbnRSdWxlTmFtZSA9IG4udmlzaXQoKTtcbiAgICAgIGN1cnJlbnRSdWxlRm9ybWFscyA9IGZzLmNoaWxkcmVuLm1hcChjID0+IGMudmlzaXQoKSlbMF0gfHwgW107XG4gICAgICAvLyBJZiB0aGVyZSBpcyBubyBkZWZhdWx0IHN0YXJ0IHJ1bGUgeWV0LCBzZXQgaXQgbm93LiBUaGlzIG11c3QgYmUgZG9uZSBiZWZvcmUgdmlzaXRpbmdcbiAgICAgIC8vIHRoZSBib2R5LCBiZWNhdXNlIGl0IG1pZ2h0IGNvbnRhaW4gYW4gaW5saW5lIHJ1bGUgZGVmaW5pdGlvbi5cbiAgICAgIGlmICghZGVjbC5kZWZhdWx0U3RhcnRSdWxlICYmIGRlY2wuZW5zdXJlU3VwZXJHcmFtbWFyKCkgIT09IEdyYW1tYXIuUHJvdG9CdWlsdEluUnVsZXMpIHtcbiAgICAgICAgZGVjbC53aXRoRGVmYXVsdFN0YXJ0UnVsZShjdXJyZW50UnVsZU5hbWUpO1xuICAgICAgfVxuICAgICAgY29uc3QgYm9keSA9IGIudmlzaXQoKTtcbiAgICAgIGNvbnN0IGRlc2NyaXB0aW9uID0gZC5jaGlsZHJlbi5tYXAoYyA9PiBjLnZpc2l0KCkpWzBdO1xuICAgICAgY29uc3Qgc291cmNlID0gdGhpcy5zb3VyY2UudHJpbW1lZCgpO1xuICAgICAgcmV0dXJuIGRlY2wuZGVmaW5lKGN1cnJlbnRSdWxlTmFtZSwgY3VycmVudFJ1bGVGb3JtYWxzLCBib2R5LCBkZXNjcmlwdGlvbiwgc291cmNlKTtcbiAgICB9LFxuICAgIFJ1bGVfb3ZlcnJpZGUobiwgZnMsIF8sIGIpIHtcbiAgICAgIGN1cnJlbnRSdWxlTmFtZSA9IG4udmlzaXQoKTtcbiAgICAgIGN1cnJlbnRSdWxlRm9ybWFscyA9IGZzLmNoaWxkcmVuLm1hcChjID0+IGMudmlzaXQoKSlbMF0gfHwgW107XG5cbiAgICAgIGNvbnN0IHNvdXJjZSA9IHRoaXMuc291cmNlLnRyaW1tZWQoKTtcbiAgICAgIGRlY2wuZW5zdXJlU3VwZXJHcmFtbWFyUnVsZUZvck92ZXJyaWRpbmcoY3VycmVudFJ1bGVOYW1lLCBzb3VyY2UpO1xuXG4gICAgICBvdmVycmlkaW5nID0gdHJ1ZTtcbiAgICAgIGNvbnN0IGJvZHkgPSBiLnZpc2l0KCk7XG4gICAgICBvdmVycmlkaW5nID0gZmFsc2U7XG4gICAgICByZXR1cm4gZGVjbC5vdmVycmlkZShjdXJyZW50UnVsZU5hbWUsIGN1cnJlbnRSdWxlRm9ybWFscywgYm9keSwgbnVsbCwgc291cmNlKTtcbiAgICB9LFxuICAgIFJ1bGVfZXh0ZW5kKG4sIGZzLCBfLCBiKSB7XG4gICAgICBjdXJyZW50UnVsZU5hbWUgPSBuLnZpc2l0KCk7XG4gICAgICBjdXJyZW50UnVsZUZvcm1hbHMgPSBmcy5jaGlsZHJlbi5tYXAoYyA9PiBjLnZpc2l0KCkpWzBdIHx8IFtdO1xuICAgICAgY29uc3QgYm9keSA9IGIudmlzaXQoKTtcbiAgICAgIGNvbnN0IHNvdXJjZSA9IHRoaXMuc291cmNlLnRyaW1tZWQoKTtcbiAgICAgIHJldHVybiBkZWNsLmV4dGVuZChjdXJyZW50UnVsZU5hbWUsIGN1cnJlbnRSdWxlRm9ybWFscywgYm9keSwgbnVsbCwgc291cmNlKTtcbiAgICB9LFxuICAgIFJ1bGVCb2R5KF8sIHRlcm1zKSB7XG4gICAgICByZXR1cm4gYnVpbGRlci5hbHQoLi4udGVybXMudmlzaXQoKSkud2l0aFNvdXJjZSh0aGlzLnNvdXJjZSk7XG4gICAgfSxcbiAgICBPdmVycmlkZVJ1bGVCb2R5KF8sIHRlcm1zKSB7XG4gICAgICBjb25zdCBhcmdzID0gdGVybXMudmlzaXQoKTtcblxuICAgICAgLy8gQ2hlY2sgaWYgdGhlIHN1cGVyLXNwbGljZSBvcGVyYXRvciAoYC4uLmApIGFwcGVhcnMgaW4gdGhlIHRlcm1zLlxuICAgICAgY29uc3QgZXhwYW5zaW9uUG9zID0gYXJncy5pbmRleE9mKHN1cGVyU3BsaWNlUGxhY2Vob2xkZXIpO1xuICAgICAgaWYgKGV4cGFuc2lvblBvcyA+PSAwKSB7XG4gICAgICAgIGNvbnN0IGJlZm9yZVRlcm1zID0gYXJncy5zbGljZSgwLCBleHBhbnNpb25Qb3MpO1xuICAgICAgICBjb25zdCBhZnRlclRlcm1zID0gYXJncy5zbGljZShleHBhbnNpb25Qb3MgKyAxKTtcblxuICAgICAgICAvLyBFbnN1cmUgaXQgYXBwZWFycyBubyBtb3JlIHRoYW4gb25jZS5cbiAgICAgICAgYWZ0ZXJUZXJtcy5mb3JFYWNoKHQgPT4ge1xuICAgICAgICAgIGlmICh0ID09PSBzdXBlclNwbGljZVBsYWNlaG9sZGVyKSB0aHJvdyBlcnJvcnMubXVsdGlwbGVTdXBlclNwbGljZXModCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBuZXcgcGV4cHJzLlNwbGljZShcbiAgICAgICAgICAgIGRlY2wuc3VwZXJHcmFtbWFyLFxuICAgICAgICAgICAgY3VycmVudFJ1bGVOYW1lLFxuICAgICAgICAgICAgYmVmb3JlVGVybXMsXG4gICAgICAgICAgICBhZnRlclRlcm1zLFxuICAgICAgICApLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGJ1aWxkZXIuYWx0KC4uLmFyZ3MpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgICAgfVxuICAgIH0sXG4gICAgRm9ybWFscyhvcG9pbnR5LCBmcywgY3BvaW50eSkge1xuICAgICAgcmV0dXJuIGZzLnZpc2l0KCk7XG4gICAgfSxcblxuICAgIFBhcmFtcyhvcG9pbnR5LCBwcywgY3BvaW50eSkge1xuICAgICAgcmV0dXJuIHBzLnZpc2l0KCk7XG4gICAgfSxcblxuICAgIEFsdChzZXFzKSB7XG4gICAgICByZXR1cm4gYnVpbGRlci5hbHQoLi4uc2Vxcy52aXNpdCgpKS53aXRoU291cmNlKHRoaXMuc291cmNlKTtcbiAgICB9LFxuXG4gICAgVG9wTGV2ZWxUZXJtX2lubGluZShiLCBuKSB7XG4gICAgICBjb25zdCBpbmxpbmVSdWxlTmFtZSA9IGN1cnJlbnRSdWxlTmFtZSArICdfJyArIG4udmlzaXQoKTtcbiAgICAgIGNvbnN0IGJvZHkgPSBiLnZpc2l0KCk7XG4gICAgICBjb25zdCBzb3VyY2UgPSB0aGlzLnNvdXJjZS50cmltbWVkKCk7XG4gICAgICBjb25zdCBpc05ld1J1bGVEZWNsYXJhdGlvbiA9ICEoXG4gICAgICAgIGRlY2wuc3VwZXJHcmFtbWFyICYmIGRlY2wuc3VwZXJHcmFtbWFyLnJ1bGVzW2lubGluZVJ1bGVOYW1lXVxuICAgICAgKTtcbiAgICAgIGlmIChvdmVycmlkaW5nICYmICFpc05ld1J1bGVEZWNsYXJhdGlvbikge1xuICAgICAgICBkZWNsLm92ZXJyaWRlKGlubGluZVJ1bGVOYW1lLCBjdXJyZW50UnVsZUZvcm1hbHMsIGJvZHksIG51bGwsIHNvdXJjZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBkZWNsLmRlZmluZShpbmxpbmVSdWxlTmFtZSwgY3VycmVudFJ1bGVGb3JtYWxzLCBib2R5LCBudWxsLCBzb3VyY2UpO1xuICAgICAgfVxuICAgICAgY29uc3QgcGFyYW1zID0gY3VycmVudFJ1bGVGb3JtYWxzLm1hcChmb3JtYWwgPT4gYnVpbGRlci5hcHAoZm9ybWFsKSk7XG4gICAgICByZXR1cm4gYnVpbGRlci5hcHAoaW5saW5lUnVsZU5hbWUsIHBhcmFtcykud2l0aFNvdXJjZShib2R5LnNvdXJjZSk7XG4gICAgfSxcbiAgICBPdmVycmlkZVRvcExldmVsVGVybV9zdXBlclNwbGljZShfKSB7XG4gICAgICByZXR1cm4gc3VwZXJTcGxpY2VQbGFjZWhvbGRlcjtcbiAgICB9LFxuXG4gICAgU2VxKGV4cHIpIHtcbiAgICAgIHJldHVybiBidWlsZGVyLnNlcSguLi5leHByLmNoaWxkcmVuLm1hcChjID0+IGMudmlzaXQoKSkpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgIH0sXG5cbiAgICBJdGVyX3N0YXIoeCwgXykge1xuICAgICAgcmV0dXJuIGJ1aWxkZXIuc3Rhcih4LnZpc2l0KCkpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgIH0sXG4gICAgSXRlcl9wbHVzKHgsIF8pIHtcbiAgICAgIHJldHVybiBidWlsZGVyLnBsdXMoeC52aXNpdCgpKS53aXRoU291cmNlKHRoaXMuc291cmNlKTtcbiAgICB9LFxuICAgIEl0ZXJfb3B0KHgsIF8pIHtcbiAgICAgIHJldHVybiBidWlsZGVyLm9wdCh4LnZpc2l0KCkpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgIH0sXG5cbiAgICBQcmVkX25vdChfLCB4KSB7XG4gICAgICByZXR1cm4gYnVpbGRlci5ub3QoeC52aXNpdCgpKS53aXRoU291cmNlKHRoaXMuc291cmNlKTtcbiAgICB9LFxuICAgIFByZWRfbG9va2FoZWFkKF8sIHgpIHtcbiAgICAgIHJldHVybiBidWlsZGVyLmxvb2thaGVhZCh4LnZpc2l0KCkpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgIH0sXG5cbiAgICBMZXhfbGV4KF8sIHgpIHtcbiAgICAgIHJldHVybiBidWlsZGVyLmxleCh4LnZpc2l0KCkpLndpdGhTb3VyY2UodGhpcy5zb3VyY2UpO1xuICAgIH0sXG5cbiAgICBCYXNlX2FwcGxpY2F0aW9uKHJ1bGUsIHBzKSB7XG4gICAgICBjb25zdCBwYXJhbXMgPSBwcy5jaGlsZHJlbi5tYXAoYyA9PiBjLnZpc2l0KCkpWzBdIHx8IFtdO1xuICAgICAgcmV0dXJuIGJ1aWxkZXIuYXBwKHJ1bGUudmlzaXQoKSwgcGFyYW1zKS53aXRoU291cmNlKHRoaXMuc291cmNlKTtcbiAgICB9LFxuICAgIEJhc2VfcmFuZ2UoZnJvbSwgXywgdG8pIHtcbiAgICAgIHJldHVybiBidWlsZGVyLnJhbmdlKGZyb20udmlzaXQoKSwgdG8udmlzaXQoKSkud2l0aFNvdXJjZSh0aGlzLnNvdXJjZSk7XG4gICAgfSxcbiAgICBCYXNlX3Rlcm1pbmFsKGV4cHIpIHtcbiAgICAgIHJldHVybiBidWlsZGVyLnRlcm1pbmFsKGV4cHIudmlzaXQoKSkud2l0aFNvdXJjZSh0aGlzLnNvdXJjZSk7XG4gICAgfSxcbiAgICBCYXNlX3BhcmVuKG9wZW4sIHgsIGNsb3NlKSB7XG4gICAgICByZXR1cm4geC52aXNpdCgpO1xuICAgIH0sXG5cbiAgICBydWxlRGVzY3Iob3BlbiwgdCwgY2xvc2UpIHtcbiAgICAgIHJldHVybiB0LnZpc2l0KCk7XG4gICAgfSxcbiAgICBydWxlRGVzY3JUZXh0KF8pIHtcbiAgICAgIHJldHVybiB0aGlzLnNvdXJjZVN0cmluZy50cmltKCk7XG4gICAgfSxcblxuICAgIGNhc2VOYW1lKF8sIHNwYWNlMSwgbiwgc3BhY2UyLCBlbmQpIHtcbiAgICAgIHJldHVybiBuLnZpc2l0KCk7XG4gICAgfSxcblxuICAgIG5hbWUoZmlyc3QsIHJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzLnNvdXJjZVN0cmluZztcbiAgICB9LFxuICAgIG5hbWVGaXJzdChleHByKSB7fSxcbiAgICBuYW1lUmVzdChleHByKSB7fSxcblxuICAgIHRlcm1pbmFsKG9wZW4sIGNzLCBjbG9zZSkge1xuICAgICAgcmV0dXJuIGNzLmNoaWxkcmVuLm1hcChjID0+IGMudmlzaXQoKSkuam9pbignJyk7XG4gICAgfSxcblxuICAgIG9uZUNoYXJUZXJtaW5hbChvcGVuLCBjLCBjbG9zZSkge1xuICAgICAgcmV0dXJuIGMudmlzaXQoKTtcbiAgICB9LFxuXG4gICAgZXNjYXBlQ2hhcihjKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gY29tbW9uLnVuZXNjYXBlQ29kZVBvaW50KHRoaXMuc291cmNlU3RyaW5nKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgUmFuZ2VFcnJvciAmJiBlcnIubWVzc2FnZS5zdGFydHNXaXRoKCdJbnZhbGlkIGNvZGUgcG9pbnQgJykpIHtcbiAgICAgICAgICB0aHJvdyBlcnJvcnMuaW52YWxpZENvZGVQb2ludChjKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7IC8vIFJldGhyb3dcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgTm9uZW1wdHlMaXN0T2YoeCwgXywgeHMpIHtcbiAgICAgIHJldHVybiBbeC52aXNpdCgpXS5jb25jYXQoeHMuY2hpbGRyZW4ubWFwKGMgPT4gYy52aXNpdCgpKSk7XG4gICAgfSxcbiAgICBFbXB0eUxpc3RPZigpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9LFxuXG4gICAgX3Rlcm1pbmFsKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc291cmNlU3RyaW5nO1xuICAgIH0sXG4gIH0pO1xuICByZXR1cm4gaGVscGVycyhtYXRjaCkudmlzaXQoKTtcbn1cbiIsImltcG9ydCB7bWFrZVJlY2lwZX0gZnJvbSAnLi4vc3JjL21haW4ta2VybmVsLmpzJztcbmV4cG9ydCBkZWZhdWx0IG1ha2VSZWNpcGUoW1wiZ3JhbW1hclwiLHtcInNvdXJjZVwiOlwiT3BlcmF0aW9uc0FuZEF0dHJpYnV0ZXMge1xcblxcbiAgQXR0cmlidXRlU2lnbmF0dXJlID1cXG4gICAgbmFtZVxcblxcbiAgT3BlcmF0aW9uU2lnbmF0dXJlID1cXG4gICAgbmFtZSBGb3JtYWxzP1xcblxcbiAgRm9ybWFsc1xcbiAgICA9IFxcXCIoXFxcIiBMaXN0T2Y8bmFtZSwgXFxcIixcXFwiPiBcXFwiKVxcXCJcXG5cXG4gIG5hbWUgIChhIG5hbWUpXFxuICAgID0gbmFtZUZpcnN0IG5hbWVSZXN0KlxcblxcbiAgbmFtZUZpcnN0XFxuICAgID0gXFxcIl9cXFwiXFxuICAgIHwgbGV0dGVyXFxuXFxuICBuYW1lUmVzdFxcbiAgICA9IFxcXCJfXFxcIlxcbiAgICB8IGFsbnVtXFxuXFxufVwifSxcIk9wZXJhdGlvbnNBbmRBdHRyaWJ1dGVzXCIsbnVsbCxcIkF0dHJpYnV0ZVNpZ25hdHVyZVwiLHtcIkF0dHJpYnV0ZVNpZ25hdHVyZVwiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzI5LDU4XX0sbnVsbCxbXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls1NCw1OF19LFwibmFtZVwiLFtdXV0sXCJPcGVyYXRpb25TaWduYXR1cmVcIjpbXCJkZWZpbmVcIix7XCJzb3VyY2VJbnRlcnZhbFwiOls2MiwxMDBdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6Wzg3LDEwMF19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6Wzg3LDkxXX0sXCJuYW1lXCIsW11dLFtcIm9wdFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkyLDEwMF19LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzkyLDk5XX0sXCJGb3JtYWxzXCIsW11dXV1dLFwiRm9ybWFsc1wiOltcImRlZmluZVwiLHtcInNvdXJjZUludGVydmFsXCI6WzEwNCwxNDNdfSxudWxsLFtdLFtcInNlcVwiLHtcInNvdXJjZUludGVydmFsXCI6WzExOCwxNDNdfSxbXCJ0ZXJtaW5hbFwiLHtcInNvdXJjZUludGVydmFsXCI6WzExOCwxMjFdfSxcIihcIl0sW1wiYXBwXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTIyLDEzOV19LFwiTGlzdE9mXCIsW1tcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzEyOSwxMzNdfSxcIm5hbWVcIixbXV0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxMzUsMTM4XX0sXCIsXCJdXV0sW1widGVybWluYWxcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsxNDAsMTQzXX0sXCIpXCJdXV0sXCJuYW1lXCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTQ3LDE4N119LFwiYSBuYW1lXCIsW10sW1wic2VxXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTY4LDE4N119LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE2OCwxNzddfSxcIm5hbWVGaXJzdFwiLFtdXSxbXCJzdGFyXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTc4LDE4N119LFtcImFwcFwiLHtcInNvdXJjZUludGVydmFsXCI6WzE3OCwxODZdfSxcIm5hbWVSZXN0XCIsW11dXV1dLFwibmFtZUZpcnN0XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMTkxLDIyM119LG51bGwsW10sW1wiYWx0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjA3LDIyM119LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjA3LDIxMF19LFwiX1wiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyMTcsMjIzXX0sXCJsZXR0ZXJcIixbXV1dXSxcIm5hbWVSZXN0XCI6W1wiZGVmaW5lXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjI3LDI1N119LG51bGwsW10sW1wiYWx0XCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQyLDI1N119LFtcInRlcm1pbmFsXCIse1wic291cmNlSW50ZXJ2YWxcIjpbMjQyLDI0NV19LFwiX1wiXSxbXCJhcHBcIix7XCJzb3VyY2VJbnRlcnZhbFwiOlsyNTIsMjU3XX0sXCJhbG51bVwiLFtdXV1dfV0pO1xuIiwiaW1wb3J0IG9wZXJhdGlvbnNBbmRBdHRyaWJ1dGVzR3JhbW1hciBmcm9tICcuLi9kaXN0L29wZXJhdGlvbnMtYW5kLWF0dHJpYnV0ZXMuanMnO1xuaW1wb3J0IHtHcmFtbWFyfSBmcm9tICcuL0dyYW1tYXIuanMnO1xuaW1wb3J0IHtTZW1hbnRpY3N9IGZyb20gJy4vU2VtYW50aWNzLmpzJztcblxuaW5pdEJ1aWx0SW5TZW1hbnRpY3MoR3JhbW1hci5CdWlsdEluUnVsZXMpO1xuaW5pdFByb3RvdHlwZVBhcnNlcihvcGVyYXRpb25zQW5kQXR0cmlidXRlc0dyYW1tYXIpOyAvLyByZXF1aXJlcyBCdWlsdEluU2VtYW50aWNzXG5cbmZ1bmN0aW9uIGluaXRCdWlsdEluU2VtYW50aWNzKGJ1aWx0SW5SdWxlcykge1xuICBjb25zdCBhY3Rpb25zID0ge1xuICAgIGVtcHR5KCkge1xuICAgICAgcmV0dXJuIHRoaXMuaXRlcmF0aW9uKCk7XG4gICAgfSxcbiAgICBub25FbXB0eShmaXJzdCwgXywgcmVzdCkge1xuICAgICAgcmV0dXJuIHRoaXMuaXRlcmF0aW9uKFtmaXJzdF0uY29uY2F0KHJlc3QuY2hpbGRyZW4pKTtcbiAgICB9LFxuICAgIHNlbGYoLi4uX2NoaWxkcmVuKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICB9O1xuXG4gIFNlbWFudGljcy5CdWlsdEluU2VtYW50aWNzID0gU2VtYW50aWNzLmNyZWF0ZVNlbWFudGljcyhidWlsdEluUnVsZXMsIG51bGwpLmFkZE9wZXJhdGlvbihcbiAgICAgICdhc0l0ZXJhdGlvbicsXG4gICAgICB7XG4gICAgICAgIGVtcHR5TGlzdE9mOiBhY3Rpb25zLmVtcHR5LFxuICAgICAgICBub25lbXB0eUxpc3RPZjogYWN0aW9ucy5ub25FbXB0eSxcbiAgICAgICAgRW1wdHlMaXN0T2Y6IGFjdGlvbnMuZW1wdHksXG4gICAgICAgIE5vbmVtcHR5TGlzdE9mOiBhY3Rpb25zLm5vbkVtcHR5LFxuICAgICAgICBfaXRlcjogYWN0aW9ucy5zZWxmLFxuICAgICAgfSxcbiAgKTtcbn1cblxuZnVuY3Rpb24gaW5pdFByb3RvdHlwZVBhcnNlcihncmFtbWFyKSB7XG4gIFNlbWFudGljcy5wcm90b3R5cGVHcmFtbWFyU2VtYW50aWNzID0gZ3JhbW1hci5jcmVhdGVTZW1hbnRpY3MoKS5hZGRPcGVyYXRpb24oJ3BhcnNlJywge1xuICAgIEF0dHJpYnV0ZVNpZ25hdHVyZShuYW1lKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBuYW1lLnBhcnNlKCksXG4gICAgICAgIGZvcm1hbHM6IFtdLFxuICAgICAgfTtcbiAgICB9LFxuICAgIE9wZXJhdGlvblNpZ25hdHVyZShuYW1lLCBvcHRGb3JtYWxzKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBuYW1lOiBuYW1lLnBhcnNlKCksXG4gICAgICAgIGZvcm1hbHM6IG9wdEZvcm1hbHMuY2hpbGRyZW4ubWFwKGMgPT4gYy5wYXJzZSgpKVswXSB8fCBbXSxcbiAgICAgIH07XG4gICAgfSxcbiAgICBGb3JtYWxzKG9wYXJlbiwgZnMsIGNwYXJlbikge1xuICAgICAgcmV0dXJuIGZzLmFzSXRlcmF0aW9uKCkuY2hpbGRyZW4ubWFwKGMgPT4gYy5wYXJzZSgpKTtcbiAgICB9LFxuICAgIG5hbWUoZmlyc3QsIHJlc3QpIHtcbiAgICAgIHJldHVybiB0aGlzLnNvdXJjZVN0cmluZztcbiAgICB9LFxuICB9KTtcbiAgU2VtYW50aWNzLnByb3RvdHlwZUdyYW1tYXIgPSBncmFtbWFyO1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIGZpbmRJbmRlbnRhdGlvbihpbnB1dCkge1xuICBsZXQgcG9zID0gMDtcbiAgY29uc3Qgc3RhY2sgPSBbMF07XG4gIGNvbnN0IHRvcE9mU3RhY2sgPSAoKSA9PiBzdGFja1tzdGFjay5sZW5ndGggLSAxXTtcblxuICBjb25zdCByZXN1bHQgPSB7fTtcblxuICBjb25zdCByZWdleCA9IC8oICopLiooPzokfFxccj9cXG58XFxyKS9nO1xuICBsZXQgbWF0Y2g7XG4gIHdoaWxlICgobWF0Y2ggPSByZWdleC5leGVjKGlucHV0KSkgIT0gbnVsbCkge1xuICAgIGNvbnN0IFtsaW5lLCBpbmRlbnRdID0gbWF0Y2g7XG5cbiAgICAvLyBUaGUgbGFzdCBtYXRjaCB3aWxsIGFsd2F5cyBoYXZlIGxlbmd0aCAwLiBJbiBldmVyeSBvdGhlciBjYXNlLCBzb21lXG4gICAgLy8gY2hhcmFjdGVycyB3aWxsIGJlIG1hdGNoZWQgKHBvc3NpYmx5IG9ubHkgdGhlIGVuZCBvZiBsaW5lIGNoYXJzKS5cbiAgICBpZiAobGluZS5sZW5ndGggPT09IDApIGJyZWFrO1xuXG4gICAgY29uc3QgaW5kZW50U2l6ZSA9IGluZGVudC5sZW5ndGg7XG4gICAgY29uc3QgcHJldlNpemUgPSB0b3BPZlN0YWNrKCk7XG5cbiAgICBjb25zdCBpbmRlbnRQb3MgPSBwb3MgKyBpbmRlbnRTaXplO1xuXG4gICAgaWYgKGluZGVudFNpemUgPiBwcmV2U2l6ZSkge1xuICAgICAgLy8gSW5kZW50IC0tIGFsd2F5cyBvbmx5IDEuXG4gICAgICBzdGFjay5wdXNoKGluZGVudFNpemUpO1xuICAgICAgcmVzdWx0W2luZGVudFBvc10gPSAxO1xuICAgIH0gZWxzZSBpZiAoaW5kZW50U2l6ZSA8IHByZXZTaXplKSB7XG4gICAgICAvLyBEZWRlbnQgLS0gY2FuIGJlIG11bHRpcGxlIGxldmVscy5cbiAgICAgIGNvbnN0IHByZXZMZW5ndGggPSBzdGFjay5sZW5ndGg7XG4gICAgICB3aGlsZSAodG9wT2ZTdGFjaygpICE9PSBpbmRlbnRTaXplKSB7XG4gICAgICAgIHN0YWNrLnBvcCgpO1xuICAgICAgfVxuICAgICAgcmVzdWx0W2luZGVudFBvc10gPSAtMSAqIChwcmV2TGVuZ3RoIC0gc3RhY2subGVuZ3RoKTtcbiAgICB9XG4gICAgcG9zICs9IGxpbmUubGVuZ3RoO1xuICB9XG4gIC8vIEVuc3VyZSB0aGF0IHRoZXJlIGlzIGEgbWF0Y2hpbmcgREVERU5UIGZvciBldmVyeSByZW1haW5pbmcgSU5ERU5ULlxuICBpZiAoc3RhY2subGVuZ3RoID4gMSkge1xuICAgIHJlc3VsdFtwb3NdID0gMSAtIHN0YWNrLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuIiwiaW1wb3J0IEJ1aWx0SW5SdWxlcyBmcm9tICcuLi9kaXN0L2J1aWx0LWluLXJ1bGVzLmpzJztcbmltcG9ydCB7QnVpbGRlcn0gZnJvbSAnLi4vc3JjL0J1aWxkZXIuanMnO1xuaW1wb3J0IHtGYWlsdXJlfSBmcm9tICcuLi9zcmMvRmFpbHVyZS5qcyc7XG5pbXBvcnQge1Rlcm1pbmFsTm9kZX0gZnJvbSAnLi4vc3JjL25vZGVzLmpzJztcbmltcG9ydCAqIGFzIHBleHBycyBmcm9tICcuLi9zcmMvcGV4cHJzLmpzJztcbmltcG9ydCB7ZmluZEluZGVudGF0aW9ufSBmcm9tICcuL2ZpbmRJbmRlbnRhdGlvbi5qcyc7XG5pbXBvcnQge0lucHV0U3RyZWFtfSBmcm9tICcuL0lucHV0U3RyZWFtLmpzJztcblxuY29uc3QgSU5ERU5UX0RFU0NSSVBUSU9OID0gJ2FuIGluZGVudGVkIGJsb2NrJztcbmNvbnN0IERFREVOVF9ERVNDUklQVElPTiA9ICdhIGRlZGVudCc7XG5cbi8vIEEgc2VudGluZWwgdmFsdWUgdGhhdCBpcyBvdXQgb2YgcmFuZ2UgZm9yIGJvdGggY2hhckNvZGVBdCgpIGFuZCBjb2RlUG9pbnRBdCgpLlxuY29uc3QgSU5WQUxJRF9DT0RFX1BPSU5UID0gMHgxMGZmZmYgKyAxO1xuXG5jbGFzcyBJbnB1dFN0cmVhbVdpdGhJbmRlbnRhdGlvbiBleHRlbmRzIElucHV0U3RyZWFtIHtcbiAgY29uc3RydWN0b3Ioc3RhdGUpIHtcbiAgICBzdXBlcihzdGF0ZS5pbnB1dCk7XG4gICAgdGhpcy5zdGF0ZSA9IHN0YXRlO1xuICB9XG5cbiAgX2luZGVudGF0aW9uQXQocG9zKSB7XG4gICAgcmV0dXJuIHRoaXMuc3RhdGUudXNlckRhdGFbcG9zXSB8fCAwO1xuICB9XG5cbiAgYXRFbmQoKSB7XG4gICAgcmV0dXJuIHN1cGVyLmF0RW5kKCkgJiYgdGhpcy5faW5kZW50YXRpb25BdCh0aGlzLnBvcykgPT09IDA7XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGlmICh0aGlzLl9pbmRlbnRhdGlvbkF0KHRoaXMucG9zKSAhPT0gMCkge1xuICAgICAgdGhpcy5leGFtaW5lZExlbmd0aCA9IE1hdGgubWF4KHRoaXMuZXhhbWluZWRMZW5ndGgsIHRoaXMucG9zKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIHJldHVybiBzdXBlci5uZXh0KCk7XG4gIH1cblxuICBuZXh0Q2hhckNvZGUoKSB7XG4gICAgaWYgKHRoaXMuX2luZGVudGF0aW9uQXQodGhpcy5wb3MpICE9PSAwKSB7XG4gICAgICB0aGlzLmV4YW1pbmVkTGVuZ3RoID0gTWF0aC5tYXgodGhpcy5leGFtaW5lZExlbmd0aCwgdGhpcy5wb3MpO1xuICAgICAgcmV0dXJuIElOVkFMSURfQ09ERV9QT0lOVDtcbiAgICB9XG4gICAgcmV0dXJuIHN1cGVyLm5leHRDaGFyQ29kZSgpO1xuICB9XG5cbiAgbmV4dENvZGVQb2ludCgpIHtcbiAgICBpZiAodGhpcy5faW5kZW50YXRpb25BdCh0aGlzLnBvcykgIT09IDApIHtcbiAgICAgIHRoaXMuZXhhbWluZWRMZW5ndGggPSBNYXRoLm1heCh0aGlzLmV4YW1pbmVkTGVuZ3RoLCB0aGlzLnBvcyk7XG4gICAgICByZXR1cm4gSU5WQUxJRF9DT0RFX1BPSU5UO1xuICAgIH1cbiAgICByZXR1cm4gc3VwZXIubmV4dENvZGVQb2ludCgpO1xuICB9XG59XG5cbmNsYXNzIEluZGVudGF0aW9uIGV4dGVuZHMgcGV4cHJzLlBFeHByIHtcbiAgY29uc3RydWN0b3IoaXNJbmRlbnQgPSB0cnVlKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmlzSW5kZW50ID0gaXNJbmRlbnQ7XG4gIH1cblxuICBhbGxvd3NTa2lwcGluZ1ByZWNlZGluZ1NwYWNlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZXZhbChzdGF0ZSkge1xuICAgIGNvbnN0IHtpbnB1dFN0cmVhbX0gPSBzdGF0ZTtcbiAgICBjb25zdCBwc2V1ZG9Ub2tlbnMgPSBzdGF0ZS51c2VyRGF0YTtcbiAgICBzdGF0ZS5kb05vdE1lbW9pemUgPSB0cnVlO1xuXG4gICAgY29uc3Qgb3JpZ1BvcyA9IGlucHV0U3RyZWFtLnBvcztcblxuICAgIGNvbnN0IHNpZ24gPSB0aGlzLmlzSW5kZW50ID8gMSA6IC0xO1xuICAgIGNvbnN0IGNvdW50ID0gKHBzZXVkb1Rva2Vuc1tvcmlnUG9zXSB8fCAwKSAqIHNpZ247XG4gICAgaWYgKGNvdW50ID4gMCkge1xuICAgICAgLy8gVXBkYXRlIHRoZSBjb3VudCB0byBjb25zdW1lIHRoZSBwc2V1ZG90b2tlbi5cbiAgICAgIHN0YXRlLnVzZXJEYXRhID0gT2JqZWN0LmNyZWF0ZShwc2V1ZG9Ub2tlbnMpO1xuICAgICAgc3RhdGUudXNlckRhdGFbb3JpZ1Bvc10gLT0gc2lnbjtcblxuICAgICAgc3RhdGUucHVzaEJpbmRpbmcobmV3IFRlcm1pbmFsTm9kZSgwKSwgb3JpZ1Bvcyk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUucHJvY2Vzc0ZhaWx1cmUob3JpZ1BvcywgdGhpcyk7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgZ2V0QXJpdHkoKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cblxuICBfYXNzZXJ0QWxsQXBwbGljYXRpb25zQXJlVmFsaWQocnVsZU5hbWUsIGdyYW1tYXIpIHt9XG5cbiAgX2lzTnVsbGFibGUoZ3JhbW1hciwgbWVtbykge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGFzc2VydENob2ljZXNIYXZlVW5pZm9ybUFyaXR5KHJ1bGVOYW1lKSB7fVxuXG4gIGFzc2VydEl0ZXJhdGVkRXhwcnNBcmVOb3ROdWxsYWJsZShncmFtbWFyKSB7fVxuXG4gIGludHJvZHVjZVBhcmFtcyhmb3JtYWxzKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzdWJzdGl0dXRlUGFyYW1zKGFjdHVhbHMpIHtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHRvU3RyaW5nKCkge1xuICAgIHJldHVybiB0aGlzLmlzSW5kZW50ID8gJ2luZGVudCcgOiAnZGVkZW50JztcbiAgfVxuXG4gIHRvRGlzcGxheVN0cmluZygpIHtcbiAgICByZXR1cm4gdGhpcy50b1N0cmluZygpO1xuICB9XG5cbiAgdG9GYWlsdXJlKGdyYW1tYXIpIHtcbiAgICBjb25zdCBkZXNjcmlwdGlvbiA9IHRoaXMuaXNJbmRlbnQgPyBJTkRFTlRfREVTQ1JJUFRJT04gOiBERURFTlRfREVTQ1JJUFRJT047XG4gICAgcmV0dXJuIG5ldyBGYWlsdXJlKHRoaXMsIGRlc2NyaXB0aW9uLCAnZGVzY3JpcHRpb24nKTtcbiAgfVxufVxuXG4vLyBDcmVhdGUgYSBuZXcgZGVmaW5pdGlvbiBmb3IgYGFueWAgdGhhdCBjYW4gY29uc3VtZSBpbmRlbnQgJiBkZWRlbnQuXG5jb25zdCBhcHBseUluZGVudCA9IG5ldyBwZXhwcnMuQXBwbHkoJ2luZGVudCcpO1xuY29uc3QgYXBwbHlEZWRlbnQgPSBuZXcgcGV4cHJzLkFwcGx5KCdkZWRlbnQnKTtcbmNvbnN0IG5ld0FueUJvZHkgPSBuZXcgcGV4cHJzLlNwbGljZShCdWlsdEluUnVsZXMsICdhbnknLCBbYXBwbHlJbmRlbnQsIGFwcGx5RGVkZW50XSwgW10pO1xuXG5leHBvcnQgY29uc3QgSW5kZW50YXRpb25TZW5zaXRpdmUgPSBuZXcgQnVpbGRlcigpXG4gICAgLm5ld0dyYW1tYXIoJ0luZGVudGF0aW9uU2Vuc2l0aXZlJylcbiAgICAud2l0aFN1cGVyR3JhbW1hcihCdWlsdEluUnVsZXMpXG4gICAgLmRlZmluZSgnaW5kZW50JywgW10sIG5ldyBJbmRlbnRhdGlvbih0cnVlKSwgSU5ERU5UX0RFU0NSSVBUSU9OLCB1bmRlZmluZWQsIHRydWUpXG4gICAgLmRlZmluZSgnZGVkZW50JywgW10sIG5ldyBJbmRlbnRhdGlvbihmYWxzZSksIERFREVOVF9ERVNDUklQVElPTiwgdW5kZWZpbmVkLCB0cnVlKVxuICAgIC5leHRlbmQoJ2FueScsIFtdLCBuZXdBbnlCb2R5LCAnYW55IGNoYXJhY3RlcicsIHVuZGVmaW5lZClcbiAgICAuYnVpbGQoKTtcblxuT2JqZWN0LmFzc2lnbihJbmRlbnRhdGlvblNlbnNpdGl2ZSwge1xuICBfbWF0Y2hTdGF0ZUluaXRpYWxpemVyKHN0YXRlKSB7XG4gICAgc3RhdGUudXNlckRhdGEgPSBmaW5kSW5kZW50YXRpb24oc3RhdGUuaW5wdXQpO1xuICAgIHN0YXRlLmlucHV0U3RyZWFtID0gbmV3IElucHV0U3RyZWFtV2l0aEluZGVudGF0aW9uKHN0YXRlKTtcbiAgfSxcbiAgc3VwcG9ydHNJbmNyZW1lbnRhbFBhcnNpbmc6IGZhbHNlLFxufSk7XG4iLCIvLyBHZW5lcmF0ZWQgYnkgc2NyaXB0cy9wcmVidWlsZC5qc1xuZXhwb3J0IGNvbnN0IHZlcnNpb24gPSAnMTcuMi4xJztcbiIsImltcG9ydCBvaG1HcmFtbWFyIGZyb20gJy4uL2Rpc3Qvb2htLWdyYW1tYXIuanMnO1xuaW1wb3J0IHtidWlsZEdyYW1tYXJ9IGZyb20gJy4vYnVpbGRHcmFtbWFyLmpzJztcbmltcG9ydCAqIGFzIGNvbW1vbiBmcm9tICcuL2NvbW1vbi5qcyc7XG5pbXBvcnQgKiBhcyBlcnJvcnMgZnJvbSAnLi9lcnJvcnMuanMnO1xuaW1wb3J0IHtHcmFtbWFyfSBmcm9tICcuL0dyYW1tYXIuanMnO1xuaW1wb3J0ICogYXMgcGV4cHJzIGZyb20gJy4vcGV4cHJzLmpzJztcbmltcG9ydCAqIGFzIHV0aWwgZnJvbSAnLi91dGlsLmpzJztcblxuLy8gTGF0ZSBpbml0aWFsaXphdGlvbiBmb3Igc3R1ZmYgdGhhdCBpcyBib290c3RyYXBwZWQuXG5cbmltcG9ydCAnLi9zZW1hbnRpY3NEZWZlcnJlZEluaXQuanMnOyAvLyBUT0RPOiBDbGVhbiB0aGlzIHVwLlxuR3JhbW1hci5pbml0QXBwbGljYXRpb25QYXJzZXIob2htR3JhbW1hciwgYnVpbGRHcmFtbWFyKTtcblxuY29uc3QgaXNCdWZmZXIgPSBvYmogPT5cbiAgISFvYmouY29uc3RydWN0b3IgJiZcbiAgdHlwZW9mIG9iai5jb25zdHJ1Y3Rvci5pc0J1ZmZlciA9PT0gJ2Z1bmN0aW9uJyAmJlxuICBvYmouY29uc3RydWN0b3IuaXNCdWZmZXIob2JqKTtcblxuZnVuY3Rpb24gY29tcGlsZUFuZExvYWQoc291cmNlLCBuYW1lc3BhY2UpIHtcbiAgY29uc3QgbSA9IG9obUdyYW1tYXIubWF0Y2goc291cmNlLCAnR3JhbW1hcnMnKTtcbiAgaWYgKG0uZmFpbGVkKCkpIHtcbiAgICB0aHJvdyBlcnJvcnMuZ3JhbW1hclN5bnRheEVycm9yKG0pO1xuICB9XG4gIHJldHVybiBidWlsZEdyYW1tYXIobSwgbmFtZXNwYWNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdyYW1tYXIoc291cmNlLCBvcHROYW1lc3BhY2UpIHtcbiAgY29uc3QgbnMgPSBncmFtbWFycyhzb3VyY2UsIG9wdE5hbWVzcGFjZSk7XG5cbiAgLy8gRW5zdXJlIHRoYXQgdGhlIHNvdXJjZSBjb250YWluZWQgbm8gbW9yZSB0aGFuIG9uZSBncmFtbWFyIGRlZmluaXRpb24uXG4gIGNvbnN0IGdyYW1tYXJOYW1lcyA9IE9iamVjdC5rZXlzKG5zKTtcbiAgaWYgKGdyYW1tYXJOYW1lcy5sZW5ndGggPT09IDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ01pc3NpbmcgZ3JhbW1hciBkZWZpbml0aW9uJyk7XG4gIH0gZWxzZSBpZiAoZ3JhbW1hck5hbWVzLmxlbmd0aCA+IDEpIHtcbiAgICBjb25zdCBzZWNvbmRHcmFtbWFyID0gbnNbZ3JhbW1hck5hbWVzWzFdXTtcbiAgICBjb25zdCBpbnRlcnZhbCA9IHNlY29uZEdyYW1tYXIuc291cmNlO1xuICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgdXRpbC5nZXRMaW5lQW5kQ29sdW1uTWVzc2FnZShpbnRlcnZhbC5zb3VyY2VTdHJpbmcsIGludGVydmFsLnN0YXJ0SWR4KSArXG4gICAgICAgICdGb3VuZCBtb3JlIHRoYW4gb25lIGdyYW1tYXIgZGVmaW5pdGlvbiAtLSB1c2Ugb2htLmdyYW1tYXJzKCkgaW5zdGVhZC4nLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIG5zW2dyYW1tYXJOYW1lc1swXV07IC8vIFJldHVybiB0aGUgb25lIGFuZCBvbmx5IGdyYW1tYXIuXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBncmFtbWFycyhzb3VyY2UsIG9wdE5hbWVzcGFjZSkge1xuICBjb25zdCBucyA9IE9iamVjdC5jcmVhdGUob3B0TmFtZXNwYWNlIHx8IHt9KTtcbiAgaWYgKHR5cGVvZiBzb3VyY2UgIT09ICdzdHJpbmcnKSB7XG4gICAgLy8gRm9yIGNvbnZlbmllbmNlLCBkZXRlY3QgTm9kZS5qcyBCdWZmZXIgb2JqZWN0cyBhbmQgYXV0b21hdGljYWxseSBjYWxsIHRvU3RyaW5nKCkuXG4gICAgaWYgKGlzQnVmZmVyKHNvdXJjZSkpIHtcbiAgICAgIHNvdXJjZSA9IHNvdXJjZS50b1N0cmluZygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICAgICdFeHBlY3RlZCBzdHJpbmcgYXMgZmlyc3QgYXJndW1lbnQsIGdvdCAnICsgY29tbW9uLnVuZXhwZWN0ZWRPYmpUb1N0cmluZyhzb3VyY2UpLFxuICAgICAgKTtcbiAgICB9XG4gIH1cbiAgY29tcGlsZUFuZExvYWQoc291cmNlLCBucyk7XG4gIHJldHVybiBucztcbn1cblxuLy8gVGhpcyBpcyB1c2VkIGJ5IG9obS1lZGl0b3IgdG8gaW5zdGFudGlhdGUgZ3JhbW1hcnMgYWZ0ZXIgaW5jcmVtZW50YWxcbi8vIHBhcnNpbmcsIHdoaWNoIGlzIG5vdCBvdGhlcndpc2Ugc3VwcG9ydGVkIGluIHRoZSBwdWJsaWMgQVBJLlxuZXhwb3J0IHtidWlsZEdyYW1tYXIgYXMgX2J1aWxkR3JhbW1hcn07XG5cbmV4cG9ydCAqIGZyb20gJy4vbWFpbi1rZXJuZWwuanMnO1xuZXhwb3J0IHtJbmRlbnRhdGlvblNlbnNpdGl2ZSBhcyBFeHBlcmltZW50YWxJbmRlbnRhdGlvblNlbnNpdGl2ZX0gZnJvbSAnLi9JbmRlbnRhdGlvblNlbnNpdGl2ZS5qcyc7XG5leHBvcnQge29obUdyYW1tYXJ9O1xuZXhwb3J0IHtwZXhwcnN9O1xuZXhwb3J0IHt2ZXJzaW9ufSBmcm9tICcuL3ZlcnNpb24uanMnO1xuIl0sIm5hbWVzIjpbImNvbW1vbi5pc1N5bnRhY3RpYyIsInBleHBycy5BcHBseSIsImNvbW1vbi5wYWRMZWZ0IiwiY29tbW9uLlN0cmluZ0J1ZmZlciIsImNvbW1vbi5hc3NlcnQiLCJ1dGlsLmdldExpbmVBbmRDb2x1bW4iLCJ1dGlsLmdldExpbmVBbmRDb2x1bW5NZXNzYWdlIiwiZXJyb3JzLmludGVydmFsU291cmNlc0RvbnRNYXRjaCIsImNvbW1vbi5kZWZpbmVMYXp5UHJvcGVydHkiLCJjb21tb24ucmVwZWF0IiwicGV4cHJzLlBFeHByIiwicGV4cHJzLmFueSIsInBleHBycy5lbmQiLCJwZXhwcnMuVGVybWluYWwiLCJwZXhwcnMuUmFuZ2UiLCJwZXhwcnMuVW5pY29kZUNoYXIiLCJwZXhwcnMuQWx0IiwicGV4cHJzLkl0ZXIiLCJwZXhwcnMuTGV4IiwicGV4cHJzLkxvb2thaGVhZCIsInBleHBycy5Ob3QiLCJwZXhwcnMuUGFyYW0iLCJwZXhwcnMuU2VxIiwiQnVpbHRJblJ1bGVzIiwidXRpbC5hd2FpdEJ1aWx0SW5SdWxlcyIsImVycm9ycy51bmRlY2xhcmVkUnVsZSIsImVycm9ycy5hcHBsaWNhdGlvbk9mU3ludGFjdGljUnVsZUZyb21MZXhpY2FsQ29udGV4dCIsImVycm9ycy53cm9uZ051bWJlck9mQXJndW1lbnRzIiwiZXJyb3JzLmluY29ycmVjdEFyZ3VtZW50VHlwZSIsImVycm9ycy5hcHBseVN5bnRhY3RpY1dpdGhMZXhpY2FsUnVsZUFwcGxpY2F0aW9uIiwiZXJyb3JzLnVubmVjZXNzYXJ5RXhwZXJpbWVudGFsQXBwbHlTeW50YWN0aWMiLCJlcnJvcnMuaW52YWxpZFBhcmFtZXRlciIsImVycm9ycy5pbmNvbnNpc3RlbnRBcml0eSIsInBleHBycy5FeHRlbmQiLCJlcnJvcnMua2xlZW5lRXhwckhhc051bGxhYmxlT3BlcmFuZCIsInBleHBycy5PcHQiLCJjb21tb24uaXNMZXhpY2FsIiwiY29tbW9uLmFic3RyYWN0IiwicGV4cHJzLlNwbGljZSIsInBleHBycy5TdGFyIiwicGV4cHJzLlBsdXMiLCJ1dGlsLnVuaXF1ZUlkIiwiZXJyb3JzLm1pc3NpbmdTZW1hbnRpY0FjdGlvbiIsImNvbW1vbi51bmV4cGVjdGVkT2JqVG9TdHJpbmciLCJvaG1HcmFtbWFyIiwiYnVpbGRHcmFtbWFyIiwiZXJyb3JzLndyb25nTnVtYmVyT2ZQYXJhbWV0ZXJzIiwicGV4cHJzLkNhc2VJbnNlbnNpdGl2ZVRlcm1pbmFsIiwiZXJyb3JzLmNhbm5vdE92ZXJyaWRlVW5kZWNsYXJlZFJ1bGUiLCJkdXBsaWNhdGVQYXJhbWV0ZXJOYW1lcyIsImVycm9ycy5kdXBsaWNhdGVQYXJhbWV0ZXJOYW1lcyIsImVycm9ycy50aHJvd0Vycm9ycyIsImVycm9ycy5kdXBsaWNhdGVSdWxlRGVjbGFyYXRpb24iLCJlcnJvcnMuY2Fubm90RXh0ZW5kVW5kZWNsYXJlZFJ1bGUiLCJlcnJvcnMuZHVwbGljYXRlR3JhbW1hckRlY2xhcmF0aW9uIiwiZXJyb3JzLnVuZGVjbGFyZWRHcmFtbWFyIiwiZXJyb3JzLm11bHRpcGxlU3VwZXJTcGxpY2VzIiwiY29tbW9uLnVuZXNjYXBlQ29kZVBvaW50IiwiZXJyb3JzLmludmFsaWRDb2RlUG9pbnQiLCJlcnJvcnMuZ3JhbW1hclN5bnRheEVycm9yIl0sIm1hcHBpbmdzIjoiOzs7Ozs7RUFBQTtBQW1CQTtF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LENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O0VDR2p6RyxPQUFPLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztFQUNwQyxvQkFBb0IsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDOztBQ0oxQyxtQkFBZSxVQUFVLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsKzlGQUErOUYsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGtDQUFrQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsa0NBQWtDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLDJCQUEyQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLDZCQUE2QixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsd0JBQXdCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxxQkFBcUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsMkJBQTJCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyw2QkFBNkIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsMEJBQTBCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLHNCQUFzQixDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFtQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQW1CLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztFQ00vam5CLE1BQU0sc0JBQXNCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQzVCLEtBQVksQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyRTtFQUNBLFNBQVMsWUFBWSxDQUFDLEVBQUUsRUFBRSxJQUFJLEVBQUU7RUFDaEM7RUFDQSxFQUFFLEtBQUssTUFBTSxJQUFJLElBQUksRUFBRSxFQUFFO0VBQ3pCLElBQUksSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLE9BQU8sSUFBSSxDQUFDO0VBQ25DLEdBQUc7RUFDSCxFQUFFLE9BQU8sS0FBSyxDQUFDO0VBQ2YsQ0FBQztBQUNEO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDTyxTQUFTLFlBQVksQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLHVCQUF1QixFQUFFO0VBQ3hFLEVBQUUsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztFQUNoQyxFQUFFLElBQUksSUFBSSxDQUFDO0VBQ1gsRUFBRSxJQUFJLGVBQWUsQ0FBQztFQUN0QixFQUFFLElBQUksa0JBQWtCLENBQUM7RUFDekIsRUFBRSxJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUM7RUFDekIsRUFBRSxNQUFNLFdBQVcsR0FBRyx1QkFBdUIsSUFBSSxVQUFVLENBQUM7QUFDNUQ7RUFDQTtFQUNBLEVBQUUsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLGVBQWUsRUFBRSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUU7RUFDdEUsSUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFO0VBQzFCLE1BQU0sT0FBTyxXQUFXLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7RUFDdEQsS0FBSztFQUNMLElBQUksT0FBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUU7RUFDekMsTUFBTSxNQUFNLFdBQVcsR0FBRyxFQUFFLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDckMsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQztFQUM3QyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUN2QyxNQUFNLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztFQUN6QyxNQUFNLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUM3QixNQUFNLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztFQUN2QyxNQUFNLElBQUksWUFBWSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsRUFBRTtFQUNoRCxRQUFRLE1BQU00QywyQkFBa0MsQ0FBQyxDQUFZLENBQUMsQ0FBQztFQUMvRCxPQUFPO0VBQ1AsTUFBTSxTQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ2pDLE1BQU0sT0FBTyxDQUFDLENBQUM7RUFDZixLQUFLO0FBQ0w7RUFDQSxJQUFJLFlBQVksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ3ZCLE1BQU0sTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDekMsTUFBTSxJQUFJLGdCQUFnQixLQUFLLE1BQU0sRUFBRTtFQUN2QyxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztFQUNwQyxPQUFPLE1BQU07RUFDYixRQUFRLElBQUksQ0FBQyxTQUFTLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLGdCQUFnQixDQUFDLEVBQUU7RUFDdEUsVUFBVSxNQUFNQyxpQkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ2hGLFNBQVM7RUFDVCxRQUFRLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDO0VBQzNELE9BQU87RUFDUCxLQUFLO0FBQ0w7RUFDQSxJQUFJLFdBQVcsQ0FBQyxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ2hDLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUNsQyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7RUFDcEU7RUFDQTtFQUNBLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsSUFBSSxJQUFJLENBQUMsa0JBQWtCLEVBQUUsS0FBSyxPQUFPLENBQUMsaUJBQWlCLEVBQUU7RUFDN0YsUUFBUSxJQUFJLENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUM7RUFDbkQsT0FBTztFQUNQLE1BQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQzdCLE1BQU0sTUFBTSxXQUFXLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQzVELE1BQU0sTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUUsQ0FBQztFQUMzQyxNQUFNLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztFQUN6RixLQUFLO0VBQ0wsSUFBSSxhQUFhLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQy9CLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUNsQyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDcEU7RUFDQSxNQUFNLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7RUFDM0MsTUFBTSxJQUFJLENBQUMsbUNBQW1DLENBQUMsZUFBZSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3hFO0VBQ0EsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDO0VBQ3hCLE1BQU0sTUFBTSxJQUFJLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQzdCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQztFQUN6QixNQUFNLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztFQUNwRixLQUFLO0VBQ0wsSUFBSSxXQUFXLENBQUMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQzdCLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUNsQyxNQUFNLGtCQUFrQixHQUFHLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7RUFDcEUsTUFBTSxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDN0IsTUFBTSxNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxDQUFDO0VBQzNDLE1BQU0sT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0VBQ2xGLEtBQUs7RUFDTCxJQUFJLFFBQVEsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQ3ZCLE1BQU0sT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNuRSxLQUFLO0VBQ0wsSUFBSSxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQy9CLE1BQU0sTUFBTSxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2pDO0VBQ0E7RUFDQSxNQUFNLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsQ0FBQztFQUNoRSxNQUFNLElBQUksWUFBWSxJQUFJLENBQUMsRUFBRTtFQUM3QixRQUFRLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO0VBQ3hELFFBQVEsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEQ7RUFDQTtFQUNBLFFBQVEsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUk7RUFDaEMsVUFBVSxJQUFJLENBQUMsS0FBSyxzQkFBc0IsRUFBRSxNQUFNQyxvQkFBMkIsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNqRixTQUFTLENBQUMsQ0FBQztBQUNYO0VBQ0EsUUFBUSxPQUFPLElBQUlsQixNQUFhO0VBQ2hDLFlBQVksSUFBSSxDQUFDLFlBQVk7RUFDN0IsWUFBWSxlQUFlO0VBQzNCLFlBQVksV0FBVztFQUN2QixZQUFZLFVBQVU7RUFDdEIsU0FBUyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDbEMsT0FBTyxNQUFNO0VBQ2IsUUFBUSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQzVELE9BQU87RUFDUCxLQUFLO0VBQ0wsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxPQUFPLEVBQUU7RUFDbEMsTUFBTSxPQUFPLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUN4QixLQUFLO0FBQ0w7RUFDQSxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRTtFQUNqQyxNQUFNLE9BQU8sRUFBRSxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQ3hCLEtBQUs7QUFDTDtFQUNBLElBQUksR0FBRyxDQUFDLElBQUksRUFBRTtFQUNkLE1BQU0sT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNsRSxLQUFLO0FBQ0w7RUFDQSxJQUFJLG1CQUFtQixDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDOUIsTUFBTSxNQUFNLGNBQWMsR0FBRyxlQUFlLEdBQUcsR0FBRyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUMvRCxNQUFNLE1BQU0sSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztFQUM3QixNQUFNLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLENBQUM7RUFDM0MsTUFBTSxNQUFNLG9CQUFvQixHQUFHO0VBQ25DLFFBQVEsSUFBSSxDQUFDLFlBQVksSUFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUM7RUFDcEUsT0FBTyxDQUFDO0VBQ1IsTUFBTSxJQUFJLFVBQVUsSUFBSSxDQUFDLG9CQUFvQixFQUFFO0VBQy9DLFFBQVEsSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQztFQUM5RSxPQUFPLE1BQU07RUFDYixRQUFRLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxFQUFFLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7RUFDNUUsT0FBTztFQUNQLE1BQU0sTUFBTSxNQUFNLEdBQUcsa0JBQWtCLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7RUFDM0UsTUFBTSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsY0FBYyxFQUFFLE1BQU0sQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDekUsS0FBSztFQUNMLElBQUksZ0NBQWdDLENBQUMsQ0FBQyxFQUFFO0VBQ3hDLE1BQU0sT0FBTyxzQkFBc0IsQ0FBQztFQUNwQyxLQUFLO0FBQ0w7RUFDQSxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUU7RUFDZCxNQUFNLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDdkYsS0FBSztBQUNMO0VBQ0EsSUFBSSxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtFQUNwQixNQUFNLE9BQU8sT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQzdELEtBQUs7RUFDTCxJQUFJLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ3BCLE1BQU0sT0FBTyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDN0QsS0FBSztFQUNMLElBQUksUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDbkIsTUFBTSxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUM1RCxLQUFLO0FBQ0w7RUFDQSxJQUFJLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ25CLE1BQU0sT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDNUQsS0FBSztFQUNMLElBQUksY0FBYyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDekIsTUFBTSxPQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUNsRSxLQUFLO0FBQ0w7RUFDQSxJQUFJLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0VBQ2xCLE1BQU0sT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDNUQsS0FBSztBQUNMO0VBQ0EsSUFBSSxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFO0VBQy9CLE1BQU0sTUFBTSxNQUFNLEdBQUcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUM5RCxNQUFNLE9BQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEVBQUUsTUFBTSxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztFQUN2RSxLQUFLO0VBQ0wsSUFBSSxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7RUFDNUIsTUFBTSxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7RUFDN0UsS0FBSztFQUNMLElBQUksYUFBYSxDQUFDLElBQUksRUFBRTtFQUN4QixNQUFNLE9BQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0VBQ3BFLEtBQUs7RUFDTCxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtFQUMvQixNQUFNLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQ3ZCLEtBQUs7QUFDTDtFQUNBLElBQUksU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFO0VBQzlCLE1BQU0sT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDdkIsS0FBSztFQUNMLElBQUksYUFBYSxDQUFDLENBQUMsRUFBRTtFQUNyQixNQUFNLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsQ0FBQztFQUN0QyxLQUFLO0FBQ0w7RUFDQSxJQUFJLFFBQVEsQ0FBQyxDQUFDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFO0VBQ3hDLE1BQU0sT0FBTyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDdkIsS0FBSztBQUNMO0VBQ0EsSUFBSSxJQUFJLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRTtFQUN0QixNQUFNLE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQztFQUMvQixLQUFLO0VBQ0wsSUFBSSxTQUFTLENBQUMsSUFBSSxFQUFFLEVBQUU7RUFDdEIsSUFBSSxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUU7QUFDckI7RUFDQSxJQUFJLFFBQVEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRTtFQUM5QixNQUFNLE9BQU8sRUFBRSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztFQUN0RCxLQUFLO0FBQ0w7RUFDQSxJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRTtFQUNwQyxNQUFNLE9BQU8sQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDO0VBQ3ZCLEtBQUs7QUFDTDtFQUNBLElBQUksVUFBVSxDQUFDLENBQUMsRUFBRTtFQUNsQixNQUFNLElBQUk7RUFDVixRQUFRLE9BQU9tQixpQkFBd0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7RUFDM0QsT0FBTyxDQUFDLE9BQU8sR0FBRyxFQUFFO0VBQ3BCLFFBQVEsSUFBSSxHQUFHLFlBQVksVUFBVSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHFCQUFxQixDQUFDLEVBQUU7RUFDeEYsVUFBVSxNQUFNQyxnQkFBdUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUMzQyxTQUFTO0VBQ1QsUUFBUSxNQUFNLEdBQUcsQ0FBQztFQUNsQixPQUFPO0VBQ1AsS0FBSztBQUNMO0VBQ0EsSUFBSSxjQUFjLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUU7RUFDN0IsTUFBTSxPQUFPLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO0VBQ2pFLEtBQUs7RUFDTCxJQUFJLFdBQVcsR0FBRztFQUNsQixNQUFNLE9BQU8sRUFBRSxDQUFDO0VBQ2hCLEtBQUs7QUFDTDtFQUNBLElBQUksU0FBUyxHQUFHO0VBQ2hCLE1BQU0sT0FBTyxJQUFJLENBQUMsWUFBWSxDQUFDO0VBQy9CLEtBQUs7RUFDTCxHQUFHLENBQUMsQ0FBQztFQUNMLEVBQUUsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7RUFDaEM7O0FDNU9BLHVDQUFlLFVBQVUsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxzU0FBc1MsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLGdCQUFnQixDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcs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
