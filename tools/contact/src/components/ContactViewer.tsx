import { type AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import { type ContactDoc } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
import { User as UserIcon } from "lucide-react";
import { automergeUrlToServiceWorkerUrl } from "@inkandswitch/patchwork-filesystem";

export const ContactViewer = ({ docUrl }: { docUrl: AutomergeUrl }) => {
  const [contact] = useDocument<ContactDoc>(docUrl);

  const avatarHandle = useDocHandle(
    contact?.type === "registered" ? contact.avatarUrl : undefined
  );
  const avatarImgUrl =
    avatarHandle && automergeUrlToServiceWorkerUrl(avatarHandle.url);

  if (!contact) {
    return <div className="p-4">Loading contact...</div>;
  }

  const name = contact.type === "registered" ? contact.name : "Anonymous";
  const isRegistered = contact.type === "registered";

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <Avatar size="lg">
        {isRegistered && avatarImgUrl && (
          <AvatarImage src={avatarImgUrl} alt={name} />
        )}
        <AvatarFallback>
          {isRegistered && name ? (
            <span className="text-2xl">
              {name
                .split(" ")
                .map((word) => word[0])
                .join("")}
            </span>
          ) : (
            <UserIcon size={32} />
          )}
        </AvatarFallback>
      </Avatar>

      <div className="text-center">
        <h2 className="text-xl font-semibold">{name}</h2>
        {!isRegistered && (
          <p className="text-sm text-gray-500 mt-1">Unregistered user</p>
        )}
      </div>
    </div>
  );
};
