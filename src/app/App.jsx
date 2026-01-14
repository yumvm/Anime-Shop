import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { NotificationProvider } from '../contexts/NotificationContext';
import Header from '../components/Header';
import Home from '../pages/Home';
import Catalog from '../pages/Catalog';
import Cart from '../pages/Cart';
import Profile from '../pages/Profile';
import Favorites from '../pages/Favourites';
import Compare from '../pages/Compare';
import OrderDetails from '../pages/OrderDetails';
import PrivateRoute from '../components/PrivateRoute';
import { useSyncWithServer } from '../utils/syncUtils';

function App() {
  useSyncWithServer(); // Initialize sync with server
  
  return (
    <NotificationProvider>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/cart" element={
          <PrivateRoute>
            <Cart />
          </PrivateRoute>
        } />
        <Route path="/favorites" element={
          <PrivateRoute>
            <Favorites />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        <Route path="/compare" element={
          <PrivateRoute>
            <Compare />
          </PrivateRoute>
        } />
        <Route path="/order/:orderId" element={
          <PrivateRoute>
            <OrderDetails />
          </PrivateRoute>
        } />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
