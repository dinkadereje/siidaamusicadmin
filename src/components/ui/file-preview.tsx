"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Eye } from "lucide-react"
import Image from "next/image"

interface FilePreviewProps {
  file?: File | null
  currentFileUrl?: string
  fileType: 'image' | 'audio'
  onRemove?: () => void
  className?: string
}

export default function FilePreview({ 
  file, 
  currentFileUrl, 
  fileType, 
  onRemove,
  className = "" 
}: FilePreviewProps) {
  const [showPreview, setShowPreview] = useState(false)

  if (!file && !currentFileUrl) return null

  const fileName = file?.name || currentFileUrl?.split('/').pop() || 'Unknown file'
  const fileSize = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : ''
  const previewUrl = file ? URL.createObjectURL(file) : currentFileUrl

  return (
    <div className={`border rounded-lg p-3 bg-muted/50 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName}</p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">{fileSize}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2 ml-2">
          {fileType === 'image' && previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          
          {fileType === 'audio' && previewUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                const audio = new Audio(previewUrl)
                audio.play().catch(console.error)
              }}
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}
          
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {showPreview && fileType === 'image' && previewUrl && (
        <div className="mt-3 border rounded overflow-hidden">
          <Image
            src={previewUrl}
            alt="Preview"
            width={200}
            height={200}
            className="w-full h-auto max-h-48 object-cover"
            onError={() => setShowPreview(false)}
          />
        </div>
      )}
    </div>
  )
}