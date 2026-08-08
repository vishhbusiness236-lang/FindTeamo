# FindTeamo

Basically tinder but for finding hackathon teammates/cofounders. made it cause im tired of that last minute panic where everyone is spamming discord asking if anyone free to join their team, right before every hackathon starts

<img width="1917" height="901" alt="Screenshot 2026-08-08 130604" src="https://github.com/user-attachments/assets/8c2c95ee-ff59-48ef-87a2-d52902852b6e" />

## Why

Done 16+ hackathons. Every one has min team size rule and every time theres a scramble in the last hour to find people. Seen good devs get stuck with nobody or thrown in a random team with zero skill overlap, just cause there was no way to filter.

Same thing with cofounders. Random people ping you and you have no idea if your goals match till weeks later, total waste of time.

So i just built the thing i wanted. Swipe on profiles, match on shared skills/goals, chat once matched. Thats basically it.

Im 15, been building app for more than a year (some of them are Verba, CareAlong, lyrova, smriti) but this is the first one i took all the way- real auth, real db, live chat, actually deployed.

## What it does

- Make profile - skills, what your looking for (hackathon/cofounder/startup), hours per week
- Discover page - swipeable cards, sorted by match score (skills/goals/hours etc)
- Like or skip, both like means match
- Chat inside app once matched - text, images, voice notes
- 
<img width="1917" height="903" alt="Screenshot 2026-08-08 130625" src="https://github.com/user-attachments/assets/d11d0581-e4b6-44b1-a90b-fad06d4f5e02" />


## Stack

Next.js, React, Tailwind, Supabase (auth + db + realtime + storage), Vercel

## Demo

[findteamo.vercel.app](https://findteamo.vercel.app/)

<img width="1913" height="892" alt="Screenshot 2026-08-08 130643" src="https://github.com/user-attachments/assets/deb2abc4-1acd-483f-9bdc-635ccf0a45c7" />

## Run locally

```
git clone https://github.com/vishhbusiness236-lang/FindTeamo.git
cd FindTeamo
npm install
```

`.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your key
```

```
npm run dev
```

## Bugs i got stuck on

RLS on messaging took almost a full day. kept getting (row violates row levl security) on 3 diff tables one by one- conversations, messages, then storage bucket. fix one, next one breaks. ended up just loosening insert policy to authenticated for now, gotta fix that properly later lol.

Messages were showing twice for a bit. i was adding msg to local state right after sending and realtime was adding it again on insert event. took me way to long to notice. fixed by removing local update, letting realtime handle it alone.

Also had random 404 on conversations route, turned out to be stale turbopack cache not actual bug. cleared .next and it worked. wasted 40 mins on that lol.

## Whats next

- filter by tech stack not just general skills
- some rating thing after hackathon so ppl know whos reliable
- maybe scale this properly, think it could be a real startup

## License

MIT
