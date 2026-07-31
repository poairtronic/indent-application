import { ProcessStatus } from '@prisma/client';

export const PROCESS_STATUSES = Object.values(ProcessStatus);

export const PROCESS_CODE_MAX_LENGTH = 50;
export const PROCESS_NAME_MAX_LENGTH = 150;
export const PROCESS_DESCRIPTION_MAX_LENGTH = 5000;
export const PROCESS_SEQUENCE_MIN = 1;
export const PROCESS_ESTIMATED_HOURS_MAX = 999999.99;
export const PROCESS_ESTIMATED_HOURS_DECIMALS = 2;
