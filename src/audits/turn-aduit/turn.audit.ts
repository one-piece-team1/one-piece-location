import { InternalServerErrorException } from '@nestjs/common';
import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';
import { Turn } from '../../turns/turn.entity';
import { TurnAuditLog } from './turn-audit.entity';
import * as EAudit from '../enums';

@EventSubscriber()
export class TurnAuditSubscriber implements EntitySubscriberInterface<Turn> {
  /**
   * @description Listen to turn entity changing
   * @public
   * @returns {Turn}
   */
  public listenTo() {
    return Turn;
  }

  /**
   * @description Called after entity insertion
   * @event
   * @create
   * @public
   * @param {InsertEvent<Turn>} event
   */
  public afterInsert(event: InsertEvent<Turn>) {
    this.insertCreateEvent(event.entity);
  }

  /**
   * @description Called after entity update
   * @event
   * @update
   * @public
   * @param {UpdateEvent<Turn>} event
   */
  public afterUpdate(event: UpdateEvent<Turn>) {
    this.insertUpdateEvent(event);
  }

  /**
   * @description Called after entity delete
   * @event
   * @remove
   * @public
   * @param {RemoveEvent<Turn>} event
   */
  public afterRemove(event: RemoveEvent<Turn>) {
    this.insertDeleteEvent(event.entity);
  }

  /**
   * @description Insert create turn log
   * @private
   * @param {Turn} event
   */
  private async insertCreateEvent(event: Turn) {
    const auditLog = new TurnAuditLog();
    auditLog.version = event.version;
    auditLog.turnId = event.id;
    auditLog.type = EAudit.EAduitType.CREATE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert update turn log
   * @private
   * @param {UpdateEvent<Turn>} event
   */
  private async insertUpdateEvent(event: UpdateEvent<Turn>) {
    const auditLog = new TurnAuditLog();
    auditLog.version = event.entity.version;
    auditLog.turnId = event.entity.id;
    auditLog.type = EAudit.EAduitType.UPDATE;
    auditLog.updateAlias = event.updatedColumns.map((col) => col.databaseName).join(',');
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  /**
   * @description Insert delete turn log
   * @public
   * @param {Turn} event
   */
  private async insertDeleteEvent(event: Turn) {
    const auditLog = new TurnAuditLog();
    auditLog.version = event.version;
    auditLog.turnId = event.id;
    auditLog.type = EAudit.EAduitType.DELETE;
    try {
      await auditLog.save();
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}
