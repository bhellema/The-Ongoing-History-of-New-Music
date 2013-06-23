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
	
	function dropAlbumInIFrame($newArtist) {
		$selectionDiv.css("padding-left", "0");
		$selectionDiv.css("padding-top", "0");
		var $selection = $selectionDiv.html($newArtist.html());
		currentArtistId = $newArtist.attr("id");
		$newArtist.remove();	
	}

	function playNewSong(srcUrl) {
		console.log("playSong received: " + srcUrl);
		audioPlayer.src = srcUrl;
		audioPlayer.play();	
		
	}
	
	function getAlbumInfoViaAjax(artistId) {
		$.ajax({
  			url: "http://s3.amazonaws.com/clottonmusic/albuminfo/" + artistId,
			crossdomain: true,
  			success: function(incomingJsonAlbumInfo) {
				var albumData = incomingJsonAlbumInfo;
				console.log("Album Data Received : " + "album: " + albumData.album + " release date: " + albumData.date + " bio: " + albumData.bio);
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
	
	
	function turnOnIpod() {
		$selectionDiv.css("font-family", "Trebuchet MS");
		$selectionDiv.css("font-size", "13px");
		$selectionDiv.css("padding-left", "5");
		$selectionDiv.css("padding-top", "10");
		$("#playWindow").fadeIn("slow", 0.0);
		enablePlayerControls();		
	}
	
	function showArtists() {
		$(".bottombar").animate({width:"show"}, "slow");	
	}
	
	function showAlbumBio(bio) {
		$("#albumInfoDiv").html(bio);
		$("#albumInfoDiv").show("scale", 400);
	}
	
	function showMessage(newMessageString) {
		$("#message").html(newMessageString);
		$("#message").show("slide",{direction: "right"},  500);
	}
	function makeAlbumsDraggable() {
		$(".albumDiv").draggable({iframeFix: true, revert: function (event, ui) { return !event; } } );
	}
