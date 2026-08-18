/**
 * Analytics Query DTOs — Phase 15A
 * Defines optional filter parameters accepted by Analytics endpoints.
 * All analytics endpoints are GET (read-only).
 */

import { IsOptional, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Optional date-range filter used by cost and workflow endpoints.
 * Both parameters are optional; if omitted, no date restriction applies.
 */
export class AnalyticsDateRangeDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

/**
 * Query DTO for the cost analytics endpoint.
 * Supports optional date range filtering by cost sheet creation date.
 */
export class CostAnalyticsQueryDto extends AnalyticsDateRangeDto {}

/**
 * Query DTO for product analytics.
 * Allows limiting results to the top-N products by indent count.
 */
export class ProductAnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

/**
 * Query DTO for vendor analytics.
 * Allows limiting results to top-N vendors by cost value.
 */
export class VendorAnalyticsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
