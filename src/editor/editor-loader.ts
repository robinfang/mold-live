import { EditorView, keymap, placeholder } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
} from "@codemirror/commands";
import { indentUnit } from "@codemirror/language";
import {
  syntaxHighlighting,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { closeBrackets } from "@codemirror/autocomplete";
import { highlightSpecialChars, drawSelection } from "@codemirror/view";
import { json } from "@codemirror/lang-json";
import { moldLanguage } from "./mold-syntax";

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
  syntaxHighlighting(
    HighlightStyle.define([
      { tag: tags.keyword, color: "#c678dd", fontWeight: "bold" },
      { tag: tags.string, color: "#98c379" },
      { tag: tags.number, color: "#d19a66" },
      { tag: tags.bool, color: "#d19a66" },
      { tag: tags.null, color: "#d19a66" },
      { tag: tags.comment, color: "#5c6370", fontStyle: "italic" },
      { tag: tags.variableName, color: "#61afef" },
      { tag: tags.function(tags.variableName), color: "#e5c07b" },
      { tag: tags.operator, color: "#56b6c2" },
      { tag: tags.bracket, color: "#abb2bf" },
      { tag: tags.meta, color: "#abb2bf" },
    ]),
  ),
  closeBrackets(),
  keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
  darkTheme,
  EditorView.lineWrapping,
];

function createEditor(
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

export function createMoldEditor(
  parent: HTMLElement,
  doc: string,
  onUpdate?: (doc: string) => void,
): EditorView {
  return createEditor(parent, doc, onUpdate, [moldLanguage]);
}

export function createJsonEditor(
  parent: HTMLElement,
  doc: string,
  onUpdate?: (doc: string) => void,
): EditorView {
  return createEditor(parent, doc, onUpdate, [json()]);
}

export function updateEditorDoc(view: EditorView, doc: string): void {
  if (view.state.doc.toString() !== doc) {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: doc },
    });
  }
}

export type { EditorView };
