import { ChangeEvent, useState } from "react";
import { useRepo, useDocument } from "@automerge/automerge-repo-react-hooks";
import type { DocHandle } from "@automerge/automerge-repo";
import type { PatchworkViewElement } from "@inkandswitch/patchwork-elements";
import { HasPatchworkMetadata } from "@inkandswitch/patchwork-filesystem/dist/metadata";
import {
  ContactDoc,
  RegisteredContactDoc,
  TinyPatchworkLayoutDoc,
} from "./types";
import {
  automergeUrlToAccountToken,
  accountTokenToAutomergeUrl,
} from "./tokens";
import {
  Button,
  ColorPicker,
  Input,
  Label,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/index";
import { Copy, Eye, EyeOff } from "lucide-react";


// Declare the patchwork-view custom element for TypeScript
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": {
        "doc-url"?: string;
        "tool-id"?: string;
        style?: React.CSSProperties;
      };
    }
  }
}

// 1MB in bytes
const MAX_AVATAR_SIZE = 1024 * 1024;
// TODO: this is bad and flimsy because the localStorage key is defined in the tiny-patchwork layoutDoc
const ACCOUNT_URL_STORAGE_KEY = "tinyPatchworkAccountUrl";

enum AccountPickerTab {
  LogIn = "logIn",
  SignUp = "signUp",
}

type AccountTokenToLoginStatus = null | "valid" | "malformed" | "not-found";

export interface PatchworkToolProps<T> {
  handle: DocHandle<T>;
  element: PatchworkViewElement;
}

export const AccountPicker = (props: PatchworkToolProps<any>) => {
  const repo = useRepo();
  const [currentAccount, changeCurrentAccount] =
    useDocument<TinyPatchworkLayoutDoc>(props.handle.url);
  const [self, changeSelf] = useDocument<ContactDoc>(
    currentAccount?.contactUrl
  );

  const [signupName, setSignupName] = useState<string>("");
  const [activeTab, setActiveTab] = useState<AccountPickerTab>(
    AccountPickerTab.SignUp
  );
  const [showAccountUrl, setShowAccountUrl] = useState(false);
  const [isCopyTooltipOpen, setIsCopyTooltipOpen] = useState(false);

  const [accountTokenToLogin, setAccountTokenToLogin] = useState<string>("");
  const accountAutomergeUrlToLogin =
    accountTokenToAutomergeUrl(accountTokenToLogin);

  const [accountToLogin] = useDocument<TinyPatchworkLayoutDoc>(
    accountAutomergeUrlToLogin
  );
  const [contactToLogin] = useDocument<ContactDoc>(accountToLogin?.contactUrl);

  const accountTokenToLoginStatus: AccountTokenToLoginStatus = (() => {
    if (!accountTokenToLogin || accountTokenToLogin === "") return null;
    if (!accountAutomergeUrlToLogin) return "malformed";
    if (!accountToLogin) return "not-found";
    if (!contactToLogin) return "not-found";
    return "valid";
  })();

  const name = self?.type === "registered" ? self.name : "";
  const currentAccountToken = currentAccount
    ? automergeUrlToAccountToken(props.handle.url, name)
    : null;

  // Direct edit handlers for registered users
  const onNameChange = (newName: string) => {
    if (!currentAccount || !self || self.type !== "registered") return;
    changeSelf((contact: ContactDoc) => {
      if (contact.type === "registered") {
        contact.name = newName;
      }
    });
  };

  const onColorChange = (newColor: string) => {
    if (!currentAccount || !self) return;
    changeSelf((contact: ContactDoc) => {
      (contact as any).color = newColor;
    });
  };

  const onAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!currentAccount || !self || self.type !== "registered") return;

    const avatarFile = !e.target.files ? undefined : e.target.files[0];
    if (!avatarFile) return;

    if (avatarFile.size > MAX_AVATAR_SIZE) {
      alert("Avatar is too large. Please choose a file under 1MB.");
      e.target.value = "";
      return;
    }

    // Create an image document from the file
    const imageHandle = await repo.create2<{
      content: Uint8Array;
      mimeType: string;
    }>();
    const arrayBuffer = await avatarFile.arrayBuffer();
    imageHandle.change((doc) => {
      doc.content = new Uint8Array(arrayBuffer);
      doc.mimeType = avatarFile.type;
      (doc as any).name = avatarFile.name;
      (doc as any).extension = avatarFile.name.split(".").pop() || "";
    });

    changeSelf((contact: ContactDoc) => {
      if (contact.type === "registered") {
        contact.avatarUrl = imageHandle.url;
      }
    });
  };

  const onSignUp = async () => {
    if (!currentAccount || !signupName) return;

    // if there's no contactUrl, create one
    if (!currentAccount.contactUrl) {
      const contactHandle = await repo.create2<
        ContactDoc & HasPatchworkMetadata
      >({
        ["@patchwork"]: { type: "patchwork:contact" },
        type: "anonymous",
      });
      changeCurrentAccount((account: TinyPatchworkLayoutDoc) => {
        account.contactUrl = contactHandle.url;
      });
    }

    changeSelf((contact: ContactDoc) => {
      contact.type = "registered";
      (contact as RegisteredContactDoc).name = signupName;
    });
  };

  const onLogIn = async () => {
    if (!currentAccount || !accountAutomergeUrlToLogin) return;

    localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, accountAutomergeUrlToLogin);
    window.location.replace("/");
  };

  const onLogout = async () => {
    localStorage.removeItem(ACCOUNT_URL_STORAGE_KEY);
    window.location.replace("/");
  };

  const onToggleShowAccountUrl = () => {
    setShowAccountUrl((showAccountUrl) => !showAccountUrl);
  };

  const onCopy = () => {
    if (!currentAccountToken) return;
    navigator.clipboard.writeText(currentAccountToken);
    setIsCopyTooltipOpen(true);
    setTimeout(() => {
      setIsCopyTooltipOpen(false);
    }, 1000);
  };

  const isLoggedIn = self?.type === "registered";
  const canSignUp =
    !isLoggedIn && activeTab === AccountPickerTab.SignUp && signupName;
  const canLogIn =
    !isLoggedIn &&
    activeTab === AccountPickerTab.LogIn &&
    accountTokenToLogin &&
    accountToLogin?.contactUrl &&
    contactToLogin?.type === "registered";

  return (
    <div className="w-full h-full flex flex-col items-center overflow-auto">
      {/* HEADER */}
      <div className="flex flex-col space-y-1.5 text-center sm:text-left items-center">
        {/* TITLE */}
        <div className="text-lg font-semibold leading-none tracking-tight sr-only">
          Account
        </div>
        {/* DESCRIPTION */}
        <div className="text-sm text-muted-foreground sr-only">
          Manage your account settings
        </div>
        {currentAccount?.contactUrl && (
          <patchwork-view
            doc-url={currentAccount.contactUrl}
            tool-id="contact"
          />
        )}
      </div>

      {/* CONTENT */}
      <div className="sm:max-w-[425px]">
        {!isLoggedIn && (
          <Tabs
            defaultValue={AccountPickerTab.SignUp}
            className="w-full"
            onValueChange={(tab) => setActiveTab(tab as AccountPickerTab)}
            value={activeTab}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value={AccountPickerTab.SignUp}>Sign up</TabsTrigger>
              <TabsTrigger value={AccountPickerTab.LogIn}>Log in</TabsTrigger>
            </TabsList>
            <TabsContent value={AccountPickerTab.SignUp}>
              <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={signupName}
                  onChange={(evt) => setSignupName(evt.target.value)}
                  placeholder="Enter your name"
                />
              </div>
            </TabsContent>
            <TabsContent value={AccountPickerTab.LogIn}>
              <form className="grid w-full max-w-sm items-center gap-1.5 py-4">
                <Label htmlFor="accountUrl">Account token</Label>

                <div className="flex gap-1.5">
                  <Input
                    className={`${
                      accountTokenToLoginStatus === "valid"
                        ? "bg-green-100"
                        : ""
                    }`}
                    id="accountUrl"
                    value={accountTokenToLogin}
                    onChange={(evt) => {
                      setAccountTokenToLogin(evt.target.value);
                    }}
                    type={showAccountUrl ? "text" : "password"}
                    autoComplete="current-password"
                  />
                  <Button variant="ghost" onClick={onToggleShowAccountUrl}>
                    {showAccountUrl ? <Eye /> : <EyeOff />}
                  </Button>
                </div>

                <div className="h-8 text-sm text-red-500">
                  {accountTokenToLoginStatus === "malformed" && (
                    <div>
                      Not a valid account token, try copy-pasting again.
                    </div>
                  )}
                  {accountTokenToLoginStatus === "not-found" && (
                    <div>Account not found</div>
                  )}
                </div>

                <p className="text-gray-500 text-justify pb-2 text-sm">
                  To login, paste your account token.
                </p>
                <p className="text-gray-500 text-justify pb-2 text-sm mb-2">
                  You can find your token by accessing the account dialog on any
                  device where you are currently logged in.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        )}

        {/* Color picker for all users (anonymous and registered) */}
        <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
          <ColorPicker value={(self as any)?.color} onChange={onColorChange} />
          <p className="text-sm text-gray-500">
            This color will be used for your cursor and presence indicators in
            collaborative editing.
          </p>
        </div>

        {isLoggedIn && (
          <>
            <div className="grid w-full max-w-sm items-center gap-1.5 py-4">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(evt) => onNameChange(evt.target.value)}
              />
            </div>

            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Avatar</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={onAvatarChange}
              />
            </div>

            <form className="grid w-full max-w-sm items-center gap-1.5 py-4">
              <Label htmlFor="picture">Account token</Label>

              <div className="flex gap-1.5">
                <Input
                  onFocus={(e) => e.target.select()}
                  value={currentAccountToken || ""}
                  id="accountUrl"
                  type={showAccountUrl ? "text" : "password"}
                  readOnly
                  autoComplete="off"
                />

                <Button
                  variant="ghost"
                  onClick={onToggleShowAccountUrl}
                  type="button"
                >
                  {showAccountUrl ? <Eye /> : <EyeOff />}
                </Button>

                <TooltipProvider>
                  <Tooltip open={isCopyTooltipOpen}>
                    <TooltipTrigger
                      type="button"
                      onClick={onCopy}
                      onBlur={() => setIsCopyTooltipOpen(false)}
                    >
                      <Copy />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copied</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <p className="text-gray-500 text-justify pt-2 text-sm">
                To log in on another device, copy your account token and paste
                it into the login screen on the other device.
              </p>
              <p className="text-gray-500 text-justify pt-2 text-sm">
                ⚠️ WARNING: this app has limited security, don't use it for
                private docs.
              </p>
            </form>
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-1.5 pb-4">
        {isLoggedIn ? (
          <Button onClick={onLogout} variant="secondary">
            Sign out
          </Button>
        ) : (
          <Button
            type="submit"
            onClick={activeTab === "signUp" ? onSignUp : onLogIn}
            disabled={!(canSignUp || canLogIn)}
          >
            {activeTab === "signUp"
              ? "Sign up"
              : `Log in${
                  contactToLogin && contactToLogin.type === "registered"
                    ? ` as ${contactToLogin.name}`
                    : ""
                }`}
          </Button>
        )}
      </div>
    </div>
  );
};
