import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CustomLoggerService {
    private readonly logger = new Logger(CustomLoggerService.name);

    log(message: string, context?: string) {
        const timestamp = new Date().toISOString();
        const safeContext = context ?? "General";

        if (typeof message === "object") {
            const formattedMessage = JSON.stringify(message, null, 2); // Pretty print the object
            this.logger.log(
                `[${timestamp}] [${safeContext}]\nResponse:\n${formattedMessage}`,
            );
        } else {
            this.logger.log(`[${timestamp}] [${safeContext}] ${message}`);
        }
    }

    error(message: string | object, context?: string, stack?: string) {
        const timestamp = new Date().toISOString();
        const safeContext = context ?? "Unknown Context";
        const safeStack = stack ?? "No stack trace available";

        if (typeof message === "object") {
            const formattedMessage = JSON.stringify(message, null, 2); // Pretty print the object
            if (process.env.NODE_ENV === "production") {
                this.logger.error(
                    `[${timestamp}] [${safeContext}]\nResponse:\n${formattedMessage}`,
                );
            } else {
                this.logger.error(
                    `[${timestamp}] [${safeContext}]\nResponse:\n${formattedMessage}`,
                    safeStack,
                );
            }
        } else if (process.env.NODE_ENV === "production") {
            this.logger.error(`[${timestamp}] [${safeContext}] ${message}`);
        } else {
            this.logger.error(
                `[${timestamp}] [${safeContext}] ${message}`,
                safeStack,
            );
        }
    }

    warn(message: string, context?: string) {
        const timestamp = new Date().toISOString();
        const safeContext = context ?? "General";
        this.logger.warn(`[${timestamp}] [${safeContext}] ${message}`);
    }

    debug(message: string, context?: string) {
        const timestamp = new Date().toISOString();
        const safeContext = context ?? "General";
        this.logger.debug(`[${timestamp}] [${safeContext}] ${message}`);
    }

    verbose(message: string, context?: string) {
        const timestamp = new Date().toISOString();
        const safeContext = context ?? "General";
        this.logger.verbose(`[${timestamp}] [${safeContext}] ${message}`);
    }
}
