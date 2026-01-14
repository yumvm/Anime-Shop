import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';

const PrivateRoute = ({ children }) => {
  const authUser = useSelector(selectUser);
  const token = localStorage.getItem('auth_token');
  
  // Если нет токена или пользователя, перенаправляем на главную
  if (!token || !authUser) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

export default PrivateRoute;