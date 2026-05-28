import { StreamLanguage } from "@codemirror/language";

const keywords = new Set([
  "if", "else", "for", "in", "endif", "endfor",
  "not", "and", "or", "true", "false", "null",
]);

const filterNames = new Set([
  "upper", "lower", "trim", "default", "join",
  "escape", "safe", "length",
]);

export const moldLanguage = StreamLanguage.define({
  name: "mold",
  startState: () => null,
  token(stream): string | null {
    if (stream.match("{#")) {
      stream.eatWhile((ch: string) => ch !== "#");
      stream.match("#}");
      return "comment";
    }

    if (stream.match("{{")) {
      stream.eatSpace();
      while (!stream.eol()) {
        if (stream.match("}}")) return "variableName";
        if (stream.match("|")) {
          stream.eatSpace();
          const word = stream.match(/^\w+/) as RegExpMatchArray | null;
          if (word && filterNames.has(word[0])) {
            return "function";
          }
          continue;
        }
        if (stream.match(/^"([^"\\]|\\.)*"/)) continue;
        if (stream.match(/^'([^'\\]|\\.)*'/)) continue;
        stream.next();
      }
      return "variableName";
    }

    if (stream.match("{%")) {
      stream.eatSpace();
      const word = stream.match(/^\w+/) as RegExpMatchArray | null;
      if (word && keywords.has(word[0])) {
        stream.eatWhile((ch: string) => ch !== "%" && !/\s/.test(ch));
        stream.match("%}");
        return "keyword";
      }
      while (!stream.eol()) {
        if (stream.match("%}")) return "keyword";
        stream.next();
      }
      return "keyword";
    }

    stream.skipTo("{") || stream.next();
    return null;
  },
  languageData: {
    commentTokens: { block: { open: "{#", close: "#}" } },
  },
});
