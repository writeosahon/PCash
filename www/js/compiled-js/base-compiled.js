"use strict";

/**
 * Created by UTOPIA SOFTWARE on 19/04/2017.
 */

/**
 * file provides the "base" framework/utilities required to launch the app. E.g. file creates the base namespace which
 * the app is built on.
 *
 * The author uses the terms 'method' and function interchangeably; likewise the terms 'attribute' and 'property' are
 * also used interchangeably
 **/

var utopiasoftware = {
    saveup: {

        /**
         * method is used to verify a user's phone number. it returns a Promise object. a resolved promise
         * means the phone number was verified; a rejected promise means phone number verification failed.
         *
         * @param phoneNumber
         * @returns {Promise}
         */
        validatePhoneNumber: function validatePhoneNumber(phoneNumber) {

            phoneNumber = "" + phoneNumber; // ensure phone number is seen as a string

            var smsWatcherTimer = null; // holds the timer used to stop the sms watcher

            var rejectPromise = null; // holds the reject function of the main Promise object

            if (phoneNumber.startsWith("0")) {
                // the phone number starts with 0, replace it with international dialing code
                phoneNumber = phoneNumber.replace("0", "+234");
            }
            // show a loader message
            $('#phone-verification-modal .modal-message').html("Verifying Phone Number...");
            $('#phone-verification-modal').get(0).show(); // show loader

            // create the Promise object which will indicate if a phone was verified or not
            var phoneNumberVerifiedPromise = new Promise(function (resolve, reject) {
                rejectPromise = reject;
                var randomNumber = ""; //holds the random number to be sent in the sms

                // start listening to the user's sms inbox
                new Promise(function (resolve2, reject2) {
                    SMS.startWatch(resolve2, reject2);
                }).then(function () {
                    // intercept any incoming sms
                    return new Promise(function (res, rej) {
                        SMS.enableIntercept(true, res, rej);
                    });
                }).then(function () {
                    // sms watch of the user's inbox has been started
                    // add listener for new arriving sms
                    document.addEventListener('onSMSArrive', function (smsEvent) {
                        var sms = smsEvent.data;
                        if (sms.address == phoneNumber && sms.body == "PostCash " + randomNumber) {
                            clearTimeout(smsWatcherTimer); // stop the set timer
                            SMS.stopWatch(function () {}, function () {}); // stop sms watch
                            SMS.enableIntercept(false, function () {}, function () {}); // stop sms intercept
                            document.removeEventListener('onSMSArrive'); // remove sms arrival listener
                            $('#phone-verification-modal').get(0).hide(); // hide loader
                            resolve(); // resolve promise
                        }
                    });

                    // return a Promise object whaich sends sms to the phoneNumber parameter
                    return new Promise(function (resolve3, reject3) {

                        var randomGen = new Random(Random.engines.nativeMath); // random number generator

                        for (var i = 0; i < 6; i++) {
                            randomNumber += "" + randomGen.integer(0, 9);
                        }
                        SMS.sendSMS(phoneNumber, "PostCash " + randomNumber, resolve3, reject3);
                    });
                }).then(function () {
                    smsWatcherTimer = setTimeout(function () {
                        SMS.stopWatch(function () {}, function () {});
                        SMS.enableIntercept(false, function () {}, function () {}); // stop sms intercept
                        document.removeEventListener('onSMSArrive');
                        $('#phone-verification-modal').get(0).hide(); // hide loader
                        rejectPromise("phone number verification failed"); // reject the promise i.e. verification failed
                    }, 31000);
                }).catch(function () {
                    try {
                        clearTimeout(smsWatcherTimer);
                    } catch (err) {}
                    SMS.stopWatch(function () {}, function () {});
                    SMS.enableIntercept(false, function () {}, function () {}); // stop sms intercept
                    document.removeEventListener('onSMSArrive');
                    $('#phone-verification-modal').get(0).hide(); // hide loader
                    reject("phone number verification failed");
                });
            });

            return phoneNumberVerifiedPromise;
        },

        /**
         * method is used to sort the collection of Nigerian Banks returned by MoneyWave.
         * Banks objects are sorted in ascending order of bank name.
         */
        sortBanksData: function sortBanksData() {
            // return the Promise object
            return new Promise(function (resolve, reject) {
                // retrieve the list of banks
                Promise.resolve($.ajax({
                    url: "banks.json",
                    type: "get",
                    dataType: "json",
                    timeout: 240000 // wait for 4 minutes before timeout of request

                })).then(function (banksData) {
                    // get the banks object
                    var banksArray = []; // holds the banks array
                    // convert each property and value of the banks object to an object
                    // and store each object in a 'banks array'
                    for (var prop in banksData) {
                        // create the bank object
                        var bankOject = {};
                        bankOject[prop] = banksData[prop];
                        // add bank object to banks array
                        banksArray.push(bankOject);
                    }

                    return banksArray; // return the banks array to the next stage for proper array sorting
                }).then(function (banksArrayData) {
                    // get the banks array data
                    // function is used to sort the banks array data in ascending order by name
                    // sort and return the banks array data
                    return banksArrayData.sort(function (item1, item2) {
                        var item1Val = ""; // holds the value to be compared in item1
                        var item2Val = ""; //holds the value to be compared in item2
                        for (var val1 in item1) {
                            item1Val = item1[val1]; // assign the value gotten from item1
                        }
                        for (var val2 in item2) {
                            item2Val = item2[val2]; // assign the value gotten from item2
                        }
                        // begin comparison test for sorting
                        if (item1Val.toLocaleUpperCase() < item2Val.toLocaleUpperCase()) {
                            return -1;
                        }
                        if (item1Val.toLocaleUpperCase() > item2Val.toLocaleUpperCase()) {
                            return 1;
                        }
                        return 0;
                    });
                }).then(function (sortedBankArrayData) {
                    // receive the sorted bank array
                    resolve(sortedBankArrayData); // resolve the promise with the sorted bank array
                }).catch();
            });
        },

        /**
         * this object encapsulates the payment gateway credentials
         */
        moneyWaveObject: {

            /**
             * PRIVATE TOKEN OBJECT. NEVER TO BE ACCESSED DIRECTLY OUTSIDE OF THE PAYMENT GATEWAY OBJECT
             */
            __tokenObject: { tok: "", time: 0 },

            /**
             * public property, holds the url for the gateway
             */
            gateway: "https://live.moneywaveapi.co/",

            /**
             * public object holds the keys for the gateway
             */
            key: { "apiKey": "lv_NOR9WTV79WQ7CWKAACCW",
                "secret": "lv_WVTSFVRP02RMV4AMZXSQA3MCIRA74T" },

            /**
             * public property return a Promise object which resolves to the payment
             * gateway token OR rejects with an error message.
             * The property is also responsible for refreshing the payment gateway token when necessary
             *
             * @returns {Promise}
             */
            get useToken() {

                if (this.__tokenObject.time > Date.now()) {
                    // if present token has NOT expired, return it for use
                    return Promise.resolve(this.__tokenObject.tok);
                } else {
                    // present token has expired, so generate a new one using a Promise object
                    return new Promise(function (resolve, reject) {
                        var tokenReq = $.ajax( // request for new token
                        {
                            url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/merchant/verify",
                            type: "post",
                            contentType: "application/json",
                            dataType: "json",
                            timeout: 240000, // wait for 4 minutes before timeout of request
                            processData: false,
                            data: JSON.stringify(utopiasoftware.saveup.moneyWaveObject.key)
                        });
                        tokenReq.done(function (responseData) {
                            // the server responded to the request
                            if (responseData.status === "success") {
                                // token request was successful
                                // save the token and the time for the next token refresh
                                utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok = responseData.token;
                                utopiasoftware.saveup.moneyWaveObject.__tokenObject.time = 2 * 55 * 60 * 1000 + Date.now();
                                // resolve the promise with the retrieved token
                                resolve(utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok);
                            } else {
                                // token request was not successful
                                // reset token and the time for the next token refresh to the default
                                utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok = "";
                                utopiasoftware.saveup.moneyWaveObject.__tokenObject.time = 0;
                                // reject promise with an appropriate error message
                                reject("app error, cannot complete request");
                            }
                        });
                        tokenReq.fail(function () {
                            // the server response was NOT successful
                            // reset token and the time for the next token refresh to the default
                            utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok = "";
                            utopiasoftware.saveup.moneyWaveObject.__tokenObject.time = 0;
                            // reject promise with an appropriate error message
                            reject("app error, cannot complete request");
                        });
                    });
                }
            }
        },

        /**
         * object encapsulates the paystack payment gateway credentials
         */
        paystackObject: {

            /**
             * public property, holds the url for the gateway
             */
            gateway: "https://api.paystack.co/",

            /**
             * public object holds the keys for the gateway
             */
            key: { "secret": "sk_test_91815f725eeca4db7d43a08e46bd682d4d669a72" }
        },

        /**
         * object encapsulates some operations/manipulations that can be performed on
         * stored financial cards
         */
        financialCardOperations: {
            getCard: function getCard() {}
        }
    }
};

//# sourceMappingURL=base-compiled.js.map