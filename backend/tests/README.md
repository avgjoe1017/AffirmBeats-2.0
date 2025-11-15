# Backend Tests

This directory contains the test suite for the backend API.

## Setup

1. Install dependencies:
```bash
cd backend
bun install
```

2. Set up test database:
```bash
# For SQLite (default)
DATABASE_URL=file:test.db bunx prisma migrate dev

# For PostgreSQL (recommended for CI)
DATABASE_URL=postgresql://user:password@localhost:5432/affirmbeats_test bunx prisma migrate dev
```

3. Run tests:
```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

## Test Structure

```
tests/
├── setup.ts           # Test setup and teardown
├── utils.ts           # Test utilities and helpers
├── routes/            # Route tests
│   ├── sessions.test.ts
│   └── health.test.ts
└── README.md          # This file
```

## Test Utilities

### `createTestUser(data?)`
Creates a test user with optional data.

### `createTestUserPreferences(userId, data?)`
Creates test user preferences.

### `createTestUserSubscription(userId, data?)`
Creates test user subscription.

### `createTestSession(userId, data?)`
Creates a test affirmation session.

### `createCompleteTestUser(data?)`
Creates a complete test user with preferences and subscription.

### `cleanupTestData()`
Cleans up all test data (users, sessions, preferences, subscriptions).

## Writing Tests

### Example Test

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { app } from "../../src/index";
import { createCompleteTestUser, cleanupTestData } from "../utils";

describe("POST /api/sessions/generate", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  it("should generate session for authenticated user", async () => {
    const user = await createCompleteTestUser();

    const response = await app.request("/api/sessions/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal: "sleep",
        customPrompt: "Help me relax before bed",
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.affirmations).toBeDefined();
    expect(Array.isArray(data.affirmations)).toBe(true);
  });
});
```

## Test Coverage

Target coverage: 70% minimum

Current coverage can be viewed by running:
```bash
bun run test:coverage
```

## CI/CD

Tests are automatically run in CI/CD pipeline (`.github/workflows/ci.yml`).

## Notes

- Tests use a separate test database (or cleanup test data)
- Test data is cleaned up before and after each test
- Test users, sessions, and subscriptions are prefixed with "test-"
- Authentication is mocked (TODO: implement proper auth mocking)
- Rate limiting tests are skipped (TODO: implement rate limit testing)
- Subscription limit tests are skipped (TODO: implement subscription limit testing)
