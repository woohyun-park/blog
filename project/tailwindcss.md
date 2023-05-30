# \[아카이브] tailwindCSS 병합 해결

## tailwindCSS 사용시 문제점

tailwindCSS를 사용할 때, props로 className을 줘서 커스텀할 수 있는 여지를 주고 싶은데, className을 사용하다보니 예상하지 못한 방향으로 스타일링이 적용되는 경우가 생겼다.

예를 들면, 기존 적용되어있는 className이 `p-2`이고, 새롭게 props로 들어와서 override되어야 하는 className이 `p-4`일때, 두개를 단순히 일 열로 나열하여 병합하여 `p-2 p-4`로 적용한다면 원하지 않는 방향으로 동작할 가능성이 있다.

## 기존 해결방안

따라서 기존에는 아래와 같이 mergeTailwindClasses라는 커스텀 함수를 작성하여 props로 들어오는 className을 적용시키고 있었다.

```jsx
export function mergeTailwindClasses(...classStrings: string[]) {
  let classHash: IDict<string> = {};
  classStrings.map((str) => {
    // 1. 들어오는 classString을 띄어쓰기로 split하여 순서대로 map
    str.split(/\\s+/g).map(
      // 2. tailwindClass의 처음 부분(text-base라고 하면 text)을 key로,
      // 모든 부분을 value로 저장하고 이미 존재하는 경우에는 override
      (token) => (classHash[token.split("-")[0]] = token)
    );
  });
  // 3. 합쳐진 key-value pair를 정렬 및 하나의 classString으로 병합
  return Object.values(classHash).sort().join(" ");
}
```

하지만 해당 방식은 여러개의 `-` 로 구분되어있는 경우(`bg-black-100` 등)에는 작동하지 않는것을 확인했고, 따라서 다른 방법이 필요했다.

## tailwind-merge

혹시나 새로운 라이브러리가 나왔을까 하고 검색해봤더니 tailwind-merge라는 라이브러리가 존재해서 해당 라이브러리를 통해서 간단하게 해결했다. (~~2021년 7월…에도 존재했던 라이브러리인데 왜 못찾았었을까)~~&#x20;

tailwind-merge의 사용방법도 기본적으로는 기존에 사용하던 커스텀 함수와 동일하다!

```jsx
import { twMerge } from 'tailwind-merge'

twMerge('px-2 py-1 bg-red hover:bg-dark-red', 'p-3 bg-[#B91C1C]')
// → 'hover:bg-dark-red p-3 bg-[#B91C1C]'
```

## 링크

[Conflicting className precedence rules #1010](https://github.com/tailwindlabs/tailwindcss/issues/1010)

[tailwind-merge](https://github.com/dcastil/tailwind-merge)
