import { ChangeEvent, useState } from "react";
import { createPortal } from "react-dom";
import { useRepo } from "@automerge/automerge-repo-react-hooks";
import { useSelf, useCurrentAccount } from "./hooks";
import { signUp, logIn, logOut } from "./operations";
import {
  automergeUrlToAccountToken,
  accountTokenToAutomergeUrl,
} from "./tokens";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { ContactDoc, RegisteredContactDoc, TinyPatchworkLayoutDoc } from "./types";
import "./styles.css";
import {
  Button,
  ColorPicker,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

// TODO: is this already declared for us elsewhere?
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

enum AccountPickerTab {
  LogIn = "logIn",
  SignUp = "signUp",
}

type AccountTokenToLoginStatus = null | "valid" | "malformed" | "not-found";

export const AccountPicker = ({
  showName,
}: {
  showName?: boolean;
}) => {
  const [currentAccount] = useCurrentAccount();
  const repo = useRepo();
  const [self, changeSelf] = useSelf();

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
  ? automergeUrlToAccountToken(window.accountDocHandle.url, name)
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

    // TODO: replace this properly; this is the big patchwork code
    // const avatarHandle = await createDocFromFile(avatarFile, repo);

    // TODO: replace this properly; this is the LLM code
    // Create an image document from the file
    const imageHandle = await repo.create2<{ data: Uint8Array; mimeType: string }>();
    const arrayBuffer = await avatarFile.arrayBuffer();
    imageHandle.change((doc) => {
      (doc as any).data = new Uint8Array(arrayBuffer);
      (doc as any).mimeType = avatarFile.type;
      (doc as any)["@patchwork"] = { type: "image" };
    });

    changeSelf((contact: ContactDoc) => {
      if (contact.type === "registered") {
        contact.avatarUrl = imageHandle.url;
      }
    });
  };

  const onSignUp = async () => {
    if (!currentAccount || !signupName) return;
    // TODO: clean up LLM code
    // await signUp(repo, signupName);
    // setIsDialogOpen(false);
    changeSelf((contact: ContactDoc) => {
      contact.type = "registered";
      (contact as RegisteredContactDoc).name = signupName;
    });
  };

  const onLogIn = async () => {
    if (!currentAccount || !accountAutomergeUrlToLogin) return;
    // TODO: check LLM replacement
    await logIn(accountAutomergeUrlToLogin);
  };

  const onLogout = async () => {
    // TODO: check LLM replacement
    await logOut(repo);
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
  const canSignUp = !isLoggedIn && activeTab === AccountPickerTab.SignUp && signupName;
  const canLogIn =
    !isLoggedIn &&
    activeTab === AccountPickerTab.LogIn &&
    accountTokenToLogin &&
    accountToLogin?.contactUrl &&
    contactToLogin?.type === "registered";

  return (
    <Dialog>
      <DialogTrigger>
        <div className="flex flex-row  text-sm text-gray-600 hover:text-gray-800 ">
          {currentAccount?.contactUrl ? (
            <patchwork-view
              doc-url={currentAccount.contactUrl}
              tool-id="contact-avatar"
              // TODO: fix sizing styles
              // className="h-8 w-8"
            />
          ) : (
            <div className="h-8 w-8" />
          )}
          {showName && isLoggedIn && <div className="ml-2 py-2">{name}</div>}
          {showName && !isLoggedIn && <div className="ml-2 py-2">Sign in</div>}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="items-center">
          <DialogTitle className="sr-only">Account</DialogTitle>
          <DialogDescription className="sr-only">
            Manage your account settings
          </DialogDescription>
          {currentAccount?.contactUrl && (
            <patchwork-view
            doc-url={currentAccount.contactUrl}
            tool-id="contact"
            />
          )}
        </DialogHeader>

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

            <form className="grid w-full max-w-sm items-center gap-1.5">
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
        <DialogFooter className="gap-1.5">
          {isLoggedIn ? (
            <DialogTrigger asChild>
              <Button onClick={onLogout} variant="secondary">
                Sign out
              </Button>
            </DialogTrigger>
          ) : (
            <DialogTrigger asChild>
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
            </DialogTrigger>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
