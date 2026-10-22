FROM node:20-bookworm
RUN apt-get update \
 && apt-get install -y --no-install-recommends git python3 python3-pip python3-venv chromium ca-certificates curl \
 && rm -rf /var/lib/apt/lists/*
# Install the Devin CLI here, following https://docs.devin.ai/cloud/outposts/quickstart (lab 14 covers this step).
RUN useradd --create-home devin
USER devin
WORKDIR /home/devin
CMD ["sh", "-c", "devin worker start --outpost=\"$OUTPOST_NAME\" --token=\"$OUTPOST_TOKEN\""]
