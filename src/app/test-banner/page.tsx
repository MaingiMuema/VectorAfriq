"use client";

import { useState, useEffect } from 'react';

export default function TestBannerPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBannerAPI = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Testing banner API...');
      
      const response = await fetch('/api/media-content?active=true');
      
      console.log('Response:', {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        setResult(`Error: ${response.status} ${response.statusText}\n${errorText}`);
        return;
      }
      
      const data = await response.json();
      setResult(`Success!\nBanners found: ${data.banners?.length || 0}\n${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.error('Test error:', error);
      setResult(`Fetch Error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testBannerAPI();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Banner API Test</h1>
      
      <button 
        onClick={testBannerAPI}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Banner API'}
      </button>
      
      <pre className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
        {result}
      </pre>
    </div>
  );
}
