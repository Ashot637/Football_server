import type { NextFunction, Request, Response } from 'express';

class MyCustomError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MyCustomError';
  }
}

const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.log(err);

  if (err.name === 'SequelizeValidationError') {
    const validationErrors = (err as any).errors.map(
      (validationError: any) => validationError.message,
    );
    return res
      .status(400)
      .json({ success: false, message: 'Validation error', errors: validationErrors });
  }

  if (err instanceof MyCustomError) {
    return res.status(400).json({ success: false, message: err.message });
  }

  res.status(500).json({ success: false, message: 'Internal Server Error' });
};

export default errorHandler;
