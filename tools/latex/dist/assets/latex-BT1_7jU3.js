var e = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {};
function t(e6) {
  return e6 && e6.__esModule && Object.prototype.hasOwnProperty.call(e6, "default") ? e6.default : e6;
}
function r(e6) {
  if (e6.__esModule) return e6;
  var t2 = e6.default;
  if ("function" == typeof t2) {
    var r2 = function e7() {
      if (this instanceof e7) {
        var r3 = [null];
        return r3.push.apply(r3, arguments), new (Function.bind.apply(t2, r3))();
      }
      return t2.apply(this, arguments);
    };
    r2.prototype = t2.prototype;
  } else r2 = {};
  return Object.defineProperty(r2, "__esModule", { value: true }), Object.keys(e6).forEach((function(t3) {
    var n2 = Object.getOwnPropertyDescriptor(e6, t3);
    Object.defineProperty(r2, t3, n2.get ? n2 : { enumerable: true, get: function() {
      return e6[t3];
    } });
  })), r2;
}
var n, i, o = { exports: {} };
n = o, i = o.exports, (function(t2) {
  var r2 = i, o2 = n && n.exports == r2 && n, a2 = "object" == typeof e && e;
  a2.global !== a2 && a2.window !== a2 || (t2 = a2);
  var s2 = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g, l2 = /[\x01-\x7F]/g, u2 = /[\x01-\t\x0B\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g, c2 = /<\u20D2|=\u20E5|>\u20D2|\u205F\u200A|\u219D\u0338|\u2202\u0338|\u2220\u20D2|\u2229\uFE00|\u222A\uFE00|\u223C\u20D2|\u223D\u0331|\u223E\u0333|\u2242\u0338|\u224B\u0338|\u224D\u20D2|\u224E\u0338|\u224F\u0338|\u2250\u0338|\u2261\u20E5|\u2264\u20D2|\u2265\u20D2|\u2266\u0338|\u2267\u0338|\u2268\uFE00|\u2269\uFE00|\u226A\u0338|\u226A\u20D2|\u226B\u0338|\u226B\u20D2|\u227F\u0338|\u2282\u20D2|\u2283\u20D2|\u228A\uFE00|\u228B\uFE00|\u228F\u0338|\u2290\u0338|\u2293\uFE00|\u2294\uFE00|\u22B4\u20D2|\u22B5\u20D2|\u22D8\u0338|\u22D9\u0338|\u22DA\uFE00|\u22DB\uFE00|\u22F5\u0338|\u22F9\u0338|\u2933\u0338|\u29CF\u0338|\u29D0\u0338|\u2A6D\u0338|\u2A70\u0338|\u2A7D\u0338|\u2A7E\u0338|\u2AA1\u0338|\u2AA2\u0338|\u2AAC\uFE00|\u2AAD\uFE00|\u2AAF\u0338|\u2AB0\u0338|\u2AC5\u0338|\u2AC6\u0338|\u2ACB\uFE00|\u2ACC\uFE00|\u2AFD\u20E5|[\xA0-\u0113\u0116-\u0122\u0124-\u012B\u012E-\u014D\u0150-\u017E\u0192\u01B5\u01F5\u0237\u02C6\u02C7\u02D8-\u02DD\u0311\u0391-\u03A1\u03A3-\u03A9\u03B1-\u03C9\u03D1\u03D2\u03D5\u03D6\u03DC\u03DD\u03F0\u03F1\u03F5\u03F6\u0401-\u040C\u040E-\u044F\u0451-\u045C\u045E\u045F\u2002-\u2005\u2007-\u2010\u2013-\u2016\u2018-\u201A\u201C-\u201E\u2020-\u2022\u2025\u2026\u2030-\u2035\u2039\u203A\u203E\u2041\u2043\u2044\u204F\u2057\u205F-\u2063\u20AC\u20DB\u20DC\u2102\u2105\u210A-\u2113\u2115-\u211E\u2122\u2124\u2127-\u2129\u212C\u212D\u212F-\u2131\u2133-\u2138\u2145-\u2148\u2153-\u215E\u2190-\u219B\u219D-\u21A7\u21A9-\u21AE\u21B0-\u21B3\u21B5-\u21B7\u21BA-\u21DB\u21DD\u21E4\u21E5\u21F5\u21FD-\u2205\u2207-\u2209\u220B\u220C\u220F-\u2214\u2216-\u2218\u221A\u221D-\u2238\u223A-\u2257\u2259\u225A\u225C\u225F-\u2262\u2264-\u228B\u228D-\u229B\u229D-\u22A5\u22A7-\u22B0\u22B2-\u22BB\u22BD-\u22DB\u22DE-\u22E3\u22E6-\u22F7\u22F9-\u22FE\u2305\u2306\u2308-\u2310\u2312\u2313\u2315\u2316\u231C-\u231F\u2322\u2323\u232D\u232E\u2336\u233D\u233F\u237C\u23B0\u23B1\u23B4-\u23B6\u23DC-\u23DF\u23E2\u23E7\u2423\u24C8\u2500\u2502\u250C\u2510\u2514\u2518\u251C\u2524\u252C\u2534\u253C\u2550-\u256C\u2580\u2584\u2588\u2591-\u2593\u25A1\u25AA\u25AB\u25AD\u25AE\u25B1\u25B3-\u25B5\u25B8\u25B9\u25BD-\u25BF\u25C2\u25C3\u25CA\u25CB\u25EC\u25EF\u25F8-\u25FC\u2605\u2606\u260E\u2640\u2642\u2660\u2663\u2665\u2666\u266A\u266D-\u266F\u2713\u2717\u2720\u2736\u2758\u2772\u2773\u27C8\u27C9\u27E6-\u27ED\u27F5-\u27FA\u27FC\u27FF\u2902-\u2905\u290C-\u2913\u2916\u2919-\u2920\u2923-\u292A\u2933\u2935-\u2939\u293C\u293D\u2945\u2948-\u294B\u294E-\u2976\u2978\u2979\u297B-\u297F\u2985\u2986\u298B-\u2996\u299A\u299C\u299D\u29A4-\u29B7\u29B9\u29BB\u29BC\u29BE-\u29C5\u29C9\u29CD-\u29D0\u29DC-\u29DE\u29E3-\u29E5\u29EB\u29F4\u29F6\u2A00-\u2A02\u2A04\u2A06\u2A0C\u2A0D\u2A10-\u2A17\u2A22-\u2A27\u2A29\u2A2A\u2A2D-\u2A31\u2A33-\u2A3C\u2A3F\u2A40\u2A42-\u2A4D\u2A50\u2A53-\u2A58\u2A5A-\u2A5D\u2A5F\u2A66\u2A6A\u2A6D-\u2A75\u2A77-\u2A9A\u2A9D-\u2AA2\u2AA4-\u2AB0\u2AB3-\u2AC8\u2ACB\u2ACC\u2ACF-\u2ADB\u2AE4\u2AE6-\u2AE9\u2AEB-\u2AF3\u2AFD\uFB00-\uFB04]|\uD835[\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDD6B]/g, h2 = { "­": "shy", "‌": "zwnj", "‍": "zwj", "‎": "lrm", "⁣": "ic", "⁢": "it", "⁡": "af", "‏": "rlm", "​": "ZeroWidthSpace", "⁠": "NoBreak", "̑": "DownBreve", "⃛": "tdot", "⃜": "DotDot", "	": "Tab", "\n": "NewLine", " ": "puncsp", " ": "MediumSpace", " ": "thinsp", " ": "hairsp", " ": "emsp13", " ": "ensp", " ": "emsp14", " ": "emsp", " ": "numsp", " ": "nbsp", "  ": "ThickSpace", "‾": "oline", _: "lowbar", "‐": "dash", "–": "ndash", "—": "mdash", "―": "horbar", ",": "comma", ";": "semi", "⁏": "bsemi", ":": "colon", "⩴": "Colone", "!": "excl", "¡": "iexcl", "?": "quest", "¿": "iquest", ".": "period", "‥": "nldr", "…": "mldr", "·": "middot", "'": "apos", "‘": "lsquo", "’": "rsquo", "‚": "sbquo", "‹": "lsaquo", "›": "rsaquo", '"': "quot", "“": "ldquo", "”": "rdquo", "„": "bdquo", "«": "laquo", "»": "raquo", "(": "lpar", ")": "rpar", "[": "lsqb", "]": "rsqb", "{": "lcub", "}": "rcub", "⌈": "lceil", "⌉": "rceil", "⌊": "lfloor", "⌋": "rfloor", "⦅": "lopar", "⦆": "ropar", "⦋": "lbrke", "⦌": "rbrke", "⦍": "lbrkslu", "⦎": "rbrksld", "⦏": "lbrksld", "⦐": "rbrkslu", "⦑": "langd", "⦒": "rangd", "⦓": "lparlt", "⦔": "rpargt", "⦕": "gtlPar", "⦖": "ltrPar", "⟦": "lobrk", "⟧": "robrk", "⟨": "lang", "⟩": "rang", "⟪": "Lang", "⟫": "Rang", "⟬": "loang", "⟭": "roang", "❲": "lbbrk", "❳": "rbbrk", "‖": "Vert", "§": "sect", "¶": "para", "@": "commat", "*": "ast", "/": "sol", undefined: null, "&": "amp", "#": "num", "%": "percnt", "‰": "permil", "‱": "pertenk", "†": "dagger", "‡": "Dagger", "•": "bull", "⁃": "hybull", "′": "prime", "″": "Prime", "‴": "tprime", "⁗": "qprime", "‵": "bprime", "⁁": "caret", "`": "grave", "´": "acute", "˜": "tilde", "^": "Hat", "¯": "macr", "˘": "breve", "˙": "dot", "¨": "die", "˚": "ring", "˝": "dblac", "¸": "cedil", "˛": "ogon", "ˆ": "circ", "ˇ": "caron", "°": "deg", "©": "copy", "®": "reg", "℗": "copysr", "℘": "wp", "℞": "rx", "℧": "mho", "℩": "iiota", "←": "larr", "↚": "nlarr", "→": "rarr", "↛": "nrarr", "↑": "uarr", "↓": "darr", "↔": "harr", "↮": "nharr", "↕": "varr", "↖": "nwarr", "↗": "nearr", "↘": "searr", "↙": "swarr", "↝": "rarrw", "↝̸": "nrarrw", "↞": "Larr", "↟": "Uarr", "↠": "Rarr", "↡": "Darr", "↢": "larrtl", "↣": "rarrtl", "↤": "mapstoleft", "↥": "mapstoup", "↦": "map", "↧": "mapstodown", "↩": "larrhk", "↪": "rarrhk", "↫": "larrlp", "↬": "rarrlp", "↭": "harrw", "↰": "lsh", "↱": "rsh", "↲": "ldsh", "↳": "rdsh", "↵": "crarr", "↶": "cularr", "↷": "curarr", "↺": "olarr", "↻": "orarr", "↼": "lharu", "↽": "lhard", "↾": "uharr", "↿": "uharl", "⇀": "rharu", "⇁": "rhard", "⇂": "dharr", "⇃": "dharl", "⇄": "rlarr", "⇅": "udarr", "⇆": "lrarr", "⇇": "llarr", "⇈": "uuarr", "⇉": "rrarr", "⇊": "ddarr", "⇋": "lrhar", "⇌": "rlhar", "⇐": "lArr", "⇍": "nlArr", "⇑": "uArr", "⇒": "rArr", "⇏": "nrArr", "⇓": "dArr", "⇔": "iff", "⇎": "nhArr", "⇕": "vArr", "⇖": "nwArr", "⇗": "neArr", "⇘": "seArr", "⇙": "swArr", "⇚": "lAarr", "⇛": "rAarr", "⇝": "zigrarr", "⇤": "larrb", "⇥": "rarrb", "⇵": "duarr", "⇽": "loarr", "⇾": "roarr", "⇿": "hoarr", "∀": "forall", "∁": "comp", "∂": "part", "∂̸": "npart", "∃": "exist", "∄": "nexist", "∅": "empty", "∇": "Del", "∈": "in", "∉": "notin", "∋": "ni", "∌": "notni", "϶": "bepsi", "∏": "prod", "∐": "coprod", "∑": "sum", "+": "plus", "±": "pm", "÷": "div", "×": "times", "<": "lt", "≮": "nlt", "<⃒": "nvlt", "=": "equals", "≠": "ne", "=⃥": "bne", "⩵": "Equal", ">": "gt", "≯": "ngt", ">⃒": "nvgt", "¬": "not", "|": "vert", "¦": "brvbar", "−": "minus", "∓": "mp", "∔": "plusdo", "⁄": "frasl", "∖": "setmn", "∗": "lowast", "∘": "compfn", "√": "Sqrt", "∝": "prop", "∞": "infin", "∟": "angrt", "∠": "ang", "∠⃒": "nang", "∡": "angmsd", "∢": "angsph", "∣": "mid", "∤": "nmid", "∥": "par", "∦": "npar", "∧": "and", "∨": "or", "∩": "cap", "∩︀": "caps", "∪": "cup", "∪︀": "cups", "∫": "int", "∬": "Int", "∭": "tint", "⨌": "qint", "∮": "oint", "∯": "Conint", "∰": "Cconint", "∱": "cwint", "∲": "cwconint", "∳": "awconint", "∴": "there4", "∵": "becaus", "∶": "ratio", "∷": "Colon", "∸": "minusd", "∺": "mDDot", "∻": "homtht", "∼": "sim", "≁": "nsim", "∼⃒": "nvsim", "∽": "bsim", "∽̱": "race", "∾": "ac", "∾̳": "acE", "∿": "acd", "≀": "wr", "≂": "esim", "≂̸": "nesim", "≃": "sime", "≄": "nsime", "≅": "cong", "≇": "ncong", "≆": "simne", "≈": "ap", "≉": "nap", "≊": "ape", "≋": "apid", "≋̸": "napid", "≌": "bcong", "≍": "CupCap", "≭": "NotCupCap", "≍⃒": "nvap", "≎": "bump", "≎̸": "nbump", "≏": "bumpe", "≏̸": "nbumpe", "≐": "doteq", "≐̸": "nedot", "≑": "eDot", "≒": "efDot", "≓": "erDot", "≔": "colone", "≕": "ecolon", "≖": "ecir", "≗": "cire", "≙": "wedgeq", "≚": "veeeq", "≜": "trie", "≟": "equest", "≡": "equiv", "≢": "nequiv", "≡⃥": "bnequiv", "≤": "le", "≰": "nle", "≤⃒": "nvle", "≥": "ge", "≱": "nge", "≥⃒": "nvge", "≦": "lE", "≦̸": "nlE", "≧": "gE", "≧̸": "ngE", "≨︀": "lvnE", "≨": "lnE", "≩": "gnE", "≩︀": "gvnE", "≪": "ll", "≪̸": "nLtv", "≪⃒": "nLt", "≫": "gg", "≫̸": "nGtv", "≫⃒": "nGt", "≬": "twixt", "≲": "lsim", "≴": "nlsim", "≳": "gsim", "≵": "ngsim", "≶": "lg", "≸": "ntlg", "≷": "gl", "≹": "ntgl", "≺": "pr", "⊀": "npr", "≻": "sc", "⊁": "nsc", "≼": "prcue", "⋠": "nprcue", "≽": "sccue", "⋡": "nsccue", "≾": "prsim", "≿": "scsim", "≿̸": "NotSucceedsTilde", "⊂": "sub", "⊄": "nsub", "⊂⃒": "vnsub", "⊃": "sup", "⊅": "nsup", "⊃⃒": "vnsup", "⊆": "sube", "⊈": "nsube", "⊇": "supe", "⊉": "nsupe", "⊊︀": "vsubne", "⊊": "subne", "⊋︀": "vsupne", "⊋": "supne", "⊍": "cupdot", "⊎": "uplus", "⊏": "sqsub", "⊏̸": "NotSquareSubset", "⊐": "sqsup", "⊐̸": "NotSquareSuperset", "⊑": "sqsube", "⋢": "nsqsube", "⊒": "sqsupe", "⋣": "nsqsupe", "⊓": "sqcap", "⊓︀": "sqcaps", "⊔": "sqcup", "⊔︀": "sqcups", "⊕": "oplus", "⊖": "ominus", "⊗": "otimes", "⊘": "osol", "⊙": "odot", "⊚": "ocir", "⊛": "oast", "⊝": "odash", "⊞": "plusb", "⊟": "minusb", "⊠": "timesb", "⊡": "sdotb", "⊢": "vdash", "⊬": "nvdash", "⊣": "dashv", "⊤": "top", "⊥": "bot", "⊧": "models", "⊨": "vDash", "⊭": "nvDash", "⊩": "Vdash", "⊮": "nVdash", "⊪": "Vvdash", "⊫": "VDash", "⊯": "nVDash", "⊰": "prurel", "⊲": "vltri", "⋪": "nltri", "⊳": "vrtri", "⋫": "nrtri", "⊴": "ltrie", "⋬": "nltrie", "⊴⃒": "nvltrie", "⊵": "rtrie", "⋭": "nrtrie", "⊵⃒": "nvrtrie", "⊶": "origof", "⊷": "imof", "⊸": "mumap", "⊹": "hercon", "⊺": "intcal", "⊻": "veebar", "⊽": "barvee", "⊾": "angrtvb", "⊿": "lrtri", "⋀": "Wedge", "⋁": "Vee", "⋂": "xcap", "⋃": "xcup", "⋄": "diam", "⋅": "sdot", "⋆": "Star", "⋇": "divonx", "⋈": "bowtie", "⋉": "ltimes", "⋊": "rtimes", "⋋": "lthree", "⋌": "rthree", "⋍": "bsime", "⋎": "cuvee", "⋏": "cuwed", "⋐": "Sub", "⋑": "Sup", "⋒": "Cap", "⋓": "Cup", "⋔": "fork", "⋕": "epar", "⋖": "ltdot", "⋗": "gtdot", "⋘": "Ll", "⋘̸": "nLl", "⋙": "Gg", "⋙̸": "nGg", "⋚︀": "lesg", "⋚": "leg", "⋛": "gel", "⋛︀": "gesl", "⋞": "cuepr", "⋟": "cuesc", "⋦": "lnsim", "⋧": "gnsim", "⋨": "prnsim", "⋩": "scnsim", "⋮": "vellip", "⋯": "ctdot", "⋰": "utdot", "⋱": "dtdot", "⋲": "disin", "⋳": "isinsv", "⋴": "isins", "⋵": "isindot", "⋵̸": "notindot", "⋶": "notinvc", "⋷": "notinvb", "⋹": "isinE", "⋹̸": "notinE", "⋺": "nisd", "⋻": "xnis", "⋼": "nis", "⋽": "notnivc", "⋾": "notnivb", "⌅": "barwed", "⌆": "Barwed", "⌌": "drcrop", "⌍": "dlcrop", "⌎": "urcrop", "⌏": "ulcrop", "⌐": "bnot", "⌒": "profline", "⌓": "profsurf", "⌕": "telrec", "⌖": "target", "⌜": "ulcorn", "⌝": "urcorn", "⌞": "dlcorn", "⌟": "drcorn", "⌢": "frown", "⌣": "smile", "⌭": "cylcty", "⌮": "profalar", "⌶": "topbot", "⌽": "ovbar", "⌿": "solbar", "⍼": "angzarr", "⎰": "lmoust", "⎱": "rmoust", "⎴": "tbrk", "⎵": "bbrk", "⎶": "bbrktbrk", "⏜": "OverParenthesis", "⏝": "UnderParenthesis", "⏞": "OverBrace", "⏟": "UnderBrace", "⏢": "trpezium", "⏧": "elinters", "␣": "blank", "─": "boxh", "│": "boxv", "┌": "boxdr", "┐": "boxdl", "└": "boxur", "┘": "boxul", "├": "boxvr", "┤": "boxvl", "┬": "boxhd", "┴": "boxhu", "┼": "boxvh", "═": "boxH", "║": "boxV", "╒": "boxdR", "╓": "boxDr", "╔": "boxDR", "╕": "boxdL", "╖": "boxDl", "╗": "boxDL", "╘": "boxuR", "╙": "boxUr", "╚": "boxUR", "╛": "boxuL", "╜": "boxUl", "╝": "boxUL", "╞": "boxvR", "╟": "boxVr", "╠": "boxVR", "╡": "boxvL", "╢": "boxVl", "╣": "boxVL", "╤": "boxHd", "╥": "boxhD", "╦": "boxHD", "╧": "boxHu", "╨": "boxhU", "╩": "boxHU", "╪": "boxvH", "╫": "boxVh", "╬": "boxVH", "▀": "uhblk", "▄": "lhblk", "█": "block", "░": "blk14", "▒": "blk12", "▓": "blk34", "□": "squ", "▪": "squf", "▫": "EmptyVerySmallSquare", "▭": "rect", "▮": "marker", "▱": "fltns", "△": "xutri", "▴": "utrif", "▵": "utri", "▸": "rtrif", "▹": "rtri", "▽": "xdtri", "▾": "dtrif", "▿": "dtri", "◂": "ltrif", "◃": "ltri", "◊": "loz", "○": "cir", "◬": "tridot", "◯": "xcirc", "◸": "ultri", "◹": "urtri", "◺": "lltri", "◻": "EmptySmallSquare", "◼": "FilledSmallSquare", "★": "starf", "☆": "star", "☎": "phone", "♀": "female", "♂": "male", "♠": "spades", "♣": "clubs", "♥": "hearts", "♦": "diams", "♪": "sung", "✓": "check", "✗": "cross", "✠": "malt", "✶": "sext", "❘": "VerticalSeparator", "⟈": "bsolhsub", "⟉": "suphsol", "⟵": "xlarr", "⟶": "xrarr", "⟷": "xharr", "⟸": "xlArr", "⟹": "xrArr", "⟺": "xhArr", "⟼": "xmap", "⟿": "dzigrarr", "⤂": "nvlArr", "⤃": "nvrArr", "⤄": "nvHarr", "⤅": "Map", "⤌": "lbarr", "⤍": "rbarr", "⤎": "lBarr", "⤏": "rBarr", "⤐": "RBarr", "⤑": "DDotrahd", "⤒": "UpArrowBar", "⤓": "DownArrowBar", "⤖": "Rarrtl", "⤙": "latail", "⤚": "ratail", "⤛": "lAtail", "⤜": "rAtail", "⤝": "larrfs", "⤞": "rarrfs", "⤟": "larrbfs", "⤠": "rarrbfs", "⤣": "nwarhk", "⤤": "nearhk", "⤥": "searhk", "⤦": "swarhk", "⤧": "nwnear", "⤨": "toea", "⤩": "tosa", "⤪": "swnwar", "⤳": "rarrc", "⤳̸": "nrarrc", "⤵": "cudarrr", "⤶": "ldca", "⤷": "rdca", "⤸": "cudarrl", "⤹": "larrpl", "⤼": "curarrm", "⤽": "cularrp", "⥅": "rarrpl", "⥈": "harrcir", "⥉": "Uarrocir", "⥊": "lurdshar", "⥋": "ldrushar", "⥎": "LeftRightVector", "⥏": "RightUpDownVector", "⥐": "DownLeftRightVector", "⥑": "LeftUpDownVector", "⥒": "LeftVectorBar", "⥓": "RightVectorBar", "⥔": "RightUpVectorBar", "⥕": "RightDownVectorBar", "⥖": "DownLeftVectorBar", "⥗": "DownRightVectorBar", "⥘": "LeftUpVectorBar", "⥙": "LeftDownVectorBar", "⥚": "LeftTeeVector", "⥛": "RightTeeVector", "⥜": "RightUpTeeVector", "⥝": "RightDownTeeVector", "⥞": "DownLeftTeeVector", "⥟": "DownRightTeeVector", "⥠": "LeftUpTeeVector", "⥡": "LeftDownTeeVector", "⥢": "lHar", "⥣": "uHar", "⥤": "rHar", "⥥": "dHar", "⥦": "luruhar", "⥧": "ldrdhar", "⥨": "ruluhar", "⥩": "rdldhar", "⥪": "lharul", "⥫": "llhard", "⥬": "rharul", "⥭": "lrhard", "⥮": "udhar", "⥯": "duhar", "⥰": "RoundImplies", "⥱": "erarr", "⥲": "simrarr", "⥳": "larrsim", "⥴": "rarrsim", "⥵": "rarrap", "⥶": "ltlarr", "⥸": "gtrarr", "⥹": "subrarr", "⥻": "suplarr", "⥼": "lfisht", "⥽": "rfisht", "⥾": "ufisht", "⥿": "dfisht", "⦚": "vzigzag", "⦜": "vangrt", "⦝": "angrtvbd", "⦤": "ange", "⦥": "range", "⦦": "dwangle", "⦧": "uwangle", "⦨": "angmsdaa", "⦩": "angmsdab", "⦪": "angmsdac", "⦫": "angmsdad", "⦬": "angmsdae", "⦭": "angmsdaf", "⦮": "angmsdag", "⦯": "angmsdah", "⦰": "bemptyv", "⦱": "demptyv", "⦲": "cemptyv", "⦳": "raemptyv", "⦴": "laemptyv", "⦵": "ohbar", "⦶": "omid", "⦷": "opar", "⦹": "operp", "⦻": "olcross", "⦼": "odsold", "⦾": "olcir", "⦿": "ofcir", "⧀": "olt", "⧁": "ogt", "⧂": "cirscir", "⧃": "cirE", "⧄": "solb", "⧅": "bsolb", "⧉": "boxbox", "⧍": "trisb", "⧎": "rtriltri", "⧏": "LeftTriangleBar", "⧏̸": "NotLeftTriangleBar", "⧐": "RightTriangleBar", "⧐̸": "NotRightTriangleBar", "⧜": "iinfin", "⧝": "infintie", "⧞": "nvinfin", "⧣": "eparsl", "⧤": "smeparsl", "⧥": "eqvparsl", "⧫": "lozf", "⧴": "RuleDelayed", "⧶": "dsol", "⨀": "xodot", "⨁": "xoplus", "⨂": "xotime", "⨄": "xuplus", "⨆": "xsqcup", "⨍": "fpartint", "⨐": "cirfnint", "⨑": "awint", "⨒": "rppolint", "⨓": "scpolint", "⨔": "npolint", "⨕": "pointint", "⨖": "quatint", "⨗": "intlarhk", "⨢": "pluscir", "⨣": "plusacir", "⨤": "simplus", "⨥": "plusdu", "⨦": "plussim", "⨧": "plustwo", "⨩": "mcomma", "⨪": "minusdu", "⨭": "loplus", "⨮": "roplus", "⨯": "Cross", "⨰": "timesd", "⨱": "timesbar", "⨳": "smashp", "⨴": "lotimes", "⨵": "rotimes", "⨶": "otimesas", "⨷": "Otimes", "⨸": "odiv", "⨹": "triplus", "⨺": "triminus", "⨻": "tritime", "⨼": "iprod", "⨿": "amalg", "⩀": "capdot", "⩂": "ncup", "⩃": "ncap", "⩄": "capand", "⩅": "cupor", "⩆": "cupcap", "⩇": "capcup", "⩈": "cupbrcap", "⩉": "capbrcup", "⩊": "cupcup", "⩋": "capcap", "⩌": "ccups", "⩍": "ccaps", "⩐": "ccupssm", "⩓": "And", "⩔": "Or", "⩕": "andand", "⩖": "oror", "⩗": "orslope", "⩘": "andslope", "⩚": "andv", "⩛": "orv", "⩜": "andd", "⩝": "ord", "⩟": "wedbar", "⩦": "sdote", "⩪": "simdot", "⩭": "congdot", "⩭̸": "ncongdot", "⩮": "easter", "⩯": "apacir", "⩰": "apE", "⩰̸": "napE", "⩱": "eplus", "⩲": "pluse", "⩳": "Esim", "⩷": "eDDot", "⩸": "equivDD", "⩹": "ltcir", "⩺": "gtcir", "⩻": "ltquest", "⩼": "gtquest", "⩽": "les", "⩽̸": "nles", "⩾": "ges", "⩾̸": "nges", "⩿": "lesdot", "⪀": "gesdot", "⪁": "lesdoto", "⪂": "gesdoto", "⪃": "lesdotor", "⪄": "gesdotol", "⪅": "lap", "⪆": "gap", "⪇": "lne", "⪈": "gne", "⪉": "lnap", "⪊": "gnap", "⪋": "lEg", "⪌": "gEl", "⪍": "lsime", "⪎": "gsime", "⪏": "lsimg", "⪐": "gsiml", "⪑": "lgE", "⪒": "glE", "⪓": "lesges", "⪔": "gesles", "⪕": "els", "⪖": "egs", "⪗": "elsdot", "⪘": "egsdot", "⪙": "el", "⪚": "eg", "⪝": "siml", "⪞": "simg", "⪟": "simlE", "⪠": "simgE", "⪡": "LessLess", "⪡̸": "NotNestedLessLess", "⪢": "GreaterGreater", "⪢̸": "NotNestedGreaterGreater", "⪤": "glj", "⪥": "gla", "⪦": "ltcc", "⪧": "gtcc", "⪨": "lescc", "⪩": "gescc", "⪪": "smt", "⪫": "lat", "⪬": "smte", "⪬︀": "smtes", "⪭": "late", "⪭︀": "lates", "⪮": "bumpE", "⪯": "pre", "⪯̸": "npre", "⪰": "sce", "⪰̸": "nsce", "⪳": "prE", "⪴": "scE", "⪵": "prnE", "⪶": "scnE", "⪷": "prap", "⪸": "scap", "⪹": "prnap", "⪺": "scnap", "⪻": "Pr", "⪼": "Sc", "⪽": "subdot", "⪾": "supdot", "⪿": "subplus", "⫀": "supplus", "⫁": "submult", "⫂": "supmult", "⫃": "subedot", "⫄": "supedot", "⫅": "subE", "⫅̸": "nsubE", "⫆": "supE", "⫆̸": "nsupE", "⫇": "subsim", "⫈": "supsim", "⫋︀": "vsubnE", "⫋": "subnE", "⫌︀": "vsupnE", "⫌": "supnE", "⫏": "csub", "⫐": "csup", "⫑": "csube", "⫒": "csupe", "⫓": "subsup", "⫔": "supsub", "⫕": "subsub", "⫖": "supsup", "⫗": "suphsub", "⫘": "supdsub", "⫙": "forkv", "⫚": "topfork", "⫛": "mlcp", "⫤": "Dashv", "⫦": "Vdashl", "⫧": "Barv", "⫨": "vBar", "⫩": "vBarv", "⫫": "Vbar", "⫬": "Not", "⫭": "bNot", "⫮": "rnmid", "⫯": "cirmid", "⫰": "midcir", "⫱": "topcir", "⫲": "nhpar", "⫳": "parsim", "⫽": "parsl", "⫽⃥": "nparsl", "♭": "flat", "♮": "natur", "♯": "sharp", "¤": "curren", "¢": "cent", $: "dollar", "£": "pound", "¥": "yen", "€": "euro", "¹": "sup1", "½": "half", "⅓": "frac13", "¼": "frac14", "⅕": "frac15", "⅙": "frac16", "⅛": "frac18", "²": "sup2", "⅔": "frac23", "⅖": "frac25", "³": "sup3", "¾": "frac34", "⅗": "frac35", "⅜": "frac38", "⅘": "frac45", "⅚": "frac56", "⅝": "frac58", "⅞": "frac78", "𝒶": "ascr", "𝕒": "aopf", "𝔞": "afr", "𝔸": "Aopf", "𝔄": "Afr", "𝒜": "Ascr", "ª": "ordf", "á": "aacute", "Á": "Aacute", "à": "agrave", "À": "Agrave", "ă": "abreve", "Ă": "Abreve", "â": "acirc", "Â": "Acirc", "å": "aring", "Å": "angst", "ä": "auml", "Ä": "Auml", "ã": "atilde", "Ã": "Atilde", "ą": "aogon", "Ą": "Aogon", "ā": "amacr", "Ā": "Amacr", "æ": "aelig", "Æ": "AElig", "𝒷": "bscr", "𝕓": "bopf", "𝔟": "bfr", "𝔹": "Bopf", "ℬ": "Bscr", "𝔅": "Bfr", "𝔠": "cfr", "𝒸": "cscr", "𝕔": "copf", "ℭ": "Cfr", "𝒞": "Cscr", "ℂ": "Copf", "ć": "cacute", "Ć": "Cacute", "ĉ": "ccirc", "Ĉ": "Ccirc", "č": "ccaron", "Č": "Ccaron", "ċ": "cdot", "Ċ": "Cdot", "ç": "ccedil", "Ç": "Ccedil", "℅": "incare", "𝔡": "dfr", "ⅆ": "dd", "𝕕": "dopf", "𝒹": "dscr", "𝒟": "Dscr", "𝔇": "Dfr", "ⅅ": "DD", "𝔻": "Dopf", "ď": "dcaron", "Ď": "Dcaron", "đ": "dstrok", "Đ": "Dstrok", "ð": "eth", "Ð": "ETH", "ⅇ": "ee", "ℯ": "escr", "𝔢": "efr", "𝕖": "eopf", "ℰ": "Escr", "𝔈": "Efr", "𝔼": "Eopf", "é": "eacute", "É": "Eacute", "è": "egrave", "È": "Egrave", "ê": "ecirc", "Ê": "Ecirc", "ě": "ecaron", "Ě": "Ecaron", "ë": "euml", "Ë": "Euml", "ė": "edot", "Ė": "Edot", "ę": "eogon", "Ę": "Eogon", "ē": "emacr", "Ē": "Emacr", "𝔣": "ffr", "𝕗": "fopf", "𝒻": "fscr", "𝔉": "Ffr", "𝔽": "Fopf", "ℱ": "Fscr", "ﬀ": "fflig", "ﬃ": "ffilig", "ﬄ": "ffllig", "ﬁ": "filig", fj: "fjlig", "ﬂ": "fllig", "ƒ": "fnof", "ℊ": "gscr", "𝕘": "gopf", "𝔤": "gfr", "𝒢": "Gscr", "𝔾": "Gopf", "𝔊": "Gfr", "ǵ": "gacute", "ğ": "gbreve", "Ğ": "Gbreve", "ĝ": "gcirc", "Ĝ": "Gcirc", "ġ": "gdot", "Ġ": "Gdot", "Ģ": "Gcedil", "𝔥": "hfr", "ℎ": "planckh", "𝒽": "hscr", "𝕙": "hopf", "ℋ": "Hscr", "ℌ": "Hfr", "ℍ": "Hopf", "ĥ": "hcirc", "Ĥ": "Hcirc", "ℏ": "hbar", "ħ": "hstrok", "Ħ": "Hstrok", "𝕚": "iopf", "𝔦": "ifr", "𝒾": "iscr", "ⅈ": "ii", "𝕀": "Iopf", "ℐ": "Iscr", "ℑ": "Im", "í": "iacute", "Í": "Iacute", "ì": "igrave", "Ì": "Igrave", "î": "icirc", "Î": "Icirc", "ï": "iuml", "Ï": "Iuml", "ĩ": "itilde", "Ĩ": "Itilde", "İ": "Idot", "į": "iogon", "Į": "Iogon", "ī": "imacr", "Ī": "Imacr", "ĳ": "ijlig", "Ĳ": "IJlig", "ı": "imath", "𝒿": "jscr", "𝕛": "jopf", "𝔧": "jfr", "𝒥": "Jscr", "𝔍": "Jfr", "𝕁": "Jopf", "ĵ": "jcirc", "Ĵ": "Jcirc", "ȷ": "jmath", "𝕜": "kopf", "𝓀": "kscr", "𝔨": "kfr", "𝒦": "Kscr", "𝕂": "Kopf", "𝔎": "Kfr", "ķ": "kcedil", "Ķ": "Kcedil", "𝔩": "lfr", "𝓁": "lscr", "ℓ": "ell", "𝕝": "lopf", "ℒ": "Lscr", "𝔏": "Lfr", "𝕃": "Lopf", "ĺ": "lacute", "Ĺ": "Lacute", "ľ": "lcaron", "Ľ": "Lcaron", "ļ": "lcedil", "Ļ": "Lcedil", "ł": "lstrok", "Ł": "Lstrok", "ŀ": "lmidot", "Ŀ": "Lmidot", "𝔪": "mfr", "𝕞": "mopf", "𝓂": "mscr", "𝔐": "Mfr", "𝕄": "Mopf", "ℳ": "Mscr", "𝔫": "nfr", "𝕟": "nopf", "𝓃": "nscr", "ℕ": "Nopf", "𝒩": "Nscr", "𝔑": "Nfr", "ń": "nacute", "Ń": "Nacute", "ň": "ncaron", "Ň": "Ncaron", "ñ": "ntilde", "Ñ": "Ntilde", "ņ": "ncedil", "Ņ": "Ncedil", "№": "numero", "ŋ": "eng", "Ŋ": "ENG", "𝕠": "oopf", "𝔬": "ofr", "ℴ": "oscr", "𝒪": "Oscr", "𝔒": "Ofr", "𝕆": "Oopf", "º": "ordm", "ó": "oacute", "Ó": "Oacute", "ò": "ograve", "Ò": "Ograve", "ô": "ocirc", "Ô": "Ocirc", "ö": "ouml", "Ö": "Ouml", "ő": "odblac", "Ő": "Odblac", "õ": "otilde", "Õ": "Otilde", "ø": "oslash", "Ø": "Oslash", "ō": "omacr", "Ō": "Omacr", "œ": "oelig", "Œ": "OElig", "𝔭": "pfr", "𝓅": "pscr", "𝕡": "popf", "ℙ": "Popf", "𝔓": "Pfr", "𝒫": "Pscr", "𝕢": "qopf", "𝔮": "qfr", "𝓆": "qscr", "𝒬": "Qscr", "𝔔": "Qfr", "ℚ": "Qopf", "ĸ": "kgreen", "𝔯": "rfr", "𝕣": "ropf", "𝓇": "rscr", "ℛ": "Rscr", "ℜ": "Re", "ℝ": "Ropf", "ŕ": "racute", "Ŕ": "Racute", "ř": "rcaron", "Ř": "Rcaron", "ŗ": "rcedil", "Ŗ": "Rcedil", "𝕤": "sopf", "𝓈": "sscr", "𝔰": "sfr", "𝕊": "Sopf", "𝔖": "Sfr", "𝒮": "Sscr", "Ⓢ": "oS", "ś": "sacute", "Ś": "Sacute", "ŝ": "scirc", "Ŝ": "Scirc", "š": "scaron", "Š": "Scaron", "ş": "scedil", "Ş": "Scedil", "ß": "szlig", "𝔱": "tfr", "𝓉": "tscr", "𝕥": "topf", "𝒯": "Tscr", "𝔗": "Tfr", "𝕋": "Topf", "ť": "tcaron", "Ť": "Tcaron", "ţ": "tcedil", "Ţ": "Tcedil", "™": "trade", "ŧ": "tstrok", "Ŧ": "Tstrok", "𝓊": "uscr", "𝕦": "uopf", "𝔲": "ufr", "𝕌": "Uopf", "𝔘": "Ufr", "𝒰": "Uscr", "ú": "uacute", "Ú": "Uacute", "ù": "ugrave", "Ù": "Ugrave", "ŭ": "ubreve", "Ŭ": "Ubreve", "û": "ucirc", "Û": "Ucirc", "ů": "uring", "Ů": "Uring", "ü": "uuml", "Ü": "Uuml", "ű": "udblac", "Ű": "Udblac", "ũ": "utilde", "Ũ": "Utilde", "ų": "uogon", "Ų": "Uogon", "ū": "umacr", "Ū": "Umacr", "𝔳": "vfr", "𝕧": "vopf", "𝓋": "vscr", "𝔙": "Vfr", "𝕍": "Vopf", "𝒱": "Vscr", "𝕨": "wopf", "𝓌": "wscr", "𝔴": "wfr", "𝒲": "Wscr", "𝕎": "Wopf", "𝔚": "Wfr", "ŵ": "wcirc", "Ŵ": "Wcirc", "𝔵": "xfr", "𝓍": "xscr", "𝕩": "xopf", "𝕏": "Xopf", "𝔛": "Xfr", "𝒳": "Xscr", "𝔶": "yfr", "𝓎": "yscr", "𝕪": "yopf", "𝒴": "Yscr", "𝔜": "Yfr", "𝕐": "Yopf", "ý": "yacute", "Ý": "Yacute", "ŷ": "ycirc", "Ŷ": "Ycirc", "ÿ": "yuml", "Ÿ": "Yuml", "𝓏": "zscr", "𝔷": "zfr", "𝕫": "zopf", "ℨ": "Zfr", "ℤ": "Zopf", "𝒵": "Zscr", "ź": "zacute", "Ź": "Zacute", "ž": "zcaron", "Ž": "Zcaron", "ż": "zdot", "Ż": "Zdot", "Ƶ": "imped", "þ": "thorn", "Þ": "THORN", "ŉ": "napos", "α": "alpha", "Α": "Alpha", "β": "beta", "Β": "Beta", "γ": "gamma", "Γ": "Gamma", "δ": "delta", "Δ": "Delta", "ε": "epsi", "ϵ": "epsiv", "Ε": "Epsilon", "ϝ": "gammad", "Ϝ": "Gammad", "ζ": "zeta", "Ζ": "Zeta", "η": "eta", "Η": "Eta", "θ": "theta", "ϑ": "thetav", "Θ": "Theta", "ι": "iota", "Ι": "Iota", "κ": "kappa", "ϰ": "kappav", "Κ": "Kappa", "λ": "lambda", "Λ": "Lambda", "μ": "mu", "µ": "micro", "Μ": "Mu", "ν": "nu", "Ν": "Nu", "ξ": "xi", "Ξ": "Xi", "ο": "omicron", "Ο": "Omicron", "π": "pi", "ϖ": "piv", "Π": "Pi", "ρ": "rho", "ϱ": "rhov", "Ρ": "Rho", "σ": "sigma", "Σ": "Sigma", "ς": "sigmaf", "τ": "tau", "Τ": "Tau", "υ": "upsi", "Υ": "Upsilon", "ϒ": "Upsi", "φ": "phi", "ϕ": "phiv", "Φ": "Phi", "χ": "chi", "Χ": "Chi", "ψ": "psi", "Ψ": "Psi", "ω": "omega", "Ω": "ohm", "а": "acy", "А": "Acy", "б": "bcy", "Б": "Bcy", "в": "vcy", "В": "Vcy", "г": "gcy", "Г": "Gcy", "ѓ": "gjcy", "Ѓ": "GJcy", "д": "dcy", "Д": "Dcy", "ђ": "djcy", "Ђ": "DJcy", "е": "iecy", "Е": "IEcy", "ё": "iocy", "Ё": "IOcy", "є": "jukcy", "Є": "Jukcy", "ж": "zhcy", "Ж": "ZHcy", "з": "zcy", "З": "Zcy", "ѕ": "dscy", "Ѕ": "DScy", "и": "icy", "И": "Icy", "і": "iukcy", "І": "Iukcy", "ї": "yicy", "Ї": "YIcy", "й": "jcy", "Й": "Jcy", "ј": "jsercy", "Ј": "Jsercy", "к": "kcy", "К": "Kcy", "ќ": "kjcy", "Ќ": "KJcy", "л": "lcy", "Л": "Lcy", "љ": "ljcy", "Љ": "LJcy", "м": "mcy", "М": "Mcy", "н": "ncy", "Н": "Ncy", "њ": "njcy", "Њ": "NJcy", "о": "ocy", "О": "Ocy", "п": "pcy", "П": "Pcy", "р": "rcy", "Р": "Rcy", "с": "scy", "С": "Scy", "т": "tcy", "Т": "Tcy", "ћ": "tshcy", "Ћ": "TSHcy", "у": "ucy", "У": "Ucy", "ў": "ubrcy", "Ў": "Ubrcy", "ф": "fcy", "Ф": "Fcy", "х": "khcy", "Х": "KHcy", "ц": "tscy", "Ц": "TScy", "ч": "chcy", "Ч": "CHcy", "џ": "dzcy", "Џ": "DZcy", "ш": "shcy", "Ш": "SHcy", "щ": "shchcy", "Щ": "SHCHcy", "ъ": "hardcy", "Ъ": "HARDcy", "ы": "ycy", "Ы": "Ycy", "ь": "softcy", "Ь": "SOFTcy", "э": "ecy", "Э": "Ecy", "ю": "yucy", "Ю": "YUcy", "я": "yacy", "Я": "YAcy", "ℵ": "aleph", "ℶ": "beth", "ℷ": "gimel", "ℸ": "daleth" }, p2 = /["&'<>`]/g, d2 = { '"': "&quot;", "&": "&amp;", "'": "&#x27;", "<": "&lt;", ">": "&gt;", "`": "&#x60;" }, m2 = /&#(?:[xX][^a-fA-F0-9]|[^0-9xX])/, g2 = /[\0-\x08\x0B\x0E-\x1F\x7F-\x9F\uFDD0-\uFDEF\uFFFE\uFFFF]|[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/, f2 = /&(CounterClockwiseContourIntegral|DoubleLongLeftRightArrow|ClockwiseContourIntegral|NotNestedGreaterGreater|NotSquareSupersetEqual|DiacriticalDoubleAcute|NotRightTriangleEqual|NotSucceedsSlantEqual|NotPrecedesSlantEqual|CloseCurlyDoubleQuote|NegativeVeryThinSpace|DoubleContourIntegral|FilledVerySmallSquare|CapitalDifferentialD|OpenCurlyDoubleQuote|EmptyVerySmallSquare|NestedGreaterGreater|DoubleLongRightArrow|NotLeftTriangleEqual|NotGreaterSlantEqual|ReverseUpEquilibrium|DoubleLeftRightArrow|NotSquareSubsetEqual|NotDoubleVerticalBar|RightArrowLeftArrow|NotGreaterFullEqual|NotRightTriangleBar|SquareSupersetEqual|DownLeftRightVector|DoubleLongLeftArrow|leftrightsquigarrow|LeftArrowRightArrow|NegativeMediumSpace|blacktriangleright|RightDownVectorBar|PrecedesSlantEqual|RightDoubleBracket|SucceedsSlantEqual|NotLeftTriangleBar|RightTriangleEqual|SquareIntersection|RightDownTeeVector|ReverseEquilibrium|NegativeThickSpace|longleftrightarrow|Longleftrightarrow|LongLeftRightArrow|DownRightTeeVector|DownRightVectorBar|GreaterSlantEqual|SquareSubsetEqual|LeftDownVectorBar|LeftDoubleBracket|VerticalSeparator|rightleftharpoons|NotGreaterGreater|NotSquareSuperset|blacktriangleleft|blacktriangledown|NegativeThinSpace|LeftDownTeeVector|NotLessSlantEqual|leftrightharpoons|DoubleUpDownArrow|DoubleVerticalBar|LeftTriangleEqual|FilledSmallSquare|twoheadrightarrow|NotNestedLessLess|DownLeftTeeVector|DownLeftVectorBar|RightAngleBracket|NotTildeFullEqual|NotReverseElement|RightUpDownVector|DiacriticalTilde|NotSucceedsTilde|circlearrowright|NotPrecedesEqual|rightharpoondown|DoubleRightArrow|NotSucceedsEqual|NonBreakingSpace|NotRightTriangle|LessEqualGreater|RightUpTeeVector|LeftAngleBracket|GreaterFullEqual|DownArrowUpArrow|RightUpVectorBar|twoheadleftarrow|GreaterEqualLess|downharpoonright|RightTriangleBar|ntrianglerighteq|NotSupersetEqual|LeftUpDownVector|DiacriticalAcute|rightrightarrows|vartriangleright|UpArrowDownArrow|DiacriticalGrave|UnderParenthesis|EmptySmallSquare|LeftUpVectorBar|leftrightarrows|DownRightVector|downharpoonleft|trianglerighteq|ShortRightArrow|OverParenthesis|DoubleLeftArrow|DoubleDownArrow|NotSquareSubset|bigtriangledown|ntrianglelefteq|UpperRightArrow|curvearrowright|vartriangleleft|NotLeftTriangle|nleftrightarrow|LowerRightArrow|NotHumpDownHump|NotGreaterTilde|rightthreetimes|LeftUpTeeVector|NotGreaterEqual|straightepsilon|LeftTriangleBar|rightsquigarrow|ContourIntegral|rightleftarrows|CloseCurlyQuote|RightDownVector|LeftRightVector|nLeftrightarrow|leftharpoondown|circlearrowleft|SquareSuperset|OpenCurlyQuote|hookrightarrow|HorizontalLine|DiacriticalDot|NotLessGreater|ntriangleright|DoubleRightTee|InvisibleComma|InvisibleTimes|LowerLeftArrow|DownLeftVector|NotSubsetEqual|curvearrowleft|trianglelefteq|NotVerticalBar|TildeFullEqual|downdownarrows|NotGreaterLess|RightTeeVector|ZeroWidthSpace|looparrowright|LongRightArrow|doublebarwedge|ShortLeftArrow|ShortDownArrow|RightVectorBar|GreaterGreater|ReverseElement|rightharpoonup|LessSlantEqual|leftthreetimes|upharpoonright|rightarrowtail|LeftDownVector|Longrightarrow|NestedLessLess|UpperLeftArrow|nshortparallel|leftleftarrows|leftrightarrow|Leftrightarrow|LeftRightArrow|longrightarrow|upharpoonleft|RightArrowBar|ApplyFunction|LeftTeeVector|leftarrowtail|NotEqualTilde|varsubsetneqq|varsupsetneqq|RightTeeArrow|SucceedsEqual|SucceedsTilde|LeftVectorBar|SupersetEqual|hookleftarrow|DifferentialD|VerticalTilde|VeryThinSpace|blacktriangle|bigtriangleup|LessFullEqual|divideontimes|leftharpoonup|UpEquilibrium|ntriangleleft|RightTriangle|measuredangle|shortparallel|longleftarrow|Longleftarrow|LongLeftArrow|DoubleLeftTee|Poincareplane|PrecedesEqual|triangleright|DoubleUpArrow|RightUpVector|fallingdotseq|looparrowleft|PrecedesTilde|NotTildeEqual|NotTildeTilde|smallsetminus|Proportional|triangleleft|triangledown|UnderBracket|NotHumpEqual|exponentiale|ExponentialE|NotLessTilde|HilbertSpace|RightCeiling|blacklozenge|varsupsetneq|HumpDownHump|GreaterEqual|VerticalLine|LeftTeeArrow|NotLessEqual|DownTeeArrow|LeftTriangle|varsubsetneq|Intersection|NotCongruent|DownArrowBar|LeftUpVector|LeftArrowBar|risingdotseq|GreaterTilde|RoundImplies|SquareSubset|ShortUpArrow|NotSuperset|quaternions|precnapprox|backepsilon|preccurlyeq|OverBracket|blacksquare|MediumSpace|VerticalBar|circledcirc|circleddash|CircleMinus|CircleTimes|LessGreater|curlyeqprec|curlyeqsucc|diamondsuit|UpDownArrow|Updownarrow|RuleDelayed|Rrightarrow|updownarrow|RightVector|nRightarrow|nrightarrow|eqslantless|LeftCeiling|Equilibrium|SmallCircle|expectation|NotSucceeds|thickapprox|GreaterLess|SquareUnion|NotPrecedes|NotLessLess|straightphi|succnapprox|succcurlyeq|SubsetEqual|sqsupseteq|Proportion|Laplacetrf|ImaginaryI|supsetneqq|NotGreater|gtreqqless|NotElement|ThickSpace|TildeEqual|TildeTilde|Fouriertrf|rmoustache|EqualTilde|eqslantgtr|UnderBrace|LeftVector|UpArrowBar|nLeftarrow|nsubseteqq|subsetneqq|nsupseteqq|nleftarrow|succapprox|lessapprox|UpTeeArrow|upuparrows|curlywedge|lesseqqgtr|varepsilon|varnothing|RightFloor|complement|CirclePlus|sqsubseteq|Lleftarrow|circledast|RightArrow|Rightarrow|rightarrow|lmoustache|Bernoullis|precapprox|mapstoleft|mapstodown|longmapsto|dotsquare|downarrow|DoubleDot|nsubseteq|supsetneq|leftarrow|nsupseteq|subsetneq|ThinSpace|ngeqslant|subseteqq|HumpEqual|NotSubset|triangleq|NotCupCap|lesseqgtr|heartsuit|TripleDot|Leftarrow|Coproduct|Congruent|varpropto|complexes|gvertneqq|LeftArrow|LessTilde|supseteqq|MinusPlus|CircleDot|nleqslant|NotExists|gtreqless|nparallel|UnionPlus|LeftFloor|checkmark|CenterDot|centerdot|Mellintrf|gtrapprox|bigotimes|OverBrace|spadesuit|therefore|pitchfork|rationals|PlusMinus|Backslash|Therefore|DownBreve|backsimeq|backprime|DownArrow|nshortmid|Downarrow|lvertneqq|eqvparsl|imagline|imagpart|infintie|integers|Integral|intercal|LessLess|Uarrocir|intlarhk|sqsupset|angmsdaf|sqsubset|llcorner|vartheta|cupbrcap|lnapprox|Superset|SuchThat|succnsim|succneqq|angmsdag|biguplus|curlyvee|trpezium|Succeeds|NotTilde|bigwedge|angmsdah|angrtvbd|triminus|cwconint|fpartint|lrcorner|smeparsl|subseteq|urcorner|lurdshar|laemptyv|DDotrahd|approxeq|ldrushar|awconint|mapstoup|backcong|shortmid|triangle|geqslant|gesdotol|timesbar|circledR|circledS|setminus|multimap|naturals|scpolint|ncongdot|RightTee|boxminus|gnapprox|boxtimes|andslope|thicksim|angmsdaa|varsigma|cirfnint|rtriltri|angmsdab|rppolint|angmsdac|barwedge|drbkarow|clubsuit|thetasym|bsolhsub|capbrcup|dzigrarr|doteqdot|DotEqual|dotminus|UnderBar|NotEqual|realpart|otimesas|ulcorner|hksearow|hkswarow|parallel|PartialD|elinters|emptyset|plusacir|bbrktbrk|angmsdad|pointint|bigoplus|angmsdae|Precedes|bigsqcup|varkappa|notindot|supseteq|precneqq|precnsim|profalar|profline|profsurf|leqslant|lesdotor|raemptyv|subplus|notnivb|notnivc|subrarr|zigrarr|vzigzag|submult|subedot|Element|between|cirscir|larrbfs|larrsim|lotimes|lbrksld|lbrkslu|lozenge|ldrdhar|dbkarow|bigcirc|epsilon|simrarr|simplus|ltquest|Epsilon|luruhar|gtquest|maltese|npolint|eqcolon|npreceq|bigodot|ddagger|gtrless|bnequiv|harrcir|ddotseq|equivDD|backsim|demptyv|nsqsube|nsqsupe|Upsilon|nsubset|upsilon|minusdu|nsucceq|swarrow|nsupset|coloneq|searrow|boxplus|napprox|natural|asympeq|alefsym|congdot|nearrow|bigstar|diamond|supplus|tritime|LeftTee|nvinfin|triplus|NewLine|nvltrie|nvrtrie|nwarrow|nexists|Diamond|ruluhar|Implies|supmult|angzarr|suplarr|suphsub|questeq|because|digamma|Because|olcross|bemptyv|omicron|Omicron|rotimes|NoBreak|intprod|angrtvb|orderof|uwangle|suphsol|lesdoto|orslope|DownTee|realine|cudarrl|rdldhar|OverBar|supedot|lessdot|supdsub|topfork|succsim|rbrkslu|rbrksld|pertenk|cudarrr|isindot|planckh|lessgtr|pluscir|gesdoto|plussim|plustwo|lesssim|cularrp|rarrsim|Cayleys|notinva|notinvb|notinvc|UpArrow|Uparrow|uparrow|NotLess|dwangle|precsim|Product|curarrm|Cconint|dotplus|rarrbfs|ccupssm|Cedilla|cemptyv|notniva|quatint|frac35|frac38|frac45|frac56|frac58|frac78|tridot|xoplus|gacute|gammad|Gammad|lfisht|lfloor|bigcup|sqsupe|gbreve|Gbreve|lharul|sqsube|sqcups|Gcedil|apacir|llhard|lmidot|Lmidot|lmoust|andand|sqcaps|approx|Abreve|spades|circeq|tprime|divide|topcir|Assign|topbot|gesdot|divonx|xuplus|timesd|gesles|atilde|solbar|SOFTcy|loplus|timesb|lowast|lowbar|dlcorn|dlcrop|softcy|dollar|lparlt|thksim|lrhard|Atilde|lsaquo|smashp|bigvee|thinsp|wreath|bkarow|lsquor|lstrok|Lstrok|lthree|ltimes|ltlarr|DotDot|simdot|ltrPar|weierp|xsqcup|angmsd|sigmav|sigmaf|zeetrf|Zcaron|zcaron|mapsto|vsupne|thetav|cirmid|marker|mcomma|Zacute|vsubnE|there4|gtlPar|vsubne|bottom|gtrarr|SHCHcy|shchcy|midast|midcir|middot|minusb|minusd|gtrdot|bowtie|sfrown|mnplus|models|colone|seswar|Colone|mstpos|searhk|gtrsim|nacute|Nacute|boxbox|telrec|hairsp|Tcedil|nbumpe|scnsim|ncaron|Ncaron|ncedil|Ncedil|hamilt|Scedil|nearhk|hardcy|HARDcy|tcedil|Tcaron|commat|nequiv|nesear|tcaron|target|hearts|nexist|varrho|scedil|Scaron|scaron|hellip|Sacute|sacute|hercon|swnwar|compfn|rtimes|rthree|rsquor|rsaquo|zacute|wedgeq|homtht|barvee|barwed|Barwed|rpargt|horbar|conint|swarhk|roplus|nltrie|hslash|hstrok|Hstrok|rmoust|Conint|bprime|hybull|hyphen|iacute|Iacute|supsup|supsub|supsim|varphi|coprod|brvbar|agrave|Supset|supset|igrave|Igrave|notinE|Agrave|iiiint|iinfin|copysr|wedbar|Verbar|vangrt|becaus|incare|verbar|inodot|bullet|drcorn|intcal|drcrop|cularr|vellip|Utilde|bumpeq|cupcap|dstrok|Dstrok|CupCap|cupcup|cupdot|eacute|Eacute|supdot|iquest|easter|ecaron|Ecaron|ecolon|isinsv|utilde|itilde|Itilde|curarr|succeq|Bumpeq|cacute|ulcrop|nparsl|Cacute|nprcue|egrave|Egrave|nrarrc|nrarrw|subsup|subsub|nrtrie|jsercy|nsccue|Jsercy|kappav|kcedil|Kcedil|subsim|ulcorn|nsimeq|egsdot|veebar|kgreen|capand|elsdot|Subset|subset|curren|aacute|lacute|Lacute|emptyv|ntilde|Ntilde|lagran|lambda|Lambda|capcap|Ugrave|langle|subdot|emsp13|numero|emsp14|nvdash|nvDash|nVdash|nVDash|ugrave|ufisht|nvHarr|larrfs|nvlArr|larrhk|larrlp|larrpl|nvrArr|Udblac|nwarhk|larrtl|nwnear|oacute|Oacute|latail|lAtail|sstarf|lbrace|odblac|Odblac|lbrack|udblac|odsold|eparsl|lcaron|Lcaron|ograve|Ograve|lcedil|Lcedil|Aacute|ssmile|ssetmn|squarf|ldquor|capcup|ominus|cylcty|rharul|eqcirc|dagger|rfloor|rfisht|Dagger|daleth|equals|origof|capdot|equest|dcaron|Dcaron|rdquor|oslash|Oslash|otilde|Otilde|otimes|Otimes|urcrop|Ubreve|ubreve|Yacute|Uacute|uacute|Rcedil|rcedil|urcorn|parsim|Rcaron|Vdashl|rcaron|Tstrok|percnt|period|permil|Exists|yacute|rbrack|rbrace|phmmat|ccaron|Ccaron|planck|ccedil|plankv|tstrok|female|plusdo|plusdu|ffilig|plusmn|ffllig|Ccedil|rAtail|dfisht|bernou|ratail|Rarrtl|rarrtl|angsph|rarrpl|rarrlp|rarrhk|xwedge|xotime|forall|ForAll|Vvdash|vsupnE|preceq|bigcap|frac12|frac13|frac14|primes|rarrfs|prnsim|frac15|Square|frac16|square|lesdot|frac18|frac23|propto|prurel|rarrap|rangle|puncsp|frac25|Racute|qprime|racute|lesges|frac34|abreve|AElig|eqsim|utdot|setmn|urtri|Equal|Uring|seArr|uring|searr|dashv|Dashv|mumap|nabla|iogon|Iogon|sdote|sdotb|scsim|napid|napos|equiv|natur|Acirc|dblac|erarr|nbump|iprod|erDot|ucirc|awint|esdot|angrt|ncong|isinE|scnap|Scirc|scirc|ndash|isins|Ubrcy|nearr|neArr|isinv|nedot|ubrcy|acute|Ycirc|iukcy|Iukcy|xutri|nesim|caret|jcirc|Jcirc|caron|twixt|ddarr|sccue|exist|jmath|sbquo|ngeqq|angst|ccaps|lceil|ngsim|UpTee|delta|Delta|rtrif|nharr|nhArr|nhpar|rtrie|jukcy|Jukcy|kappa|rsquo|Kappa|nlarr|nlArr|TSHcy|rrarr|aogon|Aogon|fflig|xrarr|tshcy|ccirc|nleqq|filig|upsih|nless|dharl|nlsim|fjlig|ropar|nltri|dharr|robrk|roarr|fllig|fltns|roang|rnmid|subnE|subne|lAarr|trisb|Ccirc|acirc|ccups|blank|VDash|forkv|Vdash|langd|cedil|blk12|blk14|laquo|strns|diams|notin|vDash|larrb|blk34|block|disin|uplus|vdash|vBarv|aelig|starf|Wedge|check|xrArr|lates|lbarr|lBarr|notni|lbbrk|bcong|frasl|lbrke|frown|vrtri|vprop|vnsup|gamma|Gamma|wedge|xodot|bdquo|srarr|doteq|ldquo|boxdl|boxdL|gcirc|Gcirc|boxDl|boxDL|boxdr|boxdR|boxDr|TRADE|trade|rlhar|boxDR|vnsub|npart|vltri|rlarr|boxhd|boxhD|nprec|gescc|nrarr|nrArr|boxHd|boxHD|boxhu|boxhU|nrtri|boxHu|clubs|boxHU|times|colon|Colon|gimel|xlArr|Tilde|nsime|tilde|nsmid|nspar|THORN|thorn|xlarr|nsube|nsubE|thkap|xhArr|comma|nsucc|boxul|boxuL|nsupe|nsupE|gneqq|gnsim|boxUl|boxUL|grave|boxur|boxuR|boxUr|boxUR|lescc|angle|bepsi|boxvh|varpi|boxvH|numsp|Theta|gsime|gsiml|theta|boxVh|boxVH|boxvl|gtcir|gtdot|boxvL|boxVl|boxVL|crarr|cross|Cross|nvsim|boxvr|nwarr|nwArr|sqsup|dtdot|Uogon|lhard|lharu|dtrif|ocirc|Ocirc|lhblk|duarr|odash|sqsub|Hacek|sqcup|llarr|duhar|oelig|OElig|ofcir|boxvR|uogon|lltri|boxVr|csube|uuarr|ohbar|csupe|ctdot|olarr|olcir|harrw|oline|sqcap|omacr|Omacr|omega|Omega|boxVR|aleph|lneqq|lnsim|loang|loarr|rharu|lobrk|hcirc|operp|oplus|rhard|Hcirc|orarr|Union|order|ecirc|Ecirc|cuepr|szlig|cuesc|breve|reals|eDDot|Breve|hoarr|lopar|utrif|rdquo|Umacr|umacr|efDot|swArr|ultri|alpha|rceil|ovbar|swarr|Wcirc|wcirc|smtes|smile|bsemi|lrarr|aring|parsl|lrhar|bsime|uhblk|lrtri|cupor|Aring|uharr|uharl|slarr|rbrke|bsolb|lsime|rbbrk|RBarr|lsimg|phone|rBarr|rbarr|icirc|lsquo|Icirc|emacr|Emacr|ratio|simne|plusb|simlE|simgE|simeq|pluse|ltcir|ltdot|empty|xharr|xdtri|iexcl|Alpha|ltrie|rarrw|pound|ltrif|xcirc|bumpe|prcue|bumpE|asymp|amacr|cuvee|Sigma|sigma|iiint|udhar|iiota|ijlig|IJlig|supnE|imacr|Imacr|prime|Prime|image|prnap|eogon|Eogon|rarrc|mdash|mDDot|cuwed|imath|supne|imped|Amacr|udarr|prsim|micro|rarrb|cwint|raquo|infin|eplus|range|rangd|Ucirc|radic|minus|amalg|veeeq|rAarr|epsiv|ycirc|quest|sharp|quot|zwnj|Qscr|race|qscr|Qopf|qopf|qint|rang|Rang|Zscr|zscr|Zopf|zopf|rarr|rArr|Rarr|Pscr|pscr|prop|prod|prnE|prec|ZHcy|zhcy|prap|Zeta|zeta|Popf|popf|Zdot|plus|zdot|Yuml|yuml|phiv|YUcy|yucy|Yscr|yscr|perp|Yopf|yopf|part|para|YIcy|Ouml|rcub|yicy|YAcy|rdca|ouml|osol|Oscr|rdsh|yacy|real|oscr|xvee|andd|rect|andv|Xscr|oror|ordm|ordf|xscr|ange|aopf|Aopf|rHar|Xopf|opar|Oopf|xopf|xnis|rhov|oopf|omid|xmap|oint|apid|apos|ogon|ascr|Ascr|odot|odiv|xcup|xcap|ocir|oast|nvlt|nvle|nvgt|nvge|nvap|Wscr|wscr|auml|ntlg|ntgl|nsup|nsub|nsim|Nscr|nscr|nsce|Wopf|ring|npre|wopf|npar|Auml|Barv|bbrk|Nopf|nopf|nmid|nLtv|beta|ropf|Ropf|Beta|beth|nles|rpar|nleq|bnot|bNot|nldr|NJcy|rscr|Rscr|Vscr|vscr|rsqb|njcy|bopf|nisd|Bopf|rtri|Vopf|nGtv|ngtr|vopf|boxh|boxH|boxv|nges|ngeq|boxV|bscr|scap|Bscr|bsim|Vert|vert|bsol|bull|bump|caps|cdot|ncup|scnE|ncap|nbsp|napE|Cdot|cent|sdot|Vbar|nang|vBar|chcy|Mscr|mscr|sect|semi|CHcy|Mopf|mopf|sext|circ|cire|mldr|mlcp|cirE|comp|shcy|SHcy|vArr|varr|cong|copf|Copf|copy|COPY|malt|male|macr|lvnE|cscr|ltri|sime|ltcc|simg|Cscr|siml|csub|Uuml|lsqb|lsim|uuml|csup|Lscr|lscr|utri|smid|lpar|cups|smte|lozf|darr|Lopf|Uscr|solb|lopf|sopf|Sopf|lneq|uscr|spar|dArr|lnap|Darr|dash|Sqrt|LJcy|ljcy|lHar|dHar|Upsi|upsi|diam|lesg|djcy|DJcy|leqq|dopf|Dopf|dscr|Dscr|dscy|ldsh|ldca|squf|DScy|sscr|Sscr|dsol|lcub|late|star|Star|Uopf|Larr|lArr|larr|uopf|dtri|dzcy|sube|subE|Lang|lang|Kscr|kscr|Kopf|kopf|KJcy|kjcy|KHcy|khcy|DZcy|ecir|edot|eDot|Jscr|jscr|succ|Jopf|jopf|Edot|uHar|emsp|ensp|Iuml|iuml|eopf|isin|Iscr|iscr|Eopf|epar|sung|epsi|escr|sup1|sup2|sup3|Iota|iota|supe|supE|Iopf|iopf|IOcy|iocy|Escr|esim|Esim|imof|Uarr|QUOT|uArr|uarr|euml|IEcy|iecy|Idot|Euml|euro|excl|Hscr|hscr|Hopf|hopf|TScy|tscy|Tscr|hbar|tscr|flat|tbrk|fnof|hArr|harr|half|fopf|Fopf|tdot|gvnE|fork|trie|gtcc|fscr|Fscr|gdot|gsim|Gscr|gscr|Gopf|gopf|gneq|Gdot|tosa|gnap|Topf|topf|geqq|toea|GJcy|gjcy|tint|gesl|mid|Sfr|ggg|top|ges|gla|glE|glj|geq|gne|gEl|gel|gnE|Gcy|gcy|gap|Tfr|tfr|Tcy|tcy|Hat|Tau|Ffr|tau|Tab|hfr|Hfr|ffr|Fcy|fcy|icy|Icy|iff|ETH|eth|ifr|Ifr|Eta|eta|int|Int|Sup|sup|ucy|Ucy|Sum|sum|jcy|ENG|ufr|Ufr|eng|Jcy|jfr|els|ell|egs|Efr|efr|Jfr|uml|kcy|Kcy|Ecy|ecy|kfr|Kfr|lap|Sub|sub|lat|lcy|Lcy|leg|Dot|dot|lEg|leq|les|squ|div|die|lfr|Lfr|lgE|Dfr|dfr|Del|deg|Dcy|dcy|lne|lnE|sol|loz|smt|Cup|lrm|cup|lsh|Lsh|sim|shy|map|Map|mcy|Mcy|mfr|Mfr|mho|gfr|Gfr|sfr|cir|Chi|chi|nap|Cfr|vcy|Vcy|cfr|Scy|scy|ncy|Ncy|vee|Vee|Cap|cap|nfr|scE|sce|Nfr|nge|ngE|nGg|vfr|Vfr|ngt|bot|nGt|nis|niv|Rsh|rsh|nle|nlE|bne|Bfr|bfr|nLl|nlt|nLt|Bcy|bcy|not|Not|rlm|wfr|Wfr|npr|nsc|num|ocy|ast|Ocy|ofr|xfr|Xfr|Ofr|ogt|ohm|apE|olt|Rho|ape|rho|Rfr|rfr|ord|REG|ang|reg|orv|And|and|AMP|Rcy|amp|Afr|ycy|Ycy|yen|yfr|Yfr|rcy|par|pcy|Pcy|pfr|Pfr|phi|Phi|afr|Acy|acy|zcy|Zcy|piv|acE|acd|zfr|Zfr|pre|prE|psi|Psi|qfr|Qfr|zwj|Or|ge|Gg|gt|gg|el|oS|lt|Lt|LT|Re|lg|gl|eg|ne|Im|it|le|DD|wp|wr|nu|Nu|dd|lE|Sc|sc|pi|Pi|ee|af|ll|Ll|rx|gE|xi|pm|Xi|ic|pr|Pr|in|ni|mp|mu|ac|Mu|or|ap|Gt|GT|ii);|&(Aacute|Agrave|Atilde|Ccedil|Eacute|Egrave|Iacute|Igrave|Ntilde|Oacute|Ograve|Oslash|Otilde|Uacute|Ugrave|Yacute|aacute|agrave|atilde|brvbar|ccedil|curren|divide|eacute|egrave|frac12|frac14|frac34|iacute|igrave|iquest|middot|ntilde|oacute|ograve|oslash|otilde|plusmn|uacute|ugrave|yacute|AElig|Acirc|Aring|Ecirc|Icirc|Ocirc|THORN|Ucirc|acirc|acute|aelig|aring|cedil|ecirc|icirc|iexcl|laquo|micro|ocirc|pound|raquo|szlig|thorn|times|ucirc|Auml|COPY|Euml|Iuml|Ouml|QUOT|Uuml|auml|cent|copy|euml|iuml|macr|nbsp|ordf|ordm|ouml|para|quot|sect|sup1|sup2|sup3|uuml|yuml|AMP|ETH|REG|amp|deg|eth|not|reg|shy|uml|yen|GT|LT|gt|lt)(?!;)([=a-zA-Z0-9]?)|&#([0-9]+)(;?)|&#[xX]([a-fA-F0-9]+)(;?)|&([0-9a-zA-Z]+)/g, b2 = { aacute: "á", Aacute: "Á", abreve: "ă", Abreve: "Ă", ac: "∾", acd: "∿", acE: "∾̳", acirc: "â", Acirc: "Â", acute: "´", acy: "а", Acy: "А", aelig: "æ", AElig: "Æ", af: "⁡", afr: "𝔞", Afr: "𝔄", agrave: "à", Agrave: "À", alefsym: "ℵ", aleph: "ℵ", alpha: "α", Alpha: "Α", amacr: "ā", Amacr: "Ā", amalg: "⨿", amp: "&", AMP: "&", and: "∧", And: "⩓", andand: "⩕", andd: "⩜", andslope: "⩘", andv: "⩚", ang: "∠", ange: "⦤", angle: "∠", angmsd: "∡", angmsdaa: "⦨", angmsdab: "⦩", angmsdac: "⦪", angmsdad: "⦫", angmsdae: "⦬", angmsdaf: "⦭", angmsdag: "⦮", angmsdah: "⦯", angrt: "∟", angrtvb: "⊾", angrtvbd: "⦝", angsph: "∢", angst: "Å", angzarr: "⍼", aogon: "ą", Aogon: "Ą", aopf: "𝕒", Aopf: "𝔸", ap: "≈", apacir: "⩯", ape: "≊", apE: "⩰", apid: "≋", apos: "'", ApplyFunction: "⁡", approx: "≈", approxeq: "≊", aring: "å", Aring: "Å", ascr: "𝒶", Ascr: "𝒜", Assign: "≔", ast: "*", asymp: "≈", asympeq: "≍", atilde: "ã", Atilde: "Ã", auml: "ä", Auml: "Ä", awconint: "∳", awint: "⨑", backcong: "≌", backepsilon: "϶", backprime: "‵", backsim: "∽", backsimeq: "⋍", Backslash: "∖", Barv: "⫧", barvee: "⊽", barwed: "⌅", Barwed: "⌆", barwedge: "⌅", bbrk: "⎵", bbrktbrk: "⎶", bcong: "≌", bcy: "б", Bcy: "Б", bdquo: "„", becaus: "∵", because: "∵", Because: "∵", bemptyv: "⦰", bepsi: "϶", bernou: "ℬ", Bernoullis: "ℬ", beta: "β", Beta: "Β", beth: "ℶ", between: "≬", bfr: "𝔟", Bfr: "𝔅", bigcap: "⋂", bigcirc: "◯", bigcup: "⋃", bigodot: "⨀", bigoplus: "⨁", bigotimes: "⨂", bigsqcup: "⨆", bigstar: "★", bigtriangledown: "▽", bigtriangleup: "△", biguplus: "⨄", bigvee: "⋁", bigwedge: "⋀", bkarow: "⤍", blacklozenge: "⧫", blacksquare: "▪", blacktriangle: "▴", blacktriangledown: "▾", blacktriangleleft: "◂", blacktriangleright: "▸", blank: "␣", blk12: "▒", blk14: "░", blk34: "▓", block: "█", bne: "=⃥", bnequiv: "≡⃥", bnot: "⌐", bNot: "⫭", bopf: "𝕓", Bopf: "𝔹", bot: "⊥", bottom: "⊥", bowtie: "⋈", boxbox: "⧉", boxdl: "┐", boxdL: "╕", boxDl: "╖", boxDL: "╗", boxdr: "┌", boxdR: "╒", boxDr: "╓", boxDR: "╔", boxh: "─", boxH: "═", boxhd: "┬", boxhD: "╥", boxHd: "╤", boxHD: "╦", boxhu: "┴", boxhU: "╨", boxHu: "╧", boxHU: "╩", boxminus: "⊟", boxplus: "⊞", boxtimes: "⊠", boxul: "┘", boxuL: "╛", boxUl: "╜", boxUL: "╝", boxur: "└", boxuR: "╘", boxUr: "╙", boxUR: "╚", boxv: "│", boxV: "║", boxvh: "┼", boxvH: "╪", boxVh: "╫", boxVH: "╬", boxvl: "┤", boxvL: "╡", boxVl: "╢", boxVL: "╣", boxvr: "├", boxvR: "╞", boxVr: "╟", boxVR: "╠", bprime: "‵", breve: "˘", Breve: "˘", brvbar: "¦", bscr: "𝒷", Bscr: "ℬ", bsemi: "⁏", bsim: "∽", bsime: "⋍", bsol: "\\", bsolb: "⧅", bsolhsub: "⟈", bull: "•", bullet: "•", bump: "≎", bumpe: "≏", bumpE: "⪮", bumpeq: "≏", Bumpeq: "≎", cacute: "ć", Cacute: "Ć", cap: "∩", Cap: "⋒", capand: "⩄", capbrcup: "⩉", capcap: "⩋", capcup: "⩇", capdot: "⩀", CapitalDifferentialD: "ⅅ", caps: "∩︀", caret: "⁁", caron: "ˇ", Cayleys: "ℭ", ccaps: "⩍", ccaron: "č", Ccaron: "Č", ccedil: "ç", Ccedil: "Ç", ccirc: "ĉ", Ccirc: "Ĉ", Cconint: "∰", ccups: "⩌", ccupssm: "⩐", cdot: "ċ", Cdot: "Ċ", cedil: "¸", Cedilla: "¸", cemptyv: "⦲", cent: "¢", centerdot: "·", CenterDot: "·", cfr: "𝔠", Cfr: "ℭ", chcy: "ч", CHcy: "Ч", check: "✓", checkmark: "✓", chi: "χ", Chi: "Χ", cir: "○", circ: "ˆ", circeq: "≗", circlearrowleft: "↺", circlearrowright: "↻", circledast: "⊛", circledcirc: "⊚", circleddash: "⊝", CircleDot: "⊙", circledR: "®", circledS: "Ⓢ", CircleMinus: "⊖", CirclePlus: "⊕", CircleTimes: "⊗", cire: "≗", cirE: "⧃", cirfnint: "⨐", cirmid: "⫯", cirscir: "⧂", ClockwiseContourIntegral: "∲", CloseCurlyDoubleQuote: "”", CloseCurlyQuote: "’", clubs: "♣", clubsuit: "♣", colon: ":", Colon: "∷", colone: "≔", Colone: "⩴", coloneq: "≔", comma: ",", commat: "@", comp: "∁", compfn: "∘", complement: "∁", complexes: "ℂ", cong: "≅", congdot: "⩭", Congruent: "≡", conint: "∮", Conint: "∯", ContourIntegral: "∮", copf: "𝕔", Copf: "ℂ", coprod: "∐", Coproduct: "∐", copy: "©", COPY: "©", copysr: "℗", CounterClockwiseContourIntegral: "∳", crarr: "↵", cross: "✗", Cross: "⨯", cscr: "𝒸", Cscr: "𝒞", csub: "⫏", csube: "⫑", csup: "⫐", csupe: "⫒", ctdot: "⋯", cudarrl: "⤸", cudarrr: "⤵", cuepr: "⋞", cuesc: "⋟", cularr: "↶", cularrp: "⤽", cup: "∪", Cup: "⋓", cupbrcap: "⩈", cupcap: "⩆", CupCap: "≍", cupcup: "⩊", cupdot: "⊍", cupor: "⩅", cups: "∪︀", curarr: "↷", curarrm: "⤼", curlyeqprec: "⋞", curlyeqsucc: "⋟", curlyvee: "⋎", curlywedge: "⋏", curren: "¤", curvearrowleft: "↶", curvearrowright: "↷", cuvee: "⋎", cuwed: "⋏", cwconint: "∲", cwint: "∱", cylcty: "⌭", dagger: "†", Dagger: "‡", daleth: "ℸ", darr: "↓", dArr: "⇓", Darr: "↡", dash: "‐", dashv: "⊣", Dashv: "⫤", dbkarow: "⤏", dblac: "˝", dcaron: "ď", Dcaron: "Ď", dcy: "д", Dcy: "Д", dd: "ⅆ", DD: "ⅅ", ddagger: "‡", ddarr: "⇊", DDotrahd: "⤑", ddotseq: "⩷", deg: "°", Del: "∇", delta: "δ", Delta: "Δ", demptyv: "⦱", dfisht: "⥿", dfr: "𝔡", Dfr: "𝔇", dHar: "⥥", dharl: "⇃", dharr: "⇂", DiacriticalAcute: "´", DiacriticalDot: "˙", DiacriticalDoubleAcute: "˝", DiacriticalGrave: "`", DiacriticalTilde: "˜", diam: "⋄", diamond: "⋄", Diamond: "⋄", diamondsuit: "♦", diams: "♦", die: "¨", DifferentialD: "ⅆ", digamma: "ϝ", disin: "⋲", div: "÷", divide: "÷", divideontimes: "⋇", divonx: "⋇", djcy: "ђ", DJcy: "Ђ", dlcorn: "⌞", dlcrop: "⌍", dollar: "$", dopf: "𝕕", Dopf: "𝔻", dot: "˙", Dot: "¨", DotDot: "⃜", doteq: "≐", doteqdot: "≑", DotEqual: "≐", dotminus: "∸", dotplus: "∔", dotsquare: "⊡", doublebarwedge: "⌆", DoubleContourIntegral: "∯", DoubleDot: "¨", DoubleDownArrow: "⇓", DoubleLeftArrow: "⇐", DoubleLeftRightArrow: "⇔", DoubleLeftTee: "⫤", DoubleLongLeftArrow: "⟸", DoubleLongLeftRightArrow: "⟺", DoubleLongRightArrow: "⟹", DoubleRightArrow: "⇒", DoubleRightTee: "⊨", DoubleUpArrow: "⇑", DoubleUpDownArrow: "⇕", DoubleVerticalBar: "∥", downarrow: "↓", Downarrow: "⇓", DownArrow: "↓", DownArrowBar: "⤓", DownArrowUpArrow: "⇵", DownBreve: "̑", downdownarrows: "⇊", downharpoonleft: "⇃", downharpoonright: "⇂", DownLeftRightVector: "⥐", DownLeftTeeVector: "⥞", DownLeftVector: "↽", DownLeftVectorBar: "⥖", DownRightTeeVector: "⥟", DownRightVector: "⇁", DownRightVectorBar: "⥗", DownTee: "⊤", DownTeeArrow: "↧", drbkarow: "⤐", drcorn: "⌟", drcrop: "⌌", dscr: "𝒹", Dscr: "𝒟", dscy: "ѕ", DScy: "Ѕ", dsol: "⧶", dstrok: "đ", Dstrok: "Đ", dtdot: "⋱", dtri: "▿", dtrif: "▾", duarr: "⇵", duhar: "⥯", dwangle: "⦦", dzcy: "џ", DZcy: "Џ", dzigrarr: "⟿", eacute: "é", Eacute: "É", easter: "⩮", ecaron: "ě", Ecaron: "Ě", ecir: "≖", ecirc: "ê", Ecirc: "Ê", ecolon: "≕", ecy: "э", Ecy: "Э", eDDot: "⩷", edot: "ė", eDot: "≑", Edot: "Ė", ee: "ⅇ", efDot: "≒", efr: "𝔢", Efr: "𝔈", eg: "⪚", egrave: "è", Egrave: "È", egs: "⪖", egsdot: "⪘", el: "⪙", Element: "∈", elinters: "⏧", ell: "ℓ", els: "⪕", elsdot: "⪗", emacr: "ē", Emacr: "Ē", empty: "∅", emptyset: "∅", EmptySmallSquare: "◻", emptyv: "∅", EmptyVerySmallSquare: "▫", emsp: " ", emsp13: " ", emsp14: " ", eng: "ŋ", ENG: "Ŋ", ensp: " ", eogon: "ę", Eogon: "Ę", eopf: "𝕖", Eopf: "𝔼", epar: "⋕", eparsl: "⧣", eplus: "⩱", epsi: "ε", epsilon: "ε", Epsilon: "Ε", epsiv: "ϵ", eqcirc: "≖", eqcolon: "≕", eqsim: "≂", eqslantgtr: "⪖", eqslantless: "⪕", Equal: "⩵", equals: "=", EqualTilde: "≂", equest: "≟", Equilibrium: "⇌", equiv: "≡", equivDD: "⩸", eqvparsl: "⧥", erarr: "⥱", erDot: "≓", escr: "ℯ", Escr: "ℰ", esdot: "≐", esim: "≂", Esim: "⩳", eta: "η", Eta: "Η", eth: "ð", ETH: "Ð", euml: "ë", Euml: "Ë", euro: "€", excl: "!", exist: "∃", Exists: "∃", expectation: "ℰ", exponentiale: "ⅇ", ExponentialE: "ⅇ", fallingdotseq: "≒", fcy: "ф", Fcy: "Ф", female: "♀", ffilig: "ﬃ", fflig: "ﬀ", ffllig: "ﬄ", ffr: "𝔣", Ffr: "𝔉", filig: "ﬁ", FilledSmallSquare: "◼", FilledVerySmallSquare: "▪", fjlig: "fj", flat: "♭", fllig: "ﬂ", fltns: "▱", fnof: "ƒ", fopf: "𝕗", Fopf: "𝔽", forall: "∀", ForAll: "∀", fork: "⋔", forkv: "⫙", Fouriertrf: "ℱ", fpartint: "⨍", frac12: "½", frac13: "⅓", frac14: "¼", frac15: "⅕", frac16: "⅙", frac18: "⅛", frac23: "⅔", frac25: "⅖", frac34: "¾", frac35: "⅗", frac38: "⅜", frac45: "⅘", frac56: "⅚", frac58: "⅝", frac78: "⅞", frasl: "⁄", frown: "⌢", fscr: "𝒻", Fscr: "ℱ", gacute: "ǵ", gamma: "γ", Gamma: "Γ", gammad: "ϝ", Gammad: "Ϝ", gap: "⪆", gbreve: "ğ", Gbreve: "Ğ", Gcedil: "Ģ", gcirc: "ĝ", Gcirc: "Ĝ", gcy: "г", Gcy: "Г", gdot: "ġ", Gdot: "Ġ", ge: "≥", gE: "≧", gel: "⋛", gEl: "⪌", geq: "≥", geqq: "≧", geqslant: "⩾", ges: "⩾", gescc: "⪩", gesdot: "⪀", gesdoto: "⪂", gesdotol: "⪄", gesl: "⋛︀", gesles: "⪔", gfr: "𝔤", Gfr: "𝔊", gg: "≫", Gg: "⋙", ggg: "⋙", gimel: "ℷ", gjcy: "ѓ", GJcy: "Ѓ", gl: "≷", gla: "⪥", glE: "⪒", glj: "⪤", gnap: "⪊", gnapprox: "⪊", gne: "⪈", gnE: "≩", gneq: "⪈", gneqq: "≩", gnsim: "⋧", gopf: "𝕘", Gopf: "𝔾", grave: "`", GreaterEqual: "≥", GreaterEqualLess: "⋛", GreaterFullEqual: "≧", GreaterGreater: "⪢", GreaterLess: "≷", GreaterSlantEqual: "⩾", GreaterTilde: "≳", gscr: "ℊ", Gscr: "𝒢", gsim: "≳", gsime: "⪎", gsiml: "⪐", gt: ">", Gt: "≫", GT: ">", gtcc: "⪧", gtcir: "⩺", gtdot: "⋗", gtlPar: "⦕", gtquest: "⩼", gtrapprox: "⪆", gtrarr: "⥸", gtrdot: "⋗", gtreqless: "⋛", gtreqqless: "⪌", gtrless: "≷", gtrsim: "≳", gvertneqq: "≩︀", gvnE: "≩︀", Hacek: "ˇ", hairsp: " ", half: "½", hamilt: "ℋ", hardcy: "ъ", HARDcy: "Ъ", harr: "↔", hArr: "⇔", harrcir: "⥈", harrw: "↭", Hat: "^", hbar: "ℏ", hcirc: "ĥ", Hcirc: "Ĥ", hearts: "♥", heartsuit: "♥", hellip: "…", hercon: "⊹", hfr: "𝔥", Hfr: "ℌ", HilbertSpace: "ℋ", hksearow: "⤥", hkswarow: "⤦", hoarr: "⇿", homtht: "∻", hookleftarrow: "↩", hookrightarrow: "↪", hopf: "𝕙", Hopf: "ℍ", horbar: "―", HorizontalLine: "─", hscr: "𝒽", Hscr: "ℋ", hslash: "ℏ", hstrok: "ħ", Hstrok: "Ħ", HumpDownHump: "≎", HumpEqual: "≏", hybull: "⁃", hyphen: "‐", iacute: "í", Iacute: "Í", ic: "⁣", icirc: "î", Icirc: "Î", icy: "и", Icy: "И", Idot: "İ", iecy: "е", IEcy: "Е", iexcl: "¡", iff: "⇔", ifr: "𝔦", Ifr: "ℑ", igrave: "ì", Igrave: "Ì", ii: "ⅈ", iiiint: "⨌", iiint: "∭", iinfin: "⧜", iiota: "℩", ijlig: "ĳ", IJlig: "Ĳ", Im: "ℑ", imacr: "ī", Imacr: "Ī", image: "ℑ", ImaginaryI: "ⅈ", imagline: "ℐ", imagpart: "ℑ", imath: "ı", imof: "⊷", imped: "Ƶ", Implies: "⇒", in: "∈", incare: "℅", infin: "∞", infintie: "⧝", inodot: "ı", int: "∫", Int: "∬", intcal: "⊺", integers: "ℤ", Integral: "∫", intercal: "⊺", Intersection: "⋂", intlarhk: "⨗", intprod: "⨼", InvisibleComma: "⁣", InvisibleTimes: "⁢", iocy: "ё", IOcy: "Ё", iogon: "į", Iogon: "Į", iopf: "𝕚", Iopf: "𝕀", iota: "ι", Iota: "Ι", iprod: "⨼", iquest: "¿", iscr: "𝒾", Iscr: "ℐ", isin: "∈", isindot: "⋵", isinE: "⋹", isins: "⋴", isinsv: "⋳", isinv: "∈", it: "⁢", itilde: "ĩ", Itilde: "Ĩ", iukcy: "і", Iukcy: "І", iuml: "ï", Iuml: "Ï", jcirc: "ĵ", Jcirc: "Ĵ", jcy: "й", Jcy: "Й", jfr: "𝔧", Jfr: "𝔍", jmath: "ȷ", jopf: "𝕛", Jopf: "𝕁", jscr: "𝒿", Jscr: "𝒥", jsercy: "ј", Jsercy: "Ј", jukcy: "є", Jukcy: "Є", kappa: "κ", Kappa: "Κ", kappav: "ϰ", kcedil: "ķ", Kcedil: "Ķ", kcy: "к", Kcy: "К", kfr: "𝔨", Kfr: "𝔎", kgreen: "ĸ", khcy: "х", KHcy: "Х", kjcy: "ќ", KJcy: "Ќ", kopf: "𝕜", Kopf: "𝕂", kscr: "𝓀", Kscr: "𝒦", lAarr: "⇚", lacute: "ĺ", Lacute: "Ĺ", laemptyv: "⦴", lagran: "ℒ", lambda: "λ", Lambda: "Λ", lang: "⟨", Lang: "⟪", langd: "⦑", langle: "⟨", lap: "⪅", Laplacetrf: "ℒ", laquo: "«", larr: "←", lArr: "⇐", Larr: "↞", larrb: "⇤", larrbfs: "⤟", larrfs: "⤝", larrhk: "↩", larrlp: "↫", larrpl: "⤹", larrsim: "⥳", larrtl: "↢", lat: "⪫", latail: "⤙", lAtail: "⤛", late: "⪭", lates: "⪭︀", lbarr: "⤌", lBarr: "⤎", lbbrk: "❲", lbrace: "{", lbrack: "[", lbrke: "⦋", lbrksld: "⦏", lbrkslu: "⦍", lcaron: "ľ", Lcaron: "Ľ", lcedil: "ļ", Lcedil: "Ļ", lceil: "⌈", lcub: "{", lcy: "л", Lcy: "Л", ldca: "⤶", ldquo: "“", ldquor: "„", ldrdhar: "⥧", ldrushar: "⥋", ldsh: "↲", le: "≤", lE: "≦", LeftAngleBracket: "⟨", leftarrow: "←", Leftarrow: "⇐", LeftArrow: "←", LeftArrowBar: "⇤", LeftArrowRightArrow: "⇆", leftarrowtail: "↢", LeftCeiling: "⌈", LeftDoubleBracket: "⟦", LeftDownTeeVector: "⥡", LeftDownVector: "⇃", LeftDownVectorBar: "⥙", LeftFloor: "⌊", leftharpoondown: "↽", leftharpoonup: "↼", leftleftarrows: "⇇", leftrightarrow: "↔", Leftrightarrow: "⇔", LeftRightArrow: "↔", leftrightarrows: "⇆", leftrightharpoons: "⇋", leftrightsquigarrow: "↭", LeftRightVector: "⥎", LeftTee: "⊣", LeftTeeArrow: "↤", LeftTeeVector: "⥚", leftthreetimes: "⋋", LeftTriangle: "⊲", LeftTriangleBar: "⧏", LeftTriangleEqual: "⊴", LeftUpDownVector: "⥑", LeftUpTeeVector: "⥠", LeftUpVector: "↿", LeftUpVectorBar: "⥘", LeftVector: "↼", LeftVectorBar: "⥒", leg: "⋚", lEg: "⪋", leq: "≤", leqq: "≦", leqslant: "⩽", les: "⩽", lescc: "⪨", lesdot: "⩿", lesdoto: "⪁", lesdotor: "⪃", lesg: "⋚︀", lesges: "⪓", lessapprox: "⪅", lessdot: "⋖", lesseqgtr: "⋚", lesseqqgtr: "⪋", LessEqualGreater: "⋚", LessFullEqual: "≦", LessGreater: "≶", lessgtr: "≶", LessLess: "⪡", lesssim: "≲", LessSlantEqual: "⩽", LessTilde: "≲", lfisht: "⥼", lfloor: "⌊", lfr: "𝔩", Lfr: "𝔏", lg: "≶", lgE: "⪑", lHar: "⥢", lhard: "↽", lharu: "↼", lharul: "⥪", lhblk: "▄", ljcy: "љ", LJcy: "Љ", ll: "≪", Ll: "⋘", llarr: "⇇", llcorner: "⌞", Lleftarrow: "⇚", llhard: "⥫", lltri: "◺", lmidot: "ŀ", Lmidot: "Ŀ", lmoust: "⎰", lmoustache: "⎰", lnap: "⪉", lnapprox: "⪉", lne: "⪇", lnE: "≨", lneq: "⪇", lneqq: "≨", lnsim: "⋦", loang: "⟬", loarr: "⇽", lobrk: "⟦", longleftarrow: "⟵", Longleftarrow: "⟸", LongLeftArrow: "⟵", longleftrightarrow: "⟷", Longleftrightarrow: "⟺", LongLeftRightArrow: "⟷", longmapsto: "⟼", longrightarrow: "⟶", Longrightarrow: "⟹", LongRightArrow: "⟶", looparrowleft: "↫", looparrowright: "↬", lopar: "⦅", lopf: "𝕝", Lopf: "𝕃", loplus: "⨭", lotimes: "⨴", lowast: "∗", lowbar: "_", LowerLeftArrow: "↙", LowerRightArrow: "↘", loz: "◊", lozenge: "◊", lozf: "⧫", lpar: "(", lparlt: "⦓", lrarr: "⇆", lrcorner: "⌟", lrhar: "⇋", lrhard: "⥭", lrm: "‎", lrtri: "⊿", lsaquo: "‹", lscr: "𝓁", Lscr: "ℒ", lsh: "↰", Lsh: "↰", lsim: "≲", lsime: "⪍", lsimg: "⪏", lsqb: "[", lsquo: "‘", lsquor: "‚", lstrok: "ł", Lstrok: "Ł", lt: "<", Lt: "≪", LT: "<", ltcc: "⪦", ltcir: "⩹", ltdot: "⋖", lthree: "⋋", ltimes: "⋉", ltlarr: "⥶", ltquest: "⩻", ltri: "◃", ltrie: "⊴", ltrif: "◂", ltrPar: "⦖", lurdshar: "⥊", luruhar: "⥦", lvertneqq: "≨︀", lvnE: "≨︀", macr: "¯", male: "♂", malt: "✠", maltese: "✠", map: "↦", Map: "⤅", mapsto: "↦", mapstodown: "↧", mapstoleft: "↤", mapstoup: "↥", marker: "▮", mcomma: "⨩", mcy: "м", Mcy: "М", mdash: "—", mDDot: "∺", measuredangle: "∡", MediumSpace: " ", Mellintrf: "ℳ", mfr: "𝔪", Mfr: "𝔐", mho: "℧", micro: "µ", mid: "∣", midast: "*", midcir: "⫰", middot: "·", minus: "−", minusb: "⊟", minusd: "∸", minusdu: "⨪", MinusPlus: "∓", mlcp: "⫛", mldr: "…", mnplus: "∓", models: "⊧", mopf: "𝕞", Mopf: "𝕄", mp: "∓", mscr: "𝓂", Mscr: "ℳ", mstpos: "∾", mu: "μ", Mu: "Μ", multimap: "⊸", mumap: "⊸", nabla: "∇", nacute: "ń", Nacute: "Ń", nang: "∠⃒", nap: "≉", napE: "⩰̸", napid: "≋̸", napos: "ŉ", napprox: "≉", natur: "♮", natural: "♮", naturals: "ℕ", nbsp: " ", nbump: "≎̸", nbumpe: "≏̸", ncap: "⩃", ncaron: "ň", Ncaron: "Ň", ncedil: "ņ", Ncedil: "Ņ", ncong: "≇", ncongdot: "⩭̸", ncup: "⩂", ncy: "н", Ncy: "Н", ndash: "–", ne: "≠", nearhk: "⤤", nearr: "↗", neArr: "⇗", nearrow: "↗", nedot: "≐̸", NegativeMediumSpace: "​", NegativeThickSpace: "​", NegativeThinSpace: "​", NegativeVeryThinSpace: "​", nequiv: "≢", nesear: "⤨", nesim: "≂̸", NestedGreaterGreater: "≫", NestedLessLess: "≪", NewLine: "\n", nexist: "∄", nexists: "∄", nfr: "𝔫", Nfr: "𝔑", nge: "≱", ngE: "≧̸", ngeq: "≱", ngeqq: "≧̸", ngeqslant: "⩾̸", nges: "⩾̸", nGg: "⋙̸", ngsim: "≵", ngt: "≯", nGt: "≫⃒", ngtr: "≯", nGtv: "≫̸", nharr: "↮", nhArr: "⇎", nhpar: "⫲", ni: "∋", nis: "⋼", nisd: "⋺", niv: "∋", njcy: "њ", NJcy: "Њ", nlarr: "↚", nlArr: "⇍", nldr: "‥", nle: "≰", nlE: "≦̸", nleftarrow: "↚", nLeftarrow: "⇍", nleftrightarrow: "↮", nLeftrightarrow: "⇎", nleq: "≰", nleqq: "≦̸", nleqslant: "⩽̸", nles: "⩽̸", nless: "≮", nLl: "⋘̸", nlsim: "≴", nlt: "≮", nLt: "≪⃒", nltri: "⋪", nltrie: "⋬", nLtv: "≪̸", nmid: "∤", NoBreak: "⁠", NonBreakingSpace: " ", nopf: "𝕟", Nopf: "ℕ", not: "¬", Not: "⫬", NotCongruent: "≢", NotCupCap: "≭", NotDoubleVerticalBar: "∦", NotElement: "∉", NotEqual: "≠", NotEqualTilde: "≂̸", NotExists: "∄", NotGreater: "≯", NotGreaterEqual: "≱", NotGreaterFullEqual: "≧̸", NotGreaterGreater: "≫̸", NotGreaterLess: "≹", NotGreaterSlantEqual: "⩾̸", NotGreaterTilde: "≵", NotHumpDownHump: "≎̸", NotHumpEqual: "≏̸", notin: "∉", notindot: "⋵̸", notinE: "⋹̸", notinva: "∉", notinvb: "⋷", notinvc: "⋶", NotLeftTriangle: "⋪", NotLeftTriangleBar: "⧏̸", NotLeftTriangleEqual: "⋬", NotLess: "≮", NotLessEqual: "≰", NotLessGreater: "≸", NotLessLess: "≪̸", NotLessSlantEqual: "⩽̸", NotLessTilde: "≴", NotNestedGreaterGreater: "⪢̸", NotNestedLessLess: "⪡̸", notni: "∌", notniva: "∌", notnivb: "⋾", notnivc: "⋽", NotPrecedes: "⊀", NotPrecedesEqual: "⪯̸", NotPrecedesSlantEqual: "⋠", NotReverseElement: "∌", NotRightTriangle: "⋫", NotRightTriangleBar: "⧐̸", NotRightTriangleEqual: "⋭", NotSquareSubset: "⊏̸", NotSquareSubsetEqual: "⋢", NotSquareSuperset: "⊐̸", NotSquareSupersetEqual: "⋣", NotSubset: "⊂⃒", NotSubsetEqual: "⊈", NotSucceeds: "⊁", NotSucceedsEqual: "⪰̸", NotSucceedsSlantEqual: "⋡", NotSucceedsTilde: "≿̸", NotSuperset: "⊃⃒", NotSupersetEqual: "⊉", NotTilde: "≁", NotTildeEqual: "≄", NotTildeFullEqual: "≇", NotTildeTilde: "≉", NotVerticalBar: "∤", npar: "∦", nparallel: "∦", nparsl: "⫽⃥", npart: "∂̸", npolint: "⨔", npr: "⊀", nprcue: "⋠", npre: "⪯̸", nprec: "⊀", npreceq: "⪯̸", nrarr: "↛", nrArr: "⇏", nrarrc: "⤳̸", nrarrw: "↝̸", nrightarrow: "↛", nRightarrow: "⇏", nrtri: "⋫", nrtrie: "⋭", nsc: "⊁", nsccue: "⋡", nsce: "⪰̸", nscr: "𝓃", Nscr: "𝒩", nshortmid: "∤", nshortparallel: "∦", nsim: "≁", nsime: "≄", nsimeq: "≄", nsmid: "∤", nspar: "∦", nsqsube: "⋢", nsqsupe: "⋣", nsub: "⊄", nsube: "⊈", nsubE: "⫅̸", nsubset: "⊂⃒", nsubseteq: "⊈", nsubseteqq: "⫅̸", nsucc: "⊁", nsucceq: "⪰̸", nsup: "⊅", nsupe: "⊉", nsupE: "⫆̸", nsupset: "⊃⃒", nsupseteq: "⊉", nsupseteqq: "⫆̸", ntgl: "≹", ntilde: "ñ", Ntilde: "Ñ", ntlg: "≸", ntriangleleft: "⋪", ntrianglelefteq: "⋬", ntriangleright: "⋫", ntrianglerighteq: "⋭", nu: "ν", Nu: "Ν", num: "#", numero: "№", numsp: " ", nvap: "≍⃒", nvdash: "⊬", nvDash: "⊭", nVdash: "⊮", nVDash: "⊯", nvge: "≥⃒", nvgt: ">⃒", nvHarr: "⤄", nvinfin: "⧞", nvlArr: "⤂", nvle: "≤⃒", nvlt: "<⃒", nvltrie: "⊴⃒", nvrArr: "⤃", nvrtrie: "⊵⃒", nvsim: "∼⃒", nwarhk: "⤣", nwarr: "↖", nwArr: "⇖", nwarrow: "↖", nwnear: "⤧", oacute: "ó", Oacute: "Ó", oast: "⊛", ocir: "⊚", ocirc: "ô", Ocirc: "Ô", ocy: "о", Ocy: "О", odash: "⊝", odblac: "ő", Odblac: "Ő", odiv: "⨸", odot: "⊙", odsold: "⦼", oelig: "œ", OElig: "Œ", ofcir: "⦿", ofr: "𝔬", Ofr: "𝔒", ogon: "˛", ograve: "ò", Ograve: "Ò", ogt: "⧁", ohbar: "⦵", ohm: "Ω", oint: "∮", olarr: "↺", olcir: "⦾", olcross: "⦻", oline: "‾", olt: "⧀", omacr: "ō", Omacr: "Ō", omega: "ω", Omega: "Ω", omicron: "ο", Omicron: "Ο", omid: "⦶", ominus: "⊖", oopf: "𝕠", Oopf: "𝕆", opar: "⦷", OpenCurlyDoubleQuote: "“", OpenCurlyQuote: "‘", operp: "⦹", oplus: "⊕", or: "∨", Or: "⩔", orarr: "↻", ord: "⩝", order: "ℴ", orderof: "ℴ", ordf: "ª", ordm: "º", origof: "⊶", oror: "⩖", orslope: "⩗", orv: "⩛", oS: "Ⓢ", oscr: "ℴ", Oscr: "𝒪", oslash: "ø", Oslash: "Ø", osol: "⊘", otilde: "õ", Otilde: "Õ", otimes: "⊗", Otimes: "⨷", otimesas: "⨶", ouml: "ö", Ouml: "Ö", ovbar: "⌽", OverBar: "‾", OverBrace: "⏞", OverBracket: "⎴", OverParenthesis: "⏜", par: "∥", para: "¶", parallel: "∥", parsim: "⫳", parsl: "⫽", part: "∂", PartialD: "∂", pcy: "п", Pcy: "П", percnt: "%", period: ".", permil: "‰", perp: "⊥", pertenk: "‱", pfr: "𝔭", Pfr: "𝔓", phi: "φ", Phi: "Φ", phiv: "ϕ", phmmat: "ℳ", phone: "☎", pi: "π", Pi: "Π", pitchfork: "⋔", piv: "ϖ", planck: "ℏ", planckh: "ℎ", plankv: "ℏ", plus: "+", plusacir: "⨣", plusb: "⊞", pluscir: "⨢", plusdo: "∔", plusdu: "⨥", pluse: "⩲", PlusMinus: "±", plusmn: "±", plussim: "⨦", plustwo: "⨧", pm: "±", Poincareplane: "ℌ", pointint: "⨕", popf: "𝕡", Popf: "ℙ", pound: "£", pr: "≺", Pr: "⪻", prap: "⪷", prcue: "≼", pre: "⪯", prE: "⪳", prec: "≺", precapprox: "⪷", preccurlyeq: "≼", Precedes: "≺", PrecedesEqual: "⪯", PrecedesSlantEqual: "≼", PrecedesTilde: "≾", preceq: "⪯", precnapprox: "⪹", precneqq: "⪵", precnsim: "⋨", precsim: "≾", prime: "′", Prime: "″", primes: "ℙ", prnap: "⪹", prnE: "⪵", prnsim: "⋨", prod: "∏", Product: "∏", profalar: "⌮", profline: "⌒", profsurf: "⌓", prop: "∝", Proportion: "∷", Proportional: "∝", propto: "∝", prsim: "≾", prurel: "⊰", pscr: "𝓅", Pscr: "𝒫", psi: "ψ", Psi: "Ψ", puncsp: " ", qfr: "𝔮", Qfr: "𝔔", qint: "⨌", qopf: "𝕢", Qopf: "ℚ", qprime: "⁗", qscr: "𝓆", Qscr: "𝒬", quaternions: "ℍ", quatint: "⨖", quest: "?", questeq: "≟", quot: '"', QUOT: '"', rAarr: "⇛", race: "∽̱", racute: "ŕ", Racute: "Ŕ", radic: "√", raemptyv: "⦳", rang: "⟩", Rang: "⟫", rangd: "⦒", range: "⦥", rangle: "⟩", raquo: "»", rarr: "→", rArr: "⇒", Rarr: "↠", rarrap: "⥵", rarrb: "⇥", rarrbfs: "⤠", rarrc: "⤳", rarrfs: "⤞", rarrhk: "↪", rarrlp: "↬", rarrpl: "⥅", rarrsim: "⥴", rarrtl: "↣", Rarrtl: "⤖", rarrw: "↝", ratail: "⤚", rAtail: "⤜", ratio: "∶", rationals: "ℚ", rbarr: "⤍", rBarr: "⤏", RBarr: "⤐", rbbrk: "❳", rbrace: "}", rbrack: "]", rbrke: "⦌", rbrksld: "⦎", rbrkslu: "⦐", rcaron: "ř", Rcaron: "Ř", rcedil: "ŗ", Rcedil: "Ŗ", rceil: "⌉", rcub: "}", rcy: "р", Rcy: "Р", rdca: "⤷", rdldhar: "⥩", rdquo: "”", rdquor: "”", rdsh: "↳", Re: "ℜ", real: "ℜ", realine: "ℛ", realpart: "ℜ", reals: "ℝ", rect: "▭", reg: "®", REG: "®", ReverseElement: "∋", ReverseEquilibrium: "⇋", ReverseUpEquilibrium: "⥯", rfisht: "⥽", rfloor: "⌋", rfr: "𝔯", Rfr: "ℜ", rHar: "⥤", rhard: "⇁", rharu: "⇀", rharul: "⥬", rho: "ρ", Rho: "Ρ", rhov: "ϱ", RightAngleBracket: "⟩", rightarrow: "→", Rightarrow: "⇒", RightArrow: "→", RightArrowBar: "⇥", RightArrowLeftArrow: "⇄", rightarrowtail: "↣", RightCeiling: "⌉", RightDoubleBracket: "⟧", RightDownTeeVector: "⥝", RightDownVector: "⇂", RightDownVectorBar: "⥕", RightFloor: "⌋", rightharpoondown: "⇁", rightharpoonup: "⇀", rightleftarrows: "⇄", rightleftharpoons: "⇌", rightrightarrows: "⇉", rightsquigarrow: "↝", RightTee: "⊢", RightTeeArrow: "↦", RightTeeVector: "⥛", rightthreetimes: "⋌", RightTriangle: "⊳", RightTriangleBar: "⧐", RightTriangleEqual: "⊵", RightUpDownVector: "⥏", RightUpTeeVector: "⥜", RightUpVector: "↾", RightUpVectorBar: "⥔", RightVector: "⇀", RightVectorBar: "⥓", ring: "˚", risingdotseq: "≓", rlarr: "⇄", rlhar: "⇌", rlm: "‏", rmoust: "⎱", rmoustache: "⎱", rnmid: "⫮", roang: "⟭", roarr: "⇾", robrk: "⟧", ropar: "⦆", ropf: "𝕣", Ropf: "ℝ", roplus: "⨮", rotimes: "⨵", RoundImplies: "⥰", rpar: ")", rpargt: "⦔", rppolint: "⨒", rrarr: "⇉", Rrightarrow: "⇛", rsaquo: "›", rscr: "𝓇", Rscr: "ℛ", rsh: "↱", Rsh: "↱", rsqb: "]", rsquo: "’", rsquor: "’", rthree: "⋌", rtimes: "⋊", rtri: "▹", rtrie: "⊵", rtrif: "▸", rtriltri: "⧎", RuleDelayed: "⧴", ruluhar: "⥨", rx: "℞", sacute: "ś", Sacute: "Ś", sbquo: "‚", sc: "≻", Sc: "⪼", scap: "⪸", scaron: "š", Scaron: "Š", sccue: "≽", sce: "⪰", scE: "⪴", scedil: "ş", Scedil: "Ş", scirc: "ŝ", Scirc: "Ŝ", scnap: "⪺", scnE: "⪶", scnsim: "⋩", scpolint: "⨓", scsim: "≿", scy: "с", Scy: "С", sdot: "⋅", sdotb: "⊡", sdote: "⩦", searhk: "⤥", searr: "↘", seArr: "⇘", searrow: "↘", sect: "§", semi: ";", seswar: "⤩", setminus: "∖", setmn: "∖", sext: "✶", sfr: "𝔰", Sfr: "𝔖", sfrown: "⌢", sharp: "♯", shchcy: "щ", SHCHcy: "Щ", shcy: "ш", SHcy: "Ш", ShortDownArrow: "↓", ShortLeftArrow: "←", shortmid: "∣", shortparallel: "∥", ShortRightArrow: "→", ShortUpArrow: "↑", shy: "­", sigma: "σ", Sigma: "Σ", sigmaf: "ς", sigmav: "ς", sim: "∼", simdot: "⩪", sime: "≃", simeq: "≃", simg: "⪞", simgE: "⪠", siml: "⪝", simlE: "⪟", simne: "≆", simplus: "⨤", simrarr: "⥲", slarr: "←", SmallCircle: "∘", smallsetminus: "∖", smashp: "⨳", smeparsl: "⧤", smid: "∣", smile: "⌣", smt: "⪪", smte: "⪬", smtes: "⪬︀", softcy: "ь", SOFTcy: "Ь", sol: "/", solb: "⧄", solbar: "⌿", sopf: "𝕤", Sopf: "𝕊", spades: "♠", spadesuit: "♠", spar: "∥", sqcap: "⊓", sqcaps: "⊓︀", sqcup: "⊔", sqcups: "⊔︀", Sqrt: "√", sqsub: "⊏", sqsube: "⊑", sqsubset: "⊏", sqsubseteq: "⊑", sqsup: "⊐", sqsupe: "⊒", sqsupset: "⊐", sqsupseteq: "⊒", squ: "□", square: "□", Square: "□", SquareIntersection: "⊓", SquareSubset: "⊏", SquareSubsetEqual: "⊑", SquareSuperset: "⊐", SquareSupersetEqual: "⊒", SquareUnion: "⊔", squarf: "▪", squf: "▪", srarr: "→", sscr: "𝓈", Sscr: "𝒮", ssetmn: "∖", ssmile: "⌣", sstarf: "⋆", star: "☆", Star: "⋆", starf: "★", straightepsilon: "ϵ", straightphi: "ϕ", strns: "¯", sub: "⊂", Sub: "⋐", subdot: "⪽", sube: "⊆", subE: "⫅", subedot: "⫃", submult: "⫁", subne: "⊊", subnE: "⫋", subplus: "⪿", subrarr: "⥹", subset: "⊂", Subset: "⋐", subseteq: "⊆", subseteqq: "⫅", SubsetEqual: "⊆", subsetneq: "⊊", subsetneqq: "⫋", subsim: "⫇", subsub: "⫕", subsup: "⫓", succ: "≻", succapprox: "⪸", succcurlyeq: "≽", Succeeds: "≻", SucceedsEqual: "⪰", SucceedsSlantEqual: "≽", SucceedsTilde: "≿", succeq: "⪰", succnapprox: "⪺", succneqq: "⪶", succnsim: "⋩", succsim: "≿", SuchThat: "∋", sum: "∑", Sum: "∑", sung: "♪", sup: "⊃", Sup: "⋑", sup1: "¹", sup2: "²", sup3: "³", supdot: "⪾", supdsub: "⫘", supe: "⊇", supE: "⫆", supedot: "⫄", Superset: "⊃", SupersetEqual: "⊇", suphsol: "⟉", suphsub: "⫗", suplarr: "⥻", supmult: "⫂", supne: "⊋", supnE: "⫌", supplus: "⫀", supset: "⊃", Supset: "⋑", supseteq: "⊇", supseteqq: "⫆", supsetneq: "⊋", supsetneqq: "⫌", supsim: "⫈", supsub: "⫔", supsup: "⫖", swarhk: "⤦", swarr: "↙", swArr: "⇙", swarrow: "↙", swnwar: "⤪", szlig: "ß", Tab: "	", target: "⌖", tau: "τ", Tau: "Τ", tbrk: "⎴", tcaron: "ť", Tcaron: "Ť", tcedil: "ţ", Tcedil: "Ţ", tcy: "т", Tcy: "Т", tdot: "⃛", telrec: "⌕", tfr: "𝔱", Tfr: "𝔗", there4: "∴", therefore: "∴", Therefore: "∴", theta: "θ", Theta: "Θ", thetasym: "ϑ", thetav: "ϑ", thickapprox: "≈", thicksim: "∼", ThickSpace: "  ", thinsp: " ", ThinSpace: " ", thkap: "≈", thksim: "∼", thorn: "þ", THORN: "Þ", tilde: "˜", Tilde: "∼", TildeEqual: "≃", TildeFullEqual: "≅", TildeTilde: "≈", times: "×", timesb: "⊠", timesbar: "⨱", timesd: "⨰", tint: "∭", toea: "⤨", top: "⊤", topbot: "⌶", topcir: "⫱", topf: "𝕥", Topf: "𝕋", topfork: "⫚", tosa: "⤩", tprime: "‴", trade: "™", TRADE: "™", triangle: "▵", triangledown: "▿", triangleleft: "◃", trianglelefteq: "⊴", triangleq: "≜", triangleright: "▹", trianglerighteq: "⊵", tridot: "◬", trie: "≜", triminus: "⨺", TripleDot: "⃛", triplus: "⨹", trisb: "⧍", tritime: "⨻", trpezium: "⏢", tscr: "𝓉", Tscr: "𝒯", tscy: "ц", TScy: "Ц", tshcy: "ћ", TSHcy: "Ћ", tstrok: "ŧ", Tstrok: "Ŧ", twixt: "≬", twoheadleftarrow: "↞", twoheadrightarrow: "↠", uacute: "ú", Uacute: "Ú", uarr: "↑", uArr: "⇑", Uarr: "↟", Uarrocir: "⥉", ubrcy: "ў", Ubrcy: "Ў", ubreve: "ŭ", Ubreve: "Ŭ", ucirc: "û", Ucirc: "Û", ucy: "у", Ucy: "У", udarr: "⇅", udblac: "ű", Udblac: "Ű", udhar: "⥮", ufisht: "⥾", ufr: "𝔲", Ufr: "𝔘", ugrave: "ù", Ugrave: "Ù", uHar: "⥣", uharl: "↿", uharr: "↾", uhblk: "▀", ulcorn: "⌜", ulcorner: "⌜", ulcrop: "⌏", ultri: "◸", umacr: "ū", Umacr: "Ū", uml: "¨", UnderBar: "_", UnderBrace: "⏟", UnderBracket: "⎵", UnderParenthesis: "⏝", Union: "⋃", UnionPlus: "⊎", uogon: "ų", Uogon: "Ų", uopf: "𝕦", Uopf: "𝕌", uparrow: "↑", Uparrow: "⇑", UpArrow: "↑", UpArrowBar: "⤒", UpArrowDownArrow: "⇅", updownarrow: "↕", Updownarrow: "⇕", UpDownArrow: "↕", UpEquilibrium: "⥮", upharpoonleft: "↿", upharpoonright: "↾", uplus: "⊎", UpperLeftArrow: "↖", UpperRightArrow: "↗", upsi: "υ", Upsi: "ϒ", upsih: "ϒ", upsilon: "υ", Upsilon: "Υ", UpTee: "⊥", UpTeeArrow: "↥", upuparrows: "⇈", urcorn: "⌝", urcorner: "⌝", urcrop: "⌎", uring: "ů", Uring: "Ů", urtri: "◹", uscr: "𝓊", Uscr: "𝒰", utdot: "⋰", utilde: "ũ", Utilde: "Ũ", utri: "▵", utrif: "▴", uuarr: "⇈", uuml: "ü", Uuml: "Ü", uwangle: "⦧", vangrt: "⦜", varepsilon: "ϵ", varkappa: "ϰ", varnothing: "∅", varphi: "ϕ", varpi: "ϖ", varpropto: "∝", varr: "↕", vArr: "⇕", varrho: "ϱ", varsigma: "ς", varsubsetneq: "⊊︀", varsubsetneqq: "⫋︀", varsupsetneq: "⊋︀", varsupsetneqq: "⫌︀", vartheta: "ϑ", vartriangleleft: "⊲", vartriangleright: "⊳", vBar: "⫨", Vbar: "⫫", vBarv: "⫩", vcy: "в", Vcy: "В", vdash: "⊢", vDash: "⊨", Vdash: "⊩", VDash: "⊫", Vdashl: "⫦", vee: "∨", Vee: "⋁", veebar: "⊻", veeeq: "≚", vellip: "⋮", verbar: "|", Verbar: "‖", vert: "|", Vert: "‖", VerticalBar: "∣", VerticalLine: "|", VerticalSeparator: "❘", VerticalTilde: "≀", VeryThinSpace: " ", vfr: "𝔳", Vfr: "𝔙", vltri: "⊲", vnsub: "⊂⃒", vnsup: "⊃⃒", vopf: "𝕧", Vopf: "𝕍", vprop: "∝", vrtri: "⊳", vscr: "𝓋", Vscr: "𝒱", vsubne: "⊊︀", vsubnE: "⫋︀", vsupne: "⊋︀", vsupnE: "⫌︀", Vvdash: "⊪", vzigzag: "⦚", wcirc: "ŵ", Wcirc: "Ŵ", wedbar: "⩟", wedge: "∧", Wedge: "⋀", wedgeq: "≙", weierp: "℘", wfr: "𝔴", Wfr: "𝔚", wopf: "𝕨", Wopf: "𝕎", wp: "℘", wr: "≀", wreath: "≀", wscr: "𝓌", Wscr: "𝒲", xcap: "⋂", xcirc: "◯", xcup: "⋃", xdtri: "▽", xfr: "𝔵", Xfr: "𝔛", xharr: "⟷", xhArr: "⟺", xi: "ξ", Xi: "Ξ", xlarr: "⟵", xlArr: "⟸", xmap: "⟼", xnis: "⋻", xodot: "⨀", xopf: "𝕩", Xopf: "𝕏", xoplus: "⨁", xotime: "⨂", xrarr: "⟶", xrArr: "⟹", xscr: "𝓍", Xscr: "𝒳", xsqcup: "⨆", xuplus: "⨄", xutri: "△", xvee: "⋁", xwedge: "⋀", yacute: "ý", Yacute: "Ý", yacy: "я", YAcy: "Я", ycirc: "ŷ", Ycirc: "Ŷ", ycy: "ы", Ycy: "Ы", yen: "¥", yfr: "𝔶", Yfr: "𝔜", yicy: "ї", YIcy: "Ї", yopf: "𝕪", Yopf: "𝕐", yscr: "𝓎", Yscr: "𝒴", yucy: "ю", YUcy: "Ю", yuml: "ÿ", Yuml: "Ÿ", zacute: "ź", Zacute: "Ź", zcaron: "ž", Zcaron: "Ž", zcy: "з", Zcy: "З", zdot: "ż", Zdot: "Ż", zeetrf: "ℨ", ZeroWidthSpace: "​", zeta: "ζ", Zeta: "Ζ", zfr: "𝔷", Zfr: "ℨ", zhcy: "ж", ZHcy: "Ж", zigrarr: "⇝", zopf: "𝕫", Zopf: "ℤ", zscr: "𝓏", Zscr: "𝒵", zwj: "‍", zwnj: "‌" }, y2 = { aacute: "á", Aacute: "Á", acirc: "â", Acirc: "Â", acute: "´", aelig: "æ", AElig: "Æ", agrave: "à", Agrave: "À", amp: "&", AMP: "&", aring: "å", Aring: "Å", atilde: "ã", Atilde: "Ã", auml: "ä", Auml: "Ä", brvbar: "¦", ccedil: "ç", Ccedil: "Ç", cedil: "¸", cent: "¢", copy: "©", COPY: "©", curren: "¤", deg: "°", divide: "÷", eacute: "é", Eacute: "É", ecirc: "ê", Ecirc: "Ê", egrave: "è", Egrave: "È", eth: "ð", ETH: "Ð", euml: "ë", Euml: "Ë", frac12: "½", frac14: "¼", frac34: "¾", gt: ">", GT: ">", iacute: "í", Iacute: "Í", icirc: "î", Icirc: "Î", iexcl: "¡", igrave: "ì", Igrave: "Ì", iquest: "¿", iuml: "ï", Iuml: "Ï", laquo: "«", lt: "<", LT: "<", macr: "¯", micro: "µ", middot: "·", nbsp: " ", not: "¬", ntilde: "ñ", Ntilde: "Ñ", oacute: "ó", Oacute: "Ó", ocirc: "ô", Ocirc: "Ô", ograve: "ò", Ograve: "Ò", ordf: "ª", ordm: "º", oslash: "ø", Oslash: "Ø", otilde: "õ", Otilde: "Õ", ouml: "ö", Ouml: "Ö", para: "¶", plusmn: "±", pound: "£", quot: '"', QUOT: '"', raquo: "»", reg: "®", REG: "®", sect: "§", shy: "­", sup1: "¹", sup2: "²", sup3: "³", szlig: "ß", thorn: "þ", THORN: "Þ", times: "×", uacute: "ú", Uacute: "Ú", ucirc: "û", Ucirc: "Û", ugrave: "ù", Ugrave: "Ù", uml: "¨", uuml: "ü", Uuml: "Ü", yacute: "ý", Yacute: "Ý", yen: "¥", yuml: "ÿ" }, v2 = { 0: "�", 128: "€", 130: "‚", 131: "ƒ", 132: "„", 133: "…", 134: "†", 135: "‡", 136: "ˆ", 137: "‰", 138: "Š", 139: "‹", 140: "Œ", 142: "Ž", 145: "‘", 146: "’", 147: "“", 148: "”", 149: "•", 150: "–", 151: "—", 152: "˜", 153: "™", 154: "š", 155: "›", 156: "œ", 158: "ž", 159: "Ÿ" }, x2 = [1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 154, 155, 156, 157, 158, 159, 64976, 64977, 64978, 64979, 64980, 64981, 64982, 64983, 64984, 64985, 64986, 64987, 64988, 64989, 64990, 64991, 64992, 64993, 64994, 64995, 64996, 64997, 64998, 64999, 65e3, 65001, 65002, 65003, 65004, 65005, 65006, 65007, 65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678, 327679, 393214, 393215, 458750, 458751, 524286, 524287, 589822, 589823, 655358, 655359, 720894, 720895, 786430, 786431, 851966, 851967, 917502, 917503, 983038, 983039, 1048574, 1048575, 1114110, 1114111], w2 = String.fromCharCode, k2 = {}.hasOwnProperty, A2 = function(e6, t3) {
    return k2.call(e6, t3);
  }, _2 = function(e6, t3) {
    if (!e6) return t3;
    var r3, n2 = {};
    for (r3 in t3) n2[r3] = A2(e6, r3) ? e6[r3] : t3[r3];
    return n2;
  }, S2 = function(e6, t3) {
    var r3 = "";
    return e6 >= 55296 && e6 <= 57343 || e6 > 1114111 ? (t3 && z2("character reference outside the permissible Unicode range"), "�") : A2(v2, e6) ? (t3 && z2("disallowed character reference"), v2[e6]) : (t3 && (function(e7, t4) {
      for (var r4 = -1, n2 = e7.length; ++r4 < n2; ) if (e7[r4] == t4) return true;
      return false;
    })(x2, e6) && z2("disallowed character reference"), e6 > 65535 && (r3 += w2((e6 -= 65536) >>> 10 & 1023 | 55296), e6 = 56320 | 1023 & e6), r3 += w2(e6));
  }, q2 = function(e6) {
    return "&#x" + e6.toString(16).toUpperCase() + ";";
  }, C2 = function(e6) {
    return "&#" + e6 + ";";
  }, z2 = function(e6) {
    throw Error("Parse error: " + e6);
  }, T2 = function(e6, t3) {
    (t3 = _2(t3, T2.options)).strict && g2.test(e6) && z2("forbidden code point");
    var r3 = t3.encodeEverything, n2 = t3.useNamedReferences, i2 = t3.allowUnsafeSymbols, o3 = t3.decimal ? C2 : q2, a3 = function(e7) {
      return o3(e7.charCodeAt(0));
    };
    return r3 ? (e6 = e6.replace(l2, (function(e7) {
      return n2 && A2(h2, e7) ? "&" + h2[e7] + ";" : a3(e7);
    })), n2 && (e6 = e6.replace(/&gt;\u20D2/g, "&nvgt;").replace(/&lt;\u20D2/g, "&nvlt;").replace(/&#x66;&#x6A;/g, "&fjlig;")), n2 && (e6 = e6.replace(c2, (function(e7) {
      return "&" + h2[e7] + ";";
    })))) : n2 ? (i2 || (e6 = e6.replace(p2, (function(e7) {
      return "&" + h2[e7] + ";";
    }))), e6 = (e6 = e6.replace(/&gt;\u20D2/g, "&nvgt;").replace(/&lt;\u20D2/g, "&nvlt;")).replace(c2, (function(e7) {
      return "&" + h2[e7] + ";";
    }))) : i2 || (e6 = e6.replace(p2, a3)), e6.replace(s2, (function(e7) {
      var t4 = e7.charCodeAt(0), r4 = e7.charCodeAt(1);
      return o3(1024 * (t4 - 55296) + r4 - 56320 + 65536);
    })).replace(u2, a3);
  };
  T2.options = { allowUnsafeSymbols: false, encodeEverything: false, strict: false, useNamedReferences: false, decimal: false };
  var M2 = function(e6, t3) {
    var r3 = (t3 = _2(t3, M2.options)).strict;
    return r3 && m2.test(e6) && z2("malformed character reference"), e6.replace(f2, (function(e7, n2, i2, o3, a3, s3, l3, u3, c3) {
      var h3, p3, d3, m3, g3, f3;
      return n2 ? b2[g3 = n2] : i2 ? (g3 = i2, (f3 = o3) && t3.isAttributeValue ? (r3 && "=" == f3 && z2("`&` did not start a character reference"), e7) : (r3 && z2("named character reference was not terminated by a semicolon"), y2[g3] + (f3 || ""))) : a3 ? (d3 = a3, p3 = s3, r3 && !p3 && z2("character reference was not terminated by a semicolon"), h3 = parseInt(d3, 10), S2(h3, r3)) : l3 ? (m3 = l3, p3 = u3, r3 && !p3 && z2("character reference was not terminated by a semicolon"), h3 = parseInt(m3, 16), S2(h3, r3)) : (r3 && z2("named character reference was not terminated by a semicolon"), e7);
    }));
  };
  M2.options = { isAttributeValue: false, strict: false };
  var E2 = { version: "1.2.0", encode: T2, decode: M2, escape: function(e6) {
    return e6.replace(p2, (function(e7) {
      return d2[e7];
    }));
  }, unescape: M2 };
  if (r2 && !r2.nodeType) if (o2) o2.exports = E2;
  else for (var D2 in E2) A2(E2, D2) && (r2[D2] = E2[D2]);
  else t2.he = E2;
})(e);
var a, s, l = t(o.exports);
a = function(e6) {
  return (function() {
    var t2, r2;
    function n2(e7, t3) {
      this._value = e7, this._unit = t3, r2.has(t3) && (this._value = e7 * r2.get(t3), this._unit = "sp");
    }
    return n2.prototype, t2 = e6, n2.prototype._value = 0, n2.prototype._unit = "", r2 = /* @__PURE__ */ new Map([["sp", 1], ["pt", 65536], ["bp", 65781.76], ["pc", 786432], ["dd", 81133568 / 1157], ["cc", 81133568 / 1157 * 12], ["in", 473628672e-2], ["px", 49336.32], ["mm", 473628672 / 2540], ["cm", 473628672 / 254]]), n2.zero = new n2(0, "sp"), Object.defineProperty(n2.prototype, "value", { get: function() {
      return "sp" === this._unit ? t2.round(this._value / r2.get("px")) + "px" : t2.round(this._value) + this._unit;
    }, configurable: true, enumerable: true }), Object.defineProperty(n2.prototype, "px", { get: function() {
      return "sp" === this._unit ? t2.round(this._value / r2.get("px")) : t2.error("Length.px() called on relative length!");
    }, configurable: true, enumerable: true }), Object.defineProperty(n2.prototype, "pxpct", { get: function() {
      return "sp" === this._unit ? t2.round(this._value / r2.get("px")) : t2.round(this._value) + this._unit;
    }, configurable: true, enumerable: true }), Object.defineProperty(n2.prototype, "unit", { get: function() {
      return this._unit;
    }, configurable: true, enumerable: true }), n2.prototype.cmp = function(e7) {
      return this._unit !== e7._unit && t2.error("Length.cmp(): incompatible lengths! (" + this._unit + " and " + e7._unit + ")"), this._value < e7._value ? -1 : this._value === e7._value ? 0 : 1;
    }, n2.prototype.add = function(e7) {
      return this._unit !== e7._unit && t2.error("Length.add(): incompatible lengths! (" + this._unit + " and " + e7._unit + ")"), new t2.Length(this._value + e7._value, this._unit);
    }, n2.prototype.sub = function(e7) {
      return this._unit !== e7._unit && t2.error("Length.sub: incompatible lengths! (" + this._unit + " and " + e7._unit + ")"), new t2.Length(this._value - e7._value, this._unit);
    }, n2.prototype.mul = function(e7) {
      return new t2.Length(this._value * e7, this._unit);
    }, n2.prototype.div = function(e7) {
      return new t2.Length(this._value / e7, this._unit);
    }, n2.prototype.abs = function() {
      return new t2.Length(Math.abs(this._value), this._unit);
    }, n2.prototype.ratio = function(e7) {
      return this._unit !== e7._unit && t2.error("Length.ratio: incompatible lengths! (" + this._unit + " and " + e7._unit + ")"), this._value / e7._value;
    }, n2.prototype.norm = function(e7) {
      return this._unit !== e7._unit && t2.error("Length.norm: incompatible lengths! (" + this._unit + " and " + e7._unit + ")"), new t2.Length(Math.sqrt(Math.pow(this._value, 2) + Math.pow(e7._value, 2)), this._unit);
    }, n2.min = function() {
      return Array.from(arguments).reduce((function(e7, t3) {
        return e7.cmp(t3) < 0 ? e7 : t3;
      }));
    }, n2.max = function() {
      return Array.from(arguments).reduce((function(e7, t3) {
        return e7.cmp(t3) > 0 ? e7 : t3;
      }));
    }, n2;
  })();
}, s = (function() {
  function e6(e7, t2) {
    this._x = e7, this._y = t2;
  }
  return e6.displayName = "Vector", e6.prototype, e6.prototype._x = null, e6.prototype._y = null, Object.defineProperty(e6.prototype, "x", { get: function() {
    return this._x;
  }, configurable: true, enumerable: true }), Object.defineProperty(e6.prototype, "y", { get: function() {
    return this._y;
  }, configurable: true, enumerable: true }), e6.prototype.add = function(t2) {
    return new e6(this._x.add(t2.x), this._y.add(t2.y));
  }, e6.prototype.sub = function(t2) {
    return new e6(this._x.sub(t2.x), this._y.sub(t2.y));
  }, e6.prototype.mul = function(t2) {
    return new e6(this._x.mul(t2), this._y.mul(t2));
  }, e6.prototype.shift_start = function(t2) {
    var r2, n2, i2, o2, a2, s2, l2, u2;
    if (this._x.unit !== this._y.unit) throw new Error("Vector.shift_start: incompatible lengths! (" + this._x.unit + " and " + this._y.unit + ")");
    return r2 = this._x._value, n2 = this._y._value, i2 = Math.sqrt(1 + n2 * n2 / (r2 * r2)), o2 = Math.sqrt(1 + r2 * r2 / (n2 * n2)), a2 = r2 < 0 ? -1 : 1, s2 = n2 < 0 ? -1 : 1, 0 !== r2 && 0 !== n2 ? (l2 = t2.div(i2).mul(-a2), u2 = t2.div(o2).mul(-s2)) : 0 === n2 ? (l2 = t2.mul(-a2), u2 = this._y.mul(0)) : (l2 = this._x.mul(0), u2 = t2.mul(-s2)), new e6(l2, u2);
  }, e6.prototype.shift_end = function(t2) {
    var r2, n2, i2, o2, a2, s2, l2, u2;
    if (this._x.unit !== this._y.unit) throw new Error("Vector.shift_end: incompatible lengths! (" + this._x.unit + " and " + this._y.unit + ")");
    return r2 = this._x._value, n2 = this._y._value, i2 = Math.sqrt(1 + n2 * n2 / (r2 * r2)), o2 = Math.sqrt(1 + r2 * r2 / (n2 * n2)), a2 = r2 < 0 ? -1 : 1, s2 = n2 < 0 ? -1 : 1, 0 !== r2 && 0 !== n2 ? (l2 = this._x.add(t2.div(i2).mul(a2)), u2 = this._y.add(t2.div(o2).mul(s2))) : 0 === n2 ? (l2 = this._x.add(t2.mul(a2)), u2 = this._y) : (l2 = this._x, u2 = this._y.add(t2.mul(s2))), new e6(l2, u2);
  }, e6.prototype.norm = function() {
    return this._x.norm(this._y);
  }, e6;
})();
var u, c, h, p, d, m, g, f = r(Object.freeze({ __proto__: null, get Vector() {
  return s;
}, get makeLengthClass() {
  return a;
} })), b = (function() {
  function e6(t2, r2, n2, i2) {
    this.message = t2, this.expected = r2, this.found = n2, this.location = i2, this.name = "SyntaxError", "function" == typeof Error.captureStackTrace && Error.captureStackTrace(this, e6);
  }
  return (function(e7, t2) {
    function r2() {
      this.constructor = e7;
    }
    r2.prototype = t2.prototype, e7.prototype = new r2();
  })(e6, Error), e6.buildMessage = function(e7, t2) {
    var r2 = { literal: function(e8) {
      return '"' + i2(e8.text) + '"';
    }, class: function(e8) {
      var t3, r3 = "";
      for (t3 = 0; t3 < e8.parts.length; t3++) r3 += e8.parts[t3] instanceof Array ? o2(e8.parts[t3][0]) + "-" + o2(e8.parts[t3][1]) : o2(e8.parts[t3]);
      return "[" + (e8.inverted ? "^" : "") + r3 + "]";
    }, any: function(e8) {
      return "any character";
    }, end: function(e8) {
      return "end of input";
    }, other: function(e8) {
      return e8.description;
    } };
    function n2(e8) {
      return e8.charCodeAt(0).toString(16).toUpperCase();
    }
    function i2(e8) {
      return e8.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (function(e9) {
        return "\\x0" + n2(e9);
      })).replace(/[\x10-\x1F\x7F-\x9F]/g, (function(e9) {
        return "\\x" + n2(e9);
      }));
    }
    function o2(e8) {
      return e8.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, (function(e9) {
        return "\\x0" + n2(e9);
      })).replace(/[\x10-\x1F\x7F-\x9F]/g, (function(e9) {
        return "\\x" + n2(e9);
      }));
    }
    return "Expected " + (function(e8) {
      var t3, n3, i3, o3 = new Array(e8.length);
      for (t3 = 0; t3 < e8.length; t3++) o3[t3] = (i3 = e8[t3], r2[i3.type](i3));
      if (o3.sort(), o3.length > 0) {
        for (t3 = 1, n3 = 1; t3 < o3.length; t3++) o3[t3 - 1] !== o3[t3] && (o3[n3] = o3[t3], n3++);
        o3.length = n3;
      }
      switch (o3.length) {
        case 1:
          return o3[0];
        case 2:
          return o3[0] + " or " + o3[1];
        default:
          return o3.slice(0, -1).join(", ") + ", or " + o3[o3.length - 1];
      }
    })(e7) + " but " + (function(e8) {
      return e8 ? '"' + i2(e8) + '"' : "end of input";
    })(t2) + " found.";
  }, { SyntaxError: e6, parse: function(t2, r2) {
    r2 = void 0 !== r2 ? r2 : {};
    var n2, i2 = {}, o2 = { latex: dl2 }, a2 = dl2, s2 = function() {
      al2("expected \\begin{document}");
    }, l2 = function() {
      al2("\\end{document} missing");
    }, u2 = { type: "any" }, c2 = function() {
      return mc2;
    }, h2 = function() {
      return mc2.macro("documentclass", [null, mc2.documentClass, null]), true;
    }, p2 = "document", d2 = sl2("document", false), m2 = function() {
      return mc2.startBalanced(), mc2.enterGroup(), true;
    }, g2 = function(e7) {
      mc2.exitGroup(), mc2.isBalanced() || al2("groups need to be balanced!");
      var t3 = mc2.endBalanced();
      return 1 == t3 && mc2.isBalanced() || al2("grammar error: " + t3 + " levels of balancing are remaining, or the last level is unbalanced!"), mc2.createDocument(e7), mc2.logUndefinedRefs(), mc2;
    }, b2 = function(e7, t3, r3, n3) {
      e7.length > 0 && mc2.break();
      var i3 = mc2.create(mc2.par, r3, t3 ? "noindent" : "");
      return n3 && mc2.break(), i3;
    }, y2 = function() {
      return mc2.create(mc2.linebreak);
    }, v2 = function() {
    }, x2 = function() {
      return mc2.createText(mc2.sp);
    }, w2 = ul2("text"), k2 = function(e7) {
      return mc2.createText(e7.join(""));
    }, A2 = function(e7) {
      return e7;
    }, _2 = function() {
      return mc2.enterGroup(true), true;
    }, S2 = function(e7) {
      return mc2.createText(e7);
    }, q2 = function() {
      if (!mc2.isBalanced()) return mc2.exitGroup(), true;
    }, C2 = ul2("primitive"), z2 = function() {
      return mc2.sp;
    }, T2 = function(e7) {
      return !mc2.isBalanced();
    }, M2 = function(e7) {
      return e7;
    }, E2 = function(e7) {
      return e7;
    }, D2 = function(e7) {
      return mc2.break(), e7;
    }, L2 = function(e7) {
      return mc2.isPreamble(e7);
    }, B2 = function(e7) {
      return mc2.isVmode(e7);
    }, N2 = function(e7) {
      return mc2.isHmode(e7);
    }, O2 = function(e7) {
      return mc2.isHVmode(e7);
    }, F2 = function(e7) {
      return mc2.isHmode(e7) || mc2.isHVmode(e7);
    }, R2 = function(e7) {
      if (mc2.hasMacro(e7)) return mc2.beginArgs(e7), true;
    }, H2 = function(e7) {
      var t3 = mc2.parsedArgs();
      return mc2.endArgs(), mc2.createFragment(mc2.macro(e7, t3));
    }, V2 = function(e7) {
      al2("macro only allowed in preamble: " + e7);
    }, I2 = function(e7) {
      al2("unknown macro: \\" + e7);
    }, P2 = ul2("identifier"), j2 = /^[\-$&_\/@]/, G2 = ll2(["-", "$", "&", "_", "/", "@"], false, false), U2 = /^[=,]/, Y2 = ll2(["=", ","], false, false), X2 = ul2("key=value"), W2 = "=", $2 = sl2("=", false), Z2 = function(e7) {
      al2("value expected");
    }, J2 = function(e7, t3) {
      return t3.trim();
    }, K2 = function(e7, t3) {
      return [e7.trim(), null == t3 || t3];
    }, Q2 = function() {
      return mc2.nextArg("X");
    }, ee2 = function() {
      mc2.preExecMacro();
    }, te2 = function() {
      return mc2.nextArg("g");
    }, re2 = function() {
      mc2.argError("group argument expected");
    }, ne2 = function(e7) {
      mc2.addParsedArg(e7);
    }, ie2 = function() {
      return mc2.nextArg("hg");
    }, oe2 = function() {
      return mc2.nextArg("h");
    }, ae2 = function() {
      mc2.argError("horizontal material expected");
    }, se2 = function(e7) {
      mc2.addParsedArg(e7);
    }, le2 = function() {
      return mc2.nextArg("o?");
    }, ue2 = function(e7) {
      mc2.addParsedArg(e7);
    }, ce2 = function() {
      return mc2.nextArg("i");
    }, he2 = function() {
      mc2.argError("id group argument expected");
    }, pe2 = function(e7) {
      mc2.addParsedArg(e7);
    }, de2 = function() {
      return mc2.nextArg("ie");
    }, me2 = function() {
      mc2.argError("id or empty group arg expected");
    }, ge2 = function() {
      return mc2.nextArg("i?");
    }, fe2 = function() {
      return mc2.nextArg("k");
    }, be2 = function() {
      mc2.argError("key group argument expected");
    }, ye2 = function(e7) {
      mc2.addParsedArg(e7);
    }, ve2 = function() {
      return mc2.nextArg("k?");
    }, xe2 = function() {
      return mc2.nextArg("kv?");
    }, we2 = function() {
      return mc2.nextArg("csv");
    }, ke2 = function() {
      mc2.argError("comma-sep. values group expected");
    }, Ae2 = function(e7) {
      mc2.addParsedArg(e7);
    }, _e2 = function() {
      return mc2.nextArg("n");
    }, Se2 = function() {
      mc2.argError("num group argument expected");
    }, qe2 = function(e7) {
      mc2.addParsedArg(e7);
    }, Ce2 = function() {
      return mc2.nextArg("n?");
    }, ze2 = function() {
      return mc2.nextArg("l");
    }, Te2 = function() {
      mc2.argError("length group argument expected");
    }, Me2 = function(e7) {
      mc2.addParsedArg(e7);
    }, Ee2 = function() {
      return mc2.nextArg("lg?");
    }, De2 = function() {
      return mc2.nextArg("l?");
    }, Le2 = function() {
      return mc2.nextArg("m");
    }, Be2 = function() {
      mc2.argError("macro group argument expected");
    }, Ne2 = function(e7) {
      mc2.addParsedArg(e7);
    }, Oe2 = function() {
      return mc2.nextArg("u");
    }, Fe2 = function() {
      mc2.argError("url group argument expected");
    }, Re2 = function(e7) {
      mc2.addParsedArg(e7);
    }, He2 = function() {
      return mc2.nextArg("c");
    }, Ve2 = function() {
      mc2.argError("color group expected");
    }, Ie2 = function(e7) {
      mc2.addParsedArg(e7);
    }, Pe2 = function() {
      return mc2.nextArg("c-ml");
    }, je2 = function() {
      mc2.argError("color model list expected");
    }, Ge2 = function() {
      return mc2.nextArg("c-ml?");
    }, Ue2 = function() {
      return mc2.nextArg("c-ssp");
    }, Ye2 = function() {
      mc2.argError("color set spec expected");
    }, Xe2 = function() {
      return mc2.nextArg("c-spl");
    }, We2 = function() {
      mc2.argError("color spec list expected");
    }, $e2 = function() {
      return mc2.nextArg("cl");
    }, Ze2 = function() {
      mc2.argError("coordinate/length group expected");
    }, Je2 = function() {
      return mc2.nextArg("cl?");
    }, Ke2 = function() {
      return mc2.nextArg("v");
    }, Qe2 = function() {
      mc2.argError("coordinate pair expected");
    }, et2 = function() {
      return mc2.nextArg("v?");
    }, tt2 = function() {
      return mc2.nextArg("cols");
    }, rt2 = function() {
      mc2.argError("column specification missing");
    }, nt2 = function() {
      return mc2.nextArg("is");
    }, it2 = function() {
      return mc2.nextArg("items");
    }, ot2 = function() {
      return mc2.nextArg("enumitems");
    }, at2 = function() {
      return mc2.selectArgsBranch("[");
    }, st2 = function() {
      return mc2.selectArgsBranch("{");
    }, lt2 = function() {
      return mc2.nextArg("s");
    }, ut2 = "*", ct2 = sl2("*", false), ht2 = function(e7) {
      return mc2.addParsedArg(!!e7), !!e7;
    }, pt2 = function(e7) {
      return e7;
    }, dt2 = function(e7) {
      return e7;
    }, mt2 = ",", gt2 = sl2(",", false), ft2 = function() {
      return null;
    }, bt2 = function(e7) {
      return e7;
    }, yt2 = function(e7) {
      return new Map(e7.filter(((e8) => null != e8)));
    }, vt2 = function(e7) {
      return e7.trim();
    }, xt2 = function(e7) {
      return e7.filter(((e8) => null != e8));
    }, wt2 = "sp", kt2 = sl2("sp", false), At2 = "pt", _t2 = sl2("pt", false), St2 = "px", qt2 = sl2("px", false), Ct2 = "dd", zt2 = sl2("dd", false), Tt2 = "mm", Mt2 = sl2("mm", false), Et2 = "pc", Dt2 = sl2("pc", false), Lt2 = "cc", Bt2 = sl2("cc", false), Nt2 = "cm", Ot2 = sl2("cm", false), Ft2 = "in", Rt2 = sl2("in", false), Ht2 = "ex", Vt2 = sl2("ex", false), It2 = "em", Pt2 = sl2("em", false), jt2 = function(e7) {
      return e7;
    }, Gt2 = function(e7, t3) {
      return new mc2.Length(e7, t3);
    }, Ut2 = function(e7) {
      return e7;
    }, Yt2 = function(e7) {
      return e7;
    }, Xt2 = function(e7) {
      return mc2.length("unitlength").mul(e7);
    }, Wt2 = function(e7) {
      return e7;
    }, $t2 = "(", Zt2 = sl2("(", false), Jt2 = ")", Kt2 = sl2(")", false), Qt2 = function(e7, t3) {
      return new dc2(e7, t3);
    }, er2 = "%", tr2 = sl2("%", false), rr2 = function(e7) {
      return e7;
    }, nr2 = /^[\-._~:\/?#[\]@!$&()*+,;=]/, ir2 = ll2(["-", ".", "_", "~", ":", "/", "?", "#", "[", "]", "@", "!", "$", "&", "(", ")", "*", "+", ",", ";", "="], false, false), or2 = "'", ar2 = sl2("'", false), sr2 = function() {
      al2("illegal char in url given");
    }, lr2 = function(e7) {
      return e7;
    }, ur2 = function(e7) {
      return e7.join("");
    }, cr2 = function() {
      return mc2.enterGroup(), mc2.startBalanced(), true;
    }, hr2 = function(e7, t3) {
      return mc2.isBalanced() || al2("groups inside an argument need to be balanced!"), mc2.endBalanced(), mc2.exitGroup(), null != e7 && t3.unshift(mc2.createText(e7)), mc2.createFragment(t3);
    }, pr2 = function(e7) {
      return mc2.createFragment(e7);
    }, dr2 = function(e7, t3) {
      return mc2.isBalanced() || al2("groups inside an argument need to be balanced!"), mc2.endBalanced(), mc2.exitGroup(), mc2.createFragment(mc2.createText(e7), t3);
    }, mr2 = function(e7) {
      return mc2.isBalanced();
    }, gr2 = function(e7) {
      return mc2.isBalanced() || al2("groups inside an optional argument need to be balanced!"), mc2.endBalanced(), mc2.exitGroup(), mc2.createFragment(e7);
    }, fr2 = "value", br2 = sl2("value", false), yr2 = "real", vr2 = sl2("real", false), xr2 = function(e7) {
      return e7;
    }, wr2 = function(e7) {
      return e7;
    }, kr2 = function(e7) {
      return mc2.counter(e7);
    }, Ar2 = "+", _r2 = sl2("+", false), Sr2 = "-", qr2 = sl2("-", false), Cr2 = function(e7, t3) {
      return "-" == e7 ? -t3 : t3;
    }, zr2 = "/", Tr2 = sl2("/", false), Mr2 = function(e7, t3) {
      var r3, n3 = e7;
      for (r3 = 0; r3 < t3.length; r3++) "*" === t3[r3][1] && (n3 = Math.trunc(n3 * t3[r3][3])), "/" === t3[r3][1] && (n3 = Math.trunc(n3 / t3[r3][3]));
      return Math.trunc(n3);
    }, Er2 = function(e7, t3) {
      var r3, n3 = e7;
      for (r3 = 0; r3 < t3.length; r3++) "+" === t3[r3][1] && (n3 += t3[r3][3]), "-" === t3[r3][1] && (n3 -= t3[r3][3]);
      return n3;
    }, Dr2 = function(e7) {
      return e7;
    }, Lr2 = function(e7) {
      return e7;
    }, Br2 = function(e7) {
      return e7;
    }, Nr2 = ":", Or2 = sl2(":", false), Fr2 = ";", Rr2 = sl2(";", false), Hr2 = "!", Vr2 = sl2("!", false), Ir2 = ">", Pr2 = sl2(">", false), jr2 = "wheel", Gr2 = sl2("wheel", false), Ur2 = "twheel", Yr2 = sl2("twheel", false), Xr2 = function(e7) {
      return e7.length % 2 == 0;
    }, Wr2 = ".", $r2 = sl2(".", false), Zr2 = "!!", Jr2 = sl2("!!", false), Kr2 = "[", Qr2 = sl2("[", false), en2 = "]", tn2 = sl2("]", false), rn2 = "rgb", nn2 = sl2("rgb", false), on2 = "cmyk", an2 = sl2("cmyk", false), sn2 = "cmy", ln2 = sl2("cmy", false), un2 = "hsb", cn2 = sl2("hsb", false), hn2 = "gray", pn2 = sl2("gray", false), dn2 = "RBG", mn2 = sl2("RBG", false), gn2 = "HTML", fn2 = sl2("HTML", false), bn2 = "HSB", yn2 = sl2("HSB", false), vn2 = "Gray", xn2 = sl2("Gray", false), wn2 = "Hsb", kn2 = sl2("Hsb", false), An2 = "tHsb", _n2 = sl2("tHsb", false), Sn2 = "wave", qn2 = sl2("wave", false), Cn2 = "named", zn2 = sl2("named", false), Tn2 = function(e7, t3, r3) {
      e7 && (e7 = e7[0]);
      var n3 = [t3];
      return r3.forEach(((e8) => n3.push(e8[1]))), { core: e7, models: n3 };
    }, Mn2 = function(e7, t3) {
      var r3 = [e7];
      return t3.forEach(((e8) => r3.push(e8[1]))), r3;
    }, En2 = function(e7, t3) {
      var r3 = [e7];
      return t3.forEach(((e8) => r3.push(e8[1]))), r3;
    }, Dn2 = function(e7, t3, r3) {
      var n3 = [{ name: e7, speclist: t3 }];
      return r3.forEach(((e8) => n3.push({ name: e8[2], speclist: e8[4] }))), n3;
    }, Ln2 = function(e7, t3, r3) {
      return Array.isArray(t3) ? t3.concat(r3) : [t3].concat(r3);
    }, Bn2 = function(e7, t3) {
      return t3.reduce((function(e8, t4) {
        return e8.concat(t4);
      }), e7);
    }, Nn2 = "l", On2 = sl2("l", false), Fn2 = "c", Rn2 = sl2("c", false), Hn2 = "r", Vn2 = sl2("r", false), In2 = "p", Pn2 = sl2("p", false), jn2 = function(e7) {
      return e7;
    }, Gn2 = function(e7, t3) {
      for (var r3 = [], n3 = 0; n3 < e7; n3++) r3 = r3.concat(t3.slice());
      return r3;
    }, Un2 = "|", Yn2 = sl2("|", false), Xn2 = "@", Wn2 = sl2("@", false), $n2 = function(e7) {
      return e7;
    }, Zn2 = function(e7) {
      return { type: "separator", content: e7 };
    }, Jn2 = "vspace", Kn2 = sl2("vspace", false), Qn2 = function(e7) {
      return mc2.createVSpaceInline(e7);
    }, ei2 = function(e7) {
      return mc2.createVSpace(e7);
    }, ti2 = "small", ri2 = sl2("small", false), ni2 = "med", ii2 = sl2("med", false), oi2 = "big", ai2 = sl2("big", false), si2 = "skip", li2 = sl2("skip", false), ui2 = function(e7) {
      return mc2.createVSpaceSkipInline(e7 + "skip");
    }, ci2 = function(e7) {
      return mc2.createVSpaceSkip(e7 + "skip");
    }, hi2 = "verb", pi2 = sl2("verb", false), di2 = function(e7, t3, r3) {
      return t3 == r3;
    }, mi2 = function(e7, t3, r3, n3) {
      return t3 == n3 || al2("\\verb is missing its end delimiter: " + t3), e7 && (r3 = r3.replace(/ /g, mc2.visp)), mc2.create(mc2.verb, mc2.createVerbatim(r3, true));
    }, gi2 = ul2("\\begin"), fi2 = function(e7) {
      return mc2.begin(e7), e7;
    }, bi2 = function(e7, t3) {
      return { id: e7, end: e7 + (t3 ? "*" : "") };
    }, yi2 = ul2("\\end"), vi2 = function(e7, t3) {
      return e7 + (t3 ? "*" : "");
    }, xi2 = function(e7) {
      return mc2.macro(e7.id, mc2.endArgs());
    }, wi2 = function(e7, t3, r3) {
      return mc2.createText(r3);
    }, ki2 = function(e7, t3, r3, n3, i3, o3) {
      return mc2.createText(o3);
    }, Ai2 = function(e7, t3, r3, n3, i3, o3) {
      var a3 = mc2.end(e7.end, i3), s3 = mc2.createFragment(n3);
      return s3 && t3 && t3.length > 0 && 1 === t3[t3.length - 1].nodeType ? (t3[t3.length - 1].appendChild(r3), t3[t3.length - 1].appendChild(s3), mc2.createFragment(t3, a3, o3)) : mc2.createFragment(t3, r3, s3, a3, o3);
    }, _i2 = function(e7) {
      mc2.break();
    }, Si2 = function(e7, t3, r3, n3) {
      var i3 = mc2.end(e7.end, n3), o3 = mc2.createFragment(r3);
      return o3 && t3 && t3.length > 0 && 1 === t3[t3.length - 1].nodeType ? (t3[t3.length - 1].appendChild(o3), mc2.createFragment(t3, i3)) : mc2.createFragment(t3, o3, i3);
    }, qi2 = "item", Ci2 = sl2("item", false), zi2 = function() {
      mc2.break();
    }, Ti2 = function(e7) {
      return e7;
    }, Mi2 = function(e7, t3) {
      return t3;
    }, Ei2 = function(e7, t3) {
      return { label: e7, text: mc2.createFragment(t3) };
    }, Di2 = function(e7) {
      if (null === e7) {
        var t3 = "enum" + mc2.roman(mc2.counter("@enumdepth")), r3 = "item-" + mc2.nextId();
        return mc2.stepCounter(t3), mc2.refCounter(t3, r3), { id: r3, node: mc2.macro("label" + t3) };
      }
      return { id: void 0, node: e7 };
    }, Li2 = ul2("comment environment"), Bi2 = "\\begin", Ni2 = sl2("\\begin", false), Oi2 = "{comment}", Fi2 = sl2("{comment}", false), Ri2 = function() {
      mc2.break();
    }, Hi2 = "\\end", Vi2 = sl2("\\end", false), Ii2 = function(e7) {
      return mc2.parseMath(e7, false);
    }, Pi2 = function(e7) {
      return mc2.parseMath(e7, true);
    }, ji2 = "begin", Gi2 = sl2("begin", false), Ui2 = function() {
    }, Yi2 = "end", Xi2 = sl2("end", false), Wi2 = "par", $i2 = sl2("par", false), Zi2 = "noindent", Ji2 = sl2("noindent", false), Ki2 = "plus", Qi2 = sl2("plus", false), eo2 = "minus", to2 = sl2("minus", false), ro2 = "endinput", no2 = sl2("endinput", false), io2 = "\\", oo2 = sl2("\\", false), ao2 = "{", so2 = sl2("{", false), lo2 = "}", uo2 = sl2("}", false), co2 = ul2("math"), ho2 = "$", po2 = sl2("$", false), mo2 = "&", go2 = sl2("&", false), fo2 = ul2("parameter"), bo2 = "#", yo2 = sl2("#", false), vo2 = "^", xo2 = sl2("^", false), wo2 = "_", ko2 = sl2("_", false), Ao2 = "\0", _o2 = sl2("\0", false), So2 = ul2("EOF"), qo2 = ul2("newline"), Co2 = "\n", zo2 = sl2("\n", false), To2 = "\r\n", Mo2 = sl2("\r\n", false), Eo2 = "\r", Do2 = sl2("\r", false), Lo2 = "\u2028", Bo2 = sl2("\u2028", false), No2 = "\u2029", Oo2 = sl2("\u2029", false), Fo2 = ul2("whitespace"), Ro2 = /^[ \t]/, Ho2 = ll2([" ", "	"], false, false), Vo2 = ul2("comment"), Io2 = ul2("spaces"), Po2 = function() {
      return mc2.brsp;
    }, jo2 = ul2("control space"), Go2 = ul2("non-brk space"), Uo2 = "~", Yo2 = sl2("~", false), Xo2 = function() {
      return mc2.nbsp;
    }, Wo2 = ul2("paragraph break"), $o2 = function() {
      return true;
    }, Zo2 = ul2("linebreak"), Jo2 = function(e7) {
      return e7;
    }, Ko2 = function(e7) {
      return e7 ? mc2.createBreakSpace(e7) : mc2.create(mc2.linebreak);
    }, Qo2 = "put", ea2 = sl2("put", false), ta2 = "newline", ra2 = sl2("newline", false), na2 = ul2("letter"), ia2 = /^[a-z]/i, oa2 = ll2([["a", "z"]], false, true), aa2 = function(e7) {
      return mc2.character(e7);
    }, sa2 = ul2("digit"), la2 = /^[0-9]/, ua2 = ll2([["0", "9"]], false, false), ca2 = function(e7) {
      return mc2.character(e7);
    }, ha = ul2("punctuation"), pa = /^[.,;:*\/()!?=+<>]/, da = ll2([".", ",", ";", ":", "*", "/", "(", ")", "!", "?", "=", "+", "<", ">"], false, false), ma = function(e7) {
      return mc2.character(e7);
    }, ga = ul2("quotes"), fa = /^[`']/, ba = ll2(["`", "'"], false, false), ya = function(e7) {
      return mc2.textquote(e7);
    }, va = ul2("left bracket"), xa = function(e7) {
      return mc2.character(e7);
    }, wa = ul2("right bracket"), ka = ul2("utf8 char"), Aa = function(e7) {
      return mc2.character(e7);
    }, _a = ul2("hyphen"), Sa = function() {
      return mc2.hyphen();
    }, qa = ul2("ligature"), Ca = "ffi", za2 = sl2("ffi", false), Ta2 = "ffl", Ma2 = sl2("ffl", false), Ea2 = "ff", Da2 = sl2("ff", false), La2 = "fi", Ba2 = sl2("fi", false), Na2 = "fl", Oa2 = sl2("fl", false), Fa2 = "---", Ra2 = sl2("---", false), Ha2 = "--", Va2 = sl2("--", false), Ia2 = "``", Pa2 = sl2("``", false), ja2 = "''", Ga2 = sl2("''", false), Ua2 = "!´", Ya2 = sl2("!´", false), Xa2 = "?´", Wa2 = sl2("?´", false), $a2 = "<<", Za2 = sl2("<<", false), Ja2 = ">>", Ka2 = sl2(">>", false), Qa2 = function(e7) {
      return mc2.ligature(e7);
    }, es2 = ul2("control symbol"), ts2 = /^[$%#&{}_\-,\/@]/, rs2 = ll2(["$", "%", "#", "&", "{", "}", "_", "-", ",", "/", "@"], false, false), ns2 = function(e7) {
      return mc2.controlSymbol(e7);
    }, is2 = ul2("symbol macro"), os2 = function(e7) {
      return mc2.hasSymbol(e7);
    }, as2 = function(e7) {
      return mc2.symbol(e7);
    }, ss2 = ul2("diacritic macro"), ls2 = function(e7) {
      return mc2.hasDiacritic(e7);
    }, us2 = function(e7, t3, r3) {
      return mc2.diacritic(e7, t3) + (r3 || "");
    }, cs2 = function(e7, t3) {
      return mc2.diacritic(e7, t3);
    }, hs2 = function(e7, t3) {
      return t3;
    }, ps2 = "symbol", ds2 = sl2("symbol", false), ms2 = function(e7) {
      return String.fromCharCode(e7);
    }, gs2 = "char", fs2 = sl2("char", false), bs2 = "^^^^", ys2 = sl2("^^^^", false), vs2 = "^^", xs2 = sl2("^^", false), ws2 = function(e7) {
      return e7 = e7.charCodeAt(0), String.fromCharCode(e7 < 64 ? e7 + 64 : e7 - 64);
    }, ks2 = function(e7) {
      return parseInt(e7, 10);
    }, As2 = function(e7) {
      return parseInt(e7, 8);
    }, _s2 = '"', Ss2 = sl2('"', false), qs2 = function(e7) {
      return e7;
    }, Cs2 = ul2("8bit hex value"), zs2 = function(e7) {
      return parseInt(e7, 16);
    }, Ts2 = ul2("16bit hex value"), Ms2 = ul2("integer value"), Es2 = ul2("octal value"), Ds2 = /^[0-7]/, Ls2 = ll2([["0", "7"]], false, false), Bs2 = ul2("hex digit"), Ns2 = /^[a-f0-9]/i, Os2 = ll2([["a", "f"], ["0", "9"]], false, true), Fs2 = ul2("float value"), Rs2 = /^[+\-]/, Hs2 = ll2(["+", "-"], false, false), Vs2 = function(e7) {
      return parseFloat(e7);
    }, Is2 = "the", Ps2 = sl2("the", false), js2 = function(e7) {
      return mc2.hasCounter(e7);
    }, Gs2 = function(e7) {
      return mc2.createText("" + mc2.counter(e7));
    }, Us2 = function(e7) {
      return mc2.theLength(e7);
    }, Ys2 = function(e7) {
      return e7;
    }, Xs2 = "showthe", Ws2 = sl2("showthe", false), $s2 = function(e7) {
      console.log(mc2.counter(e7));
    }, Zs2 = function(e7) {
      console.log(mc2.length(e7));
    }, Js2 = "message", Ks2 = sl2("message", false), Qs2 = function(e7) {
      console.log(e7.textContent);
    }, el2 = 0, tl2 = 0, rl2 = [{ line: 1, column: 1 }], nl2 = 0, il2 = [], ol2 = 0;
    if ("startRule" in r2) {
      if (!(r2.startRule in o2)) throw new Error(`Can't start parsing from rule "` + r2.startRule + '".');
      a2 = o2[r2.startRule];
    }
    function al2(t3, r3) {
      throw (function(t4, r4) {
        return new e6(t4, null, null, r4);
      })(t3, r3 = void 0 !== r3 ? r3 : hl2(tl2, el2));
    }
    function sl2(e7, t3) {
      return { type: "literal", text: e7, ignoreCase: t3 };
    }
    function ll2(e7, t3, r3) {
      return { type: "class", parts: e7, inverted: t3, ignoreCase: r3 };
    }
    function ul2(e7) {
      return { type: "other", description: e7 };
    }
    function cl2(e7) {
      var r3, n3 = rl2[e7];
      if (n3) return n3;
      for (r3 = e7 - 1; !rl2[r3]; ) r3--;
      for (n3 = { line: (n3 = rl2[r3]).line, column: n3.column }; r3 < e7; ) 10 === t2.charCodeAt(r3) ? (n3.line++, n3.column = 1) : n3.column++, r3++;
      return rl2[e7] = n3, n3;
    }
    function hl2(e7, t3) {
      var r3 = cl2(e7), n3 = cl2(t3);
      return { start: { offset: e7, line: r3.line, column: r3.column }, end: { offset: t3, line: n3.line, column: n3.column } };
    }
    function pl2(e7) {
      el2 < nl2 || (el2 > nl2 && (nl2 = el2, il2 = []), il2.push(e7));
    }
    function dl2() {
      var e7, r3, n3, o3, a3, m3, g3, f2, b3;
      if (e7 = el2, r3 = el2, ol2++, n3 = ml2(), ol2--, n3 !== i2 ? (el2 = r3, r3 = void 0) : r3 = i2, r3 !== i2) {
        for (n3 = [], o3 = el2, (a3 = Wu2()) !== i2 && (m3 = Ou2()) !== i2 ? (g3 = el2, ol2++, f2 = ql2(), ol2--, f2 !== i2 ? (el2 = g3, g3 = void 0) : g3 = i2, g3 === i2 && (g3 = el2, ol2++, f2 = _l2(), ol2--, f2 !== i2 ? (el2 = g3, g3 = void 0) : g3 = i2), g3 !== i2 && (f2 = zl2()) !== i2 ? o3 = a3 = [a3, m3, g3, f2] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, (a3 = Wu2()) !== i2 && (m3 = Ou2()) !== i2 ? (g3 = el2, ol2++, f2 = ql2(), ol2--, f2 !== i2 ? (el2 = g3, g3 = void 0) : g3 = i2, g3 === i2 && (g3 = el2, ol2++, f2 = _l2(), ol2--, f2 !== i2 ? (el2 = g3, g3 = void 0) : g3 = i2), g3 !== i2 && (f2 = zl2()) !== i2 ? o3 = a3 = [a3, m3, g3, f2] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2);
        if (n3 !== i2) if ((o3 = Wu2()) !== i2) if (a3 = (function() {
          var e8, r4, n4, o4, a4, s3, l3;
          e8 = el2, r4 = Ou2(), r4 !== i2 && (n4 = Du2()) !== i2 && (o4 = Xu2()) !== i2 && (a4 = Fu2()) !== i2 ? (t2.substr(el2, 8) === p2 ? (s3 = p2, el2 += 8) : (s3 = i2, 0 === ol2 && pl2(d2)), s3 !== i2 && (l3 = Ru2()) !== i2 ? e8 = r4 = [r4, n4, o4, a4, s3, l3] : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
          return e8;
        })(), a3 === i2 && (tl2 = el2, a3 = (a3 = s2()) ? void 0 : i2), a3 !== i2) if ((m3 = fl2()) !== i2) if ((g3 = gl2()) === i2 && (tl2 = el2, g3 = (g3 = l2()) ? void 0 : i2), g3 !== i2) {
          for (f2 = [], t2.length > el2 ? (b3 = t2.charAt(el2), el2++) : (b3 = i2, 0 === ol2 && pl2(u2)); b3 !== i2; ) f2.push(b3), t2.length > el2 ? (b3 = t2.charAt(el2), el2++) : (b3 = i2, 0 === ol2 && pl2(u2));
          f2 !== i2 && (b3 = ju2()) !== i2 ? (tl2 = e7, e7 = r3 = c2()) : (el2 = e7, e7 = i2);
        } else el2 = e7, e7 = i2;
        else el2 = e7, e7 = i2;
        else el2 = e7, e7 = i2;
        else el2 = e7, e7 = i2;
        else el2 = e7, e7 = i2;
      } else el2 = e7, e7 = i2;
      return e7 === i2 && (e7 = el2, r3 = el2, ol2++, n3 = ml2(), ol2--, n3 === i2 ? r3 = void 0 : (el2 = r3, r3 = i2), r3 !== i2 ? (tl2 = el2, (n3 = (n3 = h2()) ? void 0 : i2) !== i2 && (o3 = fl2()) !== i2 && (a3 = ju2()) !== i2 ? (tl2 = e7, e7 = r3 = c2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)), e7;
    }
    function ml2() {
      var e7, t3, r3, n3, o3;
      return e7 = el2, (t3 = Wu2()) !== i2 && (r3 = Ou2()) !== i2 ? (n3 = el2, ol2++, o3 = _l2(), ol2--, o3 !== i2 ? (el2 = n3, n3 = void 0) : n3 = i2, n3 !== i2 ? e7 = t3 = [t3, r3, n3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function gl2() {
      var e7, r3, n3, o3, a3, s3, l3;
      return e7 = el2, (r3 = Ou2()) !== i2 && (n3 = Lu2()) !== i2 && (o3 = Xu2()) !== i2 && (a3 = Fu2()) !== i2 ? (t2.substr(el2, 8) === p2 ? (s3 = p2, el2 += 8) : (s3 = i2, 0 === ol2 && pl2(d2)), s3 !== i2 && (l3 = Ru2()) !== i2 ? e7 = r3 = [r3, n3, o3, a3, s3, l3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function fl2() {
      var e7, t3, r3;
      if (e7 = el2, tl2 = el2, (m2() ? void 0 : i2) !== i2) if (Wu2() !== i2) {
        for (t3 = [], r3 = bl2(); r3 !== i2; ) t3.push(r3), r3 = bl2();
        t3 !== i2 && (r3 = Wu2()) !== i2 ? (tl2 = e7, e7 = g2(t3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function bl2() {
      var e7, t3, r3, n3, o3, a3;
      if ((e7 = Al2()) === i2) {
        for (e7 = el2, t3 = [], r3 = el2, n3 = el2, (o3 = Ou2()) !== i2 && (a3 = Nu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), n3 === i2 && (n3 = null), n3 !== i2 && (o3 = Zu2()) !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2); r3 !== i2; ) t3.push(r3), r3 = el2, n3 = el2, (o3 = Ou2()) !== i2 && (a3 = Nu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), n3 === i2 && (n3 = null), n3 !== i2 && (o3 = Zu2()) !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2);
        if (t3 !== i2) if ((r3 = Xu2()) !== i2) if (n3 = el2, (o3 = Ou2()) !== i2 && (a3 = Nu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), n3 === i2 && (n3 = null), n3 !== i2) {
          if (o3 = [], (a3 = xl2()) !== i2) for (; a3 !== i2; ) o3.push(a3), a3 = xl2();
          else o3 = i2;
          o3 !== i2 ? ((a3 = Zu2()) === i2 && (a3 = null), a3 !== i2 ? (tl2 = e7, e7 = t3 = b2(t3, n3, o3, a3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2);
        } else el2 = e7, e7 = i2;
        else el2 = e7, e7 = i2;
        else el2 = e7, e7 = i2;
      }
      return e7;
    }
    function yl2() {
      var e7, t3;
      return (e7 = xl2()) === i2 && (e7 = Al2()) === i2 && (e7 = el2, (t3 = Zu2()) !== i2 && (tl2 = e7, t3 = y2()), e7 = t3), e7;
    }
    function vl2() {
      var e7, t3;
      return e7 = el2, (t3 = Ju2()) !== i2 && (tl2 = e7, t3 = v2()), (e7 = t3) === i2 && (e7 = el2, (t3 = Zu2()) !== i2 && (tl2 = e7, t3 = x2()), (e7 = t3) === i2 && (e7 = xl2())), e7;
    }
    function xl2() {
      var e7, r3, n3, o3, a3;
      if (ol2++, e7 = el2, r3 = [], (n3 = ac2()) === i2 && (n3 = wl2()) === i2 && (n3 = el2, o3 = el2, ol2++, a3 = Zu2(), ol2--, a3 === i2 ? o3 = void 0 : (el2 = o3, o3 = i2), o3 !== i2 && (a3 = Yu2()) !== i2 ? (tl2 = n3, n3 = o3 = v2()) : (el2 = n3, n3 = i2)), n3 !== i2) for (; n3 !== i2; ) r3.push(n3), (n3 = ac2()) === i2 && (n3 = wl2()) === i2 && (n3 = el2, o3 = el2, ol2++, a3 = Zu2(), ol2--, a3 === i2 ? o3 = void 0 : (el2 = o3, o3 = i2), o3 !== i2 && (a3 = Yu2()) !== i2 ? (tl2 = n3, n3 = o3 = v2()) : (el2 = n3, n3 = i2));
      else r3 = i2;
      return r3 !== i2 && (tl2 = e7, r3 = k2(r3)), (e7 = r3) === i2 && (e7 = Ju2()) === i2 && (e7 = el2, r3 = el2, n3 = el2, ol2++, o3 = Ku2(), ol2--, o3 !== i2 ? (el2 = n3, n3 = void 0) : n3 = i2, n3 !== i2 && (o3 = Xu2()) !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2), r3 === i2 && (r3 = null), r3 !== i2 ? (n3 = (function() {
        var e8, r4, n4, o4, a4, s3;
        e8 = kl2(), e8 === i2 && (e8 = el2, Ou2() !== i2 ? (r4 = el2, n4 = el2, ol2++, o4 = (function() {
          var e9, t3, r5;
          e9 = el2, t3 = Tl2(), t3 !== i2 ? (tl2 = el2, (r5 = (r5 = N2(t3)) ? void 0 : i2) !== i2 ? e9 = t3 = [t3, r5] : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          return e9;
        })(), ol2--, o4 !== i2 ? (el2 = n4, n4 = void 0) : n4 = i2, n4 !== i2 && (o4 = zl2()) !== i2 ? (tl2 = r4, r4 = n4 = A2(o4)) : (el2 = r4, r4 = i2), r4 === i2 && (r4 = el2, n4 = el2, ol2++, o4 = (function() {
          var e9, t3, r5, n5, o5;
          e9 = el2, t3 = Du2(), t3 !== i2 && (r5 = Fu2()) !== i2 && (n5 = Tl2()) !== i2 ? (tl2 = el2, (o5 = (o5 = F2(n5)) ? void 0 : i2) !== i2 ? e9 = t3 = [t3, r5, n5, o5] : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          return e9;
        })(), ol2--, o4 !== i2 ? (el2 = n4, n4 = void 0) : n4 = i2, n4 !== i2 ? (o4 = (function() {
          var e9, r5, n5, o5, a5, s4, l3, c3;
          if (e9 = el2, r5 = Su2(), r5 !== i2) if (Dl2() !== i2) if (n5 = el2, o5 = el2, ol2++, t2.length > el2 ? (a5 = t2.charAt(el2), el2++) : (a5 = i2, 0 === ol2 && pl2(u2)), ol2--, a5 !== i2 ? (el2 = o5, o5 = void 0) : o5 = i2, o5 !== i2 && (tl2 = n5, o5 = xi2(r5)), (n5 = o5) !== i2) if (o5 = el2, (a5 = $u2()) === i2 && (a5 = null), a5 !== i2 && (tl2 = o5, a5 = wi2(r5, n5, a5)), (o5 = a5) !== i2) {
            for (a5 = [], s4 = yl2(); s4 !== i2; ) a5.push(s4), s4 = yl2();
            a5 !== i2 && (s4 = qu2()) !== i2 ? (l3 = el2, (c3 = $u2()) === i2 && (c3 = null), c3 !== i2 && (tl2 = l3, c3 = ki2(r5, n5, o5, a5, s4, c3)), (l3 = c3) !== i2 ? (tl2 = e9, e9 = r5 = Ai2(r5, n5, o5, a5, s4, l3)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          return e9;
        })(), o4 !== i2 ? (tl2 = r4, r4 = n4 = E2(o4)) : (el2 = r4, r4 = i2)) : (el2 = r4, r4 = i2), r4 === i2 && (r4 = Nu2()) === i2 && (r4 = (function() {
          var e9, r5, n5, o5, a5;
          e9 = el2, r5 = el2, t2.substr(el2, 5) === ti2 ? (n5 = ti2, el2 += 5) : (n5 = i2, 0 === ol2 && pl2(ri2));
          n5 === i2 && (t2.substr(el2, 3) === ni2 ? (n5 = ni2, el2 += 3) : (n5 = i2, 0 === ol2 && pl2(ii2)), n5 === i2 && (t2.substr(el2, 3) === oi2 ? (n5 = oi2, el2 += 3) : (n5 = i2, 0 === ol2 && pl2(ai2))));
          r5 = n5 !== i2 ? t2.substring(r5, el2) : n5;
          r5 !== i2 ? (t2.substr(el2, 4) === si2 ? (n5 = si2, el2 += 4) : (n5 = i2, 0 === ol2 && pl2(li2)), n5 !== i2 ? (o5 = el2, ol2++, a5 = tc2(), ol2--, a5 === i2 ? o5 = void 0 : (el2 = o5, o5 = i2), o5 !== i2 && (a5 = Xu2()) !== i2 ? (tl2 = e9, e9 = r5 = ui2(r5)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          return e9;
        })(), r4 === i2 && (r4 = (function() {
          var e9, r5, n5, o5;
          e9 = el2, t2.substr(el2, 6) === Jn2 ? (r5 = Jn2, el2 += 6) : (r5 = i2, 0 === ol2 && pl2(Kn2));
          r5 !== i2 ? (42 === t2.charCodeAt(el2) ? (n5 = ut2, el2++) : (n5 = i2, 0 === ol2 && pl2(ct2)), n5 === i2 && (n5 = null), n5 !== i2 && (o5 = Gl2()) !== i2 ? (tl2 = e9, e9 = r5 = Qn2(o5)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          return e9;
        })(), r4 === i2 && (r4 = (function() {
          var e9, r5, n5, o5, a5, s4, l3;
          e9 = el2, t2.substr(el2, 3) === Is2 ? (r5 = Is2, el2 += 3) : (r5 = i2, 0 === ol2 && pl2(Ps2));
          r5 !== i2 ? (n5 = el2, ol2++, o5 = tc2(), ol2--, o5 === i2 ? n5 = void 0 : (el2 = n5, n5 = i2), n5 !== i2 && (o5 = Xu2()) !== i2 ? (a5 = el2, (s4 = iu2()) !== i2 ? (tl2 = el2, (l3 = (l3 = js2(s4)) ? void 0 : i2) !== i2 ? (tl2 = a5, a5 = s4 = Gs2(s4)) : (el2 = a5, a5 = i2)) : (el2 = a5, a5 = i2), a5 === i2 && (a5 = el2, (s4 = Ou2()) !== i2 && (l3 = Tl2()) !== i2 && Xu2() !== i2 ? (tl2 = a5, a5 = s4 = Us2(l3)) : (el2 = a5, a5 = i2)), a5 !== i2 ? (tl2 = e9, e9 = r5 = Ys2(a5)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          return e9;
        })(), r4 === i2 && (r4 = (function() {
          var e9, r5, n5, o5, a5, s4, l3, c3, h3, p3, d3;
          e9 = el2, t2.substr(el2, 4) === hi2 ? (r5 = hi2, el2 += 4) : (r5 = i2, 0 === ol2 && pl2(pi2));
          if (r5 !== i2) if (42 === t2.charCodeAt(el2) ? (n5 = ut2, el2++) : (n5 = i2, 0 === ol2 && pl2(ct2)), n5 === i2 && (n5 = null), n5 !== i2) if (Xu2() !== i2) if (o5 = el2, ol2++, a5 = tc2(), ol2--, a5 === i2 ? o5 = void 0 : (el2 = o5, o5 = i2), o5 !== i2) if (t2.length > el2 ? (a5 = t2.charAt(el2), el2++) : (a5 = i2, 0 === ol2 && pl2(u2)), a5 !== i2) {
            for (s4 = el2, l3 = [], c3 = el2, h3 = el2, ol2++, p3 = Gu2(), ol2--, p3 === i2 ? h3 = void 0 : (el2 = h3, h3 = i2), h3 !== i2 ? (t2.length > el2 ? (p3 = t2.charAt(el2), el2++) : (p3 = i2, 0 === ol2 && pl2(u2)), p3 !== i2 ? (tl2 = el2, (d3 = (d3 = di2(n5, a5, p3)) ? i2 : void 0) !== i2 ? c3 = h3 = [h3, p3, d3] : (el2 = c3, c3 = i2)) : (el2 = c3, c3 = i2)) : (el2 = c3, c3 = i2); c3 !== i2; ) l3.push(c3), c3 = el2, h3 = el2, ol2++, p3 = Gu2(), ol2--, p3 === i2 ? h3 = void 0 : (el2 = h3, h3 = i2), h3 !== i2 ? (t2.length > el2 ? (p3 = t2.charAt(el2), el2++) : (p3 = i2, 0 === ol2 && pl2(u2)), p3 !== i2 ? (tl2 = el2, (d3 = (d3 = di2(n5, a5, p3)) ? i2 : void 0) !== i2 ? c3 = h3 = [h3, p3, d3] : (el2 = c3, c3 = i2)) : (el2 = c3, c3 = i2)) : (el2 = c3, c3 = i2);
            (s4 = l3 !== i2 ? t2.substring(s4, el2) : l3) !== i2 ? (t2.length > el2 ? (l3 = t2.charAt(el2), el2++) : (l3 = i2, 0 === ol2 && pl2(u2)), l3 !== i2 ? (tl2 = e9, e9 = r5 = mi2(n5, a5, s4, l3)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          return e9;
        })(), r4 === i2 && (r4 = el2, n4 = el2, ol2++, o4 = _l2(), ol2--, o4 !== i2 ? (el2 = n4, n4 = void 0) : n4 = i2, n4 !== i2 ? (o4 = (function() {
          var e9, t3;
          e9 = el2, t3 = Tl2(), t3 !== i2 && (tl2 = e9, t3 = V2(t3));
          return e9 = t3, e9;
        })(), o4 !== i2 ? r4 = n4 = [n4, o4] : (el2 = r4, r4 = i2)) : (el2 = r4, r4 = i2), r4 === i2 && (r4 = el2, n4 = el2, ol2++, o4 = Du2(), ol2--, o4 === i2 ? n4 = void 0 : (el2 = n4, n4 = i2), n4 !== i2 ? (o4 = el2, ol2++, a4 = Lu2(), ol2--, a4 === i2 ? o4 = void 0 : (el2 = o4, o4 = i2), o4 !== i2 ? (a4 = el2, ol2++, s3 = Sl2(), ol2--, s3 === i2 ? a4 = void 0 : (el2 = a4, a4 = i2), a4 !== i2 ? (s3 = (function() {
          var e9, t3;
          e9 = el2, t3 = Tl2(), t3 !== i2 && (tl2 = e9, t3 = I2(t3));
          return e9 = t3, e9;
        })(), s3 !== i2 ? r4 = n4 = [n4, o4, a4, s3] : (el2 = r4, r4 = i2)) : (el2 = r4, r4 = i2)) : (el2 = r4, r4 = i2)) : (el2 = r4, r4 = i2)))))))), r4 !== i2 ? (tl2 = e8, e8 = A2(r4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2));
        return e8;
      })(), n3 !== i2 ? (tl2 = e7, e7 = r3 = A2(n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = (function() {
        var e8;
        e8 = (function() {
          var e9, r4, n4, o4, a4, s3;
          if (e9 = el2, r4 = Hu2(), r4 !== i2) {
            if (n4 = el2, o4 = [], (a4 = Eu2()) !== i2) for (; a4 !== i2; ) o4.push(a4), a4 = Eu2();
            else o4 = i2;
            (n4 = o4 !== i2 ? t2.substring(n4, el2) : o4) !== i2 && (o4 = Hu2()) !== i2 ? (tl2 = e9, e9 = r4 = Ii2(n4)) : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          if (e9 === i2) if (e9 = el2, (r4 = Ou2()) !== i2) if (40 === t2.charCodeAt(el2) ? (n4 = $t2, el2++) : (n4 = i2, 0 === ol2 && pl2(Zt2)), n4 !== i2) {
            if (o4 = el2, a4 = [], (s3 = Eu2()) !== i2) for (; s3 !== i2; ) a4.push(s3), s3 = Eu2();
            else a4 = i2;
            (o4 = a4 !== i2 ? t2.substring(o4, el2) : a4) !== i2 && (a4 = Ou2()) !== i2 ? (41 === t2.charCodeAt(el2) ? (s3 = Jt2, el2++) : (s3 = i2, 0 === ol2 && pl2(Kt2)), s3 !== i2 ? (tl2 = e9, e9 = r4 = Ii2(o4)) : (el2 = e9, e9 = i2)) : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          return e9;
        })(), e8 === i2 && (e8 = (function() {
          var e9, r4, n4, o4, a4;
          if (e9 = el2, r4 = Hu2(), r4 !== i2) if (Hu2() !== i2) {
            if (n4 = el2, o4 = [], (a4 = Eu2()) !== i2) for (; a4 !== i2; ) o4.push(a4), a4 = Eu2();
            else o4 = i2;
            (n4 = o4 !== i2 ? t2.substring(n4, el2) : o4) !== i2 && (o4 = Hu2()) !== i2 && (a4 = Hu2()) !== i2 ? (tl2 = e9, e9 = r4 = Pi2(n4)) : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          if (e9 === i2) if (e9 = el2, (r4 = Ou2()) !== i2) if (nc2() !== i2) {
            if (n4 = el2, o4 = [], (a4 = Eu2()) !== i2) for (; a4 !== i2; ) o4.push(a4), a4 = Eu2();
            else o4 = i2;
            (n4 = o4 !== i2 ? t2.substring(n4, el2) : o4) !== i2 && (o4 = Ou2()) !== i2 && (a4 = ic2()) !== i2 ? (tl2 = e9, e9 = r4 = Pi2(n4)) : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          return e9;
        })());
        return e8;
      })(), e7 === i2 && (e7 = el2, (r3 = Fu2()) !== i2 ? (tl2 = el2, (n3 = (n3 = _2()) ? void 0 : i2) !== i2 ? ((o3 = $u2()) === i2 && (o3 = null), o3 !== i2 ? (tl2 = e7, e7 = r3 = S2(o3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = el2, (r3 = Ru2()) !== i2 ? (tl2 = el2, (n3 = (n3 = q2()) ? void 0 : i2) !== i2 ? ((o3 = $u2()) === i2 && (o3 = null), o3 !== i2 ? (tl2 = e7, e7 = r3 = S2(o3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2))))), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(w2)), e7;
    }
    function wl2() {
      var e7, r3, n3, o3;
      return ol2++, (e7 = tc2()) === i2 && (e7 = el2, (r3 = $u2()) !== i2 ? (n3 = el2, ol2++, o3 = Ku2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 ? (tl2 = e7, e7 = r3 = z2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = (function() {
        var e8, r4;
        ol2++, e8 = el2, 45 === t2.charCodeAt(el2) ? (r4 = Sr2, el2++) : (r4 = i2, 0 === ol2 && pl2(qr2));
        r4 !== i2 && (tl2 = e8, r4 = Sa());
        e8 = r4, ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(_a));
        return e8;
      })(), e7 === i2 && (e7 = rc2()) === i2 && (e7 = (function() {
        var e8, r4;
        ol2++, e8 = el2, pa.test(t2.charAt(el2)) ? (r4 = t2.charAt(el2), el2++) : (r4 = i2, 0 === ol2 && pl2(da));
        r4 !== i2 && (tl2 = e8, r4 = ma(r4));
        e8 = r4, ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(ha));
        return e8;
      })(), e7 === i2 && (e7 = (function() {
        var e8, r4;
        ol2++, e8 = el2, fa.test(t2.charAt(el2)) ? (r4 = t2.charAt(el2), el2++) : (r4 = i2, 0 === ol2 && pl2(ba));
        r4 !== i2 && (tl2 = e8, r4 = ya(r4));
        e8 = r4, ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(ga));
        return e8;
      })(), e7 === i2 && (e7 = nc2()) === i2 && (e7 = el2, (r3 = ic2()) !== i2 ? (tl2 = el2, (n3 = (n3 = T2()) ? void 0 : i2) !== i2 ? (tl2 = e7, e7 = r3 = M2(r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = (function() {
        var e8, r4;
        ol2++, e8 = el2, 126 === t2.charCodeAt(el2) ? (r4 = Uo2, el2++) : (r4 = i2, 0 === ol2 && pl2(Yo2));
        r4 !== i2 && (tl2 = e8, r4 = Xo2());
        e8 = r4, ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(Go2));
        return e8;
      })(), e7 === i2 && (e7 = (function() {
        var e8, t3, r4, n4, o4, a3;
        ol2++, e8 = el2, t3 = Ou2(), t3 !== i2 ? (r4 = el2, n4 = el2, ol2++, o4 = Gu2(), ol2--, o4 !== i2 ? (el2 = n4, n4 = void 0) : n4 = i2, n4 !== i2 ? (o4 = el2, ol2++, a3 = Zu2(), ol2--, a3 !== i2 ? (el2 = o4, o4 = void 0) : o4 = i2, o4 !== i2 ? r4 = n4 = [n4, o4] : (el2 = r4, r4 = i2)) : (el2 = r4, r4 = i2), r4 === i2 && (r4 = Gu2()) === i2 && (r4 = Uu2()), r4 !== i2 ? (tl2 = e8, e8 = t3 = Po2()) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        ol2--, e8 === i2 && (t3 = i2, 0 === ol2 && pl2(jo2));
        return e8;
      })(), e7 === i2 && (e7 = (function() {
        var e8, r4, n4, o4, a3, s3, l3, c3, h3;
        ol2++, e8 = el2, r4 = Ou2(), r4 !== i2 ? (n4 = el2, o4 = el2, (a3 = tc2()) !== i2 ? (s3 = el2, ol2++, l3 = tc2(), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 ? o4 = a3 = [a3, s3] : (el2 = o4, o4 = i2)) : (el2 = o4, o4 = i2), o4 === i2 && (o4 = el2, a3 = el2, ol2++, s3 = tc2(), ol2--, s3 === i2 ? a3 = void 0 : (el2 = a3, a3 = i2), a3 !== i2 ? (t2.length > el2 ? (s3 = t2.charAt(el2), el2++) : (s3 = i2, 0 === ol2 && pl2(u2)), s3 !== i2 ? o4 = a3 = [a3, s3] : (el2 = o4, o4 = i2)) : (el2 = o4, o4 = i2)), (n4 = o4 !== i2 ? t2.substring(n4, el2) : o4) !== i2 ? (tl2 = el2, (o4 = (o4 = ls2(n4)) ? void 0 : i2) !== i2 && (a3 = Xu2()) !== i2 ? (s3 = el2, (l3 = Fu2()) !== i2 ? ((c3 = wl2()) === i2 && (c3 = null), c3 !== i2 && Ru2() !== i2 ? ((h3 = $u2()) === i2 && (h3 = null), h3 !== i2 ? (tl2 = s3, s3 = l3 = us2(n4, c3, h3)) : (el2 = s3, s3 = i2)) : (el2 = s3, s3 = i2)) : (el2 = s3, s3 = i2), s3 === i2 && (s3 = el2, (l3 = wl2()) !== i2 && (tl2 = s3, l3 = cs2(n4, l3)), s3 = l3), s3 !== i2 ? (tl2 = e8, e8 = r4 = hs2(n4, s3)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(ss2));
        return e8;
      })(), e7 === i2 && (e7 = (function() {
        var e8, r4, n4;
        ol2++, e8 = el2, r4 = Ou2(), r4 !== i2 ? (ts2.test(t2.charAt(el2)) ? (n4 = t2.charAt(el2), el2++) : (n4 = i2, 0 === ol2 && pl2(rs2)), n4 !== i2 ? (tl2 = e8, e8 = r4 = ns2(n4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(es2));
        return e8;
      })(), e7 === i2 && (e7 = (function() {
        var e8, t3, r4;
        ol2++, e8 = el2, t3 = Ou2(), t3 !== i2 && (r4 = Tl2()) !== i2 ? (tl2 = el2, (os2(r4) ? void 0 : i2) !== i2 && Xu2() !== i2 ? (tl2 = e8, e8 = t3 = as2(r4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        ol2--, e8 === i2 && (t3 = i2, 0 === ol2 && pl2(is2));
        return e8;
      })(), e7 === i2 && (e7 = (function() {
        var e8, r4, n4, o4, a3;
        e8 = el2, r4 = Ou2(), r4 !== i2 ? (t2.substr(el2, 6) === ps2 ? (n4 = ps2, el2 += 6) : (n4 = i2, 0 === ol2 && pl2(ds2)), n4 !== i2 && (o4 = Fu2()) !== i2 && Xu2() !== i2 && (a3 = sc2()) !== i2 && Xu2() !== i2 && Ru2() !== i2 ? (tl2 = e8, e8 = r4 = ms2(a3)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        e8 === i2 && (e8 = el2, (r4 = Ou2()) !== i2 ? (t2.substr(el2, 4) === gs2 ? (n4 = gs2, el2 += 4) : (n4 = i2, 0 === ol2 && pl2(fs2)), n4 !== i2 && (o4 = sc2()) !== i2 ? (tl2 = e8, e8 = r4 = ms2(o4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2), e8 === i2 && (e8 = el2, t2.substr(el2, 4) === bs2 ? (r4 = bs2, el2 += 4) : (r4 = i2, 0 === ol2 && pl2(ys2)), r4 !== i2 && (n4 = uc2()) !== i2 ? (tl2 = e8, e8 = r4 = ms2(n4)) : (el2 = e8, e8 = i2), e8 === i2 && (e8 = el2, t2.substr(el2, 2) === vs2 ? (r4 = vs2, el2 += 2) : (r4 = i2, 0 === ol2 && pl2(xs2)), r4 !== i2 && (n4 = lc2()) !== i2 ? (tl2 = e8, e8 = r4 = ms2(n4)) : (el2 = e8, e8 = i2), e8 === i2 && (e8 = el2, t2.substr(el2, 2) === vs2 ? (r4 = vs2, el2 += 2) : (r4 = i2, 0 === ol2 && pl2(xs2)), r4 !== i2 ? (t2.length > el2 ? (n4 = t2.charAt(el2), el2++) : (n4 = i2, 0 === ol2 && pl2(u2)), n4 !== i2 ? (tl2 = e8, e8 = r4 = ws2(n4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2)))));
        return e8;
      })(), e7 === i2 && (e7 = oc2())))))))))))), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(C2)), e7;
    }
    function kl2() {
      var e7, r3, n3, o3;
      return e7 = el2, Ou2() !== i2 ? (r3 = el2, n3 = el2, ol2++, o3 = ql2(), ol2--, o3 !== i2 ? (el2 = n3, n3 = void 0) : n3 = i2, n3 !== i2 && (o3 = zl2()) !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2), r3 === i2 && (r3 = (function() {
        var e8, r4, n4, o4, a3, s3, l3;
        e8 = el2, t2.substr(el2, 7) === Xs2 ? (r4 = Xs2, el2 += 7) : (r4 = i2, 0 === ol2 && pl2(Ws2));
        r4 !== i2 ? (n4 = el2, ol2++, o4 = tc2(), ol2--, o4 === i2 ? n4 = void 0 : (el2 = n4, n4 = i2), n4 !== i2 && (o4 = Xu2()) !== i2 ? (a3 = el2, (s3 = iu2()) !== i2 ? (tl2 = el2, (l3 = (l3 = js2(s3)) ? void 0 : i2) !== i2 ? (tl2 = a3, a3 = s3 = $s2(s3)) : (el2 = a3, a3 = i2)) : (el2 = a3, a3 = i2), a3 === i2 && (a3 = el2, (s3 = Ou2()) !== i2 && (l3 = Tl2()) !== i2 && Xu2() !== i2 ? (tl2 = a3, a3 = s3 = Zs2(l3)) : (el2 = a3, a3 = i2)), a3 !== i2 ? e8 = r4 = [r4, n4, o4, a3] : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        e8 === i2 && (e8 = el2, t2.substr(el2, 7) === Js2 ? (r4 = Js2, el2 += 7) : (r4 = i2, 0 === ol2 && pl2(Ks2)), r4 !== i2 && (n4 = eu2()) !== i2 ? (tl2 = e8, e8 = r4 = Qs2(n4)) : (el2 = e8, e8 = i2));
        return e8;
      })()), r3 !== i2 ? (tl2 = e7, e7 = v2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Al2() {
      var e7, r3, n3, o3;
      return e7 = el2, Wu2() !== i2 && kl2() !== i2 ? (tl2 = e7, e7 = v2()) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = el2, Wu2() !== i2 && Ou2() !== i2 ? (r3 = el2, n3 = el2, ol2++, o3 = Sl2(), ol2--, o3 !== i2 ? (el2 = n3, n3 = void 0) : n3 = i2, n3 !== i2 && (o3 = zl2()) !== i2 ? (tl2 = r3, r3 = n3 = D2(o3)) : (el2 = r3, r3 = i2), r3 === i2 && (r3 = el2, n3 = el2, ol2++, o3 = Cl2(), ol2--, o3 !== i2 ? (el2 = n3, n3 = void 0) : n3 = i2, n3 !== i2 ? (o3 = (function() {
        var e8, r4, n4, o4, a3;
        if (e8 = el2, r4 = Su2(), r4 !== i2) if (tl2 = el2, (_i2() ? i2 : void 0) !== i2) if (Dl2() !== i2) if (n4 = el2, o4 = el2, ol2++, t2.length > el2 ? (a3 = t2.charAt(el2), el2++) : (a3 = i2, 0 === ol2 && pl2(u2)), ol2--, a3 !== i2 ? (el2 = o4, o4 = void 0) : o4 = i2, o4 !== i2 && (tl2 = n4, o4 = xi2(r4)), (n4 = o4) !== i2) {
          for (o4 = [], a3 = bl2(); a3 !== i2; ) o4.push(a3), a3 = bl2();
          o4 !== i2 && (a3 = qu2()) !== i2 ? (tl2 = e8, e8 = r4 = Si2(r4, n4, o4, a3)) : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        return e8;
      })(), o3 !== i2 ? (tl2 = r3, r3 = n3 = E2(o3)) : (el2 = r3, r3 = i2)) : (el2 = r3, r3 = i2), r3 === i2 && (r3 = (function() {
        var e8, r4, n4, o4;
        e8 = el2, t2.substr(el2, 6) === Jn2 ? (r4 = Jn2, el2 += 6) : (r4 = i2, 0 === ol2 && pl2(Kn2));
        r4 !== i2 ? (42 === t2.charCodeAt(el2) ? (n4 = ut2, el2++) : (n4 = i2, 0 === ol2 && pl2(ct2)), n4 === i2 && (n4 = null), n4 !== i2 && (o4 = Gl2()) !== i2 ? (tl2 = e8, e8 = r4 = ei2(o4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        return e8;
      })(), r3 === i2 && (r3 = (function() {
        var e8, r4, n4, o4, a3;
        e8 = el2, r4 = el2, t2.substr(el2, 5) === ti2 ? (n4 = ti2, el2 += 5) : (n4 = i2, 0 === ol2 && pl2(ri2));
        n4 === i2 && (t2.substr(el2, 3) === ni2 ? (n4 = ni2, el2 += 3) : (n4 = i2, 0 === ol2 && pl2(ii2)), n4 === i2 && (t2.substr(el2, 3) === oi2 ? (n4 = oi2, el2 += 3) : (n4 = i2, 0 === ol2 && pl2(ai2))));
        r4 = n4 !== i2 ? t2.substring(r4, el2) : n4;
        r4 !== i2 ? (t2.substr(el2, 4) === si2 ? (n4 = si2, el2 += 4) : (n4 = i2, 0 === ol2 && pl2(li2)), n4 !== i2 ? (o4 = el2, ol2++, a3 = tc2(), ol2--, a3 === i2 ? o4 = void 0 : (el2 = o4, o4 = i2), o4 !== i2 && (a3 = Xu2()) !== i2 ? (tl2 = e8, e8 = r4 = ci2(r4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        return e8;
      })()))), r3 !== i2 ? (tl2 = e7, e7 = A2(r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)), e7;
    }
    function _l2() {
      var e7, t3, r3;
      return e7 = el2, (t3 = Tl2()) !== i2 ? (tl2 = el2, (r3 = (r3 = L2(t3)) ? void 0 : i2) !== i2 ? e7 = t3 = [t3, r3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Sl2() {
      var e7, t3, r3;
      return e7 = el2, (t3 = Tl2()) !== i2 ? (tl2 = el2, (r3 = (r3 = B2(t3)) ? void 0 : i2) !== i2 ? e7 = t3 = [t3, r3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function ql2() {
      var e7, t3, r3;
      return e7 = el2, (t3 = Tl2()) !== i2 ? (tl2 = el2, (r3 = (r3 = O2(t3)) ? void 0 : i2) !== i2 ? e7 = t3 = [t3, r3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Cl2() {
      var e7, t3, r3, n3, o3;
      return e7 = el2, (t3 = Du2()) === i2 && (t3 = Lu2()), t3 !== i2 && (r3 = Fu2()) !== i2 && (n3 = Tl2()) !== i2 ? (tl2 = el2, (o3 = (o3 = B2(n3)) ? void 0 : i2) !== i2 ? e7 = t3 = [t3, r3, n3, o3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function zl2() {
      var e7, t3;
      return e7 = el2, (t3 = Tl2()) !== i2 && Xu2() !== i2 ? (tl2 = el2, (R2(t3) ? void 0 : i2) !== i2 && Dl2() !== i2 ? (tl2 = e7, e7 = t3 = H2(t3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Tl2() {
      var e7, r3, n3;
      if (ol2++, e7 = el2, r3 = [], (n3 = tc2()) !== i2) for (; n3 !== i2; ) r3.push(n3), n3 = tc2();
      else r3 = i2;
      return e7 = r3 !== i2 ? t2.substring(e7, el2) : r3, ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(P2)), e7;
    }
    function Ml2() {
      var e7, r3, n3, o3, a3;
      if (e7 = el2, r3 = [], (n3 = tc2()) === i2 && (n3 = rc2()) === i2 && (n3 = Uu2()) === i2 && (j2.test(t2.charAt(el2)) ? (n3 = t2.charAt(el2), el2++) : (n3 = i2, 0 === ol2 && pl2(G2)), n3 === i2 && (n3 = el2, o3 = el2, ol2++, U2.test(t2.charAt(el2)) ? (a3 = t2.charAt(el2), el2++) : (a3 = i2, 0 === ol2 && pl2(Y2)), ol2--, a3 === i2 ? o3 = void 0 : (el2 = o3, o3 = i2), o3 !== i2 && (a3 = oc2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2))), n3 !== i2) for (; n3 !== i2; ) r3.push(n3), (n3 = tc2()) === i2 && (n3 = rc2()) === i2 && (n3 = Uu2()) === i2 && (j2.test(t2.charAt(el2)) ? (n3 = t2.charAt(el2), el2++) : (n3 = i2, 0 === ol2 && pl2(G2)), n3 === i2 && (n3 = el2, o3 = el2, ol2++, U2.test(t2.charAt(el2)) ? (a3 = t2.charAt(el2), el2++) : (a3 = i2, 0 === ol2 && pl2(Y2)), ol2--, a3 === i2 ? o3 = void 0 : (el2 = o3, o3 = i2), o3 !== i2 && (a3 = oc2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2)));
      else r3 = i2;
      return e7 = r3 !== i2 ? t2.substring(e7, el2) : r3;
    }
    function El2() {
      var e7, r3, n3, o3, a3;
      return ol2++, e7 = el2, (r3 = Ml2()) !== i2 ? (n3 = el2, Xu2() !== i2 ? (61 === t2.charCodeAt(el2) ? (o3 = W2, el2++) : (o3 = i2, 0 === ol2 && pl2($2)), o3 !== i2 && Xu2() !== i2 ? ((a3 = Ml2()) === i2 && (tl2 = el2, a3 = (a3 = Z2()) ? void 0 : i2), a3 !== i2 ? (tl2 = n3, n3 = J2(r3, a3)) : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2), n3 === i2 && (n3 = null), n3 !== i2 ? (tl2 = e7, e7 = r3 = K2(r3, n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(X2)), e7;
    }
    function Dl2() {
      var e7, t3, r3, n3, o3, a3;
      for (e7 = [], t3 = el2, tl2 = el2, (r3 = (r3 = Q2()) ? void 0 : i2) !== i2 && (tl2 = t3, r3 = ee2()), (t3 = r3) === i2 && (t3 = Ll2()) === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = te2()) ? void 0 : i2) !== i2 ? ((n3 = eu2()) === i2 && (tl2 = el2, n3 = (n3 = re2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = ne2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ie2()) ? void 0 : i2) !== i2 ? ((n3 = ru2()) === i2 && (tl2 = el2, n3 = (n3 = re2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = ne2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = oe2()) ? void 0 : i2) !== i2 ? ((n3 = tu2()) === i2 && (tl2 = el2, n3 = (n3 = ae2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = se2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = le2()) ? void 0 : i2) !== i2 ? ((n3 = nu2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = ue2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ce2()) ? void 0 : i2) !== i2 ? ((n3 = Bl2()) === i2 && (tl2 = el2, n3 = (n3 = he2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = de2()) ? void 0 : i2) !== i2 ? ((n3 = Nl2()) === i2 && (tl2 = el2, n3 = (n3 = me2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ge2()) ? void 0 : i2) !== i2 ? ((n3 = Fl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = fe2()) ? void 0 : i2) !== i2 ? ((n3 = Rl2()) === i2 && (tl2 = el2, n3 = (n3 = be2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = ye2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ve2()) ? void 0 : i2) !== i2 ? ((n3 = Hl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = ye2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = xe2()) ? void 0 : i2) !== i2 ? ((n3 = Vl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = ye2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = we2()) ? void 0 : i2) !== i2 ? ((n3 = Il2()) === i2 && (tl2 = el2, n3 = (n3 = ke2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ae2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = _e2()) ? void 0 : i2) !== i2 ? ((n3 = Yl2()) === i2 && (tl2 = el2, n3 = (n3 = Se2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = qe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ce2()) ? void 0 : i2) !== i2 ? ((n3 = Xl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = qe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ze2()) ? void 0 : i2) !== i2 ? ((n3 = Gl2()) === i2 && (tl2 = el2, n3 = (n3 = Te2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Me2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ee2()) ? void 0 : i2) !== i2 ? ((n3 = Gl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Me2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = De2()) ? void 0 : i2) !== i2 ? ((n3 = Ul2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Me2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Le2()) ? void 0 : i2) !== i2 ? ((n3 = Ol2()) === i2 && (tl2 = el2, n3 = (n3 = Be2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ne2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Oe2()) ? void 0 : i2) !== i2 ? ((n3 = Ql2()) === i2 && (tl2 = el2, n3 = (n3 = Fe2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Re2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = He2()) ? void 0 : i2) !== i2 ? ((n3 = uu2()) === i2 && (tl2 = el2, n3 = (n3 = Ve2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Pe2()) ? void 0 : i2) !== i2 ? ((n3 = cu2()) === i2 && (tl2 = el2, n3 = (n3 = je2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ge2()) ? void 0 : i2) !== i2 ? ((n3 = hu2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ue2()) ? void 0 : i2) !== i2 ? ((n3 = pu2()) === i2 && (tl2 = el2, n3 = (n3 = Ye2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Xe2()) ? void 0 : i2) !== i2 ? ((n3 = du2()) === i2 && (tl2 = el2, n3 = (n3 = We2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = $e2()) ? void 0 : i2) !== i2 ? ((n3 = Zl2()) === i2 && (tl2 = el2, n3 = (n3 = Ze2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Je2()) ? void 0 : i2) !== i2 ? ((n3 = Jl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ke2()) ? void 0 : i2) !== i2 ? ((n3 = $l2()) === i2 && (tl2 = el2, n3 = (n3 = Qe2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ae2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = et2()) ? void 0 : i2) !== i2 ? ((n3 = $l2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ae2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = tt2()) ? void 0 : i2) !== i2 ? ((n3 = ku2()) === i2 && (tl2 = el2, n3 = (n3 = rt2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = nt2()) ? void 0 : i2) !== i2 && (n3 = Xu2()) !== i2 ? t3 = r3 = [r3, n3] : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = it2()) ? void 0 : i2) !== i2 && (n3 = zu2()) !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ot2()) ? void 0 : i2) !== i2 && (n3 = Tu2()) !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, r3 = el2, ol2++, n3 = el2, (o3 = Xu2()) !== i2 && (a3 = Qu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), ol2--, n3 !== i2 ? (el2 = r3, r3 = void 0) : r3 = i2, r3 !== i2 ? (tl2 = el2, (n3 = (n3 = at2()) ? void 0 : i2) !== i2 ? t3 = r3 = [r3, n3] : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, r3 = el2, ol2++, n3 = el2, (o3 = Xu2()) !== i2 && (a3 = Fu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), ol2--, n3 !== i2 ? (el2 = r3, r3 = void 0) : r3 = i2, r3 !== i2 ? (tl2 = el2, (n3 = (n3 = st2()) ? void 0 : i2) !== i2 ? t3 = r3 = [r3, n3] : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2)))))))))))))))))))))))))))))))))); t3 !== i2; ) e7.push(t3), t3 = el2, tl2 = el2, (r3 = (r3 = Q2()) ? void 0 : i2) !== i2 && (tl2 = t3, r3 = ee2()), (t3 = r3) === i2 && (t3 = Ll2()) === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = te2()) ? void 0 : i2) !== i2 ? ((n3 = eu2()) === i2 && (tl2 = el2, n3 = (n3 = re2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = ne2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ie2()) ? void 0 : i2) !== i2 ? ((n3 = ru2()) === i2 && (tl2 = el2, n3 = (n3 = re2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = ne2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = oe2()) ? void 0 : i2) !== i2 ? ((n3 = tu2()) === i2 && (tl2 = el2, n3 = (n3 = ae2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = se2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = le2()) ? void 0 : i2) !== i2 ? ((n3 = nu2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = ue2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ce2()) ? void 0 : i2) !== i2 ? ((n3 = Bl2()) === i2 && (tl2 = el2, n3 = (n3 = he2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = de2()) ? void 0 : i2) !== i2 ? ((n3 = Nl2()) === i2 && (tl2 = el2, n3 = (n3 = me2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ge2()) ? void 0 : i2) !== i2 ? ((n3 = Fl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = fe2()) ? void 0 : i2) !== i2 ? ((n3 = Rl2()) === i2 && (tl2 = el2, n3 = (n3 = be2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = ye2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ve2()) ? void 0 : i2) !== i2 ? ((n3 = Hl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = ye2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = xe2()) ? void 0 : i2) !== i2 ? ((n3 = Vl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = ye2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = we2()) ? void 0 : i2) !== i2 ? ((n3 = Il2()) === i2 && (tl2 = el2, n3 = (n3 = ke2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ae2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = _e2()) ? void 0 : i2) !== i2 ? ((n3 = Yl2()) === i2 && (tl2 = el2, n3 = (n3 = Se2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = qe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ce2()) ? void 0 : i2) !== i2 ? ((n3 = Xl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = qe2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ze2()) ? void 0 : i2) !== i2 ? ((n3 = Gl2()) === i2 && (tl2 = el2, n3 = (n3 = Te2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Me2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ee2()) ? void 0 : i2) !== i2 ? ((n3 = Gl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Me2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = De2()) ? void 0 : i2) !== i2 ? ((n3 = Ul2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Me2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Le2()) ? void 0 : i2) !== i2 ? ((n3 = Ol2()) === i2 && (tl2 = el2, n3 = (n3 = Be2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ne2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Oe2()) ? void 0 : i2) !== i2 ? ((n3 = Ql2()) === i2 && (tl2 = el2, n3 = (n3 = Fe2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Re2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = He2()) ? void 0 : i2) !== i2 ? ((n3 = uu2()) === i2 && (tl2 = el2, n3 = (n3 = Ve2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Pe2()) ? void 0 : i2) !== i2 ? ((n3 = cu2()) === i2 && (tl2 = el2, n3 = (n3 = je2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ge2()) ? void 0 : i2) !== i2 ? ((n3 = hu2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ue2()) ? void 0 : i2) !== i2 ? ((n3 = pu2()) === i2 && (tl2 = el2, n3 = (n3 = Ye2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Xe2()) ? void 0 : i2) !== i2 ? ((n3 = du2()) === i2 && (tl2 = el2, n3 = (n3 = We2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = $e2()) ? void 0 : i2) !== i2 ? ((n3 = Zl2()) === i2 && (tl2 = el2, n3 = (n3 = Ze2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Je2()) ? void 0 : i2) !== i2 ? ((n3 = Jl2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = Ke2()) ? void 0 : i2) !== i2 ? ((n3 = $l2()) === i2 && (tl2 = el2, n3 = (n3 = Qe2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ae2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = et2()) ? void 0 : i2) !== i2 ? ((n3 = $l2()) === i2 && (n3 = null), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ae2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = tt2()) ? void 0 : i2) !== i2 ? ((n3 = ku2()) === i2 && (tl2 = el2, n3 = (n3 = rt2()) ? void 0 : i2), n3 !== i2 ? (tl2 = t3, t3 = r3 = Ie2(n3)) : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = nt2()) ? void 0 : i2) !== i2 && (n3 = Xu2()) !== i2 ? t3 = r3 = [r3, n3] : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = it2()) ? void 0 : i2) !== i2 && (n3 = zu2()) !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, tl2 = el2, (r3 = (r3 = ot2()) ? void 0 : i2) !== i2 && (n3 = Tu2()) !== i2 ? (tl2 = t3, t3 = r3 = pe2(n3)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, r3 = el2, ol2++, n3 = el2, (o3 = Xu2()) !== i2 && (a3 = Qu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), ol2--, n3 !== i2 ? (el2 = r3, r3 = void 0) : r3 = i2, r3 !== i2 ? (tl2 = el2, (n3 = (n3 = at2()) ? void 0 : i2) !== i2 ? t3 = r3 = [r3, n3] : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2), t3 === i2 && (t3 = el2, r3 = el2, ol2++, n3 = el2, (o3 = Xu2()) !== i2 && (a3 = Fu2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), ol2--, n3 !== i2 ? (el2 = r3, r3 = void 0) : r3 = i2, r3 !== i2 ? (tl2 = el2, (n3 = (n3 = st2()) ? void 0 : i2) !== i2 ? t3 = r3 = [r3, n3] : (el2 = t3, t3 = i2)) : (el2 = t3, t3 = i2))))))))))))))))))))))))))))))))));
      return e7;
    }
    function Ll2() {
      var e7, r3;
      return e7 = el2, tl2 = el2, (lt2() ? void 0 : i2) !== i2 && Xu2() !== i2 ? (42 === t2.charCodeAt(el2) ? (r3 = ut2, el2++) : (r3 = i2, 0 === ol2 && pl2(ct2)), r3 === i2 && (r3 = null), r3 !== i2 ? (tl2 = e7, e7 = ht2(r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Bl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && Xu2() !== i2 && (t3 = Tl2()) !== i2 && Xu2() !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = pt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Nl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && Xu2() !== i2 ? ((t3 = Tl2()) === i2 && (t3 = null), t3 !== i2 && Xu2() !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = pt2(t3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Ol2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && Xu2() !== i2 && Ou2() !== i2 && (t3 = Tl2()) !== i2 && Xu2() !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = pt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Fl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Qu2() !== i2 && Xu2() !== i2 && (t3 = Tl2()) !== i2 && Xu2() !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = pt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Rl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && Xu2() !== i2 && (t3 = Ml2()) !== i2 && Xu2() !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = dt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Hl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Qu2() !== i2 && Xu2() !== i2 && (t3 = Ml2()) !== i2 && Xu2() !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = dt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Vl2() {
      var e7, r3, n3, o3;
      if (e7 = el2, Xu2() !== i2) if (Qu2() !== i2) {
        for (r3 = [], n3 = el2, Xu2() !== i2 ? (44 === t2.charCodeAt(el2) ? (o3 = mt2, el2++) : (o3 = i2, 0 === ol2 && pl2(gt2)), o3 !== i2 ? (tl2 = n3, n3 = ft2()) : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2), n3 === i2 && (n3 = el2, Xu2() !== i2 && (o3 = El2()) !== i2 ? (tl2 = n3, n3 = bt2(o3)) : (el2 = n3, n3 = i2)); n3 !== i2; ) r3.push(n3), n3 = el2, Xu2() !== i2 ? (44 === t2.charCodeAt(el2) ? (o3 = mt2, el2++) : (o3 = i2, 0 === ol2 && pl2(gt2)), o3 !== i2 ? (tl2 = n3, n3 = ft2()) : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2), n3 === i2 && (n3 = el2, Xu2() !== i2 && (o3 = El2()) !== i2 ? (tl2 = n3, n3 = bt2(o3)) : (el2 = n3, n3 = i2));
        r3 !== i2 && (n3 = Xu2()) !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = yt2(r3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function Il2() {
      var e7, r3, n3, o3;
      if (e7 = el2, Xu2() !== i2) if (Fu2() !== i2) if (Xu2() !== i2) {
        for (r3 = [], n3 = el2, Xu2() !== i2 ? (44 === t2.charCodeAt(el2) ? (o3 = mt2, el2++) : (o3 = i2, 0 === ol2 && pl2(gt2)), o3 !== i2 ? (tl2 = n3, n3 = ft2()) : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2), n3 === i2 && (n3 = el2, Xu2() !== i2 && (o3 = Ml2()) !== i2 ? (tl2 = n3, n3 = vt2(o3)) : (el2 = n3, n3 = i2)); n3 !== i2; ) r3.push(n3), n3 = el2, Xu2() !== i2 ? (44 === t2.charCodeAt(el2) ? (o3 = mt2, el2++) : (o3 = i2, 0 === ol2 && pl2(gt2)), o3 !== i2 ? (tl2 = n3, n3 = ft2()) : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2), n3 === i2 && (n3 = el2, Xu2() !== i2 && (o3 = Ml2()) !== i2 ? (tl2 = n3, n3 = vt2(o3)) : (el2 = n3, n3 = i2));
        r3 !== i2 && (n3 = Xu2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = xt2(r3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function Pl2() {
      var e7, r3, n3, o3;
      return e7 = el2, Xu2() !== i2 ? (t2.substr(el2, 2) === wt2 ? (r3 = wt2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(kt2)), r3 === i2 && (t2.substr(el2, 2) === At2 ? (r3 = At2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(_t2)), r3 === i2 && (t2.substr(el2, 2) === St2 ? (r3 = St2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(qt2)), r3 === i2 && (t2.substr(el2, 2) === Ct2 ? (r3 = Ct2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(zt2)), r3 === i2 && (t2.substr(el2, 2) === Tt2 ? (r3 = Tt2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Mt2)), r3 === i2 && (t2.substr(el2, 2) === Et2 ? (r3 = Et2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Dt2)), r3 === i2 && (t2.substr(el2, 2) === Lt2 ? (r3 = Lt2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Bt2)), r3 === i2 && (t2.substr(el2, 2) === Nt2 ? (r3 = Nt2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Ot2)), r3 === i2 && (t2.substr(el2, 2) === Ft2 ? (r3 = Ft2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Rt2)), r3 === i2 && (t2.substr(el2, 2) === Ht2 ? (r3 = Ht2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Vt2)), r3 === i2 && (t2.substr(el2, 2) === It2 ? (r3 = It2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Pt2)))))))))))), r3 !== i2 ? (n3 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 && (o3 = Xu2()) !== i2 ? (tl2 = e7, e7 = jt2(r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function jl2() {
      var e7, r3, n3, o3, a3, s3, l3, u3;
      return e7 = el2, (r3 = pc2()) !== i2 && (n3 = Pl2()) !== i2 ? (o3 = el2, a3 = (function() {
        var e8, r4, n4, o4;
        e8 = el2, t2.substr(el2, 4) === Ki2 ? (r4 = Ki2, el2 += 4) : (r4 = i2, 0 === ol2 && pl2(Qi2));
        r4 !== i2 ? (n4 = el2, ol2++, o4 = tc2(), ol2--, o4 === i2 ? n4 = void 0 : (el2 = n4, n4 = i2), n4 !== i2 && (o4 = Xu2()) !== i2 ? (tl2 = e8, e8 = r4 = Ui2()) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        return e8;
      })(), a3 !== i2 && (s3 = pc2()) !== i2 && (l3 = Pl2()) !== i2 ? o3 = a3 = [a3, s3, l3] : (el2 = o3, o3 = i2), o3 === i2 && (o3 = null), o3 !== i2 ? (a3 = el2, s3 = (function() {
        var e8, r4, n4, o4;
        e8 = el2, t2.substr(el2, 5) === eo2 ? (r4 = eo2, el2 += 5) : (r4 = i2, 0 === ol2 && pl2(to2));
        r4 !== i2 ? (n4 = el2, ol2++, o4 = tc2(), ol2--, o4 === i2 ? n4 = void 0 : (el2 = n4, n4 = i2), n4 !== i2 && (o4 = Xu2()) !== i2 ? (tl2 = e8, e8 = r4 = Ui2()) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        return e8;
      })(), s3 !== i2 && (l3 = pc2()) !== i2 && (u3 = Pl2()) !== i2 ? a3 = s3 = [s3, l3, u3] : (el2 = a3, a3 = i2), a3 === i2 && (a3 = null), a3 !== i2 ? (tl2 = e7, e7 = r3 = Gt2(r3, n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Gl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && Xu2() !== i2 && (t3 = jl2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Ut2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Ul2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Qu2() !== i2 && Xu2() !== i2 && (t3 = jl2()) !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = Ut2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Yl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && (t3 = lu2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Yt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Xl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Qu2() !== i2 && (t3 = lu2()) !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = Yt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Wl2() {
      var e7, t3, r3;
      return e7 = el2, Xu2() !== i2 ? ((t3 = jl2()) === i2 && (t3 = el2, (r3 = pc2()) !== i2 && (tl2 = t3, r3 = Xt2(r3)), t3 = r3), t3 !== i2 && (r3 = Xu2()) !== i2 ? (tl2 = e7, e7 = Wt2(t3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function $l2() {
      var e7, r3, n3, o3, a3, s3;
      return e7 = el2, Xu2() !== i2 ? (40 === t2.charCodeAt(el2) ? (r3 = $t2, el2++) : (r3 = i2, 0 === ol2 && pl2(Zt2)), r3 !== i2 && (n3 = Wl2()) !== i2 ? (44 === t2.charCodeAt(el2) ? (o3 = mt2, el2++) : (o3 = i2, 0 === ol2 && pl2(gt2)), o3 !== i2 && (a3 = Wl2()) !== i2 ? (41 === t2.charCodeAt(el2) ? (s3 = Jt2, el2++) : (s3 = i2, 0 === ol2 && pl2(Kt2)), s3 !== i2 && Xu2() !== i2 ? (tl2 = e7, e7 = Qt2(n3, a3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Zl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && (t3 = Wl2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Wt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Jl2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Qu2() !== i2 && (t3 = Wl2()) !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = Wt2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function Kl2() {
      var e7;
      return (e7 = tc2()) === i2 && (e7 = rc2()) === i2 && (nr2.test(t2.charAt(el2)) ? (e7 = t2.charAt(el2), el2++) : (e7 = i2, 0 === ol2 && pl2(ir2)), e7 === i2 && (39 === t2.charCodeAt(el2) ? (e7 = or2, el2++) : (e7 = i2, 0 === ol2 && pl2(ar2)), e7 === i2 && (e7 = (function() {
        var e8, r3, n3, o3, a3, s3, l3;
        return e8 = el2, (r3 = Ou2()) === i2 && (r3 = null), r3 !== i2 ? (n3 = el2, o3 = el2, 37 === t2.charCodeAt(el2) ? (a3 = er2, el2++) : (a3 = i2, 0 === ol2 && pl2(tr2)), a3 !== i2 && (s3 = hc2()) !== i2 && (l3 = hc2()) !== i2 ? o3 = a3 = [a3, s3, l3] : (el2 = o3, o3 = i2), (n3 = o3 !== i2 ? t2.substring(n3, el2) : o3) !== i2 ? (tl2 = e8, e8 = r3 = rr2(n3)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2), e8;
      })()) === i2 && (tl2 = el2, e7 = (e7 = sr2()) ? void 0 : i2))), e7;
    }
    function Ql2() {
      var e7, t3, r3, n3, o3, a3, s3;
      if (e7 = el2, Xu2() !== i2) if (Fu2() !== i2) if (Xu2() !== i2) {
        if (t3 = [], r3 = el2, n3 = el2, ol2++, o3 = el2, (a3 = Xu2()) !== i2 && (s3 = Ru2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 && (o3 = Kl2()) !== i2 ? (tl2 = r3, r3 = n3 = lr2(o3)) : (el2 = r3, r3 = i2), r3 !== i2) for (; r3 !== i2; ) t3.push(r3), r3 = el2, n3 = el2, ol2++, o3 = el2, (a3 = Xu2()) !== i2 && (s3 = Ru2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 && (o3 = Kl2()) !== i2 ? (tl2 = r3, r3 = n3 = lr2(o3)) : (el2 = r3, r3 = i2);
        else t3 = i2;
        t3 !== i2 && (r3 = Xu2()) !== i2 && (n3 = Ru2()) !== i2 ? (tl2 = e7, e7 = ur2(t3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function eu2() {
      var e7, t3, r3, n3;
      if (e7 = el2, Xu2() !== i2) if (Fu2() !== i2) if (tl2 = el2, (cr2() ? void 0 : i2) !== i2) if ((t3 = $u2()) === i2 && (t3 = null), t3 !== i2) {
        for (r3 = [], n3 = yl2(); n3 !== i2; ) r3.push(n3), n3 = yl2();
        r3 !== i2 && (n3 = Ru2()) !== i2 ? (tl2 = e7, e7 = hr2(t3, r3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function tu2() {
      var e7, t3, r3;
      for (e7 = el2, t3 = [], r3 = vl2(); r3 !== i2; ) t3.push(r3), r3 = vl2();
      return t3 !== i2 && (tl2 = e7, t3 = pr2(t3)), e7 = t3;
    }
    function ru2() {
      var e7, t3, r3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 ? (tl2 = el2, (cr2() ? void 0 : i2) !== i2 ? ((t3 = $u2()) === i2 && (t3 = null), t3 !== i2 && (r3 = tu2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = dr2(t3, r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function nu2() {
      var e7, t3, r3;
      if (e7 = el2, Xu2() !== i2) if (Qu2() !== i2) if (tl2 = el2, (cr2() ? void 0 : i2) !== i2) {
        for (t3 = [], r3 = yl2(); r3 !== i2; ) t3.push(r3), r3 = yl2();
        t3 !== i2 && (r3 = ec2()) !== i2 ? (tl2 = el2, (mr2() ? void 0 : i2) !== i2 ? (tl2 = e7, e7 = gr2(t3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function iu2() {
      var e7, r3, n3;
      return e7 = el2, Ou2() !== i2 ? (t2.substr(el2, 5) === fr2 ? (r3 = fr2, el2 += 5) : (r3 = i2, 0 === ol2 && pl2(br2)), r3 !== i2 && (n3 = Bl2()) !== i2 ? (tl2 = e7, e7 = Wt2(n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function ou2() {
      var e7, r3, n3, o3;
      return e7 = el2, 40 === t2.charCodeAt(el2) ? (r3 = $t2, el2++) : (r3 = i2, 0 === ol2 && pl2(Zt2)), r3 !== i2 && (n3 = lu2()) !== i2 ? (41 === t2.charCodeAt(el2) ? (o3 = Jt2, el2++) : (o3 = i2, 0 === ol2 && pl2(Kt2)), o3 !== i2 ? (tl2 = e7, e7 = r3 = wr2(n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = sc2()) === i2 && (e7 = (function() {
        var e8, r4, n4;
        return e8 = el2, Ou2() !== i2 ? (t2.substr(el2, 4) === yr2 ? (r4 = yr2, el2 += 4) : (r4 = i2, 0 === ol2 && pl2(vr2)), r4 !== i2 && Xu2() !== i2 && Fu2() !== i2 && Xu2() !== i2 && (n4 = pc2()) !== i2 && Xu2() !== i2 && Ru2() !== i2 ? (tl2 = e8, e8 = xr2(n4)) : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2), e8;
      })(), e7 === i2 && (e7 = el2, (r3 = iu2()) !== i2 && (tl2 = e7, r3 = kr2(r3)), e7 = r3)), e7;
    }
    function au2() {
      var e7, r3, n3;
      return e7 = el2, 43 === t2.charCodeAt(el2) ? (r3 = Ar2, el2++) : (r3 = i2, 0 === ol2 && pl2(_r2)), r3 === i2 && (45 === t2.charCodeAt(el2) ? (r3 = Sr2, el2++) : (r3 = i2, 0 === ol2 && pl2(qr2))), r3 !== i2 && Xu2() !== i2 && (n3 = au2()) !== i2 ? (tl2 = e7, e7 = r3 = Cr2(r3, n3)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = ou2()), e7;
    }
    function su2() {
      var e7, r3, n3, o3, a3, s3, l3, u3;
      if (e7 = el2, (r3 = au2()) !== i2) {
        for (n3 = [], o3 = el2, (a3 = Xu2()) !== i2 ? (42 === t2.charCodeAt(el2) ? (s3 = ut2, el2++) : (s3 = i2, 0 === ol2 && pl2(ct2)), s3 === i2 && (47 === t2.charCodeAt(el2) ? (s3 = zr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Tr2))), s3 !== i2 && (l3 = Xu2()) !== i2 && (u3 = au2()) !== i2 ? o3 = a3 = [a3, s3, l3, u3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, (a3 = Xu2()) !== i2 ? (42 === t2.charCodeAt(el2) ? (s3 = ut2, el2++) : (s3 = i2, 0 === ol2 && pl2(ct2)), s3 === i2 && (47 === t2.charCodeAt(el2) ? (s3 = zr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Tr2))), s3 !== i2 && (l3 = Xu2()) !== i2 && (u3 = au2()) !== i2 ? o3 = a3 = [a3, s3, l3, u3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2);
        n3 !== i2 ? (tl2 = e7, e7 = r3 = Mr2(r3, n3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      return e7;
    }
    function lu2() {
      var e7, r3, n3, o3, a3, s3, l3, u3;
      if (e7 = el2, Xu2() !== i2) if ((r3 = su2()) !== i2) {
        for (n3 = [], o3 = el2, (a3 = Xu2()) !== i2 ? (43 === t2.charCodeAt(el2) ? (s3 = Ar2, el2++) : (s3 = i2, 0 === ol2 && pl2(_r2)), s3 === i2 && (45 === t2.charCodeAt(el2) ? (s3 = Sr2, el2++) : (s3 = i2, 0 === ol2 && pl2(qr2))), s3 !== i2 && (l3 = Xu2()) !== i2 && (u3 = su2()) !== i2 ? o3 = a3 = [a3, s3, l3, u3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, (a3 = Xu2()) !== i2 ? (43 === t2.charCodeAt(el2) ? (s3 = Ar2, el2++) : (s3 = i2, 0 === ol2 && pl2(_r2)), s3 === i2 && (45 === t2.charCodeAt(el2) ? (s3 = Sr2, el2++) : (s3 = i2, 0 === ol2 && pl2(qr2))), s3 !== i2 && (l3 = Xu2()) !== i2 && (u3 = su2()) !== i2 ? o3 = a3 = [a3, s3, l3, u3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2);
        n3 !== i2 && (o3 = Xu2()) !== i2 ? (tl2 = e7, e7 = Er2(r3, n3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function uu2() {
      var e7, r3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 ? (r3 = (function() {
        var e8, r4, n3, o3;
        e8 = el2, r4 = (function() {
          var e9, r5, n4, o4, a3, s3, l3, u3, c3, h3, p3, d3, m3;
          if (e9 = el2, r5 = yu2(), r5 !== i2) if (n4 = el2, 44 === t2.charCodeAt(el2) ? (o4 = mt2, el2++) : (o4 = i2, 0 === ol2 && pl2(gt2)), o4 !== i2 && (a3 = cc2()) !== i2 ? n4 = o4 = [o4, a3] : (el2 = n4, n4 = i2), n4 === i2 && (n4 = null), n4 !== i2) if (58 === t2.charCodeAt(el2) ? (o4 = Nr2, el2++) : (o4 = i2, 0 === ol2 && pl2(Or2)), o4 !== i2) if ((a3 = mu2()) !== i2) if (44 === t2.charCodeAt(el2) ? (s3 = mt2, el2++) : (s3 = i2, 0 === ol2 && pl2(gt2)), s3 !== i2) if ((l3 = pc2()) !== i2) {
            for (u3 = [], c3 = el2, 59 === t2.charCodeAt(el2) ? (h3 = Fr2, el2++) : (h3 = i2, 0 === ol2 && pl2(Rr2)), h3 !== i2 && (p3 = mu2()) !== i2 ? (44 === t2.charCodeAt(el2) ? (d3 = mt2, el2++) : (d3 = i2, 0 === ol2 && pl2(gt2)), d3 !== i2 && (m3 = pc2()) !== i2 ? c3 = h3 = [h3, p3, d3, m3] : (el2 = c3, c3 = i2)) : (el2 = c3, c3 = i2); c3 !== i2; ) u3.push(c3), c3 = el2, 59 === t2.charCodeAt(el2) ? (h3 = Fr2, el2++) : (h3 = i2, 0 === ol2 && pl2(Rr2)), h3 !== i2 && (p3 = mu2()) !== i2 ? (44 === t2.charCodeAt(el2) ? (d3 = mt2, el2++) : (d3 = i2, 0 === ol2 && pl2(gt2)), d3 !== i2 && (m3 = pc2()) !== i2 ? c3 = h3 = [h3, p3, d3, m3] : (el2 = c3, c3 = i2)) : (el2 = c3, c3 = i2);
            u3 !== i2 ? e9 = r5 = [r5, n4, o4, a3, s3, l3, u3] : (el2 = e9, e9 = i2);
          } else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          else el2 = e9, e9 = i2;
          return e9;
        })(), r4 === i2 && (r4 = mu2()) === i2 && (r4 = fu2());
        if (r4 !== i2) {
          for (n3 = [], o3 = gu2(); o3 !== i2; ) n3.push(o3), o3 = gu2();
          n3 !== i2 ? e8 = r4 = [r4, n3] : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        return e8;
      })(), r3 !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Wt2(r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function cu2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && (t3 = vu2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Dr2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function hu2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Qu2() !== i2 && (t3 = vu2()) !== i2 && ec2() !== i2 ? (tl2 = e7, e7 = Dr2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function pu2() {
      var e7, r3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 ? (r3 = (function() {
        var e8, r4, n3, o3, a3, s3, l3, u3, c3, h3, p3;
        if (e8 = el2, r4 = fu2(), r4 !== i2) if (44 === t2.charCodeAt(el2) ? (n3 = mt2, el2++) : (n3 = i2, 0 === ol2 && pl2(gt2)), n3 !== i2) if ((o3 = wu2()) !== i2) {
          for (a3 = [], s3 = el2, 59 === t2.charCodeAt(el2) ? (l3 = Fr2, el2++) : (l3 = i2, 0 === ol2 && pl2(Rr2)), l3 !== i2 && (u3 = Xu2()) !== i2 && (c3 = fu2()) !== i2 ? (44 === t2.charCodeAt(el2) ? (h3 = mt2, el2++) : (h3 = i2, 0 === ol2 && pl2(gt2)), h3 !== i2 && (p3 = wu2()) !== i2 ? s3 = l3 = [l3, u3, c3, h3, p3] : (el2 = s3, s3 = i2)) : (el2 = s3, s3 = i2); s3 !== i2; ) a3.push(s3), s3 = el2, 59 === t2.charCodeAt(el2) ? (l3 = Fr2, el2++) : (l3 = i2, 0 === ol2 && pl2(Rr2)), l3 !== i2 && (u3 = Xu2()) !== i2 && (c3 = fu2()) !== i2 ? (44 === t2.charCodeAt(el2) ? (h3 = mt2, el2++) : (h3 = i2, 0 === ol2 && pl2(gt2)), h3 !== i2 && (p3 = wu2()) !== i2 ? s3 = l3 = [l3, u3, c3, h3, p3] : (el2 = s3, s3 = i2)) : (el2 = s3, s3 = i2);
          a3 !== i2 ? (tl2 = e8, e8 = r4 = Dn2(r4, o3, a3)) : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        return e8;
      })(), r3 !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Lr2(r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function du2() {
      var e7, t3;
      return e7 = el2, Xu2() !== i2 && Fu2() !== i2 && (t3 = wu2()) !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = Br2(t3)) : (el2 = e7, e7 = i2), e7;
    }
    function mu2() {
      var e7, r3, n3, o3, a3;
      return e7 = el2, r3 = (function() {
        var e8, r4, n4;
        e8 = el2, r4 = [], 45 === t2.charCodeAt(el2) ? (n4 = Sr2, el2++) : (n4 = i2, 0 === ol2 && pl2(qr2));
        for (; n4 !== i2; ) r4.push(n4), 45 === t2.charCodeAt(el2) ? (n4 = Sr2, el2++) : (n4 = i2, 0 === ol2 && pl2(qr2));
        r4 !== i2 && (tl2 = e8, r4 = Xr2(r4));
        return e8 = r4, e8;
      })(), r3 === i2 && (r3 = null), r3 !== i2 && (n3 = fu2()) !== i2 ? (o3 = (function() {
        var e8, r4, n4, o4, a4, s3, l3, u3, c3;
        e8 = el2, 33 === t2.charCodeAt(el2) ? (r4 = Hr2, el2++) : (r4 = i2, 0 === ol2 && pl2(Vr2));
        if (r4 !== i2) if ((n4 = pc2()) !== i2) {
          for (o4 = [], a4 = el2, 33 === t2.charCodeAt(el2) ? (s3 = Hr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Vr2)), s3 !== i2 && (l3 = fu2()) !== i2 ? (33 === t2.charCodeAt(el2) ? (u3 = Hr2, el2++) : (u3 = i2, 0 === ol2 && pl2(Vr2)), u3 !== i2 && (c3 = pc2()) !== i2 ? a4 = s3 = [s3, l3, u3, c3] : (el2 = a4, a4 = i2)) : (el2 = a4, a4 = i2); a4 !== i2; ) o4.push(a4), a4 = el2, 33 === t2.charCodeAt(el2) ? (s3 = Hr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Vr2)), s3 !== i2 && (l3 = fu2()) !== i2 ? (33 === t2.charCodeAt(el2) ? (u3 = Hr2, el2++) : (u3 = i2, 0 === ol2 && pl2(Vr2)), u3 !== i2 && (c3 = pc2()) !== i2 ? a4 = s3 = [s3, l3, u3, c3] : (el2 = a4, a4 = i2)) : (el2 = a4, a4 = i2);
          o4 !== i2 ? (a4 = el2, 33 === t2.charCodeAt(el2) ? (s3 = Hr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Vr2)), s3 !== i2 && (l3 = fu2()) !== i2 ? a4 = s3 = [s3, l3] : (el2 = a4, a4 = i2), a4 === i2 && (a4 = null), a4 !== i2 ? e8 = r4 = [r4, n4, o4, a4] : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        return e8;
      })(), o3 === i2 && (o3 = null), o3 !== i2 ? (a3 = (function() {
        var e8, r4, n4, o4, a4, s3;
        e8 = el2, t2.substr(el2, 2) === Zr2 ? (r4 = Zr2, el2 += 2) : (r4 = i2, 0 === ol2 && pl2(Jr2));
        if (r4 !== i2) {
          if (n4 = [], 43 === t2.charCodeAt(el2) ? (o4 = Ar2, el2++) : (o4 = i2, 0 === ol2 && pl2(_r2)), o4 !== i2) for (; o4 !== i2; ) n4.push(o4), 43 === t2.charCodeAt(el2) ? (o4 = Ar2, el2++) : (o4 = i2, 0 === ol2 && pl2(_r2));
          else n4 = i2;
          n4 === i2 && (n4 = el2, 91 === t2.charCodeAt(el2) ? (o4 = Kr2, el2++) : (o4 = i2, 0 === ol2 && pl2(Qr2)), o4 !== i2 && (a4 = cc2()) !== i2 ? (93 === t2.charCodeAt(el2) ? (s3 = en2, el2++) : (s3 = i2, 0 === ol2 && pl2(tn2)), s3 !== i2 ? n4 = o4 = [o4, a4, s3] : (el2 = n4, n4 = i2)) : (el2 = n4, n4 = i2)), n4 !== i2 ? e8 = r4 = [r4, n4] : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        return e8;
      })(), a3 === i2 && (a3 = null), a3 !== i2 ? e7 = r3 = [r3, n3, o3, a3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function gu2() {
      var e7, r3, n3, o3, a3, s3;
      if (e7 = el2, r3 = (function() {
        var e8, r4, n4;
        e8 = el2, 62 === t2.charCodeAt(el2) ? (r4 = Ir2, el2++) : (r4 = i2, 0 === ol2 && pl2(Pr2));
        r4 !== i2 ? (t2.substr(el2, 5) === jr2 ? (n4 = jr2, el2 += 5) : (n4 = i2, 0 === ol2 && pl2(Gr2)), n4 === i2 && (t2.substr(el2, 6) === Ur2 ? (n4 = Ur2, el2 += 6) : (n4 = i2, 0 === ol2 && pl2(Yr2))), n4 !== i2 ? e8 = r4 = [r4, n4] : (el2 = e8, e8 = i2)) : (el2 = e8, e8 = i2);
        return e8;
      })(), r3 !== i2) {
        for (n3 = [], o3 = el2, 44 === t2.charCodeAt(el2) ? (a3 = mt2, el2++) : (a3 = i2, 0 === ol2 && pl2(gt2)), a3 !== i2 && (s3 = pc2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, 44 === t2.charCodeAt(el2) ? (a3 = mt2, el2++) : (a3 = i2, 0 === ol2 && pl2(gt2)), a3 !== i2 && (s3 = pc2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2);
        n3 !== i2 ? e7 = r3 = [r3, n3] : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      return e7;
    }
    function fu2() {
      var e7, r3, n3;
      if (e7 = el2, r3 = [], (n3 = tc2()) === i2 && (n3 = rc2()), n3 !== i2) for (; n3 !== i2; ) r3.push(n3), (n3 = tc2()) === i2 && (n3 = rc2());
      else r3 = i2;
      return (e7 = r3 !== i2 ? t2.substring(e7, el2) : r3) === i2 && (e7 = el2, 46 === t2.charCodeAt(el2) ? (r3 = Wr2, el2++) : (r3 = i2, 0 === ol2 && pl2($r2)), e7 = r3 !== i2 ? t2.substring(e7, el2) : r3), e7;
    }
    function bu2() {
      var e7;
      return (e7 = yu2()) === i2 && (e7 = (function() {
        var e8;
        t2.substr(el2, 3) === dn2 ? (e8 = dn2, el2 += 3) : (e8 = i2, 0 === ol2 && pl2(mn2));
        e8 === i2 && (t2.substr(el2, 4) === gn2 ? (e8 = gn2, el2 += 4) : (e8 = i2, 0 === ol2 && pl2(fn2)), e8 === i2 && (t2.substr(el2, 3) === bn2 ? (e8 = bn2, el2 += 3) : (e8 = i2, 0 === ol2 && pl2(yn2)), e8 === i2 && (t2.substr(el2, 4) === vn2 ? (e8 = vn2, el2 += 4) : (e8 = i2, 0 === ol2 && pl2(xn2)))));
        return e8;
      })()) === i2 && (e7 = (function() {
        var e8;
        t2.substr(el2, 3) === wn2 ? (e8 = wn2, el2 += 3) : (e8 = i2, 0 === ol2 && pl2(kn2));
        e8 === i2 && (t2.substr(el2, 4) === An2 ? (e8 = An2, el2 += 4) : (e8 = i2, 0 === ol2 && pl2(_n2)), e8 === i2 && (t2.substr(el2, 4) === Sn2 ? (e8 = Sn2, el2 += 4) : (e8 = i2, 0 === ol2 && pl2(qn2))));
        return e8;
      })()) === i2 && (e7 = (function() {
        var e8;
        t2.substr(el2, 5) === Cn2 ? (e8 = Cn2, el2 += 5) : (e8 = i2, 0 === ol2 && pl2(zn2));
        return e8;
      })()), e7;
    }
    function yu2() {
      var e7;
      return t2.substr(el2, 3) === rn2 ? (e7 = rn2, el2 += 3) : (e7 = i2, 0 === ol2 && pl2(nn2)), e7 === i2 && (t2.substr(el2, 4) === on2 ? (e7 = on2, el2 += 4) : (e7 = i2, 0 === ol2 && pl2(an2)), e7 === i2 && (t2.substr(el2, 3) === sn2 ? (e7 = sn2, el2 += 3) : (e7 = i2, 0 === ol2 && pl2(ln2)), e7 === i2 && (t2.substr(el2, 3) === un2 ? (e7 = un2, el2 += 3) : (e7 = i2, 0 === ol2 && pl2(cn2)), e7 === i2 && (t2.substr(el2, 4) === hn2 ? (e7 = hn2, el2 += 4) : (e7 = i2, 0 === ol2 && pl2(pn2)))))), e7;
    }
    function vu2() {
      var e7, r3, n3, o3, a3, s3, l3;
      if (e7 = el2, r3 = el2, (n3 = yu2()) !== i2 ? (58 === t2.charCodeAt(el2) ? (o3 = Nr2, el2++) : (o3 = i2, 0 === ol2 && pl2(Or2)), o3 !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2)) : (el2 = r3, r3 = i2), r3 === i2 && (r3 = null), r3 !== i2) if ((n3 = bu2()) !== i2) {
        for (o3 = [], a3 = el2, 47 === t2.charCodeAt(el2) ? (s3 = zr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Tr2)), s3 !== i2 && (l3 = bu2()) !== i2 ? a3 = s3 = [s3, l3] : (el2 = a3, a3 = i2); a3 !== i2; ) o3.push(a3), a3 = el2, 47 === t2.charCodeAt(el2) ? (s3 = zr2, el2++) : (s3 = i2, 0 === ol2 && pl2(Tr2)), s3 !== i2 && (l3 = bu2()) !== i2 ? a3 = s3 = [s3, l3] : (el2 = a3, a3 = i2);
        o3 !== i2 ? (tl2 = e7, e7 = r3 = Tn2(r3, n3, o3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return e7;
    }
    function xu2() {
      var e7, r3, n3, o3, a3, s3;
      if (e7 = el2, (r3 = pc2()) !== i2) {
        for (n3 = [], o3 = el2, (a3 = Uu2()) === i2 && (44 === t2.charCodeAt(el2) ? (a3 = mt2, el2++) : (a3 = i2, 0 === ol2 && pl2(gt2))), a3 !== i2 && (s3 = pc2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, (a3 = Uu2()) === i2 && (44 === t2.charCodeAt(el2) ? (a3 = mt2, el2++) : (a3 = i2, 0 === ol2 && pl2(gt2))), a3 !== i2 && (s3 = pc2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2);
        n3 !== i2 ? (tl2 = e7, e7 = r3 = Mn2(r3, n3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      return e7 === i2 && (e7 = fu2()), e7;
    }
    function wu2() {
      var e7, r3, n3, o3, a3, s3;
      if (e7 = el2, (r3 = xu2()) !== i2) {
        for (n3 = [], o3 = el2, 47 === t2.charCodeAt(el2) ? (a3 = zr2, el2++) : (a3 = i2, 0 === ol2 && pl2(Tr2)), a3 !== i2 && (s3 = xu2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, 47 === t2.charCodeAt(el2) ? (a3 = zr2, el2++) : (a3 = i2, 0 === ol2 && pl2(Tr2)), a3 !== i2 && (s3 = xu2()) !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2);
        n3 !== i2 ? (tl2 = e7, e7 = r3 = En2(r3, n3)) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      return e7;
    }
    function ku2() {
      var e7, t3, r3, n3, o3, a3, s3;
      if (e7 = el2, Fu2() !== i2) {
        for (t3 = [], r3 = _u2(); r3 !== i2; ) t3.push(r3), r3 = _u2();
        if (t3 !== i2) {
          if (r3 = [], n3 = el2, (o3 = Au2()) !== i2) {
            for (a3 = [], s3 = _u2(); s3 !== i2; ) a3.push(s3), s3 = _u2();
            a3 !== i2 ? (tl2 = n3, n3 = o3 = Ln2(t3, o3, a3)) : (el2 = n3, n3 = i2);
          } else el2 = n3, n3 = i2;
          if (n3 !== i2) for (; n3 !== i2; ) if (r3.push(n3), n3 = el2, (o3 = Au2()) !== i2) {
            for (a3 = [], s3 = _u2(); s3 !== i2; ) a3.push(s3), s3 = _u2();
            a3 !== i2 ? (tl2 = n3, n3 = o3 = Ln2(t3, o3, a3)) : (el2 = n3, n3 = i2);
          } else el2 = n3, n3 = i2;
          else r3 = i2;
          r3 !== i2 && (n3 = Ru2()) !== i2 ? (tl2 = e7, e7 = Bn2(t3, r3)) : (el2 = e7, e7 = i2);
        } else el2 = e7, e7 = i2;
      } else el2 = e7, e7 = i2;
      return e7;
    }
    function Au2() {
      var e7, r3, n3, o3;
      return e7 = el2, 108 === t2.charCodeAt(el2) ? (r3 = Nn2, el2++) : (r3 = i2, 0 === ol2 && pl2(On2)), r3 === i2 && (99 === t2.charCodeAt(el2) ? (r3 = Fn2, el2++) : (r3 = i2, 0 === ol2 && pl2(Rn2)), r3 === i2 && (114 === t2.charCodeAt(el2) ? (r3 = Hn2, el2++) : (r3 = i2, 0 === ol2 && pl2(Vn2)), r3 === i2 && (r3 = el2, 112 === t2.charCodeAt(el2) ? (n3 = In2, el2++) : (n3 = i2, 0 === ol2 && pl2(Pn2)), n3 !== i2 && (o3 = Gl2()) !== i2 ? (tl2 = r3, r3 = n3 = Ut2(o3)) : (el2 = r3, r3 = i2)))), r3 !== i2 && (tl2 = e7, r3 = jn2(r3)), (e7 = r3) === i2 && (e7 = el2, 42 === t2.charCodeAt(el2) ? (r3 = ut2, el2++) : (r3 = i2, 0 === ol2 && pl2(ct2)), r3 !== i2 && (n3 = Yl2()) !== i2 && (o3 = ku2()) !== i2 ? (tl2 = e7, e7 = r3 = Gn2(n3, o3)) : (el2 = e7, e7 = i2)), e7;
    }
    function _u2() {
      var e7, r3, n3, o3;
      return e7 = el2, 124 === t2.charCodeAt(el2) ? (r3 = Un2, el2++) : (r3 = i2, 0 === ol2 && pl2(Yn2)), r3 === i2 && (r3 = el2, 64 === t2.charCodeAt(el2) ? (n3 = Xn2, el2++) : (n3 = i2, 0 === ol2 && pl2(Wn2)), n3 !== i2 && (o3 = eu2()) !== i2 ? (tl2 = r3, r3 = n3 = $n2(o3)) : (el2 = r3, r3 = i2)), r3 !== i2 && (tl2 = e7, r3 = Zn2(r3)), e7 = r3;
    }
    function Su2() {
      var e7, t3, r3;
      return ol2++, e7 = el2, Du2() !== i2 && Fu2() !== i2 ? (t3 = el2, (r3 = Tl2()) !== i2 && (tl2 = t3, r3 = fi2(r3)), (t3 = r3) !== i2 ? ((r3 = Ll2()) === i2 && (r3 = null), r3 !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = bi2(t3, r3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), ol2--, e7 === i2 && (0 === ol2 && pl2(gi2)), e7;
    }
    function qu2() {
      var e7, r3, n3;
      return ol2++, e7 = el2, Wu2() !== i2 && Ou2() !== i2 && Lu2() !== i2 && Fu2() !== i2 && (r3 = Tl2()) !== i2 && Xu2() !== i2 ? (42 === t2.charCodeAt(el2) ? (n3 = ut2, el2++) : (n3 = i2, 0 === ol2 && pl2(ct2)), n3 === i2 && (n3 = null), n3 !== i2 && Ru2() !== i2 ? (tl2 = e7, e7 = vi2(r3, n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), ol2--, e7 === i2 && (0 === ol2 && pl2(yi2)), e7;
    }
    function Cu2() {
      var e7, r3, n3, o3, a3;
      return e7 = el2, Wu2() !== i2 && Ou2() !== i2 ? (t2.substr(el2, 4) === qi2 ? (r3 = qi2, el2 += 4) : (r3 = i2, 0 === ol2 && pl2(Ci2)), r3 !== i2 ? (n3 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 ? (tl2 = el2, (o3 = (o3 = zi2()) ? i2 : void 0) !== i2 ? ((a3 = nu2()) === i2 && (a3 = null), a3 !== i2 && Wu2() !== i2 ? (tl2 = e7, e7 = Ti2(a3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function zu2() {
      var e7, t3, r3, n3, o3, a3, s3, l3;
      for (e7 = [], t3 = el2, r3 = [], n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2); n3 !== i2; ) r3.push(n3), n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2);
      if (r3 !== i2) if ((n3 = Cu2()) !== i2) {
        for (o3 = [], a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2); a3 !== i2; ) o3.push(a3), a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2);
        o3 !== i2 ? (tl2 = t3, t3 = r3 = Ei2(n3, o3)) : (el2 = t3, t3 = i2);
      } else el2 = t3, t3 = i2;
      else el2 = t3, t3 = i2;
      for (; t3 !== i2; ) {
        for (e7.push(t3), t3 = el2, r3 = [], n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2); n3 !== i2; ) r3.push(n3), n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2);
        if (r3 !== i2) if ((n3 = Cu2()) !== i2) {
          for (o3 = [], a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2); a3 !== i2; ) o3.push(a3), a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2);
          o3 !== i2 ? (tl2 = t3, t3 = r3 = Ei2(n3, o3)) : (el2 = t3, t3 = i2);
        } else el2 = t3, t3 = i2;
        else el2 = t3, t3 = i2;
      }
      return e7;
    }
    function Tu2() {
      var e7, t3, r3, n3, o3, a3, s3, l3;
      for (e7 = [], t3 = el2, r3 = [], n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2); n3 !== i2; ) r3.push(n3), n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2);
      if (r3 !== i2) if (n3 = el2, (o3 = Cu2()) !== i2 && (tl2 = n3, o3 = Di2(o3)), (n3 = o3) !== i2) {
        for (o3 = [], a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2); a3 !== i2; ) o3.push(a3), a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2);
        o3 !== i2 ? (tl2 = t3, t3 = r3 = Ei2(n3, o3)) : (el2 = t3, t3 = i2);
      } else el2 = t3, t3 = i2;
      else el2 = t3, t3 = i2;
      for (; t3 !== i2; ) {
        for (e7.push(t3), t3 = el2, r3 = [], n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2); n3 !== i2; ) r3.push(n3), n3 = el2, (o3 = Wu2()) !== i2 && (a3 = kl2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2);
        if (r3 !== i2) if (n3 = el2, (o3 = Cu2()) !== i2 && (tl2 = n3, o3 = Di2(o3)), (n3 = o3) !== i2) {
          for (o3 = [], a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2); a3 !== i2; ) o3.push(a3), a3 = el2, s3 = el2, ol2++, (l3 = Cu2()) === i2 && (l3 = qu2()), ol2--, l3 === i2 ? s3 = void 0 : (el2 = s3, s3 = i2), s3 !== i2 && (l3 = bl2()) !== i2 ? (tl2 = a3, a3 = s3 = Mi2(n3, l3)) : (el2 = a3, a3 = i2);
          o3 !== i2 ? (tl2 = t3, t3 = r3 = Ei2(n3, o3)) : (el2 = t3, t3 = i2);
        } else el2 = t3, t3 = i2;
        else el2 = t3, t3 = i2;
      }
      return e7;
    }
    function Mu2() {
      var e7, r3, n3, o3;
      return e7 = el2, t2.substr(el2, 4) === Hi2 ? (r3 = Hi2, el2 += 4) : (r3 = i2, 0 === ol2 && pl2(Vi2)), r3 !== i2 && (n3 = Xu2()) !== i2 ? (t2.substr(el2, 9) === Oi2 ? (o3 = Oi2, el2 += 9) : (o3 = i2, 0 === ol2 && pl2(Fi2)), o3 !== i2 ? e7 = r3 = [r3, n3, o3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Eu2() {
      var e7, t3, r3, n3;
      if ((e7 = wl2()) === i2 && (e7 = Vu2()) === i2 && (e7 = Iu2()) === i2 && (e7 = Pu2()) === i2 && (e7 = el2, (t3 = Ou2()) !== i2 && (r3 = Tl2()) !== i2 ? e7 = t3 = [t3, r3] : (el2 = e7, e7 = i2), e7 === i2 && (e7 = el2, (t3 = Fu2()) !== i2 && (r3 = Xu2()) !== i2 && (n3 = Ru2()) !== i2 ? e7 = t3 = [t3, r3, n3] : (el2 = e7, e7 = i2), e7 === i2))) {
        if (e7 = el2, (t3 = Fu2()) !== i2) {
          if (r3 = [], (n3 = Eu2()) !== i2) for (; n3 !== i2; ) r3.push(n3), n3 = Eu2();
          else r3 = i2;
          r3 !== i2 && (n3 = Ru2()) !== i2 ? e7 = t3 = [t3, r3, n3] : (el2 = e7, e7 = i2);
        } else el2 = e7, e7 = i2;
        e7 === i2 && (e7 = Uu2()) === i2 && (e7 = Gu2()) === i2 && (e7 = Ju2()) === i2 && (e7 = Yu2());
      }
      return e7;
    }
    function Du2() {
      var e7, r3, n3, o3;
      return e7 = el2, t2.substr(el2, 5) === ji2 ? (r3 = ji2, el2 += 5) : (r3 = i2, 0 === ol2 && pl2(Gi2)), r3 !== i2 ? (n3 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 && (o3 = Xu2()) !== i2 ? (tl2 = e7, e7 = r3 = Ui2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Lu2() {
      var e7, r3, n3, o3;
      return e7 = el2, t2.substr(el2, 3) === Yi2 ? (r3 = Yi2, el2 += 3) : (r3 = i2, 0 === ol2 && pl2(Xi2)), r3 !== i2 ? (n3 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 && (o3 = Xu2()) !== i2 ? (tl2 = e7, e7 = r3 = Ui2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Bu2() {
      var e7, r3, n3, o3;
      return e7 = el2, t2.substr(el2, 3) === Wi2 ? (r3 = Wi2, el2 += 3) : (r3 = i2, 0 === ol2 && pl2($i2)), r3 !== i2 ? (n3 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 ? (tl2 = e7, e7 = r3 = Ui2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Nu2() {
      var e7, r3, n3, o3;
      return e7 = el2, t2.substr(el2, 8) === Zi2 ? (r3 = Zi2, el2 += 8) : (r3 = i2, 0 === ol2 && pl2(Ji2)), r3 !== i2 ? (n3 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 && (o3 = Xu2()) !== i2 ? (tl2 = e7, e7 = r3 = Ui2()) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Ou2() {
      var e7, r3;
      return e7 = el2, 92 === t2.charCodeAt(el2) ? (r3 = io2, el2++) : (r3 = i2, 0 === ol2 && pl2(oo2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function Fu2() {
      var e7, r3;
      return e7 = el2, 123 === t2.charCodeAt(el2) ? (r3 = ao2, el2++) : (r3 = i2, 0 === ol2 && pl2(so2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function Ru2() {
      var e7, r3;
      return e7 = el2, 125 === t2.charCodeAt(el2) ? (r3 = lo2, el2++) : (r3 = i2, 0 === ol2 && pl2(uo2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function Hu2() {
      var e7, r3;
      return ol2++, e7 = el2, 36 === t2.charCodeAt(el2) ? (r3 = ho2, el2++) : (r3 = i2, 0 === ol2 && pl2(po2)), r3 !== i2 && (tl2 = e7, r3 = v2()), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(co2)), e7;
    }
    function Vu2() {
      var e7, r3;
      return e7 = el2, 38 === t2.charCodeAt(el2) ? (r3 = mo2, el2++) : (r3 = i2, 0 === ol2 && pl2(go2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function Iu2() {
      var e7, r3;
      return e7 = el2, 94 === t2.charCodeAt(el2) ? (r3 = vo2, el2++) : (r3 = i2, 0 === ol2 && pl2(xo2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function Pu2() {
      var e7, r3;
      return e7 = el2, 95 === t2.charCodeAt(el2) ? (r3 = wo2, el2++) : (r3 = i2, 0 === ol2 && pl2(ko2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function ju2() {
      var e7, r3, n3;
      return ol2++, e7 = el2, ol2++, t2.length > el2 ? (r3 = t2.charAt(el2), el2++) : (r3 = i2, 0 === ol2 && pl2(u2)), ol2--, r3 === i2 ? e7 = void 0 : (el2 = e7, e7 = i2), e7 === i2 && (e7 = el2, (r3 = Ou2()) !== i2 ? (n3 = (function() {
        var e8, r4, n4, o3, a3, s3;
        if (e8 = el2, t2.substr(el2, 8) === ro2 ? (r4 = ro2, el2 += 8) : (r4 = i2, 0 === ol2 && pl2(no2)), r4 !== i2) if (n4 = el2, ol2++, o3 = tc2(), ol2--, o3 === i2 ? n4 = void 0 : (el2 = n4, n4 = i2), n4 !== i2) if ((o3 = Xu2()) !== i2) {
          for (a3 = [], t2.length > el2 ? (s3 = t2.charAt(el2), el2++) : (s3 = i2, 0 === ol2 && pl2(u2)); s3 !== i2; ) a3.push(s3), t2.length > el2 ? (s3 = t2.charAt(el2), el2++) : (s3 = i2, 0 === ol2 && pl2(u2));
          a3 !== i2 ? e8 = r4 = [r4, n4, o3, a3] : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        return e8;
      })(), n3 !== i2 ? e7 = r3 = [r3, n3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(So2)), e7;
    }
    function Gu2() {
      var e7, r3;
      return ol2++, 10 === t2.charCodeAt(el2) ? (e7 = Co2, el2++) : (e7 = i2, 0 === ol2 && pl2(zo2)), e7 === i2 && (t2.substr(el2, 2) === To2 ? (e7 = To2, el2 += 2) : (e7 = i2, 0 === ol2 && pl2(Mo2)), e7 === i2 && (13 === t2.charCodeAt(el2) ? (e7 = Eo2, el2++) : (e7 = i2, 0 === ol2 && pl2(Do2)), e7 === i2 && (8232 === t2.charCodeAt(el2) ? (e7 = Lo2, el2++) : (e7 = i2, 0 === ol2 && pl2(Bo2)), e7 === i2 && (e7 = el2, 8233 === t2.charCodeAt(el2) ? (r3 = No2, el2++) : (r3 = i2, 0 === ol2 && pl2(Oo2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3)))), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(qo2)), e7;
    }
    function Uu2() {
      var e7, r3;
      return ol2++, e7 = el2, Ro2.test(t2.charAt(el2)) ? (r3 = t2.charAt(el2), el2++) : (r3 = i2, 0 === ol2 && pl2(Ho2)), r3 !== i2 && (tl2 = e7, r3 = v2()), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(Fo2)), e7;
    }
    function Yu2() {
      var e7, r3, n3, o3, a3, s3, l3;
      if (ol2++, e7 = el2, 37 === t2.charCodeAt(el2) ? (r3 = er2, el2++) : (r3 = i2, 0 === ol2 && pl2(tr2)), r3 !== i2) {
        for (n3 = [], o3 = el2, a3 = el2, ol2++, s3 = Gu2(), ol2--, s3 === i2 ? a3 = void 0 : (el2 = a3, a3 = i2), a3 !== i2 ? (t2.length > el2 ? (s3 = t2.charAt(el2), el2++) : (s3 = i2, 0 === ol2 && pl2(u2)), s3 !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2); o3 !== i2; ) n3.push(o3), o3 = el2, a3 = el2, ol2++, s3 = Gu2(), ol2--, s3 === i2 ? a3 = void 0 : (el2 = a3, a3 = i2), a3 !== i2 ? (t2.length > el2 ? (s3 = t2.charAt(el2), el2++) : (s3 = i2, 0 === ol2 && pl2(u2)), s3 !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2);
        if (n3 !== i2) {
          if (o3 = el2, (a3 = Gu2()) !== i2) {
            for (s3 = [], l3 = Uu2(); l3 !== i2; ) s3.push(l3), l3 = Uu2();
            s3 !== i2 ? o3 = a3 = [a3, s3] : (el2 = o3, o3 = i2);
          } else el2 = o3, o3 = i2;
          o3 === i2 && (o3 = ju2()), o3 !== i2 ? e7 = r3 = [r3, n3, o3] : (el2 = e7, e7 = i2);
        } else el2 = e7, e7 = i2;
      } else el2 = e7, e7 = i2;
      return e7 === i2 && (e7 = el2, r3 = (function() {
        var e8, r4, n4, o4, a4, s4, l4;
        if (ol2++, e8 = el2, t2.substr(el2, 6) === Bi2 ? (r4 = Bi2, el2 += 6) : (r4 = i2, 0 === ol2 && pl2(Ni2)), r4 !== i2) if (Xu2() !== i2) if (t2.substr(el2, 9) === Oi2 ? (n4 = Oi2, el2 += 9) : (n4 = i2, 0 === ol2 && pl2(Fi2)), n4 !== i2) {
          for (o4 = [], a4 = el2, s4 = el2, ol2++, l4 = Mu2(), ol2--, l4 === i2 ? s4 = void 0 : (el2 = s4, s4 = i2), s4 !== i2 ? (t2.length > el2 ? (l4 = t2.charAt(el2), el2++) : (l4 = i2, 0 === ol2 && pl2(u2)), l4 !== i2 ? a4 = s4 = [s4, l4] : (el2 = a4, a4 = i2)) : (el2 = a4, a4 = i2); a4 !== i2; ) o4.push(a4), a4 = el2, s4 = el2, ol2++, l4 = Mu2(), ol2--, l4 === i2 ? s4 = void 0 : (el2 = s4, s4 = i2), s4 !== i2 ? (t2.length > el2 ? (l4 = t2.charAt(el2), el2++) : (l4 = i2, 0 === ol2 && pl2(u2)), l4 !== i2 ? a4 = s4 = [s4, l4] : (el2 = a4, a4 = i2)) : (el2 = a4, a4 = i2);
          o4 !== i2 && (a4 = Mu2()) !== i2 && (s4 = Xu2()) !== i2 ? (tl2 = e8, e8 = r4 = Ri2()) : (el2 = e8, e8 = i2);
        } else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        else el2 = e8, e8 = i2;
        return ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(Li2)), e8;
      })(), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(Vo2)), e7;
    }
    function Xu2() {
      var e7, t3, r3, n3, o3;
      for (ol2++, e7 = el2, t3 = [], r3 = el2, n3 = el2, ol2++, o3 = Zu2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 ? ((o3 = Gu2()) === i2 && (o3 = Uu2()) === i2 && (o3 = Yu2()), o3 !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2)) : (el2 = r3, r3 = i2); r3 !== i2; ) t3.push(r3), r3 = el2, n3 = el2, ol2++, o3 = Zu2(), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2 ? ((o3 = Gu2()) === i2 && (o3 = Uu2()) === i2 && (o3 = Yu2()), o3 !== i2 ? r3 = n3 = [n3, o3] : (el2 = r3, r3 = i2)) : (el2 = r3, r3 = i2);
      return t3 !== i2 && (tl2 = e7, t3 = v2()), ol2--, (e7 = t3) === i2 && (t3 = i2, 0 === ol2 && pl2(Io2)), e7;
    }
    function Wu2() {
      var e7, t3, r3;
      for (ol2++, e7 = el2, t3 = [], (r3 = Gu2()) === i2 && (r3 = Uu2()) === i2 && (r3 = Yu2()); r3 !== i2; ) t3.push(r3), (r3 = Gu2()) === i2 && (r3 = Uu2()) === i2 && (r3 = Yu2());
      return t3 !== i2 && (tl2 = e7, t3 = v2()), ol2--, (e7 = t3) === i2 && (t3 = i2, 0 === ol2 && pl2(Io2)), e7;
    }
    function $u2() {
      var e7, t3, r3, n3, o3, a3, s3, l3;
      if (ol2++, e7 = el2, t3 = el2, ol2++, r3 = Zu2(), ol2--, r3 === i2 ? t3 = void 0 : (el2 = t3, t3 = i2), t3 !== i2) if (r3 = el2, ol2++, n3 = Ju2(), ol2--, n3 === i2 ? r3 = void 0 : (el2 = r3, r3 = i2), r3 !== i2) if (n3 = el2, ol2++, o3 = el2, (a3 = Wu2()) !== i2 && (s3 = Ou2()) !== i2 ? ((l3 = Sl2()) === i2 && (l3 = Cl2()), l3 !== i2 ? o3 = a3 = [a3, s3, l3] : (el2 = o3, o3 = i2)) : (el2 = o3, o3 = i2), ol2--, o3 === i2 ? n3 = void 0 : (el2 = n3, n3 = i2), n3 !== i2) {
        if (o3 = [], (a3 = Uu2()) === i2 && (a3 = Gu2()), a3 !== i2) for (; a3 !== i2; ) o3.push(a3), (a3 = Uu2()) === i2 && (a3 = Gu2());
        else o3 = i2;
        o3 !== i2 ? (tl2 = e7, e7 = t3 = Po2()) : (el2 = e7, e7 = i2);
      } else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      else el2 = e7, e7 = i2;
      return ol2--, e7 === i2 && (t3 = i2, 0 === ol2 && pl2(Io2)), e7;
    }
    function Zu2() {
      var e7, t3, r3, n3, o3, a3, s3, l3;
      if (ol2++, e7 = el2, t3 = [], r3 = el2, (n3 = Wu2()) !== i2 && (o3 = Ou2()) !== i2 && (a3 = Bu2()) !== i2 && (s3 = Wu2()) !== i2 ? r3 = n3 = [n3, o3, a3, s3] : (el2 = r3, r3 = i2), r3 !== i2) for (; r3 !== i2; ) t3.push(r3), r3 = el2, (n3 = Wu2()) !== i2 && (o3 = Ou2()) !== i2 && (a3 = Bu2()) !== i2 && (s3 = Wu2()) !== i2 ? r3 = n3 = [n3, o3, a3, s3] : (el2 = r3, r3 = i2);
      else t3 = i2;
      if (t3 === i2) {
        for (t3 = el2, r3 = [], n3 = Uu2(); n3 !== i2; ) r3.push(n3), n3 = Uu2();
        if (r3 !== i2) {
          if (n3 = el2, (o3 = Gu2()) !== i2) {
            for (a3 = [], s3 = Yu2(); s3 !== i2; ) a3.push(s3), s3 = Yu2();
            a3 !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2);
          } else el2 = n3, n3 = i2;
          if (n3 === i2) if (n3 = [], (o3 = Yu2()) !== i2) for (; o3 !== i2; ) n3.push(o3), o3 = Yu2();
          else n3 = i2;
          if (n3 !== i2) {
            for (o3 = [], a3 = el2, s3 = [], l3 = Uu2(); l3 !== i2; ) s3.push(l3), l3 = Uu2();
            if (s3 !== i2 && (l3 = Gu2()) !== i2 ? a3 = s3 = [s3, l3] : (el2 = a3, a3 = i2), a3 !== i2) for (; a3 !== i2; ) {
              for (o3.push(a3), a3 = el2, s3 = [], l3 = Uu2(); l3 !== i2; ) s3.push(l3), l3 = Uu2();
              s3 !== i2 && (l3 = Gu2()) !== i2 ? a3 = s3 = [s3, l3] : (el2 = a3, a3 = i2);
            }
            else o3 = i2;
            if (o3 === i2 && (o3 = el2, ol2++, a3 = gl2(), ol2--, a3 !== i2 ? (el2 = o3, o3 = void 0) : o3 = i2, o3 === i2 && (o3 = ju2())), o3 !== i2) {
              for (a3 = [], (s3 = Uu2()) === i2 && (s3 = Gu2()) === i2 && (s3 = Yu2()); s3 !== i2; ) a3.push(s3), (s3 = Uu2()) === i2 && (s3 = Gu2()) === i2 && (s3 = Yu2());
              a3 !== i2 ? t3 = r3 = [r3, n3, o3, a3] : (el2 = t3, t3 = i2);
            } else el2 = t3, t3 = i2;
          } else el2 = t3, t3 = i2;
        } else el2 = t3, t3 = i2;
      }
      return t3 !== i2 && (tl2 = e7, t3 = $o2()), ol2--, (e7 = t3) === i2 && (t3 = i2, 0 === ol2 && pl2(Wo2)), e7;
    }
    function Ju2() {
      var e7, r3, n3, o3, a3;
      return ol2++, e7 = el2, Xu2() !== i2 && Ou2() !== i2 ? (92 === t2.charCodeAt(el2) ? (r3 = io2, el2++) : (r3 = i2, 0 === ol2 && pl2(oo2)), r3 !== i2 && Xu2() !== i2 ? (42 === t2.charCodeAt(el2) ? (n3 = ut2, el2++) : (n3 = i2, 0 === ol2 && pl2(ct2)), n3 === i2 && (n3 = null), n3 !== i2 && Xu2() !== i2 ? (o3 = el2, Qu2() !== i2 && Xu2() !== i2 && (a3 = jl2()) !== i2 && ec2() !== i2 && Xu2() !== i2 ? (tl2 = o3, o3 = Jo2(a3)) : (el2 = o3, o3 = i2), o3 === i2 && (o3 = null), o3 !== i2 ? (tl2 = e7, e7 = Ko2(o3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), ol2--, e7 === i2 && (0 === ol2 && pl2(Zo2)), e7;
    }
    function Ku2() {
      var e7, r3, n3, o3, a3, s3;
      return e7 = el2, (r3 = Xu2()) !== i2 && (n3 = Ou2()) !== i2 ? (t2.substr(el2, 3) === Qo2 ? (o3 = Qo2, el2 += 3) : (o3 = i2, 0 === ol2 && pl2(ea2)), o3 === i2 && (t2.substr(el2, 7) === ta2 ? (o3 = ta2, el2 += 7) : (o3 = i2, 0 === ol2 && pl2(ra2))), o3 !== i2 ? (a3 = el2, ol2++, s3 = tc2(), ol2--, s3 === i2 ? a3 = void 0 : (el2 = a3, a3 = i2), a3 !== i2 ? e7 = r3 = [r3, n3, o3, a3] : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7;
    }
    function Qu2() {
      var e7, r3;
      return e7 = el2, 91 === t2.charCodeAt(el2) ? (r3 = Kr2, el2++) : (r3 = i2, 0 === ol2 && pl2(Qr2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function ec2() {
      var e7, r3;
      return e7 = el2, 93 === t2.charCodeAt(el2) ? (r3 = en2, el2++) : (r3 = i2, 0 === ol2 && pl2(tn2)), r3 !== i2 && (tl2 = e7, r3 = v2()), e7 = r3;
    }
    function tc2() {
      var e7, r3;
      return ol2++, e7 = el2, ia2.test(t2.charAt(el2)) ? (r3 = t2.charAt(el2), el2++) : (r3 = i2, 0 === ol2 && pl2(oa2)), r3 !== i2 && (tl2 = e7, r3 = aa2(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(na2)), e7;
    }
    function rc2() {
      var e7, r3;
      return ol2++, e7 = el2, la2.test(t2.charAt(el2)) ? (r3 = t2.charAt(el2), el2++) : (r3 = i2, 0 === ol2 && pl2(ua2)), r3 !== i2 && (tl2 = e7, r3 = ca2(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(sa2)), e7;
    }
    function nc2() {
      var e7, r3;
      return ol2++, e7 = el2, 91 === t2.charCodeAt(el2) ? (r3 = Kr2, el2++) : (r3 = i2, 0 === ol2 && pl2(Qr2)), r3 !== i2 && (tl2 = e7, r3 = xa(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(va)), e7;
    }
    function ic2() {
      var e7, r3;
      return ol2++, e7 = el2, 93 === t2.charCodeAt(el2) ? (r3 = en2, el2++) : (r3 = i2, 0 === ol2 && pl2(tn2)), r3 !== i2 && (tl2 = e7, r3 = xa(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(wa)), e7;
    }
    function oc2() {
      var e7, r3, n3;
      return ol2++, e7 = el2, r3 = el2, ol2++, (n3 = Uu2()) === i2 && (n3 = Gu2()) === i2 && (n3 = Ou2()) === i2 && (n3 = Fu2()) === i2 && (n3 = Ru2()) === i2 && (n3 = Hu2()) === i2 && (n3 = Vu2()) === i2 && (n3 = (function() {
        var e8, r4;
        return ol2++, e8 = el2, 35 === t2.charCodeAt(el2) ? (r4 = bo2, el2++) : (r4 = i2, 0 === ol2 && pl2(yo2)), r4 !== i2 && (tl2 = e8, r4 = v2()), ol2--, (e8 = r4) === i2 && (r4 = i2, 0 === ol2 && pl2(fo2)), e8;
      })(), n3 === i2 && (n3 = Iu2()) === i2 && (n3 = Pu2()) === i2 && (n3 = (function() {
        var e8, r4;
        return e8 = el2, 0 === t2.charCodeAt(el2) ? (r4 = Ao2, el2++) : (r4 = i2, 0 === ol2 && pl2(_o2)), r4 !== i2 && (tl2 = e8, r4 = v2()), r4;
      })(), n3 === i2 && (n3 = Yu2()) === i2 && (n3 = Qu2()) === i2 && (n3 = ec2()))), ol2--, n3 === i2 ? r3 = void 0 : (el2 = r3, r3 = i2), r3 !== i2 ? (t2.length > el2 ? (n3 = t2.charAt(el2), el2++) : (n3 = i2, 0 === ol2 && pl2(u2)), n3 !== i2 ? (tl2 = e7, e7 = r3 = Aa(n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(ka)), e7;
    }
    function ac2() {
      var e7, r3;
      return ol2++, e7 = el2, t2.substr(el2, 3) === Ca ? (r3 = Ca, el2 += 3) : (r3 = i2, 0 === ol2 && pl2(za2)), r3 === i2 && (t2.substr(el2, 3) === Ta2 ? (r3 = Ta2, el2 += 3) : (r3 = i2, 0 === ol2 && pl2(Ma2)), r3 === i2 && (t2.substr(el2, 2) === Ea2 ? (r3 = Ea2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Da2)), r3 === i2 && (t2.substr(el2, 2) === La2 ? (r3 = La2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Ba2)), r3 === i2 && (t2.substr(el2, 2) === Na2 ? (r3 = Na2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Oa2)), r3 === i2 && (t2.substr(el2, 3) === Fa2 ? (r3 = Fa2, el2 += 3) : (r3 = i2, 0 === ol2 && pl2(Ra2)), r3 === i2 && (t2.substr(el2, 2) === Ha2 ? (r3 = Ha2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Va2)), r3 === i2 && (t2.substr(el2, 2) === Ia2 ? (r3 = Ia2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Pa2)), r3 === i2 && (t2.substr(el2, 2) === ja2 ? (r3 = ja2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Ga2)), r3 === i2 && (t2.substr(el2, 2) === Ua2 ? (r3 = Ua2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Ya2)), r3 === i2 && (t2.substr(el2, 2) === Xa2 ? (r3 = Xa2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Wa2)), r3 === i2 && (t2.substr(el2, 2) === $a2 ? (r3 = $a2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Za2)), r3 === i2 && (t2.substr(el2, 2) === Ja2 ? (r3 = Ja2, el2 += 2) : (r3 = i2, 0 === ol2 && pl2(Ka2)))))))))))))), r3 !== i2 && (tl2 = e7, r3 = Qa2(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(qa)), e7;
    }
    function sc2() {
      var e7, r3, n3;
      return e7 = el2, (r3 = cc2()) !== i2 && (tl2 = e7, r3 = ks2(r3)), (e7 = r3) === i2 && (e7 = el2, 39 === t2.charCodeAt(el2) ? (r3 = or2, el2++) : (r3 = i2, 0 === ol2 && pl2(ar2)), r3 !== i2 ? (n3 = (function() {
        var e8, r4, n4;
        ol2++, e8 = el2, r4 = [], Ds2.test(t2.charAt(el2)) ? (n4 = t2.charAt(el2), el2++) : (n4 = i2, 0 === ol2 && pl2(Ls2));
        if (n4 !== i2) for (; n4 !== i2; ) r4.push(n4), Ds2.test(t2.charAt(el2)) ? (n4 = t2.charAt(el2), el2++) : (n4 = i2, 0 === ol2 && pl2(Ls2));
        else r4 = i2;
        e8 = r4 !== i2 ? t2.substring(e8, el2) : r4;
        ol2--, e8 === i2 && (r4 = i2, 0 === ol2 && pl2(Es2));
        return e8;
      })(), n3 !== i2 ? (tl2 = e7, e7 = r3 = As2(n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2), e7 === i2 && (e7 = el2, 34 === t2.charCodeAt(el2) ? (r3 = _s2, el2++) : (r3 = i2, 0 === ol2 && pl2(Ss2)), r3 !== i2 ? ((n3 = uc2()) === i2 && (n3 = lc2()), n3 !== i2 ? (tl2 = e7, e7 = r3 = qs2(n3)) : (el2 = e7, e7 = i2)) : (el2 = e7, e7 = i2))), e7;
    }
    function lc2() {
      var e7, r3, n3, o3, a3;
      return ol2++, e7 = el2, r3 = el2, n3 = el2, (o3 = hc2()) !== i2 && (a3 = hc2()) !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2), (r3 = n3 !== i2 ? t2.substring(r3, el2) : n3) !== i2 && (tl2 = e7, r3 = zs2(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(Cs2)), e7;
    }
    function uc2() {
      var e7, r3, n3, o3, a3, s3, l3;
      return ol2++, e7 = el2, r3 = el2, n3 = el2, (o3 = hc2()) !== i2 && (a3 = hc2()) !== i2 && (s3 = hc2()) !== i2 && (l3 = hc2()) !== i2 ? n3 = o3 = [o3, a3, s3, l3] : (el2 = n3, n3 = i2), (r3 = n3 !== i2 ? t2.substring(r3, el2) : n3) !== i2 && (tl2 = e7, r3 = zs2(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(Ts2)), e7;
    }
    function cc2() {
      var e7, r3, n3;
      if (ol2++, e7 = el2, r3 = [], la2.test(t2.charAt(el2)) ? (n3 = t2.charAt(el2), el2++) : (n3 = i2, 0 === ol2 && pl2(ua2)), n3 !== i2) for (; n3 !== i2; ) r3.push(n3), la2.test(t2.charAt(el2)) ? (n3 = t2.charAt(el2), el2++) : (n3 = i2, 0 === ol2 && pl2(ua2));
      else r3 = i2;
      return e7 = r3 !== i2 ? t2.substring(e7, el2) : r3, ol2--, e7 === i2 && (r3 = i2, 0 === ol2 && pl2(Ms2)), e7;
    }
    function hc2() {
      var e7;
      return ol2++, Ns2.test(t2.charAt(el2)) ? (e7 = t2.charAt(el2), el2++) : (e7 = i2, 0 === ol2 && pl2(Os2)), ol2--, e7 === i2 && 0 === ol2 && pl2(Bs2), e7;
    }
    function pc2() {
      var e7, r3, n3, o3, a3, s3, l3, u3, c3;
      return ol2++, e7 = el2, r3 = el2, n3 = el2, Rs2.test(t2.charAt(el2)) ? (o3 = t2.charAt(el2), el2++) : (o3 = i2, 0 === ol2 && pl2(Hs2)), o3 === i2 && (o3 = null), o3 !== i2 ? (a3 = el2, (s3 = cc2()) !== i2 ? (l3 = el2, 46 === t2.charCodeAt(el2) ? (u3 = Wr2, el2++) : (u3 = i2, 0 === ol2 && pl2($r2)), u3 !== i2 ? ((c3 = cc2()) === i2 && (c3 = null), c3 !== i2 ? l3 = u3 = [u3, c3] : (el2 = l3, l3 = i2)) : (el2 = l3, l3 = i2), l3 === i2 && (l3 = null), l3 !== i2 ? a3 = s3 = [s3, l3] : (el2 = a3, a3 = i2)) : (el2 = a3, a3 = i2), a3 === i2 && (a3 = el2, 46 === t2.charCodeAt(el2) ? (s3 = Wr2, el2++) : (s3 = i2, 0 === ol2 && pl2($r2)), s3 !== i2 && (l3 = cc2()) !== i2 ? a3 = s3 = [s3, l3] : (el2 = a3, a3 = i2)), a3 !== i2 ? n3 = o3 = [o3, a3] : (el2 = n3, n3 = i2)) : (el2 = n3, n3 = i2), (r3 = n3 !== i2 ? t2.substring(r3, el2) : n3) !== i2 && (tl2 = e7, r3 = Vs2(r3)), ol2--, (e7 = r3) === i2 && (r3 = i2, 0 === ol2 && pl2(Fs2)), e7;
    }
    var { Vector: dc2 } = f, mc2 = r2.generator;
    if (mc2.setErrorFn(al2), mc2.location = function() {
      return hl2(tl2, el2);
    }, (n2 = a2()) !== i2 && el2 === t2.length) return n2;
    throw n2 !== i2 && el2 < t2.length && pl2({ type: "end" }), (function(t3, r3, n3) {
      return new e6(e6.buildMessage(t3, r3), t3, r3, n3);
    })(il2, nl2 < t2.length ? t2.charAt(nl2) : null, nl2 < t2.length ? hl2(nl2, nl2 + 1) : hl2(nl2, nl2));
  } };
})();
u = /* @__PURE__ */ new Map([["ff", l.decode("&fflig;")], ["ffi", l.decode("&ffilig;")], ["ffl", l.decode("&ffllig;")], ["fi", l.decode("&filig;")], ["fl", l.decode("&fllig;")], ["``", l.decode("&ldquo;")], ["''", l.decode("&rdquo;")], ["!´", l.decode("&iexcl;")], ["?´", l.decode("&iquest;")], ["--", l.decode("&ndash;")], ["---", l.decode("&mdash;")], ["<<", l.decode("&laquo;")], [">>", l.decode("&raquo;")], ['"`', l.decode("&bdquo;")], [`"'`, l.decode("&ldquo;")]]), c = /* @__PURE__ */ new Map([["b", ["̲", "_"]], ["c", ["̧", "¸"]], ["d", ["̣", "​ ̣"]], ["H", ["̋", "˝"]], ["k", ["̨", "˛"]], ["r", ["̊", "˚"]], ["t", ["͡", "​ ͡"]], ["u", ["̆", "˘"]], ["v", ["̌", "ˇ"]], ['"', ["̈", "¨"]], ["~", ["̃", "~"]], ["^", ["̂", "^"]], ["`", ["̀", "`"]], ["'", ["́", "´"]], ["=", ["̄", "¯"]], [".", ["̇", "˙"]]]), h = /* @__PURE__ */ new Map([["space", " "], ["nobreakspace", l.decode("&nbsp;")], ["thinspace", l.decode("&thinsp;")], ["enspace", l.decode("&ensp;")], ["enskip", l.decode("&ensp;")], ["quad", l.decode("&emsp;")], ["qquad", l.decode("&emsp;&emsp;")], ["textvisiblespace", l.decode("&blank;")], ["textcompwordmark", l.decode("&zwnj;")], ["textdollar", "$"], ["$", "$"], ["slash", l.decode("&sol;")], ["textless", "<"], ["textgreater", ">"], ["textbackslash", "\\"], ["textasciicircum", "^"], ["textunderscore", "_"], ["_", "_"], ["lbrack", "["], ["rbrack", "]"], ["textbraceleft", "{"], ["{", "{"], ["textbraceright", "}"], ["}", "}"], ["textasciitilde", "˜"], ["AA", "Å"], ["aa", "å"], ["AE", l.decode("&AElig;")], ["ae", l.decode("&aelig;")], ["OE", l.decode("&OElig;")], ["oe", l.decode("&oelig;")], ["DH", l.decode("&ETH;")], ["dh", l.decode("&eth;")], ["DJ", l.decode("&Dstrok;")], ["dj", l.decode("&dstrok;")], ["NG", l.decode("&ENG;")], ["ng", l.decode("&eng;")], ["TH", l.decode("&THORN;")], ["th", l.decode("&thorn;")], ["O", l.decode("&Oslash;")], ["o", l.decode("&oslash;")], ["i", l.decode("&imath;")], ["j", l.decode("&jmath;")], ["L", l.decode("&Lstrok;")], ["l", l.decode("&lstrok;")], ["IJ", l.decode("&IJlig;")], ["ij", l.decode("&ijlig;")], ["SS", "ẞ"], ["ss", l.decode("&szlig;")], ["textquotesingle", "'"], ["textquoteleft", l.decode("&lsquo;")], ["lq", l.decode("&lsquo;")], ["textquoteright", l.decode("&rsquo;")], ["rq", l.decode("&rsquo;")], ["textquotedbl", l.decode("&quot;")], ["textquotedblleft", l.decode("&ldquo;")], ["textquotedblright", l.decode("&rdquo;")], ["quotesinglbase", l.decode("&sbquo;")], ["quotedblbase", l.decode("&bdquo;")], ["guillemotleft", l.decode("&laquo;")], ["guillemotright", l.decode("&raquo;")], ["guilsinglleft", l.decode("&lsaquo;")], ["guilsinglright", l.decode("&rsaquo;")], ["textasciigrave", "`"], ["textgravedbl", "˵"], ["textasciidieresis", l.decode("&die;")], ["textasciiacute", l.decode("&acute;")], ["textacutedbl", l.decode("&dblac;")], ["textasciimacron", l.decode("&macr;")], ["textasciicaron", l.decode("&caron;")], ["textasciibreve", l.decode("&breve;")], ["texttildelow", "˷"], ["textendash", l.decode("&ndash;")], ["textemdash", l.decode("&mdash;")], ["textellipsis", l.decode("&hellip;")], ["dots", l.decode("&hellip;")], ["ldots", l.decode("&hellip;")], ["textbullet", l.decode("&bull;")], ["textopenbullet", "◦"], ["textperiodcentered", l.decode("&middot;")], ["textdagger", l.decode("&dagger;")], ["dag", l.decode("&dagger;")], ["textdaggerdbl", l.decode("&Dagger;")], ["ddag", l.decode("&Dagger;")], ["textexclamdown", l.decode("&iexcl;")], ["textquestiondown", l.decode("&iquest;")], ["textinterrobang", "‽"], ["textinterrobangdown", "⸘"], ["textsection", l.decode("&sect;")], ["S", l.decode("&sect;")], ["textparagraph", l.decode("&para;")], ["P", l.decode("&para;")], ["textblank", "␢"], ["textlquill", "⁅"], ["textrquill", "⁆"], ["textlangle", "〈"], ["textrangle", "〉"], ["textlbrackdbl", "〚"], ["textrbrackdbl", "〛"], ["textcopyright", l.decode("&copy;")], ["copyright", l.decode("&copy;")], ["textregistered", l.decode("&reg;")], ["textcircledP", l.decode("&copysr;")], ["textservicemark", "℠"], ["texttrademark", l.decode("&trade;")], ["textmarried", "⚭"], ["textdivorced", "⚮"], ["textordfeminine", l.decode("&ordf;")], ["textordmasculine", l.decode("&ordm;")], ["textdegree", l.decode("&deg;")], ["textmu", l.decode("&micro;")], ["textbar", "|"], ["textbardbl", l.decode("&Vert;")], ["textbrokenbar", l.decode("&brvbar;")], ["textreferencemark", "※"], ["textdiscount", "⁒"], ["textcelsius", "℃"], ["textnumero", l.decode("&numero;")], ["textrecipe", l.decode("&rx;")], ["textestimated", "℮"], ["textbigcircle", l.decode("&xcirc;")], ["textmusicalnote", l.decode("&sung;")], ["textohm", "Ω"], ["textmho", "℧"], ["textleftarrow", l.decode("&larr;")], ["textuparrow", l.decode("&uarr;")], ["textrightarrow", l.decode("&rarr;")], ["textdownarrow", l.decode("&darr;")], ["textperthousand", l.decode("&permil;")], ["textpertenthousand", "‱"], ["textonehalf", l.decode("&frac12;")], ["textthreequarters", l.decode("&frac34;")], ["textonequarter", l.decode("&frac14;")], ["textfractionsolidus", l.decode("&frasl;")], ["textdiv", l.decode("&divide;")], ["texttimes", l.decode("&times;")], ["textminus", l.decode("&minus;")], ["textasteriskcentered", l.decode("&lowast;")], ["textpm", l.decode("&plusmn;")], ["textsurd", l.decode("&radic;")], ["textlnot", l.decode("&not;")], ["textonesuperior", l.decode("&sup1;")], ["texttwosuperior", l.decode("&sup2;")], ["textthreesuperior", l.decode("&sup3;")], ["texteuro", l.decode("&euro;")], ["textcent", l.decode("&cent;")], ["textsterling", l.decode("&pound;")], ["pounds", l.decode("&pound;")], ["textbaht", "฿"], ["textcolonmonetary", "₡"], ["textcurrency", "¤"], ["textdong", "₫"], ["textflorin", "ƒ"], ["textlira", "₤"], ["textnaira", "₦"], ["textpeso", "₱"], ["textwon", "₩"], ["textyen", "¥"]]), p = (function() {
  var e6, t2;
  function r2(e7, t3) {
    var r3, n2, i2, o2, a2, s2, l2 = this;
    this.g = e7, t3 && (this.options = t3), this.g.newCounter("part"), this.g.newCounter("section"), this.g.newCounter("subsection", "section"), this.g.newCounter("subsubsection", "subsection"), this.g.newCounter("paragraph", "subsubsection"), this.g.newCounter("subparagraph", "paragraph"), this.g.newCounter("figure"), this.g.newCounter("table"), this.g.setLength("paperheight", new this.g.Length(11, "in")), this.g.setLength("paperwidth", new this.g.Length(8.5, "in")), this.g.setLength("@@size", new this.g.Length(10, "pt")), this.options.forEach((function(e8, t4) {
      var r4, n3;
      switch (t4) {
        case "oneside":
        case "twoside":
        case "onecolumn":
        case "twocolumn":
        case "titlepage":
        case "notitlepage":
        case "fleqn":
        case "leqno":
          break;
        case "a4paper":
          return l2.g.setLength("paperheight", new l2.g.Length(297, "mm")), l2.g.setLength("paperwidth", new l2.g.Length(210, "mm"));
        case "a5paper":
          return l2.g.setLength("paperheight", new l2.g.Length(210, "mm")), l2.g.setLength("paperwidth", new l2.g.Length(148, "mm"));
        case "b5paper":
          return l2.g.setLength("paperheight", new l2.g.Length(250, "mm")), l2.g.setLength("paperwidth", new l2.g.Length(176, "mm"));
        case "letterpaper":
          return l2.g.setLength("paperheight", new l2.g.Length(11, "in")), l2.g.setLength("paperwidth", new l2.g.Length(8.5, "in"));
        case "legalpaper":
          return l2.g.setLength("paperheight", new l2.g.Length(14, "in")), l2.g.setLength("paperwidth", new l2.g.Length(8.5, "in"));
        case "executivepaper":
          return l2.g.setLength("paperheight", new l2.g.Length(10.5, "in")), l2.g.setLength("paperwidth", new l2.g.Length(7.25, "in"));
        case "landscape":
          return r4 = l2.g.length("paperheight"), l2.g.setLength("paperheight", l2.g.length("paperwidth")), l2.g.setLength("paperwidth", r4);
        default:
          if (NaN !== (n3 = parseFloat(t4)) && t4.endsWith("pt") && String(n3) === t4.substring(0, t4.length - 2)) return l2.g.setLength("@@size", new l2.g.Length(n3, "pt"));
      }
    })), r3 = new this.g.Length(345, "pt"), n2 = new this.g.Length(1, "in"), 1 === (i2 = this.g.length("paperwidth").sub(n2.mul(2))).cmp(r3) && (i2 = r3), this.g.setLength("textwidth", i2), this.g.setLength("marginparsep", new this.g.Length(11, "pt")), this.g.setLength("marginparpush", new this.g.Length(5, "pt")), a2 = (o2 = this.g.length("paperwidth").sub(this.g.length("textwidth"))).mul(0.5).sub(n2), 1 === (s2 = o2.mul(0.5).sub(this.g.length("marginparsep")).sub(n2.mul(0.8))).cmp(n2.mul(2)) && (s2 = n2.mul(2)), this.g.setLength("oddsidemargin", a2), this.g.setLength("marginparwidth", s2);
  }
  return r2.displayName = "Base", r2.prototype, e6 = r2.args = {}, r2.prototype.options = /* @__PURE__ */ new Map(), r2.prototype.contentsname = function() {
    return ["Contents"];
  }, r2.prototype.listfigurename = function() {
    return ["List of Figures"];
  }, r2.prototype.listtablename = function() {
    return ["List of Tables"];
  }, r2.prototype.partname = function() {
    return ["Part"];
  }, r2.prototype.figurename = function() {
    return ["Figure"];
  }, r2.prototype.tablename = function() {
    return ["Table"];
  }, r2.prototype.appendixname = function() {
    return ["Appendix"];
  }, r2.prototype.indexname = function() {
    return ["Index"];
  }, (t2 = e6).part = t2.section = t2.subsection = t2.subsubsection = t2.paragraph = t2.subparagraph = ["V", "s", "X", "o?", "g"], r2.prototype.part = function(e7, t3, r3) {
    return [this.g.startsection("part", 0, e7, t3, r3)];
  }, r2.prototype.section = function(e7, t3, r3) {
    return [this.g.startsection("section", 1, e7, t3, r3)];
  }, r2.prototype.subsection = function(e7, t3, r3) {
    return [this.g.startsection("subsection", 2, e7, t3, r3)];
  }, r2.prototype.subsubsection = function(e7, t3, r3) {
    return [this.g.startsection("subsubsection", 3, e7, t3, r3)];
  }, r2.prototype.paragraph = function(e7, t3, r3) {
    return [this.g.startsection("paragraph", 4, e7, t3, r3)];
  }, r2.prototype.subparagraph = function(e7, t3, r3) {
    return [this.g.startsection("subparagraph", 5, e7, t3, r3)];
  }, r2.prototype.thepart = function() {
    return [this.g.Roman(this.g.counter("part"))];
  }, r2.prototype.thesection = function() {
    return [this.g.arabic(this.g.counter("section"))];
  }, r2.prototype.thesubsection = function() {
    return this.thesection().concat("." + this.g.arabic(this.g.counter("subsection")));
  }, r2.prototype.thesubsubsection = function() {
    return this.thesubsection().concat("." + this.g.arabic(this.g.counter("subsubsection")));
  }, r2.prototype.theparagraph = function() {
    return this.thesubsubsection().concat("." + this.g.arabic(this.g.counter("paragraph")));
  }, r2.prototype.thesubparagraph = function() {
    return this.theparagraph().concat("." + this.g.arabic(this.g.counter("subparagraph")));
  }, e6.maketitle = ["V"], r2.prototype.maketitle = function() {
    var e7, t3, r3, n2, i2;
    return this.g.setTitle(this._title), e7 = this.g.create(this.g.title, this._title), t3 = this.g.create(this.g.author, this._author), r3 = this.g.create(this.g.date, (n2 = this._date) ? n2 : this.g.macro("today")), i2 = this.g.create(this.g.list, [this.g.createVSpace(new this.g.Length(2, "em")), e7, this.g.createVSpace(new this.g.Length(1.5, "em")), t3, this.g.createVSpace(new this.g.Length(1, "em")), r3, this.g.createVSpace(new this.g.Length(1.5, "em"))], "center"), this.g.setCounter("footnote", 0), this._title = null, this._author = null, this._date = null, this._thanks = null, this.title = this.author = this.date = this.thanks = this.and = this.maketitle = function() {
    }, [i2];
  }, r2;
})(), d = (function(e6) {
  var t2;
  function r2(e7, t3) {
    r2.superclass.apply(this, arguments), this.g.setCounter("secnumdepth", 3), this.g.setCounter("tocdepth", 3);
  }
  return (function(e7, t3) {
    function r3() {
    }
    r3.prototype = (e7.superclass = t3).prototype, (e7.prototype = new r3()).constructor = e7, "function" == typeof t3.extended && t3.extended(e7);
    return e7;
  })(((function(e7, t3) {
    var r3 = {}.hasOwnProperty;
    for (var n2 in t3) r3.call(t3, n2) && (e7[n2] = t3[n2]);
    return e7;
  })(r2, e6).displayName = "Article", r2), e6).prototype, r2.css = "css/article.css", t2 = r2.args = p.args, r2.prototype.refname = function() {
    return ["References"];
  }, t2.tableofcontents = ["V"], r2.prototype.tableofcontents = function() {
    return this.section(true, void 0, this.g.macro("contentsname")).concat([this.g._toc]);
  }, t2.abstract = ["V"], r2.prototype.abstract = function() {
    var e7;
    return this.g.setFontSize("small"), this.g.enterGroup(), this.g.setFontWeight("bf"), e7 = this.g.create(this.g.list, this.g.macro("abstractname"), "center"), this.g.exitGroup(), [e7].concat(this.quotation());
  }, r2.prototype.endabstract = function() {
    this.endquotation();
  }, t2.appendix = ["V"], r2.prototype.appendix = function() {
    this.g.setCounter("section", 0), this.g.setCounter("subsection", 0), this.thesection = function() {
      return [this.g.Alph(this.g.counter("section"))];
    };
  }, r2;
})(p), m = (function(e6) {
  var t2, r2;
  function n2(e7, t3) {
    n2.superclass.apply(this, arguments), this.g.newCounter("chapter"), this.g.addToReset("section", "chapter"), this.g.setCounter("secnumdepth", 2), this.g.setCounter("tocdepth", 2), this.g.addToReset("figure", "chapter"), this.g.addToReset("table", "chapter"), this.g.addToReset("footnote", "chapter");
  }
  return (function(e7, t3) {
    function r3() {
    }
    r3.prototype = (e7.superclass = t3).prototype, (e7.prototype = new r3()).constructor = e7, "function" == typeof t3.extended && t3.extended(e7);
    return e7;
  })(((function(e7, t3) {
    var r3 = {}.hasOwnProperty;
    for (var n3 in t3) r3.call(t3, n3) && (e7[n3] = t3[n3]);
    return e7;
  })(n2, e6).displayName = "Report", n2), e6).prototype, n2.css = "css/book.css", n2.prototype.chaptername = function() {
    return ["Chapter"];
  }, n2.prototype.bibname = function() {
    return ["Bibliography"];
  }, (r2 = t2 = n2.args = p.args).part = r2.chapter = ["V", "s", "X", "o?", "g"], n2.prototype.part = function(e7, t3, r3) {
    return [this.g.startsection("part", -1, e7, t3, r3)];
  }, n2.prototype.chapter = function(e7, t3, r3) {
    return [this.g.startsection("chapter", 0, e7, t3, r3)];
  }, n2.prototype.thechapter = function() {
    return [this.g.arabic(this.g.counter("chapter"))];
  }, n2.prototype.thesection = function() {
    return this.thechapter().concat("." + this.g.arabic(this.g.counter("section")));
  }, n2.prototype.thefigure = function() {
    return (this.g.counter("chapter") > 0 ? this.thechapter().concat(".") : []).concat(this.g.arabic(this.g.counter("figure")));
  }, n2.prototype.thetable = function() {
    return (this.g.counter("chapter") > 0 ? this.thechapter().concat(".") : []).concat(this.g.arabic(this.g.counter("table")));
  }, t2.tableofcontents = ["V"], n2.prototype.tableofcontents = function() {
    return this.chapter(true, void 0, this.g.macro("contentsname")).concat([this.g._toc]);
  }, t2.abstract = ["V"], n2.prototype.abstract = function() {
    var e7;
    return this.g.setFontSize("small"), this.g.enterGroup(), this.g.setFontWeight("bf"), e7 = this.g.create(this.g.list, this.g.macro("abstractname"), "center"), this.g.exitGroup(), [e7].concat(this.quotation());
  }, n2.prototype.endabstract = function() {
    this.endquotation();
  }, t2.appendix = ["V"], n2.prototype.appendix = function() {
    this.g.setCounter("chapter", 0), this.g.setCounter("section", 0), this.chaptername = this.appendixname, this.thechapter = function() {
      return [this.g.Alph(this.g.counter("chapter"))];
    };
  }, n2;
})(p), g = (function(e6) {
  var t2, r2, n2;
  function i2(e7, t3) {
    i2.superclass.apply(this, arguments), this["@mainmatter"] = true;
  }
  return (function(e7, t3) {
    function r3() {
    }
    r3.prototype = (e7.superclass = t3).prototype, (e7.prototype = new r3()).constructor = e7, "function" == typeof t3.extended && t3.extended(e7);
    return e7;
  })(((function(e7, t3) {
    var r3 = {}.hasOwnProperty;
    for (var n3 in t3) r3.call(t3, n3) && (e7[n3] = t3[n3]);
    return e7;
  })(i2, e6).displayName = "Book", i2), e6).prototype, i2.css = "css/book.css", (r2 = t2 = i2.args = m.args).part = r2.chapter = ["V", "s", "X", "o?", "g"], i2.prototype.chapter = function(e7, t3, r3) {
    return [this.g.startsection("chapter", 0, e7 || !this["@mainmatter"], t3, r3)];
  }, (n2 = t2).frontmatter = n2.mainmatter = n2.backmatter = ["V"], i2.prototype.frontmatter = function() {
    this["@mainmatter"] = false;
  }, i2.prototype.mainmatter = function() {
    this["@mainmatter"] = true;
  }, i2.prototype.backmatter = function() {
    this["@mainmatter"] = false;
  }, i2;
})(m);
var y, v, x, w, k, A = { article: d, book: g, report: m };
y = (function() {
  var e6, t2;
  function r2(e7, t3) {
    var r3, n2, i2, o2;
    for (this.g = e7, t3 && (this.options = t3), r3 = 0, i2 = (n2 = this.options).length; r3 < i2; ++r3) o2 = n2[r3], o2 = Object.keys(o2)[0];
  }
  return r2.displayName = "XColor", r2.prototype, e6 = r2.args = {}, t2 = r2.colors = /* @__PURE__ */ new Map([["red", {}], ["green", {}], ["blue", {}], ["cyan", {}], ["magenta", {}], ["yellow", {}], ["black", {}], ["gray", {}], ["white", {}], ["darkgray", {}], ["lightgray", {}], ["brown", {}], ["lime", {}], ["olive", {}], ["orange", {}], ["pink", {}], ["purple", {}], ["teal", {}], ["violet", {}]]), e6.definecolorset = ["P", "i?", "c-ml", "ie", "ie", "c-ssp"], r2.prototype.definecolorset = function(e7, t3, r3, n2, i2) {
    var o2, a2, s2;
    for (null !== e7 && "named" !== e7 && "ps" !== e7 && this.g.error("unknown color type"), r3 || (r3 = ""), n2 || (n2 = ""), o2 = 0, a2 = i2.length; o2 < a2; ++o2) s2 = i2[o2], this.definecolor(e7, r3 + s2.name + n2, t3, s2.speclist);
  }, e6.definecolor = ["P", "i?", "i", "c-ml", "c-spl"], r2.prototype.definecolor = function(e7, r3, n2, i2) {
    var o2, a2, s2, l2, u2;
    for (null !== e7 && "named" !== e7 && "ps" !== e7 && this.g.error("unknown color type"), n2.models.length !== i2.length && this.g.error("color models and specs don't match"), o2 = {}, a2 = 0, l2 = (s2 = n2.models).length; a2 < l2; ++a2) u2 = a2, o2[s2[a2]] = i2[u2];
    t2.set(r3, o2);
  }, e6.color = ["HV", [["c-ml?", "c-spl"], ["c"]]], r2.prototype.color = function() {
    1 === arguments.length ? console.log("got color expression") : console.log("got model/color spec");
  }, e6.textcolor = ["HV", [["c-ml?", "c-spl"], ["c"]], "g"], r2.prototype.textcolor = function() {
  }, e6.colorbox = ["H", "i?", "c", "g"], r2.prototype.colorbox = function(e7, t3, r3) {
  }, e6.fcolorbox = ["H", "i?", "c", "c", "g"], r2.prototype.fcolorbox = function(e7, t3, r3) {
  }, r2;
})(), v = y, x = (function() {
  var e6;
  function t2(e7, t3) {
  }
  return t2.displayName = "Echo", t2.prototype, (e6 = t2.args = {}).gobbleO = ["H", "o?"], t2.prototype.gobbleO = function() {
    return [];
  }, e6.echoO = ["H", "o?"], t2.prototype.echoO = function(e7) {
    return ["-", e7, "-"];
  }, e6.echoOGO = ["H", "o?", "g", "o?"], t2.prototype.echoOGO = function(e7, t3, r2) {
    var n2;
    return n2 = [], e7 && n2.push("-", e7, "-"), n2.push("+", t3, "+"), r2 && n2.push("-", r2, "-"), n2;
  }, e6.echoGOG = ["H", "g", "o?", "g"], t2.prototype.echoGOG = function(e7, t3, r2) {
    var n2;
    return n2 = ["+", e7, "+"], t3 && n2.push("-", t3, "-"), n2.push("+", r2, "+"), n2;
  }, t2;
})(), w = (function() {
  function e6(e7, t2) {
  }
  return e6.displayName = "Gensymb", e6.prototype, e6.args = {}, e6.symbols = /* @__PURE__ */ new Map([["degree", l.decode("&deg;")], ["celsius", "℃"], ["perthousand", l.decode("&permil;")], ["ohm", "Ω"], ["micro", l.decode("&mu;")]]), e6;
})(), k = (function() {
  var e6;
  function t2(e7, t3) {
  }
  return t2.displayName = "Graphicx", t2.prototype, (e6 = t2.args = {}).rotatebox = ["H", "kv?", "n", "hg"], t2.prototype.rotatebox = function(e7, t3, r2) {
  }, e6.scalebox = ["H", "n", "n?", "g"], t2.prototype.scalebox = function(e7, t3, r2) {
  }, e6.reflectbox = ["H", "g"], t2.prototype.reflectbox = function(e7) {
    return this.scalebox(-1, 1, e7);
  }, e6.resizebox = ["H", "s", "l", "l", "g"], t2.prototype.resizebox = function(e7, t3, r2, n2) {
  }, e6.graphicspath = ["HV", "gl"], t2.prototype.graphicspath = function(e7) {
  }, e6.includegraphics = ["H", "s", "kv?", "kv?", "k"], t2.prototype.includegraphics = function(e7, t3, r2, n2) {
    return [this.g.createImage(t3.get("width"), t3.get("height"), n2)];
  }, t2;
})();
var _ = { color: v, xcolor: y, echo: x, gensymb: w, graphics: k, graphicx: k, hyperref: (function() {
  var e6;
  function t2(e7, t3) {
  }
  return t2.displayName = "Hyperref", t2.prototype, (e6 = t2.args = {}).href = ["H", "o?", "u", "g"], t2.prototype.href = function(e7, t3, r2) {
    return [this.g.create(this.g.link(t3), r2)];
  }, e6.url = ["H", "u"], t2.prototype.url = function(e7) {
    return [this.g.create(this.g.link(e7), this.g.createText(e7))];
  }, e6.nolinkurl = ["H", "u"], t2.prototype.nolinkurl = function(e7) {
    return [this.g.create(this.g.link(), this.g.createText(e7))];
  }, t2;
})(), latexsym: (function() {
  function e6(e7, t2) {
  }
  return e6.displayName = "Latexsym", e6.prototype, e6.args = {}, e6.symbols = /* @__PURE__ */ new Map([["mho", "℧"], ["Join", "⨝"], ["Box", "□"], ["Diamond", "◇"], ["leadsto", "⤳"], ["sqsubset", "⊏"], ["sqsupset", "⊐"], ["lhd", "⊲"], ["unlhd", "⊴"], ["rhd", "⊳"], ["unrhd", "⊵"]]), e6;
})(), multicol: (function() {
  function e6(e7, t2) {
  }
  return e6.displayName = "Multicol", e6.prototype, (e6.args = {}).multicols = ["V", "n", "o?", "o?"], e6.prototype.multicols = function(e7, t2) {
    return [t2, this.g.create(this.g.multicols(e7))];
  }, e6;
})(), stix: (function() {
  function e6(e7, t2) {
    e7.KaTeX.__defineSymbol("math", "main", "textord", "♤", "\\varspadesuit", true), e7.KaTeX.__defineSymbol("math", "main", "textord", "♥", "\\varheartsuit", true), e7.KaTeX.__defineSymbol("math", "main", "textord", "♦", "\\vardiamondsuit", true), e7.KaTeX.__defineSymbol("math", "main", "textord", "♧", "\\varclubsuit", true);
  }
  return e6.displayName = "Stix", e6.prototype, e6.args = {}, e6.symbols = /* @__PURE__ */ new Map([["checkmark", l.decode("&check;")]]), e6;
})(), textcomp: (function() {
  function e6(e7, t2) {
  }
  return e6.displayName = "Textcomp", e6.prototype, e6.args = {}, e6.symbols = /* @__PURE__ */ new Map([["textcentoldstyle", ""], ["textdollaroldstyle", ""], ["textguarani", "₲"], ["textcopyleft", "ἒF"], ["textzerooldstyle", ""], ["textoneoldstyle", ""], ["texttwooldstyle", ""], ["textthreeoldstyle", ""], ["textfouroldstyle", ""], ["textfiveoldstyle", ""], ["textsixoldstyle", ""], ["textsevenoldstyle", ""], ["texteightoldstyle", ""], ["textnineoldstyle", ""], ["textborn", "⭑"], ["textdied", l.decode("&dagger;")], ["textpilcrow", l.decode("&para;")], ["textdblhyphen", "⹀"]]), e6;
})(), textgreek: (function() {
  function e6(e7, t2) {
  }
  return e6.displayName = "Textgreek", e6.prototype, e6.args = {}, e6.symbols = /* @__PURE__ */ new Map([["textalpha", l.decode("&alpha;")], ["textbeta", l.decode("&beta;")], ["textgamma", l.decode("&gamma;")], ["textdelta", l.decode("&delta;")], ["textepsilon", l.decode("&epsilon;")], ["textzeta", l.decode("&zeta;")], ["texteta", l.decode("&eta;")], ["texttheta", l.decode("&thetasym;")], ["textiota", l.decode("&iota;")], ["textkappa", l.decode("&kappa;")], ["textlambda", l.decode("&lambda;")], ["textmu", l.decode("&mu;")], ["textmugreek", l.decode("&mu;")], ["textnu", l.decode("&nu;")], ["textxi", l.decode("&xi;")], ["textomikron", l.decode("&omicron;")], ["textpi", l.decode("&pi;")], ["textrho", l.decode("&rho;")], ["textsigma", l.decode("&sigma;")], ["texttau", l.decode("&tau;")], ["textupsilon", l.decode("&upsilon;")], ["textphi", l.decode("&phi;")], ["textchi", l.decode("&chi;")], ["textpsi", l.decode("&psi;")], ["textomega", l.decode("&omega;")], ["textAlpha", l.decode("&Alpha;")], ["textBeta", l.decode("&Beta;")], ["textGamma", l.decode("&Gamma;")], ["textDelta", l.decode("&Delta;")], ["textEpsilon", l.decode("&Epsilon;")], ["textZeta", l.decode("&Zeta;")], ["textEta", l.decode("&Eta;")], ["textTheta", l.decode("&Theta;")], ["textIota", l.decode("&Iota;")], ["textKappa", l.decode("&Kappa;")], ["textLambda", l.decode("&Lambda;")], ["textMu", l.decode("&Mu;")], ["textNu", l.decode("&Nu;")], ["textXi", l.decode("&Xi;")], ["textOmikron", l.decode("&Omicron;")], ["textPi", l.decode("&Pi;")], ["textRho", l.decode("&Rho;")], ["textSigma", l.decode("&Sigma;")], ["textTau", l.decode("&Tau;")], ["textUpsilon", l.decode("&Upsilon;")], ["textPhi", l.decode("&Phi;")], ["textChi", l.decode("&Chi;")], ["textPsi", l.decode("&Psi;")], ["textOmega", l.decode("&Omega;")], ["textvarsigma", l.decode("&sigmaf;")], ["straightphi", "ϕ"], ["scripttheta", "ϑ"], ["straighttheta", l.decode("&theta;")], ["straightepsilon", "ϵ"]]), e6;
})() }, S = "object" == typeof e && e && e.Object === Object && e, q = S, C = "object" == typeof self && self && self.Object === Object && self, z = q || C || Function("return this")(), T = z.Symbol, M = T, E = Object.prototype, D = E.hasOwnProperty, L = E.toString, B = M ? M.toStringTag : void 0;
var N = function(e6) {
  var t2 = D.call(e6, B), r2 = e6[B];
  try {
    e6[B] = void 0;
    var n2 = true;
  } catch (e7) {
  }
  var i2 = L.call(e6);
  return n2 && (t2 ? e6[B] = r2 : delete e6[B]), i2;
}, O = Object.prototype.toString;
var F = N, R = function(e6) {
  return O.call(e6);
}, H = T ? T.toStringTag : void 0;
var V = function(e6) {
  return null == e6 ? void 0 === e6 ? "[object Undefined]" : "[object Null]" : H && H in Object(e6) ? F(e6) : R(e6);
};
var I = function(e6) {
  var t2 = typeof e6;
  return null != e6 && ("object" == t2 || "function" == t2);
}, P = V, j = I;
var G, U = function(e6) {
  if (!j(e6)) return false;
  var t2 = P(e6);
  return "[object Function]" == t2 || "[object GeneratorFunction]" == t2 || "[object AsyncFunction]" == t2 || "[object Proxy]" == t2;
}, Y = z["__core-js_shared__"], X = (G = /[^.]+$/.exec(Y && Y.keys && Y.keys.IE_PROTO || "")) ? "Symbol(src)_1." + G : "";
var W = function(e6) {
  return !!X && X in e6;
}, $ = Function.prototype.toString;
var Z = U, J = W, K = I, Q = function(e6) {
  if (null != e6) {
    try {
      return $.call(e6);
    } catch (e7) {
    }
    try {
      return e6 + "";
    } catch (e7) {
    }
  }
  return "";
}, ee = /^\[object .+?Constructor\]$/, te = Function.prototype, re = Object.prototype, ne = te.toString, ie = re.hasOwnProperty, oe = RegExp("^" + ne.call(ie).replace(/[\\^$.*+?()[\]{}|]/g, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$");
var ae = function(e6) {
  return !(!K(e6) || J(e6)) && (Z(e6) ? oe : ee).test(Q(e6));
}, se = function(e6, t2) {
  return null == e6 ? void 0 : e6[t2];
};
var le = function(e6, t2) {
  var r2 = se(e6, t2);
  return ae(r2) ? r2 : void 0;
}, ue = (function() {
  try {
    var e6 = le(Object, "defineProperty");
    return e6({}, "", {}), e6;
  } catch (e7) {
  }
})(), ce = ue;
var he = function(e6, t2, r2) {
  "__proto__" == t2 && ce ? ce(e6, t2, { configurable: true, enumerable: true, value: r2, writable: true }) : e6[t2] = r2;
};
var pe = function(e6, t2) {
  return e6 === t2 || e6 != e6 && t2 != t2;
}, de = he, me = pe, ge = Object.prototype.hasOwnProperty;
var fe = function(e6, t2, r2) {
  var n2 = e6[t2];
  ge.call(e6, t2) && me(n2, r2) && (void 0 !== r2 || t2 in e6) || de(e6, t2, r2);
}, be = fe, ye = he;
var ve = function(e6, t2, r2, n2) {
  var i2 = !r2;
  r2 || (r2 = {});
  for (var o2 = -1, a2 = t2.length; ++o2 < a2; ) {
    var s2 = t2[o2], l2 = n2 ? n2(r2[s2], e6[s2], s2, r2, e6) : void 0;
    void 0 === l2 && (l2 = e6[s2]), i2 ? ye(r2, s2, l2) : be(r2, s2, l2);
  }
  return r2;
};
var xe = function(e6) {
  return e6;
};
var we = function(e6, t2, r2) {
  switch (r2.length) {
    case 0:
      return e6.call(t2);
    case 1:
      return e6.call(t2, r2[0]);
    case 2:
      return e6.call(t2, r2[0], r2[1]);
    case 3:
      return e6.call(t2, r2[0], r2[1], r2[2]);
  }
  return e6.apply(t2, r2);
}, ke = Math.max;
var Ae = function(e6, t2, r2) {
  return t2 = ke(void 0 === t2 ? e6.length - 1 : t2, 0), function() {
    for (var n2 = arguments, i2 = -1, o2 = ke(n2.length - t2, 0), a2 = Array(o2); ++i2 < o2; ) a2[i2] = n2[t2 + i2];
    i2 = -1;
    for (var s2 = Array(t2 + 1); ++i2 < t2; ) s2[i2] = n2[i2];
    return s2[t2] = r2(a2), we(e6, this, s2);
  };
};
var _e = function(e6) {
  return function() {
    return e6;
  };
}, Se = ue, qe = Se ? function(e6, t2) {
  return Se(e6, "toString", { configurable: true, enumerable: false, value: _e(t2), writable: true });
} : xe, Ce = Date.now;
var ze = /* @__PURE__ */ (function(e6) {
  var t2 = 0, r2 = 0;
  return function() {
    var n2 = Ce(), i2 = 16 - (n2 - r2);
    if (r2 = n2, i2 > 0) {
      if (++t2 >= 800) return arguments[0];
    } else t2 = 0;
    return e6.apply(void 0, arguments);
  };
})(qe), Te = xe, Me = Ae, Ee = ze;
var De = function(e6) {
  return "number" == typeof e6 && e6 > -1 && e6 % 1 == 0 && e6 <= 9007199254740991;
}, Le = U, Be = De;
var Ne = function(e6) {
  return null != e6 && Be(e6.length) && !Le(e6);
}, Oe = /^(?:0|[1-9]\d*)$/;
var Fe = function(e6, t2) {
  var r2 = typeof e6;
  return !!(t2 = null == t2 ? 9007199254740991 : t2) && ("number" == r2 || "symbol" != r2 && Oe.test(e6)) && e6 > -1 && e6 % 1 == 0 && e6 < t2;
}, Re = pe, He = Ne, Ve = Fe, Ie = I;
var Pe = function(e6, t2) {
  return Ee(Me(e6, t2, Te), e6 + "");
}, je = function(e6, t2, r2) {
  if (!Ie(r2)) return false;
  var n2 = typeof t2;
  return !!("number" == n2 ? He(r2) && Ve(t2, r2.length) : "string" == n2 && t2 in r2) && Re(r2[t2], e6);
};
var Ge = function(e6) {
  return Pe((function(t2, r2) {
    var n2 = -1, i2 = r2.length, o2 = i2 > 1 ? r2[i2 - 1] : void 0, a2 = i2 > 2 ? r2[2] : void 0;
    for (o2 = e6.length > 3 && "function" == typeof o2 ? (i2--, o2) : void 0, a2 && je(r2[0], r2[1], a2) && (o2 = i2 < 3 ? void 0 : o2, i2 = 1), t2 = Object(t2); ++n2 < i2; ) {
      var s2 = r2[n2];
      s2 && e6(t2, s2, n2, o2);
    }
    return t2;
  }));
}, Ue = Object.prototype;
var Ye = function(e6) {
  var t2 = e6 && e6.constructor;
  return e6 === ("function" == typeof t2 && t2.prototype || Ue);
};
var Xe = function(e6, t2) {
  for (var r2 = -1, n2 = Array(e6); ++r2 < e6; ) n2[r2] = t2(r2);
  return n2;
};
var We = function(e6) {
  return null != e6 && "object" == typeof e6;
}, $e = V, Ze = We;
var Je = function(e6) {
  return Ze(e6) && "[object Arguments]" == $e(e6);
}, Ke = We, Qe = Object.prototype, et = Qe.hasOwnProperty, tt = Qe.propertyIsEnumerable, rt = Je(/* @__PURE__ */ (function() {
  return arguments;
})()) ? Je : function(e6) {
  return Ke(e6) && et.call(e6, "callee") && !tt.call(e6, "callee");
}, nt = Array.isArray, it = { exports: {} };
var ot = function() {
  return false;
};
!(function(e6, t2) {
  var r2 = z, n2 = ot, i2 = t2 && !t2.nodeType && t2, o2 = i2 && e6 && !e6.nodeType && e6, a2 = o2 && o2.exports === i2 ? r2.Buffer : void 0, s2 = (a2 ? a2.isBuffer : void 0) || n2;
  e6.exports = s2;
})(it, it.exports);
var at = it.exports, st = V, lt = De, ut = We, ct = {};
ct["[object Float32Array]"] = ct["[object Float64Array]"] = ct["[object Int8Array]"] = ct["[object Int16Array]"] = ct["[object Int32Array]"] = ct["[object Uint8Array]"] = ct["[object Uint8ClampedArray]"] = ct["[object Uint16Array]"] = ct["[object Uint32Array]"] = true, ct["[object Arguments]"] = ct["[object Array]"] = ct["[object ArrayBuffer]"] = ct["[object Boolean]"] = ct["[object DataView]"] = ct["[object Date]"] = ct["[object Error]"] = ct["[object Function]"] = ct["[object Map]"] = ct["[object Number]"] = ct["[object Object]"] = ct["[object RegExp]"] = ct["[object Set]"] = ct["[object String]"] = ct["[object WeakMap]"] = false;
var ht = function(e6) {
  return ut(e6) && lt(e6.length) && !!ct[st(e6)];
};
var pt = function(e6) {
  return function(t2) {
    return e6(t2);
  };
}, dt = { exports: {} };
!(function(e6, t2) {
  var r2 = S, n2 = t2 && !t2.nodeType && t2, i2 = n2 && e6 && !e6.nodeType && e6, o2 = i2 && i2.exports === n2 && r2.process, a2 = (function() {
    try {
      var e7 = i2 && i2.require && i2.require("util").types;
      return e7 || o2 && o2.binding && o2.binding("util");
    } catch (e8) {
    }
  })();
  e6.exports = a2;
})(dt, dt.exports);
var mt = dt.exports, gt = ht, ft = pt, bt = mt && mt.isTypedArray, yt = bt ? ft(bt) : gt, vt = Xe, xt = rt, wt = nt, kt = at, At = Fe, _t = yt, St = Object.prototype.hasOwnProperty;
var qt = function(e6, t2) {
  var r2 = wt(e6), n2 = !r2 && xt(e6), i2 = !r2 && !n2 && kt(e6), o2 = !r2 && !n2 && !i2 && _t(e6), a2 = r2 || n2 || i2 || o2, s2 = a2 ? vt(e6.length, String) : [], l2 = s2.length;
  for (var u2 in e6) !t2 && !St.call(e6, u2) || a2 && ("length" == u2 || i2 && ("offset" == u2 || "parent" == u2) || o2 && ("buffer" == u2 || "byteLength" == u2 || "byteOffset" == u2) || At(u2, l2)) || s2.push(u2);
  return s2;
};
var Ct = function(e6, t2) {
  return function(r2) {
    return e6(t2(r2));
  };
}, zt = Ct(Object.keys, Object), Tt = Ye, Mt = zt, Et = Object.prototype.hasOwnProperty;
var Dt = qt, Lt = function(e6) {
  if (!Tt(e6)) return Mt(e6);
  var t2 = [];
  for (var r2 in Object(e6)) Et.call(e6, r2) && "constructor" != r2 && t2.push(r2);
  return t2;
}, Bt = Ne;
var Nt = fe, Ot = ve, Ft = Ge, Rt = Ne, Ht = Ye, Vt = function(e6) {
  return Bt(e6) ? Dt(e6) : Lt(e6);
}, It = Object.prototype.hasOwnProperty, Pt = t(Ft((function(e6, t2) {
  if (Ht(t2) || Rt(t2)) Ot(t2, Vt(t2), e6);
  else for (var r2 in t2) It.call(t2, r2) && Nt(e6, r2, t2[r2]);
})));
var jt = I, Gt = Ye, Ut = function(e6) {
  var t2 = [];
  if (null != e6) for (var r2 in Object(e6)) t2.push(r2);
  return t2;
}, Yt = Object.prototype.hasOwnProperty;
var Xt = qt, Wt = function(e6) {
  if (!jt(e6)) return Ut(e6);
  var t2 = Gt(e6), r2 = [];
  for (var n2 in e6) ("constructor" != n2 || !t2 && Yt.call(e6, n2)) && r2.push(n2);
  return r2;
}, $t = Ne;
var Zt, Jt, Kt = ve, Qt = function(e6) {
  return $t(e6) ? Xt(e6, true) : Wt(e6);
}, er = t(Ge((function(e6, t2) {
  Kt(t2, Qt(t2), e6);
}))), tr = [].slice, rr = Array.from || function(e6) {
  return tr.call(e6);
};
Zt = (function() {
  q2.displayName = "LaTeX";
  var e6, t2, r2, n2, i2, o2, a2, l2, u2, c2, p2, d2, m2, g2, f2, b2, y2, v2, x2, w2, k2, S2 = q2.prototype;
  function q2(e7, r3) {
    var n3;
    r3 && (er(this, new r3(e7)), Pt(t2, r3.args), null != (n3 = r3.symbols) && n3.forEach((function(e8, t3) {
      return h.set(t3, e8);
    }))), this.g = e7, this.g.newCounter("secnumdepth"), this.g.newCounter("tocdepth"), this.g.newCounter("footnote"), this.g.newCounter("mpfootnote"), this.g.newCounter("@listdepth"), this.g.newCounter("@itemdepth"), this.g.newCounter("@enumdepth"), this.g.newLength("@@size"), this.g.newLength("unitlength"), this.g.setLength("unitlength", new this.g.Length(1, "pt")), this.g.newLength("@wholewidth"), this.g.setLength("@wholewidth", new this.g.Length(0.4, "pt")), this.g.newLength("paperheight"), this.g.newLength("paperwidth"), this.g.newLength("oddsidemargin"), this.g.newLength("evensidemargin"), this.g.newLength("textheight"), this.g.newLength("textwidth"), this.g.newLength("marginparwidth"), this.g.newLength("marginparsep"), this.g.newLength("marginparpush"), this.g.newLength("columnwidth"), this.g.newLength("columnsep"), this.g.newLength("columnseprule"), this.g.newLength("linewidth"), this.g.newLength("leftmargin"), this.g.newLength("rightmargin"), this.g.newLength("listparindent"), this.g.newLength("itemindent"), this.g.newLength("labelwidth"), this.g.newLength("labelsep"), this.g.newLength("leftmargini"), this.g.newLength("leftmarginii"), this.g.newLength("leftmarginiii"), this.g.newLength("leftmarginiv"), this.g.newLength("leftmarginv"), this.g.newLength("leftmarginvi"), this.g.newLength("fboxrule"), this.g.newLength("fboxsep"), this.g.newLength("tabbingsep"), this.g.newLength("arraycolsep"), this.g.newLength("tabcolsep"), this.g.newLength("arrayrulewidth"), this.g.newLength("doublerulesep"), this.g.newLength("footnotesep"), this.g.newLength("topmargin"), this.g.newLength("headheight"), this.g.newLength("headsep"), this.g.newLength("footskip"), this.g.newLength("topsep"), this.g.newLength("partopsep"), this.g.newLength("itemsep"), this.g.newLength("parsep"), this.g.newLength("floatsep"), this.g.newLength("textfloatsep"), this.g.newLength("intextsep"), this.g.newLength("dblfloatsep"), this.g.newLength("dbltextfloatsep");
  }
  for (e6 = ["calc", "pspicture", "picture", "pict2e", "keyval", "comment"], q2.prototype._title = null, q2.prototype._author = null, q2.prototype._date = null, q2.prototype._thanks = null, q2.symbols = h, (t2 = q2.args = {}).empty = ["HV"], q2.prototype.empty = function() {
  }, q2.prototype.TeX = function() {
    var e7, t3;
    return this.g.enterGroup(), (e7 = this.g.create(this.g.inline)).setAttribute("class", "tex"), e7.appendChild(this.g.createText("T")), t3 = this.g.create(this.g.inline, this.g.createText("e"), "e"), e7.appendChild(t3), e7.appendChild(this.g.createText("X")), this.g.exitGroup(), [e7];
  }, q2.prototype.LaTeX = function() {
    var e7, t3, r3;
    return this.g.enterGroup(), (e7 = this.g.create(this.g.inline)).setAttribute("class", "latex"), e7.appendChild(this.g.createText("L")), t3 = this.g.create(this.g.inline, this.g.createText("a"), "a"), e7.appendChild(t3), e7.appendChild(this.g.createText("T")), r3 = this.g.create(this.g.inline, this.g.createText("e"), "e"), e7.appendChild(r3), e7.appendChild(this.g.createText("X")), this.g.exitGroup(), [e7];
  }, q2.prototype.today = function() {
    return [(/* @__PURE__ */ new Date()).toLocaleDateString("en", { weekday: "long", year: "numeric", month: "long", day: "numeric" })];
  }, q2.prototype.newline = function() {
    return [this.g.create(this.g.linebreak)];
  }, q2.prototype.negthinspace = function() {
    return [this.g.create(this.g.inline, void 0, "negthinspace")];
  }, t2.par = ["V"], t2.item = ["V"], t2.onecolumn = ["V"], q2.prototype.onecolumn = function() {
  }, t2.twocolumn = ["V", "o?"], q2.prototype.twocolumn = function() {
  }, (r2 = t2).smallbreak = r2.medbreak = r2.bigbreak = ["V"], q2.prototype.smallbreak = function() {
    return [this.g.createVSpaceSkip("smallskip")];
  }, q2.prototype.medbreak = function() {
    return [this.g.createVSpaceSkip("medskip")];
  }, q2.prototype.bigbreak = function() {
    return [this.g.createVSpaceSkip("bigskip")];
  }, t2.addvspace = ["V", "l"], q2.prototype.addvspace = function(e7) {
    return this.g.createVSpace(e7);
  }, t2.marginpar = ["H", "g"], q2.prototype.marginpar = function(e7) {
    return [this.g.marginpar(e7)];
  }, q2.prototype.abstractname = function() {
    return ["Abstract"];
  }, t2.title = ["HV", "g"], t2.author = ["HV", "g"], t2.and = ["H"], t2.date = ["HV", "g"], t2.thanks = ["HV", "g"], q2.prototype.title = function(e7) {
    this._title = e7;
  }, q2.prototype.author = function(e7) {
    this._author = e7;
  }, q2.prototype.date = function(e7) {
    this._date = e7;
  }, q2.prototype.and = function() {
    return this.g.macro("quad");
  }, q2.prototype.thanks = q2.footnote, n2 = 0, a2 = (o2 = ["rm", "sf", "tt", "md", "bf", "up", "it", "sl", "sc", "normal"]).length; n2 < a2; ++n2) i2 = o2[n2], t2["text" + i2] = ["H", "X", "g"];
  for (q2.prototype.textrm = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontFamily("rm")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textsf = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontFamily("sf")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.texttt = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontFamily("tt")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textmd = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontWeight("md")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textbf = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontWeight("bf")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textup = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontShape("up")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textit = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontShape("it")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textsl = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontShape("sl")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textsc = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontShape("sc")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, q2.prototype.textnormal = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontFamily("rm"), this.g.setFontWeight("md"), this.g.setFontShape("up")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, t2.emph = ["H", "X", "g"], q2.prototype.emph = function(e7) {
    return 0 === arguments.length ? (this.g.enterGroup(), this.g.setFontShape("em")) : (e7 = this.g.addAttributes(e7), this.g.exitGroup(), [e7]);
  }, n2 = 0, a2 = (o2 = ["rm", "sf", "tt"]).length; n2 < a2; ++n2) l2 = o2[n2], t2[l2 + "family"] = ["HV"];
  for (n2 = 0, a2 = (o2 = ["md", "bf"]).length; n2 < a2; ++n2) u2 = o2[n2], t2[u2 + "series"] = ["HV"];
  for (n2 = 0, a2 = (o2 = ["up", "it", "sl", "sc"]).length; n2 < a2; ++n2) c2 = o2[n2], t2[c2 + "shape"] = ["HV"];
  for (n2 = 0, a2 = (o2 = ["normalfont", "em"]).length; n2 < a2; ++n2) p2 = o2[n2], t2[p2] = ["HV"];
  for (n2 = 0, a2 = (o2 = ["tiny", "scriptsize", "footnotesize", "small", "normalsize", "large", "Large", "LARGE", "huge", "Huge"]).length; n2 < a2; ++n2) d2 = o2[n2], t2[d2] = ["HV"];
  for (q2.prototype.rmfamily = function() {
    this.g.setFontFamily("rm");
  }, q2.prototype.sffamily = function() {
    this.g.setFontFamily("sf");
  }, q2.prototype.ttfamily = function() {
    this.g.setFontFamily("tt");
  }, q2.prototype.mdseries = function() {
    this.g.setFontWeight("md");
  }, q2.prototype.bfseries = function() {
    this.g.setFontWeight("bf");
  }, q2.prototype.upshape = function() {
    this.g.setFontShape("up");
  }, q2.prototype.itshape = function() {
    this.g.setFontShape("it");
  }, q2.prototype.slshape = function() {
    this.g.setFontShape("sl");
  }, q2.prototype.scshape = function() {
    this.g.setFontShape("sc");
  }, q2.prototype.normalfont = function() {
    this.g.setFontFamily("rm"), this.g.setFontWeight("md"), this.g.setFontShape("up");
  }, n2 = 0, a2 = (o2 = ["tiny", "scriptsize", "footnotesize", "small", "normalsize", "large", "Large", "LARGE", "huge", "Huge"]).length; n2 < a2; ++n2) S2[m2 = o2[n2]] = C2(m2);
  return q2.prototype.em = function() {
    this.g.setFontShape("em");
  }, q2.prototype.theenumi = function() {
    return [this.g.arabic(this.g.counter("enumi"))];
  }, q2.prototype.theenumii = function() {
    return [this.g.alph(this.g.counter("enumii"))];
  }, q2.prototype.theenumiii = function() {
    return [this.g.roman(this.g.counter("enumiii"))];
  }, q2.prototype.theenumiv = function() {
    return [this.g.Alph(this.g.counter("enumiv"))];
  }, q2.prototype.labelenumi = function() {
    return this.theenumi().concat(".");
  }, q2.prototype.labelenumii = function() {
    return ["("].concat(rr(this.theenumii()), [")"]);
  }, q2.prototype.labelenumiii = function() {
    return this.theenumiii().concat(".");
  }, q2.prototype.labelenumiv = function() {
    return this.theenumiv().concat(".");
  }, q2.prototype["p@enumii"] = function() {
    return this.theenumi();
  }, q2.prototype["p@enumiii"] = function() {
    return this.theenumi().concat("(", this.theenumii(), ")");
  }, q2.prototype["p@enumiv"] = function() {
    return this["p@enumiii"]().concat(this.theenumiii());
  }, q2.prototype.labelitemi = function() {
    return [this.g.symbol("textbullet")];
  }, q2.prototype.labelitemii = function() {
    return this.normalfont(), this.bfseries(), [this.g.symbol("textendash")];
  }, q2.prototype.labelitemiii = function() {
    return [this.g.symbol("textasteriskcentered")];
  }, q2.prototype.labelitemiv = function() {
    return [this.g.symbol("textperiodcentered")];
  }, (g2 = t2).centering = g2.raggedright = g2.raggedleft = ["HV"], q2.prototype.centering = function() {
    this.g.setAlignment("centering");
  }, q2.prototype.raggedright = function() {
    this.g.setAlignment("raggedright");
  }, q2.prototype.raggedleft = function() {
    this.g.setAlignment("raggedleft");
  }, (f2 = t2).center = f2.flushleft = f2.flushright = ["V"], q2.prototype.center = function() {
    return this.g.startlist(), [this.g.create(this.g.list, null, "center")];
  }, q2.prototype.endcenter = function() {
    this.g.endlist();
  }, q2.prototype.flushleft = function() {
    return this.g.startlist(), [this.g.create(this.g.list, null, "flushleft")];
  }, q2.prototype.endflushleft = function() {
    this.g.endlist();
  }, q2.prototype.flushright = function() {
    return this.g.startlist(), [this.g.create(this.g.list, null, "flushright")];
  }, q2.prototype.endflushright = function() {
    this.g.endlist();
  }, t2.titlepage = ["V"], q2.prototype.titlepage = function() {
    return [this.g.create(this.g.titlepage)];
  }, (b2 = t2).quote = b2.quotation = b2.verse = ["V"], q2.prototype.quote = function() {
    return this.g.startlist(), [this.g.create(this.g.quote)];
  }, q2.prototype.endquote = function() {
    this.g.endlist();
  }, q2.prototype.quotation = function() {
    return this.g.startlist(), [this.g.create(this.g.quotation)];
  }, q2.prototype.endquotation = function() {
    this.g.endlist();
  }, q2.prototype.verse = function() {
    return this.g.startlist(), [this.g.create(this.g.verse)];
  }, q2.prototype.endverse = function() {
    this.g.endlist();
  }, t2.itemize = ["V", "X", "items"], q2.prototype.itemize = function(e7) {
    var t3, r3 = this;
    return 0 === arguments.length ? (this.g.startlist(), this.g.stepCounter("@itemdepth"), void (this.g.counter("@itemdepth") > 4 && this.g.error("too deeply nested"))) : (t3 = "labelitem" + this.g.roman(this.g.counter("@itemdepth")), [this.g.create(this.g.unorderedList, e7.map((function(e8) {
      var n3;
      return r3.g.enterGroup(), n3 = r3.g.create(r3.g.itemlabel, r3.llap(null !== e8.label ? e8.label : r3.g.macro(t3))), r3.g.exitGroup(), r3.g.create(r3.g.listitem, [n3, e8.text]);
    })))]);
  }, q2.prototype.enditemize = function() {
    this.g.endlist(), this.g.setCounter("@itemdepth", this.g.counter("@itemdepth") - 1);
  }, t2.enumerate = ["V", "X", "enumitems"], q2.prototype.enumerate = function(e7) {
    var t3, r3 = this;
    return 0 === arguments.length ? (this.g.startlist(), this.g.stepCounter("@enumdepth"), void (this.g.counter("@enumdepth") > 4 && this.g.error("too deeply nested"))) : (t3 = "enum" + this.g.roman(this.g.counter("@enumdepth")), this.g.setCounter(t3, 0), [this.g.create(this.g.orderedList, e7.map((function(e8) {
      var t4, n3;
      return t4 = r3.g.create(r3.g.inline, e8.label.node), e8.label.id && (t4.id = e8.label.id), n3 = r3.g.create(r3.g.itemlabel, r3.llap(t4)), r3.g.create(r3.g.listitem, [n3, e8.text]);
    })))]);
  }, q2.prototype.endenumerate = function() {
    this.g.endlist(), this.g.setCounter("@enumdepth", this.g.counter("@enumdepth") - 1);
  }, t2.description = ["V", "X", "items"], q2.prototype.description = function(e7) {
    var t3 = this;
    if (0 !== arguments.length) return [this.g.create(this.g.descriptionList, e7.map((function(e8) {
      var r3, n3;
      return r3 = t3.g.create(t3.g.term, e8.label), n3 = t3.g.create(t3.g.description, e8.text), t3.g.createFragment([r3, n3]);
    })))];
    this.g.startlist();
  }, q2.prototype.enddescription = function() {
    this.g.endlist();
  }, t2.picture = ["H", "v", "v?", "h"], q2.prototype.picture = function(e7, t3, r3) {
    return [this.g.createPicture(e7, t3, r3)];
  }, t2.hspace = ["H", "s", "l"], q2.prototype.hspace = function(e7, t3) {
    return [this.g.createHSpace(t3)];
  }, t2.label = ["HV", "g"], q2.prototype.label = function(e7) {
    this.g.setLabel(e7.textContent);
  }, t2.ref = ["H", "g"], q2.prototype.ref = function(e7) {
    return [this.g.ref(e7.textContent)];
  }, (y2 = t2).llap = y2.rlap = y2.clap = y2.smash = y2.hphantom = y2.vphantom = y2.phantom = ["H", "hg"], q2.prototype.llap = function(e7) {
    return [this.g.create(this.g.inline, e7, "hbox llap")];
  }, q2.prototype.rlap = function(e7) {
    return [this.g.create(this.g.inline, e7, "hbox rlap")];
  }, q2.prototype.clap = function(e7) {
    return [this.g.create(this.g.inline, e7, "hbox clap")];
  }, q2.prototype.smash = function(e7) {
    return [this.g.create(this.g.inline, e7, "hbox smash")];
  }, q2.prototype.hphantom = function(e7) {
    return [this.g.create(this.g.inline, e7, "phantom hbox smash")];
  }, q2.prototype.vphantom = function(e7) {
    return [this.g.create(this.g.inline, e7, "phantom hbox rlap")];
  }, q2.prototype.phantom = function(e7) {
    return [this.g.create(this.g.inline, e7, "phantom hbox")];
  }, t2.underline = ["H", "hg"], q2.prototype.underline = function(e7) {
    return [this.g.create(this.g.inline, e7, "hbox underline")];
  }, t2.mbox = ["H", "hg"], q2.prototype.mbox = function(e7) {
    return this.makebox(void 0, void 0, void 0, e7);
  }, t2.makebox = ["H", "v?", "l?", "i?", "hg"], q2.prototype.makebox = function(e7, t3, r3, n3) {
    return e7 ? (t3 && r3 && this.g.error("expected \\makebox(width,height)[position]{text} but got two optional arguments!"), r3 = t3, [n3]) : this._box(t3, r3, n3, "hbox");
  }, t2.fbox = ["H", "hg"], t2.framebox = ["H", "v?", "l?", "i?", "hg"], q2.prototype.fbox = function(e7) {
    return this.framebox(void 0, void 0, void 0, e7);
  }, q2.prototype.framebox = function(e7, t3, r3, n3) {
    return e7 ? t3 && r3 ? this.g.error("expected \\framebox(width,height)[position]{text} but got two optional arguments!") : void 0 : null == n3.hasAttribute || t3 || r3 || this.g.hasAttribute(n3, "frame") ? this._box(t3, r3, n3, "hbox frame") : (this.g.addAttribute(n3, "frame"), [n3]);
  }, q2.prototype._box = function(e7, t3, r3, n3) {
    var i3, o3;
    if (e7) switch (t3 || (t3 = "c"), t3) {
      case "s":
        n3 += " stretch";
        break;
      case "c":
        n3 += " clap";
        break;
      case "l":
        n3 += " rlap";
        break;
      case "r":
        n3 += " llap";
        break;
      default:
        this.g.error("unknown position: " + t3);
    }
    return i3 = this.g.create(this.g.inline, r3), o3 = this.g.create(this.g.inline, i3, n3), e7 && o3.setAttribute("style", "width:" + e7.value), [o3];
  }, t2.parbox = ["H", "i?", "l?", "i?", "l", "g"], q2.prototype.parbox = function(e7, t3, r3, n3, i3) {
    var o3, a3, s2, l3;
    switch (e7 || (e7 = "c"), r3 || (r3 = e7), o3 = "parbox", a3 = "width:" + n3.value + ";", t3 && (o3 += " pbh", a3 += "height:" + t3.value + ";"), e7) {
      case "c":
        o3 += " p-c";
        break;
      case "t":
        o3 += " p-t";
        break;
      case "b":
        o3 += " p-b";
        break;
      default:
        this.g.error("unknown position: " + e7);
    }
    switch (r3) {
      case "s":
        o3 += " stretch";
        break;
      case "c":
        o3 += " p-cc";
        break;
      case "t":
        o3 += " p-ct";
        break;
      case "b":
        o3 += " p-cb";
        break;
      default:
        this.g.error("unknown inner-pos: " + r3);
    }
    return s2 = this.g.create(this.g.inline, i3), (l3 = this.g.create(this.g.inline, s2, o3)).setAttribute("style", a3), [l3];
  }, (v2 = t2).thicklines = ["HV"], v2.thinlines = ["HV"], v2.linethickness = ["HV", "l"], v2.arrowlength = ["HV", "l"], q2.prototype.thinlines = function() {
    this.g.setLength("@wholewidth", new this.g.Length(0.4, "pt"));
  }, q2.prototype.thicklines = function() {
    this.g.setLength("@wholewidth", new this.g.Length(0.8, "pt"));
  }, q2.prototype.linethickness = function(e7) {
    "sp" !== e7.unit && this.g.error("relative units for \\linethickness not supported!"), this.g.setLength("@wholewidth", e7);
  }, q2.prototype.arrowlength = function(e7) {
    this.g.setLength("@arrowlength", e7);
  }, q2.prototype.maxovalrad = function() {
    return "20pt";
  }, q2.prototype.qbeziermax = function() {
    return 500;
  }, t2.dashbox = ["H", "cl", "v", "i?", "g"], t2.frame = ["H", "hg"], q2.prototype.frame = function(e7) {
    var t3, r3;
    return t3 = this.g.create(this.g.inline, e7, "hbox pframe"), r3 = this.g.length("@wholewidth"), t3.setAttribute("style", "border-width:" + r3.value), [t3];
  }, t2.put = ["H", "v", "g", "is"], q2.prototype.put = function(e7, t3) {
    var r3, n3;
    return r3 = this.g.create(this.g.inline, t3, "put-obj"), e7.y.cmp(this.g.Length.zero) >= 0 ? (r3.setAttribute("style", "left:" + e7.x.value), e7.y.cmp(this.g.Length.zero) > 0 && (n3 = this.g.create(this.g.inline, void 0, "strut")).setAttribute("style", "height:" + e7.y.value)) : r3.setAttribute("style", "left:" + e7.x.value + ";bottom:" + e7.y.value), this.rlap(this.g.create(this.g.inline, [r3, n3], "picture"));
  }, t2.multiput = ["H", "v", "v", "n", "g"], q2.prototype.multiput = function(e7, t3, r3, n3) {
    var i3, o3, a3;
    for (i3 = [], o3 = 0; o3 < r3; ++o3) a3 = o3, i3 = i3.concat(this.put(e7.add(t3.mul(a3)), n3.cloneNode(true)));
    return i3;
  }, t2.qbezier = ["H", "n?", "v", "v", "v"], q2.prototype.qbezier = function(e7, t3, r3, n3) {
    return [this._path("M" + t3.x.pxpct + "," + t3.y.pxpct + " Q" + r3.x.pxpct + "," + r3.y.pxpct + " " + n3.x.pxpct + "," + n3.y.pxpct, e7)];
  }, t2.cbezier = ["H", "n?", "v", "v", "v", "v"], q2.prototype.cbezier = function(e7, t3, r3, n3, i3) {
    return [this._path("M" + t3.x.pxpct + "," + t3.y.pxpct + " C" + r3.x.pxpct + "," + r3.y.pxpct + " " + n3.x.pxpct + "," + n3.y.pxpct + " " + i3.x.pxpct + "," + i3.y.pxpct, e7)];
  }, q2.prototype._path = function(e7, t3) {
    var r3, n3, i3, o3, a3, s2, l3;
    return r3 = this.g.length("@wholewidth"), n3 = this.g.create(this.g.inline, void 0, "picture-object"), o3 = (i3 = this.g.SVG().addTo(n3)).path(e7).stroke({ color: "#000", width: r3.value }).fill("none"), t3 > 0 && (t3 = Math.min(t3, this.qbeziermax() - 1), a3 = r3.px, (s2 = (o3.length() - (t3 + 1) * a3) / t3) > 0 && o3.stroke({ dasharray: a3 + " " + this.g.round(s2) })), (l3 = o3.bbox()).x -= r3.px, l3.y -= r3.px, l3.width += 2 * r3.px, l3.height += 2 * r3.px, n3.setAttribute("style", "left:" + this.g.round(l3.x) + "px;bottom:" + this.g.round(l3.y) + "px"), i3.size(this.g.round(l3.width) + "px", this.g.round(l3.height) + "px").viewbox(this.g.round(l3.x), this.g.round(l3.y), this.g.round(l3.width), this.g.round(l3.height)), i3.flip("y", 0), this.g.create(this.g.inline, n3, "picture");
  }, t2.circle = ["H", "s", "cl"], q2.prototype.circle = function(e7, t3) {
    var r3, n3, i3, o3;
    return t3 = t3.abs(), r3 = this.g.create(this.g.inline, void 0, "picture-object"), n3 = this.g.length("@wholewidth"), i3 = this.g.SVG().addTo(r3), e7 ? (o3 = t3.div(2).mul(-1).value, i3.size(t3.value, t3.value).stroke({ color: "#000", width: "0" }).circle(t3.value).cx(t3.div(2).value).cy(t3.div(2).value).fill("")) : (o3 = t3.div(2).add(n3).mul(-1).value, i3.size(t3.add(n3.mul(2)).value, t3.add(n3.mul(2)).value).stroke({ color: "#000", width: n3.value }).circle(t3.value).cx(t3.div(2).add(n3).value).cy(t3.div(2).add(n3).value).fill("none")), r3.setAttribute("style", "left:" + o3 + ";bottom:" + o3), i3.flip("y", 0), [this.g.create(this.g.inline, r3, "picture")];
  }, t2.line = ["H", "v", "cl"], q2.prototype.line = function(e7, t3) {
    return [this._line.apply(this, this._slopeLengthToCoords(e7, t3))];
  }, t2.vector = ["H", "v", "cl"], q2.prototype.vector = function(e7, t3) {
    return [this._vector.apply(this, this._slopeLengthToCoords(e7, t3))];
  }, t2.Line = ["H", "v", "v"], q2.prototype.Line = function(e7, t3) {
    return [this._line(e7, t3)];
  }, t2.Vector = ["H", "v", "v"], q2.prototype.Vector = function(e7, t3) {
    return [this._vector(e7, t3)];
  }, q2.prototype._slopeLengthToCoords = function(e7, t3) {
    var r3, n3, i3, o3;
    return e7.x.value === (r3 = e7.y.value) && 0 === r3 && this.g.error("illegal slope (0,0)"), e7.x.unit === e7.y.unit && "sp" === e7.x.unit || this.g.error("relative units not allowed for slope"), this.g.length("@wholewidth"), n3 = new this.g.Length(0, t3.unit), 0 === e7.x.px ? (i3 = n3, o3 = t3) : o3 = (i3 = t3).mul(Math.abs(e7.y.ratio(e7.x))), e7.x.cmp(n3) < 0 && (i3 = i3.mul(-1)), e7.y.cmp(n3) < 0 && (o3 = o3.mul(-1)), [new s(n3, n3), new s(i3, o3)];
  }, q2.prototype._line = function(e7, t3) {
    var r3, n3, i3, o3;
    return e7.x.unit === e7.y.unit && "sp" === e7.x.unit || this.g.error("relative units not allowed for line"), t3.x.unit === t3.y.unit && "sp" === t3.x.unit || this.g.error("relative units not allowed for line"), r3 = this.g.create(this.g.inline, void 0, "picture-object"), n3 = this.g.SVG().addTo(r3), i3 = this.g.length("@wholewidth"), (o3 = n3.line(e7.x.px, e7.y.px, t3.x.px, t3.y.px).stroke({ color: "#000", width: i3.value }).bbox()).x -= i3.px, o3.y -= i3.px, o3.width += 2 * i3.px, o3.height += 2 * i3.px, (o3.x > 0 || o3.y > 0) && console.error("line: bbox.x/y > 0!!", o3.x, o3.y), r3.setAttribute("style", "left:" + this.g.round(o3.x) + "px;bottom:" + this.g.round(o3.y) + "px"), n3.size(this.g.round(o3.width) + "px", this.g.round(o3.height) + "px").viewbox(this.g.round(o3.x), this.g.round(o3.y), this.g.round(o3.width), this.g.round(o3.height)), n3.flip("y", 0), this.g.create(this.g.inline, r3, "picture");
  }, q2.prototype._vector = function(e7, t3) {
    var r3, n3, i3, o3, a3, l3, u3, c3, h2, p3 = this;
    return e7.x.unit === e7.y.unit && "sp" === e7.x.unit || this.g.error("relative units not allowed for vector"), t3.x.unit === t3.y.unit && "sp" === t3.x.unit || this.g.error("relative units not allowed for vector"), r3 = this.g.length("@wholewidth"), n3 = this.g.create(this.g.inline, void 0, "picture-object"), i3 = this.g.SVG(), o3 = 6.5, a3 = 3.9, l3 = new this.g.Length(0.6, "pt"), r3.cmp(l3) < 0 && (o3 = this.g.round(o3 * l3.ratio(r3)), a3 = this.g.round(a3 * l3.ratio(r3))), u3 = r3.mul(o3 / 2), c3 = t3.sub(e7).norm().cmp(u3) < 0 ? t3.shift_start(u3) : new s(this.g.Length.zero, this.g.Length.zero), t3 = t3.shift_end(u3.mul(-1)), (h2 = i3.line(c3.x.px, c3.y.px, t3.x.px, t3.y.px).stroke({ color: "#000", width: r3.value }).marker("end", o3, a3, (function(e8) {
      return e8.path("M0,0 Q" + p3.g.round(2 * o3 / 3) + "," + p3.g.round(a3 / 2) + " " + o3 + "," + p3.g.round(a3 / 2) + " Q" + p3.g.round(2 * o3 / 3) + "," + p3.g.round(a3 / 2) + " 0," + a3 + " z");
    })).bbox()).x -= r3.px + u3.px, h2.y -= r3.px + u3.px, h2.width += r3.px + 2 * u3.px, h2.height += r3.px + 2 * u3.px, (h2.x > 0 || h2.y > 0) && console.error("vector: bbox.x/y > 0!!", h2.x, h2.y), n3.setAttribute("style", "left:" + this.g.round(h2.x) + "px;bottom:" + this.g.round(h2.y) + "px"), i3.size(this.g.round(h2.width) + "px", this.g.round(h2.height) + "px").viewbox(this.g.round(h2.x), this.g.round(h2.y), this.g.round(h2.width), this.g.round(h2.height)), i3.flip("y", 0), i3.addTo(n3), this.g.create(this.g.inline, n3, "picture");
  }, t2.oval = ["H", "cl?", "v", "i?"], q2.prototype.oval = function(e7, t3, r3) {
    var n3, i3, o3, a3, s2, l3, u3, c3;
    return n3 = this.g.length("@wholewidth"), e7 || (e7 = new this.g.Length(20, "px")), r3 || (r3 = ""), i3 = t3.x.cmp(t3.y) < 0 ? t3.x.div(2) : t3.y.div(2), e7.cmp(i3) < 0 && (i3 = e7), a3 = (o3 = this.g.SVG()).rect(t3.x.value, t3.y.value).radius(i3.value).move(t3.x.div(-2).value, t3.y.div(-2).value).stroke({ color: "#000", width: n3.value }).fill("none"), s2 = { x: t3.x.div(-2).sub(n3), y: t3.y.div(-2).sub(n3), w: t3.x.add(n3.mul(2)), h: t3.y.add(n3.mul(2)) }, r3.includes("l") && (s2 = this._intersect(s2, { x: t3.x.div(-2).sub(n3), y: t3.y.div(-2).sub(n3), w: t3.x.div(2).add(n3), h: t3.y.add(n3.mul(2)) })), r3.includes("t") && (s2 = this._intersect(s2, { x: t3.x.div(-2).sub(n3), y: t3.y.div(-2).sub(n3), w: t3.x.add(n3.mul(2)), h: t3.y.div(2).add(n3) })), r3.includes("r") && (s2 = this._intersect(s2, { x: this.g.Length.zero, y: t3.y.div(-2).sub(n3), w: t3.x.div(2).add(n3), h: t3.y.add(n3.mul(2)) })), r3.includes("b") && (s2 = this._intersect(s2, { x: t3.x.div(-2).sub(n3), y: this.g.Length.zero, w: t3.x.add(n3.mul(2)), h: t3.y.div(2).add(n3) })), (l3 = a3.bbox()).x -= n3.px, l3.y -= n3.px, l3.width += 2 * n3.px, l3.height += 2 * n3.px, (l3.x > 0 || l3.y > 0) && console.error("oval: bbox.x/y > 0!!", l3.x, l3.y), (u3 = o3.clip().add(o3.rect(s2.w.value, s2.h.value).move(s2.x.value, s2.y.value))).flip("y", 0), a3.clipWith(u3), (c3 = this.g.create(this.g.inline, void 0, "picture-object")).setAttribute("style", "left:" + this.g.round(l3.x) + "px;bottom:" + this.g.round(l3.y) + "px"), o3.size(this.g.round(l3.width) + "px", this.g.round(l3.height) + "px").viewbox(this.g.round(l3.x), this.g.round(l3.y), this.g.round(l3.width), this.g.round(l3.height)), o3.flip("y", 0), o3.addTo(c3), [this.g.create(this.g.inline, c3, "picture")];
  }, q2.prototype._intersect = function(e7, t3) {
    return { x: this.g.Length.max(e7.x, t3.x), y: this.g.Length.max(e7.y, t3.y), w: this.g.Length.max(this.g.Length.zero, this.g.Length.min(e7.x.add(e7.w), t3.x.add(t3.w)).sub(this.g.Length.max(e7.x, t3.x))), h: this.g.Length.max(this.g.Length.zero, this.g.Length.min(e7.y.add(e7.h), t3.y.add(t3.h)).sub(this.g.Length.max(e7.y, t3.y))) };
  }, t2.newlength = ["HV", "m"], q2.prototype.newlength = function(e7) {
    this.g.newLength(e7);
  }, t2.setlength = ["HV", "m", "l"], q2.prototype.setlength = function(e7, t3) {
    this.g.setLength(e7, t3);
  }, t2.addtolength = ["HV", "m", "l"], q2.prototype.addtolength = function(e7, t3) {
    this.g.setLength(e7, this.g.length(e7).add(t3));
  }, t2.newcounter = ["HV", "i", "i?"], q2.prototype.newcounter = function(e7, t3) {
    this.g.newCounter(e7, t3);
  }, t2.stepcounter = ["HV", "i"], q2.prototype.stepcounter = function(e7) {
    this.g.stepCounter(e7);
  }, t2.addtocounter = ["HV", "i", "n"], q2.prototype.addtocounter = function(e7, t3) {
    this.g.setCounter(e7, this.g.counter(e7) + t3);
  }, t2.setcounter = ["HV", "i", "n"], q2.prototype.setcounter = function(e7, t3) {
    this.g.setCounter(e7, t3);
  }, t2.refstepcounter = ["H", "i"], q2.prototype.refstepcounter = function(e7) {
    return this.g.stepCounter(e7), [this.g.refCounter(e7)];
  }, (x2 = t2).alph = x2.Alph = x2.arabic = x2.roman = x2.Roman = x2.fnsymbol = ["H", "i"], q2.prototype.alph = function(e7) {
    return [this.g.alph(this.g.counter(e7))];
  }, q2.prototype.Alph = function(e7) {
    return [this.g.Alph(this.g.counter(e7))];
  }, q2.prototype.arabic = function(e7) {
    return [this.g.arabic(this.g.counter(e7))];
  }, q2.prototype.roman = function(e7) {
    return [this.g.roman(this.g.counter(e7))];
  }, q2.prototype.Roman = function(e7) {
    return [this.g.Roman(this.g.counter(e7))];
  }, q2.prototype.fnsymbol = function(e7) {
    return [this.g.fnsymbol(this.g.counter(e7))];
  }, t2.input = ["V", "g"], q2.prototype.input = function(e7) {
  }, t2.include = ["V", "g"], q2.prototype.include = function(e7) {
  }, t2.documentclass = ["P", "kv?", "k", "k?"], q2.prototype.documentclass = function(e7, r3, n3) {
    var i3, o3, a3;
    if (this.documentclass = function() {
      this.g.error("Two \\documentclass commands. The document may only declare one class.");
    }, !(i3 = A[r3])) try {
      i3 = (o3 = require("./documentclasses/" + r3)).default || o3[Object.getOwnPropertyNames(o3)[0]];
    } catch (e8) {
      throw a3 = e8, console.error('error loading documentclass "' + r3 + '": ' + a3), new Error('error loading documentclass "' + r3 + '"');
    }
    this.g.documentClass = new i3(this.g, e7), er(this, this.g.documentClass), Pt(t2, i3.args);
  }, t2.usepackage = ["P", "kv?", "csv", "k?"], q2.prototype.usepackage = function(r3, n3, i3) {
    var o3, a3, s2, l3, u3, c3, p3, d3;
    for (o3 = Object.assign({}, this.g.documentClass.options, r3), a3 = 0, s2 = n3.length; a3 < s2; ++a3) if (l3 = n3[a3], !e6.includes(l3)) {
      u3 = _[l3];
      try {
        u3 || (u3 = (c3 = require("./packages/" + l3)).default || c3[Object.getOwnPropertyNames(c3)[0]]), er(this, new u3(this.g, o3)), Pt(t2, u3.args), null != (p3 = u3.symbols) && p3.forEach(m3);
      } catch (e7) {
        d3 = e7, console.error('error loading package "' + l3 + '": ' + d3);
      }
    }
    function m3(e7, t3) {
      return h.set(t3, e7);
    }
  }, t2.includeonly = ["P", "csv"], q2.prototype.includeonly = function(e7) {
  }, t2.makeatletter = ["P"], q2.prototype.makeatletter = function() {
  }, t2.makeatother = ["P"], q2.prototype.makeatother = function() {
  }, t2.pagestyle = ["HV", "i"], q2.prototype.pagestyle = function(e7) {
  }, (w2 = t2).linebreak = ["HV", "n?"], w2.nolinebreak = ["HV", "n?"], w2.fussy = ["HV"], w2.sloppy = ["HV"], q2.prototype.linebreak = function(e7) {
  }, q2.prototype.nolinebreak = function(e7) {
  }, q2.prototype.fussy = function() {
  }, q2.prototype.sloppy = function() {
  }, (k2 = t2).pagebreak = ["HV", "n?"], k2.nopagebreak = ["HV", "n?"], k2.samepage = ["HV"], k2.enlargethispage = ["HV", "s", "l"], k2.newpage = ["HV"], k2.clearpage = ["HV"], k2.cleardoublepage = ["HV"], k2.vfill = ["HV"], k2.thispagestyle = ["HV", "i"], q2.prototype.pagebreak = function(e7) {
  }, q2.prototype.nopagebreak = function(e7) {
  }, q2.prototype.samepage = function() {
  }, q2.prototype.enlargethispage = function(e7, t3) {
  }, q2.prototype.newpage = function() {
  }, q2.prototype.clearpage = function() {
  }, q2.prototype.cleardoublepage = function() {
  }, q2.prototype.vfill = function() {
  }, q2.prototype.thispagestyle = function(e7) {
  }, q2;
  function C2(e7) {
    return function() {
      return this.g.setFontSize(e7);
    };
  }
})();
var nr, ir = [].slice, or = Array.from || function(e6) {
  return ir.call(e6);
};
function ar(e6, t2) {
  for (var r2 = -1, n2 = t2.length >>> 0; ++r2 < n2; ) if (e6 === t2[r2]) return true;
  return false;
}
nr = Zt, Object.defineProperty(Array.prototype, "top", { enumerable: false, configurable: true, get: function() {
  return this[this.length - 1];
}, set: function(e6) {
  this[this.length - 1] = e6;
} }), Jt = (function() {
  var e6, t2;
  function r2() {
  }
  return r2.displayName = "Generator", r2.prototype, r2.prototype.documentClass = null, r2.prototype.documentTitle = null, r2.prototype._options = null, r2.prototype._macros = null, r2.prototype._stack = null, r2.prototype._groups = null, r2.prototype._continue = false, r2.prototype._labels = null, r2.prototype._refs = null, r2.prototype._counters = null, r2.prototype._resets = null, r2.prototype._marginpars = null, r2.prototype.Length = null, r2.prototype.reset = function() {
    this.Length = a(this), this.documentClass = this._options.documentClass, this.documentTitle = "untitled", this._uid = 1, this._macros = {}, this._curArgs = [], this._stack = [{ attrs: {}, align: null, currentlabel: { id: "", label: document.createTextNode("") }, lengths: /* @__PURE__ */ new Map() }], this._groups = [0], this._labels = /* @__PURE__ */ new Map(), this._refs = /* @__PURE__ */ new Map(), this._marginpars = [], this._counters = /* @__PURE__ */ new Map(), this._resets = /* @__PURE__ */ new Map(), this._continue = false, this.newCounter("enumi"), this.newCounter("enumii"), this.newCounter("enumiii"), this.newCounter("enumiv"), this._macros = new nr(this, this._options.CustomMacros);
  }, r2.prototype.nextId = function() {
    return this._uid++;
  }, r2.prototype.round = function(e7) {
    var t3;
    return t3 = Math.pow(10, this._options.precision), Math.round(e7 * t3) / t3;
  }, e6 = function(e7) {
    throw console.error(e7), new Error(e7);
  }, r2.prototype.error = function(t3) {
    e6(t3);
  }, r2.prototype.setErrorFn = function(t3) {
    e6 = t3;
  }, r2.prototype.location = function() {
    e6("location function not set!");
  }, r2.prototype.setTitle = function(e7) {
    return this.documentTitle = e7.textContent;
  }, r2.prototype.hasSymbol = function(e7) {
    return nr.symbols.has(e7);
  }, r2.prototype.symbol = function(e7) {
    return this.hasSymbol(e7) || this.error("no such symbol: " + e7), nr.symbols.get(e7);
  }, r2.prototype.hasMacro = function(e7) {
    return "function" == typeof this._macros[e7] && !(function(e8, t3, r3) {
      var n2 = {}.toString;
      return s2(e8, t3);
      function s2(e9, t4, i2) {
        var l2;
        if (null == e9 || null == t4) return e9 === t4;
        if (e9.__placeholder__ || t4.__placeholder__) return true;
        if (e9 === t4) return 0 !== e9 || 1 / e9 == 1 / t4;
        if (l2 = n2.call(e9), n2.call(t4) != l2) return false;
        switch (l2) {
          case "[object String]":
            return e9 == String(t4);
          case "[object Number]":
            return e9 != +e9 ? t4 != +t4 : 0 == e9 ? 1 / e9 == 1 / t4 : e9 == +t4;
          case "[object Date]":
          case "[object Boolean]":
            return +e9 == +t4;
          case "[object RegExp]":
            return e9.source == t4.source && e9.global == t4.global && e9.multiline == t4.multiline && e9.ignoreCase == t4.ignoreCase;
        }
        return false;
      }
    })(e7, "constructor") && (this._macros.hasOwnProperty(e7) || nr.prototype.hasOwnProperty(e7));
  }, r2.prototype.isHmode = function(e7) {
    var t3;
    return "H" === (null != (t3 = nr.args[e7]) ? t3[0] : void 0) || !nr.args[e7];
  }, r2.prototype.isVmode = function(e7) {
    var t3;
    return "V" === (null != (t3 = nr.args[e7]) ? t3[0] : void 0);
  }, r2.prototype.isHVmode = function(e7) {
    var t3;
    return "HV" === (null != (t3 = nr.args[e7]) ? t3[0] : void 0);
  }, r2.prototype.isPreamble = function(e7) {
    var t3;
    return "P" === (null != (t3 = nr.args[e7]) ? t3[0] : void 0);
  }, r2.prototype.macro = function(e7, t3) {
    var r3, n2 = this;
    return h.has(e7) ? [this.createText(h.get(e7))] : null != (r3 = this._macros[e7].apply(this._macros, t3)) ? r3.filter((function(e8) {
      return null != e8;
    })).map((function(e8) {
      return "string" == typeof e8 || e8 instanceof String ? n2.createText(e8) : n2.addAttributes(e8);
    })) : void 0;
  }, r2.prototype.beginArgs = function(e7) {
    var t3;
    this._curArgs.push((t3 = nr.args[e7]) ? { name: e7, args: t3.slice(1), parsed: [] } : { args: [], parsed: [] });
  }, r2.prototype.selectArgsBranch = function(e7) {
    var t3, r3, n2, i2, o2, a2;
    if (t3 = ["o?", "i?", "k?", "kv?", "n?", "l?", "c-ml?", "cl?"], Array.isArray(this._curArgs.top.args[0])) {
      for (n2 = 0, i2 = (r3 = this._curArgs.top.args[0]).length; n2 < i2; ++n2) if (o2 = r3[n2], "[" === e7 && ar(o2[0], t3) || "{" === e7 && !ar(o2[0], t3)) return this._curArgs.top.args.shift(), (a2 = this._curArgs.top.args).unshift.apply(a2, o2), true;
    }
  }, r2.prototype.nextArg = function(e7) {
    if (this._curArgs.top.args[0] === e7) return this._curArgs.top.args.shift(), true;
  }, r2.prototype.argError = function(t3) {
    return e6("macro \\" + this._curArgs.top.name + ": " + t3);
  }, r2.prototype.addParsedArg = function(e7) {
    this._curArgs.top.parsed.push(e7);
  }, r2.prototype.parsedArgs = function() {
    return this._curArgs.top.parsed;
  }, r2.prototype.preExecMacro = function() {
    this.macro(this._curArgs.top.name, this.parsedArgs());
  }, r2.prototype.endArgs = function() {
    var t3;
    return 0 === (t3 = this._curArgs.pop()).args.length || e6("grammar error: arguments for " + t3.name + " have not been parsed: " + t3.args), t3.parsed;
  }, r2.prototype.begin = function(t3) {
    this.hasMacro(t3) || e6("unknown environment: " + t3), this.startBalanced(), this.enterGroup(), this.beginArgs(t3);
  }, r2.prototype.end = function(t3, r3) {
    var n2;
    return t3 !== r3 && e6("environment '" + t3 + "' is missing its end, found '" + r3 + "' instead"), this.hasMacro("end" + t3) && (n2 = this.macro("end" + t3)), this.exitGroup(), this.isBalanced() || e6(t3 + ": groups need to be balanced in environments!"), this.endBalanced(), n2;
  }, r2.prototype.enterGroup = function(e7) {
    null == e7 && (e7 = false), this._stack.push({ attrs: e7 ? Object.assign({}, this._stack.top.attrs) : {}, align: null, currentlabel: Object.assign({}, this._stack.top.currentlabel), lengths: new Map(this._stack.top.lengths) }), ++this._groups.top;
  }, r2.prototype.exitGroup = function() {
    --this._groups.top >= 0 || e6("there is no group to end here"), this._stack.pop();
  }, r2.prototype.startBalanced = function() {
    this._groups.push(0);
  }, r2.prototype.endBalanced = function() {
    return this._groups.pop(), this._groups.length;
  }, r2.prototype.isBalanced = function() {
    return 0 === this._groups.top;
  }, r2.prototype.continue = function() {
    this._continue = this.location().end.offset;
  }, r2.prototype.break = function() {
    this.location().end.offset > this._continue && (this._continue = false);
  }, r2.prototype.setAlignment = function(e7) {
    this._stack.top.align = e7;
  }, r2.prototype.alignment = function() {
    return this._stack.top.align;
  }, r2.prototype.setFontFamily = function(e7) {
    this._stack.top.attrs.fontFamily = e7;
  }, r2.prototype.setFontWeight = function(e7) {
    this._stack.top.attrs.fontWeight = e7;
  }, r2.prototype.setFontShape = function(e7) {
    "em" === e7 && (e7 = "it" === this._activeAttributeValue("fontShape") ? "up" : "it"), this._stack.top.attrs.fontShape = e7;
  }, r2.prototype.setFontSize = function(e7) {
    this._stack.top.attrs.fontSize = e7;
  }, r2.prototype.setTextDecoration = function(e7) {
    this._stack.top.attrs.textDecoration = e7;
  }, r2.prototype._inlineAttributes = function() {
    var e7;
    return [(e7 = this._stack.top.attrs).fontFamily, e7.fontWeight, e7.fontShape, e7.fontSize, e7.textDecoration].join(" ").replace(/\s+/g, " ").trim();
  }, r2.prototype._activeAttributeValue = function(e7) {
    var t3, r3, n2;
    for (t3 = this._stack.length - 1; t3 >= 0; --t3) if (r3 = t3, n2 = this._stack[r3].attrs[e7]) return n2;
  }, r2.prototype.startsection = function(e7, t3, r3, n2, i2) {
    var o2, a2, s2;
    if (n2 != i2 || null != i2) return !r3 && this.counter("secnumdepth") >= t3 ? ("chapter" === e7 ? (o2 = this.create(this.block, this.macro("chaptername").concat(this.createText(this.symbol("space")), this.macro("the" + e7))), a2 = this.create(this[e7], [o2, i2])) : a2 = this.create(this[e7], this.macro("the" + e7).concat(this.createText(this.symbol("quad")), i2)), null != (s2 = this._stack.top.currentlabel.id) && (a2.id = s2)) : a2 = this.create(this[e7], i2), a2;
    !r3 && this.counter("secnumdepth") >= t3 && (this.stepCounter(e7), this.refCounter(e7, "sec-" + this.nextId()));
  }, r2.prototype.startlist = function() {
    return this.stepCounter("@listdepth"), this.counter("@listdepth") > 6 && e6("too deeply nested"), true;
  }, r2.prototype.endlist = function() {
    this.setCounter("@listdepth", this.counter("@listdepth") - 1), this.continue();
  }, r2.prototype.newLength = function(t3) {
    this.hasLength(t3) && e6("length " + t3 + " already defined!"), this._stack.top.lengths.set(t3, this.Length.zero);
  }, r2.prototype.hasLength = function(e7) {
    return this._stack.top.lengths.has(e7);
  }, r2.prototype.setLength = function(t3, r3) {
    this.hasLength(t3) || e6("no such length: " + t3), this._stack.top.lengths.set(t3, r3);
  }, r2.prototype.length = function(t3) {
    return this.hasLength(t3) || e6("no such length: " + t3), this._stack.top.lengths.get(t3);
  }, r2.prototype.theLength = function(e7) {
    var t3;
    return (t3 = this.create(this.inline, void 0, "the")).setAttribute("display-var", e7), t3;
  }, r2.prototype.newCounter = function(t3, r3) {
    this.hasCounter(t3) && e6("counter " + t3 + " already defined!"), this._counters.set(t3, 0), this._resets.set(t3, []), r3 && this.addToReset(t3, r3), this.hasMacro("the" + t3) && e6("macro \\the" + t3 + " already defined!"), this._macros["the" + t3] = function() {
      return [this.g.arabic(this.g.counter(t3))];
    };
  }, r2.prototype.hasCounter = function(e7) {
    return this._counters.has(e7);
  }, r2.prototype.setCounter = function(t3, r3) {
    this.hasCounter(t3) || e6("no such counter: " + t3), this._counters.set(t3, r3);
  }, r2.prototype.stepCounter = function(e7) {
    this.setCounter(e7, this.counter(e7) + 1), this.clearCounter(e7);
  }, r2.prototype.counter = function(t3) {
    return this.hasCounter(t3) || e6("no such counter: " + t3), this._counters.get(t3);
  }, r2.prototype.refCounter = function(e7, t3) {
    var r3;
    return t3 || (t3 = e7 + "-" + this.nextId(), r3 = this.create(this.anchor(t3))), this._stack.top.currentlabel = { id: t3, label: this.createFragment(or(this.hasMacro("p@" + e7) ? this.macro("p@" + e7) : []).concat(or(this.macro("the" + e7)))) }, r3;
  }, r2.prototype.addToReset = function(t3, r3) {
    this.hasCounter(r3) || e6("no such counter: " + r3), this.hasCounter(t3) || e6("no such counter: " + t3), this._resets.get(r3).push(t3);
  }, r2.prototype.clearCounter = function(e7) {
    var t3, r3, n2, i2;
    for (t3 = 0, n2 = (r3 = this._resets.get(e7)).length; t3 < n2; ++t3) i2 = r3[t3], this.clearCounter(i2), this.setCounter(i2, 0);
  }, r2.prototype.alph = function(e7) {
    return String.fromCharCode(96 + e7);
  }, r2.prototype.Alph = function(e7) {
    return String.fromCharCode(64 + e7);
  }, r2.prototype.arabic = function(e7) {
    return String(e7);
  }, r2.prototype.roman = function(e7) {
    return t2(e7, [["m", 1e3], ["cm", 900], ["d", 500], ["cd", 400], ["c", 100], ["xc", 90], ["l", 50], ["xl", 40], ["x", 10], ["ix", 9], ["v", 5], ["iv", 4], ["i", 1]]);
  }, r2.prototype.Roman = function(e7) {
    return t2(e7, [["M", 1e3], ["CM", 900], ["D", 500], ["CD", 400], ["C", 100], ["XC", 90], ["L", 50], ["XL", 40], ["X", 10], ["IX", 9], ["V", 5], ["IV", 4], ["I", 1]]);
  }, t2 = function(e7, t3) {
    var r3, n2, i2, o2;
    for (r3 = "", n2 = 0, i2 = t3.length; n2 < i2; ++n2) for (o2 = t3[n2]; e7 >= o2[1]; ) r3 += o2[0], e7 -= o2[1];
    return r3;
  }, r2.prototype.fnsymbol = function(t3) {
    switch (t3) {
      case 1:
        return this.symbol("textasteriskcentered");
      case 2:
        return this.symbol("textdagger");
      case 3:
        return this.symbol("textdaggerdbl");
      case 4:
        return this.symbol("textsection");
      case 5:
        return this.symbol("textparagraph");
      case 6:
        return this.symbol("textbardbl");
      case 7:
        return this.symbol("textasteriskcentered") + this.symbol("textasteriskcentered");
      case 8:
        return this.symbol("textdagger") + this.symbol("textdagger");
      case 9:
        return this.symbol("textdaggerdbl") + this.symbol("textdaggerdbl");
      default:
        return e6("fnsymbol value must be between 1 and 9");
    }
  }, r2.prototype.setLabel = function(t3) {
    var r3, n2, i2, o2;
    if (this._labels.has(t3) && e6("label " + t3 + " already defined!"), this._stack.top.currentlabel.id || console.warn("warning: no \\@currentlabel available for label " + t3 + "!"), this._labels.set(t3, this._stack.top.currentlabel), this._refs.has(t3)) {
      for (r3 = 0, i2 = (n2 = this._refs.get(t3)).length; r3 < i2; ++r3) {
        for (o2 = n2[r3]; o2.firstChild; ) o2.removeChild(o2.firstChild);
        o2.appendChild(this._stack.top.currentlabel.label.cloneNode(true)), o2.setAttribute("href", "#" + this._stack.top.currentlabel.id);
      }
      this._refs.delete(t3);
    }
  }, r2.prototype.ref = function(e7) {
    var t3, r3;
    return (t3 = this._labels.get(e7)) ? this.create(this.link("#" + t3.id), t3.label.cloneNode(true)) : (r3 = this.create(this.link("#"), this.createText("??")), this._refs.has(e7) ? this._refs.get(e7).push(r3) : this._refs.set(e7, [r3]), r3);
  }, r2.prototype.logUndefinedRefs = function() {
    var e7, t3;
    if (0 !== this._refs.size) {
      for (e7 = this._refs.keys(); !(t3 = e7.next()).done; ) console.warn("warning: reference '" + t3.value + "' undefined");
      console.warn("There were undefined references.");
    }
  }, r2.prototype.marginpar = function(e7) {
    var t3, r3, n2;
    return t3 = this.nextId(), (r3 = this.create(this.block, [this.create(this.inline, null, "mpbaseline"), e7])).id = t3, this._marginpars.push(r3), (n2 = this.create(this.inline, null, "mpbaseline")).id = "marginref-" + t3, n2;
  }, r2;
})();
const sr = {}, lr = [];
function ur(e6, t2) {
  if (Array.isArray(e6)) for (const r2 of e6) ur(r2, t2);
  else if ("object" != typeof e6) hr(Object.getOwnPropertyNames(t2)), sr[e6] = Object.assign(sr[e6] || {}, t2);
  else for (const t3 in e6) ur(t3, e6[t3]);
}
function cr(e6) {
  return sr[e6] || {};
}
function hr(e6) {
  lr.push(...e6);
}
function pr(e6, t2) {
  let r2;
  const n2 = e6.length, i2 = [];
  for (r2 = 0; r2 < n2; r2++) i2.push(t2(e6[r2]));
  return i2;
}
function dr(e6) {
  return e6 % 360 * Math.PI / 180;
}
function mr(e6) {
  return e6.toLowerCase().replace(/-(.)/g, (function(e7, t2) {
    return t2.toUpperCase();
  }));
}
function gr(e6) {
  return e6.charAt(0).toUpperCase() + e6.slice(1);
}
function fr(e6, t2, r2, n2) {
  return null != t2 && null != r2 || (n2 = n2 || e6.bbox(), null == t2 ? t2 = n2.width / n2.height * r2 : null == r2 && (r2 = n2.height / n2.width * t2)), { width: t2, height: r2 };
}
function br(e6, t2) {
  const r2 = e6.origin;
  let n2 = null != e6.ox ? e6.ox : null != e6.originX ? e6.originX : "center", i2 = null != e6.oy ? e6.oy : null != e6.originY ? e6.originY : "center";
  null != r2 && ([n2, i2] = Array.isArray(r2) ? r2 : "object" == typeof r2 ? [r2.x, r2.y] : [r2, r2]);
  const o2 = "string" == typeof n2, a2 = "string" == typeof i2;
  if (o2 || a2) {
    const { height: e7, width: r3, x: s2, y: l2 } = t2.bbox();
    o2 && (n2 = n2.includes("left") ? s2 : n2.includes("right") ? s2 + r3 : s2 + r3 / 2), a2 && (i2 = i2.includes("top") ? l2 : i2.includes("bottom") ? l2 + e7 : l2 + e7 / 2);
  }
  return [n2, i2];
}
const yr = "http://www.w3.org/2000/svg", vr = "http://www.w3.org/2000/xmlns/", xr = "http://www.w3.org/1999/xlink", wr = { window: "undefined" == typeof window ? null : window, document: "undefined" == typeof document ? null : document };
class kr {
}
const Ar = {}, _r = "___SYMBOL___ROOT___";
function Sr(e6, t2 = yr) {
  return wr.document.createElementNS(t2, e6);
}
function qr(e6, t2 = false) {
  if (e6 instanceof kr) return e6;
  if ("object" == typeof e6) return Tr(e6);
  if (null == e6) return new Ar[_r]();
  if ("string" == typeof e6 && "<" !== e6.charAt(0)) return Tr(wr.document.querySelector(e6));
  const r2 = t2 ? wr.document.createElement("div") : Sr("svg");
  return r2.innerHTML = e6, e6 = Tr(r2.firstChild), r2.removeChild(r2.firstChild), e6;
}
function Cr(e6, t2) {
  return t2 && t2.ownerDocument && t2 instanceof t2.ownerDocument.defaultView.Node ? t2 : Sr(e6);
}
function zr(e6) {
  if (!e6) return null;
  if (e6.instance instanceof kr) return e6.instance;
  if ("#document-fragment" === e6.nodeName) return new Ar.Fragment(e6);
  let t2 = gr(e6.nodeName || "Dom");
  return "LinearGradient" === t2 || "RadialGradient" === t2 ? t2 = "Gradient" : Ar[t2] || (t2 = "Dom"), new Ar[t2](e6);
}
let Tr = zr;
function Mr(e6, t2 = e6.name, r2 = false) {
  return Ar[t2] = e6, r2 && (Ar[_r] = e6), hr(Object.getOwnPropertyNames(e6.prototype)), e6;
}
let Er = 1e3;
function Dr(e6) {
  return "Svgjs" + gr(e6) + Er++;
}
function Lr(e6) {
  for (let t2 = e6.children.length - 1; t2 >= 0; t2--) Lr(e6.children[t2]);
  return e6.id ? (e6.id = Dr(e6.nodeName), e6) : e6;
}
function Br(e6, t2) {
  let r2, n2;
  for (n2 = (e6 = Array.isArray(e6) ? e6 : [e6]).length - 1; n2 >= 0; n2--) for (r2 in t2) e6[n2].prototype[r2] = t2[r2];
}
function Nr(e6) {
  return function(...t2) {
    const r2 = t2[t2.length - 1];
    return !r2 || r2.constructor !== Object || r2 instanceof Array ? e6.apply(this, t2) : e6.apply(this, t2.slice(0, -1)).attr(r2);
  };
}
ur("Dom", { siblings: function() {
  return this.parent().children();
}, position: function() {
  return this.parent().index(this);
}, next: function() {
  return this.siblings()[this.position() + 1];
}, prev: function() {
  return this.siblings()[this.position() - 1];
}, forward: function() {
  const e6 = this.position();
  return this.parent().add(this.remove(), e6 + 1), this;
}, backward: function() {
  const e6 = this.position();
  return this.parent().add(this.remove(), e6 ? e6 - 1 : 0), this;
}, front: function() {
  return this.parent().add(this.remove()), this;
}, back: function() {
  return this.parent().add(this.remove(), 0), this;
}, before: function(e6) {
  (e6 = qr(e6)).remove();
  const t2 = this.position();
  return this.parent().add(e6, t2), this;
}, after: function(e6) {
  (e6 = qr(e6)).remove();
  const t2 = this.position();
  return this.parent().add(e6, t2 + 1), this;
}, insertBefore: function(e6) {
  return (e6 = qr(e6)).before(this), this;
}, insertAfter: function(e6) {
  return (e6 = qr(e6)).after(this), this;
} });
const Or = /^([+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?)([a-z%]*)$/i, Fr = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i, Rr = /rgb\((\d+),(\d+),(\d+)\)/, Hr = /(#[a-z_][a-z0-9\-_]*)/i, Vr = /\)\s*,?\s*/, Ir = /\s/g, Pr = /^#[a-f0-9]{3}$|^#[a-f0-9]{6}$/i, jr = /^rgb\(/, Gr = /^(\s+)?$/, Ur = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i, Yr = /\.(jpg|jpeg|png|gif|svg)(\?[^=]+.*)?/i, Xr = /[\s,]+/, Wr = /[MLHVCSQTAZ]/i;
function $r(e6) {
  const t2 = Math.round(e6), r2 = Math.max(0, Math.min(255, t2)).toString(16);
  return 1 === r2.length ? "0" + r2 : r2;
}
function Zr(e6, t2) {
  for (let r2 = t2.length; r2--; ) if (null == e6[t2[r2]]) return false;
  return true;
}
function Jr(e6, t2, r2) {
  return r2 < 0 && (r2 += 1), r2 > 1 && (r2 -= 1), r2 < 1 / 6 ? e6 + 6 * (t2 - e6) * r2 : r2 < 0.5 ? t2 : r2 < 2 / 3 ? e6 + (t2 - e6) * (2 / 3 - r2) * 6 : e6;
}
ur("Dom", { classes: function() {
  const e6 = this.attr("class");
  return null == e6 ? [] : e6.trim().split(Xr);
}, hasClass: function(e6) {
  return -1 !== this.classes().indexOf(e6);
}, addClass: function(e6) {
  if (!this.hasClass(e6)) {
    const t2 = this.classes();
    t2.push(e6), this.attr("class", t2.join(" "));
  }
  return this;
}, removeClass: function(e6) {
  return this.hasClass(e6) && this.attr("class", this.classes().filter((function(t2) {
    return t2 !== e6;
  })).join(" ")), this;
}, toggleClass: function(e6) {
  return this.hasClass(e6) ? this.removeClass(e6) : this.addClass(e6);
} }), ur("Dom", { css: function(e6, t2) {
  const r2 = {};
  if (0 === arguments.length) return this.node.style.cssText.split(/\s*;\s*/).filter((function(e7) {
    return !!e7.length;
  })).forEach((function(e7) {
    const t3 = e7.split(/\s*:\s*/);
    r2[t3[0]] = t3[1];
  })), r2;
  if (arguments.length < 2) {
    if (Array.isArray(e6)) {
      for (const t3 of e6) {
        const e7 = mr(t3);
        r2[t3] = this.node.style[e7];
      }
      return r2;
    }
    if ("string" == typeof e6) return this.node.style[mr(e6)];
    if ("object" == typeof e6) for (const t3 in e6) this.node.style[mr(t3)] = null == e6[t3] || Gr.test(e6[t3]) ? "" : e6[t3];
  }
  return 2 === arguments.length && (this.node.style[mr(e6)] = null == t2 || Gr.test(t2) ? "" : t2), this;
}, show: function() {
  return this.css("display", "");
}, hide: function() {
  return this.css("display", "none");
}, visible: function() {
  return "none" !== this.css("display");
} }), ur("Dom", { data: function(e6, t2, r2) {
  if (null == e6) return this.data(pr((function(e7, t3) {
    let r3;
    const n2 = e7.length, i2 = [];
    for (r3 = 0; r3 < n2; r3++) t3(e7[r3]) && i2.push(e7[r3]);
    return i2;
  })(this.node.attributes, ((e7) => 0 === e7.nodeName.indexOf("data-"))), ((e7) => e7.nodeName.slice(5))));
  if (e6 instanceof Array) {
    const t3 = {};
    for (const r3 of e6) t3[r3] = this.data(r3);
    return t3;
  }
  if ("object" == typeof e6) for (t2 in e6) this.data(t2, e6[t2]);
  else if (arguments.length < 2) try {
    return JSON.parse(this.attr("data-" + e6));
  } catch (t3) {
    return this.attr("data-" + e6);
  }
  else this.attr("data-" + e6, null === t2 ? null : true === r2 || "string" == typeof t2 || "number" == typeof t2 ? t2 : JSON.stringify(t2));
  return this;
} }), ur("Dom", { remember: function(e6, t2) {
  if ("object" == typeof arguments[0]) for (const t3 in e6) this.remember(t3, e6[t3]);
  else {
    if (1 === arguments.length) return this.memory()[e6];
    this.memory()[e6] = t2;
  }
  return this;
}, forget: function() {
  if (0 === arguments.length) this._memory = {};
  else for (let e6 = arguments.length - 1; e6 >= 0; e6--) delete this.memory()[arguments[e6]];
  return this;
}, memory: function() {
  return this._memory = this._memory || {};
} });
class Kr {
  constructor(...e6) {
    this.init(...e6);
  }
  static isColor(e6) {
    return e6 && (e6 instanceof Kr || this.isRgb(e6) || this.test(e6));
  }
  static isRgb(e6) {
    return e6 && "number" == typeof e6.r && "number" == typeof e6.g && "number" == typeof e6.b;
  }
  static random(e6 = "vibrant", t2, r2) {
    const { random: n2, round: i2, sin: o2, PI: a2 } = Math;
    if ("vibrant" === e6) {
      const e7 = 24 * n2() + 57, t3 = 38 * n2() + 45, r3 = 360 * n2();
      return new Kr(e7, t3, r3, "lch");
    }
    if ("sine" === e6) {
      const e7 = i2(80 * o2(2 * a2 * (t2 = null == t2 ? n2() : t2) / 0.5 + 0.01) + 150), r3 = i2(50 * o2(2 * a2 * t2 / 0.5 + 4.6) + 200), s2 = i2(100 * o2(2 * a2 * t2 / 0.5 + 2.3) + 150);
      return new Kr(e7, r3, s2);
    }
    if ("pastel" === e6) {
      const e7 = 8 * n2() + 86, t3 = 17 * n2() + 9, r3 = 360 * n2();
      return new Kr(e7, t3, r3, "lch");
    }
    if ("dark" === e6) {
      const e7 = 10 + 10 * n2(), t3 = 50 * n2() + 86, r3 = 360 * n2();
      return new Kr(e7, t3, r3, "lch");
    }
    if ("rgb" === e6) {
      const e7 = 255 * n2(), t3 = 255 * n2(), r3 = 255 * n2();
      return new Kr(e7, t3, r3);
    }
    if ("lab" === e6) {
      const e7 = 100 * n2(), t3 = 256 * n2() - 128, r3 = 256 * n2() - 128;
      return new Kr(e7, t3, r3, "lab");
    }
    if ("grey" === e6) {
      const e7 = 255 * n2();
      return new Kr(e7, e7, e7);
    }
    throw new Error("Unsupported random color mode");
  }
  static test(e6) {
    return "string" == typeof e6 && (Pr.test(e6) || jr.test(e6));
  }
  cmyk() {
    const { _a: e6, _b: t2, _c: r2 } = this.rgb(), [n2, i2, o2] = [e6, t2, r2].map(((e7) => e7 / 255)), a2 = Math.min(1 - n2, 1 - i2, 1 - o2);
    if (1 === a2) return new Kr(0, 0, 0, 1, "cmyk");
    return new Kr((1 - n2 - a2) / (1 - a2), (1 - i2 - a2) / (1 - a2), (1 - o2 - a2) / (1 - a2), a2, "cmyk");
  }
  hsl() {
    const { _a: e6, _b: t2, _c: r2 } = this.rgb(), [n2, i2, o2] = [e6, t2, r2].map(((e7) => e7 / 255)), a2 = Math.max(n2, i2, o2), s2 = Math.min(n2, i2, o2), l2 = (a2 + s2) / 2, u2 = a2 === s2, c2 = a2 - s2;
    return new Kr(360 * (u2 ? 0 : a2 === n2 ? ((i2 - o2) / c2 + (i2 < o2 ? 6 : 0)) / 6 : a2 === i2 ? ((o2 - n2) / c2 + 2) / 6 : a2 === o2 ? ((n2 - i2) / c2 + 4) / 6 : 0), 100 * (u2 ? 0 : l2 > 0.5 ? c2 / (2 - a2 - s2) : c2 / (a2 + s2)), 100 * l2, "hsl");
  }
  init(e6 = 0, t2 = 0, r2 = 0, n2 = 0, i2 = "rgb") {
    if (e6 = e6 || 0, this.space) for (const e7 in this.space) delete this[this.space[e7]];
    if ("number" == typeof e6) i2 = "string" == typeof n2 ? n2 : i2, n2 = "string" == typeof n2 ? 0 : n2, Object.assign(this, { _a: e6, _b: t2, _c: r2, _d: n2, space: i2 });
    else if (e6 instanceof Array) this.space = t2 || ("string" == typeof e6[3] ? e6[3] : e6[4]) || "rgb", Object.assign(this, { _a: e6[0], _b: e6[1], _c: e6[2], _d: e6[3] || 0 });
    else if (e6 instanceof Object) {
      const r3 = (function(e7, t3) {
        const r4 = Zr(e7, "rgb") ? { _a: e7.r, _b: e7.g, _c: e7.b, _d: 0, space: "rgb" } : Zr(e7, "xyz") ? { _a: e7.x, _b: e7.y, _c: e7.z, _d: 0, space: "xyz" } : Zr(e7, "hsl") ? { _a: e7.h, _b: e7.s, _c: e7.l, _d: 0, space: "hsl" } : Zr(e7, "lab") ? { _a: e7.l, _b: e7.a, _c: e7.b, _d: 0, space: "lab" } : Zr(e7, "lch") ? { _a: e7.l, _b: e7.c, _c: e7.h, _d: 0, space: "lch" } : Zr(e7, "cmyk") ? { _a: e7.c, _b: e7.m, _c: e7.y, _d: e7.k, space: "cmyk" } : { _a: 0, _b: 0, _c: 0, space: "rgb" };
        return r4.space = t3 || r4.space, r4;
      })(e6, t2);
      Object.assign(this, r3);
    } else if ("string" == typeof e6) if (jr.test(e6)) {
      const t3 = e6.replace(Ir, ""), [r3, n3, i3] = Rr.exec(t3).slice(1, 4).map(((e7) => parseInt(e7)));
      Object.assign(this, { _a: r3, _b: n3, _c: i3, _d: 0, space: "rgb" });
    } else {
      if (!Pr.test(e6)) throw Error("Unsupported string format, can't construct Color");
      {
        const t3 = (e7) => parseInt(e7, 16), [, r3, n3, i3] = Fr.exec((function(e7) {
          return 4 === e7.length ? ["#", e7.substring(1, 2), e7.substring(1, 2), e7.substring(2, 3), e7.substring(2, 3), e7.substring(3, 4), e7.substring(3, 4)].join("") : e7;
        })(e6)).map(t3);
        Object.assign(this, { _a: r3, _b: n3, _c: i3, _d: 0, space: "rgb" });
      }
    }
    const { _a: o2, _b: a2, _c: s2, _d: l2 } = this, u2 = "rgb" === this.space ? { r: o2, g: a2, b: s2 } : "xyz" === this.space ? { x: o2, y: a2, z: s2 } : "hsl" === this.space ? { h: o2, s: a2, l: s2 } : "lab" === this.space ? { l: o2, a: a2, b: s2 } : "lch" === this.space ? { l: o2, c: a2, h: s2 } : "cmyk" === this.space ? { c: o2, m: a2, y: s2, k: l2 } : {};
    Object.assign(this, u2);
  }
  lab() {
    const { x: e6, y: t2, z: r2 } = this.xyz();
    return new Kr(116 * t2 - 16, 500 * (e6 - t2), 200 * (t2 - r2), "lab");
  }
  lch() {
    const { l: e6, a: t2, b: r2 } = this.lab(), n2 = Math.sqrt(t2 ** 2 + r2 ** 2);
    let i2 = 180 * Math.atan2(r2, t2) / Math.PI;
    i2 < 0 && (i2 *= -1, i2 = 360 - i2);
    return new Kr(e6, n2, i2, "lch");
  }
  rgb() {
    if ("rgb" === this.space) return this;
    if ("lab" === (e6 = this.space) || "xyz" === e6 || "lch" === e6) {
      let { x: e7, y: t2, z: r2 } = this;
      if ("lab" === this.space || "lch" === this.space) {
        let { l: n3, a: i3, b: o3 } = this;
        if ("lch" === this.space) {
          const { c: e8, h: t3 } = this, r3 = Math.PI / 180;
          i3 = e8 * Math.cos(r3 * t3), o3 = e8 * Math.sin(r3 * t3);
        }
        const a3 = (n3 + 16) / 116, s3 = i3 / 500 + a3, l3 = a3 - o3 / 200, u3 = 16 / 116, c3 = 8856e-6, h2 = 7.787;
        e7 = 0.95047 * (s3 ** 3 > c3 ? s3 ** 3 : (s3 - u3) / h2), t2 = 1 * (a3 ** 3 > c3 ? a3 ** 3 : (a3 - u3) / h2), r2 = 1.08883 * (l3 ** 3 > c3 ? l3 ** 3 : (l3 - u3) / h2);
      }
      const n2 = 3.2406 * e7 + -1.5372 * t2 + -0.4986 * r2, i2 = -0.9689 * e7 + 1.8758 * t2 + 0.0415 * r2, o2 = 0.0557 * e7 + -0.204 * t2 + 1.057 * r2, a2 = Math.pow, s2 = 31308e-7, l2 = n2 > s2 ? 1.055 * a2(n2, 1 / 2.4) - 0.055 : 12.92 * n2, u2 = i2 > s2 ? 1.055 * a2(i2, 1 / 2.4) - 0.055 : 12.92 * i2, c2 = o2 > s2 ? 1.055 * a2(o2, 1 / 2.4) - 0.055 : 12.92 * o2;
      return new Kr(255 * l2, 255 * u2, 255 * c2);
    }
    if ("hsl" === this.space) {
      let { h: e7, s: t2, l: r2 } = this;
      if (e7 /= 360, t2 /= 100, r2 /= 100, 0 === t2) {
        r2 *= 255;
        return new Kr(r2, r2, r2);
      }
      const n2 = r2 < 0.5 ? r2 * (1 + t2) : r2 + t2 - r2 * t2, i2 = 2 * r2 - n2, o2 = 255 * Jr(i2, n2, e7 + 1 / 3), a2 = 255 * Jr(i2, n2, e7), s2 = 255 * Jr(i2, n2, e7 - 1 / 3);
      return new Kr(o2, a2, s2);
    }
    if ("cmyk" === this.space) {
      const { c: e7, m: t2, y: r2, k: n2 } = this, i2 = 255 * (1 - Math.min(1, e7 * (1 - n2) + n2)), o2 = 255 * (1 - Math.min(1, t2 * (1 - n2) + n2)), a2 = 255 * (1 - Math.min(1, r2 * (1 - n2) + n2));
      return new Kr(i2, o2, a2);
    }
    return this;
    var e6;
  }
  toArray() {
    const { _a: e6, _b: t2, _c: r2, _d: n2, space: i2 } = this;
    return [e6, t2, r2, n2, i2];
  }
  toHex() {
    const [e6, t2, r2] = this._clamped().map($r);
    return `#${e6}${t2}${r2}`;
  }
  toRgb() {
    const [e6, t2, r2] = this._clamped();
    return `rgb(${e6},${t2},${r2})`;
  }
  toString() {
    return this.toHex();
  }
  xyz() {
    const { _a: e6, _b: t2, _c: r2 } = this.rgb(), [n2, i2, o2] = [e6, t2, r2].map(((e7) => e7 / 255)), a2 = n2 > 0.04045 ? Math.pow((n2 + 0.055) / 1.055, 2.4) : n2 / 12.92, s2 = i2 > 0.04045 ? Math.pow((i2 + 0.055) / 1.055, 2.4) : i2 / 12.92, l2 = o2 > 0.04045 ? Math.pow((o2 + 0.055) / 1.055, 2.4) : o2 / 12.92, u2 = (0.4124 * a2 + 0.3576 * s2 + 0.1805 * l2) / 0.95047, c2 = (0.2126 * a2 + 0.7152 * s2 + 0.0722 * l2) / 1, h2 = (0.0193 * a2 + 0.1192 * s2 + 0.9505 * l2) / 1.08883, p2 = u2 > 8856e-6 ? Math.pow(u2, 1 / 3) : 7.787 * u2 + 16 / 116, d2 = c2 > 8856e-6 ? Math.pow(c2, 1 / 3) : 7.787 * c2 + 16 / 116, m2 = h2 > 8856e-6 ? Math.pow(h2, 1 / 3) : 7.787 * h2 + 16 / 116;
    return new Kr(p2, d2, m2, "xyz");
  }
  _clamped() {
    const { _a: e6, _b: t2, _c: r2 } = this.rgb(), { max: n2, min: i2, round: o2 } = Math;
    return [e6, t2, r2].map(((e7) => n2(0, i2(o2(e7), 255))));
  }
}
class Qr {
  constructor(...e6) {
    this.init(...e6);
  }
  clone() {
    return new Qr(this);
  }
  init(e6, t2) {
    const r2 = 0, n2 = 0, i2 = Array.isArray(e6) ? { x: e6[0], y: e6[1] } : "object" == typeof e6 ? { x: e6.x, y: e6.y } : { x: e6, y: t2 };
    return this.x = null == i2.x ? r2 : i2.x, this.y = null == i2.y ? n2 : i2.y, this;
  }
  toArray() {
    return [this.x, this.y];
  }
  transform(e6) {
    return this.clone().transformO(e6);
  }
  transformO(e6) {
    tn.isMatrixLike(e6) || (e6 = new tn(e6));
    const { x: t2, y: r2 } = this;
    return this.x = e6.a * t2 + e6.c * r2 + e6.e, this.y = e6.b * t2 + e6.d * r2 + e6.f, this;
  }
}
function en(e6, t2, r2) {
  return Math.abs(t2 - e6) < 1e-6;
}
class tn {
  constructor(...e6) {
    this.init(...e6);
  }
  static formatTransforms(e6) {
    const t2 = "both" === e6.flip || true === e6.flip, r2 = e6.flip && (t2 || "x" === e6.flip) ? -1 : 1, n2 = e6.flip && (t2 || "y" === e6.flip) ? -1 : 1, i2 = e6.skew && e6.skew.length ? e6.skew[0] : isFinite(e6.skew) ? e6.skew : isFinite(e6.skewX) ? e6.skewX : 0, o2 = e6.skew && e6.skew.length ? e6.skew[1] : isFinite(e6.skew) ? e6.skew : isFinite(e6.skewY) ? e6.skewY : 0, a2 = e6.scale && e6.scale.length ? e6.scale[0] * r2 : isFinite(e6.scale) ? e6.scale * r2 : isFinite(e6.scaleX) ? e6.scaleX * r2 : r2, s2 = e6.scale && e6.scale.length ? e6.scale[1] * n2 : isFinite(e6.scale) ? e6.scale * n2 : isFinite(e6.scaleY) ? e6.scaleY * n2 : n2, l2 = e6.shear || 0, u2 = e6.rotate || e6.theta || 0, c2 = new Qr(e6.origin || e6.around || e6.ox || e6.originX, e6.oy || e6.originY), h2 = c2.x, p2 = c2.y, d2 = new Qr(e6.position || e6.px || e6.positionX || NaN, e6.py || e6.positionY || NaN), m2 = d2.x, g2 = d2.y, f2 = new Qr(e6.translate || e6.tx || e6.translateX, e6.ty || e6.translateY), b2 = f2.x, y2 = f2.y, v2 = new Qr(e6.relative || e6.rx || e6.relativeX, e6.ry || e6.relativeY);
    return { scaleX: a2, scaleY: s2, skewX: i2, skewY: o2, shear: l2, theta: u2, rx: v2.x, ry: v2.y, tx: b2, ty: y2, ox: h2, oy: p2, px: m2, py: g2 };
  }
  static fromArray(e6) {
    return { a: e6[0], b: e6[1], c: e6[2], d: e6[3], e: e6[4], f: e6[5] };
  }
  static isMatrixLike(e6) {
    return null != e6.a || null != e6.b || null != e6.c || null != e6.d || null != e6.e || null != e6.f;
  }
  static matrixMultiply(e6, t2, r2) {
    const n2 = e6.a * t2.a + e6.c * t2.b, i2 = e6.b * t2.a + e6.d * t2.b, o2 = e6.a * t2.c + e6.c * t2.d, a2 = e6.b * t2.c + e6.d * t2.d, s2 = e6.e + e6.a * t2.e + e6.c * t2.f, l2 = e6.f + e6.b * t2.e + e6.d * t2.f;
    return r2.a = n2, r2.b = i2, r2.c = o2, r2.d = a2, r2.e = s2, r2.f = l2, r2;
  }
  around(e6, t2, r2) {
    return this.clone().aroundO(e6, t2, r2);
  }
  aroundO(e6, t2, r2) {
    const n2 = e6 || 0, i2 = t2 || 0;
    return this.translateO(-n2, -i2).lmultiplyO(r2).translateO(n2, i2);
  }
  clone() {
    return new tn(this);
  }
  decompose(e6 = 0, t2 = 0) {
    const r2 = this.a, n2 = this.b, i2 = this.c, o2 = this.d, a2 = this.e, s2 = this.f, l2 = r2 * o2 - n2 * i2, u2 = l2 > 0 ? 1 : -1, c2 = u2 * Math.sqrt(r2 * r2 + n2 * n2), h2 = Math.atan2(u2 * n2, u2 * r2), p2 = 180 / Math.PI * h2, d2 = Math.cos(h2), m2 = Math.sin(h2), g2 = (r2 * i2 + n2 * o2) / l2, f2 = i2 * c2 / (g2 * r2 - n2) || o2 * c2 / (g2 * n2 + r2);
    return { scaleX: c2, scaleY: f2, shear: g2, rotate: p2, translateX: a2 - e6 + e6 * d2 * c2 + t2 * (g2 * d2 * c2 - m2 * f2), translateY: s2 - t2 + e6 * m2 * c2 + t2 * (g2 * m2 * c2 + d2 * f2), originX: e6, originY: t2, a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f };
  }
  equals(e6) {
    if (e6 === this) return true;
    const t2 = new tn(e6);
    return en(this.a, t2.a) && en(this.b, t2.b) && en(this.c, t2.c) && en(this.d, t2.d) && en(this.e, t2.e) && en(this.f, t2.f);
  }
  flip(e6, t2) {
    return this.clone().flipO(e6, t2);
  }
  flipO(e6, t2) {
    return "x" === e6 ? this.scaleO(-1, 1, t2, 0) : "y" === e6 ? this.scaleO(1, -1, 0, t2) : this.scaleO(-1, -1, e6, t2 || e6);
  }
  init(e6) {
    const t2 = tn.fromArray([1, 0, 0, 1, 0, 0]);
    return e6 = e6 instanceof qn ? e6.matrixify() : "string" == typeof e6 ? tn.fromArray(e6.split(Xr).map(parseFloat)) : Array.isArray(e6) ? tn.fromArray(e6) : "object" == typeof e6 && tn.isMatrixLike(e6) ? e6 : "object" == typeof e6 ? new tn().transform(e6) : 6 === arguments.length ? tn.fromArray([].slice.call(arguments)) : t2, this.a = null != e6.a ? e6.a : t2.a, this.b = null != e6.b ? e6.b : t2.b, this.c = null != e6.c ? e6.c : t2.c, this.d = null != e6.d ? e6.d : t2.d, this.e = null != e6.e ? e6.e : t2.e, this.f = null != e6.f ? e6.f : t2.f, this;
  }
  inverse() {
    return this.clone().inverseO();
  }
  inverseO() {
    const e6 = this.a, t2 = this.b, r2 = this.c, n2 = this.d, i2 = this.e, o2 = this.f, a2 = e6 * n2 - t2 * r2;
    if (!a2) throw new Error("Cannot invert " + this);
    const s2 = n2 / a2, l2 = -t2 / a2, u2 = -r2 / a2, c2 = e6 / a2, h2 = -(s2 * i2 + u2 * o2), p2 = -(l2 * i2 + c2 * o2);
    return this.a = s2, this.b = l2, this.c = u2, this.d = c2, this.e = h2, this.f = p2, this;
  }
  lmultiply(e6) {
    return this.clone().lmultiplyO(e6);
  }
  lmultiplyO(e6) {
    const t2 = e6 instanceof tn ? e6 : new tn(e6);
    return tn.matrixMultiply(t2, this, this);
  }
  multiply(e6) {
    return this.clone().multiplyO(e6);
  }
  multiplyO(e6) {
    const t2 = e6 instanceof tn ? e6 : new tn(e6);
    return tn.matrixMultiply(this, t2, this);
  }
  rotate(e6, t2, r2) {
    return this.clone().rotateO(e6, t2, r2);
  }
  rotateO(e6, t2 = 0, r2 = 0) {
    e6 = dr(e6);
    const n2 = Math.cos(e6), i2 = Math.sin(e6), { a: o2, b: a2, c: s2, d: l2, e: u2, f: c2 } = this;
    return this.a = o2 * n2 - a2 * i2, this.b = a2 * n2 + o2 * i2, this.c = s2 * n2 - l2 * i2, this.d = l2 * n2 + s2 * i2, this.e = u2 * n2 - c2 * i2 + r2 * i2 - t2 * n2 + t2, this.f = c2 * n2 + u2 * i2 - t2 * i2 - r2 * n2 + r2, this;
  }
  scale(e6, t2, r2, n2) {
    return this.clone().scaleO(...arguments);
  }
  scaleO(e6, t2 = e6, r2 = 0, n2 = 0) {
    3 === arguments.length && (n2 = r2, r2 = t2, t2 = e6);
    const { a: i2, b: o2, c: a2, d: s2, e: l2, f: u2 } = this;
    return this.a = i2 * e6, this.b = o2 * t2, this.c = a2 * e6, this.d = s2 * t2, this.e = l2 * e6 - r2 * e6 + r2, this.f = u2 * t2 - n2 * t2 + n2, this;
  }
  shear(e6, t2, r2) {
    return this.clone().shearO(e6, t2, r2);
  }
  shearO(e6, t2 = 0, r2 = 0) {
    const { a: n2, b: i2, c: o2, d: a2, e: s2, f: l2 } = this;
    return this.a = n2 + i2 * e6, this.c = o2 + a2 * e6, this.e = s2 + l2 * e6 - r2 * e6, this;
  }
  skew(e6, t2, r2, n2) {
    return this.clone().skewO(...arguments);
  }
  skewO(e6, t2 = e6, r2 = 0, n2 = 0) {
    3 === arguments.length && (n2 = r2, r2 = t2, t2 = e6), e6 = dr(e6), t2 = dr(t2);
    const i2 = Math.tan(e6), o2 = Math.tan(t2), { a: a2, b: s2, c: l2, d: u2, e: c2, f: h2 } = this;
    return this.a = a2 + s2 * i2, this.b = s2 + a2 * o2, this.c = l2 + u2 * i2, this.d = u2 + l2 * o2, this.e = c2 + h2 * i2 - n2 * i2, this.f = h2 + c2 * o2 - r2 * o2, this;
  }
  skewX(e6, t2, r2) {
    return this.skew(e6, 0, t2, r2);
  }
  skewY(e6, t2, r2) {
    return this.skew(0, e6, t2, r2);
  }
  toArray() {
    return [this.a, this.b, this.c, this.d, this.e, this.f];
  }
  toString() {
    return "matrix(" + this.a + "," + this.b + "," + this.c + "," + this.d + "," + this.e + "," + this.f + ")";
  }
  transform(e6) {
    if (tn.isMatrixLike(e6)) {
      return new tn(e6).multiplyO(this);
    }
    const t2 = tn.formatTransforms(e6), { x: r2, y: n2 } = new Qr(t2.ox, t2.oy).transform(this), i2 = new tn().translateO(t2.rx, t2.ry).lmultiplyO(this).translateO(-r2, -n2).scaleO(t2.scaleX, t2.scaleY).skewO(t2.skewX, t2.skewY).shearO(t2.shear).rotateO(t2.theta).translateO(r2, n2);
    if (isFinite(t2.px) || isFinite(t2.py)) {
      const e7 = new Qr(r2, n2).transform(i2), o2 = isFinite(t2.px) ? t2.px - e7.x : 0, a2 = isFinite(t2.py) ? t2.py - e7.y : 0;
      i2.translateO(o2, a2);
    }
    return i2.translateO(t2.tx, t2.ty), i2;
  }
  translate(e6, t2) {
    return this.clone().translateO(e6, t2);
  }
  translateO(e6, t2) {
    return this.e += e6 || 0, this.f += t2 || 0, this;
  }
  valueOf() {
    return { a: this.a, b: this.b, c: this.c, d: this.d, e: this.e, f: this.f };
  }
}
function rn() {
  if (!rn.nodes) {
    const e6 = qr().size(2, 0);
    e6.node.style.cssText = ["opacity: 0", "position: absolute", "left: -100%", "top: -100%", "overflow: hidden"].join(";"), e6.attr("focusable", "false"), e6.attr("aria-hidden", "true");
    const t2 = e6.path().node;
    rn.nodes = { svg: e6, path: t2 };
  }
  if (!rn.nodes.svg.node.parentNode) {
    const e6 = wr.document.body || wr.document.documentElement;
    rn.nodes.svg.addTo(e6);
  }
  return rn.nodes;
}
function nn(e6) {
  return !(e6.width || e6.height || e6.x || e6.y);
}
Mr(tn, "Matrix");
class on {
  constructor(...e6) {
    this.init(...e6);
  }
  addOffset() {
    return this.x += wr.window.pageXOffset, this.y += wr.window.pageYOffset, new on(this);
  }
  init(e6) {
    return e6 = "string" == typeof e6 ? e6.split(Xr).map(parseFloat) : Array.isArray(e6) ? e6 : "object" == typeof e6 ? [null != e6.left ? e6.left : e6.x, null != e6.top ? e6.top : e6.y, e6.width, e6.height] : 4 === arguments.length ? [].slice.call(arguments) : [0, 0, 0, 0], this.x = e6[0] || 0, this.y = e6[1] || 0, this.width = this.w = e6[2] || 0, this.height = this.h = e6[3] || 0, this.x2 = this.x + this.w, this.y2 = this.y + this.h, this.cx = this.x + this.w / 2, this.cy = this.y + this.h / 2, this;
  }
  isNulled() {
    return nn(this);
  }
  merge(e6) {
    const t2 = Math.min(this.x, e6.x), r2 = Math.min(this.y, e6.y), n2 = Math.max(this.x + this.width, e6.x + e6.width) - t2, i2 = Math.max(this.y + this.height, e6.y + e6.height) - r2;
    return new on(t2, r2, n2, i2);
  }
  toArray() {
    return [this.x, this.y, this.width, this.height];
  }
  toString() {
    return this.x + " " + this.y + " " + this.width + " " + this.height;
  }
  transform(e6) {
    e6 instanceof tn || (e6 = new tn(e6));
    let t2 = 1 / 0, r2 = -1 / 0, n2 = 1 / 0, i2 = -1 / 0;
    return [new Qr(this.x, this.y), new Qr(this.x2, this.y), new Qr(this.x, this.y2), new Qr(this.x2, this.y2)].forEach((function(o2) {
      o2 = o2.transform(e6), t2 = Math.min(t2, o2.x), r2 = Math.max(r2, o2.x), n2 = Math.min(n2, o2.y), i2 = Math.max(i2, o2.y);
    })), new on(t2, n2, r2 - t2, i2 - n2);
  }
}
function an(e6, t2, r2) {
  let n2;
  try {
    if (n2 = t2(e6.node), nn(n2) && ((i2 = e6.node) !== wr.document && !(wr.document.documentElement.contains || function(e7) {
      for (; e7.parentNode; ) e7 = e7.parentNode;
      return e7 === wr.document;
    }).call(wr.document.documentElement, i2))) throw new Error("Element not in the dom");
  } catch (t3) {
    n2 = r2(e6);
  }
  var i2;
  return n2;
}
ur({ viewbox: { viewbox(e6, t2, r2, n2) {
  return null == e6 ? new on(this.attr("viewBox")) : this.attr("viewBox", new on(e6, t2, r2, n2));
}, zoom(e6, t2) {
  let { width: r2, height: n2 } = this.attr(["width", "height"]);
  if ((r2 || n2) && "string" != typeof r2 && "string" != typeof n2 || (r2 = this.node.clientWidth, n2 = this.node.clientHeight), !r2 || !n2) throw new Error("Impossible to get absolute width and height. Please provide an absolute width and height attribute on the zooming element");
  const i2 = this.viewbox(), o2 = r2 / i2.width, a2 = n2 / i2.height, s2 = Math.min(o2, a2);
  if (null == e6) return s2;
  let l2 = s2 / e6;
  l2 === 1 / 0 && (l2 = Number.MAX_SAFE_INTEGER / 100), t2 = t2 || new Qr(r2 / 2 / o2 + i2.x, n2 / 2 / a2 + i2.y);
  const u2 = new on(i2).transform(new tn({ scale: l2, origin: t2 }));
  return this.viewbox(u2);
} } }), Mr(on, "Box");
class sn extends Array {
  constructor(e6 = [], ...t2) {
    if (super(e6, ...t2), "number" == typeof e6) return this;
    this.length = 0, this.push(...e6);
  }
}
Br([sn], { each(e6, ...t2) {
  return "function" == typeof e6 ? this.map(((t3, r2, n2) => e6.call(t3, t3, r2, n2))) : this.map(((r2) => r2[e6](...t2)));
}, toArray() {
  return Array.prototype.concat.apply([], this);
} });
const ln = ["toArray", "constructor", "each"];
function un(e6, t2) {
  return new sn(pr((t2 || wr.document).querySelectorAll(e6), (function(e7) {
    return zr(e7);
  })));
}
sn.extend = function(e6) {
  e6 = e6.reduce(((e7, t2) => (ln.includes(t2) || "_" === t2[0] || (e7[t2] = function(...e8) {
    return this.each(t2, ...e8);
  }), e7)), {}), Br([sn], e6);
};
let cn = 0;
const hn = {};
function pn(e6) {
  let t2 = e6.getEventHolder();
  return t2 === wr.window && (t2 = hn), t2.events || (t2.events = {}), t2.events;
}
function dn(e6) {
  return e6.getEventTarget();
}
function mn(e6, t2, r2, n2, i2) {
  const o2 = r2.bind(n2 || e6), a2 = qr(e6), s2 = pn(a2), l2 = dn(a2);
  t2 = Array.isArray(t2) ? t2 : t2.split(Xr), r2._svgjsListenerId || (r2._svgjsListenerId = ++cn), t2.forEach((function(e7) {
    const t3 = e7.split(".")[0], n3 = e7.split(".")[1] || "*";
    s2[t3] = s2[t3] || {}, s2[t3][n3] = s2[t3][n3] || {}, s2[t3][n3][r2._svgjsListenerId] = o2, l2.addEventListener(t3, o2, i2 || false);
  }));
}
function gn(e6, t2, r2, n2) {
  const i2 = qr(e6), o2 = pn(i2), a2 = dn(i2);
  ("function" != typeof r2 || (r2 = r2._svgjsListenerId)) && (t2 = Array.isArray(t2) ? t2 : (t2 || "").split(Xr)).forEach((function(e7) {
    const t3 = e7 && e7.split(".")[0], s2 = e7 && e7.split(".")[1];
    let l2, u2;
    if (r2) o2[t3] && o2[t3][s2 || "*"] && (a2.removeEventListener(t3, o2[t3][s2 || "*"][r2], n2 || false), delete o2[t3][s2 || "*"][r2]);
    else if (t3 && s2) {
      if (o2[t3] && o2[t3][s2]) {
        for (u2 in o2[t3][s2]) gn(a2, [t3, s2].join("."), u2);
        delete o2[t3][s2];
      }
    } else if (s2) for (e7 in o2) for (l2 in o2[e7]) s2 === l2 && gn(a2, [e7, s2].join("."));
    else if (t3) {
      if (o2[t3]) {
        for (l2 in o2[t3]) gn(a2, [t3, l2].join("."));
        delete o2[t3];
      }
    } else {
      for (e7 in o2) gn(a2, e7);
      !(function(e8) {
        let t4 = e8.getEventHolder();
        t4 === wr.window && (t4 = hn), t4.events && (t4.events = {});
      })(i2);
    }
  }));
}
class fn extends kr {
  addEventListener() {
  }
  dispatch(e6, t2, r2) {
    return (function(e7, t3, r3, n2) {
      const i2 = dn(e7);
      return t3 instanceof wr.window.Event || (t3 = new wr.window.CustomEvent(t3, { detail: r3, cancelable: true, ...n2 })), i2.dispatchEvent(t3), t3;
    })(this, e6, t2, r2);
  }
  dispatchEvent(e6) {
    const t2 = this.getEventHolder().events;
    if (!t2) return true;
    const r2 = t2[e6.type];
    for (const t3 in r2) for (const n2 in r2[t3]) r2[t3][n2](e6);
    return !e6.defaultPrevented;
  }
  fire(e6, t2, r2) {
    return this.dispatch(e6, t2, r2), this;
  }
  getEventHolder() {
    return this;
  }
  getEventTarget() {
    return this;
  }
  off(e6, t2, r2) {
    return gn(this, e6, t2, r2), this;
  }
  on(e6, t2, r2, n2) {
    return mn(this, e6, t2, r2, n2), this;
  }
  removeEventListener() {
  }
}
function bn() {
}
Mr(fn, "EventTarget");
const yn = 400, vn = ">", xn = 0, wn = { "fill-opacity": 1, "stroke-opacity": 1, "stroke-width": 0, "stroke-linejoin": "miter", "stroke-linecap": "butt", fill: "#000000", stroke: "#000000", opacity: 1, x: 0, y: 0, cx: 0, cy: 0, width: 0, height: 0, r: 0, rx: 0, ry: 0, offset: 0, "stop-opacity": 1, "stop-color": "#000000", "text-anchor": "start" };
class kn extends Array {
  constructor(...e6) {
    super(...e6), this.init(...e6);
  }
  clone() {
    return new this.constructor(this);
  }
  init(e6) {
    return "number" == typeof e6 || (this.length = 0, this.push(...this.parse(e6))), this;
  }
  parse(e6 = []) {
    return e6 instanceof Array ? e6 : e6.trim().split(Xr).map(parseFloat);
  }
  toArray() {
    return Array.prototype.concat.apply([], this);
  }
  toSet() {
    return new Set(this);
  }
  toString() {
    return this.join(" ");
  }
  valueOf() {
    const e6 = [];
    return e6.push(...this), e6;
  }
}
class An {
  constructor(...e6) {
    this.init(...e6);
  }
  convert(e6) {
    return new An(this.value, e6);
  }
  divide(e6) {
    return e6 = new An(e6), new An(this / e6, this.unit || e6.unit);
  }
  init(e6, t2) {
    return t2 = Array.isArray(e6) ? e6[1] : t2, e6 = Array.isArray(e6) ? e6[0] : e6, this.value = 0, this.unit = t2 || "", "number" == typeof e6 ? this.value = isNaN(e6) ? 0 : isFinite(e6) ? e6 : e6 < 0 ? -34e37 : 34e37 : "string" == typeof e6 ? (t2 = e6.match(Or)) && (this.value = parseFloat(t2[1]), "%" === t2[5] ? this.value /= 100 : "s" === t2[5] && (this.value *= 1e3), this.unit = t2[5]) : e6 instanceof An && (this.value = e6.valueOf(), this.unit = e6.unit), this;
  }
  minus(e6) {
    return e6 = new An(e6), new An(this - e6, this.unit || e6.unit);
  }
  plus(e6) {
    return e6 = new An(e6), new An(this + e6, this.unit || e6.unit);
  }
  times(e6) {
    return e6 = new An(e6), new An(this * e6, this.unit || e6.unit);
  }
  toArray() {
    return [this.value, this.unit];
  }
  toJSON() {
    return this.toString();
  }
  toString() {
    return ("%" === this.unit ? ~~(1e8 * this.value) / 1e6 : "s" === this.unit ? this.value / 1e3 : this.value) + this.unit;
  }
  valueOf() {
    return this.value;
  }
}
const _n = [];
class Sn extends fn {
  constructor(e6, t2) {
    super(), this.node = e6, this.type = e6.nodeName, t2 && e6 !== t2 && this.attr(t2);
  }
  add(e6, t2) {
    return (e6 = qr(e6)).removeNamespace && this.node instanceof wr.window.SVGElement && e6.removeNamespace(), null == t2 ? this.node.appendChild(e6.node) : e6.node !== this.node.childNodes[t2] && this.node.insertBefore(e6.node, this.node.childNodes[t2]), this;
  }
  addTo(e6, t2) {
    return qr(e6).put(this, t2);
  }
  children() {
    return new sn(pr(this.node.children, (function(e6) {
      return zr(e6);
    })));
  }
  clear() {
    for (; this.node.hasChildNodes(); ) this.node.removeChild(this.node.lastChild);
    return this;
  }
  clone(e6 = true) {
    return this.writeDataToDom(), new this.constructor(Lr(this.node.cloneNode(e6)));
  }
  each(e6, t2) {
    const r2 = this.children();
    let n2, i2;
    for (n2 = 0, i2 = r2.length; n2 < i2; n2++) e6.apply(r2[n2], [n2, r2]), t2 && r2[n2].each(e6, t2);
    return this;
  }
  element(e6, t2) {
    return this.put(new Sn(Sr(e6), t2));
  }
  first() {
    return zr(this.node.firstChild);
  }
  get(e6) {
    return zr(this.node.childNodes[e6]);
  }
  getEventHolder() {
    return this.node;
  }
  getEventTarget() {
    return this.node;
  }
  has(e6) {
    return this.index(e6) >= 0;
  }
  html(e6, t2) {
    return this.xml(e6, t2, "http://www.w3.org/1999/xhtml");
  }
  id(e6) {
    return void 0 !== e6 || this.node.id || (this.node.id = Dr(this.type)), this.attr("id", e6);
  }
  index(e6) {
    return [].slice.call(this.node.childNodes).indexOf(e6.node);
  }
  last() {
    return zr(this.node.lastChild);
  }
  matches(e6) {
    const t2 = this.node, r2 = t2.matches || t2.matchesSelector || t2.msMatchesSelector || t2.mozMatchesSelector || t2.webkitMatchesSelector || t2.oMatchesSelector || null;
    return r2 && r2.call(t2, e6);
  }
  parent(e6) {
    let t2 = this;
    if (!t2.node.parentNode) return null;
    if (t2 = zr(t2.node.parentNode), !e6) return t2;
    do {
      if ("string" == typeof e6 ? t2.matches(e6) : t2 instanceof e6) return t2;
    } while (t2 = zr(t2.node.parentNode));
    return t2;
  }
  put(e6, t2) {
    return e6 = qr(e6), this.add(e6, t2), e6;
  }
  putIn(e6, t2) {
    return qr(e6).add(this, t2);
  }
  remove() {
    return this.parent() && this.parent().removeElement(this), this;
  }
  removeElement(e6) {
    return this.node.removeChild(e6.node), this;
  }
  replace(e6) {
    return e6 = qr(e6), this.node.parentNode && this.node.parentNode.replaceChild(e6.node, this.node), e6;
  }
  round(e6 = 2, t2 = null) {
    const r2 = 10 ** e6, n2 = this.attr(t2);
    for (const e7 in n2) "number" == typeof n2[e7] && (n2[e7] = Math.round(n2[e7] * r2) / r2);
    return this.attr(n2), this;
  }
  svg(e6, t2) {
    return this.xml(e6, t2, yr);
  }
  toString() {
    return this.id();
  }
  words(e6) {
    return this.node.textContent = e6, this;
  }
  wrap(e6) {
    const t2 = this.parent();
    if (!t2) return this.addTo(e6);
    const r2 = t2.index(this);
    return t2.put(e6, r2).put(this);
  }
  writeDataToDom() {
    return this.each((function() {
      this.writeDataToDom();
    })), this;
  }
  xml(e6, t2, r2) {
    if ("boolean" == typeof e6 && (r2 = t2, t2 = e6, e6 = null), null == e6 || "function" == typeof e6) {
      t2 = null == t2 || t2, this.writeDataToDom();
      let r3 = this;
      if (null != e6) {
        if (r3 = zr(r3.node.cloneNode(true)), t2) {
          const t3 = e6(r3);
          if (r3 = t3 || r3, false === t3) return "";
        }
        r3.each((function() {
          const t3 = e6(this), r4 = t3 || this;
          false === t3 ? this.remove() : t3 && this !== r4 && this.replace(r4);
        }), true);
      }
      return t2 ? r3.node.outerHTML : r3.node.innerHTML;
    }
    t2 = null != t2 && t2;
    const n2 = Sr("wrapper", r2), i2 = wr.document.createDocumentFragment();
    n2.innerHTML = e6;
    for (let e7 = n2.children.length; e7--; ) i2.appendChild(n2.firstElementChild);
    const o2 = this.parent();
    return t2 ? this.replace(i2) && o2 : this.add(i2);
  }
}
Br(Sn, { attr: function(e6, t2, r2) {
  if (null == e6) {
    e6 = {}, t2 = this.node.attributes;
    for (const r3 of t2) e6[r3.nodeName] = Ur.test(r3.nodeValue) ? parseFloat(r3.nodeValue) : r3.nodeValue;
    return e6;
  }
  if (e6 instanceof Array) return e6.reduce(((e7, t3) => (e7[t3] = this.attr(t3), e7)), {});
  if ("object" == typeof e6 && e6.constructor === Object) for (t2 in e6) this.attr(t2, e6[t2]);
  else if (null === t2) this.node.removeAttribute(e6);
  else {
    if (null == t2) return null == (t2 = this.node.getAttribute(e6)) ? wn[e6] : Ur.test(t2) ? parseFloat(t2) : t2;
    "number" == typeof (t2 = _n.reduce(((t3, r3) => r3(e6, t3, this)), t2)) ? t2 = new An(t2) : Kr.isColor(t2) ? t2 = new Kr(t2) : t2.constructor === Array && (t2 = new kn(t2)), "leading" === e6 ? this.leading && this.leading(t2) : "string" == typeof r2 ? this.node.setAttributeNS(r2, e6, t2.toString()) : this.node.setAttribute(e6, t2.toString()), !this.rebuild || "font-size" !== e6 && "x" !== e6 || this.rebuild();
  }
  return this;
}, find: function(e6) {
  return un(e6, this.node);
}, findOne: function(e6) {
  return zr(this.node.querySelector(e6));
} }), Mr(Sn, "Dom");
class qn extends Sn {
  constructor(e6, t2) {
    super(e6, t2), this.dom = {}, this.node.instance = this, e6.hasAttribute("svgjs:data") && this.setData(JSON.parse(e6.getAttribute("svgjs:data")) || {});
  }
  center(e6, t2) {
    return this.cx(e6).cy(t2);
  }
  cx(e6) {
    return null == e6 ? this.x() + this.width() / 2 : this.x(e6 - this.width() / 2);
  }
  cy(e6) {
    return null == e6 ? this.y() + this.height() / 2 : this.y(e6 - this.height() / 2);
  }
  defs() {
    const e6 = this.root();
    return e6 && e6.defs();
  }
  dmove(e6, t2) {
    return this.dx(e6).dy(t2);
  }
  dx(e6 = 0) {
    return this.x(new An(e6).plus(this.x()));
  }
  dy(e6 = 0) {
    return this.y(new An(e6).plus(this.y()));
  }
  getEventHolder() {
    return this;
  }
  height(e6) {
    return this.attr("height", e6);
  }
  move(e6, t2) {
    return this.x(e6).y(t2);
  }
  parents(e6 = this.root()) {
    const t2 = "string" == typeof e6;
    t2 || (e6 = qr(e6));
    const r2 = new sn();
    let n2 = this;
    for (; (n2 = n2.parent()) && n2.node !== wr.document && "#document-fragment" !== n2.nodeName && (r2.push(n2), t2 || n2.node !== e6.node) && (!t2 || !n2.matches(e6)); ) if (n2.node === this.root().node) return null;
    return r2;
  }
  reference(e6) {
    if (!(e6 = this.attr(e6))) return null;
    const t2 = (e6 + "").match(Hr);
    return t2 ? qr(t2[1]) : null;
  }
  root() {
    const e6 = this.parent(Ar[_r]);
    return e6 && e6.root();
  }
  setData(e6) {
    return this.dom = e6, this;
  }
  size(e6, t2) {
    const r2 = fr(this, e6, t2);
    return this.width(new An(r2.width)).height(new An(r2.height));
  }
  width(e6) {
    return this.attr("width", e6);
  }
  writeDataToDom() {
    return this.node.removeAttribute("svgjs:data"), Object.keys(this.dom).length && this.node.setAttribute("svgjs:data", JSON.stringify(this.dom)), super.writeDataToDom();
  }
  x(e6) {
    return this.attr("x", e6);
  }
  y(e6) {
    return this.attr("y", e6);
  }
}
Br(qn, { bbox: function() {
  const e6 = an(this, ((e7) => e7.getBBox()), ((e7) => {
    try {
      const t2 = e7.clone().addTo(rn().svg).show(), r2 = t2.node.getBBox();
      return t2.remove(), r2;
    } catch (t2) {
      throw new Error(`Getting bbox of element "${e7.node.nodeName}" is not possible: ${t2.toString()}`);
    }
  }));
  return new on(e6);
}, rbox: function(e6) {
  const t2 = an(this, ((e7) => e7.getBoundingClientRect()), ((e7) => {
    throw new Error(`Getting rbox of element "${e7.node.nodeName}" is not possible`);
  })), r2 = new on(t2);
  return e6 ? r2.transform(e6.screenCTM().inverseO()) : r2.addOffset();
}, inside: function(e6, t2) {
  const r2 = this.bbox();
  return e6 > r2.x && t2 > r2.y && e6 < r2.x + r2.width && t2 < r2.y + r2.height;
}, point: function(e6, t2) {
  return new Qr(e6, t2).transform(this.screenCTM().inverse());
}, ctm: function() {
  return new tn(this.node.getCTM());
}, screenCTM: function() {
  if ("function" == typeof this.isRoot && !this.isRoot()) {
    const e6 = this.rect(1, 1), t2 = e6.node.getScreenCTM();
    return e6.remove(), new tn(t2);
  }
  return new tn(this.node.getScreenCTM());
} }), Mr(qn, "Element");
const Cn = { stroke: ["color", "width", "opacity", "linecap", "linejoin", "miterlimit", "dasharray", "dashoffset"], fill: ["color", "opacity", "rule"], prefix: function(e6, t2) {
  return "color" === t2 ? e6 : e6 + "-" + t2;
} };
["fill", "stroke"].forEach((function(e6) {
  const t2 = {};
  let r2;
  t2[e6] = function(t3) {
    if (void 0 === t3) return this.attr(e6);
    if ("string" == typeof t3 || t3 instanceof Kr || Kr.isRgb(t3) || t3 instanceof qn) this.attr(e6, t3);
    else for (r2 = Cn[e6].length - 1; r2 >= 0; r2--) null != t3[Cn[e6][r2]] && this.attr(Cn.prefix(e6, Cn[e6][r2]), t3[Cn[e6][r2]]);
    return this;
  }, ur(["Element", "Runner"], t2);
})), ur(["Element", "Runner"], { matrix: function(e6, t2, r2, n2, i2, o2) {
  return null == e6 ? new tn(this) : this.attr("transform", new tn(e6, t2, r2, n2, i2, o2));
}, rotate: function(e6, t2, r2) {
  return this.transform({ rotate: e6, ox: t2, oy: r2 }, true);
}, skew: function(e6, t2, r2, n2) {
  return 1 === arguments.length || 3 === arguments.length ? this.transform({ skew: e6, ox: t2, oy: r2 }, true) : this.transform({ skew: [e6, t2], ox: r2, oy: n2 }, true);
}, shear: function(e6, t2, r2) {
  return this.transform({ shear: e6, ox: t2, oy: r2 }, true);
}, scale: function(e6, t2, r2, n2) {
  return 1 === arguments.length || 3 === arguments.length ? this.transform({ scale: e6, ox: t2, oy: r2 }, true) : this.transform({ scale: [e6, t2], ox: r2, oy: n2 }, true);
}, translate: function(e6, t2) {
  return this.transform({ translate: [e6, t2] }, true);
}, relative: function(e6, t2) {
  return this.transform({ relative: [e6, t2] }, true);
}, flip: function(e6 = "both", t2 = "center") {
  return -1 === "xybothtrue".indexOf(e6) && (t2 = e6, e6 = "both"), this.transform({ flip: e6, origin: t2 }, true);
}, opacity: function(e6) {
  return this.attr("opacity", e6);
} }), ur("radius", { radius: function(e6, t2 = e6) {
  return "radialGradient" === (this._element || this).type ? this.attr("r", new An(e6)) : this.rx(e6).ry(t2);
} }), ur("Path", { length: function() {
  return this.node.getTotalLength();
}, pointAt: function(e6) {
  return new Qr(this.node.getPointAtLength(e6));
} }), ur(["Element", "Runner"], { font: function(e6, t2) {
  if ("object" == typeof e6) {
    for (t2 in e6) this.font(t2, e6[t2]);
    return this;
  }
  return "leading" === e6 ? this.leading(t2) : "anchor" === e6 ? this.attr("text-anchor", t2) : "size" === e6 || "family" === e6 || "weight" === e6 || "stretch" === e6 || "variant" === e6 || "style" === e6 ? this.attr("font-" + e6, t2) : this.attr(e6, t2);
} });
ur("Element", ["click", "dblclick", "mousedown", "mouseup", "mouseover", "mouseout", "mousemove", "mouseenter", "mouseleave", "touchstart", "touchmove", "touchleave", "touchend", "touchcancel"].reduce((function(e6, t2) {
  return e6[t2] = function(e7) {
    return null === e7 ? this.off(t2) : this.on(t2, e7), this;
  }, e6;
}), {})), ur("Element", { untransform: function() {
  return this.attr("transform", null);
}, matrixify: function() {
  const e6 = (this.attr("transform") || "").split(Vr).slice(0, -1).map((function(e7) {
    const t2 = e7.trim().split("(");
    return [t2[0], t2[1].split(Xr).map((function(e8) {
      return parseFloat(e8);
    }))];
  })).reverse().reduce((function(e7, t2) {
    return "matrix" === t2[0] ? e7.lmultiply(tn.fromArray(t2[1])) : e7[t2[0]].apply(e7, t2[1]);
  }), new tn());
  return e6;
}, toParent: function(e6, t2) {
  if (this === e6) return this;
  const r2 = this.screenCTM(), n2 = e6.screenCTM().inverse();
  return this.addTo(e6, t2).untransform().transform(n2.multiply(r2)), this;
}, toRoot: function(e6) {
  return this.toParent(this.root(), e6);
}, transform: function(e6, t2) {
  if (null == e6 || "string" == typeof e6) {
    const t3 = new tn(this).decompose();
    return null == e6 ? t3 : t3[e6];
  }
  tn.isMatrixLike(e6) || (e6 = { ...e6, origin: br(e6, this) });
  const r2 = new tn(true === t2 ? this : t2 || false).transform(e6);
  return this.attr("transform", r2);
} });
class zn extends qn {
  flatten(e6 = this, t2) {
    return this.each((function() {
      if (this instanceof zn) return this.flatten().ungroup();
    })), this;
  }
  ungroup(e6 = this.parent(), t2 = e6.index(this)) {
    return t2 = -1 === t2 ? e6.children().length : t2, this.each((function(r2, n2) {
      return n2[n2.length - r2 - 1].toParent(e6, t2);
    })), this.remove();
  }
}
Mr(zn, "Container");
class Tn extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("defs", e6), t2);
  }
  flatten() {
    return this;
  }
  ungroup() {
    return this;
  }
}
Mr(Tn, "Defs");
class Mn extends qn {
}
function En(e6) {
  return this.attr("rx", e6);
}
function Dn(e6) {
  return this.attr("ry", e6);
}
function Ln(e6) {
  return null == e6 ? this.cx() - this.rx() : this.cx(e6 + this.rx());
}
function Bn(e6) {
  return null == e6 ? this.cy() - this.ry() : this.cy(e6 + this.ry());
}
function Nn(e6) {
  return this.attr("cx", e6);
}
function On(e6) {
  return this.attr("cy", e6);
}
function Fn(e6) {
  return null == e6 ? 2 * this.rx() : this.rx(new An(e6).divide(2));
}
function Rn(e6) {
  return null == e6 ? 2 * this.ry() : this.ry(new An(e6).divide(2));
}
Mr(Mn, "Shape");
var Hn = Object.freeze({ __proto__: null, cx: Nn, cy: On, height: Rn, rx: En, ry: Dn, width: Fn, x: Ln, y: Bn });
class Vn extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("ellipse", e6), t2);
  }
  size(e6, t2) {
    const r2 = fr(this, e6, t2);
    return this.rx(new An(r2.width).divide(2)).ry(new An(r2.height).divide(2));
  }
}
Br(Vn, Hn), ur("Container", { ellipse: Nr((function(e6 = 0, t2 = e6) {
  return this.put(new Vn()).size(e6, t2).move(0, 0);
})) }), Mr(Vn, "Ellipse");
class In extends Sn {
  constructor(e6 = wr.document.createDocumentFragment()) {
    super(e6);
  }
  xml(e6, t2, r2) {
    if ("boolean" == typeof e6 && (r2 = t2, t2 = e6, e6 = null), null == e6 || "function" == typeof e6) {
      const e7 = new Sn(Sr("wrapper", r2));
      return e7.add(this.node.cloneNode(true)), e7.xml(false, r2);
    }
    return super.xml(e6, false, r2);
  }
}
function Pn(e6, t2) {
  return "radialGradient" === (this._element || this).type ? this.attr({ fx: new An(e6), fy: new An(t2) }) : this.attr({ x1: new An(e6), y1: new An(t2) });
}
function jn(e6, t2) {
  return "radialGradient" === (this._element || this).type ? this.attr({ cx: new An(e6), cy: new An(t2) }) : this.attr({ x2: new An(e6), y2: new An(t2) });
}
Mr(In, "Fragment");
var Gn, Un = Object.freeze({ __proto__: null, from: Pn, to: jn });
class Yn extends zn {
  constructor(e6, t2) {
    super(Cr(e6 + "Gradient", "string" == typeof e6 ? null : e6), t2);
  }
  attr(e6, t2, r2) {
    return "transform" === e6 && (e6 = "gradientTransform"), super.attr(e6, t2, r2);
  }
  bbox() {
    return new on();
  }
  targets() {
    return un('svg [fill*="' + this.id() + '"]');
  }
  toString() {
    return this.url();
  }
  update(e6) {
    return this.clear(), "function" == typeof e6 && e6.call(this, this), this;
  }
  url() {
    return 'url("#' + this.id() + '")';
  }
}
Br(Yn, Un), ur({ Container: { gradient(...e6) {
  return this.defs().gradient(...e6);
} }, Defs: { gradient: Nr((function(e6, t2) {
  return this.put(new Yn(e6)).update(t2);
})) } }), Mr(Yn, "Gradient");
class Xn extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("pattern", e6), t2);
  }
  attr(e6, t2, r2) {
    return "transform" === e6 && (e6 = "patternTransform"), super.attr(e6, t2, r2);
  }
  bbox() {
    return new on();
  }
  targets() {
    return un('svg [fill*="' + this.id() + '"]');
  }
  toString() {
    return this.url();
  }
  update(e6) {
    return this.clear(), "function" == typeof e6 && e6.call(this, this), this;
  }
  url() {
    return 'url("#' + this.id() + '")';
  }
}
ur({ Container: { pattern(...e6) {
  return this.defs().pattern(...e6);
} }, Defs: { pattern: Nr((function(e6, t2, r2) {
  return this.put(new Xn()).update(r2).attr({ x: 0, y: 0, width: e6, height: t2, patternUnits: "userSpaceOnUse" });
})) } }), Mr(Xn, "Pattern");
class Wn extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("image", e6), t2);
  }
  load(e6, t2) {
    if (!e6) return this;
    const r2 = new wr.window.Image();
    return mn(r2, "load", (function(e7) {
      const n2 = this.parent(Xn);
      0 === this.width() && 0 === this.height() && this.size(r2.width, r2.height), n2 instanceof Xn && 0 === n2.width() && 0 === n2.height() && n2.size(this.width(), this.height()), "function" == typeof t2 && t2.call(this, e7);
    }), this), mn(r2, "load error", (function() {
      gn(r2);
    })), this.attr("href", r2.src = e6, xr);
  }
}
Gn = function(e6, t2, r2) {
  return "fill" !== e6 && "stroke" !== e6 || Yr.test(t2) && (t2 = r2.root().defs().image(t2)), t2 instanceof Wn && (t2 = r2.root().defs().pattern(0, 0, ((e7) => {
    e7.add(t2);
  }))), t2;
}, _n.push(Gn), ur({ Container: { image: Nr((function(e6, t2) {
  return this.put(new Wn()).size(0, 0).load(e6, t2);
})) } }), Mr(Wn, "Image");
class $n extends kn {
  bbox() {
    let e6 = -1 / 0, t2 = -1 / 0, r2 = 1 / 0, n2 = 1 / 0;
    return this.forEach((function(i2) {
      e6 = Math.max(i2[0], e6), t2 = Math.max(i2[1], t2), r2 = Math.min(i2[0], r2), n2 = Math.min(i2[1], n2);
    })), new on(r2, n2, e6 - r2, t2 - n2);
  }
  move(e6, t2) {
    const r2 = this.bbox();
    if (e6 -= r2.x, t2 -= r2.y, !isNaN(e6) && !isNaN(t2)) for (let r3 = this.length - 1; r3 >= 0; r3--) this[r3] = [this[r3][0] + e6, this[r3][1] + t2];
    return this;
  }
  parse(e6 = [0, 0]) {
    const t2 = [];
    (e6 = e6 instanceof Array ? Array.prototype.concat.apply([], e6) : e6.trim().split(Xr).map(parseFloat)).length % 2 != 0 && e6.pop();
    for (let r2 = 0, n2 = e6.length; r2 < n2; r2 += 2) t2.push([e6[r2], e6[r2 + 1]]);
    return t2;
  }
  size(e6, t2) {
    let r2;
    const n2 = this.bbox();
    for (r2 = this.length - 1; r2 >= 0; r2--) n2.width && (this[r2][0] = (this[r2][0] - n2.x) * e6 / n2.width + n2.x), n2.height && (this[r2][1] = (this[r2][1] - n2.y) * t2 / n2.height + n2.y);
    return this;
  }
  toLine() {
    return { x1: this[0][0], y1: this[0][1], x2: this[1][0], y2: this[1][1] };
  }
  toString() {
    const e6 = [];
    for (let t2 = 0, r2 = this.length; t2 < r2; t2++) e6.push(this[t2].join(","));
    return e6.join(" ");
  }
  transform(e6) {
    return this.clone().transformO(e6);
  }
  transformO(e6) {
    tn.isMatrixLike(e6) || (e6 = new tn(e6));
    for (let t2 = this.length; t2--; ) {
      const [r2, n2] = this[t2];
      this[t2][0] = e6.a * r2 + e6.c * n2 + e6.e, this[t2][1] = e6.b * r2 + e6.d * n2 + e6.f;
    }
    return this;
  }
}
const Zn = $n;
var Jn = Object.freeze({ __proto__: null, MorphArray: Zn, height: function(e6) {
  const t2 = this.bbox();
  return null == e6 ? t2.height : this.size(t2.width, e6);
}, width: function(e6) {
  const t2 = this.bbox();
  return null == e6 ? t2.width : this.size(e6, t2.height);
}, x: function(e6) {
  return null == e6 ? this.bbox().x : this.move(e6, this.bbox().y);
}, y: function(e6) {
  return null == e6 ? this.bbox().y : this.move(this.bbox().x, e6);
} });
class Kn extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("line", e6), t2);
  }
  array() {
    return new $n([[this.attr("x1"), this.attr("y1")], [this.attr("x2"), this.attr("y2")]]);
  }
  move(e6, t2) {
    return this.attr(this.array().move(e6, t2).toLine());
  }
  plot(e6, t2, r2, n2) {
    return null == e6 ? this.array() : (e6 = void 0 !== t2 ? { x1: e6, y1: t2, x2: r2, y2: n2 } : new $n(e6).toLine(), this.attr(e6));
  }
  size(e6, t2) {
    const r2 = fr(this, e6, t2);
    return this.attr(this.array().size(r2.width, r2.height).toLine());
  }
}
Br(Kn, Jn), ur({ Container: { line: Nr((function(...e6) {
  return Kn.prototype.plot.apply(this.put(new Kn()), null != e6[0] ? e6 : [0, 0, 0, 0]);
})) } }), Mr(Kn, "Line");
class Qn extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("marker", e6), t2);
  }
  height(e6) {
    return this.attr("markerHeight", e6);
  }
  orient(e6) {
    return this.attr("orient", e6);
  }
  ref(e6, t2) {
    return this.attr("refX", e6).attr("refY", t2);
  }
  toString() {
    return "url(#" + this.id() + ")";
  }
  update(e6) {
    return this.clear(), "function" == typeof e6 && e6.call(this, this), this;
  }
  width(e6) {
    return this.attr("markerWidth", e6);
  }
}
function ei(e6, t2) {
  return function(r2) {
    return null == r2 ? this[e6] : (this[e6] = r2, t2 && t2.call(this), this);
  };
}
ur({ Container: { marker(...e6) {
  return this.defs().marker(...e6);
} }, Defs: { marker: Nr((function(e6, t2, r2) {
  return this.put(new Qn()).size(e6, t2).ref(e6 / 2, t2 / 2).viewbox(0, 0, e6, t2).attr("orient", "auto").update(r2);
})) }, marker: { marker(e6, t2, r2, n2) {
  let i2 = ["marker"];
  return "all" !== e6 && i2.push(e6), i2 = i2.join("-"), e6 = arguments[1] instanceof Qn ? arguments[1] : this.defs().marker(t2, r2, n2), this.attr(i2, e6);
} } }), Mr(Qn, "Marker");
const ti = { "-": function(e6) {
  return e6;
}, "<>": function(e6) {
  return -Math.cos(e6 * Math.PI) / 2 + 0.5;
}, ">": function(e6) {
  return Math.sin(e6 * Math.PI / 2);
}, "<": function(e6) {
  return 1 - Math.cos(e6 * Math.PI / 2);
}, bezier: function(e6, t2, r2, n2) {
  return function(i2) {
    return i2 < 0 ? e6 > 0 ? t2 / e6 * i2 : r2 > 0 ? n2 / r2 * i2 : 0 : i2 > 1 ? r2 < 1 ? (1 - n2) / (1 - r2) * i2 + (n2 - r2) / (1 - r2) : e6 < 1 ? (1 - t2) / (1 - e6) * i2 + (t2 - e6) / (1 - e6) : 1 : 3 * i2 * (1 - i2) ** 2 * t2 + 3 * i2 ** 2 * (1 - i2) * n2 + i2 ** 3;
  };
}, steps: function(e6, t2 = "end") {
  t2 = t2.split("-").reverse()[0];
  let r2 = e6;
  return "none" === t2 ? --r2 : "both" === t2 && ++r2, (n2, i2 = false) => {
    let o2 = Math.floor(n2 * e6);
    const a2 = n2 * o2 % 1 == 0;
    return "start" !== t2 && "both" !== t2 || ++o2, i2 && a2 && --o2, n2 >= 0 && o2 < 0 && (o2 = 0), n2 <= 1 && o2 > r2 && (o2 = r2), o2 / r2;
  };
} };
class ri {
  done() {
    return false;
  }
}
class ni extends ri {
  constructor(e6 = vn) {
    super(), this.ease = ti[e6] || e6;
  }
  step(e6, t2, r2) {
    return "number" != typeof e6 ? r2 < 1 ? e6 : t2 : e6 + (t2 - e6) * this.ease(r2);
  }
}
class ii extends ri {
  constructor(e6) {
    super(), this.stepper = e6;
  }
  done(e6) {
    return e6.done;
  }
  step(e6, t2, r2, n2) {
    return this.stepper(e6, t2, r2, n2);
  }
}
function oi() {
  const e6 = (this._duration || 500) / 1e3, t2 = this._overshoot || 0, r2 = Math.PI, n2 = Math.log(t2 / 100 + 1e-10), i2 = -n2 / Math.sqrt(r2 * r2 + n2 * n2), o2 = 3.9 / (i2 * e6);
  this.d = 2 * i2 * o2, this.k = o2 * o2;
}
Br(class extends ii {
  constructor(e6 = 500, t2 = 0) {
    super(), this.duration(e6).overshoot(t2);
  }
  step(e6, t2, r2, n2) {
    if ("string" == typeof e6) return e6;
    if (n2.done = r2 === 1 / 0, r2 === 1 / 0) return t2;
    if (0 === r2) return e6;
    r2 > 100 && (r2 = 16), r2 /= 1e3;
    const i2 = n2.velocity || 0, o2 = -this.d * i2 - this.k * (e6 - t2), a2 = e6 + i2 * r2 + o2 * r2 * r2 / 2;
    return n2.velocity = i2 + o2 * r2, n2.done = Math.abs(t2 - a2) + Math.abs(i2) < 2e-3, n2.done ? t2 : a2;
  }
}, { duration: ei("_duration", oi), overshoot: ei("_overshoot", oi) });
Br(class extends ii {
  constructor(e6 = 0.1, t2 = 0.01, r2 = 0, n2 = 1e3) {
    super(), this.p(e6).i(t2).d(r2).windup(n2);
  }
  step(e6, t2, r2, n2) {
    if ("string" == typeof e6) return e6;
    if (n2.done = r2 === 1 / 0, r2 === 1 / 0) return t2;
    if (0 === r2) return e6;
    const i2 = t2 - e6;
    let o2 = (n2.integral || 0) + i2 * r2;
    const a2 = (i2 - (n2.error || 0)) / r2, s2 = this._windup;
    return false !== s2 && (o2 = Math.max(-s2, Math.min(o2, s2))), n2.error = i2, n2.integral = o2, n2.done = Math.abs(i2) < 1e-3, n2.done ? t2 : e6 + (this.P * i2 + this.I * o2 + this.D * a2);
  }
}, { windup: ei("_windup"), p: ei("P"), i: ei("I"), d: ei("D") });
const ai = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 }, si = { M: function(e6, t2, r2) {
  return t2.x = r2.x = e6[0], t2.y = r2.y = e6[1], ["M", t2.x, t2.y];
}, L: function(e6, t2) {
  return t2.x = e6[0], t2.y = e6[1], ["L", e6[0], e6[1]];
}, H: function(e6, t2) {
  return t2.x = e6[0], ["H", e6[0]];
}, V: function(e6, t2) {
  return t2.y = e6[0], ["V", e6[0]];
}, C: function(e6, t2) {
  return t2.x = e6[4], t2.y = e6[5], ["C", e6[0], e6[1], e6[2], e6[3], e6[4], e6[5]];
}, S: function(e6, t2) {
  return t2.x = e6[2], t2.y = e6[3], ["S", e6[0], e6[1], e6[2], e6[3]];
}, Q: function(e6, t2) {
  return t2.x = e6[2], t2.y = e6[3], ["Q", e6[0], e6[1], e6[2], e6[3]];
}, T: function(e6, t2) {
  return t2.x = e6[0], t2.y = e6[1], ["T", e6[0], e6[1]];
}, Z: function(e6, t2, r2) {
  return t2.x = r2.x, t2.y = r2.y, ["Z"];
}, A: function(e6, t2) {
  return t2.x = e6[5], t2.y = e6[6], ["A", e6[0], e6[1], e6[2], e6[3], e6[4], e6[5], e6[6]];
} }, li = "mlhvqtcsaz".split("");
for (let e6 = 0, t2 = li.length; e6 < t2; ++e6) si[li[e6]] = /* @__PURE__ */ (function(e7) {
  return function(t3, r2, n2) {
    if ("H" === e7) t3[0] = t3[0] + r2.x;
    else if ("V" === e7) t3[0] = t3[0] + r2.y;
    else if ("A" === e7) t3[5] = t3[5] + r2.x, t3[6] = t3[6] + r2.y;
    else for (let e8 = 0, n3 = t3.length; e8 < n3; ++e8) t3[e8] = t3[e8] + (e8 % 2 ? r2.y : r2.x);
    return si[e7](t3, r2, n2);
  };
})(li[e6].toUpperCase());
function ui(e6) {
  return e6.segment.length && e6.segment.length - 1 === ai[e6.segment[0].toUpperCase()];
}
function ci(e6, t2) {
  e6.inNumber && hi(e6, false);
  const r2 = Wr.test(t2);
  if (r2) e6.segment = [t2];
  else {
    const t3 = e6.lastCommand, r3 = t3.toLowerCase(), n2 = t3 === r3;
    e6.segment = ["m" === r3 ? n2 ? "l" : "L" : t3];
  }
  return e6.inSegment = true, e6.lastCommand = e6.segment[0], r2;
}
function hi(e6, t2) {
  if (!e6.inNumber) throw new Error("Parser Error");
  e6.number && e6.segment.push(parseFloat(e6.number)), e6.inNumber = t2, e6.number = "", e6.pointSeen = false, e6.hasExponent = false, ui(e6) && pi(e6);
}
function pi(e6) {
  e6.inSegment = false, e6.absolute && (e6.segment = (function(e7) {
    const t2 = e7.segment[0];
    return si[t2](e7.segment.slice(1), e7.p, e7.p0);
  })(e6)), e6.segments.push(e6.segment);
}
function di(e6) {
  if (!e6.segment.length) return false;
  const t2 = "A" === e6.segment[0].toUpperCase(), r2 = e6.segment.length;
  return t2 && (4 === r2 || 5 === r2);
}
function mi(e6) {
  return "E" === e6.lastToken.toUpperCase();
}
class gi extends kn {
  bbox() {
    return rn().path.setAttribute("d", this.toString()), new on(rn.nodes.path.getBBox());
  }
  move(e6, t2) {
    const r2 = this.bbox();
    if (e6 -= r2.x, t2 -= r2.y, !isNaN(e6) && !isNaN(t2)) for (let r3, n2 = this.length - 1; n2 >= 0; n2--) r3 = this[n2][0], "M" === r3 || "L" === r3 || "T" === r3 ? (this[n2][1] += e6, this[n2][2] += t2) : "H" === r3 ? this[n2][1] += e6 : "V" === r3 ? this[n2][1] += t2 : "C" === r3 || "S" === r3 || "Q" === r3 ? (this[n2][1] += e6, this[n2][2] += t2, this[n2][3] += e6, this[n2][4] += t2, "C" === r3 && (this[n2][5] += e6, this[n2][6] += t2)) : "A" === r3 && (this[n2][6] += e6, this[n2][7] += t2);
    return this;
  }
  parse(e6 = "M0 0") {
    return Array.isArray(e6) && (e6 = Array.prototype.concat.apply([], e6).toString()), (function(e7, t2 = true) {
      let r2 = 0, n2 = "";
      const i2 = { segment: [], inNumber: false, number: "", lastToken: "", inSegment: false, segments: [], pointSeen: false, hasExponent: false, absolute: t2, p0: new Qr(), p: new Qr() };
      for (; i2.lastToken = n2, n2 = e7.charAt(r2++); ) if (i2.inSegment || !ci(i2, n2)) if ("." !== n2) if (isNaN(parseInt(n2))) if (" " !== n2 && "," !== n2) if ("-" !== n2) if ("E" !== n2.toUpperCase()) {
        if (Wr.test(n2)) {
          if (i2.inNumber) hi(i2, false);
          else {
            if (!ui(i2)) throw new Error("parser Error");
            pi(i2);
          }
          --r2;
        }
      } else i2.number += n2, i2.hasExponent = true;
      else {
        if (i2.inNumber && !mi(i2)) {
          hi(i2, false), --r2;
          continue;
        }
        i2.number += n2, i2.inNumber = true;
      }
      else i2.inNumber && hi(i2, false);
      else {
        if ("0" === i2.number || di(i2)) {
          i2.inNumber = true, i2.number = n2, hi(i2, true);
          continue;
        }
        i2.inNumber = true, i2.number += n2;
      }
      else {
        if (i2.pointSeen || i2.hasExponent) {
          hi(i2, false), --r2;
          continue;
        }
        i2.inNumber = true, i2.pointSeen = true, i2.number += n2;
      }
      return i2.inNumber && hi(i2, false), i2.inSegment && ui(i2) && pi(i2), i2.segments;
    })(e6);
  }
  size(e6, t2) {
    const r2 = this.bbox();
    let n2, i2;
    for (r2.width = 0 === r2.width ? 1 : r2.width, r2.height = 0 === r2.height ? 1 : r2.height, n2 = this.length - 1; n2 >= 0; n2--) i2 = this[n2][0], "M" === i2 || "L" === i2 || "T" === i2 ? (this[n2][1] = (this[n2][1] - r2.x) * e6 / r2.width + r2.x, this[n2][2] = (this[n2][2] - r2.y) * t2 / r2.height + r2.y) : "H" === i2 ? this[n2][1] = (this[n2][1] - r2.x) * e6 / r2.width + r2.x : "V" === i2 ? this[n2][1] = (this[n2][1] - r2.y) * t2 / r2.height + r2.y : "C" === i2 || "S" === i2 || "Q" === i2 ? (this[n2][1] = (this[n2][1] - r2.x) * e6 / r2.width + r2.x, this[n2][2] = (this[n2][2] - r2.y) * t2 / r2.height + r2.y, this[n2][3] = (this[n2][3] - r2.x) * e6 / r2.width + r2.x, this[n2][4] = (this[n2][4] - r2.y) * t2 / r2.height + r2.y, "C" === i2 && (this[n2][5] = (this[n2][5] - r2.x) * e6 / r2.width + r2.x, this[n2][6] = (this[n2][6] - r2.y) * t2 / r2.height + r2.y)) : "A" === i2 && (this[n2][1] = this[n2][1] * e6 / r2.width, this[n2][2] = this[n2][2] * t2 / r2.height, this[n2][6] = (this[n2][6] - r2.x) * e6 / r2.width + r2.x, this[n2][7] = (this[n2][7] - r2.y) * t2 / r2.height + r2.y);
    return this;
  }
  toString() {
    return (function(e6) {
      let t2 = "";
      for (let r2 = 0, n2 = e6.length; r2 < n2; r2++) t2 += e6[r2][0], null != e6[r2][1] && (t2 += e6[r2][1], null != e6[r2][2] && (t2 += " ", t2 += e6[r2][2], null != e6[r2][3] && (t2 += " ", t2 += e6[r2][3], t2 += " ", t2 += e6[r2][4], null != e6[r2][5] && (t2 += " ", t2 += e6[r2][5], t2 += " ", t2 += e6[r2][6], null != e6[r2][7] && (t2 += " ", t2 += e6[r2][7])))));
      return t2 + " ";
    })(this);
  }
}
const fi = (e6) => {
  const t2 = typeof e6;
  return "number" === t2 ? An : "string" === t2 ? Kr.isColor(e6) ? Kr : Xr.test(e6) ? Wr.test(e6) ? gi : kn : Or.test(e6) ? An : yi : ki.indexOf(e6.constructor) > -1 ? e6.constructor : Array.isArray(e6) ? kn : "object" === t2 ? wi : yi;
};
class bi {
  constructor(e6) {
    this._stepper = e6 || new ni("-"), this._from = null, this._to = null, this._type = null, this._context = null, this._morphObj = null;
  }
  at(e6) {
    return this._morphObj.morph(this._from, this._to, e6, this._stepper, this._context);
  }
  done() {
    return this._context.map(this._stepper.done).reduce((function(e6, t2) {
      return e6 && t2;
    }), true);
  }
  from(e6) {
    return null == e6 ? this._from : (this._from = this._set(e6), this);
  }
  stepper(e6) {
    return null == e6 ? this._stepper : (this._stepper = e6, this);
  }
  to(e6) {
    return null == e6 ? this._to : (this._to = this._set(e6), this);
  }
  type(e6) {
    return null == e6 ? this._type : (this._type = e6, this);
  }
  _set(e6) {
    this._type || this.type(fi(e6));
    let t2 = new this._type(e6);
    return this._type === Kr && (t2 = this._to ? t2[this._to[4]]() : this._from ? t2[this._from[4]]() : t2), this._type === wi && (t2 = this._to ? t2.align(this._to) : this._from ? t2.align(this._from) : t2), t2 = t2.toConsumable(), this._morphObj = this._morphObj || new this._type(), this._context = this._context || Array.apply(null, Array(t2.length)).map(Object).map((function(e7) {
      return e7.done = true, e7;
    })), t2;
  }
}
class yi {
  constructor(...e6) {
    this.init(...e6);
  }
  init(e6) {
    return e6 = Array.isArray(e6) ? e6[0] : e6, this.value = e6, this;
  }
  toArray() {
    return [this.value];
  }
  valueOf() {
    return this.value;
  }
}
class vi {
  constructor(...e6) {
    this.init(...e6);
  }
  init(e6) {
    return Array.isArray(e6) && (e6 = { scaleX: e6[0], scaleY: e6[1], shear: e6[2], rotate: e6[3], translateX: e6[4], translateY: e6[5], originX: e6[6], originY: e6[7] }), Object.assign(this, vi.defaults, e6), this;
  }
  toArray() {
    const e6 = this;
    return [e6.scaleX, e6.scaleY, e6.shear, e6.rotate, e6.translateX, e6.translateY, e6.originX, e6.originY];
  }
}
vi.defaults = { scaleX: 1, scaleY: 1, shear: 0, rotate: 0, translateX: 0, translateY: 0, originX: 0, originY: 0 };
const xi = (e6, t2) => e6[0] < t2[0] ? -1 : e6[0] > t2[0] ? 1 : 0;
class wi {
  constructor(...e6) {
    this.init(...e6);
  }
  align(e6) {
    const t2 = this.values;
    for (let r2 = 0, n2 = t2.length; r2 < n2; ++r2) {
      if (t2[r2 + 1] === e6[r2 + 1]) {
        if (t2[r2 + 1] === Kr && e6[r2 + 7] !== t2[r2 + 7]) {
          const t3 = e6[r2 + 7], n4 = new Kr(this.values.splice(r2 + 3, 5))[t3]().toArray();
          this.values.splice(r2 + 3, 0, ...n4);
        }
        r2 += t2[r2 + 2] + 2;
        continue;
      }
      if (!e6[r2 + 1]) return this;
      const n3 = new e6[r2 + 1]().toArray(), i2 = t2[r2 + 2] + 3;
      t2.splice(r2, i2, e6[r2], e6[r2 + 1], e6[r2 + 2], ...n3), r2 += t2[r2 + 2] + 2;
    }
    return this;
  }
  init(e6) {
    if (this.values = [], Array.isArray(e6)) return void (this.values = e6.slice());
    e6 = e6 || {};
    const t2 = [];
    for (const r2 in e6) {
      const n2 = fi(e6[r2]), i2 = new n2(e6[r2]).toArray();
      t2.push([r2, n2, i2.length, ...i2]);
    }
    return t2.sort(xi), this.values = t2.reduce(((e7, t3) => e7.concat(t3)), []), this;
  }
  toArray() {
    return this.values;
  }
  valueOf() {
    const e6 = {}, t2 = this.values;
    for (; t2.length; ) {
      const r2 = t2.shift(), n2 = t2.shift(), i2 = t2.shift(), o2 = t2.splice(0, i2);
      e6[r2] = new n2(o2);
    }
    return e6;
  }
}
const ki = [yi, vi, wi];
class Ai extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("path", e6), t2);
  }
  array() {
    return this._array || (this._array = new gi(this.attr("d")));
  }
  clear() {
    return delete this._array, this;
  }
  height(e6) {
    return null == e6 ? this.bbox().height : this.size(this.bbox().width, e6);
  }
  move(e6, t2) {
    return this.attr("d", this.array().move(e6, t2));
  }
  plot(e6) {
    return null == e6 ? this.array() : this.clear().attr("d", "string" == typeof e6 ? e6 : this._array = new gi(e6));
  }
  size(e6, t2) {
    const r2 = fr(this, e6, t2);
    return this.attr("d", this.array().size(r2.width, r2.height));
  }
  width(e6) {
    return null == e6 ? this.bbox().width : this.size(e6, this.bbox().height);
  }
  x(e6) {
    return null == e6 ? this.bbox().x : this.move(e6, this.bbox().y);
  }
  y(e6) {
    return null == e6 ? this.bbox().y : this.move(this.bbox().x, e6);
  }
}
Ai.prototype.MorphArray = gi, ur({ Container: { path: Nr((function(e6) {
  return this.put(new Ai()).plot(e6 || new gi());
})) } }), Mr(Ai, "Path");
var _i = Object.freeze({ __proto__: null, array: function() {
  return this._array || (this._array = new $n(this.attr("points")));
}, clear: function() {
  return delete this._array, this;
}, move: function(e6, t2) {
  return this.attr("points", this.array().move(e6, t2));
}, plot: function(e6) {
  return null == e6 ? this.array() : this.clear().attr("points", "string" == typeof e6 ? e6 : this._array = new $n(e6));
}, size: function(e6, t2) {
  const r2 = fr(this, e6, t2);
  return this.attr("points", this.array().size(r2.width, r2.height));
} });
class Si extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("polygon", e6), t2);
  }
}
ur({ Container: { polygon: Nr((function(e6) {
  return this.put(new Si()).plot(e6 || new $n());
})) } }), Br(Si, Jn), Br(Si, _i), Mr(Si, "Polygon");
class qi extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("polyline", e6), t2);
  }
}
ur({ Container: { polyline: Nr((function(e6) {
  return this.put(new qi()).plot(e6 || new $n());
})) } }), Br(qi, Jn), Br(qi, _i), Mr(qi, "Polyline");
class Ci extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("rect", e6), t2);
  }
}
Br(Ci, { rx: En, ry: Dn }), ur({ Container: { rect: Nr((function(e6, t2) {
  return this.put(new Ci()).size(e6, t2);
})) } }), Mr(Ci, "Rect");
class zi {
  constructor() {
    this._first = null, this._last = null;
  }
  first() {
    return this._first && this._first.value;
  }
  last() {
    return this._last && this._last.value;
  }
  push(e6) {
    const t2 = void 0 !== e6.next ? e6 : { value: e6, next: null, prev: null };
    return this._last ? (t2.prev = this._last, this._last.next = t2, this._last = t2) : (this._last = t2, this._first = t2), t2;
  }
  remove(e6) {
    e6.prev && (e6.prev.next = e6.next), e6.next && (e6.next.prev = e6.prev), e6 === this._last && (this._last = e6.prev), e6 === this._first && (this._first = e6.next), e6.prev = null, e6.next = null;
  }
  shift() {
    const e6 = this._first;
    return e6 ? (this._first = e6.next, this._first && (this._first.prev = null), this._last = this._first ? this._last : null, e6.value) : null;
  }
}
const Ti = { nextDraw: null, frames: new zi(), timeouts: new zi(), immediates: new zi(), timer: () => wr.window.performance || wr.window.Date, transforms: [], frame(e6) {
  const t2 = Ti.frames.push({ run: e6 });
  return null === Ti.nextDraw && (Ti.nextDraw = wr.window.requestAnimationFrame(Ti._draw)), t2;
}, timeout(e6, t2) {
  t2 = t2 || 0;
  const r2 = Ti.timer().now() + t2, n2 = Ti.timeouts.push({ run: e6, time: r2 });
  return null === Ti.nextDraw && (Ti.nextDraw = wr.window.requestAnimationFrame(Ti._draw)), n2;
}, immediate(e6) {
  const t2 = Ti.immediates.push(e6);
  return null === Ti.nextDraw && (Ti.nextDraw = wr.window.requestAnimationFrame(Ti._draw)), t2;
}, cancelFrame(e6) {
  null != e6 && Ti.frames.remove(e6);
}, clearTimeout(e6) {
  null != e6 && Ti.timeouts.remove(e6);
}, cancelImmediate(e6) {
  null != e6 && Ti.immediates.remove(e6);
}, _draw(e6) {
  let t2 = null;
  const r2 = Ti.timeouts.last();
  for (; (t2 = Ti.timeouts.shift()) && (e6 >= t2.time ? t2.run() : Ti.timeouts.push(t2), t2 !== r2); ) ;
  let n2 = null;
  const i2 = Ti.frames.last();
  for (; n2 !== i2 && (n2 = Ti.frames.shift()); ) n2.run(e6);
  let o2 = null;
  for (; o2 = Ti.immediates.shift(); ) o2();
  Ti.nextDraw = Ti.timeouts.first() || Ti.frames.first() ? wr.window.requestAnimationFrame(Ti._draw) : null;
} }, Mi = function(e6) {
  const t2 = e6.start, r2 = e6.runner.duration();
  return { start: t2, duration: r2, end: t2 + r2, runner: e6.runner };
}, Ei = function() {
  const e6 = wr.window;
  return (e6.performance || e6.Date).now();
};
class Di extends fn {
  constructor(e6 = Ei) {
    super(), this._timeSource = e6, this._startTime = 0, this._speed = 1, this._persist = 0, this._nextFrame = null, this._paused = true, this._runners = [], this._runnerIds = [], this._lastRunnerId = -1, this._time = 0, this._lastSourceTime = 0, this._lastStepTime = 0, this._step = this._stepFn.bind(this, false), this._stepImmediate = this._stepFn.bind(this, true);
  }
  active() {
    return !!this._nextFrame;
  }
  finish() {
    return this.time(this.getEndTimeOfTimeline() + 1), this.pause();
  }
  getEndTime() {
    const e6 = this.getLastRunnerInfo(), t2 = e6 ? e6.runner.duration() : 0;
    return (e6 ? e6.start : this._time) + t2;
  }
  getEndTimeOfTimeline() {
    const e6 = this._runners.map(((e7) => e7.start + e7.runner.duration()));
    return Math.max(0, ...e6);
  }
  getLastRunnerInfo() {
    return this.getRunnerInfoById(this._lastRunnerId);
  }
  getRunnerInfoById(e6) {
    return this._runners[this._runnerIds.indexOf(e6)] || null;
  }
  pause() {
    return this._paused = true, this._continue();
  }
  persist(e6) {
    return null == e6 ? this._persist : (this._persist = e6, this);
  }
  play() {
    return this._paused = false, this.updateTime()._continue();
  }
  reverse(e6) {
    const t2 = this.speed();
    if (null == e6) return this.speed(-t2);
    const r2 = Math.abs(t2);
    return this.speed(e6 ? -r2 : r2);
  }
  schedule(e6, t2, r2) {
    if (null == e6) return this._runners.map(Mi);
    let n2 = 0;
    const i2 = this.getEndTime();
    if (t2 = t2 || 0, null == r2 || "last" === r2 || "after" === r2) n2 = i2;
    else if ("absolute" === r2 || "start" === r2) n2 = t2, t2 = 0;
    else if ("now" === r2) n2 = this._time;
    else if ("relative" === r2) {
      const r3 = this.getRunnerInfoById(e6.id);
      r3 && (n2 = r3.start + t2, t2 = 0);
    } else {
      if ("with-last" !== r2) throw new Error('Invalid value for the "when" parameter');
      {
        const e7 = this.getLastRunnerInfo();
        n2 = e7 ? e7.start : this._time;
      }
    }
    e6.unschedule(), e6.timeline(this);
    const o2 = e6.persist(), a2 = { persist: null === o2 ? this._persist : o2, start: n2 + t2, runner: e6 };
    return this._lastRunnerId = e6.id, this._runners.push(a2), this._runners.sort(((e7, t3) => e7.start - t3.start)), this._runnerIds = this._runners.map(((e7) => e7.runner.id)), this.updateTime()._continue(), this;
  }
  seek(e6) {
    return this.time(this._time + e6);
  }
  source(e6) {
    return null == e6 ? this._timeSource : (this._timeSource = e6, this);
  }
  speed(e6) {
    return null == e6 ? this._speed : (this._speed = e6, this);
  }
  stop() {
    return this.time(0), this.pause();
  }
  time(e6) {
    return null == e6 ? this._time : (this._time = e6, this._continue(true));
  }
  unschedule(e6) {
    const t2 = this._runnerIds.indexOf(e6.id);
    return t2 < 0 || (this._runners.splice(t2, 1), this._runnerIds.splice(t2, 1), e6.timeline(null)), this;
  }
  updateTime() {
    return this.active() || (this._lastSourceTime = this._timeSource()), this;
  }
  _continue(e6 = false) {
    return Ti.cancelFrame(this._nextFrame), this._nextFrame = null, e6 ? this._stepImmediate() : (this._paused || (this._nextFrame = Ti.frame(this._step)), this);
  }
  _stepFn(e6 = false) {
    const t2 = this._timeSource();
    let r2 = t2 - this._lastSourceTime;
    e6 && (r2 = 0);
    const n2 = this._speed * r2 + (this._time - this._lastStepTime);
    this._lastSourceTime = t2, e6 || (this._time += n2, this._time = this._time < 0 ? 0 : this._time), this._lastStepTime = this._time, this.fire("time", this._time);
    for (let e7 = this._runners.length; e7--; ) {
      const t3 = this._runners[e7], r3 = t3.runner;
      this._time - t3.start <= 0 && r3.reset();
    }
    let i2 = false;
    for (let e7 = 0, t3 = this._runners.length; e7 < t3; e7++) {
      const r3 = this._runners[e7], o2 = r3.runner;
      let a2 = n2;
      const s2 = this._time - r3.start;
      if (s2 <= 0) {
        i2 = true;
        continue;
      }
      if (s2 < a2 && (a2 = s2), !o2.active()) continue;
      if (o2.step(a2).done) {
        if (true !== r3.persist) {
          o2.duration() - o2.time() + this._time + r3.persist < this._time && (o2.unschedule(), --e7, --t3);
        }
      } else i2 = true;
    }
    return i2 && !(this._speed < 0 && 0 === this._time) || this._runnerIds.length && this._speed < 0 && this._time > 0 ? this._continue() : (this.pause(), this.fire("finished")), this;
  }
}
ur({ Element: { timeline: function(e6) {
  return null == e6 ? (this._timeline = this._timeline || new Di(), this._timeline) : (this._timeline = e6, this);
} } });
class Li extends fn {
  constructor(e6) {
    super(), this.id = Li.id++, e6 = "function" == typeof (e6 = null == e6 ? yn : e6) ? new ii(e6) : e6, this._element = null, this._timeline = null, this.done = false, this._queue = [], this._duration = "number" == typeof e6 && e6, this._isDeclarative = e6 instanceof ii, this._stepper = this._isDeclarative ? e6 : new ni(), this._history = {}, this.enabled = true, this._time = 0, this._lastTime = 0, this._reseted = true, this.transforms = new tn(), this.transformId = 1, this._haveReversed = false, this._reverse = false, this._loopsDone = 0, this._swing = false, this._wait = 0, this._times = 1, this._frameId = null, this._persist = !!this._isDeclarative || null;
  }
  static sanitise(e6, t2, r2) {
    let n2 = 1, i2 = false, o2 = 0;
    return t2 = t2 || xn, r2 = r2 || "last", "object" != typeof (e6 = e6 || yn) || e6 instanceof ri || (t2 = e6.delay || t2, r2 = e6.when || r2, i2 = e6.swing || i2, n2 = e6.times || n2, o2 = e6.wait || o2, e6 = e6.duration || yn), { duration: e6, delay: t2, swing: i2, times: n2, wait: o2, when: r2 };
  }
  active(e6) {
    return null == e6 ? this.enabled : (this.enabled = e6, this);
  }
  addTransform(e6, t2) {
    return this.transforms.lmultiplyO(e6), this;
  }
  after(e6) {
    return this.on("finished", e6);
  }
  animate(e6, t2, r2) {
    const n2 = Li.sanitise(e6, t2, r2), i2 = new Li(n2.duration);
    return this._timeline && i2.timeline(this._timeline), this._element && i2.element(this._element), i2.loop(n2).schedule(n2.delay, n2.when);
  }
  clearTransform() {
    return this.transforms = new tn(), this;
  }
  clearTransformsFromQueue() {
    this.done && this._timeline && this._timeline._runnerIds.includes(this.id) || (this._queue = this._queue.filter(((e6) => !e6.isTransform)));
  }
  delay(e6) {
    return this.animate(0, e6);
  }
  duration() {
    return this._times * (this._wait + this._duration) - this._wait;
  }
  during(e6) {
    return this.queue(null, e6);
  }
  ease(e6) {
    return this._stepper = new ni(e6), this;
  }
  element(e6) {
    return null == e6 ? this._element : (this._element = e6, e6._prepareRunner(), this);
  }
  finish() {
    return this.step(1 / 0);
  }
  loop(e6, t2, r2) {
    return "object" == typeof e6 && (t2 = e6.swing, r2 = e6.wait, e6 = e6.times), this._times = e6 || 1 / 0, this._swing = t2 || false, this._wait = r2 || 0, true === this._times && (this._times = 1 / 0), this;
  }
  loops(e6) {
    const t2 = this._duration + this._wait;
    if (null == e6) {
      const e7 = Math.floor(this._time / t2), r3 = (this._time - e7 * t2) / this._duration;
      return Math.min(e7 + r3, this._times);
    }
    const r2 = e6 % 1, n2 = t2 * Math.floor(e6) + this._duration * r2;
    return this.time(n2);
  }
  persist(e6) {
    return null == e6 ? this._persist : (this._persist = e6, this);
  }
  position(e6) {
    const t2 = this._time, r2 = this._duration, n2 = this._wait, i2 = this._times, o2 = this._swing, a2 = this._reverse;
    let s2;
    if (null == e6) {
      const e7 = function(e8) {
        const t3 = o2 * Math.floor(e8 % (2 * (n2 + r2)) / (n2 + r2)), i3 = t3 && !a2 || !t3 && a2, s3 = Math.pow(-1, i3) * (e8 % (n2 + r2)) / r2 + i3;
        return Math.max(Math.min(s3, 1), 0);
      }, l3 = i2 * (n2 + r2) - n2;
      return s2 = t2 <= 0 ? Math.round(e7(1e-5)) : t2 < l3 ? e7(t2) : Math.round(e7(l3 - 1e-5)), s2;
    }
    const l2 = Math.floor(this.loops()), u2 = o2 && l2 % 2 == 0;
    return s2 = l2 + (u2 && !a2 || a2 && u2 ? e6 : 1 - e6), this.loops(s2);
  }
  progress(e6) {
    return null == e6 ? Math.min(1, this._time / this.duration()) : this.time(e6 * this.duration());
  }
  queue(e6, t2, r2, n2) {
    this._queue.push({ initialiser: e6 || bn, runner: t2 || bn, retarget: r2, isTransform: n2, initialised: false, finished: false });
    return this.timeline() && this.timeline()._continue(), this;
  }
  reset() {
    return this._reseted || (this.time(0), this._reseted = true), this;
  }
  reverse(e6) {
    return this._reverse = null == e6 ? !this._reverse : e6, this;
  }
  schedule(e6, t2, r2) {
    if (e6 instanceof Di || (r2 = t2, t2 = e6, e6 = this.timeline()), !e6) throw Error("Runner cannot be scheduled without timeline");
    return e6.schedule(this, t2, r2), this;
  }
  step(e6) {
    if (!this.enabled) return this;
    e6 = null == e6 ? 16 : e6, this._time += e6;
    const t2 = this.position(), r2 = this._lastPosition !== t2 && this._time >= 0;
    this._lastPosition = t2;
    const n2 = this.duration(), i2 = this._lastTime <= 0 && this._time > 0, o2 = this._lastTime < n2 && this._time >= n2;
    this._lastTime = this._time, i2 && this.fire("start", this);
    const a2 = this._isDeclarative;
    this.done = !a2 && !o2 && this._time >= n2, this._reseted = false;
    let s2 = false;
    return (r2 || a2) && (this._initialise(r2), this.transforms = new tn(), s2 = this._run(a2 ? e6 : t2), this.fire("step", this)), this.done = this.done || s2 && a2, o2 && this.fire("finished", this), this;
  }
  time(e6) {
    if (null == e6) return this._time;
    const t2 = e6 - this._time;
    return this.step(t2), this;
  }
  timeline(e6) {
    return void 0 === e6 ? this._timeline : (this._timeline = e6, this);
  }
  unschedule() {
    const e6 = this.timeline();
    return e6 && e6.unschedule(this), this;
  }
  _initialise(e6) {
    if (e6 || this._isDeclarative) for (let t2 = 0, r2 = this._queue.length; t2 < r2; ++t2) {
      const r3 = this._queue[t2], n2 = this._isDeclarative || !r3.initialised && e6;
      e6 = !r3.finished, n2 && e6 && (r3.initialiser.call(this), r3.initialised = true);
    }
  }
  _rememberMorpher(e6, t2) {
    if (this._history[e6] = { morpher: t2, caller: this._queue[this._queue.length - 1] }, this._isDeclarative) {
      const e7 = this.timeline();
      e7 && e7.play();
    }
  }
  _run(e6) {
    let t2 = true;
    for (let r2 = 0, n2 = this._queue.length; r2 < n2; ++r2) {
      const n3 = this._queue[r2], i2 = n3.runner.call(this, e6);
      n3.finished = n3.finished || true === i2, t2 = t2 && n3.finished;
    }
    return t2;
  }
  _tryRetarget(e6, t2, r2) {
    if (this._history[e6]) {
      if (!this._history[e6].caller.initialised) {
        const t3 = this._queue.indexOf(this._history[e6].caller);
        return this._queue.splice(t3, 1), false;
      }
      this._history[e6].caller.retarget ? this._history[e6].caller.retarget.call(this, t2, r2) : this._history[e6].morpher.to(t2), this._history[e6].caller.finished = false;
      const n2 = this.timeline();
      return n2 && n2.play(), true;
    }
    return false;
  }
}
Li.id = 0;
class Bi {
  constructor(e6 = new tn(), t2 = -1, r2 = true) {
    this.transforms = e6, this.id = t2, this.done = r2;
  }
  clearTransformsFromQueue() {
  }
}
Br([Li, Bi], { mergeWith(e6) {
  return new Bi(e6.transforms.lmultiply(this.transforms), e6.id);
} });
const Ni = (e6, t2) => e6.lmultiplyO(t2), Oi = (e6) => e6.transforms;
function Fi() {
  const e6 = this._transformationRunners.runners.map(Oi).reduce(Ni, new tn());
  this.transform(e6), this._transformationRunners.merge(), 1 === this._transformationRunners.length() && (this._frameId = null);
}
class Ri {
  constructor() {
    this.runners = [], this.ids = [];
  }
  add(e6) {
    if (this.runners.includes(e6)) return;
    const t2 = e6.id + 1;
    return this.runners.push(e6), this.ids.push(t2), this;
  }
  clearBefore(e6) {
    const t2 = this.ids.indexOf(e6 + 1) || 1;
    return this.ids.splice(0, t2, 0), this.runners.splice(0, t2, new Bi()).forEach(((e7) => e7.clearTransformsFromQueue())), this;
  }
  edit(e6, t2) {
    const r2 = this.ids.indexOf(e6 + 1);
    return this.ids.splice(r2, 1, e6 + 1), this.runners.splice(r2, 1, t2), this;
  }
  getByID(e6) {
    return this.runners[this.ids.indexOf(e6 + 1)];
  }
  length() {
    return this.ids.length;
  }
  merge() {
    let e6 = null;
    for (let t2 = 0; t2 < this.runners.length; ++t2) {
      const r2 = this.runners[t2];
      if (e6 && r2.done && e6.done && (!r2._timeline || !r2._timeline._runnerIds.includes(r2.id)) && (!e6._timeline || !e6._timeline._runnerIds.includes(e6.id))) {
        this.remove(r2.id);
        const n2 = r2.mergeWith(e6);
        this.edit(e6.id, n2), e6 = n2, --t2;
      } else e6 = r2;
    }
    return this;
  }
  remove(e6) {
    const t2 = this.ids.indexOf(e6 + 1);
    return this.ids.splice(t2, 1), this.runners.splice(t2, 1), this;
  }
}
ur({ Element: { animate(e6, t2, r2) {
  const n2 = Li.sanitise(e6, t2, r2), i2 = this.timeline();
  return new Li(n2.duration).loop(n2).element(this).timeline(i2.play()).schedule(n2.delay, n2.when);
}, delay(e6, t2) {
  return this.animate(0, e6, t2);
}, _clearTransformRunnersBefore(e6) {
  this._transformationRunners.clearBefore(e6.id);
}, _currentTransform(e6) {
  return this._transformationRunners.runners.filter(((t2) => t2.id <= e6.id)).map(Oi).reduce(Ni, new tn());
}, _addRunner(e6) {
  this._transformationRunners.add(e6), Ti.cancelImmediate(this._frameId), this._frameId = Ti.immediate(Fi.bind(this));
}, _prepareRunner() {
  null == this._frameId && (this._transformationRunners = new Ri().add(new Bi(new tn(this))));
} } });
Br(Li, { attr(e6, t2) {
  return this.styleAttr("attr", e6, t2);
}, css(e6, t2) {
  return this.styleAttr("css", e6, t2);
}, styleAttr(e6, t2, r2) {
  if ("string" == typeof t2) return this.styleAttr(e6, { [t2]: r2 });
  let n2 = t2;
  if (this._tryRetarget(e6, n2)) return this;
  let i2 = new bi(this._stepper).to(n2), o2 = Object.keys(n2);
  return this.queue((function() {
    i2 = i2.from(this.element()[e6](o2));
  }), (function(t3) {
    return this.element()[e6](i2.at(t3).valueOf()), i2.done();
  }), (function(t3) {
    const r3 = Object.keys(t3), a2 = (s2 = o2, r3.filter(((e7) => !s2.includes(e7))));
    var s2;
    if (a2.length) {
      const t4 = this.element()[e6](a2), r4 = new wi(i2.from()).valueOf();
      Object.assign(r4, t4), i2.from(r4);
    }
    const l2 = new wi(i2.to()).valueOf();
    Object.assign(l2, t3), i2.to(l2), o2 = r3, n2 = t3;
  })), this._rememberMorpher(e6, i2), this;
}, zoom(e6, t2) {
  if (this._tryRetarget("zoom", e6, t2)) return this;
  let r2 = new bi(this._stepper).to(new An(e6));
  return this.queue((function() {
    r2 = r2.from(this.element().zoom());
  }), (function(e7) {
    return this.element().zoom(r2.at(e7), t2), r2.done();
  }), (function(e7, n2) {
    t2 = n2, r2.to(e7);
  })), this._rememberMorpher("zoom", r2), this;
}, transform(e6, t2, r2) {
  if (t2 = e6.relative || t2, this._isDeclarative && !t2 && this._tryRetarget("transform", e6)) return this;
  const n2 = tn.isMatrixLike(e6);
  r2 = null != e6.affine ? e6.affine : null != r2 ? r2 : !n2;
  const i2 = new bi(this._stepper).type(r2 ? vi : tn);
  let o2, a2, s2, l2, u2;
  return this.queue((function() {
    a2 = a2 || this.element(), o2 = o2 || br(e6, a2), u2 = new tn(t2 ? void 0 : a2), a2._addRunner(this), t2 || a2._clearTransformRunnersBefore(this);
  }), (function(c2) {
    t2 || this.clearTransform();
    const { x: h2, y: p2 } = new Qr(o2).transform(a2._currentTransform(this));
    let d2 = new tn({ ...e6, origin: [h2, p2] }), m2 = this._isDeclarative && s2 ? s2 : u2;
    if (r2) {
      d2 = d2.decompose(h2, p2), m2 = m2.decompose(h2, p2);
      const e7 = d2.rotate, t3 = m2.rotate, r3 = [e7 - 360, e7, e7 + 360], n3 = r3.map(((e8) => Math.abs(e8 - t3))), i3 = Math.min(...n3), o3 = n3.indexOf(i3);
      d2.rotate = r3[o3];
    }
    t2 && (n2 || (d2.rotate = e6.rotate || 0), this._isDeclarative && l2 && (m2.rotate = l2)), i2.from(m2), i2.to(d2);
    const g2 = i2.at(c2);
    return l2 = g2.rotate, s2 = new tn(g2), this.addTransform(s2), a2._addRunner(this), i2.done();
  }), (function(t3) {
    (t3.origin || "center").toString() !== (e6.origin || "center").toString() && (o2 = br(t3, a2)), e6 = { ...t3, origin: o2 };
  }), true), this._isDeclarative && this._rememberMorpher("transform", i2), this;
}, x(e6, t2) {
  return this._queueNumber("x", e6);
}, y(e6) {
  return this._queueNumber("y", e6);
}, dx(e6 = 0) {
  return this._queueNumberDelta("x", e6);
}, dy(e6 = 0) {
  return this._queueNumberDelta("y", e6);
}, dmove(e6, t2) {
  return this.dx(e6).dy(t2);
}, _queueNumberDelta(e6, t2) {
  if (t2 = new An(t2), this._tryRetarget(e6, t2)) return this;
  const r2 = new bi(this._stepper).to(t2);
  let n2 = null;
  return this.queue((function() {
    n2 = this.element()[e6](), r2.from(n2), r2.to(n2 + t2);
  }), (function(t3) {
    return this.element()[e6](r2.at(t3)), r2.done();
  }), (function(e7) {
    r2.to(n2 + new An(e7));
  })), this._rememberMorpher(e6, r2), this;
}, _queueObject(e6, t2) {
  if (this._tryRetarget(e6, t2)) return this;
  const r2 = new bi(this._stepper).to(t2);
  return this.queue((function() {
    r2.from(this.element()[e6]());
  }), (function(t3) {
    return this.element()[e6](r2.at(t3)), r2.done();
  })), this._rememberMorpher(e6, r2), this;
}, _queueNumber(e6, t2) {
  return this._queueObject(e6, new An(t2));
}, cx(e6) {
  return this._queueNumber("cx", e6);
}, cy(e6) {
  return this._queueNumber("cy", e6);
}, move(e6, t2) {
  return this.x(e6).y(t2);
}, center(e6, t2) {
  return this.cx(e6).cy(t2);
}, size(e6, t2) {
  let r2;
  return e6 && t2 || (r2 = this._element.bbox()), e6 || (e6 = r2.width / r2.height * t2), t2 || (t2 = r2.height / r2.width * e6), this.width(e6).height(t2);
}, width(e6) {
  return this._queueNumber("width", e6);
}, height(e6) {
  return this._queueNumber("height", e6);
}, plot(e6, t2, r2, n2) {
  if (4 === arguments.length) return this.plot([e6, t2, r2, n2]);
  if (this._tryRetarget("plot", e6)) return this;
  const i2 = new bi(this._stepper).type(this._element.MorphArray).to(e6);
  return this.queue((function() {
    i2.from(this._element.array());
  }), (function(e7) {
    return this._element.plot(i2.at(e7)), i2.done();
  })), this._rememberMorpher("plot", i2), this;
}, leading(e6) {
  return this._queueNumber("leading", e6);
}, viewbox(e6, t2, r2, n2) {
  return this._queueObject("viewbox", new on(e6, t2, r2, n2));
}, update(e6) {
  return "object" != typeof e6 ? this.update({ offset: arguments[0], color: arguments[1], opacity: arguments[2] }) : (null != e6.opacity && this.attr("stop-opacity", e6.opacity), null != e6.color && this.attr("stop-color", e6.color), null != e6.offset && this.attr("offset", e6.offset), this);
} }), Br(Li, { rx: En, ry: Dn, from: Pn, to: jn }), Mr(Li, "Runner");
class Hi extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("svg", e6), t2), this.namespace();
  }
  defs() {
    return this.isRoot() ? zr(this.node.querySelector("defs")) || this.put(new Tn()) : this.root().defs();
  }
  isRoot() {
    return !this.node.parentNode || !(this.node.parentNode instanceof wr.window.SVGElement) && "#document-fragment" !== this.node.parentNode.nodeName;
  }
  namespace() {
    return this.isRoot() ? this.attr({ xmlns: yr, version: "1.1" }).attr("xmlns:xlink", xr, vr).attr("xmlns:svgjs", "http://svgjs.dev/svgjs", vr) : this.root().namespace();
  }
  removeNamespace() {
    return this.attr({ xmlns: null, version: null }).attr("xmlns:xlink", null, vr).attr("xmlns:svgjs", null, vr);
  }
  root() {
    return this.isRoot() ? this : super.root();
  }
}
ur({ Container: { nested: Nr((function() {
  return this.put(new Hi());
})) } }), Mr(Hi, "Svg", true);
let Vi = class extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("symbol", e6), t2);
  }
};
ur({ Container: { symbol: Nr((function() {
  return this.put(new Vi());
})) } }), Mr(Vi, "Symbol");
var Ii = Object.freeze({ __proto__: null, amove: function(e6, t2) {
  return this.ax(e6).ay(t2);
}, ax: function(e6) {
  return this.attr("x", e6);
}, ay: function(e6) {
  return this.attr("y", e6);
}, build: function(e6) {
  return this._build = !!e6, this;
}, center: function(e6, t2, r2 = this.bbox()) {
  return this.cx(e6, r2).cy(t2, r2);
}, cx: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.cx : this.attr("x", this.attr("x") + e6 - t2.cx);
}, cy: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.cy : this.attr("y", this.attr("y") + e6 - t2.cy);
}, length: function() {
  return this.node.getComputedTextLength();
}, move: function(e6, t2, r2 = this.bbox()) {
  return this.x(e6, r2).y(t2, r2);
}, plain: function(e6) {
  return false === this._build && this.clear(), this.node.appendChild(wr.document.createTextNode(e6)), this;
}, x: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.x : this.attr("x", this.attr("x") + e6 - t2.x);
}, y: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.y : this.attr("y", this.attr("y") + e6 - t2.y);
} });
class Pi extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("text", e6), t2), this.dom.leading = new An(1.3), this._rebuild = true, this._build = false;
  }
  leading(e6) {
    return null == e6 ? this.dom.leading : (this.dom.leading = new An(e6), this.rebuild());
  }
  rebuild(e6) {
    if ("boolean" == typeof e6 && (this._rebuild = e6), this._rebuild) {
      const e7 = this;
      let t2 = 0;
      const r2 = this.dom.leading;
      this.each((function(n2) {
        const i2 = wr.window.getComputedStyle(this.node).getPropertyValue("font-size"), o2 = r2 * new An(i2);
        this.dom.newLined && (this.attr("x", e7.attr("x")), "\n" === this.text() ? t2 += o2 : (this.attr("dy", n2 ? o2 + t2 : 0), t2 = 0));
      })), this.fire("rebuild");
    }
    return this;
  }
  setData(e6) {
    return this.dom = e6, this.dom.leading = new An(e6.leading || 1.3), this;
  }
  text(e6) {
    if (void 0 === e6) {
      const t2 = this.node.childNodes;
      let r2 = 0;
      e6 = "";
      for (let n2 = 0, i2 = t2.length; n2 < i2; ++n2) "textPath" !== t2[n2].nodeName ? (n2 !== r2 && 3 !== t2[n2].nodeType && true === zr(t2[n2]).dom.newLined && (e6 += "\n"), e6 += t2[n2].textContent) : 0 === n2 && (r2 = 1);
      return e6;
    }
    if (this.clear().build(true), "function" == typeof e6) e6.call(this, this);
    else for (let t2 = 0, r2 = (e6 = (e6 + "").split("\n")).length; t2 < r2; t2++) this.newLine(e6[t2]);
    return this.build(false).rebuild();
  }
}
Br(Pi, Ii), ur({ Container: { text: Nr((function(e6 = "") {
  return this.put(new Pi()).text(e6);
})), plain: Nr((function(e6 = "") {
  return this.put(new Pi()).plain(e6);
})) } }), Mr(Pi, "Text");
class ji extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("tspan", e6), t2), this._build = false;
  }
  dx(e6) {
    return this.attr("dx", e6);
  }
  dy(e6) {
    return this.attr("dy", e6);
  }
  newLine() {
    this.dom.newLined = true;
    const e6 = this.parent();
    if (!(e6 instanceof Pi)) return this;
    const t2 = e6.index(this), r2 = wr.window.getComputedStyle(this.node).getPropertyValue("font-size"), n2 = e6.dom.leading * new An(r2);
    return this.dy(t2 ? n2 : 0).attr("x", e6.x());
  }
  text(e6) {
    return null == e6 ? this.node.textContent + (this.dom.newLined ? "\n" : "") : ("function" == typeof e6 ? (this.clear().build(true), e6.call(this, this), this.build(false)) : this.plain(e6), this);
  }
}
Br(ji, Ii), ur({ Tspan: { tspan: Nr((function(e6 = "") {
  const t2 = new ji();
  return this._build || this.clear(), this.put(t2).text(e6);
})) }, Text: { newLine: function(e6 = "") {
  return this.tspan(e6).newLine();
} } }), Mr(ji, "Tspan");
class Gi extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("circle", e6), t2);
  }
  radius(e6) {
    return this.attr("r", e6);
  }
  rx(e6) {
    return this.attr("r", e6);
  }
  ry(e6) {
    return this.rx(e6);
  }
  size(e6) {
    return this.radius(new An(e6).divide(2));
  }
}
Br(Gi, { x: Ln, y: Bn, cx: Nn, cy: On, width: Fn, height: Rn }), ur({ Container: { circle: Nr((function(e6 = 0) {
  return this.put(new Gi()).size(e6).move(0, 0);
})) } }), Mr(Gi, "Circle");
class Ui extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("clipPath", e6), t2);
  }
  remove() {
    return this.targets().forEach((function(e6) {
      e6.unclip();
    })), super.remove();
  }
  targets() {
    return un('svg [clip-path*="' + this.id() + '"]');
  }
}
ur({ Container: { clip: Nr((function() {
  return this.defs().put(new Ui());
})) }, Element: { clipper() {
  return this.reference("clip-path");
}, clipWith(e6) {
  const t2 = e6 instanceof Ui ? e6 : this.parent().clip().add(e6);
  return this.attr("clip-path", 'url("#' + t2.id() + '")');
}, unclip() {
  return this.attr("clip-path", null);
} } }), Mr(Ui, "ClipPath");
class Yi extends qn {
  constructor(e6, t2 = e6) {
    super(Cr("foreignObject", e6), t2);
  }
}
ur({ Container: { foreignObject: Nr((function(e6, t2) {
  return this.put(new Yi()).size(e6, t2);
})) } }), Mr(Yi, "ForeignObject");
var Xi = Object.freeze({ __proto__: null, dmove: function(e6, t2) {
  return this.children().forEach(((r2, n2) => {
    let i2;
    try {
      i2 = r2.bbox();
    } catch (e7) {
      return;
    }
    const o2 = new tn(r2), a2 = o2.translate(e6, t2).transform(o2.inverse()), s2 = new Qr(i2.x, i2.y).transform(a2);
    r2.move(s2.x, s2.y);
  })), this;
}, dx: function(e6) {
  return this.dmove(e6, 0);
}, dy: function(e6) {
  return this.dmove(0, e6);
}, height: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.height : this.size(t2.width, e6, t2);
}, move: function(e6 = 0, t2 = 0, r2 = this.bbox()) {
  const n2 = e6 - r2.x, i2 = t2 - r2.y;
  return this.dmove(n2, i2);
}, size: function(e6, t2, r2 = this.bbox()) {
  const n2 = fr(this, e6, t2, r2), i2 = n2.width / r2.width, o2 = n2.height / r2.height;
  return this.children().forEach(((e7, t3) => {
    const n3 = new Qr(r2).transform(new tn(e7).inverse());
    e7.scale(i2, o2, n3.x, n3.y);
  })), this;
}, width: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.width : this.size(e6, t2.height, t2);
}, x: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.x : this.move(e6, t2.y, t2);
}, y: function(e6, t2 = this.bbox()) {
  return null == e6 ? t2.y : this.move(t2.x, e6, t2);
} });
class Wi extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("g", e6), t2);
  }
}
Br(Wi, Xi), ur({ Container: { group: Nr((function() {
  return this.put(new Wi());
})) } }), Mr(Wi, "G");
class $i extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("a", e6), t2);
  }
  target(e6) {
    return this.attr("target", e6);
  }
  to(e6) {
    return this.attr("href", e6, xr);
  }
}
Br($i, Xi), ur({ Container: { link: Nr((function(e6) {
  return this.put(new $i()).to(e6);
})) }, Element: { unlink() {
  const e6 = this.linker();
  if (!e6) return this;
  const t2 = e6.parent();
  if (!t2) return this.remove();
  const r2 = t2.index(e6);
  return t2.add(this, r2), e6.remove(), this;
}, linkTo(e6) {
  let t2 = this.linker();
  return t2 || (t2 = new $i(), this.wrap(t2)), "function" == typeof e6 ? e6.call(t2, t2) : t2.to(e6), this;
}, linker() {
  const e6 = this.parent();
  return e6 && "a" === e6.node.nodeName.toLowerCase() ? e6 : null;
} } }), Mr($i, "A");
class Zi extends zn {
  constructor(e6, t2 = e6) {
    super(Cr("mask", e6), t2);
  }
  remove() {
    return this.targets().forEach((function(e6) {
      e6.unmask();
    })), super.remove();
  }
  targets() {
    return un('svg [mask*="' + this.id() + '"]');
  }
}
ur({ Container: { mask: Nr((function() {
  return this.defs().put(new Zi());
})) }, Element: { masker() {
  return this.reference("mask");
}, maskWith(e6) {
  const t2 = e6 instanceof Zi ? e6 : this.parent().mask().add(e6);
  return this.attr("mask", 'url("#' + t2.id() + '")');
}, unmask() {
  return this.attr("mask", null);
} } }), Mr(Zi, "Mask");
class Ji extends qn {
  constructor(e6, t2 = e6) {
    super(Cr("stop", e6), t2);
  }
  update(e6) {
    return ("number" == typeof e6 || e6 instanceof An) && (e6 = { offset: arguments[0], color: arguments[1], opacity: arguments[2] }), null != e6.opacity && this.attr("stop-opacity", e6.opacity), null != e6.color && this.attr("stop-color", e6.color), null != e6.offset && this.attr("offset", new An(e6.offset)), this;
  }
}
ur({ Gradient: { stop: function(e6, t2, r2) {
  return this.put(new Ji()).update(e6, t2, r2);
} } }), Mr(Ji, "Stop");
let Ki = class extends qn {
  constructor(e6, t2 = e6) {
    super(Cr("style", e6), t2);
  }
  addText(e6 = "") {
    return this.node.textContent += e6, this;
  }
  font(e6, t2, r2 = {}) {
    return this.rule("@font-face", { fontFamily: e6, src: t2, ...r2 });
  }
  rule(e6, t2) {
    return this.addText((function(e7, t3) {
      if (!e7) return "";
      if (!t3) return e7;
      let r2 = e7 + "{";
      for (const e8 in t3) r2 += e8.replace(/([A-Z])/g, (function(e9, t4) {
        return "-" + t4.toLowerCase();
      })) + ":" + t3[e8] + ";";
      return r2 += "}", r2;
    })(e6, t2));
  }
};
ur("Dom", { style(e6, t2) {
  return this.put(new Ki()).rule(e6, t2);
}, fontface(e6, t2, r2) {
  return this.put(new Ki()).font(e6, t2, r2);
} }), Mr(Ki, "Style");
class Qi extends Pi {
  constructor(e6, t2 = e6) {
    super(Cr("textPath", e6), t2);
  }
  array() {
    const e6 = this.track();
    return e6 ? e6.array() : null;
  }
  plot(e6) {
    const t2 = this.track();
    let r2 = null;
    return t2 && (r2 = t2.plot(e6)), null == e6 ? r2 : this;
  }
  track() {
    return this.reference("href");
  }
}
ur({ Container: { textPath: Nr((function(e6, t2) {
  return e6 instanceof Pi || (e6 = this.text(e6)), e6.path(t2);
})) }, Text: { path: Nr((function(e6, t2 = true) {
  const r2 = new Qi();
  let n2;
  if (e6 instanceof Ai || (e6 = this.defs().path(e6)), r2.attr("href", "#" + e6, xr), t2) for (; n2 = this.node.firstChild; ) r2.node.appendChild(n2);
  return this.put(r2);
})), textPath() {
  return this.findOne("textPath");
} }, Path: { text: Nr((function(e6) {
  return e6 instanceof Pi || (e6 = new Pi().addTo(this.parent()).text(e6)), e6.path(this);
})), targets() {
  return un("svg textPath").filter(((e6) => (e6.attr("href") || "").includes(this.id())));
} } }), Qi.prototype.MorphArray = gi, Mr(Qi, "TextPath");
class eo extends Mn {
  constructor(e6, t2 = e6) {
    super(Cr("use", e6), t2);
  }
  use(e6, t2) {
    return this.attr("href", (t2 || "") + "#" + e6, xr);
  }
}
ur({ Container: { use: Nr((function(e6, t2) {
  return this.put(new eo()).use(e6, t2);
})) } }), Mr(eo, "Use");
const to = qr;
Br([Hi, Vi, Wn, Xn, Qn], cr("viewbox")), Br([Kn, qi, Si, Ai], cr("marker")), Br(Pi, cr("Text")), Br(Ai, cr("Path")), Br(Tn, cr("Defs")), Br([Pi, ji], cr("Tspan")), Br([Ci, Vn, Yn, Li], cr("radius")), Br(fn, cr("EventTarget")), Br(Sn, cr("Dom")), Br(qn, cr("Element")), Br(Mn, cr("Shape")), Br([zn, In], cr("Container")), Br(Yn, cr("Gradient")), Br(Li, cr("Runner")), sn.extend([...new Set(lr)]), (function(e6 = []) {
  ki.push(...[].concat(e6));
})([An, Kr, on, tn, kn, $n, gi, Qr]), Br(ki, { to(e6) {
  return new bi().type(this.constructor).from(this.toArray()).to(e6);
}, fromArray(e6) {
  return this.init(e6), this;
}, toConsumable() {
  return this.toArray();
}, morph(e6, t2, r2, n2, i2) {
  return this.fromArray(e6.map((function(e7, o2) {
    return n2.step(e7, t2[o2], r2, i2[o2], i2);
  })));
} });
class ro {
  constructor(e6, t2, r2) {
    this.lexer = void 0, this.start = void 0, this.end = void 0, this.lexer = e6, this.start = t2, this.end = r2;
  }
  static range(e6, t2) {
    return t2 ? e6 && e6.loc && t2.loc && e6.loc.lexer === t2.loc.lexer ? new ro(e6.loc.lexer, e6.loc.start, t2.loc.end) : null : e6 && e6.loc;
  }
}
class no {
  constructor(e6, t2) {
    this.text = void 0, this.loc = void 0, this.noexpand = void 0, this.treatAsRelax = void 0, this.text = e6, this.loc = t2;
  }
  range(e6, t2) {
    return new no(t2, ro.range(this, e6));
  }
}
class io {
  constructor(e6, t2) {
    this.position = void 0;
    var r2, n2 = "KaTeX parse error: " + e6, i2 = t2 && t2.loc;
    if (i2 && i2.start <= i2.end) {
      var o2 = i2.lexer.input;
      r2 = i2.start;
      var a2 = i2.end;
      r2 === o2.length ? n2 += " at end of input: " : n2 += " at position " + (r2 + 1) + ": ";
      var s2 = o2.slice(r2, a2).replace(/[^]/g, "$&̲");
      n2 += (r2 > 15 ? "…" + o2.slice(r2 - 15, r2) : o2.slice(0, r2)) + s2 + (a2 + 15 < o2.length ? o2.slice(a2, a2 + 15) + "…" : o2.slice(a2));
    }
    var l2 = new Error(n2);
    return l2.name = "ParseError", l2.__proto__ = io.prototype, l2.position = r2, l2;
  }
}
io.prototype.__proto__ = Error.prototype;
var oo = /([A-Z])/g, ao = { "&": "&amp;", ">": "&gt;", "<": "&lt;", '"': "&quot;", "'": "&#x27;" }, so = /[&><"']/g;
var lo = function e2(t2) {
  return "ordgroup" === t2.type || "color" === t2.type ? 1 === t2.body.length ? e2(t2.body[0]) : t2 : "font" === t2.type ? e2(t2.body) : t2;
}, uo = { contains: function(e6, t2) {
  return -1 !== e6.indexOf(t2);
}, deflt: function(e6, t2) {
  return void 0 === e6 ? t2 : e6;
}, escape: function(e6) {
  return String(e6).replace(so, ((e7) => ao[e7]));
}, hyphenate: function(e6) {
  return e6.replace(oo, "-$1").toLowerCase();
}, getBaseElem: lo, isCharacterBox: function(e6) {
  var t2 = lo(e6);
  return "mathord" === t2.type || "textord" === t2.type || "atom" === t2.type;
}, protocolFromUrl: function(e6) {
  var t2 = /^\s*([^\\/#]*?)(?::|&#0*58|&#x0*3a)/i.exec(e6);
  return null != t2 ? t2[1] : "_relative";
} };
class co {
  constructor(e6) {
    this.displayMode = void 0, this.output = void 0, this.leqno = void 0, this.fleqn = void 0, this.throwOnError = void 0, this.errorColor = void 0, this.macros = void 0, this.minRuleThickness = void 0, this.colorIsTextColor = void 0, this.strict = void 0, this.trust = void 0, this.maxSize = void 0, this.maxExpand = void 0, this.globalGroup = void 0, e6 = e6 || {}, this.displayMode = uo.deflt(e6.displayMode, false), this.output = uo.deflt(e6.output, "htmlAndMathml"), this.leqno = uo.deflt(e6.leqno, false), this.fleqn = uo.deflt(e6.fleqn, false), this.throwOnError = uo.deflt(e6.throwOnError, true), this.errorColor = uo.deflt(e6.errorColor, "#cc0000"), this.macros = e6.macros || {}, this.minRuleThickness = Math.max(0, uo.deflt(e6.minRuleThickness, 0)), this.colorIsTextColor = uo.deflt(e6.colorIsTextColor, false), this.strict = uo.deflt(e6.strict, "warn"), this.trust = uo.deflt(e6.trust, false), this.maxSize = Math.max(0, uo.deflt(e6.maxSize, 1 / 0)), this.maxExpand = Math.max(0, uo.deflt(e6.maxExpand, 1e3)), this.globalGroup = uo.deflt(e6.globalGroup, false);
  }
  reportNonstrict(e6, t2, r2) {
    var n2 = this.strict;
    if ("function" == typeof n2 && (n2 = n2(e6, t2, r2)), n2 && "ignore" !== n2) {
      if (true === n2 || "error" === n2) throw new io("LaTeX-incompatible input and strict mode is set to 'error': " + t2 + " [" + e6 + "]", r2);
      "warn" === n2 ? "undefined" != typeof console && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + t2 + " [" + e6 + "]") : "undefined" != typeof console && console.warn("LaTeX-incompatible input and strict mode is set to unrecognized '" + n2 + "': " + t2 + " [" + e6 + "]");
    }
  }
  useStrictBehavior(e6, t2, r2) {
    var n2 = this.strict;
    if ("function" == typeof n2) try {
      n2 = n2(e6, t2, r2);
    } catch (e7) {
      n2 = "error";
    }
    return !(!n2 || "ignore" === n2) && (true === n2 || "error" === n2 || ("warn" === n2 ? ("undefined" != typeof console && console.warn("LaTeX-incompatible input and strict mode is set to 'warn': " + t2 + " [" + e6 + "]"), false) : ("undefined" != typeof console && console.warn("LaTeX-incompatible input and strict mode is set to unrecognized '" + n2 + "': " + t2 + " [" + e6 + "]"), false)));
  }
  isTrusted(e6) {
    e6.url && !e6.protocol && (e6.protocol = uo.protocolFromUrl(e6.url));
    var t2 = "function" == typeof this.trust ? this.trust(e6) : this.trust;
    return Boolean(t2);
  }
}
class ho {
  constructor(e6, t2, r2) {
    this.id = void 0, this.size = void 0, this.cramped = void 0, this.id = e6, this.size = t2, this.cramped = r2;
  }
  sup() {
    return po[mo[this.id]];
  }
  sub() {
    return po[go[this.id]];
  }
  fracNum() {
    return po[fo[this.id]];
  }
  fracDen() {
    return po[bo[this.id]];
  }
  cramp() {
    return po[yo[this.id]];
  }
  text() {
    return po[vo[this.id]];
  }
  isTight() {
    return this.size >= 2;
  }
}
var po = [new ho(0, 0, false), new ho(1, 0, true), new ho(2, 1, false), new ho(3, 1, true), new ho(4, 2, false), new ho(5, 2, true), new ho(6, 3, false), new ho(7, 3, true)], mo = [4, 5, 4, 5, 6, 7, 6, 7], go = [5, 5, 5, 5, 7, 7, 7, 7], fo = [2, 3, 4, 5, 6, 7, 6, 7], bo = [3, 3, 5, 5, 7, 7, 7, 7], yo = [1, 1, 3, 3, 5, 5, 7, 7], vo = [0, 1, 2, 3, 2, 3, 2, 3], xo = { DISPLAY: po[0], TEXT: po[2], SCRIPT: po[4], SCRIPTSCRIPT: po[6] }, wo = [{ name: "latin", blocks: [[256, 591], [768, 879]] }, { name: "cyrillic", blocks: [[1024, 1279]] }, { name: "armenian", blocks: [[1328, 1423]] }, { name: "brahmic", blocks: [[2304, 4255]] }, { name: "georgian", blocks: [[4256, 4351]] }, { name: "cjk", blocks: [[12288, 12543], [19968, 40879], [65280, 65376]] }, { name: "hangul", blocks: [[44032, 55215]] }];
var ko = [];
function Ao(e6) {
  for (var t2 = 0; t2 < ko.length; t2 += 2) if (e6 >= ko[t2] && e6 <= ko[t2 + 1]) return true;
  return false;
}
wo.forEach(((e6) => e6.blocks.forEach(((e7) => ko.push(...e7)))));
var _o = 80, So = { doubleleftarrow: "M262 157\nl10-10c34-36 62.7-77 86-123 3.3-8 5-13.3 5-16 0-5.3-6.7-8-20-8-7.3\n 0-12.2.5-14.5 1.5-2.3 1-4.8 4.5-7.5 10.5-49.3 97.3-121.7 169.3-217 216-28\n 14-57.3 25-88 33-6.7 2-11 3.8-13 5.5-2 1.7-3 4.2-3 7.5s1 5.8 3 7.5\nc2 1.7 6.3 3.5 13 5.5 68 17.3 128.2 47.8 180.5 91.5 52.3 43.7 93.8 96.2 124.5\n 157.5 9.3 8 15.3 12.3 18 13h6c12-.7 18-4 18-10 0-2-1.7-7-5-15-23.3-46-52-87\n-86-123l-10-10h399738v-40H218c328 0 0 0 0 0l-10-8c-26.7-20-65.7-43-117-69 2.7\n-2 6-3.7 10-5 36.7-16 72.3-37.3 107-64l10-8h399782v-40z\nm8 0v40h399730v-40zm0 194v40h399730v-40z", doublerightarrow: "M399738 392l\n-10 10c-34 36-62.7 77-86 123-3.3 8-5 13.3-5 16 0 5.3 6.7 8 20 8 7.3 0 12.2-.5\n 14.5-1.5 2.3-1 4.8-4.5 7.5-10.5 49.3-97.3 121.7-169.3 217-216 28-14 57.3-25 88\n-33 6.7-2 11-3.8 13-5.5 2-1.7 3-4.2 3-7.5s-1-5.8-3-7.5c-2-1.7-6.3-3.5-13-5.5-68\n-17.3-128.2-47.8-180.5-91.5-52.3-43.7-93.8-96.2-124.5-157.5-9.3-8-15.3-12.3-18\n-13h-6c-12 .7-18 4-18 10 0 2 1.7 7 5 15 23.3 46 52 87 86 123l10 10H0v40h399782\nc-328 0 0 0 0 0l10 8c26.7 20 65.7 43 117 69-2.7 2-6 3.7-10 5-36.7 16-72.3 37.3\n-107 64l-10 8H0v40zM0 157v40h399730v-40zm0 194v40h399730v-40z", leftarrow: "M400000 241H110l3-3c68.7-52.7 113.7-120\n 135-202 4-14.7 6-23 6-25 0-7.3-7-11-21-11-8 0-13.2.8-15.5 2.5-2.3 1.7-4.2 5.8\n-5.5 12.5-1.3 4.7-2.7 10.3-4 17-12 48.7-34.8 92-68.5 130S65.3 228.3 18 247\nc-10 4-16 7.7-18 11 0 8.7 6 14.3 18 17 47.3 18.7 87.8 47 121.5 85S196 441.3 208\n 490c.7 2 1.3 5 2 9s1.2 6.7 1.5 8c.3 1.3 1 3.3 2 6s2.2 4.5 3.5 5.5c1.3 1 3.3\n 1.8 6 2.5s6 1 10 1c14 0 21-3.7 21-11 0-2-2-10.3-6-25-20-79.3-65-146.7-135-202\n l-3-3h399890zM100 241v40h399900v-40z", leftbrace: "M6 548l-6-6v-35l6-11c56-104 135.3-181.3 238-232 57.3-28.7 117\n-45 179-50h399577v120H403c-43.3 7-81 15-113 26-100.7 33-179.7 91-237 174-2.7\n 5-6 9-10 13-.7 1-7.3 1-20 1H6z", leftbraceunder: "M0 6l6-6h17c12.688 0 19.313.3 20 1 4 4 7.313 8.3 10 13\n 35.313 51.3 80.813 93.8 136.5 127.5 55.688 33.7 117.188 55.8 184.5 66.5.688\n 0 2 .3 4 1 18.688 2.7 76 4.3 172 5h399450v120H429l-6-1c-124.688-8-235-61.7\n-331-161C60.687 138.7 32.312 99.3 7 54L0 41V6z", leftgroup: "M400000 80\nH435C64 80 168.3 229.4 21 260c-5.9 1.2-18 0-18 0-2 0-3-1-3-3v-38C76 61 257 0\n 435 0h399565z", leftgroupunder: "M400000 262\nH435C64 262 168.3 112.6 21 82c-5.9-1.2-18 0-18 0-2 0-3 1-3 3v38c76 158 257 219\n 435 219h399565z", leftharpoon: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3\n-3.3 10.2-9.5 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5\n-18.3 3-21-1.3-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7\n-196 228-6.7 4.7-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40z", leftharpoonplus: "M0 267c.7 5.3 3 10 7 14h399993v-40H93c3.3-3.3 10.2-9.5\n 20.5-18.5s17.8-15.8 22.5-20.5c50.7-52 88-110.3 112-175 4-11.3 5-18.3 3-21-1.3\n-4-7.3-6-18-6-8 0-13 .7-15 2s-4.7 6.7-8 16c-42 98.7-107.3 174.7-196 228-6.7 4.7\n-10.7 8-12 10-1.3 2-2 5.7-2 11zm100-26v40h399900v-40zM0 435v40h400000v-40z\nm0 0v40h400000v-40z", leftharpoondown: "M7 241c-4 4-6.333 8.667-7 14 0 5.333.667 9 2 11s5.333\n 5.333 12 10c90.667 54 156 130 196 228 3.333 10.667 6.333 16.333 9 17 2 .667 5\n 1 9 1h5c10.667 0 16.667-2 18-6 2-2.667 1-9.667-3-21-32-87.333-82.667-157.667\n-152-211l-3-3h399907v-40zM93 281 H400000 v-40L7 241z", leftharpoondownplus: "M7 435c-4 4-6.3 8.7-7 14 0 5.3.7 9 2 11s5.3 5.3 12\n 10c90.7 54 156 130 196 228 3.3 10.7 6.3 16.3 9 17 2 .7 5 1 9 1h5c10.7 0 16.7\n-2 18-6 2-2.7 1-9.7-3-21-32-87.3-82.7-157.7-152-211l-3-3h399907v-40H7zm93 0\nv40h399900v-40zM0 241v40h399900v-40zm0 0v40h399900v-40z", lefthook: "M400000 281 H103s-33-11.2-61-33.5S0 197.3 0 164s14.2-61.2 42.5\n-83.5C70.8 58.2 104 47 142 47 c16.7 0 25 6.7 25 20 0 12-8.7 18.7-26 20-40 3.3\n-68.7 15.7-86 37-10 12-15 25.3-15 40 0 22.7 9.8 40.7 29.5 54 19.7 13.3 43.5 21\n 71.5 23h399859zM103 281v-40h399897v40z", leftlinesegment: "M40 281 V428 H0 V94 H40 V241 H400000 v40z\nM40 281 V428 H0 V94 H40 V241 H400000 v40z", leftmapsto: "M40 281 V448H0V74H40V241H400000v40z\nM40 281 V448H0V74H40V241H400000v40z", leftToFrom: "M0 147h400000v40H0zm0 214c68 40 115.7 95.7 143 167h22c15.3 0 23\n-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69-70-101l-7-8h399905v-40H95l7-8\nc28.7-32 52-65.7 70-101 10.7-23.3 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 265.3\n 68 321 0 361zm0-174v-40h399900v40zm100 154v40h399900v-40z", longequal: "M0 50 h400000 v40H0z m0 194h40000v40H0z\nM0 50 h400000 v40H0z m0 194h40000v40H0z", midbrace: "M200428 334\nc-100.7-8.3-195.3-44-280-108-55.3-42-101.7-93-139-153l-9-14c-2.7 4-5.7 8.7-9 14\n-53.3 86.7-123.7 153-211 199-66.7 36-137.3 56.3-212 62H0V214h199568c178.3-11.7\n 311.7-78.3 403-201 6-8 9.7-12 11-12 .7-.7 6.7-1 18-1s17.3.3 18 1c1.3 0 5 4 11\n 12 44.7 59.3 101.3 106.3 170 141s145.3 54.3 229 60h199572v120z", midbraceunder: "M199572 214\nc100.7 8.3 195.3 44 280 108 55.3 42 101.7 93 139 153l9 14c2.7-4 5.7-8.7 9-14\n 53.3-86.7 123.7-153 211-199 66.7-36 137.3-56.3 212-62h199568v120H200432c-178.3\n 11.7-311.7 78.3-403 201-6 8-9.7 12-11 12-.7.7-6.7 1-18 1s-17.3-.3-18-1c-1.3 0\n-5-4-11-12-44.7-59.3-101.3-106.3-170-141s-145.3-54.3-229-60H0V214z", oiintSize1: "M512.6 71.6c272.6 0 320.3 106.8 320.3 178.2 0 70.8-47.7 177.6\n-320.3 177.6S193.1 320.6 193.1 249.8c0-71.4 46.9-178.2 319.5-178.2z\nm368.1 178.2c0-86.4-60.9-215.4-368.1-215.4-306.4 0-367.3 129-367.3 215.4 0 85.8\n60.9 214.8 367.3 214.8 307.2 0 368.1-129 368.1-214.8z", oiintSize2: "M757.8 100.1c384.7 0 451.1 137.6 451.1 230 0 91.3-66.4 228.8\n-451.1 228.8-386.3 0-452.7-137.5-452.7-228.8 0-92.4 66.4-230 452.7-230z\nm502.4 230c0-111.2-82.4-277.2-502.4-277.2s-504 166-504 277.2\nc0 110 84 276 504 276s502.4-166 502.4-276z", oiiintSize1: "M681.4 71.6c408.9 0 480.5 106.8 480.5 178.2 0 70.8-71.6 177.6\n-480.5 177.6S202.1 320.6 202.1 249.8c0-71.4 70.5-178.2 479.3-178.2z\nm525.8 178.2c0-86.4-86.8-215.4-525.7-215.4-437.9 0-524.7 129-524.7 215.4 0\n85.8 86.8 214.8 524.7 214.8 438.9 0 525.7-129 525.7-214.8z", oiiintSize2: "M1021.2 53c603.6 0 707.8 165.8 707.8 277.2 0 110-104.2 275.8\n-707.8 275.8-606 0-710.2-165.8-710.2-275.8C311 218.8 415.2 53 1021.2 53z\nm770.4 277.1c0-131.2-126.4-327.6-770.5-327.6S248.4 198.9 248.4 330.1\nc0 130 128.8 326.4 772.7 326.4s770.5-196.4 770.5-326.4z", rightarrow: "M0 241v40h399891c-47.3 35.3-84 78-110 128\n-16.7 32-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20\n 11 8 0 13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7\n 39-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85\n-40.5-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n 151.7 139 205zm0 0v40h399900v-40z", rightbrace: "M400000 542l\n-6 6h-17c-12.7 0-19.3-.3-20-1-4-4-7.3-8.3-10-13-35.3-51.3-80.8-93.8-136.5-127.5\ns-117.2-55.8-184.5-66.5c-.7 0-2-.3-4-1-18.7-2.7-76-4.3-172-5H0V214h399571l6 1\nc124.7 8 235 61.7 331 161 31.3 33.3 59.7 72.7 85 118l7 13v35z", rightbraceunder: "M399994 0l6 6v35l-6 11c-56 104-135.3 181.3-238 232-57.3\n 28.7-117 45-179 50H-300V214h399897c43.3-7 81-15 113-26 100.7-33 179.7-91 237\n-174 2.7-5 6-9 10-13 .7-1 7.3-1 20-1h17z", rightgroup: "M0 80h399565c371 0 266.7 149.4 414 180 5.9 1.2 18 0 18 0 2 0\n 3-1 3-3v-38c-76-158-257-219-435-219H0z", rightgroupunder: "M0 262h399565c371 0 266.7-149.4 414-180 5.9-1.2 18 0 18\n 0 2 0 3 1 3 3v38c-76 158-257 219-435 219H0z", rightharpoon: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3\n-3.7-15.3-11-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2\n-10.7 0-16.7 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58\n 69.2 92 94.5zm0 0v40h399900v-40z", rightharpoonplus: "M0 241v40h399993c4.7-4.7 7-9.3 7-14 0-9.3-3.7-15.3-11\n-18-92.7-56.7-159-133.7-199-231-3.3-9.3-6-14.7-8-16-2-1.3-7-2-15-2-10.7 0-16.7\n 2-18 6-2 2.7-1 9.7 3 21 15.3 42 36.7 81.8 64 119.5 27.3 37.7 58 69.2 92 94.5z\nm0 0v40h399900v-40z m100 194v40h399900v-40zm0 0v40h399900v-40z", rightharpoondown: "M399747 511c0 7.3 6.7 11 20 11 8 0 13-.8 15-2.5s4.7-6.8\n 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3 8.5-5.8 9.5\n-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3-64.7 57-92 95\n-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 241v40h399900v-40z", rightharpoondownplus: "M399747 705c0 7.3 6.7 11 20 11 8 0 13-.8\n 15-2.5s4.7-6.8 8-15.5c40-94 99.3-166.3 178-217 13.3-8 20.3-12.3 21-13 5.3-3.3\n 8.5-5.8 9.5-7.5 1-1.7 1.5-5.2 1.5-10.5s-2.3-10.3-7-15H0v40h399908c-34 25.3\n-64.7 57-92 95-27.3 38-48.7 77.7-64 119-3.3 8.7-5 14-5 16zM0 435v40h399900v-40z\nm0-194v40h400000v-40zm0 0v40h400000v-40z", righthook: "M399859 241c-764 0 0 0 0 0 40-3.3 68.7-15.7 86-37 10-12 15-25.3\n 15-40 0-22.7-9.8-40.7-29.5-54-19.7-13.3-43.5-21-71.5-23-17.3-1.3-26-8-26-20 0\n-13.3 8.7-20 26-20 38 0 71 11.2 99 33.5 0 0 7 5.6 21 16.7 14 11.2 21 33.5 21\n 66.8s-14 61.2-42 83.5c-28 22.3-61 33.5-99 33.5L0 241z M0 281v-40h399859v40z", rightlinesegment: "M399960 241 V94 h40 V428 h-40 V281 H0 v-40z\nM399960 241 V94 h40 V428 h-40 V281 H0 v-40z", rightToFrom: "M400000 167c-70.7-42-118-97.7-142-167h-23c-15.3 0-23 .3-23\n 1 0 1.3 5.3 13.7 16 37 18 35.3 41.3 69 70 101l7 8H0v40h399905l-7 8c-28.7 32\n-52 65.7-70 101-10.7 23.3-16 35.7-16 37 0 .7 7.7 1 23 1h23c24-69.3 71.3-125 142\n-167z M100 147v40h399900v-40zM0 341v40h399900v-40z", twoheadleftarrow: "M0 167c68 40\n 115.7 95.7 143 167h22c15.3 0 23-.3 23-1 0-1.3-5.3-13.7-16-37-18-35.3-41.3-69\n-70-101l-7-8h125l9 7c50.7 39.3 85 86 103 140h46c0-4.7-6.3-18.7-19-42-18-35.3\n-40-67.3-66-96l-9-9h399716v-40H284l9-9c26-28.7 48-60.7 66-96 12.7-23.333 19\n-37.333 19-42h-46c-18 54-52.3 100.7-103 140l-9 7H95l7-8c28.7-32 52-65.7 70-101\n 10.7-23.333 16-35.7 16-37 0-.7-7.7-1-23-1h-22C115.7 71.3 68 127 0 167z", twoheadrightarrow: "M400000 167\nc-68-40-115.7-95.7-143-167h-22c-15.3 0-23 .3-23 1 0 1.3 5.3 13.7 16 37 18 35.3\n 41.3 69 70 101l7 8h-125l-9-7c-50.7-39.3-85-86-103-140h-46c0 4.7 6.3 18.7 19 42\n 18 35.3 40 67.3 66 96l9 9H0v40h399716l-9 9c-26 28.7-48 60.7-66 96-12.7 23.333\n-19 37.333-19 42h46c18-54 52.3-100.7 103-140l9-7h125l-7 8c-28.7 32-52 65.7-70\n 101-10.7 23.333-16 35.7-16 37 0 .7 7.7 1 23 1h22c27.3-71.3 75-127 143-167z", tilde1: "M200 55.538c-77 0-168 73.953-177 73.953-3 0-7\n-2.175-9-5.437L2 97c-1-2-2-4-2-6 0-4 2-7 5-9l20-12C116 12 171 0 207 0c86 0\n 114 68 191 68 78 0 168-68 177-68 4 0 7 2 9 5l12 19c1 2.175 2 4.35 2 6.525 0\n 4.35-2 7.613-5 9.788l-19 13.05c-92 63.077-116.937 75.308-183 76.128\n-68.267.847-113-73.952-191-73.952z", tilde2: "M344 55.266c-142 0-300.638 81.316-311.5 86.418\n-8.01 3.762-22.5 10.91-23.5 5.562L1 120c-1-2-1-3-1-4 0-5 3-9 8-10l18.4-9C160.9\n 31.9 283 0 358 0c148 0 188 122 331 122s314-97 326-97c4 0 8 2 10 7l7 21.114\nc1 2.14 1 3.21 1 4.28 0 5.347-3 9.626-7 10.696l-22.3 12.622C852.6 158.372 751\n 181.476 676 181.476c-149 0-189-126.21-332-126.21z", tilde3: "M786 59C457 59 32 175.242 13 175.242c-6 0-10-3.457\n-11-10.37L.15 138c-1-7 3-12 10-13l19.2-6.4C378.4 40.7 634.3 0 804.3 0c337 0\n 411.8 157 746.8 157 328 0 754-112 773-112 5 0 10 3 11 9l1 14.075c1 8.066-.697\n 16.595-6.697 17.492l-21.052 7.31c-367.9 98.146-609.15 122.696-778.15 122.696\n -338 0-409-156.573-744-156.573z", tilde4: "M786 58C457 58 32 177.487 13 177.487c-6 0-10-3.345\n-11-10.035L.15 143c-1-7 3-12 10-13l22-6.7C381.2 35 637.15 0 807.15 0c337 0 409\n 177 744 177 328 0 754-127 773-127 5 0 10 3 11 9l1 14.794c1 7.805-3 13.38-9\n 14.495l-20.7 5.574c-366.85 99.79-607.3 139.372-776.3 139.372-338 0-409\n -175.236-744-175.236z", vec: "M377 20c0-5.333 1.833-10 5.5-14S391 0 397 0c4.667 0 8.667 1.667 12 5\n3.333 2.667 6.667 9 10 19 6.667 24.667 20.333 43.667 41 57 7.333 4.667 11\n10.667 11 18 0 6-1 10-3 12s-6.667 5-14 9c-28.667 14.667-53.667 35.667-75 63\n-1.333 1.333-3.167 3.5-5.5 6.5s-4 4.833-5 5.5c-1 .667-2.5 1.333-4.5 2s-4.333 1\n-7 1c-4.667 0-9.167-1.833-13.5-5.5S337 184 337 178c0-12.667 15.667-32.333 47-59\nH213l-171-1c-8.667-6-13-12.333-13-19 0-4.667 4.333-11.333 13-20h359\nc-16-25.333-24-45-24-59z", widehat1: "M529 0h5l519 115c5 1 9 5 9 10 0 1-1 2-1 3l-4 22\nc-1 5-5 9-11 9h-2L532 67 19 159h-2c-5 0-9-4-11-9l-5-22c-1-6 2-12 8-13z", widehat2: "M1181 0h2l1171 176c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 220h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z", widehat3: "M1181 0h2l1171 236c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 280h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z", widehat4: "M1181 0h2l1171 296c6 0 10 5 10 11l-2 23c-1 6-5 10\n-11 10h-1L1182 67 15 340h-1c-6 0-10-4-11-10l-2-23c-1-6 4-11 10-11z", widecheck1: "M529,159h5l519,-115c5,-1,9,-5,9,-10c0,-1,-1,-2,-1,-3l-4,-22c-1,\n-5,-5,-9,-11,-9h-2l-512,92l-513,-92h-2c-5,0,-9,4,-11,9l-5,22c-1,6,2,12,8,13z", widecheck2: "M1181,220h2l1171,-176c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,153l-1167,-153h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z", widecheck3: "M1181,280h2l1171,-236c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,213l-1167,-213h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z", widecheck4: "M1181,340h2l1171,-296c6,0,10,-5,10,-11l-2,-23c-1,-6,-5,-10,\n-11,-10h-1l-1168,273l-1167,-273h-1c-6,0,-10,4,-11,10l-2,23c-1,6,4,11,10,11z", baraboveleftarrow: "M400000 620h-399890l3 -3c68.7 -52.7 113.7 -120 135 -202\nc4 -14.7 6 -23 6 -25c0 -7.3 -7 -11 -21 -11c-8 0 -13.2 0.8 -15.5 2.5\nc-2.3 1.7 -4.2 5.8 -5.5 12.5c-1.3 4.7 -2.7 10.3 -4 17c-12 48.7 -34.8 92 -68.5 130\ns-74.2 66.3 -121.5 85c-10 4 -16 7.7 -18 11c0 8.7 6 14.3 18 17c47.3 18.7 87.8 47\n121.5 85s56.5 81.3 68.5 130c0.7 2 1.3 5 2 9s1.2 6.7 1.5 8c0.3 1.3 1 3.3 2 6\ns2.2 4.5 3.5 5.5c1.3 1 3.3 1.8 6 2.5s6 1 10 1c14 0 21 -3.7 21 -11\nc0 -2 -2 -10.3 -6 -25c-20 -79.3 -65 -146.7 -135 -202l-3 -3h399890z\nM100 620v40h399900v-40z M0 241v40h399900v-40zM0 241v40h399900v-40z", rightarrowabovebar: "M0 241v40h399891c-47.3 35.3-84 78-110 128-16.7 32\n-27.7 63.7-33 95 0 1.3-.2 2.7-.5 4-.3 1.3-.5 2.3-.5 3 0 7.3 6.7 11 20 11 8 0\n13.2-.8 15.5-2.5 2.3-1.7 4.2-5.5 5.5-11.5 2-13.3 5.7-27 11-41 14.7-44.7 39\n-84.5 73-119.5s73.7-60.2 119-75.5c6-2 9-5.7 9-11s-3-9-9-11c-45.3-15.3-85-40.5\n-119-75.5s-58.3-74.8-73-119.5c-4.7-14-8.3-27.3-11-40-1.3-6.7-3.2-10.8-5.5\n-12.5-2.3-1.7-7.5-2.5-15.5-2.5-14 0-21 3.7-21 11 0 2 2 10.3 6 25 20.7 83.3 67\n151.7 139 205zm96 379h399894v40H0zm0 0h399904v40H0z", baraboveshortleftharpoon: "M507,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17\nc2,0.7,5,1,9,1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21\nc-32,-87.3,-82.7,-157.7,-152,-211c0,0,-3,-3,-3,-3l399351,0l0,-40\nc-398570,0,-399437,0,-399437,0z M593 435 v40 H399500 v-40z\nM0 281 v-40 H399908 v40z M0 281 v-40 H399908 v40z", rightharpoonaboveshortbar: "M0,241 l0,40c399126,0,399993,0,399993,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM0 241 v40 H399908 v-40z M0 475 v-40 H399500 v40z M0 475 v-40 H399500 v40z", shortbaraboveleftharpoon: "M7,435c-4,4,-6.3,8.7,-7,14c0,5.3,0.7,9,2,11\nc1.3,2,5.3,5.3,12,10c90.7,54,156,130,196,228c3.3,10.7,6.3,16.3,9,17c2,0.7,5,1,9,\n1c0,0,5,0,5,0c10.7,0,16.7,-2,18,-6c2,-2.7,1,-9.7,-3,-21c-32,-87.3,-82.7,-157.7,\n-152,-211c0,0,-3,-3,-3,-3l399907,0l0,-40c-399126,0,-399993,0,-399993,0z\nM93 435 v40 H400000 v-40z M500 241 v40 H400000 v-40z M500 241 v40 H400000 v-40z", shortrightharpoonabovebar: "M53,241l0,40c398570,0,399437,0,399437,0\nc4.7,-4.7,7,-9.3,7,-14c0,-9.3,-3.7,-15.3,-11,-18c-92.7,-56.7,-159,-133.7,-199,\n-231c-3.3,-9.3,-6,-14.7,-8,-16c-2,-1.3,-7,-2,-15,-2c-10.7,0,-16.7,2,-18,6\nc-2,2.7,-1,9.7,3,21c15.3,42,36.7,81.8,64,119.5c27.3,37.7,58,69.2,92,94.5z\nM500 241 v40 H399408 v-40z M500 435 v40 H400000 v-40z" };
class qo {
  constructor(e6) {
    this.children = void 0, this.classes = void 0, this.height = void 0, this.depth = void 0, this.maxFontSize = void 0, this.style = void 0, this.children = e6, this.classes = [], this.height = 0, this.depth = 0, this.maxFontSize = 0, this.style = {};
  }
  hasClass(e6) {
    return uo.contains(this.classes, e6);
  }
  toNode() {
    for (var e6 = document.createDocumentFragment(), t2 = 0; t2 < this.children.length; t2++) e6.appendChild(this.children[t2].toNode());
    return e6;
  }
  toMarkup() {
    for (var e6 = "", t2 = 0; t2 < this.children.length; t2++) e6 += this.children[t2].toMarkup();
    return e6;
  }
  toText() {
    return this.children.map(((e6) => e6.toText())).join("");
  }
}
var Co = function(e6) {
  return e6.filter(((e7) => e7)).join(" ");
}, zo = function(e6, t2, r2) {
  if (this.classes = e6 || [], this.attributes = {}, this.height = 0, this.depth = 0, this.maxFontSize = 0, this.style = r2 || {}, t2) {
    t2.style.isTight() && this.classes.push("mtight");
    var n2 = t2.getColor();
    n2 && (this.style.color = n2);
  }
}, To = function(e6) {
  var t2 = document.createElement(e6);
  for (var r2 in t2.className = Co(this.classes), this.style) this.style.hasOwnProperty(r2) && (t2.style[r2] = this.style[r2]);
  for (var n2 in this.attributes) this.attributes.hasOwnProperty(n2) && t2.setAttribute(n2, this.attributes[n2]);
  for (var i2 = 0; i2 < this.children.length; i2++) t2.appendChild(this.children[i2].toNode());
  return t2;
}, Mo = function(e6) {
  var t2 = "<" + e6;
  this.classes.length && (t2 += ' class="' + uo.escape(Co(this.classes)) + '"');
  var r2 = "";
  for (var n2 in this.style) this.style.hasOwnProperty(n2) && (r2 += uo.hyphenate(n2) + ":" + this.style[n2] + ";");
  for (var i2 in r2 && (t2 += ' style="' + uo.escape(r2) + '"'), this.attributes) this.attributes.hasOwnProperty(i2) && (t2 += " " + i2 + '="' + uo.escape(this.attributes[i2]) + '"');
  t2 += ">";
  for (var o2 = 0; o2 < this.children.length; o2++) t2 += this.children[o2].toMarkup();
  return t2 += "</" + e6 + ">";
};
class Eo {
  constructor(e6, t2, r2, n2) {
    this.children = void 0, this.attributes = void 0, this.classes = void 0, this.height = void 0, this.depth = void 0, this.width = void 0, this.maxFontSize = void 0, this.style = void 0, zo.call(this, e6, r2, n2), this.children = t2 || [];
  }
  setAttribute(e6, t2) {
    this.attributes[e6] = t2;
  }
  hasClass(e6) {
    return uo.contains(this.classes, e6);
  }
  toNode() {
    return To.call(this, "span");
  }
  toMarkup() {
    return Mo.call(this, "span");
  }
}
class Do {
  constructor(e6, t2, r2, n2) {
    this.children = void 0, this.attributes = void 0, this.classes = void 0, this.height = void 0, this.depth = void 0, this.maxFontSize = void 0, this.style = void 0, zo.call(this, t2, n2), this.children = r2 || [], this.setAttribute("href", e6);
  }
  setAttribute(e6, t2) {
    this.attributes[e6] = t2;
  }
  hasClass(e6) {
    return uo.contains(this.classes, e6);
  }
  toNode() {
    return To.call(this, "a");
  }
  toMarkup() {
    return Mo.call(this, "a");
  }
}
class Lo {
  constructor(e6, t2, r2) {
    this.src = void 0, this.alt = void 0, this.classes = void 0, this.height = void 0, this.depth = void 0, this.maxFontSize = void 0, this.style = void 0, this.alt = t2, this.src = e6, this.classes = ["mord"], this.style = r2;
  }
  hasClass(e6) {
    return uo.contains(this.classes, e6);
  }
  toNode() {
    var e6 = document.createElement("img");
    for (var t2 in e6.src = this.src, e6.alt = this.alt, e6.className = "mord", this.style) this.style.hasOwnProperty(t2) && (e6.style[t2] = this.style[t2]);
    return e6;
  }
  toMarkup() {
    var e6 = "<img  src='" + this.src + " 'alt='" + this.alt + "' ", t2 = "";
    for (var r2 in this.style) this.style.hasOwnProperty(r2) && (t2 += uo.hyphenate(r2) + ":" + this.style[r2] + ";");
    return t2 && (e6 += ' style="' + uo.escape(t2) + '"'), e6 += "'/>";
  }
}
var Bo = { "î": "ı̂", "ï": "ı̈", "í": "ı́", "ì": "ı̀" };
class No {
  constructor(e6, t2, r2, n2, i2, o2, a2, s2) {
    this.text = void 0, this.height = void 0, this.depth = void 0, this.italic = void 0, this.skew = void 0, this.width = void 0, this.maxFontSize = void 0, this.classes = void 0, this.style = void 0, this.text = e6, this.height = t2 || 0, this.depth = r2 || 0, this.italic = n2 || 0, this.skew = i2 || 0, this.width = o2 || 0, this.classes = a2 || [], this.style = s2 || {}, this.maxFontSize = 0;
    var l2 = (function(e7) {
      for (var t3 = 0; t3 < wo.length; t3++) for (var r3 = wo[t3], n3 = 0; n3 < r3.blocks.length; n3++) {
        var i3 = r3.blocks[n3];
        if (e7 >= i3[0] && e7 <= i3[1]) return r3.name;
      }
      return null;
    })(this.text.charCodeAt(0));
    l2 && this.classes.push(l2 + "_fallback"), /[îïíì]/.test(this.text) && (this.text = Bo[this.text]);
  }
  hasClass(e6) {
    return uo.contains(this.classes, e6);
  }
  toNode() {
    var e6 = document.createTextNode(this.text), t2 = null;
    for (var r2 in this.italic > 0 && ((t2 = document.createElement("span")).style.marginRight = this.italic + "em"), this.classes.length > 0 && ((t2 = t2 || document.createElement("span")).className = Co(this.classes)), this.style) this.style.hasOwnProperty(r2) && ((t2 = t2 || document.createElement("span")).style[r2] = this.style[r2]);
    return t2 ? (t2.appendChild(e6), t2) : e6;
  }
  toMarkup() {
    var e6 = false, t2 = "<span";
    this.classes.length && (e6 = true, t2 += ' class="', t2 += uo.escape(Co(this.classes)), t2 += '"');
    var r2 = "";
    for (var n2 in this.italic > 0 && (r2 += "margin-right:" + this.italic + "em;"), this.style) this.style.hasOwnProperty(n2) && (r2 += uo.hyphenate(n2) + ":" + this.style[n2] + ";");
    r2 && (e6 = true, t2 += ' style="' + uo.escape(r2) + '"');
    var i2 = uo.escape(this.text);
    return e6 ? (t2 += ">", t2 += i2, t2 += "</span>") : i2;
  }
}
class Oo {
  constructor(e6, t2) {
    this.children = void 0, this.attributes = void 0, this.children = e6 || [], this.attributes = t2 || {};
  }
  toNode() {
    var e6 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    for (var t2 in this.attributes) Object.prototype.hasOwnProperty.call(this.attributes, t2) && e6.setAttribute(t2, this.attributes[t2]);
    for (var r2 = 0; r2 < this.children.length; r2++) e6.appendChild(this.children[r2].toNode());
    return e6;
  }
  toMarkup() {
    var e6 = '<svg xmlns="http://www.w3.org/2000/svg"';
    for (var t2 in this.attributes) Object.prototype.hasOwnProperty.call(this.attributes, t2) && (e6 += " " + t2 + "='" + this.attributes[t2] + "'");
    e6 += ">";
    for (var r2 = 0; r2 < this.children.length; r2++) e6 += this.children[r2].toMarkup();
    return e6 += "</svg>";
  }
}
class Fo {
  constructor(e6, t2) {
    this.pathName = void 0, this.alternate = void 0, this.pathName = e6, this.alternate = t2;
  }
  toNode() {
    var e6 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    return this.alternate ? e6.setAttribute("d", this.alternate) : e6.setAttribute("d", So[this.pathName]), e6;
  }
  toMarkup() {
    return this.alternate ? "<path d='" + this.alternate + "'/>" : "<path d='" + So[this.pathName] + "'/>";
  }
}
class Ro {
  constructor(e6) {
    this.attributes = void 0, this.attributes = e6 || {};
  }
  toNode() {
    var e6 = document.createElementNS("http://www.w3.org/2000/svg", "line");
    for (var t2 in this.attributes) Object.prototype.hasOwnProperty.call(this.attributes, t2) && e6.setAttribute(t2, this.attributes[t2]);
    return e6;
  }
  toMarkup() {
    var e6 = "<line";
    for (var t2 in this.attributes) Object.prototype.hasOwnProperty.call(this.attributes, t2) && (e6 += " " + t2 + "='" + this.attributes[t2] + "'");
    return e6 += "/>";
  }
}
function Ho(e6) {
  if (e6 instanceof No) return e6;
  throw new Error("Expected symbolNode but got " + String(e6) + ".");
}
var Vo = { "AMS-Regular": { 32: [0, 0, 0, 0, 0.25], 65: [0, 0.68889, 0, 0, 0.72222], 66: [0, 0.68889, 0, 0, 0.66667], 67: [0, 0.68889, 0, 0, 0.72222], 68: [0, 0.68889, 0, 0, 0.72222], 69: [0, 0.68889, 0, 0, 0.66667], 70: [0, 0.68889, 0, 0, 0.61111], 71: [0, 0.68889, 0, 0, 0.77778], 72: [0, 0.68889, 0, 0, 0.77778], 73: [0, 0.68889, 0, 0, 0.38889], 74: [0.16667, 0.68889, 0, 0, 0.5], 75: [0, 0.68889, 0, 0, 0.77778], 76: [0, 0.68889, 0, 0, 0.66667], 77: [0, 0.68889, 0, 0, 0.94445], 78: [0, 0.68889, 0, 0, 0.72222], 79: [0.16667, 0.68889, 0, 0, 0.77778], 80: [0, 0.68889, 0, 0, 0.61111], 81: [0.16667, 0.68889, 0, 0, 0.77778], 82: [0, 0.68889, 0, 0, 0.72222], 83: [0, 0.68889, 0, 0, 0.55556], 84: [0, 0.68889, 0, 0, 0.66667], 85: [0, 0.68889, 0, 0, 0.72222], 86: [0, 0.68889, 0, 0, 0.72222], 87: [0, 0.68889, 0, 0, 1], 88: [0, 0.68889, 0, 0, 0.72222], 89: [0, 0.68889, 0, 0, 0.72222], 90: [0, 0.68889, 0, 0, 0.66667], 107: [0, 0.68889, 0, 0, 0.55556], 160: [0, 0, 0, 0, 0.25], 165: [0, 0.675, 0.025, 0, 0.75], 174: [0.15559, 0.69224, 0, 0, 0.94666], 240: [0, 0.68889, 0, 0, 0.55556], 295: [0, 0.68889, 0, 0, 0.54028], 710: [0, 0.825, 0, 0, 2.33334], 732: [0, 0.9, 0, 0, 2.33334], 770: [0, 0.825, 0, 0, 2.33334], 771: [0, 0.9, 0, 0, 2.33334], 989: [0.08167, 0.58167, 0, 0, 0.77778], 1008: [0, 0.43056, 0.04028, 0, 0.66667], 8245: [0, 0.54986, 0, 0, 0.275], 8463: [0, 0.68889, 0, 0, 0.54028], 8487: [0, 0.68889, 0, 0, 0.72222], 8498: [0, 0.68889, 0, 0, 0.55556], 8502: [0, 0.68889, 0, 0, 0.66667], 8503: [0, 0.68889, 0, 0, 0.44445], 8504: [0, 0.68889, 0, 0, 0.66667], 8513: [0, 0.68889, 0, 0, 0.63889], 8592: [-0.03598, 0.46402, 0, 0, 0.5], 8594: [-0.03598, 0.46402, 0, 0, 0.5], 8602: [-0.13313, 0.36687, 0, 0, 1], 8603: [-0.13313, 0.36687, 0, 0, 1], 8606: [0.01354, 0.52239, 0, 0, 1], 8608: [0.01354, 0.52239, 0, 0, 1], 8610: [0.01354, 0.52239, 0, 0, 1.11111], 8611: [0.01354, 0.52239, 0, 0, 1.11111], 8619: [0, 0.54986, 0, 0, 1], 8620: [0, 0.54986, 0, 0, 1], 8621: [-0.13313, 0.37788, 0, 0, 1.38889], 8622: [-0.13313, 0.36687, 0, 0, 1], 8624: [0, 0.69224, 0, 0, 0.5], 8625: [0, 0.69224, 0, 0, 0.5], 8630: [0, 0.43056, 0, 0, 1], 8631: [0, 0.43056, 0, 0, 1], 8634: [0.08198, 0.58198, 0, 0, 0.77778], 8635: [0.08198, 0.58198, 0, 0, 0.77778], 8638: [0.19444, 0.69224, 0, 0, 0.41667], 8639: [0.19444, 0.69224, 0, 0, 0.41667], 8642: [0.19444, 0.69224, 0, 0, 0.41667], 8643: [0.19444, 0.69224, 0, 0, 0.41667], 8644: [0.1808, 0.675, 0, 0, 1], 8646: [0.1808, 0.675, 0, 0, 1], 8647: [0.1808, 0.675, 0, 0, 1], 8648: [0.19444, 0.69224, 0, 0, 0.83334], 8649: [0.1808, 0.675, 0, 0, 1], 8650: [0.19444, 0.69224, 0, 0, 0.83334], 8651: [0.01354, 0.52239, 0, 0, 1], 8652: [0.01354, 0.52239, 0, 0, 1], 8653: [-0.13313, 0.36687, 0, 0, 1], 8654: [-0.13313, 0.36687, 0, 0, 1], 8655: [-0.13313, 0.36687, 0, 0, 1], 8666: [0.13667, 0.63667, 0, 0, 1], 8667: [0.13667, 0.63667, 0, 0, 1], 8669: [-0.13313, 0.37788, 0, 0, 1], 8672: [-0.064, 0.437, 0, 0, 1.334], 8674: [-0.064, 0.437, 0, 0, 1.334], 8705: [0, 0.825, 0, 0, 0.5], 8708: [0, 0.68889, 0, 0, 0.55556], 8709: [0.08167, 0.58167, 0, 0, 0.77778], 8717: [0, 0.43056, 0, 0, 0.42917], 8722: [-0.03598, 0.46402, 0, 0, 0.5], 8724: [0.08198, 0.69224, 0, 0, 0.77778], 8726: [0.08167, 0.58167, 0, 0, 0.77778], 8733: [0, 0.69224, 0, 0, 0.77778], 8736: [0, 0.69224, 0, 0, 0.72222], 8737: [0, 0.69224, 0, 0, 0.72222], 8738: [0.03517, 0.52239, 0, 0, 0.72222], 8739: [0.08167, 0.58167, 0, 0, 0.22222], 8740: [0.25142, 0.74111, 0, 0, 0.27778], 8741: [0.08167, 0.58167, 0, 0, 0.38889], 8742: [0.25142, 0.74111, 0, 0, 0.5], 8756: [0, 0.69224, 0, 0, 0.66667], 8757: [0, 0.69224, 0, 0, 0.66667], 8764: [-0.13313, 0.36687, 0, 0, 0.77778], 8765: [-0.13313, 0.37788, 0, 0, 0.77778], 8769: [-0.13313, 0.36687, 0, 0, 0.77778], 8770: [-0.03625, 0.46375, 0, 0, 0.77778], 8774: [0.30274, 0.79383, 0, 0, 0.77778], 8776: [-0.01688, 0.48312, 0, 0, 0.77778], 8778: [0.08167, 0.58167, 0, 0, 0.77778], 8782: [0.06062, 0.54986, 0, 0, 0.77778], 8783: [0.06062, 0.54986, 0, 0, 0.77778], 8785: [0.08198, 0.58198, 0, 0, 0.77778], 8786: [0.08198, 0.58198, 0, 0, 0.77778], 8787: [0.08198, 0.58198, 0, 0, 0.77778], 8790: [0, 0.69224, 0, 0, 0.77778], 8791: [0.22958, 0.72958, 0, 0, 0.77778], 8796: [0.08198, 0.91667, 0, 0, 0.77778], 8806: [0.25583, 0.75583, 0, 0, 0.77778], 8807: [0.25583, 0.75583, 0, 0, 0.77778], 8808: [0.25142, 0.75726, 0, 0, 0.77778], 8809: [0.25142, 0.75726, 0, 0, 0.77778], 8812: [0.25583, 0.75583, 0, 0, 0.5], 8814: [0.20576, 0.70576, 0, 0, 0.77778], 8815: [0.20576, 0.70576, 0, 0, 0.77778], 8816: [0.30274, 0.79383, 0, 0, 0.77778], 8817: [0.30274, 0.79383, 0, 0, 0.77778], 8818: [0.22958, 0.72958, 0, 0, 0.77778], 8819: [0.22958, 0.72958, 0, 0, 0.77778], 8822: [0.1808, 0.675, 0, 0, 0.77778], 8823: [0.1808, 0.675, 0, 0, 0.77778], 8828: [0.13667, 0.63667, 0, 0, 0.77778], 8829: [0.13667, 0.63667, 0, 0, 0.77778], 8830: [0.22958, 0.72958, 0, 0, 0.77778], 8831: [0.22958, 0.72958, 0, 0, 0.77778], 8832: [0.20576, 0.70576, 0, 0, 0.77778], 8833: [0.20576, 0.70576, 0, 0, 0.77778], 8840: [0.30274, 0.79383, 0, 0, 0.77778], 8841: [0.30274, 0.79383, 0, 0, 0.77778], 8842: [0.13597, 0.63597, 0, 0, 0.77778], 8843: [0.13597, 0.63597, 0, 0, 0.77778], 8847: [0.03517, 0.54986, 0, 0, 0.77778], 8848: [0.03517, 0.54986, 0, 0, 0.77778], 8858: [0.08198, 0.58198, 0, 0, 0.77778], 8859: [0.08198, 0.58198, 0, 0, 0.77778], 8861: [0.08198, 0.58198, 0, 0, 0.77778], 8862: [0, 0.675, 0, 0, 0.77778], 8863: [0, 0.675, 0, 0, 0.77778], 8864: [0, 0.675, 0, 0, 0.77778], 8865: [0, 0.675, 0, 0, 0.77778], 8872: [0, 0.69224, 0, 0, 0.61111], 8873: [0, 0.69224, 0, 0, 0.72222], 8874: [0, 0.69224, 0, 0, 0.88889], 8876: [0, 0.68889, 0, 0, 0.61111], 8877: [0, 0.68889, 0, 0, 0.61111], 8878: [0, 0.68889, 0, 0, 0.72222], 8879: [0, 0.68889, 0, 0, 0.72222], 8882: [0.03517, 0.54986, 0, 0, 0.77778], 8883: [0.03517, 0.54986, 0, 0, 0.77778], 8884: [0.13667, 0.63667, 0, 0, 0.77778], 8885: [0.13667, 0.63667, 0, 0, 0.77778], 8888: [0, 0.54986, 0, 0, 1.11111], 8890: [0.19444, 0.43056, 0, 0, 0.55556], 8891: [0.19444, 0.69224, 0, 0, 0.61111], 8892: [0.19444, 0.69224, 0, 0, 0.61111], 8901: [0, 0.54986, 0, 0, 0.27778], 8903: [0.08167, 0.58167, 0, 0, 0.77778], 8905: [0.08167, 0.58167, 0, 0, 0.77778], 8906: [0.08167, 0.58167, 0, 0, 0.77778], 8907: [0, 0.69224, 0, 0, 0.77778], 8908: [0, 0.69224, 0, 0, 0.77778], 8909: [-0.03598, 0.46402, 0, 0, 0.77778], 8910: [0, 0.54986, 0, 0, 0.76042], 8911: [0, 0.54986, 0, 0, 0.76042], 8912: [0.03517, 0.54986, 0, 0, 0.77778], 8913: [0.03517, 0.54986, 0, 0, 0.77778], 8914: [0, 0.54986, 0, 0, 0.66667], 8915: [0, 0.54986, 0, 0, 0.66667], 8916: [0, 0.69224, 0, 0, 0.66667], 8918: [0.0391, 0.5391, 0, 0, 0.77778], 8919: [0.0391, 0.5391, 0, 0, 0.77778], 8920: [0.03517, 0.54986, 0, 0, 1.33334], 8921: [0.03517, 0.54986, 0, 0, 1.33334], 8922: [0.38569, 0.88569, 0, 0, 0.77778], 8923: [0.38569, 0.88569, 0, 0, 0.77778], 8926: [0.13667, 0.63667, 0, 0, 0.77778], 8927: [0.13667, 0.63667, 0, 0, 0.77778], 8928: [0.30274, 0.79383, 0, 0, 0.77778], 8929: [0.30274, 0.79383, 0, 0, 0.77778], 8934: [0.23222, 0.74111, 0, 0, 0.77778], 8935: [0.23222, 0.74111, 0, 0, 0.77778], 8936: [0.23222, 0.74111, 0, 0, 0.77778], 8937: [0.23222, 0.74111, 0, 0, 0.77778], 8938: [0.20576, 0.70576, 0, 0, 0.77778], 8939: [0.20576, 0.70576, 0, 0, 0.77778], 8940: [0.30274, 0.79383, 0, 0, 0.77778], 8941: [0.30274, 0.79383, 0, 0, 0.77778], 8994: [0.19444, 0.69224, 0, 0, 0.77778], 8995: [0.19444, 0.69224, 0, 0, 0.77778], 9416: [0.15559, 0.69224, 0, 0, 0.90222], 9484: [0, 0.69224, 0, 0, 0.5], 9488: [0, 0.69224, 0, 0, 0.5], 9492: [0, 0.37788, 0, 0, 0.5], 9496: [0, 0.37788, 0, 0, 0.5], 9585: [0.19444, 0.68889, 0, 0, 0.88889], 9586: [0.19444, 0.74111, 0, 0, 0.88889], 9632: [0, 0.675, 0, 0, 0.77778], 9633: [0, 0.675, 0, 0, 0.77778], 9650: [0, 0.54986, 0, 0, 0.72222], 9651: [0, 0.54986, 0, 0, 0.72222], 9654: [0.03517, 0.54986, 0, 0, 0.77778], 9660: [0, 0.54986, 0, 0, 0.72222], 9661: [0, 0.54986, 0, 0, 0.72222], 9664: [0.03517, 0.54986, 0, 0, 0.77778], 9674: [0.11111, 0.69224, 0, 0, 0.66667], 9733: [0.19444, 0.69224, 0, 0, 0.94445], 10003: [0, 0.69224, 0, 0, 0.83334], 10016: [0, 0.69224, 0, 0, 0.83334], 10731: [0.11111, 0.69224, 0, 0, 0.66667], 10846: [0.19444, 0.75583, 0, 0, 0.61111], 10877: [0.13667, 0.63667, 0, 0, 0.77778], 10878: [0.13667, 0.63667, 0, 0, 0.77778], 10885: [0.25583, 0.75583, 0, 0, 0.77778], 10886: [0.25583, 0.75583, 0, 0, 0.77778], 10887: [0.13597, 0.63597, 0, 0, 0.77778], 10888: [0.13597, 0.63597, 0, 0, 0.77778], 10889: [0.26167, 0.75726, 0, 0, 0.77778], 10890: [0.26167, 0.75726, 0, 0, 0.77778], 10891: [0.48256, 0.98256, 0, 0, 0.77778], 10892: [0.48256, 0.98256, 0, 0, 0.77778], 10901: [0.13667, 0.63667, 0, 0, 0.77778], 10902: [0.13667, 0.63667, 0, 0, 0.77778], 10933: [0.25142, 0.75726, 0, 0, 0.77778], 10934: [0.25142, 0.75726, 0, 0, 0.77778], 10935: [0.26167, 0.75726, 0, 0, 0.77778], 10936: [0.26167, 0.75726, 0, 0, 0.77778], 10937: [0.26167, 0.75726, 0, 0, 0.77778], 10938: [0.26167, 0.75726, 0, 0, 0.77778], 10949: [0.25583, 0.75583, 0, 0, 0.77778], 10950: [0.25583, 0.75583, 0, 0, 0.77778], 10955: [0.28481, 0.79383, 0, 0, 0.77778], 10956: [0.28481, 0.79383, 0, 0, 0.77778], 57350: [0.08167, 0.58167, 0, 0, 0.22222], 57351: [0.08167, 0.58167, 0, 0, 0.38889], 57352: [0.08167, 0.58167, 0, 0, 0.77778], 57353: [0, 0.43056, 0.04028, 0, 0.66667], 57356: [0.25142, 0.75726, 0, 0, 0.77778], 57357: [0.25142, 0.75726, 0, 0, 0.77778], 57358: [0.41951, 0.91951, 0, 0, 0.77778], 57359: [0.30274, 0.79383, 0, 0, 0.77778], 57360: [0.30274, 0.79383, 0, 0, 0.77778], 57361: [0.41951, 0.91951, 0, 0, 0.77778], 57366: [0.25142, 0.75726, 0, 0, 0.77778], 57367: [0.25142, 0.75726, 0, 0, 0.77778], 57368: [0.25142, 0.75726, 0, 0, 0.77778], 57369: [0.25142, 0.75726, 0, 0, 0.77778], 57370: [0.13597, 0.63597, 0, 0, 0.77778], 57371: [0.13597, 0.63597, 0, 0, 0.77778] }, "Caligraphic-Regular": { 32: [0, 0, 0, 0, 0.25], 65: [0, 0.68333, 0, 0.19445, 0.79847], 66: [0, 0.68333, 0.03041, 0.13889, 0.65681], 67: [0, 0.68333, 0.05834, 0.13889, 0.52653], 68: [0, 0.68333, 0.02778, 0.08334, 0.77139], 69: [0, 0.68333, 0.08944, 0.11111, 0.52778], 70: [0, 0.68333, 0.09931, 0.11111, 0.71875], 71: [0.09722, 0.68333, 0.0593, 0.11111, 0.59487], 72: [0, 0.68333, 965e-5, 0.11111, 0.84452], 73: [0, 0.68333, 0.07382, 0, 0.54452], 74: [0.09722, 0.68333, 0.18472, 0.16667, 0.67778], 75: [0, 0.68333, 0.01445, 0.05556, 0.76195], 76: [0, 0.68333, 0, 0.13889, 0.68972], 77: [0, 0.68333, 0, 0.13889, 1.2009], 78: [0, 0.68333, 0.14736, 0.08334, 0.82049], 79: [0, 0.68333, 0.02778, 0.11111, 0.79611], 80: [0, 0.68333, 0.08222, 0.08334, 0.69556], 81: [0.09722, 0.68333, 0, 0.11111, 0.81667], 82: [0, 0.68333, 0, 0.08334, 0.8475], 83: [0, 0.68333, 0.075, 0.13889, 0.60556], 84: [0, 0.68333, 0.25417, 0, 0.54464], 85: [0, 0.68333, 0.09931, 0.08334, 0.62583], 86: [0, 0.68333, 0.08222, 0, 0.61278], 87: [0, 0.68333, 0.08222, 0.08334, 0.98778], 88: [0, 0.68333, 0.14643, 0.13889, 0.7133], 89: [0.09722, 0.68333, 0.08222, 0.08334, 0.66834], 90: [0, 0.68333, 0.07944, 0.13889, 0.72473], 160: [0, 0, 0, 0, 0.25] }, "Fraktur-Regular": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69141, 0, 0, 0.29574], 34: [0, 0.69141, 0, 0, 0.21471], 38: [0, 0.69141, 0, 0, 0.73786], 39: [0, 0.69141, 0, 0, 0.21201], 40: [0.24982, 0.74947, 0, 0, 0.38865], 41: [0.24982, 0.74947, 0, 0, 0.38865], 42: [0, 0.62119, 0, 0, 0.27764], 43: [0.08319, 0.58283, 0, 0, 0.75623], 44: [0, 0.10803, 0, 0, 0.27764], 45: [0.08319, 0.58283, 0, 0, 0.75623], 46: [0, 0.10803, 0, 0, 0.27764], 47: [0.24982, 0.74947, 0, 0, 0.50181], 48: [0, 0.47534, 0, 0, 0.50181], 49: [0, 0.47534, 0, 0, 0.50181], 50: [0, 0.47534, 0, 0, 0.50181], 51: [0.18906, 0.47534, 0, 0, 0.50181], 52: [0.18906, 0.47534, 0, 0, 0.50181], 53: [0.18906, 0.47534, 0, 0, 0.50181], 54: [0, 0.69141, 0, 0, 0.50181], 55: [0.18906, 0.47534, 0, 0, 0.50181], 56: [0, 0.69141, 0, 0, 0.50181], 57: [0.18906, 0.47534, 0, 0, 0.50181], 58: [0, 0.47534, 0, 0, 0.21606], 59: [0.12604, 0.47534, 0, 0, 0.21606], 61: [-0.13099, 0.36866, 0, 0, 0.75623], 63: [0, 0.69141, 0, 0, 0.36245], 65: [0, 0.69141, 0, 0, 0.7176], 66: [0, 0.69141, 0, 0, 0.88397], 67: [0, 0.69141, 0, 0, 0.61254], 68: [0, 0.69141, 0, 0, 0.83158], 69: [0, 0.69141, 0, 0, 0.66278], 70: [0.12604, 0.69141, 0, 0, 0.61119], 71: [0, 0.69141, 0, 0, 0.78539], 72: [0.06302, 0.69141, 0, 0, 0.7203], 73: [0, 0.69141, 0, 0, 0.55448], 74: [0.12604, 0.69141, 0, 0, 0.55231], 75: [0, 0.69141, 0, 0, 0.66845], 76: [0, 0.69141, 0, 0, 0.66602], 77: [0, 0.69141, 0, 0, 1.04953], 78: [0, 0.69141, 0, 0, 0.83212], 79: [0, 0.69141, 0, 0, 0.82699], 80: [0.18906, 0.69141, 0, 0, 0.82753], 81: [0.03781, 0.69141, 0, 0, 0.82699], 82: [0, 0.69141, 0, 0, 0.82807], 83: [0, 0.69141, 0, 0, 0.82861], 84: [0, 0.69141, 0, 0, 0.66899], 85: [0, 0.69141, 0, 0, 0.64576], 86: [0, 0.69141, 0, 0, 0.83131], 87: [0, 0.69141, 0, 0, 1.04602], 88: [0, 0.69141, 0, 0, 0.71922], 89: [0.18906, 0.69141, 0, 0, 0.83293], 90: [0.12604, 0.69141, 0, 0, 0.60201], 91: [0.24982, 0.74947, 0, 0, 0.27764], 93: [0.24982, 0.74947, 0, 0, 0.27764], 94: [0, 0.69141, 0, 0, 0.49965], 97: [0, 0.47534, 0, 0, 0.50046], 98: [0, 0.69141, 0, 0, 0.51315], 99: [0, 0.47534, 0, 0, 0.38946], 100: [0, 0.62119, 0, 0, 0.49857], 101: [0, 0.47534, 0, 0, 0.40053], 102: [0.18906, 0.69141, 0, 0, 0.32626], 103: [0.18906, 0.47534, 0, 0, 0.5037], 104: [0.18906, 0.69141, 0, 0, 0.52126], 105: [0, 0.69141, 0, 0, 0.27899], 106: [0, 0.69141, 0, 0, 0.28088], 107: [0, 0.69141, 0, 0, 0.38946], 108: [0, 0.69141, 0, 0, 0.27953], 109: [0, 0.47534, 0, 0, 0.76676], 110: [0, 0.47534, 0, 0, 0.52666], 111: [0, 0.47534, 0, 0, 0.48885], 112: [0.18906, 0.52396, 0, 0, 0.50046], 113: [0.18906, 0.47534, 0, 0, 0.48912], 114: [0, 0.47534, 0, 0, 0.38919], 115: [0, 0.47534, 0, 0, 0.44266], 116: [0, 0.62119, 0, 0, 0.33301], 117: [0, 0.47534, 0, 0, 0.5172], 118: [0, 0.52396, 0, 0, 0.5118], 119: [0, 0.52396, 0, 0, 0.77351], 120: [0.18906, 0.47534, 0, 0, 0.38865], 121: [0.18906, 0.47534, 0, 0, 0.49884], 122: [0.18906, 0.47534, 0, 0, 0.39054], 160: [0, 0, 0, 0, 0.25], 8216: [0, 0.69141, 0, 0, 0.21471], 8217: [0, 0.69141, 0, 0, 0.21471], 58112: [0, 0.62119, 0, 0, 0.49749], 58113: [0, 0.62119, 0, 0, 0.4983], 58114: [0.18906, 0.69141, 0, 0, 0.33328], 58115: [0.18906, 0.69141, 0, 0, 0.32923], 58116: [0.18906, 0.47534, 0, 0, 0.50343], 58117: [0, 0.69141, 0, 0, 0.33301], 58118: [0, 0.62119, 0, 0, 0.33409], 58119: [0, 0.47534, 0, 0, 0.50073] }, "Main-Bold": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0, 0, 0.35], 34: [0, 0.69444, 0, 0, 0.60278], 35: [0.19444, 0.69444, 0, 0, 0.95833], 36: [0.05556, 0.75, 0, 0, 0.575], 37: [0.05556, 0.75, 0, 0, 0.95833], 38: [0, 0.69444, 0, 0, 0.89444], 39: [0, 0.69444, 0, 0, 0.31944], 40: [0.25, 0.75, 0, 0, 0.44722], 41: [0.25, 0.75, 0, 0, 0.44722], 42: [0, 0.75, 0, 0, 0.575], 43: [0.13333, 0.63333, 0, 0, 0.89444], 44: [0.19444, 0.15556, 0, 0, 0.31944], 45: [0, 0.44444, 0, 0, 0.38333], 46: [0, 0.15556, 0, 0, 0.31944], 47: [0.25, 0.75, 0, 0, 0.575], 48: [0, 0.64444, 0, 0, 0.575], 49: [0, 0.64444, 0, 0, 0.575], 50: [0, 0.64444, 0, 0, 0.575], 51: [0, 0.64444, 0, 0, 0.575], 52: [0, 0.64444, 0, 0, 0.575], 53: [0, 0.64444, 0, 0, 0.575], 54: [0, 0.64444, 0, 0, 0.575], 55: [0, 0.64444, 0, 0, 0.575], 56: [0, 0.64444, 0, 0, 0.575], 57: [0, 0.64444, 0, 0, 0.575], 58: [0, 0.44444, 0, 0, 0.31944], 59: [0.19444, 0.44444, 0, 0, 0.31944], 60: [0.08556, 0.58556, 0, 0, 0.89444], 61: [-0.10889, 0.39111, 0, 0, 0.89444], 62: [0.08556, 0.58556, 0, 0, 0.89444], 63: [0, 0.69444, 0, 0, 0.54305], 64: [0, 0.69444, 0, 0, 0.89444], 65: [0, 0.68611, 0, 0, 0.86944], 66: [0, 0.68611, 0, 0, 0.81805], 67: [0, 0.68611, 0, 0, 0.83055], 68: [0, 0.68611, 0, 0, 0.88194], 69: [0, 0.68611, 0, 0, 0.75555], 70: [0, 0.68611, 0, 0, 0.72361], 71: [0, 0.68611, 0, 0, 0.90416], 72: [0, 0.68611, 0, 0, 0.9], 73: [0, 0.68611, 0, 0, 0.43611], 74: [0, 0.68611, 0, 0, 0.59444], 75: [0, 0.68611, 0, 0, 0.90138], 76: [0, 0.68611, 0, 0, 0.69166], 77: [0, 0.68611, 0, 0, 1.09166], 78: [0, 0.68611, 0, 0, 0.9], 79: [0, 0.68611, 0, 0, 0.86388], 80: [0, 0.68611, 0, 0, 0.78611], 81: [0.19444, 0.68611, 0, 0, 0.86388], 82: [0, 0.68611, 0, 0, 0.8625], 83: [0, 0.68611, 0, 0, 0.63889], 84: [0, 0.68611, 0, 0, 0.8], 85: [0, 0.68611, 0, 0, 0.88472], 86: [0, 0.68611, 0.01597, 0, 0.86944], 87: [0, 0.68611, 0.01597, 0, 1.18888], 88: [0, 0.68611, 0, 0, 0.86944], 89: [0, 0.68611, 0.02875, 0, 0.86944], 90: [0, 0.68611, 0, 0, 0.70277], 91: [0.25, 0.75, 0, 0, 0.31944], 92: [0.25, 0.75, 0, 0, 0.575], 93: [0.25, 0.75, 0, 0, 0.31944], 94: [0, 0.69444, 0, 0, 0.575], 95: [0.31, 0.13444, 0.03194, 0, 0.575], 97: [0, 0.44444, 0, 0, 0.55902], 98: [0, 0.69444, 0, 0, 0.63889], 99: [0, 0.44444, 0, 0, 0.51111], 100: [0, 0.69444, 0, 0, 0.63889], 101: [0, 0.44444, 0, 0, 0.52708], 102: [0, 0.69444, 0.10903, 0, 0.35139], 103: [0.19444, 0.44444, 0.01597, 0, 0.575], 104: [0, 0.69444, 0, 0, 0.63889], 105: [0, 0.69444, 0, 0, 0.31944], 106: [0.19444, 0.69444, 0, 0, 0.35139], 107: [0, 0.69444, 0, 0, 0.60694], 108: [0, 0.69444, 0, 0, 0.31944], 109: [0, 0.44444, 0, 0, 0.95833], 110: [0, 0.44444, 0, 0, 0.63889], 111: [0, 0.44444, 0, 0, 0.575], 112: [0.19444, 0.44444, 0, 0, 0.63889], 113: [0.19444, 0.44444, 0, 0, 0.60694], 114: [0, 0.44444, 0, 0, 0.47361], 115: [0, 0.44444, 0, 0, 0.45361], 116: [0, 0.63492, 0, 0, 0.44722], 117: [0, 0.44444, 0, 0, 0.63889], 118: [0, 0.44444, 0.01597, 0, 0.60694], 119: [0, 0.44444, 0.01597, 0, 0.83055], 120: [0, 0.44444, 0, 0, 0.60694], 121: [0.19444, 0.44444, 0.01597, 0, 0.60694], 122: [0, 0.44444, 0, 0, 0.51111], 123: [0.25, 0.75, 0, 0, 0.575], 124: [0.25, 0.75, 0, 0, 0.31944], 125: [0.25, 0.75, 0, 0, 0.575], 126: [0.35, 0.34444, 0, 0, 0.575], 160: [0, 0, 0, 0, 0.25], 163: [0, 0.69444, 0, 0, 0.86853], 168: [0, 0.69444, 0, 0, 0.575], 172: [0, 0.44444, 0, 0, 0.76666], 176: [0, 0.69444, 0, 0, 0.86944], 177: [0.13333, 0.63333, 0, 0, 0.89444], 184: [0.17014, 0, 0, 0, 0.51111], 198: [0, 0.68611, 0, 0, 1.04166], 215: [0.13333, 0.63333, 0, 0, 0.89444], 216: [0.04861, 0.73472, 0, 0, 0.89444], 223: [0, 0.69444, 0, 0, 0.59722], 230: [0, 0.44444, 0, 0, 0.83055], 247: [0.13333, 0.63333, 0, 0, 0.89444], 248: [0.09722, 0.54167, 0, 0, 0.575], 305: [0, 0.44444, 0, 0, 0.31944], 338: [0, 0.68611, 0, 0, 1.16944], 339: [0, 0.44444, 0, 0, 0.89444], 567: [0.19444, 0.44444, 0, 0, 0.35139], 710: [0, 0.69444, 0, 0, 0.575], 711: [0, 0.63194, 0, 0, 0.575], 713: [0, 0.59611, 0, 0, 0.575], 714: [0, 0.69444, 0, 0, 0.575], 715: [0, 0.69444, 0, 0, 0.575], 728: [0, 0.69444, 0, 0, 0.575], 729: [0, 0.69444, 0, 0, 0.31944], 730: [0, 0.69444, 0, 0, 0.86944], 732: [0, 0.69444, 0, 0, 0.575], 733: [0, 0.69444, 0, 0, 0.575], 915: [0, 0.68611, 0, 0, 0.69166], 916: [0, 0.68611, 0, 0, 0.95833], 920: [0, 0.68611, 0, 0, 0.89444], 923: [0, 0.68611, 0, 0, 0.80555], 926: [0, 0.68611, 0, 0, 0.76666], 928: [0, 0.68611, 0, 0, 0.9], 931: [0, 0.68611, 0, 0, 0.83055], 933: [0, 0.68611, 0, 0, 0.89444], 934: [0, 0.68611, 0, 0, 0.83055], 936: [0, 0.68611, 0, 0, 0.89444], 937: [0, 0.68611, 0, 0, 0.83055], 8211: [0, 0.44444, 0.03194, 0, 0.575], 8212: [0, 0.44444, 0.03194, 0, 1.14999], 8216: [0, 0.69444, 0, 0, 0.31944], 8217: [0, 0.69444, 0, 0, 0.31944], 8220: [0, 0.69444, 0, 0, 0.60278], 8221: [0, 0.69444, 0, 0, 0.60278], 8224: [0.19444, 0.69444, 0, 0, 0.51111], 8225: [0.19444, 0.69444, 0, 0, 0.51111], 8242: [0, 0.55556, 0, 0, 0.34444], 8407: [0, 0.72444, 0.15486, 0, 0.575], 8463: [0, 0.69444, 0, 0, 0.66759], 8465: [0, 0.69444, 0, 0, 0.83055], 8467: [0, 0.69444, 0, 0, 0.47361], 8472: [0.19444, 0.44444, 0, 0, 0.74027], 8476: [0, 0.69444, 0, 0, 0.83055], 8501: [0, 0.69444, 0, 0, 0.70277], 8592: [-0.10889, 0.39111, 0, 0, 1.14999], 8593: [0.19444, 0.69444, 0, 0, 0.575], 8594: [-0.10889, 0.39111, 0, 0, 1.14999], 8595: [0.19444, 0.69444, 0, 0, 0.575], 8596: [-0.10889, 0.39111, 0, 0, 1.14999], 8597: [0.25, 0.75, 0, 0, 0.575], 8598: [0.19444, 0.69444, 0, 0, 1.14999], 8599: [0.19444, 0.69444, 0, 0, 1.14999], 8600: [0.19444, 0.69444, 0, 0, 1.14999], 8601: [0.19444, 0.69444, 0, 0, 1.14999], 8636: [-0.10889, 0.39111, 0, 0, 1.14999], 8637: [-0.10889, 0.39111, 0, 0, 1.14999], 8640: [-0.10889, 0.39111, 0, 0, 1.14999], 8641: [-0.10889, 0.39111, 0, 0, 1.14999], 8656: [-0.10889, 0.39111, 0, 0, 1.14999], 8657: [0.19444, 0.69444, 0, 0, 0.70277], 8658: [-0.10889, 0.39111, 0, 0, 1.14999], 8659: [0.19444, 0.69444, 0, 0, 0.70277], 8660: [-0.10889, 0.39111, 0, 0, 1.14999], 8661: [0.25, 0.75, 0, 0, 0.70277], 8704: [0, 0.69444, 0, 0, 0.63889], 8706: [0, 0.69444, 0.06389, 0, 0.62847], 8707: [0, 0.69444, 0, 0, 0.63889], 8709: [0.05556, 0.75, 0, 0, 0.575], 8711: [0, 0.68611, 0, 0, 0.95833], 8712: [0.08556, 0.58556, 0, 0, 0.76666], 8715: [0.08556, 0.58556, 0, 0, 0.76666], 8722: [0.13333, 0.63333, 0, 0, 0.89444], 8723: [0.13333, 0.63333, 0, 0, 0.89444], 8725: [0.25, 0.75, 0, 0, 0.575], 8726: [0.25, 0.75, 0, 0, 0.575], 8727: [-0.02778, 0.47222, 0, 0, 0.575], 8728: [-0.02639, 0.47361, 0, 0, 0.575], 8729: [-0.02639, 0.47361, 0, 0, 0.575], 8730: [0.18, 0.82, 0, 0, 0.95833], 8733: [0, 0.44444, 0, 0, 0.89444], 8734: [0, 0.44444, 0, 0, 1.14999], 8736: [0, 0.69224, 0, 0, 0.72222], 8739: [0.25, 0.75, 0, 0, 0.31944], 8741: [0.25, 0.75, 0, 0, 0.575], 8743: [0, 0.55556, 0, 0, 0.76666], 8744: [0, 0.55556, 0, 0, 0.76666], 8745: [0, 0.55556, 0, 0, 0.76666], 8746: [0, 0.55556, 0, 0, 0.76666], 8747: [0.19444, 0.69444, 0.12778, 0, 0.56875], 8764: [-0.10889, 0.39111, 0, 0, 0.89444], 8768: [0.19444, 0.69444, 0, 0, 0.31944], 8771: [222e-5, 0.50222, 0, 0, 0.89444], 8776: [0.02444, 0.52444, 0, 0, 0.89444], 8781: [222e-5, 0.50222, 0, 0, 0.89444], 8801: [222e-5, 0.50222, 0, 0, 0.89444], 8804: [0.19667, 0.69667, 0, 0, 0.89444], 8805: [0.19667, 0.69667, 0, 0, 0.89444], 8810: [0.08556, 0.58556, 0, 0, 1.14999], 8811: [0.08556, 0.58556, 0, 0, 1.14999], 8826: [0.08556, 0.58556, 0, 0, 0.89444], 8827: [0.08556, 0.58556, 0, 0, 0.89444], 8834: [0.08556, 0.58556, 0, 0, 0.89444], 8835: [0.08556, 0.58556, 0, 0, 0.89444], 8838: [0.19667, 0.69667, 0, 0, 0.89444], 8839: [0.19667, 0.69667, 0, 0, 0.89444], 8846: [0, 0.55556, 0, 0, 0.76666], 8849: [0.19667, 0.69667, 0, 0, 0.89444], 8850: [0.19667, 0.69667, 0, 0, 0.89444], 8851: [0, 0.55556, 0, 0, 0.76666], 8852: [0, 0.55556, 0, 0, 0.76666], 8853: [0.13333, 0.63333, 0, 0, 0.89444], 8854: [0.13333, 0.63333, 0, 0, 0.89444], 8855: [0.13333, 0.63333, 0, 0, 0.89444], 8856: [0.13333, 0.63333, 0, 0, 0.89444], 8857: [0.13333, 0.63333, 0, 0, 0.89444], 8866: [0, 0.69444, 0, 0, 0.70277], 8867: [0, 0.69444, 0, 0, 0.70277], 8868: [0, 0.69444, 0, 0, 0.89444], 8869: [0, 0.69444, 0, 0, 0.89444], 8900: [-0.02639, 0.47361, 0, 0, 0.575], 8901: [-0.02639, 0.47361, 0, 0, 0.31944], 8902: [-0.02778, 0.47222, 0, 0, 0.575], 8968: [0.25, 0.75, 0, 0, 0.51111], 8969: [0.25, 0.75, 0, 0, 0.51111], 8970: [0.25, 0.75, 0, 0, 0.51111], 8971: [0.25, 0.75, 0, 0, 0.51111], 8994: [-0.13889, 0.36111, 0, 0, 1.14999], 8995: [-0.13889, 0.36111, 0, 0, 1.14999], 9651: [0.19444, 0.69444, 0, 0, 1.02222], 9657: [-0.02778, 0.47222, 0, 0, 0.575], 9661: [0.19444, 0.69444, 0, 0, 1.02222], 9667: [-0.02778, 0.47222, 0, 0, 0.575], 9711: [0.19444, 0.69444, 0, 0, 1.14999], 9824: [0.12963, 0.69444, 0, 0, 0.89444], 9825: [0.12963, 0.69444, 0, 0, 0.89444], 9826: [0.12963, 0.69444, 0, 0, 0.89444], 9827: [0.12963, 0.69444, 0, 0, 0.89444], 9837: [0, 0.75, 0, 0, 0.44722], 9838: [0.19444, 0.69444, 0, 0, 0.44722], 9839: [0.19444, 0.69444, 0, 0, 0.44722], 10216: [0.25, 0.75, 0, 0, 0.44722], 10217: [0.25, 0.75, 0, 0, 0.44722], 10815: [0, 0.68611, 0, 0, 0.9], 10927: [0.19667, 0.69667, 0, 0, 0.89444], 10928: [0.19667, 0.69667, 0, 0, 0.89444], 57376: [0.19444, 0.69444, 0, 0, 0] }, "Main-BoldItalic": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0.11417, 0, 0.38611], 34: [0, 0.69444, 0.07939, 0, 0.62055], 35: [0.19444, 0.69444, 0.06833, 0, 0.94444], 37: [0.05556, 0.75, 0.12861, 0, 0.94444], 38: [0, 0.69444, 0.08528, 0, 0.88555], 39: [0, 0.69444, 0.12945, 0, 0.35555], 40: [0.25, 0.75, 0.15806, 0, 0.47333], 41: [0.25, 0.75, 0.03306, 0, 0.47333], 42: [0, 0.75, 0.14333, 0, 0.59111], 43: [0.10333, 0.60333, 0.03306, 0, 0.88555], 44: [0.19444, 0.14722, 0, 0, 0.35555], 45: [0, 0.44444, 0.02611, 0, 0.41444], 46: [0, 0.14722, 0, 0, 0.35555], 47: [0.25, 0.75, 0.15806, 0, 0.59111], 48: [0, 0.64444, 0.13167, 0, 0.59111], 49: [0, 0.64444, 0.13167, 0, 0.59111], 50: [0, 0.64444, 0.13167, 0, 0.59111], 51: [0, 0.64444, 0.13167, 0, 0.59111], 52: [0.19444, 0.64444, 0.13167, 0, 0.59111], 53: [0, 0.64444, 0.13167, 0, 0.59111], 54: [0, 0.64444, 0.13167, 0, 0.59111], 55: [0.19444, 0.64444, 0.13167, 0, 0.59111], 56: [0, 0.64444, 0.13167, 0, 0.59111], 57: [0, 0.64444, 0.13167, 0, 0.59111], 58: [0, 0.44444, 0.06695, 0, 0.35555], 59: [0.19444, 0.44444, 0.06695, 0, 0.35555], 61: [-0.10889, 0.39111, 0.06833, 0, 0.88555], 63: [0, 0.69444, 0.11472, 0, 0.59111], 64: [0, 0.69444, 0.09208, 0, 0.88555], 65: [0, 0.68611, 0, 0, 0.86555], 66: [0, 0.68611, 0.0992, 0, 0.81666], 67: [0, 0.68611, 0.14208, 0, 0.82666], 68: [0, 0.68611, 0.09062, 0, 0.87555], 69: [0, 0.68611, 0.11431, 0, 0.75666], 70: [0, 0.68611, 0.12903, 0, 0.72722], 71: [0, 0.68611, 0.07347, 0, 0.89527], 72: [0, 0.68611, 0.17208, 0, 0.8961], 73: [0, 0.68611, 0.15681, 0, 0.47166], 74: [0, 0.68611, 0.145, 0, 0.61055], 75: [0, 0.68611, 0.14208, 0, 0.89499], 76: [0, 0.68611, 0, 0, 0.69777], 77: [0, 0.68611, 0.17208, 0, 1.07277], 78: [0, 0.68611, 0.17208, 0, 0.8961], 79: [0, 0.68611, 0.09062, 0, 0.85499], 80: [0, 0.68611, 0.0992, 0, 0.78721], 81: [0.19444, 0.68611, 0.09062, 0, 0.85499], 82: [0, 0.68611, 0.02559, 0, 0.85944], 83: [0, 0.68611, 0.11264, 0, 0.64999], 84: [0, 0.68611, 0.12903, 0, 0.7961], 85: [0, 0.68611, 0.17208, 0, 0.88083], 86: [0, 0.68611, 0.18625, 0, 0.86555], 87: [0, 0.68611, 0.18625, 0, 1.15999], 88: [0, 0.68611, 0.15681, 0, 0.86555], 89: [0, 0.68611, 0.19803, 0, 0.86555], 90: [0, 0.68611, 0.14208, 0, 0.70888], 91: [0.25, 0.75, 0.1875, 0, 0.35611], 93: [0.25, 0.75, 0.09972, 0, 0.35611], 94: [0, 0.69444, 0.06709, 0, 0.59111], 95: [0.31, 0.13444, 0.09811, 0, 0.59111], 97: [0, 0.44444, 0.09426, 0, 0.59111], 98: [0, 0.69444, 0.07861, 0, 0.53222], 99: [0, 0.44444, 0.05222, 0, 0.53222], 100: [0, 0.69444, 0.10861, 0, 0.59111], 101: [0, 0.44444, 0.085, 0, 0.53222], 102: [0.19444, 0.69444, 0.21778, 0, 0.4], 103: [0.19444, 0.44444, 0.105, 0, 0.53222], 104: [0, 0.69444, 0.09426, 0, 0.59111], 105: [0, 0.69326, 0.11387, 0, 0.35555], 106: [0.19444, 0.69326, 0.1672, 0, 0.35555], 107: [0, 0.69444, 0.11111, 0, 0.53222], 108: [0, 0.69444, 0.10861, 0, 0.29666], 109: [0, 0.44444, 0.09426, 0, 0.94444], 110: [0, 0.44444, 0.09426, 0, 0.64999], 111: [0, 0.44444, 0.07861, 0, 0.59111], 112: [0.19444, 0.44444, 0.07861, 0, 0.59111], 113: [0.19444, 0.44444, 0.105, 0, 0.53222], 114: [0, 0.44444, 0.11111, 0, 0.50167], 115: [0, 0.44444, 0.08167, 0, 0.48694], 116: [0, 0.63492, 0.09639, 0, 0.385], 117: [0, 0.44444, 0.09426, 0, 0.62055], 118: [0, 0.44444, 0.11111, 0, 0.53222], 119: [0, 0.44444, 0.11111, 0, 0.76777], 120: [0, 0.44444, 0.12583, 0, 0.56055], 121: [0.19444, 0.44444, 0.105, 0, 0.56166], 122: [0, 0.44444, 0.13889, 0, 0.49055], 126: [0.35, 0.34444, 0.11472, 0, 0.59111], 160: [0, 0, 0, 0, 0.25], 168: [0, 0.69444, 0.11473, 0, 0.59111], 176: [0, 0.69444, 0, 0, 0.94888], 184: [0.17014, 0, 0, 0, 0.53222], 198: [0, 0.68611, 0.11431, 0, 1.02277], 216: [0.04861, 0.73472, 0.09062, 0, 0.88555], 223: [0.19444, 0.69444, 0.09736, 0, 0.665], 230: [0, 0.44444, 0.085, 0, 0.82666], 248: [0.09722, 0.54167, 0.09458, 0, 0.59111], 305: [0, 0.44444, 0.09426, 0, 0.35555], 338: [0, 0.68611, 0.11431, 0, 1.14054], 339: [0, 0.44444, 0.085, 0, 0.82666], 567: [0.19444, 0.44444, 0.04611, 0, 0.385], 710: [0, 0.69444, 0.06709, 0, 0.59111], 711: [0, 0.63194, 0.08271, 0, 0.59111], 713: [0, 0.59444, 0.10444, 0, 0.59111], 714: [0, 0.69444, 0.08528, 0, 0.59111], 715: [0, 0.69444, 0, 0, 0.59111], 728: [0, 0.69444, 0.10333, 0, 0.59111], 729: [0, 0.69444, 0.12945, 0, 0.35555], 730: [0, 0.69444, 0, 0, 0.94888], 732: [0, 0.69444, 0.11472, 0, 0.59111], 733: [0, 0.69444, 0.11472, 0, 0.59111], 915: [0, 0.68611, 0.12903, 0, 0.69777], 916: [0, 0.68611, 0, 0, 0.94444], 920: [0, 0.68611, 0.09062, 0, 0.88555], 923: [0, 0.68611, 0, 0, 0.80666], 926: [0, 0.68611, 0.15092, 0, 0.76777], 928: [0, 0.68611, 0.17208, 0, 0.8961], 931: [0, 0.68611, 0.11431, 0, 0.82666], 933: [0, 0.68611, 0.10778, 0, 0.88555], 934: [0, 0.68611, 0.05632, 0, 0.82666], 936: [0, 0.68611, 0.10778, 0, 0.88555], 937: [0, 0.68611, 0.0992, 0, 0.82666], 8211: [0, 0.44444, 0.09811, 0, 0.59111], 8212: [0, 0.44444, 0.09811, 0, 1.18221], 8216: [0, 0.69444, 0.12945, 0, 0.35555], 8217: [0, 0.69444, 0.12945, 0, 0.35555], 8220: [0, 0.69444, 0.16772, 0, 0.62055], 8221: [0, 0.69444, 0.07939, 0, 0.62055] }, "Main-Italic": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0.12417, 0, 0.30667], 34: [0, 0.69444, 0.06961, 0, 0.51444], 35: [0.19444, 0.69444, 0.06616, 0, 0.81777], 37: [0.05556, 0.75, 0.13639, 0, 0.81777], 38: [0, 0.69444, 0.09694, 0, 0.76666], 39: [0, 0.69444, 0.12417, 0, 0.30667], 40: [0.25, 0.75, 0.16194, 0, 0.40889], 41: [0.25, 0.75, 0.03694, 0, 0.40889], 42: [0, 0.75, 0.14917, 0, 0.51111], 43: [0.05667, 0.56167, 0.03694, 0, 0.76666], 44: [0.19444, 0.10556, 0, 0, 0.30667], 45: [0, 0.43056, 0.02826, 0, 0.35778], 46: [0, 0.10556, 0, 0, 0.30667], 47: [0.25, 0.75, 0.16194, 0, 0.51111], 48: [0, 0.64444, 0.13556, 0, 0.51111], 49: [0, 0.64444, 0.13556, 0, 0.51111], 50: [0, 0.64444, 0.13556, 0, 0.51111], 51: [0, 0.64444, 0.13556, 0, 0.51111], 52: [0.19444, 0.64444, 0.13556, 0, 0.51111], 53: [0, 0.64444, 0.13556, 0, 0.51111], 54: [0, 0.64444, 0.13556, 0, 0.51111], 55: [0.19444, 0.64444, 0.13556, 0, 0.51111], 56: [0, 0.64444, 0.13556, 0, 0.51111], 57: [0, 0.64444, 0.13556, 0, 0.51111], 58: [0, 0.43056, 0.0582, 0, 0.30667], 59: [0.19444, 0.43056, 0.0582, 0, 0.30667], 61: [-0.13313, 0.36687, 0.06616, 0, 0.76666], 63: [0, 0.69444, 0.1225, 0, 0.51111], 64: [0, 0.69444, 0.09597, 0, 0.76666], 65: [0, 0.68333, 0, 0, 0.74333], 66: [0, 0.68333, 0.10257, 0, 0.70389], 67: [0, 0.68333, 0.14528, 0, 0.71555], 68: [0, 0.68333, 0.09403, 0, 0.755], 69: [0, 0.68333, 0.12028, 0, 0.67833], 70: [0, 0.68333, 0.13305, 0, 0.65277], 71: [0, 0.68333, 0.08722, 0, 0.77361], 72: [0, 0.68333, 0.16389, 0, 0.74333], 73: [0, 0.68333, 0.15806, 0, 0.38555], 74: [0, 0.68333, 0.14028, 0, 0.525], 75: [0, 0.68333, 0.14528, 0, 0.76888], 76: [0, 0.68333, 0, 0, 0.62722], 77: [0, 0.68333, 0.16389, 0, 0.89666], 78: [0, 0.68333, 0.16389, 0, 0.74333], 79: [0, 0.68333, 0.09403, 0, 0.76666], 80: [0, 0.68333, 0.10257, 0, 0.67833], 81: [0.19444, 0.68333, 0.09403, 0, 0.76666], 82: [0, 0.68333, 0.03868, 0, 0.72944], 83: [0, 0.68333, 0.11972, 0, 0.56222], 84: [0, 0.68333, 0.13305, 0, 0.71555], 85: [0, 0.68333, 0.16389, 0, 0.74333], 86: [0, 0.68333, 0.18361, 0, 0.74333], 87: [0, 0.68333, 0.18361, 0, 0.99888], 88: [0, 0.68333, 0.15806, 0, 0.74333], 89: [0, 0.68333, 0.19383, 0, 0.74333], 90: [0, 0.68333, 0.14528, 0, 0.61333], 91: [0.25, 0.75, 0.1875, 0, 0.30667], 93: [0.25, 0.75, 0.10528, 0, 0.30667], 94: [0, 0.69444, 0.06646, 0, 0.51111], 95: [0.31, 0.12056, 0.09208, 0, 0.51111], 97: [0, 0.43056, 0.07671, 0, 0.51111], 98: [0, 0.69444, 0.06312, 0, 0.46], 99: [0, 0.43056, 0.05653, 0, 0.46], 100: [0, 0.69444, 0.10333, 0, 0.51111], 101: [0, 0.43056, 0.07514, 0, 0.46], 102: [0.19444, 0.69444, 0.21194, 0, 0.30667], 103: [0.19444, 0.43056, 0.08847, 0, 0.46], 104: [0, 0.69444, 0.07671, 0, 0.51111], 105: [0, 0.65536, 0.1019, 0, 0.30667], 106: [0.19444, 0.65536, 0.14467, 0, 0.30667], 107: [0, 0.69444, 0.10764, 0, 0.46], 108: [0, 0.69444, 0.10333, 0, 0.25555], 109: [0, 0.43056, 0.07671, 0, 0.81777], 110: [0, 0.43056, 0.07671, 0, 0.56222], 111: [0, 0.43056, 0.06312, 0, 0.51111], 112: [0.19444, 0.43056, 0.06312, 0, 0.51111], 113: [0.19444, 0.43056, 0.08847, 0, 0.46], 114: [0, 0.43056, 0.10764, 0, 0.42166], 115: [0, 0.43056, 0.08208, 0, 0.40889], 116: [0, 0.61508, 0.09486, 0, 0.33222], 117: [0, 0.43056, 0.07671, 0, 0.53666], 118: [0, 0.43056, 0.10764, 0, 0.46], 119: [0, 0.43056, 0.10764, 0, 0.66444], 120: [0, 0.43056, 0.12042, 0, 0.46389], 121: [0.19444, 0.43056, 0.08847, 0, 0.48555], 122: [0, 0.43056, 0.12292, 0, 0.40889], 126: [0.35, 0.31786, 0.11585, 0, 0.51111], 160: [0, 0, 0, 0, 0.25], 168: [0, 0.66786, 0.10474, 0, 0.51111], 176: [0, 0.69444, 0, 0, 0.83129], 184: [0.17014, 0, 0, 0, 0.46], 198: [0, 0.68333, 0.12028, 0, 0.88277], 216: [0.04861, 0.73194, 0.09403, 0, 0.76666], 223: [0.19444, 0.69444, 0.10514, 0, 0.53666], 230: [0, 0.43056, 0.07514, 0, 0.71555], 248: [0.09722, 0.52778, 0.09194, 0, 0.51111], 338: [0, 0.68333, 0.12028, 0, 0.98499], 339: [0, 0.43056, 0.07514, 0, 0.71555], 710: [0, 0.69444, 0.06646, 0, 0.51111], 711: [0, 0.62847, 0.08295, 0, 0.51111], 713: [0, 0.56167, 0.10333, 0, 0.51111], 714: [0, 0.69444, 0.09694, 0, 0.51111], 715: [0, 0.69444, 0, 0, 0.51111], 728: [0, 0.69444, 0.10806, 0, 0.51111], 729: [0, 0.66786, 0.11752, 0, 0.30667], 730: [0, 0.69444, 0, 0, 0.83129], 732: [0, 0.66786, 0.11585, 0, 0.51111], 733: [0, 0.69444, 0.1225, 0, 0.51111], 915: [0, 0.68333, 0.13305, 0, 0.62722], 916: [0, 0.68333, 0, 0, 0.81777], 920: [0, 0.68333, 0.09403, 0, 0.76666], 923: [0, 0.68333, 0, 0, 0.69222], 926: [0, 0.68333, 0.15294, 0, 0.66444], 928: [0, 0.68333, 0.16389, 0, 0.74333], 931: [0, 0.68333, 0.12028, 0, 0.71555], 933: [0, 0.68333, 0.11111, 0, 0.76666], 934: [0, 0.68333, 0.05986, 0, 0.71555], 936: [0, 0.68333, 0.11111, 0, 0.76666], 937: [0, 0.68333, 0.10257, 0, 0.71555], 8211: [0, 0.43056, 0.09208, 0, 0.51111], 8212: [0, 0.43056, 0.09208, 0, 1.02222], 8216: [0, 0.69444, 0.12417, 0, 0.30667], 8217: [0, 0.69444, 0.12417, 0, 0.30667], 8220: [0, 0.69444, 0.1685, 0, 0.51444], 8221: [0, 0.69444, 0.06961, 0, 0.51444], 8463: [0, 0.68889, 0, 0, 0.54028] }, "Main-Regular": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0, 0, 0.27778], 34: [0, 0.69444, 0, 0, 0.5], 35: [0.19444, 0.69444, 0, 0, 0.83334], 36: [0.05556, 0.75, 0, 0, 0.5], 37: [0.05556, 0.75, 0, 0, 0.83334], 38: [0, 0.69444, 0, 0, 0.77778], 39: [0, 0.69444, 0, 0, 0.27778], 40: [0.25, 0.75, 0, 0, 0.38889], 41: [0.25, 0.75, 0, 0, 0.38889], 42: [0, 0.75, 0, 0, 0.5], 43: [0.08333, 0.58333, 0, 0, 0.77778], 44: [0.19444, 0.10556, 0, 0, 0.27778], 45: [0, 0.43056, 0, 0, 0.33333], 46: [0, 0.10556, 0, 0, 0.27778], 47: [0.25, 0.75, 0, 0, 0.5], 48: [0, 0.64444, 0, 0, 0.5], 49: [0, 0.64444, 0, 0, 0.5], 50: [0, 0.64444, 0, 0, 0.5], 51: [0, 0.64444, 0, 0, 0.5], 52: [0, 0.64444, 0, 0, 0.5], 53: [0, 0.64444, 0, 0, 0.5], 54: [0, 0.64444, 0, 0, 0.5], 55: [0, 0.64444, 0, 0, 0.5], 56: [0, 0.64444, 0, 0, 0.5], 57: [0, 0.64444, 0, 0, 0.5], 58: [0, 0.43056, 0, 0, 0.27778], 59: [0.19444, 0.43056, 0, 0, 0.27778], 60: [0.0391, 0.5391, 0, 0, 0.77778], 61: [-0.13313, 0.36687, 0, 0, 0.77778], 62: [0.0391, 0.5391, 0, 0, 0.77778], 63: [0, 0.69444, 0, 0, 0.47222], 64: [0, 0.69444, 0, 0, 0.77778], 65: [0, 0.68333, 0, 0, 0.75], 66: [0, 0.68333, 0, 0, 0.70834], 67: [0, 0.68333, 0, 0, 0.72222], 68: [0, 0.68333, 0, 0, 0.76389], 69: [0, 0.68333, 0, 0, 0.68056], 70: [0, 0.68333, 0, 0, 0.65278], 71: [0, 0.68333, 0, 0, 0.78472], 72: [0, 0.68333, 0, 0, 0.75], 73: [0, 0.68333, 0, 0, 0.36111], 74: [0, 0.68333, 0, 0, 0.51389], 75: [0, 0.68333, 0, 0, 0.77778], 76: [0, 0.68333, 0, 0, 0.625], 77: [0, 0.68333, 0, 0, 0.91667], 78: [0, 0.68333, 0, 0, 0.75], 79: [0, 0.68333, 0, 0, 0.77778], 80: [0, 0.68333, 0, 0, 0.68056], 81: [0.19444, 0.68333, 0, 0, 0.77778], 82: [0, 0.68333, 0, 0, 0.73611], 83: [0, 0.68333, 0, 0, 0.55556], 84: [0, 0.68333, 0, 0, 0.72222], 85: [0, 0.68333, 0, 0, 0.75], 86: [0, 0.68333, 0.01389, 0, 0.75], 87: [0, 0.68333, 0.01389, 0, 1.02778], 88: [0, 0.68333, 0, 0, 0.75], 89: [0, 0.68333, 0.025, 0, 0.75], 90: [0, 0.68333, 0, 0, 0.61111], 91: [0.25, 0.75, 0, 0, 0.27778], 92: [0.25, 0.75, 0, 0, 0.5], 93: [0.25, 0.75, 0, 0, 0.27778], 94: [0, 0.69444, 0, 0, 0.5], 95: [0.31, 0.12056, 0.02778, 0, 0.5], 97: [0, 0.43056, 0, 0, 0.5], 98: [0, 0.69444, 0, 0, 0.55556], 99: [0, 0.43056, 0, 0, 0.44445], 100: [0, 0.69444, 0, 0, 0.55556], 101: [0, 0.43056, 0, 0, 0.44445], 102: [0, 0.69444, 0.07778, 0, 0.30556], 103: [0.19444, 0.43056, 0.01389, 0, 0.5], 104: [0, 0.69444, 0, 0, 0.55556], 105: [0, 0.66786, 0, 0, 0.27778], 106: [0.19444, 0.66786, 0, 0, 0.30556], 107: [0, 0.69444, 0, 0, 0.52778], 108: [0, 0.69444, 0, 0, 0.27778], 109: [0, 0.43056, 0, 0, 0.83334], 110: [0, 0.43056, 0, 0, 0.55556], 111: [0, 0.43056, 0, 0, 0.5], 112: [0.19444, 0.43056, 0, 0, 0.55556], 113: [0.19444, 0.43056, 0, 0, 0.52778], 114: [0, 0.43056, 0, 0, 0.39167], 115: [0, 0.43056, 0, 0, 0.39445], 116: [0, 0.61508, 0, 0, 0.38889], 117: [0, 0.43056, 0, 0, 0.55556], 118: [0, 0.43056, 0.01389, 0, 0.52778], 119: [0, 0.43056, 0.01389, 0, 0.72222], 120: [0, 0.43056, 0, 0, 0.52778], 121: [0.19444, 0.43056, 0.01389, 0, 0.52778], 122: [0, 0.43056, 0, 0, 0.44445], 123: [0.25, 0.75, 0, 0, 0.5], 124: [0.25, 0.75, 0, 0, 0.27778], 125: [0.25, 0.75, 0, 0, 0.5], 126: [0.35, 0.31786, 0, 0, 0.5], 160: [0, 0, 0, 0, 0.25], 163: [0, 0.69444, 0, 0, 0.76909], 167: [0.19444, 0.69444, 0, 0, 0.44445], 168: [0, 0.66786, 0, 0, 0.5], 172: [0, 0.43056, 0, 0, 0.66667], 176: [0, 0.69444, 0, 0, 0.75], 177: [0.08333, 0.58333, 0, 0, 0.77778], 182: [0.19444, 0.69444, 0, 0, 0.61111], 184: [0.17014, 0, 0, 0, 0.44445], 198: [0, 0.68333, 0, 0, 0.90278], 215: [0.08333, 0.58333, 0, 0, 0.77778], 216: [0.04861, 0.73194, 0, 0, 0.77778], 223: [0, 0.69444, 0, 0, 0.5], 230: [0, 0.43056, 0, 0, 0.72222], 247: [0.08333, 0.58333, 0, 0, 0.77778], 248: [0.09722, 0.52778, 0, 0, 0.5], 305: [0, 0.43056, 0, 0, 0.27778], 338: [0, 0.68333, 0, 0, 1.01389], 339: [0, 0.43056, 0, 0, 0.77778], 567: [0.19444, 0.43056, 0, 0, 0.30556], 710: [0, 0.69444, 0, 0, 0.5], 711: [0, 0.62847, 0, 0, 0.5], 713: [0, 0.56778, 0, 0, 0.5], 714: [0, 0.69444, 0, 0, 0.5], 715: [0, 0.69444, 0, 0, 0.5], 728: [0, 0.69444, 0, 0, 0.5], 729: [0, 0.66786, 0, 0, 0.27778], 730: [0, 0.69444, 0, 0, 0.75], 732: [0, 0.66786, 0, 0, 0.5], 733: [0, 0.69444, 0, 0, 0.5], 915: [0, 0.68333, 0, 0, 0.625], 916: [0, 0.68333, 0, 0, 0.83334], 920: [0, 0.68333, 0, 0, 0.77778], 923: [0, 0.68333, 0, 0, 0.69445], 926: [0, 0.68333, 0, 0, 0.66667], 928: [0, 0.68333, 0, 0, 0.75], 931: [0, 0.68333, 0, 0, 0.72222], 933: [0, 0.68333, 0, 0, 0.77778], 934: [0, 0.68333, 0, 0, 0.72222], 936: [0, 0.68333, 0, 0, 0.77778], 937: [0, 0.68333, 0, 0, 0.72222], 8211: [0, 0.43056, 0.02778, 0, 0.5], 8212: [0, 0.43056, 0.02778, 0, 1], 8216: [0, 0.69444, 0, 0, 0.27778], 8217: [0, 0.69444, 0, 0, 0.27778], 8220: [0, 0.69444, 0, 0, 0.5], 8221: [0, 0.69444, 0, 0, 0.5], 8224: [0.19444, 0.69444, 0, 0, 0.44445], 8225: [0.19444, 0.69444, 0, 0, 0.44445], 8230: [0, 0.12, 0, 0, 1.172], 8242: [0, 0.55556, 0, 0, 0.275], 8407: [0, 0.71444, 0.15382, 0, 0.5], 8463: [0, 0.68889, 0, 0, 0.54028], 8465: [0, 0.69444, 0, 0, 0.72222], 8467: [0, 0.69444, 0, 0.11111, 0.41667], 8472: [0.19444, 0.43056, 0, 0.11111, 0.63646], 8476: [0, 0.69444, 0, 0, 0.72222], 8501: [0, 0.69444, 0, 0, 0.61111], 8592: [-0.13313, 0.36687, 0, 0, 1], 8593: [0.19444, 0.69444, 0, 0, 0.5], 8594: [-0.13313, 0.36687, 0, 0, 1], 8595: [0.19444, 0.69444, 0, 0, 0.5], 8596: [-0.13313, 0.36687, 0, 0, 1], 8597: [0.25, 0.75, 0, 0, 0.5], 8598: [0.19444, 0.69444, 0, 0, 1], 8599: [0.19444, 0.69444, 0, 0, 1], 8600: [0.19444, 0.69444, 0, 0, 1], 8601: [0.19444, 0.69444, 0, 0, 1], 8614: [0.011, 0.511, 0, 0, 1], 8617: [0.011, 0.511, 0, 0, 1.126], 8618: [0.011, 0.511, 0, 0, 1.126], 8636: [-0.13313, 0.36687, 0, 0, 1], 8637: [-0.13313, 0.36687, 0, 0, 1], 8640: [-0.13313, 0.36687, 0, 0, 1], 8641: [-0.13313, 0.36687, 0, 0, 1], 8652: [0.011, 0.671, 0, 0, 1], 8656: [-0.13313, 0.36687, 0, 0, 1], 8657: [0.19444, 0.69444, 0, 0, 0.61111], 8658: [-0.13313, 0.36687, 0, 0, 1], 8659: [0.19444, 0.69444, 0, 0, 0.61111], 8660: [-0.13313, 0.36687, 0, 0, 1], 8661: [0.25, 0.75, 0, 0, 0.61111], 8704: [0, 0.69444, 0, 0, 0.55556], 8706: [0, 0.69444, 0.05556, 0.08334, 0.5309], 8707: [0, 0.69444, 0, 0, 0.55556], 8709: [0.05556, 0.75, 0, 0, 0.5], 8711: [0, 0.68333, 0, 0, 0.83334], 8712: [0.0391, 0.5391, 0, 0, 0.66667], 8715: [0.0391, 0.5391, 0, 0, 0.66667], 8722: [0.08333, 0.58333, 0, 0, 0.77778], 8723: [0.08333, 0.58333, 0, 0, 0.77778], 8725: [0.25, 0.75, 0, 0, 0.5], 8726: [0.25, 0.75, 0, 0, 0.5], 8727: [-0.03472, 0.46528, 0, 0, 0.5], 8728: [-0.05555, 0.44445, 0, 0, 0.5], 8729: [-0.05555, 0.44445, 0, 0, 0.5], 8730: [0.2, 0.8, 0, 0, 0.83334], 8733: [0, 0.43056, 0, 0, 0.77778], 8734: [0, 0.43056, 0, 0, 1], 8736: [0, 0.69224, 0, 0, 0.72222], 8739: [0.25, 0.75, 0, 0, 0.27778], 8741: [0.25, 0.75, 0, 0, 0.5], 8743: [0, 0.55556, 0, 0, 0.66667], 8744: [0, 0.55556, 0, 0, 0.66667], 8745: [0, 0.55556, 0, 0, 0.66667], 8746: [0, 0.55556, 0, 0, 0.66667], 8747: [0.19444, 0.69444, 0.11111, 0, 0.41667], 8764: [-0.13313, 0.36687, 0, 0, 0.77778], 8768: [0.19444, 0.69444, 0, 0, 0.27778], 8771: [-0.03625, 0.46375, 0, 0, 0.77778], 8773: [-0.022, 0.589, 0, 0, 1], 8776: [-0.01688, 0.48312, 0, 0, 0.77778], 8781: [-0.03625, 0.46375, 0, 0, 0.77778], 8784: [-0.133, 0.67, 0, 0, 0.778], 8801: [-0.03625, 0.46375, 0, 0, 0.77778], 8804: [0.13597, 0.63597, 0, 0, 0.77778], 8805: [0.13597, 0.63597, 0, 0, 0.77778], 8810: [0.0391, 0.5391, 0, 0, 1], 8811: [0.0391, 0.5391, 0, 0, 1], 8826: [0.0391, 0.5391, 0, 0, 0.77778], 8827: [0.0391, 0.5391, 0, 0, 0.77778], 8834: [0.0391, 0.5391, 0, 0, 0.77778], 8835: [0.0391, 0.5391, 0, 0, 0.77778], 8838: [0.13597, 0.63597, 0, 0, 0.77778], 8839: [0.13597, 0.63597, 0, 0, 0.77778], 8846: [0, 0.55556, 0, 0, 0.66667], 8849: [0.13597, 0.63597, 0, 0, 0.77778], 8850: [0.13597, 0.63597, 0, 0, 0.77778], 8851: [0, 0.55556, 0, 0, 0.66667], 8852: [0, 0.55556, 0, 0, 0.66667], 8853: [0.08333, 0.58333, 0, 0, 0.77778], 8854: [0.08333, 0.58333, 0, 0, 0.77778], 8855: [0.08333, 0.58333, 0, 0, 0.77778], 8856: [0.08333, 0.58333, 0, 0, 0.77778], 8857: [0.08333, 0.58333, 0, 0, 0.77778], 8866: [0, 0.69444, 0, 0, 0.61111], 8867: [0, 0.69444, 0, 0, 0.61111], 8868: [0, 0.69444, 0, 0, 0.77778], 8869: [0, 0.69444, 0, 0, 0.77778], 8872: [0.249, 0.75, 0, 0, 0.867], 8900: [-0.05555, 0.44445, 0, 0, 0.5], 8901: [-0.05555, 0.44445, 0, 0, 0.27778], 8902: [-0.03472, 0.46528, 0, 0, 0.5], 8904: [5e-3, 0.505, 0, 0, 0.9], 8942: [0.03, 0.9, 0, 0, 0.278], 8943: [-0.19, 0.31, 0, 0, 1.172], 8945: [-0.1, 0.82, 0, 0, 1.282], 8968: [0.25, 0.75, 0, 0, 0.44445], 8969: [0.25, 0.75, 0, 0, 0.44445], 8970: [0.25, 0.75, 0, 0, 0.44445], 8971: [0.25, 0.75, 0, 0, 0.44445], 8994: [-0.14236, 0.35764, 0, 0, 1], 8995: [-0.14236, 0.35764, 0, 0, 1], 9136: [0.244, 0.744, 0, 0, 0.412], 9137: [0.244, 0.744, 0, 0, 0.412], 9651: [0.19444, 0.69444, 0, 0, 0.88889], 9657: [-0.03472, 0.46528, 0, 0, 0.5], 9661: [0.19444, 0.69444, 0, 0, 0.88889], 9667: [-0.03472, 0.46528, 0, 0, 0.5], 9711: [0.19444, 0.69444, 0, 0, 1], 9824: [0.12963, 0.69444, 0, 0, 0.77778], 9825: [0.12963, 0.69444, 0, 0, 0.77778], 9826: [0.12963, 0.69444, 0, 0, 0.77778], 9827: [0.12963, 0.69444, 0, 0, 0.77778], 9837: [0, 0.75, 0, 0, 0.38889], 9838: [0.19444, 0.69444, 0, 0, 0.38889], 9839: [0.19444, 0.69444, 0, 0, 0.38889], 10216: [0.25, 0.75, 0, 0, 0.38889], 10217: [0.25, 0.75, 0, 0, 0.38889], 10222: [0.244, 0.744, 0, 0, 0.412], 10223: [0.244, 0.744, 0, 0, 0.412], 10229: [0.011, 0.511, 0, 0, 1.609], 10230: [0.011, 0.511, 0, 0, 1.638], 10231: [0.011, 0.511, 0, 0, 1.859], 10232: [0.024, 0.525, 0, 0, 1.609], 10233: [0.024, 0.525, 0, 0, 1.638], 10234: [0.024, 0.525, 0, 0, 1.858], 10236: [0.011, 0.511, 0, 0, 1.638], 10815: [0, 0.68333, 0, 0, 0.75], 10927: [0.13597, 0.63597, 0, 0, 0.77778], 10928: [0.13597, 0.63597, 0, 0, 0.77778], 57376: [0.19444, 0.69444, 0, 0, 0] }, "Math-BoldItalic": { 32: [0, 0, 0, 0, 0.25], 48: [0, 0.44444, 0, 0, 0.575], 49: [0, 0.44444, 0, 0, 0.575], 50: [0, 0.44444, 0, 0, 0.575], 51: [0.19444, 0.44444, 0, 0, 0.575], 52: [0.19444, 0.44444, 0, 0, 0.575], 53: [0.19444, 0.44444, 0, 0, 0.575], 54: [0, 0.64444, 0, 0, 0.575], 55: [0.19444, 0.44444, 0, 0, 0.575], 56: [0, 0.64444, 0, 0, 0.575], 57: [0.19444, 0.44444, 0, 0, 0.575], 65: [0, 0.68611, 0, 0, 0.86944], 66: [0, 0.68611, 0.04835, 0, 0.8664], 67: [0, 0.68611, 0.06979, 0, 0.81694], 68: [0, 0.68611, 0.03194, 0, 0.93812], 69: [0, 0.68611, 0.05451, 0, 0.81007], 70: [0, 0.68611, 0.15972, 0, 0.68889], 71: [0, 0.68611, 0, 0, 0.88673], 72: [0, 0.68611, 0.08229, 0, 0.98229], 73: [0, 0.68611, 0.07778, 0, 0.51111], 74: [0, 0.68611, 0.10069, 0, 0.63125], 75: [0, 0.68611, 0.06979, 0, 0.97118], 76: [0, 0.68611, 0, 0, 0.75555], 77: [0, 0.68611, 0.11424, 0, 1.14201], 78: [0, 0.68611, 0.11424, 0, 0.95034], 79: [0, 0.68611, 0.03194, 0, 0.83666], 80: [0, 0.68611, 0.15972, 0, 0.72309], 81: [0.19444, 0.68611, 0, 0, 0.86861], 82: [0, 0.68611, 421e-5, 0, 0.87235], 83: [0, 0.68611, 0.05382, 0, 0.69271], 84: [0, 0.68611, 0.15972, 0, 0.63663], 85: [0, 0.68611, 0.11424, 0, 0.80027], 86: [0, 0.68611, 0.25555, 0, 0.67778], 87: [0, 0.68611, 0.15972, 0, 1.09305], 88: [0, 0.68611, 0.07778, 0, 0.94722], 89: [0, 0.68611, 0.25555, 0, 0.67458], 90: [0, 0.68611, 0.06979, 0, 0.77257], 97: [0, 0.44444, 0, 0, 0.63287], 98: [0, 0.69444, 0, 0, 0.52083], 99: [0, 0.44444, 0, 0, 0.51342], 100: [0, 0.69444, 0, 0, 0.60972], 101: [0, 0.44444, 0, 0, 0.55361], 102: [0.19444, 0.69444, 0.11042, 0, 0.56806], 103: [0.19444, 0.44444, 0.03704, 0, 0.5449], 104: [0, 0.69444, 0, 0, 0.66759], 105: [0, 0.69326, 0, 0, 0.4048], 106: [0.19444, 0.69326, 0.0622, 0, 0.47083], 107: [0, 0.69444, 0.01852, 0, 0.6037], 108: [0, 0.69444, 88e-4, 0, 0.34815], 109: [0, 0.44444, 0, 0, 1.0324], 110: [0, 0.44444, 0, 0, 0.71296], 111: [0, 0.44444, 0, 0, 0.58472], 112: [0.19444, 0.44444, 0, 0, 0.60092], 113: [0.19444, 0.44444, 0.03704, 0, 0.54213], 114: [0, 0.44444, 0.03194, 0, 0.5287], 115: [0, 0.44444, 0, 0, 0.53125], 116: [0, 0.63492, 0, 0, 0.41528], 117: [0, 0.44444, 0, 0, 0.68102], 118: [0, 0.44444, 0.03704, 0, 0.56666], 119: [0, 0.44444, 0.02778, 0, 0.83148], 120: [0, 0.44444, 0, 0, 0.65903], 121: [0.19444, 0.44444, 0.03704, 0, 0.59028], 122: [0, 0.44444, 0.04213, 0, 0.55509], 160: [0, 0, 0, 0, 0.25], 915: [0, 0.68611, 0.15972, 0, 0.65694], 916: [0, 0.68611, 0, 0, 0.95833], 920: [0, 0.68611, 0.03194, 0, 0.86722], 923: [0, 0.68611, 0, 0, 0.80555], 926: [0, 0.68611, 0.07458, 0, 0.84125], 928: [0, 0.68611, 0.08229, 0, 0.98229], 931: [0, 0.68611, 0.05451, 0, 0.88507], 933: [0, 0.68611, 0.15972, 0, 0.67083], 934: [0, 0.68611, 0, 0, 0.76666], 936: [0, 0.68611, 0.11653, 0, 0.71402], 937: [0, 0.68611, 0.04835, 0, 0.8789], 945: [0, 0.44444, 0, 0, 0.76064], 946: [0.19444, 0.69444, 0.03403, 0, 0.65972], 947: [0.19444, 0.44444, 0.06389, 0, 0.59003], 948: [0, 0.69444, 0.03819, 0, 0.52222], 949: [0, 0.44444, 0, 0, 0.52882], 950: [0.19444, 0.69444, 0.06215, 0, 0.50833], 951: [0.19444, 0.44444, 0.03704, 0, 0.6], 952: [0, 0.69444, 0.03194, 0, 0.5618], 953: [0, 0.44444, 0, 0, 0.41204], 954: [0, 0.44444, 0, 0, 0.66759], 955: [0, 0.69444, 0, 0, 0.67083], 956: [0.19444, 0.44444, 0, 0, 0.70787], 957: [0, 0.44444, 0.06898, 0, 0.57685], 958: [0.19444, 0.69444, 0.03021, 0, 0.50833], 959: [0, 0.44444, 0, 0, 0.58472], 960: [0, 0.44444, 0.03704, 0, 0.68241], 961: [0.19444, 0.44444, 0, 0, 0.6118], 962: [0.09722, 0.44444, 0.07917, 0, 0.42361], 963: [0, 0.44444, 0.03704, 0, 0.68588], 964: [0, 0.44444, 0.13472, 0, 0.52083], 965: [0, 0.44444, 0.03704, 0, 0.63055], 966: [0.19444, 0.44444, 0, 0, 0.74722], 967: [0.19444, 0.44444, 0, 0, 0.71805], 968: [0.19444, 0.69444, 0.03704, 0, 0.75833], 969: [0, 0.44444, 0.03704, 0, 0.71782], 977: [0, 0.69444, 0, 0, 0.69155], 981: [0.19444, 0.69444, 0, 0, 0.7125], 982: [0, 0.44444, 0.03194, 0, 0.975], 1009: [0.19444, 0.44444, 0, 0, 0.6118], 1013: [0, 0.44444, 0, 0, 0.48333], 57649: [0, 0.44444, 0, 0, 0.39352], 57911: [0.19444, 0.44444, 0, 0, 0.43889] }, "Math-Italic": { 32: [0, 0, 0, 0, 0.25], 48: [0, 0.43056, 0, 0, 0.5], 49: [0, 0.43056, 0, 0, 0.5], 50: [0, 0.43056, 0, 0, 0.5], 51: [0.19444, 0.43056, 0, 0, 0.5], 52: [0.19444, 0.43056, 0, 0, 0.5], 53: [0.19444, 0.43056, 0, 0, 0.5], 54: [0, 0.64444, 0, 0, 0.5], 55: [0.19444, 0.43056, 0, 0, 0.5], 56: [0, 0.64444, 0, 0, 0.5], 57: [0.19444, 0.43056, 0, 0, 0.5], 65: [0, 0.68333, 0, 0.13889, 0.75], 66: [0, 0.68333, 0.05017, 0.08334, 0.75851], 67: [0, 0.68333, 0.07153, 0.08334, 0.71472], 68: [0, 0.68333, 0.02778, 0.05556, 0.82792], 69: [0, 0.68333, 0.05764, 0.08334, 0.7382], 70: [0, 0.68333, 0.13889, 0.08334, 0.64306], 71: [0, 0.68333, 0, 0.08334, 0.78625], 72: [0, 0.68333, 0.08125, 0.05556, 0.83125], 73: [0, 0.68333, 0.07847, 0.11111, 0.43958], 74: [0, 0.68333, 0.09618, 0.16667, 0.55451], 75: [0, 0.68333, 0.07153, 0.05556, 0.84931], 76: [0, 0.68333, 0, 0.02778, 0.68056], 77: [0, 0.68333, 0.10903, 0.08334, 0.97014], 78: [0, 0.68333, 0.10903, 0.08334, 0.80347], 79: [0, 0.68333, 0.02778, 0.08334, 0.76278], 80: [0, 0.68333, 0.13889, 0.08334, 0.64201], 81: [0.19444, 0.68333, 0, 0.08334, 0.79056], 82: [0, 0.68333, 773e-5, 0.08334, 0.75929], 83: [0, 0.68333, 0.05764, 0.08334, 0.6132], 84: [0, 0.68333, 0.13889, 0.08334, 0.58438], 85: [0, 0.68333, 0.10903, 0.02778, 0.68278], 86: [0, 0.68333, 0.22222, 0, 0.58333], 87: [0, 0.68333, 0.13889, 0, 0.94445], 88: [0, 0.68333, 0.07847, 0.08334, 0.82847], 89: [0, 0.68333, 0.22222, 0, 0.58056], 90: [0, 0.68333, 0.07153, 0.08334, 0.68264], 97: [0, 0.43056, 0, 0, 0.52859], 98: [0, 0.69444, 0, 0, 0.42917], 99: [0, 0.43056, 0, 0.05556, 0.43276], 100: [0, 0.69444, 0, 0.16667, 0.52049], 101: [0, 0.43056, 0, 0.05556, 0.46563], 102: [0.19444, 0.69444, 0.10764, 0.16667, 0.48959], 103: [0.19444, 0.43056, 0.03588, 0.02778, 0.47697], 104: [0, 0.69444, 0, 0, 0.57616], 105: [0, 0.65952, 0, 0, 0.34451], 106: [0.19444, 0.65952, 0.05724, 0, 0.41181], 107: [0, 0.69444, 0.03148, 0, 0.5206], 108: [0, 0.69444, 0.01968, 0.08334, 0.29838], 109: [0, 0.43056, 0, 0, 0.87801], 110: [0, 0.43056, 0, 0, 0.60023], 111: [0, 0.43056, 0, 0.05556, 0.48472], 112: [0.19444, 0.43056, 0, 0.08334, 0.50313], 113: [0.19444, 0.43056, 0.03588, 0.08334, 0.44641], 114: [0, 0.43056, 0.02778, 0.05556, 0.45116], 115: [0, 0.43056, 0, 0.05556, 0.46875], 116: [0, 0.61508, 0, 0.08334, 0.36111], 117: [0, 0.43056, 0, 0.02778, 0.57246], 118: [0, 0.43056, 0.03588, 0.02778, 0.48472], 119: [0, 0.43056, 0.02691, 0.08334, 0.71592], 120: [0, 0.43056, 0, 0.02778, 0.57153], 121: [0.19444, 0.43056, 0.03588, 0.05556, 0.49028], 122: [0, 0.43056, 0.04398, 0.05556, 0.46505], 160: [0, 0, 0, 0, 0.25], 915: [0, 0.68333, 0.13889, 0.08334, 0.61528], 916: [0, 0.68333, 0, 0.16667, 0.83334], 920: [0, 0.68333, 0.02778, 0.08334, 0.76278], 923: [0, 0.68333, 0, 0.16667, 0.69445], 926: [0, 0.68333, 0.07569, 0.08334, 0.74236], 928: [0, 0.68333, 0.08125, 0.05556, 0.83125], 931: [0, 0.68333, 0.05764, 0.08334, 0.77986], 933: [0, 0.68333, 0.13889, 0.05556, 0.58333], 934: [0, 0.68333, 0, 0.08334, 0.66667], 936: [0, 0.68333, 0.11, 0.05556, 0.61222], 937: [0, 0.68333, 0.05017, 0.08334, 0.7724], 945: [0, 0.43056, 37e-4, 0.02778, 0.6397], 946: [0.19444, 0.69444, 0.05278, 0.08334, 0.56563], 947: [0.19444, 0.43056, 0.05556, 0, 0.51773], 948: [0, 0.69444, 0.03785, 0.05556, 0.44444], 949: [0, 0.43056, 0, 0.08334, 0.46632], 950: [0.19444, 0.69444, 0.07378, 0.08334, 0.4375], 951: [0.19444, 0.43056, 0.03588, 0.05556, 0.49653], 952: [0, 0.69444, 0.02778, 0.08334, 0.46944], 953: [0, 0.43056, 0, 0.05556, 0.35394], 954: [0, 0.43056, 0, 0, 0.57616], 955: [0, 0.69444, 0, 0, 0.58334], 956: [0.19444, 0.43056, 0, 0.02778, 0.60255], 957: [0, 0.43056, 0.06366, 0.02778, 0.49398], 958: [0.19444, 0.69444, 0.04601, 0.11111, 0.4375], 959: [0, 0.43056, 0, 0.05556, 0.48472], 960: [0, 0.43056, 0.03588, 0, 0.57003], 961: [0.19444, 0.43056, 0, 0.08334, 0.51702], 962: [0.09722, 0.43056, 0.07986, 0.08334, 0.36285], 963: [0, 0.43056, 0.03588, 0, 0.57141], 964: [0, 0.43056, 0.1132, 0.02778, 0.43715], 965: [0, 0.43056, 0.03588, 0.02778, 0.54028], 966: [0.19444, 0.43056, 0, 0.08334, 0.65417], 967: [0.19444, 0.43056, 0, 0.05556, 0.62569], 968: [0.19444, 0.69444, 0.03588, 0.11111, 0.65139], 969: [0, 0.43056, 0.03588, 0, 0.62245], 977: [0, 0.69444, 0, 0.08334, 0.59144], 981: [0.19444, 0.69444, 0, 0.08334, 0.59583], 982: [0, 0.43056, 0.02778, 0, 0.82813], 1009: [0.19444, 0.43056, 0, 0.08334, 0.51702], 1013: [0, 0.43056, 0, 0.05556, 0.4059], 57649: [0, 0.43056, 0, 0.02778, 0.32246], 57911: [0.19444, 0.43056, 0, 0.08334, 0.38403] }, "SansSerif-Bold": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0, 0, 0.36667], 34: [0, 0.69444, 0, 0, 0.55834], 35: [0.19444, 0.69444, 0, 0, 0.91667], 36: [0.05556, 0.75, 0, 0, 0.55], 37: [0.05556, 0.75, 0, 0, 1.02912], 38: [0, 0.69444, 0, 0, 0.83056], 39: [0, 0.69444, 0, 0, 0.30556], 40: [0.25, 0.75, 0, 0, 0.42778], 41: [0.25, 0.75, 0, 0, 0.42778], 42: [0, 0.75, 0, 0, 0.55], 43: [0.11667, 0.61667, 0, 0, 0.85556], 44: [0.10556, 0.13056, 0, 0, 0.30556], 45: [0, 0.45833, 0, 0, 0.36667], 46: [0, 0.13056, 0, 0, 0.30556], 47: [0.25, 0.75, 0, 0, 0.55], 48: [0, 0.69444, 0, 0, 0.55], 49: [0, 0.69444, 0, 0, 0.55], 50: [0, 0.69444, 0, 0, 0.55], 51: [0, 0.69444, 0, 0, 0.55], 52: [0, 0.69444, 0, 0, 0.55], 53: [0, 0.69444, 0, 0, 0.55], 54: [0, 0.69444, 0, 0, 0.55], 55: [0, 0.69444, 0, 0, 0.55], 56: [0, 0.69444, 0, 0, 0.55], 57: [0, 0.69444, 0, 0, 0.55], 58: [0, 0.45833, 0, 0, 0.30556], 59: [0.10556, 0.45833, 0, 0, 0.30556], 61: [-0.09375, 0.40625, 0, 0, 0.85556], 63: [0, 0.69444, 0, 0, 0.51945], 64: [0, 0.69444, 0, 0, 0.73334], 65: [0, 0.69444, 0, 0, 0.73334], 66: [0, 0.69444, 0, 0, 0.73334], 67: [0, 0.69444, 0, 0, 0.70278], 68: [0, 0.69444, 0, 0, 0.79445], 69: [0, 0.69444, 0, 0, 0.64167], 70: [0, 0.69444, 0, 0, 0.61111], 71: [0, 0.69444, 0, 0, 0.73334], 72: [0, 0.69444, 0, 0, 0.79445], 73: [0, 0.69444, 0, 0, 0.33056], 74: [0, 0.69444, 0, 0, 0.51945], 75: [0, 0.69444, 0, 0, 0.76389], 76: [0, 0.69444, 0, 0, 0.58056], 77: [0, 0.69444, 0, 0, 0.97778], 78: [0, 0.69444, 0, 0, 0.79445], 79: [0, 0.69444, 0, 0, 0.79445], 80: [0, 0.69444, 0, 0, 0.70278], 81: [0.10556, 0.69444, 0, 0, 0.79445], 82: [0, 0.69444, 0, 0, 0.70278], 83: [0, 0.69444, 0, 0, 0.61111], 84: [0, 0.69444, 0, 0, 0.73334], 85: [0, 0.69444, 0, 0, 0.76389], 86: [0, 0.69444, 0.01528, 0, 0.73334], 87: [0, 0.69444, 0.01528, 0, 1.03889], 88: [0, 0.69444, 0, 0, 0.73334], 89: [0, 0.69444, 0.0275, 0, 0.73334], 90: [0, 0.69444, 0, 0, 0.67223], 91: [0.25, 0.75, 0, 0, 0.34306], 93: [0.25, 0.75, 0, 0, 0.34306], 94: [0, 0.69444, 0, 0, 0.55], 95: [0.35, 0.10833, 0.03056, 0, 0.55], 97: [0, 0.45833, 0, 0, 0.525], 98: [0, 0.69444, 0, 0, 0.56111], 99: [0, 0.45833, 0, 0, 0.48889], 100: [0, 0.69444, 0, 0, 0.56111], 101: [0, 0.45833, 0, 0, 0.51111], 102: [0, 0.69444, 0.07639, 0, 0.33611], 103: [0.19444, 0.45833, 0.01528, 0, 0.55], 104: [0, 0.69444, 0, 0, 0.56111], 105: [0, 0.69444, 0, 0, 0.25556], 106: [0.19444, 0.69444, 0, 0, 0.28611], 107: [0, 0.69444, 0, 0, 0.53056], 108: [0, 0.69444, 0, 0, 0.25556], 109: [0, 0.45833, 0, 0, 0.86667], 110: [0, 0.45833, 0, 0, 0.56111], 111: [0, 0.45833, 0, 0, 0.55], 112: [0.19444, 0.45833, 0, 0, 0.56111], 113: [0.19444, 0.45833, 0, 0, 0.56111], 114: [0, 0.45833, 0.01528, 0, 0.37222], 115: [0, 0.45833, 0, 0, 0.42167], 116: [0, 0.58929, 0, 0, 0.40417], 117: [0, 0.45833, 0, 0, 0.56111], 118: [0, 0.45833, 0.01528, 0, 0.5], 119: [0, 0.45833, 0.01528, 0, 0.74445], 120: [0, 0.45833, 0, 0, 0.5], 121: [0.19444, 0.45833, 0.01528, 0, 0.5], 122: [0, 0.45833, 0, 0, 0.47639], 126: [0.35, 0.34444, 0, 0, 0.55], 160: [0, 0, 0, 0, 0.25], 168: [0, 0.69444, 0, 0, 0.55], 176: [0, 0.69444, 0, 0, 0.73334], 180: [0, 0.69444, 0, 0, 0.55], 184: [0.17014, 0, 0, 0, 0.48889], 305: [0, 0.45833, 0, 0, 0.25556], 567: [0.19444, 0.45833, 0, 0, 0.28611], 710: [0, 0.69444, 0, 0, 0.55], 711: [0, 0.63542, 0, 0, 0.55], 713: [0, 0.63778, 0, 0, 0.55], 728: [0, 0.69444, 0, 0, 0.55], 729: [0, 0.69444, 0, 0, 0.30556], 730: [0, 0.69444, 0, 0, 0.73334], 732: [0, 0.69444, 0, 0, 0.55], 733: [0, 0.69444, 0, 0, 0.55], 915: [0, 0.69444, 0, 0, 0.58056], 916: [0, 0.69444, 0, 0, 0.91667], 920: [0, 0.69444, 0, 0, 0.85556], 923: [0, 0.69444, 0, 0, 0.67223], 926: [0, 0.69444, 0, 0, 0.73334], 928: [0, 0.69444, 0, 0, 0.79445], 931: [0, 0.69444, 0, 0, 0.79445], 933: [0, 0.69444, 0, 0, 0.85556], 934: [0, 0.69444, 0, 0, 0.79445], 936: [0, 0.69444, 0, 0, 0.85556], 937: [0, 0.69444, 0, 0, 0.79445], 8211: [0, 0.45833, 0.03056, 0, 0.55], 8212: [0, 0.45833, 0.03056, 0, 1.10001], 8216: [0, 0.69444, 0, 0, 0.30556], 8217: [0, 0.69444, 0, 0, 0.30556], 8220: [0, 0.69444, 0, 0, 0.55834], 8221: [0, 0.69444, 0, 0, 0.55834] }, "SansSerif-Italic": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0.05733, 0, 0.31945], 34: [0, 0.69444, 316e-5, 0, 0.5], 35: [0.19444, 0.69444, 0.05087, 0, 0.83334], 36: [0.05556, 0.75, 0.11156, 0, 0.5], 37: [0.05556, 0.75, 0.03126, 0, 0.83334], 38: [0, 0.69444, 0.03058, 0, 0.75834], 39: [0, 0.69444, 0.07816, 0, 0.27778], 40: [0.25, 0.75, 0.13164, 0, 0.38889], 41: [0.25, 0.75, 0.02536, 0, 0.38889], 42: [0, 0.75, 0.11775, 0, 0.5], 43: [0.08333, 0.58333, 0.02536, 0, 0.77778], 44: [0.125, 0.08333, 0, 0, 0.27778], 45: [0, 0.44444, 0.01946, 0, 0.33333], 46: [0, 0.08333, 0, 0, 0.27778], 47: [0.25, 0.75, 0.13164, 0, 0.5], 48: [0, 0.65556, 0.11156, 0, 0.5], 49: [0, 0.65556, 0.11156, 0, 0.5], 50: [0, 0.65556, 0.11156, 0, 0.5], 51: [0, 0.65556, 0.11156, 0, 0.5], 52: [0, 0.65556, 0.11156, 0, 0.5], 53: [0, 0.65556, 0.11156, 0, 0.5], 54: [0, 0.65556, 0.11156, 0, 0.5], 55: [0, 0.65556, 0.11156, 0, 0.5], 56: [0, 0.65556, 0.11156, 0, 0.5], 57: [0, 0.65556, 0.11156, 0, 0.5], 58: [0, 0.44444, 0.02502, 0, 0.27778], 59: [0.125, 0.44444, 0.02502, 0, 0.27778], 61: [-0.13, 0.37, 0.05087, 0, 0.77778], 63: [0, 0.69444, 0.11809, 0, 0.47222], 64: [0, 0.69444, 0.07555, 0, 0.66667], 65: [0, 0.69444, 0, 0, 0.66667], 66: [0, 0.69444, 0.08293, 0, 0.66667], 67: [0, 0.69444, 0.11983, 0, 0.63889], 68: [0, 0.69444, 0.07555, 0, 0.72223], 69: [0, 0.69444, 0.11983, 0, 0.59722], 70: [0, 0.69444, 0.13372, 0, 0.56945], 71: [0, 0.69444, 0.11983, 0, 0.66667], 72: [0, 0.69444, 0.08094, 0, 0.70834], 73: [0, 0.69444, 0.13372, 0, 0.27778], 74: [0, 0.69444, 0.08094, 0, 0.47222], 75: [0, 0.69444, 0.11983, 0, 0.69445], 76: [0, 0.69444, 0, 0, 0.54167], 77: [0, 0.69444, 0.08094, 0, 0.875], 78: [0, 0.69444, 0.08094, 0, 0.70834], 79: [0, 0.69444, 0.07555, 0, 0.73611], 80: [0, 0.69444, 0.08293, 0, 0.63889], 81: [0.125, 0.69444, 0.07555, 0, 0.73611], 82: [0, 0.69444, 0.08293, 0, 0.64584], 83: [0, 0.69444, 0.09205, 0, 0.55556], 84: [0, 0.69444, 0.13372, 0, 0.68056], 85: [0, 0.69444, 0.08094, 0, 0.6875], 86: [0, 0.69444, 0.1615, 0, 0.66667], 87: [0, 0.69444, 0.1615, 0, 0.94445], 88: [0, 0.69444, 0.13372, 0, 0.66667], 89: [0, 0.69444, 0.17261, 0, 0.66667], 90: [0, 0.69444, 0.11983, 0, 0.61111], 91: [0.25, 0.75, 0.15942, 0, 0.28889], 93: [0.25, 0.75, 0.08719, 0, 0.28889], 94: [0, 0.69444, 0.0799, 0, 0.5], 95: [0.35, 0.09444, 0.08616, 0, 0.5], 97: [0, 0.44444, 981e-5, 0, 0.48056], 98: [0, 0.69444, 0.03057, 0, 0.51667], 99: [0, 0.44444, 0.08336, 0, 0.44445], 100: [0, 0.69444, 0.09483, 0, 0.51667], 101: [0, 0.44444, 0.06778, 0, 0.44445], 102: [0, 0.69444, 0.21705, 0, 0.30556], 103: [0.19444, 0.44444, 0.10836, 0, 0.5], 104: [0, 0.69444, 0.01778, 0, 0.51667], 105: [0, 0.67937, 0.09718, 0, 0.23889], 106: [0.19444, 0.67937, 0.09162, 0, 0.26667], 107: [0, 0.69444, 0.08336, 0, 0.48889], 108: [0, 0.69444, 0.09483, 0, 0.23889], 109: [0, 0.44444, 0.01778, 0, 0.79445], 110: [0, 0.44444, 0.01778, 0, 0.51667], 111: [0, 0.44444, 0.06613, 0, 0.5], 112: [0.19444, 0.44444, 0.0389, 0, 0.51667], 113: [0.19444, 0.44444, 0.04169, 0, 0.51667], 114: [0, 0.44444, 0.10836, 0, 0.34167], 115: [0, 0.44444, 0.0778, 0, 0.38333], 116: [0, 0.57143, 0.07225, 0, 0.36111], 117: [0, 0.44444, 0.04169, 0, 0.51667], 118: [0, 0.44444, 0.10836, 0, 0.46111], 119: [0, 0.44444, 0.10836, 0, 0.68334], 120: [0, 0.44444, 0.09169, 0, 0.46111], 121: [0.19444, 0.44444, 0.10836, 0, 0.46111], 122: [0, 0.44444, 0.08752, 0, 0.43472], 126: [0.35, 0.32659, 0.08826, 0, 0.5], 160: [0, 0, 0, 0, 0.25], 168: [0, 0.67937, 0.06385, 0, 0.5], 176: [0, 0.69444, 0, 0, 0.73752], 184: [0.17014, 0, 0, 0, 0.44445], 305: [0, 0.44444, 0.04169, 0, 0.23889], 567: [0.19444, 0.44444, 0.04169, 0, 0.26667], 710: [0, 0.69444, 0.0799, 0, 0.5], 711: [0, 0.63194, 0.08432, 0, 0.5], 713: [0, 0.60889, 0.08776, 0, 0.5], 714: [0, 0.69444, 0.09205, 0, 0.5], 715: [0, 0.69444, 0, 0, 0.5], 728: [0, 0.69444, 0.09483, 0, 0.5], 729: [0, 0.67937, 0.07774, 0, 0.27778], 730: [0, 0.69444, 0, 0, 0.73752], 732: [0, 0.67659, 0.08826, 0, 0.5], 733: [0, 0.69444, 0.09205, 0, 0.5], 915: [0, 0.69444, 0.13372, 0, 0.54167], 916: [0, 0.69444, 0, 0, 0.83334], 920: [0, 0.69444, 0.07555, 0, 0.77778], 923: [0, 0.69444, 0, 0, 0.61111], 926: [0, 0.69444, 0.12816, 0, 0.66667], 928: [0, 0.69444, 0.08094, 0, 0.70834], 931: [0, 0.69444, 0.11983, 0, 0.72222], 933: [0, 0.69444, 0.09031, 0, 0.77778], 934: [0, 0.69444, 0.04603, 0, 0.72222], 936: [0, 0.69444, 0.09031, 0, 0.77778], 937: [0, 0.69444, 0.08293, 0, 0.72222], 8211: [0, 0.44444, 0.08616, 0, 0.5], 8212: [0, 0.44444, 0.08616, 0, 1], 8216: [0, 0.69444, 0.07816, 0, 0.27778], 8217: [0, 0.69444, 0.07816, 0, 0.27778], 8220: [0, 0.69444, 0.14205, 0, 0.5], 8221: [0, 0.69444, 316e-5, 0, 0.5] }, "SansSerif-Regular": { 32: [0, 0, 0, 0, 0.25], 33: [0, 0.69444, 0, 0, 0.31945], 34: [0, 0.69444, 0, 0, 0.5], 35: [0.19444, 0.69444, 0, 0, 0.83334], 36: [0.05556, 0.75, 0, 0, 0.5], 37: [0.05556, 0.75, 0, 0, 0.83334], 38: [0, 0.69444, 0, 0, 0.75834], 39: [0, 0.69444, 0, 0, 0.27778], 40: [0.25, 0.75, 0, 0, 0.38889], 41: [0.25, 0.75, 0, 0, 0.38889], 42: [0, 0.75, 0, 0, 0.5], 43: [0.08333, 0.58333, 0, 0, 0.77778], 44: [0.125, 0.08333, 0, 0, 0.27778], 45: [0, 0.44444, 0, 0, 0.33333], 46: [0, 0.08333, 0, 0, 0.27778], 47: [0.25, 0.75, 0, 0, 0.5], 48: [0, 0.65556, 0, 0, 0.5], 49: [0, 0.65556, 0, 0, 0.5], 50: [0, 0.65556, 0, 0, 0.5], 51: [0, 0.65556, 0, 0, 0.5], 52: [0, 0.65556, 0, 0, 0.5], 53: [0, 0.65556, 0, 0, 0.5], 54: [0, 0.65556, 0, 0, 0.5], 55: [0, 0.65556, 0, 0, 0.5], 56: [0, 0.65556, 0, 0, 0.5], 57: [0, 0.65556, 0, 0, 0.5], 58: [0, 0.44444, 0, 0, 0.27778], 59: [0.125, 0.44444, 0, 0, 0.27778], 61: [-0.13, 0.37, 0, 0, 0.77778], 63: [0, 0.69444, 0, 0, 0.47222], 64: [0, 0.69444, 0, 0, 0.66667], 65: [0, 0.69444, 0, 0, 0.66667], 66: [0, 0.69444, 0, 0, 0.66667], 67: [0, 0.69444, 0, 0, 0.63889], 68: [0, 0.69444, 0, 0, 0.72223], 69: [0, 0.69444, 0, 0, 0.59722], 70: [0, 0.69444, 0, 0, 0.56945], 71: [0, 0.69444, 0, 0, 0.66667], 72: [0, 0.69444, 0, 0, 0.70834], 73: [0, 0.69444, 0, 0, 0.27778], 74: [0, 0.69444, 0, 0, 0.47222], 75: [0, 0.69444, 0, 0, 0.69445], 76: [0, 0.69444, 0, 0, 0.54167], 77: [0, 0.69444, 0, 0, 0.875], 78: [0, 0.69444, 0, 0, 0.70834], 79: [0, 0.69444, 0, 0, 0.73611], 80: [0, 0.69444, 0, 0, 0.63889], 81: [0.125, 0.69444, 0, 0, 0.73611], 82: [0, 0.69444, 0, 0, 0.64584], 83: [0, 0.69444, 0, 0, 0.55556], 84: [0, 0.69444, 0, 0, 0.68056], 85: [0, 0.69444, 0, 0, 0.6875], 86: [0, 0.69444, 0.01389, 0, 0.66667], 87: [0, 0.69444, 0.01389, 0, 0.94445], 88: [0, 0.69444, 0, 0, 0.66667], 89: [0, 0.69444, 0.025, 0, 0.66667], 90: [0, 0.69444, 0, 0, 0.61111], 91: [0.25, 0.75, 0, 0, 0.28889], 93: [0.25, 0.75, 0, 0, 0.28889], 94: [0, 0.69444, 0, 0, 0.5], 95: [0.35, 0.09444, 0.02778, 0, 0.5], 97: [0, 0.44444, 0, 0, 0.48056], 98: [0, 0.69444, 0, 0, 0.51667], 99: [0, 0.44444, 0, 0, 0.44445], 100: [0, 0.69444, 0, 0, 0.51667], 101: [0, 0.44444, 0, 0, 0.44445], 102: [0, 0.69444, 0.06944, 0, 0.30556], 103: [0.19444, 0.44444, 0.01389, 0, 0.5], 104: [0, 0.69444, 0, 0, 0.51667], 105: [0, 0.67937, 0, 0, 0.23889], 106: [0.19444, 0.67937, 0, 0, 0.26667], 107: [0, 0.69444, 0, 0, 0.48889], 108: [0, 0.69444, 0, 0, 0.23889], 109: [0, 0.44444, 0, 0, 0.79445], 110: [0, 0.44444, 0, 0, 0.51667], 111: [0, 0.44444, 0, 0, 0.5], 112: [0.19444, 0.44444, 0, 0, 0.51667], 113: [0.19444, 0.44444, 0, 0, 0.51667], 114: [0, 0.44444, 0.01389, 0, 0.34167], 115: [0, 0.44444, 0, 0, 0.38333], 116: [0, 0.57143, 0, 0, 0.36111], 117: [0, 0.44444, 0, 0, 0.51667], 118: [0, 0.44444, 0.01389, 0, 0.46111], 119: [0, 0.44444, 0.01389, 0, 0.68334], 120: [0, 0.44444, 0, 0, 0.46111], 121: [0.19444, 0.44444, 0.01389, 0, 0.46111], 122: [0, 0.44444, 0, 0, 0.43472], 126: [0.35, 0.32659, 0, 0, 0.5], 160: [0, 0, 0, 0, 0.25], 168: [0, 0.67937, 0, 0, 0.5], 176: [0, 0.69444, 0, 0, 0.66667], 184: [0.17014, 0, 0, 0, 0.44445], 305: [0, 0.44444, 0, 0, 0.23889], 567: [0.19444, 0.44444, 0, 0, 0.26667], 710: [0, 0.69444, 0, 0, 0.5], 711: [0, 0.63194, 0, 0, 0.5], 713: [0, 0.60889, 0, 0, 0.5], 714: [0, 0.69444, 0, 0, 0.5], 715: [0, 0.69444, 0, 0, 0.5], 728: [0, 0.69444, 0, 0, 0.5], 729: [0, 0.67937, 0, 0, 0.27778], 730: [0, 0.69444, 0, 0, 0.66667], 732: [0, 0.67659, 0, 0, 0.5], 733: [0, 0.69444, 0, 0, 0.5], 915: [0, 0.69444, 0, 0, 0.54167], 916: [0, 0.69444, 0, 0, 0.83334], 920: [0, 0.69444, 0, 0, 0.77778], 923: [0, 0.69444, 0, 0, 0.61111], 926: [0, 0.69444, 0, 0, 0.66667], 928: [0, 0.69444, 0, 0, 0.70834], 931: [0, 0.69444, 0, 0, 0.72222], 933: [0, 0.69444, 0, 0, 0.77778], 934: [0, 0.69444, 0, 0, 0.72222], 936: [0, 0.69444, 0, 0, 0.77778], 937: [0, 0.69444, 0, 0, 0.72222], 8211: [0, 0.44444, 0.02778, 0, 0.5], 8212: [0, 0.44444, 0.02778, 0, 1], 8216: [0, 0.69444, 0, 0, 0.27778], 8217: [0, 0.69444, 0, 0, 0.27778], 8220: [0, 0.69444, 0, 0, 0.5], 8221: [0, 0.69444, 0, 0, 0.5] }, "Script-Regular": { 32: [0, 0, 0, 0, 0.25], 65: [0, 0.7, 0.22925, 0, 0.80253], 66: [0, 0.7, 0.04087, 0, 0.90757], 67: [0, 0.7, 0.1689, 0, 0.66619], 68: [0, 0.7, 0.09371, 0, 0.77443], 69: [0, 0.7, 0.18583, 0, 0.56162], 70: [0, 0.7, 0.13634, 0, 0.89544], 71: [0, 0.7, 0.17322, 0, 0.60961], 72: [0, 0.7, 0.29694, 0, 0.96919], 73: [0, 0.7, 0.19189, 0, 0.80907], 74: [0.27778, 0.7, 0.19189, 0, 1.05159], 75: [0, 0.7, 0.31259, 0, 0.91364], 76: [0, 0.7, 0.19189, 0, 0.87373], 77: [0, 0.7, 0.15981, 0, 1.08031], 78: [0, 0.7, 0.3525, 0, 0.9015], 79: [0, 0.7, 0.08078, 0, 0.73787], 80: [0, 0.7, 0.08078, 0, 1.01262], 81: [0, 0.7, 0.03305, 0, 0.88282], 82: [0, 0.7, 0.06259, 0, 0.85], 83: [0, 0.7, 0.19189, 0, 0.86767], 84: [0, 0.7, 0.29087, 0, 0.74697], 85: [0, 0.7, 0.25815, 0, 0.79996], 86: [0, 0.7, 0.27523, 0, 0.62204], 87: [0, 0.7, 0.27523, 0, 0.80532], 88: [0, 0.7, 0.26006, 0, 0.94445], 89: [0, 0.7, 0.2939, 0, 0.70961], 90: [0, 0.7, 0.24037, 0, 0.8212], 160: [0, 0, 0, 0, 0.25] }, "Size1-Regular": { 32: [0, 0, 0, 0, 0.25], 40: [0.35001, 0.85, 0, 0, 0.45834], 41: [0.35001, 0.85, 0, 0, 0.45834], 47: [0.35001, 0.85, 0, 0, 0.57778], 91: [0.35001, 0.85, 0, 0, 0.41667], 92: [0.35001, 0.85, 0, 0, 0.57778], 93: [0.35001, 0.85, 0, 0, 0.41667], 123: [0.35001, 0.85, 0, 0, 0.58334], 125: [0.35001, 0.85, 0, 0, 0.58334], 160: [0, 0, 0, 0, 0.25], 710: [0, 0.72222, 0, 0, 0.55556], 732: [0, 0.72222, 0, 0, 0.55556], 770: [0, 0.72222, 0, 0, 0.55556], 771: [0, 0.72222, 0, 0, 0.55556], 8214: [-99e-5, 0.601, 0, 0, 0.77778], 8593: [1e-5, 0.6, 0, 0, 0.66667], 8595: [1e-5, 0.6, 0, 0, 0.66667], 8657: [1e-5, 0.6, 0, 0, 0.77778], 8659: [1e-5, 0.6, 0, 0, 0.77778], 8719: [0.25001, 0.75, 0, 0, 0.94445], 8720: [0.25001, 0.75, 0, 0, 0.94445], 8721: [0.25001, 0.75, 0, 0, 1.05556], 8730: [0.35001, 0.85, 0, 0, 1], 8739: [-599e-5, 0.606, 0, 0, 0.33333], 8741: [-599e-5, 0.606, 0, 0, 0.55556], 8747: [0.30612, 0.805, 0.19445, 0, 0.47222], 8748: [0.306, 0.805, 0.19445, 0, 0.47222], 8749: [0.306, 0.805, 0.19445, 0, 0.47222], 8750: [0.30612, 0.805, 0.19445, 0, 0.47222], 8896: [0.25001, 0.75, 0, 0, 0.83334], 8897: [0.25001, 0.75, 0, 0, 0.83334], 8898: [0.25001, 0.75, 0, 0, 0.83334], 8899: [0.25001, 0.75, 0, 0, 0.83334], 8968: [0.35001, 0.85, 0, 0, 0.47222], 8969: [0.35001, 0.85, 0, 0, 0.47222], 8970: [0.35001, 0.85, 0, 0, 0.47222], 8971: [0.35001, 0.85, 0, 0, 0.47222], 9168: [-99e-5, 0.601, 0, 0, 0.66667], 10216: [0.35001, 0.85, 0, 0, 0.47222], 10217: [0.35001, 0.85, 0, 0, 0.47222], 10752: [0.25001, 0.75, 0, 0, 1.11111], 10753: [0.25001, 0.75, 0, 0, 1.11111], 10754: [0.25001, 0.75, 0, 0, 1.11111], 10756: [0.25001, 0.75, 0, 0, 0.83334], 10758: [0.25001, 0.75, 0, 0, 0.83334] }, "Size2-Regular": { 32: [0, 0, 0, 0, 0.25], 40: [0.65002, 1.15, 0, 0, 0.59722], 41: [0.65002, 1.15, 0, 0, 0.59722], 47: [0.65002, 1.15, 0, 0, 0.81111], 91: [0.65002, 1.15, 0, 0, 0.47222], 92: [0.65002, 1.15, 0, 0, 0.81111], 93: [0.65002, 1.15, 0, 0, 0.47222], 123: [0.65002, 1.15, 0, 0, 0.66667], 125: [0.65002, 1.15, 0, 0, 0.66667], 160: [0, 0, 0, 0, 0.25], 710: [0, 0.75, 0, 0, 1], 732: [0, 0.75, 0, 0, 1], 770: [0, 0.75, 0, 0, 1], 771: [0, 0.75, 0, 0, 1], 8719: [0.55001, 1.05, 0, 0, 1.27778], 8720: [0.55001, 1.05, 0, 0, 1.27778], 8721: [0.55001, 1.05, 0, 0, 1.44445], 8730: [0.65002, 1.15, 0, 0, 1], 8747: [0.86225, 1.36, 0.44445, 0, 0.55556], 8748: [0.862, 1.36, 0.44445, 0, 0.55556], 8749: [0.862, 1.36, 0.44445, 0, 0.55556], 8750: [0.86225, 1.36, 0.44445, 0, 0.55556], 8896: [0.55001, 1.05, 0, 0, 1.11111], 8897: [0.55001, 1.05, 0, 0, 1.11111], 8898: [0.55001, 1.05, 0, 0, 1.11111], 8899: [0.55001, 1.05, 0, 0, 1.11111], 8968: [0.65002, 1.15, 0, 0, 0.52778], 8969: [0.65002, 1.15, 0, 0, 0.52778], 8970: [0.65002, 1.15, 0, 0, 0.52778], 8971: [0.65002, 1.15, 0, 0, 0.52778], 10216: [0.65002, 1.15, 0, 0, 0.61111], 10217: [0.65002, 1.15, 0, 0, 0.61111], 10752: [0.55001, 1.05, 0, 0, 1.51112], 10753: [0.55001, 1.05, 0, 0, 1.51112], 10754: [0.55001, 1.05, 0, 0, 1.51112], 10756: [0.55001, 1.05, 0, 0, 1.11111], 10758: [0.55001, 1.05, 0, 0, 1.11111] }, "Size3-Regular": { 32: [0, 0, 0, 0, 0.25], 40: [0.95003, 1.45, 0, 0, 0.73611], 41: [0.95003, 1.45, 0, 0, 0.73611], 47: [0.95003, 1.45, 0, 0, 1.04445], 91: [0.95003, 1.45, 0, 0, 0.52778], 92: [0.95003, 1.45, 0, 0, 1.04445], 93: [0.95003, 1.45, 0, 0, 0.52778], 123: [0.95003, 1.45, 0, 0, 0.75], 125: [0.95003, 1.45, 0, 0, 0.75], 160: [0, 0, 0, 0, 0.25], 710: [0, 0.75, 0, 0, 1.44445], 732: [0, 0.75, 0, 0, 1.44445], 770: [0, 0.75, 0, 0, 1.44445], 771: [0, 0.75, 0, 0, 1.44445], 8730: [0.95003, 1.45, 0, 0, 1], 8968: [0.95003, 1.45, 0, 0, 0.58334], 8969: [0.95003, 1.45, 0, 0, 0.58334], 8970: [0.95003, 1.45, 0, 0, 0.58334], 8971: [0.95003, 1.45, 0, 0, 0.58334], 10216: [0.95003, 1.45, 0, 0, 0.75], 10217: [0.95003, 1.45, 0, 0, 0.75] }, "Size4-Regular": { 32: [0, 0, 0, 0, 0.25], 40: [1.25003, 1.75, 0, 0, 0.79167], 41: [1.25003, 1.75, 0, 0, 0.79167], 47: [1.25003, 1.75, 0, 0, 1.27778], 91: [1.25003, 1.75, 0, 0, 0.58334], 92: [1.25003, 1.75, 0, 0, 1.27778], 93: [1.25003, 1.75, 0, 0, 0.58334], 123: [1.25003, 1.75, 0, 0, 0.80556], 125: [1.25003, 1.75, 0, 0, 0.80556], 160: [0, 0, 0, 0, 0.25], 710: [0, 0.825, 0, 0, 1.8889], 732: [0, 0.825, 0, 0, 1.8889], 770: [0, 0.825, 0, 0, 1.8889], 771: [0, 0.825, 0, 0, 1.8889], 8730: [1.25003, 1.75, 0, 0, 1], 8968: [1.25003, 1.75, 0, 0, 0.63889], 8969: [1.25003, 1.75, 0, 0, 0.63889], 8970: [1.25003, 1.75, 0, 0, 0.63889], 8971: [1.25003, 1.75, 0, 0, 0.63889], 9115: [0.64502, 1.155, 0, 0, 0.875], 9116: [1e-5, 0.6, 0, 0, 0.875], 9117: [0.64502, 1.155, 0, 0, 0.875], 9118: [0.64502, 1.155, 0, 0, 0.875], 9119: [1e-5, 0.6, 0, 0, 0.875], 9120: [0.64502, 1.155, 0, 0, 0.875], 9121: [0.64502, 1.155, 0, 0, 0.66667], 9122: [-99e-5, 0.601, 0, 0, 0.66667], 9123: [0.64502, 1.155, 0, 0, 0.66667], 9124: [0.64502, 1.155, 0, 0, 0.66667], 9125: [-99e-5, 0.601, 0, 0, 0.66667], 9126: [0.64502, 1.155, 0, 0, 0.66667], 9127: [1e-5, 0.9, 0, 0, 0.88889], 9128: [0.65002, 1.15, 0, 0, 0.88889], 9129: [0.90001, 0, 0, 0, 0.88889], 9130: [0, 0.3, 0, 0, 0.88889], 9131: [1e-5, 0.9, 0, 0, 0.88889], 9132: [0.65002, 1.15, 0, 0, 0.88889], 9133: [0.90001, 0, 0, 0, 0.88889], 9143: [0.88502, 0.915, 0, 0, 1.05556], 10216: [1.25003, 1.75, 0, 0, 0.80556], 10217: [1.25003, 1.75, 0, 0, 0.80556], 57344: [-499e-5, 0.605, 0, 0, 1.05556], 57345: [-499e-5, 0.605, 0, 0, 1.05556], 57680: [0, 0.12, 0, 0, 0.45], 57681: [0, 0.12, 0, 0, 0.45], 57682: [0, 0.12, 0, 0, 0.45], 57683: [0, 0.12, 0, 0, 0.45] }, "Typewriter-Regular": { 32: [0, 0, 0, 0, 0.525], 33: [0, 0.61111, 0, 0, 0.525], 34: [0, 0.61111, 0, 0, 0.525], 35: [0, 0.61111, 0, 0, 0.525], 36: [0.08333, 0.69444, 0, 0, 0.525], 37: [0.08333, 0.69444, 0, 0, 0.525], 38: [0, 0.61111, 0, 0, 0.525], 39: [0, 0.61111, 0, 0, 0.525], 40: [0.08333, 0.69444, 0, 0, 0.525], 41: [0.08333, 0.69444, 0, 0, 0.525], 42: [0, 0.52083, 0, 0, 0.525], 43: [-0.08056, 0.53055, 0, 0, 0.525], 44: [0.13889, 0.125, 0, 0, 0.525], 45: [-0.08056, 0.53055, 0, 0, 0.525], 46: [0, 0.125, 0, 0, 0.525], 47: [0.08333, 0.69444, 0, 0, 0.525], 48: [0, 0.61111, 0, 0, 0.525], 49: [0, 0.61111, 0, 0, 0.525], 50: [0, 0.61111, 0, 0, 0.525], 51: [0, 0.61111, 0, 0, 0.525], 52: [0, 0.61111, 0, 0, 0.525], 53: [0, 0.61111, 0, 0, 0.525], 54: [0, 0.61111, 0, 0, 0.525], 55: [0, 0.61111, 0, 0, 0.525], 56: [0, 0.61111, 0, 0, 0.525], 57: [0, 0.61111, 0, 0, 0.525], 58: [0, 0.43056, 0, 0, 0.525], 59: [0.13889, 0.43056, 0, 0, 0.525], 60: [-0.05556, 0.55556, 0, 0, 0.525], 61: [-0.19549, 0.41562, 0, 0, 0.525], 62: [-0.05556, 0.55556, 0, 0, 0.525], 63: [0, 0.61111, 0, 0, 0.525], 64: [0, 0.61111, 0, 0, 0.525], 65: [0, 0.61111, 0, 0, 0.525], 66: [0, 0.61111, 0, 0, 0.525], 67: [0, 0.61111, 0, 0, 0.525], 68: [0, 0.61111, 0, 0, 0.525], 69: [0, 0.61111, 0, 0, 0.525], 70: [0, 0.61111, 0, 0, 0.525], 71: [0, 0.61111, 0, 0, 0.525], 72: [0, 0.61111, 0, 0, 0.525], 73: [0, 0.61111, 0, 0, 0.525], 74: [0, 0.61111, 0, 0, 0.525], 75: [0, 0.61111, 0, 0, 0.525], 76: [0, 0.61111, 0, 0, 0.525], 77: [0, 0.61111, 0, 0, 0.525], 78: [0, 0.61111, 0, 0, 0.525], 79: [0, 0.61111, 0, 0, 0.525], 80: [0, 0.61111, 0, 0, 0.525], 81: [0.13889, 0.61111, 0, 0, 0.525], 82: [0, 0.61111, 0, 0, 0.525], 83: [0, 0.61111, 0, 0, 0.525], 84: [0, 0.61111, 0, 0, 0.525], 85: [0, 0.61111, 0, 0, 0.525], 86: [0, 0.61111, 0, 0, 0.525], 87: [0, 0.61111, 0, 0, 0.525], 88: [0, 0.61111, 0, 0, 0.525], 89: [0, 0.61111, 0, 0, 0.525], 90: [0, 0.61111, 0, 0, 0.525], 91: [0.08333, 0.69444, 0, 0, 0.525], 92: [0.08333, 0.69444, 0, 0, 0.525], 93: [0.08333, 0.69444, 0, 0, 0.525], 94: [0, 0.61111, 0, 0, 0.525], 95: [0.09514, 0, 0, 0, 0.525], 96: [0, 0.61111, 0, 0, 0.525], 97: [0, 0.43056, 0, 0, 0.525], 98: [0, 0.61111, 0, 0, 0.525], 99: [0, 0.43056, 0, 0, 0.525], 100: [0, 0.61111, 0, 0, 0.525], 101: [0, 0.43056, 0, 0, 0.525], 102: [0, 0.61111, 0, 0, 0.525], 103: [0.22222, 0.43056, 0, 0, 0.525], 104: [0, 0.61111, 0, 0, 0.525], 105: [0, 0.61111, 0, 0, 0.525], 106: [0.22222, 0.61111, 0, 0, 0.525], 107: [0, 0.61111, 0, 0, 0.525], 108: [0, 0.61111, 0, 0, 0.525], 109: [0, 0.43056, 0, 0, 0.525], 110: [0, 0.43056, 0, 0, 0.525], 111: [0, 0.43056, 0, 0, 0.525], 112: [0.22222, 0.43056, 0, 0, 0.525], 113: [0.22222, 0.43056, 0, 0, 0.525], 114: [0, 0.43056, 0, 0, 0.525], 115: [0, 0.43056, 0, 0, 0.525], 116: [0, 0.55358, 0, 0, 0.525], 117: [0, 0.43056, 0, 0, 0.525], 118: [0, 0.43056, 0, 0, 0.525], 119: [0, 0.43056, 0, 0, 0.525], 120: [0, 0.43056, 0, 0, 0.525], 121: [0.22222, 0.43056, 0, 0, 0.525], 122: [0, 0.43056, 0, 0, 0.525], 123: [0.08333, 0.69444, 0, 0, 0.525], 124: [0.08333, 0.69444, 0, 0, 0.525], 125: [0.08333, 0.69444, 0, 0, 0.525], 126: [0, 0.61111, 0, 0, 0.525], 127: [0, 0.61111, 0, 0, 0.525], 160: [0, 0, 0, 0, 0.525], 176: [0, 0.61111, 0, 0, 0.525], 184: [0.19445, 0, 0, 0, 0.525], 305: [0, 0.43056, 0, 0, 0.525], 567: [0.22222, 0.43056, 0, 0, 0.525], 711: [0, 0.56597, 0, 0, 0.525], 713: [0, 0.56555, 0, 0, 0.525], 714: [0, 0.61111, 0, 0, 0.525], 715: [0, 0.61111, 0, 0, 0.525], 728: [0, 0.61111, 0, 0, 0.525], 730: [0, 0.61111, 0, 0, 0.525], 770: [0, 0.61111, 0, 0, 0.525], 771: [0, 0.61111, 0, 0, 0.525], 776: [0, 0.61111, 0, 0, 0.525], 915: [0, 0.61111, 0, 0, 0.525], 916: [0, 0.61111, 0, 0, 0.525], 920: [0, 0.61111, 0, 0, 0.525], 923: [0, 0.61111, 0, 0, 0.525], 926: [0, 0.61111, 0, 0, 0.525], 928: [0, 0.61111, 0, 0, 0.525], 931: [0, 0.61111, 0, 0, 0.525], 933: [0, 0.61111, 0, 0, 0.525], 934: [0, 0.61111, 0, 0, 0.525], 936: [0, 0.61111, 0, 0, 0.525], 937: [0, 0.61111, 0, 0, 0.525], 8216: [0, 0.61111, 0, 0, 0.525], 8217: [0, 0.61111, 0, 0, 0.525], 8242: [0, 0.61111, 0, 0, 0.525], 9251: [0.11111, 0.21944, 0, 0, 0.525] } }, Io = { slant: [0.25, 0.25, 0.25], space: [0, 0, 0], stretch: [0, 0, 0], shrink: [0, 0, 0], xHeight: [0.431, 0.431, 0.431], quad: [1, 1.171, 1.472], extraSpace: [0, 0, 0], num1: [0.677, 0.732, 0.925], num2: [0.394, 0.384, 0.387], num3: [0.444, 0.471, 0.504], denom1: [0.686, 0.752, 1.025], denom2: [0.345, 0.344, 0.532], sup1: [0.413, 0.503, 0.504], sup2: [0.363, 0.431, 0.404], sup3: [0.289, 0.286, 0.294], sub1: [0.15, 0.143, 0.2], sub2: [0.247, 0.286, 0.4], supDrop: [0.386, 0.353, 0.494], subDrop: [0.05, 0.071, 0.1], delim1: [2.39, 1.7, 1.98], delim2: [1.01, 1.157, 1.42], axisHeight: [0.25, 0.25, 0.25], defaultRuleThickness: [0.04, 0.049, 0.049], bigOpSpacing1: [0.111, 0.111, 0.111], bigOpSpacing2: [0.166, 0.166, 0.166], bigOpSpacing3: [0.2, 0.2, 0.2], bigOpSpacing4: [0.6, 0.611, 0.611], bigOpSpacing5: [0.1, 0.143, 0.143], sqrtRuleThickness: [0.04, 0.04, 0.04], ptPerEm: [10, 10, 10], doubleRuleSep: [0.2, 0.2, 0.2], arrayRuleWidth: [0.04, 0.04, 0.04], fboxsep: [0.3, 0.3, 0.3], fboxrule: [0.04, 0.04, 0.04] }, Po = { "Å": "A", "Ç": "C", "Ð": "D", "Þ": "o", "å": "a", "ç": "c", "ð": "d", "þ": "o", "А": "A", "Б": "B", "В": "B", "Г": "F", "Д": "A", "Е": "E", "Ж": "K", "З": "3", "И": "N", "Й": "N", "К": "K", "Л": "N", "М": "M", "Н": "H", "О": "O", "П": "N", "Р": "P", "С": "C", "Т": "T", "У": "y", "Ф": "O", "Х": "X", "Ц": "U", "Ч": "h", "Ш": "W", "Щ": "W", "Ъ": "B", "Ы": "X", "Ь": "B", "Э": "3", "Ю": "X", "Я": "R", "а": "a", "б": "b", "в": "a", "г": "r", "д": "y", "е": "e", "ж": "m", "з": "e", "и": "n", "й": "n", "к": "n", "л": "n", "м": "m", "н": "n", "о": "o", "п": "n", "р": "p", "с": "c", "т": "o", "у": "y", "ф": "b", "х": "x", "ц": "n", "ч": "n", "ш": "w", "щ": "w", "ъ": "a", "ы": "m", "ь": "a", "э": "e", "ю": "m", "я": "r" };
function jo(e6, t2, r2) {
  if (!Vo[t2]) throw new Error("Font metrics not found for font: " + t2 + ".");
  var n2 = e6.charCodeAt(0), i2 = Vo[t2][n2];
  if (!i2 && e6[0] in Po && (n2 = Po[e6[0]].charCodeAt(0), i2 = Vo[t2][n2]), i2 || "text" !== r2 || Ao(n2) && (i2 = Vo[t2][77]), i2) return { depth: i2[0], height: i2[1], italic: i2[2], skew: i2[3], width: i2[4] };
}
var Go = {};
var Uo = { bin: 1, close: 1, inner: 1, open: 1, punct: 1, rel: 1 }, Yo = { "accent-token": 1, mathord: 1, "op-token": 1, spacing: 1, textord: 1 }, Xo = { math: {}, text: {} };
function Wo(e6, t2, r2, n2, i2, o2) {
  Xo[e6][i2] = { font: t2, group: r2, replace: n2 }, o2 && n2 && (Xo[e6][n2] = Xo[e6][i2]);
}
var $o = "math", Zo = "text", Jo = "main", Ko = "ams", Qo = "accent-token", ea = "bin", ta = "close", ra = "inner", na = "mathord", ia = "op-token", oa = "open", aa = "punct", sa = "rel", la = "spacing", ua = "textord";
Wo($o, Jo, sa, "≡", "\\equiv", true), Wo($o, Jo, sa, "≺", "\\prec", true), Wo($o, Jo, sa, "≻", "\\succ", true), Wo($o, Jo, sa, "∼", "\\sim", true), Wo($o, Jo, sa, "⊥", "\\perp"), Wo($o, Jo, sa, "⪯", "\\preceq", true), Wo($o, Jo, sa, "⪰", "\\succeq", true), Wo($o, Jo, sa, "≃", "\\simeq", true), Wo($o, Jo, sa, "∣", "\\mid", true), Wo($o, Jo, sa, "≪", "\\ll", true), Wo($o, Jo, sa, "≫", "\\gg", true), Wo($o, Jo, sa, "≍", "\\asymp", true), Wo($o, Jo, sa, "∥", "\\parallel"), Wo($o, Jo, sa, "⋈", "\\bowtie", true), Wo($o, Jo, sa, "⌣", "\\smile", true), Wo($o, Jo, sa, "⊑", "\\sqsubseteq", true), Wo($o, Jo, sa, "⊒", "\\sqsupseteq", true), Wo($o, Jo, sa, "≐", "\\doteq", true), Wo($o, Jo, sa, "⌢", "\\frown", true), Wo($o, Jo, sa, "∋", "\\ni", true), Wo($o, Jo, sa, "∝", "\\propto", true), Wo($o, Jo, sa, "⊢", "\\vdash", true), Wo($o, Jo, sa, "⊣", "\\dashv", true), Wo($o, Jo, sa, "∋", "\\owns"), Wo($o, Jo, aa, ".", "\\ldotp"), Wo($o, Jo, aa, "⋅", "\\cdotp"), Wo($o, Jo, ua, "#", "\\#"), Wo(Zo, Jo, ua, "#", "\\#"), Wo($o, Jo, ua, "&", "\\&"), Wo(Zo, Jo, ua, "&", "\\&"), Wo($o, Jo, ua, "ℵ", "\\aleph", true), Wo($o, Jo, ua, "∀", "\\forall", true), Wo($o, Jo, ua, "ℏ", "\\hbar", true), Wo($o, Jo, ua, "∃", "\\exists", true), Wo($o, Jo, ua, "∇", "\\nabla", true), Wo($o, Jo, ua, "♭", "\\flat", true), Wo($o, Jo, ua, "ℓ", "\\ell", true), Wo($o, Jo, ua, "♮", "\\natural", true), Wo($o, Jo, ua, "♣", "\\clubsuit", true), Wo($o, Jo, ua, "℘", "\\wp", true), Wo($o, Jo, ua, "♯", "\\sharp", true), Wo($o, Jo, ua, "♢", "\\diamondsuit", true), Wo($o, Jo, ua, "ℜ", "\\Re", true), Wo($o, Jo, ua, "♡", "\\heartsuit", true), Wo($o, Jo, ua, "ℑ", "\\Im", true), Wo($o, Jo, ua, "♠", "\\spadesuit", true), Wo($o, Jo, ua, "§", "\\S", true), Wo(Zo, Jo, ua, "§", "\\S"), Wo($o, Jo, ua, "¶", "\\P", true), Wo(Zo, Jo, ua, "¶", "\\P"), Wo($o, Jo, ua, "†", "\\dag"), Wo(Zo, Jo, ua, "†", "\\dag"), Wo(Zo, Jo, ua, "†", "\\textdagger"), Wo($o, Jo, ua, "‡", "\\ddag"), Wo(Zo, Jo, ua, "‡", "\\ddag"), Wo(Zo, Jo, ua, "‡", "\\textdaggerdbl"), Wo($o, Jo, ta, "⎱", "\\rmoustache", true), Wo($o, Jo, oa, "⎰", "\\lmoustache", true), Wo($o, Jo, ta, "⟯", "\\rgroup", true), Wo($o, Jo, oa, "⟮", "\\lgroup", true), Wo($o, Jo, ea, "∓", "\\mp", true), Wo($o, Jo, ea, "⊖", "\\ominus", true), Wo($o, Jo, ea, "⊎", "\\uplus", true), Wo($o, Jo, ea, "⊓", "\\sqcap", true), Wo($o, Jo, ea, "∗", "\\ast"), Wo($o, Jo, ea, "⊔", "\\sqcup", true), Wo($o, Jo, ea, "◯", "\\bigcirc", true), Wo($o, Jo, ea, "∙", "\\bullet"), Wo($o, Jo, ea, "‡", "\\ddagger"), Wo($o, Jo, ea, "≀", "\\wr", true), Wo($o, Jo, ea, "⨿", "\\amalg"), Wo($o, Jo, ea, "&", "\\And"), Wo($o, Jo, sa, "⟵", "\\longleftarrow", true), Wo($o, Jo, sa, "⇐", "\\Leftarrow", true), Wo($o, Jo, sa, "⟸", "\\Longleftarrow", true), Wo($o, Jo, sa, "⟶", "\\longrightarrow", true), Wo($o, Jo, sa, "⇒", "\\Rightarrow", true), Wo($o, Jo, sa, "⟹", "\\Longrightarrow", true), Wo($o, Jo, sa, "↔", "\\leftrightarrow", true), Wo($o, Jo, sa, "⟷", "\\longleftrightarrow", true), Wo($o, Jo, sa, "⇔", "\\Leftrightarrow", true), Wo($o, Jo, sa, "⟺", "\\Longleftrightarrow", true), Wo($o, Jo, sa, "↦", "\\mapsto", true), Wo($o, Jo, sa, "⟼", "\\longmapsto", true), Wo($o, Jo, sa, "↗", "\\nearrow", true), Wo($o, Jo, sa, "↩", "\\hookleftarrow", true), Wo($o, Jo, sa, "↪", "\\hookrightarrow", true), Wo($o, Jo, sa, "↘", "\\searrow", true), Wo($o, Jo, sa, "↼", "\\leftharpoonup", true), Wo($o, Jo, sa, "⇀", "\\rightharpoonup", true), Wo($o, Jo, sa, "↙", "\\swarrow", true), Wo($o, Jo, sa, "↽", "\\leftharpoondown", true), Wo($o, Jo, sa, "⇁", "\\rightharpoondown", true), Wo($o, Jo, sa, "↖", "\\nwarrow", true), Wo($o, Jo, sa, "⇌", "\\rightleftharpoons", true), Wo($o, Ko, sa, "≮", "\\nless", true), Wo($o, Ko, sa, "", "\\@nleqslant"), Wo($o, Ko, sa, "", "\\@nleqq"), Wo($o, Ko, sa, "⪇", "\\lneq", true), Wo($o, Ko, sa, "≨", "\\lneqq", true), Wo($o, Ko, sa, "", "\\@lvertneqq"), Wo($o, Ko, sa, "⋦", "\\lnsim", true), Wo($o, Ko, sa, "⪉", "\\lnapprox", true), Wo($o, Ko, sa, "⊀", "\\nprec", true), Wo($o, Ko, sa, "⋠", "\\npreceq", true), Wo($o, Ko, sa, "⋨", "\\precnsim", true), Wo($o, Ko, sa, "⪹", "\\precnapprox", true), Wo($o, Ko, sa, "≁", "\\nsim", true), Wo($o, Ko, sa, "", "\\@nshortmid"), Wo($o, Ko, sa, "∤", "\\nmid", true), Wo($o, Ko, sa, "⊬", "\\nvdash", true), Wo($o, Ko, sa, "⊭", "\\nvDash", true), Wo($o, Ko, sa, "⋪", "\\ntriangleleft"), Wo($o, Ko, sa, "⋬", "\\ntrianglelefteq", true), Wo($o, Ko, sa, "⊊", "\\subsetneq", true), Wo($o, Ko, sa, "", "\\@varsubsetneq"), Wo($o, Ko, sa, "⫋", "\\subsetneqq", true), Wo($o, Ko, sa, "", "\\@varsubsetneqq"), Wo($o, Ko, sa, "≯", "\\ngtr", true), Wo($o, Ko, sa, "", "\\@ngeqslant"), Wo($o, Ko, sa, "", "\\@ngeqq"), Wo($o, Ko, sa, "⪈", "\\gneq", true), Wo($o, Ko, sa, "≩", "\\gneqq", true), Wo($o, Ko, sa, "", "\\@gvertneqq"), Wo($o, Ko, sa, "⋧", "\\gnsim", true), Wo($o, Ko, sa, "⪊", "\\gnapprox", true), Wo($o, Ko, sa, "⊁", "\\nsucc", true), Wo($o, Ko, sa, "⋡", "\\nsucceq", true), Wo($o, Ko, sa, "⋩", "\\succnsim", true), Wo($o, Ko, sa, "⪺", "\\succnapprox", true), Wo($o, Ko, sa, "≆", "\\ncong", true), Wo($o, Ko, sa, "", "\\@nshortparallel"), Wo($o, Ko, sa, "∦", "\\nparallel", true), Wo($o, Ko, sa, "⊯", "\\nVDash", true), Wo($o, Ko, sa, "⋫", "\\ntriangleright"), Wo($o, Ko, sa, "⋭", "\\ntrianglerighteq", true), Wo($o, Ko, sa, "", "\\@nsupseteqq"), Wo($o, Ko, sa, "⊋", "\\supsetneq", true), Wo($o, Ko, sa, "", "\\@varsupsetneq"), Wo($o, Ko, sa, "⫌", "\\supsetneqq", true), Wo($o, Ko, sa, "", "\\@varsupsetneqq"), Wo($o, Ko, sa, "⊮", "\\nVdash", true), Wo($o, Ko, sa, "⪵", "\\precneqq", true), Wo($o, Ko, sa, "⪶", "\\succneqq", true), Wo($o, Ko, sa, "", "\\@nsubseteqq"), Wo($o, Ko, ea, "⊴", "\\unlhd"), Wo($o, Ko, ea, "⊵", "\\unrhd"), Wo($o, Ko, sa, "↚", "\\nleftarrow", true), Wo($o, Ko, sa, "↛", "\\nrightarrow", true), Wo($o, Ko, sa, "⇍", "\\nLeftarrow", true), Wo($o, Ko, sa, "⇏", "\\nRightarrow", true), Wo($o, Ko, sa, "↮", "\\nleftrightarrow", true), Wo($o, Ko, sa, "⇎", "\\nLeftrightarrow", true), Wo($o, Ko, sa, "△", "\\vartriangle"), Wo($o, Ko, ua, "ℏ", "\\hslash"), Wo($o, Ko, ua, "▽", "\\triangledown"), Wo($o, Ko, ua, "◊", "\\lozenge"), Wo($o, Ko, ua, "Ⓢ", "\\circledS"), Wo($o, Ko, ua, "®", "\\circledR"), Wo(Zo, Ko, ua, "®", "\\circledR"), Wo($o, Ko, ua, "∡", "\\measuredangle", true), Wo($o, Ko, ua, "∄", "\\nexists"), Wo($o, Ko, ua, "℧", "\\mho"), Wo($o, Ko, ua, "Ⅎ", "\\Finv", true), Wo($o, Ko, ua, "⅁", "\\Game", true), Wo($o, Ko, ua, "‵", "\\backprime"), Wo($o, Ko, ua, "▲", "\\blacktriangle"), Wo($o, Ko, ua, "▼", "\\blacktriangledown"), Wo($o, Ko, ua, "■", "\\blacksquare"), Wo($o, Ko, ua, "⧫", "\\blacklozenge"), Wo($o, Ko, ua, "★", "\\bigstar"), Wo($o, Ko, ua, "∢", "\\sphericalangle", true), Wo($o, Ko, ua, "∁", "\\complement", true), Wo($o, Ko, ua, "ð", "\\eth", true), Wo(Zo, Jo, ua, "ð", "ð"), Wo($o, Ko, ua, "╱", "\\diagup"), Wo($o, Ko, ua, "╲", "\\diagdown"), Wo($o, Ko, ua, "□", "\\square"), Wo($o, Ko, ua, "□", "\\Box"), Wo($o, Ko, ua, "◊", "\\Diamond"), Wo($o, Ko, ua, "¥", "\\yen", true), Wo(Zo, Ko, ua, "¥", "\\yen", true), Wo($o, Ko, ua, "✓", "\\checkmark", true), Wo(Zo, Ko, ua, "✓", "\\checkmark"), Wo($o, Ko, ua, "ℶ", "\\beth", true), Wo($o, Ko, ua, "ℸ", "\\daleth", true), Wo($o, Ko, ua, "ℷ", "\\gimel", true), Wo($o, Ko, ua, "ϝ", "\\digamma", true), Wo($o, Ko, ua, "ϰ", "\\varkappa"), Wo($o, Ko, oa, "┌", "\\@ulcorner", true), Wo($o, Ko, ta, "┐", "\\@urcorner", true), Wo($o, Ko, oa, "└", "\\@llcorner", true), Wo($o, Ko, ta, "┘", "\\@lrcorner", true), Wo($o, Ko, sa, "≦", "\\leqq", true), Wo($o, Ko, sa, "⩽", "\\leqslant", true), Wo($o, Ko, sa, "⪕", "\\eqslantless", true), Wo($o, Ko, sa, "≲", "\\lesssim", true), Wo($o, Ko, sa, "⪅", "\\lessapprox", true), Wo($o, Ko, sa, "≊", "\\approxeq", true), Wo($o, Ko, ea, "⋖", "\\lessdot"), Wo($o, Ko, sa, "⋘", "\\lll", true), Wo($o, Ko, sa, "≶", "\\lessgtr", true), Wo($o, Ko, sa, "⋚", "\\lesseqgtr", true), Wo($o, Ko, sa, "⪋", "\\lesseqqgtr", true), Wo($o, Ko, sa, "≑", "\\doteqdot"), Wo($o, Ko, sa, "≓", "\\risingdotseq", true), Wo($o, Ko, sa, "≒", "\\fallingdotseq", true), Wo($o, Ko, sa, "∽", "\\backsim", true), Wo($o, Ko, sa, "⋍", "\\backsimeq", true), Wo($o, Ko, sa, "⫅", "\\subseteqq", true), Wo($o, Ko, sa, "⋐", "\\Subset", true), Wo($o, Ko, sa, "⊏", "\\sqsubset", true), Wo($o, Ko, sa, "≼", "\\preccurlyeq", true), Wo($o, Ko, sa, "⋞", "\\curlyeqprec", true), Wo($o, Ko, sa, "≾", "\\precsim", true), Wo($o, Ko, sa, "⪷", "\\precapprox", true), Wo($o, Ko, sa, "⊲", "\\vartriangleleft"), Wo($o, Ko, sa, "⊴", "\\trianglelefteq"), Wo($o, Ko, sa, "⊨", "\\vDash", true), Wo($o, Ko, sa, "⊪", "\\Vvdash", true), Wo($o, Ko, sa, "⌣", "\\smallsmile"), Wo($o, Ko, sa, "⌢", "\\smallfrown"), Wo($o, Ko, sa, "≏", "\\bumpeq", true), Wo($o, Ko, sa, "≎", "\\Bumpeq", true), Wo($o, Ko, sa, "≧", "\\geqq", true), Wo($o, Ko, sa, "⩾", "\\geqslant", true), Wo($o, Ko, sa, "⪖", "\\eqslantgtr", true), Wo($o, Ko, sa, "≳", "\\gtrsim", true), Wo($o, Ko, sa, "⪆", "\\gtrapprox", true), Wo($o, Ko, ea, "⋗", "\\gtrdot"), Wo($o, Ko, sa, "⋙", "\\ggg", true), Wo($o, Ko, sa, "≷", "\\gtrless", true), Wo($o, Ko, sa, "⋛", "\\gtreqless", true), Wo($o, Ko, sa, "⪌", "\\gtreqqless", true), Wo($o, Ko, sa, "≖", "\\eqcirc", true), Wo($o, Ko, sa, "≗", "\\circeq", true), Wo($o, Ko, sa, "≜", "\\triangleq", true), Wo($o, Ko, sa, "∼", "\\thicksim"), Wo($o, Ko, sa, "≈", "\\thickapprox"), Wo($o, Ko, sa, "⫆", "\\supseteqq", true), Wo($o, Ko, sa, "⋑", "\\Supset", true), Wo($o, Ko, sa, "⊐", "\\sqsupset", true), Wo($o, Ko, sa, "≽", "\\succcurlyeq", true), Wo($o, Ko, sa, "⋟", "\\curlyeqsucc", true), Wo($o, Ko, sa, "≿", "\\succsim", true), Wo($o, Ko, sa, "⪸", "\\succapprox", true), Wo($o, Ko, sa, "⊳", "\\vartriangleright"), Wo($o, Ko, sa, "⊵", "\\trianglerighteq"), Wo($o, Ko, sa, "⊩", "\\Vdash", true), Wo($o, Ko, sa, "∣", "\\shortmid"), Wo($o, Ko, sa, "∥", "\\shortparallel"), Wo($o, Ko, sa, "≬", "\\between", true), Wo($o, Ko, sa, "⋔", "\\pitchfork", true), Wo($o, Ko, sa, "∝", "\\varpropto"), Wo($o, Ko, sa, "◀", "\\blacktriangleleft"), Wo($o, Ko, sa, "∴", "\\therefore", true), Wo($o, Ko, sa, "∍", "\\backepsilon"), Wo($o, Ko, sa, "▶", "\\blacktriangleright"), Wo($o, Ko, sa, "∵", "\\because", true), Wo($o, Ko, sa, "⋘", "\\llless"), Wo($o, Ko, sa, "⋙", "\\gggtr"), Wo($o, Ko, ea, "⊲", "\\lhd"), Wo($o, Ko, ea, "⊳", "\\rhd"), Wo($o, Ko, sa, "≂", "\\eqsim", true), Wo($o, Jo, sa, "⋈", "\\Join"), Wo($o, Ko, sa, "≑", "\\Doteq", true), Wo($o, Ko, ea, "∔", "\\dotplus", true), Wo($o, Ko, ea, "∖", "\\smallsetminus"), Wo($o, Ko, ea, "⋒", "\\Cap", true), Wo($o, Ko, ea, "⋓", "\\Cup", true), Wo($o, Ko, ea, "⩞", "\\doublebarwedge", true), Wo($o, Ko, ea, "⊟", "\\boxminus", true), Wo($o, Ko, ea, "⊞", "\\boxplus", true), Wo($o, Ko, ea, "⋇", "\\divideontimes", true), Wo($o, Ko, ea, "⋉", "\\ltimes", true), Wo($o, Ko, ea, "⋊", "\\rtimes", true), Wo($o, Ko, ea, "⋋", "\\leftthreetimes", true), Wo($o, Ko, ea, "⋌", "\\rightthreetimes", true), Wo($o, Ko, ea, "⋏", "\\curlywedge", true), Wo($o, Ko, ea, "⋎", "\\curlyvee", true), Wo($o, Ko, ea, "⊝", "\\circleddash", true), Wo($o, Ko, ea, "⊛", "\\circledast", true), Wo($o, Ko, ea, "⋅", "\\centerdot"), Wo($o, Ko, ea, "⊺", "\\intercal", true), Wo($o, Ko, ea, "⋒", "\\doublecap"), Wo($o, Ko, ea, "⋓", "\\doublecup"), Wo($o, Ko, ea, "⊠", "\\boxtimes", true), Wo($o, Ko, sa, "⇢", "\\dashrightarrow", true), Wo($o, Ko, sa, "⇠", "\\dashleftarrow", true), Wo($o, Ko, sa, "⇇", "\\leftleftarrows", true), Wo($o, Ko, sa, "⇆", "\\leftrightarrows", true), Wo($o, Ko, sa, "⇚", "\\Lleftarrow", true), Wo($o, Ko, sa, "↞", "\\twoheadleftarrow", true), Wo($o, Ko, sa, "↢", "\\leftarrowtail", true), Wo($o, Ko, sa, "↫", "\\looparrowleft", true), Wo($o, Ko, sa, "⇋", "\\leftrightharpoons", true), Wo($o, Ko, sa, "↶", "\\curvearrowleft", true), Wo($o, Ko, sa, "↺", "\\circlearrowleft", true), Wo($o, Ko, sa, "↰", "\\Lsh", true), Wo($o, Ko, sa, "⇈", "\\upuparrows", true), Wo($o, Ko, sa, "↿", "\\upharpoonleft", true), Wo($o, Ko, sa, "⇃", "\\downharpoonleft", true), Wo($o, Jo, sa, "⊶", "\\origof", true), Wo($o, Jo, sa, "⊷", "\\imageof", true), Wo($o, Ko, sa, "⊸", "\\multimap", true), Wo($o, Ko, sa, "↭", "\\leftrightsquigarrow", true), Wo($o, Ko, sa, "⇉", "\\rightrightarrows", true), Wo($o, Ko, sa, "⇄", "\\rightleftarrows", true), Wo($o, Ko, sa, "↠", "\\twoheadrightarrow", true), Wo($o, Ko, sa, "↣", "\\rightarrowtail", true), Wo($o, Ko, sa, "↬", "\\looparrowright", true), Wo($o, Ko, sa, "↷", "\\curvearrowright", true), Wo($o, Ko, sa, "↻", "\\circlearrowright", true), Wo($o, Ko, sa, "↱", "\\Rsh", true), Wo($o, Ko, sa, "⇊", "\\downdownarrows", true), Wo($o, Ko, sa, "↾", "\\upharpoonright", true), Wo($o, Ko, sa, "⇂", "\\downharpoonright", true), Wo($o, Ko, sa, "⇝", "\\rightsquigarrow", true), Wo($o, Ko, sa, "⇝", "\\leadsto"), Wo($o, Ko, sa, "⇛", "\\Rrightarrow", true), Wo($o, Ko, sa, "↾", "\\restriction"), Wo($o, Jo, ua, "‘", "`"), Wo($o, Jo, ua, "$", "\\$"), Wo(Zo, Jo, ua, "$", "\\$"), Wo(Zo, Jo, ua, "$", "\\textdollar"), Wo($o, Jo, ua, "%", "\\%"), Wo(Zo, Jo, ua, "%", "\\%"), Wo($o, Jo, ua, "_", "\\_"), Wo(Zo, Jo, ua, "_", "\\_"), Wo(Zo, Jo, ua, "_", "\\textunderscore"), Wo($o, Jo, ua, "∠", "\\angle", true), Wo($o, Jo, ua, "∞", "\\infty", true), Wo($o, Jo, ua, "′", "\\prime"), Wo($o, Jo, ua, "△", "\\triangle"), Wo($o, Jo, ua, "Γ", "\\Gamma", true), Wo($o, Jo, ua, "Δ", "\\Delta", true), Wo($o, Jo, ua, "Θ", "\\Theta", true), Wo($o, Jo, ua, "Λ", "\\Lambda", true), Wo($o, Jo, ua, "Ξ", "\\Xi", true), Wo($o, Jo, ua, "Π", "\\Pi", true), Wo($o, Jo, ua, "Σ", "\\Sigma", true), Wo($o, Jo, ua, "Υ", "\\Upsilon", true), Wo($o, Jo, ua, "Φ", "\\Phi", true), Wo($o, Jo, ua, "Ψ", "\\Psi", true), Wo($o, Jo, ua, "Ω", "\\Omega", true), Wo($o, Jo, ua, "A", "Α"), Wo($o, Jo, ua, "B", "Β"), Wo($o, Jo, ua, "E", "Ε"), Wo($o, Jo, ua, "Z", "Ζ"), Wo($o, Jo, ua, "H", "Η"), Wo($o, Jo, ua, "I", "Ι"), Wo($o, Jo, ua, "K", "Κ"), Wo($o, Jo, ua, "M", "Μ"), Wo($o, Jo, ua, "N", "Ν"), Wo($o, Jo, ua, "O", "Ο"), Wo($o, Jo, ua, "P", "Ρ"), Wo($o, Jo, ua, "T", "Τ"), Wo($o, Jo, ua, "X", "Χ"), Wo($o, Jo, ua, "¬", "\\neg", true), Wo($o, Jo, ua, "¬", "\\lnot"), Wo($o, Jo, ua, "⊤", "\\top"), Wo($o, Jo, ua, "⊥", "\\bot"), Wo($o, Jo, ua, "∅", "\\emptyset"), Wo($o, Ko, ua, "∅", "\\varnothing"), Wo($o, Jo, na, "α", "\\alpha", true), Wo($o, Jo, na, "β", "\\beta", true), Wo($o, Jo, na, "γ", "\\gamma", true), Wo($o, Jo, na, "δ", "\\delta", true), Wo($o, Jo, na, "ϵ", "\\epsilon", true), Wo($o, Jo, na, "ζ", "\\zeta", true), Wo($o, Jo, na, "η", "\\eta", true), Wo($o, Jo, na, "θ", "\\theta", true), Wo($o, Jo, na, "ι", "\\iota", true), Wo($o, Jo, na, "κ", "\\kappa", true), Wo($o, Jo, na, "λ", "\\lambda", true), Wo($o, Jo, na, "μ", "\\mu", true), Wo($o, Jo, na, "ν", "\\nu", true), Wo($o, Jo, na, "ξ", "\\xi", true), Wo($o, Jo, na, "ο", "\\omicron", true), Wo($o, Jo, na, "π", "\\pi", true), Wo($o, Jo, na, "ρ", "\\rho", true), Wo($o, Jo, na, "σ", "\\sigma", true), Wo($o, Jo, na, "τ", "\\tau", true), Wo($o, Jo, na, "υ", "\\upsilon", true), Wo($o, Jo, na, "ϕ", "\\phi", true), Wo($o, Jo, na, "χ", "\\chi", true), Wo($o, Jo, na, "ψ", "\\psi", true), Wo($o, Jo, na, "ω", "\\omega", true), Wo($o, Jo, na, "ε", "\\varepsilon", true), Wo($o, Jo, na, "ϑ", "\\vartheta", true), Wo($o, Jo, na, "ϖ", "\\varpi", true), Wo($o, Jo, na, "ϱ", "\\varrho", true), Wo($o, Jo, na, "ς", "\\varsigma", true), Wo($o, Jo, na, "φ", "\\varphi", true), Wo($o, Jo, ea, "∗", "*"), Wo($o, Jo, ea, "+", "+"), Wo($o, Jo, ea, "−", "-"), Wo($o, Jo, ea, "⋅", "\\cdot", true), Wo($o, Jo, ea, "∘", "\\circ"), Wo($o, Jo, ea, "÷", "\\div", true), Wo($o, Jo, ea, "±", "\\pm", true), Wo($o, Jo, ea, "×", "\\times", true), Wo($o, Jo, ea, "∩", "\\cap", true), Wo($o, Jo, ea, "∪", "\\cup", true), Wo($o, Jo, ea, "∖", "\\setminus"), Wo($o, Jo, ea, "∧", "\\land"), Wo($o, Jo, ea, "∨", "\\lor"), Wo($o, Jo, ea, "∧", "\\wedge", true), Wo($o, Jo, ea, "∨", "\\vee", true), Wo($o, Jo, ua, "√", "\\surd"), Wo($o, Jo, oa, "⟨", "\\langle", true), Wo($o, Jo, oa, "∣", "\\lvert"), Wo($o, Jo, oa, "∥", "\\lVert"), Wo($o, Jo, ta, "?", "?"), Wo($o, Jo, ta, "!", "!"), Wo($o, Jo, ta, "⟩", "\\rangle", true), Wo($o, Jo, ta, "∣", "\\rvert"), Wo($o, Jo, ta, "∥", "\\rVert"), Wo($o, Jo, sa, "=", "="), Wo($o, Jo, sa, ":", ":"), Wo($o, Jo, sa, "≈", "\\approx", true), Wo($o, Jo, sa, "≅", "\\cong", true), Wo($o, Jo, sa, "≥", "\\ge"), Wo($o, Jo, sa, "≥", "\\geq", true), Wo($o, Jo, sa, "←", "\\gets"), Wo($o, Jo, sa, ">", "\\gt", true), Wo($o, Jo, sa, "∈", "\\in", true), Wo($o, Jo, sa, "", "\\@not"), Wo($o, Jo, sa, "⊂", "\\subset", true), Wo($o, Jo, sa, "⊃", "\\supset", true), Wo($o, Jo, sa, "⊆", "\\subseteq", true), Wo($o, Jo, sa, "⊇", "\\supseteq", true), Wo($o, Ko, sa, "⊈", "\\nsubseteq", true), Wo($o, Ko, sa, "⊉", "\\nsupseteq", true), Wo($o, Jo, sa, "⊨", "\\models"), Wo($o, Jo, sa, "←", "\\leftarrow", true), Wo($o, Jo, sa, "≤", "\\le"), Wo($o, Jo, sa, "≤", "\\leq", true), Wo($o, Jo, sa, "<", "\\lt", true), Wo($o, Jo, sa, "→", "\\rightarrow", true), Wo($o, Jo, sa, "→", "\\to"), Wo($o, Ko, sa, "≱", "\\ngeq", true), Wo($o, Ko, sa, "≰", "\\nleq", true), Wo($o, Jo, la, " ", "\\ "), Wo($o, Jo, la, " ", "\\space"), Wo($o, Jo, la, " ", "\\nobreakspace"), Wo(Zo, Jo, la, " ", "\\ "), Wo(Zo, Jo, la, " ", " "), Wo(Zo, Jo, la, " ", "\\space"), Wo(Zo, Jo, la, " ", "\\nobreakspace"), Wo($o, Jo, la, null, "\\nobreak"), Wo($o, Jo, la, null, "\\allowbreak"), Wo($o, Jo, aa, ",", ","), Wo($o, Jo, aa, ";", ";"), Wo($o, Ko, ea, "⊼", "\\barwedge", true), Wo($o, Ko, ea, "⊻", "\\veebar", true), Wo($o, Jo, ea, "⊙", "\\odot", true), Wo($o, Jo, ea, "⊕", "\\oplus", true), Wo($o, Jo, ea, "⊗", "\\otimes", true), Wo($o, Jo, ua, "∂", "\\partial", true), Wo($o, Jo, ea, "⊘", "\\oslash", true), Wo($o, Ko, ea, "⊚", "\\circledcirc", true), Wo($o, Ko, ea, "⊡", "\\boxdot", true), Wo($o, Jo, ea, "△", "\\bigtriangleup"), Wo($o, Jo, ea, "▽", "\\bigtriangledown"), Wo($o, Jo, ea, "†", "\\dagger"), Wo($o, Jo, ea, "⋄", "\\diamond"), Wo($o, Jo, ea, "⋆", "\\star"), Wo($o, Jo, ea, "◃", "\\triangleleft"), Wo($o, Jo, ea, "▹", "\\triangleright"), Wo($o, Jo, oa, "{", "\\{"), Wo(Zo, Jo, ua, "{", "\\{"), Wo(Zo, Jo, ua, "{", "\\textbraceleft"), Wo($o, Jo, ta, "}", "\\}"), Wo(Zo, Jo, ua, "}", "\\}"), Wo(Zo, Jo, ua, "}", "\\textbraceright"), Wo($o, Jo, oa, "{", "\\lbrace"), Wo($o, Jo, ta, "}", "\\rbrace"), Wo($o, Jo, oa, "[", "\\lbrack", true), Wo(Zo, Jo, ua, "[", "\\lbrack", true), Wo($o, Jo, ta, "]", "\\rbrack", true), Wo(Zo, Jo, ua, "]", "\\rbrack", true), Wo($o, Jo, oa, "(", "\\lparen", true), Wo($o, Jo, ta, ")", "\\rparen", true), Wo(Zo, Jo, ua, "<", "\\textless", true), Wo(Zo, Jo, ua, ">", "\\textgreater", true), Wo($o, Jo, oa, "⌊", "\\lfloor", true), Wo($o, Jo, ta, "⌋", "\\rfloor", true), Wo($o, Jo, oa, "⌈", "\\lceil", true), Wo($o, Jo, ta, "⌉", "\\rceil", true), Wo($o, Jo, ua, "\\", "\\backslash"), Wo($o, Jo, ua, "∣", "|"), Wo($o, Jo, ua, "∣", "\\vert"), Wo(Zo, Jo, ua, "|", "\\textbar", true), Wo($o, Jo, ua, "∥", "\\|"), Wo($o, Jo, ua, "∥", "\\Vert"), Wo(Zo, Jo, ua, "∥", "\\textbardbl"), Wo(Zo, Jo, ua, "~", "\\textasciitilde"), Wo(Zo, Jo, ua, "\\", "\\textbackslash"), Wo(Zo, Jo, ua, "^", "\\textasciicircum"), Wo($o, Jo, sa, "↑", "\\uparrow", true), Wo($o, Jo, sa, "⇑", "\\Uparrow", true), Wo($o, Jo, sa, "↓", "\\downarrow", true), Wo($o, Jo, sa, "⇓", "\\Downarrow", true), Wo($o, Jo, sa, "↕", "\\updownarrow", true), Wo($o, Jo, sa, "⇕", "\\Updownarrow", true), Wo($o, Jo, ia, "∐", "\\coprod"), Wo($o, Jo, ia, "⋁", "\\bigvee"), Wo($o, Jo, ia, "⋀", "\\bigwedge"), Wo($o, Jo, ia, "⨄", "\\biguplus"), Wo($o, Jo, ia, "⋂", "\\bigcap"), Wo($o, Jo, ia, "⋃", "\\bigcup"), Wo($o, Jo, ia, "∫", "\\int"), Wo($o, Jo, ia, "∫", "\\intop"), Wo($o, Jo, ia, "∬", "\\iint"), Wo($o, Jo, ia, "∭", "\\iiint"), Wo($o, Jo, ia, "∏", "\\prod"), Wo($o, Jo, ia, "∑", "\\sum"), Wo($o, Jo, ia, "⨂", "\\bigotimes"), Wo($o, Jo, ia, "⨁", "\\bigoplus"), Wo($o, Jo, ia, "⨀", "\\bigodot"), Wo($o, Jo, ia, "∮", "\\oint"), Wo($o, Jo, ia, "∯", "\\oiint"), Wo($o, Jo, ia, "∰", "\\oiiint"), Wo($o, Jo, ia, "⨆", "\\bigsqcup"), Wo($o, Jo, ia, "∫", "\\smallint"), Wo(Zo, Jo, ra, "…", "\\textellipsis"), Wo($o, Jo, ra, "…", "\\mathellipsis"), Wo(Zo, Jo, ra, "…", "\\ldots", true), Wo($o, Jo, ra, "…", "\\ldots", true), Wo($o, Jo, ra, "⋯", "\\@cdots", true), Wo($o, Jo, ra, "⋱", "\\ddots", true), Wo($o, Jo, ua, "⋮", "\\varvdots"), Wo($o, Jo, Qo, "ˊ", "\\acute"), Wo($o, Jo, Qo, "ˋ", "\\grave"), Wo($o, Jo, Qo, "¨", "\\ddot"), Wo($o, Jo, Qo, "~", "\\tilde"), Wo($o, Jo, Qo, "ˉ", "\\bar"), Wo($o, Jo, Qo, "˘", "\\breve"), Wo($o, Jo, Qo, "ˇ", "\\check"), Wo($o, Jo, Qo, "^", "\\hat"), Wo($o, Jo, Qo, "⃗", "\\vec"), Wo($o, Jo, Qo, "˙", "\\dot"), Wo($o, Jo, Qo, "˚", "\\mathring"), Wo($o, Jo, na, "", "\\@imath"), Wo($o, Jo, na, "", "\\@jmath"), Wo($o, Jo, ua, "ı", "ı"), Wo($o, Jo, ua, "ȷ", "ȷ"), Wo(Zo, Jo, ua, "ı", "\\i", true), Wo(Zo, Jo, ua, "ȷ", "\\j", true), Wo(Zo, Jo, ua, "ß", "\\ss", true), Wo(Zo, Jo, ua, "æ", "\\ae", true), Wo(Zo, Jo, ua, "œ", "\\oe", true), Wo(Zo, Jo, ua, "ø", "\\o", true), Wo(Zo, Jo, ua, "Æ", "\\AE", true), Wo(Zo, Jo, ua, "Œ", "\\OE", true), Wo(Zo, Jo, ua, "Ø", "\\O", true), Wo(Zo, Jo, Qo, "ˊ", "\\'"), Wo(Zo, Jo, Qo, "ˋ", "\\`"), Wo(Zo, Jo, Qo, "ˆ", "\\^"), Wo(Zo, Jo, Qo, "˜", "\\~"), Wo(Zo, Jo, Qo, "ˉ", "\\="), Wo(Zo, Jo, Qo, "˘", "\\u"), Wo(Zo, Jo, Qo, "˙", "\\."), Wo(Zo, Jo, Qo, "˚", "\\r"), Wo(Zo, Jo, Qo, "ˇ", "\\v"), Wo(Zo, Jo, Qo, "¨", '\\"'), Wo(Zo, Jo, Qo, "˝", "\\H"), Wo(Zo, Jo, Qo, "◯", "\\textcircled");
var ca = { "--": true, "---": true, "``": true, "''": true };
Wo(Zo, Jo, ua, "–", "--", true), Wo(Zo, Jo, ua, "–", "\\textendash"), Wo(Zo, Jo, ua, "—", "---", true), Wo(Zo, Jo, ua, "—", "\\textemdash"), Wo(Zo, Jo, ua, "‘", "`", true), Wo(Zo, Jo, ua, "‘", "\\textquoteleft"), Wo(Zo, Jo, ua, "’", "'", true), Wo(Zo, Jo, ua, "’", "\\textquoteright"), Wo(Zo, Jo, ua, "“", "``", true), Wo(Zo, Jo, ua, "“", "\\textquotedblleft"), Wo(Zo, Jo, ua, "”", "''", true), Wo(Zo, Jo, ua, "”", "\\textquotedblright"), Wo($o, Jo, ua, "°", "\\degree", true), Wo(Zo, Jo, ua, "°", "\\degree"), Wo(Zo, Jo, ua, "°", "\\textdegree", true), Wo($o, Jo, ua, "£", "\\pounds"), Wo($o, Jo, ua, "£", "\\mathsterling", true), Wo(Zo, Jo, ua, "£", "\\pounds"), Wo(Zo, Jo, ua, "£", "\\textsterling", true), Wo($o, Ko, ua, "✠", "\\maltese"), Wo(Zo, Ko, ua, "✠", "\\maltese");
for (var ha = '0123456789/@."', pa = 0; pa < 14; pa++) {
  var da = ha.charAt(pa);
  Wo($o, Jo, ua, da, da);
}
for (var ma = '0123456789!@*()-=+";:?/.,', ga = 0; ga < 25; ga++) {
  var fa = ma.charAt(ga);
  Wo(Zo, Jo, ua, fa, fa);
}
for (var ba = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", ya = 0; ya < 52; ya++) {
  var va = ba.charAt(ya);
  Wo($o, Jo, na, va, va), Wo(Zo, Jo, ua, va, va);
}
Wo($o, Ko, ua, "C", "ℂ"), Wo(Zo, Ko, ua, "C", "ℂ"), Wo($o, Ko, ua, "H", "ℍ"), Wo(Zo, Ko, ua, "H", "ℍ"), Wo($o, Ko, ua, "N", "ℕ"), Wo(Zo, Ko, ua, "N", "ℕ"), Wo($o, Ko, ua, "P", "ℙ"), Wo(Zo, Ko, ua, "P", "ℙ"), Wo($o, Ko, ua, "Q", "ℚ"), Wo(Zo, Ko, ua, "Q", "ℚ"), Wo($o, Ko, ua, "R", "ℝ"), Wo(Zo, Ko, ua, "R", "ℝ"), Wo($o, Ko, ua, "Z", "ℤ"), Wo(Zo, Ko, ua, "Z", "ℤ"), Wo($o, Jo, na, "h", "ℎ"), Wo(Zo, Jo, na, "h", "ℎ");
for (var xa = "", wa = 0; wa < 52; wa++) {
  var ka = ba.charAt(wa);
  Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56320 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56372 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56424 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56580 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56736 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56788 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56840 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56944 + wa)), Wo(Zo, Jo, ua, ka, xa), wa < 26 && (Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56632 + wa)), Wo(Zo, Jo, ua, ka, xa), Wo($o, Jo, na, ka, xa = String.fromCharCode(55349, 56476 + wa)), Wo(Zo, Jo, ua, ka, xa));
}
Wo($o, Jo, na, "k", xa = String.fromCharCode(55349, 56668)), Wo(Zo, Jo, ua, "k", xa);
for (var Aa = 0; Aa < 10; Aa++) {
  var _a = Aa.toString();
  Wo($o, Jo, na, _a, xa = String.fromCharCode(55349, 57294 + Aa)), Wo(Zo, Jo, ua, _a, xa), Wo($o, Jo, na, _a, xa = String.fromCharCode(55349, 57314 + Aa)), Wo(Zo, Jo, ua, _a, xa), Wo($o, Jo, na, _a, xa = String.fromCharCode(55349, 57324 + Aa)), Wo(Zo, Jo, ua, _a, xa), Wo($o, Jo, na, _a, xa = String.fromCharCode(55349, 57334 + Aa)), Wo(Zo, Jo, ua, _a, xa);
}
for (var Sa = "ÇÐÞçþ", qa = 0; qa < 5; qa++) {
  var Ca = Sa.charAt(qa);
  Wo($o, Jo, na, Ca, Ca), Wo(Zo, Jo, ua, Ca, Ca);
}
var za = [["mathbf", "textbf", "Main-Bold"], ["mathbf", "textbf", "Main-Bold"], ["mathnormal", "textit", "Math-Italic"], ["mathnormal", "textit", "Math-Italic"], ["boldsymbol", "boldsymbol", "Main-BoldItalic"], ["boldsymbol", "boldsymbol", "Main-BoldItalic"], ["mathscr", "textscr", "Script-Regular"], ["", "", ""], ["", "", ""], ["", "", ""], ["mathfrak", "textfrak", "Fraktur-Regular"], ["mathfrak", "textfrak", "Fraktur-Regular"], ["mathbb", "textbb", "AMS-Regular"], ["mathbb", "textbb", "AMS-Regular"], ["", "", ""], ["", "", ""], ["mathsf", "textsf", "SansSerif-Regular"], ["mathsf", "textsf", "SansSerif-Regular"], ["mathboldsf", "textboldsf", "SansSerif-Bold"], ["mathboldsf", "textboldsf", "SansSerif-Bold"], ["mathitsf", "textitsf", "SansSerif-Italic"], ["mathitsf", "textitsf", "SansSerif-Italic"], ["", "", ""], ["", "", ""], ["mathtt", "texttt", "Typewriter-Regular"], ["mathtt", "texttt", "Typewriter-Regular"]], Ta = [["mathbf", "textbf", "Main-Bold"], ["", "", ""], ["mathsf", "textsf", "SansSerif-Regular"], ["mathboldsf", "textboldsf", "SansSerif-Bold"], ["mathtt", "texttt", "Typewriter-Regular"]], Ma = [[1, 1, 1], [2, 1, 1], [3, 1, 1], [4, 2, 1], [5, 2, 1], [6, 3, 1], [7, 4, 2], [8, 6, 3], [9, 7, 6], [10, 8, 7], [11, 10, 9]], Ea = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.44, 1.728, 2.074, 2.488], Da = function(e6, t2) {
  return t2.size < 2 ? e6 : Ma[e6 - 1][t2.size - 1];
};
class La {
  constructor(e6) {
    this.style = void 0, this.color = void 0, this.size = void 0, this.textSize = void 0, this.phantom = void 0, this.font = void 0, this.fontFamily = void 0, this.fontWeight = void 0, this.fontShape = void 0, this.sizeMultiplier = void 0, this.maxSize = void 0, this.minRuleThickness = void 0, this._fontMetrics = void 0, this.style = e6.style, this.color = e6.color, this.size = e6.size || La.BASESIZE, this.textSize = e6.textSize || this.size, this.phantom = !!e6.phantom, this.font = e6.font || "", this.fontFamily = e6.fontFamily || "", this.fontWeight = e6.fontWeight || "", this.fontShape = e6.fontShape || "", this.sizeMultiplier = Ea[this.size - 1], this.maxSize = e6.maxSize, this.minRuleThickness = e6.minRuleThickness, this._fontMetrics = void 0;
  }
  extend(e6) {
    var t2 = { style: this.style, size: this.size, textSize: this.textSize, color: this.color, phantom: this.phantom, font: this.font, fontFamily: this.fontFamily, fontWeight: this.fontWeight, fontShape: this.fontShape, maxSize: this.maxSize, minRuleThickness: this.minRuleThickness };
    for (var r2 in e6) e6.hasOwnProperty(r2) && (t2[r2] = e6[r2]);
    return new La(t2);
  }
  havingStyle(e6) {
    return this.style === e6 ? this : this.extend({ style: e6, size: Da(this.textSize, e6) });
  }
  havingCrampedStyle() {
    return this.havingStyle(this.style.cramp());
  }
  havingSize(e6) {
    return this.size === e6 && this.textSize === e6 ? this : this.extend({ style: this.style.text(), size: e6, textSize: e6, sizeMultiplier: Ea[e6 - 1] });
  }
  havingBaseStyle(e6) {
    e6 = e6 || this.style.text();
    var t2 = Da(La.BASESIZE, e6);
    return this.size === t2 && this.textSize === La.BASESIZE && this.style === e6 ? this : this.extend({ style: e6, size: t2 });
  }
  havingBaseSizing() {
    var e6;
    switch (this.style.id) {
      case 4:
      case 5:
        e6 = 3;
        break;
      case 6:
      case 7:
        e6 = 1;
        break;
      default:
        e6 = 6;
    }
    return this.extend({ style: this.style.text(), size: e6 });
  }
  withColor(e6) {
    return this.extend({ color: e6 });
  }
  withPhantom() {
    return this.extend({ phantom: true });
  }
  withFont(e6) {
    return this.extend({ font: e6 });
  }
  withTextFontFamily(e6) {
    return this.extend({ fontFamily: e6, font: "" });
  }
  withTextFontWeight(e6) {
    return this.extend({ fontWeight: e6, font: "" });
  }
  withTextFontShape(e6) {
    return this.extend({ fontShape: e6, font: "" });
  }
  sizingClasses(e6) {
    return e6.size !== this.size ? ["sizing", "reset-size" + e6.size, "size" + this.size] : [];
  }
  baseSizingClasses() {
    return this.size !== La.BASESIZE ? ["sizing", "reset-size" + this.size, "size" + La.BASESIZE] : [];
  }
  fontMetrics() {
    return this._fontMetrics || (this._fontMetrics = (function(e6) {
      var t2;
      if (!Go[t2 = e6 >= 5 ? 0 : e6 >= 3 ? 1 : 2]) {
        var r2 = Go[t2] = { cssEmPerMu: Io.quad[t2] / 18 };
        for (var n2 in Io) Io.hasOwnProperty(n2) && (r2[n2] = Io[n2][t2]);
      }
      return Go[t2];
    })(this.size)), this._fontMetrics;
  }
  getColor() {
    return this.phantom ? "transparent" : this.color;
  }
}
La.BASESIZE = 6;
var Ba = { pt: 1, mm: 7227 / 2540, cm: 7227 / 254, in: 72.27, bp: 1.00375, pc: 12, dd: 1238 / 1157, cc: 14856 / 1157, nd: 685 / 642, nc: 1370 / 107, sp: 1 / 65536, px: 1.00375 }, Na = { ex: true, em: true, mu: true }, Oa = function(e6) {
  return "string" != typeof e6 && (e6 = e6.unit), e6 in Ba || e6 in Na || "ex" === e6;
}, Fa = function(e6, t2) {
  var r2;
  if (e6.unit in Ba) r2 = Ba[e6.unit] / t2.fontMetrics().ptPerEm / t2.sizeMultiplier;
  else if ("mu" === e6.unit) r2 = t2.fontMetrics().cssEmPerMu;
  else {
    var n2;
    if (n2 = t2.style.isTight() ? t2.havingStyle(t2.style.text()) : t2, "ex" === e6.unit) r2 = n2.fontMetrics().xHeight;
    else {
      if ("em" !== e6.unit) throw new io("Invalid unit: '" + e6.unit + "'");
      r2 = n2.fontMetrics().quad;
    }
    n2 !== t2 && (r2 *= n2.sizeMultiplier / t2.sizeMultiplier);
  }
  return Math.min(e6.number * r2, t2.maxSize);
}, Ra = function(e6, t2, r2) {
  return Xo[r2][e6] && Xo[r2][e6].replace && (e6 = Xo[r2][e6].replace), { value: e6, metrics: jo(e6, t2, r2) };
}, Ha = function(e6, t2, r2, n2, i2) {
  var o2, a2 = Ra(e6, t2, r2), s2 = a2.metrics;
  if (e6 = a2.value, s2) {
    var l2 = s2.italic;
    ("text" === r2 || n2 && "mathit" === n2.font) && (l2 = 0), o2 = new No(e6, s2.height, s2.depth, l2, s2.skew, s2.width, i2);
  } else "undefined" != typeof console && console.warn("No character metrics for '" + e6 + "' in style '" + t2 + "' and mode '" + r2 + "'"), o2 = new No(e6, 0, 0, 0, 0, 0, i2);
  if (n2) {
    o2.maxFontSize = n2.sizeMultiplier, n2.style.isTight() && o2.classes.push("mtight");
    var u2 = n2.getColor();
    u2 && (o2.style.color = u2);
  }
  return o2;
}, Va = (e6, t2) => {
  if (Co(e6.classes) !== Co(t2.classes) || e6.skew !== t2.skew || e6.maxFontSize !== t2.maxFontSize) return false;
  if (1 === e6.classes.length) {
    var r2 = e6.classes[0];
    if ("mbin" === r2 || "mord" === r2) return false;
  }
  for (var n2 in e6.style) if (e6.style.hasOwnProperty(n2) && e6.style[n2] !== t2.style[n2]) return false;
  for (var i2 in t2.style) if (t2.style.hasOwnProperty(i2) && e6.style[i2] !== t2.style[i2]) return false;
  return true;
}, Ia = function(e6) {
  for (var t2 = 0, r2 = 0, n2 = 0, i2 = 0; i2 < e6.children.length; i2++) {
    var o2 = e6.children[i2];
    o2.height > t2 && (t2 = o2.height), o2.depth > r2 && (r2 = o2.depth), o2.maxFontSize > n2 && (n2 = o2.maxFontSize);
  }
  e6.height = t2, e6.depth = r2, e6.maxFontSize = n2;
}, Pa = function(e6, t2, r2, n2) {
  var i2 = new Eo(e6, t2, r2, n2);
  return Ia(i2), i2;
}, ja = (e6, t2, r2, n2) => new Eo(e6, t2, r2, n2), Ga = function(e6) {
  var t2 = new qo(e6);
  return Ia(t2), t2;
}, Ua = function(e6, t2, r2) {
  var n2 = "";
  switch (e6) {
    case "amsrm":
      n2 = "AMS";
      break;
    case "textrm":
      n2 = "Main";
      break;
    case "textsf":
      n2 = "SansSerif";
      break;
    case "texttt":
      n2 = "Typewriter";
      break;
    default:
      n2 = e6;
  }
  return n2 + "-" + ("textbf" === t2 && "textit" === r2 ? "BoldItalic" : "textbf" === t2 ? "Bold" : "textit" === t2 ? "Italic" : "Regular");
}, Ya = { mathbf: { variant: "bold", fontName: "Main-Bold" }, mathrm: { variant: "normal", fontName: "Main-Regular" }, textit: { variant: "italic", fontName: "Main-Italic" }, mathit: { variant: "italic", fontName: "Main-Italic" }, mathnormal: { variant: "italic", fontName: "Math-Italic" }, mathbb: { variant: "double-struck", fontName: "AMS-Regular" }, mathcal: { variant: "script", fontName: "Caligraphic-Regular" }, mathfrak: { variant: "fraktur", fontName: "Fraktur-Regular" }, mathscr: { variant: "script", fontName: "Script-Regular" }, mathsf: { variant: "sans-serif", fontName: "SansSerif-Regular" }, mathtt: { variant: "monospace", fontName: "Typewriter-Regular" } }, Xa = { vec: ["vec", 0.471, 0.714], oiintSize1: ["oiintSize1", 0.957, 0.499], oiintSize2: ["oiintSize2", 1.472, 0.659], oiiintSize1: ["oiiintSize1", 1.304, 0.499], oiiintSize2: ["oiiintSize2", 1.98, 0.659] }, Wa = { fontMap: Ya, makeSymbol: Ha, mathsym: function(e6, t2, r2, n2) {
  return void 0 === n2 && (n2 = []), "boldsymbol" === r2.font && Ra(e6, "Main-Bold", t2).metrics ? Ha(e6, "Main-Bold", t2, r2, n2.concat(["mathbf"])) : "\\" === e6 || "main" === Xo[t2][e6].font ? Ha(e6, "Main-Regular", t2, r2, n2) : Ha(e6, "AMS-Regular", t2, r2, n2.concat(["amsrm"]));
}, makeSpan: Pa, makeSvgSpan: ja, makeLineSpan: function(e6, t2, r2) {
  var n2 = Pa([e6], [], t2);
  return n2.height = Math.max(r2 || t2.fontMetrics().defaultRuleThickness, t2.minRuleThickness), n2.style.borderBottomWidth = n2.height + "em", n2.maxFontSize = 1, n2;
}, makeAnchor: function(e6, t2, r2, n2) {
  var i2 = new Do(e6, t2, r2, n2);
  return Ia(i2), i2;
}, makeFragment: Ga, wrapFragment: function(e6, t2) {
  return e6 instanceof qo ? Pa([], [e6], t2) : e6;
}, makeVList: function(e6, t2) {
  for (var { children: r2, depth: n2 } = (function(e7) {
    if ("individualShift" === e7.positionType) {
      for (var t3 = e7.children, r3 = [t3[0]], n3 = -t3[0].shift - t3[0].elem.depth, i3 = n3, o3 = 1; o3 < t3.length; o3++) {
        var a3 = -t3[o3].shift - i3 - t3[o3].elem.depth, s3 = a3 - (t3[o3 - 1].elem.height + t3[o3 - 1].elem.depth);
        i3 += a3, r3.push({ type: "kern", size: s3 }), r3.push(t3[o3]);
      }
      return { children: r3, depth: n3 };
    }
    var l3;
    if ("top" === e7.positionType) {
      for (var u3 = e7.positionData, c3 = 0; c3 < e7.children.length; c3++) {
        var h3 = e7.children[c3];
        u3 -= "kern" === h3.type ? h3.size : h3.elem.height + h3.elem.depth;
      }
      l3 = u3;
    } else if ("bottom" === e7.positionType) l3 = -e7.positionData;
    else {
      var p3 = e7.children[0];
      if ("elem" !== p3.type) throw new Error('First child must have type "elem".');
      if ("shift" === e7.positionType) l3 = -p3.elem.depth - e7.positionData;
      else {
        if ("firstBaseline" !== e7.positionType) throw new Error("Invalid positionType " + e7.positionType + ".");
        l3 = -p3.elem.depth;
      }
    }
    return { children: e7.children, depth: l3 };
  })(e6), i2 = 0, o2 = 0; o2 < r2.length; o2++) {
    var a2 = r2[o2];
    if ("elem" === a2.type) {
      var s2 = a2.elem;
      i2 = Math.max(i2, s2.maxFontSize, s2.height);
    }
  }
  i2 += 2;
  var l2 = Pa(["pstrut"], []);
  l2.style.height = i2 + "em";
  for (var u2 = [], c2 = n2, h2 = n2, p2 = n2, d2 = 0; d2 < r2.length; d2++) {
    var m2 = r2[d2];
    if ("kern" === m2.type) p2 += m2.size;
    else {
      var g2 = m2.elem, f2 = m2.wrapperClasses || [], b2 = m2.wrapperStyle || {}, y2 = Pa(f2, [l2, g2], void 0, b2);
      y2.style.top = -i2 - p2 - g2.depth + "em", m2.marginLeft && (y2.style.marginLeft = m2.marginLeft), m2.marginRight && (y2.style.marginRight = m2.marginRight), u2.push(y2), p2 += g2.height + g2.depth;
    }
    c2 = Math.min(c2, p2), h2 = Math.max(h2, p2);
  }
  var v2, x2 = Pa(["vlist"], u2);
  if (x2.style.height = h2 + "em", c2 < 0) {
    var w2 = Pa([], []), k2 = Pa(["vlist"], [w2]);
    k2.style.height = -c2 + "em";
    var A2 = Pa(["vlist-s"], [new No("​")]);
    v2 = [Pa(["vlist-r"], [x2, A2]), Pa(["vlist-r"], [k2])];
  } else v2 = [Pa(["vlist-r"], [x2])];
  var _2 = Pa(["vlist-t"], v2);
  return 2 === v2.length && _2.classes.push("vlist-t2"), _2.height = h2, _2.depth = -c2, _2;
}, makeOrd: function(e6, t2, r2) {
  var n2 = e6.mode, i2 = e6.text, o2 = ["mord"], a2 = "math" === n2 || "text" === n2 && t2.font, s2 = a2 ? t2.font : t2.fontFamily;
  if (55349 === i2.charCodeAt(0)) {
    var [l2, u2] = (function(e7, t3) {
      var r3 = 1024 * (e7.charCodeAt(0) - 55296) + (e7.charCodeAt(1) - 56320) + 65536, n3 = "math" === t3 ? 0 : 1;
      if (119808 <= r3 && r3 < 120484) {
        var i3 = Math.floor((r3 - 119808) / 26);
        return [za[i3][2], za[i3][n3]];
      }
      if (120782 <= r3 && r3 <= 120831) {
        var o3 = Math.floor((r3 - 120782) / 10);
        return [Ta[o3][2], Ta[o3][n3]];
      }
      if (120485 === r3 || 120486 === r3) return [za[0][2], za[0][n3]];
      if (120486 < r3 && r3 < 120782) return ["", ""];
      throw new io("Unsupported character: " + e7);
    })(i2, n2);
    return Ha(i2, l2, n2, t2, o2.concat(u2));
  }
  if (s2) {
    var c2, h2;
    if ("boldsymbol" === s2) {
      var p2 = (function(e7, t3, r3, n3, i3) {
        return "textord" !== i3 && Ra(e7, "Math-BoldItalic", t3).metrics ? { fontName: "Math-BoldItalic", fontClass: "boldsymbol" } : { fontName: "Main-Bold", fontClass: "mathbf" };
      })(i2, n2, 0, 0, r2);
      c2 = p2.fontName, h2 = [p2.fontClass];
    } else a2 ? (c2 = Ya[s2].fontName, h2 = [s2]) : (c2 = Ua(s2, t2.fontWeight, t2.fontShape), h2 = [s2, t2.fontWeight, t2.fontShape]);
    if (Ra(i2, c2, n2).metrics) return Ha(i2, c2, n2, t2, o2.concat(h2));
    if (ca.hasOwnProperty(i2) && "Typewriter" === c2.substr(0, 10)) {
      for (var d2 = [], m2 = 0; m2 < i2.length; m2++) d2.push(Ha(i2[m2], c2, n2, t2, o2.concat(h2)));
      return Ga(d2);
    }
  }
  if ("mathord" === r2) return Ha(i2, "Math-Italic", n2, t2, o2.concat(["mathnormal"]));
  if ("textord" === r2) {
    var g2 = Xo[n2][i2] && Xo[n2][i2].font;
    if ("ams" === g2) {
      var f2 = Ua("amsrm", t2.fontWeight, t2.fontShape);
      return Ha(i2, f2, n2, t2, o2.concat("amsrm", t2.fontWeight, t2.fontShape));
    }
    if ("main" !== g2 && g2) {
      var b2 = Ua(g2, t2.fontWeight, t2.fontShape);
      return Ha(i2, b2, n2, t2, o2.concat(b2, t2.fontWeight, t2.fontShape));
    }
    var y2 = Ua("textrm", t2.fontWeight, t2.fontShape);
    return Ha(i2, y2, n2, t2, o2.concat(t2.fontWeight, t2.fontShape));
  }
  throw new Error("unexpected type: " + r2 + " in makeOrd");
}, makeGlue: (e6, t2) => {
  var r2 = Pa(["mspace"], [], t2), n2 = Fa(e6, t2);
  return r2.style.marginRight = n2 + "em", r2;
}, staticSvg: function(e6, t2) {
  var [r2, n2, i2] = Xa[e6], o2 = new Fo(r2), a2 = new Oo([o2], { width: n2 + "em", height: i2 + "em", style: "width:" + n2 + "em", viewBox: "0 0 " + 1e3 * n2 + " " + 1e3 * i2, preserveAspectRatio: "xMinYMin" }), s2 = ja(["overlay"], [a2], t2);
  return s2.height = i2, s2.style.height = i2 + "em", s2.style.width = n2 + "em", s2;
}, svgData: Xa, tryCombineChars: (e6) => {
  for (var t2 = 0; t2 < e6.length - 1; t2++) {
    var r2 = e6[t2], n2 = e6[t2 + 1];
    r2 instanceof No && n2 instanceof No && Va(r2, n2) && (r2.text += n2.text, r2.height = Math.max(r2.height, n2.height), r2.depth = Math.max(r2.depth, n2.depth), r2.italic = n2.italic, e6.splice(t2 + 1, 1), t2--);
  }
  return e6;
} }, $a = { number: 3, unit: "mu" }, Za = { number: 4, unit: "mu" }, Ja = { number: 5, unit: "mu" }, Ka = { mord: { mop: $a, mbin: Za, mrel: Ja, minner: $a }, mop: { mord: $a, mop: $a, mrel: Ja, minner: $a }, mbin: { mord: Za, mop: Za, mopen: Za, minner: Za }, mrel: { mord: Ja, mop: Ja, mopen: Ja, minner: Ja }, mopen: {}, mclose: { mop: $a, mbin: Za, mrel: Ja, minner: $a }, mpunct: { mord: $a, mop: $a, mrel: Ja, mopen: $a, mclose: $a, mpunct: $a, minner: $a }, minner: { mord: $a, mop: $a, mbin: Za, mrel: Ja, mopen: $a, mpunct: $a, minner: $a } }, Qa = { mord: { mop: $a }, mop: { mord: $a, mop: $a }, mbin: {}, mrel: {}, mopen: {}, mclose: { mop: $a }, mpunct: {}, minner: { mop: $a } }, es = {}, ts = {}, rs = {};
function ns(e6) {
  for (var { type: t2, names: r2, props: n2, handler: i2, htmlBuilder: o2, mathmlBuilder: a2 } = e6, s2 = { type: t2, numArgs: n2.numArgs, argTypes: n2.argTypes, allowedInArgument: !!n2.allowedInArgument, allowedInText: !!n2.allowedInText, allowedInMath: void 0 === n2.allowedInMath || n2.allowedInMath, numOptionalArgs: n2.numOptionalArgs || 0, infix: !!n2.infix, primitive: !!n2.primitive, handler: i2 }, l2 = 0; l2 < r2.length; ++l2) es[r2[l2]] = s2;
  t2 && (o2 && (ts[t2] = o2), a2 && (rs[t2] = a2));
}
function is(e6) {
  var { type: t2, htmlBuilder: r2, mathmlBuilder: n2 } = e6;
  ns({ type: t2, names: [], props: { numArgs: 0 }, handler() {
    throw new Error("Should never be called.");
  }, htmlBuilder: r2, mathmlBuilder: n2 });
}
var os = function(e6) {
  return "ordgroup" === e6.type && 1 === e6.body.length ? e6.body[0] : e6;
}, as = function(e6) {
  return "ordgroup" === e6.type ? e6.body : [e6];
}, ss = Wa.makeSpan, ls = ["leftmost", "mbin", "mopen", "mrel", "mop", "mpunct"], us = ["rightmost", "mrel", "mclose", "mpunct"], cs = { display: xo.DISPLAY, text: xo.TEXT, script: xo.SCRIPT, scriptscript: xo.SCRIPTSCRIPT }, hs = { mord: "mord", mop: "mop", mbin: "mbin", mrel: "mrel", mopen: "mopen", mclose: "mclose", mpunct: "mpunct", minner: "minner" }, ps = function(e6, t2, r2, n2) {
  void 0 === n2 && (n2 = [null, null]);
  for (var i2 = [], o2 = 0; o2 < e6.length; o2++) {
    var a2 = ys(e6[o2], t2);
    if (a2 instanceof qo) {
      var s2 = a2.children;
      i2.push(...s2);
    } else i2.push(a2);
  }
  if (Wa.tryCombineChars(i2), !r2) return i2;
  var l2 = t2;
  if (1 === e6.length) {
    var u2 = e6[0];
    "sizing" === u2.type ? l2 = t2.havingSize(u2.size) : "styling" === u2.type && (l2 = t2.havingStyle(cs[u2.style]));
  }
  var c2 = ss([n2[0] || "leftmost"], [], t2), h2 = ss([n2[1] || "rightmost"], [], t2), p2 = "root" === r2;
  return ds(i2, ((e7, t3) => {
    var r3 = t3.classes[0], n3 = e7.classes[0];
    "mbin" === r3 && uo.contains(us, n3) ? t3.classes[0] = "mord" : "mbin" === n3 && uo.contains(ls, r3) && (e7.classes[0] = "mord");
  }), { node: c2 }, h2, p2), ds(i2, ((e7, t3) => {
    var r3 = fs(t3), n3 = fs(e7), i3 = r3 && n3 ? e7.hasClass("mtight") ? Qa[r3][n3] : Ka[r3][n3] : null;
    if (i3) return Wa.makeGlue(i3, l2);
  }), { node: c2 }, h2, p2), i2;
}, ds = function e3(t2, r2, n2, i2, o2) {
  i2 && t2.push(i2);
  for (var a2 = 0; a2 < t2.length; a2++) {
    var s2 = t2[a2], l2 = ms(s2);
    if (l2) e3(l2.children, r2, n2, null, o2);
    else {
      var u2 = !s2.hasClass("mspace");
      if (u2) {
        var c2 = r2(s2, n2.node);
        c2 && (n2.insertAfter ? n2.insertAfter(c2) : (t2.unshift(c2), a2++));
      }
      u2 ? n2.node = s2 : o2 && s2.hasClass("newline") && (n2.node = ss(["leftmost"])), n2.insertAfter = /* @__PURE__ */ ((e6) => (r3) => {
        t2.splice(e6 + 1, 0, r3), a2++;
      })(a2);
    }
  }
  i2 && t2.pop();
}, ms = function(e6) {
  return e6 instanceof qo || e6 instanceof Do || e6 instanceof Eo && e6.hasClass("enclosing") ? e6 : null;
}, gs = function e4(t2, r2) {
  var n2 = ms(t2);
  if (n2) {
    var i2 = n2.children;
    if (i2.length) {
      if ("right" === r2) return e4(i2[i2.length - 1], "right");
      if ("left" === r2) return e4(i2[0], "left");
    }
  }
  return t2;
}, fs = function(e6, t2) {
  return e6 ? (t2 && (e6 = gs(e6, t2)), hs[e6.classes[0]] || null) : null;
}, bs = function(e6, t2) {
  var r2 = ["nulldelimiter"].concat(e6.baseSizingClasses());
  return ss(t2.concat(r2));
}, ys = function(e6, t2, r2) {
  if (!e6) return ss();
  if (ts[e6.type]) {
    var n2 = ts[e6.type](e6, t2);
    if (r2 && t2.size !== r2.size) {
      n2 = ss(t2.sizingClasses(r2), [n2], t2);
      var i2 = t2.sizeMultiplier / r2.sizeMultiplier;
      n2.height *= i2, n2.depth *= i2;
    }
    return n2;
  }
  throw new io("Got group of unknown type: '" + e6.type + "'");
};
function vs(e6, t2) {
  var r2 = ss(["base"], e6, t2), n2 = ss(["strut"]);
  return n2.style.height = r2.height + r2.depth + "em", n2.style.verticalAlign = -r2.depth + "em", r2.children.unshift(n2), r2;
}
function xs(e6, t2) {
  var r2 = null;
  1 === e6.length && "tag" === e6[0].type && (r2 = e6[0].tag, e6 = e6[0].body);
  var n2, i2 = ps(e6, t2, "root");
  2 === i2.length && i2[1].hasClass("tag") && (n2 = i2.pop());
  for (var o2, a2 = [], s2 = [], l2 = 0; l2 < i2.length; l2++) if (s2.push(i2[l2]), i2[l2].hasClass("mbin") || i2[l2].hasClass("mrel") || i2[l2].hasClass("allowbreak")) {
    for (var u2 = false; l2 < i2.length - 1 && i2[l2 + 1].hasClass("mspace") && !i2[l2 + 1].hasClass("newline"); ) l2++, s2.push(i2[l2]), i2[l2].hasClass("nobreak") && (u2 = true);
    u2 || (a2.push(vs(s2, t2)), s2 = []);
  } else i2[l2].hasClass("newline") && (s2.pop(), s2.length > 0 && (a2.push(vs(s2, t2)), s2 = []), a2.push(i2[l2]));
  s2.length > 0 && a2.push(vs(s2, t2)), r2 ? ((o2 = vs(ps(r2, t2, true))).classes = ["tag"], a2.push(o2)) : n2 && a2.push(n2);
  var c2 = ss(["katex-html"], a2);
  if (c2.setAttribute("aria-hidden", "true"), o2) {
    var h2 = o2.children[0];
    h2.style.height = c2.height + c2.depth + "em", h2.style.verticalAlign = -c2.depth + "em";
  }
  return c2;
}
function ws(e6) {
  return new qo(e6);
}
class ks {
  constructor(e6, t2, r2) {
    this.type = void 0, this.attributes = void 0, this.children = void 0, this.classes = void 0, this.type = e6, this.attributes = {}, this.children = t2 || [], this.classes = r2 || [];
  }
  setAttribute(e6, t2) {
    this.attributes[e6] = t2;
  }
  getAttribute(e6) {
    return this.attributes[e6];
  }
  toNode() {
    var e6 = document.createElementNS("http://www.w3.org/1998/Math/MathML", this.type);
    for (var t2 in this.attributes) Object.prototype.hasOwnProperty.call(this.attributes, t2) && e6.setAttribute(t2, this.attributes[t2]);
    this.classes.length > 0 && (e6.className = Co(this.classes));
    for (var r2 = 0; r2 < this.children.length; r2++) e6.appendChild(this.children[r2].toNode());
    return e6;
  }
  toMarkup() {
    var e6 = "<" + this.type;
    for (var t2 in this.attributes) Object.prototype.hasOwnProperty.call(this.attributes, t2) && (e6 += " " + t2 + '="', e6 += uo.escape(this.attributes[t2]), e6 += '"');
    this.classes.length > 0 && (e6 += ' class ="' + uo.escape(Co(this.classes)) + '"'), e6 += ">";
    for (var r2 = 0; r2 < this.children.length; r2++) e6 += this.children[r2].toMarkup();
    return e6 += "</" + this.type + ">";
  }
  toText() {
    return this.children.map(((e6) => e6.toText())).join("");
  }
}
class As {
  constructor(e6) {
    this.text = void 0, this.text = e6;
  }
  toNode() {
    return document.createTextNode(this.text);
  }
  toMarkup() {
    return uo.escape(this.toText());
  }
  toText() {
    return this.text;
  }
}
var _s = { MathNode: ks, TextNode: As, SpaceNode: class {
  constructor(e6) {
    this.width = void 0, this.character = void 0, this.width = e6, this.character = e6 >= 0.05555 && e6 <= 0.05556 ? " " : e6 >= 0.1666 && e6 <= 0.1667 ? " " : e6 >= 0.2222 && e6 <= 0.2223 ? " " : e6 >= 0.2777 && e6 <= 0.2778 ? "  " : e6 >= -0.05556 && e6 <= -0.05555 ? " ⁣" : e6 >= -0.1667 && e6 <= -0.1666 ? " ⁣" : e6 >= -0.2223 && e6 <= -0.2222 ? " ⁣" : e6 >= -0.2778 && e6 <= -0.2777 ? " ⁣" : null;
  }
  toNode() {
    if (this.character) return document.createTextNode(this.character);
    var e6 = document.createElementNS("http://www.w3.org/1998/Math/MathML", "mspace");
    return e6.setAttribute("width", this.width + "em"), e6;
  }
  toMarkup() {
    return this.character ? "<mtext>" + this.character + "</mtext>" : '<mspace width="' + this.width + 'em"/>';
  }
  toText() {
    return this.character ? this.character : " ";
  }
}, newDocumentFragment: ws }, Ss = function(e6, t2, r2) {
  return !Xo[t2][e6] || !Xo[t2][e6].replace || 55349 === e6.charCodeAt(0) || ca.hasOwnProperty(e6) && r2 && (r2.fontFamily && "tt" === r2.fontFamily.substr(4, 2) || r2.font && "tt" === r2.font.substr(4, 2)) || (e6 = Xo[t2][e6].replace), new _s.TextNode(e6);
}, qs = function(e6) {
  return 1 === e6.length ? e6[0] : new _s.MathNode("mrow", e6);
}, Cs = function(e6, t2) {
  if ("texttt" === t2.fontFamily) return "monospace";
  if ("textsf" === t2.fontFamily) return "textit" === t2.fontShape && "textbf" === t2.fontWeight ? "sans-serif-bold-italic" : "textit" === t2.fontShape ? "sans-serif-italic" : "textbf" === t2.fontWeight ? "bold-sans-serif" : "sans-serif";
  if ("textit" === t2.fontShape && "textbf" === t2.fontWeight) return "bold-italic";
  if ("textit" === t2.fontShape) return "italic";
  if ("textbf" === t2.fontWeight) return "bold";
  var r2 = t2.font;
  if (!r2 || "mathnormal" === r2) return null;
  var n2 = e6.mode;
  if ("mathit" === r2) return "italic";
  if ("boldsymbol" === r2) return "textord" === e6.type ? "bold" : "bold-italic";
  if ("mathbf" === r2) return "bold";
  if ("mathbb" === r2) return "double-struck";
  if ("mathfrak" === r2) return "fraktur";
  if ("mathscr" === r2 || "mathcal" === r2) return "script";
  if ("mathsf" === r2) return "sans-serif";
  if ("mathtt" === r2) return "monospace";
  var i2 = e6.text;
  return uo.contains(["\\imath", "\\jmath"], i2) ? null : (Xo[n2][i2] && Xo[n2][i2].replace && (i2 = Xo[n2][i2].replace), jo(i2, Wa.fontMap[r2].fontName, n2) ? Wa.fontMap[r2].variant : null);
}, zs = function(e6, t2, r2) {
  if (1 === e6.length) {
    var n2 = Ms(e6[0], t2);
    return r2 && n2 instanceof ks && "mo" === n2.type && (n2.setAttribute("lspace", "0em"), n2.setAttribute("rspace", "0em")), [n2];
  }
  for (var i2, o2 = [], a2 = 0; a2 < e6.length; a2++) {
    var s2 = Ms(e6[a2], t2);
    if (s2 instanceof ks && i2 instanceof ks) {
      if ("mtext" === s2.type && "mtext" === i2.type && s2.getAttribute("mathvariant") === i2.getAttribute("mathvariant")) {
        i2.children.push(...s2.children);
        continue;
      }
      if ("mn" === s2.type && "mn" === i2.type) {
        i2.children.push(...s2.children);
        continue;
      }
      if ("mi" === s2.type && 1 === s2.children.length && "mn" === i2.type) {
        var l2 = s2.children[0];
        if (l2 instanceof As && "." === l2.text) {
          i2.children.push(...s2.children);
          continue;
        }
      } else if ("mi" === i2.type && 1 === i2.children.length) {
        var u2 = i2.children[0];
        if (u2 instanceof As && "̸" === u2.text && ("mo" === s2.type || "mi" === s2.type || "mn" === s2.type)) {
          var c2 = s2.children[0];
          c2 instanceof As && c2.text.length > 0 && (c2.text = c2.text.slice(0, 1) + "̸" + c2.text.slice(1), o2.pop());
        }
      }
    }
    o2.push(s2), i2 = s2;
  }
  return o2;
}, Ts = function(e6, t2, r2) {
  return qs(zs(e6, t2, r2));
}, Ms = function(e6, t2) {
  if (!e6) return new _s.MathNode("mrow");
  if (rs[e6.type]) return rs[e6.type](e6, t2);
  throw new io("Got group of unknown type: '" + e6.type + "'");
};
function Es(e6, t2, r2, n2, i2) {
  var o2, a2 = zs(e6, r2);
  o2 = 1 === a2.length && a2[0] instanceof ks && uo.contains(["mrow", "mtable"], a2[0].type) ? a2[0] : new _s.MathNode("mrow", a2);
  var s2 = new _s.MathNode("annotation", [new _s.TextNode(t2)]);
  s2.setAttribute("encoding", "application/x-tex");
  var l2 = new _s.MathNode("semantics", [o2, s2]), u2 = new _s.MathNode("math", [l2]);
  u2.setAttribute("xmlns", "http://www.w3.org/1998/Math/MathML"), n2 && u2.setAttribute("display", "block");
  var c2 = i2 ? "katex" : "katex-mathml";
  return Wa.makeSpan([c2], [u2]);
}
var Ds = function(e6) {
  return new La({ style: e6.displayMode ? xo.DISPLAY : xo.TEXT, maxSize: e6.maxSize, minRuleThickness: e6.minRuleThickness });
}, Ls = function(e6, t2) {
  if (t2.displayMode) {
    var r2 = ["katex-display"];
    t2.leqno && r2.push("leqno"), t2.fleqn && r2.push("fleqn"), e6 = Wa.makeSpan(r2, [e6]);
  }
  return e6;
}, Bs = { widehat: "^", widecheck: "ˇ", widetilde: "~", utilde: "~", overleftarrow: "←", underleftarrow: "←", xleftarrow: "←", overrightarrow: "→", underrightarrow: "→", xrightarrow: "→", underbrace: "⏟", overbrace: "⏞", overgroup: "⏠", undergroup: "⏡", overleftrightarrow: "↔", underleftrightarrow: "↔", xleftrightarrow: "↔", Overrightarrow: "⇒", xRightarrow: "⇒", overleftharpoon: "↼", xleftharpoonup: "↼", overrightharpoon: "⇀", xrightharpoonup: "⇀", xLeftarrow: "⇐", xLeftrightarrow: "⇔", xhookleftarrow: "↩", xhookrightarrow: "↪", xmapsto: "↦", xrightharpoondown: "⇁", xleftharpoondown: "↽", xrightleftharpoons: "⇌", xleftrightharpoons: "⇋", xtwoheadleftarrow: "↞", xtwoheadrightarrow: "↠", xlongequal: "=", xtofrom: "⇄", xrightleftarrows: "⇄", xrightequilibrium: "⇌", xleftequilibrium: "⇋", "\\cdrightarrow": "→", "\\cdleftarrow": "←", "\\cdlongequal": "=" }, Ns = { overrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"], overleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"], underrightarrow: [["rightarrow"], 0.888, 522, "xMaxYMin"], underleftarrow: [["leftarrow"], 0.888, 522, "xMinYMin"], xrightarrow: [["rightarrow"], 1.469, 522, "xMaxYMin"], "\\cdrightarrow": [["rightarrow"], 3, 522, "xMaxYMin"], xleftarrow: [["leftarrow"], 1.469, 522, "xMinYMin"], "\\cdleftarrow": [["leftarrow"], 3, 522, "xMinYMin"], Overrightarrow: [["doublerightarrow"], 0.888, 560, "xMaxYMin"], xRightarrow: [["doublerightarrow"], 1.526, 560, "xMaxYMin"], xLeftarrow: [["doubleleftarrow"], 1.526, 560, "xMinYMin"], overleftharpoon: [["leftharpoon"], 0.888, 522, "xMinYMin"], xleftharpoonup: [["leftharpoon"], 0.888, 522, "xMinYMin"], xleftharpoondown: [["leftharpoondown"], 0.888, 522, "xMinYMin"], overrightharpoon: [["rightharpoon"], 0.888, 522, "xMaxYMin"], xrightharpoonup: [["rightharpoon"], 0.888, 522, "xMaxYMin"], xrightharpoondown: [["rightharpoondown"], 0.888, 522, "xMaxYMin"], xlongequal: [["longequal"], 0.888, 334, "xMinYMin"], "\\cdlongequal": [["longequal"], 3, 334, "xMinYMin"], xtwoheadleftarrow: [["twoheadleftarrow"], 0.888, 334, "xMinYMin"], xtwoheadrightarrow: [["twoheadrightarrow"], 0.888, 334, "xMaxYMin"], overleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522], overbrace: [["leftbrace", "midbrace", "rightbrace"], 1.6, 548], underbrace: [["leftbraceunder", "midbraceunder", "rightbraceunder"], 1.6, 548], underleftrightarrow: [["leftarrow", "rightarrow"], 0.888, 522], xleftrightarrow: [["leftarrow", "rightarrow"], 1.75, 522], xLeftrightarrow: [["doubleleftarrow", "doublerightarrow"], 1.75, 560], xrightleftharpoons: [["leftharpoondownplus", "rightharpoonplus"], 1.75, 716], xleftrightharpoons: [["leftharpoonplus", "rightharpoondownplus"], 1.75, 716], xhookleftarrow: [["leftarrow", "righthook"], 1.08, 522], xhookrightarrow: [["lefthook", "rightarrow"], 1.08, 522], overlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522], underlinesegment: [["leftlinesegment", "rightlinesegment"], 0.888, 522], overgroup: [["leftgroup", "rightgroup"], 0.888, 342], undergroup: [["leftgroupunder", "rightgroupunder"], 0.888, 342], xmapsto: [["leftmapsto", "rightarrow"], 1.5, 522], xtofrom: [["leftToFrom", "rightToFrom"], 1.75, 528], xrightleftarrows: [["baraboveleftarrow", "rightarrowabovebar"], 1.75, 901], xrightequilibrium: [["baraboveshortleftharpoon", "rightharpoonaboveshortbar"], 1.75, 716], xleftequilibrium: [["shortbaraboveleftharpoon", "shortrightharpoonabovebar"], 1.75, 716] }, Os = function(e6, t2, r2, n2, i2) {
  var o2, a2 = e6.height + e6.depth + r2 + n2;
  if (/fbox|color|angl/.test(t2)) {
    if (o2 = Wa.makeSpan(["stretchy", t2], [], i2), "fbox" === t2) {
      var s2 = i2.color && i2.getColor();
      s2 && (o2.style.borderColor = s2);
    }
  } else {
    var l2 = [];
    /^[bx]cancel$/.test(t2) && l2.push(new Ro({ x1: "0", y1: "0", x2: "100%", y2: "100%", "stroke-width": "0.046em" })), /^x?cancel$/.test(t2) && l2.push(new Ro({ x1: "0", y1: "100%", x2: "100%", y2: "0", "stroke-width": "0.046em" }));
    var u2 = new Oo(l2, { width: "100%", height: a2 + "em" });
    o2 = Wa.makeSvgSpan([], [u2], i2);
  }
  return o2.height = a2, o2.style.height = a2 + "em", o2;
}, Fs = function(e6) {
  var t2 = new _s.MathNode("mo", [new _s.TextNode(Bs[e6.replace(/^\\/, "")])]);
  return t2.setAttribute("stretchy", "true"), t2;
}, Rs = function(e6, t2) {
  var { span: r2, minWidth: n2, height: i2 } = (function() {
    var r3 = 4e5, n3 = e6.label.substr(1);
    if (uo.contains(["widehat", "widecheck", "widetilde", "utilde"], n3)) {
      var i3, o2, a2, s2 = "ordgroup" === (d2 = e6.base).type ? d2.body.length : 1;
      if (s2 > 5) "widehat" === n3 || "widecheck" === n3 ? (i3 = 420, r3 = 2364, a2 = 0.42, o2 = n3 + "4") : (i3 = 312, r3 = 2340, a2 = 0.34, o2 = "tilde4");
      else {
        var l2 = [1, 1, 2, 2, 3, 3][s2];
        "widehat" === n3 || "widecheck" === n3 ? (r3 = [0, 1062, 2364, 2364, 2364][l2], i3 = [0, 239, 300, 360, 420][l2], a2 = [0, 0.24, 0.3, 0.3, 0.36, 0.42][l2], o2 = n3 + l2) : (r3 = [0, 600, 1033, 2339, 2340][l2], i3 = [0, 260, 286, 306, 312][l2], a2 = [0, 0.26, 0.286, 0.3, 0.306, 0.34][l2], o2 = "tilde" + l2);
      }
      var u2 = new Fo(o2), c2 = new Oo([u2], { width: "100%", height: a2 + "em", viewBox: "0 0 " + r3 + " " + i3, preserveAspectRatio: "none" });
      return { span: Wa.makeSvgSpan([], [c2], t2), minWidth: 0, height: a2 };
    }
    var h2, p2, d2, m2 = [], g2 = Ns[n3], [f2, b2, y2] = g2, v2 = y2 / 1e3, x2 = f2.length;
    if (1 === x2) h2 = ["hide-tail"], p2 = [g2[3]];
    else if (2 === x2) h2 = ["halfarrow-left", "halfarrow-right"], p2 = ["xMinYMin", "xMaxYMin"];
    else {
      if (3 !== x2) throw new Error("Correct katexImagesData or update code here to support\n                    " + x2 + " children.");
      h2 = ["brace-left", "brace-center", "brace-right"], p2 = ["xMinYMin", "xMidYMin", "xMaxYMin"];
    }
    for (var w2 = 0; w2 < x2; w2++) {
      var k2 = new Fo(f2[w2]), A2 = new Oo([k2], { width: "400em", height: v2 + "em", viewBox: "0 0 " + r3 + " " + y2, preserveAspectRatio: p2[w2] + " slice" }), _2 = Wa.makeSvgSpan([h2[w2]], [A2], t2);
      if (1 === x2) return { span: _2, minWidth: b2, height: v2 };
      _2.style.height = v2 + "em", m2.push(_2);
    }
    return { span: Wa.makeSpan(["stretchy"], m2, t2), minWidth: b2, height: v2 };
  })();
  return r2.height = i2, r2.style.height = i2 + "em", n2 > 0 && (r2.style.minWidth = n2 + "em"), r2;
};
function Hs(e6, t2) {
  if (!e6 || e6.type !== t2) throw new Error("Expected node of type " + t2 + ", but got " + (e6 ? "node of type " + e6.type : String(e6)));
  return e6;
}
function Vs(e6) {
  var t2 = Is(e6);
  if (!t2) throw new Error("Expected node of symbol group type, but got " + (e6 ? "node of type " + e6.type : String(e6)));
  return t2;
}
function Is(e6) {
  return e6 && ("atom" === e6.type || Yo.hasOwnProperty(e6.type)) ? e6 : null;
}
var Ps = (e6, t2) => {
  var r2, n2, i2;
  e6 && "supsub" === e6.type ? (r2 = (n2 = Hs(e6.base, "accent")).base, e6.base = r2, i2 = (function(e7) {
    if (e7 instanceof Eo) return e7;
    throw new Error("Expected span<HtmlDomNode> but got " + String(e7) + ".");
  })(ys(e6, t2)), e6.base = n2) : r2 = (n2 = Hs(e6, "accent")).base;
  var o2 = ys(r2, t2.havingCrampedStyle()), a2 = 0;
  if (n2.isShifty && uo.isCharacterBox(r2)) {
    var s2 = uo.getBaseElem(r2);
    a2 = Ho(ys(s2, t2.havingCrampedStyle())).skew;
  }
  var l2, u2 = Math.min(o2.height, t2.fontMetrics().xHeight);
  if (n2.isStretchy) l2 = Rs(n2, t2), l2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: o2 }, { type: "elem", elem: l2, wrapperClasses: ["svg-align"], wrapperStyle: a2 > 0 ? { width: "calc(100% - " + 2 * a2 + "em)", marginLeft: 2 * a2 + "em" } : void 0 }] }, t2);
  else {
    var c2, h2;
    "\\vec" === n2.label ? (c2 = Wa.staticSvg("vec", t2), h2 = Wa.svgData.vec[1]) : ((c2 = Ho(c2 = Wa.makeOrd({ mode: n2.mode, text: n2.label }, t2, "textord"))).italic = 0, h2 = c2.width), l2 = Wa.makeSpan(["accent-body"], [c2]);
    var p2 = "\\textcircled" === n2.label;
    p2 && (l2.classes.push("accent-full"), u2 = o2.height);
    var d2 = a2;
    p2 || (d2 -= h2 / 2), l2.style.left = d2 + "em", "\\textcircled" === n2.label && (l2.style.top = ".2em"), l2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: o2 }, { type: "kern", size: -u2 }, { type: "elem", elem: l2 }] }, t2);
  }
  var m2 = Wa.makeSpan(["mord", "accent"], [l2], t2);
  return i2 ? (i2.children[0] = m2, i2.height = Math.max(m2.height, i2.height), i2.classes[0] = "mord", i2) : m2;
}, js = (e6, t2) => {
  var r2 = e6.isStretchy ? Fs(e6.label) : new _s.MathNode("mo", [Ss(e6.label, e6.mode)]), n2 = new _s.MathNode("mover", [Ms(e6.base, t2), r2]);
  return n2.setAttribute("accent", "true"), n2;
}, Gs = new RegExp(["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring"].map(((e6) => "\\" + e6)).join("|"));
ns({ type: "accent", names: ["\\acute", "\\grave", "\\ddot", "\\tilde", "\\bar", "\\breve", "\\check", "\\hat", "\\vec", "\\dot", "\\mathring", "\\widecheck", "\\widehat", "\\widetilde", "\\overrightarrow", "\\overleftarrow", "\\Overrightarrow", "\\overleftrightarrow", "\\overgroup", "\\overlinesegment", "\\overleftharpoon", "\\overrightharpoon"], props: { numArgs: 1 }, handler: (e6, t2) => {
  var r2 = os(t2[0]), n2 = !Gs.test(e6.funcName), i2 = !n2 || "\\widehat" === e6.funcName || "\\widetilde" === e6.funcName || "\\widecheck" === e6.funcName;
  return { type: "accent", mode: e6.parser.mode, label: e6.funcName, isStretchy: n2, isShifty: i2, base: r2 };
}, htmlBuilder: Ps, mathmlBuilder: js }), ns({ type: "accent", names: ["\\'", "\\`", "\\^", "\\~", "\\=", "\\u", "\\.", '\\"', "\\r", "\\H", "\\v", "\\textcircled"], props: { numArgs: 1, allowedInText: true, allowedInMath: true, argTypes: ["primitive"] }, handler: (e6, t2) => {
  var r2 = t2[0], n2 = e6.parser.mode;
  return "math" === n2 && (e6.parser.settings.reportNonstrict("mathVsTextAccents", "LaTeX's accent " + e6.funcName + " works only in text mode"), n2 = "text"), { type: "accent", mode: n2, label: e6.funcName, isStretchy: false, isShifty: true, base: r2 };
}, htmlBuilder: Ps, mathmlBuilder: js }), ns({ type: "accentUnder", names: ["\\underleftarrow", "\\underrightarrow", "\\underleftrightarrow", "\\undergroup", "\\underlinesegment", "\\utilde"], props: { numArgs: 1 }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  return { type: "accentUnder", mode: r2.mode, label: n2, base: i2 };
}, htmlBuilder: (e6, t2) => {
  var r2 = ys(e6.base, t2), n2 = Rs(e6, t2), i2 = "\\utilde" === e6.label ? 0.12 : 0, o2 = Wa.makeVList({ positionType: "top", positionData: r2.height, children: [{ type: "elem", elem: n2, wrapperClasses: ["svg-align"] }, { type: "kern", size: i2 }, { type: "elem", elem: r2 }] }, t2);
  return Wa.makeSpan(["mord", "accentunder"], [o2], t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = Fs(e6.label), n2 = new _s.MathNode("munder", [Ms(e6.base, t2), r2]);
  return n2.setAttribute("accentunder", "true"), n2;
} });
var Us = (e6) => {
  var t2 = new _s.MathNode("mpadded", e6 ? [e6] : []);
  return t2.setAttribute("width", "+0.6em"), t2.setAttribute("lspace", "0.3em"), t2;
};
ns({ type: "xArrow", names: ["\\xleftarrow", "\\xrightarrow", "\\xLeftarrow", "\\xRightarrow", "\\xleftrightarrow", "\\xLeftrightarrow", "\\xhookleftarrow", "\\xhookrightarrow", "\\xmapsto", "\\xrightharpoondown", "\\xrightharpoonup", "\\xleftharpoondown", "\\xleftharpoonup", "\\xrightleftharpoons", "\\xleftrightharpoons", "\\xlongequal", "\\xtwoheadrightarrow", "\\xtwoheadleftarrow", "\\xtofrom", "\\xrightleftarrows", "\\xrightequilibrium", "\\xleftequilibrium", "\\\\cdrightarrow", "\\\\cdleftarrow", "\\\\cdlongequal"], props: { numArgs: 1, numOptionalArgs: 1 }, handler(e6, t2, r2) {
  var { parser: n2, funcName: i2 } = e6;
  return { type: "xArrow", mode: n2.mode, label: i2, body: t2[0], below: r2[0] };
}, htmlBuilder(e6, t2) {
  var r2, n2 = t2.style, i2 = t2.havingStyle(n2.sup()), o2 = Wa.wrapFragment(ys(e6.body, i2, t2), t2), a2 = "\\x" === e6.label.slice(0, 2) ? "x" : "cd";
  o2.classes.push(a2 + "-arrow-pad"), e6.below && (i2 = t2.havingStyle(n2.sub()), (r2 = Wa.wrapFragment(ys(e6.below, i2, t2), t2)).classes.push(a2 + "-arrow-pad"));
  var s2, l2 = Rs(e6, t2), u2 = -t2.fontMetrics().axisHeight + 0.5 * l2.height, c2 = -t2.fontMetrics().axisHeight - 0.5 * l2.height - 0.111;
  if ((o2.depth > 0.25 || "\\xleftequilibrium" === e6.label) && (c2 -= o2.depth), r2) {
    var h2 = -t2.fontMetrics().axisHeight + r2.height + 0.5 * l2.height + 0.111;
    s2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: o2, shift: c2 }, { type: "elem", elem: l2, shift: u2 }, { type: "elem", elem: r2, shift: h2 }] }, t2);
  } else s2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: o2, shift: c2 }, { type: "elem", elem: l2, shift: u2 }] }, t2);
  return s2.children[0].children[0].children[1].classes.push("svg-align"), Wa.makeSpan(["mrel", "x-arrow"], [s2], t2);
}, mathmlBuilder(e6, t2) {
  var r2, n2 = Fs(e6.label);
  if (n2.setAttribute("minsize", "x" === e6.label.charAt(0) ? "1.75em" : "3.0em"), e6.body) {
    var i2 = Us(Ms(e6.body, t2));
    if (e6.below) {
      var o2 = Us(Ms(e6.below, t2));
      r2 = new _s.MathNode("munderover", [n2, o2, i2]);
    } else r2 = new _s.MathNode("mover", [n2, i2]);
  } else if (e6.below) {
    var a2 = Us(Ms(e6.below, t2));
    r2 = new _s.MathNode("munder", [n2, a2]);
  } else r2 = Us(), r2 = new _s.MathNode("mover", [n2, r2]);
  return r2;
} });
var Ys = { ">": "\\\\cdrightarrow", "<": "\\\\cdleftarrow", "=": "\\\\cdlongequal", A: "\\uparrow", V: "\\downarrow", "|": "\\Vert", ".": "no arrow" }, Xs = (e6) => "textord" === e6.type && "@" === e6.text;
function Ws(e6, t2, r2) {
  var n2 = Ys[e6];
  switch (n2) {
    case "\\\\cdrightarrow":
    case "\\\\cdleftarrow":
      return r2.callFunction(n2, [t2[0]], [t2[1]]);
    case "\\uparrow":
    case "\\downarrow":
      var i2 = { type: "atom", text: n2, mode: "math", family: "rel" }, o2 = { type: "ordgroup", mode: "math", body: [r2.callFunction("\\\\cdleft", [t2[0]], []), r2.callFunction("\\Big", [i2], []), r2.callFunction("\\\\cdright", [t2[1]], [])] };
      return r2.callFunction("\\\\cdparent", [o2], []);
    case "\\\\cdlongequal":
      return r2.callFunction("\\\\cdlongequal", [], []);
    case "\\Vert":
      return r2.callFunction("\\Big", [{ type: "textord", text: "\\Vert", mode: "math" }], []);
    default:
      return { type: "textord", text: " ", mode: "math" };
  }
}
ns({ type: "cdlabel", names: ["\\\\cdleft", "\\\\cdright"], props: { numArgs: 1 }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6;
  return { type: "cdlabel", mode: r2.mode, side: n2.slice(4), label: t2[0] };
}, htmlBuilder(e6, t2) {
  var r2 = t2.havingStyle(t2.style.sup()), n2 = Wa.wrapFragment(ys(e6.label, r2, t2), t2);
  return n2.classes.push("cd-label-" + e6.side), n2.style.bottom = 0.8 - n2.depth + "em", n2.height = 0, n2.depth = 0, n2;
}, mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mrow", [Ms(e6.label, t2)]);
  return (r2 = new _s.MathNode("mpadded", [r2])).setAttribute("width", "0"), "left" === e6.side && r2.setAttribute("lspace", "-1width"), r2.setAttribute("voffset", "0.7em"), (r2 = new _s.MathNode("mstyle", [r2])).setAttribute("displaystyle", "false"), r2.setAttribute("scriptlevel", "1"), r2;
} }), ns({ type: "cdlabelparent", names: ["\\\\cdparent"], props: { numArgs: 1 }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "cdlabelparent", mode: r2.mode, fragment: t2[0] };
}, htmlBuilder(e6, t2) {
  var r2 = Wa.wrapFragment(ys(e6.fragment, t2), t2);
  return r2.classes.push("cd-vert-arrow"), r2;
}, mathmlBuilder: (e6, t2) => new _s.MathNode("mrow", [Ms(e6.fragment, t2)]) }), ns({ type: "textord", names: ["\\@char"], props: { numArgs: 1, allowedInText: true }, handler(e6, t2) {
  for (var { parser: r2 } = e6, n2 = Hs(t2[0], "ordgroup").body, i2 = "", o2 = 0; o2 < n2.length; o2++) {
    i2 += Hs(n2[o2], "textord").text;
  }
  var a2 = parseInt(i2);
  if (isNaN(a2)) throw new io("\\@char has non-numeric argument " + i2);
  return { type: "textord", mode: r2.mode, text: String.fromCharCode(a2) };
} });
var $s = (e6, t2) => {
  var r2 = ps(e6.body, t2.withColor(e6.color), false);
  return Wa.makeFragment(r2);
}, Zs = (e6, t2) => {
  var r2 = zs(e6.body, t2.withColor(e6.color)), n2 = new _s.MathNode("mstyle", r2);
  return n2.setAttribute("mathcolor", e6.color), n2;
};
ns({ type: "color", names: ["\\textcolor"], props: { numArgs: 2, allowedInText: true, argTypes: ["color", "original"] }, handler(e6, t2) {
  var { parser: r2 } = e6, n2 = Hs(t2[0], "color-token").color, i2 = t2[1];
  return { type: "color", mode: r2.mode, color: n2, body: as(i2) };
}, htmlBuilder: $s, mathmlBuilder: Zs }), ns({ type: "color", names: ["\\color"], props: { numArgs: 1, allowedInText: true, argTypes: ["color"] }, handler(e6, t2) {
  var { parser: r2, breakOnTokenText: n2 } = e6, i2 = Hs(t2[0], "color-token").color;
  r2.gullet.macros.set("\\current@color", i2);
  var o2 = r2.parseExpression(true, n2);
  return { type: "color", mode: r2.mode, color: i2, body: o2 };
}, htmlBuilder: $s, mathmlBuilder: Zs }), ns({ type: "cr", names: ["\\\\"], props: { numArgs: 0, numOptionalArgs: 1, argTypes: ["size"], allowedInText: true }, handler(e6, t2, r2) {
  var { parser: n2 } = e6, i2 = r2[0], o2 = !n2.settings.displayMode || !n2.settings.useStrictBehavior("newLineInDisplayMode", "In LaTeX, \\\\ or \\newline does nothing in display mode");
  return { type: "cr", mode: n2.mode, newLine: o2, size: i2 && Hs(i2, "size").value };
}, htmlBuilder(e6, t2) {
  var r2 = Wa.makeSpan(["mspace"], [], t2);
  return e6.newLine && (r2.classes.push("newline"), e6.size && (r2.style.marginTop = Fa(e6.size, t2) + "em")), r2;
}, mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mspace");
  return e6.newLine && (r2.setAttribute("linebreak", "newline"), e6.size && r2.setAttribute("height", Fa(e6.size, t2) + "em")), r2;
} });
var Js = { "\\global": "\\global", "\\long": "\\\\globallong", "\\\\globallong": "\\\\globallong", "\\def": "\\gdef", "\\gdef": "\\gdef", "\\edef": "\\xdef", "\\xdef": "\\xdef", "\\let": "\\\\globallet", "\\futurelet": "\\\\globalfuture" }, Ks = (e6) => {
  var t2 = e6.text;
  if (/^(?:[\\{}$&#^_]|EOF)$/.test(t2)) throw new io("Expected a control sequence", e6);
  return t2;
}, Qs = (e6, t2, r2, n2) => {
  var i2 = e6.gullet.macros.get(r2.text);
  null == i2 && (r2.noexpand = true, i2 = { tokens: [r2], numArgs: 0, unexpandable: !e6.gullet.isExpandable(r2.text) }), e6.gullet.macros.set(t2, i2, n2);
};
ns({ type: "internal", names: ["\\global", "\\long", "\\\\globallong"], props: { numArgs: 0, allowedInText: true }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6;
  t2.consumeSpaces();
  var n2 = t2.fetch();
  if (Js[n2.text]) return "\\global" !== r2 && "\\\\globallong" !== r2 || (n2.text = Js[n2.text]), Hs(t2.parseFunction(), "internal");
  throw new io("Invalid token after macro prefix", n2);
} }), ns({ type: "internal", names: ["\\def", "\\gdef", "\\edef", "\\xdef"], props: { numArgs: 0, allowedInText: true, primitive: true }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6, n2 = t2.gullet.popToken(), i2 = n2.text;
  if (/^(?:[\\{}$&#^_]|EOF)$/.test(i2)) throw new io("Expected a control sequence", n2);
  for (var o2, a2 = 0, s2 = [[]]; "{" !== t2.gullet.future().text; ) if ("#" === (n2 = t2.gullet.popToken()).text) {
    if ("{" === t2.gullet.future().text) {
      o2 = t2.gullet.future(), s2[a2].push("{");
      break;
    }
    if (n2 = t2.gullet.popToken(), !/^[1-9]$/.test(n2.text)) throw new io('Invalid argument number "' + n2.text + '"');
    if (parseInt(n2.text) !== a2 + 1) throw new io('Argument number "' + n2.text + '" out of order');
    a2++, s2.push([]);
  } else {
    if ("EOF" === n2.text) throw new io("Expected a macro definition");
    s2[a2].push(n2.text);
  }
  var { tokens: l2 } = t2.gullet.consumeArg();
  return o2 && l2.unshift(o2), "\\edef" !== r2 && "\\xdef" !== r2 || (l2 = t2.gullet.expandTokens(l2)).reverse(), t2.gullet.macros.set(i2, { tokens: l2, numArgs: a2, delimiters: s2 }, r2 === Js[r2]), { type: "internal", mode: t2.mode };
} }), ns({ type: "internal", names: ["\\let", "\\\\globallet"], props: { numArgs: 0, allowedInText: true, primitive: true }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6, n2 = Ks(t2.gullet.popToken());
  t2.gullet.consumeSpaces();
  var i2 = ((e7) => {
    var t3 = e7.gullet.popToken();
    return "=" === t3.text && " " === (t3 = e7.gullet.popToken()).text && (t3 = e7.gullet.popToken()), t3;
  })(t2);
  return Qs(t2, n2, i2, "\\\\globallet" === r2), { type: "internal", mode: t2.mode };
} }), ns({ type: "internal", names: ["\\futurelet", "\\\\globalfuture"], props: { numArgs: 0, allowedInText: true, primitive: true }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6, n2 = Ks(t2.gullet.popToken()), i2 = t2.gullet.popToken(), o2 = t2.gullet.popToken();
  return Qs(t2, n2, o2, "\\\\globalfuture" === r2), t2.gullet.pushToken(o2), t2.gullet.pushToken(i2), { type: "internal", mode: t2.mode };
} });
var el = function(e6, t2, r2) {
  var n2 = jo(Xo.math[e6] && Xo.math[e6].replace || e6, t2, r2);
  if (!n2) throw new Error("Unsupported symbol " + e6 + " and font size " + t2 + ".");
  return n2;
}, tl = function(e6, t2, r2, n2) {
  var i2 = r2.havingBaseStyle(t2), o2 = Wa.makeSpan(n2.concat(i2.sizingClasses(r2)), [e6], r2), a2 = i2.sizeMultiplier / r2.sizeMultiplier;
  return o2.height *= a2, o2.depth *= a2, o2.maxFontSize = i2.sizeMultiplier, o2;
}, rl = function(e6, t2, r2) {
  var n2 = t2.havingBaseStyle(r2), i2 = (1 - t2.sizeMultiplier / n2.sizeMultiplier) * t2.fontMetrics().axisHeight;
  e6.classes.push("delimcenter"), e6.style.top = i2 + "em", e6.height -= i2, e6.depth += i2;
}, nl = function(e6, t2, r2, n2, i2, o2) {
  var a2 = (function(e7, t3, r3, n3) {
    return Wa.makeSymbol(e7, "Size" + t3 + "-Regular", r3, n3);
  })(e6, t2, i2, n2), s2 = tl(Wa.makeSpan(["delimsizing", "size" + t2], [a2], n2), xo.TEXT, n2, o2);
  return r2 && rl(s2, n2, xo.TEXT), s2;
}, il = function(e6, t2, r2) {
  var n2;
  return n2 = "Size1-Regular" === t2 ? "delim-size1" : "delim-size4", { type: "elem", elem: Wa.makeSpan(["delimsizinginner", n2], [Wa.makeSpan([], [Wa.makeSymbol(e6, t2, r2)])]) };
}, ol = function(e6, t2, r2) {
  var n2 = Vo["Size4-Regular"][e6.charCodeAt(0)] ? Vo["Size4-Regular"][e6.charCodeAt(0)][4].toFixed(3) : Vo["Size1-Regular"][e6.charCodeAt(0)][4].toFixed(3), i2 = new Fo("inner", (function(e7, t3) {
    switch (e7) {
      case "⎜":
        return "M291 0 H417 V" + t3 + " H291z M291 0 H417 V" + t3 + " H291z";
      case "∣":
        return "M145 0 H188 V" + t3 + " H145z M145 0 H188 V" + t3 + " H145z";
      case "∥":
        return "M145 0 H188 V" + t3 + " H145z M145 0 H188 V" + t3 + " H145zM367 0 H410 V" + t3 + " H367z M367 0 H410 V" + t3 + " H367z";
      case "⎟":
        return "M457 0 H583 V" + t3 + " H457z M457 0 H583 V" + t3 + " H457z";
      case "⎢":
        return "M319 0 H403 V" + t3 + " H319z M319 0 H403 V" + t3 + " H319z";
      case "⎥":
        return "M263 0 H347 V" + t3 + " H263z M263 0 H347 V" + t3 + " H263z";
      case "⎪":
        return "M384 0 H504 V" + t3 + " H384z M384 0 H504 V" + t3 + " H384z";
      case "⏐":
        return "M312 0 H355 V" + t3 + " H312z M312 0 H355 V" + t3 + " H312z";
      case "‖":
        return "M257 0 H300 V" + t3 + " H257z M257 0 H300 V" + t3 + " H257zM478 0 H521 V" + t3 + " H478z M478 0 H521 V" + t3 + " H478z";
      default:
        return "";
    }
  })(e6, Math.round(1e3 * t2))), o2 = new Oo([i2], { width: n2 + "em", height: t2 + "em", style: "width:" + n2 + "em", viewBox: "0 0 " + 1e3 * n2 + " " + Math.round(1e3 * t2), preserveAspectRatio: "xMinYMin" }), a2 = Wa.makeSvgSpan([], [o2], r2);
  return a2.height = t2, a2.style.height = t2 + "em", a2.style.width = n2 + "em", { type: "elem", elem: a2 };
}, al = { type: "kern", size: -8e-3 }, sl = ["|", "\\lvert", "\\rvert", "\\vert"], ll = ["\\|", "\\lVert", "\\rVert", "\\Vert"], ul = function(e6, t2, r2, n2, i2, o2) {
  var a2, s2, l2, u2;
  a2 = l2 = u2 = e6, s2 = null;
  var c2 = "Size1-Regular";
  "\\uparrow" === e6 ? l2 = u2 = "⏐" : "\\Uparrow" === e6 ? l2 = u2 = "‖" : "\\downarrow" === e6 ? a2 = l2 = "⏐" : "\\Downarrow" === e6 ? a2 = l2 = "‖" : "\\updownarrow" === e6 ? (a2 = "\\uparrow", l2 = "⏐", u2 = "\\downarrow") : "\\Updownarrow" === e6 ? (a2 = "\\Uparrow", l2 = "‖", u2 = "\\Downarrow") : uo.contains(sl, e6) ? l2 = "∣" : uo.contains(ll, e6) ? l2 = "∥" : "[" === e6 || "\\lbrack" === e6 ? (a2 = "⎡", l2 = "⎢", u2 = "⎣", c2 = "Size4-Regular") : "]" === e6 || "\\rbrack" === e6 ? (a2 = "⎤", l2 = "⎥", u2 = "⎦", c2 = "Size4-Regular") : "\\lfloor" === e6 || "⌊" === e6 ? (l2 = a2 = "⎢", u2 = "⎣", c2 = "Size4-Regular") : "\\lceil" === e6 || "⌈" === e6 ? (a2 = "⎡", l2 = u2 = "⎢", c2 = "Size4-Regular") : "\\rfloor" === e6 || "⌋" === e6 ? (l2 = a2 = "⎥", u2 = "⎦", c2 = "Size4-Regular") : "\\rceil" === e6 || "⌉" === e6 ? (a2 = "⎤", l2 = u2 = "⎥", c2 = "Size4-Regular") : "(" === e6 || "\\lparen" === e6 ? (a2 = "⎛", l2 = "⎜", u2 = "⎝", c2 = "Size4-Regular") : ")" === e6 || "\\rparen" === e6 ? (a2 = "⎞", l2 = "⎟", u2 = "⎠", c2 = "Size4-Regular") : "\\{" === e6 || "\\lbrace" === e6 ? (a2 = "⎧", s2 = "⎨", u2 = "⎩", l2 = "⎪", c2 = "Size4-Regular") : "\\}" === e6 || "\\rbrace" === e6 ? (a2 = "⎫", s2 = "⎬", u2 = "⎭", l2 = "⎪", c2 = "Size4-Regular") : "\\lgroup" === e6 || "⟮" === e6 ? (a2 = "⎧", u2 = "⎩", l2 = "⎪", c2 = "Size4-Regular") : "\\rgroup" === e6 || "⟯" === e6 ? (a2 = "⎫", u2 = "⎭", l2 = "⎪", c2 = "Size4-Regular") : "\\lmoustache" === e6 || "⎰" === e6 ? (a2 = "⎧", u2 = "⎭", l2 = "⎪", c2 = "Size4-Regular") : "\\rmoustache" !== e6 && "⎱" !== e6 || (a2 = "⎫", u2 = "⎩", l2 = "⎪", c2 = "Size4-Regular");
  var h2 = el(a2, c2, i2), p2 = h2.height + h2.depth, d2 = el(l2, c2, i2), m2 = d2.height + d2.depth, g2 = el(u2, c2, i2), f2 = g2.height + g2.depth, b2 = 0, y2 = 1;
  if (null !== s2) {
    var v2 = el(s2, c2, i2);
    b2 = v2.height + v2.depth, y2 = 2;
  }
  var x2 = p2 + f2 + b2, w2 = x2 + Math.max(0, Math.ceil((t2 - x2) / (y2 * m2))) * y2 * m2, k2 = n2.fontMetrics().axisHeight;
  r2 && (k2 *= n2.sizeMultiplier);
  var A2 = w2 / 2 - k2, _2 = [];
  if (_2.push(il(u2, c2, i2)), _2.push(al), null === s2) {
    var S2 = w2 - p2 - f2 + 0.016;
    _2.push(ol(l2, S2, n2));
  } else {
    var q2 = (w2 - p2 - f2 - b2) / 2 + 0.016;
    _2.push(ol(l2, q2, n2)), _2.push(al), _2.push(il(s2, c2, i2)), _2.push(al), _2.push(ol(l2, q2, n2));
  }
  _2.push(al), _2.push(il(a2, c2, i2));
  var C2 = n2.havingBaseStyle(xo.TEXT), z2 = Wa.makeVList({ positionType: "bottom", positionData: A2, children: _2 }, C2);
  return tl(Wa.makeSpan(["delimsizing", "mult"], [z2], C2), xo.TEXT, n2, o2);
}, cl = 0.08, hl = function(e6, t2, r2, n2, i2) {
  var o2 = (function(e7, t3, r3) {
    t3 *= 1e3;
    var n3 = "";
    switch (e7) {
      case "sqrtMain":
        n3 = (function(e8, t4) {
          return "M95," + (622 + e8 + t4) + "\nc-2.7,0,-7.17,-2.7,-13.5,-8c-5.8,-5.3,-9.5,-10,-9.5,-14\nc0,-2,0.3,-3.3,1,-4c1.3,-2.7,23.83,-20.7,67.5,-54\nc44.2,-33.3,65.8,-50.3,66.5,-51c1.3,-1.3,3,-2,5,-2c4.7,0,8.7,3.3,12,10\ns173,378,173,378c0.7,0,35.3,-71,104,-213c68.7,-142,137.5,-285,206.5,-429\nc69,-144,104.5,-217.7,106.5,-221\nl" + e8 / 2.075 + " -" + e8 + "\nc5.3,-9.3,12,-14,20,-14\nH400000v" + (40 + e8) + "H845.2724\ns-225.272,467,-225.272,467s-235,486,-235,486c-2.7,4.7,-9,7,-19,7\nc-6,0,-10,-1,-12,-3s-194,-422,-194,-422s-65,47,-65,47z\nM" + (834 + e8) + " " + t4 + "h400000v" + (40 + e8) + "h-400000z";
        })(t3, _o);
        break;
      case "sqrtSize1":
        n3 = (function(e8, t4) {
          return "M263," + (601 + e8 + t4) + "c0.7,0,18,39.7,52,119\nc34,79.3,68.167,158.7,102.5,238c34.3,79.3,51.8,119.3,52.5,120\nc340,-704.7,510.7,-1060.3,512,-1067\nl" + e8 / 2.084 + " -" + e8 + "\nc4.7,-7.3,11,-11,19,-11\nH40000v" + (40 + e8) + "H1012.3\ns-271.3,567,-271.3,567c-38.7,80.7,-84,175,-136,283c-52,108,-89.167,185.3,-111.5,232\nc-22.3,46.7,-33.8,70.3,-34.5,71c-4.7,4.7,-12.3,7,-23,7s-12,-1,-12,-1\ns-109,-253,-109,-253c-72.7,-168,-109.3,-252,-110,-252c-10.7,8,-22,16.7,-34,26\nc-22,17.3,-33.3,26,-34,26s-26,-26,-26,-26s76,-59,76,-59s76,-60,76,-60z\nM" + (1001 + e8) + " " + t4 + "h400000v" + (40 + e8) + "h-400000z";
        })(t3, _o);
        break;
      case "sqrtSize2":
        n3 = (function(e8, t4) {
          return "M983 " + (10 + e8 + t4) + "\nl" + e8 / 3.13 + " -" + e8 + "\nc4,-6.7,10,-10,18,-10 H400000v" + (40 + e8) + "\nH1013.1s-83.4,268,-264.1,840c-180.7,572,-277,876.3,-289,913c-4.7,4.7,-12.7,7,-24,7\ns-12,0,-12,0c-1.3,-3.3,-3.7,-11.7,-7,-25c-35.3,-125.3,-106.7,-373.3,-214,-744\nc-10,12,-21,25,-33,39s-32,39,-32,39c-6,-5.3,-15,-14,-27,-26s25,-30,25,-30\nc26.7,-32.7,52,-63,76,-91s52,-60,52,-60s208,722,208,722\nc56,-175.3,126.3,-397.3,211,-666c84.7,-268.7,153.8,-488.2,207.5,-658.5\nc53.7,-170.3,84.5,-266.8,92.5,-289.5z\nM" + (1001 + e8) + " " + t4 + "h400000v" + (40 + e8) + "h-400000z";
        })(t3, _o);
        break;
      case "sqrtSize3":
        n3 = (function(e8, t4) {
          return "M424," + (2398 + e8 + t4) + "\nc-1.3,-0.7,-38.5,-172,-111.5,-514c-73,-342,-109.8,-513.3,-110.5,-514\nc0,-2,-10.7,14.3,-32,49c-4.7,7.3,-9.8,15.7,-15.5,25c-5.7,9.3,-9.8,16,-12.5,20\ns-5,7,-5,7c-4,-3.3,-8.3,-7.7,-13,-13s-13,-13,-13,-13s76,-122,76,-122s77,-121,77,-121\ns209,968,209,968c0,-2,84.7,-361.7,254,-1079c169.3,-717.3,254.7,-1077.7,256,-1081\nl" + e8 / 4.223 + " -" + e8 + "c4,-6.7,10,-10,18,-10 H400000\nv" + (40 + e8) + "H1014.6\ns-87.3,378.7,-272.6,1166c-185.3,787.3,-279.3,1182.3,-282,1185\nc-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2z M" + (1001 + e8) + " " + t4 + "\nh400000v" + (40 + e8) + "h-400000z";
        })(t3, _o);
        break;
      case "sqrtSize4":
        n3 = (function(e8, t4) {
          return "M473," + (2713 + e8 + t4) + "\nc339.3,-1799.3,509.3,-2700,510,-2702 l" + e8 / 5.298 + " -" + e8 + "\nc3.3,-7.3,9.3,-11,18,-11 H400000v" + (40 + e8) + "H1017.7\ns-90.5,478,-276.2,1466c-185.7,988,-279.5,1483,-281.5,1485c-2,6,-10,9,-24,9\nc-8,0,-12,-0.7,-12,-2c0,-1.3,-5.3,-32,-16,-92c-50.7,-293.3,-119.7,-693.3,-207,-1200\nc0,-1.3,-5.3,8.7,-16,30c-10.7,21.3,-21.3,42.7,-32,64s-16,33,-16,33s-26,-26,-26,-26\ns76,-153,76,-153s77,-151,77,-151c0.7,0.7,35.7,202,105,604c67.3,400.7,102,602.7,104,\n606zM" + (1001 + e8) + " " + t4 + "h400000v" + (40 + e8) + "H1017.7z";
        })(t3, _o);
        break;
      case "sqrtTall":
        n3 = (function(e8, t4, r4) {
          return "M702 " + (e8 + t4) + "H400000" + (40 + e8) + "\nH742v" + (r4 - 54 - t4 - e8) + "l-4 4-4 4c-.667.7 -2 1.5-4 2.5s-4.167 1.833-6.5 2.5-5.5 1-9.5 1\nh-12l-28-84c-16.667-52-96.667 -294.333-240-727l-212 -643 -85 170\nc-4-3.333-8.333-7.667-13 -13l-13-13l77-155 77-156c66 199.333 139 419.667\n219 661 l218 661zM702 " + t4 + "H400000v" + (40 + e8) + "H742z";
        })(t3, _o, r3);
    }
    return n3;
  })(e6, n2, r2), a2 = new Fo(e6, o2), s2 = new Oo([a2], { width: "400em", height: t2 + "em", viewBox: "0 0 400000 " + r2, preserveAspectRatio: "xMinYMin slice" });
  return Wa.makeSvgSpan(["hide-tail"], [s2], i2);
}, pl = ["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "⌊", "⌋", "\\lceil", "\\rceil", "⌈", "⌉", "\\surd"], dl = ["\\uparrow", "\\downarrow", "\\updownarrow", "\\Uparrow", "\\Downarrow", "\\Updownarrow", "|", "\\|", "\\vert", "\\Vert", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "⟮", "⟯", "\\lmoustache", "\\rmoustache", "⎰", "⎱"], ml = ["<", ">", "\\langle", "\\rangle", "/", "\\backslash", "\\lt", "\\gt"], gl = [0, 1.2, 1.8, 2.4, 3], fl = [{ type: "small", style: xo.SCRIPTSCRIPT }, { type: "small", style: xo.SCRIPT }, { type: "small", style: xo.TEXT }, { type: "large", size: 1 }, { type: "large", size: 2 }, { type: "large", size: 3 }, { type: "large", size: 4 }], bl = [{ type: "small", style: xo.SCRIPTSCRIPT }, { type: "small", style: xo.SCRIPT }, { type: "small", style: xo.TEXT }, { type: "stack" }], yl = [{ type: "small", style: xo.SCRIPTSCRIPT }, { type: "small", style: xo.SCRIPT }, { type: "small", style: xo.TEXT }, { type: "large", size: 1 }, { type: "large", size: 2 }, { type: "large", size: 3 }, { type: "large", size: 4 }, { type: "stack" }], vl = function(e6) {
  if ("small" === e6.type) return "Main-Regular";
  if ("large" === e6.type) return "Size" + e6.size + "-Regular";
  if ("stack" === e6.type) return "Size4-Regular";
  throw new Error("Add support for delim type '" + e6.type + "' here.");
}, xl = function(e6, t2, r2, n2) {
  for (var i2 = Math.min(2, 3 - n2.style.size); i2 < r2.length && "stack" !== r2[i2].type; i2++) {
    var o2 = el(e6, vl(r2[i2]), "math"), a2 = o2.height + o2.depth;
    if ("small" === r2[i2].type && (a2 *= n2.havingBaseStyle(r2[i2].style).sizeMultiplier), a2 > t2) return r2[i2];
  }
  return r2[r2.length - 1];
}, wl = function(e6, t2, r2, n2, i2, o2) {
  var a2;
  "<" === e6 || "\\lt" === e6 || "⟨" === e6 ? e6 = "\\langle" : ">" !== e6 && "\\gt" !== e6 && "⟩" !== e6 || (e6 = "\\rangle"), a2 = uo.contains(ml, e6) ? fl : uo.contains(pl, e6) ? yl : bl;
  var s2 = xl(e6, t2, a2, n2);
  return "small" === s2.type ? (function(e7, t3, r3, n3, i3, o3) {
    var a3 = Wa.makeSymbol(e7, "Main-Regular", i3, n3), s3 = tl(a3, t3, n3, o3);
    return r3 && rl(s3, n3, t3), s3;
  })(e6, s2.style, r2, n2, i2, o2) : "large" === s2.type ? nl(e6, s2.size, r2, n2, i2, o2) : ul(e6, t2, r2, n2, i2, o2);
}, kl = function(e6, t2) {
  var r2, n2, i2 = t2.havingBaseSizing(), o2 = xl("\\surd", e6 * i2.sizeMultiplier, yl, i2), a2 = i2.sizeMultiplier, s2 = Math.max(0, t2.minRuleThickness - t2.fontMetrics().sqrtRuleThickness), l2 = 0, u2 = 0, c2 = 0;
  return "small" === o2.type ? (e6 < 1 ? a2 = 1 : e6 < 1.4 && (a2 = 0.7), u2 = (1 + s2) / a2, (r2 = hl("sqrtMain", l2 = (1 + s2 + cl) / a2, c2 = 1e3 + 1e3 * s2 + 80, s2, t2)).style.minWidth = "0.853em", n2 = 0.833 / a2) : "large" === o2.type ? (c2 = 1080 * gl[o2.size], u2 = (gl[o2.size] + s2) / a2, l2 = (gl[o2.size] + s2 + cl) / a2, (r2 = hl("sqrtSize" + o2.size, l2, c2, s2, t2)).style.minWidth = "1.02em", n2 = 1 / a2) : (l2 = e6 + s2 + cl, u2 = e6 + s2, c2 = Math.floor(1e3 * e6 + s2) + 80, (r2 = hl("sqrtTall", l2, c2, s2, t2)).style.minWidth = "0.742em", n2 = 1.056), r2.height = u2, r2.style.height = l2 + "em", { span: r2, advanceWidth: n2, ruleWidth: (t2.fontMetrics().sqrtRuleThickness + s2) * a2 };
}, Al = function(e6, t2, r2, n2, i2) {
  if ("<" === e6 || "\\lt" === e6 || "⟨" === e6 ? e6 = "\\langle" : ">" !== e6 && "\\gt" !== e6 && "⟩" !== e6 || (e6 = "\\rangle"), uo.contains(pl, e6) || uo.contains(ml, e6)) return nl(e6, t2, false, r2, n2, i2);
  if (uo.contains(dl, e6)) return ul(e6, gl[t2], false, r2, n2, i2);
  throw new io("Illegal delimiter: '" + e6 + "'");
}, _l = gl, Sl = wl, ql = function(e6, t2, r2, n2, i2, o2) {
  var a2 = n2.fontMetrics().axisHeight * n2.sizeMultiplier, s2 = 5 / n2.fontMetrics().ptPerEm, l2 = Math.max(t2 - a2, r2 + a2), u2 = Math.max(l2 / 500 * 901, 2 * l2 - s2);
  return wl(e6, u2, true, n2, i2, o2);
}, Cl = { "\\bigl": { mclass: "mopen", size: 1 }, "\\Bigl": { mclass: "mopen", size: 2 }, "\\biggl": { mclass: "mopen", size: 3 }, "\\Biggl": { mclass: "mopen", size: 4 }, "\\bigr": { mclass: "mclose", size: 1 }, "\\Bigr": { mclass: "mclose", size: 2 }, "\\biggr": { mclass: "mclose", size: 3 }, "\\Biggr": { mclass: "mclose", size: 4 }, "\\bigm": { mclass: "mrel", size: 1 }, "\\Bigm": { mclass: "mrel", size: 2 }, "\\biggm": { mclass: "mrel", size: 3 }, "\\Biggm": { mclass: "mrel", size: 4 }, "\\big": { mclass: "mord", size: 1 }, "\\Big": { mclass: "mord", size: 2 }, "\\bigg": { mclass: "mord", size: 3 }, "\\Bigg": { mclass: "mord", size: 4 } }, zl = ["(", "\\lparen", ")", "\\rparen", "[", "\\lbrack", "]", "\\rbrack", "\\{", "\\lbrace", "\\}", "\\rbrace", "\\lfloor", "\\rfloor", "⌊", "⌋", "\\lceil", "\\rceil", "⌈", "⌉", "<", ">", "\\langle", "⟨", "\\rangle", "⟩", "\\lt", "\\gt", "\\lvert", "\\rvert", "\\lVert", "\\rVert", "\\lgroup", "\\rgroup", "⟮", "⟯", "\\lmoustache", "\\rmoustache", "⎰", "⎱", "/", "\\backslash", "|", "\\vert", "\\|", "\\Vert", "\\uparrow", "\\Uparrow", "\\downarrow", "\\Downarrow", "\\updownarrow", "\\Updownarrow", "."];
function Tl(e6, t2) {
  var r2 = Is(e6);
  if (r2 && uo.contains(zl, r2.text)) return r2;
  throw new io(r2 ? "Invalid delimiter '" + r2.text + "' after '" + t2.funcName + "'" : "Invalid delimiter type '" + e6.type + "'", e6);
}
function Ml(e6) {
  if (!e6.body) throw new Error("Bug: The leftright ParseNode wasn't fully parsed.");
}
ns({ type: "delimsizing", names: ["\\bigl", "\\Bigl", "\\biggl", "\\Biggl", "\\bigr", "\\Bigr", "\\biggr", "\\Biggr", "\\bigm", "\\Bigm", "\\biggm", "\\Biggm", "\\big", "\\Big", "\\bigg", "\\Bigg"], props: { numArgs: 1, argTypes: ["primitive"] }, handler: (e6, t2) => {
  var r2 = Tl(t2[0], e6);
  return { type: "delimsizing", mode: e6.parser.mode, size: Cl[e6.funcName].size, mclass: Cl[e6.funcName].mclass, delim: r2.text };
}, htmlBuilder: (e6, t2) => "." === e6.delim ? Wa.makeSpan([e6.mclass]) : Al(e6.delim, e6.size, t2, e6.mode, [e6.mclass]), mathmlBuilder: (e6) => {
  var t2 = [];
  "." !== e6.delim && t2.push(Ss(e6.delim, e6.mode));
  var r2 = new _s.MathNode("mo", t2);
  return "mopen" === e6.mclass || "mclose" === e6.mclass ? r2.setAttribute("fence", "true") : r2.setAttribute("fence", "false"), r2.setAttribute("stretchy", "true"), r2.setAttribute("minsize", _l[e6.size] + "em"), r2.setAttribute("maxsize", _l[e6.size] + "em"), r2;
} }), ns({ type: "leftright-right", names: ["\\right"], props: { numArgs: 1, primitive: true }, handler: (e6, t2) => {
  var r2 = e6.parser.gullet.macros.get("\\current@color");
  if (r2 && "string" != typeof r2) throw new io("\\current@color set to non-string in \\right");
  return { type: "leftright-right", mode: e6.parser.mode, delim: Tl(t2[0], e6).text, color: r2 };
} }), ns({ type: "leftright", names: ["\\left"], props: { numArgs: 1, primitive: true }, handler: (e6, t2) => {
  var r2 = Tl(t2[0], e6), n2 = e6.parser;
  ++n2.leftrightDepth;
  var i2 = n2.parseExpression(false);
  --n2.leftrightDepth, n2.expect("\\right", false);
  var o2 = Hs(n2.parseFunction(), "leftright-right");
  return { type: "leftright", mode: n2.mode, body: i2, left: r2.text, right: o2.delim, rightColor: o2.color };
}, htmlBuilder: (e6, t2) => {
  Ml(e6);
  for (var r2, n2, i2 = ps(e6.body, t2, true, ["mopen", "mclose"]), o2 = 0, a2 = 0, s2 = false, l2 = 0; l2 < i2.length; l2++) i2[l2].isMiddle ? s2 = true : (o2 = Math.max(i2[l2].height, o2), a2 = Math.max(i2[l2].depth, a2));
  if (o2 *= t2.sizeMultiplier, a2 *= t2.sizeMultiplier, r2 = "." === e6.left ? bs(t2, ["mopen"]) : ql(e6.left, o2, a2, t2, e6.mode, ["mopen"]), i2.unshift(r2), s2) for (var u2 = 1; u2 < i2.length; u2++) {
    var c2 = i2[u2].isMiddle;
    c2 && (i2[u2] = ql(c2.delim, o2, a2, c2.options, e6.mode, []));
  }
  if ("." === e6.right) n2 = bs(t2, ["mclose"]);
  else {
    var h2 = e6.rightColor ? t2.withColor(e6.rightColor) : t2;
    n2 = ql(e6.right, o2, a2, h2, e6.mode, ["mclose"]);
  }
  return i2.push(n2), Wa.makeSpan(["minner"], i2, t2);
}, mathmlBuilder: (e6, t2) => {
  Ml(e6);
  var r2 = zs(e6.body, t2);
  if ("." !== e6.left) {
    var n2 = new _s.MathNode("mo", [Ss(e6.left, e6.mode)]);
    n2.setAttribute("fence", "true"), r2.unshift(n2);
  }
  if ("." !== e6.right) {
    var i2 = new _s.MathNode("mo", [Ss(e6.right, e6.mode)]);
    i2.setAttribute("fence", "true"), e6.rightColor && i2.setAttribute("mathcolor", e6.rightColor), r2.push(i2);
  }
  return qs(r2);
} }), ns({ type: "middle", names: ["\\middle"], props: { numArgs: 1, primitive: true }, handler: (e6, t2) => {
  var r2 = Tl(t2[0], e6);
  if (!e6.parser.leftrightDepth) throw new io("\\middle without preceding \\left", r2);
  return { type: "middle", mode: e6.parser.mode, delim: r2.text };
}, htmlBuilder: (e6, t2) => {
  var r2;
  if ("." === e6.delim) r2 = bs(t2, []);
  else {
    r2 = Al(e6.delim, 1, t2, e6.mode, []);
    var n2 = { delim: e6.delim, options: t2 };
    r2.isMiddle = n2;
  }
  return r2;
}, mathmlBuilder: (e6, t2) => {
  var r2 = "\\vert" === e6.delim || "|" === e6.delim ? Ss("|", "text") : Ss(e6.delim, e6.mode), n2 = new _s.MathNode("mo", [r2]);
  return n2.setAttribute("fence", "true"), n2.setAttribute("lspace", "0.05em"), n2.setAttribute("rspace", "0.05em"), n2;
} });
var El = (e6, t2) => {
  var r2, n2, i2 = Wa.wrapFragment(ys(e6.body, t2), t2), o2 = e6.label.substr(1), a2 = t2.sizeMultiplier, s2 = 0, l2 = uo.isCharacterBox(e6.body);
  if ("sout" === o2) (r2 = Wa.makeSpan(["stretchy", "sout"])).height = t2.fontMetrics().defaultRuleThickness / a2, s2 = -0.5 * t2.fontMetrics().xHeight;
  else if ("phase" === o2) {
    var u2 = Fa({ number: 0.6, unit: "pt" }, t2), c2 = Fa({ number: 0.35, unit: "ex" }, t2);
    a2 /= t2.havingBaseSizing().sizeMultiplier;
    var h2 = i2.height + i2.depth + u2 + c2;
    i2.style.paddingLeft = h2 / 2 + u2 + "em";
    var p2 = Math.floor(1e3 * h2 * a2), d2 = (function(e7) {
      return "M400000 " + e7 + " H0 L" + e7 / 2 + " 0 l65 45 L145 " + (e7 - 80) + " H400000z";
    })(p2), m2 = new Oo([new Fo("phase", d2)], { width: "400em", height: p2 / 1e3 + "em", viewBox: "0 0 400000 " + p2, preserveAspectRatio: "xMinYMin slice" });
    (r2 = Wa.makeSvgSpan(["hide-tail"], [m2], t2)).style.height = h2 + "em", s2 = i2.depth + u2 + c2;
  } else {
    /cancel/.test(o2) ? l2 || i2.classes.push("cancel-pad") : "angl" === o2 ? i2.classes.push("anglpad") : i2.classes.push("boxpad");
    var g2 = 0, f2 = 0, b2 = 0;
    /box/.test(o2) ? (b2 = Math.max(t2.fontMetrics().fboxrule, t2.minRuleThickness), f2 = g2 = t2.fontMetrics().fboxsep + ("colorbox" === o2 ? 0 : b2)) : "angl" === o2 ? (g2 = 4 * (b2 = Math.max(t2.fontMetrics().defaultRuleThickness, t2.minRuleThickness)), f2 = Math.max(0, 0.25 - i2.depth)) : f2 = g2 = l2 ? 0.2 : 0, r2 = Os(i2, o2, g2, f2, t2), /fbox|boxed|fcolorbox/.test(o2) ? (r2.style.borderStyle = "solid", r2.style.borderWidth = b2 + "em") : "angl" === o2 && 0.049 !== b2 && (r2.style.borderTopWidth = b2 + "em", r2.style.borderRightWidth = b2 + "em"), s2 = i2.depth + f2, e6.backgroundColor && (r2.style.backgroundColor = e6.backgroundColor, e6.borderColor && (r2.style.borderColor = e6.borderColor));
  }
  if (e6.backgroundColor) n2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: r2, shift: s2 }, { type: "elem", elem: i2, shift: 0 }] }, t2);
  else {
    var y2 = /cancel|phase/.test(o2) ? ["svg-align"] : [];
    n2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: i2, shift: 0 }, { type: "elem", elem: r2, shift: s2, wrapperClasses: y2 }] }, t2);
  }
  return /cancel/.test(o2) && (n2.height = i2.height, n2.depth = i2.depth), /cancel/.test(o2) && !l2 ? Wa.makeSpan(["mord", "cancel-lap"], [n2], t2) : Wa.makeSpan(["mord"], [n2], t2);
}, Dl = (e6, t2) => {
  var r2 = 0, n2 = new _s.MathNode(e6.label.indexOf("colorbox") > -1 ? "mpadded" : "menclose", [Ms(e6.body, t2)]);
  switch (e6.label) {
    case "\\cancel":
      n2.setAttribute("notation", "updiagonalstrike");
      break;
    case "\\bcancel":
      n2.setAttribute("notation", "downdiagonalstrike");
      break;
    case "\\phase":
      n2.setAttribute("notation", "phasorangle");
      break;
    case "\\sout":
      n2.setAttribute("notation", "horizontalstrike");
      break;
    case "\\fbox":
      n2.setAttribute("notation", "box");
      break;
    case "\\angl":
      n2.setAttribute("notation", "actuarial");
      break;
    case "\\fcolorbox":
    case "\\colorbox":
      if (r2 = t2.fontMetrics().fboxsep * t2.fontMetrics().ptPerEm, n2.setAttribute("width", "+" + 2 * r2 + "pt"), n2.setAttribute("height", "+" + 2 * r2 + "pt"), n2.setAttribute("lspace", r2 + "pt"), n2.setAttribute("voffset", r2 + "pt"), "\\fcolorbox" === e6.label) {
        var i2 = Math.max(t2.fontMetrics().fboxrule, t2.minRuleThickness);
        n2.setAttribute("style", "border: " + i2 + "em solid " + String(e6.borderColor));
      }
      break;
    case "\\xcancel":
      n2.setAttribute("notation", "updiagonalstrike downdiagonalstrike");
  }
  return e6.backgroundColor && n2.setAttribute("mathbackground", e6.backgroundColor), n2;
};
ns({ type: "enclose", names: ["\\colorbox"], props: { numArgs: 2, allowedInText: true, argTypes: ["color", "text"] }, handler(e6, t2, r2) {
  var { parser: n2, funcName: i2 } = e6, o2 = Hs(t2[0], "color-token").color, a2 = t2[1];
  return { type: "enclose", mode: n2.mode, label: i2, backgroundColor: o2, body: a2 };
}, htmlBuilder: El, mathmlBuilder: Dl }), ns({ type: "enclose", names: ["\\fcolorbox"], props: { numArgs: 3, allowedInText: true, argTypes: ["color", "color", "text"] }, handler(e6, t2, r2) {
  var { parser: n2, funcName: i2 } = e6, o2 = Hs(t2[0], "color-token").color, a2 = Hs(t2[1], "color-token").color, s2 = t2[2];
  return { type: "enclose", mode: n2.mode, label: i2, backgroundColor: a2, borderColor: o2, body: s2 };
}, htmlBuilder: El, mathmlBuilder: Dl }), ns({ type: "enclose", names: ["\\fbox"], props: { numArgs: 1, argTypes: ["hbox"], allowedInText: true }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "enclose", mode: r2.mode, label: "\\fbox", body: t2[0] };
} }), ns({ type: "enclose", names: ["\\cancel", "\\bcancel", "\\xcancel", "\\sout", "\\phase"], props: { numArgs: 1 }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  return { type: "enclose", mode: r2.mode, label: n2, body: i2 };
}, htmlBuilder: El, mathmlBuilder: Dl }), ns({ type: "enclose", names: ["\\angl"], props: { numArgs: 1, argTypes: ["hbox"], allowedInText: false }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "enclose", mode: r2.mode, label: "\\angl", body: t2[0] };
} });
var Ll = {};
function Bl(e6) {
  for (var { type: t2, names: r2, props: n2, handler: i2, htmlBuilder: o2, mathmlBuilder: a2 } = e6, s2 = { type: t2, numArgs: n2.numArgs || 0, allowedInText: false, numOptionalArgs: 0, handler: i2 }, l2 = 0; l2 < r2.length; ++l2) Ll[r2[l2]] = s2;
  o2 && (ts[t2] = o2), a2 && (rs[t2] = a2);
}
function Nl(e6) {
  var t2 = [];
  e6.consumeSpaces();
  for (var r2 = e6.fetch().text; "\\hline" === r2 || "\\hdashline" === r2; ) e6.consume(), t2.push("\\hdashline" === r2), e6.consumeSpaces(), r2 = e6.fetch().text;
  return t2;
}
var Ol = (e6) => {
  if (!e6.parser.settings.displayMode) throw new io("{" + e6.envName + "} can be used only in display mode.");
};
function Fl(e6, t2, r2) {
  var { hskipBeforeAndAfter: n2, addJot: i2, cols: o2, arraystretch: a2, colSeparationType: s2, addEqnNum: l2, singleRow: u2, emptySingleRow: c2, maxNumCols: h2, leqno: p2 } = t2;
  if (e6.gullet.beginGroup(), u2 || e6.gullet.macros.set("\\cr", "\\\\\\relax"), !a2) {
    var d2 = e6.gullet.expandMacroAsText("\\arraystretch");
    if (null == d2) a2 = 1;
    else if (!(a2 = parseFloat(d2)) || a2 < 0) throw new io("Invalid \\arraystretch: " + d2);
  }
  e6.gullet.beginGroup();
  var m2 = [], g2 = [m2], f2 = [], b2 = [];
  for (b2.push(Nl(e6)); ; ) {
    var y2 = e6.parseExpression(false, u2 ? "\\end" : "\\\\");
    e6.gullet.endGroup(), e6.gullet.beginGroup(), y2 = { type: "ordgroup", mode: e6.mode, body: y2 }, r2 && (y2 = { type: "styling", mode: e6.mode, style: r2, body: [y2] }), m2.push(y2);
    var v2 = e6.fetch().text;
    if ("&" === v2) {
      if (h2 && m2.length === h2) {
        if (u2 || s2) throw new io("Too many tab characters: &", e6.nextToken);
        e6.settings.reportNonstrict("textEnv", "Too few columns specified in the {array} column argument.");
      }
      e6.consume();
    } else {
      if ("\\end" === v2) {
        1 === m2.length && "styling" === y2.type && 0 === y2.body[0].body.length && (g2.length > 1 || !c2) && g2.pop(), b2.length < g2.length + 1 && b2.push([]);
        break;
      }
      if ("\\\\" !== v2) throw new io("Expected & or \\\\ or \\cr or \\end", e6.nextToken);
      e6.consume();
      var x2 = void 0;
      " " !== e6.gullet.future().text && (x2 = e6.parseSizeGroup(true)), f2.push(x2 ? x2.value : null), b2.push(Nl(e6)), m2 = [], g2.push(m2);
    }
  }
  return e6.gullet.endGroup(), e6.gullet.endGroup(), { type: "array", mode: e6.mode, addJot: i2, arraystretch: a2, body: g2, cols: o2, rowGaps: f2, hskipBeforeAndAfter: n2, hLinesBeforeRow: b2, colSeparationType: s2, addEqnNum: l2, leqno: p2 };
}
function Rl(e6) {
  return "d" === e6.substr(0, 1) ? "display" : "text";
}
var Hl = function(e6, t2) {
  var r2, n2, i2 = e6.body.length, o2 = e6.hLinesBeforeRow, a2 = 0, s2 = new Array(i2), l2 = [], u2 = Math.max(t2.fontMetrics().arrayRuleWidth, t2.minRuleThickness), c2 = 1 / t2.fontMetrics().ptPerEm, h2 = 5 * c2;
  e6.colSeparationType && "small" === e6.colSeparationType && (h2 = t2.havingStyle(xo.SCRIPT).sizeMultiplier / t2.sizeMultiplier * 0.2778);
  var p2 = "CD" === e6.colSeparationType ? Fa({ number: 3, unit: "ex" }, t2) : 12 * c2, d2 = 3 * c2, m2 = e6.arraystretch * p2, g2 = 0.7 * m2, f2 = 0.3 * m2, b2 = 0;
  function y2(e7) {
    for (var t3 = 0; t3 < e7.length; ++t3) t3 > 0 && (b2 += 0.25), l2.push({ pos: b2, isDashed: e7[t3] });
  }
  for (y2(o2[0]), r2 = 0; r2 < e6.body.length; ++r2) {
    var v2 = e6.body[r2], x2 = g2, w2 = f2;
    a2 < v2.length && (a2 = v2.length);
    var k2 = new Array(v2.length);
    for (n2 = 0; n2 < v2.length; ++n2) {
      var A2 = ys(v2[n2], t2);
      w2 < A2.depth && (w2 = A2.depth), x2 < A2.height && (x2 = A2.height), k2[n2] = A2;
    }
    var _2 = e6.rowGaps[r2], S2 = 0;
    _2 && (S2 = Fa(_2, t2)) > 0 && (w2 < (S2 += f2) && (w2 = S2), S2 = 0), e6.addJot && (w2 += d2), k2.height = x2, k2.depth = w2, b2 += x2, k2.pos = b2, b2 += w2 + S2, s2[r2] = k2, y2(o2[r2 + 1]);
  }
  var q2, C2, z2 = b2 / 2 + t2.fontMetrics().axisHeight, T2 = e6.cols || [], M2 = [], E2 = [];
  if (e6.addEqnNum) for (r2 = 0; r2 < i2; ++r2) {
    var D2 = s2[r2], L2 = D2.pos - z2, B2 = Wa.makeSpan(["eqn-num"], [], t2);
    B2.depth = D2.depth, B2.height = D2.height, E2.push({ type: "elem", elem: B2, shift: L2 });
  }
  for (n2 = 0, C2 = 0; n2 < a2 || C2 < T2.length; ++n2, ++C2) {
    for (var N2 = T2[C2] || {}, O2 = true; "separator" === N2.type; ) {
      if (O2 || ((q2 = Wa.makeSpan(["arraycolsep"], [])).style.width = t2.fontMetrics().doubleRuleSep + "em", M2.push(q2)), "|" !== N2.separator && ":" !== N2.separator) throw new io("Invalid separator type: " + N2.separator);
      var F2 = "|" === N2.separator ? "solid" : "dashed", R2 = Wa.makeSpan(["vertical-separator"], [], t2);
      R2.style.height = b2 + "em", R2.style.borderRightWidth = u2 + "em", R2.style.borderRightStyle = F2, R2.style.margin = "0 -" + u2 / 2 + "em", R2.style.verticalAlign = -(b2 - z2) + "em", M2.push(R2), N2 = T2[++C2] || {}, O2 = false;
    }
    if (!(n2 >= a2)) {
      var H2 = void 0;
      (n2 > 0 || e6.hskipBeforeAndAfter) && 0 !== (H2 = uo.deflt(N2.pregap, h2)) && ((q2 = Wa.makeSpan(["arraycolsep"], [])).style.width = H2 + "em", M2.push(q2));
      var V2 = [];
      for (r2 = 0; r2 < i2; ++r2) {
        var I2 = s2[r2], P2 = I2[n2];
        if (P2) {
          var j2 = I2.pos - z2;
          P2.depth = I2.depth, P2.height = I2.height, V2.push({ type: "elem", elem: P2, shift: j2 });
        }
      }
      V2 = Wa.makeVList({ positionType: "individualShift", children: V2 }, t2), V2 = Wa.makeSpan(["col-align-" + (N2.align || "c")], [V2]), M2.push(V2), (n2 < a2 - 1 || e6.hskipBeforeAndAfter) && 0 !== (H2 = uo.deflt(N2.postgap, h2)) && ((q2 = Wa.makeSpan(["arraycolsep"], [])).style.width = H2 + "em", M2.push(q2));
    }
  }
  if (s2 = Wa.makeSpan(["mtable"], M2), l2.length > 0) {
    for (var G2 = Wa.makeLineSpan("hline", t2, u2), U2 = Wa.makeLineSpan("hdashline", t2, u2), Y2 = [{ type: "elem", elem: s2, shift: 0 }]; l2.length > 0; ) {
      var X2 = l2.pop(), W2 = X2.pos - z2;
      X2.isDashed ? Y2.push({ type: "elem", elem: U2, shift: W2 }) : Y2.push({ type: "elem", elem: G2, shift: W2 });
    }
    s2 = Wa.makeVList({ positionType: "individualShift", children: Y2 }, t2);
  }
  if (e6.addEqnNum) {
    var $2 = Wa.makeVList({ positionType: "individualShift", children: E2 }, t2);
    return $2 = Wa.makeSpan(["tag"], [$2], t2), Wa.makeFragment([s2, $2]);
  }
  return Wa.makeSpan(["mord"], [s2], t2);
}, Vl = { c: "center ", l: "left ", r: "right " }, Il = function(e6, t2) {
  for (var r2 = [], n2 = new _s.MathNode("mtd", [], ["mtr-glue"]), i2 = new _s.MathNode("mtd", [], ["mml-eqn-num"]), o2 = 0; o2 < e6.body.length; o2++) {
    for (var a2 = e6.body[o2], s2 = [], l2 = 0; l2 < a2.length; l2++) s2.push(new _s.MathNode("mtd", [Ms(a2[l2], t2)]));
    e6.addEqnNum && (s2.unshift(n2), s2.push(n2), e6.leqno ? s2.unshift(i2) : s2.push(i2)), r2.push(new _s.MathNode("mtr", s2));
  }
  var u2 = new _s.MathNode("mtable", r2), c2 = 0.5 === e6.arraystretch ? 0.1 : 0.16 + e6.arraystretch - 1 + (e6.addJot ? 0.09 : 0);
  u2.setAttribute("rowspacing", c2.toFixed(4) + "em");
  var h2 = "", p2 = "";
  if (e6.cols && e6.cols.length > 0) {
    var d2 = e6.cols, m2 = "", g2 = false, f2 = 0, b2 = d2.length;
    "separator" === d2[0].type && (h2 += "top ", f2 = 1), "separator" === d2[d2.length - 1].type && (h2 += "bottom ", b2 -= 1);
    for (var y2 = f2; y2 < b2; y2++) "align" === d2[y2].type ? (p2 += Vl[d2[y2].align], g2 && (m2 += "none "), g2 = true) : "separator" === d2[y2].type && g2 && (m2 += "|" === d2[y2].separator ? "solid " : "dashed ", g2 = false);
    u2.setAttribute("columnalign", p2.trim()), /[sd]/.test(m2) && u2.setAttribute("columnlines", m2.trim());
  }
  if ("align" === e6.colSeparationType) {
    for (var v2 = e6.cols || [], x2 = "", w2 = 1; w2 < v2.length; w2++) x2 += w2 % 2 ? "0em " : "1em ";
    u2.setAttribute("columnspacing", x2.trim());
  } else "alignat" === e6.colSeparationType || "gather" === e6.colSeparationType ? u2.setAttribute("columnspacing", "0em") : "small" === e6.colSeparationType ? u2.setAttribute("columnspacing", "0.2778em") : "CD" === e6.colSeparationType ? u2.setAttribute("columnspacing", "0.5em") : u2.setAttribute("columnspacing", "1em");
  var k2 = "", A2 = e6.hLinesBeforeRow;
  h2 += A2[0].length > 0 ? "left " : "", h2 += A2[A2.length - 1].length > 0 ? "right " : "";
  for (var _2 = 1; _2 < A2.length - 1; _2++) k2 += 0 === A2[_2].length ? "none " : A2[_2][0] ? "dashed " : "solid ";
  return /[sd]/.test(k2) && u2.setAttribute("rowlines", k2.trim()), "" !== h2 && (u2 = new _s.MathNode("menclose", [u2])).setAttribute("notation", h2.trim()), e6.arraystretch && e6.arraystretch < 1 && (u2 = new _s.MathNode("mstyle", [u2])).setAttribute("scriptlevel", "1"), u2;
}, Pl = function(e6, t2) {
  -1 === e6.envName.indexOf("ed") && Ol(e6);
  var r2, n2 = [], i2 = e6.envName.indexOf("at") > -1 ? "alignat" : "align", o2 = Fl(e6.parser, { cols: n2, addJot: true, addEqnNum: "align" === e6.envName || "alignat" === e6.envName, emptySingleRow: true, colSeparationType: i2, maxNumCols: "split" === e6.envName ? 2 : void 0, leqno: e6.parser.settings.leqno }, "display"), a2 = 0, s2 = { type: "ordgroup", mode: e6.mode, body: [] };
  if (t2[0] && "ordgroup" === t2[0].type) {
    for (var l2 = "", u2 = 0; u2 < t2[0].body.length; u2++) {
      l2 += Hs(t2[0].body[u2], "textord").text;
    }
    r2 = Number(l2), a2 = 2 * r2;
  }
  var c2 = !a2;
  o2.body.forEach((function(e7) {
    for (var t3 = 1; t3 < e7.length; t3 += 2) {
      var n3 = Hs(e7[t3], "styling");
      Hs(n3.body[0], "ordgroup").body.unshift(s2);
    }
    if (c2) a2 < e7.length && (a2 = e7.length);
    else {
      var i3 = e7.length / 2;
      if (r2 < i3) throw new io("Too many math in a row: expected " + r2 + ", but got " + i3, e7[0]);
    }
  }));
  for (var h2 = 0; h2 < a2; ++h2) {
    var p2 = "r", d2 = 0;
    h2 % 2 == 1 ? p2 = "l" : h2 > 0 && c2 && (d2 = 1), n2[h2] = { type: "align", align: p2, pregap: d2, postgap: 0 };
  }
  return o2.colSeparationType = c2 ? "align" : "alignat", o2;
};
Bl({ type: "array", names: ["array", "darray"], props: { numArgs: 1 }, handler(e6, t2) {
  var r2 = (Is(t2[0]) ? [t2[0]] : Hs(t2[0], "ordgroup").body).map((function(e7) {
    var t3 = Vs(e7).text;
    if (-1 !== "lcr".indexOf(t3)) return { type: "align", align: t3 };
    if ("|" === t3) return { type: "separator", separator: "|" };
    if (":" === t3) return { type: "separator", separator: ":" };
    throw new io("Unknown column alignment: " + t3, e7);
  })), n2 = { cols: r2, hskipBeforeAndAfter: true, maxNumCols: r2.length };
  return Fl(e6.parser, n2, Rl(e6.envName));
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["matrix", "pmatrix", "bmatrix", "Bmatrix", "vmatrix", "Vmatrix", "matrix*", "pmatrix*", "bmatrix*", "Bmatrix*", "vmatrix*", "Vmatrix*"], props: { numArgs: 0 }, handler(e6) {
  var t2 = { matrix: null, pmatrix: ["(", ")"], bmatrix: ["[", "]"], Bmatrix: ["\\{", "\\}"], vmatrix: ["|", "|"], Vmatrix: ["\\Vert", "\\Vert"] }[e6.envName.replace("*", "")], r2 = "c", n2 = { hskipBeforeAndAfter: false, cols: [{ type: "align", align: r2 }] };
  if ("*" === e6.envName.charAt(e6.envName.length - 1)) {
    var i2 = e6.parser;
    if (i2.consumeSpaces(), "[" === i2.fetch().text) {
      if (i2.consume(), i2.consumeSpaces(), r2 = i2.fetch().text, -1 === "lcr".indexOf(r2)) throw new io("Expected l or c or r", i2.nextToken);
      i2.consume(), i2.consumeSpaces(), i2.expect("]"), i2.consume(), n2.cols = [{ type: "align", align: r2 }];
    }
  }
  var o2 = Fl(e6.parser, n2, Rl(e6.envName)), a2 = Math.max(0, ...o2.body.map(((e7) => e7.length)));
  return o2.cols = new Array(a2).fill({ type: "align", align: r2 }), t2 ? { type: "leftright", mode: e6.mode, body: [o2], left: t2[0], right: t2[1], rightColor: void 0 } : o2;
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["smallmatrix"], props: { numArgs: 0 }, handler(e6) {
  var t2 = Fl(e6.parser, { arraystretch: 0.5 }, "script");
  return t2.colSeparationType = "small", t2;
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["subarray"], props: { numArgs: 1 }, handler(e6, t2) {
  var r2 = (Is(t2[0]) ? [t2[0]] : Hs(t2[0], "ordgroup").body).map((function(e7) {
    var t3 = Vs(e7).text;
    if (-1 !== "lc".indexOf(t3)) return { type: "align", align: t3 };
    throw new io("Unknown column alignment: " + t3, e7);
  }));
  if (r2.length > 1) throw new io("{subarray} can contain only one column");
  var n2 = { cols: r2, hskipBeforeAndAfter: false, arraystretch: 0.5 };
  if ((n2 = Fl(e6.parser, n2, "script")).body.length > 0 && n2.body[0].length > 1) throw new io("{subarray} can contain only one column");
  return n2;
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["cases", "dcases", "rcases", "drcases"], props: { numArgs: 0 }, handler(e6) {
  var t2 = Fl(e6.parser, { arraystretch: 1.2, cols: [{ type: "align", align: "l", pregap: 0, postgap: 1 }, { type: "align", align: "l", pregap: 0, postgap: 0 }] }, Rl(e6.envName));
  return { type: "leftright", mode: e6.mode, body: [t2], left: e6.envName.indexOf("r") > -1 ? "." : "\\{", right: e6.envName.indexOf("r") > -1 ? "\\}" : ".", rightColor: void 0 };
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["align", "align*", "aligned", "split"], props: { numArgs: 0 }, handler: Pl, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["gathered", "gather", "gather*"], props: { numArgs: 0 }, handler(e6) {
  uo.contains(["gather", "gather*"], e6.envName) && Ol(e6);
  var t2 = { cols: [{ type: "align", align: "c" }], addJot: true, colSeparationType: "gather", addEqnNum: "gather" === e6.envName, emptySingleRow: true, leqno: e6.parser.settings.leqno };
  return Fl(e6.parser, t2, "display");
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["alignat", "alignat*", "alignedat"], props: { numArgs: 1 }, handler: Pl, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["equation", "equation*"], props: { numArgs: 0 }, handler(e6) {
  Ol(e6);
  var t2 = { addEqnNum: "equation" === e6.envName, emptySingleRow: true, singleRow: true, maxNumCols: 1, leqno: e6.parser.settings.leqno };
  return Fl(e6.parser, t2, "display");
}, htmlBuilder: Hl, mathmlBuilder: Il }), Bl({ type: "array", names: ["CD"], props: { numArgs: 0 }, handler: (e6) => (Ol(e6), (function(e7) {
  var t2 = [];
  for (e7.gullet.beginGroup(), e7.gullet.macros.set("\\cr", "\\\\\\relax"), e7.gullet.beginGroup(); ; ) {
    t2.push(e7.parseExpression(false, "\\\\")), e7.gullet.endGroup(), e7.gullet.beginGroup();
    var r2 = e7.fetch().text;
    if ("&" !== r2 && "\\\\" !== r2) {
      if ("\\end" === r2) {
        0 === t2[t2.length - 1].length && t2.pop();
        break;
      }
      throw new io("Expected \\\\ or \\cr or \\end", e7.nextToken);
    }
    e7.consume();
  }
  for (var n2, i2, o2 = [], a2 = [o2], s2 = 0; s2 < t2.length; s2++) {
    for (var l2 = t2[s2], u2 = { type: "styling", body: [], mode: "math", style: "display" }, c2 = 0; c2 < l2.length; c2++) if (Xs(l2[c2])) {
      o2.push(u2);
      var h2 = Vs(l2[c2 += 1]).text, p2 = new Array(2);
      if (p2[0] = { type: "ordgroup", mode: "math", body: [] }, p2[1] = { type: "ordgroup", mode: "math", body: [] }, "=|.".indexOf(h2) > -1) ;
      else {
        if (!("<>AV".indexOf(h2) > -1)) throw new io('Expected one of "<>AV=|." after @', l2[c2]);
        for (var d2 = 0; d2 < 2; d2++) {
          for (var m2 = true, g2 = c2 + 1; g2 < l2.length; g2++) {
            if (i2 = h2, ("mathord" === (n2 = l2[g2]).type || "atom" === n2.type) && n2.text === i2) {
              m2 = false, c2 = g2;
              break;
            }
            if (Xs(l2[g2])) throw new io("Missing a " + h2 + " character to complete a CD arrow.", l2[g2]);
            p2[d2].body.push(l2[g2]);
          }
          if (m2) throw new io("Missing a " + h2 + " character to complete a CD arrow.", l2[c2]);
        }
      }
      var f2 = { type: "styling", body: [Ws(h2, p2, e7)], mode: "math", style: "display" };
      o2.push(f2), u2 = { type: "styling", body: [], mode: "math", style: "display" };
    } else u2.body.push(l2[c2]);
    s2 % 2 == 0 ? o2.push(u2) : o2.shift(), o2 = [], a2.push(o2);
  }
  return e7.gullet.endGroup(), e7.gullet.endGroup(), { type: "array", mode: "math", body: a2, arraystretch: 1, addJot: true, rowGaps: [null], cols: new Array(a2[0].length).fill({ type: "align", align: "c", pregap: 0.25, postgap: 0.25 }), colSeparationType: "CD", hLinesBeforeRow: new Array(a2.length + 1).fill([]) };
})(e6.parser)), htmlBuilder: Hl, mathmlBuilder: Il }), ns({ type: "text", names: ["\\hline", "\\hdashline"], props: { numArgs: 0, allowedInText: true, allowedInMath: true }, handler(e6, t2) {
  throw new io(e6.funcName + " valid only within array environment");
} });
var jl = Ll;
ns({ type: "environment", names: ["\\begin", "\\end"], props: { numArgs: 1, argTypes: ["text"] }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  if ("ordgroup" !== i2.type) throw new io("Invalid environment name", i2);
  for (var o2 = "", a2 = 0; a2 < i2.body.length; ++a2) o2 += Hs(i2.body[a2], "textord").text;
  if ("\\begin" === n2) {
    if (!jl.hasOwnProperty(o2)) throw new io("No such environment: " + o2, i2);
    var s2 = jl[o2], { args: l2, optArgs: u2 } = r2.parseArguments("\\begin{" + o2 + "}", s2), c2 = { mode: r2.mode, envName: o2, parser: r2 }, h2 = s2.handler(c2, l2, u2);
    r2.expect("\\end", false);
    var p2 = r2.nextToken, d2 = Hs(r2.parseFunction(), "environment");
    if (d2.name !== o2) throw new io("Mismatch: \\begin{" + o2 + "} matched by \\end{" + d2.name + "}", p2);
    return h2;
  }
  return { type: "environment", mode: r2.mode, name: o2, nameGroup: i2 };
} });
var Gl = Wa.makeSpan;
function Ul(e6, t2) {
  var r2 = ps(e6.body, t2, true);
  return Gl([e6.mclass], r2, t2);
}
function Yl(e6, t2) {
  var r2, n2 = zs(e6.body, t2);
  return "minner" === e6.mclass ? _s.newDocumentFragment(n2) : ("mord" === e6.mclass ? e6.isCharacterBox ? (r2 = n2[0]).type = "mi" : r2 = new _s.MathNode("mi", n2) : (e6.isCharacterBox ? (r2 = n2[0]).type = "mo" : r2 = new _s.MathNode("mo", n2), "mbin" === e6.mclass ? (r2.attributes.lspace = "0.22em", r2.attributes.rspace = "0.22em") : "mpunct" === e6.mclass ? (r2.attributes.lspace = "0em", r2.attributes.rspace = "0.17em") : "mopen" !== e6.mclass && "mclose" !== e6.mclass || (r2.attributes.lspace = "0em", r2.attributes.rspace = "0em")), r2);
}
ns({ type: "mclass", names: ["\\mathord", "\\mathbin", "\\mathrel", "\\mathopen", "\\mathclose", "\\mathpunct", "\\mathinner"], props: { numArgs: 1, primitive: true }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  return { type: "mclass", mode: r2.mode, mclass: "m" + n2.substr(5), body: as(i2), isCharacterBox: uo.isCharacterBox(i2) };
}, htmlBuilder: Ul, mathmlBuilder: Yl });
var Xl = (e6) => {
  var t2 = "ordgroup" === e6.type && e6.body.length ? e6.body[0] : e6;
  return "atom" !== t2.type || "bin" !== t2.family && "rel" !== t2.family ? "mord" : "m" + t2.family;
};
ns({ type: "mclass", names: ["\\@binrel"], props: { numArgs: 2 }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "mclass", mode: r2.mode, mclass: Xl(t2[0]), body: as(t2[1]), isCharacterBox: uo.isCharacterBox(t2[1]) };
} }), ns({ type: "mclass", names: ["\\stackrel", "\\overset", "\\underset"], props: { numArgs: 2 }, handler(e6, t2) {
  var r2, { parser: n2, funcName: i2 } = e6, o2 = t2[1], a2 = t2[0];
  r2 = "\\stackrel" !== i2 ? Xl(o2) : "mrel";
  var s2 = { type: "op", mode: o2.mode, limits: true, alwaysHandleSupSub: true, parentIsSupSub: false, symbol: false, suppressBaseShift: "\\stackrel" !== i2, body: as(o2) }, l2 = { type: "supsub", mode: a2.mode, base: s2, sup: "\\underset" === i2 ? null : a2, sub: "\\underset" === i2 ? a2 : null };
  return { type: "mclass", mode: n2.mode, mclass: r2, body: [l2], isCharacterBox: uo.isCharacterBox(l2) };
}, htmlBuilder: Ul, mathmlBuilder: Yl });
var Wl = (e6, t2) => {
  var r2 = e6.font, n2 = t2.withFont(r2);
  return ys(e6.body, n2);
}, $l = (e6, t2) => {
  var r2 = e6.font, n2 = t2.withFont(r2);
  return Ms(e6.body, n2);
}, Zl = { "\\Bbb": "\\mathbb", "\\bold": "\\mathbf", "\\frak": "\\mathfrak", "\\bm": "\\boldsymbol" };
ns({ type: "font", names: ["\\mathrm", "\\mathit", "\\mathbf", "\\mathnormal", "\\mathbb", "\\mathcal", "\\mathfrak", "\\mathscr", "\\mathsf", "\\mathtt", "\\Bbb", "\\bold", "\\frak"], props: { numArgs: 1, allowedInArgument: true }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = os(t2[0]), o2 = n2;
  return o2 in Zl && (o2 = Zl[o2]), { type: "font", mode: r2.mode, font: o2.slice(1), body: i2 };
}, htmlBuilder: Wl, mathmlBuilder: $l }), ns({ type: "mclass", names: ["\\boldsymbol", "\\bm"], props: { numArgs: 1 }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = t2[0], i2 = uo.isCharacterBox(n2);
  return { type: "mclass", mode: r2.mode, mclass: Xl(n2), body: [{ type: "font", mode: r2.mode, font: "boldsymbol", body: n2 }], isCharacterBox: i2 };
} }), ns({ type: "font", names: ["\\rm", "\\sf", "\\tt", "\\bf", "\\it", "\\cal"], props: { numArgs: 0, allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2, breakOnTokenText: i2 } = e6, { mode: o2 } = r2, a2 = r2.parseExpression(true, i2);
  return { type: "font", mode: o2, font: "math" + n2.slice(1), body: { type: "ordgroup", mode: r2.mode, body: a2 } };
}, htmlBuilder: Wl, mathmlBuilder: $l });
var Jl = (e6, t2) => {
  var r2 = t2;
  return "display" === e6 ? r2 = r2.id >= xo.SCRIPT.id ? r2.text() : xo.DISPLAY : "text" === e6 && r2.size === xo.DISPLAY.size ? r2 = xo.TEXT : "script" === e6 ? r2 = xo.SCRIPT : "scriptscript" === e6 && (r2 = xo.SCRIPTSCRIPT), r2;
}, Kl = (e6, t2) => {
  var r2, n2 = Jl(e6.size, t2.style), i2 = n2.fracNum(), o2 = n2.fracDen();
  r2 = t2.havingStyle(i2);
  var a2 = ys(e6.numer, r2, t2);
  if (e6.continued) {
    var s2 = 8.5 / t2.fontMetrics().ptPerEm, l2 = 3.5 / t2.fontMetrics().ptPerEm;
    a2.height = a2.height < s2 ? s2 : a2.height, a2.depth = a2.depth < l2 ? l2 : a2.depth;
  }
  r2 = t2.havingStyle(o2);
  var u2, c2, h2, p2, d2, m2, g2, f2, b2, y2, v2 = ys(e6.denom, r2, t2);
  if (e6.hasBarLine ? (e6.barSize ? (c2 = Fa(e6.barSize, t2), u2 = Wa.makeLineSpan("frac-line", t2, c2)) : u2 = Wa.makeLineSpan("frac-line", t2), c2 = u2.height, h2 = u2.height) : (u2 = null, c2 = 0, h2 = t2.fontMetrics().defaultRuleThickness), n2.size === xo.DISPLAY.size || "display" === e6.size ? (p2 = t2.fontMetrics().num1, d2 = c2 > 0 ? 3 * h2 : 7 * h2, m2 = t2.fontMetrics().denom1) : (c2 > 0 ? (p2 = t2.fontMetrics().num2, d2 = h2) : (p2 = t2.fontMetrics().num3, d2 = 3 * h2), m2 = t2.fontMetrics().denom2), u2) {
    var x2 = t2.fontMetrics().axisHeight;
    p2 - a2.depth - (x2 + 0.5 * c2) < d2 && (p2 += d2 - (p2 - a2.depth - (x2 + 0.5 * c2))), x2 - 0.5 * c2 - (v2.height - m2) < d2 && (m2 += d2 - (x2 - 0.5 * c2 - (v2.height - m2)));
    var w2 = -(x2 - 0.5 * c2);
    g2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: v2, shift: m2 }, { type: "elem", elem: u2, shift: w2 }, { type: "elem", elem: a2, shift: -p2 }] }, t2);
  } else {
    var k2 = p2 - a2.depth - (v2.height - m2);
    k2 < d2 && (p2 += 0.5 * (d2 - k2), m2 += 0.5 * (d2 - k2)), g2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: v2, shift: m2 }, { type: "elem", elem: a2, shift: -p2 }] }, t2);
  }
  return r2 = t2.havingStyle(n2), g2.height *= r2.sizeMultiplier / t2.sizeMultiplier, g2.depth *= r2.sizeMultiplier / t2.sizeMultiplier, f2 = n2.size === xo.DISPLAY.size ? t2.fontMetrics().delim1 : n2.size === xo.SCRIPTSCRIPT.size ? t2.havingStyle(xo.SCRIPT).fontMetrics().delim2 : t2.fontMetrics().delim2, b2 = null == e6.leftDelim ? bs(t2, ["mopen"]) : Sl(e6.leftDelim, f2, true, t2.havingStyle(n2), e6.mode, ["mopen"]), y2 = e6.continued ? Wa.makeSpan([]) : null == e6.rightDelim ? bs(t2, ["mclose"]) : Sl(e6.rightDelim, f2, true, t2.havingStyle(n2), e6.mode, ["mclose"]), Wa.makeSpan(["mord"].concat(r2.sizingClasses(t2)), [b2, Wa.makeSpan(["mfrac"], [g2]), y2], t2);
}, Ql = (e6, t2) => {
  var r2 = new _s.MathNode("mfrac", [Ms(e6.numer, t2), Ms(e6.denom, t2)]);
  if (e6.hasBarLine) {
    if (e6.barSize) {
      var n2 = Fa(e6.barSize, t2);
      r2.setAttribute("linethickness", n2 + "em");
    }
  } else r2.setAttribute("linethickness", "0px");
  var i2 = Jl(e6.size, t2.style);
  if (i2.size !== t2.style.size) {
    r2 = new _s.MathNode("mstyle", [r2]);
    var o2 = i2.size === xo.DISPLAY.size ? "true" : "false";
    r2.setAttribute("displaystyle", o2), r2.setAttribute("scriptlevel", "0");
  }
  if (null != e6.leftDelim || null != e6.rightDelim) {
    var a2 = [];
    if (null != e6.leftDelim) {
      var s2 = new _s.MathNode("mo", [new _s.TextNode(e6.leftDelim.replace("\\", ""))]);
      s2.setAttribute("fence", "true"), a2.push(s2);
    }
    if (a2.push(r2), null != e6.rightDelim) {
      var l2 = new _s.MathNode("mo", [new _s.TextNode(e6.rightDelim.replace("\\", ""))]);
      l2.setAttribute("fence", "true"), a2.push(l2);
    }
    return qs(a2);
  }
  return r2;
};
ns({ type: "genfrac", names: ["\\dfrac", "\\frac", "\\tfrac", "\\dbinom", "\\binom", "\\tbinom", "\\\\atopfrac", "\\\\bracefrac", "\\\\brackfrac"], props: { numArgs: 2, allowedInArgument: true }, handler: (e6, t2) => {
  var r2, { parser: n2, funcName: i2 } = e6, o2 = t2[0], a2 = t2[1], s2 = null, l2 = null, u2 = "auto";
  switch (i2) {
    case "\\dfrac":
    case "\\frac":
    case "\\tfrac":
      r2 = true;
      break;
    case "\\\\atopfrac":
      r2 = false;
      break;
    case "\\dbinom":
    case "\\binom":
    case "\\tbinom":
      r2 = false, s2 = "(", l2 = ")";
      break;
    case "\\\\bracefrac":
      r2 = false, s2 = "\\{", l2 = "\\}";
      break;
    case "\\\\brackfrac":
      r2 = false, s2 = "[", l2 = "]";
      break;
    default:
      throw new Error("Unrecognized genfrac command");
  }
  switch (i2) {
    case "\\dfrac":
    case "\\dbinom":
      u2 = "display";
      break;
    case "\\tfrac":
    case "\\tbinom":
      u2 = "text";
  }
  return { type: "genfrac", mode: n2.mode, continued: false, numer: o2, denom: a2, hasBarLine: r2, leftDelim: s2, rightDelim: l2, size: u2, barSize: null };
}, htmlBuilder: Kl, mathmlBuilder: Ql }), ns({ type: "genfrac", names: ["\\cfrac"], props: { numArgs: 2 }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0], o2 = t2[1];
  return { type: "genfrac", mode: r2.mode, continued: true, numer: i2, denom: o2, hasBarLine: true, leftDelim: null, rightDelim: null, size: "display", barSize: null };
} }), ns({ type: "infix", names: ["\\over", "\\choose", "\\atop", "\\brace", "\\brack"], props: { numArgs: 0, infix: true }, handler(e6) {
  var t2, { parser: r2, funcName: n2, token: i2 } = e6;
  switch (n2) {
    case "\\over":
      t2 = "\\frac";
      break;
    case "\\choose":
      t2 = "\\binom";
      break;
    case "\\atop":
      t2 = "\\\\atopfrac";
      break;
    case "\\brace":
      t2 = "\\\\bracefrac";
      break;
    case "\\brack":
      t2 = "\\\\brackfrac";
      break;
    default:
      throw new Error("Unrecognized infix genfrac command");
  }
  return { type: "infix", mode: r2.mode, replaceWith: t2, token: i2 };
} });
var eu = ["display", "text", "script", "scriptscript"], tu = function(e6) {
  var t2 = null;
  return e6.length > 0 && (t2 = "." === (t2 = e6) ? null : t2), t2;
};
ns({ type: "genfrac", names: ["\\genfrac"], props: { numArgs: 6, allowedInArgument: true, argTypes: ["math", "math", "size", "text", "math", "math"] }, handler(e6, t2) {
  var r2, { parser: n2 } = e6, i2 = t2[4], o2 = t2[5], a2 = os(t2[0]), s2 = "atom" === a2.type && "open" === a2.family ? tu(a2.text) : null, l2 = os(t2[1]), u2 = "atom" === l2.type && "close" === l2.family ? tu(l2.text) : null, c2 = Hs(t2[2], "size"), h2 = null;
  r2 = !!c2.isBlank || (h2 = c2.value).number > 0;
  var p2 = "auto", d2 = t2[3];
  if ("ordgroup" === d2.type) {
    if (d2.body.length > 0) {
      var m2 = Hs(d2.body[0], "textord");
      p2 = eu[Number(m2.text)];
    }
  } else d2 = Hs(d2, "textord"), p2 = eu[Number(d2.text)];
  return { type: "genfrac", mode: n2.mode, numer: i2, denom: o2, continued: false, hasBarLine: r2, barSize: h2, leftDelim: s2, rightDelim: u2, size: p2 };
}, htmlBuilder: Kl, mathmlBuilder: Ql }), ns({ type: "infix", names: ["\\above"], props: { numArgs: 1, argTypes: ["size"], infix: true }, handler(e6, t2) {
  var { parser: r2, funcName: n2, token: i2 } = e6;
  return { type: "infix", mode: r2.mode, replaceWith: "\\\\abovefrac", size: Hs(t2[0], "size").value, token: i2 };
} }), ns({ type: "genfrac", names: ["\\\\abovefrac"], props: { numArgs: 3, argTypes: ["math", "size", "math"] }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0], o2 = (function(e7) {
    if (!e7) throw new Error("Expected non-null, but got " + String(e7));
    return e7;
  })(Hs(t2[1], "infix").size), a2 = t2[2], s2 = o2.number > 0;
  return { type: "genfrac", mode: r2.mode, numer: i2, denom: a2, continued: false, hasBarLine: s2, barSize: o2, leftDelim: null, rightDelim: null, size: "auto" };
}, htmlBuilder: Kl, mathmlBuilder: Ql });
var ru = (e6, t2) => {
  var r2, n2, i2 = t2.style;
  "supsub" === e6.type ? (r2 = e6.sup ? ys(e6.sup, t2.havingStyle(i2.sup()), t2) : ys(e6.sub, t2.havingStyle(i2.sub()), t2), n2 = Hs(e6.base, "horizBrace")) : n2 = Hs(e6, "horizBrace");
  var o2, a2 = ys(n2.base, t2.havingBaseStyle(xo.DISPLAY)), s2 = Rs(n2, t2);
  if (n2.isOver ? (o2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: a2 }, { type: "kern", size: 0.1 }, { type: "elem", elem: s2 }] }, t2)).children[0].children[0].children[1].classes.push("svg-align") : (o2 = Wa.makeVList({ positionType: "bottom", positionData: a2.depth + 0.1 + s2.height, children: [{ type: "elem", elem: s2 }, { type: "kern", size: 0.1 }, { type: "elem", elem: a2 }] }, t2)).children[0].children[0].children[0].classes.push("svg-align"), r2) {
    var l2 = Wa.makeSpan(["mord", n2.isOver ? "mover" : "munder"], [o2], t2);
    o2 = n2.isOver ? Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: l2 }, { type: "kern", size: 0.2 }, { type: "elem", elem: r2 }] }, t2) : Wa.makeVList({ positionType: "bottom", positionData: l2.depth + 0.2 + r2.height + r2.depth, children: [{ type: "elem", elem: r2 }, { type: "kern", size: 0.2 }, { type: "elem", elem: l2 }] }, t2);
  }
  return Wa.makeSpan(["mord", n2.isOver ? "mover" : "munder"], [o2], t2);
};
ns({ type: "horizBrace", names: ["\\overbrace", "\\underbrace"], props: { numArgs: 1 }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6;
  return { type: "horizBrace", mode: r2.mode, label: n2, isOver: /^\\over/.test(n2), base: t2[0] };
}, htmlBuilder: ru, mathmlBuilder: (e6, t2) => {
  var r2 = Fs(e6.label);
  return new _s.MathNode(e6.isOver ? "mover" : "munder", [Ms(e6.base, t2), r2]);
} }), ns({ type: "href", names: ["\\href"], props: { numArgs: 2, argTypes: ["url", "original"], allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = t2[1], i2 = Hs(t2[0], "url").url;
  return r2.settings.isTrusted({ command: "\\href", url: i2 }) ? { type: "href", mode: r2.mode, href: i2, body: as(n2) } : r2.formatUnsupportedCmd("\\href");
}, htmlBuilder: (e6, t2) => {
  var r2 = ps(e6.body, t2, false);
  return Wa.makeAnchor(e6.href, [], r2, t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = Ts(e6.body, t2);
  return r2 instanceof ks || (r2 = new ks("mrow", [r2])), r2.setAttribute("href", e6.href), r2;
} }), ns({ type: "href", names: ["\\url"], props: { numArgs: 1, argTypes: ["url"], allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = Hs(t2[0], "url").url;
  if (!r2.settings.isTrusted({ command: "\\url", url: n2 })) return r2.formatUnsupportedCmd("\\url");
  for (var i2 = [], o2 = 0; o2 < n2.length; o2++) {
    var a2 = n2[o2];
    "~" === a2 && (a2 = "\\textasciitilde"), i2.push({ type: "textord", mode: "text", text: a2 });
  }
  var s2 = { type: "text", mode: r2.mode, font: "\\texttt", body: i2 };
  return { type: "href", mode: r2.mode, href: n2, body: as(s2) };
} }), ns({ type: "hbox", names: ["\\hbox"], props: { numArgs: 1, argTypes: ["text"], allowedInText: true, primitive: true }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "hbox", mode: r2.mode, body: as(t2[0]) };
}, htmlBuilder(e6, t2) {
  var r2 = ps(e6.body, t2, false);
  return Wa.makeFragment(r2);
}, mathmlBuilder: (e6, t2) => new _s.MathNode("mrow", zs(e6.body, t2)) }), ns({ type: "html", names: ["\\htmlClass", "\\htmlId", "\\htmlStyle", "\\htmlData"], props: { numArgs: 2, argTypes: ["raw", "original"], allowedInText: true }, handler: (e6, t2) => {
  var r2, { parser: n2, funcName: i2, token: o2 } = e6, a2 = Hs(t2[0], "raw").string, s2 = t2[1];
  n2.settings.strict && n2.settings.reportNonstrict("htmlExtension", "HTML extension is disabled on strict mode");
  var l2 = {};
  switch (i2) {
    case "\\htmlClass":
      l2.class = a2, r2 = { command: "\\htmlClass", class: a2 };
      break;
    case "\\htmlId":
      l2.id = a2, r2 = { command: "\\htmlId", id: a2 };
      break;
    case "\\htmlStyle":
      l2.style = a2, r2 = { command: "\\htmlStyle", style: a2 };
      break;
    case "\\htmlData":
      for (var u2 = a2.split(","), c2 = 0; c2 < u2.length; c2++) {
        var h2 = u2[c2].split("=");
        if (2 !== h2.length) throw new io("Error parsing key-value for \\htmlData");
        l2["data-" + h2[0].trim()] = h2[1].trim();
      }
      r2 = { command: "\\htmlData", attributes: l2 };
      break;
    default:
      throw new Error("Unrecognized html command");
  }
  return n2.settings.isTrusted(r2) ? { type: "html", mode: n2.mode, attributes: l2, body: as(s2) } : n2.formatUnsupportedCmd(i2);
}, htmlBuilder: (e6, t2) => {
  var r2 = ps(e6.body, t2, false), n2 = ["enclosing"];
  e6.attributes.class && n2.push(...e6.attributes.class.trim().split(/\s+/));
  var i2 = Wa.makeSpan(n2, r2, t2);
  for (var o2 in e6.attributes) "class" !== o2 && e6.attributes.hasOwnProperty(o2) && i2.setAttribute(o2, e6.attributes[o2]);
  return i2;
}, mathmlBuilder: (e6, t2) => Ts(e6.body, t2) }), ns({ type: "htmlmathml", names: ["\\html@mathml"], props: { numArgs: 2, allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6;
  return { type: "htmlmathml", mode: r2.mode, html: as(t2[0]), mathml: as(t2[1]) };
}, htmlBuilder: (e6, t2) => {
  var r2 = ps(e6.html, t2, false);
  return Wa.makeFragment(r2);
}, mathmlBuilder: (e6, t2) => Ts(e6.mathml, t2) });
var nu = function(e6) {
  if (/^[-+]? *(\d+(\.\d*)?|\.\d+)$/.test(e6)) return { number: +e6, unit: "bp" };
  var t2 = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(e6);
  if (!t2) throw new io("Invalid size: '" + e6 + "' in \\includegraphics");
  var r2 = { number: +(t2[1] + t2[2]), unit: t2[3] };
  if (!Oa(r2)) throw new io("Invalid unit: '" + r2.unit + "' in \\includegraphics.");
  return r2;
};
ns({ type: "includegraphics", names: ["\\includegraphics"], props: { numArgs: 1, numOptionalArgs: 1, argTypes: ["raw", "url"], allowedInText: false }, handler: (e6, t2, r2) => {
  var { parser: n2 } = e6, i2 = { number: 0, unit: "em" }, o2 = { number: 0.9, unit: "em" }, a2 = { number: 0, unit: "em" }, s2 = "";
  if (r2[0]) for (var l2 = Hs(r2[0], "raw").string.split(","), u2 = 0; u2 < l2.length; u2++) {
    var c2 = l2[u2].split("=");
    if (2 === c2.length) {
      var h2 = c2[1].trim();
      switch (c2[0].trim()) {
        case "alt":
          s2 = h2;
          break;
        case "width":
          i2 = nu(h2);
          break;
        case "height":
          o2 = nu(h2);
          break;
        case "totalheight":
          a2 = nu(h2);
          break;
        default:
          throw new io("Invalid key: '" + c2[0] + "' in \\includegraphics.");
      }
    }
  }
  var p2 = Hs(t2[0], "url").url;
  return "" === s2 && (s2 = (s2 = (s2 = p2).replace(/^.*[\\/]/, "")).substring(0, s2.lastIndexOf("."))), n2.settings.isTrusted({ command: "\\includegraphics", url: p2 }) ? { type: "includegraphics", mode: n2.mode, alt: s2, width: i2, height: o2, totalheight: a2, src: p2 } : n2.formatUnsupportedCmd("\\includegraphics");
}, htmlBuilder: (e6, t2) => {
  var r2 = Fa(e6.height, t2), n2 = 0;
  e6.totalheight.number > 0 && (n2 = Fa(e6.totalheight, t2) - r2, n2 = Number(n2.toFixed(2)));
  var i2 = 0;
  e6.width.number > 0 && (i2 = Fa(e6.width, t2));
  var o2 = { height: r2 + n2 + "em" };
  i2 > 0 && (o2.width = i2 + "em"), n2 > 0 && (o2.verticalAlign = -n2 + "em");
  var a2 = new Lo(e6.src, e6.alt, o2);
  return a2.height = r2, a2.depth = n2, a2;
}, mathmlBuilder: (e6, t2) => {
  var r2 = new _s.MathNode("mglyph", []);
  r2.setAttribute("alt", e6.alt);
  var n2 = Fa(e6.height, t2), i2 = 0;
  if (e6.totalheight.number > 0 && (i2 = (i2 = Fa(e6.totalheight, t2) - n2).toFixed(2), r2.setAttribute("valign", "-" + i2 + "em")), r2.setAttribute("height", n2 + i2 + "em"), e6.width.number > 0) {
    var o2 = Fa(e6.width, t2);
    r2.setAttribute("width", o2 + "em");
  }
  return r2.setAttribute("src", e6.src), r2;
} }), ns({ type: "kern", names: ["\\kern", "\\mkern", "\\hskip", "\\mskip"], props: { numArgs: 1, argTypes: ["size"], primitive: true, allowedInText: true }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6, i2 = Hs(t2[0], "size");
  if (r2.settings.strict) {
    var o2 = "m" === n2[1], a2 = "mu" === i2.value.unit;
    o2 ? (a2 || r2.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + n2 + " supports only mu units, not " + i2.value.unit + " units"), "math" !== r2.mode && r2.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + n2 + " works only in math mode")) : a2 && r2.settings.reportNonstrict("mathVsTextUnits", "LaTeX's " + n2 + " doesn't support mu units");
  }
  return { type: "kern", mode: r2.mode, dimension: i2.value };
}, htmlBuilder: (e6, t2) => Wa.makeGlue(e6.dimension, t2), mathmlBuilder(e6, t2) {
  var r2 = Fa(e6.dimension, t2);
  return new _s.SpaceNode(r2);
} }), ns({ type: "lap", names: ["\\mathllap", "\\mathrlap", "\\mathclap"], props: { numArgs: 1, allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  return { type: "lap", mode: r2.mode, alignment: n2.slice(5), body: i2 };
}, htmlBuilder: (e6, t2) => {
  var r2;
  "clap" === e6.alignment ? (r2 = Wa.makeSpan([], [ys(e6.body, t2)]), r2 = Wa.makeSpan(["inner"], [r2], t2)) : r2 = Wa.makeSpan(["inner"], [ys(e6.body, t2)]);
  var n2 = Wa.makeSpan(["fix"], []), i2 = Wa.makeSpan([e6.alignment], [r2, n2], t2), o2 = Wa.makeSpan(["strut"]);
  return o2.style.height = i2.height + i2.depth + "em", o2.style.verticalAlign = -i2.depth + "em", i2.children.unshift(o2), i2 = Wa.makeSpan(["thinbox"], [i2], t2), Wa.makeSpan(["mord", "vbox"], [i2], t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = new _s.MathNode("mpadded", [Ms(e6.body, t2)]);
  if ("rlap" !== e6.alignment) {
    var n2 = "llap" === e6.alignment ? "-1" : "-0.5";
    r2.setAttribute("lspace", n2 + "width");
  }
  return r2.setAttribute("width", "0px"), r2;
} }), ns({ type: "styling", names: ["\\(", "$"], props: { numArgs: 0, allowedInText: true, allowedInMath: false }, handler(e6, t2) {
  var { funcName: r2, parser: n2 } = e6, i2 = n2.mode;
  n2.switchMode("math");
  var o2 = "\\(" === r2 ? "\\)" : "$", a2 = n2.parseExpression(false, o2);
  return n2.expect(o2), n2.switchMode(i2), { type: "styling", mode: n2.mode, style: "text", body: a2 };
} }), ns({ type: "text", names: ["\\)", "\\]"], props: { numArgs: 0, allowedInText: true, allowedInMath: false }, handler(e6, t2) {
  throw new io("Mismatched " + e6.funcName);
} });
var iu = (e6, t2) => {
  switch (t2.style.size) {
    case xo.DISPLAY.size:
      return e6.display;
    case xo.TEXT.size:
      return e6.text;
    case xo.SCRIPT.size:
      return e6.script;
    case xo.SCRIPTSCRIPT.size:
      return e6.scriptscript;
    default:
      return e6.text;
  }
};
ns({ type: "mathchoice", names: ["\\mathchoice"], props: { numArgs: 4, primitive: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6;
  return { type: "mathchoice", mode: r2.mode, display: as(t2[0]), text: as(t2[1]), script: as(t2[2]), scriptscript: as(t2[3]) };
}, htmlBuilder: (e6, t2) => {
  var r2 = iu(e6, t2), n2 = ps(r2, t2, false);
  return Wa.makeFragment(n2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = iu(e6, t2);
  return Ts(r2, t2);
} });
var ou = (e6, t2, r2, n2, i2, o2, a2) => {
  e6 = Wa.makeSpan([], [e6]);
  var s2, l2, u2, c2 = r2 && uo.isCharacterBox(r2);
  if (t2) {
    var h2 = ys(t2, n2.havingStyle(i2.sup()), n2);
    l2 = { elem: h2, kern: Math.max(n2.fontMetrics().bigOpSpacing1, n2.fontMetrics().bigOpSpacing3 - h2.depth) };
  }
  if (r2) {
    var p2 = ys(r2, n2.havingStyle(i2.sub()), n2);
    s2 = { elem: p2, kern: Math.max(n2.fontMetrics().bigOpSpacing2, n2.fontMetrics().bigOpSpacing4 - p2.height) };
  }
  if (l2 && s2) {
    var d2 = n2.fontMetrics().bigOpSpacing5 + s2.elem.height + s2.elem.depth + s2.kern + e6.depth + a2;
    u2 = Wa.makeVList({ positionType: "bottom", positionData: d2, children: [{ type: "kern", size: n2.fontMetrics().bigOpSpacing5 }, { type: "elem", elem: s2.elem, marginLeft: -o2 + "em" }, { type: "kern", size: s2.kern }, { type: "elem", elem: e6 }, { type: "kern", size: l2.kern }, { type: "elem", elem: l2.elem, marginLeft: o2 + "em" }, { type: "kern", size: n2.fontMetrics().bigOpSpacing5 }] }, n2);
  } else if (s2) {
    var m2 = e6.height - a2;
    u2 = Wa.makeVList({ positionType: "top", positionData: m2, children: [{ type: "kern", size: n2.fontMetrics().bigOpSpacing5 }, { type: "elem", elem: s2.elem, marginLeft: -o2 + "em" }, { type: "kern", size: s2.kern }, { type: "elem", elem: e6 }] }, n2);
  } else {
    if (!l2) return e6;
    var g2 = e6.depth + a2;
    u2 = Wa.makeVList({ positionType: "bottom", positionData: g2, children: [{ type: "elem", elem: e6 }, { type: "kern", size: l2.kern }, { type: "elem", elem: l2.elem, marginLeft: o2 + "em" }, { type: "kern", size: n2.fontMetrics().bigOpSpacing5 }] }, n2);
  }
  var f2 = [u2];
  if (s2 && 0 !== o2 && !c2) {
    var b2 = Wa.makeSpan(["mspace"], [], n2);
    b2.style.marginRight = o2 + "em", f2.unshift(b2);
  }
  return Wa.makeSpan(["mop", "op-limits"], f2, n2);
}, au = ["\\smallint"], su = (e6, t2) => {
  var r2, n2, i2, o2 = false;
  "supsub" === e6.type ? (r2 = e6.sup, n2 = e6.sub, i2 = Hs(e6.base, "op"), o2 = true) : i2 = Hs(e6, "op");
  var a2, s2 = t2.style, l2 = false;
  if (s2.size === xo.DISPLAY.size && i2.symbol && !uo.contains(au, i2.name) && (l2 = true), i2.symbol) {
    var u2 = l2 ? "Size2-Regular" : "Size1-Regular", c2 = "";
    if ("\\oiint" !== i2.name && "\\oiiint" !== i2.name || (c2 = i2.name.substr(1), i2.name = "oiint" === c2 ? "\\iint" : "\\iiint"), a2 = Wa.makeSymbol(i2.name, u2, "math", t2, ["mop", "op-symbol", l2 ? "large-op" : "small-op"]), c2.length > 0) {
      var h2 = a2.italic, p2 = Wa.staticSvg(c2 + "Size" + (l2 ? "2" : "1"), t2);
      a2 = Wa.makeVList({ positionType: "individualShift", children: [{ type: "elem", elem: a2, shift: 0 }, { type: "elem", elem: p2, shift: l2 ? 0.08 : 0 }] }, t2), i2.name = "\\" + c2, a2.classes.unshift("mop"), a2.italic = h2;
    }
  } else if (i2.body) {
    var d2 = ps(i2.body, t2, true);
    1 === d2.length && d2[0] instanceof No ? (a2 = d2[0]).classes[0] = "mop" : a2 = Wa.makeSpan(["mop"], d2, t2);
  } else {
    for (var m2 = [], g2 = 1; g2 < i2.name.length; g2++) m2.push(Wa.mathsym(i2.name[g2], i2.mode, t2));
    a2 = Wa.makeSpan(["mop"], m2, t2);
  }
  var f2 = 0, b2 = 0;
  return (a2 instanceof No || "\\oiint" === i2.name || "\\oiiint" === i2.name) && !i2.suppressBaseShift && (f2 = (a2.height - a2.depth) / 2 - t2.fontMetrics().axisHeight, b2 = a2.italic), o2 ? ou(a2, r2, n2, t2, s2, b2, f2) : (f2 && (a2.style.position = "relative", a2.style.top = f2 + "em"), a2);
}, lu = (e6, t2) => {
  var r2;
  if (e6.symbol) r2 = new ks("mo", [Ss(e6.name, e6.mode)]), uo.contains(au, e6.name) && r2.setAttribute("largeop", "false");
  else if (e6.body) r2 = new ks("mo", zs(e6.body, t2));
  else {
    r2 = new ks("mi", [new As(e6.name.slice(1))]);
    var n2 = new ks("mo", [Ss("⁡", "text")]);
    r2 = e6.parentIsSupSub ? new ks("mrow", [r2, n2]) : ws([r2, n2]);
  }
  return r2;
}, uu = { "∏": "\\prod", "∐": "\\coprod", "∑": "\\sum", "⋀": "\\bigwedge", "⋁": "\\bigvee", "⋂": "\\bigcap", "⋃": "\\bigcup", "⨀": "\\bigodot", "⨁": "\\bigoplus", "⨂": "\\bigotimes", "⨄": "\\biguplus", "⨆": "\\bigsqcup" };
ns({ type: "op", names: ["\\coprod", "\\bigvee", "\\bigwedge", "\\biguplus", "\\bigcap", "\\bigcup", "\\intop", "\\prod", "\\sum", "\\bigotimes", "\\bigoplus", "\\bigodot", "\\bigsqcup", "\\smallint", "∏", "∐", "∑", "⋀", "⋁", "⋂", "⋃", "⨀", "⨁", "⨂", "⨄", "⨆"], props: { numArgs: 0 }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = n2;
  return 1 === i2.length && (i2 = uu[i2]), { type: "op", mode: r2.mode, limits: true, parentIsSupSub: false, symbol: true, name: i2 };
}, htmlBuilder: su, mathmlBuilder: lu }), ns({ type: "op", names: ["\\mathop"], props: { numArgs: 1, primitive: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = t2[0];
  return { type: "op", mode: r2.mode, limits: false, parentIsSupSub: false, symbol: false, body: as(n2) };
}, htmlBuilder: su, mathmlBuilder: lu });
var cu = { "∫": "\\int", "∬": "\\iint", "∭": "\\iiint", "∮": "\\oint", "∯": "\\oiint", "∰": "\\oiiint" };
ns({ type: "op", names: ["\\arcsin", "\\arccos", "\\arctan", "\\arctg", "\\arcctg", "\\arg", "\\ch", "\\cos", "\\cosec", "\\cosh", "\\cot", "\\cotg", "\\coth", "\\csc", "\\ctg", "\\cth", "\\deg", "\\dim", "\\exp", "\\hom", "\\ker", "\\lg", "\\ln", "\\log", "\\sec", "\\sin", "\\sinh", "\\sh", "\\tan", "\\tanh", "\\tg", "\\th"], props: { numArgs: 0 }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6;
  return { type: "op", mode: t2.mode, limits: false, parentIsSupSub: false, symbol: false, name: r2 };
}, htmlBuilder: su, mathmlBuilder: lu }), ns({ type: "op", names: ["\\det", "\\gcd", "\\inf", "\\lim", "\\max", "\\min", "\\Pr", "\\sup"], props: { numArgs: 0 }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6;
  return { type: "op", mode: t2.mode, limits: true, parentIsSupSub: false, symbol: false, name: r2 };
}, htmlBuilder: su, mathmlBuilder: lu }), ns({ type: "op", names: ["\\int", "\\iint", "\\iiint", "\\oint", "\\oiint", "\\oiiint", "∫", "∬", "∭", "∮", "∯", "∰"], props: { numArgs: 0 }, handler(e6) {
  var { parser: t2, funcName: r2 } = e6, n2 = r2;
  return 1 === n2.length && (n2 = cu[n2]), { type: "op", mode: t2.mode, limits: false, parentIsSupSub: false, symbol: true, name: n2 };
}, htmlBuilder: su, mathmlBuilder: lu });
var hu = {};
function pu(e6, t2) {
  hu[e6] = t2;
}
pu("\\noexpand", (function(e6) {
  var t2 = e6.popToken();
  return e6.isExpandable(t2.text) && (t2.noexpand = true, t2.treatAsRelax = true), { tokens: [t2], numArgs: 0 };
})), pu("\\expandafter", (function(e6) {
  var t2 = e6.popToken();
  return e6.expandOnce(true), { tokens: [t2], numArgs: 0 };
})), pu("\\@firstoftwo", (function(e6) {
  return { tokens: e6.consumeArgs(2)[0], numArgs: 0 };
})), pu("\\@secondoftwo", (function(e6) {
  return { tokens: e6.consumeArgs(2)[1], numArgs: 0 };
})), pu("\\@ifnextchar", (function(e6) {
  var t2 = e6.consumeArgs(3);
  e6.consumeSpaces();
  var r2 = e6.future();
  return 1 === t2[0].length && t2[0][0].text === r2.text ? { tokens: t2[1], numArgs: 0 } : { tokens: t2[2], numArgs: 0 };
})), pu("\\@ifstar", "\\@ifnextchar *{\\@firstoftwo{#1}}"), pu("\\TextOrMath", (function(e6) {
  var t2 = e6.consumeArgs(2);
  return "text" === e6.mode ? { tokens: t2[0], numArgs: 0 } : { tokens: t2[1], numArgs: 0 };
}));
var du = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, a: 10, A: 10, b: 11, B: 11, c: 12, C: 12, d: 13, D: 13, e: 14, E: 14, f: 15, F: 15 };
pu("\\char", (function(e6) {
  var t2, r2 = e6.popToken(), n2 = "";
  if ("'" === r2.text) t2 = 8, r2 = e6.popToken();
  else if ('"' === r2.text) t2 = 16, r2 = e6.popToken();
  else if ("`" === r2.text) if ("\\" === (r2 = e6.popToken()).text[0]) n2 = r2.text.charCodeAt(1);
  else {
    if ("EOF" === r2.text) throw new io("\\char` missing argument");
    n2 = r2.text.charCodeAt(0);
  }
  else t2 = 10;
  if (t2) {
    if (null == (n2 = du[r2.text]) || n2 >= t2) throw new io("Invalid base-" + t2 + " digit " + r2.text);
    for (var i2; null != (i2 = du[e6.future().text]) && i2 < t2; ) n2 *= t2, n2 += i2, e6.popToken();
  }
  return "\\@char{" + n2 + "}";
}));
var mu = (e6, t2, r2) => {
  var n2 = e6.consumeArg().tokens;
  if (1 !== n2.length) throw new io("\\newcommand's first argument must be a macro name");
  var i2 = n2[0].text, o2 = e6.isDefined(i2);
  if (o2 && !t2) throw new io("\\newcommand{" + i2 + "} attempting to redefine " + i2 + "; use \\renewcommand");
  if (!o2 && !r2) throw new io("\\renewcommand{" + i2 + "} when command " + i2 + " does not yet exist; use \\newcommand");
  var a2 = 0;
  if (1 === (n2 = e6.consumeArg().tokens).length && "[" === n2[0].text) {
    for (var s2 = "", l2 = e6.expandNextToken(); "]" !== l2.text && "EOF" !== l2.text; ) s2 += l2.text, l2 = e6.expandNextToken();
    if (!s2.match(/^\s*[0-9]+\s*$/)) throw new io("Invalid number of arguments: " + s2);
    a2 = parseInt(s2), n2 = e6.consumeArg().tokens;
  }
  return e6.macros.set(i2, { tokens: n2, numArgs: a2 }), "";
};
pu("\\newcommand", ((e6) => mu(e6, false, true))), pu("\\renewcommand", ((e6) => mu(e6, true, false))), pu("\\providecommand", ((e6) => mu(e6, true, true))), pu("\\message", ((e6) => {
  var t2 = e6.consumeArgs(1)[0];
  return console.log(t2.reverse().map(((e7) => e7.text)).join("")), "";
})), pu("\\errmessage", ((e6) => {
  var t2 = e6.consumeArgs(1)[0];
  return console.error(t2.reverse().map(((e7) => e7.text)).join("")), "";
})), pu("\\show", ((e6) => {
  var t2 = e6.popToken(), r2 = t2.text;
  return console.log(t2, e6.macros.get(r2), Eu[r2], Xo.math[r2], Xo.text[r2]), "";
})), pu("\\bgroup", "{"), pu("\\egroup", "}"), pu("~", "\\nobreakspace"), pu("\\lq", "`"), pu("\\rq", "'"), pu("\\aa", "\\r a"), pu("\\AA", "\\r A"), pu("\\textcopyright", "\\html@mathml{\\textcircled{c}}{\\char`©}"), pu("\\copyright", "\\TextOrMath{\\textcopyright}{\\text{\\textcopyright}}"), pu("\\textregistered", "\\html@mathml{\\textcircled{\\scriptsize R}}{\\char`®}"), pu("ℬ", "\\mathscr{B}"), pu("ℰ", "\\mathscr{E}"), pu("ℱ", "\\mathscr{F}"), pu("ℋ", "\\mathscr{H}"), pu("ℐ", "\\mathscr{I}"), pu("ℒ", "\\mathscr{L}"), pu("ℳ", "\\mathscr{M}"), pu("ℛ", "\\mathscr{R}"), pu("ℭ", "\\mathfrak{C}"), pu("ℌ", "\\mathfrak{H}"), pu("ℨ", "\\mathfrak{Z}"), pu("\\Bbbk", "\\Bbb{k}"), pu("·", "\\cdotp"), pu("\\llap", "\\mathllap{\\textrm{#1}}"), pu("\\rlap", "\\mathrlap{\\textrm{#1}}"), pu("\\clap", "\\mathclap{\\textrm{#1}}"), pu("\\mathstrut", "\\vphantom{(}"), pu("\\underbar", "\\underline{\\text{#1}}"), pu("\\not", '\\html@mathml{\\mathrel{\\mathrlap\\@not}}{\\char"338}'), pu("\\neq", "\\html@mathml{\\mathrel{\\not=}}{\\mathrel{\\char`≠}}"), pu("\\ne", "\\neq"), pu("≠", "\\neq"), pu("\\notin", "\\html@mathml{\\mathrel{{\\in}\\mathllap{/\\mskip1mu}}}{\\mathrel{\\char`∉}}"), pu("∉", "\\notin"), pu("≘", "\\html@mathml{\\mathrel{=\\kern{-1em}\\raisebox{0.4em}{$\\scriptsize\\frown$}}}{\\mathrel{\\char`≘}}"), pu("≙", "\\html@mathml{\\stackrel{\\tiny\\wedge}{=}}{\\mathrel{\\char`≘}}"), pu("≚", "\\html@mathml{\\stackrel{\\tiny\\vee}{=}}{\\mathrel{\\char`≚}}"), pu("≛", "\\html@mathml{\\stackrel{\\scriptsize\\star}{=}}{\\mathrel{\\char`≛}}"), pu("≝", "\\html@mathml{\\stackrel{\\tiny\\mathrm{def}}{=}}{\\mathrel{\\char`≝}}"), pu("≞", "\\html@mathml{\\stackrel{\\tiny\\mathrm{m}}{=}}{\\mathrel{\\char`≞}}"), pu("≟", "\\html@mathml{\\stackrel{\\tiny?}{=}}{\\mathrel{\\char`≟}}"), pu("⟂", "\\perp"), pu("‼", "\\mathclose{!\\mkern-0.8mu!}"), pu("∌", "\\notni"), pu("⌜", "\\ulcorner"), pu("⌝", "\\urcorner"), pu("⌞", "\\llcorner"), pu("⌟", "\\lrcorner"), pu("©", "\\copyright"), pu("®", "\\textregistered"), pu("️", "\\textregistered"), pu("\\ulcorner", '\\html@mathml{\\@ulcorner}{\\mathop{\\char"231c}}'), pu("\\urcorner", '\\html@mathml{\\@urcorner}{\\mathop{\\char"231d}}'), pu("\\llcorner", '\\html@mathml{\\@llcorner}{\\mathop{\\char"231e}}'), pu("\\lrcorner", '\\html@mathml{\\@lrcorner}{\\mathop{\\char"231f}}'), pu("\\vdots", "\\mathord{\\varvdots\\rule{0pt}{15pt}}"), pu("⋮", "\\vdots"), pu("\\varGamma", "\\mathit{\\Gamma}"), pu("\\varDelta", "\\mathit{\\Delta}"), pu("\\varTheta", "\\mathit{\\Theta}"), pu("\\varLambda", "\\mathit{\\Lambda}"), pu("\\varXi", "\\mathit{\\Xi}"), pu("\\varPi", "\\mathit{\\Pi}"), pu("\\varSigma", "\\mathit{\\Sigma}"), pu("\\varUpsilon", "\\mathit{\\Upsilon}"), pu("\\varPhi", "\\mathit{\\Phi}"), pu("\\varPsi", "\\mathit{\\Psi}"), pu("\\varOmega", "\\mathit{\\Omega}"), pu("\\substack", "\\begin{subarray}{c}#1\\end{subarray}"), pu("\\colon", "\\nobreak\\mskip2mu\\mathpunct{}\\mathchoice{\\mkern-3mu}{\\mkern-3mu}{}{}{:}\\mskip6mu"), pu("\\boxed", "\\fbox{$\\displaystyle{#1}$}"), pu("\\iff", "\\DOTSB\\;\\Longleftrightarrow\\;"), pu("\\implies", "\\DOTSB\\;\\Longrightarrow\\;"), pu("\\impliedby", "\\DOTSB\\;\\Longleftarrow\\;");
var gu = { ",": "\\dotsc", "\\not": "\\dotsb", "+": "\\dotsb", "=": "\\dotsb", "<": "\\dotsb", ">": "\\dotsb", "-": "\\dotsb", "*": "\\dotsb", ":": "\\dotsb", "\\DOTSB": "\\dotsb", "\\coprod": "\\dotsb", "\\bigvee": "\\dotsb", "\\bigwedge": "\\dotsb", "\\biguplus": "\\dotsb", "\\bigcap": "\\dotsb", "\\bigcup": "\\dotsb", "\\prod": "\\dotsb", "\\sum": "\\dotsb", "\\bigotimes": "\\dotsb", "\\bigoplus": "\\dotsb", "\\bigodot": "\\dotsb", "\\bigsqcup": "\\dotsb", "\\And": "\\dotsb", "\\longrightarrow": "\\dotsb", "\\Longrightarrow": "\\dotsb", "\\longleftarrow": "\\dotsb", "\\Longleftarrow": "\\dotsb", "\\longleftrightarrow": "\\dotsb", "\\Longleftrightarrow": "\\dotsb", "\\mapsto": "\\dotsb", "\\longmapsto": "\\dotsb", "\\hookrightarrow": "\\dotsb", "\\doteq": "\\dotsb", "\\mathbin": "\\dotsb", "\\mathrel": "\\dotsb", "\\relbar": "\\dotsb", "\\Relbar": "\\dotsb", "\\xrightarrow": "\\dotsb", "\\xleftarrow": "\\dotsb", "\\DOTSI": "\\dotsi", "\\int": "\\dotsi", "\\oint": "\\dotsi", "\\iint": "\\dotsi", "\\iiint": "\\dotsi", "\\iiiint": "\\dotsi", "\\idotsint": "\\dotsi", "\\DOTSX": "\\dotsx" };
pu("\\dots", (function(e6) {
  var t2 = "\\dotso", r2 = e6.expandAfterFuture().text;
  return r2 in gu ? t2 = gu[r2] : ("\\not" === r2.substr(0, 4) || r2 in Xo.math && uo.contains(["bin", "rel"], Xo.math[r2].group)) && (t2 = "\\dotsb"), t2;
}));
var fu = { ")": true, "]": true, "\\rbrack": true, "\\}": true, "\\rbrace": true, "\\rangle": true, "\\rceil": true, "\\rfloor": true, "\\rgroup": true, "\\rmoustache": true, "\\right": true, "\\bigr": true, "\\biggr": true, "\\Bigr": true, "\\Biggr": true, $: true, ";": true, ".": true, ",": true };
pu("\\dotso", (function(e6) {
  return e6.future().text in fu ? "\\ldots\\," : "\\ldots";
})), pu("\\dotsc", (function(e6) {
  var t2 = e6.future().text;
  return t2 in fu && "," !== t2 ? "\\ldots\\," : "\\ldots";
})), pu("\\cdots", (function(e6) {
  return e6.future().text in fu ? "\\@cdots\\," : "\\@cdots";
})), pu("\\dotsb", "\\cdots"), pu("\\dotsm", "\\cdots"), pu("\\dotsi", "\\!\\cdots"), pu("\\dotsx", "\\ldots\\,"), pu("\\DOTSI", "\\relax"), pu("\\DOTSB", "\\relax"), pu("\\DOTSX", "\\relax"), pu("\\tmspace", "\\TextOrMath{\\kern#1#3}{\\mskip#1#2}\\relax"), pu("\\,", "\\tmspace+{3mu}{.1667em}"), pu("\\thinspace", "\\,"), pu("\\>", "\\mskip{4mu}"), pu("\\:", "\\tmspace+{4mu}{.2222em}"), pu("\\medspace", "\\:"), pu("\\;", "\\tmspace+{5mu}{.2777em}"), pu("\\thickspace", "\\;"), pu("\\!", "\\tmspace-{3mu}{.1667em}"), pu("\\negthinspace", "\\!"), pu("\\negmedspace", "\\tmspace-{4mu}{.2222em}"), pu("\\negthickspace", "\\tmspace-{5mu}{.277em}"), pu("\\enspace", "\\kern.5em "), pu("\\enskip", "\\hskip.5em\\relax"), pu("\\quad", "\\hskip1em\\relax"), pu("\\qquad", "\\hskip2em\\relax"), pu("\\tag", "\\@ifstar\\tag@literal\\tag@paren"), pu("\\tag@paren", "\\tag@literal{({#1})}"), pu("\\tag@literal", ((e6) => {
  if (e6.macros.get("\\df@tag")) throw new io("Multiple \\tag");
  return "\\gdef\\df@tag{\\text{#1}}";
})), pu("\\bmod", "\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}\\mathbin{\\rm mod}\\mathchoice{\\mskip1mu}{\\mskip1mu}{\\mskip5mu}{\\mskip5mu}"), pu("\\pod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern8mu}{\\mkern8mu}{\\mkern8mu}(#1)"), pu("\\pmod", "\\pod{{\\rm mod}\\mkern6mu#1}"), pu("\\mod", "\\allowbreak\\mathchoice{\\mkern18mu}{\\mkern12mu}{\\mkern12mu}{\\mkern12mu}{\\rm mod}\\,\\,#1"), pu("\\pmb", "\\html@mathml{\\@binrel{#1}{\\mathrlap{#1}\\kern0.5px#1}}{\\mathbf{#1}}"), pu("\\newline", "\\\\\\relax"), pu("\\TeX", "\\textrm{\\html@mathml{T\\kern-.1667em\\raisebox{-.5ex}{E}\\kern-.125emX}{TeX}}");
var bu = Vo["Main-Regular"]["T".charCodeAt(0)][1] - 0.7 * Vo["Main-Regular"]["A".charCodeAt(0)][1] + "em";
pu("\\LaTeX", "\\textrm{\\html@mathml{L\\kern-.36em\\raisebox{" + bu + "}{\\scriptstyle A}\\kern-.15em\\TeX}{LaTeX}}"), pu("\\KaTeX", "\\textrm{\\html@mathml{K\\kern-.17em\\raisebox{" + bu + "}{\\scriptstyle A}\\kern-.15em\\TeX}{KaTeX}}"), pu("\\hspace", "\\@ifstar\\@hspacer\\@hspace"), pu("\\@hspace", "\\hskip #1\\relax"), pu("\\@hspacer", "\\rule{0pt}{0pt}\\hskip #1\\relax"), pu("\\ordinarycolon", ":"), pu("\\vcentcolon", "\\mathrel{\\mathop\\ordinarycolon}"), pu("\\dblcolon", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-.9mu}\\vcentcolon}}{\\mathop{\\char"2237}}'), pu("\\coloneqq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2254}}'), pu("\\Coloneqq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}=}}{\\mathop{\\char"2237\\char"3d}}'), pu("\\coloneq", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"3a\\char"2212}}'), pu("\\Coloneq", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\mathrel{-}}}{\\mathop{\\char"2237\\char"2212}}'), pu("\\eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2255}}'), pu("\\Eqqcolon", '\\html@mathml{\\mathrel{=\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"3d\\char"2237}}'), pu("\\eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\vcentcolon}}{\\mathop{\\char"2239}}'), pu("\\Eqcolon", '\\html@mathml{\\mathrel{\\mathrel{-}\\mathrel{\\mkern-1.2mu}\\dblcolon}}{\\mathop{\\char"2212\\char"2237}}'), pu("\\colonapprox", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"3a\\char"2248}}'), pu("\\Colonapprox", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\approx}}{\\mathop{\\char"2237\\char"2248}}'), pu("\\colonsim", '\\html@mathml{\\mathrel{\\vcentcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"3a\\char"223c}}'), pu("\\Colonsim", '\\html@mathml{\\mathrel{\\dblcolon\\mathrel{\\mkern-1.2mu}\\sim}}{\\mathop{\\char"2237\\char"223c}}'), pu("∷", "\\dblcolon"), pu("∹", "\\eqcolon"), pu("≔", "\\coloneqq"), pu("≕", "\\eqqcolon"), pu("⩴", "\\Coloneqq"), pu("\\ratio", "\\vcentcolon"), pu("\\coloncolon", "\\dblcolon"), pu("\\colonequals", "\\coloneqq"), pu("\\coloncolonequals", "\\Coloneqq"), pu("\\equalscolon", "\\eqqcolon"), pu("\\equalscoloncolon", "\\Eqqcolon"), pu("\\colonminus", "\\coloneq"), pu("\\coloncolonminus", "\\Coloneq"), pu("\\minuscolon", "\\eqcolon"), pu("\\minuscoloncolon", "\\Eqcolon"), pu("\\coloncolonapprox", "\\Colonapprox"), pu("\\coloncolonsim", "\\Colonsim"), pu("\\simcolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\vcentcolon}"), pu("\\simcoloncolon", "\\mathrel{\\sim\\mathrel{\\mkern-1.2mu}\\dblcolon}"), pu("\\approxcolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\vcentcolon}"), pu("\\approxcoloncolon", "\\mathrel{\\approx\\mathrel{\\mkern-1.2mu}\\dblcolon}"), pu("\\notni", "\\html@mathml{\\not\\ni}{\\mathrel{\\char`∌}}"), pu("\\limsup", "\\DOTSB\\operatorname*{lim\\,sup}"), pu("\\liminf", "\\DOTSB\\operatorname*{lim\\,inf}"), pu("\\injlim", "\\DOTSB\\operatorname*{inj\\,lim}"), pu("\\projlim", "\\DOTSB\\operatorname*{proj\\,lim}"), pu("\\varlimsup", "\\DOTSB\\operatorname*{\\overline{lim}}"), pu("\\varliminf", "\\DOTSB\\operatorname*{\\underline{lim}}"), pu("\\varinjlim", "\\DOTSB\\operatorname*{\\underrightarrow{lim}}"), pu("\\varprojlim", "\\DOTSB\\operatorname*{\\underleftarrow{lim}}"), pu("\\gvertneqq", "\\html@mathml{\\@gvertneqq}{≩}"), pu("\\lvertneqq", "\\html@mathml{\\@lvertneqq}{≨}"), pu("\\ngeqq", "\\html@mathml{\\@ngeqq}{≱}"), pu("\\ngeqslant", "\\html@mathml{\\@ngeqslant}{≱}"), pu("\\nleqq", "\\html@mathml{\\@nleqq}{≰}"), pu("\\nleqslant", "\\html@mathml{\\@nleqslant}{≰}"), pu("\\nshortmid", "\\html@mathml{\\@nshortmid}{∤}"), pu("\\nshortparallel", "\\html@mathml{\\@nshortparallel}{∦}"), pu("\\nsubseteqq", "\\html@mathml{\\@nsubseteqq}{⊈}"), pu("\\nsupseteqq", "\\html@mathml{\\@nsupseteqq}{⊉}"), pu("\\varsubsetneq", "\\html@mathml{\\@varsubsetneq}{⊊}"), pu("\\varsubsetneqq", "\\html@mathml{\\@varsubsetneqq}{⫋}"), pu("\\varsupsetneq", "\\html@mathml{\\@varsupsetneq}{⊋}"), pu("\\varsupsetneqq", "\\html@mathml{\\@varsupsetneqq}{⫌}"), pu("\\imath", "\\html@mathml{\\@imath}{ı}"), pu("\\jmath", "\\html@mathml{\\@jmath}{ȷ}"), pu("\\llbracket", "\\html@mathml{\\mathopen{[\\mkern-3.2mu[}}{\\mathopen{\\char`⟦}}"), pu("\\rrbracket", "\\html@mathml{\\mathclose{]\\mkern-3.2mu]}}{\\mathclose{\\char`⟧}}"), pu("⟦", "\\llbracket"), pu("⟧", "\\rrbracket"), pu("\\lBrace", "\\html@mathml{\\mathopen{\\{\\mkern-3.2mu[}}{\\mathopen{\\char`⦃}}"), pu("\\rBrace", "\\html@mathml{\\mathclose{]\\mkern-3.2mu\\}}}{\\mathclose{\\char`⦄}}"), pu("⦃", "\\lBrace"), pu("⦄", "\\rBrace"), pu("\\minuso", "\\mathbin{\\html@mathml{{\\mathrlap{\\mathchoice{\\kern{0.145em}}{\\kern{0.145em}}{\\kern{0.1015em}}{\\kern{0.0725em}}\\circ}{-}}}{\\char`⦵}}"), pu("⦵", "\\minuso"), pu("\\darr", "\\downarrow"), pu("\\dArr", "\\Downarrow"), pu("\\Darr", "\\Downarrow"), pu("\\lang", "\\langle"), pu("\\rang", "\\rangle"), pu("\\uarr", "\\uparrow"), pu("\\uArr", "\\Uparrow"), pu("\\Uarr", "\\Uparrow"), pu("\\N", "\\mathbb{N}"), pu("\\R", "\\mathbb{R}"), pu("\\Z", "\\mathbb{Z}"), pu("\\alef", "\\aleph"), pu("\\alefsym", "\\aleph"), pu("\\Alpha", "\\mathrm{A}"), pu("\\Beta", "\\mathrm{B}"), pu("\\bull", "\\bullet"), pu("\\Chi", "\\mathrm{X}"), pu("\\clubs", "\\clubsuit"), pu("\\cnums", "\\mathbb{C}"), pu("\\Complex", "\\mathbb{C}"), pu("\\Dagger", "\\ddagger"), pu("\\diamonds", "\\diamondsuit"), pu("\\empty", "\\emptyset"), pu("\\Epsilon", "\\mathrm{E}"), pu("\\Eta", "\\mathrm{H}"), pu("\\exist", "\\exists"), pu("\\harr", "\\leftrightarrow"), pu("\\hArr", "\\Leftrightarrow"), pu("\\Harr", "\\Leftrightarrow"), pu("\\hearts", "\\heartsuit"), pu("\\image", "\\Im"), pu("\\infin", "\\infty"), pu("\\Iota", "\\mathrm{I}"), pu("\\isin", "\\in"), pu("\\Kappa", "\\mathrm{K}"), pu("\\larr", "\\leftarrow"), pu("\\lArr", "\\Leftarrow"), pu("\\Larr", "\\Leftarrow"), pu("\\lrarr", "\\leftrightarrow"), pu("\\lrArr", "\\Leftrightarrow"), pu("\\Lrarr", "\\Leftrightarrow"), pu("\\Mu", "\\mathrm{M}"), pu("\\natnums", "\\mathbb{N}"), pu("\\Nu", "\\mathrm{N}"), pu("\\Omicron", "\\mathrm{O}"), pu("\\plusmn", "\\pm"), pu("\\rarr", "\\rightarrow"), pu("\\rArr", "\\Rightarrow"), pu("\\Rarr", "\\Rightarrow"), pu("\\real", "\\Re"), pu("\\reals", "\\mathbb{R}"), pu("\\Reals", "\\mathbb{R}"), pu("\\Rho", "\\mathrm{P}"), pu("\\sdot", "\\cdot"), pu("\\sect", "\\S"), pu("\\spades", "\\spadesuit"), pu("\\sub", "\\subset"), pu("\\sube", "\\subseteq"), pu("\\supe", "\\supseteq"), pu("\\Tau", "\\mathrm{T}"), pu("\\thetasym", "\\vartheta"), pu("\\weierp", "\\wp"), pu("\\Zeta", "\\mathrm{Z}"), pu("\\argmin", "\\DOTSB\\operatorname*{arg\\,min}"), pu("\\argmax", "\\DOTSB\\operatorname*{arg\\,max}"), pu("\\plim", "\\DOTSB\\mathop{\\operatorname{plim}}\\limits"), pu("\\bra", "\\mathinner{\\langle{#1}|}"), pu("\\ket", "\\mathinner{|{#1}\\rangle}"), pu("\\braket", "\\mathinner{\\langle{#1}\\rangle}"), pu("\\Bra", "\\left\\langle#1\\right|"), pu("\\Ket", "\\left|#1\\right\\rangle"), pu("\\angln", "{\\angl n}"), pu("\\blue", "\\textcolor{##6495ed}{#1}"), pu("\\orange", "\\textcolor{##ffa500}{#1}"), pu("\\pink", "\\textcolor{##ff00af}{#1}"), pu("\\red", "\\textcolor{##df0030}{#1}"), pu("\\green", "\\textcolor{##28ae7b}{#1}"), pu("\\gray", "\\textcolor{gray}{#1}"), pu("\\purple", "\\textcolor{##9d38bd}{#1}"), pu("\\blueA", "\\textcolor{##ccfaff}{#1}"), pu("\\blueB", "\\textcolor{##80f6ff}{#1}"), pu("\\blueC", "\\textcolor{##63d9ea}{#1}"), pu("\\blueD", "\\textcolor{##11accd}{#1}"), pu("\\blueE", "\\textcolor{##0c7f99}{#1}"), pu("\\tealA", "\\textcolor{##94fff5}{#1}"), pu("\\tealB", "\\textcolor{##26edd5}{#1}"), pu("\\tealC", "\\textcolor{##01d1c1}{#1}"), pu("\\tealD", "\\textcolor{##01a995}{#1}"), pu("\\tealE", "\\textcolor{##208170}{#1}"), pu("\\greenA", "\\textcolor{##b6ffb0}{#1}"), pu("\\greenB", "\\textcolor{##8af281}{#1}"), pu("\\greenC", "\\textcolor{##74cf70}{#1}"), pu("\\greenD", "\\textcolor{##1fab54}{#1}"), pu("\\greenE", "\\textcolor{##0d923f}{#1}"), pu("\\goldA", "\\textcolor{##ffd0a9}{#1}"), pu("\\goldB", "\\textcolor{##ffbb71}{#1}"), pu("\\goldC", "\\textcolor{##ff9c39}{#1}"), pu("\\goldD", "\\textcolor{##e07d10}{#1}"), pu("\\goldE", "\\textcolor{##a75a05}{#1}"), pu("\\redA", "\\textcolor{##fca9a9}{#1}"), pu("\\redB", "\\textcolor{##ff8482}{#1}"), pu("\\redC", "\\textcolor{##f9685d}{#1}"), pu("\\redD", "\\textcolor{##e84d39}{#1}"), pu("\\redE", "\\textcolor{##bc2612}{#1}"), pu("\\maroonA", "\\textcolor{##ffbde0}{#1}"), pu("\\maroonB", "\\textcolor{##ff92c6}{#1}"), pu("\\maroonC", "\\textcolor{##ed5fa6}{#1}"), pu("\\maroonD", "\\textcolor{##ca337c}{#1}"), pu("\\maroonE", "\\textcolor{##9e034e}{#1}"), pu("\\purpleA", "\\textcolor{##ddd7ff}{#1}"), pu("\\purpleB", "\\textcolor{##c6b9fc}{#1}"), pu("\\purpleC", "\\textcolor{##aa87ff}{#1}"), pu("\\purpleD", "\\textcolor{##7854ab}{#1}"), pu("\\purpleE", "\\textcolor{##543b78}{#1}"), pu("\\mintA", "\\textcolor{##f5f9e8}{#1}"), pu("\\mintB", "\\textcolor{##edf2df}{#1}"), pu("\\mintC", "\\textcolor{##e0e5cc}{#1}"), pu("\\grayA", "\\textcolor{##f6f7f7}{#1}"), pu("\\grayB", "\\textcolor{##f0f1f2}{#1}"), pu("\\grayC", "\\textcolor{##e3e5e6}{#1}"), pu("\\grayD", "\\textcolor{##d6d8da}{#1}"), pu("\\grayE", "\\textcolor{##babec2}{#1}"), pu("\\grayF", "\\textcolor{##888d93}{#1}"), pu("\\grayG", "\\textcolor{##626569}{#1}"), pu("\\grayH", "\\textcolor{##3b3e40}{#1}"), pu("\\grayI", "\\textcolor{##21242c}{#1}"), pu("\\kaBlue", "\\textcolor{##314453}{#1}"), pu("\\kaGreen", "\\textcolor{##71B307}{#1}");
var yu = (e6, t2) => {
  var r2, n2, i2, o2, a2 = false;
  if ("supsub" === e6.type ? (r2 = e6.sup, n2 = e6.sub, i2 = Hs(e6.base, "operatorname"), a2 = true) : i2 = Hs(e6, "operatorname"), i2.body.length > 0) {
    for (var s2 = i2.body.map(((e7) => {
      var t3 = e7.text;
      return "string" == typeof t3 ? { type: "textord", mode: e7.mode, text: t3 } : e7;
    })), l2 = ps(s2, t2.withFont("mathrm"), true), u2 = 0; u2 < l2.length; u2++) {
      var c2 = l2[u2];
      c2 instanceof No && (c2.text = c2.text.replace(/\u2212/, "-").replace(/\u2217/, "*"));
    }
    o2 = Wa.makeSpan(["mop"], l2, t2);
  } else o2 = Wa.makeSpan(["mop"], [], t2);
  return a2 ? ou(o2, r2, n2, t2, t2.style, 0, 0) : o2;
};
function vu(e6, t2, r2) {
  for (var n2 = ps(e6, t2, false), i2 = t2.sizeMultiplier / r2.sizeMultiplier, o2 = 0; o2 < n2.length; o2++) {
    var a2 = n2[o2].classes.indexOf("sizing");
    a2 < 0 ? Array.prototype.push.apply(n2[o2].classes, t2.sizingClasses(r2)) : n2[o2].classes[a2 + 1] === "reset-size" + t2.size && (n2[o2].classes[a2 + 1] = "reset-size" + r2.size), n2[o2].height *= i2, n2[o2].depth *= i2;
  }
  return Wa.makeFragment(n2);
}
ns({ type: "operatorname", names: ["\\operatorname@", "\\operatornamewithlimits"], props: { numArgs: 1 }, handler: (e6, t2) => {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  return { type: "operatorname", mode: r2.mode, body: as(i2), alwaysHandleSupSub: "\\operatornamewithlimits" === n2, limits: false, parentIsSupSub: false };
}, htmlBuilder: yu, mathmlBuilder: (e6, t2) => {
  for (var r2 = zs(e6.body, t2.withFont("mathrm")), n2 = true, i2 = 0; i2 < r2.length; i2++) {
    var o2 = r2[i2];
    if (o2 instanceof _s.SpaceNode) ;
    else if (o2 instanceof _s.MathNode) switch (o2.type) {
      case "mi":
      case "mn":
      case "ms":
      case "mspace":
      case "mtext":
        break;
      case "mo":
        var a2 = o2.children[0];
        1 === o2.children.length && a2 instanceof _s.TextNode ? a2.text = a2.text.replace(/\u2212/, "-").replace(/\u2217/, "*") : n2 = false;
        break;
      default:
        n2 = false;
    }
    else n2 = false;
  }
  if (n2) {
    var s2 = r2.map(((e7) => e7.toText())).join("");
    r2 = [new _s.TextNode(s2)];
  }
  var l2 = new _s.MathNode("mi", r2);
  l2.setAttribute("mathvariant", "normal");
  var u2 = new _s.MathNode("mo", [Ss("⁡", "text")]);
  return e6.parentIsSupSub ? new _s.MathNode("mrow", [l2, u2]) : _s.newDocumentFragment([l2, u2]);
} }), pu("\\operatorname", "\\@ifstar\\operatornamewithlimits\\operatorname@"), is({ type: "ordgroup", htmlBuilder: (e6, t2) => e6.semisimple ? Wa.makeFragment(ps(e6.body, t2, false)) : Wa.makeSpan(["mord"], ps(e6.body, t2, true), t2), mathmlBuilder: (e6, t2) => Ts(e6.body, t2, true) }), ns({ type: "overline", names: ["\\overline"], props: { numArgs: 1 }, handler(e6, t2) {
  var { parser: r2 } = e6, n2 = t2[0];
  return { type: "overline", mode: r2.mode, body: n2 };
}, htmlBuilder(e6, t2) {
  var r2 = ys(e6.body, t2.havingCrampedStyle()), n2 = Wa.makeLineSpan("overline-line", t2), i2 = t2.fontMetrics().defaultRuleThickness, o2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: r2 }, { type: "kern", size: 3 * i2 }, { type: "elem", elem: n2 }, { type: "kern", size: i2 }] }, t2);
  return Wa.makeSpan(["mord", "overline"], [o2], t2);
}, mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mo", [new _s.TextNode("‾")]);
  r2.setAttribute("stretchy", "true");
  var n2 = new _s.MathNode("mover", [Ms(e6.body, t2), r2]);
  return n2.setAttribute("accent", "true"), n2;
} }), ns({ type: "phantom", names: ["\\phantom"], props: { numArgs: 1, allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = t2[0];
  return { type: "phantom", mode: r2.mode, body: as(n2) };
}, htmlBuilder: (e6, t2) => {
  var r2 = ps(e6.body, t2.withPhantom(), false);
  return Wa.makeFragment(r2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = zs(e6.body, t2);
  return new _s.MathNode("mphantom", r2);
} }), ns({ type: "hphantom", names: ["\\hphantom"], props: { numArgs: 1, allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = t2[0];
  return { type: "hphantom", mode: r2.mode, body: n2 };
}, htmlBuilder: (e6, t2) => {
  var r2 = Wa.makeSpan([], [ys(e6.body, t2.withPhantom())]);
  if (r2.height = 0, r2.depth = 0, r2.children) for (var n2 = 0; n2 < r2.children.length; n2++) r2.children[n2].height = 0, r2.children[n2].depth = 0;
  return r2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: r2 }] }, t2), Wa.makeSpan(["mord"], [r2], t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = zs(as(e6.body), t2), n2 = new _s.MathNode("mphantom", r2), i2 = new _s.MathNode("mpadded", [n2]);
  return i2.setAttribute("height", "0px"), i2.setAttribute("depth", "0px"), i2;
} }), ns({ type: "vphantom", names: ["\\vphantom"], props: { numArgs: 1, allowedInText: true }, handler: (e6, t2) => {
  var { parser: r2 } = e6, n2 = t2[0];
  return { type: "vphantom", mode: r2.mode, body: n2 };
}, htmlBuilder: (e6, t2) => {
  var r2 = Wa.makeSpan(["inner"], [ys(e6.body, t2.withPhantom())]), n2 = Wa.makeSpan(["fix"], []);
  return Wa.makeSpan(["mord", "rlap"], [r2, n2], t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = zs(as(e6.body), t2), n2 = new _s.MathNode("mphantom", r2), i2 = new _s.MathNode("mpadded", [n2]);
  return i2.setAttribute("width", "0px"), i2;
} }), ns({ type: "raisebox", names: ["\\raisebox"], props: { numArgs: 2, argTypes: ["size", "hbox"], allowedInText: true }, handler(e6, t2) {
  var { parser: r2 } = e6, n2 = Hs(t2[0], "size").value, i2 = t2[1];
  return { type: "raisebox", mode: r2.mode, dy: n2, body: i2 };
}, htmlBuilder(e6, t2) {
  var r2 = ys(e6.body, t2), n2 = Fa(e6.dy, t2);
  return Wa.makeVList({ positionType: "shift", positionData: -n2, children: [{ type: "elem", elem: r2 }] }, t2);
}, mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mpadded", [Ms(e6.body, t2)]), n2 = e6.dy.number + e6.dy.unit;
  return r2.setAttribute("voffset", n2), r2;
} }), ns({ type: "rule", names: ["\\rule"], props: { numArgs: 2, numOptionalArgs: 1, argTypes: ["size", "size", "size"] }, handler(e6, t2, r2) {
  var { parser: n2 } = e6, i2 = r2[0], o2 = Hs(t2[0], "size"), a2 = Hs(t2[1], "size");
  return { type: "rule", mode: n2.mode, shift: i2 && Hs(i2, "size").value, width: o2.value, height: a2.value };
}, htmlBuilder(e6, t2) {
  var r2 = Wa.makeSpan(["mord", "rule"], [], t2), n2 = Fa(e6.width, t2), i2 = Fa(e6.height, t2), o2 = e6.shift ? Fa(e6.shift, t2) : 0;
  return r2.style.borderRightWidth = n2 + "em", r2.style.borderTopWidth = i2 + "em", r2.style.bottom = o2 + "em", r2.width = n2, r2.height = i2 + o2, r2.depth = -o2, r2.maxFontSize = 1.125 * i2 * t2.sizeMultiplier, r2;
}, mathmlBuilder(e6, t2) {
  var r2 = Fa(e6.width, t2), n2 = Fa(e6.height, t2), i2 = e6.shift ? Fa(e6.shift, t2) : 0, o2 = t2.color && t2.getColor() || "black", a2 = new _s.MathNode("mspace");
  a2.setAttribute("mathbackground", o2), a2.setAttribute("width", r2 + "em"), a2.setAttribute("height", n2 + "em");
  var s2 = new _s.MathNode("mpadded", [a2]);
  return i2 >= 0 ? s2.setAttribute("height", "+" + i2 + "em") : (s2.setAttribute("height", i2 + "em"), s2.setAttribute("depth", "+" + -i2 + "em")), s2.setAttribute("voffset", i2 + "em"), s2;
} });
var xu = ["\\tiny", "\\sixptsize", "\\scriptsize", "\\footnotesize", "\\small", "\\normalsize", "\\large", "\\Large", "\\LARGE", "\\huge", "\\Huge"];
ns({ type: "sizing", names: xu, props: { numArgs: 0, allowedInText: true }, handler: (e6, t2) => {
  var { breakOnTokenText: r2, funcName: n2, parser: i2 } = e6, o2 = i2.parseExpression(false, r2);
  return { type: "sizing", mode: i2.mode, size: xu.indexOf(n2) + 1, body: o2 };
}, htmlBuilder: (e6, t2) => {
  var r2 = t2.havingSize(e6.size);
  return vu(e6.body, r2, t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = t2.havingSize(e6.size), n2 = zs(e6.body, r2), i2 = new _s.MathNode("mstyle", n2);
  return i2.setAttribute("mathsize", r2.sizeMultiplier + "em"), i2;
} }), ns({ type: "smash", names: ["\\smash"], props: { numArgs: 1, numOptionalArgs: 1, allowedInText: true }, handler: (e6, t2, r2) => {
  var { parser: n2 } = e6, i2 = false, o2 = false, a2 = r2[0] && Hs(r2[0], "ordgroup");
  if (a2) for (var s2 = "", l2 = 0; l2 < a2.body.length; ++l2) {
    if ("t" === (s2 = a2.body[l2].text)) i2 = true;
    else {
      if ("b" !== s2) {
        i2 = false, o2 = false;
        break;
      }
      o2 = true;
    }
  }
  else i2 = true, o2 = true;
  var u2 = t2[0];
  return { type: "smash", mode: n2.mode, body: u2, smashHeight: i2, smashDepth: o2 };
}, htmlBuilder: (e6, t2) => {
  var r2 = Wa.makeSpan([], [ys(e6.body, t2)]);
  if (!e6.smashHeight && !e6.smashDepth) return r2;
  if (e6.smashHeight && (r2.height = 0, r2.children)) for (var n2 = 0; n2 < r2.children.length; n2++) r2.children[n2].height = 0;
  if (e6.smashDepth && (r2.depth = 0, r2.children)) for (var i2 = 0; i2 < r2.children.length; i2++) r2.children[i2].depth = 0;
  var o2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: r2 }] }, t2);
  return Wa.makeSpan(["mord"], [o2], t2);
}, mathmlBuilder: (e6, t2) => {
  var r2 = new _s.MathNode("mpadded", [Ms(e6.body, t2)]);
  return e6.smashHeight && r2.setAttribute("height", "0px"), e6.smashDepth && r2.setAttribute("depth", "0px"), r2;
} }), ns({ type: "sqrt", names: ["\\sqrt"], props: { numArgs: 1, numOptionalArgs: 1 }, handler(e6, t2, r2) {
  var { parser: n2 } = e6, i2 = r2[0], o2 = t2[0];
  return { type: "sqrt", mode: n2.mode, body: o2, index: i2 };
}, htmlBuilder(e6, t2) {
  var r2 = ys(e6.body, t2.havingCrampedStyle());
  0 === r2.height && (r2.height = t2.fontMetrics().xHeight), r2 = Wa.wrapFragment(r2, t2);
  var n2 = t2.fontMetrics().defaultRuleThickness, i2 = n2;
  t2.style.id < xo.TEXT.id && (i2 = t2.fontMetrics().xHeight);
  var o2 = n2 + i2 / 4, a2 = r2.height + r2.depth + o2 + n2, { span: s2, ruleWidth: l2, advanceWidth: u2 } = kl(a2, t2), c2 = s2.height - l2;
  c2 > r2.height + r2.depth + o2 && (o2 = (o2 + c2 - r2.height - r2.depth) / 2);
  var h2 = s2.height - r2.height - o2 - l2;
  r2.style.paddingLeft = u2 + "em";
  var p2 = Wa.makeVList({ positionType: "firstBaseline", children: [{ type: "elem", elem: r2, wrapperClasses: ["svg-align"] }, { type: "kern", size: -(r2.height + h2) }, { type: "elem", elem: s2 }, { type: "kern", size: l2 }] }, t2);
  if (e6.index) {
    var d2 = t2.havingStyle(xo.SCRIPTSCRIPT), m2 = ys(e6.index, d2, t2), g2 = 0.6 * (p2.height - p2.depth), f2 = Wa.makeVList({ positionType: "shift", positionData: -g2, children: [{ type: "elem", elem: m2 }] }, t2), b2 = Wa.makeSpan(["root"], [f2]);
    return Wa.makeSpan(["mord", "sqrt"], [b2, p2], t2);
  }
  return Wa.makeSpan(["mord", "sqrt"], [p2], t2);
}, mathmlBuilder(e6, t2) {
  var { body: r2, index: n2 } = e6;
  return n2 ? new _s.MathNode("mroot", [Ms(r2, t2), Ms(n2, t2)]) : new _s.MathNode("msqrt", [Ms(r2, t2)]);
} });
var wu = { display: xo.DISPLAY, text: xo.TEXT, script: xo.SCRIPT, scriptscript: xo.SCRIPTSCRIPT };
ns({ type: "styling", names: ["\\displaystyle", "\\textstyle", "\\scriptstyle", "\\scriptscriptstyle"], props: { numArgs: 0, allowedInText: true, primitive: true }, handler(e6, t2) {
  var { breakOnTokenText: r2, funcName: n2, parser: i2 } = e6, o2 = i2.parseExpression(true, r2), a2 = n2.slice(1, n2.length - 5);
  return { type: "styling", mode: i2.mode, style: a2, body: o2 };
}, htmlBuilder(e6, t2) {
  var r2 = wu[e6.style], n2 = t2.havingStyle(r2).withFont("");
  return vu(e6.body, n2, t2);
}, mathmlBuilder(e6, t2) {
  var r2 = wu[e6.style], n2 = t2.havingStyle(r2), i2 = zs(e6.body, n2), o2 = new _s.MathNode("mstyle", i2), a2 = { display: ["0", "true"], text: ["0", "false"], script: ["1", "false"], scriptscript: ["2", "false"] }[e6.style];
  return o2.setAttribute("scriptlevel", a2[0]), o2.setAttribute("displaystyle", a2[1]), o2;
} });
is({ type: "supsub", htmlBuilder(e6, t2) {
  var r2 = (function(e7, t3) {
    var r3 = e7.base;
    return r3 ? "op" === r3.type ? r3.limits && (t3.style.size === xo.DISPLAY.size || r3.alwaysHandleSupSub) ? su : null : "operatorname" === r3.type ? r3.alwaysHandleSupSub && (t3.style.size === xo.DISPLAY.size || r3.limits) ? yu : null : "accent" === r3.type ? uo.isCharacterBox(r3.base) ? Ps : null : "horizBrace" === r3.type && !e7.sub === r3.isOver ? ru : null : null;
  })(e6, t2);
  if (r2) return r2(e6, t2);
  var n2, i2, o2, { base: a2, sup: s2, sub: l2 } = e6, u2 = ys(a2, t2), c2 = t2.fontMetrics(), h2 = 0, p2 = 0, d2 = a2 && uo.isCharacterBox(a2);
  if (s2) {
    var m2 = t2.havingStyle(t2.style.sup());
    n2 = ys(s2, m2, t2), d2 || (h2 = u2.height - m2.fontMetrics().supDrop * m2.sizeMultiplier / t2.sizeMultiplier);
  }
  if (l2) {
    var g2 = t2.havingStyle(t2.style.sub());
    i2 = ys(l2, g2, t2), d2 || (p2 = u2.depth + g2.fontMetrics().subDrop * g2.sizeMultiplier / t2.sizeMultiplier);
  }
  o2 = t2.style === xo.DISPLAY ? c2.sup1 : t2.style.cramped ? c2.sup3 : c2.sup2;
  var f2, b2 = t2.sizeMultiplier, y2 = 0.5 / c2.ptPerEm / b2 + "em", v2 = null;
  if (i2) {
    var x2 = e6.base && "op" === e6.base.type && e6.base.name && ("\\oiint" === e6.base.name || "\\oiiint" === e6.base.name);
    (u2 instanceof No || x2) && (v2 = -u2.italic + "em");
  }
  if (n2 && i2) {
    h2 = Math.max(h2, o2, n2.depth + 0.25 * c2.xHeight), p2 = Math.max(p2, c2.sub2);
    var w2 = 4 * c2.defaultRuleThickness;
    if (h2 - n2.depth - (i2.height - p2) < w2) {
      p2 = w2 - (h2 - n2.depth) + i2.height;
      var k2 = 0.8 * c2.xHeight - (h2 - n2.depth);
      k2 > 0 && (h2 += k2, p2 -= k2);
    }
    var A2 = [{ type: "elem", elem: i2, shift: p2, marginRight: y2, marginLeft: v2 }, { type: "elem", elem: n2, shift: -h2, marginRight: y2 }];
    f2 = Wa.makeVList({ positionType: "individualShift", children: A2 }, t2);
  } else if (i2) {
    p2 = Math.max(p2, c2.sub1, i2.height - 0.8 * c2.xHeight);
    var _2 = [{ type: "elem", elem: i2, marginLeft: v2, marginRight: y2 }];
    f2 = Wa.makeVList({ positionType: "shift", positionData: p2, children: _2 }, t2);
  } else {
    if (!n2) throw new Error("supsub must have either sup or sub.");
    h2 = Math.max(h2, o2, n2.depth + 0.25 * c2.xHeight), f2 = Wa.makeVList({ positionType: "shift", positionData: -h2, children: [{ type: "elem", elem: n2, marginRight: y2 }] }, t2);
  }
  var S2 = fs(u2, "right") || "mord";
  return Wa.makeSpan([S2], [u2, Wa.makeSpan(["msupsub"], [f2])], t2);
}, mathmlBuilder(e6, t2) {
  var r2, n2 = false;
  e6.base && "horizBrace" === e6.base.type && !!e6.sup === e6.base.isOver && (n2 = true, r2 = e6.base.isOver), !e6.base || "op" !== e6.base.type && "operatorname" !== e6.base.type || (e6.base.parentIsSupSub = true);
  var i2, o2 = [Ms(e6.base, t2)];
  if (e6.sub && o2.push(Ms(e6.sub, t2)), e6.sup && o2.push(Ms(e6.sup, t2)), n2) i2 = r2 ? "mover" : "munder";
  else if (e6.sub) if (e6.sup) {
    var a2 = e6.base;
    i2 = a2 && "op" === a2.type && a2.limits && t2.style === xo.DISPLAY || a2 && "operatorname" === a2.type && a2.alwaysHandleSupSub && (t2.style === xo.DISPLAY || a2.limits) ? "munderover" : "msubsup";
  } else {
    var s2 = e6.base;
    i2 = s2 && "op" === s2.type && s2.limits && (t2.style === xo.DISPLAY || s2.alwaysHandleSupSub) || s2 && "operatorname" === s2.type && s2.alwaysHandleSupSub && (s2.limits || t2.style === xo.DISPLAY) ? "munder" : "msub";
  }
  else {
    var l2 = e6.base;
    i2 = l2 && "op" === l2.type && l2.limits && (t2.style === xo.DISPLAY || l2.alwaysHandleSupSub) || l2 && "operatorname" === l2.type && l2.alwaysHandleSupSub && (l2.limits || t2.style === xo.DISPLAY) ? "mover" : "msup";
  }
  return new _s.MathNode(i2, o2);
} }), is({ type: "atom", htmlBuilder: (e6, t2) => Wa.mathsym(e6.text, e6.mode, t2, ["m" + e6.family]), mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mo", [Ss(e6.text, e6.mode)]);
  if ("bin" === e6.family) {
    var n2 = Cs(e6, t2);
    "bold-italic" === n2 && r2.setAttribute("mathvariant", n2);
  } else "punct" === e6.family ? r2.setAttribute("separator", "true") : "open" !== e6.family && "close" !== e6.family || r2.setAttribute("stretchy", "false");
  return r2;
} });
var ku = { mi: "italic", mn: "normal", mtext: "normal" };
is({ type: "mathord", htmlBuilder: (e6, t2) => Wa.makeOrd(e6, t2, "mathord"), mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mi", [Ss(e6.text, e6.mode, t2)]), n2 = Cs(e6, t2) || "italic";
  return n2 !== ku[r2.type] && r2.setAttribute("mathvariant", n2), r2;
} }), is({ type: "textord", htmlBuilder: (e6, t2) => Wa.makeOrd(e6, t2, "textord"), mathmlBuilder(e6, t2) {
  var r2, n2 = Ss(e6.text, e6.mode, t2), i2 = Cs(e6, t2) || "normal";
  return r2 = "text" === e6.mode ? new _s.MathNode("mtext", [n2]) : /[0-9]/.test(e6.text) ? new _s.MathNode("mn", [n2]) : "\\prime" === e6.text ? new _s.MathNode("mo", [n2]) : new _s.MathNode("mi", [n2]), i2 !== ku[r2.type] && r2.setAttribute("mathvariant", i2), r2;
} });
var Au = { "\\nobreak": "nobreak", "\\allowbreak": "allowbreak" }, _u = { " ": {}, "\\ ": {}, "~": { className: "nobreak" }, "\\space": {}, "\\nobreakspace": { className: "nobreak" } };
is({ type: "spacing", htmlBuilder(e6, t2) {
  if (_u.hasOwnProperty(e6.text)) {
    var r2 = _u[e6.text].className || "";
    if ("text" === e6.mode) {
      var n2 = Wa.makeOrd(e6, t2, "textord");
      return n2.classes.push(r2), n2;
    }
    return Wa.makeSpan(["mspace", r2], [Wa.mathsym(e6.text, e6.mode, t2)], t2);
  }
  if (Au.hasOwnProperty(e6.text)) return Wa.makeSpan(["mspace", Au[e6.text]], [], t2);
  throw new io('Unknown type of space "' + e6.text + '"');
}, mathmlBuilder(e6, t2) {
  if (!_u.hasOwnProperty(e6.text)) {
    if (Au.hasOwnProperty(e6.text)) return new _s.MathNode("mspace");
    throw new io('Unknown type of space "' + e6.text + '"');
  }
  return new _s.MathNode("mtext", [new _s.TextNode(" ")]);
} });
var Su = () => {
  var e6 = new _s.MathNode("mtd", []);
  return e6.setAttribute("width", "50%"), e6;
};
is({ type: "tag", mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mtable", [new _s.MathNode("mtr", [Su(), new _s.MathNode("mtd", [Ts(e6.body, t2)]), Su(), new _s.MathNode("mtd", [Ts(e6.tag, t2)])])]);
  return r2.setAttribute("width", "100%"), r2;
} });
var qu = { "\\text": void 0, "\\textrm": "textrm", "\\textsf": "textsf", "\\texttt": "texttt", "\\textnormal": "textrm" }, Cu = { "\\textbf": "textbf", "\\textmd": "textmd" }, zu = { "\\textit": "textit", "\\textup": "textup" }, Tu = (e6, t2) => {
  var r2 = e6.font;
  return r2 ? qu[r2] ? t2.withTextFontFamily(qu[r2]) : Cu[r2] ? t2.withTextFontWeight(Cu[r2]) : t2.withTextFontShape(zu[r2]) : t2;
};
ns({ type: "text", names: ["\\text", "\\textrm", "\\textsf", "\\texttt", "\\textnormal", "\\textbf", "\\textmd", "\\textit", "\\textup"], props: { numArgs: 1, argTypes: ["text"], allowedInArgument: true, allowedInText: true }, handler(e6, t2) {
  var { parser: r2, funcName: n2 } = e6, i2 = t2[0];
  return { type: "text", mode: r2.mode, body: as(i2), font: n2 };
}, htmlBuilder(e6, t2) {
  var r2 = Tu(e6, t2), n2 = ps(e6.body, r2, true);
  return Wa.makeSpan(["mord", "text"], n2, r2);
}, mathmlBuilder(e6, t2) {
  var r2 = Tu(e6, t2);
  return Ts(e6.body, r2);
} }), ns({ type: "underline", names: ["\\underline"], props: { numArgs: 1, allowedInText: true }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "underline", mode: r2.mode, body: t2[0] };
}, htmlBuilder(e6, t2) {
  var r2 = ys(e6.body, t2), n2 = Wa.makeLineSpan("underline-line", t2), i2 = t2.fontMetrics().defaultRuleThickness, o2 = Wa.makeVList({ positionType: "top", positionData: r2.height, children: [{ type: "kern", size: i2 }, { type: "elem", elem: n2 }, { type: "kern", size: 3 * i2 }, { type: "elem", elem: r2 }] }, t2);
  return Wa.makeSpan(["mord", "underline"], [o2], t2);
}, mathmlBuilder(e6, t2) {
  var r2 = new _s.MathNode("mo", [new _s.TextNode("‾")]);
  r2.setAttribute("stretchy", "true");
  var n2 = new _s.MathNode("munder", [Ms(e6.body, t2), r2]);
  return n2.setAttribute("accentunder", "true"), n2;
} }), ns({ type: "vcenter", names: ["\\vcenter"], props: { numArgs: 1, argTypes: ["original"], allowedInText: false }, handler(e6, t2) {
  var { parser: r2 } = e6;
  return { type: "vcenter", mode: r2.mode, body: t2[0] };
}, htmlBuilder(e6, t2) {
  var r2 = ys(e6.body, t2), n2 = t2.fontMetrics().axisHeight, i2 = 0.5 * (r2.height - n2 - (r2.depth + n2));
  return Wa.makeVList({ positionType: "shift", positionData: i2, children: [{ type: "elem", elem: r2 }] }, t2);
}, mathmlBuilder: (e6, t2) => new _s.MathNode("mpadded", [Ms(e6.body, t2)], ["vcenter"]) }), ns({ type: "verb", names: ["\\verb"], props: { numArgs: 0, allowedInText: true }, handler(e6, t2, r2) {
  throw new io("\\verb ended by end of line instead of matching delimiter");
}, htmlBuilder(e6, t2) {
  for (var r2 = Mu(e6), n2 = [], i2 = t2.havingStyle(t2.style.text()), o2 = 0; o2 < r2.length; o2++) {
    var a2 = r2[o2];
    "~" === a2 && (a2 = "\\textasciitilde"), n2.push(Wa.makeSymbol(a2, "Typewriter-Regular", e6.mode, i2, ["mord", "texttt"]));
  }
  return Wa.makeSpan(["mord", "text"].concat(i2.sizingClasses(t2)), Wa.tryCombineChars(n2), i2);
}, mathmlBuilder(e6, t2) {
  var r2 = new _s.TextNode(Mu(e6)), n2 = new _s.MathNode("mtext", [r2]);
  return n2.setAttribute("mathvariant", "monospace"), n2;
} });
var Mu = (e6) => e6.body.replace(/ /g, e6.star ? "␣" : " "), Eu = es, Du = "[ \r\n	]", Lu = "(\\\\[a-zA-Z@]+)" + Du + "*", Bu = "[̀-ͯ]", Nu = new RegExp(Bu + "+$"), Ou = "(" + Du + "+)|\\\\(\n|[ \r	]+\n?)[ \r	]*|([!-\\[\\]-‧‪-퟿豈-￿]" + Bu + "*|[\uD800-\uDBFF][\uDC00-\uDFFF]" + Bu + "*|\\\\verb\\*([^]).*?\\4|\\\\verb([^*a-zA-Z]).*?\\5|" + Lu + "|\\\\[^\uD800-\uDFFF])";
class Fu {
  constructor(e6, t2) {
    this.input = void 0, this.settings = void 0, this.tokenRegex = void 0, this.catcodes = void 0, this.input = e6, this.settings = t2, this.tokenRegex = new RegExp(Ou, "g"), this.catcodes = { "%": 14, "~": 13 };
  }
  setCatcode(e6, t2) {
    this.catcodes[e6] = t2;
  }
  lex() {
    var e6 = this.input, t2 = this.tokenRegex.lastIndex;
    if (t2 === e6.length) return new no("EOF", new ro(this, t2, t2));
    var r2 = this.tokenRegex.exec(e6);
    if (null === r2 || r2.index !== t2) throw new io("Unexpected character: '" + e6[t2] + "'", new no(e6[t2], new ro(this, t2, t2 + 1)));
    var n2 = r2[6] || r2[3] || (r2[2] ? "\\ " : " ");
    if (14 === this.catcodes[n2]) {
      var i2 = e6.indexOf("\n", this.tokenRegex.lastIndex);
      return -1 === i2 ? (this.tokenRegex.lastIndex = e6.length, this.settings.reportNonstrict("commentAtEnd", "% comment has no terminating newline; LaTeX would fail because of commenting the end of math mode (e.g. $)")) : this.tokenRegex.lastIndex = i2 + 1, this.lex();
    }
    return new no(n2, new ro(this, t2, this.tokenRegex.lastIndex));
  }
}
class Ru {
  constructor(e6, t2) {
    void 0 === e6 && (e6 = {}), void 0 === t2 && (t2 = {}), this.current = void 0, this.builtins = void 0, this.undefStack = void 0, this.current = t2, this.builtins = e6, this.undefStack = [];
  }
  beginGroup() {
    this.undefStack.push({});
  }
  endGroup() {
    if (0 === this.undefStack.length) throw new io("Unbalanced namespace destruction: attempt to pop global namespace; please report this as a bug");
    var e6 = this.undefStack.pop();
    for (var t2 in e6) e6.hasOwnProperty(t2) && (void 0 === e6[t2] ? delete this.current[t2] : this.current[t2] = e6[t2]);
  }
  has(e6) {
    return this.current.hasOwnProperty(e6) || this.builtins.hasOwnProperty(e6);
  }
  get(e6) {
    return this.current.hasOwnProperty(e6) ? this.current[e6] : this.builtins[e6];
  }
  set(e6, t2, r2) {
    if (void 0 === r2 && (r2 = false), r2) {
      for (var n2 = 0; n2 < this.undefStack.length; n2++) delete this.undefStack[n2][e6];
      this.undefStack.length > 0 && (this.undefStack[this.undefStack.length - 1][e6] = t2);
    } else {
      var i2 = this.undefStack[this.undefStack.length - 1];
      i2 && !i2.hasOwnProperty(e6) && (i2[e6] = this.current[e6]);
    }
    this.current[e6] = t2;
  }
}
var Hu = { "\\relax": true, "^": true, _: true, "\\limits": true, "\\nolimits": true };
class Vu {
  constructor(e6, t2, r2) {
    this.settings = void 0, this.expansionCount = void 0, this.lexer = void 0, this.macros = void 0, this.stack = void 0, this.mode = void 0, this.settings = t2, this.expansionCount = 0, this.feed(e6), this.macros = new Ru(hu, t2.macros), this.mode = r2, this.stack = [];
  }
  feed(e6) {
    this.lexer = new Fu(e6, this.settings);
  }
  switchMode(e6) {
    this.mode = e6;
  }
  beginGroup() {
    this.macros.beginGroup();
  }
  endGroup() {
    this.macros.endGroup();
  }
  future() {
    return 0 === this.stack.length && this.pushToken(this.lexer.lex()), this.stack[this.stack.length - 1];
  }
  popToken() {
    return this.future(), this.stack.pop();
  }
  pushToken(e6) {
    this.stack.push(e6);
  }
  pushTokens(e6) {
    this.stack.push(...e6);
  }
  scanArgument(e6) {
    var t2, r2, n2;
    if (e6) {
      if (this.consumeSpaces(), "[" !== this.future().text) return null;
      t2 = this.popToken(), { tokens: n2, end: r2 } = this.consumeArg(["]"]);
    } else ({ tokens: n2, start: t2, end: r2 } = this.consumeArg());
    return this.pushToken(new no("EOF", r2.loc)), this.pushTokens(n2), t2.range(r2, "");
  }
  consumeSpaces() {
    for (; ; ) {
      if (" " !== this.future().text) break;
      this.stack.pop();
    }
  }
  consumeArg(e6) {
    var t2 = [], r2 = e6 && e6.length > 0;
    r2 || this.consumeSpaces();
    var n2, i2 = this.future(), o2 = 0, a2 = 0;
    do {
      if (n2 = this.popToken(), t2.push(n2), "{" === n2.text) ++o2;
      else if ("}" === n2.text) {
        if (-1 === --o2) throw new io("Extra }", n2);
      } else if ("EOF" === n2.text) throw new io("Unexpected end of input in a macro argument, expected '" + (e6 && r2 ? e6[a2] : "}") + "'", n2);
      if (e6 && r2) if ((0 === o2 || 1 === o2 && "{" === e6[a2]) && n2.text === e6[a2]) {
        if (++a2 === e6.length) {
          t2.splice(-a2, a2);
          break;
        }
      } else a2 = 0;
    } while (0 !== o2 || r2);
    return "{" === i2.text && "}" === t2[t2.length - 1].text && (t2.pop(), t2.shift()), t2.reverse(), { tokens: t2, start: i2, end: n2 };
  }
  consumeArgs(e6, t2) {
    if (t2) {
      if (t2.length !== e6 + 1) throw new io("The length of delimiters doesn't match the number of args!");
      for (var r2 = t2[0], n2 = 0; n2 < r2.length; n2++) {
        var i2 = this.popToken();
        if (r2[n2] !== i2.text) throw new io("Use of the macro doesn't match its definition", i2);
      }
    }
    for (var o2 = [], a2 = 0; a2 < e6; a2++) o2.push(this.consumeArg(t2 && t2[a2 + 1]).tokens);
    return o2;
  }
  expandOnce(e6) {
    var t2 = this.popToken(), r2 = t2.text, n2 = t2.noexpand ? null : this._getExpansion(r2);
    if (null == n2 || e6 && n2.unexpandable) {
      if (e6 && null == n2 && "\\" === r2[0] && !this.isDefined(r2)) throw new io("Undefined control sequence: " + r2);
      return this.pushToken(t2), t2;
    }
    if (this.expansionCount++, this.expansionCount > this.settings.maxExpand) throw new io("Too many expansions: infinite loop or need to increase maxExpand setting");
    var i2 = n2.tokens, o2 = this.consumeArgs(n2.numArgs, n2.delimiters);
    if (n2.numArgs) for (var a2 = (i2 = i2.slice()).length - 1; a2 >= 0; --a2) {
      var s2 = i2[a2];
      if ("#" === s2.text) {
        if (0 === a2) throw new io("Incomplete placeholder at end of macro body", s2);
        if ("#" === (s2 = i2[--a2]).text) i2.splice(a2 + 1, 1);
        else {
          if (!/^[1-9]$/.test(s2.text)) throw new io("Not a valid argument number", s2);
          i2.splice(a2, 2, ...o2[+s2.text - 1]);
        }
      }
    }
    return this.pushTokens(i2), i2;
  }
  expandAfterFuture() {
    return this.expandOnce(), this.future();
  }
  expandNextToken() {
    for (; ; ) {
      var e6 = this.expandOnce();
      if (e6 instanceof no) {
        if ("\\relax" !== e6.text && !e6.treatAsRelax) return this.stack.pop();
        this.stack.pop();
      }
    }
    throw new Error();
  }
  expandMacro(e6) {
    return this.macros.has(e6) ? this.expandTokens([new no(e6)]) : void 0;
  }
  expandTokens(e6) {
    var t2 = [], r2 = this.stack.length;
    for (this.pushTokens(e6); this.stack.length > r2; ) {
      var n2 = this.expandOnce(true);
      n2 instanceof no && (n2.treatAsRelax && (n2.noexpand = false, n2.treatAsRelax = false), t2.push(this.stack.pop()));
    }
    return t2;
  }
  expandMacroAsText(e6) {
    var t2 = this.expandMacro(e6);
    return t2 ? t2.map(((e7) => e7.text)).join("") : t2;
  }
  _getExpansion(e6) {
    var t2 = this.macros.get(e6);
    if (null == t2) return t2;
    if (1 === e6.length) {
      var r2 = this.lexer.catcodes[e6];
      if (null != r2 && 13 !== r2) return;
    }
    var n2 = "function" == typeof t2 ? t2(this) : t2;
    if ("string" == typeof n2) {
      var i2 = 0;
      if (-1 !== n2.indexOf("#")) for (var o2 = n2.replace(/##/g, ""); -1 !== o2.indexOf("#" + (i2 + 1)); ) ++i2;
      for (var a2 = new Fu(n2, this.settings), s2 = [], l2 = a2.lex(); "EOF" !== l2.text; ) s2.push(l2), l2 = a2.lex();
      return s2.reverse(), { tokens: s2, numArgs: i2 };
    }
    return n2;
  }
  isDefined(e6) {
    return this.macros.has(e6) || Eu.hasOwnProperty(e6) || Xo.math.hasOwnProperty(e6) || Xo.text.hasOwnProperty(e6) || Hu.hasOwnProperty(e6);
  }
  isExpandable(e6) {
    var t2 = this.macros.get(e6);
    return null != t2 ? "string" == typeof t2 || "function" == typeof t2 || !t2.unexpandable : Eu.hasOwnProperty(e6) && !Eu[e6].primitive;
  }
}
var Iu = { "́": { text: "\\'", math: "\\acute" }, "̀": { text: "\\`", math: "\\grave" }, "̈": { text: '\\"', math: "\\ddot" }, "̃": { text: "\\~", math: "\\tilde" }, "̄": { text: "\\=", math: "\\bar" }, "̆": { text: "\\u", math: "\\breve" }, "̌": { text: "\\v", math: "\\check" }, "̂": { text: "\\^", math: "\\hat" }, "̇": { text: "\\.", math: "\\dot" }, "̊": { text: "\\r", math: "\\mathring" }, "̋": { text: "\\H" } }, Pu = { "á": "á", "à": "à", "ä": "ä", "ǟ": "ǟ", "ã": "ã", "ā": "ā", "ă": "ă", "ắ": "ắ", "ằ": "ằ", "ẵ": "ẵ", "ǎ": "ǎ", "â": "â", "ấ": "ấ", "ầ": "ầ", "ẫ": "ẫ", "ȧ": "ȧ", "ǡ": "ǡ", "å": "å", "ǻ": "ǻ", "ḃ": "ḃ", "ć": "ć", "č": "č", "ĉ": "ĉ", "ċ": "ċ", "ď": "ď", "ḋ": "ḋ", "é": "é", "è": "è", "ë": "ë", "ẽ": "ẽ", "ē": "ē", "ḗ": "ḗ", "ḕ": "ḕ", "ĕ": "ĕ", "ě": "ě", "ê": "ê", "ế": "ế", "ề": "ề", "ễ": "ễ", "ė": "ė", "ḟ": "ḟ", "ǵ": "ǵ", "ḡ": "ḡ", "ğ": "ğ", "ǧ": "ǧ", "ĝ": "ĝ", "ġ": "ġ", "ḧ": "ḧ", "ȟ": "ȟ", "ĥ": "ĥ", "ḣ": "ḣ", "í": "í", "ì": "ì", "ï": "ï", "ḯ": "ḯ", "ĩ": "ĩ", "ī": "ī", "ĭ": "ĭ", "ǐ": "ǐ", "î": "î", "ǰ": "ǰ", "ĵ": "ĵ", "ḱ": "ḱ", "ǩ": "ǩ", "ĺ": "ĺ", "ľ": "ľ", "ḿ": "ḿ", "ṁ": "ṁ", "ń": "ń", "ǹ": "ǹ", "ñ": "ñ", "ň": "ň", "ṅ": "ṅ", "ó": "ó", "ò": "ò", "ö": "ö", "ȫ": "ȫ", "õ": "õ", "ṍ": "ṍ", "ṏ": "ṏ", "ȭ": "ȭ", "ō": "ō", "ṓ": "ṓ", "ṑ": "ṑ", "ŏ": "ŏ", "ǒ": "ǒ", "ô": "ô", "ố": "ố", "ồ": "ồ", "ỗ": "ỗ", "ȯ": "ȯ", "ȱ": "ȱ", "ő": "ő", "ṕ": "ṕ", "ṗ": "ṗ", "ŕ": "ŕ", "ř": "ř", "ṙ": "ṙ", "ś": "ś", "ṥ": "ṥ", "š": "š", "ṧ": "ṧ", "ŝ": "ŝ", "ṡ": "ṡ", "ẗ": "ẗ", "ť": "ť", "ṫ": "ṫ", "ú": "ú", "ù": "ù", "ü": "ü", "ǘ": "ǘ", "ǜ": "ǜ", "ǖ": "ǖ", "ǚ": "ǚ", "ũ": "ũ", "ṹ": "ṹ", "ū": "ū", "ṻ": "ṻ", "ŭ": "ŭ", "ǔ": "ǔ", "û": "û", "ů": "ů", "ű": "ű", "ṽ": "ṽ", "ẃ": "ẃ", "ẁ": "ẁ", "ẅ": "ẅ", "ŵ": "ŵ", "ẇ": "ẇ", "ẘ": "ẘ", "ẍ": "ẍ", "ẋ": "ẋ", "ý": "ý", "ỳ": "ỳ", "ÿ": "ÿ", "ỹ": "ỹ", "ȳ": "ȳ", "ŷ": "ŷ", "ẏ": "ẏ", "ẙ": "ẙ", "ź": "ź", "ž": "ž", "ẑ": "ẑ", "ż": "ż", "Á": "Á", "À": "À", "Ä": "Ä", "Ǟ": "Ǟ", "Ã": "Ã", "Ā": "Ā", "Ă": "Ă", "Ắ": "Ắ", "Ằ": "Ằ", "Ẵ": "Ẵ", "Ǎ": "Ǎ", "Â": "Â", "Ấ": "Ấ", "Ầ": "Ầ", "Ẫ": "Ẫ", "Ȧ": "Ȧ", "Ǡ": "Ǡ", "Å": "Å", "Ǻ": "Ǻ", "Ḃ": "Ḃ", "Ć": "Ć", "Č": "Č", "Ĉ": "Ĉ", "Ċ": "Ċ", "Ď": "Ď", "Ḋ": "Ḋ", "É": "É", "È": "È", "Ë": "Ë", "Ẽ": "Ẽ", "Ē": "Ē", "Ḗ": "Ḗ", "Ḕ": "Ḕ", "Ĕ": "Ĕ", "Ě": "Ě", "Ê": "Ê", "Ế": "Ế", "Ề": "Ề", "Ễ": "Ễ", "Ė": "Ė", "Ḟ": "Ḟ", "Ǵ": "Ǵ", "Ḡ": "Ḡ", "Ğ": "Ğ", "Ǧ": "Ǧ", "Ĝ": "Ĝ", "Ġ": "Ġ", "Ḧ": "Ḧ", "Ȟ": "Ȟ", "Ĥ": "Ĥ", "Ḣ": "Ḣ", "Í": "Í", "Ì": "Ì", "Ï": "Ï", "Ḯ": "Ḯ", "Ĩ": "Ĩ", "Ī": "Ī", "Ĭ": "Ĭ", "Ǐ": "Ǐ", "Î": "Î", "İ": "İ", "Ĵ": "Ĵ", "Ḱ": "Ḱ", "Ǩ": "Ǩ", "Ĺ": "Ĺ", "Ľ": "Ľ", "Ḿ": "Ḿ", "Ṁ": "Ṁ", "Ń": "Ń", "Ǹ": "Ǹ", "Ñ": "Ñ", "Ň": "Ň", "Ṅ": "Ṅ", "Ó": "Ó", "Ò": "Ò", "Ö": "Ö", "Ȫ": "Ȫ", "Õ": "Õ", "Ṍ": "Ṍ", "Ṏ": "Ṏ", "Ȭ": "Ȭ", "Ō": "Ō", "Ṓ": "Ṓ", "Ṑ": "Ṑ", "Ŏ": "Ŏ", "Ǒ": "Ǒ", "Ô": "Ô", "Ố": "Ố", "Ồ": "Ồ", "Ỗ": "Ỗ", "Ȯ": "Ȯ", "Ȱ": "Ȱ", "Ő": "Ő", "Ṕ": "Ṕ", "Ṗ": "Ṗ", "Ŕ": "Ŕ", "Ř": "Ř", "Ṙ": "Ṙ", "Ś": "Ś", "Ṥ": "Ṥ", "Š": "Š", "Ṧ": "Ṧ", "Ŝ": "Ŝ", "Ṡ": "Ṡ", "Ť": "Ť", "Ṫ": "Ṫ", "Ú": "Ú", "Ù": "Ù", "Ü": "Ü", "Ǘ": "Ǘ", "Ǜ": "Ǜ", "Ǖ": "Ǖ", "Ǚ": "Ǚ", "Ũ": "Ũ", "Ṹ": "Ṹ", "Ū": "Ū", "Ṻ": "Ṻ", "Ŭ": "Ŭ", "Ǔ": "Ǔ", "Û": "Û", "Ů": "Ů", "Ű": "Ű", "Ṽ": "Ṽ", "Ẃ": "Ẃ", "Ẁ": "Ẁ", "Ẅ": "Ẅ", "Ŵ": "Ŵ", "Ẇ": "Ẇ", "Ẍ": "Ẍ", "Ẋ": "Ẋ", "Ý": "Ý", "Ỳ": "Ỳ", "Ÿ": "Ÿ", "Ỹ": "Ỹ", "Ȳ": "Ȳ", "Ŷ": "Ŷ", "Ẏ": "Ẏ", "Ź": "Ź", "Ž": "Ž", "Ẑ": "Ẑ", "Ż": "Ż", "ά": "ά", "ὰ": "ὰ", "ᾱ": "ᾱ", "ᾰ": "ᾰ", "έ": "έ", "ὲ": "ὲ", "ή": "ή", "ὴ": "ὴ", "ί": "ί", "ὶ": "ὶ", "ϊ": "ϊ", "ΐ": "ΐ", "ῒ": "ῒ", "ῑ": "ῑ", "ῐ": "ῐ", "ό": "ό", "ὸ": "ὸ", "ύ": "ύ", "ὺ": "ὺ", "ϋ": "ϋ", "ΰ": "ΰ", "ῢ": "ῢ", "ῡ": "ῡ", "ῠ": "ῠ", "ώ": "ώ", "ὼ": "ὼ", "Ύ": "Ύ", "Ὺ": "Ὺ", "Ϋ": "Ϋ", "Ῡ": "Ῡ", "Ῠ": "Ῠ", "Ώ": "Ώ", "Ὼ": "Ὼ" };
class ju {
  constructor(e6, t2) {
    this.mode = void 0, this.gullet = void 0, this.settings = void 0, this.leftrightDepth = void 0, this.nextToken = void 0, this.mode = "math", this.gullet = new Vu(e6, t2, this.mode), this.settings = t2, this.leftrightDepth = 0;
  }
  expect(e6, t2) {
    if (void 0 === t2 && (t2 = true), this.fetch().text !== e6) throw new io("Expected '" + e6 + "', got '" + this.fetch().text + "'", this.fetch());
    t2 && this.consume();
  }
  consume() {
    this.nextToken = null;
  }
  fetch() {
    return null == this.nextToken && (this.nextToken = this.gullet.expandNextToken()), this.nextToken;
  }
  switchMode(e6) {
    this.mode = e6, this.gullet.switchMode(e6);
  }
  parse() {
    this.settings.globalGroup || this.gullet.beginGroup(), this.settings.colorIsTextColor && this.gullet.macros.set("\\color", "\\textcolor");
    var e6 = this.parseExpression(false);
    return this.expect("EOF"), this.settings.globalGroup || this.gullet.endGroup(), e6;
  }
  parseExpression(e6, t2) {
    for (var r2 = []; ; ) {
      "math" === this.mode && this.consumeSpaces();
      var n2 = this.fetch();
      if (-1 !== ju.endOfExpression.indexOf(n2.text)) break;
      if (t2 && n2.text === t2) break;
      if (e6 && Eu[n2.text] && Eu[n2.text].infix) break;
      var i2 = this.parseAtom(t2);
      if (!i2) break;
      "internal" !== i2.type && r2.push(i2);
    }
    return "text" === this.mode && this.formLigatures(r2), this.handleInfixNodes(r2);
  }
  handleInfixNodes(e6) {
    for (var t2, r2 = -1, n2 = 0; n2 < e6.length; n2++) if ("infix" === e6[n2].type) {
      if (-1 !== r2) throw new io("only one infix operator per group", e6[n2].token);
      r2 = n2, t2 = e6[n2].replaceWith;
    }
    if (-1 !== r2 && t2) {
      var i2, o2, a2 = e6.slice(0, r2), s2 = e6.slice(r2 + 1);
      return i2 = 1 === a2.length && "ordgroup" === a2[0].type ? a2[0] : { type: "ordgroup", mode: this.mode, body: a2 }, o2 = 1 === s2.length && "ordgroup" === s2[0].type ? s2[0] : { type: "ordgroup", mode: this.mode, body: s2 }, ["\\\\abovefrac" === t2 ? this.callFunction(t2, [i2, e6[r2], o2], []) : this.callFunction(t2, [i2, o2], [])];
    }
    return e6;
  }
  handleSupSubscript(e6) {
    var t2 = this.fetch(), r2 = t2.text;
    this.consume(), this.consumeSpaces();
    var n2 = this.parseGroup(e6);
    if (!n2) throw new io("Expected group after '" + r2 + "'", t2);
    return n2;
  }
  formatUnsupportedCmd(e6) {
    for (var t2 = [], r2 = 0; r2 < e6.length; r2++) t2.push({ type: "textord", mode: "text", text: e6[r2] });
    var n2 = { type: "text", mode: this.mode, body: t2 };
    return { type: "color", mode: this.mode, color: this.settings.errorColor, body: [n2] };
  }
  parseAtom(e6) {
    var t2, r2, n2 = this.parseGroup("atom", e6);
    if ("text" === this.mode) return n2;
    for (; ; ) {
      this.consumeSpaces();
      var i2 = this.fetch();
      if ("\\limits" === i2.text || "\\nolimits" === i2.text) {
        if (n2 && "op" === n2.type) {
          var o2 = "\\limits" === i2.text;
          n2.limits = o2, n2.alwaysHandleSupSub = true;
        } else {
          if (!n2 || "operatorname" !== n2.type) throw new io("Limit controls must follow a math operator", i2);
          n2.alwaysHandleSupSub && (n2.limits = "\\limits" === i2.text);
        }
        this.consume();
      } else if ("^" === i2.text) {
        if (t2) throw new io("Double superscript", i2);
        t2 = this.handleSupSubscript("superscript");
      } else if ("_" === i2.text) {
        if (r2) throw new io("Double subscript", i2);
        r2 = this.handleSupSubscript("subscript");
      } else {
        if ("'" !== i2.text) break;
        if (t2) throw new io("Double superscript", i2);
        var a2 = { type: "textord", mode: this.mode, text: "\\prime" }, s2 = [a2];
        for (this.consume(); "'" === this.fetch().text; ) s2.push(a2), this.consume();
        "^" === this.fetch().text && s2.push(this.handleSupSubscript("superscript")), t2 = { type: "ordgroup", mode: this.mode, body: s2 };
      }
    }
    return t2 || r2 ? { type: "supsub", mode: this.mode, base: n2, sup: t2, sub: r2 } : n2;
  }
  parseFunction(e6, t2) {
    var r2 = this.fetch(), n2 = r2.text, i2 = Eu[n2];
    if (!i2) return null;
    if (this.consume(), t2 && "atom" !== t2 && !i2.allowedInArgument) throw new io("Got function '" + n2 + "' with no arguments" + (t2 ? " as " + t2 : ""), r2);
    if ("text" === this.mode && !i2.allowedInText) throw new io("Can't use function '" + n2 + "' in text mode", r2);
    if ("math" === this.mode && false === i2.allowedInMath) throw new io("Can't use function '" + n2 + "' in math mode", r2);
    var { args: o2, optArgs: a2 } = this.parseArguments(n2, i2);
    return this.callFunction(n2, o2, a2, r2, e6);
  }
  callFunction(e6, t2, r2, n2, i2) {
    var o2 = { funcName: e6, parser: this, token: n2, breakOnTokenText: i2 }, a2 = Eu[e6];
    if (a2 && a2.handler) return a2.handler(o2, t2, r2);
    throw new io("No function handler for " + e6);
  }
  parseArguments(e6, t2) {
    var r2 = t2.numArgs + t2.numOptionalArgs;
    if (0 === r2) return { args: [], optArgs: [] };
    for (var n2 = [], i2 = [], o2 = 0; o2 < r2; o2++) {
      var a2 = t2.argTypes && t2.argTypes[o2], s2 = o2 < t2.numOptionalArgs;
      (t2.primitive && null == a2 || "sqrt" === t2.type && 1 === o2 && null == i2[0]) && (a2 = "primitive");
      var l2 = this.parseGroupOfType("argument to '" + e6 + "'", a2, s2);
      if (s2) i2.push(l2);
      else {
        if (null == l2) throw new io("Null argument, please report this as a bug");
        n2.push(l2);
      }
    }
    return { args: n2, optArgs: i2 };
  }
  parseGroupOfType(e6, t2, r2) {
    switch (t2) {
      case "color":
        return this.parseColorGroup(r2);
      case "size":
        return this.parseSizeGroup(r2);
      case "url":
        return this.parseUrlGroup(r2);
      case "math":
      case "text":
        return this.parseArgumentGroup(r2, t2);
      case "hbox":
        var n2 = this.parseArgumentGroup(r2, "text");
        return null != n2 ? { type: "styling", mode: n2.mode, body: [n2], style: "text" } : null;
      case "raw":
        var i2 = this.parseStringGroup("raw", r2);
        return null != i2 ? { type: "raw", mode: "text", string: i2.text } : null;
      case "primitive":
        if (r2) throw new io("A primitive argument cannot be optional");
        var o2 = this.parseGroup(e6);
        if (null == o2) throw new io("Expected group as " + e6, this.fetch());
        return o2;
      case "original":
      case null:
      case void 0:
        return this.parseArgumentGroup(r2);
      default:
        throw new io("Unknown group type as " + e6, this.fetch());
    }
  }
  consumeSpaces() {
    for (; " " === this.fetch().text; ) this.consume();
  }
  parseStringGroup(e6, t2) {
    var r2 = this.gullet.scanArgument(t2);
    if (null == r2) return null;
    for (var n2, i2 = ""; "EOF" !== (n2 = this.fetch()).text; ) i2 += n2.text, this.consume();
    return this.consume(), r2.text = i2, r2;
  }
  parseRegexGroup(e6, t2) {
    for (var r2, n2 = this.fetch(), i2 = n2, o2 = ""; "EOF" !== (r2 = this.fetch()).text && e6.test(o2 + r2.text); ) o2 += (i2 = r2).text, this.consume();
    if ("" === o2) throw new io("Invalid " + t2 + ": '" + n2.text + "'", n2);
    return n2.range(i2, o2);
  }
  parseColorGroup(e6) {
    var t2 = this.parseStringGroup("color", e6);
    if (null == t2) return null;
    var r2 = /^(#[a-f0-9]{3}|#?[a-f0-9]{6}|[a-z]+)$/i.exec(t2.text);
    if (!r2) throw new io("Invalid color: '" + t2.text + "'", t2);
    var n2 = r2[0];
    return /^[0-9a-f]{6}$/i.test(n2) && (n2 = "#" + n2), { type: "color-token", mode: this.mode, color: n2 };
  }
  parseSizeGroup(e6) {
    var t2, r2 = false;
    if (this.gullet.consumeSpaces(), !(t2 = e6 || "{" === this.gullet.future().text ? this.parseStringGroup("size", e6) : this.parseRegexGroup(/^[-+]? *(?:$|\d+|\d+\.\d*|\.\d*) *[a-z]{0,2} *$/, "size"))) return null;
    e6 || 0 !== t2.text.length || (t2.text = "0pt", r2 = true);
    var n2 = /([-+]?) *(\d+(?:\.\d*)?|\.\d+) *([a-z]{2})/.exec(t2.text);
    if (!n2) throw new io("Invalid size: '" + t2.text + "'", t2);
    var i2 = { number: +(n2[1] + n2[2]), unit: n2[3] };
    if (!Oa(i2)) throw new io("Invalid unit: '" + i2.unit + "'", t2);
    return { type: "size", mode: this.mode, value: i2, isBlank: r2 };
  }
  parseUrlGroup(e6) {
    this.gullet.lexer.setCatcode("%", 13), this.gullet.lexer.setCatcode("~", 12);
    var t2 = this.parseStringGroup("url", e6);
    if (this.gullet.lexer.setCatcode("%", 14), this.gullet.lexer.setCatcode("~", 13), null == t2) return null;
    var r2 = t2.text.replace(/\\([#$%&~_^{}])/g, "$1");
    return { type: "url", mode: this.mode, url: r2 };
  }
  parseArgumentGroup(e6, t2) {
    var r2 = this.gullet.scanArgument(e6);
    if (null == r2) return null;
    var n2 = this.mode;
    t2 && this.switchMode(t2), this.gullet.beginGroup();
    var i2 = this.parseExpression(false, "EOF");
    this.expect("EOF"), this.gullet.endGroup();
    var o2 = { type: "ordgroup", mode: this.mode, loc: r2.loc, body: i2 };
    return t2 && this.switchMode(n2), o2;
  }
  parseGroup(e6, t2) {
    var r2, n2 = this.fetch(), i2 = n2.text;
    if ("{" === i2 || "\\begingroup" === i2) {
      this.consume();
      var o2 = "{" === i2 ? "}" : "\\endgroup";
      this.gullet.beginGroup();
      var a2 = this.parseExpression(false, o2), s2 = this.fetch();
      this.expect(o2), this.gullet.endGroup(), r2 = { type: "ordgroup", mode: this.mode, loc: ro.range(n2, s2), body: a2, semisimple: "\\begingroup" === i2 || void 0 };
    } else if (null == (r2 = this.parseFunction(t2, e6) || this.parseSymbol()) && "\\" === i2[0] && !Hu.hasOwnProperty(i2)) {
      if (this.settings.throwOnError) throw new io("Undefined control sequence: " + i2, n2);
      r2 = this.formatUnsupportedCmd(i2), this.consume();
    }
    return r2;
  }
  formLigatures(e6) {
    for (var t2 = e6.length - 1, r2 = 0; r2 < t2; ++r2) {
      var n2 = e6[r2], i2 = n2.text;
      "-" === i2 && "-" === e6[r2 + 1].text && (r2 + 1 < t2 && "-" === e6[r2 + 2].text ? (e6.splice(r2, 3, { type: "textord", mode: "text", loc: ro.range(n2, e6[r2 + 2]), text: "---" }), t2 -= 2) : (e6.splice(r2, 2, { type: "textord", mode: "text", loc: ro.range(n2, e6[r2 + 1]), text: "--" }), t2 -= 1)), "'" !== i2 && "`" !== i2 || e6[r2 + 1].text !== i2 || (e6.splice(r2, 2, { type: "textord", mode: "text", loc: ro.range(n2, e6[r2 + 1]), text: i2 + i2 }), t2 -= 1);
    }
  }
  parseSymbol() {
    var e6 = this.fetch(), t2 = e6.text;
    if (/^\\verb[^a-zA-Z]/.test(t2)) {
      this.consume();
      var r2 = t2.slice(5), n2 = "*" === r2.charAt(0);
      if (n2 && (r2 = r2.slice(1)), r2.length < 2 || r2.charAt(0) !== r2.slice(-1)) throw new io("\\verb assertion failed --\n                    please report what input caused this bug");
      return { type: "verb", mode: "text", body: r2 = r2.slice(1, -1), star: n2 };
    }
    Pu.hasOwnProperty(t2[0]) && !Xo[this.mode][t2[0]] && (this.settings.strict && "math" === this.mode && this.settings.reportNonstrict("unicodeTextInMathMode", 'Accented Unicode text character "' + t2[0] + '" used in math mode', e6), t2 = Pu[t2[0]] + t2.substr(1));
    var i2, o2 = Nu.exec(t2);
    if (o2 && ("i" === (t2 = t2.substring(0, o2.index)) ? t2 = "ı" : "j" === t2 && (t2 = "ȷ")), Xo[this.mode][t2]) {
      this.settings.strict && "math" === this.mode && Sa.indexOf(t2) >= 0 && this.settings.reportNonstrict("unicodeTextInMathMode", 'Latin-1/Unicode text character "' + t2[0] + '" used in math mode', e6);
      var a2, s2 = Xo[this.mode][t2].group, l2 = ro.range(e6);
      if (Uo.hasOwnProperty(s2)) {
        var u2 = s2;
        a2 = { type: "atom", mode: this.mode, family: u2, loc: l2, text: t2 };
      } else a2 = { type: s2, mode: this.mode, loc: l2, text: t2 };
      i2 = a2;
    } else {
      if (!(t2.charCodeAt(0) >= 128)) return null;
      this.settings.strict && (Ao(t2.charCodeAt(0)) ? "math" === this.mode && this.settings.reportNonstrict("unicodeTextInMathMode", 'Unicode text character "' + t2[0] + '" used in math mode', e6) : this.settings.reportNonstrict("unknownSymbol", 'Unrecognized Unicode character "' + t2[0] + '" (' + t2.charCodeAt(0) + ")", e6)), i2 = { type: "textord", mode: "text", loc: ro.range(e6), text: t2 };
    }
    if (this.consume(), o2) for (var c2 = 0; c2 < o2[0].length; c2++) {
      var h2 = o2[0][c2];
      if (!Iu[h2]) throw new io("Unknown accent ' " + h2 + "'", e6);
      var p2 = Iu[h2][this.mode];
      if (!p2) throw new io("Accent " + h2 + " unsupported in " + this.mode + " mode", e6);
      i2 = { type: "accent", mode: this.mode, loc: ro.range(e6), label: p2, isStretchy: false, isShifty: true, base: i2 };
    }
    return i2;
  }
}
ju.endOfExpression = ["}", "\\endgroup", "\\end", "\\right", "&"];
var Gu = function(e6, t2) {
  if (!("string" == typeof e6 || e6 instanceof String)) throw new TypeError("KaTeX can only parse string typed expression");
  var r2 = new ju(e6, t2);
  delete r2.gullet.macros.current["\\df@tag"];
  var n2 = r2.parse();
  if (delete r2.gullet.macros.current["\\current@color"], delete r2.gullet.macros.current["\\color"], r2.gullet.macros.get("\\df@tag")) {
    if (!t2.displayMode) throw new io("\\tag works only in display equations");
    r2.gullet.feed("\\df@tag"), n2 = [{ type: "tag", mode: "text", body: n2, tag: r2.parse() }];
  }
  return n2;
}, Uu = function(e6, t2, r2) {
  t2.textContent = "";
  var n2 = Xu(e6, r2).toNode();
  t2.appendChild(n2);
};
"undefined" != typeof document && "CSS1Compat" !== document.compatMode && ("undefined" != typeof console && console.warn("Warning: KaTeX doesn't work in quirks mode. Make sure your website has a suitable doctype."), Uu = function() {
  throw new io("KaTeX doesn't work in quirks mode.");
});
var Yu = function(e6, t2, r2) {
  if (r2.throwOnError || !(e6 instanceof io)) throw e6;
  var n2 = Wa.makeSpan(["katex-error"], [new No(t2)]);
  return n2.setAttribute("title", e6.toString()), n2.setAttribute("style", "color:" + r2.errorColor), n2;
}, Xu = function(e6, t2) {
  var r2 = new co(t2);
  try {
    return (function(e7, t3, r3) {
      var n2, i2 = Ds(r3);
      if ("mathml" === r3.output) return Es(e7, t3, i2, r3.displayMode, true);
      if ("html" === r3.output) {
        var o2 = xs(e7, i2);
        n2 = Wa.makeSpan(["katex"], [o2]);
      } else {
        var a2 = Es(e7, t3, i2, r3.displayMode, false), s2 = xs(e7, i2);
        n2 = Wa.makeSpan(["katex"], [a2, s2]);
      }
      return Ls(n2, r3);
    })(Gu(e6, r2), e6, r2);
  } catch (t3) {
    return Yu(t3, e6, r2);
  }
}, Wu = { version: "0.13.13", render: Uu, renderToString: function(e6, t2) {
  return Xu(e6, t2).toMarkup();
}, ParseError: io, __parse: function(e6, t2) {
  var r2 = new co(t2);
  return Gu(e6, r2);
}, __renderToDomTree: Xu, __renderToHTMLTree: function(e6, t2) {
  var r2 = new co(t2);
  try {
    return (function(e7, t3, r3) {
      var n2 = xs(e7, Ds(r3)), i2 = Wa.makeSpan(["katex"], [n2]);
      return Ls(i2, r3);
    })(Gu(e6, r2), 0, r2);
  } catch (t3) {
    return Yu(t3, e6, r2);
  }
}, __setFontMetrics: function(e6, t2) {
  Vo[e6] = t2;
}, __defineSymbol: Wo, __defineMacro: pu, __domTree: { Span: Eo, Anchor: Do, SymbolNode: No, SvgNode: Oo, PathNode: Fo, LineNode: Ro } };
function $u(e6) {
  var t2 = [], r2 = 0;
  if (this.trie = this.createTrie(e6.patterns), this.leftMin = e6.leftmin, this.rightMin = e6.rightmin, this.exceptions = {}, e6.exceptions) for (t2 = e6.exceptions.split(/,\s?/g); r2 < t2.length; r2 += 1) this.exceptions[t2[r2].replace(/\u2027/g, "").toLowerCase()] = new RegExp("(" + t2[r2].split("‧").join(")(") + ")", "i");
}
$u.TrieNode, $u.prototype.createTrie = function(e6) {
  var t2, r2 = 0, n2 = 0, i2 = 0, o2 = 0, a2 = null, s2 = null, l2 = null, u2 = null, c2 = { _points: [] };
  for (r2 in e6) if (e6.hasOwnProperty(r2)) for (t2 = e6[r2].match(new RegExp(".{1," + +r2 + "}", "g")), n2 = 0; n2 < t2.length; n2 += 1) {
    for (a2 = t2[n2].replace(/[0-9]/g, "").split(""), s2 = t2[n2].split(/\D/), u2 = c2, i2 = 0; i2 < a2.length; i2 += 1) u2[l2 = a2[i2].charCodeAt(0)] || (u2[l2] = {}), u2 = u2[l2];
    for (u2._points = [], o2 = 0; o2 < s2.length; o2 += 1) u2._points[o2] = s2[o2] || 0;
  }
  return c2;
}, $u.prototype.hyphenateText = function(e6, t2) {
  t2 = t2 || 4;
  for (var r2 = e6.split(/([a-zA-Z0-9_\u0027\u00AD\u00DF-\u00EA\u00EB\u00EC-\u00EF\u00F1-\u00F6\u00F8-\u00FD\u0101\u0103\u0105\u0107\u0109\u010D\u010F\u0111\u0113\u0117\u0119\u011B\u011D\u011F\u0123\u0125\u012B\u012F\u0131\u0135\u0137\u013C\u013E\u0142\u0144\u0146\u0148\u0151\u0153\u0155\u0159\u015B\u015D\u015F\u0161\u0165\u016B\u016D\u016F\u0171\u0173\u017A\u017C\u017E\u017F\u0219\u021B\u02BC\u0390\u03AC-\u03CE\u03F2\u0401\u0410-\u044F\u0451\u0454\u0456\u0457\u045E\u0491\u0531-\u0556\u0561-\u0587\u0902\u0903\u0905-\u090B\u090E-\u0910\u0912\u0914-\u0928\u092A-\u0939\u093E-\u0943\u0946-\u0948\u094A-\u094D\u0982\u0983\u0985-\u098B\u098F\u0990\u0994-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BE-\u09C3\u09C7\u09C8\u09CB-\u09CD\u09D7\u0A02\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A14-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A82\u0A83\u0A85-\u0A8B\u0A8F\u0A90\u0A94-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABE-\u0AC3\u0AC7\u0AC8\u0ACB-\u0ACD\u0B02\u0B03\u0B05-\u0B0B\u0B0F\u0B10\u0B14-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3E-\u0B43\u0B47\u0B48\u0B4B-\u0B4D\u0B57\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB5\u0BB7-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C02\u0C03\u0C05-\u0C0B\u0C0E-\u0C10\u0C12\u0C14-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3E-\u0C43\u0C46-\u0C48\u0C4A-\u0C4D\u0C82\u0C83\u0C85-\u0C8B\u0C8E-\u0C90\u0C92\u0C94-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBE-\u0CC3\u0CC6-\u0CC8\u0CCA-\u0CCD\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D28\u0D2A-\u0D39\u0D3E-\u0D43\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D60\u0D61\u0D7A-\u0D7F\u1F00-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB2-\u1FB4\u1FB6\u1FB7\u1FBD\u1FBF\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD2\u1FD3\u1FD6\u1FD7\u1FE2-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u200D\u2019]+)/gi), n2 = 0; n2 < r2.length; n2 += 1) -1 !== r2[n2].indexOf("/") ? 0 === n2 || n2 === r2.length - 1 || /\s+\/|\/\s+/.test(r2[n2]) || (r2[n2] += "​") : r2[n2].length > t2 && (r2[n2] = this.hyphenate(r2[n2]).join("­"));
  return r2.join("");
}, $u.prototype.hyphenate = function(e6) {
  var t2, r2, n2, i2, o2, a2, s2, l2, u2, c2 = [], h2 = [], p2 = e6.toLowerCase(), d2 = Math.max, m2 = this.trie, g2 = [""];
  if (this.exceptions.hasOwnProperty(p2)) return e6.match(this.exceptions[p2]).slice(1);
  if (-1 !== e6.indexOf("­")) return [e6];
  for (t2 = (e6 = "_" + e6 + "_").toLowerCase().split(""), r2 = e6.split(""), s2 = t2.length, n2 = 0; n2 < s2; n2 += 1) h2[n2] = 0, c2[n2] = t2[n2].charCodeAt(0);
  for (n2 = 0; n2 < s2; n2 += 1) for (a2 = m2, i2 = n2; i2 < s2 && (a2 = a2[c2[i2]]); i2 += 1) if (l2 = a2._points) for (o2 = 0, u2 = l2.length; o2 < u2; o2 += 1) h2[n2 + o2] = d2(h2[n2 + o2], l2[o2]);
  for (n2 = 1; n2 < s2 - 1; n2 += 1) n2 > this.leftMin && n2 < s2 - this.rightMin && h2[n2] % 2 ? g2.push(r2[n2]) : g2[g2.length - 1] += r2[n2];
  return g2;
};
var Zu = t($u), Ju = t({ id: ["en-us", "en"], leftmin: 2, rightmin: 3, patterns: { 3: "x1qei2e1je1f1to2tlou2w3c1tue1q4tvtw41tyo1q4tz4tcd2yd1wd1v1du1ta4eu1pas4y1droo2d1psw24sv1dod1m1fad1j1su4fdo2n4fh1fi4fm4fn1fopd42ft3fu1fy1ga2sss1ru5jd5cd1bg3bgd44uk2ok1cyo5jgl2g1m4pf4pg1gog3p1gr1soc1qgs2oi2g3w1gysk21coc5nh1bck1h1fh1h4hk1zo1ci4zms2hh1w2ch5zl2idc3c2us2igi3hi3j4ik1cab1vsa22btr1w4bp2io2ipu3u4irbk4b1j1va2ze2bf4oar1p4nz4zbi1u2iv4iy5ja1jeza1y1wk1bk3fkh4k1ikk4k1lk1mk5tk1w2ldr1mn1t2lfr1lr3j4ljl1l2lm2lp4ltn1rrh4v4yn1q1ly1maw1brg2r1fwi24ao2mhw4kr1cw5p4mkm1m1mo4wtwy4x1ar1ba2nn5mx1ex1h4mtx3i1muqu2p3wx3o4mwa1jx3p1naai2x1ua2fxx4y1ba2dn1jy1cn3fpr2y1dy1i", 4: "4dryn2itni4on1inn1im_up3nik4ni4dy5giye4tyes4_ye44ab_nhe4nha4abe2n2gyn1guy1ery5eep2pe4abry3lay3lone4wne4v1nesy3chn1erne2q3neo1nenp2seps4hy2cey5lu2nedne2cyme44nk2y5at2adine2b2ne_y5ac2p1tp2ten1den1cun1cryn5dp2th4adup4twpub3ae4rxu3ayn5gaff4pue4n2au4p1ppuf4n2atag1ipu4mag1na2gon4asx3tix1t2pu2na4gya3haa3heah4la3ho_ti2a5ian2an5puspu2tnak4_th2n1kl_te4_ta4mu4u4mupmun23mum2alex4ob_sy25ynxal1i_st4y1o4xi5cxi5a4alm_si2_sh2m5sixhu4m4sh4m3r4amam2py2rabm2pixhi2yo5dr2ai4m1pmo2vmos2x2edmo2r4n1la2mor2asx3c2xas5yom4x4apxam3nme44mokrbi2nne44andy4osp4ot3noemn4omn4a4m1n4nog4m1l2angws4l1posw3shwri4wra4yp3iwom11wo2m2izrb4ow4nopo4pr2cem2isrd2iano4mig4y3pomi3awiz55mi_no4n4m1fme4v2re_wir42mes1menme2mme2gre1o2med4me_4nop4m5c4m1bwil21noureu2whi4w3ev4maprev2w1era2plpo4crfu4r4fyy5pu2maha3pu2mab2a2rn1p4npi44lyb4lya2p3nwam42l1w1lut4luplu3or1glluf4lu5a2wacltu2y3rol1tr4vv4r3guyr4rl1te4rh_nru4ar1il2sel4sc4l1rl5prl4plys4c4lovri3ar4ib4lof3lo_ar2par3q_os3ll4oll2i4as_ri1o3vokl2levoi44p1mlka35vo_ns4cas4ll1izr4iqr2is3vivl1it3lika2tan2sen2slrle42l3hlgo3l5gal5frns3mvi4p3ley_od2r2meles24athr4myle2al3drv1inldi4l2de2vilnt2il3civik4lce42l1b4lavv3ifrno4r3nua1trr2ocnt4sy4sok4syks4la2tuk4sck3ouko5ryss4a2tyau4b4klyys1tnu1akis4au3rki4pro4ek4ima2va5ki_nu4dn4umn3uokes4k1erav1irok2ke4g1keek2ed_me2aw3ikal4aws4k5agk3ab3ka_aye4ays4veg3jo4p5ba_4vedjew3n1v24ve_ja4pzar23vatizi4n1w41batba4z2b1bb2beix4o4i5w4b1d4be_rox5nym4nyp4n3za4ittr3por1r4i1ti1bel2ith2itei2su4rs2r1sars4cr2seis1p3betvag4i2sor1shbe3wr1sioad34b3hbi2bbi4d3bie3isf4ise2is_1bilr1sp5va_r5sw_le2uz4eir1ibi2tuxu3r1tiu1v2i1raze4nze4pb2l2uu4mo1biip3iz1eripe4b4louts44b1m4b3no3br3bodi4osbo4eru3aio4mi1ol4io_3booo1ce4inyin1u2insru2n2inn4inl4inkrv4e2inioch42iner3vo4indpi2np4idbt4lb4tob3trry4cry3t2in_o4elbu4ni2muim1i5saiil3v4ilnil1iil5fs1apo3er4b5w5by_bys4_in1sau4i1lazet4u2suo3ev2z1ii2go4igius1p5saw4s5bo2fi4ifti3fl4if_i3etsch2usc22ie4i2dui4dri2diid5dpi3au3ruz4ils1cuz4is4s5d4se_se4a2ce_2ici4ich3ceii1bri5bo1ceni1blse2g5seiibe43cepi2aniam4ur2li2al2i1acet4hy2scew41phy4ch_5phuhu4thu4gche2h4tyh4shur1durc44hr44h5p5sev5sexu1ra4s3fup3p2s3gph3t2sh_ho4g2h1n_he23ciau3pl4h1mci5ch2lozo4m4ciihi2vhi4p2cim2cin4phsu1peu1ouo1geu5osheu4sho4he4th1es4shwun5zun5ysi1bunu45cizo4glck3ihep5he2nh4ed1sioph2l5hazsi2rcly4zte4_ge21siscoe22cog5siu1siv5siz_ga24skes1l2s2leha4m2s1ms3ma1ogyo1h2u1ni3gus3gun2guegu4acov1gth3_eu3g4ros1n4_es3u2nez4zyum2pu1mi3som_ev2oig4cri2gov15goos4opgon2ul5v5goeu3lugob53go_2c1t4ph_g1nog1nic2te4sov4ulsgn4ag4myc4twcud5c4ufc4uipe2t3glo1gleul2igla4_eg23giz3cun5givgi4u3gir5gio1cusul4e2spagil4g1ic5gi__eb4cze41d2a5da_u1laggo44daf2dagg2gege4v1geo1gen2ged3dato1la2ge_ol2dol2i5daypek4p4eed1d42de_4gazol2tuiv3ol2vo2lys1sa2gamgaf4o2meui4n2ui2pe2cd4em4fugi4jku3fl3ufaf2tyf4to1denu4du4pe_2f3sfri2de1ps1si4f5pfos5d3eqs4sls4snfo2rss2tdes25fon4p1b_ci23payss5w2st_de1tf4l2de1v2fin4dey4d1fd4gast2idg1id2gyd1h25di_ud5dfi3au4cy_ch4pav43didu3cud1iff2fyu3crd1inst4r4f1ffev4fer11dio2fedfe4bdir2s2ty4fe_dis1on1au3ca4f5bon1c2ondd5k25far4fagpa1peys45eyc1exps4ul2dlyp4ale3whon3s3do_e1wa5doee5vud4oge1visu2msu2nub4euav4su2rp4ai6rk_d4or3dosu1atdo4v3doxp4adoo4k4swoo2padre4eus4e3upe5un2ophet5z4syc3syl4y3hoy1ads4pd4swd4syd2tho4wo3ta_du2c4etn2tabta2luac4es4wdu4g2ess4uabdu4n4duptav4st5bow1io1pr5dyn2tawe1sp2t1bop1uead1tz4et4chopy5ea4l4t1d4te_2tyle1si4esh1tee4tyat1cr4twoteg4es2c4eru1teoer1s2eroea2tte4po1rat1wh3tusea2v3teu3texer1i2e1ber1h4tey2t1f4t1ge3br2th_th2e4thle1ce3tumec2i2ths2erb1tia4tueer1aou5vtud2tif22tige1potu1aou4lttu41timt5toos4le1cre2pat4swe5owe1cue4ottsh4eos4e1ort4sce3ol4edieo2ge5of1tio4eno4enn5tiq4edoti4u1tive3my1tiz4othee2ct5laee2ft5lo4t1mee2mtme4e1meem5bcoi4to3be5exo1ry2tof1effel2iel2ftos24t1pe1la1traos2ceig2ei5de5ico2soe1h45egyeg5n", 5: "_ach4e4go_e4goseg1ule5gurtre5feg4iceher4eg5ibeger44egaltre4mei5gle3imbe3infe1ingtra3beir4deit3eei3the5ity5triae4jud3efiteki4nek4la2trime4la_e4lactri4v4toute4law5toure3leaefil45elece4ledto2rae5len4tonye1lestro3ve4fic4tonoto3mytom4bto2mato5ice5limto2gre3lioe2listru5i4todo4ellaee4tyello4e5locel5ogeest4el2shel4tae5ludel5uge4mace4mage5man2t1n2ee2s4ee4p1e2mele4metee4naemi4eee4lyeel3i3tled3tle_e4mistlan4eed3iem3iztrus4emo4gti3zaem3pie4mule4dulemu3ne4dritiv4aedon2e4dolti3tle5neae5neeen3emtis4pti5sotis4m3tisee3newti3sae5niee5nile3nioedi5zen3ite5niu5enized1ited3imeno4ge4nosen3oven4swti5oc4t1s2en3uaen5ufe3ny_4en3zed3ibe3diae4oi4ede4s3tini4ed3deo3ret2ina2e2dae4culeo4toe5outec4te4t3t2t4tes2t1ine5pel4timpe2corephe4e4plie2col5tigutu3arti5fytu4bie3pro3tienep4sh5tidie4putt4icoeci4t4tick2ti2bec3imera4bti4aber3ar4tuf45tu3ier4bler3che4cib2ere_4thooecca54thil3thet4thea3turethan4e4cade4bitere4qe4ben5turieret4tur5oeav5oeav5itu5ry4tess4tes_ter5ve1rio4eriter4iueri4v1terier3m4ter3cte5pe4t1waer3noeast3er5obe5rocero4rer1oue3assea5sp1tent4ertler3twtwis4eru4t3tende1s4a3tenc5telsear2te2scateli4e3scres5cue1s2ee2sec3tel_te5giear5kear4cte5diear3ae3sha2t1ede5ande2sice2sid5tecttece44teattype3ty5phesi4uea4gees4mie2sole3acte2sone1a4bdys5pdy4sedu4petaun4d3uleta5sytas4e4tare4tarctar4ata5pl2estrta5mo4talke2surtal3idu5eleta4bta5lae3teoua5naet1ic4taf4etin4ta5doe5tir4taciuan4id1ucad1u1ae3trae3tre2d1s2syn5ouar2d4drowet3uaet5ymdro4pdril4dri4b5dreneu3rouar3ieute44draieu5truar3te2vasdop4pe5veadoo3ddoni4u4belsum3iev1erdoli4do4laev3idevi4le4vinevi4ve5voc2d5ofdo5dee4wage5wee4d1n4ewil54d5lue3wit2d3lou3ber5eye_u1b4i3dledfa3blfab3rfa4ce3dle_fain4suit3su5issu2g34d5lasu4b3fa3tasu1al4fato1di1vd2iti5disiuci4bfeas4di1redi4pl4feca5fectdio5gfe3life4mofen2d4st3wuc4it5ferr5diniucle3f4fesf4fie4stry1dinaf4flydi3ge3dictd4icedia5bs4tops1tle5stirs3tifs4ties1ticfic4is5tias4ti_4ficsfi3cuud3ers3thefil5iste2w4filyudev45finas4tedfi2nes2talfin4ns2tagde2tode4suflin4u1dicf2ly5ud5isu5ditde1scd2es_der5sfon4tu4don5dermss4lid4erhfor4is4siede2pudepi4fra4tf5reade3pade3nufril4frol5ud4side3nou4eneuens4ug5infu5el5dem_s5setfu5nefu3rifusi4fus4s4futade5lode5if4dee_5gal_3galiga3lo2d1eds3selg5amos2s5cssas3u1ing4ganouir4mgass4gath3uita4deaf5dav5e5dav44dato4darygeez44spotspor4s4pon4gelydark5s4ply4spio4geno4genydard5ge3omg4ery5gesigeth54getoge4tydan3g4g1g2da2m2g3gergglu5dach4gh3inspil4gh4to4cutr1gi4agia5rula5bspho5g4icogien5s2pheulch42sperspa4n5spai3c4utu1lenul4gigir4lg3islcu5pycu3picu4mic3umecu2maso5vi5glasu5liagli4bg3lig5culiglo3r4ul3mctu4ru1l4og4na_c3terul1tig2ning4nio4ultug4noncta4b4c3s2cru4dul5ulsor5dgo3isum5absor5ccris4go3nic4rinson4gsona45gos_cri5fcre4vum4bi5credg4raigran25solvsoft3so4ceunat44graygre4nco5zi4gritcoz5egruf4cow5ag5stecove4cos4es5menun4ersmel44corbco4pl4gu4tco3pacon5tsman3gy5racon3ghach4hae4mhae4th5aguha3lac4onecon4aun4ims3latu2ninhan4gs3ket5colocol5ihan4kuni3vhap3lhap5ttras4co4grhar2dco5agsir5aclim45sionhas5shaun44clichaz3acle4m1head3hearun3s4s3ingun4sws2ina2s1in4silysil4eh5elohem4p4clarhena45sidiheo5r1c4l4h4eras5icc2c1itu4orsh3ernshor4h3eryci3phshon34cipecion45cinoc1ingc4inahi5anhi4cohigh5h4il2shiv5h4ina3ship3cilihir4lhi3rohir4phir4rsh3iohis4ssh1inci4lau5pia4h1l4hlan44cier5shevcia5rhmet4ch4tish1erh5ods3cho2hoge4chi2z3chitho4mahome3hon4aho5ny3hoodhoon45chiouptu44ura_ho5ruhos4esew4ihos1p1housu4ragses5tu4rasur4behree5se5shs1e4s4h1s24chedh4tarht1enht5esur4fru3rifser4os4erlhun4tsen5gur1inu3riosen4dhy3pehy3phu1ritces5tur3iz4cesa4sencur4no4iancian3i4semeia5peiass45selv5selfi4atu3centse1le4ceniib5iaib3inseg3ruros43cencib3li3cell5cel_s5edli5bun4icam5icap4icar4s4ed3secticas5i4cayiccu44iceour4pe4ced_i5cidsea5wi2cipseas4i4clyur4pi4i1cr5icrai4cryic4teictu2ccon4urti4ic4umic5uoi3curcci4ai4daiccha5ca4thscof4ide4s4casys4cliscle5i5dieid3ios4choid1itid5iui3dlei4domid3owu5sadu5sanid5uous4apied4ecany4ield3s4cesien4ei5enn4sceii1er_i3esci1estus3ciuse5as4cedscav5if4frsca4pi3fieu5siau3siccan4eiga5bcan5d4calous5sli3gibig3ilig3inig3iti4g4lus1trig3orig5oti5greigu5iig1ur2c5ah4i5i44cag4cach4ca1blusur4sat3usa5tab5utoi3legil1erilev4uta4b4butail3iail2ibil3io3sanc2ilitil2izsal4t5bustil3oqil4tyil5uru3tati4magsa5losal4m4ute_4imetbu3res3act5sack2s1ab4imitim4nii3mon4utelbumi4bu3libu4ga4inav4utenbsor42b5s2u4tis4briti3neervi4vr3vic4inga4inger3vey4ingir3ven4ingo4inguu4t1li5ni_i4niain3ioin1isbo4tor5uscrunk5both5b5ota5bos42i1no5boriino4si4not5borein3seru3in2int_ru4glbor5di5nusut5of5bor_uto5gioge4io2grbon4au5tonru3enu4touion3iio5phior3ibod3iio5thi5otiio4toi4ourbne5gb3lisrt4shblen4ip4icr3triip3uli3quar4tivr3tigrti4db4le_b5itzira4bi4racird5ert5ibi4refbi3tri4resir5gibi5ourte5oir4isr3tebr4tagbin4diro4gvac3uir5ul2b3ifis5agis3arisas52is1cis3chbi4eris3erbi5enrson3be5yor5shais3ibisi4di5sisbe3tw4is4krs3es4ismsbe5trr3secva4geis2piis4py4is1sbe3sp4bes4be5nuval5ois1teis1tirrys4rros44be5mis5us4ita_rron4i4tagrri4vi3tani3tatbe3lorri4or4reoit4esbe1libe5gu4itiarre4frre4cbe3giit3igbe3dii2tim2itio4itisrp4h4r3pet4itonr4peait5rybe3debe3dai5tudit3ul4itz_4be2dbeat3beak4ro4varo4tyros4sro5roiv5ioiv1itror3i5root1roomval1ub3berva5mo4izarva5piron4eban3ijac4qban4ebal1ajer5srom4prom4iba4geazz5i5judgay5alax4idax4ickais4aw4ly3awaya1vorav5ocav3igke5liv3el_ve4lov4elyro1feke4tyv4erdv4e2sa5vanav3ag5k2ick4illkilo5au1thk4in_4ves_ro3crkin4gve4teaun5dk5ishau4l2au3gu4kleyaugh3ve4tyk5nes1k2noat3ulkosh4at5uekro5n4k1s2at5uaat4that5te5vianat4sk5vidil4abolaci4l4adela3dylag4nlam3o3landrob3la4tosr4noular4glar3ilas4ea4topr3nivr3nita2tomr5nica4toglbin44l1c2vi5gnat3ifat1ica5tiar3neyr5net4ati_ld5isat4hol4driv2incle4bileft55leg_5leggr4nerr3nel4len_3lencr4nar1lentle3phle4prvin5dler4e3lergr3mitl4eroat5evr4mio5lesq3lessr3menl3eva4vingrma5cvio3lvi1ou4leyevi5rovi3so4l1g4vi3sulgar3l4gesate5cat5apli4agli2amr3lo4li4asr4lisli5bir4ligr2led4lics4vitil4icul3icyl3idaat5ac3lidirk4lel4iffli4flr3ket3lighvit3r4vityriv3iri2tulim3ili4moris4pl4inar3ishris4clin3ir4is_li5og4l4iqlis4pas1trl2it_as4shas5phri2pla4socask3ia3sicl3kallka4ta3sibl4lawashi4l5leal3lecl3legl3lel5riphas4abar2shrin4grin4ear4sarin4dr2inal5lowarre4l5met3rimol4modlmon42l1n2a3roorim5ilo4civo4la5rigil5ogo3loguri5et5longlon4iri1erlood5r4icolop3il3opmlora44ricir4icerib3a5los_v5oleri4agria4blos4tlo4taar2mi2loutar2izar3iolpa5bl3phal5phi4rhall3pit5voltar4im3volv2l1s2vom5ivori4l4siear4fllt5agar4fivo4rylten4vo4talth3ia3reeltis4ar4drw5ablrgo4naraw4lu3brluch4lu3cilu3enwag5olu5idlu4ma5lumia5raur5gitwait5luo3rw5al_luss4r5gisar4atl5venrgi4nara3pwar4tar3alwas4tly5mely3no2lys4l5ysewa1teaque5ma2car3gicma4clr3get5magnwed4nmaid54maldrg3erweet3wee5vwel4lapoc5re4whwest3ap3in4aphires2tr4es_mar3vre5rumas4emas1t5matemath3rero4r4eriap5atr1er4m5bilre1pumbi4vapar4a5nuran3ul4med_an3uare5lure1lian4twre5itmel4tan2trre4fy4antomen4are3fire2fe4menemen4imens4re1de3ment2r2edme5onre4awwin4g5reavme4tare3anme1tere1alm4etr3wiserdin4rdi4aan4stwith3an2span4snan2samid4amid4gan5otwl4esr4dalm4illmin4a3mindrcum3rc4itr3charcen4min4tm4inumiot4wl3ina3niumis5lan3ita3nip4mithan3ioan1gla3neuws4per2bina3nena5neem4ninw5s4tan1dl4mocrrbi4fmo2d1mo4gomois2xac5ex4agor4bagmo3mer4baba3narrau4ta5monrare4rar5cra5nor4aniam1inr2amiam5ifra4lomo3spmoth3m5ouf3mousam3icxer4ixe5roraf4tr5aclm3petra3bixhil5mpi4aam3ag3quetm5pirmp5is3quer2que_qua5vmpov5mp4tram5ab3alyz4m1s25alyt4alysa4ly_ali4exi5di5multx4ime4aldia4laral3adal5abak1enain5opu3trn4abu4nac_na4can5act5putexpe3dna4lia4i4n4naltai5lya3ic_pur4rag5ulnank4nar3c4narenar3inar4ln5arm3agognas4c4ag4l4ageupul3cage4oaga4na4gab3nautnav4e4n1b4ncar5ad5umn3chaa3ducptu4rpti3mnc1innc4itad4suad3owad4len4dain5dana5diua3ditndi4ba3dion1ditn3dizn5ducndu4rnd2we3yar4n3eara3dianeb3uac4um5neckac3ulp4siba3cio5negene4laac1inne5mine4moa3cie4nene4a2cine4poyc5erac1er2p1s2pro1tn2erepro3lner4rych4e2nes_4nesp2nest4neswpri4sycom4n5evea4carab3uln4gabn3gelpre3vpre3rycot4ng5han3gibng1inn5gitn4glangov4ng5shabi5an4gumy4erf4n1h4a5bannhab3a5bal3n4iani3anni4apni3bani4bl_us5ani5dini4erni2fip3petn5igr_ure3_un3up3per_un5op3pennin4g_un5k5nis_p5pel_un1en4ithp4ped_un1ani3tr_to4pympa3_til4n3ketnk3inyn5ic_se2ny4o5gy4onsnmet44n1n2_ru4d5pounnni4vnob4lpo4tan5ocly4ped_ro4qyper5noge4pos1s_ri4gpo4ry1p4or_res2no4mono3my_ree2po4ninon5ipoin2y4poc5po4gpo5em5pod_4noscnos4enos5tno5tayp2ta3noun_ra4cnowl3_pi2tyra5m_pi4eyr5ia_out3_oth32n1s2ns5ab_or3t_or1d_or3cplu4mnsid1nsig4y3s2eys3ion4socns4pen5spiploi4_odd5nta4bpli4n_ni4cn5tib4plignti2fpli3a3plannti4p1p2l23ysis2p3k2ys3ta_mis1nu5enpi2tun3uinp3ithysur4nu1men5umi3nu4nyt3icnu3trz5a2b_li4t_li3o_li2n_li4g_lev1_lep5_len4pion4oard3oas4e3pi1ooat5ip4inoo5barobe4l_la4mo2binpind4_ju3rob3ul_is4i_ir5rp4in_ocif3o4cil_in3so4codpi3lopi3enocre33piec5pidipi3dep5ida_in2kod3icodi3oo2do4odor3pi4cypian4_ine2o5engze3rooe4ta_im3m_id4l_hov5_hi3b_het3_hes3_go4r_gi4bpho4ro5geoo4gero3gie3phobog3it_gi5azo5ol3phizo4groogu5i4z1z22ogyn_fes3ohab5_eye55phieph1icoiff4_en3sph4ero3ing_en3go5ism_to2qans3v_el5d_eer4bbi4to3kenok5iebio5mo4lanper1v4chs_old1eol3erpe5ruo3letol4fi_du4co3liaper3op4ernp4erio5lilpe5ono5liop4encpe4la_do4tpee4do5livcin2q3pediolo4rol5pld3tabol3ub3pedeol3uno5lusedg1le1loaom5ahoma5l2p2edom2beom4bl_de3o3fich3pe4ao4met_co4ro3mia_co3ek3shao5midom1inll1fll3teapa2teo4monom3pi3pare_ca4tlue1pon4aco3nanm2an_pa4pum2en_on5doo3nenng1hoon4guon1ico3nioon1iso5niupa3nypan4ao3nou_bri2pain4ra1oronsu4rk1hopac4tpa4ceon5umonva5_ber4ood5eood5i6rks_oop3io3ordoost5rz1scope5dop1erpa4ca_ba4g_awn4_av4i_au1down5io3pito5pon1sync_as1s_as1p_as3ctch1c_ar5so5ra_ow3elo3visov4enore5auea1mor3eioun2d_ant4orew4or4guou5etou3blo5rilor1ino1rio_ang4o3riuor2miorn2eo5rofoto5sor5pe3orrhor4seo3tisorst4o3tif_an5cor4tyo5rum_al3tos3al_af1tos4ceo4teso4tano5scros2taos4poos4paz2z3wosi4ue3pai", 6: "os3ityos3itoz3ian_os4i4ey1stroos5tilos5titxquis3_am5atot3er_ot5erso3scopor3thyweek1noth3i4ot3ic_ot5icao3ticeor3thiors5enor3ougor3ityor3icaouch5i4o5ria_ani5mv1ativore5sho5realus2er__an3teover3sov4erttot3icoviti4o5v4olow3dero4r3agow5esto4posiop3ingo5phero5phanthy3sc3operaontif5on3t4ionten45paganp3agattele2gonspi4on3omyon4odipan3elpan4tyon3keyon5est3oncil_ar4tyswimm6par5diompro5par5elp4a4ripar4isomo4gepa5terst5scrpa5thy_atom5sta1tio5miniom3icaom3ic_ss3hatsky1scpear4lom3ena_ba5naol3umer1veilpedia4ped4icolli4er1treuo5liteol3ishpeli4epe4nano5lis_pen4thol3ingp4era_r1thoup4erago3li4f_bas4er1krauperme5ol5id_o3liceper3tio3lescolass4oi3terpe5tenpe5tiz_be5raoi5son_be3smphar5iphe3nooi5letph4es_oi3deroic3esph5ingr3ial_3ognizo5g2ly1o1gis3phone5phonio5geneo4gatora3mour2amenofit4tof5itera3chupi4ciepoly1eod5dedo5cureoc3ula1pole_5ocritpee2v1param4oc3raco4clamo3chetob5ingob3a3boast5eoke1st3nu3itpi5thanuf4fentu3meoerst2o3chasplas5tn3tinepli5ernti4ernter3sntre1pn4s3esplum4bnsati4npre4cns4moonon1eqnor5abpo3et5n5lessn5oniz5pointpoly5tnon4agnk3rup3nomicng1sprno5l4inois5i4n3o2dno3blenni3aln5keroppa5ran3itor3nitionis4ta5nine_ni3miznd3thrmu2dron3geripray4e5precipre5copre3emm3ma1bpre4lan5gerep3rese3press_can5cmedi2c5pri4e_ce4la3neticpris3op3rocal3chain4er5ipros3en4erarnera5bnel5iz_cit5rne4gatn5d2ifpt5a4bjanu3aign4itn3chisn5chiln5cheon4ces_nau3seid4iosna3talnas5tinan4itnanci4na5mitna5liahnau3zput3er2n1a2bhex2a3hatch1multi3hair1sm4pousg1utanmpo3rim4p1inmp5iesmphas4rach4empar5iraf5figriev1mpara5mo5seyram3et4mora_rane5oran4gemo3ny_monol4rap3er3raphymo3nizgno5morar5ef4raril1g2nacg1leadmoni3ara5vairav3elra5ziemon5gemon5etght1wemoi5sege3o1dmma5ryr5bine3fluoren1dixmis4ti_de3ra_de3rie3chasrch4err4ci4bm4inglm5ineedu2al_3miliame3tryrdi4er_des4crd3ingdi2rerme5thimet3alre5arr3mestim5ersadi2rende2ticdes3icre4cremen4temensu5re3disred5itre4facmen4dede2mosmen5acmem1o3reg3ismel5onm5e5dyme3died2d5ibren4te5mediare5pindd5a5bdata1bmba4t5cle4arma3tisma5scemar4lyre4spichs3huma5riz_dumb5re3strre4terbrus4qre3tribio1rhre5utiman3izre4valrev3elbi1orbbe2vie_eas3ire5vilba1thyman5is5maniamal4tymal4lima5linma3ligmag5inav3ioul5vet4rg3inglus3teanti1dl5umn_ltur3a_el3emltera4ltane5lp5ingloun5dans5gra2cabllos5etlor5ouric5aslo5rie_enam35ricidri4cie5lope_rid5erri3encri3ent_semi5lom3errig5an3logicril3iz5rimanlob5allm3ingrim4pell5out5rina__er4ril5linal2lin4l3le4tl3le4nriph5eliv3er_ge5og_han5k_hi3er_hon3olin3ea1l4inel4im4p_idol3_in3ci_la4cy_lath5rit3iclim4blrit5urriv5elriv3et4l4i4lli4gra_leg5elif3errk4linlid5er4lict_li4cor5licioli4atorl5ish_lig5a_mal5o_man5a_mer3c5less_rm5ersrm3ingy3thinle5sco3l4erilera5b5lene__mon3ele4matld4erild4erela4v4ar1nis44lativ_mo3rola5tanlan4telan5etlan4dllab3ic_mu5takin4dek3est_ro5filk3en4dro5ker5role__of5te4jestyys3icaron4al5izont_os4tlron4tai4v3ot_pe5tero3pelrop3ici5voreiv5il__pio5n_pre3mro4the_ran4tiv3en_rov5eliv3ellit3uati4tramr5pentrp5er__rit5ui4tismrp3ingit5ill_ros5tit3ica4i2tici5terirre4stit3era4ita5mita4bi_row5dist4lyis4ta_is4sesrsa5tiissen4is4sal_sci3erse4crrs5er_islan4rse5v2yo5netish5opis3honr4si4bis5han5iron_ir4minrtach4_self5iri3turten4diri5dei4rel4ire4de_sell5r4tieriq3uidrtil3irtil4lr4tilyr4tistiq5uefip4re4_sing4_ting4yn3chrru3e4lion3at2in4th_tin5krum3pli4no4cin3ityrun4ty_ton4aruti5nymbol5rvel4i_top5irv5er_r5vestin5geni5ness_tou5s_un3cein3cerincel45ryngei4n3auim3ulai5miniimi5lesac3riim5ida_ve5rasalar4ima5ryim3ageill5abil4istsan4deila5rai2l5am_wil5ii4ladeil3a4bsa5voright3iig3eraab5erd4ific_iff5enif5eroi3entiien5a45ie5gaidi5ou3s4cieab5latidi4arid5ianide3al4scopyab5rogid5ancic3ulaac5ardi2c5ocic3ipaic5inase2c3oi4carai4car_se4d4ei2b5riib5iteib5it_ib5ertib3eraac5aroi4ativ4ian4tse4molsen5ata5ceouh4warts5enedhus3t4s5enin4sentd4sentlsep3a34s1er_hun5kehu4min4servohro3poa5chethov5el5se5umhouse3sev3enho5senhort3eho5rishor5at3hol4ehol5arh5odizhlo3riac5robhis3elhion4ehimer4het4edsh5oldhe2s5ph5eroushort5here5aher4bahera3p3side_5sideshen5atsi5diz4signahel4lyact5ifhe3l4ihe5do55sine_h5ecathe4canad4dinsion5aad5er_har4lehard3e3sitioha5rasha3ranhan4tead3icahang5oadi4ersk5inesk5ing5hand_han4cyhan4cislith5hala3mh3ab4lsmall32g5y3n5gui5t3guard5smithad5ranaeri4eag5ellag3onia5guerso4labsol3d2so3licain5in4grada3s4on_gor5ougo5rizgondo5xpan4dait5ens5ophyal3end3g4o4ggnet4tglad5i5g4insgin5ge3g4in_spen4d2s5peog3imen5gies_3spher5giciagh5outsp5ingge5nizge4natge5lizge5lisgel4inxi5miz4gativgar5n4a5le5oga3nizgan5isga5mets5sengs4ses_fu4minfres5cfort5assi4erss5ilyfore5tfor5ayfo5ratal4ia_fon4dessur5aflo3ref5lessfis4tif1in3gstam4i5stands4ta4p5stat_fin2d5al5levs5tero4allicstew5afight5fi5del5ficie5ficiafi3cer5stickf3icena5log_st3ingf3icanama5ra5stockstom3a5stone2f3ic_3storef2f5iss4tradam5ascs4trays4tridf5fin_fend5efeath3fault5fa3thefar5thfam5is4fa4mafall5eew3inge5verbeven4ie5vengevel3oev3ellev5asteva2p5euti5let5roset3roget5rifsy5rinet3ricet5onaam5eraam5ilyami4noamor5ieti4noe5tidetai5loethod3eten4dtal5enes5urramp5enan3ageta5loge5strotan4detanta3ta5pere3ston4es2toes5times3tigta3rizestan43analy4taticta4tures4prean3arces3pertax4ises5onaes3olue5skintch5etanar4ies4i4ntead4ie2s5ima3natiande4sesh5enan3disan4dowang5iete5geres5ences5ecres5cana4n1icte2ma2tem3at3tenanwrita45erwau4tenesert3era3nieser3set5erniz4erniter4nis5ter3de4rivaan3i3fter3isan4imewo5vener3ineeri4ere3rient3ess_teth5e5ericke1ria4er3ester5esser3ent4erenea5nimier5enaer3emoth3easthe5atthe3iser5el_th5ic_th5icaere3in5thinkere5coth5odea5ninee3realan3ishan4klier4che5anniz4erandti4atoanoth5equi3lep5utat4ic1uan4scoe4probep3rehe4predans3poe4precan4surantal4e3penttim5ulep5anceo5rol3tine_eop3aran4tiewin4deap5eroen3ishen5icsen3etren5esten5esien5eroa3pheren3dicap3itae4nanten5amoem5ulaa3pituti3zen5emnize5missem5ishap5olaem5ine3tles_t5let_em1in2apor5iem3icaem5anael3op_el4labapos3te3liv3el5ishaps5esweath3e3lierel3icaar3actwa5verto3nate3libee4l1erel3egato3rietor5iza5radeelaxa4aran4gto3warelan4dej5udie5insttra5chtraci4ar5av4wa5gere5git5arbal4ar5easeg5ing4voteetrem5iar3enta5ressar5ial4tricsvor5abe3finetro5mitron5i4tronyar3iantro3sp5eficia3rieted5uloed3icae4d1erec3ulaec4tane4cremeco5roec3orae4concar5o5de4comme4cluse4clame5citeec5ifya5ronias3anta5sia_tu4nis2t3up_ecan5ce4belstur3ise4bel_eav3ene4a3tue5atifeath3ieat5eneart3eear4ilear4icear5eseam3ereal3oueal5erea5geread5iedum4be4ducts4duct_duc5eras3tenasur5adrea5rat3abl4d5outdo3natdom5izdo5lor4dlessu4bero3dles_at3alou3ble_d4is3tdirt5idi5niz3dine_at5ech5di3endi4cam1d4i3ad3ge4tud5estdev3ilde3strud3iedud3iesdes3tide2s5oat3egovis3itde4nardemor5at3en_uen4teuer4ilde5milat3eraugh3en3demicater5nuil5izdeli4ede5comde4cildecan4de4bonv3io4rdeb5it4dativ2d3a4bat3estu5laticu4tie5ulcheul3dercuss4icu5riaath5em3cultua5thenul3ingul5ishul4lar4vi4naul4liscu5ityctim3ic4ticuuls5esc5tantultra3ct5angcros4ecrop5ocro4pl5critiath5omum4blycre3at5vilitumor5oat5i5b5crat_cras5tcoro3ncop3iccom5ercol3orun5ishco3inc5clareat3ituunt3abat5ropun4tescit3iz4cisti4cista4cipicc5ing_cin3em3cinatuper5s5videsup3ingci2a5b5chini5videdupt5ib5vide_at4tag4ch1inch3ersch3er_ch5ene3chemiche5loure5atur4fercheap3vi5aliat3uravet3er4ch3abc5e4taau5sib3cessives4tece5ram2cen4e4cedenccou3turs5erur5tesur3theaut5enur4tiecav5al4cativave4nover3thcar5omca5percan4tycan3izcan5iscan4icus4lin3versecal4laver3ieca3latca5dencab3in3butiobuss4ebus5iebunt4iv4eresuten4i4u1t2iv3erenu3tineut3ingv4erelbroth35u5tizbound34b1orabon5at5vere_bom4bibol3icblun4t5blespblath5av3erav5enuebi3ogrbi5netven3om2v1a4bvac5ilbi3lizbet5izbe5strva5liebe5nigbbi4nabas4siva5nizbari4aav5ernbarbi5av5eryvel3liazi4eravi4er", 7: "_dri5v4ban5dagvar5iedbina5r43bi3tio3bit5ua_ad4derution5auti5lizver5encbuf4ferus5terevermi4ncall5incast5ercas5tigccompa5z3o1phros5itiv5chanicuri4fico5stati5chine_y5che3dupport54v3iden5cific_un4ter_at5omiz4oscopiotele4g5craticu4m3ingv3i3liz4c3retaul4li4bcul4tiscur5a4b4c5utiva5ternauiv4er_del5i5qdem5ic_de4monsdenti5fdern5izdi4latou4b5ingdrag5on5drupliuar5ant5a5si4tec5essawo4k1enec5ifiee4compear5inate4f3eretro5phewide5sp5triciatri5cesefor5ese4fuse_oth5esiar5dinear4chantra5ventrac4tetrac4itar5ativa5ratioel5ativor5est_ar5adisel5ebraton4alie4l5ic_wea5rieel5igibe4l3ingto5cratem5igraem3i3niemoni5oench4erwave1g4a4pillavoice1ption5eewill5inent5age4enthesvaude3vtill5inep5recaep5ti5bva6guer4erati_tho5rizthor5it5thodicer5ence5ternitteri5zater5iesten4tage4sage_e4sagese4sert_an5est_e4sertse4servaes5idenes5ignaesis4tees5piraes4si4btal4lisestruc5e5titioounc5erxe4cutota5bleset5itiva4m5atoa4matis5stratu4f3ical5a5lyst4ficatefill5instern5isspend4gani5zasqual4la4lenti4g3o3nas5ophiz5sophicxpecto55graph_or5angeuri4al_4graphy4gress_smol5d4hang5erh5a5nizharp5enhar5terhel4lishith5erhro5niziam5eteia4tricic4t3uascour5au2r1al_5scin4dover4nescan4t55sa3tiou5do3ny_ven4de_under5ty2p5al_anti5sylla5bliner4arturn3ari5nite_5initioinsur5aion4eryiphras4_tim5o5_ten5an_sta5blrtroph4_se5rieiq3ui3t5i5r2izis5itiviso5mer4istral5i5ticki2t5o5mtsch3ie_re5mittro3fiti4v3er_i4vers_ros5per_pe5titiv3o3ro_ped5alro5n4is_or5ato4jestierom5ete_muta5bk5iness4latelitr4ial__mist5i_me5terr4ming_lev4er__mar5tilev4eralev4ers_mag5a5liar5iz5ligaterit5ers_lat5errit5er_r5ited__im5pinri3ta3blink5er_hon5ey5litica_hero5ior5aliz_hand5irip5lic_gen3t4tolo2gylloqui5_con5grt1li2erbad5ger4operag_eu4lertho3donter2ic__ar4tie_ge4ome_ge5ot1_he3mo1_he3p6a_he3roe_in5u2tpara5bl5tar2rht1a1mintalk1a5ta3gon_par5age_aster5_ne6o3f_noe1thstyl1is_poly1s5pathic_pre1ampa4tricl3o3niz_sem4ic_semid6_semip4_semir45ommend_semiv4lea4s1a_spin1oom5etryspher1o_to6poglo4ratospe3cio3s2paceso2lute_we2b1l_re1e4ca5bolicom5erseaf6fishside5swanal6ysano5a2cside5stl5ties_5lumniasid2ed_anti1reshoe1stscy4th1s4chitzsales5wsales3cat6tes_augh4tlau5li5fom5atizol5ogizo5litiorev5olure5vertre5versbi5d2ifbil2lab_earth5pera5blro1tronro3meshblan2d1blin2d1blon2d2bor1no5ro1bot1re4ti4zr5le5quperi5stper4malbut2ed_but4tedcad5e1moist5enre5stalress5ibchie5vocig3a3roint5er4matizariv1o1lcous2ticri3tie5phisti_be5stoog5ativo2g5a5rr3a3digm4b3ingre4posir4en4tade4als_od5uctsquasis6quasir6re5fer_p5trol3rec5olldic1aiddif5fra3pseu2dr5ebrat5metric2d1lead2d1li2epro2g1epre1neuod5uct_octor5apoin3came5triem5i5liepli5narpara3memin5glim5inglypi4grappal6matmis4er_m5istryeo3graporth1riop1ism__but4tio3normaonom1icfeb1ruafermi1o_de4moio5a5lesodit1icodel3lirb5ing_gen2cy_n4t3ingmo5lestration4get2ic_4g1lishobli2g1mon4ismnsta5blmon4istg2n1or_nov3el3ns5ceivno1vembmpa5rabno4rarymula5r4nom1a6lput4tinput4tedn5o5miz_cam4penag5er_nge5nesh2t1eoun1dieck2ne1skiifac1etncour5ane3backmono1s6mono3chmol1e5cpref5ac3militapre5tenith5i2lnge4n4end5est__capa5bje1re1mma1la1ply5styr1kovian_car5olprin4t3lo2ges_l2l3ishprof5it1s2tamp", 8: "lead6er_url5ing_ces5si5bch5a5nis1le1noidlith1o5g_chill5ilar5ce1nym5e5trych5inessation5arload4ed_load6er_la4c3i5elth5i2lyneg5ativ1lunk3erwrit6er_wrap3arotrav5es51ke6linga5rameteman3u1scmar1gin1ap5illar5tisticamedio6c1me3gran3i1tesima3mi3da5bves1titemil2l1agv1er1eigmi6n3is_1verely_e4q3ui3s5tabolizg5rapher5graphicmo5e2lasinfra1s2mon4ey1lim3ped3amo4no1enab5o5liz_cor5nermoth4et2m1ou3sinm5shack2ppo5sitemul2ti5uab5it5abimenta5rignit1ernato5mizhypo1thani5ficatuad1ratu4n5i4an_ho6r1ic_ua3drati5nologishite3sidin5dling_trib5utin5glingnom5e1non1o1mistmpos5itenon1i4so_re5stattro1p2istrof4ic_g2norespgnet1ism5glo5binlem5aticflow2er_fla1g6elntrol5lifit5ted_treach1etra1versl5i5ticso3mecha6_for5mer_de5rivati2n3o1me3spac6i2t3i4an_thy4l1antho1k2er_eq5ui5to4s3phertha4l1amt3ess2es3ter1geiou3ba3dotele1r6ooxi6d1iceli2t1isonspir5apar4a1leed1ulingea4n3iesoc5ratiztch3i1er_kil2n3ipi2c1a3dpli2c1abt6ap6athdrom3e5d_le6icesdrif2t1a_me4ga1l1prema3cdren1a5lpres2plipro2cess_met4ala3do5word1syth3i2_non1e2m_post1ampto3mat4rec5ompepu5bes5cstrib5utqu6a3si31stor1ab_sem6is4star3tliqui3v4arr1abolic_sph6in1de5clar12d3aloneradi1o6gs3qui3tosports3wsports3cra5n2hascro5e2cor3bin1gespokes5wspi2c1il_te3legrcroc1o1d_un3at5t_dictio5cat1a1s2buss4ingbus6i2esbus6i2erbo2t1u1lro5e2las1s2pacinb1i3tivema5rine_r3pau5li_un5err5r5ev5er__vi2c3arback2er_ma5chinesi5resid5losophyan3ti1n2sca6p1ersca2t1olar2rangesep3temb1sci2uttse3mes1tar3che5tsem1a1ph", 9: "re4t1ribuuto5maticl3chil6d1a4pe5able1lec3ta6bas5ymptotyes5ter1yl5mo3nell5losophizlo1bot1o1c5laratioba6r1onierse1rad1iro5epide1co6ph1o3nscrap4er_rec5t6angre2c3i1prlai6n3ess1lum5bia_3lyg1a1miec5ificatef5i5nites2s3i4an_1ki5neticjapan1e2smed3i3cinirre6v3ocde2c5linao3les3termil5li5listrat1a1gquain2t1eep5etitiostu1pi4d1v1oir5du1su2per1e6_mi1s4ers3di1methy_mim5i2c1i5nitely_5maph1ro15moc1ra1tmoro6n5isdu1op1o1l_ko6r1te1n3ar4chs_phi2l3ant_ga4s1om1teach4er_parag6ra4o6v3i4an_oth3e1o1sn3ch2es1to5tes3toro5test1eror5tively5nop5o5liha2p3ar5rttrib1ut1_eth1y6l1e2r3i4an_5nop1oly_graph5er_5eu2clid1o1lo3n4omtrai3tor1_ratio5na5mocratiz_rav5en1o", 10: "se1mi6t5ic3tro1le1um5sa3par5iloli3gop1o1am1en3ta5bath3er1o1s3slova1kia3s2og1a1myo3no2t1o3nc2tro3me6c1cu2r1ance5noc3er1osth1o5gen1ih3i5pel1a4nfi6n3ites_ever5si5bs2s1a3chu1d1ri3pleg5_ta5pes1trproc3i3ty_s5sign5a3b3rab1o1loiitin5er5arwaste3w6a2mi1n2ut1erde3fin3itiquin5tes5svi1vip3a3r", 11: "pseu3d6o3f2s2t1ant5shimi1n2ut1estpseu3d6o3d25tab1o1lismpo3lyph1onophi5lat1e3ltravers3a3bschro1ding12g1o4n3i1zat1ro1pol3it3trop1o5lis3trop1o5lesle3g6en2dreeth1y6l1eneor4tho3ni4t", 12: "3ra4m5e1triz1e6p3i3neph1" } });
var Ku = function(e6, t2) {
  for (var r2 = -1, n2 = t2.length, i2 = e6.length; ++r2 < n2; ) e6[i2 + r2] = t2[r2];
  return e6;
}, Qu = rt, ec = nt, tc = T ? T.isConcatSpreadable : void 0;
var rc = Ku, nc = function(e6) {
  return ec(e6) || Qu(e6) || !!(tc && e6 && e6[tc]);
};
var ic = function e5(t2, r2, n2, i2, o2) {
  var a2 = -1, s2 = t2.length;
  for (n2 || (n2 = nc), o2 || (o2 = []); ++a2 < s2; ) {
    var l2 = t2[a2];
    r2 > 0 && n2(l2) ? r2 > 1 ? e5(l2, r2 - 1, n2, i2, o2) : rc(o2, l2) : i2 || (o2[o2.length] = l2);
  }
  return o2;
}, oc = ic;
var ac = function(e6) {
  return (null == e6 ? 0 : e6.length) ? oc(e6, Infinity) : [];
}, sc = t(ac);
var lc, uc = function(e6) {
  for (var t2 = -1, r2 = null == e6 ? 0 : e6.length, n2 = 0, i2 = []; ++t2 < r2; ) {
    var o2 = e6[t2];
    o2 && (i2[n2++] = o2);
  }
  return i2;
}, cc = t(uc);
function hc(e6, t2, r2) {
  return function() {
    return (r2 || e6)[t2].apply(e6, arguments);
  };
}
l.decode.options.strict = true, lc = (function(e6) {
  var t2, r2, n2, i2, o2 = (function(e7, t3) {
    function r3() {
    }
    r3.prototype = (e7.superclass = t3).prototype, (e7.prototype = new r3()).constructor = e7, "function" == typeof t3.extended && t3.extended(e7);
    return e7;
  })(((function(e7, t3) {
    var r3 = {}.hasOwnProperty;
    for (var n3 in t3) r3.call(t3, n3) && (e7[n3] = t3[n3]);
    return e7;
  })(a2, e6).displayName = "HtmlGenerator", a2), e6).prototype;
  function a2(e7) {
    this.pictureCanvas = hc(this, "pictureCanvas", o2), this.picture = hc(this, "picture", o2), this.image = hc(this, "image", o2), this.verb = hc(this, "verb", o2), this.link = hc(this, "link", o2), this.anchor = hc(this, "anchor", o2), this.multicols = hc(this, "multicols", o2), this.verse = hc(this, "verse", o2), this.quotation = hc(this, "quotation", o2), this.quote = hc(this, "quote", o2), this.itemlabel = hc(this, "itemlabel", o2), this.descriptionList = hc(this, "descriptionList", o2), this.orderedList = hc(this, "orderedList", o2), this.unorderedList = hc(this, "unorderedList", o2), this.list = hc(this, "list", o2), this.abstract = hc(this, "abstract", o2), this.date = hc(this, "date", o2), this.author = hc(this, "author", o2), this.title = hc(this, "title", o2), this.titlepage = hc(this, "titlepage", o2), this._options = Object.assign({ documentClass: "article", styles: [], hyphenate: true, languagePatterns: Ju, precision: 3 }, e7), this._options.hyphenate && (this._h = new Zu(this._options.languagePatterns)), this.reset();
  }
  return a2.prototype.sp = " ", a2.prototype.brsp = "​ ", a2.prototype.nbsp = l.decode("&nbsp;"), a2.prototype.visp = l.decode("&blank;"), a2.prototype.zwnj = l.decode("&zwnj;"), a2.prototype.shy = l.decode("&shy;"), a2.prototype.thinsp = l.decode("&thinsp;"), t2 = function(e7, t3) {
    var r3;
    return r3 = document.createElement(e7), t3 && r3.setAttribute("class", t3), r3;
  }, r2 = /^(address|blockquote|body|center|dir|div|dl|fieldset|form|h[1-6]|hr|isindex|menu|noframes|noscript|ol|p|pre|table|ul|dd|dt|frameset|li|tbody|td|tfoot|th|thead|tr|html)$/i, n2 = function(e7) {
    return r2.test(e7.nodeName);
  }, a2.prototype.inline = "span", a2.prototype.block = "div", a2.prototype.titlepage = function() {
    return t2(this.block, "titlepage");
  }, a2.prototype.title = function() {
    return t2(this.block, "title");
  }, a2.prototype.author = function() {
    return t2(this.block, "author");
  }, a2.prototype.date = function() {
    return t2(this.block, "date");
  }, a2.prototype.abstract = function() {
    return t2(this.block, "abstract");
  }, a2.prototype.part = "part", a2.prototype.chapter = "h1", a2.prototype.section = "h2", a2.prototype.subsection = "h3", a2.prototype.subsubsection = "h4", a2.prototype.paragraph = "h5", a2.prototype.subparagraph = "h6", a2.prototype.linebreak = "br", a2.prototype.par = "p", a2.prototype.list = function() {
    return t2(this.block, "list");
  }, a2.prototype.unorderedList = function() {
    return t2("ul", "list");
  }, a2.prototype.orderedList = function() {
    return t2("ol", "list");
  }, a2.prototype.descriptionList = function() {
    return t2("dl", "list");
  }, a2.prototype.listitem = "li", a2.prototype.term = "dt", a2.prototype.description = "dd", a2.prototype.itemlabel = function() {
    return t2(this.inline, "itemlabel");
  }, a2.prototype.quote = function() {
    return t2(this.block, "list quote");
  }, a2.prototype.quotation = function() {
    return t2(this.block, "list quotation");
  }, a2.prototype.verse = function() {
    return t2(this.block, "list verse");
  }, a2.prototype.multicols = function(e7) {
    var r3 = this;
    return function() {
      var n3;
      return (n3 = t2(r3.block, "multicols")).setAttribute("style", "column-count:" + e7), n3;
    };
  }, a2.prototype.anchor = function(e7) {
    return function() {
      var t3;
      return t3 = document.createElement("a"), null != e7 && (t3.id = e7), t3;
    };
  }, a2.prototype.link = function(e7) {
    return function() {
      var t3;
      return t3 = document.createElement("a"), e7 && t3.setAttribute("href", e7), t3;
    };
  }, a2.prototype.verb = function() {
    return t2("code", "tt");
  }, a2.prototype.verbatim = "pre", a2.prototype.img = "img", a2.prototype.image = function(e7, r3, n3) {
    var i3 = this;
    return function() {
      var o3;
      return (o3 = t2(i3.img)).src = n3, o3.height = r3, o3.width = e7, o3;
    };
  }, a2.prototype.picture = function() {
    return t2(this.inline, "picture");
  }, a2.prototype.pictureCanvas = function() {
    return t2(this.inline, "picture-canvas");
  }, a2.prototype.SVG = to, a2.prototype.KaTeX = Wu, a2.prototype._dom = null, a2.prototype.reset = function() {
    e6.prototype.reset.call(this), this._dom = document.createDocumentFragment();
  }, a2.prototype.character = function(e7) {
    return e7;
  }, a2.prototype.textquote = function(e7) {
    switch (e7) {
      case "`":
        return this.symbol("textquoteleft");
      case "'":
        return this.symbol("textquoteright");
    }
  }, a2.prototype.hyphen = function() {
    return "tt" === this._activeAttributeValue("fontFamily") ? "-" : l.decode("&hyphen;");
  }, a2.prototype.ligature = function(e7) {
    return "tt" === this._activeAttributeValue("fontFamily") ? e7 : u.get(e7);
  }, a2.prototype.hasDiacritic = function(e7) {
    return c.has(e7);
  }, a2.prototype.diacritic = function(e7, t3) {
    return t3 ? t3 + c.get(e7)[0] : c.get(e7)[1];
  }, a2.prototype.controlSymbol = function(e7) {
    switch (e7) {
      case "/":
        return this.zwnj;
      case ",":
        return this.thinsp;
      case "-":
        return this.shy;
      case "@":
        return "​";
      default:
        return this.character(e7);
    }
  }, a2.prototype.htmlDocument = function(e7) {
    var t3, r3, n3, i3;
    return t3 = document.implementation.createHTMLDocument(this.documentTitle), (r3 = document.createElement("meta")).setAttribute("charset", "UTF-8"), t3.head.appendChild(r3), e7 || (e7 = null != (n3 = window.location) ? n3.href : void 0), e7 ? ((i3 = document.createElement("base")).href = e7, t3.head.appendChild(i3), t3.head.appendChild(this.stylesAndScripts(e7))) : t3.head.appendChild(this.stylesAndScripts()), t3.body.appendChild(this.domFragment()), this.applyLengthsAndGeometryToDom(t3.documentElement), t3;
  }, a2.prototype.stylesAndScripts = function(e7) {
    var t3, r3, n3, i3, o3, a3, s2;
    if (t3 = document.createDocumentFragment(), r3 = function(e8) {
      var t4;
      return (t4 = document.createElement("link")).type = "text/css", t4.rel = "stylesheet", t4.href = e8, t4;
    }, n3 = function(e8) {
      var t4;
      return (t4 = document.createElement("script")).src = e8, t4;
    }, e7) {
      for (t3.appendChild(r3(new URL("css/katex.css", e7).toString())), t3.appendChild(r3(new URL(this.documentClass.constructor.css, e7).toString())), i3 = 0, a3 = (o3 = this._options.styles).length; i3 < a3; ++i3) s2 = o3[i3], t3.appendChild(r3(new URL(s2, e7).toString()));
      t3.appendChild(n3(new URL("js/base.js", e7).toString()));
    } else {
      for (t3.appendChild(r3("css/katex.css")), t3.appendChild(r3(this.documentClass.constructor.css)), i3 = 0, a3 = (o3 = this._options.styles).length; i3 < a3; ++i3) s2 = o3[i3], t3.appendChild(r3(s2));
      t3.appendChild(n3("js/base.js"));
    }
    return t3;
  }, a2.prototype.domFragment = function() {
    var e7;
    return (e7 = document.createDocumentFragment()).appendChild(this.create(this.block, this._dom, "body")), this._marginpars.length && e7.appendChild(this.create(this.block, this.create(this.block, this._marginpars, "marginpar"), "margin-right")), e7;
  }, a2.prototype.applyLengthsAndGeometryToDom = function(e7) {
    var t3, r3, n3, i3;
    e7.style.setProperty("--size", this.length("@@size").value), t3 = 100 * this.length("textwidth").ratio(this.length("paperwidth")), r3 = 100 * this.length("oddsidemargin").add(new this.Length(1, "in")).ratio(this.length("paperwidth")), n3 = Math.max(100 - t3 - r3, 0), e7.style.setProperty("--textwidth", this.round(t3) + "%"), e7.style.setProperty("--marginleftwidth", this.round(r3) + "%"), e7.style.setProperty("--marginrightwidth", this.round(n3) + "%"), n3 > 0 ? (i3 = 1e4 * this.length("marginparwidth").ratio(this.length("paperwidth")) / n3, e7.style.setProperty("--marginparwidth", this.round(i3) + "%")) : e7.style.setProperty("--marginparwidth", "0px"), e7.style.setProperty("--marginparsep", this.length("marginparsep").value), e7.style.setProperty("--marginparpush", this.length("marginparpush").value);
  }, a2.prototype.createDocument = function(e7) {
    i2(this._dom, e7);
  }, a2.prototype.create = function(e7, t3, r3) {
    var n3;
    return null == r3 && (r3 = ""), "function" == typeof e7 ? (n3 = e7()).hasAttribute("class") && (r3 = n3.getAttribute("class") + " " + r3) : n3 = document.createElement(e7), this.alignment() && (r3 += " " + this.alignment()), this._continue && this.location().end.offset > this._continue && (r3 += " continue", this.break()), r3.trim() && n3.setAttribute("class", r3.replace(/\s+/g, " ").trim()), i2(n3, t3);
  }, a2.prototype.createText = function(e7) {
    if (e7) return this.addAttributes(document.createTextNode(this._options.hyphenate ? this._h.hyphenateText(e7) : e7));
  }, a2.prototype.createVerbatim = function(e7) {
    if (e7) return document.createTextNode(e7);
  }, a2.prototype.createFragment = function() {
    var e7, t3;
    if (e7 = cc(sc(arguments)), !(arguments.length > 0) || e7 && e7.length) return 1 === e7.length && e7[0].nodeType ? e7[0] : (t3 = document.createDocumentFragment(), i2(t3, e7));
  }, a2.prototype.createImage = function(e7, t3, r3) {
    return this.create(this.image(e7, t3, r3));
  }, a2.prototype.createPicture = function(e7, t3, r3) {
    var n3, o3;
    return n3 = this.create(this.pictureCanvas), i2(n3, r3), t3 && n3.setAttribute("style", "left:" + t3.x.mul(-1).value + ";bottom:" + t3.y.mul(-1).value), (o3 = this.create(this.picture)).appendChild(n3), o3.setAttribute("style", "width:" + e7.x.value + ";height:" + e7.y.value), o3;
  }, a2.prototype.createVSpaceSkip = function(e7) {
    var t3;
    return (t3 = document.createElement("span")).setAttribute("class", "vspace " + e7), t3;
  }, a2.prototype.createVSpaceSkipInline = function(e7) {
    var t3;
    return (t3 = document.createElement("span")).setAttribute("class", "vspace-inline " + e7), t3;
  }, a2.prototype.createVSpace = function(e7) {
    var t3;
    return (t3 = document.createElement("span")).setAttribute("class", "vspace"), t3.setAttribute("style", "margin-bottom:" + e7.value), t3;
  }, a2.prototype.createVSpaceInline = function(e7) {
    var t3;
    return (t3 = document.createElement("span")).setAttribute("class", "vspace-inline"), t3.setAttribute("style", "margin-bottom:" + e7.value), t3;
  }, a2.prototype.createBreakSpace = function(e7) {
    var t3;
    return (t3 = document.createElement("span")).setAttribute("class", "breakspace"), t3.setAttribute("style", "margin-bottom:" + e7.value), this.addAttributes(t3);
  }, a2.prototype.createHSpace = function(e7) {
    var t3;
    return (t3 = document.createElement("span")).setAttribute("style", "margin-right:" + e7.value), t3;
  }, a2.prototype.parseMath = function(e7, t3) {
    var r3;
    return r3 = document.createDocumentFragment(), Wu.render(e7, r3, { displayMode: !!t3, throwOnError: false }), r3;
  }, a2.prototype.addAttribute = function(e7, t3) {
    e7.hasAttribute("class") && (t3 = e7.getAttribute("class") + " " + t3), e7.setAttribute("class", t3);
  }, a2.prototype.hasAttribute = function(e7, t3) {
    return e7.hasAttribute("class") && RegExp("\\b" + t3 + "\\b").test(e7.getAttribute("class"));
  }, a2.prototype.addAttributes = function(e7) {
    var t3;
    return (t3 = this._inlineAttributes()) ? e7 instanceof window.Element ? n2(e7) ? this.create(this.block, e7, t3) : this.create(this.inline, e7, t3) : e7 instanceof window.Text || e7 instanceof window.DocumentFragment ? this.create(this.inline, e7, t3) : Array.isArray(e7) ? e7.map((function(e8) {
      return this.create(this.inline, e8, t3);
    })) : (console.warn("addAttributes got an unknown/unsupported argument:", e7), e7) : e7;
  }, i2 = function(e7, t3) {
    var r3, n3, i3;
    if (t3) if (Array.isArray(t3)) for (r3 = 0, n3 = t3.length; r3 <= n3; ++r3) null != t3[i3 = r3] && e7.appendChild(t3[i3]);
    else e7.appendChild(t3);
    return e7;
  }, a2;
})(Jt);
let pc = null;
if ("undefined" != typeof HTMLElement) {
  let e6 = import.meta.url;
  pc = class extends HTMLElement {
    constructor() {
      if (super(), this.shadow = this.attachShadow({ mode: "open" }), this.textContent) this.onContentReady();
      else {
        const e7 = new MutationObserver(((t2) => {
          this.textContent && (e7.disconnect(), this.onContentReady());
        }));
        e7.observe(this, { childList: true });
      }
    }
    async onContentReady() {
      for (; this.shadow.lastChild; ) this.shadow.lastChild.remove();
      const t2 = "false" !== this.getAttribute("hyphenate");
      let r2;
      this.hasAttribute("baseURL") && (e6 = this.getAttribute("baseURL")), this.hasAttribute("macros") && (r2 = (await import(this.getAttribute("macros"))).default);
      const n2 = b.parse(this.textContent, { generator: new lc({ hyphenate: t2, CustomMacros: r2 }) });
      let i2 = document.createElement("div");
      if (i2.setAttribute("class", "page"), i2.appendChild(n2.domFragment()), this.hasAttribute("stylesheet")) {
        const e7 = document.createElement("link");
        e7.type = "text/css", e7.rel = "stylesheet", e7.href = this.getAttribute("stylesheet"), this.shadow.appendChild(e7);
      }
      this.shadow.appendChild(n2.stylesAndScripts(e6)), this.shadow.appendChild(i2), n2.applyLengthsAndGeometryToDom(this.shadow.host);
      const o2 = this.ownerDocument, a2 = o2.querySelectorAll("link"), s2 = new URL("fonts/cmu.css", e6);
      for (let e7 of a2) if (e7.href == s2.href) return;
      const l2 = o2.createElement("link");
      l2.type = "text/css", l2.rel = "stylesheet", l2.href = s2.href, o2.head.appendChild(l2);
    }
    connectedCallback() {
    }
  };
}
var dc = b.SyntaxError, mc = b.parse;
export {
  Jt as Generator,
  lc as HtmlGenerator,
  pc as LaTeXJSComponent,
  dc as SyntaxError,
  l as he,
  mc as parse
};
//# sourceMappingURL=latex-BT1_7jU3.js.map
