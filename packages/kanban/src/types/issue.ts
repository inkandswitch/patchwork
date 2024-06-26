import {
  Circle,
  CircleDashed,
  CircleDot,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type React from "react";

export const Status = {
  BACKLOG: "backlog",
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
  CANCELED: "canceled",
};

export const StatusDisplay = {
  [Status.BACKLOG]: "Backlog",
  [Status.TODO]: "To Do",
  [Status.IN_PROGRESS]: "In Progress",
  [Status.DONE]: "Done",
  [Status.CANCELED]: "Canceled",
};

export const StatusIcons = {
  [Status.BACKLOG]: CircleDashed,
  [Status.TODO]: Circle,
  [Status.IN_PROGRESS]: CircleDot,
  [Status.DONE]: CheckCircle,
  [Status.CANCELED]: XCircle,
};

export const StatusOptions: {
  icon: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  id: (typeof Status)[keyof typeof Status];
  label: string;
}[] = [
  {
    icon: StatusIcons[Status.BACKLOG],
    id: Status.BACKLOG,
    label: StatusDisplay[Status.BACKLOG],
  },
  {
    icon: StatusIcons[Status.TODO],
    id: Status.TODO,
    label: StatusDisplay[Status.TODO],
  },
  {
    icon: StatusIcons[Status.IN_PROGRESS],
    id: Status.IN_PROGRESS,
    label: StatusDisplay[Status.IN_PROGRESS],
  },
  {
    icon: StatusIcons[Status.DONE],
    id: Status.DONE,
    label: StatusDisplay[Status.DONE],
  },
  {
    icon: StatusIcons[Status.CANCELED],
    id: Status.CANCELED,
    label: StatusDisplay[Status.CANCELED],
  },
];
