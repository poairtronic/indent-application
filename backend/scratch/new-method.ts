
  /**
   * Retrieves vendor process cost allocations by parsing IndentItem remarks.
   * Required to satisfy the requirement without modifying the Phase 1-8C schemas.
   */
  public async getVendorProcessAllocations(limit = 100): Promise<IVendorProcessAllocation[]> {
    this.logger.log('Computing vendor process allocations (in-memory aggregation)');

    // 1. Fetch ProcessCosts joined with CostSheet (for indentId) and ManufacturingProcess
    const processCosts = await this.prisma.processCost.findMany({
      where: { isDeleted: false },
      include: {
        costSheet: {
          select: { indentId: true },
        },
        process: {
          select: { processName: true },
        },
      },
    });

    if (!processCosts.length) return [];

    // Map: indentId -> ProcessCost[]
    const indentCostsMap = new Map<string, typeof processCosts>();
    for (const pc of processCosts) {
      if (!pc.costSheet?.indentId) continue;
      const arr = indentCostsMap.get(pc.costSheet.indentId) || [];
      arr.push(pc);
      indentCostsMap.set(pc.costSheet.indentId, arr);
    }

    const indentIds = Array.from(indentCostsMap.keys());

    // 2. Fetch IndentItems for these indents
    const indentItems = await this.prisma.indentItem.findMany({
      where: {
        indentId: { in: indentIds },
        isDeleted: false,
        remarks: { not: null },
      },
      include: {
        indentProcesses: {
          where: { isDeleted: false },
          orderBy: { sequence: 'asc' },
        },
      },
    });

    // Aggregation Map: (VendorName_ProcessName) -> IVendorProcessAllocation
    const aggMap = new Map<string, IVendorProcessAllocation>();

    // 3. Process items and parse remarks
    for (const item of indentItems) {
      if (!item.remarks) continue;
      
      let parsedRemarks: any = {};
      try {
        parsedRemarks = JSON.parse(item.remarks as string);
      } catch (e) {
        continue; // Skip if invalid JSON
      }

      const processSources = parsedRemarks.processSources || [];
      const processProductionSources = parsedRemarks.processProductionSources || [];

      // Match each indent process by sequence index
      for (let i = 0; i < item.indentProcesses.length; i++) {
        const proc = item.indentProcesses[i];
        
        // Find the vendor string
        const prodSource = processProductionSources[i] || '';
        const dsgnSource = processSources[i] || '';
        const sourceStr = prodSource || dsgnSource;

        if (!sourceStr || !sourceStr.toLowerCase().startsWith('vendor')) continue;

        const vendorName = sourceStr.replace(/^Vendor:\s*/i, '').trim();
        if (!vendorName) continue;

        // Find the corresponding ProcessCost for this processId in this indent
        const indentCosts = indentCostsMap.get(item.indentId) || [];
        const processCost = indentCosts.find((pc) => pc.processId === proc.processId);

        if (!processCost) continue;

        const processName = processCost.process.processName;
        const key = `${vendorName}_${processName}`;

        const existing = aggMap.get(key) || {
          vendorName,
          processName,
          indentsCount: 0,
          totalPredictedCost: 0,
          totalActualCost: 0,
          variance: 0,
        };

        // We increment indentsCount if this is the first time we see this vendor for this process in this indent?
        // Actually, we just increment it. But ProcessCost aggregates for the whole indent.
        // So we should only add the ProcessCost ONCE per indent to avoid duplicating if there are multiple items!
        
        existing.indentsCount += 1;
        
        // IMPORTANT: ProcessCost is per-indent, not per-item. If we aggregate it per item, we might double-count.
        // Let's defer adding the costs and just collect unique ProcessCosts per vendor+process.
      }
    }

    // A better approach to avoid double counting ProcessCosts:
    // Map: (VendorName_ProcessName) -> Set of ProcessCost IDs
    const vendorProcessMap = new Map<string, { vendorName: string; processName: string; costIds: Set<string>; predicted: number; actual: number }>();
    
    for (const item of indentItems) {
      if (!item.remarks) continue;
      let parsedRemarks: any;
      try {
        parsedRemarks = JSON.parse(item.remarks as string);
      } catch (e) { continue; }

      const processSources = parsedRemarks.processSources || [];
      const processProductionSources = parsedRemarks.processProductionSources || [];

      for (let i = 0; i < item.indentProcesses.length; i++) {
        const proc = item.indentProcesses[i];
        const sourceStr = processProductionSources[i] || processSources[i] || '';
        
        if (!sourceStr || !sourceStr.toLowerCase().startsWith('vendor')) continue;
        
        const vendorName = sourceStr.replace(/^Vendor:\s*/i, '').trim();
        if (!vendorName) continue;

        const indentCosts = indentCostsMap.get(item.indentId) || [];
        const processCost = indentCosts.find((pc) => pc.processId === proc.processId);
        
        if (!processCost) continue;

        const processName = processCost.process.processName;
        const key = `${vendorName}_${processName}`;
        
        if (!vendorProcessMap.has(key)) {
          vendorProcessMap.set(key, { vendorName, processName, costIds: new Set(), predicted: 0, actual: 0 });
        }
        
        const entry = vendorProcessMap.get(key)!;
        
        if (!entry.costIds.has(processCost.id)) {
           entry.costIds.add(processCost.id);
           entry.predicted += Number(processCost.predictedCost || 0);
           entry.actual += Number(processCost.actualCost || 0);
        }
      }
    }

    const results: IVendorProcessAllocation[] = Array.from(vendorProcessMap.values()).map(entry => {
      const variance = entry.actual - entry.predicted;
      return {
        vendorName: entry.vendorName,
        processName: entry.processName,
        indentsCount: entry.costIds.size,
        totalPredictedCost: entry.predicted,
        totalActualCost: entry.actual,
        variance: variance,
      };
    });

    return results.sort((a, b) => b.totalPredictedCost - a.totalPredictedCost).slice(0, limit);
  }
}
