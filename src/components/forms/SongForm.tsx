"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import FilePreview from "@/components/ui/file-preview"
import { apiService, type Song, type Album } from "@/lib/api"

interface SongFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  song?: Song | null
  defaultAlbumId?: number
  onSuccess: () => void
}

export default function SongForm({ open, onOpenChange, song, defaultAlbumId, onSuccess }: SongFormProps) {
  const [formData, setFormData] = useState({
    title: song?.title || '',
    album: song?.album.id.toString() || '',
    duration: song?.duration || '00:03:00', // Default 3 minutes
    price: song?.price || '',
    is_free: song?.is_free || false,
    lyrics: song?.lyrics || ''
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const albumsData = await apiService.getAlbums()
        setAlbums(albumsData)
      } catch (err) {
        console.error('Failed to fetch albums:', err)
      }
    }

    if (open) {
      fetchAlbums()
    }
  }, [open])

  useEffect(() => {
    if (song) {
      setFormData({
        title: song.title,
        album: song.album.id.toString(),
        duration: song.duration,
        price: song.price,
        is_free: song.is_free,
        lyrics: song.lyrics || ''
      })
    } else {
      setFormData({
        title: '',
        album: defaultAlbumId ? defaultAlbumId.toString() : '',
        duration: '00:03:00',
        price: '',
        is_free: false,
        lyrics: ''
      })
    }
    setAudioFile(null)
    setPreviewFile(null)
  }, [song, defaultAlbumId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('album', formData.album)
      formDataToSend.append('duration', formData.duration)
      formDataToSend.append('price', formData.price || '0')
      formDataToSend.append('is_free', formData.is_free.toString())
      formDataToSend.append('lyrics', formData.lyrics)
      
      if (audioFile) {
        formDataToSend.append('audio_file', audioFile)
      }
      
      if (previewFile) {
        formDataToSend.append('preview_file', previewFile)
      }

      if (song) {
        // Update existing song
        await apiService.updateSong(song.id, formDataToSend)
      } else {
        // Create new song
        await apiService.createSong(formDataToSend)
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save song')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {song ? 'Edit Song' : 'Add New Song'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Song Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter song title"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="album">Album *</Label>
            <Select
              value={formData.album}
              onValueChange={(value) => handleChange('album', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an album" />
              </SelectTrigger>
              <SelectContent>
                {albums.map((album) => (
                  <SelectItem key={album.id} value={album.id.toString()}>
                    {album.title} - {album.artist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (HH:MM:SS) *</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => handleChange('duration', e.target.value)}
                placeholder="00:03:00"
                pattern="[0-9]{2}:[0-9]{2}:[0-9]{2}"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0.00"
                disabled={loading || formData.is_free}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_free"
              checked={formData.is_free}
              onCheckedChange={(checked) => {
                handleChange('is_free', checked as boolean)
                if (checked) {
                  handleChange('price', '0')
                }
              }}
              disabled={loading}
            />
            <Label htmlFor="is_free">This song is free</Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="audio_file">Audio File</Label>
            <Input
              id="audio_file"
              type="file"
              accept="audio/*"
              onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <FilePreview
              file={audioFile}
              currentFileUrl={song?.audio_file}
              fileType="audio"
              onRemove={() => setAudioFile(null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preview_file">Preview File (Optional)</Label>
            <Input
              id="preview_file"
              type="file"
              accept="audio/*"
              onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <FilePreview
              file={previewFile}
              currentFileUrl={song?.preview_file}
              fileType="audio"
              onRemove={() => setPreviewFile(null)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lyrics">Lyrics</Label>
            <Textarea
              id="lyrics"
              value={formData.lyrics}
              onChange={(e) => handleChange('lyrics', e.target.value)}
              placeholder="Enter song lyrics (optional)"
              rows={4}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.title.trim() || !formData.album}
            >
              {loading ? 'Saving...' : song ? 'Update Song' : 'Create Song'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}