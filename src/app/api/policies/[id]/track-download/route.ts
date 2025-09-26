import { NextRequest, NextResponse } from 'next/server'

/**
 * Track policy download for metrics
 * POST /api/policies/[id]/track-download
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: policyId } = await params
    
    // Get auth token from headers
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const backendPort = process.env.BACKEND_PORT || '5000'

    console.log(`📥 Tracking download for policy ${policyId}`)

    // Forward to backend (now with enhanced acknowledgment tracking)
    const response = await fetch(`http://localhost:${backendPort}/api/policies/${policyId}/track-download`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    })

    if (response.ok) {
      const data = await response.json()
      console.log(`✅ Download tracked for policy ${policyId}`)
      return NextResponse.json(data)
    } else {
      const errorData = await response.json()
      console.error('Backend tracking failed:', errorData)
      return NextResponse.json(errorData, { status: response.status })
    }
  } catch (error) {
    console.error('Error tracking download:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}