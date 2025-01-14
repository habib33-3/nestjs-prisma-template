export class StandardResponseDto<T> {
    success: boolean;

    statusCode: number;

    message: string;

    timestamp: string;

    path: string;

    data?: T;

    error?: string;
}
