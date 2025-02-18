import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCurrentAccount, useSelf, automergeUrlToAccountToken, accountTokenToAutomergeUrl, } from "@patchwork/sdk";
import { useEffect, useState } from "react";
import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger, Input, Label, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@patchwork/sdk/ui";
import { useDocument } from "@automerge/automerge-repo-react-hooks";
import { Copy, Eye, EyeOff } from "lucide-react";
import { ContactAvatar } from "@patchwork/sdk/components";
// 1MB in bytes
const MAX_AVATAR_SIZE = 1024 * 1024;
var AccountPickerTab;
(function (AccountPickerTab) {
    AccountPickerTab["LogIn"] = "logIn";
    AccountPickerTab["SignUp"] = "signUp";
})(AccountPickerTab || (AccountPickerTab = {}));
export const AccountPicker = ({ showName, size = "default", }) => {
    const currentAccount = useCurrentAccount();
    const self = useSelf();
    const [name, setName] = useState("");
    const [avatar, setAvatar] = useState();
    const [activeTab, setActiveTab] = useState(AccountPickerTab.SignUp);
    const [showAccountUrl, setShowAccountUrl] = useState(false);
    const [isCopyTooltipOpen, setIsCopyTooltipOpen] = useState(false);
    const [accountTokenToLogin, setAccountTokenToLogin] = useState("");
    const accountAutomergeUrlToLogin = accountTokenToAutomergeUrl(accountTokenToLogin);
    const [accountToLogin] = useDocument(accountAutomergeUrlToLogin);
    const [contactToLogin] = useDocument(accountToLogin?.contactUrl);
    const accountTokenToLoginStatus = (() => {
        if (!accountTokenToLogin || accountTokenToLogin === "")
            return null;
        if (!accountAutomergeUrlToLogin)
            return "malformed";
        if (!accountToLogin)
            return "not-found";
        if (!contactToLogin)
            return "not-found";
        return "valid";
    })();
    const currentAccountToken = currentAccount
        ? automergeUrlToAccountToken(currentAccount.handle.url, name)
        : null;
    // initialize form values if already logged in
    useEffect(() => {
        if (self && self.type === "registered" && name === "") {
            setName(self.name);
        }
    }, [self, name]);
    const onSubmit = () => {
        switch (activeTab) {
            case AccountPickerTab.LogIn:
                currentAccount.logIn(accountAutomergeUrlToLogin); // TODO: JAH strict fix
                break;
            case AccountPickerTab.SignUp:
                currentAccount.signUp({ name, avatar: avatar }); // TODO: JAH strict fix
                break;
        }
    };
    const onLogout = () => {
        currentAccount.logOut(); // TODO: JAH strict fix
    };
    const onFilesChanged = (e) => {
        const avatarFile = !e.target.files ? undefined : e.target.files[0];
        if (avatarFile.size > MAX_AVATAR_SIZE) {
            // TODO: JAH strict fix
            alert("Avatar is too large. Please choose a file under 1MB.");
            e.target.value = "";
            return;
        }
        setAvatar(avatarFile);
    };
    const onToggleShowAccountUrl = () => {
        setShowAccountUrl((showAccountUrl) => !showAccountUrl);
    };
    const onCopy = () => {
        navigator.clipboard.writeText(currentAccountToken); // TODO: JAH strict fix
        setIsCopyTooltipOpen(true);
        setTimeout(() => {
            setIsCopyTooltipOpen(false);
        }, 1000);
    };
    const isSubmittable = (activeTab === AccountPickerTab.SignUp && name) ||
        (activeTab === AccountPickerTab.LogIn &&
            accountTokenToLogin &&
            accountToLogin?.contactUrl &&
            contactToLogin?.type === "registered");
    const isLoggedIn = self?.type === "registered";
    return (_jsxs(Dialog, { children: [_jsx(DialogTrigger, { children: _jsxs("div", { className: "flex flex-row  text-sm text-gray-600 hover:text-gray-800 ", children: [_jsx(ContactAvatar, { url: currentAccount?.contactHandle.url, size: size }), showName && isLoggedIn && _jsx("div", { className: "ml-2 py-2", children: name }), showName && !isLoggedIn && _jsx("div", { className: "ml-2 py-2", children: "Sign in" })] }) }), _jsxs(DialogContent, { className: "sm:max-w-[425px]", children: [_jsx(DialogHeader, { className: "items-center", children: isLoggedIn ? (_jsx(ContactAvatar, { size: "default", url: currentAccount?.contactHandle.url, name: name, avatar: avatar })) : activeTab === "signUp" ? (_jsx(ContactAvatar, { name: name, avatar: avatar, size: "lg" })) : (_jsx(ContactAvatar, { url: accountToLogin?.contactUrl, size: "lg" })) }), !isLoggedIn && (_jsxs(Tabs, { defaultValue: AccountPickerTab.SignUp, className: "w-full", onValueChange: (tab) => setActiveTab(tab), value: activeTab, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-2", children: [_jsx(TabsTrigger, { value: AccountPickerTab.SignUp, children: "Sign up" }), _jsx(TabsTrigger, { value: AccountPickerTab.LogIn, children: "Log in" })] }), _jsxs(TabsContent, { value: AccountPickerTab.SignUp, children: [_jsxs("div", { className: "grid w-full max-w-sm items-center gap-1.5 py-4", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", value: name, onChange: (evt) => setName(evt.target.value) })] }), _jsxs("div", { className: "grid w-full max-w-sm items-center gap-1.5", children: [_jsx(Label, { htmlFor: "picture", children: "Avatar" }), _jsx(Input, { id: "avatar", type: "file", accept: "image/*", onChange: onFilesChanged })] })] }), _jsx(TabsContent, { value: AccountPickerTab.LogIn, children: _jsxs("form", { className: "grid w-full max-w-sm items-center gap-1.5 py-4", children: [_jsx(Label, { htmlFor: "accountUrl", children: "Account token" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Input, { className: `${accountTokenToLoginStatus === "valid"
                                                        ? "bg-green-100"
                                                        : ""}`, id: "accountUrl", value: accountTokenToLogin, onChange: (evt) => {
                                                        setAccountTokenToLogin(evt.target.value);
                                                    }, type: showAccountUrl ? "text" : "password", autoComplete: "current-password" }), _jsx(Button, { variant: "ghost", onClick: onToggleShowAccountUrl, children: showAccountUrl ? _jsx(Eye, {}) : _jsx(EyeOff, {}) })] }), _jsxs("div", { className: "h-8 text-sm text-red-500", children: [accountTokenToLoginStatus === "malformed" && (_jsx("div", { children: "Not a valid account token, try copy-pasting again." })), accountTokenToLoginStatus === "not-found" && (_jsx("div", { children: "Account not found" }))] }), _jsx("p", { className: "text-gray-500 text-justify pb-2 text-sm", children: "To login, paste your account token." }), _jsx("p", { className: "text-gray-500 text-justify pb-2 text-sm mb-2", children: "You can find your token by accessing the account dialog on any device where you are currently logged in." })] }) })] })), isLoggedIn && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid w-full max-w-sm items-center gap-1.5 py-4", children: [_jsx(Label, { htmlFor: "name", children: "Name" }), _jsx(Input, { id: "name", value: name, onChange: (evt) => setName(evt.target.value) })] }), _jsxs("div", { className: "grid w-full max-w-sm items-center gap-1.5", children: [_jsx(Label, { htmlFor: "picture", children: "Avatar" }), _jsx(Input, { id: "avatar", type: "file", accept: "image/*", onChange: onFilesChanged })] }), _jsxs("form", { className: "grid w-full max-w-sm items-center gap-1.5", children: [_jsx(Label, { htmlFor: "picture", children: "Account token" }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Input, { onFocus: (e) => e.target.select(), value: currentAccountToken, id: "accountUrl", type: showAccountUrl ? "text" : "password", accept: "image/*", onChange: onFilesChanged, autoComplete: "off" }), _jsx(Button, { variant: "ghost", onClick: onToggleShowAccountUrl, type: "button", children: showAccountUrl ? _jsx(Eye, {}) : _jsx(EyeOff, {}) }), _jsx(TooltipProvider, { children: _jsxs(Tooltip, { open: isCopyTooltipOpen, children: [_jsx(TooltipTrigger, { type: "button", onClick: onCopy, onBlur: () => setIsCopyTooltipOpen(false), children: _jsx(Copy, {}) }), _jsx(TooltipContent, { children: _jsx("p", { children: "Copied" }) })] }) })] }), _jsx("p", { className: "text-gray-500 text-justify pt-2 text-sm", children: "To log in on another device, copy your account token and paste it into the login screen on the other device." }), _jsx("p", { className: "text-gray-500 text-justify pt-2 text-sm", children: "\u26A0\uFE0F WARNING: this app has limited security, don't use it for private docs." })] })] })), _jsxs(DialogFooter, { className: "gap-1.5", children: [isLoggedIn && (_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { onClick: onLogout, variant: "secondary", children: "Sign out" }) })), _jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { type: "submit", onClick: onSubmit, disabled: !isSubmittable, children: isLoggedIn
                                        ? "Save"
                                        : activeTab === "signUp"
                                            ? "Sign up"
                                            : `Log in${contactToLogin && contactToLogin.type === "registered"
                                                ? ` as ${contactToLogin.name}`
                                                : ""}` }) })] })] })] }));
};
