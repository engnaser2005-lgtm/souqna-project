export type Category = { slug: string; name: string; icon: string };

export const CATEGORIES: Category[] = [
  { slug: "electronics", name: "الإلكترونيات", icon: "📱" },
  { slug: "fashion", name: "الأزياء والموضة", icon: "👗" },
  { slug: "beauty", name: "الجمال والعناية الشخصية", icon: "💄" },
  { slug: "automotive", name: "السيارات وقطع الغيار", icon: "🚗" },
  { slug: "home", name: "البيت والمطبخ", icon: "🏠" },
  { slug: "baby", name: "الأم والطفل", icon: "👶" },
  { slug: "grocery", name: "السوبر ماركت والمواد الغذائية", icon: "🛒" },
  { slug: "books", name: "الكتب والقرطاسية", icon: "📚" },
  { slug: "pets", name: "الحيوانات الأليفة", icon: "🐾" },
];

export const PROMO_LISTS = [
  { slug: "bestsellers", name: "الأكثر مبيعاً", icon: "🔥" },
  { slug: "deals", name: "عروض وخصومات", icon: "💰" },
  { slug: "new", name: "وصل حديثاً", icon: "✨" },
  { slug: "clearance", name: "تصفية المخزون", icon: "📦" },
  { slug: "featured", name: "مميز / مختار لك", icon: "⭐" },
];

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  category: string;
  tag?: string;
};

export const PRODUCTS: Product[] = [
  { id: "p1", name: "سماعات لاسلكية احترافية", price: 249, oldPrice: 399, rating: 4.7, reviews: 1284, image: "https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?w=600&q=80", category: "electronics", tag: "deals" },
  { id: "p2", name: "ساعة ذكية بشاشة AMOLED", price: 599, rating: 4.8, reviews: 932, image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80", category: "electronics", tag: "bestsellers" },
  { id: "p3", name: "حقيبة جلدية فاخرة", price: 320, oldPrice: 450, rating: 4.5, reviews: 412, image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80", category: "fashion", tag: "new" },
  { id: "p4", name: "نظارة شمسية كلاسيكية", price: 180, rating: 4.3, reviews: 256, image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=80", category: "fashion" },
  { id: "p5", name: "مجموعة عناية بالبشرة", price: 145, rating: 4.6, reviews: 678, image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&q=80", category: "beauty", tag: "featured" },
  { id: "p6", name: "خلاط كهربائي متعدد الوظائف", price: 215, oldPrice: 280, rating: 4.4, reviews: 389, image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&q=80", category: "home", tag: "deals" },
  { id: "p7", name: "كاميرا مراقبة ذكية", price: 429, rating: 4.7, reviews: 540, image: "https://images.unsplash.com/photo-1558002038-1055907df827?w=600&q=80", category: "electronics", tag: "new" },
  { id: "p8", name: "حذاء رياضي مريح", price: 275, rating: 4.5, reviews: 822, image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80", category: "fashion", tag: "bestsellers" },
  { id: "p9", name: "كرسي مكتب إرغونومي", price: 890, oldPrice: 1200, rating: 4.6, reviews: 198, image: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=600&q=80", category: "home", tag: "clearance" },
  { id: "p10", name: "عطر شرقي فاخر 100مل", price: 360, rating: 4.9, reviews: 1532, image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&q=80", category: "beauty", tag: "featured" },
  { id: "p11", name: "لعبة تعليمية للأطفال", price: 95, rating: 4.4, reviews: 312, image: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=600&q=80", category: "baby", tag: "new" },
  { id: "p12", name: "مجموعة كتب الأكثر مبيعاً", price: 130, rating: 4.7, reviews: 421, image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80", category: "books", tag: "bestsellers" },
];
