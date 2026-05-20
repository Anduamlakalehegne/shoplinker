import * as Yup from 'yup';

/**
 * POST /api/payment/initialize — JSON body (server-validated; never trust the client).
 */
export const paymentInitializeBodySchema = Yup.object({
  orderId: Yup.string().uuid('Invalid order id').required('Order ID is required'),
  amount: Yup.number().typeError('Amount must be a number').positive().min(0.01).required('Amount is required'),
  phone: Yup.string().min(1, 'Phone is required').max(32).required('Phone is required'),
  email: Yup.string().email('Invalid email address').optional(),
  firstName: Yup.string().max(120).optional(),
  lastName: Yup.string().max(120).optional(),
});

/**
 * POST /api/payment/verify — JSON body.
 */
export const paymentVerifyBodySchema = Yup.object({
  ourOrderId: Yup.string().uuid('Invalid order id').required('Order ID is required'),
});

/**
 * StarPay webhook JSON payload.
 */
export const starpayWebhookPayloadSchema = Yup.object({
  billRefNo: Yup.string().min(1).required(),
  status: Yup.string().min(1).required(),
  message: Yup.string().optional(),
});

export type PaymentInitializeBody = Yup.InferType<typeof paymentInitializeBodySchema>;
export type PaymentVerifyBody = Yup.InferType<typeof paymentVerifyBodySchema>;
export type StarPayWebhookPayload = Yup.InferType<typeof starpayWebhookPayloadSchema>;
