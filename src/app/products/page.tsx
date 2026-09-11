"use client";

import { useState } from "react";
import { WorkspacePage } from "@/components/layout/WorkspacePage/WorkspacePage";
import {
  AddProductModal,
  type NewProductData,
} from "@/components/products/AddProductModal/AddProductModal";

const initialProducts = [
  {
    title: "Risol Mayo Beef Double Cheese",
    subtitle: "RB-001 / Frozen",
    value: "48 unit",
    status: "Tersedia",
    tone: "success",
  },
  {
    title: "Risol Beef Mushroom",
    subtitle: "RB-002 / Frozen",
    value: "32 unit",
    status: "Menipis",
    tone: "warning",
  },
  {
    title: "Cendol Coffee",
    subtitle: "CD-001 / Ready to serve",
    value: "18 unit",
    status: "Tersedia",
    tone: "success",
  },
  {
    title: "Cendol Matcha",
    subtitle: "CD-002 / Ready to serve",
    value: "0 unit",
    status: "Habis",
    tone: "danger",
  },
];

export default function ProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productList, setProductList] = useState(initialProducts);

  const handleAddProduct = (newProduct: NewProductData) => {
    const code = `PRD-${String(productList.length + 1).padStart(3, "0")}`;
    const status =
      newProduct.initialStock > 10
        ? "Tersedia"
        : newProduct.initialStock > 0
        ? "Menipis"
        : "Habis";
    const tone =
      status === "Tersedia"
        ? "success"
        : status === "Menipis"
        ? "warning"
        : "danger";

    setProductList((prev) => [
      {
        title: newProduct.name,
        subtitle: `${code} / ${newProduct.category} • Rp ${newProduct.price.toLocaleString("id-ID")}`,
        value: `${newProduct.initialStock} ${newProduct.unit}`,
        status,
        tone,
      },
      ...prev,
    ]);
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
        description="Atur katalog risol & minuman, varian harga, serta ketersediaan stok produk."
        action="Tambah Produk"
        onAction={() => setIsModalOpen(true)}
        stats={[
          {
            label: "Produk aktif",
            value: productList.length.toString(),
            change: "Katalog update",
            tone: "orange",
          },
          {
            label: "Stok aman",
            value: safeStockCount.toString(),
            change: `${Math.round((safeStockCount / productList.length) * 100 || 0)}% dari katalog`,
            tone: "green",
          },
          {
            label: "Stok menipis",
            value: lowStockCount.toString(),
            change: "Perlu restock",
            tone: "blue",
          },
          {
            label: "Total unit stok",
            value: `${totalStock} unit`,
            change: "Inventaris terkini",
            tone: "purple",
          },
        ]}
        tabs={["Semua", "Risol", "Cendol", "Menipis"]}
        rows={productList}
        rowHeading="Katalog produk"
      />

      {/* MODAL TAMBAH PRODUK */}
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddProduct}
      />
    </>
  );
}
