#!/usr/bin/env node

/**
 * Test script to verify SEO improvements for dynamic location pages
 * Run with: node src/scripts/test-seo-improvements.js
 */

import https from 'https';
import http from 'http';

const SITE_URL = 'https://vectorafriqproperties.co.ke';
const TEST_LOCATIONS = ['nairobi', 'mombasa', 'nyali'];
const TEST_TYPES = ['for-rent', 'for-sale', 'airbnb'];

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function testPage(url, description) {
  try {
    console.log(`\n🔍 Testing: ${description}`);
    console.log(`   URL: ${url}`);
    
    const response = await makeRequest(url);
    
    console.log(`   Status: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      // Check for SEO elements
      const hasTitle = response.data.includes('<title>');
      const hasMetaDescription = response.data.includes('name="description"');
      const hasStructuredData = response.data.includes('application/ld+json');
      const hasCanonical = response.data.includes('rel="canonical"');
      
      console.log(`   ✅ Title: ${hasTitle ? 'Present' : 'Missing'}`);
      console.log(`   ✅ Meta Description: ${hasMetaDescription ? 'Present' : 'Missing'}`);
      console.log(`   ✅ Structured Data: ${hasStructuredData ? 'Present' : 'Missing'}`);
      console.log(`   ✅ Canonical URL: ${hasCanonical ? 'Present' : 'Missing'}`);
      
      // Show actual title if present
      if (hasTitle) {
        const titleMatch = response.data.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          console.log(`   📝 Title: "${titleMatch[1]}"`);
        }
      }
      
      // Show actual meta description if present
      if (hasMetaDescription) {
        const descMatch = response.data.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/);
        if (descMatch) {
          console.log(`   📝 Description: "${descMatch[1].substring(0, 100)}..."`);
        }
      }
      
      return {
        success: true,
        seoElements: { hasTitle, hasMetaDescription, hasStructuredData, hasCanonical }
      };
    } else {
      console.log(`   ❌ Failed with status: ${response.statusCode}`);
      return { success: false, statusCode: response.statusCode };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSitemap() {
  console.log('\n🗺️  Testing Sitemap...');
  
  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const response = await makeRequest(sitemapUrl);
  
  if (response.statusCode === 200) {
    console.log('   ✅ Sitemap accessible');
    
    // Check for location URLs in sitemap
    const hasLocationUrls = TEST_LOCATIONS.some(location => 
      TEST_TYPES.some(type => 
        response.data.includes(`/${type}/${location}`)
      )
    );
    
    console.log(`   ✅ Location URLs in sitemap: ${hasLocationUrls ? 'Present' : 'Missing'}`);
    
    // Show sample URLs if present
    if (hasLocationUrls) {
      const urlMatches = response.data.match(/<loc>([^<]*\/[^<]*\/[^<]*)<\/loc>/g);
      if (urlMatches) {
        console.log('   📝 Sample URLs:');
        urlMatches.slice(0, 5).forEach(match => {
          const url = match.replace(/<loc>|<\/loc>/g, '');
          console.log(`      - ${url}`);
        });
      }
    }
    
    return { success: true, hasLocationUrls };
  } else {
    console.log(`   ❌ Sitemap failed: ${response.statusCode}`);
    return { success: false };
  }
}

async function testRobotsTxt() {
  console.log('\n🤖 Testing Robots.txt...');
  
  const robotsUrl = `${SITE_URL}/robots.txt`;
  const response = await makeRequest(robotsUrl);
  
  if (response.statusCode === 200) {
    console.log('   ✅ Robots.txt accessible');
    
    const allowsCrawling = response.data.includes('Allow: /');
    const hasSitemap = response.data.includes('Sitemap:');
    
    console.log(`   ✅ Allows crawling: ${allowsCrawling ? 'Yes' : 'No'}`);
    console.log(`   ✅ References sitemap: ${hasSitemap ? 'Yes' : 'No'}`);
    
    // Show robots.txt content
    console.log('   📝 Robots.txt content:');
    console.log(response.data);
    
    return { success: true, allowsCrawling, hasSitemap };
  } else {
    console.log(`   ❌ Robots.txt failed: ${response.statusCode}`);
    return { success: false };
  }
}

async function runTests() {
  console.log('🚀 Starting SEO Improvement Tests...\n');
  console.log(`🌐 Testing against: ${SITE_URL}\n`);
  
  const results = {
    pages: [],
    sitemap: null,
    robots: null
  };
  
  // Test individual pages
  for (const location of TEST_LOCATIONS) {
    for (const type of TEST_TYPES) {
      const url = `${SITE_URL}/${type}/${location}`;
      const description = `${type} properties in ${location}`;
      
      const result = await testPage(url, description);
      results.pages.push({ url, description, ...result });
    }
  }
  
  // Test sitemap
  results.sitemap = await testSitemap();
  
  // Test robots.txt
  results.robots = await testRobotsTxt();
  
  // Summary
  console.log('\n📊 Test Summary:');
  console.log('================');
  
  const successfulPages = results.pages.filter(p => p.success);
  const pagesWithAllSEO = results.pages.filter(p => 
    p.success && p.seoElements && 
    p.seoElements.hasTitle && 
    p.seoElements.hasMetaDescription && 
    p.seoElements.hasStructuredData && 
    p.seoElements.hasCanonical
  );
  
  console.log(`Pages tested: ${results.pages.length}`);
  console.log(`Successful pages: ${successfulPages.length}`);
  console.log(`Pages with all SEO elements: ${pagesWithAllSEO.length}`);
  console.log(`Sitemap working: ${results.sitemap?.success ? 'Yes' : 'No'}`);
  console.log(`Robots.txt working: ${results.robots?.success ? 'Yes' : 'No'}`);
  
  if (pagesWithAllSEO.length === results.pages.length && results.sitemap?.success && results.robots?.success) {
    console.log('\n🎉 All tests passed! Your SEO improvements are working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Monitor Google Search Console for indexing');
    console.log('2. Track organic traffic improvements');
    console.log('3. Monitor search rankings');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the issues above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify the deployment was successful');
    console.log('2. Check server logs for errors');
    console.log('3. Ensure database connectivity');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
