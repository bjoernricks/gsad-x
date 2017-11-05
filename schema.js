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
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
} = require('graphql');

const query_type = new GraphQLObjectType({
  name: 'Query',
  fields: {
    id: {type: GraphQLString},
    name: {type: GraphQLString},
  },
});

module.exports = new GraphQLSchema({query: query_type});

// vim: set ts=2 sw=2 tw=80:
