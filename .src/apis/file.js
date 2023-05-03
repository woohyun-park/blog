import fs from "fs";
import { SUMMARY, BASE, TARGET_SUMMARY, TARGET_DOC } from "../consts";
import { wrapCatch } from "../utils/error";

function createGroup(summary, group) {
  if (!summary[group]) {
    summary[group] = {};
    !fs.existsSync(group) && fs.mkdirSync(group);
  }
}

function createPage(summary, group, page) {
  if (!summary[group][page]) {
    summary[group][page] = [];
    if (!fs.existsSync(`${group}/${page}`)) {
      fs.mkdirSync(`${group}/${page}`);
      fs.writeFileSync(`${group}/${page}/README.md`, `# ${page}\n\n`);
    }
  }
}

function createSubPage(summary, group, page, subPage) {
  if (!summary[group][page].find((e) => e === subPage)) {
    summary[group][page].push(subPage);
    if (!fs.existsSync(`${group}/${page}/${subPage}.md`)) {
      fs.writeFileSync(`${group}/${page}/${subPage}.md`, `# ${subPage}\n\n`);
    }
  }
}

export function createFiles(arg) {
  return wrapCatch(() => {
    const summary = { ...SUMMARY };
    const [group, page, subPage] = arg.split("/");
    group && createGroup(summary, group);
    page && createPage(summary, group, page);
    subPage && createSubPage(summary, group, page, subPage);
    return summary;
  }, arg);
}

export function createSummary(summary) {
  wrapCatch(() => {
    fs.writeFileSync(TARGET_SUMMARY, JSON.stringify(summary), "utf8");
  }, TARGET_SUMMARY);
}

export function createDoc(summary) {
  wrapCatch(() => {
    let result = BASE;
    Object.entries(summary).forEach(([c0, lc0]) => {
      result += `\n\n## ${c0}\n`;
      Object.entries(lc0).forEach(([c1, lc1]) => {
        result += `\n- [${c1}](${c0}/${c1}/README.md)`;
        lc1.forEach((c2) => {
          result += `\n  - [${c2}](${c0}/${c1}/${c2}.md)`;
        });
      });
    });
    fs.writeFileSync(TARGET_DOC, result, "utf8");
  }, TARGET_DOC);
}
