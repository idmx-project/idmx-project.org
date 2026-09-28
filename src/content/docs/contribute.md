---
title: Contribute
description: How to review the IDMX specification, report problems, and contribute code under the Developer Certificate of Origin.
---

## Review the specification

**[v1-draft-00](/spec/v1-draft-00/) is in public review.** The most useful contribution right now is review
from people who run mail. Each draft comes with a [reviewer guide](/spec/v1-draft-00/review/) of concrete questions, covering fallback downgrade, domain signatures versus IP reputation,
forwarding, and address syntax. Short answers to one question are more useful than a full read.

Send feedback to **[feedback@idmx-project.org](mailto:feedback@idmx-project.org)**. Name the draft and
section you mean, for example “v1-draft-00 §3.2 of discovery.md”.

## Security issues

Report vulnerabilities, in the specification or in the reference implementation, privately to
**[security@idmx-project.org](mailto:security@idmx-project.org)** rather than in public feedback.

## Code and spec changes

Contributions go through the [idmx repository](https://github.com/idmx-project/idmx) and are accepted under
the [Developer Certificate of Origin](https://developercertificate.org/). Sign off every commit:

```sh
git commit -s
```

| Part | License |
|---|---|
| Specification prose | CC-BY-4.0 |
| Code and the OpenAPI document | MIT or Apache-2.0 |
| This website's content | CC-BY-4.0 |
