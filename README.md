# AML Checker

**AML Checker** — кроссплатформенное приложение (SwiftUI + Node.js), позволяющее валидировать криптовалютные адреса и получать их базовую AML-информацию. Поддержка Ethereum, Bitcoin и Solana.

---

## Стек

### Frontend

- `Swift`
- `SwiftUI`
- `Combine` / `async/await`
- `MVVM`
- Реализация под macOS/iOS

### Backend

- `Node.js` + `TypeScript`
- `Express`
- `Web3` библиотеки:
  - `ethers` — для Ethereum
  - `bitcoinjs-lib` — для Bitcoin
  - `@solana/web3.js` — для Solana
- REST API
- Внешние AML-источники: BlockCypher, Etherscan, Solana RPC

---

## Структура проекта

AML-Checker/
├── frontend/ # SwiftUI Xcode проект
│ └── AMLChecker.xcodeproj
├── backend/ # Node.js backend
│ ├── src/
│ │ ├── controllers/
│ │ ├── services/
│ │ ├── adapters/
│ │ └── index.ts
│ ├── package.json
│ ├── tsconfig.json
│ └── .env
└── README.md

---

## Быстрый старт (Backend)

### Установка

```bash
cd backend
npm install
npm run start
```

### Скрипты

```bash
npm run dev
Запуск в режиме разработки (nodemon)

npm run build
Сборка проекта (tsc)

npm start
Запуск собранного проекта (dist/)

npm run lint
Проверка ESLint

npm run format
Форматирование кода (prettier)
```
