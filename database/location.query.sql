WITH regionResult as (
  select
    "id",
    "pointSrid",
    "lat",
    "lon",
    "type",
    "locationName",
    "country",
    COUNT(*),
    (
      6371 * acos(
        cos(radians(44.35)) * cos(radians("lat" :: float)) * cos(radians("lon" :: float) - radians(143.35)) + sin(radians(44.35)) * sin(radians("lat" :: float))
      )
    ) as kilodistance
  from
    public.location
  where
    10 > power(
      power("lat" - 44.35, 2) + power("lon" - 143.35, 2),
.5
    )
  group by
    "id"
)
select
  *,
  "kilodistance" * 0.62 as mileDistance
from
  regionResult
order by
  "kilodistance" ASC
limit
  20 offset 0