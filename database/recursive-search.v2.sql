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
    "toNode" = 4440
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