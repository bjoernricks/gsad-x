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

const express = require('express');
const graphqlHTTP = require('express-graphql');

const schema = require('./schema');
const Gmp = require('./gmp');
const loader = require('./loader');

const app = express();

let config;
if (fs.existsSync('./config.js')) {
  config = require('./config.js');
}
else {
  throw new Error('Please provide a `config.js`. See config.example.js.');
}

app.use('/graphql', graphqlHTTP(request => {
  const gmp = new Gmp(config.GVMD_SOCKET_PATH, config.USERNAME,
    config.PASSWORD);

  return {
    context: {
      request,
      gmp,
      targetLoader: loader(gmp, 'getTarget'),
      reportLoader: loader(gmp, 'getReport'),
      scanConfigLoader: loader(gmp, 'getScanConfig'),
      scannerLoader: loader(gmp, 'getScanner'),
    },
    schema,
    graphiql: true,
    formatError: error => ({
      message: error.message,
      locations: error.locations,
      stack: error.stack,
      path: error.path,
    }),
  };
}));

app.listen(4000);

console.log('Running a GraphQL API server at http://localhost:4000/graphql');

// vim: set ts=2 sw=2 tw=80:
