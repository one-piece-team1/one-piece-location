select
  location."id",
  line."id",
  st_distance(location."pointSrid", line."lineStringSrid") dist,
  st_shortestline(location."pointSrid", line."lineStringSrid") geom
from
  public.location
  cross join lateral (
    select
      "id",
      "lineStringSrid"
    from
      public.turn
    order by
      location."pointSrid" <-> turn."lineStringSrid"
  ) line
order by
  dist
limit 10;