import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LineString } from 'geojson';
import * as ELocation from './enums';

@Entity()
export class Turn extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * @description location LineString fields with LineString & LineStringSrid
   */
  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'LineString',
  })
  lineString: LineString;

  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'LineString',
    srid: 4326,
  })
  lineStringSrid: LineString;

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
