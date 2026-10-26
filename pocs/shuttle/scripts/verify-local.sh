#!/usr/bin/env bash
set -euo pipefail
SHUTTLE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SHUTTLE_PYTHON="${PYTHON:-python3}"
SHUTTLE_DOTNET="${DOTNET:-dotnet}"
cd "$SHUTTLE_ROOT"
"$SHUTTLE_PYTHON" scripts/validate-contracts.py
"$SHUTTLE_PYTHON" scripts/verify-fixture-bindings.py
export DOTNET_CLI_TELEMETRY_OPTOUT=1 DOTNET_SKIP_FIRST_TIME_EXPERIENCE=1 DOTNET_NOLOGO=1
for project in tests/Shuttle.Guards.Tests/Shuttle.Guards.Tests.csproj tests/Shuttle.Dataverse.Tests/Shuttle.Dataverse.Tests.csproj; do
  "$SHUTTLE_DOTNET" restore "$project" --locked-mode
  "$SHUTTLE_DOTNET" run --project "$project" --configuration Release --no-restore
done
"$SHUTTLE_DOTNET" restore src/Shuttle.Dataverse/Shuttle.Dataverse.csproj --locked-mode
"$SHUTTLE_DOTNET" build src/Shuttle.Dataverse/Shuttle.Dataverse.csproj --configuration Release --no-restore
printf '%s\n' 'LOCAL FOUNDATION PASS; target installation, runtime identity, transactions, private packs and native integration NOT QUALIFIED'
