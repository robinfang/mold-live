// This playground intentionally trusts user-authored templates.
// Do not embed third-party templates without sanitization.

export function updateOutputView(
  container: HTMLElement,
  output: string,
  mode: "text" | "svg",
): void {
  if (mode === "svg") {
    container.innerHTML = output;
    const svg = container.querySelector("svg");
    if (!svg) {
      container.innerHTML = "";
      const pre = document.createElement("pre");
      pre.className = "whitespace-pre-wrap font-mono text-sm p-3";
      pre.textContent = output;
      container.appendChild(pre);
    }
  } else {
    container.innerHTML = "";
    const pre = document.createElement("pre");
    pre.className = "whitespace-pre-wrap font-mono text-sm p-3";
    pre.textContent = output;
    container.appendChild(pre);
  }
}
