export const OPTION = {
  paths: ["."],
  include: "*.md",
  recursive: true,
  silent: true,
};

export const CALLOUT = {
  regex: `<aside>\n💡 ([\\S\\s]*?)<\/aside>`,
  replacement: `{% hint style="info" %}\n$1{% endhint %}`,
};

export const CODE = {
  regex:
    "\n({% code overflow='wrap' lineNumbers='true' %}\n)*```.*\n([\\S\\s]*?)\n```(\n{% endcode %})*",
  replacement:
    "\n{% code overflow='wrap' lineNumbers='true' %}\n```\n$2\n```\n{% endcode %}",
};
