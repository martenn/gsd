import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('counter')
  getCounter(): { count: number } {
    return { count: this.appService.getCounter() };
  }

  @Post('counter/increment')
  incrementCounter(): { count: number } {
    return { count: this.appService.incrementCounter() };
  }
}
