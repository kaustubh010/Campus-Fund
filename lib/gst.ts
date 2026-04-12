export type GstVerificationResult = {
  valid: boolean;
  reason?: string;
};

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

export function isValidGstFormat(gstNumber: string) {
  return GST_REGEX.test(gstNumber.trim().toUpperCase());
}

export async function verifyGstNumber(gstNumber: string): Promise<GstVerificationResult> {
  const normalized = gstNumber.trim().toUpperCase();

  if (!isValidGstFormat(normalized)) {
    return { valid: false, reason: "Invalid GSTIN format" };
  }

  // TODO: Integrate with GST government sandbox or third-party verification API.
  // For hackathon demo we accept format-valid GSTINs as verified.
  return { valid: true };
}

export function extractGstNumberFromText(text: string) {
  const match = text.toUpperCase().match(/[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}/);
  return match?.[0] ?? null;
}
