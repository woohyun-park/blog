# \[아카이브] jest, testing-library, 그리고 storybook 도입

아카이브라는 개인 프로젝트를 기능추가 및 리팩토링을 하면서 발전시켜나가고 있는데, 리팩토링 전에 컴포넌트들에 대한 테스트 코드 작성이 필요할 것 같다는 생각이 들었다. 또한 현재 명확한 구조 없이 나뉘어져있는 컴포넌트들을 atomic design을 활용하여 재분류하고, 프론트엔드에서 많이 사용하는 Jest와 react-testing-library, 그리고 storybook을 통해 체계적으로 관리해보면 어떨까 하여 해당 기술들을 도입하는 과정을 정리한다.

## 프론트엔드 관점의 테스트

프론트엔드에서 테스트의 대상은 크게 3가지이다.

* **시각적 요소**
  * HTML 구조가 의도한 대로 나타나는지에 대한 스냅샷 테스트를 위한 Jest
  * 컴포넌트가 실제로 브라우저에서 렌더링 되는 모습이 의도한 대로 나타나는지에 대한 시각적 회귀 테스트를 위한 Chromatic
* **사용자 이벤트 처리**
  * 사용자 이벤트를 시뮬레이션하도록 도와주는 testing-library
* **API 통신**
  * API Client를 간단하게 모킹하여 API 요청을 테스트 할 수 있는 Jest (혹은 실제 API 서버를 통해 테스팅을 진행해도 무방하다)

{% hint style="info" %}
**모킹하여 테스트하는것이 적절한가?**

[카카오 FE 기술블로그: 2E 테스트 도입 경험기](https://fe-developers.kakaoent.com/2023/230209-e2e/)라는 아티클을 읽다가 E2E 테스트에서는 Mock 데이터의 사용을 지양하고 실제 API만을 사용하는 것이 바람직하다라고 생각했다는 내용이 있었다. Mock 데이터를 사용하게 되면 개발자가 원하는 시나리오를 쉽게 테스트할 수 있지만, 다시 말하면 개발자가 원하는 시나리오만 테스트하게 된다는 것.

결론은 단위 테스트와 통합 테스트의 경우에는 Mock 데이터를 사용해도 무방하지만, E2E 테스트가 제대로된 의미를 갖기 위해서는 실제 환경과 동일하게 세팅하고 테스트 하는것이 유리하다!
{% endhint %}

## jest와 react-testing-library

jest와 react-testing-library의 설치는 [링크](https://dev-yakuza.posstree.com/ko/react/nextjs/test/)를 참고했다

### **jest 및 react-testing-library 타입 설치**

```jsx
yarn add --dev jest @testing-library/react @testing-library/jest-dom jest-environment-jsdom
```

### next.js를 위한 설정파일 생성

```jsx
// jest.setup.js

// Optional: configure or set up a testing framework before each test.
// If you delete this file, remove `setupFilesAfterEnv` from `jest.config.js`

// Used for __tests__/testing-library.js
// Learn more: <https://github.com/testing-library/jest-dom>
import '@testing-library/jest-dom/extend-expect'
```

<pre class="language-tsx"><code class="lang-tsx">import type { Config } from "jest";

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig: Config = {
  setupFilesAfterEnv: ["&#x3C;rootDir>/jest.setup.ts"],
  moduleDirectories: ["node_modules", "&#x3C;rootDir>/"],
  testEnvironment: "jest-environment-jsdom",
  collectCoverageFrom: [
<strong>    // 현재는 components에 대한 coverage만 설정하고
</strong>    // components 테스트들을 대부분 작성한 뒤에 다른 파일들에 대한 테스트도 작성할 예정이다.
    "components/**/*.[jt]s?(x)",
    "!**/*.stories.[jt]s?(x)",
    // "apis/**/*.[jt]s?(x)",
    // "assets/**/*.[jt]s?(x)",
    // "consts/**/*.[jt]s?(x)",
    // "hooks/**/*.[jt]s?(x)",
    // "libs/**/*.[jt]s?(x)",
    // "pages/**/*.[jt]s?(x)",
    // "providers/**/*.[jt]s?(x)",
    // "stores/**/*.[jt]s?(x)",
    // "styles/**/*.[jt]s?(x)",
  ],
  // coverageThreshold를 설정하고 실행하면, 커버리지 기준을 맞추지 못했다는 에러가 발생한다.
  // 따라서 해당 명령어를 git hook 등을 통해 실행한다면
  // 커버리지 기준에 미달하는 코드가 깃허브에 유입되는것을 방지할 수 있다.	
  // coverageThreshold: {}
};

module.exports = createJestConfig(customJestConfig);
</code></pre>

### package.json 수정

```jsx
"scripts": {
  "test": "jest --watch",
  "test:ci": "jest --ci"
  "coverage": "jest --coverage"
},
```

### jest 실행

```tsx
// 아래 명령어를 사용하면 변경사항을 watch하는 jest를 실행할 수 있다.
yarn jest --watch
// 아래 명령어를 사용하면 테스트 커버리지에 대한 리포트를 생성하고 저장한다.
// coverage/lcov-report/index.html 을 웹으로 열면
// 리포트를 웹페이지 형식으로 볼 수 있다.
yarn jest —coverage
```

## storybook

#### **storybook 설치**

```jsx
yarn add --dev sb
npx sb init --builder webpack5
```

#### import 및 경로 설정

```jsx
// ./storybook/preview.ts
// global.css를 storybook에서도 사용하기 위한 설정

import '../styles/globals.css'
```

```jsx
// ./storybook/main.ts
// stories 파일을 인식할 수 있도록 하는 설정. 기본 설정은 stories 폴더로 되어있는데,
// 보통 components 폴더에 컴포넌트를 관리하므로 거기서 stories 파일을 인식할 수 있도록

// 참조: <https://github.com/storybookjs/storybook/issues/21414>

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(js|jsx|ts|tsx)"],
};
```

## storybook과 테스트의 적용

우선 컴포넌트 하나에 대한 폴더구조는 아래와 같다. 기존 컴포넌트 파일 하나, 스토리북 파일 하나, 테스트 파일 하나, 그리고 스냅샷은 추후에 설명하겠다.

```jsx
Button
├── Button.stories.ts
├── Button.test.tsx
├── Button.tsx
└── __snapshots__
    └── Button.test.tsx.snap
```

먼저 `Button.tsx`는 내가 프로젝트에서 기존에 사용하던 버튼 컴포넌트이다.

```jsx
// Button.tsx

export default function Button({
  label,
  type = "button",
  size = "base",
  width = "fit",
  isActive = true,
  className,
  onClick,
}: IButtonProps) {
  function getClassName() {
    let toFormat: string[] = [];
    if (size === "base") toFormat.push(btn_base);
    else if (size === "sm") toFormat.push(btn_sm);
    if (!isActive) toFormat.push(btn_inactive);
    if (width === "full") toFormat.push("w-full");
    return twMerge(...toFormat, className || "");
  }

  return (
    <button type={type} onClick={onClick} className={getClassName()}>
      {label}
    </button>
  );
}
```

`Button.stories.ts`에서는 storybook에서 보여질 여러가지 버튼의 story를 설정한다. 또한 각각의 story는 버튼 테스트에서 testing-library를 사용하여 렌더 후 각종 테스트를 진행하게 된다.

stories 파일에는 크게 두 부분이 존재한다. 컴포넌트를 설명해주는 default export와 각각의 스토리들을 설명해주는 named export이다.

```tsx
// Button.stories.ts

import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";

// default export
export default {
  title: "Button",
  component: Button,
} as Meta<typeof Button>;

type Story = StoryObj<typeof Button>;

// named export
// "We recommend you use UpperCamelCase for your story exports"
export const Default: Story = {
  args: {
    label: "Button",
  },
};

export const Small: Story = {
  args: {
    // spread를 사용해서 args를 가져올 수 있다.
    // 이는 해당 컴포넌트를 사용하는 다른 composite component를 만들때 유용하게 사용할 수 있다.
    ...Default.args,
    size: "sm",
  },
};

export const Inactive: Story = {
  args: {
    ...Default.args,
    isActive: false,
  },
};

export const Full: Story = {
  args: {
    ...Default.args,
    width: "full",
  },
};
```

또한 react hooks를 사용해서 더 디테일한 테스팅을 하는것도 가능한데, 스토리북에서 최대한 args를 사용하는것을 추천하기도 하고, 아직 hooks를 사용해야할 필요성을 느끼지는 못해서 일단 넘어가기로 한다. 나중에 해당 기능이 필요하게 되면 [링크](https://storybook.js.org/docs/react/writing-stories/introduction#working-with-react-hooks)를 참조하자.

`Button.test.tsx` 에서는 실질적인 테스트를 수행하게 된다.

```tsx
// Button.test.tsx

import * as stories from "./Button.stories";
import { composeStories } from "@storybook/react";
import { render } from "@testing-library/react";

// stories 파일에서 import한 스토리들을 가지고 render할 수 있는 엘리먼트들을 생성한다.
const { Default, Full, Inactive, Small } = composeStories(stories);

it("should render BaseButton", () => {
  const { getByRole } = render(<Default />);
  const rendered = getByRole("button");

  expect(rendered).toHaveTextContent("Button");
  expect(rendered).toHaveClass("text-base");
  // 기존에는 아래 toMatchSnapshot()을 통해서 스냅샷 테스트를 진행했는데,
  // 루트 디렉토리의 storybook.test.ts 파일을 통해서 한번에 스냅샷 테스트가 가능해서
  // 여기서는 스냅샷 테스트가 아닌 테스팅을 진행하도록 한다.
  // expect(rendered).toMatchSnapshot();
});

it("should render SmButton", () => {
  const { getByRole } = render(<Small />);
  const rendered = getByRole("button");

  expect(rendered).toHaveTextContent("Button");
  expect(rendered).toHaveClass("text-sm");
});

it("should render InactiveButton", () => {
  const { getByRole } = render(<Inactive />);
  const rendered = getByRole("button");

  expect(rendered).toHaveTextContent("Button");
  expect(rendered).toHaveClass("text-black");
});

it("should render FullButton", () => {
  const { getByRole } = render(<Full />);
  const rendered = getByRole("button");

  expect(rendered).toHaveTextContent("Button");
  expect(rendered).toHaveClass("w-full");
});
```

루트 디렉토리에 `storybook.test.ts` 라는 파일을 아래와 같이 생성하고, `yarn test (yarn jest --watch)` 를 실행하면 자동으로 모든 스토리에 대한 스냅샷 테스트를 실행한다.

```tsx
// storybook.test.ts
import initStoryshots from "@storybook/addon-storyshots";
initStoryshots();
```

{% hint style="info" %}
**스냅샷은 커밋되어야 하는가?**\
당연하다! 스냅샷은 주어진 시점의 소스 모듈의 상태를 나타내며, 따라서 소스 모듈이 수정되는 경우 스냅샷도 수정되며 이전 버전에과 무엇이 변경되었는지를 알려줄 수 있다.
{% endhint %}

## 시각적 회귀 테스트

스토리북에서는 모양의 변화를 포착하고 변경 사항을 비교해주는 시각적 회귀 테스트를 [Chromatic](https://www.chromatic.com/?utm\_source=storybook\_website\&utm\_medium=link\&utm\_campaign=storybook/)을 통해서 사용하길 권장한다.

## 체크리스트

* [ ] stories 및 test 파일 작성을 통한 단위 및 통합 테스트
* [ ] Chromatic을 통한 시각적 회귀 테스트

## 링크

[Storybook: How to write stories](https://storybook.js.org/docs/react/writing-stories/introduction)

[Storybook: UI 컴포넌트 테스트](https://storybook.js.org/tutorials/intro-to-storybook/react/ko/test/)

[\[Next.js\] 테스트](https://dev-yakuza.posstree.com/ko/react/nextjs/test/)

[\[Next.js\] Storybook V6](https://dev-yakuza.posstree.com/ko/react/nextjs/storybook/start/)

[\[Bug\]: Unable to index files: Duplicate stories with id: example-button--primary #21414](https://github.com/storybookjs/storybook/issues/21414)

[Jest로 테스트 커버리지 수집하기](https://www.daleseo.com/jest-coverage/)

[Jest: 스냅샷 테스팅](https://mulder21c.github.io/jest/docs/en/next/snapshot-testing)

[카카오 FE 기술블로그: 2E 테스트 도입 경험기](https://fe-developers.kakaoent.com/2023/230209-e2e/)

[콴다 팀블로그: 모던 프론트엔드 테스트 전략 - 1편](https://blog.mathpresso.com/%EB%AA%A8%EB%8D%98-%ED%94%84%EB%A1%A0%ED%8A%B8%EC%97%94%EB%93%9C-%ED%85%8C%EC%8A%A4%ED%8A%B8-%EC%A0%84%EB%9E%B5-1%ED%8E%B8-841e87a613b2)

[Jest로 스냅샷(snapshot) 테스트하기](https://www.daleseo.com/jest-snapshot/)
