SELECT * FROM pgr_dijkstra(
    'SELECT id, start_id::int4 as source, end_id::int4 as target, length::float as cost FROM network',
    3179, 3258
);

WITH route_plan AS
(
	SELECT
		*
	FROM 
		public.turn
	JOIN
	(
		SELECT
			*
		FROM
			pgr_dijkstra(
				'select id, fromnode::int as source, tonode::int as target, length as cost from public.turn',
				182391,
				202502
			)
	) AS route
	ON 
		turn.tonode = route.node
    order by seq
)

SELECT 
	ST_MakeLine(route_plan.srid) as geom
FROM route_plan;