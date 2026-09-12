"use client";

import { useState, useEffect } from "react";
import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";
import {
  AddProductModal,
  type NewProductData,
} from "@/components/products/AddProductModal/AddProductModal";
import {
  getProductsAction,
  createProductAction,
  type ProductItemDisplay,
} from "@/app/products/actions";

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productList, setProductList] = useState<ProductItemDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  // Ambil data produk langsung dari PostgreSQL saat halaman dimuat
  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await getProductsAction();
        setProductList(data);
      } catch (err) {
        console.error("Gagal memuat produk dari DB:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleAddProduct = async (newProduct: NewProductData) => {
    setIsSubmitting(true);
    try {
      const res = await createProductAction({
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        price: newProduct.price,
        unit: newProduct.unit,
        initialStock: newProduct.initialStock,
        imageBase64: newProduct.imagePreview,
      });

      if (res.success && res.product) {
        setProductList((prev) => [res.product!, ...prev]);
        setIsModalOpen(false);
      } else {
        alert(res.error || "Gagal menyimpan produk ke database.");
      }
    } catch (err: unknown) {
      console.error("Gagal menyimpan produk:", err);
      alert("Terjadi kesalahan saat menyimpan produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalStock = productList.reduce((acc, p) => {
    const match = p.value.match(/(\d+)/);
    return acc + (match ? parseInt(match[1], 10) : 0);
  }, 0);

  const safeStockCount = productList.filter((p) => p.status === "Tersedia").length;
  const lowStockCount = productList.filter((p) => p.status === "Menipis").length;

  return (
    <>
      <WorkspacePage
        eyebrow="BAITYBITES OMS / PRODUCTS"
        title="Products"
        description="Atur katalog risol & minuman, varian harga, serta ketersediaan stok produk langsung dari database."
        action="Tambah Produk"
        onAction={() => setIsModalOpen(true)}
        stats={[
          {
            label: "Produk aktif",
            value: loading ? "..." : productList.length.toString(),
            change: "Katalog update",
            tone: "orange",
          },
          {
            label: "Stok aman",
            value: loading ? "..." : safeStockCount.toString(),
            change: `${Math.round((safeStockCount / (productList.length || 1)) * 100)}% dari katalog`,
            tone: "green",
          },
          {
            label: "Stok menipis",
            value: loading ? "..." : lowStockCount.toString(),
            change: "Perlu restock",
            tone: "blue",
          },
          {
            label: "Total unit stok",
            value: loading ? "..." : `${totalStock} unit`,
            change: "Inventaris terkini",
            tone: "purple",
          },
        ]}
        tabs={["Semua", "Risol", "Cendol", "Menipis"]}
        rows={productList}
        rowHeading="Katalog produk database"
      />

      {/* MODAL TAMBAH PRODUK */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => !isSubmitting && setIsModalOpen(false)}
        onSubmit={handleAddProduct}
        isSubmitting={isSubmitting}
      />
    </>
  );
}
