import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gstin = searchParams.get('gstin');

    if (!gstin) {
      return NextResponse.json({ error: 'GSTIN is required' }, { status: 400 });
    }

    const apiKey = process.env.RAPIDAPI_KEY || process.env.GST_API_KEY || process.env.MASTERS_INDIA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'GST API Key is not configured' }, { status: 500 });
    }

    let apiUrl = '';
    let headers = {};
    let fetchOptions = { method: 'GET' };

    // Check if it's a RapidAPI key (usually ends with or contains specific patterns like 'msh' or 'ejsn')
    if (apiKey.includes('msh') || process.env.RAPIDAPI_HOST) {
      const rapidApiHost = process.env.RAPIDAPI_HOST || 'gst-insights-api.p.rapidapi.com'; 
      
      // Build the correct endpoint based on the API host
      if (rapidApiHost.includes('powerful-gstin-tool')) {
        apiUrl = `https://${rapidApiHost}/v1/gstin/${gstin}`;
      } else {
        apiUrl = `https://${rapidApiHost}/getGSTDetailsUsingGST/${gstin}`;
      }
      
      headers = {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': rapidApiHost,
        'Content-Type': 'application/json'
      };
      
      fetchOptions = {
        method: 'GET',
        headers: headers
      };
    } else {
      // Fallback to MastersIndia API
      apiUrl = `https://api.mastersindia.co/api/v1/custom/gst/search?gstin=${gstin}`;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      };
      
      fetchOptions = {
        method: 'GET',
        headers: headers
      };
    }
    
    const response = await fetch(apiUrl, fetchOptions);

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`GST API error: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching GST details:', error);
    return NextResponse.json({ error: 'Failed to fetch GST details', details: error.message }, { status: 500 });
  }
}
