#!/usr/bin/env bash
set -euo pipefail

SERVICE_DIR="$(cd "$(dirname "$0")/../serverless/sls-lifescape" && pwd)"
cd "$SERVICE_DIR"

PROFILE="${AWS_PROFILE:-lifescape}"
REGION="${AWS_REGION:-us-east-1}"
DRY_RUN="${DRY_RUN:-0}"
S3_BUCKET="${S3_BUCKET:-lifescape-lambda-deployments}"

if [[ $# -eq 0 ]]; then
  FUNCTIONS=("LifeScape-prod-createMoment" "LifeScape-prod-createThread" "LifeScape-prod-getThread")
else
  FUNCTIONS=("$@")
fi

TMP_DIR="$(mktemp -d)"
ZIP_FILE="$TMP_DIR/deploy-lambda-package.zip"
S3_KEY="lambda-packages/deploy-$(date +%Y%m%d-%H%M%S).zip"

# Note: aws-sdk is now included because Node.js 18+ doesn't bundle it
zip -rq "$ZIP_FILE" . -x "*.DS_Store*" -x "node_modules/.cache/**" -x ".serverless/**" -x "event/**"
ZIP_SIZE=$(du -m "$ZIP_FILE" | cut -f1)
echo "Created package: $ZIP_FILE (${ZIP_SIZE}M)"

# If package > 50MB, use S3 upload
if [[ $ZIP_SIZE -gt 49 ]]; then
  echo "Package exceeds 50MB, uploading to S3..."
  
  # Create bucket if it doesn't exist
  aws s3 mb "s3://$S3_BUCKET" --profile "$PROFILE" --region "$REGION" 2>/dev/null || true
  
  # Upload to S3
  aws s3 cp "$ZIP_FILE" "s3://$S3_BUCKET/$S3_KEY" --profile "$PROFILE" --region "$REGION"
  echo "Uploaded to s3://$S3_BUCKET/$S3_KEY"
  
  for FUNC in "${FUNCTIONS[@]}"; do
    echo "Updating $FUNC..."
    if [[ "$DRY_RUN" == "1" ]]; then
      echo "Dry run: aws lambda update-function-code --function-name \"$FUNC\" --s3-bucket \"$S3_BUCKET\" --s3-key \"$S3_KEY\" --profile \"$PROFILE\" --region \"$REGION\""
    else
      aws lambda update-function-code \
        --function-name "$FUNC" \
        --s3-bucket "$S3_BUCKET" \
        --s3-key "$S3_KEY" \
        --profile "$PROFILE" \
        --region "$REGION"
    fi
  done
else
  for FUNC in "${FUNCTIONS[@]}"; do
    echo "Updating $FUNC..."
    if [[ "$DRY_RUN" == "1" ]]; then
      echo "Dry run: aws lambda update-function-code --function-name \"$FUNC\" --zip-file \"fileb://$ZIP_FILE\" --profile \"$PROFILE\" --region \"$REGION\""
    else
      aws lambda update-function-code \
        --function-name "$FUNC" \
        --zip-file "fileb://$ZIP_FILE" \
        --profile "$PROFILE" \
        --region "$REGION"
    fi
  done
fi

rm -rf "$TMP_DIR"
echo "Deployment complete for functions: ${FUNCTIONS[*]}"



