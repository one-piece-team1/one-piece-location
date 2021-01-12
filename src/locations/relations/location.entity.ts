import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Point } from 'geojson';
import * as ELocation from '../enums';
import { Country } from './country.entity';

@Entity()
@Unique(['locationName'])
export class Location extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  id: number;

  /**
   * @description location Point fields with point & srid & lon & lat
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
  @Index({ spatial: true })
  pointSrid: Point;

  @Column({ type: 'float', nullable: false })
  lat: number;

  @Column({ type: 'float', nullable: false })
  lon: number;

  @Column({ type: 'float', nullable: true })
  length?: number;

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

  @ManyToOne(() => Country, { cascade: true, nullable: true })
  @JoinColumn()
  country?: Country;

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
