import { parseString } from 'xml2js';

export function xmlToJson(xml: string): Promise<any> {
  return new Promise((resolve, reject) => {
    parseString(
      xml,
      {
        explicitArray: false,
        trim: true,
      },
      (err: any, result: any) => {
        if (err) reject(err);
        else resolve(result);
      },
    );
  });
}
