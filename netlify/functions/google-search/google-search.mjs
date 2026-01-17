// Netlify Function for Google Custom Search API
export default async (request, context) => {
  try {
    // Verify request is GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get API key from environment variables
    const apiKey = process.env.NOFOMO_GOOGLE_API_KEY
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'NOFOMO_GOOGLE_API_KEY not configured',
          hint: 'Make sure you have configured NOFOMO_GOOGLE_API_KEY in Netlify environment variables or in a .env file for local development'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Get query parameters
    const url = new URL(request.url)
    const query = url.searchParams.get('q')
    const start = url.searchParams.get('start') // Optional pagination parameter (1-based index)
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter "q" is required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Custom Search Engine ID
    const cx = '5193fa5af2abc4287'
    
    // Build Google Custom Search API URL
    const googleSearchUrl = new URL('https://www.googleapis.com/customsearch/v1')
    googleSearchUrl.searchParams.append('key', apiKey)
    googleSearchUrl.searchParams.append('cx', cx)
    googleSearchUrl.searchParams.append('q', query)
    googleSearchUrl.searchParams.append('searchType', 'image')
    // googleSearchUrl.searchParams.append('imgColorType', 'mono')
    googleSearchUrl.searchParams.append('imgSize', 'medium')
    // googleSearchUrl.searchParams.append('fileType', 'png')
    googleSearchUrl.searchParams.append('safe', 'active')
    
    // Add start parameter for pagination if provided (1-based index: 1, 11, 21, etc.)
    if (start && parseInt(start) > 1) {
      googleSearchUrl.searchParams.append('start', start)
    }

    console.log('Calling Google Custom Search API:', { query, cx, start: start || '1' })

    // Call Google Custom Search API
    const response = await fetch(googleSearchUrl.toString())

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { raw: errorText }
      }

      console.error('Google Custom Search API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })

      return new Response(
        JSON.stringify({ 
          error: `Google Custom Search API Error: ${response.status} ${response.statusText}`,
          details: errorData
        }),
        { 
          status: response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await response.json()

    // Extract pagination info from Google response
    const searchInfo = data.searchInformation || {}
    const queries = data.queries || {}
    const requestQuery = queries.request?.[0] || {}
    
    const currentStartIndex = parseInt(requestQuery.startIndex) || 1
    const resultCount = parseInt(requestQuery.count) || 10
    const totalResults = parseInt(searchInfo.totalResults) || 0

    console.log('Google Search API response:', {
      itemsCount: data.items?.length || 0,
      searchInformation: searchInfo,
      currentStartIndex,
      resultCount,
      totalResults
    })

    // Return the response
    // Google Custom Search API returns 'items' array
    return new Response(
      JSON.stringify({ 
        results: data.items || [],
        searchInformation: {
          ...searchInfo,
          currentStartIndex,
          resultCount,
          totalResults
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in google-search function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
