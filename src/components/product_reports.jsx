import React, { useState, useContext, useMemo, useEffect } from "react";
import { FaStar, FaSyncAlt } from "react-icons/fa";
import { ProductsContext } from "../context/allproductscontext";
import { ProductContext } from "../context/productcontext";
import { OrdersContext } from "../context/orderscontext";
import Loader from "../pages/Loader";
import StatsCard from "../components/Cards";
import OrderHistory from "../components/product_Order_History";

export default function ProductReports({ disableReviewsPagination = false, isGeneratingPDF = false }) {
  const [activeTab, setActiveTab] = useState("products");
  const { loading: loadingProducts, products, getProductById } = useContext(ProductsContext);
  const { orders, loading: loadingOrders } = useContext(OrdersContext);
  const { selectedProduct, setSelectedProduct, selectedVendorId } = useContext(ProductContext);

  const [vendor, setVendor] = useState(null);
  const [vendorError, setVendorError] = useState(null);

  // Define TABS dynamically based on selectedProduct
  const TABS = [
    { key: "products", label: "Product Overview" },
    {
      key: "details",
      label: selectedProduct ? `${selectedProduct.name} Product Details` : "Product Details Report"
    },
  ];

  // Fetch vendor details
  useEffect(() => {
    if (!selectedVendorId) return setVendor(null);
    let isMounted = true;
    fetch(`${API_BASE_URL}/vendors/${selectedVendorId}/details/`)
      .then(res => { if (!res.ok) throw Error(); return res.json(); })
      .then(data => isMounted && setVendor(data))
      .catch(() => isMounted && setVendorError("Unable to load vendor details"));
    return () => { isMounted = false; };
  }, [selectedVendorId]);

  // Sort products newest first
  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [products]
  );

  // Compute order stats by product
  const orderStats = useMemo(() => {
    const stats = {};
    products.forEach(p => { stats[p.id] = { delivered: 0, pending: 0, returned: 0 }; });
    orders.forEach(o => o.items.forEach(i => {
      const s = o.status.toLowerCase();
      if (stats[i.product]) {
        if (s === "delivered") stats[i.product].delivered++;
        else if (s === "pending" || s === "processing") stats[i.product].pending++;
        else if (s === "returned") stats[i.product].returned++;
      }
    }));
    return stats;
  }, [products, orders]);

  if (loadingProducts || loadingOrders) return <Loader />;

  // Image component
  const ProductImage = ({ src, alt, className }) => {
    const [error, setError] = useState(!src);
    return error ? (
      <div className={`${className} bg-gray-200 flex items-center justify-center text-gray-500 text-[10px] border border-gray-300`}>
        No Image
      </div>
    ) : (
      <img
        src={src}
        alt={alt}
        className={className}
        crossOrigin="Anonymous"
        onError={() => setError(true)}
        onLoad={() => setError(false)}
      />
    );
  };

  // Inbuilt ReviewsRatings component
  const ReviewsRatings = ({ disablePagination = false }) => {
    // Sample data (replace with actual reviews from selectedProduct if available)
    const reviews = [
      {
        name: "Alinatwe Joel",
        rating: 5,
        ratingText: "Excellent Quality",
        location: "Uganda",
        date: "16-11-2023",
        review:
          "Medium thickness. Did not shrink after wash. Good elasticity. XL size perfectly fits for 5.10 height and heavy body. Did not fade after wash. Only for maroon color t-shirt; color lightly gone in first wash but not faded. I bought 5 t-shirts in different colours. Highly recommended at such a low price.",
      },
      {
        name: "Ahumuza Lillian",
        rating: 4,
        ratingText: "Good Quality",
        location: "Rwanda",
        date: "21-11-2023",
        review:
          "I liked the t-shirt; it's pure cotton and skin friendly, but the size is smaller compared to standard. Best rated.",
      },
      {
        name: "Ahumuza Melan",
        rating: 4,
        ratingText: "Good Quality",
        location: "Rwanda",
        date: "21-12-2024",
        review:
          "I liked the t-shirt; it's pure cotton and skin friendly, but the size is smaller compared to standard. Best rated.",
      },
      {
        name: "Ahumuza Melan",
        rating: 4,
        ratingText: "Good Quality",
        location: "Rwanda",
        date: "21-12-2024",
        review:
          "I liked the t-shirt; it's pure cotton and skin friendly, but the size is smaller compared to standard. Best rated.",
      },
      {
        name: "Ahumuza Ian",
        rating: 4,
        ratingText: "Good Quality",
        location: "Rwanda",
        date: "21-11-2025",
        review:
          "I liked the t-shirt; it's pure cotton and skin friendly, but the size is smaller compared to standard. Best rated.",
      },
    ];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const totalPages = Math.ceil(reviews.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayedReviews = disablePagination
      ? reviews
      : reviews.slice(startIndex, startIndex + itemsPerPage);

    const handlePreviousPage = () => {
      if (currentPage > 1) setCurrentPage((prev) => prev - 1);
    };

    const handleNextPage = () => {
      if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
    };

    const handlePageClick = (page) => {
      setCurrentPage(page);
    };

    const getInitials = (name) => {
      const nameParts = name.split(" ");
      if (nameParts.length === 1) {
        return nameParts[0][0].toUpperCase();
      }
      return (
        nameParts[0][0].toUpperCase() +
        nameParts[nameParts.length - 1][0].toUpperCase()
      );
    };

    return (
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-base sm:text-sm font-semibold mb-4">
          Reviews & Ratings ({reviews.length})
        </h2>

        {displayedReviews.map((review, index) => (
          <div
            key={index}
            className="border-b border-gray-200 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0"
          >
            {/* Reviewer Info */}
            <div className="flex items-center mb-2">
              {/* Initials Avatar */}
              <div className="w-10 h-10 rounded-full bg-[#280300] flex items-center justify-center mr-3">
                <span className="text-[12px] font-bold text-[#f9622c]">
                  {getInitials(review.name)}
                </span>
              </div>
              <div>
                <h3 className="text-[11px] font-medium leading-tight">
                  {review.name}
                </h3>
                {/* Star Icons */}
                <div className="flex text-yellow-500 text-[12px]">
                  {Array(review.rating)
                    .fill(null)
                    .map((_, i) => (
                      <FaStar key={i} />
                    ))}
                </div>
              </div>
            </div>

            {/* Rating Text */}
            <p className="text-[11px] font-semibold text-gray-800 mb-1">
              {review.ratingText}
            </p>

            {/* Location and Date */}
            <p className="text-[11px] text-gray-600 mb-2">
              Reviewed in {review.location} on {review.date}
            </p>

            {/* Review Body */}
            <p className="text-[11px] text-gray-700">{review.review}</p>
          </div>
        ))}

        {!disablePagination && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className="px-5 py-1 bg-gray-200 text-gray-700 text-[12px] rounded disabled:opacity-50 mr-2"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageClick(page)}
                  className={`px-5 py-1 rounded ${
                    currentPage === page
                      ? "bg-[#f9622c] text-white text-[12px]"
                      : "bg-gray-200 text-gray-700 text-[12px]"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              className="px-5 py-1 bg-gray-200 text-gray-700 text-[12px] rounded disabled:opacity-50 ml-2"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  // Products table view (without pagination)
  const renderProductsTable = () => (
    <>
      <div className="flex justify-between mb-4 text-[11px]">
        <span>Total Products: {products.length}</span>
        <div className="flex space-x-4">
        </div>
      </div>
      <div className="overflow-auto">
        <table className="min-w-full bg-white border-collapse text-[11px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-2 py-1 border">#</th>
              <th className="px-2 py-1 border">Image</th>
              <th className="px-2 py-1 border">Name</th>
              <th className="px-2 py-1 border">Category</th>
              <th className="px-2 py-1 border">Qty</th>
              <th className="px-2 py-1 border">Vendor</th>
              <th className="px-2 py-1 border">Shop</th>
              <th className="px-2 py-1 border">Delivered</th>
              <th className="px-2 py-1 border">Pending</th>
              <th className="px-2 py-1 border">Returned</th>
              <th className="px-2 py-1 border">Created</th>
              <th className="px-2 py-1 border">Rating</th>
              <th className="px-2 py-1 border">Reviews</th>
              <th className="px-2 py-1 border">Price</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((p, idx) => {
              const stats = orderStats[p.id] || {};
              const created = p.created_at ? new Date(p.created_at).toLocaleDateString() : "–";
              return (
                <tr key={p.id} className="border-t hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedProduct(p); setActiveTab("details"); }}>
                  <td className="px-2 py-1 border text-center">{idx + 1}</td>
                  <td className="px-2 py-1 border text-center">
                    <ProductImage
                      src={p.product_image_url || p.product_image}
                      alt={p.name}
                      className="h-10 w-10 object-contain mx-auto"
                    />
                  </td>
                  <td className="px-2 py-1 border">{p.name}</td>
                  <td className="px-2 py-1 border">{p.category || "–"}</td>
                  <td className="px-2 py-1 border text-center">{p.quantity}</td>
                  <td className="px-2 py-1 border">{p.vendor_username || "–"}</td>
                  <td className="px-2 py-1 border">{p.vendor_shop_name || "–"}</td>
                  <td className="px-2 py-1 border text-center">{stats.delivered}</td>
                  <td className="px-2 py-1 border text-center">{stats.pending}</td>
                  <td className="px-2 py-1 border text-center">{stats.returned}</td>
                  <td className="px-2 py-1 border text-center">{created}</td>
                  <td className="px-2 py-1 border text-center flex items-center justify-center"><FaStar size={10} className="text-yellow-400 mr-1" />{p.rating || 0}</td>
                  <td className="px-2 py-1 border text-center">{p.reviews || 0}</td>
                  <td className="px-2 py-1 border">UGX {p.price.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );

  // Product details view
  const renderDetails = () => {
    const p = selectedProduct;
    if (!p) return <div className="text-[11px] text-gray-600">Select a product to view details.</div>;
    const ctx = getProductById(p.id);
    const inventory = ctx?.quantity ?? "–";
    const createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : "";
    const productOrders = orders.filter(o => o.items.some(i => i.product === p.id)).map(o => {
      const item = o.items.find(i => i.product === p.id);
      return { id: o.id, date: new Date(o.created_at).toLocaleDateString(), quantity: item.quantity, customer: o.customer, status: o.status };
    });
    const deliveredCount = productOrders.filter(o => o.status.toLowerCase() === "delivered").length;
    const pendingCount = productOrders.filter(o => { const s = o.status.toLowerCase(); return s === "pending"||s==="processing"; }).length;
    const returnedCount = productOrders.filter(o => o.status.toLowerCase()==="returned").length;
    const statsData = [
      { title: "Inventory", value: inventory.toString().padStart(2,'0') },
      { title: "Delivered", value: deliveredCount.toString().padStart(2,'0') },
      { title: "Pending", value: pendingCount.toString().padStart(2,'0') },
      { title: "Returned", value: returnedCount.toString().padStart(2,'0') },
    ];

    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Info */}
          <div className="border p-4 rounded">
            <div className="mb-4">
              <ProductImage
                src={p.product_image_url || p.product_image}
                alt={p.name}
                className="w-full h-56 object-contain mb-2"
              />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">{p.name}</h3>
            <p className="text-gray-600 text-[11px] mb-2">{p.description}</p>
            <table className="w-full text-[11px] mb-4">
              <tbody>
                <tr><td className="font-medium text-gray-700">Price:</td><td className="text-right">UGX {p.price.toLocaleString()}</td></tr>
                <tr><td className="font-medium text-gray-700">Quantity:</td><td className="text-right">{inventory}</td></tr>
                <tr><td className="font-medium text-gray-700">Created:</td><td className="text-right">{createdDate}</td></tr>
                <tr><td className="font-medium text-gray-700">Size:</td><td className="text-right">{p.size==='custom'?p.custom_size:p.size}</td></tr>
                <tr><td className="font-medium text-gray-700">Color:</td><td className="text-right">{p.color==='custom'?p.custom_color:p.color}</td></tr>
                <tr><td className="font-medium text-gray-700">Material:</td><td className="text-right">{p.material}</td></tr>
                <tr><td className="font-medium text-gray-700">Origin:</td><td className="text-right">{p.country_of_origin}</td></tr>
              </tbody>
            </table>
          </div>
          {/* Stats */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {statsData.map(s => (
              <div key={s.title} className="border p-2 rounded bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700">{s.title}</h4>
                <p className="text-lg text-gray-900 font-bold">{s.value}</p>
              </div>
            ))}
          </div>
          {/* Vendor Info */}
          <div className="col-span-3 border p-4 rounded mt-4">
            <h4 className="text-md font-semibold text-gray-800 mb-2">Vendor Information</h4>
            {vendorError ? (
              <p className="text-red-600 text-sm">{vendorError}</p>
            ) : vendor ? (
              <table className="w-full text-[11px]">
                <tbody>
                  <tr><td className="font-medium text-gray-700">Shop:</td><td className="text-right">{vendor.shop_name}</td></tr>
                  <tr><td className="font-medium text-gray-700">User:</td><td className="text-right">{vendor.username}</td></tr>
                  <tr><td className="font-medium text-gray-700">Email:</td><td className="text-right">{vendor.user_email}</td></tr>
                  <tr><td className="font-medium text-gray-700">Phone:</td><td className="text-right">{vendor.phone_number}</td></tr>
                </tbody>
              </table>
            ) : (
              <p className="text-gray-600 text-sm">No vendor data available</p>
            )}
          </div>
          {/* Order History & Reviews */}
          <div className="col-span-3 mt-4">
            <OrderHistory orderHistory={productOrders} />
            <ReviewsRatings disablePagination={disableReviewsPagination} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full p-6 bg-gray-50">
      <main className="flex-1 overflow-auto">
        <div className="bg-white shadow rounded-lg">
          {/* Conditionally render tabs only if not generating PDF */}
          {!isGeneratingPDF && (
            <div className="flex border-b bg-gray-100 px-6">
              {TABS.map((tab) => (
                <div
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 text-center py-2 cursor-pointer text-gray-700 ${
                    activeTab === tab.key
                      ? "bg-white border-t border-l border-r"
                      : "hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                </div>
              ))}
            </div>
          )}
          <div className="p-6">
            {activeTab === "products" ? renderProductsTable() : renderDetails()}
          </div>
        </div>
      </main>
    </div>
  );
}