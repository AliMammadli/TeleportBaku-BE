const mongoose = require('mongoose')
const Schema = mongoose.Schema

const driverSchema = new Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    device: { type: String, required: true },
    autoType: { type: String, required: true, default: 'sedan' },
})

module.exports = mongoose.model('Drivers', driverSchema)