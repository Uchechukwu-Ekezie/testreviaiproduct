import axios from "axios";

/**
 * Extracts clean error messages from server responses
 * Handles various error response formats and returns user-friendly messages
 * 
 * @param error - The error object (usually from axios)
 * @returns Clean error message string
 */
export function extractErrorMessage(error: unknown, fallbackMessage: string = "An unexpected error occurred. Please try again."): string {
  // Default fallback message
  let errorMessage = fallbackMessage;

  if (axios.isAxiosError(error)) {
    // Handle network errors
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return "Network connection failed. Please check your internet connection and try again.";
    }
    
    // Handle tunnel connection failures
    if (error.message.includes('ERR_TUNNEL_CONNECTION_FAILED')) {
      return "Connection to server failed. Please check your network settings and try again.";
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return "Request timed out. Please try again.";
    }
    
    // Handle server response errors
    if (error.response?.data) {
    const responseData = error.response.data;
    
    // Check for direct field errors first (like otp field)
    if (responseData.otp && Array.isArray(responseData.otp)) {
      errorMessage = responseData.otp.join(", ");
    } else if (responseData.detail) {
      if (typeof responseData.detail === "string") {
        errorMessage = responseData.detail;
      } else if (typeof responseData.detail === "object" && responseData.detail !== null) {
        // Extract string from array if it's an object with arrays
        const detailObj = responseData.detail as Record<string, unknown>;
        const fieldErrors: string[] = [];
        
        for (const [field, messages] of Object.entries(detailObj)) {
          if (Array.isArray(messages)) {
            fieldErrors.push(...messages.map(msg => String(msg)));
          } else if (typeof messages === "string") {
            fieldErrors.push(messages);
          }
        }
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(", ");
        } else {
          errorMessage = JSON.stringify(responseData.detail);
        }
      } else {
        errorMessage = JSON.stringify(responseData.detail);
      }
    } else if (responseData.message) {
      // Clean up the message by removing field prefixes like "otp:", "detail:", etc.
      errorMessage = responseData.message.replace(/^(otp|email|password|username|verification_code|non_field_errors|detail|error|message):\s*/i, "").trim();
    } else if (responseData.error) {
      errorMessage = responseData.error;
    } else {
      errorMessage = JSON.stringify(responseData);
    }
    }
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  return errorMessage;
}

/**
 * Handles errors and shows toast notifications
 * 
 * @param error - The error object
 * @param toast - Toast function from useToast hook
 * @param options - Optional configuration
 */
export function handleErrorWithToast(
  error: unknown,
  toast: (options: { title: string; description: string; variant?: "destructive" }) => void,
  options?: {
    title?: string;
    fallbackMessage?: string;
  }
) {
  const errorMessage = extractErrorMessage(error);
  const title = options?.title || "Error";
  const fallbackMessage = options?.fallbackMessage || "An unexpected error occurred. Please try again.";
  
  toast({
    title,
    description: errorMessage || fallbackMessage,
    variant: "destructive",
  });
}

/**
 * Handles errors and returns both the error message and whether to show resend option
 * Useful for forms that need special handling (like OTP expiration)
 * 
 * @param error - The error object
 * @param options - Optional configuration
 * @returns Object with errorMessage and shouldShowResend
 */
export function handleFormError(
  error: unknown,
  options?: {
    fallbackMessage?: string;
    resendKeywords?: string[];
  }
) {
  const errorMessage = extractErrorMessage(error);
  const fallbackMessage = options?.fallbackMessage || "An unexpected error occurred. Please try again.";
  const resendKeywords = options?.resendKeywords || ["expired", "invalid", "not found"];
  
  const shouldShowResend = resendKeywords.some(keyword => 
    errorMessage.toLowerCase().includes(keyword)
  );

  return {
    errorMessage: errorMessage || fallbackMessage,
    shouldShowResend
  };
}
