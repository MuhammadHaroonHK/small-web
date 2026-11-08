import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PersonDocument = HydratedDocument<Person>;

@Schema({
  timestamps: {
    createdAt: true,
    updatedAt: false,
  },
})
export class Person {
  @Prop({
    required: true,
    trim: true,
    minlength: 1,
  })
  name!: string;

  createdAt!: Date;
}

export const PersonSchema = SchemaFactory.createForClass(Person);

PersonSchema.index(
  { name: 1 },
  {
    unique: true,
    collation: {
      locale: 'en',
      strength: 2,
    },
  },
);
