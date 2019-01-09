// Define some variables used to remember state.
var playlistId, nextPageToken, prevPageToken;

// After the API loads, call a function to get the uploads playlist ID.
function handleAPILoaded() {
    requestUserUploadsPlaylistId();
}

// Call the Data API to retrieve the playlist ID that uniquely identifies the
// list of videos uploaded to the currently authenticated user's channel.
function requestUserUploadsPlaylistId() {
    // See https://developers.google.com/youtube/v3/docs/channels/list
    var request = gapi.client.youtube.channels.list({
        mine: true,
        part: 'contentDetails'
    });
    request.execute(function(response) {
        playlistId = response.result.items[0].contentDetails.relatedPlaylists.uploads;
        requestVideoPlaylist(playlistId);
    });
}

// Retrieve the list of videos in the specified playlist.
function requestVideoPlaylist(playlistId, pageToken) {
    document.getElementById('video-container').innerHTML = "";
    //$('#video-container').html('');
    var requestOptions = {
        playlistId: playlistId,
        part: 'snippet',
        maxResults: 10
    };
    if (pageToken) {
        requestOptions.pageToken = pageToken;
    }
    var request = gapi.client.youtube.playlistItems.list(requestOptions);
    request.execute(function(response) {
        nextPageToken = response.result.nextPageToken;
        var nextVis = nextPageToken ? 'visible' : 'hidden';
        //$('#next-button').css('visibility', nextVis);
        document.getElementById('next-button').style.visibility = nextVis;
        prevPageToken = response.result.prevPageToken;
        var prevVis = prevPageToken ? 'visible' : 'hidden';
        //$('#prev-button').css('visibility', prevVis);
        document.getElementById('prev-button').style.visibility = prevVis;
        var playlistItems = response.result.items;
        if (playlistItems) {
            playlistItems.forEach(function(item){
                    displayResult(item.snippet);
            });
        } else {
            document.getElementById('video-container').innerHTML = 'Sorry you have no uploaded videos';
            //$('#video-container').html('Sorry you have no uploaded videos');
        }
    });
}

var iframeDiv = document.getElementById('iframeDiv');
function displayResult(videoSnippet) {
    var title = videoSnippet.title;
    var videoId = videoSnippet.resourceId.videoId;
    var p = document.createElement('video-container');
    p.innerHTML = title + ' - ' + videoId;
    document.getElementById('video-container').appendChild(p);
    //$('#video-container').append('<p>' + title + ' - ' + videoId + '</p>');
    var iframe = document.createElement('iframe');
    iframe.style.width = '420px';
    iframe.style.height = '315px';
    iframe.setAttribute('src' , "https://www.youtube.com/embed/" + videoId + "? playlist=kZsxC1W6muQ&loop=1");
    iframeDiv.appendChild(iframe);
}

function nextPage() {
    iframeDiv.innerHTML = '';
    requestVideoPlaylist(playlistId, nextPageToken);
}

function previousPage() {
    iframeDiv.innerHTML = '';
    requestVideoPlaylist(playlistId, prevPageToken);
}