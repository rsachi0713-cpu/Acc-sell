import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Sell from './pages/Sell';
import ListingView from './pages/ListingView';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AdminLogin from './pages/AdminLogin';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<SellerDashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/listing/:id" element={<ListingView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
