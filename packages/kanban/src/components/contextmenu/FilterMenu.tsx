import { Portal } from "../Portal";
import { ReactNode, useState } from "react";
import { ContextMenuTrigger } from "@firefox-devtools/react-contextmenu";
import { BsCheck2 } from "react-icons/bs";
import { Menu } from "./menu";
import { useFilterState } from "../../utils/filterState";
import { StatusOptions } from "../../types/issue";
import React from "react";

interface Props {
  id: string;
  button: ReactNode;
  className?: string;
}

function FilterMenu({ id, button, className }: Props) {
  const [filterState, setFilterState] = useFilterState();
  const [keyword, setKeyword] = useState("");

  /*
  let priorities = PriorityOptions;
  if (keyword !== "") {
    const normalizedKeyword = keyword.toLowerCase().trim();
    priorities = priorities.filter(
      ([_icon, _priority, label]) =>
        (label as string).toLowerCase().indexOf(normalizedKeyword) !== -1
    );
  }*/

  let statuses = StatusOptions;
  if (keyword !== "") {
    const normalizedKeyword = keyword.toLowerCase().trim();
    statuses = statuses.filter(
      ({ label }) => label.toLowerCase().indexOf(normalizedKeyword) !== -1
    );
  }

  /*
  const priorityOptions = priorities.map(([Icon, priority, label], idx) => {
    return (
      <Menu.Item
        key={`priority-${idx}`}
        onClick={() => handlePrioritySelect(priority as string)}
      >
        <Icon className="mr-3" />
        <span>{label}</span>
        {filterState.priority?.includes(priority) && (
          <BsCheck2 className="ml-auto" />
        )}
      </Menu.Item>
    );
  });*/

  const statusOptions = statuses.map(({ icon, id, label }, idx) => {
    return (
      <Menu.Item
        key={`status-${idx}`}
        onClick={() => handleStatusSelect(id as string)}
      >
        {React.createElement(icon, { className: "mr-3" })}
        <span>{label}</span>
        {filterState.status?.includes(id) && <BsCheck2 className="ml-auto" />}
      </Menu.Item>
    );
  });

  const handlePrioritySelect = (priority: string) => {
    setKeyword("");
    const newPriority = filterState.priority || [];
    if (newPriority.includes(priority)) {
      newPriority.splice(newPriority.indexOf(priority), 1);
    } else {
      newPriority.push(priority);
    }
    setFilterState({
      ...filterState,
      priority: newPriority,
    });
  };

  const handleStatusSelect = (status: string) => {
    setKeyword("");
    const newStatus = filterState.status || [];
    if (newStatus.includes(status)) {
      newStatus.splice(newStatus.indexOf(status), 1);
    } else {
      newStatus.push(status);
    }
    setFilterState({
      ...filterState,
      status: newStatus,
    });
  };

  return (
    <>
      <ContextMenuTrigger id={id} holdToDisplay={1}>
        {button}
      </ContextMenuTrigger>

      <Portal>
        <Menu
          id={id}
          size="normal"
          filterKeyword={false}
          className={className}
          searchPlaceholder="Filter by..."
          onKeywordChange={(kw) => setKeyword(kw)}
        >
          {statusOptions && <Menu.Header>Status</Menu.Header>}
          {statusOptions}
        </Menu>
      </Portal>
    </>
  );
}

export default FilterMenu;
