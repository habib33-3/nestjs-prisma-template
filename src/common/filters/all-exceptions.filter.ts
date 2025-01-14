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
    success: boolean;
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
            success: false,
            statusCode: 500,
            timestamp: this.formatDate(new Date()),
            path: request.url,
            response: "",
        };

        // Handle the exception types and modify the response object
        this.handleException(exception, myResponseObj);

        // Send the response
        response.status(myResponseObj.statusCode).json(myResponseObj);

        // Log the error
        this.logError(myResponseObj);

        // Call the parent catch method for further processing
        super.catch(exception, host);
    }

    private handleException(exception: unknown, myResponseObj: MyResponseObj) {
        if (exception instanceof HttpException) {
            this.handleHttpException(exception, myResponseObj);
        } else if (exception instanceof PrismaClientValidationError) {
            this.handlePrismaValidationError(exception, myResponseObj);
        } else if (exception instanceof PrismaClientKnownRequestError) {
            this.handlePrismaKnownRequestError(exception, myResponseObj);
        } else {
            this.handleGenericError(exception, myResponseObj);
        }

        // Add errorId if statusCode is 500 or higher
        if (myResponseObj.statusCode >= 500) {
            myResponseObj.errorId = this.generateErrorId();
        }
    }

    private handleHttpException(
        exception: HttpException,
        myResponseObj: MyResponseObj,
    ) {
        myResponseObj.statusCode = exception.getStatus();
        const exceptionResponse = exception.getResponse();

        if (typeof exceptionResponse === "string") {
            myResponseObj.response = exceptionResponse;
        } else {
            myResponseObj.response = JSON.stringify(exceptionResponse);
        }
    }

    private handlePrismaValidationError(
        exception: PrismaClientValidationError,
        myResponseObj: MyResponseObj,
    ) {
        myResponseObj.statusCode = 422;
        myResponseObj.response = exception.message.replace(/\n/g, " ");
    }

    private handlePrismaKnownRequestError(
        exception: PrismaClientKnownRequestError,
        myResponseObj: MyResponseObj,
    ) {
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

    private handleGenericError(
        exception: unknown,
        myResponseObj: MyResponseObj,
    ) {
        myResponseObj.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        if (process.env.NODE_ENV === "production") {
            myResponseObj.response = "Internal Server Error";
        } else {
            myResponseObj.response =
                exception instanceof Error
                    ? `${exception.name}: ${exception.message}`
                    : JSON.stringify(exception);
        }
    }

    private logError(myResponseObj: MyResponseObj) {
        const responseString = this.formatExceptionForLogging(
            myResponseObj.response,
        );
        this.logger.error(responseString, AllExceptionsFilter.name);
    }

    private formatDate(date: Date): string {
        const formatter = new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit",
        });
        return formatter.format(date);
    }

    private generateErrorId(): string {
        return "error_" + (Math.random() * 1e9).toString(36);
    }

    private formatExceptionForLogging(exception: string | object): string {
        if (typeof exception === "object") {
            try {
                return JSON.stringify(exception, null, 2);
            } catch {
                return "[Unserializable Object]";
            }
        }

        if (typeof exception === "string") {
            return exception;
        }

        return String(exception);
    }

    private formatPrismaMeta(meta: Record<string, unknown>): string {
        if (!meta) return "Unknown fields";

        return Object.values(meta)
            .map((value) => {
                if (value === null || value === undefined) {
                    return "";
                }

                if (typeof value === "object") {
                    try {
                        return JSON.stringify(value, null, 2);
                    } catch {
                        return "[Unserializable Object]";
                    }
                }

                if (
                    typeof value === "string" ||
                    typeof value === "number" ||
                    typeof value === "boolean"
                ) {
                    return String(value);
                }

                return "[Unknown Type]";
            })
            .join(", ");
    }
}
