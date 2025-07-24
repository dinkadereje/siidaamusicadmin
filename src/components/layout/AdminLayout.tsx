"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/AuthContext"
import LogoutDialog from "@/components/auth/LogoutDialog"
import {
    Music,
    Users,
    Album,
    Mic,
    CreditCard,
    Settings,
    Menu,
    Home,
    BarChart3,
    LogOut,
    User
} from "lucide-react"

const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { name: "Artists", href: "/artists", icon: Mic },
    { name: "Albums", href: "/albums", icon: Album },
    { name: "Songs", href: "/songs", icon: Music },
    { name: "Users", href: "/users", icon: Users },
    { name: "Payments", href: "/payments", icon: CreditCard },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
]

interface AdminLayoutProps {
    children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
    const pathname = usePathname()
    const { user, logout } = useAuth()

    const handleLogout = () => {
        logout()
        setLogoutDialogOpen(false)
    }

    const SidebarContent = () => (
        <div className="flex h-full flex-col">
            <div className="flex h-16 items-center border-b px-6">
                <Music className="h-8 w-8 text-primary" />
                <span className="ml-2 text-xl font-bold">Siidaa Admin</span>
            </div>
            <nav className="flex-1 space-y-1 px-4 py-4">
                {navigation.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <Icon className="mr-3 h-4 w-4" />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
        </div>
    )

    return (
        <div className="flex h-screen bg-background">
            {/* Desktop Sidebar */}
            <div className="hidden w-64 border-r bg-card lg:block">
                <SidebarContent />
            </div>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden fixed top-4 left-4 z-50"
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="border-b bg-card px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
                        <div className="flex items-center space-x-4">
                            {user && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="/placeholder-avatar.jpg" alt={user.username} />
                                                <AvatarFallback>
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <div className="flex items-center justify-start gap-2 p-2">
                                            <div className="flex flex-col space-y-1 leading-none">
                                                <p className="font-medium">{user.first_name} {user.last_name}</p>
                                                <p className="w-[200px] truncate text-sm text-muted-foreground">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <DropdownMenuItem>
                                            <User className="mr-2 h-4 w-4" />
                                            <span>Profile</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setLogoutDialogOpen(true)}>
                                            <LogOut className="mr-2 h-4 w-4" />
                                            <span>Log out</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-auto p-6">
                    {children}
                </main>
            </div>

            {/* Logout Dialog */}
            <LogoutDialog
                open={logoutDialogOpen}
                onOpenChange={setLogoutDialogOpen}
                onConfirm={handleLogout}
            />
        </div>
    )
}