import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { closeBrackets } from "@codemirror/autocomplete";
import { highlightSpecialChars, drawSelection } from "@codemirror/view";

const darkTheme = EditorView.theme(
  {
    "&": {
      backgroundColor: "transparent",
      color: "#d4d4d8",
      fontSize: "14px",
      height: "100%",
    },
    ".cm-content": {
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      caretColor: "#60a5fa",
    },
    ".cm-cursor": { borderLeftColor: "#60a5fa" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground": {
      backgroundColor: "#3b3b5c",
    },
    ".cm-selectionBackground": { backgroundColor: "#3b3b5c" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      color: "#52525b",
      border: "none",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(255,255,255,0.03)",
    },
    ".cm-activeLine": { backgroundColor: "rgba(255,255,255,0.03)" },
  },
  { dark: true },
);

const baseExtensions = [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  EditorState.allowMultipleSelections.of(true),
  indentUnit.of("  "),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  closeBrackets(),
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
  darkTheme,
  EditorView.lineWrapping,
];

export function createEditor(
  parent: HTMLElement,
  initialDoc: string,
  onUpdate?: (doc: string) => void,
  extensions: readonly unknown[] = [],
): EditorView {
  const updateListener = EditorView.updateListener.of((update) => {
    if (update.docChanged && onUpdate) {
      onUpdate(update.state.doc.toString());
    }
  });

  const view = new EditorView({
    state: EditorState.create({
      doc: initialDoc,
      extensions: [
        ...baseExtensions,
        updateListener,
        placeholder(""),
        ...(extensions as []),
      ],
    }),
    parent,
  });

  return view;
}

export function updateEditorDoc(view: EditorView, doc: string): void {
  if (view.state.doc.toString() !== doc) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: doc },
    });
  }
}

export type { EditorView };
