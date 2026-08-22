# JWT Security Assessment

## 1. Baseline
The API uses JWT-based authentication.

A valid login request to:

POST /api/auth/login

returns a JWT signed using the HS256 algorithm.

A valid JWT can then be supplied as:

Authorization: Bearer <JWT>

to access:

GET /api/users/profile

A valid token for the `alice` account returned:

{
  "id": 1,
  "username": "alice",
  "role": "user"
}

The normal authenticated request was captured and replayed successfully using Burp Suite Repeater.

## 2. Discovery
### Authorization Baseline

A valid JWT belonging to the `alice` user was supplied to the administrative endpoint:

GET /api/admin/dashboard

Alice's token contained the role:

"user"

The server correctly rejected the request with HTTP 403 Forbidden.

This establishes that the administrative endpoint performs a server-side role check before granting access.

### Signing Secret Discovery

Review of the authentication implementation revealed that the JWT signing secret is hardcoded directly in the application source code:

const JWT_SECRET = 'devsecops-secret-key';

The secret is also used by the JWT verification middleware.

Because HS256 uses a shared secret for both signing and verification, compromise of this secret would allow an attacker to generate valid JWTs with modified claims.

## 3. Exploitation

### Step 1 — Obtain a legitimate user token

A valid JWT was obtained for the `alice` account.

The token contained:

"role": "user"

When this token was submitted to:

GET /api/admin/dashboard

the server returned:

HTTP 403 Forbidden

### Step 2 — Forge an administrative token

The JWT signing secret was discovered in application source code:

devsecops-secret-key

Using the exposed secret, a new JWT was generated with the same user identity but an elevated role:

"role": "admin"

The forged token was accepted by the server because it had a valid HS256 signature.

### Step 3 — Access the administrative endpoint

The forged token was submitted to:

GET /api/admin/dashboard

The server returned:

HTTP 200 OK

and exposed administrative information.

This demonstrates that compromise of the hardcoded JWT signing secret allows an attacker to forge valid tokens and bypass role-based authorization.

## 4. Impact
An attacker who obtains the JWT signing secret can generate valid tokens containing arbitrary claims.

Potential impact includes:

- Privilege escalation from user to administrator
- Unauthorized access to administrative functionality
- Impersonation of other users
- Bypass of application-level authorization controls

The vulnerability is caused by insecure secret management rather than the HS256 algorithm itself.

## 5. Root Cause

## 6. Remediation

## 7. Validation