// MSG91 OTP sender
// Docs: https://docs.msg91.com/reference/send-otp

const MSG91_API_KEY = process.env.MSG91_API_KEY as string;
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID as string;

function generateOTP(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTP(phone: string): Promise<string> {
	const otp = generateOTP();

	// In development, skip actual SMS and log to console
	if (process.env.NODE_ENV === "development") {
		console.log(`[DEV OTP] Phone: ${phone} | OTP: ${otp}`);
		return otp;
	}
	/*
  if (!MSG91_API_KEY || !MSG91_TEMPLATE_ID) {
    throw new Error('MSG91 credentials not configured')
  }

  const response = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: MSG91_API_KEY,
    },
    body: JSON.stringify({
      template_id: MSG91_TEMPLATE_ID,
      mobile: `91${phone}`, // India prefix
      otp,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`MSG91 error: ${err}`)
  }
  */
	return otp;
}
