#!/usr/bin/env bash
set -euo pipefail

# AWS 운영 홈페이지 배포. DNS 및 GitHub Pages는 변경하지 않습니다.
readonly ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly DIST_DIR="${ROOT_DIR}/dist"
readonly ACCOUNT_ID="399376050959"
readonly AWS_REGION="ap-northeast-2"
readonly BUCKET="bmsd-homepage-static-399376050959"
readonly DISTRIBUTION_ID="E2S9WRKM37X22G"
readonly DISTRIBUTION_DOMAIN="d1a6u3p5w26p51.cloudfront.net"
readonly AD_DISTRIBUTION_ID="E1YEZX4JAGDCV2"
readonly AD_DISTRIBUTION_DOMAIN="d1oyjttq7vlv4n.cloudfront.net"
readonly BUCKET_ORIGIN="${BUCKET}.s3.${AWS_REGION}.amazonaws.com"
readonly MAIN_URL="https://www.brothermaze.com"
readonly AD_URL="https://www.adhaeyo.com"

usage() {
  printf 'Usage: %s [--dry-run]\n' "$0"
  printf '  --dry-run  Build and show S3 changes without uploading or invalidating CloudFront.\n'
}

dry_run=false
case "${1:-}" in
  '') ;;
  --dry-run) dry_run=true ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac
if (( $# > 1 )); then
  usage >&2
  exit 2
fi

for command_name in aws pnpm curl jq; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Missing required command: %s\n' "$command_name" >&2
    exit 1
  fi
done

cd "$ROOT_DIR"
if [[ ! -d node_modules ]]; then
  printf 'Dependencies are missing. Run: pnpm install --frozen-lockfile\n' >&2
  exit 1
fi

printf 'Checking AWS production targets...\n'
actual_account="$(aws sts get-caller-identity --query Account --output text)"
if [[ "$actual_account" != "$ACCOUNT_ID" ]]; then
  printf 'Wrong AWS account: %s (expected %s)\n' "$actual_account" "$ACCOUNT_ID" >&2
  exit 1
fi

actual_region="$(aws s3api get-bucket-location --bucket "$BUCKET" --query LocationConstraint --output text)"
if [[ "$actual_region" != "$AWS_REGION" ]]; then
  printf 'Wrong S3 bucket region: %s (expected %s)\n' "$actual_region" "$AWS_REGION" >&2
  exit 1
fi

actual_domain="$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query Distribution.DomainName --output text)"
if [[ "$actual_domain" != "$DISTRIBUTION_DOMAIN" ]]; then
  printf 'Wrong CloudFront domain: %s (expected %s)\n' "$actual_domain" "$DISTRIBUTION_DOMAIN" >&2
  exit 1
fi

actual_origins="$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DistributionConfig.Origins.Items[*].DomainName' --output text)"
if [[ "$actual_origins" != *"$BUCKET_ORIGIN"* ]]; then
  printf 'CloudFront origin does not include expected S3 bucket: %s\n' "$BUCKET_ORIGIN" >&2
  exit 1
fi

for distribution_id in "$DISTRIBUTION_ID" "$AD_DISTRIBUTION_ID"; do
  if [[ "$distribution_id" == "$DISTRIBUTION_ID" ]]; then
    expected_domain="$DISTRIBUTION_DOMAIN"
    expected_aliases="www.brothermaze.com"
  else
    expected_domain="$AD_DISTRIBUTION_DOMAIN"
    expected_aliases="adhaeyo.com,www.adhaeyo.com"
  fi
  distribution_domain="$(aws cloudfront get-distribution --id "$distribution_id" --query Distribution.DomainName --output text)"
  aliases="$(aws cloudfront get-distribution --id "$distribution_id" --query 'Distribution.DistributionConfig.Aliases.Items' --output json | jq -r 'sort | join(",")')"
  origins="$(aws cloudfront get-distribution --id "$distribution_id" --query 'Distribution.DistributionConfig.Origins.Items[*].DomainName' --output text)"
  if [[ "$distribution_domain" != "$expected_domain" || "$aliases" != "$expected_aliases" || "$origins" != "$BUCKET_ORIGIN" ]]; then
    printf 'Unexpected production target for %s. Check domain, alias and origin before deploying.\n' "$distribution_id" >&2
    exit 1
  fi
done

printf 'Building homepage for CloudFront root path...\n'
# FIGMA_PUBLIC_URL may be set by Figma Make. Explicit --base keeps AWS assets at /assets/.
pnpm exec vite build --base=/
node --test scripts/test-tracking.mjs
for file in index.html adhaeyo/index.html; do
  if [[ ! -s "${DIST_DIR}/${file}" ]]; then
    printf 'Build output is missing: %s\n' "$file" >&2
    exit 1
  fi
done

printf 'Uploading to s3://%s/ ...\n' "$BUCKET"
sync_options=(--exclude '*.html' --cache-control 'public, max-age=300')
copy_options=(--content-type 'text/html; charset=utf-8' --cache-control 'no-cache, max-age=0, must-revalidate')
if [[ "$dry_run" == true ]]; then
  sync_options+=(--dryrun)
  copy_options+=(--dryrun)
else
  sync_options+=(--only-show-errors)
  copy_options+=(--only-show-errors)
fi

# Keep previous hashed assets so clients with cached HTML can still load them.
aws s3 sync "${DIST_DIR}/" "s3://${BUCKET}/" "${sync_options[@]}"
aws s3 cp "${DIST_DIR}/index.html" "s3://${BUCKET}/index.html" "${copy_options[@]}"
aws s3 cp "${DIST_DIR}/adhaeyo/index.html" "s3://${BUCKET}/adhaeyo/index.html" "${copy_options[@]}"

if [[ "$dry_run" == true ]]; then
  printf 'Dry run complete. No S3 objects or CloudFront caches were changed.\n'
  exit 0
fi

printf 'Invalidating CloudFront cache...\n'
for distribution_id in "$DISTRIBUTION_ID" "$AD_DISTRIBUTION_ID"; do
  invalidation_id="$(aws cloudfront create-invalidation --distribution-id "$distribution_id" --paths '/*' --query Invalidation.Id --output text)"
  aws cloudfront wait invalidation-completed --distribution-id "$distribution_id" --id "$invalidation_id"
done

printf 'Checking public production pages...\n'
main_html="$(curl --fail --silent --show-error --location --max-time 30 "${MAIN_URL}/")"
ad_html="$(curl --fail --silent --show-error --location --max-time 30 "${AD_URL}/")"
if [[ "$main_html" != *'<title>보면소득'* || "$ad_html" != *'<title>광고해요'* ]]; then
  printf 'Production page title check failed. Inspect both URLs manually.\n' >&2
  exit 1
fi
if [[ "$main_html" != *"rel=\"canonical\" href=\"${MAIN_URL}/\""* || "$ad_html" != *"rel=\"canonical\" href=\"${AD_URL}/\""* ]]; then
  printf 'Production canonical URL check failed.\n' >&2
  exit 1
fi

printf 'Deployment verified:\n  %s/\n  %s/\n' "$MAIN_URL" "$AD_URL"
