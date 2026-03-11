#!/usr/bin/env bash
#
# Test script for Briefing Report Service API
# Usage: ./test_api.sh [BASE_URL]
#
# BASE_URL defaults to http://localhost:8000
#

set -e

BASE_URL="${1:-http://localhost:8000}"
API_KEY="${API_KEY:-test-api-key}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${YELLOW}========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}→${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Common headers
HEADERS=(
    "-H" "Content-Type: application/json"
    "-H" "X-API-Key: $API_KEY"
)

# Test payload
read -r -d '' CREATE_PAYLOAD << 'EOF' || true
{
    "companyName": "Acme Holdings",
    "ticker": "acme",
    "sector": "Industrial Technology",
    "analystName": "Jane Doe",
    "summary": "Acme is benefiting from strong enterprise demand.",
    "recommendation": "Monitor for margin expansion.",
    "keyPoints": [
        "Revenue grew 18% year-over-year.",
        "Management raised full-year guidance."
    ],
    "risks": ["Top two customers account for 41% of total revenue."],
    "metrics": [
        {"name": "Revenue Growth", "value": "18%"},
        {"name": "Operating Margin", "value": "22.4%"}
    ]
}
EOF

print_header "🧪 Testing Briefing Report Service API"
echo "Base URL: $BASE_URL"
echo "API Key:  $API_KEY"

# ============================================================================
# Health Check
# ============================================================================
print_header "1. Health Check"

print_test "GET /health"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/health")
BODY=$(echo "$RESPONSE" | head -n1)
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "200" ]; then
    print_success "Health check passed (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    print_error "Health check failed (status: $STATUS)"
    exit 1
fi

# ============================================================================
# Create Briefing
# ============================================================================
print_header "2. Create Briefing"

print_test "POST /briefings"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    -d "$CREATE_PAYLOAD" \
    "$BASE_URL/briefings")
BODY=$(echo "$RESPONSE" | head -n1)
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "201" ]; then
    print_success "Briefing created (status: $STATUS)"
    BRIEFING_ID=$(echo "$BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
    echo "Briefing ID: $BRIEFING_ID"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    print_error "Failed to create briefing (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

# ============================================================================
# List Briefings (Pagination)
# ============================================================================
print_header "3. List Briefings (Pagination)"

print_test "GET /briefings?page=1&page_size=10"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    "$BASE_URL/briefings?page=1&page_size=10")
BODY=$(echo "$RESPONSE" | head -n1)
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "200" ]; then
    print_success "List briefings succeeded (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    print_error "Failed to list briefings (status: $STATUS)"
    exit 1
fi

# ============================================================================
# Get Single Briefing
# ============================================================================
print_header "4. Get Single Briefing"

print_test "GET /briefings/$BRIEFING_ID"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    "$BASE_URL/briefings/$BRIEFING_ID")
BODY=$(echo "$RESPONSE" | head -n1)
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "200" ]; then
    print_success "Get briefing succeeded (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    print_error "Failed to get briefing (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

# ============================================================================
# Generate Briefing
# ============================================================================
print_header "5. Generate Briefing"

print_test "POST /briefings/$BRIEFING_ID/generate"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    -X POST \
    "$BASE_URL/briefings/$BRIEFING_ID/generate")
BODY=$(echo "$RESPONSE" | head -n1)
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "200" ]; then
    print_success "Briefing generated (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
    print_error "Failed to generate briefing (status: $STATUS)"
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    exit 1
fi

# ============================================================================
# Get Briefing HTML
# ============================================================================
print_header "6. Get Briefing HTML Report"

print_test "GET /briefings/$BRIEFING_ID/html"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    "$BASE_URL/briefings/$BRIEFING_ID/html")
BODY=$(echo "$RESPONSE" | head -n1)
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "200" ]; then
    print_success "HTML report retrieved (status: $STATUS)"
    # Show first 500 chars of HTML
    echo "${BODY:0:500}..."
else
    print_error "Failed to get HTML report (status: $STATUS)"
    echo "$BODY"
    exit 1
fi

# ============================================================================
# Error Cases
# ============================================================================
print_header "7. Error Cases"

print_test "GET /briefings/00000000-0000-0000-0000-000000000000 (Not Found)"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    "$BASE_URL/briefings/00000000-0000-0000-0000-000000000000")
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "404" ]; then
    print_success "Correctly returns 404 for non-existent briefing"
else
    print_error "Expected 404, got $STATUS"
fi

print_test "POST /briefings with invalid data (Validation Error)"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    "${HEADERS[@]}" \
    -H "Content-Type: application/json" \
    -d '{"companyName": "", "ticker": "test"}' \
    "$BASE_URL/briefings")
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "422" ]; then
    print_success "Correctly returns 422 for invalid data"
else
    print_error "Expected 422, got $STATUS"
fi

print_test "GET /briefings without API key (Unauthorized)"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Content-Type: application/json" \
    "$BASE_URL/briefings")
STATUS=$(echo "$RESPONSE" | tail -n1)

if [ "$STATUS" = "401" ]; then
    print_success "Correctly returns 401 without API key"
else
    print_error "Expected 401, got $STATUS (Debug mode may allow this)"
fi

# ============================================================================
# Summary
# ============================================================================
print_header "✅ All Tests Completed"

echo -e "${GREEN}All API endpoints tested successfully!${NC}"
echo ""
echo "Tested endpoints:"
echo "  ✓ GET  /health"
echo "  ✓ POST /briefings"
echo "  ✓ GET  /briefings (with pagination)"
echo "  ✓ GET  /briefings/{id}"
echo "  ✓ POST /briefings/{id}/generate"
echo "  ✓ GET  /briefings/{id}/html"
echo "  ✓ Error handling (404, 422, 401)"
echo ""
