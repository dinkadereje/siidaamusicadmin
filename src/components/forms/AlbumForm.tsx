"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import FilePreview from "@/components/ui/file-preview"
import { apiService, type Album, type Artist } from "@/lib/api"

interface AlbumFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  album?: Album | null
  onSuccess: () => void
}

export default function AlbumForm({ open, onOpenChange, album, onSuccess }: AlbumFormProps) {
  const [formData, setFormData] = useState({
    title: album?.title || '',
    description: album?.description || '',
    release_date: album?.release_date || '',
    price: album?.price || '',
    artist: album?.artist.id.toString() || ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [artists, setArtists] = useState<Artist[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsData = await apiService.getArtists()
        setArtists(artistsData)
      } catch (err) {
        console.error('Failed to fetch artists:', err)
      }
    }

    if (open) {
      fetchArtists()
    }
  }, [open])

  useEffect(() => {
    if (album) {
      setFormData({
        title: album.title,
        description: album.description,
        release_date: album.release_date,
        price: album.price,
        artist: album.artist.id.toString()
      })
    } else {
      setFormData({
        title: '',
        description: '',
        release_date: '',
        price: '',
        artist: ''
      })
    }
    setImageFile(null)
  }, [album])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('release_date', formData.release_date)
      formDataToSend.append('price', formData.price)
      formDataToSend.append('artist', formData.artist)
      
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      if (album) {
        // Update existing album
        await apiService.updateAlbum(album.id, formDataToSend)
      } else {
        // Create new album
        await apiService.createAlbum(formDataToSend)
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save album'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {album ? 'Edit Album' : 'Add New Album'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Album Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter album title"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Artist *</Label>
            <Select
              value={formData.artist}
              onValueChange={(value) => handleChange('artist', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an artist" />
              </SelectTrigger>
              <SelectContent>
                {artists.map((artist) => (
                  <SelectItem key={artist.id} value={artist.id.toString()}>
                    {artist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter album description"
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="release_date">Release Date *</Label>
              <Input
                id="release_date"
                type="date"
                value={formData.release_date}
                onChange={(e) => handleChange('release_date', e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleChange('price', e.target.value)}
                placeholder="0.00"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Cover Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <FilePreview
              file={imageFile}
              currentFileUrl={album?.image}
              fileType="image"
              onRemove={() => setImageFile(null)}
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
              disabled={loading || !formData.title.trim() || !formData.artist || !formData.price}
            >
              {loading ? 'Saving...' : album ? 'Update Album' : 'Create Album'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}