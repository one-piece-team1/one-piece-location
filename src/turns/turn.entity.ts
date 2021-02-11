import { BaseEntity, BeforeInsert, BeforeUpdate, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Point, LineString } from 'geojson';

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
    spatialFeatureType: 'LineString',
    srid: 4326,
  })
  @Index({ spatial: true })
  geom: LineString;

  @Column({
    type: 'geometry',
    nullable: false,
    spatialFeatureType: 'LineString',
    srid: 4326,
  })
  srid: LineString;

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
