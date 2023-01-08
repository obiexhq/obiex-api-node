export class ServerError extends Error {
    data: object;
    statusCode: number;

    constructor(message: string, data: object, statusCode: number) {
        super(message)
        this.data = data;
        this.statusCode = statusCode;
    }
}