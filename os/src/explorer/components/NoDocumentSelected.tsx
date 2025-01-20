import { Button } from "@patchwork/sdk/ui";

export interface NoDocumentSelectedProps {
  addNewDoc: (args: {
    type: string;
    change?: (doc: unknown) => void;
  }) => Promise<void>;
}

export const NoDocumentSelected = ({
  addNewDoc,
}: NoDocumentSelectedProps): React.ReactNode => {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div>
        <p className="text-center cursor-default select-none mb-4">
          No document selected
        </p>
        <Button
          onClick={() => addNewDoc({ type: "essay" })} // Default type for new document
          variant="outline"
        >
          Create new document
          <span className="ml-2">(&#9166;)</span>
        </Button>
      </div>
    </div>
  );
};
