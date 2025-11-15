# Frontend Testing Guide

**Last Updated**: 2025-01-XX  
**Status**: ✅ Complete

## Overview

This guide provides information about the frontend testing infrastructure for the AffirmBeats app using Jest and React Native Testing Library.

## Testing Stack

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: React Native testing utilities
- **@testing-library/jest-native**: Additional Jest matchers for React Native
- **jest-expo**: Expo-specific Jest preset

## Configuration

### Jest Configuration

The Jest configuration is in `jest.config.js`:

```javascript
module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  transformIgnorePatterns: [...],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
  // ...
};
```

### Jest Setup

The Jest setup file (`jest.setup.js`) includes:
- Mocking Expo modules (constants, font, asset)
- Mocking AsyncStorage
- Mocking React Navigation
- Mocking React Query
- Mocking Zustand
- Mocking expo-haptics and expo-audio

## Running Tests

### Run all tests
```bash
bun run test
```

### Run tests in watch mode
```bash
bun run test:watch
```

### Run tests with coverage
```bash
bun run test:coverage
```

### Run tests in CI mode
```bash
bun run test:ci
```

## Writing Tests

### Component Tests

Example: Testing a component with navigation and store

```typescript
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { NavigationContainer } from "@react-navigation/native";
import MyComponent from "../MyComponent";
import { useAppStore } from "@/state/appStore";

// Mock the store
jest.mock("@/state/appStore");

describe("MyComponent", () => {
  it("should render correctly", () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText("Hello")).toBeTruthy();
  });
});
```

### Store Tests

Example: Testing Zustand store

```typescript
import { renderHook, act } from "@testing-library/react-native";
import { useAppStore } from "../appStore";

describe("AppStore", () => {
  it("should set preferences", () => {
    const { result } = renderHook(() => useAppStore());

    act(() => {
      result.current.setPreferences({ ... });
    });

    expect(result.current.preferences).toEqual({ ... });
  });
});
```

### API Client Tests

Example: Testing API client

```typescript
import { api } from "../api";

// Mock global fetch
global.fetch = jest.fn();

describe("API Client", () => {
  it("should make GET request", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: "test" }),
    });

    const result = await api.get("/api/test");
    expect(result).toEqual({ data: "test" });
  });
});
```

## Test Coverage

Test coverage is configured with the following thresholds:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

Coverage reports are generated in the `coverage/` directory and uploaded to Codecov in CI.

## CI/CD Integration

Frontend tests run automatically in CI on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

The CI workflow:
1. Installs dependencies
2. Runs type checking
3. Runs linter
4. Runs tests with coverage
5. Uploads coverage reports to Codecov

## Best Practices

### 1. Mock External Dependencies
Always mock external dependencies like:
- Expo modules
- React Navigation
- AsyncStorage
- React Query
- API clients

### 2. Test User Interactions
Focus on testing user interactions rather than implementation details:
```typescript
// Good: Test user interaction
fireEvent.press(getByText("Submit"));

// Bad: Test implementation details
expect(component.state.isSubmitting).toBe(true);
```

### 3. Use Accessibility
Prefer accessibility queries over test IDs:
```typescript
// Good: Use accessibility
getByLabelText("Email");

// Bad: Use test IDs
getByTestId("email-input");
```

### 4. Test Error States
Always test error states and edge cases:
```typescript
it("should handle errors", async () => {
  (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));
  
  await expect(api.get("/api/test")).rejects.toThrow();
});
```

### 5. Clean Up
Always clean up after tests:
```typescript
afterEach(() => {
  jest.clearAllMocks();
});
```

## Example Tests

### Component Test
See `src/components/__tests__/MiniPlayer.test.tsx` for a complete example of testing a component with:
- Navigation
- Store integration
- User interactions
- Conditional rendering

### Store Test
See `src/state/__tests__/appStore.test.ts` for a complete example of testing a Zustand store with:
- State updates
- Actions
- Persistence

### API Client Test
See `src/lib/__tests__/api.test.ts` for a complete example of testing an API client with:
- HTTP requests
- Error handling
- Authentication

## Troubleshooting

### Tests fail with "Cannot find module"
Make sure the module path alias is configured correctly in `jest.config.js`:
```javascript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
}
```

### Tests fail with "NavigationContainer not found"
Wrap your component in a NavigationContainer in tests:
```typescript
const TestWrapper = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);
```

### Tests fail with "AsyncStorage not found"
Make sure AsyncStorage is mocked in `jest.setup.js`:
```javascript
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: { ... },
}));
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Expo Documentation](https://docs.expo.dev/guides/testing-with-jest/)

---

**Next Steps**: Add more component tests incrementally as you develop new features.
