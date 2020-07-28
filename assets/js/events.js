import helpers from './helpers.js';

window.addEventListener( 'load', () => {
    //When the chat icon is clicked
    document.querySelector( '#toggle-chat-pane' ).addEventListener( 'click', ( e ) => {
        let chatElem = document.querySelector( '#chat-pane' );
        let mainSecElem = document.querySelector( '#main-section' );

        if ( chatElem.classList.contains( 'chat-opened' ) ) {
            chatElem.setAttribute( 'hidden', true );
            mainSecElem.classList.remove( 'col-md-9' );
            mainSecElem.classList.add( 'col-md-12' );
            chatElem.classList.remove( 'chat-opened' );
        }

        else {
            chatElem.attributes.removeNamedItem( 'hidden' );
            mainSecElem.classList.remove( 'col-md-12' );
            mainSecElem.classList.add( 'col-md-9' );
            chatElem.classList.add( 'chat-opened' );
        }

        //remove the 'New' badge on chat icon (if any) once chat is opened.
        setTimeout( () => {
            if ( document.querySelector( '#chat-pane' ).classList.contains( 'chat-opened' ) ) {
                helpers.toggleChatNotificationBadge();
            }
        }, 300 );
    } );


    //When the video frame is clicked. This will enable picture-in-picture
    document.getElementById( 'local' ).addEventListener( 'click', () => {
      if ( !document.pictureInPictureElement ) {
            document.getElementById( 'local' ).requestPictureInPicture()
                .catch( error => {
                    // Video failed to enter Picture-in-Picture mode.
                    console.error( error );
                } );
        }

        else {
            document.exitPictureInPicture()
                .catch( error => {
                    // Video failed to leave Picture-in-Picture mode.
                    console.error( error );
                } );
        }
    } );


    //When the 'Create room" is button is clicked
    document.getElementById( 'create-room' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let roomName = document.querySelector( '#room-name' ).value;
        let yourName = document.querySelector( '#your-name' ).value;
        let checksession =document.querySelector ( '#checksession' ).value;
        if (checksession == 'true') {
          if ( roomName && yourName ) {
              //remove error message, if any
              document.querySelector( '#err-msg' ).innerHTML = "";

              //save the user's name in sessionStorage
              sessionStorage.setItem( 'username', yourName );

              //create room link
              let roomLink = `${ location.origin }/StartMeeting/?room=${ roomName.trim().replace( ' ', '_' ) }_${ helpers.generateRandomString() }&newroom=true`;
              window.location = roomLink;
              //show message with link to room
              //document.querySelector( '#room-created' ).innerHTML = `Room successfully created. Click <a href='${ roomLink }'>here</a> to enter room. Share the room link with your partners.`;

              //empty the values
              document.querySelector( '#room-name' ).value = '';
              document.querySelector( '#your-name' ).value = '';
          }

          else {
              document.querySelector( '#err-msg' ).innerHTML = "All fields are required";
          }
        }else{
          document.querySelector( '#err-msg' ).innerHTML = "Please login first to Start Meeting";
        }

    } );


    //When the 'Enter room' button is clicked.
   document.getElementById( 'enter-room' ).addEventListener( 'click', ( e ) => {
        e.preventDefault();

        let refroomname = document.querySelector( '#refroomname' ).value;
        let name = document.querySelector( '#username' ).value;

        if ( name ) {

            $.ajax({
                type: "POST",
                url: "/enterroom",
                data:{refroomname:refroomname,newusername:name},
                beforeSend: function(){
                  $("div#divLoading").addClass('show');
                },
                success: function(data){
                  console.log(data);
                  var StatusCode = data.status;
                  console.log(StatusCode);
                    if (StatusCode != "1") {
                      document.getElementById("snackbar").innerHTML= data.msg;
                      x.className = "show";
                      setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
                    }else{
                      //remove error message, if any
                      document.querySelector( '#err-msg-username' ).innerHTML = "";

                      //save the user's name in sessionStorage
                      sessionStorage.setItem( 'username', name );

                      $("#username-set").modal('hide');
                      //reload room
                      location.reload();
                    }
                  $("div#divLoading").removeClass('show');
                },
                error: function(){
                  alert("Error");
                }
            });
        }

        else {
            document.querySelector( '#err-msg-username' ).innerHTML = "Please input your name";
        }
    } );


    document.addEventListener( 'click', ( e ) => {
        if ( e.target && e.target.classList.contains( 'expand-remote-video' ) ) {
            helpers.maximiseStream( e );
        }

        else if ( e.target && e.target.classList.contains( 'mute-remote-mic' ) ) {
            helpers.singleStreamToggleMute( e );
        }
    } );


    document.getElementById( 'closeModal' ).addEventListener( 'click', () => {
        helpers.toggleModal( 'recording-options-modal', false );
    } );
} );
