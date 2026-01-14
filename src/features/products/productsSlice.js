import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getFavs, updateFavs, getCompare, updateCompare } from '../../utils/api';

export const fetchProducts = createAsyncThunk('products/fetch', async () => {
  const res = await fetch('/api/anime_products.json');
  return await res.json();
});

// Async thunks for server sync
export const loadFavsFromServer = createAsyncThunk(
  'products/loadFavsFromServer',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('Loading favorites from server for user:', userId);
      const response = await getFavs(userId);
      console.log('Loaded favorites:', response.items);
      return response.items;
    } catch (error) {
      console.error('Error loading favorites from server:', error);
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка загрузки избранного');
    }
  }
);

export const saveFavsToServer = createAsyncThunk(
  'products/saveFavsToServer',
  async ({ userId, items }, { rejectWithValue }) => {
    try {
      console.log('Saving favorites to server for user:', userId, 'items:', items);
      await updateFavs(userId, items);
      console.log('Successfully saved favorites to server');
      return items;
    } catch (error) {
      console.error('Error saving favorites to server:', error);
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка сохранения избранного');
    }
  }
);

export const loadCompareFromServer = createAsyncThunk(
  'products/loadCompareFromServer',
  async (userId, { rejectWithValue }) => {
    try {
      console.log('Loading compare from server for user:', userId);
      const response = await getCompare(userId);
      console.log('Loaded compare items:', response.items);
      return response.items;
    } catch (error) {
      console.error('Error loading compare from server:', error);
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка загрузки сравнения');
    }
  }
);

export const saveCompareToServer = createAsyncThunk(
  'products/saveCompareToServer',
  async ({ userId, items }, { rejectWithValue }) => {
    try {
      console.log('Saving compare to server for user:', userId, 'items:', items);
      await updateCompare(userId, items);
      console.log('Successfully saved compare to server');
      return items;
    } catch (error) {
      console.error('Error saving compare to server:', error);
      // The token should have been removed by api.js, component will handle the auth state
      if (error.status === 401 || error.status === 403) {
        // Token was removed by api.js, let the component handle the state change
      }
      return rejectWithValue(error.body?.error || 'Ошибка сохранения сравнения');
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState: { 
    items: [], 
    filteredItems: [],
    favorites: [],
    compare: [],
    status: 'idle',
    filters: {
      category: '',
      brand: '',
      minPrice: 0,
      maxPrice: 10000,
      search: ''
    }
  },
  reducers: {
    setCategoryFilter: (state, action) => {
      state.filters.category = action.payload;
      state.filteredItems = applyFilters(state.items, state.filters);
    },
    setBrandFilter: (state, action) => {
      state.filters.brand = action.payload;
      state.filteredItems = applyFilters(state.items, state.filters);
    },
    setPriceFilter: (state, action) => {
      state.filters.minPrice = action.payload.min;
      state.filters.maxPrice = action.payload.max;
      state.filteredItems = applyFilters(state.items, state.filters);
    },
    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
      state.filteredItems = applyFilters(state.items, state.filters);
    },
    resetFilters: (state) => {
      state.filters = {
        category: '',
        brand: '',
        minPrice: 0,
        maxPrice: 10000,
        search: ''
      };
      state.filteredItems = state.items;
    },
    addToFavorite: (state, action) => {
      console.log('User action: addToFavorite', action.payload);
      const existingItem = state.favorites.find(item => item.id === action.payload.id);
      if (!existingItem) {
        state.favorites.push(action.payload);
      }
    },
    removeFromFavorite: (state, action) => {
      console.log('User action: removeFromFavorite', action.payload);
      state.favorites = state.favorites.filter(item => item.id !== action.payload);
    },
    clearFavorites: (state) => {
      state.favorites = [];
    },
    addToCompare: (state, action) => {
      console.log('User action: addToCompare', action.payload);
      const existingItem = state.compare.find(item => item.id === action.payload.id);
      if (!existingItem && state.compare.length < 4) { // Limit to 4 items for comparison
        state.compare.push(action.payload);
      }
    },
    removeFromCompare: (state, action) => {
      console.log('User action: removeFromCompare', action.payload);
      state.compare = state.compare.filter(item => item.id !== action.payload);
    },
    clearCompare: (state) => {
      state.compare = [];
    },
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },
    setCompare: (state, action) => {
      state.compare = action.payload;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchProducts.pending, state => { state.status = 'loading'; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.items = action.payload;
        state.filteredItems = action.payload;
        state.status = 'succeeded';
      })
      .addCase(loadFavsFromServer.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(saveFavsToServer.fulfilled, (state, action) => {
        state.favorites = action.payload;
      })
      .addCase(loadCompareFromServer.fulfilled, (state, action) => {
        state.compare = action.payload;
      })
      .addCase(saveCompareToServer.fulfilled, (state, action) => {
        state.compare = action.payload;
      });
  },
});

// Вспомогательная функция для применения фильтров
const applyFilters = (items, filters) => {
  return items.filter(item => {
    // Фильтр по категории
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    
    // Фильтр по бренду
    if (filters.brand && item.brand !== filters.brand) {
      return false;
    }
    
    // Фильтр по цене
    if (item.price < filters.minPrice || item.price > filters.maxPrice) {
      return false;
    }
    
    // Фильтр по поиску
    if (filters.search && 
        !item.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !item.animeSeries.toLowerCase().includes(filters.search.toLowerCase()) &&
        !item.character.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });
};

export const { 
  setCategoryFilter, 
  setBrandFilter, 
  setPriceFilter, 
  setSearchFilter, 
  resetFilters,
  addToFavorite,
  removeFromFavorite,
  clearFavorites,
  addToCompare,
  removeFromCompare,
  clearCompare,
  setFavorites,
  setCompare
} = productsSlice.actions;

export default productsSlice.reducer;
