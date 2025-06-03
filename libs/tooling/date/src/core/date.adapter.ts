import { Injectable } from '@nestjs/common';

export abstract class DatePort {
  abstract now(): Date;

  static now(): Date {
    return new Date();
  }
}

@Injectable()
export class DateAdapter implements DatePort {
  now(): Date {
    return new Date();
  }
}

export const DatePortProvider = {
  provide: DatePort,
  useClass: DateAdapter,
};
