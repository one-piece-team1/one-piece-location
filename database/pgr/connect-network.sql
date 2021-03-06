-- Start with creating start and end point geometries
CREATE
OR REPLACE VIEW path_text AS
SELECT
  *,
  ST_StartPoint(turn.srid) as startpoint,
  ST_EndPoint(turn.srid) as endpoint
FROM
  public.turn

-- Create a table containing all the unique network nodes and assign them an incrementing id
CREATE TABLE node AS
SELECT
  row_number() OVER (
    ORDER BY
      networkNode.node
  ) :: integer AS id,
  networkNode.node AS the_geom
FROM
  (
    SELECT
      DISTINCT path_text.startpoint AS node
    FROM
      path_text
    UNION
    SELECT
      DISTINCT path_text.endpoint AS node
    FROM
      path_text
  ) networkNode
GROUP BY
  networkNode.node;

-- Combine pathtext view and node table to create the routable network table
CREATE TABLE network AS
SELECT
  subPath.*,
  subNodeLeft.id as start_id,
  subNodeRight.id as end_id
FROM
  path_text AS subPath
  JOIN node AS subNodeLeft ON subPath.startpoint = subNodeLeft.the_geom
  JOIN node AS subNodeRight ON subPath.endpoint = subNodeRight.the_geom;