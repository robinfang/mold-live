import { hello } from "./hello";
import { email } from "./email";
import { svgCard } from "./svg-card";
import { offlineReport } from "./offline-report";

export interface Example {
  id: string;
  label: string;
  hint: string;
  template: string;
  dataJson: string;
  outputMode: "text" | "svg";
}

export const EXAMPLES: Example[] = [hello, email, svgCard, offlineReport];
export const DEFAULT_EXAMPLE_ID = "hello";
