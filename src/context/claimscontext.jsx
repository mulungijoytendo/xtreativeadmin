import React, { createContext, useState, useEffect, useContext } from "react";
import { OrdersContext } from "./orderscontext";

// Create Claims Context
export const ClaimsContext = createContext();

// Claims Provider Component
export const ClaimsProvider = ({ children }) => {
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const ordersContext = useContext(OrdersContext);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const authToken = localStorage.getItem("authToken"); // Retrieve token from localStorage

        if (!authToken) {
          throw new Error("No authentication token found. Please log in.");
        }

        // Check if OrdersContext is available
        if (!ordersContext) {
          throw new Error("OrdersContext is not available. Ensure ClaimsProvider is wrapped in OrdersProvider.");
        }

        const { orders, loading: ordersLoading, error: ordersError, toAddressMap } = ordersContext;

        // Log toAddressMap for debugging
        console.log("toAddressMap:", toAddressMap);

        // Check for orders error
        if (ordersError) {
          throw new Error(`Orders error: ${ordersError}`);
        }

        // Wait for orders to be loaded
        if (ordersLoading) {
          return; // Delay fetching until orders are loaded
        }

        // Create maps for item ID to product name, subtotal, quantity, and product ID
        const itemMap = orders.reduce((map, order) => {
          order.items.forEach((item) => {
            map[item.id] = item.product_name;
          });
          return map;
        }, {});

        const subtotalMap = orders.reduce((map, order) => {
          order.items.forEach((item) => {
            map[item.id] = item.subtotal;
          });
          return map;
        }, {});

        const quantityMap = orders.reduce((map, order) => {
          order.items.forEach((item) => {
            map[item.id] = item.quantity;
          });
          return map;
        }, {});

        const productIdMap = orders.reduce((map, order) => {
          order.items.forEach((item) => {
            map[item.id] = item.product;
          });
          return map;
        }, {});

        // Fetch products to get image URLs
        const productsResponse = await fetch(`${API_BASE_URL}/products/listing/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!productsResponse.ok) {
          throw new Error("Failed to fetch products");
        }

        const productsData = await productsResponse.json();
        // Create a map of product ID to image URL
        const imageMap = productsData.reduce((map, product) => {
          map[product.id] = product.product_image_url;
          return map;
        }, {});

        // Fetch customers
        const customersResponse = await fetch(`${API_BASE_URL}/customers/list/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!customersResponse.ok) {
          throw new Error("Failed to fetch customers");
        }

        const customersData = await customersResponse.json();
        // Create a map of customer ID to username
        const customerMap = customersData.reduce((map, customer) => {
          map[customer.id] = customer.username;
          return map;
        }, {});

        // Fetch claims
        const claimsResponse = await fetch(`${API_BASE_URL}/returns/list/`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        });

        if (!claimsResponse.ok) {
          if (claimsResponse.status === 401) {
            // Clear tokens on 401 Unauthorized
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            throw new Error("Authentication failed. Please log in again.");
          }
          throw new Error("Failed to fetch claims");
        }

        const claimsData = await claimsResponse.json();

        // Transform API data to match component's expected format
        const transformedClaims = claimsData.map((item) => {
          // Log order_item and corresponding to_address for debugging
          console.log(`order_item: ${item.order_item}, to_address: ${toAddressMap[item.order_item]}`);
          
          // Use to_address or fallback to default address
          const deliveryAddress = toAddressMap[item.order_item] && toAddressMap[item.order_item].trim() !== ""
            ? toAddressMap[item.order_item]
            : "Pioneer Mall, Burton Street, Kampala, Uganda";

          return {
            name: customerMap[item.customer] || `Customer ${item.customer}`,
            order_item: item.order_item, // Keep order_item for ID reference
            product_name: itemMap[item.order_item] || `Item ${item.order_item}`, // Use product name from orders
            reason: item.reason, // Include reason
            time: new Date(item.created_at).toLocaleString(), // Format date
            created_at: item.created_at, // Include raw created_at for graph
            status: item.status, // Include status
            type: item.status.toLowerCase() === "approved" ? "refund" : "claim", // Keep for compatibility
            giftPrice: subtotalMap[item.order_item] || "N/A", // Use subtotal as giftPrice
            quantity: quantityMap[item.order_item] || "1", // Use quantity from orders
            image: imageMap[productIdMap[item.order_item]] || null, // Use product image URL
            deliveryAddress // Use to_address or fallback
          };
        });

        setClaims(transformedClaims);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ordersContext]);

  return (
    <ClaimsContext.Provider value={{ claims, isLoading, error }}>
      {children}
    </ClaimsContext.Provider>
  );
};