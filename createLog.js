const BASE = `
# Table of contents

- [woohyun-park](README.md)`;

const { exec, execSync } = require("child_process");
const fs = require("fs");

const summary = require("./SUMMARY.json");
const [c0, c1, c2] = process.argv[2].split("/");

console.log(summary);

if (c0) {
  if (!summary[c0]) {
    summary[c0] = {};
    fs.mkdirSync(`${c0}`);
  }
}
if (c1) {
  if (!summary[c0][c1]) {
    summary[c0][c1] = [];
    fs.mkdirSync(`${c0}/${c1}`);
    fs.writeFileSync(`${c0}/${c1}/README.md`, `# ${c1}\n\n`);
  }
}
if (c2) {
  if (!summary[c0][c1].find((e) => e === c2)) {
    summary[c0][c1].push(c2);
    fs.writeFileSync(`${c0}/${c1}/${c2}.md`, `# ${c2}\n\n`);
  }
}

console.log(summary);

fs.writeFile("SUMMARY.json", JSON.stringify(summary), "utf8", function (err) {
  if (err) {
    console.log("An error occured while writing JSON Object to File.");
    return console.log(err);
  }

  console.log("JSON file has been saved.");
});

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

console.log(result);

fs.writeFile("SUMMARY.md", result, "utf8", function (err) {
  if (err) {
    console.log("An error occured while writing JSON Object to File.");
    return console.log(err);
  }

  console.log("JSON file has been saved.");
});
