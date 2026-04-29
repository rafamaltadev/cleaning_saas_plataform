import { Invoice } from './invoice.entity';

export class InvoiceResponseDto {
  id: string;
  tenant_id: string;
  booking_id: string;
  client_id: string;
  total_cents: number;
  currency: string;
  invoice_number: string;
  issued_at: Date;
  due_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;

  static from(invoice: Invoice): InvoiceResponseDto {
    const dto = new InvoiceResponseDto();
    dto.id = invoice.id;
    dto.tenant_id = invoice.tenant_id;
    dto.booking_id = invoice.booking_id;
    dto.client_id = invoice.client_id;
    dto.total_cents = invoice.total_cents;
    dto.currency = invoice.currency;
    dto.invoice_number = invoice.invoice_number;
    dto.issued_at = invoice.issued_at;
    dto.due_date = invoice.due_date;
    dto.status = invoice.status;
    dto.created_at = invoice.created_at;
    dto.updated_at = invoice.updated_at;
    return dto;
  }
}
