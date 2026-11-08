import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Person } from '../../people/schemas/person.schema.js';

export const VISIT_SOURCES = [
  'typed',
  'link',
  'back',
  'forward',
  'history',
  'search',
] as const;

export type VisitSource = (typeof VISIT_SOURCES)[number];
export type VisitDocument = HydratedDocument<Visit>;

@Schema({
  timestamps: {
    createdAt: false,
    updatedAt: false,
  },
})
export class Visit {
  @Prop({
    type: Types.ObjectId,
    ref: Person.name,
    required: true,
  })
  personId!: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    minlength: 1,
    lowercase: true,
  })
  address!: string;

  @Prop({
    required: true,
    trim: true,
  })
  title!: string;

  @Prop({
    required: true,
    default: Date.now,
  })
  visitedAt!: Date;

  @Prop({
    required: true,
    enum: VISIT_SOURCES,
  })
  source!: VisitSource;
}

export const VisitSchema = SchemaFactory.createForClass(Visit);

VisitSchema.index({ personId: 1, visitedAt: -1, _id: -1 });
