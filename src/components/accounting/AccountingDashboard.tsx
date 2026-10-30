"use client";

import React from "react";
import { Tabs, Typography, Card, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import DebtorsTable from "./DebtorsTable";
import CreditorsTable from "./CreditorsTable";
import SummaryView from "./SummaryView";

const { Title } = Typography;

export default function AccountingDashboard() {
  const router   = useRouter();
  const pathname = usePathname();

  // Extract locale segment (e.g. "en" from "/en/admin/accounting")
  const locale = pathname?.split("/")[1] || "en";

  const items = [
    {
      key: "1",
      label: "Accounts Receivable (Debtors)",
      children: <DebtorsTable />,
    },
    {
      key: "2",
      label: "Accounts Payable (Creditors)",
      children: <CreditorsTable />,
    },
    {
      key: "3",
      label: "Monthly Credit List & Summary",
      children: <SummaryView />,
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px" }}>

      {/* ── Back button ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => {
            // router.back() if there is history, otherwise fall back to dashboard
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push(`/${locale}/dashboard`);
            }
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            height: 34,
            color: "#0B7C8A",
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 8,
            transition: "background 0.2s, color 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#e6f7f8";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
        >
          Back to Dashboard
        </Button>
      </div>

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#0B7C8A" }}>
          Integrated Accounting Engine
        </Title>
        <p style={{ color: "#64748b", marginTop: 8 }}>
          Manage inbound payments, outbound settlements, and financial reporting.
        </p>
      </div>

      {/* ── Tab content ─────────────────────────────────────────────── */}
      <Card bordered={false} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Tabs defaultActiveKey="1" items={items} size="large" />
      </Card>
    </div>
  );
}
