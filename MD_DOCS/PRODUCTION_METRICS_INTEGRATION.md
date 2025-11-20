# Production Metrics Integration Guide

**Last Updated**: 2025-01-XX  
**Status**: Ready for Production

## Overview

This guide provides instructions for integrating production metrics services (Prometheus, DataDog, CloudWatch) with the Recenter backend.

## Built-in Metrics

The application includes a built-in metrics collection system that tracks:
- API requests (count, duration, status codes)
- API errors (count by error code)
- Database operations (count, duration by table)
- Database errors (count by operation and table)
- Cache operations (hit/miss/set/delete counts)
- TTS generation (count, duration by voice type)
- Session creation (count, duration by goal)
- Rate limiting (hit counts)

## Prometheus Integration

### Setup

Prometheus integration is built-in and requires no additional configuration. Metrics are exported in Prometheus format at `/api/metrics/prometheus`.

### Configuration

No configuration needed. The endpoint is available at:
```
GET /api/metrics/prometheus
```

### Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'affirmbeats'
    scrape_interval: 15s
    static_configs:
      - targets: ['your-backend-url.com:3000']
    metrics_path: '/api/metrics/prometheus'
```

### Example Output

```
# HELP api_request_count api_request_count
# TYPE api_request_count counter
api_request_count{method="GET",path="/api/sessions",status="200"} 100 1234567890
api_request_count{method="POST",path="/api/sessions",status="200"} 50 1234567890
```

### Grafana Dashboard

Create a Grafana dashboard using Prometheus data source:
- Request rate
- Error rate
- Response time
- Database performance
- Cache performance
- TTS performance

## DataDog Integration

### Setup

#### Step 1: Create DataDog Account

1. Go to [datadoghq.com](https://datadoghq.com)
2. Create account (free tier available)
3. Get API key from Organization Settings → API Keys
4. Get App key from Organization Settings → Application Keys

#### Step 2: Configure Environment Variables

```bash
DATADOG_API_KEY=your-datadog-api-key
DATADOG_APP_KEY=your-datadog-app-key
DATADOG_SITE=datadoghq.com  # Optional, defaults to datadoghq.com
```

#### Step 3: Verify Integration

The DataDog integration is automatically initialized when `DATADOG_API_KEY` is set. Metrics are flushed to DataDog every minute.

### Configuration Options

```typescript
// backend/src/lib/metrics/datadog.ts
DATADOG_API_KEY=your-api-key          // Required
DATADOG_APP_KEY=your-app-key          // Optional
DATADOG_SITE=datadoghq.com            // Optional, defaults to datadoghq.com
```

### Metrics Format

Metrics are sent to DataDog in the following format:
- Metric names use underscores (e.g., `api_request_count`)
- Tags are included for filtering
- Metrics are batched and sent every minute
- Counter metrics use type "count"
- Duration metrics use type "gauge"

### DataDog Dashboard

Create a DataDog dashboard with:
- Request rate
- Error rate
- Response time
- Database performance
- Cache performance
- TTS performance

## AWS CloudWatch Integration

### Setup

#### Step 1: Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create account
3. Create IAM user with CloudWatch permissions
4. Get access key and secret access key

#### Step 2: Configure Environment Variables

```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
CLOUDWATCH_NAMESPACE=Recenter  # Optional, defaults to Recenter
```

#### Step 3: Install AWS SDK

```bash
cd backend
bun add aws-sdk
```

#### Step 4: Verify Integration

The CloudWatch integration is automatically initialized when AWS credentials are set. Metrics are flushed to CloudWatch every minute.

### Configuration Options

```typescript
// backend/src/lib/metrics/cloudwatch.ts
AWS_REGION=us-east-1                    // Optional, defaults to us-east-1
AWS_ACCESS_KEY_ID=your-access-key-id    // Required
AWS_SECRET_ACCESS_KEY=your-secret-key   // Required
CLOUDWATCH_NAMESPACE=Recenter        // Optional, defaults to Recenter
```

### Metrics Format

Metrics are sent to CloudWatch in the following format:
- Metric names use underscores (e.g., `api_request_count`)
- Dimensions are created from metric tags
- Metrics are batched (20 per request)
- Counter metrics use unit "Count"
- Duration metrics use unit "Milliseconds"

### CloudWatch Dashboard

Create a CloudWatch dashboard with:
- Request rate
- Error rate
- Response time
- Database performance
- Cache performance
- TTS performance

### CloudWatch Alarms

Set up alarms for:
- High error rate (> 1%)
- Slow requests (> 1 second)
- Database errors
- High rate limit hits

## Choosing a Metrics Service

### Prometheus (Recommended for Self-Hosted)

**Pros:**
- Open source and free
- Highly customizable
- Great for self-hosted deployments
- Excellent Grafana integration

**Cons:**
- Requires self-hosting
- More setup required
- No managed service

**Best for:** Self-hosted deployments, Kubernetes, Docker

### DataDog (Recommended for Managed)

**Pros:**
- Fully managed service
- Easy setup
- Great UI and dashboards
- Alerting built-in

**Cons:**
- Paid service (free tier available)
- Less customizable than Prometheus

**Best for:** Managed deployments, teams needing quick setup

### CloudWatch (Recommended for AWS)

**Pros:**
- Native AWS integration
- Good for AWS deployments
- Integrated with other AWS services

**Cons:**
- AWS-specific
- Less flexible than Prometheus
- Can be expensive at scale

**Best for:** AWS deployments, teams already using AWS

## Comparison

| Feature | Prometheus | DataDog | CloudWatch |
|---------|-----------|---------|------------|
| Cost | Free | Paid (free tier) | Paid |
| Setup | Medium | Easy | Easy |
| Customization | High | Medium | Low |
| AWS Integration | No | No | Yes |
| Self-Hosted | Yes | No | No |
| Alerting | Yes (via Alertmanager) | Yes | Yes |
| Dashboards | Grafana | Built-in | Built-in |

## Best Practices

### 1. Choose One Service

Don't use multiple metrics services simultaneously. Choose one based on your deployment:
- Self-hosted: Prometheus
- Managed: DataDog
- AWS: CloudWatch

### 2. Set Up Alerts

Configure alerts for:
- High error rate (> 1%)
- Slow requests (> 1 second)
- Database errors
- High rate limit hits

### 3. Monitor Key Metrics

Focus on metrics that impact user experience:
- Request rate
- Error rate
- Response time
- Database performance
- Cache performance

### 4. Regular Review

Review metrics regularly to:
- Identify trends
- Optimize performance
- Plan for capacity
- Debug issues

### 5. Cost Management

- Use sampling for high-volume metrics
- Set up metric retention policies
- Monitor metric costs
- Clean up unused metrics

## Troubleshooting

### Prometheus Not Scraping

```bash
# Check endpoint is accessible
curl https://your-backend-url.com/api/metrics/prometheus

# Check Prometheus configuration
# Verify target is correct
# Check firewall settings
```

### DataDog Not Receiving Metrics

```bash
# Check API key is correct
# Verify DATADOG_API_KEY is set
# Check DataDog logs
# Verify network connectivity
```

### CloudWatch Not Receiving Metrics

```bash
# Check AWS credentials
# Verify AWS_REGION is correct
# Check IAM permissions
# Verify network connectivity
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [DataDog Documentation](https://docs.datadoghq.com/)
- [AWS CloudWatch Documentation](https://docs.aws.amazon.com/cloudwatch/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Next Steps**: Choose a metrics service and configure environment variables

