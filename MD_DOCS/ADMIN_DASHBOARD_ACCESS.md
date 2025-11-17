# How to Access Admin Dashboard

## Web UI (Recommended)

Open in your browser:
```
http://localhost:3000/admin
```

The dashboard UI includes:
- Real-time stats with auto-refresh (every 5 minutes)
- Visual charts and progress bars
- Color-coded alerts
- Export buttons for CSV downloads
- Responsive design

## API Access

For programmatic access, use the API endpoints:

```bash
# Get dashboard data
curl http://localhost:3000/api/admin/dashboard

# Or in your browser
http://localhost:3000/api/admin/dashboard
```

## Using curl

```bash
# Get dashboard data
curl http://localhost:3000/api/admin/dashboard | jq

# Pretty print JSON
curl -s http://localhost:3000/api/admin/dashboard | python -m json.tool
```

## Using Postman/Insomnia

1. Create a GET request to: `http://localhost:3000/api/admin/dashboard`
2. Add headers if authentication is enabled
3. View the JSON response

## Export Data

Export analytics as CSV:

```bash
# Export sessions
curl http://localhost:3000/api/admin/export?type=sessions > sessions.csv

# Export costs
curl http://localhost:3000/api/admin/export?type=costs > costs.csv

# Export users
curl http://localhost:3000/api/admin/export?type=users > users.csv
```

## Troubleshooting

### API returns 404
- Check that the backend is running (`cd backend && bun run dev`)
- Verify the endpoint path: `/api/admin/dashboard`
- Check backend logs for route registration

### No data showing
- Check if you have any sessions generated
- Verify database connection
- Check backend logs for errors
- Ensure `GenerationLog` table has data

### Authentication required
- If you've added auth middleware, include authentication headers
- Check `backend/src/routes/admin.ts` for auth requirements

---

**Quick Tip**: Make API calls periodically to get updated data. Consider setting up a monitoring script or cron job.

