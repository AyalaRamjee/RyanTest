
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
  // The 'address' field will be a concatenation of the above for display/XML
  address: string; 
}

export interface PartCategoryMapping {
  id: string; // Unique ID for the mapping
  partId: string;
  categoryName: string;
}

export interface PartCommodityMapping {
  id: string; // Unique ID for the mapping
  partId: string;
  commodityName: string;
}

export interface PartSupplierAssociation {
  id: string; // Unique ID for the association
  partId: string;
  supplierId: string;
}

