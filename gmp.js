/* Greenbone Security Assistant Deamon X
 *
 * Authors:
 * Björn Ricks <bjoern.ricks@greenbone.net>
 *
 * Copyright:
 * Copyright (C) 2017 Greenbone Networks GmbH
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301 USA.
 */
const fs = require('fs');
const promisify = require('es6-promisify');
const xml2js = require('xml2js')
const chalk = require('chalk');
const sax = require('sax');
const Socket = require('socketize');

const x2js = promisify(xml2js.parseString);
const builder = new xml2js.Builder({headless: true});


let config = {
  GVMD_SOCKET_PATH: '',
};

if (fs.existsSync('./config.js')) {
  config = require('./config.js');
}

class Parser {
  constructor() {
    this.done = false;
    this.parser = sax.parser(false);

    this.parser.onopentag = node => {
      if (this.first === undefined) {
        this.first = node.name;
      }
    }

    this.parser.onclosetag = name => {
      if (this.first === name) {
        this.done = true;
      }
    }

    this.read = this.read.bind(this);
    this.isDone = this.isDone.bind(this);
  }

  read(data = '', chunk) {
    this.parser.write(chunk);
    return data += chunk;
  }

  isDone() {
    return this.done;
  }
}

class GmpConnection {

  constructor(username, password, id) {
    this._username = username;
    this._password = password;

    this._connected = false;
    this._authenticated = false;

    this.socket = new Socket()

    this.id = 'connection-' + id;
  }

  connect() {
    if (this._connected) {
      return Promise.resolve(this);
    }

    return this.socket.connect({path: config.GVMD_SOCKET_PATH}).then(() => {
      this._connected = true;

      console.log(chalk.blue(this.id), chalk.green('connected to manager'));

      return this;
    }).catch(err => {
        console.log(chalk.red('Could not connect to manager', err));
    });
  }

  auth() {
    if (this._authenticated) {
      return Promise.resolve(this);
    }

    const auth = {
      authenticate: {
        credentials: {
          username: this._username,
          password: this._password,
        },
      },
    };

    return this.send(auth).then(obj => {
      const resp = obj.authenticate_response;

      if (resp.$.status !== '200') {
        throw Error(resp.$.status_text);
      }

      this._authenticated = true;

      return this;
    });
  }

  send(obj) {
    const xml = builder.buildObject(obj);

    console.log(chalk.blue(this.id), chalk.green('request'), xml);

    const parser = new Parser();

    return this.connect()
      .then(() => this.socket.write(xml))
      .then(() => this.socket.read(parser.read, parser.isDone))
      .then(data => {
        console.log(chalk.blue(this.id), chalk.green('response'), data);
        return x2js(data);
      });
  }

  sendAuthenticated(obj) {
    return this.auth().then(() => this.send(obj));
  }
}

class Gmp {

  constructor(username, password) {
    this._username = username;
    this._password = password;
    this._connection_count = 1;

    this._connections = [
      new GmpConnection(username, password, this._connection_count),
    ];
  }

  _getConnection() {
    if (this._connections.length > 0) {
      return this._connections.pop();
    }
    return this._newConnection();
  }

  _newConnection() {
    this._connection_count += 1;
    return new GmpConnection(this._username, this._password,
      this._connection_count);
  }

  _send(data) {
    const connection = this._getConnection();

    return connection.sendAuthenticated(data).then(data => {
      this._connections.unshift(connection);
      return data;
    });
  }

  getTasks() {
    const task = {
      get_tasks: {
        $: {
          details: 1,
        }
      },
    };
    return this._send(task);
  }

  getScanConfig(id) {
    return this._send({
      get_configs: {
        $: {
          config_id: id,
        },
      },
    });
  }

  getScanner(id) {
    return this._send({
      get_scanners: {
        $: {
          scanner_id: id,
        },
      },
    });
  }

  getTarget(id) {
    return this._send({
      get_targets: {
        $: {
          target_id: id,
        },
      },
    });
  }
}

module.exports = Gmp;
