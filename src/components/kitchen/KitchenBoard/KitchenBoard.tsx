"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import {
  type ProductionOrder,
  type ProductionStatus,
  STATUS_LABELS,
  STATUS_NEXT,
} from "@/lib/kitchen-data";
import {
  Clock01Icon,
  FireIcon,
  CheckmarkCircle02Icon,
  ShoppingBag01Icon,
  AlertCircleIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AppShell } from "@/components/layout/AppShell/AppShell";
import { KitchenOrderCard } from "@/components/kitchen/KitchenOrderCard/KitchenOrderCard";
import { advanceOrderStatus } from "@/app/kitchen/actions";
import "./kitchen-board.scss";

// ─── Column config ─────────────────────────────────────────────────────────────

const COLUMNS: Array<{
  status: ProductionStatus;
  label: string;
  sublabel: string;
  icon: typeof FireIcon;
  colorClass: string;
}> = [
  {
    status: "menunggu",
    label: "Menunggu",
    sublabel: "Belum mulai dimasak",
    icon: Clock01Icon,
    colorClass: "col--warning",
  },
  {
    status: "dimasak",
    label: "Sedang Dimasak",
    sublabel: "Di atas kompor sekarang",
    icon: FireIcon,
    colorClass: "col--info",
  },
  {
    status: "siap_pickup",
    label: "Siap Pickup",
    sublabel: "Selesai, menunggu customer",
    icon: CheckmarkCircle02Icon,
    colorClass: "col--success",
  },
];

// ─── Confirm modal ─────────────────────────────────────────────────────────────

function ConfirmModal({
  order,
  onConfirm,
  onCancel,
}: {
  order: ProductionOrder;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="kitchen-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="kitchen-modal">
        <div className="kitchen-modal__icon">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} strokeWidth={1.8} />
        </div>
        <h2 id="modal-title" className="kitchen-modal__title">
          Tandai Siap Pickup?
        </h2>
        <p className="kitchen-modal__body">
          Pesanan <strong>{order.orderRef}</strong> atas nama{" "}
          <strong>{order.customer}</strong> akan dipindahkan ke antrian{" "}
          <em>Siap Pickup</em>. Pastikan semua item sudah dikemas dengan benar.
        </p>
        <div className="kitchen-modal__actions">
          <button type="button" className="kitchen-modal__cancel" onClick={onCancel}>
            Batal
          </button>
          <button type="button" className="kitchen-modal__confirm" onClick={onConfirm}>
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} strokeWidth={2} />
            Ya, Tandai Siap
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Board ────────────────────────────────────────────────────────────────────

interface KitchenBoardProps {
  initialOrders?: ProductionOrder[];
}

export function KitchenBoard({ initialOrders = [] }: KitchenBoardProps) {
  const [orders, setOrders] = useState<ProductionOrder[]>(initialOrders);
  const [isPending, startTransition] = useTransition();
  const [pendingAdvance, setPendingAdvance] = useState<{
    id: string;
    next: ProductionStatus;
  } | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);

  // Sync state with server changes
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // group by status
  const byStatus = (status: ProductionStatus) =>
    orders.filter((o) => o.status === status);

  // stats
  const totalWaiting = byStatus("menunggu").length;
  const totalCooking = byStatus("dimasak").length;
  const totalReady   = byStatus("siap_pickup").length;
  const urgentCount  = orders.filter(
    (o) => o.priority === "urgent" && o.status !== "siap_pickup"
  ).length;

  const doAdvance = useCallback(
    (id: string, nextStatus: ProductionStatus) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status: nextStatus,
                cookStartedAt:
                  nextStatus === "dimasak" ? new Date().toISOString() : o.cookStartedAt,
              }
            : o
        )
      );

      // Flash highlight
      setFlashId(id);
      setTimeout(() => setFlashId(null), 800);

      // Server mutation
      if (nextStatus === "dimasak" || nextStatus === "siap_pickup") {
        startTransition(async () => {
          try {
            await advanceOrderStatus(id, nextStatus);
          } catch (err) {
            console.error("Failed to advance order status:", err);
          }
        });
      }
    },
    []
  );

  const handleAdvance = useCallback(
    (id: string, nextStatus: ProductionStatus) => {
      // Require confirmation only for final step
      if (nextStatus === "siap_pickup") {
        setPendingAdvance({ id, next: nextStatus });
      } else {
        doAdvance(id, nextStatus);
      }
    },
    [doAdvance]
  );

  const handleConfirm = () => {
    if (pendingAdvance) {
      doAdvance(pendingAdvance.id, pendingAdvance.next);
      setPendingAdvance(null);
    }
  };

  const pendingOrder = pendingAdvance
    ? orders.find((o) => o.id === pendingAdvance.id)
    : null;

  return (
    <AppShell>
      <div className="kitchen-board">
        {/* ── Page header ── */}
        <header className="kitchen-board__header">
          <div className="kitchen-board__title-group">
            <p className="eyebrow">BAITYBITES OMS / KITCHEN</p>
            <h1>Kitchen Board</h1>
            <p className="kitchen-board__desc">
              Layar kerja staf dapur — ketuk tombol untuk memperbarui status produksi secara real-time.
            </p>
          </div>

          {/* Stats strip */}
          <div className="kitchen-board__stats">
            <div className="kitchen-stat kitchen-stat--warning">
              <HugeiconsIcon icon={Clock01Icon} size={20} strokeWidth={1.8} />
              <div>
                <strong>{totalWaiting}</strong>
                <span>Menunggu</span>
              </div>
            </div>
            <div className="kitchen-stat kitchen-stat--info">
              <HugeiconsIcon icon={FireIcon} size={20} strokeWidth={1.8} />
              <div>
                <strong>{totalCooking}</strong>
                <span>Dimasak</span>
              </div>
            </div>
            <div className="kitchen-stat kitchen-stat--success">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} strokeWidth={1.8} />
              <div>
                <strong>{totalReady}</strong>
                <span>Siap Pickup</span>
              </div>
            </div>
            <div className="kitchen-stat kitchen-stat--total">
              <HugeiconsIcon icon={ShoppingBag01Icon} size={20} strokeWidth={1.8} />
              <div>
                <strong>{orders.length}</strong>
                <span>Total Pesanan</span>
              </div>
            </div>
            {urgentCount > 0 && (
              <div className="kitchen-stat kitchen-stat--danger">
                <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={1.8} />
                <div>
                  <strong>{urgentCount}</strong>
                  <span>Urgent</span>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* ── Kanban ── */}
        <div className="kitchen-board__kanban">
          {COLUMNS.map((col) => {
            const colOrders = byStatus(col.status);
            return (
              <div key={col.status} className={`kitchen-col ${col.colorClass}`}>
                {/* column header */}
                <div className="kitchen-col__header">
                  <div className="kitchen-col__icon">
                    <HugeiconsIcon icon={col.icon} size={18} strokeWidth={1.8} />
                  </div>
                  <div>
                    <h2 className="kitchen-col__label">{col.label}</h2>
                    <p className="kitchen-col__sublabel">{col.sublabel}</p>
                  </div>
                  <span className="kitchen-col__badge">{colOrders.length}</span>
                </div>

                {/* cards */}
                <div className="kitchen-col__cards">
                  {colOrders.length > 0 ? (
                    colOrders.map((order) => (
                      <div
                        key={order.id}
                        className={flashId === order.id ? "card-flash" : ""}
                      >
                        <KitchenOrderCard
                          order={order}
                          onAdvance={handleAdvance}
                        />
                      </div>
                    ))
                  ) : (
                    <div className="kitchen-col__empty">
                      <HugeiconsIcon icon={RefreshIcon} size={28} strokeWidth={1.5} />
                      <p>Tidak ada pesanan</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Confirm modal ── */}
      {pendingAdvance && pendingOrder && (
        <ConfirmModal
          order={pendingOrder}
          onConfirm={handleConfirm}
          onCancel={() => setPendingAdvance(null)}
        />
      )}
    </AppShell>
  );
}
