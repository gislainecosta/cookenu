SELECT COUNT(*) as quantity FROM SHOWS_LAMA
WHERE week_day = "Sexta" AND(
    (9 > start_time AND 8 < start_time AND 9 < end_time) OR
    (8 <= end_time AND 9 < end_time AND 8 > end_time) OR
    (9 < start_time AND 8 >= end_time AND 9 <= start_time AND 9 < end_time) OR
    (9 >= start_time AND 8 <= end_time AND 8 >= start_time)
)