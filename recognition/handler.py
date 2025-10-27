import os, io, json, time, traceback
import boto3
from PIL import Image
import google.generativeai as genai

S3 = boto3.client('s3')
DDB = boto3.client('dynamodb')

RESULTS_TABLE   = os.environ['RESULTS_TABLE']
MODEL_NAME      = os.environ.get('MODEL_NAME', 'gemini-1.5-flash')
S3_RESULT_SUFFIX= os.environ.get('S3_RESULT_SUFFIX', '.result.json')

genai.configure(api_key=os.environ['GEMINI_API_KEY'])
_model = genai.GenerativeModel(MODEL_NAME)

def _base_no_ext(key): return key.rsplit('.',1)[0]
def _csv_key_for_image(k): return _base_no_ext(k) + '.csv'
def _result_key_for_image(k): return _base_no_ext(k) + S3_RESULT_SUFFIX

def _get_obj(bucket, key):
  try:
    return S3.get_object(Bucket=bucket, Key=key)['Body'].read()
  except Exception:
    return None

def _parse_attrs_csv(b):
  if not b: return {}
  try: txt = b.decode('utf-8-sig')
  except UnicodeDecodeError: txt = b.decode('utf-8', errors='ignore')
  lines = [l.strip() for l in txt.splitlines() if l.strip()]
  if len(lines) < 2: return {}
  hdr = [h.strip() for h in lines[0].split(',')]
  val = [v.strip().strip('"') for v in lines[1].split(',')]
  return dict(zip(hdr, val))

def _retry(fn, retries=4, base=1.0, maxd=8.0):
  d=base; last=None
  for i in range(retries):
    try: return fn()
    except Exception as e:
      last=e; msg=str(e).lower()
      if i==retries-1 or not any(k in msg for k in ['rate','quota','429','timeout','temporar']): raise
      time.sleep(d); d=min(d*2, maxd)
  if last: raise last

def _infer(img_bytes, prompt, timeout=30):
  Image.open(io.BytesIO(img_bytes)).verify()
  return _retry(lambda: (_model.generate_content(
    [prompt, {"mime_type":"image/jpeg","data":img_bytes}],
    request_options={"timeout": timeout},
  ).text or ""))

def _prompt_for(company, mac):
  return "この計器画像から針の示す値（または読み取りたい数値）だけを返してください。単位や説明文は不要です。"

def recognize_image(event, context):
  for rec in event.get('Records', []):
    try:
      if rec.get('eventSource') != 'aws:s3': continue
      bucket = rec['s3']['bucket']['name']
      key    = rec['s3']['object']['key']
      if not key.lower().endswith(('.jpg','.jpeg')): continue

      # 既に結果があればスキップ
      try:
        S3.head_object(Bucket=bucket, Key=_result_key_for_image(key))
        continue
      except Exception:
        pass

      img = _get_obj(bucket, key)
      if not img: raise RuntimeError(f"image missing: s3://{bucket}/{key}")
      attrs = _parse_attrs_csv(_get_obj(bucket, _csv_key_for_image(key)))
      company = attrs.get('company','UNKNOWN')
      mac     = attrs.get('mac_addr','UNKNOWN')
      ts      = attrs.get('timestamp')

      value = _infer(img, _prompt_for(company, mac)) or "ERROR: empty"

      result = {
        "company": company, "mac_addr": mac, "timestamp": ts,
        "image_key": key, "result_value": value, "model": MODEL_NAME,
        "lambda_ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
      }
      S3.put_object(Bucket=bucket, Key=_result_key_for_image(key),
                    Body=json.dumps(result, ensure_ascii=False).encode('utf-8'),
                    ContentType='application/json')

      sort_key = f"{ts or ''}#{mac}#{key.split('/')[-1]}"
      DDB.put_item(TableName=RESULTS_TABLE, Item={
        "company":{"S":company}, "sort_key":{"S":sort_key},
        "image_key":{"S":key}, "value":{"S":value}, "model":{"S":MODEL_NAME},
        "mac_addr":{"S":mac}, "timestamp":{"S":ts or ''},
      })

    except Exception as e:
      try:
        err = {"error": str(e), "trace": traceback.format_exc(), "image_key": rec.get('s3',{}).get('object',{}).get('key')}
        S3.put_object(Bucket=bucket, Key=_base_no_ext(key)+'.error.json',
                      Body=json.dumps(err, ensure_ascii=False).encode('utf-8'),
                      ContentType='application/json')
      except Exception:
        pass
  return {"ok": True}
