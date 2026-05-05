"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "react-toastify";
import { Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayCheckoutProps {
  orderId: string;
  amount: number;
  name: string;
  email: string;
  phone: string;
  onSuccess: (paymentData: {
    razorpayPaymentId: string;
    razorpayOrderId: string;
    razorpaySignature: string;
  }) => void;
}

export default function RazorpayCheckout({
  orderId,
  amount,
  name,
  email,
  phone,
  onSuccess,
}: RazorpayCheckoutProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Create Razorpay order
  const createRazorpayOrder = async () => {
    if (razorpayOrderId) {
      console.log("Using existing Razorpay order ID:", razorpayOrderId);
      return razorpayOrderId;
    }

    try {
      setIsLoading(true);
      console.log("Calling Razorpay API to create order...");
      console.log("Order details:", { orderId, amount });
      
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          amount,
        }),
      });

      console.log("API response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || "Failed to create Razorpay order");
      }

      const data = await response.json();
      console.log("API success response:", data);
      setRazorpayOrderId(data.id);
      return data.id;
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to initialize payment");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Display Razorpay payment form
  const displayRazorpay = async () => {
    console.log("Initializing Razorpay payment...");
    console.log("Key ID:", process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    
    if (!window.Razorpay) {
      console.error("Razorpay SDK not loaded");
      toast.error("Razorpay SDK failed to load. Please try again later.");
      return;
    }

    try {
      setIsLoading(true);
      console.log("Creating Razorpay order...");
      const rzpOrderId = await createRazorpayOrder();
      console.log("Razorpay order created:", rzpOrderId);
      
      if (!rzpOrderId) {
        throw new Error("Failed to create Razorpay order");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: amount * 100, // amount in smallest currency unit (paise)
        currency: "INR",
        name: "CampusFund",
        description: `Order #${orderId}`,
        order_id: rzpOrderId,
        prefill: {
          name,
          email,
          contact: phone,
        },
        theme: {
          color: "#22653b", // green-600
        },
        handler: function (response: any) {
          // Handle payment success
          onSuccess({
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });
        },
        modal: {
          ondismiss: function () {
            setIsLoading(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Error displaying Razorpay:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={displayRazorpay}
      className="w-full bg-green-600 hover:bg-green-700"
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Lock className="mr-2 h-4 w-4" />
          Pay with Razorpay
        </>
      )}
    </Button>
  );
} 