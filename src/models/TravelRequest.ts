import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssignedPerson {
  name: string;
  email: string;
  phone?: string;
}

export interface IAssignedVehicle {
  category: string;
  plateNumber: string;
  model: string;
  capacity: number;
}

export interface IQuotationLineItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface IQuotationData {
  quotationNumber: string;
  issueDate: Date;
  validUntil: Date;
  lineItems: IQuotationLineItem[];
  subtotal: number;
  markupPercent: number;
  totalAmount: number;
  currency: string;
  notes?: string;
  status: "draft" | "sent" | "accepted" | "declined" | "expired";
}

export interface IProformaData {
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  hotelCharges: number;
  vehicleCharges: number;
  driverGuideCharges: number;
  excursionCharges: number;
  exchangeRate: number;
  forexBufferPercent: number; // e.g. 2.5%
  subtotal: number;
  totalAmount: number;
  advanceDepositDue: number; // e.g. 30%
  advancePaid: number;
  status: "issued" | "partially_paid" | "paid" | "overdue";
}

export interface IActualInvoiceData {
  invoiceNumber: string;
  issueDate: Date;
  proformaBaseTotal: number;
  additionsTotal: number;
  deductionsTotal: number;
  netFinalTotal: number;
  advancePaid: number;
  balanceDue: number;
  refundDue: number;
  settlementStatus: "unsettled" | "settled" | "refunded";
  notes?: string;
}

export interface IInTourExpense {
  _id?: string;
  reportedBy: "driver" | "tour_guide" | "guest" | "marketing_officer";
  reporterName: string;
  category: "ticket" | "extra_mileage" | "hotel_upgrade" | "meals" | "other";
  description: string;
  amount: number;
  currency: string;
  receiptUrl?: string;
  guestApproved: boolean;
  createdAt: Date;
}

export interface ITravelRequest extends Document {
  tenantId?: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  tourId?: string; // TRV-YYYYMM-XXXX
  packageId?: string;
  packageName: string;
  numberOfTravelers: number;
  preferredStartDate: Date;
  specialRequests?: string;
  pricingInputs?: Record<string, any>;
  submittedTotal?: number;
  aiItineraryMarkdown?: string;
  aiVibeQuery?: string;
  source?: "manual" | "ai-suggested" | "marketing_officer" | "travel_agent";
  status:
    | "pending"
    | "quoted"
    | "confirmed"
    | "allocated"
    | "proforma_issued"
    | "active_tour"
    | "reconciling"
    | "completed"
    | "approved"
    | "rejected"
    | "cancelled";
  tourGuide?: IAssignedPerson;
  driver?: IAssignedPerson;
  assignedVehicle?: IAssignedVehicle;
  agencyNotes?: string;
  quotation?: IQuotationData;
  proforma?: IProformaData;
  actualInvoice?: IActualInvoiceData;
  inTourExpenses?: IInTourExpense[];
  agentId?: mongoose.Types.ObjectId;
  agentCommissionPercent?: number;
  marketingOfficerId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AssignedPersonSchema = {
  name: { type: String },
  email: { type: String },
  phone: { type: String },
};

const AssignedVehicleSchema = {
  category: { type: String },
  plateNumber: { type: String },
  model: { type: String },
  capacity: { type: Number },
};

const QuotationLineItemSchema = {
  title: { type: String, required: true },
  description: { type: String },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
};

const QuotationSchema = {
  quotationNumber: { type: String },
  issueDate: { type: Date, default: Date.now },
  validUntil: { type: Date },
  lineItems: [QuotationLineItemSchema],
  subtotal: { type: Number, default: 0 },
  markupPercent: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  currency: { type: String, default: "USD" },
  notes: { type: String },
  status: {
    type: String,
    enum: ["draft", "sent", "accepted", "declined", "expired"],
    default: "draft",
  },
};

const ProformaSchema = {
  invoiceNumber: { type: String },
  issueDate: { type: Date, default: Date.now },
  dueDate: { type: Date },
  hotelCharges: { type: Number, default: 0 },
  vehicleCharges: { type: Number, default: 0 },
  driverGuideCharges: { type: Number, default: 0 },
  excursionCharges: { type: Number, default: 0 },
  exchangeRate: { type: Number, default: 1 },
  forexBufferPercent: { type: Number, default: 2.5 },
  subtotal: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  advanceDepositDue: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["issued", "partially_paid", "paid", "overdue"],
    default: "issued",
  },
};

const ActualInvoiceSchema = {
  invoiceNumber: { type: String },
  issueDate: { type: Date, default: Date.now },
  proformaBaseTotal: { type: Number, default: 0 },
  additionsTotal: { type: Number, default: 0 },
  deductionsTotal: { type: Number, default: 0 },
  netFinalTotal: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  refundDue: { type: Number, default: 0 },
  settlementStatus: {
    type: String,
    enum: ["unsettled", "settled", "refunded"],
    default: "unsettled",
  },
  notes: { type: String },
};

const InTourExpenseSchema = {
  reportedBy: {
    type: String,
    enum: ["driver", "tour_guide", "guest", "marketing_officer"],
    default: "driver",
  },
  reporterName: { type: String, required: true },
  category: {
    type: String,
    enum: ["ticket", "extra_mileage", "hotel_upgrade", "meals", "other"],
    default: "ticket",
  },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: "USD" },
  receiptUrl: { type: String },
  guestApproved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
};

const TravelRequestSchema: Schema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: "Tenant", required: false },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tourId: { type: String, index: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    packageId: { type: String },
    packageName: { type: String, required: true },
    numberOfTravelers: { type: Number, required: true, min: 1 },
    preferredStartDate: { type: Date, required: true },
    specialRequests: { type: String, default: "" },
    pricingInputs: { type: Schema.Types.Mixed },
    submittedTotal: { type: Number },
    aiItineraryMarkdown: { type: String },
    aiVibeQuery: { type: String },
    source: {
      type: String,
      enum: ["manual", "ai-suggested", "marketing_officer", "travel_agent"],
      default: "manual",
    },
    status: {
      type: String,
      enum: [
        "pending",
        "quoted",
        "confirmed",
        "allocated",
        "proforma_issued",
        "active_tour",
        "reconciling",
        "completed",
        "approved",
        "rejected",
        "cancelled",
      ],
      default: "pending",
      required: true,
    },
    tourGuide: { type: AssignedPersonSchema, default: undefined },
    driver: { type: AssignedPersonSchema, default: undefined },
    assignedVehicle: { type: AssignedVehicleSchema, default: undefined },
    agencyNotes: { type: String, default: "" },
    quotation: { type: QuotationSchema, default: undefined },
    proforma: { type: ProformaSchema, default: undefined },
    actualInvoice: { type: ActualInvoiceSchema, default: undefined },
    inTourExpenses: [InTourExpenseSchema],
    agentId: { type: Schema.Types.ObjectId, ref: "User" },
    agentCommissionPercent: { type: Number, default: 0 },
    marketingOfficerId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

// Indexes for tenant isolation and queries
TravelRequestSchema.index({ tenantId: 1 });
TravelRequestSchema.index({ tenantId: 1, userId: 1 });
TravelRequestSchema.index({ tenantId: 1, status: 1 });
TravelRequestSchema.index({ tenantId: 1, tourId: 1 });
TravelRequestSchema.index({ tenantId: 1, createdAt: -1 });

const TravelRequest: Model<ITravelRequest> =
  mongoose.models.TravelRequest || mongoose.model<ITravelRequest>("TravelRequest", TravelRequestSchema);

export default TravelRequest;
