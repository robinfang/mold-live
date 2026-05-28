import "./style.css";
import { Store, createDefaultState } from "./state/store";
import { loadMold } from "./wasm/loader";
import { EXAMPLES, DEFAULT_EXAMPLE_ID } from "./examples";
import {
  setupLayout,
  initOutputPanel,
  initHeaders,
} from "./ui/layout";
import { initTopbar } from "./ui/topbar";
import { createStatusbar } from "./ui/statusbar";
import { renderTemplate } from "./state/render";
import { debounce } from "./utils/debounce";
import { initUrlSync, initUrlWriter } from "./state/url-sync";
import type { Example } from "./examples";

async function main() {
  const defaults = createDefaultState();
  const defaultExample = EXAMPLES.find((e) => e.id === DEFAULT_EXAMPLE_ID);
  if (defaultExample) {
    defaults.template = defaultExample.template;
    defaults.dataJson = defaultExample.dataJson;
    defaults.outputMode = defaultExample.outputMode;
    defaults.activeExample = DEFAULT_EXAMPLE_ID;
  }

  const store = new Store(defaults);
  initUrlSync(store);

  initHeaders(store);

  const { renderer, wasmSizeKb } = await loadMold();
  store.set({ wasmReady: true, wasmSizeKb });

  const doRender = debounce(
    () => renderTemplate(renderer, store),
    150,
  );

  setupLayout(store, doRender);
  initOutputPanel(store);
  createStatusbar(store);

  function switchExample(ex: Example): void {
    store.set({
      template: ex.template,
      dataJson: ex.dataJson,
      outputMode: ex.outputMode,
      activeExample: ex.id,
      error: null,
      output: "",
    });
    renderTemplate(renderer, store);
  }

  initTopbar(store, switchExample);
  initUrlWriter(store);

  renderTemplate(renderer, store);
}

main();
