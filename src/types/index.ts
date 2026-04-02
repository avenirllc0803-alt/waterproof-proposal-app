export interface CustomerInfo {
  customerName: string;
  propertyName: string;
  date: string;
  companyName: string;
}

export interface Annotation {
  id: string;
  type: "circle" | "arrow" | "text" | "rectangle";
  x: number;
  y: number;
  radiusX?: number;
  radiusY?: number;
  endX?: number;
  endY?: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  lineWidth?: number;
  fontSize?: number;
  boxed?: boolean;
  bgColor?: string;
  filled?: boolean;
}

export interface ProposalSection {
  id: string;
  imageUrl: string;
  imageName: string;
  annotations: Annotation[];
  description: string;
  annotatedImageUrl?: string;
}

export interface Proposal {
  customerInfo: CustomerInfo;
  sections: ProposalSection[];
}

// 見積書・請求書用の型定義
export interface EstimateItem {
  id: string;
  category: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  note: string;
}

export interface EstimateInfo {
  customerInfo: CustomerInfo;
  items: EstimateItem[];
  validUntil: string;
  notes: string;
  taxRate: number;
}

export interface InvoiceInfo {
  customerInfo: CustomerInfo;
  items: EstimateItem[];
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  bankInfo: string;
  notes: string;
  taxRate: number;
}
