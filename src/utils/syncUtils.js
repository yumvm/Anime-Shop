import { useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { saveCartToServer } from '../features/cart/cartSlice';
import { saveFavsToServer, saveCompareToServer } from '../features/products/productsSlice';
import { selectUser } from '../store/authSlice';

// Custom hook to sync Redux state with server when user is authenticated
export const useSyncWithServer = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  // Use refs to track current values and previous values for comparison
  const userRef = useRef();
  const cartItemsRef = useRef();
  const favoritesRef = useRef();
  const compareRef = useRef();
  
  // Use refs to track previous values for comparison
  const prevUser = useRef();
  const prevCartItems = useRef();
  const prevFavorites = useRef();
  const prevCompare = useRef();

  // Track if we're currently syncing to prevent recursive updates
  const isSyncing = useRef({
    cart: false,
    favs: false,
    compare: false
  });

  // Get current values and compare with previous values
  const currentCartItems = useSelector(state => state.cart.items);
  const currentFavorites = useSelector(state => state.products.favorites);
  const currentCompare = useSelector(state => state.products.compare);

  // Check if values have changed before updating refs
  useEffect(() => {
    userRef.current = user;
    
    // Only update refs if values have actually changed
    if (JSON.stringify(currentCartItems) !== JSON.stringify(cartItemsRef.current)) {
      cartItemsRef.current = currentCartItems;
    }
    if (JSON.stringify(currentFavorites) !== JSON.stringify(favoritesRef.current)) {
      favoritesRef.current = currentFavorites;
    }
    if (JSON.stringify(currentCompare) !== JSON.stringify(compareRef.current)) {
      compareRef.current = currentCompare;
    }
  }, [user, currentCartItems, currentFavorites, currentCompare]);

  useEffect(() => {
    const userId = userRef.current?.id;
    if (!userId) return;

    // Check if cart items have changed
    const currentCartItemsStr = JSON.stringify(cartItemsRef.current);
    if (!prevCartItems.current || currentCartItemsStr !== prevCartItems.current) {
      if (!isSyncing.current.cart) {
        console.log('Cart changed, syncing to server:', cartItemsRef.current);
        isSyncing.current.cart = true;
        dispatch(saveCartToServer({ userId, items: cartItemsRef.current }))
          .finally(() => {
            isSyncing.current.cart = false;
          });
      }
      prevCartItems.current = currentCartItemsStr;
    }

    // Check if favorites have changed
    const currentFavoritesStr = JSON.stringify(favoritesRef.current);
    if (!prevFavorites.current || currentFavoritesStr !== prevFavorites.current) {
      if (!isSyncing.current.favs) {
        console.log('Favorites changed, syncing to server:', favoritesRef.current);
        isSyncing.current.favs = true;
        dispatch(saveFavsToServer({ userId, items: favoritesRef.current }))
          .finally(() => {
            isSyncing.current.favs = false;
          });
      }
      prevFavorites.current = currentFavoritesStr;
    }

    // Check if compare items have changed
    const currentCompareStr = JSON.stringify(compareRef.current);
    if (!prevCompare.current || currentCompareStr !== prevCompare.current) {
      if (!isSyncing.current.compare) {
        console.log('Compare items changed, syncing to server:', compareRef.current);
        isSyncing.current.compare = true;
        dispatch(saveCompareToServer({ userId, items: compareRef.current }))
          .finally(() => {
            isSyncing.current.compare = false;
          });
      }
      prevCompare.current = currentCompareStr;
    }
  }, [dispatch]); // Only depend on dispatch to prevent constant re-runs due to state changes
};