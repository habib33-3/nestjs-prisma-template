import { Injectable, OnApplicationShutdown } from "@nestjs/common";

import { CustomLoggerService } from "@/shared/custom-logger/custom-logger.service";
import { PrismaService } from "@/shared/prisma/prisma.service";

@Injectable()
export class AppService implements OnApplicationShutdown {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly logService: CustomLoggerService,
    ) {}
    getHello(): string {
        return "Hello World!";
    }

    async onApplicationShutdown() {
        this.logService.verbose("Shutting down application...");
        await this.prismaService.$disconnect();
    }
}
