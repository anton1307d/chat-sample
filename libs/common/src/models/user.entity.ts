import { AbstractEntity } from '../database';
import { Column, Entity } from 'typeorm';

@Entity()
export class User extends AbstractEntity<User> {
  @Column()
  email: string;

  @Column()
  name: string;
}
