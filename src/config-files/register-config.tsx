import * as Yup from 'yup';

export const signupInitialValues = { username: '', password: '', confirmPassword: '' };

export const SignupValidation = Yup.object().shape({
  username: Yup.string().required('Username is required.'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters.')
    .required('Password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});