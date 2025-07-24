"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Play, Download } from "lucide-react"
import { apiService, formatDuration, formatPrice, type Song } from "@/lib/api"
import SongForm from "@/components/forms/SongForm"
import DeleteDialog from "@/components/ui/delete-dialog"

interface SongWithStats extends Song {
  plays: number
  downloads: number
  status: string
}

export default function SongsPage() {
  const [songs, setSongs] = useState<SongWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; song: Song | null }>({
    open: false,
    song: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchSongs = async () => {
    try {
      setLoading(true)
      
      const songsData = await apiService.getSongs()

      // Add mock stats since they're not in the Django model yet
      const songsWithStats: SongWithStats[] = songsData.map(song => ({
        ...song,
        plays: Math.floor(Math.random() * 5000), // Mock data
        downloads: Math.floor(Math.random() * 200), // Mock data
        status: song.is_free ? "free" : "published"
      }))

      setSongs(songsWithStats)
    } catch (err) {
      console.error('Failed to fetch songs:', err)
      setError('Failed to load songs data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSongs()
  }, [])

  const handleAddSong = () => {
    setEditingSong(null)
    setFormOpen(true)
  }

  const handleEditSong = (song: Song) => {
    setEditingSong(song)
    setFormOpen(true)
  }

  const handleDeleteSong = (song: Song) => {
    setDeleteDialog({ open: true, song })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.song) return

    try {
      setDeleteLoading(true)
      await apiService.deleteSong(deleteDialog.song.id)
      await fetchSongs() // Refresh the list
      setDeleteDialog({ open: false, song: null })
    } catch (err: unknown) {
      console.error('Failed to delete song:', err)
      setError('Failed to delete song')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleFormSuccess = async () => {
    await fetchSongs() // Refresh the list
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Songs</h2>
            <p className="text-muted-foreground">Loading songs...</p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Song
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>All Songs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Songs</h2>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Songs</h2>
          <p className="text-muted-foreground">
            Manage individual tracks and their metadata
          </p>
        </div>
        <Button onClick={handleAddSong}>
          <Plus className="mr-2 h-4 w-4" />
          Add Song
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Songs</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Artist</TableHead>
                <TableHead>Album</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Plays</TableHead>
                <TableHead>Downloads</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {songs.map((song) => (
                <TableRow key={song.id}>
                  <TableCell className="font-medium">{song.title}</TableCell>
                  <TableCell>{song.artist.name}</TableCell>
                  <TableCell>{song.album.title}</TableCell>
                  <TableCell>{formatDuration(song.duration)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Play className="mr-1 h-3 w-3" />
                      {song.plays.toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Download className="mr-1 h-3 w-3" />
                      {song.downloads}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(song.price)}</TableCell>
                  <TableCell>
                    <Badge variant={song.status === 'published' ? 'default' : 'secondary'}>
                      {song.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditSong(song)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteSong(song)}
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

      {/* Song Form Dialog */}
      <SongForm
        open={formOpen}
        onOpenChange={setFormOpen}
        song={editingSong}
        onSuccess={handleFormSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, song: null })}
        onConfirm={confirmDelete}
        title="Delete Song"
        description={`Are you sure you want to delete "${deleteDialog.song?.title}"? This action cannot be undone.`}
        loading={deleteLoading}
      />
    </div>
  )
}