"use client";

import React, { useEffect, useState } from "react";
import { DatePicker, Card, Row, Col, Statistic, message, Spin } from "antd";
import dayjs from "dayjs";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";

export default function SummaryView() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const fetchSummary = async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const month = date.month() + 1;
      const year = date.year();
      const res = await fetch(`/api/accounting/summary?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        message.error(json.error || "Failed to load summary");
      }
    } catch (error) {
      message.error("Failed to load summary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(selectedDate);
  }, [selectedDate]);

  return (
    <div style={{ padding: "20px 0" }}>
      <div style={{ marginBottom: 20 }}>
        <strong style={{ marginRight: 8 }}>Select Month: </strong>
        <DatePicker 
          picker="month" 
          value={selectedDate} 
          onChange={(date) => date && setSelectedDate(date)} 
          allowClear={false}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin size="large" />
        </div>
      ) : data ? (
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Cash Inbound (Debtors)"
                value={data.totalInbound || 0}
                precision={2}
                valueStyle={{ color: "#3f8600" }}
                prefix={<ArrowUpOutlined />}
                suffix="USD"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Cash Outbound (Creditors)"
                value={data.totalOutbound || 0}
                precision={2}
                valueStyle={{ color: "#cf1322" }}
                prefix={<ArrowDownOutlined />}
                suffix="USD"
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card style={{ backgroundColor: data.netCashflow >= 0 ? "#f6ffed" : "#fff1f0" }}>
              <Statistic
                title="Net Cashflow"
                value={Math.abs(data.netCashflow || 0)}
                precision={2}
                valueStyle={{ color: data.netCashflow >= 0 ? "#3f8600" : "#cf1322" }}
                prefix={data.netCashflow >= 0 ? "+" : "-"}
                suffix="USD"
              />
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  );
}
