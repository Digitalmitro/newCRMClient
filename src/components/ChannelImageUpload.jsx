import React, { useState, useRef } from 'react';
import axios from 'axios';
import './ChannelImageUpload.css';

const ChannelImageUpload = ({ channelId, currentImage, onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [preview, setPreview] = useState(currentImage || null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    uploadFile(file);
  };

  const uploadFile = async (file) => {
    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/channel-management/${channelId}/image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Channel image updated successfully');
        onUploadSuccess?.(response.data.data);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setPreview(currentImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/channel-management/${channelId}/image`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setPreview(null);
        setSuccess('Channel image deleted successfully');
        onUploadSuccess?.(null);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete image');
    }
  };

  return (
    <div className="channel-image-upload">
      <h3>Channel Image</h3>
      
      <div className="image-preview-container">
        {preview ? (
          <div className="image-wrapper">
            <img src={preview} alt="Channel" className="channel-image" />
            {!isUploading && (
              <div className="image-actions">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-change"
                  title="Change image"
                >
                  Change
                </button>
                <button
                  onClick={handleDeleteImage}
                  className="btn-delete"
                  title="Delete image"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="no-image">
            <p>No channel image</p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading}
        style={{ display: 'none' }}
      />

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="btn-upload"
      >
        {isUploading ? 'Uploading...' : 'Upload Image'}
      </button>

      {error && <p className="error-message">{error}</p>}
      {success && <p className="success-message">{success}</p>}
    </div>
  );
};

export default ChannelImageUpload;
