import React, { useState } from 'react';
import { authAPI } from '../api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import type { User } from '../types';

interface AuthModalProps {
  onLogin: (user: User) => void;
  googleClientId: string;
}

const AuthModal: React.FC<AuthModalProps> = ({ onLogin, googleClientId }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = isLogin
        ? await authAPI.login(formData.email, formData.password)
        : await authAPI.register(formData.username, formData.email, formData.password);

      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        onLogin(response.data.user);
      }
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'An error occurred', type: 'error' });
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      const response = await authAPI.googleAuth(credentialResponse.credential);
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        onLogin(response.data.user);
      }
    } catch (error: any) {
      setMessage({ text: error.response?.data?.message || 'Google sign-in failed', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-card p-10 rounded-2xl shadow-2xl max-w-md w-full mx-4 animate-fadeIn">
        <h2 className="text-3xl font-bold text-primary mb-2 text-center">Welcome to LinkNote</h2>
        <p className="text-text-secondary text-center mb-8">Sign in to manage your personal links</p>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              isLogin
                ? 'bg-primary text-white'
                : 'bg-transparent border-2 border-border text-text-secondary'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
              !isLogin
                ? 'bg-primary text-white'
                : 'bg-transparent border-2 border-border text-text-secondary'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-text-primary font-semibold mb-2">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition"
                placeholder="Choose a username"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-text-primary font-semibold mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-text-primary font-semibold mb-2">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition"
              placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition transform hover:-translate-y-0.5 shadow-lg"
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-border"></div>
          <span className="px-4 text-text-secondary text-sm">OR</span>
          <div className="flex-1 border-t border-border"></div>
        </div>

        <GoogleOAuthProvider clientId={googleClientId}>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setMessage({ text: 'Google sign-in failed', type: 'error' })}
              size="large"
              width="100%"
            />
          </div>
        </GoogleOAuthProvider>

        {message.text && (
          <div
            className={`mt-4 p-3 rounded-lg text-center font-medium ${
              message.type === 'error'
                ? 'bg-red-900 bg-opacity-20 text-red-400'
                : 'bg-green-900 bg-opacity-20 text-green-400'
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
