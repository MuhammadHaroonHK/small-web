import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Person } from '../../people/schemas/person.schema.js';

export type SiteDocument = HydratedDocument<Site>;

@Schema({
  timestamps: true,
})
export class Site {
  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    minlength: 1,
  })
  address!: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
  })
  title!: string;

  @Prop({
    required: true,
  })
  html!: string;

  @Prop({
    required: true,
  })
  textContent!: string;

  @Prop({
    type: Types.ObjectId,
    ref: Person.name,
    required: true,
  })
  authorId!: Types.ObjectId;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SiteSchema = SchemaFactory.createForClass(Site);

SiteSchema.index({ address: 1 }, { unique: true });
SiteSchema.index({ title: 'text', textContent: 'text' });
