type TSort = 'ASC' | 'DESC';

export interface IPage {
  take?: number;
  skip?: number;
}
export interface ISearch extends IPage {
  keyword?: string;
  sort?: TSort;
  [futureKey: string]: any;
}

export interface IQueryPaging extends IPage {
  select?: any[];
  order: {
    [futureKey: string]: TSort;
  };
  where?: {
    [futureKey: string]: any;
  };
  [futureKey: string]: any;
}
