import { Currency } from 'prisma/generated/enums';

export interface TransferAdapter {
  process(data: TransaferProcessingData): Promise<PaymentResponse>;
}

export interface TransaferProcessingData {
  amount: number;
  phone: string;
  currency: Currency;
  transactionId: string;
}

export interface PaymentResponse {
  message: string;
  provider_ref: string;
}
