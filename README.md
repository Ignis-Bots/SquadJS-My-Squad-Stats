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
  - `usingWhitelister` and `whitelisterInstructions` are only to be used if you are both using JetDave's Whitelister AND have provided an Access Key to MySquadStats so that we can link your linked Whitelister Players.

## Releases

Releases will be given a version number with the format `v{major}.{minor}.{patch}`, e.g. `v3.1.4`. Changes to `{major}`/`{minor}`/`{patch}` will imply the following:

- `{major}` - The release contains a new/updated feature that is (potentially) breaking, e.g. changes to event outputs that may cause custom plugins to break.
- `{minor}` - The release contains a new/updated feature.
- `{patch}` - The release contains a bug fix.
