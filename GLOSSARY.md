# Everyday App

A personal everyday-utilities app made of independent top-level sections.

## Sections

**Section**:
A top-level area of the app reachable from the menu, such as the Bus Timetable Section or the Video Section.
_Avoid_: Module, feature, tab

## Bus Timetable section

**Bus Timetable Section**:
The Section for Novi Sad city-bus departures: the Pick lines screen, the Timetable and Favorites.
_Avoid_: Map, bus module, GSP section

**Line**:
A public city-bus route identified by its number, such as 4 or 3A. A circular pair like 7A/7B is one Line.
_Avoid_: Route, bus number

**Direction**:
Which end a Line starts from (for a circular pair, which variant), so departures are counted from that starting terminal.
_Avoid_: Way, side, A/B

**Pick lines screen**:
The entry screen of the Bus Timetable Section, where the user picks Lines and a Direction for each.
_Avoid_: Home, line list, picker

**Timetable**:
Today's departures of a set of Lines, each in one Direction, merged into one chronological list.
_Avoid_: Schedule, departures list

**NOW bus**:
The bus estimated to be on its route right now: the latest one that has left and hasn't yet reached its last stop.
_Avoid_: Current bus, live bus

**NEXT bus**:
The first departure that hasn't left yet, of one Line or of a whole Timetable.
_Avoid_: Upcoming bus, following bus

**Favorite**:
A named, saved set of Lines, each with its Direction, reopened as one Timetable. The same Lines and Directions make the same Favorite, whatever order they were picked in.
_Avoid_: Favorite selection, saved selection, preset, section

**Favorite card**:
How one Favorite is shown on the Pick lines screen.
_Avoid_: Section, favorite row, tile

## Video section

**Video Section**:
The Section for finding and watching Videos: the Search screen, the Watch page and History.
_Avoid_: YouTube section, player, video module

**Video**:
A single YouTube video identified by its video ID, regardless of whether it was published as a regular video or a Short.
_Avoid_: Clip, item, Short

**Search screen**:
The entry screen of the Video section: a search box that also accepts a pasted Video Link, with recent History below it.
_Avoid_: Home, feed, start page

**Video Link**:
A pasted URL that identifies a Video, optionally with a start timestamp.
_Avoid_: URL, share link

**Watch page**:
The screen that plays one Video and lists its Related Videos.
_Avoid_: Player screen, video screen

**Stream**:
The playable link resolved for a Video. It is valid only for a limited time, so it is resolved again when it expires or is rejected.
_Avoid_: Stream URL, manifest, link, source

**Related Videos**:
The videos YouTube suggests alongside a Video; the first one is the Up Next.
_Avoid_: Recommendations, suggestions

**Up Next**:
The first Related Video, offered when the current Video ends. It plays only when the user taps it.
_Avoid_: Autoplay, next video

**History**:
The on-device, most-recent-first list of Videos whose playback has started.
_Avoid_: Watch history, recents

**History Entry**:
The single record of one Video in History: what is needed to list and resume it, never the Video itself.
_Avoid_: Watch record, history item

**Resume Position**:
The saved playback position of a Video in History. A Video reopened from History continues from here.
_Avoid_: Progress, bookmark, timestamp

**Watched**:
A Video whose Resume Position reached the last 5% of its length, so it restarts from the beginning when opened again.
_Avoid_: Finished, completed

**Quality Mode**:
The user's single, remembered playback quality preference, applied to every Video: Auto (adapts to the network), Data Saver (lowest available, at most 480p), or Best (highest available, at most the screen's resolution).
_Avoid_: Resolution, quality setting
