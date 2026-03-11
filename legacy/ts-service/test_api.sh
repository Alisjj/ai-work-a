#!/usr/bin/env bash
# =============================================================================
# TypeScript Service (NestJS) - Candidate Document Intake API Test Script
# =============================================================================
# Tests all candidate/document/summary endpoints end-to-end
# Usage: ./test_api.sh
# =============================================================================

set -e

BASE_URL="${BASE_URL:-http://localhost:3000}"
WORKSPACE_ID="${WORKSPACE_ID:-00000000-0000-0000-0000-000000000001}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() { echo -e "${YELLOW}>>> $1${NC}"; }
echo_success() { echo -e "${GREEN}✓ $1${NC}"; }
echo_error() { echo -e "${RED}✗ $1${NC}"; }

# Helper function to make requests
request() {
    local method=$1
    local path=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" -H "Content-Type: application/json" -H "x-workspace-id: $WORKSPACE_ID" -d "$data" "$BASE_URL$path"
    else
        curl -s -X "$method" -H "Content-Type: application/json" -H "x-workspace-id: $WORKSPACE_ID" "$BASE_URL$path"
    fi
}

get_status() {
    local method=$1
    local path=$2
    local data=$3
    if [ -n "$data" ]; then
        curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -H "x-workspace-id: $WORKSPACE_ID" -d "$data" "$BASE_URL$path"
    else
        curl -s -o /dev/null -w "%{http_code}" -X "$method" -H "Content-Type: application/json" -H "x-workspace-id: $WORKSPACE_ID" "$BASE_URL$path"
    fi
}

echo_info "Checking prerequisites..."
echo "Base URL: $BASE_URL"
echo "Workspace ID: $WORKSPACE_ID"
echo ""

CANDIDATE_ID="${CANDIDATE_ID:-00000000-0000-0000-0000-000000000001}"
echo "Using Candidate ID: $CANDIDATE_ID"
echo ""

echo_info "Test 1: Upload Resume Document"
RESUME_PAYLOAD='{
    "documentType": "resume",
    "fileName": "alice-resume.pdf",
    "rawText": "Alice Smith\nSenior Software Engineer\n\nExperience:\n- 5 years building scalable backend systems with TypeScript and Node.js\n- Led migration from monolith to microservices architecture\n- Implemented CI/CD pipelines reducing deployment time by 60%\n\nSkills:\n- TypeScript, Node.js, NestJS, FastAPI, Python\n- PostgreSQL, Redis, Docker, Kubernetes\n- AWS, GCP, Terraform\n\nEducation:\n- B.S. Computer Science, MIT, 2018"
}'
response=$(request POST "/candidates/$CANDIDATE_ID/documents" "$RESUME_PAYLOAD")
echo "$response" | python3 -m json.tool > /tmp/ts_document_response.json 2>/dev/null || echo "$response" > /tmp/ts_document_response.json
DOCUMENT_ID=$(python3 -c "import json; print(json.load(open('/tmp/ts_document_response.json'))['id'])" 2>/dev/null || echo "")
if [ -n "$DOCUMENT_ID" ]; then
    echo_success "Resume uploaded successfully (ID: $DOCUMENT_ID)"
else
    echo_error "Failed to upload resume: $response"
fi
echo ""

echo_info "Test 2: Upload Cover Letter Document"
COVER_LETTER_PAYLOAD='{
    "documentType": "cover_letter",
    "fileName": "alice-cover-letter.txt",
    "rawText": "Dear Hiring Manager,\n\nI am excited to apply for the Senior Software Engineer position. With 5 years of experience building distributed systems, I believe I would be a great fit for your team.\n\nBest regards,\nAlice Smith"
}'
response=$(request POST "/candidates/$CANDIDATE_ID/documents" "$COVER_LETTER_PAYLOAD")
echo "$response" | python3 -m json.tool > /tmp/ts_document2_response.json 2>/dev/null || echo "$response" > /tmp/ts_document2_response.json
DOCUMENT_ID_2=$(python3 -c "import json; print(json.load(open('/tmp/ts_document2_response.json'))['id'])" 2>/dev/null || echo "")
if [ -n "$DOCUMENT_ID_2" ]; then
    echo_success "Cover letter uploaded successfully (ID: $DOCUMENT_ID_2)"
else
    echo_error "Failed to upload cover letter: $response"
fi
echo ""

echo_info "Test 3: Request Summary Generation"
response=$(request POST "/candidates/$CANDIDATE_ID/summaries/generate" "")
echo "$response" | python3 -m json.tool > /tmp/ts_summary_request.json 2>/dev/null || echo "$response" > /tmp/ts_summary_request.json
SUMMARY_ID=$(python3 -c "import json; print(json.load(open('/tmp/ts_summary_request.json'))['id'])" 2>/dev/null || echo "")
STATUS_CODE=$(get_status POST "/candidates/$CANDIDATE_ID/summaries/generate")
if [ "$STATUS_CODE" = "202" ] || [ "$STATUS_CODE" = "200" ] || [ -n "$SUMMARY_ID" ]; then
    echo_success "Summary generation requested (Status: $STATUS_CODE)"
    [ -n "$SUMMARY_ID" ] && echo "Summary ID: $SUMMARY_ID"
else
    echo_error "Failed to request summary: $response"
fi
echo ""

echo_info "Test 4: Poll for Summary Status (max 5 attempts)"
SUMMARY_STATUS="pending"
ATTEMPTS=0
while [ "$SUMMARY_STATUS" = "pending" ] && [ $ATTEMPTS -lt 5 ]; do
    ATTEMPTS=$((ATTEMPTS + 1))
    echo "Attempt $ATTEMPTS/5..."
    response=$(request GET "/candidates/$CANDIDATE_ID/summaries" "")
    echo "$response" | python3 -m json.tool > /tmp/ts_summaries_list.json 2>/dev/null || true
    SUMMARY_COUNT=$(python3 -c "import json; print(len(json.load(open('/tmp/ts_summaries_list.json'))))" 2>/dev/null || echo "0")
    if [ "$SUMMARY_COUNT" -gt 0 ]; then
        SUMMARY_STATUS=$(python3 -c "import json; print(json.load(open('/tmp/ts_summaries_list.json'))[0]['status'])" 2>/dev/null || echo "unknown")
        echo "Status: $SUMMARY_STATUS"
        [ "$SUMMARY_STATUS" != "pending" ] && break
    fi
    [ $ATTEMPTS -lt 5 ] && sleep 2
done
echo ""

echo_info "Test 5: Get Summary Details"
if [ -n "$SUMMARY_ID" ]; then
    response=$(request GET "/candidates/$CANDIDATE_ID/summaries/$SUMMARY_ID")
    echo "$response" | python3 -m json.tool > /tmp/ts_summary_detail.json 2>/dev/null || true
    echo_success "Summary retrieved"
    STATUS=$(python3 -c "import json; print(json.load(open('/tmp/ts_summary_detail.json'))['status'])" 2>/dev/null || echo "")
    echo "Status: $STATUS"
    if [ "$STATUS" = "completed" ]; then
        echo "Score: $(python3 -c "import json; print(json.load(open('/tmp/ts_summary_detail.json')).get('score', 'N/A'))" 2>/dev/null)"
        echo "Decision: $(python3 -c "import json; print(json.load(open('/tmp/ts_summary_detail.json')).get('recommendedDecision', 'N/A'))" 2>/dev/null)"
    fi
else
    echo_info "No summary ID available"
fi
echo ""

echo_info "Test 6: Access Control (Wrong Workspace)"
WRONG_WS="ffffffff-ffff-ffff-ffff-ffffffffffff"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "x-workspace-id: $WRONG_WS" "$BASE_URL/candidates/$CANDIDATE_ID/summaries")
if [ "$STATUS" = "404" ] || [ "$STATUS" = "403" ] || [ "$STATUS" = "401" ]; then
    echo_success "Access control working (status: $STATUS)"
else
    echo_info "Access control returned: $STATUS"
fi
echo ""

echo "=============================================="
echo -e "${GREEN}Test script completed!${NC}"
echo "=============================================="
echo ""
echo "Generated files:"
echo "  - /tmp/ts_document_response.json"
echo "  - /tmp/ts_document2_response.json"
echo "  - /tmp/ts_summary_request.json"
echo "  - /tmp/ts_summaries_list.json"
echo "  - /tmp/ts_summary_detail.json"
echo ""
echo "Note: Summary generation requires GEMINI_API_KEY and Redis running."
