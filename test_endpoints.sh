#!/bin/bash

TOKEN=$1
BASE_URL="http://localhost:3000/api/admin"

echo "Testing GET /dashboard-stats..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/dashboard-stats" | python3 -m json.tool

echo "\nTesting GET /appointments..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/appointments" | python3 -m json.tool

echo "\nTesting PATCH /appointments/1..."
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"status": "Completed", "mechanic_notes": "Done and dusted"}' "$BASE_URL/appointments/1" | python3 -m json.tool

echo "\nTesting GET /customers..."
curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/customers" | python3 -m json.tool
