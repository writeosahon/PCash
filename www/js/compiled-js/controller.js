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
     * is triggered when ALL the hybrid app pluigins have been loaded/readied and also the document DOM content is ready
     */
    appReady: () => {

        // initialise the onsen library
        ons.ready(function () {
            // set the default handler for the app
            ons.setDefaultDeviceBackButtonListener(function(){
                console.log("DEFAULT BACK BUTTON LISTENER");

            });

            if(utopiasoftware.saveup.model.isAppReady === false){ // if app has not completed loading
                // displaying prepping message
                $('#loader-modal-message').html("Preparing App...");
                $('#loader-modal').get(0).show(); // show loader
            }

            //set the first page to be displayed to be the login page
            $('ons-splitter').get(0).content.load("login-template");

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

        });

        /** ADD CUSTOM VALIDATORS FOR PARSLEY HERE **/
        Parsley.addAsyncValidator("financialcardcheck",
            utopiasoftware.saveup.controller.addCardPageViewModel.financialCardValidator,
            utopiasoftware.saveup.paystackObject.gateway + 'decision/bin/{value}');

        /** CUSTOM VALIDATORS FOR PARSLEY ENDS **/

        // add listener for when the Internet network connection is offline
        document.addEventListener("offline", function(){

            // display a toast message to let user no there is no Internet connection
            window.plugins.toast.showWithOptions({
                message: "No Internet Connection. App functionality may be limited",
                duration: 4000, // 2000 ms
                position: "bottom",
                styling: {
                    opacity: 1,
                    backgroundColor: '#000000',
                    textColor: '#FFFFFF',
                    textSize: 14
                }
            });

        }, false);

        try {
            // lock the orientation of the device to 'PORTRAIT'
            screen.lockOrientation('portrait');
        }
        catch(err){}

        // set status bar color
        StatusBar.backgroundColorByHexString("#000000");

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
                    $('#app-main-navigator').get(0).bringPageTop("transfer-cash-page.html", {}); // navigate to the transfer cash page
                }).catch(function(){});

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

            if(label == "intro"){ // intro button was clicked

                // close the side menu
                $('ons-splitter').get(0).left.close().
                then(function(){
                    $('ons-splitter').get(0).content.load("onboarding-template"); // navigate to the onboarding presentation
                }).catch(function(){});

                return;
            }
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

            if(($('#login-form #user-phone').val() === utopiasoftware.saveup.model.appUserDetails.phoneNumber) &&
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
            then(function(){

                return null;
                //return utopiasoftware.saveup.validatePhoneNumber($('#create-phone').val());
            }).
            then(function(){
                // display the loader message to indicate that account is being created;
                $('#loader-modal-message').html("Completing Sign Up...");
                $('#loader-modal').get(0).show(); // show loader

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
            }).// TODO DON'T FORGET TO DESTROY ALL USER STORED DATA BEFORE CREATING NEW ACCOUNT. VERY IMPORTANT!!
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
         * method is used to listen for click events of the main menu items
         *
         * @param label
         */
        mainMenuButtonsClicked: function(label){
            if(label == "transfer cash"){ // 'transfer cash' button was clicked

                $('#app-main-navigator').get(0).pushPage("transfer-cash-page.html", {}); // navigate to the transfer cash page

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

            if(label == "intro"){ // intro button was clicked

                $('ons-splitter').get(0).content.load("onboarding-template"); // navigate to the onboarding presentation

                return;
            }
        }

    },

    /**
     * object is view-model for join-savings-groups page
     */
    joinSavingsGroupsViewModel: {

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
                    $('#app-main-navigator').get(0).popPage({refresh: false});
                };

                // initilise the select element
                $('#join-savings-group-choose-group', $thisPage).material_select();

                // initialise the create-account form validation
                utopiasoftware.saveup.controller.joinSavingsGroupsViewModel.formValidator = $('#create-account-form').parsley();

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
         * method is triggered when sign-in form is successfully validated
         */
        createAccountFormValidated: function(){

            // tell the user that phoe number verification is necessary
            new Promise(function(resolve, reject){
                ons.notification.confirm('To complete account creation, your phone number must be verified. <br>' +
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
            then(function(){
                return null;
                //return utopiasoftware.saveup.validatePhoneNumber($('#create-phone').val());
            }).
            then(function(){
                $('ons-splitter').get(0).content.load("onboarding-template");
            }).
            catch(function(err){
                ons.notification.alert({title: "Account Creation Failed",
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
        verifyAcctBottomSheetListItemClicked: function(label){}

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
                                <ons-button modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;">
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
                            <ons-button modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;">
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
                            <ons-button modifier="quiet" disable-auto-styling class="right"
                                    style="color: #464646; padding:0; margin-top: 0.5em; margin-left: 1em; margin-right: 1em;">
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
            // card the utility method used to delete a specified card
            utopiasoftware.saveup.financialCardOperations.deleteCard($(buttonElem).attr("data-id")).
            then(function(){
                $(buttonElem).closest('.row').remove();
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
                        Materialize.toast('Card updated successfully', 4000);
                    }, 4000);
                }).
                catch(function(){
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
                        Materialize.toast('New card added successfully', 4000);
                    }, 4000);
                }).
                catch(function(err){

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
            }
            else{ // user does not want card number remotely validated
                // remove attributes to prevent remote card number validation
                $('#add-card-card-number').removeAttr("data-parsley-remote-validator");
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

    }
};
