"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Edit, Trash2, Plus } from "lucide-react"
import { apiService, formatDuration, formatPrice, type Album, type Song } from "@/lib/api"
import SongForm from "@/components/forms/SongForm"
import DeleteDialog from "@/components/ui/delete-dialog"

interface AlbumSongsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  album: Album | null
}

interface SongWithStats extends Song {
  plays: number
  downloads: number
  status: string
}

export default function AlbumSongsDialog({ open, onOpenChange, album }: AlbumSongsDialogProps) {
  const [songs, setSongs] = useState<SongWithStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [songFormOpen, setSongFormOpen] = useState(false)
  const [editingSong, setEditingSong] = useState<Song | null>(null)
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; song: Song | null }>({
    open: false,
    song: null
  })
  const [deleteLoading, setDeleteLoading] = useState(false)

  const fetchAlbumSongs = async () => {
    if (!album) return

    try {
      setLoading(true)
      setError(null)
      
      const allSongs = await apiService.getSongs()
      const albumSongs = allSongs.filter(song => song.album.id === album.id)

      // Add mock stats since they're not in the Django model yet
      const songsWithStats: SongWithStats[] = albumSongs.map(song => ({
        ...song,
        plays: Math.floor(Math.random() * 5000), // Mock data
        downloads: Math.floor(Math.random() * 200), // Mock data
        status: song.is_free ? "free" : "published"
      }))

      setSongs(songsWithStats)
    } catch (err) {
      console.error('Failed to fetch album songs:', err)
      setError('Failed to load songs for this album')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && album) {
      fetchAlbumSongs()
    }
  }, [open, album])

  const handleAddSong = () => {
    setEditingSong(null)
    setSongFormOpen(true)
  }

  const handleEditSong = (song: Song) => {
    setEditingSong(song)
    setSongFormOpen(true)
  }

  const handleDeleteSong = (song: Song) => {
    setDeleteDialog({ open: true, song })
  }

  const confirmDelete = async () => {
    if (!deleteDialog.song) return

    try {
      setDeleteLoading(true)
      await apiService.deleteSong(deleteDialog.song.id)
      await fetchAlbumSongs() // Refresh the list
      setDeleteDialog({ open: false, song: null })
    } catch (err: any) {
      console.error('Failed to delete song:', err)
      setError('Failed to delete song')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSongFormSuccess = async () => {
    await fetchAlbumSongs() // Refresh the list
  }

  if (!album) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div>
                Songs in "{album.title}"
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  by {album.artist.name} • {songs.length} tracks
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading songs...</span>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-500">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchAlbumSongs}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : songs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No songs in this album yet</p>
                <Button onClick={handleAddSong}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Song
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {songs.length} song{songs.length !== 1 ? 's' : ''} • Total duration: {
                      songs.reduce((total, song) => {
                        const [hours, minutes, seconds] = song.duration.split(':').map(Number)
                        return total + hours * 3600 + minutes * 60 + seconds
                      }, 0)
                    } seconds
                  </p>
                  <Button onClick={handleAddSong} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Song
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Plays</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {songs.map((song, index) => (
                      <TableRow key={song.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium">{song.title}</TableCell>
                        <TableCell>{formatDuration(song.duration)}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Play className="mr-1 h-3 w-3" />
                            {song.plays.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          {song.is_free ? (
                            <Badge variant="secondary">Free</Badge>
                          ) : (
                            formatPrice(song.price)
                          )}
                        </TableCell>
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Song Form Dialog */}
      <SongForm
        open={songFormOpen}
        onOpenChange={setSongFormOpen}
        song={editingSong}
        defaultAlbumId={album?.id}
        onSuccess={handleSongFormSuccess}
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
    </>
  )
}