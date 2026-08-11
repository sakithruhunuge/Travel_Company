"use client";

import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useTenant } from "@/context/TenantBrandingContext";

// ─── Inline CSS (header-scoped, no conflicts with sidebar) ────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  .tn-topbar {
    background: #fff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0 26px;
    height: 62px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 50;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
    font-family: 'Inter', system-ui, sans-serif;
  }
  .tn-search {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 7px;
    padding: 7px 12px;
    color: #94a3b8;
    font-size: 12.5px;
    cursor: text;
    transition: border .15s;
    min-width: 320px;
  }
  .tn-search:hover { border-color: #c7d0dc; }
  .tn-search-left { display: flex; align-items: center; gap: 7px; }
  .tn-kbd {
    font-size: 10px;
    color: #c7d0dc;
    background: #f1f5f9;
    border-radius: 4px;
    padding: 1px 6px;
  }
  .tn-right { display: flex; align-items: center; gap: 10px; }
  .tn-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 7px;
    background: transparent;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    cursor: pointer;
    transition: background .15s;
    flex-shrink: 0;
    position: relative;
  }
  .tn-icon-btn:hover { background: #f1f5f9; }
  .tn-notif-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #e11d48;
    border: 2px solid #fff;
  }
  .tn-profile {
    display: flex;
    align-items: center;
    gap: 9px;
    background: transparent;
    border: none;
    border-radius: 9px;
    padding: 5px 8px 5px 5px;
    cursor: pointer;
    transition: background .15s;
    font-family: inherit;
  }
  .tn-profile:hover { background: #f1f5f9; }
  .tn-avatar {
    width: 30px;
    height: 30px;
    border-radius: 7px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 12px;
    font-weight: 800;
    flex-shrink: 0;
    overflow: hidden;
  }
  .tn-name { font-size: 12.5px; font-weight: 700; color: #1e293b; line-height: 1.2; }
  .tn-role { font-size: 9.5px; color: #94a3b8; font-weight: 500; }
  /* Notification dropdown */
  .tn-notif-panel {
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 300px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0,0,0,.12);
    z-index: 50;
    overflow: hidden;
  }
  .tn-notif-hd {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
  }
  .tn-notif-title { font-size: 13px; font-weight: 700; color: #0f172a; }
  .tn-notif-mark { font-size: 11px; font-weight: 600; color: var(--tn-accent); cursor: pointer; background: none; border: none; font-family: inherit; }
  .tn-notif-mark:hover { opacity: 0.75; text-decoration: underline; }
  .tn-notif-item {
    padding: 11px 16px;
    border-bottom: 1px solid #f8fafc;
    cursor: pointer;
    transition: background .12s;
  }
  .tn-notif-item:hover { background: #f8fafc; }
  .tn-notif-item.unread { background: #eef2ff; }
  .tn-notif-item.unread:hover { background: #e0e7ff; }
  .tn-notif-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3px; }
  .tn-notif-item-title { font-size: 12px; font-weight: 700; color: #0f172a; }
  .tn-notif-time { font-size: 10px; color: #94a3b8; white-space: nowrap; margin-left: 8px; }
  .tn-notif-msg { font-size: 11px; color: #64748b; line-height: 1.4; }
  .tn-notif-ft { padding: 10px; text-align: center; border-top: 1px solid #f1f5f9; }
  .tn-notif-view { font-size: 12px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; font-family: inherit; }
  .tn-notif-view:hover { color: var(--tn-accent); text-decoration: underline; }
`;

type TopNavbarProps = {
  title: string;
  subtitle?: string;
};

export default function TopNavbar({ title, subtitle }: TopNavbarProps) {
  const { data: session } = useSession();
  const tenant = useTenant();
  const user = session?.user;
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Dashboard.TopNavbar");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: "Booking Confirmed", message: "Your trip to Sigiriya has been confirmed.", time: "2 hours ago", unread: true },
    { id: 2, title: "Special Offer", message: "Get 20% off on your next booking to Mirissa.", time: "1 day ago", unread: true },
    { id: 3, title: "Profile Updated", message: "Your profile information was updated successfully.", time: "3 days ago", unread: false },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;
  const userName = user?.name ?? "Admin";
  const userInitial = userName.charAt(0).toUpperCase();
  const tenantName = (tenant as any)?.name ?? "Travel Co.";
  const secondaryColor = (tenant as any)?.branding?.secondaryColor ?? "#FE2A2A";

  return (
    <>
      <style>{CSS}</style>
      {/* Inject accent CSS variable so CSS classes can read it */}
      <style>{`:root { --tn-accent: ${secondaryColor}; }`}</style>
      <header className="tn-topbar">
        {/* ── Search bar ── */}
        <div className="tn-search">
          <div className="tn-search-left">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search requests, destinations...
          </div>
          <span className="tn-kbd">⌘ + F</span>
        </div>

        {/* ── Right side ── */}
        <div className="tn-right">
          {/* Notifications */}
          <div style={{ position: "relative" }} ref={notificationsRef}>
            <button
              className="tn-icon-btn"
              aria-label={t("notifications")}
              onClick={() => setShowNotifications((prev) => !prev)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              {unreadCount > 0 && <span className="tn-notif-badge" />}
            </button>

            {showNotifications && (
              <div className="tn-notif-panel">
                <div className="tn-notif-hd">
                  <span className="tn-notif-title">{t("notifications")}</span>
                  <button className="tn-notif-mark">{t("markAllRead")}</button>
                </div>
                <div style={{ maxHeight: 280, overflowY: "auto" }}>
                  {notifications.map((n) => (
                    <div key={n.id} className={`tn-notif-item${n.unread ? " unread" : ""}`}>
                      <div className="tn-notif-row">
                        <span className="tn-notif-item-title">{n.title}</span>
                        <span className="tn-notif-time">{n.time}</span>
                      </div>
                      <p className="tn-notif-msg">{n.message}</p>
                    </div>
                  ))}
                </div>
                <div className="tn-notif-ft">
                  <button className="tn-notif-view">{t("viewAll")}</button>
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <button className="tn-icon-btn" aria-label="Help">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </button>

          {/* Profile chip */}
          <button className="tn-profile" onClick={() => signOut({ callbackUrl: `${window.location.origin}/login` })} title={t("signOut")}>
            <div className="tn-avatar" style={{ background: secondaryColor }}>
              {user?.image ? (
                <Image src={user.image} alt={userName} width={30} height={30} style={{ objectFit: "cover" }} />
              ) : (
                userInitial
              )}
            </div>
            <div style={{ textAlign: "left" }}>
              <div className="tn-name">{userName}</div>
              <div className="tn-role">Admin @ {tenantName}</div>
            </div>
          </button>
        </div>
      </header>
    </>
  );
}
