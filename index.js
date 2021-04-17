const fs = require('fs')
const csv = require('csv')
const replaceStream = require('replacestream')
const multiStream = require('multistream')
const {
  performance
} = require('perf_hooks')

const readStreams = [
  fs.createReadStream('assets/transactions1.csv'),
  fs.createReadStream('assets/transactions2.csv'),
  fs.createReadStream('assets/transactions3.csv')
]

const writeStream = fs.createWriteStream('output.csv')

const csvStream = csv.parse({ delimiter: '|', quote: false, columns: true })

/* used to track + aggregate current user's transactions */
let userId
let records = []

csvStream.on('data', (record) => {
  if(record['user_id'] === 'user_id')
    return console.warn(`unrecognized entry, may be header ${JSON.stringify(record)}`)

  if(userId !== record['user_id']) {
    writeRecordsToCsv(aggregateRecords(records))
    /* re-initialize userId and transactionObj */
    userId = record['user_id']
    records.length = 0
  }
  records.push(record)
})
.on('skip', (error) => {
  console.error(JSON.stringify(error))
})
.on('end', () => {
  writeRecordsToCsv(aggregateRecords(records))
  const t1 = performance.now()
  console.log(`processing of records took ${t1 - t0} milliseconds.`)
})
.on('error', (error) => {
  console.log(error)
})

const writeHeadersToCsv = () => writeStream.write('"user_id,n,sum,min,max"\n')

const writeRecordsToCsv = ({userId, numTransactions, balance, minBalance, maxBalance} = {}) => {
  if(!userId)
    return
  writeStream.write(`"${userId},${numTransactions},${balance.toFixed(2)},${minBalance.toFixed(2)},${maxBalance.toFixed(2)}"\n`)
}

const aggregateRecords = (records) => {
  if(!records || records.length < 1)
    return
  let result = {}

  result.userId = records[0]['user_id']
  result.numTransactions = records.length
  records.sort(comparisonFunction)

  let date = records[0]['date']
  let dailyMin = Number.MAX_SAFE_INTEGER, dailyMax = Number.MIN_SAFE_INTEGER, balance = 0

  for(const record of records) {
    if(record['date'] !== date) {
      dailyMin = Math.min(dailyMin, balance)
      dailyMax = Math.max(dailyMax, balance)
      date = record['date']
    }

    let amount = record.type === 'debit' ?
      Number(record.amount) * -1 :
      Number(record.amount)
    balance += amount
  }
  dailyMin = Math.min(dailyMin, balance)
  dailyMax = Math.max(dailyMax, balance)

  result.balance = balance
  result.minBalance = dailyMin
  result.maxBalance = dailyMax
  return result
}

/* Compares two strings in YYYY-MM-DD format */
const comparisonFunction = (rc1, rc2) => {
  const d1 = rc1['date'].split('-')
  const d2 = rc2['date'].split('-')
  /* compare year */
  if(d1[0] < d2[0]) return -1
  if(d1[0] > d2[0]) return 1
  /* compare month */
  if(d1[1] < d2[1]) return -1
  if(d1[1] > d2[1]) return 1
  /* compare day */
  if(d1[2] < d2[2]) return -1
  if(d1[2] > d2[2]) return 1
}

writeHeadersToCsv()

const t0 = performance.now()

new multiStream(readStreams)
  .pipe(replaceStream('\\\\', ''))
  .pipe(replaceStream('\\|', ''))
  .pipe(csvStream)
