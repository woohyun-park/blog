---
description: 작성중 ...
---

# 개인 프로젝트: 하스스톤 퀘스트 알람

## firebase cloud functions

firebase cloud functions를 사용하여 서버의 데이터가 특정 시간에 업데이트 될 수 있도록 설정한다.

하스알림의 모든 유저의 일일 퀘스트 갯수가 매일 새벽 1시에 1이 상승하도록, 그리고 주간 퀘스트 갯수가 매주 월요일 새벽 1시에 3이 상승하도록 설정한다.

### 시작하기

firebase 홈페이지 → functions → 시작하기

### 개발환경 세팅

```tsx
// firebase cli를 install한다
// 성공적으로 install 및 init하면 functions 폴더가 생긴다
npm install -g firebase-tools
firebase init
```

[\[Firebase\] Cloud Functions 세팅](https://velog.io/@leedool3003/Flutter-Firebase-Cloud-Functions-%EC%84%B8%ED%8C%85)

### cloud functions 작성

```tsx
// functions/src/index.ts
// 함수는 위와 같은 경로에 작성한다

// 백엔드에서는 firebase-admin을 사용해주어야 한다
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp({});

const updateBatch = async (type: "daily" | "weekly") => {
  const firestore = admin.firestore();
  const collectionRef = firestore.collection("quests");

	// batch를 사용하면 원자적 읽기 및 쓰기 작업을 지원한다.
	// 원자적 작업 집합에서는 모든 작업이 성공하거나 아니면 모두 적용되지 않는다.
	// batch로 변경사항들을 수정하고 마지막에 batch.commit()을 통해서 변경사항들을 모두 저장한다.
  const batch = firestore.batch();
  const querySnapshot = await collectionRef.get();
  querySnapshot.forEach((doc) => {
    const currentData = doc.data()[type];
    const newData = currentData + 1 > 3 ? 3 : currentData + 1;
    const docRef = collectionRef.doc(doc.id);
    batch.update(docRef, { [type]: newData });
  });
  await batch.commit();
};

// functions 객체에 여러가지 종류의 트리거를 활용하면 백그라운드에서 함수가 실행되는 시점을 결정할 수 있다
// e.g. 지정된 시간에 함수를 실행하도록 예약하기 위해서는 functions.pusbus.schedule().onRun을 사용한다
// e.g. firestore 이벤트와 연결된 핸들러를 만들기 위해서는 functions.firestore.document().onWrtie을 사용한다

export const updateDaily = functions.pubsub
  .schedule("0 1 * * *")
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    updateBatch("daily");
  });

export const updateWeekly = functions.pubsub
  .schedule("0 1 * * 1")
  .timeZone("Asia/Seoul")
  .onRun(async () => {
    updateBatch("weekly");
  });
```

[서버에 Firebase Admin SDK 추가](https://firebase.google.com/docs/admin/setup?hl=ko)

[트랜잭션 및 일괄 쓰기  |  Firestore  |  Firebase](https://firebase.google.com/docs/firestore/manage-data/transactions?hl=ko)

[함수 예약  |  Firebase용 Cloud Functions](https://firebase.google.com/docs/functions/schedule-functions?hl=ko)

### crontab

```tsx
// 특정 시간에 정기적으로 함수나 프로그램을 실행시키기 위한 프로그램
// 공백으로 5개의 값을 구분하여 설정하며, 첫번째부터 각각 분, 시, 일, 월, 요일을 의미한다
// 1. 분: minute을 의미. *을 설정할 경우 1분마다 실행
// 2. 시: hour를 의미. *을 설정할 경우 1시간마다 실행
// 3. 일: day of the month를 의미. *을 설정할 경우 매일 실행
// 4. 월: month를 의미. *를 설정할 경우 매일 실행
// 5. 요일: day of the week를 의미. 0-6까지 순서대로 일-토를 의미. *을 설정할 경우 매일 실행

schedule("0 1 * * *") // 매일 1시에 실행
schedule("0 1 * * 1") // 매주 월요일 1시에 실행
```

[https://velog.io/@jay2u8809/Crontab크론탭-시간-설정](https://velog.io/@jay2u8809/Crontab%ED%81%AC%EB%A1%A0%ED%83%AD-%EC%8B%9C%EA%B0%84-%EC%84%A4%EC%A0%95)

```tsx
// 아래 명령어를 통해 cloud functions를 배포한다
// firebase 홈페이지 - functions - 대시보드에서 함수가 배포된 것을 확인할 수 있다
firebase deploy --only functions
```

## pwa 푸시알람

서버의 데이터가 자동으로 업데이트되도록 설정했으니 이제 업데이트가 될때 푸시알람을 보내는걸 설정해본다.

### firebase 프로젝트 설정

프로젝트 설정 - 클라우드 메세징 - generate key pair을 통해 인증서 키 값을 생성

### next.js에서 알람 수신 설정

```tsx
// public/firebase-messaging-sw.js

importScripts('<https://www.gstatic.com/firebasejs/9.14.0/firebase-app-compat.js>');
importScripts('<https://www.gstatic.com/firebasejs/9.14.0/firebase-messaging-compat.js>');
 
// process.env를 
const config = {
  apiKey: '',
  authDomain: '',
  projectId: '',
  storageBucket: '',
  messagingSenderId: '',
  appId: ''
};
 
firebase.initializeApp(config);
const messaging = firebase.messaging();
```
