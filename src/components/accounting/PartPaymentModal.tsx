"use client";

import React, { useState } from "react";
import { Modal, Form, InputNumber, Select, DatePicker, Input, message } from "antd";

interface PartPaymentModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  referenceId: string;
  referenceType: "TravelRequest" | "Payable";
  vendorId?: string;
  maxAmount?: number;
}

export default function PartPaymentModal({
  visible,
  onCancel,
  onSuccess,
  referenceId,
  referenceType,
  vendorId,
  maxAmount,
}: PartPaymentModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const payload = {
        referenceType,
        referenceId,
        vendorId,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        paymentDate: values.paymentDate ? values.paymentDate.toISOString() : undefined,
        notes: values.notes,
      };

      const res = await fetch("/api/accounting/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to process payment");
      }

      message.success("Payment recorded successfully!");
      form.resetFields();
      onSuccess();
    } catch (error: any) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Log ${referenceType === "TravelRequest" ? "Inbound" : "Outbound"} Payment`}
      open={visible}
      onCancel={onCancel}
      onOk={() => form.submit()}
      confirmLoading={loading}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="amount"
          label="Amount Paid"
          rules={[{ required: true, message: "Please enter amount" }]}
        >
          <InputNumber
            style={{ width: "100%" }}
            min={0.01}
            max={maxAmount}
            prefix="$"
            precision={2}
          />
        </Form.Item>
        <Form.Item
          name="paymentMethod"
          label="Payment Method"
          rules={[{ required: true, message: "Please select payment method" }]}
        >
          <Select>
            <Select.Option value="cash">Cash</Select.Option>
            <Select.Option value="bank_transfer">Bank Transfer</Select.Option>
            <Select.Option value="card">Card / Stripe</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="paymentDate" label="Payment Date">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="notes" label="Notes / Reference ID">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
