# S04 — proposed architecture extract

Synthetic design source, frozen 25 October 2026. This summary of the public design sketch describes an implementation proposal, not a running or bank-approved system.

Codex assists development; Microsoft hosts the intended deployed runtime. Native Cowork Business apps/Work IQ preview submits Create-only proposals to Dataverse. Synchronous guards validate actual caller access, current revision, request identity and allowed fields. A PackDraft commits a proposal, business event and render job; an InspectionComment commits a proposal and event, with no render job or approval effect.

The renderer must automatically create a protected actual file and register its exact version/hash. Dataverse row access does not automatically protect SharePoint files. Native confirmation is not bank approval. Protected approvals and readiness gates require separate server validation and accepted authority policy.

Target-tenant tests, source boundaries, ordinary-user isolation, billing, renderer policy compatibility and bank admission are NOT RUN or NOT PROVEN. A local source file, typed actor or successful mock does not close them. Preview/provider/geography/private-network requirements remain bank-owner decisions.

Origin: the public design sketch, revised 25 October 2026. This fixture's wording is a declared summary; it is not a verbatim export or runtime provenance proof.
