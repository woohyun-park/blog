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
    "({% code overflow='wrap' lineNumbers='true' %}\n)*```([\\S\\s]*?)\n```(\n{% endcode %})*",
  replacement:
    "{% code overflow='wrap' lineNumbers='true' %}\n```$2\n```\n{% endcode %}",
};
