import { ProcessStatus } from '@prisma/client';

export const PROCESS_STATUSES = Object.values(ProcessStatus);

export const PROCESS_NAME_MAX_LENGTH = 150;
export const PROCESS_DESCRIPTION_MAX_LENGTH = 5000;
