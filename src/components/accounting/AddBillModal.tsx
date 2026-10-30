"use client";

import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Divider,
  Typography,
} from "antd";
import {
  ShopOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  TagsOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface AddBillModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const VENDOR_TYPE_OPTIONS = [
  { value: "hotel",      label: "🏨  Hotel / Accommodation" },
  { value: "transport",  label: "🚐  Transport / Vehicle" },
  { value: "attraction", label: "🎡  Attraction / Excursion" },
  { value: "other",      label: "📦  Other / Miscellaneous" },
];

export default function AddBillModal({ visible, onCancel, onSuccess }: AddBillModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        vendorName:  values.vendorName.trim(),
        vendorType:  values.vendorType,
        description: values.description?.trim() || values.vendorName.trim(),
        amountTotal: values.amountTotal,
        dueDate:     values.dueDate ? values.dueDate.toISOString() : undefined,
      };

      const res = await fetch("/api/accounting/payables/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to create bill");
      }

      message.success("Bill added successfully!");
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      message.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: "linear-gradient(135deg, #0B7C8A, #06b6d4)",
              borderRadius: 8,
              padding: "4px 10px",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.4,
            }}
          >
            NEW BILL
          </span>
          <span style={{ fontWeight: 600, fontSize: 16, color: "#1e293b" }}>
            Add Manual Bill
          </span>
        </div>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      onOk={() => form.submit()}
      okText="Create Bill"
      okButtonProps={{
        style: {
          background: "linear-gradient(135deg, #0B7C8A, #06b6d4)",
          border: "none",
          fontWeight: 600,
        },
        loading,
      }}
      cancelButtonProps={{ style: { fontWeight: 500 } }}
      width={500}
      destroyOnClose
      styles={{
        header: { borderBottom: "1px solid #f0f0f0", paddingBottom: 14 },
        body: { paddingTop: 20 },
      }}
    >
      {/* ── Vendor Section ─────────────────────────────────── */}
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
        Vendor Details
      </Text>
      <Divider style={{ margin: "8px 0 16px" }} />

      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark="optional">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Form.Item
            name="vendorName"
            label={<span style={{ fontWeight: 500 }}><ShopOutlined style={{ marginRight: 5 }} />Vendor Name</span>}
            rules={[{ required: true, message: "Vendor name is required" }]}
            style={{ marginBottom: 12 }}
          >
            <Input placeholder="e.g. Cinnamon Grand Hotel" allowClear />
          </Form.Item>

          <Form.Item
            name="vendorType"
            label={<span style={{ fontWeight: 500 }}><TagsOutlined style={{ marginRight: 5 }} />Vendor Type</span>}
            rules={[{ required: true, message: "Select a type" }]}
            style={{ marginBottom: 12 }}
          >
            <Select placeholder="Select type" options={VENDOR_TYPE_OPTIONS} />
          </Form.Item>
        </div>

        {/* ── Bill Section ────────────────────────────────── */}
        <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
          Bill Details
        </Text>
        <Divider style={{ margin: "8px 0 16px" }} />

        <Form.Item
          name="description"
          label={<span style={{ fontWeight: 500 }}><FileTextOutlined style={{ marginRight: 5 }} />Description</span>}
          style={{ marginBottom: 12 }}
        >
          <Input placeholder="e.g. 3-night stay for Tour #TRV-001" allowClear />
        </Form.Item>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Form.Item
            name="amountTotal"
            label={<span style={{ fontWeight: 500 }}><DollarOutlined style={{ marginRight: 5 }} />Total Amount (USD)</span>}
            rules={[
              { required: true, message: "Amount is required" },
              { type: "number", min: 0.01, message: "Must be greater than 0" },
            ]}
            style={{ marginBottom: 0 }}
          >
            <InputNumber
              style={{ width: "100%" }}
              min={0.01}
              precision={2}
              prefix="$"
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label={<span style={{ fontWeight: 500 }}><CalendarOutlined style={{ marginRight: 5 }} />Due Date</span>}
            style={{ marginBottom: 0 }}
          >
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
