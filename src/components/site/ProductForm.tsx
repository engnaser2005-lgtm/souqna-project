import { useState, type FormEvent, type ChangeEvent } from "react";
import { Loader2, Upload, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/catalog";

export type ProductFormValues = {
  title: string;
  price: string;
  description: string;
  category: string;
  quantity: string;
  condition: string;
  city: string;
  contact_number: string;
  images: string[]; // existing image URLs
};

const EMPTY: ProductFormValues = {
  title: "",
  price: "",
  description: "",
  category: CATEGORIES[0].slug,
  quantity: "1",
  condition: "new",
  city: "",
  contact_number: "",
  images: [],
};

const CONDITIONS = [
  { value: "new", label: "جديد" },
  { value: "like_new", label: "كالجديد" },
  { value: "used", label: "مستعمل" },
  { value: "refurbished", label: "مجدد" },
];

type Props = {
  initial?: Partial<ProductFormValues>;
  userId: string;
  submitLabel: string;
  onSubmit: (values: {
    title: string;
    price: number;
    description: string;
    category: string;
    quantity: number;
    condition: string;
    city: string;
    contact_number: string;
    images: string[];
  }) => Promise<void>;
};

export function ProductForm({ initial, userId, submitLabel, onSubmit }: Props) {
  const [v, setV] = useState<ProductFormValues>({ ...EMPTY, ...initial });
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }

  function handleFiles(e: ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;
    const valid = list.filter((f) => {
      if (!f.type.startsWith("image/")) {
        toast.error(`${f.name} ليس صورة`);
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} أكبر من 5 ميجا`);
        return false;
      }
      return true;
    });
    setFiles((p) => [...p, ...valid]);
    setPreviews((p) => [...p, ...valid.map((f) => URL.createObjectURL(f))]);
    e.target.value = "";
  }

  function removeNewFile(i: number) {
    setFiles((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  }

  function removeExisting(i: number) {
    set("images", v.images.filter((_, idx) => idx !== i));
  }

  async function uploadAll(): Promise<string[]> {
    if (!files.length) return [];
    setUploading(true);
    const urls: string[] = [];
    try {
      for (const file of files) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!v.title.trim() || v.title.length > 200) return toast.error("اسم المنتج مطلوب (أقل من 200 حرف)");
    const price = parseFloat(v.price);
    if (!Number.isFinite(price) || price < 0) return toast.error("سعر غير صالح");
    if (!v.description.trim()) return toast.error("الوصف مطلوب");
    const qty = parseInt(v.quantity, 10);
    if (!Number.isFinite(qty) || qty < 0) return toast.error("الكمية غير صالحة");
    if (!v.city.trim()) return toast.error("المدينة مطلوبة");
    if (!v.contact_number.trim()) return toast.error("رقم التواصل مطلوب");

    setSubmitting(true);
    try {
      const newUrls = await uploadAll();
      const allImages = [...v.images, ...newUrls];
      if (!allImages.length) {
        toast.error("أضف صورة واحدة على الأقل");
        setSubmitting(false);
        return;
      }
      await onSubmit({
        title: v.title.trim(),
        price,
        description: v.description.trim(),
        category: v.category,
        quantity: qty,
        condition: v.condition,
        city: v.city.trim(),
        contact_number: v.contact_number.trim(),
        images: allImages,
      });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full rounded-lg border border-border/60 bg-secondary/40 px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:bg-secondary";
  const labelCls = "mb-1.5 block text-sm font-bold text-foreground";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className={labelCls}>اسم المنتج *</label>
        <input className={inputCls} value={v.title} onChange={(e) => set("title", e.target.value)} maxLength={200} placeholder="مثال: ساعة ذكية موديل 2024" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>السعر (ر.س) *</label>
          <input className={inputCls} type="number" step="0.01" min="0" value={v.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
        </div>
        <div>
          <label className={labelCls}>الكمية المتوفرة *</label>
          <input className={inputCls} type="number" min="0" value={v.quantity} onChange={(e) => set("quantity", e.target.value)} />
        </div>
      </div>

      <div>
        <label className={labelCls}>الوصف *</label>
        <textarea className={`${inputCls} min-h-[120px] resize-y`} value={v.description} onChange={(e) => set("description", e.target.value)} maxLength={2000} placeholder="اشرح المنتج بالتفصيل..." />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>القسم *</label>
          <select className={inputCls} value={v.category} onChange={(e) => set("category", e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>حالة المنتج *</label>
          <select className={inputCls} value={v.condition} onChange={(e) => set("condition", e.target.value)}>
            {CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>المدينة *</label>
          <input className={inputCls} value={v.city} onChange={(e) => set("city", e.target.value)} maxLength={100} placeholder="مثال: الرياض" />
        </div>
        <div>
          <label className={labelCls}>رقم التواصل *</label>
          <input className={inputCls} type="tel" value={v.contact_number} onChange={(e) => set("contact_number", e.target.value)} maxLength={30} placeholder="+9665xxxxxxxx" dir="ltr" />
        </div>
      </div>

      <div>
        <label className={labelCls}>صور المنتج * (حتى 5 ميجا لكل صورة)</label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {v.images.map((url, i) => (
            <div key={`e-${i}`} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-border">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <button type="button" onClick={() => removeExisting(i)} className="absolute top-1 end-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {previews.map((url, i) => (
            <div key={`n-${i}`} className="group relative aspect-square overflow-hidden rounded-lg ring-1 ring-primary/40">
              <img src={url} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-1 start-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">جديد</span>
              <button type="button" onClick={() => removeNewFile(i)} className="absolute top-1 end-1 rounded-full bg-black/70 p-1 text-white opacity-0 transition group-hover:opacity-100">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-primary/40 bg-secondary/30 text-primary transition hover:bg-secondary/60">
            <ImagePlus className="h-6 w-6" />
            <span className="text-xs font-bold">إضافة</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting || uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? (
          <><Loader2 className="h-5 w-5 animate-spin" /> {uploading ? "جاري رفع الصور..." : "جاري الحفظ..."}</>
        ) : (
          <><Upload className="h-5 w-5" /> {submitLabel}</>
        )}
      </button>
    </form>
  );
}
