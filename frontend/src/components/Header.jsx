import { Menu, X } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg">MN</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MultNet</h1>
            <p className="text-xs text-gray-500">Fraud Ring Detection</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#dashboard" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">
            Dashboard
          </a>
          <a href="#analyze" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">
            Analyze
          </a>
          <a href="#settings" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">
            Settings
          </a>
        </nav>

        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X size={24} className="text-gray-900" />
          ) : (
            <Menu size={24} className="text-gray-900" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-6 py-4 space-y-3">
          <a href="#dashboard" className="block text-gray-600 hover:text-primary-500 py-2">Dashboard</a>
          <a href="#analyze" className="block text-gray-600 hover:text-primary-500 py-2">Analyze</a>
          <a href="#settings" className="block text-gray-600 hover:text-primary-500 py-2">Settings</a>
        </div>
      )}
    </header>
  );
}