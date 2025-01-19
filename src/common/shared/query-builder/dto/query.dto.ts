import { Transform } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString } from "class-validator";

export class PaginationQueryDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    @Transform(({ value }: { value: string | number }) =>
        parseInt(value as string, 10),
    )
    @IsInt()
    page: number = 1;

    @IsOptional()
    @Transform(({ value }: { value: string | number }) =>
        parseInt(value as string, 10),
    )
    @IsInt()
    pageSize: number = 10;

    @IsOptional()
    @IsIn(["asc", "desc"])
    sortOrder: "asc" | "desc" = "asc";

    @IsOptional()
    @IsString()
    sortBy: string = "createdAt";
}
