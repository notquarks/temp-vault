# Arkivio security model

Arkivio encrypts file bytes and filenames in the browser with a per-file AES-GCM key. The API stores ciphertext in R2 and stores the file key wrapped with the server master key.

This is **server-managed envelope encryption**, not zero-knowledge encryption. After authorization, the API unwraps the file key so the browser can decrypt the payload. Anyone with a valid owner session, guest capability, or share capability can therefore retrieve the encrypted file key.

Share capabilities are short-lived bearer credentials. They are stored in the URL fragment and sent to the API in request headers. They are not placed in API query strings. Owners can revoke shares, and making a file private revokes its existing shares.

A file ID is not a private capability. Public files may be retrieved by ID. Private files require the owner session or a valid share/guest capability according to the route policy.
