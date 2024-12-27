/* eslint-disable @typescript-eslint/no-explicit-any */
import { HttpAdapterHost, NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import env from "./config/env.config";
import { CustomLoggerService } from "./custom-logger/custom-logger.service";
import { AllExceptionsFilter } from "./filters/all-exceptions.filter";

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Get the HttpAdapterHost for global exception filter handling
    const { httpAdapter } = app.get(HttpAdapterHost);

    // Use global exception filter for handling all unhandled exceptions
    app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));

    // Enable shutdown hooks for graceful shutdown
    app.enableShutdownHooks();

    // Setup CORS and global prefix before starting the server
    app.enableCors();
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
