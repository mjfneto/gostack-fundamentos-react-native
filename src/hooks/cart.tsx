import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  sum: number;
  size: number;
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sum, setSum] = useState(0);
  const [size, setSize] = useState(0);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedCartJSONString = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (storedCartJSONString) {
        const storedCart = JSON.parse(storedCartJSONString);

        setProducts(storedCart);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const existingIndex = products.findIndex(({ id }) => id === product.id);

      if (existingIndex > -1) {
        setProducts(
          products.map((p, index) =>
            index === existingIndex
              ? { ...product, quantity: p.quantity + 1 }
              : p,
          ),
        );
      } else {
        setProducts([...products, { ...product, quantity: 1 }]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  useEffect(() => {
    setSum(
      products.reduce(
        (total, { price, quantity }) => total + quantity * price,
        0,
      ),
    );
    setSize(products.reduce((total, { quantity }) => total + quantity, 0));
  }, [products]);

  const increment = useCallback(
    async id => {
      setProducts(
        products.map(p =>
          p.id === id ? { ...p, quantity: p.quantity + 1 } : p,
        ),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(
        products
          .map(p => (p.id === id ? { ...p, quantity: p.quantity - 1 } : p))
          .filter(p => p.quantity !== 0),
      );

      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products, sum, size }),
    [products, addToCart, increment, decrement, sum, size],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
