import { ReactNode, memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SearchForm } from './SearchForm';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main Layout Component
 * Provides consistent header, navigation, and footer across all pages
 */
export const Layout = memo(function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isPortfolioPage = location.pathname === '/portfolio';

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link 
              to="/" 
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">StockView</h1>
                <p className="text-xs text-slate-400">Market Dashboard</p>
              </div>
            </Link>

            {/* Search Form */}
            <div className="flex-1 max-w-md mx-4 lg:mx-8">
              <SearchForm />
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isHomePage
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/portfolio"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isPortfolioPage
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                Portfolio
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              Stock Market Dashboard - Real-time market data and analysis
            </p>
            <p className="text-xs text-slate-500">
              Data provided by Finnhub. For educational purposes only.
            </p>
          </div>
          {/* Signature */}
          <div className="mt-4 pt-4 border-t border-slate-700/30 text-center">
            <p className="text-sm text-slate-400">
              Created by{' '}
              <a
                href="https://serkanbayraktar.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Serkanby
              </a>
              {' | '}
              <a
                href="https://github.com/Serkanbyx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 transition-colors"
              >
                Github
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
});
