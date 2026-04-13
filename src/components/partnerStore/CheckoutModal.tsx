/**
 * Phase 11 Partner Store - Checkout Modal
 * Razorpay integration for customer checkout
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, addDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import toast from 'react-hot-toast';
import { X, Check, CreditCard, Phone, MapPin, User, ArrowLeft, MessageCircle } from 'lucide-react';
import {
  formatCurrency, validateUPI, validatePhone, generateOrderId, PartnerProductData, OrderItemData,
} from '../../utils/partnerStore';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: PartnerProductData;
  shopSlug: string;
  partnerId: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  product,
  shopSlug,
  partnerId,
}) => {
  const [step, setStep] = useState<'form' | 'payment' | 'success'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerUpi, setCustomerUpi] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const totalAmount = product.partnerSellingPrice * quantity;
  const totalMargin = product.partnerMargin * quantity;

  const resetState = () => {
    setStep('form');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerUpi('');
    setQuantity(1);
    setError('');
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleNext = () => {
    // Validate form
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!validatePhone(customerPhone)) {
      setError('Enter a valid 10-digit phone number');
      return;
    }
    if (!customerAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    if (!validateUPI(customerUpi)) {
      setError('Enter a valid UPI ID (e.g., name@upi)');
      return;
    }
    setError('');
    setStep('payment');
  };

  const handlePayment = async () => {
    setIsProcessing(true);

    try {
      // In production, create Razorpay order via Cloud Function
      // For now, simulate payment success
      const orderId = generateOrderId();

      // Create order document
      const orderData = {
        orderId,
        shopSlug,
        partnerId,
        customerId: 'guest_' + Date.now(),
        customerDetails: {
          name: customerName,
          phone: customerPhone,
          address: customerAddress,
          upiId: customerUpi,
        },
        items: [
          {
            productId: product.productId,
            productName: product.productData?.name || 'Product',
            quantity,
            sellingPrice: product.partnerSellingPrice,
            margin: product.partnerMargin,
            image: product.productData?.images?.[0] || '',
          } as OrderItemData,
        ],
        totalAmount,
        totalPartnerMargin: totalMargin,
        status: 'pending',
        marginStatus: 'holding',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'partnerOrders'), orderData);

      // In production, initialize Razorpay:
      // const options = {
      //   key: 'rzp_test_xxx',
      //   amount: totalAmount * 100,
      //   currency: 'INR',
      //   name: shopName,
      //   description: product.productData?.name,
      //   order_id: razorpayOrderId,
      //   handler: async (response) => {
      //     await updateDoc(doc(db, 'partnerOrders', orderId), {
      //       razorpayPaymentId: response.razorpay_payment_id,
      //       status: 'processing',
      //     });
      //   },
      //   prefill: {
      //     name: customerName,
      //     contact: customerPhone,
      //   },
      // };
      // const razorpay = new window.Razorpay(options);
      // razorpay.open();

      // Simulate success for demo
      setStep('success');
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-[#111111] w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[90vh] overflow-y-auto border border-gray-800/50"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#111111] border-b border-gray-800/50 p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                {step !== 'form' && (
                  <button onClick={() => setStep(step === 'success' ? 'form' : 'form')} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Go back">
                    <ArrowLeft size={20} />
                  </button>
                )}
                <h3 className="text-white font-bold text-lg">
                  {step === 'form' ? 'Checkout' : step === 'payment' ? 'Payment' : 'Success!'}
                </h3>
              </div>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-2">
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              {/* Step 1: Customer Details Form */}
              {step === 'form' && (
                <>
                  {/* Product Summary */}
                  <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{product.productData?.name}</span>
                      <span className="text-[#E8B84B] font-bold">{formatCurrency(product.partnerSellingPrice)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Quantity</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center text-gray-400 hover:text-white">
                          <span>-</span>
                        </button>
                        <span className="text-white font-bold w-8 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center text-gray-400 hover:text-white">
                          <span>+</span>
                        </button>
                      </div>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
                      <span className="text-gray-300 font-semibold">Total</span>
                      <span className="text-[#E8B84B] font-black text-xl">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <User size={14} /> Full Name
                      </label>
                      <input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <Phone size={14} /> Phone Number
                      </label>
                      <input
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <MapPin size={14} /> Delivery Address
                      </label>
                      <textarea
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Enter your full address"
                        rows={3}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                        <CreditCard size={14} /> UPI ID (for refunds)
                      </label>
                      <input
                        value={customerUpi}
                        onChange={(e) => setCustomerUpi(e.target.value)}
                        placeholder="name@upi"
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-gray-800/50 rounded-xl text-white placeholder-gray-600 focus:border-[#E8B84B] transition-colors min-h-[44px]"
                      />
                    </div>
                  </div>

                  <button onClick={handleNext} className="w-full bg-gradient-to-r from-[#E8B84B] to-[#F5C95C] text-black font-bold py-4 rounded-xl min-h-[44px]">
                    Proceed to Payment
                  </button>
                </>
              )}

              {/* Step 2: Payment */}
              {step === 'payment' && (
                <div className="space-y-6">
                  {/* Order Summary */}
                  <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Customer</span>
                      <span className="text-white font-medium">{customerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Phone</span>
                      <span className="text-white font-medium">{customerPhone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Product</span>
                      <span className="text-white font-medium">{product.productData?.name} x{quantity}</span>
                    </div>
                    <div className="border-t border-gray-800 pt-3 flex items-center justify-between">
                      <span className="text-gray-300 font-semibold">Total Amount</span>
                      <span className="text-[#E8B84B] font-black text-xl">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="space-y-3">
                    <button
                      onClick={handlePayment}
                      disabled={isProcessing}
                      className="w-full bg-[#1A1A1A] border border-[#2A2A2A] hover:border-[#E8B84B]/30 rounded-xl p-4 flex items-center justify-between transition-all min-h-[44px]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                          <CreditCard size={20} className="text-blue-400" />
                        </div>
                        <div className="text-left">
                          <p className="text-white font-semibold text-sm">Razorpay</p>
                          <p className="text-gray-500 text-xs">Cards, UPI, Wallets</p>
                        </div>
                      </div>
                      <Check size={20} className="text-[#E8B84B]" />
                    </button>
                  </div>

                  <button onClick={() => setStep('form')} className="w-full py-3 text-gray-400 font-semibold min-h-[44px]">
                    Back to Details
                  </button>
                </div>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <div className="text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                    className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto"
                  >
                    <Check size={40} className="text-green-400" />
                  </motion.div>

                  <div>
                    <h4 className="text-white font-bold text-xl mb-2">Order Placed Successfully!</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Thank you for your purchase. You'll receive updates via WhatsApp.
                    </p>
                    <div className="bg-[#1A1A1A] rounded-xl p-4 space-y-2 text-left">
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Order ID</span>
                        <span className="text-white font-mono text-sm">ORD-XXXXXX</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Amount Paid</span>
                        <span className="text-green-400 font-bold">{formatCurrency(totalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 text-sm">Status</span>
                        <span className="text-yellow-400 text-sm">Pending</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        window.open(`https://wa.me/?text=${encodeURIComponent(`My Order: ORD-XXXXXX. Track at: ${window.location.href}`)}`, '_blank');
                      }}
                      className="w-full bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <MessageCircle size={18} /> Track on WhatsApp
                    </button>
                    <button onClick={handleClose} className="w-full bg-[#E8B84B] text-black font-bold py-3 rounded-xl min-h-[44px]">
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
