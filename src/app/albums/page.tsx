"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, Music, Calendar } from "lucide-react"
import Image from "next/image"
import { apiService, getImageUrl, formatPrice, formatDate, type Album, type Song } from "@/lib/api"
import AlbumForm from "@/components/forms/AlbumForm"
import DeleteDialog from "@/components/ui/delete-dialog"
import AlbumSongsDialog from "@/components/album/AlbumSongsDialog"

interface AlbumWithStats extends Album {
  totalSongs: number
  status: string
}

export default function AlbumsPage() {
  const [albums, setAlbums] = useState<AlbumWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; album: Album | null }>({
    open: false,
    album: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [songsDialogOpen, setSongsDialogOpen] = useState(false)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null)

  const fetchAlbums = async () => {
    try {
      setLoading(true)
      
      // Fetch albums and songs
      const [albumsData, songsData] = await Promise.all([
        apiService.getAlbums(),
        apiService.getSongs()
      ])

      // Calculate stats for each album
      const albumsWithStats: AlbumWithStats[] = albumsData.map(album => {
        const albumSongs = songsData.filter(song => song.album.id === album.id)
        
        return {
          ...album,
          totalSongs: albumSongs.length,
          status: "published" // Default status since it's not in the model
        }
      })

      setAlbums(albumsWithStats)
    } catch (err) {
      console.error('Failed to fetch albums:', err)
      setError('Failed to load albums data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlbums()
  }, [])

  const handleAddAlbum = () => {
    setEditingAlbum(null)
    setFormOpen(true)
  }

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album)
    setFormOpen(true)
  }

  const handleDeleteAlbum = (album: Album) => {
    setDeleteDialog({ open: true, album })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.album) return

    try {
      setDeleteLoading(true)
      await apiService.deleteAlbum(deleteDialog.album.id)
      await fetchAlbums() // Refresh the list
      setDeleteDialog({ open: false, album: null })
    } catch (err: any) {
      console.error('Failed to delete album:', err)
      setError('Failed to delete album')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSuccess = async () => {
    await fetchAlbums() // Refresh the list
  }

  const handleAlbumClick = (album: Album) => {
    setSelectedAlbum(album)
    setSongsDialogOpen(true)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Albums</h2>
            <p className="text-muted-foreground">Loading albums...</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Album
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 w-8 bg-gray-200 rounded"></div>
                </div>
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
          <h2 className="text-3xl font-bold tracking-tight">Albums</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Albums</h2>
          <p className="text-muted-foreground">
            Manage albums and their tracks
          </p>
        </div>
        <Button onClick={handleAddAlbum}>
          <Plus className="mr-2 h-4 w-4" />
          Add Album
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {albums.map((album) => (
          <Card key={album.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2" onClick={() => handleAlbumClick(album)}>
              <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={getImageUrl(album.image)}
                  alt={album.title}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    // Fallback for missing images
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white">
                  <Badge variant={album.status === 'published' ? 'default' : 'secondary'}>
                    {album.status}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-lg">{album.title}</CardTitle>
              <p className="text-sm text-muted-foreground">by {album.artist.name}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Music className="mr-1 h-4 w-4" />
                    {album.totalSongs} tracks
                  </div>
                  <div className="font-medium">{formatPrice(album.price)}</div>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  {formatDate(album.release_date)}
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditAlbum(album)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteAlbum(album)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Album Form Dialog */}
      <AlbumForm
        open={formOpen}
        onOpenChange={setFormOpen}
        album={editingAlbum}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, album: null })}
        onConfirm={confirmDelete}
        title="Delete Album"
        description={`Are you sure you want to delete "${deleteDialog.album?.title}"? This action cannot be undone and will also delete all associated songs.`}
        loading={deleteLoading}
      />
    </div>
  )
}