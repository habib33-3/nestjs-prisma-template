import {
    ArgumentsHost,
    Catch,
    HttpException,
    HttpStatus,
} from "@nestjs/common";
import { BaseExceptionFilter } from "@nestjs/core";

import { CustomLoggerService } from "src/custom-logger/custom-logger.service";

import {
    PrismaClientKnownRequestError,
    PrismaClientValidationError,
} from "@prisma/client/runtime/library";
import { Request, Response } from "express";

type MyResponseObj = {
    statusCode: number;
    timestamp: string;
    path: string;
    response: string;
    errorId?: string;
};

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
    private readonly logger = new CustomLoggerService();

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const myResponseObj: MyResponseObj = {
            statusCode: 500,
            timestamp: new Date().toISOString(),
            path: request.url,
            response: "",
        };

        // Handle known HTTP exceptions
        if (exception instanceof HttpException) {
            myResponseObj.statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            myResponseObj.response =
                typeof exceptionResponse === "string"
                    ? exceptionResponse
                    : JSON.stringify(exceptionResponse);
        }
        // Handle Prisma validation errors
        else if (exception instanceof PrismaClientValidationError) {
            myResponseObj.statusCode = 422;
            myResponseObj.response = exception.message.replace(/\n/g, " ");
        }
        // Handle Prisma known request errors
        else if (exception instanceof PrismaClientKnownRequestError) {
            myResponseObj.statusCode = 400;

            switch (exception.code) {
                case "P2002":
                    myResponseObj.response =
                        "Unique constraint failed on the field(s): " +
                        this.formatPrismaMeta(exception.meta);
                    break;
                case "P2003":
                    myResponseObj.response =
                        "Foreign key constraint failed on the field(s): " +
                        this.formatPrismaMeta(exception.meta);
                    break;
                case "P2025":
                    myResponseObj.response =
                        "An operation failed because a required record was not found.";
                    break;
                default:
                    myResponseObj.response = exception.message;
                    break;
            }
        }
        // Handle general errors
        else {
            myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

            // Adjust error response based on the environment
            if (process.env.NODE_ENV === "production") {
                myResponseObj.response = "Internal Server Error";
            } else {
                myResponseObj.response =
                    exception instanceof Error
                        ? `${exception.name}: ${exception.message}`
                        : JSON.stringify(exception);
            }
        }

        // Optional: Add unique error ID for tracking
        if (myResponseObj.statusCode >= 500) {
            myResponseObj.errorId = this.generateErrorId();
        }

        response.status(myResponseObj.statusCode).json(myResponseObj);

        // Log error using CustomLoggerService
        const responseString = this.formatExceptionForLogging(
            myResponseObj.response,
        );

        this.logger.error(responseString, AllExceptionsFilter.name);

        super.catch(exception, host);
    }

    // Optional: Generate a unique error ID for tracing errors
    private generateErrorId(): string {
        return "error_" + (Math.random() * 1e9).toString(36);
    }

    // Format exception for logging (to avoid '[object Object]' stringification)
    private formatExceptionForLogging(exception: string | object): string {
        if (typeof exception === "object") {
            return JSON.stringify(exception, null, 2); // Pretty-print object errors
        }
        return exception.toString();
    }

    // Format Prisma error metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private formatPrismaMeta(meta: any): string {
        if (!meta) return "Unknown fields";
        return Object.values(meta).join(", ");
    }
}
