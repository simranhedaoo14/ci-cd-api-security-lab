# BOLA / IDOR Security Assessment

## 1. Baseline

Alice was authenticated successfully and was able to access her own resource:

GET /api/users/1

The server returned Alice's user information.

## 2. Discovery

The resource endpoint accepts a user-controlled object identifier:

GET /api/users/:id

The application initially appeared to rely on authentication without verifying whether the authenticated user was authorized to access the requested resource.

## 3. Exploitation

Using Alice's valid JWT, the resource identifier was changed from:

GET /api/users/1

to:

GET /api/users/2

The server returned Bob's user information with HTTP 200 OK.

The JWT remained unchanged; only the resource identifier was modified.

## 4. Impact

An authenticated user can access another user's resource by modifying the object identifier.

Potential impact includes unauthorized disclosure or modification of other users' data, depending on the privileges exposed by the affected endpoint.

## 5. Root Cause

The endpoint authenticated the requester but did not perform object-level authorization. The resource identifier supplied in the URL was trusted without verifying that the authenticated user was permitted to access that specific object.

This allowed an authenticated user to access another user's resource by changing the object identifier.

## 6. Remediation
The endpoint was updated to perform a server-side ownership check.

The authenticated user's ID from the verified JWT is compared with the requested resource ID before the resource is returned.

Requests for resources belonging to another user now receive HTTP 403 Forbidden.

The authorization decision is therefore made server-side rather than relying on the resource identifier supplied by the client.

## 7. Validation
The original exploitation request was replayed after remediation.

Before remediation:

GET /api/users/2
Alice's JWT
HTTP 200 OK
Bob's data returned

After remediation:

GET /api/users/2
Same Alice JWT
HTTP 403 Forbidden

Alice can still access her own resource:

GET /api/users/1
HTTP 200 OK

The remediation therefore prevents horizontal unauthorized access while preserving legitimate access.