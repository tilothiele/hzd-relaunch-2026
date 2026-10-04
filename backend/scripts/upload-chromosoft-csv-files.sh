#!/usr/bin/env bash
set -euo pipefail

if [[ -f .env ]]; then
	set -a
	# shellcheck disable=SC1091
	source .env
	set +a
fi

API_URL="${API_URL:-http://localhost:1337}"
API_TOKEN="${API_TOKEN:?API_TOKEN setzen}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOGS_CSV="${DOGS_CSV:-${SCRIPT_DIR}/dogs.csv}"
MEMBERS_CSV="${MEMBERS_CSV:-${SCRIPT_DIR}/members.csv}"

upload() {
	local path="$1"
	local field="$2"
	local file="$3"

	echo "Lade ${file} nach ${API_URL}${path}"
	curl --fail-with-body --show-error --silent \
		--request POST \
		--header "Authorization: Bearer ${API_TOKEN}" \
		--form "${field}=@${file};type=text/csv" \
		"${API_URL}${path}"
	echo
}

upload "/api/upload-cs-dogs" "dogs.csv" "${DOGS_CSV}"
upload "/api/upload-cs-member" "members.csv" "${MEMBERS_CSV}"