export interface CustomerInfo {
  customerName: string;
  propertyName: string;
  date: string;
  companyName: string;
}

export interface Annotation {
  id: string;
  type: "circle" | "arrow" | "text";
  x: number;
  y: number;
  // circle
  radiusX?: number;
  radiusY?: number;
  // arrow
  endX?: number;
  endY?: number;
  // text
  text?: string;
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
