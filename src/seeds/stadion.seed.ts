import { Stadion } from "../models";
import StadionFacilitie from "../models/StadionFacilitie.model";

const img = "2f04744a-45c0-4002-a61f-7cb0fb74ca5d.png";
const stadions = [
  {
    title_en: "Gazprom Armenia Grand Football Hall",
    title_ru: "Футбольный зал Grand Gazprom Armenia",
    title_am: "Գրանդ Գազպրոմ Արմենիա ֆուտբոլային դահլիճ",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_ru: "Avan Academy Football Hall",
    title_am: "Avan Academy Football Hall",
    title_en: "Avan Academy Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Grand Sport Football Hall",
    title_ru: "Grand Sport Football Hall",
    title_am: "Grand Sport Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "YSU Football Hall",
    title_ru: "YSU Football Hall",
    title_am: "YSU Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Russian-Armenian University Football Hall",
    title_ru: "Russian-Armenian University Football Hall",
    title_am: "Russian-Armenian University Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Hils Football Hall",
    title_ru: "Hils Football Hall",
    title_am: "Hils Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Mika Football Hall",
    title_ru: "Mika Football Hall",
    title_am: "Mika Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Tec arena Football Hall",
    title_ru: "Tec arena Football Hall",
    title_am: "Tec arena Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Orange fitnes Football Hall",
    title_ru: "Orange fitnes Football Hall",
    title_am: "Orange fitnes Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Kilika Football Hall",
    title_ru: "Kilika Football Hall",
    title_am: "Kilika Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Dintes Football Hall",
    title_ru: "Dintes Football Hall",
    title_am: "Dintes Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Polytech Football Hall",
    title_ru: "Polytech Football Hall",
    title_am: "Polytech Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Kanaz Football Hall",
    title_ru: "Kanaz Football Hall",
    title_am: "Kanaz Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
  {
    title_en: "Urartu Football Hall",
    title_ru: "Urartu Football Hall",
    title_am: "Urartu Football Hall",
    address_en: "Yerevan Building 55/25, Tsarav Aghbyuri str",
    address_ru: "Ереван, Здание 55/25, улица Царав Агбюри",
    address_am: "Երեւան, շենք 55/25, Ծարավ Աղբյուր փող․",
    img,
  },
] as Stadion[];

export default async () => {
  await Stadion.bulkCreate(stadions);

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
