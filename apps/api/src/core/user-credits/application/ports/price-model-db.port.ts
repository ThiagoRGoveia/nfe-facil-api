import { Injectable } from '@nestjs/common';
import { PriceModel } from '../../domain/entities/price-model.entity';
import { RequiredEntityData } from '@mikro-orm/core';

@Injectable()
export abstract class PriceModelDbPort {
  abstract findById(id: string): Promise<PriceModel | null>;
  abstract findByProcessCode(processCode: string): Promise<PriceModel[]>;
  abstract findDefaultByProcessCode(processCode: string): Promise<PriceModel | null>;
  abstract findActiveByProcessCode(processCode: string): Promise<PriceModel[]>;
  abstract save(priceModel: PriceModel): Promise<void>;
  abstract update(priceModel: Partial<RequiredEntityData<PriceModel>>): PriceModel;
  abstract create(priceModel: RequiredEntityData<PriceModel>): PriceModel;
  abstract delete(id: string): Promise<void>;
}
