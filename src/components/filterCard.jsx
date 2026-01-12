// FilterAndCard.jsx
import React, { useState, useEffect, useMemo } from "react";
import Slider from "@mui/material/Slider";
import "../styles/index.css";
import { IoIosArrowUp, IoIosArrowDown } from "react-icons/io";
import { FaStar } from "react-icons/fa";
import ProductSection from "./product_section";
import Loader from "../pages/Loader";
import { API_BASE_URL, authFetch } from "../api";

const API_URL = API_BASE_URL + "/products/listing/";

const FilterAndCard = () => {
  // Toggle states for filter sections
  const [openCategory, setOpenCategory] = useState(true);
  const [openPrice, setOpenPrice] = useState(false);
  const [openSize, setOpenSize] = useState(false);
  const [openRating, setOpenRating] = useState(false);

  // Filter controls state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(["All Categories"]);
  const [selectedSizes, setSelectedSizes] = useState(["All Sizes"]);
  const [selectedRating, setSelectedRating] = useState(null);

  // Price range boundaries
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1500);
  const [selectedPriceRange, setSelectedPriceRange] = useState([0, 1500]);
  const [selectedPriceOption, setSelectedPriceOption] = useState("all");

  // Static rating options for the UI
  const ratingOptions = [
    { stars: 1, count: 437 },
    { stars: 2, count: 657 },
    { stars: 3, count: 1897 },
    { stars: 4, count: 3571 },
  ];

  // Fetched products + loading/error
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState(null);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await authFetch("/products/listing/");
        setAllProducts(data);
        setLoadingProducts(false);
      } catch (err) {
        console.error(err);
        setErrorProducts(err.message);
        setLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // Derived state: unique categories and sizes
  const uniqueCategories = useMemo(() => {
    const categories = allProducts.map((p) => p.category);
    return ["All Categories", ...new Set(categories)];
  }, [allProducts]);

  const uniqueSizes = useMemo(() => {
    const sizes = allProducts.flatMap((p) => p.sizes || []);
    return ["All Sizes", ...new Set(sizes)];
  }, [allProducts]);

  // Price range calculation
  useEffect(() => {
    if (allProducts.length > 0) {
      const prices = allProducts.map((p) => p.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      setMinPrice(min);
      setMaxPrice(max);
      setSelectedPriceRange([min, max]);
    }
  }, [allProducts]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // Search term
      if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Category
      if (!selectedCategories.includes("All Categories") && !selectedCategories.includes(product.category)) {
        return false;
      }

      // Size
      if (!selectedSizes.includes("All Sizes")) {
        const hasSize = selectedSizes.some((size) => product.sizes?.includes(size));
        if (!hasSize) return false;
      }

      // Price range
      if (product.price < selectedPriceRange[0] || product.price > selectedPriceRange[1]) {
        return false;
      }

      // Rating
      if (selectedRating && product.rating < selectedRating) {
        return false;
      }

      return true;
    });
  }, [allProducts, searchTerm, selectedCategories, selectedSizes, selectedPriceRange, selectedRating]);

  // Handlers
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) => {
      if (category === "All Categories") {
        return ["All Categories"];
      }
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      const arr = Array.from(newSet);
      if (arr.includes("All Categories")) {
        return ["All Categories"];
      }
      return arr;
    });
  };

  const handleSizeChange = (size) => {
    setSelectedSizes((prev) => {
      if (size === "All Sizes") {
        return ["All Sizes"];
      }
      const newSet = new Set(prev);
      if (newSet.has(size)) {
        newSet.delete(size);
      } else {
        newSet.add(size);
      }
      const arr = Array.from(newSet);
      if (arr.includes("All Sizes")) {
        return ["All Sizes"];
      }
      return arr;
    });
  };

  const handlePriceChange = (event, newValue) => {
    setSelectedPriceRange(newValue);
  };

  const handlePriceOptionChange = (option) => {
    setSelectedPriceOption(option);
    if (option === "all") {
      setSelectedPriceRange([minPrice, maxPrice]);
    } else if (option === "under50") {
      setSelectedPriceRange([minPrice, 50]);
    } else if (option === "50to100") {
      setSelectedPriceRange([50, 100]);
    } else if (option === "over100") {
      setSelectedPriceRange([100, maxPrice]);
    }
  };

  const handleRatingChange = (rating) => {
    setSelectedRating(rating);
  };

  // Render
  return (
    <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Filters */}
      <div className="w-full md:w-1/4 bg-white rounded-lg shadow p-4">
        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category */}
        <div className="mb-4">
          <button
            onClick={() => setOpenCategory(!openCategory)}
            className="w-full flex justify-between items-center p-2 bg-gray-100 rounded"
          >
            <span>Category</span>
            {openCategory ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </button>
          {openCategory && (
            <div className="mt-2 space-y-2">
              {uniqueCategories.map((category) => (
                <label key={category} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="mr-2"
                  />
                  {category}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <button
            onClick={() => setOpenPrice(!openPrice)}
            className="w-full flex justify-between items-center p-2 bg-gray-100 rounded"
          >
            <span>Price</span>
            {openPrice ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </button>
          {openPrice && (
            <div className="mt-2">
              <div className="flex space-x-2 mb-2">
                {[
                  { label: "All", value: "all" },
                  { label: "Under $50", value: "under50" },
                  { label: "$50 - $100", value: "50to100" },
                  { label: "Over $100", value: "over100" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handlePriceOptionChange(option.value)}
                    className={`px-2 py-1 rounded text-sm ${
                      selectedPriceOption === option.value ? "bg-blue-500 text-white" : "bg-gray-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="px-2">
                <Slider
                  value={selectedPriceRange}
                  onChange={handlePriceChange}
                  valueLabelDisplay="auto"
                  min={minPrice}
                  max={maxPrice}
                  aria-labelledby="price-slider"
                />
                <div className="flex justify-between text-sm text-gray-600">
                  <span>${selectedPriceRange[0]}</span>
                  <span>${selectedPriceRange[1]}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Size */}
        <div className="mb-4">
          <button
            onClick={() => setOpenSize(!openSize)}
            className="w-full flex justify-between items-center p-2 bg-gray-100 rounded"
          >
            <span>Size</span>
            {openSize ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </button>
          {openSize && (
            <div className="mt-2 space-y-2">
              {uniqueSizes.map((size) => (
                <label key={size} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedSizes.includes(size)}
                    onChange={() => handleSizeChange(size)}
                    className="mr-2"
                  />
                  {size}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="mb-4">
          <button
            onClick={() => setOpenRating(!openRating)}
            className="w-full flex justify-between items-center p-2 bg-gray-100 rounded"
          >
            <span>Rating</span>
            {openRating ? <IoIosArrowUp /> : <IoIosArrowDown />}
          </button>
          {openRating && (
            <div className="mt-2 space-y-2">
              {ratingOptions.map((option) => (
                <label key={option.stars} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={selectedRating === option.stars}
                    onChange={() => handleRatingChange(option.stars)}
                    className="mr-2"
                  />
                  <div className="flex items-center">
                    {[...Array(option.stars)].map((_, i) => (
                      <FaStar key={i} className="text-yellow-500" />
                    ))}
                    <span className="ml-2 text-sm text-gray-600">({option.count})</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Products */}
      <div className="flex-1">
        {loadingProducts ? (
          <Loader />
        ) : errorProducts ? (
          <div className="text-red-500">Error loading products: {errorProducts}</div>
        ) : (
          <ProductSection products={filteredProducts} />
        )}
      </div>
    </div>
  );
};

export default FilterAndCard;
