---
title: Implementations
description: The IDMX reference implementation in Rust, the conformance checker, and the containerized development network.
---

The specification defines IDMX. Code demonstrates it, and it never overrides the spec. Independent
implementations are the goal: the spec is meant to be small enough to implement from the text alone.

## Reference implementation (Rust)

The [idmx repository](https://github.com/idmx-project/idmx) contains:

| Component | What it is |
|---|---|
| `idmx-core` | Envelope types, RFC 9421 signing and verification, SVCB discovery |
| `idmxd` | The receiver daemon: runs beside an existing MTA and hands accepted mail to local delivery |
| `idmx` | Sender library and CLI: retries, pinning, a spool queue, SMTP fallback, bounces |
| `idmx-conformance` | Black-box checks against any receiver: `idmx-conformance <origin>` |

Code is dual-licensed MIT or Apache-2.0.

## Devnet

`devnet/` starts a small IDMX network in containers (podman or docker). It has one DNS server, two domains
that deliver to each other over IDMX, and an SMTP-only legacy domain. Scripts run the three core flows:
IDMX-to-IDMX delivery, SMTP fallback, and conformance against both receivers.

## Writing your own

Start with the [specification](/spec/). The OpenAPI document and the test vectors that come with each draft
cover the wire format and signatures. Then run `idmx-conformance` against your receiver.
