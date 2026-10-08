import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface ProformaInvoiceProps {
  invoiceNumber: string;
  tourId: string;
  issueDate: string;
  dueDate: string;
  tenantName: string;
  primaryColor?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  numberOfTravelers: number;
  packageName: string;
  preferredStartDate: string;
  duration?: string;
  hotelTier?: string;
  assignedDriverName?: string;
  assignedGuideName?: string;
  assignedVehiclePlate?: string;
  hotelCharges: number;
  vehicleCharges: number;
  driverGuideCharges: number;
  excursionCharges: number;
  forexBufferPercent?: number;
  subtotal: number;
  totalAmount: number;
  advanceDepositDue: number;
  advancePaid: number;
  currency?: string;
  paymentStatus?: string;
}

export default function ProformaInvoiceDocument({
  invoiceNumber,
  tourId,
  issueDate,
  dueDate,
  tenantName,
  primaryColor = "#0B7C8A",
  customerName,
  customerEmail,
  customerPhone,
  numberOfTravelers,
  packageName,
  preferredStartDate,
  duration,
  hotelTier,
  assignedDriverName,
  assignedGuideName,
  assignedVehiclePlate,
  hotelCharges,
  vehicleCharges,
  driverGuideCharges,
  excursionCharges,
  forexBufferPercent = 2.5,
  subtotal,
  totalAmount,
  advanceDepositDue,
  advancePaid,
  currency = "USD",
  paymentStatus = "UNPAID",
}: ProformaInvoiceProps) {
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
      borderBottomColor: primaryColor,
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
      backgroundColor: "#d97706",
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
      color: primaryColor,
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
    infoLabel: {
      fontSize: 8,
      color: "#64748b",
    },
    infoVal: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: "#1e293b",
    },
    allocationCard: {
      backgroundColor: "#eff6ff",
      borderWidth: 1,
      borderColor: "#bfdbfe",
      borderRadius: 6,
      padding: 9,
      marginBottom: 14,
    },
    allocationTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8.5,
      color: "#1e40af",
      marginBottom: 4,
    },
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
      backgroundColor: primaryColor,
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
      width: 240,
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
      borderTopColor: primaryColor,
      paddingTop: 5,
      marginTop: 4,
    },
    depositHighlight: {
      backgroundColor: "#ecfdf5",
      borderWidth: 1,
      borderColor: "#a7f3d0",
      borderRadius: 4,
      padding: 6,
      marginTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    noticeBox: {
      backgroundColor: "#fef3c7",
      borderWidth: 1,
      borderColor: "#fde68a",
      borderRadius: 6,
      padding: 8,
      marginBottom: 12,
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
            <Text style={{ fontSize: 8.5, color: "#64748b" }}>Official Proforma Invoice (Advance Bill)</Text>
            <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
              Tour Reference ID: {tourId}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docBadge}>PROFORMA INVOICE</Text>
            <Text style={styles.metaText}>Invoice #: {invoiceNumber}</Text>
            <Text style={styles.metaText}>Issue Date: {issueDate}</Text>
            <Text style={[styles.metaText, { color: "#dc2626", fontFamily: "Helvetica-Bold" }]}>
              Payment Due: {dueDate}
            </Text>
            <Text style={[styles.metaText, { fontFamily: "Helvetica-Bold", color: paymentStatus === "PAID" ? "#059669" : "#b45309" }]}>
              Status: {paymentStatus}
            </Text>
          </View>
        </View>

        {/* 2-Column Info */}
        <View style={styles.twoCol}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Billed To (Guest Details)</Text>
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
              <Text style={styles.infoLabel}>Travelers:</Text>
              <Text style={styles.infoVal}>{numberOfTravelers} Pax</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tour Booking Particulars</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Package:</Text>
              <Text style={styles.infoVal}>{packageName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Start Date:</Text>
              <Text style={styles.infoVal}>{preferredStartDate}</Text>
            </View>
            {duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoVal}>{duration}</Text>
              </View>
            )}
            {hotelTier && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Hotel Tier:</Text>
                <Text style={styles.infoVal}>{hotelTier}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Confirmed Allocation Snapshot */}
        <View style={styles.allocationCard}>
          <Text style={styles.allocationTitle}>Confirmed Operational Allocations:</Text>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={{ fontSize: 8, color: "#1e3a8a" }}>
              • Assigned Driver: {assignedDriverName || "Assigned on Dispatch"}
            </Text>
            <Text style={{ fontSize: 8, color: "#1e3a8a" }}>
              • Tour Guide: {assignedGuideName || "Assigned on Dispatch"}
            </Text>
            <Text style={{ fontSize: 8, color: "#1e3a8a" }}>
              • Vehicle: {assignedVehiclePlate || "Dedicated Chauffeur Car/Van"}
            </Text>
          </View>
        </View>

        {/* Cost Breakdown Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Service Component / Locked Contract</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Amount ({currency})</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.colDesc, { fontSize: 8.5 }]}>
              Dedicated Private Vehicle & Chauffeur Transit (Fuel, Tolls & Mileage)
            </Text>
            <Text style={[styles.colTotal, { fontSize: 8.5 }]}>{vehicleCharges.toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: "#f8fafc" }]}>
            <Text style={[styles.colDesc, { fontSize: 8.5 }]}>
              Confirmed Partner Hotel Accommodations & Meal Boards
            </Text>
            <Text style={[styles.colTotal, { fontSize: 8.5 }]}>{hotelCharges.toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
            <Text style={[styles.colDesc, { fontSize: 8.5 }]}>
              Licensed Tour Guide & Chauffeur Services / Daily Allowances
            </Text>
            <Text style={[styles.colTotal, { fontSize: 8.5 }]}>{driverGuideCharges.toFixed(2)}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: "#f8fafc" }]}>
            <Text style={[styles.colDesc, { fontSize: 8.5 }]}>
              Pre-booked Excursion Entry Permits, Park Tickets & Cultural Passes
            </Text>
            <Text style={[styles.colTotal, { fontSize: 8.5 }]}>{excursionCharges.toFixed(2)}</Text>
          </View>
          {forexBufferPercent > 0 && (
            <View style={[styles.tableRow, { backgroundColor: "#ffffff" }]}>
              <Text style={[styles.colDesc, { fontSize: 8, color: "#64748b" }]}>
                Foreign Exchange Volatility Buffer ({forexBufferPercent}% risk hedge)
              </Text>
              <Text style={[styles.colTotal, { fontSize: 8, color: "#64748b" }]}>Included in total</Text>
            </View>
          )}
        </View>

        {/* Financial Summary */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.infoLabel}>Estimated Subtotal:</Text>
              <Text style={styles.infoVal}>{currency} {subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 10, color: primaryColor }}>
                Total Proforma Amount:
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11, color: primaryColor }}>
                {currency} {totalAmount.toFixed(2)}
              </Text>
            </View>
            <View style={styles.depositHighlight}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#065f46" }}>
                Advance Deposit Required (30%):
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 9, color: "#065f46" }}>
                {currency} {advanceDepositDue.toFixed(2)}
              </Text>
            </View>
            {advancePaid > 0 && (
              <View style={[styles.totalRow, { marginTop: 4 }]}>
                <Text style={{ fontSize: 8, color: "#059669" }}>Advance Paid to Date:</Text>
                <Text style={{ fontSize: 8.5, fontFamily: "Helvetica-Bold", color: "#059669" }}>
                  - {currency} {advancePaid.toFixed(2)}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notice */}
        <View style={styles.noticeBox}>
          <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#92400e", marginBottom: 2 }}>
            Proforma Notice & Settlement Terms:
          </Text>
          <Text style={{ fontSize: 7.5, color: "#78350f", lineHeight: 1.3 }}>
            This Proforma Invoice represents the closest binding estimation to actual tour costs. Payment of the advance deposit guarantees vehicle and hotel reservations. Any mid-tour additions or reductions will be reconciled upon tour wrap-up on the final Actual Invoice.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ fontSize: 7.5, color: "#94a3b8" }}>
            {tenantName} ERP • Proforma Document #{invoiceNumber}
          </Text>
          <Text style={{ fontSize: 7.5, color: "#94a3b8" }}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
