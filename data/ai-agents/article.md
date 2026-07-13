---
title: AI Agents from First Principles
description: A practical explanation of autonomous agent systems.
date: 2026-07-12
updated: 2026-07-13
cover: cover.svg
category: Artificial Intelligence
tags:
  - AI
  - Agents
featured: true
---

# AI Agents

An agent is a system that observes, decides, acts, and evaluates its work.

## The agent loop

1. Observe the current state.
2. Choose an action.
3. Evaluate the outcome.

![A simple agent loop](resources/agent-loop.svg)

## Reliability before autonomy

Good agents make uncertainty visible and keep people in control of consequential decisions.

```ts
const nextAction = await agent.decide(observations)
await tools.execute(nextAction)
```
