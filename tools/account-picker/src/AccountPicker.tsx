import { createSignal, createMemo, Show } from "solid-js";
import {
  useDocument,
  makeDocumentProjection,
} from "@automerge/automerge-repo-solid-primitives";
import type { DocHandle, Repo } from "@automerge/automerge-repo";
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
  TooltipTrigger,
} from "./ui/index";

declare module "solid-js" {
  namespace JSX {
    interface IntrinsicElements {
      "patchwork-view": {
        "doc-url"?: string;
        "tool-id"?: string;
        style?: string | JSX.CSSProperties;
      };
    }
  }
}

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
  const currentAccount = makeDocumentProjection<TinyPatchworkLayoutDoc>(
    props.handle
  );
  const [self, selfHandle] = useDocument<ContactDoc>(
    () => currentAccount.contactUrl,
    props.element
  );

  let avatarInputRef: HTMLInputElement | undefined;

  const [signupName, setSignupName] = createSignal("");
  const [activeTab, setActiveTab] = createSignal<string>(
    AccountPickerTab.SignUp
  );
  const [showAccountUrl, setShowAccountUrl] = createSignal(false);
  const [isCopyTooltipOpen, setIsCopyTooltipOpen] = createSignal(false);
  const [isContactCardCopyTooltipOpen, setIsContactCardCopyTooltipOpen] =
    createSignal(false);

  const [accountTokenToLogin, setAccountTokenToLogin] = createSignal("");
  const accountAutomergeUrlToLogin = createMemo(() =>
    accountTokenToAutomergeUrl(accountTokenToLogin())
  );

  const [accountToLogin] = useDocument<TinyPatchworkLayoutDoc>(
    accountAutomergeUrlToLogin
  );
  const [contactToLogin] = useDocument<ContactDoc>(
    () => accountToLogin()?.contactUrl
  );

  const accountTokenToLoginStatus = createMemo<AccountTokenToLoginStatus>(
    () => {
      const token = accountTokenToLogin();
      if (!token || token === "") return null;
      if (!accountAutomergeUrlToLogin()) return "malformed";
      if (!accountToLogin()) return "not-found";
      if (!contactToLogin()) return "not-found";
      return "valid";
    }
  );

  const name = () => {
    const s = self();
    return s?.type === "registered" ? s.name : "";
  };

  const currentAccountToken = createMemo(() => {
    return currentAccount
      ? automergeUrlToAccountToken(props.handle.url, name())
      : null;
  });

  const onNameChange = (newName: string) => {
    const s = self();
    if (!currentAccount || !s || s.type !== "registered") return;
    selfHandle()?.change((contact: ContactDoc) => {
      if (contact.type === "registered") {
        contact.name = newName;
      }
    });
  };

  const onColorChange = (newColor: string) => {
    const s = self();
    if (!currentAccount || !s) return;
    selfHandle()?.change((contact: ContactDoc) => {
      (contact as any).color = newColor;
    });
  };

  const onAvatarChange = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const s = self();
    if (!currentAccount || !s || s.type !== "registered") return;

    const avatarFile = !target.files ? undefined : target.files[0];
    if (!avatarFile) return;

    const compressed = await compressAvatar(avatarFile);
    if (!compressed) return;

    const repo = props.element.repo as Repo;
    const imageHandle = await repo.create2<{
      content: Uint8Array;
      mimeType: string;
    }>();
    imageHandle.change((doc) => {
      doc.content = compressed.content;
      doc.mimeType = compressed.mimeType;
      (doc as any).name = avatarFile.name;
      (doc as any).extension = "webp";
    });

    selfHandle()?.change((contact: ContactDoc) => {
      if (contact.type === "registered") {
        contact.avatarUrl = imageHandle.url;
      }
    });
  };

  const onSignUp = async () => {
    if (!currentAccount || !signupName()) return;

    if (!currentAccount.contactUrl) {
      const repo = props.element.repo as Repo;
      const contactHandle = await repo.create2<
        ContactDoc & HasPatchworkMetadata
      >({
        ["@patchwork"]: { type: "patchwork:contact" },
        type: "anonymous",
      });
      props.handle.change((account: TinyPatchworkLayoutDoc) => {
        account.contactUrl = contactHandle.url;
      });
    }

    selfHandle()?.change((contact: ContactDoc) => {
      contact.type = "registered";
      (contact as RegisteredContactDoc).name = signupName();
    });
  };

  const onLogIn = async () => {
    const url = accountAutomergeUrlToLogin();
    if (!currentAccount || !url) return;
    localStorage.setItem(ACCOUNT_URL_STORAGE_KEY, url);
    window.location.replace("/");
  };

  const onLogout = async () => {
    localStorage.removeItem(ACCOUNT_URL_STORAGE_KEY);
    window.location.replace("/");
  };

  const onToggleShowAccountUrl = () => {
    setShowAccountUrl((prev) => !prev);
  };

  const onCopy = () => {
    const token = currentAccountToken();
    if (!token) return;
    navigator.clipboard.writeText(token);
    setIsCopyTooltipOpen(true);
    setTimeout(() => setIsCopyTooltipOpen(false), 1000);
  };

  const onCopyContactCard = () => {
    const hive = props.element.hive;
    if (!hive?.active?.contactCard) return;
    const contactCardJson = hive.active.contactCard.toJson();
    navigator.clipboard.writeText(contactCardJson);
    setIsContactCardCopyTooltipOpen(true);
    setTimeout(() => setIsContactCardCopyTooltipOpen(false), 1000);
  };

  const isLoggedIn = () => self()?.type === "registered";
  const canSignUp = () =>
    !isLoggedIn() && activeTab() === AccountPickerTab.SignUp && signupName();
  const canLogIn = () =>
    !isLoggedIn() &&
    activeTab() === AccountPickerTab.LogIn &&
    accountTokenToLogin() &&
    accountToLogin()?.contactUrl &&
    contactToLogin()?.type === "registered";

  return (
    <div class="account-picker">
      {/* HEADER */}
      <div class="header">
        <div class="sr-only">Account</div>
        <div class="sr-only">Manage your account settings</div>
        <Show when={currentAccount?.contactUrl}>
          <input
            ref={(el) => (avatarInputRef = el)}
            type="file"
            accept="image/*"
            class="sr-only"
            onChange={onAvatarChange}
          />
          <button
            type="button"
            class={`avatar-button${isLoggedIn() ? "" : " disabled"}`}
            onClick={() => isLoggedIn() && avatarInputRef?.click()}
            title={isLoggedIn() ? "Click to change avatar" : undefined}
          >
            <patchwork-view
              doc-url={currentAccount.contactUrl}
              tool-id="contact"
            />
          </button>
        </Show>
      </div>

      {/* CONTENT */}
      <div class="content">
        <Show when={!isLoggedIn()}>
          <Tabs
            defaultValue={AccountPickerTab.SignUp}
            onChange={(tab: string) => setActiveTab(tab)}
            value={activeTab()}
          >
            <TabsList class="tabs-list">
              <TabsTrigger value={AccountPickerTab.SignUp} class="tabs-trigger">
                Sign up
              </TabsTrigger>
              <TabsTrigger value={AccountPickerTab.LogIn} class="tabs-trigger">
                Log in
              </TabsTrigger>
            </TabsList>
            <TabsContent value={AccountPickerTab.SignUp} class="tabs-content">
              <div class="field-group">
                <Label for="name">Name</Label>
                <Input
                  id="name"
                  value={signupName()}
                  onInput={(e) => setSignupName(e.currentTarget.value)}
                  placeholder="Enter your name"
                />
              </div>
            </TabsContent>
            <TabsContent value={AccountPickerTab.LogIn} class="tabs-content">
              <form class="field-group">
                <Label for="accountUrl">Account token</Label>

                <div class="input-row">
                  <Input
                    class={accountTokenToLoginStatus() === "valid" ? "valid" : ""}
                    id="accountUrl"
                    value={accountTokenToLogin()}
                    onInput={(e) =>
                      setAccountTokenToLogin(e.currentTarget.value)
                    }
                    type={showAccountUrl() ? "text" : "password"}
                    autocomplete="current-password"
                  />
                  <Button variant="ghost" onClick={onToggleShowAccountUrl}>
                    <Show when={showAccountUrl()} fallback={<EyeOffIcon />}>
                      <EyeIcon />
                    </Show>
                  </Button>
                </div>

                <div class="error-text">
                  <Show when={accountTokenToLoginStatus() === "malformed"}>
                    <div>
                      Not a valid account token, try copy-pasting again.
                    </div>
                  </Show>
                  <Show when={accountTokenToLoginStatus() === "not-found"}>
                    <div>Account not found</div>
                  </Show>
                </div>

                <p class="hint">
                  To login, paste your account token.
                </p>
                <p class="hint">
                  You can find your token by accessing the account dialog on any
                  device where you are currently logged in.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </Show>

        {/* Color picker for all users */}
        <div class="field-group">
          <ColorPicker
            value={(self() as any)?.color}
            onChange={onColorChange}
          />
          <p class="hint">
            This color will be used for your cursor and presence indicators in
            collaborative editing.
          </p>
        </div>

        <Show when={isLoggedIn()}>
          <div class="field-group">
            <Label for="name">Name</Label>
            <Input
              id="name"
              value={name()}
              onInput={(e) => onNameChange(e.currentTarget.value)}
            />
          </div>

          <form class="field-group">
            <Label for="accountUrl">Account token</Label>

            <div class="input-row">
              <Input
                onFocus={(e) => e.currentTarget.select()}
                value={currentAccountToken() || ""}
                id="accountUrl"
                type={showAccountUrl() ? "text" : "password"}
                readOnly
                autocomplete="off"
              />

              <Button
                variant="ghost"
                onClick={onToggleShowAccountUrl}
                type="button"
              >
                <Show when={showAccountUrl()} fallback={<EyeOffIcon />}>
                  <EyeIcon />
                </Show>
              </Button>

              <Tooltip open={isCopyTooltipOpen()}>
                <TooltipTrigger
                  type="button"
                  onClick={onCopy}
                  onBlur={() => setIsCopyTooltipOpen(false)}
                  class="tooltip-trigger"
                >
                  <CopyIcon />
                </TooltipTrigger>
                <TooltipContent class="tooltip-content">
                  <p>Copied</p>
                </TooltipContent>
              </Tooltip>
            </div>

            <p class="hint">
              To log in on another device, copy your account token and paste it
              into the login screen on the other device.
            </p>
            <p class="hint">
              Warning: this app has limited security, don't use it for
              private docs.
            </p>
          </form>

          <Show when={props.element.hive?.active?.contactCard}>
            <div class="field-group">
              <Label>Contact Card</Label>
              <p class="hint">
                To share a document with someone, they'll need your contact
                card. Copy it and send it to them.
              </p>
              <Tooltip open={isContactCardCopyTooltipOpen()}>
                <TooltipTrigger
                  as="div"
                  onClick={onCopyContactCard}
                  onBlur={() => setIsContactCardCopyTooltipOpen(false)}
                >
                  <Button variant="outline" type="button" class="wide">
                    <CopyIcon class="icon-inline" />
                    Copy Contact Card
                  </Button>
                </TooltipTrigger>
                <TooltipContent class="tooltip-content">
                  <p>Copied</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </Show>
        </Show>
      </div>

      {/* FOOTER */}
      <div class="footer">
        <Show
          when={isLoggedIn()}
          fallback={
            <Button
              type="submit"
              onClick={activeTab() === "signUp" ? onSignUp : onLogIn}
              disabled={!(canSignUp() || canLogIn())}
            >
              {activeTab() === "signUp"
                ? "Sign up"
                : `Log in${
                    contactToLogin()?.type === "registered"
                      ? ` as ${(contactToLogin() as RegisteredContactDoc).name}`
                      : ""
                  }`}
            </Button>
          }
        >
          <Button onClick={onLogout} variant="secondary">
            Sign out
          </Button>
        </Show>
      </div>
    </div>
  );
};

const AVATAR_MAX_SIZE = 512;

async function compressAvatar(
  file: File
): Promise<{ content: Uint8Array; mimeType: string } | undefined> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, AVATAR_MAX_SIZE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await canvas.convertToBlob({ type: "image/webp", quality: 0.8 });
  const buffer = await blob.arrayBuffer();
  return { content: new Uint8Array(buffer), mimeType: "image/webp" };
}

// Inline SVG icon components

function EyeIcon() {
  return (
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      class="icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
      <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
      <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
      <path d="m2 2 20 20" />
    </svg>
  );
}

function CopyIcon(props: { class?: string }) {
  return (
    <svg
      class={props.class ?? "icon"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}
