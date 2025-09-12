import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    console.log('Testing API key with raw fetch...')
    
    // Test 1: Simple fetch to Politics & War API
    const testQuery = `
      query {
        me {
          nation {
            id
            nation_name
          }
        }
      }
    `

    console.log('API Key length:', apiKey.length)
    console.log('API Key starts with:', apiKey.substring(0, 10) + '...')

    // Use the correct P&W API format
    const testUrl = new URL('https://api.politicsandwar.com/graphql')
    testUrl.searchParams.set('api_key', apiKey)
    testUrl.searchParams.set('query', testQuery)

    console.log('Request URL:', testUrl.toString())

    const response = await fetch(testUrl.toString(), {
      method: 'GET',
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Response body:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.log('Failed to parse JSON:', e)
      responseData = { rawResponse: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      apiKeyInfo: {
        length: apiKey.length,
        firstChars: apiKey.substring(0, 10),
        lastChars: apiKey.substring(apiKey.length - 10)
      }
    })

  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
