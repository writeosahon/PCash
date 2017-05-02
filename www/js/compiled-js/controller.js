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

            // check if the user has previously logged in to the app
            if (!window.localStorage.getItem("app-status") || window.localStorage.getItem("app-status") == "") { // user has not logged in
                //set the first page to be displayed to be the login page
                $('ons-splitter').get(0).content.load("login-template");
            }
            else { // user is already logged in
                // load the main tabbar for the app
                $('ons-splitter').get(0).content.load("laundry-mart-tabbar-template");

                // enable the swipeable feature for the app splitter
                $('ons-splitter-side').attr("swipeable", true);
            }

        });

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

        // set app ready flag to true
        utopiasoftware.saveup.model.isAppReady = true;
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
        signinFormValidated: function(){},

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
                // display the loader message to indicate that account is being created;
                $('#loader-modal-message').html("Creating New Account...");
                $('#loader-modal').get(0).show(); // show loader
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
     * object is view-model for reset-pin page
     */
    resetPinPageViewModel: {

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

                // initialise the reset-pin form validation
                utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator = $('#reset-pin-form').parsley();

                // attach listener for the reset button on the reset-pin page
                $('#reset-pin-reset').get(0).onclick = function(){
                    // run the validation method for the sign-in form
                    utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator.whenValidate();
                };

                // listen for log in form field validation failure event
                utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator.on('field:error', function(fieldInstance) {
                    // get the element that triggered the field validation error and use it to display tooltip
                    // display tooltip
                    $(fieldInstance.$element).addClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).attr("data-hint", fieldInstance.getErrorsMessages()[0]);
                });

                // listen for log in form field validation success event
                utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator.on('field:success', function(fieldInstance) {
                    // remove tooltip from element
                    $(fieldInstance.$element).removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                    $(fieldInstance.$element).removeAttr("data-hint");
                });

                // listen for log in form validation success
                utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator.on('form:success',
                    utopiasoftware.saveup.controller.resetPinPageViewModel.resetPinFormValidated);

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
                // remove any tooltip being displayed on all forms in the page
                $('#reset-pin-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#reset-pin-page [data-hint]').removeAttr("data-hint");
                // reset the form validator object in the page
                utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator.reset();
            }
            catch(err){}
        },

        /**
         * method is triggered when the page is destroyed
         * @param event
         */
        pageDestroy: (event) => {
            try{
                // remove any tooltip being displayed on all forms in the page
                $('#reset-pin-page [data-hint]').removeClass("hint--always hint--info hint--medium hint--rounded hint--no-animate");
                $('#reset-pin-page [data-hint]').removeAttr("data-hint");
                // destroy the form validator objects in the page
                utopiasoftware.saveup.controller.resetPinPageViewModel.formValidator.destroy();
            }
            catch(err){}
        },

        /**
         * method is triggered when reset-pin form is successfully validated
         */
        resetPinFormValidated: function(){},

        /**
         * method is triggered when back to Sign In button is clicked
         */
        signInButtonClicked: function(){
            // move the tab view to the Sign In tab
            $('#login-tabbar').get(0).setActiveTab(0, {animation: "slide"});
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
            if(label == "join savings group"){ // 'join saving group' button was clicked

                $('#app-main-navigator').get(0).pushPage("join-savings-groups-page.html", {}); // navigate to the onboarding presentation

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

    }
};
