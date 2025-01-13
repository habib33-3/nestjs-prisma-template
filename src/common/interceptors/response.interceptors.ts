import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from "@nestjs/common";

import { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { SuccessResponse } from "../dto/response.dto";

@Injectable()
export class ResponseInterceptor<T>
    implements NestInterceptor<T, SuccessResponse<T>>
{
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<SuccessResponse<T>> {
        const httpContext = context.switchToHttp();
        const request = httpContext.getRequest<Request>();
        const response = httpContext.getResponse();

        return next.handle().pipe(
            map((data) => {
                return new SuccessResponse<T>({
                    status: response.statusCode,
                    message: this.getMessageByStatus(
                        response.statusCode as number,
                    ),
                    path: request.url,
                    data,
                });
            }),
        );
    }

    private getMessageByStatus(status: number): string {
        const statusMessages: Record<number, string> = {
            200: "Request successful",
            201: "Resource created successfully",
            204: "No content",
        };
        return statusMessages[status] || "Success";
    }
}
