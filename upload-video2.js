var signinCallback = function (result){
    console.log(result.access_token);
    if(result.access_token) {
        var uploadVideo = new UploadVideo();
        uploadVideo.ready(result.access_token);
    }
};
var videoId = '';
var categoryId = 22;
var uploadStartTime = 0;
var UploadVideo = function() {
    this.tags = ['youtube-cors-upload'];
    console.log(this.tags);
};
UploadVideo.prototype.ready = function(accessToken) {
    //console.log(accessToken);
    console.log(this , ';');
    this.accessToken = accessToken;
    console.log(gapi);
    this.gapi = gapi;
    this.authenticated = true;
    this.gapi.client.request({
        path: '/youtube/v3/channels',
        params: {
            part: 'snippet',
            mine: true
        },
        callback: function(response) {
            console.log(response.items[0].snippet.title);
            if (response.error) {
                alert(response.error.message);
                console.log(response.error.message);
            } else {

                document.getElementById('channel-thumbnail').setAttribute('src' , response.items[0].snippet.thumbnails.default.url);
                document.getElementById('channel-name').innerHTML = "Channel Name: " + response.items[0].snippet.title;
                document.getElementById('signinButton').style.display = "none";
                document.getElementById('post-sign-in').style.display = "";

            }
        }
    });
    $('#button').on("click", this.handleUploadClicked.bind(this));

    //document.getElementById('button').setAttribute('onclick' , this.handleUploadClicked());
};
UploadVideo.prototype.uploadFile = function (file) {
    console.log(file);
    //console.log('uploadFile');
    var metadata = {
        snippet: {
            title: document.getElementById('title').value,
            description: document.getElementById('description').innerHTML,
            tags: this.tags,
            categoryId: categoryId
        },
        status: {
            privacyStatus: $('#privacy-status option:selected').text()
        }
    };
    var uploader = new MediaUploader({
        baseUrl: 'https://www.googleapis.com/upload/youtube/v3/videos',
        file: file,
        token: this.accessToken,
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
            uploadProgress.setAttribute('value' , bytesUploaded);
            uploadProgress.setAttribute('max' , totalBytes);
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
           this.pollForVideoStatus();
        }
    });
    uploadStartTime = Date.now();
    uploader.upload();
};

UploadVideo.prototype.handleUploadClicked = function () {
    console.log(this);
    console.log('handleUploadClicked');
    var file = document.getElementById('file');
    document.getElementById('button').setAttribute('disabled', true);
    //this.uploadFile(file.get(0).files[0]);
    this.uploadFile($('#file').get(0).files[0]);
    //this.uploadFile();
};

UploadVideo.prototype.pollForVideoStatus = function () {
    console.log('pollForVideoStatus');
    this.gapi.client.request({
        path: '/youtube/v3/videos',
        params: {
            part: 'status,player',
            id: videoId
        },
        callback: function (response) {
            if (response.error) {
                console.log(response.error.message);
                setTimeout(this.pollForVideoStatus(), STATUS_POLLING_INTERVAL_MILLIS);
            } else {
                var uploadStatus = response.items[0].status.uploadStatus;
                var ul = document.getElementById('post-upload-status');
                var li1 = document.createElement('li');
                var li2 = document.createElement('li');
                var li3 = document.createElement('li');
                switch (uploadStatus) {
                    // This is a non-final status, so we need to poll again.
                    case 'uploaded':
                        li1.innerHTML = uploadStatus;
                        ul.appendChild(li1);
                        //$('#post-upload-status').append('<li>Upload status: ' + uploadStatus + '</li>');
                        setTimeout(this.pollForVideoStatus(), STATUS_POLLING_INTERVAL_MILLIS);
                        break;
                    //// The video was successfully transcoded and is available.
                    //case 'processed':
                    //    $('#player').append(response.items[0].player.embedHtml);
                    //    $('#post-upload-status').append('<li>Final status.</li>');
                    //    break;
                    // All other statuses indicate a permanent transcoding failure.
                    //default:
                    //    $('#post-upload-status').append('<li>Transcoding failed.</li>');
                    //    break;
                }
            }
        }
    });
};
