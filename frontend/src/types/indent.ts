export interface IndentItem {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedCost?: number;
}

export interface Indent {
  id: string;
  indentNo: string;
  description?: string;
  status: string;
  creatorId: string;
  items: IndentItem[];
  createdAt: string;
  updatedAt: string;
}
