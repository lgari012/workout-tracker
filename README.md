# Workout Tracker

A web app for logging workouts and tracking progress over time. I built it because the apps I tried were either bloated with features I didn't need or locked the useful parts behind a paywall. I wanted something simple that I would actually use, and that other people could use without paying for a premium tier.

## What it does

Log a workout, add exercises to it, and record the weight and reps for each set. Body weight is tracked separately so you can see how it moves alongside your lifts.

The goal is to eventually have it suggest progression — telling you when to add weight or push a rep range based on what you have already done.

## Tech stack

* **PostgreSQL** — data storage
* **TypeScript / Node.js** — API routes
* **Next.js** — full-stack framework
* **AWS** — planned deployment

## Data model

The data is split across four tables: `workouts`, `exercises`, `sets`, and `weightlog`. A workout is a single session on a date. An exercise is a movement that gets reused across sessions. A set links the two together with the weight and reps.

Splitting it this way instead of keeping one flat log means the data can be sliced however you want. You can look at every set of bench press you have ever done, or total volume for one session, or your heaviest lift per exercise — instead of scrolling through one long list and doing the math yourself.

## Notes on how it is built

I wrote the SQL by hand rather than using an ORM. I wanted to understand what the database was actually doing — how joins work, how aggregates group data — instead of having it abstracted away.

The schema is kept in a versioned `.sql` file so the whole database can be rebuilt from scratch on any machine.

## Status

Work in progress.

### Done

* PostgreSQL schema with foreign key relationships
* API routes for listing exercises and calculating personal records

### Next

* Frontend pages to view and log workouts
* Forms for adding workouts and sets
* AWS deployment
* Progression suggestions