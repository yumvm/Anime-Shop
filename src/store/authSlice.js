import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { register, login as loginApi, getUser, updateUser } from '../utils/api';

const initialState = {
  user: null,
  profile: null,
  status: 'idle',
  error: null
};

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await register(formData);
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response.user;
    } catch (error) {
      return rejectWithValue(error.body?.error || 'Ошибка регистрации');
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (formData, { rejectWithValue }) => {
    try {
      const response = await loginApi(formData);
      if (response.token) {
        localStorage.setItem('auth_token', response.token);
      }
      return response.user;
    } catch (error) {
      return rejectWithValue(error.body?.error || 'Ошибка входа');
    }
  }
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await getUser(userId);
      return response.user;
    } catch (error) {
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка получения профиля');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, { rejectWithValue }) => {
    try {
      const { id, ...updateData } = userData;
      const response = await updateUser(id, updateData);
      return response.user;
    } catch (error) {
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка обновления профиля');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.profile = null;
      state.status = 'idle';
      state.error = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('current_user');
    },
    clearError(state) {
      state.error = null;
    },
    setUser(state, action) {
      state.user = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })

      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      
      .addCase(updateProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

// --- Selectors ---
export const selectUser = (state) => state.auth.user;
export const selectProfile = (state) => state.auth.profile;
export const selectStatus = (state) => state.auth.status;
export const selectError = (state) => state.auth.error;

// Мемоизированный селектор для избежания лишних ререндеров
export const selectAuthState = createSelector(
  [selectUser, selectProfile, selectStatus, selectError],
  (user, profile, status, error) => ({
    user,
    profile,
    status,
    error
  })
);

export const { logout, clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
