	var currentArtistId = null;
	var audioPlayer = null;
	var playlistData = null;
	var songLocationMap = null;
	var $selectionDiv = null;
	
	$(document).ready(function() {
		$(".hideable").hide();
		$(".startable").click(function(e) {
        	getMasterPlaylistViaAjax();  
			$(".startable").unbind("click");
		});
		
		$("#playWindow").droppable({
			drop: function(event, ui) {
				
				var $songDiv = ui.draggable;
				
				if (currentArtistId != null) {
					returnCurrentAlbumToTray();
				}
				dropAlbumInIFrame($songDiv);
				var artistId = $songDiv.attr("id");
				var songUrl = songLocationMap[artistId];
				console.log("Artist Id: " + artistId);
				console.log("Song URL: " + songUrl);
				
				playNewSong(songUrl);
				getAlbumInfoViaAjax(artistId);
				
			}
		
		});
		
	});
	
	/**
	* Initializes a key/value map of artist's names and their corresponding song file url.
	* @method initSongLocationMap
	* @param data {Object} The object representing a list of artists/urls
	*/
	function initSongLocationMap(jsonData) {
		songLocationMap = new Object();
		$.each(jsonData, function (i, item) {
			songLocationMap[item.artist] = item.url;
			console.log("Added song by " + item.artist + " Location: " + songLocationMap[item.artist]);
		});
	}
	
	/**
	* "powers up" the iPod's controls, and makes them available for user interaction.
	* @method enablePlayerControls
	*/
	function enablePlayerControls() {
		//Make the play/pause button visible...
		$(".playpause").fadeTo("slow", 0.0);
		//make the play/pause button clickable...
		$(".playpause").click(function(e) {
			if (audioPlayer.paused) {
				audioPlayer.play();
			} else {
				audioPlayer.pause();
			}
		});
	}
	
	/**
	* Once a new album has been selected, returns the currently selected album to the bottom catalogue 'tray'.
	* @method returnCurrentAlbumToTray
	*/
	function returnCurrentAlbumToTray() {
		//Add the current album back to the bottom...
		$(".bottombar").append("<div class='albumDiv' id=" + currentArtistId + " >" + $selectionDiv.html() + "</div>");
		//Make all albums draggable again, including the one that was loaded in the iPod...
		makeAlbumsDraggable();
		//remove the current album from the IFrame...
		$selectionDiv.children().remove(); 
	}
	
	/**
	* Once a user has selected an album and moved it to the iPod for playing, inject the album div's html into Iframe.
	* @method dropAlbumInIFrame
	* @param $newArtist {Jquery Object} the <div> of the album being chosen for playback
	*/
	function dropAlbumInIFrame($newArtist) {
		$selectionDiv.css("padding-left", "0");
		$selectionDiv.css("padding-top", "0");
		//inject the new album div's html into the IFrame called selectionDiv...
		var $selection = $selectionDiv.html($newArtist.html());
		//set the global currentArtistId to the new album div's id...
		currentArtistId = $newArtist.attr("id");
		//remove the selected album's div from the bottom catalogue tray...
		$newArtist.remove();	
	}

	/**
	* Plays the audio found at the incoming url.
	* @method playNewSong
	* @Param srcUrl {String} the url of an audio file
	*/
	function playNewSong(srcUrl) {
		console.log("playSong received: " + srcUrl);
		audioPlayer.src = srcUrl;
		audioPlayer.play();	
		
	}
	
	/**
	* Loads album info such as album name, release date, biography via a GET request.  Expects json returned.
	* @method getAlbumInfoViaAjax
	* @param artistId {String} The album div's id, used as a search param by the 'server'.  
	* An Amazon s3 bucket mimics a restful web service, with db backend.
	*/
	function getAlbumInfoViaAjax(artistId) {
		$.ajax({
  			url: "http://s3.amazonaws.com/clottonmusic/albuminfo/" + artistId,
			crossdomain: true,
			//incomingJsonAlbumInfo is the server's json response to this request, if successful...
  			success: function(incomingJsonAlbumInfo) {
				var albumData = incomingJsonAlbumInfo;
				console.log("Album Data Received : " + "album: " + albumData.album + " release date: " + albumData.date + " bio: " + albumData.bio);
				//update the UI with info about the newly playing album...
				showMessage(albumData.album + " by " + artistId + ", " + albumData.date);
				showAlbumBio(albumData.bio);
				
			},
			error: function(xhr, textStatus,errorThrown){
				showMessage("OOPS!  We couldn't get the album's info.");
				console.log("Ajax Error: " + textStatus + " Error Thrown: " + errorThrown);
			},
  			dataType: "json"
		});
	}
	
	/**
	* Once the iPod has been powered up, this method requests the full catalogue info from the 'server".
	* An Amazon s3 bucket is mimicing a restful web service, with db backend.
	* @method getMasterPlaylistViaAjax
	*/
	function getMasterPlaylistViaAjax() {
		$.ajax({
  			url: "http://s3.amazonaws.com/clottonmusic/playlists/masterplaylist",
			crossdomain: true,
  			success: function(incomingJsonPlaylist) {
				playlistData = incomingJsonPlaylist;
				initInterface(playlistData);
				initSongLocationMap(playlistData);
				showMessage("Albums loaded.  Ready to rock.");
			},
			error: function(xhr, textStatus,errorThrown){
				showMessage("OOPS!  We couldn't get the playlist.  Try again later.");
				console.log("Ajax Error: " + textStatus + " Error Thrown: " + errorThrown);
			},
  			dataType: "json"
		});
		
	}
	
	function initInterface(json) {
		$.each(json, function (i, item) {
			$("<image/>", {
				src: item.image,
				alt: item.song,
				class: "albumImage"
				}).appendTo($("<div/>", {
				class: "albumDiv",
				id: item.artist
			}).appendTo(".bottombar"));
		});
		$selectionDiv = $("#playWindow").contents().find("#selection");
		makeAlbumsDraggable();
		showArtists();
		turnOnIpod();
		audioPlayer = $("#playWindow").contents().find("#player")[0];
		

	}
	
	/**
	 * "Powers up" the IPod.  Makes the IFrame visible and enables controls.
	 * /
	function turnOnIpod() {
		$selectionDiv.css("font-family", "Trebuchet MS");
		$selectionDiv.css("font-size", "13px");
		$selectionDiv.css("padding-left", "5");
		$selectionDiv.css("padding-top", "10");
		$("#playWindow").fadeIn("slow", 0.0);
		enablePlayerControls();		
	}
	
	/**
	 * Introduces the catalogue of music into the UI's field of view by sliding it into place.
	 * @method showArtists
	 * /
	function showArtists() {
		$(".bottombar").animate({width:"show"}, "slow");	
	}
	
	/**
	 * Introduces the biography or "factoid" about the currently playing album into the UI's field of view with a grow effect.
	 * @method showAlbumBio
	 * @param bio {String} The text making up the information to be read by the user.
	 * /
	function showAlbumBio(bio) {
		$("#albumInfoDiv").html(bio);
		$("#albumInfoDiv").show("scale", 400);
	}
	
	/**
	 * Shows the given text in the message area of the UI, ie, the top bar.  Uses a slide effect.
	 * @method showMessage
	 * @param newMessageString {String} the message to show.
	 * /
	function showMessage(newMessageString) {
		$("#message").html(newMessageString);
		$("#message").show("slide",{direction: "right"},  500);
	}
	
	/**
	 * Makes any album div draggable by the user.
	 * @method makeAlbumsDraggable
	 * /
	function makeAlbumsDraggable() {
		$(".albumDiv").draggable({iframeFix: true, revert: function (event, ui) { return !event; } } );
	}
