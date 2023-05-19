# 이벤트

## 이벤트란?

이벤트(event)는 무언가 일어났다는 신호이며 모든 DOM 노드는 이런 신호를 만들어 낸다. 아래는 DOM 이벤트의 예시.

* `click`
* `mouseover`와 `mouseout`
* `mousedown`과 `mouseup`
* `submit`
* `focus`

## 이벤트의 흐름

HTML 문서의 각 요소들은 계층적으로 존재한다. 따라서 요소에 이벤트가 발생할 경우 연쇄적인 이벤트가 발생하게 된다. 이러한 현상을 이벤트 전파 (Event Propagation)이라고 부르며, 전파 방향에 따라 버블링과 캡쳐링으로 구분된다.

<figure><img src="../.gitbook/assets/Untitled (6).png" alt=""><figcaption></figcaption></figure>

1. **캡처링**: 이벤트가 하위 요소로 전파

```jsx
<div onClickCapture={() => onClickCapture(1)}>
  <div onClickCapture={() => onClickCapture(2)}>
    <div onClickCapture={() => onClickCapture(3)} />
  </div>
</div>

// 1 2 3
```

공식문서에서 말하길, 캡쳐링은 사실상 라우터나 통계를 다루는게 아니라면 굳이 사용할 일은 없을 것이라고 한다.

{% hint style="info" %}
Capture events are useful for code like routers or analytics, but you probably won’t use them in app code.
{% endhint %}

1. **타깃**: 이벤트가 실제 타깃 요소에 전달
2. **버블링**: 이벤트가 상위 요소로 전파

```jsx
<div onClick={() => handleClick(1)}>
  <div onClick={() => handleClick(2)}>
    <div onClick={() => handleClick(3)} />
  </div>
</div>

// 3 2 1
```

## 이벤트 위임

하위 요소를 클릭했을 때에서 버블링을 통해 상위요소로 전파됨을 이용하여 상위요소에서 하위 요소의 이벤트를 제어하는 방법

```jsx
document.querySelector('#post-1').addEventListener('click', printId);
document.querySelector('#post-2').addEventListener('click', printId);
document.querySelector('#post-3').addEventListener('click', printId);
```

```jsx
<div className="cont" onClick={printId}>
	<div id="post-1"/>
	<div id="post-2"/>
	<div id="post-3"/>
</div>
```

아래와 같이 작성하면 하위 div에서 무슨일이 일어나는지 손쉽게 파악이 가능하다.

```jsx
<div className="cont">
	<div id="post-1" onClick={() => printId("post-1"}/>
	<div id="post-2" onClick={() => printId("post-2"}/>
	<div id="post-3" onClick={() => printId("post-3"}/>
</div>
```

또한 react는 아래와 같이 map을 사용할 수 있으므로 보다 편리하다.

```jsx
<div className="cont">
	{posts.map(post => <div id={post.id} onClick={() => printId(post.id)}/>)}
</div>
```

또한 위임을 사용하게 되면 e.target.속성값에 접근해서 사용해야 하고, 각각의 요소에서 어떤 일이 일어나는지를 한눈에 알아보기 어렵기 때문에 이벤트 위임을 사용하는것보단 map을 사용해서 각각의 요소에 이벤트를 주입해주는것이 더 나은 구현방법인듯 하다.

{% hint style="info" %}
If you rely on propagation and it’s difficult to trace which handlers execute and why, try this approach instead.
{% endhint %}

## react의 구현방식

react에서는 1과 같은 코드를 내부적으로는 addEventListener를 사용하여 2와 같이 구현하고 추상화해서 보여주고 있다고 한다.

> 얼마 전에 수업에서 들었던 middleware 컨셉이 적용되어 있다고도 말할 수 있을 것 같다. addEventListener는 여러개를 적용시켰을 때 적용한 순서대로 동작하기 때문에, 함수들을 순차적으로 체이닝 시킨다는 컨셉이 미들웨어의 컨셉과 유사한 듯 하다.

```jsx
// 1
class App extends React.Component {

  handleClick = () => {
    alert("Hi there");
  };

  render() {
    return <button onClick={this.handleClick}>Say something</button>;
  }
}
```

```jsx
// 2
class App extends React.Component {

  handleClick = () => {
    alert("Hi there");
  };

  componentDidMount() {
    document.getElementById('foo')
      .addEventListener('click', this.handleClick)
  }

  componentWillUnmount() {
    document.getElementById('foo')
      .removeEventListener('click', this.handleClick)
  }

  render() {
    return <button id="foo">Say something</button>;
  }
}
```

또한 리액트 공식문서에서는 event handler props가 on으로 시작하도록 네이밍하도록 권장하고 있다.

또 공식문서를 보면 props로 내리는건 on이지만, 선언하는건 handle로 작성하고 있다.

{% hint style="info" %}
By convention, event handler props should start with `on`, followed by a capital letter.
{% endhint %}

## target, currentTarget

`target`: 내가 클릭한 자식 요소

`currentTarget`: 이벤트 핸들러가 부착된 부모의 위치

## preventDefault(), stopPropagation()

* `preventDefault()`: 브라우저 고유의 행동을 막아준다 (e.g. form submit시 refresh)
* `stopPropagation()` : 이벤트 전파를 막아준다.

다만 꼭 필요한 경우를 제외하곤 이벤트 전파를 막지 않는것이 좋다. 예를 들어, 서비스에서 행동 패턴을 분석하기 위해 이벤트 감지 시스템을 사용할 때 stopPropagation을 통해 막아놓는다면, 해당 영역은 죽은 영역이 되어버리기 때문.

## 링크

[🌐 한눈에 이해하는 이벤트 흐름 제어 (버블링 & 캡처링)](https://inpa.tistory.com/entry/JS-%F0%9F%93%9A-%EB%B2%84%EB%B8%94%EB%A7%81-%EC%BA%A1%EC%B3%90%EB%A7%81)

[PoiemaWeb](https://poiemaweb.com/js-event)

[이벤트 버블링과 캡처링에 대한 정리](https://velog.io/@tlatjdgh3778/%EC%9D%B4%EB%B2%A4%ED%8A%B8-%EB%B2%84%EB%B8%94%EB%A7%81%EA%B3%BC-%EC%BA%A1%EC%B2%98%EB%A7%81%EC%97%90-%EB%8C%80%ED%95%9C-%EC%A0%95%EB%A6%AC)

[React onClick event vs JS addEventListener](https://linguinecode.com/post/react-onclick-event-vs-js-addeventlistener)

[Responding to Events – React](https://react.dev/learn/responding-to-events)
