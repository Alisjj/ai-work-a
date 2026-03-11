#!/bin/bash
set -e

BASE_URL="http://localhost:3000"
USER_ID="user-1"
WORKSPACE_ID="ws-final-test"

echo "=== 1. Seeding Mock Workspace ==="
curl -s -X POST "$BASE_URL/sample/candidates" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Final Test WS"}' | jq .

echo -e "\n=== 2. Creating a Candidate ==="
CANDIDATE_RES=$(curl -s -X POST "$BASE_URL/candidates" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"name":"John E2E","email":"john.e2e@example.com"}')
echo "$CANDIDATE_RES" | jq .
CANDIDATE_ID=$(echo "$CANDIDATE_RES" | jq -r .id)

echo -e "\n=== 3. Listing Candidates ==="
curl -s -X GET "$BASE_URL/candidates" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" | jq .

echo -e "\n=== 4. Getting Single Candidate ==="
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" | jq .

echo -e "\n=== 5. Uploading Document ==="
curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/documents" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" \
  -H "Content-Type: application/json" \
  -d '{"documentType":"resume","fileName":"john_resume.pdf","rawText":"Experienced Node.js and TypeScript backend engineer with AWS skills."}' | jq .

echo -e "\n=== 6. Triggering Summary Generation ==="
SUMMARY_RES=$(curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/summaries/generate" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID")
echo "$SUMMARY_RES" | jq .
SUMMARY_ID=$(echo "$SUMMARY_RES" | jq -r .id)

echo -e "\n=== Waiting for background worker to process (20s) ==="
sleep 20

echo -e "\n=== 7. Listing Summaries ==="
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/summaries" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" | jq .

echo -e "\n=== 8. Getting Single Summary ==="
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/summaries/$SUMMARY_ID" \
  -H "x-user-id: $USER_ID" -H "x-workspace-id: $WORKSPACE_ID" | jq .

echo -e "\n=== Tests Complete ==="
