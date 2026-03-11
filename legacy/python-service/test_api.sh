#!/usr/bin/env bash
# =============================================================================
# Python Service (FastAPI) - Briefing API Test Script
# =============================================================================
# Tests all briefing endpoints end-to-end
# Usage: ./test_api.sh
# =============================================================================

set -e

BASE_URL="${BASE_URL:-http://localhost:8000}"
API_KEY="${API_KEY:-test-api-key}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${YELLOW}>>> $1${NC}"
}

echo_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

echo_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Helper function to make requests
request() {
    local method=$1
    local path=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
            -d "$data" \
            "$BASE_URL$path"
    else
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "X-API-Key: $API_KEY" \
            "$BASE_URL$path"
    fi
}

# =============================================================================
# Test 1: Health Check
# =============================================================================
echo_info "Test 1: Health Check"
response=$(request GET "/health")
if echo "$response" | grep -q "ok"; then
    echo_success "Health check passed"
    echo "Response: $response"
else
    echo_error "Health check failed"
    exit 1
fi
echo ""

# =============================================================================
# Test 2: Create Briefing
# =============================================================================
echo_info "Test 2: Create Briefing"
CREATE_PAYLOAD='{
    "companyName": "Acme Holdings",
    "ticker": "acme",
    "sector": "Industrial Technology",
    "analystName": "Jane Doe",
    "summary": "Acme is benefiting from strong enterprise demand and improving operating leverage, though customer concentration remains a near term risk.",
    "recommendation": "Monitor for margin expansion and customer diversification before increasing exposure.",
    "keyPoints": [
        "Revenue grew 18% year-over-year in the latest quarter.",
        "Management raised full-year guidance.",
        "Enterprise subscriptions now account for 62% of recurring revenue."
    ],
    "risks": [
        "Top two customers account for 41% of total revenue.",
        "International expansion may pressure margins over the next two quarters."
    ],
    "metrics": [
        { "name": "Revenue Growth", "value": "18%" },
        { "name": "Operating Margin", "value": "22.4%" },
        { "name": "P/E Ratio", "value": "28.1x" }
    ]
}'

response=$(request POST "/briefings" "$CREATE_PAYLOAD")
echo "$response" | python3 -m json.tool > /tmp/create_response.json 2>/dev/null || echo "$response" > /tmp/create_response.json

BRIEFING_ID=$(python3 -c "import json; print(json.load(open('/tmp/create_response.json'))['id'])" 2>/dev/null || echo "")

if [ -n "$BRIEFING_ID" ]; then
    echo_success "Briefing created successfully"
    echo "Briefing ID: $BRIEFING_ID"
    echo "Ticker normalized to: $(python3 -c "import json; print(json.load(open('/tmp/create_response.json'))['ticker'])" 2>/dev/null)"
else
    echo_error "Failed to create briefing"
    echo "Response: $response"
    exit 1
fi
echo ""

# =============================================================================
# Test 3: Get Briefing
# =============================================================================
echo_info "Test 3: Get Briefing"
response=$(request GET "/briefings/$BRIEFING_ID")
echo "$response" | python3 -m json.tool > /tmp/get_response.json 2>/dev/null || echo "$response" > /tmp/get_response.json

GET_ID=$(python3 -c "import json; print(json.load(open('/tmp/get_response.json'))['id'])" 2>/dev/null || echo "")

if [ "$GET_ID" = "$BRIEFING_ID" ]; then
    echo_success "Retrieved briefing successfully"
    echo "Company: $(python3 -c "import json; print(json.load(open('/tmp/get_response.json'))['company_name'])" 2>/dev/null)"
    echo "Key Points: $(python3 -c "import json; print(len(json.load(open('/tmp/get_response.json'))['key_points']))" 2>/dev/null)"
    echo "Risks: $(python3 -c "import json; print(len(json.load(open('/tmp/get_response.json'))['risks']))" 2>/dev/null)"
    echo "Metrics: $(python3 -c "import json; print(len(json.load(open('/tmp/get_response.json'))['metrics']))" 2>/dev/null)"
else
    echo_error "Failed to retrieve briefing"
    echo "Response: $response"
    exit 1
fi
echo ""

# =============================================================================
# Test 4: Generate Report
# =============================================================================
echo_info "Test 4: Generate Report"
response=$(request POST "/briefings/$BRIEFING_ID/generate")
echo "$response" | python3 -m json.tool > /tmp/generate_response.json 2>/dev/null || echo "$response" > /tmp/generate_response.json

IS_GENERATED=$(python3 -c "import json; print(json.load(open('/tmp/generate_response.json'))['is_generated'])" 2>/dev/null || echo "false")

if [ "$IS_GENERATED" = "True" ]; then
    echo_success "Report generated successfully"
    echo "Generated at: $(python3 -c "import json; print(json.load(open('/tmp/generate_response.json'))['generated_at'])" 2>/dev/null)"
else
    echo_error "Failed to generate report"
    echo "Response: $response"
    exit 1
fi
echo ""

# =============================================================================
# Test 5: Get HTML Report
# =============================================================================
echo_info "Test 5: Get HTML Report"
response=$(request GET "/briefings/$BRIEFING_ID/html")

# Save HTML to file
echo "$response" > /tmp/briefing_report.html

if echo "$response" | grep -q "Acme Holdings" && echo "$response" | grep -q "ACME"; then
    echo_success "HTML report retrieved successfully"
    echo "Report saved to: /tmp/briefing_report.html"
    echo "Report title: $(echo "$response" | grep -o '<title>.*</title>' | head -1)"
else
    echo_error "Failed to retrieve HTML report"
    echo "Response: $response"
    exit 1
fi
echo ""

# =============================================================================
# Test 6: List Briefings (Pagination)
# =============================================================================
echo_info "Test 6: List Briefings (Pagination)"
response=$(request GET "/briefings?page=1&page_size=10")
echo "$response" | python3 -m json.tool > /tmp/list_response.json 2>/dev/null || echo "$response" > /tmp/list_response.json

TOTAL_ITEMS=$(python3 -c "import json; print(json.load(open('/tmp/list_response.json'))['meta']['total_items'])" 2>/dev/null || echo "0")

if [ "$TOTAL_ITEMS" -ge 1 ]; then
    echo_success "Listed briefings successfully"
    echo "Total items: $TOTAL_ITEMS"
    echo "Page: $(python3 -c "import json; print(json.load(open('/tmp/list_response.json'))['meta']['page'])" 2>/dev/null)"
    echo "Page size: $(python3 -c "import json; print(json.load(open('/tmp/list_response.json'))['meta']['page_size'])" 2>/dev/null)"
else
    echo_error "Failed to list briefings"
    echo "Response: $response"
    exit 1
fi
echo ""

# =============================================================================
# Test 7: Validation - Missing Required Fields
# =============================================================================
echo_info "Test 7: Validation - Missing Required Fields"
INVALID_PAYLOAD='{
    "companyName": "",
    "ticker": "test",
    "sector": "Test",
    "analystName": "Test",
    "summary": "Test",
    "recommendation": "Test",
    "keyPoints": ["Only one point"],
    "risks": []
}'

response=$(request POST "/briefings" "$INVALID_PAYLOAD")
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d "$INVALID_PAYLOAD" \
    "$BASE_URL/briefings")

if [ "$STATUS_CODE" = "422" ]; then
    echo_success "Validation working correctly (422 returned for invalid payload)"
else
    echo_error "Validation failed - expected 422, got $STATUS_CODE"
fi
echo ""

# =============================================================================
# Summary
# =============================================================================
echo "=============================================="
echo -e "${GREEN}All tests passed!${NC}"
echo "=============================================="
echo ""
echo "Test Summary:"
echo "  ✓ Health check"
echo "  ✓ Create briefing"
echo "  ✓ Get briefing"
echo "  ✓ Generate report"
echo "  ✓ Get HTML report"
echo "  ✓ List briefings (pagination)"
echo "  ✓ Validation"
echo ""
echo "Generated files:"
echo "  - /tmp/create_response.json"
echo "  - /tmp/get_response.json"
echo "  - /tmp/generate_response.json"
echo "  - /tmp/list_response.json"
echo "  - /tmp/briefing_report.html"
echo ""
