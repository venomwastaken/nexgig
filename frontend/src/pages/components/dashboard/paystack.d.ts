export interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  ref: string;
  access_code?: string;
  currency?: string;
  onClose?: () => void;
  callback?: (transaction: { reference: string }) => void;
}

export interface PaystackHandler {
  openIframe: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackHandler;
    };
  }
}
