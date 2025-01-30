import { ContactDoc, RegisteredContactDoc } from "..";
import { AutomergeUrl } from "@automerge/automerge-repo";
import {
  useDocument,
  useDocHandle,
} from "@automerge/automerge-repo-react-hooks";
import { VariantProps } from "class-variance-authority";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  avatarVariants,
} from "../ui/avatar";
import { User as UserIcon } from "lucide-react";
import { fileHandleToServiceWorkerUrl } from "../files";

interface ContactAvatarProps extends VariantProps<typeof avatarVariants> {
  url?: AutomergeUrl;
  showName?: boolean;
  showImage?: boolean;
  name?: string;
  avatar?: File;
  size: "default" | "sm" | "lg";
}

export const InlineContactAvatar = ({
  url,
  showImage = true,
  showName = true,
}: ContactAvatarProps) => {
  const [maybeAnonymousContact] = useDocument<ContactDoc>(url);
  const [registeredContact] = useDocument<RegisteredContactDoc>(undefined);

  const contact: RegisteredContactDoc | undefined =
    maybeAnonymousContact?.type === "registered"
      ? maybeAnonymousContact
      : registeredContact;

  const avatarHandle = useDocHandle(contact?.avatarUrl);
  const avatarImgUrl =
    avatarHandle && fileHandleToServiceWorkerUrl(avatarHandle);

  const avatarUrl =
    url && contact?.avatarUrl && showImage ? avatarImgUrl : undefined;
  const name = contact?.name;

  return (
    <div className="inline">
      <Avatar size={"sm"} className="inline border-transparent">
        {showImage && (
          <AvatarImage
            src={avatarUrl}
            alt={name}
            className="inline h-4 w-4 align-top rounded-full border-[0.5px] border-neutral-800"
          />
        )}
        <AvatarFallback className="inline h-4 w-4 align-top mt-[1px] mr-1 rounded-full">
          <UserIcon className="inline h-4 w-4 align-top rounded-full" />
        </AvatarFallback>
      </Avatar>

      {showName && <span>{name ?? "Anonymous"}</span>}
    </div>
  );
};
