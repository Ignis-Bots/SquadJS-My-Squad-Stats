import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

import BasePlugin from './base-plugin.js';

const currentVersion = 'v3.0.0';

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

    this.onChatCommand = this.onChatCommand.bind(this);
    this.onNewGame = this.onNewGame.bind(this);
    this.onPlayerConnected = this.onPlayerConnected.bind(this);
    this.onPlayerWounded = this.onPlayerWounded.bind(this);
    this.onPlayerDied = this.onPlayerDied.bind(this);
    this.onPlayerRevived = this.onPlayerRevived.bind(this);
    this.isProcessingFailedRequests = false;
  }

  async prepareToMount() {

  }

  async mount() {
    // Post Request to create Server in API
    let dataType = 'servers';
    let serverData = {
      name: this.server.serverName,
      version: currentVersion
    };
    let response = await sendDataToAPI(dataType, serverData, this.options.accessToken);
    this.verbose(1, `Mount-Server | ${response.successStatus} | ${response.successMessage}`);

    // Get Request to get Match Info from API
    dataType = 'matches';
    let matchResponse = await getDataFromAPI(dataType, this.options.accessToken);
    this.match = matchResponse.match;
    this.verbose(1, `Mount-Match | ${matchResponse.successStatus} | ${matchResponse.successMessage}`);

    // Get Admins
    const admins = await this.server.getAdminsWithPermission('canseeadminchat');
    // Make a players request to the API for each admin
    for (let i = 0; i < admins.length; i++) {
      let adminId = admins[i];
      let playerData = {};

      if (adminId.length === 17) {
        playerData = {
          steamID: adminId,
          isAdmin: 1
        };
      } else {
        playerData = {
          eosID: adminId,
          isAdmin: 1
        };
      }

      let dataType = 'players';
      let response = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      // Only log the response if it's an error
      if (response.successStatus === 'Error') {
        this.verbose(1, `Mount-Admins | ${response.successStatus} | ${response.successMessage}`);
      }
    }

    // Subscribe to events
    this.server.on(`CHAT_COMMAND:!mss`, this.onChatCommand);
    this.server.on('NEW_GAME', this.onNewGame);
    this.server.on('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.on('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.on('PLAYER_DIED', this.onPlayerDied);
    this.server.on('PLAYER_REVIVED', this.onPlayerRevived);
    this.checkVersion();
    this.interval = setInterval(
      this.pingMySquadStats.bind(this),
      60000
    );
  }

  async unmount() {
    this.server.removeEventListener(`CHAT_COMMAND:!mss`, this.onChatCommand);
    this.server.removeEventListener('NEW_GAME', this.onNewGame);
    this.server.removeEventListener('PLAYER_CONNECTED', this.onPlayerConnected);
    this.server.removeEventListener('PLAYER_WOUNDED', this.onPlayerWounded);
    this.server.removeEventListener('PLAYER_DIED', this.onPlayerDied);
    this.server.removeEventListener('PLAYER_REVIVED', this.onPlayerRevived);
    clearInterval(this.interval);
  }

  async checkVersion() {
    const owner = 'IgnisAlienus';
    const newOwner = 'Ignis-Bots';
    const repo = 'SquadJS-My-Squad-Stats';
    let latestVersion;
    let currentOwner;

    try {
      latestVersion = await getLatestVersion(owner, repo);
      currentOwner = owner;
    } catch (error) {
      this.verbose(1, `Error retrieving the latest version of ${repo} from ${owner}:`, error);
      try {
        latestVersion = await getLatestVersion(newOwner, repo);
        currentOwner = newOwner;
      } catch (error) {
        this.verbose(1, `Error retrieving the latest version of ${repo} from ${newOwner}:`, error);
        return;
      }
    }

    if (currentVersion < latestVersion) {
      this.verbose(1, `A new version of ${repo} is available. Updating...`);

      const updatedCodeUrl = `https://raw.githubusercontent.com/${currentOwner}/${repo}/${latestVersion}/squad-server/plugins/my-squad-stats.js`;
      const updatedCodeResponse = await axios.get(updatedCodeUrl);

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const filePath = path.join(__dirname, 'my-squad-stats.js');
      fs.writeFileSync(filePath, updatedCodeResponse.data);

      this.verbose(1, `Successfully updated ${repo} to version ${latestVersion}`);
    } else if (currentVersion > latestVersion) {
      this.verbose(1, `You are running a newer version of ${repo} than the latest version.\nThis likely means you are running a pre-release version.\nCurrent version: ${currentVersion} Latest Version: ${latestVersion}\nhttps://github.com/${currentOwner}/${repo}/releases`);
    } else if (currentVersion === latestVersion) {
      this.verbose(1, `You are running the latest version of ${repo}.`);
    } else {
      this.verbose(1, `Unable to check for updates in ${repo}.`);
    }
  }

  async pingMySquadStats() {
    this.verbose(1, 'Pinging My Squad Stats...');
    if (this.isProcessingFailedRequests) {
      this.verbose(1, 'Already processing failed requests...');
      return;
    }
    this.isProcessingFailedRequests = true;

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    let dataType = 'ping';
    let response = await getDataFromAPI(dataType, this.options.accessToken);
    if (response.successMessage === 'pong') {
      this.verbose(1, 'Pong! My Squad Stats is up and running.');
      // Check for any failed requests and retry
      const filePath = path.join(__dirname, '..', 'MySquadStats_Failed_Requests', 'send-retry-requests.json');
      if (fs.existsSync(filePath)) {
        this.verbose(1, 'Retrying failed POST requests...');
        let failedRequests = JSON.parse(fs.readFileSync(filePath));
        for (let i = 0; i < failedRequests.length; i++) {
          let request = failedRequests[i];
          let retryResponse = await sendDataToAPI(request.dataType, request.data, this.options.accessToken);
          this.verbose(1, `${retryResponse.successStatus} | ${retryResponse.successMessage}`);
          if (retryResponse.successStatus === 'Success') {
            // Remove the request from the array
            failedRequests.splice(i, 1);
            // Decrement i so the next iteration won't skip an item
            i--;
            // Write the updated failedRequests array back to the file
            fs.writeFileSync(filePath, JSON.stringify(failedRequests));
          }
          // Wait for 5 seconds before processing the next request
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        // Delete the file if there are no more failed requests
        if (failedRequests.length === 0) {
          fs.unlinkSync(filePath);
        }
        this.verbose(1, 'Finished retrying failed POST requests.');
      }
      const patchFilePath = path.join(__dirname, '..', 'MySquadStats_Failed_Requests', 'patch-retry-requests.json');
      if (fs.existsSync(patchFilePath)) {
        this.verbose(1, 'Retrying failed PATCH requests...');
        let failedRequests = JSON.parse(fs.readFileSync(patchFilePath));
        for (let i = 0; i < failedRequests.length; i++) {
          let request = failedRequests[i];
          let retryResponse = await patchDataInAPI(request.dataType, request.data, this.options.accessToken);
          this.verbose(1, `${retryResponse.successStatus} | ${retryResponse.successMessage}`);
          if (retryResponse.successStatus === 'Success') {
            // Remove the request from the array
            failedRequests.splice(i, 1);
            // Decrement i so the next iteration won't skip an item
            i--;
            // Write the updated failedRequests array back to the file
            fs.writeFileSync(patchFilePath, JSON.stringify(failedRequests));
          }
          // Wait for 5 seconds before processing the next request
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        // Delete the file if there are no more failed requests
        if (failedRequests.length === 0) {
          fs.unlinkSync(patchFilePath);
        }
        this.verbose(1, 'Finished retrying failed PATCH requests.');
      }
    }
    this.isProcessingFailedRequests = false;
  }

  async onChatCommand(info) {
    // Check if message is empty
    if (info.message.length === 0) {
      await this.server.rcon.warn(
        info.player.steamID,
        `Please input your linking code given by MySquadStats.com Bot using /link.`
      );
      return;
    }
    // Check if message is not the right length
    if (info.message.length !== 6) {
      await this.server.rcon.warn(
        info.player.steamID,
        `Please input a valid 6-digit linking code.`
      );
      return;
    }
    // Get Player from API
    let dataType = `players?search=${info.player.steamID}`;
    let response = await getDataFromAPI(dataType, this.options.accessToken);
    if (response.successStatus === 'Error') {
      await this.server.rcon.warn(
        info.player.steamID,
        `An error occurred while trying to link your account. Please try again later.`
      );
      return;
    }
    let player = response.player;

    // If discordID is already linked, return error
    if (player.discordID !== null) {
      await this.server.rcon.warn(
        info.player.steamID,
        `Your account is already linked.\nContact an MySquadStats.com if this is wrong.`
      );
      return;
    }

    // Post Request to link Player in API
    dataType = 'playerLink';
    let linkData = {
      steamID: info.player.steamID,
      linkCode: info.message
    };
    response = await sendDataToAPI(dataType, linkData, this.options.accessToken);
    if (response.successStatus === 'Error') {
      await this.server.rcon.warn(
        info.player.steamID,
        `An error occurred while trying to link your account. Please try again later.`
      );
      return;
    }

    await this.server.rcon.warn(info.player.steamID, `Thank you for linking your accounts.`);
  }

  async onNewGame(info) {
    // Post Request to create Server in API
    let dataType = 'servers';
    let serverData = {
      name: this.server.serverName,
      version: currentVersion
    };
    let serverResponse = await sendDataToAPI(dataType, serverData, this.options.accessToken);
    this.verbose(1, `NewGame-Server | ${serverResponse.successStatus} | ${serverResponse.successMessage}`);

    // Patch Request to update last Match in API
    dataType = 'matches';
    let matchData = {
      endTime: info.time,
      winner: info.winner
    };
    let updateResponse = await patchDataInAPI(dataType, matchData, this.options.accessToken);
    if (updateResponse.successStatus === 'Error') {
      this.verbose(1, `NewGame-Patch-Match | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
    }

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
    let matchResponse = await sendDataToAPI(dataType, newMatchData, this.options.accessToken);
    this.match = matchResponse.match;
    if (matchResponse.successStatus === 'Error') {
      this.verbose(1, `NewGame-Post-Match${matchResponse.successStatus} | ${matchResponse.successMessage}`);
    }
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
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Wounds-Attacker-Player | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
    }
    if (info.victim) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.victim.eosID,
        steamID: info.victim.steamID,
        lastName: info.victim.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Wounds-Victim-Player | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
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
    if (response.successStatus === 'Error') {
      this.verbose(1, `Wounds-Wound | ${response.successStatus} | ${response.successMessage}`);
    }
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
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Died-Attacker-Player${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
    }
    if (info.victim) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.victim.eosID,
        steamID: info.victim.steamID,
        lastName: info.victim.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Died-Victim-Player | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
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
    if (response.successStatus === 'Error') {
      this.verbose(1, `Died-Death | ${response.successStatus} | ${response.successMessage}`);
    }
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
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Revives-Attacker-Player | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
    }
    if (info.victim) {
      // Patch Request to update Player in API
      let dataType = 'players';
      let playerData = {
        eosID: info.victim.eosID,
        steamID: info.victim.steamID,
        lastName: info.victim.name
      };
      let updateResponse = await patchDataInAPI(dataType, playerData, this.options.accessToken);
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Revives-Victim-Player | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
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
      if (updateResponse.successStatus === 'Error') {
        this.verbose(1, `Revives-Reviver-Player | ${updateResponse.successStatus} | ${updateResponse.successMessage}`);
      }
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
    if (response.successStatus === 'Error') {
      this.verbose(1, `Revives-Revive | ${response.successStatus} | ${response.successMessage}`);
    }
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
    if (response.successStatus === 'Error') {
      this.verbose(1, `Connected-Player | ${response.successStatus} | ${response.successMessage}`);
    }
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
    let status = 'Error';
    if (error.response.status === 502) {
      errMsg += 'Unable to connect to the API. My Squad Stats is likely down.';
    }
    return {
      successStatus: status,
      successMessage: errMsg
    };
  } else if (error.request) {
    // The request was made but no response was received
    return {
      successStatus: 'Error',
      successMessage: 'No response received from the API. Please check your network connection.'
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    return {
      successStatus: 'Error',
      successMessage: `Error: ${error.message}`
    };
  }
}

async function sendDataToAPI(dataType, data, accessToken) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  try {
    const response = await axios.post(`https://mysquadstats.com/api/${dataType}`, data, { params: { accessToken } });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 502) {
      // Save the request details to a local file for later retry
      const requestDetails = {
        dataType: `${dataType}`,
        data: data
      };
      const dirPath = path.join(__dirname, '..', 'MySquadStats_Failed_Requests');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const filePath = path.join(dirPath, 'send-retry-requests.json');
      let failedRequests = [];
      if (fs.existsSync(filePath)) {
        failedRequests = JSON.parse(fs.readFileSync(filePath));
      }
      failedRequests.push(requestDetails);
      fs.writeFileSync(filePath, JSON.stringify(failedRequests));
    }
    return handleApiError(error);
  }
}

async function patchDataInAPI(dataType, data, accessToken) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  try {
    const response = await axios.patch(`https://mysquadstats.com/api/${dataType}`, data, { params: { accessToken } });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 502) {
      // Save the request details to a local file for later retry
      const requestDetails = {
        dataType: `${dataType}`,
        data: data
      };
      const dirPath = path.join(__dirname, '..', 'MySquadStats_Failed_Requests');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      const filePath = path.join(dirPath, 'patch-retry-requests.json');
      let failedRequests = [];
      if (fs.existsSync(filePath)) {
        failedRequests = JSON.parse(fs.readFileSync(filePath));
      }
      failedRequests.push(requestDetails);
      fs.writeFileSync(filePath, JSON.stringify(failedRequests));
    }
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