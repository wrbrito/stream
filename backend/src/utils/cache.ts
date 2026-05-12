type CacheItem<T> = {
  data: T;
  expiry: number;
};

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * Define um valor no cache com um TTL (Time To Live) em milissegundos.
   */
  set(key: string, data: any, ttlMs: number = 60000) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Obtém um valor do cache se não estiver expirado.
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Limpa uma chave específica.
   */
  delete(key: string) {
    this.cache.delete(key);
  }

  /**
   * Limpa todo o cache.
   */
  clear() {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();
