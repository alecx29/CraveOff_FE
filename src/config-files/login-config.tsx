import * as Yup from 'yup';

export const loginIitialValues = { username: '', password: '' };

export const LoginValidation = Yup.object().shape({
  username: Yup.string().email('Email invalid').required('Email-ul este obligatoriu'),
  password: Yup.string().required('Parola este obligatorie'),
});