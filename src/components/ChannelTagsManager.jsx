import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChannelTagsManager.css';

const ChannelTagsManager = ({ channelId, onSave }) => {
  const [selectedStatus, setSelectedStatus] = useState('Active');
  const [customTags, setCustomTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const statusOptions = ['Active', 'Archived', 'Inactive'];
  const maxCustomTags = 2;

  const handleAddCustomTag = () => {
    if (!newTag.trim()) return;
    if (customTags.length >= maxCustomTags) {
      setError(`Maximum ${maxCustomTags} custom tags allowed`);
      return;
    }
    if (customTags.includes(newTag.trim())) {
      setError('Tag already exists');
      return;
    }

    setCustomTags([...customTags, newTag.trim()]);
    setNewTag('');
    setError(null);
  };

  const handleRemoveCustomTag = (tag) => {
    setCustomTags(customTags.filter(t => t !== tag));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/channel-management/${channelId}/tags`,
        {
          tags: [selectedStatus],
          customTags: customTags
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Channel tags updated successfully');
        onSave?.(response.data.data);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save tags');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="channel-tags-manager">
      <h3>Channel Tags</h3>
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label htmlFor="status">Channel Status</label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="status-select"
          >
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Custom Tags ({customTags.length}/{maxCustomTags})</label>
          <div className="custom-tags-input">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add a custom tag"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomTag();
                }
              }}
              disabled={customTags.length >= maxCustomTags}
            />
            <button
              type="button"
              onClick={handleAddCustomTag}
              disabled={customTags.length >= maxCustomTags || !newTag.trim()}
              className="btn-add-tag"
            >
              Add
            </button>
          </div>

          <div className="tags-container">
            {customTags.map(tag => (
              <div key={tag} className="tag-item">
                <span>{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomTag(tag)}
                  className="btn-remove-tag"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button
          type="submit"
          disabled={isSaving}
          className="btn-save"
        >
          {isSaving ? 'Saving...' : 'Save Tags'}
        </button>
      </form>
    </div>
  );
};

export default ChannelTagsManager;
