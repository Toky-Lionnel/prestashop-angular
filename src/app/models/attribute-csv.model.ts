import { CombinationCsvModel } from './combination-csv.model';

/**
 * Represents an attribute (specificite + karazany pair) extracted from combination CSV
 */
export interface AttributeModel {
  specificite: string;
  karazany: string;
}

/**
 * Transform a CombinationCsvModel into an AttributeModel
 * Extracts only specificite and karazany fields
 */
export function transformCombinationToAttribute(combination: CombinationCsvModel): AttributeModel {
  return {
    specificite: combination.specificite.trim(),
    karazany: combination.karazany.trim()
  };
}

/**
 * Transform multiple CombinationCsvModels into AttributeModels
 */
export function transformCombinationsToAttributes(combinations: CombinationCsvModel[]): AttributeModel[] {
  return combinations.map(transformCombinationToAttribute);
}

/**
 * Extract unique attributes from a list of CombinationCsvModels
 * Useful to avoid duplicate attribute creation
 */
export function extractUniqueAttributes(combinations: CombinationCsvModel[]): AttributeModel[] {
  const seen = new Set<string>();
  const unique: AttributeModel[] = [];

  for (const combination of combinations) {
    const key = `${combination.specificite.trim().toLowerCase()}|${combination.karazany.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(transformCombinationToAttribute(combination));
    }
  }

  return unique;
}
