import React, { useState, useContext } from "react";
import ReactDOM from "react-dom";
import { FiX, FiZoomIn, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { FaCheck, FaTimes } from "react-icons/fa";
import { LoansContext } from "../context/loanscontext";

/**
 * LoansModal.jsx
 * React‑Vite modal component for displaying a vendor loan application.
 * Uses loan data passed via props and LoansContext for updates.
 * Shows a permanent green "APPROVED" watermark when the loan status is "Approved".
 */

const LoansModal = ({ isOpen, onClose, loan }) => {
  const { vendors, updateLoanStatus, error } = useContext(LoansContext);
  const [activeTab, setActiveTab] = useState("details");
  const [zoomSrc, setZoomSrc] = useState(null);
  const [docsOpen, setDocsOpen] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [isApproved, setIsApproved] = useState(loan?.status === "Approved"); // Check initial status

  // Debugging: Log loan prop
  console.log('LoansModal loan prop:', loan);

  if (!isOpen || !loan) return null;

  const {
    id: applicationId = '',
    vendor_username = 'Unknown',
    amount = '0',
    purpose = '-',
    duration = '-',
    payment_frequency = '-',
    national_id_number = '-',
    national_id_photo = null,
    business_documents = null,
    guarantors = [],
    status = '', // Use raw status, no default 'Pending'
    created_at = new Date().toISOString(),
    total_repayable = '0',
    weekly_payment = '0',
    monthly_payment = '0',
    current_balance = '0',
  } = loan;

  // Map guarantor IDs to usernames
  const guarantorUsernames = Array.isArray(guarantors) && guarantors.length > 0
    ? guarantors
        .map(guarantorId => {
          const vendor = Array.isArray(vendors) ? vendors.find(v => v.id === guarantorId) : null;
          return vendor ? vendor.username : 'Unknown';
        })
        .join('\n')
    : '-';

  // Financial calculations
  const principal = parseFloat(amount) || 0;
  const totalRepayable = parseFloat(total_repayable) || principal;
  const weeklyPayable = parseFloat(weekly_payment) || 0;
  const monthlyPayable = parseFloat(monthly_payment) || 0;

  // Documents
  const documents = [];
  if (national_id_photo) {
    documents.push({ type: "National ID", uri: national_id_photo, label: "National ID" });
  }
  if (business_documents) {
    documents.push({ type: "Business Document", uri: business_documents, label: "Business Document" });
  }

  // Handler for Approve using API with Bearer token and PATCH
  const handleApprove = async () => {
    setIsApproving(true);
    setActionError(null);

    // Retrieve token from localStorage
    const token = localStorage.getItem('authToken');
    console.log('Auth token (authToken):', token ? 'Present' : 'Missing');

    if (!token) {
      setActionError('Authentication required. Please log in.');
      setIsApproving(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/loans/${applicationId}/approve/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      console.log('Approve API response:', response);

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error('Invalid or expired credentials. Please log in again.');
        }
        throw new Error(errorData.error || errorData.detail || 'Failed to approve loan');
      }

      console.log('Loan approved successfully for ID:', applicationId);
      setIsApproved(true); // Set approved state to show watermark permanently
    } catch (err) {
      console.error('Approve error:', err.message);
      setActionError(err.message || 'Failed to approve loan. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  // Handler for Reject (unchanged, using LoansContext)
  const handleReject = async () => {
    setIsRejecting(true);
    setActionError(null);
    try {
      await updateLoanStatus(applicationId, "Rejected", "Loan application rejected by admin.");
      onClose(); // Close modal on success
    } catch {
      setActionError("Failed to reject loan. Please try again.");
    } finally {
      setIsRejecting(false);
    }
  };

  // Render documents with zoom and download functionality
  const renderDocs = () => {
    if (!documents.length) {
      return <p className="text-gray-500 italic text-[11px]">No documents uploaded.</p>;
    }

    const idDocs = documents.filter((d) => d.type === "National ID");
    const otherDocs = documents.filter((d) => d.type !== "National ID");

    const renderColumn = (title, docs) => (
      <div>
        <p className="text-[11px] font-medium mb-1">{title}</p>
        {docs.length ? (
          docs.map((doc, i) => (
            <div key={i} className="mb-4">
              <div className="relative group w-32">
                <img
                  src={doc.uri}
                  alt={doc.label || doc.type}
                  className="w-full h-auto max-h-24 object-contain border rounded"
                />
                <button
                  onClick={() => setZoomSrc(doc.uri)}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-25 opacity-0 group-hover:opacity-100 transition rounded"
                >
                  <FiZoomIn size={20} className="text-white" />
                </button>
              </div>
              <div className="mt-2">
                <a
                  href={doc.uri}
                  download
                  className="px-2 py-1 rounded text-[11px] text-[#f9622c] hover:bg-gray-300 inline-block"
                >
                  Download
                </a>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 italic text-[11px]">No {title}.</p>
        )}
      </div>
    );

    return (
      <div className="grid grid-cols-2 gap-6">
        {renderColumn("National ID Documents", idDocs)}
        {renderColumn("Other Documents", otherDocs)}
      </div>
    );
  };

  // Overview data
  const overview = [
    { label: "Application ID", value: applicationId },
    { label: "Vendor Name", value: vendor_username },
    { label: "Wallet Balance", value: current_balance || '-' },
    { label: "Guarantor", value: guarantorUsernames },
    { label: "Status", value: status || 'Unknown' },
    { label: "Applied Date", value: created_at.split('T')[0] },
  ];

  // Zoom modal rendered into body via portal
  const ZoomModal = () => (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-[9999] p-4"
      onClick={() => setZoomSrc(null)}
    >
      <div className="relative w-full h-full max-w-4xl max-h-screen overflow-auto rounded-lg bg-white p-2">
        <button
          onClick={() => setZoomSrc(null)}
          className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75 z-10"
        >
          <FiX size={24} />
        </button>
        <img src={zoomSrc} alt="Zoomed document" className="w-full h-auto object-contain" />
      </div>
    </div>
  );

  return (
    <>
      {/* Main Modal */}
      <div
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
        onClick={onClose}
      >
        <div
          className="w-[90%] md:w-[75%] max-h-[95vh] overflow-y-auto rounded shadow-lg bg-white relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Approved Watermark - Display permanently if status is Approved */}
          {isApproved && (
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
              <div
                className="text-green-600 text-[100px] font-bold rotate-[-45deg] opacity-100"
                style={{
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                }}
              >
                APPROVED
              </div>
            </div>
          )}

          {/* Close button */}
          <div className="flex justify-end p-6">
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <FiX size={20} />
            </button>
          </div>

          {/* Summary header */}
          <div className="bg-gray-100 text-gray-600 px-6 py-3 flex justify-between text-center">
            {[
              { label: "Requested Amount", value: principal.toFixed(2) },
              { label: "Total Repayable", value: totalRepayable.toFixed(2) },
              { label: "Applied Date", value: created_at.split('T')[0] },
            ].map((item, idx) => (
              <div key={idx} className="text-[11px]">
                <p>{item.label}</p>
                <p className="font-semibold text-[13px] text-[#f9622c]">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs & Content */}
          <div className="px-6 pt-4">
            <div className="flex space-x-4 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("details")}
                className={`py-2 text-[11px] border-b-2 transition ${
                  activeTab === "details"
                    ? "border-[#f9622c] text-[#f9622c]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Application Details
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-2 text-[11px] border-b-2 transition ${
                  activeTab === "history"
                    ? "border-[#f9622c] text-[#f9622c]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Repayment History
              </button>
            </div>

            {activeTab === "details" && (
              <div className="mt-6 space-y-6">
                {/* Error message */}
                {(error || actionError) && (
                  <div className="text-red-600 text-[11px] text-center">
                    {error || actionError}
                  </div>
                )}

                {/* Overview grid */}
                <div className="grid grid-cols-3 gap-4">
                  {overview.map((o) => (
                    <div key={o.label}>
                      <p className="text-gray-500 text-[11px]">{o.label}</p>
                      <p className="text-gray-700 text-[11px] font-medium" style={{ whiteSpace: 'pre-line' }}>
                        {o.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Specifics grid */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Loan Purpose", value: purpose },
                    { label: "Duration", value: `${duration} months` },
                    { label: "Payment Plan", value: payment_frequency },
                    { label: "Weekly Payable", value: weeklyPayable.toFixed(2) },
                    { label: "Monthly Payable", value: monthlyPayable.toFixed(2) },
                  ].map((s) => (
                    <div key={s.label}>
                      <p className="text-gray-500 text-[11px]">{s.label}</p>
                      <p className="text-gray-700 text-[11px] font-medium">{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* NIN info */}
                <div>
                  <p className="text-gray-500 text-[11px]">NIN Number</p>
                  <p className="text-gray-700 text-[11px] font-medium">{national_id_number}</p>
                </div>

                {/* Documents section */}
                <div>
                  <div className="border rounded-md">
                    <div
                      className="px-4 py-2 bg-gray-100 cursor-pointer text-[11px] font-medium flex justify-between items-center"
                      onClick={() => setDocsOpen(!docsOpen)}
                    >
                      <span>Uploaded Documents</span>
                      {docsOpen ? <FiChevronUp /> : <FiChevronDown />}
                    </div>
                    {docsOpen && <div className="p-4 text-[11px]">{renderDocs()}</div>}
                  </div>
                </div>

                {/* Approve/Reject Buttons (only for Pending status) */}
                {status === "Pending" && (
                  <div className="flex justify-end space-x-4 mt-6 pb-6">
                    <button
                      className="flex items-center justify-center w-24 h-8 text-white text-[11px] rounded-md border border-[#f9622c] bg-[#f9622c]"
                      onClick={handleApprove}
                      disabled={isApproving || isRejecting}
                      aria-label="Approve loan application"
                    >
                      <FaCheck className="mr-1" />
                      {isApproving ? "Approving..." : "Approve"}
                    </button>
                    <button
                      className="flex items-center justify-center w-24 h-8 bg-[#fff] text-[#280300] text-[11px] rounded-md border border-[#280300]"
                      onClick={handleReject}
                      disabled={isRejecting || isApproving}
                      aria-label="Reject loan application"
                    >
                      <FaTimes className="mr-1" />
                      {isRejecting ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "history" && (
              <div className="mt-6 pb-6">
                <p className="text-center text-gray-500 text-[11px]">
                  No repayment history available.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoom Modal via Portal */}
      {zoomSrc && ReactDOM.createPortal(<ZoomModal />, document.body)}
    </>
  );
};

export default LoansModal;