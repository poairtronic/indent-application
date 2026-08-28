
  /**
   * GET /analytics/vendors/process-allocations
   * Vendor Process Allocations Analytics.
   */
  @Get('vendors/process-allocations')
  @Permissions('analytics.view')
  async getVendorProcessAllocations(@Query() query: VendorAnalyticsQueryDto) {
    return this.analyticsService.getVendorProcessAllocations(query.limit ?? 100);
  }
