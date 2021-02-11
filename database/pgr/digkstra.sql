WITH route_plan AS
(
	SELECT
		*,
		ST_Length(turn.srid) as route_legnth
	FROM 
		public.turn
	JOIN
	(
		SELECT
			*
		FROM
			pgr_dijkstra(
				'select id, fromnode::int as source, tonode::int as target, length as cost from public.turn',
				2945,
				26349
			)
	) AS route
	ON 
		turn.fromnode = route.node
    order by seq
)

SELECT 
	ST_MakeLine(route_plan.srid) as geom
FROM route_plan
where route_legnth in
(
	select 
		MIN(route_legnth)
	from route_plan
	group by fromnode
)