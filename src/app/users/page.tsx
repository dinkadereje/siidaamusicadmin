"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Mail, Calendar, CreditCard } from "lucide-react"
import { apiService, formatDate, type User } from "@/lib/api"
import UserForm from "@/components/forms/UserForm"
import DeleteDialog from "@/components/ui/delete-dialog"

interface UserWithStats extends User {
  purchases: number
  totalSpent: number
  subscription: string
  status: string
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [stats, setStats] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    activeToday: 0,
    newSignups: 0
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      // For now, we'll use payment transactions to get user data
      // since there's no dedicated users endpoint yet
      const [purchases, transactions] = await Promise.all([
        apiService.getPurchases(),
        apiService.getPaymentTransactions()
      ])

      // Extract unique users from transactions
      const userMap = new Map<number, UserWithStats>()
      
      transactions.forEach(transaction => {
        if (!userMap.has(transaction.user)) {
          const userPurchases = purchases.filter(p => p.user === transaction.user)
          const userTransactions = transactions.filter(t => t.user === transaction.user && t.status === 'success')
          const totalSpent = userTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0)
          
          userMap.set(transaction.user, {
            id: transaction.user,
            username: `user_${transaction.user}`, // We don't have username from transactions
            email: transaction.email,
            phone_number: transaction.phone_number,
            first_name: transaction.first_name,
            last_name: transaction.last_name,
            date_joined: transaction.created_at, // Using first transaction as join date
            purchases: userPurchases.length,
            totalSpent,
            subscription: totalSpent > 50 ? "premium" : totalSpent > 20 ? "basic" : "free",
            status: "active"
          })
        }
      })

      const usersArray = Array.from(userMap.values())
      setUsers(usersArray)

      // Calculate stats
      setStats({
        totalUsers: usersArray.length,
        premiumUsers: usersArray.filter(u => u.subscription === "premium").length,
        activeToday: Math.floor(usersArray.length * 0.3), // Mock data
        newSignups: Math.floor(usersArray.length * 0.1) // Mock data
      })

    } catch (err) {
      console.error('Failed to fetch users:', err)
      setError('Failed to load users data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleAddUser = () => {
    setEditingUser(null)
    setFormOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setFormOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setDeleteDialog({ open: true, user })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.user) return

    try {
      setDeleteLoading(true)
      // Note: This would require implementing user delete endpoint in Django
      console.log('Delete user:', deleteDialog.user.id)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      await fetchUsers() // Refresh the list
      setDeleteDialog({ open: false, user: null })
    } catch (err: unknown) {
      console.error('Failed to delete user:', err)
      setError('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSuccess = async () => {
    await fetchUsers() // Refresh the list
  }

  const getSubscriptionColor = (subscription: string) => {
    switch (subscription) {
      case 'premium': return 'default'
      case 'basic': return 'secondary'
      case 'free': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'suspended': return 'destructive'
      case 'inactive': return 'secondary'
      default: return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Users</h2>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
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
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage user accounts and subscriptions
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">From transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.premiumUsers}</div>
            <p className="text-xs text-muted-foreground">High spenders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Estimated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newSignups}</div>
            <p className="text-xs text-muted-foreground">Recent</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Purchases</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="/placeholder-avatar.jpg" alt={`${user.first_name} ${user.last_name}`} />
                        <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.first_name} {user.last_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Mail className="mr-1 h-3 w-3 text-muted-foreground" />
                      {user.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                      {formatDate(user.date_joined)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getSubscriptionColor(user.subscription)}>
                      {user.subscription}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CreditCard className="mr-1 h-3 w-3 text-muted-foreground" />
                      {user.purchases}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteUser(user)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Form Dialog */}
      <UserForm
        open={formOpen}
        onOpenChange={setFormOpen}
        user={editingUser}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
        onConfirm={confirmDelete}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteDialog.user?.first_name} ${deleteDialog.user?.last_name}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}