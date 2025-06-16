import { PluginDescription } from "@patchwork/sdk";

export const GenericPlugin = ({ plugin }: { plugin: PluginDescription }) => {
  return (
    <div className="border border-gray-200 rounded-md p-4">
      <div className="flex flex-col gap-1">
        <div className="text-gray-700 font-bold">{plugin.name}</div>
        <div className="text-gray-400 text-sm">{plugin.type}</div>
      </div>
    </div>
  );
};
