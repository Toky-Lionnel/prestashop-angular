// src/app/core/interceptors/axios-auth.interceptor.ts
import { Injectable } from '@angular/core';
import axios, { AxiosInstance } from 'axios';
import { environment } from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class AxiosAuthInterceptor {

  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: environment.prestashop_api_url,
    });

    // Intercepteur requêtes
    this.api.interceptors.request.use((config) => {
      const token = btoa(`${environment.prestashop_api_key}:`);
      config.headers = config.headers || {};
      config.headers['Authorization'] = `Basic ${token}`;
      return config;
    },
      (error) => Promise.reject(error)
    );

    // Intercepteur réponses
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
        }
        return Promise.reject(error);
      }
    );
  }

  getApi(): AxiosInstance {
    return this.api;
  }
}
