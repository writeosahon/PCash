"use strict";
var utopiasoftware = { saveup: { validatePhoneNumber: function validatePhoneNumber(phoneNumber) {
      phoneNumber = "" + phoneNumber;var smsWatcherTimer = null;var rejectPromise = null;if (phoneNumber.startsWith("0")) {
        phoneNumber = phoneNumber.replace("0", "+234");
      }$("#phone-verification-modal .modal-message").html("Verifying Phone Number...");$("#phone-verification-modal").get(0).show();var phoneNumberVerifiedPromise = new Promise(function (resolve, reject) {
        rejectPromise = reject;var randomNumber = "";new Promise(function (resolve2, reject2) {
          SMS.startWatch(resolve2, reject2);
        }).then(function () {
          return new Promise(function (res, rej) {
            SMS.enableIntercept(true, res, rej);
          });
        }).then(function () {
          document.addEventListener("onSMSArrive", function (smsEvent) {
            var sms = smsEvent.data;if (sms.address == phoneNumber && sms.body == "PostCash " + randomNumber) {
              clearTimeout(smsWatcherTimer);SMS.stopWatch(function () {}, function () {});SMS.enableIntercept(false, function () {}, function () {});document.removeEventListener("onSMSArrive");$("#phone-verification-modal").get(0).hide();resolve();
            }
          });return new Promise(function (resolve3, reject3) {
            var randomGen = new Random(Random.engines.nativeMath);for (var i = 0; i < 6; i++) {
              randomNumber += "" + randomGen.integer(0, 9);
            }SMS.sendSMS(phoneNumber, "PostCash " + randomNumber, resolve3, function () {
              reject3("SMS sending failed. Please ensure you have sufficient airtime on the specified phone number");
            });
          });
        }).then(function () {
          smsWatcherTimer = setTimeout(function () {
            SMS.stopWatch(function () {}, function () {});SMS.enableIntercept(false, function () {}, function () {});document.removeEventListener("onSMSArrive");$("#phone-verification-modal").get(0).hide();rejectPromise("phone number verification failed");
          }, 31e3);
        }).catch(function (error) {
          try {
            clearTimeout(smsWatcherTimer);
          } catch (err) {}SMS.stopWatch(function () {}, function () {});SMS.enableIntercept(false, function () {}, function () {});document.removeEventListener("onSMSArrive");$("#phone-verification-modal").get(0).hide();if (error && typeof error == "string") {
            reject(error);
          }reject("phone number verification failed");
        });
      });return phoneNumberVerifiedPromise;
    }, sortBanksData: function sortBanksData() {
      return new Promise(function (resolve, reject) {
        Promise.resolve($.ajax({ url: "banks.json", type: "get", dataType: "json", timeout: 24e4 })).then(function (banksData) {
          var banksArray = [];for (var prop in banksData) {
            var bankOject = {};bankOject[prop] = banksData[prop];banksArray.push(bankOject);
          }return banksArray;
        }).then(function (banksArrayData) {
          return banksArrayData.sort(function (item1, item2) {
            var item1Val = "";var item2Val = "";for (var val1 in item1) {
              item1Val = item1[val1];
            }for (var val2 in item2) {
              item2Val = item2[val2];
            }if (item1Val.toLocaleUpperCase() < item2Val.toLocaleUpperCase()) {
              return -1;
            }if (item1Val.toLocaleUpperCase() > item2Val.toLocaleUpperCase()) {
              return 1;
            }return 0;
          });
        }).then(function (sortedBankArrayData) {
          resolve(sortedBankArrayData);
        }).catch();
      });
    }, filteredSenderBanksData: function filteredSenderBanksData() {
      return new Promise(function (resolve, reject) {
        Promise.resolve($.ajax({ url: "sender-banks.json", type: "get", dataType: "json", timeout: 24e4 })).then(function (banksData) {
          var banksArray = [];for (var prop in banksData) {
            var bankOject = {};bankOject[prop] = banksData[prop];banksArray.push(bankOject);
          }return banksArray;
        }).then(function (banksArrayData) {
          return banksArrayData.sort(function (item1, item2) {
            var item1Val = "";var item2Val = "";for (var val1 in item1) {
              item1Val = item1[val1];
            }for (var val2 in item2) {
              item2Val = item2[val2];
            }if (item1Val.toLocaleUpperCase() < item2Val.toLocaleUpperCase()) {
              return -1;
            }if (item1Val.toLocaleUpperCase() > item2Val.toLocaleUpperCase()) {
              return 1;
            }return 0;
          });
        }).then(function (sortedBankArrayData) {
          resolve(sortedBankArrayData);
        }).catch();
      });
    }, moneyWaveObject: { __tokenObject: { tok: "", time: 0 }, gateway: "https://live.moneywaveapi.co/", key: { apiKey: "lv_NOR9WTV79WQ7CWKAACCW", secret: "lv_WVTSFVRP02RMV4AMZXSQA3MCIRA74T" }, get useToken() {
        if (this.__tokenObject.time > Date.now()) {
          return Promise.resolve(this.__tokenObject.tok);
        } else {
          return new Promise(function (resolve, reject) {
            var tokenReq = $.ajax({ url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/merchant/verify", type: "post", contentType: "application/json", dataType: "json", timeout: 24e4, processData: false, data: JSON.stringify(utopiasoftware.saveup.moneyWaveObject.key) });tokenReq.done(function (responseData) {
              if (responseData.status === "success") {
                utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok = responseData.token;utopiasoftware.saveup.moneyWaveObject.__tokenObject.time = 2 * 55 * 60 * 1e3 + Date.now();resolve(utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok);
              } else {
                utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok = "";utopiasoftware.saveup.moneyWaveObject.__tokenObject.time = 0;reject("app error, cannot complete request");
              }
            });tokenReq.fail(function () {
              utopiasoftware.saveup.moneyWaveObject.__tokenObject.tok = "";utopiasoftware.saveup.moneyWaveObject.__tokenObject.time = 0;reject("app error, cannot complete request");
            });
          });
        }
      } }, paystackObject: { gateway: "https://api.paystack.co/", key: { secret: "sk_live_b4d08cde715473ea7b0cacb005f09e95bc1a87e8" } }, financialCardOperations: { loadCardData: function loadCardData() {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-cards" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              resolve([]);
            } else {
              throw errObject;
            }
          }).then(function (secureCardDataArray) {
            secureCardDataArray = JSON.parse(secureCardDataArray);resolve(secureCardDataArray);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getCard: function getCard(cardId) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-cards" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureCardDataArray) {
            secureCardDataArray = JSON.parse(secureCardDataArray);return secureCardDataArray.find(function (arrayElem) {
              if (arrayElem.cardUniqueId === cardId) {
                return true;
              }
            });
          }).then(function (cardObject) {
            if (!cardObject) {
              throw "error";
            } else {
              resolve(cardObject);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getCardByNumber: function getCardByNumber(cardNumber) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-cards" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureCardDataArray) {
            secureCardDataArray = JSON.parse(secureCardDataArray);return secureCardDataArray.find(function (arrayElem) {
              if (arrayElem.cardNumber === cardNumber) {
                return true;
              }
            });
          }).then(function (cardObject) {
            if (!cardObject) {
              resolve(null);
            } else {
              resolve(cardObject);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteCard: function deleteCard(cardId) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-cards" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureCardDataArray) {
            secureCardDataArray = JSON.parse(secureCardDataArray);var cardObjIndex = secureCardDataArray.findIndex(function (arrayElem) {
              if (arrayElem.cardUniqueId === cardId) {
                return true;
              }
            });if (cardObjIndex < 0) {
              throw "error";
            } else {
              secureCardDataArray.splice(cardObjIndex, 1);return intel.security.secureData.createFromData({ data: JSON.stringify(secureCardDataArray) });
            }
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-user-cards", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, addCard: function addCard(cardObject) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-cards" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              return "[]";
            } else {
              throw errObject;
            }
          }).then(function (secureCardDataArray) {
            secureCardDataArray = JSON.parse(secureCardDataArray);secureCardDataArray.unshift(cardObject);return intel.security.secureData.createFromData({ data: JSON.stringify(secureCardDataArray) });
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-user-cards", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteAllCards: function deleteAllCards() {
        return Promise.resolve(intel.security.secureStorage.delete({ id: "postcash-user-cards" }));
      } }, bankAccountOperations: { loadMyAccountsData: function loadMyAccountsData() {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              resolve([]);
            } else {
              throw errObject;
            }
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);resolve(secureBankAcctDataArray);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getMyAccount: function getMyAccount(bankAcctId) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);return secureBankAcctDataArray.find(function (arrayElem) {
              if (arrayElem.uniqueAccountId === bankAcctId) {
                return true;
              }
            });
          }).then(function (bankAcctObject) {
            if (!bankAcctObject) {
              throw "error";
            } else {
              resolve(bankAcctObject);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getMyAccountByNumber: function getMyAccountByNumber(bankAcctNumber) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);return secureBankAcctDataArray.find(function (arrayElem) {
              if (arrayElem.bankAccountNumber === bankAcctNumber) {
                return true;
              }
            });
          }).then(function (bankAcctObject) {
            if (!bankAcctObject) {
              resolve(null);
            } else {
              resolve(bankAcctObject);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteMyAccount: function deleteMyAccount(bankAcctId) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);var acctObjIndex = secureBankAcctDataArray.findIndex(function (arrayElem) {
              if (arrayElem.uniqueAccountId === bankAcctId) {
                return true;
              }
            });if (acctObjIndex < 0) {
              throw "error";
            } else {
              secureBankAcctDataArray.splice(acctObjIndex, 1);return intel.security.secureData.createFromData({ data: JSON.stringify(secureBankAcctDataArray) });
            }
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-user-bank-accounts", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, addMyAccount: function addMyAccount(bankAcctObject) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-user-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              return "[]";
            } else {
              throw errObject;
            }
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);secureBankAcctDataArray.unshift(bankAcctObject);return intel.security.secureData.createFromData({ data: JSON.stringify(secureBankAcctDataArray) });
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-user-bank-accounts", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteAllMyAccounts: function deleteAllMyAccounts() {
        return Promise.resolve(intel.security.secureStorage.delete({ id: "postcash-user-bank-accounts" }));
      } }, savedRecipientsBankAccountOperations: { loadSavedRecipientsAccountsData: function loadSavedRecipientsAccountsData() {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-saved-recipients-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              resolve([]);
            } else {
              throw errObject;
            }
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);resolve(secureBankAcctDataArray);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getSavedRecipientAccount: function getSavedRecipientAccount(bankAcctId) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-saved-recipients-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);return secureBankAcctDataArray.find(function (arrayElem) {
              if (arrayElem.uniqueAccountId === bankAcctId) {
                return true;
              }
            });
          }).then(function (bankAcctObject) {
            if (!bankAcctObject) {
              throw "error";
            } else {
              resolve(bankAcctObject);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getSavedRecipientAccountByNumber: function getSavedRecipientAccountByNumber(bankAcctNumber) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-saved-recipients-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);return secureBankAcctDataArray.find(function (arrayElem) {
              if (arrayElem.bankAccountNumber === bankAcctNumber) {
                return true;
              }
            });
          }).then(function (bankAcctObject) {
            if (!bankAcctObject) {
              resolve(null);
            } else {
              resolve(bankAcctObject);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteSavedRecipientAccount: function deleteSavedRecipientAccount(bankAcctId) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-saved-recipients-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);var acctObjIndex = secureBankAcctDataArray.findIndex(function (arrayElem) {
              if (arrayElem.uniqueAccountId === bankAcctId) {
                return true;
              }
            });if (acctObjIndex < 0) {
              throw "error";
            } else {
              secureBankAcctDataArray.splice(acctObjIndex, 1);return intel.security.secureData.createFromData({ data: JSON.stringify(secureBankAcctDataArray) });
            }
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-saved-recipients-bank-accounts", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, addSavedRecipientAccount: function addSavedRecipientAccount(bankAcctObject) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-saved-recipients-bank-accounts" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              return "[]";
            } else {
              throw errObject;
            }
          }).then(function (secureBankAcctDataArray) {
            secureBankAcctDataArray = JSON.parse(secureBankAcctDataArray);secureBankAcctDataArray.unshift(bankAcctObject);return intel.security.secureData.createFromData({ data: JSON.stringify(secureBankAcctDataArray) });
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-saved-recipients-bank-accounts", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteAllSavedRecipientAccounts: function deleteAllSavedRecipientAccounts() {
        return Promise.resolve(intel.security.secureStorage.delete({ id: "postcash-saved-recipients-bank-accounts" }));
      } }, transactionHistoryOperations: { addTransactionHistory: function addTransactionHistory(transactionDataObject) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-transaction-history-collection" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              return "[]";
            } else {
              throw errObject;
            }
          }).then(function (transactionDataArray) {
            transactionDataArray = JSON.parse(transactionDataArray);if (transactionDataArray.length == 25) {
              transactionDataArray.pop();
            }transactionDataArray.unshift(transactionDataObject);return intel.security.secureData.createFromData({ data: JSON.stringify(transactionDataArray) });
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-transaction-history-collection", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, updateTransactionHistory: function updateTransactionHistory(transactionRef, newStatus) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-transaction-history-collection" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              return "[]";
            } else {
              throw errObject;
            }
          }).then(function (transactionDataArray) {
            transactionDataArray = JSON.parse(transactionDataArray);var transactionDataIndex = transactionDataArray.findIndex(function (arrayElem) {
              if (arrayElem.flutterChargeReference == transactionRef) {
                return true;
              }
            });if (transactionDataIndex > -1) {
              transactionDataArray[transactionDataIndex].flutterChargeResponseMessage = newStatus;
            } else {
              throw { message: "Transaction not found." };
            }return intel.security.secureData.createFromData({ data: JSON.stringify(transactionDataArray) });
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-transaction-history-collection", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, updateTransactionHistoryData: function updateTransactionHistoryData(transactionRef, newData) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-transaction-history-collection" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              return "[]";
            } else {
              throw errObject;
            }
          }).then(function (transactionDataArray) {
            transactionDataArray = JSON.parse(transactionDataArray);var transactionDataIndex = transactionDataArray.findIndex(function (arrayElem) {
              if (arrayElem.flutterChargeReference == transactionRef) {
                return true;
              }
            });if (transactionDataIndex > -1) {
              Object.assign(transactionDataArray[transactionDataIndex], newData);
            } else {
              throw { message: "Transaction not found." };
            }return intel.security.secureData.createFromData({ data: JSON.stringify(transactionDataArray) });
          }).then(function (instanceId) {
            return intel.security.secureStorage.write({ id: "postcash-transaction-history-collection", instanceID: instanceId });
          }).then(function () {
            resolve();
          }).catch(function (err) {
            reject(err);
          });
        });
      }, loadTransactionHistoryData: function loadTransactionHistoryData() {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-transaction-history-collection" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }, function (errObject) {
            if (errObject.code == 1) {
              resolve([]);
            } else {
              throw errObject;
            }
          }).then(function (transactionHistoryDataArray) {
            transactionHistoryDataArray = JSON.parse(transactionHistoryDataArray);resolve(transactionHistoryDataArray);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, getTransactionHistoryById: function getTransactionHistoryById(transactionRef) {
        return new Promise(function (resolve, reject) {
          Promise.resolve(intel.security.secureStorage.read({ id: "postcash-transaction-history-collection" })).then(function (instanceId) {
            return Promise.resolve(intel.security.secureData.getData(instanceId));
          }).then(function (transactionDataArray) {
            transactionDataArray = JSON.parse(transactionDataArray);var transactionData = transactionDataArray.find(function (arrayElem) {
              if (arrayElem.flutterChargeReference == transactionRef) {
                return true;
              }
            });if (!transactionData) {
              resolve(null);
            } else {
              resolve(transactionData);
            }
          }).catch(function (err) {
            reject(err);
          });
        });
      }, deleteAllTransactionHistory: function deleteAllTransactionHistory() {
        return Promise.resolve(intel.security.secureStorage.delete({ id: "postcash-transaction-history-collection" }));
      } }, kinveyBaasOperations: { checkKinveyInitialised: function checkKinveyInitialised() {
        return new Promise(function (resolve, reject) {
          if (!Kinvey.User || !Kinvey.User.getActiveUser()) {
            reject({});
          } else {
            resolve({});
          }
        });
      }, initialiseKinvey: function initialiseKinvey() {
        return new Promise(function (resolve, reject) {
          Kinvey.initialize({ appKey: "kid_rkYhmmkw-", appSecret: "fa6ea817b69c41c1b0a833632f2bd9e5", appVersion: "1.0.0" }).then(function () {
            return new Promise(function (resolve1, reject1) {
              if (Kinvey.User.getActiveUser()) {
                resolve1(Kinvey.User.getActiveUser());
              } else {
                reject1({});
              }
            });
          }).then(function (activeUser) {
            return Promise.resolve(activeUser);
          }, function () {
            return Kinvey.User.login({ username: "_postcash", password: "password" });
          }).then(function (user) {
            resolve(user);
          }).catch(function (err) {
            reject(err);
          });
        });
      }, transferWalletCash: function transferWalletCash(transferData) {
        return Kinvey.CustomEndpoint.execute("wallet-transfer", transferData);
      } } } };

//# sourceMappingURL=base-compiled.min-compiled.js.map