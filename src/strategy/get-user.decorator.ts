import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from './interfaces';

export const CurrentUser = createParamDecorator(
  /**
   * @description Get current user decorator
   * @public
   * @param {unknown} data
   * @param {ExecutionContext} ctx
   * @returns {unknown | JwtPayload}
   */
  (data: unknown, ctx: ExecutionContext): unknown | JwtPayload => {
    const user: unknown | JwtPayload = ctx.switchToHttp().getRequest<Request>().user;
    return user;
  },
);
