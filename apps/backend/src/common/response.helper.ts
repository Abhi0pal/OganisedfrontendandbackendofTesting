
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export class ResponseHelper {
  static success<T>(message: string, data?: T): ApiResponse<T> {
    return {
      success: true,
      message,
      ...(data !== undefined && { data }),
    };
  }

  static error(message: string, error?: any): ApiResponse {
    return {
      success: false,
      message,
      ...(error !== undefined && { error }),
    };
  }
}
