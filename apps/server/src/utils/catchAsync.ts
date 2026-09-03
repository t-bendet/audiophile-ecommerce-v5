import { NextFunction, Request, RequestHandler, Response } from "express";

export default <TRequest extends Request = Request>(
    fn: (req: TRequest, res: Response, next: NextFunction) => Promise<unknown>,
  ): RequestHandler =>
  (req, res, next) => {
    fn(req as TRequest, res, next).catch((err: Error) => next(err));
  };
