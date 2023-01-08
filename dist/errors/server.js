"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = void 0;
class ServerError extends Error {
    constructor(message, data, statusCode) {
        super(message);
        this.data = data;
        this.statusCode = statusCode;
    }
}
exports.ServerError = ServerError;
//# sourceMappingURL=server.js.map