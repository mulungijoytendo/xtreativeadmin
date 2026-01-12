import React, { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle } from "lucide-react";
import OrderTimeline from "./order_details_timeline";
import CustomerDetailsCard from "./order_customer_details";
import { OrdersContext } from "../context/orderscontext";
import { ProductsContext } from "../context/allproductscontext";

const OFFSET = 1000;

// Utility: strip non-numeric chars and parse price
function extractPrice(priceStr) {
  return Number(priceStr.replace(/[^\d.]/g, ""));
}

// Utility: get "st"/"nd"/"rd"/"th" suffix for dates
function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

// Utility: format JS Date → "4th April 2025"
function formatDate(dateObj) {
  const day = dateObj.getDate();
  const ordinal = getOrdinalSuffix(day);
  const month = dateObj.toLocaleString("en-GB", { month: "long" });
  const year = dateObj.getFullYear();
  return `${day}${ordinal} ${month} ${year}`;
}

// Map warehouse status → badge CSS
const getWarehouseStatusClasses = (status) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "sent to warehouse":
      return "bg-gray-50 text-gray-800";
    case "confirmed warehouse":
      return "bg-green-100 text-green-800";
    case "delivered":
      return "bg-teal-100 text-teal-800";
    case "canceled":
    case "cancelled":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

// Capitalize each word
function capitalize(str) {
  return String(str)
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export default function OrderLeftSection() {
  const { orderId } = useParams();
  const { orders, loading, error, refreshOrders } = useContext(OrdersContext);
  const { getProductById, loadingProducts, errorProducts } = useContext(ProductsContext);

  // State: progress steps, current step index, warehouse statuses & loaders
  const [steps, setSteps] = useState([
    { label: "Pending", width: "w-0", color: "bg-yellow-500", active: false, status: "pending" },
    { label: "Sent to Warehouse", width: "w-0", color: "bg-gray-500", active: false, status: "sent to warehouse" },
    { label: "Confirmed Warehouse", width: "w-0", color: "bg-green-500", active: false, status: "confirmed warehouse" },
    { label: "Delivered", width: "w-0", color: "bg-teal-500", active: false, status: "delivered" },
  ]);
  const [currentStep, setCurrentStep] = useState(0);
  const [warehouseStatuses, setWarehouseStatuses] = useState({});
  const [warehouseLoading, setWarehouseLoading] = useState({});
  const [markSentLoading, setMarkSentLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdatedStep, setLastUpdatedStep] = useState(null);
  const [isSent, setIsSent] = useState(false);

  // Function to fetch order status changes
  const fetchOrderStatus = async () => {
    const token = localStorage.getItem("authToken");
    if (!token || isUpdating) return;

    const origId = parseInt(orderId, 10) - OFFSET;
    try {
      const res = await fetch(
        `${API_BASE_URL}/orders/${origId}/status/`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const newOverallStatus = data.status.toLowerCase();
        const statusMap = {
          "pending": 0,
          "sent to warehouse": 1,
          "confirmed warehouse": 2,
          "delivered": 3,
        };
        const newStep = statusMap[newOverallStatus] || 0;

        if (newStep >= (lastUpdatedStep !== null ? lastUpdatedStep : 0)) {
          setCurrentStep(newStep);
          setSteps(prevSteps =>
            prevSteps.map((step, index) => ({
              ...step,
              width: index <= newStep ? "w-full" : "w-0",
              active: index === newStep,
            }))
          );
          setLastUpdatedStep(null);
        }

        const newWarehouseStatuses = {};
        data.item_statuses.forEach(item => {
          newWarehouseStatuses[item.item_id] = item.status.toLowerCase();
        });
        setWarehouseStatuses(newWarehouseStatuses);
        setIsSent(newOverallStatus === "sent to warehouse");

        refreshOrders?.();
      } else {
        console.error("Failed to fetch status:", await res.text());
      }
    } catch (e) {
      console.error("Network error:", e);
    }
  };

  // Initialize steps based on order status
  useEffect(() => {
    if (!loading && !loadingProducts) {
      const origId = parseInt(orderId, 10) - OFFSET;
      const order = orders.find(o => o.id === origId);
      if (order) {
        const statusMap = {
          "pending": 0,
          "sent to warehouse": 1,
          "confirmed warehouse": 2,
          "delivered": 3,
        };
        const initialStep = statusMap[order.status.toLowerCase()] || 0;
        setCurrentStep(initialStep);
        setSteps(prevSteps =>
          prevSteps.map((step, index) => ({
            ...step,
            width: index <= initialStep ? "w-full" : "w-0",
            active: index === initialStep,
          }))
        );

        const init = {};
        order.items.forEach(item => {
          init[item.id] = item.status?.toLowerCase() || order.status.toLowerCase() || "pending";
        });
        setWarehouseStatuses(init);
        setIsSent(order.status.toLowerCase() === "sent to warehouse");
      }
    }
  }, [loading, loadingProducts, orders, orderId]);

  // Poll for status changes every 5 seconds
  useEffect(() => {
    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Handle next step by admin
  const handleNextStep = async () => {
    if (currentStep >= steps.length - 1 || isUpdating) return;

    // Check if the next step is valid based on current status
    const currentStatus = steps[currentStep].status;
    const nextStatus = steps[currentStep + 1].status;
    if (
      (currentStatus === "pending" && nextStatus !== "sent to warehouse") ||
      (currentStatus === "sent to warehouse" && nextStatus !== "confirmed warehouse") ||
      (currentStatus === "confirmed warehouse" && nextStatus !== "delivered")
    ) {
      console.error("Invalid status transition");
      return;
    }

    const nextStep = currentStep + 1;
    setIsUpdating(true);
    setLastUpdatedStep(nextStep);
    setSteps(prevSteps =>
      prevSteps.map((step, index) => ({
        ...step,
        width: index <= nextStep ? "w-full" : "w-0",
        active: index === nextStep,
      }))
    );
    setCurrentStep(nextStep);

    const origId = parseInt(orderId, 10) - OFFSET;
    const token = localStorage.getItem("authToken");
    if (token) {
      const newStatus = steps[nextStep].status;
      try {
        const res = await fetch(
          `${API_BASE_URL}/orders/${origId}/status/`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: newStatus }),
          }
        );
        if (res.ok) {
          console.log("Status updated successfully:", await res.json());
          refreshOrders?.();
        } else {
          console.error("Failed to update status:", await res.text());
          if (lastUpdatedStep === nextStep) {
            setCurrentStep(prev => prev - 1);
            setSteps(prevSteps =>
              prevSteps.map((step, index) => ({
                ...step,
                width: index <= currentStep - 1 ? "w-full" : "w-0",
                active: index === currentStep - 1,
              }))
            );
            setLastUpdatedStep(null);
          }
        }
      } catch (e) {
        console.error("Network error:", e);
        if (lastUpdatedStep === nextStep) {
          setCurrentStep(prev => prev - 1);
          setSteps(prevSteps =>
            prevSteps.map((step, index) => ({
              ...step,
              width: index <= currentStep - 1 ? "w-full" : "w-0",
              active: index === currentStep - 1,
            }))
          );
          setLastUpdatedStep(null);
        }
      } finally {
        setIsUpdating(false);
      }
    }
  };

  // Confirm shipment per item with loader
  const handleConfirmShipment = async (itemId) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    setWarehouseLoading(prev => ({ ...prev, [itemId]: true }));

    try {
      const origId = parseInt(orderId, 10) - OFFSET;
      const res = await fetch(
        `${API_BASE_URL}/orders/${origId}/confirm-warehouse/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ item_id: itemId }),
        }
      );
      if (res.ok) {
        setWarehouseStatuses(prev => ({ ...prev, [itemId]: "shipped" }));
        setWarehouseLoading(prev => ({ ...prev, [itemId]: false }));
        refreshOrders?.();
      } else {
        console.error("API error:", await res.text());
        setWarehouseLoading(prev => ({ ...prev, [itemId]: false }));
      }
    } catch (e) {
      console.error("Network error:", e);
      setWarehouseLoading(prev => ({ ...prev, [itemId]: false }));
    }
  };

  // Mark order as sent to warehouse
  const handleMarkSent = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    setMarkSentLoading(true);

    try {
      const origId = parseInt(orderId, 10) - OFFSET;
      const res = await fetch(
        `${API_BASE_URL}/orders/${origId}/mark-sent/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        }
      );
      if (res.ok) {
        const newWarehouseStatuses = {};
        const order = orders.find(o => o.id === origId);
        if (order) {
          order.items.forEach(item => {
            newWarehouseStatuses[item.id] = "sent to warehouse";
          });
          setWarehouseStatuses(newWarehouseStatuses);
        }
        setIsSent(true);
        refreshOrders?.();
      } else {
        console.error("Failed to mark as sent to warehouse:", await res.text());
      }
    } catch (e) {
      console.error("Network error:", e);
    } finally {
      setMarkSentLoading(false);
    }
  };

  if (loading || loadingProducts) {
    return <div className="text-center text-[11px] p-4">Loading order details…</div>;
  }
  if (error) {
    return <div className="text-center text-[11px] p-4 text-red-600">Error: {error}</div>;
  }
  if (errorProducts) {
    return <div className="text-center text-[11px] p-4 text-red-600">Error: {errorProducts}</div>;
  }

  const origId = parseInt(orderId, 10) - OFFSET;
  const order = orders.find(o => o.id === origId);
  if (!order) {
    return <div className="text-center text-[11px] p-4">Order not found.</div>;
  }

  const orderNumber = `#${order.id + OFFSET}`;
  const createdDate = formatDate(new Date(order.created_at));
  const shipDate = order.estimated_shipping_date
    ? formatDate(new Date(order.estimated_shipping_date))
    : "N/A";

  return (
    <div className="flex flex-col md:flex-row font-poppins text-[11px]">
      <div className="w-full md:w-2/3 p-4">
        <div className="bg-white shadow rounded-lg mb-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="flex items-center space-x-2 text-[11px] text-[#280300] font-medium">
                  <span>{orderNumber}</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-[10px] rounded">
                    {order.payment_status || "Paid"}
                  </span>
                  <span className={`px-2 py-1 border border-yellow-500 text-yellow-500 text-[10px] rounded ${getWarehouseStatusClasses(order.status)}`}>
                    {capitalize(order.status || "Unknown")}
                  </span>
                </h4>
                <p className="text-[11px] text-gray-500 mt-1">{createdDate}</p>
              </div>
            </div>
            <h4 className="mb-4 text-[10px] text-[#f9622c]">Progress</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {steps.map((s, i) => (
                <div key={i}>
                  <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`${s.color} ${s.width} h-full transition-all duration-8000 ease-in-out`}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[10px]">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
            <p className="flex items-center text-[10px] bg-white px-3 py-1 rounded border">
              Order Delivering date:
              <span className="ml-1 font-medium text-[#280300]">{shipDate}</span>
            </p>
            {currentStep < steps.length - 1 && (
              <button
                onClick={handleNextStep}
                className="px-4 py-2 text-[11px] bg-[#f9622c] text-white rounded"
              >
                Move to Next Step
              </button>
            )}
            {currentStep === steps.length - 1 && (
              <button disabled className="px-4 py-2 text-green-500 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Order Completed
              </button>
            )}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-x-auto mb-4">
          <table className="min-w-full text-left text-gray-600">
            <thead className="bg-gray-50 uppercase text-gray-500 text-[10px]">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Price per item</th>
                <th className="px-4 py-3">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[10px]">
              {order.items.map(item => {
                const unitPrice = extractPrice(item.price);
                const amount = unitPrice * item.quantity;
                const detail = getProductById(item.product) || {};
                const size = detail.size || item.size;
                const color = detail.custom_color && detail.custom_color !== "custom"
                  ? detail.custom_color
                  : detail.color || item.color;
                const material = detail.material || item.material;

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center space-x-2 min-w-[150px]">
                      <img
                        src={item.product_image_url || detail.product_image_url || "https://via.placeholder.com/50"}
                        alt={item.product_name || detail.name}
                        className="w-10 rounded"
                      />
                      <div>
                        <p className="font-medium text-gray-800 text-[11px]">
                          {item.product_name || detail.name}
                        </p>
                        {(size || color || material) && (
                          <p className="text-[9px] text-gray-500">
                            {size && `Size: ${size}`}
                            {color && ` | Color: ${color}`}
                            {material && ` | Material: ${material}`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">UGX {unitPrice.toLocaleString()}</td>
                    <td className="px-4 py-3">UGX {amount.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white shadow rounded-lg overflow-x-auto mb-4">
          <h5 className="px-4 py-2 text-[11px] font-medium">Warehouse</h5>
          <table className="min-w-full text-left text-gray-600 text-[10px]">
            <thead className="bg-gray-50 uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Price per item</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            {order.status?.toLowerCase() !== "sent to warehouse" ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    No product in the warehouse
                    {markSentLoading ? (
                      <div className="ml-4 inline-block animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                    ) : (
                      <button
                        onClick={handleMarkSent}
                        className={`ml-4 px-3 py-1 text-white rounded text-[10px] ${isSent ? 'bg-orange-500' : 'bg-black'}`}
                      >
                        {isSent ? 'Sent to Warehouse' : 'Mark as Sent to Warehouse'}
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-100">
                {order.items.map(item => {
                  const status = warehouseStatuses[item.id];
                  const isLoading = warehouseLoading[item.id];
                  const detail = getProductById(item.product) || {};
                  const unitPrice = extractPrice(item.price || detail.price || "0");
                  const amount = unitPrice * item.quantity;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 flex items-center space-x-2 min-w-[150px]">
                        <img
                          src={item.product_image_url || detail.product_image_url || "https://via.placeholder.com/50"}
                          alt={item.product_name || detail.name}
                          className="w-10 rounded"
                        />
                        <span className="font-medium text-gray-800 text-[11px]">
                          {item.product_name || detail.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.quantity}</td>
                      <td className="px-4 py-3">UGX {unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3">UGX {amount.toLocaleString()}</td>
                      <td className="px-4 py-3 space-x-2">
                        {isLoading ? (
                          <div className="mx-auto animate-spin rounded-full h-4 w-4 border-2 border-green-500 border-t-transparent" />
                        ) : status === "shipped" ? (
                          <div className="flex items-center text-green-600 text-[10px]">
                            <CheckCircle className="w-4 h-4 mr-1" />
                            <span>Shipment Confirmed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleConfirmShipment(item.id)}
                            className="px-2 py-1 text-[10px] bg-green-500 text-white rounded"
                          >
                            Confirm Shipment
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            )}
          </table>
        </div>

        <OrderTimeline steps={steps} currentStep={currentStep} />
      </div>

      <div className="w-full md:w-1/3 p-4">
        <CustomerDetailsCard order={order} />
      </div>
    </div>
  );
}