import * as Yup from 'yup';

export const checkoutSchema = Yup.object({
  full_name: Yup.string().min(2, 'Name is required').required('Full name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string()
    .matches(/^09\d{8}$/, 'Phone must be a valid Ethiopian number (e.g. 0912345678)')
    .required('Phone number is required'),
  delivery_address: Yup.string()
    .min(10, 'Please provide a more detailed address')
    .required('Delivery address is required'),
  city: Yup.string().required('City is required'),
  notes: Yup.string().optional(),
});

export type CheckoutFormValues = Yup.InferType<typeof checkoutSchema>;
