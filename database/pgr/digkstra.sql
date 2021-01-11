SELECT * FROM pgr_dijkstra(
    'SELECT id, start_id::int4 as source, end_id::int4 as target, length::float as cost FROM network',
    3179, 3258
);