# SSRF Security Assessment

## 1. Baseline

The application provides an authenticated URL-fetching endpoint:

POST /api/fetch-url

The server accepts a user-supplied URL and retrieves the requested resource.

A request to an external URL such as:

https://example.com

returned the remote response successfully.

## 2. Discovery

The endpoint accepts a fully user-controlled URL and passes it directly to the server-side HTTP client.

No destination validation or network boundary enforcement was present.

## 3. Exploitation

A controlled internal HTTP service was created on:

http://127.0.0.1:4000

The service was intentionally bound only to the local host.

The following request was then submitted through the API:

POST /api/fetch-url

{
  "url": "http://127.0.0.1:4000"
}

The API successfully retrieved and returned the response from the internal service.

This demonstrates that a remote API consumer can cause the server to make requests to local resources that are not directly exposed through the application's external interface.

## 4. Impact

Depending on the deployment environment, SSRF could allow an attacker to:

- Access internal services
- Reach localhost-only applications
- Interact with cloud metadata services
- Probe internal network resources
- Potentially retrieve sensitive internal information

## 5. Root Cause

The endpoint performed a server-side HTTP request to a fully user-controlled URL without validating the destination.

This allowed an authenticated user to make the server access local and private network resources.

The vulnerability was therefore caused by insufficient server-side destination validation.

## 6. Remediation
The URL-fetching functionality was updated to validate destinations before making requests.

The application now:

- Parses URLs using the URL parser.
- Allows only HTTP and HTTPS protocols.
- Rejects localhost and loopback destinations.
- Rejects private IPv4 ranges.
- Rejects link-local IPv4 addresses.
- Rejects local/private IPv6 destinations.
- Disables automatic redirect following.

The validation is performed server-side before the outbound request is made.

## 7. Validation
The original SSRF request was replayed after remediation.

Before remediation:

POST /api/fetch-url
{"url":"http://127.0.0.1:4000"}

The internal service response was returned with HTTP 200 OK.

After remediation:

POST /api/fetch-url
{"url":"http://127.0.0.1:4000"}

The request was rejected with HTTP 403 Forbidden.

A legitimate request to:

https://example.com

continued to work successfully.

The remediation therefore blocked the demonstrated SSRF path while preserving legitimate external URL fetching.
