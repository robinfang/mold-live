import { describe, it, expect } from "vitest";
import { Store, createDefaultState } from "./store";

describe("Store", () => {
  it("returns initial state", () => {
    const store = new Store({ template: "hi" });
    expect(store.get().template).toBe("hi");
    expect(store.get().dataJson).toBe("");
  });

  it("set merges partial state", () => {
    const store = new Store();
    store.set({ template: "new" });
    expect(store.get().template).toBe("new");
    expect(store.get().output).toBe("");
  });

  it("notifies subscribers on set", () => {
    const store = new Store();
    let called = false;
    const unsub = store.subscribe((s) => {
      called = true;
      expect(s.template).toBe("changed");
    });
    store.set({ template: "changed" });
    expect(called).toBe(true);
    unsub();
  });

  it("unsubscribe stops notifications", () => {
    const store = new Store();
    let count = 0;
    const unsub = store.subscribe(() => count++);
    store.set({ template: "a" });
    unsub();
    store.set({ template: "b" });
    expect(count).toBe(1);
  });

  it("createDefaultState has correct defaults", () => {
    const state = createDefaultState();
    expect(state.template).toBe("");
    expect(state.dataJson).toBe("");
    expect(state.output).toBe("");
    expect(state.outputMode).toBe("text");
    expect(state.renderMs).toBe(0);
    expect(state.error).toBeNull();
    expect(state.activeExample).toBe("");
    expect(state.wasmReady).toBe(false);
    expect(state.wasmSizeKb).toBe(0);
  });
});
