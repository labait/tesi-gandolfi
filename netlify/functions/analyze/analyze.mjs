// Docs on request and context https://docs.netlify.com/functions/build/#code-your-function-2
export default async (request, context) => {

  const prompt = `
    esamina l'immagine allegata e rileva 
    stile grafico, movimento (o periodo) artistico, famiglie fonts, cromia, colori e tags; 
    come output dammi una struttura dati così

    {
    graphic_style: "pop art, swiss style, grunge, minimal, japanese, comic book ecc..",
    art_style: "try to undestand the artistic style someway, do not respond with 'not artistic style'",
    font_family: "serif, sans serif, script, ecc.",
    chromatic: "bright, dark, pastel, monochrome, neutral, ...",
    colors: "main colors codes, #cc00ff, #0000dd, ecc",
    tags: "bauhaus, red, vector and all the tags that car help to categorize the image in a databse for search",
    description: "description of the image",
    review: "artistic review of the image", 
    visual_analysis: "visual analysis of the image as if you were going to describe it in a design brief for your team"
    }`
  const model = 'gpt-4o'
  const max_tokens = 2000

  try {
    // Verifica che la richiesta sia POST
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Ottieni la chiave API dalle variabili d'ambiente
    const apiKey = process.env.OPENAI_API_KEY
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'OPENAI_API_KEY non configurata' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Leggi il FormData dalla richiesta
    const formData = await request.formData()
    const imageFile = formData.get('image')

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'Nessuna immagine fornita' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Converti l'immagine in base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString('base64')
    const mimeType = imageFile.type || 'image/jpeg'

    // Chiama l'API OpenAI Vision
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
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
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: max_tokens
      })
    })

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({}))
      return new Response(
        JSON.stringify({ 
          error: `Errore API OpenAI: ${openaiResponse.status}`,
          details: errorData 
        }),
        { 
          status: openaiResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const data = await openaiResponse.json()
    const output = data.choices[0]?.message?.content || 'Nessuna risposta ricevuta'

    // Restituisci la risposta
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
