
export interface Part {
  id: string;
  partNumber: string;
  name: string;
  price: number;
  annualDemand: number;
}

export interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  description: string;
  address: string; // This could be a more general address line
  city: string;
  country: string;
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
