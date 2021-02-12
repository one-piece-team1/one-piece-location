WITH route_plan AS
(
	SELECT
		*,
		ST_Length(turn.srid, true) AS route_legnth
	FROM 
		turn
	JOIN
	(
		SELECT
			*
		FROM
			pgr_dijkstra(
				'SELECT id, fromnode::int AS source, tonode::int AS target, length AS cost FROM turn',
				2945,
				26349
			)
	) AS route
	ON 
		turn.fromnode = route.node
    ORDER BY seq
)

SELECT 
	ST_MakeLine(route_plan.srid) AS geom
FROM route_plan
WHERE route_legnth IN
(
	SELECT 
		MIN(route_legnth)
	FROM route_plan
	GROUP BY fromnode
)