import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { createOrder as createOrderApi, getOrdersByUser as getOrdersByUserApi } from '../utils/api';

// Async thunks for server sync
export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await createOrderApi(orderData);
      return response.order;
    } catch (error) {
      return rejectWithValue(error.body?.error || 'Ошибка создания заказа');
    }
  }
);

export const fetchOrdersByUser = createAsyncThunk(
  'orders/fetchByUser',
  async (userId, { rejectWithValue }) => {
    console.log('fetchOrdersByUser action вызвана для userId:', userId);
    try {
      const response = await getOrdersByUserApi(userId);
      console.log('Ответ от сервера для заказов пользователя:', userId, response);
      return { userId, orders: response.orders };
    } catch (error) {
      console.error('Ошибка загрузки заказов для пользователя:', userId, error);
      return rejectWithValue(error.body?.error || 'Ошибка загрузки заказов');
    }
  }
);

const ordersSlice = createSlice({
  name: 'orders',
  initialState: {},
  reducers: {
    setOrdersForUser(state, action) {
      const { userId, orders } = action.payload;
      state[userId] = orders;
    },
    clearOrders(state, action) {
      const { userId } = action.payload;
      delete state[userId];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.fulfilled, (state, action) => {
        const order = action.payload;
        console.log('createOrder.fulfilled: Новый заказ создан', order);
        state[order.userId] = state[order.userId] || [];
        state[order.userId].push(order);
        console.log('createOrder.fulfilled: Обновленное состояние заказов для пользователя', order.userId, state[order.userId]);
      })
      .addCase(fetchOrdersByUser.fulfilled, (state, action) => {
        const { userId, orders } = action.payload;
        console.log('fetchOrdersByUser.fulfilled: Загружено заказов для пользователя', userId, ':', orders?.length || 0);
        console.log('fetchOrdersByUser.fulfilled: Данные заказов', orders);
        state[userId] = Array.isArray(orders) ? [...orders] : [];
        console.log('fetchOrdersByUser.fulfilled: Обновленное состояние заказов для пользователя', userId, state[userId]);
        console.log('fetchOrdersByUser.fulfilled: Полное состояние после обновления', state);
      })
      .addCase(fetchOrdersByUser.rejected, (state, action) => {
        console.error('fetchOrdersByUser.rejected: Ошибка загрузки заказов', action.error.message);
        // Optionally handle authentication errors here as well
        if (action.payload && (action.payload.includes('Invalid or expired token') || action.payload.includes('Access token required'))) {
          // The token should have been removed by api.js, component will handle the auth state
          console.error('Authentication error detected in orderSlice');
          // Token was removed by api.js, let the component handle the state change
        }
      });
  }
});

export const { setOrdersForUser, clearOrders } = ordersSlice.actions;
export default ordersSlice.reducer;
