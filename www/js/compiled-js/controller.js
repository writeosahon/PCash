/**
 * Created by UTOPIA SOFTWARE on 20/03/2017.
 */

/**
 * file defines all View-Models, Controllers and Event Listeners used by the app
 *
 * The 'utopiasoftware.saveup' namespace has being defined in the base js file.
 * The author uses the terms 'method' and function interchangeably; likewise the terms 'attribute' and 'property' are
 * also used interchangeably
 */


// define the controller namespace
utopiasoftware.saveup.controller = {

    /**
     * method is used to handle the special event created by the intel xdk developer library. The special event (app.Ready)
     * is triggered when ALL the hybrid app plugins have been loaded/readied and also the document DOM content is ready
     */
    appReady: () => {

        // initialise the onsen library
        ons.ready(function () {
            // set the default handler for the app
            ons.setDefaultDeviceBackButtonListener(function(){
                console.log("DEFAULT BACK BUTTON LISTENER");

            });


            // listen for "HOLD" events that are triggered in the app
            document.addEventListener('hold', function(event) {

                // check if the backspace button in the 'security-pin-lock-modal' is held
                if ($(event.target).closest('#security-pin-lock-backspace', '#security-pin-lock-modal').
                    is('#security-pin-lock-backspace')) { //backspace button has been held
                    // remove the entire contents of the input field
                    $('#security-pin-lock-modal #security-pin-lock-pin').val("");
                    return; // exit
                }


            });

            if(utopiasoftware.saveup.model.isAppReady === false){ // if app has not completed loading
                // displaying prepping message
                $('#loader-modal-message').html("Preparing App...");
                $('#loader-modal').get(0).show(); // show loader
            }

            // check if the user is currently logged in
            if(window.localStorage.getItem("app-status") && window.localStorage.getItem("app-status") != ""){ // user is logged in
                //set the first page to be displayed to be the login page
                $('ons-splitter').get(0).content.load("login-template");
            }
            else{ // user has NOT been logged in
                // set the first page to be displayed to be the onboarding page
                $('ons-splitter').get(0).content.load("onboarding-template");
            }


            // initialise verify-account bottom sheet plugin
            $('#verify-account-bottom-sheet').modal({
                ready: function(){ // callback for when bottom sheet is opened
                    // flag a state that indicates the bottom sheet is currently open
                    $('#verify-account-bottom-sheet').data("saveupSheetState", "open");
                },
                complete: function(){ // callback for when bottom sheet is closed
                    // flag a state that indicates the bottom sheet is currently closed
                    $('#verify-account-bottom-sheet').data("saveupSheetState", "closed");
                }
            });

            // add back button listener for the SECURE PIN LOCK MODAL
            $('#security-pin-lock-modal').get(0).onDeviceBackButton =
                utopiasoftware.saveup.controller.securityPinLockModalViewModel.exitButtonClicked;

            // add back button listener for the transfer-cash-card-authorise MODAL
            $('#transfer-cash-card-authorise-modal').get(0).onDeviceBackButton = function(){
                // hide the transfer-cash-card-authorise-modal
                $('#transfer-cash-card-authorise-modal').get(0).hide();
                // change the src for transfer-cash-card-authorise-iframe to reset
                $('#transfer-cash-card-authorise-iframe').attr("src", "");
            };

            // add back button listener for the transfer-cash-bank-authorise MODAL
            $('#transfer-cash-bank-authorise-modal').get(0).onDeviceBackButton = function(){
                // hide the transfer-cash-bank-authorise-modal
                $('#transfer-cash-bank-authorise-modal').get(0).hide();
                // change the src for transfer-cash-bank-authorise-iframe to reset
                $('#transfer-cash-bank-authorise-iframe').attr("src", "");
            };

        });

        /** ADD CUSTOM VALIDATORS FOR PARSLEY HERE **/
        Parsley.addAsyncValidator("financialcardcheck",
            utopiasoftware.saveup.controller.addCardPageViewModel.financialCardValidator,
            utopiasoftware.saveup.paystackObject.gateway + 'decision/bin/{value}');

        Parsley.addAsyncValidator("accountnumbercheck",
            utopiasoftware.saveup.controller.addAccountPageViewModel.accountNumberValidator,
            utopiasoftware.saveup.moneyWaveObject.gateway + 'v1/resolve/account');

        Parsley.addAsyncValidator("recipientaccountnumbercheck",
            utopiasoftware.saveup.controller.addRecipientPageViewModel.recipientAccountNumberValidator,
            utopiasoftware.saveup.moneyWaveObject.gateway + 'v1/resolve/account');

        /** CUSTOM VALIDATORS FOR PARSLEY ENDS **/

        // add listener for when the Internet network connection is offline
        document.addEventListener("offline", function(){

            // display a toast message to let user no there is no Internet connection
            window.plugins.toast.showWithOptions({
                message: "No Internet Connection. App functionality may be limited",
                duration: 4000, // 4000 ms
                position: "bottom",
                styling: {
                    opacity: 1,
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    textSize: 14
                }
            });

        }, false);

        // add a listener for when the user pauses the device i.e when the app is taken from the foreground to background
        document.addEventListener("pause", utopiasoftware.saveup.controller.onShowSecurityLockModal = function(){ // function handles the display of the security-pin-lock-modal

            if($('#login-tabbar').get(0) && $('#login-tabbar').get(0).visible){ // if the login-tab is visible
                // don't display security-pin-lock-modal
                return; // exit the function immediately
            }

            // check if the onboarding-navigator is active and if the top page has asked for security lock modal NOT to be displayed
            if($('#onboarding-navigator').get(0) &&
                $('#onboarding-navigator').get(0).topPage.alwaysShowSecurityLockModal == false){ // user does NOT want security lock modal
                // don't display security-pin-lock-modal
                return; // exit the function immediately
            }

            // check if the app-main-navigator is active and if the top page has asked for security lock modal NOT to be displayed
            if($('#app-main-navigator').get(0) &&
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal == false){ // user does NOT want security lock modal
                // don't display security-pin-lock-modal
                return; // exit the function immediately
            }

            // check if the security lock modal can be display
            if(! utopiasoftware.saveup.model.appUserDetails.settings ||
                utopiasoftware.saveup.model.appUserDetails.settings.alwaysShowSecurityLockModal !== false){ // security modal can be displayed

                // reset the message being displayed in the security-pin-lock-modal
                $('#security-pin-lock-modal #security-pin-lock-message').html("");

                if($('#pin-security-check').get(0) && $('#pin-security-check').get(0).visible){ // check if the pin-security-check dialog is visible
                    $('#pin-security-check').remove(); // hide the pin-security-check dialog
                }

                cordova.plugins.Keyboard.close(); // hide the keyboard, if it is visible
                $('#security-pin-lock-modal').get(0).show(); // show the security-pin-lock-modal
            }

        }, false);

        // add listener for when a message is posted to the app by an iframe during cash transfers
        window.addEventListener("message", function(event){
            try{

            // check that event is from the expected origin & carrying the proper message
            if(event.origin == "https://postcash.000webhostapp.com" && event.data == "c done"){
                // call the method to handle the event i.e transfer-cash-card authorisation
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.transferCashCardOtpAuthorize();
                return; // exit method
            }

            if(event.origin == "https://postcash.000webhostapp.com" && event.data == "b loaded"){

                // call the method to handle the event i.e transfer-cash-bank remote authorisation stage 1
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.transferCashBankRemoteAuthorize("stage 1");
                return; // exit method
            }
            if(event.origin == "https://postcash.000webhostapp.com" && JSON.parse(event.data) &&
                JSON.parse(event.data).state == "b completed"){
                // call the method to handle the event i.e transfer-cash-bank remote authorisation stage 2
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.
                transferCashBankRemoteAuthorize("stage 2", JSON.parse(event.data));
                return; // exit method
            }
          }
          catch(err){
              ///
          }
        }, false);

        try {
            // lock the orientation of the device to 'PORTRAIT'
            screen.lockOrientation('portrait');
        }
        catch(err){}

        // set status bar color
        StatusBar.backgroundColorByHexString("#000000");

        // prepare the inapp browser plugin
        window.open = cordova.InAppBrowser.open;

        // use Promises to load the other cordova plugins
        new Promise(function(resolve, reject){
            // Get device UUID
            window.plugins.uniqueDeviceID.get(resolve, reject);
        }).
        then(function(deviceUUID){
            utopiasoftware.saveup.model.deviceUUID = deviceUUID;
            return;
        }).
        then(function(){ // load the securely stored / encrypted data into the app
            // check if the user is currently logged in
            if(! window.localStorage.getItem("app-status") || window.localStorage.getItem("app-status") == ""){ // user is not logged in
                return null;
            }

            return Promise.resolve(intel.security.secureStorage.read({"id": "postcash-user-details"}));
        }).then(function(instanceId){
            if(instanceId == null){ // user is not logged in
                return null;
            }

            return Promise.resolve(intel.security.secureData.getData(instanceId));
        }).
        then(function(secureData){

            if(secureData == null){ // user is not logged in
                return null;
            }

            utopiasoftware.saveup.model.appUserDetails = JSON.parse(secureData); // transfer the collected user details to the app
            // update the first name being displayed in the side menu
            $('#side-menu-username').html(utopiasoftware.saveup.model.appUserDetails.firstName);
            return null;
        }).
        then(function(){ // setup the hockey plugin which is used to send transaction feedback
            return new Promise(function(resolve, reject){
                hockeyapp.start(resolve, reject, "fcb296e2bce24c5a8e9eedcf079f9b47");
            });
        }).
        then(function(){
            // notify the app that the app has been successfully initialised and is ready for further execution (set app ready flag to true)
            utopiasoftware.saveup.model.isAppReady = true;
            // hide the splash screen
            navigator.splashscreen.hide();
        }).
        catch(function(){
            // provide an empty device uuid
            utopiasoftware.saveup.model.deviceUUID = "";
            // notify the app that the app has been successfully initialised and is ready for further execution (set app ready flag to true)
            utopiasoftware.saveup.model.isAppReady = true;
            // hide the splash screen
            navigator.splashscreen.hide();

            // display a toast message to let user no there is no Internet connection
            window.plugins.toast.showWithOptions({
                message: "Startup Error. App functionality may be limited. Always update the app to " +
                "get the best secure experience. Please contact us if problem continues",
                duration: 5000, // 5000 ms
                position: "bottom",
                styling: {
                    opacity: 1,
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    textSize: 14
                }
            });
        });

    },

    /**
     * method is used to create secondary menus for some app pages.
     * The secondary menus are onsen ui popover elements
     *
     * @param popOverQuerySelector {String} a query selector string that identifies the onsen ui popover element
     *
     * @param targetElem {HTMLElement} HTML element that identifies the
     * target element of the app secondary menu
     */
    createAppSecondaryMenus: function(popOverQuerySelector, targetElem){

        // show the specified popover element
        $(popOverQuerySelector).get(0).show(targetElem);
    },


    /**
     * method is triggered just before pin-security-check prompt dialog is shown
     */
    pinSecurityCheckPreShow: function(){
        // find all input elements and ensure they are not mistakingly styled by materialize.css
        $('#pin-security-check').find('input').addClass("utopiasoftware-no-style");
    },

    /**
     * method is triggered when an item on the App Secondary Popup Menu is clicked
     *
     * @param label {String} label represents clicked list item in the menu
     */
    appSecondaryMenuListClicked: function(label){

        if(label == "sign out"){ // user clicked the sign out list item

            // clear any session storage that may be held in the device
            window.sessionStorage.clear();

            // hide the app secondary popup menu
            $('#secondary-menu-options').get(0).hide().
            then(function(){
                // go back to the log in page
                $('ons-splitter').get(0).content.load("login-template");
            }).
            catch();

            return;
        }

        if(label == "share app"){ // user clicked on the share app list item

            //store the alwaysShowSecurityLockModal status/flag for the current page at the top of the page navigation stack
            var security_lock_modal_flag = $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal;

            // create the share options
            var shareOptions = {
                message: "download PostCash app. A secure digital wallet for easy money transfer in Nigeria",
                files: null,
                subject: "download PostCash app",
                chooserTitle: "share PostCash with...",
                url: "https://jh8tj.app.goo.gl/rniX"
            };

            // hide the app secondary popup menu
            $('#secondary-menu-options').get(0).hide().
            then(function(){
                // set the status of alwaysShowSecurityLock modal to NOT display
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = false;

                // copy the share option message to the device clipboard
                return new Promise(function(resolve, reject){
                    // inform the user that the share link has also been copied to device clipboard
                    window.plugins.toast.showWithOptions({
                        message: "share link was also copied to device memory, so you can paste easily!",
                        duration: 5000,
                        position: "top",
                        styling: {
                            opacity: 1,
                            backgroundColor: '#808080',
                            textColor: '#FFFFFF',
                            textSize: 14
                        }
                    }, function(toastEvent){
                        if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                            window.plugins.toast.hide();
                        }
                    });
                    window.setTimeout(
                        function(){
                            cordova.plugins.clipboard.copy(shareOptions.message + "\n" + shareOptions.url, resolve, resolve);
                        }, 3800);
                });
            }).
            then(function(){
                return new Promise(function(resolve, reject){
                    // popup the share actionsheet widget
                    window.plugins.socialsharing.shareWithOptions(shareOptions, resolve, reject);
                });
            }).
            then(function(){
                 // revert the alwaysShowSecurityLockModal status/flag for the current page to its original state
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = security_lock_modal_flag;

                // call method that determines if it should show the security lock modal based on just updated status
                utopiasoftware.saveup.controller.onShowSecurityLockModal();
            }).
            catch(function(){
                // inform the user that share link could not be created
                window.plugins.toast.showWithOptions({
                    message: "app share link could not be created. Try again",
                    duration: 4000,
                    position: "top",
                    styling: {
                        opacity: 1,
                        backgroundColor: '#ff0000', //red
                        textColor: '#FFFFFF',
                        textSize: 14
                    }
                }, function(toastEvent){
                    if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                        window.plugins.toast.hide();
                    }
                });
            });

            return;
        }
    },


    /**
     * object is the view-model for the app side menu
     */
    sideMenuViewModel : {

        /**
         * method is used to listen for when the list
         * items in the side menu is clicked
         *
         * @param label {String} label represents clicked list item in the side-menu
         */
        sideMenuListClicked: function(label) {

            if(label == "transfer cash"){ // 'transfer cash' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    // ask user for secure PIN before proceeding. secure pin MUST match
                    return ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                        messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                        'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                        'Please enter your PostCash Secure PIN to proceed</span></div>',
                        cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                        submitOnEnter: true
                    });
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#transfer-cash-page').remove(); // remove previous transfer cash pages
                        $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {}); // navigate to the specified page
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "verify account"){ // 'verify account' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    $('#app-main-navigator').get(0).bringPageTop("verify-account-page.html", {}); // navigate to the verify account page
                }).catch(function(){});

                return;
            }

            if(label == "my cards"){ // 'my cards' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    // ask user for secure PIN before proceeding. secure pin MUST match
                    return ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                        messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                        'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                        'Please enter your PostCash Secure PIN to proceed</span></div>',
                        cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                        submitOnEnter: true
                    });
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).bringPageTop("my-cards-page.html", {}); // navigate to the specified page
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "my accounts"){ // 'my accounts' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    // ask user for secure PIN before proceeding. secure pin MUST match
                    return ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                        messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                        'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                        'Please enter your PostCash Secure PIN to proceed</span></div>',
                        cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                        submitOnEnter: true
                    });
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).bringPageTop("my-accounts-page.html", {}); // navigate to the specified page
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "saved recipients"){ // 'saved recipients' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    // ask user for secure PIN before proceeding. secure pin MUST match
                    return ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                        messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                        'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                        'Please enter your PostCash Secure PIN to proceed</span></div>',
                        cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                        submitOnEnter: true
                    });
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).bringPageTop("saved-recipients-page.html", {}); // navigate to the specified page
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "intro"){ // 'intro' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    $('#app-main-navigator').get(0).bringPageTop("onboarding-page.html", {}); // navigate to the onboarding page
                }).catch(function(){});

                return;
            }

            if(label == "transaction history"){ // 'transaction history' button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    // ask user for secure PIN before proceeding. secure pin MUST match
                    return ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                        messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                        'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                        'Please enter your PostCash Secure PIN to proceed</span></div>',
                        cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                        submitOnEnter: true
                    });
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).bringPageTop("transaction-history-page.html", {}); // navigate to the specified page
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "settings"){ // settings button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    $('#app-main-navigator').get(0).bringPageTop("settings-page.html", {}); // navigate to the settings page
                }).
                catch();

                return;
            }

            if(label == "contact us"){ // contact us button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    ons.notification.alert({title: '<ons-icon icon="md-brush" size="32px" rotate="270" ' +
                    'style="color: green;"></ons-icon><span style="color: green;">PostCash Beta</span>',
                        messageHTML: '<span style="font-weight: bold">Thank you for using PostCash.<br> ' +
                        "PostCash is currently in beta and this feature isn't available yet. Expect an update soon!</span>",
                        cancelable: false
                    });
                }).
                catch();

                return;
            }

            if(label == "app info"){ // app info button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    ons.notification.alert({title: '<ons-icon icon="md-brush" size="32px" rotate="270" ' +
                    'style="color: green;"></ons-icon><span style="color: green;">PostCash Beta</span>',
                        messageHTML: '<span style="font-weight: bold">Thank you for using PostCash.<br> ' +
                        "PostCash is currently in beta and this feature isn't available yet. Expect an update soon!</span>",
                        cancelable: false
                    });
                }).
                catch();

                return;
            }

        }
    },


    /**
     * object is the view-model for the app security-pin-lock-modal
     */
    securityPinLockModalViewModel: {

        /**
         * property holds the input field jquery object used in the
         * security pin lock modal
         */
        $pinLockInputField: null,


        /**
         * holds the unique id assigned to every timer which is used to
         * change the input field entry from 'visible' to 'hidden'
         */
        clearTimeoutId: -1,


        /**
         * method is triggered when a number key on the app security pin lock is tapped
         *
         * @param numberInput {String} number input
         */
        numberButtonClicked: function(numberInput){
            // check if the input field jquery object is null. if so, initialise it
            if(!utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField){
                // initialise the input property
                utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField =
                    $('#security-pin-lock-modal #security-pin-lock-pin');
            }

            // clear the message that may be displayed in the modal
            $('#security-pin-lock-modal #security-pin-lock-message').html("");
            // update the security input field with the provided number input
            utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField.
            val(utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField.val() + numberInput);
            // update the input field css text input style, so user can see the inputed number
            utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField.
            css('-webkit-text-security', 'none');

            // clear any previous timeout that may have been set
            window.clearTimeout(utopiasoftware.saveup.controller.securityPinLockModalViewModel.clearTimeoutId);

            utopiasoftware.saveup.controller.securityPinLockModalViewModel.clearTimeoutId =
            setTimeout(function(){ // wait for 1 second
                    // update the input field css text input style, so user cannot see the inputed number
                    utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField.
                    css('-webkit-text-security', 'disc');
            }, 1000);
        },

        /**
         * method is triggered when the exit button on the app security pin is clicked
         */
        exitButtonClicked: function(){

            ons.notification.confirm('Do you want to close the app?', {title: 'Exit',
                    buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                .then(function(index) {
                    if (index === 1) { // OK button
                        navigator.app.exitApp(); // Close the app
                    }
                });
        },

        /**
         * method is triggered when the "ok" button on the
         * app security pin is clicked
         */
        okButtonClicked: function(){

            // check if the input field jquery object is null. if so, initialise it
            if(!utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField){
                // initialise the input property
                utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField =
                    $('#security-pin-lock-modal #security-pin-lock-pin');
            }

            if(utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField.val() ===
                utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful

                $('#security-pin-lock-modal').get(0).hide(); // hide the security pin modal
            }
            else{ // authentication failed
                $('#security-pin-lock-modal #security-pin-lock-message').html("WRONG INPUT!");
            }

            // reset the input value of the security pin modal
            utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField.val("");
        },


        /**
         * method is triggered when the backspace button on the
         * app security pin is clicked
         */
        backspaceButtonClicked: function(){

            // check if the input field jquery object is null. if so, initialise it
            if(!utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField){
                // initialise the input property
                utopiasoftware.saveup.controller.securityPinLockModalViewModel.$pinLockInputField =
                    $('#security-pin-lock-modal #security-pin-lock-pin');
            }

            var inputString = $('#security-pin-lock-modal #security-pin-lock-pin').val(); // get the value from the input
            // remove the last character from the input field
            $('#security-pin-lock-modal #security-pin-lock-pin').val(inputString.substring(0, inputString.length - 1));
        },

        /**
         * method is used to prevent the device from displaying the content menu for
         * devices
         * @param event
         * @returns {boolean}
         */
        preventContextMenuForInput: function(event){
            event.preventDefault();
            event.stopPropagation();
            return false;
        }
    },

    /**
     * object is view-model for sign-in page
     */
    signInPageViewModel: {

        /**
         * used to hold the parsley form validation object for the sign-in page
         */
        formValidator: null,

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable");

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $thisPage.get(0).onDeviceBackButton = function(){
                    ons.notification.confirm('Do you want to close the app?', {title: 'Exit',
                            buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                        .then(function(index) {
                            if (index === 1) { // OK button
                                navigator.app.exitApp(); // Close the app
                            }
                        });
                };

                // check if the user is currently logged in
                if(window.localStorage.getItem("app-status") && window.localStorage.getItem("app-status") != ""){ // user is logged in
                    // display the user's save phone number on the login page phonenumber input
                    $('#login-form #user-phone').val(utopiasoftware.saveup.model.appUserDetails.phoneNumber);
                }

                // initialise the sign-in form validation
                utopiasoftware.saveup.controller.signInPageViewModel.formValidator = $('#login-form').parsley();

                // attach listener for the sign in button on the sign-in page
                $('#login-signin').get(0).onclick = function(){
                    // run the validation method for the sign-in form
                    utopiasoftware.saveup.controller.signInPageViewModel.formValidator.whenValidate();
                };

                // listen for log in form field validation failure event
                utopiasoftware.saveup.controller.signInPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for log in form field validation success event
                utopiasoftware.saveup.controller.signInPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).removeAttr("data-hint");
                });

                // listen for log in form validation success
                utopiasoftware.saveup.controller.signInPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.signInPageViewModel.signinFormValidated);

                // hide the loader
                $('#loader-modal').get(0).hide();

                // now that the page is being shown without the loader, start the animation of the icons
                $('ons-icon.first,ons-icon.second', $thisPage).addClass('animated swing');
                // wait for 4 seconds, then stop the pulse animation of the Create Account button
                setTimeout(function(){$('#login-create-account', $thisPage).removeClass('pulse');}, 4000);
            }

        },

        /**
         * method is triggered when the sign-in page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms in the login page
                $('#sign-in-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#sign-in-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object in the sign-in page
                utopiasoftware.saveup.controller.signInPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the sign-in page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms in the login page
                $('#sign-in-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#sign-in-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects in the login page
                utopiasoftware.saveup.controller.signInPageViewModel.formValidator.destroy();
            }
            catch(err){}
        },

        /**
         * method is triggered when sign-in form is successfully validated
         */
        signinFormValidated: function(){

            // display the loader message to indicate is being signed in;
            $('#loader-modal-message').html("Signing In...");
            $('#loader-modal').get(0).show(); // show loader

            if(utopiasoftware.saveup.model.appUserDetails &&
                ($('#login-form #user-phone').val() === utopiasoftware.saveup.model.appUserDetails.phoneNumber) &&
                ($('#login-form #secure-pin').val() === utopiasoftware.saveup.model.appUserDetails.securePin)){ // user can sign in

                $('#loader-modal').get(0).hide(); // hide loader
                // update the first name being displayed in the side menu
                $('#side-menu-username').html(utopiasoftware.saveup.model.appUserDetails.firstName);
                $('ons-splitter').get(0).content.load("app-main-template"); // move to the main menu
                // show a toast welcoming user
                Materialize.toast('Welcome ' + utopiasoftware.saveup.model.appUserDetails.firstName, 4000);
            }
            else{ // user cannot sign in authentication failed
                $('#loader-modal').get(0).hide(); // hide loader
                ons.notification.alert({title: "Sign In Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>' + 'Invalid Credentials' + '</span>',
                    cancelable: false
                });
            }

        },

        /**
         * method is triggered when create account button is clicked
         */
        createAccountButtonClicked: function(){
            // move the tab view to the Sign Up tab
            $('#login-tabbar').get(0).setActiveTab(1, {animation: "slide"});
        },

        /**
         * method is triggered when forgot pin button is clicked
         */
        forgotPinButtonClicked: function(element){
            // move the tab view to the Reset PIN tab
            $('#forgot-pin-popover').get(0).show(element, {});
        }

    },


    /**
     * object is view-model for create-account page
     */
    createAccountPageViewModel: {

        /**
         * used to hold the parsley form validation object for the create-account page
         */
        formValidator: null,

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $thisPage.get(0).onDeviceBackButton = function(){
                    // move to the first tab in the tab bar i.e sign-in page
                    $('#login-tabbar').get(0).setActiveTab(0, {animation: "slide"});
                };

                // initialise the create-account form validation
                utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator = $('#create-account-form').parsley();

                // attach listener for the create account button on the create account page
                $('#create-account-button').get(0).onclick = function(){
                    // run the validation method for the create account form
                    utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator.whenValidate();
                };

                // listen for log in form field validation failure event
                utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for log in form field validation success event
                utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                });

                // listen for log in form validation success
                utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.createAccountPageViewModel.createAccountFormValidated);

                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },

        /**
         * method is triggered when the create-account page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms on the page
                $('#create-account-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#create-account-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object on the page
                utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the sign-in page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms on the page
                $('#create-account-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#create-account-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.createAccountPageViewModel.formValidator.destroy();
            }
            catch(err){}
        },

        /**
         * method is triggered when sign-up form is successfully validated
         */
        createAccountFormValidated: function(){

            // tell the user that phoe number verification is necessary
            new Promise(function(resolve, reject){
                ons.notification.confirm('To complete sign up, your phone number must be verified. <br>' +
                    'Usual SMS charge from your phone network provider will apply', {title: 'Verify Phone Number',
                        buttonLabels: ['Cancel', 'Ok']}) // Ask for confirmation
                    .then(function(index) {
                        if (index === 1) { // OK button
                            resolve();
                        }
                        else{
                            reject("your phone number could not be verified");
                        }
                    });
            }).
            then(function(){ // verify the user's phone number

                //return null;
                return utopiasoftware.saveup.validatePhoneNumber($('#create-phone').val());
            }).
            then(function(){
                // display the loader message to indicate that account is being created;
                $('#loader-modal-message').html("Completing Sign Up...");
                return Promise.resolve($('#loader-modal').get(0).show()); // show loader
            }).
            then(function(){ // clear all data belonging to previous user
                var promisesArray = []; // holds all the Promise objects for all data being deleted

                var promiseObject = new Promise(function(resolve, reject){
                    // delete the user app details from secure storage if it exists
                    Promise.resolve(intel.security.secureStorage.
                    delete({'id':'postcash-user-details'})).
                    then(function(){resolve();},function(){resolve();}); // ALWAYS resolve the promise
                });

                // add the promise object to the promise array
                promisesArray.push(promiseObject);

                promiseObject = new Promise(function(resolve, reject){
                    /// delete all the user's financial cards data
                    utopiasoftware.saveup.financialCardOperations.deleteAllCards().
                    then(function(){resolve();},function(){resolve();}); // ALWAYS resolve the promise
                });

                // add the promise object to the promise array
                promisesArray.push(promiseObject);

                promiseObject = new Promise(function(resolve, reject){
                    /// delete all the user's bank account data
                    utopiasoftware.saveup.bankAccountOperations.deleteAllMyAccounts().
                    then(function(){resolve();},function(){resolve();}); // ALWAYS resolve the promise
                });

                // add the promise object to the promise array
                promisesArray.push(promiseObject);

                promiseObject = new Promise(function(resolve, reject){
                    /// delete all the user's saved recipients data
                    utopiasoftware.saveup.savedRecipientsBankAccountOperations.deleteAllSavedRecipientAccounts().
                    then(function(){resolve();},function(){resolve();}); // ALWAYS resolve the promise
                });

                // add the promise object to the promise array
                promisesArray.push(promiseObject);

                promiseObject = new Promise(function(resolve, reject){
                    /// delete all the user's transaction history data
                    utopiasoftware.saveup.transactionHistoryOperations.deleteAllTransactionHistory().
                    then(function(){resolve();},function(){resolve();}); // ALWAYS resolve the promise
                });

                // add the promise object to the promise array
                promisesArray.push(promiseObject);

                // return promise when all operations have completed
                return Promise.all(promisesArray);
            }).
            then(function(){
                // clear all data in the device local/session storage
                window.localStorage.clear();
                window.sessionStorage.clear();
                return null;
            }).
            then(function(){

                // create the app user details object and persist it
                utopiasoftware.saveup.model.appUserDetails = {
                    firstName: $('#create-account-form #create-first-name').val(),
                    lastName: $('#create-account-form #create-last-name').val(),
                    phoneNumber: $('#create-account-form #create-phone').val(),
                    phoneNumber_intlFormat: $('#create-account-form #create-phone').val().startsWith("0") ?
                        $('#create-account-form #create-phone').val().replace("0", "+234") :
                        $('#create-account-form #create-phone').val(),
                securePin: $('#create-account-form #create-secure-pin').val()
                };

                return utopiasoftware.saveup.model.appUserDetails;
            }).
            then(function(newUser){
                // create a cypher data of the user details
                return Promise.resolve(intel.security.secureData.
                createFromData({"data": JSON.stringify(newUser)}));
            }).
            then(function(instanceId){
                    // store the cyphered data in secure persistent storage
                    return Promise.resolve(
                        intel.security.secureStorage.write({"id": "postcash-user-details", "instanceID": instanceId})
                    );
                }).
            then(function(){
                $('#loader-modal').get(0).hide(); // hide loader
                // set app-status local storage (as user phone number)
                window.localStorage.setItem("app-status", utopiasoftware.saveup.model.appUserDetails.phoneNumber);
                // update the first name being displayed in the side menu
                $('#side-menu-username').html(utopiasoftware.saveup.model.appUserDetails.firstName);
                $('ons-splitter').get(0).content.load("app-main-template"); // move to the main menu
                // show a toast informing user that account has been created
                Materialize.toast('Sign Up completed! Welcome', 4000);
            }).
            catch(function(err){
                if(typeof err !== "string"){ // if err is NOT a String
                    err = "Sorry. Sign Up could not be completed"
                }
                $('#loader-modal').get(0).hide(); // hide loader
                ons.notification.alert({title: "Sign Up Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>' + err + '</span>',
                    cancelable: false
                });
            });
        },

        /**
         * method is triggered when the Create Account PIN visibility button is clicked.
         * It toggles pin visibility
         *
         * @param buttonElement
         */
        pinVisibilityButtonClicked: function(buttonElement){
            if($(buttonElement).attr("data-saveup-visible") === "no"){ // pin is not visible, make it visible
                $('#create-secure-pin').css("-webkit-text-security", "none"); // change the text-security for the input field
                $(buttonElement).find('ons-icon').attr("icon", "md-eye-off"); // change the icon associated with the input
                $(buttonElement).attr("data-saveup-visible", "yes"); // flag the pin is now visible
            }
            else{ // make the pin not visible
                $('#create-secure-pin').css("-webkit-text-security", "disc"); // change the text-security for the input field
                $(buttonElement).find('ons-icon').attr("icon", "md-eye"); // change the icon associated with the input
                $(buttonElement).attr("data-saveup-visible", "no"); // flag the pin is now invisible
            }
        }

    },


    /**
     * object is view-model for onboarding page
     */
    onboardingPageViewModel: {


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable");

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#onboarding-navigator').get(0).topPage.onDeviceBackButton = function(){
                    ons.notification.confirm('Do you want to close the app?', {title: 'Exit',
                        buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                        .then(function(index) {
                            if (index === 1) { // OK button
                                navigator.app.exitApp(); // Close the app
                            }
                        });
                };

                // initialise carousel
                $('#onboarding-carousel', $thisPage).carousel({dist: 0, fullWidth: true, indicators: true, noWrap: true});
                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },


        /**
         * method is used to move the onboarding presentation to the next slide
         *
         * @param buttonElem
         */
        nextSlideButtonClicked: function(buttonElem){
            $('#onboarding-carousel').carousel('next'); // move to the next slide
            // wait for the slide animation to complete
            setTimeout(function(){
                // check if this is the last slide in the presentation
                if($('.carousel-item.active').is('[href="#three!"]')){ // this is the last slide
                    $(buttonElem).css("display", "none"); // hide the Next button
                }
            }, 205);
        },


        /**
         * method is used to end the onboarding presentation
         */
        endButtonClicked: function(){

            // load the main menu template
            $('ons-splitter').get(0).content.load("app-main-template");
        }

    },

    /**
     * object is view-model for main-menu page
     */
    mainMenuPageViewModel: {


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable");

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){
                    ons.notification.confirm('Do you want to close the app?', {title: 'Exit',
                            buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                        .then(function(index) {
                            if (index === 1) { // OK button
                                navigator.app.exitApp(); // Close the app
                            }
                        });
                };

                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },


        /**
         * method is triggered when page is shown
         */
        pageShow: function(){
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable");
        },


        /**
         * method is used to listen for click events of the main menu items
         *
         * @param label
         */
        mainMenuButtonsClicked: function(label){
            if(label == "transfer cash"){ // 'transfer cash' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {}); // navigate to the specified pages
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "verify account"){ // 'verify account' button was clicked

                $('#app-main-navigator').get(0).pushPage("verify-account-page.html", {}); // navigate to the verify account page

                return;
            }

            if(label == "my cards"){ // 'my cards' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).pushPage("my-cards-page.html", {}); // navigate to the my cards pages
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "my accounts"){ // 'my accounts' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).pushPage("my-accounts-page.html", {}); // navigate to the my accounts pages
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "saved recipients"){ // 'saved recipients' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).pushPage("saved-recipients-page.html", {}); // navigate to the saved recipients pages
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "intro"){ // intro button was clicked

                $('#app-main-navigator').get(0).pushPage("onboarding-page.html", {}); // navigate ot the onboarding page

                return;
            }

            if(label == "transaction history"){ // 'transaction history' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).pushPage("transaction-history-page.html", {}); // navigate to the transaction history pages
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "settings"){ // settings button was clicked

                $('#app-main-navigator').get(0).pushPage("settings-page.html", {}); // settings page

                return;
            }

            if(label == "contact us"){ // contact us button was clicked

                ons.notification.alert({title: '<ons-icon icon="md-brush" size="32px" rotate="270" ' +
                'style="color: green;"></ons-icon><span style="color: green;">PostCash Beta</span>',
                    messageHTML: '<span style="font-weight: bold">Thank you for using PostCash.<br> ' +
                    "PostCash is currently in beta and this feature isn't available yet. Expect an update soon!</span>",
                    cancelable: false
                });

                return;
            }

            if(label == "app info"){ // app info button was clicked

                ons.notification.alert({title: '<ons-icon icon="md-brush" size="32px" rotate="270" ' +
                'style="color: green;"></ons-icon><span style="color: green;">PostCash Beta</span>',
                    messageHTML: '<span style="font-weight: bold">Thank you for using PostCash.<br> ' +
                    "PostCash is currently in beta and this feature isn't available yet. Expect an update soon!</span>",
                    cancelable: false
                });

                return;
            }
        }



    },

    /**
     * object is view-model for verify-account page
     */
    verifyAccountPageViewModel: {

        /**
         * used to hold the parsley form validation object for the page
         */
        formValidator: null,

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }


                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    // check if the verify-account bottom sheet is open
                    if($('#verify-account-bottom-sheet').data("saveupSheetState") === "open"){ // bottom sheet is open
                        $('#verify-account-bottom-sheet').modal("close"); // close the bottom sheet

                        return;
                    }

                    $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                };


                // initialise the form validation
                utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator = $('#verify-account-form').parsley();

                // attach listener for the verify account button
                $('#verify-account-button').get(0).onclick = function(){
                    // run the validation method for the create account form
                    utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator.whenValidate();
                };

                // listen for log in form field validation failure event
                utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for log in form field validation success event
                utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                });

                // listen for log in form validation success
                utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.verifyAccountPageViewModel.verifyAccountFormValidated);

                // retrieve the sorted array of banks
                Promise.resolve(utopiasoftware.saveup.sortBanksData()).
                then(function(bankArrayData){
                    var optionTags = ""; // string to hold all created option tags

                    // get each object in bank array and use it to create the select element
                    for(var index = 0; index < bankArrayData.length; index++){
                        var bankObject = bankArrayData[index]; // get the bank object
                        // update the banks select element option tags
                        for(var prop in bankObject){
                            optionTags += '<option value="' + prop + '">' + bankObject[prop] + '</option>';
                        }
                    }

                    $('#verify-account-choose-bank', $thisPage).append(optionTags); // append all the created option tags
                    // initilise the select element
                    $('#verify-account-choose-bank', $thisPage).material_select();
                    // initialise the character counter plugin
                    $('#verify-account-number', $thisPage).characterCounter();
                    // remove the progress indeterminate loader
                    $('.progress', $thisPage).remove();
                    // make the verify account form visible
                    $('#verify-account-form', $thisPage).css("display", "block");
                    // enable the 'Verify Account' button
                    $('#verify-account-button', $thisPage).removeAttr("disabled");
                    // hide the loader
                    $('#loader-modal').get(0).hide();
                }).
                catch();

            }

        },

        /**
         * method is triggered when the create-account page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms on the page
                $('#verify-account-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#verify-account-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object on the page
                utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the sign-in page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms on the page
                $('#verify-account-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#verify-account-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.verifyAccountPageViewModel.formValidator.destroy();
                // destroy the form inputs which need to be destroyed
                $('#verify-account-choose-bank').material_select('destroy');
                $('#verify-account-number').off();
                $('#verify-account-number').removeData();
            }
            catch(err){}
        },

        /**
         * method is triggered when verify account form is successfully validated
         */
        verifyAccountFormValidated: function(){

            // check if Internet Connection is available before proceeding
            if(navigator.connection.type === Connection.NONE){ // no Internet Connection
                // inform the user that they cannot proceed without Internet
                window.plugins.toast.showWithOptions({
                    message: "You cannot verify accounts without an Internet Connection",
                    duration: 4000,
                    position: "top",
                    styling: {
                        opacity: 1,
                        backgroundColor: '#ff0000', //red
                        textColor: '#FFFFFF',
                        textSize: 14
                    }
                }, function(toastEvent){
                    if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                        window.plugins.toast.hide();
                    }
                });

                return; // exit method immediately
            }

            // display the loader message to indicate that account is being verified;
            $('#loader-modal-message').html("Verifying Bank Account...");
            $('#loader-modal').get(0).show(); // show loader

            // request for gateway authorization token
            utopiasoftware.saveup.moneyWaveObject.useToken.
            then(function(tokenData){
                // verify the bank account
                return new Promise(function(resolve, reject){
                    var verifyAccountRequest = $.ajax(
                        {
                            url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/resolve/account",
                            type: "post",
                            contentType: "application/json",
                            beforeSend: function(jqxhr) {
                                jqxhr.setRequestHeader("Authorization", tokenData);
                            },
                            dataType: "json",
                            timeout: 240000, // wait for 4 minutes before timeout of request
                            processData: false,
                            data: JSON.stringify({
                                account_number: $('#verify-account-form #verify-account-number').val(),
                                bank_code: $('#verify-account-form #verify-account-choose-bank').val()
                            })
                        }
                    );

                    // server responded to account verification request
                    verifyAccountRequest.done(function(responseData){
                        if(responseData.status === "success"){ // the server responded with a successful account verification
                            // set the name of the account which has been verified
                            $('#verify-account-form #verify-account-name').val(responseData.data.account_name);
                            resolve(); // resolve the account verification promise
                        }
                        else { // the server responded unsuccessfully
                            reject(); // reject the account verification promise
                        }
                    });

                    // server responded with a failure to the verification request
                    verifyAccountRequest.fail(function(){
                        reject(); // reject the account verification promise
                    });
                });
            }).
            then(function(){
                // hide the loader modal
                return $('#loader-modal').get(0).hide(); // hide loader
            }).
            then(function(){
                // show a toast welcoming user
                Materialize.toast('Bank account verified <ons-button modifier="quiet" style="color: #82b1ff" onclick="utopiasoftware.saveup.controller.verifyAccountPageViewModel.moreActions();">More</ons-button>', 4000);
                // show the result of the verification to the user
                $('#verify-account-form .verify-account-success').css("display", "block");
                $('#verify-account-form .verify-account-success').addClass("scale-in");
            }).
            catch(function(){ // inform the user that this is an invalid account number
                // hide the loader modal
                $('#loader-modal').get(0).hide(); // hide loader
                // show the FAILED result of the verification to the user
                $('#verify-account-form .verify-account-failed').css("display", "block");
                $('#verify-account-form .verify-account-failed').addClass("scale-in");
            });
        },


        /**
         * method is used to specifically reset the verified account display used
         * when an account has been previously verified
         *
         */
        resetVerifiedAcctDisplay: function(){
            // hide all account verification information
            $('#verify-account-form .verify-account-success').css("display", "none");
            $('#verify-account-form .verify-account-success').removeClass("scale-in");
            $('#verify-account-form .verify-account-failed').css("display", "none");
            $('#verify-account-form .verify-account-failed').removeClass("scale-in");
        },


        /**
         * method is used to display the means for performing more actions upon/after
         * bank account verification
         */
        moreActions: function(){
            // display the bottom sheets
            $('#verify-account-bottom-sheet').modal('open');
        },


        /**
         * method is used to listen for clicks on the bottom sheet of the verify account page
         * @param label
         */
        verifyAcctBottomSheetListItemClicked: function(label){

            if(label == "transfer cash"){ // 'Transfer Cash to account' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        // close the 'verify account' the bottom sheets
                        $('#verify-account-bottom-sheet').modal('close');
                        $('#transfer-cash-page').remove(); // remove previous transfer cash pages
                        // call the transfer-cash=page and pass the verified account as recipient details data
                        $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {
                            data: {
                                recipient_details: {
                                    recipientAccountName: $('#verify-account-name').val(),
                                    recipientAccount: $('#verify-account-page #verify-account-number').val(),
                                    recipientBankCode: $('#verify-account-page #verify-account-choose-bank').val()}}
                        }); // navigate to the specified page
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "add to my accounts"){ // 'add to my accounts' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        // close the 'verify account' the bottom sheets
                        $('#verify-account-bottom-sheet').modal('close');
                        // display the secure storage modal to indicate that Bank Account is being securely stored
                        $('#secure-storage-modal .modal-message').html("Storing Bank Account on Device...");
                        $('#secure-storage-modal').get(0).show(); // show loader
                        // add the verifed bank account to the user's secure "My Accounts" storage
                        utopiasoftware.saveup.bankAccountOperations.addMyAccount({
                            uniqueAccountId: "" + utopiasoftware.saveup.model.deviceUUID + Date.now(),
                            bankAccountNumber: $('#verify-account-form #verify-account-number').val(),
                            bankAccountName: $('#verify-account-form #verify-account-name').val(),
                            bankName: $('#verify-account-form #verify-account-choose-bank option:selected').text().trim(),
                            flutterwave_bankCode: $('#verify-account-form #verify-account-choose-bank').val(),
                            bankAccountAvatar: "css/app-images/avatar-" +
                            (new Random(Random.engines.nativeMath)).integer(1, 6) + ".png"
                        }).
                        then(function(){
                            // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                            window.setTimeout(function(){
                                $('#secure-storage-modal').get(0).hide(); // hide loader
                                // inform user that user's bank account has been successfully added to secure storage
                                Materialize.toast('New bank account added', 4000);
                            }, 4000);
                        }).
                        catch(function(err){

                            $('#secure-storage-modal').get(0).hide(); // hide loader
                            ons.notification.alert({title: "Save Error",
                                messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                                'style="color: red;"></ons-icon> <span>' + (err.message || "") + ' Sorry, this bank account could not be added. ' +
                                '<br>You can try again' + '</span>',
                                cancelable: true
                            });
                        });
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "add to my recipients"){ // 'add to my recipients' button was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        // close the 'verify account' the bottom sheets
                        $('#verify-account-bottom-sheet').modal('close');
                        // display the secure storage modal to indicate that Recipient's Bank Account is being securely stored
                        $('#secure-storage-modal .modal-message').html("Storing Recipient's Bank Account on Device...");
                        $('#secure-storage-modal').get(0).show(); // show loader
                        // add the verifed bank account to the user's secure "My Accounts" storage
                        utopiasoftware.saveup.savedRecipientsBankAccountOperations.addSavedRecipientAccount({
                            uniqueAccountId: "" + utopiasoftware.saveup.model.deviceUUID + Date.now(),
                            bankAccountNumber: $('#verify-account-form #verify-account-number').val(),
                            bankAccountName: $('#verify-account-form #verify-account-name').val(),
                            bankName: $('#verify-account-form #verify-account-choose-bank option:selected').text().trim(),
                            flutterwave_bankCode: $('#verify-account-form #verify-account-choose-bank').val(),
                            bankAccountAvatar: "css/app-images/avatar-" +
                            (new Random(Random.engines.nativeMath)).integer(1, 6) + ".png"
                        }).
                        then(function(){
                            // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                            window.setTimeout(function(){
                                $('#secure-storage-modal').get(0).hide(); // hide loader
                                // inform user that recipient's bank account has been successfully added to secure storage
                                Materialize.toast("Recipient's bank account added", 4000);
                            }, 4000);
                        }).
                        catch(function(err){

                            $('#secure-storage-modal').get(0).hide(); // hide loader
                            ons.notification.alert({title: "Save Error",
                                messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                                'style="color: red;"></ons-icon> <span>' + (err.message || "") + " Sorry, this recipient's bank account could not be added. " +
                                '<br>You can try again' + '</span>',
                                cancelable: true
                            });
                        });
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }
        }

    },


    /**
     * object is view-model for my-cards-page page
     */
    myCardsPageViewModel: {


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                };

                // register listener for the pull-to-refresh widget
                $('#my-cards-pull-hook', $thisPage).on("changestate", function(event){

                    // check the state of the pull-to-refresh widget
                    switch (event.originalEvent.state){
                        case 'initial':
                            // update the displayed icon
                            $('#my-cards-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-down" size="24px"></ons-icon>');
                            break;

                        case 'preaction':

                            $('#my-cards-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-up" size="24px"></ons-icon>');
                            break;

                        case 'action':
                            $('#my-cards-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-repeat" size="24px" spin></ons-icon>');
                            break;
                    }
                });

                // add method to handle the loading action of the pull-to-refresh widget
                $('#my-cards-pull-hook', $thisPage).get(0).onAction = function(loadingDone){
                    // disable pull-to-refresh widget till loading is done
                    $('#my-cards-pull-hook', $thisPage).attr("disabled", true);

                    // load the card data from the device secure store
                    utopiasoftware.saveup.financialCardOperations.loadCardData().
                    then(function(cardsArray){ // the cards array collection has been returned
                        if(cardsArray.length == 0){ // there are no card data available
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                            // display a message to inform user that there are no cards available
                            $('#my-cards-page-message', $thisPage).css("display", "block");
                            // hide the error message from displaying
                            $('#my-cards-page-error', $thisPage).css("display", "none");
                            // hide the my-cards-list from display
                            $('#my-cards-list', $thisPage).css("display", "none");
                            // enable the 'Add Card' button
                            $('#my-cards-add-card-button', $thisPage).removeAttr("disabled");
                            // flag that loading is done
                            loadingDone();
                        }
                        else{ // there are card data available
                            // empty the contents of the my cards list
                            $('#my-cards-list', $thisPage).html("");

                            for(let index = 0; index < cardsArray.length; index++){ // append the stored cards to the "My Cards" list
                                // create the card content
                                let cardContent = `<div class="row"><div class="col s1"></div><div class="col s10">
                                <div class="card small">
                                <div class="card-image" style="padding-top: 3%; padding-left: 3%; padding-right: 3%;
                                background-image: url('${cardsArray[index].cardImage}'); background-position: center; background-size: contain; background-origin: content-box; background-repeat: no-repeat;">
                                <img src="css/app-images/blank.png">
                                </div>
                                <div class="card-content" style="padding-bottom: 5px;">
                                <div style="font-weight: bold; font-style: italic; color: #464646">${cardsArray[index].cardNickName}</div>
                                <div style="font-weight: bold; font-size: 0.8em; color: #464646">${cardsArray[index].cardBrand}
                                ${cardsArray[index].cardLocale == "international" ? "(International)" : ""}</div>
                                </div>
                                <div class="card-action" style="padding: 0;">
                                <ons-button data-id="${cardsArray[index].cardUniqueId}"
                                data-acct-object='${JSON.stringify({senderCardNickName:cardsArray[index].cardNickName,
                                    senderCardNumber:cardsArray[index].cardNumber,
                                    senderCardCvv:cardsArray[index].cvv,senderCardExpiryMonth:cardsArray[index].cardExpiryMonth,
                                    senderCardExpiryYear:cardsArray[index].cardExpiryYear})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${cardsArray[index].cardUniqueId}" modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                    onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.editCardButtonClicked(this)">
                            <ons-icon icon="md-edit" size="25px">
                            </ons-icon>
                            </ons-button>
                            <ons-button data-id="${cardsArray[index].cardUniqueId}" modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                    onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.deleteCardButtonClicked(this)">
                            <ons-icon icon="md-delete" size="25px">
                            </ons-icon>
                            </ons-button>
                                </div>
                                </div>
                                </div>
                                <div class="col s1"></div>
                                </div>` ;
                                // append the card content to the "My Card" list
                                $('#my-cards-list', $thisPage).append(cardContent);
                            }
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                            // hide message to inform user that there are no cards available
                            $('#my-cards-page-message', $thisPage).css("display", "none");
                            // hide the error message from displaying
                            $('#my-cards-page-error', $thisPage).css("display", "none");
                            // display the my-cards-list
                            $('#my-cards-list', $thisPage).css("display", "block");
                            // enable the 'Add Card' button
                            $('#my-cards-add-card-button', $thisPage).removeAttr("disabled");
                            // flag that loading is done
                            loadingDone();
                        }
                    }).
                    catch(function(){ // an error occurred, so display the error message to the user
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                        // hide a message to inform user that there are no cards available
                        $('#my-cards-page-message', $thisPage).css("display", "none");
                        // display the error message to user
                        $('#my-cards-page-error', $thisPage).css("display", "block");
                        // hide the my-cards-list from display
                        $('#my-cards-list', $thisPage).css("display", "none");
                        // disable the 'Add Card' button
                        $('#my-cards-add-card-button', $thisPage).attr("disabled", true);
                        // flag that loading is done
                        loadingDone();
                    });
                };

                // load the card data from the device secure store
                utopiasoftware.saveup.financialCardOperations.loadCardData().
                then(function(cardsArray){ // the cards array collection has been returned
                    if(cardsArray.length == 0){ // there are no card data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no cards available
                        $('#my-cards-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#my-cards-page-error', $thisPage).css("display", "none");
                        // hide the my-cards-list from display
                        $('#my-cards-list', $thisPage).css("display", "none");
                        // enable the 'Add Card' button
                        $('#my-cards-add-card-button', $thisPage).removeAttr("disabled");
                    }
                    else{ // there are card data available
                        // empty the contents of the my cards list
                        $('#my-cards-list', $thisPage).html("");

                        for(let index = 0; index < cardsArray.length; index++){ // append the stored cards to the "My Cards" list
                            // create the card content
                            let cardContent = `<div class="row"><div class="col s1"></div><div class="col s10">
                            <div class="card small">
                            <div class="card-image" style="padding-top: 3%; padding-left: 3%; padding-right: 3%;
                            background-image: url('${cardsArray[index].cardImage}'); background-position: center; background-size: contain; background-origin: content-box; background-repeat: no-repeat;">
                            <img src="css/app-images/blank.png">
                            </div>
                            <div class="card-content" style="padding-bottom: 5px;">
                            <div style="font-weight: bold; font-style: italic; color: #464646">${cardsArray[index].cardNickName}</div>
                            <div style="font-weight: bold; font-size: 0.8em; color: #464646">${cardsArray[index].cardBrand}
                            ${cardsArray[index].cardLocale == "international" ? "(International)" : ""}</div>
                            </div>
                            <div class="card-action" style="padding: 0;">
                            <ons-button data-id="${cardsArray[index].cardUniqueId}"
                                data-acct-object='${JSON.stringify({senderCardNickName:cardsArray[index].cardNickName,
                                senderCardNumber:cardsArray[index].cardNumber,
                                senderCardCvv:cardsArray[index].cvv,senderCardExpiryMonth:cardsArray[index].cardExpiryMonth,
                                senderCardExpiryYear:cardsArray[index].cardExpiryYear})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                            <ons-button data-id="${cardsArray[index].cardUniqueId}" modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                    onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.editCardButtonClicked(this)">
                            <ons-icon icon="md-edit" size="25px">
                            </ons-icon>
                            </ons-button>
                            <ons-button data-id="${cardsArray[index].cardUniqueId}" modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                    onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.deleteCardButtonClicked(this)">
                            <ons-icon icon="md-delete" size="25px">
                            </ons-icon>
                            </ons-button>
                            </div>
                            </div>
                            </div>
                            <div class="col s1"></div>
                            </div>` ;
                            // append the card content to the "My Card" list
                            $('#my-cards-list', $thisPage).append(cardContent);
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no cards available
                        $('#my-cards-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#my-cards-page-error', $thisPage).css("display", "none");
                        // display the my-cards-list
                        $('#my-cards-list', $thisPage).css("display", "block");
                        // enable the 'Add Card' button
                        $('#my-cards-add-card-button', $thisPage).removeAttr("disabled");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no cards available
                    $('#my-cards-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#my-cards-page-error', $thisPage).css("display", "block");
                    // hide the my-cards-list from display
                    $('#my-cards-list', $thisPage).css("display", "none");
                    // disable the 'Add Card' button
                    $('#my-cards-add-card-button', $thisPage).attr("disabled", true);
                });

                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },


        /**
         * method is triggered when page is shown
         *
         * @param event
         */
        pageShow: function(event){
            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // check if the data on the page should be refreshed
            if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.refresh
            && $('#app-main-navigator').get(0).topPage.data.refresh === true){ // user wants this page refreshed
                // add & display the preloader for the page
                $('#my-cards-pull-hook', $thisPage).after('<div class="progress"><div class="indeterminate"></div> </div>');

                // load the card data from the device secure store
                utopiasoftware.saveup.financialCardOperations.loadCardData().
                then(function(cardsArray){ // the cards array collection has been returned
                    if(cardsArray.length == 0){ // there are no card data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no cards available
                        $('#my-cards-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#my-cards-page-error', $thisPage).css("display", "none");
                        // hide the my-cards-list from display
                        $('#my-cards-list', $thisPage).css("display", "none");
                        // enable the 'Add Card' button
                        $('#my-cards-add-card-button', $thisPage).removeAttr("disabled");
                    }
                    else{ // there are card data available
                        // empty the contents of the my cards list
                        $('#my-cards-list', $thisPage).html("");

                        for(let index = 0; index < cardsArray.length; index++){ // append the stored cards to the "My Cards" list
                            // create the card content
                            let cardContent = `<div class="row"><div class="col s1"></div><div class="col s10">
                            <div class="card small">
                            <div class="card-image" style="padding-top: 3%; padding-left: 3%; padding-right: 3%;
                            background-image: url('${cardsArray[index].cardImage}'); background-position: center; background-size: contain; background-origin: content-box; background-repeat: no-repeat;">
                            <img src="css/app-images/blank.png">
                            </div>
                            <div class="card-content" style="padding-bottom: 5px;">
                            <div style="font-weight: bold; font-style: italic; color: #464646">${cardsArray[index].cardNickName}</div>
                            <div style="font-weight: bold; font-size: 0.8em; color: #464646">${cardsArray[index].cardBrand}
                            ${cardsArray[index].cardLocale == "international" ? "(International)" : ""}</div>
                            </div>
                            <div class="card-action" style="padding: 0;">
                            <ons-button data-id="${cardsArray[index].cardUniqueId}"
                                data-acct-object='${JSON.stringify({senderCardNickName:cardsArray[index].cardNickName,
                                senderCardNumber:cardsArray[index].cardNumber,
                                senderCardCvv:cardsArray[index].cvv,senderCardExpiryMonth:cardsArray[index].cardExpiryMonth,
                                senderCardExpiryYear:cardsArray[index].cardExpiryYear})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                            <ons-button data-id="${cardsArray[index].cardUniqueId}" modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                    onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.editCardButtonClicked(this)">
                            <ons-icon icon="md-edit" size="25px">
                            </ons-icon>
                            </ons-button>
                            <ons-button data-id="${cardsArray[index].cardUniqueId}" modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                    onclick="utopiasoftware.saveup.controller.myCardsPageViewModel.deleteCardButtonClicked(this)">
                            <ons-icon icon="md-delete" size="25px">
                            </ons-icon>
                            </ons-button>
                            </div>
                            </div>
                            </div>
                            <div class="col s1"></div>
                            </div>` ;
                            // append the card content to the "My Card" list
                            $('#my-cards-list', $thisPage).append(cardContent);
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no cards available
                        $('#my-cards-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#my-cards-page-error', $thisPage).css("display", "none");
                        // display the my-cards-list
                        $('#my-cards-list', $thisPage).css("display", "block");
                        // enable the 'Add Card' button
                        $('#my-cards-add-card-button', $thisPage).removeAttr("disabled");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#my-cards-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#my-cards-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no cards available
                    $('#my-cards-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#my-cards-page-error', $thisPage).css("display", "block");
                    // hide the my-cards-list from display
                    $('#my-cards-list', $thisPage).css("display", "none");
                    // disable the 'Add Card' button
                    $('#my-cards-add-card-button', $thisPage).attr("disabled", true);
                });
            }

        },


        /**
         * method is triggered when the 'Add Card' button is clicked
         */
        addCardButtonClicked: function(){
            $('#app-main-navigator').get(0).pushPage("add-card-page.html", {
                animation: "lift-md"
            });
        },


        /**
         * method is used to trigger the delete operation of a financial card
         * and updating the user-interface (UI)
         *
         * @param buttonElem
         */
        deleteCardButtonClicked: function(buttonElem){

            // confirm that user wants to delete the card before proceeding
            ons.notification.confirm('Do you want to delete this card?', {title: 'Confirm Delete',
                    buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                .then(function(index) {
                    if (index === 1) { // YES button clicked
                        // call the utility method used to delete a specified card
                        utopiasoftware.saveup.financialCardOperations.deleteCard($(buttonElem).attr("data-id")).
                        then(function(){ // card has been deleted
                            $(buttonElem).closest('.row').remove(); // remove the card from display
                            // inform the user that card was deleted
                            Materialize.toast('Card deleted', 3000);
                        }).
                        catch(function(){
                            // inform the user that the specified financial card could not be deleted
                            window.plugins.toast.showWithOptions({
                                message: "Sorry, the bank card could not be deleted.\n Try again",
                                duration: 4000,
                                position: "top",
                                styling: {
                                    opacity: 1,
                                    backgroundColor: '#ff0000', //red
                                    textColor: '#FFFFFF',
                                    textSize: 14
                                }
                            }, function(toastEvent){
                                if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                                    window.plugins.toast.hide();
                                }
                            });
                        });
                    }
                });
        },


        /**
         * method is used to trigger the edit operation of a financial card
         * and updating/changing the user-interface (UI)
         *
         * @param buttonElem
         */
        editCardButtonClicked: function(buttonElem){
            $('#app-main-navigator').get(0).pushPage("add-card-page.html", {
                animation: "lift-md", data: {edit: $(buttonElem).attr("data-id")}
            });
        },



        /**
         * method is used to trigger the transfer cash operation. It uses the
         * selected user's 'My Card' object as the sender's card for the initiated
         * cash transfer
         *
         * @param buttonElem
         */
        transferCashButtonClicked: function(buttonElem){

            // ask user for secure PIN before proceeding. secure pin MUST match
            ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                'Please enter your PostCash Secure PIN to proceed</span></div>',
                cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                submitOnEnter: true
            }).
            then(function(userInput){ // user has provided a secured PIN , now authenticate it
                if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                    // close the 'verify account' the bottom sheets
                    $('#verify-account-bottom-sheet').modal('close');
                    $('#transfer-cash-page').remove(); // remove previous transfer cash pages
                    // call the transfer-cash=page and pass the 'my card' details contained in the data attribute as card details data
                    $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {
                        data: {
                            sender_card_details: JSON.parse($(buttonElem).attr("data-acct-object"))}
                    }); // navigate to the specified page
                }
                else{ // inform user that security check failed/user authentication failed
                    ons.notification.alert({title: "Security Check",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                        cancelable: true
                    });
                }
            }).
            catch(function(){});

            return;
        }

    },

    /**
     * object is view-model for add-card page
     */
    addCardPageViewModel: {

        /**
         * used to hold the parsley form validation object for the page
         */
        formValidator: null,

        /**
         * property used to keep track of the immediate last scroll position of the
         * page content
         */
        previousScrollPosition: 0,

        /**
         * property used to keep track of the current scroll position of the
         * page content
         */
        currentScrollPosition: 0,

        /**
         * property stores the brand of the new financial card being added.
         * currently, Possible values are- Mastercard, Visa or Verve.
         * Default value is an empty string
         */
        newCardBrand: "Unknown",

        /**
         * property holds the 'general' locale of the new financial card being added.
         * currently, possible values are - local or international
         */
        newCardLocale: "Unknown",

        /**
         * poperty holds the image to be used for the new card
         */
        newCardImage: "",

        cardImageRandomNum: null,

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable", true);

            // reset the previous & current scroll positions of the page contents
            utopiasoftware.saveup.controller.addCardPageViewModel.previousScrollPosition = 0;
            utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition = 0;

            // reset the new card brand, card general locale & card image
            utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
            utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
            utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage = "";

            // generate the random number used to display the financial card image
            var randomGen = new Random(Random.engines.nativeMath); // random number generator
            // generate the random number
            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum = randomGen.integer(1, 3);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }


                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).popPage();
                };

                // listen for the scroll event of the page content
                $('#add-card-page .page__content').on("scroll", utopiasoftware.saveup.controller.addCardPageViewModel.pageContentScrolled);

                // initialise the form validation
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator = $('#add-card-form').parsley();

                // attach listener for the 'save' button click
                $('#add-card-save-button').get(0).onclick = function(){
                    // run the validation method for the create account form
                    utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.whenValidate();
                };

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.on('field:ajaxoptions',
                    function(fieldInstance, ajaxOptions){
                        // edit the ajax options object to include the necessary authorization header
                        ajaxOptions.headers = {"Authorization":"Bearer " + utopiasoftware.saveup.paystackObject.key.secret};
                        // display the loading icon for card number validation
                        $('#add-card-number-validation-loading', $thisPage).css("display", "block");
                    });

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                    // check if the element that triggered that validation error was the card number input
                    if($(fieldInstance.$element).is('#add-card-card-number')){ // it is the card number input
                        // hide the loading icon
                        $('#add-card-number-validation-loading', $thisPage).css("display", "none");
                        // hide the card image row
                        $('#add-card-image-container', $thisPage).css("display", "none");
                    }
                });

                // listen for form field validation success event
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                    // check if the element that triggered that validation success was the card number input
                    if($(fieldInstance.$element).is('#add-card-card-number')){ // it is the card number input
                        // hide the loading icon
                        $('#add-card-number-validation-loading', $thisPage).css("display", "none");
                        // check if the user request for remote card number validation
                        if($('#add-card-verify-card').is(":checked")){ //user asked for remote validation
                            // display an image to indicate the card type which the card number verified based on card brand
                            switch(utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand){
                                case "Mastercard":
                                    if(utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale == "local"){
                                        // this is a local mastercard
                                        // set the image for the card
                                        utopiasoftware.saveup.controller.addCardPageViewModel.
                                            newCardImage = "css/app-images/mastercard-local-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png";
                                        $('#add-card-image').attr("src", "css/app-images/mastercard-local-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png"
                                        );
                                        // update the card type display name
                                        $('#add-card-image-type').html("Mastercard");
                                    }
                                    else{
                                        // this is a international mastercard
                                        // set the image for the card
                                        utopiasoftware.saveup.controller.addCardPageViewModel.
                                            newCardImage = "css/app-images/mastercard-international-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png";
                                        $('#add-card-image').attr("src", "css/app-images/mastercard-international-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png"
                                        );
                                        // update the card type display name
                                        $('#add-card-image-type').html("Mastercard (International)");
                                    }
                                    break;

                                case "Visa":
                                    if(utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale == "local"){
                                        // this is a local visa
                                        // set the image for the card
                                        utopiasoftware.saveup.controller.addCardPageViewModel.
                                            newCardImage = "css/app-images/visacard-local-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png";
                                        $('#add-card-image').attr("src", "css/app-images/visacard-local-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png"
                                        );
                                        // update the card type display name
                                        $('#add-card-image-type').html("Visa");
                                    }
                                    else{
                                        // this is a international Visa card
                                        // set the image for the card
                                        utopiasoftware.saveup.controller.addCardPageViewModel.
                                            newCardImage = "css/app-images/visacard-international-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png";
                                        $('#add-card-image').attr("src", "css/app-images/visacard-international-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png"
                                        );
                                        // update the card type display name
                                        $('#add-card-image-type').html("Visa (International)");
                                    }
                                    break;

                                case "Verve":
                                    if(utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale == "local"){
                                        // this is a local verve
                                        // set the image for the card
                                        utopiasoftware.saveup.controller.addCardPageViewModel.
                                            newCardImage = "css/app-images/verve-local-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png";
                                        $('#add-card-image').attr("src", "css/app-images/verve-local-" +
                                            utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png"
                                        );
                                        // update the card type display name
                                        $('#add-card-image-type').html("Verve");
                                    }
                                    break;
                            }

                            // display the card image row
                            $('#add-card-image-container', $thisPage).css("display", "block");
                        }
                        else{ // user did not ask for remote card validation
                            // set the image for the card
                            utopiasoftware.saveup.controller.addCardPageViewModel.
                                newCardImage = "css/app-images/unknown-local-" +
                                utopiasoftware.saveup.controller.addCardPageViewModel.cardImageRandomNum + ".png";
                            // set new card brand as unknown
                            utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
                            // set the new card locale as unknown
                            utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
                            // hide the card image row
                            $('#add-card-image-container', $thisPage).css("display", "none");
                        }
                    }
                });

                // listen for form validation success
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.addCardPageViewModel.addCardFormValidated);

                /** dynamically create the contents of the various select elements **/
                var optionTags = ""; // string to hold all created option tags for the Card Expiry Year
                var yearOption = (new Date()).getFullYear(); // get the current year
                // add current year to the options tag
                optionTags += '<option value="' + yearOption + '">' + yearOption + '</option>';

                // add 3 more years to the option tags for the Card Expiry Year
                for(var index = 0; index < 3; index++){
                    // increase the yearOption by 1
                    yearOption += 1;
                    // add current year to the options tag
                    optionTags += '<option value="' + yearOption + '">' + yearOption + '</option>';
                }

                $('#add-card-expiry-year', $thisPage).append(optionTags); // append all the created option tags

                // initialise all the select element
                $('select', $thisPage).material_select();
                // initialise the character counter plugin
                $('#add-card-card-number', $thisPage).characterCounter();



                // check if the page was sent a financial card id.
                // if so preload the financial card data into the form
                if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.edit){
                    // get the details of the card to be edited
                    utopiasoftware.saveup.financialCardOperations.
                    getCard($('#app-main-navigator').get(0).topPage.data.edit).then(function(card){
                        $('#add-card-page #add-card-unique-id').val(card.cardUniqueId);
                        $('#add-card-page #add-card-card-holder').val(card.cardHolderName);
                        $('#add-card-page #add-card-alias').val(card.cardNickName);
                        $('#add-card-page #add-card-card-number').val(card.cardNumber);
                        $('#add-card-page #add-card-cvv').val(card.cvv);
                        $('#add-card-page #add-card-expiry-month').val(card.cardExpiryMonth);
                        $('#add-card-page #hidden-card-expiry-month-input').val(card.cardExpiryMonth);
                        $('#add-card-page #add-card-expiry-year').val(card.cardExpiryYear);
                        $('#add-card-page #hidden-card-expiry-year-input').val(card.cardExpiryYear);
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = card.cardBrand;
                        $('#add-card-page #add-card-verify-card').prop("checked", card.cardBrand !== "Unknown");
                        // reset the card number validation check and all its related actions
                        utopiasoftware.saveup.controller.addCardPageViewModel.
                        isCardNumberValidated($('#add-card-page #add-card-verify-card'));
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = card.cardLocale;
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage = card.cardImage;

                        // update the card image file
                        $('#add-card-page #add-card-image').attr("src", utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage);
                        // display the card image row
                        $('#add-card-image-container', $thisPage).css("display", "block");

                        // re-update the form input fields
                        Materialize.updateTextFields();
                        //re-initialise the form select elements
                        $('select', $thisPage).material_select();

                        // remove the progress indeterminate loader
                        $('.progress', $thisPage).remove();
                        // make the add card form visible
                        $('#add-card-form', $thisPage).css("display", "block");
                        // enable the 'Cancel' & 'Save' buttons
                        $('#add-card-cancel-button, #add-card-save-button', $thisPage).removeAttr("disabled");
                        // hide the loader
                        $('#loader-modal').get(0).hide();
                    });
                }
                else {
                    // remove the progress indeterminate loader
                    $('.progress', $thisPage).remove();
                    // make the add card form visible
                    $('#add-card-form', $thisPage).css("display", "block");
                    // enable the 'Cancel' & 'Save' buttons
                    $('#add-card-cancel-button, #add-card-save-button', $thisPage).removeAttr("disabled");
                    // hide the loader
                    $('#loader-modal').get(0).hide();
                }

            }

        },

        /**
         * method is triggered when the create-account page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms on the page
                $('#add-card-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#add-card-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object on the page
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the sign-in page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms on the page
                $('#add-card-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#add-card-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.destroy();
                // destroy the form inputs which need to be destroyed
                $('#add-card-page select').material_select('destroy');
                $('#add-card-page #add-card-card-number').off();
                $('#add-card-page #add-card-card-number').removeData();
            }
            catch(err){}
        },

        /**
         * method is triggered when add card form is successfully validated
         */
        addCardFormValidated: function(){

            // display the secure storage modal to indicate that card is being securely stored
            $('#secure-storage-modal .modal-message').html("Storing Card on Device...");
            $('#secure-storage-modal').get(0).show(); // show loader

            // check if this is an EDIT or CREATE operation
            if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.edit){ //this is an EDIT operation
                // card the utility method used to delete a specified card
                utopiasoftware.saveup.financialCardOperations.
                deleteCard($('#app-main-navigator').get(0).topPage.data.edit).
                then(function(){
                    // create an edited card data
                    var editedCardData = {
                        cardUniqueId: $('#app-main-navigator').get(0).topPage.data.edit,
                        cardHolderName: $('#add-card-form #add-card-card-holder').val(),
                        cardNickName: $('#add-card-form #add-card-alias').val(),
                        cardNumber: $('#add-card-form #add-card-card-number').val(),
                        cvv: $('#add-card-form #add-card-cvv').val(),
                        cardExpiryMonth: $('#add-card-form #add-card-expiry-month').val(),
                        cardExpiryYear: $('#add-card-form #add-card-expiry-year').val(),
                        cardBrand: utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand,
                        cardLocale: utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale,
                        cardImage: utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage
                    };

                    // card the utility method used to add a specified card to the card collection
                    return utopiasoftware.saveup.financialCardOperations.
                    addCard(editedCardData);
                }).
                then(function(){
                    // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                    window.setTimeout(function(){
                        // reset the form validator object on the page
                        utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.reset();
                        // reset the form object
                        $('#add-card-page #add-card-form').get(0).reset();
                        // reset the card number validation check and all its related actions
                        utopiasoftware.saveup.controller.addCardPageViewModel.
                        isCardNumberValidated($('#add-card-page #add-card-verify-card'));
                        // reset the new card brand, card general locale & card image
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage = "";
                        // hide the card image row
                        $('#add-card-page #add-card-image-container').css("display", "none");
                        // reset the page scroll position to the top
                        $('#add-card-page .page__content').scrollTop(0);

                        $('#secure-storage-modal').get(0).hide(); // hide loader
                        // inform user that add has been successfully added to secure storage
                        Materialize.toast('Card updated', 4000);
                    }, 4000);
                }).
                catch(function(){
                    $('#secure-storage-modal').get(0).hide(); // hide loader
                    ons.notification.alert({title: "Update Error",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (err.message || "") + ' Sorry, this card could not be updated. ' +
                        '<br>You can try again' + '</span>',
                        cancelable: true
                    });
                });
            }
            else { // this is a CREATE/ADD OPERATION

                var newCardData = {
                    cardUniqueId: "" + utopiasoftware.saveup.model.deviceUUID + Date.now(),
                    cardHolderName: $('#add-card-form #add-card-card-holder').val(),
                    cardNickName: $('#add-card-form #add-card-alias').val(),
                    cardNumber: $('#add-card-form #add-card-card-number').val(),
                    cvv: $('#add-card-form #add-card-cvv').val(),
                    cardExpiryMonth: $('#add-card-form #add-card-expiry-month').val(),
                    cardExpiryYear: $('#add-card-form #add-card-expiry-year').val(),
                    cardBrand: utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand,
                    cardLocale: utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale,
                    cardImage: utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage
                };

                // get the previous stored cards on the user's device
                Promise.resolve(intel.security.secureStorage.read({'id':'postcash-user-cards'})).
                then(function(instanceId){
                    return Promise.resolve(intel.security.secureData.getData(instanceId));
                }, function(errObject){
                    if(errObject.code == 1){ // the secure card storage has not been created before
                        return '[]'; // return an empty card data array
                    }
                    else{ // another error occurred (which is considered severe)
                        throw errObject;
                    }
                }).
                then(function(secureCardDataArray){
                    secureCardDataArray = JSON.parse(secureCardDataArray); // convert the string data to an object
                    secureCardDataArray.unshift(newCardData); // add the card to the beginning of the array collection
                    // store the updated card collection securely on user's device
                    return intel.security.secureData.createFromData({'data': JSON.stringify(secureCardDataArray)});
                }).
                then(function(instanceId){
                    return intel.security.secureStorage.write({'id':'postcash-user-cards', 'instanceID': instanceId });
                }).
                then(function(){
                    // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                    window.setTimeout(function(){
                        // reset the form validator object on the page
                        utopiasoftware.saveup.controller.addCardPageViewModel.formValidator.reset();
                        // reset the form object
                        $('#add-card-page #add-card-form').get(0).reset();
                        // reset the card number validation check and all its related actions
                        utopiasoftware.saveup.controller.addCardPageViewModel.
                        isCardNumberValidated($('#add-card-page #add-card-verify-card'));
                        // reset the new card brand, card general locale & card image
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
                        utopiasoftware.saveup.controller.addCardPageViewModel.newCardImage = "";
                        // hide the card image row
                        $('#add-card-page #add-card-image-container').css("display", "none");
                        // reset the page scroll position to the top
                        $('#add-card-page .page__content').scrollTop(0);

                        $('#secure-storage-modal').get(0).hide(); // hide loader
                        // inform user that add has been successfully added to secure storage
                        Materialize.toast('New card added', 4000);
                    }, 4000);
                }).
                catch(function(err){

                    $('#secure-storage-modal').get(0).hide(); // hide loader
                    ons.notification.alert({title: "Save Error",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (err.message || "") + ' Sorry, this card could not be added. ' +
                        '<br>You can try again' + '</span>',
                        cancelable: true
                    });
                });

            }

        },


        /**
         * method is used to check if user has asked for card number to be validated.
         * It sets or remove the appropriate attributes need to activate or deactivate
         * remote card validation
         */
        isCardNumberValidated: function(checkElem){
            // check if user wants card number validated or not
            if($(checkElem).is(":checked")){ // user wants the card number remotely validated
                // add the necessary attributes to the card number input in order to enable remote card number validation
                $('#add-card-card-number').attr("data-parsley-remote-validator", "financialcardcheck");
                // display the notice that an internet connection is required for verification
                $('#add-card-verify-card-notice').css("display", "block");
            }
            else{ // user does not want card number remotely validated
                // remove attributes to prevent remote card number validation
                $('#add-card-card-number').removeAttr("data-parsley-remote-validator");
                // hide the notice that an internet connection is required for verification
                $('#add-card-verify-card-notice').css("display", "none");
            }
        },

        /**
         * method is used to listen for scroll event of the page content
         *
         * @param event
         */
        pageContentScrolled: function(event){

            // set the current scrolltop position
            utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition = $(this).scrollTop();

            if(utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition >
                utopiasoftware.saveup.controller.addCardPageViewModel.previousScrollPosition){ // user scrolled up
                // set the current position as previous position
                utopiasoftware.saveup.controller.addCardPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is <= height of page toolbar
                if((140 - utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition) <= 56){
                    // the header image left after scrolling is <= height of page toolbar
                    // check if the toolbar for the page has already been made opaque
                    if(this.isToolBarOpaque != true){ // toolbar has not been made opaque

                        $('#add-card-page ons-toolbar').removeClass("toolbar--transparent"); // make the toolbar opaque
                        // also pin the help header on the page just below the toolbar
                        $('#add-card-page ons-list-header').css(
                            {"display": "block", "position": "fixed", "top": "56px", "width": "100%"});
                        this.isToolBarOpaque = true; // flag that toolbar has been made opaque
                    }
                }

                return;
            }

            if(utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition <
                utopiasoftware.saveup.controller.addCardPageViewModel.previousScrollPosition){ // user scrolled down
                // set the current position as previous position
                utopiasoftware.saveup.controller.addCardPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is > height of page toolbar
                if((140 - utopiasoftware.saveup.controller.addCardPageViewModel.currentScrollPosition) > 56){
                    // the header image left after scrolling is > height of page toolbar
                    // check if the toolbar for the page has already been made transparent
                    if(this.isToolBarOpaque == true){ // toolbar has NOT been made transparent

                        $('#add-card-page ons-toolbar').addClass("toolbar--transparent"); // make the toolbar transparent
                        // also unpin the help header on the page from just below the toolbar
                        $('#add-card-page ons-list-header').css({"display": "block", "position": "static", "top": "56px"});
                        this.isToolBarOpaque = false; // flag that toolbar has been made transparent
                    }
                }

                return;
            }
        },

        /**
         * custom parsley validator for financial cards (including visa, master, verve)
         *
         * @param jqxhr {jqueryXhr}
         */
        financialCardValidator: function(jqxhr){
            var serverResponse = ""; // holds the server response

            // check the validator response
            if(jqxhr.status != 200){ // request was NOT success
                // set new card brand as unknown
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
                // set the new card locale as unknown
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
                return false;
            }

            // convert the server response to json
            serverResponse = JSON.parse(jqxhr.responseText.trim());

            if(serverResponse.status != true){ // the server api response was NOT successful
                // set new card brand as unknown
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
                // set the new card locale as unknown
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
                return false;
            }

            if(serverResponse.data.brand == "" || serverResponse.data.brand == "Unknown"){ // card could not be identified
                // set new card brand as unknown
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Unknown";
                // set the new card locale as unknown
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "Unknown";
                return false;
            }

            // get the brand of the new card
            if(serverResponse.data.brand.toLocaleUpperCase().indexOf("MASTER") >= 0){ // brand is a Mastercard
                // set new card brand as mastercard
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Mastercard";
            }
            if(serverResponse.data.brand.toLocaleUpperCase().indexOf("VISA") >= 0){ // brand is a Visa
                // set new card brand as visa
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Visa";
            }
            if(serverResponse.data.brand.toLocaleUpperCase().indexOf("VERVE") >= 0){ // brand is a Verve
                // set new card brand as verve
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardBrand = "Verve";
            }

            // get the general locale of the new card
            if(serverResponse.data.country_name.indexOf("Nigeria") >= 0){ // card is local
                // set the new card locale
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "local";

            }
            if(serverResponse.data.country_name.indexOf("Nigeria") < 0){ // card is international
                // set the new card locale
                utopiasoftware.saveup.controller.addCardPageViewModel.newCardLocale = "international";

            }

            return true; // validation successful
        }

    },

    /**
     * object is view-model for my-accounts-page page
     */
    myAccountsPageViewModel: {


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                };

                // register listener for the pull-to-refresh widget
                $('#my-accounts-pull-hook', $thisPage).on("changestate", function(event){

                    // check the state of the pull-to-refresh widget
                    switch (event.originalEvent.state){
                        case 'initial':
                            // update the displayed icon
                            $('#my-accounts-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-down" size="24px"></ons-icon>');
                            break;

                        case 'preaction':

                            $('#my-accounts-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-up" size="24px"></ons-icon>');
                            break;

                        case 'action':
                            $('#my-accounts-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-repeat" size="24px" spin></ons-icon>');
                            break;
                    }
                });

                // add method to handle the loading action of the pull-to-refresh widget
                $('#my-accounts-pull-hook', $thisPage).get(0).onAction = function(loadingDone){
                    // disable pull-to-refresh widget till loading is done
                    $('#my-accounts-pull-hook', $thisPage).attr("disabled", true);

                    // load the user's bank account data from the device secure store
                    utopiasoftware.saveup.bankAccountOperations.loadMyAccountsData().
                    then(function(banksAcctsArray){ // the user's bank acct array collection has been returned
                        if(banksAcctsArray.length == 0){ // there are no bank account data available
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                            // display a message to inform user that there are no cards available
                            $('#my-accounts-page-message', $thisPage).css("display", "block");
                            // hide the error message from displaying
                            $('#my-accounts-page-error', $thisPage).css("display", "none");
                            // hide the my-accounts-list from display
                            $('#my-accounts-list', $thisPage).css("display", "none");
                            // enable the 'Add Account' button
                            $('#my-accounts-add-account-button', $thisPage).removeAttr("disabled");
                            // flag that loading is done
                            loadingDone();
                        }
                        else{ // there are card data available
                            // empty the contents of the my accounts list
                            $('#my-accounts-list', $thisPage).html("");

                            for(let index = 0; index < banksAcctsArray.length; index++){ // append the stored bank accounts to the "My Accounts" list
                                // create the bank account content
                                let bankAcctContent = `<div class="row"><div class="col s12"><div class="card horizontal">
                                <div class="card-image" style="padding: 3%;">
                                <img src="${banksAcctsArray[index].bankAccountAvatar}">
                                </div>
                                <div class="card-stacked">
                                <div class="card-content" style="padding-bottom: 0;">
                                <div style="font-weight: bold; font-size: 0.75em; font-style: italic; color: #464646;
                                padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountName}</div>
                                </div><div class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountNumber}</div>
                                <div  class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankName}</div>
                                <div class="card-action" style="padding: 0;">
                                <div style="display: inline-block; margin-left: auto; margin-right: auto">
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}"
                                data-acct-object='${JSON.stringify({senderAccountName: banksAcctsArray[index].bankAccountName, senderAccount: banksAcctsArray[index].bankAccountNumber,senderBankCode:banksAcctsArray[index].flutterwave_bankCode})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet"
                                disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.editAccountButtonClicked(this);">
                                   <ons-icon icon="md-edit" size="25px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.deleteAccountButtonClicked(this);">
                                <ons-icon icon="md-delete" size="25px"></ons-icon>
                                </ons-button>
                                </div></div></div></div></div></div>` ;
                                // append the bank account content to the "My Accounts" list
                                $('#my-accounts-list', $thisPage).append(bankAcctContent);
                            }
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                            // hide message to inform user that there are no accounts available
                            $('#my-accounts-page-message', $thisPage).css("display", "none");
                            // hide the error message from displaying
                            $('#my-accounts-page-error', $thisPage).css("display", "none");
                            // display the my-accounts-list
                            $('#my-accounts-list', $thisPage).css("display", "block");
                            // enable the 'Add Account' button
                            $('#my-accounts-add-account-button', $thisPage).removeAttr("disabled");
                            // flag that loading is done
                            loadingDone();
                        }
                    }).
                    catch(function(){ // an error occurred, so display the error message to the user
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                        // hide a message to inform user that there are no accounts available
                        $('#my-accounts-page-message', $thisPage).css("display", "none");
                        // display the error message to user
                        $('#my-accounts-page-error', $thisPage).css("display", "block");
                        // hide the my-accounts-list from display
                        $('#my-accounts-list', $thisPage).css("display", "none");
                        // disable the 'Add Account' button
                        $('#my-accounts-add-account-button', $thisPage).attr("disabled", true);
                        // flag that loading is done
                        loadingDone();
                    });
                };

                // load the user's bank account data from the device secure store
                utopiasoftware.saveup.bankAccountOperations.loadMyAccountsData().
                then(function(banksAcctsArray){ // the user's bank acct array collection has been returned
                    if(banksAcctsArray.length == 0){ // there are no bank account data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no cards available
                        $('#my-accounts-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#my-accounts-page-error', $thisPage).css("display", "none");
                        // hide the my-accounts-list from display
                        $('#my-accounts-list', $thisPage).css("display", "none");
                        // enable the 'Add Account' button
                        $('#my-accounts-add-account-button', $thisPage).removeAttr("disabled");
                    }
                    else{ // there are card data available
                        // empty the contents of the my accounts list
                        $('#my-accounts-list', $thisPage).html("");

                        for(let index = 0; index < banksAcctsArray.length; index++){ // append the stored bank accounts to the "My Accounts" list
                            // create the bank account content
                            let bankAcctContent = `<div class="row"><div class="col s12"><div class="card horizontal">
                                <div class="card-image" style="padding: 3%;">
                                <img src="${banksAcctsArray[index].bankAccountAvatar}">
                                </div>
                                <div class="card-stacked">
                                <div class="card-content" style="padding-bottom: 0;">
                                <div style="font-weight: bold; font-size: 0.75em; font-style: italic; color: #464646;
                                padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountName}</div>
                                </div><div class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountNumber}</div>
                                <div  class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankName}</div>
                                <div class="card-action" style="padding: 0;">
                                <div style="display: inline-block; margin-left: auto; margin-right: auto">
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}"
                                data-acct-object='${JSON.stringify({senderAccountName: banksAcctsArray[index].bankAccountName, senderAccount: banksAcctsArray[index].bankAccountNumber,senderBankCode:banksAcctsArray[index].flutterwave_bankCode})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet"
                                disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.editAccountButtonClicked(this);">
                                   <ons-icon icon="md-edit" size="25px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.deleteAccountButtonClicked(this);">
                                <ons-icon icon="md-delete" size="25px"></ons-icon>
                                </ons-button>
                                </div></div></div></div></div></div>` ;
                            // append the bank account content to the "My Accounts" list
                            $('#my-accounts-list', $thisPage).append(bankAcctContent);
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no accounts available
                        $('#my-accounts-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#my-accounts-page-error', $thisPage).css("display", "none");
                        // display the my-accounts-list
                        $('#my-accounts-list', $thisPage).css("display", "block");
                        // enable the 'Add Account' button
                        $('#my-accounts-add-account-button', $thisPage).removeAttr("disabled");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no accounts available
                    $('#my-accounts-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#my-accounts-page-error', $thisPage).css("display", "block");
                    // hide the my-accounts-list from display
                    $('#my-accounts-list', $thisPage).css("display", "none");
                    // disable the 'Add Account' button
                    $('#my-accounts-add-account-button', $thisPage).attr("disabled", true);
                });

                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },


        /**
         * method is triggered when page is shown
         *
         * @param event
         */
        pageShow: function(event){
            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // check if the data on the page should be refreshed
            if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.refresh
                && $('#app-main-navigator').get(0).topPage.data.refresh === true){ // user wants this page refreshed
                // add & display the preloader for the page
                $('#my-accounts-pull-hook', $thisPage).after('<div class="progress"><div class="indeterminate"></div> </div>');

                // load the user's bank account data from the device secure store
                utopiasoftware.saveup.bankAccountOperations.loadMyAccountsData().
                then(function(banksAcctsArray){ // the user's bank acct array collection has been returned
                    if(banksAcctsArray.length == 0){ // there are no bank account data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no cards available
                        $('#my-accounts-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#my-accounts-page-error', $thisPage).css("display", "none");
                        // hide the my-accounts-list from display
                        $('#my-accounts-list', $thisPage).css("display", "none");
                        // enable the 'Add Account' button
                        $('#my-accounts-add-account-button', $thisPage).removeAttr("disabled");
                    }
                    else{ // there are card data available
                        // empty the contents of the my accounts list
                        $('#my-accounts-list', $thisPage).html("");

                        for(let index = 0; index < banksAcctsArray.length; index++){ // append the stored bank accounts to the "My Accounts" list
                            // create the bank account content
                            let bankAcctContent = `<div class="row"><div class="col s12"><div class="card horizontal">
                                <div class="card-image" style="padding: 3%;">
                                <img src="${banksAcctsArray[index].bankAccountAvatar}">
                                </div>
                                <div class="card-stacked">
                                <div class="card-content" style="padding-bottom: 0;">
                                <div style="font-weight: bold; font-size: 0.75em; font-style: italic; color: #464646;
                                padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountName}</div>
                                </div><div class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountNumber}</div>
                                <div  class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankName}</div>
                                <div class="card-action" style="padding: 0;">
                                <div style="display: inline-block; margin-left: auto; margin-right: auto">
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}"
                                data-acct-object='${JSON.stringify({senderAccountName: banksAcctsArray[index].bankAccountName, senderAccount: banksAcctsArray[index].bankAccountNumber,senderBankCode:banksAcctsArray[index].flutterwave_bankCode})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet"
                                disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.editAccountButtonClicked(this);">
                                   <ons-icon icon="md-edit" size="25px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.myAccountsPageViewModel.deleteAccountButtonClicked(this);">
                                <ons-icon icon="md-delete" size="25px"></ons-icon>
                                </ons-button>
                                </div></div></div></div></div></div>` ;
                            // append the bank account content to the "My Accounts" list
                            $('#my-accounts-list', $thisPage).append(bankAcctContent);
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no accounts available
                        $('#my-accounts-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#my-accounts-page-error', $thisPage).css("display", "none");
                        // display the my-accounts-list
                        $('#my-accounts-list', $thisPage).css("display", "block");
                        // enable the 'Add Account' button
                        $('#my-accounts-add-account-button', $thisPage).removeAttr("disabled");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#my-accounts-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#my-accounts-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no accounts available
                    $('#my-accounts-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#my-accounts-page-error', $thisPage).css("display", "block");
                    // hide the my-accounts-list from display
                    $('#my-accounts-list', $thisPage).css("display", "none");
                    // disable the 'Add Account' button
                    $('#my-accounts-add-account-button', $thisPage).attr("disabled", true);
                });
            }

        },


        /**
         * method is triggered when the 'Add Account' button is clicked
         */
        addAccountButtonClicked: function(){
            $('#app-main-navigator').get(0).pushPage("add-account-page.html", {
                animation: "lift-md"
            });
        },


        /**
         * method is used to trigger the delete operation of a user's bank account
         * and updating the user-interface (UI)
         *
         * @param buttonElem
         */
        deleteAccountButtonClicked: function(buttonElem){

            // confirm that user wants to delete the account before proceeding
            ons.notification.confirm('Do you want to delete this bank account?', {title: 'Confirm Delete',
                    buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                .then(function(index) {
                    if (index === 1) { // YES button clicked
                        // call the utility method used to delete a specified bank account
                        utopiasoftware.saveup.bankAccountOperations.deleteMyAccount($(buttonElem).attr("data-id")).
                        then(function(){ // account has been deleted
                            $(buttonElem).closest('.row').remove(); // remove the account from display
                            // inform the user that card was deleted
                            Materialize.toast('Bank Account deleted', 3000);
                        }).
                        catch(function(){
                            // inform the user that the specified bank account could not be deleted
                            window.plugins.toast.showWithOptions({
                                message: "Sorry, the bank account could not be deleted.\n Try again",
                                duration: 4000,
                                position: "top",
                                styling: {
                                    opacity: 1,
                                    backgroundColor: '#ff0000', //red
                                    textColor: '#FFFFFF',
                                    textSize: 14
                                }
                            }, function(toastEvent){
                                if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                                    window.plugins.toast.hide();
                                }
                            });
                        });
                    }
                });
        },


        /**
         * method is used to trigger the edit operation of a user's bank account
         * and updating/changing the user-interface (UI)
         *
         * @param buttonElem
         */
        editAccountButtonClicked: function(buttonElem){
            $('#app-main-navigator').get(0).pushPage("add-account-page.html", {
                animation: "lift-md", data: {edit: $(buttonElem).attr("data-id")}
            });
        },

        /**
         * method is used to trigger the transfer cash operation. It uses the
         * selected user's 'My Account' object as the sender account for the initiated
         * cash transfer
         *
         * @param buttonElem
         */
        transferCashButtonClicked: function(buttonElem){

            // ask user for secure PIN before proceeding. secure pin MUST match
            ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                'Please enter your PostCash Secure PIN to proceed</span></div>',
                cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                submitOnEnter: true
            }).
            then(function(userInput){ // user has provided a secured PIN , now authenticate it
                if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                    // close the 'verify account' the bottom sheets
                    $('#verify-account-bottom-sheet').modal('close');
                    $('#transfer-cash-page').remove(); // remove previous transfer cash pages
                    // call the transfer-cash=page and pass the 'my account' details contained in the data attribute as sender details data
                    $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {
                        data: {
                            sender_details: JSON.parse($(buttonElem).attr("data-acct-object"))}
                    }); // navigate to the specified page
                }
                else{ // inform user that security check failed/user authentication failed
                    ons.notification.alert({title: "Security Check",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                        cancelable: true
                    });
                }
            }).
            catch(function(){});

            return;
        }

    },


    /**
     * object is view-model for add-account page
     */
    addAccountPageViewModel: {

        /**
         * used to hold the parsley form validation object for the page
         */
        formValidator: null,

        /**
         * property used to keep track of the immediate last scroll position of the
         * page content
         */
        previousScrollPosition: 0,

        /**
         * property used to keep track of the current scroll position of the
         * page content
         */
        currentScrollPosition: 0,

        /**
         * property stores the name of the bank account being added.
         * Default value is an empty string
         */
        bankAccountName: "",

        /**
         * property holds the image to be used for the bank account
         */
        bankAccountImage: "",

        /**
         * property holds the randomly generated number used to generate
         * bank account avatar images
         */
        bankAccountImageRandomNum: null,

        /**
         * property holds authorisation token used for
         * verifying bank account number
         */
        tokenData: "",

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable", true);

            // reset the previous & current scroll positions of the page contents
            utopiasoftware.saveup.controller.addAccountPageViewModel.previousScrollPosition = 0;
            utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition = 0;

            // reset the bank account properties
            utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountName = "";
            utopiasoftware.saveup.controller.addAccountPageViewModel.tokenData = "";
            utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImage = "";

            // generate the random number used to display the bank account image/avatar
            var randomGen = new Random(Random.engines.nativeMath); // random number generator
            // generate the random number
            utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImageRandomNum = randomGen.integer(1, 6);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }


                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).popPage();
                };

                // listen for the scroll event of the page content
                $('#add-account-page .page__content').on("scroll", utopiasoftware.saveup.controller.addAccountPageViewModel.pageContentScrolled);

                // initialise the form validation
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator = $('#add-account-form').parsley();

                // attach listener for the 'save' button click
                $('#add-account-save-button').get(0).onclick = function(){
                    // check if the user requested for remote account number validation
                    if($('#add-account-verify-account').is(":checked")){ //user asked for remote validation
                        // display loader message to the user
                        $('#loader-modal #loader-modal-message').html("Preparing Device Storage...");
                        $('#loader-modal').get(0).show();
                        // request for gateway authorization token used in account number validation
                        utopiasoftware.saveup.moneyWaveObject.useToken.
                        then(function(tokenData){
                            // set the token data used for verifying the bank account number
                            utopiasoftware.saveup.controller.addAccountPageViewModel.tokenData = tokenData;
                            // hide loader message
                            $('#loader-modal').get(0).hide();
                            // run the validation method for the create account form
                            utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.whenValidate();
                        }).
                        catch(function(){
                            // clear the token data used for verifying the bank account number
                            utopiasoftware.saveup.controller.addAccountPageViewModel.tokenData = "";
                            // hide loader message
                            $('#loader-modal').get(0).hide();
                            // run the validation method for the create account form
                            utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.whenValidate();
                        });
                    }
                    else{ // user did not ask for remote account number validation
                        // run the validation method for the create account form
                        utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.whenValidate();
                    }
                };

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.on('field:ajaxoptions',
                    function(fieldInstance, ajaxOptions){
                        // edit the ajax options object to include the necessary authorization header
                        ajaxOptions.headers = {"Authorization":utopiasoftware.saveup.controller.addAccountPageViewModel.tokenData};
                        ajaxOptions.data = JSON.stringify({
                            account_number: $('#add-account-form #add-account-number').val(),
                            bank_code: $('#add-account-form #add-account-choose-bank').val()
                        });

                        // display the loading icon for account number validation
                        $('#add-account-number-validation-loading', $thisPage).css("display", "block");
                    });

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                    // check if the element that triggered that validation error was the account number input
                    if($(fieldInstance.$element).is('#add-account-number')){ // it is the account number input
                        // hide the loading icon
                        $('#add-account-number-validation-loading', $thisPage).css("display", "none");

                        // check if the user requested for remote account number validation
                        if($('#add-account-verify-account').is(":checked")){ //user asked for remote validation
                            // empty the content of the account name input (based on remote validation result)
                            $('#add-account-page #add-account-account-name').val("");
                        }
                        else{ // user did not ask for remote account number validation
                        }
                    }
                });

                // listen for form field validation success event
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                    // check if the element that triggered that validation success was the account number input
                    if($(fieldInstance.$element).is('#add-account-number')){ // it is the account number input
                        // hide the loading icon
                        $('#add-account-number-validation-loading', $thisPage).css("display", "none");
                        // check if the user requested for remote account number validation
                        if($('#add-account-verify-account').is(":checked")){ //user asked for remote validation
                            // display the account name to the user (based on remote validation result)
                            $('#add-account-page #add-account-account-name').val(utopiasoftware.saveup.controller.
                                addAccountPageViewModel.bankAccountName);
                            // update the display of text fields
                            Materialize.updateTextFields();
                        }
                        else{ // user did not ask for remote account number validation
                        }
                    }
                });

                // listen for form validation success
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.addAccountPageViewModel.addAccountFormValidated);

                /** dynamically create the contents of the various select elements **/
                    // retrieve the sorted array of banks
                Promise.resolve(utopiasoftware.saveup.sortBanksData()).
                then(function(bankArrayData){
                    var optionTags = ""; // string to hold all created option tags

                    // get each object in bank array and use it to create the select element
                    for(var index = 0; index < bankArrayData.length; index++){
                        var bankObject = bankArrayData[index]; // get the bank object
                        // update the banks select element option tags
                        for(var prop in bankObject){
                            optionTags += '<option value="' + prop + '">' + bankObject[prop] + '</option>';
                        }
                    }

                    $('#add-account-choose-bank', $thisPage).append(optionTags); // append all the created option tags
                    // initialise the select element
                    $('#add-account-choose-bank', $thisPage).material_select();
                    return; // return at this point, so the page can continue initialisation
                }).
                then(function(){

                    // initialise the character counter plugin
                    $('#add-account-number', $thisPage).characterCounter();
                    return;
                }).
                then(function(){
                    // check if the page was sent a bank account id.
                    // if so preload the bank account data into the form
                    if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.edit){
                        // get the details of the card to be edited
                        utopiasoftware.saveup.bankAccountOperations.
                        getMyAccount($('#app-main-navigator').get(0).topPage.data.edit).then(function(bankAcct){
                            $('#add-account-page #add-account-unique-id').val(bankAcct.uniqueAccountId);
                            $('#add-account-page #add-account-number').val(bankAcct.bankAccountNumber);
                            $('#add-account-page #add-account-account-name').val(bankAcct.bankAccountName);
                            $('#add-account-page #add-account-choose-bank').val(bankAcct.flutterwave_bankCode);
                            $('#add-account-page #hidden-choose-bank-input').val(bankAcct.flutterwave_bankCode);

                            // re-update the form input fields
                            Materialize.updateTextFields();
                            //re-initialise the form select elements
                            $('select', $thisPage).material_select();

                            // remove the progress indeterminate loader
                            $('.progress', $thisPage).remove();
                            // make the add account form visible
                            $('#add-account-form', $thisPage).css("display", "block");
                            // enable the 'Cancel' & 'Save' buttons
                            $('#add-account-cancel-button, #add-account-save-button', $thisPage).removeAttr("disabled");
                            // hide the loader
                            $('#loader-modal').get(0).hide();
                        });
                    }
                    else {
                        // remove the progress indeterminate loader
                        $('.progress', $thisPage).remove();
                        // make the add account form visible
                        $('#add-account-form', $thisPage).css("display", "block");
                        // enable the 'Cancel' & 'Save' buttons
                        $('#add-account-cancel-button, #add-account-save-button', $thisPage).removeAttr("disabled");
                        // hide the loader
                        $('#loader-modal').get(0).hide();
                    }
                }).
                catch();


            }

        },

        /**
         * method is triggered when the page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms on the page
                $('#add-account-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#add-account-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object on the page
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms on the page
                $('#add-account-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#add-account-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.destroy();
                // destroy the form inputs which need to be destroyed
                $('#add-account-page select').material_select('destroy');
                $('#add-account-page #add-account-number').off();
                $('#add-account-page #add-account-number').removeData();
            }
            catch(err){}
        },

        /**
         * method is triggered when add card form is successfully validated
         */
        addAccountFormValidated: function(){

            // display the secure storage modal to indicate that Bank Account is being securely stored
            $('#secure-storage-modal .modal-message').html("Storing Bank Account on Device...");
            $('#secure-storage-modal').get(0).show(); // show loader

            // update the bank account image/avatar property
            utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImage = "css/app-images/avatar-" +
                utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImageRandomNum + ".png";

            // check if this is an EDIT or CREATE operation
            if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.edit){ //this is an EDIT operation
                // call the utility method used to delete a specified bank account
                utopiasoftware.saveup.bankAccountOperations.
                deleteMyAccount($('#app-main-navigator').get(0).topPage.data.edit).
                then(function(){
                    // create an edited bank account data
                    var editedBankAcctData = {
                        uniqueAccountId: $('#app-main-navigator').get(0).topPage.data.edit,
                        bankAccountNumber: $('#add-account-form #add-account-number').val(),
                        bankAccountName: $('#add-account-form #add-account-account-name').val(),
                        bankName: $('#add-account-form #add-account-choose-bank option:selected').text().trim(),
                        flutterwave_bankCode: $('#add-account-form #add-account-choose-bank').val(),
                        bankAccountAvatar: utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImage
                    };

                    // call the utility method used to add a specified bank account to the bank account collection
                    return utopiasoftware.saveup.bankAccountOperations.
                    addMyAccount(editedBankAcctData);
                }).
                then(function(){
                    // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                    window.setTimeout(function(){
                        // reset the form validator object on the page
                        utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.reset();
                        // reset the form object
                        $('#add-account-page #add-account-form').get(0).reset();
                        $('#add-account-page select').material_select();
                        // reset the account number validation check and all its related actions
                        utopiasoftware.saveup.controller.addAccountPageViewModel.
                        isbankAccountNumberValidated($('#add-account-page #add-account-verify-account'));
                        // reset the bank account properties
                        utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountName = "";
                        utopiasoftware.saveup.controller.addAccountPageViewModel.tokenData = "";
                        utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImage = "";
                        // reset the page scroll position to the top
                        $('#add-account-page .page__content').scrollTop(0);

                        $('#secure-storage-modal').get(0).hide(); // hide loader
                        // inform user that acct has been successfully added to secure storage
                        Materialize.toast('Bank Account updated', 4000);
                    }, 4000);
                }).
                catch(function(){
                    $('#secure-storage-modal').get(0).hide(); // hide loader
                    ons.notification.alert({title: "Update Error",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (err.message || "") + ' Sorry, this bank account could not be updated. ' +
                        '<br>You can try again' + '</span>',
                        cancelable: true
                    });
                });
            }
            else { // this is a CREATE/ADD OPERATION

                var newBankAcctData = {
                    uniqueAccountId: "" + utopiasoftware.saveup.model.deviceUUID + Date.now(),
                    bankAccountNumber: $('#add-account-form #add-account-number').val(),
                    bankAccountName: $('#add-account-form #add-account-account-name').val(),
                    bankName: $('#add-account-form #add-account-choose-bank option:selected').text().trim(),
                    flutterwave_bankCode: $('#add-account-form #add-account-choose-bank').val(),
                    bankAccountAvatar: utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImage
                };

                utopiasoftware.saveup.bankAccountOperations.
                addMyAccount(newBankAcctData).
                then(function(){
                    // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                    window.setTimeout(function(){
                        // reset the form validator object on the page
                        utopiasoftware.saveup.controller.addAccountPageViewModel.formValidator.reset();
                        // reset the form object
                        $('#add-account-page #add-account-form').get(0).reset();
                        $('#add-account-page select').material_select();
                        // reset the account number validation check and all its related actions
                        utopiasoftware.saveup.controller.addAccountPageViewModel.
                        isbankAccountNumberValidated($('#add-account-page #add-account-verify-account'));
                        // reset the bank account properties
                        utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountName = "";
                        utopiasoftware.saveup.controller.addAccountPageViewModel.tokenData = "";
                        utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountImage = "";
                        // reset the page scroll position to the top
                        $('#add-account-page .page__content').scrollTop(0);

                        $('#secure-storage-modal').get(0).hide(); // hide loader
                        // inform user that user's bank account has been successfully added to secure storage
                        Materialize.toast('New bank account added', 4000);
                    }, 4000);
                }).
                catch(function(err){

                    $('#secure-storage-modal').get(0).hide(); // hide loader
                    ons.notification.alert({title: "Save Error",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (err.message || "") + ' Sorry, this bank account could not be added. ' +
                        '<br>You can try again' + '</span>',
                        cancelable: true
                    });
                });

            }

        },


        /**
         * method is used to check if user has asked for bank account number to be validated.
         * It sets or remove the appropriate attributes need to activate or deactivate
         * remote account validation
         */
        isbankAccountNumberValidated: function(checkElem){
            // check if user wants acct number validated or not
            if($(checkElem).is(":checked")){ // user wants the account number remotely validated
                // add the necessary attributes to the account number input in order to enable remote account number validation
                $('#add-account-number').attr("data-parsley-remote-validator", "accountnumbercheck");
                // also make the account name input disabled & wipe its previous content
                $('#add-account-account-name').attr("disabled", true);
                $('#add-account-account-name').val("");
                // remove tooltip from account name
                $("#add-account-account-name").parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $("#add-account-account-name").parent().find('label:eq(0)').removeAttr("data-hint");
                // display the notice that an internet connection is required for verification
                $('#add-account-verify-account-notice').css("display", "block");
            }
            else{ // user does not want account number remotely validated
                // remove attributes to prevent remote account number validation
                $('#add-account-number').removeAttr("data-parsley-remote-validator");
                // also make the account name input enabled & wipe its previous content
                $('#add-account-account-name').removeAttr("disabled");
                $('#add-account-account-name').val("");
                // hide the notice that an internet connection is required for verification
                $('#add-account-verify-account-notice').css("display", "none");
            }
        },

        /**
         * method is used to listen for scroll event of the page content
         *
         * @param event
         */
        pageContentScrolled: function(event){

            // set the current scrolltop position
            utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition = $(this).scrollTop();

            if(utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition >
                utopiasoftware.saveup.controller.addAccountPageViewModel.previousScrollPosition){ // user scrolled up
                // set the current position as previous position
                utopiasoftware.saveup.controller.addAccountPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is <= height of page toolbar
                if((140 - utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition) <= 56){
                    // the header image left after scrolling is <= height of page toolbar
                    // check if the toolbar for the page has already been made opaque
                    if(this.isToolBarOpaque != true){ // toolbar has not been made opaque

                        $('#add-account-page ons-toolbar').removeClass("toolbar--transparent"); // make the toolbar opaque
                        // also pin the help header on the page just below the toolbar
                        $('#add-account-page ons-list-header').css(
                            {"display": "block", "position": "fixed", "top": "56px", "width": "100%"});
                        this.isToolBarOpaque = true; // flag that toolbar has been made opaque
                    }
                }

                return;
            }

            if(utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition <
                utopiasoftware.saveup.controller.addAccountPageViewModel.previousScrollPosition){ // user scrolled down
                // set the current position as previous position
                utopiasoftware.saveup.controller.addAccountPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is > height of page toolbar
                if((140 - utopiasoftware.saveup.controller.addAccountPageViewModel.currentScrollPosition) > 56){
                    // the header image left after scrolling is > height of page toolbar
                    // check if the toolbar for the page has already been made transparent
                    if(this.isToolBarOpaque == true){ // toolbar has NOT been made transparent

                        $('#add-account-page ons-toolbar').addClass("toolbar--transparent"); // make the toolbar transparent
                        // also unpin the help header on the page from just below the toolbar
                        $('#add-account-page ons-list-header').css({"display": "block", "position": "static", "top": "56px"});
                        this.isToolBarOpaque = false; // flag that toolbar has been made transparent
                    }
                }

                return;
            }
        },


        /**
         * method is used to reset/wipe the content of the account name IF
         * remote account validation has been enabled
         */
        resetAccountNameDisplay: function(){
            if($('#add-account-page #add-account-verify-account').is(":checked")) { // user wants the account number remotely validated
                $('#add-account-page #add-account-account-name').val("");
            }
        },

        /**
         * custom parsley validator for bank account number
         *
         * @param jqxhr {jqueryXhr}
         */
        accountNumberValidator: function(jqxhr){
            var serverResponse = ""; // holds the server response

            // check the validator response
            if(jqxhr.status != 200){ // request was NOT success
                return false;
            }

            // convert the server response to json
            serverResponse = JSON.parse(jqxhr.responseText.trim());

            if(serverResponse.status != "success"){ // the server api response was NOT successful

                return false;
            }
            else { // the server api response was successful
                // set the bank account name
                utopiasoftware.saveup.controller.addAccountPageViewModel.bankAccountName = serverResponse.data.account_name;
                return true; // validation successful
            }

        }

    },


    /**
     * object is view-model for saved-recipients page page
     */
    savedRecipientsPageViewModel: {


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                };

                // register listener for the pull-to-refresh widget
                $('#saved-recipients-pull-hook', $thisPage).on("changestate", function(event){

                    // check the state of the pull-to-refresh widget
                    switch (event.originalEvent.state){
                        case 'initial':
                            // update the displayed icon
                            $('#saved-recipients-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-down" size="24px"></ons-icon>');
                            break;

                        case 'preaction':

                            $('#saved-recipients-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-up" size="24px"></ons-icon>');
                            break;

                        case 'action':
                            $('#saved-recipients-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-repeat" size="24px" spin></ons-icon>');
                            break;
                    }
                });

                // add method to handle the loading action of the pull-to-refresh widget
                $('#saved-recipients-pull-hook', $thisPage).get(0).onAction = function(loadingDone){
                    // disable pull-to-refresh widget till loading is done
                    $('#saved-recipients-pull-hook', $thisPage).attr("disabled", true);

                    // load the saved recipients account data from the device secure store
                    utopiasoftware.saveup.savedRecipientsBankAccountOperations.loadSavedRecipientsAccountsData().
                    then(function(banksAcctsArray){ // the bank acct array collection has been returned
                        if(banksAcctsArray.length == 0){ // there are no bank account data available
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                            // display a message to inform user that there are no accounts available
                            $('#saved-recipients-page-message', $thisPage).css("display", "block");
                            // hide the error message from displaying
                            $('#saved-recipients-page-error', $thisPage).css("display", "none");
                            // hide the my-accounts-list from display
                            $('#saved-recipients-list', $thisPage).css("display", "none");
                            // enable the 'Add Recipient' button
                            $('#saved-recipients-add-recipient-button', $thisPage).removeAttr("disabled");
                            // flag that loading is done
                            loadingDone();
                        }
                        else{ // there are card data available
                            // empty the contents of the saved recipients list
                            $('#saved-recipients-list', $thisPage).html("");

                            for(let index = 0; index < banksAcctsArray.length; index++){ // append the stored bank accounts to the "Saved Recipients" list
                                // create the bank account content
                                let bankAcctContent = `<div class="row"><div class="col s12"><div class="card horizontal">
                                <div class="card-image" style="padding: 3%;">
                                <img src="${banksAcctsArray[index].bankAccountAvatar}">
                                </div>
                                <div class="card-stacked">
                                <div class="card-content" style="padding-bottom: 0;">
                                <div style="font-weight: bold; font-size: 0.75em; font-style: italic; color: #464646;
                                padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountName}</div>
                                </div><div class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountNumber}</div>
                                <div  class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankName}</div>
                                <div class="card-action" style="padding: 0;">
                                <div style="display: inline-block; margin-left: auto; margin-right: auto">
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}"
                                data-acct-object='${JSON.stringify({recipientAccountName: banksAcctsArray[index].bankAccountName, recipientAccount: banksAcctsArray[index].bankAccountNumber,recipientBankCode:banksAcctsArray[index].flutterwave_bankCode})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet"
                                disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.editRecipientButtonClicked(this);">
                                   <ons-icon icon="md-edit" size="25px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.deleteRecipientButtonClicked(this);">
                                <ons-icon icon="md-delete" size="25px"></ons-icon>
                                </ons-button>
                                </div></div></div></div></div></div>` ;
                                // append the bank account content to the "saved recipients" list
                                $('#saved-recipients-list', $thisPage).append(bankAcctContent);
                            }
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                            // hide message to inform user that there are no accounts available
                            $('#saved-recipients-page-message', $thisPage).css("display", "none");
                            // hide the error message from displaying
                            $('#saved-recipients-page-error', $thisPage).css("display", "none");
                            // display the saved-recipients-list
                            $('#saved-recipients-list', $thisPage).css("display", "block");
                            // enable the 'Add Recipient' button
                            $('#saved-recipients-add-recipient-button', $thisPage).removeAttr("disabled");
                            // flag that loading is done
                            loadingDone();
                        }
                    }).
                    catch(function(){ // an error occurred, so display the error message to the user
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                        // hide a message to inform user that there are no accounts available
                        $('#saved-recipients-page-message', $thisPage).css("display", "none");
                        // display the error message to user
                        $('#saved-recipients-page-error', $thisPage).css("display", "block");
                        // hide the my-accounts-list from display
                        $('#saved-recipients-list', $thisPage).css("display", "none");
                        // disable the 'Add Recipient' button
                        $('#saved-recipients-add-recipient-button', $thisPage).attr("disabled", true);
                        // flag that loading is done
                        loadingDone();
                    });
                };

                // load the saved recipients account data from the device secure store
                utopiasoftware.saveup.savedRecipientsBankAccountOperations.loadSavedRecipientsAccountsData().
                then(function(banksAcctsArray){ // the bank acct array collection has been returned
                    if(banksAcctsArray.length == 0){ // there are no bank account data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no accounts available
                        $('#saved-recipients-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#saved-recipients-page-error', $thisPage).css("display", "none");
                        // hide the my-accounts-list from display
                        $('#saved-recipients-list', $thisPage).css("display", "none");
                        // enable the 'Add Recipient' button
                        $('#saved-recipients-add-recipient-button', $thisPage).removeAttr("disabled");
                    }
                    else{ // there are card data available
                        // empty the contents of the saved recipients list
                        $('#saved-recipients-list', $thisPage).html("");

                        for(let index = 0; index < banksAcctsArray.length; index++){ // append the stored bank accounts to the "Saved Recipients" list
                            // create the bank account content
                            let bankAcctContent = `<div class="row"><div class="col s12"><div class="card horizontal">
                                <div class="card-image" style="padding: 3%;">
                                <img src="${banksAcctsArray[index].bankAccountAvatar}">
                                </div>
                                <div class="card-stacked">
                                <div class="card-content" style="padding-bottom: 0;">
                                <div style="font-weight: bold; font-size: 0.75em; font-style: italic; color: #464646;
                                padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountName}</div>
                                </div><div class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountNumber}</div>
                                <div  class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankName}</div>
                                <div class="card-action" style="padding: 0;">
                                <div style="display: inline-block; margin-left: auto; margin-right: auto">
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}"
                                data-acct-object='${JSON.stringify({recipientAccountName: banksAcctsArray[index].bankAccountName, recipientAccount: banksAcctsArray[index].bankAccountNumber,recipientBankCode:banksAcctsArray[index].flutterwave_bankCode})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet"
                                disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.editRecipientButtonClicked(this);">
                                   <ons-icon icon="md-edit" size="25px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.deleteRecipientButtonClicked(this);">
                                <ons-icon icon="md-delete" size="25px"></ons-icon>
                                </ons-button>
                                </div></div></div></div></div></div>` ;
                            // append the bank account content to the "saved recipients" list
                            $('#saved-recipients-list', $thisPage).append(bankAcctContent);
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no accounts available
                        $('#saved-recipients-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#saved-recipients-page-error', $thisPage).css("display", "none");
                        // display the saved-recipients-list
                        $('#saved-recipients-list', $thisPage).css("display", "block");
                        // enable the 'Add Recipient' button
                        $('#saved-recipients-add-recipient-button', $thisPage).removeAttr("disabled");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no accounts available
                    $('#saved-recipients-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#saved-recipients-page-error', $thisPage).css("display", "block");
                    // hide the my-accounts-list from display
                    $('#saved-recipients-list', $thisPage).css("display", "none");
                    // disable the 'Add Recipient' button
                    $('#saved-recipients-add-recipient-button', $thisPage).attr("disabled", true);
                });

                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },


        /**
         * method is triggered when page is shown
         *
         * @param event
         */
        pageShow: function(event){
            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // check if the data on the page should be refreshed
            if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.refresh
                && $('#app-main-navigator').get(0).topPage.data.refresh === true){ // user wants this page refreshed
                // add & display the preloader for the page
                $('#saved-recipients-pull-hook', $thisPage).after('<div class="progress"><div class="indeterminate"></div> </div>');

                // load the saved recipients account data from the device secure store
                utopiasoftware.saveup.savedRecipientsBankAccountOperations.loadSavedRecipientsAccountsData().
                then(function(banksAcctsArray){ // the bank acct array collection has been returned
                    if(banksAcctsArray.length == 0){ // there are no bank account data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no accounts available
                        $('#saved-recipients-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#saved-recipients-page-error', $thisPage).css("display", "none");
                        // hide the my-accounts-list from display
                        $('#saved-recipients-list', $thisPage).css("display", "none");
                        // enable the 'Add Recipient' button
                        $('#saved-recipients-add-recipient-button', $thisPage).removeAttr("disabled");
                    }
                    else{ // there are card data available
                        // empty the contents of the saved recipients list
                        $('#saved-recipients-list', $thisPage).html("");

                        for(let index = 0; index < banksAcctsArray.length; index++){ // append the stored bank accounts to the "Saved Recipients" list
                            // create the bank account content
                            let bankAcctContent = `<div class="row"><div class="col s12"><div class="card horizontal">
                                <div class="card-image" style="padding: 3%;">
                                <img src="${banksAcctsArray[index].bankAccountAvatar}">
                                </div>
                                <div class="card-stacked">
                                <div class="card-content" style="padding-bottom: 0;">
                                <div style="font-weight: bold; font-size: 0.75em; font-style: italic; color: #464646;
                                padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountName}</div>
                                </div><div class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankAccountNumber}</div>
                                <div  class="card-action" style="font-weight: bold; font-size: 0.75em;
                                color: #464646; padding-bottom: 0.5em;">${banksAcctsArray[index].bankName}</div>
                                <div class="card-action" style="padding: 0;">
                                <div style="display: inline-block; margin-left: auto; margin-right: auto">
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}"
                                data-acct-object='${JSON.stringify({recipientAccountName: banksAcctsArray[index].bankAccountName, recipientAccount: banksAcctsArray[index].bankAccountNumber,recipientBankCode:banksAcctsArray[index].flutterwave_bankCode})}' modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.transferCashButtonClicked(this);">
                                <ons-icon icon="md-saveup-icon-saveup-transfer-cash" size="29px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet"
                                disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.editRecipientButtonClicked(this);">
                                   <ons-icon icon="md-edit" size="25px">
                                </ons-icon>
                                </ons-button>
                                <ons-button data-id="${banksAcctsArray[index].uniqueAccountId}" modifier="quiet" disable-auto-styling class="right"
                                        style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em;"
                                        onclick="utopiasoftware.saveup.controller.savedRecipientsPageViewModel.deleteRecipientButtonClicked(this);">
                                <ons-icon icon="md-delete" size="25px"></ons-icon>
                                </ons-button>
                                </div></div></div></div></div></div>` ;
                            // append the bank account content to the "saved recipients" list
                            $('#saved-recipients-list', $thisPage).append(bankAcctContent);
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no accounts available
                        $('#saved-recipients-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#saved-recipients-page-error', $thisPage).css("display", "none");
                        // display the saved-recipients-list
                        $('#saved-recipients-list', $thisPage).css("display", "block");
                        // enable the 'Add Recipient' button
                        $('#saved-recipients-add-recipient-button', $thisPage).removeAttr("disabled");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#saved-recipients-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#saved-recipients-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no accounts available
                    $('#saved-recipients-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#saved-recipients-page-error', $thisPage).css("display", "block");
                    // hide the my-accounts-list from display
                    $('#saved-recipients-list', $thisPage).css("display", "none");
                    // disable the 'Add Recipient' button
                    $('#saved-recipients-add-recipient-button', $thisPage).attr("disabled", true);
                });
            }

        },


        /**
         * method is triggered when the 'Add Recipient' button is clicked
         */
        addRecipientButtonClicked: function(){
            $('#app-main-navigator').get(0).pushPage("add-recipient-page.html", {
                animation: "lift-md"
            });
        },


        /**
         * method is used to trigger the delete operation of a user's bank account
         * and updating the user-interface (UI)
         *
         * @param buttonElem
         */
        deleteRecipientButtonClicked: function(buttonElem){

            // confirm that user wants to delete the account before proceeding
            ons.notification.confirm("Do you want to delete this recipient's bank account?", {title: 'Confirm Delete',
                    buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                .then(function(index) {
                    if (index === 1) { // YES button clicked
                        // call the utility method used to delete a specified recipient bank account
                        utopiasoftware.saveup.savedRecipientsBankAccountOperations.
                        deleteSavedRecipientAccount($(buttonElem).attr("data-id")).
                        then(function(){ // account has been deleted
                            $(buttonElem).closest('.row').remove(); // remove the account from display
                            // inform the user that card was deleted
                            Materialize.toast("Recipient's Bank Account deleted", 3000);
                        }).
                        catch(function(){
                            // inform the user that the specified bank account could not be deleted
                            window.plugins.toast.showWithOptions({
                                message: "Sorry, the recipient's bank account could not be deleted.\n Try again",
                                duration: 4000,
                                position: "top",
                                styling: {
                                    opacity: 1,
                                    backgroundColor: '#ff0000', //red
                                    textColor: '#FFFFFF',
                                    textSize: 14
                                }
                            }, function(toastEvent){
                                if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                                    window.plugins.toast.hide();
                                }
                            });
                        });
                    }
                });
        },


        /**
         * method is used to trigger the edit operation of a user's bank account
         * and updating/changing the user-interface (UI)
         *
         * @param buttonElem
         */
        editRecipientButtonClicked: function(buttonElem){
            $('#app-main-navigator').get(0).pushPage("add-recipient-page.html", {
                animation: "lift-md", data: {edit: $(buttonElem).attr("data-id")}
            });
        },


        /**
         * method is used to trigger the transfer cash operation. It uses the
         * selected user's 'Saved Recipient' object as the recipient account for the initiated
         * cash transfer
         *
         * @param buttonElem
         */
        transferCashButtonClicked: function(buttonElem){

            // ask user for secure PIN before proceeding. secure pin MUST match
            ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                'Please enter your PostCash Secure PIN to proceed</span></div>',
                cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                submitOnEnter: true
            }).
            then(function(userInput){ // user has provided a secured PIN , now authenticate it
                if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                    // close the 'verify account' the bottom sheets
                    $('#verify-account-bottom-sheet').modal('close');
                    $('#transfer-cash-page').remove(); // remove previous transfer cash pages
                    // call the transfer-cash-page and pass the 'saved recipient' details contained in the data attribute as recipient details data
                    $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {
                        data: {
                            recipient_details: JSON.parse($(buttonElem).attr("data-acct-object"))}
                    }); // navigate to the specified page
                }
                else{ // inform user that security check failed/user authentication failed
                    ons.notification.alert({title: "Security Check",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                        cancelable: true
                    });
                }
            }).
            catch(function(){});

            return;
        }

    },

    /**
     * object is view-model for add-recipient page
     */
    addRecipientPageViewModel: {

        /**
         * used to hold the parsley form validation object for the page
         */
        formValidator: null,

        /**
         * property used to keep track of the immediate last scroll position of the
         * page content
         */
        previousScrollPosition: 0,

        /**
         * property used to keep track of the current scroll position of the
         * page content
         */
        currentScrollPosition: 0,

        /**
         * property stores the name of the bank account being added.
         * Default value is an empty string
         */
        bankAccountName: "",

        /**
         * property holds the image to be used for the bank account
         */
        bankAccountImage: "",

        /**
         * property holds the randomly generated number used to generate
         * bank account avatar images
         */
        bankAccountImageRandomNum: null,

        /**
         * property holds authorisation token used for
         * verifying bank account number
         */
        tokenData: "",

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable", true);

            // reset the previous & current scroll positions of the page contents
            utopiasoftware.saveup.controller.addRecipientPageViewModel.previousScrollPosition = 0;
            utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition = 0;

            // reset the bank account properties
            utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountName = "";
            utopiasoftware.saveup.controller.addRecipientPageViewModel.tokenData = "";
            utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImage = "";

            // generate the random number used to display the bank account image/avatar
            var randomGen = new Random(Random.engines.nativeMath); // random number generator
            // generate the random number
            utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImageRandomNum = randomGen.integer(1, 6);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }


                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).popPage();
                };

                // listen for the scroll event of the page content
                $('#add-recipient-page .page__content').on("scroll", utopiasoftware.saveup.controller.addRecipientPageViewModel.pageContentScrolled);

                // initialise the form validation
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator = $('#add-recipient-form').parsley();

                // attach listener for the 'save' button click
                $('#add-recipient-save-button').get(0).onclick = function(){
                    // check if the user requested for remote account number validation
                    if($('#add-recipient-account-verify-account').is(":checked")){ //user asked for remote validation
                        // display loader message to the user
                        $('#loader-modal #loader-modal-message').html("Preparing Device Storage...");
                        $('#loader-modal').get(0).show();
                        // request for gateway authorization token used in account number validation
                        utopiasoftware.saveup.moneyWaveObject.useToken.
                        then(function(tokenData){
                            // set the token data used for verifying the bank account number
                            utopiasoftware.saveup.controller.addRecipientPageViewModel.tokenData = tokenData;
                            // hide loader message
                            $('#loader-modal').get(0).hide();
                            // run the validation method for the form
                            utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.whenValidate();
                        }).
                        catch(function(){
                            // clear the token data used for verifying the bank account number
                            utopiasoftware.saveup.controller.addRecipientPageViewModel.tokenData = "";
                            // hide loader message
                            $('#loader-modal').get(0).hide();
                            // run the validation method for the form
                            utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.whenValidate();
                        });
                    }
                    else{ // user did not ask for remote account number validation
                        // run the validation method for the form
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.whenValidate();
                    }
                };

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.on('field:ajaxoptions',
                    function(fieldInstance, ajaxOptions){
                        // edit the ajax options object to include the necessary authorization header
                        ajaxOptions.headers = {"Authorization":utopiasoftware.saveup.controller.addRecipientPageViewModel.tokenData};
                        ajaxOptions.data = JSON.stringify({
                            account_number: $('#add-recipient-form #add-recipient-account-number').val(),
                            bank_code: $('#add-recipient-form #add-recipient-choose-bank').val()
                        });

                        // display the loading icon for account number validation
                        $('#add-recipient-account-number-validation-loading', $thisPage).css("display", "block");
                    });

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                    // check if the element that triggered that validation error was the account number input
                    if($(fieldInstance.$element).is('#add-recipient-account-number')){ // it is the account number input
                        // hide the loading icon
                        $('#add-recipient-account-number-validation-loading', $thisPage).css("display", "none");

                        // check if the user requested for remote account number validation
                        if($('#add-recipient-account-verify-account').is(":checked")){ //user asked for remote validation
                            // empty the content of the account name input (based on remote validation result)
                            $('#add-recipient-page #add-recipient-account-name').val("");
                        }
                        else{ // user did not ask for remote account number validation
                        }
                    }
                });

                // listen for form field validation success event
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                    // check if the element that triggered that validation success was the account number input
                    if($(fieldInstance.$element).is('#add-recipient-account-number')){ // it is the account number input
                        // hide the loading icon
                        $('#add-recipient-account-number-validation-loading', $thisPage).css("display", "none");
                        // check if the user requested for remote account number validation
                        if($('#add-recipient-account-verify-account').is(":checked")){ //user asked for remote validation
                            // display the account name to the user (based on remote validation result)
                            $('#add-recipient-page #add-recipient-account-name').val(utopiasoftware.saveup.controller.
                                addRecipientPageViewModel.bankAccountName);
                            // update input field display
                            Materialize.updateTextFields();
                        }
                        else{ // user did not ask for remote account number validation
                        }
                    }
                });

                // listen for form validation success
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.addRecipientPageViewModel.addRecipientFormValidated);

                /** dynamically create the contents of the various select elements **/
                    // retrieve the sorted array of banks
                Promise.resolve(utopiasoftware.saveup.sortBanksData()).
                then(function(bankArrayData){
                    var optionTags = ""; // string to hold all created option tags

                    // get each object in bank array and use it to create the select element
                    for(var index = 0; index < bankArrayData.length; index++){
                        var bankObject = bankArrayData[index]; // get the bank object
                        // update the banks select element option tags
                        for(var prop in bankObject){
                            optionTags += '<option value="' + prop + '">' + bankObject[prop] + '</option>';
                        }
                    }

                    $('#add-recipient-choose-bank', $thisPage).append(optionTags); // append all the created option tags
                    // initialise the select element
                    $('#add-recipient-choose-bank', $thisPage).material_select();
                    return; // return at this point, so the page can continue initialisation
                }).
                then(function(){

                    // initialise the character counter plugin
                    $('#add-recipient-account-number', $thisPage).characterCounter();
                    return;
                }).
                then(function(){
                    // check if the page was sent a bank account id.
                    // if so preload the bank account data into the form
                    if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.edit){
                        // get the details of the account to be edited
                        utopiasoftware.saveup.savedRecipientsBankAccountOperations.
                        getSavedRecipientAccount($('#app-main-navigator').get(0).topPage.data.edit).then(function(bankAcct){
                            $('#add-recipient-page #add-recipient-unique-id').val(bankAcct.uniqueAccountId);
                            $('#add-recipient-page #add-recipient-account-number').val(bankAcct.bankAccountNumber);
                            $('#add-recipient-page #add-recipient-account-name').val(bankAcct.bankAccountName);
                            $('#add-recipient-page #add-recipient-choose-bank').val(bankAcct.flutterwave_bankCode);
                            $('#add-recipient-page #hidden-choose-bank-input').val(bankAcct.flutterwave_bankCode);

                            // re-update the form input fields
                            Materialize.updateTextFields();
                            //re-initialise the form select elements
                            $('select', $thisPage).material_select();

                            // remove the progress indeterminate loader
                            $('.progress', $thisPage).remove();
                            // make the add recipient form visible
                            $('#add-recipient-form', $thisPage).css("display", "block");
                            // enable the 'Cancel' & 'Save' buttons
                            $('#add-recipient-cancel-button, #add-recipient-save-button', $thisPage).removeAttr("disabled");
                            // hide the loader
                            $('#loader-modal').get(0).hide();
                        });
                    }
                    else { // this is not an edit operation, but a CREATE operation
                        // remove the progress indeterminate loader
                        $('.progress', $thisPage).remove();
                        // make the add recipient form visible
                        $('#add-recipient-form', $thisPage).css("display", "block");
                        // enable the 'Cancel' & 'Save' buttons
                        $('#add-recipient-cancel-button, #add-recipient-save-button', $thisPage).removeAttr("disabled");
                        // hide the loader
                        $('#loader-modal').get(0).hide();
                    }
                }).
                catch();


            }

        },

        /**
         * method is triggered when the page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms on the page
                $('#add-recipient-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#add-recipient-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object on the page
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms on the page
                $('#add-recipient-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#add-recipient-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.destroy();
                // destroy the form inputs which need to be destroyed
                $('#add-recipient-page select').material_select('destroy');
                $('#add-recipient-page #add-recipient-account-number').off();
                $('#add-recipient-page #add-recipient-account-number').removeData();
            }
            catch(err){}
        },

        /**
         * method is triggered when add card form is successfully validated
         */
        addRecipientFormValidated: function(){

            // display the secure storage modal to indicate that Recipient's Bank Account is being securely stored
            $('#secure-storage-modal .modal-message').html("Storing Recipient's Bank Account on Device...");
            $('#secure-storage-modal').get(0).show(); // show loader

            // update the bank account image/avatar property
            utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImage = "css/app-images/avatar-" +
                utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImageRandomNum + ".png";

            // check if this is an EDIT or CREATE operation
            if($('#app-main-navigator').get(0).topPage.data && $('#app-main-navigator').get(0).topPage.data.edit){ //this is an EDIT operation
                // call the utility method used to delete a specified bank account
                utopiasoftware.saveup.savedRecipientsBankAccountOperations.
                deleteSavedRecipientAccount($('#app-main-navigator').get(0).topPage.data.edit).
                then(function(){
                    // create an edited bank account data
                    var editedBankAcctData = {
                        uniqueAccountId: $('#app-main-navigator').get(0).topPage.data.edit,
                        bankAccountNumber: $('#add-recipient-form #add-recipient-account-number').val(),
                        bankAccountName: $('#add-recipient-form #add-recipient-account-name').val(),
                        bankName: $('#add-recipient-form #add-recipient-choose-bank option:selected').text().trim(),
                        flutterwave_bankCode: $('#add-recipient-form #add-recipient-choose-bank').val(),
                        bankAccountAvatar: utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImage
                    };

                    // call the utility method used to add a specified bank account to the bank account collection
                    return utopiasoftware.saveup.savedRecipientsBankAccountOperations.
                    addSavedRecipientAccount(editedBankAcctData);
                }).
                then(function(){
                    // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                    window.setTimeout(function(){
                        // reset the form validator object on the page
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.reset();
                        // reset the form object
                        $('#add-recipient-page #add-recipient-form').get(0).reset();
                        $('#add-recipient-page select').material_select();
                        // reset the account number validation check and all its related actions
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.
                        isbankAccountNumberValidated($('#add-recipient-page #add-recipient-account-verify-account'));
                        // reset the bank account properties
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountName = "";
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.tokenData = "";
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImage = "";
                        // reset the page scroll position to the top
                        $('#add-recipient-page .page__content').scrollTop(0);

                        $('#secure-storage-modal').get(0).hide(); // hide loader
                        // inform user that acct has been successfully added to secure storage
                        Materialize.toast("Recipient Account updated", 4000);
                    }, 4000);
                }).
                catch(function(){
                    $('#secure-storage-modal').get(0).hide(); // hide loader
                    ons.notification.alert({title: "Update Error",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (err.message || "") + " Sorry, this recipient's bank account could not be updated. " +
                        '<br>You can try again' + '</span>',
                        cancelable: true
                    });
                });
            }
            else { // this is a CREATE/ADD OPERATION

                var newBankAcctData = {
                    uniqueAccountId: "" + utopiasoftware.saveup.model.deviceUUID + Date.now(),
                    bankAccountNumber: $('#add-recipient-form #add-recipient-account-number').val(),
                    bankAccountName: $('#add-recipient-form #add-recipient-account-name').val(),
                    bankName: $('#add-recipient-form #add-recipient-choose-bank option:selected').text().trim(),
                    flutterwave_bankCode: $('#add-recipient-form #add-recipient-choose-bank').val(),
                    bankAccountAvatar: utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImage
                };

                utopiasoftware.saveup.savedRecipientsBankAccountOperations.
                addSavedRecipientAccount(newBankAcctData).
                then(function(){
                    // wait for approximately 4 secs for the saving animation to run (at least once before concluding animation
                    window.setTimeout(function(){
                        // reset the form validator object on the page
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.formValidator.reset();
                        // reset the form object
                        $('#add-recipient-page #add-recipient-form').get(0).reset();
                        $('#add-recipient-page select').material_select();
                        // reset the account number validation check and all its related actions
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.
                        isbankAccountNumberValidated($('#add-recipient-page #add-recipient-account-verify-account'));
                        // reset the bank account properties
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountName = "";
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.tokenData = "";
                        utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountImage = "";
                        // reset the page scroll position to the top
                        $('#add-recipient-page .page__content').scrollTop(0);

                        $('#secure-storage-modal').get(0).hide(); // hide loader
                        // inform user that recipient's bank account has been successfully added to secure storage
                        Materialize.toast("Recipient's bank account added", 4000);
                    }, 4000);
                }).
                catch(function(err){
                    $('#secure-storage-modal').get(0).hide(); // hide loader
                    ons.notification.alert({title: "Save Error",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (err.message || "") + " Sorry, this recipient's bank account could not be added. " +
                        '<br>You can try again' + '</span>',
                        cancelable: true
                    });
                });

            }

        },


        /**
         * method is used to check if user has asked for bank account number to be validated.
         * It sets or remove the appropriate attributes need to activate or deactivate
         * remote account validation
         */
        isbankAccountNumberValidated: function(checkElem){
            // check if user wants acct number validated or not
            if($(checkElem).is(":checked")){ // user wants the account number remotely validated
                // add the necessary attributes to the account number input in order to enable remote account number validation
                $('#add-recipient-account-number').attr("data-parsley-remote-validator", "recipientaccountnumbercheck");
                // also make the account name input disabled & wipe its previous content
                $('#add-recipient-account-name').attr("disabled", true);
                $('#add-recipient-account-name').val("");
                // remove tooltip from account name
                $("#add-recipient-account-name").parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $("#add-recipient-account-name").parent().find('label:eq(0)').removeAttr("data-hint");
                // display the notice that an internet connection is required for verification
                $('#add-recipient-account-verify-account-notice').css("display", "block");
            }
            else{ // user does not want account number remotely validated
                // remove attributes to prevent remote account number validation
                $('#add-recipient-account-number').removeAttr("data-parsley-remote-validator");
                // also make the account name input enabled & wipe its previous content
                $('#add-recipient-account-name').removeAttr("disabled");
                $('#add-recipient-account-name').val("");
                // hide the notice that an internet connection is required for verification
                $('#add-recipient-account-verify-account-notice').css("display", "none");
            }
        },

        /**
         * method is used to listen for scroll event of the page content
         *
         * @param event
         */
        pageContentScrolled: function(event){

            // set the current scrolltop position
            utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition = $(this).scrollTop();

            if(utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition >
                utopiasoftware.saveup.controller.addRecipientPageViewModel.previousScrollPosition){ // user scrolled up
                // set the current position as previous position
                utopiasoftware.saveup.controller.addRecipientPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is <= height of page toolbar
                if((140 - utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition) <= 56){
                    // the header image left after scrolling is <= height of page toolbar
                    // check if the toolbar for the page has already been made opaque
                    if(this.isToolBarOpaque != true){ // toolbar has not been made opaque

                        $('#add-recipient-page ons-toolbar').removeClass("toolbar--transparent translucent-toolbar"); // make the toolbar opaque
                        // also pin the help header on the page just below the toolbar
                        $('#add-recipient-page ons-list-header').css(
                            {"display": "block", "position": "fixed", "top": "56px", "width": "100%"});
                        this.isToolBarOpaque = true; // flag that toolbar has been made opaque
                    }
                }

                return;
            }

            if(utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition <
                utopiasoftware.saveup.controller.addRecipientPageViewModel.previousScrollPosition){ // user scrolled down
                // set the current position as previous position
                utopiasoftware.saveup.controller.addRecipientPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is > height of page toolbar
                if((140 - utopiasoftware.saveup.controller.addRecipientPageViewModel.currentScrollPosition) > 56){
                    // the header image left after scrolling is > height of page toolbar
                    // check if the toolbar for the page has already been made transparent
                    if(this.isToolBarOpaque == true){ // toolbar has NOT been made transparent

                        $('#add-recipient-page ons-toolbar').addClass("toolbar--transparent translucent-toolbar"); // make the toolbar transparent
                        // also unpin the help header on the page from just below the toolbar
                        $('#add-recipient-page ons-list-header').css({"display": "block", "position": "static", "top": "56px"});
                        this.isToolBarOpaque = false; // flag that toolbar has been made transparent
                    }
                }

                return;
            }
        },


        /**
         * method is used to reset/wipe the content of the account name IF
         * remote account validation has been enabled
         */
        resetAccountNameDisplay: function(){
            if($('#add-recipient-page #add-recipient-account-verify-account').is(":checked")) { // user wants the account number remotely validated
                $('#add-recipient-page #add-recipient-account-name').val("");
            }
        },

        /**
         * custom parsley validator for bank account number
         *
         * @param jqxhr {jqueryXhr}
         */
        recipientAccountNumberValidator: function(jqxhr){
            var serverResponse = ""; // holds the server response

            // check the validator response
            if(jqxhr.status != 200){ // request was NOT success
                return false;
            }

            // convert the server response to json
            serverResponse = JSON.parse(jqxhr.responseText.trim());

            if(serverResponse.status != "success"){ // the server api response was NOT successful

                return false;
            }
            else { // the server api response was successful
                // set the bank account name
                utopiasoftware.saveup.controller.addRecipientPageViewModel.bankAccountName = serverResponse.data.account_name;
                return true; // validation successful
            }

        }

    },

    /**
     * object is view-model for transfer-cash-card page
     */
    transferCashCardPageViewModel: {

        /**
         * used to hold the parsley form validation object for the page
         */
        formValidator: null,

        /**
         * used to hold the parsley field validation object for the 'transfer amount' input
         */
        transferAmountFieldValidator: null,

        /**
         * property used to keep track of the immediate last scroll position of the
         * page content
         */
        previousScrollPosition: 0,

        /**
         * property used to keep track of the current scroll position of the
         * page content
         */
        currentScrollPosition: 0,


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // reset the previous & current scroll positions of the page contents
            utopiasoftware.saveup.controller.transferCashCardPageViewModel.previousScrollPosition = 0;
            utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition = 0;

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    // check which tab is active and navigate appropriately
                    if($('.transfer-cash-tabbar').get(0).getActiveTabIndex() == 0){ // the first tab is active
                        // navigate to the main menu
                        $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                    }
                    else{ // the second tab is active
                        // move the tab view to the Card tab
                        $('.transfer-cash-tabbar').get(0).setActiveTab(0, {animation: "slide"});
                    }

                };

                // listen for the scroll event of the page carousel content
                $('ons-carousel', $thisPage).on("scroll",
                    utopiasoftware.saveup.controller.transferCashCardPageViewModel.pageContentScrolled);

                // initialise the form validation objects.
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.transferAmountFieldValidator =
                    $('#transfer-cash-card-amount', $thisPage).parsley({ // used solely for the transfer-cash-amount input
                        value: function(parsley) {
                            // convert the amount back to a plain text without the thousand separator
                            let parsedNumber = kendo.parseFloat($('#transfer-cash-card-amount', $thisPage).val());
                            return (parsedNumber ? parsedNumber : $('#transfer-cash-card-amount', $thisPage).val());
                        }
                    });

                utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator =
                    $('#transfer-cash-card-form', $thisPage).parsley(); // used for the form in general


                 // attach listener for the 'transfer cash' card button click
                $('#transfer-cash-card-button', $thisPage).get(0).onclick = function(){
                    // run the validation method for the transfer-cash-card form
                    utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator.whenValidate();
                };

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for form field validation success event
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                });


                // listen for transfer-cash-card form validation success
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.transferCashCardPageViewModel.transferCashCardFormValidated);

                // initialise the card number autocomplete widget
                utopiasoftware.saveup.financialCardOperations.loadCardData().
                then(function(cardsArrayData){
                    var autoCompleteData = {}; // holds the data used to initialise the autocomplete widget
                    cardsArrayData.forEach(function(arrayElem){ // function to convert each array element to a format for autocomplete
                        autoCompleteData[arrayElem.cardNickName + " - " +  arrayElem.cardNumber] = arrayElem.cardImage;

                    });
                    // intialise widget
                    $('#transfer-cash-card-number.autocomplete', $thisPage).autocomplete({
                        data: autoCompleteData,
                        onAutocomplete: function(val) {
                            // callback function when value is autocompleted
                        },
                        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
                    });

                    // call the method to retrieve saved bank account recipient's used to populate recipient autocomplete widget
                    return utopiasoftware.saveup.savedRecipientsBankAccountOperations.loadSavedRecipientsAccountsData();

                }, function(){return [];}).
                then(function(savedRecipientsArray){
                    var autoCompleteData = {}; // holds the data used to initialise the autocomplete widget
                    savedRecipientsArray.forEach(function(arrayElem){ // function to convert each array element to a format for autocomplete
                        autoCompleteData[arrayElem.bankAccountName + " - " +  arrayElem.bankAccountNumber] =
                            arrayElem.bankAccountAvatar;

                    });
                    // initialise widget
                    $('#transfer-cash-card-recipient-account-name.autocomplete', $thisPage).autocomplete({
                        data: autoCompleteData,
                        onAutocomplete: function(val) {
                            // Callback function when value is autcompleted.
                        },
                        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
                    });
                    return utopiasoftware.saveup.sortBanksData(); // retrieve data for banks
                }, function(){return [];}).
                then(function(bankArrayData){
                    var optionTags = ""; // string to hold all created option tags

                    // get each object in bank array and use it to create the 'bank' select element
                    for(var index = 0; index < bankArrayData.length; index++){
                        var bankObject = bankArrayData[index]; // get the bank object
                        // update the banks select element option tags
                        for(var prop in bankObject){
                            optionTags += '<option value="' + prop + '">' + bankObject[prop] + '</option>';
                        }
                    }

                    $('#transfer-cash-card-choose-bank', $thisPage).append(optionTags); // append all the created option tags
                    // initialise the 'bank' select element
                    $('#transfer-cash-card-choose-bank', $thisPage).material_select();
                    return; // return at this point, so the page can continue initialisation
                }, function(){return null;}).
                then(function(){
                    /** dynamically create the contents of the 'year' select elements **/
                    var optionTags = ""; // string to hold all created option tags for the Card Expiry Year
                    var yearOption = (new Date()).getFullYear(); // get the current year
                    // add current year to the options tag
                    optionTags += '<option value="' + yearOption + '">' + yearOption + '</option>';

                    // add 3 more years to the option tags for the Card Expiry Year
                    for(var index = 0; index < 3; index++){
                        // increase the yearOption by 1
                        yearOption += 1;
                        // add current year to the options tag
                        optionTags += '<option value="' + yearOption + '">' + yearOption + '</option>';
                    }

                    $('#transfer-cash-card-expiry-year', $thisPage).append(optionTags); // append all the created option tags

                    // initialise all the select element
                    $('select', $thisPage).material_select();
                    return null;
                }, function(){return null;}).
                then(function(){
                    var pageDataObject = $('#app-main-navigator').get(0).topPage.data; // get the data attached to this page

                    // check if the data contains recipient account details
                    if(pageDataObject && pageDataObject.recipient_details){ // recipient account details are present
                        // update the form details to contains the received recipient account details
                        $('#transfer-cash-card-recipient-account-name', $thisPage).
                        val(pageDataObject.recipient_details.recipientAccountName + " - " +
                            pageDataObject.recipient_details.recipientAccount);
                        $('#transfer-cash-card-choose-bank', $thisPage).
                        val(pageDataObject.recipient_details.recipientBankCode);
                        $('#hidden-choose-bank-input', $thisPage).
                        val(pageDataObject.recipient_details.recipientBankCode);
                    }

                    // check if the data contains sender account details
                    if(pageDataObject && pageDataObject.sender_details){ // sender account details are present
                        // move the tab view to the Bank tab
                        $('.transfer-cash-tabbar').get(0).setActiveTab(1, {animation: "slide"});
                    }

                    // check if the data contains sender card details
                    if(pageDataObject && pageDataObject.sender_card_details){ // sender card details are present
                        // update the form details to contain the sender card details
                        $('#transfer-cash-card-number', $thisPage).
                        val(pageDataObject.sender_card_details.senderCardNickName + " - " +
                            pageDataObject.sender_card_details.senderCardNumber);
                        $('#transfer-cash-card-cvv', $thisPage).
                        val(pageDataObject.sender_card_details.senderCardCvv);
                        $('#transfer-cash-card-expiry-month', $thisPage).
                        val(pageDataObject.sender_card_details.senderCardExpiryMonth);
                        $('#hidden-card-expiry-month-input', $thisPage).
                        val(pageDataObject.sender_card_details.senderCardExpiryMonth);
                        $('#transfer-cash-card-expiry-year', $thisPage).
                        val(pageDataObject.sender_card_details.senderCardExpiryYear);
                        $('#hidden-card-expiry-year-input', $thisPage).
                        val(pageDataObject.sender_card_details.senderCardExpiryYear);

                        // display the verify card type checkbox to the user
                        $('.postcash-transfer-cash-card-hidden-info:eq(0)', $thisPage).css("display", "block");
                    }

                    // update the display of all the select element
                    $('select', $thisPage).material_select();
                    Materialize.updateTextFields(); // update the display of text input fields
                    return null; // return null to move to the next step
                }, function(){return null;}).
                then(function(){
                    // remove the progress indeterminate loader
                    $('.progress', $thisPage).remove();
                    // make the transfer-cash-card form visible
                    $('#transfer-cash-card-form', $thisPage).css("display", "block");
                    // enable the 'Cancel' & 'Save' buttons for the transfer-cash-card form
                    $('#transfer-cash-card-cancel-button-1, #transfer-cash-card-button', $thisPage).removeAttr("disabled");
                    // hide the loader
                    $('#loader-modal').get(0).hide();
                }, function(){});

            }

        },

        /**
         * method is triggered when page is shown
         */
        pageShow: (event) => {
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);
        },

        /**
         * method is triggered when the create-account page is hidden
         * @param event
         */
        pageHide: (event) => {
            var $thisPage = $(event.target); // get the current page shown
            try {
                // remove any tooltip being displayed on all forms on the page
                $('[data-hint]', $thisPage).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', $thisPage).removeAttr("data-hint");
                // reset the transfer-cash-card form validator object on the page
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.transferAmountFieldValidator.reset();
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the sign-in page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            var $thisPage = $(event.target); // get the current page shown
            try{
                // remove any tooltip being displayed on all forms on the page
                $('[data-hint]', $thisPage).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', $thisPage).removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.transferAmountFieldValidator.reset();
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.formValidator.destroy();
                // destroy the form inputs which need to be destroyed
                $('select', $thisPage).material_select('destroy');
                $('input.autocomplete', $thisPage).off();
                $('input.autocomplete', $thisPage).removeData();
            }
            catch(err){}
        },

        /**
         * method is triggered when transfer-cash-card form is successfully validated
         */
        transferCashCardFormValidated: function(){

            // check if Internet Connection is available before proceeding
            if(navigator.connection.type === Connection.NONE){ // no Internet Connection
                // inform the user that they cannot proceed without Internet
                window.plugins.toast.showWithOptions({
                    message: "You cannot transfer cash without an active Internet Connection",
                    duration: 4500,
                    position: "top",
                    styling: {
                        opacity: 1,
                        backgroundColor: '#ff0000', //red
                        textColor: '#FFFFFF',
                        textSize: 14
                    }
                }, function(toastEvent){
                    if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                        window.plugins.toast.hide();
                    }
                });

                return; // exit method immediately
            }

            // confirm transfer-cash-card operation
            ons.notification.confirm({title: '<ons-icon icon="md-alert-triangle" size="36px" ' +
                'style="color: orange;"></ons-icon> Confirm Transfer',
                messageHTML: '<span>Cash transfers cannot be undone or reversed when completed. <br>' +
                'Do you want to continue?</span>',
                cancelable: false,
                buttonLabels: ["No", "Yes"]
            }).
            then(function(buttonIndex){
                if(buttonIndex === 1){ // user wants to continue transfer
                    // display message to user
                    $('#loader-modal-message').html("Initiating Transfer...");
                    $('#loader-modal').get(0).show(); // show loader
                    // retrieve the necessary authorisation token
                    return utopiasoftware.saveup.moneyWaveObject.useToken;
                }
                else{ // user terminated transfer
                    throw null;
                }
            }).
            then(function(token){

                if(token === null){ // user already terminated transfer
                    throw null;
                }
                else{ // use retrieved token to initiate transfer

                    //create the cash transfer data
                    var cashTransferData = {
                        firstname: utopiasoftware.saveup.model.appUserDetails.firstName.split(" ")[0],
                        lastname: utopiasoftware.saveup.model.appUserDetails.lastName.split(" ")[0],
                        phonenumber: utopiasoftware.saveup.model.appUserDetails.phoneNumber_intlFormat,
                        email: (utopiasoftware.saveup.model.appUserDetails.firstName.split(" ")[0] +
                        utopiasoftware.saveup.model.appUserDetails.lastName.split(" ")[0]) + Date.now() + "@mymail.com",
                        apiKey: utopiasoftware.saveup.moneyWaveObject.key.apiKey,
                        medium: "mobile",
                        fee: utopiasoftware.saveup.model.fee,
                        redirecturl: "https://postcash.000webhostapp.com/transfer-cash-card.html",
                        card_no: $('#transfer-cash-card-number', '#transfer-cash-card-page').val().split(" - ").pop(),
                        cvv: $('#transfer-cash-card-cvv', '#transfer-cash-card-page').val(),
                        expiry_year: $('#transfer-cash-card-expiry-year', '#transfer-cash-card-page').val(),
                        expiry_month: $('#transfer-cash-card-expiry-month', '#transfer-cash-card-page').val(),
                        amount: kendo.parseFloat($('#transfer-cash-card-amount', '#transfer-cash-card-page').val()),
                        narration: $('#transfer-cash-card-narration', '#transfer-cash-card-page').val(),
                        recipient_bank: $('#transfer-cash-card-choose-bank', '#transfer-cash-card-page').val(),
                        recipient_account_number:
                            $('#transfer-cash-card-recipient-account-name', '#transfer-cash-card-page').val().split(" - ").pop()
                    };
                    // check if user want to transfer using a local mastercard OR verve
                    if(! $('#transfer-cash-card-pin', '#transfer-cash-card-form').is(':disabled')){
                        // user wants to transfer using a local mastercard or verve
                        cashTransferData.charge_auth  = "PIN";
                        cashTransferData.pin  = $('#transfer-cash-card-pin', '#transfer-cash-card-page').val();
                    }

                    // initiate the cash transfer request
                    return new Promise(function(resolve, reject){
                        var cashTransferRequest = $.ajax(
                            {
                                url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/transfer",
                                type: "post",
                                contentType: "application/json",
                                beforeSend: function(jqxhr) {
                                    jqxhr.setRequestHeader("Authorization", token);
                                },
                                dataType: "json",
                                timeout: 240000, // wait for 4 minutes before timeout of request
                                processData: false,
                                data: JSON.stringify(cashTransferData)
                            }
                        );

                        // server responded to cash transfer request
                        cashTransferRequest.done(function(responseData){
                            if(responseData.status === "success"){ // the server responded with a successful transfer initiation
                                resolve(responseData); // resolve the cash transfer promise
                            }
                            else { // the server responded unsuccessfully
                                reject(responseData); // reject the cash transfer promise
                            }
                        });

                        // server responded with a failure to the cash transfer request
                        cashTransferRequest.fail(function(jqxhr){
                            if(jqxhr.status == 500){
                                reject(JSON.parse(jqxhr.responseText.trim()));
                            }
                            else{
                                reject(jqxhr.responseText.trim());
                            }
                        });
                    });
                }
            }).
            then(function(responseData){ // securely store the transaction history from the responseData on the user's device
                responseData.data.transfer.postcash_transaction_type = "Cash Transfer (Card)"; // set the postcash transaction type
                return Promise.all([utopiasoftware.saveup.transactionHistoryOperations.
                addTransactionHistory(responseData.data.transfer), Promise.resolve(responseData)]);
            }).
            then(function(responseDataArray){
                if(responseDataArray == null || responseDataArray[1] == null){ // user already terminated transfer
                    throw null;
                }

                var responseData = responseDataArray[1]; // retrieve the response from the server

                // update the display info for the card transaction

                $('#transfer-cash-card-authorize-amount', '#transfer-cash-card-page').
                html(kendo.toString(kendo.parseFloat(responseData.data.transfer.amountToSend), "n2"));
                $('#transfer-cash-card-authorize-fee', '#transfer-cash-card-page').
                html(kendo.toString(kendo.parseFloat(responseData.data.transfer.chargedFee), "n2"));
                $('#transfer-cash-card-authorize-total', '#transfer-cash-card-page').
                html(kendo.toString(kendo.parseFloat(responseData.data.transfer.amountToCharge), "n2"));
                $('#transfer-cash-card-authorize-message', '#transfer-cash-card-page').
                html(responseData.data.transfer.flutterChargeResponseMessage);

                // store the transaction id & transaction reference in the session storage
                window.sessionStorage.setItem("transaction_id", responseData.data.transfer.id);
                window.sessionStorage.setItem("transaction_ref", responseData.data.transfer.flutterChargeReference);

                // hide the transfer bottom-toolbar
                $('.transfer-cash-card-page-bottom-toolbar-transfer-block').css("display", "none");

                // check whether to display the authorisation form OR authorisation iframe
                if($('#transfer-cash-card-pin', '#transfer-cash-card-form').is(':disabled')){ // user does not require the ATM pin

                    // store the transaction auth_url in the session storage to be used by the authorization iframe
                    window.sessionStorage.setItem("transaction_authurl", responseData.data.authurl);

                    // hide the authorization form
                    $('#transfer-cash-card-authorise-form', '#transfer-cash-card-page').css("display", "none");
                    // disable the 'Authorize' button, show the otp authorise bottom toolbar & hide the pin authorise bottom toolbar
                    $('#transfer-cash-card-authorise-button').attr("disabled", true);
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-otp-block').css("display", "block");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-pin-block').css("display", "none");
                }
                else{ // display the authorization form
                    $('#transfer-cash-card-authorise-form', '#transfer-cash-card-page').css("display", "block");
                    //  hide the authorization iframe
                    //$('#transfer-cash-card-authorise-iframe', '#transfer-cash-card-page').css("display", "none");
                    // enable the 'Authorize' button, hide the otp authorise bottom toolbar & show the pin authorise bottom toolbar
                    $('#transfer-cash-card-authorise-button').removeAttr("disabled");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-otp-block').css("display", "none");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-pin-block').css("display", "block");
                }

                // update the transaction indicators
                $('.postcash-pay-progress .col:eq(0) span:eq(0)').
                removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                $('.postcash-pay-progress .col:eq(0) span:eq(1)').
                removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                $('.postcash-pay-progress .col:eq(1) span:eq(0)').
                removeClass('postcash-pay-progress-milestone').addClass('postcash-pay-progress-milestone-active');
                $('.postcash-pay-progress .col:eq(1) span:eq(1)').
                removeClass('postcash-pay-progress-milestone-text').addClass('postcash-pay-progress-milestone-text-active');

                // transition to 'authorize' block
                return $('.transfer-cash-card-carousel').get(0).next({animation: 'none'});
            }).
            then(function(serverResponse){
                if(serverResponse == null){ // user already terminated transfer
                    throw null;
                }

                $('#loader-modal').get(0).hide(); // hide loader
            }).
            catch(function(error){

                $('#loader-modal').get(0).hide(); // hide loader
                if(error == null){ // the user decided NOT to proceed with the transfer
                    return; // do nothing
                }

                ons.notification.alert({title: "Cash Transfer Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>' + (error.data || "") + ' Sorry, your cash transfer failed. ' +
                    '<br>You can try again' + '</span>',
                    cancelable: true
                });

            });

        },


        /**
         * method is used to check authorization of a card cash transfer
         * (AUTHORIZATION VIA OTP)
         */
        transferCashCardOtpAuthorize: function(){

            var tokenData = ""; /// holds the authorisation token
            // check if user has completed transfer authorisation
            if(true){ // user completed transfer authorisation
                // display message to user
                $('#loader-modal-message').html("Checking Authorization... Please Wait");
                $('#loader-modal').get(0).show(); // show loader
                // get the authorisation token
                utopiasoftware.saveup.moneyWaveObject.useToken.
                then(function(token){
                    tokenData = token; // set the token data
                    // initiate the cash transfer authorisation check
                    return new Promise(function(resolve, reject){
                        var cashTransferAuthorisation = $.ajax(
                            {
                                url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/transfer/" +
                                window.sessionStorage.getItem("transaction_id"),
                                type: "post",
                                contentType: "application/json",
                                beforeSend: function(jqxhr) {
                                    jqxhr.setRequestHeader("Authorization", token);
                                },
                                dataType: "json",
                                timeout: 240000, // wait for 4 minutes before timeout of request
                                processData: false,
                                data: JSON.stringify({})
                            }
                        );

                        // server responded to cash transfer authorisation check
                        cashTransferAuthorisation.done(function(responseData){
                            if(responseData.status === "success"){ // the server responded with a successful transfer authorisation
                                resolve(responseData); // resolve the cash transfer authorisation promise
                            }
                            else { // the server responded unsuccessfully
                                reject(responseData); // reject the cash transfer authorisation promise
                            }
                        });

                        // server responded with a failure to the cash authorisation check
                        cashTransferAuthorisation.fail(function(jqxhr){
                            reject(JSON.parse(jqxhr.responseText.trim()));
                        });
                    });
                }).
                then(function(responseData){
                    if(responseData.data.flutterChargeResponseMessage.toLocaleUpperCase() == "APPROVED"){ // cash transfer was success
                        // update the transaction indicators
                        $('.postcash-pay-progress .col:eq(0) span:eq(0)').
                        removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                        $('.postcash-pay-progress .col:eq(0) span:eq(1)').
                        removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                        $('.postcash-pay-progress .col:eq(1) span:eq(0)').
                        removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                        $('.postcash-pay-progress .col:eq(1) span:eq(1)').
                        removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                        $('.postcash-pay-progress .col:eq(2) span:eq(0)').
                        removeClass('postcash-pay-progress-milestone').addClass('postcash-pay-progress-milestone-active');
                        $('.postcash-pay-progress .col:eq(2) span:eq(1)').
                        removeClass('postcash-pay-progress-milestone-text').addClass('postcash-pay-progress-milestone-text-active');

                        // hide ALL the bottom-toolbar blocks
                        $('.transfer-cash-card-page-bottom-toolbar-transfer-block').css("display", "none");
                        $('.transfer-cash-card-page-bottom-toolbar-authorize-otp-block').css("display", "none");
                        $('.transfer-cash-card-page-bottom-toolbar-authorize-pin-block').css("display", "none");

                        $('#transfer-cash-card-authorise-iframe').attr("src", ""); // reset the src of the authorization iframe
                        // hide the modal that contains the authorisation iframe
                        return $('#transfer-cash-card-authorise-modal').get(0).hide();
                    }
                    else{
                        throw responseData; // cash transfer could not be authorised
                    }
                }).
                then(function(){
                    return utopiasoftware.saveup.transactionHistoryOperations.
                    updateTransactionHistory(window.sessionStorage.getItem("transaction_ref"), "APPROVED");
                }).
                then(function(){
                    // call the method to check if the kinvey library has been initialised
                    return new Promise(function(resolve, reject){
                        utopiasoftware.saveup.kinveyBaasOperations.checkKinveyInitialised().
                        then(function(){ // the kinvey Baas library has already been initialised
                            resolve({}); // resolve Promise
                        }, function(){ // kinvey has NOT been initialised, so initialise it
                            resolve(Promise.resolve(utopiasoftware.saveup.kinveyBaasOperations.initialiseKinvey()));
                        })
                    });
                }).
                then(function(){
                    var transferData = {  // holds the data to be sent to the kinvey business logic (for wallet transfer)
                        authorizationToken: tokenData,
                        postcash_fee: utopiasoftware.saveup.model.fee
                    };

                    return utopiasoftware.saveup.kinveyBaasOperations.transferWalletCash(transferData); // send funds to developer
                }).
                then(function(){
                    // hide loader & move carousel to the confirmation item
                    return Promise.all([$('#loader-modal').get(0).hide(), $('.transfer-cash-card-carousel').get(0).next({animation: 'none'})]);
                }).
                then(function(){
                    // show transaction confirmation modal
                    return $('#financial-operations-success-modal').get(0).show();
                }).
                then(function(){
                    // show the financial operations success modal after 1 second
                    window.setTimeout(function(){
                        $('#financial-operations-success-modal .circle').addClass("show");
                    }, 1000);
                }).
                catch(function(error){

                    $('#loader-modal').get(0).hide(); // hide loader
                    // hide the modal that contains the authorisation iframe
                    $('#transfer-cash-card-authorise-modal').get(0).hide();

                    ons.notification.alert({title: "Cash Transfer Failed",
                        messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                        'style="color: red;"></ons-icon> <span>' + (error.message || "") + ' Sorry, your cash transfer was not authorised. ' +
                        '<br>You can check this transaction status OR resend the cash transfer' + '</span>',
                        cancelable: true
                    }).
                    then(function(){$('#app-main-navigator').get(0).resetToPage('main-menu-page.html');});

                });
            }

        },


        /**
         * method is used to check authorization of a card cash transfer
         * (AUTHORIZATION VIA PIN)
         */
        transferCashCardPinAuthorize: function(){

            // check if Internet Connection is available before proceeding
            if(navigator.connection.type === Connection.NONE){ // no Internet Connection
                // inform the user that they cannot proceed without Internet
                window.plugins.toast.showWithOptions({
                    message: "You cannot transfer cash without an active Internet Connection",
                    duration: 4500,
                    position: "top",
                    styling: {
                        opacity: 1,
                        backgroundColor: '#ff0000', //red
                        textColor: '#FFFFFF',
                        textSize: 14
                    }
                }, function(toastEvent){
                    if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                        window.plugins.toast.hide();
                    }
                });

                return; // exit method immediately
            }

            var tokenData = ""; // holds the authorisation token
            // display message to user
            $('#loader-modal-message').html("Checking Authorization... Please Wait");
            $('#loader-modal').get(0).show(); // show loader
            // get the authorisation token
            utopiasoftware.saveup.moneyWaveObject.useToken.
            then(function(token){
                tokenData = token; // assign the authorisation token to the variable

                // initiate the cash transfer request
                return new Promise(function(resolve, reject){
                    var cashTransferAuthoriseRequest = $.ajax(
                        {
                            url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/transfer/charge/auth/card",
                            type: "post",
                            contentType: "application/json",
                            beforeSend: function(jqxhr) {
                                jqxhr.setRequestHeader("Authorization", token);
                            },
                            dataType: "json",
                            timeout: 240000, // wait for 4 minutes before timeout of request
                            processData: false,
                            data: JSON.stringify({transactionRef: window.sessionStorage.getItem("transaction_ref"),
                                otp: $('#transfer-cash-card-otp', '#transfer-cash-card-page').val()})
                        }
                    );

                    // server responded to cash transfer request
                    cashTransferAuthoriseRequest.done(function(responseData){
                        if(responseData.status === "success"){ // the server responded with a successful transfer initiation
                            resolve(responseData); // resolve the cash transfer promise
                        }
                        else { // the server responded unsuccessfully
                            reject(responseData); // reject the cash transfer promise
                        }
                    });

                    // server responded with a failure to the cash transfer request
                    cashTransferAuthoriseRequest.fail(function(jqxhr){
                        if(jqxhr.status == 500){
                            reject(JSON.parse(jqxhr.responseText.trim()));
                        }
                        else{
                            reject(jqxhr.responseText.trim());
                        }
                    });
                });
            }).
            then(function(responseData){
                if(responseData.data.flutterChargeResponseMessage.toLocaleUpperCase().indexOf("APPROVED") > -1){ // cash transfer was success
                    // update the transaction indicators
                    $('.postcash-pay-progress .col:eq(0) span:eq(0)').
                    removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                    $('.postcash-pay-progress .col:eq(0) span:eq(1)').
                    removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                    $('.postcash-pay-progress .col:eq(1) span:eq(0)').
                    removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                    $('.postcash-pay-progress .col:eq(1) span:eq(1)').
                    removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                    $('.postcash-pay-progress .col:eq(2) span:eq(0)').
                    removeClass('postcash-pay-progress-milestone').addClass('postcash-pay-progress-milestone-active');
                    $('.postcash-pay-progress .col:eq(2) span:eq(1)').
                    removeClass('postcash-pay-progress-milestone-text').addClass('postcash-pay-progress-milestone-text-active');

                    // hide ALL the bottom-toolbar blocks
                    $('.transfer-cash-card-page-bottom-toolbar-transfer-block').css("display", "none");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-otp-block').css("display", "none");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-pin-block').css("display", "none");

                    return null;
                }
                else{
                    throw responseData; // cash transfer could not be authorised
                }
            }).
            then(function(){
                return utopiasoftware.saveup.transactionHistoryOperations.
                updateTransactionHistory(window.sessionStorage.getItem("transaction_ref"), "APPROVED");
            }).
            then(function(){
                // call the method to check if the kinvey library has been initialised
                return new Promise(function(resolve, reject){
                    utopiasoftware.saveup.kinveyBaasOperations.checkKinveyInitialised().
                    then(function(){ // the kinvey Baas library has already been initialised
                        resolve({}); // resolve Promise
                    }, function(){ // kinvey has NOT been initialised, so initialise it
                        resolve(Promise.resolve(utopiasoftware.saveup.kinveyBaasOperations.initialiseKinvey()));
                    })
                });
            }).
            then(function(){
                var transferData = {  // holds the data to be sent to the kinvey business logic (for wallet transfer)
                    authorizationToken: tokenData,
                    postcash_fee: utopiasoftware.saveup.model.fee
                };

                return utopiasoftware.saveup.kinveyBaasOperations.transferWalletCash(transferData);
            }).
            then(function(){
                // hide loader & move the carousel to the confirmation item
                return Promise.all([$('#loader-modal').get(0).hide(), $('.transfer-cash-card-carousel').get(0).next({animation: 'none'})]);
            }).
            then(function(){
                // show transaction confirmation modal
                return $('#financial-operations-success-modal').get(0).show();
            }).
            then(function(){
                // show the financial operations success modal after 1 second
                window.setTimeout(function(){
                    $('#financial-operations-success-modal .circle').addClass("show");
                }, 1000);
            }).
            catch(function(error){

                $('#loader-modal').get(0).hide(); // hide loader

                ons.notification.alert({title: "Cash Transfer Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>' + (error.message || "") + ' Sorry, your cash transfer was not authorised. ' +
                    '<br>You can check this transaction status OR resend the cash transfer' + '</span>',
                    cancelable: true
                }).
                then(function(){$('#app-main-navigator').get(0).resetToPage('main-menu-page.html');});

            });
        },

        /**
         * method is triggered when the card number autocomplete input is changed
         *
         * @param inputElem
         */
        cardNumberChanged: function(inputElem){
            // display the preloaders that block input so certain card information can be autofilled
            $('.postcash-preloader-transfer-cash-card-form-container', utopiasoftware.saveup.controller.
                transferCashCardPageViewModel.formValidator.$element).css("display", "block");
            // split the input value so can can extract just the card number
            var valueSplitArray = $(inputElem).val().split(" - ");
            //get the card number from the array
            var cardNumber = valueSplitArray.pop();
            // get the financial card object from secure storage using the retrieved card number
            utopiasoftware.saveup.financialCardOperations.getCardByNumber(cardNumber).
            then(function(cardObject){
                // autofill the contents of the cash transfer form (card section) with the contents of card object
                if(! cardObject){ // card object is null
                    throw "error";
                }

                $('#transfer-cash-card-cvv', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(cardObject.cvv);
                $('#transfer-cash-card-expiry-month', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(cardObject.cardExpiryMonth);
                $('#transfer-cash-card-expiry-year', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(cardObject.cardExpiryYear);
                $('#hidden-card-expiry-month-input', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(cardObject.cardExpiryMonth);
                $('#hidden-card-expiry-year-input', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(cardObject.cardExpiryYear);

                // remove any tooltip being displayed on the transfer cash form
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).removeAttr("data-hint");

                if(cardObject.cardBrand == "Unknown" || cardObject.cardLocale == "Unknown"){ // card brand/locale is unknown
                    // display the verify card brand/locale checkbox
                    $('.postcash-transfer-cash-card-hidden-info:eq(0)', utopiasoftware.saveup.controller.
                        transferCashCardPageViewModel.formValidator.$element).css("display", "block");
                }
                else{ // card brand/locale is known
                    // hide the verify card brand/locale checkbox
                    $('.postcash-transfer-cash-card-hidden-info:eq(0)', utopiasoftware.saveup.controller.
                        transferCashCardPageViewModel.formValidator.$element).css("display", "none");
                }

                if((cardObject.cardBrand == "Mastercard" || cardObject.cardBrand == "Verve") &&
                    cardObject.cardLocale == "local"){ // card is a local mastercard or verve
                    // display the card atm pin input & enable it
                    $('.postcash-transfer-cash-card-hidden-info:eq(1)', utopiasoftware.saveup.controller.
                        transferCashCardPageViewModel.formValidator.$element).css("display", "block");
                    $('#transfer-cash-card-pin', utopiasoftware.saveup.controller.
                        transferCashCardPageViewModel.formValidator.$element).removeAttr("disabled");
                }
                else { // card is not a local mastercard or verve
                    // hide the card atm pin input & disable it
                    $('.postcash-transfer-cash-card-hidden-info:eq(1)', utopiasoftware.saveup.controller.
                        transferCashCardPageViewModel.formValidator.$element).css("display", "none");
                    $('#transfer-cash-card-pin', utopiasoftware.saveup.controller.
                        transferCashCardPageViewModel.formValidator.$element).attr("disabled", true);
                }

                // update the display of the updated fields
                Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input, autofill has been completed
                $('.postcash-preloader-transfer-cash-card-form-container', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "none");

            }).
            catch(function(){ // an error occurred OR user entered a card that has not be previously saved
                // display the verify card brand/locale checkbox
                $('.postcash-transfer-cash-card-hidden-info:eq(0)', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "block");
                // hide the card atm pin input & disable it
                $('.postcash-transfer-cash-card-hidden-info:eq(1)', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "none");
                $('#transfer-cash-card-pin', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).attr("disabled", true);

                // update the display of the updated fields
                Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input
                $('.postcash-preloader-transfer-cash-card-form-container', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "none");
            });
        },


        /**
         * method is triggered when the verify card type checkbox input is clicked
         *
         * @param inputElem
         */
        verifyCardTypeCheckboxClicked: function(inputElem){
            // find out if input checkbox is checked or not
            if($('#transfer-cash-card-verify-card-type', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).is(':checked')){ // the input was checked

                // display the card atm pin input & enable it
                $('.postcash-transfer-cash-card-hidden-info:eq(1)', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "block");
                $('#transfer-cash-card-pin', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).removeAttr("disabled");
            }
            else{ // the input was unchecked

                // hide the card atm pin input & disable it
                $('.postcash-transfer-cash-card-hidden-info:eq(1)', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "none");
                $('#transfer-cash-card-pin', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).attr("disabled", true);
            }

            // update the display of the updated field
            Materialize.updateTextFields();
        },


        /**
         * method is used to listen for scroll event of the page content
         *
         * @param event
         */
        pageContentScrolled: function(event){

            // set the current scrolltop position
            utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition = $(this).scrollTop();

            if(utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition >
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.previousScrollPosition){ // user scrolled up
                // set the current position as previous position
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition;

                // check if the user has scrolled at least 10px up
                if(utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition >= 10){
                    // the user scrolled at least 10px up
                    // check if the tab-bar is visible
                    if($('.transfer-cash-tabbar').last().get(0).visible == true){ // tab-bar is visible

                        $('.transfer-cash-tabbar').last().get(0).setTabbarVisibility(false); // hide the tab-bar
                    }
                }

                return;
            }

            if(utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition <
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.previousScrollPosition){ // user scrolled down
                // set the current position as previous position
                utopiasoftware.saveup.controller.transferCashCardPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.transferCashCardPageViewModel.currentScrollPosition;

                // check if the tabbar is hidden
                if($('.transfer-cash-tabbar').last().get(0).visible == false){ // tab-bar is hidden

                    $('.transfer-cash-tabbar').last().get(0).setTabbarVisibility(true); // show the tab-bar
                }

                return;
            }
        },

        /**
         * method is triggered when the recipient account number autocomplete input is changed
         *
         * @param inputElem
         */
        recipientAccountNumberChanged: function(inputElem){
            // display the preloaders that block input so certain card information can be autofilled
            $('.postcash-preloader-transfer-cash-card-form-container', utopiasoftware.saveup.controller.
                transferCashCardPageViewModel.formValidator.$element).css("display", "block");
            // split the input value so can can extract just the recipient account number
            var valueSplitArray = $(inputElem).val().split(" - ");
            //get the account number from the array
            var accountNumber = valueSplitArray.pop();
            // get the recipient account object from secure storage using the retrieved account number
            utopiasoftware.saveup.savedRecipientsBankAccountOperations.getSavedRecipientAccountByNumber(accountNumber).
            then(function(acctObject){
                // autofill the contents of the cash transfer form (recipient section) with the contents of recipient account object
                if(! acctObject){ // account object is null
                    throw "error";
                }

                $('#transfer-cash-card-choose-bank', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(acctObject.flutterwave_bankCode);
                $('#hidden-choose-bank-input', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).val(acctObject.flutterwave_bankCode);

                // remove any tooltip being displayed on the transfer cash form
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).removeAttr("data-hint");


                // update the display of the updated fields
                //Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input, autofill has been completed
                $('.postcash-preloader-transfer-cash-card-form-container', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "none");

            }).
            catch(function(){ // an error occurred OR user entered a recipient account that has not been previously saved

                // update the display of the updated fields
                //Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input
                $('.postcash-preloader-transfer-cash-card-form-container', utopiasoftware.saveup.controller.
                    transferCashCardPageViewModel.formValidator.$element).css("display", "none");
            });
        },


        transferCashCardAuthorizeProceed: function(){

            // change the content of the card authorisation iframe
            $('#transfer-cash-card-authorise-iframe').attr("src", "");
            $('#transfer-cash-card-authorise-iframe').attr("src", window.sessionStorage.getItem("transaction_authurl"));
            // show the modal that contains the iframe
            $('#transfer-cash-card-authorise-modal').get(0).show();
        }

    },

    /**
     * object is view-model for transfer-cash-bank page
     */
    transferCashBankPageViewModel: {

        /**
         * used to hold the parsley form validation object for the page
         */
        formValidator: null,

        /**
         * used to hold the parsley field validation object for the 'transfer amount' input
         */
        transferAmountFieldValidator: null,

        /**
         * property used to keep track of the immediate last scroll position of the
         * page content
         */
        previousScrollPosition: 0,

        /**
         * property used to keep track of the current scroll position of the
         * page content
         */
        currentScrollPosition: 0,


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // reset the previous & current scroll positions of the page contents
            utopiasoftware.saveup.controller.transferCashBankPageViewModel.previousScrollPosition = 0;
            utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition = 0;

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }


                // listen for the back button event
                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    // check which tab is active and navigate appropriately
                    if($('.transfer-cash-tabbar').get(0).getActiveTabIndex() == 0){ // the first tab is active
                        // navigate to the main menu
                        $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                    }
                    else{ // the second tab is active
                        // move the tab view to the Card tab
                        $('.transfer-cash-tabbar').get(0).setActiveTab(0, {animation: "slide"});
                    }

                };

                // listen for the scroll event of the page carousel content
                $('ons-carousel', $thisPage).on("scroll",
                    utopiasoftware.saveup.controller.transferCashBankPageViewModel.pageContentScrolled);

                // initialise the form validation objects.
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.transferAmountFieldValidator =
                    $('#transfer-cash-bank-amount', $thisPage).parsley({ // used solely for the transfer-cash-amount input
                        value: function(parsley) {
                            // convert the amount back to a plain text without the thousand separator
                            let parsedNumber = kendo.parseFloat($('#transfer-cash-bank-amount', $thisPage).val());
                            return (parsedNumber ? parsedNumber : $('#transfer-cash-bank-amount', $thisPage).val());
                        }
                    });

                utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator =
                    $('#transfer-cash-bank-form', $thisPage).parsley(); // used for the form in general


                // attach listener for the 'transfer cash' card button click
                $('#transfer-cash-bank-button', $thisPage).get(0).onclick = function(){
                    // run the validation method for the transfer-cash-bank form
                    utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator.whenValidate();
                };

                // listen for form field validation failure event
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for form field validation success event
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                });


                // listen for transfer-cash-Bank form validation success
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.transferCashBankPageViewModel.transferCashBankFormValidated);

                // initialise the sender account autocomplete widget
                utopiasoftware.saveup.bankAccountOperations.loadMyAccountsData().
                then(function(bankAcctArrayData){
                    var autoCompleteData = {}; // holds the data used to initialise the autocomplete widget
                    bankAcctArrayData.forEach(function(arrayElem){ // function to convert each array element to a format for autocomplete
                        autoCompleteData[arrayElem.bankAccountName + " - " +  arrayElem.bankAccountNumber] =
                            arrayElem.bankAccountAvatar;

                    });
                    // intialise widget
                    $('#transfer-cash-bank-sender-account-name.autocomplete', $thisPage).autocomplete({
                        data: autoCompleteData,
                        onAutocomplete: function(val) {
                            // callback function when value is autocompleted
                        },
                        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
                    });

                    // call the method to retrieve saved bank account recipient's used to populate recipient autocomplete widget
                    return utopiasoftware.saveup.savedRecipientsBankAccountOperations.loadSavedRecipientsAccountsData();

                }, function(){return [];}).
                then(function(savedRecipientsArray){
                    var autoCompleteData = {}; // holds the data used to initialise the autocomplete widget
                    savedRecipientsArray.forEach(function(arrayElem){ // function to convert each array element to a format for autocomplete
                        autoCompleteData[arrayElem.bankAccountName + " - " +  arrayElem.bankAccountNumber] =
                            arrayElem.bankAccountAvatar;

                    });
                    // initialise widget
                    $('#transfer-cash-bank-recipient-account-name.autocomplete', $thisPage).autocomplete({
                        data: autoCompleteData,
                        onAutocomplete: function(val) {
                            // Callback function when value is autcompleted.
                        },
                        minLength: 1 // The minimum length of the input for the autocomplete to start. Default: 1.
                    });
                    return Promise.all([utopiasoftware.saveup.filteredSenderBanksData(),
                        utopiasoftware.saveup.sortBanksData()]); // retrieve data for banks
                }, function(){return [[],[]];}).
                then(function(bankArrayData){
                    var optionTags = ""; // string to hold all created option tags

                    // get each object in bank array and use it to create the 'bank' select element
                    for(var index = 0; index < bankArrayData[0].length; index++){
                        var bankObject = bankArrayData[0][index]; // get the bank object
                        // update the banks select element option tags
                        for(var prop in bankObject){
                            optionTags += '<option value="' + prop + '">' + bankObject[prop] + '</option>';
                        }
                    }

                    $('#transfer-cash-bank-sender-choose-bank', $thisPage).append(optionTags); // append all the created option tags
                    // initialise the 'sender bank' select element
                    $('#transfer-cash-bank-sender-choose-bank', $thisPage).material_select();
                    return bankArrayData; // return at this point, so the page can continue initialisation
                }, function(){return [[],[]];}).
                then(function(bankArrayData){
                    var optionTags = ""; // string to hold all created option tags

                    // get each object in bank array and use it to create the 'bank' select element
                    for(var index = 0; index < bankArrayData[1].length; index++){
                        var bankObject = bankArrayData[1][index]; // get the bank object
                        // update the banks select element option tags
                        for(var prop in bankObject){
                            optionTags += '<option value="' + prop + '">' + bankObject[prop] + '</option>';
                        }
                    }

                    $('#transfer-cash-bank-recipient-choose-bank', $thisPage).append(optionTags); // append all the created option tags
                    // initialise the 'recipient bank' select element
                    $('#transfer-cash-bank-recipient-choose-bank', $thisPage).material_select();
                    return bankArrayData; // return at this point, so the page can continue initialisation
                }, function(){return null;}).
                then(function(){
                    var pageDataObject = $('#app-main-navigator').get(0).topPage.data; // get the data attached to this page

                    // check if the data contains recipient account details
                    if(pageDataObject && pageDataObject.recipient_details){ // recipient account details are present
                        // update the form details to contains the received recipient account details
                        $('#transfer-cash-bank-recipient-account-name', $thisPage).
                        val(pageDataObject.recipient_details.recipientAccountName + " - " +
                            pageDataObject.recipient_details.recipientAccount);
                        $('#transfer-cash-bank-recipient-choose-bank', $thisPage).
                        val(pageDataObject.recipient_details.recipientBankCode);
                        $('#hidden-choose-recipient-bank-input', $thisPage).
                        val(pageDataObject.recipient_details.recipientBankCode);
                    }

                    // check if the data contains sender account details
                    if(pageDataObject && pageDataObject.sender_details){
                        // update the form details to contain the received sender account details
                        $('#transfer-cash-bank-sender-account-name', $thisPage).
                        val(pageDataObject.sender_details.senderAccountName + " - " +
                            pageDataObject.sender_details.senderAccount);
                        $('#transfer-cash-bank-sender-choose-bank', $thisPage).
                        val(pageDataObject.sender_details.senderBankCode);
                        $('#hidden-choose-sender-bank-input', $thisPage).
                        val(pageDataObject.sender_details.senderBankCode);
                    }

                    // update the display of all the select element
                    $('select', $thisPage).material_select();
                    Materialize.updateTextFields(); // update the display of text input fields
                    return null; // return null to move to the next step
                }, function(){return null;}).
                then(function(){
                    // remove the progress indeterminate loader
                    $('.progress', $thisPage).remove();
                    // make the transfer-cash-bank form visible
                    $('#transfer-cash-bank-form', $thisPage).css("display", "block");
                    // enable the 'Cancel' & 'Transfer' buttons for the transfer-cash-bank form
                    $('#transfer-cash-bank-cancel-button-1, #transfer-cash-bank-button', $thisPage).removeAttr("disabled");
                    // hide the loader
                    $('#loader-modal').get(0).hide();
                }, function(){});

            }

        },

        /**
         * method is triggered when page is shown
         */
        pageShow: (event) => {
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);
        },

        /**
         * method is triggered when the page is hidden
         * @param event
         */
        pageHide: (event) => {
            var $thisPage = $(event.target); // get the current page shown
            try {
                // remove any tooltip being displayed on all forms on the page
                $('[data-hint]', $thisPage).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', $thisPage).removeAttr("data-hint");
                // reset the transfer-cash-bank form validator object on the page
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.transferAmountFieldValidator.reset();
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            var $thisPage = $(event.target); // get the current page shown
            try{
                // remove any tooltip being displayed on all forms on the page
                $('[data-hint]', $thisPage).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', $thisPage).removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.transferAmountFieldValidator.reset();
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.formValidator.destroy();
                // destroy the form inputs which need to be destroyed
                $('select', $thisPage).material_select('destroy');
                $('input.autocomplete', $thisPage).off();
                $('input.autocomplete', $thisPage).removeData();
            }
            catch(err){}
        },

        /**
         * method is triggered when transfer-cash-bank form is successfully validated
         */
        transferCashBankFormValidated: function(){

            // check if Internet Connection is available before proceeding
            if(navigator.connection.type === Connection.NONE){ // no Internet Connection
                // inform the user that they cannot proceed without Internet
                window.plugins.toast.showWithOptions({
                    message: "You cannot transfer cash without an active Internet Connection",
                    duration: 4500,
                    position: "top",
                    styling: {
                        opacity: 1,
                        backgroundColor: '#ff0000', //red
                        textColor: '#FFFFFF',
                        textSize: 14
                    }
                }, function(toastEvent){
                    if(toastEvent && toastEvent.event == "touch"){ // user tapped the toast, so hide toast immediately
                        window.plugins.toast.hide();
                    }
                });

                return; // exit method immediately
            }

            // confirm transfer-cash-card operation
            ons.notification.confirm({title: '<ons-icon icon="md-alert-triangle" size="36px" ' +
            'style="color: orange;"></ons-icon> Confirm Transfer',
                messageHTML: '<span>Cash transfers cannot be undone or reversed when completed. <br>' +
                'To securely complete cash transfers your banking authorization is required.<br>' +
                'Do you want to continue?</span>',
                cancelable: false,
                buttonLabels: ["No", "Yes"]
            }).
            then(function(buttonIndex){
                if(buttonIndex === 1){ // user wants to continue transfer
                    // display message to user
                    $('#loader-modal-message').html("Initiating Transfer...");
                    $('#loader-modal').get(0).show(); // show loader
                    // retrieve the necessary authorisation token
                    return utopiasoftware.saveup.moneyWaveObject.useToken;
                }
                else{ // user terminated transfer
                    throw null;
                }
            }).
            then(function(token){

                if(token === null){ // user already terminated transfer
                    throw null;
                }
                else{ // use retrieved token to initiate transfer

                    //create the cash transfer data
                    var cashTransferData = {
                        firstname: utopiasoftware.saveup.model.appUserDetails.firstName.split(" ")[0],
                        lastname: utopiasoftware.saveup.model.appUserDetails.lastName.split(" ")[0],
                        phonenumber: utopiasoftware.saveup.model.appUserDetails.phoneNumber_intlFormat,
                        email: (utopiasoftware.saveup.model.appUserDetails.firstName.split(" ")[0] +
                        utopiasoftware.saveup.model.appUserDetails.lastName.split(" ")[0]) + Date.now() + "@mymail.com",
                        apiKey: utopiasoftware.saveup.moneyWaveObject.key.apiKey,
                        medium: "mobile",
                        recipient: "wallet",
                        fee: utopiasoftware.saveup.model.fee + 45.00,
                        amount: kendo.parseFloat($('#transfer-cash-bank-amount', '#transfer-cash-bank-page').val())

                    };
                    // check if user want to transfer using any of the approve banks (apart from access bank)
                    if($('#transfer-cash-bank-sender-choose-bank', '#transfer-cash-bank-form').val() != "044"){
                        // user wants to transfer uding other banks NOT access bank
                        cashTransferData.charge_with = "ext_account";
                        cashTransferData.charge_auth = "INTERNETBANKING";
                        cashTransferData.sender_bank  =
                            $('#transfer-cash-bank-sender-choose-bank', '#transfer-cash-bank-form').val();
                        cashTransferData.redirecturl = "https://postcash.000webhostapp.com/transfer-cash-bank.html";
                    }

                    // initiate the cash transfer request
                    return new Promise(function(resolve, reject){
                        var cashTransferRequest = $.ajax(
                            {
                                url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/transfer",
                                type: "post",
                                contentType: "application/json",
                                beforeSend: function(jqxhr) {
                                    jqxhr.setRequestHeader("Authorization", token);
                                },
                                dataType: "json",
                                timeout: 240000, // wait for 4 minutes before timeout of request
                                processData: false,
                                data: JSON.stringify(cashTransferData)
                            }
                        );

                        // server responded to cash transfer request
                        cashTransferRequest.done(function(responseData){
                            if(responseData.status === "success"){ // the server responded with a successful transfer initiation
                                resolve(responseData); // resolve the cash transfer promise
                            }
                            else { // the server responded unsuccessfully
                                reject(responseData); // reject the cash transfer promise
                            }
                        });

                        // server responded with a failure to the cash transfer request
                        cashTransferRequest.fail(function(jqxhr){
                            if(jqxhr.status == 500){
                                reject(JSON.parse(jqxhr.responseText.trim()));
                            }
                            else{
                                reject(jqxhr.responseText.trim());
                            }
                        });
                    });
                }
            }).
            then(function(responseData){ // securely store the transaction history from the responseData on the user's device
                var transferRecipientDetailsArray = $('#transfer-cash-bank-recipient-account-name', '#transfer-cash-bank-page').
                val().split(" - "); // holds the details of the transfer recipient in an array gotten from the 'transfer-cash-bank-recipient-account-name' input

                responseData.data.transfer.postcash_transaction_type = "Cash Transfer (Bank)"; // set the postcash transaction type
                // set additional postcash transfer details
                responseData.data.transfer.postcash_transferDetails = {
                    narration: $('#transfer-cash-bank-narration', '#transfer-cash-bank-page').val(),
                    sender_bank: $('#transfer-cash-bank-sender-choose-bank', '#transfer-cash-bank-page').val(),
                    sender_account_number:
                        $('#transfer-cash-bank-sender-account-name', '#transfer-cash-bank-page').val().split(" - ").pop(),
                    recipient_bank: $('#transfer-cash-bank-recipient-choose-bank', '#transfer-cash-bank-page').val(),
                    recipient_account_name: transferRecipientDetailsArray.length >1 ?
                        transferRecipientDetailsArray[transferRecipientDetailsArray.length-2] : "",
                    recipient_account_number: transferRecipientDetailsArray.pop()
                };

                return Promise.all([utopiasoftware.saveup.transactionHistoryOperations.
                addTransactionHistory(responseData.data.transfer), Promise.resolve(responseData)]);
            }).
            then(function(responseDataArray){
                if(responseDataArray == null || responseDataArray[1] == null){ // user already terminated transfer
                    throw null;
                }

                var responseData = responseDataArray[1]; // retrieve the response from the server

                // update the display info for the bank transaction

                $('#transfer-cash-bank-authorize-amount', '#transfer-cash-bank-page').
                html(kendo.toString(kendo.parseFloat(responseData.data.transfer.amountToSend), "n2"));
                $('#transfer-cash-bank-authorize-fee', '#transfer-cash-bank-page').
                html(kendo.toString(kendo.parseFloat(responseData.data.transfer.chargedFee), "n2"));
                $('#transfer-cash-bank-authorize-total', '#transfer-cash-bank-page').
                html(kendo.toString(kendo.parseFloat(responseData.data.transfer.amountToCharge), "n2"));
                $('#transfer-cash-bank-authorize-message', '#transfer-cash-bank-page').
                html(responseData.data.transfer.flutterChargeResponseMessage);

                // store the transaction id & transaction reference in the session storage
                window.sessionStorage.setItem("transaction_id", responseData.data.transfer.id);
                window.sessionStorage.setItem("transaction_ref", responseData.data.transfer.flutterChargeReference);
                window.sessionStorage.setItem("transaction_authurl", responseData.data.authurl || "");

                // hide the transfer bottom-toolbar
                $('.transfer-cash-bank-page-bottom-toolbar-transfer-block').css("display", "none");

                // check whether to display the authorisation form OR inapp browser window
                if($('#transfer-cash-bank-sender-choose-bank', '#transfer-cash-bank-form').val() != "044"){ // NOT access bank

                    // hide the authorization form
                    $('#transfer-cash-bank-authorise-form', '#transfer-cash-bank-page').css("display", "none");
                    // disable the 'Authorize' button, show the bank authorise bottom toolbar & hide the pin authorise bottom toolbar
                    $('#transfer-cash-bank-authorise-button').attr("disabled", true);
                    $('.transfer-cash-bank-page-bottom-toolbar-authorize-bank-block').css("display", "block");
                    $('.transfer-cash-bank-page-bottom-toolbar-authorize-pin-block').css("display", "none");
                }
                else{ // display the authorization form
                    /*
                    $('#transfer-cash-card-authorise-form', '#transfer-cash-card-page').css("display", "block");
                    //  hide the authorization iframe
                    $('#transfer-cash-card-authorise-iframe', '#transfer-cash-card-page').css("display", "none");
                    // enable the 'Authorize' button, hide the otp authorise bottom toolbar & show the pin authorise bottom toolbar
                    $('#transfer-cash-card-authorise-button').removeAttr("disabled");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-otp-block').css("display", "none");
                    $('.transfer-cash-card-page-bottom-toolbar-authorize-pin-block').css("display", "block");
                    */
                }

                // update the transaction indicators
                $('.postcash-pay-progress .col:eq(0) span:eq(0)').
                removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                $('.postcash-pay-progress .col:eq(0) span:eq(1)').
                removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                $('.postcash-pay-progress .col:eq(1) span:eq(0)').
                removeClass('postcash-pay-progress-milestone').addClass('postcash-pay-progress-milestone-active');
                $('.postcash-pay-progress .col:eq(1) span:eq(1)').
                removeClass('postcash-pay-progress-milestone-text').addClass('postcash-pay-progress-milestone-text-active');

                // transition to 'authorize' block
                return $('.transfer-cash-bank-carousel').get(0).next({animation: 'none'});
            }).
            then(function(object){
                if(object == null){ // user already terminated transfer
                    throw null;
                }

                $('#loader-modal').get(0).hide(); // hide loader
            }).
            catch(function(error){

                $('#loader-modal').get(0).hide(); // hide loader
                if(error == null){ // the user decided NOT to proceed with the transfer
                    return; // do nothing
                }

                ons.notification.alert({title: "Cash Transfer Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>' + (error.data || "") + ' Sorry, your cash transfer failed. ' +
                    '<br>You can try again' + '</span>',
                    cancelable: true
                });

            });

        },


        /**
         * method is used to check authorization of a bank cash transfer.
         * The transfer is thereafter completed on the app's remote business logic container
         *
         */
        transferCashBankRemoteAuthorize: function(authorizationStage, authorizationResponseData){

            var secureToken = null; // holds the secure transaction token

            // check if user has completed stage 1 of transfer authorisation
            if(authorizationStage == "stage 1"){ // user completed stage 1 of transfer authorisation
                // display message to user
                $('#loader-modal-message').html("Checking Authorization... Please Wait");
                $('#loader-modal').get(0).show(); // show loader
                // hide the transfer-cash-authorise modal, but let the iframe continue authorisation process
                $('#transfer-cash-bank-authorise-modal').get(0).hide();
                // get the authorisation token
                utopiasoftware.saveup.moneyWaveObject.useToken.
                then(function(token){
                    secureToken = token; // assign the retrieved authorization token

                    // initiate the cash transfer authorisation check
                    return new Promise(function(resolve, reject){
                        var cashTransferAuthorisation = $.ajax(
                            {
                                url: utopiasoftware.saveup.moneyWaveObject.gateway + "v1/transfer/" +
                                window.sessionStorage.getItem("transaction_id"),
                                type: "post",
                                contentType: "application/json",
                                beforeSend: function(jqxhr) {
                                    jqxhr.setRequestHeader("Authorization", token);
                                },
                                dataType: "json",
                                timeout: 240000, // wait for 4 minutes before timeout of request
                                processData: false,
                                data: JSON.stringify({})
                            }
                        );

                        // server responded to cash transfer authorisation check
                        cashTransferAuthorisation.done(function(responseData){
                            if(responseData.status === "success" &&
                                (responseData.data.flutterChargeResponseMessage.toLocaleUpperCase().indexOf("APPROVED") > -1
                            || responseData.data.flutterChargeResponseMessage.toLocaleUpperCase().indexOf("SUCCESSFUL") > -1)){ // the server responded with a successful transfer authorisation

                                resolve(responseData); // resolve the cash transfer authorisation promise
                            }
                            else { // the server responded unsuccessfully
                                reject(responseData); // reject the cash transfer authorisation promise
                            }
                        });

                        // server responded with a failure to the cash authorisation check
                        cashTransferAuthorisation.fail(function(jqxhr){
                            reject(JSON.parse(jqxhr.responseText.trim()));
                        });
                    });
                }).
                then(function(responseData){ // send the server data to the postcash business logic container
                    var transferRecipientDetailsArray = $('#transfer-cash-bank-recipient-account-name', '#transfer-cash-bank-page').
                    val().split(" - "); // holds the details of the transfer recipient in an array gotten from the 'transfer-cash-bank-recipient-account-name' input

                    // create the data to be sent to the postcash business logic container
                    var transferData = {
                        transferData: responseData.data,
                        authorizationToken: secureToken,
                        postcash_fee: utopiasoftware.saveup.model.fee,
                        postcash_transferDetails: {
                            narration: $('#transfer-cash-bank-narration', '#transfer-cash-bank-page').val(),
                            sender_bank: $('#transfer-cash-bank-sender-choose-bank', '#transfer-cash-bank-page').val(),
                            sender_account_number:
                             $('#transfer-cash-bank-sender-account-name', '#transfer-cash-bank-page').val().split(" - ").pop(),
                            recipient_bank: $('#transfer-cash-bank-recipient-choose-bank', '#transfer-cash-bank-page').val(),
                            recipient_account_name: transferRecipientDetailsArray.length >1 ?
                                transferRecipientDetailsArray[transferRecipientDetailsArray.length-2] : "",
                            recipient_account_number: transferRecipientDetailsArray.pop()
                        }
                    };

                    // update the transaction history with the 'postcash_transferDetails' property and move the transferData object to the next phase
                    return Promise.
                    all([utopiasoftware.saveup.transactionHistoryOperations.
                    updateTransactionHistoryData(window.sessionStorage.getItem("transaction_ref"),
                        {postcash_transferDetails: transferData.postcash_transferDetails}),
                        Promise.resolve(transferData)]);
                }).
                then(function(transferDataArray){
                    // post the transfer data to the transfer authorization iframe for stage 2 processing
                    $('#transfer-cash-bank-authorise-modal #transfer-cash-bank-authorise-iframe').get(0).
                    contentWindow.postMessage(JSON.stringify(transferDataArray[1]), "https://postcash.000webhostapp.com");
                }).
                catch(function(error){
                    // update the transaction history for the cash transfer (bank) transaction to mark failure
                    utopiasoftware.saveup.transactionHistoryOperations.
                    updateTransactionHistoryData(window.sessionStorage.getItem("transaction_ref"), error).
                    then(function(){
                        return $('#loader-modal').get(0).hide(); // hide loader
                    }).
                    then(function(){

                       return ons.notification.alert({title: "Cash Transfer Failed",
                           messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                           'style="color: red;"></ons-icon> <span>' + (error.message || "") + ' Sorry, your cash transfer was not authorised. ' +
                           '<br>You can check this transaction status OR resend the cash transfer' + '</span>',
                           cancelable: true
                       });
                    }).
                    then(function(){
                        $('#app-main-navigator').get(0).resetToPage('main-menu-page.html');
                    }).catch(function(){
                        $('#loader-modal').get(0).hide();
                    });

                });
            }

            // check if user has completed stage 2 of transfer authorisation
            if(authorizationStage == "stage 2"){ // user has completed stage 2 of transfer authorisation
                // display message to user
                $('#loader-modal-message').html("Checking Authorization... Please Wait");
                $('#loader-modal').get(0).show(); // show loader

                Promise.resolve(authorizationResponseData).
                then(function(authorizationResponseData){ // process the response gotten from the authorization iframe
                    // check that the transfer was completed successfully
                    if(authorizationResponseData.walletToWallet.status == "success" &&
                        authorizationResponseData.walletToWallet.data.toLocaleUpperCase().indexOf("SUCCESSFUL") > -1 &&
                        authorizationResponseData.walletToAccount.status == "success" &&
                        authorizationResponseData.walletToAccount.data.data.responsemessage.toLocaleUpperCase().indexOf("SUCCESSFUL") > -1
                    ){
                        // cash transfer was successful
                        // update the transaction indicators
                        $('.postcash-pay-progress .col:eq(0) span:eq(0)').
                        removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                        $('.postcash-pay-progress .col:eq(0) span:eq(1)').
                        removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                        $('.postcash-pay-progress .col:eq(1) span:eq(0)').
                        removeClass('postcash-pay-progress-milestone-active').addClass('postcash-pay-progress-milestone');
                        $('.postcash-pay-progress .col:eq(1) span:eq(1)').
                        removeClass('postcash-pay-progress-milestone-text-active').addClass('postcash-pay-progress-milestone-text');

                        $('.postcash-pay-progress .col:eq(2) span:eq(0)').
                        removeClass('postcash-pay-progress-milestone').addClass('postcash-pay-progress-milestone-active');
                        $('.postcash-pay-progress .col:eq(2) span:eq(1)').
                        removeClass('postcash-pay-progress-milestone-text').addClass('postcash-pay-progress-milestone-text-active');

                        // hide ALL the bottom-toolbar blocks
                        $('.transfer-cash-bank-page-bottom-toolbar-transfer-block').css("display", "none");
                        $('.transfer-cash-bank-page-bottom-toolbar-authorize-bank-block').css("display", "none");
                        $('.transfer-cash-bank-page-bottom-toolbar-authorize-pin-block').css("display", "none");

                        // pass response data for onward processing, hide loader & move to the confirmation item on the carousel
                        return Promise.
                        all([authorizationResponseData, $('#loader-modal').get(0).hide(), $('.transfer-cash-bank-carousel').get(0).next({animation: 'none'})]);
                    }
                    else{
                        throw authorizationResponseData; // cash transfer could not be authorised
                    }
                }).
                then(function(dataArray){ // holds the business logic response

                    // update the transaction history for the cash transfer (bank) transaction to mark success
                    return utopiasoftware.saveup.transactionHistoryOperations.
                    updateTransactionHistoryData(window.sessionStorage.getItem("transaction_ref"), dataArray[0]);
                }).
                then(function(){
                    // show transaction confirmation modal
                    return $('#financial-operations-success-modal').get(0).show();
                }).
                then(function(){
                    // show the financial operations success modal after 1 second
                    window.setTimeout(function(){
                        $('#financial-operations-success-modal .circle').addClass("show");
                    }, 1000);
                }).
                catch(function(error){
                    // update the transaction history for the cash transfer (bank) transaction to mark failure
                    utopiasoftware.saveup.transactionHistoryOperations.
                    updateTransactionHistoryData(window.sessionStorage.getItem("transaction_ref"), error).
                    then(function(){
                        return $('#loader-modal').get(0).hide(); // hide loader
                    }).
                    then(function(){

                        return ons.notification.alert({title: "Cash Transfer Failed",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + (error.message || "") + ' Sorry, your cash transfer was not authorised. ' +
                            '<br>You can check this transaction status OR resend the cash transfer' + '</span>',
                            cancelable: true
                        });
                    }).
                    then(function(){
                        $('#app-main-navigator').get(0).resetToPage('main-menu-page.html');
                    }).catch(function(){
                        $('#loader-modal').get(0).hide();
                    });

                });

            }

        },

        /**
         * method is used to trigger the initiation of the Authorization process of
         * cash transfer with Bank Account
         */
        transferCashBankAuthorizeProceed: function(){

            // change the content of the bank authorisation iframe
            $('#transfer-cash-bank-authorise-iframe').attr("src", "");
            $('#transfer-cash-bank-authorise-iframe').attr("src", window.sessionStorage.getItem("transaction_authurl"));
            // show the modal that contains the modal
            $('#transfer-cash-bank-authorise-modal').get(0).show();
        },


        /**
         * method is used to listen for scroll event of the page content
         *
         * @param event
         */
        pageContentScrolled: function(event){

            // set the current scrolltop position
            utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition = $(this).scrollTop();

            if(utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition >
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.previousScrollPosition){ // user scrolled up
                // set the current position as previous position
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition;

                // check if the user has scrolled at least 10px up
                if(utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition >= 10){
                    // the user scrolled at least 10px up
                    // check if the tab-bar is visible
                    if($('.transfer-cash-tabbar').last().get(0).visible == true){ // tab-bar is visible

                        $('.transfer-cash-tabbar').last().get(0).setTabbarVisibility(false); // hide the tab-bar
                    }
                }

                return;
            }

            if(utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition <
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.previousScrollPosition){ // user scrolled down
                // set the current position as previous position
                utopiasoftware.saveup.controller.transferCashBankPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.transferCashBankPageViewModel.currentScrollPosition;

                // check if the tabbar is hidden
                if($('.transfer-cash-tabbar').last().get(0).visible == false){ // tab-bar is hidden

                    $('.transfer-cash-tabbar').last().get(0).setTabbarVisibility(true); // show the tab-bar
                }

                return;
            }
        },

        /**
         * method is triggered when the sender account number autocomplete input is changed
         *
         * @param inputElem
         */
        senderAccountNumberChanged: function(inputElem){
            // display the preloaders that block input so certain account information can be autofilled
            $('.postcash-preloader-transfer-cash-bank-form-container', utopiasoftware.saveup.controller.
                transferCashBankPageViewModel.formValidator.$element).css("display", "block");
            // split the input value so can can extract just the recipient account number
            var valueSplitArray = $(inputElem).val().split(" - ");
            //get the account number from the array
            var accountNumber = valueSplitArray.pop();
            // get the user account object from secure storage using the retrieved account number
            utopiasoftware.saveup.bankAccountOperations.getMyAccountByNumber(accountNumber).
            then(function(acctObject){
                // autofill the contents of the cash transfer form (sender section) with the contents of sender account object
                if(! acctObject){ // account object is null
                    throw "error";
                }

                $('#transfer-cash-bank-sender-choose-bank', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).val(acctObject.flutterwave_bankCode);
                $('#hidden-choose-sender-bank-input', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).val(acctObject.flutterwave_bankCode);

                // remove any tooltip being displayed on the transfer cash form
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).removeAttr("data-hint");


                // update the display of the updated fields
                //Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input, autofill has been completed
                $('.postcash-preloader-transfer-cash-bank-form-container', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).css("display", "none");

            }).
            catch(function(){ // an error occurred OR user entered a recipient account that has not been previously saved

                // update the display of the updated fields
                //Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input
                $('.postcash-preloader-transfer-cash-bank-form-container', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).css("display", "none");
            });
        },

        /**
         * method is triggered when the recipient account number autocomplete input is changed
         *
         * @param inputElem
         */
        recipientAccountNumberChanged: function(inputElem){
            // display the preloaders that block input so certain account information can be autofilled
            $('.postcash-preloader-transfer-cash-bank-form-container', utopiasoftware.saveup.controller.
                transferCashBankPageViewModel.formValidator.$element).css("display", "block");
            // split the input value so can can extract just the recipient account number
            var valueSplitArray = $(inputElem).val().split(" - ");
            //get the account number from the array
            var accountNumber = valueSplitArray.pop();
            // get the recipient account object from secure storage using the retrieved account number
            utopiasoftware.saveup.savedRecipientsBankAccountOperations.getSavedRecipientAccountByNumber(accountNumber).
            then(function(acctObject){
                // autofill the contents of the cash transfer form (recipient section) with the contents of recipient account object
                if(! acctObject){ // account object is null
                    throw "error";
                }

                $('#transfer-cash-bank-recipient-choose-bank', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).val(acctObject.flutterwave_bankCode);
                $('#hidden-choose-recipient-bank-input', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).val(acctObject.flutterwave_bankCode);

                // remove any tooltip being displayed on the transfer cash form
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('[data-hint]', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).removeAttr("data-hint");


                // update the display of the updated fields
                //Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input, autofill has been completed
                $('.postcash-preloader-transfer-cash-bank-form-container', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).css("display", "none");

            }).
            catch(function(){ // an error occurred OR user entered a recipient account that has not been previously saved

                // update the display of the updated fields
                //Materialize.updateTextFields();
                $('select', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).material_select();

                // hide the preloaders that block input
                $('.postcash-preloader-transfer-cash-bank-form-container', utopiasoftware.saveup.controller.
                    transferCashBankPageViewModel.formValidator.$element).css("display", "none");
            });
        }

    },


    /**
     * object is view-model for onboarding page
     */
    onboardingPageViewModel: {

        /**
         * method is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable");

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // if the onboarding-navigator is active
                if($('#onboarding-navigator').get(0) && $('#onboarding-navigator').get(0).topPage){
                    // set the flag to inform the app NOT to display Security Lock Modal
                    $('#onboarding-navigator').get(0).topPage.alwaysShowSecurityLockModal = false;
                    // listen for the back button event
                    $('#onboarding-navigator').get(0).topPage.onDeviceBackButton = function(){
                        ons.notification.confirm('Do you want to close the app?', {title: 'Exit',
                                buttonLabels: ['No', 'Yes']}) // Ask for confirmation
                            .then(function(index) {
                                if (index === 1) { // OK button
                                    navigator.app.exitApp(); // Close the app
                                }
                            });
                    };
                }

                // if the app-main-navigator is active
                if($('#app-main-navigator').get(0) && $('#app-main-navigator').get(0).topPage){
                    // set the flag to inform the app NOT to display Security Lock Modal
                    $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = false;
                    // listen for the back button event
                    $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){
                        // check if the side menu is open
                        if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                            $('ons-splitter').get(0).left.close();
                            return; // exit the method
                        }

                        $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                    };
                }


                // initialise carousel
                $('#onboarding-carousel', $thisPage).carousel({dist: 0, fullWidth: true, indicators: true, noWrap: true});
                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },

        /**
         * method is triggered when page is shown
         */
        pageShow: function(){
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable");
        },

        /**
         * method is triggered when page is destroyed
         */
        pageDestroy: function(event){
            var $thisPage = $(event.target); // get the current page shown

            // destroy the carousel used for the onboarding slide
            $('#onboarding-carousel', $thisPage).off();
            $('#onboarding-carousel', $thisPage).removeData();
        },


        /**
         * method is used to move the onboarding presentation to the next slide
         *
         * @param buttonElem
         */
        nextSlideButtonClicked: function(buttonElem){
            $('#onboarding-carousel').carousel('next'); // move to the next slide
            // wait for the slide animation to complete
            setTimeout(function(){
                // check if this is the last slide in the presentation
                if($('.carousel-item.active').is('[href="#three!"]')){ // this is the last slide
                    $(buttonElem).css("display", "none"); // hide the Next button
                }
            }, 205);
        },


        /**
         * method is used to end the onboarding presentation
         */
        endButtonClicked: function(){

            // check if the user is currently logged in
            if(window.localStorage.getItem("app-status") && window.localStorage.getItem("app-status") != ""){ // user is logged in
                // load the main menu template
                $('ons-splitter').get(0).content.load("app-main-template");
            }
            else{ // user has NOT been logged in
                //set the first page to be displayed to be the login page
                $('ons-splitter').get(0).content.load("login-template");
            }

        }

    },

    transactionHistoryPageViewModel: {


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                };

                // register listener for the pull-to-refresh widget
                $('#transaction-history-pull-hook', $thisPage).on("changestate", function(event){

                    // check the state of the pull-to-refresh widget
                    switch (event.originalEvent.state){
                        case 'initial':
                            // update the displayed icon
                            $('#transaction-history-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-down" size="24px"></ons-icon>');
                            break;

                        case 'preaction':

                            $('#transaction-history-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-long-arrow-up" size="24px"></ons-icon>');
                            break;

                        case 'action':
                            $('#transaction-history-pull-hook-fab', event.originalEvent.pullHook).
                            html('<ons-icon icon="fa-repeat" size="24px" spin></ons-icon>');
                            break;
                    }
                });

                // add method to handle the loading action of the pull-to-refresh widget
                $('#transaction-history-pull-hook', $thisPage).get(0).onAction = function(loadingDone){
                    // disable pull-to-refresh widget till loading is done
                    $('#transaction-history-pull-hook', $thisPage).attr("disabled", true);

                    // load the user's transaction history data from the device secure store
                    utopiasoftware.saveup.transactionHistoryOperations.loadTransactionHistoryData().
                    then(function(transactionHistoryArray){ // the user's transaction history data array collection has been returned
                        if(transactionHistoryArray.length == 0){ // there are no transaction history data available
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#transaction-history-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#transaction-history-pull-hook', $thisPage).removeAttr("disabled");
                            // display a message to inform user that there are no transaction-history data available
                            $('#transaction-history-page-message', $thisPage).css("display", "block");
                            // hide the error message from displaying
                            $('#transaction-history-page-error', $thisPage).css("display", "none");
                            // hide the transaction-history-list from display
                            $('#transaction-history-list', $thisPage).css("display", "none");
                            // flag that loading is done
                            loadingDone();
                        }
                        else{ // there are transaction history data available
                            // empty the contents of the transaction history list
                            $('#transaction-history-list .transaction-history-items-container', $thisPage).html("");
                            // create the transaction history content
                            let transactionHistoryContent = `` ;

                            for(let index = 0; index < transactionHistoryArray.length; index++){ // append the stored transaction history to the "Transaction History" list

                                // check what type of postcash transaction it is
                                switch(transactionHistoryArray[index].postcash_transaction_type){
                                    case "Cash Transfer (Card)": // transaction type is "Cash Transfer (Card)"

                                        // create the transaction history content
                                        transactionHistoryContent +=
                                            `<ons-col width="25%" class="transaction-history-indicator-container">` ;
                                        if(transactionHistoryArray[index].flutterChargeResponseMessage.toLocaleUpperCase() != "APPROVED"){
                                            // transaction is pending
                                            transactionHistoryContent += `<span class="transaction-history-item-incomplete-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                            toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                            toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Incomplete</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].beneficiary.accountNumber + " - " +
                                            transactionHistoryArray[index].beneficiary.accountName}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                        }
                                        else{
                                            // transaction is successful
                                            transactionHistoryContent += `<span class="transaction-history-item-success-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                            toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                            toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Successful</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].beneficiary.accountNumber + " - " +
                                            transactionHistoryArray[index].beneficiary.accountName}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                        }
                                        break; // end of "Cash Transfer (Card)" transaction type

                                    case "Cash Transfer (Bank)": // transaction type is "Cash Transfer (Bank)"

                                        // create the transaction history content
                                        transactionHistoryContent +=
                                            `<ons-col width="25%" class="transaction-history-indicator-container">` ;
                                        if(!transactionHistoryArray[index].walletToWallet ||
                                            transactionHistoryArray[index].walletToWallet.status != "success" ||
                                            transactionHistoryArray[index].walletToWallet.data.
                                            toLocaleUpperCase().indexOf("SUCCESSFUL") < 0 ||
                                            !transactionHistoryArray[index].walletToAccount ||
                                            transactionHistoryArray[index].walletToAccount.status != "success" ||
                                            transactionHistoryArray[index].walletToAccount.data.
                                            data.responsemessage.toLocaleUpperCase().indexOf("SUCCESSFUL") < 0
                                        )
                                        {
                                            // transaction is pending
                                            transactionHistoryContent += `<span class="transaction-history-item-incomplete-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                            toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                            toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Incomplete</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].postcash_transferDetails.recipient_account_number +
                                            " " +
                                            transactionHistoryArray[index].postcash_transferDetails.recipient_account_name}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                        }
                                        else{
                                            // transaction is successful
                                            transactionHistoryContent += `<span class="transaction-history-item-success-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                            toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                            toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Successful</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].postcash_transferDetails.recipient_account_number +
                                            " " +
                                            transactionHistoryArray[index].postcash_transferDetails.recipient_account_name}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                        }
                                        break; // end of "Cash Transfer (Bank)" transaction type
                                }

                                // append the transaction history content to the "Transaction History" list
                                $('#transaction-history-list .transaction-history-items-container', $thisPage).
                                append(transactionHistoryContent);
                                transactionHistoryContent = ``; // reset the content in prepareation for another loop
                            }
                            // remove the page preloader progress bar
                            $('.progress', $thisPage).remove();
                            // display the help button
                            $('#transaction-history-help-1', $thisPage).css("display", "inline-block");
                            // enable the pull-to-refresh widget for the page
                            $('#transaction-history-pull-hook', $thisPage).removeAttr("disabled");
                            // hide message to inform user that there are no transaction history data available
                            $('#transaction-history-page-message', $thisPage).css("display", "none");
                            // hide the error message from displaying
                            $('#transaction-history-page-error', $thisPage).css("display", "none");
                            // display the transaction-history-list
                            $('#transaction-history-list', $thisPage).css("display", "block");
                            // flag that loading is done
                            loadingDone();
                        }
                    }).
                    catch(function(){ // an error occurred, so display the error message to the user
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#transaction-history-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#transaction-history-pull-hook', $thisPage).removeAttr("disabled");
                        // hide a message to inform user that there are no transaction history data available
                        $('#transaction-history-page-message', $thisPage).css("display", "none");
                        // display the error message to user
                        $('#transaction-history-page-error', $thisPage).css("display", "block");
                        // hide the transaction-history-list from display
                        $('#transaction-history-list', $thisPage).css("display", "none");
                        // flag that loading is done
                        loadingDone();
                    });
                };

                // load the user's transaction history data from the device secure store
                utopiasoftware.saveup.transactionHistoryOperations.loadTransactionHistoryData().
                then(function(transactionHistoryArray){ // the user's transaction history data array collection has been returned
                    if(transactionHistoryArray.length == 0){ // there are no transaction history data available
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#transaction-history-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#transaction-history-pull-hook', $thisPage).removeAttr("disabled");
                        // display a message to inform user that there are no transaction-history data available
                        $('#transaction-history-page-message', $thisPage).css("display", "block");
                        // hide the error message from displaying
                        $('#transaction-history-page-error', $thisPage).css("display", "none");
                        // hide the transaction-history-list from display
                        $('#transaction-history-list', $thisPage).css("display", "none");
                    }
                    else{ // there are transaction history data available
                        // empty the contents of the transaction history list
                        $('#transaction-history-list .transaction-history-items-container', $thisPage).html("");
                        // create the transaction history content
                        let transactionHistoryContent = `` ;

                        for(let index = 0; index < transactionHistoryArray.length; index++){ // append the stored transaction history to the "Transaction History" list

                            // check what type of postcash transaction it is
                            switch(transactionHistoryArray[index].postcash_transaction_type){
                                case "Cash Transfer (Card)": // transaction type is "Cash Transfer (Card)"

                                    // create the transaction history content
                                    transactionHistoryContent +=
                                        `<ons-col width="25%" class="transaction-history-indicator-container">` ;
                                    if(transactionHistoryArray[index].flutterChargeResponseMessage.toLocaleUpperCase() != "APPROVED"){
                                        // transaction is pending
                                        transactionHistoryContent += `<span class="transaction-history-item-incomplete-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                        toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                        toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Incomplete</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].beneficiary.accountNumber + " - " +
                                        transactionHistoryArray[index].beneficiary.accountName}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                    }
                                    else{
                                        // transaction is successful
                                        transactionHistoryContent += `<span class="transaction-history-item-success-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                        toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                        toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Successful</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].beneficiary.accountNumber + " - " +
                                        transactionHistoryArray[index].beneficiary.accountName}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                    }
                                    break; // end of "Cash Transfer (Card)" transaction type

                                case "Cash Transfer (Bank)": // transaction type is "Cash Transfer (Bank)"

                                    // create the transaction history content
                                    transactionHistoryContent +=
                                        `<ons-col width="25%" class="transaction-history-indicator-container">` ;
                                    if(!transactionHistoryArray[index].walletToWallet ||
                                        transactionHistoryArray[index].walletToWallet.status != "success" ||
                                        transactionHistoryArray[index].walletToWallet.data.
                                        toLocaleUpperCase().indexOf("SUCCESSFUL") < 0 ||
                                        !transactionHistoryArray[index].walletToAccount ||
                                        transactionHistoryArray[index].walletToAccount.status != "success" ||
                                        transactionHistoryArray[index].walletToAccount.data.
                                        data.responsemessage.toLocaleUpperCase().indexOf("SUCCESSFUL") < 0
                                    )
                                    {
                                        // transaction is pending
                                        transactionHistoryContent += `<span class="transaction-history-item-incomplete-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                        toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                        toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Incomplete</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].postcash_transferDetails.recipient_account_number +
                                        " " +
                                        transactionHistoryArray[index].postcash_transferDetails.recipient_account_name}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                    }
                                    else{
                                        // transaction is successful
                                        transactionHistoryContent += `<span class="transaction-history-item-success-indicator">
                                            </span><span class="transaction-history-item-time-indicator">
                                            ${kendo.
                                        toString(new Date(transactionHistoryArray[index].createdAt), "HH:mm yyyy-MM-dd")}</span></ons-col>
                                                <ons-col width="75%" class="transaction-history-content-container">
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Type
                                            </span>
                                            <span>
                                            ${transactionHistoryArray[index].postcash_transaction_type}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Amount (NGN)
                                            </span><span>
                                            ${kendo.
                                        toString(kendo.parseFloat(transactionHistoryArray[index].amountToCharge), "n2")}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span class="transaction-history-content-label">
                                            Transaction Status
                                            </span><span>Successful</span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <span  class="transaction-history-content-label">
                                            Beneficiary
                                            </span><span>
                                            ${transactionHistoryArray[index].postcash_transferDetails.recipient_account_number +
                                        " " +
                                        transactionHistoryArray[index].postcash_transferDetails.recipient_account_name}
                                            </span></div>
                                            <div style="font-size: 0.8em; width: 100%">
                                            <ons-button class="transaction-history-content-button"
                                                data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.saveDetailsButtonClicked(this)">
                                            Save Details
                                            </ons-button>
                                            <ons-button class="transaction-history-content-button"
                                            data-transaction-id="${transactionHistoryArray[index].flutterChargeReference}"
                                                onclick="utopiasoftware.saveup.controller.transactionHistoryPageViewModel.sendFeedbackButtonClicked(this)">
                                            Send Feedback
                                            </ons-button>
                                            </div></ons-col>`;
                                    }
                                    break; // end of "Cash Transfer (Bank)" transaction type
                            }

                            // append the transaction history content to the "Transaction History" list
                            $('#transaction-history-list .transaction-history-items-container', $thisPage).
                            append(transactionHistoryContent);
                            transactionHistoryContent = ``; // reset the content in prepareation for another loop
                        }
                        // remove the page preloader progress bar
                        $('.progress', $thisPage).remove();
                        // display the help button
                        $('#transaction-history-help-1', $thisPage).css("display", "inline-block");
                        // enable the pull-to-refresh widget for the page
                        $('#transaction-history-pull-hook', $thisPage).removeAttr("disabled");
                        // hide message to inform user that there are no transaction history data available
                        $('#transaction-history-page-message', $thisPage).css("display", "none");
                        // hide the error message from displaying
                        $('#transaction-history-page-error', $thisPage).css("display", "none");
                        // display the transaction-history-list
                        $('#transaction-history-list', $thisPage).css("display", "block");
                    }
                }).
                catch(function(){ // an error occurred, so display the error message to the user
                    // remove the page preloader progress bar
                    $('.progress', $thisPage).remove();
                    // display the help button
                    $('#transaction-history-help-1', $thisPage).css("display", "inline-block");
                    // enable the pull-to-refresh widget for the page
                    $('#transaction-history-pull-hook', $thisPage).removeAttr("disabled");
                    // hide a message to inform user that there are no transaction history data available
                    $('#transaction-history-page-message', $thisPage).css("display", "none");
                    // display the error message to user
                    $('#transaction-history-page-error', $thisPage).css("display", "block");
                    // hide the transaction-history-list from display
                    $('#transaction-history-list', $thisPage).css("display", "none");
                });

                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },


        /**
         * method is triggered when page is shown
         *
         * @param event
         */
        pageShow: function(event){
            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);

            // set the flag to inform the app to display Security Lock Modal
            $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = true;
        },

        /**
         * method is used to trigger the save transaction history details operation.
         * Transaction details are saved on the user's device as a png document/file
         *
         * @param buttonElem
         */
        saveDetailsButtonClicked: function(buttonElem){


            var fileContentBlob = null; // holds the blob content of the file to be stored on user's device
            var fileObj = null; // holds reference to File object used to store store file/document on user's device

            // inform user that transaction details are being saved
            // displaying the message
            $('#loader-modal-message').html("Saving Transaction Details...");
            $('#loader-modal').get(0).show().
            then(function(){
                // get the specific transaction history which is to be saved
                var transactionRef = $(buttonElem).attr("data-transaction-id");
                return utopiasoftware.saveup.transactionHistoryOperations.getTransactionHistoryById(transactionRef);
            }).
            then(function(transactionData){ // receive the requested transaction data
                if(!transactionData){ // no transaction data was found
                    throw {"message": "Transaction not found."};
                }

                return transactionData;
            }).
            then(function(transactionData){ // use the receive transaction data to create the necessary document/file DOM
                // empty the contents of the transaction-history-saver-container
                $('#transaction-history-saver-container').html("");

                var transactionHistoryDocContent = `<h3 style="text-align: center; min-width: 100%; width: 100%; margin-top: 1.5em;">
                PostCash Transaction Details</h3>
                <div style="text-align: right; min-width: 90%; max-width: 90%; width: 90%;">
                <span style="font-weight: bold; font-size: 1.5em">Transaction Date: </span>
                <span style="font-size: 1.5em">${kendo.
                toString(new Date(transactionData.createdAt), "HH:mm yyyy-MM-dd")}</span>
                </div>
                <table style="margin-top: 1.5em; border: 2px #000000 solid; min-width: 100%; width: 100%;">

                <tr>
                <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                Transaction Reference
                </td>
                <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                ${transactionData.flutterChargeReference}
                </td>
                </tr>`;

                // handle the content to be created based on the postcash transaction type
                switch(transactionData.postcash_transaction_type){
                    case "Cash Transfer (Card)": // transaction type is "Cash Transfer (Card)"

                        transactionHistoryDocContent += `<tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">` ;
                        if(transactionData.flutterChargeResponseMessage.toLocaleUpperCase() != "APPROVED"){
                            // transaction is pending
                            transactionHistoryDocContent += `Transaction Type </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.postcash_transaction_type}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Amount (NGN) </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${kendo.
                            toString(kendo.parseFloat(transactionData.amountToCharge), "n2")}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Status</td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            Incomplete
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Beneficiary </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.beneficiary.accountNumber + " - " +
                            transactionData.beneficiary.accountName}
                                            </td></tr></table>`;
                        }
                        else{
                            // transaction is successful
                            transactionHistoryDocContent += `Transaction Type </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.postcash_transaction_type}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Amount (NGN) </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${kendo.
                            toString(kendo.parseFloat(transactionData.amountToCharge), "n2")}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Status</td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            Successful
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Beneficiary </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.beneficiary.accountNumber + " - " +
                            transactionData.beneficiary.accountName}
                                            </td></tr></table>`;
                        }
                        break; // end of "Cash Transfer (Card)" transaction type

                    case "Cash Transfer (Bank)": // transaction type is "Cash Transfer (Bank)"

                        transactionHistoryDocContent += `<tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">` ;
                        if(!transactionData.walletToWallet ||
                            transactionData.walletToWallet.status != "success" ||
                            transactionData.walletToWallet.data.
                            toLocaleUpperCase().indexOf("SUCCESSFUL") < 0 ||
                            !transactionData.walletToAccount ||
                            transactionData.walletToAccount.status != "success" ||
                            transactionData.walletToAccount.data.
                            data.responsemessage.toLocaleUpperCase().indexOf("SUCCESSFUL") < 0
                        )
                        {
                            // transaction is pending
                            transactionHistoryDocContent += `Transaction Type </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.postcash_transaction_type}
                                            </td></tr>
                                             <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Amount (NGN)</td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${kendo.
                            toString(kendo.parseFloat(transactionData.amountToCharge), "n2")}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Status</td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            Incomplete
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Beneficiary </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.postcash_transferDetails.recipient_account_number +
                            " " +
                            transactionData.postcash_transferDetails.recipient_account_name}
                                            </td></tr></table>`;
                        }
                        else{
                            // transaction is successful
                            transactionHistoryDocContent += `Transaction Type </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.postcash_transaction_type}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Amount (NGN) </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${kendo.
                            toString(kendo.parseFloat(transactionData.amountToCharge), "n2")}
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Transaction Status</td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            Successful
                                            </td></tr>
                                            <tr>
                        <td style="min-width:30%; width:30%; font-size: 1.5em; font-weight: bold; border: 1px #000000 solid;">
                                            Beneficiary </td>
                                            <td style="min-width:70%; width:70%; font-size: 1.5em; border: 1px #000000 solid;">
                                            ${transactionData.postcash_transferDetails.recipient_account_number +
                            " " +
                            transactionData.postcash_transferDetails.recipient_account_name}
                                            </td></tr></table>`;
                        }
                        break; // end of "Cash Transfer (Bank)" transaction type
                }

                // append the generated content to the transaction-history-saver-container
                $('#transaction-history-saver-container').append(transactionHistoryDocContent);

                // convert the generate html content to a png image file/document
                return domtoimage.toBlob($('#transaction-history-saver-container').get(0),
                    {cacheBust: true, bgcolor: '#ffffff', width: 1880, height: 2908});
            }).
            then(function(blob){ // get the blob content
                fileContentBlob = blob; // assign blob content to the function variable

                return new Promise(function(resolve, reject){ // return the directory where to store the document/image
                    window.resolveLocalFileSystemURL(cordova.file.externalRootDirectory, resolve, reject);
                });
            }).
            then(function(directory){
                return new Promise(function(resolve, reject){ // return the created file which holds the image document
                    directory.getFile('PostCash-T-' + Date.now() + '.png', {create:true, exclusive: false}, resolve, reject);
                });
            }).
            then(function(file){ // get the file object
                fileObj = file; // assign the file object to the function variable

                return new Promise(function(resolve, reject){ // return the FileWriter object used to write content to the created file
                    file.createWriter(resolve, reject);
                });
            }).
            then(function(fileWriter){ // get the FileWriter object
                return new Promise(function(resolve, reject){
                    fileWriter.onwriteend = resolve;
                    fileWriter.onerror = reject;

                    fileWriter.write(fileContentBlob); // write the content of the blob to the file
                });
            }).
            then(function(){
                // empty the content of transaction-history-saver-container since file saving is completed
                $('#transaction-history-saver-container').html("");

                return $('#loader-modal').get(0).hide(); // hide loader
            }).
            then(function(){

                // set the flag to inform the app NOT to display Security Lock Modal
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = false;

                // open the saved document/image
                return new Promise(function(resolve, reject){
                    cordova.plugins.fileOpener2.open(
                        fileObj.toURL(),
                        "image/png",
                        {
                            error : reject,
                            success : resolve
                        }
                    );
                });
            }).
            then(function(){
                // display a toast message to let user know that file has been saved
                window.plugins.toast.showWithOptions({
                    message: "Transaction details saved to file",
                    duration: 6000, // 6000 ms
                    position: "top",
                    styling: {
                        opacity: 1,
                        backgroundColor: '#808080',
                        textColor: '#FFFFFF',
                        textSize: 14
                    }
                });
            }).
            catch(function(err){

                // set the flag to inform the app to display Security Lock Modal
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = true;

                // empty the content of transaction-history-saver-container since file saving could not complete
                $('#transaction-history-saver-container').html("");

                $('#loader-modal').get(0).hide(); // hide loader

                ons.notification.alert({title: "File Save Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>Sorry, the details of this transaction could not be saved to file. ' +
                    '<br>You can try again </span>',
                    cancelable: true
                });
            });


        },

        /**
         * method is used to trigger the "Send Feedback" operations when the
         * "Send Feedback" button is clicked
         *
         * @param buttonElem
         */
        sendFeedbackButtonClicked: function(buttonElem){

            // inform the user that they are about to share transaction details with the support team
            ons.notification.confirm({title: '<ons-icon icon="md-info" size="32px" ' +
            'style="color: blue;"></ons-icon> Privacy Notice',
                messageHTML: '<span>You are about to send details of your PostCash transaction to the PostCash support team. <br>' +
                'Do you want to continue?</span>',
                cancelable: false,
                buttonLabels: ["No", "Yes"]
            }).
            then(function(buttonIndex){
                if(buttonIndex === 1){ // user wants to continue sending feedback
                    // display message to user
                    $('#loader-modal-message').html("Preparing Feedback Form...");
                    return $('#loader-modal').get(0).show(); // show loader
                }
                else{ // user terminated action
                    throw null;
                }
            }).
            then(function(){
                // get the specific transaction history which is to be saved
                var transactionRef = $(buttonElem).attr("data-transaction-id");
                return utopiasoftware.saveup.transactionHistoryOperations.getTransactionHistoryById(transactionRef);
            }).
            then(function(transactionData){ // receive the requested transaction data
                if(!transactionData){ // no transaction data was found
                    throw {"message": "Transaction not found."};
                }

                return transactionData;
            }).
            then(function(transactionData){ // receive the transaction data

                // set the flag to inform the app NOT to display Security Lock Modal
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = false;

                return new Promise(function(resolve, reject){
                    // display the feedback form and attach the retrieved transaction data
                    hockeyapp.composeFeedback(resolve, reject, false, transactionData);
                });
            }).
            then(function(){
                $('#loader-modal').get(0).hide(); // hide loader
            }).
            catch(function(err){

                // set the flag to inform the app to display Security Lock Modal
                $('#app-main-navigator').get(0).topPage.alwaysShowSecurityLockModal = true;

                $('#loader-modal').get(0).hide(); // hide loader

                if(!err){ // if error is null, user terminated action
                    return;
                }

                ons.notification.alert({title: "Feedback Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>Sorry, feedback containing the PostCash transaction details could not be sent. ' +
                    '<br>You can try again </span>',
                    cancelable: true
                });
            });
        }

    },

    /**
     * object is view-model for settigs page
     */
    settingsPageViewModel: {

        /**
         * property used to keep track of the immediate last scroll position of the
         * page content
         */
        previousScrollPosition: 0,

        /**
         * property used to keep track of the current scroll position of the
         * page content
         */
        currentScrollPosition: 0,


        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');
            // disable the swipeable feature for the app splitter
            $('ons-splitter-side').removeAttr("swipeable", true);

            // reset the previous & current scroll positions of the page contents
            utopiasoftware.saveup.controller.settingsPageViewModel.previousScrollPosition = 0;
            utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition = 0;

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){

                    // check if the side menu is open
                    if($('ons-splitter').get(0).left.isOpen){ // side menu open, so close it
                        $('ons-splitter').get(0).left.close();
                        return; // exit the method
                    }

                    $('#app-main-navigator').get(0).resetToPage("main-menu-page.html");
                };

                // listen for when the 'always lock screen' switch 'change' event
                $('#settings-page #settings-always-lock-screen-switch').on("change", function(switchEvent){
                    // ask user for secure PIN before proceeding. secure pin MUST match
                    ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                        messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                        'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                        'Please enter your PostCash Secure PIN to proceed</span></div>',
                        cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                        submitOnEnter: true
                    }).
                    then(function(userInput){ // user has provided a secured PIN , now authenticate it
                        if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                            // save the user's lock screen settings
                            if(!utopiasoftware.saveup.model.appUserDetails.settings){ // settings object NOT created yet
                                // create the settings object
                                utopiasoftware.saveup.model.appUserDetails.settings = {};
                            }

                            // update the 'alwaysShowSecurityLockModal' settings property to the state of the ons-switch component
                            utopiasoftware.saveup.model.appUserDetails.settings.alwaysShowSecurityLockModal
                            = $('#settings-page #settings-always-lock-screen-switch').get(0).checked;

                            // save the user's updated settings
                            Promise.resolve(intel.security.secureData.
                            createFromData({"data": JSON.stringify(utopiasoftware.saveup.model.appUserDetails)})).
                            then(function(instanceId){
                                // store the cyphered data in secure persistent storage
                                Promise.resolve(
                                    intel.security.secureStorage.write({"id": "postcash-user-details", "instanceID": instanceId})
                                );
                            });
                        }
                        else{ // user authentication failed

                            if($('#settings-page #settings-always-lock-screen-switch').get(0).checked){ // switch was 'on', reverse it
                                $('#settings-page #settings-always-lock-screen-switch').removeAttr("checked"); // turn switch 'off'
                            }
                            else{ // switch was 'off', reverse it
                                $('#settings-page #settings-always-lock-screen-switch').attr("checked", true); // turn switch 'on'
                            }

                            ons.notification.alert({title: "Security Check",
                                messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                                'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                                cancelable: true
                            });
                        }
                    }).
                    catch(function(){});
                });

                // listen for the scroll event of the page content
                $('#settings-page .page__content').on("scroll", utopiasoftware.saveup.controller.settingsPageViewModel.pageContentScrolled);

                // update the settings page display
                if(! utopiasoftware.saveup.model.appUserDetails.settings ||
                    utopiasoftware.saveup.model.appUserDetails.settings.alwaysShowSecurityLockModal != false){ // user want switch 'on'
                    $('#settings-page #settings-always-lock-screen-switch').attr("checked", true); // turn switch 'on'
                }
                else { // user wants switch 'off'
                    $('#settings-page #settings-always-lock-screen-switch').removeAttr("checked"); // turn switch 'off'
                }

                // hide the preloader
                $('#settings-page .progress').css("visibility", "hidden");
                // hide the loader
                $('#loader-modal').get(0).hide();
            }

        },


        /**
         * method is triggered when page is shown
         *
         * @param event
         */
        pageShow: function(event){
            var $thisPage = $(event.target); // get the current page shown
            // enable the swipeable feature for the app splitter
            $('ons-splitter-side').attr("swipeable", true);
        },

        /**
         * method is used to listen for scroll event of the page content
         *
         * @param event
         */
        pageContentScrolled: function(event){

            // set the current scrolltop position
            utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition = $(this).scrollTop();

            if(utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition >
                utopiasoftware.saveup.controller.settingsPageViewModel.previousScrollPosition){ // user scrolled up
                // set the current position as previous position
                utopiasoftware.saveup.controller.settingsPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is <= height of page toolbar
                if((140 - utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition) <= 56){
                    // the header image left after scrolling is <= height of page toolbar
                    // check if the toolbar for the page has already been made opaque
                    if(this.isToolBarOpaque != true){ // toolbar has not been made opaque

                        $('#settings-page ons-toolbar').removeClass("toolbar--transparent"); // make the toolbar opaque
                        // also pin the help header on the page just below the toolbar
                        $('#settings-page ons-list-header').css(
                            {"display": "block", "position": "fixed", "top": "56px", "width": "100%"});
                        this.isToolBarOpaque = true; // flag that toolbar has been made opaque
                    }
                }

                return;
            }

            if(utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition <
                utopiasoftware.saveup.controller.settingsPageViewModel.previousScrollPosition){ // user scrolled down
                // set the current position as previous position
                utopiasoftware.saveup.controller.settingsPageViewModel.previousScrollPosition =
                    utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition;

                // check if the header image left after scrolling is > height of page toolbar
                if((140 - utopiasoftware.saveup.controller.settingsPageViewModel.currentScrollPosition) > 56){
                    // the header image left after scrolling is > height of page toolbar
                    // check if the toolbar for the page has already been made transparent
                    if(this.isToolBarOpaque == true){ // toolbar has NOT been made transparent

                        $('#settings-page ons-toolbar').addClass("toolbar--transparent"); // make the toolbar transparent
                        // also unpin the help header on the page from just below the toolbar
                        $('#settings-page ons-list-header').css({"display": "block", "position": "static", "top": "56px"});
                        this.isToolBarOpaque = false; // flag that toolbar has been made transparent
                    }
                }

                return;
            }
        },

        /**
         * method is used to listen for when the list
         * items in the settings menu is clicked
         *
         * @param label {String} label represents clicked list item in the settings menu
         * @param event {Event} event object for the click action
         */
        settingsMenuListClicked: function(label, event) {

            if(label == "update profile"){ // 'update profile' list item was clicked

                // ask user for secure PIN before proceeding. secure pin MUST match
                ons.notification.prompt({title: "Security Check", id: "pin-security-check", class: "utopiasoftware-no-style",
                    messageHTML: '<div><ons-icon icon="ion-lock-combination" size="24px" ' +
                    'style="color: #b388ff; float: left; width: 26px;"></ons-icon> <span style="float: right; width: calc(100% - 26px);">' +
                    'Please enter your PostCash Secure PIN to proceed</span></div>',
                    cancelable: true, placeholder: "Secure PIN", inputType: "number", defaultValue: "", autofocus: true,
                    submitOnEnter: true
                }).
                then(function(userInput){ // user has provided a secured PIN , now authenticate it
                    if(userInput === utopiasoftware.saveup.model.appUserDetails.securePin){ // authentication successful
                        $('#app-main-navigator').get(0).
                        pushPage("update-profile-page.html", {animation: "slide-md"}); // navigate
                    }
                    else{ // inform user that security check failed/user authentication failed
                        ons.notification.alert({title: "Security Check",
                            messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                            'style="color: red;"></ons-icon> <span>' + 'Security check failed. Invalid credentials' + '</span>',
                            cancelable: true
                        });
                    }
                }).
                catch(function(){});

                return;
            }

            if(label == "change secure pin"){ // 'change secure pin' list item was clicked

                return;
            }

            if(label == "always lock screen"){ // 'always lock screen' list item was clicked

                if($(event.target).closest('ons-switch').is('#settings-always-lock-screen-switch')){ // check if the user tapped directly on the switch component
                    // user clicked directly on the switch component, so just exit and let the the switch component 'change' event handler take care of it
                    return;
                }

                // check the current state of the switch component and reverse the state
                if($('#settings-page #settings-always-lock-screen-switch').get(0).checked){ // switch is 'on'
                    $('#settings-page #settings-always-lock-screen-switch').removeAttr("checked"); // turn switch 'off'
                }
                else{ // switch is 'off'
                    $('#settings-page #settings-always-lock-screen-switch').attr("checked", true); // turn switch 'on'
                }

                // manually trigger the 'change' event for the switch component
                $('#settings-page #settings-always-lock-screen-switch').trigger("change");

                return;
            }

        }
    },


    /**
     * object is view-model for update-profile page
     */
    updateProfilePageViewModel: {

        /**
         * used to hold the parsley form validation object for the form
         */
        formValidator: null,

        /**
         * event is triggered when page is initialised
         */
        pageInit: function(event){

            var $thisPage = $(event.target); // get the current page shown
            // find all onsen-ui input targets and insert a special class to prevent materialize-css from updating the styles
            $('ons-input input', $thisPage).addClass('utopiasoftware-no-style');

            // call the function used to initialise the app page if the app is fully loaded
            loadPageOnAppReady();

            //function is used to initialise the page if the app is fully ready for execution
            function loadPageOnAppReady(){
                // check to see if onsen is ready and if all app loading has been completed
                if(!ons.isReady() || utopiasoftware.saveup.model.isAppReady === false){
                    setTimeout(loadPageOnAppReady, 500); // call this function again after half a second
                    return;
                }

                // listen for the back button event
                $('#app-main-navigator').get(0).topPage.onDeviceBackButton = function(){
                    // move to the previous page on the stack
                    $('#app-main-navigator').get(0).popPage({});
                };

                // initialise the update-profile form validation
                utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator = $('#update-profile-form').parsley();

                // attach listener for the update profile button on the page
                $('#update-profile-button').get(0).onclick = function(){
                    // run the validation method for the update profile form
                    utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator.whenValidate();
                };

                // listen for log in form field validation failure event
                utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).parent().find('label:eq(0)').addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for form field validation success event
                utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).parent().find('label:eq(0)').removeAttr("data-hint");
                });

                // listen for form validation success
                utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.updateProfilePageViewModel.updateProfileFormValidated);

                // update the contents of the update form with the available user details
                $('#update-profile-first-name', $thisPage).val(utopiasoftware.saveup.model.appUserDetails.firstName);
                $('#update-profile-last-name', $thisPage).val(utopiasoftware.saveup.model.appUserDetails.lastName);
                if(utopiasoftware.saveup.model.appUserDetails.email && utopiasoftware.saveup.model.appUserDetails.email != ""){
                    $('#update-profile-email', $thisPage).val(utopiasoftware.saveup.model.appUserDetails.email);
                }

                // update the input field display for the form
                Materialize.updateTextFields();

                // hide the preloader
                $('.progress', $thisPage).remove();
                // enable the 'update profile' button
                $('#update-profile-button', $thisPage).removeAttr("disabled");
                // hide the loader
                $('#loader-modal').get(0).hide();

            }

        },

        /**
         * method is triggered when the page is hidden
         * @param event
         */
        pageHide: (event) => {
            try {
                // remove any tooltip being displayed on all forms on the page
                $('#update-profile-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#update-profile-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object on the page
                utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms on the page
                $('#update-profile-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#update-profile-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects on the page
                utopiasoftware.saveup.controller.updateProfilePageViewModel.formValidator.destroy();
            }
            catch(err){}
        },

        /**
         * method is triggered when the form is successfully validated
         */
        updateProfileFormValidated: function(){

            // display the loader message to indicate that account is being created;
            $('#loader-modal-message').html("Updating User Profile...");
            Promise.resolve($('#loader-modal').get(0).show()). // show loader.
            then(function(){

                // update the app user details object and persist it
                utopiasoftware.saveup.model.appUserDetails.firstName =
                    $('#update-profile-form #update-profile-first-name').val();
                utopiasoftware.saveup.model.appUserDetails.lastName =
                    $('#update-profile-form #update-profile-last-name').val();

                if($('#update-profile-form #update-profile-email').val() != ""){ // check if user has entered an email
                    utopiasoftware.saveup.model.appUserDetails.email =
                        $('#update-profile-form #update-profile-email').val();
                }

                return utopiasoftware.saveup.model.appUserDetails; // return the updated profile details, so it can be persisted
            }).
            then(function(appUserDetails){
                // create a cypher data of the user details
                return Promise.resolve(intel.security.secureData.
                createFromData({"data": JSON.stringify(appUserDetails)}));
            }).
            then(function(instanceId){
                // store the cyphered data in secure persistent storage
                return Promise.resolve(
                    intel.security.secureStorage.write({"id": "postcash-user-details", "instanceID": instanceId})
                );
            }).
            then(function(){
                $('#loader-modal').get(0).hide(); // hide loader
                // set app-status local storage (as user phone number)
                window.localStorage.setItem("app-status", utopiasoftware.saveup.model.appUserDetails.phoneNumber);
                // update the first name being displayed in the side menu
                $('#side-menu-username').html(utopiasoftware.saveup.model.appUserDetails.firstName);
                // show a toast informing user that account has been created
                Materialize.toast('Profile updated', 4000);
            }).
            catch(function(err){

                $('#loader-modal').get(0).hide(); // hide loader
                ons.notification.alert({title: "Profile Update Failed",
                    messageHTML: '<ons-icon icon="md-close-circle-o" size="30px" ' +
                    'style="color: red;"></ons-icon> <span>sorry, your profile could not be updated.<br> You can try again</span>',
                    cancelable: false
                });
            });
        }

    }
};
