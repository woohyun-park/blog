# \[원티드 프리온보딩] react.js로 todolist 구현하기

원티드 프리온보딩 사전과제를 팀 단위의 best practice로 합치면서 고민했던 내용을 정리해본다. best practice를 도출하는 과정은 best practice와 가깝다고 생각하는 하나의 레포를 투표를 통해 선정하고, 해당 레포를 리팩토링하는 방식으로 진행했다.

## 팀으로 일하는 법

여러 팀원들의 코딩 스타일을 일치시키기 위해 eslint, prettier, husky, gitmessage.txt 설정을 진행했다.

### eslint

`npm install eslint —-save dev`

### prettier

`npm install prettier --save-dev`

### eslint-config-prettier

`npm install eslint-config-prettier --save-dev`

eslint는 린팅을, prettier는 포맷팅을 담당하는 구조가 이상적인데, eslint에 일부 포맷팅 관련 설정이 존재하므로 설정 충돌을 방지하기 위한 플러그인을 적용해준다.

eslint와 prettier 설정파일은 팀원분들 중 한분이 사용하고 있던 설정을 적용했다.

### husky

린팅과 포맷팅을 강제하기 위하여 huksy를 사용하였다. npm install 과정에서 pre-commit, pre-push와 같은 git hook 설정을 간편하게 적용시킬 수 있다. huksy 설정 과정은 아래와 같다.

1. `npm install husky —-save-dev`
2. `npx huksy install`
3.  `package.json` 에 postinstall, format, lint 스크립트 추가

    1. 포맷팅 후에는 바로 stage가 가능하도록 `git add .` 을 추가

    ```jsx
    // package.json
    "scripts": {
      "postinstall": "husky install",
      "format": "prettier --cache --write . && git add .",
      "lint": "eslint --cache ."
    },
    ```
4. pre-commit과 pre-push 훅 추가
   1. `npx husky add .husky/pre-commit “npm run format”`
   2. `npx husky add .husky/pre-push “npm run lint”`

husky를 설정하고 레포에 적용하면, 이후 팀원들은 npm install을 실행하면 자동으로 husky가 설치되고, commit과 push를 할때마다 pre-commit과 pre-push 훅이 실행되게 된다.

### gitmessage

또한 커밋 메시지 템플릿 설정을 위해 `.gitmessage.txt`를 생성하고 레포를 클론하고 난 후에 아래 명령어를 입력하도록 공지했다.

`git config --global commit.template .gitmessage.txt`

다만, 단순히 해당 명령어를 입력하도록 공지하는것보단 postinstall에 해당 스크립트를 추가하여 gitmessage를 강제할수도 있었겠다. 다만 --global 옵션은 제외시켜서 해당 레포에서만 적용될 수 있도록 하면 되지 않을까?

## 인증 확인 및 라우팅

기존에는 ContextAPI를 활용해서 전역으로 토큰을 관리하고 각각의 페이지에서 useEffect를 사용해서 토큰이 존재하는지 확인하고, 존재하지 않는다면 signin 페이지로 이동하도록 코드가 짜여있었는데, 해당 방법을 사용했을때 몇가지 문제점들이 존재했다.

1. **토큰값이 만료되거나 변경이 있을 때 제대로 반영하지 못한다.** 예를 들어 토큰의 유효기간이 지났을 때에도 전역으로 저장된 값이 있기 때문에 todo로 이동하려고 할 때 그대로 todo로 이동하게 된다. 하지만 localStorage에서 그때그때 가져와서 사용한다면 토큰의 유효기간이 지났을 때는 todo로 이동하려고 해도 signin 페이지로 이동할 것이다.
2. **잘못된** **페이지가 렌더링되었다 사라지는 현상이 존재한다.** 로그인이 되지 않았는데 todo로 주소창을 통해 바로 접근하면 todo 컴포넌트가 잠깐 렌더링되었다가 useEffect가 실행되면 signin 페이지로 이동하는 현상이 있었다.
3. **불필요하고 중복된 context와 useEffect가 각각의 페이지에서 존재한다.** 각각의 페이지는 context로 token을 확인하여 redirect시키는 비슷한 코드가 반복적으로 존재하며 이를 효율적으로 관리하기 어렵다.

따라서 해당 문제점들을 해결하기 위해서 나는 아래와 같은 방식을 사용했다.

### 1. **localStorage를 위한 유틸함수 생성**

```jsx
// utils/token.js
export function getToken() {
  return localStorage.getItem('token');
}

export function setToken(token) {
  return localStorage.setItem('token', token);
}

export function checkToken() {
  return getToken() ? true : false;
}
```

어차피 localStorage는 전역에서 접근이 가능하기 때문에 `localStorage.getItem()` , `localStorage.setItem()` 과 같이 길게 작성할 필요없이 간단하게 게터와 세터로 토큰을 사용할 수 있는 utils 함수를 생성하였다.

### 2. **ProtectedRouter을 사용하여 인증정보 확인**

`ProtectedRoute`이라는 하나의 컴포넌트에서 라우팅 로직을 처리하여 보다 효율적이고 직관적이며, 최상단에서 컴포넌트 접근을 원천 차단할 수 있다

```jsx
// App.js
const routes = createRoutesFromElements(
  <Route element={<ProtectedRoute />}>
    <Route path="/*" element={<Home />} />
    <Route path="/signin" element={<SignIn />} />
    <Route path="/signup" element={<SignUp />} />
    <Route path="/todo" element={<Todo />} />
  </Route>
);

// routes/ProtectedRoute.js
export default function ProtectedRoute() {
  const { pathname } = useLocation();

  return isAuthorized() ? (
    pathname === '/todo' ? (
      <Outlet />
    ) : (
      <Navigate to="/todo" />
    )
  ) : pathname === '/signin' || pathname === '/signup' ? (
    <Outlet />
  ) : (
    <Navigate to="/signin" />
  );
}
```

### + 코드 리펙토링

ProtectedRoute 컴포넌트는 아래와 같은 문제점이 있다고 멘토님께서 지적해주셨다.

* 삼항연산자의 중첩이 무조건 나쁘지는 않으나, 코드가 linear하게 읽히는 것은 중요하다!
* 하나의 함수는 한 가지 일만 처리하는것이 이상적이다
* 많은 의존성을 가지는것은 좋지 않다.

#### 수정 전

* 삼항연산자가 중첩되어 있어 생각할거리가 많다
* pathname에 의존하고 있기 때문에 만약 pathname이 변경되는 경우, 현재 컴포넌트도 그에따라 변경해줘야한다.

```jsx
export const ProtectedRoute = () => {
  const { pathname } = useLocation();
  const isAuthorized = localStorage.getItem('token');

  return isAuthorized ? (
    pathname === '/todo' ? (
      <Outlet />
    ) : (
      <Navigate to="/todo" />
    )
  ) : pathname === '/signin' || pathname === '/signup' ? (
    <Outlet />
  ) : (
    <Navigate to="/signin" />
  );
};
```

#### **수정 후 1**

* authorized와 unauthorized 상태를 따로 작성하여 코드가 리니어하게 읽힌다.

```jsx
export const ProtectedRoute = () => {
  const { pathname } = useLocation();
  const isAuthorized = localStorage.getItem('token');

  if(isAuthorized) {
    if(pathname !== "todo") return <Outlet />
    else return <Navigate to="todo" />
  }

  if(!isAuthorized) {
    if(pathname === "signin" || pathname === "signup") return <Outlet />
    else return <Navigate to="/signin" />
  }
};
```

#### **수정 후 2**

* 하나의 컴포넌트가 하나의 기능만을 수행하도록 두개의 컴포넌트로 분리하였다.
* 코드가 리니어하게 읽힌다.
* pathname에 대한 의존성을 삭제하였다.

```jsx
export const AuthorizedRoute = () => {
  const isAuthorized = localStorage.getItem('token');

	if(isAuthorized) return <Navigate to="todo"/>
	return <Outlet/>
};

export const ProtectedRoute = () => {
	const isAuthorized = localStorage.getItem('token');
	
	if(!isAuthorized) return <Navigate to="/signin"/>
	return <Outlet/>
}
```

## API 요청

아래와 같이 `axios.create()` 을 사용하여 baseURL와 header를 미리 설정해두면 매 요청마다 해당 값들을 전달해줄 필요가 없다.

```jsx
// apis/client.js
export const client = axios.create({
  baseURL: BASE_URL,
  headers: {
    Authorization: `Bearer ${getToken()}`,
    'Content-Type': 'application/json',
  },
});
```

```jsx
// apis/todo.js
import { client } from './client';

export const createTodo = async (todo) => {
  return await client.post('/todos', todo);
};

export const getTodo = async () => {
  return await client.get('/todos');
};

export const updateTodo = async ({ id, todo, isCompleted }) => {
  return await client.put(`/todos/${id}`, { todo, isCompleted });
};

export const deleteTodo = async ({ id }) => {
  return await client.delete(`/todos/${id}`);
};
```

## 최적화

### useFetch와 useMutation

다른 팀원분이 useFetch와 useMutation이라는 커스텀 훅을 사용해서 서버 요청을 최적화했다. 코드의 작동방식은 다음과 같았다

#### useFetch

useFetch는 get에 대한 요청을 처리하여 서버의 데이터를 저장한다.

```jsx
export const useFetch = (fetchAPI) => {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);

      const responseData = await fetchAPI();
      setData(responseData);
    } catch (error) {
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchAPI]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    refetch();
  }, [refetch]);

  return { data, isLoading, error, isError: error !== null, refetch };
};
```

#### useMutation

useMutation은 create, update, delete에 대한 요청을 처리한다.

```jsx
export const useMutation = (
  fetchAPI,
  { onSuccess, onError } = {
    onSuccess: undefined,
    onError: undefined,
  }
) => {
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const mutation = useCallback(
    async (requestData) => {
      setIsLoading(true);

      try {
        const responseData = await fetchAPI(requestData);

        setData(responseData);
        onSuccess?.(responseData || requestData);
      } catch (error) {
        setError(error);
        onError?.(error);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchAPI, onSuccess, onError]
  );

  return [mutation, { data, isLoading, error, isError: error !== null }];
};
```

그리고 변경사항(create, update, delete)가 있을때에는 mutate을 통해서 서버의 데이터를 변경하고, refetch를 통해서 서버의 데이터를 다시 get해온다.

```jsx
export function DeleteTodo({ id, refetch }) {
  const { deleteTodo } = useTodo();
  const { mutate } = deleteTodo();

  const clickHandler = async () => {
    await mutate({ id });
    await refetch();
  };

  return (
    <DeleteButton data-testid="delete-button" onClick={clickHandler}>
      ❌
    </DeleteButton>
  );
}
```

검색해보니 아마 탠스택 쿼리에서 지원하는 기능들을 임의로 구현해놓으신 것 같은데, 해당 방식의 장점과 사용법 등 탠스택 쿼리에 대해서 조금 더 공부해보기로 했다.

잘만 사용하면 전역상태관리가 비대해진 내 개인 프로젝트에 적용시켜서 코드의 복잡도를 확 낮출 수 있을 것 같다.

## 기타

### index.js의 사용

index.js를 사용하면 import를 단축시킬 수 있다는 것을 처음 알게 되었다. 예를 들어 todo라는 폴더에 TodoItem.js와 TodoList.js가 존재한다고 가정해보자. index.js가 있을때와 없을 때 import의 길이가 다음과 같이 차이나게 된다.

* **index.js가 없을때**

```jsx
import “TodoItem” from “todo/TodoItem”
import “TodoList” from “todo/TodoList”
```

* **index.js가 있을때**

```jsx
import { TodoItem, TodoList } from “todo”
```

index.js는 다음과 같이 작성하면 된다

```jsx
export * from './TodoItem';
export * from "./TodoList';
```

물론 vscode에서 import를 자동으로 해주기때문에 크게 신경쓸만한 부분이 아니긴 하지만, 그래도 import가 상단에 주르륵 난무하는것보단 깔끔하게 보여지는게 좋은 것 같다.
