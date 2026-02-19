import { NextFunction, Request, Response } from "express";

export default <TRequest extends Request = Request>(
    fn: (req: TRequest, res: Response, next: NextFunction) => Promise<any>
  ) =>
  (req: TRequest, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err: Error) => next(err));
  };
