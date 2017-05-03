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
    saveup : {

        /**
         * method is used to verify a user's phone number. it returns a Promise object. a resolved promise
         * means the phone number was verified; a rejected promise means phone number verification failed.
         *
         * @param phoneNumber
         * @returns {Promise}
         */
        validatePhoneNumber: function(phoneNumber){

            phoneNumber = "" + phoneNumber; // ensure phone number is seen as a string

            var smsWatcherTimer = null; // holds the timer used to stop the sms watcher

            var rejectPromise = null;

            if(phoneNumber.startsWith("0")){ // the phone number starts with 0, replace it with international dialing code
                phoneNumber = phoneNumber.replace("0", "+234");
            }
            // show a loader message
            $('#phone-verification-modal .modal-message').html("Verifying Phone Number...");
            $('#phone-verification-modal').get(0).show(); // show loader

            // create the Promise object which will indicate if a phone was verified or not
            var phoneNumberVerifiedPromise = new Promise(function(resolve, reject){
                rejectPromise = reject;
                var randomNumber = ""; //holds the random number to be sent in the sms

                // start listening to the user's sms inbox
                new Promise(function(resolve2, reject2){
                    SMS.startWatch(resolve2, reject2);
                }).
                then(function(){ // sms watch of the user's inbox has been started
                    // add listener for new arriving sms
                    document.addEventListener('onSMSArrive', function(smsEvent){
                        console.log("GOT SMS");
                        var sms = smsEvent.data;
                        console.log("DATA", sms);
                        if(sms.address == phoneNumber && sms.body == "PostCash " + randomNumber){
                            console.log("SMS VERIFIED");
                            clearTimeout(smsWatcherTimer); // stop the set timer
                            SMS.stopWatch(function(){}, function(){}); // stop sms watch
                            document.removeEventListener('onSMSArrive'); // remove sms arrival listener
                            $('#phone-verification-modal').get(0).hide(); // hide loader
                            resolve(); // resolve promise
                        }
                    });
                    // return a Promise object whaich sends sms to the phoneNumber parameter
                    return new Promise(function(resolve3, reject3){

                        var randomGen = new Random(Random.engines.nativeMath); // random number generator

                        for(var i = 0; i < 6; i++){
                            randomNumber += "" + randomGen.integer(0, 9);
                        }
                        SMS.sendSMS(phoneNumber, "PostCash " + randomNumber, resolve3, reject3);
                    });
                }).
                then(function(){
                    smsWatcherTimer = setTimeout(function(){
                        SMS.stopWatch(function(){}, function(){});
                        document.removeEventListener('onSMSArrive');
                        $('#phone-verification-modal').get(0).hide(); // hide loader
                        rejectPromise("phone number verification failed"); // reject the promise i.e. verification failed
                    }, 31000);
                }).
                catch(function(){
                    try{
                        clearTimeout(smsWatcherTimer);
                    }
                    catch(err){}
                    SMS.stopWatch(function(){}, function(){});
                    document.removeEventListener('onSMSArrive');
                    $('#phone-verification-modal').get(0).hide(); // hide loader
                    reject("phone number verification failed");
                });
            });

            return phoneNumberVerifiedPromise;
        }
    }
};
