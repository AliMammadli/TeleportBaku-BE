const { PubSub } = require('graphql-subscriptions')
const gql = require('graphql-tag')
const { makeExecutableSchema } = require('graphql-tools')

const pubsub = new PubSub()

const typeDefs = gql`
    type Query{
        drivers:[driver]
    }

    type Coords{
        lat:Float
        lng: Float
    }
    
    type driver{
        id:Int
        name:String
        coords:Coords
    }

    type Subscription{
        newDriver: driver
    }
`

const resolvers = {
    Subscription: {
        newDriver: {
            subscribe: () => pubsub.asyncIterator('newDriver')
        }

    }
}


exports.pubsub = pubsub;
exports.schema = makeExecutableSchema({ typeDefs, resolvers })