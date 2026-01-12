// pages/ProductDetails.jsx

import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import OrderHistory from "../components/product_Order_History";
import StatsCard from "../components/Cards";
import ReviewsRatings from "../components/product_review_ratings";
import Loader from "../pages/Loader";
import { ProductContext } from "../context/productcontext";
import { OrdersContext } from "../context/orderscontext";
import { ProductsContext } from "../context/allproductscontext";   // ← import ProductsContext
import DeleteProductModal from "../modals/deleteProduct";
import { FaSearchPlus, FaTimes } from "react-icons/fa";

export default function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedProduct, selectedVendorId } = useContext(ProductContext);
  const { orders, loading: ordersLoading, error: ordersError } = useContext(OrdersContext);
  const { getProductById, loadingProducts, errorProducts } = useContext(ProductsContext);
  const { product: locationProduct } = location.state || {};
  const product = selectedProduct || locationProduct || null;

  const [showZoom, setShowZoom] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [vendorError, setVendorError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // fetch vendor...
  useEffect(() => {
    let isMounted = true;
    if (!selectedVendorId) {
      isMounted && setVendor(null);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/vendors/${selectedVendorId}/details/`
        );
        if (!res.ok) throw new Error("Failed to fetch vendor");
        const data = await res.json();
        if (isMounted) setVendor(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setVendorError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedVendorId]);

  // Delete product
  const handleDelete = async () => {
    if (!product?.id) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/products/admin/products/${product.id}/delete/`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!res.ok) throw new Error("Failed to delete product");
      // Navigate back to products list
      navigate("/products");
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const totalOrders = orders?.length || 0;
  const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;
  const avgRating = product?.rating || 0;

  // Loading
  if (loading || ordersLoading || loadingProducts) {
    return <Loader />;
  }

  // Error
  if (vendorError || ordersError || errorProducts) {
    return (
      <div className="p-4 text-red-600">
        Error: {vendorError || ordersError || errorProducts}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate("/products")}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Back to Products
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Delete Product"}
                </button>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Product Information</h2>
                  <div className="space-y-2">
                    <p><strong>Name:</strong> {product?.name}</p>
                    <p><strong>Category:</strong> {product?.category}</p>
                    <p><strong>Price:</strong> ${product?.price?.toFixed(2)}</p>
                    <p><strong>Stock:</strong> {product?.stock}</p>
                    <p><strong>Rating:</strong> {product?.rating || 0} ⭐</p>
                    <p><strong>Description:</strong> {product?.description}</p>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-4">Vendor Information</h2>
                  {vendor ? (
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {vendor.name}</p>
                      <p><strong>Email:</strong> {vendor.email}</p>
                      <p><strong>Phone:</strong> {vendor.phone}</p>
                      <p><strong>Address:</strong> {vendor.address}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No vendor assigned</p>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <StatsCard title="Total Orders" value={totalOrders} />
              <StatsCard title="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
              <StatsCard title="Average Rating" value={`${avgRating} ⭐`} />
            </div>

            {/* Order History */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order History</h2>
              <OrderHistory orders={orders || []} />
            </div>

            {/* Reviews & Ratings */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Reviews & Ratings</h2>
              <ReviewsRatings productId={product?.id} />
            </div>
          </div>
        </main>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <DeleteProductModal
          product={product}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
