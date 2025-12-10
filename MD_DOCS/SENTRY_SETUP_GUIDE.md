# Sentry Setup Guide (Comprehensive)

**Priority**: 🔴 HIGH (Recommended)  
**Estimated Effort**: 30 minutes (backend), 2-3 hours (full setup)  
**Status**: ✅ Backend code ready - Just needs DSN configuration

**Quick Start**: See `MD_DOCS/SENTRY_QUICK_SETUP.md` for 5-minute setup (backend only)

## Overview

Sentry provides error tracking and monitoring for both frontend and backend. This guide walks through setting up Sentry for production error tracking.

## Prerequisites

- Sentry account ([sentry.io](https://sentry.io))
- Sentry project created
- DSN (Data Source Name) from Sentry project

## Setup Steps

### Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Create account (free tier available)
3. Create new project:
   - Frontend: React Native
   - Backend: Node.js

### Step 2: Install Sentry Packages

#### Frontend (React Native)

```bash
# Install Sentry for React Native
npx expo install @sentry/react-native
```

#### Backend (Node.js)

```bash
# Install Sentry for Node.js
cd backend
bun add @sentry/node
```

### Step 3: Configure Environment Variables

#### Frontend

```bash
# .env
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

#### Backend

```bash
# backend/.env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=development  # or production, staging
```

### Step 4: Update Environment Schema

#### Frontend

```typescript
// src/lib/env.ts (if exists, or add to App.tsx)
const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;
```

#### Backend

```typescript
// backend/src/env.ts
const envSchema = z.object({
  // ... existing config
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.enum(["development", "staging", "production"]).optional(),
});
```

### Step 5: Initialize Sentry in Frontend

```typescript
// App.tsx
import * as Sentry from "@sentry/react-native";

// Initialize Sentry before everything else
if (process.env.EXPO_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    environment: __DEV__ ? "development" : "production",
    enableAutoSessionTracking: true,
    tracesSampleRate: __DEV__ ? 1.0 : 0.1, // 100% in dev, 10% in prod
    integrations: [
      // Add integrations as needed
    ],
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request) {
        delete event.request.cookies;
        delete event.request.headers?.Authorization;
      }
      return event;
    },
  });
}

// Rest of App.tsx
export default function App() {
  // ...
}
```

### Step 6: Initialize Sentry in Backend

**✅ ALREADY IMPLEMENTED** - No code changes needed!

The backend Sentry integration is already complete in `backend/src/lib/sentry.ts`. It:
- Automatically initializes on server start
- Filters sensitive data
- Integrates with error handler
- Falls back gracefully if DSN not configured

**Just set the environment variable**:
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
```

The code will automatically pick it up on next server restart.

### Step 7: Add Error Boundaries (Frontend)

```typescript
// src/components/ErrorBoundary.tsx
import * as Sentry from "@sentry/react-native";
import React from "react";
import { View, Text, Button } from "react-native";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log locally
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
          <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ marginBottom: 20, textAlign: "center" }}>
            {this.state.error?.message || "An unexpected error occurred"}
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
```

### Step 8: Wrap App with Error Boundary

```typescript
// App.tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* ... rest of app */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### Step 9: Add Sentry Logging to Backend

```typescript
// backend/src/lib/logger.ts
import * as Sentry from "@sentry/node";

// Update error logging to send to Sentry
error(message: string, error?: Error | unknown, context?: LogContext): void {
  if (this.shouldLog("error")) {
    const errorContext = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error: String(error) };
    console.error(this.formatMessage("error", message, errorContext));

    // Send to Sentry
    if (error instanceof Error) {
      Sentry.captureException(error, {
        tags: context,
        extra: { message, ...context },
      });
    } else {
      Sentry.captureMessage(message, {
        level: "error",
        tags: context,
        extra: { error, ...context },
      });
    }
  }
}
```

### Step 10: Test Sentry Integration

#### Frontend

```typescript
// Test error tracking
import * as Sentry from "@sentry/react-native";

// Test exception
Sentry.captureException(new Error("Test error from frontend"));

// Test message
Sentry.captureMessage("Test message from frontend", "info");
```

#### Backend

```typescript
// Test error tracking
import * as Sentry from "@sentry/node";

// Test exception
Sentry.captureException(new Error("Test error from backend"));

// Test message
Sentry.captureMessage("Test message from backend", "info");
```

## Configuration Options

### Frontend Configuration

```typescript
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
  enableAutoSessionTracking: true,
  tracesSampleRate: __DEV__ ? 1.0 : 0.1,
  release: "1.0.0", // App version
  dist: "1", // Build number
  enableNative: true, // Enable native crash reporting
  enableNativeCrashHandling: true,
  enableAutoNativeNagger: false,
  beforeSend(event, hint) {
    // Filter sensitive data
    return event;
  },
});
```

### Backend Configuration

```typescript
Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.SENTRY_ENVIRONMENT || "development",
  tracesSampleRate: env.NODE_ENV === "production" ? 0.1 : 1.0,
  release: "1.0.0", // App version
  dist: "1", // Build number
  beforeSend(event, hint) {
    // Filter sensitive data
    return event;
  },
});
```

## Best Practices

### 1. Filter Sensitive Data

Always filter out sensitive data before sending to Sentry:

```typescript
beforeSend(event, hint) {
  // Remove sensitive headers
  if (event.request?.headers) {
    delete event.request.headers.Authorization;
    delete event.request.headers.Cookie;
  }

  // Remove sensitive request data
  if (event.request?.data) {
    // Remove passwords, tokens, etc.
    if (typeof event.request.data === "object") {
      delete event.request.data.password;
      delete event.request.data.token;
    }
  }

  return event;
}
```

### 2. Set User Context

Add user information to errors:

```typescript
// Frontend
import * as Sentry from "@sentry/react-native";

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

// Backend
import * as Sentry from "@sentry/node";

Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});
```

### 3. Add Custom Tags

Add tags to categorize errors:

```typescript
Sentry.setTag("feature", "session-generation");
Sentry.setTag("user_tier", "pro");
```

### 4. Add Breadcrumbs

Add breadcrumbs to track user actions:

```typescript
Sentry.addBreadcrumb({
  category: "navigation",
  message: "User navigated to PlaybackScreen",
  level: "info",
});
```

## Verification Checklist

- [ ] Sentry account created
- [ ] Sentry project created (frontend and backend)
- [ ] DSN obtained from Sentry
- [ ] Environment variables configured
- [ ] Sentry initialized in frontend
- [ ] Sentry initialized in backend
- [ ] Error boundary added to frontend
- [ ] Error logging integrated with Sentry
- [ ] Test errors sent to Sentry
- [ ] Sensitive data filtered
- [ ] User context set
- [ ] Custom tags added
- [ ] Breadcrumbs added

## Next Steps

After Sentry setup:
1. Monitor errors in Sentry dashboard
2. Set up alerts for critical errors
3. Add more context to errors
4. Track error trends over time
5. Set up release tracking

## Resources

- [Sentry React Native Documentation](https://docs.sentry.io/platforms/react-native/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Sentry Best Practices](https://docs.sentry.io/platforms/javascript/guides/react-native/best-practices/)

---

**Status**: Ready to implement  
**Next Step**: Install Sentry packages and configure environment variables
