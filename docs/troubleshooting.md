# ⚠️ ※現時点ではこの内容はテンプレートのままであり、内容は正しくありません。

# HeatEye トラブルシューティング

よく発生する問題と対処方法をまとめています。

---

# Amplify ビルドエラー

確認場所

```
Amplify Console
→ Build logs
```

原因例

* 環境変数不足
* Next.js ビルドエラー

---

# useSearchParams エラー

エラー例

```
useSearchParams() should be wrapped in a suspense boundary
```

原因

Next.js App Router では Suspense が必要です。

対応

```
<Suspense>
  component
</Suspense>
```

---

# API 403 エラー

症状

```
403 Forbidden
```

原因

* Cognito 認証失敗
* API Gateway 認証設定

確認

* JWTトークン
* API Gateway Authorizer

---

# CORS エラー

例

```
Access-Control-Allow-Origin
```

Lambdaレスポンスに以下ヘッダを追加

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: *
Access-Control-Allow-Methods: GET,POST,OPTIONS
```

---

# DynamoDB アクセスエラー

エラー

```
AccessDeniedException
```

原因

IAMポリシー不足

必要権限

```
dynamodb:GetItem
dynamodb:Query
```

---

# Lambdaログ確認

```
npx serverless logs -f functionName
```

または

```
AWS Console
→ CloudWatch
→ Logs
```

---

# APIテスト

```
curl https://xxxxx.execute-api.ap-northeast-1.amazonaws.com/plants
```

---

# 問題が解決しない場合

以下を順に実施

```
1 Serverless 再デプロイ
2 Amplify 再ビルド
3 CloudFront キャッシュ削除
```
