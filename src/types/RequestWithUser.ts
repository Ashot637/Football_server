import { type IUserTokenData } from './User';
import { type Request } from 'express';
export type RequestWithUser = Request & { user?: IUserTokenData };
