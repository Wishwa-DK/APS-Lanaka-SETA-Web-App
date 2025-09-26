'use client'

import { useState } from 'react'

export default function ApiTest() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testHealthEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/health`)
      const data = await response.json()
      setResult('Health check: ' + JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Health check error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    setLoading(false)
  }

  const testAuthEndpoint = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/test`)
      const data = await response.json()
      setResult('Auth test: ' + JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Auth test error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    setLoading(false)
  }

  const testRegistration = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com',
          password: 'TestPassword123!',
          employeeId: 'TEST001',
          department: 'IT'
        })
      })
      const data = await response.json()
      setResult('Registration test: ' + JSON.stringify(data, null, 2))
    } catch (error) {
      setResult('Registration error: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="space-y-4 mb-8">
        <button 
          onClick={testHealthEndpoint}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Health Endpoint
        </button>
        
        <button 
          onClick={testAuthEndpoint}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Test Auth Endpoint
        </button>
        
        <button 
          onClick={testRegistration}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Registration
        </button>
      </div>

      {loading && <p>Loading...</p>}
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  )
}