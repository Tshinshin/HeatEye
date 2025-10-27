#!/usr/bin/env bash
set -eu
TABLE="${1:-CompanyCameraConfig}"

aws dynamodb put-item --table-name "$TABLE" --item '{
  "company": {"S":"Future Relations"},
  "sort_key": {"S":"DEFAULT"},
  "image": {"M": { "frame_size": {"S":"SXGA"}, "jpeg_quality":{"N":"10"} }},
  "device": {"M": { "max_files_to_upload":{"N":"10"} }},
  "schedule": {"M": { "hour":{"N":"13"}, "min":{"N":"0"}, "isPicture":{"N":"1"}, "interval_sec":{"N":"14400"} }},
  "recognition": {"M": { "thresholds": {"M": {"gauge_edge":{"N":"0.35"}, "ocr_conf":{"N":"0.6"}}}} },
  "upload": {"M": { "url_ttl":{"N":"90"} }}
}'

aws dynamodb put-item --table-name "$TABLE" --item '{
  "company": {"S":"Future Relations"},
  "sort_key": {"S":"MAC#24-6F-28-00-11-22"},
  "image": {"M": { "frame_size": {"S":"UXGA"}, "jpeg_quality":{"N":"12"} }},
  "schedule": {"M": { "hour":{"N":"9"}, "min":{"N":"30"} }}
}'
