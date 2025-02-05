import { Injectable, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import { useDbSchema, useDbDrop } from './db-schema.seed';

@Injectable()
export class DatabaseLifecycleService implements OnApplicationBootstrap, OnApplicationShutdown {
  private dbName: string;

  constructor(private readonly orm: MikroORM) {}

  async onApplicationBootstrap() {
    this.dbName = await useDbSchema(this.orm);
  }

  async onApplicationShutdown() {
    if (this.dbName) {
      await useDbDrop(this.orm, this.dbName);
    }
  }
}
