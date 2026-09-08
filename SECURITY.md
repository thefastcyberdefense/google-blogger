# Security policy

Do not publish credentials, customer information or exploit details in public issues. Use the contact channel listed on https://fastcyberdefense.com/ for sensitive reports; no unverified security email is invented here.

Theme scripts must validate same-origin HTTPS feed URLs, reject credentials/unsafe schemes, bound response size/time, and construct DOM with textContent. No raw cached HTML, API keys, tracking IDs or unreviewed third-party scripts. Blogger-authored post HTML and Blogger comments retain the platform's trust boundary; the theme is not an HTML sanitizer for untrusted post authors.

CI runs dependency audit and regression tests without production credentials. Findings remain blockers until fixed or explicitly accepted. A successful static scan is not proof of production security. Mermaid/highlighting dependencies are not added in this initial slice.
