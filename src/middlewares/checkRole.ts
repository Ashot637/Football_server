import jwt, { type GetPublicKeyOrSecret, type Secret } from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { IUserTokenData } from '../types/User';
import { ROLES } from '../types/Roles';

export default function (...roles: ROLES[]) {
  return function (req: Request, res: Response, next: NextFunction) {
    try {
      if (req.method === 'OPTIONS') {
        return next();
      }

      const token: string | undefined = req.headers?.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const decoded: IUserTokenData = jwt.verify(
        token,
        process.env.SECRET_KEY as Secret | GetPublicKeyOrSecret,
      ) as unknown as IUserTokenData;
      if (!roles?.includes(decoded?.role)) {
        return res.status(401).json({ message: "You don't have access" });
      }

      (req as Request & { user?: IUserTokenData }).user = decoded as unknown as IUserTokenData;
      next();
    } catch (e) {
      console.log('Error in authentication middleware:', e);
      res.status(401).json({ success: false, message: 'Not authenticated' });
    }
  };
}
