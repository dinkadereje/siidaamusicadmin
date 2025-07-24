"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import FilePreview from "@/components/ui/file-preview"
import { apiService, type Artist } from "@/lib/api"

interface ArtistFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artist?: Artist | null
  onSuccess: () => void
}

export default function ArtistForm({ open, onOpenChange, artist, onSuccess }: ArtistFormProps) {
  const [formData, setFormData] = useState({
    name: artist?.name || '',
    bio: artist?.bio || '',
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('bio', formData.bio)
      
      if (imageFile) {
        formDataToSend.append('image', imageFile)
      }

      if (artist) {
        // Update existing artist
        await apiService.updateArtist(artist.id, formDataToSend)
      } else {
        // Create new artist
        await apiService.createArtist(formDataToSend)
      }
      
      onSuccess()
      onOpenChange(false)
      
      // Reset form
      setFormData({ name: '', bio: '' })
      setImageFile(null)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save artist'
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {artist ? 'Edit Artist' : 'Add New Artist'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Artist Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter artist name"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              placeholder="Enter artist biography"
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Artist Image</Label>
            <Input
              id="image"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
            <FilePreview
              file={imageFile}
              currentFileUrl={artist?.image}
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
            <Button type="submit" disabled={loading || !formData.name.trim()}>
              {loading ? 'Saving...' : artist ? 'Update Artist' : 'Create Artist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}