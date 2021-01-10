with recursive -- CTE
inputs as (3922 :: float as i_source, 4440 :: float as i_target),
traverse_path(filter, source, target, path, bingo) as (
  select
    t."fromNode",
    t."toNode",
    t."toNode",
    t."fromNode" || '.' || t."toNode",
    max((t."toNode" = i.i_target) :: int) over(partition by t."fromNode") :: bool
  from
    public.turn t
    cross join inputs i
  where
    t."fromNode" = i.i_source
  union
  select
    tp.filter,
    pt."fromNode",
    pt."toNode",
    path || '.' || pt."toNode",
    max((pt."toNode" = i.i_target) :: int) over(partition by pt."fromNode") :: bool
  from
    public.turn pt
    cross join inputs i
    join traverse_path tp on pt."fromNode" = tp.target
)

select
  tp.*
from
  traverse_path tp cross join inputs i
where
  not tp.bingo
  or
  (
    tp.bingo and tp.target = i."i_target"
  )