import { Metadata } from "next";
import { OrderCatalogView } from "@/components/order/OrderCatalogView";
import { getCustomerCookieInfo, getCurrentCustomer } from "@/lib/customer-auth";
import { db } from "@/lib/db";
import type { CatalogProduct } from "@/components/order/ProductCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pesan Online & Eksplorasi Menu | Baitybites",
  description: "Pesan Risol Mayo artisan leleh, aneka varian Risol gourmet, minuman Cendol signature, dan hampers Baitybites dengan pengiriman ekspres Paxel.",
};

// Data katalog fallback yang kaya rasa dan detail
const DEFAULT_CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    id: "p1",
    name: "Risol Mayo Beef Double Cheese",
    category: "Risol Frozen",
    price: 48000,
    unit: "Pack",
    description: "Smoked beef premium dengan saus mayo lumer racikan rahasia dan taburan double keju cheddar mozzarella.",
    tag: "Best Seller",
    stock: 24,
    imageUrl: "/images/backgrounds/hero-risol.jpg",
    isHighlighted: true,
  },
  {
    id: "p2",
    name: "Risol Beef Mushroom Truffle",
    category: "Risol Ready to Eat",
    price: 30000,
    unit: "Pack",
    description: "Risol gurih dengan isian beef jamur keju dan saos mushroom homemade yang creamy lezat.",
    tag: "Chef Special",
    stock: 4,
    imageUrl: null,
    isHighlighted: true,
  },
  {
    id: "p3",
    name: "Risol Mayo Beef Single Pcs",
    category: "Risol Ready to Eat",
    price: 7000,
    unit: "Pcs",
    description: "Risol mayo dengan isian daging sapi dan keju premium, digoreng renyah keemasan saat dipesan.",
    tag: "Populer",
    stock: 18,
    imageUrl: null,
    isHighlighted: false,
  },
  {
    id: "p4",
    name: "Risol Spicy Tuna Melt",
    category: "Risol Frozen",
    price: 45000,
    unit: "Pack",
    description: "Ikan tuna suwir bumbu pedas gurih dipadu dengan keju mozarella yang meleleh di setiap gigitan.",
    tag: "Favorit Pedas",
    stock: 15,
    imageUrl: null,
    isHighlighted: false,
  },
  {
    id: "p5",
    name: "Cendol Coffee Signature",
    category: "Minuman Cendol",
    price: 22000,
    unit: "Cup",
    description: "Perpaduan cendol pandan kenyal asli dengan espresso robusta pilihan, santan kelapa creamy, dan gula aren legit.",
    tag: "Koleksi Baru",
    stock: 30,
    imageUrl: null,
    isHighlighted: true,
  },
  {
    id: "p6",
    name: "Cendol Matcha Cup",
    category: "Minuman Cendol",
    price: 24000,
    unit: "Cup",
    description: "Rasa autentik matcha Uji berpadu manis legit gula aren murni dan tekstur lembut cendol tradisional.",
    tag: "Segar",
    stock: 25,
    imageUrl: "/images/backgrounds/hero-matcha.jpg",
    isHighlighted: false,
  },
  {
    id: "p7",
    name: "Risol Sayur Original Grandma",
    category: "Risol Ready to Eat",
    price: 8000,
    unit: "Pcs",
    description: "Resep legendaris dengan isian wortel manis, kentang dadu, dan seledri harum berbalut kulit renyah.",
    tag: "Klasik",
    stock: 20,
    imageUrl: null,
    isHighlighted: false,
  },
  {
    id: "p8",
    name: "Hampers Family Gathering Box",
    category: "Paket Box",
    price: 145000,
    unit: "Box",
    description: "Kombinasi 3 varian rasa terfavorit dalam packaging eksklusif yang rapi, cocok untuk arisan & kado.",
    tag: "Spesial Gift",
    stock: 8,
    imageUrl: null,
    isHighlighted: true,
  },
  {
    id: "p9",
    name: "Risol Cokelat Lumer Keju",
    category: "Risol Ready to Eat",
    price: 9000,
    unit: "Pcs",
    description: "Sensasi manis legit cokelat Belgian lumer hangat berpadu dengan gurihnya potongan keju cheddar.",
    tag: "Varian Manis",
    stock: 12,
    imageUrl: null,
    isHighlighted: false,
  },
];

export default async function OrderPage() {
  // 1. Ambil data customer login
  let customerInfo = await getCustomerCookieInfo();
  if (!customerInfo) {
    try {
      const dbCustomer = await getCurrentCustomer();
      if (dbCustomer) {
        customerInfo = {
          id: dbCustomer.id,
          name: dbCustomer.name,
          email: dbCustomer.email ?? "",
          avatarUrl: dbCustomer.avatarUrl ?? "",
        };
      }
    } catch {
      // ignore
    }
  }

  // 2. Ambil produk dari database jika tersedia, jika kosong fallback ke DEFAULT_CATALOG_PRODUCTS
  let productsList: CatalogProduct[] = DEFAULT_CATALOG_PRODUCTS;
  try {
    const dbProducts = await db.product.findMany({
      where: { isAvailable: true },
      include: { category: true },
      orderBy: [{ isBestSeller: "desc" }, { createdAt: "desc" }],
    });

    if (dbProducts && dbProducts.length > 0) {
      productsList = dbProducts.map((p) => {
        return {
          id: p.id,
          name: p.name,
          category: p.category?.name || "Risol",
          price: p.price,
          unit: p.unit || "Pack",
          description: p.description || "Menu spesial Baitybites dengan bahan pilihan berkualitas tinggi.",
          tag: p.badgeTag || (p.isBestSeller ? "Best Seller" : undefined),
          stock: p.stock,
          imageUrl: p.imageUrl || (p.name.toLowerCase().includes("risol") ? "/images/backgrounds/hero-risol.jpg" : null),
          isHighlighted: p.isBestSeller || Boolean(p.badgeTag),
        };
      });
    }
  } catch (err) {
    console.warn("Menggunakan katalog default Baitybites:", err);
  }

  return (
    <OrderCatalogView
      initialCustomer={customerInfo}
      products={productsList}
    />
  );
}
