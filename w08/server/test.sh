#!/usr/bin/env bash
# Quick integration test script for EventHub API
# Requires: server running at http://localhost:3000, curl

BASE="http://localhost:3000/api"
set -o pipefail

http() {
  # http METHOD URL DATA TOKEN -> sets global status and content
  local METHOD="$1"; shift
  local URL="$1"; shift
  local DATA="$1"; shift || true
  local TOKEN="$1"; shift || true

  if [ -n "$DATA" ]; then
    if [ -n "$TOKEN" ]; then
      RESP=$(curl -s -X "$METHOD" -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d "$DATA" "$URL" -w "\n%{http_code}")
    else
      RESP=$(curl -s -X "$METHOD" -H "Content-Type: application/json" -d "$DATA" "$URL" -w "\n%{http_code}")
    fi
  else
    if [ -n "$TOKEN" ]; then
      RESP=$(curl -s -X "$METHOD" -H "Authorization: Bearer $TOKEN" "$URL" -w "\n%{http_code}")
    else
      RESP=$(curl -s -X "$METHOD" "$URL" -w "\n%{http_code}")
    fi
  fi
  status=$(echo "$RESP" | tail -n1)
  content=$(echo "$RESP" | sed '$d')
}

fail() { echo "[FAIL] $1"; exit 1; }
ok() { echo "[OK] $1"; }

echo "Using base URL: $BASE"

now_iso() { date -u -d "+$1" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+${1}H +"%Y-%m-%dT%H:%M:%SZ"; }

# 1) Register a new user
UNIQUE_EMAIL="test+$(date +%s)@example.com"
REG_PAY=$(printf '{"email":"%s","password":"pass1234","full_name":"Test User"}' "$UNIQUE_EMAIL")
http POST "$BASE/auth/register" "$REG_PAY"
if [ "$status" != "201" ]; then
  echo "$content"; fail "register expected 201 got $status";
fi
user_id=$(echo "$content" | sed -n 's/.*"user_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "register -> $user_id"
sleep 5

# 2) Login
LOGIN_PAY=$(printf '{"email":"%s","password":"pass1234"}' "$UNIQUE_EMAIL")
http POST "$BASE/auth/login" "$LOGIN_PAY"
if [ "$status" != "200" ]; then echo "$content"; fail "login expected 200 got $status"; fi
token=$(echo "$content" | sed -n 's/.*"token"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
if [ -z "$token" ]; then fail "no token returned"; fi
ok "login -> token acquired"
sleep 5

# 3) Create event (authenticated)
START=$(now_iso "24 hours")
END=$(now_iso "26 hours")
EVENT_PAY=$(cat <<EOF
{"title":"Test Event","location":"Testville","start_time":"$START","end_time":"$END","visibility":true}
EOF
)
http POST "$BASE/events" "$EVENT_PAY" "$token"
if [ "$status" != "201" ]; then echo "$content"; fail "create event expected 201 got $status"; fi
event_id=$(echo "$content" | sed -n 's/.*"event_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "create event -> $event_id"
sleep 5

# 4) Create ticket type
TT_PAY=$(printf '{"name":"VIP","price":100.00,"quantity":5}')
http POST "$BASE/events/$event_id/ticket-types" "$TT_PAY" "$token"
if [ "$status" != "201" ]; then echo "$content"; fail "create ticket type expected 201 got $status"; fi
ticket_type_id=$(echo "$content" | sed -n 's/.*"ticket_type_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "create ticket type -> $ticket_type_id"
sleep 5

# 5) Create reservation (authenticated user)
RES_PAY=$(printf '{"ticket_type_id":"%s","seat":"A1"}' "$ticket_type_id")
http POST "$BASE/events/$event_id/reservations" "$RES_PAY" "$token"
if [ "$status" != "201" ]; then echo "$content"; fail "create reservation expected 201 got $status"; fi
reservation_id=$(echo "$content" | sed -n 's/.*"reservation_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "create reservation -> $reservation_id"
sleep 5

# 6) Initiate payment
PAY_PAY=$(printf '{"amount":100.00,"method":"card","gateway_data":{}}')
http POST "$BASE/reservations/$reservation_id/payments" "$PAY_PAY" "$token"
if [ "$status" != "201" ]; then echo "$content"; fail "initiate payment expected 201 got $status"; fi
payment_id=$(echo "$content" | sed -n 's/.*"payment_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "initiate payment -> $payment_id"
sleep 5

# 7) Capture payment
CAP_PAY='{"action":"capture"}'
http POST "$BASE/payments/$payment_id" "$CAP_PAY" "$token"
if [ "$status" != "200" ]; then echo "$content"; fail "capture payment expected 200 got $status"; fi
ok "capture payment"
sleep 5

# 8) Issue ticket
http POST "$BASE/reservations/$reservation_id/tickets" "" "$token"
if [ "$status" != "201" ]; then echo "$content"; fail "issue ticket expected 201 got $status"; fi
ticket_id=$(echo "$content" | sed -n 's/.*"ticket_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "issue ticket -> $ticket_id"
sleep 5

# 9) Get sales for event
http GET "$BASE/events/$event_id/sales" "" "$token"
if [ "$status" != "200" ]; then echo "$content"; fail "get sales expected 200 got $status"; fi
sold=$(echo "$content" | sed -n 's/.*"total_tickets_sold"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p')
ok "sales report (sold=$sold)"
sleep 5

# 10) Create refund
REF_PAY=$(printf '{"reservation_id":"%s","amount":100.00,"reason":"test refund"}' "$reservation_id")
http POST "$BASE/payments/$payment_id/refunds" "$REF_PAY" "$token"
if [ "$status" != "201" ]; then echo "$content"; fail "create refund expected 201 got $status"; fi
refund_id=$(echo "$content" | sed -n 's/.*"refund_id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')
ok "create refund -> $refund_id"
sleep 5

# 11) Get refund
http GET "$BASE/refunds/$refund_id" "" "$token"
if [ "$status" != "200" ]; then echo "$content"; fail "get refund expected 200 got $status"; fi
ok "get refund"
sleep 5

# 12) List user tickets
http GET "$BASE/users/$user_id/tickets" "" "$token"
if [ "$status" != "200" ]; then echo "$content"; fail "list user tickets expected 200 got $status"; fi
ok "list user tickets"
sleep 5

# 13) Protected endpoint without token should be 401
http POST "$BASE/events" "$EVENT_PAY"
if [ "$status" = "401" ] || [ "$status" = "400" ]; then
  ok "protected endpoint rejects unauthenticated request (status=$status)"
  sleep 5
else
  echo "$status"; echo "$content"; fail "expected 401 for unauthenticated request"
fi

echo "All tests passed."
exit 0
