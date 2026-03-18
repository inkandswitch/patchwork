const SHARE_BASE = "https://tiny.patchwork.inkandswitch.com/#";

class HashBar extends HTMLElement {
  private pills: HTMLElement | null = null;
  private addBtn: HTMLElement | null = null;
  private copyBtn: HTMLElement | null = null;
  private editing = false;

  connectedCallback() {
    this.render();
    this.syncFromHash();
    window.addEventListener("hashchange", this.onHashChange);
  }

  disconnectedCallback() {
    window.removeEventListener("hashchange", this.onHashChange);
  }

  private onHashChange = () => {
    if (!this.editing) this.syncFromHash();
  };

  private render() {
    this.innerHTML = "";
    const shadow = this;

    const bar = document.createElement("div");
    bar.className = "hash-bar";

    const prefix = document.createElement("span");
    prefix.className = "hash-bar-prefix";
    prefix.textContent = "#";
    bar.appendChild(prefix);

    this.pills = document.createElement("div");
    this.pills.className = "hash-bar-pills";
    bar.appendChild(this.pills);

    this.addBtn = document.createElement("button");
    this.addBtn.className = "hash-bar-add";
    this.addBtn.textContent = "+";
    this.addBtn.title = "Add parameter";
    this.addBtn.addEventListener("click", () => this.addPill("", ""));
    bar.appendChild(this.addBtn);

    this.copyBtn = document.createElement("button");
    this.copyBtn.className = "hash-bar-copy";
    this.copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`;
    this.copyBtn.title = "Copy shareable URL";
    this.copyBtn.addEventListener("click", () => this.copyUrl());
    bar.appendChild(this.copyBtn);

    shadow.appendChild(bar);
  }

  private syncFromHash() {
    if (!this.pills) return;
    this.pills.innerHTML = "";
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const params = new URLSearchParams(hash);
    for (const [key, value] of params) {
      this.addPill(key, value, false);
    }
  }

  private addPill(key: string, value: string, focus = true) {
    if (!this.pills) return;

    const pill = document.createElement("div");
    pill.className = "hash-bar-pill";

    const keyEl = document.createElement("span");
    keyEl.className = "hash-bar-pill-key";
    keyEl.contentEditable = "true";
    keyEl.spellcheck = false;
    keyEl.textContent = key;
    keyEl.dataset.placeholder = "key";

    const eq = document.createElement("span");
    eq.className = "hash-bar-pill-eq";
    eq.textContent = "=";

    const valEl = document.createElement("span");
    valEl.className = "hash-bar-pill-value";
    valEl.contentEditable = "true";
    valEl.spellcheck = false;
    valEl.textContent = value;
    valEl.dataset.placeholder = "value";

    const removeBtn = document.createElement("button");
    removeBtn.className = "hash-bar-pill-remove";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove";
    removeBtn.addEventListener("click", () => {
      pill.remove();
      this.syncToHash();
    });

    pill.appendChild(keyEl);
    pill.appendChild(eq);
    pill.appendChild(valEl);
    pill.appendChild(removeBtn);

    const commitOnChange = () => {
      this.editing = false;
      this.syncToHash();
    };
    const markEditing = () => {
      this.editing = true;
    };

    keyEl.addEventListener("focus", markEditing);
    valEl.addEventListener("focus", markEditing);
    keyEl.addEventListener("blur", commitOnChange);
    valEl.addEventListener("blur", commitOnChange);

    // Enter commits, Tab moves between key/value
    keyEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        valEl.focus();
      }
    });
    valEl.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        valEl.blur();
      }
    });

    this.pills.appendChild(pill);

    if (focus) {
      keyEl.focus();
    }
  }

  private syncToHash() {
    if (!this.pills) return;
    const params = new URLSearchParams();
    for (const pill of this.pills.children) {
      const key = (pill.querySelector(".hash-bar-pill-key") as HTMLElement)
        ?.textContent?.trim();
      const value = (pill.querySelector(".hash-bar-pill-value") as HTMLElement)
        ?.textContent?.trim();
      if (key) {
        params.set(key, value ?? "");
      }
    }
    const newHash = params.toString();
    if (window.location.hash.slice(1) !== newHash) {
      window.location.hash = newHash;
    }
  }

  private async copyUrl() {
    const hash = window.location.hash.slice(1);
    const url = SHARE_BASE + hash;
    try {
      await navigator.clipboard.writeText(url);
      this.copyBtn!.classList.add("hash-bar-copy-ok");
      setTimeout(() => this.copyBtn!.classList.remove("hash-bar-copy-ok"), 1200);
    } catch {
      prompt("Copy this URL:", url);
    }
  }
}

customElements.define("hash-bar", HashBar);
