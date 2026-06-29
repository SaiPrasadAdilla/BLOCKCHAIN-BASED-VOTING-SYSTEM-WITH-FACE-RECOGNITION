import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlockchainController } from './blockchain.controller';
import { BlockchainService } from './blockchain.service';
import {
  BlockchainRecordEntry,
  blockchainRecordSchema,
} from '../../schemas/blockchain-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlockchainRecordEntry.name, schema: blockchainRecordSchema },
    ]),
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService],
})
export class BlockchainModule {}
