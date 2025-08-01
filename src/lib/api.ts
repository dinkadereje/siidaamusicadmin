// API configuration and service functions for Siidaa Music Admin
import { logger } from './logger'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://faayaa.siidaatech.com'

// Log environment information
logger.environment({
  API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
  timestamp: new Date().toISOString(),
})

// Types based on Django models
export interface Artist {
    id: number
    name: string
    bio: string
    image?: string
}

export interface Album {
    id: number
    title: string
    artist: Artist
    description: string
    image?: string
    release_date: string
    price: string
    songs?: Song[]
}

export interface Song {
    id: number
    title: string
    album: Album
    artist: {
        id: number
        name: string
    }
    audio_file?: string
    preview_file?: string
    duration: string
    price: string
    is_free: boolean
    lyrics?: string
    synced_lyrics?: Record<string, unknown>
}

export interface User {
    id: number
    username: string
    email: string
    phone_number?: string
    first_name: string
    last_name: string
    date_joined: string
}

export interface PaymentTransaction {
    id: number
    user: number
    song?: number
    album?: number
    amount: string
    commission_amount: string
    artist_payout: string
    commission_rate: string
    currency: string
    tx_ref: string
    chapa_reference?: string
    status: 'pending' | 'success' | 'failed' | 'cancelled'
    created_at: string
    updated_at: string
    first_name: string
    last_name: string
    email: string
    phone_number?: string
}

export interface Purchase {
    id: number
    user: number
    song?: number
    album?: number
    transaction?: number
    purchase_date: string
}

// API service class
class ApiService {
    private baseUrl: string

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}/api${endpoint}`
        const method = options?.method || 'GET'
        const startTime = Date.now()

        // Get token from localStorage
        const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null

        const config: RequestInit = {
            headers: {
                // Only add Content-Type for non-FormData requests
                ...(!(options?.body instanceof FormData) && { 'Content-Type': 'application/json' }),
                ...(token && { 'Authorization': `Bearer ${token}` }),
                ...options?.headers,
            },
            ...options,
        }

        // Log the request
        logger.apiRequest(method, url, {
            hasToken: !!token,
            isFormData: options?.body instanceof FormData,
            headers: Object.keys(config.headers || {}),
        })

        try {
            const response = await fetch(url, config)
            const duration = Date.now() - startTime

            // Log the response
            logger.apiResponse(method, url, response.status, duration, {
                ok: response.ok,
                statusText: response.statusText,
                contentType: response.headers.get('content-type'),
            })

            if (!response.ok) {
                if (response.status === 401) {
                    logger.error('AUTH', 'Token expired or invalid', new Error(`401 Unauthorized: ${url}`))
                    // Token might be expired, try to refresh or redirect to login
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('admin_token')
                        localStorage.removeItem('admin_user')
                        localStorage.removeItem('admin_refresh_token')
                        window.location.href = '/login'
                    }
                }
                
                const errorMessage = `HTTP error! status: ${response.status}`
                const error = new Error(errorMessage)
                logger.apiError(method, url, error, duration)
                throw error
            }

            const data = await response.json()
            logger.debug('API', `${method} ${url} - Response data received`, {
                dataType: Array.isArray(data) ? `array[${data.length}]` : typeof data,
                hasData: !!data,
            })

            return data
        } catch (error) {
            const duration = Date.now() - startTime
            const apiError = error instanceof Error ? error : new Error('Unknown API error')
            
            logger.apiError(method, url, apiError, duration)
            console.error(`API request failed for ${endpoint}:`, error)
            throw error
        }
    }

    // Helper method for file uploads
    private async uploadRequest<T>(endpoint: string, formData: FormData): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: formData,
        })
    }

    // Helper method for file updates
    private async updateWithFiles<T>(endpoint: string, formData: FormData): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: formData,
        })
    }

    // Artists API
    async getArtists(): Promise<Artist[]> {
        return this.request<Artist[]>('/artists/')
    }

    async getArtist(id: number): Promise<Artist> {
        return this.request<Artist>(`/artists/${id}/`)
    }

    async createArtist(data: Omit<Artist, 'id'> | FormData): Promise<Artist> {
        if (data instanceof FormData) {
            return this.uploadRequest<Artist>('/artists/', data)
        }
        return this.request<Artist>('/artists/', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateArtist(id: number, data: Partial<Artist> | FormData): Promise<Artist> {
        if (data instanceof FormData) {
            return this.updateWithFiles<Artist>(`/artists/${id}/`, data)
        }
        return this.request<Artist>(`/artists/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async deleteArtist(id: number): Promise<void> {
        return this.request<void>(`/artists/${id}/`, {
            method: 'DELETE',
        })
    }

    // Albums API
    async getAlbums(): Promise<Album[]> {
        return this.request<Album[]>('/albums/')
    }

    async getAlbum(id: number): Promise<Album> {
        return this.request<Album>(`/albums/${id}/`)
    }

    async createAlbum(data: (Omit<Album, 'id' | 'artist'> & { artist: number }) | FormData): Promise<Album> {
        if (data instanceof FormData) {
            return this.uploadRequest<Album>('/albums/', data)
        }
        return this.request<Album>('/albums/', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateAlbum(id: number, data: (Partial<Album> & { artist?: number }) | FormData): Promise<Album> {
        if (data instanceof FormData) {
            return this.updateWithFiles<Album>(`/albums/${id}/`, data)
        }
        return this.request<Album>(`/albums/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async deleteAlbum(id: number): Promise<void> {
        return this.request<void>(`/albums/${id}/`, {
            method: 'DELETE',
        })
    }

    // Songs API
    async getSongs(): Promise<Song[]> {
        return this.request<Song[]>('/songs/')
    }

    async getSong(id: number): Promise<Song> {
        return this.request<Song>(`/songs/${id}/`)
    }

    async createSong(data: (Omit<Song, 'id' | 'album' | 'artist'> & { album: number }) | FormData): Promise<Song> {
        if (data instanceof FormData) {
            return this.uploadRequest<Song>('/songs/', data)
        }
        return this.request<Song>('/songs/', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateSong(id: number, data: (Partial<Song> & { album?: number }) | FormData): Promise<Song> {
        if (data instanceof FormData) {
            return this.updateWithFiles<Song>(`/songs/${id}/`, data)
        }
        return this.request<Song>(`/songs/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async deleteSong(id: number): Promise<void> {
        return this.request<void>(`/songs/${id}/`, {
            method: 'DELETE',
        })
    }

    // Users API (Note: You might need to add a users endpoint to Django)
    async getUsers(): Promise<User[]> {
        // This endpoint might not exist yet in your Django API
        // You may need to add it to your Django views
        return this.request<User[]>('/users/')
    }

    // Payment Transactions API
    async getPaymentTransactions(): Promise<PaymentTransaction[]> {
        return this.request<PaymentTransaction[]>('/payment-transactions/')
    }

    // Purchases API
    async getPurchases(): Promise<Purchase[]> {
        return this.request<Purchase[]>('/purchases/')
    }

    // Health check
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return this.request<{ status: string; timestamp: string }>('/health/')
    }

    // Dashboard stats (you might need to create these endpoints)
    async getDashboardStats(): Promise<{
        totalArtists: number
        totalAlbums: number
        totalSongs: number
        totalUsers: number
        totalRevenue: number
        totalStreams: number
    }> {
        // This would need to be implemented in Django
        // For now, we'll calculate from existing data
        const [artists, albums, songs, transactions] = await Promise.all([
            this.getArtists(),
            this.getAlbums(),
            this.getSongs(),
            this.getPaymentTransactions(),
        ])

        const totalRevenue = transactions
            .filter(t => t.status === 'success')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0)

        return {
            totalArtists: artists.length,
            totalAlbums: albums.length,
            totalSongs: songs.length,
            totalUsers: 0, // Would need users endpoint
            totalRevenue,
            totalStreams: 0, // Would need streaming stats
        }
    }
}

// Export singleton instance
export const apiService = new ApiService()

// Utility functions
export const formatDuration = (duration: string): string => {
    // Convert Django duration format (HH:MM:SS) to MM:SS
    const parts = duration.split(':')
    if (parts.length === 3) {
        const hours = parseInt(parts[0])
        const minutes = parseInt(parts[1])
        const seconds = parseInt(parts[2])

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
    }
    return duration
}

export const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    return `$${numPrice.toFixed(2)}`
}

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString()
}

export const getImageUrl = (imagePath?: string): string => {
    if (!imagePath) return '/placeholder-image.jpg'
    if (imagePath.startsWith('http')) return imagePath
    
    // Ensure the path starts with a slash
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`
    return `${API_BASE_URL}${cleanPath}`
}