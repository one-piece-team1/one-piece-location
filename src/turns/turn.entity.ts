import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { LineString, Point, Position } from 'geojson';
import * as ELocation from './enums';

@Entity()
export class Turn extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  /**
   * @description location Point fields with point & srid & lon & lat
   */
  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  point: Point;

  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: {
      to(value: Point): Point {
        return value;
      },
      from(value: { coordinates: number[] }): Point {
        return { type: 'Point', coordinates: value.coordinates };
      },
    },
  })
  srid: Point;

  @Column({ type: 'float', nullable: false })
  lat: number;

  @Column({ type: 'float', nullable: false })
  lon: number;

  @Column({ type: 'float', nullable: true })
  length?: number;

  @Column({ type: 'float', nullable: true })
  fromnode?: number;

  @Column({ type: 'float', nullable: true })
  tonode?: number;

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
