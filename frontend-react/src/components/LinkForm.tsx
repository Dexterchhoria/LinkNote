import React, { useState } from 'react';
import type { Link } from '../types';

interface LinkFormProps {
  onSubmit: (link: Omit<Link, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void;
  editingLink?: Link | null;
  onCancel?: () => void;
}

const LinkForm: React.FC<LinkFormProps> = ({ onSubmit, editingLink, onCancel }) => {
  const [formData, setFormData] = useState({
    url: editingLink?.url || '',
    title: editingLink?.title || '',
    description: editingLink?.description || '',
    category: editingLink?.category || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!editingLink) {
      setFormData({ url: '', title: '', description: '', category: '' });
    }
  };

  React.useEffect(() => {
    if (editingLink) {
      setFormData({
        url: editingLink.url,
        title: editingLink.title,
        description: editingLink.description || '',
        category: editingLink.category || '',
      });
    }
  }, [editingLink]);

  return (
    <div className="bg-card p-8 rounded-xl shadow-lg sticky top-5">
      <h2 className="text-2xl font-bold text-primary mb-6">
        {editingLink ? 'Edit Link' : 'Add New Link'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-text-primary font-semibold mb-2">URL *</label>
          <input
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition"
            placeholder="https://example.com"
            required
          />
        </div>

        <div>
          <label className="block text-text-primary font-semibold mb-2">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition"
            placeholder="Enter link title"
            required
          />
        </div>

        <div>
          <label className="block text-text-primary font-semibold mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition resize-none"
            placeholder="Add a description for this link..."
            rows={3}
          />
        </div>

        <div>
          <label className="block text-text-primary font-semibold mb-2">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition"
            placeholder="e.g., Work, Personal, Learning"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition transform hover:-translate-y-0.5 shadow-lg"
          >
            {editingLink ? 'Update Link' : 'Add Link'}
          </button>
          {editingLink && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 bg-secondary hover:bg-opacity-80 text-white font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LinkForm;
