import React, { useEffect, useState } from "react";
import { EditorProps, makeTool } from "@patchwork/sdk";
import { useDocument, useHandle } from "@automerge/automerge-repo-react-hooks";
import * as ohm from "ohm-js";
import { Doc } from "./datatype";
import {
  LoadingState,
  ErrorState,
  EditorSection,
  ResultsPanel,
  PageLayout,
} from "./shared-components";

interface RuleInfo {
  name: string;
  description: string;
  template: string;
}

export const Tool: React.FC<EditorProps<Doc, string>> = ({ docUrl }) => {
  const [doc, changeDoc] = useDocument<Doc>(docUrl);
  const handle = useHandle<Doc>(docUrl);
  const [rules, setRules] = useState<RuleInfo[]>([]);
  const [error, setError] = useState<string | undefined>();

  if (!doc || !handle) {
    return <LoadingState />;
  }

  useEffect(() => {
    try {
      const grammar = ohm.grammar(doc.grammar || "");
      // Get all rules from the grammar
      const ruleDict = grammar.rules;
      const ruleInfos: RuleInfo[] = [];

      for (const ruleName in ruleDict) {
        const rule = ruleDict[ruleName];
        const params = rule.formals || [];

        // Extract factors by analyzing the rule's body
        const factors: { name: string; arity: number }[] = [];

        const factorsString = rule.body.toDisplayString();

        let argumentList;
        try {
          argumentList = (rule.body as any)?.toArgumentNameList();
        } catch (e) {
          argumentList = [];
        }

        ruleInfos.push({
          name: ruleName,
          description: factorsString,
          template: `function(${argumentList.join(", ")}) {
  /* your code here */
}`,
        });
      }

      setRules(ruleInfos);
      setError(undefined);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse grammar");
      setRules([]);
    }
  }, [doc.grammar]);

  return (
    <PageLayout title={doc.title || "Untitled Grammar"} error={error}>
      <div className="flex flex-col gap-4 overflow-auto">
        <div className="text-lg font-semibold text-gray-800">Grammar Rules</div>
        {rules.map((rule) => (
          <div key={rule.name} className="border rounded-lg p-4 bg-white">
            <div className="flex items-center gap-2 mb-2">
              <div className="font-medium text-gray-800">{rule.name}</div>
              {rule.description.length > 0 && (
                <div className="text-gray-500 text-sm">{rule.description}</div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="text-sm text-gray-600"></div>
              <pre className="bg-gray-50 p-2 rounded text-sm font-mono overflow-auto">
                {rule.template}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </PageLayout>
  );
};

export const tool = makeTool({
  EditorComponent: Tool,
});
