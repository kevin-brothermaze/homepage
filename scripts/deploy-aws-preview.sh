#!/usr/bin/env bash
set -euo pipefail

# The former preview bucket is now the production origin for both homepages.
printf 'AWS preview is now connected to the production domains.\n' >&2
printf 'For production deployment, use: pnpm deploy:aws:production [--dry-run]\n' >&2
exit 2
