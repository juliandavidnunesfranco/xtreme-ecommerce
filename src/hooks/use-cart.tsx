"use client";
import type React from "react";
import { createContext, useContext, useReducer, useEffect } from "react";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  code: string;
  stock: number;
  image: string;
  rowIndex: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  orderId: string | null;
  orderStatus: string | null;
}

type CartAction =
  | { type: "ADD_ITEM"; payload: CartItem }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }
  | { type: "LOAD_STATE"; payload: CartState }
  | { type: "SET_ORDER"; payload: { orderId: string; status: string } }
  | { type: "CLEAR_ORDER" };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setOrder: (orderId: string, status: string) => void;
  clearOrder: () => void;
  items: CartItem[];
  total: number;
  itemCount: number;
  orderId: string | null;
  orderStatus: string | null;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (existingItem) {
        const newQuantity = Math.min(
          existingItem.quantity + action.payload.quantity,
          action.payload.stock
        );
        const updatedItems = state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: newQuantity }
            : item
        );
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
          ),
        };
      }

      const newItems = [...state.items, action.payload];
      return {
        ...state,
        items: newItems,
        total: newItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
      };
    }

    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.id !== action.payload);
      return {
        ...state,
        items: newItems,
        total: newItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
      };
    }

    case "UPDATE_QUANTITY": {
      const updatedItems = state.items
        .map((item) =>
          item.id === action.payload.id
            ? {
                ...item,
                quantity: Math.min(action.payload.quantity, item.stock),
              }
            : item
        )
        .filter((item) => item.quantity > 0);

      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        ),
      };
    }

    case "CLEAR_CART":
      return { ...state, items: [], total: 0 };

    case "SET_ORDER":
      return {
        ...state,
        items: [],
        total: 0,
        orderId: action.payload.orderId,
        orderStatus: action.payload.status,
      };

    case "CLEAR_ORDER":
      return {
        ...state,
        orderId: null,
        orderStatus: null,
      };

    case "LOAD_STATE": {
      return action.payload;
    }

    default:
      return state;
  }
}

const initialState: CartState = {
  items: [],
  total: 0,
  orderId: null,
  orderStatus: null,
};

function init(initialState: CartState): CartState {
  if (typeof window === "undefined") {
    return initialState;
  }
  try {
    const savedState = localStorage.getItem("xtreme-ecommerce-cart-state");
    if (!savedState) return initialState;

    const parsedState = JSON.parse(savedState);
    
    // Basic validation to ensure loaded state has the right shape
    if (parsedState.items && typeof parsedState.total === 'number') {
      return parsedState;
    }

    return initialState;
  } catch (error) {
    console.error("Error loading cart state from localStorage:", error);
    return initialState;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState, init);

  // Save entire state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("xtreme-ecommerce-cart-state", JSON.stringify(state));
  }, [state]);

  const addItem = (item: CartItem) => {
    dispatch({ type: "ADD_ITEM", payload: item });
  };

  const removeItem = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: id });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" });
  };

  const setOrder = (orderId: string, status: string) => {
    dispatch({ type: "SET_ORDER", payload: { orderId, status } });
  };

  const clearOrder = () => {
    dispatch({ type: "CLEAR_ORDER" });
  };

  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        setOrder,
        clearOrder,
        items: state.items,
        total: state.total,
        itemCount,
        orderId: state.orderId,
        orderStatus: state.orderStatus,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
