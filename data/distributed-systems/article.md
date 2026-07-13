---
title: The Quiet Machines Beneath the Cloud
description: A visual tour through the systems that make distributed software feel local.
date: 2026-06-22
cover: cover.svg
category: Distributed Systems
tags:
  - Systems
  - Cloud
readingTime: 9
---

# The Quiet Machines Beneath the Cloud

The cloud is a coordination problem wearing a friendly interface.

## The impossible triangle

Distributed systems balance consistency, availability, and tolerance of network partitions.

| Choice | Cost |
| --- | --- |
| Strong consistency | Latency |
| Eventual consistency | Reconciliation |

## Design for repair

Failures are ordinary. Durable systems make operations repeatable and offer a path back to coherence.
