import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from '../store/authSlice';
import productsReducer from '../features/products/productsSlice';
import cartReducer from '../features/cart/cartSlice';
import ordersReducer from '../store/orderSlice';
import { authMiddleware, checkAuthTokenOnLoad } from '../utils/authMiddleware';

const authPersistConfig = {
  key: 'auth',
  storage,
};

const productsPersistConfig = {
  key: 'products',
  storage,
};

const cartPersistConfig = {
  key: 'cart',
  storage,
};

const store = configureStore({
  reducer: {
    auth: persistReducer(authPersistConfig, authReducer),
    products: persistReducer(productsPersistConfig, productsReducer),
    cart: persistReducer(cartPersistConfig, cartReducer),
    orders: ordersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(authMiddleware),
});

// Проверяем токен при загрузке приложения и обновляем состояние, если нужно
const user = checkAuthTokenOnLoad();
if (user && store.getState().auth.user === null) {
  // Если у нас есть пользователь в localStorage, но Redux не знает о нем,
  // возможно, приложение было перезагружено и нужно обновить состояние
  store.dispatch({ type: 'auth/setUser', payload: user });
}

export const persistor = persistStore(store);

export default store;
