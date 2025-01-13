import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { CustomLoggerService } from "src/custom-logger/custom-logger.service";

import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    constructor(private readonly logService: CustomLoggerService) {
        super();
    }

    async onModuleInit() {
        try {
            await this.$connect();
            this.logService.log("Prisma connected successfully.");
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : JSON.stringify(error);

            this.logService.error("Error connecting to Prisma:", errorMessage);
            throw error;
        }
    }

    async onModuleDestroy() {
        await this.$disconnect();
        this.logService.log("Prisma disconnected.");
    }
}
