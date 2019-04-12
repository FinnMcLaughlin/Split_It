var paypal = require('paypal-checkout');
var client = require('braintree-web/client');
var paypalCheckout = require('braintree-web/paypal-checkout');

paypal.Button.render({
  braintree: {
    client: client,
    paypalCheckout: paypalCheckout
  },
  // The rest of your configuration
}, '#id-of-element-where-paypal-button-will-render');