"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const node_cache_1 = __importDefault(require("node-cache"));
class CacheService {
    constructor() {
        this.nodeCache = new node_cache_1.default({});
    }
    async getOrSet(key, fallback, ttlSeconds) {
        let data = this.nodeCache.get(key);
        if (data) {
            return data;
        }
        data = await fallback();
        this.nodeCache.set(key, data, ttlSeconds);
        return data;
    }
}
exports.CacheService = CacheService;
//# sourceMappingURL=cache.js.map