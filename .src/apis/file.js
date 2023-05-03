import fs from "fs";
import { SUMMARY, BASE, TARGET_SUMMARY, TARGET_DOC } from "../consts";
import { wrapCatch } from "../utils/error";

function createGroup(summary, group) {
  if (!summary[group]) {
    summary[group] = {};
    if (!fs.existsSync(group))
      if (!fs.mkdirSync(group)) throw new Error(`Failed to create ${group}`);
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
