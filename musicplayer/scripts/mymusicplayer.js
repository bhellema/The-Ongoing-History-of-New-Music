	//A reference to the currently playing artist.  Used to request more info about the album from the web service...
	var currentArtistId = null;
	//A reference to an HTML5 audio player...
	var audioPlayer = null;
	//A reference to album data such as album name, release date, artist, etc.
	var playlistData = null;
	//A key/value map with artist Ids and their corresponding song file url...
	var songLocationMap = null;
	//A jquery object representing a refernce to the IPod's display screen (the IFrame).
	var $selectionDiv = null;
	
	$(document).ready(function() {
		//If it can be hiddlen, hide it at the start, before the application is "powered on" by the user....
		$(".hideable").hide();
		//Anything that is "startable" can be clicked and has the ability to "power on" the application...
		$(".startable").click(function(e) {
        	//If something that can start the application was clicked, the first thing we do is get the music catalogue
        	//from a web service (really just an Amazon S3 bucket in this exercise)...
        	getMasterPlaylistViaAjax();  
			$(".startable").unbind("click");
		});
		
		//The playWindow is the screen of the IPod, which is actually an IFrame.
		//Here we define the action upon an album being dropped into this IFrame...
		$("#playWindow").droppable({
			drop: function(event, ui) {
				
				var $songDiv = ui.draggable;
				
				//If an album was already playing, return it to the catalogue tray at the bottom of the UI.
				if (currentArtistId != null) {
					returnCurrentAlbumToTray();
				}
				//Drop the new album into the player...
				dropAlbumInIFrame($songDiv);
				//Log the new event...
				var artistId = $songDiv.attr("id");
				var songUrl = songLocationMap[artistId];
				console.log("Artist Id: " + artistId);
				console.log("Song URL: " + songUrl);
				
				//Start playing the new song, and call our web service to fetch an interesting factoid
				//about what is playing...
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
	* Plays the audio found at the given url.
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
			//incomingJsonAlbumInfo is the web service's json response to this request, if successful...
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
				//Once we have the music catalogue from the service, fire up the UI and reference data...
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
	
	/**
	 * Initialize the entire UI once the user has triggered an initial GET of album info.
	 * @method initInterface
	 * @param json {Object} a list of album information objects, such as urls of the album image, artists name.
	 */
	function initInterface(json) {
		//For each album in the catalogue given to use by the server, add it as a div to the bottom bar...
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
		//assign the IFrame's selection div to a global jquery variable so we have a reference to it...
		$selectionDiv = $("#playWindow").contents().find("#selection");
		//Make albums in the catalogue draggable by the user...
		makeAlbumsDraggable();
		//Make the catalogue visible to the user...
		showArtists();
		//enable the music player...
		turnOnIpod();
		//create a reference to the HTML5 audio player from the IFrame...
		audioPlayer = $("#playWindow").contents().find("#player")[0];
		

	}
	
	/**
	 * "Powers up" the IPod.  Makes the IFrame visible and enables controls.
	 */
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
	 */
	function showArtists() {
		$(".bottombar").animate({width:"show"}, "slow");	
	}
	
	/**
	 * Introduces the biography or "factoid" about the currently playing album into the UI's field of view with a grow effect.
	 * @method showAlbumBio
	 * @param bio {String} The text making up the information to be read by the user.
	 */
	function showAlbumBio(bio) {
		$("#albumInfoDiv").html(bio);
		$("#albumInfoDiv").show("scale", 400);
	}
	
	/**
	 * Shows the given text in the message area of the UI, ie, the top bar.  Uses a slide effect.
	 * @method showMessage
	 * @param newMessageString {String} the message to show.
	 */
	function showMessage(newMessageString) {
		$("#message").html(newMessageString);
		$("#message").show("slide",{direction: "right"},  500);
	}
	
	/**
	 * Makes any album div draggable by the user.
	 * @method makeAlbumsDraggable
	 */
	function makeAlbumsDraggable() {
		$(".albumDiv").draggable({iframeFix: true, revert: function (event, ui) { return !event; } } );
	}
