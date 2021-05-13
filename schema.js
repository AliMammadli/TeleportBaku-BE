const graphql = require('graphql')
const { GraphQLObjectType, GraphQLString, GraphQLSchema, GraphQLID, GraphQLInt, GraphQLFloat, GraphQLList, GraphQLNonNull } = graphql

const drivers = []
const onDriversUpdates = (fn) => drivers.push(fn)

const CoordsType = new GraphQLObjectType ({
    name: 'Coords',
    fields: () => ({
        lat: {type: GraphQLFloat},
        lng: {type: GraphQLFloat}
    })
})


const DriverType = new GraphQLObjectType ({
    name: 'Driver',
    fields: () => ({
        id: {type: GraphQLID},
        name: {type: GraphQLString},
        coords: {
            type: CoordsType
        }
    })
})


const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        drivers: {
            type: new GraphQLList(DriverType),
            resolve(parent, args){
                return drivers
            }
        }
    }
})


const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addDriver: {
            type: DriverType,
            args: {
                id: {type: new GraphQLNonNull(GraphQLInt)},
                name: {type: new GraphQLNonNull(GraphQLString)},
                lat: {type: new GraphQLNonNull(GraphQLFloat)},
                lng: {type: new GraphQLNonNull(GraphQLFloat)}
            },
            resolve(parent, args, { pubsub }){
                drivers.push({
                    id: args.id === 9999 ? drivers.length : args.id,
                    name: args.name,
                    coords: {
                        lat: args.lat,
                        lng: args.lng
                    }
                })
                // drivers.forEach((fn) => fn())
                pubsub.publish('newDriver', { newDriver: drivers })
                return drivers
            }
        }
    }
})

const Subscription = new GraphQLObjectType({
    name: 'Subscription',
    fields: {
        drivers: {
            type: new GraphQLList(DriverType),
            subscribe: (parent, args, { pubsub }) => {
                console.log('[schema] Subscription', pubsub)
                pubsub.asyncIterator('newDriver')
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation,
    subscription: Subscription
})