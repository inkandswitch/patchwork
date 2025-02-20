import type { CSSProperties } from "react";
import { memo } from "react";
import { Card } from "../../datatype";

interface Props {
  issue: Card;
  style: CSSProperties;
}

function IssueRow({ issue, style }: Props) {
  // todo: not implemented
  return null;
  /*
  const { db } = useElectric()!;
  const navigate = useNavigate();

  const handleChangeStatus = (status: string) => {
    db.issue.update({
      data: {
        status: status,
        modified: new Date(),
      },
      where: {
        id: issue.id,
      },
    });
  };

  const handleChangePriority = (priority: string) => {
    db.issue.update({
      data: {
        priority: priority,
        modified: new Date(),
      },
      where: {
        id: issue.id,
      },
    });
  };

  return (
    <div
      key={issue.id}
      className="flex items-center flex-grow w-full min-w-0 pl-2 pr-8 text-sm border-b border-gray-100 hover:bg-gray-100 h-11 shrink-0"
      id={issue.id}
      onClick={() => navigate(`/issue/${issue.id}`)}
      style={style}
    >
      <div className="shrink-0 ml-4">
        <PriorityMenu
          id={"r-priority-" + issue.id}
          button={<PriorityIcon priority={issue.priority} />}
          onSelect={handleChangePriority}
        />
      </div>
      <div className="shrink-0 ml-3">
        <StatusMenu
          id={"r-status-" + issue.id}
          button={<StatusIcon status={issue.status} />}
          onSelect={handleChangeStatus}
        />
      </div>
      <div className="flex-wrap flex-shrink ml-3 overflow-hidden font-medium line-clamp-1 text-ellipsis">
        {issue.title.slice(0, 3000) || ""}
      </div>
      <div className="shrink-0 hidden w-15 ml-auto font-normal text-gray-500 sm:block whitespace-nowrap">
        {formatDate(issue.created)}
      </div>
      <div className="shrink-0 hidden ml-4 font-normal text-gray-500 sm:block w-15 md:block">
        <Avatar name={issue.username} />
      </div>
    </div>
  );*/
}

const IssueRowMemo = memo(IssueRow);

export default IssueRowMemo;
