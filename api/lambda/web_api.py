import json
import os
import re

import boto3
from botocore.exceptions import ClientError

RECIPIENT_EMAIL = "takahashi@i-rela.com"
SENDER_EMAIL = os.environ.get("SES_SENDER_EMAIL", "")
AWS_REGION = os.environ.get("AWS_REGION", "ap-northeast-1")

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _cors_headers() -> dict:
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
        "Content-Type": "application/json",
    }


def _resp(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": _cors_headers(),
        "body": json.dumps(body, ensure_ascii=False),
    }


def lambda_handler(event, _context):
    path = event.get("path", "/")
    method = event.get("httpMethod", "GET").upper()

    if method == "OPTIONS":
        return {"statusCode": 200, "headers": _cors_headers(), "body": ""}

    if path == "/contact" and method == "POST":
        return _handle_contact(event)

    return _resp(404, {"error": "Not found"})


def _handle_contact(event) -> dict:
    try:
        body = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return _resp(400, {"error": "リクエスト形式が正しくありません"})

    name = str(body.get("name", "")).strip()
    email = str(body.get("email", "")).strip()
    subject = str(body.get("subject", "")).strip()
    message = str(body.get("message", "")).strip()

    if not all([name, email, subject, message]):
        return _resp(400, {"error": "すべての項目を入力してください"})

    if not _EMAIL_RE.match(email):
        return _resp(400, {"error": "メールアドレスの形式が正しくありません"})

    if not SENDER_EMAIL:
        return _resp(500, {"error": "送信者メールアドレスが設定されていません"})

    email_text = (
        f"HeatEye ダッシュボードよりお問い合わせが届きました。\n\n"
        f"【お名前】{name}\n"
        f"【返信先メールアドレス】{email}\n"
        f"【件名】{subject}\n\n"
        f"【お問い合わせ内容】\n{message}\n"
    )

    ses = boto3.client("ses", region_name=AWS_REGION)
    try:
        ses.send_email(
            Source=SENDER_EMAIL,
            Destination={"ToAddresses": [RECIPIENT_EMAIL]},
            Message={
                "Subject": {
                    "Data": f"[HeatEye お問い合わせ] {subject}",
                    "Charset": "UTF-8",
                },
                "Body": {"Text": {"Data": email_text, "Charset": "UTF-8"}},
            },
            ReplyToAddresses=[email],
        )
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code == "MessageRejected":
            return _resp(500, {"error": "送信者アドレスがSESで未確認です"})
        return _resp(500, {"error": "メールの送信に失敗しました"})

    return _resp(200, {"message": "お問い合わせを受け付けました"})
