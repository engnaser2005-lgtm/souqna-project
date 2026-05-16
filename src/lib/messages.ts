export type Message = {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  sender_id: string;
  message: string;
  read_at: string | null;
  created_at: string;
};
