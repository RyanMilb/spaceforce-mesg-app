const MESG = require('mesg-js').application()

let unpaidMessageQue = []

console.log('Spaceforce Message Application Starting')

// Listen for webhook event to store the message and sender address and await payment.
MESG.listenEvent({
    serviceID: 'webhook',
    eventFilter: 'request'
})
    .on('data', async (event) => {
        const parsedData = JSON.parse(event.eventData);
        console.log('webhook Message received: ' + parsedData)
        if (!parsedData) return;//Data missing from event
        const messageToBeSent = parsedData.data.message;
        const senderId = parsedData.data.senderID;
        console.log('Message: ' + messageToBeSent + ' From: ' + senderId)
        unpaidMessageQue.push({
            message: messageToBeSent || 'MESSAGE EMPTY',
            senderId: senderId || 'SENDERID EMPTY'
        })
        console.log('Now waiting on confirmation of payment')
    })
    .on('error', (error) => {
        console.error('an error occurred while listening the request events:', error.message)
    })

//Listen for erc20 Payment, check for unsent messages, 
//  then send message to blockstream sat api requesting invoice
MESG.listenEvent({
    serviceID: 'ethereum-erc20', // The serviceID of the ERC20 service deployed
    eventFilter: 'transfer' // The event we want to listen
}).on('data', (event) => {
    const transfer = JSON.parse(event.eventData)
    const senderId = transfer.from;
    //Only care about transactions that pay the Services account :0x5B91bA1D32B9Cd4c910eb2531f3570c350cd596f
    if (!(transfer.to === '0x5B91bA1D32B9Cd4c910eb2531f3570c350cd596f')) { return }
    console.log('Recieved Payment from ' + senderId)
    const paidMessage = unpaidMessageQue.filter(
        obj => (obj.senderId.toUpperCase() === senderId.toUpperCase()));
    if (paidMessage.length === 0) {
        console.log('ERROR No corrosponding pending message for payment: ');
        unpaidMessageQue.forEach(unpaidMessage => console.log(JSON.stringify(unpaidMessage)));
        return
    }// Don't care about payments that don't have pending messages to send
    console.log('New ERC20 transfer payment received, will send message to blockstream.')
    console.log('Executing fetchInvoice task from sateillite service')

    console.log('Sender: ' + transfer.from)
    console.log('Message: ' + paidMessage[0].message)

    MESG.executeTask({
        serviceID: 'satillite-mesg-service',
        taskKey: 'fetchInvoice',
        inputData: JSON.stringify({ // The input data that task needs
            message: paidMessage[0].message,
            senderid: paidMessage[0].senderId
        })
    }).catch((err) => console.log(err.message))
        .then((result) => {
            // unpaidMessageQue.remove(paidMessage)//TODO: Remove it from unpaid que only if successfull
            console.log('fetchInvoice- Success: ' + JSON.stringify(result))
        })
}).on('error', (err) => console.log(err.message))

//Wait for invoice event and pay it
MESG.listenEvent({
    serviceID: 'satillite-mesg-service',
    eventFilter: 'invoice-generated' // The event we want to listen
}).on('data', event => {
    const invoiceData = JSON.parse(event.eventData)
    const data = JSON.stringify({ // The input data that task needs
        apikey: 'ada6178e-a330-4c5c-b0b8-ed619fbaa17c',//Leaving my API key here. Generate your own here https://dev.opennode.co/
        invoice: invoiceData.invoice || "EMPTY INVOICE",
        invoiceId: invoiceData.invoiceid || "0"
    });
    console.log('invoice generated detected, sending data: ' + data)
    MESG.executeTask({
        serviceID: 'lightning-service',
        taskKey: 'payInvoice',
        inputData: data
    }).catch((err) => console.log(err.message))
        .then((result) => console.log('Invoice Paid Successfully, Message sent from space!'))
}).on('error', (err) => console.log(err.message))

