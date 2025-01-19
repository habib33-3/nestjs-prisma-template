import { Injectable } from "@nestjs/common";

@Injectable()
export class QueryBuilderService {
    buildPaginationQuery(filters: { page?: number; pageSize?: number }): {
        skip: number;
        take: number;
    } {
        const page = filters.page || 1;
        const pageSize = filters.pageSize || 10;
        const skip = (page - 1) * pageSize;
        return { skip, take: pageSize };
    }

    buildSortingQuery<T>(filters: {
        sortBy?: keyof T;
        sortOrder?: "asc" | "desc";
    }): Array<Record<string, "asc" | "desc">> {
        const { sortBy = "createdAt", sortOrder = "asc" } = filters;
        return [{ [sortBy as string]: sortOrder }];
    }

    buildSearchQuery<T>(
        search: string | undefined,
        searchableFields: Array<keyof T>,
    ): Array<Record<string, unknown>> | undefined {
        if (!search) return undefined;
        return searchableFields.map((field) => ({
            [field as string]: { contains: search, mode: "insensitive" },
        }));
    }

    buildFilterQuery<T extends Record<string, unknown>>(
        filters: Partial<T>,
    ): Record<string, unknown> {
        const where: Record<string, unknown> = {};
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                if (Array.isArray(value)) {
                    where[key] = { hasSome: value };
                } else if (typeof value === "string") {
                    where[key] = { contains: value, mode: "insensitive" };
                } else {
                    where[key] = value;
                }
            }
        });
        return where;
    }
}
