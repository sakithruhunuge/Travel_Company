"use client";

import React, { useEffect, useState } from "react";
import { DatePicker, Card, Row, Col, Statistic, message, Spin, Divider, Typography } from "antd";
import dayjs from "dayjs";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  SwapOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

// ── Styled metric card ────────────────────────────────────────────────────────
function MetricCard({
  title,
  value,
  prefix,
  color,
  background,
  icon,
  subtitle,
}: {
  title: string;
  value: number;
  prefix: React.ReactNode;
  color: string;
  background: string;
  icon: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <Card
      bordered={false}
      style={{
        background,
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
        height: "100%",
      }}
      bodyStyle={{ padding: "20px 24px" }}
    >
      {/* Icon badge */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 38,
          height: 38,
          borderRadius: 10,
          background: color,
          marginBottom: 12,
          fontSize: 18,
          color: "#fff",
        }}
      >
        {icon}
      </div>

      <Statistic
        title={
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>
            {title}
          </span>
        }
        value={value}
        precision={2}
        valueStyle={{ color, fontWeight: 700, fontSize: 26 }}
        prefix={prefix}
        suffix={<span style={{ fontSize: 14, fontWeight: 500, color: "#94a3b8" }}>USD</span>}
      />
      {subtitle && (
        <Text type="secondary" style={{ fontSize: 11, marginTop: 6, display: "block" }}>
          {subtitle}
        </Text>
      )}
    </Card>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SummaryView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const fetchSummary = async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const month = date.month() + 1;
      const year  = date.year();
      const res   = await fetch(`/api/accounting/summary?month=${month}&year=${year}`);
      const json  = await res.json();
      if (json.success) {
        setData(json);
      } else {
        message.error(json.error || "Failed to load summary");
      }
    } catch {
      message.error("Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate]);

  const netPositive = (data?.netCashflow ?? 0) >= 0;

  return (
    <div style={{ padding: "20px 0" }}>

      {/* ── Month picker ─────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: 17, color: "#1e293b" }}>
            Financial Overview
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 2 }}>
            Cash movement & outstanding balances for the selected period
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Text strong style={{ color: "#475569" }}>Period:</Text>
          <DatePicker
            picker="month"
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            allowClear={false}
            style={{ width: 160 }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <>
          {/* ── Row 1: Monthly Cash Flow ───────────────────────────── */}
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              display: "block",
              marginBottom: 12,
            }}
          >
            Monthly Cash Movement — {dayjs().month(data.month - 1).format("MMMM")} {data.year}
          </Text>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <MetricCard
                title="Total Cash Inbound (Debtors)"
                value={data.totalInbound || 0}
                prefix={<ArrowUpOutlined />}
                color="#16a34a"
                background="linear-gradient(135deg, #f0fdf4, #dcfce7)"
                icon={<ArrowUpOutlined />}
                subtitle="Payments received from clients this month"
              />
            </Col>

            <Col xs={24} sm={12} md={8}>
              <MetricCard
                title="Total Cash Outbound (Creditors)"
                value={data.totalOutbound || 0}
                prefix={<ArrowDownOutlined />}
                color="#dc2626"
                background="linear-gradient(135deg, #fff1f2, #ffe4e6)"
                icon={<ArrowDownOutlined />}
                subtitle="Payments made to vendors this month"
              />
            </Col>

            <Col xs={24} sm={24} md={8}>
              <MetricCard
                title="Net Cashflow"
                value={Math.abs(data.netCashflow || 0)}
                prefix={netPositive ? "+" : "−"}
                color={netPositive ? "#0B7C8A" : "#9333ea"}
                background={
                  netPositive
                    ? "linear-gradient(135deg, #ecfeff, #cffafe)"
                    : "linear-gradient(135deg, #faf5ff, #f3e8ff)"
                }
                icon={<SwapOutlined />}
                subtitle={netPositive ? "Net surplus for the month" : "Net deficit for the month"}
              />
            </Col>
          </Row>

          <Divider style={{ margin: "28px 0 20px" }} />

          {/* ── Row 2: Outstanding Balances (all-time) ─────────────── */}
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.2,
              display: "block",
              marginBottom: 12,
            }}
          >
            Outstanding Balances — All Time
          </Text>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <MetricCard
                title="Total Outstanding Credit (Debtors)"
                value={data.totalOutstandingCredit || 0}
                prefix={<ExclamationCircleOutlined />}
                color="#d97706"
                background="linear-gradient(135deg, #fffbeb, #fef3c7)"
                icon={<ExclamationCircleOutlined />}
                subtitle="Sum of unpaid balances still owed to us by clients"
              />
            </Col>

            <Col xs={24} sm={12}>
              <MetricCard
                title="Total Pending Payables (Creditors)"
                value={data.totalPendingPayables || 0}
                prefix={<ClockCircleOutlined />}
                color="#7c3aed"
                background="linear-gradient(135deg, #f5f3ff, #ede9fe)"
                icon={<ClockCircleOutlined />}
                subtitle="Sum of unsettled bills we still owe to vendors"
              />
            </Col>
          </Row>
        </>
      ) : null}
    </div>
  );
}
