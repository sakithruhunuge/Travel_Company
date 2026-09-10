import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface InTourAdditionItem {
  description: string;
  category: string;
  amount: number;
}

export interface ActualInvoiceProps {
  invoiceNumber: string;
  proformaInvoiceNumber?: string;
  tourId: string;
  issueDate: string;
  tenantName: string;
  primaryColor?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  numberOfTravelers: number;
  packageName: string;
  preferredStartDate: string;
  duration?: string;
  proformaBaseTotal: number;
  inTourAdditions: InTourAdditionItem[];
  additionsTotal: number;
  deductionsTotal: number;
  netFinalTotal: number;
  advancePaid: number;
  balanceDue: number;
  refundDue: number;
  settlementStatus: "unsettled" | "settled" | "refunded";
  currency?: string;
  notes?: string;
}

export default function ActualInvoiceDocument({
  invoiceNumber,
  proformaInvoiceNumber,
  tourId,
  issueDate,
  tenantName,
  primaryColor = "#0B7C8A",
  customerName,
  customerEmail,
  customerPhone,
  numberOfTravelers,
  packageName,
  preferredStartDate,
  duration,
  proformaBaseTotal,
  inTourAdditions,
  additionsTotal,
  deductionsTotal,
  netFinalTotal,
  advancePaid,
  balanceDue,
  refundDue,
  settlementStatus,
  currency = "USD",
  notes,
}: ActualInvoiceProps) {
  const isRefund = refundDue > 0;

  const styles = StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 36,
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#334155",
      backgroundColor: "#ffffff",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 2.5,
      borderBottomColor: "#059669",
      paddingBottom: 16,
      marginBottom: 16,
    },
    companyName: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: primaryColor,
      marginBottom: 3,
    },
    docBadge: {
      backgroundColor: "#059669",
      color: "#ffffff",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      fontFamily: "Helvetica-Bold",
      fontSize: 10,
      textAlign: "center",
      marginBottom: 6,
    },
    metaText: {
      fontSize: 8.5,
      color: "#64748b",
      textAlign: "right",
      marginBottom: 2,
    },
    twoCol: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 14,
      gap: 12,
    },
    card: {
      flex: 1,
      backgroundColor: "#f8fafc",
      borderRadius: 6,
      padding: 9,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    cardTitle: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "#059669",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 5,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingBottom: 2,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 3,
    },
    infoLabel: { fontSize: 8, color: "#64748b" },
    infoVal: { fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#1e293b" },
    table: {
      marginTop: 6,
      marginBottom: 14,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#059669",
      paddingVertical: 6,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontFamily: "Helvetica-Bold",
      fontSize: 8.5,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
      paddingVertical: 6,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    colDesc: { flex: 4 },
    colTotal: { flex: 1.5, textAlign: "right" },
    totalSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 2,
      marginBottom: 14,
    },
    totalBox: {
      width: 260,
      backgroundColor: "#f8fafc",
      borderRadius: 6,
      padding: 10,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    grandTotalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1.5,
      borderTopColor: "#059669",
      paddingTop: 5,
      marginTop: 4,
    },
    dueCard: {
      backgroundColor: isRefund ? "#ecfdf5" : "#fef2f2",
      borderWidth: 1.5,
      borderColor: isRefund ? "#a7f3d0" : "#fecaca",
      borderRadius: 6,
      padding: 8,
      marginTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{tenantName}</Text>
            <Text style={{ fontSize: 8.5, color: "#64748b" }}>Final Actual Invoice (Tax Invoice & Reconciliation)</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
              Tour Reference ID: {tourId}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docBadge}>ACTUAL INVOICE</Text>
            <Text style={styles.metaText}>Invoice #: {invoiceNumber}</Text>
            {proformaInvoiceNumber && (
              <Text style={styles.metaText}>Proforma Ref: {proformaInvoiceNumber}</Text>
            )}
            <Text style={styles.metaText}>Completion Date: {issueDate}</Text>
            <Text style={[styles.metaText, { fontFamily: "Helvetica-Bold", color: settlementStatus === "settled" ? "#059669" : "#dc2626" }]}>
              Settlement: {settlementStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* 2-Column Info */}
        <View style={styles.twoCol}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Guest Profile</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoVal}>{customerName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoVal}>{customerEmail}</Text>
            </View>
            {customerPhone && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoVal}>{customerPhone}</Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Party Size:</Text>
              <Text style={styles.infoVal}>{numberOfTravelers} Travelers</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tour Summary</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tour Package:</Text>
              <Text style={styles.infoVal}>{packageName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Date:</Text>
              <Text style={styles.infoVal}>{preferredStartDate}</Text>
            </View>
            {duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Duration:</Text>
                <Text style={styles.infoVal}>{duration}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Reconciliation Ledger Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Reconciled Service Ledger</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Amount ({currency})</Text>
          </View>

          {/* Proforma Base Cost */}
          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <View style={styles.colDesc}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5 }}>
                Proforma Invoice Base Package Cost
              </Text>
              <Text style={{ fontSize: 7.5, color: "#64748b" }}>
                Includes locked hotels, assigned vehicle, driver allowances, and standard tickets.
              </Text>
            </View>
            <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold", fontSize: 8.5 }]}>
              {proformaBaseTotal.toFixed(2)}
            </Text>
          </View>

          {/* In-Tour Approved Additions */}
          {inTourAdditions && inTourAdditions.length > 0 ? (
            inTourAdditions.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  { backgroundColor: idx % 2 === 0 ? "#f8fafc" : "#ffffff" },
                ]}
              >
                <View style={styles.colDesc}>
                  <Text style={{ fontSize: 8.5, color: "#1e293b" }}>
                    + [In-Tour Extra] {item.description}
                  </Text>
                  <Text style={{ fontSize: 7.5, color: "#059669" }}>
                    Category: {item.category} • Verified with receipt
                  </Text>
                </View>
                <Text style={[styles.colTotal, { fontSize: 8.5, color: "#059669" }]}>
                  + {item.amount.toFixed(2)}
                </Text>
              </View>
            ))
          ) : null}

          {/* Deductions if any */}
          {deductionsTotal > 0 && (
            <View style={[styles.tableRow, { backgroundColor: "#fef2f2" }]}>
              <View style={styles.colDesc}>
                <Text style={{ fontSize: 8.5, color: "#dc2626" }}>
                  - [Deductions] Unused Services / Early Checkout Credits
                </Text>
              </View>
              <Text style={[styles.colTotal, { fontSize: 8.5, color: "#dc2626", fontFamily: "Helvetica-Bold" }]}>
                - {deductionsTotal.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Final Financial Summary */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.infoLabel}>Proforma Base:</Text>
              <Text style={styles.infoVal}>{currency} {proformaBaseTotal.toFixed(2)}</Text>
            </View>
            {additionsTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.infoLabel}>Total Mid-Tour Additions:</Text>
                <Text style={[styles.infoVal, { color: "#059669" }]}>
                  + {currency} {additionsTotal.toFixed(2)}
                </Text>
              </View>
            )}
            {deductionsTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.infoLabel}>Total Deductions:</Text>
                <Text style={[styles.infoVal, { color: "#dc2626" }]}>
                  - {currency} {deductionsTotal.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9.5, color: "#1e293b" }}>
                Net Actual Tour Cost:
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10.5, color: "#1e293b" }}>
                {currency} {netFinalTotal.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.totalRow, { marginTop: 4 }]}>
              <Text style={{ fontSize: 8, color: "#059669" }}>Less: Advance Deposit Paid:</Text>
              <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#059669" }}>
                - {currency} {advancePaid.toFixed(2)}
              </Text>
            </View>

            {/* Net Balance or Refund Card */}
            <View style={styles.dueCard}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: isRefund ? "#065f46" : "#991b1b" }}>
                {isRefund ? "Refund Due to Guest:" : "Final Balance Payable:"}
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, color: isRefund ? "#065f46" : "#991b1b" }}>
                {currency} {isRefund ? refundDue.toFixed(2) : balanceDue.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {notes && (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.cardTitle}>Settlement & Reconciliation Notes</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 7.5, color: "#94a3b8" }}>
            {tenantName} Accounting • Actual Invoice #{invoiceNumber}
          </Text>
          <Text style={{ fontSize: 7.5, color: "#94a3b8" }}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
