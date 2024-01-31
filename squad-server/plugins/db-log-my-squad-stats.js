import Sequelize from 'sequelize';

import BasePlugin from './base-plugin.js';

const { DataTypes } = Sequelize;

export default class DBLogMySquadStats extends BasePlugin {
  static get description() {
    return (
      'The <code>DBLogMySquadStats/code> plugin will log various server statistics and events to a central database for player stat tracking'
    );
  }

  static get defaultEnabled() {
    return false;
  }

  static get optionsSpecification() {
    return {
      database: {
        required: true,
        connector: 'sequelize',
        description: 'The Sequelize connector to log server information to.',
        default: 'mysql'
      },
      overrideOrgID: {
        required: false,
        description: 'A overridden organization ID.',
        default: null
      },
      overrideServerID: {
        required: false,
        description: 'A overridden server ID.',
        default: null
      }
    };
  }

  constructor(server, options, connectors) {
    super(server, options, connectors);

    this.models = {};

    this.models.Server = this.options.database.define('DBLog_Server', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING
      },
      orgId: {
        type: DataTypes.INTEGER
      }
    });

    this.models.Match = this.options.database.define('DBLog_Match', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      dlc: {
        type: DataTypes.STRING
      },
      mapClassname: {
        type: DataTypes.STRING
      },
      layerClassname: {
        type: DataTypes.STRING
      },
      map: {
        type: DataTypes.STRING
      },
      layer: {
        type: DataTypes.STRING
      },
      startTime: {
        type: DataTypes.DATE,
        notNull: true
      },
      endTime: {
        type: DataTypes.DATE
      },
      winner: {
        type: DataTypes.STRING
      }
    });

    this.models.Player = this.options.database.define('DBLog_Player', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        eosID: {
          type: DataTypes.STRING,
          unique: true
        },
        steamID: {
          type: DataTypes.STRING,
          notNull: true,
          unique: true
        },
        lastName: {
          type: DataTypes.STRING
        },
        lastIP: {
          type: DataTypes.STRING
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        indexes: [
          {
            fields: ['eosID']
          },
          {
            fields: ['steamID']
          }
        ]
      }
    );

    this.models.Wound = this.options.database.define('DBLog_Wound', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        time: {
          type: DataTypes.DATE,
          notNull: true
        },
        victimName: {
          type: DataTypes.STRING
        },
        victimTeamID: {
          type: DataTypes.INTEGER
        },
        victimSquadID: {
          type: DataTypes.INTEGER
        },
        attackerName: {
          type: DataTypes.STRING
        },
        attackerTeamID: {
          type: DataTypes.INTEGER
        },
        attackerSquadID: {
          type: DataTypes.INTEGER
        },
        damage: {
          type: DataTypes.FLOAT
        },
        weapon: {
          type: DataTypes.STRING
        },
        teamkill: {
          type: DataTypes.BOOLEAN
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.models.Death = this.options.database.define('DBLog_Death', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        time: {
          type: DataTypes.DATE,
          notNull: true
        },
        woundTime: {
          type: DataTypes.DATE
        },
        victimName: {
          type: DataTypes.STRING
        },
        victimTeamID: {
          type: DataTypes.INTEGER
        },
        victimSquadID: {
          type: DataTypes.INTEGER
        },
        attackerName: {
          type: DataTypes.STRING
        },
        attackerTeamID: {
          type: DataTypes.INTEGER
        },
        attackerSquadID: {
          type: DataTypes.INTEGER
        },
        damage: {
          type: DataTypes.FLOAT
        },
        weapon: {
          type: DataTypes.STRING
        },
        teamkill: {
          type: DataTypes.BOOLEAN
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.models.Revive = this.options.database.define('DBLog_Revive', {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        time: {
          type: DataTypes.DATE,
          notNull: true
        },
        woundTime: {
          type: DataTypes.DATE
        },
        victimName: {
          type: DataTypes.STRING
        },
        victimTeamID: {
          type: DataTypes.INTEGER
        },
        victimSquadID: {
          type: DataTypes.INTEGER
        },
        attackerName: {
          type: DataTypes.STRING
        },
        attackerTeamID: {
          type: DataTypes.INTEGER
        },
        attackerSquadID: {
          type: DataTypes.INTEGER
        },
        damage: {
          type: DataTypes.FLOAT
        },
        weapon: {
          type: DataTypes.STRING
        },
        teamkill: {
          type: DataTypes.BOOLEAN
        },
        reviverName: {
          type: DataTypes.STRING
        },
        reviverTeamID: {
          type: DataTypes.INTEGER
        },
        reviverSquadID: {
          type: DataTypes.INTEGER
        }
      },
      {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci'
      }
    );

    this.models.Server.hasMany(this.models.Match, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.Wound, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.Death, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Server.hasMany(this.models.Revive, {
      foreignKey: { name: 'server', allowNull: false },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Wound, {
      sourceKey: 'steamID',
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Wound, {
      sourceKey: 'steamID',
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Death, {
      sourceKey: 'steamID',
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Death, {
      sourceKey: 'steamID',
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Revive, {
      sourceKey: 'steamID',
      foreignKey: { name: 'attacker' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Revive, {
      sourceKey: 'steamID',
      foreignKey: { name: 'victim' },
      onDelete: 'CASCADE'
    });

    this.models.Player.hasMany(this.models.Revive, {
      sourceKey: 'steamID',
      foreignKey: { name: 'reviver' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.Wound, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.Death, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.models.Match.hasMany(this.models.Revive, {
      foreignKey: { name: 'match' },
      onDelete: 'CASCADE'
    });

    this.onNewGame = this.onNewGame.bind(this);
    this.onPlayerConnected = this.onPlayerConnected.bind(this);
    this.onPlayerWounded = this.onPlayerWounded.bind(this);
    this.onPlayerDied = this.onPlayerDied.bind(this);
    this.onPlayerRevived = this.onPlayerRevived.bind(this);
  }

  async prepareToMount() {

  }

  async mount() {
    await this.models.Server.upsert({
      id: this.options.overrideServerID || this.server.id,
      name: this.server.serverName,
      orgId: this.options.overrideOrgID || this.server.orgID
    });

    this.match = await this.models.Match.findOne({
      where: { server: this.options.overrideServerID || this.server.id, endTime: null }
    });

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
    await this.models.Match.update(
      { endTime: info.time, winner: info.winner },
      { where: { server: this.options.overrideServerID || this.server.id, endTime: null } }
    );

    this.match = await this.models.Match.create({
      server: this.options.overrideServerID || this.server.id,
      dlc: info.dlc,
      mapClassname: info.mapClassname,
      layerClassname: info.layerClassname,
      map: info.layer ? info.layer.map.name : null,
      layer: info.layer ? info.layer.name : null,
      startTime: info.time
    });
  }

  async onPlayerWounded(info) {
    if (info.attacker)
      await this.models.Player.upsert(
        {
          eosID: info.attacker.eosID,
          steamID: info.attacker.steamID,
          lastName: info.attacker.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.victim)
      await this.models.Player.upsert(
        {
          eosID: info.victim.eosID,
          steamID: info.victim.steamID,
          lastName: info.victim.name
        },
        {
          conflictFields: ['steamID']
        }
      );

    await this.models.Wound.create({
      server: this.options.overrideServerID || this.server.id,
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
    });
  }

  async onPlayerDied(info) {
    if (info.attacker)
      await this.models.Player.upsert(
        {
          eosID: info.attacker.eosID,
          steamID: info.attacker.steamID,
          lastName: info.attacker.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.victim)
      await this.models.Player.upsert(
        {
          eosID: info.victim.eosID,
          steamID: info.victim.steamID,
          lastName: info.victim.name
        },
        {
          conflictFields: ['steamID']
        }
      );

    await this.models.Death.create({
      server: this.options.overrideServerID || this.server.id,
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
    });
  }

  async onPlayerRevived(info) {
    if (info.attacker)
      await this.models.Player.upsert(
        {
          eosID: info.attacker.eosID,
          steamID: info.attacker.steamID,
          lastName: info.attacker.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.victim)
      await this.models.Player.upsert(
        {
          eosID: info.victim.eosID,
          steamID: info.victim.steamID,
          lastName: info.victim.name
        },
        {
          conflictFields: ['steamID']
        }
      );
    if (info.reviver)
      await this.models.Player.upsert(
        {
          eosID: info.reviver.eosID,
          steamID: info.reviver.steamID,
          lastName: info.reviver.name
        },
        {
          conflictFields: ['steamID']
        }
      );

    await this.models.Revive.create({
      server: this.options.overrideServerID || this.server.id,
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
    });
  }

  async onPlayerConnected(info) {
    await this.models.Player.upsert(
      {
        eosID: info.eosID,
        steamID: info.player.steamID,
        lastName: info.player.name,
        lastIP: info.ip
      },
      {
        conflictFields: ['steamID']
      }
    );
  }
}

// Retrieve the latest version from GitHub
async function getLatestVersion(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
  const response = await fetch(url);
  const data = await response.json();
  return data.tag_name;
}