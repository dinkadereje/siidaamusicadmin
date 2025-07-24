"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { apiService } from "@/lib/api"

export default function TestApiPage() {
  const [results, setResults] = useState<any>({})
  const [loading, setLoading] = useState(false)

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    try {
      const result = await testFn()
      setResults(prev => ({
        ...prev,
        [name]: { success: true, data: result, error: null }
      }))
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [name]: { success: false, data: null, error: error.message }
      }))
    }
  }

  const runAllTests = async () => {
    setLoading(true)
    setResults({})

    const tests = [
      { name: 'Health Check', fn: () => apiService.healthCheck() },
      { name: 'Artists', fn: () => apiService.getArtists() },
      { name: 'Albums', fn: () => apiService.getAlbums() },
      { name: 'Songs', fn: () => apiService.getSongs() },
      { name: 'Purchases', fn: () => apiService.getPurchases() },
      { name: 'Payment Transactions', fn: () => apiService.getPaymentTransactions() },
      { name: 'Dashboard Stats', fn: () => apiService.getDashboardStats() },
    ]

    for (const test of tests) {
      await testEndpoint(test.name, test.fn)
    }

    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">API Connection Test</h2>
          <p className="text-muted-foreground">
            Test connection to Django backend at: {process.env.NEXT_PUBLIC_API_URL || 'http://13.60.30.188:8000'}
          </p>
        </div>
        <Button onClick={runAllTests} disabled={loading}>
          {loading ? 'Testing...' : 'Run Tests'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(results).map(([name, result]: [string, any]) => (
          <Card key={name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{name}</CardTitle>
              <Badge variant={result.success ? 'default' : 'destructive'}>
                {result.success ? 'Success' : 'Failed'}
              </Badge>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div>
                  <p className="text-sm text-green-600 mb-2">✅ Connected successfully</p>
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground">
                      View response ({Array.isArray(result.data) ? result.data.length : 'object'} items)
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-red-600 mb-2">❌ Connection failed</p>
                  <p className="text-xs text-muted-foreground">{result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {loading && (
        <div className="text-center">
          <p className="text-muted-foreground">Testing API endpoints...</p>
        </div>
      )}
    </div>
  )
}