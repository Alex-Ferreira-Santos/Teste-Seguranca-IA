import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {

  console.error(err.message);

  return res.status(500).json({
    error: "Erro interno"
  });
}