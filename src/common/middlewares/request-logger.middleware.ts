import { Injectable, NestMiddleware } from "@nestjs/common";

import { NextFunction, Request, Response } from "express";
import { performance } from "perf_hooks";

import { CustomLoggerService } from "../../custom-logger/custom-logger.service";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
    constructor(private readonly logger: CustomLoggerService) {}

    use(req: Request, res: Response, next: NextFunction): void {
        const { method, originalUrl } = req;
        const start = performance.now(); // Start measuring time

        res.on("finish", () => {
            const duration = performance.now() - start; // Calculate response time
            const status = res.statusCode;
            const logMessage = `Request: ${method} ${originalUrl} | Status: ${status} | Duration: ${duration.toFixed(2)}ms`;

            // Log asynchronously to avoid blocking request
            this.logger.log(logMessage, "Request Logging");
        });

        next();
    }
}
