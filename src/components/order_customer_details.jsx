// OrderRightSection.js
import React, { useContext } from "react";
import mtnLogo from "../assets/mtn.jpg";
import airtelLogo from "../assets/airrtel.jpg";
import mastercardLogo from "../assets/mastercard.jpg";
import visaLogo from "../assets/visa.jpg";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { UserContext } from "../context/usercontext";
import { PaymentContext } from "../context/paymentcontext";

// OrderSummaryCard remains unchanged.
function OrderSummaryCard({ order }) {
  const subTotal = order.items.reduce(
    (acc, item) => acc + Number(item.subtotal),
    0
  );
  const discountPercent = order.discount_percent || 0;
  const deliveryCharge = order.delivery_charge || 3000;
  const taxPercent = order.tax_percent || 2.5;

  const discountAmount = subTotal * (discountPercent / 100);
  const taxAmount = subTotal * (taxPercent / 100);
  const totalAmount = subTotal - discountAmount + deliveryCharge + taxAmount;

  const formatPrice = (price) => `UGX ${price.toFixed(0)}`;

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-[12px] font-semibold text-gray-800">
          Order Summary
        </h2>
      </div>
      <div className="p-6 border-t border-gray-200">
        <div className="text-[11px] text-gray-600 space-y-1">
          <p>
            Sub Total:
            <span className="float-right font-medium">
              {formatPrice(subTotal)}
            </span>
          </p>
          <p>
            Discount:
            <span className="float-right font-medium text-green-600">
              {discountPercent}%
            </span>
          </p>
          <p>
            Delivery Charge:
            <span className="float-right font-medium">
              {formatPrice(deliveryCharge)}
            </span>
          </p>
          <p>
            Estimated Tax ({taxPercent}%):
            <span className="float-right font-medium">
              {formatPrice(taxAmount)}
            </span>
          </p>
          <hr />
          <p className="font-semibold">
            Total Amount:
            <span className="float-right text-gray-800">
              {formatPrice(totalAmount)}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentInformationCard({ order }) {
  // Use PaymentContext to obtain paymentMethods array.
  const { paymentMethods } = useContext(PaymentContext);
  
  // Lookup the payment method that matches the order's customer ID.
  const paymentMethodForOrder =
    paymentMethods.find(
      (pm) => Number(pm.customer) === Number(order.customer)
    ) || {};
  
  // Use the payment method from API for network and momo number,
  // defaulting to "mtn" if not available.
  const network = (paymentMethodForOrder.network || "mtn").toLowerCase();
  const momoNumber = paymentMethodForOrder.momo_number || "";
  
  // Determine which logo and label to show based on network.
  let logoSrc, methodLabel;
  switch (network) {
    case "airtel":
      logoSrc = airtelLogo;
      methodLabel = "Airtel Money";
      break;
    case "mastercard":
      logoSrc = mastercardLogo;
      methodLabel = "Mastercard";
      break;
    case "visa":
      logoSrc = visaLogo;
      methodLabel = "Visa";
      break;
    case "mtn":
    default:
      logoSrc = mtnLogo;
      methodLabel = "MTN Mobile Money";
      break;
  }
  
  // Use the momo number from API if available, otherwise fallback.
  const accountNumber = momoNumber || order.payment_account_number || "+256 701 234567";
  // Keep txn id and account holder constant.
  const txnId = order.transaction_id || "#MTN768139059";
  const accountHolder = order.account_holder_name || "Alinatwe Ian";

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-[12px] font-semibold text-gray-800">
          Payment Information
        </h2>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4">
          <img src={logoSrc} alt={`${methodLabel} logo`} className="w-8 h-8" />
          <div>
            <p className="text-[11px] font-semibold text-gray-500">
              {methodLabel}
            </p>
            <p className="text-[11px] text-gray-600">{accountNumber}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-dotted border-gray-200 pt-4">
          <div className="grid grid-cols-1 gap-2">
            <p className="text-[11px]">
              <span className="font-medium text-gray-600">Txn ID:</span>{" "}
              <span className="text-gray-600">{txnId}</span>
            </p>
            <p className="text-[11px]">
              <span className="font-medium text-gray-600">
                Account Holder Name:
              </span>{" "}
              <span className="text-gray-600">{accountHolder}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CustomerDetailsPlaceholderCard({ order }) {
  const { users } = useContext(UserContext);
  const customer =
    users.find((u) => Number(u.id) === Number(order.customer)) || {};

  const customerName = customer.username || order.customer_name || "Unknown";
  const customerEmail =
    customer.email || order.customer_email || "No email provided";
  const initials = customerName
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-[12px] font-semibold text-gray-800">
          Customer Details
        </h2>
      </div>
      <div className="p-6">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-full bg-[#f9622c] flex items-center justify-center text-lg font-medium text-[#280300]">
            {initials}
          </div>
          <div>
            <p className="text-[11px] font-semibold text-gray-800">
              {customerName}
            </p>
            <p className="text-[10px] text-gray-600">{customerEmail}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="mb-3">
            <p className="text-[10px] font-medium text-gray-600">
              Contact Number
            </p>
            <p className="text-[10px] text-gray-600">
              {order.contact_number || "0774788071"}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium text-gray-800">
              Delivery Address
            </p>
            <p className="text-[10px] text-gray-600">
              {order.delivery_address ||
                `1 Burton Street, P.O. Box 651
Pioneer Mall
Kampala, Uganda`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapDetailsCard({ order }) {
  const position = order.delivery_coordinates || [0.3476, 32.5825];
  const deliveryAddress =
    order.delivery_address ||
    "1 Burton Street, P.O. Box 651, Pioneer Mall, Kampala, Uganda";

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-[12px] font-semibold text-gray-800">
          Delivery Address Details
        </h2>
      </div>
      <div className="p-6">
        <MapContainer
          center={position}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-64 rounded-lg"
        >
          <TileLayer
            url="https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
          />
          <Marker position={position}>
            <Popup>{deliveryAddress}</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default function CustomerDetailsCard({ order }) {
  return (
    <div className="space-y-4">
      <OrderSummaryCard order={order} />
      <PaymentInformationCard order={order} />
      <CustomerDetailsPlaceholderCard order={order} />
      <MapDetailsCard order={order} />
    </div>
  );
}