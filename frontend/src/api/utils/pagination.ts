import type { PaginationParams } from '../types/query-params';
import { PAGINATION_DEFAULTS } from '../constants';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function calculateTotalPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

export function buildPaginationMeta(total: number, params: PaginationParams): PaginationMeta {
  const page = Math.max(1, params.page ?? PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, params.limit ?? PAGINATION_DEFAULTS.LIMIT),
  );
  return {
    total,
    page,
    limit,
    totalPages: calculateTotalPages(total, limit),
  };
}

export function hasNextPage(currentPage: number, totalPages: number): boolean {
  return currentPage < totalPages;
}

export function hasPreviousPage(currentPage: number): boolean {
  return currentPage > 1;
}

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount: number = 1,
): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 3;
  if (totalPages <= totalNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);
  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftItemCount = totalNumbers - 1;
    return [...Array.from({ length: leftItemCount }, (_, i) => i + 1), 'ellipsis', totalPages];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightItemCount = totalNumbers - 1;
    return [
      1,
      'ellipsis',
      ...Array.from({ length: rightItemCount }, (_, i) => totalPages - rightItemCount + i + 1),
    ];
  }

  return [
    1,
    'ellipsis',
    ...Array.from({ length: siblingCount * 2 + 1 }, (_, i) => leftSiblingIndex + i),
    'ellipsis',
    totalPages,
  ];
}
