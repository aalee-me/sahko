-- Run once in your new Supabase project's SQL Editor. Additive Sähkö-only objects.
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create table if not exists public.sahko_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 handle text not null unique check(handle ~ '^[a-z][a-z0-9_]{2,23}$'),
 display_name text not null check(length(display_name) between 1 and 40),
 created_at timestamptz not null default now()
);
create table if not exists public.sahko_friendships (
 requester uuid not null references public.sahko_profiles(id) on delete cascade,
 recipient uuid not null references public.sahko_profiles(id) on delete cascade,
 status text not null default 'pending' check(status in ('pending','accepted')),
 created_at timestamptz not null default now(),primary key(requester,recipient),check(requester<>recipient)
);
create unique index if not exists sahko_friend_pair on public.sahko_friendships(least(requester,recipient),greatest(requester,recipient));
create table if not exists public.sahko_rooms (
 code text primary key check(code ~ '^[a-z0-9][a-z0-9-]{0,39}$'),
 owner_id uuid not null references public.sahko_profiles(id),
 creator_id uuid not null references public.sahko_profiles(id),
 title text not null check(length(title) between 1 and 80),
 audience text not null check(audience in ('public','friends')),
 password_hash text,created_at timestamptz not null default now(),
 phase text not null default 'focus' check(phase in ('focus','break','complete')),
 phase_ends_at bigint not null, remaining integer not null default 1500,
 paused boolean not null default false,sprint integer not null default 1,
 focus_seconds integer not null default 1500 check(focus_seconds between 60 and 7200),
 break_seconds integer not null default 300 check(break_seconds between 60 and 3600),
 total_sprints integer not null default 5 check(total_sprints between 1 and 1440),
 first_focus_seconds integer not null default 1500,first_break_seconds integer not null default 300
);
create table if not exists public.sahko_members (
 id uuid primary key default gen_random_uuid(),room_code text not null references public.sahko_rooms(code) on delete cascade,
 user_id uuid not null references public.sahko_profiles(id),browser_id text not null,
 joined_at timestamptz not null default clock_timestamp(),last_seen timestamptz not null default now(),
 task text not null default '' check(length(task)<=240),drift real not null default 0 check(drift between 0 and 1),
 unique(room_code,user_id,browser_id)
);
create index if not exists sahko_room_presence on public.sahko_members(room_code,last_seen);
create table if not exists public.sahko_exclusions(room_code text references public.sahko_rooms(code) on delete cascade,user_id uuid references public.sahko_profiles(id),primary key(room_code,user_id));
create table if not exists public.sahko_access_attempts(room_code text references public.sahko_rooms(code) on delete cascade,user_id uuid references public.sahko_profiles(id),attempts integer not null default 0,last_at timestamptz not null default now(),primary key(room_code,user_id));
create table if not exists public.sahko_jolts(id bigint generated always as identity primary key,room_code text references public.sahko_rooms(code) on delete cascade,sender_id uuid not null,target_id uuid not null,created_at timestamptz not null default clock_timestamp());
create table if not exists public.sahko_invites(id uuid primary key default gen_random_uuid(),room_code text references public.sahko_rooms(code) on delete cascade,sender uuid references public.sahko_profiles(id),recipient uuid references public.sahko_profiles(id),created_at timestamptz not null default now(),unique(room_code,recipient));
create table if not exists public.sahko_messages(id bigint generated always as identity primary key,room_code text references public.sahko_rooms(code) on delete cascade,sender uuid not null,recipient uuid not null,sender_member uuid not null,sender_name text not null,kind text not null,payload text not null,created_at timestamptz not null default now());
create table if not exists public.sahko_voice_members(member_id uuid primary key references public.sahko_members(id) on delete cascade,room_code text references public.sahko_rooms(code) on delete cascade,session_id uuid not null default gen_random_uuid(),muted boolean not null default false,last_seen timestamptz not null default now());
create table if not exists public.sahko_huddle_signals(id bigint generated always as identity primary key,room_code text references public.sahko_rooms(code) on delete cascade,sender uuid not null,sender_session uuid not null,recipient uuid not null,recipient_session uuid not null,kind text not null,payload text not null,created_at timestamptz not null default now());
create table if not exists public.sahko_room_chat(id bigint generated always as identity primary key,room_code text references public.sahko_rooms(code) on delete cascade,sender uuid not null,user_id uuid not null,name text not null,text text not null,created_at timestamptz not null default now());

create or replace function public.sahko_new_user() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.sahko_profiles(id,handle,display_name) values(new.id,lower(coalesce(nullif(new.raw_user_meta_data->>'handle',''),'orbiter_'||left(replace(new.id::text,'-',''),10))),left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Orbiter'),40));return new;
end;$$;
drop trigger if exists sahko_signup_profile on auth.users;
create trigger sahko_signup_profile after insert on auth.users for each row execute function public.sahko_new_user();
create or replace function public.sahko_is_friend(a uuid,b uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select exists(select 1 from public.sahko_friendships where status='accepted' and ((requester=a and recipient=b)or(requester=b and recipient=a)))
$$;
create or replace function public.sahko_handle_available(p_handle text) returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select lower(p_handle) ~ '^[a-z][a-z0-9_]{2,23}$' and not exists(select 1 from public.sahko_profiles where handle=lower(p_handle))
$$;
create or replace function public.sahko_cleanup(p_code text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.sahko_rooms;next_owner uuid;
begin
 select * into r from public.sahko_rooms where code=p_code for update;if not found then return;end if;
 delete from public.sahko_members where room_code=p_code and last_seen<now()-interval '90 seconds';
 if not exists(select 1 from public.sahko_members where room_code=p_code and user_id=r.owner_id) then
  select user_id into next_owner from public.sahko_members where room_code=p_code order by joined_at,id limit 1;
  if next_owner is not null then update public.sahko_rooms set owner_id=next_owner where code=p_code;end if;
 end if;
end;$$;
create or replace function public.sahko_preview_core(p_code text) returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare r public.sahko_rooms;roster jsonb;
begin
 select * into r from public.sahko_rooms where code=p_code;
 if not found or not exists(select 1 from public.sahko_members where room_code=p_code and last_seen>now()-interval '90 seconds') then return jsonb_build_object('error','Room not found','_status',404);end if;
 if r.audience='friends' and auth.uid() is distinct from r.owner_id and not public.sahko_is_friend(auth.uid(),r.owner_id) then return jsonb_build_object('error','This room is for friends','_status',403);end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',p.display_name,'handle','@'||p.handle,'isOwner',m.user_id=r.owner_id,'avatar',null,'drift',m.drift,'relationship',case when m.user_id=auth.uid() then 'self' when public.sahko_is_friend(auth.uid(),m.user_id) then 'friend' else 'none' end)order by (m.user_id=r.owner_id)desc,m.joined_at,m.id),'[]') into roster from public.sahko_members m join public.sahko_profiles p on p.id=m.user_id where m.room_code=p_code and m.last_seen>now()-interval '90 seconds';
 return jsonb_build_object('id',r.code,'code',upper(r.code),'title',r.title,'visibility',r.audience,'protected',r.password_hash is not null,'phase',r.phase,'endsAt',r.phase_ends_at,'sprint',r.sprint,'totalSprints',r.total_sprints,'focusSeconds',r.focus_seconds,'breakSeconds',r.break_seconds,'capacity',8,'full',jsonb_array_length(roster)>=8,'members',roster);
end;$$;
create or replace function public.sahko_directory() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare rows jsonb;
begin
 select coalesce(jsonb_agg(public.sahko_preview_core(r.code)order by r.created_at desc),'[]') into rows from public.sahko_rooms r where r.phase<>'complete' and (r.audience='public' or r.owner_id=auth.uid() or public.sahko_is_friend(auth.uid(),r.owner_id)) and exists(select 1 from public.sahko_members m where m.room_code=r.code and m.last_seen>now()-interval '90 seconds');
 return jsonb_build_object('rooms',rows);
end;$$;
create or replace function public.sahko_room_action(p_code text,p_action text,p_client text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=public,extensions,pg_temp as $$
declare actor uuid:=auth.uid();r public.sahko_rooms;me public.sahko_members;target public.sahko_members;profile public.sahko_profiles;at_ms bigint:=floor(extract(epoch from clock_timestamp())*1000);left_s integer;f integer;b integer;n integer;ph text;ends bigint;block integer;members jsonb;events jsonb;out_id bigint;attempt public.sahko_access_attempts;chosen text;op text;voice public.sahko_voice_members;sig public.sahko_voice_members;line text;rel text;chat_rows jsonb;signals jsonb;
begin
 if actor is null then return jsonb_build_object('error','Sign in to join a room','_status',401);end if;
 if p_code !~ '^[a-z0-9][a-z0-9-]{0,39}$' or p_client !~ '^[a-zA-Z0-9-]{20,80}$' then return jsonb_build_object('error','Invalid room or browser session','_status',400);end if;
 perform public.sahko_cleanup(p_code);select * into r from public.sahko_rooms where code=p_code for update;
 select * into profile from public.sahko_profiles where id=actor;if not found then return jsonb_build_object('error','Finish setting up your profile','_status',409);end if;
 if p_action='join' and coalesce((p_payload->>'create')::boolean,false) then
  if r.code is not null and exists(select 1 from public.sahko_members where room_code=p_code) then return jsonb_build_object('error','That room code is already in use','_status',409);end if;
  if(select count(*)from public.sahko_rooms where creator_id=actor and created_at>now()-interval '1 day')>=100 then return jsonb_build_object('error','Too many rooms. Try again later.','_status',429);end if;
  if r.code is not null then delete from public.sahko_rooms where code=p_code;end if;
  f:=coalesce((p_payload->>'focusSeconds')::integer,1500);b:=coalesce((p_payload->>'breakSeconds')::integer,300);n:=coalesce((p_payload->>'totalSprints')::integer,5);
  if f not between 60 and 7200 or b not between 60 and 3600 or n not between 1 and 1440 or coalesce(p_payload->>'visibility','public') not in('public','friends') or length(coalesce(p_payload->>'title','Sähkö room'))not between 1 and 80 or length(coalesce(p_payload->>'password',''))>128 or (length(coalesce(p_payload->>'password',''))between 1 and 3) then return jsonb_build_object('error','Choose valid room and timer settings','_status',400);end if;
  insert into public.sahko_rooms(code,owner_id,creator_id,title,audience,password_hash,phase_ends_at,remaining,focus_seconds,break_seconds,total_sprints,first_focus_seconds,first_break_seconds) values(p_code,actor,actor,coalesce(nullif(p_payload->>'title',''),'Sähkö room'),coalesce(p_payload->>'visibility','public'),case when coalesce(p_payload->>'password','')<>'' then extensions.crypt(p_payload->>'password',extensions.gen_salt('bf',10)) else null end,at_ms+greatest(1,least(f,coalesce((p_payload->>'firstFocusSeconds')::integer,f)))*1000,greatest(1,least(f,coalesce((p_payload->>'firstFocusSeconds')::integer,f))),f,b,n,greatest(1,least(f,coalesce((p_payload->>'firstFocusSeconds')::integer,f))),greatest(0,least(b,coalesce((p_payload->>'firstBreakSeconds')::integer,b))));
  select * into r from public.sahko_rooms where code=p_code;
 end if;
 if r.code is null then return jsonb_build_object('error','Room not found','_status',404);end if;
 if p_action='join' and not coalesce((p_payload->>'create')::boolean,false)and(r.phase='complete'or not exists(select 1 from public.sahko_members where room_code=p_code))then return jsonb_build_object('error','This session has ended','_status',404);end if;
 select * into me from public.sahko_members where room_code=p_code and user_id=actor and browser_id=p_client;
 if exists(select 1 from public.sahko_exclusions where room_code=p_code and user_id=actor) then return jsonb_build_object('error','You were removed from this room','_status',403);end if;
 if p_action in('join','access') then
  if r.audience='friends' and actor<>r.owner_id and not public.sahko_is_friend(actor,r.owner_id) then return jsonb_build_object('error','This room is for friends','_status',403);end if;
  if r.password_hash is not null and actor<>r.owner_id and me.id is null then
   select * into attempt from public.sahko_access_attempts where room_code=p_code and user_id=actor;
   if attempt.attempts>=8 and attempt.last_at>now()-interval '10 minutes' then return jsonb_build_object('error','Too many attempts. Try again in 10 minutes.','_status',429);end if;
   if extensions.crypt(coalesce(p_payload->>'password',''),r.password_hash)<>r.password_hash then
    insert into public.sahko_access_attempts(room_code,user_id,attempts,last_at)values(p_code,actor,1,now())on conflict(room_code,user_id)do update set attempts=case when sahko_access_attempts.last_at<now()-interval '10 minutes' then 1 else sahko_access_attempts.attempts+1 end,last_at=now();return jsonb_build_object('error','Incorrect password','_status',403);
   end if;
  end if;
  if p_action='access' then return jsonb_build_object('ok',true);end if;
  if me.id is null and(select count(*)from public.sahko_members where room_code=p_code)>=8 then return jsonb_build_object('error','This room is full','_status',409);end if;
  insert into public.sahko_members(room_code,user_id,browser_id)values(p_code,actor,p_client)on conflict(room_code,user_id,browser_id)do update set last_seen=now()returning * into me;
  return jsonb_build_object('memberId',me.id);
 end if;
 if me.id is null then return jsonb_build_object('error','You are no longer in this room','_status',403);end if;
 update public.sahko_members set last_seen=now()where id=me.id;
 if p_action='heartbeat' then return jsonb_build_object('ok',true);end if;
 if p_action='leave' then
  chosen:=p_payload->>'nextOwnerId';if actor=r.owner_id and chosen is not null then select * into target from public.sahko_members where room_code=p_code and id::text=chosen and user_id<>actor;if target.id is null then return jsonb_build_object('error','Choose another active member','_status',400);end if;update public.sahko_rooms set owner_id=target.user_id where code=p_code;end if;
  delete from public.sahko_members where id=me.id;perform public.sahko_cleanup(p_code);return jsonb_build_object('ok',true);
 end if;
 if p_action in('ownership','kick') then
  if actor<>r.owner_id then return jsonb_build_object('error','Only the room owner can manage members','_status',403);end if;
  if coalesce((p_payload->>'confirmed')::boolean,false)<>true then return jsonb_build_object('error','Confirm this room change','_status',409);end if;
  select * into target from public.sahko_members where room_code=p_code and id::text=p_payload->>'targetId' and user_id<>actor;
  if target.id is null then return jsonb_build_object('error','Choose another active member','_status',400);end if;
  if p_action='ownership' then update public.sahko_rooms set owner_id=target.user_id where code=p_code;return jsonb_build_object('ownerMemberId',target.id);end if;
  insert into public.sahko_exclusions values(p_code,target.user_id)on conflict do nothing;delete from public.sahko_members where room_code=p_code and user_id=target.user_id;return jsonb_build_object('ok',true);
 end if;
 if p_action='member' then
  if p_payload ? 'drift' and ((p_payload->>'drift')::real not between 0 and 1)then return jsonb_build_object('error','Invalid focus state','_status',400);end if;
  if length(coalesce(p_payload->>'task',''))>240 then return jsonb_build_object('error','Task is too long','_status',400);end if;
  update public.sahko_members set drift=coalesce((p_payload->>'drift')::real,drift),task=coalesce(p_payload->>'task',task)where id=me.id;return jsonb_build_object('ok',true);
 end if;
 if p_action='jolts' then
  select * into target from public.sahko_members where room_code=p_code and id::text=p_payload->>'targetId' and id<>me.id;
  if target.id is null then return jsonb_build_object('error','Choose another member','_status',400);end if;
  if target.drift=0 then return jsonb_build_object('error','They are already focusing','_status',409);end if;
  if exists(select 1 from public.sahko_jolts where sender_id=me.id and created_at>clock_timestamp()-interval '1 second')or(select count(*)from public.sahko_jolts where sender_id=me.id and created_at>clock_timestamp()-interval '10 seconds')>=5 then return jsonb_build_object('error','Give them a moment before another jolt','_status',429);end if;
  insert into public.sahko_jolts(room_code,sender_id,target_id)values(p_code,me.id,target.id)returning id into out_id;return jsonb_build_object('id',out_id,'sender_id',me.id,'target_id',target.id,'created_at',at_ms);
 end if;
 if p_action='catch' then update public.sahko_members set drift=0 where room_code=p_code and id::text=p_payload->>'targetId';return jsonb_build_object('ok',true);end if;
 if p_action in('timer','phase')then
  if actor<>r.owner_id then return jsonb_build_object('error','Only the room owner can control the timer','_status',403);end if;
  if p_action='phase' then
   if coalesce((p_payload->>'confirmed')::boolean,false)<>true then return jsonb_build_object('error','Confirm skipping this phase','_status',409);end if;
   if r.phase='focus' then if r.sprint>=r.total_sprints then r.phase:='complete';else r.phase:='break';r.remaining:=case when r.sprint=1 then r.first_break_seconds else r.break_seconds end;end if;else r.phase:='focus';r.sprint:=r.sprint+1;r.remaining:=r.focus_seconds;end if;r.phase_ends_at:=at_ms+r.remaining*1000;
  else
   f:=coalesce((p_payload->>'focusSeconds')::integer,r.focus_seconds);b:=coalesce((p_payload->>'breakSeconds')::integer,r.break_seconds);n:=coalesce((p_payload->>'totalSprints')::integer,r.total_sprints);
   if f not between 60 and 7200 or b not between 60 and 3600 or n not between r.sprint and 1440 then return jsonb_build_object('error','Choose valid timer settings','_status',400);end if;
   if (p_payload->>'paused')::boolean=true and not r.paused and coalesce((p_payload->>'confirmed')::boolean,false)<>true then return jsonb_build_object('error','Confirm pausing for everyone','_status',409);end if;
   r.remaining:=greatest(1,least(604800,coalesce((p_payload->>'remaining')::integer,case when r.paused then r.remaining else ceil((r.phase_ends_at-at_ms)/1000.0)::integer end)));
   r.focus_seconds:=f;r.break_seconds:=b;r.total_sprints:=n;r.paused:=coalesce((p_payload->>'paused')::boolean,r.paused);r.phase_ends_at:=at_ms+r.remaining*1000;
  end if;
  update public.sahko_rooms set phase=r.phase,sprint=r.sprint,remaining=r.remaining,phase_ends_at=r.phase_ends_at,paused=r.paused,focus_seconds=r.focus_seconds,break_seconds=r.break_seconds,total_sprints=r.total_sprints where code=p_code;return jsonb_build_object('ok',true);
 end if;
 if p_action='huddle' then
  op:=coalesce(p_payload->>'op','state');delete from public.sahko_voice_members where room_code=p_code and last_seen<now()-interval '30 seconds';
  if op='join' then insert into public.sahko_voice_members(member_id,room_code)values(me.id,p_code)on conflict(member_id)do update set session_id=gen_random_uuid(),last_seen=now(),muted=false returning * into voice;return jsonb_build_object('session',voice.session_id);end if;
  if op='leave' then delete from public.sahko_voice_members where member_id=me.id;return jsonb_build_object('ok',true);end if;
  if op='heartbeat' then update public.sahko_voice_members set last_seen=now(),muted=coalesce((p_payload->>'muted')::boolean,false)where member_id=me.id and session_id::text=p_payload->>'session';return jsonb_build_object('ok',true);end if;
  if op='chat' then line:=trim(coalesce(p_payload->>'text',''));if length(line)not between 1 and 2000 then return jsonb_build_object('error','Write a message under 2,000 characters','_status',400);end if;if(select count(*)from public.sahko_room_chat where sender=me.id and created_at>now()-interval '10 seconds')>=10 then return jsonb_build_object('error','Wait before sending another message','_status',429);end if;insert into public.sahko_room_chat(room_code,sender,user_id,name,text)values(p_code,me.id,actor,profile.display_name,line);return jsonb_build_object('ok',true);end if;
  if op='signal' then
   select * into voice from public.sahko_voice_members where member_id=me.id and session_id::text=p_payload->>'session';select * into sig from public.sahko_voice_members where room_code=p_code and member_id::text=p_payload->>'target' and session_id::text=p_payload->>'targetSession';
   if voice.member_id is null or sig.member_id is null or coalesce(p_payload->>'kind','')not in('offer','answer','ice')or length(coalesce(p_payload->>'payload',''))>24000 then return jsonb_build_object('error','Invalid voice signal','_status',400);end if;
   if(select count(*)from public.sahko_huddle_signals where sender=me.id and created_at>now()-interval '10 seconds')>=100 then return jsonb_build_object('error','Too many signals','_status',429);end if;
   insert into public.sahko_huddle_signals(room_code,sender,sender_session,recipient,recipient_session,kind,payload)values(p_code,me.id,voice.session_id,sig.member_id,sig.session_id,p_payload->>'kind',p_payload->>'payload');return jsonb_build_object('ok',true);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'name',p.display_name,'session',v.session_id,'muted',v.muted)),'[]')into members from public.sahko_voice_members v join public.sahko_members m on m.id=v.member_id join public.sahko_profiles p on p.id=m.user_id where v.room_code=p_code;
  select * into voice from public.sahko_voice_members where member_id=me.id;
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'sender',sender,'sender_session',sender_session,'kind',kind,'payload',payload)order by id),'[]')into signals from public.sahko_huddle_signals where recipient=me.id and recipient_session=voice.session_id and id>coalesce((p_payload->>'after')::bigint,0)and created_at>now()-interval '1 minute';
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'sender',sender,'name',name,'text',text,'at',floor(extract(epoch from created_at)*1000))order by id),'[]')into chat_rows from(select * from public.sahko_room_chat where room_code=p_code order by id desc limit 100)t;
  return jsonb_build_object('members',members,'signals',signals,'chat',chat_rows);
 end if;
 if p_action='invites' then
  if actor<>r.owner_id then return jsonb_build_object('error','Only the owner can invite friends','_status',403);end if;
  insert into public.sahko_invites(room_code,sender,recipient)select p_code,actor,p.id from public.sahko_profiles p where '@'||p.handle in(select jsonb_array_elements_text(coalesce(p_payload->'handles','[]')))and public.sahko_is_friend(actor,p.id)on conflict(room_code,recipient)do update set created_at=now();select coalesce(jsonb_agg('@'||p.handle),'[]')into events from public.sahko_invites i join public.sahko_profiles p on p.id=i.recipient where i.room_code=p_code and i.sender=actor and '@'||p.handle in(select jsonb_array_elements_text(coalesce(p_payload->'handles','[]')));return jsonb_build_object('sent',events);
 end if;
 if p_action<>'state' then return jsonb_build_object('error','Unknown room action','_status',404);end if;
 if not r.paused and r.phase<>'complete' then
  ph:=r.phase;ends:=r.phase_ends_at;block:=r.sprint;
  for i in 1..4096 loop exit when ends>at_ms or ph='complete';if ph='focus' then if block>=r.total_sprints then ph:='complete';else ph:='break';ends:=ends+(case when block=1 then r.first_break_seconds else r.break_seconds end)*1000;end if;else ph:='focus';block:=block+1;ends:=ends+r.focus_seconds*1000;end if;end loop;
  update public.sahko_rooms set phase=ph,phase_ends_at=ends,sprint=block where code=p_code returning * into r;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',m.id,'isOwner',m.user_id=r.owner_id,'name',p.display_name,'handle','@'||p.handle,'avatar',null,'drift',m.drift,'last_seen',floor(extract(epoch from m.last_seen)*1000),'joinedAt',floor(extract(epoch from m.joined_at)*1000),'task',case when m.user_id=actor or public.sahko_is_friend(actor,m.user_id)then m.task else ''end,'relationship',case when m.user_id=actor then 'self'when public.sahko_is_friend(actor,m.user_id)then 'friend'else 'none'end)order by(m.user_id=r.owner_id)desc,m.joined_at,m.id),'[]')into members from public.sahko_members m join public.sahko_profiles p on p.id=m.user_id where m.room_code=p_code;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'sender_id',sender_id,'target_id',target_id,'created_at',floor(extract(epoch from created_at)*1000))order by id),'[]')into events from public.sahko_jolts where room_code=p_code and id>coalesce((p_payload->>'after')::bigint,0)and created_at>now()-interval '15 seconds';
 return jsonb_build_object('selfId',me.id,'canControl',r.owner_id=actor,'members',members,'events',events,'serverTime',at_ms,'timer',jsonb_build_object('title',r.title,'phase',r.phase,'phase_ends_at',r.phase_ends_at,'remaining',r.remaining,'paused',r.paused,'sprint',r.sprint,'focus_seconds',r.focus_seconds,'break_seconds',r.break_seconds,'total_sprints',r.total_sprints,'first_focus_seconds',r.first_focus_seconds,'first_break_seconds',r.first_break_seconds));
end;$$;

create or replace function public.sahko_social(p_action text,p_payload jsonb default '{}'::jsonb)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();target uuid;member public.sahko_members;sender public.sahko_members;profile public.sahko_profiles;rows jsonb;rel text;kind text;payload text;
begin
 if actor is null then return jsonb_build_object('error','Sign in to continue','_status',401);end if;
 if p_action='friends' then
  select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.display_name,'handle','@'||p.handle,'relationship',case when f.status='accepted'then 'friend'when f.requester=actor then 'requested'else 'incoming'end,'online',exists(select 1 from public.sahko_members where user_id=p.id and last_seen>now()-interval '90 seconds'))),'[]')into rows from public.sahko_friendships f join public.sahko_profiles p on p.id=case when f.requester=actor then f.recipient else f.requester end where f.requester=actor or f.recipient=actor;return jsonb_build_object('friends',rows);
 end if;
 if p_action='friend' then
  if p_payload ? 'handle'then select id into target from public.sahko_profiles where handle=lower(ltrim(p_payload->>'handle','@'));else
   select user_id into target from public.sahko_members m where m.id::text=p_payload->>'memberId'and m.last_seen>now()-interval '90 seconds'and exists(select 1 from public.sahko_members s where s.user_id=actor and s.room_code=m.room_code and s.last_seen>now()-interval '90 seconds');
   if target is null then select id into target from public.sahko_profiles where id::text=p_payload->>'memberId';end if;
  end if;
  if target is null or target=actor then return jsonb_build_object('error','Choose another profile','_status',400);end if;
  if coalesce((p_payload->>'accept')::boolean,false)then update public.sahko_friendships set status='accepted'where requester=target and recipient=actor;
  elsif not exists(select 1 from public.sahko_friendships where(requester=actor and recipient=target)or(requester=target and recipient=actor))then
   if(select count(*)from public.sahko_friendships where requester=actor and created_at>now()-interval '1 hour')>=60 then return jsonb_build_object('error','Too many requests. Try later.','_status',429);end if;insert into public.sahko_friendships(requester,recipient)values(actor,target);
  end if;
  select case when status='accepted'then 'friend'when requester=actor then 'requested'else 'incoming'end into rel from public.sahko_friendships where(requester=actor and recipient=target)or(requester=target and recipient=actor);return jsonb_build_object('relationship',rel);
 end if;
 if p_action='invites'then
  select coalesce(jsonb_agg(jsonb_build_object('id',i.id,'roomId',i.room_code,'title',r.title,'protected',r.password_hash is not null,'from',p.display_name,'createdAt',floor(extract(epoch from i.created_at)*1000))order by i.created_at desc),'[]')into rows from public.sahko_invites i join public.sahko_rooms r on r.code=i.room_code join public.sahko_profiles p on p.id=i.sender where i.recipient=actor and exists(select 1 from public.sahko_members where room_code=i.room_code and last_seen>now()-interval '90 seconds');return jsonb_build_object('invites',rows);
 end if;
 if p_action='inbox' then
  select coalesce(jsonb_agg(jsonb_build_object('id',id,'sender_member',sender_member,'sender_name',sender_name,'kind',msg.kind,'payload',msg.payload,'room_id',room_code)order by id),'[]')into rows from public.sahko_messages msg where recipient=actor and id>coalesce((p_payload->>'after')::bigint,0)and created_at>now()-interval '1 hour';return jsonb_build_object('messages',rows);
 end if;
 if p_action='message' then
  select * into member from public.sahko_members m where id::text=p_payload->>'memberId'and last_seen>now()-interval '90 seconds';
  if member.id is null then return jsonb_build_object('error','That member is offline','_status',404);end if;
  select * into sender from public.sahko_members where user_id=actor and room_code=member.room_code and last_seen>now()-interval '90 seconds'order by joined_at limit 1;
  if sender.id is null or member.user_id=actor then return jsonb_build_object('error','Choose another member in your room','_status',403);end if;
  kind:=p_payload->>'kind';payload:=p_payload->>'payload';
  if kind not in('text','offer','answer','ice','end')or length(coalesce(payload,''))not between 1 and 24000 or(kind='text'and length(payload)>2000)then return jsonb_build_object('error','Invalid message','_status',400);end if;
  if(select count(*)from public.sahko_messages where sender_member=sender.id and created_at>now()-interval '10 seconds')>=100 then return jsonb_build_object('error','Too many messages. Wait a moment.','_status',429);end if;
  select * into profile from public.sahko_profiles where id=actor;
  insert into public.sahko_messages(room_code,sender,recipient,sender_member,sender_name,kind,payload)values(member.room_code,actor,member.user_id,sender.id,profile.display_name,kind,payload);return jsonb_build_object('ok',true);
 end if;
 return jsonb_build_object('error','Unknown action','_status',404);
end;$$;

-- Public profiles contain no email addresses. All room writes pass through verified RPCs.
alter table public.sahko_profiles enable row level security;
drop policy if exists sahko_profiles_read on public.sahko_profiles;
create policy sahko_profiles_read on public.sahko_profiles for select to authenticated using(true);
drop policy if exists sahko_profiles_update on public.sahko_profiles;
create policy sahko_profiles_update on public.sahko_profiles for update to authenticated using(id=auth.uid())with check(id=auth.uid());
revoke all on public.sahko_profiles from anon,authenticated;
grant select on public.sahko_profiles to authenticated;
grant update(handle,display_name)on public.sahko_profiles to authenticated;
do $$declare t text;begin
 foreach t in array array['sahko_friendships','sahko_rooms','sahko_members','sahko_exclusions','sahko_access_attempts','sahko_jolts','sahko_invites','sahko_messages','sahko_voice_members','sahko_huddle_signals','sahko_room_chat']loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);end loop;
end;$$;
revoke all on function public.sahko_new_user()from public,anon,authenticated;
revoke all on function public.sahko_is_friend(uuid,uuid)from public,anon,authenticated;
revoke all on function public.sahko_cleanup(text)from public,anon,authenticated;
revoke all on function public.sahko_preview_core(text)from public,anon,authenticated;
revoke all on function public.sahko_directory()from public;
revoke all on function public.sahko_handle_available(text)from public;
revoke all on function public.sahko_room_action(text,text,text,jsonb)from public,anon;
revoke all on function public.sahko_social(text,jsonb)from public,anon;
grant execute on function public.sahko_directory(),public.sahko_handle_available(text)to anon,authenticated;
-- A wrapper exposes a preview only after the same visibility check as the directory.
create or replace function public.sahko_room_preview(p_code text)returns jsonb language sql stable security definer set search_path=public,pg_temp as $$select public.sahko_preview_core(p_code)$$;
revoke all on function public.sahko_room_preview(text)from public;
grant execute on function public.sahko_room_preview(text)to anon,authenticated;
grant execute on function public.sahko_room_action(text,text,text,jsonb),public.sahko_social(text,jsonb)to authenticated;

-- Recover a profile for someone who signed up before this schema was installed.
create or replace function public.sahko_ensure_profile()returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor uuid:=auth.uid();p public.sahko_profiles;metadata jsonb;tag text;
begin
 if actor is null then return jsonb_build_object('error','Sign in first','_status',401);end if;
 select * into p from public.sahko_profiles where id=actor;if found then return to_jsonb(p);end if;
 select raw_user_meta_data into metadata from auth.users where id=actor;tag:=lower(coalesce(metadata->>'handle',''));
 if tag !~ '^[a-z][a-z0-9_]{2,23}$'or exists(select 1 from public.sahko_profiles where handle=tag)then tag:='orbiter_'||left(replace(actor::text,'-',''),12);end if;
 insert into public.sahko_profiles(id,handle,display_name)values(actor,tag,left(coalesce(nullif(metadata->>'display_name',''),'Orbiter'),40))returning * into p;return to_jsonb(p);
end;$$;
revoke all on function public.sahko_ensure_profile()from public,anon;
grant execute on function public.sahko_ensure_profile()to authenticated;

revoke all on sequence public.sahko_jolts_id_seq,public.sahko_messages_id_seq,public.sahko_huddle_signals_id_seq,public.sahko_room_chat_id_seq from anon,authenticated;
notify pgrst,'reload schema';
