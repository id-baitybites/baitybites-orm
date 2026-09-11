"use client";

import { useEffect, useState } from "react";
import {
  type ProductionOrder,
  type ProductionStatus,
  STATUS_NEXT,
  STATUS_NEXT_LABEL,
} from "@/lib/kitchen-data";
import {
  Clock01Icon,
  CheckmarkCircle02Icon,
  FireIcon,
  KitchenUtensilsIcon,
  AlertCircleIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import "./kitchen-order-card.scss";

// ─── Timer hook ───────────────────────────────────────────────────────────────

function useElapsedMinutes(startIso?: string): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startIso) return;
    const tick = () => {
      const diff = (Date.now() - new Date(startIso).getTime()) / 1000 / 60;
      setElapsed(Math.floor(diff));
    };
    tick();
    const id = setInterval(tick, 10_000); // update every 10s
    return () => clearInterval(id);
  }, [startIso]);

  return elapsed;
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes} mnt`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}j ${m}m`;
}

// ─── Channel badge ────────────────────────────────────────────────────────────

const CHANNEL_COLOR: Record<string, string> = {
  WhatsApp:  "channel--wa",
  Tokopedia: "channel--tokped",
  Shopee:    "channel--shopee",
  "Walk-in": "channel--walkin",
};

// ─── Component ────────────────────────────────────────────────────────────────

interface KitchenOrderCardProps {
  order: ProductionOrder;
  onAdvance: (id: string, nextStatus: ProductionStatus) => void;
}

export function KitchenOrderCard({ order, onAdvance }: KitchenOrderCardProps) {
  const elapsed = useElapsedMinutes(order.cookStartedAt);
  const isOverdue = order.status === "dimasak" && elapsed >= 20;
  const nextStatus = STATUS_NEXT[order.status];
  const nextLabel  = STATUS_NEXT_LABEL[order.status];
  const totalItems = order.items.reduce((s, i) => s + i.qty, 0);

  const cardClass = [
    "kitchen-card",
    `kitchen-card--${order.status}`,
    order.priority === "urgent" ? "kitchen-card--urgent" : "",
    isOverdue ? "kitchen-card--overdue" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cardClass} aria-label={`Pesanan ${order.orderRef}`}>
      {/* ── Header ── */}
      <header className="kitchen-card__header">
        <div className="kitchen-card__ref-group">
          <span className="kitchen-card__ref">{order.orderRef}</span>
          <span className={`kitchen-card__channel ${CHANNEL_COLOR[order.channel] ?? ""}`}>
            {order.channel}
          </span>
        </div>

        {order.priority === "urgent" && (
          <span className="kitchen-card__urgent-badge" aria-label="Prioritas urgent">
            <HugeiconsIcon icon={AlertCircleIcon} size={12} strokeWidth={2} />
            Urgent
          </span>
        )}
      </header>

      {/* ── Customer ── */}
      <p className="kitchen-card__customer">{order.customer}</p>

      {/* ── Items list ── */}
      <ul className="kitchen-card__items" aria-label="Item pesanan">
        {order.items.map((item, idx) => (
          <li key={idx} className="kitchen-card__item">
            <span className="kitchen-card__item-qty">{item.qty}×</span>
            <span className="kitchen-card__item-name">{item.name}</span>
          </li>
        ))}
        <li className="kitchen-card__total">{totalItems} pcs total</li>
      </ul>

      {/* ── Note ── */}
      {order.note && (
        <div className="kitchen-card__note">
          <HugeiconsIcon icon={InformationCircleIcon} size={13} strokeWidth={1.8} />
          <span>{order.note}</span>
        </div>
      )}

      {/* ── Timer (only when cooking) ── */}
      {order.status === "dimasak" && (
        <div className={`kitchen-card__timer ${isOverdue ? "kitchen-card__timer--overdue" : ""}`}>
          <HugeiconsIcon icon={Clock01Icon} size={14} strokeWidth={1.8} />
          <span>{formatElapsed(elapsed)}</span>
          {isOverdue && <span className="kitchen-card__timer-warn">TERLAMBAT</span>}
        </div>
      )}

      {/* ── Waiting time ── */}
      {order.status === "menunggu" && (
        <div className="kitchen-card__wait">
          <HugeiconsIcon icon={Clock01Icon} size={13} strokeWidth={1.8} />
          <span>
            Masuk{" "}
            {Math.floor(
              (Date.now() - new Date(order.createdAt).getTime()) / 60000
            )}{" "}
            mnt lalu
          </span>
        </div>
      )}

      {/* ── Action ── */}
      {nextStatus && nextLabel && (
        <button
          type="button"
          className={`kitchen-card__action kitchen-card__action--${nextStatus}`}
          onClick={() => onAdvance(order.id, nextStatus)}
          aria-label={`${nextLabel} — ${order.orderRef}`}
        >
          <HugeiconsIcon
            icon={
              nextStatus === "dimasak"
                ? FireIcon
                : nextStatus === "siap_pickup"
                ? CheckmarkCircle02Icon
                : KitchenUtensilsIcon
            }
            size={16}
            strokeWidth={1.8}
          />
          <span>{nextLabel}</span>
        </button>
      )}

      {/* ── Siap pickup state ── */}
      {order.status === "siap_pickup" && (
        <div className="kitchen-card__done">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} size={15} strokeWidth={2} />
          <span>Menunggu customer</span>
        </div>
      )}
    </article>
  );
}
