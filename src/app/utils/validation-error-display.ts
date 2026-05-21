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
    invalidValue?: unknown;
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
      message: error.message,
      invalidValue: (error as any).invalidValue
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
export function getErrorsAsHTML<T>(result: ImportValidationResult<T>, file_name : string): string {
  const formatted = formatValidationErrors(result);
  let html = '';

  html += `<section class="validation-report-container">`;
  html += `<h2 class="report-title">Rapport d'importation</h2>`;
  html += `<div class="report-file">Fichier : <strong>${escapeHtml(file_name)}</strong></div>`;
  html += `<div class="validation-report">`;
  html += `<div class="summary">${formatted.summary}</div>`;

  if (formatted.hasErrors) {
    html += `<div class="error-details">`;

    // accordéon par ligne (utilise <details> pour accessibilité et pas de JS)
    formatted.errorsByLine.forEach(lineError => {
      const errorCount = lineError.errors.length;
      html += `<details class="line-error" open>`;
      html += `<summary class="line-header">Ligne ${lineError.lineNumber} — ${errorCount} erreur(s)</summary>`;
      html += `<ul class="errors-list">`;

      lineError.errors.forEach(error => {
        html += `<li class="error-item">`;
        html += `<span class="error-field">${escapeHtml(error.field)}</span>`;
        html += `<span class="error-code">[${escapeHtml(error.code)}]</span>`;
        html += `<div class="error-message">${escapeHtml(error.message)}</div>`;
        if (error.invalidValue !== undefined) {
          html += `<div class="error-value">Valeur non conforme: <code>${escapeHtml(stringifyValue(error.invalidValue))}</code></div>`;
        }
        html += `</li>`;
      });

      html += `</ul>`;
      html += `</details>`;
    });

    html += `</div>`;
  } else {
    html += `<div class="no-errors">✓ Aucune erreur</div>`;
  }

  html += `</div>`; // .validation-report
  html += `</section>`;

  return html;
}

function escapeHtml(input: string | undefined): string {
  if (input === undefined || input === null) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stringifyValue(value: unknown): string {
  try {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value;
    return JSON.stringify(value);
  } catch (e) {
    try { return String(value); } catch { return ''; }
  }
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
      message: error.message,
      invalidValue: (error as any).invalidValue
    }))
  );
}
