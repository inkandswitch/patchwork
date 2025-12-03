import { type AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import { type ContactDoc } from "../datatype";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { User as UserIcon } from "lucide-react";
import { automergeUrlToServiceWorkerUrl } from "@patchwork/filesystem";

export const InlineContactAvatar = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [contact] = useDocument<ContactDoc>(docUrl);

  const avatarHandle = useDocHandle(
    contact?.type === "registered" ? contact.avatarUrl : undefined
  );
  const avatarImgUrl =
    avatarHandle && automergeUrlToServiceWorkerUrl(avatarHandle.url);

  if (!contact) {
    return null;
  }

  const name = contact.type === "registered" ? contact.name : "Anonymous";
  const isRegistered = contact.type === "registered";

  return (
    <Avatar size="sm" className="shrink-0">
      {isRegistered && avatarImgUrl && (
        <AvatarImage src={avatarImgUrl} alt={name} />
      )}
      <AvatarFallback>
        {isRegistered && name ? (
          <span className="text-xs">
            {name
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
        ) : (
          <UserIcon size={16} />
        )}
      </AvatarFallback>
    </Avatar>
  );
};
