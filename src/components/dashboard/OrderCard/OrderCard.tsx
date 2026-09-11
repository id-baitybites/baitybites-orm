import {
    Calendar03Icon,
    Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import {
    OrderStatus,
    type OrderStatusValue,
} from "@/components/order/OrderStatus/OrderStatus";

import "./OrderCard.scss";

interface OrderCardProps {
    number: string;
    customer: string;
    date: string;
    time: string;
    amount: string;
    status: OrderStatusValue;
    onDetail?: () => void;
}

export function OrderCard({
    number,
    customer,
    date,
    time,
    amount,
    status,
    onDetail,
}: OrderCardProps) {
    return (
        <article className="order-card">
            <div className="order-card__top">
                <strong className="order-card__number">
                    {number}
                </strong>

                <OrderStatus status={status} />
            </div>

            <h3 className="order-card__customer">
                {customer}
            </h3>

            <div className="order-card__meta">
                <span className="order-card__meta-item">
                    <HugeiconsIcon
                        icon={Calendar03Icon}
                        size={14}
                    />
                    {date}
                </span>

                <span className="order-card__meta-item">
                    <HugeiconsIcon
                        icon={Clock01Icon}
                        size={14}
                    />
                    {time}
                </span>
            </div>

            <div className="order-card__footer">
                <strong className="order-card__amount">
                    {amount}
                </strong>

                <button
                    type="button"
                    className="order-card__detail"
                    onClick={onDetail}
                >
                    Lihat Detail
                </button>
            </div>
        </article>
    );
}