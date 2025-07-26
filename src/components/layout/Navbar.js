import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/DemoAuthContext';
import NotificationCenter from '../notifications/NotificationCenter';

const Navbar = () => {
  console.log('🧭 Navbar: Rendering...');
  
  const { user, userProfile, signInWithGoogle, signInAsGuest, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '🏙️' },
    { name: 'Report', href: '/report', icon: '📍' },
    { name: 'Analytics', href: '/analytics', icon: '📊' },
    { name: 'Diagnostics', href: '/diagnostics', icon: '🔍' },
  ];

  const isActive = (path) => {
    return location.pathname === path || (path === '/dashboard' && location.pathname === '/');
  };

  const handleSignIn = async (method) => {
    try {
      if (method === 'google') {
        await signInWithGoogle();
      } else if (method === 'guest') {
        await signInAsGuest();
      }
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50">
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-white/80 backdrop-filter backdrop-blur-xl border-b border-white/20"></div>
      
      <div className="relative container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <span className="text-white font-bold text-lg">N</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NextSignal
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-3">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`modern-btn flex items-center space-x-2 transition-all duration-300 ${
                  isActive(item.href)
                    ? 'btn-toggle active'
                    : 'btn-toggle hover:scale-105'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <NotificationCenter />
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="modern-btn btn-toggle flex items-center space-x-3 pr-3"
                  >
                    {userProfile?.photoURL ? (
                      <img
                        src={userProfile.photoURL}
                        alt="Profile"
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-semibold">
                          {userProfile?.displayName?.charAt(0) || 'D'}
                        </span>
                      </div>
                    )}
                    <span className="hidden sm:block font-medium text-gray-700">
                      {userProfile?.displayName || 'Demo User'}
                    </span>
                    <span className="material-icons text-gray-600">arrow_drop_down</span>
                  </button>

                  {showUserMenu && (
                    <>
                      {/* Backdrop */}
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setShowUserMenu(false)}
                      />
                      
                      {/* Dropdown Menu */}
                      <div className="absolute right-0 mt-2 w-56 z-50">
                        <div className="modern-card border border-white/30 shadow-xl">
                          <div className="p-2">
                            <Link
                              to="/profile"
                              className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                              onClick={() => setShowUserMenu(false)}
                            >
                              <span className="material-icons text-blue-600">person</span>
                              <span className="font-medium">Profile Settings</span>
                            </Link>
                            <button
                              onClick={handleSignOut}
                              className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-red-50 rounded-lg transition-colors text-left"
                            >
                              <span className="material-icons text-red-600">logout</span>
                              <span className="font-medium">Sign Out</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSignIn('guest')}
                  className="modern-btn btn-toggle"
                >
                  Continue as Guest
                </button>
                <button
                  onClick={() => handleSignIn('google')}
                  className="modern-btn btn-primary flex items-center space-x-2"
                >
                  <span className="material-icons">login</span>
                  <span>Sign In</span>
                </button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden modern-btn btn-toggle p-2"
            >
              <span className="material-icons">
                {isMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40 md:hidden"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Mobile Menu */}
            <div className="md:hidden absolute left-0 right-0 top-full z-50">
              <div className="mx-6 mt-2 modern-card border border-white/30 shadow-xl">
                <div className="p-4">
                  {/* Horizontal Navigation for Mobile */}
                  <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`modern-btn flex items-center space-x-2 flex-shrink-0 transition-all duration-300 ${
                          isActive(item.href)
                            ? 'btn-toggle active'
                            : 'btn-toggle'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium text-sm">{item.name}</span>
                      </Link>
                    ))}
                  </div>
                  
                  {/* Mobile User Actions */}
                  {!user && (
                    <div className="pt-3 border-t border-gray-200 space-y-2">
                      <button
                        onClick={() => {
                          handleSignIn('guest');
                          setIsMenuOpen(false);
                        }}
                        className="w-full modern-btn btn-toggle justify-center"
                      >
                        Continue as Guest
                      </button>
                      <button
                        onClick={() => {
                          handleSignIn('google');
                          setIsMenuOpen(false);
                        }}
                        className="w-full modern-btn btn-primary justify-center"
                      >
                        <span className="material-icons mr-2">login</span>
                        Sign In
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 