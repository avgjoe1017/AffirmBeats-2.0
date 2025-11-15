# Monitoring and Metrics Guide

**Last Updated**: 2025-01-XX  
**Status**: ✅ Complete

## Overview

This guide provides information about the monitoring and metrics capabilities in the AffirmBeats backend.

## Metrics Collection

### Built-in Metrics

The application includes a built-in metrics collection system that tracks:

- **API Requests**: Request count, duration, status codes
- **API Errors**: Error count by error code
- **Database Operations**: Operation count, duration by table
- **Database Errors**: Error count by operation and table
- **Cache Operations**: Hit/miss/set/delete counts
- **TTS Generation**: Generation count, duration by voice type
- **Session Creation**: Creation count, duration by goal
- **Rate Limiting**: Rate limit hit counts

### Metrics API

#### GET /api/metrics
Get all metrics (for monitoring/debugging)

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

## Health Check

### GET /health
Enhanced health check endpoint with metrics

**Response:**
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

**Status Codes:**
- `200 OK`: All checks passed
- `503 Service Unavailable`: One or more checks failed

## Metrics Middleware

The metrics middleware automatically collects metrics for all API requests:

- Request duration
- Request count
- Error count
- Status codes

## Database Metrics

Database operations are automatically tracked with:

- Operation duration
- Operation count
- Error count
- Table name

## Cache Metrics

Cache operations are tracked with:

- Hit/miss counts
- Set/delete counts
- Cache key (truncated)

## TTS Metrics

TTS generation is tracked with:

- Generation duration
- Generation count
- Voice type

## Session Metrics

Session creation is tracked with:

- Creation duration
- Creation count
- Goal type

## Rate Limiting Metrics

Rate limit hits are tracked with:

- Hit count
- Limit value
- Key (truncated)

## Production Considerations

### Metrics Storage

The built-in metrics collector stores metrics in memory (last 1000 metrics). For production:

1. **Use Prometheus**: Export metrics in Prometheus format
2. **Use DataDog**: Integrate with DataDog for metrics collection
3. **Use CloudWatch**: Integrate with AWS CloudWatch for metrics
4. **Use Custom Service**: Build custom metrics service

### Metrics Retention

- In-memory metrics are limited to 1000 metrics
- Metrics are automatically rotated (FIFO)
- Consider flushing metrics to persistent storage

### Metrics Security

- Protect `/api/metrics` endpoint in production
- Rate limit metrics endpoint
- Consider authentication/authorization
- Don't expose sensitive information in metrics

## Integration with Monitoring Services

### Prometheus

To integrate with Prometheus:

1. Install Prometheus client library
2. Export metrics in Prometheus format
3. Configure Prometheus to scrape metrics endpoint

### DataDog

To integrate with DataDog:

1. Install DataDog agent
2. Configure DataDog to collect metrics
3. Export metrics in DataDog format

### CloudWatch

To integrate with AWS CloudWatch:

1. Install CloudWatch client library
2. Send metrics to CloudWatch
3. Configure CloudWatch alarms

## Alerting

Set up alerts for:

- High error rate (> 1%)
- Slow requests (> 1 second)
- Database errors
- High rate limit hits
- Low cache hit rate
- TTS generation failures

## Dashboard

Create dashboards for:

- Request rate
- Error rate
- Response time
- Database performance
- Cache performance
- TTS performance
- Session creation rate

## Best Practices

1. **Monitor Key Metrics**: Focus on metrics that impact user experience
2. **Set Up Alerts**: Configure alerts for critical metrics
3. **Regular Review**: Review metrics regularly to identify trends
4. **Performance Optimization**: Use metrics to identify performance bottlenecks
5. **Capacity Planning**: Use metrics to plan for capacity increases

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [DataDog Documentation](https://docs.datadoghq.com/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Metrics Best Practices](https://prometheus.io/docs/practices/naming/)

---

**Next Steps**: Integrate with production monitoring service (Prometheus, DataDog, CloudWatch, etc.)
