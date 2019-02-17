# README
Steps to use:
1. Ensure all 4 sevices are running, the MESG app, and the front end by following the install guide.
2. Navigate to localhost:3001
3. Enter the message you want to broadcast and hit submit.
4. Metamask will popup and charge you 1 MESG token.
5. You can confirm your message was sent at this url https://blockstream.com/satellite-queue/ . Blockstream website does not work on firefox.

## How this works
Once you submit payment, a webhook is sent to the MESG app and is stored temporarily. When the payment is confirmed on Ethereum, the erc20 services alerts the MESG app and then will send the unsent message to the satellite service. Once the satellite service responds with an invoice to be paid, we forward that to our lightning service which is using opennode.co's api.

## Architecture

This app is broken up into 4 services, 1 MESG application, 1 front end react app.

* ERC20 service - Standard MESG service that just tracks transfers for the MESG ERC20 Contract.

* Webhook service - Standard webhook service we use to send the message from the front end to the MESG app. If we could embed the message in the ERC20 transaction that would of been better.

* Satellite service - Wrapper for the [blockstream satellite api](https://blockstream.com/)

* Lightning service - Wrapper for Opennode's [lightning api](https://opennode.co), a custodial service that allows you to send and receive bitcoin and lightning network transactions.

* React Front End

* MESG app
 

## Install Instructions
1.  ERC20 Service, just have to update Infurakey and Contract Address in the yml file
Deploy:
`mesg-core service deploy https://github.com/mesg-foundation/service-ethereum-erc20 --env CONTRACT_ADDRESS=0x420167d87d35c3a249b32ef6225872fbd9ab85d2`

Run:

`mesg-core service start ethereum-erc20 && mesg-core service logs ethereum-erc20`

Blocks should be rolling in the logs. If Transactions are not seen then the yml config needs to be updated. pull the repo manually and update the config contract Address:
`git clone https://github.com/mesg-foundation/service-ethereum-erc20`
```
configuration:
  env:
    - PROVIDER_ENDPOINT=https://mainnet.infura.io/v3/b0b5487c44be47f9998a42c06d8cad7f
    - BLOCK_CONFIRMATIONS=2
    - DEFAULT_GAS_LIMIT=1000000
    - CONTRACT_ADDRESS=0xe41d2489571d322189246dafa5ebde1f4699f498
```

2. This webhook service must be started up before the front end server at #4.
Deploy: 
`mesg-core service deploy https://github.com/mesg-foundation/service-webhook`
Run:
`mesg-core service start webhook && mesg-core service logs webhook`

3. Deploy the Satellite service: 
` mesg-core service deploy https://github.com/RyanMilb/service-satellite-broadcast/`

Run:
` mesg-core service start satillite-mesg-service && mesg-core service logs satillite-mesg-service`

4.  Deploy the lightning service:
`mesg-core service deploy https://github.com/RyanMilb/service-lightning/`
Run:
`mesg-core service start lightning-service && mesg-core service logs lightning-service`

5. The MESG application:
`git clone https://github.com/RyanMilb/spaceforce-mesg-app`

One line 75 replace the API KEY with this key:
`'ada6178e-a330-4c5c-b0b8-ed619fbaa17c'`
Then
`cd spaceforce-mesg-app && npm install && node index.js`
You should see a message about the Spaceforce Message application starting up.

6. spaceforce-frontend
`git clone https://github.com/RyanMilb/spaceforce-frontend.git`

`npm install && npm start`
Hit y to startup on another port because the webhook is running on port 3000.



Navigate to localhost:3001 and send a message from space! Contact Ryan@nostra.network if any issues arise.