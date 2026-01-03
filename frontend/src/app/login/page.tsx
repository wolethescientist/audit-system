'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, twoFactorApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', null, {
        params: { email }
      });
      
      const { access_token, requires_2fa, temp_token } = response.data;
      
      // Check if 2FA is required
      if (requires_2fa) {
        setRequires2FA(true);
        setTempToken(temp_token);
        setLoading(false);
        return;
      }
      
      const userResponse = await api.get('/auth/validate', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      setAuth(userResponse.data, access_token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handle2FAVerify = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await twoFactorApi.verifyLogin(twoFactorCode, tempToken);
      
      if (response.success && response.access_token) {
        const userResponse = await api.get('/auth/validate', {
          headers: { Authorization: `Bearer ${response.access_token}` }
        });
        
        setAuth(userResponse.data, response.access_token);
        router.push('/dashboard');
      } else {
        setError('Verification failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setRequires2FA(false);
    setTempToken('');
    setTwoFactorCode('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Full-screen loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 animate-fade-in">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-800">
                {requires2FA ? 'Verifying code' : 'Signing you in'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Please wait...</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gray-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="glass-card max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img 
              src="/galaxy logo.png" 
              alt="Galaxy Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-2">
            {requires2FA ? 'Two-Factor Authentication' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {requires2FA ? 'Enter the code from your authenticator app' : 'Audit Management System'}
          </p>
        </div>
        
        {!requires2FA ? (
          // Email login form
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  className="input pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary w-full text-lg py-3 relative overflow-hidden group"
              disabled={loading}
            >
              <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity'}>Sign In</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white font-medium">Signing in...</span>
                </div>
              )}
            </button>
          </form>
        ) : (
          // 2FA verification form
          <form onSubmit={handle2FAVerify} className="space-y-5">
            <div>
              <label className="label">Verification Code</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="input pl-10 text-center text-2xl tracking-widest font-mono"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="000000"
                  maxLength={8}
                  required
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Enter the 6-digit code from your authenticator app, or use a backup code
              </p>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-start gap-3 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            <button
              type="submit"
              className="btn btn-primary w-full text-lg py-3 relative overflow-hidden group"
              disabled={loading || twoFactorCode.length < 6}
            >
              <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity'}>Verify</span>
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-white font-medium">Verifying...</span>
                </div>
              )}
            </button>

            <button
              type="button"
              onClick={handleBackToEmail}
              className="w-full text-sm text-gray-600 hover:text-gray-800 py-2"
            >
              ← Back to email
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Secure enterprise authentication</p>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-10 bg-gray-900/80 backdrop-blur-sm py-3">
        <p className="text-center text-sm text-gray-300">
          © 2025 Galaxy Backbone Limited
        </p>
      </div>
    </div>
  );
}
