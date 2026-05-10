import { ImportValidationResult } from '../models/validation.model';

/**
 * Format d'une erreur pour l'affichage
 */
export interface FormattedError {
  lineNumber: number;
  errors: {
    field: string;
    code: string;
    message: string;
  }[];
}

/**
 * Résultat du formatage des erreurs
 */
export interface FormattedErrorReport<T> {
  hasErrors: boolean;
  errorCount: number;
  errorsByLine: FormattedError[];
  summary: string;
}

/**
 * Formate les erreurs de validation pour l'affichage
 * Retourne seulement les erreurs, pas les données complètes
 */
export function formatValidationErrors<T>(result: ImportValidationResult<T>): FormattedErrorReport<T> {
  const errorsByLine: FormattedError[] = result.invalidData.map(invalidRow => ({
    lineNumber: invalidRow.lineNumber,
    errors: invalidRow.errors.map(error => ({
      field: error.field,
      code: error.code,
      message: error.message
    }))
  }));

  const summary = `Import: ${result.summary.total} ligne(s) | ✓ ${result.summary.valid} valide(s) | ✗ ${result.summary.invalid} invalide(s)`;

  return {
    hasErrors: result.invalidData.length > 0,
    errorCount: result.invalidData.length,
    errorsByLine,
    summary
  };
}

/**
 * Affiche les erreurs dans la console avec formatage lisible
 */
export function logValidationErrors<T>(result: ImportValidationResult<T>, label: string = 'Validation'): void {
  const formatted = formatValidationErrors(result);

  console.group(`%c${label}`, 'font-weight: bold; font-size: 14px; color: #1976d2;');
  console.log(formatted.summary);

  if (formatted.hasErrors) {
    console.group(`%c${formatted.errorCount} erreur(s) détectée(s)`, 'color: #d32f2f;');

    formatted.errorsByLine.forEach(lineError => {
      console.group(`%cLigne ${lineError.lineNumber}`, 'color: #f57c00; font-weight: bold;');
      lineError.errors.forEach(error => {
        console.log(
          `%c[${error.code}] %c${error.field}%c: ${error.message}`,
          'color: #d32f2f; font-weight: bold;',
          'color: #7b1fa2; font-weight: bold;',
          'color: #333;'
        );
      });
      console.groupEnd();
    });

    console.groupEnd();
  } else {
    console.log('%cAucune erreur ! ✓', 'color: #388e3c; font-weight: bold;');
  }

  console.groupEnd();
}

/**
 * Génère un texte brut lisible pour les erreurs
 * Utile pour afficher dans un toast, modal ou textarea
 */
export function getErrorsAsText<T>(result: ImportValidationResult<T>): string {
  const lines: string[] = [];
  const formatted = formatValidationErrors(result);

  lines.push(formatted.summary);
  lines.push('');

  if (!formatted.hasErrors) {
    lines.push('✓ Aucune erreur détectée');
    return lines.join('\n');
  }

  lines.push(`Détails des ${formatted.errorCount} erreur(s) :\n`);

  formatted.errorsByLine.forEach(lineError => {
    lines.push(`📍 Ligne ${lineError.lineNumber}:`);
    lineError.errors.forEach(error => {
      lines.push(`   ✗ ${error.field} [${error.code}]`);
      lines.push(`     → ${error.message}`);
    });
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Génère du HTML formaté pour les erreurs
 * Utile pour afficher dans une div avec formatage riche
 */
export function getErrorsAsHTML<T>(result: ImportValidationResult<T>): string {
  const formatted = formatValidationErrors(result);
  let html = '';

  html += `<div class="validation-report">`;
  html += `<div class="summary">${formatted.summary}</div>`;

  if (formatted.hasErrors) {
    html += `<div class="error-details">`;
    formatted.errorsByLine.forEach(lineError => {
      html += `<div class="line-error">`;
      html += `<div class="line-header">Ligne ${lineError.lineNumber}</div>`;
      html += `<ul class="errors-list">`;
      lineError.errors.forEach(error => {
        html += `<li class="error-item">`;
        html += `<span class="error-field">${error.field}</span>`;
        html += `<span class="error-code">[${error.code}]</span>`;
        html += `<span class="error-message">${error.message}</span>`;
        html += `</li>`;
      });
      html += `</ul>`;
      html += `</div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="no-errors">✓ Aucune erreur</div>`;
  }

  html += `</div>`;
  return html;
}

/**
 * Retourne seulement les erreurs en tant qu'array plat (pour itération simple)
 * Utile pour ngFor dans les templates Angular
 */
export function getErrorsList<T>(result: ImportValidationResult<T>): Array<{ lineNumber: number; field: string; code: string; message: string }> {
  return result.invalidData.flatMap(invalidRow =>
    invalidRow.errors.map(error => ({
      lineNumber: invalidRow.lineNumber,
      field: error.field,
      code: error.code,
      message: error.message
    }))
  );
}
