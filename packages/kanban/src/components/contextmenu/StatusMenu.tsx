import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@patchwork/sdk/ui/select";
import { Lane } from "../../datatype";

interface Props {
  lanes: Lane[];
  value: string;
  onSelect?: (laneId: string) => void;
}
export default function SelectLane({ onSelect, lanes, value }: Props) {
  return (
    <Select
      onValueChange={onSelect}
      value={value}
      defaultValue="todo"
      defaultOpen={false}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {lanes.map(({ id, title }) => (
          <SelectItem key={id} value={id}>
            <div className="flex gap-2 items-center">
              <div className="flex-1 overflow-hidde whitespace-nowrap">
                {title}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
