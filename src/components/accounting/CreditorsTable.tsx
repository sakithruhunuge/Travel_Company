"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Tag, message } from "antd";
import PartPaymentModal from "./PartPaymentModal";
import dayjs from "dayjs";

export default function CreditorsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

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
    } catch (error) {
      message.error("Failed to load creditors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditors();
  }, []);

  const handleAddPayment = (record: any) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handlePaymentSuccess = () => {
    setModalVisible(false);
    fetchCreditors();
  };

  const columns = [
    {
      title: "Vendor",
      key: "vendor",
      render: (record: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.vendorId?.name || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "#666", textTransform: "capitalize" }}>{record.vendorId?.type || "N/A"}</div>
        </div>
      )
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) => date ? dayjs(date).format("MMM DD, YYYY") : "N/A"
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colorMap: any = {
          pending: "red",
          partially_paid: "orange",
          settled: "green",
          cancelled: "default"
        };
        return <Tag color={colorMap[status] || "default"}>{status?.replace("_", " ").toUpperCase()}</Tag>;
      }
    },
    {
      title: "Balance Due",
      dataIndex: "balanceDue",
      key: "balanceDue",
      render: (val: number) => <span style={{ fontWeight: "bold", color: "#dc2626" }}>${(val || 0).toFixed(2)}</span>
    },
    {
      title: "Action",
      key: "action",
      render: (record: any) => (
        <Button type="primary" danger size="small" onClick={() => handleAddPayment(record)}>
          Settle Bill
        </Button>
      ),
    },
  ];

  return (
    <>
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="_id" 
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      {selectedRecord && (
        <PartPaymentModal
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          onSuccess={handlePaymentSuccess}
          referenceId={selectedRecord._id}
          referenceType="Payable"
          vendorId={selectedRecord.vendorId?._id}
          maxAmount={selectedRecord.balanceDue}
        />
      )}
    </>
  );
}
