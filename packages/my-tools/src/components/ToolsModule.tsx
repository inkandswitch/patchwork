import { ToolDescription } from "@patchwork/sdk";
import { Icon } from "@patchwork/sdk/ui";

export const ToolsModule: React.FC<{ tools: ToolDescription[] }> = ({ tools }) => (
  <div className="border rounded p-3">
    <div className="flex items-center gap-2 font-medium mb-2">
      <Icon type="Wrench" size={14} />
      <span>Tools</span>
    </div>
    <ul className="pl-6 space-y-1">
      {tools.map((tool, i) => (
        <li key={i} className="flex items-center gap-2 text-gray-500">
          <Icon type={tool.icon || "Wrench"} size={12} />
          <span>{tool.name}</span>
          {tool.supportedDataTypes && (
            <span className="text-xs">
              (supports:{" "}
              {Array.isArray(tool.supportedDataTypes)
                ? tool.supportedDataTypes.join(", ")
                : "*"}
              )
            </span>
          )}
        </li>
      ))}
    </ul>
  </div>
);
