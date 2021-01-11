select 
	*,
	ST_AsText("lineStringSrid") as "line",
	ST_Length("lineStringSrid") as "length"
from public.turn 
where 
	"id" = '11b10b54-1019-46fe-bf52-797bb8b41389'