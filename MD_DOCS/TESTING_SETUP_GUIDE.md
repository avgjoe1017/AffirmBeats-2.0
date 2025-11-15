# Testing Infrastructure Setup Guide

**Priority**: 🔴 CRITICAL  
**Estimated Effort**: 1 week  
**Status**: Ready to implement

## Overview

This guide walks through setting up comprehensive testing infrastructure for both frontend and backend, including unit tests, integration tests, and E2E tests.

## Testing Stack

### Backend
- **Vitest**: Fast unit test framework
- **Supertest**: HTTP assertion library
- **Coverage**: V8 coverage provider

### Frontend
- **Jest**: JavaScript testing framework
- **React Native Testing Library**: React Native testing utilities
- **Coverage**: Jest coverage provider

### E2E
- **Detox**: End-to-end testing for React Native (optional, can be added later)

## Backend Testing Setup

### Step 1: Install Dependencies

```bash
cd backend
bun add -d vitest @vitest/ui supertest
bun add -d @types/supertest
```

### Step 2: Create Vitest Configuration

```typescript
// backend/vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "dist/",
        "generated/",
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Step 3: Create Test Setup File

```typescript
// backend/tests/setup.ts
import { beforeAll, afterAll } from "vitest";
import { db } from "../src/db";

beforeAll(async () => {
  // Set up test database
  // You can use a separate test database or reset the dev database
  console.log("Setting up test database...");
});

afterAll(async () => {
  // Clean up test database
  await db.$disconnect();
  console.log("Test database cleaned up");
});
```

### Step 4: Create Test Utilities

```typescript
// backend/tests/utils.ts
import { db } from "../src/db";

/**
 * Create a test user
 */
export async function createTestUser(data?: {
  id?: string;
  email?: string;
  name?: string;
}) {
  return db.user.create({
    data: {
      id: data?.id || `test-user-${Date.now()}`,
      email: data?.email || `test-${Date.now()}@example.com`,
      name: data?.name || "Test User",
      emailVerified: false,
    },
  });
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  await db.affirmationSession.deleteMany({
    where: {
      userId: {
        startsWith: "test-",
      },
    },
  });
  await db.userPreferences.deleteMany({
    where: {
      userId: {
        startsWith: "test-",
      },
    },
  });
  await db.userSubscription.deleteMany({
    where: {
      userId: {
        startsWith: "test-",
      },
    },
  });
  await db.user.deleteMany({
    where: {
      id: {
        startsWith: "test-",
      },
    },
  });
}
```

### Step 5: Create Sample Test

```typescript
// backend/tests/routes/sessions.test.ts
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { app } from "../../src/index";
import { createTestUser, cleanupTestData } from "../utils";

describe("POST /api/sessions/generate", () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  it("should generate session for authenticated user", async () => {
    const user = await createTestUser();
    
    // Mock authentication (you'll need to implement this based on your auth setup)
    const response = await app.request("/api/sessions/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add auth headers
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
    expect(data.affirmations.length).toBeGreaterThan(0);
    expect(data.title).toBeDefined();
    expect(data.goal).toBe("sleep");
  });

  it("should use fallback affirmations when OpenAI unavailable", async () => {
    // Mock OpenAI failure
    // Verify fallback is used
  });

  it("should enforce rate limits", async () => {
    // Make multiple requests in rapid succession
    // Expect rate limit error on 6th request
  });

  it("should validate input schema", async () => {
    const response = await app.request("/api/sessions/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        goal: "invalid-goal",
      }),
    });

    expect(response.status).toBe(400);
  });
});
```

### Step 6: Add Test Scripts

```json
// backend/package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

## Frontend Testing Setup

### Step 1: Install Dependencies

```bash
bun add -d @testing-library/react-native @testing-library/jest-native jest
bun add -d @types/jest
```

### Step 2: Create Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["@testing-library/jest-native/extend-expect"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|nativewind)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.stories.{ts,tsx}",
    "!src/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      lines: 60,
      functions: 60,
      branches: 60,
      statements: 60,
    },
  },
};
```

### Step 3: Create Test Setup File

```typescript
// src/__tests__/setup.ts
import "@testing-library/jest-native/extend-expect";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock expo modules
jest.mock("expo-audio", () => ({
  useAudioPlayer: jest.fn(),
}));

// Add other mocks as needed
```

### Step 4: Create Sample Test

```typescript
// src/screens/__tests__/PlaybackScreen.test.tsx
import { render, fireEvent } from "@testing-library/react-native";
import { PlaybackScreen } from "../PlaybackScreen";

const mockSession = {
  id: "test-session",
  title: "Test Session",
  goal: "sleep",
  affirmations: ["I am relaxed", "I am calm"],
  voiceId: "neutral",
  pace: "slow",
  noise: "rain",
  lengthSec: 180,
  binauralCategory: "delta",
  binauralHz: "0.5-4",
};

describe("PlaybackScreen", () => {
  it("should render player controls", () => {
    const { getByText, getByTestId } = render(
      <PlaybackScreen route={{ params: { session: mockSession } }} />
    );

    expect(getByText(mockSession.title)).toBeDefined();
    expect(getByTestId("play-button")).toBeDefined();
  });

  it("should toggle play/pause on button press", () => {
    const { getByTestId } = render(
      <PlaybackScreen route={{ params: { session: mockSession } }} />
    );

    const playButton = getByTestId("play-button");
    fireEvent.press(playButton);

    // Assert audio.play() was called
    // You'll need to mock the audio player
  });

  it("should show mini player when minimized", () => {
    // Test minimize behavior
  });
});
```

### Step 5: Add Test Scripts

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## E2E Testing Setup (Optional)

### Step 1: Install Detox

```bash
bun add -d detox
bun add -d jest-circus
```

### Step 2: Configure Detox

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      "$0": "jest",
      config: "e2e/jest.config.js"
    },
    jest: {
      setupTimeout: 120000
    }
  },
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath: "ios/build/Build/Products/Debug-iphonesimulator/AffirmBeats.app",
      build: "xcodebuild -workspace ios/AffirmBeats.xcworkspace -scheme AffirmBeats -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build"
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build: "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug",
      reversePorts: [8081]
    }
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 14"
      }
    },
    attached: {
      type: "android.attached",
      device: {
        adbName: ".*"
      }
    }
  },
  configurations: {
    "ios.debug": {
      device: "simulator",
      app: "ios.debug"
    },
    "android.debug": {
      device: "attached",
      app: "android.debug"
    }
  }
};
```

### Step 3: Create E2E Test

```typescript
// e2e/onboarding.spec.ts
import { device, element, by, waitFor } from "detox";

describe("Onboarding Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should complete onboarding and generate first session", async () => {
    // Step 1: Enter name
    await waitFor(element(by.id("name-input"))).toBeVisible();
    await element(by.id("name-input")).typeText("John");

    // Step 2: Select focus area
    await element(by.id("focus-sleep")).tap();

    // Step 3: Describe intention
    await element(by.id("intention-input")).typeText("Better rest");

    // Step 4: Generate session
    await element(by.id("generate-button")).tap();

    // Step 5: Verify session created
    await waitFor(element(by.id("playback-screen"))).toBeVisible();
    await expect(element(by.id("session-title"))).toBeVisible();
  });
});
```

## Test Coverage Goals

### Backend
- **Target**: 70% coverage minimum
- **Critical paths**: Session generation, subscription limits, authentication

### Frontend
- **Target**: 60% coverage minimum
- **Critical paths**: Playback screen, session creation, navigation

## Verification Checklist

- [ ] Vitest configured for backend
- [ ] Jest configured for frontend
- [ ] Test setup files created
- [ ] Test utilities created
- [ ] Sample tests written
- [ ] Test scripts added to package.json
- [ ] Test coverage configured
- [ ] CI/CD pipeline runs tests
- [ ] Test coverage meets targets

## Next Steps

After testing setup:
1. Write tests for critical paths
2. Add tests for edge cases
3. Set up CI/CD to run tests automatically
4. Monitor test coverage
5. Add E2E tests for critical user flows

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Jest Documentation](https://jestjs.io/)
- [Detox Documentation](https://wix.github.io/Detox/)

---

**Status**: Ready to implement  
**Next Step**: Install testing dependencies and create test configuration files
