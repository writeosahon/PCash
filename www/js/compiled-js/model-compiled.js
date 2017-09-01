"use strict";

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
  appUserDetails: null,

  /**
   * holds the merchant fee for transactions
   */
  fee: 20.00
};

// register the event listener for when all Hybrid plugins and document DOM are ready
document.addEventListener("app.Ready", utopiasoftware.saveup.controller.appReady, false);

// register listener for when the Pin-Security-Check Prompt dialog is just about to be shown
$(document).on("preshow", "#pin-security-check", utopiasoftware.saveup.controller.pinSecurityCheckPreShow);

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

// listen for the initialisation of the Main-Menu page
$(document).on("init", "#main-menu-page", utopiasoftware.saveup.controller.mainMenuPageViewModel.pageInit);

// listen for when the Main-Menu page is shown
$(document).on("show", "#main-menu-page", utopiasoftware.saveup.controller.mainMenuPageViewModel.pageShow);

// listen for the initialisation of the Verify Account page
$(document).on("init", "#verify-account-page", utopiasoftware.saveup.controller.verifyAccountPageViewModel.pageInit);

// listen for the hide event of the Verify Account page
$(document).on("hide", "#verify-account-page", utopiasoftware.saveup.controller.verifyAccountPageViewModel.pageHide);

// listen for the destroy event of the Verify Account page
$(document).on("destroy", "#verify-account-page", utopiasoftware.saveup.controller.verifyAccountPageViewModel.pageDestroy);

// listen for the initialisation of the My Cards page
$(document).on("init", "#my-cards-page", utopiasoftware.saveup.controller.myCardsPageViewModel.pageInit);

// listen for when the My Cards page is shown
$(document).on("show", "#my-cards-page", utopiasoftware.saveup.controller.myCardsPageViewModel.pageShow);

// listen for the initialisation of the Add Card page
$(document).on("init", "#add-card-page", utopiasoftware.saveup.controller.addCardPageViewModel.pageInit);

// listen for the hide event of the Add Card page
$(document).on("hide", "#add-card-page", utopiasoftware.saveup.controller.addCardPageViewModel.pageHide);

// listen for the destroy event of the Add Card page
$(document).on("destroy", "#add-card-page", utopiasoftware.saveup.controller.addCardPageViewModel.pageDestroy);

// listen for the initialisation of the My Accounts page
$(document).on("init", "#my-accounts-page", utopiasoftware.saveup.controller.myAccountsPageViewModel.pageInit);

// listen for when the My Accounts page is shown
$(document).on("show", "#my-accounts-page", utopiasoftware.saveup.controller.myAccountsPageViewModel.pageShow);

// listen for the initialisation of the Add Account page
$(document).on("init", "#add-account-page", utopiasoftware.saveup.controller.addAccountPageViewModel.pageInit);

// listen for the hide event of the Add Account page
$(document).on("hide", "#add-account-page", utopiasoftware.saveup.controller.addAccountPageViewModel.pageHide);

// listen for the destroy event of the Add Account page
$(document).on("destroy", "#add-account-page", utopiasoftware.saveup.controller.addAccountPageViewModel.pageDestroy);

// listen for the initialisation of the Saved Recipients page
$(document).on("init", "#saved-recipients-page", utopiasoftware.saveup.controller.savedRecipientsPageViewModel.pageInit);

// listen for when the Saved Recipients page is shown
$(document).on("show", "#saved-recipients-page", utopiasoftware.saveup.controller.savedRecipientsPageViewModel.pageShow);

// listen for the initialisation of the Add Recipient page
$(document).on("init", "#add-recipient-page", utopiasoftware.saveup.controller.addRecipientPageViewModel.pageInit);

// listen for the hide event of the Add Recipient page
$(document).on("hide", "#add-recipient-page", utopiasoftware.saveup.controller.addRecipientPageViewModel.pageHide);

// listen for the destroy event of the Add Recipient page
$(document).on("destroy", "#add-recipient-page", utopiasoftware.saveup.controller.addRecipientPageViewModel.pageDestroy);

// listen for the initialisation of the Transfer-Cash-Card page
$(document).on("init", "#transfer-cash-card-page", utopiasoftware.saveup.controller.transferCashCardPageViewModel.pageInit);

// listen for when the Transfer-Cash-Card page is shown
$(document).on("show", "#transfer-cash-card-page", utopiasoftware.saveup.controller.transferCashCardPageViewModel.pageShow);

// listen for the hide event of the Transfer-Cash-Card page
$(document).on("hide", "#transfer-cash-card-page", utopiasoftware.saveup.controller.transferCashCardPageViewModel.pageHide);

// listen for the destroy event of the Transfer-Cash-Card page
$(document).on("destroy", "#transfer-cash-card-page", utopiasoftware.saveup.controller.transferCashCardPageViewModel.pageDestroy);

// listen for the initialisation of the Transfer-Cash-Bank page
$(document).on("init", "#transfer-cash-bank-page", utopiasoftware.saveup.controller.transferCashBankPageViewModel.pageInit);

// listen for when the Transfer-Cash-Bank page is shown
$(document).on("show", "#transfer-cash-bank-page", utopiasoftware.saveup.controller.transferCashBankPageViewModel.pageShow);

// listen for the hide event of the Transfer-Cash-Bank page
$(document).on("hide", "#transfer-cash-bank-page", utopiasoftware.saveup.controller.transferCashBankPageViewModel.pageHide);

// listen for the destroy event of the Transfer-Cash-Bank page
$(document).on("destroy", "#transfer-cash-bank-page", utopiasoftware.saveup.controller.transferCashBankPageViewModel.pageDestroy);

// listen for the initialisation of the Onboarding page
$(document).on("init", "#onboarding-page", utopiasoftware.saveup.controller.onboardingPageViewModel.pageInit);

// listen for when the Onboarding page is shown
$(document).on("show", "#onboarding-page", utopiasoftware.saveup.controller.onboardingPageViewModel.pageShow);

// listen for the destroy event of the Onboarding page
$(document).on("destroy", "#onboarding-page", utopiasoftware.saveup.controller.onboardingPageViewModel.pageDestroy);

// listen for the initialisation of the Transaction History page
$(document).on("init", "#transaction-history-page", utopiasoftware.saveup.controller.transactionHistoryPageViewModel.pageInit);

// listen for when the Transaction History page is shown
$(document).on("show", "#transaction-history-page", utopiasoftware.saveup.controller.transactionHistoryPageViewModel.pageShow);

// listen for the initialisation of the Settings page
$(document).on("init", "#settings-page", utopiasoftware.saveup.controller.settingsPageViewModel.pageInit);

// listen for when the Settings page is shown
$(document).on("show", "#settings-page", utopiasoftware.saveup.controller.settingsPageViewModel.pageShow);

//# sourceMappingURL=model-compiled.js.map