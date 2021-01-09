import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LineString } from 'geojson';

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

  @Column({ type: 'simple-array', nullable: false })
  coordinates: unknown;

  @Column({ type: 'float', nullable: false })
  fromNode: number;

  @Column({ type: 'float', nullable: false })
  toNode: number;

  @Column({ type: 'float', nullable: false })
  length: number;

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
