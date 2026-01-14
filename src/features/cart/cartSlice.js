import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCart, updateCart } from '../../utils/api';

// Async thunks for server sync
export const loadCartFromServer = createAsyncThunk(
  'cart/loadFromServer',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('Loading cart from server for user:', userId);
      const response = await getCart(userId);
      console.log('Loaded cart items:', response.items);
      return response.items;
    } catch (error) {
      console.error('Error loading cart from server:', error);
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка загрузки корзины');
    }
  }
);

export const saveCartToServer = createAsyncThunk(
  'cart/saveToServer',
  async ({ userId, items }, { rejectWithValue }) => {
    try {
      console.log('Saving cart to server for user:', userId, 'items:', items);
      await updateCart(userId, items);
      console.log('Successfully saved cart to server');
      return items;
    } catch (error) {
      console.error('Error saving cart to server:', error);
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка сохранения корзины');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] },
  reducers: {
    addToCart(state, action) {
      console.log('User action: addToCart', action.payload);
      const existingItem = state.items.find(item => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({ ...action.payload, quantity: action.payload.quantity || 1 });
      }
    },
    removeFromCart(state, action) {
      console.log('User action: removeFromCart', action.payload);
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateQuantity(state, action) {
      console.log('User action: updateQuantity', action.payload);
      const { id, quantity } = action.payload;
      const existingItem = state.items.find(item => item.id === id);
      if (existingItem) {
        existingItem.quantity = quantity;
        if (quantity <= 0) {
          state.items = state.items.filter(item => item.id !== id);
        }
      }
    },
    clearCart(state) {
      console.log('User action: clearCart');
      state.items = [];
    },
    setCartItems(state, action) {
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartFromServer.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(saveCartToServer.fulfilled, (state, action) => {
        state.items = action.payload;
      });
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart, setCartItems } = cartSlice.actions;
export default cartSlice.reducer;
