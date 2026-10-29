# Backbone SquadJS Plugin for [MySquadStats](https://mysquadstats.com)

<div align="center">

[![GitHub Release](https://img.shields.io/github/release/IgnisAlienus/SquadJS-My-Squad-Stats.svg?style=flat-square)](https://github.com/IgnisAlienus/SquadJS-My-Squad-Stats/releases)
[![GitHub Contributors](https://img.shields.io/github/contributors/IgnisAlienus/SquadJS-My-Squad-Stats.svg?style=flat-square)](https://github.com/IgnisAlienus/SquadJS-My-Squad-Stats/graphs/contributors)
[![GitHub Release](https://img.shields.io/github/license/IgnisAlienus/SquadJS-My-Squad-Stats.svg?style=flat-square)](https://github.com/IgnisAlienus/SquadJS-My-Squad-Stats/blob/master/LICENSE)

<br>

[![GitHub Issues](https://img.shields.io/github/issues/IgnisAlienus/SquadJS-My-Squad-Stats.svg?style=flat-square)](https://github.com/IgnisAlienus/SquadJS-My-Squad-Stats/issues)
[![GitHub Pull Requests](https://img.shields.io/github/issues-pr-raw/IgnisAlienus/SquadJS-My-Squad-Stats.svg?style=flat-square)](https://github.com/IgnisAlienus/SquadJS-My-Squad-Stats/pulls)
[![GitHub Stars](https://img.shields.io/github/stars/IgnisAlienus/SquadJS-My-Squad-Stats.svg?style=flat-square)](https://github.com/IgnisAlienus/SquadJS-My-Squad-Stats/stargazers)
[![Discord](https://img.shields.io/discord/1174357658971668551.svg?style=flat-square&logo=discord)](https://discord.gg/HV9VGqmPRq)

<br><br>

</div>

## What it do?

- This sends your Players Statistics, such as Kills, Deaths, Revives, etc. to MySquadStats so that players can see a better totality of their Stats across multiple Servers.

## Pre-requesites

- Latest Version of [SquadJS](https://github.com/Team-Silver-Sphere/SquadJS)

## How to install:

- Add `my-squad-stats.js` to your `./squad-server/plugins` folder.
- Add to your `config.json`
  - You WILL need to get your access token from Ignis to fully set the `config.json` file up.
  - `allowInGameStatsCommand` will allow or disallow the use of the `!mss stats` Command in your Server.
  - `allowSimpleStatsCommand` will allow players to use `!stats` as well as `!mss stats` in your Server.

## When MySquadStats is down

- When MySquadStats is down and its proxy answers with a 502, the plugin saves what it sends, apart from the player lists it sends every minute, in `./squad-server/MySquadStats_Data`, and sends it once MySquadStats answers again. Round ends are also saved when MySquadStats answers them with an error or does not answer at all. Other requests that get no answer, such as wounds, deaths and revives sent while the connection fails, are not saved.
- Each server keeps its own files there, named after a short code made from its access token: `send-retry-requests-<code>.json` and `patch-retry-requests-<code>.json`. While the saved requests are being sent, `retry-done-<code>.log` lists the ones already answered, so that a restart does not send them twice. Several servers run from one SquadJS install can share the folder.
- If you change a server's `accessToken` while requests are saved, they stay in the files of the old token and are not sent. The plugin names those files when it starts. To send them with the new token, stop SquadJS, rename them to `send-retry-requests.json` and `patch-retry-requests.json`, and start that server first: it takes them into its own files. Leave the old `retry-done-<code>.log` where it is: it names the requests already answered, which are then not sent twice. It can be deleted once the new token's `send-retry-requests-<new code>.json` and `patch-retry-requests-<new code>.json` are gone.

## Releases

Releases will be given a version number with the format `v{major}.{minor}.{patch}`, e.g. `v3.1.4`. Changes to `{major}`/`{minor}`/`{patch}` will imply the following:

- `{major}` - The release contains a new/updated feature that is (potentially) breaking, e.g. changes to event outputs that may cause custom plugins to break.
- `{minor}` - The release contains a new/updated feature.
- `{patch}` - The release contains a bug fix.
