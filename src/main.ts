/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpAdapterHost, NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import env from "./config/env.config";
import { CustomLoggerService } from "./custom-logger/custom-logger.service";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Get the HttpAdapterHost for global exception filter handling
    const { httpAdapter } = app.get(HttpAdapterHost);

    // Use global exception filter for handling all unhandled exceptions
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Enable shutdown hooks for graceful shutdown
    app.enableShutdownHooks();

    // Setup CORS and global prefix before starting the server
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // Strip unknown properties
            forbidNonWhitelisted: true, // Throw error on extra properties
            transform: true, // Automatically transform payloads to DTOs
            disableErrorMessages: process.env.NODE_ENV === "production", // Disable detailed error messages in production
        }),
    );

    // Setup CORS with a restrictive policy
    // app.enableCors({
    //     origin: env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    //     methods: "GET,POST,PUT,DELETE,PATCH",
    //     credentials: true,
    // });


    app.setGlobalPrefix("api/v1");

    // Retrieve logger from the app context using NestJS's DI
    const logger = app.get(CustomLoggerService);

    // Listen for uncaught exceptions and unhandled rejections
    process.on("uncaughtException", (err: any) => {
        logger.error(`Uncaught Exception: ${err.message}`);
        process.exit(1); // Exit process after logging error
    });

    process.on("unhandledRejection", (err: any) => {
        logger.error(`Unhandled Rejection: ${err.message}`);
        process.exit(1); // Exit process after logging error
    });

    // Start the application
    await app.listen(env.PORT ?? 5000);
}
bootstrap();
