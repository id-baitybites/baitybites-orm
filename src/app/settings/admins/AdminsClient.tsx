"use client";

import { useState, useTransition } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
  UserAdd01Icon,
  Delete01Icon,
  LockPasswordIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  UserIcon,
  Clock01Icon,
  ShieldKeyIcon,
} from "@hugeicons/core-free-icons";
import type { AdminListItem } from "./actions";
import {
  createAdminAction,
  toggleAdminActiveAction,
  deleteAdminAction,
  resetAdminPasswordAction,
  updateAdminRoleAction,
} from "./actions";
import "./admins.scss";

// ─── Sub-components ───────────────────────────────────────────────────────────

function getRoleBadge(role?: string) {
  switch (role) {
    case "PLATFORM_OWNER":
      return { label: "Platform Owner", bg: "#4f46e5", text: "#ffffff" };
    case "KASIR":
      return { label: "Kasir (POS & Orders)", bg: "#059669", text: "#ffffff" };
    case "KITCHEN_STAFF":
      return { label: "Kitchen Staff (KDS)", bg: "#d97706", text: "#ffffff" };
    case "SUPER_ADMIN":
    default:
      return { label: "Super Admin", bg: "#ea580c", text: "#ffffff" };
  }
}

function AdminCard({
  admin,
  currentUsername,
  onRefresh,
}: {
  admin: AdminListItem;
  currentUsername: string | null;
  onRefresh: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const isSelf = admin.username === currentUsername;
  const roleBadge = getRoleBadge(admin.role);

  function handleRoleChange(newRole: string) {
    startTransition(async () => {
      const res = await updateAdminRoleAction(admin.id, newRole);
      if (!res.success) setMsg({ type: "err", text: res.error! });
      else {
        setMsg({ type: "ok", text: `Role berhasil diubah menjadi ${newRole}.` });
        onRefresh();
      }
    });
  }

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleAdminActiveAction(admin.id, !admin.isActive);
      if (!res.success) setMsg({ type: "err", text: res.error! });
      else { setMsg({ type: "ok", text: admin.isActive ? "Admin dinonaktifkan." : "Admin diaktifkan." }); onRefresh(); }
    });
  }

  function handleDelete() {
    if (!confirm(`Hapus admin "${admin.username}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    startTransition(async () => {
      const res = await deleteAdminAction(admin.id);
      if (!res.success) setMsg({ type: "err", text: res.error! });
      else { setMsg({ type: "ok", text: "Admin dihapus." }); onRefresh(); }
    });
  }

  function handleResetPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("newPassword", newPassword);
    startTransition(async () => {
      const res = await resetAdminPasswordAction(admin.id, fd);
      if (!res.success) setMsg({ type: "err", text: res.error! });
      else { setMsg({ type: "ok", text: "Password berhasil direset." }); setShowReset(false); setNewPassword(""); }
    });
  }

  return (
    <article className={`admin-card${isSelf ? " admin-card--self" : ""}${!admin.isActive ? " admin-card--inactive" : ""}`}>
      <div className="admin-card__header">
        <span className="admin-card__avatar">
          <HugeiconsIcon icon={UserIcon as IconSvgElement} size={20} strokeWidth={1.8} />
        </span>
        <div className="admin-card__info">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <strong className="admin-card__name">
              {admin.displayName}
              {isSelf && <span className="admin-card__self-badge">Anda</span>}
            </strong>
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: "6px",
                background: roleBadge.bg,
                color: roleBadge.text,
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {roleBadge.label}
            </span>
          </div>
          <code className="admin-card__username">@{admin.username}</code>
        </div>
        <span className={`admin-card__status-badge${admin.isActive ? " admin-card__status-badge--active" : " admin-card__status-badge--inactive"}`}>
          <HugeiconsIcon
            icon={(admin.isActive ? CheckmarkCircle02Icon : Cancel01Icon) as IconSvgElement}
            size={12}
            strokeWidth={2}
          />
          {admin.isActive ? "Aktif" : "Nonaktif"}
        </span>
      </div>

      {!isSelf && (
        <div style={{ padding: "8px 16px", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Ubah Role:</span>
          <select
            value={admin.role || "SUPER_ADMIN"}
            disabled={isPending}
            onChange={(e) => handleRoleChange(e.target.value)}
            style={{
              padding: "4px 8px",
              fontSize: "0.78rem",
              borderRadius: "6px",
              background: "#1f2937",
              color: "#f3f4f6",
              border: "1px solid #374151",
              cursor: "pointer",
            }}
          >
            <option value="SUPER_ADMIN">👑 Super Admin</option>
            <option value="KASIR">🧾 Kasir (POS & Orders)</option>
            <option value="KITCHEN_STAFF">🍳 Kitchen Staff (KDS)</option>
          </select>
        </div>
      )}

      <dl className="admin-card__meta">
        <div>
          <HugeiconsIcon icon={Clock01Icon as IconSvgElement} size={13} strokeWidth={1.8} />
          <dt>Dibuat</dt>
          <dd>{new Date(admin.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</dd>
        </div>
        {admin.createdBy && (
          <div>
            <HugeiconsIcon icon={ShieldKeyIcon as IconSvgElement} size={13} strokeWidth={1.8} />
            <dt>Dipromosikan oleh</dt>
            <dd>{admin.createdBy}</dd>
          </div>
        )}
        {admin.lastLoginAt && (
          <div>
            <HugeiconsIcon icon={CheckmarkCircle02Icon as IconSvgElement} size={13} strokeWidth={1.8} />
            <dt>Login terakhir</dt>
            <dd>{new Date(admin.lastLoginAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</dd>
          </div>
        )}
      </dl>

      {msg && (
        <p className={`admin-card__msg admin-card__msg--${msg.type}`}>{msg.text}</p>
      )}

      {showReset && (
        <form className="admin-card__reset-form" onSubmit={handleResetPassword}>
          <input
            type="password"
            placeholder="Password baru (min. 8 karakter)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
            autoFocus
          />
          <div className="admin-card__reset-actions">
            <button type="submit" disabled={isPending} className="btn-primary-sm">
              Simpan
            </button>
            <button type="button" onClick={() => setShowReset(false)} className="btn-ghost-sm">
              Batal
            </button>
          </div>
        </form>
      )}

      <div className="admin-card__actions">
        <button
          className="btn-ghost-sm"
          onClick={() => setShowReset((v) => !v)}
          disabled={isPending}
          title="Reset password"
        >
          <HugeiconsIcon icon={LockPasswordIcon as IconSvgElement} size={14} strokeWidth={1.8} />
          Reset Password
        </button>

        {!isSelf && (
          <>
            <button
              className={admin.isActive ? "btn-warn-sm" : "btn-primary-sm"}
              onClick={handleToggle}
              disabled={isPending}
            >
              <HugeiconsIcon
                icon={(admin.isActive ? Cancel01Icon : CheckmarkCircle02Icon) as IconSvgElement}
                size={14}
                strokeWidth={1.8}
              />
              {admin.isActive ? "Nonaktifkan" : "Aktifkan"}
            </button>

            <button
              className="btn-danger-sm"
              onClick={handleDelete}
              disabled={isPending}
              title="Hapus admin ini"
            >
              <HugeiconsIcon icon={Delete01Icon as IconSvgElement} size={14} strokeWidth={1.8} />
            </button>
          </>
        )}
      </div>
    </article>
  );
}

// ─── Promote Form ─────────────────────────────────────────────────────────────

function PromoteForm({ onSuccess }: { onSuccess: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await createAdminAction(fd);
      if (res.success) { form.reset(); setOpen(false); onSuccess(); }
      else setError(res.error ?? "Gagal membuat admin.");
    });
  }

  if (!open) {
    return (
      <button className="promote-btn" onClick={() => setOpen(true)}>
        <HugeiconsIcon icon={UserAdd01Icon as IconSvgElement} size={16} strokeWidth={1.8} />
        <span>Tambah Staff / Admin Baru</span>
      </button>
    );
  }

  return (
    <div className="promote-form">
      <div className="promote-form__header">
        <h3>
          <HugeiconsIcon icon={UserAdd01Icon as IconSvgElement} size={16} strokeWidth={1.8} />
          Tambah Akun Staff / Admin Baru
        </h3>
        <button className="promote-form__close" type="button" onClick={() => setOpen(false)}>
          <HugeiconsIcon icon={Cancel01Icon as IconSvgElement} size={18} strokeWidth={1.8} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="promote-form__body">
        <div className="promote-form__row">
          <div className="form-field">
            <label htmlFor="pf-username">Username</label>
            <input id="pf-username" name="username" type="text" required placeholder="contoh: jane" autoComplete="off" />
          </div>
          <div className="form-field">
            <label htmlFor="pf-displayName">Nama Tampilan</label>
            <input id="pf-displayName" name="displayName" type="text" required placeholder="contoh: Jane Doe" />
          </div>
        </div>

        <div className="promote-form__row">
          <div className="form-field" style={{ width: "100%" }}>
            <label htmlFor="pf-role">Role Akses</label>
            <select
              id="pf-role"
              name="role"
              defaultValue="SUPER_ADMIN"
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "8px",
                background: "#1f2937",
                border: "1px solid #374151",
                color: "#f3f4f6",
                fontSize: "0.875rem",
                marginTop: "4px",
              }}
            >
              <option value="SUPER_ADMIN">👑 Super Admin Toko (Akses Penuh Semua Modul)</option>
              <option value="KASIR">🧾 Kasir (Point of Sale, Orders & Pelanggan)</option>
              <option value="KITCHEN_STAFF">🍳 Kitchen Staff (Layar Dapur KDS & Batching Produksi)</option>
            </select>
          </div>
        </div>

        <div className="promote-form__row">
          <div className="form-field">
            <label htmlFor="pf-password">Password <span>(min. 8 karakter)</span></label>
            <input id="pf-password" name="password" type="password" required minLength={8} placeholder="Buat password kuat" autoComplete="new-password" />
          </div>
          <div className="form-field">
            <label htmlFor="pf-pin">PIN Keamanan <span>(opsional, 4 digit)</span></label>
            <input id="pf-pin" name="pin" type="text" maxLength={4} pattern="\d{4}" placeholder="9988" />
          </div>
        </div>

        {error && <p className="promote-form__error">{error}</p>}

        <div className="promote-form__footer">
          <button type="submit" disabled={isPending} className="promote-form__submit">
            {isPending ? "Memproses..." : "Simpan Akun Staff"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="promote-form__cancel">
            Batal
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function AdminsClient({
  initialAdmins,
  currentUsername,
}: {
  initialAdmins: AdminListItem[];
  currentUsername: string | null;
}) {
  const [admins, setAdmins] = useState(initialAdmins);

  // Untuk trigger re-fetch setelah mutasi
  function refreshList() {
    window.location.reload();
  }

  return (
    <div className="admins-page">
      <div className="admins-page__header">
        <div>
          <h1>Manajemen Admin &amp; Staff</h1>
          <p>Kelola hak akses berjenjang Super Admin, Kasir, dan Kitchen Staff sistem Baitybites ORM.</p>
        </div>
        <PromoteForm onSuccess={refreshList} />
      </div>

      <div className="admins-page__grid">
        {admins.map((admin) => (
          <AdminCard
            key={admin.id}
            admin={admin}
            currentUsername={currentUsername}
            onRefresh={refreshList}
          />
        ))}
      </div>

      {admins.length === 0 && (
        <div className="admins-page__empty">
          <p>Belum ada admin terdaftar. Jalankan <code>npx tsx prisma/seed-admin.ts</code> terlebih dahulu.</p>
        </div>
      )}

      <div className="admins-page__note">
        <HugeiconsIcon icon={ShieldKeyIcon as IconSvgElement} size={14} strokeWidth={1.8} />
        <span>
          Semua password disimpan sebagai hash bcrypt. Tidak ada password yang bisa dilihat kembali setelah disimpan.
          Minimal 1 admin aktif harus selalu ada.
        </span>
      </div>
    </div>
  );
}
