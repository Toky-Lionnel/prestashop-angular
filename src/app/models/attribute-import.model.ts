export interface ProductOptionValues {
  [karazanyLower: string]: number;
}

export interface ProductOptionRegistryEntry {
  optionId: number;
  values: ProductOptionValues;
}

export interface ProductOptionRegistry {
  [specLower: string]: ProductOptionRegistryEntry;
}

export interface CombinationAggregate {
  reference: string;
  optionValueIds: number[];
}
