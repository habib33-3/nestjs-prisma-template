export class SuccessResponse<T> {
    /**
     * HTTP status code of the response.
     */
    status: number;

    /**
     * Descriptive message about the success of the operation.
     */
    message: string;

    /**
     * The API endpoint that generated the response.
     */
    path: string;

    /**
     * The actual data returned by the API.
     */
    data: T;

    /**
     * Timestamp indicating when the response was generated.
     */
    timestamp: string;

    constructor(partial: Partial<SuccessResponse<T>>) {
        this.status = partial.status!;
        this.message = partial.message!;
        this.path = partial.path!;
        this.data = partial.data!;
        this.timestamp = partial.timestamp || new Date().toISOString();
    }
}
