import { EditorProps } from "@/tools";
import { EngraftDoc } from "../datatype";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { ToolWithView } from "@engraft/hostkit";
import { makeFancyContext } from "@engraft/fancy-setup";
import { useState } from "react";
import { ToolProgram } from "@engraft/hostkit";

// TODO
const context = makeFancyContext();

const noOp = () => {};
const empty = {};

export const EngraftEditor = (props: EditorProps<unknown, unknown>) => {
  const [program, updateProgram] = useState<ToolProgram>(() =>
    context.makeSlotWithCode("")
  );

  return (
    <ToolWithView
      program={program}
      updateProgram={updateProgram}
      reportOutputState={noOp}
      varBindings={empty}
      expand={true}
      context={context}
    />
  );
};
