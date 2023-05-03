# gitbook을 사용한 블로그 생성

## gitbook을 선택한 이유

예전에 tistory랑 velog를 모두 사용해 봤었는데, tistory는 이슈가 많은 것 같고, velog는 전에 쓰던 계정을 찾을수가 없어서 github pages를 통해서 새롭게 시작하려고 알아보던 도중, gitbook을 사용해서 til을 기록하는분이 있길래 gitbook에 대해서 찾아보니 다음과 같은 이유로 블로그에 사용하기 좋아보였다

* 깃을 통한 히스토리 지원
* 여러 문서를 작성하는 툴로 많이 활용
* 별다른 설정 없이 깔끔한 UI를 제공
* 잔디심기에 조그만 도움

## gitbook 코드로 관리하기

gitbook을 설정하는것은 어렵지 않았는데, gitbook에서 지원하는 에디터는 생각보다 불편했기 때문에 내가 평소에 개발일지를 작성하는 노션에 글을 적고 gitbook으로 옮길 수 있도록 자동화하였다. 완성된 블로그 작성 파이프라인은 다음과 같다.

1. 노션에서 기존에 작성하던 방식으로 개발일지를 작성
2. npm run create을 사용해서 개발일지를 생성\
   e.g. `npm run create documents/gitbook/gitbook을_사용한_블로그_생성`
3. 변경사항을 add하고 commit하면 pre-commit 훅을 통해 자동으로 notion → gitbook 변환
4. commit message를 작성하고 origin/main에 push

## gitbook cli

gitbook에서 지원하는 cli가 없길래 내가 내 블로그 작성환경에 맞게 커스터마이즈하여 간단한 문서 생성과 삭제를 지원하는 create과 delete를 구현하였다.

### gitbook의 구조

gitbook은 데이터를 크게 3가지 계층으로 구분한다.

* **group**: `frameworks`, `documents`가 해당하는 그룹이자 폴더이다.
* **page**: `next.js`, `react.js`, `gitbook`이 해당하는 그룹이며, 폴더와 README.md를 포함한다.
* **subPage**: `gitbook을_사용한_블로그_생성.md`가 해당하는 하위 그룹이며, 실질적인 블로그 포스팅 작성을 하는 파일을 포함한다.

```
blog
├── README.md
├── SUMMARY.md
├── documents
│   └── gitbook
│       ├── README.md
│       └── gitbook을_사용한_블로그_생성.md
└── frameworks
    ├── next.js
    │   └── README.md
    └── react.js
        └── README.md
```

<figure><img src="../../.gitbook/assets/Untitled (2).png" alt=""><figcaption></figcaption></figure>

또한 문서를 생성 또는 삭제할때마다 폴더구조와 함께 SUMMARY.md의 목차도 변경된다.

{% code title="SUMMARY.md" %}
```
# Table of contents

- [woohyun-park](README.md)

## frameworks

- [next.js](frameworks/next.js/README.md)
- [react.js](frameworks/react.js/README.md)

## documents

- [gitbook](documents/gitbook/README.md)
  - [gitbook을_사용한_블로그_생성](documents/gitbook/gitbook을_사용한_블로그_생성.md)
```
{% endcode %}

### 구현방법

따라서 해당 계층구조를 저장할 수 있는 파일을 저장하고 생성 및 삭제시마다 해당 파일을 업데이트하는 방식을 사용하였다.

{% code title="consts/summary.json" %}
```
{"frameworks":{"next.js":[],"react.js":[]},"documents":{"gitbook":["gitbook을_사용한_블로그_생성"]}}
```
{% endcode %}

create와 delete의 실행순서는 다음과 같다.

1. group, page, 또는 subPage 파일을 생성 또는 삭제한다
2. summary.json 파일을 업데이트한다
3. SUMMARY.md 파일을 업데이트한다

#### babel 사용

node.js 환경에서는 import와 export문을 사용할 수 없어서 babel을 통해 트랜스파일링하는 과정을 자동화하였다. convert, create, delete시에 npm run build를 통해 소스파일들을 트랜스파일링하고 해당 작업을 실행한다.

하지만 npm run build를 매번 실행하게 되는데, build할 파일들의 change가 detect 되었을때만 build를 실행할 수 있는 방법을 찾아보면 좋겠다 (다음 단계 1)

{% code title="package.json" %}
```
"scripts": {
  "postinstall": "husky install",
  "convert": "npm run build && node lib/functions/convert.js",
  "create": "npm run build && node lib/functions/create.js",
  "delete": "npm run build && node lib/functions/delete.js",
  "build": "babel .src -d lib --copy-files"
},
```
{% endcode %}

#### 에러 처리

파일을 생성 또는 삭제하는 분기점마다 에러를 throw하고 catch하여 작업이 어디까지 완료되었는지 손쉽게 알 수 있도록 했다.

{% code title="utils/error.js" %}
```
export function wrapCatch(func, target, type = "creat") {
  try {
    const res = func();
    console.log(`${target} has been ${type}ed!`);
    return res;
  } catch (e) {
    throw `Error: ${e.message}`;
  }
}
```
{% endcode %}

{% code title="functions/create.js" %}
```
export function createSummary(summary) {
  wrapCatch(() => {
    fs.writeFile(TARGET_SUMMARY, JSON.stringify(summary), "utf8", (e) => {
      if (e) throw new Error(`Failed to create ${TARGET_SUMMARY}`);
    });
  }, TARGET_SUMMARY);
}
```
{% endcode %}

하지만 현재는 만약 작업이 1, 2, 3이 있다고 했을때 1과 2가 완료되고 3이 완료되지 않아도 1과 2는 완료된 상태로 남아있는데, 추후에 3이 실패하면 1과 2도 이전상태로 돌아가도록 수정해봐야할듯 하다 (다음 단계 2)

#### 폴더 모듈화

팀플을 하다보니 개인 프로젝트를 할 때에도 기능별로 세세하게 모듈화하는게 중요하다고 느껴서 폴더 모듈화에 신경썼다.

* **api**: fs을 사용하는 함수들
* **const**: 각종 상수들
* **functions**: 실질적으로 실행하게 되는 함수들
* **utils**: 전역에서 도움을 줄 수 있는 함수들

```
.src
├── apis
│   ├── create.js
│   ├── delete.js
│   └── index.js
├── consts
│   ├── convert.js
│   ├── create.js
│   ├── index.js
│   ├── summary.json
│   └── target.js
├── functions
│   ├── convert.js
│   ├── create.js
│   └── delete.js
└── utils
    └── error.js
```

## gitbook → notion

notion과 gitbook의 마크다운 형식이 살짝 다른 부분이 있어서 별도의 변환 프로그램을 작성해야 했다.

### 구현방법

#### husky 사용

husky를 사용하여 pre-commit 훅이 작동하여 자동으로 마크다운이 노션 → 깃북으로 변경되고 stage하여 바로 커밋을 할 수 있도록 설정했다.

{% code title=".husky/pre-commit" %}
```
npm run convert && git add .
```
{% endcode %}

#### replace

convert의 경우에는 replace라는 라이브러리를 통해 간단하게 구현했다. option과 regex를 제공하면 알아서 해당 부분을 치환해주는 형식이다.

{% code title="const/convert.js" %}
```
export const OPTION = {
  paths: ["."],
  include: "*.md",
  recursive: true,
  silent: true,
};

export const CALLOUT = {
  regex: `<aside>\n💡 ([\\S\\s]*?)<\/aside>`,
  replacement: `<div data-gb-custom-block data-tag="hint" data-style='info'>\n$1</div>`,
};
```
{% endcode %}

{% code title="functions/convert.js" %}
```
replace({ ...OPTION, ...CODE });
```
{% endcode %}

#### regex

정규표현식은 언제나 어렵다. 노션의 callout을 gitbook의 hit로 변경하는 작업은 aside를 단순하게 hint로 치환하면 되지만, 노션의 code를 gitbook의 code로 변경하는 작업에서는 \`\`\`부분이 겹쳐서 별다른 처리 없이 치환만 하게되면 계속해서 {code}가 늘어나는 현상이 발생했다.

따라서 아래와 같이 {code} 부분을 `()`를 사용해 그룹으로 묶고 `*`을 사용해 해당 부분이 몇번 반복되던지 하나로 합쳐지도록 변경했다.

```
({% raw %}
{% code overflow=['\"]wrap['\"] lineNumbers=['\"]true['\"] %}\n)*
-> {% code overflow='wrap' lineNumbers='true' %}\n→ {% code overflow='wrap' lineNumbers='true' %}
{% endraw %}
```

{% code title="consts/convert.js" %}
````
export const CALLOUT = {
  regex: `<aside>\n💡 ([\\S\\s]*?)<\/aside>`,
  replacement: `<div data-gb-custom-block data-tag="hint" data-style='info'>\n$1</div>`,
};

export const CODE = {
  regex:
    "({% raw %}
{% code overflow=['\"]wrap['\"] lineNumbers=['\"]true['\"] %}\n)*```(.*?)\n([\\S\\s]*?)\n```(\n{% endcode %})*",
  replacement:
    "{% code overflow='wrap' lineNumbers='true' %}\n```\n$3\n```\n{% endcode %}
{% endraw %}",
};
````
{% endcode %}

### 발전 방향

* [ ] 변경사항 감지하여 build
* [ ] batch 작업 구현

## 업데이트

근데 사용해보니 드래그가 안되는것 빼고는 노션이랑 크게 다르지 않고, 코드로 작성할때랑 깃북이랑 연동되지 않는 자잘한 부분들도 많이 있을뿐만 아니라, 결정적으로 노션에서 작성하고 붙여넣었을 때 이미지는 따로 업로드해야한다는 불편함 때문에 그냥 깃북에 적응해보려고 한다...

뻘짓한것 같아서 아쉽지만 그래도 node 환경에서 cli를 간단하게나마 만들어보는 경험, husky를 사용해서 자동화하는 경험 등 평소에 프론트 개발만 할때와는 다른 다층적인 경험들을 해볼 수 있어서 좋았다.

## 태그

\#gitbook #babel #husky #regex #node.js
