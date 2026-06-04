import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy-loaded route pages for code-splitting.
// Heavy dependencies (e.g. Recharts) load only when their page is visited.
const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((module) => ({ default: module.Dashboard }))
);
const StockDetail = lazy(() =>
  import('./pages/StockDetail').then((module) => ({ default: module.StockDetail }))
);
const Portfolio = lazy(() => import('./pages/Portfolio'));

/**
 * Suspense fallback shown while a route chunk is loading
 */
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}

/**
 * Main Application Component
 * Handles routing between Dashboard, Portfolio, and Stock Detail pages
 */
function App() {
  return (
    <Layout>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* Dashboard - Main landing page */}
          <Route path="/" element={<Dashboard />} />

          {/* Portfolio - Virtual portfolio management */}
          <Route path="/portfolio" element={<Portfolio />} />

          {/* Stock Detail - Individual stock analysis */}
          <Route path="/stock/:symbol" element={<StockDetail />} />

          {/* Redirect any unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}

export default App;
