# Technical Specifications

## Table of Contents
1. [FAPI 2.0 Security Profile](#fapi-20-security-profile)
2. [mTLS Requirements](#mtls-requirements)
3. [API Standards](#api-standards)
4. [Consent Management](#consent-management)
5. [UAE Pass Integration](#uae-pass-integration)
6. [Production Deployment](#production-deployment)

---

## FAPI 2.0 Security Profile

Financial-grade API (FAPI) 2.0 is mandatory for all Al Tareq integrations.

### Core Requirements
- **mTLS Authentication**: Mutual TLS with CBUAE-issued certificates
- **JWT Security**: Signed and encrypted request/response objects
- **PKCE**: Proof Key for Code Exchange for additional security
- **Request Object**: All authorization parameters must be signed

### Token Specifications
```
Access Token: JWT format, signed
Refresh Token: Opaque, securely stored
ID Token: JWT with user claims
Token Lifetime: Configurable per use case
```

### Security Endpoints
```
Authorization: /oauth2/authorize
Token: /oauth2/token
Introspection: /oauth2/introspect
Revocation: /oauth2/revoke
JWKS: /.well-known/jwks.json
```

---

## mTLS Requirements

### Certificate Chain
1. **Root CA**: CBUAE Root Certificate Authority
2. **Intermediate CA**: Al Tareq Issuing CA
3. **End Entity**: Participant-specific certificate

### Certificate Types
| Type | Issued To | Purpose |
|------|-----------|---------|
| Transport | LFIs and TPPs | mTLS authentication |
| Signing | LFIs and TPPs | Request/response signing |
| Encryption | LFIs and TPPs | Payload encryption |

### Implementation Requirements
```yaml
# Production mTLS Configuration
tls:
  client_cert: /etc/ssl/certs/participant.pem
  client_key: /etc/ssl/private/participant.key
  ca_bundle: /etc/ssl/certs/cbuae-chain.pem
  verify_mode: CERT_REQUIRED
  min_version: TLSv1.2
```

### Certificate Renewal
- Validity period: Typically 1-2 years
- Renewal process: Via CBUAE certificate portal
- Grace period: Plan renewal 30 days before expiry

---

## API Standards

### Documentation Source
- Standards: https://openfinanceuae.atlassian.net/wiki/spaces/standardsv2dot0final/overview
- See `api-specifications.md` for complete API reference

### Response Formats
- Content-Type: application/json
- Character encoding: UTF-8
- Date format: ISO 8601
- Currency: ISO 4217 codes
- Financial messaging: ISO 20022 elements

### Rate Limiting
| Endpoint Type | Rate Limit |
|---------------|------------|
| Account Information | 500 req/min |
| Payment Initiation | 100 req/min |
| Bulk Operations | 50 req/min |

---

## Consent Management

### Consent Flow
```
1. Customer in TPP app → "Connect Bank Account"
2. TPP redirects to Al Tareq consent platform
3. Al Tareq displays consent page:
   - TPP identity (verified)
   - Requested permissions
   - Data access duration
   - Bank selection
4. Customer authenticates via UAE Pass or bank credentials
5. Customer approves/denies consent
6. Redirect back to TPP with authorization code
7. TPP exchanges code for access token
```

### Consent Attributes
| Attribute | Description | Values |
|-----------|-------------|--------|
| Scope | Data access type | accounts, transactions, payments |
| Duration | Consent validity | 90 days default, max 365 days |
| Frequency | Access frequency | Multiple or one-time |
| Account Selection | Which accounts | All or selected accounts |

### Consent Revocation
- Customer can revoke via Al Tareq portal
- Customer can revoke via bank app
- TPP must handle token invalidation gracefully
- LFI must notify TPP of revocation

---

## UAE Pass Integration

Al Tareq integrates with UAE Pass for strong customer authentication.

### Authentication Levels
| Level | Method | Use Case |
|-------|--------|----------|
| Basic | Emirates ID + OTP | Low-risk data access |
| Standard | UAE Pass app | Standard transactions |
| Advanced | UAE Pass + biometric | High-value payments |

### Integration Points
```
UAE Pass SSO: For customer authentication
UAE Pass PKI: For digital signatures
UAE Pass Verify: For identity verification
```

---

## Production Deployment

### Environment URLs
```yaml
Sandbox:
  api_hub: sandbox.openfinance.ae
  trust_framework: sandbox.tf.openfinance.ae

Pre-Production:
  api_hub: preprod.openfinance.ae  
  trust_framework: preprod.tf.openfinance.ae

Production:
  api_hub: api.openfinance.ae
  trust_framework: tf.openfinance.ae
```

*Note: Actual URLs configured per LFI during onboarding*

### Deployment Checklist
- [ ] FAPI 2.0 certification completed
- [ ] mTLS certificates installed
- [ ] Participant Directory registration
- [ ] Sandbox testing passed
- [ ] Security assessment completed
- [ ] Nebras production approval obtained

### Kubernetes Deployment Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: altareq-app
spec:
  template:
    spec:
      containers:
      - name: app
        env:
        - name: ALTAREQ_API_URL
          value: "https://api.altareq.ae"
        - name: CBUAE_CERT_PATH
          value: "/etc/ssl/certs/production.pem"
        volumeMounts:
        - name: cbuae-certs
          mountPath: /etc/ssl/certs
          readOnly: true
      volumes:
      - name: cbuae-certs
        secret:
          secretName: cbuae-mtls-certificates
```

### Monitoring Requirements
- API response times < 2 seconds (95th percentile)
- Availability: 99.9% uptime
- Error rate: < 0.1%
- Audit logging: All API calls logged

---

## Related References

- **APIs**: `api-specifications.md` - Complete API reference
- **LFI Integration**: `lfi-integration.md` - Implementation architecture
- **Testing**: `testing-certification.md` - FAPI certification requirements
- **Regulations**: `cbuae-regulations.md` - Security and compliance requirements
