# Dashboard Testing Guide

## Current Issues with Percentages

The dashboard is showing incorrect percentages like:
- ↑ 0% for Total Users
- ↓ 100% for Active Listings
- ↑ 0% for Total Messages
- ↑ 0% for Total Leads

## What I've Fixed

1. **Improved percentage calculation logic** in the API
2. **Better error handling** in the dashboard
3. **Added debug information** (visible in development mode)
4. **Enhanced UI** with loading states and better trend display

## Testing Steps

### 1. Check if you're logged in as an admin user

The dashboard requires admin authentication. From the database, these admin users exist:
- `vectorafriqproperties1847@gmail.com`
- `kevinlangat1998@gmail.com` 
- `manlikemaingi@gmail.com`

### 2. Access the dashboard

Navigate to `/admin/dashboard` and check:
- Are you getting an "Unauthorized" error?
- Is the data loading?
- Check the browser console for any errors
- Look at the debug section (only visible in development)

### 3. Check the API directly

You can test the API endpoint directly:
```bash
# Make sure you're logged in as an admin first, then:
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Content-Type: application/json" \
  -b "your-session-cookie"
```

### 4. Create test data (if needed)

If you need more test data to see proper percentages:

```sql
-- Add some users from last month
INSERT INTO user (id, name, email, role, createdAt, updatedAt) VALUES 
('test1', 'Test User 1', 'test1@example.com', 'USER', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_SUB(NOW(), INTERVAL 1 MONTH)),
('test2', 'Test User 2', 'test2@example.com', 'USER', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_SUB(NOW(), INTERVAL 1 MONTH));

-- Add some properties from last month
INSERT INTO property (id, title, description, price, status, userId, createdAt, updatedAt) VALUES 
('prop1', 'Test Property 1', 'Test description', 100000, 'AVAILABLE', 'test1', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_SUB(NOW(), INTERVAL 1 MONTH)),
('prop2', 'Test Property 2', 'Test description', 200000, 'AVAILABLE', 'test2', DATE_SUB(NOW(), INTERVAL 1 MONTH), DATE_SUB(NOW(), INTERVAL 1 MONTH));
```

## Expected Behavior

After the fixes, you should see:
- Proper percentage calculations (not just 0% or 100%)
- "No change" displayed when percentage is 0
- Correct trend arrows (↑ for positive, ↓ for negative, — for no change)
- Subtitles showing "X new this month" for each stat
- Debug information in development mode

## Troubleshooting

1. **401 Unauthorized**: Make sure you're logged in as an admin user
2. **500 Server Error**: Check database connection and table structure
3. **Incorrect percentages**: Check if you have data from both this month and last month
4. **No data**: Verify your database has the required tables and some sample data

## Next Steps

Once the dashboard is working properly, we can:
1. Add more detailed analytics
2. Create charts and graphs
3. Add real-time updates
4. Implement filtering and date range selection
