import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import '../../common/types/express';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user;
});
