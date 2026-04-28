import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from '../domain/address.entity';
import { SoftDeleteRepository } from '../../../common/repositories/soft-delete.repository';

@Injectable()
export class AddressRepository extends SoftDeleteRepository<Address> {
  constructor(
    @InjectRepository(Address)
    repo: Repository<Address>,
  ) {
    super(repo);
  }
}
