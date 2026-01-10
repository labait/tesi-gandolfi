// Docs on request and context https://docs.netlify.com/functions/build/#code-your-function-2
export default async (request, context) => {

  const prompt = `Examine the attached image and detect graphic style, artistic movement (or period), font families, chromatic palette, colors and tags. 

I need to get inspiration from the image, so add a search_text to help me find similar images via api ie google custom search api.

The JSON structure must be exactly this:

{
  "graphic_style": "pop art, swiss style, grunge, minimal, japanese, comic book etc..",
  "art_style": "try to understand the artistic style someway, do not respond with 'not artistic style'",
  "font_family": "serif, sans serif, script, etc.",
  "chromatic": "bright, dark, pastel, monochrome, neutral, ...",
  "colors": "main colors codes, #cc00ff, #0000dd, etc",
  "tags": "bauhaus, red, vector and all the tags that can help to categorize the image in a database for search",
  "description": "description of the image",
  "review": "artistic review of the image", 
  "visual_analysis": "visual analysis of the image as if you were going to describe it in a design brief for your team"
  "search_text": "search query you'll compose using the analysis of the image"
}

IMPORTANT: You must respond ONLY with a valid JSON object, without any additional text before or after.  
`
  const model = 'gpt-4o'
  const max_tokens = 2000

  try {
    // Verify request is POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get API key from environment variables
    const apiKey = process.env.NOFOMO_OPENAI_API_KEY
    
    // Debug: check if API key is present (without logging full value for security)
    console.log('API Key present:', apiKey ? `sk-...${apiKey.slice(-4)}` : 'NOT PRESENT')
    console.log('Available environment variables:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')))
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY not configured',
          hint: 'Make sure you have configured NOFOMO_OPENAI_API_KEY in Netlify environment variables or in a .env file for local development'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Debug: log received headers
    const contentType = request.headers.get('content-type') || ''
    console.log('Content-Type received:', contentType)

    // Read data from request (can be JSON with imageUrl or FormData with image)
    let base64Image
    let mimeType = 'image/jpeg'
    
    if (contentType.includes('application/json')) {
      // Case 1: JSON with imageUrl (to avoid CORS issues)
      try {
        const jsonData = await request.json()
        const imageUrl = jsonData.imageUrl
        
        if (!imageUrl) {
          return new Response(
            JSON.stringify({ error: 'No image URL provided' }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }

        // Download image from URL (server-side, no CORS issues)
        console.log('Downloading image from URL:', imageUrl)
        const imageResponse = await fetch(imageUrl)
        
        if (!imageResponse.ok) {
          throw new Error(`Error downloading image: ${imageResponse.status}`)
        }

        // Read image as binary (like in Ruby code: file_data.read)
        const arrayBuffer = await imageResponse.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        base64Image = buffer.toString('base64')
        
        // Determine mimeType from response header or URL
        mimeType = imageResponse.headers.get('content-type') || 'image/jpeg'
        
        // Normalize mimeType (remove parameters like charset)
        if (mimeType.includes(';')) {
          mimeType = mimeType.split(';')[0].trim()
        }
        
        // Verify mimeType is valid for OpenAI Vision
        const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        if (!validMimeTypes.includes(mimeType)) {
          console.warn(`Non-standard MimeType: ${mimeType}, using image/jpeg as fallback`)
          mimeType = 'image/jpeg'
        }
        
        console.log('Image downloaded:', {
          size: arrayBuffer.byteLength,
          mimeType: mimeType,
          base64Length: base64Image.length,
          sizeMB: (arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)
        })
        
        // Verify size (OpenAI has limits)
        const maxSize = 20 * 1024 * 1024 // 20MB
        if (arrayBuffer.byteLength > maxSize) {
          return new Response(
            JSON.stringify({ 
              error: 'Image too large',
              details: `Size: ${(arrayBuffer.byteLength / (1024 * 1024)).toFixed(2)}MB, Maximum: 20MB`
            }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          )
        }
      } catch (jsonError) {
        console.error('Error parsing JSON or downloading image:', jsonError)
        return new Response(
          JSON.stringify({ 
            error: 'Error downloading image from URL',
            details: jsonError.message
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      // Case 2: FormData with file (for backward compatibility)
      let formData
      let imageFile
      
      try {
        formData = await request.formData()
        imageFile = formData.get('image')
      } catch (formDataError) {
        console.error('Error parsing FormData:', formDataError)
        return new Response(
          JSON.stringify({ 
            error: 'Error parsing FormData',
            details: formDataError.message,
            contentType: contentType
          }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      if (!imageFile) {
        return new Response(
          JSON.stringify({ error: 'No image provided in FormData' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }

      // Convert image to base64 (like in Ruby code: file_data.read -> Base64.strict_encode64)
      // Read file as binary (arrayBuffer)
      const arrayBuffer = await imageFile.arrayBuffer()
      // Convert to Buffer and then to base64
      const buffer = Buffer.from(arrayBuffer)
      base64Image = buffer.toString('base64')
      mimeType = imageFile.type || 'image/jpeg'
      
      console.log('Image received from FormData:', {
        size: arrayBuffer.byteLength,
        mimeType: mimeType,
        base64Length: base64Image.length
      })
    }

    // Verify base64 is valid
    if (!base64Image || base64Image.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty or invalid base64 image' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    // Build data URI URL (like in Ruby code)
    const dataUri = `data:${mimeType};base64,${base64Image}`
    
    // Call OpenAI Vision API
    const requestBody = {
      model: model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: dataUri
              }
            }
          ]
        }
      ],
      max_tokens: max_tokens,
      response_format: { type: 'json_object' }
    }
    
    console.log('Richiesta OpenAI:', {
      model: model,
      mimeType: mimeType,
      base64Length: base64Image.length,
      promptLength: prompt.length,
      dataUriPrefix: dataUri.substring(0, 50) + '...',
      contentTypes: requestBody.messages[0].content.map(c => c.type)
    })
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        errorData = { raw: errorText }
      }
      
      console.error('Errore API OpenAI:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        error: errorData,
        requestBody: {
          model: requestBody.model,
          mimeType: mimeType,
          base64Length: base64Image.length,
          contentTypes: requestBody.messages[0].content.map(c => c.type)
        }
      })
      
      // Specific hint messages for different errors
      let hint = ''
      if (openaiResponse.status === 401) {
        hint = 'Verify that the OpenAI API key is valid and configured correctly'
      } else if (openaiResponse.status === 400) {
        hint = 'Error in request format. Verify that the image is valid and the base64 is correct.'
        if (errorData.error?.message) {
          hint += ` Details: ${errorData.error.message}`
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: `OpenAI API Error: ${openaiResponse.status} ${openaiResponse.statusText}`,
          details: errorData,
          hint: hint || undefined
        }),
        { 
          status: openaiResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await openaiResponse.json()
    const output = data.choices[0]?.message?.content || 'No response received'

    // Return the response
    return new Response(
      JSON.stringify({ 
        result: output,
        model: data.model 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
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
