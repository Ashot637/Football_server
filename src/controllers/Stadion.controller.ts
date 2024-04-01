import type { NextFunction, Request, Response } from 'express';
import { Facilitie, Game, Stadion, User } from '../models';
import { Op } from 'sequelize';
import path from 'path';
import * as uuid from 'uuid';
import StadionFacilitie from '../models/StadionFacilitie.model';
import { ROLES } from '../types/Roles';
import bcrypt from 'bcrypt';
import { RequestWithUser } from '../types/RequestWithUser';
import StadionNotification from '../models/StadionNotification.model';

interface CreateRequest {
  title_en: string;
  title_ru: string;
  title_am: string;
  address_en: string;
  address_ru: string;
  address_am: string;
  facilitiesIds: unknown;
  name: string;
  phone: string;
  password: string;
}

const create = async (req: Request<{}, {}, CreateRequest>, res: Response, next: NextFunction) => {
  try {
    let {
      title_en,
      title_ru,
      title_am,
      address_en,
      address_ru,
      address_am,
      facilitiesIds,
      phone,
      password,
      name,
    } = req.body;
    const { img } = (req as any).files;

    const type = img.mimetype.split('/')[1];
    const fileName = uuid.v4() + '.' + type;
    img.mv(path.resolve(__dirname, '..', 'static', fileName));

    // const user = User.findOrCreate({
    //   where:{ phone},
    //   defaults: {
    //     name: 'Stadion',

    //   }
    // })

    const user = await User.findOne({
      where: {
        phone,
      },
    });

    let stadion: Stadion;
    if (user) {
      stadion = await Stadion.create({
        title_en,
        title_ru,
        title_am,
        address_en,
        address_ru,
        address_am,
        img: fileName,
        ownerId: user.id,
      });
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const stadionOwner = await User.create({
        ip: '',
        phone,
        name,
        password: passwordHash,
        role: ROLES.STADION_OWNER,
      });
      stadion = await Stadion.create({
        title_en,
        title_ru,
        title_am,
        address_en,
        address_ru,
        address_am,
        img: fileName,
        ownerId: stadionOwner.id,
      });
    }

    facilitiesIds = JSON.parse(facilitiesIds as string);

    (facilitiesIds as number[]).forEach((id) => {
      StadionFacilitie.create({
        stadionId: stadion.id,
        facilitieId: id,
      });
    });

    return res.send(stadion);
  } catch (error) {
    next(error);
  }
};

const getAll = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id, role } = req.user;
    let stadions: Stadion[];
    if (role === 'ADMIN') {
      stadions = await Stadion.findAll();
      return res.send(stadions);
    }
    stadions = await Stadion.findAll({
      where: {
        ownerId: id,
      },
    });

    return res.send(stadions);
  } catch (error) {
    next(error);
  }
};

const getAllForUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { language } = req.query;

    const stadions = await Stadion.findAll({
      attributes: [[`title_${language}`, `title`], [`address_${language}`, `address`], 'id', 'img'],
      include: [
        {
          model: Facilitie,
          as: 'facilities',
          attributes: [[`title_${language}`, `title`], 'id', 'img'],
        },
      ],
    });

    res.send(stadions);
  } catch (error) {
    next(error);
  }
};

const search = async (req: Request, res: Response, next: NextFunction) => {
  let { term, language } = req.query;
  term = term || '';
  try {
    const stadions = await Stadion.findAll({
      where: {
        [Op.or]: [
          { title_am: { [Op.iLike]: `%${term}%` } },
          { title_en: { [Op.iLike]: `%${term}%` } },
          { title_ru: { [Op.iLike]: `%${term}%` } },
        ],
      },
      attributes: [[`title_${language}`, `title`], 'id'],
    });

    res.send(stadions);
  } catch (error) {
    next(error);
  }
};

const getOne = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const stadion = await Stadion.findByPk(id, {
      include: [{ model: Facilitie, as: 'facilities' }],
    });

    if (!stadion) {
      return res.status(404).json({ success: false, message: 'Stadion not found' });
    }

    res.send(stadion);
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

    await Stadion.destroy({
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
    let { title_en, title_ru, title_am, address_en, address_ru, address_am, facilitiesIds } =
      req.body;
    const { id } = req.params;

    const stadion = await Stadion.findByPk(id);
    if (!stadion) {
      return res.status(404).json({ message: 'Stadion not found' });
    }

    stadion.address_en = address_en;
    stadion.address_ru = address_ru;
    stadion.address_am = address_am;
    stadion.title_en = title_en;
    stadion.title_ru = title_ru;
    stadion.title_am = title_am;
    if (req.files) {
      const { img } = (req as any).files;

      const type = img.mimetype.split('/')[1];
      const fileName = uuid.v4() + '.' + type;
      img.mv(path.resolve(__dirname, '..', 'static', fileName));

      stadion.img = fileName;
    }

    await StadionFacilitie.destroy({ where: { stadionId: id } });

    facilitiesIds = JSON.parse(facilitiesIds as string);

    (facilitiesIds as number[]).forEach((id) => {
      StadionFacilitie.create({
        stadionId: stadion.id,
        facilitieId: id,
      });
    });

    await stadion.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

const getAllNotifications = async (req: RequestWithUser, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    const { id } = req.user;
    const stadions = await Stadion.findAll({
      where: {
        ownerId: id,
      },
    });
    const ids = stadions.map((stadion) => stadion.id);
    const notifications = await StadionNotification.findAll({
      where: {
        stadionId: ids,
      },
      include: [
        { model: User, as: 'user' },
        { model: Stadion, as: 'stadion' },
        { model: Game, as: 'game' },
      ],
    });
    return res.send(notifications);
  } catch (error) {
    next(error);
  }
};

export default {
  create,
  getAll,
  getOne,
  remove,
  update,
  search,
  getAllForUser,
  getAllNotifications,
};
