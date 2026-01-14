import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { registerUser, login } from '../store/authSlice';
import styles from '../styles/LoginRegisterModal.module.css';

function LoginRegisterModal({ visible, onClose, onLogin }){
  const dispatch = useDispatch();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!visible) return null;

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const result = await dispatch(login(form));
      if (result.payload) {
        if (onLogin) onLogin(result.payload);
        setMessage('Вы успешно вошли');
        setTimeout(() => {
          setLoading(false);
          onClose();
        }, 700);
      } else {
        setMessage(result.error?.message || 'Ошибка входа');
        setLoading(false);
      }
    } catch (error) {
      console.error('Ошибка входа:', error);
      setMessage('Ошибка входа');
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const result = await dispatch(registerUser(form));
      if (result.payload) {
        setMessage('Регистрация успешна. Теперь войдите.');
        setMode('login');
        setLoading(false);
      } else {
        setMessage(result.error?.message || 'Ошибка регистрации');
        setLoading(false);
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      setMessage('Ошибка регистрации');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose}>✕</button>

        <div className={styles.switch}>
          <button
            className={mode === 'login' ? styles.active : ''}
            onClick={() => { setMode('login'); setMessage(null); }}
          >
            Вход
          </button>
          <button
            className={mode === 'register' ? styles.active : ''}
            onClick={() => { setMode('register'); setMessage(null); }}
          >
            Регистрация
          </button>
        </div>

        {message && <div className={styles.message}>{message}</div>}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className={styles.form}>
            <label>Email<input name="email" value={form.email} onChange={handleChange} required /></label>
            <label>Пароль<input type="password" name="password" value={form.password} onChange={handleChange} required /></label>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Вхожу...' : 'Войти'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className={styles.form}>
            <label>Email<input name="email" value={form.email} onChange={handleChange} required /></label>
            <label>Пароль<input type="password" name="password" value={form.password} onChange={handleChange} required /></label>
            <label>Имя<input name="firstName" value={form.firstName} onChange={handleChange} /></label>
            <label>Фамилия<input name="lastName" value={form.lastName} onChange={handleChange} /></label>
            <button type="submit" className={styles.submit} disabled={loading}>
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginRegisterModal;
