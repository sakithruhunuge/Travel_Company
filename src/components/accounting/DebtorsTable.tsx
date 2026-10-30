"use client";

import React, { useEffect, useState } from "react";
import { Table, Button, Tag, message } from "antd";
import PartPaymentModal from "./PartPaymentModal";

export default function DebtorsTable() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  const fetchDebtors = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounting/debtors");
      const json = await res.json();
      if (json.success) {
        setData(json.debtors);
      } else {
        message.error(json.error || "Failed to load debtors");
      }
    } catch (error) {
      message.error("Failed to load debtors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebtors();
  }, []);

  const handleAddPayment = (record: any) => {
    setSelectedRecord(record);
    setModalVisible(true);
  };

  const handlePaymentSuccess = () => {
    setModalVisible(false);
    fetchDebtors();
  };

  const columns = [
    {
      title: "Tour Ref",
      dataIndex: "tourId",
      key: "tourId",
      render: (tourId: string, record: any) => tourId || record._id.substring(0, 8),
    },
    {
      title: "Guest Name",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Status",
      key: "status",
      render: (record: any) => {
        if (record.actualInvoice && record.actualInvoice.balanceDue > 0) {
          return <Tag color={record.actualInvoice.settlementStatus === "settled" ? "green" : "orange"}>Actual: {record.actualInvoice.settlementStatus}</Tag>;
        }
        if (record.proforma) {
          return <Tag color={record.proforma.status === "paid" ? "green" : "blue"}>Proforma: {record.proforma.status}</Tag>;
        }
        return <Tag>{record.status}</Tag>;
      }
    },
    {
      title: "Balance Due",
      key: "balanceDue",
      render: (record: any) => {
        let balance = 0;
        if (record.actualInvoice && record.actualInvoice.balanceDue > 0) {
          balance = record.actualInvoice.balanceDue;
        } else if (record.proforma) {
          balance = record.proforma.advanceDepositDue - record.proforma.advancePaid;
        }
        return <span style={{ fontWeight: "bold", color: "#d97706" }}>${balance.toFixed(2)}</span>;
      }
    },
    {
      title: "Action",
      key: "action",
      render: (record: any) => (
        <Button type="primary" size="small" onClick={() => handleAddPayment(record)}>
          Add Payment
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
          referenceType="TravelRequest"
          maxAmount={
            (selectedRecord.actualInvoice && selectedRecord.actualInvoice.balanceDue > 0)
              ? selectedRecord.actualInvoice.balanceDue
              : (selectedRecord.proforma ? selectedRecord.proforma.advanceDepositDue - selectedRecord.proforma.advancePaid : undefined)
          }
        />
      )}
    </>
  );
}
