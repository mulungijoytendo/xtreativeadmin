import React, { createContext, useState, useEffect } from "react";

export const OrdersContext = createContext();

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toAddressMap, setToAddressMap] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("authToken");
        if (!token) {
          throw new Error("No auth token found. Please log in.");
        }
        const res = await fetch(`${API_BASE_URL}/orders/list/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Server responded ${res.status}`);
        }
        const data = await res.json();
        setOrders(data);

        // Create a map of item ID to to_address
        const addressMap = data.reduce((map, order) => {
          order.items.forEach((item) => {
            map[item.id] = order.to_address;
          });
          return map;
        }, {});
        setToAddressMap(addressMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <OrdersContext.Provider value={{ orders, loading, error, toAddressMap }}>
      {children}
    </OrdersContext.Provider>
  );
};