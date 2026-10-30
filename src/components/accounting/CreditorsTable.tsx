"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Tag, message, Space, Tooltip } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import PartPaymentModal from "./PartPaymentModal";
import AddBillModal from "./AddBillModal";
import dayjs from "dayjs";

export default function CreditorsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Settle-bill modal
  const [settleVisible, setSettleVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Add-bill modal
  const [addBillVisible, setAddBillVisible] = useState(false);

  const fetchCreditors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/creditors");
      const json = await res.json();
      if (json.success) {
        setData(json.creditors);
      } else {
        message.error(json.error || "Failed to load creditors");
      }
    } catch {
      message.error("Failed to load creditors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditors();
  }, []);

  const handleSettleBill = (record: any) => {
    setSelectedRecord(record);
    setSettleVisible(true);
  };

  const columns = [
    {
      title: "Vendor",
      key: "vendor",
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.vendorId?.name || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "#64748b", textTransform: "capitalize" }}>
            {record.vendorId?.type || "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (val: string) => val || <span style={{ color: "#94a3b8" }}>—</span>,
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) =>
        date ? (
          <span style={{ color: dayjs(date).isBefore(dayjs()) ? "#dc2626" : "inherit" }}>
            {dayjs(date).format("MMM DD, YYYY")}
          </span>
        ) : (
          <span style={{ color: "#94a3b8" }}>N/A</span>
        ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          pending: "red",
          partially_paid: "orange",
          settled: "green",
          cancelled: "default",
        };
        return (
          <Tag color={colorMap[status] || "default"}>
            {status?.replace("_", " ").toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: "Total",
      dataIndex: "amountTotal",
      key: "amountTotal",
      render: (val: number) => <span style={{ color: "#475569" }}>${(val || 0).toFixed(2)}</span>,
    },
    {
      title: "Balance Due",
      dataIndex: "balanceDue",
      key: "balanceDue",
      render: (val: number) => (
        <span style={{ fontWeight: 700, color: val > 0 ? "#dc2626" : "#16a34a" }}>
          ${(val || 0).toFixed(2)}
        </span>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (record: any) =>
        record.status !== "settled" && record.status !== "cancelled" ? (
          <Button
            type="primary"
            danger
            size="small"
            onClick={() => handleSettleBill(record)}
          >
            Settle Bill
          </Button>
        ) : (
          <Tag color="green" style={{ margin: 0 }}>DONE</Tag>
        ),
    },
  ];

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#1e293b" }}>
            Accounts Payable
          </span>
          <span style={{ marginLeft: 8, color: "#64748b", fontSize: 13 }}>
            ({data.length} bill{data.length !== 1 ? "s" : ""})
          </span>
        </div>

        <Space>
          <Tooltip title="Refresh table">
            <Button onClick={fetchCreditors} loading={loading} size="small">
              Refresh
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setAddBillVisible(true)}
            style={{
              background: "linear-gradient(135deg, #0B7C8A, #06b6d4)",
              border: "none",
              fontWeight: 600,
            }}
          >
            Add New Bill
          </Button>
        </Space>
      </div>

      {/* ── Creditors Table ──────────────────────────────────────────── */}
      <Table
        columns={columns}
        dataSource={data}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        rowClassName={(record) =>
          record.status === "settled" ? "ant-table-row-settled" : ""
        }
      />

      {/* ── Settle Bill Modal ────────────────────────────────────────── */}
      {selectedRecord && (
        <PartPaymentModal
          visible={settleVisible}
          onCancel={() => setSettleVisible(false)}
          onSuccess={() => {
            setSettleVisible(false);
            fetchCreditors();
          }}
          referenceId={selectedRecord._id}
          referenceType="Payable"
          vendorId={selectedRecord.vendorId?._id}
          maxAmount={selectedRecord.balanceDue}
        />
      )}

      {/* ── Add New Bill Modal ───────────────────────────────────────── */}
      <AddBillModal
        visible={addBillVisible}
        onCancel={() => setAddBillVisible(false)}
        onSuccess={() => {
          setAddBillVisible(false);
          fetchCreditors();
        }}
      />
    </>
  );
}
