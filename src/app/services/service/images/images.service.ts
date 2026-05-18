import { Injectable, inject } from '@angular/core';
import JSZip from 'jszip';
import { AxiosAuthInterceptor } from '../../../interceptors/auth/AxiosAuthInterceptor';
import { ProductService } from '../product/product.service';

@Injectable({
  providedIn: 'root'
})
export class ImagesService {

  private productService: ProductService = inject(ProductService);
  private interceptor: AxiosAuthInterceptor = inject(AxiosAuthInterceptor);

  constructor() { }

  async importImages(zipFile: File): Promise<void> {
    let zip: JSZip;

    try {
      zip = await JSZip.loadAsync(zipFile);
    } catch (error) {
      console.error('Erreur lors de la lecture du ZIP d\'images:', error);
      throw new Error('Fichier ZIP invalide');
    }

    const imageEntries = Object.values(zip.files).filter((entry) => {
      if (entry.dir) {
        return false;
      }

      const lowerName = entry.name.toLowerCase();
      return !lowerName.startsWith('__') && !lowerName.endsWith('.ds_store');
    });

    console.log(`${imageEntries.length} image(s) détectée(s) dans le ZIP.`);

    for (const entry of imageEntries) {
      const baseName = entry.name.split('/').pop() ?? entry.name;
      const reference = baseName.includes('.')
        ? baseName.slice(0, baseName.lastIndexOf('.'))
        : baseName;

      if (!reference.trim()) {
        continue;
      }

      const idProduct = await this.productService.getProductByReference(reference.trim());

      if (!idProduct) {
        console.warn(`Produit introuvable pour la référence : ${reference} (fichier: ${entry.name})`);
        continue;
      }

      try {
        const blob = await entry.async('blob');
        const formData = new FormData();
        formData.append('image', blob, baseName);

        const api = this.interceptor.getApi();

        const response = await api.post(`/api/images/products/${idProduct}`, formData);

        if (response.status >= 200 && response.status < 300) {
          console.log(`Image importée avec succès pour le produit ${idProduct}`);
        } else {
          console.error(`Erreur API lors de l'import de l'image pour le produit ${idProduct} :`, response.statusText);
        }
      } catch (error) {
        console.error(`Erreur lors de l'envoi de l'image pour le produit ${idProduct} :`, error);
      }
    }
  }
}
