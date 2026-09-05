# CI/CD API Security Lab

![Security Pipeline](https://img.shields.io/badge/Security%20Pipeline-GitHub%20Actions-blue)
![Node.js](https://img.shields.io/badge/Node.js-24-green)
![AppSec](https://img.shields.io/badge/Focus-Application%20Security-red)
![DevSecOps](https://img.shields.io/badge/Focus-DevSecOps-purple)

A deliberately vulnerable **Node.js/Express REST API** built to demonstrate a practical Application Security lifecycle: identify vulnerabilities, reproduce them manually, remediate the root cause, automate security testing, and enforce security checks through CI/CD.

The project combines **manual API penetration testing with Burp Suite** and an automated GitHub Actions security pipeline using **Gitleaks, Semgrep, Trivy, and OWASP ZAP**, followed by an explicit security gate and regression testing.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Architecture](#architecture)
- [Security Lifecycle](#security-lifecycle)
- [Vulnerabilities Assessed](#vulnerabilities-assessed)
  - [JWT Secret Exposure / Privilege Escalation](#1-jwt-secret-exposure--privilege-escalation)
  - [BOLA / IDOR](#2-bola--idor)
  - [SSRF](#3-server-side-request-forgery-ssrf)
- [Security Remediation](#security-remediation)
- [DevSecOps CI/CD Pipeline](#devsecops-cicd-pipeline)
- [Security Regression Testing](#security-regression-testing)
- [Security Tools](#security-tools)
- [Project Structure](#project-structure)
- [Running Locally](#running-locally)
- [Security Evidence](#security-evidence)
- [Key Security Engineering Concepts](#key-security-engineering-concepts)
- [Future Improvements](#future-improvements)
- [Disclaimer](#disclaimer)

---

## Project Overview

This project simulates an API security assessment performed as part of a modern software development lifecycle.

The application was intentionally implemented with security weaknesses so that each vulnerability could be:

1. Discovered through manual testing.
2. Reproduced and validated using Burp Suite.
3. Documented with technical evidence.
4. Remediated at the application level.
5. Re-tested to confirm the fix.
6. Integrated into automated CI/CD security checks.
7. Tested against deliberate security regressions.

The goal is not simply to demonstrate individual vulnerabilities, but to demonstrate how security controls can be incorporated throughout the software development lifecycle.

---

## Objectives

- Understand common API security vulnerabilities.
- Perform manual security testing against REST API endpoints.
- Analyze authentication and authorization controls.
- Identify insecure handling of JWT signing secrets.
- Demonstrate object-level authorization failures.
- Demonstrate and remediate SSRF.
- Apply secure coding practices to an Express application.
- Integrate automated security testing into GitHub Actions.
- Establish a CI/CD security gate.
- Demonstrate security regression detection using a deliberately vulnerable branch.
- Document findings, remediation, and validation evidence.

---

## Architecture

### Application and Testing Architecture

```text
                         Developer
                             |
                             v
                    +----------------+
                    |    GitHub      |
                    | Repository/PR  |
                    +-------+--------+
                            |
                            v
                  +---------------------+
                  |   GitHub Actions    |
                  |   Security Pipeline |
                  +----------+----------+
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
     +---------+        +---------+        +---------+
     | Gitleaks|        | Semgrep |        |  Trivy  |
     | Secrets |        |  SAST   |        |   SCA   |
     +---------+        +---------+        +---------+
          |                  |                  |
          +------------------+------------------+
                             |
                             v
                       +-----------+
                       | OWASP ZAP |
                       |   DAST    |
                       +-----+-----+
                             |
                             v
                     +---------------+
                     | Security Gate |
                     +-------+-------+
                             |
                        PASS / FAIL
                             |
                             v
                    +----------------+
                    | Express REST   |
                    |      API       |
                    +----------------+
                             ^
                             |
                       Burp Suite
                    Manual AppSec Testing
```

---

## Security Lifecycle

The project follows a continuous security lifecycle:

```text
Intentionally Vulnerable API
            |
            v
     Manual Discovery
            |
            v
      Exploitation
            |
            v
   Root Cause Analysis
            |
            v
       Remediation
            |
            v
      Re-validation
            |
            v
     Security Automation
            |
            v
      CI/CD Security Gate
            |
            v
    Regression Testing
            |
            v
       Merge Decision
```

This demonstrates the transition from **manual AppSec testing** to **continuous security validation**.

---

# Vulnerabilities Assessed

## 1. JWT Secret Exposure / Privilege Escalation

### Description

The initial application contained a hardcoded JWT signing secret.

The API used **HS256**, a symmetric JWT signing algorithm. With HS256, the same secret is used to sign and verify tokens. If the signing secret is exposed, an attacker can potentially construct a new token with modified claims.

The vulnerable implementation allowed a token to be forged with an elevated role.

### Attack Flow

```text
Hardcoded JWT Secret
        |
        v
Attacker obtains signing secret
        |
        v
Forge JWT claims
        |
        v
role = admin
        |
        v
Send forged token to protected endpoint
        |
        v
Unauthorized privileged access
```

### Impact

A compromised JWT signing secret could allow:

- Token forgery.
- Modification of authorization claims.
- Privilege escalation.
- Unauthorized access to protected functionality.

### Remediation

The hardcoded signing secret was removed from application source code.

The application was updated to:

- Generate/use a cryptographically strong secret.
- Load the JWT secret from an environment variable.
- Centralize JWT configuration.
- Keep `.env` outside version control.
- Avoid embedding production-style credentials in source code.

### Validation

The original forged JWT was replayed after remediation.

Expected result:

```text
HTTP 401 Unauthorized
```

This demonstrated that a token generated using the previous signing secret was no longer accepted.

---

## 2. BOLA / IDOR

### Description

The initial API authenticated the requester but did not adequately enforce **object-level authorization**.

A valid user's JWT could be used to request another user's resource by modifying the resource identifier.

This is commonly referred to as **Broken Object Level Authorization (BOLA)** and is also related to the traditional **IDOR** vulnerability pattern.

### Attack Flow

```text
Alice's valid JWT
       |
       v
GET /api/users/1
       |
       v
Alice's resource
       |
       v
HTTP 200 OK
```

The identifier was then changed:

```text
Same Alice JWT
       |
       v
GET /api/users/2
       |
       v
Bob's resource
       |
       v
HTTP 200 OK
       |
       v
Unauthorized access
```

### Impact

BOLA can allow an authenticated attacker to access resources belonging to other users.

Depending on the affected resource, this could expose:

- Personal information.
- Account data.
- Business records.
- Internal application objects.
- Other user-controlled resources.

### Remediation

A server-side object-level authorization check was implemented.

The application now compares:

```text
Authenticated user ID
        vs.
Requested resource ID
```

before returning the resource.

The authorization decision is therefore made on the server rather than trusting the object identifier supplied by the client.

### Validation

Legitimate access:

```text
GET /api/users/1
HTTP 200 OK
```

Unauthorized cross-user access:

```text
GET /api/users/2
HTTP 403 Forbidden
```

The original attack request was replayed after remediation to confirm that horizontal unauthorized access was blocked.

---

## 3. Server-Side Request Forgery (SSRF)

### Description

The initial URL-fetching endpoint accepted a fully user-controlled URL and performed an HTTP request from the server.

A controlled internal HTTP service was created on:

```text
http://127.0.0.1:4000
```

The service was intentionally bound to localhost and returned a unique response identifying itself as an internal test service.

The vulnerable API successfully retrieved this internal response.

### Attack Flow

```text
User
 |
 | POST /api/fetch-url
 | {"url":"http://127.0.0.1:4000"}
 v
Express API
 |
 | Server-side request
 v
127.0.0.1:4000
 |
 v
Internal Test Service
 |
 v
Response returned to attacker
```

### Impact

In a real deployment, an SSRF vulnerability may allow attackers to:

- Access localhost-only services.
- Probe internal network resources.
- Reach private network services.
- Interact with internal administrative interfaces.
- Potentially access cloud metadata services.

### Remediation

The URL-fetching functionality was updated with server-side destination validation.

The implementation:

- Parses URLs using the URL parser.
- Allows only HTTP and HTTPS protocols.
- Blocks `localhost`.
- Blocks loopback addresses.
- Blocks private IPv4 ranges.
- Blocks link-local IPv4 addresses.
- Blocks local/private IPv6 destinations.
- Disables automatic redirect following.

### Validation

The original SSRF request:

```text
POST /api/fetch-url
{"url":"http://127.0.0.1:4000"}
```

was rejected after remediation:

```text
HTTP 403 Forbidden
```

A legitimate external URL remained functional:

```text
https://example.com
```

This demonstrated that the specific SSRF path was blocked without disabling legitimate external URL fetching.

---

# Security Remediation

In addition to vulnerability-specific fixes, the API was hardened with HTTP security headers.

The application uses **Helmet** to provide common security-related HTTP response headers and disables Express's default `X-Powered-By` header.

The changes addressed findings observed during the initial OWASP ZAP scan, including:

- Content Security Policy-related findings.
- Cross-Origin-Resource-Policy.
- Permissions-Policy hardening.
- `X-Powered-By` information disclosure.
- `X-Content-Type-Options`.

The goal was to remediate findings at the application level rather than suppressing scanner output without investigation.

---

# DevSecOps CI/CD Pipeline

The security pipeline is implemented using **GitHub Actions**.

It runs for:

- Pushes to `main`.
- Pull requests targeting `main`.

### Pipeline

```text
                 GitHub Push / Pull Request
                            |
                            v
                  +-------------------+
                  | GitHub Actions     |
                  +---------+---------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
   +---------+         +---------+         +---------+
   | Gitleaks|         | Semgrep |         |  Trivy  |
   | Secrets |         |  SAST   |         |   SCA   |
   +---------+         +---------+         +---------+
        |                   |                   |
        +-------------------+-------------------+
                            |
                            v
                      +-----------+
                      | OWASP ZAP |
                      |   DAST    |
                      +-----+-----+
                            |
                            v
                    +---------------+
                    | Security Gate |
                    +-------+-------+
                            |
                     PASS / BLOCK
```

## Gitleaks — Secret Scanning

Gitleaks is used to detect exposed secrets and credentials in the repository.

The workflow checks repository content with full Git history available to the scanner.

The project also demonstrates a security regression where a deliberately fake JWT secret was introduced into a test branch.

Gitleaks detected the regression and caused the Security Gate to fail.

---

## Semgrep — SAST

Semgrep performs static application security testing against the JavaScript source code.

The current workflow uses JavaScript security rules and excludes dependency directories such as `node_modules`.

Example:

```yaml
semgrep scan \
  --config p/javascript \
  --error \
  --exclude node_modules/
```

This provides source-level security analysis before code is merged.

---

## Trivy — Software Composition Analysis

Trivy performs filesystem/dependency scanning for known vulnerabilities.

The pipeline is configured to evaluate:

- HIGH severity findings.
- CRITICAL severity findings.

Unfixed vulnerabilities are ignored for the current dependency scan policy.

The project can be extended to scan the built Docker image as an additional container-security control.

---

## OWASP ZAP — DAST

OWASP ZAP performs dynamic application security testing against the running Express API.

The GitHub Actions workflow:

1. Checks out the repository.
2. Installs Node.js dependencies.
3. Starts the API.
4. Performs a health check.
5. Runs the ZAP baseline scan against the running service.

Example target:

```text
http://127.0.0.1:3000
```

Initial ZAP testing produced several HTTP security-header warnings. These findings were investigated and addressed through application hardening.

The workflow intentionally avoids automatic GitHub Issue creation by ZAP.

---

## Security Gate

The Security Gate is an explicit GitHub Actions job that depends on:

```text
Gitleaks
Semgrep
Trivy
OWASP ZAP
```

The gate evaluates the result of each required security job.

Conceptually:

```text
Gitleaks = success
Semgrep  = success
Trivy    = success
ZAP      = success
              |
              v
       Security Gate PASS
```

If any required security job fails:

```text
Security Gate FAIL
```

This provides a centralized CI/CD enforcement point.

---

# Security Regression Testing

The pipeline was deliberately tested against a security regression.

A fake hardcoded JWT secret was introduced into a dedicated test branch:

```text
security-test/jwt-secret
```

### Regression Flow

```text
Secure application
        |
        v
Introduce fake hardcoded JWT secret
        |
        v
GitHub Actions
        |
        v
Gitleaks detects secret
        |
        v
Gitleaks FAIL
        |
        v
Security Gate FAIL
```

The vulnerable change was then removed and the test branch history was cleaned before merging.

### Successful Validation

After remediation:

```text
Gitleaks      PASS
Semgrep       PASS
Trivy         PASS
OWASP ZAP     PASS
Security Gate PASS
```

This demonstrates that the CI/CD security controls are capable of detecting a known security regression and preventing it from passing the security gate.

---

# Security Tools

| Tool | Purpose | Testing Layer |
|---|---|---|
| **Burp Suite** | Manual API interception and exploitation | Manual AppSec |
| **Gitleaks** | Secret detection | Secret Scanning |
| **Semgrep** | Source-code security analysis | SAST |
| **Trivy** | Dependency vulnerability scanning | SCA |
| **OWASP ZAP** | Running application security testing | DAST |
| **GitHub Actions** | Automated security pipeline | CI/CD |

---

# Technologies

### Application

- Node.js
- Express.js
- JavaScript
- REST APIs
- JWT
- HS256
- Helmet

### Security

- API Security
- Authentication & Authorization
- JWT Security
- BOLA / IDOR
- SSRF
- HTTP Security Headers
- Manual Penetration Testing
- Security Regression Testing

### DevSecOps

- GitHub Actions
- SAST
- DAST
- SCA
- Secret Scanning
- CI/CD Security Gates

### Infrastructure / Development

- Docker
- Git
- GitHub
- VS Code

---

# Project Structure

```text
devsecops-api-security/
│
├── middleware/
│   └── auth.js
│
├── routes/
│   ├── resources.js
│   └── fetch.js
│
├── tests/
│   └── internal-server.js
│
├── docs/
│   ├── evidence/
│   │   ├── security gate failure.png
│   │   └── security-gate-passed.png
│   │
│   ├── jwt-assessment.md
│   ├── bola-assessment.md
│   └── ssrf-assessment.md
│
├── .github/
│   └── workflows/
│       └── security.yml
│
├── config.js
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

> The exact file structure may evolve as additional security controls and tests are added.

---

# Running Locally

## Prerequisites

- Node.js
- npm
- Git
- Docker (optional for local container workflows)
- Burp Suite (optional for manual security testing)

## Install Dependencies

```bash
npm install
```

## Configure Environment Variables

Create a `.env` file containing the JWT signing secret used by the local development environment.

Example:

```env
JWT_SECRET=<strong-random-development-secret>
```

Never commit `.env` or real credentials to the repository.

## Start the API

```bash
node server.js
```

The API runs locally on:

```text
http://localhost:3000
```

Health check:

```text
GET /health
```

---

# Security Evidence

Security testing evidence is stored under:

```text
docs/evidence/
```

The evidence demonstrates both negative and positive security outcomes.

### Regression Failure

A deliberately introduced hardcoded secret caused:

```text
Gitleaks       FAIL
Security Gate  FAIL
```

Evidence:

```text
docs/evidence/security gate failure.png
```

### Regression Success

After removing the vulnerable change:

```text
Gitleaks       PASS
Semgrep        PASS
Trivy          PASS
OWASP ZAP      PASS
Security Gate  PASS
```

Evidence:

```text
docs/evidence/security-gate-passed.png
```

Detailed vulnerability assessments are maintained in:

```text
docs/jwt-assessment.md
docs/bola-assessment.md
docs/ssrf-assessment.md
```

---

# Key Security Engineering Concepts

This project demonstrates practical understanding of:

### Authentication vs Authorization

Authentication establishes **who** the requester is.

Authorization determines **what that requester is allowed to access**.

The BOLA vulnerability demonstrates why successful authentication alone is not sufficient.

### Secure Secret Management

Secrets should not be hardcoded into source code.

They should be managed through appropriate secret-management mechanisms and rotated if exposure occurs.

### Defense in Depth

No single security tool provides complete coverage.

The project combines:

```text
Manual Testing
+
SAST
+
SCA
+
Secret Scanning
+
DAST
+
Security Regression Testing
+
CI/CD Security Gate
```

### Shift Left Security

Security testing is moved earlier into the development lifecycle so that vulnerabilities can be detected before code is merged or deployed.

### Continuous Security Validation

The same vulnerabilities discovered during manual testing are used to inform automated regression controls.

---

# Future Improvements

Potential next iterations include:

- Add automated API security tests using Jest/Supertest.
- Add STRIDE-based threat modeling.
- Add OpenAPI specification for the API.
- Perform authenticated DAST with OWASP ZAP.
- Add Docker image scanning with Trivy.
- Add dependency update automation with Dependabot.
- Add security report generation and CI artifacts.
- Expand SSRF protection to include DNS resolution and DNS-rebinding defenses.
- Add API fuzzing and negative test cases.
- Add security metrics and trend reporting.
- Add branch protection rules requiring the Security Gate to pass before merge.

---

# Disclaimer

This repository contains intentionally vulnerable application components for educational and authorized security-testing purposes.

Do not deploy the intentionally vulnerable baseline in a production environment.

All security testing should be performed only against systems and applications for which you have explicit authorization.

---

## Project Focus

**Application Security → API Security → DevSecOps → CI/CD Security Automation → Security Regression Prevention**
