import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AllExceptionsFilter } from "@/filters/all-exceptions.filter";

import { RequestLoggingMiddleware } from "@/middlewares/request-logger.middleware";

import { CustomLoggerModule } from "@/shared/custom-logger/custom-logger.module";
import { CustomLoggerService } from "@/shared/custom-logger/custom-logger.service";
import { PrismaModule } from "@/shared/prisma/prisma.module";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
    imports: [
        PrismaModule,
        ThrottlerModule.forRoot([
            {
                ttl: 60,
                limit: 10,
            },
        ]),
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        CustomLoggerModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,

        {
            provide: APP_FILTER,
            useClass: AllExceptionsFilter,
        },
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
        {
            provide: RequestLoggingMiddleware,
            useFactory: (logger: CustomLoggerService) => {
                return new RequestLoggingMiddleware(logger);
            },
            inject: [CustomLoggerService],
        },
    ],
})
export class AppModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer.apply(RequestLoggingMiddleware).forRoutes("*");
    }
}
