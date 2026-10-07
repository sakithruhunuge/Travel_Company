"use client";

import React from "react";
import { Tabs, Typography, Card } from "antd";
import DebtorsTable from "./DebtorsTable";
import CreditorsTable from "./CreditorsTable";
import SummaryView from "./SummaryView";

const { Title } = Typography;

export default function AccountingDashboard() {
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
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#0B7C8A" }}>Integrated Accounting Engine</Title>
        <p style={{ color: "#64748b", marginTop: 8 }}>Manage inbound payments, outbound settlements, and financial reporting.</p>
      </div>
      <Card bordered={false} style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <Tabs defaultActiveKey="1" items={items} size="large" />
      </Card>
    </div>
  );
}
