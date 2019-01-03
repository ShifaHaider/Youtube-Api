
var OAUTH2_CLIENT_ID = '452274135714-7jhgn54cstahpfjn6h13cfp8s70kdlun.apps.googleusercontent.com';
var OAUTH2_SCOPES = [
    'https://www.googleapis.com/auth/youtube'
];
googleApiClientReady = function() {
    gapi.auth.init(function() {
        window.setTimeout(checkAuth, 1);
    });
};
function checkAuth() {
    gapi.auth.authorize({
        client_id: OAUTH2_CLIENT_ID,
        scope: OAUTH2_SCOPES,
        //immediate: true
    }, handleAuthResult);
}
function handleAuthResult(authResult) {
    console.log(authResult);
    if (authResult && !authResult.error) {
        $('.pre-auth').hide();
        $('.post-auth').show();
        loadAPIClientInterfaces();
    } else {
        $('#login-link').click(function() {
            gapi.auth.authorize({
                client_id: OAUTH2_CLIENT_ID,
                scope: OAUTH2_SCOPES,
                immediate: false
            }, handleAuthResult);
        });
    }
}
function handleAPILoaded() {
    enableForm();
}

// Enable the form for creating a playlist.
function enableForm() {
    $('#playlist-button').attr('disabled', false);
}
function loadAPIClientInterfaces() {
    gapi.client.load('youtube', 'v3', function() {
        handleAPILoaded();
    });
}



