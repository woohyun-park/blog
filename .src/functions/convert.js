import replace from "replace";
import { OPTION, CALLOUT, CODE } from "../consts";

function convertNotionToGitbook() {
  replace({ ...OPTION, ...CALLOUT });
  replace({ ...OPTION, ...CODE });
}

convertNotionToGitbook();
