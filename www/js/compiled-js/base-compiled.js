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
         * method is used to sort the collection of Nigerian Banks ALLOWED TO SEND MONEY THROUGH
         * BANK ACCOUNTS via MoneyWave.
         * Banks objects are sorted in ascending order of bank name.
         */
        filteredSenderBanksData: function filteredSenderBanksData() {
            // return the Promise object
            return new Promise(function (resolve, reject) {
                // retrieve the list of banks
                Promise.resolve($.ajax({
                    url: "sender-banks.json",
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

            /**
             * method is used to load the collection of user's financial cards ("My Cards") data from
             * the device secure storage
             * @return {Promise} method returns a Promise object that resolves with
             * the retrieved cards as an array OR rejects when the cards cannot be retrieved.
             *
             * NOTE: the Promise object resolve with an empty array when no cards are available
             */
            loadCardData: function loadCardData() {
                // return the Promise object
                return new Promise(function (resolve, reject) {
                    // read the user's cards data from secure storage
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-cards' })).then(function (instanceId) {
                        // read the content of the securely stored cards data
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure card storage has not been created before
                            resolve([]); // return an empty cards data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureCardDataArray) {
                        secureCardDataArray = JSON.parse(secureCardDataArray); // convert the string data to an object
                        resolve(secureCardDataArray);
                    }).catch(function (err) {
                        // reject the Promise
                        reject(err);
                    });
                });
            },

            /**
             * method is used to retrieve data details of a financial card
             * @param cardId {String} the unique of the financial card to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the financial card or rejects with an error
             */
            getCard: function getCard(cardId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored cards on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-cards' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureCardDataArray) {
                        secureCardDataArray = JSON.parse(secureCardDataArray); // convert the string data to an array object
                        return secureCardDataArray.find(function (arrayElem) {
                            // find the right financial card based on the card id
                            if (arrayElem.cardUniqueId === cardId) {
                                // this is the financial card that is required
                                return true;
                            }
                        });
                    }).then(function (cardObject) {
                        // get the financial card object
                        if (!cardObject) {
                            // no financial card was discovered
                            throw "error"; // throw an error
                        } else {
                            // a financial card was found
                            resolve(cardObject); // resolve the promise with the card object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no card was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to retrieve data details of a financial card BASED ON THE CARD NUMBER
             * @param cardNumber {String} the card number of the financial card to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the financial card, null if no data or rejects with an error
             */
            getCardByNumber: function getCardByNumber(cardNumber) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored cards on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-cards' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureCardDataArray) {
                        secureCardDataArray = JSON.parse(secureCardDataArray); // convert the string data to an array object
                        return secureCardDataArray.find(function (arrayElem) {
                            // find the right financial card based on the card number
                            if (arrayElem.cardNumber === cardNumber) {
                                // this is the financial card that is required
                                return true;
                            }
                        });
                    }).then(function (cardObject) {
                        // get the financial card object
                        if (!cardObject) {
                            // no financial card was discovered
                            resolve(null); // resolve the promise with null
                        } else {
                            // a financial card was found
                            resolve(cardObject); // resolve the promise with the card object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no card was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to delete data details of a financial card
             * @param cardId {String} the unique of the financial card to be deleted
               * @returns {Promise} returns a promise that resolves when the financial card deleted or rejects with an error
             */
            deleteCard: function deleteCard(cardId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored cards on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-cards' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureCardDataArray) {
                        secureCardDataArray = JSON.parse(secureCardDataArray); // convert the string data to an array object
                        var cardObjIndex = secureCardDataArray.findIndex(function (arrayElem) {
                            // find the right financial card index based on the card id
                            if (arrayElem.cardUniqueId === cardId) {
                                // this is the financial card that is required
                                return true;
                            }
                        });

                        if (cardObjIndex < 0) {
                            // no financial card with the provided id was discovered
                            throw "error"; // throw an error
                        } else {
                            // a financial card was found with the specified id
                            secureCardDataArray.splice(cardObjIndex, 1); // delete the item
                            // write the updated financial cards collection array back into secure storage
                            return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureCardDataArray) });
                        }
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-user-cards', 'instanceID': instanceId });
                    }).then(function () {
                        // financial cards array collection has been updated, so resolve the promise to delete the card data

                        resolve(); // resolve the Promise to delete the card data
                    }).catch(function (err) {
                        // an error occurred OR no card was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to add financial card data details to the collection of financial cards
             *
             * @param cardObject {Object} the financial card object to be added to the
             * collection of financial cards
               * @returns {Promise} returns a promise that resolves when the financial card has
             * been added/created or rejects with an error
             */
            addCard: function addCard(cardObject) {

                // return a Promise which resolves when financial card has been added successfully or rejects otherwise
                return new Promise(function (resolve, reject) {
                    // get the previous stored cards on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-cards' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure card storage has not been created before
                            return '[]'; // return an empty card data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureCardDataArray) {
                        secureCardDataArray = JSON.parse(secureCardDataArray); // convert the string data to an object
                        secureCardDataArray.unshift(cardObject); // add the card to the beginning of the array collection
                        // store the updated card collection securely on user's device
                        return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureCardDataArray) });
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-user-cards', 'instanceID': instanceId });
                    }).then(function () {
                        // card has been added
                        // resolve promise
                        resolve();
                    }).catch(function (err) {
                        // there was an error and card could NOT be added
                        reject(err); // reject promise
                    });
                });
            }

        },

        /**
         * object encapsulates some operations/manipulations  that can be performed on
         * stored bank accounts
         */
        bankAccountOperations: {

            /**
             * method is used to load the collection of user's stored bank accounts ("My accounts") data from
             * the device secure storage
             *
             * @return {Promise} method returns a Promise object that resolves with
             * the retrieved bank accounts as an array OR rejects when the bank accounts cannot be retrieved.
             *
             * NOTE: the Promise object resolve with an empty array when no accounts are available
             */
            loadMyAccountsData: function loadMyAccountsData() {
                // return the Promise object
                return new Promise(function (resolve, reject) {
                    // read the user's bank accounts ("My Accounts") data from secure storage
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-bank-accounts' })).then(function (instanceId) {
                        // read the content of the securely stored bank accounts data
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure bank accounts storage has not been created before
                            resolve([]); // return an empty my accounts data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an object
                        resolve(secureBankAcctDataArray);
                    }).catch(function (err) {
                        // reject the Promise
                        reject(err);
                    });
                });
            },

            /**
             * method is used to retrieve data details of a specific user's bank account
             * @param bankAcctId {String} the unique id of the specific bank account to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the specific user bank account or rejects with an error
             */
            getMyAccount: function getMyAccount(bankAcctId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored cards on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        return secureBankAcctDataArray.find(function (arrayElem) {
                            // find the right bank acct based on the acct id
                            if (arrayElem.uniqueAccountId === bankAcctId) {
                                // this is the bank acct that is required
                                return true;
                            }
                        });
                    }).then(function (bankAcctObject) {
                        // get the bank account object
                        if (!bankAcctObject) {
                            // no bank account was discovered
                            throw "error"; // throw an error
                        } else {
                            // a bank account was found
                            resolve(bankAcctObject); // resolve the promise with the account object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to retrieve data details of a specific user's bank account BASED ON THE ACCOUNT NUMBER
             * @param bankAcctNumber {String} the bank account number of the specific account to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the specific user bank account, null if no data or rejects with an error
             */
            getMyAccountByNumber: function getMyAccountByNumber(bankAcctNumber) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the user's accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        return secureBankAcctDataArray.find(function (arrayElem) {
                            // find the right user's account based on the account number
                            if (arrayElem.bankAccountNumber === bankAcctNumber) {
                                // this is the bank acct that is required
                                return true;
                            }
                        });
                    }).then(function (bankAcctObject) {
                        // get the bank account object
                        if (!bankAcctObject) {
                            // no bank account was discovered
                            resolve(null); // resolve the promise with null
                        } else {
                            // a bank account was found
                            resolve(bankAcctObject); // resolve the promise with the bank account object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no bank account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to delete data details of a user's bank account
             * @param bankAcctId {String} the unique id of the specific bank account to be deleted
               * @returns {Promise} returns a promise that resolves when the bank account is deleted or rejects with an error
             */
            deleteMyAccount: function deleteMyAccount(bankAcctId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        var acctObjIndex = secureBankAcctDataArray.findIndex(function (arrayElem) {
                            // find the right bank acct index based on the acct id
                            if (arrayElem.uniqueAccountId === bankAcctId) {
                                // this is the bank account that is required
                                return true;
                            }
                        });

                        if (acctObjIndex < 0) {
                            // no bank acct with the provided id was discovered
                            throw "error"; // throw an error
                        } else {
                            // a bank account was found with the specified id
                            secureBankAcctDataArray.splice(acctObjIndex, 1); // delete the item
                            // write the updated bank accounts collection array back into secure storage
                            return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureBankAcctDataArray) });
                        }
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-user-bank-accounts', 'instanceID': instanceId });
                    }).then(function () {
                        // bank accounts array collection has been updated, so resolve the promise to delete the acct data

                        resolve(); // resolve the Promise to delete the bank account data
                    }).catch(function (err) {
                        // an error occurred OR no bank account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to add bank account data details to the collection of user's bank account
             *
             * @param bankAcctObject {Object} the bank account object to be added to the
             * collection of user's bank accounts
               * @returns {Promise} returns a promise that resolves when the bank account has
             * been added/created or rejects with an error
             */
            addMyAccount: function addMyAccount(bankAcctObject) {

                // return a Promise which resolves when bank account has been added successfully or rejects otherwise
                return new Promise(function (resolve, reject) {
                    // get the previous bank accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-user-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure storage has not been created before
                            return '[]'; // return an empty data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an object
                        secureBankAcctDataArray.unshift(bankAcctObject); // add the bank acct to the beginning of the array collection
                        // store the updated account collection securely on user's device
                        return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureBankAcctDataArray) });
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-user-bank-accounts', 'instanceID': instanceId });
                    }).then(function () {
                        // account has been added
                        // resolve promise
                        resolve();
                    }).catch(function (err) {
                        // there was an error and account could NOT be added
                        reject(err); // reject promise
                    });
                });
            }
        },

        /**
         * object encapsulates some operations/manipulations  that can be performed on
         * stored saved recipients bank accounts
         */
        savedRecipientsBankAccountOperations: {

            /**
             * method is used to load the collection of saved recipients stored bank accounts ("Stored Recipients") data from
             * the device secure storage
             *
             * @return {Promise} method returns a Promise object that resolves with
             * the retrieved saved recipients bank accounts as an array OR
             * rejects when the saved recipients bank accounts cannot be retrieved.
             *
             * NOTE: the Promise object resolve with an empty array when no accounts are available
             */
            loadSavedRecipientsAccountsData: function loadSavedRecipientsAccountsData() {
                // return the Promise object
                return new Promise(function (resolve, reject) {
                    // read the saved recipients bank accounts ("Saved Recipients") data from secure storage
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        // read the content of the securely stored bank accounts data
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure bank accounts storage has not been created before
                            resolve([]); // return an empty my accounts data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an object
                        resolve(secureBankAcctDataArray);
                    }).catch(function (err) {
                        // reject the Promise
                        reject(err);
                    });
                });
            },

            /**
             * method is used to retrieve data details of a specific recipient's bank account
             * @param bankAcctId {String} the unique id of the specific bank account to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the specific user bank account or rejects with an error
             */
            getSavedRecipientAccount: function getSavedRecipientAccount(bankAcctId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored recipient accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        return secureBankAcctDataArray.find(function (arrayElem) {
                            // find the right bank acct based on the acct id
                            if (arrayElem.uniqueAccountId === bankAcctId) {
                                // this is the bank acct that is required
                                return true;
                            }
                        });
                    }).then(function (bankAcctObject) {
                        // get the bank account object
                        if (!bankAcctObject) {
                            // no bank account was discovered
                            throw "error"; // throw an error
                        } else {
                            // a bank account was found
                            resolve(bankAcctObject); // resolve the promise with the account object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to retrieve data details of a specific recipient's bank account BASED ON THE ACCOUNT NUMBER
             * @param bankAcctNumber {String} the bank account number of the saved recipient to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the specific user bank account, null if no data or rejects with an error
             */
            getSavedRecipientAccountByNumber: function getSavedRecipientAccountByNumber(bankAcctNumber) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the saved recipient account on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        return secureBankAcctDataArray.find(function (arrayElem) {
                            // find the right recipient account based on the account number
                            if (arrayElem.bankAccountNumber === bankAcctNumber) {
                                // this is the bank acct that is required
                                return true;
                            }
                        });
                    }).then(function (bankAcctObject) {
                        // get the bank account object
                        if (!bankAcctObject) {
                            // no bank account was discovered
                            resolve(null); // resolve the promise with null
                        } else {
                            // a bank account was found
                            resolve(bankAcctObject); // resolve the promise with the bank account object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no bank account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to delete data details of a recipient's bank account
             * @param bankAcctId {String} the unique id of the specific bank account to be deleted
               * @returns {Promise} returns a promise that resolves when the bank account is deleted or rejects with an error
             */
            deleteSavedRecipientAccount: function deleteSavedRecipientAccount(bankAcctId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        var acctObjIndex = secureBankAcctDataArray.findIndex(function (arrayElem) {
                            // find the right bank acct index based on the acct id
                            if (arrayElem.uniqueAccountId === bankAcctId) {
                                // this is the bank account that is required
                                return true;
                            }
                        });

                        if (acctObjIndex < 0) {
                            // no bank acct with the provided id was discovered
                            throw "error"; // throw an error
                        } else {
                            // a bank account was found with the specified id
                            secureBankAcctDataArray.splice(acctObjIndex, 1); // delete the item
                            // write the updated bank accounts collection array back into secure storage
                            return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureBankAcctDataArray) });
                        }
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-saved-recipients-bank-accounts',
                            'instanceID': instanceId });
                    }).then(function () {
                        // bank accounts array collection has been updated, so resolve the promise to delete the acct data

                        resolve(); // resolve the Promise to delete the bank account data
                    }).catch(function (err) {
                        // an error occurred OR no bank account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to add bank account data details to the collection of recipient's bank account
             *
             * @param bankAcctObject {Object} the bank account object to be added to the
             * collection of saved recipients bank accounts
               * @returns {Promise} returns a promise that resolves when the bank account has
             * been added/created or rejects with an error
             */
            addSavedRecipientAccount: function addSavedRecipientAccount(bankAcctObject) {

                // return a Promise which resolves when bank account has been added successfully or rejects otherwise
                return new Promise(function (resolve, reject) {
                    // get the previous recipient's bank accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure storage has not been created before
                            return '[]'; // return an empty data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an object
                        secureBankAcctDataArray.unshift(bankAcctObject); // add the bank acct to the beginning of the array collection
                        // store the updated account collection securely on user's device
                        return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureBankAcctDataArray) });
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-saved-recipients-bank-accounts',
                            'instanceID': instanceId });
                    }).then(function () {
                        // account has been added
                        // resolve promise
                        resolve();
                    }).catch(function (err) {
                        // there was an error and account could NOT be added
                        reject(err); // reject promise
                    });
                });
            }
        },

        /**
         * object encapsulates some operations/manipulations  that can be performed on
         * stored transactions history on the users devices
         */
        transactionHistoryOperations: {

            /**
             * method is used to load the collection of saved recipients stored bank accounts ("Stored Recipients") data from
             * the device secure storage
             *
             * @return {Promise} method returns a Promise object that resolves with
             * the retrieved saved recipients bank accounts as an array OR
             * rejects when the saved recipients bank accounts cannot be retrieved.
             *
             * NOTE: the Promise object resolve with an empty array when no accounts are available
             */
            loadSavedRecipientsAccountsData: function loadSavedRecipientsAccountsData() {
                // return the Promise object
                return new Promise(function (resolve, reject) {
                    // read the saved recipients bank accounts ("Saved Recipients") data from secure storage
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        // read the content of the securely stored bank accounts data
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure bank accounts storage has not been created before
                            resolve([]); // return an empty my accounts data array
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an object
                        resolve(secureBankAcctDataArray);
                    }).catch(function (err) {
                        // reject the Promise
                        reject(err);
                    });
                });
            },

            /**
             * method is used to retrieve data details of a specific recipient's bank account
             * @param bankAcctId {String} the unique id of the specific bank account to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the specific user bank account or rejects with an error
             */
            getSavedRecipientAccount: function getSavedRecipientAccount(bankAcctId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored recipient accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        return secureBankAcctDataArray.find(function (arrayElem) {
                            // find the right bank acct based on the acct id
                            if (arrayElem.uniqueAccountId === bankAcctId) {
                                // this is the bank acct that is required
                                return true;
                            }
                        });
                    }).then(function (bankAcctObject) {
                        // get the bank account object
                        if (!bankAcctObject) {
                            // no bank account was discovered
                            throw "error"; // throw an error
                        } else {
                            // a bank account was found
                            resolve(bankAcctObject); // resolve the promise with the account object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to retrieve data details of a specific recipient's bank account BASED ON THE ACCOUNT NUMBER
             * @param bankAcctNumber {String} the bank account number of the saved recipient to be retrieved
               * @returns {Promise} returns a promise that resolves to the
             * data details of the specific user bank account, null if no data or rejects with an error
             */
            getSavedRecipientAccountByNumber: function getSavedRecipientAccountByNumber(bankAcctNumber) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the saved recipient account on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        return secureBankAcctDataArray.find(function (arrayElem) {
                            // find the right recipient account based on the account number
                            if (arrayElem.bankAccountNumber === bankAcctNumber) {
                                // this is the bank acct that is required
                                return true;
                            }
                        });
                    }).then(function (bankAcctObject) {
                        // get the bank account object
                        if (!bankAcctObject) {
                            // no bank account was discovered
                            resolve(null); // resolve the promise with null
                        } else {
                            // a bank account was found
                            resolve(bankAcctObject); // resolve the promise with the bank account object
                        }
                    }).catch(function (err) {
                        // an error occurred OR no bank account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to delete data details of a recipient's bank account
             * @param bankAcctId {String} the unique id of the specific bank account to be deleted
               * @returns {Promise} returns a promise that resolves when the bank account is deleted or rejects with an error
             */
            deleteSavedRecipientAccount: function deleteSavedRecipientAccount(bankAcctId) {

                // return a Promise object for the method
                return new Promise(function (resolve, reject) {
                    // get all the stored accounts on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-saved-recipients-bank-accounts' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }).then(function (secureBankAcctDataArray) {
                        secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray); // convert the string data to an array object
                        var acctObjIndex = secureBankAcctDataArray.findIndex(function (arrayElem) {
                            // find the right bank acct index based on the acct id
                            if (arrayElem.uniqueAccountId === bankAcctId) {
                                // this is the bank account that is required
                                return true;
                            }
                        });

                        if (acctObjIndex < 0) {
                            // no bank acct with the provided id was discovered
                            throw "error"; // throw an error
                        } else {
                            // a bank account was found with the specified id
                            secureBankAcctDataArray.splice(acctObjIndex, 1); // delete the item
                            // write the updated bank accounts collection array back into secure storage
                            return intel.security.secureData.createFromData({ 'data': JSON.stringify(secureBankAcctDataArray) });
                        }
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-saved-recipients-bank-accounts',
                            'instanceID': instanceId });
                    }).then(function () {
                        // bank accounts array collection has been updated, so resolve the promise to delete the acct data

                        resolve(); // resolve the Promise to delete the bank account data
                    }).catch(function (err) {
                        // an error occurred OR no bank account was found
                        reject(err); // reject the promise with an error
                    });
                });
            },

            /**
             * method is used to add financial transaction history data details to the collection
             * of transaction history on the device.
             * Transaction history collection stores a limit of 20 transactions data.
             * If the limit is attained, the least recent transaction is removed from
             * the collection first before the latest transaction is added
             *
             * @param transactionDataObject {Object} the bank account object to be added to the
             * collection of saved recipients bank accounts
               * @returns {Promise} returns a promise that resolves when the transaction history data
             * has been added/created or rejects with an error
             */
            addTransactionHistory: function addTransactionHistory(transactionDataObject) {

                // return a Promise which resolves when transaction history data has been added successfully or rejects otherwise
                return new Promise(function (resolve, reject) {
                    // get the transaction history data collection on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-transaction-history-collection' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure storage has not been created before
                            return '[]'; // return the empty array as string
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (transactionDataArray) {
                        transactionDataArray = JSON.parse(transactionDataArray); // convert the string data to an object
                        // check if the transaction array has reached the limit of 20 items
                        if (transactionDataArray.length == 20) {
                            // array has reached its limit
                            // remove the least recent transaction item
                            transactionDataArray.pop();
                        }

                        transactionDataArray.unshift(transactionDataObject); // add the new transaction data object to the beginning of the array collection
                        // store the updated transaction history collection securely on user's device
                        return intel.security.secureData.createFromData({ 'data': JSON.stringify(transactionDataArray) });
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-transaction-history-collection',
                            'instanceID': instanceId });
                    }).then(function () {
                        // new transaction object has been added
                        // resolve promise
                        resolve();
                    }).catch(function (err) {
                        // there was an error and account could NOT be added
                        reject(err); // reject promise
                    });
                });
            },

            /**
             * method is used update the status of a stored transaction history on
             * the user's device
             *
             * @param transactionRef {String} the unique moneywave reference for the transaction
             *
             * @param newStatus {String} the new status for the transaction
             */
            updateTransactionHistory: function updateTransactionHistory(transactionRef, newStatus) {

                // return a Promise which resolves when transaction history data status has been updated successfully or rejects otherwise
                return new Promise(function (resolve, reject) {
                    // get the transaction history data collection on the user's device
                    Promise.resolve(intel.security.secureStorage.read({ 'id': 'postcash-transaction-history-collection' })).then(function (instanceId) {
                        return Promise.resolve(intel.security.secureData.getData(instanceId));
                    }, function (errObject) {
                        if (errObject.code == 1) {
                            // the secure storage has not been created before
                            return '[]'; // return the empty array as string
                        } else {
                            // another error occurred (which is considered severe)
                            throw errObject;
                        }
                    }).then(function (transactionDataArray) {
                        transactionDataArray = JSON.parse(transactionDataArray); // convert the string data to an object
                        // find the specified transaction using the provided movewave reference
                        var transactionDataIndex = transactionDataArray.findIndex(function (arrayElem) {
                            if (arrayElem.flutterChargeReference == transactionRef) {
                                return true;
                            }
                        });

                        // if element was found, update the transaction status with the newStatus provided
                        if (transactionDataIndex > -1) {
                            // transaction data object was found
                            // update the transaction status
                            transactionDataArray[transactionDataIndex].flutterChargeResponseMessage = newStatus;
                        }

                        // store the updated transaction history collection securely on user's device
                        return intel.security.secureData.createFromData({ 'data': JSON.stringify(transactionDataArray) });
                    }).then(function (instanceId) {
                        return intel.security.secureStorage.write({ 'id': 'postcash-transaction-history-collection',
                            'instanceID': instanceId });
                    }).then(function () {
                        // new transaction object has been added
                        // resolve promise
                        resolve();
                    }).catch(function (err) {
                        // there was an error and account could NOT be added
                        reject(err); // reject promise
                    });
                });
            }
        },

        kinveyBaasOperations: {

            /**
             * method checks if the kinvey Baas library has been initialised
             *
             * @return {Promise} a Promise that resolves if the Kinvey Baas library has been initialised
             * and  rejects otherwise
             */
            checkKinveyInitialised: function checkKinveyInitialised() {
                if (!Kinvey.User || !Kinvey.User.getActiveUser()) {
                    // user has not been created, so kinvey has not been initialised
                    return Promise.reject({}); // return a rejected promise
                } else {
                    // user has been created, so kinvey has been initialised
                    return Promise.resolve({}); // return a resolved promise
                }
            },

            /**
             * function is used to initialise the kinvey Baas library
             *
             * @returns {Promise} a Promise that resolves if library is initialised or
             * rejects otherwise
             */
            initialiseKinvey: function initialiseKinvey() {

                // returns a Promise that resolves if library is initialised or rejects otherwise
                return new Promise(function (resolve, reject) {
                    Kinvey.initialize({
                        appKey: 'kid_ByQb8Q0S-',
                        appSecret: '01d0e48b25124e71b1d21a57962b0d9f',
                        appVersion: '1.0.0'
                    }).then(function () {
                        // login as the default user for the app to use
                        return Kinvey.User.login({
                            username: '_postcash',
                            password: 'password'
                        }); // return the default user
                    }).then(function () {
                        resolve({}); // resolve the promise
                    }).catch(function (err) {
                        reject(err); // reject the promise
                    });
                });
            },

            /**
             * method is used to send a cash transfer (via bank) request to a recipient.
             * the request is routed through the buinesss logic (serverless) container
             *
             * @param transferData {Object} the parameters to be sent to the business logic container
             *
             * @returns {Promise} a promise that resolves when the the execution of the business logic
             * is completed successfully; OR rejects whn the execution of the business logic fails
             */
            transferCashByBank: function transferCashByBank(transferData) {

                // call the Kinvey business logic to execute the bank transfer
                return Kinvey.CustomEndpoint.execute('bank-transfer', transferData);
            }

        }

    }
};

//# sourceMappingURL=base-compiled.js.map