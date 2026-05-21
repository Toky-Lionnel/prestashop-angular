import { BackendData, Record } from "./interface";

function cleanField(value: string): string {
  let result = value.trim();

  if (isDecimalNumber(result)) {
    result = result.replace(",", ".");
  }

  return result;
}

function isDecimalNumber(value: string): boolean {
  return /^[0-9]+,[0-9]+$/.test(value);
}

export function parseCSV(line: string): string[] {
  let result: string[] = [];
  let current: string = "";
  let inQuotes: boolean = false;

  for (let i = 0; i < line.length; i++) {
    let char: string = line[i];
    if (char == '"') {
      if (inQuotes == true && line[i + 1] == '"') {
        current += '"';
        i++;
      } else {
        if (inQuotes == false) {
          inQuotes = true;
        } else {
          inQuotes = false;
        }
      }
    }

    // Si virgule hors guillemets
    else if (char == "," && inQuotes == false) {
      result.push(cleanField(current));
      current = "";
    }

    // Caractère normal
    else {
      current += char;
    }
  }

  // Ajouter la dernière colonne
  result.push(cleanField(current));

  return result;
}

export async function fileToStringArray(file: File): Promise<string[]> {
  const content = await file.text();
  return content.split(/\r?\n/);
}



function transformData(data: string[]): string[][] {
  return data.map((line) => parseCSV(line));
}

export function csvToJsonObjects(data: string[]): Record[] {

    let result = transformData(data);
    let headers = result[0];

    let finalResult: Record[] = [];

    // Commencer à la ligne 1 (car ligne 0 = headers)
    for (let i = 1; i < result.length; i++) {

        let row = result[i];
        let obj: any = {};

        // Parcourir les colonnes
        for (let j = 0; j < headers.length; j++) {

            let header = headers[j].toLowerCase().trim();
            obj[header] = row[j];

        }

        // Ajouter numéro de ligne
        obj.line_number = i.toString();

        finalResult.push(obj);
    }

    return finalResult;
}

export async function transformCSVtoBackend(
  filepath: File,
): Promise<BackendData> {
  const dataArray: string[] = await fileToStringArray(filepath);

  return {
    filename: filepath.name,
    table_name: detectTableName(parseCSV(dataArray[0])),
    data: JSON.stringify(csvToJsonObjects(dataArray)),
  };
}

function detectTableName(headers: string[]): string {
  const normalizedHeaders = headers.map((h) =>
    h.trim().toLowerCase(),
  );

  const tables = [
    {
      name: "PRODUCTS",
      headers: [
        "date_availability_produit",
        "nom",
        "reference",
        "prix_ttc",
        "taxe",
        "categorie",
        "prix_achat",
      ],
    },
    {
      name: "COMBINATIONS",
      headers: [
        "reference",
        "specificité",
        "karazany",
        "stock_initial",
        "prix_vente_ttc",
      ],
    },
    {
      name: "CUSTOMERS",
      headers: [
        "date",
        "nom",
        "email",
        "pwd",
        "adresse",
        "achat",
        "etat",
      ],
    },
  ];

  let bestMatch = "";
  let bestScore = 0;

  for (const table of tables) {
    const matchedHeaders = table.headers.filter((header) =>
      normalizedHeaders.includes(header),
    );

    const score =
      matchedHeaders.length / table.headers.length;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = table.name;
    }
  }

  // seuil minimal de confiance
  if (bestScore >= 0.4) {
    return bestMatch;
  }

  return "UNKNOWN";
}
