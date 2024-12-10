import React from "react";

export const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div className="w-full h-full flex items-center justify-center text-red-600 px-8">
      <div className="min-w-0 overflow-x-auto">
        Something went wrong
        <pre className="text-xs">{error.stack}</pre>
      </div>
    </div>
  );
};
