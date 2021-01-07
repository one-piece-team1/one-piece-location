import {
  BaseEntity,
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Point } from 'geojson';
import * as ELocation from './enums';

@Entity()
@Unique(['locationName'])
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description srid basic fields
   */
  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'Point',
  })
  point: Point;

  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  srid: Point;

  @Column({ type: 'float', nullable: false })
  lat: number;

  @Column({ type: 'float', nullable: false })
  lon: number;

  /**
   * @description Enum location type
   */
  @Column({
    type: 'simple-enum',
    enum: ELocation.ELocationType,
    nullable: false,
  })
  type: ELocation.ELocationType;

  @Column({ type: 'varchar', nullable: false })
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
