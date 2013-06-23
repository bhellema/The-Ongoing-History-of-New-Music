The Ongoing History of New Music
=============

What is this?
-------------
It's an html5 music player with interesting info about each band/album you are listening to.

How do I use it?
----------------
* Drop the musicplayer folder into your favorite web server.  All resources like audio files, images, json data are hosted externally
in an Amazon S3 bucket.
* Click the iPod to power it on.  
* Drag an album into the iPod's display (an IFrame) to hear a song from that album.
* Pause/Play the song, or drop a new album into the player to send the old one back to the cataloge.
Enjoy.

How does it work?
-----------------
* A catalogue of music, along with album covers and factoids is hosted on an Amazon s3 bucket.  
* Once powered up, ajax calls fetch the album covers along with the url for the music file.  This allows the music catalogue to change dynamically
without altering your locally hosted music player.
* When an album is selected, the music player streams the song, and an ajax call fetches json data for the
interesting factoid about what you are listening to.

What browsers can I use?
-----------------------------
* Chrome
* Safari

What's the point of this?
-------------------------
* It's a developer exercise in JQuery, JavaScript, HTML5 audio streaming, Amazon Web Services, Amazon S3 Buckets, etc.
* It's an opportunity to flex developer muscle and a fantastic learning experience.

Is this awesome?
----------------
* Yep.

Who are you?
------------
* Chris Lotton
* chrislotton@gmail.com
