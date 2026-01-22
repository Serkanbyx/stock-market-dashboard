import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { StockDetail } from './pages/StockDetail';

/**
 * Main Application Component
 * Handles routing between Dashboard and Stock Detail pages
 */
function App() {
  return (
    <Layout>
      <Routes>
        {/* Dashboard - Main landing page */}
        <Route path="/" element={<Dashboard />} />
        
        {/* Stock Detail - Individual stock analysis */}
        <Route path="/stock/:symbol" element={<StockDetail />} />
        
        {/* Redirect any unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
