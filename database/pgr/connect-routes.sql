SELECT DISTINCT ON 
(LEAST(x.name || y.name, y.name || x.name))
	dense_rank()
		OVER(ORDER BY LEAST(x.name || y.name, y.name || x.name))::INTEGER AS id,
	x.name AS name_1,
	y.name AS name_2,
	ST_MakeLine(x.srid, y.srid)::GEOMETRY(LineString, 4326) as geom,
	ROUND(ST_Distance(x.srid::GEOGRAPHY, y.srid::GEOGRAPHY)/1000) AS distance,
    x.id AS source, 
    y.id AS target
INTO  
    turn_routes
FROM  
    public.turn x CROSS JOIN public.turn y
WHERE  
    x.id <> y.id;