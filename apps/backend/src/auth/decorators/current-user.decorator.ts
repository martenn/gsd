import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface RequestWithUser<T = unknown> extends Request {
  user?: T;
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<RequestWithUser>();
  return request.user;
});
