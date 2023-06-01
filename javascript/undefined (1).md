# closure

## 스코프 (scope)

* **동적 스코프**: 함수가 호출되는 시점에 결정
* **정적 스코프**: 함수가 정의되는 시점에 결정. 자바스크립트는 정적 스코프!

```jsx
let status = "studying";

function me(){
  let status = "playing";
  getStatus();
}

function getStatus(){
  console.log(status);
}

me(); // studying
```

## 스코프 체인 (scope chain)

* 모든 함수 컨텍스트에는 `LexicalEnvironment` 객체가 있고, `environmentRecord`와 `outerEnvironmentReference`로 구성되어 있다.
* `environmentRecord`에는 현재 함수 컨텍스트와 관련된 코드의 식별자 정보들이 저장되고 `outerEnvironmentReference`는 함수가 선언된 당시의 `Lexical Environment` 객체를 참조한다.
* 어떤 식별자에 참조할 때 현재 컨텍스트의 `LexicalEnvrinonemt`를 탐색해서 발견되면 그 값을 반환하고, 발견하지 못하면 `outerEnvironmentReference`에 담긴 `LexicalEnvironment`를 탐색하는 과정을 거친다. 계속 찾지 못할 경우 전역 건텍스트의 `LexicalEnvironment`까지 탐색해 나간다. 이러한 현상을 `Scope Chain`이라 한다.

## 클로저 (closure)

> A closure is the combination of a function and the lexical environment within which that function was declared.\
> \
> Closure makes it possible for a function to have “private” variables

클로저는 함수가 선언됐을 때의 lexical environment를 기억하는 함수. 다시 말하자면, 반환된 내부함수가 자신이 선언됐을때의 환경을 기억하여 자신이 선언됐을때의 환경 밖에서 호출되어도 그 환경에 접근할 수 있는 함수.

```jsx
// 1. innerFunc가 호출되면 스코프 체인을 통해 전역 객체, outerFunc의
// 활성 객체, innerFunc의 활성 객체를 순차적으로 바인딩
// 2. innerFunc의 함수 스코프에서 x 검색 -> 실패
// 3. outerFunc의 함수 스코프에서 x 검색 -> 성공

function outerFunc() {
  let x = 10;
  let innerFunc = function () { console.log(x); };
  innerFunc();
}

outerFunc(); // 10
```

```jsx
// 1. outerFunc는 innerFunc을 리턴하고 callstack에서의 실행 컨텍스트 소멸
// 2. innerFunc가 호출되면 스코프 체인을 통해 전역 객체, outerFunc의
// 활성 객체, innerFunc의 활성 객체를 순차적으로 바인딩 (outerFun의 실행 컨텍
// 스트는 소멸했지만 활성 객체는 소멸하지 않음)
// 3. innerFunc의 함수 스코프에서 x 검색 -> 실패
// 4. outerFunc의 함수 스코프에서 x 검색 -> 성공

function outerFunc() {
  let x = 10;
  let innerFunc = function () { console.log(x); };
  return innerFunc;
}

let inner = outerFunc();
inner(); // 10
```

클로저의 역할

* 현재 상태를 기억하고 최신 상태를 유지
* 전역 변수의 사용 억제
* 정보의 은닉

## useState의 구현

리액트에서는 useState, useEffect 등의 hook을 closure를 활용하여 구현한다.

### 첫번째 구현

클로저를 통해 정상동작하나, state가 getter 방식의 함수로 구현되었다.

```jsx
const useState = (initialValue) => {
  let value = initialValue;

  const state = () => value;

  const setState = (newValue) => {
    value = newValue;
  };

  return [state, setState];
};

const [count, setCount] = useState(0);

console.log(count()); // 0
setCount(1);
console.log(count()); // 1
```

### 두번째 구현

state를 변수로 선언하였으나, 변수이기 때문에 리턴된 순간 변경할 수 없는 상태이므로 원하는 대로 동작하지 않는다.&#x20;

```jsx
const useState = (initialValue) => {
  let state = initialValue;

  const setState = (newValue) => {
    state = newValue;
  };
  
  return [state, setState];
};

const [counter, setCounter] = useState(0);

console.log(counter); // 0
setCounter(1);
console.log(counter); // 0
```

### 세번째 구현

리액트는 state를 useState의 외부에 선언하여 두번째 구현에서의 문제를 해결한다.

```jsx
let state;
function useState(initState) {
  if (!state) state = initState;
  const setState = (newState) => {
    state = newState;
  }
  return [ state, setState ];
}

const Counter = () => {
  const [count, setCount] = useState(1);

  return {
    click: () => setCount(count + 1),
    render: () => console.log(count),
  }
}

Counter().render(); // 1
Counter().click();
Counter().render(); // 2
```

추가적으로 react에서는 여러 개의 state 값들을 useState 바깥쪽에 배열 형식으로 순서대로 저장하여 관리하기 때문에, **동일한 순서로 hook이 호출되는것을 보장하기 위해** 아래와 같은 규칙이 필요하다.

1. **react hook은 react 함수 최상위 레벨에서 사용되어야 한다.** 렌더링시에 hook은 동일한 순서로 호출되기 때문에 조건문, 반복문, 중첩 함수 안에서 사용될 수 없다. hook을 호출한 순간 각각의 상태에 대한 배열의 인덱스를 부여받아 상태를 관리하므로 특정 조건에 따라 hook이 실행된다면 인덱스값이 변경되어 잘못된 상태를 참조할 여지가 있다.
2. **react 함수 안에서만 사용 가능하다.** 위와 같은 이유로 react 함수 안에서만 사용하여야 한다.

## 함수형 인자

> If the new state is computed using the previous state, you can pass a function to setState.\
> \
> React may batch multiple setState() calls into a single update for performance. During subsequent re-renders, the first value returned by useState will always be the most recent state after applying updates.

```jsx
const Counter = () => {
  const [count, setCount] = useState(0);

  const increase1 = () => {
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  }

  const increase2 = () => {
    setCount((count) => count + 1);
    setCount((count) => count + 1);
    setCount((count) => count + 1);
  }
}

export default Counter;
```

이전 상태를 참조하여 상태를 변경하기 위해서는 함수형 인자를 사용해아 한다. 만약 일반적인 값을 인자로 사용한다면 원하는 형태로 동작하지 않을 수 있다. 이는 useState의 내부 구조와 연관이 있다.

### useState의 내부 구조

```jsx
{
  memoizedState: 0, // first hook
  baseState: 0,
  baseUpdate: null,
  next: { // second hook
    memoizedState: false,
    baseState: false,
    baseUpdate: null,
    next: { // third hook
      memoizedState: {
        tag: 192,
        create: () => {},
        destory: undefined,
        deps: [0, false],
      },
      baseState: null,
      baseUpdate: null,
      next: null
    }
  }
}
```

```jsx
{
  memoizedState: 0,
  baseState: 0,
  queue: {
   last: {
      action: 1, // setCount 설정값
      eagerReducer: basicStateReducer(state, action),
      eagerState: 1, // 최종 반환값
    },
    dispatch: dispatchAction.bind(bull, currenctlyRenderingFiber$1, queue),
    lastRenderedReducer: basicStateReducer(state, action), // eagerState를 계산하는 reducer
    lastRenderedState: 0,
  },
  baseUpdate: null,
  next: null
}
```

위 코드는 실제 hook의 내부 구조이다. 이중에서 next는 연결 리스트의 일종으로, 한 컴포넌트 안에서 여러 번의 실행되는 hook들을 연결해주는 역할을 한다.

```jsx
function basicStateReducer(state, action) {
  return typeof action === 'function' ? action(state) : action;
}
```

리액트의 배치 프로세스는 이렇게 묶인 hook들을 한 번에 처리한 뒤 last를 생성하며, 최종 반환될 상태인 eagerState를 계산하는 함수는 reducer다. 해당 reducer에 넘기는 action 타입이 함수일 때는 이전 상태를 인자로 받으므로 기존 상태를 기반으로 새로운 상태를 업데이트할 수 있게 된다.

## 클로저 트랩

```jsx
useEffect(() => {
  setInterval(() => {
    setCount(count + 1);
  }, 500);
}, []);

useEffect(() => {
  setInterval(() => {
    console.log(count);
  }, 500);
}, []);

// 0 0 0 0 ...
```

```jsx
useEffect(() => {
  setInterval(() => {
    setCount(count + 1);
  }, 500);
}, [count]);

useEffect(() => {
  setInterval(() => {
    console.log(count);
  }, 500);
}, [count]);

// 0 0 1 2 1 2 3 2 3 4 0 0 1 2 ...
```

```jsx
useEffect(() => {
  let timer = setInterval(() => {
    setCount(count + 1);
  }, 500);
  return () => clearInterval(timer);
}, [count]);

useEffect(() => {
  let timer = setInterval(() => {
    console.log(count);
  }, 500);
  return () => clearInterval(timer);
}, [count]);

// 0 1 2 3 4 ...
```

deps 배열을 올바르게 설정하면 상태가 변경될 때마다 콜백함수가 실행되고 새로운 상태를 참조하게 되어 클로저 트랩을 고칠 수 있다. 또한 이전 상태(타이머, 이벤트 리스너 등)를 정리하는데에도 주의를 기울여야 한다.

## 의문점

### 1. ES6에 class가 추가되었는데, class도 결국 내부적으로는 closure로 동작할까?

> **ChatGPT의 답변**\
> In modern JavaScript, the **`class`** syntax was introduced as part of ECMAScript 2015 (ES6) to provide a more standardized and familiar syntax for creating classes. However, behind the scenes, closures are still involved in achieving encapsulation and private members in class implementations.

ChatGPT는 class의 encapsulation과 private members를 구현하는데에 closure가 사용된다 라고 말한다. 물론 GPT를 믿을 수 없어서 조금 더 찾아봤는데, mdn에서는 아래와 같이 말하고 있다

> **MDN - Classes**\
> Classes are a template for creating objects. They encapsulate data with code to work on that data. Classes in JS are built on [prototypes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance\_and\_the\_prototype\_chain) but also have some syntax and semantics that are unique to classes.

prototype은 아래와 같이 함수에서 사용되는 속성인데, class도 prototype을 사용하여 만들어졌고, 아래 코드 1은 코드 2의 형식으로도 작성할 수 있다고 말하고 있다. 따라서 ES6의 class는 내부적으로 함수와 closure를 사용해서 동작한다고 말할 수 있을 것 같다.

```jsx
// 1
function Box(value) {
  this.value = value;
}

Box.prototype.getValue = function () {
  return this.value;
};

const boxes = [new Box(1), new Box(2), new Box(3)];
```

```jsx
// 2
class Box {
  constructor(value) {
    this.value = value;
  }

  getValue() {
    return this.value;
  }
}
```

## 링크

[PoiemaWeb](https://poiemaweb.com/js-closure)

[\[React\] useState의 동작 원리와 클로저](https://seokzin.tistory.com/entry/React-useState%EC%9D%98-%EB%8F%99%EC%9E%91-%EC%9B%90%EB%A6%AC%EC%99%80-%ED%81%B4%EB%A1%9C%EC%A0%80)

[\[React\] 클로저와 useState Hooks (2)](https://yeoulcoding.me/169)

[React Hook에서 클로저는 어디서 쓰일까?](https://talkwithcode.tistory.com/88)

[React Hook과 Closure의 관계 (feat. useState)](https://www.fronttigger.dev/2022/react/react-hook-closure)

[(번역) 리액트 훅(React Hooks)의 클로저 트랩(Closure Trap) 이해하기](https://velog.io/@superlipbalm/the-closure-trap-of-react-hooks)
