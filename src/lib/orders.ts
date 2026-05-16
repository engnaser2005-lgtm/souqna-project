export const BANK_INFO = {
  bankName: "البنك الأهلي السعودي",
  accountName: "شركة سوقنا للتجارة",
  accountNumber: "SA0380000000608010167519",
  iban: "SA0380000000608010167519",
  wallet: {
    name: "STC Pay",
    number: "+966500000000",
  },
  note: "يرجى تحويل المبلغ كاملاً ثم رفع صورة الإيصال لإكمال الطلب.",
};

export const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "بانتظار الدفع", color: "bg-amber-500/20 text-amber-300" },
  pending_payment_review: { label: "قيد مراجعة الإدارة", color: "bg-sky-500/20 text-sky-300" },
  approved: { label: "تم تأكيد الدفع", color: "bg-emerald-500/20 text-emerald-300" },
  rejected: { label: "تم رفض الدفع", color: "bg-rose-500/20 text-rose-300" },
};

export const SHIPPING_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  not_shipped: { label: "لم يُشحن بعد", color: "bg-muted text-muted-foreground" },
  shipped: { label: "تم الشحن", color: "bg-sky-500/20 text-sky-300" },
  delivered: { label: "تم الاستلام", color: "bg-emerald-500/20 text-emerald-300" },
};
