# npm i VS. npm ci

## `npm i (npm install)`

* 로컬 `node_modules` 폴더에 dependency를 설치. 설치시에는 `npm-shrinkwrap.json` , `package-lock.json` , `yarn.lock` 을 순서대로 확인하여 설치하며, `package.json` 의 모든 파일을 설치
* `--global (-g)` 플래그를 사용하면 global package로 설치
* `—-production` 플래그를 사용하면 `devDependencies`는 설치하지 않음

## `npm ci (npm clean-install)`

* `package-lock.json` 에 명시되어있는 패키지 정보를 활용하여 정확한 버전의 패키지를 `node_modules`에 설치하여 모든 개발자들이 동일한 버전의 패키지를 사용함을 보장
* `package-lock.json`을 수정하지 않으며, 만약 `package.json` 과 dependency가 일치하지 않으면 에러. 또한 `package-lock.json`이 반드시 필요.
* `node_modules` 폴더가 존재하면 해당 폴더를 삭제하고 설치
* 자동화, 테스트 환경, 배포 환경에서 dependency를 정확하게 설치하기 위함.

## 링크

[npm-ci | npm Docs](https://docs.npmjs.com/cli/v9/commands/npm-ci)
