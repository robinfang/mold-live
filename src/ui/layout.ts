import { updateOutputView } from "../editor/output-view";
import type { Store } from "../state/store";
import { EXAMPLES } from "../examples";

interface EditorHandle {
  setDoc(doc: string): void;
  focus(): void;
}

export interface EditorSet {
  template: EditorHandle;
  data: EditorHandle;
}

export function setupLayout(
  store: Store,
  onEdit: () => void,
): EditorSet {
  const templateContainer = document.getElementById("template-editor");
  const dataContainer = document.getElementById("data-editor");
  if (!templateContainer || !dataContainer) {
    throw new Error("Editor containers not found");
  }

  const state = store.get();

  const templateTa = document.createElement("textarea");
  templateTa.className =
    "w-full h-full resize-none bg-transparent text-zinc-200 font-mono text-sm p-3 outline-none border-none";
  templateTa.setAttribute("aria-label", "Template editor");
  templateTa.value = state.template;
  templateContainer.appendChild(templateTa);

  const dataTa = document.createElement("textarea");
  dataTa.className =
    "w-full h-full resize-none bg-transparent text-zinc-200 font-mono text-sm p-3 outline-none border-none";
  dataTa.setAttribute("aria-label", "JSON data editor");
  dataTa.value = state.dataJson;
  dataContainer.appendChild(dataTa);

  templateTa.addEventListener("input", () => {
    store.set({ template: templateTa.value });
    onEdit();
  });
  dataTa.addEventListener("input", () => {
    store.set({ dataJson: dataTa.value });
    onEdit();
  });

  const handle: EditorSet = {
    template: {
      setDoc(doc: string) {
        templateTa.value = doc;
      },
      focus() {
        templateTa.focus();
      },
    },
    data: {
      setDoc(doc: string) {
        dataTa.value = doc;
      },
      focus() {
        dataTa.focus();
      },
    },
  };

  store.subscribe((s) => {
    if (handle.template.setDoc) {
      handle.template.setDoc(s.template);
    }
    if (handle.data.setDoc) {
      handle.data.setDoc(s.dataJson);
    }
  });

  loadCodeMirror(
    templateContainer,
    templateTa,
    dataContainer,
    dataTa,
    handle,
    store,
    onEdit,
  );

  return handle;
}

async function loadCodeMirror(
  templateContainer: HTMLElement,
  templateTa: HTMLTextAreaElement,
  dataContainer: HTMLElement,
  dataTa: HTMLTextAreaElement,
  handle: EditorSet,
  store: Store,
  onEdit: () => void,
): Promise<void> {
  const mod = await import("../editor/editor-loader");
  const state = store.get();

  const templateView = mod.createMoldEditor(
    templateContainer,
    state.template,
    (doc: string) => {
      store.set({ template: doc });
      onEdit();
    },
  );
  templateTa.remove();

  const dataView = mod.createJsonEditor(
    dataContainer,
    state.dataJson,
    (doc: string) => {
      store.set({ dataJson: doc });
      onEdit();
    },
  );
  dataTa.remove();

  handle.template = {
    setDoc(doc: string) {
      mod.updateEditorDoc(templateView, doc);
    },
    focus() {
      templateView.focus();
    },
  };
  handle.data = {
    setDoc(doc: string) {
      mod.updateEditorDoc(dataView, doc);
    },
    focus() {
      dataView.focus();
    },
  };
}

export function initOutputPanel(store: Store): void {
  const outputEl = document.getElementById("output-view");
  if (!outputEl) throw new Error("Output container not found");

  store.subscribe((s) => {
    updateOutputView(outputEl, s.output, s.outputMode);
  });
}

export function initHeaders(store: Store): void {
  const templateHeader = document.getElementById("template-header");
  const dataHeader = document.getElementById("data-header");
  const outputHeader = document.getElementById("output-header");
  const templateEditor = document.getElementById("template-editor");
  const dataEditor = document.getElementById("data-editor");
  const outputView = document.getElementById("output-view");

  function makeMobileCollapsible(
    headerEl: HTMLElement,
    bodyEl: HTMLElement,
    label: string,
    defaultOpen: boolean,
  ): { setHint(hint: string): void } {
    headerEl.innerHTML = "";
    headerEl.className =
      "h-9 border-b border-zinc-800 flex items-center px-3 shrink-0 cursor-pointer md:cursor-default select-none";

    const span = document.createElement("span");
    span.className =
      "text-xs font-medium text-zinc-400 uppercase tracking-wider";
    span.textContent = label;
    headerEl.appendChild(span);

    const hintSpan = document.createElement("span");
    hintSpan.className =
      "hidden md:inline text-xs text-zinc-400 ml-2 truncate";
    headerEl.appendChild(hintSpan);

    function setHint(hint: string) {
      hintSpan.textContent = hint ? `\u2014 ${hint}` : "";
    }

    const chevron = document.createElement("span");
    chevron.className = "ml-auto md:hidden text-zinc-500 text-xs";
    chevron.textContent = defaultOpen ? "\u25B2" : "\u25BC";
    headerEl.appendChild(chevron);

    if (!defaultOpen) {
      bodyEl.classList.add("hidden", "md:block");
    } else {
      bodyEl.classList.add("md:block");
    }
    if (!defaultOpen) {
      bodyEl.classList.add("md:flex", "md:flex-col", "md:flex-1");
    }

    headerEl.addEventListener("click", () => {
      if (window.innerWidth >= 768) return;
      const isHidden = bodyEl.classList.contains("hidden");
      if (isHidden) {
        bodyEl.classList.remove("hidden");
        chevron.textContent = "\u25B2";
      } else {
        bodyEl.classList.add("hidden");
        chevron.textContent = "\u25BC";
      }
    });

    return { setHint };
  }

  const templateHC = templateHeader && templateEditor
    ? makeMobileCollapsible(templateHeader, templateEditor, "Template", false)
    : null;
  const dataHC = dataHeader && dataEditor
    ? makeMobileCollapsible(dataHeader, dataEditor, "Data (JSON)", false)
    : null;
  const outputHC = outputHeader && outputView
    ? makeMobileCollapsible(outputHeader, outputView, "Output", true)
    : null;

  function updateHints() {
    const activeId = store.get().activeExample;
    const ex = EXAMPLES.find((e) => e.id === activeId);
    const hint = ex?.hint ?? "";
    templateHC?.setHint(hint);
    dataHC?.setHint("");
    outputHC?.setHint("");
  }

  updateHints();
  store.subscribe(updateHints);
}
