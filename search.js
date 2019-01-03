// After the API loads, call a function to enable the search box.
function handleAPILoaded() {
    $('#search-button').attr('disabled', false);
}

// Search for a specified string.
function search() {
    var q = $('#query').val();
    console.log(q);
    console.log('hello 1');

    var request = gapi.client.youtube.search.list({
        q: q,
        part: 'snippet'
    });

    request.execute(function(response) {
        console.log(response.result);
        var str = JSON.stringify(response.result);
        console.log(str);
        console.log('hello 2');
        $('#search-container').html('<pre>' + str + '</pre>');
    });
    data();
}
function data(){
    var div = document.getElementById('search-container');
    console.log(div.innerHTML);
}