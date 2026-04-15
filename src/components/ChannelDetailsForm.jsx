import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ChannelDetailsForm.css';

const ChannelDetailsForm = ({ channelId, onSave }) => {
  const [formData, setFormData] = useState({
    purpose: '',
    guidelines: '',
    additionalInfo: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchChannelDetails();
  }, [channelId]);

  const fetchChannelDetails = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/channel-management/${channelId}/details`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setFormData(response.data.data.details || {
          purpose: '',
          guidelines: '',
          additionalInfo: ''
        });
      }
    } catch (err) {
      setError('Failed to load channel details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/channel-management/${channelId}/details`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.data.success) {
        setSuccess('Channel details updated successfully');
        onSave?.(response.data.data);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save channel details');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading channel details...</div>;
  }

  return (
    <div className="channel-details-form">
      <h2>Channel Details</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="purpose">Channel Purpose</label>
          <textarea
            id="purpose"
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            placeholder="What is the main purpose of this channel?"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="guidelines">Channel Guidelines</label>
          <textarea
            id="guidelines"
            name="guidelines"
            value={formData.guidelines}
            onChange={handleChange}
            placeholder="What are the guidelines for this channel?"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="additionalInfo">Additional Information</label>
          <textarea
            id="additionalInfo"
            name="additionalInfo"
            value={formData.additionalInfo}
            onChange={handleChange}
            placeholder="Any additional information about this channel?"
            rows={4}
          />
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        <button 
          type="submit" 
          disabled={isSaving}
          className="btn-save"
        >
          {isSaving ? 'Saving...' : 'Save Details'}
        </button>
      </form>
    </div>
  );
};

export default ChannelDetailsForm;
