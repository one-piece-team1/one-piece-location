import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import * as ELocation from './enums';

@Entity()
@Unique(['locationName'])
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description srid basic fields
   */
  @Column({ type: 'point', srid: 4326, nullable: false })
  srid: string;

  @Column({ type: 'point', srid: 10004326, nullable: false })
  detailSrid: string;

  @Column({ type: 'float', nullable: false })
  lat: number;

  @Column({ type: 'float', nullable: false })
  lon: number;
  

  /**
   * @description Enum location type
   */
  @Column({
    type: 'enum',
    enum: ELocation.ELocationType,
    nullable: false,
    insert: false
  })
  type: ELocation.ELocationType

  @Column({ type: 'enum', nullable: false })
  locationName: string;

  @Column({ type: 'varchar', nullable: true })
  country?: string;

  /**
   * @description Time area
   */
  @CreateDateColumn({ type: 'timestamp', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: false })
  updatedAt: Date;

  @BeforeInsert()
  updateWhenInsert() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @BeforeUpdate()
  updateDateWhenUpdate() {
    this.updatedAt = new Date();
  }
}