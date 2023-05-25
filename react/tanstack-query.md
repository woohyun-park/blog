# tanstack query

## 내가 react-query

원티드 프리온보딩을 진행하면서 다른 팀원분의 코드를 봤는데, useFetch, useMutation이라는 커스텀 훅을 사용해서 http 요청을 너무나 잘 추상화해놓으셔서 놀랐는데, 다른 팀원분원들이 리뷰를 남겨놓은걸 보니 'react-query를 사용하는듯한 느낌을 받았다’는 말이 있어서 react-query에 대해서 찾아봤다.

Tanstack Query(react-query)는 간단하게 말하면 managing, caching and syncing asynchronous and remote data을 도와주는 훅들을 모아놓은 라이브러리이다.

react-query를 도입하면, 서버 데이터와 클라이언트 데이터를 완전히 분리할 수 있다. 컴포넌트 내부에서 useQuery 훅을 활용해 서버 데이터를 핸들링하고, 서버 데이터를 마치 global state처럼 활용할 수 있다.

지금 개인 프로젝트인 아카이브에서 zustand를 사용해서 global state관리를 하고 있는데, 너무 많은 데이터를 global state로 관리하다보니까 코드의 복잡성도 높아지고 관리에 필요한 리소스가 너무 많이 사용되는 느낌이 있었다. 그래서 리팩토링할 방법을 찾고 있었는데, react-query를 적용해보려고 한다

<figure><img src="../.gitbook/assets/Untitled (7).png" alt=""><figcaption></figcaption></figure>

### useQuery

`useQuery` 훅으로 수행되는 쿼리 요청은 get 요청과 같이 서버에 저장되어있는 상태를 불러와 사용할때 사용한다. 또한 다양한 UI에 유연하게 적용할 수 있도록 `useQueries` , `useInfiniteQuery` 와 같은 hook도 제공한다.

`useQuery` 훅은 요청마다 구분되는 uniqueKey를 필요로 하며, 해당 키를 사용해서 서버 상태를 로컬에 캐시하고 관리한다.

```jsx
function Users() {
  const { isLoading, error, data } = useQuery(
    'userInfo', // 'userInfo'를 Key로 사용하여 데이터 캐싱
    // 다른 컴포넌트에서 'userInfo'를 QueryKey로 사용한 useQuery Hook이 있다면 캐시된 데이터를 우선 사용합니다.
    () => axios.get('/users').then(({ data }) => data),
  );

  // FYI, `data === undefined`를 평가하여 로딩 상태를 처리하는것이 더 좋습니다.
  // React Query는 내부적으로 stale-while-revalidate 캐싱 전략을 사용하고 있기 때문입니다.
  if (isLoading) return <div> 로딩중... </div>;
  if (error) return <div> 에러: {error.message} </div>;

  return (
    <div>
      {' '}
      {data?.map(({ id, name }) => (
        <span key={id}> {name} </span>
      ))}{' '}
    </div>
  );
}
```

### useMutation

`useMutation` 훅으로 수행되는 mutation 요청은 post, put, delete와 같이 side effect를 발생시켜 서버의 상태를 변경시킬때 사용한다.

```jsx
function NotificationSwitch({ value }) {
  // mutate 함수를 호출하여 mutationFn 실행
  const { mutate, isLoading } = useMutation(
    (value) => axios.post(URL, { value }), // mutationFn
  );

  return (
    <Switch
      checked={value}
      disabled={isLoading}
      onChange={(checked) => {
        // mutationFn의 파라미터 'value'로 checked 값 전달
        mutate(checked);
      }}
    />
  );
}
```

## react-query와 함께 Concurrent UI Pattern 도입하기

또한 react-query를 찾아보다 카카오에서 react-query와 함께 Concurrent UI 패턴을 도입했다는 글을 찾았는데, 마침 React 18에서 Concurrency를 새로운 feature로써 릴리즈했다는 문서를 보고 해당 부분에 대해서도 찾아봤다.

### 명령형 컴포넌트 VS. 선언형 컴포넌트

먼저 Concurrent UI Pattern을 이해하기 위해서는 명령형과 선언형 컴포넌트의 이해가 필요하다. 간단하게 말하자면 명령형은 `어떻게` 해결할 것인가에 관심이 있는 것이고 선언형은 `무엇을` 해야 할지에 관심이 있는 것이다.

#### 예시

* **명령형**: 집을 나가서 오른쪽으로 50미터 직진 후 CU에서 오른쪽으로 꺾어. 수할인마트에 들어가서 삼겹살 집어서 계산대로 가. 그리고 만원짜리 하나 드리고 100원 거슬러 받아와.
* **선언형**: 삼겹살 사와

선언형 방식의 접근을 위해서는 명령형 방식으로 ‘어떻게’가 추상화되어있어야 한다. 마트가 어디인지 알고, 거래를 할 줄 안다 등이 추상화되어있음을 전제하는 것. 결국 선언적 접근 방식은 명령형이 기저에 깔려있고 추상화되어있는 것. 또한 함수형 프로그래밍은 선언형 프로그래밍의 일종이며, 보통 둘의 의미를 섞어서 사용한다.

```jsx
// 명령형 방식
function double (arr) {
  let results = [];
  for (let i = 0; i < arr.length; i++){
    results.push(arr[i] * 2);
  }
  return results;
}
```

```jsx
// 선언형 방식
function double(arr) {
  return arr.map((item) => item * 2);
}
```

결국 **선언형 프로그래밍**을 한다는 건 **어떻게 할것인지를 잘 추상화시켜서 무엇을 수행하는 코드인지 손쉽게 알아볼 수 있도록 하고 사이드이펙트가 생길 수 있는 여지를 최소한으로 줄이는 것이다.**

아래 예시는 컴포넌트는 명령형으로 작성된 컴포넌트이다. 상태값에 따라서 분기가 많아지면서 코드가 한눈에 들어오지 않는다.

```jsx
const User = () => {
  const {
    data: userInfoData,
    isLoading: userInfoIsLoading,
    error: userInfoError,
    refetch: userInfoRefetch
  } = useQuery(['userInfo'], getUserInfo);
  const {
    data: alarmData,
    isLoading: alarmIsLoading,
    error: alarmError,
    refetch: alarmRefetch
  } = useQuery(['alarm'], getAlarm);

  return (
    <section className="user__container">
    {
      userInfoIsLoading && alarmIsLoading && (
        <>
          <UserInfoSkeleton/>
          <AlarmSkeleton/>
        </>
      ) : (
        <>
          {
            userInfoError ? (
              <Retry handleRetry={refetchUserInfo}/>
            ) : (
              <UserInfo data={userInfoData!}/>
            )
          }
          {
            alarmError ? (
              <Retry handleRetry={refetchAlarm}/>
            ) : (
              <Alarm data={alarmData!}/>
            )
          }
        </>
      )
    }
    </section>
  )
}
```

아래와 같이 선언형으로 컴포넌트를 작성하게 되면 각각의 컴포넌트들이 각자 어디에 관심을 두고 있는지를 한눈에 이해할 수 있다.

```jsx
const User = () => (
  <section className="user__container">
    <RetryErrorBoundary>
      <Suspense fallback={<UserInfoSkeleton />}>
        <UserInfo />
      </Suspense>
    </RetryErrorBoundary>
    <RetryErrorBoundary>
      <Suspense fallback={<AlarmSkeleton />}>
        <Alarm />
      </Suspense>
    </RetryErrorBoundary>
  </section>
);
```

### React 18: Concurrency

> A key property of Concurrent React is that rendering is interruptible.

React 18에서는 “우선순위에 따른 화면 렌더”, “컴포넌트의 지연 렌더”, 그리고 “로딩 화면의 유연한 구성” 등을 쉽게 구성할 수 있는 기능들을 제공하고 있으며, “렌더링이 방해될 수 있다는 점”이 큰 특징이다.

그 중 가장 대표적으로 Suspense와 ErrorBoundary를 사용하면 구성 요소 트리의 일부가 아직 준비되지 않은 경우의 상태를 선언형으로 작성할 수 있다.

```jsx
<Suspense fallback={<Spinner />}>
  <Comments />
</Suspense
```

```jsx
<ErrorBoundary fallback={<p>Something went wrong</p>}>
  <Profile />
</ErrorBoundary>
```

## 기타

아래와 같이 로딩중이나 에러상태를 따로 반환해주면 조금 더 코드가 리니어하게 읽히겠다.

```jsx
function UserInfo({ userId }) {
  const { isLoading, error, data } = useQuery(
    ['userInfo', userId],
    () => axios.get(`/users/${userId}`)
  );

  if (isLoading) return <div> 로딩중... </div>;
  if (error) return <div> 에러: {error.message} </div>;
  return <div> {...} </div>;
}
```

## 링크

[React-Query 도입을 위한 고민 (feat. Recoil) - 오픈소스컨설팅 테크블로그](https://tech.osci.kr/2022/07/13/react-query/)

[카카오페이 프론트엔드 개발자들이 React Query를 선택한 이유 | 카카오페이 기술 블로그](https://tech.kakaopay.com/post/react-query-1/#react-query%EC%9D%98-mutation-%EC%9A%94%EC%B2%AD)

[React Query와 함께 Concurrent UI Pattern을 도입하는 방법 | 카카오페이 기술 블로그](https://tech.kakaopay.com/post/react-query-2/#%EC%9D%BC%EB%B6%80-%EC%98%81%EC%97%AD-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%B6%88%EB%9F%AC%EC%98%A4%EA%B8%B0-%EC%8B%A4%ED%8C%A8-%EC%8B%9C-%EC%9E%AC%EC%8B%9C%EB%8F%84-ui-%ED%91%9C%EC%8B%9C)

[\[React\] Concurrent UI Pattern 이란 (UI 개발 패턴)](https://hengxi.tistory.com/20)

[React Conf 2021 Recap – React](https://react.dev/blog/2021/12/17/react-conf-2021-recap#react-18-and-concurrent-features)

[명령형 vs 선언형 (함수형)](https://velog.io/@injoon2019/%EB%AA%85%EB%A0%B9%ED%98%95-vs-%EC%84%A0%EC%96%B8%ED%98%95-%ED%95%A8%EC%88%98%ED%98%95)

[\[프로그래밍 언어론\] 명령형(Imperative)프로그래밍과 선언형(Declarative)프로그래밍](https://code-lab1.tistory.com/244)
