# Metrics Integration Guide

**Last Updated**: 2025-01-XX  
**Status**: ✅ Complete

## Overview

This guide provides information about the metrics collection infrastructure in the Recenter backend.

## Metrics Collection

### Built-in Metrics System

The application includes a built-in metrics collection system (`backend/src/lib/metrics.ts`) that tracks:

- **API Requests**: Request count, duration, status codes
- **API Errors**: Error count by error code
- **Database Operations**: Operation count, duration by table
- **Database Errors**: Error count by operation and table
- **Cache Operations**: Hit/miss/set/delete counts
- **TTS Generation**: Generation count, duration by voice type
- **Session Creation**: Creation count, duration by goal
- **Rate Limiting**: Rate limit hit counts

### Metrics Storage

- Metrics are stored in memory (last 1000 metrics)
- Metrics are automatically rotated (FIFO)
- Metrics include timestamp, value, and optional tags
- Metrics can be filtered by name and time range

### Metrics API Endpoints

#### GET /api/metrics
Get all metrics

**Response:**
```json
{
  "timestamp": "2025-01-XXT00:00:00.000Z",
  "totalMetrics": 1000,
  "metrics": {
    "api.request.count": [...],
    "api.request.duration": [...],
    ...
  },
  "summary": {
    "api.request.count": {
      "count": 100,
      "sum": 100,
      "avg": 1,
      "min": 1,
      "max": 1
    },
    ...
  }
}
```

#### GET /api/metrics/:name
Get metrics for a specific name

**Query Parameters:**
- `since`: Optional timestamp to filter metrics (milliseconds since epoch)

**Response:**
```json
{
  "name": "api.request.count",
  "metrics": [...],
  "summary": {
    "count": 100,
    "sum": 100,
    "avg": 1,
    "min": 1,
    "max": 1
  }
}
```

#### POST /api/metrics/clear
Clear all metrics (for testing/debugging)

**Note**: In production, this should be protected.

## Metrics Middleware

The metrics middleware (`backend/src/middleware/metricsMiddleware.ts`) automatically collects metrics for all API requests:

- Request duration
- Request count
- Error count
- Status codes

## Integrated Metrics

### API Requests
- Automatically tracked by metrics middleware
- Duration, count, and status codes recorded
- Error metrics for non-2xx responses

### Cache Operations
- Hit/miss counts tracked in `getCached`
- Set counts tracked in `setCache`
- Delete counts tracked in `deleteCache` and `deleteCachePattern`
- Integrated into Redis cache utilities

### TTS Generation
- Generation duration tracked
- Generation count by voice type
- Integrated into TTS routes

### Session Creation
- Creation duration tracked
- Creation count by goal
- Integrated into sessions routes

### Rate Limiting
- Rate limit hit counts tracked
- Integrated into rate limiting middleware

### Database Operations
- Database wrapper available (`backend/src/lib/dbWrapper.ts`)
- Operation duration and count tracking
- Error tracking
- **Note**: Database wrapper is optional and can be used for future database metrics

## Health Check Metrics

The health check endpoint (`/health`) includes a metrics snapshot:

```json
{
  "status": "ok",
  "timestamp": "2025-01-XXT00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "ok",
    "redis": "ok"
  },
  "metrics": {
    "totalRequests": 1000,
    "errorRate": 0.01
  }
}
```

## Usage Examples

### Recording Custom Metrics

```typescript
import { metrics, metricHelpers } from "../lib/metrics";

// Record a counter
metrics.increment("custom.event.count", { userId: "123" });

// Record a timing metric
metrics.timing("custom.operation.duration", 150, { operation: "process" });

// Record a metric with value
metrics.record("custom.metric", 42, { tag: "value" });
```

### Using Metric Helpers

```typescript
import { metricHelpers } from "../lib/metrics";

// Record API request
metricHelpers.apiRequest("POST", "/api/sessions", 200, 150);

// Record API error
metricHelpers.apiError("POST", "/api/sessions", "VALIDATION_ERROR");

// Record database operation
metricHelpers.dbOperation("create", "affirmationSession", 50);

// Record cache operation
metricHelpers.cacheOperation("hit", "preferences:123");

// Record TTS generation
metricHelpers.ttsGeneration(2000, "neutral");

// Record session creation
metricHelpers.sessionCreation("sleep", 1500);

// Record rate limit hit
metricHelpers.rateLimitHit("user:123", 100);
```

### Querying Metrics

```typescript
import { metrics } from "../lib/metrics";

// Get all metrics
const allMetrics = metrics.getAllMetrics();

// Get metrics for a specific name
const apiMetrics = metrics.getMetrics("api.request.count");

// Get metrics since a timestamp
const recentMetrics = metrics.getMetrics("api.request.count", Date.now() - 3600000);

// Get summary statistics
const summary = metrics.getSummary("api.request.count");

// Get metrics grouped by name
const groupedMetrics = metrics.getMetricsByName();
```

## Production Considerations

### Metrics Storage

The built-in metrics collector stores metrics in memory (last 1000 metrics). For production:

1. **Use Prometheus**: Export metrics in Prometheus format
2. **Use DataDog**: Integrate with DataDog for metrics collection
3. **Use CloudWatch**: Integrate with AWS CloudWatch for metrics
4. **Use Custom Service**: Build custom metrics service with persistent storage

### Metrics Retention

- In-memory metrics are limited to 1000 metrics
- Metrics are automatically rotated (FIFO)
- Consider flushing metrics to persistent storage
- Consider using time-series database for metrics storage

### Metrics Security

- Protect `/api/metrics` endpoint in production
- Rate limit metrics endpoint
- Consider authentication/authorization
- Don't expose sensitive information in metrics
- Sanitize metric tags and keys

### Performance Impact

- Metrics collection is lightweight
- Metrics are collected asynchronously
- Metrics don't block request processing
- Metrics are stored in memory for fast access

## Integration with Monitoring Services

### Prometheus

To integrate with Prometheus:

1. Install Prometheus client library
2. Export metrics in Prometheus format
3. Configure Prometheus to scrape metrics endpoint

**Example:**
```typescript
import { Registry, Counter, Histogram } from "prom-client";

const register = new Registry();
const requestCounter = new Counter({
  name: "api_requests_total",
  help: "Total number of API requests",
  registers: [register],
});
```

### DataDog

To integrate with DataDog:

1. Install DataDog agent
2. Configure DataDog to collect metrics
3. Export metrics in DataDog format

**Example:**
```typescript
import { StatsD } from "node-statsd";

const client = new StatsD({
  host: "localhost",
  port: 8125,
});

client.increment("api.requests.count");
client.timing("api.request.duration", 150);
```

### CloudWatch

To integrate with AWS CloudWatch:

1. Install CloudWatch client library
2. Send metrics to CloudWatch
3. Configure CloudWatch alarms

**Example:**
```typescript
import { CloudWatch } from "aws-sdk";

const cloudwatch = new CloudWatch();

await cloudwatch.putMetricData({
  Namespace: "Recenter",
  MetricData: [
    {
      MetricName: "APIRequests",
      Value: 100,
      Unit: "Count",
    },
  ],
}).promise();
```

## Best Practices

1. **Monitor Key Metrics**: Focus on metrics that impact user experience
2. **Set Up Alerts**: Configure alerts for critical metrics
3. **Regular Review**: Review metrics regularly to identify trends
4. **Performance Optimization**: Use metrics to identify performance bottlenecks
5. **Capacity Planning**: Use metrics to plan for capacity increases
6. **Error Tracking**: Track error rates and error types
7. **Cache Performance**: Monitor cache hit rates
8. **Database Performance**: Monitor database operation durations
9. **API Performance**: Monitor API response times
10. **Rate Limiting**: Monitor rate limit hits

## Alerting

Set up alerts for:

- High error rate (> 1%)
- Slow requests (> 1 second)
- Database errors
- High rate limit hits
- Low cache hit rate
- TTS generation failures
- Session creation failures

## Dashboard

Create dashboards for:

- Request rate
- Error rate
- Response time
- Database performance
- Cache performance
- TTS performance
- Session creation rate
- Rate limit hits

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [DataDog Documentation](https://docs.datadoghq.com/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Metrics Best Practices](https://prometheus.io/docs/practices/naming/)

---

**Next Steps**: Integrate with production monitoring service (Prometheus, DataDog, CloudWatch, etc.)
