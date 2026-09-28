---
title: How it works
description: How an IDMX delivery works, step by step — SVCB discovery, RFC 9421 domain signatures, a single HTTPS request per recipient domain, and SMTP fallback.
---

![How an IDMX delivery works. The sending domain looks up an SVCB record at _idmx for the recipient domain. If one exists, it posts the signed message over HTTPS to the IDMX receiver, which verifies the signature with a key published in the sender's DNS and hands the message to local delivery. If no record exists, the sender falls back to MX lookup and SMTP.](../../assets/how-it-works.svg)

Here is what happens when `alice@sender.example` sends a message to `bob@receiver.example`.

## 1. Discover

The sending domain looks up an **SVCB record** at `_idmx.receiver.example`. The record names the host
that accepts IDMX for that domain. That host can belong to a mail provider and be unrelated to the domain's
website, just as MX records work today.

- **No record:** the domain does not support IDMX. The sender uses MX and SMTP as usual.
- **A record:** the sender fetches the receiver's **capabilities document** (`GET /v1/capabilities`). It
  lists the supported versions and limits such as the maximum message size, which is always at least 25 MiB.

After a successful discovery the sender **pins** the result, by default for 7 days. If a later DNS answer
is missing or forged, the sender keeps using the pinned endpoint rather than silently downgrading to SMTP.

## 2. Sign and deliver

The sender makes **one HTTPS request per recipient domain**: `POST /v1/messages` over TLS 1.3. The body
has two parts:

- a small JSON **envelope** with the sender and the recipients at that domain, and
- the **message itself**, the unchanged RFC 5322/MIME bytes, exactly as they would travel over SMTP.

The request carries an **HTTP Message Signature** (RFC 9421, Ed25519) made with the sending domain's key,
and an **idempotency key**. If the sender retries after a network error, the receiver recognizes the key
and returns the original result instead of delivering twice.

## 3. Verify

The receiver looks up the sender's public key in DNS at `<selector>._idmxkey.sender.example`, a DKIM-style
record. Hosted providers can publish keys for their customers through a CNAME. If the signature does not
verify, the request is rejected, and the sender may **not** retry over SMTP.

## 4. Answer and hand off

The response reports each recipient as **accepted**, **rejected** (for example, no such mailbox) or
**deferred** (try again later). The receiver checks as much as it can before answering, so most failures are
known immediately instead of bouncing hours later.

Accepted messages go to the receiver's existing local delivery (LMTP, a pipe, whatever the MTA uses) with a
trace header and an `Authentication-Results` line. Mailbox storage and client access do not change.

## When IDMX is unavailable

The spec separates **"can't reach IDMX"** from **"IDMX said no"**:

- If the endpoint is unreachable or returns a server error, the sender retries with backoff. After a bounded
  fallback window of about 2 hours, it delivers over **SMTP** instead.
- An explicit rejection, such as an unknown recipient or a bad signature, is final. Falling back to SMTP would
  let a sender route around the receiver's decision, so the spec forbids it.

## Forwarding

A domain that forwards a message (an alias, for example) sends it on as a **new delivery signed by itself**.
The original author's DKIM signature stays inside the message, so the next hop knows both who forwarded it
and who wrote it.

The exact rules are in the [specification](/spec/).
