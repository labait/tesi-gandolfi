// Netlify Function for Serper Images API
// Responds to GET /.netlify/functions/images-search?q=...
export default async (request, context) => {
  try {
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    const apiKey = process.env.NOFOMO_SERPER_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'NOFOMO_SERPER_API_KEY not configured',
          hint: 'Configure NOFOMO_SERPER_API_KEY in Netlify environment variables or in a .env file for local development'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(request.url)
    const q = url.searchParams.get('q')
    const gl = url.searchParams.get('gl') || 'it'
    const page = url.searchParams.get('page') || '1'

    if (!q) {
      return new Response(
        JSON.stringify({ error: 'Query parameter "q" is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const pageNum = parseInt(page, 100) || 1
    const body = JSON.stringify({ q, gl, num: 100, page: pageNum })
    const requestOptions = {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      },
      body
    }

    console.log('Calling Serper Images API:', { q, gl, page: pageNum })

    const response = await fetch('https://google.serper.dev/images', requestOptions)

    if (!response.ok) {
      const errorText = await response.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { raw: errorText }
      }
      console.error('Serper Images API Error:', { status: response.status, error: errorData })
      return new Response(
        JSON.stringify({
          error: `Serper Images API Error: ${response.status} ${response.statusText}`,
          details: errorData
        }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()

    // Serper images response: { images: [{ imageUrl, link, title, snippet, position }, ...] }
    const images = data.images || []
    const results = images

    const totalResults = images.length
    console.log('Serper Images API response:', { resultsCount: results.length })

    return new Response(
      JSON.stringify({
        results,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in images-search function:', error)
    return new Response(
      JSON.stringify({ error: error.message, stack: error.stack }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
