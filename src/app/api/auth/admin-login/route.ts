import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Admin Login Proxy: Received request:', {
      email: body.email,
      // Don't log password for security
    })

    // Forward the request to the backend API
    const backendResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/admin-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    const data = await backendResponse.json()
    
    console.log('Admin Login Proxy: Backend response status:', backendResponse.status)
    console.log('Admin Login Proxy: Backend response data:', {
      ...data,
      token: data.token ? '[HIDDEN]' : undefined
    })

    // Return the response with the same status code
    return NextResponse.json(data, { status: backendResponse.status })

  } catch (error) {
    console.error('Admin Login Proxy: Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}