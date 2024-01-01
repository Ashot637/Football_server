import { Stadion } from '../models';
import StadionFacilitie from '../models/StadionFacilitie.model';

const firstStadion = {
  title_en: 'Gazprom Armenia Grand Football Hall',
  title_ru: 'Футбольный зал Grand Gazprom Armenia',
  title_am: 'Գրանդ Գազպրոմ Արմենիա» ֆուտբոլային դահլիճ',
  address_en: 'Yerevan Building 55/25, Tsarav Aghbyuri str',
  address_ru: 'Ереван, Здание 55/25, улица Царав Агбюри',
  address_am: 'Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․',
  img: '2f04744a-45c0-4002-a61f-7cb0fb74ca5d.png',
} as Stadion;

const secondStadion = {
  title_en: 'Camp Nou',
  title_ru: 'Камп Ноу',
  title_am: 'Կամպ Նու',
  address_en: 'Barcelona, Carrer dAristides Maillol',
  address_ru: 'Барселона, улица Аристидеса Майоля',
  address_am: 'Բարսելոնա, Արիստիդես Մայոլ փող.',
  img: '2f04744a-45c0-4002-a61f-7cb0fb74ca5d.png',
} as Stadion;

export default async () => {
  await Stadion.create(firstStadion);
  await Stadion.create(secondStadion);

  for (let i = 1; i < 5; i++) {
    StadionFacilitie.create({
      stadionId: 1,
      facilitieId: i,
    });
  }

  for (let i = 1; i < 3; i++) {
    StadionFacilitie.create({
      stadionId: 2,
      facilitieId: i,
    });
  }
};
