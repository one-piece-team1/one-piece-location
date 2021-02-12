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
        FROM
          location
        WHERE
          id = '000c520a-bedc-4801-86d1-55903010743e'
      ),
      geometries,
      true
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
      FROM
        location
      WHERE
        id = '000c520a-bedc-4801-86d1-55903010743e'
    ),
    geometries,
    true
  )
LIMIT
  1;