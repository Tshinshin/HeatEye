# ⚠️ ※現時点ではこの内容はテンプレートのままであり、内容は正しくありません。

# HeatEye

HeatEye は、プラント設備の状態監視を目的とした Web システムです。
センサーデータを収集し、クラウド上で可視化・監視を行います。

---

# 主な機能

* プラント設備の監視
* センサーデータの可視化
* ユーザーごとのプラントアクセス制御
* クラウドベースのサーバーレス構成

---

# システム構成

本システムは以下の主要コンポーネントで構成されています。

* Next.js フロントエンド
* AWS Amplify Hosting
* API Gateway
* AWS Lambda
* DynamoDB
* Cognito 認証
* S3

詳細は以下のドキュメントを参照してください。

```
docs/architecture.md
```

---

# リポジトリ構成

```
HeatEye
├ README.md
├ docs
│   ├ deploy.md
│   ├ architecture.md
│   └ troubleshooting.md
├ frontend
│   └ Next.js アプリケーション
└ api
    └ Serverless Framework
```

---

# 開発環境

必要なツール

```
Node.js
npm
AWS CLI
Serverless Framework
```

依存関係のインストール

```
npm install
```

---

# ローカル実行

フロントエンド

```
cd frontend
npm run dev
```

API

```
cd api
npx serverless offline
```

---

# デプロイ

デプロイ手順は以下を参照してください。

```
docs/deploy.md
```

---

# ドキュメント

```
docs/architecture.md
docs/troubleshooting.md
```

---

# ライセンス

社内プロジェクト
