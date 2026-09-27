# SEO Management System

This document explains how to set up and use the comprehensive SEO management system for VectorAfriq.

## Features

### 🔍 **SEO Configuration Management**
- **Global SEO Settings**: Site name, URL, default meta tags
- **Meta Tag Templates**: Default title, description, and keywords
- **Feature Toggles**: Enable/disable sitemap, structured data, canonical URLs
- **Social Media Integration**: Open Graph and Twitter Card configuration
- **Search Engine Verification**: Google and Bing verification codes

### 📄 **Page-Specific Meta Tags**
- **Custom Meta Tags**: Title, description, keywords for each page
- **Open Graph Tags**: Social media sharing optimization
- **Twitter Cards**: Enhanced Twitter sharing
- **Canonical URLs**: Prevent duplicate content issues
- **Robots Directives**: Control indexing and following
- **Structured Data**: JSON-LD schema markup

### 🗺️ **Sitemap Management**
- **Automatic Generation**: XML sitemap with static and dynamic URLs
- **Property Integration**: Automatic inclusion of active properties
- **Priority Settings**: Configure URL priorities and change frequencies
- **Real-time Updates**: Sitemap updates when content changes
- **Download & Export**: Generate and download sitemap files

### 🤖 **Robots.txt Management**
- **Custom Configuration**: Full control over robots.txt content
- **Admin Protection**: Automatic blocking of admin and API routes
- **Sitemap Reference**: Automatic sitemap URL inclusion
- **Live Preview**: View current robots.txt configuration

### 📊 **SEO Health Monitoring**
- **SEO Score**: Overall SEO health percentage
- **Configuration Checks**: Verify essential SEO settings
- **Quick Stats**: Page count, sitemap status, structured data status
- **Recommendations**: Actionable SEO improvement suggestions

## Installation & Setup

### 1. Database Setup

Initialize the SEO database tables:

```bash
npm run init-seo
```

This creates the following tables:
- `seo_config` - Global SEO configuration
- `page_meta` - Page-specific meta tags
- `seo_redirect` - URL redirects management
- `seo_audit` - SEO audit logs
- `sitemap_url` - Sitemap URL management

### 2. Basic Configuration

1. **Navigate to Admin → SEO Management**
2. **Configure Basic Settings**:
   - Site Name: Your website name
   - Site URL: Primary website URL
   - Default Title: Template for page titles
   - Default Description: Fallback meta description
   - Default Keywords: Base keywords for all pages

3. **Enable Features**:
   - ✅ Sitemap Generation
   - ✅ Structured Data (JSON-LD)
   - ✅ Automatic Meta Tag Generation
   - ✅ Canonical URLs

### 3. Social Media Setup

Configure social media integration:
- **Open Graph Image**: Default sharing image
- **Twitter Handle**: Your Twitter account
- **Facebook App ID**: For Facebook integration

## Admin Panel Usage

### Overview Tab

The overview provides an SEO health dashboard:

- **SEO Health Score**: Percentage based on configuration completeness
- **Configuration Checks**: 
  - ✅ Site Name configured
  - ✅ Default title set
  - ✅ Default description set
  - ✅ Sitemap enabled
  - ✅ Structured data enabled
  - ✅ Robots.txt configured

- **Quick Statistics**:
  - Pages with meta tags
  - Sitemap status
  - Structured data status

### Configuration Tab

Global SEO settings management:

#### **Basic Settings**
- Site Name and URL configuration
- Default meta tag templates
- Social media handles

#### **Feature Settings**
- Toggle sitemap generation
- Enable/disable structured data
- Control automatic meta generation
- Manage canonical URL generation

### Page Meta Tags Tab

Manage page-specific SEO:

- **View All Pages**: List of pages with meta tags
- **Add New Page**: Create meta tags for new pages
- **Edit Existing**: Modify meta tags for existing pages
- **Bulk Operations**: Manage multiple pages at once

#### **Page Meta Fields**
- **Basic Meta**: Title, description, keywords
- **Open Graph**: Social media sharing tags
- **Twitter Cards**: Twitter-specific meta tags
- **Technical**: Canonical URL, robots directives
- **Structured Data**: JSON-LD schema markup

### Sitemap Tab

XML sitemap management:

- **View Statistics**: Static pages, property pages, generation status
- **Generate Sitemap**: Create and download XML sitemap
- **URL Management**: View and manage sitemap URLs
- **Priority Settings**: Configure URL priorities and change frequencies

### Robots.txt Tab

Robots.txt file management:

- **Edit Content**: Full control over robots.txt content
- **Live Preview**: View current robots.txt
- **Default Template**: Reset to recommended settings

## API Endpoints

### Configuration Management
- `GET /api/admin/seo/config` - Fetch SEO configuration
- `POST /api/admin/seo/config` - Update SEO configuration
- `DELETE /api/admin/seo/config` - Reset to defaults

### Page Meta Management
- `GET /api/admin/seo/pages` - Fetch page meta tags
- `POST /api/admin/seo/pages` - Create/update page meta
- `DELETE /api/admin/seo/pages` - Delete page meta

### Sitemap Management
- `GET /api/admin/seo/sitemap` - Generate sitemap
- `POST /api/admin/seo/sitemap` - Update sitemap settings

### Robots.txt Management
- `GET /api/admin/seo/robots` - Get robots.txt content
- `POST /api/admin/seo/robots` - Update robots.txt

### Public Endpoints
- `GET /sitemap.xml` - Public XML sitemap
- `GET /robots.txt` - Public robots.txt file

## Dynamic SEO Component

The `DynamicSEO` component automatically manages meta tags:

```tsx
import DynamicSEO from '@/components/seo/DynamicSEO';

export default function PropertyPage({ property }) {
  return (
    <>
      <DynamicSEO
        title={`${property.title} | VectorAfriq`}
        description={property.description}
        ogImage={property.images[0]}
        structuredData={generatePropertyStructuredData(property)}
      />
      {/* Page content */}
    </>
  );
}
```

### Features:
- **Automatic Fallbacks**: Uses page-specific → default → hardcoded values
- **Social Media Tags**: Automatic Open Graph and Twitter Cards
- **Structured Data**: JSON-LD schema markup injection
- **Canonical URLs**: Automatic canonical URL generation

## Structured Data

### Property Schema
Automatic JSON-LD generation for properties:
- RealEstateListing schema
- Price and availability information
- Geographic coordinates
- Property details (rooms, size, etc.)

### Organization Schema
Site-wide organization markup:
- Company information
- Contact details
- Social media profiles

## Best Practices

### 1. Title Optimization
- Keep titles under 60 characters
- Include primary keywords
- Use consistent branding
- Make titles unique per page

### 2. Meta Descriptions
- Keep under 160 characters
- Include call-to-action
- Summarize page content
- Use unique descriptions

### 3. Sitemap Management
- Update sitemap regularly
- Set appropriate priorities
- Use correct change frequencies
- Include all important pages

### 4. Robots.txt Guidelines
- Block admin and private areas
- Allow important content
- Include sitemap reference
- Test with Google Search Console

## Monitoring & Maintenance

### Regular Tasks
1. **Weekly**: Review SEO health score
2. **Monthly**: Update meta descriptions for new content
3. **Quarterly**: Audit and update structured data
4. **As needed**: Update robots.txt for new sections

### Performance Monitoring
- Monitor search console for crawl errors
- Check sitemap submission status
- Review structured data validity
- Track organic search performance

## Troubleshooting

### Common Issues

1. **Sitemap not generating**:
   - Check if sitemap generation is enabled
   - Verify database connectivity
   - Check for SQL errors in logs

2. **Meta tags not appearing**:
   - Verify page meta configuration
   - Check DynamicSEO component integration
   - Ensure default fallbacks are set

3. **Robots.txt not accessible**:
   - Check route configuration
   - Verify database connection
   - Test with direct URL access

### Debug Mode

Enable SEO debugging in development:
```javascript
// Add to browser console
localStorage.setItem('seo_debug', 'true');
```

## Security Considerations

- All admin endpoints require ADMIN role
- Input validation on all meta tag fields
- XSS protection for user-generated content
- Rate limiting on public endpoints

## Future Enhancements

Planned features:
- **SEO Audit Tool**: Automated SEO analysis
- **Competitor Analysis**: Compare with competitor sites
- **Performance Tracking**: Built-in SEO metrics
- **A/B Testing**: Test different meta tag variations
- **Bulk Import/Export**: CSV import for meta tags
- **SEO Recommendations**: AI-powered suggestions
