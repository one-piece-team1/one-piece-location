import { ConflictException, InternalServerErrorException, Logger } from '@nestjs/common';
import { EntityManager, EntityRepository, getManager, Repository } from 'typeorm';
import { CreateTurnDto } from './dto';
import { Turn } from './turn.entity';

@EntityRepository(Turn)
export class TurnRepository extends Repository<Turn> {
  private readonly repoManager: EntityManager = getManager();
  private readonly logger: Logger = new Logger('TurnRepository');

  public async createTurn(createTurnDto: CreateTurnDto): Promise<Turn> {
    const { type, coordinates, fromNode, toNode } = createTurnDto;
    const turn = new Turn();
    turn.fromNode = fromNode;
    turn.toNode = toNode;
    turn.length = 0.0;
    turn.coordinates = coordinates;
    turn.lineString = {
      type: 'LineString',
      coordinates,
    };
    turn.lineStringSrid = {
      type: 'LineString',
      coordinates,
    };
    try {
      await turn.save();
    } catch (error) {
      throw new InternalServerErrorException();
    }
    return turn;
  }

  /**
   * @todo Final version should be using lon and lat to find nearest endNode then get plannig
   * @description Get route planning
   * @public
   * @param {number} endNode
   * @returns {Promise<Turn[]>}
   */
  public async getRoutePlanning(endNode: number): Promise<Turn[]> {
    return new Promise<Turn[]>((resolve, reject) => {
      this.repoManager
        .query(
          `
            /**
             * recursive backtracking to find the parent of the child
             */
            with recursive find_parent(fromNode, toNode, recentness) as (
              select
                "fromNode",
                "toNode",
                0
              from
                public.turn
              where
                "toNode" = ${endNode}
              union
              all
              select
                i."fromNode",
                i."toNode",
                fp.recentness + 1
              from
                public.turn i
                join find_parent fp on i."toNode" = fp.fromNode
            ),
            /**
             * create struct to store each node you have enter
             */
            construct_path(fromNode, toNode, recentness, path) as (
              select
                find_parent.fromNode,
                find_parent.toNode,
                find_parent.recentness,
                find_parent.fromNode || '.' || find_parent.toNode
              from
                find_parent
              where
                "recentness" = (
                  select
                    max("recentness")
                  from
                    find_parent
                )
              union
              select
                dd.fromNode,
                dd.toNode,
                dd.recentness,
                cp.path || '.' || cp.toNode
              from
                find_parent dd
                join construct_path cp on dd."recentness" = cp."recentness" - 1
            ),
            /**
             * create search result
             */
            search_result as (
              select
                construct_path.fromNode,
                construct_path.toNode
              from
                construct_path
              order by
                recentness desc
            )
            /**
             * mapping through the same data
             */
            select
              *
            from
              public.turn turn
            where
              exists (
                select
                  *
                from
                  search_result search
                where
                  search.fromNode = turn."fromNode"
                  AND search.toNode = turn."toNode"
              )
          `,
        )
        .then((res) => resolve(res))
        .catch((err) => {
          this.logger.log(err.message, 'GetRoutePlanning-Repo-Err');
          reject(err.message);
        });
    });
  }
}
