'use strict'
var express = require('express');
const body_parser = require('body-parser')
var paypal = require('paypal-rest-sdk');
var localtunnel = require('localtunnel');
var app = express();
const port = 3005
var lt_url = 'http://9c5006f5.ngrok.io';
var payment_price = 50;
var host = null;
var payout_price = 90;

paypal.configure({
    
});

app.set('view engine', 'ejs');
app.use(body_parser())
app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.get('/', (req, res) => {
    payment_price = req.body.pay_price;
    payout_price = req.body.payout_price;
    console.log("Payment Price: " + payment_price)
    console.log("Payout Price" + payout_price)

    res.render('index')
});

app.post('/', (req, res) => {
    payment_price = req.body.pay_price;
    payout_price = req.body.payout_price;
    host = req.body.host;

    console.log("Payment Price: " + payment_price)
    console.log("Payout Price: " + payout_price)

    if(payment_price != null || payout_price != null){
        res.render('index')
    }
    else{
        res.render('cancel')
    }
});

app.get('/cancel', (req, res) => res.render('cancel'));

app.get('/paypal', (req, res) => {
    var create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": `${lt_url}/success`,
            "cancel_url": `${lt_url}/cancel`,
        },
        "transactions": [{
            "amount": {
                "currency": "GBP",
                "total": `${payment_price}`
            },
            "description": "Individual Bill Total"
        }]
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } 
        else {
            console.log(payment);
            res.redirect(payment.links[1].href)
        }
    });
});

app.get('/success', (req, res) =>{
    var paymentID = req.query.paymentId;
    var payerID = req.query.PayerID;

    console.log(req.body);

    var execute_payment_json = {
        "payer_id": payerID,
        "transactions": [{
            "amount": {
                "currency": "GBP",
                "total": `${payment_price}`
            }
        }]
    };

    var sender_batch_id = Math.random().toString(36).substring(9);

    var create_payout_json = {
        "sender_batch_header": {
            "sender_batch_id": sender_batch_id,
            "email_subject": "You have a payment"
        },
        "items": [
            {
                "recipient_type": "EMAIL",
                "amount": {
                    "value": `${payout_price}`,
                    "currency": "GBP"
                },
                "receiver": `${host}`,
                "note": "Thank you.",
                "sender_item_id": "Split It"
            }
        ]
    };

    paypal.payment.execute(paymentID, execute_payment_json, function(error, payment){
        if (error) {
            throw error;
        } 
        else {
            res.render('success');
            console.log("Get Payment Response");
            console.log(JSON.stringify(payment));
            console.log("Host: " + host)

            paypal.payout.create(create_payout_json, 'false', function (error, payout) {
                if (error) {
                    console.log(error.response);
                    throw error;
                } else {
                    console.log("Create Single Payout Response");
                    console.log(payout);
                }
            });
        }
    });
});


