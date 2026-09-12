import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL tidak ditemukan di environment.");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Mulai seeding database Baitybites...");

  // ─── 1. SEED CMS TEMA WEB PUBLIK ──────────────────────────────────────────
  console.log("Mengisi tema web publik...");
  await prisma.webThemeSetting.deleteMany({});
  await prisma.webThemeSetting.create({
    data: {
      brandName: "Baitybites",
      tagline: "Bite The Best",
      heroTitle: "Sensasi Risol Mayo Meleleh",
      heroTitleAccent: "Double Cheese & Smoked Beef",
      heroDescription:
        "Dibuat dari bahan-bahan pilihan dengan isian daging asap premium, keju mozarella melimpah, dan racikan saus mayo creamy gurih yang memanjakan lidah di setiap gigitan.",
      heroImage: "/images/backgrounds/hero-risol.jpg",
      primaryColor: "#F97316",
      accentColor: "#10B981",
      whatsappNumber: "+62 812 8888 2345",
      instagramUrl: "https://instagram.com/baitybites.id",
      announcementText: "Nikmati Diskon 20% Pembelian Risol Frozen Khusus Order via WhatsApp!",
      isActive: true,
    },
  });

  // ─── 2. SEED TESTIMONI PELANGGAN ──────────────────────────────────────────
  console.log("Mengisi testimoni pelanggan...");
  await prisma.customerTestimonial.deleteMany({});
  await prisma.customerTestimonial.createMany({
    data: [
      {
        author: "Adelwy Saputri",
        role: "Pelanggan Setia (12x Repeat Order)",
        city: "Jakarta Selatan",
        quote:
          "Risol Mayo Double Cheese-nya beneran juara! Kulitnya super crispy dan mayonya melimpah gak pelit sama sekali. Buat stok sarapan di rumah selalu order yang frozen.",
        rating: 5,
        isFeatured: true,
        displayOrder: 1,
      },
      {
        author: "Bintang Wijaya",
        role: "Food Enthusiast",
        city: "Tangerang",
        quote:
          "Cendol Coffee-nya unik banget dan nyegerin. Gula arennya harum asli, gak bikin enek. Pas banget buat teman ngemil Risol Beef Mushroom hangat.",
        rating: 5,
        isFeatured: true,
        displayOrder: 2,
      },
      {
        author: "Merlin Oktaviana",
        role: "Event Organizer",
        city: "Depok",
        quote:
          "Kemarin pesan 100 pcs untuk snack box acara kantor, semuanya hangat dan packagingnya sangat rapi berkelas. Fitur tracking statusnya juga sangat membantu!",
        rating: 5,
        isFeatured: true,
        displayOrder: 3,
      },
    ],
  });

  // ─── 3. SEED GALLERY CMS ───────────────────────────────────────────────────
  console.log("Mengisi gallery foto produk...");
  await prisma.galleryItem.deleteMany({});
  await prisma.galleryItem.createMany({
    data: [
      {
        title: "Risol Mayo Double Cheese Premium",
        description: "Risol isi beef & melted cheese berkualitas tinggi",
        imageUrl: "/images/backgrounds/hero-risol.jpg",
        category: "PRODUK",
        displayOrder: 1,
      },
      {
        title: "Signature Matcha & Cendol Series",
        description: "Minuman artisanal perpaduan cendol pandan & matcha",
        imageUrl: "/images/backgrounds/hero-matcha.jpg",
        category: "PRODUK",
        displayOrder: 2,
      },
      {
        title: "Dapur Produksi Baitybites Higienis",
        description: "Proses pembuatan higienis standar gourmet",
        imageUrl: "/images/backgrounds/hero-risol.jpg",
        category: "PROSES_DAPUR",
        displayOrder: 3,
      },
      {
        title: "Paket Hampers Family Gathering",
        description: "Kemasan eksklusif untuk acara spesial dan hadiah",
        imageUrl: "/images/backgrounds/hero-matcha.jpg",
        category: "EVENT_HAMPERS",
        displayOrder: 4,
      },
    ],
  });

  // ─── 4. SEED KATEGORI & PRODUK ────────────────────────────────────────────
  console.log("Mengisi kategori & produk...");
  await prisma.orderStatusHistory.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});

  const catFrozen = await prisma.category.create({
    data: {
      name: "Risol Frozen",
      slug: "risol-frozen",
      description: "Risol siap goreng isi padat dengan kemasan vakum beku.",
      displayOrder: 1,
    },
  });

  const catReady = await prisma.category.create({
    data: {
      name: "Risol Ready to Eat",
      slug: "risol-ready-to-eat",
      description: "Risol renyah hangat digoreng fresh saat pesanan diterima.",
      displayOrder: 2,
    },
  });

  const catDrink = await prisma.category.create({
    data: {
      name: "Minuman Cendol",
      slug: "minuman-cendol",
      description: "Cendol segar dan artisanal minuman gula aren.",
      displayOrder: 3,
    },
  });

  const catBox = await prisma.category.create({
    data: {
      name: "Paket Box & Hampers",
      slug: "paket-box-hampers",
      description: "Snack box acara kantor, gathering, dan hampers.",
      displayOrder: 4,
    },
  });

  const prodRisolMayo = await prisma.product.create({
    data: {
      categoryId: catFrozen.id,
      code: "RB-001",
      name: "Risol Mayo Beef Double Cheese",
      slug: "risol-mayo-beef-double-cheese",
      description:
        "Smoked beef premium dengan saus mayo lumer racikan rahasia dan taburan double keju cheddar mozzarella.",
      price: 48000,
      unit: "Pack (5 pcs)",
      stock: 48,
      badgeTag: "Best Seller",
      isBestSeller: true,
      imageUrl: "/images/backgrounds/hero-risol.jpg",
    },
  });

  const prodRisolTruffle = await prisma.product.create({
    data: {
      categoryId: catReady.id,
      code: "RB-002",
      name: "Risol Beef Mushroom Truffle",
      slug: "risol-beef-mushroom-truffle",
      description:
        "Daging cincang lada hitam berpadu jamur champignon lembut dan aroma minyak truffle otentik.",
      price: 12000,
      unit: "Pcs",
      stock: 32,
      badgeTag: "Chef Special",
      imageUrl: "/images/backgrounds/hero-risol.jpg",
    },
  });

  const prodCendolCoffee = await prisma.product.create({
    data: {
      categoryId: catDrink.id,
      code: "CD-001",
      name: "Cendol Coffee Signature",
      slug: "cendol-coffee-signature",
      description:
        "Perpaduan cendol pandan kenyal asli dengan espresso robusta pilihan, santan kelapa creamy, dan gula aren legit.",
      price: 22000,
      unit: "Cup 350ml",
      stock: 18,
      badgeTag: "Koleksi Baru",
      imageUrl: "/images/backgrounds/hero-matcha.jpg",
    },
  });

  const prodCendolMatcha = await prisma.product.create({
    data: {
      categoryId: catDrink.id,
      code: "CD-002",
      name: "Cendol Matcha Cup",
      slug: "cendol-matcha-cup",
      description:
        "Rasa autentik matcha Uji berpadu manis legit gula aren murni dan tekstur lembut cendol tradisional.",
      price: 24000,
      unit: "Cup 350ml",
      stock: 25,
      badgeTag: "Populer",
      imageUrl: "/images/backgrounds/hero-matcha.jpg",
    },
  });

  const prodHampers = await prisma.product.create({
    data: {
      categoryId: catBox.id,
      code: "BX-001",
      name: "Hampers Family Gathering Box",
      slug: "hampers-family-gathering-box",
      description:
        "Kombinasi 3 varian rasa terfavorit dalam packaging eksklusif yang rapi, cocok untuk arisan & kado.",
      price: 145000,
      unit: "Box (15 pcs)",
      stock: 15,
      badgeTag: "Spesial Gift",
      imageUrl: "/images/backgrounds/hero-risol.jpg",
    },
  });

  // ─── 5. SEED PELANGGAN ────────────────────────────────────────────────────
  console.log("Mengisi data pelanggan...");
  await prisma.customer.deleteMany({});

  const custAdelwy = await prisma.customer.create({
    data: {
      name: "Adelwy Saputri",
      phone: "081299887711",
      email: "adelwy@baitybites.id",
      address: "Jl. Melati No. 24, Cilandak",
      city: "Jakarta Selatan",
      customerType: "VIP",
      notes: "Suka extra mayo & selalu pesan beku untuk stok.",
    },
  });

  const custMerlin = await prisma.customer.create({
    data: {
      name: "Merlin Oktaviana",
      phone: "085711223344",
      email: "merlin@baitybites.id",
      address: "Jl. Margonda Raya No. 102",
      city: "Depok",
      customerType: "VIP",
      notes: "Sering pesan paket snack box & cendol coffee.",
    },
  });

  const custDinda = await prisma.customer.create({
    data: {
      name: "Dinda Rahayu",
      phone: "081344556677",
      email: "dinda@baitybites.id",
      address: "Jl. Boulevard Gading Serpong",
      city: "Tangerang",
      customerType: "REGULAR",
    },
  });

  // ─── 6. SEED TRANSAKSI ORDER LENGKAP & KITCHEN ────────────────────────────
  console.log("Mengisi data transaksi order & status history...");

  // Order 1: Dimasak (#WA-DIR-8908)
  await prisma.order.create({
    data: {
      orderRef: "#WA-DIR-8908",
      customerId: custAdelwy.id,
      customer: custAdelwy.name,
      customerPhone: custAdelwy.phone,
      customerEmail: custAdelwy.email,
      deliveryAddr: custAdelwy.address,
      channel: "WhatsApp",
      status: "DIMASAK",
      priority: "NORMAL",
      subtotal: 70000,
      deliveryFee: 10000,
      discount: 0,
      totalAmount: 80000,
      note: "Goreng garing, saus sambal ekstra ya kak",
      cookStartedAt: new Date(Date.now() - 15 * 60000),
      items: {
        create: [
          {
            productId: prodRisolMayo.id,
            name: "Risol Mayo Beef Double Cheese",
            price: 48000,
            qty: 1,
            subtotal: 48000,
            notes: "Goreng garing",
          },
          {
            productId: prodCendolCoffee.id,
            name: "Cendol Coffee Signature",
            price: 22000,
            qty: 1,
            subtotal: 22000,
            notes: "Less sweet / gula aren sedikit",
          },
        ],
      },
      payments: {
        create: {
          paymentMethod: "QRIS",
          paymentStatus: "PAID",
          amount: 80000,
          paidAt: new Date(Date.now() - 20 * 60000),
          referenceCode: "QRIS-8908-PAID",
        },
      },
      statusHistory: {
        create: [
          {
            status: "MENUNGGU",
            actor: "SYSTEM",
            note: "Pesanan dibuat via WhatsApp Direct",
            createdAt: new Date(Date.now() - 30 * 60000),
          },
          {
            status: "DIKONFIRMASI",
            actor: "ADMIN",
            note: "Pembayaran QRIS telah diverifikasi",
            createdAt: new Date(Date.now() - 20 * 60000),
          },
          {
            status: "DIMASAK",
            actor: "KITCHEN",
            note: "Sedang proses penggorengan di dapur",
            createdAt: new Date(Date.now() - 15 * 60000),
          },
        ],
      },
    },
  });

  // Order 2: Siap Pickup (#WA-DIR-3319)
  await prisma.order.create({
    data: {
      orderRef: "#WA-DIR-3319",
      customerId: custMerlin.id,
      customer: custMerlin.name,
      customerPhone: custMerlin.phone,
      customerEmail: custMerlin.email,
      deliveryAddr: custMerlin.address,
      channel: "WhatsApp",
      status: "SIAP_PICKUP",
      priority: "URGENT",
      subtotal: 145000,
      deliveryFee: 15000,
      discount: 10000,
      totalAmount: 150000,
      note: "Packaging rapi ada kartu ucapan terima kasih",
      cookStartedAt: new Date(Date.now() - 40 * 60000),
      items: {
        create: [
          {
            productId: prodHampers.id,
            name: "Hampers Family Gathering Box",
            price: 145000,
            qty: 1,
            subtotal: 145000,
            notes: "Varian mix Risol Mayo & Truffle",
          },
        ],
      },
      payments: {
        create: {
          paymentMethod: "BANK_TRANSFER",
          paymentStatus: "PAID",
          amount: 150000,
          paidAt: new Date(Date.now() - 50 * 60000),
          referenceCode: "BCA-3319-TF",
        },
      },
      statusHistory: {
        create: [
          {
            status: "MENUNGGU",
            actor: "SYSTEM",
            note: "Pesanan masuk",
            createdAt: new Date(Date.now() - 60 * 60000),
          },
          {
            status: "DIMASAK",
            actor: "KITCHEN",
            note: "Mulai proses baking & packing hampers",
            createdAt: new Date(Date.now() - 40 * 60000),
          },
          {
            status: "SIAP_PICKUP",
            actor: "KITCHEN",
            note: "Pesanan selesai dipacking, menunggu kurir jemput",
            createdAt: new Date(Date.now() - 10 * 60000),
          },
        ],
      },
    },
  });

  // Order 3: Menunggu (#WA-DIR-0230)
  await prisma.order.create({
    data: {
      orderRef: "#WA-DIR-0230",
      customerId: custDinda.id,
      customer: custDinda.name,
      customerPhone: custDinda.phone,
      deliveryAddr: custDinda.address,
      channel: "WhatsApp",
      status: "MENUNGGU",
      priority: "NORMAL",
      subtotal: 96000,
      deliveryFee: 12000,
      discount: 0,
      totalAmount: 108000,
      note: "Frozen pack ya, jangan digoreng",
      items: {
        create: [
          {
            productId: prodRisolMayo.id,
            name: "Risol Mayo Beef Double Cheese",
            price: 48000,
            qty: 2,
            subtotal: 96000,
            notes: "Kemasan beku / frozen",
          },
        ],
      },
      payments: {
        create: {
          paymentMethod: "BANK_TRANSFER",
          paymentStatus: "PENDING",
          amount: 108000,
        },
      },
      statusHistory: {
        create: [
          {
            status: "MENUNGGU",
            actor: "SYSTEM",
            note: "Menunggu konfirmasi bukti transfer",
            createdAt: new Date(Date.now() - 5 * 60000),
          },
        ],
      },
    },
  });

  console.log("✅ Seeding database Baitybites selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error("❌ Terjadi error saat seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
