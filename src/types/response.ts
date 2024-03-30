export type ErrorResponse = {
  success: false;
  message: string;
  error: string;
  statusCode: number;
  type: string;
};

export type SuccessResponse = {
  success: true;
  message: string;
  data?: any;
  statusCode: number;
  type: string;
};
