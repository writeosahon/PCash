/**
 * Created by UTOPIA SOFTWARE on 19/04/2017.
 */

/**
 * file contains the model data of the app.
 *
 * The 'utopiasoftware.saveup' namespace has being defined in the base js file.
 *
 * The author uses the terms 'method' and function interchangeably; likewise the terms 'attribute' and 'property' are
 * also used interchangeably
 */

// define the model namespace
utopiasoftware.saveup.model = {

    /**
     * property acts as a flag that indicates that all hybrid plugins and DOM content
     * have been successfully loaded. It relies on the special device ready event triggered by the
     * intel xdk (i.e. app.Ready) to set the flag.
     *
     * @type {boolean} flag for if the hybrid plugins and DOM content are ready for execution
     */
    isAppReady: false,

    /**
     * property holds the UUID for the mobile device
     */
    deviceUUID: null,

    /**
     * holds details about the currently logged in user
     */
    appUserDetails: null
};

// register the event listener for when all Hybrid plugins and document DOM are ready
document.addEventListener("app.Ready", utopiasoftware.saveup.controller.appReady, false) ;

// listen for the initialisation of the Sign-In page
$(document).on("init", "#sign-in-page", utopiasoftware.saveup.controller.signInPageViewModel.pageInit);

// listen for the hide event of the Sign-In page
$(document).on("hide", "#sign-in-page", utopiasoftware.saveup.controller.signInPageViewModel.pageHide);

// listen for the destroy event of the Sign-In page
$(document).on("destroy", "#sign-in-page", utopiasoftware.saveup.controller.signInPageViewModel.pageDestroy);

// listen for the initialisation of the Create Account page
$(document).on("init", "#create-account-page", utopiasoftware.saveup.controller.createAccountPageViewModel.pageInit);

// listen for the hide event of the Create Account page
$(document).on("hide", "#create-account-page", utopiasoftware.saveup.controller.createAccountPageViewModel.pageHide);

// listen for the destroy event of the Create Account page
$(document).on("destroy", "#create-account-page", utopiasoftware.saveup.controller.createAccountPageViewModel.pageDestroy);

// listen for the initialisation of the Reset-Pin page
$(document).on("init", "#reset-pin-page", utopiasoftware.saveup.controller.resetPinPageViewModel.pageInit);

// listen for the hide event of the Reset-Pin page
$(document).on("hide", "#reset-pin-page", utopiasoftware.saveup.controller.resetPinPageViewModel.pageHide);

// listen for the destroy event of the Reset-Pin page
$(document).on("destroy", "#reset-pin-page", utopiasoftware.saveup.controller.resetPinPageViewModel.pageDestroy);

// listen for the initialisation of the Onboarding page
$(document).on("init", "#onboarding-page", utopiasoftware.saveup.controller.onboardingPageViewModel.pageInit);

// listen for the initialisation of the Main-Menu page
$(document).on("init", "#main-menu-page", utopiasoftware.saveup.controller.mainMenuPageViewModel.pageInit);

// listen for the initialisation of the Join-Savings Group page
$(document).on("init", "#join-savings-group-page", utopiasoftware.saveup.controller.joinSavingsGroupsViewModel.pageInit);