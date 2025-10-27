import json, os, base64, boto3
from copy import deepcopy

ddb = boto3.client("dynamodb")
TABLE = os.environ["CONFIG_TABLE"]

def _resp(status, body):
    return {"statusCode": status, "headers":{"Content-Type":"application/json"}, "body": json.dumps(body, ensure_ascii=False)}

def _as_obj(item):
    from boto3.dynamodb.types import TypeDeserializer
    return TypeDeserializer().deserialize({"M": item}) if item else {}

def _get_item(company: str, sort_key: str):
    r = ddb.get_item(TableName=TABLE, Key={
        "company": {"S": company},
        "sort_key": {"S": sort_key}
    })
    if "Item" not in r: return {}
    return _as_obj(r["Item"])

def _deep_merge(a: dict, b: dict):
    out = deepcopy(a)
    for k, v in b.items():
        if k in out and isinstance(out[k], dict) and isinstance(v, dict):
            out[k] = _deep_merge(out[k], v)
        else:
            out[k] = deepcopy(v)
    return out

def handler(event, context):
    try:
        body = event.get("body") or "{}"
        if event.get("isBase64Encoded"): body = base64.b64decode(body).decode("utf-8")
        req = json.loads(body)

        company  = req["company"]
        mac_addr = req["mac_addr"]              # 例 "24:6F:28:xx:yy:zz"
        mac_key  = f"MAC#{mac_addr.replace(':','-')}"

        default_cfg = _get_item(company, "DEFAULT")
        override_cfg= _get_item(company, mac_key)

        merged = _deep_merge(default_cfg, override_cfg)
        merged.setdefault("version", {})
        merged["version"]["server"] = context.aws_request_id
        merged.setdefault("client_cache_ttl_sec", 86400)  # 端末キャッシュ推奨 24h

        return _resp(200, merged)
    except Exception as e:
        return _resp(400, {"error": str(e)})
