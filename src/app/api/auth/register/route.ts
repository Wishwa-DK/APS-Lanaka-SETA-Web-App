import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Proxy: Received registration request:', body)
    
    // Forward the request to the backend
    const backendResponse = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    
    console.log('Proxy: Backend response status:', backendResponse.status)
    
    const data = await backendResponse.json()
    console.log('Proxy: Backend response data:', data)
    
    return NextResponse.json(data, { status: backendResponse.status })
  } catch (error) {
    console.error('Proxy: Error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Registration endpoint' })
}