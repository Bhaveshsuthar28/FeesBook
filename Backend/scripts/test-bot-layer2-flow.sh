#!/bin/bash

# WARNING: Make sure test credentials (activation command: testlogin123, password: TestPass@123)
# are configured and active in the database (or created via the Settings UI) for a schoolId
# before running this flow. Also ensure WHATSAPP_DRY_RUN=true in your .env and the server is running.

# Phone number to test with (919000000010 is used here to avoid collisions)
TEST_PHONE="919000000010"

echo "================================================================="
echo "Starting WhatsApp Bot Layer 2 Simulated Webhook E2E Flow Test"
echo "Target Phone: $TEST_PHONE"
echo "================================================================="
echo

echo "=== Step 1: Sending activation command ==="
./scripts/test-bot-layer2.sh "$TEST_PHONE" "testlogin123"
sleep 1

echo "=== Step 2: Sending password ==="
./scripts/test-bot-layer2.sh "$TEST_PHONE" "TestPass@123"
sleep 1

echo "=== Step 3: Sending an authenticated command ==="
./scripts/test-bot-layer2.sh "$TEST_PHONE" "help"
sleep 1

echo "=== Step 4: Logout ==="
./scripts/test-bot-layer2.sh "$TEST_PHONE" "logout"

echo
echo "================================================================="
echo "Flow complete. Check your Fastify server console to verify that"
echo "the [DRY RUN] log outputs matched expected bot replies."
echo "================================================================="
