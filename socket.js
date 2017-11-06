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

class Socket {

  constructor(...args) {
    this.socket = new net.Socket(...args);
    this.socket.setEncoding('UTF-8');
  }

  connect(...args) {
    return new Promise((resolve, reject) => {
      if (this.socket.destroyed) {
        reject(new Error('socket already destroyed'));
      }

      const onError =  err => {
        this.socket.removeListener('error', onError);
        this.socket.removeListener('connect', onConnected);

        reject(err);
      };

      const onConnected = () => {
        this.socket.removeListener('error', onError);
        this.socket.removeListener('connect', onConnected);

        resolve();
      };

      this.socket.once('error', onError);
      this.socket.once('connect', onConnected);

      this.socket.connect(...args)
    });
  }

  read(...args) {
    return new Promise((resolve, reject) => {
      if (!this.socket.readable || this.socket.closed ||
        this.socket.destroyed) {
        return resolve();
      }

      const onReadable = () => {
        let chunk = this.socket.read(...args);

        if (chunk != null) {
          this.socket.removeListener('close', onceClose);
          this.socket.removeListener('error', onceError);
          this.socket.removeListener('end', onceEnd);
          this.socket.removeListener('readable', onReadable);
          resolve(chunk);
        }
      }

      const onceClose = () => {
        this.socket.removeListener('end', onceEnd);
        this.socket.removeListener('error', onceError);
        this.socket.removeListener('readable', onReadable);
        resolve();

      }

      const onceEnd = () => {
        this.socket.removeListener('close', onceClose);
        this.socket.removeListener('error', onceError);
        this.socket.removeListener('readable', onReadable);
        resolve();
      }

      const onceError = err => {
        this.socket.removeListener('close', onceClose);
        this.socket.removeListener('end', onceEnd);
        this.socket.removeListener('readable', onReadable);
        reject(err);
      }

      this.socket.once('close', onceClose);
      this.socket.on('readable', onReadable);
      this.socket.once('end', onceEnd);
      this.socket.once('error', onceError);

      onReadable();
    });
  }

  write(data, encoding) {
    return new Promise((resolve, reject) => {
      if (!this.socket.writable || this.socket.closed ||
        this.socket.destroyed) {
        return reject(new Error(`write after end`));
      }

      const onceError = err => {
        this._errored = err;
        reject(err);
      }

      this.socket.once('error', onceError);

      if (this.socket.write(data, encoding)) {
        this.socket.removeListener('error', onceError);
        if (!this._errored) {
          resolve(data.length);
        }
      } else {
        const onceDrain = () => {
          this.socket.removeListener('close', onceClose);
          this.socket.removeListener('finish', onceFinish);
          this.socket.removeListener('error', onceError);
          resolve(data.length);
        }

        const onceClose = () => {
          this.socket.removeListener('drain', onceDrain);
          this.socket.removeListener('error', onceError);
          this.socket.removeListener('finish', onceFinish);
          resolve(data.length);
        }

        const onceFinish = () => {
          this.socket.removeListener('close', onceClose);
          this.socket.removeListener('drain', onceDrain);
          this.socket.removeListener('error', onceError);
          resolve(data.length)
        }

        this.socket.once('close', onceClose);
        this.socket.once('drain', onceDrain);
        this.socket.once('finish', onceFinish);
      }
    })
  }
}

module.exports = Socket;

// vim: set ts=2 sw=2 tw=80:
