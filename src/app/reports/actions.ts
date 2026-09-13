"use server";

import { db } from "@/lib/db";
import type { Channel, OrderStatus, PaymentMethod } from "@prisma/client";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export type ReportTimeRange = "today" | "7d" | "30d" | "this_month" | "all";

export interface ProductSalesItem {
  id: string;
  name: string;
  category: string;
  totalQtySold: number;
  totalRevenue: number;
  unitPrice: number;
  percentage: number;
}

export interface ChannelItem {
  channel: Channel | string;
  label: string;
  orderCount: number;
  totalRevenue: number;
  percentage: number;
}

export interface PaymentMethodItem {
  method: PaymentMethod | string;
  label: string;
  totalTransactions: number;
  paidTransactions: number;
  totalAmount: number;
  percentage: number;
}

export interface CustomerSpendItem {
  id: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: Date | null;
}

export interface TransactionRow {
  id: string;
  orderRef: string;
  customerName: string;
  channel: string;
  status: OrderStatus;
  totalAmount: number;
  itemCount: number;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface ReportsData {
  timeRange: ReportTimeRange;
  financial: {
    grossRevenue: number;
    netSubtotal: number;
    totalDiscounts: number;
    totalDeliveryFees: number;
    averageOrderValue: number;
  };
  operational: {
    totalOrders: number;
    completedOrders: number;
    inProgressOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    completionRate: number; // percentage
  };
  products: ProductSalesItem[];
  channels: ChannelItem[];
  payments: PaymentMethodItem[];
  topCustomers: CustomerSpendItem[];
  recentTransactions: TransactionRow[];
  totalCustomerCount: number;
}

// ─── Date Range Helper ──────────────────────────────────────────────────────

function getDateFilter(range: ReportTimeRange): Date | null {
  const now = new Date();
  switch (range) {
    case "today": {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return today;
    }
    case "7d": {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "30d": {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      return d;
    }
    case "this_month": {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    case "all":
    default:
      return null;
  }
}

// ─── Action: Get Reports Data ───────────────────────────────────────────────

export async function getReportsDataAction(
  range: ReportTimeRange = "all"
): Promise<ReportsData> {
  try {
    const startDate = getDateFilter(range);

    const whereClause = startDate
      ? {
          createdAt: {
            gte: startDate,
          },
        }
      : {};

    // Fetch orders with items, payments, and customer in parallel with product catalog
    const [orders, allProducts, customerCount] = await Promise.all([
      db.order.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: {
                include: {
                  category: true,
                },
              },
            },
          },
          payments: true,
          clientRef: true,
        },
      }),
      db.product.findMany({
        include: { category: true },
      }),
      db.customer.count(),
    ]);

    // 1. FINANCIAL & OPERATIONAL TOTALS
    let grossRevenue = 0;
    let netSubtotal = 0;
    let totalDiscounts = 0;
    let totalDeliveryFees = 0;

    let completedOrders = 0;
    let inProgressOrders = 0;
    let pendingOrders = 0;
    let cancelledOrders = 0;

    const channelMap = new Map<string, { count: number; revenue: number }>();
    const paymentMap = new Map<
      string,
      { count: number; paidCount: number; amount: number }
    >();
    const productSalesMap = new Map<
      string,
      {
        name: string;
        category: string;
        qty: number;
        revenue: number;
        price: number;
      }
    >();
    const customerMap = new Map<
      string,
      {
        id: string;
        name: string;
        phone: string | null;
        orders: number;
        spent: number;
        lastDate: Date;
      }
    >();

    const transactions: TransactionRow[] = [];

    for (const order of orders) {
      // Financials (exclude cancelled orders from revenue)
      if (order.status !== "DIBATALKAN") {
        grossRevenue += order.totalAmount;
        netSubtotal += order.subtotal;
        totalDiscounts += order.discount;
        totalDeliveryFees += order.deliveryFee;
      }

      // Operational Status
      if (order.status === "SELESAI") {
        completedOrders++;
      } else if (order.status === "DIBATALKAN") {
        cancelledOrders++;
      } else if (order.status === "MENUNGGU") {
        pendingOrders++;
      } else {
        // DIMASAK, SIAP_PICKUP, DIKONFIRMASI, DIKIRIM
        inProgressOrders++;
      }

      // Channels
      const chKey = order.channel || "WhatsApp";
      const chCurr = channelMap.get(chKey) || { count: 0, revenue: 0 };
      chCurr.count += 1;
      if (order.status !== "DIBATALKAN") {
        chCurr.revenue += order.totalAmount;
      }
      channelMap.set(chKey, chCurr);

      // Payments
      const primaryPayment = order.payments[0];
      const pMethod = primaryPayment?.paymentMethod || "BANK_TRANSFER";
      const pStatus = primaryPayment?.paymentStatus || "PENDING";
      const pCurr = paymentMap.get(pMethod) || {
        count: 0,
        paidCount: 0,
        amount: 0,
      };
      pCurr.count += 1;
      if (pStatus === "PAID") {
        pCurr.paidCount += 1;
      }
      pCurr.amount += primaryPayment?.amount || order.totalAmount;
      paymentMap.set(pMethod, pCurr);

      // Products from items
      for (const item of order.items) {
        const prodKey = item.productId || item.name;
        const pItem = productSalesMap.get(prodKey) || {
          name: item.name,
          category: item.product?.category?.name || "Kategori Menu",
          qty: 0,
          revenue: 0,
          price: item.price,
        };
        pItem.qty += item.qty;
        pItem.revenue += item.subtotal || item.price * item.qty;
        productSalesMap.set(prodKey, pItem);
      }

      // Customers
      const custKey = order.customerId || order.customer;
      const cItem = customerMap.get(custKey) || {
        id: order.customerId || order.id,
        name: order.customer,
        phone: order.customerPhone,
        orders: 0,
        spent: 0,
        lastDate: order.createdAt,
      };
      cItem.orders += 1;
      if (order.status !== "DIBATALKAN") {
        cItem.spent += order.totalAmount;
      }
      if (order.createdAt > cItem.lastDate) {
        cItem.lastDate = order.createdAt;
      }
      customerMap.set(custKey, cItem);

      // Transaction row for detail table / export
      transactions.push({
        id: order.id,
        orderRef: order.orderRef,
        customerName: order.customer,
        channel: order.channel,
        status: order.status,
        totalAmount: order.totalAmount,
        itemCount: order.items.reduce((acc, it) => acc + it.qty, 0),
        paymentMethod: pMethod,
        paymentStatus: pStatus,
        createdAt: order.createdAt,
      });
    }

    const totalOrders = orders.length;
    const averageOrderValue =
      totalOrders > 0 ? Math.round(grossRevenue / (totalOrders - cancelledOrders || 1)) : 0;
    const completionRate =
      totalOrders > 0 ? Math.round((completedOrders / totalOrders) * 100) : 0;

    // 2. PRODUCT PERFORMANCE LIST
    const productItems: ProductSalesItem[] = Array.from(productSalesMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        category: data.category,
        totalQtySold: data.qty,
        totalRevenue: data.revenue,
        unitPrice: data.price,
        percentage: grossRevenue > 0 ? Math.round((data.revenue / grossRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // If products in catalog have 0 sales in this period, we can optionally list them with 0
    if (productItems.length === 0 && allProducts.length > 0) {
      allProducts.forEach((p) => {
        productItems.push({
          id: p.id,
          name: p.name,
          category: p.category?.name || "Menu",
          totalQtySold: 0,
          totalRevenue: 0,
          unitPrice: p.price,
          percentage: 0,
        });
      });
    }

    // 3. CHANNEL ITEMS
    const channelItems: ChannelItem[] = Array.from(channelMap.entries())
      .map(([ch, val]) => ({
        channel: ch,
        label: ch === "WhatsApp" ? "WhatsApp Order" : ch,
        orderCount: val.count,
        totalRevenue: val.revenue,
        percentage:
          totalOrders > 0 ? Math.round((val.count / totalOrders) * 100) : 0,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // 4. PAYMENT METHOD ITEMS
    const paymentItems: PaymentMethodItem[] = Array.from(paymentMap.entries())
      .map(([method, val]) => ({
        method,
        label:
          method === "QRIS"
            ? "QRIS Dinamis"
            : method === "BANK_TRANSFER"
            ? "Transfer Bank"
            : method === "CASH"
            ? "Tunai / Cash"
            : method === "COD"
            ? "Cash On Delivery (COD)"
            : method,
        totalTransactions: val.count,
        paidTransactions: val.paidCount,
        totalAmount: val.amount,
        percentage:
          grossRevenue > 0 ? Math.round((val.amount / grossRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 5. TOP CUSTOMERS
    const topCustomers: CustomerSpendItem[] = Array.from(customerMap.values())
      .map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        totalOrders: c.orders,
        totalSpent: c.spent,
        lastOrderAt: c.lastDate,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      timeRange: range,
      financial: {
        grossRevenue,
        netSubtotal,
        totalDiscounts,
        totalDeliveryFees,
        averageOrderValue,
      },
      operational: {
        totalOrders,
        completedOrders,
        inProgressOrders,
        pendingOrders,
        cancelledOrders,
        completionRate,
      },
      products: productItems,
      channels: channelItems,
      payments: paymentItems,
      topCustomers,
      recentTransactions: transactions,
      totalCustomerCount: customerCount,
    };
  } catch (error) {
    console.error("Error generating reports data:", error instanceof Error ? error.message : "Unknown error");
    return {
      timeRange: range,
      financial: {
        grossRevenue: 0,
        netSubtotal: 0,
        totalDiscounts: 0,
        totalDeliveryFees: 0,
        averageOrderValue: 0,
      },
      operational: {
        totalOrders: 0,
        completedOrders: 0,
        inProgressOrders: 0,
        pendingOrders: 0,
        cancelledOrders: 0,
        completionRate: 0,
      },
      products: [],
      channels: [],
      payments: [],
      topCustomers: [],
      recentTransactions: [],
      totalCustomerCount: 0,
    };
  }
}
