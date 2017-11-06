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

  read(...args) {
    const socket = this.socket;

    return new Promise((resolve, reject) => {
      if (!socket.readable || socket.closed || socket.destroyed) {
        return resolve();
      }

      const onReadable = () => {
        let chunk = socket.read(...args);

        if (chunk != null) {
          socket.removeListener('close', onceClose);
          socket.removeListener('error', onceError);
          socket.removeListener('end', onceEnd);
          socket.removeListener('readable', onReadable);
          resolve(chunk);
        }
      }

      const onceClose = () => {
        socket.removeListener('end', onceEnd);
        socket.removeListener('error', onceError);
        socket.removeListener('readable', onReadable);
        resolve(socket.bytesWritten || 0)

      }

      const onceEnd = () => {
        socket.removeListener('close', onceClose);
        socket.removeListener('error', onceError);
        socket.removeListener('readable', onReadable);
        resolve();
      }

      const onceError = err => {
        socket.removeListener('close', onceClose);
        socket.removeListener('end', onceEnd);
        socket.removeListener('readable', onReadable);
        reject(err);
      }

      socket.once('close', onceClose);
      socket.on('readable', onReadable);
      socket.once('end', onceEnd);
      socket.once('error', onceError);

      onReadable();
    });
  }

  write(...args) {
    const socket = this.socket

    return new Promise((resolve, reject) => {
      if (!socket.writable || socket.closed || socket.destroyed) {
        return reject(new Error(`write after end`));
      }

      const onceError = err => {
        this._errored = err;
        reject(err);
      }

      socket.once('error', onceError);

      if (socket.write(...args)) {
        socket.removeListener('error', onceError);
        if (!this._errored) {
          resolve(chunk.length);
        }
      } else {
        const onceDrain = () => {
          socket.removeListener('close', onceClose);
          socket.removeListener('finish', onceFinish);
          socket.removeListener('error', onceError);
          resolve(chunk.length);
        }

        const onceClose = () => {
          socket.removeListener('drain', onceDrain);
          socket.removeListener('error', onceError);
          socket.removeListener('finish', onceFinish);
          resolve(chunk.length);
        }

        const onceFinish = () => {
          socket.removeListener('close', onceClose);
          socket.removeListener('drain', onceDrain);
          socket.removeListener('error', onceError);
          resolve(chunk.length)
        }

        socket.once('close', onceClose);
        socket.once('drain', onceDrain);
        socket.once('finish', onceFinish);
      }
    })
  }
}

// vim: set ts=2 sw=2 tw=80:
