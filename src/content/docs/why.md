---
title: Why IDMX
description: Why email's server-to-server transport needs a modern, authenticated HTTPS path, and why IDMX keeps addresses and SMTP instead of replacing email.
---

Email does something no other messaging system does: anyone with a `user@domain` address can reach anyone
else's, across independent providers, without asking a central party for permission. That is worth keeping.

What has aged is the **transport between domains**. SMTP was designed in 1982, and the properties operators
now depend on were added afterwards, one layer at a time:

- **Encryption is opportunistic.** STARTTLS can be stripped by anyone on the path, and MTA-STS and DANE exist
  to patch that.
- **Sender authentication is bolted on.** SPF, DKIM and DMARC each cover part of the problem, and receivers
  still lean heavily on IP address reputation.
- **The protocol is hard to implement well.** SMTP is a stateful, line-based text dialogue with decades of
  edge cases. Most operators never write it; they run one of a handful of existing MTAs.

## What IDMX changes

IDMX adds a second path between mail domains. It is an HTTPS API that both domains can use once they both
support it.

- **TLS 1.3 is mandatory.** No downgrade to plaintext, no opportunistic encryption.
- **Every delivery is signed** by the sending domain, and the receiver checks the signature against a key in
  the sender's DNS. Receivers get a strong domain identity instead of guessing from IP addresses.
- **Results are explicit.** Each recipient is accepted, rejected or deferred in the same response, and the
  spec defines which failures are retried and which may fall back to SMTP.
- **It is built from standard parts**: HTTPS, DNS SVCB records, RFC 9421 signatures, JSON and an OpenAPI
  document. Any language with an HTTP stack can implement it.

## What IDMX keeps

- **Addresses.** No new identities, no new address format.
- **The message.** The RFC 5322/MIME message travels byte for byte, so DKIM signatures and PGP or S/MIME
  encryption survive untouched.
- **SMTP.** A domain without IDMX gets mail over SMTP, exactly as today. Adoption can happen one domain at a
  time:

| From → To | Transport |
|---|---|
| IDMX → IDMX | IDMX over HTTPS |
| IDMX → SMTP-only | SMTP fallback |
| SMTP-only → IDMX | SMTP |
| SMTP-only → SMTP-only | SMTP |

## What IDMX is not

- **Not a client protocol.** Mail clients keep using IMAP, JMAP or whatever their provider offers.
  [JMAP](https://jmap.io/) modernizes client-to-provider access; IDMX covers what JMAP leaves out, delivery
  from one provider to another.
- **Not a mailbox format or a new kind of email.** An IDMX receiver sits beside the existing MTA and hands
  accepted messages to the same local delivery.
- **Not end-to-end encryption.** That stays in the message layer (PGP, S/MIME), which IDMX carries
  unchanged.
