import type { Store } from "../state/store";
import type { Example } from "../examples";
import { EXAMPLES } from "../examples";

function createTopbar(store: Store, onExampleChange: (example: Example) => void): void {
  const topbar = document.getElementById("topbar");
  if (!topbar) return;

  topbar.innerHTML = "";

  const logo = document.createElement("span");
  logo.className = "text-blue-400 font-semibold text-sm mr-4 shrink-0";
  logo.textContent = "mold live";
  topbar.appendChild(logo);

  const tabs = document.createElement("div");
  tabs.className = "flex items-center gap-1 flex-1 overflow-x-auto";

  function renderTabs() {
    tabs.innerHTML = "";
    const activeId = store.get().activeExample;
    for (const ex of EXAMPLES) {
      const btn = document.createElement("button");
      if (ex.id === activeId) {
        btn.className =
          "px-3 py-1.5 rounded text-xs font-medium bg-zinc-800 text-white whitespace-nowrap transition-colors";
      } else {
        btn.className =
          "px-3 py-1.5 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 whitespace-nowrap transition-colors";
      }
      btn.textContent = ex.label;
      btn.onclick = () => onExampleChange(ex);
      tabs.appendChild(btn);
    }
  }

  renderTabs();
  store.subscribe(renderTabs);

  topbar.appendChild(tabs);

  const actions = document.createElement("div");
  actions.className = "flex items-center gap-2 shrink-0";

  const shareBtn = document.createElement("button");
  shareBtn.className =
    "px-3 py-1.5 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors";
  shareBtn.textContent = "Share";
  shareBtn.onclick = () => {
    void navigator.clipboard.writeText(window.location.href);
    showToast("Link copied");
  };
  actions.appendChild(shareBtn);

  const githubLink = document.createElement("a");
  githubLink.className =
    "px-3 py-1.5 rounded text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors";
  githubLink.textContent = "GitHub";
  githubLink.href = "https://github.com/robinfang/mold";
  githubLink.target = "_blank";
  githubLink.rel = "noopener noreferrer";
  actions.appendChild(githubLink);

  topbar.appendChild(actions);
}

function showToast(message: string): void {
  const existing = document.getElementById("mold-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "mold-toast";
  toast.className =
    "fixed bottom-12 left-1/2 -translate-x-1/2 px-4 py-2 rounded bg-zinc-800 text-zinc-200 text-xs shadow-lg z-50";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.remove(), 1500);
}

export function initTopbar(store: Store, onExampleChange: (example: Example) => void): void {
  createTopbar(store, onExampleChange);
}
