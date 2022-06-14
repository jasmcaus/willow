const moment = require("moment")

const date = moment().add({
    days: 1000
}).toDate()

console.log(date)

const deadline = {
    seconds: moment(date).unix(),
    nanos: moment(date).milliseconds() * 1000,
}

console.log(deadline)