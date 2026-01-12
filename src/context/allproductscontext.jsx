// ProductsContext.js
import React, { createContext, useState, useEffect } from "react";

export const ProductsContext = createContext();

export const AllProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const res = await fetch(`${API_BASE_URL}/products/listing/`);
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setErrorProducts(err.message);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Helper function to get a product by its id
  const getProductById = (id) => {
    return products.find((product) => product.id === id);
  };

  return (
    <ProductsContext.Provider
      value={{ products, loadingProducts, errorProducts, getProductById }}
    >
      {children}
    </ProductsContext.Provider>
  );
};
