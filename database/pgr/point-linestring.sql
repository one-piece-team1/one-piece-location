-- get turn result for each linestring
WITH turn_result AS (
  SELECT
    id,
    turn.fromnode,
    turn.tonode,
    (ST_Dump(turn.geom)).geom AS geometries
  FROM
    turn
)

-- Removes duplicate rows from your result set
SELECT
  (
    -- Calculate the distance between each linestring
    ST_Distance(
      (
        -- Get geometry point data from location
        SELECT
          point
        from
          location
        where
          id = '000c520a-bedc-4801-86d1-55903010743e'
      ),
      geometries
    )
  ),
  *
FROM
  turn_result
-- Only get the nearest point
ORDER BY
  -- Get geometry point data from location
  ST_Distance(
    (
      SELECT
        point
      from
        location
      where
        id = '000c520a-bedc-4801-86d1-55903010743e'
    ),
    geometries
  )
LIMIT
  1;