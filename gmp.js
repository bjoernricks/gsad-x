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

const x2js = promisify(xml2js.parseString);
const builder = new xml2js.Builder();

const Socket = require('./socket');

let config = {
  GVMD_SOCKET_PATH: '',
};

if (fs.existsSync('./config.js')) {
  config = require('./config.js');
}

class Gmp {

  constructor() {
    this.socket = new Socket()
  }

  connect() {
    return this.socket.connect({path: config.GVMD_SOCKET_PATH}).then(() => {
      console.log('connected to manager');
    });
  }

  _send(obj) {
    return this.socket.write(builder.buildObject(obj))
      .then(() => this.socket.read())
      .then(data => {
        console.log(data);
        return x2js(data);
      });
  }

  auth(username, password) {
    const auth = {
      authenticate: {
        credentials: {
          username,
          password,
        },
      },
    };

    return this._send(auth).then(obj => {
      const resp = obj.authenticate_response;
      if (resp.$.status !== '200') {
        throw Error(resp.$.status_text);
      }
    });
  }

  getTasks() {
    const task = {
      get_tasks: '',
    };
    return this._send(task);
  }
}

const client = new Gmp();
client.connect()
  .then(() => client.auth('foo', 'bar'))
  .then(() => client.getTasks())
  .then(data => console.log(data))
  .catch(err => console.error(err));
