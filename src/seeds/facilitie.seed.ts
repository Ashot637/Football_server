import { Facilitie } from '../models';

const facilities = [
  {
    title_en: 'First AID box',
    title_ru: 'Аптечка первой помощи',
    title_am: 'ԱԲՕ արկղ',
    img: '2fbb10c6-2fa0-43aa-a72d-1875281c5792.png',
  },
  {
    title_en: 'Seating area',
    title_ru: 'Зона отдыха',
    title_am: 'Նստատեղեր',
    img: '2fbb10c6-2fa0-43aa-a72d-1875281c5792.png',
  },
  {
    title_en: 'Cafeteria',
    title_ru: 'Кафетерий',
    title_am: 'Սրճարան',
    img: '2fbb10c6-2fa0-43aa-a72d-1875281c5792.png',
  },
  {
    title_en: 'WI-FI connection',
    title_ru: 'Подключение WI-FI',
    title_am: 'WI-FI միացում',
    img: '2fbb10c6-2fa0-43aa-a72d-1875281c5792.png',
  },
] as Facilitie[];

export default () => {
  for (const item of facilities) {
    Facilitie.create(item);
  }
};
