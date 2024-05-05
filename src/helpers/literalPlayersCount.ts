import { type ProjectionAlias, literal } from "sequelize";

const literalPlayersCount: ProjectionAlias = [
  literal(
    `(SELECT COUNT(*) FROM "UserGames" WHERE "UserGames"."gameId" = "Game"."id" AND "UserGames"."willPlay" = true)`
  ),
  "playersCount",
];

export default literalPlayersCount;
