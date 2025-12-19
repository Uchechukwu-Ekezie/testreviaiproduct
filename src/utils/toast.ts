import { toast, ToastOptions, Slide } from 'react-toastify';

// Default toast configuration
const defaultOptions: ToastOptions = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "dark",
  transition: Slide,
};

// Success toast with custom styling
export const showSuccessToast = (message: string, options?: ToastOptions) => {
  return toast.success(message, {
    ...defaultOptions,
    ...options,
  });
};

// Error toast with custom styling
export const showErrorToast = (message: string, options?: ToastOptions) => {
  return toast.error(message, {
    ...defaultOptions,
    ...options,
  });
};

// Info toast
export const showInfoToast = (message: string, options?: ToastOptions) => {
  return toast.info(message, {
    ...defaultOptions,
    ...options,
  });
};

// Warning toast
export const showWarningToast = (message: string, options?: ToastOptions) => {
  return toast.warn(message, {
    ...defaultOptions,
    ...options,
  });
};

// Custom toast for specific app actions
export const showApiErrorToast = (error: any) => {
  const message = error?.message || error?.detail || 'An unexpected error occurred';
  return showErrorToast(message);
};

export const showApiSuccessToast = (message: string) => {
  return showSuccessToast(message);
};

// Loading toast
export const showLoadingToast = (message: string) => {
  return toast.loading(message, {
    ...defaultOptions,
    autoClose: false,
  });
};

// Update loading toast
export const updateLoadingToast = (toastId: any, message: string, type: 'success' | 'error' = 'success') => {
  const updateOptions = {
    ...defaultOptions,
    autoClose: 3000,
  };

  if (type === 'success') {
    toast.update(toastId, {
      render: message,
      type: 'success',
      isLoading: false,
      ...updateOptions,
    });
  } else {
    toast.update(toastId, {
      render: message,
      type: 'error',
      isLoading: false,
      ...updateOptions,
    });
  }
};