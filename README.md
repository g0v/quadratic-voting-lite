# 平方投票精簡版 (WIP)

一個輕量級的平方投票活動網頁應用程式。使用 Nuxt.js、Prisma 和 Tailwind CSS 建構。

## 為什麼做這個

本來是想 Fork https://quadraticvote.radicalxchange.org/ 來修改，但 node 版本實在太舊了，跑得起來但修復麻煩，索性參考架構重作。

## 什麼是平方投票？

平方投票是一種投票系統，投票者可以分配多張選票來表達其偏好的強度。選票成本呈平方增長 - 如果你想投 2 票，需要花費 4 個積分；3 票需要 9 個積分，以此類推。這個系統有助於防止灌票，讓少數偏好得到更好的代表。

## 功能特色

- **活動創建**：創建具有自定義標題和描述的投票活動
- **主題管理**：為投票添加多個主題/選項
- **QR 碼生成**：生成 QR 碼以便輕鬆訪問投票頁面
- **即時投票**：具有積分追蹤的互動式投票介面
- **管理儀表板**：管理活動、添加主題並生成投票連結
- **響應式設計**：支援桌面和行動裝置

## 技術架構

- **前端**：Nuxt.js 4、Vue.js 3、Tailwind CSS
- **後端**：Nuxt.js 伺服器路由
- **資料庫**：使用 Prisma ORM 的 SQLite
- **QR 碼**：外部 QR 碼生成服務

## 系統需求

- Node.js（版本 18 或更高）
- npm、yarn、pnpm 或 bun

## 安裝

1. 複製儲存庫：
```bash
git clone <repository-url>
cd quadratic-voting-lite
```

2. 安裝依賴項：
```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

3. 設定資料庫：
```bash
# 生成 Prisma 客戶端
npx prisma generate

# 執行資料庫遷移
npx prisma migrate dev
```

4. 在根目錄創建 `.env` 檔案：
```env
DATABASE_URL="file:./dev.db"
```

## 開發

在 `http://localhost:3000` 啟動開發伺服器：

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## 使用方式

### 創建活動

1. 導航到首頁並點擊「創建活動」
2. 填寫活動標題和描述
3. 點擊「創建活動」生成新的投票活動

### 管理活動

1. 創建活動後，您將被重定向到管理頁面
2. 通過填寫表單為投票添加主題/選項
3. 通過指定所需投票數量生成投票連結
4. 列印頁面以獲取每個投票連結的 QR 碼

### 投票

1. 掃描 QR 碼或直接訪問投票連結
2. 每個投票者獲得 99 個積分可花費
3. 點擊 +/- 按鈕為不同主題分配選票
4. 選票成本呈平方增長（1 票 = 1 積分，2 票 = 4 積分，等等）
5. 投票會隨著您的選擇自動儲存

## 生產環境

為生產環境建構應用程式：

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

本地預覽生產建構：

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

## 資料庫結構

應用程式使用簡單的結構，包含兩個主要模型：

- **Event**：包含活動資訊、標題、描述和積分分配
- **Vote**：代表連結到活動的個別投票會話

## 貢獻

1. Fork 儲存庫
2. 創建功能分支
3. 進行您的更改
4. 提交拉取請求

## 授權

此專案為開源專案，採用 [MIT 授權](LICENSE)。 
