const express = require('express')
const { ApolloServer, gql, PubSub } = require("apollo-server")
const expressPlayground = require('graphql-playground-middleware-express').default
const schema = require('./schema')

const app = express()
const pubsub = new PubSub()

const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res, pubsub })
})

server.listen().then(({ url }) => console.log(`server started at ${url}`))

// app.use('/graphql', graphqlHTTP({
//     schema,
//     context: { pubsub },
//     graphiql: true
// }))

// app.get('/playground', expressPlayground({ endpoint: '/graphql' }))
// app.listen(4000)