select
  "id",
  "pointSrid",
  "lat",
  "lon",
  "type",
  "locationName",
  "country",
  (
    6371 * acos(
      cos(radians(44.35)) * cos(radians("lat" :: float)) * cos(radians("lon" :: float) - radians(143.35)) + sin(radians(44.35)) * sin(radians("lat" :: float))
    )
  ) as kilodistance
from
  public.location
where
  1 > power(power("lat" - 44.35, 2) + power("lon" - 143.35, 2), .5)
group by
  "id"
order by
  "kilodistance" DESC
limit 10;