import fs from "fs";
import { SUMMARY } from "../consts";
import { wrapCatch } from "../utils/error";

function deleteSubPage(arg, summary) {
  const [group, page, subPage] = arg.split("/");
  if (!fs.existsSync(`${arg}.md`)) throw new Error(`${arg} does not exist`);
  fs.rm(`${arg}.md`, { recursive: true, force: true }, (e) => {
    if (e) throw new Error(`Failed to delete ${arg}`);
  });
  summary[group][page] = summary[group][page].filter((e) => e !== subPage);
}

function deletePage(arg, summary) {
  const [group, page, subPage] = arg.split("/");
  if (!fs.existsSync(arg)) throw new Error(`${arg} does not exist`);
  fs.rm(arg, { recursive: true, force: true }, (e) => {
    if (e) throw new Error(`Failed to delete ${arg}`);
  });
  delete summary[group][page];
}

function deleteGroup(arg, summary) {
  const [group, page, subPage] = arg.split("/");
  if (!fs.existsSync(arg)) throw new Error(`${arg} does not exist`);
  fs.rm(arg, { recursive: true, force: true }, (e) => {
    if (e) throw new Error(`Failed to delete ${arg}`);
  });
  delete summary[group];
}

export function deleteFiles(arg) {
  return wrapCatch(
    () => {
      const summary = { ...SUMMARY };
      const [group, page, subPage] = arg.split("/");
      if (subPage) deleteSubPage(arg, summary);
      else if (page) deletePage(arg, summary);
      else if (group) deleteGroup(arg, summary);
      fs.rm(arg, { recursive: true, force: true }, (e) => {
        if (e) throw new Error(`Failed to delete ${arg}`);
      });
      return summary;
    },
    arg,
    "delet"
  );
}
