# \[원티드 프리온보딩] react.js로 검색창 구현하기

원티드 프리온보딩의 2주차 기업과제인 검색창 구현하기에서 중점적으로 구현한 부분을 정리해본다. 목표는 **검색창 구현 + 검색어 추천 기능 구현 + 캐싱 기능 구현**이며, 세부 구현목표는 노출하면 안되는듯 하여 생략한다.

## cacheAPI를 이용한 검색결과 캐싱

기존에 localStorage와 axios를 사용하여 캐싱을 구현했었는데, cacheAPI를 이용해서 구현하려다 실패했다는 팀원의 글을 보고 캐싱에 특화된 cacheAPI가 존재한다면 해당 방법을 사용해서 구현하는것이 알맞지 않을까 하여 검색해보았고, 아래와 같은 이점이 있었기때문에 해당 방식을 적용하여 구현하였다.

* cacheAPI에서는 내부적으로 fetchAPI를 사용하기 때문에 axios를 사용할 필요가 없어서 외부 의존성을 차단하고 추가적인 라이브러리 설치가 필요 없다.
* 기존 localStorage와 axios를 사용하였을때는 검색어를 key로, 검색 결과 데이터를 value로 저장하였다면, cacheAPI에서는 response 응답 자체를 저장하기 때문에 ‘API 호출별로 로컬 캐싱 구현'이라는 구현 목표에 더 알맞다고 생각했다.
*   ~~localStorage에서는 expireTime을 통해 자동으로 삭제되게 하려면 서비스 워커를 사용하는 등 복잡한 작업이 필요하지만, cacheAPI를 사용했을때는 header에 max-age를 적용해주면 자동으로 삭제될 것이라고 생각했다~~

    → header에 max-age를 적용하더라도 자동으로 삭제되지는 않아서 따로 삭제 로직을 구현해주어야 했으나, 삭제 로직은 따로 구현하지 않고 expired되었다면 새로 fetch해오는 방식으로 구현했다.

    TODO: 해당 방식을 사용하면 캐시가 계속해서 쌓이게 되므로 어플리케이션을 실행할 때 expire된 캐시를 모두 삭제해주는 코드를 추가해주면 좋겠다.

#### cacheAPI를 사용한 검색결과 캐싱

```tsx
const isExpired = (cachedAt: string | null) => {
  if (!cachedAt) return true;
  return new Date(cachedAt).getTime() + EXPIRE_TIME < new Date().getTime();
};

// cache가 존재하는지와 만료되었는지를 확인하여 fetch가 필요한지 여부를 반환
const needFetch = async (keyword: string) => {
  const url = BASE_URL + keyword;
  const cache = await caches.open("keywords");

  let cachedData = await cache.match(url);
  if (!cachedData) return true;
  if (isExpired(cachedData.headers.get("date"))) return true;
  return false;
};

export const fetchData = async (keyword: string) => {
  const url = BASE_URL + keyword;
  const cache = await caches.open("keywords");

  if (await needFetch(keyword)) await cache.add(url);
  return formatCache(await cache.match(url));
};
```

## sessionStorage를 이용한 최근 검색어 캐싱

클론해야하는 사이트의 최근 검색어 캐싱이 sessionStorage를 이용해서 세션이 유지되는 동안만 캐싱해주고 있었다. 따라서 같은 방식으로 구현했다. 중점 구현사항은 다음과 같다.

* sessionStorage에 recentKeywords라는 이름으로 저장하여 사용
* recentKeywords에 이미 keyword가 저장되어 있는 경우 가장 앞으로 끌어옴
  * e.g. \[비강암, 비장암, **비만**]에서 **비만**을 검색 → \[**비만**, 비강암, 비장암]

```jsx
export const updateRecentKeywords = (keyword: string) => {
  const recentKeywords = sessionStorage.getItem("recentKeywords");
  let newRecentKeywords;
  if (recentKeywords) {
    const recentKeywords: string[] = JSON.parse(
      sessionStorage.getItem("recentKeywords") || ""
    );
    newRecentKeywords = formatRecentKeywords([
      keyword,
      ...recentKeywords.filter((each) => each !== keyword),
    ]);
  } else {
    newRecentKeywords = [keyword];
  }
  sessionStorage.setItem("recentKeywords", JSON.stringify(newRecentKeywords));
  return newRecentKeywords;
};
```

#### 사용법

다음과 같은 상황에서 사용하여 최근 검색어를 저장

* 마우스로 검색결과를 클릭할 때
* 키보드로 검색결과를 이동하고 엔터를 통해 검색결과를 클릭할 때
* 검색 버튼을 누를 때

```tsx
// 검색 버튼을 누를 때

// components/KeywordInput
const onSearchClick = (keyword: string) => {
  keyword && updateRecentKeywords(keyword);
};
return (
  ...
  <S.IconCont onClick={() => onSearchClick(keyword)}>
    <IconSearch />
  </S.IconCont>
  ...
)

```

## 검색어 추천창 토글 기능

기존에는 검색어 추천창이 나타나고 사라지는 액션을 onFocus와 onBlur을 사용해서 구현하려고 했으나, 검색어 추천창이 클릭이 되지 않는 이슈가 발생했다. 해당 이슈는 다음과 같은 명령들이 순차적으로 일어나기 때문에 발생하는 이슈였다.

```jsx
onBlur → 검색어 추천창 unmount → onClick 실패
```

따라서 ref의 바깥을 클릭하면 onClickOutside가 실행되도록 하는 useClickOutside 커스텀훅을 통해 해결했다.

```jsx
export const useClickOutside = ({ onClickOutside }: Props) => {
  const ref = useRef<any>(null);

  const handleClickOutside = (e: any) => {
    if (ref.current && !ref.current.contains(e.target)) onClickOutside();
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref]);

  return { ref };
};
```

#### 사용법

```tsx
// components/KeywordMain
const { ref } = useClickOutside({
	// ref의 바깥을 클릭하면 focused와 selected를 초기화
  onClickOutside: () => {
    setIsFocused(false);
    setSelected(0);
  },
});

// 인풋 창과 추천 검색어 창을 모두 포함하는 요소를 ref로 지정
return (
  <div ref={ref}>
    <SearchInput />
    {isFocused && <SearchList />}
  </div>
);
```

## 키보드로 검색어 추천창 이동 기능

키보드로 검색어 추천창을 위아래로 이동하고, 엔터를 누르면 선택된 추천검색어가 검색되도록 (최근검색어에 추천되도록) 구현했다.

```jsx
// components/KeywordInput

const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  // 한글의 경우 조합하는 도중 밑줄이 생기는데, 그때 이벤트가 두번 발생하게 된다.
  // 따라서 isComposing 중일때는 반환하여 이벤트를 한번만 트리거한다.
  if (e.nativeEvent.isComposing) return;

  const key = e.key;
  if (key === "ArrowDown") {
    setSelected(selected + 1 > recommendedKeywords.length ? 1 : selected + 1);
  } else if (key === "ArrowUp") {
    setSelected(selected - 1 < 1 ? recommendedKeywords.length : selected - 1);
  } else if (key === "Enter") {
		// keyword가 ""라면 반환
    if (!keyword) return;

    // 만약 선택된 상태라면 recommendedKeywords에서 해당 인덱스의 keyword를 검색
    // 만약 선택된 상태가 아니라면 (selected가 0이라면) keyword를 바로 검색
    const newRecommendedKeywords = updateRecentKeywords(
      selected ? recommendedKeywords[selected - 1] : keyword
    );
    setRecommendedKeywords(newRecommendedKeywords);
    setKeyword(selected ? recommendedKeywords[selected - 1] : keyword);
  }
};
```

## useDebounce를 통한 성능 최적화

input이 변경될때마다 api를 호출하는것을 최적하기 위해 useDebounce 커스텀 훅을 생성하여 진행했다. value가 변경될때마다 클리어하는 타이머를 설정하고, delay가 지나도 value가 변경되지 않으면 action을 실행한다.

```tsx
// hooks/useDebounce
function useDebounce<T>({ value, action, delay }: Props<T>) {
  useEffect(() => {
    const handler = setTimeout(() => {
      action();
    }, delay);

    return () => clearTimeout(handler);
  }, [value]);
}
```

#### 사용법

```jsx
// components/KeywordInput
useDebounce({
  value: keyword,
  action: async () => {
    try {
      if (keyword !== "") {
	// keyword가 존재한다면 추천 검색어를 fetch 및 표시
        const res = await fetchSearch(keyword);
        setRecommendedKeywords(formatRecommendedKeywords(res.data));
      } else {
	// keyword가 ""라면 최근 검색어를 표시
        setRecommendedKeywords(readRecentKeywords);
      }
    } catch (e) {
      // 에러가 났다면 최근 검색어를 빈 문자열로 변경
      setRecommendedKeywords([]);
      console.log(e);
    } finally {
      setIsSearching(false);
    }
  },
  delay: 500,
});
```

## forwardRef 및 useForwardRef

```jsx
KeywordMain
├── KeywordInput
└── KeywordList
```

검색창의 구조는 위와 같이 구성되어 있는데, KeywordList에서 추천검색어를 통해 검색을 하면 KeywordInput을 blur하고 싶었다. KeywordInput속 input의 ref를 KeywordList로 전달하기 위해서 ContextAPI를 사용하는것은 배보다 배꼽이 더 커지는 느낌이라 상위 컴포넌트로 ref를 전달할 수 있는 방법이 있을까 찾아봤고, forwardRef를 사용하면 상위 컴포넌트로 ref 전달이 가능했다.

<pre class="language-jsx"><code class="lang-jsx">// components/KeywordMain

// 상위 컴포넌트에서는 별다를게 없다
const KeywordMain = () => {
    const inputRef = useRef&#x3C;HTMLInputElement>(null);
    return (
        &#x3C;KeywordInput ref={inputRef} />
    );
};

// components/KeywordInput
// 하위 컴포넌트에서는 아래와 같이 컴포넌트를 forwardRef로 감싸주어야 한다.
const KeywordInput = forwardRef&#x3C;HTMLInputElement, Props>(
    ( { /* Props */ } , ref ) => {
<strong>        // 또한 해당 forwardRef는 callback ref이거나 object ref일 수 있는데,
</strong>        // 이를 해결해주기 위해서 useForwardRef라는 커스텀훅을 만들어 사용했다.
        // 해당 훅은 forwardRef가 callback인지 object인지를 확인해서 새로운 ref를 연결해준다.
        const refLocal = useForwardRef&#x3C;HTMLInputElement>(ref);
        
        const handleEnterPress = (keyword: string, recents: string[]) => {
            // useForwardRef를 사용하면 아래와 같이 사용할 수 있다.
            refLocal.current.blur();
            ...
        }
        
        return (
            &#x3C;S.SearchInput ref={refLocal} />
            ...
        )
    }
);
</code></pre>

아래와 같이 따로 refLocal을 만들어주지 않고 타입캐스트를 해주는 방법도 가능하다

```jsx
// components/KeywordInput
// 하위 컴포넌트에서는 아래와 같이 컴포넌트를 forwardRef로 감싸주어야 한다.
const KeywordInput = forwardRef<HTMLInputElement, Props>(
  ( { /* Props */ }, ref ) => {
  
    const handleEnterPress = (keyword: string, recents: string[]) => {
      // ref가 object라고 명시하여 타입캐스트한다.
      (ref as RefObject<HTMLInputElement>).current?.blur();
      ...
    }
    
    return (
      // input에도 기존 ref를 전달해주면 된다
      <S.SearchInput ref={ref} />
      ...
    )
  }    
);
```
