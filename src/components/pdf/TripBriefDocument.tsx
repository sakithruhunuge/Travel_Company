import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { RoutePlan } from "@/lib/distanceMatrix";

interface TripBriefDocumentProps {
  bookingId: string;
  generatedDate: string;
  tenantName: string;
  primaryColor?: string;
  secondaryColor?: string;
  recipientName: string;
  recipientRole: "Tour Guide" | "Car Driver";
  customerName: string;
  customerEmail: string;
  numberOfTravelers: number;
  packageName: string;
  preferredStartDate: string;
  destinations?: string;
  duration?: string;
  hotelTier?: string;
  transportMode?: string;
  excursions?: string;
  addOns?: string;
  specialRequests?: string;
  agencyNotes?: string;
  totalPrice?: number;
  routePlan?: RoutePlan;
}

export default function TripBriefDocument({
  bookingId,
  generatedDate,
  tenantName,
  primaryColor = "#0B7C8A",
  secondaryColor = "#041A16",
  recipientName,
  recipientRole,
  customerName,
  customerEmail,
  numberOfTravelers,
  packageName,
  preferredStartDate,
  destinations,
  duration,
  hotelTier,
  transportMode,
  excursions,
  addOns,
  specialRequests,
  agencyNotes,
  totalPrice,
  routePlan,
}: TripBriefDocumentProps) {
  const isDriver = recipientRole === "Car Driver";

  const styles = StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 54,
      paddingHorizontal: 36,
      fontFamily: "Helvetica",
      fontSize: 9,
      color: "#334155",
      backgroundColor: "#ffffff",
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 3,
      borderBottomColor: primaryColor,
      paddingBottom: 14,
      marginBottom: 16,
    },
    agencyName: {
      fontSize: 19,
      fontWeight: "bold",
      color: secondaryColor,
    },
    agencyTagline: {
      fontSize: 8,
      color: "#64748b",
      marginTop: 2,
    },
    docTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: primaryColor,
      textAlign: "right",
    },
    docSubtitle: {
      fontSize: 9,
      color: "#475569",
      marginTop: 3,
      textAlign: "right",
    },
    docDate: {
      fontSize: 8,
      color: "#94a3b8",
      marginTop: 2,
      textAlign: "right",
    },
    assigneeBanner: {
      backgroundColor: primaryColor,
      borderRadius: 6,
      padding: 12,
      marginBottom: 14,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    assigneeLabel: {
      fontSize: 8,
      color: "rgba(255,255,255,0.75)",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    assigneeName: {
      fontSize: 14,
      fontWeight: "bold",
      color: "#ffffff",
      marginTop: 2,
    },
    assigneeRole: {
      fontSize: 10,
      fontWeight: "bold",
      color: "#ffffff",
      backgroundColor: "rgba(0,0,0,0.25)",
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderRadius: 14,
    },
    sectionContainer: {
      marginBottom: 12,
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 6,
      overflow: "hidden",
    },
    sectionHeader: {
      backgroundColor: "#f8fafc",
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: "#e2e8f0",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: "bold",
      color: secondaryColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    sectionBadge: {
      fontSize: 7.5,
      fontWeight: "bold",
      color: primaryColor,
      backgroundColor: "#e0f2fe",
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 4,
    },
    sectionBody: {
      padding: 10,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3.5,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },
    rowLast: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 3.5,
    },
    label: {
      fontSize: 8.5,
      color: "#64748b",
      width: "38%",
    },
    value: {
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#0f172a",
      width: "60%",
      textAlign: "right",
    },

    // Route & Distance Specific Styles
    routeSummaryGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 6,
    },
    routeMetricCard: {
      flex: 1,
      backgroundColor: "#f8fafc",
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderRadius: 5,
      padding: 7,
      alignItems: "center",
    },
    routeMetricCardHighlight: {
      flex: 1.2,
      backgroundColor: "#ecfdf5",
      borderWidth: 1,
      borderColor: "#86efac",
      borderRadius: 5,
      padding: 7,
      alignItems: "center",
    },
    routeMetricValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#0f172a",
    },
    routeMetricValueHighlight: {
      fontSize: 13,
      fontWeight: "bold",
      color: "#047857",
    },
    routeMetricLabel: {
      fontSize: 7,
      color: "#64748b",
      textTransform: "uppercase",
      marginTop: 2,
      letterSpacing: 0.4,
    },
    placesHeading: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#475569",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginTop: 2,
    },
    placesFlowContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      backgroundColor: "#f1f5f9",
      padding: 8,
      borderRadius: 6,
      marginBottom: 10,
    },
    placeBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#ffffff",
      borderWidth: 1,
      borderColor: "#cbd5e1",
      borderRadius: 4,
      paddingVertical: 3,
      paddingHorizontal: 6,
      marginVertical: 2,
      marginRight: 4,
    },
    placeBadgeNumber: {
      fontSize: 7.5,
      fontWeight: "bold",
      color: "#ffffff",
      backgroundColor: primaryColor,
      borderRadius: 3,
      paddingHorizontal: 4,
      paddingVertical: 1,
      marginRight: 4,
    },
    placeBadgeText: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#1e293b",
    },
    placeArrow: {
      fontSize: 8,
      color: "#94a3b8",
      marginRight: 4,
    },

    // Distance Breakdown Table
    table: {
      borderWidth: 1,
      borderColor: "#e2e8f0",
      borderRadius: 4,
      overflow: "hidden",
      marginBottom: 8,
    },
    tableHeaderRow: {
      flexDirection: "row",
      backgroundColor: secondaryColor,
      paddingVertical: 5,
      paddingHorizontal: 8,
    },
    tableHeaderCell: {
      color: "#ffffff",
      fontSize: 7.5,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    tableRowEven: {
      flexDirection: "row",
      backgroundColor: "#ffffff",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },
    tableRowOdd: {
      flexDirection: "row",
      backgroundColor: "#f8fafc",
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: "#f1f5f9",
    },
    tableRowTotal: {
      flexDirection: "row",
      backgroundColor: "#f0fdf4",
      paddingVertical: 5,
      paddingHorizontal: 8,
      borderTopWidth: 1.5,
      borderTopColor: "#86efac",
    },
    colStep: {
      width: "10%",
    },
    colFrom: {
      width: "28%",
    },
    colTo: {
      width: "28%",
    },
    colDistance: {
      width: "17%",
      textAlign: "right",
    },
    colTime: {
      width: "17%",
      textAlign: "right",
    },
    tableCellText: {
      fontSize: 8,
      color: "#334155",
    },
    tableCellBold: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#0f172a",
    },
    tableCellHighlight: {
      fontSize: 8.5,
      fontWeight: "bold",
      color: "#047857",
    },

    // Driver Directives Box
    driverDirectivesBox: {
      backgroundColor: "#eff6ff",
      borderWidth: 1,
      borderColor: "#bfdbfe",
      borderRadius: 5,
      padding: 8,
      marginTop: 4,
    },
    driverDirectivesTitle: {
      fontSize: 8,
      fontWeight: "bold",
      color: "#1e40af",
      marginBottom: 3,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    driverDirectivesItem: {
      fontSize: 7.5,
      color: "#1e3a8a",
      lineHeight: 1.4,
      marginBottom: 1.5,
    },

    // Notes
    notesBlock: {
      padding: 8,
      backgroundColor: "#fffbeb",
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "#fcd34d",
    },
    notesText: {
      fontSize: 8,
      color: "#78350f",
      lineHeight: 1.4,
    },
    agencyNotesBlock: {
      padding: 8,
      backgroundColor: "#f0fdf4",
      borderRadius: 5,
      borderWidth: 1,
      borderColor: "#86efac",
    },
    agencyNotesText: {
      fontSize: 8,
      color: "#14532d",
      lineHeight: 1.4,
    },
    totalBadge: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: secondaryColor,
      borderRadius: 6,
      padding: 10,
      marginBottom: 12,
    },
    totalLabel: {
      fontSize: 9,
      color: "rgba(255,255,255,0.8)",
    },
    totalValue: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#ffffff",
    },
    footer: {
      position: "absolute",
      bottom: 24,
      left: 36,
      right: 36,
      textAlign: "center",
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      paddingTop: 8,
    },
    footerText: {
      fontSize: 7.5,
      color: "#94a3b8",
    },
    footerAgency: {
      fontSize: 8,
      fontWeight: "bold",
      color: primaryColor,
      marginTop: 1,
    },
    confidentialBadge: {
      fontSize: 6.5,
      color: "#94a3b8",
      marginTop: 2,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.agencyName}>{tenantName}</Text>
            <Text style={styles.agencyTagline}>Premium Customizable Tours & Operations</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>
              {isDriver ? "DRIVER DISPATCH BRIEF" : "TRIP BRIEF"}
            </Text>
            <Text style={styles.docSubtitle}>Booking Ref: #{bookingId.slice(-8).toUpperCase()}</Text>
            <Text style={styles.docDate}>Generated: {generatedDate}</Text>
          </View>
        </View>

        {/* Assignee Banner */}
        <View style={styles.assigneeBanner}>
          <View>
            <Text style={styles.assigneeLabel}>Assigned Assignee</Text>
            <Text style={styles.assigneeName}>{recipientName}</Text>
          </View>
          <Text style={styles.assigneeRole}>{recipientRole}</Text>
        </View>

        {/* Customer Information */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Customer Information</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Text style={styles.label}>Customer Name:</Text>
              <Text style={styles.value}>{customerName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Contact Email:</Text>
              <Text style={styles.value}>{customerEmail}</Text>
            </View>
            <View style={styles.rowLast}>
              <Text style={styles.label}>Number of Travelers:</Text>
              <Text style={styles.value}>{numberOfTravelers} guest{numberOfTravelers !== 1 ? "s" : ""}</Text>
            </View>
          </View>
        </View>

        {/* Trip Details */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
          </View>
          <View style={styles.sectionBody}>
            <View style={styles.row}>
              <Text style={styles.label}>Tour Package:</Text>
              <Text style={styles.value}>{packageName}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Departure Date:</Text>
              <Text style={styles.value}>{preferredStartDate}</Text>
            </View>
            {duration ? (
              <View style={styles.row}>
                <Text style={styles.label}>Duration:</Text>
                <Text style={styles.value}>{duration}</Text>
              </View>
            ) : null}
            {destinations ? (
              <View style={styles.row}>
                <Text style={styles.label}>Destinations:</Text>
                <Text style={styles.value}>{destinations}</Text>
              </View>
            ) : null}
            {hotelTier ? (
              <View style={styles.row}>
                <Text style={styles.label}>Hotel Tier:</Text>
                <Text style={styles.value}>{hotelTier}</Text>
              </View>
            ) : null}
            {transportMode ? (
              <View style={styles.rowLast}>
                <Text style={styles.label}>Transport Mode:</Text>
                <Text style={styles.value}>{transportMode}</Text>
              </View>
            ) : null}
            {excursions ? (
              <View style={styles.row}>
                <Text style={styles.label}>Excursions:</Text>
                <Text style={styles.value}>{excursions}</Text>
              </View>
            ) : null}
            {addOns ? (
              <View style={styles.rowLast}>
                <Text style={styles.label}>Add-ons:</Text>
                <Text style={styles.value}>{addOns}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* ASSIGNED ROUTE & PREDICTED DISTANCES (PLACES TO GO) */}
        {routePlan && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isDriver
                  ? "🚗 Places to Go & Predicted Road Distances"
                  : "🗺️ Tour Itinerary Route & Predicted Distances"}
              </Text>
              <Text style={styles.sectionBadge}>
                {routePlan.totalDistanceKm > 0 ? `${routePlan.totalDistanceKm} km Total` : "Local Dispatch"}
              </Text>
            </View>

            <View style={styles.sectionBody}>
              {/* Route Summary Metrics */}
              <View style={styles.routeSummaryGrid}>
                <View style={styles.routeMetricCardHighlight}>
                  <Text style={styles.routeMetricValueHighlight}>
                    {routePlan.totalDistanceKm > 0 ? `${routePlan.totalDistanceKm} km` : "Custom"}
                  </Text>
                  <Text style={styles.routeMetricLabel}>Predicted Distance</Text>
                </View>
                <View style={styles.routeMetricCard}>
                  <Text style={styles.routeMetricValue}>
                    {routePlan.totalDriveTimeFormatted || "N/A"}
                  </Text>
                  <Text style={styles.routeMetricLabel}>Est. Driving Time</Text>
                </View>
                <View style={styles.routeMetricCard}>
                  <Text style={styles.routeMetricValue}>
                    {routePlan.destinationStops.length}
                  </Text>
                  <Text style={styles.routeMetricLabel}>Places to Visit</Text>
                </View>
                <View style={styles.routeMetricCard}>
                  <Text style={styles.routeMetricValue}>
                    {routePlan.segments.length}
                  </Text>
                  <Text style={styles.routeMetricLabel}>Driving Legs</Text>
                </View>
              </View>

              {/* Places They Have to Go (Ordered List) */}
              <Text style={styles.placesHeading}>
                📍 Places The Driver Must Visit (Ordered Stops):
              </Text>
              <View style={styles.placesFlowContainer}>
                {routePlan.destinationStops.map((stop, index) => (
                  <React.Fragment key={index}>
                    <View style={styles.placeBadge}>
                      <Text style={styles.placeBadgeNumber}>{index + 1}</Text>
                      <Text style={styles.placeBadgeText}>{stop}</Text>
                    </View>
                    {index < routePlan.destinationStops.length - 1 && (
                      <Text style={styles.placeArrow}>➔</Text>
                    )}
                  </React.Fragment>
                ))}
              </View>

              {/* Leg-by-Leg Road Distance Breakdown Table */}
              {routePlan.segments.length > 0 && (
                <View style={styles.table}>
                  <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, styles.colStep]}>Leg</Text>
                    <Text style={[styles.tableHeaderCell, styles.colFrom]}>Departure From</Text>
                    <Text style={[styles.tableHeaderCell, styles.colTo]}>Destination (To Go)</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDistance]}>Distance</Text>
                    <Text style={[styles.tableHeaderCell, styles.colTime]}>Est. Drive</Text>
                  </View>

                  {routePlan.segments.map((seg, idx) => {
                    const rowStyle = idx % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd;
                    return (
                      <View key={idx} style={rowStyle}>
                        <Text style={[styles.tableCellBold, styles.colStep]}>#{seg.step}</Text>
                        <Text style={[styles.tableCellText, styles.colFrom]}>{seg.from}</Text>
                        <Text style={[styles.tableCellBold, styles.colTo]}>{seg.to}</Text>
                        <Text style={[styles.tableCellBold, styles.colDistance]}>
                          {seg.distanceKm} km
                        </Text>
                        <Text style={[styles.tableCellText, styles.colTime]}>
                          ~{seg.driveTimeFormatted}
                        </Text>
                      </View>
                    );
                  })}

                  {/* Table Total Row */}
                  <View style={styles.tableRowTotal}>
                    <Text style={[styles.tableCellHighlight, styles.colStep]}>TOTAL</Text>
                    <Text style={[styles.tableCellHighlight, styles.colFrom]}>Full Route</Text>
                    <Text style={[styles.tableCellHighlight, styles.colTo]}>
                      {routePlan.destinationStops.length} Destinations
                    </Text>
                    <Text style={[styles.tableCellHighlight, styles.colDistance]}>
                      {routePlan.totalDistanceKm} km
                    </Text>
                    <Text style={[styles.tableCellHighlight, styles.colTime]}>
                      ~{routePlan.totalDriveTimeFormatted}
                    </Text>
                  </View>
                </View>
              )}

              {/* Driver Directives Box */}
              {isDriver && (
                <View style={styles.driverDirectivesBox}>
                  <Text style={styles.driverDirectivesTitle}>
                    ⚠️ Important Directives for Car Driver
                  </Text>
                  <Text style={styles.driverDirectivesItem}>
                    • Punctuality: Be present at the initial pickup location 20 minutes prior to scheduled departure.
                  </Text>
                  <Text style={styles.driverDirectivesItem}>
                    • Vehicle Preparedness: Inspect fuel, tire pressure, AC, and emergency kit before departure.
                  </Text>
                  <Text style={styles.driverDirectivesItem}>
                    • Road Conditions: Strictly follow speed limits; exercise extra caution on winding hill country roads.
                  </Text>
                  <Text style={styles.driverDirectivesItem}>
                    • Navigation: Follow the destination sequence above and coordinate comfort stops with the guests.
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Special Requirements */}
        {specialRequests && specialRequests.trim().length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Customer Special Requirements</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.notesBlock}>
                <Text style={styles.notesText}>{specialRequests.trim()}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Agency Notes */}
        {agencyNotes && agencyNotes.trim().length > 0 ? (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Agency Notes & Instructions</Text>
            </View>
            <View style={styles.sectionBody}>
              <View style={styles.agencyNotesBlock}>
                <Text style={styles.agencyNotesText}>{agencyNotes.trim()}</Text>
              </View>
            </View>
          </View>
        ) : null}

        {/* Total Price Badge */}
        {totalPrice !== undefined && totalPrice > 0 ? (
          <View style={styles.totalBadge}>
            <Text style={styles.totalLabel}>Booking Total Value</Text>
            <Text style={styles.totalValue}>${totalPrice.toLocaleString()} USD</Text>
          </View>
        ) : null}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            This trip brief was generated by {tenantName} for internal operations & dispatch coordination.
          </Text>
          <Text style={styles.footerAgency}>{tenantName} — Official Operations Document</Text>
          <Text style={styles.confidentialBadge}>Confidential — Do not share with customers</Text>
        </View>

      </Page>
    </Document>
  );
}
