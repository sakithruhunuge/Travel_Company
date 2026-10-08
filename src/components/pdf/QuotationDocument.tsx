import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export interface QuotationLineItemProps {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface QuotationDocumentProps {
  quotationNumber: string;
  tourId?: string;
  generatedDate: string;
  validUntilDate: string;
  tenantName: string;
  primaryColor?: string;
  secondaryColor?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  numberOfTravelers: number;
  packageName: string;
  preferredStartDate: string;
  duration?: string;
  destinations?: string;
  hotelTier?: string;
  transportMode?: string;
  lineItems: QuotationLineItemProps[];
  subtotal: number;
  markupPercent?: number;
  totalPrice: number;
  currency?: string;
  notes?: string;
  marketingOfficerName?: string;
}

export default function QuotationDocument({
  quotationNumber,
  tourId,
  generatedDate,
  validUntilDate,
  tenantName,
  primaryColor = "#0B7C8A",
  secondaryColor = "#041A16",
  customerName,
  customerEmail,
  customerPhone,
  numberOfTravelers,
  packageName,
  preferredStartDate,
  duration,
  destinations,
  hotelTier,
  transportMode,
  lineItems,
  subtotal,
  totalPrice,
  currency = "USD",
  notes,
  marketingOfficerName,
}: QuotationDocumentProps) {
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
      marginBottom: 18,
    },
    companyName: {
      fontSize: 18,
      fontFamily: "Helvetica-Bold",
      color: primaryColor,
      marginBottom: 3,
    },
    docBadge: {
      backgroundColor: primaryColor,
      color: "#ffffff",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      fontFamily: "Helvetica-Bold",
      fontSize: 10,
      textAlign: "center",
      marginBottom: 6,
    },
    quoteMeta: {
      fontSize: 8.5,
      color: "#64748b",
      textAlign: "right",
      marginBottom: 2,
    },
    twoCol: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
      gap: 12,
    },
    card: {
      flex: 1,
      backgroundColor: "#f8fafc",
      borderRadius: 6,
      padding: 10,
      borderWidth: 1,
      borderColor: "#e2e8f0",
    },
    cardTitle: {
      fontSize: 8.5,
      fontFamily: "Helvetica-Bold",
      color: primaryColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      paddingBottom: 3,
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
    table: {
      marginTop: 8,
      marginBottom: 16,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: primaryColor,
      paddingVertical: 7,
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
    colQty: { flex: 1, textAlign: "center" },
    colRate: { flex: 1.5, textAlign: "right" },
    colTotal: { flex: 1.5, textAlign: "right" },
    totalSection: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 4,
      marginBottom: 16,
    },
    totalBox: {
      width: 220,
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
      paddingTop: 6,
      marginTop: 4,
    },
    grandTotalLabel: {
      fontFamily: "Helvetica-Bold",
      fontSize: 11,
      color: primaryColor,
    },
    grandTotalValue: {
      fontFamily: "Helvetica-Bold",
      fontSize: 12,
      color: primaryColor,
    },
    termsBox: {
      backgroundColor: "#fffbeb",
      borderWidth: 1,
      borderColor: "#fde68a",
      borderRadius: 6,
      padding: 9,
      marginBottom: 14,
    },
    termsTitle: {
      fontFamily: "Helvetica-Bold",
      fontSize: 8.5,
      color: "#92400e",
      marginBottom: 3,
    },
    termsText: {
      fontSize: 7.5,
      color: "#78350f",
      lineHeight: 1.35,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      paddingTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerText: {
      fontSize: 7.5,
      color: "#94a3b8",
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.companyName}>{tenantName}</Text>
            <Text style={{ fontSize: 8.5, color: "#64748b" }}>Tour Quotation & Package Proposal</Text>
            {marketingOfficerName && (
              <Text style={{ fontSize: 8, color: "#64748b", marginTop: 2 }}>
                Prepared by: {marketingOfficerName} (Marketing Officer)
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.docBadge}>FORMAL QUOTATION</Text>
            <Text style={styles.quoteMeta}>Ref: {quotationNumber}</Text>
            {tourId && <Text style={styles.quoteMeta}>Tour ID: {tourId}</Text>}
            <Text style={styles.quoteMeta}>Date: {generatedDate}</Text>
            <Text style={[styles.quoteMeta, { color: "#b45309", fontFamily: "Helvetica-Bold" }]}>
              Valid Until: {validUntilDate}
            </Text>
          </View>
        </View>

        {/* Client & Tour Details Cards */}
        <View style={styles.twoCol}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Guest & Contact Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Guest Name:</Text>
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
              <Text style={styles.infoLabel}>Number of Travelers:</Text>
              <Text style={styles.infoVal}>{numberOfTravelers} Pax</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tour Specifications</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Package Name:</Text>
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
                <Text style={styles.infoLabel}>Accommodation:</Text>
                <Text style={styles.infoVal}>{hotelTier}</Text>
              </View>
            )}
            {transportMode && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Transport:</Text>
                <Text style={styles.infoVal}>{transportMode}</Text>
              </View>
            )}
          </View>
        </View>

        {destinations && (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.cardTitle}>Planned Destinations & Route</Text>
            <Text style={{ fontSize: 8.5, color: "#1e293b" }}>{destinations}</Text>
          </View>
        )}

        {/* Itemized Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description / Service Item</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate ({currency})</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Amount ({currency})</Text>
          </View>
          {lineItems && lineItems.length > 0 ? (
            lineItems.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  { backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" },
                ]}
              >
                <View style={styles.colDesc}>
                  <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 8.5 }}>{item.title}</Text>
                  {item.description && (
                    <Text style={{ fontSize: 7.5, color: "#64748b", marginTop: 1 }}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <Text style={[styles.colQty, { fontSize: 8.5 }]}>{item.quantity}</Text>
                <Text style={[styles.colRate, { fontSize: 8.5 }]}>
                  {item.unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.colTotal, { fontFamily: "Helvetica-Bold", fontSize: 8.5 }]}>
                  {item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={[styles.colDesc, { fontSize: 8.5 }]}>Standard Comprehensive Tour Package</Text>
              <Text style={styles.colQty}>1</Text>
              <Text style={styles.colRate}>{totalPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{totalPrice.toFixed(2)}</Text>
            </View>
          )}
        </View>

        {/* Financial Summary Totals */}
        <View style={styles.totalSection}>
          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.infoLabel}>Estimated Subtotal:</Text>
              <Text style={styles.infoVal}>
                {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Quotation:</Text>
              <Text style={styles.grandTotalValue}>
                {currency} {totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms & Notes */}
        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Quotation Terms & Confirmation Notice:</Text>
          <Text style={styles.termsText}>
            • This quotation provides an estimated cost based on current seasonal rates and vehicle availability.{"\n"}
            • Upon confirmation, specific hotels, assigned drivers, and excursion tickets will be locked, and a formal Proforma Invoice will be issued.{"\n"}
            • Prices are subject to foreign currency fluctuation adjustments if confirmed after the validity period.{"\n"}
            • To confirm your tour, please notify our marketing officer or click your personalized confirmation link.
          </Text>
        </View>

        {notes && (
          <View style={[styles.card, { marginBottom: 12 }]}>
            <Text style={styles.cardTitle}>Special Agency Notes</Text>
            <Text style={{ fontSize: 8, color: "#475569" }}>{notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Generated by {tenantName} Reservation System • Document Ref: {quotationNumber}
          </Text>
          <Text style={styles.footerText}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}
