# react.js로 검색 기능 구현하기

## 캐싱

기존에 localStorage와 axios를 이용해서 구현하였으나, 웹에서 지원하는 CacheStorageAPI가 있다는 사실을 알게 되어 해당 방법을 사용해서 구현하였다. 따로 axios 설정을 해줄 필요도 없을뿐만 아니라 직관적으로 알맞은 위치인 Cache Storage에 정상적으로 저장이 되는것을 확인하였다.

```tsx
const isExpired = (cachedAt: string | null) => {
  if (!cachedAt) return true;
  return new Date(cachedAt).getTime() + EXPIRE_TIME < new Date().getTime();
};

// fetch가 필요한지 여부를 반환
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
