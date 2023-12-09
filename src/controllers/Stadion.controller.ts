import type { NextFunction, Request, Response } from 'express';
import { Stadion } from '../models';

interface CreateRequest {
  title: string;
  address: string;
}

export const create = async (
  req: Request<{}, {}, CreateRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title, address } = req.body;

    const stadion = await Stadion.create({
      title,
      address,
    });

    res.send(stadion);
  } catch (error) {
    next(error);
  }
};

export default {
  create,
};
