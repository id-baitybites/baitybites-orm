import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export interface SnapshotMeta {
  filename: string;
  sizeBytes: number;
  sizeFormatted: string;
  createdAt: string;
  type: "JSON_SNAPSHOT" | "SQL_DUMP";
  recordCounts?: Record<string, number>;
}

export interface DatabaseSnapshotPayload {
  meta: {
    version: string;
    createdAt: string;
    generator: string;
    counts: Record<string, number>;
  };
  data: {
    webThemeSettings: any[];
    categories: any[];
    products: any[];
    customers: any[];
    orders: any[];
    orderItems: any[];
    payments: any[];
    orderStatusHistories: any[];
    galleryItems: any[];
    customerTestimonials: any[];
    admins: any[];
  };
}

const BACKUP_DIR = path.join(process.cwd(), "backups");
const MAX_BACKUPS = 30;

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function rotateBackups() {
  ensureBackupDir();
  const files = fs
    .readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith(".json") || f.endsWith(".sql") || f.endsWith(".sql.gz"))
    .map((f) => ({
      name: f,
      mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length > MAX_BACKUPS) {
    const toDelete = files.slice(MAX_BACKUPS);
    for (const file of toDelete) {
      try {
        fs.unlinkSync(path.join(BACKUP_DIR, file.name));
      } catch (err) {
        console.error(`Gagal menghapus backup lama: ${file.name}`, err);
      }
    }
  }
}

/**
 * Buat full snapshot database dalam format JSON terstruktur (portable, aman di serverless)
 */
export async function createDatabaseSnapshot(): Promise<{
  success: boolean;
  filename: string;
  sizeFormatted: string;
  counts: Record<string, number>;
  error?: string;
}> {
  try {
    ensureBackupDir();

    // Query semua data tabel
    const [
      webThemeSettings,
      categories,
      products,
      customers,
      orders,
      orderItems,
      payments,
      orderStatusHistories,
      galleryItems,
      customerTestimonials,
      admins,
    ] = await Promise.all([
      db.webThemeSetting.findMany(),
      db.category.findMany(),
      db.product.findMany(),
      db.customer.findMany(),
      db.order.findMany(),
      db.orderItem.findMany(),
      db.payment.findMany(),
      db.orderStatusHistory.findMany(),
      db.galleryItem.findMany(),
      db.customerTestimonial.findMany(),
      db.admin.findMany(),
    ]);

    const counts = {
      webThemeSettings: webThemeSettings.length,
      categories: categories.length,
      products: products.length,
      customers: customers.length,
      orders: orders.length,
      orderItems: orderItems.length,
      payments: payments.length,
      orderStatusHistories: orderStatusHistories.length,
      galleryItems: galleryItems.length,
      customerTestimonials: customerTestimonials.length,
      admins: admins.length,
    };

    const snapshotPayload: DatabaseSnapshotPayload = {
      meta: {
        version: "2.2.0",
        createdAt: new Date().toISOString(),
        generator: "Baitybites ORM Automated Engine",
        counts,
      },
      data: {
        webThemeSettings,
        categories,
        products,
        customers,
        orders,
        orderItems,
        payments,
        orderStatusHistories,
        galleryItems,
        customerTestimonials,
        admins,
      },
    };

    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .replace("T", "_")
      .slice(0, 19);

    const filename = `baitybites_snapshot_${timestamp}.json`;
    const filepath = path.join(BACKUP_DIR, filename);

    fs.writeFileSync(filepath, JSON.stringify(snapshotPayload, null, 2), "utf-8");
    rotateBackups();

    const stat = fs.statSync(filepath);

    return {
      success: true,
      filename,
      sizeFormatted: formatBytes(stat.size),
      counts,
    };
  } catch (error) {
    console.error("[BACKUP_ENGINE] Gagal membuat snapshot:", error);
    return {
      success: false,
      filename: "",
      sizeFormatted: "",
      counts: {},
      error: error instanceof Error ? error.message : "Gagal membuat snapshot database.",
    };
  }
}

/**
 * Ambil daftar backup yang tersedia di server/disk
 */
export async function listSnapshots(): Promise<SnapshotMeta[]> {
  ensureBackupDir();
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".json") || f.endsWith(".sql") || f.endsWith(".sql.gz"))
      .map((filename) => {
        const fullPath = path.join(BACKUP_DIR, filename);
        const stat = fs.statSync(fullPath);
        const isJson = filename.endsWith(".json");

        let recordCounts: Record<string, number> | undefined;
        if (isJson) {
          try {
            const raw = fs.readFileSync(fullPath, "utf-8");
            const parsed = JSON.parse(raw);
            recordCounts = parsed.meta?.counts;
          } catch {
            // ignore JSON parse error in list
          }
        }

        return {
          filename,
          sizeBytes: stat.size,
          sizeFormatted: formatBytes(stat.size),
          createdAt: stat.mtime.toISOString(),
          type: (isJson ? "JSON_SNAPSHOT" : "SQL_DUMP") as "JSON_SNAPSHOT" | "SQL_DUMP",
          recordCounts,
        };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return files;
  } catch (err) {
    console.error("[BACKUP_ENGINE] Gagal membaca list backup:", err);
    return [];
  }
}

/**
 * Baca konten snapshot file untuk download
 */
export async function getSnapshotContent(filename: string): Promise<string | null> {
  const safeFilename = path.basename(filename);
  const fullPath = path.join(BACKUP_DIR, safeFilename);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, "utf-8");
}

/**
 * Pulihkan database dari payload snapshot JSON (Disaster Recovery)
 */
export async function restoreFromSnapshot(payload: DatabaseSnapshotPayload): Promise<{
  success: boolean;
  message: string;
  restoredCounts: Record<string, number>;
}> {
  if (!payload?.data || !payload?.meta) {
    throw new Error("Format payload snapshot tidak valid.");
  }

  const { data } = payload;
  const restoredCounts: Record<string, number> = {};

  try {
    // 1. Pulihkan Categories & Products
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        await db.category.upsert({
          where: { slug: cat.slug },
          update: {
            name: cat.name,
            description: cat.description,
            displayOrder: cat.displayOrder,
            isActive: cat.isActive,
          },
          create: {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            description: cat.description,
            displayOrder: cat.displayOrder,
            isActive: cat.isActive,
          },
        });
      }
      restoredCounts.categories = data.categories.length;
    }

    if (Array.isArray(data.products)) {
      for (const prod of data.products) {
        await db.product.upsert({
          where: { slug: prod.slug },
          update: {
            name: prod.name,
            code: prod.code,
            price: prod.price,
            stock: prod.stock,
            unit: prod.unit,
            description: prod.description,
            imageUrl: prod.imageUrl,
            badgeTag: prod.badgeTag,
            isBestSeller: prod.isBestSeller,
            isAvailable: prod.isAvailable,
            categoryId: prod.categoryId,
          },
          create: {
            id: prod.id,
            name: prod.name,
            slug: prod.slug,
            code: prod.code,
            price: prod.price,
            stock: prod.stock,
            unit: prod.unit,
            description: prod.description,
            imageUrl: prod.imageUrl,
            badgeTag: prod.badgeTag,
            isBestSeller: prod.isBestSeller,
            isAvailable: prod.isAvailable,
            categoryId: prod.categoryId,
          },
        });
      }
      restoredCounts.products = data.products.length;
    }

    // 2. Pulihkan Customers
    if (Array.isArray(data.customers)) {
      for (const cust of data.customers) {
        await db.customer.upsert({
          where: { id: cust.id },
          update: {
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            city: cust.city,
            customerType: cust.customerType,
            notes: cust.notes,
            googleId: cust.googleId,
            avatarUrl: cust.avatarUrl,
            district: cust.district,
            postalCode: cust.postalCode,
          },
          create: {
            id: cust.id,
            name: cust.name,
            phone: cust.phone,
            email: cust.email,
            address: cust.address,
            city: cust.city,
            customerType: cust.customerType,
            notes: cust.notes,
            googleId: cust.googleId,
            avatarUrl: cust.avatarUrl,
            district: cust.district,
            postalCode: cust.postalCode,
          },
        });
      }
      restoredCounts.customers = data.customers.length;
    }

    // 3. Pulihkan Theme Settings
    if (Array.isArray(data.webThemeSettings) && data.webThemeSettings.length > 0) {
      const theme = data.webThemeSettings[0];
      const existing = await db.webThemeSetting.findFirst();
      if (existing) {
        await db.webThemeSetting.update({
          where: { id: existing.id },
          data: {
            brandName: theme.brandName,
            tagline: theme.tagline,
            heroTitle: theme.heroTitle,
            heroTitleAccent: theme.heroTitleAccent,
            heroDescription: theme.heroDescription,
            heroImage: theme.heroImage,
            primaryColor: theme.primaryColor,
            accentColor: theme.accentColor,
            whatsappNumber: theme.whatsappNumber,
            instagramUrl: theme.instagramUrl,
            announcementText: theme.announcementText,
          },
        });
      } else {
        await db.webThemeSetting.create({
          data: {
            brandName: theme.brandName,
            tagline: theme.tagline,
            heroTitle: theme.heroTitle,
            heroTitleAccent: theme.heroTitleAccent,
            heroDescription: theme.heroDescription,
            heroImage: theme.heroImage,
            primaryColor: theme.primaryColor,
            accentColor: theme.accentColor,
            whatsappNumber: theme.whatsappNumber,
            instagramUrl: theme.instagramUrl,
            announcementText: theme.announcementText,
          },
        });
      }
      restoredCounts.webThemeSettings = 1;
    }

    // 4. Pulihkan Gallery & Testimoni
    if (Array.isArray(data.galleryItems)) {
      for (const item of data.galleryItems) {
        await db.galleryItem.upsert({
          where: { id: item.id },
          update: {
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            category: item.category,
            displayOrder: item.displayOrder,
            isActive: item.isActive,
          },
          create: {
            id: item.id,
            title: item.title,
            description: item.description,
            imageUrl: item.imageUrl,
            category: item.category,
            displayOrder: item.displayOrder,
            isActive: item.isActive,
          },
        });
      }
      restoredCounts.galleryItems = data.galleryItems.length;
    }

    if (Array.isArray(data.customerTestimonials)) {
      for (const test of data.customerTestimonials) {
        await db.customerTestimonial.upsert({
          where: { id: test.id },
          update: {
            author: test.author,
            role: test.role,
            city: test.city,
            quote: test.quote,
            rating: test.rating,
            avatarUrl: test.avatarUrl,
            isFeatured: test.isFeatured,
            displayOrder: test.displayOrder,
          },
          create: {
            id: test.id,
            author: test.author,
            role: test.role,
            city: test.city,
            quote: test.quote,
            rating: test.rating,
            avatarUrl: test.avatarUrl,
            isFeatured: test.isFeatured,
            displayOrder: test.displayOrder,
          },
        });
      }
      restoredCounts.customerTestimonials = data.customerTestimonials.length;
    }

    return {
      success: true,
      message: "Pemulihan database berhasil dijalankan.",
      restoredCounts,
    };
  } catch (error) {
    console.error("[BACKUP_ENGINE] Gagal memulihkan snapshot:", error);
    throw error;
  }
}
