'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/lib/useAuth';
import { authFetch } from '@/lib/adminAuth';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ id: null, items: [], subtotal: 0, hasIssues: false });
  const [isLoading, setIsLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ id: null, items: [], subtotal: 0, hasIssues: false });
      return;
    }
    try {
      setIsLoading(true);
      const res = await authFetch('/cart');
      if (res.data) {
        setCart(res.data);
      }
    } catch (err) {
      console.error('Lỗi lấy giỏ hàng:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addItem = async (variantId, quantity = 1) => {
    if (!user) {
      throw new Error('UNAUTHENTICATED');
    }
    const res = await authFetch('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ variantId, quantity }),
    });
    if (res.error) throw new Error(res.error.message || 'Không thể thêm vào giỏ hàng');
    await fetchCart();
    return res.data;
  };

  const updateItem = async (cartItemId, quantity) => {
    const res = await authFetch(`/cart/items/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    if (res.error) throw new Error(res.error.message || 'Không thể cập nhật số lượng');
    await fetchCart();
    return res.data;
  };

  const removeItem = async (cartItemId) => {
    const res = await authFetch(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
    if (res.error) throw new Error(res.error.message || 'Không thể xoá khỏi giỏ hàng');
    await fetchCart();
    return res.data;
  };

  const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        totalQuantity,
        fetchCart,
        addItem,
        updateItem,
        removeItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
