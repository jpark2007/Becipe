-- Add new social platform source types
alter table recipes drop constraint if exists recipes_source_type_check;
alter table recipes add constraint recipes_source_type_check
  check (source_type in ('manual','url','tiktok','instagram','facebook','x','youtube'));
