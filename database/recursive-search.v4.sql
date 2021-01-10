WITH RECURSIVE start_node AS (
  -- for readability and convenience:
  SELECT

    "fromNode" AS node_s
  from
    public.turn
  where
    id = '37c81bdc-6479-4beb-93d4-dabcbc6ea3bb'
  limit
    1
), end_node as (
  SELECT
    "toNode" AS node_t
  from
    public.turn
  where
    id = '6312befb-ca0e-476d-93b2-dba9e41d0118'
  limit
    1
), t as (
  select
    *
  from
    start_node
    cross join end_node
),
x AS (
  SELECT
    "fromNode"
  FROM
    t,
    public.turn
  WHERE
    "fromNode" = node_t
),
a AS (
  SELECT
    b."fromNode",
    b."toNode",
    b."length" as weight,
	b."length" as total,
    b."fromNode" || '.' || b."toNode" || '.' AS path
  FROM
    t,
    public.turn b
    LEFT JOIN x ON x."fromNode" = b."fromNode"
  WHERE
    b."fromNode" = node_s
    AND (
      x."fromNode" IS NULL -- no point with edge to target
      OR b."toNode" = node_t
    ) -- except with target_node
  UNION
  ALL
  SELECT
    a."fromNode",
    b."toNode",
    least(a.weight, b.length),
	a.total + b.length as sum_length,
    a.path || b."toNode" || '.' AS path
  FROM
    t,
    a
    JOIN public.turn AS b ON b."fromNode" = a."toNode"
    LEFT JOIN x ON x."fromNode" = b."fromNode"
  WHERE
    a."toNode" <> node_t -- arrived at target
    AND a.path !~~ ('%' || b."toNode" || '.%') -- not visited yet
    AND (
      x."fromNode" IS NULL -- no point with edge to target
      OR b."toNode" = node_t
    ) -- except with target_node
) TABLE a;
ORDER BY total ASC;