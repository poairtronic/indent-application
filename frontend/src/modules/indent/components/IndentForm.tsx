import React, { useEffect } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import type { Control, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Combobox } from '../../../components/ui/Combobox';
import { Priority, MaterialShape } from '../../../types/indent';
import { useUnits } from '../../../api/services/units/hooks';
import { useProcesses } from '../../../api/services/processes/hooks';
import { useProducts } from '../../../api/services/products/hooks';
import { useVendors } from '../../../api/services/vendors/hooks';
import type { IndentData } from '../../../api/services/indents/service';
import { useAuthStore } from '../../../store/authStore';
import { getWorkflowAccess } from '../../../constants/workflow';
import { AppPermission } from '../../../constants/permissions';
import { calculateMaterialWeight } from '../../../utils/materialWeight';
import { useMaterials } from '../../../api/services/materials/hooks';

export interface ParsedRemarks {
  product?: string;
  size?: string;
  weight?: string;
  source?: string;
  productionSource?: string;
  userRemarks?: string;
  processSources?: string[];
  processProductionSources?: string[];
}

export function parseItemRemarks(remarks: string | null | undefined): ParsedRemarks {
  if (!remarks)
    return {
      product: '',
      size: '',
      weight: '',
      source: '',
      productionSource: '',
      userRemarks: '',
      processSources: [],
    };
  try {
    const parsed = JSON.parse(remarks);
    if (parsed && typeof parsed === 'object') {
      return {
        product: parsed.product || '',
        size: parsed.size || '',
        weight: parsed.weight || '',
        source: parsed.source || '',
        productionSource: parsed.productionSource || '',
        userRemarks: parsed.userRemarks || '',
        processSources: parsed.processSources || [],
        processProductionSources: parsed.processProductionSources || [],
      };
    }
  } catch {
    // Legacy remarks
  }
  return {
    product: '',
    size: '',
    weight: '',
    source: '',
    productionSource: '',
    userRemarks: remarks,
    processSources: [],
  };
}

export interface ParsedIndentRemarks {
  layoutNumber?: string;
  customerName?: string;
  userRemarks?: string;
  designCost?: number;
  overheadCost?: number;
  contingencyCost?: number;
  actualDesignCost?: number;
  actualOverheadCost?: number;
  actualContingencyCost?: number;
  itemProcessCosts?: Array<Array<{ processId: string; predictedCost: number }>>;
}

export function parseIndentRemarks(remarks: string | null | undefined): ParsedIndentRemarks {
  if (!remarks) return { layoutNumber: '', customerName: '', userRemarks: '' };

  let jsonPart = remarks;

  const firstNewline = remarks.indexOf('\n');
  if (firstNewline !== -1) {
    jsonPart = remarks.substring(0, firstNewline).trim();
  }

  const verificationIndex = jsonPart.indexOf('Stock Verification Results:');
  if (verificationIndex !== -1) {
    jsonPart = jsonPart.substring(0, verificationIndex).trim();
  }

  try {
    const parsed = JSON.parse(jsonPart);
    if (parsed && typeof parsed === 'object') {
      return {
        layoutNumber: parsed.layoutNumber || '',
        customerName: parsed.customerName || '',
        userRemarks: parsed.userRemarks || '',
        designCost: Number(parsed.designCost) || 0,
        overheadCost: Number(parsed.overheadCost) || 0,
        contingencyCost: Number(parsed.contingencyCost) || 0,
        actualDesignCost: Number(parsed.actualDesignCost) || 0,
        actualOverheadCost: Number(parsed.actualOverheadCost) || 0,
        actualContingencyCost: Number(parsed.actualContingencyCost) || 0,
        itemProcessCosts: Array.isArray(parsed.itemProcessCosts) ? parsed.itemProcessCosts : [],
      };
    }
  } catch {
    // Fallback to legacy
  }
  return { layoutNumber: '', customerName: '', userRemarks: remarks };
}

const indentSchema = z.object({
  indent: z.object({
    productName: z.string().optional(),
    departmentName: z.string().optional(),
    priority: z.nativeEnum(Priority),
    requiredDate: z.string().min(1, 'Required date is required'),
    purpose: z.string().trim().min(1, 'PO number is required'), // Labeled as PO Number in UI
    layoutNumber: z.string().trim().min(1, 'Layout number is required'),
    customerName: z.string().trim().min(1, 'Customer name is required'),
    remarks: z.string().optional(),
    items: z
      .array(
        z.object({
          product: z.string().trim().min(1, 'Part Name / Product is required'),
          materialName: z.string().trim().min(1, 'Material is required'),
          shape: z.nativeEnum(MaterialShape).optional(),
          diameterMm: z.coerce.number().optional().or(z.literal('')),
          lengthMm: z.coerce.number().optional().or(z.literal('')),
          widthMm: z.coerce.number().optional().or(z.literal('')),
          heightMm: z.coerce.number().optional().or(z.literal('')),
          quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
          unitId: z.string().uuid('Please select a valid unit'),
          source: z.string().trim().optional(),
          productionSource: z.string().trim().optional(),
          remarks: z.string().trim().optional(),
          processes: z
            .array(
              z.object({
                processId: z.string().uuid('Please select an existing process'),
                predictedCost: z.number().min(0, 'Cost must be >= 0'),
                estimatedHours: z.coerce
                  .number()
                  .min(0, 'Hours must be >= 0')
                  .optional()
                  .or(z.nan()),
                actualCost: z.number().min(0).optional(),
                actualHours: z.number().min(0).optional(),
                vendorType: z.string().optional(),
                productionSource: z.string().optional(),
              }),
            )
            .optional(),
        }),
      )
      .min(1, 'At least one material is required'),
  }),
  broughtMaterials: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Name is required'),
        quantity: z.coerce.number().min(0.0001, 'Quantity is required'),
        specification: z.string().optional(),
        amount: z.coerce.number().optional(),
        actualAmount: z.coerce.number().optional(),
      }),
    )
    .optional(),
  costSheet: z.object({
    predictedTotal: z.number(),
    designCost: z.number().min(0).optional(),
    overheadCost: z.number().min(0).optional(),
    contingencyCost: z.number().min(0).optional(),
    actualDesignCost: z.number().min(0).optional(),
    actualOverheadCost: z.number().min(0).optional(),
    actualContingencyCost: z.number().min(0).optional(),
    actualTotal: z.number().optional(),
    costItems: z.array(
      z.object({
        materialName: z.string(),
        predictedRate: z.number().min(0, 'Rate must be >= 0'),
        predictedQuantity: z.number(),
        predictedAmount: z.number(),
        actualRate: z.number().min(0).optional(),
        actualAmount: z.number().optional(),
      }),
    ),
  }),
});

type IndentFormData = z.infer<typeof indentSchema>;

interface IndentFormProps {
  initialData?: IndentData;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
  forceReadOnly?: boolean;
  isAccountsMode?: boolean;
  isProductionMode?: boolean;
}

const NestedProcessArray: React.FC<{
  control: Control<IndentFormData>;
  register: any;
  setValue: UseFormSetValue<IndentFormData>;
  itemIndex: number;
  errors: any;
  isReadOnly: boolean;
  isAccountsMode?: boolean;
  isProductionMode?: boolean;
  processesList: any[];
  vendorsList: any[];
  itemTotal: { predicted: number; actual: number };
}> = ({
  control,
  register,
  setValue,
  itemIndex,
  errors,
  isReadOnly,
  isAccountsMode,
  isProductionMode,
  processesList,
  vendorsList,
  itemTotal,
}) => {
  const user = useAuthStore((s) => s.user);
  const canViewCostSheet = !!(
    user?.permissions?.includes('costsheet.view') || user?.permissions?.includes('settings.manage')
  );

  const { fields, append, remove } = useFieldArray({
    control,
    name: `indent.items.${itemIndex}.processes`,
  });

  const watchedProcesses =
    useWatch({
      control,
      name: `indent.items.${itemIndex}.processes`,
    }) || [];

  return (
    <div className="mt-4 p-4 bg-surface-base rounded border border-border-default">
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-xs font-bold text-text-secondary uppercase">Manufacturing Processes</h4>
        {!isReadOnly && !isProductionMode && !isAccountsMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                processId: '',
                predictedCost: 0,
                estimatedHours: 0,
                vendorType: 'In-house',
                productionSource: '',
              })
            }
          >
            + Add Process
          </Button>
        )}
      </div>
      {errors?.indent?.items?.[itemIndex]?.processes?.message && (
        <p className="text-xs text-status-error mb-2">
          {errors.indent.items[itemIndex].processes.message}
        </p>
      )}
      {fields.length === 0 && (
        <p className="text-xs text-text-muted italic">No processes added for this item.</p>
      )}
      <div className="space-y-3">
        {fields.map((field, pIndex) => {
          const showActual =
            isAccountsMode ||
            fields.some(
              (f) => (f as any).actualCost !== undefined && (f as any).actualCost !== null,
            );

          let processCol = 'md:col-span-3';
          let sourceCol = 'md:col-span-2';
          let prodSourceCol = 'md:col-span-2';
          let hoursCol = 'md:col-span-1';
          let plannedCol = 'md:col-span-2';
          let actualCol = 'md:col-span-2';
          let remCol = 'md:col-span-2 flex justify-end';

          if (!canViewCostSheet) {
            processCol = 'md:col-span-4';
            sourceCol = 'md:col-span-3';
            prodSourceCol = 'md:col-span-3';
            hoursCol = 'md:col-span-1';
            remCol = 'md:col-span-1 flex justify-end';
          } else if (showActual) {
            processCol = 'md:col-span-2';
            sourceCol = 'md:col-span-2';
            prodSourceCol = 'md:col-span-2';
            hoursCol = 'md:col-span-1';
            plannedCol = 'md:col-span-2';
            actualCol = 'md:col-span-2';
            remCol = 'md:col-span-1 flex justify-end';
          }

          const currentVendorType =
            (watchedProcesses?.[pIndex] as any)?.vendorType || (field as any).vendorType || '';
          const isSourceVendor =
            currentVendorType.startsWith('Vendor') ||
            (currentVendorType !== '' &&
              currentVendorType !== 'In-house' &&
              vendorsList.some(
                (v) =>
                  v.vendorName === currentVendorType || currentVendorType.includes(v.vendorName),
              ));
          const selectedSourceVendor = isSourceVendor
            ? currentVendorType.replace(/^Vendor:\s*/i, '').replace(/^Vendor\s*-\s*/i, '')
            : '';

          const currentProdSource =
            (watchedProcesses?.[pIndex] as any)?.productionSource ||
            (field as any).productionSource ||
            '';
          const isProdVendor =
            currentProdSource.startsWith('Vendor') ||
            (currentProdSource !== '' &&
              currentProdSource !== 'In-house' &&
              vendorsList.some(
                (v) =>
                  v.vendorName === currentProdSource || currentProdSource.includes(v.vendorName),
              ));
          const selectedProdVendor = isProdVendor
            ? currentProdSource.replace(/^Vendor:\s*/i, '').replace(/^Vendor\s*-\s*/i, '')
            : '';

          return (
            <div
              key={field.id}
              className="p-3 bg-surface-base/40 rounded-lg border border-border-default/60 space-y-2.5"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className={processCol}>
                  <Controller
                    control={control}
                    name={`indent.items.${itemIndex}.processes.${pIndex}.processId`}
                    render={({ field: procField }) => {
                      const selectedProcess = processesList.find((p) => p.id === procField.value);
                      const fallbackName =
                        (procField as any).processName || (fields[pIndex] as any).processName;
                      const inputValue = selectedProcess
                        ? selectedProcess.processName
                        : fallbackName || procField.value || '';
                      return (
                        <div className="w-full font-sans">
                          <Input
                            label="Process"
                            placeholder="Type or select process"
                            value={inputValue}
                            list={`processes-datalist-${itemIndex}-${pIndex}`}
                            disabled={isReadOnly || isProductionMode || isAccountsMode}
                            onChange={(e) => {
                              const val = e.target.value;
                              const matched = processesList.find(
                                (p) => p.processName.toLowerCase() === val.toLowerCase(),
                              );
                              procField.onChange(matched ? matched.id : val);
                            }}
                            error={
                              errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.processId
                                ?.message
                                ? 'Please select an existing process from the list'
                                : undefined
                            }
                          />
                          <datalist id={`processes-datalist-${itemIndex}-${pIndex}`}>
                            {processesList.map((p) => (
                              <option key={p.id} value={p.processName} />
                            ))}
                          </datalist>
                        </div>
                      );
                    }}
                  />
                </div>
                <div className={sourceCol}>
                  <Controller
                    control={control}
                    name={`indent.items.${itemIndex}.processes.${pIndex}.vendorType`}
                    render={({ field: vField }) => {
                      const val = vField.value || '';
                      const isV =
                        val.startsWith('Vendor') ||
                        (val !== '' &&
                          val !== 'In-house' &&
                          vendorsList.some(
                            (v) => v.vendorName === val || val.includes(v.vendorName),
                          ));
                      const sType = isV
                        ? 'Vendor'
                        : val === 'In-house'
                          ? 'In-house'
                          : val
                            ? 'In-house'
                            : '';

                      return (
                        <Select
                          label="Source"
                          disabled={isReadOnly || isProductionMode || isAccountsMode}
                          value={sType}
                          onChange={(e) => {
                            const selectedType = e.target.value;
                            if (selectedType === 'In-house') {
                              vField.onChange('In-house');
                            } else if (selectedType === 'Vendor') {
                              const defaultVendor = vendorsList[0]?.vendorName || '';
                              vField.onChange(
                                defaultVendor ? `Vendor: ${defaultVendor}` : 'Vendor',
                              );
                            } else {
                              vField.onChange('');
                            }
                          }}
                          options={[
                            { label: 'Select Source', value: '' },
                            { label: 'In-house', value: 'In-house' },
                            { label: 'Vendor', value: 'Vendor' },
                          ]}
                          error={
                            errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.vendorType
                              ?.message
                          }
                        />
                      );
                    }}
                  />
                </div>
                <div className={prodSourceCol}>
                  <Controller
                    control={control}
                    name={`indent.items.${itemIndex}.processes.${pIndex}.productionSource`}
                    render={({ field: psField }) => {
                      const val = psField.value || '';
                      const isV =
                        val.startsWith('Vendor') ||
                        (val !== '' &&
                          val !== 'In-house' &&
                          vendorsList.some(
                            (v) => v.vendorName === val || val.includes(v.vendorName),
                          ));
                      const psType = isV
                        ? 'Vendor'
                        : val === 'In-house'
                          ? 'In-house'
                          : val
                            ? 'In-house'
                            : '';

                      return (
                        <Select
                          label="Prod. Source"
                          disabled={!isProductionMode}
                          value={psType}
                          onChange={(e) => {
                            const selectedType = e.target.value;
                            if (selectedType === 'In-house') {
                              psField.onChange('In-house');
                            } else if (selectedType === 'Vendor') {
                              const defaultVendor = vendorsList[0]?.vendorName || '';
                              psField.onChange(
                                defaultVendor ? `Vendor: ${defaultVendor}` : 'Vendor',
                              );
                            } else {
                              psField.onChange('');
                            }
                          }}
                          options={[
                            { label: 'Select (Optional)', value: '' },
                            { label: 'In-house', value: 'In-house' },
                            { label: 'Vendor', value: 'Vendor' },
                          ]}
                        />
                      );
                    }}
                  />
                </div>
                <div className={hoursCol}>
                  <Input
                    label="Est. Hours"
                    type="number"
                    step="0.5"
                    disabled={isReadOnly || isProductionMode || isAccountsMode}
                    {...register(`indent.items.${itemIndex}.processes.${pIndex}.estimatedHours`, {
                      valueAsNumber: true,
                    })}
                    error={
                      errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.estimatedHours
                        ?.message
                    }
                  />
                </div>
                {canViewCostSheet && (
                  <div className={plannedCol}>
                    <Input
                      label="Planned Cost (₹)"
                      type="number"
                      step="0.01"
                      disabled={isReadOnly || isProductionMode || isAccountsMode}
                      {...register(`indent.items.${itemIndex}.processes.${pIndex}.predictedCost`, {
                        valueAsNumber: true,
                      })}
                      error={
                        errors.indent?.items?.[itemIndex]?.processes?.[pIndex]?.predictedCost
                          ?.message
                      }
                    />
                  </div>
                )}
                {canViewCostSheet && showActual && (
                  <div className={actualCol}>
                    <Input
                      label="Actual Cost (₹)"
                      type="number"
                      step="0.01"
                      disabled={!isAccountsMode}
                      {...register(`indent.items.${itemIndex}.processes.${pIndex}.actualCost`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                )}
                {!isReadOnly && !isAccountsMode && !isProductionMode && (
                  <div className={remCol}>
                    <Button type="button" variant="danger" size="sm" onClick={() => remove(pIndex)}>
                      Rem
                    </Button>
                  </div>
                )}
              </div>

              {/* Conditional Process Vendor Selector */}
              {isSourceVendor && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-accent-primary/5 p-2 rounded-md border border-accent-primary/20">
                  <div className="md:col-span-2 text-xs font-semibold text-accent-primary">
                    Process Vendor:
                  </div>
                  <div className="md:col-span-6">
                    <Combobox
                      placeholder="Type or select process vendor..."
                      disabled={isReadOnly || isProductionMode || isAccountsMode}
                      value={selectedSourceVendor}
                      onChange={(vName) => {
                        setValue(
                          `indent.items.${itemIndex}.processes.${pIndex}.vendorType`,
                          vName ? `Vendor: ${vName}` : 'Vendor',
                        );
                      }}
                      options={vendorsList.map((v) => ({
                        label: v.vendorCode ? `${v.vendorName} (${v.vendorCode})` : v.vendorName,
                        value: v.vendorName,
                      }))}
                    />
                  </div>
                  <div className="md:col-span-4 text-xs text-text-secondary">
                    {selectedSourceVendor ? (
                      <span>
                        Vendor:{' '}
                        <strong className="text-text-primary">{selectedSourceVendor}</strong>
                      </span>
                    ) : (
                      <span className="italic text-text-muted">Select vendor from list</span>
                    )}
                  </div>
                </div>
              )}

              {/* Conditional Production Vendor Selector */}
              {isProdVendor && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-amber-500/10 p-2 rounded-md border border-amber-500/20">
                  <div className="md:col-span-2 text-xs font-semibold text-amber-500">
                    Prod. Vendor:
                  </div>
                  <div className="md:col-span-6">
                    <Combobox
                      placeholder="Type or select production vendor..."
                      disabled={!isProductionMode}
                      value={selectedProdVendor}
                      onChange={(vName) => {
                        setValue(
                          `indent.items.${itemIndex}.processes.${pIndex}.productionSource`,
                          vName ? `Vendor: ${vName}` : 'Vendor',
                        );
                      }}
                      options={vendorsList.map((v) => ({
                        label: v.vendorCode ? `${v.vendorName} (${v.vendorCode})` : v.vendorName,
                        value: v.vendorName,
                      }))}
                    />
                  </div>
                  <div className="md:col-span-4 text-xs text-text-secondary">
                    {selectedProdVendor ? (
                      <span>
                        Vendor: <strong className="text-text-primary">{selectedProdVendor}</strong>
                      </span>
                    ) : (
                      <span className="italic text-text-muted">Production vendor optional</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {canViewCostSheet && (
        <div className="mt-4 flex justify-end border-t border-border-default pt-3">
          <div className="text-right">
            <p className="text-xs text-text-secondary uppercase">
              Total Cost for this Product (Material + Process)
            </p>
            <p className="text-lg font-bold text-accent-primary">
              ₹
              {(Number(itemTotal?.predicted) || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            {(isAccountsMode || (Number(itemTotal?.actual) || 0) > 0) && (
              <p className="text-sm font-bold text-status-success mt-1">
                Actual: ₹
                {(Number(itemTotal?.actual) || 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const IndentForm: React.FC<IndentFormProps> = ({
  initialData,
  onSubmit,
  isLoading,
  forceReadOnly,
  isAccountsMode: propIsAccountsMode,
  isProductionMode,
}) => {
  const isAccountsMode =
    propIsAccountsMode !== undefined
      ? propIsAccountsMode
      : initialData?.currentState === 'ACCOUNTS_COST_VERIFICATION';

  const user = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canViewCostSheet = !!(
    user?.permissions?.includes('costsheet.view') || user?.permissions?.includes('settings.manage')
  );

  const isReadOnly = React.useMemo(() => {
    if (isProductionMode) return false;
    if (forceReadOnly) return true;
    if (!initialData) {
      const access = getWorkflowAccess('DRAFT', user);
      return !access.canEdit;
    }
    const access = getWorkflowAccess(initialData.currentState as any, user);
    return !access.canEdit;
  }, [initialData, user, forceReadOnly, isProductionMode]);

  const parsedIndentRemarks = parseIndentRemarks(initialData?.remarks);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<IndentFormData>({
    // Accounts edits are a cost-entry DTO, not a design-form submission.
    // Running the full design schema here rejects valid actual-cost updates
    // before the API request is created. Backend DTO validation remains active.
    resolver: isAccountsMode ? undefined : (zodResolver(indentSchema) as never),
    defaultValues: initialData
      ? {
          indent: {
            productName: initialData.productName ?? '',
            departmentName: initialData.departmentName ?? '',
            priority: initialData.priority as Priority,
            requiredDate: initialData.requiredDate.split('T')[0],
            purpose: initialData.purpose || '',
            layoutNumber: initialData.layoutNumber || parsedIndentRemarks.layoutNumber || '',
            customerName: initialData.customerName || parsedIndentRemarks.customerName || '',
            remarks: initialData.customerName
              ? initialData.remarks || ''
              : parsedIndentRemarks.userRemarks || initialData.remarks || '',
            items: (() => {
              const availableProcessCosts = [...(initialData.costSheet?.processCosts || [])];
              return (
                initialData.items?.map((item) => {
                  const parsed = parseItemRemarks(item.remarks);

                  return {
                    product: parsed.product ?? '',
                    materialName: item.material?.materialName ?? '',
                    shape: (item as any).shape ?? undefined,
                    diameterMm: (item as any).diameterMm ?? '',
                    lengthMm: (item as any).lengthMm ?? '',
                    widthMm: (item as any).widthMm ?? '',
                    heightMm: (item as any).heightMm ?? '',
                    quantity: Number(item.quantity),
                    unitId: item.unitId,
                    source: parsed.source ?? '',
                    productionSource: parsed.productionSource ?? '',
                    remarks: parsed.userRemarks ?? '',
                    processes:
                      item.indentProcesses?.map((ip: any, pIdx: number) => {
                        const pId = ip.processId || ip.process?.id;

                        let savedCost = 0;
                        let savedActualCost = ip.actualCost ? Number(ip.actualCost) : undefined;
                        let savedActualHours = ip.actualHours ? Number(ip.actualHours) : undefined;

                        const costIndex = availableProcessCosts.findIndex(
                          (pc) => pc.processId === pId,
                        );
                        if (costIndex !== -1) {
                          const matchedPc = availableProcessCosts[costIndex];
                          savedCost = Number(matchedPc.predictedCost) || 0;
                          if (matchedPc.actualCost !== undefined && matchedPc.actualCost !== null) {
                            savedActualCost = Number(matchedPc.actualCost);
                          }
                          if (
                            matchedPc.actualHours !== undefined &&
                            matchedPc.actualHours !== null
                          ) {
                            savedActualHours = Number(matchedPc.actualHours);
                          }
                          availableProcessCosts.splice(costIndex, 1);
                        }

                        return {
                          processId: pId,
                          processName: ip.process?.processName || '',
                          estimatedHours: Number(ip.estimatedHours || 0),
                          predictedCost: savedCost,
                          actualCost: savedActualCost,
                          actualHours: savedActualHours,
                          vendorType: parsed.processSources?.[pIdx] || '',
                          productionSource: parsed.processProductionSources?.[pIdx] || '',
                        };
                      }) || [],
                  };
                }) || []
              );
            })(),
          },
          broughtMaterials:
            initialData.broughtMaterials?.map((bm) => ({
              name: bm.name,
              quantity: bm.quantity,
              specification: bm.specification || '',
              amount: bm.amount || 0,
              actualAmount: bm.actualAmount || 0,
            })) || [],
          costSheet: {
            predictedTotal: initialData.costSheet?.predictedTotal || 0,
            designCost:
              initialData.costSheet?.designCost !== undefined
                ? Number(initialData.costSheet.designCost)
                : parsedIndentRemarks.designCost || 0,
            overheadCost:
              initialData.costSheet?.overheadCost !== undefined
                ? Number(initialData.costSheet.overheadCost)
                : parsedIndentRemarks.overheadCost || 0,
            contingencyCost:
              initialData.costSheet?.contingencyCost !== undefined
                ? Number(initialData.costSheet.contingencyCost)
                : parsedIndentRemarks.contingencyCost || 0,
            actualDesignCost:
              initialData.costSheet?.actualDesignCost !== undefined &&
              initialData.costSheet?.actualDesignCost !== null
                ? Number(initialData.costSheet.actualDesignCost)
                : parsedIndentRemarks.actualDesignCost || 0,
            actualOverheadCost:
              initialData.costSheet?.actualOverheadCost !== undefined &&
              initialData.costSheet?.actualOverheadCost !== null
                ? Number(initialData.costSheet.actualOverheadCost)
                : parsedIndentRemarks.actualOverheadCost || 0,
            actualContingencyCost:
              initialData.costSheet?.actualContingencyCost !== undefined &&
              initialData.costSheet?.actualContingencyCost !== null
                ? Number(initialData.costSheet.actualContingencyCost)
                : parsedIndentRemarks.actualContingencyCost || 0,
            costItems:
              initialData.costSheet?.costItems?.map((ci) => ({
                materialName: ci.material?.materialName ?? '',
                predictedRate: ci.predictedRate,
                predictedQuantity: ci.predictedQuantity,
                predictedAmount: ci.predictedAmount,
                actualRate: ci.actualRate ?? undefined,
                actualAmount: ci.actualAmount ?? undefined,
              })) || [],
          },
        }
      : {
          indent: {
            priority: Priority.MEDIUM,
            purpose: '',
            layoutNumber: '',
            customerName: '',
            remarks: '',
            requiredDate: new Date().toISOString().split('T')[0],
            items: [
              {
                product: '',
                materialName: '',
                shape: undefined,
                diameterMm: '',
                lengthMm: '',
                widthMm: '',
                heightMm: '',
                quantity: 1,
                unitId: '',
                source: '',
                productionSource: '',
                remarks: '',
                processes: [],
              },
            ],
          },
          costSheet: {
            predictedTotal: 0,
            designCost: 0,
            overheadCost: 0,
            contingencyCost: 0,
            actualDesignCost: 0,
            actualOverheadCost: 0,
            actualContingencyCost: 0,
            costItems: [
              { materialName: '', predictedRate: 0, predictedQuantity: 1, predictedAmount: 0 },
            ],
          },
        },
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({
    control,
    name: 'indent.items',
  });

  const {
    fields: broughtMaterialFields,
    append: appendBroughtMaterial,
    remove: removeBroughtMaterial,
  } = useFieldArray({
    control,
    name: 'broughtMaterials',
  });

  const { data: unitsData } = useUnits({ page: 1, limit: 1000 });
  const { data: processesData } = useProcesses({ page: 1, limit: 1000 });
  const { data: materialsRes } = useMaterials({ page: 1, limit: 1000 });
  const { data: productsRes } = useProducts({ page: 1, limit: 1000 });
  const canViewVendors = hasPermission(AppPermission.VENDORS_VIEW);
  const { data: vendorsRes } = useVendors(
    { page: 1, limit: 1000 },
    !isReadOnly && (canViewVendors || isProductionMode),
  );

  const units = unitsData?.items ?? [];
  const processes = processesData?.items ?? [];
  const materialsList = materialsRes?.items ?? [];
  const productsList = productsRes?.items ?? [];
  const vendorsList = vendorsRes?.items ?? [];

  const watchedItems = useWatch({ control, name: 'indent.items' });
  const watchedBroughtMaterials = useWatch({ control, name: 'broughtMaterials' });
  const watchedCostItems = useWatch({ control, name: 'costSheet.costItems' });
  const watchedDesignCost = useWatch({ control, name: 'costSheet.designCost' });
  const watchedOverheadCost = useWatch({ control, name: 'costSheet.overheadCost' });
  const watchedContingencyCost = useWatch({ control, name: 'costSheet.contingencyCost' });
  const watchedActualDesignCost = useWatch({ control, name: 'costSheet.actualDesignCost' });
  const watchedActualOverheadCost = useWatch({ control, name: 'costSheet.actualOverheadCost' });
  const watchedActualContingencyCost = useWatch({
    control,
    name: 'costSheet.actualContingencyCost',
  });

  // Sync items to costItems when materials are added/removed
  useEffect(() => {
    if (!watchedItems) return;

    const newCostItems = watchedItems.map((item, index) => {
      const existingCostItem = watchedCostItems?.[index];
      const rate = existingCostItem?.predictedRate || 0;
      const qty = item?.quantity || 0;

      const actRate = existingCostItem?.actualRate;

      return {
        materialName: item?.materialName || '',
        predictedRate: rate,
        predictedQuantity: qty,
        // User requested: Design team enters the total directly in Est Rate, so don't multiply predicted Amount by quantity.
        predictedAmount: rate,
        actualRate: actRate,
        actualAmount:
          actRate !== undefined && actRate !== null
            ? actRate * qty
            : existingCostItem?.actualAmount,
      };
    });

    const needsUpdate =
      newCostItems.length !== (watchedCostItems?.length || 0) ||
      newCostItems.some(
        (nci, i) =>
          nci.materialName !== watchedCostItems?.[i]?.materialName ||
          nci.predictedQuantity !== watchedCostItems?.[i]?.predictedQuantity,
      );

    if (needsUpdate) {
      setValue('costSheet.costItems', newCostItems);
    }
  }, [watchedItems, watchedCostItems, setValue]);

  // Derived Totals
  const totalMaterialCost =
    (watchedCostItems || []).reduce((sum, ci) => sum + (Number(ci?.predictedAmount) || 0), 0) +
    (watchedBroughtMaterials || []).reduce((sum, bm) => sum + (Number(bm?.amount) || 0), 0);
  const totalProcessCost = (watchedItems || []).reduce(
    (sum, item) =>
      sum + (item?.processes || []).reduce((pSum, p) => pSum + (Number(p?.predictedCost) || 0), 0),
    0,
  );

  const actualTotalMaterialCost =
    (watchedItems || []).reduce((sum, item, index) => {
      const costItem = watchedCostItems?.[index];
      const actualRate = Number(costItem?.actualRate) || 0;
      const qty = Number(item?.quantity) || 0;
      const actualAmt = actualRate * qty;
      return sum + (Number(actualAmt) || 0);
    }, 0) +
    (watchedBroughtMaterials || []).reduce((sum, bm) => sum + (Number(bm?.actualAmount) || 0), 0);

  const actualTotalProcessCost = (watchedItems || []).reduce((sum, item) => {
    const procActual = (item?.processes || []).reduce(
      (pSum, p) => pSum + (Number(p?.actualCost) || 0),
      0,
    );
    return sum + procActual;
  }, 0);

  const itemTotals = (watchedItems || []).map((item, index) => {
    const matCost = Number(watchedCostItems?.[index]?.predictedAmount) || 0;
    const actualMatRate = Number(watchedCostItems?.[index]?.actualRate) || 0;
    const qty = Number(item?.quantity) || 0;
    const actualMatCost = actualMatRate * qty;

    const procCost = (item?.processes || []).reduce(
      (sum, p) => sum + (Number(p?.predictedCost) || 0),
      0,
    );
    const actualProcCost = (item?.processes || []).reduce(
      (sum, p) => sum + (Number(p?.actualCost) || 0),
      0,
    );
    return {
      predicted: matCost + procCost,
      actual: actualMatCost + actualProcCost,
    };
  });

  const subTotal = totalMaterialCost + totalProcessCost;
  const grandTotal =
    subTotal +
    (Number(watchedDesignCost) || 0) +
    (Number(watchedOverheadCost) || 0) +
    (Number(watchedContingencyCost) || 0);

  const actualSubTotal = actualTotalMaterialCost + actualTotalProcessCost;
  const actualGrandTotal =
    actualSubTotal +
    (Number(watchedActualDesignCost) || 0) +
    (Number(watchedActualOverheadCost) || 0) +
    (Number(watchedActualContingencyCost) || 0);

  useEffect(() => {
    setValue('costSheet.predictedTotal', grandTotal);
    setValue('costSheet.actualTotal', actualGrandTotal);
  }, [grandTotal, actualGrandTotal, setValue]);

  const handleFormSubmit = (data: IndentFormData) => {
    const poNumber = data.indent.purpose || '';
    const { layoutNumber, customerName, ...restIndent } = data.indent;

    // Flatten all processes for the backend CostSheet
    const allProcessCosts: any[] = [];

    const formattedItems = data.indent.items.map((item) => {
      const backendProcesses = item.processes?.map((p, idx) => {
        allProcessCosts.push({
          processId: p.processId,
          estimatedHours: Number.isNaN(p.estimatedHours) ? undefined : p.estimatedHours,
          predictedCost: p.predictedCost,
          actualHours: p.actualHours,
          actualCost: p.actualCost,
        });
        return {
          processId: p.processId,
          sequence: idx + 1,
          estimatedHours: Number.isNaN(p.estimatedHours) ? undefined : p.estimatedHours,
        };
      });

      return {
        materialName: item.materialName,
        quantity: item.quantity,
        unitId: item.unitId,
        shape: item.shape,
        diameterMm: item.diameterMm === '' ? undefined : Number(item.diameterMm),
        lengthMm: item.lengthMm === '' ? undefined : Number(item.lengthMm),
        widthMm: item.widthMm === '' ? undefined : Number(item.widthMm),
        heightMm: item.heightMm === '' ? undefined : Number(item.heightMm),
        remarks: JSON.stringify({
          product: item.product,
          source: item.source,
          productionSource: item.productionSource,
          userRemarks: item.remarks || '',
          processSources: item.processes?.map((p) => p.vendorType || '') || [],
          processProductionSources: item.processes?.map((p) => p.productionSource || '') || [],
        }),
        processes: backendProcesses?.length ? backendProcesses : undefined,
      };
    });

    const formattedData = {
      ...data,
      indent: {
        ...data.indent,
        customerName: customerName || '',
        layoutNumber: layoutNumber || '',
        productName: poNumber ? `PO ${poNumber}` : 'Materials',
        departmentName: user?.department?.departmentName || 'Design',
        remarks: restIndent.remarks || '',
        items: formattedItems,
        broughtMaterials: data.broughtMaterials,
      },
      costSheet: {
        predictedTotal: grandTotal,
        designCost: data.costSheet.designCost || 0,
        overheadCost: data.costSheet.overheadCost || 0,
        contingencyCost: data.costSheet.contingencyCost || 0,
        actualDesignCost:
          data.costSheet.actualDesignCost !== undefined
            ? data.costSheet.actualDesignCost
            : undefined,
        actualOverheadCost:
          data.costSheet.actualOverheadCost !== undefined
            ? data.costSheet.actualOverheadCost
            : undefined,
        actualContingencyCost:
          data.costSheet.actualContingencyCost !== undefined
            ? data.costSheet.actualContingencyCost
            : undefined,
        costItems: data.costSheet.costItems,
        processCosts: allProcessCosts.length
          ? allProcessCosts
          : [
              {
                processId: '00000000-0000-0000-0000-000000000000',
                predictedCost: 0,
                estimatedHours: 0,
              },
            ],
      },
    };

    onSubmit(formattedData);
  };

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit, (formErrors) => {
        if (isAccountsMode) {
          console.error('Actual cost form validation failed', formErrors);
        }
      })}
      className="space-y-6 w-full"
    >
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <h3 className="text-sm font-bold text-text-primary mb-4">Basic Information (Indent)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="PO Number"
            placeholder="e.g. PO 756"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.purpose')}
            error={errors.indent?.purpose?.message}
          />
          <Input
            label="Date"
            type="date"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.requiredDate')}
            error={errors.indent?.requiredDate?.message}
          />
          <Controller
            control={control}
            name="indent.priority"
            render={({ field }) => (
              <Select
                label="Priority"
                options={Object.values(Priority).map((p) => ({ label: p, value: p }))}
                error={errors.indent?.priority?.message}
                disabled={isReadOnly || isProductionMode}
                {...field}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-border-default/50 pt-4">
          <Input
            label="Layout Number"
            placeholder="e.g. L-1234"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.layoutNumber')}
            error={errors.indent?.layoutNumber?.message}
          />
          <Input
            label="Customer Name"
            placeholder="e.g. Boeing"
            disabled={isReadOnly || isProductionMode}
            {...register('indent.customerName')}
            error={errors.indent?.customerName?.message}
          />
          <Input
            label="Remarks / Comments"
            placeholder="Additional requirements..."
            disabled={isReadOnly || isProductionMode}
            {...register('indent.remarks')}
            error={errors.indent?.remarks?.message}
          />
        </div>
      </div>

      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-text-primary">
            Material & Manufacturing Process Requirements
          </h3>
          {!isReadOnly && !isProductionMode && !isAccountsMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendItem({
                  product: '',
                  materialName: '',
                  shape: undefined,
                  diameterMm: '',
                  lengthMm: '',
                  widthMm: '',
                  heightMm: '',
                  quantity: 1,
                  unitId: '',
                  source: 'In-house',
                  productionSource: '',
                  remarks: '',
                  processes: [],
                })
              }
            >
              Add Material
            </Button>
          )}
        </div>

        {errors.indent?.items?.root && (
          <p className="text-xs text-status-error mb-4">{errors.indent.items.root.message}</p>
        )}
        {errors.indent?.items?.message && (
          <p className="text-xs text-status-error mb-4">{(errors.indent.items as any).message}</p>
        )}

        <div className="space-y-4">
          {itemFields.map((field, index) => {
            const currentSource = watchedItems?.[index]?.source || '';
            const isVendor =
              currentSource.startsWith('Vendor') ||
              (currentSource !== '' &&
                currentSource !== 'In-house' &&
                vendorsList.some(
                  (v) => v.vendorName === currentSource || currentSource.includes(v.vendorName),
                ));
            const sourceType = isVendor
              ? 'Vendor'
              : currentSource === 'In-house'
                ? 'In-house'
                : currentSource
                  ? 'In-house'
                  : 'In-house';
            const selectedVendorName = isVendor
              ? currentSource.replace(/^Vendor:\s*/i, '').replace(/^Vendor\s*-\s*/i, '')
              : '';

            return (
              <div
                key={field.id}
                className="border border-border-default rounded-xl p-4 bg-background-primary/80 space-y-4 shadow-sm"
              >
                {/* Row 1: Product, Material, Shape, Source, Remove */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-1 flex items-center gap-1.5 pb-2 text-xs font-bold text-accent-primary">
                    <span className="p-1 px-2 rounded-md bg-accent-primary/10 font-mono">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="md:col-span-3">
                    <Controller
                      control={control}
                      name={`indent.items.${index}.product`}
                      render={({ field: pField }) => (
                        <div className="w-full">
                          <Input
                            label="Part Name / Product"
                            placeholder="Select product or type part"
                            list={`products-list-${index}`}
                            disabled={isReadOnly || isProductionMode || isAccountsMode}
                            {...pField}
                            error={errors.indent?.items?.[index]?.product?.message}
                          />
                          <datalist id={`products-list-${index}`}>
                            {productsList.map((p) => (
                              <option key={p.id} value={p.productName}>
                                {p.productCode
                                  ? `${p.productName} (${p.productCode})`
                                  : p.productName}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      )}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <Controller
                      control={control}
                      name={`indent.items.${index}.materialName`}
                      render={({ field: mField }) => (
                        <div className="w-full">
                          <Input
                            label="Material"
                            placeholder="Select material or type name"
                            list={`materials-list-${index}`}
                            disabled={isReadOnly || isProductionMode || isAccountsMode}
                            {...mField}
                            onChange={(e) => {
                              const val = e.target.value;
                              mField.onChange(val);
                              const matched = materialsList.find(
                                (m) => m.materialName.toLowerCase() === val.trim().toLowerCase(),
                              );
                              if (matched?.unitId) {
                                setValue(`indent.items.${index}.unitId`, matched.unitId);
                              }
                            }}
                            error={errors.indent?.items?.[index]?.materialName?.message}
                          />
                          <datalist id={`materials-list-${index}`}>
                            {materialsList.map((m) => (
                              <option key={m.id} value={m.materialName}>
                                {m.materialCode
                                  ? `${m.materialName} (${m.materialCode})`
                                  : m.materialName}
                              </option>
                            ))}
                          </datalist>
                        </div>
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name={`indent.items.${index}.shape`}
                      render={({ field: sField }) => (
                        <Select
                          label="Shape"
                          disabled={isReadOnly || isProductionMode || isAccountsMode}
                          options={[
                            { label: 'Select Shape', value: '' },
                            { label: 'Rectangle', value: 'RECTANGLE' },
                            { label: 'Square', value: 'SQUARE' },
                            { label: 'Plate', value: 'PLATE' },
                            { label: 'Round', value: 'ROUND' },
                            { label: 'Circle', value: 'CIRCLE' },
                          ]}
                          {...sField}
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Select
                      label="Source"
                      disabled={isReadOnly || isProductionMode || isAccountsMode}
                      value={sourceType}
                      onChange={(e) => {
                        const selectedType = e.target.value;
                        if (selectedType === 'In-house') {
                          setValue(`indent.items.${index}.source`, 'In-house');
                        } else if (selectedType === 'Vendor') {
                          const defaultVendor = vendorsList[0]?.vendorName || '';
                          setValue(
                            `indent.items.${index}.source`,
                            defaultVendor ? `Vendor: ${defaultVendor}` : 'Vendor',
                          );
                        } else {
                          setValue(`indent.items.${index}.source`, '');
                        }
                      }}
                      options={[
                        { label: 'In-house', value: 'In-house' },
                        { label: 'Vendor', value: 'Vendor' },
                      ]}
                      error={errors.indent?.items?.[index]?.source?.message}
                    />
                  </div>
                  {!isReadOnly && !isProductionMode && !isAccountsMode && (
                    <div className="md:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        Rem
                      </Button>
                    </div>
                  )}
                </div>

                {/* Conditional Inline Vendor Selector when Source === Vendor */}
                {sourceType === 'Vendor' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-surface-base/80 p-3 rounded-lg border border-accent-primary/20">
                    <div className="md:col-span-1 text-center font-bold text-[11px] text-accent-primary uppercase tracking-wider">
                      Vendor
                    </div>
                    <div className="md:col-span-6">
                      <Combobox
                        label="Select Vendor (Created in Admin Portal)"
                        placeholder="Type or select vendor from master..."
                        disabled={isReadOnly || isProductionMode || isAccountsMode}
                        value={selectedVendorName}
                        onChange={(vName) => {
                          setValue(
                            `indent.items.${index}.source`,
                            vName ? `Vendor: ${vName}` : 'Vendor',
                          );
                        }}
                        options={vendorsList.map((v) => ({
                          label: v.vendorCode ? `${v.vendorName} (${v.vendorCode})` : v.vendorName,
                          value: v.vendorName,
                        }))}
                      />
                    </div>
                    <div className="md:col-span-5 text-xs text-text-secondary pt-4">
                      {selectedVendorName ? (
                        <span>
                          Assigned Vendor:{' '}
                          <strong className="text-text-primary font-semibold">
                            {selectedVendorName}
                          </strong>
                        </span>
                      ) : (
                        <span className="italic text-text-muted">
                          Choose a vendor from the master vendor catalog.
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Dimensions Row */}
                {(() => {
                  const shape = watchedItems?.[index]?.shape;
                  const material = materialsList.find(
                    (m) =>
                      m.materialName.toLowerCase() ===
                      watchedItems?.[index]?.materialName?.toLowerCase(),
                  );
                  const density = material?.densityKgPerDm3 || 0;
                  const diameter = watchedItems?.[index]?.diameterMm;
                  const length = watchedItems?.[index]?.lengthMm;
                  const width = watchedItems?.[index]?.widthMm;
                  const height = watchedItems?.[index]?.heightMm;
                  const unitWeight = calculateMaterialWeight({
                    shape: shape as any,
                    densityKgPerDm3: density,
                    diameterMm: Number(diameter),
                    lengthMm: Number(length),
                    widthMm: Number(width),
                    heightMm: Number(height),
                  });
                  const isRoundOrCircle = shape === 'ROUND' || shape === 'CIRCLE';
                  const isPrismatic =
                    shape === 'RECTANGLE' || shape === 'SQUARE' || shape === 'PLATE';

                  if (!isRoundOrCircle && !isPrismatic) return null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-3 bg-surface-base rounded-md border border-border-default/50 items-end">
                      {isRoundOrCircle ? (
                        <div className="md:col-span-3">
                          <Input
                            label="Diameter (mm)"
                            type="number"
                            step="0.1"
                            disabled={isReadOnly}
                            {...register(`indent.items.${index}.diameterMm`)}
                          />
                        </div>
                      ) : null}
                      {isRoundOrCircle || isPrismatic ? (
                        <div className="md:col-span-3">
                          <Input
                            label="Length (mm)"
                            type="number"
                            step="0.1"
                            disabled={isReadOnly}
                            {...register(`indent.items.${index}.lengthMm`)}
                          />
                        </div>
                      ) : null}
                      {isPrismatic ? (
                        <div className="md:col-span-3">
                          <Input
                            label="Width (mm)"
                            type="number"
                            step="0.1"
                            disabled={isReadOnly}
                            {...register(`indent.items.${index}.widthMm`)}
                          />
                        </div>
                      ) : null}
                      {isPrismatic ? (
                        <div className="md:col-span-3">
                          <Input
                            label="Height/Thick (mm)"
                            type="number"
                            step="0.1"
                            disabled={isReadOnly}
                            {...register(`indent.items.${index}.heightMm`)}
                          />
                        </div>
                      ) : null}
                      <div
                        className={
                          isRoundOrCircle
                            ? 'md:col-span-6 flex items-end'
                            : 'md:col-span-3 flex items-end'
                        }
                      >
                        <div className="w-full text-right p-2.5 rounded bg-background-primary border border-border-default">
                          <span className="text-xs text-text-muted mr-2">Live Unit Weight:</span>
                          <span className="font-bold text-accent-primary">
                            {unitWeight > 0 ? unitWeight.toFixed(4) + ' kg' : '---'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Row 2: Quantity, Unit, Prod. Source, Est. Rate, Mat. Cost (Clean 12-column single-line layout) */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border-t border-border-default/50 pt-3">
                  <div className="md:col-span-1" />
                  <div className="md:col-span-2">
                    <Input
                      label="Quantity"
                      type="number"
                      step="0.01"
                      disabled={isReadOnly || isProductionMode || isAccountsMode}
                      {...register(`indent.items.${index}.quantity`, {
                        valueAsNumber: true,
                        onChange: (e) => {
                          const qty = parseFloat(e.target.value) || 0;
                          // User requested: Design team enters the total directly in Est Rate, so don't multiply predicted Amount by quantity.
                          // However, we still need to recalculate actualAmount if Accounts has entered an actual rate.
                          const actRate = watchedCostItems?.[index]?.actualRate;
                          if (actRate !== undefined && actRate !== null) {
                            setValue(`costSheet.costItems.${index}.actualAmount`, actRate * qty);
                          }
                        },
                      })}
                      error={errors.indent?.items?.[index]?.quantity?.message}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name={`indent.items.${index}.unitId`}
                      render={({ field: uField }) => (
                        <Select
                          label="Unit"
                          disabled={isReadOnly || isProductionMode || isAccountsMode}
                          options={[
                            { label: 'Select Unit', value: '' },
                            ...units.map((u) => ({
                              label: `${u.symbol || u.unitName}`,
                              value: u.id,
                            })),
                          ]}
                          error={errors.indent?.items?.[index]?.unitId?.message}
                          {...uField}
                        />
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Controller
                      control={control}
                      name={`indent.items.${index}.productionSource`}
                      render={({ field: psField }) => {
                        const currentVal = psField.value || '';
                        const isVendor =
                          currentVal.startsWith('Vendor') ||
                          (currentVal !== '' &&
                            currentVal !== 'In-house' &&
                            vendorsList.some(
                              (v) =>
                                v.vendorName === currentVal || currentVal.includes(v.vendorName),
                            ));
                        const prodSourceType = isVendor
                          ? 'Vendor'
                          : currentVal === 'In-house'
                            ? 'In-house'
                            : currentVal
                              ? 'In-house'
                              : '';

                        return (
                          <Select
                            label="Prod. Source"
                            disabled={!isProductionMode}
                            value={prodSourceType}
                            onChange={(e) => {
                              const selectedType = e.target.value;
                              if (selectedType === 'In-house') {
                                psField.onChange('In-house');
                              } else if (selectedType === 'Vendor') {
                                const defaultVendor = vendorsList[0]?.vendorName || '';
                                psField.onChange(
                                  defaultVendor ? `Vendor: ${defaultVendor}` : 'Vendor',
                                );
                              } else {
                                psField.onChange('');
                              }
                            }}
                            options={[
                              { label: 'Select (Optional)', value: '' },
                              { label: 'In-house', value: 'In-house' },
                              { label: 'Vendor', value: 'Vendor' },
                            ]}
                          />
                        );
                      }}
                    />
                  </div>
                  {canViewCostSheet && (
                    <>
                      <div className="md:col-span-2">
                        <Input
                          label="Est. Rate (₹)"
                          type="number"
                          step="0.01"
                          disabled={isReadOnly || isProductionMode || isAccountsMode}
                          {...register(`costSheet.costItems.${index}.predictedRate`, {
                            valueAsNumber: true,
                            onChange: (e) => {
                              const rate = parseFloat(e.target.value) || 0;
                              // User requested: Design team enters the total directly in Est Rate, do NOT multiply by quantity.
                              setValue(`costSheet.costItems.${index}.predictedAmount`, rate);
                            },
                          })}
                          error={errors.costSheet?.costItems?.[index]?.predictedRate?.message}
                        />
                      </div>
                      <div className={isAccountsMode ? 'md:col-span-3' : 'md:col-span-3'}>
                        <Input
                          label="Material Cost (₹)"
                          type="number"
                          disabled={true}
                          {...register(`costSheet.costItems.${index}.predictedAmount`)}
                        />
                      </div>
                      {isAccountsMode && (
                        <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          <Input
                            label="Actual Rate (₹)"
                            type="number"
                            step="0.01"
                            disabled={!isAccountsMode}
                            {...register(`costSheet.costItems.${index}.actualRate`, {
                              valueAsNumber: true,
                              onChange: (e) => {
                                const rate = parseFloat(e.target.value) || 0;
                                const qty = Number(watchedItems?.[index]?.quantity) || 0;
                                setValue(`costSheet.costItems.${index}.actualAmount`, rate * qty);
                              },
                            })}
                          />
                          <Input
                            label="Actual Mat. Cost (₹)"
                            type="number"
                            disabled
                            {...register(`costSheet.costItems.${index}.actualAmount`)}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Conditional Inline Production Vendor Selector when Prod. Source === Vendor */}
                {(() => {
                  const currentProdSource = watchedItems?.[index]?.productionSource || '';
                  const isVendor =
                    currentProdSource.startsWith('Vendor') ||
                    (currentProdSource !== '' &&
                      currentProdSource !== 'In-house' &&
                      vendorsList.some(
                        (v) =>
                          v.vendorName === currentProdSource ||
                          currentProdSource.includes(v.vendorName),
                      ));
                  const selectedProdVendorName = isVendor
                    ? currentProdSource.replace(/^Vendor:\s*/i, '').replace(/^Vendor\s*-\s*/i, '')
                    : '';

                  if (!isVendor) return null;

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                      <div className="md:col-span-1 text-center font-bold text-[11px] text-amber-500 uppercase tracking-wider">
                        Prod. Vendor
                      </div>
                      <div className="md:col-span-6">
                        <Combobox
                          label="Select Production Vendor"
                          placeholder="Type or select production vendor..."
                          disabled={!isProductionMode}
                          value={selectedProdVendorName}
                          onChange={(vName) => {
                            setValue(
                              `indent.items.${index}.productionSource`,
                              vName ? `Vendor: ${vName}` : 'Vendor',
                            );
                          }}
                          options={vendorsList.map((v) => ({
                            label: v.vendorCode
                              ? `${v.vendorName} (${v.vendorCode})`
                              : v.vendorName,
                            value: v.vendorName,
                          }))}
                        />
                      </div>
                      <div className="md:col-span-5 text-xs text-text-secondary pt-4">
                        {selectedProdVendorName ? (
                          <span>
                            Production Vendor:{' '}
                            <strong className="text-text-primary font-semibold">
                              {selectedProdVendorName}
                            </strong>
                          </span>
                        ) : (
                          <span className="italic text-text-muted">
                            Production can assign a vendor from the catalog or leave as is.
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Nested Process Array for this item */}
                <NestedProcessArray
                  control={control}
                  register={register}
                  setValue={setValue}
                  itemIndex={index}
                  errors={errors}
                  isReadOnly={isReadOnly}
                  isAccountsMode={isAccountsMode}
                  isProductionMode={isProductionMode}
                  processesList={processes}
                  vendorsList={vendorsList}
                  itemTotal={itemTotals[index]}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Brought Material section */}
      <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-bold text-text-primary">
            Brought Material (Bought Out Items)
          </h3>
          {!isReadOnly && !isProductionMode && !isAccountsMode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendBroughtMaterial({
                  name: '',
                  quantity: 1,
                  specification: '',
                  amount: 0,
                  actualAmount: 0,
                })
              }
            >
              + Add Material
            </Button>
          )}
        </div>

        {broughtMaterialFields.length === 0 && (
          <div className="text-center py-4 text-text-tertiary text-sm italic">
            No brought materials added.
          </div>
        )}

        <div className="space-y-4">
          {broughtMaterialFields.map((field, index) => {
            return (
              <div
                key={field.id}
                className="p-4 bg-surface-base border border-border-default rounded-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary/10 text-brand-primary text-xs font-bold">
                      #{index + 1}
                    </span>
                  </div>
                  {!isReadOnly && !isProductionMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-feedback-error hover:text-feedback-error/80 hover:bg-feedback-error/10"
                      onClick={() => removeBroughtMaterial(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <Controller
                    name={`broughtMaterials.${index}.name`}
                    control={control}
                    render={({ field: inputProps, fieldState: { error } }) => (
                      <Input
                        label="NAME *"
                        placeholder="e.g. Screws M4"
                        error={error?.message}
                        disabled={isReadOnly || isProductionMode || isAccountsMode}
                        {...inputProps}
                      />
                    )}
                  />

                  <Controller
                    name={`broughtMaterials.${index}.quantity`}
                    control={control}
                    render={({ field: inputProps, fieldState: { error } }) => (
                      <Input
                        type="number"
                        label="QUANTITY *"
                        step="1"
                        min="0"
                        error={error?.message}
                        disabled={isReadOnly || isProductionMode || isAccountsMode}
                        {...inputProps}
                        onChange={(e) => inputProps.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />

                  <Controller
                    name={`broughtMaterials.${index}.specification`}
                    control={control}
                    render={({ field: inputProps, fieldState: { error } }) => (
                      <Input
                        label="SPECIFICATION"
                        placeholder="(Optional)"
                        error={error?.message}
                        disabled={isReadOnly || isProductionMode || isAccountsMode}
                        {...inputProps}
                      />
                    )}
                  />

                  <Controller
                    name={`broughtMaterials.${index}.amount`}
                    control={control}
                    render={({ field: inputProps, fieldState: { error } }) => (
                      <Input
                        type="number"
                        label="AMOUNT (₹)"
                        placeholder="(Optional)"
                        step="0.01"
                        min="0"
                        error={error?.message}
                        disabled={isReadOnly || isProductionMode || isAccountsMode}
                        {...inputProps}
                        onChange={(e) => inputProps.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />

                  <Controller
                    name={`broughtMaterials.${index}.actualAmount`}
                    control={control}
                    render={({ field: inputProps, fieldState: { error } }) => (
                      <Input
                        type="number"
                        label="ACTUAL AMOUNT (₹) *"
                        placeholder={
                          isAccountsMode && !isReadOnly ? 'Enter actual amount' : 'By Accounts'
                        }
                        step="0.01"
                        min="0"
                        error={error?.message}
                        disabled={!isAccountsMode || isReadOnly}
                        {...inputProps}
                        onChange={(e) => inputProps.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Cost Form section */}
      {canViewCostSheet && (
        <div className="bg-surface-card rounded-xl p-6 border border-border-default shadow-card">
          <h3 className="text-sm font-bold text-text-primary mb-4">
            Global Costs (Design & Overhead)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-background-primary border border-border-default rounded-lg text-center">
              <p className="text-xs text-text-secondary uppercase">Total Material Cost</p>
              <p className="text-xl font-bold text-text-primary">
                ₹
                {totalMaterialCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="p-4 bg-background-primary border border-border-default rounded-lg text-center">
              <p className="text-xs text-text-secondary uppercase">Total Process Cost</p>
              <p className="text-xl font-bold text-text-primary">
                ₹
                {totalProcessCost.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Input
                label="Design Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly || isAccountsMode || isProductionMode}
                {...register('costSheet.designCost', { valueAsNumber: true })}
                error={errors.costSheet?.designCost?.message}
              />
              {(isAccountsMode || (watchedActualDesignCost ?? 0) > 0) && (
                <Input
                  label="Actual Design Cost (₹)"
                  type="number"
                  step="0.01"
                  disabled={true}
                  {...register('costSheet.actualDesignCost', { valueAsNumber: true })}
                />
              )}
            </div>
            <div className="space-y-4">
              <Input
                label="Overhead Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly || isAccountsMode || isProductionMode}
                {...register('costSheet.overheadCost', { valueAsNumber: true })}
                error={errors.costSheet?.overheadCost?.message}
              />
              {(isAccountsMode || (watchedActualOverheadCost ?? 0) > 0) && (
                <Input
                  label="Actual Overhead Cost (₹)"
                  type="number"
                  step="0.01"
                  disabled={true}
                  {...register('costSheet.actualOverheadCost', { valueAsNumber: true })}
                />
              )}
            </div>
            <div className="space-y-4">
              <Input
                label="Contingency Cost (₹)"
                type="number"
                step="0.01"
                disabled={isReadOnly || isAccountsMode || isProductionMode}
                {...register('costSheet.contingencyCost', { valueAsNumber: true })}
                error={errors.costSheet?.contingencyCost?.message}
              />
              {(isAccountsMode || (watchedActualContingencyCost ?? 0) > 0) && (
                <Input
                  label="Actual Contingency Cost (₹)"
                  type="number"
                  step="0.01"
                  disabled={true}
                  {...register('costSheet.actualContingencyCost', { valueAsNumber: true })}
                />
              )}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-border-default pt-6">
            <div className="text-right md:text-left">
              <p className="text-sm text-text-secondary">Subtotal (Material + Process)</p>
              <p className="text-xl font-bold text-text-primary">
                ₹
                {subTotal.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {(isAccountsMode || actualSubTotal > 0) && (
                <p className="text-sm font-bold text-status-success mt-1">
                  Actual: ₹
                  {actualSubTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary">
                {isAccountsMode
                  ? 'Grand Total (Actual Material + Process + Global)'
                  : 'Grand Total (Material + Process + Global)'}
              </p>
              <p className="text-2xl font-bold text-accent-primary">
                ₹
                {(isAccountsMode ? actualGrandTotal : grandTotal).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
              {!isAccountsMode && actualGrandTotal > 0 && (
                <p className="text-lg font-bold text-status-success mt-1">
                  Actual: ₹
                  {actualGrandTotal.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {(!isReadOnly || isAccountsMode || isProductionMode) && (
        <div className="flex justify-end gap-3 pt-6">
          <Button type="submit" loading={isLoading} disabled={isLoading}>
            {isAccountsMode
              ? 'Update Actual Costs'
              : isProductionMode
                ? 'Save Production Details'
                : initialData
                  ? 'Update Transaction'
                  : 'Create Transaction'}
          </Button>
        </div>
      )}
    </form>
  );
};
