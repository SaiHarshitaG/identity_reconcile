export const successResponse = (data: any) => {
  return {
    success: true,
    ...data,
  };
};

export const errorResponse = (message: string) => {
  return {
    success: false,
    message,
  };
};