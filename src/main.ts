/* eslint-disable @typescript-eslint/no-explicit-any */
import { ValidationPipe } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";

import * as cookieParser from "cookie-parser";
import { ZodError } from "zod";

import { AppModule } from "./app.module";
import env from "./common/config/env.config";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ResponseInterceptor } from "./common/interceptors/response.interceptors";
import { CustomLoggerService } from "./custom-logger/custom-logger.service";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable shutdown hooks for graceful shutdown
    app.enableShutdownHooks();

    // Set global prefix for the API
    app.setGlobalPrefix("api/v1");

    // Use cookie-parser middleware
    app.use(cookieParser());

    // Configure global pipes for validation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip unknown properties
            forbidNonWhitelisted: true, // Throw error on extra properties
            transform: true, // Automatically transform payloads to DTOs
            disableErrorMessages: process.env.NODE_ENV === "production", // Disable detailed error messages in production
        }),
    );

    // Set global exception filter
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Set global interceptors
    app.useGlobalInterceptors(new ResponseInterceptor());

    // Setup CORS with a restrictive policy (Uncomment if needed)
    // app.enableCors({
    //     origin: env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    //     methods: "GET,POST,PUT,DELETE,PATCH",
    //     credentials: true,
    // });

    // Retrieve logger from the app context using NestJS's DI
    const logger = app.get(CustomLoggerService);

    // Handle uncaught exceptions and unhandled rejections
    process.on("uncaughtException", async (err: Error) => {
        logger.error(`Uncaught Exception: ${err.message}`, err.stack);
        await app.close(); // Gracefully shut down the app
        process.exit(1); // Exit process after logging error
    });

    process.on("unhandledRejection", async (err: any) => {
        if (err instanceof Error) {
            logger.error(`Unhandled Rejection: ${err.message}`, err.stack);
        } else if (err instanceof ZodError) {
            logger.error(`Zod Validation Error: ${JSON.stringify(err.errors)}`);
        } else {
            logger.error(`Unhandled Rejection: ${err}`);
        }
        await app.close();
        process.exit(1);
    });

    // Handle termination signals for graceful shutdown (SIGINT, SIGTERM)
    process.on("SIGINT", async () => {
        logger.log("SIGINT received, shutting down gracefully...");
        await app.close(); // Gracefully shut down the app
        process.exit(0); // Exit process after clean shutdown
    });

    process.on("SIGTERM", async () => {
        logger.log("SIGTERM received, shutting down gracefully...");
        await app.close(); // Gracefully shut down the app
        process.exit(0); // Exit process after clean shutdown
    });

    // Start the application
    await app.listen(env.PORT ?? 5000);
}

bootstrap().catch((err) => {
    console.error("Bootstrapping failed: ", err);
});
