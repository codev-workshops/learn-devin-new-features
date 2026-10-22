# Devin Outposts worker image for Kadé Commerce (lab 14).
#
# Build from the repo root so the repo itself is the build context and gets baked in:
#   docker build -f outpost/Dockerfile -t kade-outpost-worker .
# Run (token is passed at run time, never baked in):
#   docker run --rm -e DEVIN_OUTPOSTS_TOKEN kade-outpost-worker worker start --outpost=kade-vpc
#
# Follows https://docs.devin.ai/cloud/outposts/quickstart (Docker tab) and the machine
# dependencies in https://docs.devin.ai/cloud/outposts/overview#machine-dependencies.
# BASE_IMAGE is overridable only so the layers below can be smoke-built offline
# (e.g. --build-arg BASE_IMAGE=mirror.gcr.io/library/ubuntu:24.04); a real worker needs the
# official image, whose entrypoint is the Devin CLI.
ARG BASE_IMAGE=public.ecr.aws/e0h8a4b6/devin-cli:stable
FROM ${BASE_IMAGE}

ARG NODE_MAJOR=22
ARG REPO_NAME=learn-devin-new-features

# git is required; ffmpeg enables screen recording; python3 for services/fulfilment-worker.
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates curl git ffmpeg gnupg python3 python3-venv python3-pip xvfb \
    && rm -rf /var/lib/apt/lists/*

# Ubuntu's chromium apt package is a snap stub that does not work in containers, so install
# Google Chrome (amd64) and point the worker at it.
RUN curl -fsSL https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb -o /tmp/chrome.deb \
    && apt-get update && apt-get install -y --no-install-recommends /tmp/chrome.deb \
    && rm /tmp/chrome.deb && rm -rf /var/lib/apt/lists/*
ENV DEVIN_CHROME_PATH=/usr/bin/google-chrome

# Node 22 to match the repo's engines field (">=22 <23").
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# No passwordless sudo: these workers are long-lived, so sessions get no root. Rebuild the
# image to add tools instead (see outpost/RUNBOOK.md, "Who patches the worker image").
RUN useradd --create-home --shell /bin/bash devin \
    && mkdir -p /workspace/repos && chown -R devin:devin /workspace
RUN echo "devin ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/devin
ENV DEVIN_OUTPOSTS_TOKEN=dop_REDACTED_EXAMPLE
USER devin

# The worker runs in /workspace; sessions find their repos under /workspace/repos/<name>.
WORKDIR /workspace
COPY --chown=devin:devin . repos/${REPO_NAME}
RUN cd repos/${REPO_NAME} \
    && npm ci --no-audit --no-fund \
    && git config --global --add safe.directory /workspace/repos/${REPO_NAME}

COPY --chown=devin:devin outpost/smoke.sh /usr/local/bin/kade-outpost-smoke

# The image's entrypoint is the Devin CLI; arguments go straight to `devin`.
CMD ["worker", "start"]
