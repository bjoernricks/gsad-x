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
const {
  GraphQLID,
  GraphQLList,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLString,
} = require('graphql');

const commentFieldType = {
  type: GraphQLString,
  resolve: xml => xml.comment[0],
};

const idFieldType = {
  type: GraphQLID,
  resolve: xml => xml.$.id,
};

const nameFieldType = {
  type: GraphQLString,
  resolve: xml => xml.name[0],
};

const ownerType = new GraphQLObjectType({
  name: 'Owner',
  description: 'The owner of the entity',
  fields: {
    name: nameFieldType,
  },
});

const ownerFieldType = {
  type: ownerType,
  resolve: xml => xml.owner[0],
};

const configType = new GraphQLObjectType({
  name: 'ScanConfig',
  description: 'A Scan Config',
  fields: {
    id: idFieldType,
    name: nameFieldType,
    owner: ownerFieldType,
    comment: commentFieldType,
  },
});

const scannerType = new GraphQLObjectType({
  name: 'Scanner',
  description: 'A Scanner',
  fields: {
    id: idFieldType,
    name: nameFieldType,
    comment: commentFieldType,
    owner: ownerFieldType,
  },
});

const taskType = new GraphQLObjectType({
  name: 'Task',
  description: 'A Task',
  fields: {
    id: idFieldType,
    name: nameFieldType,
    comment: commentFieldType,
    owner: ownerFieldType,
    config: {
      type: configType,
      resolve: (xml, args, {scanConfigLoader}) => {
        return scanConfigLoader.load(xml.config[0].$.id).then(data =>
          data.get_configs_response.config[0]
        );
      },
    },
    scanner: {
      type: scannerType,
      resolve: (xml, args, {scannerLoader}) => {
        return scannerLoader.load(xml.scanner[0].$.id).then(data =>
          data.get_scanners_response.scanner[0]
        );
      },
    }
  },
});

const queryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    getTasks: {
      type: new GraphQLList(taskType),
      resolve: (source, args, context, info) => {
        const {gmp} = context;
        return gmp.getTasks().then(data => {
          const tasks = data.get_tasks_response.task;
          return tasks;
        });
      },
    },
  },
});

module.exports = new GraphQLSchema({query: queryType});

// vim: set ts=2 sw=2 tw=80:
