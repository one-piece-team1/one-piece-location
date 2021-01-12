WITH RECURSIVE 
x AS (
  SELECT
    "fromNode"
  FROM
    public.turn
  WHERE
    "fromNode" = 4440
),
a AS (
  SELECT
    b."fromNode",
    b."toNode",
    b."length" as weight,
	b."length" as total,
    b."fromNode" || ',' || b."toNode" || ',' AS path
  FROM
    public.turn b
    LEFT JOIN x ON x."fromNode" = b."fromNode"
  WHERE
    b."fromNode" = 3922
    AND (
      x."fromNode" IS NULL -- no point with edge to target
      OR b."toNode" = 4440
    ) -- except with target_node
  UNION
  ALL
  SELECT
    a."fromNode",
    b."toNode",
    least(a.weight, b.length),
	a.total + b.length as sum_length,
    a.path || b."toNode" || ',' AS path
  FROM
    a
    JOIN public.turn AS b ON b."fromNode" = a."toNode"
    LEFT JOIN x ON x."fromNode" = b."fromNode"
  WHERE
    a."toNode" <> 4440 -- arrived at target
    AND a.path !~~ ('%' || b."toNode" || ',%') -- not visited yet
    AND (
      x."fromNode" IS NULL -- no point with edge to target
      OR b."toNode" = 4440
    ) -- except with target_node
),
traverse_result as
(
  select * from a where "fromNode" = 3922 and "toNode" = 4440
)
select 
	* 
from 
	traverse_result