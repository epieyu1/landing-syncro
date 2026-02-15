import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MapPage from './pages/MapPage';
import Leads from './pages/Leads';
import Campaigns from './pages/Campaigns';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<MapPage />} />
          <Route path="leads" element={<Leads />} />
          <Route path="campaigns" element={<Campaigns />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
