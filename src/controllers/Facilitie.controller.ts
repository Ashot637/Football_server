import type { NextFunction, Request, Response } from 'express';
import { Facilitie } from '../models';
import path from 'path';
import * as uuid from 'uuid';
import { Op } from 'sequelize';

interface CreateRequest {
  title_en: string;
  title_ru: string;
  title_am: string;
}

const create = async (req: Request<{}, {}, CreateRequest>, res: Response, next: NextFunction) => {
  try {
    const { title_en, title_ru, title_am } = req.body;
    const { img } = (req as any).files;

    const type = img.mimetype.split('/')[1];
    const fileName = uuid.v4() + '.' + type;
    img.mv(path.resolve(__dirname, '..', 'static', fileName));

    const facilitie = Facilitie.create({
      title_en,
      title_am,
      title_ru,
      img: fileName,
    });

    res.send(facilitie);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilities = await Facilitie.findAll();

    res.send(facilities);
  } catch (error) {
    next(error);
  }
};

const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const facilitie = await Facilitie.findByPk(id);

    if (!facilitie) {
      return res.status(404).json({ success: false, message: 'Facilitie not found' });
    }

    res.send(facilitie);
  } catch (error) {
    next(error);
  }
};

interface RemoveRequest {
  ids: number[];
}

const remove = async (req: Request<{}, {}, RemoveRequest>, res: Response, next: NextFunction) => {
  try {
    const { ids } = req.body;

    await Facilitie.destroy({
      where: {
        id: {
          [Op.in]: ids,
        },
      },
    });

    res.send({ success: true });
  } catch (error) {
    next(error);
  }
};

const update = async (
  req: Request<{ id: string }, {}, CreateRequest>,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { title_en, title_am, title_ru } = req.body;
    const { id } = req.params;

    const facilitie = await Facilitie.findByPk(id);
    if (!facilitie) {
      return res.status(404).json({ message: 'Facilitie not found' });
    }

    facilitie.title_en = title_en;
    facilitie.title_ru = title_ru;
    facilitie.title_am = title_am;
    if (req.files) {
      const { img } = (req as any).files;

      const type = img.mimetype.split('/')[1];
      const fileName = uuid.v4() + '.' + type;
      img.mv(path.resolve(__dirname, '..', 'static', fileName));

      facilitie.img = fileName;
    }

    await facilitie.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getAll,
  getOne,
  update,
  remove,
};
