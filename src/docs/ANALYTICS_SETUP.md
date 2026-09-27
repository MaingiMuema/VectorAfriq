# Google Analytics & Visitor Tracking Setup

This document explains how to set up and configure the Google Analytics and visitor tracking system for VectorAfriq.

## Features

### 🔍 Visitor Tracking
- **Real-time visitor monitoring** with session tracking
- **Page view analytics** with time on page and scroll depth
- **Device and browser detection** for user behavior insights
- **Geographic tracking** with country and city detection
- **Property view tracking** for specific property pages
- **Bounce rate calculation** and session duration metrics

### 📊 Google Analytics Integration
- **GA4 (Google Analytics 4)** support with measurement ID configuration
- **Automatic page view tracking** for all site pages
- **Custom event tracking** for property views and user interactions
- **Privacy-compliant tracking** with IP anonymization options

### ⚙️ Admin Configuration
- **Easy setup interface** in the admin panel
- **Toggle tracking features** on/off as needed
- **Data retention settings** with configurable periods
- **Real-time analytics dashboard** with visitor statistics

## Installation & Setup

### 1. Database Setup

First, initialize the analytics database tables:

```bash
npm run init-analytics
```

This will create the following tables:
- `analytics_config` - Configuration settings
- `site_visitor` - Visitor session data
- `page_view` - Individual page view records
- `property_view` - Property-specific view tracking

### 2. Environment Variables

Add the following to your `.env` file:

```env
# Analytics Configuration
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### 3. Google Analytics Setup

1. **Create a Google Analytics 4 property**:
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property
   - Set up a web data stream
   - Copy the Measurement ID (format: G-XXXXXXXXXX)

2. **Configure in Admin Panel**:
   - Navigate to Admin → Google Analytics
   - Enter your Measurement ID
   - Enable Google Analytics tracking
   - Save configuration

## Admin Panel Usage

### Analytics Overview Tab

The overview tab provides comprehensive visitor statistics:

- **Visitor Metrics**: Total visitors, unique visitors, page views
- **Session Analytics**: Average session duration, bounce rate
- **Top Pages**: Most visited pages with view percentages
- **Geographic Data**: Visitor distribution by country
- **Device Analytics**: Mobile vs desktop usage
- **Browser Statistics**: Popular browsers among visitors

### Configuration Tab

Configure tracking settings:

- **Google Analytics**: Enable/disable GA4 tracking and set Measurement ID
- **Visitor Tracking**: Toggle internal visitor tracking system
- **Property Views**: Enable tracking for property page visits
- **Privacy Settings**: IP anonymization and data retention periods

## API Endpoints

### Configuration Management
- `GET /api/admin/analytics/config` - Fetch current configuration
- `POST /api/admin/analytics/config` - Update configuration settings
- `DELETE /api/admin/analytics/config` - Reset to default settings

### Visitor Statistics
- `GET /api/admin/analytics/visitors?days=30` - Get visitor stats for specified period

### Frontend Tracking
- `GET /api/analytics/track` - Get tracking configuration for frontend
- `POST /api/analytics/track` - Submit visitor tracking data

## Privacy & Compliance

### Data Protection
- **IP Anonymization**: Optional IP address anonymization for privacy
- **Session-based Tracking**: No personal data stored without consent
- **Configurable Retention**: Set data retention periods (30-1095 days)
- **GDPR Compliance**: Built with privacy regulations in mind

### Data Collected
- Page URLs and titles
- Session duration and scroll depth
- Device type, browser, and operating system
- Geographic location (country/city level)
- Referrer information
- Property view duration (for property pages)

## Technical Implementation

### Frontend Tracking
The `VisitorTracker` component automatically:
- Generates unique session IDs
- Tracks page views and navigation
- Monitors scroll depth and time on page
- Handles page exit events
- Sends data to tracking API

### Backend Processing
The tracking API:
- Validates tracking configuration
- Processes visitor data
- Stores analytics in database
- Handles property-specific tracking
- Provides aggregated statistics

### Performance Considerations
- **Asynchronous tracking**: Non-blocking visitor data collection
- **Batched requests**: Efficient data transmission
- **Minimal overhead**: Lightweight tracking implementation
- **Error handling**: Graceful degradation if tracking fails

## Troubleshooting

### Common Issues

1. **Tracking not working**:
   - Check if visitor tracking is enabled in admin panel
   - Verify database tables were created successfully
   - Check browser console for JavaScript errors

2. **Google Analytics not loading**:
   - Verify Measurement ID format (G-XXXXXXXXXX)
   - Ensure Google Analytics is enabled in configuration
   - Check for ad blockers or privacy extensions

3. **No data in dashboard**:
   - Wait a few minutes for data to populate
   - Check if tracking is enabled for the current environment
   - Verify API endpoints are accessible

### Debug Mode

Enable debug logging by adding to your browser console:
```javascript
localStorage.setItem('analytics_debug', 'true');
```

## Security Notes

- All admin endpoints require ADMIN role authentication
- Visitor tracking respects user privacy settings
- IP addresses can be anonymized for compliance
- No sensitive user data is collected without consent
- Data retention policies are configurable and enforced

## Future Enhancements

Planned features for future releases:
- **Real-time dashboard** with live visitor counts
- **Advanced filtering** by date ranges and segments
- **Export functionality** for analytics data
- **Custom event tracking** for specific user actions
- **A/B testing integration** for conversion optimization
- **Email reports** with scheduled analytics summaries
