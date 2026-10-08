/**
 * Enterprise SMS Notification Service
 * Supports Twilio API with local mock logging fallback.
 */

interface SendSMSParams {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSParams): Promise<{ success: boolean; messageId?: string; mock?: boolean }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER || "+15005550006";

  if (accountSid && authToken && to) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const params = new URLSearchParams();
      params.append("To", to);
      params.append("From", fromPhone);
      params.append("Body", body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Twilio HTTP error ${response.status}`);
      }

      console.log(`[SMSService] SMS successfully dispatched to ${to}! Twilio SID: ${data.sid}`);
      return { success: true, messageId: data.sid };
    } catch (err) {
      console.warn(`[SMSService] Twilio API failed, logging message locally:`, err);
    }
  }

  // Graceful Fallback for Dev / Missing Twilio Credentials
  console.log("--------------------------------------------------");
  console.log(`📱 [SMSService Mock] Direct SMS to: ${to}`);
  console.log(`Message: ${body}`);
  console.log("--------------------------------------------------");
  return { success: true, messageId: `mock-sms-${Date.now()}`, mock: true };
}

export async function sendDriverDispatchSMS({
  to,
  driverName,
  tourId,
  packageName,
  startDate,
  customerName,
}: {
  to: string;
  driverName: string;
  tourId: string;
  packageName: string;
  startDate: string;
  customerName: string;
}) {
  const body = `Hi ${driverName}, you are assigned to Tour ${tourId} (${packageName}) starting on ${startDate} for guest ${customerName}. Check your driver portal for the full pickup manifest: /driver`;
  return sendSMS({ to, body });
}

export async function sendGuestProformaSMS({
  to,
  guestName,
  tourId,
  depositAmount,
  payUrl,
}: {
  to: string;
  guestName: string;
  tourId: string;
  depositAmount: number;
  payUrl?: string;
}) {
  const body = `Dear ${guestName}, your Proforma Invoice for Tour ${tourId} is ready. Advance deposit due: $${depositAmount.toFixed(2)}. Review & confirm: ${payUrl || "Check your email"}`;
  return sendSMS({ to, body });
}

export async function sendInTourAdditionSMS({
  to,
  guestName,
  tourId,
  description,
  amount,
}: {
  to: string;
  guestName: string;
  tourId: string;
  description: string;
  amount: number;
}) {
  const body = `Tour ${tourId} Update: An extra activity was logged (${description}: +$${amount.toFixed(2)}). This will be reconciled on your final Actual Invoice.`;
  return sendSMS({ to, body });
}
