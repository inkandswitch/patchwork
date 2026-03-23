import type { SyntaxNode } from "@lezer/common"
import { parser } from "@lezer/javascript"

interface Loop {
  loopStart: number
  loopEnd: number
  bodyStart: number
  bodyEnd: number
  isBlockStatement: boolean
}

export function addLoopBudgetInstrumentation(code: string) {
  const loopBudgetVarDecl = `let __loopBudget = 5_000;\n`
  const enforceBudget = `if (--__loopBudget <= 0) throw new Error("Loop budget exceeded");`

  const tree = parser.parse(code)
  const cursor = tree.cursor()
  const loops: Loop[] = []

  // Find loops and sort them by position
  // (we want them in reverse order so we can insert without affecting positions)
  findLoops()
  loops.sort((a, b) => b.bodyStart - a.bodyStart)

  // Instrument the loops
  let instrumentedCode = code
  for (const { bodyStart, bodyEnd, isBlockStatement } of loops) {
    const before = instrumentedCode.substring(0, bodyStart)
    const body = instrumentedCode.substring(bodyStart, bodyEnd)
    const after = instrumentedCode.substring(bodyEnd)

    if (isBlockStatement) {
      // For block statements, insert right after the opening brace
      const openBrace = body.indexOf("{")
      const instrumented = body.substring(0, openBrace + 1) + " " + enforceBudget + " " + body.substring(openBrace + 1)
      instrumentedCode = before + instrumented + after
    } else {
      // For single statements, wrap in a block
      instrumentedCode = before + `{ ${enforceBudget} ${body} }` + after
    }
  }

  // Add the budget variable initialization at the top
  return loopBudgetVarDecl + instrumentedCode

  function findLoops() {
    do {
      if (["ForStatement", "WhileStatement", "DoStatement", "ForInStatement", "ForOfStatement"].includes(cursor.name)) {
        const loopStart = cursor.from
        const loopEnd = cursor.to
        const bodyNode = findBody(cursor.node)
        if (bodyNode) {
          loops.push({
            loopStart,
            loopEnd,
            bodyStart: bodyNode.from,
            bodyEnd: bodyNode.to,
            isBlockStatement: bodyNode.name === "Block",
          })
        } else {
          console.log("uh-oh, didn't find body for loop at", cursor.from)
        }
      }
      if (cursor.firstChild()) {
        findLoops()
        cursor.parent()
      }
    } while (cursor.nextSibling())
  }

  function findBody(node: SyntaxNode) {
    let child = node.firstChild
    while (child) {
      if (["Block", "Statement", "ExpressionStatement", ";"].includes(child.name)) {
        return child
      }
      child = child.nextSibling
    }
    return null
  }
}
