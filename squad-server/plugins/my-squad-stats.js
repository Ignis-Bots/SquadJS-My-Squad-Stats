import axios from 'axios';

import BasePlugin from './base-plugin.js';

export default class MySquadStats extends BasePlugin {
  static get description() {
    return (
      'The <code>gMySquadStats/code> plugin will log various server statistics and events to a central database for player stat tracking.'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      accessToken: {
        required: true,
        description: 'The access token to use for the database.',
        default: "YOUR_ACCESS_TOKEN"
      },
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.onNewGame = this.onNewGame.bind(this);
    this.onPlayerConnected = this.onPlayerConnected.bind(this);
    this.onPlayerWounded = this.onPlayerWounded.bind(this);
    this.onPlayerDied = this.onPlayerDied.bind(this);
    this.onPlayerRevived = this.onPlayerRevived.bind(this);
  }

  async prepareToMount() {

  }

  async mount() {
    // Post Request to create Server in API
    let dataType = 'servers';
    let serverData = {
      name: this.server.serverName
    };
    let response = await sendDataToAPI(dataType, serverData, this.options.accessToken);
    this.verbose(1, response);

    // Get Request to get Match Info from API
    dataType = 'matches';
    this.match = await getDataFromAPI(dataType, this.options.accessToken);

    this.server.on('NEW_GAME', this.onNewGame);
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.on('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.on('PLAYER_DIED', this.onPlayerDied);
    this.server.on('PLAYER_REVIVED', this.onPlayerRevived);
    this.checkVersion();
  }

  async unmount() {
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.removeEventListener('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.removeEventListener('PLAYER_DIED', this.onPlayerDied);
    this.server.removeEventListener('PLAYER_REVIVED', this.onPlayerRevived);
  }

  // Check if current version is the latest version
  async checkVersion() {
    const owner = 'IgnisAlienus';
    const repo = 'SquadJS-My-Squad-Stats';
    const currentVersion = 'v1.0.0';

    try {
      const latestVersion = await getLatestVersion(owner, repo);

      if (currentVersion < latestVersion) {
        this.verbose(1, `A new version of ${repo} is available. Please update your plugin.\nCurrent version: ${currentVersion} Latest Version: ${latestVersion}\nhttps://github.com/${owner}/${repo}/releases`);
      } else if (currentVersion > latestVersion) {
        this.verbose(1, `You are running a newer version of ${repo} than the latest version.\nThis likely means you are running a pre-release version.\nCurrent version: ${currentVersion} Latest Version: ${latestVersion}\nhttps://github.com/${owner}/${repo}/releases`);
      } else if (currentVersion === latestVersion) {
        this.verbose(1, `You are running the latest version of ${repo}.`);
      } else {
        this.verbose(1, `Unable to check for updates in ${repo}.`);
      }
    } catch (error) {
      this.verbose(1, `Error retrieving the latest version off ${repo}:`, error);
    }
  }

  async onNewGame(info) {
    // Patch Request to update last Match in API
    let dataType = 'matches';
    let matchData = {
      endTime: info.time,
      winner: info.winner
    };
    let updateResponse = await patchDataInAPI(dataType, matchData, this.options.accessToken);
    this.verbose(1, updateResponse);

    // Post Request to create new Match in API
    dataType = 'matches';
    let newMatchData = {
      server: this.server.serverName,
      dlc: info.dlc,
      mapClassname: info.mapClassname,
      layerClassname: info.layerClassname,
      map: info.layer ? info.layer.map.name : null,
      layer: info.layer ? info.layer.name : null,
      startTime: info.time
    };
    let createResponse = await sendDataToAPI(dataType, newMatchData, this.options.accessToken);
    this.verbose(1, createResponse);
  }

  async onPlayerWounded(info) {
    if (info.attacker) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.attacker.eosID,
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }
    if (info.victim) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.attacker.eosID,
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }

    // Post Request to create Wound in API
    let dataType = 'wounds';
    let woundData = {
      match: this.match ? this.match.id : null,
      time: info.time,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill
    };
    let response = await sendDataToAPI(dataType, woundData, this.options.accessToken);
    this.verbose(1, response);
  }

  async onPlayerDied(info) {
    if (info.attacker) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.attacker.eosID,
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }
    if (info.victim) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.attacker.eosID,
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }

    // Post Request to create Death in API
    let dataType = 'deaths';
    let deathData = {
      match: this.match ? this.match.id : null,
      time: info.time,
      woundTime: info.woundTime,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill
    };
    let response = await sendDataToAPI(dataType, deathData, this.options.accessToken);
    this.verbose(1, response);
  }

  async onPlayerRevived(info) {
    if (info.attacker) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.attacker.eosID,
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }
    if (info.victim) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.attacker.eosID,
        steamID: info.attacker.steamID,
        lastName: info.attacker.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }
    if (info.reviver) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.reviver.eosID,
        steamID: info.reviver.steamID,
        lastName: info.reviver.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      this.verbose(1, updateResponse);
    }

    // Post Request to create Revive in API
    let dataType = 'revives';
    let reviveData = {
      match: this.match ? this.match.id : null,
      time: info.time,
      woundTime: info.woundTime,
      victim: info.victim ? info.victim.steamID : null,
      victimName: info.victim ? info.victim.name : null,
      victimTeamID: info.victim ? info.victim.teamID : null,
      victimSquadID: info.victim ? info.victim.squadID : null,
      attacker: info.attacker ? info.attacker.steamID : null,
      attackerName: info.attacker ? info.attacker.name : null,
      attackerTeamID: info.attacker ? info.attacker.teamID : null,
      attackerSquadID: info.attacker ? info.attacker.squadID : null,
      damage: info.damage,
      weapon: info.weapon,
      teamkill: info.teamkill,
      reviver: info.reviver ? info.reviver.steamID : null,
      reviverName: info.reviver ? info.reviver.name : null,
      reviverTeamID: info.reviver ? info.reviver.teamID : null,
      reviverSquadID: info.reviver ? info.reviver.squadID : null
    };
    let response = await sendDataToAPI(dataType, reviveData, this.options.accessToken);
    this.verbose(1, response);
  }

  async onPlayerConnected(info) {
    // Patch Request to create Player in API
    let dataType = 'players';
    let playerData = {
      eosID: info.eosID,
      steamID: info.player.steamID,
      lastName: info.player.name,
      lastIP: info.ip
    };
    let response = await patchDataInAPI(dataType, playerData, this.options.accessToken);
    this.verbose(1, response);
  }
}

// Retrieve the latest version from GitHub
async function getLatestVersion(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const response = await fetch(url);
  const data = await response.json();
  return data.tag_name;
}

function handleApiError(error) {
  if (error.response) {
    let errMsg = `${error.response.status} - ${error.response.statusText}`;
    if (error.response.status === 502) {
      errMsg += ' | Unable to connect to the API. My Squad Stats is likely down.';
    }
    return errMsg;
  } else if (error.request) {
    // The request was made but no response was received
    return 'No response received from the API. Please check your network connection.';
  } else {
    // Something happened in setting up the request that triggered an Error
    return `Error: ${error.message}`;
  }
}

async function sendDataToAPI(dataType, data, accessToken) {
  try {
    const response = await axios.post(`https://mysquadstats.com/api/${dataType}`, data, { params: { accessToken } });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

async function patchDataInAPI(dataType, data, accessToken) {
  try {
    const response = await axios.patch(`https://mysquadstats.com/api/${dataType}`, data, { params: { accessToken } });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}

async function getDataFromAPI(dataType, accessToken) {
  try {
    const response = await axios.get(`https://mysquadstats.com/api/${dataType}`, { params: { accessToken } });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
}