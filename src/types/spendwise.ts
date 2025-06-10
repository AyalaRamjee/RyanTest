
export interface Part {
  id: string;
  partNumber: string;
  name: string;
  price: number;
  annualDemand: number;
  freightOhdCost: number; // e.g., 0.05 for 5%
}

export interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  streetAddress: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  address: string; 
  latitude?: number;
  longitude?: number;
}

export interface PartCategoryMapping {
  id: string; 
  partId: string;
  categoryName: string;
}

// PartCommodityMapping interface removed

export interface PartSupplierAssociation {
  id: string; 
  partId: string;
  supplierId: string;
}

