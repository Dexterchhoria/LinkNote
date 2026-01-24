import React, { useState, useEffect } from 'react';
import AuthModal from './components/AuthModal';
import LinkForm from './components/LinkForm';
import LinkCard from './components/LinkCard';
import { authAPI, linksAPI } from './api';
import type { Link, User } from './types';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [links, setLinks] = useState<Link[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [googleClientId, setGoogleClientId] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      validateToken();
    }
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await authAPI.getConfig();
      setGoogleClientId(response.data.googleClientId);
    } catch (error) {
      console.error('Failed to load config');
    }
  };

  const validateToken = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data.user);
      loadLinks();
      loadCategories();
    } catch (error) {
      logout();
    }
  };

  const loadLinks = async () => {
    try {
      const response = await linksAPI.getAll({ search: searchTerm, category: categoryFilter, sortBy });
      setLinks(response.data.links);
    } catch (error) {
      showNotification('Failed to load links', 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await linksAPI.getCategories();
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const handleLogin = async (user: User) => {
    setUser(user);
    await loadLinks();
    await loadCategories();
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setLinks([]);
    setCategories([]);
  };

  const handleAddLink = async (linkData: Omit<Link, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await linksAPI.create(linkData);
      setLinks([response.data.link, ...links]);
      showNotification('Link added successfully!', 'success');
      await loadCategories();
    } catch (error) {
      showNotification('Failed to add link', 'error');
    }
  };

  const handleUpdateLink = async (id: number, linkData: Partial<Link>) => {
    try {
      const response = await linksAPI.update(id, linkData);
      setLinks(links.map(link => link.id === id ? response.data.link : link));
      setEditingLink(null);
      showNotification('Link updated successfully!', 'success');
      await loadCategories();
    } catch (error) {
      showNotification('Failed to update link', 'error');
    }
  };

  const handleDeleteLink = async (id: number) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await linksAPI.delete(id);
      setLinks(links.filter(link => link.id !== id));
      showNotification('Link deleted successfully!', 'success');
      await loadCategories();
    } catch (error) {
      showNotification('Failed to delete link', 'error');
    }
  };

  const handleEditLink = (link: Link) => {
    setEditingLink(link);
  };

  const exportLinks = () => {
    const dataStr = JSON.stringify(links, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    const exportFileDefaultName = `links_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  useEffect(() => {
    if (user) {
      loadLinks();
    }
  }, [searchTerm, categoryFilter, sortBy]);

  if (!user) {
    return <AuthModal onLogin={handleLogin} googleClientId={googleClientId} />;
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn ${
            notification.type === 'success' ? 'bg-primary' : 'bg-red-500'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <h1 className="text-2xl font-bold">LinkNote</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-secondary">Welcome, {user.username}!</span>
            <button
              onClick={exportLinks}
              className="px-4 py-2 bg-card hover:bg-border rounded-lg transition-colors"
            >
              Export Links
            </button>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Links List - Left Side */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search and Filters */}
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  type="text"
                  placeholder="Search links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                />
                
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                </select>
              </div>
            </div>

            {/* Links Grid */}
            <div className="space-y-4">
              {links.length === 0 ? (
                <div className="bg-card p-8 rounded-lg border border-border text-center text-secondary">
                  <p>No links found. Add your first link using the form!</p>
                </div>
              ) : (
                links.map(link => (
                  <LinkCard
                    key={link.id}
                    link={link}
                    onEdit={handleEditLink}
                    onDelete={handleDeleteLink}
                  />
                ))
              )}
            </div>
          </div>

          {/* Link Form - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <LinkForm
                onSubmit={editingLink ? (data) => handleUpdateLink(editingLink.id, data) : handleAddLink}
                editingLink={editingLink}
                onCancelEdit={() => setEditingLink(null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
