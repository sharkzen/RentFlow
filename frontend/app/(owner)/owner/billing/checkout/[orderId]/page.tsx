import React from "react";
import CheckoutPage from "@/features/billing/components/owner/CheckoutPage";

export const metadata = {
  title: "สรุปคำสั่งซื้อและชำระเงิน",
};

export default async function OwnerCheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return <CheckoutPage orderId={orderId} />;
}
