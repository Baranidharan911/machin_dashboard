import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import BrandManagement from './components/BrandManagement';
import FlavorManagement from './components/FlavorManagement';
import NutrientInformation from './components/NutrientInformation';
import PricingWeightManagement from './components/PricingWeightManagement';
import AdvertisementManagement from './components/AdvertisementManagement';
import DashboardOverview from './components/DashboardOverview';
import TransactionsHistory from './components/TransactionsHistory'; // Add TransactionsHistory component
import Sidebar from './components/Sidebar';
import Header from './components/Header'; // Import Header component
import './App.css';

function AppContent() {
  const location = useLocation();
  const noSidebarPaths = ['/login']; // Add paths where Sidebar is not needed

  return (
    <div className="App">
      {/* Conditionally render the Sidebar if the path doesn't match those without a sidebar */}
      {!noSidebarPaths.includes(location.pathname) && <Sidebar />}
      
      <div className={`content ${noSidebarPaths.includes(location.pathname) ? 'full-width' : ''}`}>
        {/* Conditionally render the Header if the path isn't one of those without a sidebar */}
        {!noSidebarPaths.includes(location.pathname) && <Header />}
        
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/brands" element={<BrandManagement />} />
          <Route path="/flavors" element={<FlavorManagement />} />
          <Route path="/nutrients" element={<NutrientInformation />} />
          <Route path="/pricing" element={<PricingWeightManagement />} />
          <Route path="/advertisement" element={<AdvertisementManagement />} />
          <Route path="/TransactionHistory" element={<TransactionsHistory />} /> {/* Add Transactions History route */}
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
