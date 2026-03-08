# ⚠️ ※現時点ではこの内容はテンプレートのままであり、内容は正しくありません。

# HeatEye デプロイ手順

このドキュメントでは HeatEye システムのデプロイ手順を説明します。

---

# 開発時デプロイ手順

**NEXT.jsのfrontendのアプリケーションを改修した際には、以下の手順でデプロイします。**

* ルート(HeatEye)フォルダ直下に移動
```
git add -A
git commit -m "in-work 2026/03/08 00:08"
git push origin amplify
```
※コメントは、新しい機能を追加する際には「(start)」の後に機能の説明を付加する。  
※新機能が完成するまでの間は、コメントをイチイチ考えるのは手間なので、「inwork yyyy/mm/dd hh:00」形式でデプロイした時間のみを記録する。  
※新機能が一通り動くようになったら「(complete)」の後に機能の説明を付加する。  

**s3やdynamodbの変更を反映する場合は、上記に加えて以下を実行する。**
```
npx serverless deploy
```

# システム構成

HeatEye は以下の構成で動作します。

* Next.js フロントエンド（Amplify Hosting）
* API（Lambda + Serverless Framework）
* DynamoDB
* Cognito
* S3

---

# 開発環境の準備

必要ツール

```
Node.js
npm
AWS CLI
Serverless Framework
```

AWSログイン確認

```
aws configure
```

---

# API デプロイ

API（Lambda）は Serverless Framework を使用します。

APIディレクトリへ移動

```
cd api
```

デプロイ

```
npx serverless deploy
```

エンドポイント確認

```
npx serverless info
```

例

```
GET https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/plants
```

---

# フロントエンドデプロイ

フロントエンドは Amplify Hosting により自動デプロイされます。

```
git push origin main
```

Amplify Console にてビルドが開始されます。

確認場所

```
AWS Console
→ Amplify
→ HeatEye
→ Build logs
```

---

# 環境変数

Amplify Console で以下の環境変数を設定します。

例

```
NEXT_PUBLIC_API_BASE_URL
NEXT_PUBLIC_REGION
NEXT_PUBLIC_USER_POOL_ID
NEXT_PUBLIC_USER_POOL_CLIENT_ID
```

---

# DynamoDB 確認

テーブル一覧確認

```
aws dynamodb list-tables
```

主要テーブル

| テーブル        | 用途     |
| ----------- | ------ |
| plants      | プラント情報 |
| user_plants | ユーザー権限 |

---

# CloudFront キャッシュ削除（必要な場合）

```
aws cloudfront create-invalidation \
--distribution-id XXXXX \
--paths "/*"
```

通常は Amplify が自動で処理します。

---

# 本番デプロイ

本番デプロイは main ブランチから実施します。

```
git push origin main
```

Amplify が自動ビルド・デプロイを行います。

---

# 確認事項

デプロイ後は以下を確認します。

* API Gateway エンドポイント
* DynamoDB アクセス
* Cognito 認証
* Amplify ビルド状態
