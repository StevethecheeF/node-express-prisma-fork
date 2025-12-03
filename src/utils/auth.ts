import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: any;
}

const getTokenFromHeaders = (req: Request): string | null => {
  const auth = req.headers.authorization;
  if (!auth) return null;

  const [scheme, token] = auth.split(" ");

  if ((scheme === "Token" || scheme === "Bearer") && token) {
    return token;
  }

  return null;
};

const required = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = getTokenFromHeaders(req);

  if (!token) {
    return res.status(401).json({ errors: { body: ["Authorization required"] } });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "superSecret");
    next();
  } catch {
    return res.status(401).json({ errors: { body: ["Invalid token"] } });
  }
};

const optional = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = getTokenFromHeaders(req);

  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || "superSecret");
    } catch {
      // credentials are not required
    }
  }

  next();
};

const auth = {
  required,
  optional,
};

export default auth;
