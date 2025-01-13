/* eslint-disable @typescript-eslint/no-explicit-any */
import { ValidationPipe } from "@nestjs/common";
import { HttpAdapterHost, NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { ResponseInterceptor } from "./common/interceptors/response.interceptors";
import env from "./config/env.config";
import { CustomLoggerService } from "./custom-logger/custom-logger.service";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Setup CORS with a restrictive policy
    // Uncomment and modify if needed
    // app.enableCors({
    //     origin: env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"],
    //     methods: "GET,POST,PUT,DELETE,PATCH",
    //     credentials: true,
    // });

    // Set global prefix for the API
    app.setGlobalPrefix("api/v1");

    // Enable shutdown hooks for graceful shutdown
    app.enableShutdownHooks();

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

    // Retrieve logger from the app context using NestJS's DI
    const logger = app.get(CustomLoggerService);

    // Handle uncaught exceptions and unhandled rejections
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
bootstrap().catch((err) => console.error(err));
