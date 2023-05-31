# \[아카이브] atomic design과 compound component 패턴

jest, testing-library, 그리고 storybook을 도입하면서 보다 효율적이고 유연하게 컴포넌트를 설계하는 방법에 대해서 더 자세하게 알고 싶었다. 여러 아티클을 읽어보던 도중, 개념정도만 이해하고 중구난방으로 적용하던 atomic design pattern을 한번 제대로 적용시켜보고 싶었다. 또한 중구난방으로 적용하며 발생했던 문제점(단순한 변경점에 따라 props가 늘어나거나 중복 컴포넌트를 새로 만들어야 하는 현상)에 대한 해결법으로 compound component 패턴을 적용해보면 좋겠다는 생각이 들었다.

## atomic design

<figure><img src="../.gitbook/assets/Untitled (13).png" alt=""><figcaption></figcaption></figure>

화학적 관점에서 영감을 받은 디자인 시스템으로, 모든 것은 atom으로 구성되어 있고, atom들이 결합하여 molecule이 되고 molecule은 더 복잡한 organism으로 결합하여 궁극적으로 template과 page를 생성하는 방식이다.

* **atom**: 더 이상 분해할 수 없는 기본 컴포넌트

<figure><img src="../.gitbook/assets/Untitled (7).png" alt=""><figcaption></figcaption></figure>

* **organism**: 구체적으로 표현되고 컨텍스트를 가지므로 상대적으로 재사용성이 낮아지는 특징

<figure><img src="../.gitbook/assets/Untitled (8).png" alt=""><figcaption></figcaption></figure>

* **molecule**: 여러 개의 atom을 결합하여 자신의 고유한 특성을 가지며 **한가지 일(Single Responsibility Principle, SRP)**을 한다! 재사용성, UI에서의 일관성, 테스트하기 쉬운 조건이라는 이점을 가지고 있다.

<figure><img src="../.gitbook/assets/Untitled (9).png" alt=""><figcaption></figcaption></figure>

* **template**: 실제 컨텐츠가 없는 page 수준의 스켈레톤

<figure><img src="../.gitbook/assets/Untitled (10).png" alt=""><figcaption></figcaption></figure>

* **page**: 유저가 볼 수 있는 실제 컨텐츠를 담은 template의 instance

<figure><img src="../.gitbook/assets/Untitled (11).png" alt=""><figcaption></figcaption></figure>

## molecule과 organism을 나누는 기준

아티클에서는 molecule과 organism을 나누는 기준이 주관적이기 때문에 기준을 좁히기가 어려웠다고 설명한다. 나의 경우에도 명확한 기준을 세워놓지 않았기 때문에 매번 molecule과 organism 중 어디에 해당 컴포넌트가 있는지 찾는데 어려움을 겪었다. 따라서 해당 아티클에서 제안한것과 같이 아래와 같은 기준을 세웠다.

* **molecule**: 컨텍스트가 없는 UI적인 네이밍과 SRP를 지키는 컴포넌트
* **organism**: 컨텍스트를 포함한 재사용이 어려운 컴포넌트

## 중복 컴포넌트 또는 불필요한 props의 증가

<figure><img src="../.gitbook/assets/Untitled (12) (1).png" alt=""><figcaption></figcaption></figure>

위와 같이 단순한 변경점임에도 새로운 컴포넌트를 생성하거나 props를 증가시켜야 했다. 나의 경우에도 비슷한 디자인의 컴포넌트들을 재사용하려고 노력하다보니 props가 속절없이 늘어나는 현상을 경험할 수 있었다. 이때 compound component를 사용하면 유연하게 컴포넌트 구조를 재정의 할 수 있었다.

**기존 props를 사용하였을 때**

```tsx
const Face = ({ classes }) => {
  return (
    <>
      <Eyes className={classes.eyes} />
      <Nose className={twMerge('mx-auto', classes.nose)} />
      <Mouse className={twMerge('bg-red', classes.mouth)} />
    </>
  );
};
```

```tsx
const AngryFace = () => (
  <Face
    classes={{
      eyes: "scale-x-50",
      noes: "bg-red"
    }}
  />
);
```

**compound component 패턴을 사용하였을 때**

```tsx
const Face = ({ children }) => {
  return <>{children}</>;
};

const Eyes = () => <>{'...'}</>;
const Nose = () => <>{'...'}</>;

Face.Eyes = Eyes;
Face.Nose = Nose;
```

```tsx
const AngryFace = () => (
  <Face>
    <Face.Eyes className="scale-x-50" />
    <Face.Nose className="bg-red" />
  </Face>
);
```

face를 사용할 때, eyes와 nose를 원할때만 children으로 넣어주어서 사용할 수 있다. 즉, eyes만 존재하는 face를 만들수도, nose만 존재하는 face를 만들수도, 혹은 둘 다 존재하는 face를 만들 수도 있는 것이다.

또한 contextAPI를 사용해서 컴포넌트 내 상태를 손쉽게 공유하고 사용할 수 있도록 구현할 수도 있다. 자세한 구현은 [링크1](https://itchallenger.tistory.com/266)과 [링크2](https://iyu88.github.io/react/2023/03/25/react-compound-component-pattern.html)를 참조하면 좋을듯 하다. 내 프로젝트에서는 프로필, 댓글 뿐만 아니라 탭을 사용하는 페이지에서도 해당 패턴을 사용할 수 있었다.

## 체크리스트

* [ ] atomic design 적용
* [ ] compount component 패턴 적용

## 링크

[카카오 FE 기술블로그: 스토리북 작성을 통해 얻게 되는 리팩토링 효과](https://fe-developers.kakaoent.com/2022/220609-storybookwise-component-refactoring/)

[카카오 FE 기술블로그: 아토믹 디자인을 활용한 디자인 시스템 도입기](https://fe-developers.kakaoent.com/2022/220505-how-page-part-use-atomic-design-system/)
