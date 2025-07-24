"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Activity, 
  AlertCircle, 
  Database, 
  Globe, 
  Shield, 
  Wifi 
} from "lucide-react"

export default function PublicDebugPage() {
  const [debugInfo, setDebugInfo] = useState<string>("")
  const [testResults, setTestResults] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)

  const getEnvironmentInfo = () => {
    const info = {
      // Environment
      nodeEnv: process.env.NODE_ENV,
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      
      // Browser info
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      location: typeof window !== 'undefined' ? window.location.href : 'Server',
      
      // Timing
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Build info
      buildTime: typeof window !== 'undefined' ? 'Client' : 'Server',
      
      // Storage
      hasLocalStorage: typeof window !== 'undefined' && !!window.localStorage,
      savedToken: typeof window !== 'undefined' ? !!localStorage.getItem('admin_token') : false,
      savedUser: typeof window !== 'undefined' ? !!localStorage.getItem('admin_user') : false,
    }
    
    setDebugInfo(JSON.stringify(info, null, 2))
  }

  const testApiConnectivity = async () => {
    setIsLoading(true)
    setTestResults("Testing API connectivity...\n")
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.60.30.188:8000'
    const endpoints = [
      '/api/health/',
      '/api/token/',
      '/api/artists/',
      '/'
    ]
    
    let results = `Testing API connectivity to: ${apiUrl}\n\n`
    
    for (const endpoint of endpoints) {
      const fullUrl = `${apiUrl}${endpoint}`
      const startTime = Date.now()
      
      try {
        results += `Testing: ${fullUrl}\n`
        
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        })
        
        const duration = Date.now() - startTime
        
        results += `✅ Status: ${response.status} ${response.statusText}\n`
        results += `⏱️ Duration: ${duration}ms\n`
        results += `🌐 URL: ${response.url}\n`
        results += `📋 Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}\n`
        
        if (response.ok) {
          try {
            const data = await response.text()
            results += `📄 Response: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}\n`
          } catch {
            results += `📄 Response: Could not read response body\n`
          }
        }
        
        results += `\n`
        
      } catch (error) {
        const duration = Date.now() - startTime
        results += `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`
        results += `⏱️ Duration: ${duration}ms\n`
        results += `🔍 Type: ${error instanceof Error ? error.name : 'Unknown'}\n\n`
      }
      
      setTestResults(results)
    }
    
    setIsLoading(false)
  }

  const testLogin = async () => {
    const username = (document.getElementById('test-username') as HTMLInputElement)?.value
    const password = (document.getElementById('test-password') as HTMLInputElement)?.value
    
    if (!username || !password) {
      setTestResults("Please enter username and password to test login")
      return
    }
    
    setIsLoading(true)
    setTestResults("Testing login flow...\n")
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.60.30.188:8000'
    let results = `Testing login for user: ${username}\n\n`
    
    try {
      // Step 1: Test token endpoint
      results += `Step 1: Getting JWT token\n`
      results += `POST ${apiUrl}/api/token/\n`
      
      const tokenResponse = await fetch(`${apiUrl}/api/token/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      results += `Status: ${tokenResponse.status} ${tokenResponse.statusText}\n`
      results += `Headers: ${JSON.stringify(Object.fromEntries(tokenResponse.headers.entries()), null, 2)}\n`
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text()
        results += `❌ Token request failed\n`
        results += `Error: ${errorData}\n`
        setTestResults(results)
        setIsLoading(false)
        return
      }
      
      const tokenData = await tokenResponse.json()
      results += `✅ Token received successfully\n`
      results += `Has access token: ${!!tokenData.access}\n`
      results += `Has refresh token: ${!!tokenData.refresh}\n\n`
      
      // Step 2: Test profile endpoint
      results += `Step 2: Getting user profile\n`
      results += `GET ${apiUrl}/api/user/profile/\n`
      
      const profileResponse = await fetch(`${apiUrl}/api/user/profile/`, {
        headers: {
          'Authorization': `Bearer ${tokenData.access}`,
          'Content-Type': 'application/json',
        },
      })
      
      results += `Status: ${profileResponse.status} ${profileResponse.statusText}\n`
      
      if (!profileResponse.ok) {
        const errorData = await profileResponse.text()
        results += `❌ Profile request failed\n`
        results += `Error: ${errorData}\n`
        setTestResults(results)
        setIsLoading(false)
        return
      }
      
      const userData = await profileResponse.json()
      results += `✅ Profile received successfully\n`
      results += `User ID: ${userData.id}\n`
      results += `Username: ${userData.username}\n`
      results += `Email: ${userData.email}\n`
      results += `Is Staff: ${userData.is_staff}\n`
      results += `Is Superuser: ${userData.is_superuser}\n\n`
      
      results += `🎉 LOGIN TEST SUCCESSFUL!\n`
      results += `The login flow works correctly. The issue might be with:\n`
      results += `- Environment variables not being set in Vercel\n`
      results += `- CORS configuration\n`
      results += `- Network connectivity from Vercel servers\n`
      
    } catch (error) {
      results += `❌ Login test failed with error:\n`
      results += `Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`
      results += `Type: ${error instanceof Error ? error.name : 'Unknown'}\n`
      
      if (error instanceof Error && error.message.includes('CORS')) {
        results += `\n🔍 CORS Issue Detected:\n`
        results += `- Your Django backend needs to allow requests from Vercel\n`
        results += `- Add your Vercel domain to CORS_ALLOWED_ORIGINS in Django settings\n`
      }
      
      if (error instanceof Error && error.message.includes('fetch')) {
        results += `\n🔍 Network Issue Detected:\n`
        results += `- Vercel cannot reach your Django backend\n`
        results += `- Check if your server is accessible from the internet\n`
        results += `- Verify the API URL is correct\n`
      }
    }
    
    setTestResults(results)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Public Debug Page</h1>
          <p className="text-muted-foreground mt-2">
            Debug Vercel login issues without authentication
          </p>
          <Badge variant="outline" className="mt-2">
            No login required
          </Badge>
        </div>

        {/* Environment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Environment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={getEnvironmentInfo} disabled={isLoading}>
              <Activity className="h-4 w-4 mr-2" />
              Get Environment Info
            </Button>
            
            {debugInfo && (
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto max-h-64">
                  {debugInfo}
                </pre>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Expected API URL:</strong> http://13.60.30.188:8000</p>
              <p><strong>Current API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV || 'unknown'}</p>
            </div>
          </CardContent>
        </Card>

        {/* API Connectivity Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              API Connectivity Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testApiConnectivity} disabled={isLoading}>
              <Database className="h-4 w-4 mr-2" />
              {isLoading ? 'Testing...' : 'Test API Connection'}
            </Button>
            
            {testResults && (
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                  {testResults}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Login Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Login Flow Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="test-username" className="text-sm font-medium">Username</label>
                <Input
                  id="test-username"
                  type="text"
                  placeholder="Enter username"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="test-password" className="text-sm font-medium">Password</label>
                <Input
                  id="test-password"
                  type="password"
                  placeholder="Enter password"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <Button onClick={testLogin} disabled={isLoading}>
              <Shield className="h-4 w-4 mr-2" />
              {isLoading ? 'Testing Login...' : 'Test Login Flow'}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>⚠️ This will test the complete login flow including:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>JWT token request to /api/token/</li>
                <li>User profile fetch from /api/user/profile/</li>
                <li>Error analysis and suggestions</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              How to Use This Debug Page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Step 1: Check Environment</h4>
              <p className="text-sm text-muted-foreground">
                Click &quot;Get Environment Info&quot; to verify that NEXT_PUBLIC_API_URL is set correctly in Vercel.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 2: Test API Connection</h4>
              <p className="text-sm text-muted-foreground">
                Click &quot;Test API Connection&quot; to verify that Vercel can reach your Django backend.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Step 3: Test Login Flow</h4>
              <p className="text-sm text-muted-foreground">
                Enter your Django admin credentials and click &quot;Test Login Flow&quot; to see exactly where the login fails.
              </p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> This page is accessible without login, so you can bookmark it for debugging: 
                <br />
                <code className="bg-blue-100 px-1 rounded">https://siidaamusicadmin.vercel.app/debug-public</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}