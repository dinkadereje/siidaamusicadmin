"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Music, Users, Album, Mic, TrendingUp, DollarSign } from "lucide-react"
import { apiService, formatPrice } from "@/lib/api"

interface DashboardStats {
  totalArtists: number
  totalAlbums: number
  totalSongs: number
  totalUsers: number
  totalRevenue: number
  totalStreams: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch dashboard stats
        const dashboardStats = await apiService.getDashboardStats()
        setStats(dashboardStats)

        // Fetch recent transactions for activity
        const transactions = await apiService.getPaymentTransactions()
        const recentTransactions = transactions
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 4)
          .map(transaction => ({
            type: "Payment",
            name: `${formatPrice(transaction.amount)} - ${transaction.first_name} ${transaction.last_name}`,
            time: new Date(transaction.created_at).toLocaleString(),
            status: transaction.status
          }))

        setRecentActivity(recentTransactions)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  const statsCards = [
    {
      title: "Total Artists",
      value: stats?.totalArtists.toString() || "0",
      change: "+2 this month",
      icon: Mic,
      trend: "up"
    },
    {
      title: "Total Albums",
      value: stats?.totalAlbums.toString() || "0",
      change: "+12 this month",
      icon: Album,
      trend: "up"
    },
    {
      title: "Total Songs",
      value: stats?.totalSongs.toString() || "0",
      change: "+89 this month",
      icon: Music,
      trend: "up"
    },
    {
      title: "Active Users",
      value: stats?.totalUsers.toString() || "0",
      change: "+156 this week",
      icon: Users,
      trend: "up"
    },
    {
      title: "Revenue",
      value: formatPrice(stats?.totalRevenue || 0),
      change: "+8.2% from last month",
      icon: DollarSign,
      trend: "up"
    },
    {
      title: "Streams",
      value: stats?.totalStreams.toString() || "0",
      change: "+23% this week",
      icon: TrendingUp,
      trend: "up"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your Siidaa Music admin dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{activity.type}</Badge>
                    </div>
                    <p className="text-sm font-medium">{activity.name}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Add New Artist</div>
                <div className="text-sm text-muted-foreground">Create a new artist profile</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">Upload Album</div>
                <div className="text-sm text-muted-foreground">Add a new album to the platform</div>
              </button>
              <button className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className="font-medium">View Reports</div>
                <div className="text-sm text-muted-foreground">Check analytics and reports</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}