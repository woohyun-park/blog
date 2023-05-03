import fs from "fs";
import { SUMMARY, BASE, TARGET_SUMMARY, TARGET_DOC } from "../consts";
import { wrapCatch } from "../utils/error";

function createGroup(summary, group) {
  if (!summary[group]) {
    summary[group] = {};
    if (!fs.existsSync(group))
      fs.mkdir(group, (e) => {
        if (e) throw new Error(`Failed to create ${group}`);
      });
  }
}

function createPage(summary, group, page) {
  if (!summary[group][page]) {
    summary[group][page] = [];
    if (!fs.existsSync(`${group}/${page}`)) {
      fs.mkdir(`${group}/${page}`, (e) => {
        if (e) throw new Error(`Failed to create ${group}/${page}`);
      });
      fs.writeFile(`${group}/${page}/README.md`, `# ${page}\n\n`, (e) => {
        if (e) throw new Error(`Failed to create ${group}/${page}/README.md`);
      });
    }
  }
}

function createSubPage(summary, group, page, subPage) {
  if (!summary[group][page].find((e) => e === subPage)) {
    summary[group][page].push(subPage);
    if (!fs.existsSync(`${group}/${page}/${subPage}.md`)) {
      fs.writeFile(
        `${group}/${page}/${subPage}.md`,
        `# ${subPage}\n\n`,
        (e) => {
          if (e)
            throw new Error(`Failed to create ${group}/${page}/${subPage}.md`);
        }
      );
    }
  }
}

export function createFiles(arg) {
  return wrapCatch(() => {
    if (fs.existsSync(arg)) throw new Error(`${arg} already exists`);
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
    fs.writeFile(TARGET_SUMMARY, JSON.stringify(summary), "utf8", (e) => {
      if (e) throw new Error(`Failed to create ${TARGET_SUMMARY}`);
    });
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
    fs.writeFile(TARGET_DOC, result, "utf8", (e) => {
      if (e) throw new Error(`Failed to create ${TARGET_DOC}`);
    });
  }, TARGET_DOC);
}
