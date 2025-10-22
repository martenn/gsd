import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  private counter = 0;

  getHello(): string {
    return 'Hello World!';
  }

  getCounter(): number {
    return this.counter;
  }

  incrementCounter(): number {
    this.counter++;
    return this.counter;
  }
}
