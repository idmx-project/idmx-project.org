---
title: Status & roadmap
description: Where IDMX stands today — the v1-draft-00 specification review, what the reference implementation covers, and what is planned after v1.
---

IDMX is **experimental**. Nothing is stable yet, and nothing should carry production mail.

## Now: v1-draft-00 in review

The first specification draft, **v1-draft-00**, is frozen and in private review with a small group of
invited reviewers. The review can still change the wire format. Each such change gets a new draft number,
so a tagged draft never changes after it is published.

After the review, the spec becomes **v1 final**. From then on it only gets errata; new behavior goes into a
new major version.

## Reference implementation

A reference implementation in Rust already covers the whole v1 path: discovery, signing, a receiver and a
sender with retries, pinning, a spool queue, SMTP fallback and bounces. A containerized test network runs
IDMX-to-IDMX delivery, SMTP fallback and a conformance check against every receiver. See
[Implementations](/implementations/).

## Deliberately not in v1

- Mailing-list semantics (for now, lists send each copy as a new delivery)
- End-to-end encryption and key discovery for it
- Resumable upload for very large messages
- Reports of pinning failures, the IDMX equivalent of TLS-RPT
- Mail client submission and mailbox access (IDMX is server-to-server only)

## Later

Once most mail between participating domains flows over IDMX, it can do things that are pointless while
SMTP stays an open side door. Examples are first-contact limits for unknown senders and signed sender
attestations. They would arrive in a later major version, without changing the basic delivery model.
