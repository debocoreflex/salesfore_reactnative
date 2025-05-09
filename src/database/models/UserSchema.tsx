
import field from "@nozbe/watermelondb/decorators/field";
import { Model } from '@nozbe/watermelondb';

export class UserSchema extends Model {
  static table = 'Users';
  @field('mobile') mobile!: string; 
  @field('name') name!: string;
  @field('dob') dob!: string;
  @field('marital_status') maritalStatus!: string;
  @field('experience') experience!: string;
  @field('gender') gender!: string;

}

