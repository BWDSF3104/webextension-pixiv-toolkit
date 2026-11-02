# API Rate Limits

## Overview

This document tracks rate limits for external APIs and data sources used by the project. Test scripts must respect these limits.

## Rate Limit Table

| Service | Rate Limit | Notes |
|---------|-----------|-------|
| [Service Name] | [limit] | [notes] |

## Test Script Guidelines

- テストでの外部 API 呼出し可否はプロジェクトの決定（`docs/ai/decisions/2026-11-02-tests-may-call-external-api.md`）に従う
- Rate limit testing should be done in separate scripts, not collected by the test runner
