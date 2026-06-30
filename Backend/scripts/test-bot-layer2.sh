#!/bin/bash

# WARNING: Set WHATSAPP_DRY_RUN=true in .env before running this script

PHONE=$1
MESSAGE_TEXT=$2
TIMESTAMP=$(date +%s)

if [ -z "$PHONE" ] || [ -z "$MESSAGE_TEXT" ]; then
  echo "Usage: $0 <PHONE> <MESSAGE_TEXT>"
  exit 1
fi

# Load PORT from .env if it exists, otherwise default to 5000
PORT=5000
if [ -f .env ]; then
  ENV_PORT=$(grep -E "^PORT=" .env | cut -d'=' -f2)
  if [ ! -z "$ENV_PORT" ]; then
    PORT=$ENV_PORT
  fi
fi

echo "Sending payload for $PHONE to webhook on port $PORT: \"$MESSAGE_TEXT\""
curl -X POST "http://localhost:$PORT/api/whatsapp/webhook/whatsapp" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "TEST_WABA_ID",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "910000000000",
            "phone_number_id": "TEST_PHONE_ID"
          },
          "contacts": [{ "profile": { "name": "Test User" }, "wa_id": "'"$PHONE"'" }],
          "messages": [{
            "from": "'"$PHONE"'",
            "id": "wamid.test'"$TIMESTAMP"'",
            "timestamp": "'"$TIMESTAMP"'",
            "text": { "body": "'"$MESSAGE_TEXT"'" },
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'

echo -e "\n"
