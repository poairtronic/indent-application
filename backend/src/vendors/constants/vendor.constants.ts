import { VendorStatus } from '@prisma/client';

export const VENDOR_STATUSES = Object.values(VendorStatus);

export const VENDOR_CODE_MAX_LENGTH = 50;
export const VENDOR_NAME_MAX_LENGTH = 150;
export const VENDOR_EMAIL_MAX_LENGTH = 150;
export const VENDOR_PHONE_MAX_LENGTH = 20;
export const VENDOR_GST_MAX_LENGTH = 15;
export const VENDOR_PAN_MAX_LENGTH = 10;
export const VENDOR_CITY_MAX_LENGTH = 100;
export const VENDOR_STATE_MAX_LENGTH = 100;
export const VENDOR_COUNTRY_MAX_LENGTH = 100;
export const VENDOR_PINCODE_MAX_LENGTH = 10;

export const GST_NUMBER_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]\d[Z][0-9A-Z]$/;
export const PAN_NUMBER_PATTERN = /^[A-Z]{5}\d{4}[A-Z]$/;
export const PINCODE_PATTERN = /^[0-9A-Za-z-]+$/;
