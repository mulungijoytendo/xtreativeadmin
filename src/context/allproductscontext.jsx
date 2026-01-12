// ProductsContext.js
import React, { createContext, useState, useEffect } from "react";
import { authFetch } from "../api";

export const ProductsContext = createContext();

export const AllProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoadingProducts(true);
        const data = await authFetch("/products/listing/");
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
