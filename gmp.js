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
const net = require('net');

const promisify = require('es6-promisify');
const xml2js = require('xml2js')

const x2js = promisify(xml2js.parseString);
const builder = new xml2js.Builder();

const MANAGER_SOCKET_PATH = '/home/bricks/install/trunk/var/run/gvmd.sock';

class Gmp {

  constructor() {
    this.socket = new net.Socket()
    this.socket.setEncoding('UTF-8');

    this.socket.on('data', data => console.log(data));
    this.socket.on('end', () => console.log('connection ended'));
    this.socket.on('close', () => console.log('connection closed'));
  }

  connect() {
    const connect = promisify(this.socket.connect, this.socket);
    return connect({path: MANAGER_SOCKET_PATH}).then(() => {
      console.log('connected to manager');
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

    const write = promisify(this.socket.write, this.socket);
    return write(builder.buildObject(auth));
  }
}

const client = new Gmp();
client.connect().then(() => client.auth('foo', 'bar'));
