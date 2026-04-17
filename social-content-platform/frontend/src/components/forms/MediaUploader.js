'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image, Video } from 'lucide-react';
import { mediaAPI } from '@/lib/api';
import Button from './ui/Button';

export default function MediaUploader({ onUpload, multiple = true }) {
  const [uploading, setUploading] = useState(false);
  const [previewFiles, setPreviewFiles] = useState([]);

  const onDrop = async (acceptedFiles) => {
    setUploading(true);
    
    try {
      const uploadedMedia = [];
      
      for (const file of acceptedFiles) {
        // Add to preview
        const preview = {
          name: file.name,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: URL.createObjectURL(file),
          file,
        };
        
        setPreviewFiles(prev => [...prev, preview]);
        
        // Upload to server
        const response = await mediaAPI.upload(file);
        uploadedMedia.push(response.data.media);
      }
      
      if (onUpload) {
        onUpload(uploadedMedia);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file(s)');
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi'],
    },
    multiple,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removePreview = (index) => {
    setPreviewFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-colors
          ${isDragActive 
            ? 'border-slate-900 bg-slate-50' 
            : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-10 h-10 mx-auto text-slate-400 mb-4" />
        <p className="text-sm text-slate-600 mb-2">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag & drop files here, or click to select'}
        </p>
        <p className="text-xs text-slate-500">
          Supports: Images (PNG, JPG, GIF, WebP) and Videos (MP4, MOV, AVI)
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Maximum file size: 10MB
        </p>
      </div>

      {uploading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
          <span className="ml-2 text-sm text-slate-600">Uploading...</span>
        </div>
      )}

      {previewFiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewFiles.map((file, index) => (
            <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200">
              {file.type === 'video' ? (
                <video src={file.url} className="w-full h-full object-cover" />
              ) : (
                <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removePreview(index)}
                  className="p-2 bg-white rounded-full hover:bg-red-50"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs px-2 py-1 truncate">
                {file.name}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
