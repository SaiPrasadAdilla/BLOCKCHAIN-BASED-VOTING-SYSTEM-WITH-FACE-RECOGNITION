import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockchainRecordDocument = BlockchainRecordEntry & Document;

@Schema({ timestamps: true })
export class BlockchainRecordEntry {
  @Prop({ required: true, index: true, unique: true })
  txHash: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  data: string;

  @Prop({ required: true })
  blockNumber: number;

  @Prop({ required: true })
  network: string;

  @Prop()
  entityId: string;

  @Prop()
  entityName: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;
}

export const blockchainRecordSchema = SchemaFactory.createForClass(
  BlockchainRecordEntry,
);
