import { IsString, IsNotEmpty, IsOptional, IsIn } from 'class-validator';

export class RecordCheckInDto {
  @IsString()
  @IsNotEmpty()
  memberIdentifier: string; // Member ID, memberCode (e.g. GR-1001), or phone number

  @IsOptional()
  @IsString()
  qrSecret?: string; // Secret from the scanned gym QR code to verify physical location

  @IsOptional()
  @IsString()
  qrPayload?: string; // Raw scanned QR code payload JSON

  @IsOptional()
  @IsString()
  qrCredential?: string; // Opaque individual member QR credential

  @IsOptional()
  @IsString()
  idempotencyKey?: string; // Client idempotency token to prevent concurrent duplicate scans

  @IsOptional()
  @IsIn(['QR_SCAN', 'MANUAL_STAFF', 'KIOSK'])
  method?: 'QR_SCAN' | 'MANUAL_STAFF' | 'KIOSK';

  @IsOptional()
  @IsString()
  notes?: string;
}

