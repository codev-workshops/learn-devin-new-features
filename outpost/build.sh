#!/usr/bin/env bash
# Build the Kadé outpost worker image from the committed HEAD.
#   outpost/build.sh                                   # official devin-cli base
#   outpost/build.sh --build-arg BASE_IMAGE=mirror.gcr.io/library/ubuntu:24.04 -t kade-outpost-worker:smoke
# Extra arguments are passed to `docker build`.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
git bundle create outpost/repo.bundle HEAD
sha=$(git rev-parse --short HEAD)
exec docker build -f outpost/Dockerfile -t "kade-outpost-worker:${sha}" -t kade-outpost-worker "$@" .
