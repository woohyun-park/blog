const replace = require("replace");

const OPTION = {
  paths: ["."],
  include: "*.md",
  recursive: true,
  silent: true,
};

function convertCalloutToHint() {
  replace({
    ...OPTION,
    regex: `<aside>\n💡 ([\\S\\s]*?)<\/aside>`,
    replacement: `{% hint style="info" %}\n$1{% endhint %}`,
  });
}
function convertCodeSnippet() {
  replace({
    ...OPTION,
    regex:
      "({% code overflow='wrap' lineNumbers='true' %}\n)*```([\\S\\s]*?)\n```(\n{% endcode %})*",
    replacement:
      "{% code overflow='wrap' lineNumbers='true' %}\n```$2\n```\n{% endcode %}",
  });
}

function convertNotionToGitbook() {
  convertCalloutToHint();
  convertCodeSnippet();
}

convertNotionToGitbook();
