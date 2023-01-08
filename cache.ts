import NodeCache from "node-cache";

export class CacheService {
  private nodeCache: NodeCache;

  constructor() {
    this.nodeCache = new NodeCache({});
  }

  public async getOrSet<T>(
    key: string,
    fallback: () => Promise<T>,
    ttlSeconds: number
  ) {
    let data = this.nodeCache.get<T>(key);

    if (data) {
      return data;
    }

    data = await fallback();

    this.nodeCache.set(key, data, ttlSeconds);

    return data;
  }
}
