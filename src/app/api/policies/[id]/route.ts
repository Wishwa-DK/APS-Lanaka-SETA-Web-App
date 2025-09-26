import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`Frontend Proxy: DELETE policy ${id}`);
    
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Forward the DELETE request to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/policies/${id}`;
    console.log(`Forwarding DELETE to: ${backendUrl}`);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    const responseData = await backendResponse.json();
    
    console.log(`Backend DELETE response status: ${backendResponse.status}`);
    console.log('Backend DELETE response data:', responseData);

    return NextResponse.json(responseData, { 
      status: backendResponse.status 
    });

  } catch (error) {
    console.error('Frontend Proxy DELETE Error:', error);
    return NextResponse.json(
      { error: 'Internal proxy error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`Frontend Proxy: PUT policy ${id}`);
    
    // Get the request body and authorization header
    const body = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header missing' }, { status: 401 });
    }

    // Forward the PUT request to the backend
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/policies/${id}`;
    console.log(`Forwarding PUT to: ${backendUrl}`);
    console.log('PUT body:', body);
    
    const backendResponse = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await backendResponse.json();
    
    console.log(`Backend PUT response status: ${backendResponse.status}`);
    console.log('Backend PUT response data:', responseData);

    return NextResponse.json(responseData, { 
      status: backendResponse.status 
    });

  } catch (error) {
    console.error('Frontend Proxy PUT Error:', error);
    return NextResponse.json(
      { error: 'Internal proxy error', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}