"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { logger, LogLevel, type LogEntry } from "@/lib/logger"
import {
    Activity,
    AlertCircle,
    CheckCircle,
    Clock,
    Download,
    Filter,
    RefreshCw,
    Search,
    Trash2,
    Wifi,
    Shield,
    Database,
    Globe
} from "lucide-react"

export default function LoggingDashboard() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([])
    const [stats, setStats] = useState(logger.getStats())
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedLevel, setSelectedLevel] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [autoRefresh, setAutoRefresh] = useState(true)

    const refreshLogs = () => {
        const allLogs = logger.getLogs()
        setLogs(allLogs)
        setStats(logger.getStats())
    }

    useEffect(() => {
        refreshLogs()

        if (autoRefresh) {
            const interval = setInterval(refreshLogs, 2000) // Refresh every 2 seconds
            return () => clearInterval(interval)
        }
    }, [autoRefresh])

    useEffect(() => {
        let filtered = logs

        // Filter by category
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(log => log.category === selectedCategory)
        }

        // Filter by level
        if (selectedLevel !== 'all') {
            const levelNum = parseInt(selectedLevel)
            filtered = filtered.filter(log => log.level >= levelNum)
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (log.error?.message || '').toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        setFilteredLogs(filtered)
    }, [logs, selectedCategory, selectedLevel, searchTerm])

    const getLevelBadge = (level: LogLevel) => {
        const variants = {
            [LogLevel.DEBUG]: { variant: 'secondary' as const, label: 'DEBUG' },
            [LogLevel.INFO]: { variant: 'default' as const, label: 'INFO' },
            [LogLevel.WARN]: { variant: 'destructive' as const, label: 'WARN' },
            [LogLevel.ERROR]: { variant: 'destructive' as const, label: 'ERROR' },
        }

        const config = variants[level]
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getCategoryIcon = (category: string) => {
        const icons: Record<string, React.ReactElement> = {
            'API': <Database className="h-4 w-4" />,
            'AUTH': <Shield className="h-4 w-4" />,
            'NETWORK': <Wifi className="h-4 w-4" />,
            'ENV': <Globe className="h-4 w-4" />,
            'SYSTEM': <Activity className="h-4 w-4" />,
        }
        return icons[category] || <Activity className="h-4 w-4" />
    }

    const formatTimestamp = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString()
    }

    const exportLogs = () => {
        const dataStr = logger.exportLogs()
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `siidaa-admin-logs-${new Date().toISOString().split('T')[0]}.json`
        link.click()
        URL.revokeObjectURL(url)
    }

    const clearLogs = () => {
        logger.clearLogs()
        refreshLogs()
    }

    const testConnectivity = async () => {
        logger.info('NETWORK', 'Manual connectivity test initiated')

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://13.60.30.188:8000'
        const startTime = Date.now()

        try {
            const response = await fetch(`${apiUrl}/api/health/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            })

            const duration = Date.now() - startTime
            logger.networkTest(`${apiUrl}/api/health/`, response.ok, duration)

            if (response.ok) {
                const data = await response.json()
                logger.info('NETWORK', 'Health check successful', data)
            }
        } catch (error) {
            const duration = Date.now() - startTime
            logger.networkTest(`${apiUrl}/api/health/`, false, duration, error as Error)
        }

        refreshLogs()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Logging Dashboard</h2>
                    <p className="text-muted-foreground">
                        Monitor API calls, authentication, and network connectivity
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAutoRefresh(!autoRefresh)}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                        Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={testConnectivity}>
                        <Wifi className="h-4 w-4 mr-2" />
                        Test Connection
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Errors</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats.byLevel.error}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">API Calls</CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.byCategory.API || 0}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Auth Events</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.byCategory.AUTH || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="logs" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="logs">All Logs</TabsTrigger>
                    <TabsTrigger value="errors">Recent Errors</TabsTrigger>
                    <TabsTrigger value="api">API Calls</TabsTrigger>
                    <TabsTrigger value="auth">Authentication</TabsTrigger>
                    <TabsTrigger value="network">Network</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4 items-center">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search logs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full"
                                    />
                                </div>

                                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        <SelectItem value="API">API</SelectItem>
                                        <SelectItem value="AUTH">Auth</SelectItem>
                                        <SelectItem value="NETWORK">Network</SelectItem>
                                        <SelectItem value="ENV">Environment</SelectItem>
                                        <SelectItem value="SYSTEM">System</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                                    <SelectTrigger className="w-32">
                                        <SelectValue placeholder="Level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Levels</SelectItem>
                                        <SelectItem value="0">Debug+</SelectItem>
                                        <SelectItem value="1">Info+</SelectItem>
                                        <SelectItem value="2">Warn+</SelectItem>
                                        <SelectItem value="3">Error</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button variant="outline" size="sm" onClick={exportLogs}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export
                                </Button>

                                <Button variant="outline" size="sm" onClick={clearLogs}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logs Display */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Logs ({filteredLogs.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-2">
                                    {filteredLogs.map((log, index) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50"
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                {getCategoryIcon(log.category)}
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimestamp(log.timestamp)}
                                                </span>
                                                {getLevelBadge(log.level)}
                                                <Badge variant="outline">{log.category}</Badge>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{log.message}</p>

                                                {log.url && (
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {log.method} {log.url}
                                                        {log.status && ` - ${log.status}`}
                                                        {log.duration && ` (${log.duration}ms)`}
                                                    </p>
                                                )}

                                                {log.error && (
                                                    <p className="text-xs text-red-600 mt-1">
                                                        {log.error.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {filteredLogs.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No logs match the current filters
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="errors">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Recent Errors</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {stats.recentErrors.map((error, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 border border-red-200 rounded-lg bg-red-50">
                                        <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="destructive">{error.category}</Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimestamp(error.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium">{error.message}</p>
                                            {error.error && (
                                                <p className="text-xs text-red-600 mt-1">{error.error}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {stats.recentErrors.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                                        No recent errors
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="api">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">API Call Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-2">
                                    {logs.filter(log => log.category === 'API').map((log, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Database className="h-4 w-4" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                    {log.status && (
                                                        <Badge variant={log.status >= 400 ? 'destructive' : 'default'}>
                                                            {log.status}
                                                        </Badge>
                                                    )}
                                                    {log.duration && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.duration}ms
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium">{log.message}</p>
                                                {log.url && (
                                                    <p className="text-xs text-muted-foreground">{log.url}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="auth">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Authentication Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-2">
                                    {logs.filter(log => log.category === 'AUTH').map((log, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Shield className="h-4 w-4" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                    {getLevelBadge(log.level)}
                                                </div>
                                                <p className="text-sm font-medium">{log.message}</p>
                                                {log.error && (
                                                    <p className="text-xs text-red-600">{log.error.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="network">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Network Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-96">
                                <div className="space-y-2">
                                    {logs.filter(log => log.category === 'NETWORK').map((log, index) => (
                                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                                            <Wifi className="h-4 w-4" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTimestamp(log.timestamp)}
                                                    </span>
                                                    {getLevelBadge(log.level)}
                                                    {log.duration && (
                                                        <span className="text-xs text-muted-foreground">
                                                            {log.duration}ms
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm font-medium">{log.message}</p>
                                                {log.error && (
                                                    <p className="text-xs text-red-600">{log.error.message}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}