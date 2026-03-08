# ⚠️ ※現時点ではこの内容はテンプレートのままであり、内容は正しくありません。

# HeatEye システム構成

このドキュメントでは HeatEye のシステム構成を説明します。

---

# 全体構成

```
Browser
   │
   ▼
CloudFront
   │
   ▼
Amplify Hosting (Next.js)
   │
   ▼
API Gateway
   │
   ▼
Lambda
   │
   ▼
DynamoDB
```

---

# コンポーネント

## フロントエンド

フレームワーク

```
Next.js
```

ホスティング

```
AWS Amplify Hosting
```

役割

* UI表示
* 認証処理
* API呼び出し

---

## 認証

サービス

```
Amazon Cognito
```

役割

* ユーザー認証
* JWTトークン発行
* APIアクセス制御

---

## API

サービス

```
API Gateway
```

役割

* REST API提供
* Lambda連携
* 認証連携

---

## バックエンド

サービス

```
AWS Lambda
```

役割

* ビジネスロジック
* データ処理
* DynamoDB操作

---

## データベース

サービス

```
Amazon DynamoDB
```

主要テーブル

| テーブル        | 用途     |
| ----------- | ------ |
| plants      | プラント情報 |
| user_plants | ユーザー権限 |

---

# データフロー例

プラント一覧取得

```
Browser
 ↓
Next.js
 ↓
API Gateway
 ↓
Lambda
 ↓
DynamoDB
```

レスポンス

```
DynamoDB
 ↓
Lambda
 ↓
API Gateway
 ↓
Next.js
 ↓
Browser
```

---

# 使用AWSサービス

| サービス        | 用途            |
| ----------- | ------------- |
| Amplify     | フロントエンドホスティング |
| API Gateway | REST API      |
| Lambda      | バックエンド処理      |
| DynamoDB    | データベース        |
| Cognito     | 認証            |
| CloudFront  | CDN           |
| S3          | 静的ファイル保存      |
