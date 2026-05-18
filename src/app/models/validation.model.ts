/**
 * Erreur de validation pour un champ spécifique
 */
export interface FieldValidationError {
  field: string;
  code: 'required' | 'format' | 'invalid_value' | 'out_of_range' | 'duplicate' | 'not_found';
  message: string;
  invalidValue?: unknown;
}

/**
 * Une ligne invalide avec ses erreurs et son numéro de ligne
 */
export interface InvalidRow<T> {
  lineNumber: number;
  data: T | null;
  errors: FieldValidationError[];
}

/**
 * Résultat global de la validation d'une importation
 */
export interface ImportValidationResult<T> {
  file_name?: string;
  validData: T[];
  invalidData: InvalidRow<T>[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}


/**
 * Helper pour créer un résultat de validation vide
 */
export function createEmptyValidationResult<T>(): ImportValidationResult<T> {
  return {
    file_name: undefined,
    validData: [],
    invalidData: [],
    summary: { total: 0, valid: 0, invalid: 0 }
  };
}
