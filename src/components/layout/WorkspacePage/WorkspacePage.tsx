"use client";

import { Add01Icon, ArrowRight01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { AppShell } from "../AppShell/AppShell";
import "./workspace-page.scss";

type Row = {
  title: string;
  subtitle?: string;
  value?: string;
  status?: string;
  tone?: string;
};

type WorkspacePageProps = {
  title: string;
  description: string;
  eyebrow?: string;
  action?: string;
  onAction?: () => void;
  stats?: Array<{
    label: string;
    value: string;
    change?: string;
    tone?: string;
  }>;
  tabs?: string[];
  rows?: Row[];
  rowHeading?: string;
  emptyLabel?: string;
  children?: React.ReactNode;
};

export function WorkspacePage({
  title,
  description,
  eyebrow = "BAITYBITES OMS / OPERASIONAL",
  action,
  onAction,
  stats = [],
  tabs,
  rows = [],
  rowHeading = "Data terbaru",
  emptyLabel = "Belum ada data",
  children,
}: WorkspacePageProps) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(tabs?.[0] ?? "Semua");

  const filteredRows = rows.filter((row) =>
    `${row.title} ${row.subtitle ?? ""} ${row.status ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <div className="workspace-page">
        {/* HEADING */}
        <header className="workspace-page__heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="workspace-page__desc">{description}</p>
          </div>

          {action && (
            <button className="workspace-page__action" type="button" onClick={onAction}>
              <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={1.8} />
              <span>{action}</span>
            </button>
          )}
        </header>

        {/* STATS */}
        {stats.length > 0 && (
          <section className="workspace-page__stats">
            {stats.map((stat) => (
              <article className={`workspace-stat workspace-stat--${stat.tone ?? "orange"}`} key={stat.label}>
                <span className="workspace-stat__label">{stat.label}</span>
                <strong className="workspace-stat__value">{stat.value}</strong>
                {stat.change && <small className="workspace-stat__change">{stat.change}</small>}
              </article>
            ))}
          </section>
        )}

        {children}

        {/* DATA PANEL */}
        {rows.length > 0 && (
          <section className="workspace-panel">
            <div className="workspace-panel__heading">
              <div>
                <h2>{rowHeading}</h2>
                <span className="workspace-panel__count">{filteredRows.length} item ditemukan</span>
              </div>

              <label className="workspace-search">
                <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={1.8} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Cari data..."
                  aria-label="Cari data"
                />
              </label>
            </div>

            {tabs && tabs.length > 0 && (
              <div className="workspace-tabs" role="tablist">
                {tabs.map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    className={activeTab === tab ? "is-active" : ""}
                    onClick={() => setActiveTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <div className="workspace-table">
              <div className="workspace-table__header">
                <span>Nama / Referensi</span>
                <span>Detail</span>
                <span>Status</span>
                <span>Aksi</span>
              </div>

              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <div className="workspace-table__row" key={`${row.title}-${row.subtitle}`}>
                    <div className="workspace-table__cell-title">
                      <strong>{row.title}</strong>
                      {row.subtitle && <small>{row.subtitle}</small>}
                    </div>

                    <span className="workspace-table__cell-value">{row.value ?? "-"}</span>

                    <div>
                      <span className={`status-pill status-pill--${row.tone ?? "neutral"}`}>
                        {row.status ?? "Aktif"}
                      </span>
                    </div>

                    <button type="button" className="workspace-table__link">
                      <span>Detail</span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="workspace-empty">{emptyLabel}</div>
              )}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
