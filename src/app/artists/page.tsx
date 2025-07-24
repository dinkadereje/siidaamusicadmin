"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Edit, Trash2, Music } from "lucide-react"
import { apiService, getImageUrl, type Artist, type Album, type Song } from "@/lib/api"
import ArtistForm from "@/components/forms/ArtistForm"
import DeleteDialog from "@/components/ui/delete-dialog"

interface ArtistWithStats extends Artist {
  albums: Album[]
  totalSongs: number
  status: string
}

export default function ArtistsPage() {
  const [artists, setArtists] = useState<ArtistWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; artist: Artist | null }>({
    open: false,
    artist: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchArtists = async () => {
    try {
      setLoading(true)
      
      // Fetch artists, albums, and songs
      const [artistsData, albumsData, songsData] = await Promise.all([
        apiService.getArtists(),
        apiService.getAlbums(),
        apiService.getSongs()
      ])

      // Calculate stats for each artist
      const artistsWithStats: ArtistWithStats[] = artistsData.map(artist => {
        const artistAlbums = albumsData.filter(album => album.artist.id === artist.id)
        const artistSongs = songsData.filter(song => song.artist.id === artist.id)
        
        return {
          ...artist,
          albums: artistAlbums,
          totalSongs: artistSongs.length,
          status: "active" // Default status since it's not in the model
        }
      })

      setArtists(artistsWithStats)
    } catch (err) {
      console.error('Failed to fetch artists:', err)
      setError('Failed to load artists data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArtists()
  }, [])

  const handleAddArtist = () => {
    setEditingArtist(null)
    setFormOpen(true)
  }

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist)
    setFormOpen(true)
  }

  const handleDeleteArtist = (artist: Artist) => {
    setDeleteDialog({ open: true, artist })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.artist) return

    try {
      setDeleteLoading(true)
      await apiService.deleteArtist(deleteDialog.artist.id)
      await fetchArtists() // Refresh the list
      setDeleteDialog({ open: false, artist: null })
    } catch (err: any) {
      console.error('Failed to delete artist:', err)
      setError('Failed to delete artist')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSuccess = async () => {
    await fetchArtists() // Refresh the list
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Artists</h2>
            <p className="text-muted-foreground">Loading artists...</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Artist
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-20 mb-4"></div>
                <div className="flex gap-2">
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
          <h2 className="text-3xl font-bold tracking-tight">Artists</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Artists</h2>
          <p className="text-muted-foreground">
            Manage artists and their content
          </p>
        </div>
        <Button onClick={handleAddArtist}>
          <Plus className="mr-2 h-4 w-4" />
          Add Artist
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {artists.map((artist) => (
          <Card key={artist.id}>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={getImageUrl(artist.image)} alt={artist.name} />
                <AvatarFallback>{artist.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-lg">{artist.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{artist.bio || 'No bio available'}</p>
              </div>
              <Badge variant={artist.status === 'active' ? 'default' : 'secondary'}>
                {artist.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <Music className="mr-1 h-4 w-4" />
                  {artist.albums.length} albums
                </div>
                <div>{artist.totalSongs} songs</div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditArtist(artist)}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDeleteArtist(artist)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Artist Form Dialog */}
      <ArtistForm
        open={formOpen}
        onOpenChange={setFormOpen}
        artist={editingArtist}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, artist: null })}
        onConfirm={confirmDelete}
        title="Delete Artist"
        description={`Are you sure you want to delete "${deleteDialog.artist?.name}"? This action cannot be undone and will also delete all associated albums and songs.`}
        loading={deleteLoading}
      />
    </div>
  )
}