"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function VercelDebug() {
  const [debugInfo, setDebugInfo] = useState<string>("")

  const runDebug = () => {
    const info = {
      environment: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      location: typeof window !== 'undefined' ? window.location.href : 'Server',
      timestamp: new Date().toISOString(),
      buildTime: typeof window !== 'undefined' ? 'Client' : 'Server'
    }
    
    setDebugInfo(JSON.stringify(info, null, 2))
  }

  const testApiConnection = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.60.30.188:8000'
      const response = await fetch(`${apiUrl}/api/health/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      })
      
      const result = {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url,
        headers: Object.fromEntries(response.headers.entries()),
        data: response.ok ? await response.json() : await response.text()
      }
      
      setDebugInfo(JSON.stringify(result, null, 2))
    } catch (error) {
      setDebugInfo(JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      }, null, 2))
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Vercel Debug Information
          <Badge variant="outline">
            {process.env.NODE_ENV || 'unknown'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runDebug}>
            Get Environment Info
          </Button>
          <Button onClick={testApiConnection} variant="outline">
            Test API Connection
          </Button>
        </div>
        
        {debugInfo && (
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-auto max-h-96">
              {debugInfo}
            </pre>
          </div>
        )}
        
        <div className="text-sm text-muted-foreground">
          <p><strong>Expected API URL:</strong> http://13.60.30.188:8000</p>
          <p><strong>Current API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
        </div>
      </CardContent>
    </Card>
  )
}