import React, { useState } from 'react';
import axios from 'axios';
import './MessageActions.css';

const MessageActions = ({ 
  messageId, 
  messageType, 
  currentMessage, 
  createdAt,
  onMessageUpdated,
  onMessageDeleted 
}) => {
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(currentMessage);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if message is within 2 hours
  const canModify = () => {
    const messageTime = new Date(createdAt).getTime();
    const currentTime = new Date().getTime();
    const twoHours = 2 * 60 * 60 * 1000;
    return (currentTime - messageTime) <= twoHours;
  };

  const handleEdit = async () => {
    if (!editedMessage.trim()) {
      setError('Message cannot be empty');
      return;
    }

    try {
      const endpoint = messageType === 'direct' 
        ? `/message-enhancement/direct/${messageId}`
        : `/message-enhancement/channel/${messageId}`;

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        { message: editedMessage },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        onMessageUpdated?.(response.data.data);
        setIsEditing(false);
        setError(null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to edit message');
    }
  };

  const handleDelete = async () => {
    try {
      const endpoint = messageType === 'direct' 
        ? `/message-enhancement/direct/${messageId}`
        : `/message-enhancement/channel/${messageId}`;

      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        onMessageDeleted?.(messageId);
        setShowDeleteConfirm(false);
        setShowActions(false);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete message');
    }
  };

  if (!canModify()) {
    return null; // Don't show actions if message is older than 2 hours
  }

  return (
    <div className="message-actions">
      <button 
        className="actions-toggle"
        onClick={() => setShowActions(!showActions)}
        title="More actions"
      >
        ⋮
      </button>

      {showActions && (
        <div className="actions-menu">
          <button 
            className="action-item edit"
            onClick={() => {
              setIsEditing(true);
              setShowActions(false);
            }}
          >
            ✏️ Edit
          </button>
          <button 
            className="action-item delete"
            onClick={() => setShowDeleteConfirm(true)}
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {isEditing && (
        <div className="edit-container">
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            className="edit-input"
            placeholder="Edit your message..."
          />
          <div className="edit-actions">
            <button 
              className="btn-save"
              onClick={handleEdit}
            >
              Save
            </button>
            <button 
              className="btn-cancel"
              onClick={() => {
                setIsEditing(false);
                setEditedMessage(currentMessage);
                setError(null);
              }}
            >
              Cancel
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}

      {showDeleteConfirm && (
        <div className="delete-confirm">
          <p>Are you sure you want to delete this message?</p>
          <div className="confirm-actions">
            <button 
              className="btn-confirm-delete"
              onClick={handleDelete}
            >
              Delete
            </button>
            <button 
              className="btn-cancel-delete"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageActions;
