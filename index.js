const { ApolloServer, gql, PubSub } = require("apollo-server")
const mongoose = require('mongoose')
const DriverSchema = require('./models/driver')

var loki = require('lokijs')
var db = new loki('Teleport')
var drivers = db.addCollection('drivers')

const NEW_DRIVERS = "NEW_DRIVERS"

const PORT = process.env.PORT || 4000

const typeDefs = gql`
  type Query {
    drivers: [Driver!]
  }
  type Driver {
    id: ID!
    lokiId: Int!
    name: String!
    phone: String!
    device: String!
    autoType: String!
    coords: Coords!
  }
  type Coords {
    lat: Float!
    lng: Float!
  }
  input DriverInfo {
    id: Int!
    name: String!
    lat: Float!
    lng: Float!
  }
  type Response {
    success: Boolean!
  }
  type registerResponse {
    success: Boolean!
    userId: String!
  }
  type activateResponse {
    success: Boolean!
    lokiId: Int!
  }
  type Mutation {
    registerDriver(name: String!, phone: String!, device: String!): registerResponse!
    activateDriver(id: String!, lat: Float!, lng: Float!): activateResponse!
    updateCoords(lokiId: Int!, lat: Float!, lng: Float!): Response!
  }
  type Subscription {
    newDrivers: [Driver!]
  }
`

const resolvers = {
    Subscription: {
        newDrivers: {
            subscribe: (_, __, { pubsub }) => pubsub.asyncIterator(NEW_DRIVERS)
        }
    },
    Query: {
        drivers: () => {
            return drivers.find()
        }
    },
    Mutation: {
        registerDriver: async (_, { name, phone, device }) => {
            const driver = new DriverSchema({ name, phone, device })
            return driver.save().then((doc) => { return { success: true, userId: doc._id } }).catch((err) => { console.log('[Mutation] registerDriver:', err); throw err })
        },
        activateDriver: async (_, { id, lat, lng }) => {
            const data = await DriverSchema.findById(id)
            console.log('[Mutation] activateDriver(mongodb)', data)
            if (drivers.find({ 'name': data.name }).length === 0) {
                drivers.insert({
                    id: data._id,
                    name: data.name,
                    phone: data.phone,
                    device: data.device,
                    autoType: data.autoType,
                    coords: { lat, lng }
                })
            }

            const activeDrivers = drivers.find()
            pubsub.publish(NEW_DRIVERS, { newDrivers: activeDrivers })
            console.log('[Mutation] activateDriver(loki)', activeDrivers)

            return { success: true, lokiId: drivers.find({ 'name': data.name })[0]['$loki'] }
        },
        updateCoords: (_, { lokiId, lat, lng }, { pubsub }) => {
            let driver = drivers.get(lokiId)
            driver.coords.lat = lat
            driver.coords.lng = lng
            drivers.update(driver)

            const activeDrivers = drivers.find()
            pubsub.publish(NEW_DRIVERS, { newDrivers: activeDrivers })
            return { success: true }
        }
    }
}

const pubsub = new PubSub()

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req, res }) => ({ req, res, pubsub })
})

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PSWD}@tb-cluster.ym4cj.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    return server.listen({ port: PORT }).then(({ url }) => console.log(`Server started at: ${url}`))
})