
var signinCallback = function (result) {
    if (result.access_token) {
        ready(result.access_token);
    }
};
var STATUS_POLLING_INTERVAL_MILLIS = 60 * 1000;
var videoId = '';
var categoryId = 22;
var uploadStartTime = 0;
var tags = ['youtube-cors-upload'];
var accessToken;
var gapis;
var authenticated;
function ready(accessTokens) {
    accessToken = accessTokens;
    console.log(gapi);
    gapis = gapi;
    console.log('Hello');
    authenticated = true;
    gapis.client.request({
        path: '/youtube/v3/channels',
        params: {
            part: 'snippet',
            mine: true
        },
        callback: function (response) {
            if (response.error) {
                alert(response.error.message);
            } else {
                document.getElementById('channel-thumbnail').setAttribute('src', response.items[0].snippet.thumbnails.default.url);
                document.getElementById('channel-name').innerHTML = "Channel Name: " + response.items[0].snippet.title;
                document.getElementById('signinButton').style.display = "none";
                document.getElementById('post-sign-in').style.display = "";
            }
        }
    });
    console.log('Hello 2');
    $('#button').on("click", this.handleUploadClicked.bind(this));
    //document.getElementById('button').setAttribute('onclick', handleUploadClicked);
    //document.getElementById('button').onclick(handleUploadClicked);
    //var videoD = document.getElementById('videoContainer');
    //var video;
    //var recorder;
    //document.getElementById('btn-start-recording').addEventListener("click", function(){
    //    video = document.createElement('video');
    //    video.setAttribute('controls' , true);
    //    video.setAttribute('autoplay' , true);
    //    this.disabled = true;
    //    navigator.mediaDevices.getUserMedia({
    //        audio: true,
    //        video: true
    //    }).then(function(stream) {
    //        console.log(setSrcObject);
    //        setSrcObject(stream, video);
    //        videoD.appendChild(video);
    //        video.play();
    //        video.muted = true;
    //        recorder = new RecordRTCPromisesHandler(stream, {
    //            mimeType: 'video/webm',
    //            bitsPerSecond: 128000
    //        });
    //        recorder.startRecording().then(function() {
    //            console.info('Recording video ...');
    //        }).catch(function(error) {
    //            console.error('Cannot start video recording: ', error);
    //        });
    //        recorder.stream = stream;
    //        document.getElementById('btn-stop-recording').disabled = false;
    //    }).catch(function(error) {
    //        console.error("Cannot access media devices: ", error);
    //    });
    //}, false);
    //document.getElementById('btn-stop-recording').addEventListener("click", function(){
    //    this.disabled = true;
    //    recorder.stopRecording().then(function() {
    //        //a.href = URL.createObjectURL(videoBlob);
    //        //console.log(a.href);
    //        //a.download = URL.createObjectURL(videoBlob);
    //        //var a = document.getElementById('downloadVideo');
    //        var videoBlob = recorder.getBlob();
    //        console.info('stopRecording success');
    //        video.muted = false;
    //        video.setAttribute('src' , URL.createObjectURL(videoBlob));
    //        console.log(URL.createObjectURL(videoBlob));
    //        video.play();
    //        recorder.stream.stop();
    //        document.getElementById('btn-start-recording').disabled = false;
    //    }).catch(function(error) {
    //        console.error('stopRecording failure', error);
    //    });
    //}, false);

    console.log(document.getElementById('button'));
}
function uploadFile(file) {
    console.log('Hello');
    console.log(file);
    var selectBox = document.getElementById('privacy-status');
    var metadata = {
        snippet: {
            title: document.getElementById('title').value,
            description: document.getElementById('description').innerHTML,
            tags: tags,
            categoryId: categoryId
        },
        status: {
            privacyStatus: selectBox.value
        }
    };
    var uploader = new MediaUploader({
        baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
        file: file,
        token: accessToken,
        metadata: metadata,
        params: {
            part: Object.keys(metadata).join(',')
        },
        onError: function (data) {
            var message = data;
            try {
                var errorResponse = JSON.parse(data);
                message = errorResponse.error.message;
            } finally {
                alert(message);
            }
        },
        onProgress: function (data) {
            var currentTime = Date.now();
            var bytesUploaded = data.loaded;
            var totalBytes = data.total;
            var bytesPerSecond = bytesUploaded / ((currentTime - uploadStartTime) / 1000);
            var estimatedSecondsRemaining = (totalBytes - bytesUploaded) / bytesPerSecond;
            var percentageComplete = (bytesUploaded * 100) / totalBytes;
            var uploadProgress = document.getElementById("upload-progress");
            uploadProgress.setAttribute('value', bytesUploaded);
            uploadProgress.setAttribute('max', totalBytes);
            document.getElementById('percent-transferred').innerHTML = percentageComplete;
            document.getElementById('bytes-transferred').innerHTML = bytesUploaded;
            document.getElementById('total-bytes').innerHTML = totalBytes;
            document.getElementById('during-upload').style.display = "";
        },
        onComplete: function (data) {
            var uploadResponse = JSON.parse(data);
            videoId = uploadResponse.id;
            document.getElementById('video-id').innerHTML = videoId;
            document.getElementById('post-upload').style.display = "";
            pollForVideoStatus();
        }
    });
    uploadStartTime = Date.now();
    uploader.upload();
}

function handleUploadClicked() {
    //console.log('Hello');
    var file = document.getElementById('file');
    document.getElementById('button').setAttribute('disabled', true);
    console.log(file.files[0]);
    uploadFile(file.files[0]);
}

function pollForVideoStatus() {
    console.log('pollForVideoStatus');
    gapis.client.request({
        path: '/youtube/v3/videos',
        params: {
            part: 'status,player',
            id: videoId
        },
        callback: function (response) {
            if (response.error) {
                console.log(response.error.message);
                setTimeout(pollForVideoStatus, STATUS_POLLING_INTERVAL_MILLIS);
            } else {
                console.log(response);
                var uploadStatus = response.items[0].status.uploadStatus;
                switch (uploadStatus) {
                    // This is a non-final status, so we need to poll again.
                    case 'uploaded':
                        $('#post-upload-status').append('<li>Upload status: ' + uploadStatus + '</li>');
                        setTimeout(this.pollForVideoStatus.bind(this), STATUS_POLLING_INTERVAL_MILLIS);
                        break;
                    // The video was successfully transcoded and is available.
                    case 'processed':
                        $('#player').append(response.items[0].player.embedHtml);
                        $('#post-upload-status').append('<li>Final status.</li>');
                        break;
                    // All other statuses indicate a permanent transcoding failure.
                    default:
                        $('#post-upload-status').append('<li>Transcoding failed.</li>');
                        break;
                }
                //console.log(response);
                //console.log(response.items[0].status.uploadStatus);
                //var uploadStatus = response.items[0].status.uploadStatus;
                //var ul = document.getElementById('post-upload-status');
                //var li1 = document.createElement('li');
                //var li2 = document.createElement('li');
                //var li3 = document.createElement('li');
                //switch (uploadStatus) {
                //    case 'uploaded':
                //        li1.innerHTML = uploadStatus;
                //        ul.appendChild(li1);
                //        setTimeout(pollForVideoStatus, STATUS_POLLING_INTERVAL_MILLIS);
                //        break;
                //    case 'processed':
                //        var iframeArr = [];
                //        document.getElementById('player').appendChild(response.items[0].player.embedHtml);
                //        iframeArr.push(response.items[0].player.embedHtml);
                //        localStorage.setItem('iframeArr' , iframeArr);
                //        li2.innerHTML =  "Final status";
                //        ul.appendChild(li2);
                //        break;
                //    default:
                //        li3.innerHTML = "Transcoding failed";
                //        ul.appendChild(li3);
                //        break;
                //}
            }
        }
    });
}

